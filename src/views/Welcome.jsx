import { useState } from 'react';
import TimeInput from '../lib/TimeInput.jsx';
import { ArrowRight, ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { todayKey } from '../store/engine';
import { WELCOME_VERSES } from '../data/scripture';
import { DEFAULT_GOALS, PRAYER_MIN } from '../data/spoudazo';
import { Verse } from '../lib/ui.jsx';
import { RhythmFields, Stepper } from './spoudazo/Rhythm.jsx';
import Mark from '../components/Mark.jsx';

const STEPS = [['You and your Bacenta', 'Who you are, and where you shepherd'], ['Your rhythm', 'What you will give God each day']];

// The hills from the logo, drawn large at the foot of the panel
const Hills = () => (
  <svg className="w3-hills" viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true">
    <circle cx="200" cy="92" r="46" fill="#E0B45A" opacity=".9" />
    <path d="M0 160 L120 62 Q132 52 144 62 L200 112 L256 62 Q268 52 280 62 L400 160 Z" fill="#F4F0E2" />
    <path d="M0 160 L70 118 L150 160 Z M250 160 L330 112 L400 150 L400 160 Z" fill="#DCD6C2" />
  </svg>
);

// The first run: who you are and where you shepherd, then the rhythm Spoudazō builds your days from.
export default function Welcome() {
  const { state, dispatch, setProfile, setChurchName, setStartDate, completeOnboarding, life } = useStore();
  const [step, setStep] = useState(0);
  const m = state.ministry.settings;
  const [you, setYou] = useState({ name: state.name || '', bacenta: state.onboardingDone ? m.name || '' : '', church: state.churchName || '', thu: m.times?.thu || '19:00', sat: m.times?.sat || '10:00', stable: m.baseline?.approx ?? 3 });
  const [goals, setGoals] = useState(() => { const g = { ...DEFAULT_GOALS, ...(state.life.setupDone ? state.life.goals : {}) }; return { ...g, prayerMinutes: Math.max(PRAYER_MIN, g.prayerMinutes) }; });
  const [topic, setTopic] = useState(state.life.study.current || '');
  const set = (k, v) => setYou(x => ({ ...x, [k]: v }));
  const next = (n) => { setStep(n); window.scrollTo(0, 0); };

  const finish = () => {
    const today = todayKey();
    setProfile({ name: you.name.trim() });
    setChurchName(you.church.trim());
    if (!state.startDate) setStartDate(today);
    dispatch({ type: 'M_SETTINGS', data: { name: you.bacenta.trim() || 'Greater Love Bacenta', times: { ...m.times, thu: you.thu, sat: you.sat }, baseline: { ...m.baseline, approx: Number(you.stable) || 0 } } });
    life('SETUP', { goals });
    if (topic) life('STUDY_SET', { topicId: topic });
    completeOnboarding();
    window.location.hash = '#/home';
  };

  return (
    <div className="w3">
      <aside className="w3-side">
        <div className="w3-brand"><Mark size={52} /><div><b>Boēthos</b><span className="w3-sub"><i lang="grc">βοηθός</i><span className="w3-orn" aria-hidden="true" /><span className="w3-en">the helper</span></span></div></div>
        <ol className="w3-steps">
          {STEPS.map(([t, d], i) => (
            <li key={t} className={i === step ? 'now' : i < step ? 'done' : ''}>
              <span className="w3-n">{i < step ? <Check size={15} strokeWidth={3} /> : i + 1}</span>
              <span><b>{t}</b><small>{d}</small></span>
            </li>
          ))}
        </ol>
        <Verse v={WELCOME_VERSES[step]} className="on-dark" />
        <Hills />
      </aside>

      <main className="w3-main">
        {step === 0 && (
          <form onSubmit={(e) => { e.preventDefault(); next(1); }}>
            <span className="w3-kick">Step 1 of 2</span>
            <h1>Welcome. Let’s begin with you.</h1>
            <p className="w3-lead">Boēthos holds two callings. <b>Spoudazō</b> keeps your own walk with God; <b>Poimainō</b> keeps the people he has given you.</p>

            <section className="w3-group">
              <h2>You</h2>
              <div className="w3-fields">
                <label className="w3-f"><span>What should Boēthos call you?</span><input value={you.name} onChange={e => set('name', e.target.value)} autoComplete="given-name" placeholder="Your first name" required /></label>
                <label className="w3-f"><span>Your church <em>optional</em></span><input value={you.church} onChange={e => set('church', e.target.value)} /></label>
              </div>
            </section>

            <section className="w3-group">
              <h2>Your Bacenta</h2>
              <div className="w3-fields">
                <label className="w3-f wide"><span>Its name</span><input value={you.bacenta} onChange={e => set('bacenta', e.target.value)} placeholder="e.g. Greater Love Bacenta" required /></label>
                <div className="w3-meet">
                  <div className="w3-mt"><b>Thursday</b><small>Bible study you lead</small><TimeInput className="time-pill" value={you.thu} onChange={e => set('thu', e.target.value)} aria-label="Thursday Bible study starts" /></div>
                  <div className="w3-mt"><b>Saturday</b><small>Church service</small><TimeInput className="time-pill" value={you.sat} onChange={e => set('sat', e.target.value)} aria-label="Saturday church starts" /></div>
                </div>
                <div className="w3-stable">
                  <div><b>Stable members today</b><small>Roughly. The vision is 25; this stays “reported” until you review the roster in Poimainō.</small></div>
                  <Stepper label="stable members" value={Number(you.stable) || 0} onChange={v => set('stable', v)} max={200} />
                </div>
              </div>
            </section>

            <div className="w3-foot"><span className="muted small">You can change all of this later in Settings.</span>
              <button type="submit" className="primary big" disabled={!you.name.trim() || !you.bacenta.trim()}>Next: your rhythm<ArrowRight size={18} /></button></div>
          </form>
        )}
        {step === 1 && (
          <div>
            <span className="w3-kick">Step 2 of 2</span>
            <h1>{you.name ? `${you.name.trim()}, your rhythm` : 'Your rhythm'}</h1>
            <p className="w3-lead">What you intend to give God each day. Spoudazō builds your day from it and reminds you at these times. Start honestly; you can grow it later.</p>
            <RhythmFields value={goals} onChange={setGoals} topic={topic} onTopic={setTopic} />
            <div className="w3-foot">
              <button type="button" onClick={() => next(0)}><ArrowLeft size={16} />Back</button>
              <button type="button" className="primary big" onClick={finish}>Begin<ArrowRight size={18} /></button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
