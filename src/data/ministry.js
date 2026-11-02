// Poimainō: reference data for Greater Love Bacenta management.
//
// Every item carries one of three labels (see docs/POIMAINO.md):
//   SOURCE  — a short paraphrase of a reviewed book, with chapter/page (D = The Double Mega Missionary Church,
//             H = How to Start a Church, B = The Bacenta Manual). Never quotations, never invented page numbers.
//   USER    — a requirement stated by the user (Greater Love, Vision 25, Thursday/Saturday, the camp stages).
//   DESIGN  — an app design choice (statuses, workflows, calculations, reminders, UI).
// The books teach ministry practice; they do not prescribe this software.

export const MINISTRY = {
  name: 'Greater Love Bacenta',               // USER
  vision: { label: 'Vision 25', target: 25, metric: 'stable members' },   // USER
  baseline: { approx: 3, note: 'About 3 somewhat stable members, as reported by you. Not yet roster-reviewed.' }, // USER
};

// ── Seven-stage discipleship pipeline (USER: 2026 camp stages, not a model verified in the books) ──
export const STAGES_DEFAULT = [
  { n: 0, label: 'Unbeliever' },
  { n: 1, label: 'New Convert' },
  { n: 2, label: 'Believer' },
  { n: 3, label: 'Disciple' },
  { n: 4, label: 'Servant' },
  { n: 5, label: 'Son' },
  { n: 6, label: 'Friend' },
];

// ── Membership status (DESIGN, manual; attendance may suggest a review, never decide) ──
export const MEMBERSHIP = [
  { id: 'contact', label: 'Contact', desc: 'Someone you know of or have met; not yet attending.' },
  { id: 'visitor', label: 'Visitor', desc: 'Has attended at least once.' },
  { id: 'returning', label: 'Returning', desc: 'Has come back; still settling in.' },
  { id: 'member', label: 'Member', desc: 'Registered or identifies with Greater Love; stability not yet reviewed.' },
  { id: 'stable', label: 'Stable member', desc: 'Confirmed by your personal review, with a dated reason. Counts toward Vision 25.' },
  { id: 'prayer', label: 'Someone I pray for', desc: 'Not part of Greater Love: a friend, family, someone far away. On your soul list to pray for and shepherd from afar.' },
  { id: 'transferred', label: 'Transferred', desc: 'Moved to another fellowship or church.' },
  { id: 'departed', label: 'Departed', desc: 'No longer part of Greater Love.' },
];
export const REGISTERED = ['member', 'stable'];

// Pastoral care status (manual; carried over from the earlier Flock page)
export const CARE_STATUS = ['Growing', 'Plateaued', 'Struggling', 'Crisis', 'Inactive'];

// ── Outreach statuses (DESIGN; independent of stage and membership; nonlinear allowed) ──
export const OUTREACH_DEFAULT = ['Added', 'Praying', 'Contacted', 'Invited', 'First visit', 'Following up', 'Established', 'Paused', 'Declined contact'];

// ── Meetings (USER: Thursday Bible study that you lead and preach; Saturday main church service) ──
export const MEETING_TYPES = [
  { id: 'thu', label: 'Thursday Bible Study', long: 'Thursday — Greater Love Bacenta Bible Study', weekday: 4, role: 'Led and preached by you' },
  { id: 'sat', label: 'Saturday Church', long: 'Saturday — Main Church Service', weekday: 6, role: 'Greater Love gathering into the main service',
    sourceNote: 'The books\' "Sunday service" principles apply here to Saturday (D21, D23, D25).' },
];

// ── Follow-up (DESIGN) ──
export const FOLLOW_KINDS = [
  ['call', 'Call'], ['message', 'Message'], ['conversation', 'Conversation'], ['invitation', 'Invitation'], ['welcome', 'Welcome contact'],
  ['welfare', 'Welfare check'], ['pastoral', 'Pastoral contact'], ['visit', 'Visit'], ['teaching', 'Teaching'], ['counselling', 'Counselling'], ['prayer', 'Pray for'],
];

// ── PVTI (USER): Prayer, Visitation, Teaching (which includes counselling), Interaction. Every completed follow-up counts as one. ──
export const PVTI = [
  { id: 'P', label: 'Prayer', desc: 'Praying for them by name' },
  { id: 'V', label: 'Visitation', desc: 'Visiting them' },
  { id: 'T', label: 'Teaching', desc: 'Teaching or counselling them (details stay private)' },
  { id: 'I', label: 'Interaction', desc: 'Calls, messages and conversations' },
];
export const PVCI = PVTI;
export const pvciOf = (kind) => (kind === 'prayer' ? 'P' : kind === 'visit' ? 'V' : ['teaching', 'counselling'].includes(kind) ? 'T' : 'I');
export const FOLLOW_STATUS = ['planned', 'attempted', 'completed', 'cancelled'];
export const VISIT_PLACES = ['Home', 'Church', 'Café / public place', 'Workplace', 'Phone / video', 'Other agreed place'];
// SOURCE B pp.12–13: a visit shows love, shares the Word and prays. Prompts only; the checklist is DESIGN.
export const VISIT_PREP = [
  ['love', 'Demonstrate love: a practical kindness, real attention'],
  ['word', 'Share the Word: one passage to read together'],
  ['prayer', 'Pray with them, about what they share'],
];

// ── Thursday sermon preparation (USER schedule; B p.17 supports preparation, not this exact flow) ──
export const SERMON_STAGES = ['Received', 'Reviewed', 'Scripture study', 'Main points', 'Outline and applications', 'Prayer and final preparation', 'Preached', 'Reflection'];
// The weekday each stage is suggested for (DESIGN). 1 = Monday … 5 = Friday.
export const SERMON_PLAN = [
  { stage: 1, day: 1, label: 'Review the material' },
  { stage: 2, day: 2, label: 'Study the scriptures' },
  { stage: 3, day: 3, label: 'Draft the main points' },
  { stage: 4, day: 3, label: 'Outline and applications' },
  { stage: 5, day: 4, label: 'Pray and finalise' },
  { stage: 6, day: 4, label: 'Preach at Bible study' },
  { stage: 7, day: 5, label: 'Reflect and follow up' },
];

// ── Stable membership review: editable criteria (DESIGN, not a sourced test of salvation or maturity) ──
export const STABLE_CRITERIA = [
  'Continues to identify with Greater Love and the church',
  'Ongoing participation appropriate to their circumstances',
  'A meaningful pastoral connection',
  'An agreed continuing relationship',
];
export const MILESTONES = [3, 5, 10, 15, 20, 25]; // DESIGN: planning aids, not book prescriptions

// ── The practical weekly cycle (USER timings; DESIGN plan; actual times are yours to set) ──
export const WEEKLY_CYCLE = [
  { day: 'Daily', items: ['Personal prayer (in Spoudazō)', 'The day’s agreed care actions'] },
  { day: 'Monday–Tuesday', items: ['Review people and last week’s attendance', 'Welcome and follow up visitors', 'Receive Thursday’s material and begin preparing'] },
  { day: 'Before Thursday', items: ['Scripture study and outline', 'Invitations and appropriate member contact', 'Outreach and visits in available slots'] },
  { day: 'Thursday', items: ['Lead and preach Bible study', 'Welcome people', 'Submit Thursday attendance', 'Record questions and next steps'] },
  { day: 'Friday / before Saturday', items: ['Telepastoring calls', 'Invitations', 'Transport and gathering confirmation'] },
  { day: 'Saturday', items: ['Gather Greater Love into church', 'Welcome and support visitors', 'Submit Saturday attendance'] },
  { day: 'After service', items: ['Follow through with visitors and absentees', 'Review establishment and stable membership', 'Plan next week'] },
  { day: 'Sunday', items: ['Care, rest or planning, as you choose (no main service here)'] },
];

// ── Optional start-up preset (SOURCE B p.20; never activated automatically) ──
export const MANUAL_STARTUP = {
  cite: 'B p.20',
  firstMonth: [
    'Daily prayer of at least two hours',
    'Morning or evening outreach on at least three weekdays',
    'An aim, per outreach, of seven people led in the sinner’s prayer (an aim, not a quota; never inferred from counted prayers)',
    'Visits or calls to that week’s converts — moved here around Saturday church rather than onto it',
    'Consenting committed members in a WhatsApp teaching group (consent required, B p.14)',
    'Gathering aims of ten at fellowship (Thursday here) and ten transported to church (Saturday here)',
    'Salvation preaching initially',
  ],
  after: ['Weekly outreach', 'Monthly visitation covering converts and members', 'Ongoing weekly voice contact', 'The 527 outline (mentioned but not explained in the manual: attach it yourself)'],
};

// ── The 22 campaigns (SOURCE emphasis paraphrased from D; local actions, indicators and scaling are DESIGN) ──
// Each is a ministry emphasis, not a department. Main-service campaigns use Saturday here; Thursday is Bible study.
export const CAMPAIGNS = [
  { n: 1, ch: 'D7', source: 'Soul-winning, mission consciousness', label: 'Soul-winning', kind: 'ongoing',
    emphasis: 'Make evangelism and missions central in teaching and practice.',
    now: 'Lead a regular outreach; help each willing member keep a real soul list and pray for people by name.',
    grow: 'Equip members to take part in and support outreach teams, with care assigned after each encounter.',
    records: 'Gospel encounters, unique people reached, invitations, actual responses, next follow-up.', metrics: ['encounters', 'reached', 'invitations'] },
  { n: 2, ch: 'D8', source: 'State of the flock', label: 'State of the flock', kind: 'ongoing',
    emphasis: 'Know the actual people, attendance, circumstances and needs, using accurate facts.',
    now: 'Know and review each current member personally; reconcile Thursday and Saturday attendance and outstanding needs.',
    grow: 'Complete pastoral coverage with named responsibility and regular roster reviews.',
    records: 'Known contact and care needs, last meaningful contact, attendance, missing information — never fabricated completeness.', metrics: ['coverage', 'attendance'] },
  { n: 3, ch: 'D9', source: 'Servants armed and trained', label: 'Training servants', kind: 'ongoing',
    emphasis: 'Train and equip workers with teaching, resources and practical experience.',
    now: 'Invite willing members into one suitable responsibility, with demonstration and encouragement.',
    grow: 'Mentor assistants and future shepherds; link learning to supervised practice.',
    records: 'Training plan, resource references, practice, mentor feedback, agreed responsibilities.', metrics: ['workers'] },
  { n: 4, ch: 'D10', source: 'Hearing and seeing', label: 'Hearing and seeing', kind: 'ongoing',
    emphasis: 'Sustain exposure to the preached Word through available media and gatherings.',
    now: 'Recommend a suitable message and discuss what members heard and can apply.',
    grow: 'Shared listening and viewing plans and opportunities to hear teaching.',
    records: 'Resource shared, voluntary completion, discussion and application.', metrics: ['activities'] },
  { n: 5, ch: 'D11', source: 'Honour your prophet', label: 'Honour', kind: 'ongoing',
    emphasis: 'Cultivate regard for pastoral ministry, teaching, direction and support.',
    now: 'Teach the meaning of honour and model respectful relationships with church leadership.',
    grow: 'Plan appropriate appreciation, teaching and agreed participation in church vision.',
    records: 'Teaching and reflection, practical agreed actions — no loyalty rating or compulsory gift target.', metrics: ['activities'] },
  { n: 6, ch: 'D12', source: 'Anti-Brutish', label: 'Seeking the Lord', kind: 'ongoing',
    emphasis: 'Shepherds must seek the Lord instead of relying only on natural effort.',
    now: 'Protect personal prayer and preparation for outreach, Bible study and member care.',
    grow: 'Encourage a prayerful culture among developing workers; include prayer in ministry preparation.',
    records: 'Linked prayer intentions and preparation actions — a timer never measures anointing.', metrics: ['prayer'] },
  { n: 7, ch: 'D13', source: 'Bacenta, Basonta, Batenta Proliferation', label: 'Fellowship and gathering', kind: 'ongoing',
    emphasis: 'Develop contributing groups and gather them into the main church service, including people available only on that day and taxi-based gathering.',
    now: 'Establish the Thursday fellowship and its gathering into Saturday church; recognise members available only on Saturday and arrange transport where needed.',
    grow: 'Prepare willing assistants and possible future groups with church leadership; coordinate groups, availability and transport. Never split automatically at 25.',
    records: 'Thursday participation, Saturday gathering, availability, transport, leadership preparation (Bacenta / Basonta / Batenta kept distinct).', metrics: ['attendance', 'transport'] },
  { n: 8, ch: 'D14', source: 'Buildings', label: 'Meeting place', kind: 'ongoing',
    emphasis: 'Establish the church through a physical place of its own.',
    now: 'Record a reliable Bible-study meeting place, access arrangements, practical needs and any contribution to the parent church\'s building vision — a scaled start, not a claim that renting fulfils the chapter.',
    grow: 'Plan venue capacity and future premises or building contributions with responsible leadership.',
    records: 'Venue readiness, capacity, agreed actions, optional budget — no assumption of buying property now.', metrics: ['activities'] },
  { n: 9, ch: 'D15', source: 'Intimate counselling', label: 'Personal counsel', kind: 'ongoing',
    emphasis: 'Provide individual pastoral interaction alongside public teaching.',
    now: 'Make time to hear each member privately and agree appropriate care actions.',
    grow: 'Organised appointments and follow-through, with referral to senior pastoral help where appropriate.',
    records: 'Restricted appointment, care action, review date.', metrics: ['care'] },
  { n: 10, ch: 'D16', source: 'Equipment and Technology', label: 'Tools and equipment', kind: 'ongoing',
    emphasis: 'Use suitable tools for knowing the flock, counting, trends, communication and operations.',
    now: 'Use the app for reliable records and reminders; check the basic equipment needed for Bible study.',
    grow: 'A simple equipment list, readiness checks and communication processes.',
    records: 'Equipment needs, preparation checklist, reliable reporting — no surveillance.', metrics: ['activities'] },
  { n: 11, ch: 'D17', source: 'Shepherds\' control', label: 'Shepherd oversight', kind: 'ongoing',
    emphasis: 'Train, oversee and review shepherds and address deficient pastoral work.',
    now: 'Keep your own pastoral responsibilities, training, oversight meetings and follow-up commitments visible.',
    grow: 'Agreed responsibilities, supervision and development for assistants. People, not the app, decide appointments or discipline.',
    records: 'Coverage, training, review meetings, agreed corrective actions, responsible reviewer.', metrics: ['coverage'] },
  { n: 12, ch: 'D18', source: 'Multiplication', label: 'Multiplication', kind: 'ongoing',
    emphasis: 'Pursue fruitfulness and outreach in a vision of growing numbers.',
    now: 'Make the 3-to-25 stable-member objective explicit; retain current members while helping new people become established.',
    grow: 'Develop members who evangelise, disciple and help shepherd others.',
    records: 'Stable members, additions, returns, departures — net change kept distinct from contacts or an event crowd.', metrics: ['stable'] },
  { n: 13, ch: 'D19', source: 'Uncles and Aunties', label: 'Children and youth mentoring', kind: 'ongoing',
    emphasis: 'Reach and mentor younger children through continuing Christian interest, teaching and visits.',
    now: 'Plan with the church\'s authorised children\'s/youth ministry: approved opportunities, responsible mentors, required arrangements. No invented child cohort.',
    grow: 'Approved mentoring and outreach through the church\'s safeguarding and consent arrangements.',
    records: 'Approved activity, responsible adult, permissions, minimal records. Distinct even before there are participants.', metrics: ['activities'] },
  { n: 14, ch: 'D20', source: 'Understanding', label: 'Understanding', kind: 'ongoing',
    emphasis: 'Deepen understanding of salvation and Christian teaching through deliberate instruction.',
    now: 'Use Thursday Bible study to explain foundations, invite questions and revisit misunderstandings.',
    grow: 'A foundational teaching plan and individual development steps.',
    records: 'Topics taught, questions, discussion, reviewed next steps — separate from media listening.', metrics: ['activities'] },
  { n: 15, ch: 'D21', source: 'Swollen Sunday', label: 'Swollen Saturday', kind: 'event',
    emphasis: 'Mobilise the whole congregation for occasional intensive outreach, with cycles of effort and rest.',
    now: 'Choose a special Saturday with church coordination; involve the willing core in prayer, invitations and welcome.',
    grow: 'A whole-bacenta invitation effort and post-event care.',
    records: 'Planned outreach, invitations, confirmations, actual visitors, returns, ongoing care — an editable rhythm, not maximum intensity every week.', metrics: ['invitations', 'visitors'] },
  { n: 16, ch: 'D22', source: 'Sheep seeking', label: 'Sheep seeking', kind: 'ongoing',
    emphasis: 'Seek and visit missing and struggling people; a Great Visitation broadens coverage on special days.',
    now: 'Personally check on absent members and visitors needing care; agree appropriate visits.',
    grow: 'Routine care plus an occasional Great Visitation covering the actual list.',
    records: 'People needing contact, assigned and completed visits, outcomes, unresolved needs.', metrics: ['visits', 'coverage'] },
  { n: 17, ch: 'D23', source: 'Sunday management', label: 'Saturday service management', kind: 'ongoing',
    emphasis: 'Manage the main service\'s worship, teaching and practical experience carefully.',
    now: 'Prepare Greater Love\'s gathering, welcome and participation in the parent church\'s Saturday service; note issues within your responsibility.',
    grow: 'Coordinate member participation and service responsibilities; follow through with church teams.',
    records: 'Gathering and readiness checklist, welcome, participation, issue resolution. Thursday preparation is separate.', metrics: ['attendance'] },
  { n: 18, ch: 'D24', source: 'Testimony', label: 'Testimony', kind: 'ongoing',
    emphasis: 'Share real testimonies regularly to encourage the congregation.',
    now: 'Invite voluntary testimonies in fellowship and get permission for wider sharing.',
    grow: 'Reviewed testimony opportunities in Bible study and church, coordinated with leadership.',
    records: 'Contributor-approved summary, permission, intended audience, sharing date.', metrics: ['activities'] },
  { n: 19, ch: 'D25', source: 'Telepastoring', label: 'Telepastoring', kind: 'ongoing',
    emphasis: 'Call before the main service to remind and encourage members.',
    now: 'Pre-Saturday calls, normally Friday or before Saturday service; remind about Thursday Bible study separately.',
    grow: 'Call lists allocated to suitable helpers; practical responses followed up.',
    records: 'Attempted vs reached, response, agreed help, next action, actual attendance.', metrics: ['calls'] },
  { n: 20, ch: 'D26', source: 'Tangerine', label: 'Natural groups', kind: 'ongoing',
    emphasis: 'Start with naturally identifiable groups as focused areas for growth.',
    now: 'Identify a real relational or geographical group among members and contacts — no departments for three people.',
    grow: 'Focused outreach and care plans for real groups, deduplicating people in overlapping groups.',
    records: 'Group definition, owner, activities, unique-person outcomes.', metrics: ['reached'] },
  { n: 21, ch: 'D27', source: 'Gathering bus', label: 'Gathering transport', kind: 'ongoing',
    emphasis: 'Gather people across groups and solve transport barriers.',
    now: 'Ask who needs help getting to Saturday church; arrange a lift, public-transport support, taxi or church bus as available.',
    grow: 'Coordinate pickups, seats, organisers and costs across the real group.',
    records: 'Transport need, confirmation, actual pickup — kept separate from service attendance. A full bus is not required.', metrics: ['transport'] },
  { n: 22, ch: 'D28', source: 'Organised Creative Arts', label: 'Creative arts', kind: 'ongoing',
    emphasis: 'Nurture members\' gifts through music, dance and drama.',
    now: 'Discover willing members\' gifts and connect them with church teams or a simple approved contribution.',
    grow: 'Appropriate practices, participation and creative outreach with existing teams.',
    records: 'Interest, agreed role, preparation, actual participation — no separate production department.', metrics: ['activities'] },
];

// What one Thursday or one visit can serve at once (DESIGN): recorded once, attributed to several emphases.
export const SHARED_SUPPORT = {
  thursday: [4, 5, 14, 18, 3],
  saturday: [7, 17, 21, 19],
  visit: [16, 9, 2],
  outreach: [1, 20, 12],
};

export const SOURCES = {
  D: 'Dag Heward-Mills, The Double Mega Missionary Church (1st ed. 2019, © 2016), chapters cited',
  H: 'Dag Heward-Mills, How to Start a Church (© 2008, Smashwords), physical PDF pages, cover = page 1',
  B: 'The Bacenta Manual (supplied "The Manual v7 - Copy.pdf", 22 physical PDF pages; authorship and date not stated)',
};
