import { describe, it, expect } from 'vitest';
import * as M from '../../src/store/ministry.js';
import { ministry, attend, run, MON, day } from './helpers.js';

describe('People and the soul list', () => {
  const base = () => ministry([
    { id: 'ama', name: 'Ama', membership: 'member' },
    { id: 'esi', name: 'Esi', membership: 'visitor' },
    { id: 'yaw', name: 'Yaw', membership: 'contact' },
    { id: 'tom', name: 'Tom', membership: 'prayer', area: 'abroad', country: 'Cameroon' },
    { id: 'old', name: 'Old', membership: 'departed' },
  ]);

  it('People holds only those who have come to church at least once', () => {
    let m = base();
    const idx = () => M.presenceIndex(m);
    expect(m.people.filter(p => M.inChurch(p, idx())).map(p => p.id).sort()).toEqual(['ama', 'esi', 'old']);
    m = attend(m, `sat:${day(-2)}`, ['yaw']);        // a contact who came becomes part of People
    expect(M.inChurch(m.people.find(p => p.id === 'yaw'), idx())).toBe(true);
  });

  it('the soul list holds everyone except those who moved on', () => {
    const m = base();
    expect(m.people.filter(M.onSoulList).map(p => p.id).sort()).toEqual(['ama', 'esi', 'tom', 'yaw']);
  });

  it('first and second timers come from days present; members are never either', () => {
    let m = base();
    m = attend(m, `thu:${day(-11)}`, ['esi', 'ama']);
    let idx = M.presenceIndex(m);
    expect(M.timerOf(m.people.find(p => p.id === 'esi'), idx)).toBe('first');
    expect(M.timerOf(m.people.find(p => p.id === 'ama'), idx)).toBe('');
    m = attend(m, `sat:${day(-9)}`, ['esi']);
    idx = M.presenceIndex(m);
    expect(M.timerOf(m.people.find(p => p.id === 'esi'), idx)).toBe('second');
  });

  it('a tag stands in for first or second timer until attendance says otherwise', () => {
    const m = ministry([{ id: 'n', name: 'New', membership: 'visitor', tag: 'second' }]);
    expect(M.timerOf(m.people[0], M.presenceIndex(m))).toBe('second');
  });

  it('meeting figures count first and second timers, never members', () => {
    let m = base();
    m = attend(m, `thu:${day(-11)}`, ['esi']);
    const key = `sat:${day(-9)}`;
    m = attend(m, key, ['esi', 'ama', 'yaw']);
    const mt = M.meetingList(m, MON, 4).find(x => x.key === key);
    const st = M.meetingStats(m, mt, M.submitted(mt));
    expect(st.firstTime).toEqual(['yaw']);
    expect(st.secondTime).toEqual(['esi']);
    expect(st.members).toEqual(['ama']);
  });

  it('where someone lives defaults to Birmingham, and abroad shows the country', () => {
    const m = base();
    expect(M.areaOf(m.people.find(p => p.id === 'ama'))).toBe('bham');
    expect(M.areaLabel(m.people.find(p => p.id === 'tom'))).toBe('Cameroon');
  });

  it('stage 5 is Son', () => {
    expect(M.stageLabel(ministry(), 5)).toBe('5 · Son');
  });

  it('a new convert moves to stage 1 with a dated reason', () => {
    let m = base();
    m = run(m, { type: 'M_PERSON_UPDATE', id: 'esi', data: { savedOn: MON, savedAt: 'Saturday Church', tag: 'convert', stage: 1 }, reason: 'Gave their life' });
    const esi = m.people.find(p => p.id === 'esi');
    expect(esi.stage).toBe(1);
    expect(esi.stageHistory.at(-1).reason).toBe('Gave their life');
  });
});
