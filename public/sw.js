// Boēthos' service worker: keeps the app working offline, sends the daily reminder where the browser allows it,
// and shows push reminders from your own server (installed app; Android Chrome and iOS 16.4+ home-screen apps).
const VERSION = 'boethos-v3';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'stillwaters-state').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Pages: network first so updates arrive, the cache when offline. Everything else: cache first, refreshed in the background.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname === '/__state') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { caches.open(VERSION).then(c => c.put('/', res.clone())); return res; }).catch(() => caches.match('/')));
    return;
  }
  const sameOrFonts = url.origin === location.origin || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com');
  if (!sameOrFonts) return;
  e.respondWith(caches.match(req).then(hit => {
    const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') caches.open(VERSION).then(c => c.put(req, res.clone())); return res; }).catch(() => hit);
    return hit || fresh;
  }));
});

// Background reminder: the page leaves a snapshot of today in the cache; check it when the browser wakes us.
async function remindIfDue() {
  const res = await caches.match('/__state');
  if (!res) return;
  const s = await res.json();
  const today = new Date().toISOString().slice(0, 10);
  if (!s.reminder?.enabled || s.date !== today) return;
  const sent = await caches.match('/__notified');
  if (sent && (await sent.text()) === today) return;
  const [h, m] = s.reminder.time.split(':').map(Number);
  const now = new Date();
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
  if (s.tasksLeft <= 0 && s.xpToday >= s.goal) return;
  const parts = [];
  if (s.tasksLeft > 0) parts.push(`${s.tasksLeft} ${s.tasksLeft === 1 ? 'task' : 'tasks'} left today`);
  if (s.streak > 0) parts.push(`your ${s.streak}-day streak is on the line`);
  await self.registration.showNotification('Boēthos', { body: parts.join(' · '), icon: '/icon-192.png', badge: '/icon-192.png', tag: 'stillwaters-daily', data: { url: '/#/today' } });
  const c = await caches.open('stillwaters-state');
  await c.put('/__notified', new Response(today));
}

self.addEventListener('periodicsync', (e) => { if (e.tag === 'daily-reminder') e.waitUntil(remindIfDue()); });

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data?.url || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => 'focus' in c);
    if (open) { open.navigate(target); return open.focus(); }
    return self.clients.openWindow(target);
  }));
});

// Push from your own server (Supabase, see docs/CLOUD_SETUP.md). The payload is generic by design:
// lock screens are not private, so no names, notes or care details are ever sent.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const body = typeof d.body === 'string' && d.body.length < 140 ? d.body : 'Greater Love: something needs you.';
  e.waitUntil(self.registration.showNotification(d.title || 'Boēthos', { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: d.tag || 'boethos-poimaino', data: { url: d.url || '/?go#/home' } }));
});
