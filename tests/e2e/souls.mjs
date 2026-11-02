// People vs soul list, invitations every week, sermons with materials and a preaching view
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
  [['ama', 'Ama Mensah', 'member', 'bham'], ['esi', 'Esi Owusu', 'visitor', 'bham'], ['yaw', 'Yaw Darko', 'contact', 'bham'], ['ben', 'Ben Carter', 'contact', 'uk'], ['tom', 'Tom Ndi', 'prayer', 'abroad']]
    .forEach(([id, name, membership, area]) => R({ type: 'M_PERSON_ADD', data: { id, name, membership, area, country: area === 'abroad' ? 'Cameroon' : '', phone: '07700900111' } }, back(30)));
  R({ type: 'M_ENCOUNTER_ADD', data: { personId: 'yaw', date: back(3), gospel: true } });
  const sat = M.meetingList(m, today, 3).filter(x => x.type === 'sat' && x.date < today).slice(-1)[0];
  ['ama', 'esi'].forEach(id => R({ type: 'M_ATTEND', key: sat.key, personId: id, value: 'present' }, sat.date)); R({ type: 'M_SUBMIT', key: sat.key }, sat.date);
  R({ type: 'M_SERMON_ADD', data: { id: 'old', title: 'The Good Shepherd', date: back(11), scriptures: 'John 10:1-18', stage: 7, stagesDone: { 1: back(14), 6: back(11), 7: back(10) } } });
  const l = L.initialLife(); l.setupDone = true;
  localStorage.clear(); localStorage.setItem('shepherd_os_v1', JSON.stringify({ onboardingDone: true, name: 'Mekom', startDate: back(20), ministry: m, life: l, prayerSessions: [], events: [], scriptureMemory: [] })); sessionStorage.setItem('boethos_session', '1');
});
await p.reload({ waitUntil: 'networkidle0' });
const go = async (h) => { await p.goto('http://localhost:4319/' + h, { waitUntil: 'networkidle0' }); await W(800); };
const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')));
const bal = () => p.evaluate(() => { const c = document.querySelector('.cols'); return [...c.children].map(x => Math.round(x.getBoundingClientRect().height)).join('/'); });
const balanced = (s) => s.split('/')[0] === s.split('/')[1];
const names = () => p.$$eval('.pr-row .pr-t b', els => els.map(e => e.textContent));

// People: only those who have come to church
await go('#/poimaino/people');
ok('People lists only those who have come to church', (await names()).join() === 'Ama Mensah,Esi Owusu', (await names()).join());
ok('a visitor with one visit shows as a first timer', await p.$$eval('.pr-row', els => els.some(e => e.textContent.includes('Esi Owusu') && e.textContent.includes('First timer'))));
ok('People is balanced', balanced(await bal()), await bal());
await p.screenshot({ path: 'b13/people.png', fullPage: true });

// Soul list: church, encounters, and those you pray for
await go('#/poimaino/evangelism/souls');
ok('the soul list holds everyone', (await names()).length === 5, (await names()).join());
const ways = await p.$$eval('.sl-way', els => els.map(e => e.querySelector('b').textContent + ':' + e.querySelector('em').textContent));
ok('three ways in are counted', ways.join() === 'Came to church:2,Met on evangelism:1,Added by you:2', ways.join());
await p.$$eval('.sl-where button', els => els.find(b => b.textContent.includes('Outside')).click()); await W(300);
ok('the place filter finds people abroad', (await names()).join() === 'Tom Ndi');
ok('countries are listed', await p.$$eval('.sl-places li.sub', els => els.some(e => e.textContent.includes('Cameroon'))));
await p.$$eval('.sl-where button', els => els[0].click()); await W(200);
// add someone to pray for, abroad
await p.$$eval('.pr-bar button.primary', els => els[0].click()); await W(300);
await p.type('#pf-name', 'Marie Fon');
await p.$$eval('.pf-area button', els => els.find(b => b.textContent.includes('Outside')).click()); await W(100);
await p.type('#pf-country', 'Cameroon');
await p.evaluate(() => { const pk = [...document.querySelectorAll('.sheet .field')].find(f => f.textContent.startsWith('Who they are')); pk.querySelector('button').click(); }); await W(200);
await p.evaluate(() => { const o = [...document.querySelectorAll('[role="option"], .picker-list button, .pk-list button')].find(b => b.textContent.includes('Someone I pray for')); o && o.click(); }); await W(200);
await p.$$eval('.sheet-foot button.primary', els => els[0].click()); await W(500);
const marie = (await S()).ministry.people.find(x => x.name === 'Marie Fon');
ok('someone added from the soul list keeps where they live', marie && marie.area === 'abroad' && marie.country === 'Cameroon', JSON.stringify(marie && { m: marie.membership, a: marie.area, c: marie.country }));
ok('…and is not on People', !(await (async () => { await go('#/poimaino/people'); return names(); })()).includes('Marie Fon'));
await go('#/poimaino/evangelism/souls');
ok('the soul list is balanced', balanced(await bal()), await bal());
await p.screenshot({ path: 'b13/souls.png', fullPage: true });

// Telepastoring: the whole soul list, once a week
await go('#/poimaino/evangelism/invitations');
ok('the old Invitations address opens Telepastoring', await p.evaluate(() => !!document.querySelector('.tl-pace')));
ok('Evangelism has no Invitations tab any more', await (async () => { await go('#/poimaino/evangelism'); return p.$$eval('.seg button', els => !els.some(b => b.textContent.includes('Invitations'))); })());
await p.evaluate(async () => { const s = JSON.parse(localStorage.getItem('shepherd_os_v1')); const wd = new Date().getDay(); s.ministry.people.forEach(x => { x.callDay = wd; }); localStorage.setItem('shepherd_os_v1', JSON.stringify(s)); });
await go('#/poimaino/followup/telepastoring'); await p.reload({ waitUntil: 'networkidle0' }); await W(800);
const rows = () => p.$$eval('.tl-g', els => els.map(e => e.className.split(' ').pop() + ':' + e.querySelectorAll('.tl-item').length).join());
ok('everyone on the soul list is on the rota', (await rows()) === 'today:6', await rows());
await p.screenshot({ path: 'b13/tele.png', fullPage: true });
const record = async (name) => p.$$eval('.tl-item', (els, n) => els.find(e => e.textContent.includes(n)).querySelector('.tl-acts button').click(), name);
// no response → retry booked
await record('Yaw Darko'); await W(200);
await p.$$eval('.tl-n', els => els[0].click()); await W(100);
await p.$$eval('.tl-retry button', els => els.find(b => b.textContent.includes('Message now')).click()); await W(400);
ok('no response books a retry, shown under Try again', (await rows()).includes('retry:1'), await rows());
// responded, invited, coming, with a follow-up
await record('Esi Owusu'); await W(200);
await p.$$eval('.tl-y', els => els[0].click()); await W(100);
await p.$$eval('.tl-row .tl-chips button', els => els.find(b => b.textContent.startsWith('Saturday')).click()); await W(100);
await p.$$eval('.tl-row .tl-chips button', els => els.find(b => b.textContent === 'Yes').click()); await W(100);
await p.type('.tl-next input', 'Offer her a lift on Saturday');
await p.$$eval('.tl-save button', els => els[0].click()); await W(400);
const st = (await S()).ministry;
ok('a response records the invitation and their answer', st.invitations.some(i => i.personId === 'esi' && i.meetingKey.startsWith('sat:') && i.status === 'confirmed'));
ok('…and the follow-up goes to the queue', st.followUps.some(f => f.personId === 'esi' && f.title === 'Offer her a lift on Saturday' && f.status === 'planned'));
// the retry answered
await p.$$eval('.tl-g.retry .tl-item .tl-acts button', els => els[els.length - 1].click()); await W(200);
await p.$$eval('.tl-y', els => els[0].click()); await p.$$eval('.tl-save button', els => els[0].click()); await W(400);
ok('answering a retry closes it', !(await rows()).includes('retry') && (await S()).ministry.followUps.filter(f => f.teleRetry && f.status === 'planned').length === 0, await rows());
ok('the people reached are counted in the week figure', (await p.$eval('.tl-pace-n b', e => e.textContent)) === '2');
ok('telepastoring is balanced', balanced(await bal()), await bal());
await p.screenshot({ path: 'b13/tele-after.png', fullPage: true });
// reminders: several a day, with a verse
const body = await p.evaluate(async () => { const M = await import('/src/store/ministry.js'); const s = JSON.parse(localStorage.getItem('shepherd_os_v1')); const today = new Date().toLocaleDateString('en-CA'); const l = M.alerts(s.ministry, today, '13:30').filter(a => a.tele); return [l[0]?.key, M.reminderBody(l)]; });
ok('the reminder repeats at each time and carries a verse', /calls:\d{4}-\d\d-\d\d:13:00/.test(body[0]) && body[1].startsWith('Time to telepastor. “'), body.join(' | '));
// the week's rules
ok('people on a day that misses their deadline are flagged', await p.evaluate(() => !!document.querySelector('.tl-fix')));
await p.$$eval('.tl-fix button', els => els[0].click()); await W(400);
const days = (await S()).ministry.people.map(x => `${x.area || 'bham'}:${x.callDay}`);
ok('Arrange puts Birmingham on Monday–Wednesday and everyone else on Thursday or Friday', days.every(d => { const [a, c] = d.split(':'); return a === 'bham' ? ['1', '2', '3'].includes(c) : ['4', '5'].includes(c); }), days.join());
ok('the week board shows Monday to Friday', (await p.$$eval('.tl-dt-h b', els => els.map(e => e.textContent))).join() === 'Monday,Tuesday,Wednesday,Thursday,Friday');
const rules = await p.evaluate(async () => {
  const M = await import('/src/store/ministry.js');
  const s = JSON.parse(localStorage.getItem('shepherd_os_v1')).ministry;
  const mon = M.mondayOf(new Date().toLocaleDateString('en-CA'));
  const fresh = { ...s, followUps: [] };
  const wed = M.addDays(mon, 2), sat = M.addDays(mon, 5), sun = M.addDays(mon, 6);
  const paceWed = M.telePace(fresh, wed);
  const satList = M.callsToday(fresh, sat);
  const wedAlert = M.alerts(fresh, wed, '10:00').some(a => a.key.startsWith('tele-bham:'));
  const sunTele = M.alerts(fresh, sun, '19:00').some(a => a.tele);
  const sched = M.reminderSchedule({ ...fresh, settings: { ...fresh.settings, reminders: { ...fresh.settings.reminders, enabled: true } } }, mon).filter(x => x.cat === 'tele');
  const sunSched = sched.some(x => x.key.includes(sun));
  return { tone: paceWed.tone, expected: paceWed.expected, sat: satList.length === M.teleWeek(fresh, sat).length && satList.every(x => x.sat), wedAlert, sunTele, sunSched, perDay: sched.filter(x => x.key.includes(mon)).length };
});
ok('on a Wednesday with nobody reached, the pace is red', rules.tone === 'bad' && rules.expected > 0, JSON.stringify(rules));
ok('Saturday lists everyone for wake-up and preparation calls', rules.sat);
ok('on Wednesday, Birmingham before Thursday is urgent', rules.wedAlert);
ok('Sunday has no telepastoring reminder', !rules.sunTele && !rules.sunSched);
ok('reminders come several times a day', rules.perDay === 3, String(rules.perDay));
await p.screenshot({ path: 'b13/tele-week.png', fullPage: true });
// stage 5
ok('stage 5 is Son', await p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')).ministry.settings.stages[5].label === 'Son'));

// The day tabs: pick a day and act on everyone on it
await go('#/poimaino/followup/telepastoring');
await p.$$eval('.tl-dt', els => els[3].click()); await W(300);
ok('picking a day lists its people with status, actions and a day to move them to', await p.$$eval('.tl-daylist .tl-item', els => els.length > 0 && els.every(e => e.querySelector('.tl-pill') && e.querySelector('.tl-move') && e.querySelector('.tl-acts button'))));
await p.screenshot({ path: 'b13/tele-board.png', fullPage: true });
// An encounter: its next steps are to-dos, not done
await go('#/poimaino/evangelism');
await p.$$eval('button', els => els.find(b => b.textContent.includes('Record an encounter')).click()); await W(300);
await p.type('#en-name', 'John Test');
await p.$$eval('.enc-form button[type=submit]', els => els[0].click()); await W(500);
ok('an encounter shows what is still to do', await p.$$eval('.enc-next', els => els.some(e => e.textContent.includes('pray today'))));
await go('#/poimaino/followup');
const q = await p.evaluate(() => ({ done: document.querySelector('.fq-today-n b').textContent, btn: [...document.querySelectorAll('.fq-item')].find(e => e.textContent.includes('John Test')).querySelector('.fq-mark').textContent }));
ok('the queue says “Mark as prayed”, and nothing counts as done', q.btn === 'Mark as prayed' && q.done === '0', JSON.stringify(q));
await p.screenshot({ path: 'b13/enc-queue.png', fullPage: true });
// A tag when adding, and a new convert's first steps
await go('#/poimaino/people');
await p.$$eval('.pr-bar button.primary', els => els[0].click()); await W(300);
await p.type('#pf-name', 'Grace New');
await p.$$eval('.pf-area button', els => els.find(b => b.textContent === 'New convert').click()); await W(100);
await p.$$eval('.sheet-foot button.primary', els => els[0].click()); await W(600);
ok('choosing New convert opens their first steps', await p.evaluate(() => document.body.textContent.includes('Their first steps')));
await p.screenshot({ path: 'b13/convert.png', fullPage: false });
await p.$$eval('.sheet-foot button.primary', els => els[0].click()); await W(500);
const gn = (await S()).ministry;
const g = gn.people.find(x => x.name === 'Grace New');
const steps = gn.followUps.filter(f => f.personId === g.id && f.convert);
ok('saving records it and plans the steps: call, visit, prayer, scripture, invitation', g.savedOn && g.stage === 1 && steps.length === 5 && steps.some(f => f.kind === 'visit'), `${g.stage} ${steps.map(f => f.kind)}`);
ok('People shows them as a new convert', await p.$$eval('.pr-row', els => els.some(e => e.textContent.includes('Grace New') && e.textContent.includes('New convert'))));
await go('#/poimaino/people/' + g.id);
ok('their page says when they gave their life, with steps still to do', await p.$eval('.gl-banner', e => e.textContent.includes('Gave their life') && e.textContent.includes('5 first steps')));

// Sermons
await go('#/poimaino/sermons');
ok('the next Thursday is at the top', await p.$eval('.sm-next h2', e => e.textContent) === 'Nothing started yet');
ok('past sermons are listed', await p.$$eval('.sm-list li', els => els.some(e => e.textContent.includes('The Good Shepherd') && e.textContent.includes('Preached'))));
ok('sermons are balanced', balanced(await bal()), await bal());
await p.screenshot({ path: 'b13/sermons.png', fullPage: true });
await p.$$eval('.sm-next button.primary', els => els[0].click()); await W(700);
await p.type('.sm-add-row input', 'https://youtu.be/dQw4w9WgXcQ'); await W(100);
await p.$$eval('.sm-add-row button', els => els[0].click()); await W(300);
ok('a YouTube link is recognised', await p.$$eval('.sm-files li', els => els.some(e => e.className.includes('k-youtube'))));
await p.evaluate(() => { const fs = [...document.querySelectorAll('.field')]; const set = (lab, v) => { const f = fs.find(x => x.querySelector('label')?.textContent === lab); const el = f.querySelector('input, textarea'); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.focus(); el.blur(); }; set('Title', 'Feed my sheep'); set('Main points', '1. Love him\n2. Feed them\n3. Follow him'); });
await W(400);
ok('the sermon page is balanced', balanced(await bal()), await bal());
await p.screenshot({ path: 'b13/sermon.png', fullPage: true });
await p.$$eval('.head-actions a', els => els.find(a => a.textContent.includes('Preach')).click()); await W(700);
ok('the preaching view shows the points, large and numbered', (await p.$$eval('.pc-points li', els => els.map(e => e.textContent))).join() === 'Love him,Feed them,Follow him');
await p.screenshot({ path: 'b13/preach.png', fullPage: true });
await go('#/poimaino/sermons');
ok('the started sermon is now at the top', await p.$eval('.sm-next h2', e => e.textContent) === 'Feed my sheep');
console.log(errors.length ? errors : 'no page errors'); console.log(`${pass}/${pass + fail} passed`);
await b.close();
