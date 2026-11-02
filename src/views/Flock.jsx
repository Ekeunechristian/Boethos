import { useState } from 'react';
import { Search, Phone, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useStore } from '../store/index.jsx';
import { MEMBER_STATUS, LEADERSHIP_STAGES, COUNSELING_TIERS } from '../data/constants';
import { MENTORING, VISIT_TYPES } from '../data/library';
import { go } from '../lib/router';
import { Seg, Head, TitleBlock, Empty, fmtDate, useToast } from '../lib/ui.jsx';
import Collection from '../components/Collection.jsx';
import EntrySheet from '../components/EntrySheet.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const daysSince = (iso) => (iso ? Math.floor((Date.now() - new Date(iso + 'T12:00').getTime()) / 86400000) : null);
const TONE = { Growing: 'good', Plateaued: '', Struggling: 'warn', Crisis: 'bad', Inactive: 'plain' };

const MEMBER_FIELDS = [
  { key: 'name', label: 'Full name', required: true, ph: 'John Smith' },
  { key: 'family', label: 'Family / household', ph: 'John & Mary Smith, 2 children' },
  { key: 'phone', label: 'Phone / contact', ph: '+44 7700…' },
  { key: 'occupation', label: 'Occupation', ph: 'Teacher, nurse, engineer…' },
  { key: 'status', label: 'Spiritual status', type: 'select', options: MEMBER_STATUS },
  { key: 'leadershipStage', label: 'Leadership stage', type: 'select', options: LEADERSHIP_STAGES.map(s => [s.id, `${s.id}. ${s.label}`]) },
  { key: 'lastContact', label: 'Last contact', type: 'date' },
  { key: 'prayerRequests', label: 'Prayer requests', type: 'textarea', ph: 'Health, family situation, spiritual struggles, career…' },
  { key: 'notes', label: 'Pastoral notes', type: 'textarea', ph: 'Background, key conversations, spiritual state…' },
];

function People() {
  const { state, sel, addMember, updateMember, deleteMember } = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const need = state.members.filter(m => m.status === 'Struggling' || m.status === 'Crisis');
  const order = { Crisis: 0, Struggling: 1, Inactive: 2, Plateaued: 3, Growing: 4 };
  const list = state.members
    .filter(m => !q || `${m.name} ${m.family || ''} ${m.occupation || ''} ${m.notes || ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5) || (a.name || '').localeCompare(b.name || ''));
  const contact = (m) => { updateMember(m.id, { lastContact: today() }); toast(`Contact with ${m.name} logged`); };

  return (
    <div className="cols">
      <div className="stack">
        {need.length > 0 && (
          <div className="pace behind">
            <div className="pace-t">
              <b>Immediate pastoral attention needed</b>
              <span>{need.map(m => `${m.name} (${m.status.toLowerCase()})`).join(', ')}. They also appear on Today until you reach them.</span>
            </div>
          </div>
        )}
        <div className="toolbar">
          <div className="j-search" style={{ flex: '1 1 260px', maxWidth: 420 }}>
            <Search size={17} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people…" aria-label="Search people" />
          </div>
          <button className="primary" onClick={() => setEditing('new')}><Plus size={18} />Add person</button>
        </div>
        <ul className="list">
          {list.length === 0 && <li><Empty title={q ? 'Nobody matches.' : 'No one yet.'} action={!q && <button onClick={() => setEditing('new')}><Plus size={16} />Add the first person</button>}><p style={{ margin: 0 }}>Know your people. You cannot shepherd people you do not know.</p></Empty></li>}
          {list.map(m => {
            const d = daysSince(m.lastContact);
            return (
              <li key={m.id} className="member-row">
                <button type="button" className="item" onClick={() => setEditing(m)}>
                  <span className="avatar sm">{(m.name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                  <span className="t">
                    <b>{m.name}</b>
                    <small>{[m.family, m.occupation, d === null ? 'no contact logged' : d === 0 ? 'contacted today' : `last contact ${d} days ago`].filter(Boolean).join(' · ')}</small>
                  </span>
                  <span className="meta"><span className={'pill ' + (TONE[m.status] || '')}>{m.status}</span></span>
                </button>
                <button type="button" className="quick" onClick={() => contact(m)} title="Quick pastoral contact: log that you reached them today" aria-label={`Log contact with ${m.name}`}><Phone size={16} /></button>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="aside">
        <section>
          <h3>Your flock</h3>
          <TitleBlock className="grid" items={[
            ['People', state.members.length],
            ['Growing', state.members.filter(m => m.status === 'Growing').length],
            ['Need attention', need.length],
            ['Visits this week', sel.week.visits],
          ]} />
        </section>
        <section>
          <h3>Spiritual status</h3>
          <ul className="status-key">{MEMBER_STATUS.map(st => <li key={st}><span className={'pill ' + (TONE[st] || '')}>{st}</span><b>{state.members.filter(m => m.status === st).length}</b></li>)}</ul>
          <p className="muted small" style={{ margin: '10px 0 0' }}>Anyone not contacted for a while shows on Today: three days for crisis, a week for struggling, a month and a half for everyone else.</p>
        </section>
      </aside>
      {editing && (
        <EntrySheet noun="person" fields={MEMBER_FIELDS} defaults={{ status: 'Growing', leadershipStage: 1 }}
          initial={editing === 'new' ? null : editing}
          onSave={(data) => (editing === 'new' ? addMember({ ...data, leadershipStage: Number(data.leadershipStage) || 1 }) : updateMember(editing.id, { ...data, leadershipStage: Number(data.leadershipStage) || 1 }))}
          onDelete={editing === 'new' ? null : () => deleteMember(editing.id)}
          onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function Visits() {
  const { state, addVisit, deleteVisit } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const list = [...state.visits].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const fields = [
    { key: 'memberId', label: 'Who', type: 'select', options: [['', 'Someone not in your list'], ...state.members.map(m => [m.id, m.name])] },
    { key: 'type', label: 'Kind of visit', type: 'select', options: VISIT_TYPES },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'notes', label: 'What happened', type: 'textarea', ph: 'What you heard, what you prayed, what you promised…' },
  ];
  return (
    <div className="cols">
      <div className="stack">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <span className="muted small">{state.visits.length} visits and calls · quarterly home visits are the minimum</span>
          <button className="primary" onClick={() => setOpen(true)}><Plus size={18} />Log a visit</button>
        </div>
        <ul className="list">
          {list.length === 0 && <li><Empty title="No visits logged yet."><p style={{ margin: 0 }}>Every household, at least once a quarter.</p></Empty></li>}
          {list.map(v => (
            <li key={v.id} className="item" style={{ cursor: 'default' }}>
              <span className="no">{fmtDate(v.date, { day: 'numeric' })}<small className="muted" style={{ display: 'block', fontSize: '.7rem' }}>{fmtDate(v.date, { month: 'short' })}</small></span>
              <span className="t"><b>{v.memberName || 'Visit'} · {v.type}</b>{v.notes && <small className="clamp">{v.notes}</small>}</span>
              <button className="ghost sm" onClick={() => deleteVisit(v.id)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="aside">
        <section>
          <h3>Visits by kind</h3>
          <ul className="status-key">{VISIT_TYPES.map(t => <li key={t}><span>{t}</span><b>{state.visits.filter(v => v.type === t).length}</b></li>)}</ul>
        </section>
      </aside>
      {open && (
        <EntrySheet noun="visit" fields={fields} defaults={{ memberId: '', type: VISIT_TYPES[0], date: today() }} initial={null}
          onSave={(data) => { const m = state.members.find(x => x.id === data.memberId); addVisit({ ...data, memberName: m?.name || data.memberName || '' }); toast('Visit logged'); }}
          onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

function Leaders() {
  const { state, addLeader, updateLeader, deleteLeader } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const fields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'stage', label: 'Current stage', type: 'select', options: LEADERSHIP_STAGES.map(s => [s.id, `${s.id}. ${s.label}`]) },
    { key: 'mentoring', label: 'Mentoring phase', type: 'select', options: MENTORING.map(m => [m.id, `${m.id}. ${m.label}`]) },
    { key: 'nextStep', label: 'Next step', ph: 'Specific next action to move them forward…', wide: true },
    { key: 'notes', label: 'Notes', type: 'textarea', ph: 'Character observations, gifts, growth areas, mentoring plan…' },
  ];
  const move = (l, by) => {
    const stage = Math.max(1, Math.min(5, (l.stage || 1) + by));
    updateLeader(l.id, { stage });
    toast(`${l.name}: ${LEADERSHIP_STAGES[stage - 1].label}`);
  };
  return (
    <div className="cols">
      <div className="stack">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <span className="muted small">A healthy church reproduces leaders.</span>
          <button className="primary" onClick={() => setEditing('new')}><Plus size={18} />Add to the pipeline</button>
        </div>
        <div className="pipeline">
          {LEADERSHIP_STAGES.map(st => {
            const people = state.leaders.filter(l => (l.stage || 1) === st.id);
            return (
              <section key={st.id} className="pipe-stage">
                <div className="pipe-h"><span className="pipe-n">{st.id}</span><b>{st.label}</b><em>{people.length}</em></div>
                <p className="pipe-d">{st.desc}</p>
                {people.map(l => (
                  <div key={l.id} className="pipe-card">
                    <button type="button" className="pipe-name" onClick={() => setEditing(l)}><b>{l.name}</b><small>{MENTORING[(l.mentoring || 1) - 1].label}{l.nextStep ? ` · next: ${l.nextStep}` : ''}</small></button>
                    <div className="pipe-btns">
                      <button className="ghost sm" disabled={(l.stage || 1) <= 1} onClick={() => move(l, -1)} aria-label="Back a stage"><ChevronLeft size={16} />Back</button>
                      <button className="sm" disabled={(l.stage || 1) >= 5} onClick={() => move(l, 1)}>Advance<ChevronRight size={16} /></button>
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
        {state.leaders.length === 0 && <div className="card"><Empty title="No one in the pipeline yet."><p style={{ margin: 0 }}>A pastor who cannot raise up leaders creates permanent dependency on himself. Who is faithful?</p></Empty></div>}
      </div>
      <aside className="aside">
        <section>
          <h3>The four-phase mentoring method</h3>
          <ol className="mentor">{MENTORING.map(m => <li key={m.id}><b>{m.label}</b><span>{m.desc}</span></li>)}</ol>
        </section>
      </aside>
      {editing && (
        <EntrySheet noun="leader" fields={fields} defaults={{ stage: 1, mentoring: 1 }} initial={editing === 'new' ? null : editing}
          onSave={(data) => { const d = { ...data, stage: Number(data.stage) || 1, mentoring: Number(data.mentoring) || 1 }; editing === 'new' ? addLeader(d) : updateLeader(editing.id, d); }}
          onDelete={editing === 'new' ? null : () => deleteLeader(editing.id)}
          onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function Care() {
  const s = useStore();
  return (
    <div className="cols">
      <div className="stack">
        <p className="note-banner"><b>Keep it anonymous.</b> Use initials or a label, never a full name: these notes stay on this device, but counselling confidences deserve care.</p>
        <Collection noun="case" items={s.state.counselingCases}
          emptyTitle="No counselling cases." emptyText="When someone comes to you with something heavy, open a case so you remember to follow up."
          sort={(a, b) => (a.status === 'Closed') - (b.status === 'Closed') || (a.nextSession || '9').localeCompare(b.nextSession || '9')}
          fields={[
            { key: 'label', label: 'Label (anonymised)', required: true, ph: 'J.M., marriage' },
            { key: 'tier', label: 'Tier', type: 'select', options: COUNSELING_TIERS.map(t => [t.id, t.label]) },
            { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Ongoing', 'Referred', 'Closed'] },
            { key: 'nextSession', label: 'Next session', type: 'date' },
            { key: 'notes', label: 'Notes', type: 'textarea', ph: 'What was shared, Scripture used, what you agreed…' },
          ]}
          defaults={{ tier: 1, status: 'Open' }}
          row={c => ({
            title: c.label, sub: [COUNSELING_TIERS.find(t => t.id === Number(c.tier))?.label, c.nextSession && `next ${fmtDate(c.nextSession)}`].filter(Boolean).join(' · '),
            meta: <span className={'pill ' + (c.status === 'Closed' ? 'plain' : c.status === 'Referred' ? 'warn' : 'now')}>{c.status}</span>,
          })}
          onAdd={(d) => s.addCase({ ...d, tier: Number(d.tier) || 1 })} onUpdate={(id, d) => s.updateCase(id, { ...d, tier: Number(d.tier) || 1 })} onDelete={s.deleteCase} />
      </div>
      <aside className="aside">
        <section>
          <h3>The three tiers</h3>
          <ol className="mentor tiers">{COUNSELING_TIERS.map(t => <li key={t.id} className={'tier-' + t.id}><b>{t.label}</b><span>{t.desc}</span></li>)}</ol>
          <p className="muted small" style={{ margin: '10px 0 0' }}>Pastors are the first responders of the soul. Know when to refer: clinical depression, addiction and trauma need professional help alongside yours.</p>
        </section>
      </aside>
    </div>
  );
}

const TABS = [['people', 'People'], ['visits', 'Visits'], ['leaders', 'Leaders'], ['care', 'Counselling']];
const INTRO = {
  people: ['The flock', 'Know your people. You cannot shepherd people you do not know.'],
  visits: ['Visits', 'House to house. Every visit and call, by date.'],
  leaders: ['The leadership pipeline', 'Raise up people who could lead without you.'],
  care: ['Counselling', 'Anonymised cases, the tiers of care, and when to refer.'],
};

export default function Flock({ tab = 'people' }) {
  const { state } = useStore();
  const t = INTRO[tab] ? tab : 'people';
  const need = state.members.filter(m => m.status === 'Struggling' || m.status === 'Crisis').length;
  return (
    <>
      <Head eyebrow="Flock" step={need ? `${need} need you` : undefined} title={INTRO[t][0]} sub={INTRO[t][1]}>
        <TitleBlock items={[['People', state.members.length], ['Visits', state.visits.length], ['Leaders', state.leaders.length]]} />
      </Head>
      <div style={{ marginBottom: 24 }}><Seg value={t} onChange={(v) => go('flock', ...(v === 'people' ? [] : [v]))} options={TABS} /></div>
      {t === 'people' && <People />}
      {t === 'visits' && <Visits />}
      {t === 'leaders' && <Leaders />}
      {t === 'care' && <Care />}
    </>
  );
}
