// Settings: sections, commitments, notifications and their tests
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = b.defaultBrowserContext(); await ctx.overridePermissions('http://localhost:4319', ['notifications']);
const p = await b.newPage(); await p.setViewport({ width: 1366, height: 900 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
const W = (ms = 600) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS  ' : 'FAIL  ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
await p.evaluateOnNewDocument(() => { window.__notes = []; const orig = ServiceWorkerRegistration.prototype.showNotification; ServiceWorkerRegistration.prototype.showNotification = function (t, o) { window.__notes.push(o.body); return orig.call(this, t, o); }; const N = window.Notification; window.Notification = function (t, o) { window.__notes.push(o.body); return new N(t, o); }; window.Notification.permission = 'granted'; window.Notification.requestPermission = async () => 'granted'; });
await p.goto('http://localhost:4319/', { waitUntil: 'networkidle0' });
await p.evaluate(async () => {
  const M = await import('/src/store/ministry.js'); const L = await import('/src/store/life.js');
  const today = new Date().toLocaleDateString('en-CA');
  const l = L.initialLife(); l.setupDone = true;
  localStorage.clear(); localStorage.setItem('shepherd_os_v1', JSON.stringify({ onboardingDone: true, name: 'Mekom', startDate: today, ministry: M.initialMinistry(), life: l, profile: { role: 'Bacenta leader', location: 'Birmingham', links: {}, otherCommitments: ['software engineering', 'piano'] }, prayerSessions: [], events: [], scriptureMemory: [] })); sessionStorage.setItem('boethos_session', '1');
});
await p.reload({ waitUntil: 'networkidle0' });
await p.goto('http://localhost:4319/#/settings', { waitUntil: 'networkidle0' }); await W(900);
ok('every section is on the page', (await p.$$eval('.st-nav button', els => els.map(e => e.textContent))).join() === 'You,Your life,Your rhythm,Notifications,Phone and cloud,Your data,Start over,About');
ok('old commitment words become commitments', (await p.$$eval('.st-commits li', els => els.length)) === 2);
// your Bacenta, separate from your church
await p.evaluate(() => { const f = [...document.querySelectorAll('.st-f')].find(x => x.textContent.startsWith('Your Bacenta')).querySelector('input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(f, 'Grace Bacenta'); f.dispatchEvent(new Event('input', { bubbles: true })); f.focus(); f.blur(); }); await W(400);
ok('your Bacenta has its own field and saves', (await p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')).ministry.settings.name)) === 'Grace Bacenta');
// add a commitment with times
await p.type('.st-add > input', 'Work'); await p.$$eval('.st-add button[type=submit]', els => els[0].click()); await W(400);
const st = () => p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')));
const c = (await st()).profile.commitments;
ok('a commitment saves with its days and hours', c.some(x => x.name === 'Work' && x.from === '09:00' && x.to === '17:00' && x.days.length === 5), JSON.stringify(c.at(-1)));
ok('the week view shows it', await p.$$eval('.st-blk', els => els.some(e => e.textContent.includes('Work'))));
// notifications
const rows = await p.$$eval('#notifications .st-n', els => els.length);
ok('every notification type is listed (7 walk with God + 15 shepherding)', rows === 22, String(rows));
await p.$$eval('#notifications .st-n', els => els.forEach(li => li.querySelector('.st-test').click())); await W(1500);
const notes = await p.evaluate(() => window.__notes);
ok('each Test button sends a notification (plus any real reminder due now)', notes.length >= 22, String(notes.length));
ok('test notifications carry no names', notes.every(n => !/Mekom|Ama|Grace/.test(n)));
await p.evaluate(() => { window.__notes = []; });
await p.$$eval('#notifications .st-n', els => { const r = els.find(li => li.textContent.includes('Bacenta chat')); r.querySelector('.st-sw input').click(); }); await W(300);
ok('switching one type off saves', (await st()).ministry.settings.reminders.types.chat === false);
await p.$$eval('.st-status button', els => els[0].click()); await W(1500);
ok('“Test every one that’s on” skips the ones that are off', (await p.evaluate(() => window.__notes.length)) === 21, String(await p.evaluate(() => window.__notes.length)));
await p.$$eval('#notifications .st-n', els => { const r = els.find(li => li.textContent.includes('Quiet time')); r.querySelector('.st-sw input').click(); }); await W(300);
ok('a walk-with-God reminder switches off', (await st()).life.goals.reminders.quiet === false);
await p.$$eval('#notifications .st-rules .st-sw input', els => els[0].click()); await W(300);
ok('holding reminders while busy can be turned off', (await st()).profile.holdWhenBusy === false);
await p.screenshot({ path: 'b13/settings.png', fullPage: true });
for (const id of ['you', 'life', 'notifications', 'data']) { const el = await p.$('#' + id); await el.screenshot({ path: `b13/set-${id}.png` }); }
await p.setViewport({ width: 390, height: 844, isMobile: true }); await W(500);
const wide = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
ok('fits a phone screen without sideways scrolling', wide);
await p.screenshot({ path: 'b13/settings-phone.png', fullPage: true });
console.log(errors.length ? errors : 'no page errors'); console.log(`${pass}/${pass + fail} passed`);
await b.close();
