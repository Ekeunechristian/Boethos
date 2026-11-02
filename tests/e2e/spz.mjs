// Boēthos + Spoudazō: first run from empty, then every page with test data (fixture only), errors reported.
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const OUT = process.argv[2] || 'spz';
const W = +process.argv[3] || 1366, H = +process.argv[4] || 900;
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:4318/';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
const errors = [], results = [];
const ok = (name, cond, detail = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
p.on('pageerror', e => errors.push(`${p.url()}: ${e.message}`));
p.on('console', m => { if (m.type() === 'error') errors.push(`${p.url()}: ${m.text()}`); });
await p.setViewport({ width: W, height: H });
const wait = (ms = 300) => new Promise(r => setTimeout(r, ms));
const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1') || '{}'));

// 1. First run from nothing
await p.goto(URL, { waitUntil: 'networkidle0' });
await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await p.goto(URL + '#/today', { waitUntil: 'networkidle0' });
await p.reload({ waitUntil: 'networkidle0' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: `${OUT}/w1.png`, fullPage: true });
ok('first run shows the welcome page with a verse', await p.$eval('.w3-side', el => el.textContent.includes('Psalm 121')).catch(() => false));
await p.type('.w3-f input', 'Mekom');
ok('the Bacenta name is asked, not pre-filled', (await p.$$eval('.w3-f input', els => els[2].value)) === '');
await (await p.$$('.w3-f input'))[2].type('Greater Love Bacenta');
await p.$eval('.w3-foot button.primary', el => el.click()); await wait();
await p.screenshot({ path: `${OUT}/w2.png`, fullPage: true });
ok('second page is your rhythm', (await p.$eval('.w3-main h1', el => el.textContent)).includes('your rhythm'));
await p.$eval('.w3-foot button.primary', el => el.click()); await wait(600);
let s = await S();
ok('finishing lands on Boēthos', (await p.evaluate(() => location.hash)) === '#/home', await p.evaluate(() => location.hash));
ok('name, Bacenta and meeting times saved', s.name === 'Mekom' && s.ministry.settings.name === 'Greater Love Bacenta' && s.ministry.settings.times.sat !== '', JSON.stringify(s.ministry.settings.times));
ok('rhythm saved and set up', s.life.setupDone && s.life.goals.prayerMinutes === 180 && s.life.goals.prayerTimes.length === 3);

// 2. A fresh visit always opens on Boēthos
await p.goto(URL + '#/word', { waitUntil: 'networkidle0' });
await p.evaluate(() => sessionStorage.clear());
await p.reload({ waitUntil: 'networkidle0' });
await wait(400);
ok('a new session opens on Boēthos, whatever the address', (await p.evaluate(() => location.hash)) === '#/home');
await p.goto(URL + '#/word', { waitUntil: 'networkidle0' });
await wait(300);
ok('within the session, links work normally', (await p.evaluate(() => location.hash)) === '#/word');
await p.goto(URL + '?go#/poimaino', { waitUntil: 'networkidle0' });
await p.evaluate(() => sessionStorage.clear());
await p.goto(URL + '?go#/poimaino', { waitUntil: 'networkidle0' }); await wait(400);
ok('a notification link (?go) opens where it points', (await p.evaluate(() => location.hash)) === '#/poimaino');

// 3. Recording the real thing from Today
await p.goto(URL + '#/today', { waitUntil: 'networkidle0' }); await wait();
ok('Today has no phases or steps', !(await p.evaluate(() => /Phase \d/.test(document.body.innerText))));
// Bible: the tile goes straight to the Bible page; read today's portion there
const heads = await p.$$('.dtile');
const labels = await p.$$eval('.dtile b', els => els.map(e => e.textContent));
await heads[labels.indexOf('Bible reading')].evaluate(el => el.click()); await wait();
ok('a discipline tile goes straight to its page', (await p.evaluate(() => location.hash)) === '#/word' && !(await p.$('.sheet')));
await p.type('#br-learn', 'In the beginning God.');
await p.$eval('.br-plan button.primary', el => el.click()); await wait();
s = await S();
ok('reading today\'s portion records the plan chapters', s.life.bible.length === 1 && s.life.bible[0].book === 'Genesis' && s.life.bible[0].from === 1 && s.life.bible[0].to === 3 && s.life.bible[0].learned === 'In the beginning God.', JSON.stringify(s.life.bible[0]));
ok('…and earns XP', s.events.some(e => e.kind === 'bible'));
await p.$eval('.br-own button[type=submit]', el => el.click()); await wait();
s = await S();
ok('reading outside the plan does not move it', s.life.bible.length === 2 && s.life.bible[1].plan === false && (await p.$eval('.br-portion', el => el.textContent)).startsWith('Genesis 4'));
// Prayer: the tile opens the log with today's prayer times
await p.goto(URL + '#/today', { waitUntil: 'networkidle0' }); await wait();
const pt = await p.$$('.dtile');
await pt[labels.indexOf('Prayer')].evaluate(el => el.click()); await wait();
await p.$eval('.ps-times .pt-chips button', el => el.click()); await wait();
s = await S();
ok('ticking a prayer time is recorded for today', Object.keys(Object.values(s.life.prayerTimes)[0] || {}).length === 1);
await p.$$eval('.ps-kind button', els => els.find(e => e.textContent.includes('New kind')).click()); await wait(100);
await p.type('.ps-kind input', 'Night vigil'); await p.$$eval('.ps-kind button', els => els.find(e => e.textContent === 'Add').click()); await wait(100);
await p.$eval('.sheet-foot button.primary', el => el.click()); await wait();
s = await S();
ok('a new kind of prayer is added and used', (s.life.customKinds || []).includes('Night vigil') && s.prayerSessions.some(x => x.category === 'Night vigil'));
// Prayer points: a new category
await p.goto(URL + '#/prayer/points', { waitUntil: 'networkidle0' }); await wait();
await p.$eval('.pp-new', el => el.click()); await wait(100); await p.type('.pp-add input', 'Campus'); await p.keyboard.press('Enter'); await wait();
s = await S();
ok('a prayer-point category is added', (s.life.customCats || []).includes('Campus') && (await p.$$eval('.pp-cats button', els => els.some(e => e.textContent.startsWith('Campus')))));
// Fasting on repeat
await p.goto(URL + '#/prayer/fasting', { waitUntil: 'networkidle0' }); await wait();
await p.$$eval('.day-chips button', els => els.find(e => e.textContent === 'Tue').click()); await wait(100);
await p.$$eval('form.card button[type=submit]', els => els.find(e => e.textContent === 'Set it').click()); await wait();
s = await S();
ok('a recurring fast is set', (s.life.fastPlans || []).length === 1 && s.life.fastPlans[0].days.includes(2) && s.life.fastPlans[0].until > s.life.fastPlans[0].from);
// Quiet time: one flow, joined to the Bible reading plan
await p.goto(URL + '#/quiet', { waitUntil: 'networkidle0' }); await wait();
const bibleBefore = (await S()).life.bible.length;
await p.type('#q-heard', 'He leads me.'); await p.type('#q-apply', 'Rest in Him today.');
await p.$eval('.qf-foot button.primary', el => el.click()); await wait();
s = await S();
const qt = s.life.quietTimes[0];
ok('a quiet time is kept with what God said', s.life.quietTimes.length === 1 && qt.heard === 'He leads me.' && qt.source === 'bible');
ok('the Bible chapter is marked read in the plan', s.life.bible.length === bibleBefore + 1 && qt.passage === `${s.life.bible[s.life.bible.length - 1].book} ${s.life.bible[s.life.bible.length - 1].from}`);
ok('the kept morning is shown', !!(await p.$('.qf-kept')));
// Study topic
await p.goto(URL + '#/word/study', { waitUntil: 'networkidle0' }); await wait();
await p.$$eval('.topic .tp-foot button', els => els.find(e => e.textContent === 'Focus on this').click()); await wait();
await p.type('#sw-l', 'Apologetics begins with a holy life.');
await p.$eval('.sw-new button[type=submit]', el => el.click()); await wait();
s = await S();
ok('choosing a topic and writing what you learned', s.life.study.current && s.life.studyNotes.length === 1 && s.life.studyNotes[0].topicId === s.life.study.current);
await p.goto(URL + '#/word/journal', { waitUntil: 'networkidle0' }); await wait();
ok('the Word journal holds Bible and study entries', (await p.$$('.jr-list li')).length === 4 && (await p.$$eval('.jw-tag', els => new Set(els.map(e => e.textContent)).size)) === 3);
await p.goto(URL + '#/word/memory', { waitUntil: 'networkidle0' }); await wait(300);
ok('the old memory address opens the journal', (await p.evaluate(() => location.hash)) === '#/word/journal');
// Library: a book, a lesson, a message with its link and topic, a camp, and the journal
await p.goto(URL + '#/library', { waitUntil: 'networkidle0' }); await wait();
await p.type('#bk-t', 'Church Growth'); await p.type('#bk-p', '300');
await p.$$eval('form.card button[type=submit]', els => els.find(e => e.textContent.includes('Add')).click()); await wait();
s = await S();
ok('a book is added and becomes the one you are reading', s.life.books.some(x => x.title === 'Church Growth' && x.status === 'reading'));
await p.type('#rl-p', '12'); await p.type('#rl-l', 'Growth comes from prayer and visitation.');
await p.$$eval('.lb-now button[type=submit]', els => els[0].click()); await wait();
s = await S();
ok('reading is recorded with what you learned', s.life.readingLog.some(r => r.learned === 'Growth comes from prayer and visitation.') && s.life.books.find(x => x.title === 'Church Growth').pagesRead === 12);
await p.goto(URL + '#/library/messages', { waitUntil: 'networkidle0' }); await wait();
await p.type('#ms-l', 'youtube.com/watch?v=abc'); await p.type('#ms-t', 'The Art of Shepherding');
await p.type('#ms-k', 'Visit the sheep.'); await p.$$eval('form.card button[type=submit]', els => els.find(e => e.textContent === 'Save message').click()); await wait();
s = await S();
const msg = s.life.listening.find(x => x.title === 'The Art of Shepherding');
ok('a message is saved with its link and topic', msg && msg.link === 'https://youtube.com/watch?v=abc' && msg.category === 'Prayer' && msg.kind === 'message');
ok('…and can be opened from the list', (await p.$$eval('.lb-ml a', els => els.map(a => a.getAttribute('href')))).includes('https://youtube.com/watch?v=abc'));
await p.goto(URL + '#/library/camps', { waitUntil: 'networkidle0' }); await wait();
await p.type('#cp-t', 'Shepherds camp'); await p.type('#cp-k', 'Loyalty.');
await p.$$eval('form.card button[type=submit]', els => els.find(e => e.textContent === 'Save camp').click()); await wait();
s = await S();
ok('a camp is saved', s.life.listening.some(x => x.kind === 'camp' && x.title === 'Shepherds camp'));
await p.goto(URL + '#/library/journal', { waitUntil: 'networkidle0' }); await wait();
ok('the library journal gathers books, messages and camps', (await p.$$('.jr-list li')).length === 3);
await p.goto(URL + '#/library/listening', { waitUntil: 'networkidle0' }); await wait(300);
ok('the old messages address still works', (await p.evaluate(() => location.hash)) === '#/library/messages');
// Every page carries Scripture
const PAGES = [['home', '#/home'], ['home-activity', '#/home/activity'], ['home-achievements', '#/home/achievements'], ['home-reviews', '#/home/reviews'], ['home-calendar', '#/home/calendar'],
  ['today', '#/today'], ['quiet', '#/quiet'], ['quiet-journal', '#/quiet/journal'], ['quiet-character', '#/quiet/character'],
  ['prayer', '#/prayer'], ['points', '#/prayer/points'], ['fasting', '#/prayer/fasting'], ['word', '#/word'], ['study', '#/word/study'], ['journal', '#/word/journal'],
  ['library', '#/library'], ['messages', '#/library/messages'], ['camps', '#/library/camps'], ['lib-journal', '#/library/journal'], ['settings', '#/settings'],
  ['pm-dash', '#/poimaino'], ['pm-people', '#/poimaino/people'], ['pm-services', '#/poimaino/services'], ['pm-follow', '#/poimaino/followup'], ['pm-sermons', '#/poimaino/sermons'], ['pm-campaigns', '#/poimaino/campaigns'], ['pm-settings', '#/poimaino/settings']];
const noVerse = [];
for (const [name, hash] of PAGES) {
  await p.goto(URL + hash, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready); await wait(200);
  const broken = await p.$('pre.small.muted');
  if (broken) errors.push(`${name}: page crashed: ${await p.evaluate(el => el.textContent, broken)}`);
  if (!(await p.$('.page-verse, .ph-verse, .hero-verse'))) noVerse.push(name);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}
ok('every page carries a verse', noVerse.length === 0, noVerse.join(', '));
ok('the home page has no section navigation bar', await (async () => { await p.goto(URL + '#/home', { waitUntil: 'networkidle0' }); return !(await p.$('.sec-bar')) && !(await p.$('.mainnav')); })());
const old = [];
for (const h of ['#/path', '#/path/phase-1', '#/review', '#/review/journal', '#/prayer/scripture', '#/prayer/disciplines', '#/flock']) { await p.goto(URL + h); await wait(350); old.push(`${h}→${await p.evaluate(() => location.hash)}`); }
ok('old addresses redirect', !old.some(x => x.endsWith('→#/path') || x.includes('→#/review')), old.join(' '));
console.log(results.join('\n'));
console.log(errors.length ? [...new Set(errors)].join('\n') : 'no page errors');
await b.close();
