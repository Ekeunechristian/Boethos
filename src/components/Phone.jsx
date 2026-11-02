import { useEffect, useState } from 'react';
import { MoreHorizontal, RotateCw, X, Home as HomeIc, Settings as Gear, Search, ArrowRight, Sun, Moon } from 'lucide-react';
import { getTheme, setTheme } from '../lib/theme';
import { useStore } from '../store/index.jsx';
import { PLACE_SETS, placeCounts, pageHref } from '../lib/places';
import Mark from './Mark.jsx';

// Phones and tablets get the touch layout: a bottom bar, folded sections, no hover.
export const TOUCH = '(max-width: 900px)';
export function useTouch() {
  const get = () => typeof window !== 'undefined' && window.matchMedia?.(TOUCH).matches;
  const [on, setOn] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(TOUCH); if (!mq) return undefined;
    const f = () => setOn(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f);
  }, []);
  return on;
}

// On a phone, a section of a long page folds under its title; on a laptop it is simply shown.
export function Fold({ title, hint, children, open = false }) {
  const touch = useTouch();
  if (!touch) return children;
  return (
    <details className="fold" open={open}>
      <summary><span><b>{title}</b>{hint && <small>{hint}</small>}</span><ArrowRight size={16} className="fold-ic" /></summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}

// Reload: the installed app has no browser reload button, so it gets its own. It also checks for an update first.
export function ReloadButton() {
  const [spin, setSpin] = useState(false);
  return (
    <button type="button" className={'hdr-icon reload-btn' + (spin ? ' spin' : '')} aria-label="Reload the app" title="Reload"
      onClick={async () => { setSpin(true); try { const r = await navigator.serviceWorker?.getRegistration(); await r?.update(); } catch { /* offline */ } location.reload(); }}>
      <RotateCw size={18} />
    </button>
  );
}

// The four places used most, per section; everything else is under More.
const MAIN = { spoudazo: ['today', 'quiet', 'prayer', 'word'], poimaino: ['poimaino', 'people', 'followup', 'services'] };
const SHORT = { poimaino: 'Dashboard', followup: 'Shepherd', quiet: 'Quiet time', word: 'The Word' };

export function PhoneNav({ section, place, onSearch }) {
  const { state, sel } = useStore();
  const [more, setMore] = useState(false);
  const counts = placeCounts(state, sel);
  useEffect(() => { setMore(false); }, [place]);
  if (section === 'home') {
    const items = [['#/home', 'Home', HomeIc, place === 'home'], ['#/today', 'Spoudazō', null, false, 'spoudazo'], ['#/poimaino', 'Poimainō', null, false, 'poimaino'], ['#/settings', 'Settings', Gear, place === 'settings']];
    return (
      <nav className="pnav" aria-label="Boēthos">
        {items.map(([h, l, Ic, on, mark]) => <a key={h} href={h} className={on ? 'on' : ''}>{mark ? <Mark kind={mark} size={22} /> : <Ic size={21} strokeWidth={1.75} />}<span>{l}</span></a>)}
        <button type="button" onClick={onSearch}><Search size={21} strokeWidth={1.75} /><span>Search</span></button>
      </nav>
    );
  }
  const places = PLACE_SETS[section];
  const main = MAIN[section].map(id => places.find(p => p.id === id)).filter(Boolean);
  const rest = places.filter(p => !MAIN[section].includes(p.id));
  const restOn = rest.some(p => p.id === place);
  const other = section === 'poimaino' ? 'spoudazo' : 'poimaino';
  return (
    <>
      <nav className="pnav" aria-label="Places">
        {main.map(p => { const c = counts[`${p.id}/`]; return (
          <a key={p.id} href={p.base} className={place === p.id ? 'on' : ''}>
            <span className="pnav-ic"><p.icon size={21} strokeWidth={1.75} />{c?.hot && /\d/.test(c.text) && <i>{c.text.match(/\d+/)[0]}</i>}</span>
            <span>{SHORT[p.id] || p.label}</span>
          </a>
        ); })}
        <button type="button" className={restOn || more ? 'on' : ''} onClick={() => setMore(true)} aria-expanded={more}><MoreHorizontal size={21} strokeWidth={1.75} /><span>More</span></button>
      </nav>
      {more && (
        <div className="pmore" role="dialog" aria-label="More" onClick={e => { if (e.target === e.currentTarget) setMore(false); }}>
          <div className="pmore-sheet">
            <div className="pmore-h"><b>{section === 'poimaino' ? 'Poimainō' : 'Spoudazō'}</b><button type="button" className="hdr-icon" onClick={() => setMore(false)} aria-label="Close"><X size={18} /></button></div>
            <div className="pmore-grid">
              {rest.map(p => <a key={p.id} href={p.base} className={place === p.id ? 'on' : ''}><span className="pmore-ic"><p.icon size={20} /></span><b>{p.label}</b><small>{p.blurb}</small></a>)}
              {section === 'poimaino' && places[0].pages.filter(pg => pg.id).map(pg => <a key={pg.id} href={pageHref(places[0], pg.id)}><span className="pmore-ic"><pg.icon size={20} /></span><b>{pg.label}</b><small>{pg.desc}</small></a>)}
            </div>
            <div className="pmore-foot">
              <a href="#/home"><Mark size={20} />Boēthos home</a>
              <a href={other === 'poimaino' ? '#/poimaino' : '#/today'}><Mark kind={other} size={20} />{other === 'poimaino' ? 'Poimainō' : 'Spoudazō'}</a>
              <button type="button" onClick={() => { setMore(false); onSearch(); }}><Search size={18} />Search</button>
              <a href="#/settings"><Gear size={18} />Settings</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Light or dark, one tap, in the header
export function ThemeToggle() {
  const isDark = () => document.documentElement.classList.contains('dark');
  const [dark, setDark] = useState(isDark);
  useEffect(() => { const o = new MutationObserver(() => setDark(isDark())); o.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); return () => o.disconnect(); }, []);
  return (
    <button type="button" className="hdr-icon theme-btn" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
