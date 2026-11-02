import { HardDrive, Smartphone, Search, Cloud, Settings2, ArrowUpRight } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { PLACE_SETS, placeCounts } from '../lib/places';
import { cloudConfig, isSignedIn } from '../lib/cloud';
import Mark from './Mark.jsx';

const LAST_BACKUP = 'stillwaters_last_backup';
const daysSince = (iso) => Math.floor((Date.now() - new Date(iso + 'T12:00').getTime()) / 86400000);

// The same foot on every page: Boēthos and its verse, both callings as a map with what is waiting,
// and the things that keep your data safe.
export default function Footer({ page }) {
  const { state, sel } = useStore();
  const counts = placeCounts(state, sel);
  const day = state.startDate ? Math.max(1, daysSince(state.startDate) + 1) : 1;
  let backup = null;
  try { backup = localStorage.getItem(LAST_BACKUP); } catch { /* storage blocked */ }
  const backupAge = backup ? daysSince(backup) : null;
  const installed = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  const cloud = isSignedIn(cloudConfig());
  const bacenta = state.ministry.settings.name || 'Greater Love Bacenta';

  const Calling = ({ id, name, purpose, greek }) => (
    <nav className={'ft-col ' + id} aria-label={name}>
      <a className="ft-ch" href={PLACE_SETS[id][0].base}><Mark kind={id} size={30} /><span><b>{name}</b><i lang="grc">{greek}</i></span></a>
      <p className="ft-purpose">{purpose}</p>
      <ul>{PLACE_SETS[id].map(p => {
        const k = counts[`${p.id}/`];
        const on = page === p.id;
        return (
          <li key={p.id}><a href={p.base} className={(on ? 'on' : '') + (k?.hot ? ' hot' : '')} aria-current={on ? 'page' : undefined}>
            <span>{p.id === 'poimaino' ? 'Dashboard' : p.label}</span>{k && <em>{k.hot && <i aria-hidden="true" />}{k.text}</em>}
          </a></li>
        );
      })}</ul>
    </nav>
  );

  return (
    <footer className="ft">
      <div className="ft-inner">
        <div className="ft-col ft-brand">
          <a className="ft-logo" href="#/home"><Mark size={40} /><span><b>Boēthos</b><span className="ft-sub"><i lang="grc">βοηθός</i><span className="ft-orn" aria-hidden="true" />the helper</span></span></a>
          <blockquote>“The Lord is my helper, and I will not fear what man shall do unto me.”<cite>Hebrews 13:6</cite></blockquote>
          <p className="ft-day">Day {day} · {bacenta}</p>
        </div>
        <Calling id="spoudazo" name="Spoudazō" greek="σπουδάζω" purpose="Your own walk with God" />
        <Calling id="poimaino" name="Poimainō" greek="ποιμαίνω" purpose={bacenta} />
        <div className="ft-col ft-safe">
          <div className="ft-ch"><span className="ft-safe-ic" aria-hidden="true"><HardDrive size={16} /></span><span><b>Keep it safe</b><i>your data and your phone</i></span></div>
          <p className="ft-purpose">Backups, cloud and reminders</p>
          <ul>
            <li><a href="#/settings" className={backupAge == null || backupAge > 14 ? 'warn' : ''}><HardDrive size={16} /><span><b>{backupAge == null ? 'No backup yet' : backupAge === 0 ? 'Backed up today' : `Backed up ${backupAge} ${backupAge === 1 ? 'day' : 'days'} ago`}</b><small>{backupAge == null || backupAge > 14 ? 'Download one in Settings' : 'A copy you keep yourself'}</small></span></a></li>
            <li><a href="#/settings"><Cloud size={16} /><span><b>{cloud ? 'Cloud sync on' : 'This device only'}</b><small>{cloud ? 'Saved to your own cloud' : 'Connect cloud sync in Settings'}</small></span></a></li>
            {!installed && <li><a href="#/settings"><Smartphone size={16} /><span><b>Put Boēthos on your phone</b><small>Install it, and turn on reminders</small></span></a></li>}
            <li><span className="ft-k"><Search size={16} /><span><b>Find anything</b><small><kbd>Ctrl</kbd> <kbd>K</kbd></small></span></span></li>
          </ul>
        </div>
      </div>
      <div className="ft-base">
        <span>Boēthos · for the shepherd and the flock</span>
        <a href="#/settings"><Settings2 size={14} />Settings</a>
        <a href="#/home">Back to Boēthos<ArrowUpRight size={14} /></a>
      </div>
    </footer>
  );
}
