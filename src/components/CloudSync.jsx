import { useEffect, useRef, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { cloudConfig, isSignedIn, push, fetchRemote, adoptRemote, overwriteRemote, setCloud, syncSchedule } from '../lib/cloud';
import { reminderSchedule, localDay } from '../store/ministry';
import { commitmentsOf } from '../lib/busy';
import { lifeSchedule } from '../store/life';
import { useToast } from '../lib/ui.jsx';

export function useCloud() {
  const [c, setC] = useState(cloudConfig);
  useEffect(() => {
    const on = () => setC(cloudConfig());
    window.addEventListener('boethos-cloud', on);
    window.addEventListener('storage', on);
    return () => { window.removeEventListener('boethos-cloud', on); window.removeEventListener('storage', on); };
  }, []);
  return c;
}

// Runs once in the shell: saves a few seconds after each change, retries when back online,
// and never resolves a conflict on its own.
export default function CloudSync() {
  const { state } = useStore();
  const c = useCloud();
  const toast = useToast();
  const [remote, setRemote] = useState(null); // a newer cloud copy waiting for your choice
  const timer = useRef(null);
  const first = useRef(true);
  const signed = isSignedIn(c);

  const save = async () => {
    if (!isSignedIn(cloudConfig()) || cloudConfig().status === 'conflict') return;
    if (!navigator.onLine) { setCloud({ status: 'offline' }); return; }
    setCloud({ status: 'saving' });
    try {
      const r = await push(state);
      if (r === 'conflict') { setRemote(await fetchRemote()); return; }
      const sched = [...reminderSchedule(state.ministry, localDay(state.ministry.settings.timezone), state.profile?.holdWhenBusy === false ? [] : commitmentsOf(state.profile)), ...lifeSchedule(state, localDay(state.ministry.settings.timezone))];
      syncSchedule(state.ministry.settings.reminders.hideDetails ? sched.map(({ body, ...x }) => x) : sched).catch(() => { /* push not set up; sync itself succeeded */ });
    } catch (e) {
      setCloud({ status: navigator.onLine ? 'error' : 'offline', lastError: String(e.message || e) });
    }
  };

  // On start: is there a newer copy from another device?
  useEffect(() => {
    if (!signed) return;
    (async () => {
      try {
        const r = await fetchRemote();
        const cfg = cloudConfig();
        if (r && (cfg.version == null || r.version > cfg.version)) {
          if (cfg.version == null && !cfg.dirty) setRemote(r);      // first time on this device: offer the cloud copy
          else { setCloud({ status: 'conflict' }); setRemote(r); }
        } else save();
      } catch (e) { setCloud({ status: navigator.onLine ? 'error' : 'offline', lastError: String(e.message || e) }); }
    })();
  }, [signed]);

  // Each change: mark unsynced, save after a pause
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!signed) return;
    setCloud({ dirty: true, status: cloudConfig().status === 'conflict' ? 'conflict' : 'pending' });
    clearTimeout(timer.current);
    timer.current = setTimeout(save, 4000);
    return () => clearTimeout(timer.current);
  }, [state]);

  // Back online, or every few minutes while something is unsynced
  useEffect(() => {
    if (!signed) return;
    const retry = () => { const s = cloudConfig().status; if (['offline', 'error', 'pending'].includes(s)) save(); };
    window.addEventListener('online', retry);
    const t = setInterval(retry, 3 * 60 * 1000);
    return () => { window.removeEventListener('online', retry); clearInterval(t); };
  }, [signed, state]);

  if (!remote) return null;
  const when = remote.updated_at ? new Date(remote.updated_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'earlier';
  const conflict = cloudConfig().status === 'conflict';
  return (
    <div className="cloud-choice" role="alertdialog" aria-label="Choose which copy to keep">
      <TriangleAlert size={20} />
      <div className="t">
        <b>{conflict ? 'Your cloud copy changed on another device' : 'A copy of your data is in the cloud'}</b>
        <small>Cloud copy saved {when} (version {remote.version}). {conflict ? 'This device also has unsynced changes. Choose one; the other is replaced.' : 'Load it onto this device, or keep what is here and save it to the cloud.'} Restricted notes kept on this device are never removed.</small>
      </div>
      <div className="row-btns">
        <button className="primary sm" onClick={() => adoptRemote(remote, state)}>Use the cloud copy</button>
        <button className="sm" onClick={async () => { setRemote(null); setCloud({ status: 'saving' }); try { await overwriteRemote(state); toast('This device’s copy saved to the cloud'); } catch (e) { setCloud({ status: 'error', lastError: String(e.message || e) }); } }}>Keep this device’s copy</button>
      </div>
    </div>
  );
}

// The small cloud in the header: only shown once you connect a project.
const LABEL = { synced: 'Saved to the cloud', saving: 'Saving…', pending: 'Changes not yet saved to the cloud', offline: 'Offline: changes will save when you reconnect', error: 'Couldn’t save to the cloud', conflict: 'Choose which copy to keep', off: 'Cloud sync off' };
// A small dot on your initials: green saved, gold waiting, grey offline. Details are in Settings.
export function CloudDot() {
  const c = useCloud();
  if (!isSignedIn(c)) return null;
  const s = c.status || 'pending';
  const when = c.lastSyncedAt ? ` (last ${new Date(c.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })})` : '';
  return <i className={'cloud-dot ' + s} title={LABEL[s] + when} aria-label={LABEL[s] + when} />;
}

export function CloudStatus() {
  const c = useCloud();
  if (!isSignedIn(c)) return null;
  const s = c.status || 'pending';
  const Icon = s === 'offline' || s === 'error' ? CloudOff : s === 'saving' ? RefreshCw : Cloud;
  const when = c.lastSyncedAt ? ` (last ${new Date(c.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })})` : '';
  return (
    <a href="#/settings" className={'hdr-icon cloud-st ' + s} title={LABEL[s] + when} aria-label={LABEL[s] + when}>
      <Icon size={18} className={s === 'saving' ? 'spin' : ''} />
      {s !== 'synced' && <i />}
    </a>
  );
}
