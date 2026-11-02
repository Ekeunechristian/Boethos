// Every page carries Scripture. King James Version (public domain), quoted exactly.
// A reference with "…" quotes only part of the verse.

const V = (ref, text) => ({ ref, text });

// Boēthos, the landing page: one verse a day, in turn
export const DAILY = [
  V('Psalm 121:1–2', 'I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth.'),
  V('Hebrews 13:6', 'So that we may boldly say, The Lord is my helper, and I will not fear what man shall do unto me.'),
  V('Lamentations 3:22–23', 'It is of the LORD’S mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.'),
  V('Isaiah 40:31', 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.'),
  V('Proverbs 4:23', 'Keep thy heart with all diligence; for out of it are the issues of life.'),
  V('Galatians 6:9', 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.'),
  V('Philippians 3:13–14', 'Brethren, I count not myself to have apprehended: but this one thing I do, forgetting those things which are behind, and reaching forth unto those things which are before, I press toward the mark for the prize of the high calling of God in Christ Jesus.'),
  V('2 Peter 1:5', 'And beside this, giving all diligence, add to your faith virtue; and to virtue knowledge;'),
  V('Romans 12:11', 'Not slothful in business; fervent in spirit; serving the Lord;'),
  V('Psalm 46:10', 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.'),
  V('Colossians 3:16', 'Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord.'),
  V('Romans 12:1', 'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.'),
  V('Acts 6:4', 'But we will give ourselves continually to prayer, and to the ministry of the word.'),
  V('1 Timothy 4:16', 'Take heed unto thyself, and unto the doctrine; continue in them: for in doing this thou shalt both save thyself, and them that hear thee.'),
  V('Matthew 4:4', 'But he answered and said, It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.'),
];
export const verseOfDay = (iso) => {
  const n = Math.floor(new Date(iso + 'T12:00:00Z').getTime() / 86400000);
  return DAILY[((n % DAILY.length) + DAILY.length) % DAILY.length];
};

// The sections
export const SECTION_VERSES = {
  boethos: DAILY[0], // Psalm 121:1–2, the verse behind the logo
  spoudazo: V('2 Timothy 2:15', 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.'),
  poimaino: V('John 21:16', 'He saith to him again the second time, Simon, son of Jonas, lovest thou me? He saith unto him, Yea, Lord; thou knowest that I love thee. He saith unto him, Feed my sheep.'),
};

// Each page, keyed "place/page" (see lib/places.js)
export const PAGE_VERSES = {
  // Boēthos
  'home/journey': V('Psalm 90:12', 'So teach us to number our days, that we may apply our hearts unto wisdom.'),
  'settings/': V('1 Corinthians 14:40', 'Let all things be done decently and in order.'),
  // Spoudazō
  'today/': V('Lamentations 3:22–23', 'It is of the LORD’S mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.'),
  'quiet/': V('Mark 1:35', 'And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed.'),
  'quiet/journal': V('Psalm 5:3', 'My voice shalt thou hear in the morning, O LORD; in the morning will I direct my prayer unto thee, and will look up.'),
  'quiet/character': V('1 Timothy 4:12', 'Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.'),
  'prayer/': V('1 Thessalonians 5:17', 'Pray without ceasing.'),
  'prayer/points': V('1 Samuel 12:23', 'Moreover as for me, God forbid that I should sin against the LORD in ceasing to pray for you: but I will teach you the good and the right way.'),
  'prayer/fasting': V('Matthew 6:17–18', 'But thou, when thou fastest, anoint thine head, and wash thy face; That thou appear not unto men to fast, but unto thy Father which is in secret: and thy Father, which seeth in secret, shall reward thee openly.'),
  'word/': V('Joshua 1:8', 'This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.'),
  'word/study': V('2 Timothy 2:15', 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.'),
  'word/journal': V('Psalm 119:11', 'Thy word have I hid in mine heart, that I might not sin against thee.'),
  'library/': V('1 Timothy 4:13', 'Till I come, give attendance to reading, to exhortation, to doctrine.'),
  'library/messages': V('Romans 10:17', 'So then faith cometh by hearing, and hearing by the word of God.'),
  'library/camps': V('Mark 6:31', 'And he said unto them, Come ye yourselves apart into a desert place, and rest a while: for there were many coming and going, and they had no leisure so much as to eat.'),
  'library/journal': V('Proverbs 4:13', 'Take fast hold of instruction; let her not go: keep her; for she is thy life.'),
  // Poimainō
  'poimaino/': V('John 21:16', 'He saith to him again the second time, Simon, son of Jonas, lovest thou me? He saith unto him, Yea, Lord; thou knowest that I love thee. He saith unto him, Feed my sheep.'),
  'poimaino/vision': V('Proverbs 29:18', 'Where there is no vision, the people perish: but he that keepeth the law, happy is he.'),
  'poimaino/week': V('Proverbs 27:23', 'Be thou diligent to know the state of thy flocks, and look well to thy herds.'),
  'poimaino/settings': V('1 Corinthians 14:40', 'Let all things be done decently and in order.'),
  'people/': V('John 10:14', 'I am the good shepherd, and know my sheep, and am known of mine.'),
  'people/attention': V('Ezekiel 34:16', 'I will seek that which was lost, and bring again that which was driven away, and will bind up that which was broken, and will strengthen that which was sick: but I will destroy the fat and the strong; I will feed them with judgment.'),
  'evangelism/souls': V('Proverbs 11:30', 'The fruit of the righteous is a tree of life; and he that winneth souls is wise.'),
  'evangelism/': V('Mark 16:15', 'And he said unto them, Go ye into all the world, and preach the gospel to every creature.'),
  'people/leaders': V('2 Timothy 2:2', 'And the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also.'),
  'people/care': V('Galatians 6:2', 'Bear ye one another’s burdens, and so fulfil the law of Christ.'),
  'services/': V('Hebrews 10:25', 'Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another: and so much the more, as ye see the day approaching.'),
  'services/trends': V('Proverbs 27:23', 'Be thou diligent to know the state of thy flocks, and look well to thy herds.'),
  'followup/': V('Luke 15:4', 'What man of you, having an hundred sheep, if he lose one of them, doth not leave the ninety and nine in the wilderness, and go after that which is lost, until he find it?'),
  'followup/visits': V('Acts 20:20', 'And how I kept back nothing that was profitable unto you, but have shewed you, and have taught you publickly, and from house to house,'),
  'followup/telepastoring': V('1 Thessalonians 5:11', 'Wherefore comfort yourselves together, and edify one another, even as also ye do.'),
  'sermons/': V('2 Timothy 4:2', 'Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine.'),
  'followup/pvti': V('1 Peter 5:2', 'Feed the flock of God which is among you, taking the oversight thereof, not by constraint, but willingly; not for filthy lucre, but of a ready mind;'),
  'followup/chat': V('Colossians 3:16', 'Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord.'),
  'evangelism/invitations': V('Luke 14:23', 'And the lord said unto the servant, Go out into the highways and hedges, and compel them to come in, that my house may be filled.'),
  'poimaino/campaigns': V('1 Corinthians 3:6', 'I have planted, Apollos watered; but God gave the increase.'),
  'campaigns/startup': V('Zechariah 4:10', 'For who hath despised the day of small things? …'),
};

// The first-run pages
export const WELCOME_VERSES = [
  V('Psalm 121:1–2', 'I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth.'),
  V('Psalm 55:17', 'Evening, and morning, and at noon, will I pray, and cry aloud: and he shall hear my voice.'),
];

// A page's verse: the exact page, else its place, else its section
export function verseFor(place, page = '', section) {
  return PAGE_VERSES[`${place}/${page}`] || PAGE_VERSES[`${place}/`] || SECTION_VERSES[section] || DAILY[0];
}
