import { useState } from 'react';
import { X } from 'lucide-react';
import { isFastDay, fastPlanOn } from '../../store/life';
import { addDays, mondayOf } from '../../store/ministry';
import { FAST_TYPES } from '../../data/spoudazo';
import { TitleBlock, Picker, Empty, fmtDate } from '../../lib/ui.jsx';
import { useLife } from './common.jsx';

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const LENGTHS = [['1', '1 month'], ['2', '2 months'], ['3', '3 months'], ['6', '6 months']];
const monthsOn = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setMonth(x.getMonth() + Number(n)); return addDays(x.toISOString().slice(0, 10), -1); };

// Your fast days, the fasts you set to repeat, single fasts, and how often you fast
export default function Fasting() {
  const { l, g, today, act, toast } = useLife();
  const plans = (l.fastPlans || []).filter(p => p.until >= today);
  const [rp, setRp] = useState({ days: [], from: today, length: '1', type: FAST_TYPES[1], purpose: '' });
  const [f, setF] = useState({ date: addDays(today, 1), type: FAST_TYPES[1], purpose: '' });
  const fastToday = isFastDay(l, today);
  const todays = l.fasts.find(x => x.date === today);
  const plan = fastPlanOn(l, today);
  const upcoming = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)).filter(d => isFastDay(l, d)).slice(0, 6);
  const history = [...l.fasts].filter(x => x.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  const set = (status) => (todays ? act('FAST_UPDATE', { id: todays.id, data: { status } }) : act('FAST_ADD', { data: { date: today, type: plan?.type || `Until ${g.fastUntil}`, purpose: plan?.purpose || '', status } }));
  // how often: kept fasts in each of the last 8 weeks
  const goal = g.fastsPerWeek || 1;
  const mon = mondayOf(today);
  const weeks = Array.from({ length: 8 }, (_, i) => { const from = addDays(mon, (i - 7) * 7); const to = addDays(from, 6); return { from, n: l.fasts.filter(x => x.status === 'done' && x.date >= from && x.date <= to).length }; });
  const met = weeks.filter(w => w.n >= goal).length;
  const thisWeek = weeks[7].n;
  const top = Math.max(goal + 1, ...weeks.map(w => w.n));
  const until = monthsOn(rp.from, rp.length);
  const addPlan = (e) => {
    e.preventDefault();
    act('FAST_PLAN_ADD', { data: { days: rp.days, from: rp.from, until, type: rp.type, purpose: rp.purpose.trim() } });
    toast(`Fasting every ${rp.days.map(d => DAY[d]).join(' and ')} until ${fmtDate(until, { day: 'numeric', month: 'long' })}`);
    setRp(x => ({ ...x, days: [], purpose: '' }));
  };
  return (
    <>
      <div className="cols">
        <div className="stack">
          <div className={'card pray-cta' + (todays?.status === 'done' ? ' done' : '')}>
            <div>
              <b>{fastToday ? (todays?.status === 'done' ? 'You kept today’s fast' : todays?.status === 'broken' ? 'Today’s fast was broken' : 'Today is a fast day') : 'Not a fast day'}</b>
              <span>{fastToday ? `${todays?.type || plan?.type || `Until ${g.fastUntil}`}${(todays?.purpose || plan?.purpose) ? ` · ${todays?.purpose || plan?.purpose}` : ''}` : 'You can still fast today, or set one below.'}</span>
            </div>
            <div className="row-btns">
              {(!todays || todays.status === 'planned') && <><button className="primary" onClick={() => { set('done'); toast('Fast kept'); }}>I kept it</button>{(todays || fastToday) && <button onClick={() => set('broken')}>I broke it</button>}</>}
              {todays && todays.status !== 'planned' && <button className="ghost sm" onClick={() => set('planned')}>Undo</button>}
            </div>
          </div>

          <form className="card" onSubmit={addPlan}>
            <div className="card-h"><h2>Fast on repeat</h2><span className="muted small">Reminders come with it</span></div>
            <div className="field"><label>Every</label>
              <div className="day-chips" role="group" aria-label="Days to fast">{ORDER.map(i => { const on = rp.days.includes(i); return <button type="button" key={i} className={on ? 'on' : ''} aria-pressed={on} onClick={() => setRp(x => ({ ...x, days: on ? x.days.filter(d => d !== i) : [...x.days, i].sort() }))}>{SHORT[i]}</button>; })}</div></div>
            <div className="fields">
              <div className="field"><label htmlFor="rp-from">Starting</label><input id="rp-from" type="date" min={today} value={rp.from} onChange={e => setRp(x => ({ ...x, from: e.target.value }))} /></div>
              <div className="field"><label>For</label><Picker label="How long" value={rp.length} onChange={v => setRp(x => ({ ...x, length: v }))} options={LENGTHS.map(([v, t]) => ({ value: v, label: t }))} /></div>
              <div className="field"><label>Kind</label><Picker label="Kind" value={rp.type} onChange={v => setRp(x => ({ ...x, type: v }))} options={FAST_TYPES.map(t => ({ value: t, label: t }))} /></div>
              <div className="field"><label htmlFor="rp-why">Seeking God for <em>optional</em></label><input id="rp-why" value={rp.purpose} onChange={e => setRp(x => ({ ...x, purpose: e.target.value }))} placeholder="Direction for Greater Love" /></div>
            </div>
            <div className="fr-foot"><span className="muted small">{rp.days.length ? `Every ${rp.days.map(d => DAY[d]).join(', ')} until ${fmtDate(until, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Choose the days you will fast'}</span>
              <button className="primary" type="submit" disabled={!rp.days.length}>Set it</button></div>
            {plans.length > 0 && <ul className="fr-plans">{plans.map(p => (
              <li key={p.id}><span><b>Every {p.days.map(d => DAY[d]).join(', ')}</b><small>{fmtDate(p.from, { day: 'numeric', month: 'short' })} to {fmtDate(p.until, { day: 'numeric', month: 'short', year: 'numeric' })} · {p.type}{p.purpose ? ` · ${p.purpose}` : ''}</small></span>
                <button type="button" className="ghost sm" onClick={() => act('FAST_PLAN_DELETE', { id: p.id })} aria-label="Stop this fast"><X size={14} /></button></li>
            ))}</ul>}
          </form>

        </div>
        <aside className="aside even">
          <section>
            <h3>How often you fast</h3>
            <div className="fq-chart" role="img" aria-label={`Fasts kept each week for 8 weeks; goal ${goal} a week`}>
              <i className="fq-goal" style={{ bottom: `${(goal / top) * 100}%` }} />
              {weeks.map((w, i) => <div key={w.from} className={'fq-col' + (w.n >= goal ? ' met' : '') + (i === 7 ? ' now' : '')} title={`Week of ${fmtDate(w.from, { day: 'numeric', month: 'short' })}: ${w.n}`}>
                <span style={{ height: `${(w.n / top) * 100}%` }}>{w.n > 0 && <em>{w.n}</em>}</span><small>{i === 7 ? 'Now' : fmtDate(w.from, { day: 'numeric' })}</small></div>)}
            </div>
            <p className="fq-say"><b>{met} of the last 8 weeks</b> you fasted at least {goal === 1 ? 'once' : `${goal} times`}. This week: {thisWeek ? `${thisWeek} kept` : 'not yet'}.</p>
          </section>
          <section>
            <h3>Coming up</h3>
            {upcoming.length ? <ul className="fq-up">{upcoming.map(d => { const p = l.fasts.find(x => x.date === d) || fastPlanOn(l, d); return <li key={d}><b>{fmtDate(d, { weekday: 'short' })}</b><span>{fmtDate(d, { day: 'numeric', month: 'short' })}{p?.purpose ? ` · ${p.purpose}` : ''}</span></li>; })}</ul>
              : <p className="muted small" style={{ margin: 0 }}>No fasts in the next two weeks.</p>}
            {(g.fastDays || []).length > 0 && <p className="muted small" style={{ margin: '10px 0 0' }}>Every week: {g.fastDays.map(d => DAY[d]).join(', ')}. <a href="#/settings">Change</a></p>}
          </section>
          <section>
            <h3>Fasts kept</h3>
            <TitleBlock className="grid" items={[['This month', l.fasts.filter(x => x.status === 'done' && x.date.startsWith(today.slice(0, 7))).length], ['All time', l.fasts.filter(x => x.status === 'done').length]]} />
          </section>
        </aside>
      </div>

      <div className="fq-bottom">
        <form className="card fq-one" onSubmit={(e) => { e.preventDefault(); act('FAST_ADD', { data: { ...f, status: 'planned' } }); toast(`Fast planned for ${fmtDate(f.date, { weekday: 'long', day: 'numeric', month: 'short' })}`); setF(x => ({ ...x, purpose: '' })); }}>
          <div className="card-h"><h2>One fast</h2></div>
          <div className="fields">
            <div className="field"><label htmlFor="ft-date">Day</label><input id="ft-date" type="date" min={today} value={f.date} onChange={e => setF(x => ({ ...x, date: e.target.value }))} /></div>
            <div className="field"><label>Kind</label><Picker label="Kind" value={f.type} onChange={v => setF(x => ({ ...x, type: v }))} options={FAST_TYPES.map(t => ({ value: t, label: t }))} /></div>
            <div className="field wide"><label htmlFor="ft-why">Seeking God for</label><input id="ft-why" value={f.purpose} onChange={e => setF(x => ({ ...x, purpose: e.target.value }))} placeholder="A breakthrough for someone" /></div>
          </div>
          <button className="primary" type="submit">Plan it</button>
        </form>
      <section className="card fq-hist">
        <div className="card-h"><h2>Your fasts</h2><span className="muted small">{l.fasts.filter(x => x.status === 'done').length} kept</span></div>
        {history.length === 0 ? <Empty title="No fasts recorded yet." /> : (
          <ul className="fast-list">{history.map(x => (
            <li key={x.id} className={x.status}>
              <span className="ll-n">{fmtDate(x.date, { day: 'numeric' })}<small>{fmtDate(x.date, { month: 'short' })}</small></span>
              <span className="t"><b>{x.type || 'Fast'}{x.purpose ? ` · ${x.purpose}` : ''}</b>
                <input className="fast-note" defaultValue={x.notes || ''} placeholder="What did God do?" onBlur={e => e.target.value !== (x.notes || '') && act('FAST_UPDATE', { id: x.id, data: { notes: e.target.value } })} /></span>
              <span className={'pill ' + (x.status === 'done' ? 'good' : x.status === 'broken' ? 'warn' : 'plain')}>{{ done: 'Kept', broken: 'Broken', planned: 'Planned' }[x.status]}</span>
              <button className="ghost sm" onClick={() => act('FAST_DELETE', { id: x.id })} aria-label="Delete"><X size={14} /></button>
            </li>))}</ul>
        )}
      </section>
      </div>
    </>
  );
}
