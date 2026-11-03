# Check-ins without Cloud Functions

> The traveler UI now uses automatic GPS visits. See [automatic-visits.md](automatic-visits.md)
> for the active flow and dashboard data contract. The manual data and rules below
> are retained for historical compatibility, not exposed as manual buttons in the new heatmap.

This implementation uses Firebase Authentication and Realtime Database only.
It does not require Cloud Functions, a scheduler, or a billing-plan upgrade.
Realtime Database's free-plan storage, bandwidth and connection limits still apply.

## Cause of the original failure

Inspection of project `byanaga-26574` found no `crowd` data and no deployed
`crowd` rules. The default deny rules rejected the listeners. With no place
configuration loaded, the button was disabled. Cloud Functions being disabled
was not the cause of the permission error.

## Structure and privacy

- `crowd/places/<place-key>`: administrator-managed enabled catalog; public read.
- `crowd/checkins/<uid>/<place-key>`: private latest check-in for each place.
- `crowd/history/<uid>/<day>/<place-key>/visitedAt`: private immutable daily receipt.
- `crowd/public/days/<day>/<place-key>`: public integer count only, no UIDs,
  emails, names, individual timestamps or tourist visit trails.

Place keys still use `encodeURIComponent(place.dashboardId || place.id)` with
periods replaced by `%2E`. Day keys are numeric Manila calendar days:
`floor((timestamp + 28800000) / 86400000)`. This keeps the original check-in and
history ownership paths; it adds day buckets under the previously empty public
branch. No users, itineraries, Firestore catalog documents or authentication
settings are changed.

`checkIn()` reads only the caller's daily receipt and submits an atomic update:
their latest check-in, a new receipt if needed, and `increment(1)` on that day's
public count. Rules validate both directions of this relationship. A count
cannot increase without a new private receipt for the caller; a receipt cannot
be created without the matching count increment and current check-in. Rules
validate server time, today's day key, enabled place, ownership and shape.
Receipts cannot be edited/deleted by clients to replay an increment. Same-day
renewal or checkout/re-check-in does not add another count. Concurrent tabs retry
once after reading the winning receipt. Other tourists can increment concurrently.

Check-ins are self-reported, not GPS-verified. Non-anonymous sign-in is required.
Rules cannot prove physical presence or stop someone creating multiple accounts.
Public totals reveal activity at a place/day (including low counts), but never
directly identify visitors. Strong anonymity against inference from outside
knowledge would require coarser/suppressed reporting and a different design.

## Expiry, history and heatmap limitations

- A personal check-in becomes inactive after exactly 48 hours using server-adjusted
  time while the screen is open. This is logical expiry, not scheduled deletion.
- Expired check-in records remain in Firebase until the owner checks out or renews
  that place. Nothing automatically runs when all apps are closed. At most one
  latest record per user/place is retained.
- History and daily counts remain after checkout or expiry. A user can check in
  at multiple places; checkout affects only the selected place.
- The map uses aggregate daily counts only. History sums all days. Recent visits
  sums **today and yesterday in Philippine time**, not a rolling 48-hour window.
  The same person visiting on both days contributes two daily visits.
- Colors retain green/yellow/red/orange and compare relative recorded activity.
  They are **not live occupancy or capacity percentages**. No capacities are invented.
- The map shows up to five recorded areas. With no visits it displays a clearly
  labelled demo preview, not fabricated recorded counts. Recent view never falls
  back to old historical activity as if it were recent.
- Heatmap calculation no longer consumes raw tourist `visitorRecords`. Existing
  unrelated dashboard subscriptions are not changed by this work.
- Daily counts are currently downloaded for all days. This is suitable for a small
  pilot; monitor free-plan bandwidth/storage. Larger deployments need pagination
  or a trusted rollup service, not exposing private records to all clients.
- Account deletion/privacy requests need an administrator-owned retention/deletion
  workflow for private history. Clients cannot erase deduplication receipts and
  then replay visits. Do not advertise an automated account-data purge yet.

## Setup and deployment

1. Compare live database rules with `database.rules.json`. Preserve every non-crowd
   rule. The setup script aborts if those rules differ.
2. Run the local emulator tests below. They do not contact production for test data.
3. Deploy **database rules only**:
   `npx firebase-tools deploy --only database --project byanaga-26574`
4. Run `node scripts/checkin-setup.cjs <firebase-tools-directory>` for a read-only
   catalog/rules inspection. Add `--enable-places` to add missing enabled entries
   from active dashboard destinations, approved businesses and the existing
   boundary-filtered Geoapify catalog. Existing entries are never overwritten.
   This uses the existing CLI login; no credentials are stored in the repository.
5. Refresh the app, sign in, and make a real check-in. Test with a second account.

`firebase.json` deliberately contains no Functions deployment configuration.
The old `functions/` code is retained as inactive reference only; **do not deploy
it** against this implementation. It uses different aggregate/expiry behavior.
No Hosting or app-store publishing is part of setup.

## Verification

```powershell
node --test tests/checkinActivity.test.cjs tests/heatmapData.test.cjs
npx firebase-tools emulators:exec --only database --project demo-byanaga-checkins --config firebase.emulators.json "node tests/checkinRules.emulator.cjs"
```

The emulator suite covers valid creation, owner reads, denied cross-user/guest
access, malformed/forged writes, disabled places, missing paired writes, duplicate
counts, deletion/replay attempts, renewal, multiple places, checkout, concurrent
tabs through the actual service, and preservation of profile/trip ownership.

References: [atomic increments](https://firebase.google.com/docs/database/web/read-and-write#atomic_server-side_increments)
and [cross-path rule validation](https://firebase.google.com/docs/database/security/rules-conditions).

## Applied and verified (2026-10-19)

- Deployed database rules only to `byanaga-26574`; read-back matches local rules.
- All non-crowd rules match the original deployed rules exactly. Backup:
  `.artifacts/firebase-rules-before-checkins-2026-10-19.json` (local, ignored by Git).
- Added 383 missing enabled catalog place IDs, without capacities or test visits.
- Emulator security/service tests passed, including same-user concurrent tabs.
- Six activity/heatmap unit tests passed; Expo web bundle returned HTTP 200.
- Full existing suite: 77 passed, 28 failed in unrelated auth/profile/trip/notice
  tests, mostly missing mocks. No claim that the full suite passes.
- No Cloud Functions enabled/deployed, no billing change, no app publishing.
- A real signed-in user check-in remains a manual acceptance step; no production
  tourist history was fabricated for testing.
