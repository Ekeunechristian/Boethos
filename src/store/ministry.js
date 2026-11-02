// Poimainō: Greater Love Bacenta management. The ministry slice of the store, its reducer and every
// calculation the ministry pages read. All design choices here are App design (see docs/POIMAINO.md).
import { STAGES_DEFAULT, OUTREACH_DEFAULT, STABLE_CRITERIA, MILESTONES, MEETING_TYPES, CAMPAIGNS, REGISTERED, MINISTRY, pvciOf } from '../data/ministry';
import { afterBusy } from '../lib/busy';

// ── Dates: always local to your configured timezone, as YYYY-MM-DD, safe across daylight saving ──
export const defaultTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
export function localDay(tz, d = new Date()) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
  catch { return d.toISOString().slice(0, 10); }
}
export function localTime(tz, d = new Date()) {
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d); }
  catch { return d.toISOString().slice(11, 16); }
}
export const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const weekdayOf = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000);
export const mondayOf = (iso) => addDays(iso, -((weekdayOf(iso) + 6) % 7));
const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
export const meetingKey = (type, date) => `${type}:${date}`;

// ── Initial state ──
export function initialMinistry() {
  const tz = defaultTz();
  return {
    v: 1,
    settings: {
      name: MINISTRY.name,                      // your Bacenta's name (asked on the first run)
      timezone: tz,
      times: { thu: '', sat: '' },              // set by you; nothing is invented
      reportDueHours: null,                     // optional deadline after the meeting starts
      meetingsFrom: localDay(tz),               // no "missing report" alerts before you started using Poimainō
      welcomeDays: 2,                           // first-time visitor welcome window (configurable)
      absenceWeeks: 2,                          // missed meetings before a gentle check-in suggestion
      activeWeeks: 6,                           // "active" = present in this many weeks
      preServiceDay: 5,                         // telepastoring calls: Friday by default
      stages: STAGES_DEFAULT.map(s => ({ ...s })),
      outreachStatuses: [...OUTREACH_DEFAULT],
      criteria: [...STABLE_CRITERIA],
      milestones: [...MILESTONES],
      visionDeadline: '',
      baseline: { approx: MINISTRY.baseline.approx, note: MINISTRY.baseline.note, reviewedAt: '' },
      recipients: [],                           // report recipients, configured by you
      currency: 'GBP',
      weeklyGoals: { contacts: 5, visits: 2, outreach: 3, prayer: 10, teaching: 2, interaction: 10 }, // your shepherding goals each week (you set them)
      daily: { evangelism: '16:00', chat: '08:00', pvti: '19:00' }, // your daily shepherding times (reminders come from them)
      callTime: '09:00', teleTimes: ['09:00', '13:00', '18:00'],                        // telepastoring: your daily calling time; each person has a call day
      extraTypes: [],                           // additional meeting types you add
      reminders: { enabled: true, quietFrom: '22:00', quietTo: '07:00', digest: 'instant',
        categories: { attendance: true, followups: true, sermon: true, campaigns: true }, beforeMinutes: 60, afterMinutes: 120, followupTime: '09:00', leadMinutes: 30, types: {} },
    },
    people: [], encounters: [], invitations: [], meetings: {}, followUps: [], sermons: [], campaigns: [],
    alerts: {}, weekNotes: {}, deliveries: [], sentReminders: {}, migratedFrom: null,
    chatPosts: [], chatPlan: {},              // what you share in the Bacenta chat: posted (dated) and planned (by date)
  };
}

// ── One-time migration from the earlier Flock and Pulpit pages (the old records are left untouched) ──
const CARE_TO_MEMBERSHIP = { Inactive: 'member' };
export function migrateLegacy(state, m) {
  if (m.migratedFrom) return m;
  const now = localDay(m.settings.timezone);
  const people = (state.members || []).map(x => ({
    id: x.id, name: x.name || 'Unnamed', phone: x.phone || '', email: '', channel: '', contactTime: '', declinedContact: false,
    consent: {}, shepherd: '', firstContact: x.addedDate || '', joinDate: x.addedDate || '',
    membership: CARE_TO_MEMBERSHIP[x.status] || 'member',
    membershipHistory: [{ date: now, from: null, to: CARE_TO_MEMBERSHIP[x.status] || 'member', reason: 'Carried over from the earlier Flock page', by: 'migration' }],
    stage: null, stageHistory: [], outreach: 'Established', outreachHistory: [],
    careStatus: x.status || 'Growing', circumstance: '', nextAction: '', lastContact: x.lastContact || '',
    family: x.family || '', occupation: x.occupation || '', notes: '',
    restricted: { notes: x.notes ? [{ id: uid('rn'), date: now, text: x.notes }] : [], care: [] },
    prayer: x.prayerRequests ? [{ id: uid('pr'), date: now, text: x.prayerRequests, answered: false }] : [],
    leader: null, groups: [], createdAt: x.addedDate || now,
  }));
  // Leaders become people with a leadership-development record
  (state.leaders || []).forEach(l => {
    const match = people.find(p => p.name.trim().toLowerCase() === (l.name || '').trim().toLowerCase());
    const leader = { stage: l.stage || 1, mentoring: l.mentoring || 1, nextStep: l.nextStep || '', notes: l.notes || '' };
    if (match) match.leader = leader;
    else people.push({ ...blankPerson(l.name, now), id: l.id, membership: 'member', leader,
      membershipHistory: [{ date: now, from: null, to: 'member', reason: 'Carried over from the earlier Leaders page', by: 'migration' }] });
  });
  const followUps = (state.visits || []).map(v => ({
    id: v.id, personId: v.memberId || '', personName: v.memberName || '', kind: 'visit', title: v.type || 'Visit', due: v.date, status: 'completed',
    reached: true, outcome: v.notes || '', completedAt: v.date, place: v.type === 'Hospital' ? 'Other agreed place' : 'Home', purpose: v.type || '', campaignIds: [], createdAt: v.date,
  }));
  // Counselling cases become restricted care entries (anonymised labels kept as they were)
  const careCases = (state.counselingCases || []).map(c => ({ id: c.id, date: c.opened || now, need: c.label, action: c.notes || '', reviewDate: c.nextSession || '', status: c.status || 'Open', tier: c.tier || 1 }));
  const sermons = (state.sermons || []).map(x => ({
    id: x.id, title: x.title || '', date: x.date || '', received: x.date || '', source: x.series || '', stage: x.delivered ? 7 : 0, stagesDone: {},
    scriptures: x.passage || '', outline: x.bigIdea || '', notes: x.notes || '', illustrations: '', application: x.application || '', prayerPoints: '',
    attachments: [], reflection: '', prepHours: Number(x.prepHours) || 0, type: x.type || '', legacy: true,
  }));
  // Additive only: anything already in Poimainō is kept, and a legacy record is added only if its id isn't there yet
  const add = (have, extra) => [...extra.filter(x => !have.some(h => h.id === x.id)), ...have];
  return { ...m, people: add(m.people || [], people), followUps: add(m.followUps || [], followUps), sermons: add(m.sermons || [], sermons),
    careCases: add(m.careCases || [], careCases), migratedFrom: now };
}

export function blankPerson(name, today) {
  return { id: uid('p'), name: name || '', phone: '', email: '', channel: '', contactTime: '', declinedContact: false, consent: {}, shepherd: '',
    firstContact: today, joinDate: '', membership: 'contact', membershipHistory: [], stage: null, stageHistory: [], outreach: 'Added', outreachHistory: [],
    careStatus: 'Growing', circumstance: '', nextAction: '', lastContact: '', family: '', occupation: '', notes: '',
    restricted: { notes: [], care: [] }, prayer: [], leader: null, groups: [], birthday: '', location: '', area: 'bham', country: '', gifts: '', callDay: null, createdAt: today };
}

// ── Reducer: every Poimainō change goes through here ──
const histPush = (list, entry) => [...(list || []), entry];
export function ministryReducer(m, a, today) {
  switch (a.type) {
    case 'M_SETTINGS': return { ...m, settings: { ...m.settings, ...a.data, reminders: { ...m.settings.reminders, ...(a.data.reminders || {}), categories: { ...m.settings.reminders.categories, ...(a.data.reminders?.categories || {}) }, types: { ...(m.settings.reminders.types || {}), ...(a.data.reminders?.types || {}) } } } };

    // People
    case 'M_PERSON_ADD': {
      const p = { ...blankPerson(a.data.name, today), ...a.data, id: a.data.id || uid('p') };
      if (p.membership) p.membershipHistory = [{ date: today, from: null, to: p.membership, reason: a.reason || 'Added', by: 'you' }];
      if (p.stage !== null && p.stage !== undefined && p.stage !== '') p.stageHistory = [{ date: today, from: null, to: Number(p.stage), reason: a.reason || '', by: 'you' }];
      else p.stage = null;
      if (isTeleSoul(p) && ![0, 1, 2, 3, 4, 5, 6].includes(p.callDay)) p.callDay = leastBusyDay(m, p);
      return { ...m, people: [...m.people, p] };
    }
    case 'M_PERSON_UPDATE': {
      return { ...m, people: m.people.map(p => {
        if (p.id !== a.id) return p;
        const n = { ...p, ...a.data };
        // Status changes keep a dated history with your reason
        if ('membership' in a.data && a.data.membership !== p.membership) n.membershipHistory = histPush(p.membershipHistory, { date: a.date || today, from: p.membership, to: a.data.membership, reason: a.reason || '', by: 'you' });
        if ('stage' in a.data) {
          const to = a.data.stage === '' || a.data.stage === null || a.data.stage === undefined ? null : Number(a.data.stage);
          n.stage = to;
          if (to !== p.stage) n.stageHistory = histPush(p.stageHistory, { date: today, from: p.stage, to, reason: a.reason || '', notes: a.notes || '', by: 'you' });
        }
        if ('outreach' in a.data && a.data.outreach !== p.outreach) n.outreachHistory = histPush(p.outreachHistory, { date: today, from: p.outreach, to: a.data.outreach, by: 'you' });
        // moving to or from Birmingham moves their telepastoring day to one that meets their deadline
        if ('area' in a.data && !('callDay' in a.data) && isTeleSoul(n) && !teleDaysFor(n).includes(n.callDay)) n.callDay = leastBusyDay(m, n);
        return n;
      }) };
    }
    case 'M_PERSON_DELETE': {
      // Deleting a person removes their personal records (correction/erasure); service totals keep their counts in submitted versions.
      const meetings = Object.fromEntries(Object.entries(m.meetings).map(([k, mt]) => { const e = { ...mt.entries }; delete e[a.id]; const t = { ...(mt.transport || {}) }; delete t[a.id]; return [k, { ...mt, entries: e, transport: t }]; }));
      return { ...m, people: m.people.filter(p => p.id !== a.id), encounters: m.encounters.filter(x => x.personId !== a.id), invitations: m.invitations.filter(x => x.personId !== a.id),
        followUps: m.followUps.filter(x => x.personId !== a.id), meetings };
    }
    // Explicit merge: everything that pointed at `from` now points at `into`; histories are joined, never lost.
    case 'M_PERSON_MERGE': {
      const into = m.people.find(p => p.id === a.into), from = m.people.find(p => p.id === a.from);
      if (!into || !from || into.id === from.id) return m;
      const fill = (k) => into[k] || from[k];
      const merged = { ...into, phone: fill('phone'), email: fill('email'), channel: fill('channel'), family: fill('family'), occupation: fill('occupation'),
        firstContact: [into.firstContact, from.firstContact].filter(Boolean).sort()[0] || '', lastContact: [into.lastContact, from.lastContact].filter(Boolean).sort().pop() || '',
        notes: [into.notes, from.notes].filter(Boolean).join('\n'),
        membershipHistory: [...(into.membershipHistory || []), ...(from.membershipHistory || [])].sort((x, y) => (x.date || '').localeCompare(y.date || '')),
        stageHistory: [...(into.stageHistory || []), ...(from.stageHistory || [])].sort((x, y) => (x.date || '').localeCompare(y.date || '')),
        restricted: { notes: [...into.restricted.notes, ...from.restricted.notes], care: [...into.restricted.care, ...from.restricted.care] },
        prayer: [...into.prayer, ...from.prayer], groups: [...new Set([...(into.groups || []), ...(from.groups || [])])], mergedIds: [...(into.mergedIds || []), from.id],
        membershipHistoryNote: undefined };
      merged.membershipHistory = histPush(merged.membershipHistory, { date: today, from: into.membership, to: into.membership, reason: `Merged with ${from.name}`, by: 'you' });
      const re = (x) => (x.personId === from.id ? { ...x, personId: into.id } : x);
      const meetings = Object.fromEntries(Object.entries(m.meetings).map(([k, mt]) => {
        const e = { ...mt.entries };
        if (e[from.id]) { if (!e[into.id] || e[from.id] === 'present') e[into.id] = e[from.id]; delete e[from.id]; } // one record per person per service
        const t = { ...(mt.transport || {}) };
        if (t[from.id]) { t[into.id] = t[into.id] || t[from.id]; delete t[from.id]; }
        return [k, { ...mt, entries: e, transport: t }];
      }));
      return { ...m, people: m.people.filter(p => p.id !== from.id).map(p => (p.id === into.id ? merged : p)),
        encounters: m.encounters.map(re), invitations: m.invitations.map(re), followUps: m.followUps.map(re), meetings,
        campaigns: m.campaigns.map(c => ({ ...c, participants: [...new Set((c.participants || []).map(id => (id === from.id ? into.id : id)))] })) };
    }
    case 'M_RESTRICTED_ADD': return { ...m, people: m.people.map(p => (p.id === a.id ? { ...p, restricted: { ...p.restricted, [a.kind]: [...(p.restricted[a.kind] || []), { id: uid('r'), date: today, ...a.data }] } } : p)) };
    case 'M_RESTRICTED_UPDATE': return { ...m, people: m.people.map(p => (p.id === a.id ? { ...p, restricted: { ...p.restricted, [a.kind]: p.restricted[a.kind].map(x => (x.id === a.itemId ? { ...x, ...a.data } : x)) } } : p)) };
    case 'M_RESTRICTED_DELETE': return { ...m, people: m.people.map(p => (p.id === a.id ? { ...p, restricted: { ...p.restricted, [a.kind]: p.restricted[a.kind].filter(x => x.id !== a.itemId) } } : p)) };
    case 'M_PRAYER_ADD': return { ...m, people: m.people.map(p => (p.id === a.id ? { ...p, prayer: [...p.prayer, { id: uid('pr'), date: today, answered: false, ...a.data }] } : p)) };
    case 'M_PRAYER_UPDATE': return { ...m, people: m.people.map(p => (p.id === a.id ? { ...p, prayer: p.prayer.map(x => (x.id === a.itemId ? { ...x, ...a.data } : x)) } : p)) };

    // Outreach encounters and invitations (one event, many campaign links, counted once)
    case 'M_ENCOUNTER_ADD': return { ...m, encounters: [...m.encounters, { id: uid('enc'), date: today, campaignIds: [], ...a.data }] };
    case 'M_ENCOUNTER_UPDATE': return { ...m, encounters: m.encounters.map(x => (x.id === a.id ? { ...x, ...a.data } : x)) };
    case 'M_ENCOUNTER_DELETE': return { ...m, encounters: m.encounters.filter(x => x.id !== a.id) };
    case 'M_INVITE_ADD': {
      // One invitation per person per meeting
      if (a.data.meetingKey && m.invitations.some(x => x.personId === a.data.personId && x.meetingKey === a.data.meetingKey)) return m;
      return { ...m, invitations: [...m.invitations, { id: uid('inv'), date: today, status: 'invited', campaignIds: [], ...a.data }] };
    }
    case 'M_INVITE_UPDATE': return { ...m, invitations: m.invitations.map(x => (x.id === a.id ? { ...x, ...a.data } : x)) };
    case 'M_INVITE_DELETE': return { ...m, invitations: m.invitations.filter(x => x.id !== a.id) };

    // Meetings and attendance
    case 'M_MEETING_SET': {
      const cur = m.meetings[a.key] || newMeeting(a.key);
      const next = { ...cur, ...a.data };
      // Editing a submitted report starts an amendment; the submitted versions stay in history
      return { ...m, meetings: { ...m.meetings, [a.key]: next } };
    }
    case 'M_ATTEND': {
      const cur = m.meetings[a.key] || newMeeting(a.key);
      const entries = { ...cur.entries };
      if (a.value === null) delete entries[a.personId]; else entries[a.personId] = a.value;
      const report = cur.report?.state === 'submitted' || cur.report?.state === 'amended' ? { ...cur.report, editing: true } : { ...(cur.report || { versions: [] }), state: 'draft' };
      return { ...m, meetings: { ...m.meetings, [a.key]: { ...cur, status: 'held', entries, report } } };
    }
    case 'M_TRANSPORT': {
      const cur = m.meetings[a.key] || newMeeting(a.key);
      const t = { ...(cur.transport || {}) };
      if (a.value === null) delete t[a.personId]; else t[a.personId] = { ...(t[a.personId] || {}), ...a.value };
      return { ...m, meetings: { ...m.meetings, [a.key]: { ...cur, transport: t } } };
    }
    case 'M_SUBMIT': {
      const cur = m.meetings[a.key] || newMeeting(a.key);
      const versions = cur.report?.versions || [];
      // Idempotent: submitting the same content twice does not add a version
      const snap = { entries: { ...cur.entries }, anonymous: Number(cur.anonymous) || 0, transport: { ...(cur.transport || {}) } };
      const last = versions[versions.length - 1];
      if (last && JSON.stringify({ e: last.entries, a: last.anonymous, t: last.transport }) === JSON.stringify({ e: snap.entries, a: snap.anonymous, t: snap.transport })) {
        return { ...m, meetings: { ...m.meetings, [a.key]: { ...cur, status: 'held', report: { ...cur.report, editing: false } } } };
      }
      const version = { n: versions.length + 1, at: new Date().toISOString(), ...snap, note: a.note || '' };
      return { ...m, meetings: { ...m.meetings, [a.key]: { ...cur, status: 'held', report: { state: versions.length ? 'amended' : 'submitted', versions: [...versions, version], editing: false } } } };
    }

    // Follow-up queue (calls, messages, invitations, welcome, welfare, pastoral, visits)
    case 'M_FOLLOW_ADD': {
      // Generated items carry a key so the same suggestion is never created twice
      if (a.data.key && m.followUps.some(f => f.key === a.data.key)) return m;
      return { ...m, followUps: [...m.followUps, { id: uid('fu'), status: 'planned', priority: 'normal', campaignIds: [], createdAt: today, ...a.data }] };
    }
    case 'M_FOLLOW_UPDATE': return { ...m, followUps: m.followUps.map(f => (f.id === a.id ? { ...f, ...a.data } : f)) };
    // PVCI done just now: a completed follow-up, counted once
    case 'M_PVCI': {
      const reached = a.reached !== false;
      const f = { id: uid('fu'), personId: a.personId || '', kind: a.kind, title: a.title || '', due: today, status: 'completed', completedAt: today, reached, outcome: a.note || '', priority: 'normal', campaignIds: [], createdAt: today, quick: true, ...(a.rota ? { rota: today } : {}) };
      const people = reached && a.kind !== 'prayer' ? m.people.map(p => (p.id === a.personId ? { ...p, lastContact: today } : p)) : m.people;
      return { ...m, followUps: [...m.followUps, f], people };
    }
    // Telepastoring: one contact (call or message). No response books a retry; a response can carry an invitation and a follow-up.
    case 'M_TELE': {
      const responded = !!a.responded;
      const base = { personId: a.personId, priority: 'normal', campaignIds: [], createdAt: today };
      // an open retry for this person is answered by this contact
      let followUps = m.followUps.map(f => (f.personId === a.personId && f.teleRetry && ['planned', 'attempted'].includes(f.status)
        ? { ...f, status: responded ? 'completed' : 'cancelled', completedAt: today, reached: responded, outcome: responded ? 'Responded' : 'Tried again' } : f));
      followUps.push({ ...base, id: uid('fu'), kind: a.way === 'message' ? 'message' : 'call', title: 'Telepastoring', due: today, status: 'completed', completedAt: today,
        reached: responded, outcome: a.note || (responded ? '' : 'No response'), attempts: [{ date: today, note: responded ? 'Responded' : 'No response' }], teleRec: true, rota: today, quick: true });
      if (!responded && a.retry?.date) followUps.push({ ...base, id: uid('fu'), kind: a.retry.way === 'message' ? 'message' : 'call', due: a.retry.date, time: a.retry.time || '', status: 'planned', teleRetry: true,
        title: a.retry.way === 'message' ? 'No response: send a message' : 'No response: call again' });
      if (responded && (a.next?.title || '').trim()) followUps.push({ ...base, id: uid('fu'), kind: a.next.kind || 'call', title: a.next.title.trim(), due: a.next.date || addDays(today, 2), status: 'planned', fromTele: true });
      let invitations = m.invitations;
      if (responded && a.invite) {
        const meetingKey = a.invite === 'near' ? '' : a.invite;
        const status = a.coming === 'yes' ? 'confirmed' : a.coming === 'no' ? 'declined' : 'invited';
        const same = invitations.find(i => i.personId === a.personId && (meetingKey ? i.meetingKey === meetingKey : i.kind === 'near' && i.date === today));
        invitations = same ? invitations.map(i => (i === same ? { ...i, status } : i))
          : [...invitations, { id: uid('inv'), personId: a.personId, date: today, meetingKey, status, campaignIds: [], via: 'tele', ...(a.invite === 'near' ? { kind: 'near' } : {}) }];
      }
      const people = responded ? m.people.map(p => (p.id === a.personId ? { ...p, lastContact: today } : p)) : m.people;
      return { ...m, followUps, invitations, people };
    }
    // The Bacenta chat: what you plan to share, and what you shared
    case 'M_CHAT_PLAN': { const plan = { ...(m.chatPlan || {}) }; if ((a.text || '').trim()) plan[a.date] = a.text; else delete plan[a.date]; return { ...m, chatPlan: plan }; }
    case 'M_CHAT_POST': return { ...m, chatPosts: [...(m.chatPosts || []), { id: uid('chat'), date: today, text: a.text || '' }] };
    case 'M_CHAT_DELETE': return { ...m, chatPosts: (m.chatPosts || []).filter(x => x.id !== a.id) };
    // Telepastoring rota: give everyone without a call day the least-busy day, Monday to Saturday
    // Telepastoring days by the rules: Birmingham Monday to Wednesday (before Thursday), everyone else Thursday or Friday (before the weekend)
    case 'M_CALLDAYS_SPREAD': {
      const load = [0, 0, 0, 0, 0, 0, 0];
      const ok = (p) => teleDaysFor(p).includes(p.callDay);
      m.people.filter(p => isTeleSoul(p) && ok(p)).forEach(p => { load[p.callDay]++; });
      const people = m.people.map(p => {
        if (!isTeleSoul(p) || ok(p)) return p;
        const d = teleDaysFor(p).reduce((best, x) => (load[x] < load[best] ? x : best));
        load[d]++;
        return { ...p, callDay: d };
      });
      return { ...m, people };
    }
    case 'M_FOLLOW_DELETE': return { ...m, followUps: m.followUps.filter(f => f.id !== a.id) };
    case 'M_FOLLOW_RESOLVE': {
      // attempted / completed / cancelled. A recurring item creates its next one exactly once.
      const f = m.followUps.find(x => x.id === a.id);
      if (!f) return m;
      let people = m.people;
      if (a.status === 'completed' && a.reached !== false && f.personId && ['call', 'message', 'conversation', 'welcome', 'welfare', 'pastoral', 'visit', 'counselling'].includes(f.kind)) {
        people = people.map(p => (p.id === f.personId ? { ...p, lastContact: today } : p));
      }
      const updated = { ...f, status: a.status, reached: a.reached ?? (a.status === 'completed' ? true : f.reached), outcome: a.outcome ?? f.outcome, nextAction: a.nextAction ?? f.nextAction,
        completedAt: ['completed', 'cancelled'].includes(a.status) ? today : f.completedAt, attempts: a.status === 'attempted' ? [...(f.attempts || []), { date: today, note: a.outcome || '' }] : f.attempts, snoozedUntil: '' };
      let list = m.followUps.map(x => (x.id === f.id ? updated : x));
      const step = { weekly: 7, fortnightly: 14, monthly: 30 }[f.recurrence];
      if (step && ['completed', 'cancelled'].includes(a.status)) {
        const seriesId = f.seriesId || f.id;
        const nextDue = addDays(f.due || today, step);
        const key = `${seriesId}@${nextDue}`;
        if (!list.some(x => x.key === key)) list = [...list, { ...f, id: uid('fu'), key, seriesId, due: nextDue, status: 'planned', outcome: '', reached: null, completedAt: '', attempts: [], parentId: f.id }];
      }
      // A chained next action becomes the next follow-up
      if (a.chain) list = [...list, { id: uid('fu'), status: 'planned', priority: 'normal', campaignIds: f.campaignIds || [], createdAt: today, personId: f.personId, kind: a.chain.kind || f.kind, title: a.chain.title, due: a.chain.due, parentId: f.id }];
      return { ...m, followUps: list, people };
    }

    case 'M_FOLLOW_COMPLETE_BY_KEY': {
      const f = m.followUps.find(x => x.key === a.key);
      return f && f.status !== 'completed' ? ministryReducer(m, { type: 'M_FOLLOW_RESOLVE', id: f.id, status: 'completed', reached: true }, today) : m;
    }

    // Thursday Bible-study sermons
    case 'M_SERMON_ADD': return { ...m, sermons: [...m.sermons, { id: uid('ser'), stage: 0, stagesDone: {}, attachments: [], prepHours: 0, ...a.data }] };
    case 'M_SERMON_UPDATE': return { ...m, sermons: m.sermons.map(s => (s.id === a.id ? { ...s, ...a.data } : s)) };
    case 'M_SERMON_STAGE': return { ...m, sermons: m.sermons.map(s => {
      if (s.id !== a.id) return s;
      const done = { ...(s.stagesDone || {}) };
      if (a.done) done[a.stage] = today; else delete done[a.stage];
      const stage = Math.max(0, ...Object.keys(done).map(Number).filter(n => done[n]));
      return { ...s, stagesDone: done, stage };
    }) };
    case 'M_SERMON_DELETE': return { ...m, sermons: m.sermons.filter(s => s.id !== a.id) };

    // Campaigns
    case 'M_CAMPAIGN_ADD': return { ...m, campaigns: [...m.campaigns, { id: uid('cmp'), status: 'draft', scale: 'establishing', activities: [], targets: [], budget: [], reviews: [], participants: [], serviceScope: [], createdAt: today, ...a.data }] };
    case 'M_CAMPAIGN_UPDATE': return { ...m, campaigns: m.campaigns.map(c => (c.id === a.id ? { ...c, ...a.data } : c)) };
    case 'M_CAMPAIGN_DELETE': return { ...m, campaigns: m.campaigns.filter(c => c.id !== a.id) };

    // Alerts: dismiss (with reason) or snooze
    case 'M_ALERT': return { ...m, alerts: { ...m.alerts, [a.key]: { ...a.data, at: today } } };
    case 'M_WEEK_NOTE': return { ...m, weekNotes: { ...m.weekNotes, [a.week]: { ...(m.weekNotes[a.week] || {}), ...a.data } } };
    case 'M_DELIVERY_ADD': return { ...m, deliveries: [...m.deliveries, { id: uid('dl'), at: new Date().toISOString(), ...a.data }] };
    case 'M_REMINDER_SENT': return { ...m, sentReminders: { ...Object.fromEntries(Object.entries(m.sentReminders).filter(([, d]) => daysBetween(d, today) < 14)), [a.key]: today } };
    default: return m;
  }
}
function newMeeting(key) {
  const [type, date] = key.split(':');
  return { key, type, date, status: 'scheduled', entries: {}, anonymous: 0, transport: {}, report: { state: null, versions: [] }, notes: '', cancelReason: '' };
}

// ── Reading it: every number on the Poimainō pages comes from here ──
export const typeLabel = (m, type) => MEETING_TYPES.concat(m.settings.extraTypes || []).find(t => t.id === type)?.label || type;
export const stageLabel = (m, n) => (n === null || n === undefined ? 'Not assessed' : `${n} · ${m.settings.stages[n]?.label || '—'}${m.settings.stages[n]?.unresolved ? ' (unresolved)' : ''}`);
export const membershipLabel = (id) => ({ contact: 'Contact', visitor: 'Visitor', returning: 'Returning', member: 'Member', stable: 'Stable member', prayer: 'Someone I pray for', transferred: 'Transferred', departed: 'Departed' }[id] || id);

// Occurrences of each weekly meeting from when you started, plus next week's, merged with what you recorded
export function meetingList(m, today, weeksBack = 10) {
  const from = [m.settings.meetingsFrom, addDays(today, -7 * weeksBack)].sort().pop();
  const types = MEETING_TYPES.concat(m.settings.extraTypes || []).filter(t => t.weekday !== undefined && t.weekday !== null && t.weekday !== '');
  const keys = new Set(Object.keys(m.meetings));
  for (let d = from; d <= addDays(today, 7); d = addDays(d, 1)) types.forEach(t => { if (weekdayOf(d) === Number(t.weekday)) keys.add(meetingKey(t.id, d)); });
  return [...keys].map(k => ({ ...newMeeting(k), ...(m.meetings[k] || {}) })).sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
}

// What state a meeting is in, in plain terms (DESIGN): scheduled · awaiting confirmation · draft · attendance awaiting submission · submitted · amended · cancelled
export function meetingState(m, mt, today, nowTime) {
  if (mt.status === 'cancelled') return 'cancelled';
  const time = m.settings.times?.[mt.type] || '';
  const started = mt.date < today || (mt.date === today && (!time || nowTime >= time));
  if (mt.report?.versions?.length) return mt.report.editing ? 'amending' : mt.report.state === 'amended' ? 'amended' : 'submitted';
  if (!started) return 'scheduled';
  if (mt.status === 'held') return Object.keys(mt.entries || {}).length || mt.anonymous ? 'draft' : 'held';
  return 'unconfirmed'; // past, not yet marked held or cancelled: missing, not zero
}
export const STATE_LABEL = { scheduled: 'Scheduled', unconfirmed: 'Was it held?', held: 'Held · attendance not started', draft: 'Draft', amending: 'Amendment in progress', submitted: 'Submitted', amended: 'Submitted (amended)', cancelled: 'Cancelled' };

// The submitted picture of a meeting (latest version), or null
export function submitted(mt) { const v = mt.report?.versions; return v?.length ? v[v.length - 1] : null; }

// Present history across submitted meetings: personId → sorted dates present
export function presenceIndex(m) {
  const idx = {};
  Object.values(m.meetings).forEach(mt => {
    const s = submitted(mt);
    if (!s || mt.status === 'cancelled') return;
    Object.entries(s.entries).forEach(([pid, v]) => { if (v === 'present') (idx[pid] = idx[pid] || []).push({ date: mt.date, type: mt.type }); });
  });
  Object.values(idx).forEach(l => l.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type)));
  return idx;
}

// Numbers for one meeting from a given snapshot (submitted or draft). Everyone counted once.
export function meetingStats(m, mt, snap, index = presenceIndex(m)) {
  if (!snap) return null;
  const byId = Object.fromEntries(m.people.map(p => [p.id, p]));
  const present = Object.entries(snap.entries).filter(([, v]) => v === 'present').map(([id]) => id).filter(id => byId[id]);
  const firstTime = [], secondTime = [], returning = [];
  present.forEach(id => {
    const p = byId[id];
    if (REGISTERED.includes(p.membership)) return;                                // members are never first or second timers
    const before = (index[id] || []).filter(x => x.date < mt.date || (x.date === mt.date && x.type < mt.type));
    const days = new Set(before.map(x => x.date)).size;
    if (!before.length) firstTime.push(id);                                       // first timer: first recorded presence
    else { returning.push(id); if (days === 1) secondTime.push(id); }             // second timer: their second visit
  });
  const members = present.filter(id => REGISTERED.includes(byId[id].membership));
  const anon = Number(snap.anonymous) || 0;
  const counts = { present: 0, absent: 0, excused: 0 };
  Object.values(snap.entries).forEach(v => { if (counts[v] !== undefined) counts[v]++; });
  const transport = Object.values(snap.transport || {}).filter(t => t.boarded).length;
  return { named: present.length, anonymous: anon, total: present.length + anon, firstTime, secondTime, returning, members, ...counts, transport };
}

// Honest reflection after submission (deterministic; no causes invented)
export function reflection(m, key, today) {
  const index = presenceIndex(m);
  const all = meetingList(m, today, 26);
  const mt = all.find(x => x.key === key);
  const cur = mt && submitted(mt);
  if (!cur) return null;
  const st = meetingStats(m, mt, cur, index);
  const prevs = all.filter(x => x.type === mt.type && x.date < mt.date && x.status !== 'cancelled' && submitted(x)).reverse();
  const prev = prevs[0];
  const pst = prev && meetingStats(m, prev, submitted(prev), index);
  const recent = prevs.slice(0, 4).map(x => meetingStats(m, x, submitted(x), index).total);
  const avg = recent.length ? Math.round((recent.reduce((a, b) => a + b, 0) / recent.length) * 10) / 10 : null;
  const label = typeLabel(m, mt.type);
  const improved = [], attention = [], steps = [];
  if (pst) {
    const d = st.total - pst.total;
    if (d > 0) improved.push(`${label} attendance rose from ${pst.total} to ${st.total}.`);
    else if (d < 0) attention.push(`${label} attendance was ${st.total}, down from ${pst.total}. Numbers fluctuate; this alone says nothing about why.`);
    else improved.push(`${label} attendance held steady at ${st.total}.`);
  }
  if (st.firstTime.length) improved.push(`${st.firstTime.length} first ${st.firstTime.length === 1 ? 'timer' : 'timers'}.`);
  if (st.secondTime.length) improved.push(`${st.secondTime.length} second ${st.secondTime.length === 1 ? 'timer' : 'timers'}.`);
  if (st.firstTime.length) steps.push(`Welcome ${st.firstTime.length === 1 ? 'the first timer' : `the ${st.firstTime.length} first timers`} and invite them back.`);
  const absentMembers = Object.entries(cur.entries).filter(([id, v]) => v === 'absent' && REGISTERED.includes(m.people.find(p => p.id === id)?.membership)).length;
  if (absentMembers) { attention.push(`${absentMembers} ${absentMembers === 1 ? 'member was' : 'members were'} marked absent.`); steps.push('Check in respectfully with those who were absent; don’t assume why.'); }
  const dueFollow = m.followUps.filter(f => ['planned', 'attempted'].includes(f.status) && f.due && f.due <= today).length;
  if (dueFollow) steps.push(`Clear the ${dueFollow} follow-up ${dueFollow === 1 ? 'item' : 'items'} that ${dueFollow === 1 ? 'is' : 'are'} due.`);
  const unmarked = m.people.filter(p => ['member', 'stable'].includes(p.membership) && !cur.entries[p.id]).length;
  if (unmarked) attention.push(`${unmarked} ${unmarked === 1 ? 'member is' : 'members are'} unmarked (not counted as absent).`);
  const history = [];
  if (!pst) history.push(`No earlier submitted ${label} to compare with yet.`);
  if (recent.length && recent.length < 3) history.push(`Only ${recent.length} earlier ${label} ${recent.length === 1 ? 'meeting' : 'meetings'} submitted, so the average is a small sample.`);
  const change = pst ? { abs: st.total - pst.total, pct: pst.total ? Math.round(((st.total - pst.total) / pst.total) * 100) : null } : null;
  const enc = st.total > (pst?.total ?? -1) ? 'Keep building on this week’s progress.' : 'Faithfulness matters more than one week’s number. Keep caring for each person.';
  return { mt, st, prev, pst, avg, recentN: recent.length, change, improved, attention, steps: steps.slice(0, 3), history, encouragement: enc };
}

// Vision 25: stable members, kept distinct from registered, active and attendees
export function vision(m, today) {
  const index = presenceIndex(m);
  const activeSince = addDays(today, -7 * m.settings.activeWeeks);
  const stable = m.people.filter(p => p.membership === 'stable');
  const registered = m.people.filter(p => REGISTERED.includes(p.membership));
  const active = registered.filter(p => (index[p.id] || []).some(x => x.date >= activeSince));
  const reviewed = !!m.settings.baseline.reviewedAt;
  const target = MINISTRY.vision.target;
  const count = stable.length;
  return { stable: count, registered: registered.length, active: active.length, target, reviewed,
    baseline: m.settings.baseline, gap: reviewed || count > 0 ? Math.max(0, target - count) : null, approxGap: target - m.settings.baseline.approx,
    milestones: m.settings.milestones, deadline: m.settings.visionDeadline };
}

// Stable-membership movement over a period, from dated histories (reconciles to net change)
export function stableMovement(m, from, to) {
  const out = { establishedNew: [], reestablished: [], departed: [], transferred: [], retained: [] };
  m.people.forEach(p => {
    const h = p.membershipHistory || [];
    const at = (d) => { let s = null; h.forEach(x => { if (x.date <= d) s = x.to; }); return s; };
    const startStable = at(addDays(from, -1)) === 'stable';
    const endStatus = at(to);
    const wasEverStable = h.some(x => x.date < from && x.to === 'stable');
    if (startStable && endStatus === 'stable') out.retained.push(p.id);
    if (!startStable && endStatus === 'stable') (wasEverStable ? out.reestablished : out.establishedNew).push(p.id);
    if (startStable && endStatus !== 'stable') (endStatus === 'transferred' ? out.transferred : out.departed).push(p.id);
  });
  out.net = out.establishedNew.length + out.reestablished.length - out.departed.length - out.transferred.length;
  return out;
}

// Where each person is on the way to becoming established (workflow labels, not discipleship stages)
export function establishment(m, p, index) {
  const pres = index[p.id] || [];
  if (p.membership === 'stable') return { step: 4, label: 'Stable (reviewed)' };
  const dates = [...new Set(pres.map(x => x.date))];
  if (dates.length >= 3) return { step: 3, label: 'Continuing participation' };
  if (dates.length === 2) return { step: 2, label: 'Returned' };
  if (dates.length === 1) return { step: 1, label: 'First visit' };
  return { step: 0, label: 'Contact' };
}
export const EST_STEPS = ['Contact', 'First visit', 'Returned', 'Continuing participation', 'Stable (reviewed)'];

// Possible duplicates: same name, or very similar names that also share a phone/email. A shared phone alone is not enough.
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
export function duplicates(m, person, draft) {
  const p = draft || person;
  const n = norm(p.name);
  if (!n) return [];
  return m.people.filter(o => o.id !== p.id).filter(o => {
    const on = norm(o.name);
    const sameName = on === n;
    const similar = on.split(' ')[0] === n.split(' ')[0] && (on.includes(n) || n.includes(on));
    const shared = (p.phone && o.phone && p.phone.replace(/\D/g, '') === o.phone.replace(/\D/g, '')) || (p.email && o.email && p.email.toLowerCase() === o.email.toLowerCase());
    return sameName || (similar && shared);
  });
}

// Campaign progress from linked records, each event counted once
export function campaignProgress(m, c) {
  const linked = (list) => list.filter(x => (x.campaignIds || []).includes(c.id));
  const enc = linked(m.encounters), inv = linked(m.invitations), fu = linked(m.followUps);
  const people = new Set([...enc.map(x => x.personId), ...inv.map(x => x.personId), ...fu.map(x => x.personId), ...(c.participants || [])].filter(Boolean));
  const acts = c.activities || [];
  const done = acts.filter(x => x.done).length;
  const overdue = acts.filter(x => !x.done && x.due && x.due < localDay(m.settings.timezone)).length;
  return { encounters: enc.length, invitations: inv.length, confirmed: inv.filter(x => x.status === 'confirmed').length, followUps: fu.length,
    attempted: fu.filter(x => ['attempted', 'completed'].includes(x.status)).length, reached: fu.filter(x => x.status === 'completed' && x.reached !== false).length,
    visits: fu.filter(x => x.kind === 'visit').length, visitsDone: fu.filter(x => x.kind === 'visit' && x.status === 'completed').length,
    people: people.size, activities: acts.length, done, overdue };
}

// ── Shepherding: the flock, PVCI, the call rota, preparation and who needs attention ──
// Telepastoring reaches everyone on the soul list who hasn't declined contact
export const isTeleSoul = (p) => !['transferred', 'departed'].includes(p.membership) && !p.declinedContact;
// Which days each person can be telepastored, by where they live
export const TELE_DAYS = { bham: [1, 2, 3], other: [4, 5] };
export const teleDaysFor = (p) => (areaOf(p) === 'bham' ? TELE_DAYS.bham : TELE_DAYS.other);
export const teleDeadline = (p) => (areaOf(p) === 'bham' ? 3 : 5); // Wednesday, Friday
export function leastBusyDay(m, p) {
  const load = [0, 0, 0, 0, 0, 0, 0];
  m.people.filter(isTeleSoul).forEach(x => { if (x.callDay >= 0 && x.callDay <= 6) load[x.callDay]++; });
  return teleDaysFor(p).reduce((best, x) => (load[x] < load[best] ? x : best));
}
export const isFlock = (p) => ['member', 'stable', 'returning', 'visitor'].includes(p.membership) && !p.declinedContact;

// PVCI counts for a week (completed follow-ups; reached contacts only, prayer always counts)
export function pvciRange(m, from, to) {
  const out = { P: 0, V: 0, T: 0, I: 0 };
  m.followUps.filter(f => f.status === 'completed' && f.completedAt >= from && f.completedAt <= to && (f.kind === 'prayer' || f.reached !== false)).forEach(f => { out[pvciOf(f.kind)]++; });
  return out;
}
export const pvciWeek = (m, monday) => pvciRange(m, monday, addDays(monday, 6));

// The daily shepherding rhythm, each part done only when the real thing is recorded
export function dailyDone(m, d) {
  const rota = m.people.filter(p => isTeleSoul(p) && p.callDay === weekdayOf(d));
  const callsMade = m.followUps.filter(f => f.kind === 'call' && f.status === 'completed' && f.completedAt === d).length;
  const pv = pvciRange(m, d, d);
  return {
    evangelise: m.encounters.filter(e => e.date === d).length,
    telepastor: callsMade, rota: rota.length,
    rotaMade: rota.filter(p => m.followUps.some(f => f.personId === p.id && (f.teleRec || f.rota || f.kind === 'call') && f.completedAt === d)).length,
    followup: m.followUps.filter(f => f.status === 'completed' && f.completedAt === d && !f.rota && !f.quick && !f.tele).length,
    pvti: pv.P + pv.V + pv.T + (pv.I - callsMade > 0 ? pv.I - callsMade : 0), pv,
    chat: (m.chatPosts || []).filter(x => x.date === d).length,
  };
}
export const DAILY = [
  { id: 'evangelise', label: 'Evangelise', short: 'E', href: '#/poimaino/evangelism' },
  { id: 'telepastor', label: 'Telepastor', short: 'T', href: '#/poimaino/followup/telepastoring' },
  { id: 'followup', label: 'Follow up', short: 'F', href: '#/poimaino/followup' },
  { id: 'pvti', label: 'Pray, visit, teach or interact', short: 'P', href: '#/poimaino/followup/pvti' },
  { id: 'chat', label: 'Share in the Bacenta chat', short: 'C', href: '#/poimaino/followup/chat' },
];
export const dailyMet = (dd, id) => (id === 'telepastor' ? (dd.rota ? dd.rotaMade >= dd.rota : dd.telepastor > 0) : dd[id] > 0);

// Today's telepastoring calls from the rota, with whether each was made
export const teleTimes = (m) => (m.settings.teleTimes?.length ? [...m.settings.teleTimes].sort() : [m.settings.callTime || '09:00']);
const isTeleRec = (f) => f.teleRec || (f.rota && ['call', 'message'].includes(f.kind));
const weekPos = (d) => (d + 6) % 7; // Monday first

// Everyone on the soul list this week (Monday to Sunday), each once:
// done = responded this week · retry = no response, try again (due) · wait = retry booked later
// today = their day · catchup = their day has passed with no contact · later = their day is still to come · noday
export function teleWeek(m, today) {
  const mon = mondayOf(today), wd = weekdayOf(today);
  return m.people.filter(isTeleSoul).map(p => {
    const recs = m.followUps.filter(f => f.personId === p.id && isTeleRec(f) && f.completedAt >= mon && f.completedAt <= today).sort((a, b) => (a.completedAt + a.id).localeCompare(b.completedAt + b.id));
    const last = recs[recs.length - 1] || null;
    const retry = m.followUps.find(f => f.personId === p.id && f.teleRetry && ['planned', 'attempted'].includes(f.status)) || null;
    const responded = recs.some(f => f.reached !== false);
    const hasDay = [0, 1, 2, 3, 4, 5, 6].includes(p.callDay);
    const state = responded ? 'done' : retry ? (retry.due <= today ? 'retry' : 'wait')
      : !hasDay ? 'noday' : p.callDay === wd ? 'today' : weekPos(p.callDay) < weekPos(wd) ? 'catchup' : 'later';
    const inv = m.invitations.filter(i => i.personId === p.id && i.date >= mon);
    const bham = areaOf(p) === 'bham';
    const late = state !== 'done' && weekPos(wd) > weekPos(teleDeadline(p)); // past their deadline this week
    return { p, state, last, retry, recs, today: recs.filter(f => f.completedAt === today), inv, bham, late };
  });
}

// Your pace this week: reached, against those whose day has already passed. Mon–Fri; deadlines Wednesday (Birmingham) and Friday.
export function telePace(m, today, week = teleWeek(m, today)) {
  const wd = weekPos(weekdayOf(today));
  const withDay = week.filter(r => r.state !== 'noday' || r.p.callDay >= 0);
  const reached = week.filter(r => r.state === 'done').length;
  const expected = withDay.filter(r => r.p.callDay >= 0 && r.p.callDay <= 6 && weekPos(r.p.callDay) < wd).length;
  const reachedDue = withDay.filter(r => r.state === 'done' && r.p.callDay >= 0 && weekPos(r.p.callDay) < wd).length;
  const behind = expected - reachedDue;
  const tone = !expected || behind <= expected * 0.1 ? 'good' : behind <= expected * 0.4 ? 'warn' : 'bad';
  const group = (bham) => { const g = week.filter(r => r.bham === bham); const dl = bham ? 3 : 5; return { total: g.length, reached: g.filter(r => r.state === 'done').length, deadline: dl, daysLeft: weekPos(dl) - wd, expected: g.filter(r => r.p.callDay >= 0 && weekPos(r.p.callDay) < wd).length }; };
  return { total: week.length, reached, expected, behind, tone, bham: group(true), other: group(false) };
}

// Today's telepastoring: their day, catching up, and retries due; each done once contacted today
export function callsToday(m, today) {
  const wd = weekdayOf(today);
  const week = teleWeek(m, today);
  // Saturday: everyone, a wake-up call for church today (Birmingham) or tomorrow (elsewhere). Sunday: optional, nothing is due.
  if (wd === 6) return week.map(r => ({ ...r, sat: true, done: r.today.length > 0 && r.state !== 'retry', reached: r.today.some(f => f.reached !== false) }))
    .sort((a, b) => a.done - b.done || b.bham - a.bham || a.p.name.localeCompare(b.p.name));
  if (wd === 0) return week.filter(r => r.today.length).map(r => ({ ...r, done: true, reached: r.today.some(f => f.reached !== false) }));
  return week.filter(r => ['today', 'catchup', 'retry'].includes(r.state) || r.today.length)
    .map(r => ({ ...r, done: r.today.length > 0 && r.state !== 'retry', reached: r.today.some(f => f.reached !== false) }))
    .sort((a, b) => a.done - b.done || a.p.name.localeCompare(b.p.name));
}

// Getting people ready for the next meeting of a type: who has been contacted or invited since the meeting before it
export function prepFor(m, today, type, nowTime = '23:59') {
  const list = meetingList(m, today, 3);
  const next = list.find(x => x.type === type && x.status !== 'cancelled' && (x.date > today || (x.date === today && !submitted(x))));
  if (!next) return null;
  const prev = [...list].reverse().find(x => x.date < next.date && x.status !== 'cancelled');
  const since = prev ? prev.date : addDays(next.date, -7);
  const flock = m.people.filter(isFlock);
  const ready = (p) => (p.lastContact && p.lastContact > since) || m.invitations.some(i => i.personId === p.id && (i.meetingKey === next.key || (i.date > since && i.date <= next.date)));
  const done = flock.filter(ready);
  return { next, since, total: flock.length, done: done.length, waiting: flock.filter(p => !ready(p)) };
}

// Members who need attention: a level (low, moderate, critical) and plain reasons. Suggestions, never judgements.
// Missed = marked absent at a reported meeting; an unmarked meeting is not absent, so it neither adds to nor breaks the run.
export const ATTENTION_LEVELS = [['critical', 'Critical'], ['moderate', 'Moderate'], ['low', 'Low']];
const RANK = { low: 1, moderate: 2, critical: 3 };
export function needAttention(m, today) {
  const reported = meetingList(m, today, 26).filter(mt => submitted(mt) && mt.status !== 'cancelled').reverse();
  const out = [];
  m.people.filter(p => REGISTERED.includes(p.membership) || p.membership === 'returning').forEach(p => {
    const why = [];
    let level = 0, missed = 0, lastSeen = '';
    for (const mt of reported) {
      const v = submitted(mt).entries[p.id];
      if (v === 'present') { lastSeen = mt.date; break; }
      if (v === 'absent') missed++;
    }
    if (!lastSeen) lastSeen = reported.find(mt => submitted(mt).entries[p.id] === 'present')?.date || '';
    if (missed) { why.push(`missed ${missed} ${missed === 1 ? 'meeting' : 'meetings'} in a row`); level = Math.max(level, missed >= 4 ? 3 : missed >= 2 ? 2 : 1); }
    if (p.careStatus === 'Crisis') { why.push('in crisis'); level = 3; }
    else if (['Struggling', 'Inactive'].includes(p.careStatus)) { why.push(p.careStatus.toLowerCase()); level = Math.max(level, 2); }
    if ((p.restricted?.care || []).some(c => c.status !== 'Closed' && c.reviewDate && c.reviewDate <= today)) { why.push('care review due'); level = Math.max(level, 2); }
    const days = p.lastContact ? daysBetween(p.lastContact, today) : null;
    if (!p.declinedContact && (days === null || days >= 21)) { why.push(days === null ? 'no contact recorded' : `no contact for ${days} days`); level = Math.max(level, days !== null && days >= 42 ? 2 : 1); }
    if (level) out.push({ p, why, missed, lastSeen, level: ['', 'low', 'moderate', 'critical'][level] });
  });
  return out.sort((a, b) => RANK[b.level] - RANK[a.level] || b.missed - a.missed || a.p.name.localeCompare(b.p.name));
}

// Attendance per week for the last n weeks (submitted meetings only; missing stays missing)
export function attendanceWeeks(m, today, n = 8) {
  const index = presenceIndex(m);
  const mon = mondayOf(today);
  return Array.from({ length: n }, (_, i) => {
    const from = addDays(mon, (i - n + 1) * 7), to = addDays(from, 6);
    const of = (type) => { const mt = Object.values(m.meetings).find(x => x.type === type && x.date >= from && x.date <= to && x.status !== 'cancelled' && submitted(x)); return mt ? meetingStats(m, mt, submitted(mt), index) : null; };
    const thu = of('thu'), sat = of('sat');
    return { from, thu: thu ? thu.total : null, sat: sat ? sat.total : null, first: (thu?.firstTime.length || 0) + (sat?.firstTime.length || 0), second: (thu?.secondTime.length || 0) + (sat?.secondTime.length || 0) };
  });
}

// ── The action centre: everything that needs you, each with its reason and a link ──
export function alerts(m, today, nowTime) {
  const out = [];
  const s = m.settings;
  const byId = Object.fromEntries(m.people.map(p => [p.id, p]));
  const name = (id, fallback) => byId[id]?.name || fallback || 'someone';
  // Meetings
  meetingList(m, today, 6).forEach(mt => {
    const st = meetingState(m, mt, today, nowTime);
    const lab = `${typeLabel(m, mt.type)}, ${mt.date}`;
    if (st === 'unconfirmed') out.push({ key: `mt-confirm:${mt.key}`, cat: 'attendance', pri: 2, title: `Was ${lab} held?`, why: 'This meeting has passed and isn’t marked held or cancelled yet. Until you say, it counts as missing, not zero.', href: `#/poimaino/services/${encodeURIComponent(mt.key)}`, due: mt.date });
    if (['held', 'draft', 'amending'].includes(st)) out.push({ key: `mt-submit:${mt.key}`, cat: 'attendance', pri: 1, title: `Attendance awaiting submission: ${lab}`, why: st === 'amending' ? 'You started an amendment and haven’t submitted it.' : 'The meeting was held and its attendance isn’t submitted yet.', href: `#/poimaino/services/${encodeURIComponent(mt.key)}`, due: mt.date });
  });
  // Follow-ups due or overdue (snoozed ones wait)
  m.followUps.filter(f => !f.teleRetry && ['planned', 'attempted'].includes(f.status) && f.due && f.due <= today && !(f.snoozedUntil && f.snoozedUntil > today)).forEach(f => {
    out.push({ key: `fu:${f.id}`, cat: 'followups', pri: f.priority === 'high' ? 1 : 2, title: `${f.kind === 'visit' ? 'Visit' : 'Follow up'}: ${f.title || name(f.personId, f.personName)}${f.personId ? ` — ${name(f.personId)}` : ''}`,
      why: f.due < today ? `Due ${f.due}, ${daysBetween(f.due, today)} ${daysBetween(f.due, today) === 1 ? 'day' : 'days'} ago.` : 'Due today.', href: `#/poimaino/followup`, due: f.due, recordId: f.id });
  });
  // Upcoming visits (next 3 days)
  m.followUps.filter(f => f.kind === 'visit' && f.status === 'planned' && f.due > today && f.due <= addDays(today, 3)).forEach(f => {
    out.push({ key: `visit-soon:${f.id}`, cat: 'followups', pri: 3, title: `Upcoming visit: ${name(f.personId, f.personName)}, ${f.due}`, why: 'Agreed visit within three days. Prepare if needed.', href: '#/poimaino/followup', due: f.due });
  });
  // First-time visitors awaiting welcome (configurable window)
  const index = presenceIndex(m);
  m.people.forEach(p => {
    const first = (index[p.id] || [])[0];
    if (!first || REGISTERED.includes(p.membership)) return;
    const welcomed = m.followUps.some(f => f.personId === p.id && f.kind === 'welcome' && f.status === 'completed');
    const planned = m.followUps.some(f => f.personId === p.id && f.kind === 'welcome' && ['planned', 'attempted'].includes(f.status)); // its own follow-up already shows it
    if (!welcomed && !planned && daysBetween(first.date, today) <= 14) out.push({ key: `welcome:${p.id}`, cat: 'followups', pri: daysBetween(first.date, today) > s.welcomeDays ? 1 : 2,
      title: `Welcome ${p.name}`, why: `First visit on ${first.date}${daysBetween(first.date, today) > s.welcomeDays ? `, more than ${s.welcomeDays} days ago` : ''}. No welcome contact recorded yet.`, href: `#/poimaino/people/${p.id}`, due: first.date });
  });
  // Gentle check-in after missed meetings (a suggestion, never a judgement)
  const recent = meetingList(m, today, s.absenceWeeks + 1).filter(mt => submitted(mt) && mt.status !== 'cancelled').slice(-s.absenceWeeks * 2);
  if (recent.length >= 2) m.people.filter(p => REGISTERED.includes(p.membership)).forEach(p => {
    const marked = recent.map(mt => submitted(mt).entries[p.id]);
    if (marked.length && marked.every(v => v === 'absent')) out.push({ key: `absent:${p.id}:${recent[recent.length - 1].key}`, cat: 'followups', pri: 2, title: `Check in with ${p.name}`,
      why: `Marked absent at the last ${marked.length} submitted meetings. This is only a suggestion to check in; it doesn’t say why.`, href: `#/poimaino/people/${p.id}`, due: today });
  });
  // Sermon preparation milestones (Thursday)
  sermonPlan(m, today).filter(x => x.status === 'due').forEach(x => out.push({ key: `sermon:${x.sermonId}:${x.stage}`, cat: 'sermon', pri: 2, title: `Bible study preparation: ${x.label}`, why: x.why, href: `#/poimaino/sermons/${x.sermonId}`, due: x.date }));
  // Campaign activities
  m.campaigns.filter(c => c.status === 'active').forEach(c => (c.activities || []).filter(a => !a.done && a.due && a.due <= today).forEach(a => out.push({ key: `cmp:${c.id}:${a.id}`, cat: 'campaigns', pri: 2, title: `${c.label || c.name}: ${a.title}`, why: a.due < today ? `Activity due ${a.due}.` : 'Activity due today.', href: `#/poimaino/campaigns/${c.id}`, due: a.due })));
  // Voluntarily shared care needs with a review date
  m.people.forEach(p => (p.restricted.care || []).filter(c => c.status !== 'Closed' && c.reviewDate && c.reviewDate <= today).forEach(c => out.push({ key: `care:${p.id}:${c.id}`, cat: 'followups', pri: 1, title: `Care review: ${p.name}`, why: `A care need you recorded has its review date on ${c.reviewDate}. Details stay on their page.`, href: `#/poimaino/people/${p.id}`, due: c.reviewDate })));
  // Telepastoring: today's calls from the rota, from your calling time
  const calls = callsToday(m, today).filter(x => !x.done);
  const slot = weekdayOf(today) === 0 ? null : teleTimes(m).filter(t => nowTime >= t).pop();
  const tw = teleWeek(m, today), wdn = weekdayOf(today);
  const bhamLeft = tw.filter(r => r.bham && r.state !== 'done');
  if ((wdn === 3 || wdn === 4) && bhamLeft.length) out.push({ key: `tele-bham:${today}`, cat: 'followups', pri: 1, title: `Birmingham before Thursday: ${bhamLeft.length} not reached yet`, why: `Confirm Bible study and the bus. ${bhamLeft.slice(0, 3).map(r => r.p.name).join(', ')}${bhamLeft.length > 3 ? ` and ${bhamLeft.length - 3} more` : ''}.`, href: '#/poimaino/followup/telepastoring', due: today });
  const otherLeft = tw.filter(r => !r.bham && r.state !== 'done');
  if (wdn === 5 && otherLeft.length) out.push({ key: `tele-other:${today}`, cat: 'followups', pri: 1, title: `Outside Birmingham before Saturday: ${otherLeft.length} not reached yet`, why: 'So they can go to church on Sunday where they are.', href: '#/poimaino/followup/telepastoring', due: today });
  if (calls.length && slot) out.push({ key: `calls:${today}:${slot}`, tele: true, cat: 'followups', pri: 2, title: `Telepastor: ${calls.length} still to reach today`, why: `${calls.slice(0, 3).map(x => x.p.name).join(', ')}${calls.length > 3 ? ` and ${calls.length - 3} more` : ''}. “${teleVerse(today).text}” ${teleVerse(today).ref}`, href: '#/poimaino/followup/telepastoring', due: today });
  // Preparing people for Thursday and for Saturday: the day before and the day itself
  ['thu', 'sat'].forEach(type => {
    const pr = prepFor(m, today, type, nowTime);
    if (!pr || !pr.waiting.length || daysBetween(today, pr.next.date) > 1) return;
    out.push({ key: `prep:${pr.next.key}`, cat: 'attendance', pri: 2, title: `Prepare people for ${typeLabel(m, type)}: ${pr.waiting.length} not contacted yet`, why: `Since ${pr.since}, ${pr.done} of ${pr.total} have been contacted or invited for ${pr.next.date}.`, href: '#/poimaino/followup/telepastoring', due: pr.next.date });
  });
  // The daily rhythm: evangelism, PVTI and the Bacenta chat, from the times you set
  const dd = dailyDone(m, today), dt = s.daily || {};
  if (dt.evangelism && nowTime >= dt.evangelism && !dd.evangelise) out.push({ key: `daily-ev:${today}`, cat: 'followups', pri: 2, title: 'Evangelise today', why: 'No gospel encounter recorded yet today. Record it under Evangelism when you have shared.', href: '#/poimaino/evangelism', due: today });
  if (dt.chat && nowTime >= dt.chat && !dd.chat) out.push({ key: `daily-chat:${today}`, cat: 'followups', pri: 2, title: 'Share in the Bacenta chat', why: (m.chatPlan || {})[today] ? `You planned: “${m.chatPlan[today].slice(0, 80)}${m.chatPlan[today].length > 80 ? '…' : ''}”` : 'Nothing planned for today yet. A verse, a word from Thursday, or a reminder for Saturday.', href: '#/poimaino/followup/chat', due: today });
  if (dt.pvti && nowTime >= dt.pvti && !dd.pvti) out.push({ key: `daily-pvti:${today}`, cat: 'followups', pri: 3, title: 'Pray for, visit, teach or reach someone today', why: 'No prayer, visit, teaching or interaction recorded yet today, beyond the rota calls.', href: '#/poimaino/followup/pvti', due: today });
  // Dismissed and snoozed alerts wait
  return out.filter(x => { const st = m.alerts[x.key]; return !st || (st.snoozeUntil && st.snoozeUntil <= today); }).sort((a, b) => a.pri - b.pri || (a.due || '').localeCompare(b.due || ''));
}

// Thursday preparation as dated milestones; arriving late moves the work, never marks it failed
export function sermonPlan(m, today) {
  const out = [];
  m.sermons.filter(s => s.date && s.date >= addDays(today, -2) && (s.stage || 0) < 7).forEach(s => {
    const thu = s.date;
    const monday = addDays(thu, -3);
    const received = s.received && s.received <= thu ? s.received : null;
    const plan = [
      { stage: 1, date: monday, label: 'Review the material' },
      { stage: 2, date: addDays(monday, 1), label: 'Study the scriptures' },
      { stage: 3, date: addDays(monday, 2), label: 'Main points' },
      { stage: 4, date: addDays(monday, 2), label: 'Outline and applications' },
      { stage: 5, date: thu, label: 'Pray and finalise' },
      { stage: 6, date: thu, label: 'Preach' },
      { stage: 7, date: addDays(thu, 1), label: 'Reflect' },
    ].map(x => ({ ...x, date: received && x.date < received ? received : x.date })); // material came later: start from when it arrived
    plan.forEach(x => {
      const done = !!s.stagesDone?.[x.stage];
      const status = done ? 'done' : !received && x.stage <= 5 ? 'waiting' : x.date <= today ? 'due' : 'planned';
      out.push({ ...x, sermonId: s.id, title: s.title, status, why: status === 'due' ? `Planned for ${x.date} for Thursday ${thu}${received && received > monday ? ` (material arrived ${received}, so the plan starts then)` : ''}.` : '' });
    });
  });
  return out;
}

// One week, for the weekly review
export function weekSummary(m, monday) {
  const sunday = addDays(monday, 6);
  const index = presenceIndex(m);
  const meetings = Object.values(m.meetings).filter(mt => mt.date >= monday && mt.date <= sunday && mt.status !== 'cancelled' && submitted(mt));
  const stats = meetings.map(mt => ({ mt, st: meetingStats(m, mt, submitted(mt), index) }));
  const unique = new Set(stats.flatMap(x => Object.entries(submitted(x.mt).entries).filter(([, v]) => v === 'present').map(([id]) => id)));
  const inWeek = (d) => d && d >= monday && d <= sunday;
  const fu = m.followUps.filter(f => inWeek(f.completedAt) || (f.attempts || []).some(a => inWeek(a.date)));
  return {
    meetings: stats, serviceAttendances: stats.reduce((n, x) => n + x.st.total, 0), uniquePeople: unique.size,
    firstTime: [...new Set(stats.flatMap(x => x.st.firstTime))].length, secondTime: [...new Set(stats.flatMap(x => x.st.secondTime))].length, returning: [...new Set(stats.flatMap(x => x.st.returning))].length,
    firstNames: [...new Set(stats.flatMap(x => x.st.firstTime))], secondNames: [...new Set(stats.flatMap(x => x.st.secondTime))],
    encounters: m.encounters.filter(e => inWeek(e.date)).length, reachedOutreach: new Set(m.encounters.filter(e => inWeek(e.date)).map(e => e.personId)).size,
    invitations: m.invitations.filter(i => inWeek(i.date)).length,
    attempted: fu.filter(f => (f.attempts || []).some(a => inWeek(a.date)) || f.status === 'attempted').length,
    completed: fu.filter(f => f.status === 'completed' && inWeek(f.completedAt) && f.reached !== false).length,
    visitsDone: fu.filter(f => f.kind === 'visit' && f.status === 'completed' && inWeek(f.completedAt)).length,
    sermons: m.sermons.filter(s => inWeek(s.date)).length,
  };
}

// Reminders that are due now (in-app; and the same list is queued for the push server when connected)
export function dueReminders(m, today, nowTime) {
  const r = m.settings.reminders;
  if (!r.enabled) return [];
  const quiet = r.quietFrom && r.quietTo && (r.quietFrom > r.quietTo ? (nowTime >= r.quietFrom || nowTime < r.quietTo) : (nowTime >= r.quietFrom && nowTime < r.quietTo));
  if (quiet) return [];
  const mins = (t) => { const [h, mm] = (t || '0:0').split(':').map(Number); return h * 60 + mm; };
  const out = alerts(m, today, nowTime).filter(a => {
    // Today's attendance reminder waits until the configured time after the meeting starts
    if (/^mt-(confirm|submit):/.test(a.key)) {
      const [type, date] = a.key.split(':').slice(1);
      const time = m.settings.times?.[type];
      if (date === today && time && mins(nowTime) < mins(time) + (Number(r.afterMinutes) || 0)) return false;
    }
    return true;
  });
  // A nudge shortly before today's meeting, once its time is set
  meetingList(m, today, 0).filter(mt => mt.date === today && mt.status !== 'cancelled' && m.settings.times?.[mt.type]).forEach(mt => {
    const start = mins(m.settings.times[mt.type]);
    const now = mins(nowTime);
    if (r.beforeMinutes > 0 && now >= start - r.beforeMinutes && now < start) out.push({ key: `mt-soon:${mt.key}`, cat: 'attendance', pri: 2, title: `${typeLabel(m, mt.type)} at ${m.settings.times[mt.type]}`, why: 'Starting soon.', href: `#/poimaino/services/${encodeURIComponent(mt.key)}`, due: today });
  });
  const fuTime = (a) => { const f = a.key.startsWith('fu:') && m.followUps.find(x => x.id === a.recordId); return f && f.due === today ? (f.time || r.followupTime || '') : ''; };
  // Heads-ups: from leadMinutes before a reminder until its time
  const lead = Number(r.leadMinutes ?? 30);
  const soonNow = (t) => lead && t && mins(nowTime) >= mins(t) - lead && mins(nowTime) < mins(t) && mins(t) - lead >= 0;
  if (lead) {
    const wd = weekdayOf(today);
    if (wd !== 0 && callsToday(m, today).some(x => !x.done)) teleTimes(m).forEach(t => { if (soonNow(t)) out.push({ key: `calls-soon:${today}:${t}`, cat: 'followups', pri: 2, tele: true, soon: true, lead, title: `Telepastoring at ${t}`, why: 'Starting soon.', href: '#/poimaino/followup/telepastoring', due: today }); });
    m.followUps.filter(f => !f.teleRetry && ['planned', 'attempted'].includes(f.status) && f.due === today && !(f.snoozedUntil && f.snoozedUntil > today)).forEach(f => {
      const t = f.time || r.followupTime; if (soonNow(t)) out.push({ key: `fu-soon:${f.id}`, cat: 'followups', pri: 2, soon: true, lead, title: `${f.kind === 'visit' ? 'Visit' : 'Follow-up'} at ${t}`, why: 'Starting soon.', href: '#/poimaino/followup', due: today, recordId: f.id });
    });
    const dt = m.settings.daily || {}, dd = dailyDone(m, today);
    [['daily-ev-soon', dt.evangelism, dd.evangelise, 'Evangelise'], ['daily-chat-soon', dt.chat, dd.chat, 'Bacenta chat'], ['daily-pvti-soon', dt.pvti, dd.pvti, 'PVTI']].forEach(([k, t, done, l]) => { if (!done && soonNow(t)) out.push({ key: `${k}:${today}`, cat: 'followups', pri: 2, soon: true, lead, title: `${l} at ${t}`, why: 'Starting soon.', href: '#/poimaino', due: today }); });
  }
  return out.filter(a => r.categories[a.cat] !== false && typeOn(m, notifyType(m, a.key)) && a.pri <= 2 && !m.sentReminders[`${a.key}@${today}`] && !(fuTime(a) && nowTime < fuTime(a)));
}

// What a notification may say. Lock screens are not private: never names, notes or care details.
export function reminderBody(list) {
  if (!list.length) return '';
  const n = list.length;
  const cats = [...new Set(list.map(x => x.cat))];
  const what = { attendance: 'attendance', followups: 'follow-ups', sermon: 'Thursday preparation', campaigns: 'campaign actions' };
  const tele = list.find(x => x.tele);
  if (tele) {
    const v = teleVerse(tele.key.split(':')[1] || '');
    const rest = list.filter(x => !x.tele).length;
    return `${tele.soon ? `Telepastoring in ${tele.lead} minutes.` : 'Time to telepastor.'} “${v.text}” ${v.ref}${rest ? ` (and ${rest} more ${rest === 1 ? 'thing needs' : 'things need'} you)` : ''}`;
  }
  if (list.every(x => x.soon)) return `Greater Love: in ${list[0].lead} minutes, ${n} ${n === 1 ? 'thing needs' : 'things need'} you (${cats.map(c => what[c] || c).join(', ')}).`;
  return `Greater Love: ${n} ${n === 1 ? 'thing needs' : 'things need'} you (${cats.map(c => what[c] || c).join(', ')}).`;
}

// A local date and time in a timezone, as a UTC instant (ISO).
export function zonedToUtc(date, time, tz) {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = (time || '00:00').split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date(guess)).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
  const asLocal = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute);
  return new Date(guess - (asLocal - guess)).toISOString();
}

// The next 7 days of reminders, for the push server. Only opaque keys, a category and a time:
// no names, notes or care details ever leave the device for a notification.
export function reminderSchedule(m, today, busy = []) {
  const r = m.settings.reminders;
  if (!r.enabled) return [];
  const tz = m.settings.timezone;
  const morning = r.quietTo || '07:00';
  const mins = (t) => { const [h, mm] = (t || '0:0').split(':').map(Number); return h * 60 + mm; };
  const hhmm = (n) => `${String(Math.floor(((n % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((n % 60) + 60) % 60).padStart(2, '0')}`;
  const inQuiet = (t) => r.quietFrom && r.quietTo && (r.quietFrom > r.quietTo ? (t >= r.quietFrom || t < r.quietTo) : (t >= r.quietFrom && t < r.quietTo));
  const until = addDays(today, 7);
  const out = [];
  const lead = Number(r.leadMinutes ?? 30);
  // a reminder at its time, and a heads-up `lead` minutes before (category "~30" tells the sender it is a heads-up)
  const add2 = (key, soonKey, cat, date, time) => { add(key, cat, date, time); const s = mins(time) - lead; if (lead && s >= 0) add(soonKey, `${cat}~${lead}`, date, hhmm(s)); };
  const add = (key, cat, date, time) => {
    if (r.categories[cat.split('~')[0]] === false || !typeOn(m, notifyType(m, key)) || date < today || date > until) return;
    let d = date, t = afterBusy(busy, date, time);
    if (inQuiet(t)) { if (r.quietFrom > r.quietTo && t >= r.quietFrom) d = addDays(d, 1); t = r.quietTo; } // moved to the end of quiet hours
    if (m.sentReminders[`${key}@${d}`]) return; // already shown in the app
    out.push({ key: `${key}@${d}`, cat, sendAt: zonedToUtc(d, t, tz) });
  };
  meetingList(m, today, 0).filter(mt => mt.status !== 'cancelled' && !submitted(mt) && m.settings.times?.[mt.type]).forEach(mt => {
    const start = mins(m.settings.times[mt.type]);
    if (r.beforeMinutes > 0) add(`mt-soon:${mt.key}`, 'attendance', mt.date, hhmm(start - r.beforeMinutes));
    add(`mt-submit:${mt.key}`, 'attendance', mt.date, hhmm(start + (Number(r.afterMinutes) || 0)));
  });
  m.followUps.filter(f => f.status === 'planned' && f.due && !f.teleRetry).forEach(f => add2(`fu:${f.id}`, `fu-soon:${f.id}`, 'followups', f.snoozedUntil && f.snoozedUntil > f.due ? f.snoozedUntil : f.due, f.time || r.followupTime || morning));
  // the daily rhythm at the times you set
  const dt = m.settings.daily || {};
  for (let d = today; d <= until; d = addDays(d, 1)) [['daily-ev', dt.evangelism], ['daily-chat', dt.chat], ['daily-pvti', dt.pvti]].forEach(([k, t]) => t && add2(`${k}:${d}`, `${k}-soon:${d}`, 'followups', d, t));
  sermonPlan(m, addDays(today, -1)).filter(x => x.status !== 'done' && x.status !== 'waiting').forEach(x => add(`sermon:${x.sermonId}:${x.stage}`, 'sermon', x.date, morning));
  m.campaigns.filter(c => c.status === 'active').forEach(c => (c.activities || []).filter(a => !a.done && a.due).forEach(a => add(`cmp:${c.id}:${a.id}`, 'campaigns', a.due, morning)));
  for (let d = today; d <= until; d = addDays(d, 1)) if (weekdayOf(d) !== 0 && m.people.some(isTeleSoul)) teleTimes(m).forEach(t => add2(`calls:${d}:${t}`, `calls-soon:${d}:${t}`, 'tele', d, t));
  if (r.digest === 'morning') {
    // one summary per day instead of one per item
    const days = [...new Set(out.map(x => x.key.split('@')[1]))];
    return days.map(d => ({ key: `digest@${d}`, cat: 'digest', sendAt: zonedToUtc(d, morning, tz) }));
  }
  return out.sort((a, b) => a.sendAt.localeCompare(b.sendAt));
}

// ── People, the soul list and invitations ──
// People: everyone who has come to church at least once. The soul list: everyone, plus anyone you pray for.
export const AREAS = [['bham', 'Birmingham'], ['uk', 'Elsewhere in the UK'], ['abroad', 'Outside the UK']];
export const areaOf = (p) => p.area || 'bham';
export const areaLabel = (p) => areaOf(p) === 'abroad' ? (p.country || 'Outside the UK') : AREAS.find(a => a[0] === areaOf(p))[1];
export const visitsOf = (p, index) => new Set((index[p.id] || []).map(x => x.date)).size;
export const inChurch = (p, index) => ['visitor', 'returning', 'member', 'stable', 'transferred', 'departed'].includes(p.membership) || visitsOf(p, index) > 0;
// First and second timers by days present; members are never either
export const timerOf = (p, index) => REGISTERED.includes(p.membership) || ['transferred', 'departed'].includes(p.membership) ? '' : visitsOf(p, index) ? ({ 1: 'first', 2: 'second' })[visitsOf(p, index)] || '' : ['first', 'second'].includes(p.tag) ? p.tag : '';
export const onSoulList = (p) => !['transferred', 'departed'].includes(p.membership);
export const soulSource = (m, p, index) => inChurch(p, index) ? 'church' : m.encounters.some(e => e.personId === p.id) ? 'encounter' : 'added';

// The invitation week: from Sunday to the Saturday service. Invited means an invitation made this week
// or one for a meeting this week; abroad, it means you encouraged them to go to church where they are.
export function inviteWeek(m, today) {
  const satDay = Number(MEETING_TYPES.find(t => t.id === 'sat').weekday);
  let end = today; while (weekdayOf(end) !== satDay) end = addDays(end, 1);
  const start = addDays(end, -6);
  const meetings = meetingList(m, today, 0).filter(x => x.date >= today && x.date <= end && x.status !== 'cancelled');
  const inWeek = (d) => d && d >= start && d <= end;
  const rows = m.people.filter(p => onSoulList(p) && !p.declinedContact).map(p => {
    const inv = m.invitations.filter(i => i.personId === p.id && (inWeek(i.date) || inWeek((i.meetingKey || '').split(':')[1])));
    return { p, area: areaOf(p), inv };
  });
  return { start, end, meetings, rows, left: rows.filter(r => !r.inv.length) };
}

// A verse to go with each telepastoring reminder (KJV), changing day by day
export const TELE_VERSES = [
  { text: 'Feed my sheep.', ref: 'John 21:17' },
  { text: 'Be thou diligent to know the state of thy flocks, and look well to thy herds.', ref: 'Proverbs 27:23' },
  { text: 'Feed the flock of God which is among you, taking the oversight thereof.', ref: '1 Peter 5:2' },
  { text: 'Go out into the highways and hedges, and compel them to come in, that my house may be filled.', ref: 'Luke 14:23' },
  { text: 'I will feed my flock, and I will cause them to lie down, saith the Lord GOD.', ref: 'Ezekiel 34:15' },
  { text: 'The good shepherd giveth his life for the sheep.', ref: 'John 10:11' },
  { text: 'Exhort one another daily, while it is called To day.', ref: 'Hebrews 3:13' },
];
export const teleVerse = (d) => TELE_VERSES[(Number(String(d).replace(/-/g, '')) || 0) % TELE_VERSES.length];

// ── Every kind of Poimainō notification, each with its own switch ──
export const NOTIFY_TYPES = [
  { id: 'tele', label: 'Telepastoring', desc: 'At each of your telepastoring times, Monday to Saturday, while anyone is still to reach. Each one carries a verse.' },
  { id: 'deadline', label: 'Telepastoring deadlines', desc: 'Birmingham not all reached by Wednesday; outside Birmingham not all reached by Friday.' },
  { id: 'followups', label: 'Follow-ups due', desc: 'Calls, messages, prayer, welfare and care follow-ups on their day, at their own time or your follow-up time.' },
  { id: 'visits', label: 'Visits', desc: 'A planned visit on its day, and a heads-up three days before.' },
  { id: 'meetingSoon', label: 'Before a meeting', desc: 'Shortly before Thursday Bible study and Saturday church start.' },
  { id: 'attendance', label: 'Attendance and reports', desc: 'A meeting that needs its attendance confirmed or submitted.' },
  { id: 'prepare', label: 'Prepare people for a meeting', desc: 'The day before and the day of a meeting, if people haven’t been contacted or invited.' },
  { id: 'sermon', label: 'Thursday sermon', desc: 'Each preparation step on its planned day.' },
  { id: 'evangelism', label: 'Evangelise today', desc: 'At your evangelism time, if no encounter is recorded yet.' },
  { id: 'chat', label: 'Bacenta chat', desc: 'At your chat time, if nothing is shared yet.' },
  { id: 'pvti', label: 'PVTI', desc: 'At your PVTI time, if no prayer, visit, teaching or interaction is recorded yet.' },
  { id: 'welcome', label: 'Welcome first timers', desc: 'Someone came for the first time and hasn’t been welcomed yet.' },
  { id: 'absence', label: 'Check in after missed meetings', desc: 'A member marked absent at several meetings in a row.' },
  { id: 'care', label: 'Care reviews', desc: 'A care need reaches its review date.' },
  { id: 'campaigns', label: 'Campaign actions', desc: 'A campaign activity is due.' },
];
const PREFIX = [['calls:', 'tele'], ['calls-soon:', 'tele'], ['tele-bham', 'deadline'], ['tele-other', 'deadline'], ['visit-soon:', 'visits'], ['mt-soon:', 'meetingSoon'], ['mt-confirm:', 'attendance'], ['mt-submit:', 'attendance'],
  ['prep:', 'prepare'], ['sermon:', 'sermon'], ['daily-ev', 'evangelism'], ['daily-chat', 'chat'], ['daily-pvti', 'pvti'], ['welcome:', 'welcome'], ['absent:', 'absence'], ['care:', 'care'], ['cmp:', 'campaigns']];
export function notifyType(m, key) {
  if (key.startsWith('fu:') || key.startsWith('fu-soon:')) { const f = m.followUps.find(x => x.id === key.split(':')[1]); return f?.kind === 'visit' ? 'visits' : 'followups'; }
  return PREFIX.find(([p]) => key.startsWith(p))?.[1] || 'followups';
}
export const typeOn = (m, id) => m.settings.reminders.types?.[id] !== false;

// A sample of each kind, for the Test buttons. Generic, like the real ones: no names on the lock screen.
export const NOTIFY_SAMPLE = {
  tele: () => { const v = teleVerse(new Date().toISOString().slice(0, 10)); return `Time to telepastor. “${v.text}” ${v.ref}`; },
  deadline: () => 'Greater Love: 1 thing needs you (follow-ups).', followups: () => 'Greater Love: 1 thing needs you (follow-ups).',
  visits: () => 'Greater Love: 1 thing needs you (follow-ups).', meetingSoon: () => 'Greater Love: 1 thing needs you (attendance).',
  attendance: () => 'Greater Love: 1 thing needs you (attendance).', prepare: () => 'Greater Love: 1 thing needs you (attendance).',
  sermon: () => 'Greater Love: 1 thing needs you (Thursday preparation).', evangelism: () => 'Greater Love: 1 thing needs you (follow-ups).',
  chat: () => 'Greater Love: 1 thing needs you (follow-ups).', pvti: () => 'Greater Love: 1 thing needs you (follow-ups).',
  welcome: () => 'Greater Love: 1 thing needs you (follow-ups).', absence: () => 'Greater Love: 1 thing needs you (follow-ups).',
  care: () => 'Greater Love: 1 thing needs you (follow-ups).', campaigns: () => 'Greater Love: 1 thing needs you (campaign actions).',
};
