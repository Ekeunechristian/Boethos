// Spoudazō: reference data for your own spiritual growth.
// Nothing here is a sequence to finish. These are disciplines to keep daily and topics you choose to study.

// ── Study topics ───────────────────────────────────────────────────────────
// `step` points at the earlier roadmap step whose guide text is reused (phases 0–3, the personal ones).
// Refs are Scripture references to read; nothing is quoted or attributed beyond them.
export const TOPIC_GROUPS = [
  ['foundations', 'Foundations'],
  ['bible', 'The Bible and theology'],
  ['defend', 'Defending the faith'],
  ['spirit', 'Prayer and the inner life'],
  ['character', 'Character and integrity'],
];
export const STUDY_TOPICS = [
  { id: 'assurance', group: 'foundations', title: 'Conversion and assurance', step: 'p0-s1', refs: ['John 3:1–21', 'Romans 8:1–17', '1 John 5:9–13'] },
  { id: 'calling', group: 'foundations', title: 'The call of God', step: 'p0-s2', refs: ['Jeremiah 1:4–10', '1 Timothy 3:1', 'Acts 20:24–28'] },
  { id: 'rule', group: 'foundations', title: 'A rule of life', step: 'p0-s3', refs: ['Daniel 6:10', 'Mark 1:35', '1 Corinthians 9:24–27'] },
  { id: 'suffering', group: 'foundations', title: 'Theology of suffering', step: 'p0-s6', refs: ['2 Corinthians 1:3–11', '2 Corinthians 4:7–18', 'Romans 5:1–5', 'James 1:2–12', '1 Peter 4:12–19'] },
  { id: 'rest', group: 'foundations', title: 'Rest, Sabbath and burnout', step: 'p0-s7', refs: ['Mark 6:31', 'Exodus 20:8–11', '1 Kings 19:1–18'] },
  { id: 'hermeneutics', group: 'bible', title: 'Hermeneutics: interpreting Scripture', step: 'p1-s2', refs: ['2 Timothy 2:15', 'Nehemiah 8:8', 'Luke 24:27'] },
  { id: 'systematic', group: 'bible', title: 'Systematic theology', step: 'p1-s3', refs: ['Titus 1:9', '2 Timothy 3:16–17'] },
  { id: 'biblical', group: 'bible', title: 'The storyline of Scripture', step: 'p1-s4', refs: ['Luke 24:44–47', 'Hebrews 1:1–3'] },
  { id: 'history', group: 'bible', title: 'Church history', step: 'p1-s5', refs: ['Acts 2:41–47', 'Hebrews 11', 'Hebrews 13:7'] },
  { id: 'apologetics', group: 'defend', title: 'Apologetics', step: 'p1-s6', refs: ['1 Peter 3:15', 'Acts 17:16–34', 'Jude 1:3'] },
  { id: 'religions', group: 'defend', title: 'Other religions', step: null, refs: ['John 14:6', 'Acts 4:12', 'Acts 17:22–31'],
    desc: 'Understand what people of other faiths actually believe, in their own terms, so you can listen well and point to Christ with respect.' },
  { id: 'atheism', group: 'defend', title: 'Atheism and agnosticism', step: null, refs: ['Psalm 14:1', 'Romans 1:18–23', 'Psalm 19:1–4'],
    desc: 'The questions sceptics ask about God, evil, science and the Bible, and how to answer honestly and gently.' },
  { id: 'acts', group: 'spirit', title: 'Structured prayer (ACTS)', step: 'p2-s1', refs: ['Matthew 6:9–13', 'Psalm 100'] },
  { id: 'extended', group: 'spirit', title: 'Extended prayer', step: 'p2-s3', refs: ['Luke 6:12', 'Matthew 26:40–41'] },
  { id: 'listening', group: 'spirit', title: 'Listening prayer', step: 'p2-s4', refs: ['1 Samuel 3:1–10', 'John 10:27', 'Psalm 46:10'] },
  { id: 'meditation', group: 'spirit', title: 'Scripture meditation', step: 'p2-s5', refs: ['Joshua 1:8', 'Psalm 1', 'Psalm 119:97–104'] },
  { id: 'fasting', group: 'spirit', title: 'Fasting', step: 'p0-s5', refs: ['Matthew 6:16–18', 'Isaiah 58', 'Acts 13:2–3'] },
  { id: 'spirit-life', group: 'spirit', title: 'The Holy Spirit and the anointing', step: null, refs: ['Luke 4:18', 'Acts 1:8', 'Acts 10:38', '1 John 2:27'],
    desc: 'Who the Holy Spirit is, how he empowers ministry, and how to walk with him daily.' },
  { id: 'qualifications', group: 'character', title: 'The character of an overseer (1 Timothy 3)', step: 'p3-s1', refs: ['1 Timothy 3:1–7', 'Titus 1:5–9'] },
  { id: 'pride', group: 'character', title: 'Pride and humility', step: 'p3-s2', refs: ['Proverbs 16:18', 'Philippians 2:3–8', '1 Peter 5:5–6'] },
  { id: 'purity', group: 'character', title: 'Sexual integrity', step: 'p3-s3', refs: ['Job 31:1', '1 Thessalonians 4:3–8', '2 Timothy 2:22'] },
  { id: 'money', group: 'character', title: 'Financial integrity', step: 'p3-s4', refs: ['1 Timothy 6:6–10', '2 Corinthians 8:20–21'] },
  { id: 'emotions', group: 'character', title: 'Emotional maturity', step: 'p3-s5', refs: ['Proverbs 16:32', 'Ephesians 4:26–32', 'Galatians 5:22–23'] },
  { id: 'accountability', group: 'character', title: 'Accountability', step: 'p3-s6', refs: ['Proverbs 27:17', 'James 5:16', 'Hebrews 3:13'] },
  { id: 'loyalty', group: 'character', title: 'Loyalty and faithfulness', step: null, refs: ['1 Corinthians 4:2', 'Ruth 1:16–17', 'Proverbs 20:6'],
    desc: 'Being faithful to God, to those over you and to those you serve.' },
];
export const STUDY_PROMPTS = ['What did I learn?', 'Which Scripture shaped it?', 'How will it change how I live or shepherd?'];

// ── Books ──────────────────────────────────────────────────────────────────
// Bishop Dag Heward-Mills first. A starter shelf to add from with one tap; check it against your own copies
// and add anything missing (titles are editable). Other authors are kept to a few.
export const DHM = 'Dag Heward-Mills';
export const BOOK_CATALOGUE = [
  'Church Growth', 'The Mega Church', 'The Double Mega Missionary Church', 'How to Start a Church', 'Church Planting',
  'Many Are Called', 'Loyalty and Disloyalty', 'Those Who Accuse You', 'Those Who Leave You', 'Those Who Pretend',
  'Those Who Are Proud', 'Those Who Are Dangerous Sons', 'Those Who Forget', 'Those Who Are Ignorant',
  'The Art of Leadership', 'The Art of Shepherding', 'The Art of Following', 'Transform Your Pastoral Ministry',
  'Lay People and the Ministry', 'What It Means to Become a Shepherd', 'Rules of Church Work', 'Ministerial Ethics',
  'Steps to the Anointing', 'Tell Them', 'Model Marriage',
].map(title => ({ title, author: DHM }));
export const OTHER_BOOKS = [
  { title: 'The Pursuit of God', author: 'A. W. Tozer' },
  { title: 'Spiritual Leadership', author: 'J. Oswald Sanders' },
  { title: 'Celebration of Discipline', author: 'Richard Foster' },
];
export const BOOK_STATUS = [['want', 'To read'], ['reading', 'Reading'], ['finished', 'Finished']];
// Message categories, so you can find a message on a topic when you need it
export const MESSAGE_CATS = ['Prayer', 'Faith', 'The Holy Spirit', 'Shepherding', 'Leadership', 'Evangelism', 'Church growth', 'Loyalty', 'Marriage', 'Finances', 'Healing', 'Other'];
export const LISTEN_KINDS = [['message', 'Message'], ['camp', 'Camp'], ['conference', 'Conference'], ['other', 'Other']];

// ── The Bible: 66 books and their chapters (1,189 in all) ───────────────────
export const BIBLE = [
  ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34], ['Joshua', 24], ['Judges', 21], ['Ruth', 4],
  ['1 Samuel', 31], ['2 Samuel', 24], ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36], ['Ezra', 10], ['Nehemiah', 13],
  ['Esther', 10], ['Job', 42], ['Psalms', 150], ['Proverbs', 31], ['Ecclesiastes', 12], ['Song of Solomon', 8], ['Isaiah', 66], ['Jeremiah', 52],
  ['Lamentations', 5], ['Ezekiel', 48], ['Daniel', 12], ['Hosea', 14], ['Joel', 3], ['Amos', 9], ['Obadiah', 1], ['Jonah', 4], ['Micah', 7],
  ['Nahum', 3], ['Habakkuk', 3], ['Zephaniah', 3], ['Haggai', 2], ['Zechariah', 14], ['Malachi', 4],
  ['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21], ['Acts', 28], ['Romans', 16], ['1 Corinthians', 16], ['2 Corinthians', 13],
  ['Galatians', 6], ['Ephesians', 6], ['Philippians', 4], ['Colossians', 4], ['1 Thessalonians', 5], ['2 Thessalonians', 3], ['1 Timothy', 6],
  ['2 Timothy', 4], ['Titus', 3], ['Philemon', 1], ['Hebrews', 13], ['James', 5], ['1 Peter', 5], ['2 Peter', 3], ['1 John', 5], ['2 John', 1],
  ['3 John', 1], ['Jude', 1], ['Revelation', 22],
];
export const BIBLE_CHAPTERS = BIBLE.reduce((n, [, c]) => n + c, 0);

// ── Fasting ───────────────────────────────────────────────────────────────
export const FAST_TYPES = ['Until noon', 'Until evening (6 pm)', 'Full day (water only)', 'Daniel fast (no rich food)', 'Other'];

// ── Character: the overseer's qualities (1 Timothy 3:2–7, KJV wording) ──────
// The fifteen essentials of a potential shepherd, from Bishop Dag Heward-Mills, "What It Means to Become a Shepherd"
export const ESSENTIALS = [
  'A personal relationship with God',
  'An interest in listening to preaching tapes and watching Word videos',
  'A personal fasting life',
  'Availability for the work',
  'Individual financial input to the church',
  'People-handling skills',
  'Preaching and teaching skills',
  'An interest in evangelism',
  'Visiting, counselling and organisational abilities',
  'A stable and happy marriage',
  'Catching the spirit of the leader',
  'Your relationship with the opposite sex',
  'Loyalty',
  'Personal financial and job stability',
  'A person with a vision',
];
// The overseer, 1 Timothy 3:2–7
export const QUALITIES = ['Blameless', 'Vigilant', 'Sober', 'Of good behaviour', 'Given to hospitality', 'Apt to teach', 'Patient', 'Not covetous', 'Rules his own house well', 'Of good report'];

// ── Your rhythm: the defaults offered on the first run (you change them) ─────
export const PRAYER_MIN = 180; // your floor: never less than 3 hours a day
export const DEFAULT_GOALS = {
  wake: '05:00',
  quietTime: '05:15', quietMinutes: 60,
  prayerMinutes: 180, prayerTimes: ['05:30', '12:00', '21:00'],   // at least 3 hours of prayer a day
  chaptersPerDay: 3,
  studyMinutes: 60, studyTime: '20:00',
  readingMinutes: 20, booksPerMonth: 1, readingTime: '21:00',
  messagesPerWeek: 2,
  fastDays: [], fastUntil: '18:00',
  memoryPerMonth: 2,
  fastsPerWeek: 1,                       // at least one fast a week
  pointsTime: '12:00', prayerLogTime: '20:00', listenTime: '19:00', journalTime: '21:30', weeklyDay: 0, weeklyTime: '20:00',
  reminders: { quiet: true, prayer: true, study: true, fasting: true, points: true, prayerLog: true, reading: true, listen: true, journal: true, weekly: true },
};
