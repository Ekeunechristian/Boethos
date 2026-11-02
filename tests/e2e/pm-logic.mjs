// Poimainō validation (spec Part 10): the real reducer and selectors, run in the browser via the Vite dev server.
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
await p.goto('http://localhost:4319/', { waitUntil: 'networkidle0' });
const results = await p.evaluate(async () => {
  const M = await import('/src/store/ministry.js');
  const D = await import('/src/data/ministry.js');
  const P = await import('/src/lib/privacy.js');
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail });
  const T = '2026-11-05'; // a Thursday
  const SAT = '2026-11-07', PREV_THU = '2026-10-29', PREV_SAT = '2026-10-31';
  const base = () => { const m = M.initialMinistry(); m.settings.timezone = 'Europe/London'; m.settings.meetingsFrom = '2026-09-01'; return m; };
  let m; const R = (a, today = T) => { m = M.ministryReducer(m, a, today); return m; };

  // 1. Soul → visitor → member, one record throughout
  m = base();
  R({ type: 'M_PERSON_ADD', data: { id: 'ama', name: 'Ama Mensah', phone: '07700 900123' }, reason: 'Met at outreach' });
  R({ type: 'M_PERSON_UPDATE', id: 'ama', data: { membership: 'visitor' }, reason: 'First visit' });
  R({ type: 'M_PERSON_UPDATE', id: 'ama', data: { membership: 'member' }, reason: 'Joined' });
  const ama = m.people.find(x => x.id === 'ama');
  check('1. Soul → visitor → member keeps one record with dated history', m.people.length === 1 && ama.membershipHistory.map(h => h.to).join('>') === 'contact>visitor>member', ama.membershipHistory.map(h => h.to).join(' > '));
  check('1b. Re-entering the same name is flagged as a duplicate', M.duplicates(m, null, { ...M.blankPerson('Ama Mensah', T), name: 'ama  mensah' }).length === 1);
  check('1c. A shared phone alone is not a duplicate', M.duplicates(m, null, { ...M.blankPerson('Kofi Boateng', T), phone: '07700900123' }).length === 0);

  // 2. Merge: records, attendance and follow-ups move; nothing lost; one entry per service
  R({ type: 'M_PERSON_ADD', data: { id: 'ama2', name: 'Ama M.', phone: '07700 900123' } });
  R({ type: 'M_ATTEND', key: `thu:${PREV_THU}`, personId: 'ama', value: 'absent' });
  R({ type: 'M_ATTEND', key: `thu:${PREV_THU}`, personId: 'ama2', value: 'present' });
  R({ type: 'M_FOLLOW_ADD', data: { personId: 'ama2', kind: 'call', title: 'Welcome call', due: T } });
  R({ type: 'M_RESTRICTED_ADD', id: 'ama2', kind: 'notes', data: { text: 'Private: family matter' } });
  R({ type: 'M_PERSON_MERGE', into: 'ama', from: 'ama2' });
  const mt = m.meetings[`thu:${PREV_THU}`];
  const merged = m.people.find(x => x.id === 'ama');
  check('2. Merge leaves one person with attendance, follow-ups and notes joined', m.people.length === 1 && mt.entries.ama === 'present' && !mt.entries.ama2 && m.followUps[0].personId === 'ama' && merged.restricted.notes.length === 1 && merged.mergedIds.includes('ama2'));

  // 3. Stage 5 unresolved; not assessed is not stage 0
  m = base();
  R({ type: 'M_PERSON_ADD', data: { id: 'a', name: 'A' } });
  R({ type: 'M_PERSON_ADD', data: { id: 'b', name: 'B', stage: 2 } });
  check('3. Stage 5 is Son', D.STAGES_DEFAULT[5].label === 'Son' && M.stageLabel(m, 5) === '5 · Son', M.stageLabel(m, 5));
  check('3b. Unassessed person is "Not assessed", never stage 0', m.people.find(x => x.id === 'a').stage === null && M.stageLabel(m, null) === 'Not assessed' && m.people.filter(x => x.stage === 0).length === 0);

  // 4. Thursday and Saturday are distinct; a person at both counts once as a person
  m = base();
  R({ type: 'M_PERSON_ADD', data: { id: 'k', name: 'Kwame', membership: 'member' } });
  const keys = M.meetingList(m, T, 1).map(x => x.key);
  check('4. Weekly occurrences are Thursday and Saturday only (no default Sunday)', keys.includes(`thu:${T}`) && keys.includes(`sat:${SAT}`) && !keys.some(k => M.weekdayOf(k.split(':')[1]) === 0), keys.slice(-4).join(', '));
  R({ type: 'M_ATTEND', key: `thu:${T}`, personId: 'k', value: 'present' }); R({ type: 'M_SUBMIT', key: `thu:${T}` });
  R({ type: 'M_ATTEND', key: `sat:${SAT}`, personId: 'k', value: 'present' }, SAT); R({ type: 'M_SUBMIT', key: `sat:${SAT}` }, SAT);
  const wk = M.weekSummary(m, M.mondayOf(T));
  check('4b. Week: 2 service attendances, 1 unique person', wk.serviceAttendances === 2 && wk.uniquePeople === 1, `attendances ${wk.serviceAttendances}, unique ${wk.uniquePeople}`);

  // 5. Idempotent submit and 7. amendments keep versions
  R({ type: 'M_SUBMIT', key: `thu:${T}` });
  check('5. Submitting the same report twice adds no version', m.meetings[`thu:${T}`].report.versions.length === 1);
  R({ type: 'M_PERSON_ADD', data: { id: 'v', name: 'Visitor V', membership: 'visitor' } });
  R({ type: 'M_ATTEND', key: `thu:${T}`, personId: 'v', value: 'present' });
  check('7. Editing a submitted report starts an amendment (state "amending")', M.meetingState(m, M.meetingList(m, T, 1).find(x => x.key === `thu:${T}`), T, '23:00') === 'amending');
  R({ type: 'M_SUBMIT', key: `thu:${T}`, note: 'Added a late arrival' });
  const vs = m.meetings[`thu:${T}`].report.versions;
  check('7b. Amendment is version 2; version 1 is untouched', vs.length === 2 && m.meetings[`thu:${T}`].report.state === 'amended' && Object.keys(vs[0].entries).length === 1 && Object.keys(vs[1].entries).length === 2);

  // 6. Missing, zero, cancelled, unmarked are distinct
  m = base();
  R({ type: 'M_PERSON_ADD', data: { id: 'mem', name: 'Member M', membership: 'member' } });
  const list = (today) => M.meetingList(m, today, 2);
  const st = (key, today = T, now = '23:00') => M.meetingState(m, list(today).find(x => x.key === key), today, now);
  check('6a. A past meeting with nothing recorded is "unconfirmed" (missing), not zero', st(`sat:${PREV_SAT}`) === 'unconfirmed');
  R({ type: 'M_MEETING_SET', key: `thu:${PREV_THU}`, data: { status: 'held' } }); R({ type: 'M_SUBMIT', key: `thu:${PREV_THU}` });
  const zero = M.meetingStats(m, m.meetings[`thu:${PREV_THU}`], M.submitted(m.meetings[`thu:${PREV_THU}`]));
  check('6b. A held meeting submitted with no one is a real zero', st(`thu:${PREV_THU}`) === 'submitted' && zero.total === 0);
  R({ type: 'M_MEETING_SET', key: `sat:${PREV_SAT}`, data: { status: 'cancelled', cancelReason: 'Venue closed' } });
  check('6c. Cancelled is its own state and raises no "missing report" alert', st(`sat:${PREV_SAT}`) === 'cancelled' && !M.alerts(m, T, '23:00').some(a => a.key.includes(`sat:${PREV_SAT}`)));
  R({ type: 'M_ATTEND', key: `thu:${T}`, personId: 'x', value: null }); R({ type: 'M_SUBMIT', key: `thu:${T}` });
  const s6 = M.meetingStats(m, m.meetings[`thu:${T}`], M.submitted(m.meetings[`thu:${T}`]));
  check('6d. An unmarked member is not counted absent', s6.absent === 0);
  check('6e. Future meeting is "scheduled", not missing', st(`sat:${SAT}`) === 'scheduled');

  // 8. Reflection: percentage change from zero is unavailable
  m = base();
  ['p1', 'p2', 'p3'].forEach(id => R({ type: 'M_PERSON_ADD', data: { id, name: id, membership: 'member' } }));
  R({ type: 'M_MEETING_SET', key: `thu:${PREV_THU}`, data: { status: 'held' } }); R({ type: 'M_SUBMIT', key: `thu:${PREV_THU}` });
  ['p1', 'p2', 'p3'].forEach(id => R({ type: 'M_ATTEND', key: `thu:${T}`, personId: id, value: 'present' })); R({ type: 'M_SUBMIT', key: `thu:${T}` });
  const rf = M.reflection(m, `thu:${T}`, T);
  check('8. From 0 to 3: absolute +3, no percentage', rf.change.abs === 3 && rf.change.pct === null, JSON.stringify(rf.change));
  check('8b. Thursday is compared with Thursday only', rf.prev.type === 'thu');

  // 9. A record linked to several campaigns counts once
  R({ type: 'M_CAMPAIGN_ADD', data: { id: 'c1', n: 1, status: 'active' } });
  R({ type: 'M_CAMPAIGN_ADD', data: { id: 'c2', n: 19, status: 'active' } });
  R({ type: 'M_ENCOUNTER_ADD', data: { personId: 'p1', date: T, gospel: true, campaignIds: ['c1', 'c2'] } });
  const w9 = M.weekSummary(m, M.mondayOf(T));
  check('9. One encounter shows in both campaigns and once in the week', M.campaignProgress(m, m.campaigns[0]).encounters === 1 && M.campaignProgress(m, m.campaigns[1]).encounters === 1 && w9.encounters === 1);
  R({ type: 'M_INVITE_ADD', data: { personId: 'p1', meetingKey: `sat:${SAT}` } }); R({ type: 'M_INVITE_ADD', data: { personId: 'p1', meetingKey: `sat:${SAT}` } });
  check('9b. Inviting the same person to the same meeting twice records one invitation', m.invitations.length === 1);

  // 10. Material arrives on Tuesday: the plan starts Tuesday; nothing is "failed"
  m = base();
  R({ type: 'M_SERMON_ADD', data: { id: 's1', date: T, received: '2026-11-03' } });
  const plan = M.sermonPlan(m, '2026-11-03');
  check('10. Tuesday material: review moves from Monday to Tuesday', plan.find(x => x.stage === 1).date === '2026-11-03' && plan.every(x => ['due', 'planned', 'done', 'waiting'].includes(x.status)), plan.slice(0, 3).map(x => `${x.label} ${x.date} ${x.status}`).join('; '));
  R({ type: 'M_SERMON_ADD', data: { id: 's2', date: '2026-11-12', received: '' } });
  check('10b. Without material, preparation is "waiting", not overdue', M.sermonPlan(m, '2026-11-10').filter(x => x.sermonId === 's2' && x.stage <= 5).every(x => x.status === 'waiting'));

  // 11. All 22 campaign templates
  const ns = D.CAMPAIGNS.map(c => c.n).sort((a, b) => a - b);
  check('11. 22 templates, numbered 1–22, each with source, emphasis and local actions', D.CAMPAIGNS.length === 22 && ns.join() === Array.from({ length: 22 }, (_, i) => i + 1).join() && D.CAMPAIGNS.every(c => c.source && c.ch && c.emphasis && c.now && c.grow), `${D.CAMPAIGNS.length} templates`);

  // 12. Stable movement reconciles to net change
  m = base();
  const mk = (id, hist) => ({ ...M.blankPerson(id, '2026-01-01'), id, name: id, membership: hist[hist.length - 1][1], membershipHistory: hist.map(([date, to], i) => ({ date, from: i ? hist[i - 1][1] : null, to })) });
  m.people = [
    mk('kept', [['2026-01-01', 'stable']]),
    mk('new', [['2026-01-01', 'member'], ['2026-10-10', 'stable']]),
    mk('left', [['2026-01-01', 'stable'], ['2026-10-12', 'departed']]),
    mk('moved', [['2026-01-01', 'stable'], ['2026-10-15', 'transferred']]),
    mk('back', [['2026-01-01', 'stable'], ['2026-05-01', 'member'], ['2026-10-20', 'stable']]),
  ];
  const mv = M.stableMovement(m, '2026-10-01', '2026-10-31');
  const countAt = (d) => m.people.filter(x => { let s = null; x.membershipHistory.forEach(h => { if (h.date <= d) s = h.to; }); return s === 'stable'; }).length;
  check('12. New + re-established − departed − transferred = end − start', mv.net === countAt('2026-10-31') - countAt('2026-09-30') && mv.establishedNew.length === 1 && mv.reestablished.length === 1 && mv.departed.length === 1 && mv.transferred.length === 1, `net ${mv.net}, start ${countAt('2026-09-30')}, end ${countAt('2026-10-31')}`);
  const v = M.vision(m, T);
  check('12b. Vision: baseline stays "reported" until the roster is reviewed', v.reviewed === false && v.gap === 2 * 0 + (25 - v.stable) && v.deadline === '', `stable ${v.stable}, gap ${v.gap}`);

  // 13. Reminders: quiet hours, categories, once only, generic text
  m = base();
  R({ type: 'M_PERSON_ADD', data: { id: 'q', name: 'Grace Lin' } });
  R({ type: 'M_FOLLOW_ADD', data: { id: 'f1', personId: 'q', kind: 'call', title: 'Ask about her mother', due: T } });
  check('13. Quiet hours suppress reminders', M.dueReminders(m, T, '23:30').length === 0 && M.dueReminders(m, T, '09:00').length > 0);
  R({ type: 'M_SETTINGS', data: { reminders: { categories: { followups: false } } } });
  check('13b. A category turned off is not reminded', !M.dueReminders(m, T, '09:00').some(x => x.cat === 'followups'));
  R({ type: 'M_SETTINGS', data: { reminders: { categories: { followups: true } } } });
  const due = M.dueReminders(m, T, '09:00');
  due.forEach(x => R({ type: 'M_REMINDER_SENT', key: `${x.key}@${T}` }));
  check('13c. A reminder already sent today is not sent again', M.dueReminders(m, T, '09:05').filter(x => x.cat === 'followups').length === 0);
  const body = M.reminderBody(due);
  check('13d. Notification text is generic (no names or titles)', !body.includes('Grace') && !body.includes('mother') && (body.startsWith('Greater Love:') || body.startsWith('Time to telepastor.')), body);
  const sched = M.reminderSchedule({ ...base(), people: m.people, followUps: m.followUps.map(f => ({ ...f, status: 'planned', due: '2026-11-06' })) }, T);
  check('13e. Push schedule holds only opaque keys, a category and a time', sched.length > 0 && sched.every(x => Object.keys(x).sort().join() === 'cat,key,sendAt' && !JSON.stringify(x).includes('Grace')), JSON.stringify(sched[0]));
  const ms = base(); ms.settings.times.thu = '19:00'; ms.settings.reminders.quietFrom = '22:00'; ms.settings.reminders.quietTo = '07:00';
  const sch2 = M.reminderSchedule(ms, T).filter(x => x.key.startsWith('mt-soon:thu'));
  check('13f. "Starting soon" is 18:00 London time (UTC in winter)', sch2[0]?.sendAt === `${T}T18:00:00.000Z`, sch2[0]?.sendAt);

  // Privacy: restricted notes out of alerts, backups and sync by default
  m = base();
  R({ type: 'M_PERSON_ADD', data: { id: 'r', name: 'R' } });
  R({ type: 'M_RESTRICTED_ADD', id: 'r', kind: 'care', data: { need: 'Debt counselling', reviewDate: T, status: 'Open' } });
  const al = M.alerts(m, T, '09:00');
  check('P1. A care review alert never shows the care details', al.some(a => a.key.startsWith('care:')) && !JSON.stringify(al).includes('Debt'));
  const st0 = { ministry: m };
  const stripped = P.stripRestricted(st0);
  check('P2. Backups and sync leave restricted notes out by default', !JSON.stringify(stripped).includes('Debt'));
  const back = P.keepLocalRestricted(stripped, st0);
  check('P3. Restoring a stripped copy keeps the notes already on this device', JSON.stringify(back).includes('Debt'));
  // Migration is additive: existing Poimainō records are never dropped, legacy ones added once
  m = base(); R({ type: 'M_PERSON_ADD', data: { id: 'keep', name: 'Already here' } });
  const mig = M.migrateLegacy({ members: [{ id: 'old1', name: 'From Flock', status: 'Growing' }], sermons: [{ id: 'os', title: 'Old sermon' }] }, m);
  const again = M.migrateLegacy({ members: [{ id: 'old1', name: 'From Flock' }] }, { ...mig, migratedFrom: null });
  check('M1. Migration adds legacy records without dropping existing ones', mig.people.length === 2 && mig.people.some(x => x.id === 'keep') && mig.sermons.length === 1 && again.people.length === 2);
  return out;
});
let fail = 0;
for (const r of results) { if (!r.ok) fail++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`); }
console.log(`\n${results.length - fail}/${results.length} passed`);
await b.close();
process.exit(fail ? 1 : 0);
