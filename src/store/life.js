// Spoudazō: your own walk with God. Quiet time, prayer, fasting, the Word, study, books and messages.
// Every change goes through lifeReducer (actions start with L_); everything Today, Boēthos and the
// reminders show is read from the selectors below. Prayer sessions, requests and memory verses
// stay where they always were in the root state.
import { DEFAULT_GOALS, STUDY_TOPICS, BIBLE } from '../data/spoudazo';
import { commitmentsOf, afterBusy, busyAt } from '../lib/busy';
import { remindVerse } from './remindVerses';
import { addDays, weekdayOf, mondayOf, zonedToUtc } from './ministry';

const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function initialLife() {
  return {
    setupDone: false,
    goals: { ...DEFAULT_GOALS, reminders: { ...DEFAULT_GOALS.reminders } },
    quietTimes: [],      // { id, date, start, minutes, passage, heard, learned, apply, prayed }
    bible: [],           // { id, date, book, from, to, minutes, note }
    study: { current: null, since: null, history: [] },   // history: { topicId, from, to }
    studyNotes: [],      // { id, date, topicId, learned, scripture, apply, minutes }
    customTopics: [],    // { id, title, desc, refs: [] }
    books: [],           // { id, title, author, for: me|members, status, pages, pagesRead, started, finished, topicId, forWhom, lessons: [{date,text}] }
    readingLog: [],      // { id, date, bookId, minutes, pages }
    listening: [],       // { id, date, kind, title, speaker, minutes, takeaway, forMembers }
    fasts: [],           // { id, date, until, type, purpose, status: planned|done|broken, notes }
    prayerTimes: {},     // { 'YYYY-MM-DD': { '05:30': true } }
    examen: {},          // { 'YYYY-MM-DD': { saw, fell, tomorrow } }
    character: [],       // { id, date, ratings: { quality: 1–5 }, note, commit }
    rule: [],            // your rule of life: short commitments
    worship: {},         // { 'YYYY-MM-DD': true } when you worshipped with godly music
    qtPlan: { mode: 'bible' },  // what you last sat with in your quiet time
    customKinds: [],     // your own kinds of prayer, added to PRAYER_KINDS
    customCats: [],      // your own prayer-point categories, added to REQUEST_CATEGORIES
    customMsgCats: [],   // your own message categories, added to MESSAGE_CATS
    fastPlans: [],       // recurring fasts: { id, days: [0–6], from, until, type, purpose }
    sent: {},            // reminders already shown: { key@date: date }
  };
}

export function mergeLife(saved) {
  const base = initialLife();
  const l = saved || {};
  return { ...base, ...l, goals: { ...base.goals, ...(l.goals || {}), reminders: { ...base.goals.reminders, ...(l.goals?.reminders || {}) } }, study: { ...base.study, ...(l.study || {}) }, qtPlan: { ...base.qtPlan, ...(l.qtPlan || {}) } };
}

const upd = (list, id, data) => list.map(x => (x.id === id ? { ...x, ...data } : x));
const del = (list, id) => list.filter(x => x.id !== id);

export function lifeReducer(l, a, today) {
  switch (a.type) {
    case 'L_SETUP': return { ...l, setupDone: true, setupAt: l.setupAt || today, goals: { ...l.goals, ...a.goals, reminders: { ...l.goals.reminders, ...(a.goals?.reminders || {}) } } };
    case 'L_GOALS': return { ...l, goals: { ...l.goals, ...a.data, reminders: { ...l.goals.reminders, ...(a.data.reminders || {}) } } };

    case 'L_QUIET_ADD': return { ...l, quietTimes: [...l.quietTimes, { id: uid('qt'), date: today, ...a.data }] };
    case 'L_QUIET_UPDATE': return { ...l, quietTimes: upd(l.quietTimes, a.id, a.data) };
    case 'L_QUIET_DELETE': return { ...l, quietTimes: del(l.quietTimes, a.id) };

    case 'L_BIBLE_ADD': return { ...l, bible: [...l.bible, { id: uid('bb'), date: today, ...a.data }] };
    case 'L_BIBLE_DELETE': return { ...l, bible: del(l.bible, a.id) };

    case 'L_STUDY_SET': {
      if (l.study.current === a.topicId) return l;
      const history = l.study.current ? [...l.study.history, { topicId: l.study.current, from: l.study.since, to: today }] : l.study.history;
      return { ...l, study: { current: a.topicId, since: a.topicId ? today : null, history } };
    }
    case 'L_STUDY_NOTE': return { ...l, studyNotes: [...l.studyNotes, { id: uid('sn'), date: today, topicId: l.study.current, ...a.data }] };
    case 'L_STUDY_NOTE_DELETE': return { ...l, studyNotes: del(l.studyNotes, a.id) };
    case 'L_TOPIC_ADD': return { ...l, customTopics: [...l.customTopics, { id: uid('tp'), refs: [], ...a.data, custom: true }] };
    case 'L_TOPIC_DELETE': return { ...l, customTopics: del(l.customTopics, a.id), study: l.study.current === a.id ? { ...l.study, current: null } : l.study };

    case 'L_BOOK_ADD': return { ...l, books: [...l.books, { id: uid('bk'), for: 'me', status: 'want', pages: '', pagesRead: 0, lessons: [], ...a.data, ...(a.data.status === 'reading' ? { started: today } : {}) }] };
    case 'L_BOOK_UPDATE': return { ...l, books: l.books.map(b => {
      if (b.id !== a.id) return b;
      const n = { ...b, ...a.data };
      if (a.data.status === 'reading' && !b.started) n.started = today;
      if (a.data.status === 'finished' && b.status !== 'finished') n.finished = today;
      if (a.data.status && a.data.status !== 'finished') n.finished = '';
      return n;
    }) };
    case 'L_BOOK_DELETE': return { ...l, books: del(l.books, a.id), readingLog: l.readingLog.filter(r => r.bookId !== a.id) };
    case 'L_LESSON_ADD': return { ...l, books: l.books.map(b => (b.id === a.id ? { ...b, lessons: [...(b.lessons || []), { date: today, text: a.text }] } : b)) };
    case 'L_READ_LOG': {
      const pages = Number(a.data.pages) || 0;
      const books = l.books.map(b => (b.id === a.data.bookId ? { ...b, pagesRead: (Number(b.pagesRead) || 0) + pages, status: b.status === 'want' ? 'reading' : b.status, started: b.started || today } : b));
      return { ...l, books, readingLog: [...l.readingLog, { id: uid('rl'), date: today, ...a.data, pages }] };
    }

    case 'L_LISTEN_ADD': return { ...l, listening: [...l.listening, { id: uid('ls'), date: today, ...a.data }] };
    case 'L_LISTEN_UPDATE': return { ...l, listening: upd(l.listening, a.id, a.data) };
    case 'L_LISTEN_DELETE': return { ...l, listening: del(l.listening, a.id) };

    case 'L_FAST_ADD': {
      if (l.fasts.some(f => f.date === (a.data.date || today) && f.status !== 'broken')) return { ...l, fasts: l.fasts.map(f => (f.date === (a.data.date || today) ? { ...f, ...a.data } : f)) };
      return { ...l, fasts: [...l.fasts, { id: uid('ft'), date: today, status: 'planned', ...a.data }] };
    }
    case 'L_FAST_UPDATE': return { ...l, fasts: upd(l.fasts, a.id, a.data) };
    case 'L_FAST_DELETE': return { ...l, fasts: del(l.fasts, a.id) };
    case 'L_FAST_PLAN_ADD': return { ...l, fastPlans: [...(l.fastPlans || []), { id: uid('fp'), ...a.data }] };
    case 'L_FAST_PLAN_DELETE': return { ...l, fastPlans: del(l.fastPlans || [], a.id) };
    case 'L_KIND_ADD': return (l.customKinds || []).includes(a.name) ? l : { ...l, customKinds: [...(l.customKinds || []), a.name] };
    case 'L_KIND_DELETE': return { ...l, customKinds: (l.customKinds || []).filter(k => k !== a.name) };
    case 'L_CAT_ADD': return (l.customCats || []).includes(a.name) ? l : { ...l, customCats: [...(l.customCats || []), a.name] };
    case 'L_MSGCAT_ADD': return (l.customMsgCats || []).includes(a.name) ? l : { ...l, customMsgCats: [...(l.customMsgCats || []), a.name] };
    case 'L_CAT_DELETE': return { ...l, customCats: (l.customCats || []).filter(k => k !== a.name) };

    case 'L_PRAYER_TIME': {
      const d = a.date || today;
      const day = { ...(l.prayerTimes[d] || {}) };
      if (a.on) day[a.time] = true; else delete day[a.time];
      return { ...l, prayerTimes: { ...l.prayerTimes, [d]: day } };
    }
    case 'L_QT_PLAN': return { ...l, qtPlan: { ...(l.qtPlan || {}), ...a.data } };
    case 'L_WORSHIP': { const w = { ...(l.worship || {}) }; if (a.on) w[a.date || today] = true; else delete w[a.date || today]; return { ...l, worship: w }; }
    case 'L_EXAMEN': return { ...l, examen: { ...l.examen, [a.date || today]: a.data } };
    case 'L_CHARACTER_UPDATE': return { ...l, character: upd(l.character, a.id, a.data) };
    case 'L_CHARACTER_ADD': return { ...l, character: [...l.character, { id: uid('ch'), date: today, ...a.data }] };
    case 'L_RULE': return { ...l, rule: a.items };
    case 'L_SENT': return { ...l, sent: { ...Object.fromEntries(Object.entries(l.sent).filter(([, d]) => d >= addDays(today, -7))), [a.key]: today } };
    default: return l;
  }
}

// ── Reading it ───────────────────────────────────────────────────────────
export const allTopics = (l) => [...STUDY_TOPICS, ...(l.customTopics || [])];
export const topicOf = (l, id) => allTopics(l).find(t => t.id === id) || null;
const sum = (list, k) => list.reduce((n, x) => n + (Number(x[k]) || 0), 0);
const chaptersIn = (b) => Math.max(0, (Number(b.to) || Number(b.from) || 0) - (Number(b.from) || 0) + 1);
// A recurring fast that covers this date, if any
export const fastPlanOn = (l, date) => (l.fastPlans || []).find(p => p.from <= date && date <= p.until && p.days.includes(weekdayOf(date))) || null;
export const isFastDay = (l, date) => (l.goals.fastDays || []).includes(weekdayOf(date)) || !!fastPlanOn(l, date) || l.fasts.some(f => f.date === date && f.status !== 'broken');

// Current and best run of days, from a set of dates
export function streaks(dates, today) {
  const set = new Set(dates);
  let current = 0;
  for (let d = set.has(today) ? today : addDays(today, -1); set.has(d); d = addDays(d, -1)) current++;
  let best = 0, run = 0, prev = null;
  [...set].sort().forEach(d => { run = prev && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  return { current, best };
}

// What today asks of you, from the rhythm you set. Each item is done only when the real thing is recorded.
export function lifeToday(state, today, nowTime = '23:59') {
  const l = state.life, g = l.goals;
  const on = (d) => (x) => x.date === d;
  const out = [];
  const quiet = l.quietTimes.filter(on(today));
  out.push({ id: 'quiet', label: 'Quiet time', time: g.quietTime, sub: quiet.length ? (quiet[0].learned || quiet[0].passage || 'Kept') : `${g.quietTime ? `${g.quietTime} · ` : ''}${g.quietMinutes} minutes alone with God`, done: quiet.length > 0, href: '#/quiet' });
  const mins = sum(state.prayerSessions.filter(on(today)), 'duration');
  const times = g.prayerTimes || [];
  const kept = Object.keys(l.prayerTimes[today] || {}).filter(t => times.includes(t)).length;
  out.push({ id: 'prayer', label: 'Prayer', sub: `${mins} of ${g.prayerMinutes} minutes${times.length ? ` · ${kept} of ${times.length} prayer times` : ''}`, have: mins, goal: g.prayerMinutes, unit: 'min', done: mins >= g.prayerMinutes, href: '#/prayer', times });
  const ch = l.bible.filter(on(today)).reduce((n, b) => n + chaptersIn(b), 0);
  out.push({ id: 'bible', label: 'Bible reading', sub: `${ch} of ${g.chaptersPerDay} chapters`, have: ch, goal: g.chaptersPerDay, unit: 'ch', done: ch >= g.chaptersPerDay, href: '#/word' });
  const topic = topicOf(l, l.study.current);
  const smin = sum(l.studyNotes.filter(on(today)), 'minutes');
  out.push(topic
    ? { id: 'study', label: `Study: ${topic.title}`, time: g.studyTime, sub: `${smin} of ${g.studyMinutes} minutes · write what you learned`, have: smin, goal: g.studyMinutes, unit: 'min', done: smin >= g.studyMinutes, href: '#/word/study' }
    : { id: 'study', label: 'Choose what to study', sub: 'Pick one topic to focus on for now', done: false, href: '#/word/study' });
  const reading = l.books.find(b => b.status === 'reading' && b.for !== 'members') || l.books.find(b => b.status === 'reading');
  if (g.readingMinutes > 0) {
    const rmin = sum(l.readingLog.filter(on(today)), 'minutes');
    out.push(reading
      ? { id: 'reading', label: `Read: ${reading.title}`, sub: `${rmin} of ${g.readingMinutes} minutes`, have: rmin, goal: g.readingMinutes, unit: 'min', done: rmin >= g.readingMinutes, href: '#/library', bookId: reading.id }
      : { id: 'reading', label: 'Choose a book to read', sub: `${g.booksPerMonth} ${g.booksPerMonth === 1 ? 'book' : 'books'} a month`, done: false, href: '#/library' });
  }
  if (g.messagesPerWeek > 0) {
    const n = l.listening.filter(x => x.kind !== 'camp' && x.date >= mondayOf(today) && x.date <= today).length;
    out.push({ id: 'listen', label: 'Listen to a message', sub: `${n} of ${g.messagesPerWeek} this week`, have: n, goal: g.messagesPerWeek, unit: '', done: n >= g.messagesPerWeek, weekly: true, href: '#/library/messages' });
  }
  if (isFastDay(l, today)) {
    const f = l.fasts.find(x => x.date === today) || fastPlanOn(l, today);
    out.push({ id: 'fast', label: 'Fast today', sub: f?.status === 'done' ? 'Fast kept' : f?.status === 'broken' ? 'Broken: there is grace; try again' : `${f?.type || `Until ${g.fastUntil}`}${f?.purpose ? ` · ${f.purpose}` : ''}`, done: f?.status === 'done', href: '#/prayer/fasting' });
  }
  const ex = l.examen[today];
  out.push({ id: 'examen', label: 'Close the day', sub: ex ? 'Done' : 'Three honest lines before you sleep', done: !!ex, href: '#/today', evening: true });
  return out;
}

// Figures for Boēthos and the Spoudazō pages
export function lifeStats(state, today) {
  const l = state.life;
  const since = (n) => addDays(today, -n);
  const inLast = (n) => (x) => x.date > since(n) && x.date <= today;
  const month = today.slice(0, 7);
  const read = new Set();
  l.bible.forEach(b => { for (let c = Number(b.from) || 0; c <= (Number(b.to) || Number(b.from) || 0); c++) if (c > 0) read.add(`${b.book} ${c}`); });
  let quietStreak = 0;
  const qd = new Set(l.quietTimes.map(q => q.date));
  for (let d = qd.has(today) ? today : since(1); qd.has(d); d = addDays(d, -1)) quietStreak++;
  return {
    quiet7: new Set(l.quietTimes.filter(inLast(7)).map(q => q.date)).size, quietStreak,
    prayer7: sum(state.prayerSessions.filter(inLast(7)), 'duration'),
    chapters7: l.bible.filter(inLast(7)).reduce((n, b) => n + chaptersIn(b), 0), chaptersRead: read.size,
    study30: sum(l.studyNotes.filter(inLast(30)), 'minutes'), notes30: l.studyNotes.filter(inLast(30)).length,
    booksMonth: l.books.filter(b => (b.finished || '').startsWith(month)).length,
    listenMonth: l.listening.filter(x => x.date.startsWith(month)).length,
    fastsMonth: l.fasts.filter(f => f.status === 'done' && f.date.startsWith(month)).length,
    memorised: state.scriptureMemory.filter(v => v.status === 'memorized').length,
  };
}

// Gentle warnings from your own records (only once there is enough to go on)
export function lifeWarnings(state, today) {
  const l = state.life, g = l.goals;
  const days = (d) => (d ? Math.round((new Date(today) - new Date(d)) / 86400000) : Infinity);
  if (!l.setupDone || days(l.setupAt) < 3) return [];
  const last = (list) => list.map(x => x.date).sort().pop();
  const out = [];
  if (days(last(l.quietTimes)) >= 3) out.push({ id: 'quiet', label: `No quiet time for ${days(last(l.quietTimes)) === Infinity ? 'a while' : `${days(last(l.quietTimes))} days`}`, href: '#/quiet' });
  const p7 = state.prayerSessions.filter(p => p.date > addDays(today, -7)).reduce((n, p) => n + (Number(p.duration) || 0), 0);
  if (state.prayerSessions.length >= 3 && p7 < (g.prayerMinutes * 7) / 2) out.push({ id: 'prayer', label: `Prayer this week is under half your goal (${p7} of ${g.prayerMinutes * 7} min)`, href: '#/prayer' });
  if ((g.fastDays || []).length && l.fasts.length && days(last(l.fasts.filter(f => f.status === 'done'))) > 21) out.push({ id: 'fast', label: 'No fast kept in three weeks', href: '#/prayer/fasting' });
  if (l.study.current && l.study.since && days(l.study.since) > 14 && days(last(l.studyNotes.filter(n => n.topicId === l.study.current))) > 14) out.push({ id: 'study', label: 'Nothing written on your study topic for two weeks', href: '#/word/study' });
  return out;
}

// The whole-Bible plan: Genesis 1 to Revelation 22, in order. Reading outside the plan is kept with plan: false.
export const planEntries = (l) => l.bible.filter(b => b.plan !== false);
export function planPosition(l) {
  const nc = nextChapter(l);
  let n = 0;
  for (const [b, c] of BIBLE) { if (b === nc.book) return n + nc.chapter - 1; n += c; }
  return 0;
}
// The next n chapters of the plan, as one range per book
export function planPortion(l, n) {
  let { book, chapter } = nextChapter(l);
  const out = [];
  let i = BIBLE.findIndex(([b]) => b === book);
  while (n > 0 && i < BIBLE.length) {
    const take = Math.min(n, BIBLE[i][1] - chapter + 1);
    out.push({ book: BIBLE[i][0], from: chapter, to: chapter + take - 1 });
    n -= take; i++; chapter = 1;
  }
  return out;
}

// Next chapter of the plan, continuing from the last plan entry
export function nextChapter(l) {
  const lastEntry = [...planEntries(l)].sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id)).pop();
  if (!lastEntry) return { book: 'Genesis', chapter: 1 };
  const i = BIBLE.findIndex(([b]) => b === lastEntry.book);
  const end = Number(lastEntry.to) || Number(lastEntry.from) || 1;
  if (i >= 0 && end < BIBLE[i][1]) return { book: lastEntry.book, chapter: end + 1 };
  return { book: BIBLE[(i + 1) % BIBLE.length][0], chapter: 1 };
}

// ── Reminders for your rhythm ─────────────────────────────────────────────
// In the app: what is due now (from its time until an hour after), not yet done, not yet shown.
const mins = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
const hhmm = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
export function lifeReminders(state, today, nowTime) {
  const l = state.life, g = l.goals, r = g.reminders || {};
  if (!l.setupDone) return [];
  const busy = state.profile?.holdWhenBusy === false ? [] : commitmentsOf(state.profile);
  const items = lifeToday(state, today, nowTime);
  const done = (id) => items.find(x => x.id === id)?.done;
  const out = [];
  const due = (t0) => { const t = t0 && afterBusy(busy, today, t0); return t && mins(nowTime) >= mins(t) && mins(nowTime) < mins(t) + 60; };
  // the heads-up: from `lead` minutes before until the time itself (not if that moment falls in a commitment)
  const lead = Number(state.ministry?.settings?.reminders?.leadMinutes ?? 30);
  const soon = (t0) => { if (!lead || !t0) return false; const t = mins(afterBusy(busy, today, t0)), s = t - lead; return s >= 0 && !busyAt(busy, today, hhmm(s)) && mins(nowTime) >= s && mins(nowTime) < t; };
  const words = lifeWords(state, today, lead);
  const kindOf = (key) => (key.startsWith('prayer-') ? 'prayer' : key);
  const both = (key, cat, t) => {
    const k = kindOf(key);
    if (due(t)) out.push({ key, cat, text: words(k, key, today, false, t) });
    else if (soon(t)) out.push({ key: `${key}-soon`, cat, soon: true, text: words(k, key, today, true, t) });
  };
  if (r.quiet && !done('quiet')) both('quiet', 'quiet', g.quietTime);
  if (r.prayer) (g.prayerTimes || []).forEach(t => { if (!l.prayerTimes[today]?.[t]) both(`prayer-${t}`, 'prayer', t); });
  if (r.study && l.study.current && !done('study')) both('study', 'study', g.studyTime);
  if (r.fasting && isFastDay(l, today) && due(g.wake || '06:00')) out.push({ key: 'fast', cat: 'fasting', text: words('fast', 'fast', today, false) });
  if (r.fasting && isFastDay(l, addDays(today, 1)) && due('20:00')) out.push({ key: 'fasteve', cat: 'fasteve', text: words('fasteve', 'fasteve', today, false) });
  const points = state.prayerRequests.filter(x => !x.answered).length;
  if (r.points && points) both('points', 'points', g.pointsTime || '12:00');
  const book = l.books.find(b => b.status === 'reading' && b.for !== 'members');
  if (r.reading && book && !done('reading')) both('reading', 'reading', g.readingTime || '21:00');
  if (r.prayerLog && !done('prayer')) both('prayerlog', 'prayerlog', g.prayerLogTime || '20:00');
  return out.filter(x => !l.sent[`${x.key}@${today}`]);
}

// What each Spoudazō reminder says: the real thing, by name, with a verse that fits (changing each time)
export function lifeWords(state, today, lead = 30) {
  const l = state.life, g = l.goals;
  const portion = planPortion(l, g.chaptersPerDay || 3).map(x => `${x.book} ${x.from}${x.to > x.from ? `–${x.to}` : ''}`).join(', ');
  const topic = l.study.current && allTopics(l).find(t => t.id === l.study.current)?.title;
  const book = l.books.find(b => b.status === 'reading' && b.for !== 'members');
  const open = state.prayerRequests.filter(x => !x.answered);
  const pts = open.slice(0, 2).map(x => x.person ? `${x.person}: ${x.request}` : x.request).join('; ');
  const now = {
    quiet: `Quiet time (${g.quietTime}). Today’s reading: ${portion}.`,
    prayer: (t) => `Prayer time (${t}). Your goal today: ${Math.round((g.prayerMinutes || 180) / 60 * 10) / 10} hours.`,
    study: topic ? `Bible study: ${topic}.` : 'Bible study: choose a topic to focus on.',
    reading: book ? `Read ${book.title}${book.author ? ` by ${book.author}` : ''} (${g.readingMinutes || 20} min).` : 'Time to read.',
    points: open.length ? `Pray through your prayer points: ${pts}${open.length > 2 ? ` and ${open.length - 2} more` : ''}.` : 'Pray through your prayer points.',
    prayerlog: 'Log today’s prayer before you sleep.',
    fast: `Today is a fast day, until ${g.fastUntil || '18:00'}.`, fasteve: 'Tomorrow is a fast day.',
  };
  const soon = {
    quiet: `In ${lead} minutes: quiet time (${g.quietTime}). Today’s reading: ${portion}.`,
    prayer: (t) => `In ${lead} minutes: prayer time (${t}).`,
    study: topic ? `In ${lead} minutes: Bible study, ${topic}.` : `In ${lead} minutes: Bible study.`,
    reading: book ? `In ${lead} minutes: read ${book.title}.` : `In ${lead} minutes: reading.`,
    points: `In ${lead} minutes: pray through your prayer points.`,
    prayerlog: `In ${lead} minutes: log today’s prayer.`,
  };
  const words = (kind, key, date, isSoon, t) => {
    const w = (isSoon ? soon : now)[kind];
    const text = typeof w === 'function' ? w(t) : w;
    return `${text} ${remindVerse(kind === 'fast' || kind === 'fasteve' ? 'fasting' : kind, `${key}@${date}`).line}`;
  };
  return words;
}

// For the push server: the next 7 days, as opaque keys, a category and a time
export function lifeSchedule(state, today) {
  const l = state.life, g = l.goals, r = g.reminders || {};
  if (!l.setupDone) return [];
  const busy = state.profile?.holdWhenBusy === false ? [] : commitmentsOf(state.profile);
  const lead = Number(state.ministry?.settings?.reminders?.leadMinutes ?? 30);
  const words = lifeWords(state, today, lead);
  const tz = state.ministry.settings.timezone;
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    const kindOf = (key) => (key.startsWith('prayer-') ? 'prayer' : key.replace(/-soon$/, ''));
    const one = (key, cat, t) => { if (t && !(i === 0 && l.sent[`${key}@${d}`])) out.push({ key: `life-${key}@${d}`, cat, sendAt: zonedToUtc(d, t, tz), body: words(kindOf(key), key.replace(/-soon$/, ''), d, key.endsWith('-soon'), key.startsWith('prayer-') ? key.slice(7).replace(/-soon$/, '') : t) }); };
    const add = (key, cat, t, heads = true) => {
      if (!t) return;
      const at = afterBusy(busy, d, t); one(key, cat, at);
      const s = mins(at) - lead;
      if (heads && lead && s >= 0 && !busyAt(busy, d, hhmm(s))) one(`${key}-soon`, `${cat}~${lead}`, hhmm(s));   // "~30": a heads-up 30 minutes before
    };
    if (r.quiet && !(i === 0 && l.quietTimes.some(q => q.date === d))) add('quiet', 'quiet', g.quietTime);
    if (r.prayer) (g.prayerTimes || []).forEach(t => { if (!l.prayerTimes[d]?.[t]) add(`prayer-${t}`, 'prayer', t); });
    if (r.study && l.study.current) add('study', 'study', g.studyTime);
    if (r.fasting && isFastDay(l, d)) add('fast', 'fasting', g.wake || '06:00', false);
    if (r.fasting && isFastDay(l, addDays(d, 1))) add('fasteve', 'fasteve', '20:00', false);
    if (r.points && state.prayerRequests.some(x => !x.answered)) add('points', 'points', g.pointsTime || '12:00');
    if (r.prayerLog) add('prayerlog', 'prayerlog', g.prayerLogTime || '20:00');
    if (r.reading && l.books.some(b => b.status === 'reading' && b.for !== 'members')) add('reading', 'reading', g.readingTime || '21:00');
  }
  const now = new Date().toISOString();
  return out.filter(x => x.sendAt > now);
}
