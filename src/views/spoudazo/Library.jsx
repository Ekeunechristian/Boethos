import { useState } from 'react';
import TimeInput from '../../lib/TimeInput.jsx';
import { Plus, X, Check, ArrowRight, Search, ExternalLink } from 'lucide-react';
import { MESSAGE_CATS, DHM } from '../../data/spoudazo';
import { streaks } from '../../store/life';
import { addDays, mondayOf } from '../../store/ministry';
import { Head, Seg, TitleBlock, Picker, Empty, fmtDate } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useLife } from './common.jsx';

const hm = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`; };
// Only real web links are opened; anything else is kept as text
const safeLink = (s) => { const t = (s || '').trim(); if (!t) return ''; const u = /^https?:\/\//i.test(t) ? t : `https://${t}`; try { return new URL(u).protocol.startsWith('http') ? u : ''; } catch { return ''; } };
const myBooks = (l) => l.books.filter(b => b.for !== 'members');
const messages = (l) => l.listening.filter(x => x.kind !== 'camp');
const camps = (l) => l.listening.filter(x => x.kind === 'camp');
const ago = (d, today) => { const n = Math.round((new Date(today) - new Date(d)) / 86400000); return n < 1 ? 'today' : n < 31 ? `${n} ${n === 1 ? 'day' : 'days'} ago` : n < 365 ? `${Math.round(n / 30)} ${Math.round(n / 30) === 1 ? 'month' : 'months'} ago` : `${Math.round(n / 365)} ${Math.round(n / 365) === 1 ? 'year' : 'years'} ago`; };

// A streak with its big number, used across the Library
function Streak({ n, unit, rows }) {
  return (
    <div className="qs-row">
      <div className="qs-now"><b>{n}</b><span>{unit}</span></div>
      <dl className="qs-dl">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </div>
  );
}

// ── Reading: the book you are on, and your shelf ──
function Reading() {
  const { l, g, today, act, toast } = useLife();
  const books = myBooks(l);
  const book = books.find(b => b.status === 'reading');
  const want = books.filter(b => b.status === 'want');
  const done = books.filter(b => b.status === 'finished').sort((a, b) => (b.finished || '').localeCompare(a.finished || ''));
  const [log, setLog] = useState({ minutes: g.readingMinutes || 20, pages: '', learned: '' });
  const [nb, setNb] = useState({ title: '', author: DHM, pages: '', now: !book });
  const st = streaks(l.readingLog.map(r => r.date), today);
  const mon = mondayOf(today);
  const elapsed = Math.round((new Date(today) - new Date(mon)) / 86400000) + 1;
  const weekMin = l.readingLog.filter(r => r.date >= mon && r.date <= today).reduce((n, r) => n + (Number(r.minutes) || 0), 0);
  const todayMin = l.readingLog.filter(r => r.date === today).reduce((n, r) => n + (Number(r.minutes) || 0), 0);
  const month = books.filter(b => (b.finished || '').startsWith(today.slice(0, 7))).length;
  const pct = book && Number(book.pages) ? Math.min(100, Math.round((Number(book.pagesRead) || 0) / Number(book.pages) * 100)) : null;
  const learned = book ? [...l.readingLog.filter(r => r.bookId === book.id && r.learned).map(r => ({ d: r.date, t: r.learned })), ...(book.lessons || []).map(x => ({ d: x.date, t: x.text }))].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 3) : [];
  const start = (b) => { if (book) act('BOOK_UPDATE', { id: book.id, data: { status: 'want' } }); act('BOOK_UPDATE', { id: b.id, data: { status: 'reading' } }); toast(`Now reading ${b.title}`); };
  const addBook = (e) => {
    e.preventDefault();
    if (nb.now && book) act('BOOK_UPDATE', { id: book.id, data: { status: 'want' } });
    act('BOOK_ADD', { data: { title: nb.title.trim(), author: nb.author.trim(), pages: nb.pages, status: nb.now ? 'reading' : 'want', for: 'me' } });
    toast(nb.now ? `Now reading ${nb.title.trim()}` : `${nb.title.trim()} is on your shelf`);
    setNb({ title: '', author: DHM, pages: '', now: false });
  };
  const r = g.reminders || {};
  return (
    <>
      <div className="cols">
        <div className="stack">
          <section className="card lb-now">
            <div className="card-h"><h2>Now reading</h2>{book && <span className="muted small">since {fmtDate(book.started || today, { day: 'numeric', month: 'long' })}</span>}</div>
            {book ? <>
              <div className="lb-book">
                <span className="lb-cover" aria-hidden="true"><i />{book.title.replace(/^The /, '').slice(0, 1)}</span>
                <div className="lb-t">
                  <b>{book.title}</b><small>{book.author}</small>
                  {pct !== null ? <><span className="ch-bar"><i style={{ width: `${pct}%` }} /></span><em>{book.pagesRead || 0} of {book.pages} pages · {pct}%</em></>
                    : <label className="lb-pages">Pages in this book <input type="number" min="1" placeholder="—" onBlur={e => e.target.value && act('BOOK_UPDATE', { id: book.id, data: { pages: e.target.value } })} /></label>}
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); act('READ_LOG', { data: { bookId: book.id, minutes: Number(log.minutes) || 0, pages: log.pages, learned: log.learned.trim() }, label: book.title }); setLog(x => ({ ...x, pages: '', learned: '' })); toast(log.learned.trim() ? 'Reading and lesson saved' : 'Reading recorded'); }}>
                <div className="fields">
                  <div className="field"><label htmlFor="rl-m">Minutes today</label><input id="rl-m" type="number" min="1" value={log.minutes} onChange={e => setLog(x => ({ ...x, minutes: e.target.value }))} /></div>
                  <div className="field"><label htmlFor="rl-p">Pages today</label><input id="rl-p" type="number" min="0" value={log.pages} onChange={e => setLog(x => ({ ...x, pages: e.target.value }))} /></div>
                  <div className="field wide"><label htmlFor="rl-l">What I learned, or an instruction I received</label><textarea id="rl-l" value={log.learned} onChange={e => setLog(x => ({ ...x, learned: e.target.value }))} style={{ minHeight: 90 }} placeholder="It goes to your journal" /></div>
                </div>
                <div className="fr-foot"><button type="button" className="ghost sm" onClick={() => { act('BOOK_UPDATE', { id: book.id, data: { status: 'finished' } }); toast(`Finished ${book.title}`); }}><Check size={14} />I finished this book</button>
                  <button className="primary" type="submit">I read today</button></div>
              </form>
            </> : <Empty title="You are not reading a book right now."><p style={{ margin: 0 }}>{want.length ? 'Start one from your shelf below, or add a new one.' : 'Add the book you will read next.'}</p></Empty>}
          </section>

          <form className="card" onSubmit={addBook}>
            <div className="card-h"><h2>Add a book</h2></div>
            <div className="fields">
              <div className="field"><label htmlFor="bk-t">Title</label><input id="bk-t" value={nb.title} onChange={e => setNb(x => ({ ...x, title: e.target.value }))} required /></div>
              <div className="field"><label htmlFor="bk-a">Author</label><input id="bk-a" value={nb.author} onChange={e => setNb(x => ({ ...x, author: e.target.value }))} /></div>
              <div className="field"><label htmlFor="bk-p">Pages</label><input id="bk-p" type="number" min="0" value={nb.pages} onChange={e => setNb(x => ({ ...x, pages: e.target.value }))} /></div>
              <div className="field"><label>Put it</label><Picker label="Where" value={nb.now ? 'now' : 'shelf'} onChange={v => setNb(x => ({ ...x, now: v === 'now' }))} options={[{ value: 'now', label: 'Start reading it now' }, { value: 'shelf', label: 'On my shelf, to read' }]} /></div>
            </div>
            <button className="primary" type="submit" disabled={!nb.title.trim()}><Plus size={16} />Add</button>
          </form>
        </div>
        <aside className="aside even">
          <section>
            <h3>Reading streak</h3>
            <Streak n={st.current} unit={st.current === 1 ? 'day in a row' : 'days in a row'} rows={[['Best streak', st.best], ['Today', `${hm(todayMin)} of ${hm(g.readingMinutes)}`], ['This week', hm(weekMin)]]} />
            <span className="ch-bar" style={{ marginTop: 12 }}><i style={{ width: `${Math.min(100, (weekMin / Math.max(1, g.readingMinutes * elapsed)) * 100)}%` }} /></span>
          </section>
          <section>
            <h3>This month</h3>
            <p className="lb-month"><b>{month}</b> of {g.booksPerMonth} {g.booksPerMonth === 1 ? 'book' : 'books'} finished</p>
          </section>
          <section>
            <h3>Reminder to read</h3>
            <div className="lb-rem">
              <label className="switch"><input type="checkbox" role="switch" checked={!!r.reading} onChange={e => act('GOALS', { data: { reminders: { reading: e.target.checked } } })} /><span className="sw" aria-hidden="true" />Every day at</label>
              <TimeInput value={g.readingTime || '21:00'} onChange={e => act('GOALS', { data: { readingTime: e.target.value } })} aria-label="Reading reminder time" disabled={!r.reading} />
            </div>
            <p className="muted small" style={{ margin: '6px 0 0' }}>{book ? `“Time to read ${book.title}.” Not sent once you have read today.` : 'Starts when you are reading a book.'}</p>
          </section>
          <section>
            <h3>From this book</h3>
            {learned.length ? <ul className="sd-notes">{learned.map((x, i) => <li key={i}><p>{x.t}</p><small>{fmtDate(x.d, { weekday: 'short', day: 'numeric', month: 'short' })}</small></li>)}</ul>
              : <p className="muted small" style={{ margin: 0 }}>What you learn from it will gather here.</p>}
            <a className="aside-link" href="#/library/journal">Your journal<ArrowRight size={13} /></a>
          </section>
        </aside>
      </div>

      <div className="lb-shelf">
        <section className="card">
          <div className="card-h"><h2>To read</h2><span className="muted small">{want.length}</span></div>
          {want.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Nothing on your shelf yet.</p> : <ul className="lb-list">{want.map(b => (
            <li key={b.id}><span><b>{b.title}</b><small>{b.author}{b.pages ? ` · ${b.pages} pages` : ''}</small></span>
              <span className="lb-act"><button type="button" className="sm" onClick={() => start(b)}>Start reading</button><button type="button" className="ghost sm" onClick={() => act('BOOK_DELETE', { id: b.id })} aria-label={`Remove ${b.title}`}><X size={14} /></button></span></li>
          ))}</ul>}
        </section>
        <section className="card">
          <div className="card-h"><h2>Finished</h2><span className="muted small">{done.length}</span></div>
          {done.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Your finished books will be listed here.</p> : <ul className="lb-list">{done.map(b => (
            <li key={b.id}><span><b>{b.title}</b><small>{b.author}{b.finished ? ` · finished ${fmtDate(b.finished, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</small></span>
              <span className="lb-act"><button type="button" className="ghost sm" onClick={() => start(b)}>Read again</button></span></li>
          ))}</ul>}
        </section>
      </div>
    </>
  );
}

// Categories, with your own added
function useCats() {
  const { l } = useLife();
  return [...MESSAGE_CATS.filter(c => c !== 'Other'), ...(l.customMsgCats || []), 'Other'];
}

// ── Messages: paste the link, give it a topic ──
function Messages() {
  const { l, g, today, act, toast } = useLife();
  const cats = useCats();
  const [f, setF] = useState({ link: '', title: '', speaker: DHM, category: cats[0], date: today, minutes: '', takeaway: '' });
  const [newCat, setNewCat] = useState(null);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const all = messages(l);
  const mon = mondayOf(today);
  const week = all.filter(x => x.date >= mon && x.date <= today).length;
  const goal = g.messagesPerWeek || 1;
  // weeks in a row you reached your goal (this week counts once it is reached)
  const weekMet = (i) => { const from = addDays(mon, -7 * i); return all.filter(x => x.date >= from && x.date <= addDays(from, 6)).length >= goal; };
  let run = 0; for (let i = weekMet(0) ? 0 : 1; i < 104 && weekMet(i); i++) run++;
  const byCat = cats.map(c => [c, all.filter(x => (x.category || 'Other') === c).length]).filter(([, n]) => n);
  const list = all.filter(x => (!cat || (x.category || 'Other') === cat) && (!q || `${x.title} ${x.speaker} ${x.takeaway}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const add = (e) => {
    e.preventDefault();
    act('LISTEN_ADD', { data: { kind: 'message', link: safeLink(f.link), title: f.title.trim(), speaker: f.speaker.trim(), category: f.category, date: f.date, minutes: Number(f.minutes) || 0, takeaway: f.takeaway.trim() } });
    toast('Message saved'); setF(x => ({ ...x, link: '', title: '', minutes: '', takeaway: '' }));
  };
  const addCat = () => { const c = (newCat || '').trim(); if (c) { act('MSGCAT_ADD', { name: c }); setF(x => ({ ...x, category: c })); } setNewCat(null); };
  return (
    <>
      <div className="cols">
        <div className="stack">
          <form className="card" onSubmit={add}>
            <div className="card-h"><h2>Add a message</h2><span className="muted small">{week} of {goal} this week</span></div>
            <div className="fields">
              <div className="field wide"><label htmlFor="ms-l">Link</label><input id="ms-l" type="text" inputMode="url" autoComplete="off" value={f.link} onChange={e => setF(x => ({ ...x, link: e.target.value }))} placeholder="Paste the YouTube, audio or website link" /></div>
              <div className="field wide"><label htmlFor="ms-t">Title</label><input id="ms-t" value={f.title} onChange={e => setF(x => ({ ...x, title: e.target.value }))} required placeholder="The title of the message" /></div>
              <div className="field"><label htmlFor="ms-s">Preacher</label><input id="ms-s" value={f.speaker} onChange={e => setF(x => ({ ...x, speaker: e.target.value }))} /></div>
              <div className="field"><label>Topic</label>
                {newCat === null ? <div className="ps-kind"><Picker label="Topic" value={f.category} onChange={v => setF(x => ({ ...x, category: v }))} options={cats.map(c => ({ value: c, label: c }))} /><button type="button" className="sm" onClick={() => setNewCat('')}><Plus size={14} />New</button></div>
                  : <div className="ps-kind"><input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Grace" aria-label="New topic" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCat(); } }} /><button type="button" className="sm primary" onClick={addCat}>Add</button></div>}
              </div>
              <div className="field"><label htmlFor="ms-d">Heard on</label><input id="ms-d" type="date" max={today} value={f.date} onChange={e => setF(x => ({ ...x, date: e.target.value }))} /></div>
              <div className="field"><label htmlFor="ms-m">Minutes</label><input id="ms-m" type="number" min="0" value={f.minutes} onChange={e => setF(x => ({ ...x, minutes: e.target.value }))} /></div>
              <div className="field wide"><label htmlFor="ms-k">What stayed with me</label><textarea id="ms-k" value={f.takeaway} onChange={e => setF(x => ({ ...x, takeaway: e.target.value }))} style={{ minHeight: 80 }} placeholder="It goes to your journal" /></div>
            </div>
            <button className="primary" type="submit" disabled={!f.title.trim()}>Save message</button>
          </form>
        </div>
        <aside className="aside even">
          <section>
            <h3>Your listening</h3>
            <Streak n={week} unit={`of ${goal} this week`} rows={[['Weeks in a row', run], ['This month', all.filter(x => x.date.startsWith(today.slice(0, 7))).length], ['All messages', all.length]]} />
          </section>
          <section>
            <h3>By topic</h3>
            <ul className="lb-topics">{cats.map(c => { const n = all.filter(x => (x.category || 'Other') === c).length; return (
              <li key={c}><button type="button" className={(cat === c ? 'on' : '') + (n ? '' : ' none')} onClick={() => setCat(cat === c ? '' : c)}><span>{c}</span><em>{n || '–'}</em></button></li>
            ); })}</ul>
          </section>
        </aside>
      </div>

      <section className="card lb-msgs">
        <div className="card-h"><h2>{cat ? `Messages on ${cat}` : 'Your messages'}</h2>{cat && <button type="button" className="ghost sm" onClick={() => setCat('')}>Show all</button>}</div>
        <div className="jr-bar" style={{ marginBottom: 6 }}>
          <div className="j-search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search titles, preachers and notes…" aria-label="Search messages" /></div>
          <div className="jw-kinds lb-catpick" role="group" aria-label="Topic"><button type="button" className={!cat ? 'on' : ''} onClick={() => setCat('')}>All</button>{byCat.map(([c]) => <button key={c} type="button" className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
        </div>
        {list.length === 0 ? <Empty title={all.length ? 'Nothing matches.' : 'No messages yet.'} /> : (
          <ul className="lb-ml">{list.map(x => (
            <li key={x.id}>
              <div className="jr-date"><b>{+x.date.slice(8)}</b><small>{fmtDate(x.date, { month: 'short' })}</small></div>
              <div className="jr-body">
                <p className="jr-what"><span className="jw-tag plan">{x.category || 'Other'}</span>{x.speaker}{x.minutes ? ` · ${x.minutes} min` : ''}</p>
                <b className="lb-mt">{x.title}</b>
                {x.takeaway && <p className="lb-take">{x.takeaway}</p>}
              </div>
              <div className="lb-act">
                {x.link && <a className="btn sm" href={x.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Open</a>}
                <button type="button" className="ghost sm" onClick={() => act('LISTEN_DELETE', { id: x.id })} aria-label="Delete"><X size={14} /></button>
              </div>
            </li>
          ))}</ul>
        )}
      </section>
    </>
  );
}

// ── Camps: every camp, and what you received ──
function Camps() {
  const { l, today, act, toast } = useLife();
  const [f, setF] = useState({ title: '', date: today, to: '', place: '', speaker: DHM, link: '', takeaway: '' });
  const all = camps(l).sort((a, b) => b.date.localeCompare(a.date));
  const past = all.filter(x => x.date <= today);
  const next = all.filter(x => x.date > today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const year = all.filter(x => x.date.startsWith(today.slice(0, 4)) && x.date <= today).length;
  const add = (e) => {
    e.preventDefault();
    act('LISTEN_ADD', { data: { kind: 'camp', title: f.title.trim(), date: f.date, to: f.to && f.to >= f.date ? f.to : '', place: f.place.trim(), speaker: f.speaker.trim(), link: safeLink(f.link), takeaway: f.takeaway.trim() } });
    toast(f.date > today ? 'Camp planned' : 'Camp saved'); setF({ title: '', date: today, to: '', place: '', speaker: DHM, link: '', takeaway: '' });
  };
  const dates = (x) => `${fmtDate(x.date, { day: 'numeric', month: 'short' })}${x.to ? ` – ${fmtDate(x.to, { day: 'numeric', month: 'short' })}` : ''} ${x.date.slice(0, 4)}`;
  return (
    <>
      <div className="cols">
        <div className="stack">
          <form className="card" onSubmit={add}>
            <div className="card-h"><h2>Add a camp</h2><span className="muted small">One you attended, or one coming up</span></div>
            <div className="fields">
              <div className="field wide"><label htmlFor="cp-t">Camp</label><input id="cp-t" value={f.title} onChange={e => setF(x => ({ ...x, title: e.target.value }))} required placeholder="Shepherds’ camp 2026" /></div>
              <div className="field"><label htmlFor="cp-d">From</label><input id="cp-d" type="date" value={f.date} onChange={e => setF(x => ({ ...x, date: e.target.value }))} /></div>
              <div className="field"><label htmlFor="cp-to">To <em>optional</em></label><input id="cp-to" type="date" min={f.date} value={f.to} onChange={e => setF(x => ({ ...x, to: e.target.value }))} /></div>
              <div className="field"><label htmlFor="cp-p">Where</label><input id="cp-p" value={f.place} onChange={e => setF(x => ({ ...x, place: e.target.value }))} /></div>
              <div className="field"><label htmlFor="cp-s">Ministered by</label><input id="cp-s" value={f.speaker} onChange={e => setF(x => ({ ...x, speaker: e.target.value }))} /></div>
              <div className="field wide"><label htmlFor="cp-l">Link <em>optional</em></label><input id="cp-l" type="text" inputMode="url" autoComplete="off" value={f.link} onChange={e => setF(x => ({ ...x, link: e.target.value }))} placeholder="Recordings or the camp page" /></div>
              <div className="field wide"><label htmlFor="cp-k">What I received</label><textarea id="cp-k" value={f.takeaway} onChange={e => setF(x => ({ ...x, takeaway: e.target.value }))} style={{ minHeight: 80 }} placeholder="The word, the impartation, the instructions" /></div>
            </div>
            <button className="primary" type="submit" disabled={!f.title.trim()}>Save camp</button>
          </form>
        </div>
        <aside className="aside even">
          <section>
            <h3>Your camps</h3>
            <Streak n={year} unit={`${year === 1 ? 'camp' : 'camps'} this year`} rows={[['Last camp', past[0] ? ago(past[0].date, today) : 'none yet'], ['All camps', past.length]]} />
          </section>
          <section>
            <h3>Next camp</h3>
            {next ? <div className="lb-next"><b>{next.title}</b><span>{dates(next)}{next.place ? ` · ${next.place}` : ''}</span><em>in {Math.round((new Date(next.date) - new Date(today)) / 86400000)} days</em></div>
              : <p className="muted small" style={{ margin: 0 }}>No camp planned. When you hear of the next one, add it with its date.</p>}
          </section>
          <section>
            <h3>Camps you attended</h3>
            {past.length === 0 ? <p className="muted small" style={{ margin: 0 }}>None recorded yet.</p> : <ul className="lb-camps">{past.slice(0, 5).map(x => (
              <li key={x.id}>
                <span><b>{x.title}</b><small>{dates(x)}{x.place ? ` · ${x.place}` : ''}</small>{x.takeaway && <em>{x.takeaway}</em>}</span>
                <span className="lb-act">{x.link && <a className="btn sm ghost" href={x.link} target="_blank" rel="noopener noreferrer" aria-label="Open the link"><ExternalLink size={14} /></a>}
                  <button type="button" className="ghost sm" onClick={() => act('LISTEN_DELETE', { id: x.id })} aria-label="Delete"><X size={14} /></button></span>
              </li>
            ))}</ul>}
            {past.length > 0 && <a className="aside-link" href="#/library/journal">What you received, in your journal<ArrowRight size={13} /></a>}
          </section>
        </aside>
      </div>
    </>
  );
}

// ── Journal: what you learned from books, messages and camps ──
const KINDS = [['', 'All'], ['book', 'Books'], ['message', 'Messages'], ['camp', 'Camps']];
function Journal() {
  const { l, g, today } = useLife();
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const title = (id) => l.books.find(b => b.id === id)?.title || 'A book';
  const entries = [
    ...l.readingLog.filter(r => r.learned).map(r => ({ id: r.id, date: r.date, kind: 'book', what: title(r.bookId), text: r.learned })),
    ...l.books.flatMap(b => (b.lessons || []).map((x, i) => ({ id: `${b.id}-${i}`, date: x.date, kind: 'book', what: b.title, text: x.text }))),
    ...l.listening.filter(x => x.takeaway && x.date <= today).map(x => ({ id: x.id, date: x.date, kind: x.kind === 'camp' ? 'camp' : 'message', what: x.title, sub: x.kind === 'camp' ? x.place : x.category, text: x.takeaway, link: x.link })),
  ].filter(e => (!kind || e.kind === kind) && (!q || `${e.what} ${e.text} ${e.sub || ''}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const months = [];
  entries.forEach(x => { const k = x.date.slice(0, 7); const m = months[months.length - 1]; if (m && m.k === k) m.items.push(x); else months.push({ k, items: [x] }); });
  const sr = streaks(l.readingLog.map(r => r.date), today);
  const mon = mondayOf(today);
  const week = messages(l).filter(x => x.date >= mon && x.date <= today).length;
  const year = camps(l).filter(x => x.date.startsWith(today.slice(0, 4)) && x.date <= today).length;
  const label = { book: 'Book', message: 'Message', camp: 'Camp' };
  return (
    <div className="stack">
      <div className="jw-streaks three">
        <a className={'jw-s' + (l.readingLog.some(r => r.date === today) ? ' done' : '')} href="#/library"><small>Reading</small><b>{sr.current} <span>{sr.current === 1 ? 'day' : 'days'} in a row</span></b><em>Best {sr.best}</em></a>
        <a className={'jw-s' + (week >= (g.messagesPerWeek || 1) ? ' done' : '')} href="#/library/messages"><small>Messages</small><b>{week} <span>of {g.messagesPerWeek || 1} this week</span></b><em>{messages(l).length} in all</em></a>
        <a className="jw-s" href="#/library/camps"><small>Camps</small><b>{year} <span>this year</span></b><em>{camps(l).filter(x => x.date <= today).length} in all</em></a>
      </div>
      <div className="jr-bar">
        <div className="j-search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search what you have learned…" aria-label="Search the journal" /></div>
        <div className="jw-kinds" role="group" aria-label="Show">{KINDS.map(([id, t]) => <button key={id} type="button" className={kind === id ? 'on' : ''} onClick={() => setKind(id)}>{t}</button>)}</div>
      </div>
      {entries.length === 0 && <div className="card"><Empty title={q || kind ? 'Nothing matches.' : 'Nothing written yet.'}><p style={{ margin: 0 }}>What you learn from a book, a message or a camp gathers here.</p></Empty></div>}
      {months.map(({ k, items }) => (
        <section key={k} className="card jr-month">
          <div className="card-h"><h2>{new Date(k + '-15T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2><span className="muted small">{items.length} {items.length === 1 ? 'entry' : 'entries'}</span></div>
          <ol className="jr-list">{items.map(x => (
            <li key={x.id}>
              <div className="jr-date"><b>{+x.date.slice(8)}</b><small>{new Date(x.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</small></div>
              <div className="jr-body">
                <p className="jr-what"><span className={'jw-tag ' + { book: 'plan', message: 'study', camp: 'own' }[x.kind]}>{label[x.kind]}</span>{x.what}{x.sub ? ` · ${x.sub}` : ''}</p>
                <blockquote>{x.text}</blockquote>
              </div>
              <div className="jr-del">{x.link && <a className="btn sm ghost" href={x.link} target="_blank" rel="noopener noreferrer" aria-label="Open the link"><ExternalLink size={14} /></a>}</div>
            </li>
          ))}</ol>
        </section>
      ))}
    </div>
  );
}

const TABS = [['', 'Reading'], ['messages', 'Messages'], ['camps', 'Camps'], ['journal', 'Journal']];
export default function LibraryView({ tab = '' }) {
  const { l, g, today } = useLife();
  const t = TABS.some(([id]) => id === tab) ? tab : '';
  const book = myBooks(l).find(b => b.status === 'reading');
  const sr = streaks(l.readingLog.map(r => r.date), today);
  const week = messages(l).filter(x => x.date >= mondayOf(today) && x.date <= today).length;
  const year = camps(l).filter(x => x.date.startsWith(today.slice(0, 4)) && x.date <= today).length;
  return (
    <>
      <Head eyebrow="Spoudazō" step="Library" title={{ '': book ? book.title : 'What will you read?', messages: 'Messages', camps: 'Camps', journal: 'Your library journal' }[t]}
        sub={{ '': 'Always be reading a book. Record what you read each day, and what you learn from it.', messages: 'Always be listening. Paste the link, give it a topic, and you can find it again when you need it.', camps: 'Go to every camp you can. Keep what you received.', journal: 'Everything you learned from books, messages and camps.' }[t]}>
        <TitleBlock items={[['Reading streak', `${sr.current} ${sr.current === 1 ? 'day' : 'days'}`], ['Messages this week', `${week} / ${g.messagesPerWeek || 1}`], ['Camps this year', year]]} />
      </Head>
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('library', ...(v ? [v] : []))} options={TABS} /></div>
      {t === '' && <Reading />}
      {t === 'messages' && <Messages />}
      {t === 'camps' && <Camps />}
      {t === 'journal' && <Journal />}
    </>
  );
}
