'use strict';
// Standalone LAN server. No external runtime dependencies.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 8080);
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const sessions = new Map();
const otpChallenges = new Map();
const loginAttempts = new Map();
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], leads: [], audit: [] }, null, 2), { mode: 0o600 });

function readDb() { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(db) {
  const temp = DB_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(temp, DB_FILE);
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}
function passwordMatches(password, user) {
  const candidate = crypto.scryptSync(password, user.passwordSalt, 64);
  const stored = Buffer.from(user.passwordHash, 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(candidate, stored);
}
function safeUser(user) {
  const { passwordSalt, passwordHash, ...safe } = user;
  return safe;
}
function audit(db, actor, action, target, details = {}) {
  db.audit.push({ id: crypto.randomUUID(), at: new Date().toISOString(), actor: actor || 'system', action, target: target || null, details });
  if (db.audit.length > 5000) db.audit.splice(0, db.audit.length - 5000);
}
function json(res, status, value, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(JSON.stringify(value));
}
function getSession(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { if (token) sessions.delete(token); return null; }
  const user = readDb().users.find(u => u.id === session.userId);
  if (!user || !user.active || user.approval !== 'approved') { sessions.delete(token); return null; }
  return { token, user };
}
function requireUser(req, res, admin = false) {
  const s = getSession(req);
  if (!s) { json(res, 401, { error: 'Please sign in again.' }); return null; }
  if (admin && s.user.role !== 'admin') { json(res, 403, { error: 'Admin permission required.' }); return null; }
  return s;
}
async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1024 * 1024) throw new Error('Request too large');
  }
  return raw ? JSON.parse(raw) : {};
}
function cleanText(v, max = 200) { return String(v || '').trim().slice(0, max); }
function rateLimited(key) {
  const now = Date.now(), previous = loginAttempts.get(key) || [];
  const recent = previous.filter(t => now - t < 10 * 60 * 1000);
  recent.push(now); loginAttempts.set(key, recent);
  return recent.length > 8;
}
function staticFile(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const full = path.resolve(ROOT, '.' + requested);
  if (!full.startsWith(ROOT + path.sep) || full.startsWith(DATA_DIR)) return json(res, 403, { error: 'Forbidden' });
  let stat;
  try { stat = fs.statSync(full); } catch { return json(res, 404, { error: 'Not found' }); }
  if (!stat.isFile()) return json(res, 404, { error: 'Not found' });
  const ext = path.extname(full).toLowerCase();
  const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json', '.json':'application/json; charset=utf-8' };
  res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream', 'x-content-type-options':'nosniff', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
  fs.createReadStream(full).pipe(res);
}
async function handle(req, res) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const p = url.pathname;
  if (p.startsWith('/api/')) {
    if (req.method === 'GET' && p === '/api/health') return json(res, 200, { ok: true, service: 'Real Estate Caller LAN Server', time: new Date().toISOString() });
    if (req.method === 'POST' && p === '/api/auth/login') {
      const data = await body(req), key = (req.socket.remoteAddress || '') + ':' + cleanText(data.username, 120).toLowerCase();
      if (rateLimited(key)) return json(res, 429, { error: 'Too many attempts. Wait 10 minutes.' });
      const db = readDb(), identifier = cleanText(data.username, 120).toLowerCase();
      const user = db.users.find(u => u.username.toLowerCase() === identifier || (u.email || '').toLowerCase() === identifier);
      if (!user || !user.active || !passwordMatches(String(data.password || ''), user)) return json(res, 401, { error: 'Invalid username/password or disabled account.' });
      if (user.approval !== 'approved') return json(res, 403, { error: user.approval === 'rejected' ? 'Admin rejected this account.' : 'Waiting for Admin approval.' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
      audit(db, user.username, 'login', user.id); writeDb(db);
      return json(res, 200, { token, user: safeUser(user), expiresIn: SESSION_TTL_MS });
    }
    if (req.method === 'POST' && p === '/api/auth/request-otp') {
      const data = await body(req), key = cleanText(data.username, 120).toLowerCase();
      if (!key || rateLimited('otp:' + (req.socket.remoteAddress || '') + ':' + key)) return json(res, 429, { error: 'Too many OTP requests. Wait 10 minutes.' });
      const db = readDb(), user = db.users.find(u => u.username.toLowerCase() === key || (u.email || '').toLowerCase() === key || u.mobile === key);
      if (!user || !user.active || user.approval !== 'approved') return json(res, 200, { message: 'If an approved account matches, an OTP request has been created.' });
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      otpChallenges.set(key, { userId: user.id, codeHash: crypto.createHash('sha256').update(code).digest('hex'), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
      // Offline LAN delivery: OTP is shown only in the server terminal, not returned to the browser.
      console.log('[OFFLINE OTP]', new Date().toISOString(), 'login=', user.username, 'code=', code, '(valid 5 minutes; single use)');
      return json(res, 200, { message: 'If an approved account matches, check the Windows server console for the offline OTP. Valid for 5 minutes.' });
    }
    if (req.method === 'POST' && p === '/api/auth/verify-otp') {
      const data = await body(req), key = cleanText(data.username, 120).toLowerCase(), challenge = otpChallenges.get(key);
      if (!challenge || challenge.expiresAt < Date.now() || challenge.attempts >= 5) { otpChallenges.delete(key); return json(res, 401, { error: 'OTP expired or invalid. Request a new one.' }); }
      challenge.attempts++;
      const submitted = crypto.createHash('sha256').update(cleanText(data.code, 8)).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(submitted, 'hex'), Buffer.from(challenge.codeHash, 'hex'))) return json(res, 401, { error: 'Invalid OTP.' });
      otpChallenges.delete(key);
      const db = readDb(), user = db.users.find(u => u.id === challenge.userId);
      if (!user || !user.active || user.approval !== 'approved') return json(res, 403, { error: 'Account is not approved or active.' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
      audit(db, user.username, 'otp_login', user.id); writeDb(db);
      return json(res, 200, { token, user: safeUser(user), expiresIn: SESSION_TTL_MS });
    }
    if (req.method === 'GET' && p === '/api/me') {
      const s = requireUser(req, res); if (!s) return;
      return json(res, 200, { user: safeUser(s.user) });
    }
    if (req.method === 'POST' && p === '/api/auth/logout') {
      const s = getSession(req); if (s) sessions.delete(s.token);
      return json(res, 200, { ok: true });
    }
    if (p === '/api/admin/users' && req.method === 'GET') {
      const s = requireUser(req, res, true); if (!s) return;
      return json(res, 200, { users: readDb().users.map(safeUser) });
    }
    if (p === '/api/admin/users' && req.method === 'POST') {
      const s = requireUser(req, res, true); if (!s) return;
      const data = await body(req), username = cleanText(data.username, 40).toLowerCase(), email = cleanText(data.email, 150).toLowerCase();
      if (!/^[a-z0-9._-]{3,40}$/.test(username)) return json(res, 400, { error: 'Username must be 3–40 letters/numbers/._-.' });
      if (String(data.password || '').length < 10) return json(res, 400, { error: 'Password must be at least 10 characters.' });
      const db = readDb();
      if (db.users.some(u => u.username.toLowerCase() === username || (email && (u.email || '').toLowerCase() === email))) return json(res, 409, { error: 'Username/email already exists.' });
      const pw = hashPassword(String(data.password));
      const user = { id: crypto.randomUUID(), username, email, mobile: cleanText(data.mobile, 30), name: cleanText(data.name, 100) || username, role: data.role === 'admin' ? 'admin' : 'caller', active: data.active !== false, approval: data.role === 'admin' ? 'approved' : ['approved','pending','rejected'].includes(data.approval) ? data.approval : 'pending', passwordSalt: pw.salt, passwordHash: pw.hash, createdAt: new Date().toISOString() };
      db.users.push(user); audit(db, s.user.username, 'create_user', user.id, { username, role: user.role, approval: user.approval }); writeDb(db);
      return json(res, 201, { user: safeUser(user) });
    }
    const approvalMatch = p.match(/^\/api\/admin\/users\/([\w-]+)\/approval$/);
    if (approvalMatch && req.method === 'PATCH') {
      const s = requireUser(req, res, true); if (!s) return;
      const data = await body(req), db = readDb(), user = db.users.find(u => u.id === approvalMatch[1]);
      if (!user) return json(res, 404, { error: 'User not found.' });
      if (!['approved','pending','rejected'].includes(data.approval)) return json(res, 400, { error: 'Invalid approval state.' });
      user.approval = data.approval; audit(db, s.user.username, 'set_approval', user.id, { approval: user.approval }); writeDb(db);
      for (const [token, sess] of sessions) if (sess.userId === user.id && user.approval !== 'approved') sessions.delete(token);
      return json(res, 200, { user: safeUser(user) });
    }
    if (p === '/api/admin/users/' && req.method === 'PATCH') return json(res, 404, { error: 'Unknown endpoint' });
    if (p === '/api/leads' && req.method === 'GET') {
      const s = requireUser(req, res); if (!s) return;
      const db = readDb(), leads = s.user.role === 'admin' ? db.leads : db.leads.filter(l => l.assignedTo === s.user.id);
      return json(res, 200, { leads });
    }
    if (p === '/api/leads' && req.method === 'POST') {
      const s = requireUser(req, res); if (!s) return;
      const data = await body(req), db = readDb();
      const lead = { ...data, id: crypto.randomUUID(), assignedTo: s.user.role === 'admin' && data.assignedTo ? data.assignedTo : s.user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      delete lead.password; db.leads.push(lead); audit(db, s.user.username, 'create_lead', lead.id); writeDb(db);
      return json(res, 201, { lead });
    }
    const leadMatch = p.match(/^\/api\/leads\/([\w-]+)$/);
    if (leadMatch && (req.method === 'PATCH' || req.method === 'DELETE')) {
      const s = requireUser(req, res); if (!s) return;
      const db = readDb(), index = db.leads.findIndex(l => l.id === leadMatch[1]);
      if (index < 0) return json(res, 404, { error: 'Lead not found.' });
      const lead = db.leads[index];
      if (s.user.role !== 'admin' && lead.assignedTo !== s.user.id) return json(res, 403, { error: 'You may access only your assigned leads.' });
      if (req.method === 'DELETE') db.leads.splice(index, 1);
      else Object.assign(lead, await body(req), { updatedAt: new Date().toISOString(), id: lead.id, assignedTo: lead.assignedTo });
      audit(db, s.user.username, req.method === 'DELETE' ? 'delete_lead' : 'update_lead', lead.id); writeDb(db);
      return json(res, 200, { ok: true, ...(req.method === 'PATCH' ? { lead } : {}) });
    }
    return json(res, 404, { error: 'API endpoint not found.' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
  return staticFile(req, res, p);
}
const server = http.createServer((req, res) => {
  Promise.resolve(handle(req, res)).catch(err => { console.error('Request error:', err.message); if (!res.headersSent) json(res, 400, { error: 'Invalid request.' }); else res.end(); });
});
server.listen(PORT, HOST, () => {
  console.log('Real Estate Caller LAN Server running.');
  console.log('Local: http://localhost:' + PORT);
  console.log('LAN: find this Windows PC IPv4 address and open http://<SERVER-IP>:' + PORT + ' on connected devices.');
  console.log('Data file: ' + DB_FILE);
  console.log('IMPORTANT: keep Windows Firewall limited to your private LAN; do not port-forward this service to the internet.');
  const db = readDb();
  if (!db.users.length) console.log('No Admin configured yet. Run: npm run setup-admin -- admin YourStrongPasswordHere');
});
