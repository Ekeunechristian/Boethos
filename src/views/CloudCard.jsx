import { useState } from 'react';
import { useStore } from '../store/index.jsx';
import { useToast } from '../lib/ui.jsx';
import { setCloud, isConfigured, isSignedIn, signInPassword, signUp, builtIn, signOut, push, subscribePush, testPush, fetchRemote, adoptRemote } from '../lib/cloud';
import { useCloud } from '../components/CloudSync.jsx';

// Cloud sync and push, set up in three steps. Everything is optional: without it the app works on this device only.
export default function CloudCard() {
  const { state } = useStore();
  const toast = useToast();
  const c = useCloud();
  const [f, setF] = useState({ url: c.url || '', anonKey: c.anonKey || '', vapidPublic: c.vapidPublic || '' });
  const [email, setEmail] = useState(c.email || '');
  const [pw, setPw] = useState('');
  const [fresh, setFresh] = useState(false);
  const [change, setChange] = useState(false);
  const [busy, setBusy] = useState('');
  const [asked, setAsked] = useState(false);
  const run = async (label, fn, ok) => { setBusy(label); try { await fn(); if (ok) toast(ok); } catch (e) { toast(String(e.message || e)); } finally { setBusy(''); } };
  const configured = isConfigured(c), signed = isSignedIn(c);
  const pushSupported = typeof window !== 'undefined' && 'PushManager' in window;

  return (
    <div className="card" id="cloud">
      <div className="card-h"><h2>Cloud sync and notifications</h2><span className={'pill ' + (signed ? 'good' : 'plain')}>{signed ? 'Connected' : 'This device only'}</span></div>
      <p className="muted small" style={{ marginTop: 0 }}>Keeps your data safe and the same on your phone and computer, and lets reminders reach your phone while Boēthos is closed. It uses your own Supabase project; only you can read your data.</p>

      <ol className="cloud-steps">
        <li className={configured ? 'done' : 'now'}>
          <b>Connect your project</b>
          {builtIn() && !change ? <p className="small" style={{ margin: '6px 0 0' }}>Your project is built into this app. <button className="linklike" onClick={() => setChange(true)}>Use a different one</button></p> : <>
          <div className="fields">
            <div className="field wide"><label htmlFor="cl-url">Project URL</label><input id="cl-url" value={f.url} onChange={e => setF(x => ({ ...x, url: e.target.value.trim() }))} placeholder="https://abcd1234.supabase.co" /></div>
            <div className="field wide"><label htmlFor="cl-key">Anon (public) key</label><input id="cl-key" value={f.anonKey} onChange={e => setF(x => ({ ...x, anonKey: e.target.value.trim() }))} placeholder="eyJhbGciOi…" /></div>
            <div className="field wide"><label htmlFor="cl-vapid">VAPID public key (for push)</label><input id="cl-vapid" value={f.vapidPublic} onChange={e => setF(x => ({ ...x, vapidPublic: e.target.value.trim() }))} placeholder="BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U" /></div>
          </div>
          <button className="sm" disabled={!f.url.startsWith('https://') || !f.anonKey} onClick={() => { setCloud(f); toast('Project saved on this device'); }}>Save</button>
          </>}
        </li>

        <li className={signed ? 'done' : configured ? 'now' : ''}>
          <b>Sign in</b>
          {signed ? (
            <p className="small" style={{ margin: '6px 0 0' }}>Signed in as <b>{c.email}</b>. <button className="linklike" onClick={() => { signOut(); toast('Signed out. Data stays on this device.'); }}>Sign out</button></p>
          ) : !configured ? <p className="muted small" style={{ margin: '6px 0 0' }}>Connect your project first.</p> : (
            <form className="pa-form" onSubmit={e => { e.preventDefault(); run('in', () => (fresh ? signUp : signInPassword)(email.trim(), pw), fresh ? 'Account created. You are signed in.' : 'Signed in'); }}>
              <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
              <label>Password<input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete={fresh ? 'new-password' : 'current-password'} minLength={8} placeholder={fresh ? 'At least 8 characters' : ''} /></label>
              <button className="sm primary" type="submit" disabled={!email.includes('@') || pw.length < 8 || !!busy}>{fresh ? 'Create my account' : 'Sign in'}</button>
              <button className="sm ghost" type="button" onClick={() => setFresh(!fresh)}>{fresh ? 'I already have an account' : 'First time? Create an account'}</button>
            </form>
          )}
        </li>

        <li className={signed ? (c.status === 'synced' ? 'done' : 'now') : ''}>
          <b>Sync</b>
          {signed ? <>
            <div className="kv"><span>Status</span><b>{{ synced: 'Saved', saving: 'Saving…', pending: 'Changes waiting', offline: 'Offline, will retry', error: 'Couldn’t save', conflict: 'Waiting for your choice' }[c.status] || 'Not yet'}</b></div>
            <div className="kv"><span>Last saved</span><b>{c.lastSyncedAt ? new Date(c.lastSyncedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'}</b></div>
            {c.status === 'error' && c.lastError && <p className="warn-text small">{c.lastError}</p>}
            <label className="toggle" style={{ margin: '10px 0' }}><input type="checkbox" checked={!!c.includeRestricted} onChange={e => setCloud({ includeRestricted: e.target.checked })} />Also sync restricted pastoral notes and care needs</label>
            <p className="muted small" style={{ margin: '0 0 10px' }}>Off by default: those notes stay on this device only. Turn it on only if you need them on another device; they are then stored in your private row, never in notifications.</p>
            <div className="row-btns">
              <button className="sm" disabled={!!busy} onClick={() => run('sync', async () => { const r = await push(state); if (r === 'conflict') throw new Error('The cloud has a newer copy. Reload to choose which to keep.'); }, 'Saved to the cloud')}>Sync now</button>
              <button className="sm ghost" disabled={!!busy} onClick={() => run('pull', async () => { const r = await fetchRemote(); if (!r) throw new Error('Nothing in the cloud yet'); adoptRemote(r, state); })}>Load the cloud copy</button>
            </div>
          </> : <p className="muted small" style={{ margin: '6px 0 0' }}>Starts once you sign in.</p>}
        </li>

        <li className={c.pushVerifiedAt ? 'done' : signed && c.vapidPublic ? 'now' : ''}>
          <b>Reminders on this phone</b>
          {!signed ? <p className="muted small" style={{ margin: '6px 0 0' }}>Needs sign-in and the VAPID key.</p> : !pushSupported ? (
            <p className="muted small" style={{ margin: '6px 0 0' }}>This browser can’t receive push. On iPhone, add Boēthos to the home screen (iOS 16.4 or later) and open it from there.</p>
          ) : <>
            <div className="kv"><span>This device</span><b>{c.pushEndpoint ? 'Subscribed' : 'Not subscribed'}</b></div>
            <div className="kv"><span>Verified on a real device</span><b>{c.pushVerifiedAt ? new Date(c.pushVerifiedAt).toLocaleDateString() : 'Not yet'}</b></div>
            <div className="row-btns" style={{ marginTop: 10 }}>
              {!c.pushEndpoint && <button className="sm primary" disabled={!c.vapidPublic || !!busy} onClick={() => run('sub', subscribePush, 'Subscribed. Now send a test.')}>Turn on push</button>}
              {c.pushEndpoint && <button className="sm" disabled={!!busy} onClick={() => run('test', async () => { await testPush(); setAsked(true); }, 'Test sent. Lock your phone and wait a moment.')}>Send a test push</button>}
            </div>
            {asked && !c.pushVerifiedAt && (
              <div className="pa-form"><span className="small" style={{ flex: '1 1 200px' }}>Did “Boēthos: test reminder” arrive on this phone?</span>
                <button className="sm primary" onClick={() => { setCloud({ pushVerifiedAt: new Date().toISOString() }); setAsked(false); toast('Push verified on this device'); }}>Yes, it arrived</button>
                <button className="sm" onClick={() => { setAsked(false); toast('Not verified. See docs/CLOUD_SETUP.md, “If the test does not arrive”.'); }}>No</button>
              </div>
            )}
            <p className="muted small" style={{ margin: '10px 0 0' }}>Push is only marked working after a test arrives on your device. Lock-screen text is always generic, like “Greater Love: 2 things need you”; names and notes never appear.</p>
          </>}
        </li>
      </ol>
    </div>
  );
}
