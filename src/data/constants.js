export const PHASE_COLORS = {
  'phase-0': '#16a34a', 'phase-1': '#0891b2', 'phase-2': '#7c3aed',
  'phase-3': '#b45309', 'phase-4': '#065f46', 'phase-5': '#1d4ed8',
  'phase-6': '#b91c1c', 'phase-7': '#9333ea', 'phase-8': '#0369a1',
  'phase-9': '#a16207', 'phase-10': '#166534',
};

export const PHASE_FOCUS = {
  'phase-0':  { label: 'Spiritual Foundation',       icon: '✝️', desc: 'Soul health first. No ministry output before spiritual input.' },
  'phase-1':  { label: 'Biblical Knowledge',          icon: '📖', desc: 'A shepherd who does not know the truth cannot guard the flock.' },
  'phase-2':  { label: 'Prayer & Disciplines',        icon: '🙏', desc: 'The depth of your prayer life determines the depth of your ministry.' },
  'phase-3':  { label: 'Character Formation',         icon: '⚖️', desc: '1 Timothy 3 qualifications — almost entirely character, not skills.' },
  'phase-4':  { label: 'Pastoral Care',               icon: '🐑', desc: 'Know your people. You cannot shepherd people you do not know.' },
  'phase-5':  { label: 'Preaching & Teaching',        icon: '📢', desc: 'Preaching is the primary act of pastoral ministry.' },
  'phase-6':  { label: 'Evangelism & Outreach',       icon: '🌍', desc: 'A church that does not evangelise is not a healthy church.' },
  'phase-7':  { label: 'Counseling',                  icon: '🧭', desc: 'Pastors are the first responders of the soul.' },
  'phase-8':  { label: 'Ministry Systems',            icon: '⚙️', desc: 'Poor administration is not humility — it is negligence.' },
  'phase-9':  { label: 'Leadership Development',      icon: '👥', desc: 'A healthy church reproduces leaders.' },
  'phase-10': { label: 'Church Growth & Vision',      icon: '🌱', desc: 'Health produces growth. Vision precedes expansion.' },
};

export const PHASE_UNLOCKS = {
  'phase-0':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'resources'],
  'phase-1':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'resources'],
  'phase-2':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'resources'],
  'phase-3':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'resources'],
  'phase-4':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'congregation', 'resources'],
  'phase-5':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'congregation', 'sermons', 'resources'],
  'phase-6':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'congregation', 'sermons', 'resources'],
  'phase-7':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'congregation', 'sermons', 'resources'],
  'phase-8':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'congregation', 'sermons', 'leadership', 'resources'],
  'phase-9':  ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'congregation', 'sermons', 'leadership', 'resources'],
  'phase-10': ['command', 'tree', 'daily', 'prayer', 'disciplines', 'scripture', 'congregation', 'sermons', 'leadership', 'resources'],
};

export const MEMBER_STATUS = ['Growing', 'Plateaued', 'Struggling', 'Crisis', 'Inactive'];
export const MEMBER_STATUS_COLORS = { 'Growing': '#22c55e', 'Plateaued': '#f59e0b', 'Struggling': '#f97316', 'Crisis': '#ef4444', 'Inactive': '#6b7280' };

export const LEADERSHIP_STAGES = [
  { id: 1, label: 'Faithful Member',       desc: 'Consistent attendance, giving, participates in community.' },
  { id: 2, label: 'Serving Volunteer',     desc: 'Actively serving in a ministry area. Reliable and faithful.' },
  { id: 3, label: 'Ministry Leader',       desc: 'Leading a small group or ministry team. Character verified.' },
  { id: 4, label: 'Pastoral Apprentice',   desc: 'In formal discipleship for pastoral role. Being assessed for eldership qualifications.' },
  { id: 5, label: 'Recognised Leader',     desc: 'Formally recognised elder/deacon. Meets 1 Tim 3 qualifications publicly.' },
];

export const DISCIPLINE_TYPES = [
  { id: 'morning_prayer', label: 'Morning Prayer (5:30–6:30)', icon: '🌅', category: 'daily' },
  { id: 'scripture_soul', label: 'Scripture for own soul', icon: '📖', category: 'daily' },
  { id: 'sabbath', label: 'Full Sabbath rest', icon: '🌿', category: 'weekly' },
  { id: 'fasting', label: 'Fasting day', icon: '🕊️', category: 'weekly' },
  { id: 'extended_prayer', label: 'Extended prayer (2+ hrs)', icon: '🙏', category: 'weekly' },
  { id: 'journaling', label: 'Spiritual journaling', icon: '📝', category: 'daily' },
  { id: 'solitude', label: 'Solitude (half-day)', icon: '🌲', category: 'monthly' },
  { id: 'retreat', label: 'Annual retreat (2–4 days)', icon: '⛰️', category: 'annual' },
];

export const SERMON_TYPES = ['Expository (Book)', 'Expository (Passage)', 'Topical', 'Doctrinal', 'Evangelistic', 'Occasional (Baptism/Wedding/Funeral)'];

export const SCRIPTURE_BOOKS = [
  'Genesis','Psalms','Isaiah','Matthew','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians',
  'Galatians','Ephesians','Philippians','Colossians','1 Timothy','2 Timothy','Titus','Hebrews','James','1 Peter',
];

export const COUNSELING_TIERS = [
  { id: 1, label: 'Tier 1 — Pastoral Support', desc: 'General encouragement, prayer, Scripture. Most situations.', color: '#22c55e' },
  { id: 2, label: 'Tier 2 — Biblical Counseling', desc: 'Structured engagement with sin patterns or life issues.', color: '#f59e0b' },
  { id: 3, label: 'Tier 3 — Professional Referral', desc: 'Clinical depression, addiction, trauma — refer out.', color: '#ef4444' },
];
