// Campaigns that fit the Bacenta you have now, turned into this week's actions.
// The emphases come from the 22 campaigns (D, see data/ministry.js); the stages, actions and measures are app design.
import { CAMPAIGNS } from '../data/ministry';
import { mondayOf, addDays, teleWeek, needAttention, meetingList, submitted, meetingStats, presenceIndex, inChurch } from './ministry';

export const STAGES = [
  { id: 'planting', label: 'Planting', from: 1, to: 5, about: 'A few people. Pray, go out, know each person, and gather them.' },
  { id: 'growing', label: 'Growing', from: 6, to: 12, about: 'A small flock. Share the work, gather on Thursday, care one to one.' },
  { id: 'established', label: 'Established', from: 13, to: 24, about: 'A real congregation. Organise Saturday, equip, oversee.' },
  { id: 'multiplying', label: 'Multiplying', from: 25, to: Infinity, about: 'Vision 25 reached. Raise new leaders and plant again.' },
];
// Which campaigns (by number) start at which stage
export const STAGE_OF = { 1: 'planting', 2: 'planting', 4: 'planting', 6: 'planting', 14: 'planting', 15: 'planting', 16: 'planting', 18: 'planting', 19: 'planting',
  3: 'growing', 5: 'growing', 7: 'growing', 9: 'growing', 20: 'growing', 21: 'growing',
  10: 'established', 11: 'established', 13: 'established', 17: 'established', 22: 'established',
  8: 'multiplying', 12: 'multiplying' };

// What the app can measure for you, this week
export function weekFacts(state, today) {
  const m = state.ministry, mon = mondayOf(today), inWeek = (d) => d && d >= mon && d <= today;
  const enc = m.encounters.filter(e => inWeek(e.date));
  const prayerByDay = {}; (state.prayerSessions || []).filter(x => inWeek(x.date)).forEach(x => { prayerByDay[x.date] = (prayerByDay[x.date] || 0) + (Number(x.duration) || 0); });
  const tw = teleWeek(m, today);
  const index = presenceIndex(m);
  const last = (type) => { const mt = [...meetingList(m, today, 2)].reverse().find(x => x.type === type && submitted(x)); return mt ? meetingStats(m, mt, submitted(mt), index).total : 0; };
  const lastSat = [...meetingList(m, today, 2)].reverse().find(x => x.type === 'sat' && submitted(x));
  const flock = m.people.filter(p => inChurch(p, index) && !['transferred', 'departed'].includes(p.membership));
  const att = needAttention(m, today);
  return {
    size: flock.length,
    outreachDays: new Set(enc.map(e => e.date)).size, reached: new Set(enc.map(e => e.personId)).size, professions: enc.filter(e => e.profession).length,
    prayer2h: Object.values(prayerByDay).filter(n => n >= 120).length,
    teleDone: tw.filter(r => r.state === 'done').length, teleAll: tw.length,
    attention: att.length, attentionReached: att.filter(a => a.p?.lastContact >= mon).length,
    chat: (m.chatPosts || []).filter(x => inWeek(x.date)).length,
    thu: last('thu'), sat: last('sat'),
    lifts: lastSat ? Object.values(submitted(lastSat).transport || {}).filter(t => t.boarded).length : 0,
    converts: m.followUps.filter(f => f.convert && f.status === 'completed' && inWeek(f.completedAt)).length,
    convertsDue: m.followUps.filter(f => f.convert && ['planned', 'attempted'].includes(f.status)).length,
    stale: flock.filter(p => !p.lastContact || p.lastContact < addDays(today, -14)).length,
  };
}

// Each campaign, as two or three things to do this week. `got` measures from your records; without it, you tick it.
const A = (id, text, href, got, target) => ({ id, text, href, got, target });
export const ACTIONS = {
  1: [A('out3', 'Go out evangelising on 3 days', '#/poimaino/evangelism', f => f.outreachDays, 3), A('reach7', 'Share the gospel with 7 people', '#/poimaino/evangelism', f => f.reached, 7)],
  2: [A('stale', 'Speak to everyone you haven’t contacted in two weeks', '#/poimaino/people', f => Math.max(0, f.size - f.stale), f => f.size)],
  4: [A('chat2', 'Share two messages or verses in the Bacenta chat', '#/poimaino/followup/chat', f => f.chat, 2), A('discuss', 'Ask one person what they heard and how they’ll apply it')],
  6: [A('pray2h', 'Pray at least two hours on 6 days', '#/prayer', f => f.prayer2h, 6), A('prepray', 'Pray before Thursday and before each outreach')],
  14: [A('check', 'On Thursday, ask people to say one point back in their own words', '#/poimaino/sermons')],
  15: [A('pick', 'Choose one Saturday this month to fill, and tell everyone on Thursday'), A('inviteall', 'Invite everyone on your soul list for it', '#/poimaino/followup/telepastoring', f => f.teleDone, f => f.teleAll)],
  16: [A('seek', 'Reach everyone who needs attention', '#/poimaino/people/attention', f => f.attentionReached, f => f.attention)],
  18: [A('testify', 'Let one person share a testimony on Thursday or in the chat')],
  19: [A('tele', 'Telepastor everyone on your soul list', '#/poimaino/followup/telepastoring', f => f.teleDone, f => f.teleAll)],
  3: [A('serve', 'Give one willing member a responsibility, and show them how')],
  5: [A('honour', 'Teach one thing about honour, and do one thing to honour your pastor')],
  7: [A('thu10', 'Aim for 10 at Thursday Bible study', '#/poimaino/services', f => f.thu, 10)],
  9: [A('counsel', 'Meet one person one to one: listen, pray and counsel')],
  20: [A('circle', 'Ask a member to invite someone from their own circle')],
  21: [A('lifts', 'Arrange lifts so no one misses Saturday', '#/poimaino/services', f => f.lifts, 3)],
  10: [A('tools', 'Check what the Bacenta needs: a speaker, Bibles, a projector')],
  11: [A('oversee', 'Meet your helpers: who did they shepherd this week?')],
  13: [A('youth', 'Give the children and youth a mentor, and check on them')],
  17: [A('roles', 'Give Saturday its roles: welcome, ushering, follow-up')],
  22: [A('arts', 'Find someone who sings, plays or creates, and give them a place')],
  8: [A('place', 'Look for a regular meeting place that fits the numbers')],
  12: [A('lead', 'Name a leader to start a new Bacenta from this one')],
};

export const stageFor = (size) => STAGES.find(s => size >= s.from && size <= s.to) || STAGES[0];
export const campaignsAt = (stageId) => CAMPAIGNS.filter(c => STAGE_OF[c.n] === stageId);
export const activeCampaigns = (size) => { const i = STAGES.indexOf(stageFor(size)); return CAMPAIGNS.filter(c => STAGES.findIndex(s => s.id === STAGE_OF[c.n]) <= i); };

// The first month (from the Bacenta manual's start-up rhythm), measured from your records each week
export const FIRST_MONTH = [
  A('pray', 'Pray at least two hours a day', '#/prayer', f => f.prayer2h, 7),
  A('out', 'Go out on at least three weekdays', '#/poimaino/evangelism', f => f.outreachDays, 3),
  A('souls', 'Aim to lead 7 people to Christ each outreach (an aim, not a quota)', '#/poimaino/evangelism', f => f.professions, f => 7 * Math.max(1, f.outreachDays)),
  A('converts', 'Visit or call this week’s new converts', '#/poimaino/followup', f => f.converts, f => f.converts + f.convertsDue),
  A('group', 'Teach in the WhatsApp group (with people’s consent)', '#/poimaino/followup/chat', f => f.chat, 3),
  A('thu', 'Gather 10 at Thursday Bible study', '#/poimaino/services', f => f.thu, 10),
  A('sat', 'Bring 10 to Saturday church', '#/poimaino/services', f => f.sat, 10),
  A('salvation', 'Preach salvation on Thursday', '#/poimaino/sermons'),
];
export const AFTER_MONTH = ['Outreach every week', 'Visit every convert and member once a month', 'A voice contact with everyone every week (telepastoring)', 'The 527 outline (attach it in Sermons when you have it)'];

// Progress for one action: [got, target, done]
export function progress(action, facts, ticked) {
  if (!action.got) return [ticked ? 1 : 0, 1, !!ticked];
  const t = typeof action.target === 'function' ? action.target(facts) : action.target;
  const g = action.got(facts);
  return [g, t, t > 0 ? g >= t : !!ticked];
}
