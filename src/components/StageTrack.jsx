import { STAGES, stageIndex } from '../lib/plan';

// The four stretches of the plan as one arrow track; the stage you are in is ink-teal.
export default function StageTrack({ phaseId }) {
  const now = stageIndex(phaseId);
  return (
    <ol className="flow track" aria-label="Stages of the plan">
      {STAGES.map((st, i) => (
        <li key={st.name} className={i < now ? 's3' : i === now ? 's4' : 's1'} aria-current={i === now ? 'step' : undefined}>
          <div className="ts">
            <b>{st.name}</b>
            <small>{i === now ? 'You are here' : `Phase ${st.ids[0].slice(6)}–${st.ids[st.ids.length - 1].slice(6)}`}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
