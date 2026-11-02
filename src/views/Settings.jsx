import { useEffect, useRef, useState } from 'react';
import TimeInput from '../lib/TimeInput.jsx';
import { Flame, Snowflake, User, CalendarClock, Smartphone, HardDrive, TriangleAlert, Info, Bell, Briefcase, Plus, X, Download, Upload, Cloud } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { Head, Bar, useToast } from '../lib/ui.jsx';
import { PhoneCard } from './SettingsMore.jsx';
import RhythmCard from './spoudazo/Rhythm.jsx';
import CloudCard from './CloudCard.jsx';
import NotificationsCard from './SettingsNotify.jsx';
import { stripRestricted, keepLocalRestricted } from '../lib/privacy';
import { COMMITMENT_KINDS, commitmentsOf, weeklyHours, busyAt } from '../lib/busy';

const STORAGE_KEY = 'shepherd_os_v1';
const LAST_BACKUP = 'stillwaters_last_backup';
const lastBackup = () => { try { return localStorage.getItem(LAST_BACKUP); } catch { return null; } };

// Restricted pastoral notes are left out of the file unless you tick the box.
export function exportBackup(state, withRestricted = false) {
  const data = { exportDate: new Date().toISOString(), version: 'shepherd-os-v1', restrictedIncluded: withRestricted, state: { ...(withRestricted ? state : stripRestricted(state)), view: undefined } };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `boethos-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  try { localStorage.setItem(LAST_BACKUP, new Date().toISOString().slice(0, 10)); } catch { /* storage blocked */ }
}

const SECTIONS = [
  ['you', 'You', User], ['life', 'Your life', Briefcase], ['rhythm', 'Your rhythm', CalendarClock], ['notifications', 'Notifications', Bell],
  ['phone', 'Phone and cloud', Smartphone], ['data', 'Your data', HardDrive], ['reset', 'Start over', TriangleAlert], ['about', 'About', Info],
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Sections down the left; the one on screen is marked as you scroll.
function SectionNav() {
  const [on, setOn] = useState('you');
  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setOn(vis.target.id);
    }, { rootMargin: '-90px 0px -60% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <nav className="st-nav" aria-label="Settings sections">
      {SECTIONS.map(([id, label, Icon]) => (
        <button key={id} type="button" className={on === id ? 'on' : ''} onClick={() => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setOn(id); }}>
          <Icon size={16} />{label}
        </button>
      ))}
    </nav>
  );
}

// A text field that saves when you leave it
function Text({ label, value, onSave, placeholder, area, wide, type = 'text' }) {
  const [v, setV] = useState(value || '');
  useEffect(() => setV(value || ''), [value]);
  const P = { value: v, placeholder, onChange: e => setV(e.target.value), onBlur: () => { if (v !== (value || '')) onSave(v.trim()); } };
  return <label className={'st-f' + (area || wide ? ' wide' : '')}><span>{label}</span>{area ? <textarea {...P} /> : <input type={type} {...P} />}</label>;
}

function Section({ id, icon: Ic, title, sub, aside, children }) {
  return (
    <section className="st-card" id={id}>
      <header className="st-h"><span className="st-h-ic"><Ic size={20} /></span><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{aside && <span className="st-h-aside">{aside}</span>}</header>
      {children}
    </section>
  );
}

// You: who you are, where you serve, and how far you have come
function You() {
  const { state, sel, setProfile, setIdentity, updateProfile, setChurchName, setXpGoal, dispatch } = useStore();
  const toast = useToast();
  const p = state.profile;
  const saved = (f) => (v) => { f(v); toast('Saved'); };
  const initials = (state.name || 'You').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const days = state.startDate ? Math.max(1, Math.floor((Date.now() - new Date(state.startDate + 'T12:00').getTime()) / 86400000) + 1) : 1;
  return (
    <Section id="you" icon={User} title="You" sub="Your name, your calling, and your day of rest.">
      <div className="st-me">
        <span className="st-av">{initials}</span>
        <div className="st-me-t"><b>{state.name || 'You'}</b><span>{[p.role, state.ministry.settings.name, state.churchName, p.location].filter(Boolean).join(' · ') || 'Add your role, Bacenta and church below'}</span><small>Day {days} with Boēthos</small></div>
        <div className="st-me-stats">
          <span className={sel.streak.activeToday ? 'lit' : ''}><Flame size={16} /><b>{sel.streak.current}</b>day streak</span>
          <span><Snowflake size={16} /><b>{state.streakFreezes}</b>freezes</span>
          <span>Level <b>{sel.level.level}</b>{sel.level.title}</span>
        </div>
      </div>
      <div className="st-fields">
        <Text label="Your name" value={state.name} onSave={saved(v => setProfile({ name: v }))} placeholder="Your first name" />
        <Text label="Your role" value={p.role} onSave={saved(v => updateProfile({ role: v }))} placeholder="Bacenta leader" />
        <Text label="Your Bacenta" value={state.ministry.settings.name} onSave={saved(v => v && dispatch({ type: 'M_SETTINGS', data: { name: v } }))} placeholder="The Bacenta you lead" />
        <Text label="Church" value={state.churchName} onSave={saved(setChurchName)} placeholder="Your church" />
        <Text label="Who you are becoming" area value={state.identityStatement} onSave={saved(setIdentity)} placeholder="I am a shepherd who prays before I work." />
        <Text label="Where you are" value={p.location} onSave={saved(v => updateProfile({ location: v }))} placeholder="Birmingham, UK" />
        <Text label="Church website" type="text" value={p.links.church} onSave={saved(v => updateProfile({ links: { church: v } }))} placeholder="https://…" />
        <Text label="Sermon archive" wide type="text" value={p.links.sermons} onSave={saved(v => updateProfile({ links: { sermons: v } }))} placeholder="https://…" />
      </div>
      <div className="st-pair">
        <div className="st-choice"><b>Your Sabbath</b><small>A full day of rest each week. Today shows only your soul’s rhythm that day.</small>
          <span className="st-seg">{DAY_ORDER.map(i => <button key={i} type="button" className={(p.sabbathDay ?? 1) === i ? 'on' : ''} onClick={() => { updateProfile({ sabbathDay: i }); toast(`Sabbath: ${DAYS[i]}`); }}>{DAYS[i]}</button>)}</span></div>
        <div className="st-choice"><b>Daily goal</b><small>{sel.xpToday} of {state.dailyXpGoal} XP today. Any day with XP keeps your streak.</small>
          <span className="st-seg">{[30, 50, 80, 120].map(n => <button key={n} type="button" className={state.dailyXpGoal === n ? 'on' : ''} onClick={() => { setXpGoal(n); toast(`Daily goal: ${n} XP`); }}>{n} XP</button>)}</span></div>
      </div>
    </Section>
  );
}

// Your life: work, study, family and the rest, on set days and times
function Life() {
  const { state, updateProfile } = useStore();
  const toast = useToast();
  const list = commitmentsOf(state.profile);
  const blank = { name: '', kind: 'work', days: [1, 2, 3, 4, 5], from: '09:00', to: '17:00', until: '' };
  const [f, setF] = useState(blank);
  const save = (next, msg) => { updateProfile({ commitments: next }); msg && toast(msg); };
  const upd = (id, data) => save(list.map(c => (c.id === id ? { ...c, ...data } : c)));
  const now = new Date();
  const today = now.toLocaleDateString('en-CA'), time = now.toTimeString().slice(0, 5);
  const busy = busyAt(list, today, time);
  const hours = Math.round(weeklyHours(list));
  const daysEdit = (c, set) => <span className="st-days">{DAY_ORDER.map(i => <button key={i} type="button" className={(c.days || []).includes(i) ? 'on' : ''} onClick={() => set({ days: (c.days || []).includes(i) ? c.days.filter(x => x !== i) : [...(c.days || []), i] })}>{DAYS[i][0]}</button>)}</span>;
  return (
    <Section id="life" icon={Briefcase} title="Your life" sub="Work, study, family and everything else that takes your time. Reminders wait while you’re in one of these, and come when it ends."
      aside={<span className={'st-busy' + (busy ? ' on' : '')}>{busy ? `Busy now: ${busy.name}, until ${busy.to}` : `${hours} hours a week`}</span>}>
      {list.length > 0 && (
        <div className="st-week" aria-label="Your week">
          {DAY_ORDER.map(i => { const cs = list.filter(c => c.from && c.to && (c.days || []).includes(i)); return (
            <div key={i} className={'st-wd' + (i === now.getDay() ? ' today' : '')}><b>{DAYS[i]}</b>
              {cs.length ? cs.map(c => <span key={c.id} className={'st-blk k-' + c.kind} title={`${c.name} ${c.from}–${c.to}`}>{c.name}<small>{c.from}–{c.to}</small></span>) : <em>Free</em>}
            </div>
          ); })}
        </div>
      )}
      <ul className="st-commits">{list.map(c => (
        <li key={c.id} className={'k-' + c.kind}>
          <input className="st-c-name" defaultValue={c.name} onBlur={e => e.target.value.trim() && e.target.value !== c.name && upd(c.id, { name: e.target.value.trim() })} aria-label="Name" />
          <select value={c.kind} onChange={e => upd(c.id, { kind: e.target.value })} aria-label="Kind">{COMMITMENT_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          {daysEdit(c, d => upd(c.id, d))}
          <span className="st-c-time"><TimeInput value={c.from || ''} onChange={e => upd(c.id, { from: e.target.value })} aria-label="From" />–<TimeInput value={c.to || ''} onChange={e => upd(c.id, { to: e.target.value })} aria-label="To" /></span>
          <label className="st-c-until">until<input type="date" value={c.until || ''} onChange={e => upd(c.id, { until: e.target.value })} aria-label="Until" /></label>
          <button type="button" className="iv-x" onClick={() => save(list.filter(x => x.id !== c.id), `${c.name} removed`)} aria-label={`Remove ${c.name}`}><X size={15} /></button>
          {!(c.from && c.to && c.days?.length) && <small className="st-c-hint">Add days and times so reminders can work around it.</small>}
        </li>
      ))}</ul>
      <form className="st-add" onSubmit={e => { e.preventDefault(); if (!f.name.trim()) return; save([...list, { ...f, name: f.name.trim(), id: `c${Date.now().toString(36)}` }], `${f.name.trim()} added`); setF(blank); }}>
        <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Add a commitment: work, a course, piano…" aria-label="New commitment" />
        <select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })} aria-label="Kind">{COMMITMENT_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        {daysEdit(f, d => setF({ ...f, ...d }))}
        <span className="st-c-time"><TimeInput value={f.from} onChange={e => setF({ ...f, from: e.target.value })} aria-label="From" />–<TimeInput value={f.to} onChange={e => setF({ ...f, to: e.target.value })} aria-label="To" /></span>
        <button type="submit" className="primary sm" disabled={!f.name.trim()}><Plus size={15} />Add</button>
      </form>
    </Section>
  );
}

function Data() {
  const { state } = useStore();
  const toast = useToast();
  const file = useRef(null);
  const [pending, setPending] = useState(null);
  const [err, setErr] = useState('');
  const [withRestricted, setWithRestricted] = useState(false);
  const readFile = (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    setErr('');
    const reader = new FileReader();
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target.result); if (!d.state || d.version !== 'shepherd-os-v1') throw new Error(); setPending(d); } catch { setErr('That file is not a backup from this app.'); } };
    reader.readAsText(f);
  };
  const kb = Math.round(JSON.stringify(state).length / 1024);
  const backedUp = lastBackup();
  const stale = !backedUp || (Date.now() - new Date(backedUp + 'T12:00').getTime()) / 86400000 > 14;
  return (
    <Section id="data" icon={HardDrive} title="Your data" sub="Kept on this device, and in your private cloud copy once you connect it." aside={<span className="st-h-note">{kb} KB</span>}>
      <div className="st-tiles">
        <div className="st-tile">
          <Download size={20} /><b>Download a backup</b>
          <small>{backedUp ? `Last downloaded ${new Date(backedUp + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}.` : 'Never downloaded from this browser.'}</small>
          <label className="st-check"><input type="checkbox" checked={withRestricted} onChange={e => setWithRestricted(e.target.checked)} />Include restricted notes</label>
          <button className={stale ? 'primary' : ''} onClick={() => { exportBackup(state, withRestricted); toast('Backup downloaded'); }}>{stale ? 'Download now' : 'Download'}</button>
        </div>
        <div className="st-tile">
          <Upload size={20} /><b>Restore a backup</b>
          <small>Replaces everything here with the file. Restricted notes already on this device are kept.</small>
          <button onClick={() => file.current.click()}>Choose file…</button>
          <input ref={file} type="file" accept=".json,application/json" onChange={readFile} hidden />
          {err && <small className="warn-text">{err}</small>}
          {pending && <div className="st-confirm"><span>Restore the backup from {new Date(pending.exportDate).toLocaleDateString()}? Your current data will be replaced.</span>
            <button className="primary sm" onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(keepLocalRestricted(pending.state, state))); window.location.reload(); }}>Restore</button><button className="sm" onClick={() => setPending(null)}>Cancel</button></div>}
        </div>
        <div className="st-tile"><Cloud size={20} /><b>Storage used</b><small>{kb} KB of about 5,000 KB this browser allows.</small><Bar pct={Math.max(1, (kb / 5000) * 100)} /></div>
      </div>
    </Section>
  );
}

function Reset() {
  const { softReset, fullReset } = useStore();
  const [r, setR] = useState(null);
  return (
    <Section id="reset" icon={TriangleAlert} title="Start over">
      {r ? <div className="st-confirm danger"><span>{r === 'soft' ? 'Clear all progress, notes and lists?' : 'Clear everything and return to a new install?'} This can’t be undone. Download a backup first if you might want it.</span>
        <button className="danger solid sm" onClick={() => { r === 'soft' ? softReset() : fullReset(); setR(null); }}>Yes, clear it</button><button className="sm" onClick={() => setR(null)}>Cancel</button></div>
        : <div className="st-pair">
          <div className="st-choice"><b>Clear progress</b><small>Steps, tasks, notes and lists.</small><span><button className="danger sm" onClick={() => setR('soft')}>Clear progress</button></span></div>
          <div className="st-choice"><b>Reset everything</b><small>Back to the welcome screen.</small><span><button className="danger sm" onClick={() => setR('full')}>Reset everything</button></span></div>
        </div>}
    </Section>
  );
}

export default function SettingsView() {
  return (
    <>
      <Head eyebrow="Boēthos" step="Settings" title="Settings" sub="You and your life, your rhythm with God, every notification, your phone and the cloud, and your data." />
      <div className="st-layout">
        <SectionNav />
        <div className="st-body">
          <You />
          <Life />
          <div className="st-wrap" id="rhythm-wrap"><RhythmCard /></div>
          <NotificationsCard />
          <section className="st-card" id="phone">
            <header className="st-h"><span className="st-h-ic"><Smartphone size={20} /></span><div><h2>Phone and cloud</h2><p>Install Boēthos on your phone, keep your data in the cloud, and get reminders when the app is closed.</p></div></header>
            <div className="st-inner"><PhoneCard /><CloudCard /></div>
          </section>
          <Data />
          <Reset />
          <Section id="about" icon={Info} title="About Boēthos">
            <p className="st-about">Boēthos (βοηθός, “helper”, Hebrews 13:6) holds two callings. Spoudazō (2 Timothy 2:15) is your own walk with God. Poimainō (John 21:16) is the people you shepherd at your Bacenta.</p>
            <div className="st-keys"><span><b>Search anywhere</b><kbd>Ctrl K</kbd></span><span><b>Close a sheet</b><kbd>Esc</kbd></span><span><b>Help for this page</b><kbd>?</kbd></span><span><b>Version</b><em>Boēthos 1.0</em></span></div>
          </Section>
        </div>
      </div>
    </>
  );
}
