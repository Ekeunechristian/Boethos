import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { ROADMAP_DATA } from '../data/roadmap';
import { RHYTHM, SUNDAY_REVIEW, FIVE_MARKS } from '../data/library';
import { eventsFor, levelFor, streakInfo, backfill, ACHIEVEMENTS, todayKey, shiftDay } from './engine';
import { initialMinistry, migrateLegacy, ministryReducer, localDay, localTime, alerts as ministryAlerts } from './ministry';
import { initialLife, mergeLife, lifeReducer, lifeToday, lifeWarnings } from './life';

// Same key as before, so everything already saved carries over.
const STORAGE_KEY = 'shepherd_os_v1';

function buildSteps() {
  const s = {};
  ROADMAP_DATA.phases.forEach(p => p.steps.forEach(step => { s[step.id] = 'not_started'; }));
  return s;
}

export const weekKey = (date = new Date()) => {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - dow + (dow === 0 ? -6 : 1));
  return d.toISOString().slice(0, 10);
};

const INITIAL = {
  // Who and where
  name: '',
  churchName: '',
  startDate: null,
  dailyHours: null,
  identityStatement: '',
  currentPhaseId: 'phase-0',
  phaseStartDates: {},
  stepStatus: buildSteps(),
  stepNotes: {},
  phaseNotes: {},

  // The flock
  members: [],          // { name, family, phone, occupation, status, leadershipStage, lastContact, prayerRequests, notes }
  visits: [],           // { date, memberId, memberName, type, notes }
  leaders: [],          // { name, stage 1–5, mentoring 1–4, nextStep, notes }
  counselingCases: [],  // { label (anonymised), tier 1–3, opened, nextSession, status, notes }

  // Prayer and the disciplines
  prayerSessions: [],   // { date, duration, category, focuses, intercessionFor, notes, scripture }
  prayerRequests: [],   // { request, person, category, urgent, answered, answeredDate }
  disciplinesLog: {},   // { [weekKey]: { [disciplineId]: true, [disciplineId + '@']: 'YYYY-MM-DD' } }
  scriptureMemory: [],  // { reference, text, category, status: learning | memorized }

  // The pulpit
  sermons: [],          // { title, passage, series, type, date, bigIdea, application, prepHours, notes, delivered }

  // ── The day ──
  dailyTasks: {},       // { 'YYYY-MM-DD': { [taskId]: 'in_progress' | 'completed' } }
  taskNotes: {},        // { 'taskId|YYYY-MM-DD': text }
  rhythm: {},           // older daily ticks, kept for history
  focus: { running: null, sessions: [] },
  shutdowns: {},
  captures: [],
  snoozed: {},
  dismissed: {},
  weeklyReviews: {},
  monthlyReviews: {},

  // ── The activity engine ──
  events: [],
  dailyXpGoal: 50,
  streakFreezes: 0,
  frozenDays: [],
  lastFreezeEarned: null,
  achievementsSeen: null,
  weeklyTargets: { prayerDays: 6, visits: 3, contacts: 5, disciplines: 4 },

  profile: {
    role: 'Pastor',
    location: '',
    sabbathDay: 1, // 0 Sunday … 6 Saturday; Monday by default, since Sunday is a working day
    otherCommitments: ['software engineering', 'piano', 'coursework'],
    links: { church: '', sermons: '' },
  },
  reminder: { enabled: false, time: '06:00' },
  lastNotified: null,
  onboardingDone: false,

  // Poimainō: Greater Love Bacenta management (people, services, follow-up, sermons, campaigns)
  ministry: initialMinistry(),

  // Spoudazō: quiet time, the Word, study, books, messages, fasting and your daily rhythm
  life: initialLife(),
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const saved = JSON.parse(raw);
    return {
      ...INITIAL,
      ...saved,
      onboardingDone: saved.onboardingDone ?? !!saved.startDate,
      stepStatus: { ...buildSteps(), ...(saved.stepStatus || {}) },
      profile: { ...INITIAL.profile, ...(saved.profile || {}), links: { ...INITIAL.profile.links, ...(saved.profile?.links || {}) } },
      focus: { ...INITIAL.focus, ...(saved.focus || {}) },
      reminder: { ...INITIAL.reminder, ...(saved.reminder || {}) },
      weeklyTargets: { ...INITIAL.weeklyTargets, ...(saved.weeklyTargets || {}) },
      events: saved.events || backfill(saved),
      life: mergeLife(saved.life),
      // The earlier Flock and Pulpit records move into Poimainō once; the old arrays are kept untouched
      ministry: migrateLegacy(saved, (() => {
        const base = initialMinistry();
        const m = saved.ministry || {};
        const stages = (m.settings?.stages || base.settings.stages).map(x => (x.n === 5 && x.unresolved ? { n: 5, label: 'Son' } : x)); // stage 5 is Son
        return { ...base, ...m, settings: { ...base.settings, ...(m.settings || {}), stages, reminders: { ...base.settings.reminders, ...(m.settings?.reminders || {}), categories: { ...base.settings.reminders.categories, ...(m.settings?.reminders?.categories || {}) } } } };
      })()),
    };
  } catch {
    return INITIAL;
  }
}

function persist(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

// Every action passes through the engine, which adds (or takes back) the XP events it earns.
function rootReducer(state, action) {
  const next = reducer(state, action);
  if (next === state) return next;
  const out = eventsFor(action, state, next);
  if (!out) return next;
  let events = next.events || [];
  if (out.remove) {
    const i = events.map(e => e.ref === out.remove && e.date === todayKey()).lastIndexOf(true);
    if (i >= 0) events = [...events.slice(0, i), ...events.slice(i + 1)];
  }
  if (out.add) events = [...events, ...out.add];
  return { ...next, events };
}

const stamp = () => todayKey();
const add = (list, prefix, data, extra = {}) => [...(list || []), { id: `${prefix}-${Date.now()}`, ...extra, ...data }];
const upd = (list, id, data) => list.map(x => (x.id === id ? { ...x, ...data } : x));
const del = (list, id) => list.filter(x => x.id !== id);

function reducer(state, action) {
  if (action.type.startsWith('L_')) {
    const next = lifeReducer(state.life, action, todayKey());
    return next === state.life ? state : { ...state, life: next };
  }
  if (action.type.startsWith('M_')) {
    const next = ministryReducer(state.ministry, action, localDay(state.ministry.settings.timezone));
    return next === state.ministry ? state : { ...state, ministry: next };
  }
  switch (action.type) {
    case 'COMPLETE_ONBOARDING': return { ...state, onboardingDone: true };
    case 'SET_PHASE': return { ...state, currentPhaseId: action.phaseId, phaseStartDates: { ...state.phaseStartDates, [action.phaseId]: state.phaseStartDates[action.phaseId] || stamp() } };
    case 'SET_START_DATE': return { ...state, startDate: action.date };
    case 'SET_CHURCH_NAME': return { ...state, churchName: action.name };
    case 'SET_IDENTITY': return { ...state, identityStatement: action.value };
    case 'SET_PROFILE': return { ...state, ...action.data };
    case 'UPDATE_PROFILE': return { ...state, profile: { ...state.profile, ...action.data, links: { ...state.profile.links, ...(action.data.links || {}) } } };
    case 'SET_STEP_STATUS': return { ...state, stepStatus: { ...state.stepStatus, [action.stepId]: action.status } };
    case 'CYCLE_STEP': {
      const cur = state.stepStatus[action.stepId] || 'not_started';
      return { ...state, stepStatus: { ...state.stepStatus, [action.stepId]: cur === 'completed' ? 'not_started' : 'completed' } };
    }
    case 'SET_STEP_NOTE': return { ...state, stepNotes: { ...state.stepNotes, [action.stepId]: action.note } };
    case 'SET_PHASE_NOTE': return { ...state, phaseNotes: { ...state.phaseNotes, [action.phaseId]: action.note } };

    // ── The day ──
    case 'SET_DAILY_TASK': {
      const d = stamp();
      return { ...state, dailyTasks: { ...state.dailyTasks, [d]: { ...(state.dailyTasks?.[d] || {}), [action.taskId]: action.status } } };
    }
    // Working on today's step puts it in progress on the Path
    case 'SYNC_STEPS': {
      if (!action.taskId?.startsWith('step-')) return state;
      const id = action.taskId.slice(5);
      const done = state.dailyTasks?.[stamp()]?.[action.taskId];
      if (!done || (state.stepStatus[id] || 'not_started') !== 'not_started') return state;
      return { ...state, stepStatus: { ...state.stepStatus, [id]: 'in_progress' } };
    }
    case 'SAVE_TASK_NOTE': return { ...state, taskNotes: { ...state.taskNotes, [`${action.taskId}|${stamp()}`]: action.note } };
    case 'SAVE_WEEKLY_REVIEW': return { ...state, weeklyReviews: { ...state.weeklyReviews, [action.date]: action.review } };
    case 'SAVE_MONTHLY_REVIEW': return { ...state, monthlyReviews: { ...(state.monthlyReviews || {}), [action.month]: action.review } };
    case 'ADD_CAPTURE': return { ...state, captures: [{ id: `c-${Date.now()}`, date: stamp(), text: action.text, source: action.source || 'today' }, ...(state.captures || [])] };
    case 'DELETE_CAPTURE': return { ...state, captures: (state.captures || []).filter(c => c.id !== action.id) };
    case 'SAVE_SHUTDOWN': return { ...state, shutdowns: { ...state.shutdowns, [action.date]: action.data } };
    case 'SNOOZE_TASK': {
      const d = stamp();
      const list = state.snoozed?.[d] || [];
      return { ...state, snoozed: { [d]: action.on ? [...new Set([...list, action.taskId])] : list.filter(x => x !== action.taskId) } };
    }
    case 'DISMISS_FOR_TODAY': return { ...state, dismissed: { ...(state.dismissed || {}), [action.key]: stamp() } };
    case 'FOCUS_START': return { ...state, focus: { ...state.focus, running: { taskId: action.taskId, label: action.label, target: action.target, startedAt: Date.now(), banked: 0, paused: false } } };
    case 'FOCUS_PAUSE': {
      const r = state.focus.running;
      return !r || r.paused ? state : { ...state, focus: { ...state.focus, running: { ...r, banked: (r.banked || 0) + (Date.now() - r.startedAt), paused: true } } };
    }
    case 'FOCUS_RESUME': {
      const r = state.focus.running;
      return !r || !r.paused ? state : { ...state, focus: { ...state.focus, running: { ...r, startedAt: Date.now(), paused: false } } };
    }
    case 'FOCUS_STOP': {
      const r = state.focus.running;
      if (!r) return state;
      const session = { date: stamp(), minutes: action.minutes, label: r.label, taskId: r.taskId };
      return { ...state, focus: { running: null, sessions: action.minutes >= 1 ? [...state.focus.sessions, session] : state.focus.sessions } };
    }
    case 'FOCUS_CANCEL': return { ...state, focus: { ...state.focus, running: null } };

    // ── The flock ──
    case 'ADD_MEMBER': return { ...state, members: add(state.members, 'm', action.data, { status: 'Growing', leadershipStage: 1 }) };
    case 'UPDATE_MEMBER': return { ...state, members: upd(state.members, action.id, action.data) };
    case 'DELETE_MEMBER': return { ...state, members: del(state.members, action.id) };
    case 'ADD_VISIT': {
      const visit = { date: stamp(), ...action.data };
      // A visit counts as contact with that person
      const members = visit.memberId ? upd(state.members, visit.memberId, { lastContact: visit.date }) : state.members;
      return { ...state, members, visits: add(state.visits, 'v', visit) };
    }
    case 'DELETE_VISIT': return { ...state, visits: del(state.visits, action.id) };
    case 'ADD_LEADER': return { ...state, leaders: add(state.leaders, 'l', action.data, { stage: 1, mentoring: 1 }) };
    case 'UPDATE_LEADER': return { ...state, leaders: upd(state.leaders, action.id, action.data) };
    case 'DELETE_LEADER': return { ...state, leaders: del(state.leaders, action.id) };
    case 'ADD_CASE': return { ...state, counselingCases: add(state.counselingCases, 'cc', action.data, { opened: stamp(), status: 'Open', tier: 1 }) };
    case 'UPDATE_CASE': return { ...state, counselingCases: upd(state.counselingCases, action.id, action.data) };
    case 'DELETE_CASE': return { ...state, counselingCases: del(state.counselingCases, action.id) };

    // ── Prayer ──
    case 'LOG_PRAYER': return { ...state, prayerSessions: add(state.prayerSessions, 'ps', action.data, { date: stamp() }) };
    case 'DELETE_PRAYER': return { ...state, prayerSessions: del(state.prayerSessions, action.id) };
    case 'ADD_PRAYER_REQUEST': return { ...state, prayerRequests: add(state.prayerRequests, 'pr', action.data, { date: stamp(), answered: false }) };
    case 'UPDATE_PRAYER_REQUEST': return { ...state, prayerRequests: upd(state.prayerRequests, action.id, { ...action.data, ...(action.data.answered ? { answeredDate: stamp() } : {}) }) };
    case 'DELETE_PRAYER_REQUEST': return { ...state, prayerRequests: del(state.prayerRequests, action.id) };
    case 'TOGGLE_DISCIPLINE': {
      const week = state.disciplinesLog[action.week] || {};
      const on = !week[action.id];
      return { ...state, disciplinesLog: { ...state.disciplinesLog, [action.week]: { ...week, [action.id]: on, [`${action.id}@`]: on ? stamp() : undefined } } };
    }
    case 'ADD_SCRIPTURE': return { ...state, scriptureMemory: add(state.scriptureMemory, 'sc', action.data, { status: 'learning', startedDate: stamp() }) };
    case 'UPDATE_SCRIPTURE': return { ...state, scriptureMemory: upd(state.scriptureMemory, action.id, action.data) };
    case 'DELETE_SCRIPTURE': return { ...state, scriptureMemory: del(state.scriptureMemory, action.id) };
    case 'REVIEW_SCRIPTURE': return { ...state, scriptureMemory: upd(state.scriptureMemory, action.id, { lastReviewed: stamp() }) };

    // ── The pulpit ──
    case 'ADD_SERMON': return { ...state, sermons: add(state.sermons, 'ser', action.data, { date: stamp(), prepHours: 0 }) };
    case 'UPDATE_SERMON': return { ...state, sermons: upd(state.sermons, action.id, action.data) };
    case 'DELETE_SERMON': return { ...state, sermons: del(state.sermons, action.id) };

    // ── Engine bookkeeping ──
    case 'SET_WEEKLY_TARGETS': return { ...state, weeklyTargets: { ...state.weeklyTargets, ...action.data } };
    case 'SET_REMINDER': return { ...state, reminder: { ...state.reminder, ...action.data } };
    case 'MARK_NOTIFIED': return { ...state, lastNotified: action.date };
    case 'SET_XP_GOAL': return { ...state, dailyXpGoal: action.xp };
    case 'USE_FREEZE': return state.streakFreezes > 0 && !state.frozenDays.includes(action.date)
      ? { ...state, streakFreezes: state.streakFreezes - 1, frozenDays: [...state.frozenDays, action.date] } : state;
    case 'EARN_FREEZE': return { ...state, streakFreezes: Math.min(2, state.streakFreezes + 1), lastFreezeEarned: action.date };
    case 'SEE_ACHIEVEMENTS': return { ...state, achievementsSeen: action.ids };
    case 'SOFT_RESET': return { ...INITIAL, onboardingDone: true, name: state.name, churchName: state.churchName, startDate: state.startDate, profile: state.profile, dailyHours: state.dailyHours, life: { ...initialLife(), setupDone: true, goals: state.life.goals } };
    case 'FULL_RESET': return { ...INITIAL };
    default: return state;
  }
}

// ── What today asks of you ──────────────────────────────────────────────────
const enrich = (t, status, extra = {}) => ({ ...t, status: status || 'not_started', ...extra });

function buildDay(state, phase, today, isSabbath) {
  const done = state.dailyTasks?.[today] || {};
  const tasks = RHYTHM.map(r => enrich(r, done[r.id]));
  if (isSabbath) return tasks; // the Sabbath is for your soul only
  // The step of your current phase you're working on
  const step = phase.steps.find(s => state.stepStatus[s.id] === 'in_progress') || phase.steps.find(s => state.stepStatus[s.id] !== 'completed');
  if (step) {
    const id = `step-${step.id}`;
    tasks.push(enrich({ id, slot: 'day', label: step.name, hours: 1, stepId: step.id,
      activity: step.description.length > 160 ? step.description.slice(0, 157).trimEnd() + '…' : step.description,
      detail: step.description, resources: (step.resources || []).map(r => (typeof r === 'string' ? { name: r, url: `https://www.google.com/search?q=${encodeURIComponent(r)}` } : r)) }, done[id]));
  }
  // People who need you (from Poimainō): crisis first
  const people = state.ministry.people;
  people.filter(m => m.careStatus === 'Crisis').concat(people.filter(m => m.careStatus === 'Struggling')).filter(m => !m.declinedContact).slice(0, 2).forEach(m => {
    const id = `care-${m.id}`;
    tasks.push(enrich({ id, slot: 'day', label: `Reach out to ${m.name}`, hours: 0.5, memberId: m.id, memberName: m.name,
      activity: `${m.careStatus}${m.lastContact ? ` · last contact ${m.lastContact}` : ''}. A call, a visit or a message today.`,
      detail: `${m.name} is marked ${m.careStatus.toLowerCase()} in Poimainō.${m.nextAction ? `\n\nNEXT ACTION:\n${m.nextAction}` : ''}\n\nAFTER YOU REACH OUT:\nWrite what you heard and what you promised. Ticking this records a completed welfare contact in Poimainō. Private care notes stay on their Poimainō page.` }, done[id]));
  });
  // The next Thursday Bible study to prepare (from Poimainō)
  const sermon = [...state.ministry.sermons].filter(x => (x.stage || 0) < 6 && x.date && x.date >= todayKey()).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (sermon) {
    const id = `sermon-${sermon.id}`;
    tasks.push(enrich({ id, slot: 'day', label: `Prepare: ${sermon.title || 'Thursday Bible study'}`, hours: 1.5, sermonId: sermon.id, prepHours: Number(sermon.prepHours) || 0,
      activity: `${sermon.scriptures ? sermon.scriptures + ' · ' : ''}Thursday ${sermon.date}. Open it in Poimainō for the stages.`,
      detail: 'One block of preparation for Thursday’s Bible study.\n\nTHE STAGES:\nReceived, reviewed, scripture study, main points, outline and applications, prayer and final preparation, preached, reflection.\n\nTicking this adds 1.5 hours to the sermon\'s preparation in Poimainō; tick the stages there.' }, done[id]));
  }
  if (new Date().getDay() === 0) tasks.push(enrich(SUNDAY_REVIEW, done[SUNDAY_REVIEW.id]));
  return tasks;
}

// Live warnings from your own logs (only once you have been going long enough for them to mean something)
function burnout(state, today) {
  const started = state.startDate ? Math.floor((Date.now() - new Date(state.startDate).getTime()) / 86400000) : 0;
  const weeks = Object.keys(state.disciplinesLog || {}).sort().reverse();
  const lastTick = (id) => weeks.map(w => state.disciplinesLog[w]?.[`${id}@`] || (state.disciplinesLog[w]?.[id] ? w : null)).find(Boolean) || null;
  const daysSince = (iso) => (iso ? Math.floor((Date.now() - new Date(iso + 'T12:00').getTime()) / 86400000) : Infinity);
  const thisWeek = weekKey();
  const pastWeeks = [1, 2, 3].map(n => shiftDay(thisWeek, -7 * n));
  const missed = (id, n) => pastWeeks.slice(0, n).every(w => !state.disciplinesLog?.[w]?.[id]);
  const longPrayer = state.prayerSessions.filter(p => Number(p.duration) >= 120).map(p => p.date).sort().pop();
  const recent = [...state.prayerSessions].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const journaling = Math.min(daysSince(lastTick('journaling')), daysSince(Object.keys(state.shutdowns || {}).sort().pop()?.slice(0, 10)), daysSince((state.captures || [])[0]?.date));
  return [
    { id: 'sabbath', on: started >= 14 && missed('sabbath', 2) },
    { id: 'extended', on: started >= 14 && Math.min(daysSince(lastTick('extended_prayer')), daysSince(longPrayer)) > 14 },
    { id: 'retreat', on: started >= 180 && Math.min(daysSince(lastTick('retreat')), daysSince(lastTick('solitude'))) > 182 },
    { id: 'journal', on: started >= 14 && journaling > 14 },
    { id: 'fasting', on: started >= 21 && missed('fasting', 3) },
    { id: 'short', on: recent.length >= 5 && recent.reduce((n, p) => n + (Number(p.duration) || 0), 0) / recent.length < 15 },
  ].filter(w => w.on).map(w => w.id);
}

function useSelectors(state) {
  return useMemo(() => {
    const phases = ROADMAP_DATA.phases;
    const today = todayKey();
    const currentPhase = phases.find(p => p.id === state.currentPhaseId) || phases[0];
    const currentPhaseIdx = phases.indexOf(currentPhase);
    const phaseProgress = (phaseId) => {
      const phase = phases.find(p => p.id === phaseId);
      if (!phase) return { done: 0, total: 0, pct: 0 };
      const total = phase.steps.length;
      const done = phase.steps.filter(s => state.stepStatus[s.id] === 'completed').length;
      return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    };
    const totalSteps = phases.reduce((s, p) => s + p.steps.length, 0);
    const doneSteps = phases.reduce((s, p) => s + p.steps.filter(st => state.stepStatus[st.id] === 'completed').length, 0);
    const overallPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
    const nextStep = currentPhase.steps.find(s => state.stepStatus[s.id] !== 'completed') || null;
    const activeStep = currentPhase.steps.find(s => state.stepStatus[s.id] === 'in_progress') || nextStep;
    const daysSinceStart = state.startDate ? Math.max(0, Math.floor((Date.now() - new Date(state.startDate).getTime()) / 86400000)) : 0;
    const monthsElapsed = Math.floor(daysSinceStart / 30.5);
    const phaseStart = state.phaseStartDates?.[currentPhase.id] || state.startDate;
    const weekInPhase = phaseStart ? Math.floor(Math.max(0, Date.now() - new Date(phaseStart).getTime()) / (7 * 86400000)) + 1 : 1;

    // The Sabbath, and the day before it
    const dow = new Date().getDay();
    const sabbathDay = state.profile?.sabbathDay ?? 1;
    const isSabbath = dow === sabbathDay;
    const sabbathTomorrow = (dow + 1) % 7 === sabbathDay;

    // Today is your rhythm from Spoudazō (the phased plan has been retired; its notes are kept)
    const allTasks = lifeToday(state, today).map(t => ({ ...t, status: t.done ? 'completed' : 'not_started' }));
    const snoozedIds = state.snoozed?.[today] || [];
    const todaysTasks = allTasks.filter(t => !snoozedIds.includes(t.id));
    const snoozedTasks = allTasks.filter(t => snoozedIds.includes(t.id));
    const todaysDone = todaysTasks.filter(t => t.status === 'completed').length;
    const todaysTotal = todaysTasks.length;
    const todaysHoursPlanned = parseFloat(todaysTasks.reduce((s, t) => s + (t.hours || 0), 0).toFixed(1));

    const focusToday = (state.focus?.sessions || []).filter(f => f.date === today).reduce((n, f) => n + f.minutes, 0);

    // Prayer
    const prayerDates = [...new Set(state.prayerSessions.map(p => p.date))].sort();
    let prayerStreak = 0;
    for (let d = prayerDates.includes(today) ? today : shiftDay(today, -1); prayerDates.includes(d); d = shiftDay(d, -1)) prayerStreak++;
    const wk = weekKey();
    const disciplinesThisWeek = Object.entries(state.disciplinesLog?.[wk] || {}).filter(([k, v]) => !k.endsWith('@') && v).length;

    // The five marks of a healthy church, each out of 100, from what you have logged
    const since = (n) => shiftDay(today, -n);
    const pct = (n, of) => Math.round(Math.min(1, of ? n / of : 0) * 100);
    const M = state.ministry;
    const flock = M.people.filter(p => ['member', 'stable'].includes(p.membership));
    const visits = M.followUps.filter(f => f.kind === 'visit' && f.status === 'completed');
    const preached = M.sermons.filter(x => (x.stage || 0) >= 6);
    const contacted30 = flock.filter(m => m.lastContact && m.lastContact >= since(30)).length;
    const marks = {
      word: Math.round(pct(preached.filter(x => x.date >= since(90)).length, 12) * 0.6 + pct(state.scriptureMemory.filter(x => x.status === 'memorized').length, 12) * 0.4),
      prayer: Math.round(pct(new Set(state.prayerSessions.filter(p => p.date >= since(14)).map(p => p.date)).size, 14) * 0.7 + pct(state.prayerRequests.filter(r => !r.answered).length, 10) * 0.3),
      community: Math.round(pct(contacted30, Math.max(1, flock.length)) * 0.6 + pct(visits.filter(v => (v.completedAt || v.due) >= since(30)).length, 12) * 0.4),
      mission: Math.round(pct(M.encounters.filter(e => e.date >= since(90)).length, 12) * 0.6 + pct(M.people.filter(p => (p.createdAt || '') >= since(90)).length, 5) * 0.4),
      leaders: Math.round(pct(M.people.filter(p => p.leader).length, 5) * 0.5 + pct(M.people.filter(p => (p.leader?.stage || 0) >= 3).length, 3) * 0.5),
    };
    const health = FIVE_MARKS.map(m => ({ ...m, score: Math.max(0, Math.min(100, marks[m.id] || 0)) }));
    const warnings = lifeWarnings(state, today);

    return {
      phases, currentPhase, currentPhaseIdx, phaseProgress, overallPct, doneSteps, totalSteps, nextStep, activeStep,
      daysSinceStart, monthsElapsed, weekInPhase, isSabbath, sabbathTomorrow,
      todaysTasks, snoozedTasks, todaysDone, todaysTotal, todaysHoursPlanned, focusToday,
      prayerStreak, disciplinesThisWeek, health, warnings,
      getTaskNote: (taskId) => state.taskNotes?.[`${taskId}|${today}`] || '',
      // Shared views also run Blueprint's day-by-day schedule, which shepherding doesn't use
      canAdvancePhase0: false, advancedToday: 0, effectivePhase0Day: null, phase0Behind: 0, carryForwardTasks: [],
      schedulePace: null, weeklyCheckpoint: null, phase1MissedYesterday: [], weekInPhase2: weekInPhase, phase0DayContext: null,
      ...engineSelectors(state, { sabbathTomorrow }),
    };
  }, [state]);
}

// What the engine knows: XP, level, the daily goal, streak, achievements, this week and what is due.
function engineSelectors(state, { sabbathTomorrow }) {
  const events = state.events || [];
  const today = todayKey();
  const xp = events.reduce((a, e) => a + (e.xp || 0), 0);
  const xpToday = events.filter(e => e.date === today).reduce((a, e) => a + (e.xp || 0), 0);
  const level = levelFor(xp);
  const streak = streakInfo(events, state.frozenDays);
  const achievements = ACHIEVEMENTS.map(a => ({ ...a, earned: !!a.test(state, { level, streak }) }));
  const now = new Date();
  const monday = shiftDay(today, -((now.getDay() + 6) % 7));
  const wkEvents = events.filter(e => e.date >= monday);
  const week = {
    prayerDays: new Set(state.prayerSessions.filter(p => p.date >= monday).map(p => p.date)).size,
    visits: state.ministry.followUps.filter(f => f.kind === 'visit' && f.status === 'completed' && (f.completedAt || '') >= monday).length,
    contacts: state.ministry.followUps.filter(f => f.status === 'completed' && f.reached !== false && (f.completedAt || '') >= monday && f.kind !== 'prayer').length,
    disciplines: Object.entries(state.disciplinesLog?.[weekKey()] || {}).filter(([k, v]) => !k.endsWith('@') && v).length,
  };

  // Everything with a date that has come round
  const daysSince = (iso) => (iso ? Math.floor((Date.now() - new Date(iso + 'T12:00').getTime()) / 86400000) : Infinity);
  const tz = state.ministry.settings.timezone;
  const pm = ministryAlerts(state.ministry, localDay(tz), localTime(tz));
  const urgent = state.prayerRequests.filter(r => r.urgent && !r.answered);
  const sessions = state.counselingCases.filter(c => c.status !== 'Closed' && c.nextSession && c.nextSession <= today);
  const isSunday = now.getDay() === 0;
  const sunday = shiftDay(monday, 6);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = now.getDate() >= daysInMonth - 1;
  const monthKey = today.slice(0, 7);
  const monthName = now.toLocaleDateString(undefined, { month: 'long' });
  const due = [
    ...(sabbathTomorrow ? [{ id: 'sabbath', kind: 'Sabbath', label: 'Tomorrow is your Sabbath', sub: 'Finish what must be finished today. Then rest completely: no ministry, no emails.', href: '#/settings', date: today }] : []),
    ...(pm.length ? [{ id: 'poimaino', kind: 'Poimainō', label: `${pm.length} ${pm.length === 1 ? 'thing needs' : 'things need'} you at Greater Love`, sub: pm.slice(0, 2).map(x => x.title).join(' · '), href: '#/poimaino', date: today }] : []),
    ...(urgent.length ? [{ id: 'urgent', kind: 'Pray', label: `${urgent.length} urgent prayer ${urgent.length === 1 ? 'request' : 'requests'}`, sub: urgent.slice(0, 3).map(r => r.text || r.request).join(', '), href: '#/prayer/requests', date: today }] : []),
    ...(isSunday && !state.weeklyReviews?.[sunday] ? [{ id: 'weekly', kind: 'Week', label: 'Write about your week', sub: 'Five questions, ten minutes', href: '#/home/reviews', date: today }] : []),
    ...(monthEnd && !state.monthlyReviews?.[monthKey] ? [{ id: 'monthly', kind: 'Month', label: `Write about ${monthName}`, sub: now.getDate() === daysInMonth ? 'Last day of the month' : 'Due by tomorrow, the last day of the month', href: '#/home/reviews', date: today }] : []),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return { xp, xpToday, level, streak, achievements, xpGoalMet: xpToday >= (state.dailyXpGoal || 50), week, due, poimaino: pm };
}

// ── Context ──────────────────────────────────────────────────────────────────
const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, null, load);
  useEffect(() => { persist(state); }, [state]);
  const sel = useSelectors(state);

  // Streak freezes: earn one at every 7 days in a row; spend one automatically on a missed yesterday.
  useEffect(() => {
    const today = todayKey(), yesterday = shiftDay(today, -1), before = shiftDay(today, -2);
    const { current, active } = sel.streak;
    if (current > 0 && current % 7 === 0 && state.lastFreezeEarned !== today && state.streakFreezes < 2) dispatch({ type: 'EARN_FREEZE', date: today });
    if (!active.has(yesterday) && active.has(before) && state.streakFreezes > 0) dispatch({ type: 'USE_FREEZE', date: yesterday });
  }, [sel.streak.current, state.streakFreezes]);

  const actions = useMemo(() => ({
    completeOnboarding: () => dispatch({ type: 'COMPLETE_ONBOARDING' }),
    setPhase:       (phaseId) => dispatch({ type: 'SET_PHASE', phaseId }),
    setStartDate:   (date) => dispatch({ type: 'SET_START_DATE', date }),
    setChurchName:  (name) => dispatch({ type: 'SET_CHURCH_NAME', name }),
    setIdentity:    (value) => dispatch({ type: 'SET_IDENTITY', value }),
    setProfile:     ({ name, dailyHours }) => dispatch({ type: 'SET_PROFILE', data: { ...(name !== undefined && { name }), ...(dailyHours !== undefined && { dailyHours }) } }),
    updateProfile:  (data) => dispatch({ type: 'UPDATE_PROFILE', data }),
    setStepStatus:  (stepId, status, opts = {}) => dispatch({ type: 'SET_STEP_STATUS', stepId, status, silent: opts.silent }),
    cycleStep:      (stepId) => dispatch({ type: 'CYCLE_STEP', stepId }),
    setStepNote:    (stepId, note) => dispatch({ type: 'SET_STEP_NOTE', stepId, note }),
    setPhaseNote:   (phaseId, note) => dispatch({ type: 'SET_PHASE_NOTE', phaseId, note }),
    // A finished task also does its real-world work: logs the contact, adds the preparation hours
    setTaskStatus:  (taskId, status, meta = {}) => {
      dispatch({ type: 'SET_DAILY_TASK', taskId, status, label: meta.label, hours: meta.hours });
      dispatch({ type: 'SYNC_STEPS', taskId });
      if (status === 'completed' && meta.memberId) {
        const key = `today-care-${meta.memberId}-${new Date().toISOString().slice(0, 10)}`;
        dispatch({ type: 'M_FOLLOW_ADD', data: { key, personId: meta.memberId, kind: 'welfare', title: 'Welfare contact from Today', due: new Date().toISOString().slice(0, 10), status: 'planned' } });
        dispatch({ type: 'M_FOLLOW_COMPLETE_BY_KEY', key });
      }
      if (status === 'completed' && meta.sermonId) dispatch({ type: 'M_SERMON_UPDATE', id: meta.sermonId, data: { prepHours: (meta.prepHours || 0) + 1.5 } });
    },
    saveTaskNote:   (taskId, note) => dispatch({ type: 'SAVE_TASK_NOTE', taskId, note }),
    saveWeeklyReview:  (date, review) => dispatch({ type: 'SAVE_WEEKLY_REVIEW', date, review }),
    saveMonthlyReview: (month, review) => dispatch({ type: 'SAVE_MONTHLY_REVIEW', month, review }),
    addCapture:     (text, source) => dispatch({ type: 'ADD_CAPTURE', text, source }),
    deleteCapture:  (id) => dispatch({ type: 'DELETE_CAPTURE', id }),
    saveShutdown:   (date, data) => dispatch({ type: 'SAVE_SHUTDOWN', date, data }),
    snoozeTask:     (taskId, on = true) => dispatch({ type: 'SNOOZE_TASK', taskId, on }),
    dismissForToday: (key) => dispatch({ type: 'DISMISS_FOR_TODAY', key }),
    startFocus:     (taskId, label, target) => dispatch({ type: 'FOCUS_START', taskId, label, target }),
    stopFocus:      (minutes, label) => dispatch({ type: 'FOCUS_STOP', minutes, label }),
    cancelFocus:    () => dispatch({ type: 'FOCUS_CANCEL' }),
    pauseFocus:     () => dispatch({ type: 'FOCUS_PAUSE' }),
    resumeFocus:    () => dispatch({ type: 'FOCUS_RESUME' }),
    addMember:      (data) => dispatch({ type: 'ADD_MEMBER', data: { addedDate: new Date().toISOString().slice(0, 10), ...data } }),
    updateMember:   (id, data) => dispatch({ type: 'UPDATE_MEMBER', id, data }),
    deleteMember:   (id) => dispatch({ type: 'DELETE_MEMBER', id }),
    addVisit:       (data) => dispatch({ type: 'ADD_VISIT', data }),
    deleteVisit:    (id) => dispatch({ type: 'DELETE_VISIT', id }),
    addLeader:      (data) => dispatch({ type: 'ADD_LEADER', data }),
    updateLeader:   (id, data) => dispatch({ type: 'UPDATE_LEADER', id, data }),
    deleteLeader:   (id) => dispatch({ type: 'DELETE_LEADER', id }),
    addCase:        (data) => dispatch({ type: 'ADD_CASE', data }),
    updateCase:     (id, data) => dispatch({ type: 'UPDATE_CASE', id, data }),
    deleteCase:     (id) => dispatch({ type: 'DELETE_CASE', id }),
    logPrayer:      (data) => dispatch({ type: 'LOG_PRAYER', data }),
    deletePrayer:   (id) => dispatch({ type: 'DELETE_PRAYER', id }),
    addPrayerRequest:    (data) => dispatch({ type: 'ADD_PRAYER_REQUEST', data }),
    updatePrayerRequest: (id, data) => dispatch({ type: 'UPDATE_PRAYER_REQUEST', id, data }),
    deletePrayerRequest: (id) => dispatch({ type: 'DELETE_PRAYER_REQUEST', id }),
    toggleDiscipline: (id, label) => dispatch({ type: 'TOGGLE_DISCIPLINE', id, label, week: weekKey() }),
    addScripture:    (data) => dispatch({ type: 'ADD_SCRIPTURE', data }),
    updateScripture: (id, data) => dispatch({ type: 'UPDATE_SCRIPTURE', id, data }),
    deleteScripture: (id) => dispatch({ type: 'DELETE_SCRIPTURE', id }),
    addSermon:       (data) => dispatch({ type: 'ADD_SERMON', data }),
    updateSermon:    (id, data) => dispatch({ type: 'UPDATE_SERMON', id, data }),
    deleteSermon:    (id) => dispatch({ type: 'DELETE_SERMON', id }),
    setWeeklyTargets: (data) => dispatch({ type: 'SET_WEEKLY_TARGETS', data }),
    setReminder:    (data) => dispatch({ type: 'SET_REMINDER', data }),
    markNotified:   (date) => dispatch({ type: 'MARK_NOTIFIED', date }),
    setXpGoal:      (xp) => dispatch({ type: 'SET_XP_GOAL', xp }),
    seeAchievements: (ids) => dispatch({ type: 'SEE_ACHIEVEMENTS', ids }),
    reviewScripture: (id) => dispatch({ type: 'REVIEW_SCRIPTURE', id }),
    life:           (type, payload = {}) => dispatch({ type: `L_${type}`, ...payload }),
    softReset:      () => dispatch({ type: 'SOFT_RESET' }),
    fullReset:      () => dispatch({ type: 'FULL_RESET' }),
    dispatch,
  }), []);

  const value = useMemo(() => ({ state, sel, ...actions }), [state, sel, actions]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
