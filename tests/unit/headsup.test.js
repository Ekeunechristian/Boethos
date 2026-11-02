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
    expect(at('04:30')[0]).toEqual(expect.objectContaining({ key: 'quiet-soon', soon: true, text: 'In 30 minutes: your quiet time.' }));
    expect(at('05:00')[0]).toEqual(expect.objectContaining({ key: 'quiet', text: 'Time for your quiet time.' }));
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
