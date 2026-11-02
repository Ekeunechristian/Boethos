// The activity engine. Every meaningful thing you do becomes one event with XP; streaks, levels,
// the daily goal, achievements, health and reminders are all read from this one log.
import { ROADMAP_DATA } from '../data/roadmap';
import { RHYTHM, SUNDAY_REVIEW } from '../data/library';

// Days are counted in your own timezone (en-CA formats as YYYY-MM-DD)
const day = (d = new Date()) => d.toLocaleDateString('en-CA');
const shift = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return day(d); };

function ev(kind, label, xp, ref) {
  const at = new Date().toISOString();
  return { id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at, date: day(), kind, label, xp, ref };
}

export const phasesOf = () => ROADMAP_DATA.phases;
const phaseOfStep = (stepId) => ROADMAP_DATA.phases.find(p => p.steps.some(s => s.id === stepId));
const phaseDone = (phase, status) => phase.steps.every(s => status[s.id] === 'completed');
const memberName = (state, id) => (state.ministry?.people || state.members || []).find(m => m.id === id)?.name;

// What an action earns, given the state before and after it. Returns { add: [...events], remove: ref } or null.
export function eventsFor(action, prev, next) {
  if (action.silent) return null;
  switch (action.type) {
    case 'SET_DAILY_TASK': {
      const date = day();
      const was = prev.dailyTasks?.[date]?.[action.taskId];
      const now = next.dailyTasks?.[date]?.[action.taskId];
      if (now === 'completed' && was !== 'completed') return { add: [ev('task', action.label || 'Finished a task', 10 + Math.round((action.hours || 0) * 5), action.taskId)] };
      if (was === 'completed' && now !== 'completed') return { remove: action.taskId };
      return null;
    }
    case 'SET_STEP_STATUS':
    case 'CYCLE_STEP': {
      const was = prev.stepStatus[action.stepId];
      const now = next.stepStatus[action.stepId];
      if (now === 'completed' && was !== 'completed') {
        const phase = phaseOfStep(action.stepId);
        const step = phase?.steps.find(s => s.id === action.stepId);
        const add = [ev('step', `Finished “${step?.name || 'a step'}”`, 50, action.stepId)];
        if (phase && phaseDone(phase, next.stepStatus) && !phaseDone(phase, prev.stepStatus)) add.push(ev('phase', `Completed Phase ${phase.id.slice(6)}: ${phase.title}`, 300, phase.id));
        return { add };
      }
      if (was === 'completed' && now !== 'completed') return { remove: action.stepId };
      return null;
    }
    case 'LOG_PRAYER': {
      const min = Number(action.data.duration) || 0;
      return { add: [ev('prayer', `Prayed ${min ? `${min} min` : ''}${action.data.category ? ` · ${action.data.category}` : ''}`.trim(), 15 + Math.min(30, Math.round(min / 4)))] };
    }
    case 'ADD_PRAYER_REQUEST':
      return { add: [ev('request', `Praying for: ${action.data.text || action.data.request || action.data.person || 'a request'}`, 3)] };
    case 'UPDATE_PRAYER_REQUEST': {
      const was = prev.prayerRequests.find(r => r.id === action.id);
      if (action.data.answered && !was?.answered) return { add: [ev('answered', `Answered: ${was?.text || was?.request || 'a prayer'}`, 20, action.id)] };
      if (action.data.answered === false && was?.answered) return { remove: action.id };
      return null;
    }
    case 'TOGGLE_DISCIPLINE': {
      const wk = action.week;
      const on = next.disciplinesLog[wk]?.[action.id];
      const ref = `${wk}|${action.id}`;
      return on ? { add: [ev('discipline', `Kept: ${action.label || action.id}`, 8, ref)] } : { remove: ref };
    }
    case 'ADD_SCRIPTURE':
      return { add: [ev('scripture', `Learning ${action.data.reference || 'a passage'}`, 5)] };
    case 'UPDATE_SCRIPTURE': {
      const was = prev.scriptureMemory.find(s => s.id === action.id);
      return action.data.status === 'memorized' && was?.status !== 'memorized' ? { add: [ev('memorized', `Memorised ${was?.reference || 'a passage'}`, 25, action.id)] } : null;
    }
    case 'ADD_SERMON':
      return { add: [ev('sermon', `Started a sermon: ${action.data.title || action.data.passage || 'untitled'}`, 10)] };
    case 'UPDATE_SERMON': {
      const was = prev.sermons.find(s => s.id === action.id);
      if (action.data.delivered && !was?.delivered) return { add: [ev('preached', `Preached: ${was?.title || was?.passage || 'a sermon'}`, 60, action.id)] };
      if (action.data.delivered === false && was?.delivered) return { remove: action.id };
      return null;
    }
    case 'ADD_VISIT':
      return { add: [ev('visit', `${action.data.type || 'Visit'}${action.data.memberName ? ` with ${action.data.memberName}` : ''}`, 15)] };
    case 'ADD_MEMBER':
      return { add: [ev('member', `Now caring for ${action.data.name || 'someone new'}`, 5)] };
    case 'UPDATE_MEMBER': {
      const was = prev.members.find(m => m.id === action.id);
      return action.data.lastContact === day() && was?.lastContact !== day() ? { add: [ev('contact', `Contacted ${was?.name || 'a member'}`, 5, action.id)] } : null;
    }
    case 'ADD_LEADER':
      return { add: [ev('leader', `Raising up ${action.data.name || 'a leader'}`, 10)] };
    case 'UPDATE_LEADER': {
      const was = prev.leaders.find(l => l.id === action.id);
      if (action.data.stage && action.data.stage > (was?.stage || 1)) return { add: [ev('leader', `${was?.name || 'A leader'} moved to stage ${action.data.stage}`, 30, action.id)] };
      if (action.data.mentoring && action.data.mentoring > (was?.mentoring || 1)) return { add: [ev('leader', `${was?.name || 'A leader'}: next mentoring phase`, 10, action.id)] };
      return null;
    }
    case 'ADD_CASE':
      return { add: [ev('care', 'Opened a counselling case', 10)] };
    case 'SAVE_WEEKLY_REVIEW':
      return prev.weeklyReviews?.[action.date] ? null : { add: [ev('review', 'Wrote the weekly review', 40, action.date)] };
    case 'SAVE_MONTHLY_REVIEW':
      return prev.monthlyReviews?.[action.month] ? null : { add: [ev('review', 'Wrote the month review', 80, action.month)] };
    // Spoudazō: your own walk with God
    case 'L_QUIET_ADD': return { add: [ev('quiet', `Quiet time${action.data.passage ? `: ${action.data.passage}` : ''}`, 20)] };
    case 'L_BIBLE_ADD': {
      const n = Math.max(1, (Number(action.data.to) || Number(action.data.from) || 0) - (Number(action.data.from) || 0) + 1);
      return { add: [ev('bible', `Read ${action.data.book} ${action.data.from}${Number(action.data.to) > Number(action.data.from) ? `–${action.data.to}` : ''}`, Math.min(25, 5 * n))] };
    }
    case 'L_STUDY_NOTE': return { add: [ev('study', `Studied${action.data.minutes ? ` ${action.data.minutes} min` : ''}`, 10 + Math.min(20, Math.round((Number(action.data.minutes) || 0) / 3)))] };
    case 'L_READ_LOG': return { add: [ev('reading', `Read ${action.data.minutes || 0} min${action.label ? ` of ${action.label}` : ''}`, 5 + Math.min(15, Math.round((Number(action.data.minutes) || 0) / 4)))] };
    case 'L_BOOK_UPDATE': {
      const was = prev.life.books.find(b => b.id === action.id);
      return action.data.status === 'finished' && was?.status !== 'finished' ? { add: [ev('book', `Finished ${was?.title || 'a book'}`, 50, action.id)] } : null;
    }
    case 'L_LISTEN_ADD': return { add: [ev('listen', `Listened: ${action.data.title || 'a message'}`, 10)] };
    case 'L_FAST_UPDATE': {
      const was = prev.life.fasts.find(f => f.id === action.id);
      if (action.data.status === 'done' && was?.status !== 'done') return { add: [ev('fast', 'Kept a fast', 30, action.id)] };
      if (was?.status === 'done' && action.data.status && action.data.status !== 'done') return { remove: action.id };
      return null;
    }
    case 'L_PRAYER_TIME': return action.on ? { add: [ev('prayertime', `Prayer time ${action.time}`, 3, `pt-${action.time}`)] } : { remove: `pt-${action.time}` };
    case 'L_WORSHIP': return action.on ? { add: [ev('worship', 'Worshipped with music', 3, `worship-${action.date || day()}`)] } : { remove: `worship-${action.date || day()}` };
    case 'L_EXAMEN': return prev.life.examen?.[action.date] ? null : { add: [ev('examen', 'Closed the day', 5, action.date)] };
    case 'L_CHARACTER_ADD': return { add: [ev('character', 'Examined my character', 15)] };
    case 'REVIEW_SCRIPTURE': {
      const was = prev.scriptureMemory.find(v => v.id === action.id);
      return was?.lastReviewed === day() ? null : { add: [ev('meditate', `Meditated on ${was?.reference || 'a verse'}`, 5, action.id)] };
    }
    case 'FOCUS_STOP': {
      const min = action.minutes || 0;
      if (min < 5) return null;
      return { add: [ev('focus', `Focused ${min} min${action.label ? ` on ${action.label}` : ''}`, Math.min(60, Math.round(min / 3)))] };
    }
    case 'SAVE_SHUTDOWN':
      return prev.shutdowns?.[action.date] ? null : { add: [ev('shutdown', 'Closed the day', 5, action.date)] };
    case 'SYNC_STEPS': {
      const add = [];
      Object.keys(next.stepStatus).forEach(id => {
        if (next.stepStatus[id] === 'completed' && prev.stepStatus[id] !== 'completed') add.push(ev('step', `Finished a step`, 50, id));
      });
      return add.length ? { add } : null;
    }
    default:
      return null;
  }
}

// ── Levels ────────────────────────────────────────────────────────────────
// Level L starts at 50·L·(L−1) XP: 100 for level 2, 300 for 3, 1000 for 5, 4500 for 10.
const startOf = (L) => 50 * L * (L - 1);
export const TITLES = [[1, 'Called'], [3, 'Disciple'], [5, 'Servant'], [8, 'Shepherd'], [12, 'Teacher'], [16, 'Overseer'], [20, 'Elder'], [25, 'Father in the faith'], [30, 'Faithful']];
export function levelFor(xp) {
  let L = 1;
  while (startOf(L + 1) <= xp) L++;
  const from = startOf(L), to = startOf(L + 1);
  return { level: L, title: TITLES.filter(([n]) => n <= L).pop()[1], into: xp - from, span: to - from, pct: Math.round(((xp - from) / (to - from)) * 100) };
}

// ── Streaks ──────────────────────────────────────────────────────────────
// A day counts if you earned XP, or if a streak freeze covered it.
export function streakInfo(events, frozenDays = []) {
  const active = new Set(events.filter(e => e.xp > 0).map(e => e.date));
  frozenDays.forEach(d => active.add(d));
  const today = day(), yesterday = shift(today, -1);
  let current = 0;
  let check = active.has(today) ? today : active.has(yesterday) ? yesterday : null;
  while (check && active.has(check)) { current++; check = shift(check, -1); }
  const dates = [...active].sort();
  let longest = 0, run = 0, last = null;
  for (const d of dates) { run = last && shift(last, 1) === d ? run + 1 : 1; longest = Math.max(longest, run); last = d; }
  return { current, longest, activeToday: active.has(today), active };
}

// ── Achievements ─────────────────────────────────────────────────────────
const count = (events, kind) => events.filter(e => e.kind === kind).length;
export const ACHIEVEMENTS = [
  { id: 'first-task', title: 'First fruits', desc: 'Earn your first XP.', test: (s) => s.events.length >= 1 },
  { id: 'streak-7', title: 'A faithful week', desc: 'Keep a 7-day streak.', test: (s, d) => d.streak.longest >= 7 },
  { id: 'streak-30', title: 'A rule of life', desc: 'Keep a 30-day streak.', test: (s, d) => d.streak.longest >= 30 },
  { id: 'streak-100', title: 'Steadfast', desc: 'Keep a 100-day streak.', test: (s, d) => d.streak.longest >= 100 },
  { id: 'quiet-7', title: 'In the morning', desc: 'Keep your quiet time 7 days.', test: (s) => new Set((s.life?.quietTimes || []).map(q => q.date)).size >= 7 },
  { id: 'quiet-40', title: 'Forty mornings', desc: 'Keep your quiet time 40 days.', test: (s) => new Set((s.life?.quietTimes || []).map(q => q.date)).size >= 40 },
  { id: 'bible-260', title: 'A New Testament through', desc: 'Read 260 chapters.', test: (s) => (s.life?.bible || []).reduce((n, b) => n + Math.max(0, (Number(b.to) || Number(b.from) || 0) - (Number(b.from) || 0) + 1), 0) >= 260 },
  { id: 'study-10', title: 'A workman approved', desc: 'Write 10 study notes.', test: (s) => (s.life?.studyNotes || []).length >= 10 },
  { id: 'book-1', title: 'Give attendance to reading', desc: 'Finish a book.', test: (s) => (s.life?.books || []).some(b => b.status === 'finished') },
  { id: 'book-12', title: 'Twelve books', desc: 'Finish 12 books.', test: (s) => (s.life?.books || []).filter(b => b.status === 'finished').length >= 12 },
  { id: 'fast-1', title: 'In secret', desc: 'Keep a fast.', test: (s) => (s.life?.fasts || []).some(f => f.status === 'done') },
  { id: 'listen-20', title: 'Faith cometh by hearing', desc: 'Listen to 20 messages.', test: (s) => (s.life?.listening || []).length >= 20 },
  { id: 'prayer-1', title: 'On your knees', desc: 'Log your first time of prayer.', test: (s) => s.prayerSessions.length >= 1 },
  { id: 'prayer-30', title: 'Prayer-saturated', desc: 'Log 30 times of prayer.', test: (s) => s.prayerSessions.length >= 30 },
  { id: 'prayer-long', title: 'Watch and pray', desc: 'Pray for two hours in one sitting.', test: (s) => s.prayerSessions.some(p => Number(p.duration) >= 120) },
  { id: 'answered-10', title: 'He hears', desc: 'Mark 10 prayers answered.', test: (s) => s.prayerRequests.filter(r => r.answered).length >= 10 },
  { id: 'scripture-12', title: 'Hidden in the heart', desc: 'Memorise 12 passages.', test: (s) => s.scriptureMemory.filter(x => x.status === 'memorized').length >= 12 },
  { id: 'sermon-1', title: 'Herald', desc: 'Preach your first sermon.', test: (s) => (s.ministry?.sermons || []).some(x => (x.stage || 0) >= 6) },
  { id: 'sermon-10', title: 'Workman of the Word', desc: 'Preach 10 sermons.', test: (s) => (s.ministry?.sermons || []).filter(x => (x.stage || 0) >= 6).length >= 10 },
  { id: 'flock-25', title: 'Knows his sheep', desc: 'Care for 25 people by name.', test: (s) => (s.ministry?.people || []).length >= 25 },
  { id: 'visits-25', title: 'House to house', desc: 'Make 25 pastoral visits.', test: (s) => (s.ministry?.followUps || []).filter(f => f.kind === 'visit' && f.status === 'completed').length >= 25 },
  { id: 'leader-1', title: 'Reproducing', desc: 'Raise up a recognised leader (leadership stage 5).', test: (s) => (s.ministry?.people || []).some(p => (p.leader?.stage || 0) >= 5) },
  { id: 'reviews-4', title: 'An honest month', desc: 'Write 4 weekly reviews.', test: (s) => Object.keys(s.weeklyReviews || {}).length >= 4 },
  { id: 'level-10', title: 'Level 10', desc: 'Reach level 10.', test: (s, d) => d.level.level >= 10 },
];

// Names for the daily tasks, for notes and history
const RHYTHM_NAMES = Object.fromEntries([...RHYTHM, SUNDAY_REVIEW].map(r => [r.id, r.label]));
export function taskName(id, state) {
  if (RHYTHM_NAMES[id]) return RHYTHM_NAMES[id];
  if (id.startsWith('step-')) return ROADMAP_DATA.phases.flatMap(p => p.steps).find(s => s.id === id.slice(5))?.name;
  if (id.startsWith('care-')) { const n = state && memberName(state, id.slice(5)); return n ? `Reach out to ${n}` : 'Pastoral care'; }
  if (id.startsWith('sermon-')) { const s = (state?.ministry?.sermons || state?.sermons || []).find(x => x.id === id.slice(7)); return s ? `Prepare: ${s.title || 'Bible study'}` : 'Sermon preparation'; }
  return undefined;
}

// Rebuild a log from history recorded before the engine existed, so streaks and XP start from the truth.
export function backfill(state) {
  const out = [];
  const at = (d) => `${d}T12:00:00.000Z`;
  (state.prayerSessions || []).forEach((p, i) => out.push({ id: `prayer-${p.date}-${i}`, at: at(p.date), date: p.date, kind: 'prayer', label: `Prayed${p.duration ? ` ${p.duration} min` : ''}`, xp: 15 }));
  (state.visits || []).forEach((v, i) => v.date && out.push({ id: `visit-${v.date}-${i}`, at: at(v.date), date: v.date, kind: 'visit', label: `${v.type || 'Visit'}${v.memberName ? ` with ${v.memberName}` : ''}`, xp: 15 }));
  (state.sermons || []).filter(s => s.delivered && s.date).forEach(s => out.push({ id: `preached-${s.id}`, at: at(s.date), date: s.date, kind: 'preached', label: `Preached: ${s.title || s.passage || 'a sermon'}`, xp: 60, ref: s.id }));
  Object.entries(state.rhythm || {}).forEach(([d, ticks]) => Object.entries(ticks || {}).forEach(([id, v]) => v && out.push({ id: `task-${d}-${id}`, at: at(d), date: d, kind: 'task', label: taskName(id, state) || 'Finished a task', xp: 10, ref: id })));
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export { day as todayKey, shift as shiftDay };
