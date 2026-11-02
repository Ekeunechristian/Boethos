import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, Timer, ChevronLeft, ChevronRight, Clock, Hourglass, Flame, Snowflake, Award, Sparkles, PenLine, X } from 'lucide-react';
import { PRINCIPLES, principleIndex, VERSES, BURNOUT_RULES } from '../data/library';
import { useStore } from '../store/index.jsx';
import { ROADMAP_DATA } from '../data/roadmap';
import { href, go } from '../lib/router';
import { Bar, Mark, Seg, Prose, Links, Sheet, SheetHead, Empty, Kicker, TitleBlock, STATUS_LABEL, nextStatus, phaseNo, stepName, hrs, useToast } from '../lib/ui.jsx';
import StageTrack from '../components/StageTrack.jsx';
import { todayKey } from '../store/engine';
import { focusStep, whereLabel, goalParts, phaseHoursShort, isLine } from '../lib/plan';
import { FocusTimer, useEndFocus, taskReadiness } from '../components/Focus.jsx';

const GOAL = goalParts(ROADMAP_DATA.goal);
const CARRY_SHOWN = 3;

// Changing a task's status. Finishing a task also ends its timer, so no clock is left running
// for work that is already done: a full session is logged, a shorter one is not.
function useSetStatus() {
  const { state, sel, setTaskStatus, setStepStatus } = useStore();
  const end = useEndFocus();
  const toast = useToast();
  return (task, status) => {
    if (status === 'completed' && state.focus.running?.taskId === task.id) toast(end());
    return task.isPhaseStep ? setStepStatus(task.id, status) : setTaskStatus(task.id, status, { label: task.label, hours: task.hours, memberId: task.memberId, memberName: task.memberName, sermonId: task.sermonId, prepHours: task.prepHours });
  };
}

// Where today's "close the day" is kept. Starting the next Phase 0 day early on the same date
// gives that day its own record, so it can be closed again.
function useShutdownKey() {
  const { state, sel } = useStore();
  const t = todayKey();
  if (sel.currentPhase.id !== 'phase-0') return t;
  return t;
}

const SHUTDOWN = [
  ['built', 'What did I build or finish today?', 'One sentence. Name the thing.'],
  ['blocked', 'What blocked me?', 'Or "nothing". Be precise if something did.'],
  ['first', "Tomorrow's first action", 'Specific enough to start without thinking: "open BST.java and write delete()".'],
];

// Block 10's evening shutdown: three sentences that close the day and open tomorrow.
// It sits as the last line of the "before the day ends" card and opens in place.
function Shutdown() {
  const { state, sel, saveShutdown } = useStore();
  const toast = useToast();
  const today = useShutdownKey();
  const saved = state.shutdowns?.[today];
  const [form, setForm] = useState(() => saved || { built: '', blocked: '', first: '' });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // "Close the day" buttons elsewhere on the page open this form and bring it into view
  useEffect(() => {
    const on = () => { setOpen(true); setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); };
    window.addEventListener('open-shutdown', on);
    return () => window.removeEventListener('open-shutdown', on);
  }, []);
  if (!open) {
    return (
      <li className="close-row" ref={ref}>
        <button type="button" onClick={() => setOpen(true)}>
          <span className="due-kind">{saved ? 'Closed' : 'Close'}</span>
          <span className="t">
            <b>{saved ? 'Day closed' : 'Close the day'}</b>
            <small>{saved ? <>Tomorrow starts with: <span className="ink">{saved.first}</span></> : 'Three sentences: what you built, what blocked you, tomorrow’s first action'}</small>
          </span>
          <span className="close-act">{saved ? 'Edit' : 'Write'}</span>
        </button>
        {saved && <DayRecap />}
      </li>
    );
  }
  return (
    <li className="close-row open" ref={ref}>
      <form className="shutdown" onSubmit={(e) => { e.preventDefault(); saveShutdown(today, form); setOpen(false); toast('Day closed. Tomorrow’s first action is saved.'); }}>
        <div className="close-h"><span className="due-kind">Close</span><b>Close the day</b><span className="muted small">2 minutes</span></div>
        {SHUTDOWN.map(([k, label, hint]) => (
          <label key={k} className="field">
            <span>{label}</span>
            <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={hint} autoFocus={k === 'built'} />
          </label>
        ))}
        <div className="close-btns">
          <button className="primary" type="submit" disabled={!form.first.trim()}>{saved ? 'Save' : 'Close the day'}</button>
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </li>
  );
}

const SHORT = 120;

// A rule for today from Phase 0, and one short line you wrote for yourself.
function Spark() {
  const { state, addCapture, deleteCapture } = useStore();
  const toast = useToast();
  const [i, setI] = useState(principleIndex);
  const [text, setText] = useState('');
  const p = PRINCIPLES[i];
  const todayIdx = principleIndex();
  // Only lines written here on Today; journal entries stay in the Journal.
  const captures = (state.captures || []).filter(isLine);
  const journalCount = (state.captures || []).length - captures.length;
  const last = captures[0];
  const long = text.length > SHORT - 20;
  const save = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addCapture(text.trim());
    setText('');
    toast('Saved. You’ll see it here until the next one.');
  };
  return (
    <div className="spark">
      <div className="spark-rule">
        <div className="sr-top">
          <span className="sr-label"><Sparkles size={15} />{i === todayIdx ? 'Today’s rule' : `Rule ${i + 1} of ${PRINCIPLES.length}`}</span>
          <span className="sr-nav">
            <button type="button" aria-label="Previous rule" onClick={() => setI((i - 1 + PRINCIPLES.length) % PRINCIPLES.length)}><ChevronLeft size={16} /></button>
            <button type="button" aria-label="Next rule" onClick={() => setI((i + 1) % PRINCIPLES.length)}><ChevronRight size={16} /></button>
          </span>
        </div>
        <blockquote>{p.rule}</blockquote>
        <small>{p.from}</small>
      </div>
      <form className="spark-cap" onSubmit={save}>
        <label htmlFor="cap"><PenLine size={15} />A line for yourself</label>
        <div className="cap-row">
          <input id="cap" value={text} onChange={e => setText(e.target.value)} placeholder="Something short that will push you when you read it again" maxLength={SHORT} />
          <button type="submit" className="primary" disabled={!text.trim()} aria-label="Save"><ArrowRight size={17} /></button>
        </div>
        {long
          ? <small className="cap-hint warn">{SHORT - text.length} characters left. More to say? <a href="#/review/journal">Write it in your journal</a>.</small>
          : last
            ? <div className="cap-last"><span>“{last.text}”</span><button type="button" className="ghost" aria-label="Remove this note" onClick={() => deleteCapture(last.id)}><X size={14} /></button></div>
            : <small className="cap-hint">One line, kept here. Longer thoughts belong in your journal.</small>}
        <a className="cap-journal" href="#/review/journal">
          <BookOpen size={15} />Open your journal{journalCount > 0 ? ` · ${journalCount} ${journalCount === 1 ? 'entry' : 'entries'}` : ''}<ArrowRight size={14} />
        </a>
      </form>
    </div>
  );
}

const fmtMins = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`);

// "ministry, piano and coursework"
const listOf = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

// After you close the day: what the day added up to.
function DayRecap() {
  const { state, sel } = useStore();
  const focusMin = sel.focusToday || 0;
  const left = sel.todaysTotal - sel.todaysDone;
  const goal = sel.xpToday >= (state.dailyXpGoal || 50);
  const tiles = [
    { icon: Check, label: 'Tasks done', value: `${sel.todaysDone}`, of: `of ${sel.todaysTotal}`, tone: left === 0 ? 'good' : '' },
    { icon: Timer, label: 'Focused', value: focusMin ? fmtMins(focusMin) : '0m', of: state.dailyHours ? `of ${hrs(state.dailyHours)}` : '' },
    { icon: Award, label: 'XP earned', value: `+${sel.xpToday}`, of: goal ? 'goal reached' : `goal ${state.dailyXpGoal}`, tone: goal ? 'good' : '' },
    { icon: Flame, label: 'Streak', value: `${sel.streak.current}`, of: sel.streak.current === 1 ? 'day' : 'days', tone: sel.streak.activeToday ? 'fire' : '' },
  ];
  return (
    <div className="recap">
      <div className="recap-top">
        <span className="recap-badge"><Check size={14} strokeWidth={3} /></span>
        <b>Today, in numbers</b>
        <span className="recap-sum">{left === 0 ? 'Every task done' : `${left} left for tomorrow`}</span>
      </div>
      <div className="recap-tiles">
        {tiles.map(t => (
          <div key={t.label} className={'recap-tile ' + (t.tone || '')}>
            <t.icon size={16} />
            <b>{t.value}<small>{t.of}</small></b>
            <span>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Doing a lot is allowed; rushing is not the goal. When today runs well past the plan, say so,
// and name the rest of your life.
function Balance() {
  const { state, sel, dismissForToday } = useStore();
  if (state.dismissed?.balance === todayKey()) return null;
  const days = 0;
  const focusMin = sel.focusToday || 0;
  const limit = (state.dailyHours || 4) * 60;
  const tooManyDays = days >= 3;
  const tooLong = focusMin > limit + 60;
  if (!tooManyDays && !tooLong) return null;
  const other = state.profile.otherCommitments?.length ? state.profile.otherCommitments : ['rest'];
  return (
    <div className="pace balance">
      <div className="pace-t">
        <b>{tooManyDays ? `You’re on your ${days}${days === 3 ? 'rd' : 'th'} day of the plan today` : `You’ve focused ${fmtMins(focusMin)} today, past your ${hrs(state.dailyHours || 4)}`}</b>
        <span>That’s a lot. Going faster than the plan rarely makes it stick, and the plan only works if you keep the rest of your life going too: {listOf(other)}. Consider stopping here for today.</span>
      </div>
      <div className="pace-btns"><button onClick={() => dismissForToday('balance')}>I’ve got it under control</button></div>
    </div>
  );
}

// Care for the shepherd: the Sabbath when it is your Sabbath, and the burnout warnings your own logs raise.
function PaceNote() {
  const { state, sel, dismissForToday } = useStore();
  if (sel.isSabbath) {
    return (
      <div className="pace ahead">
        <div className="pace-t">
          <b>Today is your Sabbath</b>
          <span>Only your soul’s rhythm is on the list today. No ministry work, no emails, no sermon preparation. Rest is obedience, and it protects your ministry from your own ambition.</span>
        </div>
        <div className="pace-btns"><a className="btn" href="#/prayer/disciplines">Mark the Sabbath kept</a></div>
      </div>
    );
  }
  if (!sel.warnings.length || state.dismissed?.pace === todayKey()) return null;
  const rules = BURNOUT_RULES.filter(r => sel.warnings.includes(r.id));
  const critical = rules.some(r => r.level === 'Critical');
  return (
    <div className="pace behind">
      <div className="pace-t">
        <b>{critical ? 'A critical burnout warning' : `${rules.length} burnout ${rules.length === 1 ? 'warning' : 'warnings'}`}</b>
        <span>{rules.map(r => r.label).join(' · ')}. Your logs say the inner life is thinning. Fix this before you add more ministry.</span>
      </div>
      <div className="pace-btns">
        <a className="btn" href="#/review/health">See your health</a>
        <button onClick={() => dismissForToday('pace')}>Not today</button>
      </div>
    </div>
  );
}

// More work planned than your hours allow: offer to move one task to tomorrow.
function OverPlanned({ tasks, active }) {
  const { state, sel, snoozeTask, dismissForToday } = useStore();
  const toast = useToast();
  const hours = state.dailyHours;
  const planned = tasks.reduce((n, t) => n + (t.hours || 0), 0);
  const excess = planned - (hours || 0);
  const snoozed = sel.snoozedTasks || [];
  // When you're days behind, the backlog is the reason for the overload: answer that first
  const behindFirst = sel.currentPhase.id === 'phase-0' && sel.phase0Behind >= 2 && state.dismissed?.pace !== todayKey();
  const candidates = tasks.filter(t => t.status === 'not_started' && t.id !== active?.id && t.hours > 0);
  const fits = candidates.filter(t => t.hours >= excess).sort((a, b) => a.hours - b.hours);
  const pick = fits[0] || [...candidates].sort((a, b) => b.hours - a.hours)[0];
  return (
    <>
      {hours && excess > 0.25 && pick && state.dismissed?.overplan !== todayKey() && !behindFirst && (
        <div className="pace over">
          <div className="pace-t">
            <b>{hrs(planned)} planned for your {hrs(hours)}</b>
            <span>That’s {hrs(excess)} more than you said you have. Move “{pick.label}” ({hrs(pick.hours)}) to tomorrow?</span>
          </div>
          <div className="pace-btns">
            <button className="primary" onClick={() => { snoozeTask(pick.id); toast(`Moved to tomorrow: ${pick.label}`); }}>Move it</button>
            <button onClick={() => dismissForToday('overplan')}>I’ll do it all</button>
          </div>
        </div>
      )}
      {snoozed.length > 0 && (
        <p className="snoozed">Moved to tomorrow: {snoozed.map((t, i) => (
          <span key={t.id}>{i > 0 && ', '}<b>{t.label}</b> <button className="linklike" onClick={() => snoozeTask(t.id, false)}>bring back</button></span>
        ))}</p>
      )}
    </>
  );
}

// What you told yourself last night, shown first thing.
function StartWith() {
  const { state } = useStore();
  const prev = Object.keys(state.shutdowns || {}).filter(d => d < todayKey()).sort().pop();
  const first = prev && state.shutdowns[prev].first;
  if (!first) return null;
  const days = Math.round((new Date(todayKey()) - new Date(prev)) / 86400000);
  return (
    <div className="start-with">
      <span className="eyebrow">{days === 1 ? 'Last night' : `${days} days ago`} you said to start with</span>
      <b>{first}</b>
    </div>
  );
}

// A question that fits the task, so the note box asks for the useful thing.
function promptFor(task) {
  if (task.id === 'silence') return 'What did you notice in the stillness? Anything God brought to mind?';
  if (task.id === 'prayer') return 'Who did you pray for? What did you confess, and what are you thankful for?';
  if (task.id === 'scripture') return 'Which verse stopped you? One sentence about God, one about yourself.';
  if (task.id === 'sunday-review') return 'What did God do in the service? Who needs a follow-up? What would you change next Sunday?';
  if (task.id.startsWith('care-')) return 'What did you hear, and what did you promise to do?';
  if (task.id.startsWith('sermon-')) return 'What did this block of preparation produce: exegesis, the big idea, the structure?';
  if (task.id.startsWith('step-')) return 'What did you do on this step today, and what comes next?';
  return 'Write it here: what you did, what you noticed, what comes next.';
}

// The task, open: what to do and how on the left, room to do it on the right.
function TaskSheet({ task, onClose }) {
  const { state, sel, saveTaskNote } = useStore();
  const setStatus = useSetStatus();
  const toast = useToast();
  const [note, setNote] = useState(() => sel.getTaskNote(task.id));
  const [saved, setSaved] = useState(() => sel.getTaskNote(task.id));
  const save = () => { if (note !== saved) { saveTaskNote(task.id, note); setSaved(note); } };
  const close = () => { save(); onClose(); };
  // A task is ticked only after a full focus session and a written note
  const ready = taskReadiness(state, task.id);
  const noteOk = !!note.trim() || ready.note;
  const canFinish = ready.focus && noteOk;
  const finish = () => {
    if (!canFinish) { toast(!ready.focus ? 'Finish a full focus session first' : 'Write your note first'); return; }
    save(); setStatus(task, 'completed'); toast(`Done: ${task.label}`); onClose();
  };

  return (
    <Sheet onClose={close} className="xl" label={task.label}>
      <SheetHead
        eyebrow={[task.isCarryForward ? `Carried over from day ${task.fromDay}` : 'Today', hrs(task.hours) && `about ${hrs(task.hours)}`].filter(Boolean).join(' · ')}
        title={task.label} onClose={close} />
      <div className="task-grid">
        <div className="task-read">
          <p className="lede">{task.activity}</p>
          {task.detail && task.detail !== task.activity && <section><span className="eyebrow">How to do it</span><Prose text={task.detail} /></section>}
          {task.resources?.length > 0 && <section><span className="eyebrow">Resources</span><Links items={task.resources} /></section>}
        </div>
        <div className="task-write">
          {task.status !== 'completed' && <FocusTimer taskId={task.id} label={task.label} hours={task.hours} />}
          <label htmlFor="tnote">Your work <span className="saved">{note === saved ? (saved ? 'Saved' : '') : 'Not saved yet'}</span></label>
          <p className="prompt-q">{promptFor(task)}</p>
          <textarea id="tnote" className="pad" value={note} onChange={e => setNote(e.target.value)} onBlur={save}
            placeholder="Your answer…" />
          <small className="muted">Kept with today's date. Find it again any time by opening this task.</small>
        </div>
      </div>
      {task.status !== 'completed' && (
        <div className="finish-req">
          <span className="fr-h">To mark it done</span>
          <span className={'fr-item' + (ready.focus ? ' ok' : '')}>{ready.focus ? <Check size={14} strokeWidth={3} /> : <Timer size={14} />}A full focus session</span>
          <span className={'fr-item' + (noteOk ? ' ok' : '')}>{noteOk ? <Check size={14} strokeWidth={3} /> : <PenLine size={14} />}Your note on the work</span>
        </div>
      )}
      <div className="sheet-foot">
        <Seg value={task.status} onChange={(s) => (s === 'completed' ? finish() : setStatus(task, s))} options={['not_started', 'in_progress', 'completed'].map(s => [s, STATUS_LABEL[s]])} />
        <span className="grow" />
        <button type="button" onClick={close}>Close</button>
        {task.status !== 'completed' && (
          <button type="button" className="primary" disabled={!canFinish} onClick={finish} title={canFinish ? '' : 'Needs a full focus session and your note'}>Mark done</button>
        )}
      </div>
    </Sheet>
  );
}

// One entry on the day's timeline. The active one opens out with its description and actions.
function DayItem({ task, active, onOpen }) {
  const { state: store } = useStore();
  const setStatus = useSetStatus();
  const toast = useToast();
  const state = task.status === 'completed' ? 'done' : active ? 'active' : 'todo';
  // Focus logged on this task today, and whether its timer is running now
  const focused = (store.focus?.sessions || []).filter(f => f.taskId === task.id && f.date === todayKey()).reduce((n, f) => n + f.minutes, 0);
  const timing = store.focus?.running?.taskId === task.id;
  const ready = taskReadiness(store, task.id);
  const tick = () => {
    if (!ready.ok) { onOpen(); toast(!ready.focus ? 'To tick it: do a full focus session and write your note' : 'To tick it: write your note on the work'); return; }
    setStatus(task, 'completed'); toast(`Done: ${task.label}`);
  };
  return (
    <li className={`day-item ${state}`}>
      <Mark status={task.status} onClick={() => (task.status === 'completed' ? setStatus(task, nextStatus(task.status)) : tick())} />
      <div className="day-body">
        <button type="button" className="day-title" onClick={onOpen}>
          <b>{task.label}</b>
          {task.status === 'in_progress' && <span className="pill now">In progress</span>}
          {timing && <span className="pill timing"><Timer size={12} />Timer on</span>}
          {focused > 0 && <span className="pill focused" title="Focus logged on this today"><Timer size={12} />{fmtMins(focused)} focused</span>}
          <span className="day-hrs">{hrs(task.hours)}</span>
        </button>
        {active ? (
          <>
            <p className="day-desc">{task.activity}</p>
            <div className="day-actions">
              <button className="primary" onClick={tick}>{ready.ok ? 'Mark done' : 'Start it'}</button>
              <button onClick={onOpen}><BookOpen size={17} />Instructions</button>
            </div>
          </>
        ) : (
          task.status !== 'completed' && <p className="day-desc short">{task.activity}</p>
        )}
      </div>
    </li>
  );
}

// XP today against the daily goal, as a ring that closes when you reach it.
function GoalRing({ value, goal }) {
  const r = 26, c = 2 * Math.PI * r, pct = Math.min(1, value / (goal || 1));
  return (
    <svg className="ring" viewBox="0 0 64 64" role="img" aria-label={`${value} of ${goal} XP today`}>
      <circle cx="32" cy="32" r={r} className="ring-track" />
      <circle cx="32" cy="32" r={r} className={'ring-fill' + (pct >= 1 ? ' full' : '')} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      <text x="32" y="30" textAnchor="middle" className="ring-n">{value}</text>
      <text x="32" y="42" textAnchor="middle" className="ring-of">of {goal}</text>
    </svg>
  );
}

// The week's targets that your phase calls for: coding from Phase 1, outreach and mocks from 3,
// applications from 4, freelance proposals from 6.
const TARGETS = [['prayerDays', 'Days of prayer', 0, 'prayer'], ['contacts', 'People contacted', 0, 'flock'], ['visits', 'Visits', 0, 'flock/visits'], ['disciplines', 'Disciplines kept', 0, 'prayer/disciplines']];
function WeekTargets() {
  const { state, sel } = useStore();
  const live = TARGETS.filter(([k, , from]) => sel.currentPhaseIdx >= from && state.weeklyTargets[k] > 0);
  return (
    <>
      <h3>This week</h3>
      {live.length === 0 ? <p className="goal-line small">Set your weekly targets in Account.</p> : (
        <ul className="targets">
          {live.map(([k, label, , to]) => {
            const n = sel.week[k], goal = state.weeklyTargets[k];
            return (
              <li key={k}>
                <a href={'#/' + to}><span>{label}</span><b className={n >= goal ? 'met' : ''}>{n} / {goal}</b></a>
                <Bar pct={(n / goal) * 100} accent={n < goal} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

const MILESTONES = { 7: 'One full week of faithfulness. Most good intentions end before this; yours didn’t.', 14: 'Two weeks in. The habit is starting to hold you up.', 21: 'Three weeks: long enough for this to be who you are, not something you are trying.', 30: 'A month of showing up. Look back at day 1 and see how far that is.', 50: 'Fifty days. Quiet, steady, and it compounds.', 100: 'One hundred days. Very few people ever get here.', 200: 'Two hundred days. This is a different person from day 1.', 365: 'One full year on the road. Remember why you started.' };
const DAILY = [
  'Faithful in little, faithful in much. One task at a time.',
  'You don’t need to feel ready. Start with stillness.',
  'Every hour in prayer is ministry, not a pause from it.',
  'He restores your soul before he leads you on.',
  'Show up, pray, serve, close the day. That’s all today asks.',
  'The shepherd you want to be is formed on days exactly like this one.',
  'Steady obedience beats sudden zeal.',
];

// The card at the top of Today, always there: a line of encouragement for the day, then the day's
// three steps, which follow what you actually do. Steps you have finished are checked, the one you
// are on is marked NOW, and each one pops when it changes.
function DayCard({ day, tasks, active, done, total }) {
  const { state, sel } = useStore();
  const phase = sel.currentPhase;
  const streak = sel.streak.current;
  const missed = day > 1 && streak === 0;
  const closed = !!state.shutdowns?.[useShutdownKey()];
  const allDone = total > 0 && done === total;

  // Phase 0 counts its 21 days; later phases run for months, so they count weeks.
  const p0 = true;
  const where = p0
    ? (sel.isSabbath ? 'Your Sabbath' : day === 1 ? 'Your first day' : `Phase ${phaseNo(phase)} · week ${sel.weekInPhase}`)
    : (sel.isSabbath ? 'Your Sabbath' : `Phase ${phaseNo(phase)} · week ${sel.weekInPhase}`);
  const title = MILESTONES[day] ? `${where} · a milestone` : missed ? `${where} · welcome back` : where;
  const line = allDone && closed ? 'Everything ticked and the day is closed. Rest well; tomorrow starts with the action you wrote down.'
    : allDone ? 'Every task is ticked. Close the day with three sentences and you are done.'
    : sel.isSabbath ? 'A day for your soul only: stillness, prayer and Scripture. No ministry work, no emails. Rest is obedience.'
    : day === 1 ? 'No ministry output before spiritual input. Here’s how a day works.'
    : MILESTONES[day] || (missed ? 'Yesterday slipped. That’s fine; what counts is that today doesn’t. Start with the first task.'
    : streak >= 2 ? `${streak} days in a row. ${DAILY[day % DAILY.length]}` : DAILY[day % DAILY.length]);

  // Three parts of the day, each finished before the next and never undone by the next:
  // 1 start a task, 2 finish them all, 3 close the day. "Now" is the first one not finished.
  const first = tasks.find(t => t.status !== 'not_started' && t.status);
  const doneOf = [!!first || done > 0, allDone, closed];
  const now = doneOf.findIndex(d => !d) + 1 || 4;
  const stateOf = (n) => (doneOf[n - 1] ? 'done' : n === now ? 'now' : 'next');
  const left = total - done;
  const steps = [
    { n: 1, label: 'Start your first task', sub: first ? `Started: ${first.label}` : active?.label },
    { n: 2, label: 'Finish today’s tasks', sub: allDone ? `All ${total} done` : `${done} of ${total} done · ${left} to go` },
    { n: 3, label: 'Close the day', sub: closed ? 'Closed. See you tomorrow' : allDone ? 'Three sentences, now' : 'Three sentences, tonight' },
  ];
  const finished = doneOf.every(Boolean);

  return (
    <div className={'intro day-card' + (MILESTONES[day] ? ' milestone' : '')}>
      <div className="dc-head">
        <b>{title}</b>
        <p className="dc-line">{line}</p>
      </div>
      <ol className={'dc-flow' + (finished ? ' all' : '')}>
        {steps.map(s => {
          const st = stateOf(s.n);
          // A new key when the state changes replays the pop animation
          return (
            <li key={`${s.n}-${st}`} className={'dc-' + st}>
              <span className="dc-n">{st === 'done' ? <Check size={15} strokeWidth={3} /> : s.n}</span>
              <span className="dc-step">
                <span className="dc-label">{s.label}{st === 'now' && <em>Now</em>}</span>
                {s.sub && <small key={s.sub}>{s.sub}</small>}
              </span>
            </li>
          );
        })}
      </ol>
      {day <= 7 && !allDone && <p className="intro-note">“Instructions” on a task shows how to do it, with space to write. Unfinished tasks carry over, so nothing is lost. The <span className="kbd">?</span> button explains any page.</p>}
    </div>
  );
}

export default function Today({ openTask }) {
  const { state, sel } = useStore();
  const advancePhase0Day = () => {};
  const toast = useToast();
  // #/today/<task id> opens that task (the header timer links here)
  const [openId, setOpenId] = useState(openTask || null);
  const closeTask = () => { setOpenId(null); if (openTask) go('today'); };
  const [showAllCarry, setShowAllCarry] = useState(false);

  const phase = sel.currentPhase;
  const tasks = sel.todaysTasks;
  const carry = tasks.filter(t => t.isCarryForward);
  const fresh = tasks.filter(t => !t.isCarryForward);
  const active = tasks.find(t => t.status === 'in_progress') || tasks.find(t => t.status !== 'completed');
  const open = tasks.find(t => t.id === openId);
  const shutdownKey = useShutdownKey();
  // The timer's task is no longer on today's list (a new day, or it moved): say so instead of failing silently
  useEffect(() => {
    if (openTask && !tasks.some(t => t.id === openTask)) { toast('That task isn’t on today’s list any more. Stop its timer from the header.'); go('today'); }
  }, [openTask]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = focusStep(sel);
  const sn = step && stepName(step);
  const prog = sel.phaseProgress(phase.id);
  const nextPhase = sel.phases[sel.currentPhaseIdx + 1];
  const allDone = tasks.length > 0 && !active;
  const title = sel.phase0DayContext?.title || sn?.title || phase.title;
  const showPrayer = sel.prayerStreak > 0;
  // Fold a long carry-over list, but never hide the task you are on.
  const carryShown = showAllCarry ? carry : carry.filter((t, i) => i < CARRY_SHOWN || t.id === active?.id);

  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const hello = state.name ? `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${state.name}. ` : '';
  const yourHours = state.dailyHours ? ` of your ${state.dailyHours}h` : '';

  return (
    <>
      <header className="dayhead">
        <div>
          <Kicker step={sel.isSabbath ? 'Sabbath' : `Week ${sel.weekInPhase}`}>Phase {phaseNo(phase)}</Kicker>
          <h1>{title}</h1>
          <p className="sub">{hello}{date}{tasks.length > 0 && ` · ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}, about ${hrs(sel.todaysHoursPlanned)}${yourHours}`}</p>
          {state.identityStatement && <p className="identity"><span className="q" aria-hidden="true">“</span>{state.identityStatement}</p>}
          <p className="verse day-verse">{VERSES[Math.floor(Date.now() / 86400000) % VERSES.length][0]}<cite>{VERSES[Math.floor(Date.now() / 86400000) % VERSES.length][1]}</cite></p>
        </div>
        {tasks.length > 0 && (
          <div className={'meter-box' + (allDone ? ' all' : '')}>
            <div className="meter-top">
              {allDone
                ? <span className="meter-done"><Check size={14} strokeWidth={3} />All done today</span>
                : <span><b>{sel.todaysDone}</b> of {sel.todaysTotal} done</span>}
              {!allDone && <span className="meter-pct">{Math.round((sel.todaysDone / sel.todaysTotal) * 100)}%</span>}
            </div>
            <div className="meter" aria-hidden="true">
              {tasks.map(t => <i key={t.id} className={t.status === 'completed' ? 'done' : t.id === active?.id ? 'active' : ''} />)}
            </div>
          </div>
        )}
      </header>

      {tasks.length > 0 && (
        <DayCard day={state.startDate ? Math.max(1, Math.round((new Date(todayKey()) - new Date(state.startDate)) / 86400000) + 1) : 1}
          tasks={tasks} active={active} done={sel.todaysDone} total={sel.todaysTotal} />
      )}

      <div className="cols">
        <div className="stack">
          <StartWith />
          <PaceNote />
          <Balance />
          {tasks.length > 0 && <OverPlanned tasks={tasks} active={active} />}
          {!state.startDate && !state.testMode ? (
            <div className="card"><Empty title="Set your start date to begin." action={<button className="primary" onClick={() => go('settings')}>Open settings</button>}>
              <p>Your daily tasks are worked out from the day you started.</p>
            </Empty></div>
          ) : tasks.length === 0 ? (
            <div className="card"><Empty title="No tasks scheduled for today." action={<a className="btn" href={href('path', phase.id)}>Open {phase.name}</a>}>
              <p>Work from the steps of your current phase instead.</p>
            </Empty></div>
          ) : (
            <>
              {allDone && (
                <div className="finished">
                  <span className="eyebrow" style={{ color: 'var(--good)' }}>All done</span>
                  <h2>Today’s work is finished.</h2>
                  {!state.shutdowns?.[shutdownKey] && (
                    <>
                      <p>One last step: close the day with three sentences, so tomorrow starts without thinking.</p>
                      <button className="primary big" style={{ marginBottom: 18 }} onClick={() => window.dispatchEvent(new Event('open-shutdown'))}>Close the day <ArrowRight size={18} /></button>
                    </>
                  )}
                  {sel.canAdvancePhase0 ? (
                    <>
                      {sel.advancedToday >= 2
                        ? <p className="warn-line">You’ve already started {sel.advancedToday} extra {sel.advancedToday === 1 ? 'day' : 'days'} today. You can keep going, but leave room for {listOf(state.profile.otherCommitments?.length ? state.profile.otherCommitments : ['rest'])}.</p>
                        : <p>You can start day {sel.effectivePhase0Day + 1} now instead of waiting for tomorrow.</p>}
                      <button className={sel.advancedToday >= 2 ? 'big' : 'primary big'} onClick={advancePhase0Day}>{sel.advancedToday >= 2 ? `Start day ${sel.effectivePhase0Day + 1} anyway` : `Start day ${sel.effectivePhase0Day + 1}`} <ArrowRight size={18} /></button>
                    </>
                  ) : <p>Rest, or read ahead in <a className="accent" href={href('path', phase.id)}>{phase.title}</a>. Tomorrow is already planned.</p>}
                </div>
              )}

              <ol className="day">
                {carry.length > 0 && (
                  <li className="day-sep warn">Carried over from earlier days · {carry.length}</li>
                )}
                {carryShown.map(t => <DayItem key={t.id} task={t} active={t.id === active?.id} onOpen={() => setOpenId(t.id)} />)}
                {carryShown.length < carry.length && (
                  <li className="day-more"><button className="ghost sm" onClick={() => setShowAllCarry(true)}>Show {carry.length - carryShown.length} more carried-over tasks</button></li>
                )}
                {carry.length > 0 && fresh.length > 0 && <li className="day-sep">Today</li>}
                {fresh.map(t => <DayItem key={t.id} task={t} active={t.id === active?.id} onOpen={() => setOpenId(t.id)} />)}
              </ol>
            </>
          )}

          {tasks.length > 0 || sel.due.length > 0 ? (
            <div className="card due-card">
              <div className="card-h"><h2>Before the day ends</h2><span className="muted small">{sel.due.length ? `${sel.due.length} due · ` : ''}{state.shutdowns?.[shutdownKey] ? 'day closed' : 'then close the day'}</span></div>
              <ul className="due-list">
                {sel.due.map(d => (
                  <li key={d.id}>
                    <a href={d.href}>
                      <span className="due-kind">{d.kind}</span>
                      <span className="t"><b>{d.label}</b>{d.sub && <small>{d.sub}</small>}</span>
                      {d.date < todayKey() && <span className="due late">{Math.round((new Date(todayKey()) - new Date(d.date)) / 86400000)}d late</span>}
                      <ChevronRight className="chev" size={18} />
                    </a>
                  </li>
                ))}
                <Shutdown />
              </ul>
            </div>
          ) : null}



          {sel.weeklyCheckpoint && (
            <div className="card">
              <div className="card-h"><h2>This week's checkpoint</h2><a href={href('review')}>Answer in review ›</a></div>
              <blockquote className="checkq">{sel.weeklyCheckpoint.question}</blockquote>
              <p className="muted small" style={{ margin: '12px 0 0' }}>By the end of the week you should be able to say yes, without notes.</p>
            </div>
          )}

          <Spark />

        </div>

        <aside className="aside rail">
          <section className="rail-card">
            <h3>Where you are</h3>
            <StageTrack phaseId={phase.id} />
            <div className="path-labels"><span>Phase {phaseNo(phase)} of {sel.phases.length - 1}</span><span>{sel.overallPct > 0 ? `${sel.overallPct}% of the plan` : 'Just starting'}</span></div>
            <p className="goal-line" style={{ marginTop: 14 }}>Becoming a <b>{GOAL.role.toLowerCase()}</b>: {GOAL.church.toLowerCase()}, {GOAL.community.toLowerCase()}.</p>
          </section>

          <section className="rail-card phase-card">
            <span className="rc-eyebrow">This phase</span>
            <a href={href('path', phase.id)} className="pc-title">{phase.title}</a>
            <div className="pc-steps" aria-label={`${prog.done} of ${prog.total} steps done`}>
              {phase.steps.map(s => <i key={s.id} className={state.stepStatus[s.id] === 'completed' ? 'done' : state.stepStatus[s.id] === 'in_progress' ? 'doing' : ''} title={stepName(s).title} />)}
            </div>
            <div className="pc-meta">
              <span><b>{prog.done}</b> of {prog.total} steps</span>
              <span><Clock size={14} />{phase.duration.replace(/\s*\(.*\)/, '')}</span>
              {phaseHoursShort(phase) && <span><Hourglass size={14} />{phaseHoursShort(phase)} a day</span>}
            </div>
            {prog.done === prog.total && nextPhase
              ? <a className="btn primary" style={{ marginTop: 14, width: '100%' }} href={href('path', phase.id)}>Phase complete: move on ›</a>
              : <a className="rc-link" href={href('path', phase.id)}>Open the phase <ArrowRight size={14} /></a>}
          </section>

          {step && sn.title !== title && (
            <section className="rail-card">
              <h3>Working on</h3>
              <a href={href('path', phase.id, step.id)} className="rail-title small-title">{sn.title}</a>
              {sn.when && <span className="muted small" style={{ display: 'block' }}>{sn.when}</span>}
              {step.completionCriteria && <p className="goal-line small" style={{ marginTop: 10 }}>{step.completionCriteria}</p>}
            </section>
          )}

          <section className="rail-card">
            <WeekTargets />
          </section>

          <section className="rail-card goal-card">
            <span className="rc-eyebrow">Today’s goal</span>
            <div className="goal-box">
              <GoalRing value={sel.xpToday} goal={state.dailyXpGoal} />
              <div className="goal-text">
                <b>{sel.xpGoalMet ? 'Goal reached' : `${state.dailyXpGoal - sel.xpToday} XP to go`}</b>
                <span>{sel.streak.activeToday ? 'Streak kept for today.' : 'Earn any XP today to keep your streak.'}</span>
                {sel.focusToday > 0 && <span>Focused {sel.focusToday >= 60 ? `${Math.floor(sel.focusToday / 60)}h ${sel.focusToday % 60}m` : `${sel.focusToday} min`} today.</span>}
              </div>
            </div>
            <div className="gc-tiles">
              <div className={'gc-tile streak' + (sel.streak.activeToday ? ' lit' : '')}>
                <Flame size={18} />
                <b>{sel.streak.current}</b>
                <small>day streak</small>
                <em>best {sel.streak.longest}</em>
              </div>
              <div className="gc-tile">
                <span className="gc-frz">{[0, 1].map(i => <Snowflake key={i} size={16} className={i < state.streakFreezes ? 'have' : ''} />)}</span>
                <b>{state.streakFreezes}</b>
                <small>{state.streakFreezes === 1 ? 'freeze' : 'freezes'}</small>
                <em>of 2</em>
              </div>
              <div className="gc-tile">
                <Award size={18} />
                <b>{sel.level.level}</b>
                <small>{sel.level.title}</small>
                <span className="gc-lv"><i style={{ width: `${sel.level.pct}%` }} /></span>
              </div>
            </div>
            <p className="gc-foot">{sel.level.span - sel.level.into} XP to level {sel.level.level + 1}{showPrayer ? ` · prayer streak ${sel.prayerStreak} ${sel.prayerStreak === 1 ? 'day' : 'days'}` : ''}</p>
          </section>
        </aside>
      </div>

      {open && <TaskSheet key={open.id} task={open} onClose={closeTask} />}
    </>
  );
}
