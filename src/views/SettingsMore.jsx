import { useEffect, useState } from 'react';
import { useStore } from '../store/index.jsx';
import { Seg, useToast } from '../lib/ui.jsx';
import { notify, reminderText } from '../components/Engine.jsx';

// Saves when you leave the field, so typing never fights the store.
function Field({ label, hint, value, onSave, type = 'text', placeholder }) {
  const [v, setV] = useState(value || '');
  useEffect(() => setV(value || ''), [value]);
  return (
    <div className="set-row">
      <div className="t"><b>{label}</b>{hint && <small>{hint}</small>}</div>
      <input type={type} value={v} placeholder={placeholder} onChange={e => setV(e.target.value)} onBlur={() => { if (v !== (value || '')) onSave(v.trim()); }} />
    </div>
  );
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ProfileCard() {
  const { state, updateProfile, setChurchName } = useStore();
  const toast = useToast();
  const p = state.profile;
  const save = (data) => { updateProfile(data); toast('Saved'); };

  return (
    <div className="card" id="targets">
      <div className="card-h"><h2>Your ministry</h2><span className="muted small">Who you serve, and when you rest</span></div>
      <Field label="Your role" hint="Pastor, elder, church planter, shepherd in training…" value={p.role} onSave={(v) => save({ role: v })} placeholder="Pastor" />
      <Field label="Church" hint="The congregation you serve, or hope to." value={state.churchName} onSave={(v) => { setChurchName(v); toast('Saved'); }} placeholder="Grace Community Church" />
      <Field label="Where you are" value={p.location} onSave={(v) => save({ location: v })} placeholder="London, UK" />
      <div className="set-row">
        <div className="t"><b>Your Sabbath</b><small>A full day of rest each week. Today shows only your soul’s rhythm on that day, and reminds you the day before.</small></div>
        <Seg value={String(p.sabbathDay ?? 1)} onChange={(v) => save({ sabbathDay: Number(v) })} options={DAYS.map((d, i) => [String(i), d])} />
      </div>
      <Field label="Church website" value={p.links.church} onSave={(v) => save({ links: { church: v } })} placeholder="https://…" type="url" />
      <Field label="Sermon archive" value={p.links.sermons} onSave={(v) => save({ links: { sermons: v } })} placeholder="https://…" type="url" />
    </div>
  );
}

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export function PhoneCard() {
  const { state, sel, setReminder } = useStore();
  const toast = useToast();
  const [canInstall, setCanInstall] = useState(!!window.__installPrompt);
  const [perm, setPerm] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const installed = standalone();
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const on = () => setCanInstall(true);
    window.addEventListener('installable', on);
    return () => window.removeEventListener('installable', on);
  }, []);

  const install = async () => {
    const e = window.__installPrompt;
    if (!e) return;
    e.prompt();
    await e.userChoice;
    window.__installPrompt = null;
    setCanInstall(false);
  };

  const enable = async (on) => {
    if (!on) { setReminder({ enabled: false }); return; }
    if (typeof Notification === 'undefined') { toast('This browser cannot show notifications'); return; }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p !== 'granted') { toast('Notifications are blocked for this site'); return; }
    setReminder({ enabled: true });
    // Background checks where the browser supports them (installed app, Android Chrome)
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg && 'periodicSync' in reg) await reg.periodicSync.register('daily-reminder', { minInterval: 3 * 60 * 60 * 1000 });
    } catch { /* not available: in-app reminders still work */ }
    toast('Reminders on');
  };

  const tasksLeft = sel.todaysTotal - sel.todaysDone;

  return (
    <div className="card" id="phone-install">
      <div className="card-h"><h2>Phone and reminders</h2><span className="muted small">{installed ? 'Installed' : 'Not installed yet'}</span></div>
      <div className="set-row">
        <div className="t"><b>Install Boēthos</b>
          <small>{installed ? 'You are using the installed app.'
            : ios ? 'In Safari: tap Share, then “Add to Home Screen”. Open it from your home screen for reminders.'
            : 'Adds Boēthos to your home screen as its own app, and it works offline.'}</small>
        </div>
        {!installed && !ios && (canInstall
          ? <button className="primary" onClick={install}>Install</button>
          : <span className="muted small">In Chrome: menu ⋮ → “Install app”</span>)}
      </div>
      <p className="note-banner" style={{ margin: '4px 0 16px' }}>
        <b>How reminders reach you.</b> While Boēthos is open or in the background they always arrive. To get them when it is fully closed
        (on iPhone too), connect cloud sync and turn on push below: your phone then receives them from your own server.
      </p>
    </div>
  );
}

// What a full week means. Today tracks each target once your phase calls for it.
const TARGET_ROWS = [
  ['prayerDays', 'Days of prayer', 'Out of seven. Six leaves the Sabbath free if you choose.', [4, 5, 6, 7]],
  ['contacts', 'People contacted', 'Calls, messages and visits to people in your care.', [3, 5, 8, 12]],
  ['visits', 'Visits', 'Home and hospital visits. Quarterly per household is the minimum.', [1, 2, 3, 5]],
  ['disciplines', 'Disciplines kept', 'From the weekly disciplines list in Prayer.', [2, 3, 4, 6]],
];
export function TargetsCard() {
  const { state, setWeeklyTargets } = useStore();
  const toast = useToast();
  return (
    <div className="card" id="weekly">
      <div className="card-h"><h2>Weekly targets</h2><span className="muted small">Shown on Today</span></div>
      {TARGET_ROWS.map(([k, label, hint, opts]) => (
        <div className="set-row" key={k}>
          <div className="t"><b>{label}</b><small>{hint}</small></div>
          <Seg value={String(state.weeklyTargets[k])} onChange={(v) => { setWeeklyTargets({ [k]: Number(v) }); toast(`${label}: ${v} a week`); }}
            options={opts.map(n => [String(n), n === 0 ? 'Off' : String(n)])} />
        </div>
      ))}
    </div>
  );
}
