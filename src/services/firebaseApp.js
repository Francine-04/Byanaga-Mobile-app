import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { createFirebaseAuth } from './createFirebaseAuth';

const googleServices = require('../../google-services.json');

const webOverridesByProject = {
  'byanaga-26574': {
    apiKey: 'AIzaSyDjtYLcv1njXlx4AXVXz7hrBQn9sefM3gk',
    appId: '1:874664242070:web:d8c4ac37ae7843b05dcbb7',
    measurementId: 'G-BQBDS3ZKHV',
  },
};

function createFirebaseConfig() {
  const projectInfo = googleServices.project_info || {};
  const client = googleServices.client?.[0] || {};
  const androidClientInfo = client.client_info || {};
  const androidApiKey = client.api_key?.[0]?.current_key;
  const projectId = projectInfo.project_id;
  const webOverrides = webOverridesByProject[projectId] || {};

  return {
    apiKey: webOverrides.apiKey || androidApiKey,
    authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
    databaseURL: projectInfo.firebase_url,
    projectId,
    storageBucket: projectInfo.storage_bucket,
    messagingSenderId: projectInfo.project_number,
    appId: webOverrides.appId || androidClientInfo.mobilesdk_app_id,
    measurementId: webOverrides.measurementId,
  };
}

export const firebaseConfig = createFirebaseConfig();
export const firebaseAndroidPackage =
  googleServices.client?.[0]?.client_info?.android_client_info?.package_name || null;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let firestoreDb;

try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const firebaseApp = app;
export const auth = createFirebaseAuth(app);
export const db = firestoreDb;
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);
export const firebaseProjectId = firebaseConfig.projectId;
