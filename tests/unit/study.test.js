import { describe, it, expect } from 'vitest';
import * as M from '../../src/store/ministry.js';
import * as L from '../../src/store/life.js';
import { MON } from './helpers.js';

const fresh = () => {
  const l = L.initialLife(); l.setupDone = true;
  return { life: l, prayerRequests: [], prayerSessions: [], events: [], weeklyReviews: {}, ministry: M.initialMinistry(), profile: {} };
};
const act = (s, a, today = MON) => ({ ...s, life: L.lifeReducer(s.life, { ...a, type: `L_${a.type}` }, today) });

describe('A study topic with its materials and many entries', () => {
  it('a topic can have materials, and several entries a day, each tied to what you studied', () => {
    let s = fresh();
    s = act(s, { type: 'TOPIC_ADD', data: { id: 'tp1', title: 'The Shepherd’s heart' } });
    s = act(s, { type: 'STUDY_SET', topicId: 'tp1' });
    s = act(s, { type: 'MATERIAL_ADD', data: { topicId: 'tp1', kind: 'book', title: 'The Art of Shepherding' } });
    const book = s.life.studyMaterials[0].id;
    s = act(s, { type: 'STUDY_NOTE', data: { source: 'material', materialId: book, part: 'Chapters 1–2', learned: 'A shepherd smells like his sheep.' } });
    s = act(s, { type: 'STUDY_NOTE', data: { source: 'bible', passage: 'John 10', version: 'NKJV', learned: 'He calls his own sheep by name.' } });
    const notes = s.life.studyNotes.filter(x => x.topicId === 'tp1');
    expect(notes).toHaveLength(2);
    expect(notes.map(x => x.source).sort()).toEqual(['bible', 'material']);
    expect(notes.find(x => x.source === 'material').materialId).toBe(book);
  });

  it('adding a topic can set its reminder from the start', () => {
    const s = act(fresh(), { type: 'TOPIC_ADD', data: { id: 'tp2', title: 'Eschatology', remind: { on: true, days: [1], time: '20:00' } } });
    expect(s.life.topicReminders.tp2).toEqual({ on: true, days: [1], time: '20:00' });
  });

  it('a topic reminder comes on its days, with a heads-up, naming the topic and the material', () => {
    let s = act(fresh(), { type: 'TOPIC_ADD', data: { id: 'tp3', title: 'The anointing', remind: { on: true, days: [1], time: '20:00' } } });
    s = act(s, { type: 'MATERIAL_ADD', data: { topicId: 'tp3', kind: 'video', title: 'Camp session 2' } });
    const at = (t) => L.lifeReminders(s, MON, t).find(x => x.key.startsWith('topic-tp3'));
    expect(at('19:35').text).toMatch(/^In 30 minutes: study The anointing\. Continue with Camp session 2\. “/);
    expect(at('20:00').text).toMatch(/^Study The anointing\. Continue with Camp session 2\. “/);
    expect(L.lifeReminders(s, '2026-11-03', '20:00').some(x => x.key.startsWith('topic-tp3'))).toBe(false); // not on Tuesday
  });

  it('once you have written on the topic today, its reminder stays quiet', () => {
    let s = act(fresh(), { type: 'TOPIC_ADD', data: { id: 'tp4', title: 'Faith', remind: { on: true, days: [1], time: '20:00' } } });
    s = act(s, { type: 'STUDY_SET', topicId: 'tp4' });
    s = act(s, { type: 'STUDY_NOTE', data: { learned: 'Faith comes by hearing.' } });
    expect(L.lifeReminders(s, MON, '20:00').some(x => x.key.startsWith('topic-tp4'))).toBe(false);
  });
});

describe('Reminders for messages, the journal and the week', () => {
  it('messages and camps: while you are behind your weekly goal', () => {
    let s = fresh();
    expect(L.lifeReminders(s, MON, '19:00').find(x => x.key === 'listen').text).toMatch(/^Listen to a message or a camp: 0 of 2 this week so far\./);
    s = act(s, { type: 'LISTEN_ADD', data: { title: 'A', date: MON } });
    s = act(s, { type: 'LISTEN_ADD', data: { title: 'B', date: MON } });
    expect(L.lifeReminders(s, MON, '19:00').some(x => x.key === 'listen')).toBe(false);
  });
  it('close the day: until tonight’s journal is written', () => {
    let s = fresh();
    expect(L.lifeReminders(s, MON, '21:30').some(x => x.key === 'journal')).toBe(true);
    s = act(s, { type: 'EXAMEN', data: { saw: 'Grace' } });
    expect(L.lifeReminders(s, MON, '21:30').some(x => x.key === 'journal')).toBe(false);
  });
  it('your week: on your review day only, until it is written', () => {
    const s = fresh();
    expect(L.lifeReminders(s, MON, '20:00').some(x => x.key === 'weekly')).toBe(false);          // Monday
    expect(L.lifeReminders(s, '2026-11-08', '20:00').some(x => x.key === 'weekly')).toBe(true);  // Sunday
    expect(L.lifeReminders({ ...s, weeklyReviews: { '2026-11-08': { done: true } } }, '2026-11-08', '20:00').some(x => x.key === 'weekly')).toBe(false);
  });
});

describe('Message topics', () => {
  it('a predefined topic can be removed, and the originals brought back', () => {
    let s = act(fresh(), { type: 'MSGCAT_HIDE', name: 'Finances' });
    expect(s.life.hiddenMsgCats).toEqual(['Finances']);
    s = act(s, { type: 'MSGCAT_RESTORE' });
    expect(s.life.hiddenMsgCats).toEqual([]);
  });
  it('your own topic can be added and removed', () => {
    let s = act(fresh(), { type: 'MSGCAT_ADD', name: 'Prophecy' });
    expect(s.life.customMsgCats).toContain('Prophecy');
    s = act(s, { type: 'MSGCAT_HIDE', name: 'Prophecy' });
    expect(s.life.customMsgCats).not.toContain('Prophecy');
  });
});
