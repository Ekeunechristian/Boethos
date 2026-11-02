// Small builders shared by the unit tests: a ministry with people, meetings and a fixed "today".
import * as M from '../../src/store/ministry.js';

export const MON = '2026-11-02'; // a Monday
export const day = (n) => M.addDays(MON, n); // 0 Mon … 2 Wed, 5 Sat, 6 Sun

export function ministry(people = []) {
  let m = M.initialMinistry();
  m.settings.meetingsFrom = M.addDays(MON, -60);
  m.settings.times = { thu: '19:00', sat: '10:00' };
  people.forEach(p => { m = M.ministryReducer(m, { type: 'M_PERSON_ADD', data: p }, M.addDays(MON, -30)); });
  return m;
}

export const run = (m, action, today = MON) => M.ministryReducer(m, action, today);

// Mark people present at a meeting and submit it
export function attend(m, key, ids, value = 'present') {
  const date = key.split(':')[1];
  ids.forEach(id => { m = run(m, { type: 'M_ATTEND', key, personId: id, value }, date); });
  return run(m, { type: 'M_SUBMIT', key }, date);
}
