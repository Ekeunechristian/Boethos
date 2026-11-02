// Light, dark, or match the device. Kept per device, since a phone and a laptop may differ.
const KEY = 'boethos_theme';
export const getTheme = () => { try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; } };
export function applyTheme(t = getTheme()) {
  const dark = t === 'dark' || (t === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', !!dark);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#1A1A16' : '#F8F6EE');
}
export function setTheme(t) { try { localStorage.setItem(KEY, t); } catch { /* storage blocked */ } applyTheme(t); }
// Follow the device when it switches between light and dark
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (getTheme() === 'system') applyTheme(); });
