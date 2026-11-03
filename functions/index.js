const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { onValueWritten } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { aggregateCrowd, recordVisit } = require('./crowd');
initializeApp();
// A single transaction prevents concurrent check-in/expiry jobs publishing stale counts.
const refresh = () => getDatabase().ref('crowd').transaction((state) => aggregateCrowd(state, Date.now()));
exports.refreshCrowdCheckins = onValueWritten('/crowd/checkins/{uid}', (event) =>
  getDatabase().ref('crowd').transaction((state) => {
    // Preserve both sides: checkout or rapid place-switching must not lose a visit.
    for (const value of [event.data.before.val(), event.data.after.val()]) {
      if (!value) continue;
      for (const checkin of typeof value.placeId === 'string' ? [value] : Object.values(value)) {
        recordVisit(state, event.params.uid, checkin);
      }
    }
    return aggregateCrowd(state, Date.now());
  }));
exports.refreshCrowdPlaces = onValueWritten('/crowd/places/{placeId}', refresh);
exports.expireCrowdCheckins = onSchedule('every 1 minutes', refresh);
