import { useState, useEffect } from 'react';
import { Plus, Search, ArrowRight, Trash2, FileText, Youtube, Headphones, Video, Link2, Mic, PenLine, Play, Pause, RotateCcw, Minus, ExternalLink, X } from 'lucide-react';
import { SERMON_STAGES, SERMON_PLAN, MEETING_TYPES } from '../../data/ministry';
import { sermonPlan, addDays, weekdayOf, daysBetween } from '../../store/ministry';
import { Head, Empty, Bar, fmtDate, useToast } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useM } from './common.jsx';

// The Thursday that matters now: today if it is Thursday, otherwise the next one. From Friday, that is next week's.
const nextThursday = (today) => { let d = today; while (weekdayOf(d) !== MEETING_TYPES[0].weekday) d = addDays(d, 1); return d; };
const preached = (s) => (s.stage || 0) >= 6;
const readyPct = (s) => Math.round((Object.keys(s.stagesDone || {}).length / (SERMON_STAGES.length - 1)) * 100);
const when = (date, today) => { const n = daysBetween(today, date); return n === 0 ? 'Tonight' : n === 1 ? 'Tomorrow' : n > 1 ? `In ${n} days` : n === -1 ? 'Yesterday' : `${-n} days ago`; };

// Materials: the PDF outline, a YouTube link, audio or video sent to you, or any other link
const KINDS = [['pdf', 'PDF outline', FileText], ['youtube', 'YouTube', Youtube], ['audio', 'Audio', Headphones], ['video', 'Video', Video], ['link', 'Other', Link2]];
const guessKind = (url) => /youtu\.?be/i.test(url) ? 'youtube' : /\.pdf(\?|$)/i.test(url) ? 'pdf' : /\.(mp3|m4a|wav|aac|ogg)(\?|$)/i.test(url) ? 'audio' : /\.(mp4|mov|webm)(\?|$)/i.test(url) ? 'video' : 'link';
const kindOf = (a) => KINDS.find(k => k[0] === (a.kind || guessKind(a.url))) || KINDS[4];
const ytId = (url) => (url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
const fixUrl = (u) => /^[a-z]+:\/\//i.test(u) ? u : `https://${u}`;

function Materials({ s }) {
  const { updateSermon } = useM();
  const toast = useToast();
  const [a, setA] = useState({ kind: '', name: '', url: '' });
  const list = s.attachments || [];
  const kind = a.kind || (a.url ? guessKind(a.url) : 'pdf');
  const add = (e) => {
    e.preventDefault();
    if (!a.url.trim()) return;
    const K = KINDS.find(k => k[0] === kind);
    updateSermon(s.id, { attachments: [...list, { kind, name: a.name.trim() || K[1], url: fixUrl(a.url.trim()) }] });
    setA({ kind: '', name: '', url: '' }); toast('Material attached');
  };
  return (
    <section className="card sm-mat">
      <div className="card-h"><h2>Materials</h2><span className="muted small">What they sent you to prepare with</span></div>
      {list.length > 0 && <ul className="sm-files">{list.map((x, i) => {
        const [, label, Ic] = kindOf(x); const yt = kindOf(x)[0] === 'youtube' && ytId(x.url);
        return (
          <li key={i} className={'k-' + kindOf(x)[0]}>
            {yt ? <a className="sm-thumb" href={x.url} target="_blank" rel="noreferrer"><img src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`} alt="" /><span><Play size={16} /></span></a> : <span className="sm-fic"><Ic size={18} /></span>}
            <span className="sm-ft"><b>{x.name || label}</b><small>{label}</small>
              {kindOf(x)[0] === 'audio' && <audio controls preload="none" src={x.url} />}
            </span>
            <a className="btn sm" href={x.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Open</a>
            <button type="button" className="ghost sm" onClick={() => updateSermon(s.id, { attachments: list.filter((_, j) => j !== i) })} aria-label="Remove"><X size={14} /></button>
          </li>
        );
      })}</ul>}
      <form className="sm-add" onSubmit={add}>
        <div className="sm-kinds" role="group" aria-label="Kind">{KINDS.map(([k, l, Ic]) => <button key={k} type="button" className={kind === k ? 'on' : ''} onClick={() => setA(x => ({ ...x, kind: k }))}><Ic size={14} />{l}</button>)}</div>
        <div className="sm-add-row">
          <input value={a.url} onChange={e => setA(x => ({ ...x, url: e.target.value }))} placeholder="Paste the link (Drive, YouTube, WhatsApp file…)" inputMode="url" aria-label="Link" />
          <input value={a.name} onChange={e => setA(x => ({ ...x, name: e.target.value }))} placeholder="Name (optional)" aria-label="Name" />
          <button type="submit" className="primary" disabled={!a.url.trim()}><Plus size={16} />Attach</button>
        </div>
      </form>
      {!list.length && <p className="muted small" style={{ margin: '10px 0 0' }}>When the outline, the recording or the video arrives, paste its link here. The files stay where they are.</p>}
    </section>
  );
}

const SECTIONS = [['outline', 'Main points', '1. …\n2. …\n3. …'], ['notes', 'Study notes', ''], ['illustrations', 'Illustrations', ''], ['application', 'Application', 'Specific and concrete'], ['prayerPoints', 'Prayer points', '']];

// Preaching: the message on one clean page, large enough to read from, with a clock
function Preach({ s }) {
  const [size, setSize] = useState(() => { try { return Number(localStorage.getItem('preach-size')) || 1.25; } catch { return 1.25; } });
  const [run, setRun] = useState(false);
  const [secs, setSecs] = useState(0);
  useEffect(() => { try { localStorage.setItem('preach-size', String(size)); } catch { /* not stored */ } }, [size]);
  useEffect(() => { if (!run) return; const t = setInterval(() => setSecs(x => x + 1), 1000); return () => clearInterval(t); }, [run]);
  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const lines = (t) => (t || '').split('\n').map(x => x.trim()).filter(Boolean);
  const filled = SECTIONS.filter(([k]) => (s[k] || '').trim());
  const scr = (s.scriptures || '').split(/[;\n]/).map(x => x.trim()).filter(Boolean);
  return (
    <div className="pc-wrap">
      <div className="pc-bar">
        <a className="btn sm ghost" href={`#/poimaino/sermons/${s.id}`}><PenLine size={15} />Back to preparing</a>
        <span className="grow" />
        <span className="pc-clock"><b>{mm}</b>
          <button type="button" className="pc-ic" onClick={() => setRun(!run)} aria-label={run ? 'Pause' : 'Start'}>{run ? <Pause size={16} /> : <Play size={16} />}</button>
          <button type="button" className="pc-ic" onClick={() => { setRun(false); setSecs(0); }} aria-label="Reset"><RotateCcw size={15} /></button>
        </span>
        <span className="pc-size"><button type="button" className="pc-ic" onClick={() => setSize(x => Math.max(1, +(x - 0.125).toFixed(3)))} aria-label="Smaller text"><Minus size={15} /></button><span>Aa</span><button type="button" className="pc-ic" onClick={() => setSize(x => Math.min(2, +(x + 0.125).toFixed(3)))} aria-label="Larger text"><Plus size={15} /></button></span>
      </div>
      <article className="pc-paper" style={{ '--pc': `${size}rem` }}>
        <small className="pc-date">{s.date ? fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Thursday Bible study'}</small>
        <h1>{s.title || 'Untitled'}</h1>
        {scr.length > 0 && <div className="pc-scr">{scr.map(x => <span key={x}>{x}</span>)}</div>}
        {filled.length === 0 && <p className="pc-none">Nothing written yet. Go back to preparing and fill in the main points.</p>}
        {filled.map(([k, l]) => (
          <section key={k} className={'pc-sec ' + k}>
            <h2>{l}</h2>
            {k === 'outline' ? <ol className="pc-points">{lines(s[k]).map((x, i) => <li key={i}>{x.replace(/^\d+[.)]\s*/, '')}</li>)}</ol>
              : lines(s[k]).map((x, i) => <p key={i}>{x}</p>)}
          </section>
        ))}
      </article>
    </div>
  );
}

// One field of the message, saved when you leave it. Kept outside the page so typing survives a re-render.
function F({ s, k, label, area, ph }) {
  const { updateSermon } = useM();
  const save = (e) => e.target.value !== (s[k] || '') && updateSermon(s.id, { [k]: e.target.value });
  return (
    <div className={'field' + (area ? ' wide' : '')}><label>{label}</label>
      {area ? <textarea defaultValue={s[k] || ''} placeholder={ph} onBlur={save} style={{ minHeight: 90 }} /> : <input defaultValue={s[k] || ''} placeholder={ph} onBlur={save} />}
    </div>
  );
}

function SermonPage({ id, mode }) {
  const { m, today, updateSermon, sermonStage, deleteSermon, addFollow } = useM();
  const toast = useToast();
  const s = m.sermons.find(x => x.id === id);
  const [confirm, setConfirm] = useState(false);
  const [fu, setFu] = useState('');
  if (!s) return <div className="card"><Empty title="That sermon isn’t here." action={<a className="btn" href="#/poimaino/sermons">Back</a>} /></div>;
  if (mode === 'preach') return <Preach s={s} />;
  const plan = sermonPlan(m, today).filter(x => x.sermonId === s.id);
  const pct = readyPct(s);
  return (
    <>
      <Head back={{ href: '#/poimaino/sermons', label: 'Sermons' }} eyebrow="Thursday Bible study" step={s.date ? `${fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${when(s.date, today)}` : 'No date'} title={s.title || 'Untitled'}
        sub={`${SERMON_STAGES[s.stage || 0]}${s.received ? ` · material received ${fmtDate(s.received)}` : ' · material not received yet'}`}>
        <div className="head-actions"><a className="btn primary" href={`#/poimaino/sermons/${s.id}/preach`}><Mic size={16} />Preach from it</a></div>
      </Head>
      <div className="cols">
        <div className="stack">
          <Materials s={s} />
          <div className="card">
            <div className="card-h"><h2>The message</h2><span className="muted small">This is what you will see when you preach</span></div>
            <div className="fields">
              <F s={s} k="title" label="Title" />
              <div className="field"><label>Thursday</label><input type="date" defaultValue={s.date} onBlur={e => updateSermon(s.id, { date: e.target.value })} /></div>
              <F s={s} k="scriptures" label="Scriptures (KJV)" ph="John 10:1–18; Psalm 23" />
              <F s={s} k="source" label="Source" ph="From the bacenta material, week 12" />
              {SECTIONS.map(([k, l, ph]) => <F key={k} s={s} k={k} label={l} area ph={ph} />)}
            </div>
          </div>
          <div className="card">
            <div className="card-h"><h2>Reflection after preaching</h2></div>
            <textarea defaultValue={s.reflection || ''} onBlur={e => updateSermon(s.id, { reflection: e.target.value })} placeholder="What connected, questions people asked, what to teach next…" />
            <div className="pa-form" style={{ marginTop: 10 }}>
              <label>Create a follow-up from this<input value={fu} onChange={e => setFu(e.target.value)} placeholder="Answer Grace’s question about baptism" /></label>
              <button className="sm" disabled={!fu.trim()} onClick={() => { addFollow({ kind: 'conversation', title: fu.trim(), due: addDays(today, 3), sermonId: s.id }); setFu(''); toast('Follow-up added to the queue'); }}>Add</button>
            </div>
          </div>
        </div>
        <aside className="aside even">
          <section>
            <h3>Preparation</h3>
            <div className="sm-pct"><b>{pct}%</b><span>ready</span></div>
            <Bar pct={pct} />
            <ul className="stage-list sm-stages">
              <li className={s.received ? 'done' : ''}>
                <label className="toggle"><input type="checkbox" checked={!!s.received} onChange={e => updateSermon(s.id, { received: e.target.checked ? today : '' })} />Material received</label>
                {s.received && <small>{fmtDate(s.received, { weekday: 'short', day: 'numeric' })}</small>}
              </li>
              {SERMON_STAGES.slice(1).map((label, i) => {
                const n = i + 1;
                const p = plan.find(x => x.stage === n);
                return (
                  <li key={label} className={s.stagesDone?.[n] ? 'done' : p?.status === 'due' ? 'due' : ''}>
                    <label className="toggle"><input type="checkbox" checked={!!s.stagesDone?.[n]} onChange={e => sermonStage(s.id, n, e.target.checked)} />{label}</label>
                    <small>{s.stagesDone?.[n] ? fmtDate(s.stagesDone[n], { weekday: 'short', day: 'numeric' }) : p ? (p.status === 'waiting' ? 'waiting' : fmtDate(p.date, { weekday: 'short' })) : ''}</small>
                  </li>
                );
              })}
            </ul>
            <p className="muted small" style={{ margin: '10px 0 0' }}>If the material comes late, the plan moves with it. Nothing is marked failed.</p>
          </section>
          <section>
            <button className={'danger sm' + (confirm ? ' solid' : '')} onClick={() => { if (confirm) { deleteSermon(s.id); go('poimaino', 'sermons'); } else setConfirm(true); }}><Trash2 size={14} />{confirm ? 'Tap again to delete' : 'Delete this sermon'}</button>
          </section>
        </aside>
      </div>
    </>
  );
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Sermons({ sub, mode }) {
  const { m, today, addSermon } = useM();
  const toast = useToast();
  const [q, setQ] = useState('');
  if (sub) return <SermonPage id={sub} mode={mode} />;
  const thu = nextThursday(today);
  const next = m.sermons.find(s => s.date === thu);
  const others = m.sermons.filter(s => s !== next);
  const list = others.filter(s => !q || `${s.title} ${s.scriptures} ${s.outline} ${s.notes}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const create = (received) => {
    const id = `ser-${Date.now()}`;
    addSermon({ id, title: '', date: thu, received: received ? today : '' });
    toast('Thursday’s sermon started'); go('poimaino', 'sermons', id);
  };
  const plan = next ? sermonPlan(m, today).filter(x => x.sermonId === next.id) : [];
  const todayStep = plan.find(x => x.status === 'due');
  const wd = weekdayOf(today);
  const year = m.sermons.filter(s => (s.date || '').startsWith(today.slice(0, 4)));
  return (
    <>
      <Head eyebrow="Poimainō" step="You preach on Thursday" title="Sermons" sub="Every message you have preached at Thursday Bible study, and the next one at the top." />
      <div className="cols">
        <div className="stack">
          <section className="card sm-next">
            <div className="sm-cal"><small>{fmtDate(thu, { weekday: 'long' })}</small><b>{fmtDate(thu, { day: 'numeric' })}</b><span>{fmtDate(thu, { month: 'long' })}</span></div>
            <div className="sm-next-b">
              <span className="sm-when">{when(thu, today)}</span>
              {next ? <>
                <h2><a href={`#/poimaino/sermons/${next.id}`}>{next.title || 'Untitled message'}</a></h2>
                {next.scriptures && <p className="sm-scr">{next.scriptures}</p>}
                <div className="sm-steps" aria-label="Preparation">{SERMON_STAGES.map((l, i) => <i key={l} title={l} className={(i === 0 ? next.received : next.stagesDone?.[i]) ? 'on' : ''} />)}<span>{readyPct(next)}% ready{todayStep ? ` · today: ${todayStep.label.toLowerCase()}` : ''}</span></div>
                <div className="sm-mats">{(next.attachments || []).length ? next.attachments.map((x, i) => { const [k, l, Ic] = kindOf(x); return <a key={i} className={'k-' + k} href={x.url} target="_blank" rel="noreferrer"><Ic size={14} />{x.name || l}</a>; }) : <em>{next.received ? 'No materials attached yet.' : 'Waiting for the material.'}</em>}</div>
                <div className="row-btns"><a className="btn primary" href={`#/poimaino/sermons/${next.id}`}><PenLine size={16} />Prepare</a><a className="btn" href={`#/poimaino/sermons/${next.id}/preach`}><Mic size={16} />Preach from it</a></div>
              </> : <>
                <h2>Nothing started yet</h2>
                <p className="sm-scr">Start it when the material arrives, or now and attach it later.</p>
                <div className="row-btns"><button className="primary" onClick={() => create(true)}><Plus size={16} />I’ve received the material</button><button onClick={() => create(false)}>Start without it</button></div>
              </>}
            </div>
          </section>
          <section className="card sm-all">
            <div className="card-h"><h2>All sermons</h2><div className="j-search sm-q"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search titles, scriptures, notes…" aria-label="Search sermons" /></div></div>
            {list.length === 0 ? <Empty title={q ? 'Nothing matches.' : 'Your past sermons will be listed here.'} /> : (
              <ul className="sm-list">{list.map(s => (
                <li key={s.id}><a href={`#/poimaino/sermons/${s.id}`}>
                  <span className="sm-d"><b>{s.date ? fmtDate(s.date, { day: 'numeric' }) : '—'}</b><small>{s.date ? fmtDate(s.date, { month: 'short', year: s.date.slice(0, 4) !== today.slice(0, 4) ? '2-digit' : undefined }) : ''}</small></span>
                  <span className="sm-t"><b>{s.title || 'Untitled'}</b><small>{s.scriptures || 'No scriptures yet'}</small></span>
                  <span className="sm-ics">{(s.attachments || []).slice(0, 3).map((x, i) => { const [k, , Ic] = kindOf(x); return <Ic key={i} size={15} className={'k-' + k} />; })}</span>
                  {preached(s) ? <span className="sv-st submitted">Preached</span> : s.date > today ? <span className="sv-st">Coming</span> : <span className="sv-st">{readyPct(s)}%</span>}
                  <ArrowRight className="sv-go" size={17} />
                </a></li>
              ))}</ul>
            )}
          </section>
        </div>
        <aside className="aside even">
          <section>
            <h3>{today.slice(0, 4)}</h3>
            <div className="cr-stats"><span><b>{year.filter(preached).length}</b>Preached</span><span><b>{year.reduce((n, s) => n + (s.attachments || []).length, 0)}</b>Materials</span><span><b>{year.filter(s => (s.reflection || '').trim()).length}</b>Reflected on</span></div>
          </section>
          <section>
            <h3>The week’s rhythm</h3>
            <ul className="sm-rhythm">{[1, 2, 3, 4, 5].map(d => (
              <li key={d} className={d === wd ? 'today' : ''}><span>{DAYS[d]}</span><b>{SERMON_PLAN.filter(x => x.day === d).map(x => x.label).join(', then ')}</b></li>
            ))}</ul>
            <p className="muted small" style={{ margin: '10px 0 0' }}>From Friday, the next Thursday moves to the top, so you can start preparing as soon as its material comes.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
