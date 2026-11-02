import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { allTopics } from '../store/life';
import { CAMPAIGNS } from '../data/ministry';
import { membershipLabel } from '../store/ministry';
import { href } from '../lib/router';

// Every place and everything you have recorded, reachable by typing a few letters.
const PAGES = [
  ['Boēthos', 'home'], ['Boēthos: activity', 'home/activity'], ['Boēthos: calendar', 'home/calendar'], ['Boēthos: achievements', 'home/achievements'],
  ['Boēthos: weekly review', 'home/reviews'], ['Boēthos: journal', 'home/journal'], ['Boēthos: health of the ministry', 'home/health'],
  ['Spoudazō: today', 'today'], ['Spoudazō: quiet time', 'quiet'], ['Spoudazō: quiet time journal', 'quiet/journal'], ['Spoudazō: character', 'quiet/character'],
  ['Spoudazō: prayer log', 'prayer'], ['Spoudazō: prayer points', 'prayer/points'], ['Spoudazō: fasting', 'prayer/fasting'],
  ['Spoudazō: Bible reading', 'word'], ['Spoudazō: study topics', 'word/study'], ['Spoudazō: Word journal', 'word/journal'],
  ['Spoudazō: reading', 'library'], ['Spoudazō: messages', 'library/messages'], ['Spoudazō: camps', 'library/camps'], ['Spoudazō: library journal', 'library/journal'],
  ['Poimainō: dashboard', 'poimaino'], ['Poimainō: Vision 25', 'poimaino/vision'], ['Poimainō: weekly review', 'poimaino/week'], ['Poimainō: settings', 'poimaino/settings'],
  ['Poimainō: people', 'poimaino/people'], ['Poimainō: soul list', 'poimaino/people/souls'], ['Poimainō: outreach', 'poimaino/outreach'], ['Poimainō: workers', 'poimaino/people/workers'], ['Poimainō: care', 'poimaino/people/care'],
  ['Poimainō: services', 'poimaino/services'], ['Poimainō: trends', 'poimaino/services/trends'], ['Poimainō: follow-up', 'poimaino/followup'], ['Poimainō: visits', 'poimaino/followup/visits'],
  ['Poimainō: call list', 'poimaino/followup/calls'], ['Poimainō: Thursday sermons', 'poimaino/sermons'], ['Poimainō: campaigns', 'poimaino/campaigns'], ['Poimainō: start-up preset', 'poimaino/campaigns/startup'],
  ['Settings', 'settings'], ['Settings: your rhythm', 'settings'],
];

export default function CommandPalette({ onClose }) {
  const { state, sel } = useStore();
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const input = useRef(null);
  const list = useRef(null);

  const index = useMemo(() => [
    ...PAGES.map(([label, to]) => ({ kind: 'Go to', label, to: '#/' + to })),
    // Poimainō: names and public fields only. Restricted notes and care needs are never searchable.
    ...state.ministry.people.map(p => ({ kind: 'Person', label: `${p.name} · ${membershipLabel(p.membership)}`, to: `#/poimaino/people/${p.id}` })),
    ...state.ministry.sermons.map(x => ({ kind: 'Sermon', label: `${x.title || 'Untitled'}${x.scriptures ? ` · ${x.scriptures}` : ''}${x.date ? ` · ${x.date}` : ''}`, to: `#/poimaino/sermons/${x.id}` })),
    ...state.ministry.campaigns.map(c => ({ kind: 'Campaign', label: `${c.label || c.name} · ${c.status}`, to: `#/poimaino/campaigns/${c.id}` })),
    ...CAMPAIGNS.map(t => ({ kind: `Campaign ${t.n}`, label: `${t.label} (${t.source})`, to: '#/poimaino/campaigns' })),
    ...state.prayerRequests.map(r => ({ kind: r.answered ? 'Answered prayer' : 'Prayer request', label: r.text || r.request || r.person, to: '#/prayer/points' })),
    ...state.scriptureMemory.map(x => ({ kind: 'Scripture', label: x.reference, to: '#/word/journal' })),
    ...allTopics(state.life).map(t => ({ kind: 'Study topic', label: t.title, to: '#/word/study' })),
    ...state.life.books.map(b => ({ kind: b.for === 'members' ? 'Book for members' : 'Book', label: `${b.title}${b.author ? ` · ${b.author}` : ''}`, to: '#/library' })),
    ...state.life.listening.map(x => ({ kind: x.kind === 'camp' ? 'Camp' : 'Message', label: `${x.title}${x.speaker ? ` · ${x.speaker}` : ''}`, to: x.kind === 'camp' ? '#/library/camps' : '#/library/messages' })),
  ], [state]);

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = (words.length ? index.filter(it => words.every(w => `${it.label} ${it.kind}`.toLowerCase().includes(w))) : index.slice(0, PAGES.length)).slice(0, 40);

  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => setHi(0), [q]);
  useEffect(() => { list.current?.children[hi]?.scrollIntoView({ block: 'nearest' }); }, [hi]);

  const open = (it) => {
    if (!it) return;
    if (it.external) window.open(it.to, '_blank', 'noopener');
    else window.location.hash = it.to.slice(1);
    onClose();
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(results.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); open(results[hi]); }
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div className="palette-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search">
        <div className="pal-in">
          <Search size={18} />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search pages, topics, books, people, sermons…" aria-label="Search" />
          <kbd>esc</kbd>
        </div>
        <ul className="pal-list" ref={list} role="listbox">
          {results.length === 0 && <li className="pal-empty">Nothing matches “{q}”.</li>}
          {results.map((it, i) => (
            <li key={it.kind + it.label + i} role="option" aria-selected={i === hi} className={i === hi ? 'hi' : ''} onMouseEnter={() => setHi(i)} onMouseDown={(e) => { e.preventDefault(); open(it); }}>
              <span className="pal-kind">{it.kind}</span>
              <span className="pal-label">{it.label}</span>
              {i === hi && <CornerDownLeft size={14} className="pal-enter" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
