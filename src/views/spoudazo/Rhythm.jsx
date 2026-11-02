import { useState } from 'react';
import TimeInput from '../../lib/TimeInput.jsx';
import { X, Plus, Minus, Sunrise, BookOpen, HandHeart, AlarmClock, Bell } from 'lucide-react';
import { useStore } from '../../store/index.jsx';
import { useToast, Picker } from '../../lib/ui.jsx';
import { STUDY_TOPICS, PRAYER_MIN } from '../../data/spoudazo';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hm = (min) => { const h = Math.floor(min / 60), m = min % 60; return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`; };

// − value + : big enough for a thumb
export function Stepper({ value, onChange, min = 0, max = 999, step = 1, format = (v) => v, label }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - step)} disabled={value <= min} aria-label={`Less ${label}`}><Minus size={18} /></button>
      <output aria-live="polite">{format(value)}</output>
      <button type="button" onClick={() => set(value + step)} disabled={value >= max} aria-label={`More ${label}`}><Plus size={18} /></button>
    </div>
  );
}

const TimePill = ({ value, onChange, label }) => <TimeInput className="time-pill" value={value || ''} onChange={e => onChange(e.target.value)} aria-label={label} />;

// Your rhythm: the goals Spoudazō builds each day from. Shared by the first run and Settings.
export function RhythmFields({ value: g, onChange, topic, onTopic, noReminders }) {
  const set = (k, v) => onChange({ ...g, [k]: v });
  const times = g.prayerTimes || [];
  const setTime = (i, v) => set('prayerTimes', times.map((x, j) => (j === i ? v : x)));
  const addTime = () => { const free = ['06:00', '12:00', '15:00', '18:00', '21:00', '00:00'].find(t => !times.includes(t)) || '12:00'; set('prayerTimes', [...times, free]); };
  // the day in order of time
  const rows = [
    { key: 'wake', time: g.wake, icon: AlarmClock, title: 'I rise', note: 'Before the phone, before the work.', onTime: v => set('wake', v) },
    { key: 'quiet', time: g.quietTime, icon: Sunrise, title: 'Quiet time', note: 'Alone with God.', onTime: v => set('quietTime', v),
      extra: <Stepper label="quiet time" value={g.quietMinutes} onChange={v => set('quietMinutes', v)} min={15} max={240} step={15} format={hm} /> },
    ...times.map((t, i) => ({ key: `p${i}`, time: t, icon: HandHeart, title: 'Prayer', note: 'A set time to pray.', onTime: v => setTime(i, v), remove: () => set('prayerTimes', times.filter((_, j) => j !== i)) })),
    { key: 'study', time: g.studyTime, icon: BookOpen, title: 'Bible study', note: 'Your study topic, with your Bible open.', onTime: v => set('studyTime', v),
      extra: <Stepper label="Bible study" value={g.studyMinutes} onChange={v => set('studyMinutes', v)} min={15} max={240} step={15} format={hm} /> },
  ].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));

  return (
    <div className="rhythm2">
      <section className="r2-sec">
        <h3 className="r2-h"><span>1</span>Your day with God</h3>
        <ol className="dayline">
          {rows.map(r => (
            <li key={r.key} className={'dl-' + r.key.replace(/\d+$/, '')}>
              <TimePill value={r.time} onChange={r.onTime} label={`${r.title} time`} />
              <span className="dl-dot" aria-hidden="true"><r.icon size={15} /></span>
              <div className="dl-body"><b>{r.title}</b><small>{r.note}</small></div>
              {r.extra}
              {r.remove && <button type="button" className="dl-x" onClick={r.remove} aria-label={`Remove prayer at ${r.time}`}><X size={16} /></button>}
            </li>
          ))}
        </ol>
        <button type="button" className="dl-add" onClick={addTime}><Plus size={16} />Add a prayer time</button>
      </section>

      <section className="r2-sec">
        <h3 className="r2-h"><span>2</span>How much, each day and week</h3>
        <div className="measures">
          <div className="measure wide"><HandHeart size={20} /><div className="m-t"><b>Prayer each day</b><small>At least 3 hours</small></div>
            <Stepper label="prayer" value={Math.max(PRAYER_MIN, g.prayerMinutes)} onChange={v => set('prayerMinutes', v)} min={PRAYER_MIN} max={720} step={30} format={hm} /></div>
          <div className="measure"><div className="m-t"><b>Bible chapters</b><small>a day</small></div><Stepper label="chapters" value={g.chaptersPerDay} onChange={v => set('chaptersPerDay', v)} min={1} max={50} /></div>
          <div className="measure"><div className="m-t"><b>Memory verses</b><small>new each month</small></div><Stepper label="memory verses" value={g.memoryPerMonth} onChange={v => set('memoryPerMonth', v)} max={20} /></div>
          <div className="measure"><div className="m-t"><b>Books</b><small>a month</small></div><Stepper label="books" value={g.booksPerMonth} onChange={v => set('booksPerMonth', v)} max={10} /></div>
          <div className="measure"><div className="m-t"><b>Reading</b><small>a day</small></div><Stepper label="reading" value={g.readingMinutes} onChange={v => set('readingMinutes', v)} max={180} step={5} format={hm} /></div>
          <div className="measure"><div className="m-t"><b>Messages</b><small>a week</small></div><Stepper label="messages" value={g.messagesPerWeek} onChange={v => set('messagesPerWeek', v)} max={21} /></div>
        </div>
        {onTopic && <div className="r2-topic"><label>What will you study first?</label><Picker label="Study topic" value={topic || ''} onChange={onTopic} options={[{ value: '', label: 'Decide later' }, ...STUDY_TOPICS.map(x => ({ value: x.id, label: x.title }))]} /></div>}
      </section>

      <section className="r2-sec">
        <h3 className="r2-h"><span>3</span>Fasting</h3>
        <div className="fast-row">
          <div className="day-chips" role="group" aria-label="Weekly fast days">{DAYS.map((d, i) => { const on = (g.fastDays || []).includes(i); return <button type="button" key={d} className={on ? 'on' : ''} aria-pressed={on} onClick={() => set('fastDays', on ? g.fastDays.filter(x => x !== i) : [...(g.fastDays || []), i].sort())}>{d}</button>; })}</div>
          <label className="fast-until">until <TimePill value={g.fastUntil} onChange={v => set('fastUntil', v)} label="Fast until" /></label>
        </div>
        <p className="r2-note">{(g.fastDays || []).length ? `You will fast every ${g.fastDays.map(i => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]).join(' and ')} until ${g.fastUntil}.` : 'No weekly fast day. You can still plan fasts any time.'}</p>
      </section>

      {!noReminders && <section className="r2-sec">
        <h3 className="r2-h"><span>4</span><Bell size={16} />Remind me</h3>
        <div className="switches">{[['quiet', 'At my quiet time'], ['prayer', 'At each prayer time'], ['prayerLog', 'In the evening, to log my prayer'], ['points', 'Once a day, my prayer points'], ['study', 'At my Bible study'], ['reading', 'At my reading time, for my book'], ['fasting', 'On fast days, and the evening before']].map(([k, lab]) => (
          <label className="switch" key={k}><input type="checkbox" role="switch" checked={!!g.reminders?.[k]} onChange={e => set('reminders', { ...(g.reminders || {}), [k]: e.target.checked })} /><span className="sw" aria-hidden="true" />{lab}</label>))}</div>
      </section>}
    </div>
  );
}

// The Settings card
export default function RhythmCard() {
  const { state, life } = useStore();
  const toast = useToast();
  const [g, setG] = useState({ ...state.life.goals, prayerMinutes: Math.max(PRAYER_MIN, state.life.goals.prayerMinutes) });
  const dirty = JSON.stringify(g) !== JSON.stringify(state.life.goals);
  return (
    <div className="card" id="rhythm">
      <div className="card-h"><h2>Your rhythm</h2><span className="muted small">Spoudazō builds each day from this. Its reminders are under Notifications.</span></div>
      <RhythmFields value={g} onChange={setG} noReminders />
      <div className="row-btns" style={{ marginTop: 14 }}>
        <button className="primary" disabled={!dirty && state.life.setupDone} onClick={() => { life(state.life.setupDone ? 'GOALS' : 'SETUP', state.life.setupDone ? { data: g } : { goals: g }); toast('Rhythm saved'); }}>Save rhythm</button>
        {dirty && <button className="ghost" onClick={() => setG(state.life.goals)}>Undo changes</button>}
      </div>
    </div>
  );
}
