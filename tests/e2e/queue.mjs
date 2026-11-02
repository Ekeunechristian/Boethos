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
  const F = (data) => R({ type: 'M_FOLLOW_ADD', data });
  F({ personId: 'kwame', kind: 'call', title: 'Check in about his exams', due: back(2), priority: 'high' });
  F({ personId: 'esi', kind: 'welcome', title: 'Welcome after her first Thursday', due: today });
  F({ personId: 'abena', kind: 'call', title: 'Invite for Saturday', due: back(1) });
  F({ personId: 'ama', kind: 'visit', title: 'Visit the family', due: M.addDays(today, 3), place: 'Home' });
  F({ personId: 'kofi', kind: 'prayer', title: 'Pray about the job', due: M.addDays(today, 10) });
  const l = L.initialLife(); l.setupDone = true;
  localStorage.clear(); localStorage.setItem('shepherd_os_v1', JSON.stringify({ onboardingDone: true, name: 'Mekom', startDate: back(20), ministry: m, life: l, prayerSessions: [], events: [], scriptureMemory: [] })); sessionStorage.setItem('boethos_session', '1');
});
await p.reload({ waitUntil: 'networkidle0' });
const go = async (h) => { await p.goto('http://localhost:4319/' + h, { waitUntil: 'networkidle0' }); await W(800); };
const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')));
const groups = async () => p.$$eval('.fq-group', els => els.map(e => e.querySelector('h2').textContent.replace(/\d+$/, '').trim() + ':' + e.querySelectorAll('.fq-item').length));
await go('#/poimaino/followup');
ok('the queue groups by Overdue, Today, This week and Later', (await groups()).join() === 'Overdue:2,Today:1,This week:1,Later:1', (await groups()).join());
await p.screenshot({ path: 'b12/queue.png', fullPage: true });
// Not reached moves it to Try again
await p.$$eval('.fq-group.late .fq-item', els => [...els[0].querySelectorAll('button')].find(b => b.textContent === 'Not reached').click()); await W(400);
ok('“Not reached” moves it to Try again', (await groups()).some(g => g === 'Try again:1'), (await groups()).join());
// Done today counts
await p.$$eval('.fq-group.today .fq-item button.fq-mark', els => els[0].click()); await W(200);
await p.type('.fq-done input', 'Welcomed her; coming Thursday'); await p.$$eval('.fq-done-a button.primary', els => els[0].click()); await W(400);
ok('Done records it and counts toward today', (await p.$eval('.fq-today-n b', e => e.textContent)) === '1' && (await p.$$eval('.fq-recent li b', els => els.map(e => e.textContent))).includes('Esi Owusu'));
// Later → Tomorrow
await p.$$eval('.fq-group.late .fq-item button', els => els.find(b => b.textContent.includes('Later')).click()); await W(200);
await p.$$eval('.fq-snooze button', els => els.find(b => b.textContent === 'Tomorrow').click()); await W(400);
ok('Later › Tomorrow moves it out of Overdue in one tap', !(await groups()).some(g => g.startsWith('Overdue')), (await groups()).join());
await p.$$eval('.fq-kinds button', els => els.find(b => b.textContent.startsWith('Visits')).click()); await W(300);
ok('the kind filter shows only visits', (await p.$$eval('.fq-item .fq-what', els => els.map(e => e.textContent))).every(t => t.startsWith('Visit')));
const bal = await p.evaluate(() => { const c = document.querySelector('.cols'); return [...c.children].map(x => Math.round(x.getBoundingClientRect().height)).join('/'); });
ok('the queue is balanced', bal.split('/')[0] === bal.split('/')[1], bal);
console.log(errors.length ? errors : 'no page errors'); console.log(`${pass}/${pass + fail} passed`);
await b.close();
