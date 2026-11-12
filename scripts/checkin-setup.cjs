// Administrative setup using the existing Firebase CLI login. Never logs credentials.
// Usage: node scripts/checkin-setup.cjs <firebase-tools-directory> [--enable-places]
// Default is read-only. Only --enable-places writes missing crowd/places entries.
const path = require('node:path');
const fs = require('node:fs');
const { createLoader } = require('../tests/helpers/load.cjs');

async function main() {
  const cliDir = process.argv[2];
  if (!cliDir) throw new Error('Pass the installed firebase-tools directory.');
  const auth = require(path.join(cliDir, 'lib/auth'));
  const api = require(path.join(cliDir, 'lib/apiv2'));
  const account = auth.getGlobalDefaultAccount();
  if (!account) throw new Error('Run firebase login first.');
  auth.setRefreshToken(account.tokens.refresh_token);
  const token = await api.getAccessToken();
  const config = require('../google-services.json').project_info;
  if (config.project_id !== 'byanaga-26574') throw new Error('Unexpected project; review setup before proceeding.');
  const request = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error(`Firebase request failed (HTTP ${response.status})`);
    return response.json();
  };
  const db = config.firebase_url.replace(/\/$/, '');
  const deployed = await request(`${db}/.settings/rules.json`);
  const local = JSON.parse(fs.readFileSync('database.rules.json', 'utf8'));
  const withoutCrowd = ({ crowd, ...rules }) => rules;
  if (JSON.stringify(withoutCrowd(deployed.rules)) !== JSON.stringify(withoutCrowd(local.rules))) {
    throw new Error('Non-crowd rules differ from production. Stop and merge before deployment.');
  }
  console.log('Verified: all non-crowd rules match production exactly.');
  if (process.argv.includes('--verify-rules')) {
    if (JSON.stringify(deployed) !== JSON.stringify(local)) throw new Error('Deployed crowd rules do not match the tested local rules.');
    console.log('Verified: deployed rules match the tested local rules exactly.');
    return;
  }
  const structure = await request(`${db}/crowd.json?shallow=true`);
  console.log('Crowd branches:', Object.keys(structure || {}).join(', ') || '(empty)');
  const current = await request(`${db}/crowd/places.json`) || {};
  const candidates = new Map();
  // Read only public catalog fields, never profiles, users, itineraries or tourists.
  for (const [collection, field, expected] of [['destinations', 'isActive', true], ['business_profiles', 'status', 'approved']]) {
    const query = { structuredQuery: {
      from: [{ collectionId: collection }],
      select: { fields: ['name', 'businessName'].map((fieldPath) => ({ fieldPath })) },
      where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: typeof expected === 'boolean' ? { booleanValue: expected } : { stringValue: expected } } },
    } };
    const result = await request(`https://firestore.googleapis.com/v1/projects/${config.project_id}/databases/(default)/documents:runQuery`, { method: 'POST', body: JSON.stringify(query) });
    for (const { document } of result) {
      if (!document) continue;
      const id = document.name.split('/').pop();
      const name = document.fields?.name?.stringValue || document.fields?.businessName?.stringValue;
      if (name) candidates.set(encodeURIComponent(id).replace(/\./g, '%2E'), { enabled: true, name, source: collection });
    }
  }
  if (fs.existsSync('.env')) process.loadEnvFile('.env');
  const loader = createLoader({ '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {} } }, { process, fetch, Map });
  const { fetchGeoapifyPlaces } = loader('src/services/geoapifyPlacesService.js');
  const geoPlaces = await fetchGeoapifyPlaces();
  for (const place of geoPlaces) candidates.set(encodeURIComponent(place.id).replace(/\./g, '%2E'), { enabled: true, name: place.name, source: 'geoapify' });
  const missing = Object.fromEntries([...candidates].filter(([key]) => !Object.hasOwn(current, key)));
  console.log(`Verified catalog: ${candidates.size} place IDs; ${Object.keys(missing).length} missing configurations. No capacities invented.`);
  if (process.argv.includes('--enable-places') && Object.keys(missing).length) {
    await request(`${db}/crowd/places.json`, { method: 'PATCH', body: JSON.stringify(missing) });
    console.log(`Enabled ${Object.keys(missing).length} missing places. Existing configurations preserved.`);
  } else console.log('Read-only inspection complete; no database data changed.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
