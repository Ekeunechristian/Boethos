// Every place in the app and every page inside it, in one list per section: the header menus,
// the footer, the phone tabs and the counts all read from here.
// Boēthos is the home page; it leads to two sections: Spoudazō (yourself, 2 Tim 2:15) and Poimainō (others, John 21:16).
import { Sun, Sunrise, HandHeart, BookOpen, Library, Flame, ListChecks, BookMarked, Leaf, UserRound, Home, Sprout, LifeBuoy,
  CalendarCheck, CalendarDays, NotebookPen, ShieldCheck, GraduationCap, Headphones, Tent,
  LayoutDashboard, Users, Church, PhoneCall, Mic, Flag, Target, BarChart3, Settings2, Footprints as Walk, Rocket, Bell, MessageCircle } from 'lucide-react';
import { REGISTERED } from '../data/ministry';
import { needAttention, callsToday, onSoulList, inChurch, presenceIndex } from '../store/ministry';

export const SECTIONS = [
  { id: 'spoudazo', label: 'Spoudazō', gloss: 'Yourself', verse: '2 Timothy 2:15', home: '#/today' },
  { id: 'poimaino', label: 'Poimainō', gloss: 'Greater Love', verse: 'John 21:16', home: '#/poimaino' },
];

// Spoudazō: your own walk with God. No phases: disciplines you keep daily and topics you choose.
const SPOUDAZO = [
  { id: 'today', label: 'Today', icon: Sun, blurb: 'Your rhythm for today', pages: [] },
  { id: 'quiet', label: 'Quiet time', icon: Sunrise, blurb: 'Alone with God each morning', pages: [
    { id: '', label: 'This morning', icon: Sunrise, desc: 'Pray, read, meditate, receive' },
    { id: 'journal', label: 'Journal', icon: NotebookPen, desc: 'Every quiet time and what you learned' },
    { id: 'character', label: 'Character', icon: ShieldCheck, desc: 'Once a month, the shepherd examined' },
  ] },
  { id: 'prayer', label: 'Prayer', icon: HandHeart, blurb: 'Prayer and fasting', pages: [
    { id: '', label: 'Prayer log', icon: Flame, desc: 'Times of prayer, prayer times, the ACTS shape' },
    { id: 'points', label: 'Prayer points', icon: ListChecks, desc: 'What to carry to God, so you never forget' },
    { id: 'fasting', label: 'Fasting', icon: Leaf, desc: 'Fast days, recurring fasts and how often you fast' },
  ] },
  { id: 'word', label: 'The Word', icon: BookOpen, blurb: 'Reading, study and your journal', pages: [
    { id: '', label: 'Bible reading', icon: BookOpen, desc: 'Your plan through the whole Bible' },
    { id: 'study', label: 'Study topics', icon: GraduationCap, desc: 'One topic at a time, and what you learn' },
    { id: 'journal', label: 'Journal', icon: BookMarked, desc: 'What you learn from the Word and your study' },
  ] },
  { id: 'library', label: 'Library', icon: Library, blurb: 'Books, messages and camps', pages: [
    { id: '', label: 'Reading', icon: Library, desc: 'The book you are reading, and your shelf' },
    { id: 'messages', label: 'Messages', icon: Headphones, desc: 'Links and notes, by topic' },
    { id: 'camps', label: 'Camps', icon: Tent, desc: 'The camps you attend, and what you received' },
    { id: 'journal', label: 'Journal', icon: NotebookPen, desc: 'What you learned from books, messages and camps' },
  ] },
];

// Poimainō places live under #/poimaino/<place>; the dashboard is #/poimaino itself.
const POIMAINO = [
  { id: 'poimaino', base: '#/poimaino', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, blurb: 'What needs you at Greater Love', pages: [
    { id: '', label: 'Action centre', icon: Bell, desc: 'Everything due, with why' },
    { id: 'vision', label: 'Vision 25', icon: Target, desc: 'Towards 25 stable members' },
    { id: 'week', label: 'Weekly review', icon: CalendarCheck, desc: 'The week: meetings, the daily rhythm, PVTI' },
    { id: 'campaigns', to: '#/poimaino/campaigns', label: 'Campaigns', icon: Flag, desc: 'The 22 emphases' },
    { id: 'settings', label: 'Settings', icon: Settings2, desc: 'Times, stages, reminders, recipients' },
  ] },
  { id: 'people', base: '#/poimaino/people', label: 'People', icon: Users, blurb: 'Everyone, once', pages: [
    { id: '', label: 'Everyone', icon: UserRound, desc: 'Members, visitors and contacts' },
    { id: 'attention', label: 'Needs attention', icon: LifeBuoy, desc: 'Absent, not contacted, or struggling' },
    { id: 'leaders', label: 'Raising leaders', icon: Rocket, desc: 'Those you are mentoring, stage by stage' },
    { id: 'care', label: 'Care', icon: ShieldCheck, desc: 'Needs shared in confidence, by review date' },
  ] },
  { id: 'services', base: '#/poimaino/services', label: 'Services', icon: Church, blurb: 'Thursday and Saturday', pages: [
    { id: '', label: 'Meetings', icon: CalendarDays, desc: 'Attendance, reports and reflection' },
    { id: 'trends', label: 'Trends', icon: BarChart3, desc: 'Thursday and Saturday over time' },
  ] },
  { id: 'followup', base: '#/poimaino/followup', label: 'Shepherding', icon: PhoneCall, blurb: 'Every day, for every sheep', pages: [
    { id: '', label: 'Follow-up queue', icon: ListChecks, desc: 'What is due, in order' },
    { id: 'telepastoring', label: 'Telepastoring', icon: PhoneCall, desc: 'Everyone on your soul list, once a week' },
    { id: 'visits', label: 'Visits', icon: Home, desc: 'Planned and completed visits' },
    { id: 'pvti', label: 'PVTI log', icon: NotebookPen, desc: 'Prayer, visitation, teaching, interaction' },
    { id: 'chat', label: 'Bacenta chat', icon: MessageCircle, desc: 'What to share, and what you shared' },
  ] },
  { id: 'evangelism', base: '#/poimaino/evangelism', label: 'Evangelism', icon: Walk, blurb: 'Every day, someone new', pages: [
    { id: '', label: 'Encounters', icon: Walk, desc: 'Gospel conversations you record' },
    { id: 'souls', label: 'Soul list', icon: Sprout, desc: 'Everyone: church, encounters, and those you pray for' },
  ] },
  { id: 'sermons', base: '#/poimaino/sermons', label: 'Sermons', icon: Mic, blurb: 'Thursday Bible study', pages: [
    { id: '', label: 'Sermons', icon: BookOpen, desc: 'Preparation from material to reflection' },
  ] },
];

const withBase = (list) => list.map(p => ({ ...p, base: p.base || `#/${p.id}` }));
export const PLACE_SETS = { spoudazo: withBase(SPOUDAZO), poimaino: withBase(POIMAINO) };
export const PLACES = PLACE_SETS.spoudazo; // kept for older imports

// Which section and place a route belongs to.
export function where(page, parts) {
  if (page === 'home' || page === 'settings') return { section: 'home', place: page, sub: parts[1] || '' };
  if (page !== 'poimaino') return { section: 'spoudazo', place: page, sub: parts[1] || '' };
  const p = parts[1] || '';
  if (!p || ['vision', 'week', 'settings'].includes(p)) return { section: 'poimaino', place: 'poimaino', sub: p };
  if (p === 'outreach') return { section: 'poimaino', place: 'evangelism', sub: '' };
  if (p === 'people' && parts[2] === 'souls') return { section: 'poimaino', place: 'evangelism', sub: 'souls' };
  if (p === 'evangelism' && parts[2] === 'invitations') return { section: 'poimaino', place: 'followup', sub: 'telepastoring' };
  if (p === 'followup' && parts[2] === 'calls') return { section: 'poimaino', place: 'followup', sub: 'telepastoring' };
  if (p === 'campaigns') return { section: 'poimaino', place: 'poimaino', sub: 'campaigns' };
  return { section: 'poimaino', place: p, sub: parts[2] || '' };
}

export const pageHref = (place, page) => {
  const p = typeof place === 'string' ? Object.values(PLACE_SETS).flat().find(x => x.id === place) : place;
  const pg = page && p?.pages.find(x => x.id === page);
  if (pg?.to) return pg.to;
  return (p?.base || `#/${place}`) + (page ? `/${page}` : '');
};

// A short live figure for each page. Keys are "place/page".
export function placeCounts(state, sel) {
  const today = new Date().toLocaleDateString('en-CA');
  const open = state.prayerRequests.filter(r => !r.answered);
  const urgent = open.filter(r => r.urgent).length;
  const left = sel.todaysTotal - sel.todaysDone;
  const m = state.ministry;
  const pm = sel.poimaino || [];
  const cat = (c) => pm.filter(x => x.cat === c).length;
  const fu = pm.filter(x => x.key.startsWith('fu:')).length;
  const stable = m.people.filter(p => p.membership === 'stable').length;
  const active = m.campaigns.filter(c => c.status === 'active').length;
  return {
    'today/': left > 0 ? { text: `${left} left`, hot: true } : { text: 'All done' },
    'quiet/': state.life.quietTimes.some(q => q.date === today) ? { text: 'Kept today' } : { text: 'Not yet today', hot: true },
    'quiet/journal': state.life.quietTimes.length ? { text: `${state.life.quietTimes.length}` } : null,
    'prayer/': state.prayerSessions.some(p => p.date === today) ? { text: 'Prayed today' } : { text: 'Not yet today', hot: true },
    'prayer/points': urgent ? { text: `${urgent} urgent`, hot: true } : open.length ? { text: `${open.length} open` } : null,
    'word/study': state.life.study.current ? { text: 'Focus set' } : { text: 'Choose a topic', hot: true },
    'word/journal': (n => n ? { text: `${n}` } : null)(state.life.bible.filter(b => b.learned).length + state.life.studyNotes.length),
    'library/': state.life.books.filter(b => b.status === 'reading').length ? { text: `${state.life.books.filter(b => b.status === 'reading').length} reading` } : null,
    'poimaino/': pm.length ? { text: `${pm.length} need you`, hot: true } : { text: 'Clear' },
    'poimaino/vision': { text: `${stable} / 25` },
    'poimaino/campaigns': cat('campaigns') ? { text: `${cat('campaigns')} due`, hot: true } : active ? { text: `${active} active` } : null,
    'people/': (idx => (n => n ? { text: `${n} people` } : null)(m.people.filter(p => inChurch(p, idx) && onSoulList(p)).length))(presenceIndex(m)),
    'people/attention': (l => l.length ? { text: l.some(x => x.level === 'critical') ? `${l.filter(x => x.level === 'critical').length} critical` : `${l.length}`, hot: true } : null)(needAttention(m, today)),
    'evangelism/souls': (n => n ? { text: `${n}` } : null)(m.people.filter(onSoulList).length),
    'services/': cat('attendance') ? { text: `${cat('attendance')} to finish`, hot: true } : null,
    'followup/': fu ? { text: `${fu} due`, hot: true } : null,
    'followup/telepastoring': (c => c.length ? (c.some(x => !x.done) ? { text: `${c.filter(x => !x.done).length} to call`, hot: true } : { text: 'Done today' }) : null)(callsToday(m, today)),
    'followup/chat': (m.chatPosts || []).some(x => x.date === today) ? { text: 'Shared today' } : { text: 'Not yet today', hot: true },
    'evangelism/': m.encounters.some(e => e.date === today) ? { text: 'Done today' } : { text: 'Not yet today', hot: true },
    'sermons/': cat('sermon') ? { text: 'Prep due', hot: true } : null,
  };
}
