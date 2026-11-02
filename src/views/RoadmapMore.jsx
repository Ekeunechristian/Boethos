import { ExternalLink } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { RESOURCES } from '../data/library';
import { href } from '../lib/router';
import { phaseNo } from '../lib/ui.jsx';
import { todayISO } from '../lib/plan';

const SPAN = 36; // three years: formation, then the church growing

// Where each phase sits in months from your start, read from the plan's own durations.
function phaseRange(p) {
  const m = p.duration.match(/Months?\s*(\d+)\s*[–-]\s*(\d+)/i);
  if (m) return [Number(m[1]) - 1, Number(m[2])];
  if (/Year 2/i.test(p.duration)) return [12, SPAN];
  return [p.startMonth || 0, SPAN];
}

// The whole plan on real calendar dates: phases, today, and the Sabbath weeks you kept.
export function Timeline() {
  const { state, sel } = useStore();
  const start = new Date((state.startDate || todayISO()) + 'T12:00:00');
  const monthDate = (i) => new Date(start.getFullYear(), start.getMonth() + i, 1);
  const monthsIn = (iso) => { const d = new Date(iso + 'T12:00:00'); return (d.getFullYear() - start.getFullYear()) * 12 + d.getMonth() - start.getMonth() + (d.getDate() - 1) / 30; };
  const now = monthsIn(todayISO());
  const x = (m) => `${(Math.max(0, Math.min(SPAN, m)) / SPAN) * 100}%`;
  // Years shaded alternately, so the three years read at a glance
  const years = [[0, 12], [24, 36]];

  return (
    <div className="card timeline-card">
      <div className="card-h"><h2>Three years on the calendar</h2><span className="legend-mini"><i className="season" />Years 1 and 3 <i className="nowline" />Today</span></div>
      <div className="timeline">
        <div className="tl-months">
          {Array.from({ length: SPAN }, (_, i) => (
            <span key={i} style={{ left: x(i), width: x(1) }}>{monthDate(i).getMonth() === 0 || i === 0 ? monthDate(i).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : monthDate(i).toLocaleDateString(undefined, { month: 'narrow' })}</span>
          ))}
        </div>
        <div className="tl-body">
          <div className="tl-seasons">{years.map(([a, b]) => <span key={a} className="tl-season" style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})` }} />)}</div>
          {sel.phases.map((p, i) => {
            const [a, b] = phaseRange(p);
            const pr = sel.phaseProgress(p.id);
            const cls = pr.pct === 100 ? 'done' : i === sel.currentPhaseIdx ? 'now' : '';
            return (
              <a key={p.id} href={href('path', p.id)} className="tl-row" title={`${p.title}: ${p.duration}`}>
                <span className="tl-label"><b>{phaseNo(p)}</b>{p.title.split(/ & | — |, /)[0]}</span>
                <span className="tl-track"><span className={'tl-bar ' + cls} style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})` }}>{pr.pct > 0 && <i style={{ width: `${pr.pct}%` }} />}</span></span>
              </a>
            );
          })}
          <span className="tl-now" style={{ left: `calc(var(--tl-label) + (100% - var(--tl-label)) * ${Math.max(0, Math.min(SPAN, now)) / SPAN})` }}><small>Today</small></span>
        </div>
      </div>
      <p className="muted small" style={{ margin: '14px 0 0' }}>
        The first three phases run together and never really end: the inner life is kept for as long as you serve. Later phases overlap so that the work grows out of the life.
      </p>
    </div>
  );
}

// The books and sites that shape a shepherd, by subject.
export function Resources() {
  return (
    <div className="res-lib">
      {RESOURCES.map(c => (
        <section key={c.cat} className="card">
          <div className="card-h"><h2>{c.cat}</h2><span className="muted small">{c.items.length}</span></div>
          <ul className="res-list">
            {c.items.map(r => {
              const inner = (
                <>
                  <span className="t"><b>{r.name}</b><small>{r.desc}</small></span>
                  {r.badge && <span className={'pill' + (r.badge === 'Essential' ? ' now' : '')}>{r.badge}</span>}
                  {r.url && <ExternalLink size={15} className="chev" />}
                </>
              );
              return <li key={r.name}>{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{inner}</a> : <div className="res-nolink">{inner}</div>}</li>;
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
