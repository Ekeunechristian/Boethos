// Poimainō dashboard: the rota, a call, PVCI, and balance
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage(); await p.setViewport({ width: 1366, height: 900 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
const W = (ms = 500) => new Promise(r => setTimeout(r, ms));
const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')));
let pass = 0, fail = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS  ' : 'FAIL  ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
await p.goto('http://localhost:4319/', { waitUntil: 'networkidle0' });
await p.evaluate(async () => {
  const M = await import('/src/store/ministry.js'); const L = await import('/src/store/life.js');
  const today = new Date().toLocaleDateString('en-CA');
  let m = M.initialMinistry(); m.settings.meetingsFrom = M.addDays(today, -14); m.settings.times = { thu: '19:00', sat: '10:00' };
  const R = (a) => { m = M.ministryReducer(m, a, today); };
  [['ama', 'Ama Mensah', 'stable'], ['kwame', 'Kwame Boateng', 'member'], ['grace', 'Grace Lin', 'member'], ['esi', 'Esi Owusu', 'visitor'], ['kofi', 'Kofi Asante', 'member'], ['abena', 'Abena Ofori', 'returning'], ['yaw', 'Yaw Darko', 'member']].forEach(([id, name, membership]) => R({ type: 'M_PERSON_ADD', data: { id, name, membership, phone: '07700900111' } }));
  const l = L.initialLife(); l.setupDone = true;
  localStorage.clear(); localStorage.setItem('shepherd_os_v1', JSON.stringify({ onboardingDone: true, name: 'Mekom', startDate: M.addDays(today, -20), ministry: m, life: l, prayerSessions: [], events: [], scriptureMemory: [] })); sessionStorage.setItem('boethos_session', '1');
});
await p.reload({ waitUntil: 'networkidle0' });

const go = async (h) => { await p.goto('http://localhost:4319/' + h, { waitUntil: 'networkidle0' }); await W(700); };
const hash = () => p.evaluate(() => location.hash);
const bal = () => p.evaluate(() => { const c = document.querySelector('.cols'); return c ? [...c.children].map(x => Math.round(x.getBoundingClientRect().height)).join('/') : '-'; });
const balanced = (b) => b === '-' || b.split('/')[0] === b.split('/')[1];
// redirects
await go('#/poimaino/outreach'); ok('old Outreach opens Evangelism', !!(await p.$('.pd-week, .card')) && (await p.$eval('h1', e => e.textContent)) === 'Evangelism');
await go('#/poimaino/people/souls'); ok('old Soul list opens under Evangelism', (await p.$eval('h1', e => e.textContent)) === 'Evangelism');
await go('#/poimaino/followup/calls'); ok('old Call list opens Telepastoring', (await p.$eval('h1', e => e.textContent)) === 'Telepastoring');
// telepastoring rota
let s = await S();
ok('everyone gets a weekday as they are added', s.ministry.people.every(x => x.callDay >= 1 && x.callDay <= 5));
const wd = new Date().getDay();
await p.evaluate((wd) => { const sel = [...document.querySelectorAll('.tl-move')][0]; const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(sel, String(wd)); sel.dispatchEvent(new Event('change', { bubbles: true })); }, wd);
await W(); s = await S();
ok('a call day is changed right on the rota', s.ministry.people.filter(x => x.callDay === wd).length >= 1);
ok('the rota page is balanced', balanced(await bal()), await bal());
// PVTI log
await go('#/poimaino/followup/pvti');
ok('the PVTI log page opens and is balanced', balanced(await bal()), await bal());
// chat page: plan a future day
await go('#/poimaino/followup/chat');
const days = await p.$$('.ct-cal button');
await days[days.length - 1].click(); await W(200);
await p.click('.ct-starters button'); await W(100);
await p.$$eval('.fr-foot button.primary', els => els[els.length - 1].click()); await W();
s = await S();
ok('a message is planned for a later day from a starter', Object.values(s.ministry.chatPlan || {}).some(t => t.startsWith('Join us for Bible study')));
ok('the chat page is balanced', balanced(await bal()), await bal());
await go('#/poimaino/evangelism/invitations');
ok('the old Invitations address opens Telepastoring', await p.evaluate(() => !!document.querySelector('.tl-pace')));
// people: needs attention
await go('#/poimaino/people/attention');
ok('Needs attention lists people with their reasons', await p.$$eval('.pr-row .why', els => els.length) > 0);
// services: count from
await go('#/poimaino/services');
ok('Services shows where counting starts', !!(await p.$('.sv-from2')));
// weekly review: the daily rhythm grid
await go('#/poimaino/week');
ok('the weekly review shows the daily rhythm and PVTI', (await p.$$('.wr-grid > i')).length === 35 && (await p.$eval('.wr-paper', e => e.textContent)).includes('PVTI'));
// home: the five daily tasks
await go('#/home');
ok('the home page shows today’s shepherding', (await p.$$('.t3-daily a')).length === 5);
// nav: Evangelism and Shepherding in the bar, Campaigns in the dashboard menu
await go('#/poimaino');
const nav = await p.$$eval('.top .np-link', els => els.map(e => e.textContent.replace(/\d+$/, '').trim()));
ok('the bar reads Dashboard, People, Services, Shepherding, Evangelism, Sermons', ['Dashboard', 'People', 'Services', 'Shepherding', 'Evangelism', 'Sermons'].every(x => nav.some(n => n.startsWith(x))) && !nav.some(n => n.startsWith('Campaigns')), nav.join(' | '));
for (const [n, h] of [['shep-tele', '#/poimaino/followup/telepastoring'], ['shep-pvti', '#/poimaino/followup/pvti'], ['shep-chat', '#/poimaino/followup/chat'], ['evan', '#/poimaino/evangelism'], ['evan-inv', '#/poimaino/evangelism/invitations'], ['attention', '#/poimaino/people/attention'], ['week', '#/poimaino/week'], ['dash', '#/poimaino']]) { await go(h); await p.screenshot({ path: `b8/${n}.png`, fullPage: true }); }
console.log(errors.length ? errors : 'no page errors'); console.log(`${pass}/${pass + fail} passed`);
await b.close();
