// The time picker: two taps on a laptop and a phone, typing works, and the heads-up setting saves
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
const errors = []; p.on('pageerror', e => errors.push(e.message));
const W = (ms = 400) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS  ' : 'FAIL  ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
await p.goto('http://localhost:4319/', { waitUntil: 'networkidle0' });
await p.evaluate(async () => { const M = await import('/src/store/ministry.js'); const L = await import('/src/store/life.js'); const l = L.initialLife(); l.setupDone = true; localStorage.clear(); localStorage.setItem('shepherd_os_v1', JSON.stringify({ onboardingDone: true, name: 'Mekom', startDate: '2026-11-01', ministry: M.initialMinistry(), life: l, prayerSessions: [], events: [], scriptureMemory: [] })); sessionStorage.setItem('boethos_session', '1'); });
await p.reload({ waitUntil: 'networkidle0' });
const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')));
for (const [w, h] of [[1366, 900], [390, 844]]) {
  await p.setViewport({ width: w, height: h, isMobile: w < 500 });
  await p.goto('http://localhost:4319/#/settings', { waitUntil: 'networkidle0' }); await W(700);
  const row = '#notifications .st-n';
  // open the follow-up time and pick 14 then :30
  const field = await p.evaluateHandle((sel) => [...document.querySelectorAll(sel)].find(li => li.textContent.includes('Follow-ups due')).querySelector('.tpk-field'), row);
  await field.click(); await W(200);
  ok(`${w}px: the panel opens with hours and minutes`, await p.evaluate(() => document.querySelectorAll('.tpk-pop .tpk-hours button').length === 24 && document.querySelectorAll('.tpk-pop .tpk-mins button').length === 12));
  const inView = await p.evaluate(() => { const r = document.querySelector('.tpk-pop').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; });
  ok(`${w}px: the panel fits on the screen`, inView);
  await p.screenshot({ path: `b13/timepicker-${w}.png` });
  await p.$$eval('.tpk-pop .tpk-hours button', els => els.find(x => x.textContent === '14').click()); await W(150);
  await p.$$eval('.tpk-pop .tpk-mins button', els => els.find(x => x.textContent === ':30').click()); await W(300);
  ok(`${w}px: two taps set 14:30 and close the panel`, (await S()).ministry.settings.reminders.followupTime === '14:30' && !(await p.$('.tpk-pop')));
}
// typing still works
await p.setViewport({ width: 1366, height: 900 });
await p.goto('http://localhost:4319/#/settings', { waitUntil: 'networkidle0' }); await W(700);
const inp = await p.evaluateHandle(() => [...document.querySelectorAll('#notifications .st-n')].find(li => li.textContent.includes('Follow-ups due')).querySelector('.tpk input'));
await inp.click({ clickCount: 3 }); await inp.type('6pm'); await p.keyboard.press('Enter'); await W(300);
ok('typing “6pm” sets 18:00', (await S()).ministry.settings.reminders.followupTime === '18:00');
// the heads-up choice
await p.$$eval('#notifications .st-rules .st-seg button', els => els.find(x => x.textContent === '15 min').click()); await W(300);
ok('the heads-up time is saved', (await S()).ministry.settings.reminders.leadMinutes === 15);
// the rhythm pill on Settings uses the picker too
ok('every time on Settings uses the picker (no browser time boxes)', await p.evaluate(() => !document.querySelector('input[type=time]') && document.querySelectorAll('.tpk').length > 5));
console.log(errors.length ? errors : 'no page errors'); console.log(`${pass}/${pass + fail} passed`);
await b.close();
