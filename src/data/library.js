// Shepherding content that isn't part of the roadmap itself: the daily rhythm, prayer structure,
// mentoring method, the five marks of a healthy church, rules for the day and the resource library.

// ── The shape of a pastor's day. Soul first, then ministry. ─────────────────
export const RHYTHM = [
  { id: 'silence', slot: 'morning', label: 'Rise and be still', hours: 0.25,
    activity: 'Before anything else, stillness before God. No phone, no news.',
    detail: 'Sit in silence for fifteen minutes before you speak to anyone or look at a screen.\n\nWHY IT COMES FIRST:\nThe first voice you hear in the morning sets the tone for the day. If it is the news or your messages, you start reacting. If it is God, you start receiving.\n\nHOW:\nSit somewhere quiet. Breathe slowly. Pray one line: "Speak, Lord, for your servant is listening." When your mind wanders, return to that line without judging yourself.' },
  { id: 'prayer', slot: 'morning', label: 'Structured prayer (ACTS)', hours: 1,
    activity: 'Adoration, confession, thanksgiving, intercession and petition.',
    detail: 'An hour of prayer with a shape, so it doesn\'t drift.\n\nADORATION (10 min):\nWho God is: his attributes, his character. Pray a psalm back to him.\n\nCONFESSION (10 min):\nHonest about sin. Without this, prayer becomes performance.\n\nTHANKSGIVING (10 min):\nSpecific gratitude for recent mercies and answered prayers.\n\nINTERCESSION (20 min):\nYour flock by name, then your church, then the city and the nations.\n\nPETITION (10 min):\nYour own needs, last. Log the session in Prayer when you finish.' },
  { id: 'scripture', slot: 'morning', label: 'Scripture for your own soul', hours: 0.5,
    activity: 'Reading for you, not for a sermon. Protect this time.',
    detail: 'Read for your own soul, not for sermon material.\n\nHOW:\nFollow a plan (M\'Cheyne: four chapters a day from different parts of the Bible). Read slowly. Stop at the verse that stops you, and stay there.\n\nWRITE:\nOne sentence: what this showed you about God, and one about yourself.' },
];

// Sunday and Sabbath additions
export const SUNDAY_REVIEW = { id: 'sunday-review', slot: 'evening', label: 'Sunday review', hours: 0.5,
  activity: 'What did God do in the service? Who needs follow-up? What would you change next week?',
  detail: 'Within a day of preaching, while it is fresh.\n\nTHREE QUESTIONS:\n(1) What did God do in the service, and in you?\n(2) Who needs a follow-up call this week? Add them to Flock with a next contact.\n(3) What will you do differently next Sunday?' };

// ── Prayer: the ACTS elements a session can include ───────────────────────────
export const ACTS = [
  { id: 'adoration', label: 'Adoration', desc: 'Focus on who God is: his attributes, his character.' },
  { id: 'confession', label: 'Confession', desc: 'Honest about sin. Without this, prayer becomes performance.' },
  { id: 'thanksgiving', label: 'Thanksgiving', desc: 'Specific gratitude for recent mercies and answered prayers.' },
  { id: 'supplication', label: 'Supplication', desc: 'Intercession for members, then petition for your own needs.' },
];
export const PRAYER_KINDS = ['Morning prayer', 'Family prayer', 'Bacenta prayer', 'Academics prayer', 'Job or career prayer', 'Beloved prayer', 'Prayer walk', 'Prayer meeting', 'Church prayer', 'Other'];
export const REQUEST_CATEGORIES = ['Member', 'Church', 'Family', 'Personal', 'Mission', 'City', 'Beloved', 'Other'];
export const SCRIPTURE_CATEGORIES = ['Identity in Christ', 'Preaching', 'Pastoral care', 'Evangelism', 'Prayer', 'Suffering', 'Holiness'];

// ── Leadership: the four-phase mentoring method ─────────────────────────────
export const MENTORING = [
  { id: 1, label: 'I do, you watch', desc: 'Model the ministry. Let them observe without pressure.' },
  { id: 2, label: 'I do, you help', desc: 'Include them in the task. Let them assist.' },
  { id: 3, label: 'You do, I help', desc: 'Delegate the task. Be available for support.' },
  { id: 4, label: 'You do, I watch', desc: 'Release full responsibility. Evaluate and affirm.' },
];
export const VISIT_TYPES = ['Home visit', 'Hospital', 'Check-in call', 'Discipleship', 'Crisis', 'Evangelistic', 'New member'];

// ── The five marks of a healthy church (scored on the Health page) ───────────
export const FIVE_MARKS = [
  { id: 'word', label: 'Biblical Word central', desc: 'The Bible preached and believed: expository sermons, Scripture hidden in the heart.' },
  { id: 'prayer', label: 'Prayer-saturated', desc: 'A pastor who prays daily and at length, and a list of requests carried before God.' },
  { id: 'community', label: 'Genuine community', desc: 'People known by name, visited, and cared for when they struggle.' },
  { id: 'mission', label: 'Active mission', desc: 'The gospel taken outside the walls: evangelistic visits and new people welcomed.' },
  { id: 'leaders', label: 'Reproducing leaders', desc: 'People being raised up who could lead without you.' },
];

// ── Burnout warnings: what the logs must not show ──────────────────────────
export const BURNOUT_RULES = [
  { id: 'sabbath', label: 'Sabbath skipped two weeks running', level: 'Warning' },
  { id: 'extended', label: 'No extended prayer in 14 days', level: 'Warning' },
  { id: 'retreat', label: 'No personal retreat in 6 months', level: 'Critical' },
  { id: 'journal', label: 'Journaling has stopped', level: 'Warning' },
  { id: 'fasting', label: 'Fasting skipped three weeks', level: 'Warning' },
  { id: 'short', label: 'Morning prayer under 15 minutes, again and again', level: 'Warning' },
];

// ── A rule for each day, from the plan's own convictions ─────────────────────
export const PRINCIPLES = [
  { rule: 'No ministry output before spiritual input.', from: 'Phase 0 · Spiritual foundation' },
  { rule: 'The depth of your prayer life is the depth of your ministry.', from: 'Phase 2 · Prayer and disciplines' },
  { rule: 'Guard the Sabbath militantly. It protects your ministry from your own ambition.', from: 'Spiritual disciplines' },
  { rule: 'You cannot shepherd people you do not know. Learn one more name today.', from: 'Phase 4 · Pastoral care' },
  { rule: 'Let the points of the sermon come out of the text, not into it.', from: 'Phase 5 · Preaching' },
  { rule: 'Application must be specific and concrete. Not "read your Bible".', from: 'Phase 5 · Preaching' },
  { rule: 'A church that does not evangelise is not a healthy church.', from: 'Phase 6 · Evangelism' },
  { rule: 'Pastors are the first responders of the soul. Know when to refer.', from: 'Phase 7 · Counselling' },
  { rule: 'Poor administration is not humility. It is negligence.', from: 'Phase 8 · Ministry systems' },
  { rule: 'A pastor who cannot raise up leaders creates permanent dependency on himself.', from: 'Phase 9 · Leadership' },
  { rule: 'Health produces growth. Vision precedes expansion.', from: 'Phase 10 · Growth' },
  { rule: 'Read for your own soul before you read for a sermon.', from: 'Daily rhythm' },
  { rule: 'Confession keeps prayer from becoming performance.', from: 'Prayer · ACTS' },
  { rule: 'Character before skill: 1 Timothy 3 is almost entirely about who you are.', from: 'Phase 3 · Character' },
  { rule: 'Model first. "I do, you watch" comes before "you do, I watch".', from: 'Leadership · Mentoring' },
  { rule: 'Rest is not laziness. Burnout destroys ministries.', from: 'Spiritual disciplines' },
];
export function principleIndex(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000) % PRINCIPLES.length;
}

export const VERSES = [
  ['He leadeth me beside the still waters. He restoreth my soul.', 'Psalm 23:2–3'],
  ['Shepherd the flock of God that is among you, not under compulsion, but willingly.', '1 Peter 5:2'],
  ['Pay careful attention to yourselves and to all the flock.', 'Acts 20:28'],
  ['I am the good shepherd. I know my own and my own know me.', 'John 10:14'],
  ['Preach the word; be ready in season and out of season.', '2 Timothy 4:2'],
  ['Be still, and know that I am God.', 'Psalm 46:10'],
  ['Watch your life and doctrine closely. Persevere in them.', '1 Timothy 4:16'],
  ['Come to me, all who labour and are heavy laden, and I will give you rest.', 'Matthew 11:28'],
];

export const QUOTES = [
  ['A man may preach every day of the week, and not have the Spirit; but if he prays, he will have it.', 'Leonard Ravenhill'],
  ['Prayer is the natural outgushing of a soul in communion with Jesus.', 'Charles Spurgeon'],
  ['The best of all is, God is with us.', 'John Wesley'],
];

// ── Resource library ─────────────────────────────────────────────────────────
export const RESOURCES = [
  { cat: 'Foundational books', items: [
    { name: 'The Reformed Pastor — Richard Baxter', url: 'https://www.amazon.co.uk/Reformed-Pastor-Richard-Baxter/dp/0851513069', desc: 'The classic on pastoral ministry. Read annually.', badge: 'Essential' },
    { name: 'Brothers, We Are Not Professionals — John Piper', url: 'https://www.amazon.co.uk/Brothers-Are-Not-Professionals-Radical/dp/0805464638', desc: 'A call to ministerial radicalism. Counter to professionalism.', badge: 'Essential' },
    { name: 'Spiritual Leadership — J. Oswald Sanders', url: 'https://www.amazon.co.uk/Spiritual-Leadership-J-Oswald-Sanders/dp/0802416705', desc: 'The definitive guide to godly leadership in ministry.', badge: 'Classic' },
    { name: 'The Preaching Life — Barbara Brown Taylor', url: '', desc: 'Integrating preaching into the whole of pastoral life.', badge: '' },
  ] },
  { cat: 'Preaching and teaching', items: [
    { name: 'Preaching — Tim Keller', url: 'https://www.amazon.co.uk/Preaching-Communicating-Faith-Age-Skepticism/dp/0525950702', desc: 'Modern evangelical classic on expository preaching.', badge: 'Essential' },
    { name: 'Christ-Centered Preaching — Bryan Chapell', url: 'https://www.amazon.co.uk/Christ-Centered-Preaching-Redeeming-Expository-Sermons/dp/0801049121', desc: 'Foundational text for expository, Christ-centred preaching.', badge: '' },
    { name: 'Desiring God — John Piper', url: 'https://www.desiringgod.org/books/desiring-god', desc: 'Theological foundation for joy-based ministry.', badge: '' },
  ] },
  { cat: 'Pastoral care and counselling', items: [
    { name: 'CCEF Resources', url: 'https://www.ccef.org', desc: 'Biblical counselling training. The best pastoral counselling resource.', badge: 'Essential' },
    { name: 'Instruments in the Redeemer\'s Hands — Paul Tripp', url: 'https://www.amazon.co.uk/Instruments-Redeemers-Hands-People-People/dp/0875526071', desc: 'How to come alongside people in biblical community.', badge: '' },
    { name: 'Crisis Counseling — Gary Collins', url: '', desc: 'Practical guide for pastoral crisis response.', badge: '' },
  ] },
  { cat: 'Spiritual formation', items: [
    { name: 'The Pursuit of God — A.W. Tozer', url: 'https://www.amazon.co.uk/Pursuit-God-Complete-Including-Classic/dp/1603749578', desc: 'Classic devotional theology. Read slowly.', badge: 'Classic' },
    { name: 'New Morning Mercies — Paul Tripp', url: 'https://www.amazon.co.uk/New-Morning-Mercies-Gospel-Devotional/dp/1433542234', desc: 'Daily devotional for the pastor\'s own soul.', badge: '' },
    { name: 'Celebration of Discipline — Richard Foster', url: '', desc: 'The disciplines of the spiritual life.', badge: '' },
  ] },
  { cat: 'Church health and growth', items: [
    { name: 'Nine Marks of a Healthy Church — Mark Dever', url: 'https://9marks.org', desc: 'Essential framework for church health. Free resources online.', badge: 'Essential' },
    { name: 'The Purpose Driven Church — Rick Warren', url: '', desc: 'Practical church development framework.', badge: '' },
    { name: 'Planting Growing Churches — Aubrey Malphurs', url: '', desc: 'Comprehensive church planting methodology.', badge: '' },
  ] },
  { cat: 'Online', items: [
    { name: '9Marks', url: 'https://9marks.org', desc: 'Articles, books and resources on healthy church.', badge: 'Free' },
    { name: 'Desiring God', url: 'https://desiringgod.org', desc: 'Theological articles, sermons, books.', badge: 'Free' },
    { name: 'The Gospel Coalition', url: 'https://thegospelcoalition.org', desc: 'Resources for gospel-centred ministry.', badge: 'Free' },
    { name: 'Ligonier Ministries', url: 'https://ligonier.org', desc: 'Reformed theology education and resources.', badge: 'Free' },
    { name: 'CCEF', url: 'https://ccef.org', desc: 'Biblical counselling training and articles.', badge: 'Free' },
  ] },
];
