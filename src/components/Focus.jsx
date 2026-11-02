import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Pause, Play, Square, Timer, X } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { href } from '../lib/router';
import { useToast } from '../lib/ui.jsx';

// Milliseconds focused so far in the running session.
const elapsedOf = (r, now = Date.now()) => (r ? (r.banked || 0) + (r.paused ? 0 : now - r.startedAt) : 0);
// The planned length of a session in minutes: the task's hours, or 30 minutes if it has none.
export const plannedMin = (r) => Math.max(1, Math.round((r?.target || 0.5) * 60));
export const clock = (ms) => {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};
const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m} min`);

// What a task still needs before it can be ticked: a full focus session and your written note.
export function taskReadiness(state, taskId, draftNote) {
  const r = state.focus?.running;
  const focus = (state.focus?.sessions || []).some(f => f.taskId === taskId)
    || (r?.taskId === taskId && Math.floor(elapsedOf(r) / 60000) >= plannedMin(r));
  const note = draftNote !== undefined ? !!draftNote.trim()
    : Object.entries(state.taskNotes || {}).some(([k, v]) => k.split('|')[0] === taskId && v?.trim());
  return { focus, note, ok: focus && note };
}

// Re-renders every second while a session is running.
function useElapsed() {
  const { state } = useStore();
  const r = state.focus.running;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!r || r.paused) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [r]);
  return elapsedOf(r, Math.max(now, Date.now()));
}

// Ending a session. Only a full session counts: reach the planned time and it is logged with XP;
// stop before that and nothing is logged. Returns what happened, for a toast.
export function useEndFocus() {
  const { state, stopFocus, cancelFocus } = useStore();
  return () => {
    const r = state.focus.running;
    if (!r) return null;
    const min = Math.floor(elapsedOf(r) / 60000);
    const need = plannedMin(r);
    if (min >= need) { stopFocus(min, r.label); return `Logged ${fmtMin(min)} of focus on ${r.label}`; }
    cancelFocus();
    return `Timer stopped at ${fmtMin(min)} of ${fmtMin(need)}, so it wasn’t logged`;
  };
}

// The timer inside a task: start, pause, and stop once the planned time is done.
export function FocusTimer({ taskId, label, hours }) {
  const { state, startFocus, pauseFocus, resumeFocus, cancelFocus } = useStore();
  const end = useEndFocus();
  const toast = useToast();
  const ms = useElapsed();
  const [confirm, setConfirm] = useState(false);
  const r = state.focus.running;
  const mine = r && r.taskId === taskId;
  const need = plannedMin(mine ? r : { target: hours });
  const doneMin = mine ? Math.floor(ms / 60000) : 0;
  const full = mine && doneMin >= need;

  if (r && !mine) {
    return (
      <div className="focus busy">
        <Timer size={18} />
        <span>Your timer is on <b>{r.label}</b> ({clock(ms)}). One task at a time.</span>
        <a className="btn sm" href={href('today', r.taskId)}>Go to it <ArrowRight size={14} /></a>
      </div>
    );
  }

  const stop = () => {
    if (!full) { setConfirm(true); return; }
    toast(end());
  };
  const loggedToday = state.focus.sessions.filter(f => f.taskId === taskId && f.date === new Date().toISOString().slice(0, 10)).reduce((n, f) => n + f.minutes, 0);

  return (
    <div className={'focus' + (mine ? (full ? ' full' : r.paused ? ' paused' : ' on') : '')}>
      <div className="focus-read">
        <span className="eyebrow">{full ? 'Planned time reached' : mine && r.paused ? 'Paused' : 'Focus timer'} · {fmtMin(need)} planned</span>
        <b className="focus-clock">{clock(mine ? ms : 0)}</b>
        <span className="focus-bar"><i style={{ width: `${Math.min(100, ((mine ? ms : 0) / (need * 60000)) * 100)}%` }} /></span>
        <small className="focus-note">
          {full ? <><Check size={13} /> Full session. Stop to log it, or keep going.</>
            : mine ? `${fmtMin(Math.max(0, need - doneMin))} to go. It counts once you reach ${fmtMin(need)}.`
            : loggedToday > 0 ? `${fmtMin(loggedToday)} logged on this today.` : `Only a full ${fmtMin(need)} session is logged.`}
        </small>
      </div>
      {confirm && mine && !full ? (
        <div className="focus-confirm">
          <span>{fmtMin(doneMin)} of {fmtMin(need)}. Stop now and it won’t be logged.</span>
          <div className="focus-btns">
            <button className="primary" onClick={() => setConfirm(false)}>Keep going</button>
            <button onClick={() => { setConfirm(false); toast(end()); }}>Stop anyway</button>
          </div>
        </div>
      ) : (
        <div className="focus-btns">
          {!mine && <button className="primary" onClick={() => startFocus(taskId, label, hours || 0.5)}><Play size={16} />Start</button>}
          {mine && (r.paused
            ? <button className="primary" onClick={resumeFocus}><Play size={16} />Resume</button>
            : <button onClick={pauseFocus}><Pause size={16} />Pause</button>)}
          {mine && <button className={full ? 'primary' : ''} onClick={stop}><Square size={14} />{full ? 'Stop and log' : 'Stop'}</button>}
          {mine && <button className="ghost icon" aria-label="Discard this session" title="Discard without logging" onClick={() => { cancelFocus(); toast('Timer discarded'); }}><X size={16} /></button>}
        </div>
      )}
    </div>
  );
}

// The clock in the header while a session runs. Tapping it opens the task it belongs to.
export function FocusChip() {
  const { state } = useStore();
  const ms = useElapsed();
  const r = state.focus.running;
  const full = r && Math.floor(ms / 60000) >= plannedMin(r);
  const told = useRef(null);
  useEffect(() => {
    if (!r) { document.title = 'Boēthos'; return; }
    document.title = full ? `✓ Time’s up · ${r.label}` : `${r.paused ? '❚❚' : '●'} ${clock(ms)} · ${r.label}`;
  }, [r, ms, full]);
  // One notification when the planned time is reached (if notifications are allowed)
  useEffect(() => {
    if (!full || told.current === r.startedAt + r.label) return;
    told.current = r.startedAt + r.label;
    try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('Time’s up', { body: `${r.label}: your planned time is done. Stop the timer to log it.`, icon: '/icon-192.png' }); } catch { /* not available */ }
  }, [full, r]);
  if (!r) return null;
  return (
    <a className={'focus-chip' + (full ? ' full' : r.paused ? ' paused' : '')} href={href('today', r.taskId)} title={`Open ${r.label}`}>
      {full ? <Check size={15} strokeWidth={3} /> : r.paused ? <Pause size={14} /> : <Timer size={15} />}
      <span>{clock(ms)}</span>
      <em className="fc-label">{r.label}</em>
    </a>
  );
}
