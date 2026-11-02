// Tabs and the Settings menu: every item fully visible on a phone and a laptop
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
const errors = []; p.on('pageerror', e => errors.push(e.message));
let pass = 0, fail = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS  ' : 'FAIL  ') + n + (x ? '  [' + x + ']' : '')); c ? pass++ : fail++; };
await p.goto('http://localhost:4319/', { waitUntil: 'networkidle0' });
await p.evaluate(async () => { const M = await import('/src/store/ministry.js'); const L = await import('/src/store/life.js'); const l = L.initialLife(); l.setupDone = true; localStorage.clear(); localStorage.setItem('shepherd_os_v1', JSON.stringify({ onboardingDone: true, name: 'Mekom', startDate: '2026-11-01', ministry: M.initialMinistry(), life: l, prayerSessions: [], events: [], scriptureMemory: [] })); sessionStorage.setItem('boethos_session', '1'); });
await p.reload({ waitUntil: 'networkidle0' });
for (const [w, h] of [[390, 844], [1366, 900]]) {
  await p.setViewport({ width: w, height: h });
  for (const [n, hash, sel] of [['people', '#/poimaino/people', '.seg'], ['shepherding', '#/poimaino/followup', '.seg'], ['home', '#/home', w < 900 ? '.folio-phone' : '.folio'], ['settings', '#/settings', '.st-nav']]) {
    await p.goto('http://localhost:4319/' + hash, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 600));
    const el = await p.$(sel); if (el && sel === '.folio-phone') { await el.$eval('.folio-btn', b => b.click()); await new Promise(r => setTimeout(r, 200)); } if (!el) { ok(`${n} at ${w}px has its tabs`, false, await p.evaluate(() => document.querySelector('h1')?.textContent)); continue; }
    const cut = await p.evaluate(e => [...e.querySelectorAll('button, a')].filter(x => { const r = x.getBoundingClientRect(), pr = e.getBoundingClientRect(); return r.right > pr.right + 1 || r.left < pr.left - 1 || x.scrollWidth > x.clientWidth + 1; }).map(x => x.textContent), el);
    const aligned = sel !== '.st-nav' || w < 900 || await p.evaluate(e => [...e.querySelectorAll('button')].every(x => getComputedStyle(x).justifyContent === 'flex-start'), el);
    ok(`${n} at ${w}px: every tab fully visible${sel === '.st-nav' && w >= 900 ? ', left-aligned' : ''}`, !cut.length && aligned, cut.join());
    await el.screenshot({ path: `b13/tabs-${n}-${w}.png` });
  }
}
console.log(errors.length ? errors : 'no page errors'); console.log(`${pass}/${pass + fail} passed`);
await b.close();
