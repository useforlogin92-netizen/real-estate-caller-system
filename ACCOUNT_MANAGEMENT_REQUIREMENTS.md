# Account Management Requirements — Real Estate Caller System

Status: implementation requirements; backend provisioning is pending.

## Initial accounts
- Provision one first administrator and 10 caller accounts through a trusted server-side setup process.
- Never place real passwords, password hashes, Supabase service-role keys, or other secrets in this public repository.
- Each user must set their own password through a one-time invite/reset link. No shared default password.
- Keep this application and its database isolated from OM Krishna Group, MetroCRM, and Metro Properties.

## Admin user-management screen
Admin can:
- View all accounts and their role/status.
- Create a caller, change the caller's display name, and change the caller's username/login identifier where supported.
- Trigger a password reset for any caller. Admin should send a reset link; do not reveal or read a user's existing password.
- Activate/deactivate caller accounts.
- Assign leads to a caller and reassign leads when a caller's name/login changes.
- See an audit log of account creation, renaming, reset requests, status changes, and lead reassignment.

## Caller account permissions
- A caller can see and edit only leads assigned to that caller, enforced by database Row Level Security (not just frontend filters).
- A caller cannot create admins, change roles, manage other accounts, or read another caller's records.
- A caller can change their own password using a secure authenticated flow and can sign out.
- Any username change must be checked for uniqueness and applied consistently to authentication/profile records. Lead ownership should use a stable user UUID, not the mutable username.

## Authentication and password handling
- Use backend-managed authentication (Supabase Auth or equivalent), with server-side authorization.
- Store profile fields such as stable user UUID, display name, username, role, active status, and timestamps in a separate profile table.
- Admin-only account provisioning/password-reset actions must run through a trusted server-side function and verify the requesting user's admin role.
- Never store plaintext passwords in app tables, localStorage, CSV backups, or source code.
- Enforce password-reset token expiry and one-time use; do not let an admin set or view a caller's current password.
- Protect the last active admin from accidental deactivation/demotion.
- Log security-sensitive account changes without logging passwords or reset tokens.

## Offline behavior
- Offline mode may allow limited access to already-authorized, locally cached records on an explicitly trusted device, but it must not bypass server permissions.
- Show a visible pending-sync/offline state. Do not claim a change is synced until the server confirms it.
- Multi-device account changes and lead assignments require connectivity to the backend.

## Acceptance checks
- [ ] Fresh backend setup provisions 1 admin and 10 callers with unique stable IDs.
- [ ] Admin can rename a caller and trigger a password reset.
- [ ] Renaming does not orphan or misassign that caller's leads.
- [ ] A caller cannot view or edit another caller's records by changing frontend requests.
- [ ] Non-admin callers cannot access user-management endpoints.
- [ ] Passwords and privileged keys are absent from the public repo and client bundle.
- [ ] Disabled accounts cannot sign in.
- [ ] Audit events are created for account-management changes.
- [ ] RLS and authorization tests pass before real customer data is entered.

## Blocking dependency
The existing app is a public static prototype with hard-coded demo credentials and localStorage-only records. Account management cannot be securely implemented by adding frontend controls alone. A dedicated backend organization/project must be provisioned first; do not reuse any OM Krishna Group / MetroCRM / Metro Properties project.
