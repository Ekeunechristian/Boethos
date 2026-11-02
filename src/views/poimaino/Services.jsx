import { useState } from 'react';
import { ArrowRight, Plus, Bus, Copy, Info, Check, HandHeart } from 'lucide-react';
import { meetingList, meetingState, STATE_LABEL, submitted, meetingStats, reflection, typeLabel, addDays, presenceIndex, blankPerson, duplicates, mondayOf, weekSummary, prepFor, attendanceWeeks, membershipLabel, isFlock } from '../../store/ministry';
import { MEETING_TYPES, REGISTERED, MINISTRY } from '../../data/ministry';
import { Head, Seg, TitleBlock, Empty, Picker, Bar, fmtDate, useToast } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useM, Label } from './common.jsx';
import { GaveLife } from './People.jsx';

const TONE = { scheduled: 'plain', unconfirmed: 'warn', held: 'warn', draft: 'warn', amending: 'warn', submitted: 'good', amended: 'good', cancelled: 'plain' };

const SHORT = { scheduled: 'Scheduled', unconfirmed: 'Was it held?', held: 'Take attendance', draft: 'Draft', amending: 'Amending', submitted: 'Submitted', amended: 'Amended', cancelled: 'Cancelled' };
const inDays = (d, today) => { const n = Math.round((new Date(d) - new Date(today)) / 86400000); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`; };

// The next meeting of each kind: when, who is invited, how ready people are
function NextCard({ type }) {
  const { m, today, now } = useM();
  const mt = meetingList(m, today, 1).find(x => x.type === type && x.date >= today && x.status !== 'cancelled' && !submitted(x));
  if (!mt) return <section className="card sv-next empty"><small>{typeLabel(m, type)}</small><b>No upcoming meeting</b></section>;
  const st = meetingState(m, mt, today, now);
  const pr = prepFor(m, today, type, now);
  const invited = m.invitations.filter(i => i.meetingKey === mt.key).length;
  const ser = type === 'thu' ? m.sermons.find(x => x.date === mt.date) : null;
  const time = m.settings.times?.[type];
  return (
    <a className={'card sv-next ' + type} href={`#/poimaino/services/${encodeURIComponent(mt.key)}`}>
      <div className="sv-next-h"><small>{typeLabel(m, type)}</small><span className={'sv-st ' + st}>{SHORT[st]}</span></div>
      <b className="sv-when">{mt.date === today ? 'Today' : fmtDate(mt.date, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
      <span className="sv-sub">{time ? `${time} · ` : ''}{inDays(mt.date, today)}</span>
      <div className="sv-prep">
        {pr && <div><span className="ch-bar"><i style={{ width: `${pr.total ? (pr.done / pr.total) * 100 : 0}%` }} /></span><em>{pr.done} of {pr.total} contacted or invited</em></div>}
        <span className="sv-chips"><span>{invited} invited</span>{type === 'thu' && <span className={ser ? 'ok' : 'due'}>{ser ? `Message: ${ser.title || 'untitled'}` : 'No message yet'}</span>}</span>
      </div>
      <span className="sv-open">{['held', 'draft', 'unconfirmed'].includes(st) ? 'Take attendance' : 'Prepare'}<ArrowRight size={14} /></span>
    </a>
  );
}

// Past meetings, a week to a row: Thursday beside Saturday
function List() {
  const { m, today, now, index } = useM();
  const past = meetingList(m, today, 12).filter(x => x.date < today || (x.date === today && meetingState(m, x, today, now) !== 'scheduled')).reverse();
  const weeks = [];
  past.forEach(mt => { const w = mondayOf(mt.date); let row = weeks.find(r => r.w === w); if (!row) { row = { w, items: {} }; weeks.push(row); } row.items[mt.type] = mt; });
  const cell = (mt, type) => {
    if (!mt) return <span className="sv-cell none">—</span>;
    const st = meetingState(m, mt, today, now);
    const sub = submitted(mt);
    const stats = sub && meetingStats(m, mt, sub, index);
    return (
      <a className={'sv-cell ' + st} href={`#/poimaino/services/${encodeURIComponent(mt.key)}`}>
        <span className="sv-d"><b>{fmtDate(mt.date, { day: 'numeric' })}</b><small>{fmtDate(mt.date, { month: 'short' })}</small></span>
        {stats ? <span className="sv-n"><b>{stats.total}</b><small>present{stats.firstTime.length ? ` · ${stats.firstTime.length} first ${stats.firstTime.length === 1 ? 'timer' : 'timers'}` : ''}</small></span>
          : <span className="sv-n"><em className={'sv-st ' + st}>{SHORT[st]}</em>{st === 'cancelled' && mt.cancelReason && <small>{mt.cancelReason}</small>}</span>}
        <ArrowRight size={15} className="sv-go" />
      </a>
    );
  };
  return (
    <section className="card sv-weeks">
      <div className="card-h"><h2>Past meetings</h2><span className="muted small">A week to a row</span></div>
      {weeks.length === 0 ? <Empty title="No meetings yet."><p style={{ margin: 0 }}>Once a meeting has started, it appears here to record.</p></Empty> : (
        <>
          <div className="sv-wh"><span /><b>{typeLabel(m, 'thu')}</b><b>{typeLabel(m, 'sat')}</b></div>
          <ul>{weeks.map(r => <li key={r.w}><span className="sv-wk">Week of<b>{fmtDate(r.w, { day: 'numeric', month: 'short' })}</b></span>{cell(r.items.thu, 'thu')}{cell(r.items.sat, 'sat')}</li>)}</ul>
        </>
      )}
    </section>
  );
}

function AddAttendee({ mtKey, present }) {
  const { m, today, addPerson, attend } = useM();
  const toast = useToast();
  const [pick, setPick] = useState('');
  const [name, setName] = useState('');
  const others = m.people.filter(p => !present.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name));
  const dups = name.trim() ? duplicates(m, null, { ...blankPerson(name, today), name }) : [];
  return (
    <div className="add-att">
      <div style={{ flex: '1 1 220px' }}><Picker label="Add someone" value={pick} onChange={(v) => { setPick(''); if (v) { attend(mtKey, v, 'present'); toast('Marked present'); } }} options={[{ value: '', label: 'Add someone already recorded…' }, ...others.map(p => ({ value: p.id, label: p.name, meta: p.membership }))]} /></div>
      <div className="add-new">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New visitor’s name" aria-label="New visitor’s name" />
        <button type="button" className="sm" disabled={!name.trim() || dups.length > 0} onClick={() => { const p = { ...blankPerson(name.trim(), today), membership: 'visitor', firstContact: today, outreach: 'First visit' }; addPerson(p, 'First visit'); attend(mtKey, p.id, 'present'); setName(''); toast(`${p.name} added as a visitor and marked present`); }}><Plus size={14} />Add visitor</button>
      </div>
      {dups.length > 0 && <p className="dup-warn small">Already recorded: {dups.map(d => <button key={d.id} type="button" className="linklike" onClick={() => { attend(mtKey, d.id, 'present'); setName(''); }}>{d.name}</button>)}. Mark them instead of creating a duplicate.</p>}
    </div>
  );
}

function Reflection({ mtKey }) {
  const { m, today } = useM();
  const r = reflection(m, mtKey, today);
  if (!r) return null;
  const ch = r.change;
  return (
    <section className="card pd-panel sv-ref">
      <div className="card-h"><h2>Reflection</h2><span className="muted small">Like with like, from reported meetings</span></div>
      <div className="sv-ref-n">
        <div><small>This time</small><b>{r.st.total}</b></div>
        <div><small>Last {typeLabel(m, r.mt.type).split(' ')[0]}</small><b>{r.pst ? r.pst.total : '—'}</b></div>
        <div><small>Change</small><b className={ch ? (ch.abs > 0 ? 'up' : ch.abs < 0 ? 'down' : '') : ''}>{ch ? `${ch.abs > 0 ? '+' : ch.abs < 0 ? '−' : ''}${Math.abs(ch.abs)}` : '—'}</b>{ch && ch.pct !== null && <em>{ch.pct > 0 ? '+' : ''}{ch.pct}%</em>}</div>
        <div><small>Recent average</small><b>{r.avg ?? '—'}</b>{r.recentN > 0 && <em>{r.recentN} {r.recentN === 1 ? 'meeting' : 'meetings'}</em>}</div>
      </div>
      {r.improved.length > 0 && <div className="sv-ref-g ok"><h4>What went well</h4><ul>{r.improved.map(x => <li key={x}>{x}</li>)}</ul></div>}
      {r.attention.length > 0 && <div className="sv-ref-g due"><h4>What needs attention</h4><ul>{r.attention.map(x => <li key={x}>{x}</li>)}</ul></div>}
      {r.steps.length > 0 && <div className="sv-ref-g"><h4>Next steps</h4><ol>{r.steps.map(x => <li key={x}>{x}</li>)}</ol></div>}
      <p className="sv-enc">{r.encouragement}</p>
      {r.history.length > 0 && <p className="muted small" style={{ margin: 0 }}>{r.history.join(' ')}</p>}
    </section>
  );
}

// The report for this meeting: a clean page to copy, and a record of who it went to
function Report({ mt, stats }) {
  const { m, delivery } = useM();
  const toast = useToast();
  const [to, setTo] = useState(m.settings.recipients[0] || '');
  const [channel, setChannel] = useState('WhatsApp');
  const s = submitted(mt);
  const lines = [`${m.settings.name || MINISTRY.name}: ${typeLabel(m, mt.type)}, ${fmtDate(mt.date, { weekday: 'long', day: 'numeric', month: 'long' })}`, `Present: ${stats.total}${stats.anonymous ? ` (including ${stats.anonymous} unnamed)` : ''}`,
    `First timers: ${stats.firstTime.length}. Second timers: ${stats.secondTime.length}.`, `Members present: ${stats.members.length}`, stats.transport ? `Picked up: ${stats.transport}` : ''].filter(Boolean);
  const sent = m.deliveries.filter(d => d.meetingKey === mt.key);
  return (
    <section className="card pd-panel">
      <div className="card-h"><h2>Report</h2><span className="muted small">Version {s.n}{mt.report.versions.length > 1 ? ` of ${mt.report.versions.length}` : ''} · figures only</span></div>
      <div className="wr-paper">{lines.map((l, i) => <p key={i} className={i === 0 ? 'h' : ''}>{l}</p>)}</div>
      <div className="sv-send">
        <button className="sm" onClick={() => { navigator.clipboard?.writeText(lines.join('\n')); toast('Copied. Nothing was sent.'); }}><Copy size={14} />Copy</button>
        <input value={to} onChange={e => setTo(e.target.value)} list="sv-recips" placeholder="Sent to" aria-label="Sent to" />
        <datalist id="sv-recips">{m.settings.recipients.map(r => <option key={r} value={r} />)}</datalist>
        <select value={channel} onChange={e => setChannel(e.target.value)} aria-label="By">{['WhatsApp', 'SMS', 'Email', 'In person'].map(c => <option key={c}>{c}</option>)}</select>
        <button className="primary sm" disabled={!to.trim()} onClick={() => { delivery({ meetingKey: mt.key, version: s.n, channel, recipient: to.trim() }); toast('Recorded as sent'); }}>I sent it</button>
      </div>
      {sent.length > 0 ? <ul className="wr-sent" style={{ marginTop: 10 }}>{sent.map(d => <li key={d.id}><Check size={13} />v{d.version} to {d.recipient} by {d.channel}, {fmtDate(d.at.slice(0, 10), { day: 'numeric', month: 'short' })}</li>)}</ul>
        : <p className="muted small" style={{ margin: '10px 0 0' }}>Not sent yet. Sending is up to you; this only records that you did.</p>}
    </section>
  );
}

// Before a meeting starts: who is invited, who still needs contacting, and (Thursday) the message
function Prepare({ mt }) {
  const { m, today, now, transport } = useM();
  const pr = prepFor(m, today, mt.type, now);
  const invited = m.invitations.filter(i => i.meetingKey === mt.key);
  const ser = mt.type === 'thu' ? m.sermons.find(x => x.date === mt.date) : null;
  const name = (id) => m.people.find(p => p.id === id)?.name || 'Someone';
  const lifts = Object.entries(mt.transport || {}).filter(([, t]) => t.needed).map(([id]) => id);
  return (
    <div className="pd-grid sv-prepare">
      <section className="card pd-panel">
        <div className="card-h"><h2>Getting people ready</h2><a href="#/poimaino/followup/telepastoring">Telepastoring<ArrowRight size={13} /></a></div>
        {pr ? <>
          <p className="tp-big"><b>{pr.done}</b> of {pr.total} contacted or invited since {fmtDate(pr.since, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <span className="ch-bar"><i style={{ width: `${pr.total ? (pr.done / pr.total) * 100 : 0}%` }} /></span>
          {pr.waiting.length > 0 ? <><h4 className="fs-h">Not contacted yet</h4><span className="v5-chips">{pr.waiting.map(p => <a key={p.id} href={`#/poimaino/people/${p.id}`}>{p.name}</a>)}</span></> : <p className="pd-clear small" style={{ marginTop: 10 }}>Everyone has been contacted.</p>}
        </> : <p className="muted">Nobody to prepare yet.</p>}
      </section>
      <section className="card pd-panel">
        <div className="card-h"><h2>Coming</h2><a href="#/poimaino/evangelism/invitations">Invite someone<ArrowRight size={13} /></a></div>
        <h4 className="fs-h" style={{ marginTop: 0 }}>Invited · {invited.length}</h4>
        {invited.length ? <span className="v5-chips">{invited.map(i => <a key={i.id} href={`#/poimaino/people/${i.personId}`}>{name(i.personId)}{i.status === 'confirmed' ? ' ✓' : ''}</a>)}</span> : <p className="muted small" style={{ margin: 0 }}>No one invited yet.</p>}
        {mt.type === 'sat' && <><h4 className="fs-h">Needs a lift · {lifts.length}</h4><p className="muted small" style={{ margin: '0 0 6px' }}>Tap a name to mark that they need picking up.</p><span className="sv-lifts">{m.people.filter(isFlock).sort((a, b) => a.name.localeCompare(b.name)).map(p => <button key={p.id} type="button" className={lifts.includes(p.id) ? 'on' : ''} aria-pressed={lifts.includes(p.id)} onClick={() => transport(mt.key, p.id, lifts.includes(p.id) ? null : { needed: true })}><Bus size={12} />{p.name}</button>)}</span></>}
        {mt.type === 'thu' && <div className="sv-msg"><small>The message</small>{ser ? <a href={`#/poimaino/sermons/${ser.id}`}><b>{ser.title || 'Untitled'}</b><ArrowRight size={14} /></a> : <a href="#/poimaino/sermons"><b>Plan Thursday’s message</b><ArrowRight size={14} /></a>}</div>}
      </section>
    </div>
  );
}

function MeetingPage({ mtKey }) {
  const { m, today, now, index, setMeeting, attend, transport, submit } = useM();
  const toast = useToast();
  const mt = meetingList(m, today, 26).find(x => x.key === mtKey) || (m.meetings[mtKey] ? { ...m.meetings[mtKey] } : null);
  const [cancelling, setCancelling] = useState(false);
  const [why, setWhy] = useState('');
  const [gave, setGave] = useState(null);
  if (!mt) return <div className="card"><Empty title="That meeting isn’t in the calendar." action={<a className="btn" href="#/poimaino/services">Back to services</a>} /></div>;
  const st = meetingState(m, mt, today, now);
  const s = submitted(mt);
  const editing = !s || mt.report.editing;
  const live = { entries: mt.entries || {}, anonymous: mt.anonymous || 0, transport: mt.transport || {} };
  const snap = editing ? live : s;
  const stats = meetingStats(m, mt, snap, index);
  const invited = m.invitations.filter(i => i.meetingKey === mt.key).map(i => i.personId);
  const recentVisitors = m.people.filter(p => ['visitor', 'returning'].includes(p.membership) && (index[p.id] || []).some(x => x.date >= addDays(today, -56)));
  const rosterIds = [...new Set([...m.people.filter(p => REGISTERED.includes(p.membership)).map(p => p.id), ...recentVisitors.map(p => p.id), ...invited, ...Object.keys(live.entries)])];
  const roster = rosterIds.map(id => m.people.find(p => p.id === id)).filter(Boolean).sort((a, b) => (REGISTERED.includes(b.membership) - REGISTERED.includes(a.membership)) || a.name.localeCompare(b.name));
  const future = st === 'scheduled';
  const isSat = mt.type === 'sat';
  const unmarked = roster.filter(p => !snap.entries[p.id]).length;
  const markAllMembers = () => { roster.filter(p => REGISTERED.includes(p.membership) && !live.entries[p.id]).forEach(p => attend(mt.key, p.id, 'present')); toast('Unmarked members marked present'); };
  return (
    <>
      <Head back={{ href: '#/poimaino/services', label: 'Services' }} eyebrow={typeLabel(m, mt.type)} step={STATE_LABEL[st]} title={fmtDate(mt.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        sub={MEETING_TYPES.find(t => t.id === mt.type)?.role + (m.settings.times?.[mt.type] ? ` · ${m.settings.times[mt.type]}` : ' · time not set')}>
        <div className="head-actions">
          {st === 'unconfirmed' && <button className="primary sm" onClick={() => { setMeeting(mt.key, { status: 'held' }); toast('Marked held'); }}>It was held</button>}
          {st !== 'cancelled' && !s && <button className="sm ghost" onClick={() => setCancelling(c => !c)}>Cancel meeting</button>}
          {st === 'cancelled' && <button className="sm" onClick={() => setMeeting(mt.key, { status: 'scheduled', cancelReason: '' })}>Restore</button>}
        </div>
      </Head>
      {cancelling && (
        <div className="card pa-form" style={{ marginBottom: 16 }}>
          <label>Reason<input value={why} onChange={e => setWhy(e.target.value)} placeholder="Public holiday; venue closed" /></label>
          <button className="primary sm" disabled={!why.trim()} onClick={() => { setMeeting(mt.key, { status: 'cancelled', cancelReason: why.trim() }); setCancelling(false); toast('Cancelled; reminders cleared'); }}>Cancel it</button>
        </div>
      )}
      {st === 'cancelled' ? <div className="card sv-cancel"><b>Cancelled{mt.cancelReason ? `: ${mt.cancelReason}` : ''}</b><p>It isn’t counted as zero attendance and has no report.</p></div>
        : future ? <>
          <div className="sv-countdown"><b>{inDays(mt.date, today)}</b><span>Attendance opens when the meeting begins{m.settings.times?.[mt.type] ? ` at ${m.settings.times[mt.type]}` : ''}. Until then, get people ready.</span></div>
          <Prepare mt={mt} />
        </> : (
        <div className="cols">
          <div className="stack">
            <section className="card sv-att">
              <div className="card-h"><h2>Attendance</h2><span className="muted small">{editing ? (s ? 'Amending: the submitted version stays in history' : 'Draft, not submitted') : 'Submitted'}</span></div>
              {editing && roster.some(p => REGISTERED.includes(p.membership) && !live.entries[p.id]) && <button type="button" className="sm sv-all" onClick={markAllMembers}>Mark all unmarked members present</button>}
              {roster.length === 0 && <p className="muted">No one on the roster yet. Add someone below, or add members in People.</p>}
              <ul className="sv-roster">{roster.map(p => {
                const v = snap.entries[p.id] || null;
                const t = snap.transport?.[p.id] || {};
                return (
                  <li key={p.id} className={v || ''}>
                    <a className="sv-who" href={`#/poimaino/people/${p.id}`}><span className={'pr-av m-' + p.membership}>{(p.name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span><span><b>{p.name}</b><small>{membershipLabel(p.membership)}{invited.includes(p.id) ? ' · invited' : ''}</small></span></a>
                    <div className="sv-marks" role="radiogroup" aria-label={`Attendance for ${p.name}`}>
                      {[['present', 'Present'], ['absent', 'Absent'], ['excused', 'Excused']].map(([val, lab]) => (
                        <button key={val} type="button" role="radio" aria-checked={v === val} disabled={!editing} className={v === val ? 'on ' + val : ''} onClick={() => attend(mt.key, p.id, v === val ? null : val)}>{lab}</button>
                      ))}
                    </div>
                    {isSat && <button type="button" className={'sv-bus' + (t.boarded ? ' on' : t.needed ? ' need' : '')} disabled={!editing} title="Transport: needs a lift → picked up → none. Separate from attendance."
                      onClick={() => transport(mt.key, p.id, t.boarded ? null : t.needed ? { boarded: true } : { needed: true })}><Bus size={14} />{t.boarded ? 'Picked up' : t.needed ? 'Needs lift' : 'Lift'}</button>}
                    {v === 'present' && (p.savedOn === mt.date ? <span className="sv-gave on" title="Gave their life at this meeting"><HandHeart size={14} />Gave their life</span>
                      : !p.savedOn && <button type="button" className="sv-gave" onClick={() => setGave(p)} title="They gave their life to Christ at this meeting"><HandHeart size={14} />Gave life</button>)}
                  </li>
                );
              })}</ul>
              {editing && <AddAttendee mtKey={mt.key} present={Object.keys(live.entries)} />}
              {editing && (
                <div className="anon">
                  <label htmlFor="anon">Unnamed attendees</label>
                  <input id="anon" type="number" min="0" value={live.anonymous} onChange={e => setMeeting(mt.key, { anonymous: Math.max(0, parseInt(e.target.value, 10) || 0), status: 'held', report: { ...(mt.report || { versions: [] }), state: s ? mt.report.state : 'draft', editing: !!s } })} />
                  <small>Counted in the total only; never as named visitors, members or converts.</small>
                </div>
              )}
            </section>
          </div>
          <aside className="aside even">
            <section>
              <h3>{editing ? 'Before you submit' : 'Submitted'}</h3>
              <div className="sv-total"><b>{stats.total}</b><span>present{stats.anonymous ? `, ${stats.anonymous} unnamed` : ''}</span></div>
              <ul className="sv-break">
                <li><span>Members</span><b>{stats.members.length}</b></li>
                <li className="gold"><span>First timers</span><b>{stats.firstTime.length}</b></li>
                <li className="gold"><span>Second timers</span><b>{stats.secondTime.length}</b></li>
                <li className="miss"><span>Absent</span><b>{stats.absent}</b></li>
                <li><span>Excused</span><b>{stats.excused}</b></li>
                <li className="muted-row"><span>Not marked</span><b>{unmarked}</b></li>
                {isSat && <li><span>Picked up</span><b>{stats.transport}</b></li>}
              </ul>
              <p className="muted small" style={{ margin: '8px 0 0' }}>Not marked is never counted as absent.</p>
              {editing && <button className="primary big" style={{ width: '100%', marginTop: 12 }} disabled={st === 'unconfirmed' && !Object.keys(live.entries).length && !live.anonymous}
                onClick={() => { submit(mt.key); toast(s ? 'Amendment submitted; earlier version kept' : 'Attendance submitted'); }}>{s ? 'Submit amendment' : stats.total === 0 ? 'Submit (zero present)' : 'Submit attendance'}</button>}
              {!editing && <button className="sm" style={{ marginTop: 12 }} onClick={() => setMeeting(mt.key, { report: { ...mt.report, editing: true } })}>Amend</button>}
            </section>
            {mt.report?.versions?.length > 0 && (
              <section>
                <h3>Versions</h3>
                <ul className="sv-vers">{[...mt.report.versions].reverse().map(v => <li key={v.n}><b>v{v.n}</b><span>{new Date(v.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span><em>{Object.values(v.entries).filter(x => x === 'present').length + (v.anonymous || 0)} present</em></li>)}</ul>
              </section>
            )}
          </aside>
        </div>
      )}
      {st !== 'cancelled' && !future && !editing && <div className="pd-grid"><Reflection mtKey={mt.key} /><Report mt={mt} stats={stats} /></div>}
      {gave && <GaveLife person={gave} where={{ date: mt.date, label: typeLabel(m, mt.type) }} onClose={() => setGave(null)} />}
    </>
  );
}

function Trends() {
  const { m, today, index } = useM();
  const weeks = attendanceWeeks(m, today, 10);
  const top = Math.max(1, ...weeks.flatMap(w => [w.thu || 0, w.sat || 0]));
  const topT = Math.max(1, ...weeks.map(w => w.first + w.second));
  const avg = (k) => { const v = weeks.map(w => w[k]).filter(x => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
  const best = (k) => weeks.filter(w => w[k] !== null).sort((a, b) => b[k] - a[k])[0];
  const windowDays = 28;
  const cohort = m.people.filter(p => { const f = (index[p.id] || [])[0]; return f && !REGISTERED.includes(p.membership) && f.date >= addDays(today, -84) && f.date <= addDays(today, -windowDays); });
  const returned = cohort.filter(p => { const l = index[p.id]; const f = l[0].date; return l.some(x => x.date > f && x.date <= addDays(f, windowDays)); });
  const waiting = m.people.filter(p => { const f = (index[p.id] || [])[0]; return f && !REGISTERED.includes(p.membership) && f.date > addDays(today, -windowDays); }).length;
  return (
    <>
      <section className="card">
        <div className="card-h"><h2>Attendance, ten weeks</h2><span className="pd-legend2" style={{ margin: 0 }}><span><i className="thu" />Thursday</span><span><i className="sat" />Saturday</span><span><i className="miss" />not submitted</span></span></div>
        <div className="pd-bars sv-bars" role="img" aria-label="Attendance for ten weeks">{weeks.map(w => (
          <div key={w.from} className={'pd-wk' + (w.from === mondayOf(today) ? ' now' : '')} title={`Week of ${fmtDate(w.from)}: Thursday ${w.thu ?? 'not submitted'}, Saturday ${w.sat ?? 'not submitted'}`}>
            <span className="pd-pair">{w.thu === null ? <i className="miss" /> : <i className="thu" style={{ height: `${Math.max(3, (w.thu / top) * 100)}%` }}><em>{w.thu}</em></i>}{w.sat === null ? <i className="miss" /> : <i className="sat" style={{ height: `${Math.max(3, (w.sat / top) * 100)}%` }}><em>{w.sat}</em></i>}</span>
            <small>{fmtDate(w.from, { day: 'numeric', month: 'short' })}</small>
          </div>
        ))}</div>
        <div className="pl-stats sv-avg">
          <div><b>{avg('thu') ?? '—'}</b><span>Thursday on average</span></div>
          <div><b>{best('thu')?.thu ?? '—'}</b><span>best Thursday{best('thu') ? `, ${fmtDate(best('thu').from, { day: 'numeric', month: 'short' })}` : ''}</span></div>
          <div><b>{avg('sat') ?? '—'}</b><span>Saturday on average</span></div>
          <div><b>{best('sat')?.sat ?? '—'}</b><span>best Saturday{best('sat') ? `, ${fmtDate(best('sat').from, { day: 'numeric', month: 'short' })}` : ''}</span></div>
        </div>
      </section>
      <div className="pd-grid">
        <section className="card pd-panel">
          <div className="card-h"><h2>First and second timers</h2><span className="pd-legend2" style={{ margin: 0 }}><span><i className="k-first" />First</span><span><i className="k-second" />Second</span></span></div>
          <div className="sv-tim" role="img" aria-label="First and second timers each week">{weeks.map(w => (
            <div key={w.from} title={`Week of ${fmtDate(w.from)}: ${w.first} first, ${w.second} second`}>
              <span className="sv-tim-s" style={{ height: `${((w.first + w.second) / topT) * 100}%` }}>{w.second > 0 && <i className="k-second" style={{ flex: w.second }} />}{w.first > 0 && <i className="k-first" style={{ flex: w.first }} />}</span>
              {(w.first + w.second) > 0 && <em>{w.first + w.second}</em>}
              <small>{fmtDate(w.from, { day: 'numeric', month: 'short' })}</small>
            </div>
          ))}</div>
          <div className="pl-stats"><div><b>{weeks.reduce((n, w) => n + w.first, 0)}</b><span>first timers in ten weeks</span></div><div><b>{weeks.reduce((n, w) => n + w.second, 0)}</b><span>came back a second time</span></div></div>
        </section>
        <section className="card pd-panel">
          <div className="card-h"><h2>Do first timers come back?</h2></div>
          {cohort.length ? <>
            <p className="tp-big"><b>{returned.length}</b> of {cohort.length} came back within four weeks</p>
            <div className="sv-funnel"><div style={{ width: '100%' }}><span>First visit</span><b>{cohort.length}</b></div><div style={{ width: `${Math.max(12, (returned.length / cohort.length) * 100)}%` }} className="back"><span>Came back</span><b>{returned.length}</b></div></div>
          </> : <p className="muted">Not enough history yet. This looks at first timers whose first visit was 4 to 12 weeks ago.</p>}
          <p className="muted small" style={{ margin: 'auto 0 0', paddingTop: 12 }}>Counts first timers whose first visit was 4–12 weeks ago, and whether they were present again within 28 days. {waiting ? `${waiting} newer ${waiting === 1 ? 'first timer is' : 'first timers are'} still inside their four weeks, so not counted yet.` : ''}</p>
        </section>
      </div>
    </>
  );
}

const TABS = [['', 'Meetings'], ['trends', 'Trends']];
// Meetings before this date that were never recorded are not asked about (recorded ones always stay)
function CountFrom() {
  const { m, settings } = useM();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <p className="sv-from2"><Info size={14} />Counting from {fmtDate(m.settings.meetingsFrom, { day: 'numeric', month: 'long', year: 'numeric' })}. Older meetings you never recorded don’t ask “Was it held?”.
      {open ? <input type="date" defaultValue={m.settings.meetingsFrom} onChange={e => { if (e.target.value) { settings({ meetingsFrom: e.target.value }); toast('Counting from ' + fmtDate(e.target.value)); setOpen(false); } }} aria-label="Count from" /> : <button type="button" className="linklike" onClick={() => setOpen(true)}>Change</button>}</p>
  );
}

export default function Services({ sub }) {
  const { m } = useM();
  if (sub && sub !== 'trends') return <MeetingPage mtKey={decodeURIComponent(sub)} />;
  const t = sub || '';
  return (
    <>
      <Head eyebrow="Poimainō" title="Services" sub={`Thursday is the ${m.settings.name || MINISTRY.name} Bible study you lead and preach. Saturday is the main church service. Each is reported on its own.`} />
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('poimaino', 'services', ...(v ? [v] : []))} options={TABS} /></div>
      {t === 'trends' ? <Trends /> : <><div className="pd-grid first sv-nexts"><NextCard type="thu" /><NextCard type="sat" /></div><List /><CountFrom /></>}
    </>
  );
}
