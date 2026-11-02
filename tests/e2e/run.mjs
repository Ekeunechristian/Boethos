// Runs every browser test against a fresh dev server on port 4319, one after another.
// Usage: npm run test:e2e   (needs Google Chrome installed; screenshots go to tests/e2e/shots)
import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, 'shots');
['b7', 'b8', 'b9', 'b10', 'b11', 'b12', 'b13'].forEach(d => mkdirSync(join(shots, d), { recursive: true }));

const server = await createServer({ root: join(here, '..', '..'), server: { port: 4319, strictPort: true }, logLevel: 'error' });
await server.listen();

const only = process.argv.slice(2);
const files = readdirSync(here).filter(f => f.endsWith('.mjs') && f !== 'run.mjs' && (!only.length || only.some(o => f.startsWith(o))));
let failed = 0;
for (const f of files) {
  // run it without blocking: this process also serves the app the test is using
  const r = await new Promise(res => {
    const c = spawn(process.execPath, [join(here, f)], { cwd: shots });
    let o = ''; c.stdout.on('data', d => { o += d; }); c.stderr.on('data', d => { o += d; });
    c.on('close', status => res({ status, out: o }));
  });
  const out = r.out;
  const bad = out.split('\n').filter(l => l.startsWith('FAIL') || /Error/.test(l));
  const score = out.match(/(\d+)\/(\d+) passed/);
  const ok = r.status === 0 && !bad.length;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${f.padEnd(16)} ${score ? score[0] : out.includes('no page errors') ? 'all checks passed' : ''}`);
  bad.slice(0, 6).forEach(l => console.log('      ' + l));
}
await server.close();
console.log(failed ? `\n${failed} of ${files.length} suites failed` : `\nAll ${files.length} suites passed`);
process.exit(failed ? 1 : 0);
