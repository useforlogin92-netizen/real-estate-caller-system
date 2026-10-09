# Windows LAN Server — Real Estate Caller Desk

This is a separate local-network service for the standalone Real Estate Caller System. It does not connect to or modify OM Krishna Group, MetroCRM, or Metro Properties.

## Requirements
- Windows 10/11 with Node.js 20 or newer
- All client devices connected to the same trusted Wi-Fi/router/LAN
- Keep the Windows server computer switched on while clients use the app

## First-time setup on Windows PowerShell
From the repository folder, run these commands in PowerShell:
```powershell
cd server
node --version
npm run setup-admin -- admin "Use-A-Unique-Long-Password-Here" admin@local.test
npm start
```
Use your own unique password of at least 12 characters. Do not paste a real password into chat. Run the setup-admin command only once; if an Admin already exists, it will refuse to create another.

Open `http://localhost:8080` on the server. On Android/other Windows devices, find the server PC IPv4 address using `ipconfig`, then open `http://SERVER-IP:8080`, for example `http://192.168.1.50:8080`. The example IP is illustrative only.

## OTP in internet-free LAN mode
This server can generate short-lived, single-use OTPs and prints them to the **Windows server terminal only**. A caller requests OTP in the login screen and the trusted server operator reads the code from the terminal and communicates it privately. This is a local/offline fallback, not SMS/email delivery. Do not expose the server terminal to callers. Online SMS/email OTP requires an external provider and internet connectivity.

## Security and current status
- Server-side scrypt password hashes, expiring bearer sessions, basic login/OTP rate limiting, approval enforcement, lead ownership checks and an audit log are implemented in this server scaffold.
- Admin creates users through the server API; caller accounts default to pending approval.
- The browser UI is wired to the LAN API for sign-in, OTP verification, user administration, lead CRUD, caller assignment, Admin JSON backup/restore, and near-live refresh. While a signed-in tab is visible, it polls the shared server every 2 seconds and refreshes when the tab regains focus. This is near-live polling, not a guaranteed zero-latency push notification.
- Automated CI smoke tests exercise server startup, password login, pending-approval denial, caller ownership, Admin reassignment, backup/restore, and static-file restrictions. These tests are not a substitute for testing on the actual Windows PC and router.
- Before real customer data, test the exact Windows/LAN setup, restrict Windows Firewall to the trusted Private network, protect the external HDD, and confirm backups can be restored. HTTP traffic on this LAN is not encrypted; do not use untrusted/public Wi-Fi or expose the port to the internet.
- Never port-forward this port to the public internet. Use only a trusted private LAN.
- All caller devices and Admin must open the same `http://SERVER-IP:8080` URL; GitHub Pages is only a browser-local demo and does not share records. Local browser caching does not automatically make shared server data available when the server PC is off.
- Offline operation means the internet may be down while the trusted office LAN and server PC remain on. If the server PC or LAN is unreachable, another device cannot receive updates until connectivity returns.
- Near-live LAN polling has been changed to 2 seconds on the feature branch. The Windows PC, router/firewall, multiple-device flow, and real visit update still require end-to-end verification before production use.


## LAN backup and restore
- Sign in as Admin and open Backup / Export.
- In LAN mode, Download full backup requests the server database backup, including user records/password hashes, leads and audit records. Store it privately.
- Restore JSON backup validates the backup, writes a pre-restore database snapshot in `server/data`, restores the shared database, and invalidates active sessions so everyone must sign in again.
- Keep the backup file private. It contains sensitive customer data and password hashes; never commit it to GitHub.
- The Windows `windows\\RUN-OFFLINE-BACKUP.bat` script is separate: it backs up local files and downloads code from GitHub; it does not upload customer data to GitHub.
