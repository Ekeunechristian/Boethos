import { describe, it, expect } from 'vitest';
import * as M from '../../src/store/ministry.js';
import { ministry, run, MON, day } from './helpers.js';

const people = [
  { id: 'a', name: 'Ama', membership: 'member' },                       // Birmingham
  { id: 'b', name: 'Ben', membership: 'contact' },                      // Birmingham
  { id: 'c', name: 'Cara', membership: 'visitor', area: 'uk' },         // outside Birmingham
  { id: 'd', name: 'Dan', membership: 'prayer', area: 'abroad', country: 'Cameroon' },
];

describe('Telepastoring days', () => {
  it('a new person gets a day by the rules: Birmingham Mon–Wed, everyone else Thu–Fri', () => {
    const m = ministry(people);
    const dayOf = (id) => m.people.find(p => p.id === id).callDay;
    expect([1, 2, 3]).toContain(dayOf('a'));
    expect([1, 2, 3]).toContain(dayOf('b'));
    expect([4, 5]).toContain(dayOf('c'));
    expect([4, 5]).toContain(dayOf('d'));
  });

  it('days are spread over the allowed days, least busy first', () => {
    const m = ministry(people);
    expect(m.people.find(p => p.id === 'a').callDay).not.toBe(m.people.find(p => p.id === 'b').callDay);
  });

  it('moving away from Birmingham moves the call day to one that meets the deadline', () => {
    let m = ministry(people);
    m = run(m, { type: 'M_PERSON_UPDATE', id: 'a', data: { area: 'uk' } });
    expect([4, 5]).toContain(m.people.find(p => p.id === 'a').callDay);
  });

  it('“Arrange the week” fixes anyone on a day that misses their deadline', () => {
    let m = ministry(people);
    m = { ...m, people: m.people.map(p => ({ ...p, callDay: 6 })) };
    m = run(m, { type: 'M_CALLDAYS_SPREAD' });
    m.people.forEach(p => expect(M.teleDaysFor(p)).toContain(p.callDay));
  });
});

describe('Recording a contact', () => {
  const set = () => { let m = ministry(people); return { ...m, people: m.people.map(p => ({ ...p, callDay: 1 })) }; };

  it('no response books a retry and keeps them under Try again today', () => {
    let m = set();
    m = run(m, { type: 'M_TELE', personId: 'a', way: 'call', responded: false, retry: { way: 'message', date: MON } });
    const r = M.callsToday(m, MON).find(x => x.p.id === 'a');
    expect(r.state).toBe('retry');
    expect(r.done).toBe(false);
    expect(m.followUps.filter(f => f.teleRetry && f.status === 'planned')).toHaveLength(1);
  });

  it('a response closes the retry, counts as reached, and updates last contact', () => {
    let m = set();
    m = run(m, { type: 'M_TELE', personId: 'a', way: 'call', responded: false, retry: { way: 'message', date: MON } });
    m = run(m, { type: 'M_TELE', personId: 'a', way: 'message', responded: true });
    expect(m.followUps.filter(f => f.teleRetry && f.status === 'planned')).toHaveLength(0);
    expect(M.teleWeek(m, MON).find(r => r.p.id === 'a').state).toBe('done');
    expect(m.people.find(p => p.id === 'a').lastContact).toBe(MON);
  });

  it('a response records the invitation, their answer, and a follow-up for the queue', () => {
    let m = set();
    m = run(m, { type: 'M_TELE', personId: 'b', way: 'call', responded: true, invite: `sat:${day(5)}`, coming: 'yes', next: { title: 'Offer a lift', kind: 'call', date: day(3) } });
    expect(m.invitations).toEqual([expect.objectContaining({ personId: 'b', meetingKey: `sat:${day(5)}`, status: 'confirmed' })]);
    expect(m.followUps.find(f => f.title === 'Offer a lift')).toEqual(expect.objectContaining({ status: 'planned', due: day(3) }));
  });

  it('abroad, the invitation is to go to church where they are', () => {
    let m = set();
    m = run(m, { type: 'M_TELE', personId: 'd', way: 'message', responded: true, invite: 'near' });
    expect(m.invitations[0]).toEqual(expect.objectContaining({ kind: 'near', meetingKey: '' }));
  });
});

describe('The week and your pace', () => {
  it('on a Wednesday with nobody reached, the pace is red and Birmingham is urgent', () => {
    const m = ministry(people);
    const wed = day(2);
    expect(M.telePace(m, wed).tone).toBe('bad');
    expect(M.alerts(m, wed, '10:00').some(a => a.key.startsWith('tele-bham:'))).toBe(true);
  });

  it('Monday morning, before anyone is due, is on pace', () => {
    expect(M.telePace(ministry(people), MON).expected).toBe(0);
  });

  it('Saturday lists everyone for wake-up calls; Sunday lists nobody', () => {
    const m = ministry(people);
    expect(M.callsToday(m, day(5))).toHaveLength(4);
    expect(M.callsToday(m, day(5)).every(x => x.sat)).toBe(true);
    expect(M.callsToday(m, day(6))).toHaveLength(0);
  });

  it('on Friday, people outside Birmingham not yet reached are urgent', () => {
    expect(M.alerts(ministry(people), day(4), '10:00').some(a => a.key.startsWith('tele-other:'))).toBe(true);
  });
});
