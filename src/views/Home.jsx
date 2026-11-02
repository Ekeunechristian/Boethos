import { useState } from 'react';
import { LayoutDashboard, Activity as Activity_, Award, NotebookPen, BookText, HeartPulse, Sun, ArrowRight, Flame, Snowflake, Check, ChevronRight, Sunrise, HandHeart, BookOpen, GraduationCap, Library, BookMarked, Headphones, Leaf, Moon,
  Church, PhoneCall, Mic, Flag, Users, CalendarDays } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { todayKey, shiftDay, TITLES } from '../store/engine';
import { lifeToday, topicOf } from '../store/life';
import { localDay, localTime, vision, meetingList, submitted, meetingStats, mondayOf, typeLabel, weekSummary, dailyDone, dailyMet, DAILY } from '../store/ministry';
import { verseOfDay, SECTION_VERSES } from '../data/scripture';
import { Head, Seg, Verse, fmtDate } from '../lib/ui.jsx';
import { go } from '../lib/router';
import Mark from '../components/Mark.jsx';
import { Week, Achievements, Activity } from './Review.jsx';
import { Month, Health, Journal } from './ProgressMore.jsx';

const greeting = (t) => (t < '12:00' ? 'Good morning' : t < '17:00' ? 'Good afternoon' : 'Good evening');
const hm = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`; };

// Greek in gold Garamond, a small diamond, then the English in spaced capitals (as under Boēthos on the first run)
export function BrandLine({ greek, parts, tone = 'light' }) {
  return (
    <span className={'brandline ' + tone}>
      <i lang="grc">{greek}</i>
      {parts.map(p => <span key={p} className="bl-part"><span className="bl-orn" aria-hidden="true" /><span className="bl-en">{p}</span></span>)}
    </span>
  );
}

// A progress ring with its number in the middle
function Ring({ value, of, label, tone = 'olive', size = 140, segments = 0, ticks = [] }) {
  const r = 40, c = 2 * Math.PI * r, pct = of ? Math.min(1, value / of) : 0;
  const pt = (f, rad) => [52 + rad * Math.cos(2 * Math.PI * f - Math.PI / 2), 52 + rad * Math.sin(2 * Math.PI * f - Math.PI / 2)];
  const arc = (a, b) => { const [x1, y1] = pt(a, r), [x2, y2] = pt(b, r); return `M${x1} ${y1} A${r} ${r} 0 ${b - a > 0.5 ? 1 : 0} 1 ${x2} ${y2}`; };
  const gap = segments ? 0.032 : 0.012;
  return (
    <div className={'pring ' + tone} style={{ width: size, height: size }}>
      <svg viewBox="0 0 104 104" aria-hidden="true">
        {segments ? Array.from({ length: segments }, (_, k) => (
          <path key={k} d={arc(k / segments + gap, (k + 1) / segments - gap)} className={k < value ? 'rg-seg on' : 'rg-seg'} />
        )) : <>
          <circle cx="52" cy="52" r={r} className="rg-bg" />
          {pct > 0 && <path d={pct >= 1 ? arc(0, 0.9999) : arc(0, pct)} className="rg-fg" />}
          {ticks.filter(t => t > 0 && t < of).map(t => { const [x1, y1] = pt(t / of, r - 8), [x2, y2] = pt(t / of, r + 8); return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} className={t <= value ? 'rg-tick on' : 'rg-tick'} />; })}
        </>}
      </svg>
      <div className="rg-t"><b>{value}<small>/{of}</small></b><span>{label}</span></div>
    </div>
  );
}

// How far away a time is, in words: "in 40 min", "now", "since 05:15"
function whenFrom(time, now) {
  if (!time) return '';
  const m = (t) => { const [h, mm] = t.split(':').map(Number); return h * 60 + mm; };
  const d = m(time) - m(now);
  if (d > 0) return d < 60 ? `in ${d} min` : `in ${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60}` : ''}`;
  if (d > -45) return 'now';
  return 'waiting';
}
const ACTION = { quiet: 'Begin', prayer: 'Log prayer', bible: 'Read', study: 'Study', reading: 'Read', memory: 'Meditate', listen: 'Listen', fast: 'Open', examen: 'Close the day' };

const LIFE_ICON = { quiet: Sunrise, prayer: HandHeart, bible: BookOpen, study: GraduationCap, reading: Library, memory: BookMarked, listen: Headphones, fast: Leaf, examen: Moon };
const PM_ICON = { attendance: Church, followups: PhoneCall, sermon: Mic, campaigns: Flag };

// ── The two callings ──
function SectionCard({ id }) {
  const { state, sel } = useStore();
  const today = todayKey();
  const now = new Date().toTimeString().slice(0, 5);
  if (id === 'spoudazo') {
    const l = state.life;
    const items = lifeToday(state, today, now);
    const done = items.filter(x => x.done).length;
    const next = items.find(x => !x.done && !x.evening) || items.find(x => !x.done);
    const topic = topicOf(l, l.study.current);
    const notes = topic ? l.studyNotes.filter(n => n.topicId === topic.id).length : 0;
    const book = l.books.find(b => b.status === 'reading' && b.for !== 'members');
    const bookPct = book && Number(book.pages) ? Math.min(100, Math.round((Number(book.pagesRead) || 0) / Number(book.pages) * 100)) : null;
    const NextIcon = (next && LIFE_ICON[next.id]) || Check;
    return (
      <article className="sec-card2 spoudazo">
        <header className="sc2-h"><Mark kind="spoudazo" size={50} /><div><h2>Spoudazō</h2><Definition greek="σπουδάζω" meaning="to be diligent" purpose="Your own walk with God" /></div></header>
        <div className="sc3">
          <Ring value={done} of={items.length} segments={items.length} label="kept today" tone="brown" />
          <div className="sc3-body">
            {next ? (
              <div className="sc3-lead">
                <span className="sc3-ic"><NextIcon size={20} /></span>
                <div className="sc3-lt"><small>Next{next.time ? <> · {next.time}, <em>{whenFrom(next.time, now)}</em></> : ''}</small><b>{next.label}</b><span>{(next.sub || '').replace(/^\d\d:\d\d · /, '')}</span></div>
                <a className="btn sm sc3-act" href={next.href}>{ACTION[next.id] || 'Open'}<ArrowRight size={14} /></a>
              </div>
            ) : (
              <div className="sc3-lead done"><span className="sc3-ic"><Check size={20} /></span><div className="sc3-lt"><small>Today</small><b>Your rhythm is kept</b><span>Rest well, and come back tomorrow.</span></div></div>
            )}
            <div className="sc3-pair">
              <a className={'study-note' + (topic ? '' : ' empty')} href="#/word/study">
                <span className="sn-k"><GraduationCap size={15} />Studying</span>
                {topic ? <><b>{topic.title}</b><span className="sn-f"><strong>{notes}</strong> {notes === 1 ? 'note' : 'notes'} · since {fmtDate(l.study.since, { day: 'numeric', month: 'short' })}</span></>
                  : <><b>Choose a topic</b><span className="sn-f">One at a time, with your notes</span></>}
              </a>
              <a className={'book-mini' + (book ? '' : ' empty')} href="#/library">
                <span className="bm-cover" aria-hidden="true"><i />{book ? book.title.replace(/^The /, '').slice(0, 1) : '+'}</span>
                <span className="bm-t"><span className="sn-k"><Library size={15} />Reading</span>
                  <b>{book ? book.title : 'Choose a book'}</b>
                  {bookPct !== null ? <span className="bm-prog"><span className="sc3-track"><i style={{ width: `${bookPct}%` }} /></span>{bookPct}%</span> : <span className="sn-f">{book ? book.author : `${l.goals.booksPerMonth} a month`}</span>}</span>
              </a>
            </div>
          </div>
        </div>
        <a className="btn primary big sc2-go" href="#/today">Go to Spoudazō<ArrowRight size={18} /></a>
      </article>
    );
  }
  const m = state.ministry, tz = m.settings.timezone, d = localDay(tz);
  const next = meetingList(m, d, 0).find(x => x.date >= d && x.status !== 'cancelled' && !submitted(x));
  const days = next ? Math.round((new Date(next.date) - new Date(d)) / 86400000) : null;
  const expected = m.people.filter(p => ['member', 'stable'].includes(p.membership)).length;
  const pm = sel.poimaino || [];
  const first = pm[0];
  const FirstIcon = (first && PM_ICON[first.cat]) || Users;
  const vis = vision(m, d);
  const milestones = (vis.milestones || [3, 5, 10, 15, 20, 25]).filter(n => n <= 25);
  const nextMile = milestones.find(n => n > vis.stable) || 25;
  const prevMile = [0, ...milestones].filter(n => n <= vis.stable).pop() || 0;
  return (
    <article className="sec-card2 poimaino">
      <header className="sc2-h"><Mark kind="poimaino" size={50} /><div><h2>Poimainō</h2><Definition greek="ποιμαίνω" meaning="to shepherd" purpose={m.settings.name || 'Greater Love Bacenta'} /></div></header>
      <div className="sc3">
        <Ring value={vis.stable} of={25} ticks={milestones} label="stable" />
        <div className="sc3-body">
          {first ? (
            <div className={'sc3-lead' + (first.pri === 1 ? ' urgent' : '')}>
              <span className="sc3-ic"><FirstIcon size={20} /></span>
              <div className="sc3-lt"><small>Needs you{pm.length > 1 ? ` · 1 of ${pm.length}` : ''}</small><b>{first.title}</b><span>{first.why}</span></div>
              <a className="btn sm sc3-act" href={first.href}>Open<ArrowRight size={14} /></a>
            </div>
          ) : (
            <div className="sc3-lead done"><span className="sc3-ic"><Check size={20} /></span><div className="sc3-lt"><small>Needs you</small><b>All caught up</b><span>Nothing is waiting at {m.settings.name || 'your Bacenta'}.</span></div></div>
          )}
          <div className="sc3-pair">
            <a className={'cal-leaf' + (next ? '' : ' empty')} href={next ? `#/poimaino/services/${encodeURIComponent(next.key)}` : '#/poimaino/services'}>
              <span className="cl-page" aria-hidden="true"><small>{next ? fmtDate(next.date, { month: 'short' }) : '—'}</small><strong>{next ? fmtDate(next.date, { day: 'numeric' }) : '·'}</strong><small>{next ? fmtDate(next.date, { weekday: 'short' }) : ''}</small></span>
              <span className="bm-t"><span className="sn-k"><CalendarDays size={15} />Next meeting</span>
                <b>{next ? typeLabel(m, next.type) : 'None scheduled'}</b>
                <span className="sn-f">{next ? `${m.settings.times?.[next.type] ? `${m.settings.times[next.type]} · ` : ''}${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}${expected ? ` · ${expected} members` : ''}` : 'Set your meeting times'}</span></span>
            </a>
            <a className="vision-row2" href="#/poimaino/vision">
              <span className="sn-k"><Users size={15} />Vision 25</span>
              <b>{vis.stable >= 25 ? 'Vision reached' : `${Math.max(0, nextMile - vis.stable)} to the next milestone (${nextMile})`}</b>
              <span className="v25" aria-label={`${vis.stable} of 25 stable members`}>{Array.from({ length: 25 }, (_, k) => <i key={k} className={(k < vis.stable ? 'on' : '') + (milestones.includes(k + 1) ? ' mile' : '')} />)}</span>
            </a>
          </div>
        </div>
      </div>
      <a className="btn primary big sc2-go" href="#/poimaino">Go to Poimainō<ArrowRight size={18} /></a>
    </article>
  );
}

// The word, what it means, and what the section is for, set like a dictionary entry
function Definition({ greek, meaning, purpose }) {
  return (
    <div className="sc2-def">
      <p><i lang="grc">{greek}</i><span>“{meaning}”</span></p>
      <p className="sc2-purpose">{purpose}</p>
    </div>
  );
}

// ── Still to do today: Spoudazō as your day in order, Poimainō grouped by kind ──
const firstSentence = (t = '') => { const m = t.match(/^.*?[.!?](\s|$)/); return (m ? m[0] : t).trim(); };
const PM_GROUP = { attendance: 'Meetings', followups: 'People', sermon: 'Thursday sermon', campaigns: 'Campaigns' };

function DayRow({ x, l, today, upNext, now }) {
  const Icon = LIFE_ICON[x.id] || Check;
  const waiting = x.time && !x.done && x.time < now;
  return (
    <li className={'t3-row' + (x.done ? ' done' : '') + (upNext ? ' upnext' : '') + (waiting ? ' waiting' : '')}>
      {upNext && <span className="t3-flag">Up next</span>}
      <span className="t3-time">{x.time || ''}{waiting && <em>waiting</em>}</span>
      <span className="t3-dot" aria-hidden="true">{x.done && <Check size={11} strokeWidth={3} />}</span>
      <a className="t3-main" href={x.href}>
        <b><Icon size={15} />{x.label}</b>
        <small>{(x.sub || '').replace(/^\d\d:\d\d · /, '')}</small>
        {x.id === 'prayer' && x.times?.length > 0 && (
          <span className="t3-pt">{x.times.map(t => <span key={t} className={l.prayerTimes[today]?.[t] ? 'on' : ''}>{l.prayerTimes[today]?.[t] && <Check size={10} strokeWidth={3} />}{t}</span>)}</span>
        )}
      </a>
      {!x.done && <a className="t3-act" href={x.href}>{ACTION[x.id] || 'Open'}<ArrowRight size={13} /></a>}
    </li>
  );
}

// Your day as a line from rising to rest: each set time a mark (filled once kept), and where you are now
export function DayRibbon({ l, items, today, now }) {
  const g = l.goals;
  const mins = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
  const start = mins(g.wake || '05:00'), end = Math.max(start + 60, mins(g.reminders?.bedtime || '22:00'));
  const pos = (t) => Math.max(0, Math.min(100, ((mins(t) - start) / (end - start)) * 100));
  const done = (id) => items.find(x => x.id === id)?.done;
  const marks = [
    g.quietTime && { t: g.quietTime, label: 'Quiet time', on: done('quiet') },
    ...(g.prayerTimes || []).map(t => ({ t, label: `Prayer ${t}`, on: !!l.prayerTimes[today]?.[t] })),
    g.studyTime && { t: g.studyTime, label: 'Bible study', on: done('study') },
  ].filter(Boolean).sort((a, b) => a.t.localeCompare(b.t));
  const n = mins(now), left = Math.max(0, end - n);
  const hm2 = (m) => `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ''}`;
  return (
    <div className="ribbon" aria-label="Your day">
      <div className="rb-top"><span>{g.wake || '05:00'}</span><b>{n >= end ? 'Your day is done. Rest.' : n < start ? 'Your day has not begun' : `${hm2(left)} left today`}</b><span>22:00</span></div>
      <div className="rb-line">
        <i className="rb-past" style={{ width: `${pos(now)}%` }} />
        {(() => { let lastD = -99, lastM = -99; return marks.map((mk, k) => {
          const p = pos(mk.t);
          const d = p - lastD >= 6, mo = p - lastM >= 16;
          if (d) lastD = p; if (mo) lastM = p;
          return <span key={k} className={'rb-mark' + (mk.on ? ' on' : mins(mk.t) < n ? ' missed' : '') + (d ? '' : ' nolabel') + (mo ? '' : ' nolabel-m')} style={{ left: `${p}%` }} title={`${mk.label} · ${mk.t}${mk.on ? ' · kept' : ''}`}><em>{mk.t}</em></span>;
        }); })()}
        {n > start && n < end && <span className="rb-now" style={{ left: `${pos(now)}%` }}><em>now</em></span>}
      </div>
    </div>
  );
}

function TodayBoth() {
  const { state, sel } = useStore();
  const today = todayKey();
  const now = new Date().toTimeString().slice(0, 5);
  const l = state.life;
  const items = lifeToday(state, today, now);
  const left = items.filter(x => !x.done), kept = items.filter(x => x.done);
  const pm = sel.poimaino || [];
  const due = sel.due.filter(d => d.id !== 'poimaino');
  const total = items.length + pm.length;
  // Spoudazō: by part of the day
  const groups = [
    ['Morning', left.filter(x => !x.evening && x.time && x.time < '12:00')],
    ['Afternoon', left.filter(x => !x.evening && x.time && x.time >= '12:00' && x.time < '17:00')],
    ['Evening', left.filter(x => !x.evening && x.time && x.time >= '17:00')],
    ['Any time today', left.filter(x => !x.evening && !x.time)],
    ['Before you sleep', left.filter(x => x.evening)],
  ].filter(([, list]) => list.length);
  // Poimainō: by kind, with the repeated meeting checks folded into one line
  const confirm = pm.filter(a => a.key.startsWith('mt-confirm:'));
  const rest = pm.filter(a => !a.key.startsWith('mt-confirm:') && !/^(daily-|calls:)/.test(a.key));
  const dd = dailyDone(state.ministry, today);
  const dailyLeft = DAILY.filter(x => !dailyMet(dd, x.id));
  const pmGroups = Object.keys(PM_GROUP).map(cat => [cat, rest.filter(a => a.cat === cat)]).filter(([, list]) => list.length);
  const upNextId = (groups[0]?.[1] || [])[0]?.id;
  const late = (a) => (a.due && a.due < today ? Math.round((new Date(today) - new Date(a.due)) / 86400000) : 0);
  return (
    <section className="card today3">
      <header className="t3-h">
        <div><h2>Still to do today</h2><p>{left.length + pm.length ? <><b>{left.length + pm.length}</b> left · <b>{kept.length}</b> of {items.length} disciplines kept</> : 'Everything is done. Rest well.'}</p></div>
      </header>
      <DayRibbon l={l} items={items} today={today} now={now} />
      <div className="t3-cols">
        <div className="t3-col spoudazo">
          <div className="t3-colh"><Mark kind="spoudazo" size={24} /><b>Spoudazō</b><span>{left.length} left</span><a href="#/today">Today<ArrowRight size={13} /></a></div>
          {groups.length === 0 ? <p className="t3-done"><Check size={17} />Your rhythm is kept for today.</p> : groups.map(([g, list]) => (
            <section key={g} className="t3-g"><h4>{g}</h4><ul className={list.some(x => x.time) ? 'timed' : 'untimed'}>{list.map(x => <DayRow key={x.id} x={x} l={l} today={today} now={now} upNext={x.id === upNextId} />)}</ul></section>
          ))}
          {kept.length > 0 && <p className="t3-kept"><Check size={13} strokeWidth={3} />Kept today: {kept.map(x => x.label.replace(/^Study: .*/, 'Study').replace(/^Read: .*/, 'Reading')).join(', ')}</p>}
          {due.length > 0 && <div className="t3-notes">{due.map(d => <a key={d.id} href={d.href}><b>{d.label}</b><span>{firstSentence(d.sub)}</span></a>)}</div>}
        </div>
        <div className="t3-col poimaino">
          <div className="t3-colh"><Mark kind="poimaino" size={24} /><b>Poimainō</b><span>{rest.length + confirm.length + dailyLeft.length} waiting</span><a href="#/poimaino">Dashboard<ArrowRight size={13} /></a></div>
          <section className="t3-g"><h4>Today’s shepherding · {DAILY.length - dailyLeft.length} of {DAILY.length}</h4>
            <div className="t3-daily">{DAILY.map(x => { const ok = dailyMet(dd, x.id); return <a key={x.id} href={x.href} className={ok ? 'ok' : ''} title={x.label}><i>{ok ? <Check size={12} strokeWidth={3} /> : x.short}</i><span>{x.label.split(',')[0].replace('Pray', 'PVTI').replace('Share in the Bacenta chat', 'Chat')}</span></a>; })}</div>
          </section>
          {rest.length + confirm.length === 0 ? <p className="t3-done"><Check size={17} />Nothing waiting at {state.ministry.settings.name || 'your Bacenta'}.</p> : <>
            {confirm.length > 0 && (
              <section className="t3-g"><h4>Meetings to confirm</h4>
                <div className="t3-confirm">
                  <Church size={16} />
                  <div><b>Were {confirm.length === 1 ? 'this meeting' : `these ${confirm.length} meetings`} held?</b><small>Until you say, each counts as missing, not zero.</small>
                    <span className="t3-chips">{confirm.map(a => { const [type, date] = a.key.split(':').slice(1); return <a key={a.key} href={a.href}>{type === 'thu' ? 'Thu' : type === 'sat' ? 'Sat' : type} {fmtDate(date, { day: 'numeric', month: 'short' })}</a>; })}</span></div>
                </div>
              </section>
            )}
            {pmGroups.map(([cat, list]) => {
              const Icon = PM_ICON[cat] || Users;
              return (
                <section key={cat} className="t3-g"><h4>{PM_GROUP[cat]}</h4><ul>{list.slice(0, 5).map(a => (
                  <li key={a.key} className={'t3-row pm' + (a.pri === 1 ? ' urgent' : '')}>
                    <span className="t3-time">{late(a) ? <em>{late(a)} {late(a) === 1 ? 'day' : 'days'} late</em> : a.due === today ? 'today' : ''}</span>
                    <span className="t3-dot" aria-hidden="true" />
                    <a className="t3-main" href={a.href}><b><Icon size={15} />{a.title}</b><small>{firstSentence(a.why)}</small></a>
                    <a className="t3-act" href={a.href}>Open<ArrowRight size={13} /></a>
                  </li>))}</ul></section>
              );
            })}
          </>}
        </div>
      </div>
    </section>
  );
}

// ── Faithfulness: the streak, the last four weeks, XP and level ──
function StreakCard() {
  const { state, sel } = useStore();
  const today = todayKey();
  const goal = state.dailyXpGoal || 50;
  const nextTitle = TITLES.find(([n]) => n > sel.level.level);
  // four weeks, Monday to Sunday, ending with this week
  const start = shiftDay(mondayOf(today), -21);
  const cal = Array.from({ length: 28 }, (_, k) => { const d = shiftDay(start, k); return { d, on: sel.streak.active.has(d), frozen: (state.frozenDays || []).includes(d), future: d > today, today: d === today }; });
  const active28 = cal.filter(c => c.on && !c.future).length;
  const past28 = cal.filter(c => !c.future).length;
  const xpIn = (from, to) => state.events.filter(e => e.date >= from && e.date <= to).reduce((n, e) => n + (e.xp || 0), 0);
  const mon = mondayOf(today);
  const thisWk = xpIn(mon, today), lastWk = xpIn(shiftDay(mon, -7), shiftDay(today, -7));
  const diff = thisWk - lastWk;
  const r = 22, c = 2 * Math.PI * r, p = Math.min(1, sel.xpToday / goal);
  return (
    <section className="card faith">
      <header className="fa-h"><h3><Flame size={19} className="fa-hic" />Faithfulness</h3><span>Gal 6:9 · “in due season we shall reap, if we faint not”</span></header>
      <div className="fa-top">
        <div className={'fa-streak' + (sel.streak.activeToday ? ' lit' : '')}>
          <span className="fa-flame"><Flame size={26} /></span>
          <div><b>{sel.streak.current}</b><span>{sel.streak.current === 1 ? 'day' : 'days'} in a row</span>
            <small>{sel.streak.activeToday ? 'Kept today.' : sel.streak.current ? 'Do any one thing today to keep it.' : 'Begin today with your quiet time.'}</small></div>
        </div>
        <div className="fa-today" title={`${sel.xpToday} of ${goal} XP today`}>
          <svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r={r} className="fr-bg" /><circle cx="28" cy="28" r={r} className="fr-fg" strokeDasharray={c} strokeDashoffset={c * (1 - p)} /></svg>
          <span><b>{sel.xpToday}</b><small>of {goal} XP</small></span>
        </div>
      </div>
      <div className="fa-cal" aria-label={`Active on ${active28} of the last ${past28} days`}>
        <div className="fa-cal-h">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x, k) => <span key={k}>{x}</span>)}</div>
        <div className="fa-cal-g">{cal.map(x => <i key={x.d} className={(x.on ? 'on' : '') + (x.frozen ? ' frozen' : '') + (x.future ? ' future' : '') + (x.today ? ' today' : '')} title={fmtDate(x.d, { weekday: 'long', day: 'numeric', month: 'short' })}>{fmtDate(x.d, { day: 'numeric' })}</i>)}</div>
        <p>Active on <b>{active28}</b> of the last {past28} days</p>
      </div>
      <dl className="fa-list">
        <div><dt>This week</dt><dd><b>{thisWk} XP</b><small>{lastWk || thisWk ? (diff > 0 ? `${diff} more than this time last week` : diff < 0 ? `${-diff} fewer than this time last week` : 'the same as this time last week') : 'nothing yet'}</small></dd></div>
        <div><dt>Longest run</dt><dd><b>{sel.streak.longest} {sel.streak.longest === 1 ? 'day' : 'days'}</b></dd></div>
        <div><dt>Freezes</dt><dd><b>{state.streakFreezes} of 2</b><small>each covers one missed day; you earn one every 7 days in a row</small></dd></div>
      </dl>
      <div className="fa-level">
        <div><b>Level {sel.level.level}</b><span>{sel.level.title}</span><em>{sel.level.span - sel.level.into} XP to level {sel.level.level + 1}{nextTitle ? ` · ${nextTitle[1]} at level ${nextTitle[0]}` : ''}</em></div>
        <span className="st-bar big"><i style={{ width: `${sel.level.pct}%` }} /></span>
      </div>
    </section>
  );
}

// ── This week at the Bacenta: the two services, then the work between them ──
function BacentaWeek() {
  const { state } = useStore();
  const m = state.ministry, tz = m.settings.timezone, d = localDay(tz);
  const mon = mondayOf(d);
  const wk = weekSummary(m, mon), last = weekSummary(m, shiftDay(mon, -7));
  const g = m.settings.weeklyGoals || { contacts: 5, visits: 2, outreach: 3 };
  const svc = (type) => {
    const date = shiftDay(mon, type === 'thu' ? 3 : 5);
    const mt = meetingList(m, d, 2).find(x => x.key === `${type}:${date}`);
    const prev = meetingList(m, d, 3).find(x => x.key === `${type}:${shiftDay(date, -7)}`);
    const st = mt && submitted(mt) && mt.status !== 'cancelled' ? meetingStats(m, mt, submitted(mt)) : null;
    const pst = prev && submitted(prev) && prev.status !== 'cancelled' ? meetingStats(m, prev, submitted(prev)) : null;
    const state_ = mt?.status === 'cancelled' ? 'Cancelled' : st ? null : date > d ? `${fmtDate(date, { weekday: 'short', day: 'numeric' })}` : 'Not reported yet';
    return { date, mt, st, pst, label: state_ };
  };
  const thu = svc('thu'), sat = svc('sat');
  const dueWk = m.followUps.filter(f => f.kind !== 'prayer' && f.due && f.due >= mon && f.due <= shiftDay(mon, 6));
  const doneWk = dueWk.filter(f => f.status === 'completed').length;
  const vis = vision(m, d);
  const Tile = ({ name, x }) => (
    <a className="bw2-svc" href={x.mt ? `#/poimaino/services/${encodeURIComponent(x.mt.key)}` : '#/poimaino/services'}>
      <small>{name}<em>{fmtDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}</em></small>
      {x.st ? <><b>{x.st.total}<i> present</i></b><span>{x.pst ? (x.st.total - x.pst.total > 0 ? `${x.st.total - x.pst.total} more than last week` : x.st.total - x.pst.total < 0 ? `${x.pst.total - x.st.total} fewer than last week` : 'same as last week') : 'first report'}{x.st.firstTime.length ? ` · ${x.st.firstTime.length} first ${x.st.firstTime.length === 1 ? 'timer' : 'timers'}` : ''}</span></>
        : <><strong className="bw2-state">{x.mt?.status === 'cancelled' ? 'Cancelled' : x.date > d ? 'Coming up' : 'Not reported yet'}</strong><span>{x.date > d ? (m.settings.times?.[x.date === thu.date ? 'thu' : 'sat'] ? `at ${m.settings.times[x.date === thu.date ? 'thu' : 'sat']}` : '') : 'Open it to take attendance'}</span></>}
    </a>
  );
  const rows = [
    ['First timers', wk.firstTime, null, `${wk.secondTime} second ${wk.secondTime === 1 ? 'timer' : 'timers'}`],
    ['Follow-ups', doneWk, dueWk.length, dueWk.length ? 'done of those due' : 'none due'],
    ['Contacts made', wk.completed, g.contacts, 'calls, messages, visits'],
    ['Visits', wk.visitsDone, g.visits, ''],
    ['Outreach', wk.encounters, g.outreach, wk.reachedOutreach ? `${wk.reachedOutreach} people` : ''],
  ];
  return (
    <section className="card bw2">
      <header className="fa-h"><h3><Mark kind="poimaino" size={20} />This week at {m.settings.name || 'your Bacenta'}</h3><span>Prov 27:23 · “Be thou diligent to know the state of thy flocks”</span></header>
      <div className="bw2-svcs"><Tile name="Thursday Bible study" x={thu} /><Tile name="Saturday church" x={sat} /></div>
      <ul className="bw2-rows">{rows.map(([k, v, goal, note]) => (
        <li key={k}><span className="bw2-k">{k}</span>
          <span className="bw2-v"><b>{v}{goal ? <small> / {goal}</small> : null}</b>{note && <em>{note}</em>}</span>
          {goal ? <span className="bw2-bar"><i style={{ width: `${Math.min(100, (v / goal) * 100)}%` }} /></span> : <span />}
        </li>))}
        <li><span className="bw2-k">Stable members</span><span className="bw2-v"><b>{vis.stable}<small> / 25</small></b></span>
          <span className="bw2-bar"><i style={{ width: `${Math.min(100, (vis.stable / 25) * 100)}%` }} /></span></li>
      </ul>
      <a className="bw-link" href="#/poimaino/week">Write the weekly review<ArrowRight size={13} /></a>
    </section>
  );
}

// ── Your week with God: both callings, day by day, against your goals ──
function WeekWithGod() {
  const { state, sel } = useStore();
  const [offset, setOffset] = useState(0);
  const l = state.life, g = l.goals, m = state.ministry;
  const wg = m.settings.weeklyGoals || { contacts: 5, visits: 2, outreach: 3 };
  const today = todayKey();
  const monday = shiftDay(mondayOf(today), offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(monday, i));
  const elapsed = days.filter(d => d <= today);
  const sum = (list, k, d) => list.filter(x => x.date === d).reduce((n, x) => n + (Number(x[k]) || 0), 0);
  const ch = (d) => l.bible.filter(b => b.date === d).reduce((n, b) => n + Math.max(0, (Number(b.to) || Number(b.from)) - Number(b.from) + 1), 0);
  const dow = (d) => new Date(d + 'T12:00:00Z').getUTCDay();
  const fastDay = (d) => (g.fastDays || []).includes(dow(d)) || l.fasts.some(f => f.date === d && f.status !== 'broken');
  // Poimainō helpers for this week
  const thuDate = days[3], satDate = days[5];
  const sermon = m.sermons.find(x => x.date === thuDate);
  const meeting = (type, date) => m.meetings[`${type}:${date}`];
  const reported = (type, date) => { const mt = meeting(type, date); return mt && mt.status !== 'cancelled' && submitted(mt) ? 1 : 0; };
  const prepBy = (d) => Object.values(sermon?.stagesDone || {}).filter(x => x && x <= d).length;
  const satCalls = m.followUps.filter(f => f.key && f.key.startsWith(`pre-sat:${satDate}-`));
  const doneOn = (d, pred) => m.followUps.filter(f => f.status === 'completed' && f.reached !== false && f.completedAt === d && pred(f)).length;
  const own = [
    { id: 'quiet', Icon: Sunrise, label: 'Quiet time', goalText: `${hm(g.quietMinutes)} each morning`, tone: 'brown', val: d => (l.quietTimes.some(q => q.date === d) ? 1 : 0), goal: () => 1, fmt: (v, gl) => `${v} of ${gl} mornings` },
    { id: 'prayer', Icon: HandHeart, label: 'Prayer', goalText: `${hm(g.prayerMinutes)} a day`, tone: 'olive', val: d => sum(state.prayerSessions, 'duration', d), goal: () => g.prayerMinutes, fmt: (v, gl) => `${hm(v)} of ${hm(gl)}` },
    { id: 'bible', Icon: BookOpen, label: 'Bible', goalText: `${g.chaptersPerDay} chapters a day`, tone: 'olive', val: ch, goal: () => g.chaptersPerDay, fmt: (v, gl) => `${v} of ${gl} chapters` },
    { id: 'study', Icon: GraduationCap, label: 'Study', goalText: `${hm(g.studyMinutes)} a day`, tone: 'blue', val: d => sum(l.studyNotes, 'minutes', d), goal: () => g.studyMinutes, fmt: (v, gl) => `${hm(v)} of ${hm(gl)}` },
    g.readingMinutes > 0 && { id: 'reading', Icon: Library, label: 'Reading', goalText: `${hm(g.readingMinutes)} a day`, tone: 'brown', val: d => sum(l.readingLog, 'minutes', d), goal: () => g.readingMinutes, fmt: (v, gl) => `${hm(v)} of ${hm(gl)}` },
    days.some(fastDay) && { id: 'fast', Icon: Leaf, label: 'Fasting', goalText: 'on your fast days', tone: 'brown', val: d => (l.fasts.some(f => f.date === d && f.status === 'done') ? 1 : 0), goal: (d) => (fastDay(d) ? 1 : 0), fmt: (v, gl) => `${v} of ${gl} fasts` },
  ].filter(Boolean);
  const PREP = { 1: 1, 2: 2, 3: 4 }; // stages expected by Monday, Tuesday, Wednesday
  const flock = [
    { id: 'thu', Icon: Mic, label: 'Thursday Bible study', goalText: 'prepare, then hold and report', tone: 'olive',
      val: (d, i) => (i < 3 ? Math.min(prepBy(d), PREP[i + 1]) : i === 3 ? reported('thu', d) : 0), goal: (d, i) => (i < 3 ? (sermon ? PREP[i + 1] : 0) : i === 3 ? 1 : 0),
      fmt: () => `${sermon ? `${Object.keys(sermon.stagesDone || {}).length} prep stages` : 'no sermon yet'} · ${reported('thu', thuDate) ? 'reported' : 'not reported'}` },
    { id: 'sat', Icon: Church, label: 'Saturday church', goalText: 'Friday calls, then report', tone: 'olive',
      val: (d, i) => (i === 4 ? satCalls.filter(f => f.status === 'completed').length : i === 5 ? reported('sat', d) : 0), goal: (d, i) => (i === 4 ? satCalls.length : i === 5 ? 1 : 0),
      fmt: () => `${satCalls.length ? `${satCalls.filter(f => f.status === 'completed').length} of ${satCalls.length} calls` : 'no calls planned'} · ${reported('sat', satDate) ? 'reported' : 'not reported'}` },
    { id: 'contacts', weekly: wg.contacts, Icon: PhoneCall, label: 'Contacts', goalText: `${wg.contacts} a week`, tone: 'olive', val: d => doneOn(d, f => f.kind !== 'prayer'), fmt: (v, gl) => `${v} of ${gl}` },
    { id: 'visits', weekly: wg.visits, Icon: Users, label: 'Visits', goalText: `${wg.visits} a week`, tone: 'olive', val: d => doneOn(d, f => f.kind === 'visit'), fmt: (v, gl) => `${v} of ${gl}` },
    { id: 'outreach', weekly: wg.outreach, Icon: Flag, label: 'Outreach', goalText: `${wg.outreach} conversations a week`, tone: 'olive', val: d => m.encounters.filter(e => e.date === d).length, fmt: (v, gl) => `${v} of ${gl}` },
  ];
  const build = (rows) => rows.map(r => {
    const vals = days.map((d, i) => (d > today ? null : r.val(d, i)));
    const goals = days.map((d, i) => (r.weekly ? 0 : r.goal(d, i)));
    const tot = vals.reduce((a, b) => a + (b || 0), 0);
    const totGoal = r.weekly ?? goals.reduce((a, b) => a + b, 0);
    return { ...r, vals, goals, tot, totGoal };
  });
  const ownData = build(own), flockData = build(flock);
  const scoreDaily = (data) => { let met = 0, possible = 0; data.forEach(r => elapsed.forEach(d => { const i = days.indexOf(d); if (r.goals[i]) { possible++; if (r.vals[i] >= r.goals[i]) met++; } })); return possible ? Math.round((met / possible) * 100) : null; };
  const scoreFlock = () => { const parts = flockData.map(r => (r.weekly ? (r.totGoal ? Math.min(1, r.tot / r.totGoal) : null) : (() => { let met = 0, pos = 0; elapsed.forEach(d => { const i = days.indexOf(d); if (r.goals[i]) { pos++; if (r.vals[i] >= r.goals[i]) met++; } }); return pos ? met / pos : null; })())).filter(x => x !== null); return parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : null; };
  const sOwn = scoreDaily(ownData), sFlock = scoreFlock();
  const quiet = ownData.find(r => r.id === 'quiet');
  const isThis = offset === 0;
  const Row = ({ r }) => (
    <div className={'wk3-row ' + r.tone + (r.weekly ? ' weekly' : '')} role="row">
      <span className="wk3-l"><r.Icon size={16} /><span><b>{r.label}</b><small>{r.goalText}</small></span></span>
      {days.map((d, i) => {
        const v = r.vals[i], gl = r.goals[i];
        if (r.weekly) return <span key={d} className={'wk3-c count' + (d === today ? ' now' : '') + (v === null ? ' future' : '') + (v ? ' part' : '')} title={v === null ? fmtDate(d) : `${fmtDate(d, { weekday: 'long' })}: ${v}`}>{v ? <b>{v}</b> : null}</span>;
        const p = gl ? Math.min(1, (v || 0) / gl) : 0;
        return (
          <span key={d} className={'wk3-c' + (d === today ? ' now' : '') + (v === null ? ' future' : '') + (!gl ? ' none' : '') + (p >= 1 ? ' full' : p > 0 ? ' part' : '')}
            title={v === null ? fmtDate(d) : `${fmtDate(d, { weekday: 'long' })}: ${gl ? `${v} of ${gl}` : 'nothing planned'}`}>
            {p >= 1 ? <Check size={14} strokeWidth={3} /> : p > 0 ? <i style={{ height: `${p * 100}%` }} /> : null}
          </span>
        );
      })}
      <span className="wk3-t"><span>{r.fmt(r.tot, r.totGoal)}</span>{r.totGoal ? <span className="wk3-tb"><i style={{ width: `${Math.min(100, (r.tot / r.totGoal) * 100)}%` }} /></span> : null}</span>
    </div>
  );
  return (
    <section className="card week3 full">
      <header className="wk3-h">
        <div>
          <h2>Your week with God</h2>
          <p>{elapsed.length === 0 ? 'This week has not started yet.'
            : <>{isThis ? 'So far this week' : 'That week'}: quiet time on <b>{quiet.vals.filter(Boolean).length} of {elapsed.length}</b> {elapsed.length === 1 ? 'morning' : 'mornings'}.</>}</p>
        </div>
        <div className="wk3-scores">
          <span className="sc spoudazo"><Mark kind="spoudazo" size={20} /><span><small>Your own walk</small><b>{sOwn === null ? '—' : `${sOwn}%`}</b></span></span>
          <span className="sc poimaino"><Mark kind="poimaino" size={20} /><span><small>Your shepherding</small><b>{sFlock === null ? '—' : `${sFlock}%`}</b></span></span>
        </div>
        <div className="wk3-nav">
          <button type="button" onClick={() => setOffset(o => o - 1)} aria-label="Previous week"><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /></button>
          <span>{isThis ? 'This week' : offset === -1 ? 'Last week' : `Week of ${fmtDate(monday, { day: 'numeric', month: 'short' })}`}</span>
          <button type="button" onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={isThis} aria-label="Next week"><ChevronRight size={16} /></button>
        </div>
      </header>
      <div className="wk3-grid" role="table" aria-label="Your goals this week">
        <div className="wk3-row wk3-days" role="row">
          <span />
          {days.map((d, i) => (
            <span key={d} role="columnheader" className={(d === today ? 'now' : '') + (d > today ? ' future' : '')}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}<small>{fmtDate(d, { day: 'numeric' })}</small>
              <i title={sel.streak.active.has(d) ? 'Active this day' : ''}>{sel.streak.active.has(d) ? <Flame size={11} /> : null}</i>
            </span>
          ))}
          <span />
        </div>
        <div className="wk3-group"><Mark kind="spoudazo" size={18} /><b>Spoudazō</b><span>your own walk · daily goals</span></div>
        {ownData.map(r => <Row key={r.id} r={r} />)}
        <div className="wk3-group"><Mark kind="poimaino" size={18} /><b>Poimainō</b><span>your shepherding · the week’s rhythm and weekly goals</span></div>
        {flockData.map(r => <Row key={r.id} r={r} />)}
      </div>
      <p className="wk3-key"><span><i className="k full"><Check size={10} strokeWidth={3} /></i>goal met</span><span><i className="k part" />part of the way</span><span><i className="k" />not yet</span><span><i className="k num">2</i>done that day (weekly goals)</span><span><Flame size={12} /> active day</span>
        <a href="#/poimaino/settings">Weekly goals</a><a href="#/settings">Your rhythm</a></p>
    </section>
  );
}

// The welcome at the top of Boēthos: the day, the greeting, and the verse of the day. Its light follows the time of day.
function Hero({ name, today, now }) {
  const part = now < '12:00' ? 'morning' : now < '17:00' ? 'afternoon' : 'evening';
  const v = verseOfDay(today);
  const Icon = part === 'morning' ? Sunrise : part === 'afternoon' ? Sun : Moon;
  return (
    <section className="hero afternoon">
      <Watermark />
      <div className="hero-l">
        <span className="hero-date"><Icon size={17} /><b>{fmtDate(today, { weekday: 'long' })}</b>{fmtDate(today, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <h1>Good {part}{name ? <>,<br /><em>{name}</em></> : ''}</h1>
        <p>The Lord is your helper. Your own walk with God, and the people he has given you, in one place.</p>
      </div>
      <figure className="hero-verse">
        <span className="hv-label">Verse of the day</span>
        <blockquote>{v.text}</blockquote>
        <figcaption><span className="pv-rule" aria-hidden="true" />{v.ref}<span className="pv-tr">KJV</span></figcaption>
      </figure>
    </section>
  );
}

// The crook across the open Word, drawn large and faint in the corner of the welcome
const Watermark = () => (
  <svg className="hero-mark" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 23.2 C13 21.4 9.4 21.2 6 22.4 V25.6 C9.4 24.4 13 24.6 16 26.4 C19 24.6 22.6 24.4 26 25.6 V22.4 C22.6 21.2 19 21.4 16 23.2 Z" fill="currentColor" />
    <path d="M7.5 21 L18.5 7.8 A5 5 0 1 1 25 14.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="21.8" cy="9.6" r="1.6" fill="currentColor" />
  </svg>
);

// The page's sections as a ruled line of words, with a figure only where it says something
function Folio({ tab }) {
  const { state, sel } = useStore();
  const earned = sel.achievements.filter(a => a.earned).length;
  const reviewDue = sel.due.some(d => d.id === 'weekly' || d.id === 'monthly');
  const note = {
    activity: sel.xpToday ? `+${sel.xpToday}` : null,
    achievements: `${earned}/${sel.achievements.length}`,
    reviews: reviewDue ? 'due' : null,
    health: sel.warnings.length ? String(sel.warnings.length) : null,
  };
  return (
    <nav className="folio" aria-label="Boēthos">
      {TABS.map(([id, label]) => (
        <a key={id || 'overview'} href={id ? `#/home/${id}` : '#/home'} className={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined}>
          {(() => { const I = FOLIO_ICON[id]; return <I size={16} strokeWidth={1.75} />; })()}{label}{note[id] && <span className={'fo-n' + (note[id] === 'due' ? ' due' : '')}>{note[id]}</span>}
        </a>
      ))}
    </nav>
  );
}

const FOLIO_ICON = { '': LayoutDashboard, activity: Activity_, calendar: CalendarDays, achievements: Award, reviews: NotebookPen, journal: BookText, health: HeartPulse };
const TABS = [['', 'Overview'], ['activity', 'Activity'], ['calendar', 'Calendar'], ['achievements', 'Achievements'], ['reviews', 'Reviews'], ['journal', 'Journal'], ['health', 'Health']];

export default function Home({ tab = '' }) {
  const { state } = useStore();
  const today = todayKey();
  const now = localTime(state.ministry.settings.timezone);
  const t = TABS.some(([id]) => id === tab) ? tab : '';
  return (
    <>
      <Hero name={state.name} today={today} now={now} />
      {!state.life.setupDone && <p className="note-banner"><b>Set your rhythm.</b> Your quiet time, prayer times, chapters a day, books a month and fast days. Spoudazō builds your day from it. <a href="#/settings">Set it now</a>.</p>}
      <Folio tab={t} />
      {t === '' && <>
        <div className="sec-cards2"><SectionCard id="spoudazo" /><SectionCard id="poimaino" /></div>
        <TodayBoth />
        <WeekWithGod />
        <div className="home2-pair"><StreakCard /><BacentaWeek /></div>
      </>}
      {t === 'activity' && <Activity />}
      {t === 'calendar' && <Month />}
      {t === 'achievements' && <Achievements />}
      {t === 'reviews' && <Week />}
      {t === 'journal' && <Journal />}
      {t === 'health' && <Health />}
    </>
  );
}
