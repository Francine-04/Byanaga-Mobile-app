# Social Sign-In Database Access

Google and Facebook authenticate through the existing Firebase Auth instance.
The app then reads `users/{uid}` in Realtime Database, creates a missing traveler
profile or updates the existing profile, and reads the saved record before
opening LocationPermission. Allow Location or Skip then opens Main.

Firebase project: `byanaga-26574`
Database: `byanaga-26574-default-rtdb` (asia-southeast1)

A permission-denied error after provider authentication is not a location
permission error. The deployed Realtime Database rules must authorize the
authenticated UID to read and save its traveler profile, including when that
profile does not exist yet. Do not require an existing profile or an
email/password provider before allowing that first read or creation.

In Firebase Console, open Realtime Database > Rules (not Firestore Rules).
Inspect the existing rules at `users/$uid`, and use Rules Playground to test:

- An authenticated user reading their own missing profile: allowed.
- An authenticated user creating their own traveler profile: allowed.
- The same user updating their existing profile: allowed.
- Another UID reading or writing that profile: denied.
- An unauthenticated user reading or writing that profile: denied.

The ownership condition for profile reads and writes is:

```text
auth != null && auth.uid === $uid
```

Merge that condition into the existing rules, preserving unrelated paths,
validation and protections for privileged fields such as roles. Do not replace
the full ruleset or grant public database access. Check any parent rules and
validation rules too. App Check enforcement can also deny unverified clients.

No deployed rules were changed by this app update. The current deployed rules
must be reviewed to prepare an exact patch.

After publishing the corrected rules, retry the provider button. Firebase reuses
the same authenticated UID, so the app creates the missing profile on that retry
and does not create a second profile for an existing traveler.

Reference: https://firebase.google.com/docs/database/security/rules-conditions
