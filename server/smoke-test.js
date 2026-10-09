'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'caller-desk-smoke-'));
let serverProcess;
function freePort() { return new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); }); }
async function main() {
  const port = await freePort();
  const env = { ...process.env, DATA_DIR: temp, PORT: String(port), HOST: '127.0.0.1' };
  const setup = spawnSync(process.execPath, [path.join(__dirname, 'setup-admin.js'), 'admin', 'Smoke-Test-Admin-123!', 'admin@example.test'], { env, encoding: 'utf8' });
  assert.equal(setup.status, 0, setup.stderr || setup.stdout);
  serverProcess = spawn(process.execPath, [path.join(__dirname, 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; serverProcess.stdout.on('data', b => logs += b); serverProcess.stderr.on('data', b => logs += b);
  const base = `http://127.0.0.1:${port}`;
  async function request(route, { method = 'GET', token, body } = {}) {
    const res = await fetch(base + route, { method, headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json(); return { status: res.status, data };
  }
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) { try { const h = await request('/api/health'); if (h.status === 200 && h.data.ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); }
    assert.ok(ready, `Server did not start. Logs: ${logs}`);
    assert.equal((await request('/server/server.js')).status, 404, 'server source must not be served as a static file');
    assert.equal((await request('/api/admin/users')).status, 401, 'admin API must require authentication');
    const adminLogin = await request('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'Smoke-Test-Admin-123!' } });
    assert.equal(adminLogin.status, 200); const admin = adminLogin.data.token;
    const c1 = await request('/api/admin/users', { method: 'POST', token: admin, body: { name: 'Caller One', username: 'caller01', email: 'c1@example.test', password: 'Caller-Test-123!', role: 'caller', active: true, approval: 'pending' } });
    assert.equal(c1.status, 201);
    assert.equal((await request('/api/auth/login', { method: 'POST', body: { username: 'caller01', password: 'Caller-Test-123!' } })).status, 403, 'pending caller must not log in');
    assert.equal((await request(`/api/admin/users/${c1.data.user.id}/approval`, { method: 'PATCH', token: admin, body: { approval: 'approved' } })).status, 200);
    const c2 = await request('/api/admin/users', { method: 'POST', token: admin, body: { name: 'Caller Two', username: 'caller02', email: 'c2@example.test', password: 'Caller-Test-456!', role: 'caller', active: true, approval: 'approved' } });
    assert.equal(c2.status, 201);
    const callerLogin = await request('/api/auth/login', { method: 'POST', body: { username: 'caller01', password: 'Caller-Test-123!' } });
    assert.equal(callerLogin.status, 200); const callerToken = callerLogin.data.token;
    const lead = await request('/api/leads', { method: 'POST', token: callerToken, body: { name: 'Smoke Customer', mobile: '9000000001', status: 'New' } });
    assert.equal(lead.status, 201); assert.equal(lead.data.lead.assignedTo, c1.data.user.id, 'caller-created lead must belong to caller');
    assert.equal((await request(`/api/leads/${lead.data.lead.id}`, { method: 'PATCH', token: callerToken, body: { name: 'Changed by caller' } })).status, 200);
    assert.equal((await request(`/api/leads/${lead.data.lead.id}`, { method: 'PATCH', token: callerToken, body: { assignedTo: c2.data.user.id } })).status, 200, 'caller patch must not override ownership');
    assert.equal((await request(`/api/leads/${lead.data.lead.id}`, { method: 'PATCH', token: admin, body: { assignedTo: c2.data.user.id } })).status, 200, 'admin can reassign lead');
    const caller1Leads = await request('/api/leads', { token: callerToken });
    assert.equal(caller1Leads.status, 200); assert.equal(caller1Leads.data.leads.length, 0, 'caller must not see reassigned lead');
    const caller2Login = await request('/api/auth/login', { method: 'POST', body: { username: 'caller02', password: 'Caller-Test-456!' } });
    const caller2Leads = await request('/api/leads', { token: caller2Login.data.token });
    assert.equal(caller2Leads.data.leads.length, 1, 'assigned caller should see lead');
    const backup = await request('/api/admin/backup', { token: admin });
    assert.equal(backup.status, 200); assert.equal(backup.data.version, 1); assert.equal(backup.data.database.leads.length, 1);
    const restore = await request('/api/admin/restore', { method: 'POST', token: admin, body: backup.data });
    assert.equal(restore.status, 200); assert.equal(restore.data.leads, 1);
    assert.equal((await request('/api/me', { token: admin })).status, 401, 'restore must invalidate existing sessions');
    console.log('PASS: LAN smoke tests (startup, auth, approval, ownership, assignment, backup/restore, static file allowlist).');
  } finally { serverProcess.kill(); }
}
main().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => { if (serverProcess && !serverProcess.killed) serverProcess.kill(); fs.rmSync(temp, { recursive: true, force: true }); });