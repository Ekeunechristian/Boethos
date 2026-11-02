import { useState, Fragment } from 'react';
import { Clock, X, ArrowRight, Copy, Check, Phone, Cake, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { isTeleSoul, teleTimes, telePace, alerts, pvciWeek, pvciRange, dailyDone, dailyMet, DAILY, callsToday, prepFor, needAttention, attendanceWeeks, isFlock, vision, meetingList, meetingState, submitted, meetingStats, establishment, EST_STEPS, weekSummary, mondayOf, addDays, daysBetween, weekdayOf, stableMovement, typeLabel, membershipLabel, STATE_LABEL } from '../../store/ministry';
import { MINISTRY, PVTI, CARE_STATUS, REGISTERED } from '../../data/ministry';
import { Head, TitleBlock, Bar, Seg, Empty, fmtDate, useToast } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useM, telHref, PersonPicker } from './common.jsx';

const CAT = { attendance: 'Attendance', followups: 'Care', sermon: 'Bible study', campaigns: 'Campaign' };
// Dates inside alert text, written the way people read them
const nice = (t) => (t || '').replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (d) => fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' }));
const ago = (d, today) => { if (!d) return 'never'; const n = daysBetween(d, today); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; };
const SHORT = { scheduled: 'Scheduled', unconfirmed: 'Was it held?', held: 'Take attendance', draft: 'Attendance draft', amending: 'Amending', cancelled: 'Cancelled' };

function AlertRow({ a }) {
  const { alert, today, resolve } = useM();
  const toast = useToast();
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState(addDays(today, 1));
  return (
    <li className={'pd-alert pri' + a.pri}>
      <a href={a.href} className="pd-a-main">
        <span className={'pd-cat ' + a.cat}>{CAT[a.cat]}</span>
        <span className="pd-a-t"><b>{nice(a.title)}</b><small>{nice(a.why)}</small></span>
      </a>
      <div className="pd-a-acts">
        {a.recordId && <button className="sm" onClick={() => { resolve(a.recordId, 'completed'); toast('Marked done'); }}><Check size={14} />Done</button>}
        <button className="ghost sm" onClick={() => setMode(mode === 'snooze' ? null : 'snooze')} aria-label="Snooze" title="Snooze"><Clock size={14} /></button>
        <button className="ghost sm" onClick={() => setMode(mode === 'dismiss' ? null : 'dismiss')} aria-label="Dismiss" title="Dismiss"><X size={14} /></button>
      </div>
      {mode === 'snooze' && (
        <div className="pa-form"><label>Until<input type="date" value={until} min={addDays(today, 1)} onChange={e => setUntil(e.target.value)} /></label>
          <button className="primary sm" onClick={() => { alert(a.key, { snoozeUntil: until }); toast(`Snoozed until ${fmtDate(until)}`); }}>Snooze</button></div>
      )}
      {mode === 'dismiss' && (
        <div className="pa-form"><label>Why?<input value={reason} onChange={e => setReason(e.target.value)} placeholder="Already handled in person, not needed…" /></label>
          <button className="primary sm" disabled={!reason.trim()} onClick={() => { alert(a.key, { dismissed: true, reason: reason.trim() }); toast('Dismissed'); }}>Dismiss</button></div>
      )}
    </li>
  );
}

function ActionCentre() {
  const { m, today, now } = useM();
  const list = alerts(m, today, now);
  const [all, setAll] = useState(false);
  const counts = Object.keys(CAT).map(c => [c, list.filter(a => a.cat === c).length]).filter(([, n]) => n);
  const shown = all ? list : list.slice(0, 5);
  const old = list.filter(a => a.key.startsWith('mt-confirm:') && a.due < mondayOf(today));
  const { settings } = useM();
  return (
    <section className="card pd-needs">
      <div className="card-h"><h2>What needs you</h2><span className="pd-counts">{counts.map(([c, n]) => <span key={c} className={'pd-cat ' + c}>{CAT[c]} {n}</span>)}</span></div>
      {list.length === 0 ? <p className="pd-clear"><Check size={16} />Nothing is due. Every item that appears here says why, and links to its record.</p> : (
        <>
          <ul className="pd-alerts">{shown.map(a => <AlertRow key={a.key} a={a} />)}</ul>
          {list.length > 5 && <button type="button" className="ghost sm pd-more" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${list.length}`}</button>}
          {old.length >= 2 && <p className="pd-old">{old.length} older meetings were never recorded. <button type="button" className="sm" onClick={() => settings({ meetingsFrom: mondayOf(today) })}>Count from this week</button><small>Meetings before {fmtDate(mondayOf(today), { day: 'numeric', month: 'short' })} that you never recorded stop asking. Anything you recorded stays.</small></p>}
        </>
      )}
    </section>
  );
}

// This week, day by day: the Bacenta's rhythm
function WeekStrip() {
  const { m, today, now, index } = useM();
  const mon = mondayOf(today);
  const meetings = meetingList(m, today, 2);
  const inWeek = (d) => d && d >= mon && d <= addDays(mon, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  return (
    <section className="card pd-week">
      <div className="card-h"><h2>This week at {m.settings.name || MINISTRY.name}</h2><span className="pd-key">{DAILY.map(x => <span key={x.id}><b>{x.short}</b>{x.label.split(',')[0].replace('Pray', 'PVTI').replace('Share in the Bacenta chat', 'Chat')}</span>)}</span></div>
      <ol className="pd-days">{days.map(d => {
        const evs = [];
        meetings.filter(mt => mt.date === d).forEach(mt => {
          const st = meetingState(m, mt, today, now);
          const sub = submitted(mt);
          const n = sub && meetingStats(m, mt, sub, index).total;
          evs.push({ k: mt.key, main: true, t: mt.type === 'thu' ? 'Bible study' : mt.type === 'sat' ? 'Church' : typeLabel(m, mt.type), s: sub ? `${n} present` : SHORT[st] || '', tone: sub ? 'ok' : ['unconfirmed', 'held', 'draft', 'amending'].includes(st) ? 'due' : '', href: `#/poimaino/services/${encodeURIComponent(mt.key)}` });
        });
        const dd = dailyDone(m, d);
        const started = d >= (m.settings.meetingsFrom || d);
        if (weekdayOf(d) === 1) evs.push({ k: 'rv', t: 'Review last week', s: (m.weekNotes[addDays(mon, -7)]?.reviewedAt || m.weekNotes[addDays(mon, -7)]?.notes) ? 'Done' : d <= today ? 'Not yet' : '', tone: (m.weekNotes[addDays(mon, -7)]?.reviewedAt || m.weekNotes[addDays(mon, -7)]?.notes) ? 'ok' : d <= today ? 'due' : '', href: '#/poimaino/week' });
        const fu = m.followUps.filter(f => f.due === d && ['planned', 'attempted'].includes(f.status));
        if (fu.length) evs.push({ k: 'fu', t: `${fu.length} ${fu.length === 1 ? 'follow-up' : 'follow-ups'}`, s: fu.some(f => f.kind === 'visit') ? 'includes a visit' : '', tone: d < today ? 'due' : '', href: '#/poimaino/followup' });
        return (
          <li key={d} className={(d === today ? 'today' : d < today ? 'past' : '') + (evs.some(e => e.main) ? ' meet' : '')}>
            <span className="pd-dn"><b>{fmtDate(d, { weekday: 'short' })}</b><small>{fmtDate(d, { day: 'numeric' })}</small></span>
            <span className="pd-marks" aria-label="Daily shepherding">{DAILY.map(x => { const ok = dailyMet(dd, x.id); return <i key={x.id} title={`${x.label}: ${ok ? 'done' : d < today && started ? 'missed' : d === today ? 'not yet' : 'ahead'}`} className={ok ? 'ok' : d < today && started ? 'miss' : ''}>{x.short}</i>; })}</span>
            {evs.length ? evs.map(e => <a key={e.k} href={e.href} className={'pd-ev ' + (e.tone || '') + (e.main ? ' main' : '')}><b>{e.t}</b>{e.s && <small>{e.s}</small>}</a>) : <span className="pd-rest">{weekdayOf(d) === 0 ? 'Rest or plan' : '—'}</span>}
          </li>
        );
      })}</ol>
    </section>
  );
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// The last held meeting of a type: its number, or why there is none
function lastMeeting(m, today, index, type) {
  const mt = meetingList(m, today, 6).filter(x => x.type === type && x.date <= today && x.status !== 'cancelled').reverse()[0];
  if (!mt) return null;
  const sub = submitted(mt);
  return { mt, st: sub ? meetingStats(m, mt, sub, index) : null };
}

// The figures at a glance; each opens its full page
function Kpis() {
  const { m, today, index } = useM();
  const calls = callsToday(m, today);
  const w = weekSummary(m, mondayOf(today));
  const att = needAttention(m, today);
  const need = att.length, crit = att.filter(x => x.level === 'critical').length;
  const dd = dailyDone(m, today);
  const met = DAILY.filter(x => dailyMet(dd, x.id)).length;
  const meet = (type, k) => { const x = lastMeeting(m, today, index, type); return {
    k, href: x ? `#/poimaino/services/${encodeURIComponent(x.mt.key)}` : '#/poimaino/services', v: x?.st ? x.st.total : '—',
    s: x ? (x.st ? `${fmtDate(x.mt.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${x.st.firstTime.length} first, ${x.st.secondTime.length} second timers` : `${fmtDate(x.mt.date, { day: 'numeric', month: 'short' })} · not submitted`) : 'none yet', tone: x && !x.st ? 'due' : '' }; };
  const tiles = [
    meet('thu', 'Last Thursday'),
    meet('sat', 'Last Saturday'),
    { k: 'Today’s shepherding', href: '#today', v: `${met} / ${DAILY.length}`, s: met === DAILY.length ? 'all done today' : `${DAILY.length - met} still to do`, pct: met / DAILY.length },
    { k: 'Calls today', href: '#calls', v: calls.length ? `${calls.filter(x => x.done).length} / ${calls.length}` : '—', s: calls.length ? `reminders at ${teleTimes(m).join(', ')}` : 'nobody due today', pct: calls.length ? calls.filter(x => x.done).length / calls.length : undefined },
    { k: 'Evangelism', href: '#/poimaino/evangelism', v: w.reachedOutreach, s: `people reached this week · ${w.invitations} invited` },
    { k: 'Need attention', href: '#/poimaino/people/attention', v: need, s: need ? (crit ? `${crit} critical` : 'members to reach') : 'nobody flagged', tone: need ? 'warn' : '' },
  ];
  return (
    <div className="pk-row">{tiles.map(t => (
      <a key={t.k} className={'pk ' + (t.tone || '')} href={t.href}>
        <small>{t.k}</small><b>{t.v}</b><span>{t.s}</span>
        {t.pct !== undefined && <span className="ch-bar"><i style={{ width: `${Math.min(100, t.pct * 100)}%` }} /></span>}
      </a>
    ))}</div>
  );
}

// Today's shepherding: the five things of every day, each ticked by what you record
function TodayRhythm() {
  const { m, today, now } = useM();
  const dd = dailyDone(m, today);
  const dt = m.settings.daily || {};
  const due = m.followUps.filter(f => ['planned', 'attempted'].includes(f.status) && f.due && f.due <= today).length;
  const sub = {
    evangelise: dd.evangelise ? `${dd.evangelise} ${dd.evangelise === 1 ? 'person' : 'people'} reached today` : 'Share the gospel with someone, then record it',
    telepastor: dd.rota ? `${dd.rotaMade} of ${dd.rota} rota calls made` : dd.telepastor ? `${dd.telepastor} ${dd.telepastor === 1 ? 'call' : 'calls'} today` : 'Call someone, on the phone or by voice note',
    followup: `${dd.followup} done today${due ? ` · ${due} due` : ''}`,
    pvti: dd.pvti ? ['P', 'V', 'T', 'I'].filter(k => dd.pv[k]).map(k => `${PVTI.find(x => x.id === k).label} ${dd.pv[k]}`).join(' · ') : 'Pray for, visit, teach or reach one of your sheep',
    chat: dd.chat ? 'Shared today' : (m.chatPlan || {})[today] ? `Planned: “${m.chatPlan[today].slice(0, 60)}${m.chatPlan[today].length > 60 ? '…' : ''}”` : 'Nothing planned yet',
  };
  const time = { evangelise: dt.evangelism, telepastor: m.settings.callTime, chat: dt.chat, pvti: dt.pvti };
  const met = DAILY.filter(x => dailyMet(dd, x.id)).length;
  return (
    <section className="card pd-panel" id="today">
      <div className="card-h"><h2>Today’s shepherding</h2><span className="muted small">{met} of {DAILY.length} done</span></div>
      <ul className="tr-list">{DAILY.map(x => { const ok = dailyMet(dd, x.id); const late = !ok && time[x.id] && now >= time[x.id]; return (
        <li key={x.id} className={(ok ? 'done' : '') + (late ? ' late' : '')}>
          <a href={x.href}>
            <span className="tr-mark" aria-hidden="true">{ok ? <Check size={14} strokeWidth={3} /> : x.short}</span>
            <span className="tr-t"><b>{x.label}</b><small>{sub[x.id]}</small></span>
            <span className="tr-time">{ok ? 'Done' : time[x.id] || ''}</span>
          </a>
        </li>
      ); })}</ul>
      <p className="muted small" style={{ margin: 'auto 0 0', paddingTop: 12 }}>Each is ticked by what you record: an outreach encounter, a call, a follow-up, a PVTI, a chat post. Reminders come at the times in <a href="#/poimaino/settings">Settings</a>.</p>
    </section>
  );
}

// The Bacenta chat: what to share today, the days ahead, and what you shared
function ChatPanel() {
  const { m, today, chatPlan, chatPost, chatDelete } = useM();
  const toast = useToast();
  const plan = m.chatPlan || {};
  const [text, setText] = useState(plan[today] || '');
  const posted = (m.chatPosts || []).filter(x => x.date === today);
  const ahead = Array.from({ length: 6 }, (_, i) => addDays(today, i + 1));
  const recent = [...(m.chatPosts || [])].filter(x => x.date < today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  return (
    <section className="card pd-panel" id="chat">
      <div className="card-h"><h2>{m.settings.name || MINISTRY.name} chat</h2><a href="#/poimaino/followup/chat">{posted.length ? 'Shared today · ' : ''}The month<ArrowRight size={13} /></a></div>
      <div className="field"><label htmlFor="ch-today">Today’s message</label><textarea id="ch-today" value={text} onChange={e => setText(e.target.value)} onBlur={() => chatPlan(today, text)} style={{ minHeight: 80 }} placeholder="A verse and a line on it, a word from Thursday, a reminder for Saturday, a birthday…" /></div>
      <div className="fr-foot">
        <button type="button" className="ghost sm" disabled={!text.trim()} onClick={() => { navigator.clipboard?.writeText(text); toast('Copied. Paste it in the chat; nothing is sent from here.'); }}><Copy size={14} />Copy</button>
        <button type="button" className="primary sm" onClick={() => { chatPlan(today, text); chatPost(text.trim()); toast('Recorded as shared today'); }}>I shared it</button>
      </div>
      {posted.length > 0 && <ul className="ct-posted">{posted.map(x => <li key={x.id}><Check size={13} /><span>{x.text || 'Shared in the chat'}</span><button type="button" className="ghost sm" onClick={() => chatDelete(x.id)} aria-label="Remove"><X size={13} /></button></li>)}</ul>}
      <h4 className="fs-h">The days ahead</h4>
      <ul className="ct-ahead">{ahead.map(d => (
        <li key={d}><span>{fmtDate(d, { weekday: 'short', day: 'numeric' })}</span>
          <input defaultValue={plan[d] || ''} onBlur={e => e.target.value !== (plan[d] || '') && chatPlan(d, e.target.value)} placeholder={weekdayOf(d) === 3 ? 'Invite for Thursday' : weekdayOf(d) === 5 ? 'Remind for Saturday' : 'What to share'} aria-label={`Message for ${fmtDate(d)}`} /></li>
      ))}</ul>
      {recent.length > 0 && <p className="muted small" style={{ margin: '10px 0 0' }}>Last shared: {recent.map(x => `${fmtDate(x.date, { weekday: 'short' })} “${(x.text || '').slice(0, 40)}${(x.text || '').length > 40 ? '…' : ''}”`).join(' · ')}</p>}
    </section>
  );
}

// Telepastoring: today's calls from your rota, recorded in one tap
function TodayCalls() {
  const { m, today, tele, spreadCallDays } = useM();
  const toast = useToast();
  const list = callsToday(m, today);
  const flock = m.people.filter(isTeleSoul);
  const unassigned = flock.filter(p => ![1, 2, 3, 4, 5, 6, 0].includes(p.callDay)).length;
  const rota = [1, 2, 3, 4, 5, 6, 0].map(d => [d, flock.filter(p => p.callDay === d).length]);
  const wd = weekdayOf(today);
  return (
    <section className="card pd-panel" id="calls">
      <div className="card-h"><h2>Telepastoring today</h2><a href="#/poimaino/followup/telepastoring">{teleTimes(m).join(', ')} · Telepastoring<ArrowRight size={13} /></a></div>
      {flock.length === 0 ? <p className="muted">Your soul list is empty. Everyone on it gets a day to be telepastored. <a href="#/poimaino/evangelism/souls">Soul list</a></p>
        : list.length === 0 ? <>
          <p className="pd-clear small"><Check size={14} />Nobody is on the rota for {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][wd]}.</p>
          <ul className="pd-week-rota">{[1, 2, 3, 4, 5, 6, 0].map(d => { const ppl = flock.filter(p => p.callDay === d); return ppl.length ? <li key={d}><b>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]}</b><span>{ppl.map(p => p.name).join(', ')}</span></li> : null; })}</ul>
          {unassigned > 0 && <p className="muted small" style={{ margin: '8px 0 0' }}>{unassigned} of your flock {unassigned === 1 ? 'has' : 'have'} no call day yet, so {unassigned === 1 ? 'they are' : 'they are'} never on the rota. Give each a day below, and you will speak to every sheep each week.</p>}
        </> : (
        <ul className="pd-calls">{list.map(({ p, done, reached }) => (
          <li key={p.id} className={done ? 'done' : ''}>
            <a href={`#/poimaino/people/${p.id}`}><b>{p.name}</b><small>{membershipLabel(p.membership)} · {done ? (reached ? 'responded today' : 'no response today') : `last contact ${ago(p.lastContact, today)}`}</small></a>
            {done ? <span className={'pill ' + (reached ? 'good' : 'warn')}>{reached ? 'Responded' : 'No response'}</span> : <span className="pd-call-acts">
              {telHref(p.phone) && <a className="btn sm ghost" href={telHref(p.phone)} aria-label={`Call ${p.name}`}><Phone size={14} /></a>}
              <button type="button" className="sm" onClick={() => { tele({ personId: p.id, way: 'call', responded: true }); toast(`${p.name}: responded`); }}>Responded</button>
              <button type="button" className="ghost sm" onClick={() => { tele({ personId: p.id, way: 'call', responded: false, retry: { way: 'message', date: today } }); toast(`${p.name}: no response. A message is due now.`); }}>No response</button>
            </span>}
          </li>
        ))}</ul>
      )}
      {flock.length > 0 && (pc => <p className={'tl-dash ' + pc.tone}><b>{pc.reached} of {pc.total}</b> telepastored this week{pc.expected ? ` · ${pc.behind ? `${pc.behind} behind` : 'on pace'}` : ''}</p>)(telePace(m, today))}
      {flock.length > 0 && <div className="pd-rota">
        <span className="pd-rota-days">{rota.map(([d, n]) => <span key={d} className={d === wd ? 'today' : ''}><b>{WD[d][0]}</b><small>{n}</small></span>)}</span>
        {unassigned > 0 ? <button type="button" className="sm" onClick={() => { spreadCallDays(); toast('Everyone now has a call day'); }}>Give {unassigned} a call day</button>
          : <span className="muted small">Change a day on each person’s page</span>}
      </div>}
    </section>
  );
}

// Attendance over eight weeks: Thursday and Saturday side by side
function AttendanceChart() {
  const { m, today } = useM();
  const weeks = attendanceWeeks(m, today, 8);
  const top = Math.max(1, ...weeks.flatMap(w => [w.thu || 0, w.sat || 0]));
  const avg = (k) => { const v = weeks.map(w => w[k]).filter(x => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : '—'; };
  return (
    <section className="card pd-panel">
      <div className="card-h"><h2>Attendance</h2><a href="#/poimaino/services/trends">Trends<ArrowRight size={13} /></a></div>
      <div className="pd-legend2"><span><i className="thu" />Thursday Bible study</span><span><i className="sat" />Saturday church</span><span><i className="miss" />not submitted</span></div>
      <div className="pd-bars" role="img" aria-label="Attendance for the last eight weeks">
        {weeks.map(w => (
          <div key={w.from} className={'pd-wk' + (w.from === mondayOf(today) ? ' now' : '')} title={`Week of ${fmtDate(w.from)}: Thursday ${w.thu ?? 'not submitted'}, Saturday ${w.sat ?? 'not submitted'}`}>
            <span className="pd-pair">
              {w.thu === null ? <i className="miss" /> : <i className="thu" style={{ height: `${Math.max(3, (w.thu / top) * 100)}%` }}><em>{w.thu}</em></i>}
              {w.sat === null ? <i className="miss" /> : <i className="sat" style={{ height: `${Math.max(3, (w.sat / top) * 100)}%` }}><em>{w.sat}</em></i>}
            </span>
            <small>{fmtDate(w.from, { day: 'numeric', month: 'short' })}</small>
          </div>
        ))}
      </div>
      <div className="pl-stats">
        <div><b>{avg('thu')}</b><span>Thursday on average</span></div>
        <div><b>{avg('sat')}</b><span>Saturday on average</span></div>
        <div><b>{weeks.reduce((n, w) => n + w.first, 0)} · {weeks.reduce((n, w) => n + w.second, 0)}</b><span>first · second timers in 8 weeks</span></div>
      </div>
    </section>
  );
}

// PVTI: today, and this week day by day, with a quick way to record one
const PVTI_KIND = { P: 'prayer', V: 'visit', T: 'teaching', I: 'conversation' };
function PvciPanel() {
  const { m, today, pvci } = useM();
  const toast = useToast();
  const [log, setLog] = useState(null);
  const mon = mondayOf(today);
  const now = pvciRange(m, today, today);
  const week = pvciWeek(m, mon);
  const days = Array.from({ length: 7 }, (_, i) => { const d = addDays(mon, i); return { d, ...pvciRange(m, d, d) }; });
  const top = Math.max(1, ...days.map(h => h.P + h.V + h.T + h.I));
  const save = () => { const x = PVTI.find(y => y.id === log.id); pvci({ personId: log.personId, kind: PVTI_KIND[log.id], title: x.label }); toast(`${x.label} recorded`); setLog(null); };
  return (
    <section className="card pd-panel" id="pvti">
      <div className="card-h"><h2>PVTI</h2><span className="pd-h-acts"><a href="#/poimaino/followup/pvti">Log<ArrowRight size={13} /></a><button type="button" className="sm" onClick={() => setLog(log ? null : { id: 'P', personId: '' })}><Plus size={14} />Record</button></span></div>
      <p className="muted small" style={{ marginTop: 0 }}>Prayer, Visitation, Teaching (and counselling), Interaction: what you did for your sheep.</p>
      {log && <div className="pv-log">
        <div className="jw-kinds" role="group" aria-label="Which">{PVTI.map(x => <button key={x.id} type="button" className={log.id === x.id ? 'on' : ''} onClick={() => setLog(l => ({ ...l, id: x.id }))}>{x.label}</button>)}</div>
        <div className="pv-log-row"><div style={{ flex: 1 }}><PersonPicker m={m} value={log.personId} onChange={v => setLog(l => ({ ...l, personId: v }))} label="Who" allowNone={false} filter={p => !['departed', 'transferred'].includes(p.membership)} /></div>
          <button type="button" className="primary sm" disabled={!log.personId} onClick={save}>Save</button></div>
        {log.id === 'T' && <p className="muted small" style={{ margin: 0 }}>Only that it happened is recorded here. Keep any counselling details in the private notes on their page.</p>}
        {log.id === 'P' && log.personId && (m.people.find(p => p.id === log.personId)?.prayer || []).filter(x => !x.answered).length > 0 && <div className="pv-prayers"><small>Their open prayer requests</small><ul>{m.people.find(p => p.id === log.personId).prayer.filter(x => !x.answered).map(x => <li key={x.id}>{x.text}</li>)}</ul></div>}
      </div>}
      <div className="pv-four">{PVTI.map(x => (
        <div key={x.id} className={'pv-c pv' + x.id + (now[x.id] ? ' met' : '')}><span className="pv-l">{x.id}</span><small>{x.label}</small><b>{now[x.id]}<em> today</em></b><span className="pv-wk">{week[x.id]} this week</span></div>
      ))}</div>
      <div className="pv-hist seven" role="img" aria-label="PVTI each day this week">{days.map(h => (
        <div key={h.d} className={(h.d === today ? 'now' : '') + (h.d > today ? ' ahead' : '')} title={`${fmtDate(h.d)}: P ${h.P}, V ${h.V}, T ${h.T}, I ${h.I}`}>
          <span className="pv-stack" style={{ height: `${((h.P + h.V + h.T + h.I) / top) * 100}%` }}>{['I', 'T', 'V', 'P'].map(k => h[k] ? <i key={k} className={'pv' + k} style={{ flex: h[k] }} /> : null)}</span>
          <small>{fmtDate(h.d, { weekday: 'short' })}</small>
        </div>
      ))}</div>
    </section>
  );
}

// Getting people ready for Thursday and Saturday, and outreach this week
function Ready() {
  const { m, today, now } = useM();
  const w = weekSummary(m, mondayOf(today));
  const came = m.invitations.filter(i => i.meetingKey && m.meetings[i.meetingKey] && submitted(m.meetings[i.meetingKey])?.entries[i.personId] === 'present' && i.date >= addDays(today, -28)).length;
  return (
    <section className="card pd-panel">
      <div className="card-h"><h2>Getting people ready</h2><a href="#/poimaino/followup/telepastoring">Telepastoring<ArrowRight size={13} /></a></div>
      {['thu', 'sat'].map(type => { const pr = prepFor(m, today, type, now); if (!pr) return null; return (
        <div key={type} className="rd-row">
          <div className="rd-h"><b>{typeLabel(m, type)}</b><span>{pr.next.date === today ? 'today' : fmtDate(pr.next.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>
          <div className="rd-m"><span className="ch-bar"><i style={{ width: `${pr.total ? (pr.done / pr.total) * 100 : 0}%` }} /></span><em>{pr.done} of {pr.total} contacted or invited</em></div>
          {pr.waiting.length > 0 && <p className="rd-w">Not yet: {pr.waiting.slice(0, 5).map((p, i) => <span key={p.id}>{i ? ', ' : ''}<a href={`#/poimaino/people/${p.id}`}>{p.name}</a></span>)}{pr.waiting.length > 5 ? ` and ${pr.waiting.length - 5} more` : ''}</p>}
        </div>
      ); })}
      <div className="rd-out">
        <h4>Outreach this week</h4>
        <div className="pl-stats">
          <div><b>{w.encounters}</b><span>people met</span></div>
          <div><b>{w.invitations}</b><span>invited</span></div>
          <div><b>{came}</b><span>invited who came (4 weeks)</span></div>
        </div>
      </div>
    </section>
  );
}

// Members who need attention, with the reason for each
function Attention() {
  const { m, today } = useM();
  const list = needAttention(m, today);
  const fu = m.followUps.filter(f => ['planned', 'attempted'].includes(f.status));
  const overdue = fu.filter(f => f.due && f.due < today).length;
  return (
    <section className="card pd-panel" id="attention">
      <div className="card-h"><h2>Members needing attention</h2><a href="#/poimaino/people/attention">All of them<ArrowRight size={13} /></a></div>
      {list.length === 0 ? <p className="pd-clear small"><Check size={14} />Nobody is flagged. Keep calling and visiting.</p> : (
        <ul className="pd-calls">{list.slice(0, 7).map(({ p, why, level }) => (
          <li key={p.id}><a href={`#/poimaino/people/${p.id}`}><b>{p.name} <span className={'pr-lv ' + level}>{level}</span></b><small>{why.join(' · ')}</small></a>
            {telHref(p.phone) && !p.declinedContact && <a className="btn sm ghost" href={telHref(p.phone)} aria-label={`Call ${p.name}`}><Phone size={14} /></a>}</li>
        ))}</ul>
      )}
      {list.length > 7 && <p className="muted small" style={{ margin: '6px 0 0' }}>And {list.length - 7} more on the People page.</p>}
      <div className="pd-fu"><a href="#/poimaino/followup"><b>{fu.length}</b><span>follow-ups open</span></a><a href="#/poimaino/followup" className={overdue ? 'warn' : ''}><b>{overdue}</b><span>overdue</span></a></div>
    </section>
  );
}

// The state of the flock at a glance
const MEMB = [['contact', 'Contacts'], ['visitor', 'Visitors'], ['returning', 'Returning'], ['member', 'Members'], ['stable', 'Stable']];
function FlockState() {
  const { m } = useM();
  const live = m.people.filter(p => !['transferred', 'departed'].includes(p.membership));
  const by = MEMB.map(([id, l]) => [id, l, live.filter(p => p.membership === id).length]);
  const care = CARE_STATUS.map(c => [c, live.filter(p => REGISTERED.includes(p.membership) && p.careStatus === c).length]);
  const stages = m.settings.stages.map(s => ({ ...s, count: live.filter(p => p.stage === s.n).length }));
  const unassessed = live.filter(p => p.stage === null || p.stage === undefined).length;
  return (
    <section className="card pd-panel">
      <div className="card-h"><h2>State of the flock</h2><a href="#/poimaino/people">Everyone<ArrowRight size={13} /></a></div>
      <h4 className="fs-h">Where they are · {live.length} people</h4>
      <div className="pd-stack fs">{by.filter(([, , n]) => n).map(([id, l, n]) => <i key={id} className={'m-' + id} style={{ flex: n }} title={`${l}: ${n}`} />)}</div>
      <ul className="fs-leg">{by.map(([id, l, n]) => <li key={id} className={n ? '' : 'zero'}><i className={'m-' + id} />{l}<b>{n}</b></li>)}</ul>
      <h4 className="fs-h">How members are doing</h4>
      <ul className="fs-care">{care.map(([c, n]) => <li key={c} className={'c-' + c.toLowerCase() + (n ? '' : ' zero')}><b>{n}</b><span>{c}</span></li>)}</ul>
      <h4 className="fs-h">Discipleship · {live.length - unassessed} assessed</h4>
      <div className="pd-stack">
        {stages.filter(s => s.count).map(s => <i key={s.n} className={'s' + s.n} style={{ flex: s.count }} title={`${s.label}: ${s.count}`} />)}
        {unassessed > 0 && <i className="na" style={{ flex: unassessed }} title={`Not assessed: ${unassessed}`} />}
      </div>
      <p className="muted small" style={{ margin: '6px 0 0' }}>{stages.filter(s => s.count).map(s => `${s.label} ${s.count}`).join(' · ') || 'No stages assessed yet.'}{unassessed ? `${stages.some(s => s.count) ? ' · ' : ' '}${unassessed} not assessed` : ''}</p>
    </section>
  );
}

// Vision 25 as a ring, with the counts kept apart
function VisionRing() {
  const { m, today } = useM();
  const v = vision(m, today);
  const n = v.reviewed ? v.stable : v.baseline.approx;
  const R = 46, C = 2 * Math.PI * R;
  return (
    <>
      <div className="card-h"><h2>{MINISTRY.vision.label}</h2><a href="#/poimaino/vision">Open<ArrowRight size={13} /></a></div>
      <div className="pd-vision">
        <svg viewBox="0 0 110 110" className="pd-ring" aria-hidden="true">
          <circle cx="55" cy="55" r={R} className="bg" />
          <circle cx="55" cy="55" r={R} className="fg" strokeDasharray={`${(Math.min(n, v.target) / v.target) * C} ${C}`} transform="rotate(-90 55 55)" />
          {v.milestones.map(x => { const a = (x / v.target) * 2 * Math.PI - Math.PI / 2; return <line key={x} x1={55 + (R - 6) * Math.cos(a)} y1={55 + (R - 6) * Math.sin(a)} x2={55 + (R + 6) * Math.cos(a)} y2={55 + (R + 6) * Math.sin(a)} className="tick" />; })}
        </svg>
        <div className="pd-v-mid"><b>{v.reviewed ? n : `≈${n}`}</b><small>of {v.target}</small></div>
        <dl className="qs-dl">
          <div><dt>Registered</dt><dd>{v.registered}</dd></div>
          <div><dt>Active</dt><dd>{v.active}</dd></div>
          <div><dt>Stable</dt><dd>{v.stable}</dd></div>
        </dl>
      </div>
      <p className="muted small" style={{ margin: '8px 0 0' }}>{v.reviewed ? `${v.gap} more stable members to reach ${v.target}.` : 'Your estimate until you review the roster.'}</p>
    </>
  );
}

// Birthdays in the next two weeks
function Birthdays() {
  const { m, today } = useM();
  const soon = m.people.filter(p => p.birthday && !['departed', 'transferred'].includes(p.membership)).map(p => {
    let d = `${today.slice(0, 4)}-${p.birthday.slice(5, 10)}`;
    if (d < today) d = `${+today.slice(0, 4) + 1}-${p.birthday.slice(5, 10)}`;
    return { p, d, in: daysBetween(today, d) };
  }).filter(x => x.in <= 14).sort((a, b) => a.in - b.in);
  return (
    <>
      <h4 className="fs-h">Birthdays in the next two weeks</h4>
      {soon.length === 0 ? <p className="muted small" style={{ margin: 0 }}>None{m.people.some(p => p.birthday) ? '' : ' recorded yet. Add birthdays on each person’s page'}.</p>
        : <ul className="pd-calls">{soon.map(({ p, d, in: n }) => <li key={p.id}><a href={`#/poimaino/people/${p.id}`}><b>{p.name}</b><small>{n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}</small></a><Cake size={15} className="pd-cake" /></li>)}</ul>}
    </>
  );
}

// Vision 25, becoming established, and birthdays
function VisionPanel() {
  const { m, index } = useM();
  const live = m.people.filter(p => !['transferred', 'departed'].includes(p.membership));
  const est = EST_STEPS.map((l, i) => ({ l, n: live.filter(p => establishment(m, p, index).step === i).length }));
  const topE = Math.max(1, ...est.map(x => x.n));
  return (
    <section className="card pd-panel aside-like">
      <VisionRing />
      <h4 className="fs-h">Becoming established</h4>
      <ol className="pd-path">{est.map((x, i) => (
        <li key={x.l} className={x.n ? '' : 'zero'}><span className="pd-pn">{i + 1}</span><span className="pd-pl">{x.l}</span><span className="pd-pbar"><i style={{ width: `${(x.n / topE) * 100}%` }} /></span><b>{x.n}</b></li>
      ))}</ol>
      <Birthdays />
    </section>
  );
}

function VisionCard() {
  const { m, today } = useM();
  const v = vision(m, today);
  const shown = v.reviewed ? v.stable : null;
  return (
    <div className="card vision">
      <div className="card-h"><h2>{MINISTRY.vision.label}: 25 stable members</h2></div>
      <div className="vision-row">
        <div><b className="v-big">{shown !== null ? shown : `≈${v.baseline.approx}`}</b><span>{shown !== null ? 'stable members, roster-reviewed' : 'stable members, your estimate'}</span></div>
        <div className="v-track">
          <Bar pct={((shown ?? v.baseline.approx) / v.target) * 100} thick />
          <div className="v-miles">{v.milestones.map(n => <span key={n} style={{ left: `${(n / v.target) * 100}%` }}>{n}</span>)}</div>
        </div>
      </div>
      <p className="muted small" style={{ margin: '10px 0 0' }}>
        {v.reviewed ? `Gap: ${v.gap} more stable members.` : `${v.baseline.note} Planning gap about ${v.approxGap}. Review the roster to replace the estimate.`}
        {!v.deadline && ' No deadline set, so there is no "pace".'}
      </p>
      <TitleBlock className="fill" items={[['Registered', v.registered], ['Active', v.active], ['Stable', v.stable]]} />
    </div>
  );
}

// When someone last became stable (from their dated membership history)
const stableSince = (p) => [...(p.membershipHistory || [])].reverse().find(h => h.to === 'stable')?.date || '';
const initials = (n) => (n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

// One person's stability review: your criteria, ticked honestly, then your decision
function ReviewRow({ p, est }) {
  const { m, updatePerson } = useM();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [ticks, setTicks] = useState({});
  const [note, setNote] = useState('');
  const crit = m.settings.criteria;
  const n = crit.filter((_, i) => ticks[i]).length;
  const decide = () => {
    updatePerson(p.id, { membership: 'stable' }, `Stability review: ${crit.filter((_, i) => ticks[i]).join('; ')}${note.trim() ? `. ${note.trim()}` : ''}`);
    toast(`${p.name} is now a stable member`); setOpen(false);
  };
  return (
    <li className={'v5-rev' + (open ? ' open' : '')}>
      <div className="v5-rev-h">
        <a href={`#/poimaino/people/${p.id}`}><span className="v5-av">{initials(p.name)}</span><span><b>{p.name}</b><small>{est.label} · {membershipLabel(p.membership)}</small></span></a>
        <button type="button" className={open ? 'ghost sm' : 'sm'} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Review'}</button>
      </div>
      {open && <div className="v5-rev-b">
        <p className="muted small" style={{ margin: '0 0 6px' }}>Tick only what is true. Attendance suggests; your review decides.</p>
        <ul>{crit.map((c, i) => <li key={c}><label><input type="checkbox" checked={!!ticks[i]} onChange={e => setTicks(t => ({ ...t, [i]: e.target.checked }))} /><span>{c}</span></label></li>)}</ul>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="A note for the record (optional)" aria-label="Review note" />
        <div className="fr-foot"><span className="muted small">{n} of {crit.length} criteria</span><button type="button" className="primary sm" disabled={!n} onClick={decide}>Recognise as stable</button></div>
      </div>}
    </li>
  );
}

function VisionPage() {
  const { m, today, index, settings } = useM();
  const toast = useToast();
  const v = vision(m, today);
  const live = m.people.filter(p => !['transferred', 'departed'].includes(p.membership));
  const stable = live.filter(p => p.membership === 'stable').sort((a, b) => stableSince(a).localeCompare(stableSince(b)));
  const steps = EST_STEPS.map((l, i) => ({ l, people: live.filter(p => establishment(m, p, index).step === i) }));
  const candidates = live.filter(p => p.membership !== 'stable' && establishment(m, p, index).step >= 2).sort((a, b) => establishment(m, b, index).step - establishment(m, a, index).step || a.name.localeCompare(b.name));
  const atRisk = needAttention(m, today).filter(x => x.p.membership === 'stable');
  const count = v.reviewed ? v.stable : Math.max(v.stable, v.baseline.approx);
  const next = v.milestones.find(x => x > count) || v.target;
  // movement over the period you choose, from dated history, in buckets that suit its length
  const [range, setRange] = useState('6m');
  const pad2 = (x) => String(x).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const firstDay = [m.settings.meetingsFrom, ...m.people.flatMap(p => [p.createdAt, p.firstContact, ...(p.membershipHistory || []).map(h => h.date)])].filter(Boolean).sort()[0] || today;
  const start = { '1w': addDays(today, -6), '1m': addDays(today, -29), '3m': addDays(today, -90), '6m': addDays(today, -182), '1y': addDays(today, -364), all: firstDay }[range];
  const span = daysBetween(start, today) + 1;
  const unit = span <= 14 ? 'day' : span <= 120 ? 'week' : 'month';
  const buckets = [];
  if (unit === 'day') for (let d = start; d <= today; d = addDays(d, 1)) buckets.push({ from: d, to: d });
  else if (unit === 'week') for (let d = start; d <= today; d = addDays(d, 7)) buckets.push({ from: d, to: [addDays(d, 6), today].sort()[0] });
  else { const d = new Date(start.slice(0, 7) + '-01T12:00:00'); while (iso(d) <= today) { const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); buckets.push({ from: [iso(d), start].sort().pop(), to: [iso(end), today].sort()[0] }); d.setMonth(d.getMonth() + 1); } }
  const months = buckets.map(x => { const mv = stableMovement(m, x.from, x.to); return { ...x, gained: mv.establishedNew.length + mv.reestablished.length, lost: mv.departed.length + mv.transferred.length }; });
  const topM = Math.max(1, ...months.map(x => Math.max(x.gained, x.lost)));
  const label = (x) => unit === 'day' ? fmtDate(x.from, { weekday: 'narrow' }) : unit === 'week' ? fmtDate(x.from, { day: 'numeric', month: 'short' }) : fmtDate(x.from, { month: 'short' });
  const showLabel = (i) => months.length <= 13 || i % Math.ceil(months.length / 12) === 0;
  const monthsLeft = v.deadline ? Math.max(0, Math.round(daysBetween(today, v.deadline) / 30.4)) : null;
  const pace = v.deadline && monthsLeft ? Math.round(((v.target - count) / monthsLeft) * 10) / 10 : null;
  const seats = Array.from({ length: v.target }, (_, i) => stable[i] ? { kind: 'stable', p: stable[i] } : candidates[i - stable.length] ? { kind: 'next', p: candidates[i - stable.length] } : { kind: 'empty' });
  return (
    <>
      <section className="card v5-hero">
        <div className="v5-count">
          <b>{v.reviewed ? v.stable : `≈${v.baseline.approx}`}</b>
          <span>of {v.target} stable members</span>
          <small>{v.reviewed ? `${v.target - v.stable} to go · roster reviewed ${fmtDate(v.baseline.reviewedAt, { day: 'numeric', month: 'short' })}` : `Your estimate. ${v.stable} recorded as stable so far.`}</small>
        </div>
        <div className="v5-road">
          <div className="v5-track"><i style={{ width: `${(Math.min(count, v.target) / v.target) * 100}%` }} />
            {v.milestones.map(x => <span key={x} className={'v5-ms' + (count >= x ? ' got' : x === next ? ' nx' : '')} style={{ left: `${(x / v.target) * 100}%` }}><em>{x}</em></span>)}</div>
          <p className="v5-next">Next milestone: <b>{next}</b>, {Math.max(0, next - count)} more {next - count === 1 ? 'person' : 'people'}.{candidates.length ? ` ${candidates.length} ${candidates.length === 1 ? 'is' : 'are'} ready for a review.` : ''}</p>
          <div className="v5-meta">
            <label>Target date <input type="date" value={v.deadline || ''} min={today} onChange={e => settings({ visionDeadline: e.target.value })} /></label>
            <span>{pace !== null ? <>About <b>{pace}</b> new stable {pace === 1 ? 'member' : 'members'} a month to reach {v.target} by {fmtDate(v.deadline, { month: 'long', year: 'numeric' })}.</> : 'No target date, so there is no pace. Set one if it helps you plan.'}</span>
            {!v.reviewed && <button type="button" className="sm" onClick={() => { settings({ baseline: { ...m.settings.baseline, reviewedAt: today } }); toast('Roster reviewed: the count now comes from your records'); }}>I’ve reviewed the roster</button>}
          </div>
        </div>
      </section>

      <section className="card v5-seats-card">
        <div className="card-h"><h2>The {v.target} seats</h2><span className="v5-key"><span><i className="k-st" />Stable</span><span><i className="k-nx" />Ready for review</span><span><i className="k-em" />To be filled</span></span></div>
        <ol className="v5-seats">{seats.map((x, i) => (
          <li key={i} className={'s-' + x.kind}>
            {x.p ? <a href={`#/poimaino/people/${x.p.id}`} title={x.kind === 'stable' ? `${x.p.name}, stable${stableSince(x.p) ? ` since ${fmtDate(stableSince(x.p))}` : ''}` : `${x.p.name}: ready for a stability review`}>
              <span className="v5-av">{initials(x.p.name)}</span><span className="v5-st"><b>{x.p.name}</b><small>{x.kind === 'stable' ? (stableSince(x.p) ? `since ${fmtDate(stableSince(x.p), { month: 'short', year: 'numeric' })}` : 'stable') : 'ready for review'}</small></span></a>
              : <span className="v5-n"><em>{i + 1}</em>Seat to fill</span>}
          </li>
        ))}</ol>
      </section>

      <div className="pd-grid">
        <section className="card pd-panel">
          <div className="card-h"><h2>The way to stable</h2><a href="#/poimaino/people">People<ArrowRight size={13} /></a></div>
          <ol className="v5-path">{steps.map((x, i) => (
            <li key={x.l} className={x.people.length ? '' : 'zero'}>
              <span className="pd-pn">{i + 1}</span>
              <div><b>{x.l} <em>{x.people.length}</em></b>
                {x.people.length > 0 && <span className="v5-chips">{x.people.slice(0, 8).map(p => <a key={p.id} href={`#/poimaino/people/${p.id}`}>{p.name}</a>)}{x.people.length > 8 && <em>+{x.people.length - 8}</em>}</span>}</div>
            </li>
          ))}</ol>
          <p className="muted small" style={{ margin: 'auto 0 0', paddingTop: 10 }}>Evangelism brings people to a first visit; telepastoring, PVTI and invitations bring them back; your review recognises them as stable.</p>
        </section>
        <section className="card pd-panel">
          <div className="card-h"><h2>Ready for a review</h2><span className="muted small">{candidates.length}</span></div>
          {candidates.length === 0 ? <p className="muted">No one is returning regularly without a review yet. When someone has come back twice or more, they appear here.</p> : <ul className="v5-revs">{candidates.map(p => <ReviewRow key={p.id} p={p} est={establishment(m, p, index)} />)}</ul>}
          <a className="aside-link" style={{ marginTop: 'auto', paddingTop: 10 }} href="#/poimaino/settings">Your review criteria<ArrowRight size={13} /></a>
        </section>
      </div>

      <div className="pd-grid">
        <section className="card pd-panel">
          <div className="card-h"><h2>Keep the stable</h2><span className="muted small">{atRisk.length ? `${atRisk.length} to reach` : 'All well'}</span></div>
          {atRisk.length === 0 ? <p className="pd-clear small"><Check size={14} />No stable member is flagged. Keep calling and visiting them too.</p> : (
            <ul className="pd-calls">{atRisk.map(({ p, why }) => <li key={p.id}><a href={`#/poimaino/people/${p.id}`}><b>{p.name}</b><small className="why-t">{why.join(' · ')}</small></a>{telHref(p.phone) && <a className="btn sm ghost" href={telHref(p.phone)} aria-label={`Call ${p.name}`}><Phone size={14} /></a>}</li>)}</ul>
          )}
          <p className="muted small" style={{ margin: 'auto 0 0', paddingTop: 10 }}>A seat is kept by care as much as it is filled by growth.</p>
        </section>
        <section className="card pd-panel">
          <div className="card-h"><h2>Movement</h2><span className="jw-kinds v5-range" role="group" aria-label="Period">{[['1w', '1 week'], ['1m', '1 month'], ['3m', '3 months'], ['6m', '6 months'], ['1y', '1 year'], ['all', 'View all']].map(([k, l]) => <button key={k} type="button" className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>)}</span></div>
          <p className="muted small" style={{ margin: '-4px 0 8px' }}>{range === 'all' ? `Since ${fmtDate(firstDay, { day: 'numeric', month: 'long', year: 'numeric' })}, your first record` : `${fmtDate(start, { day: 'numeric', month: 'short' })} to today`}, by {unit}.</p>
          <div className="v5-mv" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }} role="img" aria-label="Stable members gained and lost">{months.map((x, i) => (
            <div key={x.from} title={`${fmtDate(x.from)}${x.to !== x.from ? ` to ${fmtDate(x.to)}` : ''}: +${x.gained}, −${x.lost}`}>
              <span className="v5-mv-up"><i style={{ height: `${(x.gained / topM) * 100}%` }}>{x.gained > 0 && months.length <= 16 && <em>+{x.gained}</em>}</i></span>
              <span className="v5-mv-dn"><i style={{ height: `${(x.lost / topM) * 100}%` }}>{x.lost > 0 && months.length <= 16 && <em>−{x.lost}</em>}</i></span>
              {showLabel(i) && <small>{label(x)}</small>}
            </div>
          ))}</div>
          <div className="pl-stats">
            <div><b>{(n => (n ? `+${n}` : '0'))(months.reduce((n, x) => n + x.gained, 0))}</b><span>became stable</span></div>
            <div><b>{(n => (n ? `−${n}` : '0'))(months.reduce((n, x) => n + x.lost, 0))}</b><span>left or transferred</span></div>
            <div><b>{v.active}</b><span>active of {v.registered} registered</span></div>
          </div>
        </section>
      </div>
    </>
  );
}

// The figures for one week, so two weeks can be compared
function weekFigures(m, week, today) {
  const w = weekSummary(m, week);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i)).filter(d => d <= today);
  const dd = days.map(d => dailyDone(m, d));
  const thu = w.meetings.find(x => x.mt.type === 'thu'), sat = w.meetings.find(x => x.mt.type === 'sat');
  const pv = pvciWeek(m, week);
  return { w, days, thu, sat, pv, pvTotal: pv.P + pv.V + pv.T + pv.I,
    rhythm: DAILY.map(x => [x, days.filter((d, i) => dailyMet(dd[i], x.id)).length]),
    rhythmDone: days.reduce((n, d, i) => n + DAILY.filter(x => dailyMet(dd[i], x.id)).length, 0),
    rota: dd.reduce((n, x) => n + x.rota, 0), rotaMade: dd.reduce((n, x) => n + x.rotaMade, 0),
    chats: (m.chatPosts || []).filter(x => x.date >= week && x.date <= addDays(week, 6)).length };
}
const delta = (a, b) => (a === null || a === undefined || b === null || b === undefined ? null : a - b);

// ISO week number, for the week header
const weekNo = (iso) => { const d = new Date(iso + 'T12:00:00Z'); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return 1 + Math.round(((d - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7); };
const REVIEW_PARTS = [['well', 'What went well', 'Who came, what God did'], ['improve', 'What to do better', 'What fell through, honestly'], ['care', 'Who needs care', 'Names and what they need'], ['plan', 'The plan for next week', 'Visits, calls, invitations, the message']];

function WeeklyReview() {
  const { m, today, weekNote, addFollow, delivery } = useM();
  const toast = useToast();
  const thisMon = mondayOf(today);
  const [week, setWeek] = useState([1, 2].includes(weekdayOf(today)) ? addDays(thisMon, -7) : thisMon);
  const f = weekFigures(m, week, today);
  const pf = weekFigures(m, addDays(week, -7), today);
  const note = m.weekNotes[week] || {};
  const blank = (n) => ({ well: n.well || '', improve: n.improve || '', care: n.care || '', plan: n.plan || n.notes || '' });
  const [rv, setRv] = useState(blank(note));
  const [pick, setPick] = useState({ meetings: true, people: true, outreach: true, pvti: true, rhythm: true });
  const [to, setTo] = useState(m.settings.recipients?.[0] || '');
  const go = (w) => { setWeek(w); setRv(blank(m.weekNotes[w] || {})); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const name = (id) => m.people.find(p => p.id === id)?.name || 'Someone';
  const isPast = week < thisMon;
  const sunday = addDays(week, 6);
  const weekLabel = week === thisMon ? 'This week so far' : week === addDays(thisMon, -7) ? 'Last week' : `Week of ${fmtDate(week, { day: 'numeric', month: 'long' })}`;
  const g = m.settings.weeklyGoals || {};
  const days7 = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  // people: who you spoke to, who you didn't
  const reachedIds = new Set(m.followUps.filter(x => x.status === 'completed' && x.reached !== false && x.kind !== 'prayer' && x.completedAt >= week && x.completedAt <= sunday).map(x => x.personId));
  const flock = m.people.filter(isFlock);
  const notReached = flock.filter(p => !reachedIds.has(p.id));
  const absentOf = (x) => x ? Object.entries(submitted(x.mt).entries).filter(([id, v]) => v === 'absent' && REGISTERED.includes(m.people.find(p => p.id === id)?.membership)).map(([id]) => id) : [];
  const absent = [...new Set([...absentOf(f.thu), ...absentOf(f.sat)])];
  const nextMon = addDays(week, 7) > today ? addDays(week, 7) : today;
  const planCalls = () => { notReached.forEach(p => addFollow({ key: `wr-${week}-${p.id}`, personId: p.id, kind: 'call', title: 'Not spoken to last week', due: nextMon })); toast(`${notReached.length} calls planned for ${fmtDate(nextMon, { weekday: 'long' })}`); };
  const planAbsent = () => { absent.forEach(id => addFollow({ key: `wa-${week}-${id}`, personId: id, kind: 'welfare', title: 'Missed a meeting last week', due: nextMon })); toast('Check-ins planned'); };
  const save = () => { weekNote(week, { ...rv, notes: rv.plan, reviewedAt: today }); toast('Review saved'); };
  const sent = m.deliveries.filter(d => d.week === week);
  const lines = [
    `${m.settings.name || MINISTRY.name}: week of ${fmtDate(week, { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pick.meetings && `Thursday Bible study: ${f.thu ? `${f.thu.st.total} present` : 'no submitted report'}. Saturday church: ${f.sat ? `${f.sat.st.total} present` : 'no submitted report'}.`,
    pick.people && `First timers: ${f.w.firstTime}. Second timers: ${f.w.secondTime}.`,
    pick.outreach && `Evangelism: ${f.w.encounters} encounters, ${f.w.reachedOutreach} people reached, ${f.w.invitations} invited.`,
    pick.pvti && `PVTI: prayer ${f.pv.P}, visitation ${f.pv.V}, teaching ${f.pv.T}, interaction ${f.pv.I}. Telepastoring: ${f.rotaMade} of ${f.rota} rota calls.`,
    pick.rhythm && `Daily shepherding: ${f.rhythmDone} of ${f.days.length * DAILY.length} done. Chat posts: ${f.chats}.`,
  ].filter(Boolean);
  const tiles = [
    ['Thursday', f.thu?.st.total ?? null, pf.thu?.st.total ?? null, f.thu ? 'present' : 'not submitted'],
    ['Saturday', f.sat?.st.total ?? null, pf.sat?.st.total ?? null, f.sat ? 'present' : 'not submitted'],
    ['First timers', f.w.firstTime, pf.w.firstTime, 'at either meeting'],
    ['Second timers', f.w.secondTime, pf.w.secondTime, 'came back a second time'],
    ['Evangelism', f.w.reachedOutreach, pf.w.reachedOutreach, `people reached · ${f.w.invitations} invited`],
    ['PVTI', f.pvTotal, pf.pvTotal, `P ${f.pv.P} · V ${f.pv.V} · T ${f.pv.T} · I ${f.pv.I}`],
  ];
  return (
    <>
      <section className="card wr-head">
        <button type="button" className="wr-arrow" onClick={() => go(addDays(week, -7))} aria-label="Earlier week"><ChevronLeft size={20} /></button>
        <div className="wr-title"><small>Week {weekNo(week)} · {fmtDate(week, { day: 'numeric', month: 'short' })} – {fmtDate(sunday, { day: 'numeric', month: 'short', year: 'numeric' })}</small><b>{weekLabel}</b></div>
        <ol className="wr-days">{days7.map(d => { const dd = d <= today ? dailyDone(m, d) : null; const n = dd ? DAILY.filter(x => dailyMet(dd, x.id)).length : 0; return (
          <li key={d} className={d === today ? 'today' : d > today ? 'ahead' : ''} title={d <= today ? `${fmtDate(d)}: ${n} of ${DAILY.length} daily tasks` : fmtDate(d)}>
            <small>{fmtDate(d, { weekday: 'narrow' })}</small><b>{+d.slice(8)}</b><span className="wr-dots">{DAILY.map((x, k) => <i key={x.id} className={k < n ? 'on' : ''} />)}</span>
          </li>
        ); })}</ol>
        <span className={'wr-state ' + (note.reviewedAt ? 'ok' : isPast ? 'due' : '')}>{note.reviewedAt ? <><Check size={14} strokeWidth={3} />Reviewed {fmtDate(note.reviewedAt, { day: 'numeric', month: 'short' })}</> : isPast ? <><Clock size={14} />Not reviewed yet</> : <><Clock size={14} />In progress</>}</span>
        <button type="button" className="wr-arrow" disabled={week >= thisMon} onClick={() => go(addDays(week, 7))} aria-label="Later week"><ChevronRight size={20} /></button>
      </section>

      <div className="pk-row wr-tiles">{tiles.map(([k, v, prev, sub]) => { const d = delta(v, prev); return (
        <div key={k} className="pk"><small>{k}</small><b>{v ?? '—'}</b><span>{sub}</span>
          {d !== null && <em className={'wr-d ' + (d > 0 ? 'up' : d < 0 ? 'down' : '')}>{d > 0 ? `+${d}` : d < 0 ? `−${-d}` : 'same as'} {d === 0 ? 'the week before' : 'on the week before'}</em>}</div>
      ); })}</div>

      <div className="pd-grid">
        <section className="card pd-panel">
          <div className="card-h"><h2>The meetings</h2><a href="#/poimaino/services">Services<ArrowRight size={13} /></a></div>
          {[['thu', f.thu], ['sat', f.sat]].map(([type, x]) => {
            const v = attendanceWeeks(m, sunday, 9).slice(0, 8).map(w => w[type]).filter(n => n !== null);
            const avg = v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
            const ser = type === 'thu' ? m.sermons.find(z => z.date && z.date >= week && z.date <= sunday) : null;
            return (
              <div key={type} className="wr-meet">
                <div className="wr-mh"><b>{typeLabel(m, type)}</b>{x ? <a href={`#/poimaino/services/${encodeURIComponent(x.mt.key)}`}>{x.st.total} present</a> : <span className="muted small">not submitted</span>}</div>
                <dl className="wr-names">
                  {x && x.st.firstTime.length > 0 && <div><dt>First timers</dt><dd>{x.st.firstTime.map(name).join(', ')}</dd></div>}
                  {x && x.st.secondTime.length > 0 && <div><dt>Second timers</dt><dd>{x.st.secondTime.map(name).join(', ')}</dd></div>}
                  {x && absentOf(x).length > 0 && <div className="warn"><dt>Members absent</dt><dd>{absentOf(x).map(name).join(', ')}</dd></div>}
                  <div><dt>Usually</dt><dd>{avg === null ? 'Nothing earlier to compare with' : `${avg} over the ${v.length} ${v.length === 1 ? 'week' : 'weeks'} before${x ? (x.st.total > avg ? ', so above' : x.st.total < avg ? ', so below' : ', the same') : ''}`}</dd></div>
                  {type === 'thu' && <div><dt>The message</dt><dd>{ser ? <a href={`#/poimaino/sermons/${ser.id}`}>{ser.title || 'Untitled'}</a> : 'None recorded'}</dd></div>}
                </dl>
              </div>
            );
          })}
          {absent.length > 0 && <button type="button" className="sm" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={planAbsent}>Plan a check-in with the {absent.length} absent</button>}
        </section>
        <section className="card pd-panel">
          <div className="card-h"><h2>Your shepherding</h2><a href="#/poimaino/followup/pvti">PVTI log<ArrowRight size={13} /></a></div>
          <div className="wr-grid">
            <span />{days7.map(d => <b key={d}>{fmtDate(d, { weekday: 'short' })}</b>)}
            {DAILY.map(x => <Fragment key={x.id}><span className="wr-l">{x.label.split(',')[0].replace('Pray', 'PVTI').replace('Share in the Bacenta chat', 'Chat')}</span>
              {days7.map(d => { const ok = d <= today && dailyMet(dailyDone(m, d), x.id); return <i key={x.id + d} className={ok ? 'ok' : d < today ? 'miss' : ''} title={`${x.label}, ${fmtDate(d)}: ${ok ? 'done' : d <= today ? 'not done' : 'ahead'}`} />; })}</Fragment>)}
          </div>
          <ul className="wr-goals">{[['Prayer', f.pv.P, g.prayer], ['Visitation', f.pv.V, g.visits], ['Teaching', f.pv.T, g.teaching], ['Interaction', f.pv.I, g.interaction], ['Rota calls', f.rotaMade, f.rota || null], ['Outreach', f.w.encounters, g.outreach]].map(([k, have, goal]) => (
            <li key={k} className={goal && have >= goal ? 'met' : ''}><span>{k}</span><b>{have}<small>{goal ? ` / ${goal}` : ''}</small></b><span className="ch-bar"><i style={{ width: `${goal ? Math.min(100, (have / goal) * 100) : 0}%` }} /></span></li>
          ))}</ul>
        </section>
      </div>

      <section className="card wr-flock">
        <div className="wr-fl-n"><b>{flock.length - notReached.length}<small> / {flock.length}</small></b><span>members and visitors spoken to</span><span className="ch-bar"><i style={{ width: `${flock.length ? ((flock.length - notReached.length) / flock.length) * 100 : 0}%` }} /></span></div>
        <div className="wr-fl-b">
          {notReached.length ? <><h4>Not spoken to this week</h4><span className="v5-chips">{notReached.map(p => <a key={p.id} href={`#/poimaino/people/${p.id}`}>{p.name}</a>)}</span></>
            : <p className="pd-clear"><Check size={16} />You spoke to everyone in your flock this week.</p>}
          <small>A call, message, visit or conversation recorded as reached. Being at a meeting is counted separately.</small>
        </div>
        {notReached.length > 0 && <button type="button" className="sm" onClick={planCalls}>Plan a call with each, {fmtDate(nextMon, { weekday: 'long' })}</button>}
      </section>

      <section className="card wr-review">
        <div className="card-h"><h2>Your review</h2><a href="#/home/journal/reviews">All your reviews are in your Boēthos journal<ArrowRight size={13} /></a></div>
        <div className="wr-rv-grid">{REVIEW_PARTS.map(([k, l, ph]) => (
          <div className="field" key={k}><label htmlFor={`wr-${k}`}>{l}</label><textarea id={`wr-${k}`} value={rv[k]} onChange={e => setRv(x => ({ ...x, [k]: e.target.value }))} placeholder={ph} /></div>
        ))}</div>
        <div className="fr-foot"><span className="muted small">{note.reviewedAt ? `Saved ${fmtDate(note.reviewedAt, { weekday: 'long', day: 'numeric', month: 'short' })}. You can still change it.` : 'Saving marks the week reviewed on your dashboard.'}</span><button type="button" className="primary sm" onClick={save}>{note.reviewedAt ? 'Save changes' : 'Mark the week reviewed'}</button></div>
      </section>

      <section className="card wr-report">
        <div className="card-h"><h2>Report to your leader</h2><span className="muted small">Figures only. No names or notes, ever.</span></div>
        <div className="wr-rep">
          <div>
            <div className="wr-picks">{[['meetings', 'Meetings'], ['people', 'First and second timers'], ['outreach', 'Evangelism'], ['pvti', 'PVTI and calls'], ['rhythm', 'Daily rhythm']].map(([k, l]) => (
              <button key={k} type="button" className={pick[k] ? 'on' : ''} aria-pressed={pick[k]} onClick={() => setPick(x => ({ ...x, [k]: !x[k] }))}>{pick[k] && <Check size={13} />}{l}</button>
            ))}</div>
            <div className="wr-paper">{lines.map((l, i) => <p key={i} className={i === 0 ? 'h' : ''}>{l}</p>)}</div>
          </div>
          <div className="wr-send">
            <button type="button" className="sm" onClick={() => { navigator.clipboard?.writeText(lines.join('\n')); toast('Copied. Nothing was sent.'); }}><Copy size={14} />Copy the report</button>
            <label>Sent to<input value={to} onChange={e => setTo(e.target.value)} list="wr-recips" placeholder="Your Bacenta leader" /></label>
            <datalist id="wr-recips">{(m.settings.recipients || []).map(r => <option key={r} value={r} />)}</datalist>
            <button type="button" className="primary sm" disabled={!to.trim()} onClick={() => { delivery({ week, recipient: to.trim(), kind: 'week' }); toast('Recorded as sent'); }}>I sent it</button>
            {sent.length > 0 ? <ul className="wr-sent">{sent.map(d => <li key={d.id}><Check size={13} />{d.recipient}, {fmtDate(d.at.slice(0, 10), { day: 'numeric', month: 'short' })}</li>)}</ul> : <p className="muted small" style={{ margin: 0 }}>Not sent yet. Sending is up to you; this only records that you did.</p>}
          </div>
        </div>
      </section>

    </>
  );
}

const TABS = [['', 'Action centre'], ['vision', 'Vision 25'], ['week', 'Weekly review']];
export default function Dashboard({ tab = '' }) {
  const { m, today, now } = useM();
  const live = m.people.filter(p => !['transferred', 'departed'].includes(p.membership));
  const t = TABS.some(([id]) => id === tab) ? tab : '';
  return (
    <>
      <Head eyebrow="Poimainō" step={t === 'vision' ? m.settings.name || MINISTRY.name : 'John 21:16'} title={{ '': m.settings.name || MINISTRY.name, vision: 'Vision 25', week: 'Weekly review' }[t]}
        sub={{ '': 'Feed my sheep. Thursday Bible study, Saturday church, and every person in between.', vision: `${MINISTRY.vision.target} stable members: people who belong, return and grow. Each seat is filled by your review, not by a count.`, week: 'The week at a glance: meetings, the daily rhythm, PVTI, and your notes.' }[t]}>
        <TitleBlock items={[['People', live.length], ['Members', live.filter(p => ['member', 'stable'].includes(p.membership)).length], ['Needs you', alerts(m, today, now).length]]} />
      </Head>
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('poimaino', ...(v ? [v] : []))} options={TABS} /></div>
      {t === '' && (
        <>
          <Kpis />
          <div className="pd-grid first"><TodayRhythm /><ChatPanel /></div>
          <WeekStrip />
          <div className="pd-grid"><TodayCalls /><ActionCentre /></div>
          <div className="pd-grid"><PvciPanel /><AttendanceChart /></div>
          <div className="pd-grid"><Ready /><Attention /></div>
          <div className="pd-grid"><FlockState /><VisionPanel /></div>
        </>
      )}
      {t === 'vision' && <VisionPage />}
      {t === 'week' && <WeeklyReview />}
      {!m.people.length && t === '' && <div className="card" style={{ marginTop: 16 }}><Empty title="No people recorded yet." action={<a className="btn primary" href="#/poimaino/people">Add the people you shepherd</a>}><p style={{ margin: 0 }}>Start with the members you know. Nothing here is invented: the numbers come only from what you record.</p></Empty></div>}
    </>
  );
}
