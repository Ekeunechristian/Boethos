import { useMemo } from 'react';
import { useStore } from '../../store/index.jsx';
import { localDay, localTime, presenceIndex } from '../../store/ministry';
import { CAMPAIGNS } from '../../data/ministry';
import { Picker } from '../../lib/ui.jsx';

// Everything a Poimainō page needs: the ministry data, "today" in your timezone, and its actions.
export function useM() {
  const { state, dispatch } = useStore();
  const m = state.ministry;
  const tz = m.settings.timezone;
  const today = localDay(tz);
  const now = localTime(tz);
  const index = useMemo(() => presenceIndex(m), [m.meetings]);
  const act = useMemo(() => ({
    settings: (data) => dispatch({ type: 'M_SETTINGS', data }),
    addPerson: (data, reason) => dispatch({ type: 'M_PERSON_ADD', data, reason }),
    updatePerson: (id, data, reason, notes) => dispatch({ type: 'M_PERSON_UPDATE', id, data, reason, notes }),
    deletePerson: (id) => dispatch({ type: 'M_PERSON_DELETE', id }),
    merge: (into, from) => dispatch({ type: 'M_PERSON_MERGE', into, from }),
    addRestricted: (id, kind, data) => dispatch({ type: 'M_RESTRICTED_ADD', id, kind, data }),
    updateRestricted: (id, kind, itemId, data) => dispatch({ type: 'M_RESTRICTED_UPDATE', id, kind, itemId, data }),
    deleteRestricted: (id, kind, itemId) => dispatch({ type: 'M_RESTRICTED_DELETE', id, kind, itemId }),
    addPrayer: (id, data) => dispatch({ type: 'M_PRAYER_ADD', id, data }),
    updatePrayer: (id, itemId, data) => dispatch({ type: 'M_PRAYER_UPDATE', id, itemId, data }),
    addEncounter: (data) => dispatch({ type: 'M_ENCOUNTER_ADD', data }),
    updateEncounter: (id, data) => dispatch({ type: 'M_ENCOUNTER_UPDATE', id, data }),
    deleteEncounter: (id) => dispatch({ type: 'M_ENCOUNTER_DELETE', id }),
    invite: (data) => dispatch({ type: 'M_INVITE_ADD', data }),
    updateInvite: (id, data) => dispatch({ type: 'M_INVITE_UPDATE', id, data }),
    deleteInvite: (id) => dispatch({ type: 'M_INVITE_DELETE', id }),
    setMeeting: (key, data) => dispatch({ type: 'M_MEETING_SET', key, data }),
    attend: (key, personId, value) => dispatch({ type: 'M_ATTEND', key, personId, value }),
    transport: (key, personId, value) => dispatch({ type: 'M_TRANSPORT', key, personId, value }),
    submit: (key, note) => dispatch({ type: 'M_SUBMIT', key, note }),
    addFollow: (data) => dispatch({ type: 'M_FOLLOW_ADD', data }),
    updateFollow: (id, data) => dispatch({ type: 'M_FOLLOW_UPDATE', id, data }),
    deleteFollow: (id) => dispatch({ type: 'M_FOLLOW_DELETE', id }),
    resolve: (id, status, extra = {}) => dispatch({ type: 'M_FOLLOW_RESOLVE', id, status, ...extra }),
    pvci: (data) => dispatch({ type: 'M_PVCI', ...data }),
    tele: (data) => dispatch({ type: 'M_TELE', ...data }),
    spreadCallDays: () => dispatch({ type: 'M_CALLDAYS_SPREAD' }),
    chatPlan: (date, text) => dispatch({ type: 'M_CHAT_PLAN', date, text }),
    chatPost: (text) => dispatch({ type: 'M_CHAT_POST', text }),
    chatDelete: (id) => dispatch({ type: 'M_CHAT_DELETE', id }),
    addSermon: (data) => dispatch({ type: 'M_SERMON_ADD', data }),
    updateSermon: (id, data) => dispatch({ type: 'M_SERMON_UPDATE', id, data }),
    sermonStage: (id, stage, done) => dispatch({ type: 'M_SERMON_STAGE', id, stage, done }),
    deleteSermon: (id) => dispatch({ type: 'M_SERMON_DELETE', id }),
    addCampaign: (data) => dispatch({ type: 'M_CAMPAIGN_ADD', data }),
    updateCampaign: (id, data) => dispatch({ type: 'M_CAMPAIGN_UPDATE', id, data }),
    deleteCampaign: (id) => dispatch({ type: 'M_CAMPAIGN_DELETE', id }),
    alert: (key, data) => dispatch({ type: 'M_ALERT', key, data }),
    weekNote: (week, data) => dispatch({ type: 'M_WEEK_NOTE', week, data }),
    delivery: (data) => dispatch({ type: 'M_DELIVERY_ADD', data }),
  }), [dispatch]);
  return { m, tz, today, now, index, ...act };
}

export const personName = (m, id, fallback) => m.people.find(p => p.id === id)?.name || fallback || 'Unknown';

// Choose a person (or nobody)
export function PersonPicker({ m, value, onChange, label = 'Person', allowNone = true, filter }) {
  const people = (filter ? m.people.filter(filter) : m.people).slice().sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Picker label={label} value={value || ''} onChange={onChange} placeholder="Choose someone…"
      options={[...(allowNone ? [{ value: '', label: 'Nobody / not in the list' }] : []), ...people.map(p => ({ value: p.id, label: p.name, meta: p.membership }))]} />
  );
}

// Link a record to campaigns (one record, several emphases, counted once)
export function CampaignLinks({ m, value = [], onChange }) {
  const active = m.campaigns.filter(c => ['active', 'draft', 'paused'].includes(c.status));
  if (!active.length) return <p className="muted small" style={{ margin: 0 }}>No campaigns yet. Records can be linked once you start one.</p>;
  return (
    <div className="chip-pick">
      {active.map(c => {
        const on = value.includes(c.id);
        return <button key={c.id} type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => onChange(on ? value.filter(x => x !== c.id) : [...value, c.id])}>{c.label || c.name}</button>;
      })}
    </div>
  );
}

export const tplOf = (c) => CAMPAIGNS.find(t => t.n === c.n);

// A tel: link that only records a call once you say it happened
export function telHref(phone) { return phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null; }
export function waHref(phone, text) { return phone ? `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text || '')}` : null; }

export const Label = ({ kind }) => <span className={'src-tag ' + kind}>{{ source: 'Source teaching', user: 'Your requirement', design: 'App design' }[kind]}</span>;
