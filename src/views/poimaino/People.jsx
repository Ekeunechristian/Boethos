import { useState } from 'react';
import { Search, Plus, Phone, MessageCircle, CalendarPlus, Home, ArrowRight, Lock, Unlock, ChevronLeft, ChevronRight, GitMerge, Trash2, Info, Sprout, HeartHandshake, Check, Mail, HandHeart } from 'lucide-react';
import { MEMBERSHIP, CARE_STATUS, FOLLOW_KINDS, REGISTERED } from '../../data/ministry';
import { LEADERSHIP_STAGES } from '../../data/constants';
import { MENTORING } from '../../data/library';
import { stageLabel, membershipLabel, establishment, EST_STEPS, duplicates, blankPerson, typeLabel, addDays, needAttention, ATTENTION_LEVELS, AREAS, areaOf, inChurch, timerOf, meetingList } from '../../store/ministry';
import { Head, Seg, TitleBlock, Empty, Sheet, SheetHead, Picker, fmtDate, useToast } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useM, telHref, waHref } from './common.jsx';

const TONE = { contact: 'plain', visitor: 'now', returning: 'now', member: '', stable: 'good', transferred: 'plain', departed: 'plain' };

// Opening a phone link proves nothing; this asks what actually happened before recording anything.
export function CallButton({ person, purpose = 'Call', small }) {
  const { addFollow, today } = useM();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const href = telHref(person.phone);
  if (!href || person.declinedContact) return null;
  const record = (status, reached) => {
    const key = `call-${person.id}-${Date.now()}`;
    addFollow({ key, personId: person.id, kind: 'call', title: purpose, due: today, status, reached, completedAt: status === 'completed' ? today : '', attempts: [{ date: today, note: reached ? 'Reached' : 'No answer' }] });
    toast(reached ? 'Call recorded: reached' : 'Call recorded as an attempt (not reached)');
    setAsking(false);
  };
  return (
    <span className="call-wrap">
      <a className={'btn' + (small ? ' sm' : '')} href={href} onClick={() => setTimeout(() => setAsking(true), 300)}><Phone size={15} />Call</a>
      {asking && (
        <span className="call-ask">
          <span>Did the call happen?</span>
          <button className="sm primary" onClick={() => record('completed', true)}>Reached</button>
          <button className="sm" onClick={() => record('attempted', false)}>No answer</button>
          <button className="sm ghost" onClick={() => setAsking(false)}>Didn’t call</button>
        </span>
      )}
    </span>
  );
}

// A new convert's first steps: each one ticked goes into the follow-up queue with its date
const CONVERT_PLAN = [
  ['call', 'Call to welcome them into the faith', 1],
  ['visit', 'Visit them', 3],
  ['prayer', 'Pray for them by name', 0, 'weekly'],
  ['message', 'Send them a scripture to read', 2],
  ['invitation', 'Invite them to Thursday Bible study', 2],
];
export const convertPlan = (today) => CONVERT_PLAN.map(([kind, title, days, recurrence]) => ({ on: true, kind, title, due: addDays(today, days), recurrence: recurrence || '' }));

function PlanList({ plan, setPlan }) {
  const set = (i, k, v) => setPlan(plan.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="gl-plan">
      {plan.map((x, i) => (
        <label key={i} className={'gl-step' + (x.on ? ' on' : '')}>
          <input type="checkbox" checked={x.on} onChange={e => set(i, 'on', e.target.checked)} />
          <span className="gl-box"><Check size={13} /></span>
          <input className="gl-title" value={x.title} onChange={e => set(i, 'title', e.target.value)} aria-label="What" />
          <input type="date" value={x.due} onChange={e => set(i, 'due', e.target.value)} aria-label="When" />
        </label>
      ))}
      <button type="button" className="ghost sm" onClick={() => setPlan([...plan, { on: true, kind: 'call', title: '', due: plan[0]?.due || '' }])}><Plus size={14} />Another step</button>
    </div>
  );
}

// Someone gave their life: when and where, then their first steps, planned in one go
export function GaveLife({ person, onClose, where: where0 }) {
  const { m, today, updatePerson, addFollow } = useM();
  const toast = useToast();
  const recent = meetingList(m, today, 1).filter(x => x.date <= today && x.date >= addDays(today, -7) && x.status !== 'cancelled').reverse();
  const [date, setDate] = useState(where0?.date || today);
  const [where, setWhere] = useState(where0?.label || (recent[0] ? `${typeLabel(m, recent[0].type)}` : 'Evangelism'));
  const [plan, setPlan] = useState(() => convertPlan(where0?.date || today));
  const save = (e) => {
    e.preventDefault();
    const stage = person.stage === null || person.stage === undefined || person.stage < 1 ? { stage: 1 } : {};
    updatePerson(person.id, { savedOn: date, savedAt: where, tag: 'convert', ...stage }, `Gave their life (${where})`);
    plan.filter(x => x.on && x.title.trim()).forEach(x => addFollow({ personId: person.id, kind: x.kind, title: x.title.trim(), due: x.due, recurrence: x.recurrence, priority: x.kind === 'call' ? 'high' : 'normal', convert: true, ...(x.kind === 'visit' ? { place: 'Home' } : {}) }));
    toast(`${person.name.split(' ')[0]} gave their life. ${plan.filter(x => x.on).length} steps planned.`);
    onClose();
  };
  const places = [...new Set([...recent.map(x => typeLabel(m, x.type)), 'Evangelism', 'Telepastoring', 'Elsewhere'])];
  return (
    <Sheet onClose={onClose} className="wide" label="Gave their life">
      <SheetHead eyebrow={person.name} title="Gave their life to Christ" onClose={onClose} />
      <form onSubmit={save}>
        <p className="gl-verse">“Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.” <cite>2 Corinthians 5:17</cite></p>
        <div className="fields">
          <div className="field"><label htmlFor="gl-date">When</label><input id="gl-date" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} /></div>
          <div className="field"><label>Where</label><div className="pf-area" role="group" aria-label="Where">{places.map(x => <button key={x} type="button" className={where === x ? 'on' : ''} onClick={() => setWhere(x)}>{x.replace(' Bible Study', '').replace(' Church', '')}</button>)}</div></div>
        </div>
        <h3 className="gl-h">Their first steps</h3>
        <p className="muted small" style={{ marginTop: 0 }}>Each step you keep ticked goes into your follow-up queue on its date. Change the wording or dates as you like.</p>
        <PlanList plan={plan} setPlan={setPlan} />
        <div className="sheet-foot"><span className="grow" /><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="primary"><Check size={16} />Save and plan</button></div>
      </form>
    </Sheet>
  );
}

const TAGS = [['', 'None'], ['first', 'First timer'], ['second', 'Second timer'], ['convert', 'New convert']];

export function PersonForm({ initial, onClose, soul, onAdded }) {
  const { m, today, addPerson, updatePerson } = useM();
  const toast = useToast();
  const [f, setF] = useState(() => initial ? { ...initial } : { ...blankPerson('', today), membership: soul ? 'contact' : 'visitor' });
  const [ignoreDup, setIgnoreDup] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const dups = duplicates(m, initial, f);
  const save = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    if (dups.length && !ignoreDup && !initial) return;
    const { id, membershipHistory, stageHistory, outreachHistory, restricted, prayer, ...data } = f;
    if (initial) { updatePerson(initial.id, data); toast('Saved'); }
    else { addPerson({ ...data, id, stage: f.stage === '' ? null : f.stage }, 'Added'); toast(`${f.name} added`); onAdded && onAdded({ ...data, id }); }
    onClose();
  };
  return (
    <Sheet onClose={onClose} className="wide" label={initial ? 'Edit person' : 'Add person'}>
      <SheetHead eyebrow={initial ? 'Edit' : soul ? 'Soul list' : 'Has come to church'} title={initial ? initial.name : soul ? 'Add to your soul list' : 'Add someone'} onClose={onClose} />
      <form onSubmit={save}>
        <div className="fields">
          <div className="field wide"><label htmlFor="pf-name">Name *</label><input id="pf-name" value={f.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
          {dups.length > 0 && !initial && (
            <div className="field wide dup-warn">
              <b>Possibly already recorded:</b> {dups.map(d => <a key={d.id} href={`#/poimaino/people/${d.id}`}>{d.name}{d.phone ? ` (${d.phone})` : ''}</a>)}
              <label className="toggle" style={{ marginTop: 6 }}><input type="checkbox" checked={ignoreDup} onChange={e => setIgnoreDup(e.target.checked)} />This is a different person</label>
            </div>
          )}
          <div className="field"><label htmlFor="pf-phone">Phone (optional)</label><input id="pf-phone" value={f.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" /></div>
          <div className="field"><label htmlFor="pf-email">Email (optional)</label><input id="pf-email" value={f.email} onChange={e => set('email', e.target.value)} type="email" /></div>
          <div className="field"><label>Preferred contact</label><Picker label="Preferred contact" value={f.channel} onChange={v => set('channel', v)} options={['', 'Call', 'WhatsApp', 'SMS', 'Email', 'In person'].map(x => ({ value: x, label: x || 'Not stated' }))} /></div>
          <div className="field"><label htmlFor="pf-time">Best time</label><input id="pf-time" value={f.contactTime} onChange={e => set('contactTime', e.target.value)} placeholder="Evenings after 6" /></div>
          {!initial && <>
            <div className="field"><label>{soul ? 'Who they are' : 'Membership'}</label><Picker label="Membership" value={f.membership} onChange={v => set('membership', v)} options={MEMBERSHIP.filter(x => !['transferred', 'departed'].includes(x.id) && (soul || !['contact', 'prayer'].includes(x.id))).map(x => ({ value: x.id, label: x.label, meta: x.desc }))} /></div>
            {!['contact', 'prayer'].includes(f.membership) && <div className="field"><label>Discipleship stage</label><Picker label="Stage" value={f.stage === null || f.stage === undefined ? '' : String(f.stage)} onChange={v => set('stage', v === '' ? null : Number(v))} options={[{ value: '', label: 'Not assessed' }, ...m.settings.stages.map(s => ({ value: String(s.n), label: `${s.n} · ${s.label}${s.unresolved ? ' (unresolved)' : ''}` }))]} /></div>}
          </>}
          {!soul && <div className="field wide"><label>Tag</label>
            <div className="pf-area" role="group" aria-label="Tag">{TAGS.map(([v, l]) => <button key={v} type="button" className={(f.tag || '') === v ? 'on' : ''} onClick={() => set('tag', v)}>{l}</button>)}</div>
            {f.tag === 'convert' && !initial && <small className="pf-hint">After you add them, you’ll plan their first steps: a welcome call, a visit, prayer and more.</small>}
          </div>}
          <div className="field wide"><label>Where they live</label>
            <div className="pf-area" role="group" aria-label="Where they live">{AREAS.map(([v, l]) => <button key={v} type="button" className={areaOf(f) === v ? 'on' : ''} onClick={() => set('area', v)}>{l}</button>)}</div>
          </div>
          {areaOf(f) === 'abroad' && <div className="field"><label htmlFor="pf-country">Country</label><input id="pf-country" value={f.country || ''} onChange={e => set('country', e.target.value)} placeholder="Cameroon" /></div>}
          <div className="field"><label htmlFor="pf-loc">Town or area (optional)</label><input id="pf-loc" value={f.location || ''} onChange={e => set('location', e.target.value)} placeholder={areaOf(f) === 'bham' ? 'Selly Oak' : areaOf(f) === 'uk' ? 'Manchester' : 'Douala'} /></div>
          <div className="field"><label htmlFor="pf-first">First contact</label><input id="pf-first" type="date" value={f.firstContact} onChange={e => set('firstContact', e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-shep">Assigned shepherd</label><input id="pf-shep" value={f.shepherd} onChange={e => set('shepherd', e.target.value)} placeholder="You, or a helper" /></div>
          <div className="field"><label htmlFor="pf-fam">Household (optional)</label><input id="pf-fam" value={f.family} onChange={e => set('family', e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-occ">Occupation (optional)</label><input id="pf-occ" value={f.occupation} onChange={e => set('occupation', e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-bd">Birthday (optional)</label><input id="pf-bd" type="date" value={f.birthday || ''} onChange={e => set('birthday', e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-groups">Natural groups</label><input id="pf-groups" value={(f.groups || []).join(', ')} onChange={e => set('groups', e.target.value.split(',').map(x => x.trim()).filter(Boolean))} placeholder="Campus, estate, workplace…" /></div>
          <div className="field wide"><label htmlFor="pf-next">Next action</label><input id="pf-next" value={f.nextAction} onChange={e => set('nextAction', e.target.value)} placeholder="Invite to Thursday; call on Friday…" /></div>
          <div className="field wide"><label htmlFor="pf-notes">Contact notes (ordinary, not private)</label><textarea id="pf-notes" value={f.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight: 70 }} placeholder="How you met, what they’re interested in. Private pastoral notes go in the restricted section." /></div>
        </div>
        <div className="sheet-foot"><span className="grow" /><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="primary" disabled={!f.name.trim() || (dups.length > 0 && !ignoreDup && !initial)}>{initial ? 'Save' : soul ? 'Add to soul list' : 'Add person'}</button></div>
      </form>
    </Sheet>
  );
}

// A quick follow-up or visit for someone
export function FollowSheet({ person, kind = 'call', onClose, initial }) {
  const { m, today, addFollow, updateFollow } = useM();
  const toast = useToast();
  const [f, setF] = useState(() => initial || { kind, title: '', due: addDays(today, 1), time: '', priority: 'normal', recurrence: '', purpose: '', place: 'Home', prep: {}, campaignIds: [] });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = (e) => {
    e.preventDefault();
    if (initial) updateFollow(initial.id, f); else addFollow({ ...f, personId: person?.id || f.personId || '' });
    toast(f.kind === 'visit' ? 'Visit planned' : 'Follow-up planned'); onClose();
  };
  return (
    <Sheet onClose={onClose} className="wide" label="Follow-up">
      <SheetHead eyebrow={person ? person.name : 'Follow-up'} title={initial ? 'Edit' : f.kind === 'visit' ? 'Plan a visit' : 'Plan a follow-up'} onClose={onClose} />
      <form onSubmit={save}>
        <div className="fields">
          {!person && !initial && <div className="field wide"><label>Who</label><Picker label="Who" value={f.personId || ''} onChange={v => set('personId', v)} options={[{ value: '', label: 'Choose someone…' }, ...m.people.map(p => ({ value: p.id, label: p.name }))]} /></div>}
          <div className="field"><label>Kind</label><Picker label="Kind" value={f.kind} onChange={v => set('kind', v)} options={FOLLOW_KINDS.map(([v, l]) => ({ value: v, label: l }))} /></div>
          <div className="field"><label htmlFor="fs-due">Due</label><input id="fs-due" type="date" value={f.due} onChange={e => set('due', e.target.value)} /></div>
          <div className="field wide"><label htmlFor="fs-title">{f.kind === 'visit' ? 'Purpose' : 'What for'}</label><input id="fs-title" value={f.title} onChange={e => set('title', e.target.value)} placeholder={f.kind === 'visit' ? 'Get to know the family; pray about the job' : 'Welcome after first visit'} /></div>
          {f.kind === 'visit' && <>
            <div className="field"><label htmlFor="fs-time">Agreed time</label><input id="fs-time" type="time" value={f.time || ''} onChange={e => set('time', e.target.value)} /></div>
            <div className="field"><label>Agreed place</label><Picker label="Place" value={f.place} onChange={v => set('place', v)} options={['Home', 'Church', 'Café / public place', 'Workplace', 'Phone / video', 'Other agreed place'].map(x => ({ value: x, label: x }))} /></div>
          </>}
          <div className="field"><label>Priority</label><Picker label="Priority" value={f.priority} onChange={v => set('priority', v)} options={[{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} /></div>
          <div className="field"><label>Repeat</label><Picker label="Repeat" value={f.recurrence || ''} onChange={v => set('recurrence', v)} options={[{ value: '', label: 'Once' }, { value: 'weekly', label: 'Weekly' }, { value: 'fortnightly', label: 'Every two weeks' }, { value: 'monthly', label: 'Monthly' }]} /></div>
          <div className="field"><label htmlFor="fs-resp">Responsible</label><input id="fs-resp" value={f.responsible || ''} onChange={e => set('responsible', e.target.value)} placeholder="You" /></div>
        </div>
        <div className="sheet-foot"><span className="grow" /><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="primary" disabled={!person && !initial && !f.personId}>{initial ? 'Save' : 'Plan it'}</button></div>
      </form>
    </Sheet>
  );
}

const initials = (n) => (n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const LEVEL_LABEL = { critical: 'Critical', moderate: 'Moderate', low: 'Low' };

// One person in a list: who they are, where they are, and two quick actions
export function Row({ p, onFollow, sub, level, pill }) {
  const { m, index } = useM();
  const est = establishment(m, p, index);
  return (
    <li className={'pr-row' + (level ? ' lv-' + level : '')}>
      <a className="pr-main" href={`#/poimaino/people/${p.id}`}>
        <span className={'pr-av m-' + p.membership}>{initials(p.name)}</span>
        <span className="pr-t"><b>{p.name}</b><small>{sub || [p.stage === null || p.stage === undefined ? null : stageLabel(m, p.stage), est.label, p.nextAction && `next: ${p.nextAction}`].filter(Boolean).join(' · ')}</small></span>
        {level ? <span className={'pr-lv ' + level}>{LEVEL_LABEL[level]}</span> : pill || <span className={'pr-pill m-' + p.membership}>{membershipLabel(p.membership)}</span>}
        {!level && p.careStatus && ['Struggling', 'Crisis'].includes(p.careStatus) && <span className="pr-lv moderate">{p.careStatus}</span>}
      </a>
      <span className="pr-acts">
        {p.phone && !p.declinedContact ? <a className="pr-ic" href={telHref(p.phone)} aria-label={`Call ${p.name}`} title="Call"><Phone size={16} /></a> : <span className="pr-ic off" title={p.declinedContact ? 'Has declined contact' : 'No phone number'}><Phone size={16} /></span>}
        <button type="button" className="pr-ic" onClick={() => onFollow(p)} aria-label={`Plan follow-up with ${p.name}`} title="Plan a follow-up"><CalendarPlus size={16} /></button>
      </span>
    </li>
  );
}

// How someone shows on People: first and second timers by their visits, members by membership
export const isConvert = (p) => !!p.savedOn || p.tag === 'convert';
export function churchLabel(p, index) {
  if (isConvert(p) && !['member', 'stable'].includes(p.membership)) return ['New convert', 'convert'];
  const t = timerOf(p, index);
  if (t) return [t === 'first' ? 'First timer' : 'Second timer', 'visitor'];
  if (['contact', 'prayer'].includes(p.membership)) return ['Visitor', 'visitor'];
  return [membershipLabel(p.membership), p.membership];
}
const MEMB_FILTER = [['', 'Everyone'], ['member', 'Members'], ['stable', 'Stable'], ['first', 'First timers'], ['second', 'Second timers'], ['convert', 'New converts'], ['visitor', 'Visitors'], ['returning', 'Returning'], ['gone', 'Moved on']];
// Everyone: the people who have come to church at least once
export function List() {
  const { m, index } = useM();
  const [q, setQ] = useState('');
  const [ms, setMs] = useState('');
  const [adding, setAdding] = useState(false);
  const [follow, setFollow] = useState(null);
  const [convert, setConvert] = useState(null);
  const base = m.people.filter(p => inChurch(p, index));
  const gone = (p) => ['transferred', 'departed'].includes(p.membership);
  const inF = (p, f) => f === 'gone' ? gone(p) : gone(p) ? false
    : f === 'convert' ? isConvert(p)
    : f === 'first' || f === 'second' ? timerOf(p, index) === f
    : f === 'visitor' ? !['returning', 'member', 'stable'].includes(p.membership)
    : f ? p.membership === f : true;
  let list = base.filter(p => inF(p, ms));
  if (q) list = list.filter(p => `${p.name} ${p.family || ''} ${p.occupation || ''} ${(p.groups || []).join(' ')} ${p.notes || ''}`.toLowerCase().includes(q.toLowerCase()));
  list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  const live = base.filter(p => !gone(p));
  const n = (f) => base.filter(p => inF(p, f)).length;
  return (
    <>
      <div className="pr-bar">
        <div className="j-search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people, households, groups…" aria-label="Search people" /></div>
        <button className="primary" onClick={() => setAdding(true)}><Plus size={18} />Add person</button>
      </div>
      <div className="pr-chips" role="group" aria-label="Show">{MEMB_FILTER.map(([f, l]) => <button key={f} type="button" className={ms === f ? 'on' : ''} onClick={() => setMs(f)} disabled={!n(f) && f !== ''}>{l}<em>{n(f)}</em></button>)}</div>
      <div className="cols">
        <div className="stack">
          <ul className="pr-list card">
            {list.length === 0 && <li className="pr-empty"><Empty title={q || ms ? 'Nobody matches.' : 'No one yet.'}><p style={{ margin: 0 }}>Add someone after their first time at church. People you have only met on evangelism stay on your soul list until they come.</p></Empty></li>}
            {list.map(p => { const [l, c] = churchLabel(p, index); return <Row key={p.id} p={p} onFollow={setFollow} pill={<span className={'pr-pill m-' + c}>{l}</span>} />; })}
          </ul>
        </div>
        <aside className="aside even">
          <section>
            <h3>The way in</h3>
            <ol className="pw-path">{MEMBERSHIP.filter(x => ['visitor', 'returning', 'member', 'stable'].includes(x.id)).map(x => { const k = x.id === 'visitor' ? n('visitor') : live.filter(p => p.membership === x.id).length; return (
              <li key={x.id} className={(k ? '' : 'zero ') + 'm-' + x.id}>
                <span className="pw-dot" aria-hidden="true" />
                <div><span className="pw-h"><b>{x.id === 'visitor' ? 'Visitors' : x.label}</b><em>{k}</em></span>
                  <small>{x.id === 'visitor' ? `${n('first')} first ${n('first') === 1 ? 'timer' : 'timers'} and ${n('second')} second ${n('second') === 1 ? 'timer' : 'timers'} among them.` : x.desc}</small></div>
              </li>
            ); })}</ol>
          </section>
          <section className="pw-gone">
            <span><b>{m.people.filter(p => p.membership === 'transferred').length}</b> transferred</span><span><b>{m.people.filter(p => p.membership === 'departed').length}</b> departed</span>
            <small>Kept for history; out of every count.</small>
          </section>
          <section><p className="muted small" style={{ margin: 0 }}>Only people who have come to church at least once are here. Everyone you meet on evangelism, and anyone you pray for, is on your <a href="#/poimaino/evangelism/souls">soul list</a>.</p></section>
        </aside>
      </div>
      {adding && <PersonForm onClose={() => setAdding(false)} onAdded={(x) => x.tag === 'convert' && setConvert(x)} />}
      {follow && <FollowSheet person={follow} onClose={() => setFollow(null)} />}
      {convert && <GaveLife person={convert} onClose={() => setConvert(null)} />}
    </>
  );
}

function Attention() {
  const { m, today } = useM();
  const [follow, setFollow] = useState(null);
  const all = needAttention(m, today);
  return (
    <div className="cols">
      <div className="stack">
        {all.length === 0 ? <div className="card"><Empty title="Nobody needs attention right now."><p style={{ margin: 0 }}>When a member misses a meeting, is struggling, or hasn’t been contacted for three weeks, they appear here.</p></Empty></div>
          : ATTENTION_LEVELS.map(([lv, label]) => { const list = all.filter(x => x.level === lv); return list.length ? (
            <section key={lv} className={'card at-group lv-' + lv}>
              <div className="card-h"><h2><span className={'pr-lv ' + lv}>{label}</span> {list.length} {list.length === 1 ? 'person' : 'people'}</h2></div>
              <ul className="pr-list">{list.map(x => <Row key={x.p.id} p={x.p} onFollow={setFollow} level={lv} sub={<><span className="why">{x.why.join(' · ')}</span>{x.lastSeen ? ` · last at a meeting ${fmtDate(x.lastSeen, { day: 'numeric', month: 'short' })}` : ''}</>} />)}</ul>
            </section>
          ) : null; })}
      </div>
      <aside className="aside even">
        <section>
          <h3>At a glance</h3>
          <ul className="at-sum">{ATTENTION_LEVELS.map(([lv, label]) => <li key={lv} className={lv}><b>{all.filter(x => x.level === lv).length}</b><span>{label}</span></li>)}</ul>
        </section>
        <section>
          <h3>How the levels work</h3>
          <ol className="lv-scale">{[
            ['critical', 'Critical', 3, ['4+ meetings missed in a row', 'In crisis']],
            ['moderate', 'Moderate', 2, ['2–3 missed in a row', 'Struggling or inactive', 'Care review due', 'No contact for 6 weeks']],
            ['low', 'Low', 1, ['1 meeting missed', 'No contact for 3 weeks']],
          ].map(([k, l, n, rules]) => (
            <li key={k} className={k}>
              <span className="lv-meter" aria-hidden="true">{[1, 2, 3].map(i => <i key={i} className={i <= n ? 'on' : ''} />)}</span>
              <div><b>{l}</b><span className="lv-rules">{rules.map(r => <span key={r}>{r}</span>)}</span></div>
            </li>
          ))}</ol>
          <p className="lv-note"><Info size={14} />Missed means marked absent at a reported meeting; an unmarked meeting never counts against anyone. These are reasons to reach out, not judgements.</p>
        </section>
      </aside>
      {follow && <FollowSheet person={follow} onClose={() => setFollow(null)} />}
    </div>
  );
}

// Raising leaders: the people you are developing to serve and shepherd, stage by stage
function Leaders() {
  const { m, updatePerson } = useM();
  const toast = useToast();
  const [pick, setPick] = useState('');
  const leaders = m.people.filter(p => p.leader && !['transferred', 'departed'].includes(p.membership));
  const others = m.people.filter(p => !p.leader && REGISTERED.includes(p.membership)).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <section className="card ld-top">
        <div className="ld-why"><span className="ld-ic"><Sprout size={22} /></span><div><b>The few you are raising up</b><p>Not everyone: only those you are deliberately mentoring to serve and, one day, to shepherd others. You decide when someone moves on.</p></div></div>
        <div className="ld-add">
          <Picker label="Choose a member" value={pick} onChange={setPick} placeholder="Choose a member…" options={others.map(p => ({ value: p.id, label: p.name, meta: membershipLabel(p.membership) }))} />
          <button className="primary sm" disabled={!pick} onClick={() => { updatePerson(pick, { leader: { stage: 1, mentoring: 1, nextStep: '' } }); toast('Now mentoring'); setPick(''); }}><Plus size={14} />Start mentoring</button>
        </div>
      </section>

      <section className="card ld-pipe">
        <ol className="ld-track">{LEADERSHIP_STAGES.map(st => { const n = leaders.filter(p => (p.leader.stage || 1) === st.id).length; return (
          <li key={st.id} className={n ? 'has' : ''}><span className="ld-node">{st.id}</span><b>{st.label}</b><small>{st.desc}</small><em>{n ? `${n} ${n === 1 ? 'person' : 'people'}` : 'No one yet'}</em></li>
        ); })}</ol>
        <div className="ld-lanes">{LEADERSHIP_STAGES.map(st => { const here = leaders.filter(p => (p.leader.stage || 1) === st.id); return (
          <div key={st.id} className="ld-lane">{here.length === 0 ? <span className="ld-slot" /> : here.map(p => (
            <article key={p.id} className="ld-card">
              <a href={`#/poimaino/people/${p.id}`}><span className="pr-av m-member">{initials(p.name)}</span><b>{p.name}</b></a>
              <span className="ld-phase">{[1, 2, 3, 4].map(i => <i key={i} className={i <= (p.leader.mentoring || 1) ? 'on' : ''} />)}<small>{MENTORING[(p.leader.mentoring || 1) - 1]?.label}</small></span>
              <span className="ld-btns">
                <button type="button" className="ghost sm" disabled={st.id <= 1} onClick={() => updatePerson(p.id, { leader: { ...p.leader, stage: st.id - 1 } })} aria-label="Back a stage"><ChevronLeft size={14} /></button>
                <button type="button" className="ghost sm" disabled={(p.leader.mentoring || 1) >= 4} onClick={() => updatePerson(p.id, { leader: { ...p.leader, mentoring: (p.leader.mentoring || 1) + 1 } })}>Next phase</button>
                <button type="button" className="ghost sm" disabled={st.id >= 5} onClick={() => updatePerson(p.id, { leader: { ...p.leader, stage: st.id + 1 } })} aria-label="Advance a stage"><ChevronRight size={14} /></button>
              </span>
            </article>
          ))}</div>
        ); })}</div>
      </section>

      <section className="card ld-phases">
        <div className="card-h"><h2>How mentoring moves</h2><span className="muted small">Four phases with each person, at their pace</span></div>
        <ol>{MENTORING.map(x => <li key={x.id}><span>{x.id}</span><b>{x.label}</b><small>{x.desc}</small></li>)}</ol>
      </section>
    </>
  );
}

const CALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ago = (d, today) => { if (!d) return 'never'; const n = Math.round((new Date(today) - new Date(d)) / 86400000); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n < 31 ? `${n} days ago` : fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' }); };

// Where they are, as tiles you tap to change (each change keeps its dated history)
function Profile({ p }) {
  const { m, index, today, updatePerson } = useM();
  const toast = useToast();
  const [what, setWhat] = useState(null);
  const [val, setVal] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const open = (w, v) => { setWhat(what === w ? null : w); setVal(v === null || v === undefined ? '' : String(v)); setReason(''); setNotes(''); };
  const save = () => {
    if (what === 'membership') updatePerson(p.id, { membership: val }, reason);
    if (what === 'stage') updatePerson(p.id, { stage: val === '' ? null : Number(val) }, reason, notes);
    if (what === 'outreach') updatePerson(p.id, { outreach: val });
    if (what === 'care') updatePerson(p.id, { careStatus: val });
    if (what === 'callDay') updatePerson(p.id, { callDay: val === '' ? null : Number(val) });
    toast('Updated, with history kept'); setWhat(null);
  };
  const pres = index[p.id] || [];
  const visits = new Set(pres.map(x => x.date)).size;
  const lastSeen = pres[pres.length - 1]?.date;
  const tiles = [
    ['membership', 'Membership', membershipLabel(p.membership), p.membership],
    ['stage', 'Discipleship', p.stage === null || p.stage === undefined ? 'Not assessed' : `${p.stage} · ${m.settings.stages[p.stage]?.label || ''}`, p.stage],
    ['care', 'Care status', p.careStatus || '—', p.careStatus],
    ['outreach', 'Outreach', p.outreach || '—', p.outreach],
    ['callDay', 'Telepastoring', [0, 1, 2, 3, 4, 5, 6].includes(p.callDay) ? `${CALL_DAYS[p.callDay]}s` : 'No day yet', p.callDay],
  ];
  const hist = [...(p.membershipHistory || []).map(h => ({ ...h, k: 'Membership', f: membershipLabel(h.from), t: membershipLabel(h.to) })),
    ...(p.stageHistory || []).map(h => ({ ...h, k: 'Stage', f: stageLabel(m, h.from), t: stageLabel(m, h.to) })),
    ...(p.outreachHistory || []).map(h => ({ ...h, k: 'Outreach', f: h.from, t: h.to }))].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return (
    <section className="card pp-prof">
      <div className="pp-tiles">
        {tiles.map(([k, l, v]) => <button key={k} type="button" className={'pp-tile' + (what === k ? ' on' : '') + (k === 'membership' ? ' m-' + p.membership : '') + (k === 'care' && ['Struggling', 'Crisis'].includes(p.careStatus) ? ' warn' : '')} onClick={() => open(k, tiles.find(t => t[0] === k)[3])}><small>{l}</small><b>{v}</b></button>)}
        <div className="pp-tile ro"><small>At meetings</small><b>{visits ? `${visits} ${visits === 1 ? 'time' : 'times'}` : 'Not yet'}</b>{lastSeen && <em>last {fmtDate(lastSeen, { day: 'numeric', month: 'short' })}</em>}</div>
      </div>
      {what && (
        <div className="pp-edit">
          <div className="pp-edit-f">
            {what === 'membership' && <Picker label="Membership" value={val} onChange={setVal} options={MEMBERSHIP.map(x => ({ value: x.id, label: x.label, meta: x.desc }))} />}
            {what === 'stage' && <Picker label="Stage" value={val} onChange={setVal} options={[{ value: '', label: 'Not assessed' }, ...m.settings.stages.map(x => ({ value: String(x.n), label: `${x.n} · ${x.label}${x.unresolved ? ' (unresolved)' : ''}` }))]} />}
            {what === 'outreach' && <Picker label="Outreach" value={val} onChange={setVal} options={m.settings.outreachStatuses.map(x => ({ value: x, label: x }))} />}
            {what === 'care' && <Picker label="Care status" value={val} onChange={setVal} options={CARE_STATUS.map(x => ({ value: x, label: x }))} />}
            {what === 'callDay' && <Picker label="Telepastoring day" value={val} onChange={setVal} options={[{ value: '', label: 'Not on the rota' }, ...[1, 2, 3, 4, 5, 6, 0].map(d => ({ value: String(d), label: CALL_DAYS[d] }))]} />}
            {['membership', 'stage'].includes(what) && <input value={reason} onChange={e => setReason(e.target.value)} placeholder={what === 'membership' && val === 'stable' ? 'Reason (required): how they meet your review criteria' : 'Reason (optional)'} />}
            {what === 'stage' && <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />}
          </div>
          {what === 'membership' && val === 'stable' && <ul className="criteria-list">{m.settings.criteria.map(c => <li key={c}>{c}</li>)}</ul>}
          <div className="pp-edit-a"><button className="ghost sm" onClick={() => setWhat(null)}>Cancel</button><button className="primary sm" disabled={what === 'membership' && val === 'stable' && !reason.trim()} onClick={save}>Save</button></div>
        </div>
      )}
      {hist.length > 0 && <details className="pp-hist"><summary>History of changes · {hist.length}</summary>
        <ul>{hist.map((h, i) => <li key={i}><span>{h.date ? fmtDate(h.date, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span><b>{h.k}</b><em>{h.from === null || h.from === undefined ? '' : `${h.f} → `}{h.t}</em>{h.reason && <small>{h.reason}</small>}</li>)}</ul>
      </details>}
    </section>
  );
}

// Becoming established: a track, then the few notes that move them forward
function Established({ p }) {
  const { m, index, updatePerson } = useM();
  const est = establishment(m, p, index);
  const fields = [['nextAction', 'Next step', 'An invitation, a welcome friend, a question to answer'], ['circumstance', 'Their circumstance', 'Travelling until May; unwell but still stable'], ['intention', 'What they said about belonging', '“I want to be part of Greater Love”, said 12 March']];
  return (
    <section className="card pd-panel">
      <div className="card-h"><h2>Becoming established</h2><span className="muted small">{est.label}</span></div>
      <ol className="pp-track">{EST_STEPS.map((x, i) => <li key={x} className={i < est.step ? 'done' : i === est.step ? 'now' : ''}><span>{i < est.step ? <Check size={13} strokeWidth={3} /> : i + 1}</span><small>{x}</small></li>)}</ol>
      <div className="pp-next"><span className="pp-next-ic"><ArrowRight size={15} /></span><div><small>A good next move</small><b>{['Invite them to Thursday Bible study or Saturday church.', 'Welcome them within two days, and invite them back.', 'Give them a telepastoring day, and call before each meeting.', 'Keep visiting. When you are ready, review them for stable membership on Vision 25.', 'Keep them close: they hold a seat in Vision 25.'][est.step]}</b></div></div>
      <div className="pp-notes">{fields.map(([k, l, ph]) => (
        <label key={k}><span>{l}</span><input defaultValue={p[k] || ''} onBlur={e => e.target.value !== (p[k] || '') && updatePerson(p.id, { [k]: e.target.value })} placeholder={ph} /></label>
      ))}</div>
    </section>
  );
}

// How to reach them, and what they asked you to pray for
function ContactCard({ p }) {
  const { today, updatePerson, addPrayer, updatePrayer } = useM();
  const toast = useToast();
  const [pr, setPr] = useState('');
  const open = p.prayer.filter(x => !x.answered), answered = p.prayer.filter(x => x.answered);
  const ways = [
    p.phone && { ic: Phone, k: 'Phone', v: p.phone, href: !p.declinedContact && telHref(p.phone), act: 'Call' },
    p.email && { ic: Mail, k: 'Email', v: p.email, href: !p.declinedContact && `mailto:${p.email}`, act: 'Email' },
    { ic: MessageCircle, k: 'Prefers', v: [p.channel, p.contactTime].filter(Boolean).join(' · ') || 'Not stated yet' },
  ].filter(Boolean);
  const sw = (checked, onChange, label, sub) => (
    <label className="pc-sw"><span><b>{label}</b>{sub && <small>{sub}</small>}</span><input type="checkbox" role="switch" checked={checked} onChange={onChange} /><span className="sw" aria-hidden="true" /></label>
  );
  return (
    <section className="card pd-panel pc">
      <div className="card-h"><h2>Contact and prayer</h2>{p.declinedContact && <span className="pr-lv moderate">Declined contact</span>}</div>
      <ul className="pc-ways">{ways.map(w => (
        <li key={w.k}><span className="pc-ic"><w.ic size={16} /></span><span className="pc-v"><small>{w.k}</small><b>{w.v}</b></span>{w.href && <a className="btn sm ghost" href={w.href}>{w.act}</a>}</li>
      ))}</ul>
      <div className="pc-when">
        <div><small>Last contact</small><b className={!p.lastContact ? 'none' : ''}>{ago(p.lastContact, today)}</b></div>
        <div><small>First met</small><b>{p.firstContact ? fmtDate(p.firstContact, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</b></div>
      </div>
      <div className="pc-sws">
        {sw(!!p.consent?.whatsappGroup, e => updatePerson(p.id, { consent: { ...p.consent, whatsappGroup: e.target.checked ? today : '' } }), 'In the WhatsApp teaching group', p.consent?.whatsappGroup ? `Since ${fmtDate(p.consent.whatsappGroup, { day: 'numeric', month: 'short' })}, with their consent` : 'Only with their consent')}
        {sw(!!p.declinedContact, e => updatePerson(p.id, { declinedContact: e.target.checked }), 'Has declined contact', 'They won’t be called or messaged from Boēthos')}
      </div>
      <div className="pc-pray">
        <div className="pc-pray-h"><HandHeart size={16} /><b>Praying for</b>{open.length > 0 && <em>{open.length}</em>}</div>
        {open.length === 0 ? <p className="muted small" style={{ margin: '0 0 8px' }}>Nothing they’ve asked you to pray for yet.</p>
          : <ul>{open.map(x => <li key={x.id}><span>{x.text}</span><button type="button" className="ghost sm" onClick={() => { updatePrayer(p.id, x.id, { answered: true, answeredDate: today }); toast('Marked answered'); }}><Check size={13} />Answered</button></li>)}</ul>}
        <form className="pc-add" onSubmit={e => { e.preventDefault(); if (pr.trim()) { addPrayer(p.id, { text: pr.trim() }); setPr(''); toast('Saved'); } }}>
          <input value={pr} onChange={e => setPr(e.target.value)} placeholder="Add something they asked you to pray for" aria-label="Prayer request" />
          <button type="submit" disabled={!pr.trim()} aria-label="Add"><Plus size={16} /></button>
        </form>
        {answered.length > 0 && <p className="pc-ans"><Check size={13} />{answered.length} answered: {answered.slice(-3).map(x => x.text).join(' · ')}</p>}
      </div>
    </section>
  );
}

// Their story with you: meetings, encounters, invitations and care, by date
const TL_KIND = { Attended: 'ok', Absent: 'miss', Excused: 'plain', Encounter: 'gold', Invitation: 'gold' };
function Story({ p }) {
  const { m, index } = useM();
  const [all, setAll] = useState(false);
  const items = [
    ...(index[p.id] || []).map(x => ({ date: x.date, k: 'Attended', t: typeLabel(m, x.type) })),
    ...Object.values(m.meetings).filter(mt => mt.entries?.[p.id] && mt.entries[p.id] !== 'present').map(mt => ({ date: mt.date, k: mt.entries[p.id] === 'excused' ? 'Excused' : 'Absent', t: typeLabel(m, mt.type) })),
    ...m.encounters.filter(e => e.personId === p.id).map(e => ({ date: e.date, k: 'Encounter', t: [e.place, e.gospel && 'gospel conversation', e.invited && 'invited', e.profession && 'reported a profession of faith'].filter(Boolean).join(' · ') || 'Met' })),
    ...m.invitations.filter(i => i.personId === p.id).map(i => ({ date: i.date, k: 'Invitation', t: `to ${typeLabel(m, (i.meetingKey || '').split(':')[0] || i.type)}` })),
    ...m.followUps.filter(f => f.personId === p.id).map(f => ({ date: f.completedAt || f.due, k: FOLLOW_KINDS.find(([v]) => v === f.kind)?.[1] || f.kind, t: `${f.title || ''}${f.status !== 'completed' ? ` · ${f.status}` : f.reached === false ? ' · not reached' : ''}` })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const shown = all ? items : items.slice(0, 8);
  return (
    <section className="card pd-panel">
      <div className="card-h"><h2>Their story</h2><span className="muted small">{items.length} {items.length === 1 ? 'moment' : 'moments'}</span></div>
      {items.length === 0 ? <p className="muted" style={{ margin: 0 }}>Nothing recorded yet. Meetings, visits, calls and invitations will gather here.</p> : (
        <ol className="pp-story">{shown.map((x, i) => (
          <li key={i} className={TL_KIND[x.k] || ''}><span className="pp-dot" /><div><b>{x.k}</b>{x.t && <span>{x.t}</span>}</div><small>{x.date ? fmtDate(x.date, { day: 'numeric', month: 'short' }) : '—'}</small></li>
        ))}</ol>
      )}
      {items.length > 8 && <button type="button" className="ghost sm" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => setAll(!all)}>{all ? 'Show less' : `Show all ${items.length}`}</button>}
    </section>
  );
}

// Growing them: the development plan, and where they are in Raising leaders
function Growth({ p }) {
  const { updatePerson } = useM();
  const toast = useToast();
  const plan = p.plan || {};
  const L = [['teaching', 'Teaching'], ['mentoring', 'Mentoring'], ['scripture', 'Scripture study'], ['service', 'Serving'], ['leadership', 'Leadership'], ['resources', 'Messages and books']];
  const [d, setD] = useState(Object.fromEntries(L.map(([k]) => [k, plan[k] || ''])));
  const dirty = L.some(([k]) => d[k] !== (plan[k] || ''));
  const st = p.leader ? LEADERSHIP_STAGES[(p.leader.stage || 1) - 1] : null;
  return (
    <section className="card pd-panel">
      <div className="card-h"><h2>Growing them</h2><span className="muted small">Activity is not the same as maturity</span></div>
      <div className="pp-plan">{L.map(([k, l]) => <label key={k}><span>{l}</span><input value={d[k]} onChange={e => setD(x => ({ ...x, [k]: e.target.value }))} placeholder="—" /></label>)}</div>
      {dirty && <button className="primary sm" style={{ alignSelf: 'flex-start', marginTop: 10 }} onClick={() => { updatePerson(p.id, { plan: d }); toast('Plan saved'); }}>Save the plan</button>}
      <div className="pp-lead">
        {st ? <><span className="pp-lead-n">{p.leader.stage}</span><div><b>{st.label}</b><small>{MENTORING[(p.leader.mentoring || 1) - 1]?.label} · in Raising leaders</small></div><a className="btn sm ghost" href="#/poimaino/people/leaders">Open</a></>
          : <><div><b>Not being mentored</b><small>Start when you are ready to raise them up.</small></div><button className="sm" onClick={() => { updatePerson(p.id, { leader: { stage: 1, mentoring: 1, nextStep: '' } }); toast('Added to Raising leaders'); }}>Start mentoring</button></>}
      </div>
    </section>
  );
}

// Private: pastoral notes and care needs, behind a lock
function Restricted({ p }) {
  const { addRestricted, updateRestricted, deleteRestricted, today } = useM();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [care, setCare] = useState({ need: '', action: '', reviewDate: '' });
  const n = p.restricted.notes.length, c = p.restricted.care.filter(x => x.status !== 'Closed').length;
  return (
    <section className={'card pp-lock' + (open ? ' open' : '')}>
      <div className="pp-lock-h">
        <span className="pp-lock-ic">{open ? <Unlock size={20} /> : <Lock size={20} />}</span>
        <div><b>Private</b><small>{n} pastoral {n === 1 ? 'note' : 'notes'} · {c} open care {c === 1 ? 'need' : 'needs'}. Never in search, the dashboard, notifications, reports or shared figures.</small></div>
        <button type="button" className={open ? 'ghost sm' : 'sm'} onClick={() => setOpen(o => !o)}>{open ? 'Lock' : 'Unlock to view'}</button>
      </div>
      {open && <div className="pp-lock-b">
        <div>
          <h4>Pastoral notes</h4>
          <ul className="pp-rl">{p.restricted.notes.map(x => <li key={x.id}><small>{fmtDate(x.date, { day: 'numeric', month: 'short', year: 'numeric' })}</small><p>{x.text}</p><button className="ghost sm" onClick={() => deleteRestricted(p.id, 'notes', x.id)} aria-label="Remove"><Trash2 size={13} /></button></li>)}</ul>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="A private pastoral note" style={{ minHeight: 70 }} />
          <button className="sm" disabled={!note.trim()} onClick={() => { addRestricted(p.id, 'notes', { text: note.trim() }); setNote(''); toast('Note saved, privately'); }}>Add note</button>
        </div>
        <div>
          <h4>Care needs</h4>
          <ul className="pp-rl">{p.restricted.care.map(x => <li key={x.id} className={x.status === 'Closed' ? 'closed' : ''}><small>{x.reviewDate ? `review ${fmtDate(x.reviewDate, { day: 'numeric', month: 'short' })}` : fmtDate(x.date, { day: 'numeric', month: 'short' })}</small><p><b>{x.need}</b>{x.action ? ` · ${x.action}` : ''}</p>
            {x.status !== 'Closed' ? <button className="ghost sm" onClick={() => updateRestricted(p.id, 'care', x.id, { status: 'Closed' })}>Close</button> : <span className="muted small">Closed</span>}</li>)}</ul>
          <div className="pp-care-f">
            <input value={care.need} onChange={e => setCare(x => ({ ...x, need: e.target.value }))} placeholder="The need, as they shared it" />
            <input value={care.action} onChange={e => setCare(x => ({ ...x, action: e.target.value }))} placeholder="The care you agreed" />
            <label>Check back on <input type="date" value={care.reviewDate} min={today} onChange={e => setCare(x => ({ ...x, reviewDate: e.target.value }))} /></label>
          </div>
          <button className="sm" disabled={!care.need.trim()} onClick={() => { addRestricted(p.id, 'care', { ...care, status: 'Open' }); setCare({ need: '', action: '', reviewDate: '' }); toast('Care need saved, privately'); }}>Add care need</button>
        </div>
        <p className="muted small pp-lock-note">The app organises care; it never infers diagnoses, divine direction or spiritual verdicts. Refer to senior pastoral or professional help where it’s needed.</p>
      </div>}
    </section>
  );
}

function PersonPage({ id }) {
  const { m, index, updatePerson, deletePerson, merge } = useM();
  const toast = useToast();
  const p = m.people.find(x => x.id === id);
  const church = p && inChurch(p, index);
  const [edit, setEdit] = useState(false);
  const [follow, setFollow] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [gave, setGave] = useState(false);
  if (!p) return <div className="card"><Empty title="That person isn’t here." action={<a className="btn" href="#/poimaino/people">Back to people</a>} /></div>;
  const dups = duplicates(m, p);
  const msg = `Hi ${p.name.split(' ')[0]}, `;
  return (
    <>
      <Head back={church ? { href: '#/poimaino/people', label: 'People' } : { href: '#/poimaino/evangelism/souls', label: 'Soul list' }} eyebrow={church ? churchLabel(p, index)[0] : membershipLabel(p.membership)} step={stageLabel(m, p.stage)} title={p.name}
        sub={[p.family, p.occupation, p.channel && `prefers ${p.channel}${p.contactTime ? `, ${p.contactTime}` : ''}`, p.declinedContact && 'has declined contact'].filter(Boolean).join(' · ')}>
        <div className="head-actions">
          <CallButton person={p} small />
          {p.phone && !p.declinedContact && <a className="btn sm" href={waHref(p.phone, msg)} target="_blank" rel="noreferrer" title="Opens WhatsApp with a draft. Opening it doesn’t prove it was sent."><MessageCircle size={15} />Draft message</a>}
          <button className="sm" onClick={() => setFollow('call')}><CalendarPlus size={15} />Follow-up</button>
          <button className="sm" onClick={() => setFollow('visit')}><Home size={15} />Visit</button>
          {!p.savedOn && <button className="sm" onClick={() => setGave(true)}><HandHeart size={15} />Gave their life</button>}
          <button className="sm ghost" onClick={() => setEdit(true)}>Edit</button>
        </div>
      </Head>
      {p.savedOn && <div className="gl-banner"><HandHeart size={20} /><span><b>Gave their life to Christ</b> {fmtDate(p.savedOn, { weekday: 'long', day: 'numeric', month: 'long' })}{p.savedAt ? `, at ${p.savedAt}` : ''}.</span>
        {(n => n > 0 && <a href="#/poimaino/followup">{n} first {n === 1 ? 'step' : 'steps'} still to do</a>)(m.followUps.filter(f => f.personId === p.id && f.convert && ['planned', 'attempted'].includes(f.status)).length)}</div>}
      {gave && <GaveLife person={p} onClose={() => setGave(false)} />}
      <Profile p={p} />
      <div className="pd-grid"><Established p={p} /><ContactCard p={p} /></div>
      <div className="pd-grid"><Story p={p} /><Growth p={p} /></div>
      <Restricted p={p} />
      <section className="card pp-end">
        {dups.length > 0 && <div className="pp-end-row">
          <span className="pp-end-ic dup"><GitMerge size={18} /></span>
          <div><b>Possibly the same person</b><small>{dups.map(d => d.name).join(', ')}. Merging moves every record, meeting and note here.</small></div>
          <span className="pp-end-a">{dups.map(d => <button key={d.id} className="sm" onClick={() => { merge(p.id, d.id); toast(`Merged ${d.name} into ${p.name}; all history kept`); }}>Merge {d.name.split(' ')[0]}</button>)}</span>
        </div>}
        <div className="pp-end-row">
          <span className="pp-end-ic del"><Trash2 size={18} /></span>
          <div><b>Remove {p.name.split(' ')[0]}</b><small>For a correction or if they ask to be removed. Their personal records go; submitted meeting totals keep their counts.</small></div>
          <span className="pp-end-a">{confirmDel ? <><button className="ghost sm" onClick={() => setConfirmDel(false)}>Keep</button><button className="danger solid sm" onClick={() => { deletePerson(p.id); go('poimaino', 'people'); toast('Removed'); }}>Yes, remove for good</button></> : <button className="danger sm" onClick={() => setConfirmDel(true)}>Remove…</button>}</span>
        </div>
      </section>
      {edit && <PersonForm initial={p} onClose={() => setEdit(false)} />}
      {follow && <FollowSheet person={p} kind={follow} onClose={() => setFollow(null)} />}
    </>
  );
}

// Care: private care needs people have shared with you, by when to review them. Details stay on each person's page.
function CareList() {
  const { m, today } = useM();
  const rows = m.people.flatMap(p => (p.restricted.care || []).filter(c => c.status !== 'Closed').map(c => ({ p, c })));
  const groups = [
    ['Review due', rows.filter(x => x.c.reviewDate && x.c.reviewDate <= today), 'due'],
    ['Coming up', rows.filter(x => x.c.reviewDate && x.c.reviewDate > today), ''],
    ['No review date', rows.filter(x => !x.c.reviewDate), 'none'],
  ];
  const closed = m.people.reduce((n, p) => n + (p.restricted.care || []).filter(c => c.status === 'Closed').length, 0);
  return (
    <div className="cols">
      <div className="stack">
        {rows.length === 0 ? <div className="card"><Empty title="No open care needs."><p style={{ margin: 0 }}>When someone shares a need with you (a loss, an illness, a hard season), record it privately on their page with a review date. It appears here, by name and date only.</p></Empty></div>
          : groups.map(([label, list, k]) => list.length ? (
            <section key={label} className={'card cr-group ' + k}>
              <div className="card-h"><h2>{label}</h2><span className="muted small">{list.length}</span></div>
              <ul className="cr-list">{list.sort((a, b) => (a.c.reviewDate || '9').localeCompare(b.c.reviewDate || '9')).map(({ p, c }) => (
                <li key={c.id}><a href={`#/poimaino/people/${p.id}`}><span className="pr-av m-member">{initials(p.name)}</span><span className="pr-t"><b>{p.name}</b><small>{c.reviewDate ? `${c.reviewDate <= today ? 'Review was due' : 'Review on'} ${fmtDate(c.reviewDate, { weekday: 'short', day: 'numeric', month: 'short' })}` : 'Set a review date on their page'} · opened {fmtDate(c.date, { day: 'numeric', month: 'short' })}</small></span><Lock size={14} className="cr-lock" /></a></li>
              ))}</ul>
            </section>
          ) : null)}
      </div>
      <aside className="aside even">
        <section>
          <h3>What Care is</h3>
          <ul className="cr-what">
            <li><span className="cr-ic"><HeartHandshake size={18} /></span><div><b>What goes here</b><small>Needs people share with you in confidence, and the care you agreed: a visit after a bereavement, prayer through an illness, help finding work. Each has a date to check back in.</small></div></li>
            <li><span className="cr-ic lock"><Lock size={16} /></span><div><b>What stays private</b><small>What they shared stays in the locked section of their page. Only names and dates show here, and never in search, the dashboard, notifications or reports.</small></div></li>
          </ul>
        </section>
        <section>
          <h3>At a glance</h3>
          <div className="cr-stats"><span className={groups[0][1].length ? 'due' : ''}><b>{groups[0][1].length}</b>Review due</span><span><b>{rows.length}</b>Open</span><span><b>{closed}</b>Closed</span></div>
        </section>
      </aside>
    </div>
  );
}

const TABS = [['', 'Everyone'], ['attention', 'Needs attention'], ['leaders', 'Raising leaders'], ['care', 'Care']];
export default function People({ sub }) {
  const { m, index } = useM();
  const t0 = sub === 'workers' ? 'leaders' : sub;
  if (t0 && !TABS.some(([id]) => id === t0)) return <PersonPage id={t0} />;
  const t = t0 || '';
  const INTRO = { '': ['People', 'Everyone who has come to church at least once: members, first timers, second timers, visitors and returning.'], attention: ['Needs attention', 'Members who have been missing, are struggling, or haven’t heard from you. Reach out, most urgent first.'], leaders: ['Raising leaders', 'The few you are developing to serve and shepherd, stage by stage.'], care: ['Care', 'Needs shared with you in confidence, by when to check back in.'] }[t];
  return (
    <>
      <Head eyebrow="Poimainō" step={`${m.people.filter(p => inChurch(p, index) && !['transferred', 'departed'].includes(p.membership)).length} people`} title={INTRO[0]} sub={INTRO[1]} />
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('poimaino', 'people', ...(v ? [v] : []))} options={TABS} /></div>
      {t === '' && <List />}
      {t === 'attention' && <Attention />}
      {t === 'leaders' && <Leaders />}
      {t === 'care' && <CareList />}
    </>
  );
}
