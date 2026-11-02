import { useEffect, useRef, useState } from 'react';
import { Clock, X } from 'lucide-react';

// Reads what you typed: "5", "530", "5:30", "05.30", "17 45", "5pm", "5:30 am" → "HH:MM", or null.
export function parseTime(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  const pm = /p/.test(s), am = /a/.test(s);
  const digits = s.replace(/[^\d:.\s]/g, '').trim();
  let h, m;
  const parts = digits.split(/[:.\s]+/).filter(Boolean);
  if (parts.length >= 2) { h = Number(parts[0]); m = Number(parts[1]); }
  else if (parts.length === 1) {
    const d = parts[0];
    if (d.length <= 2) { h = Number(d); m = 0; } else { h = Number(d.slice(0, d.length - 2)); m = Number(d.slice(-2)); }
  } else return null;
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  if (!(h >= 0 && h <= 23 && m >= 0 && m <= 59)) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const pad = (n) => String(n).padStart(2, '0');

// A time field that opens a panel of hours and minutes: two taps instead of a fiddly spinner.
// Same shape as <input type="time">: value "HH:MM", onChange({ target: { value } }).
export default function TimeInput({ value, onChange, className = '', id, disabled, placeholder = '--:--', 'aria-label': label, clearable }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value || '');
  const ref = useRef(null);
  useEffect(() => setText(value || ''), [value]);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const emit = (v) => { setText(v); if (v !== (value || '')) onChange?.({ target: { value: v } }); };
  const commit = () => { const t = parseTime(text); if (t === null) setText(value || ''); else emit(t); };
  const [h, m] = (value || '').split(':').map(Number);
  const has = !!value;
  return (
    <span className={'tpk ' + className + (open ? ' open' : '') + (disabled ? ' disabled' : '')} ref={ref}>
      <span className="tpk-field" onClick={() => !disabled && setOpen(true)}>
        <input id={id} value={text} disabled={disabled} placeholder={placeholder} aria-label={label} inputMode="numeric" autoComplete="off"
          onChange={e => setText(e.target.value)} onFocus={() => setOpen(true)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); setOpen(false); } }} />
        <Clock size={15} aria-hidden="true" />
      </span>
      {open && !disabled && (
        <div className="tpk-pop" role="dialog" aria-label={label || 'Choose a time'} onMouseDown={e => e.preventDefault()}>
          <div className="tpk-head"><b>{has ? value : '--:--'}</b><span>{has ? (h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening') : 'Pick an hour, then minutes'}</span></div>
          <div className="tpk-cols">
            <div className="tpk-col">
              <small>Hour</small>
              <div className="tpk-hours">{HOURS.map(x => <button key={x} type="button" className={has && x === h ? 'on' : ''} onClick={() => emit(`${pad(x)}:${pad(has ? m : 0)}`)}>{pad(x)}</button>)}</div>
            </div>
            <div className="tpk-col">
              <small>Minutes</small>
              <div className="tpk-mins">{MINUTES.map(x => <button key={x} type="button" className={has && x === m ? 'on' : ''} onClick={() => { emit(`${pad(has ? h : 9)}:${pad(x)}`); setOpen(false); }}>:{pad(x)}</button>)}</div>
            </div>
          </div>
          <div className="tpk-foot">
            {clearable && has && <button type="button" className="ghost sm" onClick={() => { emit(''); setOpen(false); }}><X size={14} />Clear</button>}
            <span className="grow" />
            <button type="button" className="primary sm" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </span>
  );
}
