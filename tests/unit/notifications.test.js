import { describe, it, expect } from 'vitest';
import * as M from '../../src/store/ministry.js';
import * as L from '../../src/store/life.js';
import { busyAt, afterBusy, weeklyHours, commitmentsOf } from '../../src/lib/busy.js';
import { ministry, run, MON, day } from './helpers.js';

const withPeople = () => ministry([{ id: 'a', name: 'Ama Secret', membership: 'member', phone: '07700900000' }]);
const on = (m) => ({ ...m, settings: { ...m.settings, reminders: { ...m.settings.reminders, enabled: true } } });
const types = (list, m) => [...new Set(list.map(a => M.notifyType(m, a.key)))];

describe('Every kind of notification has a type and a switch', () => {
  it('each alert key maps to one of the listed types', () => {
    const ids = M.NOTIFY_TYPES.map(t => t.id);
    ['calls:x', 'tele-bham:x', 'tele-other:x', 'visit-soon:x', 'mt-soon:x', 'mt-confirm:x', 'mt-submit:x', 'prep:x', 'sermon:x', 'daily-ev:x', 'daily-chat:x', 'daily-pvti:x', 'welcome:x', 'absent:x', 'care:x', 'cmp:x']
      .forEach(k => expect(ids).toContain(M.notifyType(withPeople(), k)));
  });

  it('a follow-up that is a visit counts as a visit', () => {
    let m = withPeople();
    m = run(m, { type: 'M_FOLLOW_ADD', data: { personId: 'a', kind: 'visit', title: 'Visit', due: MON } });
    expect(M.notifyType(m, `fu:${m.followUps[0].id}`)).toBe('visits');
  });

  it('telepastoring reminds at each of your times, and a type switched off stays quiet', () => {
    let m = on(withPeople());
    m = { ...m, people: m.people.map(p => ({ ...p, callDay: 1 })) };
    expect(M.dueReminders(m, MON, '13:05').find(a => a.tele).key).toBe(`calls:${MON}:13:00`);
    expect(M.dueReminders(m, MON, '18:30').find(a => a.tele).key).toBe(`calls:${MON}:18:00`);
    m = run(m, { type: 'M_SETTINGS', data: { reminders: { types: { tele: false } } } });
    expect(M.dueReminders(m, MON, '13:05').some(a => a.tele)).toBe(false);
  });

  it('a follow-up reminder waits for its own time, or your follow-up time', () => {
    let m = on(withPeople());
    m = run(m, { type: 'M_FOLLOW_ADD', data: { personId: 'a', kind: 'call', title: 'Call', due: MON, time: '15:00' } });
    const fu = (t) => M.dueReminders(m, MON, t).some(a => a.key.startsWith('fu:'));
    expect(fu('10:00')).toBe(false);
    expect(fu('15:01')).toBe(true);
  });

  it('nothing arrives in quiet hours', () => {
    let m = on(withPeople());
    m = { ...m, people: m.people.map(p => ({ ...p, callDay: 1 })) };
    expect(M.dueReminders(m, MON, '23:00')).toHaveLength(0);
  });

  it('the push schedule covers telepastoring several times a day, never on Sunday', () => {
    const m = on(withPeople());
    const s = M.reminderSchedule(m, MON).filter(x => x.cat === 'tele');
    expect(s.filter(x => x.key.endsWith(`@${MON}`))).toHaveLength(3);
    expect(s.some(x => x.key.endsWith(`@${day(6)}`))).toBe(false);
  });

  it('the push schedule includes the daily evangelism, chat and PVTI times you set', () => {
    let m = on(withPeople());
    m = run(m, { type: 'M_SETTINGS', data: { daily: { evangelism: '16:00', chat: '08:00', pvti: '19:00' } } });
    const keys = M.reminderSchedule(m, MON).map(x => x.key);
    ['daily-ev', 'daily-chat', 'daily-pvti'].forEach(k => expect(keys.some(x => x.startsWith(k))).toBe(true));
  });

  it('a reminder during a commitment is moved to when it ends', () => {
    const m = on(withPeople());
    const busy = [{ id: 'w', name: 'Work', days: [1], from: '09:00', to: '17:00' }];
    const tele = M.reminderSchedule(m, MON, busy).filter(x => x.cat === 'tele' && x.key.endsWith(`@${MON}`)).map(x => x.sendAt);
    const plain = M.reminderSchedule(m, MON).filter(x => x.cat === 'tele' && x.key.endsWith(`@${MON}`)).map(x => x.sendAt);
    expect(tele[0]).not.toBe(plain[0]);                        // 09:00 → 17:00
    expect(tele[2]).toBe(plain[2]);                            // 18:00 is outside work
  });

  it('notification text never carries names, and telepastoring carries a verse', () => {
    let m = on(withPeople());
    m = run(m, { type: 'M_FOLLOW_ADD', data: { personId: 'a', kind: 'call', title: 'Ask Ama Secret about her mother', due: MON } });
    m = { ...m, people: m.people.map(p => ({ ...p, callDay: 1 })) };
    const body = M.reminderBody(M.dueReminders(m, MON, '13:05'));
    expect(body).not.toMatch(/Ama|Secret|mother/);
    expect(body.startsWith('Time to telepastor. “')).toBe(true);
    expect(M.reminderBody(M.dueReminders({ ...m, people: [] }, MON, '13:05'))).toMatch(/^Greater Love: /);
  });

  it('every type has a sample for its Test button', () => {
    M.NOTIFY_TYPES.forEach(t => expect(M.NOTIFY_SAMPLE[t.id]()).toMatch(/\w/));
  });
});

describe('Your life: commitments', () => {
  const work = [{ id: 'w', name: 'Work', days: [1, 2, 3, 4, 5], from: '09:00', to: '17:00' }, { id: 'p', name: 'Piano', days: [1], from: '17:00', to: '18:00' }];
  it('knows when you are busy', () => {
    expect(busyAt(work, MON, '10:00').name).toBe('Work');
    expect(busyAt(work, day(5), '10:00')).toBeNull();          // Saturday
  });
  it('a reminder waits through commitments that follow one another', () => {
    expect(afterBusy(work, MON, '12:00')).toBe('18:00');
    expect(afterBusy(work, day(1), '12:00')).toBe('17:00');
  });
  it('a commitment can end on a date', () => {
    expect(busyAt([{ ...work[0], until: day(-1) }], MON, '10:00')).toBeNull();
  });
  it('counts hours a week', () => {
    expect(weeklyHours(work)).toBe(41);
  });
  it('old plain-word commitments are kept, without times', () => {
    expect(commitmentsOf({ otherCommitments: ['piano'] })).toEqual([expect.objectContaining({ name: 'piano', days: [] })]);
  });
});

describe('Your walk with God reminders', () => {
  const state = (profile = {}) => {
    const life = L.initialLife(); life.setupDone = true;
    return { life, prayerRequests: [], prayerSessions: [], events: [], ministry: M.initialMinistry(), profile };
  };
  it('quiet time reminds at its time', () => {
    const s = state();
    expect(L.lifeReminders(s, MON, s.life.goals.quietTime).some(x => x.key === 'quiet')).toBe(true);
  });
  it('switched off, it stays quiet', () => {
    const s = state(); s.life.goals.reminders.quiet = false;
    expect(L.lifeReminders(s, MON, s.life.goals.quietTime).some(x => x.key === 'quiet')).toBe(false);
  });
  it('during a commitment it waits, and arrives when it ends', () => {
    const s = state({ commitments: [{ id: 'w', name: 'Early shift', days: [1], from: '05:00', to: '07:00' }] });
    expect(L.lifeReminders(s, MON, s.life.goals.quietTime).some(x => x.key === 'quiet')).toBe(false);
    expect(L.lifeReminders(s, MON, '07:05').some(x => x.key === 'quiet')).toBe(true);
  });
  it('the push schedule covers each prayer time', () => {
    const s = state();
    const today = L.lifeSchedule(s, MON).filter(x => x.cat === 'prayer');
    expect(today.length).toBeGreaterThan(0);
  });
});
