import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, ExternalLink, X } from 'lucide-react';

// ── Phase / step naming ──────────────────────────────────────────────────────
export const phaseNo = (phase) => parseInt(phase.id.replace('phase-', ''), 10);

// "Block 1 — Java Foundations (Weeks 1–4)" → { kicker: 'Block 1', title: 'Java Foundations', when: 'Weeks 1–4' }
export function stepName(step) {
  let name = step.name || '';
  let when = '';
  const paren = name.match(/\s*\(([^)]*\b(?:Week|Weeks|Month|Months)\b[^)]*)\)\s*$/i);
  if (paren) { when = paren[1]; name = name.slice(0, paren.index); }
  let kicker = '';
  const dash = name.match(/^((?:Block|Track|Project|Step)\s+\d+)\s+[—–-]\s+/i);
  if (dash) { kicker = dash[1]; name = name.slice(dash[0].length); }
  if (!when && step.weeks) when = step.weeks.start === step.weeks.end ? `Week ${step.weeks.start}` : `Weeks ${step.weeks.start}–${step.weeks.end}`;
  return { kicker, title: name, when };
}

export const STATUS_LABEL = { not_started: 'Not started', in_progress: 'Doing', completed: 'Done' };
export const nextStatus = (s) => (s === 'completed' ? 'not_started' : 'completed');

export const fmtDate = (iso, opts = { day: 'numeric', month: 'short' }) =>
  iso ? new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(undefined, opts) : '';
export const hrs = (h) => (!h ? '' : h < 1 ? `${Math.round(h * 60)}m` : `${+h.toFixed(1)}h`);

// ── Reading text: the roadmap is long-form writing, so give it headings and lists ──
const HEADING = /^[A-Z0-9][A-Z0-9 &'’,.\-–—/()+:]{3,}$/;
const LIST = /^(\(\d+\)|\d+[.)]|[-•–✓✗→])\s+/;

export function Prose({ text, short, fold }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const blocks = String(text).split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const words = String(text).split(/\s+/).length;
  // Long blocks open on their first two paragraphs, with the rest one tap away
  const folded = fold && !open && words > 220 && blocks.length > 2;
  const out = [];
  let sections = 0;
  blocks.forEach((block, i) => {
    let lines = block.split('\n');
    const first = lines[0].trim();
    const looksHeading = first.length < 90 && (
      (first.endsWith(':') && HEADING.test(first.split(/[—–:]/)[0].trim())) ||
      (HEADING.test(first) && first === first.toUpperCase() && /[A-Z]{3}/.test(first))
    );
    if (looksHeading) sections++;
    if (folded && i >= 2) return;
    if (looksHeading) {
      out.push(<h4 key={`h${i}`}>{first.replace(/:$/, '')}</h4>);
      lines = lines.slice(1);
    }
    if (!lines.length) return;
    if (lines.length > 1 && lines.every(l => LIST.test(l.trim()))) {
      out.push(<ul key={`l${i}`}>{lines.map((l, j) => <li key={j}>{l.trim().replace(LIST, '')}</li>)}</ul>);
    } else {
      out.push(<p key={`p${i}`}>{lines.join('\n')}</p>);
    }
  });
  return (
    <div className={'prose' + (short ? ' short' : '') + (folded ? ' folded' : '')}>
      {out}
      {fold && words > 220 && blocks.length > 2 && (
        <button type="button" className="ghost sm read-more" onClick={() => setOpen(o => !o)}>
          {open ? 'Show less' : `Read the full block · ${words.toLocaleString()} words${sections ? `, ${sections} sections` : ''}`}
        </button>
      )}
    </div>
  );
}

export function Links({ items }) {
  if (!items?.length) return null;
  return (
    <div className="links">
      {items.map(r => (
        <a key={r.url || r.name} href={r.url} target="_blank" rel="noreferrer">
          <span>{r.name}</span><ExternalLink size={15} />
        </a>
      ))}
    </div>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────────
export const Bar = ({ pct, accent, thick }) => (
  <div className={'bar' + (accent ? ' accent' : '') + (thick ? ' thick' : '')} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
    <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
  </div>
);

export function Mark({ status = 'not_started', onClick, label }) {
  return (
    <button type="button" className={`mark ${status}`} onClick={onClick}
      aria-label={label || (status === 'completed' ? 'Mark as not done' : 'Mark as done')}>
      {status === 'completed' && <Check size={15} strokeWidth={3} />}
    </button>
  );
}

export function Seg({ value, options, onChange, full }) {
  return (
    <div className={'seg' + (full ? ' full' : '')} role="tablist">
      {options.map(o => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        return <button key={v} type="button" role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>;
      })}
    </div>
  );
}

// The page's label sits in a pill, with an optional count beside it ("Day 1 / 21").
export const Kicker = ({ children, step }) => (
  <span className="greet">{children}{step && <span className="greet-step">{step}</span>}</span>
);

// The page's verse. The shell provides it for the current route; a page can pass its own.
export const VerseCtx = createContext(null);
export function Verse({ v, className = '' }) {
  if (!v) return null;
  return (
    <figure className={'page-verse ' + className}>
      <blockquote><p>{v.text}</p></blockquote>
      <figcaption><span className="pv-rule" aria-hidden="true" />{v.ref}<span className="pv-tr">KJV</span></figcaption>
    </figure>
  );
}

// Which part of Boēthos the page belongs to (home, spoudazo, poimaino): sets the header's mark and tone
export const SectionCtx = createContext('home');

// The large, faded mark of the section, set on the verse side of every page header
function Watermark({ kind }) {
  if (kind === 'spoudazo') return <svg className="ph-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 11.5 C13 9.5 9.5 9.5 7.5 10.5 V22 C9.5 21 13 21 16 23 C19 21 22.5 21 24.5 22 V10.5 C22.5 9.5 19 9.5 16 11.5 Z M16 11.5 V23" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>;
  if (kind === 'poimaino') return <svg className="ph-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M19.5 26 V12 A5 5 0 0 0 9.5 12 V14.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M6 23.5 q2.1 -1.6 4.2 0 t4.2 0" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>;
  return <svg className="ph-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 23.2 C13 21.4 9.4 21.2 6 22.4 V25.6 C9.4 24.4 13 24.6 16 26.4 C19 24.6 22.6 24.4 26 25.6 V22.4 C22.6 21.2 19 21.4 16 23.2 Z" fill="currentColor" /><path d="M7.5 21 L18.5 7.8 A5 5 0 1 1 25 14.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="21.8" cy="9.6" r="1.6" fill="currentColor" /></svg>;
}

// Every page opens the same way: a light banner with the section's mark, the title, a line, and the page's verse
export function Head({ eyebrow, step, title, sub, back, children, verse }) {
  const routeVerse = useContext(VerseCtx);
  const section = useContext(SectionCtx);
  const v = verse === false ? null : verse || routeVerse;
  return (
    <>
      {back && <a className="ph-back" href={back.href}><span className="ph-back-ic" aria-hidden="true"><ArrowLeft size={16} /></span><span className="ph-back-t"><small>Back to</small><b>{back.label}</b></span></a>}
      <section className={'phead ' + section + (v ? '' : ' noverse')}>
        <Watermark kind={section} />
        <div className="ph-l">
          {eyebrow && <span className="ph-kick"><SectionMark kind={section} /><b>{eyebrow}</b>{step && <span>{step}</span>}</span>}
          <h1>{title}</h1>
          {sub && <p className="ph-sub">{sub}</p>}
          {children && <div className="ph-tools">{children}</div>}
        </div>
        {v && (
          <figure className="ph-verse">
            <span className="hv-label">Verse for this page</span>
            <blockquote>{v.text}</blockquote>
            <figcaption><span className="pv-rule" aria-hidden="true" />{v.ref}<span className="pv-tr">KJV</span></figcaption>
          </figure>
        )}
      </section>
    </>
  );
}

// The small round mark in the header pill
function SectionMark({ kind }) {
  const C = '#F4F0E2';
  if (kind === 'spoudazo') return <svg className="ph-km" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#7A5A2E" /><path d="M16 11.5 C13 9.5 9.5 9.5 7.5 10.5 V22 C9.5 21 13 21 16 23 C19 21 22.5 21 24.5 22 V10.5 C22.5 9.5 19 9.5 16 11.5 Z M16 11.5 V23" fill="none" stroke={C} strokeWidth="2" strokeLinejoin="round" /></svg>;
  if (kind === 'poimaino') return <svg className="ph-km" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#4E6234" /><path d="M19.5 26 V12 A5 5 0 0 0 9.5 12 V14.5" fill="none" stroke={C} strokeWidth="2.8" strokeLinecap="round" /><path d="M6 23.5 q2.1 -1.6 4.2 0 t4.2 0" fill="none" stroke={C} strokeWidth="1.8" strokeLinecap="round" /></svg>;
  return <svg className="ph-km" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#4E6234" /><path d="M16 23.2 C13 21.4 9.4 21.2 6 22.4 V25.6 C9.4 24.4 13 24.6 16 26.4 C19 24.6 22.6 24.4 26 25.6 V22.4 C22.6 21.2 19 21.4 16 23.2 Z" fill={C} /><path d="M7.5 21 L18.5 7.8 A5 5 0 1 1 25 14.6" fill="none" stroke="#E0B45A" strokeWidth="2.6" strokeLinecap="round" /><circle cx="21.8" cy="9.6" r="2.1" fill={C} /></svg>;
}

export function Empty({ title, children, action }) {
  return <div className="empty"><b>{title}</b>{children}{action}</div>;
}

// ── Sheet: a dialog that rises from the bottom on phones, centred elsewhere ───
export function Sheet({ onClose, children, className = '', label }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className={'sheet ' + className} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref} style={{ outline: 'none' }}>{children}</div>
    </div>
  );
}

export function SheetHead({ eyebrow, title, onClose }) {
  return (
    <div className="sheet-h">
      <div>{eyebrow && <span className="eyebrow accent">{eyebrow}</span>}<h2>{title}</h2></div>
      <button type="button" className="ghost icon" onClick={onClose} aria-label="Close"><X size={20} /></button>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// A quiet note on a page you won't need until a later phase. Disappears once you get there.
export function NotYet({ now, from, children }) {
  return now < from ? <p className="note-banner">{children}</p> : null;
}

// A dropdown in the page's own type, instead of the browser's plain select.
//   options: [{ value, label, lead?, meta? }]: lead sits in a small circle, meta beneath the label
export function Picker({ value, options, onChange, label, placeholder = 'Choose…' }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef(null);
  const list = useRef(null);
  const cur = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away);
    setHi(Math.max(0, options.findIndex(o => o.value === value)));
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  useEffect(() => { if (open) list.current?.children[hi]?.scrollIntoView({ block: 'nearest' }); }, [hi, open]);

  const choose = (o) => { onChange(o.value); setOpen(false); };
  const onKey = (e) => {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(options.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[hi]); }
    else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
  };

  const Row = ({ o }) => (
    <>
      {o.lead != null && <span className="pk-lead">{o.lead}</span>}
      <span className="pk-t"><b>{o.label}</b>{o.meta && <small>{o.meta}</small>}</span>
    </>
  );

  return (
    <div className={'picker' + (open ? ' open' : '')} ref={box}>
      <button type="button" className="pk-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen(o => !o)} onKeyDown={onKey}>
        {cur ? <Row o={cur} /> : <span className="pk-t muted">{placeholder}</span>}
        <ChevronDown className="pk-chev" size={18} />
      </button>
      {open && (
        <ul className="pk-list" role="listbox" aria-label={label} ref={list}>
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value}
              className={(i === hi ? 'hi ' : '') + (o.value === value ? 'on' : '')}
              onMouseEnter={() => setHi(i)} onMouseDown={(e) => { e.preventDefault(); choose(o); }}>
              <Row o={o} />
              {o.value === value && <Check className="pk-tick" size={16} strokeWidth={2.5} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Facts boxed like the title block of a technical drawing. items: [[label, value]]
export function TitleBlock({ items, className = '' }) {
  return (
    <dl className={'title-block ' + className}>
      {items.filter(Boolean).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
  );
}
