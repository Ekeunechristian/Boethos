import { useState } from 'react';
import TimeInput from '../lib/TimeInput.jsx';
import { Bell, BellOff, Sunrise, HandHeart, BookOpen, Flame, ListChecks, Library, Moon, PhoneCall, AlarmClock, CalendarCheck, Church, ClipboardCheck, Users, Mic, Footprints, MessageCircle, NotebookPen, Sparkles, LifeBuoy, Megaphone, Home, Send } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { useToast } from '../lib/ui.jsx';
import { NOTIFY_TYPES, NOTIFY_SAMPLE, teleTimes } from '../store/ministry';
import { cloudConfig } from '../lib/cloud';
import { notify } from '../components/Engine.jsx';

// Your walk with God: the reminders Spoudazō sends, from your rhythm
const LIFE_TYPES = [
  { id: 'quiet', icon: Sunrise, label: 'Quiet time', desc: 'At your quiet time, until you have kept it.', time: 'quietTime', sample: 'Time for your quiet time.' },
  { id: 'prayer', icon: HandHeart, label: 'Prayer times', desc: 'At each of your set prayer times.', times: 'prayerTimes', sample: 'Prayer time.' },
  { id: 'prayerLog', icon: Moon, label: 'Log today’s prayer', desc: 'In the evening, if today’s prayer isn’t logged.', time: 'prayerLogTime', sample: 'Log today’s prayer before you sleep.' },
  { id: 'points', icon: ListChecks, label: 'Prayer points', desc: 'Once a day, while you have open prayer points.', time: 'pointsTime', sample: 'Your prayer points are waiting for you.' },
  { id: 'study', icon: BookOpen, label: 'Bible study', desc: 'At your study time, while you have a study topic.', time: 'studyTime', sample: 'Time for your Bible study.' },
  { id: 'reading', icon: Library, label: 'Reading', desc: 'At your reading time, for the book you are reading.', time: 'readingTime', sample: 'Time to read your book.' },
  { id: 'fasting', icon: Flame, label: 'Fast days', desc: 'The morning of a fast day, and at 20:00 the evening before.', time: 'wake', sample: 'Today is a fast day.' },
];
const PM_ICON = { tele: PhoneCall, deadline: AlarmClock, followups: CalendarCheck, visits: Home, meetingSoon: Church, attendance: ClipboardCheck, prepare: Users, sermon: Mic, evangelism: Footprints, chat: MessageCircle, pvti: NotebookPen, welcome: Sparkles, absence: Users, care: LifeBuoy, campaigns: Megaphone };

function Switch({ on, onChange, label, disabled }) {
  return <label className={'st-sw' + (disabled ? ' off' : '')}><input type="checkbox" role="switch" checked={on} disabled={disabled} onChange={e => onChange(e.target.checked)} aria-label={label} /><span aria-hidden="true" /></label>;
}

// One kind of notification: what it is, when it comes, on or off, and a test
function Row({ icon: Ic, label, desc, when, on, onToggle, onTest, disabled }) {
  return (
    <li className={'st-n' + (on ? '' : ' muted-row')}>
      <span className="st-n-ic"><Ic size={17} /></span>
      <span className="st-n-t"><b>{label}</b><small>{desc}</small></span>
      <span className="st-n-when">{when}</span>
      <button type="button" className="st-test" onClick={onTest} disabled={!on || disabled} title="Send a test now">Test</button>
      <Switch on={on} onChange={onToggle} label={label} />
    </li>
  );
}

export default function NotificationsCard() {
  const { state, life, dispatch } = useStore();
  const toast = useToast();
  const [perm, setPerm] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const g = state.life.goals, lr = g.reminders || {};
  const m = state.ministry, r = m.settings.reminders, types = r.types || {};
  const setM = (data) => dispatch({ type: 'M_SETTINGS', data });
  const setLife = (data) => life('GOALS', { data });
  const push = !!cloudConfig().pushEndpoint;
  const allow = async () => {
    if (typeof Notification === 'undefined') { toast('This browser cannot show notifications'); return false; }
    const p = await Notification.requestPermission(); setPerm(p);
    if (p !== 'granted') { toast('Notifications are blocked for this site. Allow them in the browser’s site settings.'); return false; }
    return true;
  };
  const test = async (text) => {
    if (perm !== 'granted' && !(await allow())) return;
    await notify(text, { tag: `boethos-test-${Date.now()}`, url: '/?go#/settings' });
    toast('Test sent. It should appear in a moment.');
  };
  const testAll = async () => {
    if (perm !== 'granted' && !(await allow())) return;
    const on = [...LIFE_TYPES.filter(x => lr[x.id]).map(x => x.sample), ...NOTIFY_TYPES.filter(x => types[x.id] !== false).map(x => NOTIFY_SAMPLE[x.id]())];
    for (let i = 0; i < on.length; i++) await notify(on[i], { tag: `boethos-test-${i}-${Date.now()}`, url: '/?go#/settings' });
    toast(`${on.length} test notifications sent`);
  };
  const time = (k, v) => <TimeInput className="st-time" value={v || ''} onChange={e => setLife({ [k]: e.target.value })} aria-label="Time" />;
  const pmWhen = {
    tele: <a href="#/poimaino/followup/telepastoring" className="st-link">{teleTimes(m).join(', ')}</a>,
    followups: <TimeInput className="st-time" value={r.followupTime || '09:00'} onChange={e => setM({ reminders: { followupTime: e.target.value } })} aria-label="Follow-up time" />,
    meetingSoon: <span className="st-num"><input type="number" min="0" value={r.beforeMinutes} onChange={e => setM({ reminders: { beforeMinutes: Number(e.target.value) || 0 } })} aria-label="Minutes before" />min before</span>,
    attendance: <span className="st-num"><input type="number" min="0" value={r.afterMinutes} onChange={e => setM({ reminders: { afterMinutes: Number(e.target.value) || 0 } })} aria-label="Minutes after" />min after</span>,
    ...Object.fromEntries([['evangelism', 'evangelism'], ['chat', 'chat'], ['pvti', 'pvti']].map(([id, k]) => [id, <TimeInput key={id} className="st-time" value={(m.settings.daily || {})[k] || ''} onChange={e => setM({ daily: { ...(m.settings.daily || {}), [k]: e.target.value } })} aria-label="Time" />])),
  };
  const lifeOn = LIFE_TYPES.filter(x => lr[x.id]).length, pmOn = NOTIFY_TYPES.filter(x => types[x.id] !== false).length;
  return (
    <section className="st-card" id="notifications">
      <header className="st-h"><span className="st-h-ic"><Bell size={20} /></span><div><h2>Notifications</h2><p>Every reminder Boēthos can send, when it comes, and a test for each. Timed ones also give you a heads-up beforehand.</p></div></header>

      <div className={'st-status ' + (perm === 'granted' ? 'ok' : perm === 'denied' ? 'bad' : 'warn')}>
        {perm === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
        <span><b>{perm === 'granted' ? 'Notifications are allowed on this device' : perm === 'denied' ? 'Notifications are blocked on this device' : perm === 'unsupported' ? 'This browser can’t show notifications' : 'Notifications are not allowed yet'}</b>
          <small>{push ? 'This device gets them from your cloud server, even when Boēthos is closed.' : 'They arrive while Boēthos is open or in the background. Connect the cloud and turn on push (below) to get them when it is closed.'}</small></span>
        {perm !== 'granted' && perm !== 'unsupported' && perm !== 'denied' && <button className="primary sm" onClick={allow}>Allow</button>}
        {perm === 'granted' && <button className="sm" onClick={testAll}><Send size={14} />Test every one that’s on</button>}
      </div>

      <div className="st-rules">
        <div><b>Quiet hours</b><span><TimeInput className="st-time" value={r.quietFrom} onChange={e => setM({ reminders: { quietFrom: e.target.value } })} aria-label="Quiet from" /> to <TimeInput className="st-time" value={r.quietTo} onChange={e => setM({ reminders: { quietTo: e.target.value } })} aria-label="Quiet until" /></span><small>Nothing comes in these hours; it waits until they end.</small></div>
        <div><b>Heads-up before</b><span className="st-seg">{[[0, 'Off'], [15, '15 min'], [30, '30 min'], [60, '1 hour']].map(([v, l]) => <button key={v} type="button" className={Number(r.leadMinutes ?? 30) === v ? 'on' : ''} onClick={() => setM({ reminders: { leadMinutes: v } })}>{l}</button>)}</span><small>Every timed reminder comes twice: this long before, and at the time itself.</small></div>
        <div><b>While you’re busy</b><span><Switch on={state.profile.holdWhenBusy !== false} onChange={v => dispatch({ type: 'UPDATE_PROFILE', data: { holdWhenBusy: v } })} label="Hold reminders while busy" /></span><small>Reminders wait until a commitment in <a href="#life" className="st-link" onClick={e => { e.preventDefault(); document.getElementById('life')?.scrollIntoView({ behavior: 'smooth' }); }}>Your life</a> ends.</small></div>
        <div><b>Shepherding delivery</b><span className="st-seg">{[['instant', 'As each is due'], ['morning', 'Morning summary']].map(([v, l]) => <button key={v} type="button" className={r.digest === v ? 'on' : ''} onClick={() => setM({ reminders: { digest: v } })}>{l}</button>)}</span><small>One summary each morning instead of one at a time.</small></div>
      </div>

      <div className="st-group">
        <div className="st-group-h"><h3>Your walk with God</h3><span>{lifeOn} of {LIFE_TYPES.length} on</span></div>
        <ul className="st-list">{LIFE_TYPES.map(x => (
          <Row key={x.id} icon={x.icon} label={x.label} desc={x.desc} on={!!lr[x.id]} onToggle={v => setLife({ reminders: { [x.id]: v } })} onTest={() => test(x.sample)}
            when={x.times ? <a href="#rhythm" className="st-link" onClick={e => { e.preventDefault(); document.getElementById('rhythm')?.scrollIntoView({ behavior: 'smooth' }); }}>{(g[x.times] || []).join(', ') || 'No times'}</a> : time(x.time, g[x.time])} />
        ))}</ul>
      </div>

      <div className="st-group">
        <div className="st-group-h"><h3>Shepherding</h3><span><Switch on={r.enabled} onChange={v => setM({ reminders: { enabled: v } })} label="All shepherding reminders" />{r.enabled ? `${pmOn} of ${NOTIFY_TYPES.length} on` : 'All off'}</span></div>
        <ul className={'st-list' + (r.enabled ? '' : ' disabled')}>{NOTIFY_TYPES.map(x => (
          <Row key={x.id} icon={PM_ICON[x.id] || Bell} label={x.label} desc={x.desc} on={r.enabled && types[x.id] !== false} disabled={!r.enabled}
            onToggle={v => setM({ reminders: { enabled: true, types: { [x.id]: v } } })} onTest={() => test(NOTIFY_SAMPLE[x.id]())} when={pmWhen[x.id] || <span className="st-auto">When due</span>} />
        ))}</ul>
        <p className="st-note">On the lock screen, shepherding reminders never show names or notes: they say “Greater Love: 2 things need you”. Telepastoring reminders carry a verse instead.</p>
      </div>
    </section>
  );
}
