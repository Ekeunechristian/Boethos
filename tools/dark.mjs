// Generates src/dark.css from src/index.css: every rule that sets a colour gets a dark twin under html.dark.
// Colours are mapped in OKLCH, so each keeps its hue. Light surfaces become dark (raised ones a little
// lighter, as in the light design), dark text becomes light, and shadows stay shadows.
// Runs before every dev start and build (see package.json), so new styles are always covered.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src', 'index.css'), 'utf8');

// ── colour maths: sRGB ⇄ OKLab ──
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function rgbToOklab([r, g, b]) {
  [r, g, b] = [r, g, b].map(v => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return rgb.map(v => Math.round(Math.min(1, Math.max(0, toGam(v))) * 255));
}
// Lightness map: near-white surfaces → dark surfaces (whiter = more raised), pale tints and borders → mid-dark,
// everything darker (text, accents) → light, in reverse order.
function mapL(L) {
  if (L >= 0.93) return 0.205 + (L - 0.93) * 0.8;
  if (L >= 0.8) return 0.4 - (L - 0.8) * 1.5;
  return Math.min(0.95, 1.08 - L * 0.85);
}
function darkRgb(rgb) {
  const [L, a, b] = rgbToOklab(rgb);
  const L2 = mapL(L);
  const k = L2 < 0.45 ? 0.75 : 1;            // dark surfaces a little less tinted
  return oklabToRgb([L2, a * k, b * k]);
}
const hex = (rgb) => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
const parseHex = (h) => { h = h.slice(1); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };

// Replace every colour in a value. Shadows keep a dark colour (only deeper), everything else is mapped.
function mapValue(value, prop) {
  const shadow = /shadow/.test(prop);
  return value
    .replace(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (h) => (shadow ? 'rgba(0,0,0,.35)' : hex(darkRgb(parseHex(h)))))
    .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g, (_, r, g, b, a) => {
      const al = a === undefined ? 1 : Number(a);
      if (shadow) return `rgba(0,0,0,${Math.min(0.6, al * 2.2).toFixed(2)})`;
      const [R, G, B] = darkRgb([+r, +g, +b]);
      return a === undefined ? `rgb(${R},${G},${B})` : `rgba(${R},${G},${B},${al})`;
    })
    .replace(/\b(white|#fff\b)/gi, () => hex(darkRgb([255, 255, 255])));
}

const COLOR_PROP = /^(--[\w-]+|color|background(-color|-image)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|box-shadow|text-shadow|fill|stroke|caret-color|accent-color|text-decoration(-color)?|column-rule(-color)?)$/;
const HAS_COLOR = /#(?:[0-9a-fA-F]{3}){1,2}\b|rgba?\(|\bwhite\b/;

// Prefix a selector so it only applies in dark mode
function darkSel(sel) {
  return sel.split(',').map(s => {
    s = s.trim();
    if (!s) return s;
    if (/^:root\b/.test(s)) return s.replace(/^:root/, 'html.dark');
    if (/^html\b/.test(s)) return s.replace(/^html/, 'html.dark');
    return `html.dark ${s}`;
  }).join(', ');
}

// A small brace parser: rules, and @media / @supports blocks with rules inside
function twins(css) {
  let out = '', i = 0;
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const head = css.slice(i, open).trim();
    if (head.startsWith('@media') || head.startsWith('@supports')) {
      let depth = 1, j = open + 1;
      while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      const inner = twins(css.slice(open + 1, j - 1));
      if (inner.trim()) out += `${head} {\n${inner}}\n`;
      i = j; continue;
    }
    if (head.startsWith('@')) { // @keyframes, @font-face…: skip the whole block
      let depth = 1, j = open + 1;
      while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      i = j; continue;
    }
    const close = css.indexOf('}', open);
    const body = css.slice(open + 1, close);
    i = close + 1;
    if (head.startsWith('@') || !HAS_COLOR.test(body)) continue;
    const decls = body.split(';').map(d => d.trim()).filter(Boolean).map(d => {
      const k = d.indexOf(':'); if (k < 0) return null;
      const prop = d.slice(0, k).trim(), val = d.slice(k + 1).trim();
      if (!COLOR_PROP.test(prop) && !/^background$/.test(prop)) return null;
      if (!HAS_COLOR.test(val)) return null;
      return `${prop}: ${mapValue(val, prop)}`;
    }).filter(Boolean);
    if (decls.length) out += `${darkSel(head)} { ${decls.join('; ')}; }\n`;
  }
  return out;
}

const generated = twins(src);
// Hand-set foundations on top: page, surfaces, ink and the accent, tuned by eye
const base = `
html.dark { color-scheme: dark; }
html.dark, html.dark body {
  --bg: #1A1A16; --panel: #23231E; --bar: #1F1F1B; --ink: #ECE8DC; --ink2: #CFCABA; --muted: #A39E8F;
  --line: #34332C; --line2: #46443B; --edge: #34332C; --soft: #2B2B25;
  --accent: #A9C08A; --accent-soft: #2E3626; --grid: rgba(169,192,138,.05);
  background: var(--bg); color: var(--ink);
}
html.dark img, html.dark video { filter: none; }
html.dark ::selection { background: #3D4A2E; color: #F4F0E2; }
html.dark input, html.dark textarea, html.dark select { background-color: #1E1E1A; color: var(--ink); border-color: var(--line2); }
html.dark input::placeholder, html.dark textarea::placeholder { color: #7D7869; }
html.dark button.primary, html.dark .btn.primary { color: #16190F; }
html.dark input:-webkit-autofill, html.dark textarea:-webkit-autofill { -webkit-text-fill-color: var(--ink); -webkit-box-shadow: 0 0 0 1000px #1E1E1A inset; box-shadow: 0 0 0 1000px #1E1E1A inset; }
`;
writeFileSync(join(root, 'src', 'dark.css'), `/* Generated by tools/dark.mjs from index.css. Do not edit by hand: edit index.css or the tool. */\n${generated}${base}`);
console.log(`dark.css: ${generated.split('\n').length} rules`);
