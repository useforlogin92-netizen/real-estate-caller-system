# Initial Security Audit — Real Estate Caller Desk

Audit date: 2026-10-09
Repository: `useforlogin92-netizen/real-estate-caller-system`

## Current status

This repository is a static, offline-first prototype. It is **not ready for real customer information or production use**.

## Verified findings

1. **Authentication is not secure.** Demo usernames and passwords are hard-coded in `app.js` and client-visible in `index.html`. Anyone can inspect the public source and obtain them. The prototype Users screen also saves editable account passwords as plaintext in browser `localStorage`; do not treat its password editor as secure password management.
2. **Authorization is client-side only.** The admin/caller role and record filtering run in browser JavaScript. They can be bypassed and do not isolate records securely.
3. **Data is local to one browser.** Leads are stored in `localStorage`; records do not sync between callers/devices and may be lost when browser data is cleared.
4. **No production backend is configured.** There is no verified server-side authentication, database row-level security, secure password reset, or audit trail. The Users screen can create/edit local demo accounts only.
5. **Offline support is a cache, not synchronization.** The service worker can cache the app shell after an online visit, but does not provide safe multi-device sync or conflict resolution.
6. **Public repository.** Treat all source files as public. Never commit passwords, service-role keys, private API tokens, or customer data.

## Required work before production

- Configure a new, dedicated backend for this app (separate from all other projects).
- Use server-managed authentication, account invitations/password reset, and least-privilege roles.
- Store caller ownership on records and enforce access with database policies (for example, Row Level Security) on every read/write.
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
- [ ] Production security checks above pass before real data is used.

## Important limitation

A client-side-only change cannot turn this prototype into a secure multi-user application. Production readiness requires a separately configured backend and verified database policies.
