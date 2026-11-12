// Read-only by default. --apply adds GPS metadata and initial threshold settings.
// Uses the existing Firebase CLI login; never prints or stores credentials.
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createLoader } = require('../tests/helpers/load.cjs');
async function main() {
  const cliDir = process.argv[2];
  if (!cliDir) throw new Error('Pass the installed firebase-tools directory.');
  const auth = require(path.join(cliDir, 'lib/auth'));
  const api = require(path.join(cliDir, 'lib/apiv2'));
  const account = auth.getGlobalDefaultAccount();
  if (!account) throw new Error('Sign in with firebase login first.');
  auth.setRefreshToken(account.tokens.refresh_token);
  const token = await api.getAccessToken();
  const cfg = require('../google-services.json').project_info;
  if (cfg.project_id !== 'byanaga-26574') throw new Error('Unexpected Firebase project.');
  const request = async (url, options = {}) => {
    const result = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    if (!result.ok) throw new Error(`Firebase request failed: HTTP ${result.status}`);
    return result.json();
  };
  const base = cfg.firebase_url.replace(/\/$/, '');
  const liveRules = await request(`${base}/.settings/rules.json`);
  if (process.argv.includes('--rules-json')) { console.log(JSON.stringify(liveRules, null, 2)); return; }
  const local = JSON.parse(fs.readFileSync('database.rules.json', 'utf8'));
  if (process.argv.includes('--verify')) {
    assert.deepEqual(liveRules, local);
    console.log('Verified deployed rules match tested local rules.'); return;
  }
  // The only additions allowed in this task are these new crowd branches.
  const additions = ['consents', 'activityConfig', 'autoState', 'autoVisits', 'autoDays'];
  const strip = (doc) => { const copy = structuredClone(doc); additions.forEach((key) => delete copy.rules.crowd[key]); return copy; };
  assert.deepEqual(strip(liveRules), strip(local), 'Existing auth, trip and manual check-in rules must remain unchanged.');
  console.log('Verified: all existing rules preserved.');
  const existing = await request(`${base}/crowd/places.json`) || {};
  if (fs.existsSync('.env')) process.loadEnvFile('.env');
  const loader = createLoader({ '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {} } }, { process, fetch, Map });
  const { isCoordinateInsideNagaCity } = loader('src/utils/nagaBoundary.js');
  const { tourismCategory, distanceMeters } = loader('src/utils/automaticVisits.js');
  const candidates = [];
  const normalize = (name) => String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const number = (v) => v == null || v === '' || typeof v === 'boolean' ? NaN : Number(v);
  const categoryFor = (raw) => {
    const direct = tourismCategory(raw); if (direct) return direct;
    const text = String(raw || '').toLowerCase();
    if (/religio|church/.test(text)) return 'Church';
    if (/nature|park/.test(text)) return 'Nature';
    if (/food|restaurant/.test(text)) return 'Food';
    if (/shop|mall/.test(text)) return 'Shopping';
    if (/historic|heritage|landmark/.test(text)) return 'Historical';
    if (/culture|museum|attraction/.test(text)) return 'Culture';
    if (/accommodation|hotel|resort|hostel/.test(text)) return 'Accommodation';
    return null;
  };
  for (const [collection, field, value] of [['destinations', 'isActive', true], ['business_profiles', 'status', 'approved'], ['accommodations', 'isActive', true]]) {
    const fields = ['name', 'businessName', 'latitude', 'longitude', 'lat', 'lng', 'locationLat', 'locationLng', 'category'];
    const body = { structuredQuery: { from: [{ collectionId: collection }], select: { fields: fields.map((fieldPath) => ({ fieldPath })) }, where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: typeof value === 'boolean' ? { booleanValue: value } : { stringValue: value } } } } };
    const result = await request(`https://firestore.googleapis.com/v1/projects/${cfg.project_id}/databases/(default)/documents:runQuery`, { method: 'POST', body: JSON.stringify(body) });
    for (const { document } of result) {
      if (!document) continue;
      const fields = Object.fromEntries(Object.entries(document.fields || {}).map(([key, v]) => [key, v.stringValue ?? v.doubleValue ?? v.integerValue]));
      const id = document.name.split('/').pop();
      candidates.push({ id, source: collection, name: fields.name || fields.businessName, latitude: number(fields.latitude ?? fields.locationLat ?? fields.lat), longitude: number(fields.longitude ?? fields.locationLng ?? fields.lng), category: collection === 'accommodations' ? 'Accommodation' : categoryFor(fields.category) });
    }
  }
  const geo = await loader('src/services/geoapifyPlacesService.js').fetchGeoapifyPlaces();
  // Keep registered Firestore IDs when a unique exact-name provider record can
  // supply real coordinates. Never substitute approximate barangay centroids.
  for (const p of candidates) {
    if (Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) continue;
    const matches = geo.filter((g) => normalize(g.name) === normalize(p.name));
    if (matches.length === 1) { p.latitude = matches[0].latitude; p.longitude = matches[0].longitude; p.category ||= categoryFor(matches[0].category); }
  }
  candidates.push(...geo.map((p) => ({ ...p, category: categoryFor(p.category) })));
  const chosen = [], patches = {}, categories = {}, invalid = [];
  for (const p of candidates) {
    if (!p.name || !p.category || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) || !isCoordinateInsideNagaCity(p.latitude, p.longitude)) { invalid.push(p.id); continue; }
    const key = encodeURIComponent(p.id).replace(/\./g, '%2E');
    const old = existing[key];
    if (old?.enabled === false || old?.automaticEnabled === false) continue;
    // Preserve canonical Firestore IDs. Duplicate provider records remain available
    // for browsing but are not separate automatic arrival targets.
    if (chosen.some((other) => normalize(other.name) === normalize(p.name) && distanceMeters(other, p) < 150)) continue;
    chosen.push(p);
    const metadata = { name: p.name, category: p.category, latitude: p.latitude, longitude: p.longitude, radius: 70, source: p.source || 'geoapify', sourceDestinationId: p.id, automaticEnabled: true };
    if (!old) metadata.enabled = true;
    for (const [field, value] of Object.entries(metadata)) if (old?.[field] == null) patches[`places/${key}/${field}`] = value;
    categories[p.category] = (categories[p.category] || 0) + 1;
  }
  const thresholds = await request(`${base}/crowd/activityConfig.json`);
  if (!thresholds) patches.activityConfig = { moderate: 5, busy: 15, crowded: 30 };
  console.log(JSON.stringify({ eligiblePlaces: chosen.length, categories, skippedMissingCoordinatesOrCategory: invalid.length, metadataFieldsToAdd: Object.keys(patches).length }));
  if (process.argv.includes('--apply')) {
    if (Object.keys(patches).length) await request(`${base}/crowd.json`, { method: 'PATCH', body: JSON.stringify(patches) });
    console.log('Added GPS metadata and missing thresholds only. Existing visit records and configured values were preserved.');
  } else console.log('Read-only preview: no Firebase data changed.');
}
main().catch((e) => { console.error(e.message); process.exitCode = 1; });
