import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, BookOpen, Check } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { BURNOUT_RULES } from '../data/library';
import { href } from '../lib/router';
import { TitleBlock, Empty, fmtDate, stepName } from '../lib/ui.jsx';
import { todayKey, shiftDay, taskName } from '../store/engine';
import { isLine } from '../lib/plan';

// ── Health: the five marks of a healthy church, and the burnout warnings ──
const HEALTHY = 70; // where a mark should sit once the ministry is established
const LINKS = { word: '#/poimaino/sermons', prayer: '#/prayer', community: '#/poimaino/people', mission: '#/poimaino/outreach', leaders: '#/poimaino/people/workers' };
const TIPS = {
  word: 'Preach through a book, and memorise one passage a month.',
  prayer: 'Pray every morning, and log it. Keep a living list of requests.',
  community: 'Contact everyone in your care at least once a month. Visit.',
  mission: 'Make an evangelistic visit this week. Welcome someone new.',
  leaders: 'Pick one faithful person and begin "I do, you watch".',
};

// The five marks as a shape: your score filled, the healthy level dashed.
function Radar({ areas }) {
  const R = 120, C = 150, n = areas.length;
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [C + Math.cos(a) * R * v / 100, C + Math.sin(a) * R * v / 100]; };
  const poly = (key) => areas.map((a, i) => pt(i, Math.max(4, a[key])).join(',')).join(' ');
  return (
    <svg viewBox="0 0 300 300" className="radar" role="img" aria-label="The five marks of a healthy church">
      {[25, 50, 75, 100].map(r => <polygon key={r} points={areas.map((_, i) => pt(i, r).join(',')).join(' ')} className="radar-grid" />)}
      {areas.map((a, i) => <line key={a.id} x1={C} y1={C} x2={pt(i, 100)[0]} y2={pt(i, 100)[1]} className="radar-grid" />)}
      <polygon points={poly('expected')} className="radar-exp" />
      <polygon points={poly('score')} className="radar-you" />
      {areas.map((a, i) => { const [x, y] = pt(i, 118); return <text key={a.id} x={x} y={y} textAnchor={x < C - 10 ? 'end' : x > C + 10 ? 'start' : 'middle'} dominantBaseline="middle" className="radar-l">{a.label.split(' ')[0]}</text>; })}
    </svg>
  );
}

export function Health() {
  const { state, sel } = useStore();
  const areas = sel.health.map(m => ({ ...m, expected: HEALTHY }));
  const avg = Math.round(areas.reduce((n, a) => n + a.score, 0) / areas.length);
  const weak = [...areas].sort((a, b) => a.score - b.score).filter(a => a.score < HEALTHY).slice(0, 3);
  const warnings = BURNOUT_RULES.map(r => ({ ...r, on: sel.warnings.includes(r.id) }));

  // XP per week, last 12 weeks
  const today = todayKey();
  const monday = shiftDay(today, -((new Date().getDay() + 6) % 7));
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const start = shiftDay(monday, -7 * (11 - i)), end = shiftDay(start, 7);
    return { start, xp: state.events.filter(e => e.date >= start && e.date < end).reduce((a, e) => a + e.xp, 0) };
  });
  const maxW = Math.max(1, ...weeks.map(w => w.xp));

  return (
    <div className="cols">
      <div className="stack">
        <div className="card radar-card">
          <div className="card-h"><h2>The five marks of a healthy church</h2><span className="legend-mini"><i className="you" />Now <i className="exp" />Healthy</span></div>
          <Radar areas={areas} />
        </div>
        <div className="card">
          <div className="card-h"><h2>Each mark</h2><span className="muted small">Read from what you have logged · overall {avg}</span></div>
          <ul className="area-list">
            {areas.map(a => (
              <li key={a.id}>
                <a href={LINKS[a.id]} className="area-name">{a.label}<small>{a.desc}</small></a>
                <span className="area-bar"><i style={{ width: `${a.score}%` }} className={a.score < HEALTHY ? 'behind' : ''} /><b style={{ left: `${HEALTHY}%` }} /></span>
                <span className="area-n">{a.score}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="card-h"><h2>Burnout warning system</h2><span className={'pill' + (sel.warnings.length ? ' warn' : ' good')}>{sel.warnings.length ? `${sel.warnings.length} on` : 'All clear'}</span></div>
          <ul className="burnout">
            {warnings.map(w => (
              <li key={w.id} className={w.on ? (w.level === 'Critical' ? 'crit' : 'on') : ''}>
                <span className="bw-dot" aria-hidden="true" />
                <span className="bw-t">{w.label}</span>
                <span className="bw-l">{w.on ? w.level : 'Clear'}</span>
              </li>
            ))}
          </ul>
          <p className="muted small" style={{ margin: '12px 0 0' }}>Read live from your prayer log and disciplines. Warnings only start once you have been going long enough for them to mean something.</p>
        </div>
        <div className="card">
          <div className="card-h"><h2>XP per week</h2><span className="muted small">last 12 weeks</span></div>
          <div className="weeks">
            {weeks.map(w => (
              <div key={w.start} className="wk" title={`Week of ${fmtDate(w.start)}: ${w.xp} XP`}>
                <span className="wk-bar" style={{ height: `${Math.max(2, (w.xp / maxW) * 100)}%` }} />
                <small>{fmtDate(w.start, { day: 'numeric', month: 'short' })}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside className="aside">
        <section>
          <h3>Needs attention</h3>
          {weak.length === 0 ? <p className="goal-line small">Every mark is at a healthy level. Keep going.</p> : weak.map(a => (
            <a key={a.id} href={LINKS[a.id]} className="advice bad"><b>{a.label}</b><span>{a.score} of {HEALTHY} healthy.</span><span>{TIPS[a.id]}</span></a>
          ))}
        </section>
        <section>
          <h3>The shepherd</h3>
          <TitleBlock className="grid" items={[
            ['Prayer streak', `${sel.prayerStreak} ${sel.prayerStreak === 1 ? 'day' : 'days'}`],
            ['This week', `${sel.disciplinesThisWeek} disciplines`],
            ['Memorised', state.scriptureMemory.filter(s => s.status === 'memorized').length],
            ['Answered', state.prayerRequests.filter(r => r.answered).length],
          ]} />
        </section>
      </aside>
    </div>
  );
}

// ── Month: every day of the month, shaded by the XP you earned ──
export function Month() {
  const { state } = useStore();
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState(todayKey());
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + offset);
  const y = base.getFullYear(), m = base.getMonth();
  const first = new Date(Date.UTC(y, m, 1));
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const key = (d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const byDay = {};
  state.events.forEach(e => { (byDay[e.date] = byDay[e.date] || []).push(e); });
  const xpOf = (k) => (byDay[k] || []).reduce((a, e) => a + e.xp, 0);
  const monthKeys = Array.from({ length: days }, (_, i) => key(i + 1));
  const active = monthKeys.filter(k => xpOf(k) > 0);
  const best = monthKeys.reduce((b, k) => (xpOf(k) > xpOf(b) ? k : b), monthKeys[0]);
  const goal = state.dailyXpGoal || 50;
  const level = (xp) => (xp === 0 ? '' : xp >= goal ? 'l3' : xp >= goal / 2 ? 'l2' : 'l1');

  return (
    <div className="cols">
      <div className="stack">
        <MonthReview key={`${y}-${m}`} month={`${y}-${String(m + 1).padStart(2, '0')}`} name={base.toLocaleDateString(undefined, { month: 'long' })}
          current={offset === 0} stats={{ active: active.length, xp: monthKeys.reduce((a, k) => a + xpOf(k), 0) }} />
        <div className="card">
          <div className="card-h">
            <h2>{base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
            <span className="cal-nav">
              <button className="ghost icon" onClick={() => setOffset(o => o - 1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
              {offset !== 0 && <button className="ghost sm" onClick={() => setOffset(0)}>This month</button>}
              <button className="ghost icon" onClick={() => setOffset(o => o + 1)} aria-label="Next month"><ChevronRight size={18} /></button>
            </span>
          </div>
          <div className="cal">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d} className="cal-dow">{d}</span>)}
            {Array.from({ length: lead }, (_, i) => <span key={`x${i}`} />)}
            {monthKeys.map((k, i) => (
              <button key={k} type="button" className={`cal-day ${level(xpOf(k))}` + (k === todayKey() ? ' today' : '') + (k === picked ? ' picked' : '') + (state.frozenDays.includes(k) ? ' frozen' : '')} onClick={() => setPicked(k)}>
                <b>{i + 1}</b>{xpOf(k) > 0 && <small>{xpOf(k)}</small>}
              </button>
            ))}
          </div>
          <p className="muted small" style={{ margin: '12px 0 0' }}>Full colour is a day at your {goal} XP goal. Tap a day to see what you did.</p>
        </div>
        <div className="card day-log">
          <div className="card-h"><h2>{fmtDate(picked, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>{xpOf(picked) > 0 && <span className="xp-chip">+{xpOf(picked)} XP</span>}</div>
          {(byDay[picked] || []).length === 0
            ? <p className="muted" style={{ margin: 0 }}>{state.frozenDays.includes(picked) ? 'A streak freeze covered this day.' : 'Nothing logged on this day.'}</p>
            : <ul className="log">{byDay[picked].map(e => <li key={e.id}><span className="log-t">{e.label}</span><span className="log-xp">+{e.xp}</span></li>)}</ul>}
        </div>
      </div>
      <aside className="aside">
        <section>
          <h3>This month</h3>
          <TitleBlock className="grid" items={[
            ['Active days', `${active.length}`],
            ['XP', monthKeys.reduce((a, k) => a + xpOf(k), 0)],
            ['Goal days', monthKeys.filter(k => xpOf(k) >= goal).length],
            ['Best day', xpOf(best) ? fmtDate(best) : '–'],
            ['Tasks', monthKeys.reduce((a, k) => a + (byDay[k] || []).filter(e => e.kind === 'task').length, 0)],
            ['Frozen', monthKeys.filter(k => state.frozenDays.includes(k)).length],
          ]} />
        </section>
      </aside>
    </div>
  );
}

// ── The month review: written on the last days of each month ──
const MONTH_QS = [
  ['best', 'What went best this month?', 'The thing you are proudest of. Be specific.'],
  ['worst', 'What did not happen that should have?', 'And the honest reason why.'],
  ['learned', 'What do you understand now that you did not a month ago?', 'One concept, explained in a sentence.'],
  ['change', 'What will you change next month?', 'One change to how you work, not a wish.'],
];
function MonthReview({ month, name, current, stats }) {
  const { state, saveMonthlyReview } = useStore();
  const saved = state.monthlyReviews?.[month];
  const [form, setForm] = useState(() => saved || { best: '', worst: '', learned: '', change: '', score: '' });
  const [editing, setEditing] = useState(false);
  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  if (!current && !saved) return null;
  if (saved && !editing) {
    return (
      <div className="card month-review done">
        <div className="card-h"><h2>{name} in review</h2>{current && <button className="ghost sm" onClick={() => setEditing(true)}>Edit</button>}</div>
        {saved.score && <p className="muted small" style={{ marginTop: 0 }}>You gave this month <b className="ink">{saved.score} / 10</b></p>}
        <dl className="mr-dl">{MONTH_QS.filter(([k]) => saved[k]).map(([k, q]) => <div key={k}><dt>{q}</dt><dd>{saved[k]}</dd></div>)}</dl>
      </div>
    );
  }
  const due = daysLeft <= 1;
  if (!due && !editing) {
    const opens = new Date(now.getFullYear(), now.getMonth() + 1, -1);
    return (
      <div className="card month-review soon">
        <div><b>The {name} review</b><span className="muted small">Asked for on {opens.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} and the day after.</span></div>
        <button className="ghost sm" onClick={() => setEditing(true)}>Write it now</button>
      </div>
    );
  }
  return (
    <form className={'card month-review' + (due ? ' due' : '')} onSubmit={(e) => { e.preventDefault(); saveMonthlyReview(month, form); setEditing(false); }}>
      <div className="card-h">
        <h2>Write about {name}</h2>
        {due && <span className="pill warn">{daysLeft === 0 ? 'Due today' : 'Due by tomorrow'}</span>}
      </div>
      <p className="muted small" style={{ marginTop: 0 }}>{stats.active} active days and {stats.xp.toLocaleString()} XP so far. Fifteen minutes, once a month.</p>
      {MONTH_QS.map(([k, q, hint]) => (
        <label key={k} className="field">
          <span className="mr-q">{q}</span>
          <textarea value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={hint} style={{ minHeight: 72 }} />
        </label>
      ))}
      <div className="field">
        <span className="mr-q">How would you score the month?</span>
        <div className="mr-score">
          {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(n => (
            <button key={n} type="button" className={form.score === n ? 'on' : ''} onClick={() => setForm(f => ({ ...f, score: n }))}>{n}</button>
          ))}
        </div>
      </div>
      <button className="primary" type="submit" disabled={!form.best.trim() && !form.change.trim()}>Save the month</button>
    </form>
  );
}

// ── Journal: everything you have written, newest first, searchable ──
// Room for the longer thoughts that don't fit in Today's one line.
function JournalWrite() {
  const { addCapture } = useStore();
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  // The box grows with what you write
  const grow = (el) => { if (el) { el.style.height = 'auto'; el.style.height = `${Math.max(120, el.scrollHeight + 2)}px`; } };
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <form className="journal-write" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; addCapture(text.trim(), 'journal'); setText(''); setSaved(true); }}>
      <div className="jw-head">
        <span className="jw-date">{fmtDate(todayKey(), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <h2>Write in your journal</h2>
      </div>
      <textarea ref={grow} value={text} onChange={e => { setText(e.target.value); setSaved(false); grow(e.target); }}
        placeholder="What went well, what was hard, what you want to remember…" aria-label="Journal entry" />
      <div className="jw-foot">
        <span className="jw-hint">{saved ? <><Check size={14} /> Saved to today</> : words ? `${words} ${words === 1 ? 'word' : 'words'}` : 'Only you see this. It stays here in the Journal.'}</span>
        <button className="primary" type="submit" disabled={!text.trim()}>Save entry</button>
      </div>
    </form>
  );
}

// "14:32" from a note's id, which is its creation time.
const timeOf = (id) => { const ms = Number(String(id).split('-')[1]); return ms > 1e12 ? new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''; };
function dayLabel(d) {
  if (!d) return 'Notes on steps and phases';
  if (d === todayKey()) return 'Today';
  if (d === shiftDay(todayKey(), -1)) return 'Yesterday';
  const sameYear = d.slice(0, 4) === todayKey().slice(0, 4);
  return fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function Journal() {
  const { state, sel } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(() => (/\/reviews$/.test(window.location.hash) ? 'review' : 'all'));
  const [rkind, setRkind] = useState('');
  const bacenta = state.ministry?.settings?.name || 'Bacenta';
  const addD = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const steps = Object.fromEntries(sel.phases.flatMap(p => p.steps.map(s => [s.id, stepName(s).title])));
  const entries = [
    ...Object.entries(state.taskNotes || {}).filter(([, t]) => t?.trim()).map(([k, text]) => {
      const [id, date] = k.split('|');
      return { key: k, date, kind: 'Task notes', title: taskName(id, state) || 'A task', text };
    }),
    // Where you wrote it decides what it is: the Journal box makes entries, Today makes lines.
    // (Notes saved before that was recorded fall back to their length.)
    ...(state.captures || []).map(c => (!isLine(c)
      ? { key: c.id, date: c.date, time: timeOf(c.id), group: 'journal', kind: 'Journal entry', title: '', text: c.text }
      : { key: c.id, date: c.date, time: timeOf(c.id), group: 'line', kind: 'A line for yourself', title: c.text, text: '' })),
    ...Object.entries(state.monthlyReviews || {}).map(([m, r]) => ({ key: `m${m}`, date: `${m}-28`, kind: 'Month review', rk: 'month', title: new Date(`${m}-15T12:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + (r.score ? ` · ${r.score}/10` : ''), text: [r.best, r.worst, r.learned, r.change].filter(Boolean).join('\n\n') })),
    ...Object.entries(state.weeklyReviews || {}).map(([date, r]) => ({ key: `r${date}`, date, kind: 'Weekly review', rk: 'week', title: `Week ending ${fmtDate(date)}`, parts: [['What God did', r.built], ['Where I struggled', r.hard], ['Who needs care', r.surprised], ['My disciplines', r.checkpoint], ['Next week', r.nextWeek]] })),
    // Your Bacenta's weekly review, written in Poimainō
    ...Object.entries(state.ministry?.weekNotes || {}).filter(([, n]) => n.reviewedAt || n.notes).map(([w, n]) => ({ key: `b${w}`, date: addD(w, 6), kind: `${bacenta} review`, rk: 'bacenta', title: `Week of ${fmtDate(w, { day: 'numeric', month: 'long' })}`, href: '#/poimaino/week', parts: [['What went well', n.well], ['What to do better', n.improve], ['Who needs care', n.care], ['The plan for next week', n.plan || n.notes]] })),
    // The monthly character examination (Spoudazō)
    ...(state.life?.character || []).map(c => ({ key: `c${c.id}`, date: c.date, kind: 'Character examination', rk: 'character', title: new Date(c.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), href: '#/quiet/character', parts: [['Where God is dealing with me', c.note], ['The one thing I will change', c.commit]] })),
    // Closing the day (Spoudazō)
    ...Object.entries(state.life?.examen || {}).map(([d, x]) => ({ key: `e${d}`, date: d, kind: 'Day closed', rk: 'day', title: x.saw || 'Closing the day', parts: [['Where I fell short', x.fell], ['Tomorrow', x.tomorrow]] })),
    ...Object.entries(state.shutdowns || {}).map(([k, d]) => ({ key: `d${k}`, date: k.slice(0, 10), kind: 'Day closed', rk: 'day', title: d.built || 'End of the day', text: [d.blocked && `Blocked: ${d.blocked}`, d.first && `Tomorrow first: ${d.first}`].filter(Boolean).join('\n') })),
    ...Object.entries(state.stepNotes || {}).filter(([, t]) => t?.trim()).map(([id, text]) => ({ key: `s${id}`, date: '', kind: 'Step notes', title: steps[id] || id, text })),
    ...Object.entries(state.phaseNotes || {}).filter(([, t]) => t?.trim()).map(([id, text]) => ({ key: `p${id}`, date: '', kind: 'Phase notes', title: sel.phases.find(p => p.id === id)?.title || id, text })),
  ].map(e => ({ ...e, group: e.group || (e.rk ? 'review' : 'notes') }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const count = (g) => entries.filter(e => e.group === g).length;
  const flat = (e) => `${e.title} ${e.text || ''} ${(e.parts || []).map(p => p[1] || '').join(' ')}`.toLowerCase();
  const shown = entries.filter(e => (filter === 'all' || e.group === filter) && (filter !== 'review' || !rkind || e.rk === rkind) && (!q || flat(e).includes(q.toLowerCase())));
  const RKINDS = [['', 'All reviews'], ['week', 'Your week'], ['bacenta', bacenta], ['month', 'Month'], ['character', 'Character'], ['day', 'Closing the day']].map(([k, l]) => [k, l, k ? entries.filter(e => e.rk === k).length : count('review')]);
  const FILTERS = [['all', 'Everything', entries.length], ['journal', 'Journal entries', count('journal')], ['line', 'Lines for yourself', count('line')], ['review', 'Reviews', count('review')], ['notes', 'Notes', count('notes')]];
  // One column, grouped by day, newest first
  const days = [];
  shown.forEach(e => { const last = days[days.length - 1]; if (last && last.date === (e.date || '')) last.items.push(e); else days.push({ date: e.date || '', items: [e] }); });

  return (
    <div className="journal-page">
      <JournalWrite />
      <div className="j-bar">
        <div className="j-search">
          <Search size={17} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search everything you have written" aria-label="Search the journal" />
        </div>
        <div className="j-filters" role="tablist" aria-label="Show">
          {FILTERS.map(([id, label, n]) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} className={'j-chip f-' + id + (filter === id ? ' on' : '')} onClick={() => setFilter(id)} disabled={n === 0 && id !== 'all'}>
              {label}<em>{n}</em>
            </button>
          ))}
        </div>
      </div>
      {filter === 'review' && <div className="j-rkinds" role="group" aria-label="Kind of review">{RKINDS.map(([k, l, n]) => <button key={k} type="button" className={rkind === k ? 'on' : ''} disabled={!n && k !== ''} onClick={() => setRkind(k)}>{l}<em>{n}</em></button>)}</div>}
      {shown.length === 0 ? <div className="card"><Empty title={q ? 'Nothing matches.' : 'Nothing here yet.'}><p>Journal entries, the lines you write on Today, reviews and notes all collect here.</p></Empty></div> : (
        <div className="j-days">
          {days.map(d => (
            <section key={d.date || 'undated'} className="j-day">
              <h3 className="j-day-h"><span>{dayLabel(d.date)}</span><em>{d.items.length}</em></h3>
              {d.items.map(e => e.group === 'line' ? (
                <article key={e.key} className="j-line">
                  <span className="j-line-q" aria-hidden="true">“</span>
                  <div><p>{e.title}</p><small>A line for yourself, written on Today{e.time && ` · ${e.time}`}</small></div>
                </article>
              ) : e.group === 'journal' ? (
                <article key={e.key} className="j-entry">
                  <div className="j-meta"><span className="j-tag"><BookOpen size={13} />Journal entry</span>{e.time && <span className="j-time">{e.time}</span>}</div>
                  <p>{e.text}</p>
                </article>
              ) : (
                <article key={e.key} className={'j-other ' + e.group + (e.rk ? ' rk-' + e.rk : '')}>
                  <div className="j-meta"><span className="j-tag plain">{e.kind}</span>{e.href && <a className="j-open" href={e.href}>Open</a>}</div>
                  <h4>{e.title}</h4>
                  {e.text && <p>{e.text}</p>}
                  {e.parts && <dl className="j-parts">{e.parts.filter(p => p[1]).map(([l, t]) => <div key={l}><dt>{l}</dt><dd>{t}</dd></div>)}</dl>}
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
