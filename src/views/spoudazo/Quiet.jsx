import { useState } from 'react';
import { Search, Plus, X, ArrowRight } from 'lucide-react';
import { lifeStats, nextChapter, topicOf, streaks, planPosition } from '../../store/life';
import { QUALITIES, ESSENTIALS, BIBLE_CHAPTERS } from '../../data/spoudazo';
import { Head, Seg, TitleBlock, Empty, fmtDate } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useLife } from './common.jsx';

// The flow of a quiet time: not steps to tick, just the way it goes
const FLOW = [
  ['Pray', 'Thank Him, and ask Him to speak to you.'],
  ['Read', 'Slowly, expecting God to speak.'],
  ['Meditate', 'Stop where a verse stops you. Think it through.'],
  ['Receive', 'Write down what He tells you, and what you will do.'],
];

// What you can sit with this morning, joined to what is already running in your life
function sources(l) {
  const nc = nextChapter(l);
  const topic = topicOf(l, l.study.current);
  const book = l.books.find(b => b.status === 'reading' && b.for !== 'members');
  return [
    { id: 'bible', k: 'Your Bible reading', v: `${nc.book} ${nc.chapter}`, note: 'Continue where you stopped. It will be marked read.', passage: `${nc.book} ${nc.chapter}`, nc },
    topic && { id: 'study', k: 'Your study', v: topic.title, note: 'Meditate on a verse from your topic', ref: topic.id },
    book && { id: 'book', k: 'Your book', v: book.title, note: book.author ? `by ${book.author}` : 'With the Scriptures it opens', ref: book.id },
    { id: 'other', k: 'Something else', v: 'A passage God puts on your heart', note: '' },
  ].filter(Boolean);
}
const srcLabel = { bible: 'Bible reading', study: 'Study', book: 'Book', other: '' };

// This morning: choose what you sit with, flow with God, write what He said
function Morning() {
  const { l, today, act, toast } = useLife();
  const kept = l.quietTimes.filter(q => q.date === today);
  const list = sources(l);
  const remembered = (l.qtPlan || {}).mode;
  const [again, setAgain] = useState(false);
  const [src, setSrc] = useState(list.some(x => x.id === remembered) ? remembered : 'bible');
  const [f, setF] = useState({ passage: '', heard: '', apply: '', minutes: l.goals.quietMinutes });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const cur = list.find(x => x.id === src) || list[0];
  const passage = cur.id === 'bible' ? cur.passage : f.passage.trim();
  const save = () => {
    act('QUIET_ADD', { data: { start: new Date().toTimeString().slice(0, 5), minutes: Number(f.minutes) || 0, source: cur.id, sourceRef: cur.ref || '', sourceTitle: cur.id === 'study' || cur.id === 'book' ? cur.v : '', passage, heard: f.heard.trim(), apply: f.apply.trim() } });
    if (cur.id === 'bible') act('BIBLE_ADD', { data: { book: cur.nc.book, from: cur.nc.chapter, to: cur.nc.chapter } });
    act('QT_PLAN', { data: { mode: cur.id } });
    toast(cur.id === 'bible' ? `Quiet time kept, and ${cur.passage} marked read` : 'Quiet time kept');
    setAgain(false); setF(x => ({ ...x, passage: '', heard: '', apply: '' }));
  };
  const last = kept[kept.length - 1];
  return (
    <div className="cols">
      <div className="stack">
        {last && !again ? (
          <section className="card qf qf-kept">
            <div className="card-h"><h2>Kept this morning</h2><span className="pill good">{last.start ? `${last.start} · ` : ''}{last.minutes ? `${last.minutes} min` : 'Kept'}</span></div>
            {(last.passage || last.sourceTitle) && <p className="qf-what">{[srcLabel[last.source], last.sourceTitle, last.passage].filter(Boolean).join(' · ')}</p>}
            {(last.heard || last.learned) && <blockquote className="qf-word">{last.heard || last.learned}</blockquote>}
            {last.apply && <p className="qf-do"><span>I will</span>{last.apply}</p>}
            <div className="qf-foot"><span className="muted small">Carry His word with you today.</span><button type="button" onClick={() => setAgain(true)}>Another time with God</button></div>
          </section>
        ) : null}
        {last && !again && (
          <section className="card qf qf-tomorrow">
            <div className="card-h"><h2>Tomorrow morning</h2><span className="muted small">What is waiting for you</span></div>
            <ul className="qf-wait">{list.filter(x => x.id !== 'other').map(x => (
              <li key={x.id} className={x.id === 'bible' ? 'main' : ''}><small>{x.k}</small><b>{x.v}</b>{x.id === 'bible' && <em>Continue where you stopped</em>}</li>
            ))}</ul>
            <ol className="qf-flow">{FLOW.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ol>
          </section>
        )}
        {(!last || again) && (
          <section className="card qf">
            <div className="card-h"><h2>{kept.length ? 'Another time with God' : 'Your quiet time'}</h2>{again && <button type="button" className="ghost sm" onClick={() => setAgain(false)}>Cancel</button>}</div>

            <h4 className="qf-h">What will you sit with today?</h4>
            <div className="qf-src" role="radiogroup" aria-label="What you will sit with">{list.map(x => (
              <button key={x.id} type="button" role="radio" aria-checked={src === x.id} className={src === x.id ? 'on' : ''} onClick={() => setSrc(x.id)}>
                <span className="qf-dot" aria-hidden="true" />
                <span className="qf-t"><small>{x.k}</small><b>{x.v}</b>{x.note && <em>{x.note}</em>}</span>
              </button>
            ))}</div>
            {cur.id !== 'bible' && <div className="field"><label htmlFor="q-pass">{cur.id === 'other' ? 'The passage' : 'The verse or passage'}</label><input id="q-pass" value={f.passage} onChange={e => set('passage', e.target.value)} placeholder="Psalm 23" /></div>}

            <ol className="qf-flow">{FLOW.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ol>
            <p className="qf-verse">“Open thou mine eyes, that I may behold wondrous things out of thy law.” <cite>Psalm 119:18</cite></p>

            <div className="field"><label htmlFor="q-heard">What God told me</label><textarea id="q-heard" value={f.heard} onChange={e => set('heard', e.target.value)} style={{ minHeight: 130 }} placeholder="The word He gave you this morning" /></div>
            <div className="field"><label htmlFor="q-apply">What I will do</label><input id="q-apply" value={f.apply} onChange={e => set('apply', e.target.value)} placeholder="His instruction for today" /></div>
            <div className="qf-foot">
              <label className="qf-min">I spent <input type="number" min="1" value={f.minutes} onChange={e => set('minutes', e.target.value)} aria-label="Minutes" /> minutes</label>
              <button type="button" className="primary" disabled={!f.heard.trim()} onClick={save}>Keep this quiet time</button>
            </div>
          </section>
        )}
      </div>
      <QuietAside />
    </div>
  );
}

const pad = (n) => String(n).padStart(2, '0');
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// The month as a calendar, with the mornings you kept
function MonthDays({ l, today }) {
  const y = +today.slice(0, 4), m = +today.slice(5, 7) - 1;
  const n = new Date(y, m + 1, 0).getDate();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const kept = new Set(l.quietTimes.map(q => q.date));
  const cells = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => `${y}-${pad(m + 1)}-${pad(i + 1)}`)];
  return (
    <div className="qm">
      {WEEKDAYS.map((d, i) => <b key={i}>{d}</b>)}
      {cells.map((d, i) => d ? <span key={d} title={fmtDate(d)} className={(kept.has(d) ? 'on' : d < today ? 'miss' : 'ahead') + (d === today ? ' today' : '')}>{+d.slice(8)}</span> : <span key={'x' + i} className="qm-pad" />)}
    </div>
  );
}

function QuietAside() {
  const { l, g, today } = useLife();
  const st = streaks(l.quietTimes.map(q => q.date), today);
  const month = today.slice(0, 7);
  const elapsed = +today.slice(8);
  const keptMonth = new Set(l.quietTimes.filter(q => q.date.startsWith(month)).map(q => q.date)).size;
  const total = new Set(l.quietTimes.map(q => q.date)).size;
  const nc = nextChapter(l);
  const pos = planPosition(l);
  const pct = Math.round((pos / BIBLE_CHAPTERS) * 100);
  return (
    <aside className="aside even">
      <section>
        <h3>Your streak</h3>
        <div className="qs-row">
          <div className="qs-now"><b>{st.current}</b><span>{st.current === 1 ? 'morning' : 'mornings'} in a row</span></div>
          <dl className="qs-dl">
            <div><dt>Best streak</dt><dd>{st.best}</dd></div>
            <div><dt>This month</dt><dd>{keptMonth} of {elapsed}</dd></div>
            <div><dt>All mornings</dt><dd>{total}</dd></div>
          </dl>
        </div>
      </section>
      <section>
        <h3>{new Date(today + 'T12:00:00').toLocaleDateString('en-GB', { month: 'long' })}</h3>
        <MonthDays l={l} today={today} />
      </section>
      <section>
        <h3>Your Bible plan</h3>
        <div className="qb-big"><b>{pct}%</b><span>next: {nc.book} {nc.chapter} · {g.chaptersPerDay} a day</span></div>
        <span className="ch-bar"><i style={{ width: `${pct}%` }} /></span>
        <a className="aside-link" href="#/word">Your Bible reading<ArrowRight size={13} /></a>
      </section>
    </aside>
  );
}

// The journal: month by month, the word God gave each morning
function Journal() {
  const { l, act } = useLife();
  const [q, setQ] = useState('');
  const [sure, setSure] = useState(null);
  const text = (x) => [x.passage, x.sourceTitle, x.heard, x.learned, x.apply, x.prayed].join(' ');
  const list = [...l.quietTimes].filter(x => !q || text(x).toLowerCase().includes(q.toLowerCase())).sort((a, b) => (b.date + (b.start || '')).localeCompare(a.date + (a.start || '')));
  const months = [];
  list.forEach(x => { const k = x.date.slice(0, 7); const g = months[months.length - 1]; if (g && g.k === k) g.items.push(x); else months.push({ k, items: [x] }); });
  const words = l.quietTimes.filter(x => x.heard || x.learned).length;
  return (
    <div className="stack">
      <div className="jr-bar">
        <div className="j-search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search what God has shown you…" aria-label="Search the journal" /></div>
        <span className="jr-count"><b>{l.quietTimes.length}</b> mornings · <b>{words}</b> words from God</span>
      </div>
      {list.length === 0 && <div className="card"><Empty title={q ? 'Nothing matches.' : 'No quiet times recorded yet.'} /></div>}
      {months.map(({ k, items }) => (
        <section key={k} className="card jr-month">
          <div className="card-h"><h2>{new Date(k + '-15T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2><span className="muted small">{(n => `${n} ${n === 1 ? 'morning' : 'mornings'}`)(new Set(items.map(x => x.date)).size)}</span></div>
          <ol className="jr-list">{items.map(x => (
            <li key={x.id}>
              <div className="jr-date"><b>{+x.date.slice(8)}</b><small>{new Date(x.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</small></div>
              <div className="jr-body">
                <p className="jr-what">{[srcLabel[x.source], x.sourceTitle, x.passage].filter(Boolean).join(' · ') || 'Quiet time'}{x.minutes ? <span> · {x.minutes} min</span> : null}</p>
                {(x.heard || x.learned) && <blockquote>{x.heard || x.learned}</blockquote>}
                {x.apply && <p className="qf-do"><span>I will</span>{x.apply}</p>}
              </div>
              <div className="jr-del">{sure === x.id
                ? <><button className="sm" onClick={() => { act('QUIET_DELETE', { id: x.id }); setSure(null); }}>Delete</button><button className="ghost sm" onClick={() => setSure(null)}>Keep</button></>
                : <button className="ghost sm" onClick={() => setSure(x.id)} aria-label="Delete entry"><X size={14} /></button>}</div>
            </li>
          ))}</ol>
        </section>
      ))}
    </div>
  );
}

// Character is examined once a month, on the month's last day
export function examWindow(today, exams) {
  const y = +today.slice(0, 4), m = +today.slice(5, 7) - 1;
  const last = `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`;
  const open = today === last || exams.length === 0;
  const daysTo = Math.round((new Date(last) - new Date(today)) / 86400000);
  return { last, open, daysTo, first: exams.length === 0 };
}

const ALL_QUALITIES = [...ESSENTIALS, ...QUALITIES];
const LEVEL = ['Not rated', 'Far off', 'Beginning', 'Growing', 'Mostly true', 'True of me'];
const avg = (ratings, keys) => { const v = keys.map(k => ratings?.[k] || 0).filter(Boolean); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };

// Five dots: how true this is of you, before God
function Dots({ value, onChange, label, locked }) {
  return (
    <span className={'cq-dots' + (locked ? ' locked' : '')} role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} of 5, ${LEVEL[n]}`} title={LEVEL[n]}
          className={n <= value ? 'on' : ''} disabled={locked} onClick={() => onChange(value === n ? 0 : n)} />
      ))}
    </span>
  );
}

function QualityList({ keys, r, setR, start = 1, locked }) {
  return (
    <ol className="cq-list">{keys.map((k, i) => (
      <li key={k}>
        <span className="cq-n">{start + i}</span>
        <span className="cq-name">{k}<small>{LEVEL[r[k] || 0]}</small></span>
        <Dots value={r[k] || 0} label={k} locked={locked} onChange={v => setR(x => ({ ...x, [k]: v }))} />
      </li>
    ))}</ol>
  );
}

function Character() {
  const { l, today, act, toast } = useLife();
  const exams = l.character;
  const win = examWindow(today, exams);
  const mine = exams.find(e => e.date === today);
  const last = exams[exams.length - 1];
  const prev = mine ? exams[exams.length - 2] : last && exams[exams.length - 2];
  const [r, setR] = useState(() => Object.fromEntries(ALL_QUALITIES.map(k => [k, last?.ratings?.[k] || 0])));
  const [note, setNote] = useState(mine?.note || '');
  const [commit, setCommit] = useState(mine?.commit || '');
  const locked = !win.open;
  const rated = ALL_QUALITIES.filter(k => r[k]).length;
  const ranked = last ? ALL_QUALITIES.filter(k => last.ratings?.[k]).sort((a, b) => last.ratings[b] - last.ratings[a]) : [];
  const groups = [['The fifteen essentials', ESSENTIALS], ['1 Timothy 3:2–7', QUALITIES]];
  const save = () => {
    const data = { ratings: r, note: note.trim(), commit: commit.trim() };
    if (mine) { act('CHARACTER_UPDATE', { id: mine.id, data }); toast('Examination updated'); }
    else { act('CHARACTER_ADD', { data }); toast('Examination saved'); }
  };
  const lastDay = fmtDate(win.last, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="ch">
      <p className={'ch-window' + (locked ? '' : ' open')}>
        {locked ? <><b>Examined once a month.</b> Your character opens again on {lastDay}, in {win.daysTo} {win.daysTo === 1 ? 'day' : 'days'}. Until then, live by what you saw.</>
          : win.first && !mine ? <><b>Your first examination.</b> After this, it opens on the last day of each month.</>
          : <><b>Today is examination day.</b> Rate yourself honestly before God. You can change it until midnight.</>}
      </p>
      <div className="ch-grid">
        <section className="card ch-card">
          <div className="card-h"><h2>The fifteen essentials of a shepherd</h2></div>
          <p className="ch-src">From Bishop Dag Heward-Mills, <i>What It Means to Become a Shepherd</i></p>
          <QualityList keys={ESSENTIALS} r={r} setR={setR} locked={locked} />
        </section>
        <div className="ch-side">
          <section className="card ch-card">
            <div className="card-h"><h2>The overseer</h2><span className="muted small">1 Timothy 3:2–7</span></div>
            <p className="ch-verse">“A bishop then must be blameless, the husband of one wife, vigilant, sober, of good behaviour, given to hospitality, apt to teach.” <cite>1 Timothy 3:2</cite></p>
            <QualityList keys={QUALITIES} r={r} setR={setR} locked={locked} />
          </section>
          <section className="card ch-card ch-before">
            <div className="card-h"><h2>Before God</h2><span className="muted small">{locked ? (last ? `Examined ${fmtDate(last.date, { day: 'numeric', month: 'long' })}` : '') : `${rated} of ${ALL_QUALITIES.length} rated`}</span></div>
            {locked ? <>
              <dl className="ch-said">
                <div><dt>Where God is dealing with me</dt><dd>{last?.note || '—'}</dd></div>
                <div><dt>The one thing I will change</dt><dd>{last?.commit || '—'}</dd></div>
              </dl>
              <div className="ch-save"><span className="muted small">Next examination</span><b className="ch-next">{lastDay}</b></div>
            </> : <>
              <div className="field"><label htmlFor="ch-note">Where is God dealing with me?</label><textarea id="ch-note" value={note} onChange={e => setNote(e.target.value)} style={{ minHeight: 80 }} /></div>
              <div className="field"><label htmlFor="ch-commit">One thing I will change</label><input id="ch-commit" value={commit} onChange={e => setCommit(e.target.value)} /></div>
              <div className="ch-save"><span className="muted small">{mine ? 'Saved today. You can still change it.' : 'Once a month, on its last day'}</span>
                <button className="primary" disabled={!rated && !note.trim() && !commit.trim()} onClick={save}>{mine ? 'Update examination' : 'Save examination'}</button></div>
            </>}
          </section>
        </div>
      </div>

      <div className="ch-band two">
        <section className="card ch-card">
          <div className="card-h"><h2>Where you stand</h2></div>
          {!last ? <p className="muted small">Save your first examination to see where you stand.</p> : <>
            <ul className="ch-avg">{groups.map(([t, keys]) => { const a = avg(last.ratings, keys), b = prev && prev !== last ? avg(prev.ratings, keys) : 0; return (
              <li key={t}><span>{t}</span><b>{a ? a.toFixed(1) : '–'}<small> of 5</small></b>
                <span className="ch-bar"><i style={{ width: `${a * 20}%` }} /></span>
                {a && b ? (() => { const d = Math.round((a - b) * 10) / 10; return <em className={d >= 0 ? 'up' : 'down'}>{d === 0 ? 'Same as last month' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} since last month`}</em>; })() : null}</li>
            ); })}</ul>
            {ranked.length > 2 && <div className="ch-sw">
              <div><h4>Growing</h4><ul>{ranked.slice(0, 3).map(k => <li key={k}>{k}</li>)}</ul></div>
              <div><h4>Give attention to</h4><ul>{ranked.slice(-3).reverse().map(k => <li key={k}>{k}</li>)}</ul></div>
            </div>}
          </>}
        </section>
        <section className="card ch-card">
          <div className="card-h"><h2>Month by month</h2><span className="muted small">{exams.length} {exams.length === 1 ? 'examination' : 'examinations'}</span></div>
          {exams.length === 0 ? <p className="muted small">None yet.</p> : (
            <ul className="ch-hist">{[...exams].reverse().slice(0, 6).map(c => (
              <li key={c.id}><small>{new Date(c.date + 'T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</small><b>{c.commit || 'Examined before God'}</b>{c.note && <span>{c.note}</span>}</li>
            ))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}

const TABS = [['', 'This morning'], ['journal', 'Journal'], ['character', 'Character']];
export default function Quiet({ tab = '' }) {
  const { state, l, today } = useLife();
  const win = examWindow(today, l.character);
  const t = TABS.some(([id]) => id === tab) ? tab : '';
  const st = lifeStats(state, today);
  return (
    <>
      <Head eyebrow="Spoudazō" step="Quiet time" title={{ '': 'Alone with God', journal: 'Your quiet time journal', character: 'Character and consecration' }[t]}
        sub={{ '': 'Pray, read, meditate, and receive what God is saying to you. Every morning.', journal: 'Everything God has shown you, morning by morning.', character: 'Once a month, on its last day, examine yourself before God: the fifteen essentials of a shepherd, and the overseer of 1 Timothy 3.' }[t]}>
        <TitleBlock items={t === 'character' ? [['Next examination', win.daysTo === 0 ? 'Today' : fmtDate(win.last, { day: 'numeric', month: 'short' })], ['Examinations', l.character.length]] : [['Mornings in a row', st.quietStreak], ['This week', `${st.quiet7} / 7`]]} />
      </Head>
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('quiet', ...(v ? [v] : []))} options={TABS} /></div>
      {t === '' && <Morning />}
      {t === 'journal' && <Journal />}
      {t === 'character' && <Character />}
    </>
  );
}
