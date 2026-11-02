import { Component, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { StoreProvider, useStore } from './store/index.jsx';
import { useRoute, href } from './lib/router';
import { Sheet, SheetHead, ToastProvider, VerseCtx, SectionCtx, Verse } from './lib/ui.jsx';
import { PLACE_SETS, SECTIONS, where } from './lib/places';
import { verseFor } from './data/scripture';
import Home from './views/Home.jsx';
import Today from './views/spoudazo/Today.jsx';
import Quiet from './views/spoudazo/Quiet.jsx';
import Prayer from './views/Prayer.jsx';
import Word from './views/spoudazo/Word.jsx';
import LibraryView from './views/spoudazo/Library.jsx';
import PmDashboard from './views/poimaino/Dashboard.jsx';
import PmPeople from './views/poimaino/People.jsx';
import PmEvangelism from './views/poimaino/Evangelism.jsx';
import PmServices from './views/poimaino/Services.jsx';
import PmFollowUp from './views/poimaino/FollowUp.jsx';
import PmSermons from './views/poimaino/Sermons.jsx';
import PmCampaigns from './views/poimaino/Campaigns.jsx';
import PmSettings from './views/poimaino/Settings.jsx';
import SettingsView from './views/Settings.jsx';
import Welcome from './views/Welcome.jsx';
import Mark from './components/Mark.jsx';
import Engine from './components/Engine.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { FocusChip } from './components/Focus.jsx';
import { MainNav, AvatarButton, SearchButton, HelpButton } from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import CloudSync, { CloudStatus } from './components/CloudSync.jsx';

const HELP = {
  home: ['Boēthos', 'Your home page, and where Boēthos always opens. The verse of the day; what is still to do today in both callings; your streak, level and how you are doing; and the way into Spoudazō (your own walk with God) and Poimainō (your Bacenta). The tabs hold your activity, calendar, achievements, weekly and monthly reviews, journal and the health of the ministry.'],
  today: ['Spoudazō · Today', 'Your rhythm for today, built from the goals you set: quiet time, prayer and prayer times, Bible chapters, your study topic, your book, your memory verse, messages, fast days, and closing the day. Each is ticked only when you record the real thing. Open one to record it right there.'],
  quiet: ['Spoudazō · Quiet time', 'A guided time alone with God: be still, read, meditate, pray, write. When you finish, it is kept in your journal. Character holds a weekly self-examination from 1 Timothy 3 and your rule of life.'],
  prayer: ['Spoudazō · Prayer and fasting', 'Tick each prayer time as you keep it, log every time of prayer with its ACTS shape, keep a list of requests and mark them answered. Fasting holds your weekly fast days, the fasts you plan and what God did in them.'],
  word: ['Spoudazō · The Word', 'Record the chapters you read and watch the whole Bible fill in. Study: choose one topic at a time (apologetics, suffering, hermeneutics, other religions…) and write what you learn. Memory: verses you are learning, meditated on daily.'],
  library: ['Spoudazō · Library', 'Reading: the book you are on, what you read each day and what you learn. Messages: paste the link and give it a topic, so you can find it again. Camps: every camp and what you received. The journal gathers everything you learned.'],
  poimaino: ['Poimainō · Dashboard', 'Your Bacenta at a glance. The action centre lists everything that needs you, each with the reason and a link to the record; mark it done, snooze it, or dismiss it with a reason. Vision 25 shows stable members (the starting figure stays “reported” until you review the roster). The weekly review counts unique people separately from attendances.'],
  people: ['Poimainō · People', 'Everyone, once: contacts, visitors, members and stable members are one record that moves through stages, with a history of every change. Restricted notes and care needs stay on the person’s page: never in search, the dashboard, reports, exports or notifications. Possible duplicates are flagged so you can merge them.'],
  services: ['Poimainō · Services', 'Thursday Bible study and Saturday church, each week. Mark the meeting held or cancelled, take attendance (unmarked is not absent), and submit. A submitted report is never overwritten: amendments make a new version.'],
  followup: ['Poimainō · Follow-up', 'Every call, message, visit and welcome, in order of when it is due. A call that wasn’t answered is “attempted”, not done. The call list prepares the calls before each service.'],
  sermons: ['Poimainō · Thursday sermons', 'From receiving the material to preaching on Thursday and reflecting on Friday. If the material comes late, the plan moves; nothing is marked failed.'],
  campaigns: ['Poimainō · Campaigns', 'The 22 campaigns, each with what it looks like at your Bacenta now and as it grows. A record linked to several campaigns still counts once.'],
  settings: ['Settings', 'You, your rhythm (the goals Spoudazō builds each day from), your daily XP goal, phone and reminders, cloud sync and push, and your data.'],
};

function Brand() {
  return (
    <a className="brand" href="#/home" aria-label="Boēthos home" title="Boēthos home">
      <Mark />
      <span>Boēthos</span>
    </a>
  );
}

// Old addresses: the retired phased plan and the pages that moved
const REDIRECT = {
  flock: { '': 'poimaino/people', visits: 'poimaino/followup/visits', leaders: 'poimaino/people/leaders', care: 'poimaino/people/care' },
  pulpit: { '': 'poimaino/sermons' },
  path: { '': 'word/study' },
  review: { '': 'home/reviews', month: 'home/calendar', health: 'home/health', achievements: 'home/achievements', activity: 'home/activity', journal: 'home/journal' },
  prayer: { scripture: 'word/journal', disciplines: 'prayer/fasting', requests: 'prayer/points' },
  word: { memory: 'word/journal' },
  library: { members: 'library', listening: 'library/messages' },
};

const SESSION = 'boethos_session';

function Shell() {
  const { state } = useStore();
  const { page, parts } = useRoute();
  const [help, setHelp] = useState(false);
  const [palette, setPalette] = useState(false);

  // Boēthos always opens on its home page; a link from a notification (?go) opens where it points
  useEffect(() => {
    let fresh = false;
    try { fresh = !sessionStorage.getItem(SESSION); sessionStorage.setItem(SESSION, '1'); } catch { /* storage blocked */ }
    const go = new URLSearchParams(window.location.search).has('go');
    if (go) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    else if (fresh && page !== 'home') window.location.replace('#/home');
  }, []);

  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(p => !p); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const red = REDIRECT[page] && (REDIRECT[page][parts[1] || ''] ?? (page === 'prayer' ? null : REDIRECT[page]['']));
  useEffect(() => { if (red) window.location.replace('#/' + red); }, [red]);
  const w = where(page, parts);

  if (!state.onboardingDone) return <Welcome />;
  if (red) return null;

  let view;
  switch (page) {
    case 'today':    view = <Today />; break;
    case 'quiet':    view = <Quiet tab={parts[1]} />; break;
    case 'prayer':   view = <Prayer tab={parts[1]} />; break;
    case 'word':     view = <Word tab={parts[1]} />; break;
    case 'library':  view = <LibraryView tab={parts[1]} />; break;
    case 'settings': view = <SettingsView />; break;
    case 'poimaino': {
      const [, p, q] = parts;
      view = !p || ['vision', 'week'].includes(p) ? <PmDashboard tab={p} />
        : p === 'settings' ? <PmSettings />
        : p === 'people' && q === 'souls' ? <PmEvangelism sub="souls" />
        : p === 'people' ? <PmPeople sub={q} />
        : p === 'outreach' ? <PmEvangelism />
        : p === 'evangelism' && q === 'invitations' ? <PmFollowUp sub="telepastoring" />
        : p === 'evangelism' ? <PmEvangelism sub={q} />
        : p === 'services' ? <PmServices sub={q} />
        : p === 'followup' ? <PmFollowUp sub={q === 'calls' ? 'telepastoring' : q} />
        : p === 'sermons' ? <PmSermons sub={q} mode={parts[3]} />
        : p === 'campaigns' ? <PmCampaigns sub={q} />
        : <PmDashboard />;
      break;
    }
    default: view = <Home tab={page === 'home' ? parts[1] : undefined} />;
  }
  const [helpTitle, helpText] = HELP[w.place] || HELP.home;
  const inSection = w.section !== 'home';
  const sec = SECTIONS.find(x => x.id === w.section);
  const places = inSection ? PLACE_SETS[w.section] : [];
  const verse = w.place === 'home' ? null : verseFor(w.place, w.sub, w.section);

  return (
    <SectionCtx.Provider value={w.section}><VerseCtx.Provider value={verse}>
      <header className={'top' + (inSection ? ' in-sec ' + w.section : '')}>
        <Brand />
        {inSection && (
          <div className="hd-sec">
            <a className="hd-id" href={sec.home} title={`${sec.label}: ${sec.gloss}`}><Mark kind={w.section} size={26} /><b>{sec.label}</b></a>
            <MainNav page={w.place} sub={w.sub} section={w.section} />
          </div>
        )}
        <FocusChip />
        <div className="hdr-tools">
          <SearchButton onClick={() => setPalette(true)} />
          <CloudStatus />
          <HelpButton onClick={() => setHelp(true)} />
          <AvatarButton on={page === 'settings'} />
        </div>
      </header>

      <main className={'sec-' + w.section}>
        <ViewBoundary key={page + parts.join('/')}>{view}</ViewBoundary>
      </main>
      <Footer page={w.place} sub={w.sub} section={w.section} />

      {inSection && (
        <nav className={'tabs n' + (places.length + 1)} aria-label={sec.label}>
          <a href="#/home" className="tab-home" aria-label="Boēthos home"><Mark size={22} /><span>Home</span></a>
          {places.map(p => {
            const Icon = p.icon;
            return <a key={p.id} href={p.base} className={w.place === p.id ? 'on' : ''}><Icon size={21} strokeWidth={1.75} />{p.id === 'poimaino' ? 'Dashboard' : p.label}</a>;
          })}
        </nav>
      )}

      <Engine />
      <CloudSync />
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
      {help && (
        <Sheet onClose={() => setHelp(false)} label="Help">
          <SheetHead eyebrow="How this page works" title={helpTitle} onClose={() => setHelp(false)} />
          <p className="prose short">{helpText}</p>
          <Verse v={verse || verseFor('home')} />
        </Sheet>
      )}
    </VerseCtx.Provider></SectionCtx.Provider>
  );
}

// One broken page should never blank the whole app.
class ViewBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card" style={{ maxWidth: 560, margin: '8vh auto' }}>
        <span className="eyebrow accent">Something went wrong</span>
        <h2 style={{ marginTop: 10 }}>This page couldn't be shown.</h2>
        <p className="muted">Your data is safe. Try another page, or reload.</p>
        <pre className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error)}</pre>
        <a className="btn primary" href={href('home')}>Go to Boēthos</a>
      </div>
    );
  }
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}
