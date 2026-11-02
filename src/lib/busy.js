// The rest of your life: work, study, family and other commitments, each on set days and times.
// While one is on, reminders wait and arrive when it ends (if you choose that in Settings).

export const COMMITMENT_KINDS = [
  ['work', 'Work'], ['study', 'Study'], ['family', 'Family'], ['health', 'Health'], ['ministry', 'Ministry'], ['other', 'Other'],
];

const mins = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const weekday = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();

// Old profiles kept commitments as plain words; they become commitments without set times.
export function commitmentsOf(profile) {
  if (Array.isArray(profile?.commitments)) return profile.commitments;
  return (profile?.otherCommitments || []).map((name, i) => ({ id: `c${i}`, name, kind: 'other', days: [], from: '', to: '', until: '' }));
}

// Is this date and time inside a commitment? Returns it, or null.
export function busyAt(commitments, date, time) {
  const wd = weekday(date), t = mins(time);
  return commitments.find(c => c.from && c.to && (c.days || []).includes(wd) && (!c.until || date <= c.until)
    && (mins(c.from) <= mins(c.to) ? t >= mins(c.from) && t < mins(c.to) : t >= mins(c.from) || t < mins(c.to))) || null;
}

// Push the time to the end of any commitment it falls in (commitments can follow one another).
export function afterBusy(commitments, date, time) {
  let t = time;
  for (let i = 0; i < 5; i++) { const c = busyAt(commitments, date, t); if (!c) return t; t = c.to; }
  return t;
}

// Hours committed each week, for the summary on Settings
export function weeklyHours(commitments) {
  return commitments.reduce((n, c) => {
    if (!c.from || !c.to) return n;
    let d = mins(c.to) - mins(c.from); if (d < 0) d += 1440;
    return n + (d / 60) * (c.days || []).length;
  }, 0);
}
