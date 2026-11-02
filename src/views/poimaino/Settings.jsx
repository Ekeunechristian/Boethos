import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { STAGES_DEFAULT, OUTREACH_DEFAULT, STABLE_CRITERIA, MILESTONES } from '../../data/ministry';
import { Head, Picker, useToast } from '../../lib/ui.jsx';
import { useM, Label } from './common.jsx';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ZONES = (() => { try { return Intl.supportedValuesOf('timeZone'); } catch { return ['Europe/London', 'Africa/Accra', 'UTC']; } })();

// An editable list of short strings (outreach statuses, criteria, recipients).
function ListEdit({ items, onChange, placeholder, numeric }) {
  const [v, setV] = useState('');
  const add = () => { const x = numeric ? Number(v) : v.trim(); if ((numeric ? x > 0 : x) && !items.includes(x)) onChange(numeric ? [...items, x].sort((a, b) => a - b) : [...items, x]); setV(''); };
  return (
    <div className="list-edit">
      <ul>{items.map((x, i) => <li key={String(x) + i}><span>{x}</span><button type="button" className="ghost sm" aria-label={`Remove ${x}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><X size={14} /></button></li>)}</ul>
      <div className="pa-form"><label>Add<input value={v} type={numeric ? 'number' : 'text'} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} /></label><button type="button" className="sm" onClick={add}><Plus size={14} />Add</button></div>
    </div>
  );
}

export default function MinistrySettings() {
  const { m, settings } = useM();
  const toast = useToast();
  const s = m.settings;
  const r = s.reminders;
  const save = (data, msg = 'Saved') => { settings(data); toast(msg); };
  const [stage5, setStage5] = useState('');
  const [xt, setXt] = useState({ label: '', weekday: '' });
  return (
    <>
      <Head back={{ href: '#/poimaino', label: 'Dashboard' }} eyebrow="Poimainō" step="Settings" title={`${s.name || 'Bacenta'} settings`} sub="Everything here is yours to set. Nothing is invented: until you fill a value in, the app says it is not set." />
      <div className="set-grid">
        <section className="card">
          <div className="card-h"><h2>Time and meetings</h2></div>
          <div className="fields">
            <div className="field wide"><label htmlFor="ms-name">Bacenta name</label><input id="ms-name" defaultValue={s.name} onBlur={e => e.target.value.trim() && e.target.value !== s.name && save({ name: e.target.value.trim() }, 'Name saved')} /></div>
            <div className="field wide"><label>Timezone</label><Picker label="Timezone" value={s.timezone} onChange={v => save({ timezone: v })} options={ZONES.map(z => ({ value: z, label: z }))} /></div>
            <div className="field"><label htmlFor="ms-thu">Thursday Bible study starts</label><input id="ms-thu" type="time" value={s.times.thu} onChange={e => settings({ times: { ...s.times, thu: e.target.value } })} /></div>
            <div className="field"><label htmlFor="ms-sat">Saturday church starts</label><input id="ms-sat" type="time" value={s.times.sat} onChange={e => settings({ times: { ...s.times, sat: e.target.value } })} /></div>
            <div className="field"><label htmlFor="ms-due">Report due (hours after start)</label><input id="ms-due" type="number" min="1" value={s.reportDueHours ?? ''} placeholder="Not set" onChange={e => settings({ reportDueHours: e.target.value === '' ? null : Number(e.target.value) })} /></div>
            <div className="field"><label htmlFor="ms-from">Track meetings from</label><input id="ms-from" type="date" value={s.meetingsFrom} onChange={e => settings({ meetingsFrom: e.target.value })} /></div>
            <div className="field"><label>Pre-service calls on</label><Picker label="Call day" value={String(s.preServiceDay)} onChange={v => save({ preServiceDay: Number(v) })} options={DAYS.map((d, i) => ({ value: String(i), label: d }))} /></div>
            <div className="field"><label htmlFor="ms-wel">Welcome a first-time visitor within (days)</label><input id="ms-wel" type="number" min="1" value={s.welcomeDays} onChange={e => settings({ welcomeDays: Math.max(1, Number(e.target.value) || 1) })} /></div>
            <div className="field"><label htmlFor="ms-abs">Suggest a check-in after missing (weeks)</label><input id="ms-abs" type="number" min="1" value={s.absenceWeeks} onChange={e => settings({ absenceWeeks: Math.max(1, Number(e.target.value) || 1) })} /></div>
            <div className="field"><label htmlFor="ms-act">“Active” means present within (weeks)</label><input id="ms-act" type="number" min="1" value={s.activeWeeks} onChange={e => settings({ activeWeeks: Math.max(1, Number(e.target.value) || 1) })} /></div>
          </div>
          <p className="muted small">Saturday is the main service and Thursday the Bible study. There is no Sunday service unless you add one below.</p>
          <h4>Other meetings</h4>
          <ul className="act-list">{(s.extraTypes || []).map(t => <li key={t.id}><b>{t.label}</b><small>{t.weekday !== '' ? DAYS[t.weekday] : 'No fixed day'}</small><button className="ghost sm" onClick={() => save({ extraTypes: s.extraTypes.filter(x => x.id !== t.id) })}>Remove</button></li>)}</ul>
          <div className="pa-form">
            <label>Name<input value={xt.label} onChange={e => setXt(x => ({ ...x, label: e.target.value }))} placeholder="Prayer meeting" /></label>
            <label>Day<select value={xt.weekday} onChange={e => setXt(x => ({ ...x, weekday: e.target.value }))}><option value="">No fixed day</option>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>
            <button className="sm" disabled={!xt.label.trim()} onClick={() => { save({ extraTypes: [...(s.extraTypes || []), { id: `x${Date.now().toString(36)}`, label: xt.label.trim(), weekday: xt.weekday === '' ? '' : Number(xt.weekday) }] }, 'Meeting type added'); setXt({ label: '', weekday: '' }); }}>Add</button>
          </div>
        </section>

        <section className="card">
          <div className="card-h"><h2>Discipleship stages</h2><Label kind="source" /></div>
          <ol className="stage-edit">{s.stages.map((st, i) => (
            <li key={st.n} className={st.unresolved ? 'unresolved' : ''}>
              <span className="svc-n">{st.n}</span>
              <input defaultValue={st.label} aria-label={`Stage ${st.n} label`} onBlur={e => e.target.value.trim() && e.target.value !== st.label && save({ stages: s.stages.map((x, j) => (j === i ? { ...x, label: e.target.value.trim() } : x)) }, 'Stage label saved')} />
              {st.unresolved && <small>Unresolved — the source does not name it clearly</small>}
            </li>))}</ol>
          {s.stages[5]?.unresolved && (
            <div className="pa-form">
              <label>Confirm stage 5’s name from the source<input value={stage5} onChange={e => setStage5(e.target.value)} placeholder="The exact label in the source" /></label>
              <button className="sm" disabled={!stage5.trim()} onClick={() => { save({ stages: s.stages.map(x => (x.n === 5 ? { ...x, label: stage5.trim(), unresolved: false, resolvedAt: new Date().toISOString() } : x)) }, 'Stage 5 confirmed'); setStage5(''); }}>Confirm</button>
            </div>
          )}
          <button className="ghost sm" onClick={() => save({ stages: STAGES_DEFAULT.map(x => ({ ...x })) }, 'Stages reset')}>Reset to the source labels</button>
          <p className="muted small">People not yet assessed stay “Not assessed”; they are never counted as stage 0.</p>
        </section>

        <section className="card">
          <div className="card-h"><h2>Soul list statuses</h2><Label kind="design" /></div>
          <ListEdit items={s.outreachStatuses} onChange={v => save({ outreachStatuses: v })} placeholder="New status" />
          <button className="ghost sm" onClick={() => save({ outreachStatuses: [...OUTREACH_DEFAULT] })}>Reset</button>
        </section>

        <section className="card">
          <div className="card-h"><h2>Vision 25</h2><Label kind="user" /></div>
          <div className="fields">
            <div className="field"><label htmlFor="ms-dl">Deadline (optional)</label><input id="ms-dl" type="date" value={s.visionDeadline} onChange={e => settings({ visionDeadline: e.target.value })} /></div>
            <div className="field"><label htmlFor="ms-bl">Reported baseline (about)</label><input id="ms-bl" type="number" min="0" value={s.baseline.approx} onChange={e => settings({ baseline: { ...s.baseline, approx: Number(e.target.value) || 0 } })} /></div>
            <div className="field wide"><label htmlFor="ms-bn">Baseline note</label><input id="ms-bn" value={s.baseline.note} onChange={e => settings({ baseline: { ...s.baseline, note: e.target.value } })} /></div>
          </div>
          <p className="muted small">Without a deadline no pace is shown. The baseline stays “reported” until you review the roster on the Vision page.</p>
          <h4>Milestones</h4>
          <ListEdit numeric items={s.milestones} onChange={v => save({ milestones: v })} placeholder="e.g. 12" />
          <button className="ghost sm" onClick={() => save({ milestones: [...MILESTONES] })}>Reset</button>
          <h4>Stable-member criteria</h4>
          <ListEdit items={s.criteria} onChange={v => save({ criteria: v })} placeholder="A criterion" />
          <button className="ghost sm" onClick={() => save({ criteria: [...STABLE_CRITERIA] })}>Reset</button>
        </section>

        <section className="card">
          <div className="card-h"><h2>Weekly goals</h2></div>
          <p className="muted small">What you aim for in shepherding each week. Boēthos shows them next to your own disciplines in “Your week with God”.</p>
          <div className="fields">
            {[['prayer', 'P · Prayer (people prayed for)'], ['visits', 'V · Visitation'], ['teaching', 'T · Teaching or counselling'], ['interaction', 'I · Interaction (calls, messages, conversations)'], ['contacts', 'People contacted'], ['outreach', 'Outreach conversations']].map(([k, lab]) => (
              <div className="field" key={k}><label htmlFor={`wg-${k}`}>{lab}</label><input id={`wg-${k}`} type="number" min="0" value={(s.weeklyGoals || {})[k] ?? ''} onChange={e => settings({ weeklyGoals: { ...(s.weeklyGoals || {}), [k]: Math.max(0, Number(e.target.value) || 0) } })} /></div>
            ))}
            <div className="field"><label>Telepastoring reminders</label><p className="muted small" style={{ margin: 0 }}>{(s.teleTimes || [s.callTime]).filter(Boolean).join(', ') || 'None'} · <a href="#/poimaino/followup/telepastoring">change on the Telepastoring page</a></p></div>
            {[['evangelism', 'Evangelism reminder, every day'], ['chat', 'Bacenta chat reminder, every day'], ['pvti', 'PVTI reminder, every day']].map(([k, lab]) => (
              <div className="field" key={k}><label htmlFor={`dt-${k}`}>{lab}</label><input id={`dt-${k}`} type="time" value={(s.daily || {})[k] || ''} onChange={e => settings({ daily: { ...(s.daily || {}), [k]: e.target.value } })} /></div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-h"><h2>Reports</h2></div>
          <p className="muted small">Who you send reports to. The app prepares the text; you send it yourself and record that you did. Nothing is sent automatically.</p>
          <ListEdit items={s.recipients} onChange={v => save({ recipients: v })} placeholder="Bacenta leader, constituency pastor…" />
          <div className="fields"><div className="field"><label htmlFor="ms-cur">Currency (campaign budgets)</label><input id="ms-cur" value={s.currency} maxLength={3} onChange={e => settings({ currency: e.target.value.toUpperCase() })} /></div></div>
        </section>

        <section className="card">
          <div className="card-h"><h2>Reminders</h2></div>
          <label className="toggle"><input type="checkbox" checked={r.enabled} onChange={e => save({ reminders: { enabled: e.target.checked } })} />Remind me about Poimainō work</label>
          <div className="fields">
            {[['attendance', 'Attendance and reports'], ['followups', 'Follow-ups and calls'], ['sermon', 'Thursday sermon'], ['campaigns', 'Campaign actions and reviews']].map(([k, l]) => (
              <div className="field" key={k}><label className="toggle"><input type="checkbox" checked={r.categories[k]} disabled={!r.enabled} onChange={e => save({ reminders: { categories: { [k]: e.target.checked } } })} />{l}</label></div>))}
            <div className="field"><label htmlFor="ms-qf">Quiet from</label><input id="ms-qf" type="time" value={r.quietFrom} onChange={e => settings({ reminders: { quietFrom: e.target.value } })} /></div>
            <div className="field"><label htmlFor="ms-qt">Quiet until</label><input id="ms-qt" type="time" value={r.quietTo} onChange={e => settings({ reminders: { quietTo: e.target.value } })} /></div>
            <div className="field"><label>Delivery</label><Picker label="Delivery" value={r.digest} onChange={v => save({ reminders: { digest: v } })} options={[{ value: 'instant', label: 'As each is due' }, { value: 'morning', label: 'One morning summary' }]} /></div>
            <div className="field"><label htmlFor="ms-bm">Before a meeting (minutes)</label><input id="ms-bm" type="number" min="0" value={r.beforeMinutes} onChange={e => settings({ reminders: { beforeMinutes: Number(e.target.value) || 0 } })} /></div>
            <div className="field"><label htmlFor="ms-am">Attendance reminder after start (minutes)</label><input id="ms-am" type="number" min="0" value={r.afterMinutes} onChange={e => settings({ reminders: { afterMinutes: Number(e.target.value) || 0 } })} /></div>
          </div>
          <p className="muted small">Reminders never show names or notes on the lock screen: they say “Greater Love: 2 things need you”. Turn on notifications and cloud sync in <a href="#/settings">Account</a>.</p>
        </section>
      </div>
    </>
  );
}
