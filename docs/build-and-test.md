# Building BYANAGA with connected features

Build from the `Mobile App-Thesis` root. `App.js`, `index.js`, `src/`, assets,
`package.json`, the lockfile and Expo configuration are the source of truth.
Do not copy generated `.expo-output*` bundles back into `src/`, and do not
commit `.env`, `node_modules`, native generated directories or build output.

## Before building

```powershell
npm ci
npm test
npm run check:build
npx expo-doctor
```

The build check also runs during EAS post-install. It checks the public Mapbox
token, Firebase project configuration, native plugins and selected EAS environment.
It does not print credential values or verify provider authorization.

Local Metro uses `.env`. Cloud builds use the environment selected in `eas.json`:
`development`, `preview` or `production`. Configure the existing values in each
environment used for builds:

- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`: public `pk.` token, with permissions and
  restrictions appropriate for the built app. Public client tokens are embedded
  in the application; never put a secret `sk.` token here.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- `EXPO_PUBLIC_FACEBOOK_APP_ID`.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` when required by your OAuth setup. Web login
  currently uses the existing Firebase provider popup.

Changing local `.env` does not change an already installed app or cloud environment.
See [Expo build environment guidance](https://docs.expo.dev/eas/environment-variables/usage/).

## Installable Android test build

```powershell
npm run build:android:preview
```

Install the new preview APK. This build runs without Metro. A production profile
normally produces an AAB for the Play Store, not a directly installable APK.

For development with Fast Refresh:

```powershell
npm run build:android:dev
npm run start:dev-client -- --clear
```

Mapbox and native pickers need the matching native binary. Expo Go cannot load
Mapbox. An old development client must be rebuilt when native dependencies or
plugins change. Fast Refresh is a development feature, not a release feature.

For web: `npm run web -- --port 8090`. The optional `npm run test:ui` script uses
Playwright/Chromium via `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` or the existing local
test installation. It never sends reset emails, registers accounts or writes
production user data.

## Existing backend

There is one Firebase configuration: `src/services/firebaseApp.js`.

- Firebase Authentication owns passwords and provider identities.
- Realtime Database `users/{uid}` holds profile/photo URLs, preferences,
  bookmarks, notification read state, location choice and onboarding completion.
- Realtime Database `itineraries/{id}` holds `userId`, `tripName`, `travelDate`,
  `status`, timestamps and `days/dayN/places/{entryId}`. Days and stops have
  explicit order. Each stop keeps its existing backend place ID, coordinates,
  `visitTime` (`HH:mm`) and `displayTime` (`h:mm AM/PM`). Edits reuse the trip ID.
- Firebase Storage `users/{uid}/photos/` stores validated JPG/PNG uploads.
- Existing Firestore collections supply published destinations, events,
  approved `business_profiles`, accommodations, vouchers, menus and galleries.

The local `database.rules.json` and `storage.rules` must match deployed rules.
Changing these files does not deploy them. Keep owner-only user/trip access;
do not open the entire database to fix permission errors. No rules were deployed
by this repair. See [social sign-in permissions](social-sign-in-permissions.md).

## What to verify on a phone

1. Register or sign in with your own test account. First-time setup should proceed
   through blank preferences and location consent; remembered completed accounts
   should restore. Guest entry goes directly to the dashboard, with save actions
   redirecting to login.
2. Change preferences, create a smart trip, pick its date/time, save, reopen,
   rename, remove a stop and save again. Close/reopen the app and confirm the same
   record and ordering remain. The generator uses published Naga places, saved
   interests, operating hours where supplied, and fresh weather for today's trip.
   Its route ordering is a nearest-stop heuristic, not a driving-time guarantee.
3. Choose a JPG/PNG avatar and cover in Edit Profile. Selection previews locally;
   Save Changes uploads both photos concurrently and commits the full profile to
   `users/{uid}` once. Wait for the return to Profile, then sign out/in to verify
   the name, phone, bio, nationality and both photos. Failed saves keep the draft
   on screen for retry and never report success before database acknowledgement.
4. Request a reset for an account you own. Firebase sends a secure email link,
   not a six-digit code. Complete the Firebase reset page, or paste the complete
   link into BYANAGA's reset flow. Confirm the new password signs in.
5. Publish an event/voucher in the officer/establishment website and verify the
   app's feed. These are in-app subscriptions/reminders, not OS push notifications
   while the application is closed.

Weather uses [Open-Meteo's model-based current data](https://open-meteo.com/en/docs)
for Naga City, Camarines Sur (13.624, 123.185), not a guaranteed street-level
observation. Requests use Asia/Manila, Celsius, km/h, land cells and best-match
models. They refresh every 10 minutes, on app resume or manually; overlapping
refreshes share one request. Readings older than 90 minutes are rejected.
Failed refreshes retain the last reading with a warning. The provider and reading
timestamp are not displayed in the weather card.
Heatmap intensity represents encoded backend visit patterns, not live GPS counts.
The location screen currently saves consent; it does not collect GPS positions.

Mapbox renders the map. The BYANAGA catalog/backend supplies category POIs.
Mapbox Geocoding v6 supplies addresses only; address results use permanent
geocoding because selected locations can be saved. Permanent geocoding requires
appropriate Mapbox account access and may incur charges. If it is unavailable,
an explicit error appears and backend places remain searchable. Do not switch to
temporary results and persist them. See [Mapbox Geocoding](https://docs.mapbox.com/api/search/geocoding/).

All locations are checked against the existing Naga boundary before itinerary
writes. Smart generation never invents stops when the backend has no eligible
places. Live account write permissions, actual email delivery and native provider
login still need the phone/account checks above; mocked service tests and an
Android JS export cannot certify them.
