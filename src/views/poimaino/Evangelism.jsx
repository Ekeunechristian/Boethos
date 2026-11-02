import { useState } from 'react';
import { Search, Plus, Church, Footprints, HandHeart, MapPin, Globe, ArrowRight } from 'lucide-react';
import { MEMBERSHIP } from '../../data/ministry';
import { membershipLabel, teleWeek, areaOf, areaLabel, soulSource, onSoulList, AREAS } from '../../store/ministry';
import { Head, Seg, TitleBlock, Empty } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useM } from './common.jsx';
import { Encounters } from './Outreach.jsx';
import { Row, PersonForm, FollowSheet } from './People.jsx';

const SOURCES = [['church', 'Came to church', Church, 'From People: everyone who has attended at least once'], ['encounter', 'Met on evangelism', Footprints, 'From your encounters, until they come'], ['added', 'Added by you', HandHeart, 'Friends, family, people far away, anyone you pray for']];
const CATS = [['', 'All'], ...MEMBERSHIP.filter(x => !['transferred', 'departed'].includes(x.id)).map(x => [x.id, x.id === 'prayer' ? 'I pray for' : x.id === 'stable' ? 'Stable' : x.id === 'returning' ? 'Returning' : x.label + 's'])];

// Soul list: everyone from People, everyone from your encounters, and anyone else you pray for
function Souls() {
  const { m, index, today } = useM();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [area, setArea] = useState('');
  const [src, setSrc] = useState('');
  const [adding, setAdding] = useState(false);
  const [follow, setFollow] = useState(null);
  const base = m.people.filter(onSoulList);
  const srcOf = Object.fromEntries(base.map(p => [p.id, soulSource(m, p, index)]));
  const pass = (p, c = cat, a = area, s = src) => (!c || p.membership === c) && (!a || areaOf(p) === a) && (!s || srcOf[p.id] === s);
  let list = base.filter(p => pass(p));
  if (q) list = list.filter(p => `${p.name} ${p.location || ''} ${p.country || ''} ${p.notes || ''}`.toLowerCase().includes(q.toLowerCase()));
  list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  const abroad = base.filter(p => areaOf(p) === 'abroad');
  const countries = Object.entries(abroad.reduce((o, p) => { const c = p.country || 'Country not set'; o[c] = (o[c] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]);
  const tw = teleWeek(m, today);
  return (
    <>
      <div className="pr-bar">
        <div className="j-search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your soul list…" aria-label="Search the soul list" /></div>
        <button className="primary" onClick={() => setAdding(true)}><Plus size={18} />Add to soul list</button>
      </div>
      <div className="sl-filters">
        <div className="pr-chips" role="group" aria-label="Who">{CATS.map(([c, l]) => { const n = base.filter(p => pass(p, c)).length; return <button key={c} type="button" className={cat === c ? 'on' : ''} onClick={() => setCat(c)} disabled={!n && c !== ''}>{l}<em>{n}</em></button>; })}</div>
        <div className="sl-where" role="group" aria-label="Where">{[['', 'Everywhere'], ...AREAS].map(([a, l]) => <button key={a} type="button" className={area === a ? 'on' : ''} onClick={() => setArea(a)}>{a === 'abroad' ? <Globe size={14} /> : <MapPin size={14} />}{l}</button>)}</div>
      </div>
      <div className="cols">
        <div className="stack">
          <ul className="pr-list card">
            {list.length === 0 && <li className="pr-empty"><Empty title={q || cat || area || src ? 'Nobody matches.' : 'Your soul list is empty.'}><p style={{ margin: 0 }}>It fills itself from People and from your encounters. Add anyone else you want to pray for here.</p></Empty></li>}
            {list.map(p => {
              const S = SOURCES.find(x => x[0] === srcOf[p.id]); const Ic = S[2];
              return <Row key={p.id} p={p} onFollow={setFollow}
                sub={<span className="sl-sub"><span className={'sl-src ' + S[0]}><Ic size={13} />{S[1]}</span><span>{areaLabel(p)}{p.location ? `, ${p.location}` : ''}</span></span>}
                pill={<span className={'pr-pill m-' + p.membership}>{membershipLabel(p.membership)}</span>} />;
            })}
          </ul>
        </div>
        <aside className="aside even">
          <section>
            <h3>Three ways onto the list</h3>
            <div className="sl-ways">{SOURCES.map(([id, l, Ic, d]) => { const n = base.filter(p => srcOf[p.id] === id).length; return (
              <button key={id} type="button" className={'sl-way ' + id + (src === id ? ' on' : '')} onClick={() => setSrc(src === id ? '' : id)}>
                <span className="sl-way-ic"><Ic size={17} /></span><span className="sl-way-t"><b>{l}</b><small>{d}</small></span><em>{n}</em>
              </button>
            ); })}</div>
          </section>
          <section>
            <h3>Where they are</h3>
            <ul className="sl-places">
              <li><span>Birmingham</span><b>{base.filter(p => areaOf(p) === 'bham').length}</b></li>
              <li><span>Elsewhere in the UK</span><b>{base.filter(p => areaOf(p) === 'uk').length}</b></li>
              <li><span>Outside the UK</span><b>{abroad.length}</b></li>
              {countries.map(([c, n]) => <li key={c} className="sub"><span>{c}</span><b>{n}</b></li>)}
            </ul>
          </section>
          <a className={'sl-inv' + (tw.some(r => r.state !== 'done') ? ' due' : '')} href="#/poimaino/followup/telepastoring">
            <span><b>Telepastoring</b><small>{tw.filter(r => r.state === 'done').length} of {tw.length} reached this week</small></span><ArrowRight size={17} />
          </a>
        </aside>
      </div>
      {adding && <PersonForm soul onClose={() => setAdding(false)} />}
      {follow && <FollowSheet person={follow} onClose={() => setFollow(null)} />}
    </>
  );
}

const TABS = [['', 'Encounters'], ['souls', 'Soul list']];
export default function Evangelism({ sub }) {
  const { m, today } = useM();
  const t = TABS.some(([id]) => id === sub) ? sub : '';
  const todayN = m.encounters.filter(e => e.date === today).length;
  const tw = teleWeek(m, today);
  return (
    <>
      <Head eyebrow="Poimainō" step={todayN ? `${todayN} reached today` : 'Not yet today'} title="Evangelism" sub="Every day, someone new: the gospel shared, a soul prayed for, everyone telepastored each week.">
        <TitleBlock items={[['Today', todayN], ['This month', m.encounters.filter(e => e.date.startsWith(today.slice(0, 7))).length], ['Soul list', m.people.filter(onSoulList).length], ['Telepastored this week', `${tw.filter(r => r.state === 'done').length} / ${tw.length}`]]} />
      </Head>
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('poimaino', 'evangelism', ...(v ? [v] : []))} options={TABS} /></div>
      {t === '' && <Encounters />}
      {t === 'souls' && <Souls />}
    </>
  );
}
