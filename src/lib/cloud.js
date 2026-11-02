// Cloud sync and push through your own Supabase project (see docs/CLOUD_SETUP.md).
// Until you connect it, Boēthos works fully on this device and nothing leaves it.
//
// Sign-in is an emailed 6-digit code (not a link), so it works inside the installed phone app.
// Your data is one private row (row-level security: only you can read or write it), saved with a
// version number so two devices never silently overwrite each other.
import { stripRestricted, keepLocalRestricted } from './privacy';

const KEY = 'boethos_cloud';
// Your project is built into the app, so a new device only needs you to sign in. Anything saved on the device wins.
const DEFAULTS = { url: import.meta.env.VITE_SB_URL || '', anonKey: import.meta.env.VITE_SB_ANON || '', vapidPublic: import.meta.env.VITE_VAPID_PUBLIC || '' };
const read = () => { let c = {}; try { c = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* storage blocked */ } return { ...DEFAULTS, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v !== '' && v != null)) }; };
export const builtIn = () => !!(DEFAULTS.url && DEFAULTS.anonKey);
const write = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* storage blocked */ } window.dispatchEvent(new Event('boethos-cloud')); };

export const cloudConfig = () => read();
export const setCloud = (patch) => write({ ...read(), ...patch });
export const isConfigured = (c = read()) => !!(c.url && c.anonKey);
export const isSignedIn = (c = read()) => !!(isConfigured(c) && c.session?.refresh);

const base = (c) => c.url.replace(/\/+$/, '');
async function call(c, path, { method = 'GET', body, auth = true, prefer } = {}) {
  const headers = { apikey: c.anonKey, 'Content-Type': 'application/json' };
  if (auth && c.session?.access) headers.Authorization = `Bearer ${c.session.access}`;
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(base(c) + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw Object.assign(new Error(data?.msg || data?.message || data?.error_description || `Request failed (${res.status})`), { status: res.status });
  return data;
}

// ── Sign-in ──
export async function sendCode(email) {
  const c = read();
  await call(c, '/auth/v1/otp', { method: 'POST', auth: false, body: { email, create_user: true } });
  setCloud({ email });
}
// Email and password: works inside the installed phone app, with no link to open
const keep = (email, s) => setCloud({ email, session: { access: s.access_token, refresh: s.refresh_token, expiresAt: Date.now() + s.expires_in * 1000, userId: s.user?.id } });
export async function signInPassword(email, password) {
  const s = await call(read(), '/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email, password } });
  keep(email, s);
}
export async function signUp(email, password) {
  const s = await call(read(), '/auth/v1/signup', { method: 'POST', auth: false, body: { email, password } });
  if (!s.access_token) throw new Error('Account created. Check your email to confirm it, then sign in.');
  keep(email, s);
}
export async function verifyCode(email, token) {
  const c = read();
  const s = await call(c, '/auth/v1/verify', { method: 'POST', auth: false, body: { type: 'email', email, token } });
  setCloud({ email, session: { access: s.access_token, refresh: s.refresh_token, expiresAt: Date.now() + s.expires_in * 1000, userId: s.user?.id } });
}
export function signOut() { const c = read(); delete c.session; c.version = null; c.lastSyncedAt = null; c.status = 'off'; write(c); }

async function fresh() {
  const c = read();
  if (!isSignedIn(c)) throw new Error('Not signed in');
  if (c.session.expiresAt - Date.now() > 60000) return c;
  const s = await call(c, '/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: c.session.refresh } });
  const next = { ...c, session: { ...c.session, access: s.access_token, refresh: s.refresh_token, expiresAt: Date.now() + s.expires_in * 1000 } };
  write(next);
  return next;
}

// ── The data row ──
const outgoing = (state, c) => (c.includeRestricted ? state : stripRestricted(state));

export async function fetchRemote() {
  const c = await fresh();
  const rows = await call(c, '/rest/v1/app_state?select=doc,version,updated_at');
  return rows[0] || null;
}

// Save; resolves 'saved' or 'conflict' (the cloud has a newer version from another device).
export async function push(state) {
  const c = await fresh();
  const doc = outgoing(state, c);
  if (c.version == null) {
    const existing = await fetchRemote();
    if (existing) return 'conflict';
    await call(c, '/rest/v1/app_state', { method: 'POST', body: { user_id: c.session.userId, doc, version: 1 }, prefer: 'return=minimal' });
    setCloud({ version: 1, lastSyncedAt: new Date().toISOString(), status: 'synced', dirty: false });
    return 'saved';
  }
  const rows = await call(c, `/rest/v1/app_state?user_id=eq.${c.session.userId}&version=eq.${c.version}`, { method: 'PATCH', body: { doc, version: c.version + 1, updated_at: new Date().toISOString() }, prefer: 'return=representation' });
  if (!rows.length) { setCloud({ status: 'conflict' }); return 'conflict'; }
  setCloud({ version: c.version + 1, lastSyncedAt: new Date().toISOString(), status: 'synced', dirty: false });
  return 'saved';
}

// Replace this device's data with the cloud copy (restricted notes kept here are never wiped).
export function adoptRemote(remote, local) {
  const next = keepLocalRestricted(remote.doc, local);
  localStorage.setItem('shepherd_os_v1', JSON.stringify(next));
  setCloud({ version: remote.version, lastSyncedAt: new Date().toISOString(), status: 'synced', dirty: false });
  window.location.reload();
}

// Keep this device's copy and write it over the cloud's newer version (an explicit choice).
export async function overwriteRemote(state) {
  const remote = await fetchRemote();
  setCloud({ version: remote ? remote.version : null });
  return push(state);
}

// ── Push notifications ──
const b64ToBytes = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, ch => ch.charCodeAt(0)); };

export async function subscribePush() {
  const c = await fresh();
  if (!c.vapidPublic) throw new Error('Add your VAPID public key first');
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('This browser cannot receive push messages. On iPhone, install Boēthos to the home screen first (iOS 16.4+).');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications are blocked for this site');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(c.vapidPublic) });
  const j = sub.toJSON();
  await call(c, '/rest/v1/push_subscriptions?on_conflict=endpoint', { method: 'POST', body: { user_id: c.session.userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, prefer: 'resolution=merge-duplicates,return=minimal' });
  setCloud({ pushEndpoint: j.endpoint, pushVerifiedAt: null });
}

// Replace the queue of future, unsent reminders with the schedule worked out on this device.
export async function syncSchedule(list) {
  const c = await fresh();
  if (!c.pushEndpoint) return;
  await call(c, `/rest/v1/reminder_queue?user_id=eq.${c.session.userId}&sent_at=is.null`, { method: 'DELETE' });
  if (list.length) await call(c, '/rest/v1/reminder_queue?on_conflict=user_id,key', { method: 'POST', body: list.map(x => ({ user_id: c.session.userId, key: x.key, category: x.cat, send_at: x.sendAt, body: x.body || null })), prefer: 'resolution=ignore-duplicates,return=minimal' });
}

// Ask the server to send one test push to your devices; you then confirm whether it arrived.
export async function testPush() {
  const c = await fresh();
  await call(c, '/functions/v1/send-reminders', { method: 'POST', body: { test: true } });
}
