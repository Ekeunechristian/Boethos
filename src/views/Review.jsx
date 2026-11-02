import { useState } from 'react';
import { useStore } from '../store/index.jsx';
import { ArrowRight, Award, Lock, Check, Sunrise, HandHeart, Sparkles, BookOpen, GraduationCap, Library, Headphones, Leaf, Moon, ShieldCheck, BookMarked, Mic, Users, NotebookPen, Timer } from 'lucide-react';
import { Head, TitleBlock, Seg, Bar, Empty, fmtDate, useToast } from '../lib/ui.jsx';
import { go } from '../lib/router';
import { Month, Health, Journal } from './ProgressMore.jsx';
import { shiftDay } from '../store/engine';
import { weekKey, todayISO } from '../lib/plan';

const QUESTIONS = [
  { key: 'built', label: 'What did God do this week, in me and through me?', hint: 'Be specific: a conversation, a sermon, an answered prayer.' },
  { key: 'hard', label: 'Where did I struggle?', hint: 'In prayer, in temper, in time, with someone. Name it.' },
  { key: 'surprised', label: 'Who needs care next week?', hint: 'Names. Then add them to your flock with a next contact.' },
  { key: 'checkpoint', label: 'Did I keep the Sabbath and my disciplines?', hint: 'Honestly. If not, what took their place?' },
  { key: 'nextWeek', label: 'The one thing that matters most next week', hint: 'One thing. Specific enough to start on Monday.' },
];

function ReviewForm({ date, existing, checkpoint }) {
  const { saveWeeklyReview } = useStore();
  const toast = useToast();
  const [form, setForm] = useState(() => Object.fromEntries(QUESTIONS.map(q => [q.key, existing?.[q.key] || ''])));
  const dirty = QUESTIONS.some(q => form[q.key] !== (existing?.[q.key] || ''));

  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); saveWeeklyReview(date, form); toast('Review saved'); }}>
      <div className="card-h"><h2>This week</h2><span className="muted small">Week ending {fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>
      {QUESTIONS.map((q, i) => (
        <div className="q" key={q.key}>
          <label className="q-label" htmlFor={`q-${q.key}`}><span className="q-n">{i + 1}</span>{q.label}</label>
          <p className="q-hint">{q.key === 'checkpoint' && checkpoint ? `“${checkpoint}”` : q.hint}</p>
          <textarea id={`q-${q.key}`} value={form[q.key]} onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))} style={{ minHeight: q.key === 'nextWeek' ? 64 : 100 }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="submit" className="primary big" disabled={!dirty}>{existing ? 'Save changes' : 'Save review'}</button>
        {existing && !dirty && <span className="muted small">Saved</span>}
      </div>
    </form>
  );
}

export function Week() {
  const { state, sel } = useStore();
  const key = weekKey();
  const past = Object.entries(state.weeklyReviews || {}).filter(([d]) => d !== key).sort(([a], [b]) => b.localeCompare(a));
  const today = todayISO();
  // The last three weeks: XP earned each day
  const days = Array.from({ length: 21 }, (_, i) => { const date = shiftDay(today, i - 20); return { date, count: state.events.filter(e => e.date === date).reduce((n, e) => n + e.xp, 0) }; });
  const max = Math.max(1, ...days.map(s => s.count));
  const activeDays = days.filter(s => s.count > 0).length;


  return (
    <>
      <div className="cols">
        <div className="stack">
          <ReviewForm key={key} date={key} existing={state.weeklyReviews?.[key]} checkpoint={null} />

          <a className="card j-pointer" href="#/home/journal/reviews">
            <b>Every review you have written is in your journal</b>
            <span>Your weekly reviews, your Bacenta’s, the month, your character and closing the day: all under Journal › Reviews, newest first.</span>
            <em>Open the journal<ArrowRight size={14} /></em>
          </a>
        </div>

        <aside className="aside">
          <section>
            <h3>Last three weeks</h3>
            <div className="heat">
              {days.map(s => {
                const l = s.count === 0 ? '' : s.count / max > 0.66 ? 'l3' : s.count / max > 0.33 ? 'l2' : 'l1';
                return <i key={s.date} className={l + (s.date === today ? ' today' : '')} title={`${fmtDate(s.date)}: ${s.count} XP`} />;
              })}
            </div>
            <p className="muted small" style={{ margin: '10px 0 0' }}>{activeDays} of 21 days with something done · {sel.streak.current} in a row now</p>
          </section>
          <section>
            <h3>Overall</h3>
            <TitleBlock className="grid" items={[
              ['Quiet times', new Set((state.life?.quietTimes || []).filter(q => q.date >= days[0].date).map(q => q.date)).size],
              ['Today', `${sel.todaysDone} / ${sel.todaysTotal}`],
              ['Prayer', state.prayerSessions.length],
              ['Visits', state.ministry.followUps.filter(f => f.kind === 'visit' && f.status === 'completed').length],
              ['Preached', state.ministry.sermons.filter(x => (x.stage || 0) >= 6).length],
              ['Memorised', state.scriptureMemory.filter(x => x.status === 'memorized').length],
            ]} />
          </section>
          <section>
            <h3>Health of the ministry</h3>
            <ul className="ready">
              {sel.health.map(m => (
                <li key={m.id}>
                  <a href="#/home/health">
                    <span className="lbl">{m.label}</span>
                    <Bar pct={m.score} accent={m.score < 34} />
                    <span className="num">{m.score}</span>
                  </a>
                </li>
              ))}
            </ul>
            {sel.warnings.length > 0 && <p className="warn-text small" style={{ marginTop: 8 }}>{sel.warnings.length} burnout {sel.warnings.length === 1 ? 'warning' : 'warnings'}: see Health.</p>}
          </section>
        </aside>
      </div>
    </>
  );
}

// ── Achievements: earned in colour, the rest waiting in pencil ─────────────────
export function Achievements() {
  const { sel } = useStore();
  const earned = sel.achievements.filter(a => a.earned).length;
  return (
    <>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <span className="muted small">{earned} of {sel.achievements.length} earned</span>
      </div>
      <div className="badges">
        {sel.achievements.map(a => (
          <div key={a.id} className={'badge' + (a.earned ? ' earned' : '')}>
            <span className="badge-mark" aria-hidden="true">{a.earned ? <Award size={22} /> : <Lock size={18} />}</span>
            <b>{a.title}</b>
            <small>{a.desc}</small>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Activity: everything you have done, as a timeline, with the XP it earned ─────────
const KIND_ICON = { quiet: Sunrise, prayer: HandHeart, prayertime: HandHeart, request: HandHeart, answered: Sparkles, bible: BookOpen, study: GraduationCap,
  reading: Library, book: Library, listen: Headphones, fast: Leaf, examen: Moon, shutdown: Moon, character: ShieldCheck, meditate: BookMarked, scripture: BookMarked,
  memorized: BookMarked, sermon: Mic, preached: Mic, visit: Users, contact: Users, member: Users, leader: Users, care: Users, review: NotebookPen, task: Check, focus: Timer };
const KIND_TONE = { quiet: 'brown', reading: 'brown', book: 'brown', fast: 'brown', examen: 'brown', study: 'blue', listen: 'blue', meditate: 'blue', memorized: 'blue', scripture: 'blue', answered: 'gold' };
export function Activity() {
  const { state, sel } = useStore();
  const [shown, setShown] = useState(10);
  const byDay = {};
  [...state.events].reverse().forEach(e => { (byDay[e.date] = byDay[e.date] || []).push(e); });
  const days = Object.keys(byDay).sort().reverse();
  const kinds = {};
  state.events.forEach(e => { const k = KIND_NAMES[e.kind] || e.kind; kinds[k] = (kinds[k] || 0) + e.xp; });
  const top = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const today = todayISO();
  const rel = (d) => (d === today ? 'Today' : d === shiftDay(today, -1) ? 'Yesterday' : fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' }));
  return (
    <div className="cols">
      <div className="stack">
        {days.length === 0 && <div className="card"><Empty title="Nothing yet."><p>Keep your quiet time or log a prayer and it will appear here.</p></Empty></div>}
        {days.length > 0 && (
          <div className="card act2">
            {days.slice(0, shown).map(d => (
              <section key={d} className="a2-day">
                <header><h3>{rel(d)}</h3><span className="a2-xp">+{byDay[d].reduce((a, e) => a + e.xp, 0)} XP</span></header>
                <ol className="a2-list">{byDay[d].map(e => { const Icon = KIND_ICON[e.kind] || Check; return (
                  <li key={e.id}>
                    <span className={'a2-ic ' + (KIND_TONE[e.kind] || 'olive')}><Icon size={15} /></span>
                    <span className="a2-t"><b>{e.label}</b><small>{KIND_NAMES[e.kind] || e.kind}{e.at ? ` · ${new Date(e.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}</small></span>
                    <span className="a2-pts">+{e.xp}</span>
                  </li>); })}</ol>
              </section>
            ))}
            {days.length > shown && <button className="a2-more" onClick={() => setShown(n => n + 10)}>Show earlier days</button>}
          </div>
        )}
      </div>
      <aside className="aside">
        <section>
          <div className="a2-totals">
            <div><b>{sel.xp.toLocaleString()}</b><small>XP in all</small></div>
            <div><b>{sel.streak.active.size}</b><small>active days</small></div>
            <div><b>{sel.streak.current}</b><small>in a row</small></div>
            <div><b>{sel.streak.longest}</b><small>longest</small></div>
          </div>
        </section>
        {top.length > 0 && (
          <section>
            <h3>Where your XP comes from</h3>
            <ul className="a2-bars">{top.map(([k, xp]) => <li key={k}><span>{k}</span><i><em style={{ width: `${(xp / top[0][1]) * 100}%` }} /></i><b>{xp}</b></li>)}</ul>
          </section>
        )}
      </aside>
    </div>
  );
}

const KIND_NAMES = {
  task: 'Task', step: 'Step', phase: 'Phase', prayer: 'Prayer', request: 'Request', answered: 'Answered', discipline: 'Discipline',
  scripture: 'Scripture', memorized: 'Memorised', sermon: 'Sermon', preached: 'Preached', visit: 'Visit', member: 'Flock', contact: 'Contact',
  leader: 'Leader', care: 'Counsel', review: 'Review', focus: 'Focus', shutdown: 'Day closed',
  quiet: 'Quiet time', bible: 'Bible', study: 'Study', reading: 'Reading', book: 'Book', listen: 'Message', fast: 'Fast', prayertime: 'Prayer time', examen: 'Day closed', character: 'Character', meditate: 'Meditation',
};

const TABS = [['week', 'This week'], ['month', 'Month'], ['health', 'Health'], ['achievements', 'Achievements'], ['activity', 'Activity'], ['journal', 'Journal']];

export default function Progress({ tab = 'week' }) {
  const { sel } = useStore();
  const t = TABS.some(([id]) => id === tab) ? tab : 'week';
  return (
    <>
      <Head eyebrow="Progress" step={`Level ${sel.level.level}`} title={{ week: 'Look back, then aim', month: 'Your month', health: 'Health of the ministry', achievements: 'Achievements', activity: 'Everything you have done', journal: 'Journal' }[t]}
        sub={{ week: 'Once a week, on Sunday. It is how the plan stays honest.', month: 'Every day of the month, shaded by the work you did.', health: 'The five marks of a healthy church, and the warnings your own logs raise.', achievements: 'Milestones on the way, earned by doing the work.', activity: 'Every prayer, visit, sermon and task, with the XP it earned.', journal: 'Your journal entries, the lines you write on Today, reviews and notes, all in one place.' }[t]}>
        <TitleBlock items={[['XP', sel.xp.toLocaleString()], ['Streak', `${sel.streak.current} days`], ['Badges', `${sel.achievements.filter(a => a.earned).length} / ${sel.achievements.length}`]]} />
      </Head>
      <div style={{ marginBottom: 24 }}><Seg value={t} onChange={(v) => go('review', v)} options={TABS} /></div>
      {{ week: <Week />, month: <Month />, health: <Health />, achievements: <Achievements />, activity: <Activity />, journal: <Journal /> }[t]}
    </>
  );
}
