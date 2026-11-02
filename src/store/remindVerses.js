// A KJV verse for each kind of reminder, changing from one reminder to the next.
export const REMIND_VERSES = {
  prayer: [
    ['Men ought always to pray, and not to faint.', 'Luke 18:1'],
    ['Pray without ceasing.', '1 Thessalonians 5:17'],
    ['Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.', 'Jeremiah 33:3'],
    ['Watch and pray, that ye enter not into temptation.', 'Matthew 26:41'],
    ['Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.', 'Philippians 4:6'],
  ],
  quiet: [
    ['And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed.', 'Mark 1:35'],
    ['My voice shalt thou hear in the morning, O LORD; in the morning will I direct my prayer unto thee, and will look up.', 'Psalm 5:3'],
    ['Be still, and know that I am God.', 'Psalm 46:10'],
    ['O God, thou art my God; early will I seek thee.', 'Psalm 63:1'],
  ],
  word: [
    ['Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.', '2 Timothy 2:15'],
    ['Thy word is a lamp unto my feet, and a light unto my path.', 'Psalm 119:105'],
    ['Thy word have I hid in mine heart, that I might not sin against thee.', 'Psalm 119:11'],
    ['This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night.', 'Joshua 1:8'],
  ],
  reading: [
    ['Till I come, give attendance to reading, to exhortation, to doctrine.', '1 Timothy 4:13'],
    ['Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.', 'Proverbs 4:7'],
  ],
  fasting: [
    ['But thou, when thou fastest, anoint thine head, and wash thy face.', 'Matthew 6:17'],
    ['Turn ye even to me with all your heart, and with fasting, and with weeping, and with mourning.', 'Joel 2:12'],
  ],
  shepherd: [
    ['I will seek that which was lost, and bring again that which was driven away, and will bind up that which was broken, and will strengthen that which was sick.', 'Ezekiel 34:16'],
    ['Be thou diligent to know the state of thy flocks, and look well to thy herds.', 'Proverbs 27:23'],
    ['Bear ye one another’s burdens, and so fulfil the law of Christ.', 'Galatians 6:2'],
    ['Pure religion and undefiled before God and the Father is this, To visit the fatherless and widows in their affliction.', 'James 1:27'],
  ],
  evangelism: [
    ['Go ye into all the world, and preach the gospel to every creature.', 'Mark 16:15'],
    ['He that winneth souls is wise.', 'Proverbs 11:30'],
    ['How shall they hear without a preacher?', 'Romans 10:14'],
  ],
  gather: [
    ['Not forsaking the assembling of ourselves together, as the manner of some is.', 'Hebrews 10:25'],
    ['I was glad when they said unto me, Let us go into the house of the LORD.', 'Psalm 122:1'],
  ],
  preach: [
    ['Preach the word; be instant in season, out of season.', '2 Timothy 4:2'],
    ['Feed the flock of God which is among you.', '1 Peter 5:2'],
  ],
  teach: [
    ['Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another.', 'Colossians 3:16'],
    ['And have taught you publickly, and from house to house.', 'Acts 20:20'],
  ],
  welcome: [['Wherefore receive ye one another, as Christ also received us to the glory of God.', 'Romans 15:7']],
};

// Which verses go with which reminder
export const VERSE_KIND = {
  quiet: 'quiet', prayer: 'prayer', prayerlog: 'prayer', points: 'prayer', study: 'word', reading: 'reading', fast: 'fasting', fasteve: 'fasting',
  tele: 'shepherd', deadline: 'shepherd', followups: 'shepherd', visits: 'shepherd', care: 'shepherd', absence: 'shepherd',
  evangelism: 'evangelism', meetingSoon: 'gather', attendance: 'gather', prepare: 'gather', sermon: 'preach', chat: 'teach', pvti: 'teach',
  welcome: 'welcome', campaigns: 'evangelism',
};

// Turn a key and date into a stable number, so each reminder gets its own verse and the next one a different one
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function remindVerse(kind, seed) {
  const list = REMIND_VERSES[VERSE_KIND[kind] || kind] || REMIND_VERSES.shepherd;
  const [text, ref] = list[hash(seed) % list.length];
  return { text, ref, line: `“${text}” ${ref}` };
}
