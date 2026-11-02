import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Flame, Snowflake, Search, CircleHelp } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { href } from '../lib/router';
import { Bar } from '../lib/ui.jsx';
import { PLACE_SETS, pageHref, placeCounts } from '../lib/places';

const iso = (d) => d.toISOString().slice(0, 10);

// The header's places. Hovering one opens a menu of everything inside it, with live counts;
// the place you are in sits raised like a paper tab.
export function MainNav({ page, sub, section = 'spoudazo' }) {
  const PLACES = PLACE_SETS[section];
  const { state, sel } = useStore();
  const counts = placeCounts(state, sel);
  const [open, setOpen] = useState(null);
  const timer = useRef(null);

  useEffect(() => { setOpen(null); }, [page, sub]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const enter = (id) => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(id), open ? 0 : 140); };
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(null), 180); };

  return (
    <nav className="mainnav" aria-label="Main" onMouseLeave={leave}>
      {PLACES.map(p => {
        const c = counts[`${p.id}/`];
        const has = p.pages.length > 0;
        return (
          <div key={p.id} className={'np' + (open === p.id ? ' open' : '')} onMouseEnter={() => (has ? enter(p.id) : (clearTimeout(timer.current), setOpen(null)))}
            onFocus={() => has && setOpen(p.id)}>
            <a data-place={p.id} href={p.base} className={'np-link' + (page === p.id ? ' on' : '')} aria-current={page === p.id ? 'page' : undefined}
              aria-haspopup={has ? 'true' : undefined} aria-expanded={has ? open === p.id : undefined}>
              <p.icon size={17} strokeWidth={1.75} className="np-ic" />{p.id === 'poimaino' ? 'Dashboard' : p.label}
              {c?.hot && /\d/.test(c.text) && <span className="count" title={c.text}>{c.text.match(/\d+/)[0]}</span>}
            </a>
            {has && open === p.id && (
              <div className="np-menu" role="menu" onMouseEnter={() => clearTimeout(timer.current)}>
                <a className="np-head" href={p.base}>
                  <span className="np-icon big"><p.icon size={20} /></span>
                  <span><b>{p.label}</b><small>{p.blurb}</small></span>
                  <ArrowRight size={16} className="np-go" />
                </a>
                <div className={'np-grid' + (p.pages.length > 5 ? ' two' : '')}>
                  {p.pages.map(pg => {
                    const k = counts[`${p.id}/${pg.id}`];
                    const on = page === p.id && (sub || '') === pg.id;
                    return (
                      <a key={pg.id} role="menuitem" href={pageHref(p, pg.id)} className={'np-item' + (on ? ' on' : '')}>
                        <span className="np-icon"><pg.icon size={17} /></span>
                        <span className="np-t"><b>{pg.label}{k && <em className={k.hot ? 'hot' : ''}>{k.text}</em>}</b><small>{pg.desc}</small></span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// The last n days, oldest first, each marked worked / frozen / missed.
function lastDays(sel, state, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = iso(new Date(Date.now() - i * 86400000));
    out.push({ d, state: state.frozenDays.includes(d) ? 'frozen' : sel.streak.active.has(d) ? 'on' : i === 0 ? 'today' : 'off' });
  }
  return out;
}

// The flame in the header: tap for the streak in full.
export function StreakButton() {
  const { state, sel } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('keydown', key); };
  }, [open]);
  const s = sel.streak;
  return (
    <div className="streak-wrap" ref={ref}>
      <button type="button" className={'streak-btn' + (s.activeToday ? ' lit' : '') + (open ? ' on' : '')} onClick={() => setOpen(o => !o)}
        aria-expanded={open} title={s.activeToday ? 'Streak kept today' : 'Earn XP today to keep your streak'}>
        <Flame size={17} /><b>{s.current}</b>
      </button>
      {open && <StreakPanel onClose={() => setOpen(false)} />}
    </div>
  );
}

function StreakPanel({ onClose }) {
  const { state, sel } = useStore();
  const s = sel.streak;
    const days = lastDays(sel, state, 14);
    const goalPct = Math.min(100, (sel.xpToday / (state.dailyXpGoal || 50)) * 100);
    return (
      <div className="streak-pop" role="dialog" aria-label="Your streak">
        <div className="sp-top">
          <span className={'sp-flame' + (s.activeToday ? ' lit' : '')}><Flame size={30} /></span>
          <div>
            <b className="sp-num">{s.current}<small> {s.current === 1 ? 'day' : 'days'}</small></b>
            <span className="sp-sub">{s.activeToday ? 'Kept today. See you tomorrow.' : s.current ? 'Earn any XP today to keep it.' : 'Do one task to start a streak.'}</span>
          </div>
        </div>
        <div className="sp-days" aria-label="The last 14 days">
          {days.map(x => <i key={x.d} className={x.state} title={`${new Date(x.d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${x.state === 'on' ? 'worked' : x.state === 'frozen' ? 'saved by a freeze' : x.state === 'today' ? 'today' : 'missed'}`}>{x.state === 'frozen' && <Snowflake size={10} />}</i>)}
        </div>
        <div className="sp-days-l"><span>2 weeks ago</span><span>Today</span></div>
        <dl className="sp-stats">
          <div><dt>Longest</dt><dd>{s.longest} {s.longest === 1 ? 'day' : 'days'}</dd></div>
          <div><dt>Freezes</dt><dd>{[0, 1].map(i => <Snowflake key={i} size={15} className={i < state.streakFreezes ? 'have' : ''} />)}</dd></div>
          <div><dt>Level</dt><dd>{sel.level.level}</dd></div>
        </dl>
        <div className="sp-goal">
          <div className="kv"><span>Today’s goal</span><b>{sel.xpToday} / {state.dailyXpGoal} XP</b></div>
          <Bar pct={goalPct} accent />
        </div>
        <p className="sp-note">A day counts when you earn any XP. Every 7 days in a row earns a freeze (up to 2), which covers a missed day by itself.</p>
        <a className="btn sm" href="#/home/activity" onClick={onClose}>See all activity</a>
      </div>
    );
  }

// Your initials: opens the account page.
export function AvatarButton({ on }) {
  const { state, sel } = useStore();
  const initials = (state.name || 'You').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  // The ring around your initials fills as you move through the level
  const r = 21, c = 2 * Math.PI * r;
  return (
    <a className={'avatar-btn' + (on ? ' on' : '')} href={href('settings')}
      title={`${state.name || 'You'}: your account and settings`} aria-label="Account and settings">
      <span className="avatar">{initials}</span>
      <span className="av-who"><b>{(state.name || 'You').trim().split(/\s+/)[0]}</b></span>
    </a>
  );
}

// Search, help, streak and you: one quiet group on the right of the header.
export function SearchButton({ onClick }) {
  return (
    <button type="button" className="search-field" onClick={onClick} aria-label="Search (Ctrl K)">
      <Search size={16} /><span>Search</span><kbd>Ctrl K</kbd>
    </button>
  );
}
export function HelpButton({ onClick }) {
  return (
    <button type="button" className="hdr-icon" onClick={onClick} aria-label="Help for this page" title="Help for this page">
      <CircleHelp size={19} />
    </button>
  );
}
