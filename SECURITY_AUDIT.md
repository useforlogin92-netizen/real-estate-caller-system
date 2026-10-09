# Initial Security Audit — Real Estate Caller Desk

Audit date: 2026-10-09
Repository: `useforlogin92-netizen/real-estate-caller-system`

## Current status

The GitHub Pages deployment remains a public demo. A separate Node.js Windows LAN server scaffold and frontend API wiring have now been added, but the Windows host has not been run or end-to-end tested in the user's environment. The system is **not yet approved for real customer information or production use**.

## Verified findings

1. **Authentication is not secure.** Demo usernames and passwords are hard-coded in `app.js` and client-visible in `index.html`. Anyone can inspect the public source and obtain them. The prototype Users screen also saves editable account passwords as plaintext in browser `localStorage`; do not treat its password editor as secure password management.
2. **Authorization is client-side only.** The admin/caller role and record filtering run in browser JavaScript. They can be bypassed and do not isolate records securely.
3. **Two modes exist.** GitHub Pages demo data remains in browser `localStorage`. In LAN mode, lead operations are wired to `server/server.js` and persisted in `server/data/database.json`, shared by devices that reach the Windows host. This integration still needs a real Windows/LAN end-to-end test.
4. **LAN backend is a local-server scaffold, not production certification.** It includes scrypt password hashes, expiring in-memory sessions, approval checks, OTP codes printed to the trusted server terminal, admin user endpoints, lead ownership checks, and a bounded audit log. Session persistence, robust backup/restore, secure deployment, and comprehensive authorization testing remain incomplete.
5. **LAN offline operation depends on the Windows server staying on.** Internet can be unavailable while the local Wi-Fi/LAN works; if the server PC or local network is down, shared server data cannot be reached. SMS/email OTP requires internet; the offline fallback prints OTP only to the server terminal.
6. **Public repository.** Treat all source files as public. Never commit passwords, service-role keys, private API tokens, or customer data.

## Required work before production

- Run the dedicated Windows LAN server on the target PC and verify all clients use the private LAN only; never reuse OM Krishna Group, MetroCRM, or Metro Properties infrastructure.
- Complete server-side account registration/invitation, secure password reset, and least-privilege role tests.
- Verify server-side caller ownership on every read/write and test attempts to access another caller's lead.
- Keep only publishable/public client configuration in frontend code; never ship privileged keys.
- Add validated online/offline sync with retry handling, conflict detection, and visible sync status.
- Test admin vs caller access, unauthenticated access, cross-caller record access, import/export permissions, and password reset.
- Review backups, retention, and deletion workflows before entering customer information.

## Prototype test checklist

- [ ] App loads over HTTPS.
- [ ] Sign-in / sign-out flow works (demo only).
- [ ] Lead create/edit/delete works on one browser.
- [ ] Search and status filters work.
- [ ] Follow-up and visit lists work.
- [ ] JSON backup/restore and CSV export work.
- [ ] App shell opens offline after an initial online load.
- [ ] Windows LAN login, OTP, approval, multi-device lead access, backup/restore, and all authorization checks pass before real data is used.

## Important limitation

A client-side-only change cannot turn this prototype into a secure multi-user application. Production readiness requires a separately configured backend and verified database policies.
