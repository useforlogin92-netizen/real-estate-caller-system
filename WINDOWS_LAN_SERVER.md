# Windows LAN Server — Real Estate Caller Desk

This is a separate local-network service for the standalone Real Estate Caller System. It does not connect to or modify OM Krishna Group, MetroCRM, or Metro Properties.

## Requirements
- Windows 10/11 with Node.js 20 or newer
- All client devices connected to the same trusted Wi-Fi/router/LAN
- Keep the Windows server computer switched on while clients use the app

## First-time setup on Windows PowerShell
From the repository folder:
```powershell
node --version
npm run setup-admin -- admin "Use-A-Unique-Long-Password-Here" admin@local.test
npm start
```
Use your own unique password of at least 12 characters. Do not paste a real password into chat. If your project folder is not a Node package root, run commands from the `server` folder:
```powershell
cd server
npm run setup-admin -- admin "Use-A-Unique-Long-Password-Here" admin@local.test
npm start
```

Open `http://localhost:8080` on the server. On Android/other Windows devices, find the server PC IPv4 address using `ipconfig`, then open `http://SERVER-IP:8080`, for example `http://192.168.1.50:8080`. The example IP is illustrative only.

## OTP in internet-free LAN mode
This server can generate short-lived, single-use OTPs and prints them to the **Windows server terminal only**. A caller requests OTP in the login screen and the trusted server operator reads the code from the terminal and communicates it privately. This is a local/offline fallback, not SMS/email delivery. Do not expose the server terminal to callers. Online SMS/email OTP requires an external provider and internet connectivity.

## Security and current status
- Server-side scrypt password hashes, expiring bearer sessions, basic login/OTP rate limiting, approval enforcement, lead ownership checks and an audit log are implemented in this server scaffold.
- Admin creates users through the server API; caller accounts default to pending approval.
- The browser UI still needs its API integration before the full workflow is end-to-end. Do not treat this scaffold alone as completed/production-ready.
- Before use with real customer data, complete UI/API integration, add account disable/password reset APIs, test LAN access and firewall rules, validate all authorization cases, and configure regular encrypted backups.
- Never port-forward this port to the public internet. Use only a trusted private LAN.
- Local browser caching does not automatically make shared server data available when the server PC is off.
