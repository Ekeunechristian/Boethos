// Answers "where am I and what am I working on" the same way on every page.

// The step of your current phase you are working on.
export const focusStep = (sel) => sel.activeStep || sel.nextStep;

// "Week 3 of this phase"
export const whereLabel = (sel) => `week ${sel.weekInPhase}`;

// Weekly reviews are keyed by the Sunday that ends the Mon–Sun week.
export function weekKey(d = new Date()) {
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().slice(0, 10);
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

// "Faithful Shepherd — Stable Church of 25+ Growing Toward 100+ | Genuine Gospel Community"
export function goalParts(goal) {
  const [role, rest = ''] = goal.split('—').map(s => s.trim());
  const [church, community = ''] = rest.split('|').map(s => s.trim());
  return { role, church, community };
}

// Shepherding phases don't set daily hours; the day's rhythm does.
export const phaseHoursShort = () => '';
export const phaseHours = () => '';

// Phases as options for the Picker: number, title, and duration beneath.
export const phaseOptions = (phases) => phases.map(p => ({ value: p.id, lead: p.id.replace('phase-', ''), label: p.title, meta: p.duration }));

// The eleven phases read as four seasons of formation.
export const STAGES = [
  { name: 'The inner life', when: 'Months 1–3', ids: ['phase-0', 'phase-1', 'phase-2'] },
  { name: 'The shepherd', when: 'Months 3–6', ids: ['phase-3', 'phase-4', 'phase-5'] },
  { name: 'The work', when: 'Months 6–12', ids: ['phase-6', 'phase-7', 'phase-8'] },
  { name: 'The church', when: 'Year 2 on', ids: ['phase-9', 'phase-10'] },
];
export const stageIndex = (phaseId) => STAGES.findIndex(s => s.ids.includes(phaseId));

// A note is a "line for yourself" only if it was written on Today.
export const isLine = (c) => (c.source ? c.source === 'today' : !(c.text.includes('\n') || c.text.length > 120));
