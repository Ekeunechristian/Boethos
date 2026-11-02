import { useEffect, useRef } from 'react';
import { useStore } from '../store/index.jsx';
import { useToast } from '../lib/ui.jsx';
import { todayKey } from '../store/engine';
import { dueReminders, reminderBody, localDay, localTime } from '../store/ministry';
import { cloudConfig } from '../lib/cloud';
import { lifeReminders } from '../store/life';
import { busyAt, commitmentsOf } from '../lib/busy';

// Runs in the background of every page: celebrates XP, level-ups and achievements,
// and sends reminders from your rhythm (Spoudazō) and your Bacenta (Poimainō).
export default function Engine() {
  const { state, sel, seeAchievements, dispatch } = useStore();
  const toast = useToast();
  const seenEvents = useRef(state.events.length);
  const seenLevel = useRef(sel.level.level);

  // +XP for each new event, and a bigger moment on a level-up
  useEffect(() => {
    const n = state.events.length;
    if (n > seenEvents.current) {
      const e = state.events[n - 1];
      if (sel.level.level > seenLevel.current) toast(`Level ${sel.level.level}: ${sel.level.title}. +${e.xp} XP`);
      else if (e.xp > 0) toast(`+${e.xp} XP · ${e.label}`);
    }
    seenEvents.current = n;
    seenLevel.current = sel.level.level;
  }, [state.events.length]);

  // Achievements: announce new ones; on first run just remember what is already earned
  useEffect(() => {
    const earned = sel.achievements.filter(a => a.earned).map(a => a.id);
    if (state.achievementsSeen === null) { seeAchievements(earned); return; }
    const fresh = sel.achievements.filter(a => a.earned && !state.achievementsSeen.includes(a.id));
    if (fresh.length) {
      setTimeout(() => toast(`Achievement unlocked: ${fresh[0].title}`), 1600);
      seeAchievements(earned);
    }
  }, [sel.achievements.map(a => a.earned).join()]);

  // Spoudazō reminders: your quiet time, each prayer time, your study time and fast days.
  useEffect(() => {
    const check = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (cloudConfig().pushEndpoint) return; // this device gets them from the push server instead: never twice
      const today = todayKey();
      const list = lifeReminders(state, today, new Date().toTimeString().slice(0, 5));
      if (!list.length) return;
      notify(list.map(x => x.text).join(' '), { tag: 'boethos-spoudazo', url: '/?go#/today' });
      list.forEach(x => dispatch({ type: 'L_SENT', key: `${x.key}@${today}` }));
    };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, [state.life, state.prayerSessions]);

  // Poimainō reminders: generic text only, quiet hours and categories respected, each sent once a day
  useEffect(() => {
    const check = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (cloudConfig().pushEndpoint) return; // this device gets them from the push server instead: never twice
      const m = state.ministry;
      const tz = m.settings.timezone;
      const today = localDay(tz), now = localTime(tz);
      const r = m.settings.reminders;
      if (state.profile?.holdWhenBusy !== false && busyAt(commitmentsOf(state.profile), today, now)) return; // you're busy: they arrive when it ends
      let list = dueReminders(m, today, now);
      if (r.digest === 'morning') {
        // one summary a day, after quiet hours end
        if (m.sentReminders[`digest@${today}`] || now < (r.quietTo || '07:00')) return;
        list = list.length ? [...list, { key: 'digest' }] : [];
      }
      if (!list.length) return;
      notify(reminderBody(list.filter(x => x.cat)), { tag: 'boethos-poimaino', url: '/?go#/poimaino' });
      list.forEach(x => dispatch({ type: 'M_REMINDER_SENT', key: `${x.key}@${today}` }));
    };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, [state.ministry, state.profile]);

  return null;
}

export function reminderText({ tasksLeft, streak, xpToday, goal }) {
  const parts = [];
  if (tasksLeft > 0) parts.push(`${tasksLeft} ${tasksLeft === 1 ? 'task' : 'tasks'} left today`);
  else if (xpToday < goal) parts.push(`${goal - xpToday} XP to today’s goal`);
  if (streak > 0) parts.push(`your ${streak}-day streak is on the line`);
  return parts.join(' · ') || 'Today is planned. Open Boēthos and start.';
}

export async function notify(body, { tag = 'stillwaters-daily', url = '/?go#/home' } = {}) {
  const opts = { body, icon: '/icon-192.png', badge: '/icon-192.png', tag, data: { url } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return reg.showNotification('Boēthos', opts);
  } catch { /* fall through to a plain notification */ }
  try { new Notification('Boēthos', opts); } catch { /* notifications unavailable */ }
}
