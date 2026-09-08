const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
require('@expo/env').loadProjectEnv(root, { silent: true, mode: 'production' });
const app = require('../app.json').expo;
const pkg = require('../package.json');
const profiles = require('../eas.json').build;
const google = require('../google-services.json');
const problems = [];
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
if (!token?.startsWith('pk.')) problems.push('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN must be a public Mapbox token in the selected EAS environment (or local .env).');
for (const plugin of ['@rnmapbox/maps', '@react-native-community/datetimepicker', 'expo-image-picker']) {
  if (!app.plugins.some((entry) => (Array.isArray(entry) ? entry[0] : entry) === plugin)) problems.push(`Missing native plugin: ${plugin}`);
  if (!pkg.dependencies[plugin]) problems.push(`Missing dependency: ${plugin}`);
}
if (!pkg.dependencies['@react-native-async-storage/async-storage']) problems.push('Firebase native persistence requires AsyncStorage.');
if (!google.project_info?.firebase_url || !google.project_info?.storage_bucket) problems.push('google-services.json must include the existing Realtime Database URL and Storage bucket.');
if (google.client?.[0]?.client_info?.android_client_info?.package_name !== app.android.package) problems.push('Android package does not match google-services.json.');
for (const name of ['development', 'preview', 'production']) {
  if (profiles[name]?.environment !== name) problems.push(`EAS ${name} must select its matching environment.`);
}
for (const file of ['index.js', 'App.js', 'src/data/naga-city-boundary.geojson']) {
  if (!fs.existsSync(path.join(root, file))) problems.push(`Missing source file: ${file}`);
}
if (problems.length) {
  console.error('Build configuration failed:\n' + problems.map((message) => `- ${message}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS build configuration: Mapbox token present, Firebase config, native plugins and EAS environments. No credential values printed.');
}
for (const key of ['EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'EXPO_PUBLIC_FACEBOOK_APP_ID']) {
  if (!process.env[key]?.trim()) console.warn(`Not configured: ${key}. Its native social sign-in will be unavailable.`);
}
