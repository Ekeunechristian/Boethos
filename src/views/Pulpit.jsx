import { useStore } from '../store/index.jsx';
import { SERMON_TYPES } from '../data/constants';
import { Head, TitleBlock, Bar, fmtDate } from '../lib/ui.jsx';
import Collection from '../components/Collection.jsx';

const PROCESS = [
  ['Exegesis', 'What did the author mean to the original audience?'],
  ['The big idea', 'One clear sentence that the whole sermon drives toward.'],
  ['Structure', 'Points emerge from the text, not imported into it.'],
  ['Illustration', 'Real life, not abstract. Make truth visible.'],
  ['Application', 'Specific, concrete, actionable. Not "read your Bible".'],
  ['Delivery and review', 'Note what connected. Log prep hours. Review afterwards.'],
];

export default function Pulpit() {
  const s = useStore();
  const { state } = s;
  const delivered = state.sermons.filter(x => x.delivered);
  const preparing = state.sermons.filter(x => !x.delivered);
  const hours = delivered.map(x => Number(x.prepHours) || 0).filter(Boolean);
  const avg = hours.length ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : '—';
  const expository = delivered.filter(x => /Expository/.test(x.type || '')).length;
  const expPct = delivered.length ? Math.round((expository / delivered.length) * 100) : 0;

  return (
    <>
      <Head eyebrow="Pulpit" step={preparing.length ? `${preparing.length} in preparation` : undefined} title="Preach the Word"
        sub="Every sermon from first idea to delivery. Expository preaching is the primary act of pastoral ministry.">
        <TitleBlock items={[['Sermons', state.sermons.length], ['Preached', delivered.length], ['Avg prep', avg === '—' ? avg : `${avg}h`]]} />
      </Head>
      <div className="cols">
        <div className="stack">
          <Collection noun="sermon" items={state.sermons}
            emptyTitle="No sermons yet." emptyText="Start your annual preaching plan: one book of the Bible, passage by passage."
            sort={(a, b) => (a.delivered - b.delivered) || (a.date || '').localeCompare(b.date || '')}
            fields={[
              { key: 'title', label: 'Title', required: true },
              { key: 'passage', label: 'Passage', ph: 'Mark 4:35–41' },
              { key: 'series', label: 'Series', ph: 'Mark: The Servant King' },
              { key: 'type', label: 'Type', type: 'select', options: SERMON_TYPES },
              { key: 'date', label: 'Date preached or planned', type: 'date' },
              { key: 'prepHours', label: 'Prep hours', type: 'number' },
              { key: 'bigIdea', label: 'The big idea (one sentence)', type: 'textarea', ph: 'One clear sentence that the whole sermon drives toward.' },
              { key: 'application', label: 'Application (specific and concrete)', type: 'textarea', ph: 'Specific, concrete, actionable. Not "read your Bible".' },
              { key: 'notes', label: 'Study notes', type: 'textarea', ph: 'Exegesis: what did the author mean to the original audience?' },
              { key: 'delivered', label: 'Delivered', type: 'checkbox' },
            ]}
            defaults={{ type: SERMON_TYPES[0], delivered: false, prepHours: 0, date: new Date().toISOString().slice(0, 10) }}
            row={x => ({
              title: x.title,
              sub: [x.passage, x.series, x.date && fmtDate(x.date, { day: 'numeric', month: 'short', year: 'numeric' }), x.bigIdea].filter(Boolean).join(' · '),
              meta: x.delivered
                ? <span className="pill good">Preached</span>
                : <span className="prep-meter" title={`${x.prepHours || 0} of 10–15 hours`}><Bar pct={Math.min(100, ((Number(x.prepHours) || 0) / 12) * 100)} /><small>{Number(x.prepHours) || 0}h</small></span>,
            })}
            onAdd={(d) => s.addSermon({ ...d, prepHours: Number(d.prepHours) || 0 })}
            onUpdate={(id, d) => s.updateSermon(id, { ...d, prepHours: Number(d.prepHours) || 0 })}
            onDelete={s.deleteSermon} />
        </div>
        <aside className="aside">
          <section>
            <h3>Sermon preparation (10–15 hours)</h3>
            <ol className="mentor">{PROCESS.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ol>
            <p className="muted small" style={{ margin: '10px 0 0' }}>The next sermon to prepare appears on Today as a block of 1½ hours; ticking it adds the hours here.</p>
          </section>
          <section>
            <h3>Expository share</h3>
            <div className="kv" style={{ padding: '0 0 8px' }}><span>Of the sermons you preached</span><b>{expPct}%</b></div>
            <Bar pct={expPct} />
            <p className="muted small" style={{ margin: '10px 0 0' }}>70% or more should work consecutively through a book of the Bible.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
