// The study workspace and message topics, used as a person would
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage(); await p.setViewport({ width: 1366, height: 900 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
const W = (ms = 400) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS  ' : 'FAIL  ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
await p.goto('http://localhost:4319/', { waitUntil: 'networkidle0' });
await p.evaluate(async () => { const M = await import('/src/store/ministry.js'); const L = await import('/src/store/life.js'); const l = L.initialLife(); l.setupDone = true; localStorage.clear(); localStorage.setItem('shepherd_os_v1', JSON.stringify({ onboardingDone: true, name: 'Emmanuel', startDate: '2026-11-01', ministry: M.initialMinistry(), life: l, prayerSessions: [], events: [], scriptureMemory: [] })); sessionStorage.setItem('boethos_session', '1'); });
await p.reload({ waitUntil: 'networkidle0' });
const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('shepherd_os_v1')).life);
const type = async (sel, v) => { await p.$eval(sel, (el) => { el.value = ''; }); await p.type(sel, v); };

// add your own topic, with its reminder from the start
await p.goto('http://localhost:4319/#/word/study', { waitUntil: 'networkidle0' }); await W(600);
await type('#ct-t', 'The shepherd’s heart');
await p.$$eval('form.card .sw-remind-h input', els => els[0].click()); await W(200);
await p.$$eval('form.card button[type=submit]', els => els.find(x => x.textContent.includes('Add topic')).click()); await W(400);
let l = await S();
const tp = l.customTopics.find(x => x.title === 'The shepherd’s heart');
ok('a new topic can carry its own reminder', tp && l.topicReminders[tp.id]?.on === true);
await p.$$eval('.topic', (els) => [...els.find(e => e.textContent.includes('The shepherd’s heart')).querySelectorAll('button')].find(x => x.textContent.includes('Focus')).click()); await W(600);
ok('choosing it opens the workspace', !!(await p.$('.sw-head')) && (await p.$eval('.sw-head h2', e => e.textContent)) === 'The shepherd’s heart');
// a material
await p.type('.sw-addmat input', 'The Art of Shepherding');
await p.$$eval('.sw-addmat button[type=submit]', els => els[0].click()); await W(400);
ok('a material is added to the topic', (await S()).studyMaterials.length === 1 && !!(await p.$('.sw-mats li')));
// first entry: from the book
await p.$$eval('.sw-src button', els => els.find(x => x.textContent.includes('The Art of Shepherding')).click()); await W(150);
await type('#sw-part', 'Chapters 1–2');
await type('#sw-l', 'A shepherd knows the state of his flock.');
await p.$$eval('.sw-new button[type=submit]', els => els[0].click()); await W(400);
// second entry: a Bible chapter in another version
await p.$$eval('.sw-src button', els => els.find(x => x.textContent.includes('Bible')).click()); await W(150);
await type('#sw-p', 'John 10');
await p.$$eval('.sw-vers button', els => els.find(x => x.textContent === 'NKJV').click());
await type('#sw-l', 'He calls his own sheep by name.');
await p.$$eval('.sw-new button[type=submit]', els => els[0].click()); await W(400);
l = await S();
ok('two entries on the same day, each tied to what was studied', l.studyNotes.length === 2 && l.studyNotes.some(x => x.passage === 'John 10' && x.version === 'NKJV') && l.studyNotes.some(x => x.part === 'Chapters 1–2'));
ok('both show under the topic, grouped by day', (await p.$$eval('.sw-entry', els => els.length)) === 2);
await p.$$eval('.sw-filter .pr-chips button', els => els.find(x => x.textContent.startsWith('Bible')).click()); await W(200);
ok('entries filter by material', (await p.$$eval('.sw-entry', els => els.length)) === 1);
await p.screenshot({ path: 'b13/study.png', fullPage: true });
// the journal: filter by topic
await p.goto('http://localhost:4319/#/word/journal', { waitUntil: 'networkidle0' }); await W(500);
await p.$$eval('.jw-kinds button', els => els.find(x => x.textContent === 'Study').click()); await W(200);
ok('the journal can show one topic’s learning', await p.$$eval('.jw-topics button', els => els.some(x => x.textContent.includes('The shepherd’s heart'))));
// message topics
await p.goto('http://localhost:4319/#/library/messages', { waitUntil: 'networkidle0' }); await W(500);
const hasEdit = await p.$$eval('.lb-topics-h button', els => els.length);
if (hasEdit) {
  await p.$$eval('.lb-topics-h button', els => els[0].click()); await W(200);
  await p.$$eval('.lb-topics li.editing', els => els.find(e => e.textContent.includes('Finances')).querySelector('.iv-x').click()); await W(200);
  await p.type('.lb-catadd input', 'Prophecy'); await p.$$eval('.lb-catadd button', els => els[0].click()); await W(300);
  const topics = await p.$$eval('.lb-topics li > button:first-child span', els => els.map(e => e.textContent));
  ok('message topics: a predefined one removed, your own added', !topics.includes('Finances') && topics.includes('Prophecy'), topics.join());
} else ok('message topics can be edited', false, 'no Edit topics button on this page');
console.log(errors.length ? errors : 'no page errors'); console.log(`${pass}/${pass + fail} passed`);
await b.close();
