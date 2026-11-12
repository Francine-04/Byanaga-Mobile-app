# Automatic GPS visits — traveler mobile and web

## Scope and consent

Firebase Authentication and Realtime Database only. No Supabase, Cloud Functions,
billing changes, background location authorization, or dashboard UI is required.
The separate officer/admin application can read the aggregate contract below.

The existing `LocationPermission` onboarding screen now requests actual foreground
OS/browser authorization and explains private visit recording. Previously it only
saved a profile flag. Its Allow button explicitly opts in; Skip opts out.
Consent is stored per authenticated UID at `crowd/consents/<uid>`, version 1.
Existing `locationPermission: allowed` and general anonymous-usage preferences
are **not** interpreted as consent to this new feature. Existing users can review
the same location screen from Data Sharing settings or the heatmap status link.
No second permission interface was added.

The application verifies permission before starting GPS, before processing a fix,
on browser permission changes, and periodically while active. Recording stops
on sign-out, opt-out, hidden web tab/app background, missing permission, or known
offline status. Revoking consent also denies arrivals in database rules. Turning
off the switch pauses this device immediately, even if saving that preference fails.

## Detection

- Only administrator-enabled `crowd/places` records with `automaticEnabled: true`,
  real coordinates within Naga's polygon, and one of seven supported categories
  are candidates. Categories: Nature, Church, Culture, Historical, Food, Shopping,
  Accommodation. Restaurant maps to Food; event venues are excluded.
- Default entry radius: 70 metres, configurable per registered place (30–150m).
  Accuracy must be 25m or better and the entire accuracy circle must fit inside.
- At least three distinct, fresh readings spanning ten seconds confirm arrival.
  This is GPS confirmation, **not a two-hour minimum stay**.
- Cached/old fixes, future timestamps, reported mock locations, excessive speed,
  impossible jumps, invalid coordinates, long gaps, and ambiguous overlapping
  geofences do not confirm visits. Raw GPS coordinates are never uploaded.
- Departure requires three consistent fixes spanning ten seconds confidently
  beyond the radius plus a 40m hysteresis margin. Only a confirmed subsequent
  arrival records another visit, including returns on the same day.
- Private server state survives reloads. Remaining at a place or restarting the
  app while still inside does not create another visit. Multiple tabs use the
  same state and server sequence checks.
- Location fixes are not queued for later replay. Rules reject transitions whose
  observation time is more than 30 seconds old, including delayed offline writes.

## Shared database contract

All keys below are under `crowd`:

| Path | Read access | Purpose |
| --- | --- | --- |
| `places/<placeKey>` | Public | Name, category, coordinates, radius, source, sourceDestinationId, enabled flags |
| `activityConfig` | Public | Absolute count thresholds: moderate, busy, crowded |
| `autoDays/<ManilaDay>/<placeKey>` | Public | Integer recorded visit count; no tourist identifiers |
| `consents/<uid>` | Owner only | Explicit automatic-recording choice and consent version |
| `autoState/<uid>/<placeKey>` | Owner only | Last inside/outside phase, sequence, eventDay, timestamps |
| `autoVisits/<uid>/<placeKey>/<sequence>` | Owner only | Immutable visitorId, destinationId, visitDay and timestamp |

`placeKey = encodeURIComponent(sourceDestinationId).replace(/\./g, '%2E')`.
Existing Firestore destination IDs are preserved when real coordinates are
available directly or through a unique exact-name Geoapify match. Provider-only
IDs retain their `geoapify-` prefix. Missing coordinates are not guessed from
barangay centres. The setup script prioritizes the registered catalog and skips
same-name nearby provider duplicates; overlapping distinct venues are handled
conservatively by the detector.

`ManilaDay = floor((timestampMilliseconds + 28800000) / 86400000)`.
Convert a day key to its civil date with
`new Date(Number(dayKey) * 86400000).toISOString().slice(0, 10)`.
Visit timestamps are server milliseconds. `destinationId` in an automatic visit
is the canonical placeKey; `visitorId` is the authenticated Firebase UID.

Arrival is a single atomic write of the private state transition, immutable visit,
and public `increment(1)`. Rules enforce ownership, explicit consent, registered
place enablement, current day, fresh timestamps, sequence increment, phase change,
and both directions of the aggregate/private-record relationship. Deleting state
to replay an arrival, editing a receipt, or independently increasing a count is
denied. Departure only changes private state; it does not erase the visit.

## Separate dashboard integration (no dashboard files changed)

Use Firebase's `onValue` on a date-bounded query of `crowd/autoDays`, ordered by
key with `startAt(fromDay)` and `endAt(toDay)`. Sum the returned integers by
placeKey and join with `crowd/places`. Filter the joined rows by category and
activity level. Read `crowd/activityConfig` for threshold updates. Do not read
`autoVisits`, `autoState`, users, or other tourists' records in dashboard clients.

Initial configurable thresholds are Moderate >= 5, Busy >= 15, Crowded >= 30
recorded visits in the selected period; below 5 is Low. These are pilot settings,
not validated occupancy thresholds. Administrators can change `activityConfig`
through trusted tools; ordinary clients cannot change thresholds or the catalog.
Colors: Low green, Moderate yellow, Busy orange, Crowded red.

Always label this **recorded visitor activity, not verified real-time occupancy**.
Counts are visits, not distinct tourists: one tourist returning after departure
can contribute more than once. Zero recorded visits does not prove an empty venue.
No activity is invented for unrated places. Current traveler date filters allow
up to 366 days per query to limit bandwidth. Manual historical daily counts remain
at `crowd/public/days` and are not mixed into automatic GPS totals.

## Limitations and operations

- Foreground only: closed apps and hidden tabs do not record visits. If someone
  leaves and returns while tracking is paused, that departure cannot be verified;
  the retained inside state conservatively avoids counting another arrival.
- Browser geolocation requires HTTPS or localhost, and browsers may block it in
  embedded frames. Browsers without permission-query support require review through
  the existing permission flow after the watcher has stopped; they are not silently
  prompted again. Native builds must be rebuilt to include `expo-location`.
- GPS geofences are an approximation. Indoors, dense/overlapping venues, inaccurate
  catalog points, poor fixes, or brief passes may be missed. Tune and field-test
  destination coordinates/radii before public rollout. No real-device field test
  has been completed by the automated tests.
- Client GPS is not tamper-proof. Rules protect ownership and aggregate consistency,
  not physical-presence truth. A modified client or multiple accounts can fabricate
  valid-looking arrivals/departures. Trusted verification/abuse mitigation would
  require additional design; do not describe these counts as verified occupancy.
- Public daily totals contain no IDs or movement trails, but very small counts
  can still permit inference using outside information. Strong anonymity would
  require suppression/coarser reporting beyond this implementation.
- Visits do not expire or auto-delete. Account-data deletion/retention requests
  require an administrator workflow; clients cannot delete deduplication state
  and replay visits. Free-plan storage, downloads and connection limits apply.
- No scheduled server process runs. Old `functions/` code remains inactive and
  must not be deployed against this automatic-visit protocol.

## Tests and setup

```powershell
node --test tests/automaticVisits.test.cjs tests/checkinActivity.test.cjs
npx firebase-tools emulators:exec --only database --project demo-byanaga-checkins --config firebase.emulators.json "node tests/automaticVisitRules.emulator.cjs"
```

The existing `tests/checkinRules.emulator.cjs` also passes against the additive
rules, preserving manual history and user/trip ownership. Emulator tests use a
demo project only and create no production tourist records.

`scripts/automatic-visits-setup.cjs <firebase-tools-directory>` previews catalog
metadata and verifies all old rules remain unchanged. `--apply` adds only missing
GPS metadata and initial thresholds. `--verify` compares deployed rules with the
tested local rules. Rules deployment is explicitly `--only database`.
Pre-change rules backup: `.artifacts/firebase-rules-before-auto-visits-2026-10-25.json`.

After deployment, refresh the web app. Use the existing location screen to consent,
then test arrival, remaining in place, departure/return, opt-out, permission
revocation, foreground/background and a second account on real devices.

## Verification recorded on 2026-10-25

- Deployed database rules only; read-back matches the tested file. All pre-existing
  user, itinerary and manual-history rules were preserved.
- Added missing metadata for 338 automatic destinations spanning all seven categories.
  28 candidate catalog records were skipped for missing coordinates/category or
  being outside the supported scope; additional duplicates were not separate targets.
- Confirmed public aggregate/config reads succeed and unauthenticated reads of
  automatic visits, detection state and consent are denied.
- Eight automatic GPS/permission/classification unit tests and three existing
  date/history tests passed. Both automatic and legacy Firebase emulator security
  suites passed, including concurrent-tab deduplication and cancellation before save.
- Web bundle returned HTTP 200; Android JavaScript/Hermes export succeeded.
  This is not an installed Android binary or a real-device GPS field test.
- No production test visits were created. No Cloud Functions, billing, Hosting,
  dashboard UI, or app-store changes were made. Full unrelated app test-suite
  failures documented previously were not repaired as part of this task.
