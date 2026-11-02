import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { meetingList, typeLabel, addDays, duplicates, blankPerson, meetingKey, membershipLabel, AREAS } from '../../store/ministry';
import { Head, Empty, Picker, fmtDate, useToast } from '../../lib/ui.jsx';
import { useM, CampaignLinks } from './common.jsx';

// One encounter, saved once: the person, what actually happened, and the next steps scheduled from it.
function EncounterForm({ onDone }) {
  const { m, today, addPerson, updatePerson, addEncounter, invite, addFollow } = useM();
  const toast = useToast();
  const upcoming = meetingList(m, today, 0).filter(x => x.date >= today && x.status !== 'cancelled').slice(0, 4);
  const [f, setF] = useState({ personId: '', newName: '', phone: '', area: 'bham', country: '', date: today, place: '', owner: 'You', scriptures: '', testimony: '',
    gospel: false, invited: false, profession: false, response: '', channel: '', inviteKey: upcoming[0]?.key || '', pray: true, contactOn: addDays(today, 2), next: '', campaignIds: [] });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const draft = { ...blankPerson(f.newName, today), name: f.newName, phone: f.phone };
  const dups = !f.personId && f.newName.trim() ? duplicates(m, null, draft) : [];
  const save = (e) => {
    e.preventDefault();
    let personId = f.personId;
    if (!personId) {
      const p = { ...blankPerson(f.newName.trim(), today), phone: f.phone, area: f.area, country: f.area === 'abroad' ? f.country : '', channel: f.channel, firstContact: f.date, outreach: f.invited ? 'Invited' : 'Contacted' };
      addPerson(p, 'Met through outreach'); personId = p.id;
    } else if (f.invited) updatePerson(personId, { outreach: 'Invited' });
    addEncounter({ personId, date: f.date, place: f.place, owner: f.owner, scriptures: f.scriptures, testimony: f.testimony, gospel: f.gospel, invited: f.invited, profession: f.profession, response: f.response, campaignIds: f.campaignIds });
    if (f.invited && f.inviteKey) invite({ personId, meetingKey: f.inviteKey, campaignIds: f.campaignIds });
    if (f.pray) addFollow({ key: `pray-${personId}-${f.date}`, personId, kind: 'prayer', title: 'Pray for them by name', due: f.date, campaignIds: f.campaignIds });
    if (f.contactOn) addFollow({ key: `contact-${personId}-${f.contactOn}`, personId, kind: f.channel === 'WhatsApp' ? 'message' : 'call', title: f.next || 'Follow up after outreach', due: f.contactOn, campaignIds: f.campaignIds });
    toast('Encounter saved, with next steps scheduled');
    onDone();
  };
  return (
    <form className="card enc-form" onSubmit={save}>
      <div className="card-h"><h2>Record an encounter</h2><span className="muted small">Saved once, linked to as many campaigns as it served</span></div>
      <div className="fields">
        <div className="field wide"><label>Who</label>
          <Picker label="Who" value={f.personId} onChange={v => set('personId', v)} options={[{ value: '', label: 'Someone new' }, ...m.people.map(p => ({ value: p.id, label: p.name, meta: membershipLabel(p.membership) }))]} />
        </div>
        {!f.personId && <>
          <div className="field"><label htmlFor="en-name">Name</label><input id="en-name" value={f.newName} onChange={e => set('newName', e.target.value)} required={!f.personId} /></div>
          <div className="field"><label htmlFor="en-phone">Phone (only if they gave it)</label><input id="en-phone" value={f.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" /></div>
          <div className="field wide"><label>Where they live</label><div className="pf-area" role="group" aria-label="Where they live">{AREAS.map(([v, l]) => <button key={v} type="button" className={f.area === v ? 'on' : ''} onClick={() => set('area', v)}>{l}</button>)}</div></div>
          {f.area === 'abroad' && <div className="field"><label htmlFor="en-country">Country</label><input id="en-country" value={f.country} onChange={e => set('country', e.target.value)} placeholder="Cameroon" /></div>}
          {dups.length > 0 && <div className="field wide dup-warn"><b>Already recorded?</b> {dups.map(d => <button type="button" key={d.id} className="linklike" onClick={() => set('personId', d.id)}>{d.name}</button>)} — choose them above instead of creating a second record.</div>}
        </>}
        <div className="field"><label htmlFor="en-date">When</label><input id="en-date" type="date" value={f.date} max={today} onChange={e => set('date', e.target.value)} /></div>
        <div className="field"><label htmlFor="en-place">Where you met</label><input id="en-place" value={f.place} onChange={e => set('place', e.target.value)} placeholder="Bus stop on High St; campus" /></div>
        <div className="field"><label htmlFor="en-scr">Scriptures used</label><input id="en-scr" value={f.scriptures} onChange={e => set('scriptures', e.target.value)} placeholder="John 3:16; Romans 10:9" /></div>
        <div className="field"><label htmlFor="en-test">Testimony topic (optional)</label><input id="en-test" value={f.testimony} onChange={e => set('testimony', e.target.value)} /></div>
        <div className="field wide checks">
          <label className="toggle"><input type="checkbox" checked={f.gospel} onChange={e => set('gospel', e.target.checked)} />A gospel conversation happened</label>
          <label className="toggle"><input type="checkbox" checked={f.invited} onChange={e => set('invited', e.target.checked)} />I invited them to a meeting</label>
          <label className="toggle"><input type="checkbox" checked={f.profession} onChange={e => set('profession', e.target.checked)} />They reported a profession of faith</label>
        </div>
        {f.invited && <div className="field wide"><label>Invited to</label><Picker label="Meeting" value={f.inviteKey} onChange={v => set('inviteKey', v)} options={upcoming.map(x => ({ value: x.key, label: `${typeLabel(m, x.type)} · ${fmtDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}` }))} /></div>}
        <div className="field wide"><label htmlFor="en-resp">Their response, as they put it</label><input id="en-resp" value={f.response} onChange={e => set('response', e.target.value)} placeholder="Interested, wants to read John; not now, but happy to talk again…" /></div>
        <div className="field"><label>How they’d like to be contacted</label><Picker label="Channel" value={f.channel} onChange={v => set('channel', v)} options={['', 'Call', 'WhatsApp', 'SMS', 'In person', 'Declined contact'].map(x => ({ value: x, label: x || 'Not stated' }))} /></div>
        <div className="field"><label htmlFor="en-on">Contact them on</label><input id="en-on" type="date" value={f.contactOn} min={today} disabled={f.channel === 'Declined contact'} onChange={e => set('contactOn', e.target.value)} /></div>
        <div className="field wide"><label htmlFor="en-next">Next action</label><input id="en-next" value={f.next} onChange={e => set('next', e.target.value)} placeholder="Send the John reading plan; offer a lift on Saturday" /></div>
        <div className="field wide"><label className="toggle"><input type="checkbox" checked={f.pray} onChange={e => set('pray', e.target.checked)} />Add them to my prayer follow-ups</label></div>
        <div className="field wide"><label>Campaigns this served</label><CampaignLinks m={m} value={f.campaignIds} onChange={v => set('campaignIds', v)} /></div>
      </div>
      <p className="muted small">A conversation, an invitation and a reported profession are recorded separately. None of them is inferred from the others, from a church visit, or from a prayer checkbox.</p>
      <div className="row-btns"><button type="submit" className="primary" disabled={!f.personId && !f.newName.trim()}>Save encounter</button><button type="button" className="ghost" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export function Encounters() {
  const { m, today, deleteEncounter } = useM();
  const [adding, setAdding] = useState(false);
  const list = [...m.encounters].sort((a, b) => b.date.localeCompare(a.date));
  const since = addDays(today, -30);
  const recent = list.filter(e => e.date >= since);
  const name = (id) => m.people.find(p => p.id === id)?.name || 'Removed person';
  return (
    <>
      <div className="cols">
        <div className="stack">
          {adding ? <EncounterForm onDone={() => setAdding(false)} /> : <button className="primary big" style={{ alignSelf: 'flex-start' }} onClick={() => setAdding(true)}><Plus size={18} />Record an encounter</button>}
          <div className="card">
            <div className="card-h"><h2>Encounters</h2><span className="muted small">{list.length}</span></div>
            {list.length === 0 ? <Empty title="No encounters yet."><p style={{ margin: 0 }}>After each outreach, record who you met and what actually happened.</p></Empty> : (
              <ul className="log-list">{list.map(e => (
                <li key={e.id}>
                  <span className="ll-n">{fmtDate(e.date, { day: 'numeric' })}<small>{fmtDate(e.date, { month: 'short' })}</small></span>
                  <span className="t"><b><a href={`#/poimaino/people/${e.personId}`}>{name(e.personId)}</a>{e.place ? ` · ${e.place}` : ''}</b>
                    <small>{[e.gospel && 'gospel conversation', e.invited && 'invited', e.profession && 'reported a profession of faith', e.response && `“${e.response}”`].filter(Boolean).join(' · ') || 'Met'}</small>
                    {(nx => nx.length > 0 && <em className="enc-next">Still to do: {nx.map(f => `${f.kind === 'prayer' ? 'pray' : f.kind === 'message' ? 'message' : 'call'} ${f.due === today ? 'today' : fmtDate(f.due, { weekday: 'short', day: 'numeric' })}`).join(' · ')}</em>)(m.followUps.filter(f => f.personId === e.personId && ['planned', 'attempted'].includes(f.status) && f.due).sort((x, y) => x.due.localeCompare(y.due)))}</span>
                  <button className="ghost sm" onClick={() => deleteEncounter(e.id)} aria-label="Delete encounter"><Trash2 size={14} /></button>
                </li>))}</ul>
            )}
          </div>
        </div>
        <aside className="aside even">
          <section>
            <h3>Last 30 days</h3>
            <div className="kv"><span>Encounters</span><b>{recent.length}</b></div>
            <div className="kv"><span>People reached</span><b>{new Set(recent.map(e => e.personId)).size}</b></div>
            <div className="kv"><span>Gospel conversations</span><b>{recent.filter(e => e.gospel).length}</b></div>
            <div className="kv"><span>Invitations</span><b>{m.invitations.filter(i => i.date >= since).length}</b></div>
            <div className="kv"><span>Reported professions</span><b>{recent.filter(e => e.profession).length}</b></div>
            <p className="muted small" style={{ margin: '10px 0 0' }}>Everyone you meet goes onto your soul list. Once they come to church, they appear under People too.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
