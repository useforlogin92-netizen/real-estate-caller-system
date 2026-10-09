# Caller Login: Password, OTP and Admin Approval

This is a requirements document for the standalone Real Estate Caller Desk. It must remain isolated from OM Krishna Group, MetroCRM and Metro Properties.

## Required caller access flow
1. Caller enters username and password, or chooses OTP login.
2. OTP must be generated and verified server-side and delivered through a verified channel (SMS/email/WhatsApp provider); never expose OTP in the browser, source code, logs or local storage.
3. New caller accounts start as Pending Admin Approval.
4. Admin approves or rejects the account in the Users area. Pending/rejected/disabled callers cannot access leads.
5. Password login and OTP login both check active status and admin approval on the server.
6. Offline LAN mode must use a trusted local server for shared users, approval state, OTP validation and data. Internet SMS/email OTP will not work without internet; a local-only OTP fallback must be explicitly designed and must not be represented as secure internet OTP.
7. Approval changes and OTP events must be audit logged. Rate-limit OTP requests and attempts, expire codes quickly, and make codes single-use.

## Prototype limitations
The current GitHub Pages app is a public client-side prototype. UI-only approval is not a security boundary. OTP delivery/verification and enforceable admin approval require the dedicated LAN backend/server. Never use demo credentials or real customer data in this prototype.

## Acceptance checks
- [ ] New caller defaults to pending approval.
- [ ] Pending, rejected and disabled users cannot sign in.
- [ ] Admin can approve/reject caller and see current status.
- [ ] Password and OTP paths both enforce the same server-side approval check.
- [ ] OTP is short-lived, one-time, rate-limited and delivered to a verified contact.
- [ ] All lead access is enforced server-side; callers cannot access another caller's leads.
- [ ] LAN server continues local authentication and shared data when internet is down.
