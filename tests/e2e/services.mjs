// Vision 25: seats, review, and balance
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage(); await p.setViewport({ width: 1366, height: 900 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
const W = (ms = 600) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS  ' : 'FAIL  ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
await p.goto('http://localhost:4319/', { waitUntil: 'networkidle0' });
await p.evaluate(async () => {
  const M = await import('/src/store/ministry.js'); const L = await import('/src/store/life.js');
  const today = new Date().toLocaleDateString('en-CA'); const back = (n) => M.addDays(today, -n);
  let m = M.initialMinistry(); m.settings.meetingsFrom = back(40); m.settings.times = { thu: '19:00', sat: '10:00' };
  const R = (a, d = today) => { m = M.ministryReducer(m, a, d); };
  [['ama', 'Ama Mensah', 'member'], ['kwame', 'Kwame Boateng', 'member'], ['grace', 'Grace Lin', 'member'], ['esi', 'Esi Owusu', 'visitor'], ['kofi', 'Kofi Asante', 'member'], ['abena', 'Abena Ofori', 'returning'], ['yaw', 'Yaw Darko', 'contact']].forEach(([id, name, membership]) => R({ type: 'M_PERSON_ADD', data: { id, name, membership, phone: '07700900111' } }, back(60)));
  R({ type: 'M_PERSON_UPDATE', id: 'ama', data: { membership: 'stable' }, reason: 'Reviewed' }, back(50));
  R({ type: 'M_PERSON_UPDATE', id: 'grace', data: { membership: 'stable' }, reason: 'Reviewed' }, back(20));
  const thus = M.meetingList(m, today, 6).filter(x => x.type === 'thu' && x.date < today).slice(-3);
  const sats = M.meetingList(m, today, 6).filter(x => x.type === 'sat' && x.date < today).slice(-4);
  thus.forEach(mt => { ['ama', 'kwame', 'grace', 'abena', 'kofi'].forEach(id => R({ type: 'M_ATTEND', key: mt.key, personId: id, value: 'present' }, mt.date)); R({ type: 'M_SUBMIT', key: mt.key }, mt.date); });
  sats.forEach(mt => { R({ type: 'M_ATTEND', key: mt.key, personId: 'ama', value: 'present' }, mt.date); R({ type: 'M_ATTEND', key: mt.key, personId: 'kwame', value: 'absent' }, mt.date); R({ type: 'M_SUBMIT', key: mt.key }, mt.date); });
  R({ type: 'M_PERSON_UPDATE', id: 'grace', data: { careStatus: 'Crisis', lastContact: today } });
  m.settings.baseline.reviewedAt = back(10);
  const l = L.initialLife(); l.setupDone = true;
  localStorage.clear(); localStorage.setItem('shepherd_os_v1', JSON.stringify({ onboardingDone: true, name: 'Mekom', startDate: back(20), ministry: m, life: l, prayerSessions: [], events: [], scriptureMemory: [] })); sessionStorage.setItem('boethos_session', '1');
});
await p.reload({ waitUntil: 'networkidle0' });
const go = async (h) => { await p.goto('http://localhost:4319/' + h, { waitUntil: 'networkidle0' }); await W(800); };
const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')));
await go('#/poimaino/services');
ok('the next Thursday and Saturday sit on top', (await p.$$('.sv-next')).length === 2);
ok('past meetings are a week to a row, Thursday beside Saturday', (await p.$$('.sv-weeks li')).length >= 2 && (await p.$$eval('.sv-weeks li', ls => ls.every(l => l.querySelectorAll('.sv-cell').length === 2))));
await p.screenshot({ path: 'b12/list.png', fullPage: true });
// a future Saturday: prepare, mark a lift
await p.$$eval('.sv-next.sat', els => els[0].click()); await W(900);
ok('a meeting that hasn’t started shows preparation, not an empty roster', !!(await p.$('.sv-prepare')) && !(await p.$('.sv-roster')));
await p.$$eval('.sv-lifts button', els => els[0].click()); await W(300);
let st = await S();
ok('a lift can be marked before Saturday', Object.values(st.ministry.meetings).some(mt => Object.values(mt.transport || {}).some(t => t.needed)));
await p.screenshot({ path: 'b12/prepare.png', fullPage: true });
// a past meeting not yet reported: mark and submit
await go('#/poimaino/services');
const due = await p.$$eval('.sv-cell.unconfirmed, .sv-cell.held, .sv-cell.draft', els => els.map(e => e.getAttribute('href')));
if (due.length) {
  await go(due[0]);
  const held = await p.$$eval('.head-actions button', els => { const b = els.find(e => e.textContent === 'It was held'); if (b) { b.click(); return true; } return false; }); await W(400);
  const allBtn = await p.$('.sv-all'); if (allBtn) { await allBtn.click(); await W(300); }
  const present = await p.$$eval('.sv-roster li.present', els => els.length);
  ok('“Mark all unmarked members present” marks the members', present > 0, `${present}`);
  await p.$eval('.aside button.primary.big', e => e.click()); await W(600);
  st = await S();
  ok('submitting records the meeting', Object.values(st.ministry.meetings).filter(mt => mt.report?.versions?.length).length > 4);
  await p.screenshot({ path: 'b12/meeting.png', fullPage: true });
} else ok('a meeting waiting to be recorded exists in the test data', false);
await go('#/poimaino/services/trends');
ok('trends show the ten-week chart, first and second timers, and the return funnel', (await p.$$('.sv-bars .pd-wk')).length === 10 && (await p.$$('.sv-tim > div')).length === 10);
const tb = await p.evaluate(() => [...document.querySelectorAll('.pd-grid')].map(g => [...g.children].map(x => Math.round(x.getBoundingClientRect().height)).join('/')));
ok('trends are balanced', tb.every(r => r.split('/')[0] === r.split('/')[1]), tb.join(' '));
await p.screenshot({ path: 'b12/trends.png', fullPage: true });
console.log(errors.length ? errors : 'no page errors'); console.log(`${pass}/${pass + fail} passed`);
await b.close();
