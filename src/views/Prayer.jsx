import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { ACTS, PRAYER_KINDS, REQUEST_CATEGORIES } from '../data/library';
import { go } from '../lib/router';
import { Seg, Head, Sheet, SheetHead, TitleBlock, Picker, fmtDate, useToast } from '../lib/ui.jsx';
import Collection from '../components/Collection.jsx';
import Fasting from './spoudazo/Fasting.jsx';
import { lifeStats, streaks } from '../store/life';
import { addDays } from '../store/ministry';

const today = () => new Date().toLocaleDateString('en-CA');
const hm = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`; };

// Today's prayer times: tick each one as you keep it
function TimeChips() {
  const { state, life } = useStore();
  const times = state.life.goals.prayerTimes || [];
  const t = today();
  if (!times.length) return <p className="muted small" style={{ margin: 0 }}>No prayer times set. <a href="#/settings">Set them</a>.</p>;
  return <div className="pt-chips">{times.map(x => { const on = !!state.life.prayerTimes[t]?.[x]; return <button key={x} type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => life('PRAYER_TIME', { time: x, on: !on })}>{on && <Check size={13} />}{x}</button>; })}</div>;
}

// Logging a time of prayer: from here and from Today's prayer tile.
export function PrayerSheet({ onClose, withTimes }) {
  const { state, logPrayer, life } = useStore();
  const toast = useToast();
  const kinds = [...PRAYER_KINDS.filter(k => k !== 'Other'), ...(state.life.customKinds || []), 'Other'];
  const [form, setForm] = useState({ duration: 60, category: kinds[0], focuses: ACTS.map(a => a.id), intercessionFor: '', notes: '' });
  const [newKind, setNewKind] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const flip = (id) => set('focuses', form.focuses.includes(id) ? form.focuses.filter(x => x !== id) : [...form.focuses, id]);
  const addKind = () => { const k = (newKind || '').trim(); if (!k) return; life('KIND_ADD', { name: k }); set('category', k); setNewKind(null); };
  const mins = state.prayerSessions.filter(s => s.date === today()).reduce((n, s) => n + (Number(s.duration) || 0), 0);
  return (
    <Sheet onClose={onClose} className="wide" label="Log prayer">
      <SheetHead eyebrow={withTimes ? `Today: ${hm(mins)} of ${hm(state.life.goals.prayerMinutes)}` : 'Prayer'} title="Log a time of prayer" onClose={onClose} />
      {withTimes && <div className="ps-times"><span>Prayer times kept today</span><TimeChips /></div>}
      <form onSubmit={(e) => { e.preventDefault(); logPrayer({ ...form, duration: parseInt(form.duration, 10) || 0 }); toast('Prayer logged'); onClose(); }}>
        <div className="fields">
          <div className="field"><label htmlFor="p-min">Minutes</label><input id="p-min" type="number" min="1" max="600" value={form.duration} onChange={e => set('duration', e.target.value)} /></div>
          <div className="field"><label>Kind of prayer</label>
            {newKind === null ? <div className="ps-kind"><Picker label="Kind of prayer" value={form.category} onChange={v => set('category', v)} options={kinds.map(k => ({ value: k, label: k }))} /><button type="button" className="sm" onClick={() => setNewKind('')}><Plus size={14} />New kind</button></div>
              : <div className="ps-kind"><input autoFocus value={newKind} onChange={e => setNewKind(e.target.value)} placeholder="Night vigil" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKind(); } }} aria-label="New kind of prayer" /><button type="button" className="sm primary" onClick={addKind}>Add</button><button type="button" className="ghost sm" onClick={() => setNewKind(null)}>Cancel</button></div>}
          </div>
          <div className="field wide">
            <label>The ACTS shape: what you prayed</label>
            <div className="acts-pick">
              {ACTS.map(a => (
                <button type="button" key={a.id} className={form.focuses.includes(a.id) ? 'on' : ''} onClick={() => flip(a.id)} aria-pressed={form.focuses.includes(a.id)}>
                  <b>{a.label}</b><small>{a.desc}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="field wide"><label htmlFor="p-for">Prayed for</label><input id="p-for" value={form.intercessionFor} placeholder="Names, the Bacenta, the church…" onChange={e => set('intercessionFor', e.target.value)} /></div>
          <div className="field wide"><label htmlFor="p-notes">Notes <em>optional</em></label><textarea id="p-notes" value={form.notes} placeholder="What God impressed on you" onChange={e => set('notes', e.target.value)} style={{ minHeight: 70 }} /></div>
        </div>
        <div className="sheet-foot"><span className="grow" /><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="primary">Log prayer</button></div>
      </form>
    </Sheet>
  );
}

function Log() {
  const { state, deletePrayer } = useStore();
  const [open, setOpen] = useState(false);
  const t = today();
  const goal = state.life.goals.prayerMinutes;
  const minsOn = (d) => state.prayerSessions.filter(s => s.date === d).reduce((a, s) => a + (Number(s.duration) || 0), 0);
  const days = Array.from({ length: 14 }, (_, i) => { const iso = addDays(t, i - 13); return { iso, mins: minsOn(iso) }; });
  const total14 = days.reduce((n, d) => n + d.mins, 0);
  const met = days.filter(d => d.mins >= goal).length;
  const top = Math.max(goal, ...days.map(d => d.mins)) * 1.1;
  const todayMins = minsOn(t);
  const st = streaks(state.prayerSessions.map(s => s.date), t);
  const week = lifeStats(state, t).prayer7;
  const recent = [...state.prayerSessions].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 5);
  const since30 = addDays(t, -29);
  const byKind = Object.entries(state.prayerSessions.filter(s => s.date >= since30).reduce((m, s) => ({ ...m, [s.category || 'Other']: (m[s.category || 'Other'] || 0) + (Number(s.duration) || 0) }), {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const kindTop = byKind[0]?.[1] || 1;
  const short = (id) => ACTS.find(a => a.id === id)?.label[0] || '';
  return (
    <div className="cols">
      <div className="stack">
        <div className={'card pl-today' + (todayMins >= goal ? ' done' : '')}>
          <div className="pl-t">
            <small>Today</small>
            <b>{hm(todayMins)} <span>of {hm(goal)}</span></b>
            <span className="ch-bar"><i style={{ width: `${Math.min(100, (todayMins / goal) * 100)}%` }} /></span>
            <em>{todayMins >= goal ? 'Your prayer is full today. Pray again whenever you can.' : `${hm(goal - todayMins)} still to pray`}</em>
          </div>
          <button className="primary" onClick={() => setOpen(true)}><Plus size={18} />Log prayer</button>
        </div>

        <section className="card">
          <div className="card-h"><h2>The last 14 days</h2><span className="muted small">The line is your {hm(goal)}</span></div>
          <div className="pl-chart" role="img" aria-label={`Prayer minutes for the last 14 days; goal ${goal} minutes`}>
            <i className="pl-goal" style={{ bottom: `${(goal / top) * 100}%` }} />
            {days.map(d => (
              <div key={d.iso} className={'pl-col' + (d.iso === t ? ' today' : '') + (d.mins >= goal ? ' met' : '')} title={`${fmtDate(d.iso)}: ${d.mins} min`}>
                <span className="pl-bar" style={{ height: `${(d.mins / top) * 100}%` }}>{d.mins > 0 && <em>{d.mins >= 60 ? `${Math.round(d.mins / 6) / 10}h` : d.mins}</em>}</span>
                <small>{new Date(d.iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'narrow' })}</small>
              </div>
            ))}
          </div>
          <div className="pl-stats">
            <div><b>{hm(Math.round(total14 / 14))}</b><span>a day on average</span></div>
            <div><b>{met} <small>of 14</small></b><span>days you reached {hm(goal)}</span></div>
            <div><b>{Math.round(total14 / 6) / 10} h</b><span>in two weeks</span></div>
          </div>
        </section>

        <section className="card">
          <div className="card-h"><h2>Recent prayer</h2><span className="muted small">{state.prayerSessions.length} times recorded</span></div>
          {recent.length === 0 ? <p className="muted" style={{ margin: 0 }}>No prayer logged yet.</p> : (
            <ul className="pl-list">{recent.map(s => (
              <li key={s.id}>
                <span className="pl-min"><b>{s.duration || 0}</b><small>min</small></span>
                <span className="pl-b">
                  <b>{s.category || 'Prayer'}</b>
                  <small>{fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'short' })}{s.intercessionFor ? ` · for ${s.intercessionFor}` : ''}</small>
                  {s.notes && <span className="pl-note">{s.notes}</span>}
                </span>
                <span className="pl-acts" aria-label="ACTS">{ACTS.map(a => <i key={a.id} className={(s.focuses || []).includes(a.id) ? 'on' : ''} title={a.label}>{short(a.id)}</i>)}</span>
                <button className="ghost sm" onClick={() => deletePrayer(s.id)} aria-label="Delete this entry"><X size={14} /></button>
              </li>
            ))}</ul>
          )}
        </section>
      </div>
      <aside className="aside even">
        <section>
          <h3>Today’s prayer times</h3>
          <TimeChips />
        </section>
        <section>
          <h3>Your rhythm</h3>
          <TitleBlock className="grid" items={[['Days in a row', st.current], ['Best run', st.best]]} />
          <div className="pl-week"><span>This week</span><b>{hm(week)} <small>of {hm(goal * 7)}</small></b></div>
          <span className="ch-bar"><i style={{ width: `${Math.min(100, (week / (goal * 7)) * 100)}%` }} /></span>
        </section>
        <section>
          <h3>How you pray</h3>
          <p className="muted small" style={{ marginTop: 0 }}>The last 30 days, by kind of prayer.</p>
          {byKind.length === 0 ? <p className="muted small">Nothing yet.</p> : <ul className="pl-kinds">{byKind.map(([k, m]) => (
            <li key={k}><span>{k}</span><em>{hm(m)}</em><span className="ch-bar"><i style={{ width: `${(m / kindTop) * 100}%` }} /></span></li>
          ))}</ul>}
        </section>
        <section>
          <h3>The ACTS shape</h3>
          <ul className="acts-list">{ACTS.map(a => <li key={a.id}><b>{a.label}</b><span>{a.desc}</span></li>)}</ul>
        </section>
      </aside>
      {open && <PrayerSheet onClose={() => setOpen(false)} />}
    </div>
  );
}

// Prayer points: what to carry to God, written down so you never forget
function Points() {
  const s = useStore();
  const { state, life } = s;
  const cats = [...REQUEST_CATEGORIES.filter(c => c !== 'Other'), ...(state.life.customCats || []), 'Other'];
  const [cat, setCat] = useState('');
  const [adding, setAdding] = useState(null);
  const items = state.prayerRequests.filter(r => !cat || r.category === cat);
  const count = (c) => state.prayerRequests.filter(r => r.category === c && !r.answered).length;
  const add = () => { const c = (adding || '').trim(); if (c) life('CAT_ADD', { name: c }); setAdding(null); };
  return (
    <>
      <div className="pp-cats" role="group" aria-label="Categories">
        <button type="button" className={cat === '' ? 'on' : ''} onClick={() => setCat('')}>All<em>{state.prayerRequests.filter(r => !r.answered).length}</em></button>
        {cats.map(c => <button key={c} type="button" className={cat === c ? 'on' : ''} onClick={() => setCat(cat === c ? '' : c)}>{c}{count(c) > 0 && <em>{count(c)}</em>}</button>)}
        {adding === null ? <button type="button" className="pp-new" onClick={() => setAdding('')}><Plus size={14} />Category</button>
          : <span className="pp-add"><input autoFocus value={adding} onChange={e => setAdding(e.target.value)} placeholder="Campus" aria-label="New category" onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(null); }} /><button type="button" className="sm primary" onClick={add}>Add</button></span>}
      </div>
      <Collection noun="prayer point" items={items}
        emptyTitle={cat ? `No prayer points under ${cat}.` : 'No prayer points yet.'} emptyText="When something comes to mind to pray about, put it here, then go through the list when you pray."
        sort={(a, b) => (a.answered - b.answered) || (b.urgent - a.urgent) || (b.date || '').localeCompare(a.date || '')}
        fields={[
          { key: 'text', label: 'Prayer point', type: 'textarea', required: true },
          { key: 'person', label: 'For whom' },
          ...(state.ministry.people.length ? [{ key: 'memberId', label: 'A sheep in your Bacenta (optional)', type: 'select', options: [['', '—'], ...state.ministry.people.filter(p => !['departed', 'transferred'].includes(p.membership)).sort((a, b) => a.name.localeCompare(b.name)).map(p => [p.id, p.name])] }] : []),
          { key: 'category', label: 'Category', type: 'select', options: cats },
          { key: 'urgent', label: 'Urgent', type: 'checkbox' },
          { key: 'answered', label: 'God has answered', type: 'checkbox' },
          { key: 'answer', label: 'How God answered', type: 'textarea' },
        ]}
        defaults={{ category: cat || 'Member', urgent: false, answered: false }}
        row={r => ({
          title: r.person || state.ministry.people.find(p => p.id === r.memberId)?.name || r.text || r.request, sub: (r.person || r.memberId) ? (r.text || r.request) : r.category,
          meta: r.answered ? <span className="pill good">Answered{r.answeredDate ? ` ${fmtDate(r.answeredDate)}` : ''}</span> : r.urgent ? <span className="pill bad">Urgent</span> : <span className="pill">{r.category}</span>,
        })}
        onAdd={s.addPrayerRequest} onUpdate={s.updatePrayerRequest} onDelete={s.deletePrayerRequest} />
    </>
  );
}

const TABS = [['log', 'Prayer log'], ['points', 'Prayer points'], ['fasting', 'Fasting']];
const INTRO = {
  log: ['The engine room', 'No ministry output before spiritual input. Your prayer times, and every time of prayer with its shape.'],
  points: ['Prayer points', 'What to carry to God, written down so you never forget. Go through them when you pray, and write down when He answers.'],
  fasting: ['Fasting', 'Your fast days, the fasts you set to repeat, and how often you fast.'],
};

export default function Prayer({ tab = 'log' }) {
  const { state } = useStore();
  const t = INTRO[tab] ? tab : 'log';
  const open = state.prayerRequests.filter(r => !r.answered).length;
  const st = streaks(state.prayerSessions.map(s => s.date), today());
  return (
    <>
      <Head eyebrow="Spoudazō" step={st.current ? `Prayed ${st.current} days in a row` : 'Prayer and fasting'} title={INTRO[t][0]} sub={INTRO[t][1]}>
        <TitleBlock items={[['This week', hm(lifeStats(state, today()).prayer7)], ['Prayer points', open], ['Fasts kept', state.life.fasts.filter(f => f.status === 'done').length]]} />
      </Head>
      <div style={{ marginBottom: 24 }}><Seg value={t} onChange={(v) => go('prayer', ...(v === 'log' ? [] : [v]))} options={TABS} /></div>
      {t === 'log' && <Log />}
      {t === 'points' && <Points />}
      {t === 'fasting' && <Fasting />}
    </>
  );
}
