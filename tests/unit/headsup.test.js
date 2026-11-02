import { describe, it, expect } from 'vitest';
import * as M from '../../src/store/ministry.js';
import * as L from '../../src/store/life.js';
import { parseTime } from '../../src/lib/TimeInput.jsx';
import { ministry, run, MON } from './helpers.js';

const on = (m) => ({ ...m, settings: { ...m.settings, reminders: { ...m.settings.reminders, enabled: true } } });

describe('A heads-up before every timed reminder, then the reminder at its time', () => {
  const life = (lead) => {
    const l = L.initialLife(); l.setupDone = true; l.goals.quietTime = '05:00';
    const m = M.initialMinistry(); if (lead !== undefined) m.settings.reminders.leadMinutes = lead;
    return { life: l, prayerRequests: [], prayerSessions: [], events: [], ministry: m, profile: {} };
  };

  it('quiet time at 05:00: a heads-up at 04:30, then the reminder at 05:00', () => {
    const s = life();
    const at = (t) => L.lifeReminders(s, MON, t).filter(x => x.cat === 'quiet');
    expect(at('04:20')).toHaveLength(0);
    expect(at('04:30')[0]).toEqual(expect.objectContaining({ key: 'quiet-soon', soon: true }));
    expect(at('04:30')[0].text).toMatch(/^In 30 minutes: quiet time \(05:00\)\. Today’s reading: Genesis 1–3\. “.+” (Mark|Psalm) [\d:]+$/);
    expect(at('05:00')[0].key).toBe('quiet');
    expect(at('05:00')[0].text).toMatch(/^Quiet time \(05:00\)\. Today’s reading: Genesis 1–3\. “/);
  });

  it('the heads-up can be 15 minutes, or switched off', () => {
    expect(L.lifeReminders(life(15), MON, '04:40').some(x => x.key === 'quiet-soon')).toBe(false);
    expect(L.lifeReminders(life(15), MON, '04:45').some(x => x.key === 'quiet-soon')).toBe(true);
    expect(L.lifeReminders(life(0), MON, '04:45').some(x => x.key === 'quiet-soon')).toBe(false);
  });

  it('the push schedule sends both for each prayer time', () => {
    const s = life();
    const sched = L.lifeSchedule(s, MON).filter(x => x.key.includes('prayer-12:00'));
    expect(sched.some(x => x.key.startsWith('life-prayer-12:00-soon') && x.cat === 'prayer~30')).toBe(true);
    expect(sched.some(x => x.key.startsWith('life-prayer-12:00@') && x.cat === 'prayer')).toBe(true);
  });

  it('telepastoring gets a heads-up before each of your times, with a verse', () => {
    let m = on(ministry([{ id: 'a', name: 'Ama', membership: 'member' }]));
    m = { ...m, people: m.people.map(p => ({ ...p, callDay: 1 })) };
    const soon = M.dueReminders(m, MON, '12:40').filter(a => a.key.startsWith('calls-soon:'));
    expect(soon.map(a => a.key)).toEqual([`calls-soon:${MON}:13:00`]);
    expect(M.reminderBody(soon)).toMatch(/^Telepastoring in 30 minutes\. “/);
    expect(M.reminderSchedule(m, MON).some(x => x.key.startsWith(`calls-soon:${MON}:09:00`) && x.cat === 'tele~30')).toBe(true);
  });

  it('a follow-up at 15:00 gives a heads-up at 14:30, with no names', () => {
    let m = on(ministry([{ id: 'a', name: 'Ama Secret', membership: 'member' }]));
    m = run(m, { type: 'M_FOLLOW_ADD', data: { personId: 'a', kind: 'visit', title: 'Visit Ama Secret', due: MON, time: '15:00' } });
    const soon = M.dueReminders(m, MON, '14:35').filter(a => a.soon && a.key.startsWith('fu-soon:'));
    expect(soon).toHaveLength(1);
    expect(M.notifyType(m, soon[0].key)).toBe('visits');
    expect(M.reminderBody(soon)).toBe('Greater Love: in 30 minutes, 1 thing needs you (follow-ups).');
  });

  it('the daily evangelism time gets a heads-up too', () => {
    let m = on(ministry([{ id: 'a', name: 'Ama', membership: 'member' }]));
    m = run(m, { type: 'M_SETTINGS', data: { daily: { evangelism: '16:00' } } });
    expect(M.dueReminders(m, MON, '15:45').some(a => a.key.startsWith('daily-ev-soon:'))).toBe(true);
  });
});

describe('Notifications say exactly what to do, with a verse that fits', () => {
  it('a follow-up names the person and the task', () => {
    let m = on(ministry([{ id: 'a', name: 'Sarah Lin', membership: 'member' }]));
    m = run(m, { type: 'M_FOLLOW_ADD', data: { personId: 'a', kind: 'call', title: 'Ask how her exams went', due: MON, time: '15:00' } });
    const a = M.dueReminders(m, MON, '15:05').find(x => x.key.startsWith('fu:'));
    expect(a.body).toMatch(/^Call Sarah: Ask how her exams went at 15:00\. “/);
  });
  it('a prayer follow-up says who to pray for', () => {
    let m = on(ministry([{ id: 'a', name: 'Sarah Lin', membership: 'member' }]));
    m = run(m, { type: 'M_FOLLOW_ADD', data: { personId: 'a', kind: 'prayer', title: 'Her job interview', due: MON } });
    expect(M.dueReminders(m, MON, '09:30').find(x => x.key.startsWith('fu:')).body).toMatch(/^Pray for Sarah: Her job interview\./);
  });
  it('telepastoring names who is still to reach', () => {
    let m = on(ministry([{ id: 'a', name: 'Sarah Lin', membership: 'member' }, { id: 'b', name: 'Ama Mensah', membership: 'member' }]));
    m = { ...m, people: m.people.map(p => ({ ...p, callDay: 1 })) };
    expect(M.dueReminders(m, MON, '13:05').find(x => x.tele).body).toMatch(/^Telepastor now: (Sarah and Ama|Ama and Sarah) still to reach today\. “/);
  });
  it('prayer reminders carry a prayer verse, and the verse changes from one reminder to the next', () => {
    const l = L.initialLife(); l.setupDone = true;
    const s = { life: l, prayerRequests: [], prayerSessions: [], events: [], ministry: M.initialMinistry(), profile: {} };
    const texts = l.goals.prayerTimes.map(t => L.lifeReminders(s, MON, t).find(x => x.key === `prayer-${t}`).text);
    texts.forEach(t => expect(t).toMatch(/(Luke 18:1|1 Thessalonians 5:17|Jeremiah 33:3|Matthew 26:41|Philippians 4:6)$/));
    const verses = new Set(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'].flatMap(d => l.goals.prayerTimes.map(t => L.lifeReminders(s, d, t).find(x => x.key === `prayer-${t}`).text.split('“')[1])));
    expect(verses.size).toBeGreaterThan(1);
  });
  it('the push queue carries the words, unless you hide details', () => {
    let m = on(ministry([{ id: 'a', name: 'Sarah Lin', membership: 'member' }]));
    m = run(m, { type: 'M_FOLLOW_ADD', data: { personId: 'a', kind: 'visit', title: 'Pray with the family', due: MON, time: '18:00' } });
    expect(M.reminderSchedule(m, MON).find(x => x.key.startsWith('fu:')).body).toMatch(/^Visit Sarah: Pray with the family at 18:00\./);
    m = run(m, { type: 'M_SETTINGS', data: { reminders: { hideDetails: true } } });
    expect(M.reminderSchedule(m, MON).find(x => x.key.startsWith('fu:')).body).toBeUndefined();
  });
});

describe('Typing a time', () => {
  it('reads the ways people type times', () => {
    expect(parseTime('5')).toBe('05:00');
    expect(parseTime('530')).toBe('05:30');
    expect(parseTime('5:30')).toBe('05:30');
    expect(parseTime('17.45')).toBe('17:45');
    expect(parseTime('5pm')).toBe('17:00');
    expect(parseTime('12 am')).toBe('00:00');
    expect(parseTime('')).toBe('');
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime('abc')).toBeNull();
  });
});
