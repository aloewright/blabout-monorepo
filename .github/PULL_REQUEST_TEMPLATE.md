# Summary

- Enforce single frontend domain by redirecting any non-primary host to `blabout.com` (configurable via `PRIMARY_HOST`).
- Switch Google login to popup flow to avoid redirect URI mismatches during domain transitions.
- Add health endpoint (`/_health`).

# Details

- frontend/server.js
  - Adds PRIMARY_HOST redirect middleware. Defaults to `blabout.com`. This prevents users landing on `*.run.app` or preview hosts and failing OAuth origin checks.
  - Adds `/_health` endpoint for quick health probes.
- frontend/src/components/GoogleAuth.tsx
  - Adds `ux_mode: 'popup'` in `useGoogleLogin()` to avoid redirect flow pitfalls and simplify fastest path to working auth on production domain.

# Notes for Deployment

- Google Client ID is already stored in Google Secret Manager. Please map it to the Cloud Run service as the environment variable `GOOGLE_CLIENT_ID` (or mount it and expose via env) so `/env.json` serves it to the client. The server already reads:
  - `GOOGLE_CLIENT_ID` (for runtime env exposure)
  - `PRIMARY_HOST` to control the redirect domain (defaults to `blabout.com`).

# Why this change

- There were two separate frontends (run.app and primary). OAuth origin mismatch and state divergence occurred. Enforcing one canonical host and using popup mode is the quickest way to get login working reliably at `https://blabout.com`.

# Follow-ups (optional)

- If you prefer redirect-based auth, we can set up the exact redirect URI in Google Cloud Console and switch back. For now, popup is less brittle and suits the fast path.
- We can add CI type fixes and resolve TS lint warnings later.
