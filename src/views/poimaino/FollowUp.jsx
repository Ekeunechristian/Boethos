import { useState } from 'react';
import { Plus, Phone, MessageCircle, Check, X, Clock, ArrowRight, Copy, Home as HomeIc, HandHeart, Sparkles, CalendarPlus, Church, Circle } from 'lucide-react';
import { FOLLOW_KINDS, VISIT_PREP, REGISTERED, PVTI, pvciOf } from '../../data/ministry';
import { addDays, meetingList, typeLabel, weekdayOf, submitted, daysBetween, isFlock, callsToday, prepFor, membershipLabel, teleWeek, teleTimes, teleVerse, telePace, teleDaysFor, areaOf, areaLabel } from '../../store/ministry';
import { Head, Seg, Empty, TitleBlock, fmtDate, useToast } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useM, personName, telHref, waHref, PersonPicker } from './common.jsx';
import { FollowSheet } from './People.jsx';

const kindLabel = (k) => FOLLOW_KINDS.find(([v]) => v === k)?.[1] || k;

const KIND_IC = { call: Phone, message: MessageCircle, visit: HomeIc, prayer: HandHeart, welcome: Sparkles, invitation: CalendarPlus };
const ini = (n) => (n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const dueText = (f, today) => {
  if (!f.due) return ['No date', ''];
  const n = daysBetween(f.due, today);
  if (n > 0) return [`${n} ${n === 1 ? 'day' : 'days'} late`, 'late'];
  if (n === 0) return ['Today', 'today'];
  if (n === -1) return ['Tomorrow', ''];
  return [fmtDate(f.due, { weekday: 'short', day: 'numeric', month: 'short' }), ''];
};

// One follow-up: who, what, when, and the actions that record what really happened
function Item({ f }) {
  const { m, today, resolve, updateFollow } = useM();
  const toast = useToast();
  const [mode, setMode] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [next, setNext] = useState({ title: '', due: addDays(today, 7) });
  const [edit, setEdit] = useState(false);
  const p = m.people.find(x => x.id === f.personId);
  const [when, tone] = dueText(f, today);
  const canContact = p?.phone && !p.declinedContact;
  const Ic = KIND_IC[f.kind] || ArrowRight;
  const snooze = (d) => { updateFollow(f.id, { snoozedUntil: d, due: d }); setMode(null); toast(`Moved to ${fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}`); };
  return (
    <li className={'fq-item ' + tone + (f.status === 'attempted' ? ' tried' : '')}>
      <div className="fq-top">
        <span className={'pr-av m-' + (p?.membership || 'contact')}>{ini(p?.name || f.personName)}</span>
        <div className="fq-t">
          <b>{p ? <a href={`#/poimaino/people/${p.id}`}>{p.name}</a> : (f.personName || 'Someone')}</b>
          <span className="fq-what"><Ic size={13} />{kindLabel(f.kind)}{f.title ? <> · {f.title}</> : null}</span>
          <small>{[f.time, f.kind === 'visit' && f.place, f.recurrence && `repeats ${f.recurrence}`, f.status === 'attempted' && `tried ${f.attempts?.length || 1}×, not reached yet`, p?.declinedContact && 'has declined contact'].filter(Boolean).join(' · ')}</small>
        </div>
        <span className={'fq-due ' + tone}>{when}</span>
      </div>
      <div className="fq-acts">
        {canContact && ['call', 'welcome', 'welfare', 'pastoral', 'invitation'].includes(f.kind) && <a className="fq-ic" href={telHref(p.phone)} aria-label={`Call ${p.name}`} title="Call"><Phone size={15} /></a>}
        {canContact && ['message', 'welcome', 'invitation'].includes(f.kind) && <a className="fq-ic" href={waHref(p.phone, `Hi ${p.name.split(' ')[0]}, `)} target="_blank" rel="noreferrer" aria-label="Draft a message" title="Opens a draft; it doesn’t prove delivery"><MessageCircle size={15} /></a>}
        <span className="grow" />
        <button className="ghost sm" onClick={() => setMode(mode === 'snooze' ? null : 'snooze')}><Clock size={14} />Later</button>
        <button className="ghost sm" onClick={() => setEdit(true)}>Edit</button>
        {f.kind !== 'prayer' && <button className="sm" onClick={() => { resolve(f.id, 'attempted', { outcome: 'Not reached' }); toast('Recorded as an attempt, not a contact'); }}>Not reached</button>}
        <button className={'sm fq-mark' + (mode === 'done' ? ' on' : '')} onClick={() => setMode(mode === 'done' ? null : 'done')}><Circle size={14} />{f.kind === 'prayer' ? 'Mark as prayed' : 'Mark as done'}</button>
      </div>
      {mode === 'snooze' && (
        <div className="fq-snooze"><span>Move to</span>
          {[['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([l, n]) => <button key={l} type="button" className="sm" onClick={() => snooze(addDays(today, n))}>{l}</button>)}
          <input type="date" min={addDays(today, 1)} onChange={e => e.target.value && snooze(e.target.value)} aria-label="Pick a date" />
        </div>
      )}
      {mode === 'done' && (
        <div className="fq-done">
          {f.kind === 'visit' && <div className="prep">{VISIT_PREP.map(([k, l]) => <label key={k} className="toggle"><input type="checkbox" checked={!!f.prep?.[k]} onChange={e => updateFollow(f.id, { prep: { ...(f.prep || {}), [k]: e.target.checked } })} />{l}</label>)}</div>}
          <label>What actually happened<input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder={f.kind === 'visit' ? 'Met at their home, prayed about the job' : 'Spoke for 10 minutes; coming Thursday'} /></label>
          <div className="fq-done-row">
            <label>Next step <em>optional</em><input value={next.title} onChange={e => setNext(n => ({ ...n, title: e.target.value }))} placeholder="Call again after the interview" /></label>
            {next.title && <label>On<input type="date" value={next.due} min={today} onChange={e => setNext(n => ({ ...n, due: e.target.value }))} /></label>}
          </div>
          <div className="fq-done-a">
            <button className="ghost sm" onClick={() => { resolve(f.id, 'cancelled', { outcome: outcome || 'Cancelled' }); toast('Cancelled'); }}><X size={14} />No longer needed</button>
            <button className="primary sm" onClick={() => { resolve(f.id, 'completed', { outcome, reached: true, nextAction: next.title, chain: next.title ? { title: next.title, due: next.due } : null }); toast(next.title ? 'Done, and the next step is planned' : 'Done'); }}>Save</button>
          </div>
        </div>
      )}
      {edit && <FollowSheet person={p} initial={f} onClose={() => setEdit(false)} />}
    </li>
  );
}

const FQ_KINDS = [['', 'All'], ['call', 'Calls'], ['message', 'Messages'], ['visit', 'Visits'], ['welcome', 'Welcomes'], ['care', 'Care'], ['prayer', 'Prayer']];
const kindIn = (f, k) => !k || (k === 'care' ? ['welfare', 'pastoral', 'counselling', 'teaching'].includes(f.kind) : k === 'message' ? ['message', 'conversation', 'invitation'].includes(f.kind) : f.kind === k);

function Queue({ visitsOnly }) {
  const { m, today } = useM();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState('');
  const all = m.followUps.filter(f => !f.teleRetry && ['planned', 'attempted'].includes(f.status) && (!visitsOnly || f.kind === 'visit'));
  const open = all.filter(f => kindIn(f, kind));
  const weekEnd = addDays(today, 7);
  const groups = [
    ['Overdue', open.filter(f => f.status !== 'attempted' && f.due && f.due < today), 'late', 'Past their date. Do these first, or move them.'],
    ['Today', open.filter(f => f.status !== 'attempted' && f.due === today), 'today', ''],
    ['Try again', open.filter(f => f.status === 'attempted'), 'tried', 'You tried and didn’t reach them. A different time, or a message, may help.'],
    ['This week', open.filter(f => f.status !== 'attempted' && f.due > today && f.due <= weekEnd).sort((a, b) => a.due.localeCompare(b.due)), '', ''],
    ['Later', open.filter(f => f.status !== 'attempted' && (!f.due || f.due > weekEnd)).sort((a, b) => (a.due || '9').localeCompare(b.due || '9')), '', ''],
  ];
  const notTele = (f) => !f.teleRec && !f.teleRetry && !f.rota;
  const doneToday = m.followUps.filter(f => notTele(f) && f.status === 'completed' && f.completedAt === today && (!visitsOnly || f.kind === 'visit'));
  const dueToday = all.filter(f => f.due && f.due <= today).length;
  const pct = doneToday.length + dueToday ? (doneToday.length / (doneToday.length + dueToday)) * 100 : 0;
  const recent = m.followUps.filter(f => notTele(f) && ['completed', 'cancelled'].includes(f.status) && (!visitsOnly || f.kind === 'visit')).sort((a, b) => ((b.completedAt || '') + b.id).localeCompare((a.completedAt || '') + a.id)).slice(0, 6);
  const since = addDays(today, -30);
  const done30 = m.followUps.filter(f => notTele(f) && f.status === 'completed' && f.completedAt >= since && (!visitsOnly || f.kind === 'visit'));
  const visits = m.followUps.filter(f => f.kind === 'visit');
  return (
    <div className="cols">
      <div className="stack">
        <section className="card fq-today">
          <div className="fq-today-n"><b>{doneToday.length}</b><span>done today</span></div>
          <div className="fq-today-b"><span className="ch-bar"><i style={{ width: `${pct}%` }} /></span><em>{dueToday ? `${dueToday} still due today or overdue` : doneToday.length ? 'Everything due today is done.' : 'Nothing due today.'}</em></div>
          <button className="primary" onClick={() => setAdding(true)}><Plus size={18} />{visitsOnly ? 'Plan a visit' : 'Add follow-up'}</button>
        </section>
        {!visitsOnly && <div className="pr-chips fq-kinds" role="group" aria-label="Show">{FQ_KINDS.map(([k, l]) => { const n = all.filter(f => kindIn(f, k)).length; return <button key={k} type="button" className={kind === k ? 'on' : ''} disabled={!n && k !== ''} onClick={() => setKind(k)}>{l}<em>{n}</em></button>; })}</div>}
        {open.length === 0 && <div className="card"><Empty title={visitsOnly ? 'No visits planned.' : kind ? 'Nothing of this kind.' : 'Nothing in the queue.'}><p style={{ margin: 0 }}>{visitsOnly ? 'Agree a time and place first; a home visit isn’t always possible.' : 'Calls, messages, welcomes, welfare checks and visits all come here, from People, the dashboard and Telepastoring.'}</p></Empty></div>}
        {groups.map(([title, list, tone, note]) => list.length > 0 && (
          <section key={title} className={'card fq-group ' + tone}>
            <div className="card-h"><h2>{title} <em>{list.length}</em></h2>{note && <span className="muted small">{note}</span>}</div>
            <ul className="fq-list">{list.map(f => <Item key={f.id} f={f} />)}</ul>
          </section>
        ))}
      </div>
      <aside className="aside even">
        <section>
          <h3>{visitsOnly ? 'Visits' : 'The last 30 days'}</h3>
          {visitsOnly ? <div className="cr-stats"><span><b>{visits.filter(f => f.status === 'planned').length}</b>Planned</span><span><b>{visits.filter(f => f.status === 'attempted').length}</b>Tried</span><span><b>{visits.filter(f => f.status === 'completed').length}</b>Done</span></div>
            : <div className="cr-stats"><span><b>{done30.filter(f => f.reached !== false).length}</b>Reached</span><span><b>{m.followUps.filter(f => f.status === 'attempted').length}</b>To retry</span><span className={groups[0][1].length ? 'due' : ''}><b>{all.filter(f => f.status !== 'attempted' && f.due && f.due < today).length}</b>Overdue</span></div>}
          <p className="muted small" style={{ margin: '10px 0 0' }}>{visitsOnly ? 'A visit shows love, shares the Word and prays; the checklist is a prompt, not a rule.' : 'Not reached is an attempt, not a contact. Opening WhatsApp doesn’t prove a message arrived.'}</p>
        </section>
        {visitsOnly && <CareCoverage />}
        <section>
          <h3>Done lately</h3>
          {recent.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Nothing recorded yet.</p> : <ul className="fq-recent">{recent.map(f => <li key={f.id} className={f.status === 'cancelled' ? 'x' : f.reached === false ? 'miss' : ''}>
            <span className="fq-dot" /><div><b>{personName(m, f.personId, f.personName)}</b><small>{kindLabel(f.kind)} · {f.status === 'cancelled' ? 'not needed' : f.reached === false ? 'not reached' : 'reached'}{f.outcome && f.status !== 'cancelled' ? ` · ${f.outcome}` : ''}</small></div><em>{f.completedAt ? fmtDate(f.completedAt, { day: 'numeric', month: 'short' }) : ''}</em></li>)}</ul>}
          <a className="aside-link" href="#/poimaino/followup/pvti">Everything in the PVTI log<ArrowRight size={13} /></a>
        </section>
      </aside>
      {adding && <FollowSheet kind={visitsOnly ? 'visit' : 'call'} onClose={() => setAdding(false)} />}
    </div>
  );
}

// Coverage: how many of the people who need care have actually been reached (not just how many visits)
function CareCoverage() {
  const { m, today } = useM();
  const need = m.people.filter(p => ['Struggling', 'Crisis'].includes(p.careStatus) || (p.restricted.care || []).some(c => c.status !== 'Closed'));
  const reached = need.filter(p => m.followUps.some(f => f.personId === p.id && f.status === 'completed' && f.reached !== false && f.completedAt >= addDays(today, -30)));
  return (
    <section>
      <h3>Care coverage (30 days)</h3>
      <TitleBlock items={[['Reached', need.length ? `${reached.length} / ${need.length}` : '—']]} />
      <p className="muted small" style={{ margin: '8px 0 0' }}>{need.length - reached.length > 0 ? `${need.length - reached.length} ${need.length - reached.length === 1 ? 'person' : 'people'} needing care not yet reached this month.` : need.length ? 'Everyone needing care was reached.' : 'No one is marked as needing care.'}</p>
    </section>
  );
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const weekPos = (d) => (d + 6) % 7;
const ago = (d, today) => { if (!d) return 'never'; const n = daysBetween(d, today); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; };
const NEXT_KINDS = [['call', 'Call'], ['message', 'Message'], ['visit', 'Visit'], ['prayer', 'Pray'], ['conversation', 'Talk']];

// Recording one contact: did they respond? If not, when to try again. If so, the invitation and anything to follow up.
function TeleRecord({ r, way0, meetings, onDone }) {
  const { m, today, now, tele } = useM();
  const toast = useToast();
  const { p } = r;
  const far = areaOf(p) === 'abroad';
  const [way, setWay] = useState(way0 || (p.channel === 'WhatsApp' || p.channel === 'SMS' ? 'message' : 'call'));
  const [resp, setResp] = useState(null);
  const [inv, setInv] = useState('');
  const [coming, setComing] = useState('');
  const [note, setNote] = useState('');
  const [next, setNext] = useState({ title: '', date: addDays(today, 2), kind: 'call' });
  const first = p.name.split(' ')[0];
  const retry = (w, date, label) => { tele({ personId: p.id, way, responded: false, retry: { way: w, date } }); toast(`${first}: no response. ${label}`); onDone(); };
  const later = now < '17:00' ? today : addDays(today, 1);
  const save = () => {
    tele({ personId: p.id, way, responded: true, invite: inv, coming, note: note.trim(), next });
    toast(`${first}: responded${inv ? (inv === 'near' ? ', encouraged to go to church' : ', invited') : ''}${next.title.trim() ? ', follow-up added' : ''}`); onDone();
  };
  return (
    <div className="tl-rec">
      <div className="tl-rec-h">
        <div className="tl-way" role="group" aria-label="How">{[['call', 'Call', Phone], ['message', 'Message', MessageCircle]].map(([v, l, Ic]) => <button key={v} type="button" className={way === v ? 'on' : ''} onClick={() => setWay(v)}><Ic size={14} />{l}</button>)}</div>
        <span>Did {first} respond?</span>
        <button type="button" className="iv-x" onClick={onDone} aria-label="Close"><X size={15} /></button>
      </div>
      <div className="tl-yn">
        <button type="button" className={'tl-y' + (resp === true ? ' on' : '')} onClick={() => setResp(true)}><Check size={16} />Yes, we spoke</button>
        <button type="button" className={'tl-n' + (resp === false ? ' on' : '')} onClick={() => setResp(false)}><X size={16} />No response</button>
      </div>
      {resp === false && (
        <div className="tl-retry">
          <span>Try again</span>
          {way === 'call' && <button type="button" className="sm" onClick={() => retry('message', today, 'A message is due now.')}><MessageCircle size={14} />Message now</button>}
          <button type="button" className="sm" onClick={() => retry(way, later, later === today ? 'Try again this evening.' : 'Try again tomorrow.')}><Clock size={14} />{later === today ? 'Later today' : 'Tomorrow'}</button>
          {later === today && <button type="button" className="sm" onClick={() => retry(way, addDays(today, 1), 'Try again tomorrow.')}>Tomorrow</button>}
          <button type="button" className="sm" onClick={() => retry(way, addDays(today, 2), 'Try again in two days.')}>In 2 days</button>
        </div>
      )}
      {resp === true && (
        <div className="tl-yes">
          <div className="tl-row"><span>{far ? 'Church' : 'Invited to'}</span>
            <div className="tl-chips">
              {far ? <button type="button" className={inv === 'near' ? 'on' : ''} onClick={() => setInv(inv === 'near' ? '' : 'near')}><Church size={14} />Go to church where they are</button>
                : meetings.map(mt => <button key={mt.key} type="button" className={inv === mt.key ? 'on' : ''} onClick={() => setInv(inv === mt.key ? '' : mt.key)}><CalendarPlus size={14} />{typeLabel(m, mt.type).split(' ')[0]} {fmtDate(mt.date, { day: 'numeric', month: 'short' })}</button>)}
              <button type="button" className={inv === '' ? 'on' : ''} onClick={() => setInv('')}>Not this time</button>
            </div>
          </div>
          {inv && <div className="tl-row"><span>{inv === 'near' ? 'Will they go?' : 'Coming?'}</span>
            <div className="tl-chips">{[['yes', 'Yes'], ['', 'Not sure'], ['no', 'Can’t']].map(([v, l]) => <button key={l} type="button" className={coming === v ? 'on' : ''} onClick={() => setComing(v)}>{l}</button>)}</div>
          </div>}
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="What you talked about (optional)" aria-label="Note" />
          <div className="tl-next">
            <input value={next.title} onChange={e => setNext(x => ({ ...x, title: e.target.value }))} placeholder="Anything to follow up? (optional)" aria-label="Follow-up" />
            <select value={next.kind} onChange={e => setNext(x => ({ ...x, kind: e.target.value }))} aria-label="Kind">{NEXT_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <input type="date" value={next.date} min={today} onChange={e => setNext(x => ({ ...x, date: e.target.value }))} aria-label="When" />
          </div>
          <div className="tl-save"><button type="button" className="primary" onClick={save}><Check size={16} />Save</button></div>
        </div>
      )}
    </div>
  );
}

const WHY = { retry: (r, today) => `No response ${r.retry.createdAt === today ? 'earlier today' : ago(r.retry.createdAt, today)}, so ${r.retry.kind === 'message' ? 'send a message' : 'call again'}`, catchup: (r) => `${DAYS[r.p.callDay]}’s name, not reached yet` };

function TeleRow({ r, meetings, week }) {
  const { m, today } = useM();
  const [open, setOpen] = useState(null);
  const { p } = r;
  const tel = telHref(p.phone), wa = p.phone ? waHref(p.phone, `Hi ${p.name.split(' ')[0]}, `) : '';
  const { updatePerson } = useM();
  const done = week ? r.state === 'done' : r.today.length > 0 && r.state !== 'retry';
  const last = week ? [...r.recs].reverse().find(f => f.reached !== false) || r.last : r.today[r.today.length - 1];
  const sub = [membershipLabel(p.membership), areaLabel(p), p.channel && `prefers ${p.channel}`].filter(Boolean).join(' · ');
  return (
    <li className={'tl-item' + (done ? ' done' : '') + (r.state === 'retry' ? ' retry' : '')}>
      <div className="tl-top">
        <span className={'pr-av m-' + p.membership}>{done ? <Check size={17} /> : ini(p.name)}</span>
        <span className="tl-t"><a href={`#/poimaino/people/${p.id}`}><b>{p.name}</b></a>
          <small>{done ? (last.reached ? `Responded${last.kind === 'message' ? ' to a message' : ' on the phone'}${week ? `, ${fmtDate(last.completedAt, { weekday: 'long' })}` : ''}` : `No response · ${r.retry ? `try again ${r.retry.due === today ? 'today' : fmtDate(r.retry.due, { weekday: 'long' })}` : 'no retry booked'}`)
            : WHY[r.state] ? WHY[r.state](r, today) : `${sub} · last contact ${ago(p.lastContact, today)}`}</small>
          {!done && WHY[r.state] && <small>{sub}</small>}
          {r.inv.length > 0 && <em className="tl-inv">{r.inv.map(i => i.kind === 'near' ? 'Encouraged to go to church' : `Invited to ${typeLabel(m, i.meetingKey.split(':')[0]).split(' ')[0]}${i.status === 'confirmed' ? ', coming' : i.status === 'declined' ? ', can’t come' : ''}`).join(' · ')}</em>}
        </span>
        {week && !open && <span className={'tl-pill ' + r.state + (r.late ? ' late' : '')}>{r.late ? 'Past deadline' : STATE_LABEL[r.state]}</span>}
        {week && !open && <select className="tl-move" value={String(p.callDay)} onChange={e => updatePerson(p.id, { callDay: Number(e.target.value) })} aria-label={`Move ${p.name} to another day`} title="Move to another day">{teleDaysFor(p).map(x => <option key={x} value={x}>{DAYS[x]}</option>)}</select>}
        {!open && <span className="tl-acts">
          {tel ? <a className="fq-ic" href={tel} onClick={() => setTimeout(() => setOpen('call'), 300)} aria-label={`Call ${p.name}`} title="Call"><Phone size={16} /></a> : null}
          {wa ? <a className="fq-ic" href={wa} target="_blank" rel="noreferrer" onClick={() => setTimeout(() => setOpen('message'), 300)} aria-label={`Message ${p.name}`} title="Message on WhatsApp (a draft; you send it)"><MessageCircle size={16} /></a> : null}
          {!tel && !wa && <a className="tl-nonum" href={`#/poimaino/people/${p.id}`}>Add their number</a>}
          <button type="button" className={done ? 'ghost sm' : 'sm primary'} onClick={() => setOpen(r.state === 'retry' ? r.retry.kind : 'auto')}>{done ? 'Again' : 'Record'}</button>
        </span>}
      </div>
      {open && <TeleRecord r={r} way0={open === 'auto' ? '' : open} meetings={meetings} onDone={() => setOpen(null)} />}
    </li>
  );
}

const STATE_LABEL = { done: 'Reached', retry: 'Try again', wait: 'Retry booked', today: 'Today', catchup: 'Not reached', later: 'To come', noday: 'No day' };
const WEEKDAYS = [1, 2, 3, 4, 5];

// Your pace: one number you can't miss, the two deadlines, and the week day by day
function Pace({ wk, pace, list, wd }) {
  const { today } = useM();
  const doneN = list.filter(x => x.done).length;
  const tone = wd === 0 || wd === 1 && !pace.expected ? 'good' : pace.tone;
  const msg = wd === 0 ? ['Sunday', 'A day of rest. Telepastor anyone you choose; nothing is due.']
    : wd === 6 ? ['Saturday', `Wake-up and preparation calls: ${doneN} of ${list.length} done today.`]
    : !pace.expected ? ['The week starts today', `${list.length} ${list.length === 1 ? 'name' : 'names'} for ${DAYS[wd]}.`]
    : tone === 'good' ? ['On pace', `Everyone due before ${DAYS[wd]} has been reached, or nearly. Today: ${doneN} of ${list.length}.`]
    : tone === 'warn' ? ['Falling behind', `${pace.behind} of the ${pace.expected} due before ${DAYS[wd]} not reached yet.`]
    : ['Very behind', `Only ${pace.expected - pace.behind} of the ${pace.expected} due before ${DAYS[wd]} reached. ${pace.behind} still waiting.`];
  const dl = (g, label, by, why) => {
    const left = g.total - g.reached;
    const t = !left ? 'good' : g.daysLeft < 0 ? 'bad' : g.reached < g.expected * 0.6 ? 'bad' : g.reached < g.expected ? 'warn' : '';
    return (
      <div className={'tl-dl ' + t}>
        <span className="tl-dl-h"><b>{label}</b><em>{!left ? 'all reached' : g.daysLeft > 0 ? `by ${by} · ${g.daysLeft + 1} days left` : g.daysLeft === 0 ? `by tonight` : `${by} has passed`}</em></span>
        <span className="tl-dl-bar"><i style={{ width: `${g.total ? (g.reached / g.total) * 100 : 0}%` }} /></span>
        <span className="tl-dl-f"><b>{g.reached}</b> of {g.total} · {why}</span>
      </div>
    );
  };
  return (
    <section className={'card tl-pace ' + tone}>
      <div className="tl-pace-top">
        <div className="tl-pace-n"><b>{pace.reached}</b><span>/ {pace.total}</span><small>telepastored this week</small></div>
        <div className="tl-pace-msg"><em>{msg[0]}</em><p>{msg[1]}</p></div>
      </div>
      <div className="tl-dls">
        {dl(pace.bham, 'Birmingham', 'Wednesday', 'before Thursday, for Bible study and the bus')}
        {dl(pace.other, 'Outside Birmingham', 'Friday', 'before Saturday, so they go to church on Sunday')}
      </div>
      <p className="tl-verse">“{teleVerse(today).text}” <cite>{teleVerse(today).ref}</cite></p>
    </section>
  );
}

// The week, Monday to Friday: pick a day, see everyone on it, act on them
function Board({ wk, wd, meetings }) {
  const [day, setDay] = useState(WEEKDAYS.includes(wd) ? wd : 1);
  const ppl = wk.filter(r => r.p.callDay === day).sort((a, b) => (a.state === 'done') - (b.state === 'done') || a.p.name.localeCompare(b.p.name));
  return (
    <>
      <div className="tl-daytabs" role="tablist">{WEEKDAYS.map(d => {
        const g = wk.filter(r => r.p.callDay === d);
        const k = g.filter(r => r.state === 'done').length;
        const behind = wd !== 0 && weekPos(d) < weekPos(wd) && k < g.length;
        return (
          <button key={d} type="button" role="tab" aria-selected={day === d} className={'tl-dt' + (day === d ? ' on' : '') + (d === wd ? ' today' : '') + (behind ? ' behind' : '') + (g.length && k === g.length ? ' full' : '')} onClick={() => setDay(d)}>
            <span className="tl-dt-h"><b>{DAYS[d]}</b>{d === wd && <i>Today</i>}</span>
            <small>{d <= 3 ? 'Birmingham' : 'Outside Birmingham'}</small>
            <span className="tl-dt-n"><b>{k}</b>/{g.length}</span>
            <span className="tl-col-bar"><i style={{ width: `${g.length ? (k / g.length) * 100 : 0}%` }} /></span>
          </button>
        );
      })}</div>
      {ppl.length ? <ul className="fq-list tl-daylist">{ppl.map(r => <TeleRow key={r.p.id} r={r} meetings={meetings} week />)}</ul>
        : <p className="tl-col-none">Nobody on {DAYS[day]}.</p>}
    </>
  );
}

// Telepastoring: everyone on your soul list, by phone or message, Monday to Friday
function Telepastoring() {
  const { m, today, spreadCallDays, settings } = useM();
  const toast = useToast();
  const [time, setTime] = useState('');
  const [sunday, setSunday] = useState(false);
  const wk = teleWeek(m, today);
  const pace = telePace(m, today, wk);
  const list = callsToday(m, today);
  const wd = weekdayOf(today);
  const meetings = meetingList(m, today, 0).filter(x => x.date >= today && x.date <= addDays(today, 6) && x.status !== 'cancelled');
  const times = teleTimes(m);
  const open = list.filter(x => !x.done);
  const misplaced = wk.filter(r => !teleDaysFor(r.p).includes(r.p.callDay)).length;
  const groups = wd === 6 ? [
    ['retry', 'Try again', open.filter(x => x.state === 'retry'), 'They didn’t respond last time.'],
    ['today', 'Birmingham: church today', open.filter(x => x.bham && x.state !== 'retry'), 'A wake-up call: ready for the service, and the bus.'],
    ['other', 'Outside Birmingham: church tomorrow', open.filter(x => !x.bham && x.state !== 'retry'), 'Help them prepare to go to church on Sunday where they are.'],
  ] : wd === 0 ? [] : [
    ['urgent', 'Birmingham, before Thursday', open.filter(x => x.bham && x.state === 'catchup'), 'Their day has passed. Confirm Bible study and the bus.'],
    ['retry', 'Try again', open.filter(x => x.state === 'retry'), 'They didn’t respond last time. Try the other way, or another time.'],
    ['today', `${DAYS[wd]}’s names`, open.filter(x => x.state === 'today'), ''],
    ['catchup', 'Catch up', open.filter(x => !x.bham && x.state === 'catchup'), 'Their day has passed this week and they haven’t been reached.'],
  ];
  const optional = wk.filter(r => r.state !== 'done');
  const inv = wk.flatMap(r => r.inv);
  const setTimes = (t) => settings({ teleTimes: t, callTime: [...t].sort()[0] || '' });
  return (
    <>
    <div className="cols">
      <div className="stack">
        <Pace wk={wk} pace={pace} list={list} wd={wd} />
        {groups.map(([id, title, g, hint]) => g.length > 0 && (
          <section key={id} className={'card fq-group tl-g ' + id}>
            <div className="card-h"><h2>{title}<em>{g.length}</em></h2>{hint && <span className="muted small">{hint}</span>}</div>
            <ul className="fq-list">{g.map(r => <TeleRow key={r.p.id} r={r} meetings={meetings} />)}</ul>
          </section>
        ))}
        {wd === 0 && (
          <section className="card tl-g sunday">
            <div className="card-h"><h2>Sunday is optional</h2><span className="muted small">{optional.length} not reached this week</span></div>
            {sunday ? <ul className="fq-list">{optional.map(r => <TeleRow key={r.p.id} r={r} meetings={meetings} />)}</ul>
              : <button type="button" onClick={() => setSunday(true)}>Show who I could telepastor today</button>}
          </section>
        )}
        {wd !== 0 && !open.length && list.length > 0 && <div className="card tl-good"><Check size={18} />A good day: everyone due today has been telepastored.</div>}
        {list.filter(x => x.done).length > 0 && (
          <section className="card fq-group tl-g done">
            <div className="card-h"><h2>Done today<em>{list.filter(x => x.done).length}</em></h2></div>
            <ul className="fq-list">{list.filter(x => x.done).map(r => <TeleRow key={r.p.id} r={r} meetings={meetings} />)}</ul>
          </section>
        )}
      </div>
      <aside className="aside even">
        <section>
          <h3>How your week works</h3>
          <ol className="tl-how">
            <li className={wd >= 1 && wd <= 3 ? 'now' : ''}><b>Monday to Wednesday</b><span>Birmingham. Reach them before Thursday, to confirm Bible study and the bus.</span></li>
            <li className={wd === 4 || wd === 5 ? 'now' : ''}><b>Thursday and Friday</b><span>Outside Birmingham. Reach them before Saturday, so they go to church on Sunday.</span></li>
            <li className={wd === 6 ? 'now' : ''}><b>Saturday</b><span>Wake-up calls: Birmingham for church today, everyone else for tomorrow.</span></li>
            <li className={wd === 0 ? 'now' : ''}><b>Sunday</b><span>Optional. Anyone you choose.</span></li>
          </ol>
        </section>
        <section>
          <h3>Invited this week</h3>
          <ul className="sl-places">
            {meetings.filter((x, i, a) => a.findIndex(y => y.type === x.type) === i).map(mt => <li key={mt.type}><span>{typeLabel(m, mt.type)}</span><b>{inv.filter(i => (i.meetingKey || '').startsWith(mt.type + ':')).length}</b></li>)}
            <li><span>Said they’ll come</span><b>{inv.filter(i => i.status === 'confirmed').length}</b></li>
            <li><span>Encouraged to go to church where they are</span><b>{inv.filter(i => i.kind === 'near').length}</b></li>
          </ul>
        </section>
        <section className="iv-fill">
          <h3>Reminders</h3>
          <p className="muted small" style={{ margin: '0 0 10px' }}>Monday to Saturday, while anyone is still to reach, “Time to telepastor” with a verse at each of these times. None on Sunday.</p>
          <div className="tl-times">{times.map(t => <span key={t}>{t}{times.length > 1 && <button type="button" onClick={() => setTimes(times.filter(x => x !== t))} aria-label={`Remove ${t}`}><X size={12} /></button>}</span>)}</div>
          <form className="tl-add" onSubmit={e => { e.preventDefault(); if (time && !times.includes(time)) { setTimes([...times, time]); setTime(''); } }}>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="Add a time" /><button type="submit" className="sm" disabled={!time}><Plus size={14} />Add a time</button>
          </form>
        </section>
      </aside>
    </div>
    <section className="card tl-weekcard">
      <div className="card-h"><h2>The week</h2><span className="tl-key"><span className="done">Reached</span><span className="wait">Retry booked</span><span className="late">Not reached</span><span className="later">To come</span></span></div>
      {misplaced > 0 && <div className="tl-fix"><span><b>{misplaced}</b> {misplaced === 1 ? 'person isn’t' : 'people aren’t'} on a day that meets their deadline: Birmingham Monday to Wednesday, everyone else Thursday or Friday.</span><button type="button" className="primary sm" onClick={() => { spreadCallDays(); toast('The week is arranged'); }}>Arrange the week</button></div>}
      <Board wk={wk} wd={wd} meetings={meetings} />
    </section>
    </>
  );
}

// The PVTI log: everything done for your sheep, by month
const PVTI_KIND = { P: 'prayer', V: 'visit', T: 'teaching', I: 'conversation' };
function PvtiLog() {
  const { m, today, pvci } = useM();
  const toast = useToast();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [letter, setLetter] = useState('');
  const [log, setLog] = useState({ id: 'P', personId: '' });
  const done = m.followUps.filter(f => f.status === 'completed' && (f.completedAt || '').startsWith(month) && (f.kind === 'prayer' || f.reached !== false));
  const counts = Object.fromEntries(PVTI.map(x => [x.id, done.filter(f => pvciOf(f.kind) === x.id).length]));
  const list = done.filter(f => !letter || pvciOf(f.kind) === letter).sort((a, b) => (b.completedAt + b.id).localeCompare(a.completedAt + a.id));
  const shift = (n) => { const d = new Date(month + '-15T12:00:00'); d.setMonth(d.getMonth() + n); setMonth(d.toISOString().slice(0, 7)); };
  const person = m.people.find(p => p.id === log.personId);
  const prayers = person && log.id === 'P' ? (person.prayer || []).filter(x => !x.answered) : [];
  return (
    <div className="cols">
      <div className="stack">
        <section className="card">
          <div className="card-h"><h2>{new Date(month + '-15T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2>
            <span className="cal-nav"><button className="ghost sm" onClick={() => shift(-1)}>‹ Earlier</button>{month < today.slice(0, 7) && <button className="ghost sm" onClick={() => shift(1)}>Later ›</button>}</span></div>
          <div className="pv-four pl-filter">{PVTI.map(x => (
            <button key={x.id} type="button" className={'pv-c pv' + x.id + (letter === x.id ? ' on' : '')} onClick={() => setLetter(letter === x.id ? '' : x.id)}><span className="pv-l">{x.id}</span><small>{x.label}</small><b>{counts[x.id]}</b></button>
          ))}</div>
          {list.length === 0 ? <Empty title="Nothing recorded for this month." /> : (
            <ul className="lb-ml">{list.map(f => (
              <li key={f.id}>
                <div className="jr-date"><b>{+f.completedAt.slice(8)}</b><small>{fmtDate(f.completedAt, { weekday: 'short' })}</small></div>
                <div className="jr-body"><p className="jr-what"><span className={'pd-cat pv-tag pv' + pvciOf(f.kind)}>{PVTI.find(x => x.id === pvciOf(f.kind)).label}</span>{kindLabel(f.kind)}{f.rota ? ' · rota' : ''}{f.tele ? ' · before a meeting' : ''}</p>
                  <b className="lb-mt"><a href={`#/poimaino/people/${f.personId}`}>{personName(m, f.personId, f.personName)}</a></b>{f.outcome && pvciOf(f.kind) !== 'T' && <p className="lb-take">{f.outcome}</p>}</div>
              </li>
            ))}</ul>
          )}
        </section>
      </div>
      <aside className="aside even">
        <section>
          <h3>Record one</h3>
          <div className="jw-kinds" role="group" aria-label="Which" style={{ flexWrap: 'wrap' }}>{PVTI.map(x => <button key={x.id} type="button" className={log.id === x.id ? 'on' : ''} onClick={() => setLog(l => ({ ...l, id: x.id }))}>{x.label}</button>)}</div>
          <div style={{ marginTop: 10 }}><PersonPicker m={m} value={log.personId} onChange={v => setLog(l => ({ ...l, personId: v }))} label="Who" allowNone={false} filter={p => !['departed', 'transferred'].includes(p.membership)} /></div>
          {prayers.length > 0 && <div className="pv-prayers"><small>Their open prayer requests</small><ul>{prayers.map(x => <li key={x.id}>{x.text}</li>)}</ul></div>}
          {log.id === 'T' && <p className="muted small" style={{ margin: '8px 0 0' }}>Only that it happened is recorded. Keep counselling details in the private notes on their page.</p>}
          <button type="button" className="primary sm" style={{ marginTop: 10 }} disabled={!log.personId} onClick={() => { pvci({ personId: log.personId, kind: PVTI_KIND[log.id], title: PVTI.find(x => x.id === log.id).label }); toast('Recorded'); setLog(l => ({ ...l, personId: '' })); }}>Save</button>
        </section>
        <section>
          <h3>Who you reached this month</h3>
          <p className="tp-big"><b>{new Set(done.map(f => f.personId).filter(Boolean)).size}</b> of {m.people.filter(isFlock).length} in your flock</p>
          {(() => { const missed = m.people.filter(isFlock).filter(p => !done.some(f => f.personId === p.id)); return missed.length ? <p className="muted small" style={{ margin: 0 }}>Not yet this month: {missed.slice(0, 8).map(p => p.name).join(', ')}{missed.length > 8 ? ` and ${missed.length - 8} more` : ''}.</p> : null; })()}
        </section>
      </aside>
    </div>
  );
}

// The Bacenta chat: a month of messages, ready-made starters, and what you shared
function Chat() {
  const { m, today, chatPlan, chatPost, chatDelete, settings } = useM();
  const toast = useToast();
  const plan = m.chatPlan || {};
  const posts = m.chatPosts || [];
  const [day, setDay] = useState(today);
  const [text, setText] = useState(plan[today] || '');
  const [newT, setNewT] = useState('');
  const pick = (d) => { chatPlan(day, text); setDay(d); setText(plan[d] || ''); };
  const y = +today.slice(0, 4), mo = +today.slice(5, 7) - 1;
  const n = new Date(y, mo + 1, 0).getDate();
  const lead = (new Date(y, mo, 1).getDay() + 6) % 7;
  const pad = (x) => String(x).padStart(2, '0');
  const cells = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => `${y}-${pad(mo + 1)}-${pad(i + 1)}`)];
  const thu = m.settings.times?.thu, sat = m.settings.times?.sat;
  const starters = [
    `Join us for Bible study this Thursday${thu ? ` at ${thu}` : ''}. Bring someone with you!`,
    `See you at church on Saturday${sat ? ` at ${sat}` : ''}. Let us know if you need a lift.`,
    'A verse for today: ',
    'Happy birthday! The Lord bless you and keep you.',
    'Thank you for coming today. What stayed with you?',
    ...(m.settings.chatTemplates || []),
  ];
  const shared = posts.filter(x => x.date.startsWith(today.slice(0, 7))).length;
  return (
    <div className="cols">
      <div className="stack">
        <section className="card">
          <div className="card-h"><h2>{new Date(today + 'T12:00:00').toLocaleDateString('en-GB', { month: 'long' })} in the chat</h2><span className="muted small">Shared on {new Set(posts.filter(x => x.date.startsWith(today.slice(0, 7))).map(x => x.date)).size} of {+today.slice(8)} days</span></div>
          <div className="ct-cal">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <b key={i}>{d}</b>)}
            {cells.map((d, i) => d ? (
              <button key={d} type="button" onClick={() => pick(d)} className={(d === day ? 'sel ' : '') + (d === today ? 'today ' : '') + (posts.some(x => x.date === d) ? 'posted' : d < today ? 'missed' : '')}>
                <span>{+d.slice(8)}</span>{plan[d] && <small>{plan[d].slice(0, 28)}</small>}
              </button>
            ) : <span key={'x' + i} />)}
          </div>
        </section>
        <section className="card">
          <div className="card-h"><h2>{day === today ? 'Today’s message' : `Message for ${fmtDate(day, { weekday: 'long', day: 'numeric', month: 'short' })}`}</h2>{posts.some(x => x.date === day) && <span className="pill good">Shared</span>}</div>
          <textarea value={text} onChange={e => setText(e.target.value)} onBlur={() => chatPlan(day, text)} style={{ minHeight: 110 }} placeholder="Write it here, or start from one below" aria-label="Message" />
          <div className="ct-starters">{starters.map((t, i) => <button key={i} type="button" onClick={() => setText(text ? `${text}\n${t}` : t)}>{t.length > 46 ? `${t.slice(0, 46)}…` : t}</button>)}</div>
          <div className="fr-foot">
            <button type="button" className="ghost sm" disabled={!text.trim()} onClick={() => { navigator.clipboard?.writeText(text); toast('Copied. Paste it in the chat; nothing is sent from here.'); }}><Copy size={14} />Copy</button>
            {day === today ? <button type="button" className="primary sm" onClick={() => { chatPlan(today, text); chatPost(text.trim()); toast('Recorded as shared today'); }}>I shared it</button>
              : <button type="button" className="primary sm" onClick={() => { chatPlan(day, text); toast('Saved for that day'); }}>Save for that day</button>}
          </div>
        </section>
      </div>
      <aside className="aside even">
        <section>
          <h3>This month</h3>
          <p className="tp-big"><b>{shared}</b> {shared === 1 ? 'message' : 'messages'} shared</p>
          <p className="muted small" style={{ margin: 0 }}>{Object.keys(plan).filter(d => d > today).length} planned ahead.</p>
        </section>
        <section>
          <h3>Your own starters</h3>
          <ul className="ct-mine">{(m.settings.chatTemplates || []).map((t, i) => <li key={i}><span>{t}</span><button type="button" className="ghost sm" onClick={() => settings({ chatTemplates: m.settings.chatTemplates.filter((_, j) => j !== i) })} aria-label="Remove"><X size={13} /></button></li>)}</ul>
          <form className="pp-add" onSubmit={e => { e.preventDefault(); if (newT.trim()) { settings({ chatTemplates: [...(m.settings.chatTemplates || []), newT.trim()] }); setNewT(''); } }}><input value={newT} onChange={e => setNewT(e.target.value)} placeholder="Prayer meeting tonight at 8" aria-label="New starter" /><button className="sm" type="submit"><Plus size={14} /></button></form>
        </section>
        <section>
          <h3>Shared lately</h3>
          {posts.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Nothing recorded yet.</p> : <ul className="ct-hist">{[...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(x => <li key={x.id}><small>{fmtDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}</small><span>{x.text || 'Shared'}</span><button type="button" className="ghost sm" onClick={() => chatDelete(x.id)} aria-label="Remove"><X size={13} /></button></li>)}</ul>}
        </section>
      </aside>
    </div>
  );
}

const TABS = [['', 'Queue'], ['telepastoring', 'Telepastoring'], ['visits', 'Visits'], ['pvti', 'PVTI log'], ['chat', 'Chat']];
export default function FollowUp({ sub }) {
  const { m } = useM();
  const t = TABS.some(([id]) => id === sub) ? sub : '';
  return (
    <>
      <Head eyebrow="Poimainō" step="Shepherding" title={{ '': 'Follow-up and care', telepastoring: 'Telepastoring', visits: 'Visits', pvti: 'PVTI log', chat: `${m.settings.name || 'Bacenta'} chat` }[t]}
        sub={{ '': 'One queue for every call, message, welcome, welfare check and visit, with what actually happened.', telepastoring: 'Everyone on your soul list, once a week, by call or message. Record whether they responded; if not, a retry is booked. Invite them as you go.', visits: 'Planned and completed visits.', pvti: 'Prayer, visitation, teaching and interaction: everything you did for your sheep, month by month.', chat: 'What to share in the Bacenta chat each day, and what you shared.' }[t]} />
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('poimaino', 'followup', ...(v ? [v] : []))} options={TABS} /></div>
      {t === '' && <Queue />}
      {t === 'visits' && <Queue visitsOnly />}
      {t === 'telepastoring' && <Telepastoring />}
      {t === 'pvti' && <PvtiLog />}
      {t === 'chat' && <Chat />}
    </>
  );
}
