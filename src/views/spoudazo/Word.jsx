import { useMemo, useState } from 'react';
import { X, Plus, Check, ArrowRight, Search, BookOpen, BookMarked, Tablet, FileText, Video, Headphones, Link2, ExternalLink } from 'lucide-react';
import TimeInput from '../../lib/TimeInput.jsx';
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
// A topic you study over days and weeks: its materials, as many entries as you like, and its own reminder
const MAT_KINDS = [['bible', 'Bible', BookOpen], ['book', 'Book', BookMarked], ['ebook', 'eBook', Tablet], ['pdf', 'PDF', FileText], ['video', 'Video', Video], ['audio', 'Audio', Headphones], ['link', 'Link', Link2]];
const VERSIONS = ['KJV', 'NKJV', 'NIV', 'ESV', 'AMP', 'NLT', 'NASB', 'Other'];
const matKind = (k) => MAT_KINDS.find(x => x[0] === k) || MAT_KINDS[6];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function TopicReminder({ topicId, compact }) {
  const { l, act, toast } = useLife();
  const tr = (l.topicReminders || {})[topicId] || { on: false, days: [1, 3, 5], time: '20:00' };
  const set = (data, msg) => { act('TOPIC_REMIND', { id: topicId, data: { ...tr, ...data } }); msg && toast(msg); };
  return (
    <div className={'sw-remind' + (tr.on ? ' on' : '')}>
      <label className="sw-remind-h"><span><b>Remind me to study this</b>{!compact && <small>Optional. On the days and at the time you choose, with a heads-up before.</small>}</span>
        <input type="checkbox" role="switch" checked={!!tr.on} onChange={e => set({ on: e.target.checked }, e.target.checked ? 'Topic reminder on' : 'Topic reminder off')} /><i aria-hidden="true" /></label>
      {tr.on && <div className="sw-remind-b">
        <span className="st-days">{[1, 2, 3, 4, 5, 6, 0].map(d => <button key={d} type="button" className={(tr.days || []).includes(d) ? 'on' : ''} onClick={() => set({ days: (tr.days || []).includes(d) ? tr.days.filter(x => x !== d) : [...(tr.days || []), d] })}>{WD[d][0]}</button>)}</span>
        <TimeInput value={tr.time} onChange={e => set({ time: e.target.value })} aria-label="Study time" className="st-time" />
      </div>}
    </div>
  );
}

function Workspace({ cur, onBrowse }) {
  const { l, g, today, act, toast } = useLife();
  const mats = (l.studyMaterials || []).filter(x => x.topicId === cur.id);
  const entries = l.studyNotes.filter(x => x.topicId === cur.id).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const blank = { source: mats[0] ? mats[0].id : 'bible', part: '', passage: '', version: 'KJV', title: '', learned: '', scripture: '', apply: '', minutes: g.studyMinutes };
  const [n, setN] = useState(blank);
  const [m, setM] = useState({ kind: 'book', title: '', url: '' });
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const set = (k, v) => setN(x => ({ ...x, [k]: v }));
  const isBible = n.source === 'bible', isOther = n.source === 'other';
  const save = (e) => {
    e.preventDefault();
    const mat = mats.find(x => x.id === n.source);
    act('STUDY_NOTE', { data: { title: n.title.trim(), source: isBible ? 'bible' : isOther ? 'other' : 'material', materialId: mat?.id || '', part: isBible ? '' : n.part.trim(),
      passage: isBible ? n.passage.trim() : '', version: isBible ? n.version : '', learned: n.learned.trim(), scripture: n.scripture.trim(), apply: n.apply.trim(), minutes: Number(n.minutes) || 0 } });
    setN(x => ({ ...blank, source: x.source, version: x.version })); toast('Entry saved. Add another whenever you learn something new.');
  };
  const what = (x) => (x.source === 'bible' ? `${x.passage || 'Bible'}${x.version ? ` (${x.version})` : ''}` : x.materialId ? `${mats.find(y => y.id === x.materialId)?.title || 'A material'}${x.part ? `, ${x.part}` : ''}` : (x.part || ''));
  const shown = entries.filter(x => (!filter || (filter === 'bible' ? x.source === 'bible' : x.materialId === filter)) && (!q || `${x.title} ${x.learned} ${x.scripture} ${x.apply} ${what(x)}`.toLowerCase().includes(q.toLowerCase())));
  const days = new Set(entries.map(x => x.date)).size, mins = entries.reduce((s, x) => s + (Number(x.minutes) || 0), 0);
  const groups = []; shown.forEach(x => { const gg = groups[groups.length - 1]; if (gg && gg.d === x.date) gg.items.push(x); else groups.push({ d: x.date, items: [x] }); });
  return (
    <>
      <section className="card sw-head">
        <div className="sw-head-t"><small>Your study topic · day {Math.max(1, Math.round((new Date(today) - new Date(l.study.since)) / 86400000) + 1)}</small><h2>{cur.title}</h2>
          {topicGuide(cur) && <p>{topicGuide(cur)}</p>}
          {cur.refs?.length > 0 && <p className="sd-refs">{cur.refs.map(r => <span key={r}>{r}</span>)}</p>}</div>
        <div className="sw-head-n"><span><b>{entries.length}</b>entries</span><span><b>{days}</b>days</span><span><b>{hm(mins)}</b>studied</span></div>
      </section>
      <div className="cols">
        <div className="stack">
          <form className="card sw-new" onSubmit={save}>
            <div className="card-h"><h2>{entries.some(x => x.date === today) ? 'Something more from today' : 'What did you study today?'}</h2></div>
            <div className="sw-src" role="group" aria-label="What you studied">
              <button type="button" className={isBible ? 'on' : ''} onClick={() => set('source', 'bible')}><BookOpen size={15} />A Bible passage</button>
              {mats.map(x => { const [, , Ic] = matKind(x.kind); return <button key={x.id} type="button" className={n.source === x.id ? 'on' : ''} onClick={() => set('source', x.id)}><Ic size={15} />{x.title}</button>; })}
              <button type="button" className={isOther ? 'on' : ''} onClick={() => set('source', 'other')}><Plus size={15} />Something else</button>
            </div>
            <div className="fields">
              {isBible ? <>
                <div className="field"><label htmlFor="sw-p">Passage</label><input id="sw-p" value={n.passage} onChange={e => set('passage', e.target.value)} placeholder="John 10, or Psalm 23:1–6" /></div>
                <div className="field"><label>Version</label><span className="st-seg sw-vers">{VERSIONS.map(v => <button key={v} type="button" className={n.version === v ? 'on' : ''} onClick={() => set('version', v)}>{v}</button>)}</span></div>
              </> : <div className="field wide"><label htmlFor="sw-part">{isOther ? 'What you studied' : 'Which part'}</label><input id="sw-part" value={n.part} onChange={e => set('part', e.target.value)} placeholder={isOther ? 'A conversation, a sermon note…' : 'Chapters 2–3; pages 40–62; minutes 10–35'} /></div>}
              <div className="field wide"><label htmlFor="sw-t">A heading for this entry (optional)</label><input id="sw-t" value={n.title} onChange={e => set('title', e.target.value)} placeholder="The shepherd knows the sheep by name" /></div>
              <div className="field wide"><label htmlFor="sw-l">What did you learn?</label><textarea id="sw-l" value={n.learned} onChange={e => set('learned', e.target.value)} style={{ minHeight: 110 }} required /></div>
              <div className="field"><label htmlFor="sw-s">Which scripture shaped it?</label><input id="sw-s" value={n.scripture} onChange={e => set('scripture', e.target.value)} /></div>
              <div className="field"><label htmlFor="sw-m">Minutes</label><input id="sw-m" type="number" min="0" value={n.minutes} onChange={e => set('minutes', e.target.value)} /></div>
              <div className="field wide"><label htmlFor="sw-a">How will it change how you live or shepherd?</label><input id="sw-a" value={n.apply} onChange={e => set('apply', e.target.value)} /></div>
            </div>
            <div className="fr-foot"><button type="button" className="ghost sm" onClick={onBrowse}>Change topic</button><button className="primary" type="submit" disabled={!n.learned.trim()}><Check size={16} />Save entry</button></div>
          </form>
          <section className="card sw-entries">
            <div className="card-h"><h2>Your entries on {cur.title}</h2><span className="muted small">{entries.length}</span></div>
            {entries.length > 0 && <div className="sw-filter">
              <div className="j-search"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search these entries…" aria-label="Search entries" /></div>
              <div className="pr-chips">{[['', 'All'], ['bible', 'Bible'], ...mats.map(x => [x.id, x.title])].map(([v, t]) => { const k = v === '' ? entries.length : v === 'bible' ? entries.filter(x => x.source === 'bible').length : entries.filter(x => x.materialId === v).length; return <button key={v || 'all'} type="button" className={filter === v ? 'on' : ''} disabled={!k && v !== ''} onClick={() => setFilter(v)}>{t}<em>{k}</em></button>; })}</div>
            </div>}
            {shown.length === 0 ? <Empty title={entries.length ? 'Nothing matches.' : 'No entries yet.'}><p style={{ margin: 0 }}>Each time you study, write what you learned. Several entries a day is good: a chapter of a book, then a Bible chapter in another version.</p></Empty>
              : groups.map(gr => (
                <div key={gr.d} className="sw-day">
                  <h4>{fmtDate(gr.d, { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                  {gr.items.map(x => { const k = x.source === 'bible' ? 'bible' : x.materialId ? (mats.find(y => y.id === x.materialId)?.kind || 'link') : 'link'; const [, , Ic] = matKind(k); return (
                    <article key={x.id} className="sw-entry">
                      <p className="sw-what"><Ic size={14} />{what(x) || 'Study'}{x.minutes ? <span> · {x.minutes} min</span> : null}</p>
                      {x.title && <h5>{x.title}</h5>}
                      <blockquote>{x.learned}</blockquote>
                      {x.scripture && <p className="qf-do"><span>Scripture</span>{x.scripture}</p>}
                      {x.apply && <p className="qf-do"><span>I will</span>{x.apply}</p>}
                      <button type="button" className="iv-x sw-del" onClick={() => act('STUDY_NOTE_DELETE', { id: x.id })} aria-label="Delete entry"><X size={14} /></button>
                    </article>
                  ); })}
                </div>
              ))}
          </section>
        </div>
        <aside className="aside even">
          <section>
            <h3>Materials</h3>
            {mats.length ? <ul className="sw-mats">{mats.map(x => { const [, label, Ic] = matKind(x.kind); return (
              <li key={x.id}><span className="sw-mat-ic"><Ic size={16} /></span><span className="sw-mat-t"><b>{x.title}</b><small>{label}{entries.filter(y => y.materialId === x.id).length ? ` · ${entries.filter(y => y.materialId === x.id).length} entries` : ''}</small></span>
                {x.url && <a className="fq-ic" href={x.url} target="_blank" rel="noreferrer" aria-label={`Open ${x.title}`}><ExternalLink size={14} /></a>}
                <button type="button" className="iv-x" onClick={() => act('MATERIAL_DELETE', { id: x.id })} aria-label={`Remove ${x.title}`}><X size={14} /></button></li>
            ); })}</ul> : <p className="muted small" style={{ marginTop: 0 }}>The books, PDFs, videos and recordings you study this topic from.</p>}
            <form className="sw-addmat" onSubmit={e => { e.preventDefault(); act('MATERIAL_ADD', { data: { topicId: cur.id, kind: m.kind, title: m.title.trim(), url: m.url.trim() ? (/^[a-z]+:\/\//i.test(m.url.trim()) ? m.url.trim() : `https://${m.url.trim()}`) : '' } }); setM({ kind: m.kind, title: '', url: '' }); toast('Material added'); }}>
              <div className="sm-kinds">{MAT_KINDS.filter(([k]) => k !== 'bible').map(([k, l2, Ic]) => <button key={k} type="button" className={m.kind === k ? 'on' : ''} onClick={() => setM(x => ({ ...x, kind: k }))}><Ic size={14} />{l2}</button>)}</div>
              <input value={m.title} onChange={e => setM(x => ({ ...x, title: e.target.value }))} placeholder="Title: The Art of Shepherding" aria-label="Material title" />
              <input value={m.url} onChange={e => setM(x => ({ ...x, url: e.target.value }))} placeholder="Link (optional): Drive, YouTube, a PDF…" inputMode="url" aria-label="Link" />
              <button type="submit" className="sm" disabled={!m.title.trim()}><Plus size={14} />Add material</button>
            </form>
          </section>
          <section><TopicReminder topicId={cur.id} /></section>
          <section className="iv-fill">
            <h3>All your study</h3>
            <p className="muted small" style={{ marginTop: 0 }}>Every entry, from every topic, is in your Word journal, where you can filter by topic.</p>
            <a className="aside-link" href="#/word/journal">Open the journal<ArrowRight size={13} /></a>
          </section>
        </aside>
      </div>
    </>
  );
}

function Study() {
  const { l, g, today, act, toast } = useLife();
  const topics = allTopics(l);
  const cur = topicOf(l, l.study.current);
  const [open, setOpen] = useState(null);
  const [n, setN] = useState({ learned: '', scripture: '', apply: '', minutes: g.studyMinutes });
  const [custom, setCustom] = useState({ title: '', desc: '', remind: false, days: [1, 3, 5], time: '20:00' });
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
      <form className="card" onSubmit={(e) => { e.preventDefault(); act('TOPIC_ADD', { data: { title: custom.title.trim(), desc: custom.desc.trim(), ...(custom.remind ? { remind: { on: true, days: custom.days, time: custom.time } } : {}) } }); setCustom({ title: '', desc: '', remind: false, days: [1, 3, 5], time: '20:00' }); toast(custom.remind ? 'Topic added, with its reminder' : 'Topic added'); }}>
        <div className="card-h"><h2>Add your own topic</h2></div>
        <div className="fields"><div className="field"><label htmlFor="ct-t">Topic</label><input id="ct-t" value={custom.title} onChange={e => setCustom(x => ({ ...x, title: e.target.value }))} placeholder="Eschatology; the anointing; marriage" /></div>
          <div className="field"><label htmlFor="ct-d">Why it matters to you</label><input id="ct-d" value={custom.desc} onChange={e => setCustom(x => ({ ...x, desc: e.target.value }))} /></div></div>
        <div className={'sw-remind' + (custom.remind ? ' on' : '')}>
          <label className="sw-remind-h"><span><b>Remind me to study it</b><small>Optional. You can change it later on the topic.</small></span><input type="checkbox" role="switch" checked={custom.remind} onChange={e => setCustom(x => ({ ...x, remind: e.target.checked }))} /><i aria-hidden="true" /></label>
          {custom.remind && <div className="sw-remind-b"><span className="st-days">{[1, 2, 3, 4, 5, 6, 0].map(d => <button key={d} type="button" className={custom.days.includes(d) ? 'on' : ''} onClick={() => setCustom(x => ({ ...x, days: x.days.includes(d) ? x.days.filter(y => y !== d) : [...x.days, d] }))}>{WD[d][0]}</button>)}</span>
            <TimeInput value={custom.time} onChange={e => setCustom(x => ({ ...x, time: e.target.value }))} aria-label="Study time" className="st-time" /></div>}
        </div>
        <button className="sm" type="submit" disabled={!custom.title.trim()}><Plus size={14} />Add topic</button>
      </form>
    </>
  );
  if (!cur) return <><div className="card pray-cta"><div><b>Choose one topic to study</b><span>Stay with it over days and weeks, writing what you learn each time, until you choose to move on.</span></div></div>{library}</>;
  return (
    <>
      {browse ? <><div className="sw-back"><button type="button" className="sm" onClick={() => setBrowse(false)}><ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />Back to {cur.title}</button></div><div className="sd-library">{library}</div></>
        : <Workspace cur={cur} onBrowse={() => { setBrowse(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      {l.study.history.length > 0 && <section className="card sd-before"><div className="card-h"><h2>Studied before</h2></div>
        <ul className="sd-hist">{[...l.study.history].reverse().map((h, i) => <li key={i}><b>{topicOf(l, h.topicId)?.title || 'A topic'}</b><small>{fmtDate(h.from, { day: 'numeric', month: 'short' })} to {fmtDate(h.to, { day: 'numeric', month: 'short', year: 'numeric' })} · {notesFor(h.topicId)} notes</small></li>)}</ul></section>}
    </>
  );
}

// ── Journal: everything you learned from the Word and your study ──
const KINDS = [['', 'All'], ['plan', 'Bible plan'], ['own', 'Own reading'], ['study', 'Study']];
function Journal() {
  const { l, today, act } = useLife();
  const [kind, setKind] = useState('');
  const [topic, setTopic] = useState('');
  const [q, setQ] = useState('');
  const [sure, setSure] = useState(null);
  const studied = [...new Set(l.studyNotes.map(x => x.topicId))].map(id => [id, topicOf(l, id)?.title || 'A topic']);
  const entries = [
    ...l.bible.map(b => ({ id: b.id, date: b.date, kind: b.plan === false ? 'own' : 'plan', what: range(b), text: b.learned || b.note || '', del: () => act('BIBLE_DELETE', { id: b.id }) })),
    ...l.studyNotes.map(x => ({ id: x.id, date: x.date, kind: 'study', topicId: x.topicId, what: `${topicOf(l, x.topicId)?.title || 'Study'}${x.title ? `: ${x.title}` : ''}${x.passage ? ` · ${x.passage}${x.version ? ` (${x.version})` : ''}` : x.part ? ` · ${x.part}` : ''}`, text: x.learned, scripture: x.scripture, apply: x.apply, minutes: x.minutes, del: () => act('STUDY_NOTE_DELETE', { id: x.id }) })),
  ].filter(e => (!kind || e.kind === kind) && (!topic || e.topicId === topic) && (!q || `${e.what} ${e.text} ${e.scripture || ''} ${e.apply || ''}`.toLowerCase().includes(q.toLowerCase())))
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
        <div className="jw-kinds" role="group" aria-label="Show">{KINDS.map(([id, t]) => <button key={id} type="button" className={kind === id ? 'on' : ''} onClick={() => { setKind(id); if (id !== 'study') setTopic(''); }}>{t}</button>)}</div>
      </div>
      {kind === 'study' && studied.length > 0 && <div className="pr-chips jw-topics" role="group" aria-label="Topic">{[['', 'Every topic'], ...studied].map(([id, t]) => <button key={id || 'all'} type="button" className={topic === id ? 'on' : ''} onClick={() => setTopic(id)}>{t}<em>{id ? l.studyNotes.filter(x => x.topicId === id).length : l.studyNotes.length}</em></button>)}</div>}
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
