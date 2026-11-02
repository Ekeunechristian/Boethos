import { useMemo, useState } from 'react';
import { X, Plus, Check, ArrowRight, Search } from 'lucide-react';
import { ROADMAP_DATA } from '../../data/roadmap';
import { BIBLE, BIBLE_CHAPTERS, TOPIC_GROUPS, STUDY_PROMPTS } from '../../data/spoudazo';
import { allTopics, topicOf, nextChapter, lifeStats, planPortion, planPosition, streaks } from '../../store/life';
import { mondayOf } from '../../store/ministry';
import { Head, Seg, TitleBlock, Empty, fmtDate } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useLife, BookPicker } from './common.jsx';

const STEP_TEXT = Object.fromEntries(ROADMAP_DATA.phases.flatMap(p => p.steps).map(s => [s.id, s.description]));
const topicGuide = (t) => t.desc || (t.step && STEP_TEXT[t.step]) || '';
const chaptersIn = (b) => Math.max(0, (Number(b.to) || Number(b.from) || 0) - (Number(b.from) || 0) + 1);
const range = (b) => `${b.book} ${b.from}${Number(b.to) > Number(b.from) ? `–${b.to}` : ''}`;
const portionText = (segs) => segs.map(range).join(', ');
const hm = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`; };

// ── Bible reading: the whole-Bible plan first, and anything else you read ──
function Reading() {
  const { l, g, today, act, toast } = useLife();
  const [n, setN] = useState(g.chaptersPerDay || 3);
  const [learned, setLearned] = useState('');
  const [own, setOwn] = useState({ book: 'Psalms', from: 1, to: 1, learned: '' });
  const portion = planPortion(l, Number(n) || 1);
  const pos = planPosition(l);
  const pct = Math.round((pos / BIBLE_CHAPTERS) * 100);
  const nc = nextChapter(l);
  const planToday = l.bible.filter(b => b.date === today && b.plan !== false).reduce((s, b) => s + chaptersIn(b), 0);
  const allToday = l.bible.filter(b => b.date === today).reduce((s, b) => s + chaptersIn(b), 0);
  const st = streaks(l.bible.map(b => b.date), today);
  const mon = mondayOf(today);
  const elapsed = Math.round((new Date(today) - new Date(mon)) / 86400000) + 1;
  const week = l.bible.filter(b => b.date >= mon && b.date <= today).reduce((s, b) => s + chaptersIn(b), 0);
  const daysLeft = g.chaptersPerDay ? Math.ceil((BIBLE_CHAPTERS - pos) / g.chaptersPerDay) : 0;
  const finish = daysLeft ? new Date(Date.now() + daysLeft * 86400000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null;
  const recent = [...l.bible].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 5);
  const readSet = useMemo(() => { const s = new Set(); l.bible.forEach(b => { for (let c = Number(b.from); c <= (Number(b.to) || Number(b.from)); c++) s.add(`${b.book}|${c}`); }); return s; }, [l.bible]);
  const readPortion = (e) => {
    e.preventDefault();
    portion.forEach((p, i) => act('BIBLE_ADD', { data: { ...p, plan: true, learned: i === 0 ? learned.trim() : '' } }));
    toast(`${portionText(portion)} read`); setLearned('');
  };
  const readOwn = (e) => {
    e.preventDefault();
    const from = Number(own.from), to = Math.max(from, Number(own.to));
    act('BIBLE_ADD', { data: { book: own.book, from, to, plan: false, learned: own.learned.trim() } });
    toast(`${own.book} ${from}${to > from ? `–${to}` : ''} recorded`); setOwn(x => ({ ...x, learned: '' }));
  };
  const max = BIBLE.find(([b]) => b === own.book)?.[1];
  const testament = (from, to, label) => (
    <div className="bible-t"><h4>{label}</h4>
      <div className="bible-grid">{BIBLE.slice(from, to).map(([b, c]) => {
        let have = 0; for (let i = 1; i <= c; i++) if (readSet.has(`${b}|${i}`)) have++;
        return <div key={b} className={'bk' + (have === c ? ' full' : have ? ' some' : '') + (b === nc.book ? ' here' : '')} title={`${b}: ${have} of ${c} chapters`}><span>{b}</span><i style={{ width: `${(have / c) * 100}%` }} /></div>;
      })}</div>
    </div>
  );
  return (
    <>
      <div className="cols">
        <div className="stack">
          <form className="card br-plan" onSubmit={readPortion}>
            <div className="card-h"><h2>Today’s portion</h2><span className="muted small">Genesis to Revelation, in order</span></div>
            <p className="br-portion">{portionText(portion)}</p>
            <p className="br-sub">{planToday >= g.chaptersPerDay ? <><Check size={14} /> You have read {planToday} chapters of your plan today. Read on if you want to.</> : `Chapter ${pos + 1} of ${BIBLE_CHAPTERS} in your plan.`}</p>
            <div className="br-n"><span>Chapters</span>
              <button type="button" className="sm" onClick={() => setN(Math.max(1, Number(n) - 1))} aria-label="One fewer">−</button>
              <b>{n}</b>
              <button type="button" className="sm" onClick={() => setN(Number(n) + 1)} aria-label="One more">+</button></div>
            <div className="field"><label htmlFor="br-learn">What God showed me</label><textarea id="br-learn" value={learned} onChange={e => setLearned(e.target.value)} style={{ minHeight: 90 }} placeholder="What you learned, in your own words. It goes to your journal." /></div>
            <button className="primary" type="submit">I read it</button>
          </form>

          <form className="card br-own" onSubmit={readOwn}>
            <div className="card-h"><h2>Read outside the plan</h2><span className="muted small">It won’t move your plan</span></div>
            <div className="fields">
              <div className="field wide"><label>Book</label><BookPicker value={own.book} onChange={v => setOwn(x => ({ ...x, book: v, from: 1, to: 1 }))} /></div>
              <div className="field"><label htmlFor="bo-from">From chapter</label><input id="bo-from" type="number" min="1" max={max} value={own.from} onChange={e => setOwn(x => ({ ...x, from: e.target.value }))} /></div>
              <div className="field"><label htmlFor="bo-to">To chapter</label><input id="bo-to" type="number" min="1" max={max} value={own.to} onChange={e => setOwn(x => ({ ...x, to: e.target.value }))} /></div>
              <div className="field wide"><label htmlFor="bo-learn">What God showed me <em>optional</em></label><input id="bo-learn" value={own.learned} onChange={e => setOwn(x => ({ ...x, learned: e.target.value }))} /></div>
            </div>
            <button type="submit">Record it</button>
          </form>
        </div>
        <aside className="aside even">
          <section>
            <h3>Your plan</h3>
            <div className="qb-big"><b>{pct}%</b><span>{pos} of {BIBLE_CHAPTERS} chapters</span></div>
            <span className="ch-bar"><i style={{ width: `${pct}%` }} /></span>
            <dl className="qb-dl">
              <div><dt>Next</dt><dd>{nc.book} {nc.chapter}</dd></div>
              <div><dt>Your pace</dt><dd>{g.chaptersPerDay} chapters a day</dd></div>
              {finish && <div><dt>You finish</dt><dd>around {finish}</dd></div>}
            </dl>
          </section>
          <section>
            <h3>Reading streak</h3>
            <TitleBlock className="grid" items={[['Days in a row', st.current], ['Best run', st.best]]} />
            <div className="pl-week"><span>This week</span><b>{week} <small>of {g.chaptersPerDay * elapsed} chapters</small></b></div>
            <span className="ch-bar"><i style={{ width: `${Math.min(100, (week / Math.max(1, g.chaptersPerDay * elapsed)) * 100)}%` }} /></span>
            <p className="muted small" style={{ margin: '8px 0 0' }}>Today: {allToday} {allToday === 1 ? 'chapter' : 'chapters'}.</p>
          </section>
          <section>
            <h3>Recently read</h3>
            {recent.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Nothing yet.</p> : <ul className="br-recent">{recent.map(b => (
              <li key={b.id}><span><b>{range(b)}</b><small>{fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {b.plan === false ? 'Own reading' : 'Plan'}</small></span>
                <button className="ghost sm" onClick={() => act('BIBLE_DELETE', { id: b.id })} aria-label="Delete"><X size={13} /></button></li>))}</ul>}
            <a className="aside-link" href="#/word/journal">Your journal<ArrowRight size={13} /></a>
          </section>
        </aside>
      </div>
      <section className="card br-grid">
        <div className="card-h"><h2>Through the whole Bible</h2><span className="muted small">{readSet.size} of {BIBLE_CHAPTERS} chapters read, in the plan or outside it</span></div>
        {testament(0, 39, 'Old Testament')}
        {testament(39, 66, 'New Testament')}
      </section>
    </>
  );
}

// ── Study topics: one topic, learned over many days ──
function Study() {
  const { l, g, today, act, toast } = useLife();
  const topics = allTopics(l);
  const cur = topicOf(l, l.study.current);
  const [open, setOpen] = useState(null);
  const [n, setN] = useState({ learned: '', scripture: '', apply: '', minutes: g.studyMinutes });
  const [custom, setCustom] = useState({ title: '', desc: '' });
  const [browse, setBrowse] = useState(!cur);
  const notes = l.studyNotes.filter(x => x.topicId === l.study.current).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const mins = notes.reduce((s, x) => s + (Number(x.minutes) || 0), 0);
  const days = cur ? Math.max(1, Math.round((new Date(today) - new Date(l.study.since)) / 86400000) + 1) : 0;
  const st = streaks(l.studyNotes.map(x => x.date), today);
  const mon = mondayOf(today);
  const elapsed = Math.round((new Date(today) - new Date(mon)) / 86400000) + 1;
  const weekMin = l.studyNotes.filter(x => x.date >= mon && x.date <= today).reduce((s, x) => s + (Number(x.minutes) || 0), 0);
  const wroteToday = l.studyNotes.some(x => x.date === today);
  const notesFor = (id) => l.studyNotes.filter(x => x.topicId === id).length;
  const library = (
    <>
      {TOPIC_GROUPS.concat(l.customTopics.length ? [['custom', 'Your own topics']] : []).map(([gid, glabel]) => (
        <section key={gid} className="topic-group">
          <h3 className="tg-h">{glabel}</h3>
          <div className="topic-grid">{topics.filter(t => (t.custom ? 'custom' : t.group) === gid).map(t => {
            const isCur = t.id === l.study.current;
            return (
              <article key={t.id} className={'topic' + (isCur ? ' cur' : '')}>
                <button type="button" className="tp-h" onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id}>
                  <b>{t.title}</b><small>{notesFor(t.id) ? `${notesFor(t.id)} notes` : (t.refs || []).slice(0, 2).join(' · ')}</small>
                </button>
                {open === t.id && <div className="tp-body">{topicGuide(t) && <p>{topicGuide(t)}</p>}{t.refs?.length > 0 && <p className="refs">{t.refs.join(' · ')}</p>}</div>}
                <div className="tp-foot">{isCur ? <span className="pill good">Your focus</span> : <button className="sm" onClick={() => { act('STUDY_SET', { topicId: t.id }); toast(`Now studying ${t.title}`); setBrowse(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Focus on this</button>}
                  {t.custom && <button className="ghost sm" onClick={() => act('TOPIC_DELETE', { id: t.id })}>Remove</button>}</div>
              </article>
            );
          })}</div>
        </section>
      ))}
      <form className="card" onSubmit={(e) => { e.preventDefault(); act('TOPIC_ADD', { data: { title: custom.title.trim(), desc: custom.desc.trim() } }); setCustom({ title: '', desc: '' }); toast('Topic added'); }}>
        <div className="card-h"><h2>Add your own topic</h2></div>
        <div className="fields"><div className="field"><label htmlFor="ct-t">Topic</label><input id="ct-t" value={custom.title} onChange={e => setCustom(x => ({ ...x, title: e.target.value }))} placeholder="Eschatology; the anointing; marriage" /></div>
          <div className="field"><label htmlFor="ct-d">Why it matters to you</label><input id="ct-d" value={custom.desc} onChange={e => setCustom(x => ({ ...x, desc: e.target.value }))} /></div></div>
        <button className="sm" type="submit" disabled={!custom.title.trim()}><Plus size={14} />Add topic</button>
      </form>
    </>
  );
  if (!cur) return <><div className="card pray-cta"><div><b>Choose one topic to study</b><span>Stay with it over days and weeks, writing what you learn each time, until you choose to move on.</span></div></div>{library}</>;
  return (
    <>
      <div className="cols">
        <div className="stack">
          <form className="card study-now" onSubmit={(e) => { e.preventDefault(); act('STUDY_NOTE', { data: { ...n, learned: n.learned.trim(), minutes: Number(n.minutes) || 0 } }); setN(x => ({ ...x, learned: '', scripture: '', apply: '' })); toast('Saved to your journal'); }}>
            <div className="card-h"><h2>{cur.title}</h2><span className="muted small">Day {days} · since {fmtDate(l.study.since, { day: 'numeric', month: 'long' })}</span></div>
            {topicGuide(cur) && <p className="study-guide">{topicGuide(cur)}</p>}
            {cur.refs?.length > 0 && <p className="sd-refs">{cur.refs.map(r => <span key={r}>{r}</span>)}</p>}
            <h4 className="sd-h">{wroteToday ? 'Something more from today' : 'What are you learning today?'}</h4>
            <div className="fields">
              <div className="field wide"><label htmlFor="sn-l">{STUDY_PROMPTS[0]}</label><textarea id="sn-l" value={n.learned} onChange={e => setN(x => ({ ...x, learned: e.target.value }))} style={{ minHeight: 100 }} required /></div>
              <div className="field"><label htmlFor="sn-s">{STUDY_PROMPTS[1]}</label><input id="sn-s" value={n.scripture} onChange={e => setN(x => ({ ...x, scripture: e.target.value }))} /></div>
              <div className="field"><label htmlFor="sn-m">Minutes studied</label><input id="sn-m" type="number" min="0" value={n.minutes} onChange={e => setN(x => ({ ...x, minutes: e.target.value }))} /></div>
              <div className="field wide"><label htmlFor="sn-a">{STUDY_PROMPTS[2]}</label><input id="sn-a" value={n.apply} onChange={e => setN(x => ({ ...x, apply: e.target.value }))} /></div>
            </div>
            <div className="fr-foot"><button type="button" className="ghost sm" onClick={() => setBrowse(!browse)}>{browse ? 'Hide the topics' : 'Change topic'}</button><button className="primary" type="submit" disabled={!n.learned.trim()}>Save what I learned</button></div>
          </form>
        </div>
        <aside className="aside even">
          <section>
            <h3>Study streak</h3>
            <TitleBlock className="grid" items={[['Days in a row', st.current], ['Best run', st.best]]} />
            <div className="pl-week"><span>This week</span><b>{hm(weekMin)} <small>of {hm(g.studyMinutes * elapsed)}</small></b></div>
            <span className="ch-bar"><i style={{ width: `${Math.min(100, (weekMin / Math.max(1, g.studyMinutes * elapsed)) * 100)}%` }} /></span>
          </section>
          <section>
            <h3>This topic</h3>
            <TitleBlock className="grid" items={[['Notes', notes.length], ['Time', hm(mins)]]} />
            {notes.length > 0 && <ul className="sd-notes">{notes.slice(0, 3).map(x => <li key={x.id}><p>{x.learned}</p><small>{fmtDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}{x.scripture ? ` · ${x.scripture}` : ''}</small></li>)}</ul>}
            <a className="aside-link" href="#/word/journal">Everything in your journal<ArrowRight size={13} /></a>
          </section>
        </aside>
      </div>
      {browse && <div className="sd-library">{library}</div>}
      {!browse && l.study.history.length > 0 && <section className="card sd-before"><div className="card-h"><h2>Studied before</h2></div>
        <ul className="sd-hist">{[...l.study.history].reverse().map((h, i) => <li key={i}><b>{topicOf(l, h.topicId)?.title || 'A topic'}</b><small>{fmtDate(h.from, { day: 'numeric', month: 'short' })} to {fmtDate(h.to, { day: 'numeric', month: 'short', year: 'numeric' })} · {notesFor(h.topicId)} notes</small></li>)}</ul></section>}
    </>
  );
}

// ── Journal: everything you learned from the Word and your study ──
const KINDS = [['', 'All'], ['plan', 'Bible plan'], ['own', 'Own reading'], ['study', 'Study']];
function Journal() {
  const { l, today, act } = useLife();
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const [sure, setSure] = useState(null);
  const entries = [
    ...l.bible.map(b => ({ id: b.id, date: b.date, kind: b.plan === false ? 'own' : 'plan', what: range(b), text: b.learned || b.note || '', del: () => act('BIBLE_DELETE', { id: b.id }) })),
    ...l.studyNotes.map(x => ({ id: x.id, date: x.date, kind: 'study', what: topicOf(l, x.topicId)?.title || 'Study', text: x.learned, scripture: x.scripture, apply: x.apply, minutes: x.minutes, del: () => act('STUDY_NOTE_DELETE', { id: x.id }) })),
  ].filter(e => (!kind || e.kind === kind) && (!q || `${e.what} ${e.text} ${e.scripture || ''} ${e.apply || ''}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const months = [];
  entries.forEach(x => { const k = x.date.slice(0, 7); const m = months[months.length - 1]; if (m && m.k === k) m.items.push(x); else months.push({ k, items: [x] }); });
  const bibleDays = l.bible.filter(b => b.learned || b.note).map(b => b.date);
  const sb = streaks(bibleDays, today), ss = streaks(l.studyNotes.map(x => x.date), today);
  const wroteBible = bibleDays.includes(today), wroteStudy = l.studyNotes.some(x => x.date === today);
  const label = { plan: 'Bible plan', own: 'Own reading', study: 'Study' };
  return (
    <div className="stack">
      <div className="jw-streaks">
        <a className={'jw-s' + (wroteBible ? ' done' : '')} href="#/word">
          <small>From the Bible</small><b>{sb.current} <span>{sb.current === 1 ? 'day' : 'days'} in a row</span></b>
          <em>Best {sb.best} · {wroteBible ? 'written today' : 'not yet today'}</em>{!wroteBible && <ArrowRight size={15} />}
        </a>
        <a className={'jw-s' + (wroteStudy ? ' done' : '')} href="#/word/study">
          <small>From your study</small><b>{ss.current} <span>{ss.current === 1 ? 'day' : 'days'} in a row</span></b>
          <em>Best {ss.best} · {wroteStudy ? 'written today' : 'not yet today'}</em>{!wroteStudy && <ArrowRight size={15} />}
        </a>
      </div>
      <div className="jr-bar">
        <div className="j-search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search what you have learned…" aria-label="Search the journal" /></div>
        <div className="jw-kinds" role="group" aria-label="Show">{KINDS.map(([id, t]) => <button key={id} type="button" className={kind === id ? 'on' : ''} onClick={() => setKind(id)}>{t}</button>)}</div>
      </div>
      {entries.length === 0 && <div className="card"><Empty title={q || kind ? 'Nothing matches.' : 'Nothing written yet.'} /></div>}
      {months.map(({ k, items }) => (
        <section key={k} className="card jr-month">
          <div className="card-h"><h2>{new Date(k + '-15T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2><span className="muted small">{items.length} {items.length === 1 ? 'entry' : 'entries'}</span></div>
          <ol className="jr-list">{items.map(x => (
            <li key={x.id}>
              <div className="jr-date"><b>{+x.date.slice(8)}</b><small>{new Date(x.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</small></div>
              <div className="jr-body">
                <p className="jr-what"><span className={'jw-tag ' + x.kind}>{label[x.kind]}</span>{x.what}{x.minutes ? <span> · {x.minutes} min</span> : null}</p>
                {x.text ? <blockquote>{x.text}</blockquote> : <p className="muted small" style={{ margin: 0 }}>Read, nothing written.</p>}
                {x.scripture && <p className="qf-do"><span>Scripture</span>{x.scripture}</p>}
                {x.apply && <p className="qf-do"><span>I will</span>{x.apply}</p>}
              </div>
              <div className="jr-del">{sure === x.id
                ? <><button className="sm" onClick={() => { x.del(); setSure(null); }}>Delete</button><button className="ghost sm" onClick={() => setSure(null)}>Keep</button></>
                : <button className="ghost sm" onClick={() => setSure(x.id)} aria-label="Delete entry"><X size={14} /></button>}</div>
            </li>
          ))}</ol>
        </section>
      ))}
    </div>
  );
}

const TABS = [['', 'Bible reading'], ['study', 'Study topics'], ['journal', 'Journal']];
export default function Word({ tab = '' }) {
  const { state, l, today } = useLife();
  const t = TABS.some(([id]) => id === tab) ? tab : '';
  const st = lifeStats(state, today);
  const cur = topicOf(l, l.study.current);
  const pos = planPosition(l);
  return (
    <>
      <Head eyebrow="Spoudazō" step="The Word" title={{ '': 'Read the whole Bible', study: cur ? `Studying ${cur.title}` : 'What will you study?', journal: 'Your Word journal' }[t]}
        sub={{ '': 'Your plan runs from Genesis to Revelation. Read your portion each day, and record anything else you read.', study: 'One topic, learned over days and weeks. Write what God teaches you each time.', journal: 'What you learned from the Bible and from your study, day by day.' }[t]}>
        <TitleBlock items={[['This week', `${st.chapters7} ch`], ['Your plan', `${Math.round((pos / BIBLE_CHAPTERS) * 100)}%`], ['Study notes', l.studyNotes.length]]} />
      </Head>
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('word', ...(v ? [v] : []))} options={TABS} /></div>
      {t === '' && <Reading />}
      {t === 'study' && <Study />}
      {t === 'journal' && <Journal />}
    </>
  );
}
