import { useState } from 'react';
import { Plus, ArrowRight, Trash2, Check } from 'lucide-react';
import { CAMPAIGNS, MANUAL_STARTUP, SHARED_SUPPORT } from '../../data/ministry';
import { campaignProgress, addDays } from '../../store/ministry';
import { Head, Seg, Empty, TitleBlock, Picker, Bar, Sheet, SheetHead, fmtDate, useToast } from '../../lib/ui.jsx';
import { go } from '../../lib/router';
import { useM, tplOf, Label } from './common.jsx';

const STATUS = ['draft', 'active', 'paused', 'completed', 'archived', 'cancelled'];
const SCALES = [['establishing', 'Establishing'], ['operating', 'Operating'], ['developing', 'Developing']];

// The wizard: template → purpose → people/services/dates → activities → targets & budget → reminders → review
function Wizard({ template, onClose }) {
  const { m, today, addCampaign } = useM();
  const toast = useToast();
  const t = template;
  const [step, setStep] = useState(0);
  const [c, setC] = useState({
    n: t?.n || null, name: t ? t.source : '', label: t ? t.label : '', purpose: t ? t.now : '', source: t ? `${t.ch} — ${t.source}` : 'Custom',
    owner: 'You', kind: t?.kind || 'ongoing', start: today, end: '', recurrence: t?.kind === 'event' ? '' : 'weekly', participants: [], serviceScope: t && [7, 15, 17, 19, 21].includes(t.n) ? ['sat'] : t && [4, 5, 14, 18].includes(t.n) ? ['thu'] : [],
    activities: [], targets: [], budget: [], currency: m.settings.currency, reminders: true, currentAction: '', nextReview: addDays(today, 28), scale: 'establishing',
  });
  const [act, setAct] = useState({ title: '', due: addDays(today, 7), owner: 'You' });
  const [tgt, setTgt] = useState({ metric: '', unit: 'people', value: '', baseline: '', service: '' });
  const [bud, setBud] = useState({ item: '', planned: '' });
  const set = (k, v) => setC(x => ({ ...x, [k]: v }));
  const STEPS = ['Purpose', 'People and dates', 'Activities', 'Targets and budget', 'Reminders', 'Review'];
  const save = (status) => { const id = `cmp-${Date.now()}`; addCampaign({ ...c, id, status }); toast(status === 'active' ? 'Campaign active' : 'Saved as a draft'); onClose(); go('poimaino', 'campaigns', id); };
  return (
    <Sheet onClose={onClose} className="xl" label="Campaign">
      <SheetHead eyebrow={t ? `${t.ch} · ${t.source}` : 'Custom campaign'} title={`${STEPS[step]} (${step + 1} of ${STEPS.length})`} onClose={onClose} />
      <ol className="wiz-steps">{STEPS.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}><button type="button" onClick={() => setStep(i)}>{s}</button></li>)}</ol>
      {step === 0 && <div className="fields">
        <div className="field"><label>Name (source)</label><input value={c.name} onChange={e => set('name', e.target.value)} /></div>
        <div className="field"><label>Local label</label><input value={c.label} onChange={e => set('label', e.target.value)} /></div>
        <div className="field wide"><label>Purpose</label><textarea value={c.purpose} onChange={e => set('purpose', e.target.value)} style={{ minHeight: 80 }} /></div>
        {t && <div className="field wide tpl-box"><Label kind="source" /> {t.emphasis} <i>({t.ch})</i><br /><Label kind="design" /> Grow towards: {t.grow}</div>}
        <div className="field"><label>Kind</label><Picker label="Kind" value={c.kind} onChange={v => set('kind', v)} options={[{ value: 'ongoing', label: 'Ongoing (no deadline)' }, { value: 'event', label: 'Bounded event' }]} /></div>
        <div className="field"><label>Owner</label><input value={c.owner} onChange={e => set('owner', e.target.value)} /></div>
      </div>}
      {step === 1 && <div className="fields">
        <div className="field"><label>Start</label><input type="date" value={c.start} onChange={e => set('start', e.target.value)} /></div>
        <div className="field"><label>End {c.kind === 'ongoing' ? '(optional)' : ''}</label><input type="date" value={c.end} onChange={e => set('end', e.target.value)} /></div>
        <div className="field"><label>Rhythm</label><Picker label="Rhythm" value={c.recurrence} onChange={v => set('recurrence', v)} options={[{ value: '', label: 'No fixed rhythm' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Once or twice a year' }]} /></div>
        <div className="field"><label>Services</label><div className="chip-pick">{[['thu', 'Thursday'], ['sat', 'Saturday']].map(([id, l]) => <button type="button" key={id} className={c.serviceScope.includes(id) ? 'on' : ''} onClick={() => set('serviceScope', c.serviceScope.includes(id) ? c.serviceScope.filter(x => x !== id) : [...c.serviceScope, id])}>{l}</button>)}</div></div>
        <div className="field wide"><label>People involved</label><div className="chip-pick">{m.people.filter(p => !['transferred', 'departed'].includes(p.membership)).map(p => <button type="button" key={p.id} className={c.participants.includes(p.id) ? 'on' : ''} onClick={() => set('participants', c.participants.includes(p.id) ? c.participants.filter(x => x !== p.id) : [...c.participants, p.id])}>{p.name}</button>)}{!m.people.length && <span className="muted small">Add people first, or leave this empty.</span>}</div></div>
      </div>}
      {step === 2 && <div>
        <ul className="act-list">{c.activities.map((a, i) => <li key={a.id}><b>{a.title}</b><small>{a.due} · {a.owner}</small><button className="ghost sm" onClick={() => set('activities', c.activities.filter((_, j) => j !== i))}>Remove</button></li>)}</ul>
        {t && c.activities.length === 0 && <p className="muted small">Suggested first action: {t.now}</p>}
        <div className="fields"><div className="field wide"><label>Activity</label><input value={act.title} onChange={e => setAct(a => ({ ...a, title: e.target.value }))} placeholder={t ? t.now.split(';')[0] : 'What will happen'} /></div>
          <div className="field"><label>Due</label><input type="date" value={act.due} onChange={e => setAct(a => ({ ...a, due: e.target.value }))} /></div>
          <div className="field"><label>Owner</label><input value={act.owner} onChange={e => setAct(a => ({ ...a, owner: e.target.value }))} /></div></div>
        <button className="sm" disabled={!act.title.trim()} onClick={() => { set('activities', [...c.activities, { id: `a-${Date.now()}`, ...act, done: false }]); setAct({ title: '', due: addDays(today, 7), owner: 'You' }); }}><Plus size={14} />Add activity</button>
      </div>}
      {step === 3 && <div>
        <h4>Targets <small className="muted">optional; each with its unit and, for attendance, its service</small></h4>
        <ul className="act-list">{c.targets.map((x, i) => <li key={i}><b>{x.metric}: {x.value} {x.unit}</b><small>{x.baseline !== '' ? `from ${x.baseline}` : 'no baseline'}{x.service ? ` · ${x.service === 'thu' ? 'Thursday' : 'Saturday'}` : ''}</small><button className="ghost sm" onClick={() => set('targets', c.targets.filter((_, j) => j !== i))}>Remove</button></li>)}</ul>
        <div className="fields">
          <div className="field"><label>Measure</label><Picker label="Measure" value={tgt.metric} onChange={v => setTgt(x => ({ ...x, metric: v }))} options={[{ value: '', label: 'Choose…' }, ...['Unique people reached', 'Invitations', 'Confirmed invitations', 'Service attendance', 'First-time visitors', 'Visitor returns', 'Completed visits', 'Contacts reached', 'Stable members', 'Activities done'].map(x => ({ value: x, label: x }))]} /></div>
          <div className="field"><label>Target</label><input type="number" value={tgt.value} onChange={e => setTgt(x => ({ ...x, value: e.target.value }))} /></div>
          <div className="field"><label>Baseline</label><input type="number" value={tgt.baseline} onChange={e => setTgt(x => ({ ...x, baseline: e.target.value }))} /></div>
          {tgt.metric === 'Service attendance' && <div className="field"><label>Service</label><Picker label="Service" value={tgt.service} onChange={v => setTgt(x => ({ ...x, service: v }))} options={[{ value: 'thu', label: 'Thursday' }, { value: 'sat', label: 'Saturday' }]} /></div>}
        </div>
        <button className="sm" disabled={!tgt.metric || !tgt.value || (tgt.metric === 'Service attendance' && !tgt.service)} onClick={() => { set('targets', [...c.targets, tgt]); setTgt({ metric: '', unit: 'people', value: '', baseline: '', service: '' }); }}><Plus size={14} />Add target</button>
        <h4 style={{ marginTop: 18 }}>Budget <small className="muted">optional · {c.currency}</small></h4>
        <ul className="act-list">{c.budget.map((x, i) => <li key={i}><b>{x.item}</b><small>planned {x.planned}{x.actual ? ` · actual ${x.actual}` : ''}</small></li>)}</ul>
        <div className="fields"><div className="field"><label>Item</label><input value={bud.item} onChange={e => setBud(b => ({ ...b, item: e.target.value }))} placeholder="Taxi fares" /></div><div className="field"><label>Planned</label><input type="number" value={bud.planned} onChange={e => setBud(b => ({ ...b, planned: e.target.value }))} /></div></div>
        <button className="sm" disabled={!bud.item.trim()} onClick={() => { set('budget', [...c.budget, { id: `b-${Date.now()}`, ...bud, actual: '' }]); setBud({ item: '', planned: '' }); }}><Plus size={14} />Add item</button>
      </div>}
      {step === 4 && <div className="fields">
        <div className="field wide"><label className="toggle"><input type="checkbox" checked={c.reminders} onChange={e => set('reminders', e.target.checked)} />Remind me about this campaign’s activities when they are due</label></div>
        <div className="field"><label>Next review</label><input type="date" value={c.nextReview} onChange={e => set('nextReview', e.target.value)} /></div>
        <div className="field wide"><label>Current action</label><input value={c.currentAction} onChange={e => set('currentAction', e.target.value)} placeholder={t?.now} /></div>
      </div>}
      {step === 5 && <div className="review-box">
        <p><b>{c.label || c.name}</b> · {c.kind === 'ongoing' ? 'ongoing' : 'event'}{c.end ? `, until ${c.end}` : ''}</p>
        <p>{c.purpose}</p>
        <p className="muted small">{c.activities.length} activities · {c.targets.length} targets · {c.participants.length} people · services: {c.serviceScope.map(x => (x === 'thu' ? 'Thursday' : 'Saturday')).join(', ') || 'none'} · review {c.nextReview}</p>
      </div>}
      <div className="sheet-foot">
        {step > 0 && <button type="button" onClick={() => setStep(step - 1)}>Back</button>}
        <span className="grow" />
        <button type="button" onClick={() => save('draft')}>Save draft</button>
        {step < 5 ? <button type="button" className="primary" onClick={() => setStep(step + 1)}>Next</button> : <button type="button" className="primary" onClick={() => save('active')}>Activate</button>}
      </div>
    </Sheet>
  );
}

function Strategy() {
  const { m } = useM();
  const [wiz, setWiz] = useState(null);
  const byN = (n) => m.campaigns.filter(c => c.n === n && !['archived', 'cancelled'].includes(c.status));
  return (
    <>
      <p className="note-banner"><b>22 emphases, not 22 departments.</b> Each has a practical expression now, growing as Greater Love grows. One Thursday or one visit can serve several at once; it is recorded once and counted once.</p>
      <div className="camp-grid">
        {CAMPAIGNS.map(t => {
          const live = byN(t.n);
          const c = live[0];
          return (
            <article key={t.n} className={'camp-card' + (c ? ' ' + c.status : '')}>
              <div className="cc-h"><span className="cc-n">{t.n}</span><span className="cc-src">{t.ch} · {t.source}</span>{c ? <span className={'pill ' + (c.status === 'active' ? 'good' : c.status === 'paused' ? 'warn' : 'plain')}>{c.status}</span> : <span className="pill plain">Not started</span>}</div>
              <h3>{t.label}</h3>
              <p className="cc-em"><Label kind="source" /> {t.emphasis}</p>
              <p className="cc-now"><Label kind="design" /> {c?.currentAction || t.now}</p>
              <div className="cc-foot">
                {c ? <><span className="muted small">{SCALES.find(([v]) => v === c.scale)?.[1]}{c.nextReview ? ` · review ${fmtDate(c.nextReview)}` : ''}</span><a className="btn sm" href={`#/poimaino/campaigns/${c.id}`}>Open <ArrowRight size={14} /></a></>
                  : <button className="sm primary" onClick={() => setWiz(t)}>Establish</button>}
              </div>
            </article>
          );
        })}
      </div>
      <div style={{ marginTop: 18 }}><button onClick={() => setWiz('custom')}><Plus size={16} />Custom campaign</button></div>
      {wiz && <Wizard template={wiz === 'custom' ? null : wiz} onClose={() => setWiz(null)} />}
    </>
  );
}

function CampaignPage({ id }) {
  const { m, today, updateCampaign, deleteCampaign } = useM();
  const toast = useToast();
  const c = m.campaigns.find(x => x.id === id);
  const [act, setAct] = useState({ title: '', due: addDays(today, 7) });
  const [rev, setRev] = useState('');
  const [confirm, setConfirm] = useState(false);
  if (!c) return <div className="card"><Empty title="That campaign isn’t here." action={<a className="btn" href="#/poimaino/campaigns">Back</a>} /></div>;
  const t = tplOf(c);
  const pr = campaignProgress(m, c);
  const upd = (data) => updateCampaign(c.id, data);
  const shared = Object.entries(SHARED_SUPPORT).filter(([, ns]) => ns.includes(c.n)).map(([k]) => ({ thursday: 'Thursday Bible study', saturday: 'Saturday church', visit: 'pastoral visits', outreach: 'outreach' }[k]));
  return (
    <>
      <Head back={{ href: '#/poimaino/campaigns', label: 'Campaigns' }} eyebrow={t ? `${t.ch} · ${t.source}` : 'Custom'} step={c.status} title={c.label || c.name} sub={c.purpose}>
        <div className="head-actions">
          <div style={{ minWidth: 150 }}><Picker label="Status" value={c.status} onChange={v => { upd({ status: v }); toast(`Campaign ${v}`); }} options={STATUS.map(s => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} /></div>
          <div style={{ minWidth: 150 }}><Picker label="Scale" value={c.scale} onChange={v => upd({ scale: v })} options={SCALES.map(([v, l]) => ({ value: v, label: l }))} /></div>
        </div>
      </Head>
      <div className="cols">
        <div className="stack">
          <div className="card">
            <div className="card-h"><h2>Next actions</h2><span className="muted small">{pr.done} of {pr.activities} done{pr.overdue ? ` · ${pr.overdue} overdue` : ''}</span></div>
            <ul className="act-list">{(c.activities || []).map(a => (
              <li key={a.id} className={a.done ? 'done' : a.due && a.due < today ? 'late' : ''}>
                <label className="toggle"><input type="checkbox" checked={!!a.done} onChange={e => upd({ activities: c.activities.map(x => (x.id === a.id ? { ...x, done: e.target.checked, doneAt: e.target.checked ? today : '' } : x)) })} /><b>{a.title}</b></label>
                <small>{a.due ? `due ${fmtDate(a.due)}` : ''}{a.owner ? ` · ${a.owner}` : ''}</small>
                <button className="ghost sm" onClick={() => upd({ activities: c.activities.filter(x => x.id !== a.id) })}>Remove</button>
              </li>))}</ul>
            <div className="pa-form"><label>Add<input value={act.title} onChange={e => setAct(a => ({ ...a, title: e.target.value }))} placeholder="Next practical step" /></label>
              <label>Due<input type="date" value={act.due} onChange={e => setAct(a => ({ ...a, due: e.target.value }))} /></label>
              <button className="sm" disabled={!act.title.trim()} onClick={() => { upd({ activities: [...(c.activities || []), { id: `a-${Date.now()}`, ...act, owner: 'You', done: false }] }); setAct({ title: '', due: addDays(today, 7) }); }}>Add</button></div>
            {c.kind === 'event' && c.status === 'completed' && <p className="muted small">The event is complete; ongoing routines in other campaigns carry on.</p>}
          </div>
          <div className="card">
            <div className="card-h"><h2>What the records show</h2><span className="muted small">Linked records, each counted once</span></div>
            <TitleBlock className="grid" items={[['People involved', pr.people], ['Encounters', pr.encounters], ['Invitations', pr.invitations], ['Confirmed', pr.confirmed], ['Follow-ups attempted', pr.attempted], ['Reached', pr.reached], ['Visits done', `${pr.visitsDone} / ${pr.visits}`]]} />
            {(c.targets || []).length > 0 && <ul className="act-list" style={{ marginTop: 12 }}>{c.targets.map((x, i) => <li key={i}><b>{x.metric}{x.service ? ` (${x.service === 'thu' ? 'Thursday' : 'Saturday'})` : ''}</b><small>target {x.value}{x.baseline !== '' ? ` · baseline ${x.baseline}` : ''}</small></li>)}</ul>}
            <p className="muted small" style={{ margin: '10px 0 0' }}>A record linked here may also be linked to other campaigns; it still counts once in Vision 25. Linked activity is not proof that the campaign caused growth.{shared.length ? ` This emphasis is naturally served by ${shared.join(', ')}.` : ''}</p>
          </div>
          <div className="card">
            <div className="card-h"><h2>Reviews</h2>{c.nextReview && <span className="muted small">next {fmtDate(c.nextReview)}</span>}</div>
            <ul className="tl-list">{(c.reviews || []).map((r, i) => <li key={i}><span>{r.date}</span><small>{r.notes}</small></li>)}</ul>
            <textarea value={rev} onChange={e => setRev(e.target.value)} placeholder="What actually happened, unmet needs, what lacks records, lessons, the few next steps…" style={{ minHeight: 80 }} />
            <button className="sm" style={{ marginTop: 8 }} disabled={!rev.trim()} onClick={() => { upd({ reviews: [...(c.reviews || []), { date: today, notes: rev.trim() }], nextReview: addDays(today, 28) }); setRev(''); toast('Review saved; next review in 4 weeks'); }}>Save review</button>
          </div>
        </div>
        <aside className="aside">
          {t && <section><h3>From the source</h3><p className="small"><Label kind="source" /> {t.emphasis} ({t.ch})</p><p className="small"><Label kind="design" /> Now: {t.now}</p><p className="small"><Label kind="design" /> Towards 25: {t.grow}</p><p className="muted small">Records: {t.records}</p></section>}
          <section>
            <h3>Details</h3>
            <div className="fields single">
              <div className="field"><label>Current action</label><input defaultValue={c.currentAction} onBlur={e => upd({ currentAction: e.target.value })} /></div>
              <div className="field"><label>Responsible</label><input defaultValue={c.owner} onBlur={e => upd({ owner: e.target.value })} /></div>
              <div className="field"><label>Next review</label><input type="date" defaultValue={c.nextReview} onBlur={e => upd({ nextReview: e.target.value })} /></div>
              <div className="field"><label>Evidence</label><textarea defaultValue={c.evidence || ''} onBlur={e => upd({ evidence: e.target.value })} style={{ minHeight: 60 }} /></div>
              <div className="field"><label>Dependency (why it can’t move yet)</label><input defaultValue={c.dependency || ''} onBlur={e => upd({ dependency: e.target.value })} placeholder="Waiting for the church’s safeguarding approval" /></div>
            </div>
          </section>
          {(c.budget || []).length > 0 && <section><h3>Budget ({c.currency})</h3>{c.budget.map(b => <div key={b.id} className="kv"><span>{b.item}</span><span><input className="mini" defaultValue={b.actual} placeholder="actual" onBlur={e => upd({ budget: c.budget.map(x => (x.id === b.id ? { ...x, actual: e.target.value } : x)) })} /> / {b.planned}</span></div>)}</section>}
          <section><button className={'danger sm' + (confirm ? ' solid' : '')} onClick={() => { if (confirm) { deleteCampaign(c.id); go('poimaino', 'campaigns'); } else setConfirm(true); }}><Trash2 size={14} />{confirm ? 'Tap again' : 'Delete campaign'}</button></section>
        </aside>
      </div>
    </>
  );
}

function Startup() {
  const { m, today, addCampaign } = useM();
  const toast = useToast();
  const exists = m.campaigns.some(c => c.preset === 'manual-startup');
  const apply = () => {
    const end = addDays(today, 30);
    addCampaign({ id: `cmp-${Date.now()}`, preset: 'manual-startup', n: null, name: 'Manual start-up recommendations', label: 'First-month start-up plan', purpose: 'An optional, editable first-month plan from the Bacenta Manual (B p.20), mapped to Thursday fellowship and Saturday church.', source: MANUAL_STARTUP.cite, kind: 'event', start: today, end, status: 'draft',
      activities: [
        { id: 'a1', title: 'Daily prayer (the manual suggests at least two hours)', due: today, owner: 'You', done: false },
        { id: 'a2', title: 'Outreach on three weekdays, morning or evening', due: addDays(today, 6), owner: 'You', done: false },
        { id: 'a3', title: 'Calls or visits to this week’s new contacts (Friday, around Saturday church)', due: addDays(today, 5), owner: 'You', done: false },
        { id: 'a4', title: 'Invite consenting committed members to the WhatsApp teaching group', due: addDays(today, 7), owner: 'You', done: false },
        { id: 'a5', title: 'Review the first month and move to the ongoing rhythm', due: end, owner: 'You', done: false },
      ] });
    toast('Added as a draft. Edit it before activating.');
  };
  return (
    <div className="cols">
      <div className="stack">
        <div className="card">
          <div className="card-h"><h2>Manual start-up recommendations</h2><Label kind="source" /></div>
          <p className="muted">From the Bacenta Manual ({MANUAL_STARTUP.cite}). Optional and never activated for you. Greater Love isn’t assumed to be newly starting; aims are not quotas, and conversions are never inferred from counted prayers.</p>
          <h4>First month (source schedule)</h4><ul>{MANUAL_STARTUP.firstMonth.map(x => <li key={x}>{x}</li>)}</ul>
          <h4>After the first month</h4><ul>{MANUAL_STARTUP.after.map(x => <li key={x}>{x}</li>)}</ul>
          <h4>Mapped here</h4>
          <p className="small">The manual’s fellowship becomes Thursday Bible study; its main Sunday gathering becomes Saturday church. Its Saturday calls and visits move to Friday or around the service rather than onto it. Fasting is not added by default.</p>
          <button className="primary" disabled={exists} onClick={apply}>{exists ? 'Already added as a campaign' : 'Add as a draft plan'}</button>
        </div>
      </div>
    </div>
  );
}

const TABS = [['', 'Strategy (22)'], ['startup', 'Start-up preset']];
export default function Campaigns({ sub }) {
  const { m } = useM();
  if (sub && sub !== 'startup') return <CampaignPage id={sub} />;
  const t = sub || '';
  const active = m.campaigns.filter(c => c.status === 'active').length;
  return (
    <>
      <Head back={{ href: '#/poimaino', label: 'Dashboard' }} eyebrow="Poimainō" step={`${active} active`} title="Campaigns" sub="Purposeful, organised, sustained activity (D4), with the essential activities running together continuously (D5).">
        <TitleBlock items={[['Established', new Set(m.campaigns.filter(c => c.n && !['archived', 'cancelled'].includes(c.status)).map(c => c.n)).size + ' / 22'], ['Active', active]]} />
      </Head>
      <div style={{ marginBottom: 12 }}><Seg value="campaigns" onChange={(v) => (v === 'campaigns' ? null : go('poimaino', ...(v ? [v] : [])))} options={[['', 'Action centre'], ['vision', 'Vision 25'], ['week', 'Weekly review'], ['campaigns', 'Campaigns']]} /></div>
      <div style={{ marginBottom: 22 }}><Seg value={t} onChange={(v) => go('poimaino', 'campaigns', ...(v ? [v] : []))} options={TABS} /></div>
      {t === 'startup' ? <Startup /> : <Strategy />}
    </>
  );
}
