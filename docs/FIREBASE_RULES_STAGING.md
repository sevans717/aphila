Staging Firebase rules — guidance and files

Files added in `sav3-frontend/firebase-example`:
- `firestore.rules` — rules that allow authenticated users to create/read messages and only edit their own user profile. Messages are immutable in staging.
- `storage.rules` — rules that allow authenticated uploads to `uploads/{userId}/...` with a 10MB size limit and content-type restriction to images.

Quick notes
- These rules are stricter than `test mode` but still lenient for staging (messages readable by any authenticated user; uploaded images are public read). Tighten `allow read` if you want images private.
- Before production:
  - Enforce rate-limits, validate image content server-side or via moderation API before making public.
  - Consider using Firebase App Check to prevent abuse.
  - Validate `author` using server-side checks when necessary.

How to deploy rules
1. Install Firebase CLI and login:

```bash
npm install -g firebase-tools
firebase login
```

2. From project root (or set `firebase.json`), run:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

Or set up CI to deploy rules on merge to staging branch.
