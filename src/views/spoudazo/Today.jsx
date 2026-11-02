import { useState } from 'react';
import { Check, ArrowRight, Sunrise, HandHeart, BookOpen, GraduationCap, Library, Headphones, Leaf, Moon } from 'lucide-react';
import { lifeToday, lifeWarnings, topicOf } from '../../store/life';
import { Head, TitleBlock, Sheet, SheetHead, fmtDate } from '../../lib/ui.jsx';
import { PrayerSheet } from '../Prayer.jsx';
import { useLife, greeting } from './common.jsx';

// Closing the day: the one discipline recorded right here
function Examen({ item }) {
  const { act, l, toast, today } = useLife();
  const [ex, setEx] = useState(l.examen[today] || { saw: '', fell: '', tomorrow: '' });
  return (
    <form className="examen" onSubmit={(e) => { e.preventDefault(); act('EXAMEN', { date: today, data: ex }); toast('Day closed'); }}>
      <label>Where did I see God today?<input value={ex.saw} onChange={e => setEx(x => ({ ...x, saw: e.target.value }))} /></label>
      <label>Where did I fall short?<input value={ex.fell} onChange={e => setEx(x => ({ ...x, fell: e.target.value }))} /></label>
      <label>What will I do tomorrow?<input value={ex.tomorrow} onChange={e => setEx(x => ({ ...x, tomorrow: e.target.value }))} /></label>
      <button type="submit" className="sm primary" disabled={!ex.saw.trim() && !ex.fell.trim() && !ex.tomorrow.trim()}>{item.done ? 'Save changes' : 'Close the day'}</button>
    </form>
  );
}

const ICON = { quiet: Sunrise, prayer: HandHeart, bible: BookOpen, study: GraduationCap, reading: Library, listen: Headphones, fast: Leaf, examen: Moon };
const hm = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`; };

// One discipline as a tile: what it is, how far along, and its state. Tap to go and do it.
function Tile({ item, onOpen, upNext }) {
  const Icon = ICON[item.id] || Check;
  const pct = item.done ? 100 : item.goal ? Math.min(100, (item.have / item.goal) * 100) : 0;
  return (
    <button type="button" className={'dtile' + (item.done ? ' done' : '') + (upNext ? ' upnext' : '')} onClick={onOpen}>
      <span className="dt-top">
        <span className="dt-ic"><Icon size={19} /></span>
        <span className="dt-state">{item.done ? <><Check size={13} strokeWidth={3} />Kept</> : upNext ? 'Up next' : item.time ? item.time : ''}</span>
      </span>
      <b>{item.label}</b>
      <small>{item.sub}</small>
      <span className="dt-bar"><i style={{ width: `${pct}%` }} /></span>
    </button>
  );
}

export default function Today() {
  const { state, l, g, today, now, act, toast } = useLife();
  const items = lifeToday(state, today, now);
  const left = items.filter(x => !x.done);
  const upNext = (left.find(x => !x.evening && x.time && x.time >= now) || left.find(x => !x.evening) || left[0])?.id;
  const [openId, setOpenId] = useState(null);
  const opened = items.find(x => x.id === openId);
  const done = items.filter(x => x.done).length;
  const warnings = lifeWarnings(state, today);
  const topic = topicOf(l, l.study.current);
  const notes = topic ? l.studyNotes.filter(n => n.topicId === topic.id).length : 0;
  const book = l.books.find(b => b.status === 'reading' && b.for !== 'members');
  const bookPct = book && Number(book.pages) ? Math.min(100, Math.round((Number(book.pagesRead) || 0) / Number(book.pages) * 100)) : null;
  const lastMsg = [...l.listening].sort((a, b) => b.date.localeCompare(a.date))[0];
  const sabbath = new Date().getDay() === (state.profile?.sabbathDay ?? 1);
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
  const yEx = l.examen[yesterday];
  // this week so far
  const mon = (() => { const d = new Date(today + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
  const elapsed = Math.round((new Date(today) - new Date(mon)) / 86400000) + 1;
  const inWeek = (x) => x.date >= mon && x.date <= today;
  const qDays = new Set(l.quietTimes.filter(inWeek).map(q => q.date)).size;
  const pMin = state.prayerSessions.filter(inWeek).reduce((n, p) => n + (Number(p.duration) || 0), 0);
  const ch = l.bible.filter(inWeek).reduce((n, b) => n + Math.max(0, (Number(b.to) || Number(b.from)) - Number(b.from) + 1), 0);
  const week = [
    ['Quiet time', qDays, elapsed, `${qDays} of ${elapsed} mornings`],
    ['Prayer', pMin, g.prayerMinutes * elapsed, `${hm(pMin)} of ${hm(g.prayerMinutes * elapsed)}`],
    ['Bible', ch, g.chaptersPerDay * elapsed, `${ch} of ${g.chaptersPerDay * elapsed} chapters`],
  ];
  const focus = [
    { id: 'study', Icon: GraduationCap, k: 'Studying', v: topic?.title, note: topic ? `${notes} ${notes === 1 ? 'note' : 'notes'} so far` : null, cta: 'Choose a topic', href: '#/word/study' },
    { id: 'book', Icon: Library, k: 'Reading', v: book?.title, note: bookPct !== null ? `${bookPct}% read` : book?.author, cta: 'Choose a book', href: '#/library' },
    { id: 'listen', Icon: Headphones, k: 'Listening', v: lastMsg?.title, note: lastMsg ? `last heard ${fmtDate(lastMsg.date, { day: 'numeric', month: 'short' })}` : null, cta: 'Choose a message to hear', href: '#/library/messages' },
  ];
  return (
    <>
      <Head eyebrow="Spoudazō" step={fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} title={`${greeting(now)}${state.name ? `, ${state.name}` : ''}`}
        sub="Your rhythm for today. Each one is ticked when you record the real thing, not before.">
        <TitleBlock items={[['Kept today', `${done} / ${items.length}`], ['Days in a row', lifeStreak(state)]]} />
      </Head>
      {!l.setupDone && <p className="note-banner"><b>Set your rhythm first.</b> How long you pray, how many chapters you read, your prayer times and fast days. <a href="#/settings">Set it in Settings</a>.</p>}
      {sabbath && <p className="note-banner"><b>Today is your Sabbath.</b> Keep your quiet time and prayer; let the rest be rest.</p>}
      <div className="cols">
        <div className="stack">
          <section className="card">
            <div className="card-h"><h2>Today’s disciplines</h2><span className="muted small">{done} of {items.length} kept · tap one to go to it</span></div>
            <div className="dtiles">{items.map(it => <Tile key={it.id} item={it} upNext={it.id === upNext} onOpen={() => (it.id === 'prayer' || it.id === 'examen' ? setOpenId(it.id) : (window.location.hash = it.href.slice(1)))} />)}</div>
          </section>
        </div>
        <aside className="aside even">
          {yEx?.tomorrow && (
            <section className="yday">
              <h3>Yesterday you said</h3>
              <blockquote>“{yEx.tomorrow}”</blockquote>
              <small>From closing the day, {fmtDate(yesterday, { weekday: 'long' })}</small>
            </section>
          )}
          {warnings.length > 0 && (
            <section>
              <h3>Watch out</h3>
              <ul className="warn-list">{warnings.map(w => <li key={w.id}><a href={w.href}>{w.label}</a></li>)}</ul>
            </section>
          )}
          <section>
            <h3>Your focus</h3>
            <ul className="focus3">
              {focus.map(f => (
                <li key={f.id}><a href={f.href} className={f.v ? '' : 'empty'}>
                  <f.Icon size={17} />
                  <span><small>{f.k}</small><b>{f.v || f.cta}</b>{f.v && f.note && <em>{f.note}</em>}</span>
                  <ArrowRight size={14} className="f3-go" />
                </a></li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Your rhythm</h3>
            <dl className="rh-amt plain">
              <div><dt>Quiet time</dt><dd>{hm(g.quietMinutes)} a morning</dd></div>
              <div><dt>Prayer</dt><dd>{hm(g.prayerMinutes)} a day</dd></div>
              <div><dt>Bible</dt><dd>{g.chaptersPerDay} chapters a day</dd></div>
              <div><dt>Study</dt><dd>{hm(g.studyMinutes)} a day</dd></div>
              <div><dt>Fasting</dt><dd>{(g.fastDays || []).length ? g.fastDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') : 'No set day'}</dd></div>
            </dl>
            <a className="aside-link" href="#/settings">Change your rhythm<ArrowRight size={13} /></a>
          </section>
        </aside>
      </div>
      <section className="card week-so-far">
            <div className="card-h"><h2>This week so far</h2><a href="#/home">Your whole week on Boēthos<ArrowRight size={13} /></a></div>
            <ul className="wsf">{week.map(([k, v, gl, txt]) => (
              <li key={k}><span>{k}</span><b>{txt}</b><span className="wm-bar"><i style={{ width: `${gl ? Math.min(100, (v / gl) * 100) : 0}%` }} /></span></li>
            ))}</ul>
          </section>
      {opened?.id === 'prayer' && <PrayerSheet withTimes onClose={() => setOpenId(null)} />}
      {opened?.id === 'examen' && (
        <Sheet onClose={() => setOpenId(null)} label={opened.label}>
          <SheetHead eyebrow={opened.done ? 'Done today' : 'Before you sleep'} title={opened.label} onClose={() => setOpenId(null)} />
          <p className="muted" style={{ marginTop: 0 }}>{opened.sub}</p>
          <div className="dt-sheet"><Examen item={opened} /></div>
        </Sheet>
      )}
    </>
  );
}

function lifeStreak(state) {
  // days in a row with any Spoudazō record (quiet time, prayer, Bible, study)
  const days = new Set([...state.life.quietTimes, ...state.prayerSessions, ...state.life.bible, ...state.life.studyNotes].map(x => x.date));
  const d0 = new Date();
  let n = 0;
  for (let i = 0; i < 3650; i++) {
    const d = new Date(d0.getTime() - i * 86400000).toLocaleDateString('en-CA');
    if (days.has(d)) n++;
    else if (i > 0) break;
  }
  return n;
}
