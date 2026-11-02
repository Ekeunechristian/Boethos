import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { ROADMAP_DATA } from '../data/roadmap';
import { href, go } from '../lib/router';
import { Bar, Mark, Seg, Prose, Links, Head, Empty, TitleBlock, STATUS_LABEL, nextStatus, phaseNo, stepName, hrs, useToast } from '../lib/ui.jsx';
import { focusStep, phaseHoursShort, STAGES, stageIndex } from '../lib/plan';
import StageTrack from '../components/StageTrack.jsx';
import { useEndFocus } from '../components/Focus.jsx';
import { Timeline, Resources } from './RoadmapMore.jsx';
import { gateSections, gateKey } from '../data/upgrades';
import { Lock, FileText, Link2 } from 'lucide-react';

// Saves on blur so typing never fights the store.
function NoteBox({ id, value, onSave, placeholder }) {
  const [text, setText] = useState(value || '');
  const toast = useToast();
  return (
    <textarea id={id} value={text} placeholder={placeholder} onChange={e => setText(e.target.value)}
      onBlur={() => { if (text !== (value || '')) { onSave(text); toast('Note saved'); } }} />
  );
}

// How far through its gate a step is, or null if it isn't a gate.
function useGate(step) {
  const { state } = useStore();
  const g = gateSections(step);
  if (!g) return null;
  const checks = state.gateChecks[step.id] || {};
  const done = g.sections.reduce((n, sec) => n + sec.items.filter((_, i) => checks[gateKey(sec, i)]).length, 0);
  return { ...g, checks, done };
}

// A completion gate you tick item by item. When everything is ticked, the step can be passed.
function GateChecklist({ step, onPass, passed }) {
  const { toggleGate } = useStore();
  const g = useGate(step);
  return (
    <div className="card gate">
      <div className="card-h">
        <h2>The gate</h2>
        <span className={'pill' + (g.done === g.total ? ' good' : '')}>{g.done} of {g.total} ticked</span>
      </div>
      <Bar pct={(g.done / g.total) * 100} thick />
      {g.intro && <div style={{ marginTop: 14 }}><Prose text={g.intro} /></div>}
      {g.sections.map(sec => {
        const n = sec.items.filter((_, i) => g.checks[gateKey(sec, i)]).length;
        return (
          <section key={sec.title} className="gate-sec">
            <h4>{sec.title.replace(/ GATE$/i, '')}<small>{n} / {sec.items.length}</small></h4>
            <ul>
              {sec.items.map((item, i) => {
                const k = gateKey(sec, i);
                const on = !!g.checks[k];
                return (
                  <li key={k} className={on ? 'on' : ''}>
                    <label>
                      <input type="checkbox" checked={on} onChange={e => toggleGate(step.id, k, e.target.checked, item.slice(0, 60))} />
                      <span>{item}</span>
                    </label>
                    {on && <small>{g.checks[k]}</small>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {g.outro && <p className="gate-outro">{g.outro.replace(/^IF ANY(THING| BOX) IS UNCHECKED:\s*/i, '')}</p>}
      {!passed && (
        <button className="primary big" disabled={g.done < g.total} onClick={onPass}>
          {g.done < g.total ? `${g.total - g.done} left before you can pass` : 'Pass the gate'}
        </button>
      )}
    </div>
  );
}

function PhaseList({ tab = 'phases' }) {
  const { state, sel } = useStore();
  return (
    <>
      <Head eyebrow="The whole plan" title={ROADMAP_DATA.goal.split('—')[0].trim()}
        sub={`${sel.phases.length} phases, from consecration to a flourishing church. You are on Phase ${phaseNo(sel.currentPhase)}.`}>
        <TitleBlock items={[['Phases', sel.phases.length], ['Duration', 'Year 1 and on'], ['Done', `${sel.overallPct}%`]]} />
      </Head>
      <div style={{ marginBottom: 22 }}>
        <Seg value={tab} onChange={(v) => go('path', ...(v === 'phases' ? [] : [v]))}
          options={[['phases', 'Phases'], ['timeline', 'Timeline'], ['resources', 'Resources']]} />
      </div>
      {tab === 'timeline' && <Timeline />}
      {tab === 'resources' && <Resources />}
      {tab === 'phases' && <>
      <div className="track-wrap"><StageTrack phaseId={sel.currentPhase.id} /></div>
      <ul className="list route">
        {sel.phases.map((p, i) => {
          const st = STAGES.find(x => x.ids[0] === p.id);
          const pr = sel.phaseProgress(p.id);
          const now = i === sel.currentPhaseIdx;
          const done = pr.done === pr.total;
          // Still waiting on an earlier phase it depends on (you can open it, but it isn't time yet)
          const waitingOn = i > sel.currentPhaseIdx ? (p.dependsOn || []).map(id => sel.phases.find(x => x.id === id)).filter(d => d && sel.phaseProgress(d.id).pct < 100) : [];
          return [
            st && <li key={st.name} className="list-sep">{st.name} · {st.when}</li>,
            <li key={p.id}>
              <a className={'item' + (now ? ' current' : '') + (waitingOn.length && i > sel.currentPhaseIdx + 1 ? ' waiting' : '')} href={href('path', p.id)}>
                <span className={'no' + (now ? ' now' : done ? ' done' : '')}>{phaseNo(p)}</span>
                <span className="t">
                  <b>{p.title}</b>
                  <small>{p.duration} · {pr.done} of {pr.total} steps{waitingOn.length > 0 && <span className="wait"><Lock size={12} /> after Phase {waitingOn.map(phaseNo).join(', ')}</span>}</small>
                </span>
                <span className="meta">
                  <span className="mini-bar"><Bar pct={pr.pct} /></span>
                  {now ? <span className="pill now">You are here</span> : done ? <span className="pill good">Done</span> : i === sel.currentPhaseIdx + 1 ? <span className="pill plain">Next</span> : null}
                </span>
                <ChevronRight className="chev" size={18} />
              </a>
            </li>,
          ];
        })}
      </ul>
      </>}
    </>
  );
}

function PhasePage({ phase }) {
  const { state, sel, setPhase, setStepStatus, setPhaseNote } = useStore();
  const toast = useToast();
  const idx = sel.phases.indexOf(phase);
  const prev = sel.phases[idx - 1];
  const next = sel.phases[idx + 1];
  const pr = sel.phaseProgress(phase.id);
  const isCurrent = phase.id === sel.currentPhase.id;
  const focus = isCurrent ? focusStep(sel) : null;
  const active = phase.steps.filter(s => state.stepStatus[s.id] === 'in_progress').length;
  const [flash, setFlash] = useState(null);

  const makeCurrent = (p) => { setPhase(p.id); toast(`Phase ${phaseNo(p)} is now your current phase`); go('today'); };

  return (
    <>
      <Head back={{ href: href('path'), label: 'Roadmap' }} eyebrow={`Phase ${phaseNo(phase)}`} step={STAGES[stageIndex(phase.id)]?.name} title={phase.title}>
        {isCurrent
          ? (pr.done === pr.total && next
              ? <button className="primary" onClick={() => makeCurrent(next)}>Move on to Phase {phaseNo(next)}</button>
              : <span className="pill now">Your current phase</span>)
          : <button onClick={() => makeCurrent(phase)}>Make this my current phase</button>}
      </Head>

      <div className="cols">
        <div className="stack">
          <div className="card phase-facts">
            <TitleBlock className="fill" items={[
              ['Steps done', `${pr.done} / ${pr.total}`],
              ['Takes', phase.duration.replace(/\s*\(.*\)/, '')],
              phaseHoursShort(phase) && ['Asks', `${phaseHoursShort(phase)} a day`],
            ]} />
            <Bar pct={pr.pct} thick />
            <div className="counts">
              <span><i className="c-done" />{pr.done} done</span>
              <span><i className="c-doing" />{active} in progress</span>
              <span><i className="c-left" />{pr.total - pr.done - active} to go</span>
            </div>
          </div>

          {phase.overlap && <p className="note-banner"><b>Running alongside other phases.</b> {phase.overlap}</p>}

          <div className="card overview">
            <div className="card-h"><h2>About this phase</h2></div>
            <Prose text={phase.description} fold />
          </div>

          <ul className="list">
            {phase.steps.map((s, i) => {
              const st = state.stepStatus[s.id] || 'not_started';
              const n = stepName(s);
              const g = gateSections(s);
              const ticked = g ? Object.keys(state.gateChecks[s.id] || {}).length : 0;
              return (
                <li key={s.id} className={'item' + (st === 'completed' ? ' done' : '') + (focus?.id === s.id ? ' current' : '') + (flash === s.id ? ' flash' : '')} style={{ cursor: 'default' }}>
                  <Mark status={st} onClick={() => { const nx = nextStatus(st); setStepStatus(s.id, nx); if (nx === 'completed') { setFlash(s.id); setTimeout(() => setFlash(null), 700); } }} />
                  <a className="task-open" href={href('path', phase.id, s.id)}>
                    <span className="no dim">{i + 1}</span>
                    <span className="t">
                      <b>{n.title}</b>
                      <small>{[n.kicker, n.when, s.hoursPerDay && `${s.hoursPerDay}h a day`].filter(Boolean).join(' · ') || ' '}</small>
                    </span>
                    <span className="meta">
                      {g && st !== 'completed' && <span className="tag">{ticked} / {g.total}</span>}
                      {s.resources?.length > 0 && <span className="tag hide-sm" title={`${s.resources.length} resources`}><Link2 size={13} />{s.resources.length}</span>}
                      {state.stepNotes[s.id]?.trim() && <span className="tag hide-sm" title="You have notes here"><FileText size={13} /></span>}
                      {focus?.id === s.id ? <span className="pill now">Now</span> : st === 'in_progress' ? <span className="dot in_progress hide-sm">Doing</span> : null}
                    </span>
                    <ChevronRight className="chev" size={18} />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="aside">
          {phase.unlocks && (
            <section>
              <h3>By the end you will have</h3>
              <p className="goal-line">{phase.unlocks}</p>
            </section>
          )}
          <section>
            <h3>Your notes on this phase</h3>
            <NoteBox key={phase.id} value={state.phaseNotes[phase.id]} onSave={(t) => setPhaseNote(phase.id, t)} placeholder="Decisions, doubts, what to remember…" />
          </section>
          <section>
            <h3>Other phases</h3>
            <div className="links">
              {prev && <a href={href('path', prev.id)}><span>‹ Phase {phaseNo(prev)}: {prev.title}</span></a>}
              {next && <a href={href('path', next.id)}><span>Phase {phaseNo(next)}: {next.title} ›</span></a>}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

// The days of the Phase 0 schedule that belong to this block, with each task ticked as you finish it on Today.
function BlockDays({ step, phase }) {
  const { sel } = useStore();
  const days = (phase.phaseSchedule?.weeks || []).flatMap(w => w.days).filter(d => d.blockId === step.id);
  if (!days.length) return null;
  const all = days.flatMap(d => d.tasks);
  const done = all.filter(t => sel.allP0Completions[t.id] === 'completed').length;
  return (
    <div className="card block-days">
      <div className="card-h"><h2>Daily tasks for this block</h2><span className="muted small">{done} of {all.length} done</span></div>
      <Bar pct={(done / all.length) * 100} thick />
      {days.map(d => (
        <div key={d.day} className={'bd-day' + (d.day === sel.effectivePhase0Day ? ' today' : '')}>
          <span className="bd-n">Day {d.day}{d.day === sel.effectivePhase0Day && <em>Today</em>}</span>
          <ul>
            {d.tasks.map(t => {
              const st = sel.allP0Completions[t.id] || 'not_started';
              return <li key={t.id} className={st}><Mark status={st} label={st === 'completed' ? 'Done' : 'Not done yet'} onClick={() => go('today')} /><span>{t.label}</span><small>{hrs(t.hours)}</small></li>;
            })}
          </ul>
        </div>
      ))}
      <p className="muted small" style={{ margin: '12px 0 0' }}>{done === all.length ? 'Every task done: this block is complete.' : 'Tick these on Today. When they are all done, this block is marked done for you.'}</p>
    </div>
  );
}

function StepPage({ phase, step }) {
  const { state, sel, setStepStatus, setStepNote } = useStore();
  const toast = useToast();
  const n = stepName(step);
  const st = state.stepStatus[step.id] || 'not_started';
  const i = phase.steps.indexOf(step);
  const prev = phase.steps[i - 1];
  const next = phase.steps[i + 1];
  const isCurrent = phase.id === sel.currentPhase.id;
  const weekNow = phase.id === 'phase-2' ? sel.weekInPhase2 : sel.weekInPhase;

  const endFocus = useEndFocus();
  const setStatus = (s) => {
    // Finishing a step ends a timer running on it (logged only if the session was full)
    if (s === 'completed' && state.focus.running?.taskId === step.id) toast(endFocus());
    setStepStatus(step.id, s);
    if (s === 'completed') toast(next ? `Step done. Next: ${stepName(next).title}` : 'Last step done. The phase is complete.');
  };

  return (
    <>
      <Head back={{ href: href('path', phase.id), label: `Phase ${phaseNo(phase)}: ${phase.title}` }}
        eyebrow={n.kicker || `Step ${i + 1}`} step={`${i + 1} / ${phase.steps.length}`} title={n.title} sub={n.when}>
        <Seg value={st} onChange={setStatus} options={['not_started', 'in_progress', 'completed'].map(s => [s, STATUS_LABEL[s]])} />
      </Head>

      <div className="cols">
        <div className="stack">
          {step.completionCriteria && (
            <div className="done-when"><span className="eyebrow">You're done when</span>{step.completionCriteria.replace(/^Done when:\s*(\w)/i, (_, c) => c.toUpperCase())}</div>
          )}

          {phase.id === 'phase-0' && <BlockDays step={step} phase={phase} />}

          {step.dailySchedule?.length > 0 && (
            <div className="card">
              <div className="card-h"><h2>A day in this step</h2><span className="muted small">{step.hoursPerDay ? `${step.hoursPerDay}h a day` : ''}</span></div>
              <ul className="checklist">
                {step.dailySchedule.map(d => (
                  <li key={d.slot}><span className="wk">{hrs(d.hours)}</span><span><b>{d.label}.</b> {d.activity}</span></li>
                ))}
              </ul>
            </div>
          )}

          {step.weeklyCheckpoints?.length > 0 && (
            <div className="card">
              <div className="card-h"><h2>Weekly checkpoints</h2></div>
              <ul className="checklist">
                {step.weeklyCheckpoints.map(c => (
                  <li key={c.week} className={isCurrent && c.week === weekNow ? 'now' : ''}>
                    <span className="wk">Week {c.week}</span><span>{c.question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.stages?.length > 0 && (
            <div className="card">
              <div className="card-h"><h2>Stages</h2><span className="muted small">Each has its own test</span></div>
              <ol className="step-stages">
                {step.stages.map(sg => (
                  <li key={sg.name}><span className="wk">{sg.when}</span><span><b>{sg.name}.</b> {sg.done}</span></li>
                ))}
              </ol>
            </div>
          )}

          {step.gate
            ? <GateChecklist step={step} passed={st === 'completed'} onPass={() => setStatus('completed')} />
            : <div className="card"><Prose text={step.description} fold /></div>}

          {st !== 'completed' && !step.gate && (
            <button className="primary big" style={{ alignSelf: 'flex-start' }} onClick={() => setStatus('completed')}>Mark this step done</button>
          )}
        </div>

        <aside className="aside">
          {step.resources?.length > 0 && <section><h3>Resources</h3><Links items={step.resources.map(r => (typeof r === 'string' ? { name: r, url: `https://www.google.com/search?q=${encodeURIComponent(r)}` } : r))} /></section>}
          <section>
            <h3>Your notes</h3>
            <NoteBox key={step.id} value={state.stepNotes[step.id]} onSave={(t) => setStepNote(step.id, t)} placeholder="What you learned, links, open questions…" />
          </section>
          <section>
            <h3>In this phase</h3>
            <div className="links">
              {prev && <a href={href('path', phase.id, prev.id)}><span>‹ {stepName(prev).title}</span></a>}
              {next && <a href={href('path', phase.id, next.id)}><span>{stepName(next).title} ›</span></a>}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

export default function Roadmap({ phaseId, stepId }) {
  const { sel } = useStore();
  if (!phaseId || phaseId === 'timeline' || phaseId === 'resources') return <PhaseList tab={phaseId || 'phases'} />;
  // the plan as you follow it, including steps from accepted changes
  const phase = sel.phases.find(p => p.id === phaseId);
  if (!phase) return <div className="card"><Empty title="That phase doesn't exist." action={<a className="btn" href={href('path')}>Back to the roadmap</a>} /></div>;
  const step = stepId && phase.steps.find(s => s.id === stepId);
  if (stepId && !step) return <div className="card"><Empty title="That step doesn't exist." action={<a className="btn" href={href('path', phase.id)}>Back to the phase</a>} /></div>;
  return step ? <StepPage phase={phase} step={step} /> : <PhasePage phase={phase} />;
}
