export const ROADMAP_DATA = {
  goal: "Faithful Shepherd — Stable Church of 25+ Growing Toward 100+ | Genuine Gospel Community",
  phases: [
    {
      id: "phase-0",
      name: "Phase 0",
      title: "Spiritual Foundation & Personal Consecration",
      duration: "Months 1–3 (ongoing always)",
      startMonth: 0,
      color: "#16a34a",
      icon: "✝️",
      description:
        "The ground on which everything else is built. Before you can shepherd others, you must be shepherded by God. A pastor whose soul is not well-tended is like a hospital with sick doctors. The depth of your people will rarely exceed the depth of your personal walk with God. This phase is never completed — it is the ongoing infrastructure underneath every phase that follows.",
      dependsOn: [],
      steps: [
        {
          id: "p0-s1",
          name: "Genuine Conversion & Settled Assurance",
          description:
            "Before anything else, be radically honest about your own soul. Ask: Do I know God personally or merely academically? Is there a moment where I consciously repented and trusted Christ? Can I articulate clearly what the gospel is? If there are genuine doubts, work through them carefully with a more mature pastor or spiritual director before proceeding.",
          resources: ["1 Timothy 3:1-7", "Titus 1:5-9", "Acts 20:17-38", "1 Peter 5:1-4"],
        },
        {
          id: "p0-s2",
          name: "Theology of Calling",
          description:
            "Build a theologically grounded understanding of what it means to be called. The internal call (deep Spirit-worked conviction) must be matched by the external call (recognition by a community of believers). Neither alone is sufficient. Study Ezekiel 34 fully — this is God's verdict on bad shepherding and His standard for good shepherding.",
          resources: ["Ezekiel 34", "Jeremiah 1:4-10", "1 Timothy 3"],
        },
        {
          id: "p0-s3",
          name: "Write Your Rule of Life",
          description:
            "A written covenant with yourself about how your days will be shaped: when you rise, when you pray, when you study scripture, when you fast, when you rest, when you exercise, when you engage family, when you turn off ministry mode. Without this, ministry will shape you — and it will shape you poorly.",
          resources: ["The Reformed Pastor — Richard Baxter"],
        },
        {
          id: "p0-s4",
          name: "Establish the Daily Core Rhythm",
          description:
            "Non-negotiable rule: no ministry output before spiritual input. Every ministry day: 5:00–5:30 Rise & silence. 5:30–6:30 Structured prayer (ADORATION → CONFESSION → THANKSGIVING → INTERCESSION → PETITION). 6:30–7:30 Scripture reading for your own soul — not for sermon content. Protect this block militantly.",
          resources: ["Brothers, We Are Not Professionals — John Piper"],
        },
        {
          id: "p0-s5",
          name: "Fasting Practice",
          description:
            "Regular fasting: one full day per week (sunrise to sunset). The time you would have spent eating becomes prayer time — fasting without prayer is just dieting. Congregational fasting: called as a community before major decisions. Extended fasting (3–7 days): for major spiritual crisis points or ministry transitions. Not for beginners.",
          resources: ["Matthew 6:16-18", "Isaiah 58"],
        },
        {
          id: "p0-s6",
          name: "Theology of Suffering",
          description:
            "Pastoral ministry will break your heart repeatedly. Members will betray you. People you pour years into will leave without explanation. You must have a robust biblical theology of suffering before these things happen. Study 2 Corinthians 1:3-11, 4:7-18, 6:3-10; Romans 5:1-5; James 1:2-12; 1 Peter 4:12-19.",
          resources: ["2 Corinthians 1–6", "Romans 5:1-5", "James 1:2-12"],
        },
        {
          id: "p0-s7",
          name: "Burnout Prevention Systems",
          description:
            "Sabbath: one full day per week of complete rest — guard it militantly. Annual extended retreat: 2–4 days alone with God, away from all ministry demands. A personal pastor or spiritual director: you cannot shepherd yourself indefinitely. Someone who asks you hard questions about your soul. Honest journaling: not a ministry log but a spiritual autobiography in real time.",
          resources: ["Spiritual Leadership — J. Oswald Sanders", "The Furious Longing of God — Brennan Manning"],
        },
      ],
      unlocks:
        "The interior architecture that determines whether everything else is sustainable. Without this, Phase 1 onwards is building on sand.",
    },
    {
      id: "phase-1",
      name: "Phase 1",
      title: "Biblical Knowledge & Theology",
      duration: "Months 1–3 (ongoing)",
      startMonth: 1,
      color: "#0891b2",
      icon: "📖",
      description:
        "A shepherd who does not know the truth cannot guard the flock from error. Theological ignorance in a pastor is not humility — it is negligence. The depth of your teaching will be permanently limited by the depth of your theology. This phase builds a comprehensive theological mind that becomes the foundation of everything you teach for the rest of your life.",
      dependsOn: ["phase-0"],
      steps: [
        {
          id: "p1-s1",
          name: "Full Bible Reading Strategy",
          description:
            "Know the major narrative arc: Creation, Fall, Abraham, Exodus, Law, Conquest, Kingdom, Division, Exile, Return, Prophetic Hope. Know the four Gospels distinctively. Know Paul's letters chronologically and theologically. Target: read the entire Bible through at least once per year using a structured plan (M'Cheyne: four chapters daily from different sections).",
          resources: ["M'Cheyne Bible Reading Plan", "Bible Gateway"],
        },
        {
          id: "p1-s2",
          name: "Hermeneutics — The Science of Biblical Interpretation",
          description:
            "Master the literal-grammatical-historical method. Context is king: immediate context, book context, canonical context. Genre matters: poetry ≠ history ≠ prophecy ≠ apocalyptic. The Analogy of Faith: no correct interpretation will contradict another passage. Study exegesis vs. eisegesis — drawing out vs. reading in.",
          resources: [
            "How to Read the Bible for All Its Worth — Fee & Stuart",
            "Exegetical Fallacies — D.A. Carson",
          ],
        },
        {
          id: "p1-s3",
          name: "Systematic Theology — Full Curriculum",
          description:
            "Work through all major doctrinal categories: Bibliology (doctrine of Scripture), Theology Proper (doctrine of God — Trinity, attributes), Anthropology (humanity, imago Dei), Hamartiology (sin), Christology (person and work of Christ, councils of Nicaea and Chalcedon), Soteriology (justification, sanctification, glorification), Pneumatology (Holy Spirit), Ecclesiology (church), Eschatology (last things).",
          resources: [
            "Systematic Theology — Wayne Grudem",
            "Christian Theology — Millard Erickson",
            "The Institutes of the Christian Religion — John Calvin",
          ],
        },
        {
          id: "p1-s4",
          name: "Biblical Theology — The Storyline of Scripture",
          description:
            "Trace the development of God's redemptive plan progressively through the Bible. Master: Covenant theology (Adamic, Noahic, Abrahamic, Mosaic, Davidic, New Covenant), Typology (how OT persons/events/institutions foreshadow NT realities — Adam→Christ, Passover→Christ, Tabernacle→Christ), Promise and fulfillment, the relationship between Israel and the Church.",
          resources: ["Preaching and Biblical Theology — Edmund Clowney"],
        },
        {
          id: "p1-s5",
          name: "Church History",
          description:
            "Patristic period (AD 100–451): Nicaea, Constantinople, Chalcedon — learn what these councils established and why. Medieval Church. The Reformation (1517): Luther, Calvin, the five solas. Puritanism (1560–1700): Baxter, Owen, Flavel, Bunyan — your most practical theological ancestors. Modern missions: Whitefield, Wesley, Edwards, Carey, Spurgeon.",
          resources: [
            "Church History in Plain Language — Bruce Shelley",
            "The Story of Christianity — Justo Gonzalez",
          ],
        },
        {
          id: "p1-s6",
          name: "Apologetics — Defending the Faith",
          description:
            "The existence of God (cosmological, teleological, moral arguments). The reliability of the Bible (manuscript evidence, archaeology, prophecy). The resurrection of Christ (empty tomb, post-resurrection appearances, transformation of disciples, conversion of Paul and James). The problem of evil and suffering — both intellectual and pastoral responses. Basic engagement with Islam, atheism, new age spirituality.",
          resources: [
            "Mere Christianity — C.S. Lewis",
            "The Reason for God — Timothy Keller",
            "On Guard — William Lane Craig",
            "Cold Case Christianity — J. Warner Wallace",
          ],
        },
        {
          id: "p1-s7",
          name: "Scripture Memorisation",
          description:
            "Begin with: Psalm 23, Psalm 119:1-40, John 1:1-18, Romans 8, Ephesians 1-2, Colossians 1:15-20. Add one new passage per month — minimum 12 passages per year. Use spaced repetition to review. A pastor who has memorised scripture richly preaches and counsels from a deep internal reservoir.",
          resources: ["Anki flashcard app", "Fighter Verses app"],
        },
      ],
      unlocks:
        "The intellectual architecture through which everything you teach for the rest of your life flows. Without biblical and theological depth, all other ministry is superficial.",
    },
    {
      id: "phase-2",
      name: "Phase 2",
      title: "Spiritual Disciplines & Prayer Life",
      duration: "Months 1–3 (ongoing)",
      startMonth: 1,
      color: "#7c3aed",
      icon: "🙏",
      description:
        "Prayer is not preparation for the work — prayer is the work. The early church, overwhelmed with demands, made a decisive decision: 'We will devote ourselves to prayer and the ministry of the word' (Acts 6:4). The spiritual disciplines are channels through which God's transforming presence flows into the pastor's life and then through the pastor into the congregation.",
      dependsOn: ["phase-0"],
      steps: [
        {
          id: "p2-s1",
          name: "Structured Daily Prayer (ACTS Method)",
          description:
            "ADORATION (10-15 min): Praise God for His attributes — holiness, sovereignty, love, wisdom. Use a Psalm as your prayer. This reorients your soul first. CONFESSION (5-10 min): Specific, not vague. THANKSGIVING (5-10 min): Name specific mercies today. INTERCESSION — congregation by name (15-20 min). INTERCESSION — lost (10 min). INTERCESSION — broader church (10 min). PETITION — your own needs (5-10 min): this comes last, not first.",
          resources: ["The Valley of Vision — Puritan prayers", "Book of Common Prayer"],
        },
        {
          id: "p2-s2",
          name: "Member Prayer Tracker",
          description:
            "One of the most powerful pastoral tools. Create a list of every person in your community. Divide into groups of 4-5 per day, cycling through the week. Beside each name: current spiritual state, specific prayer requests, family situation, struggles, follow-up needs. Pray specifically — not 'Lord, bless John' but 'Lord, John is struggling with doubt since his father died. Give him renewed assurance of your love.'",
          resources: ["Notion or spreadsheet for tracking"],
        },
        {
          id: "p2-s3",
          name: "Extended Prayer Sessions",
          description:
            "Weekly: one session of 2-3 hours. During this time: pray over upcoming teaching, pray through ministry calendar, intercede in depth for struggling members, listen to God. Monthly: half-day or full-day of prayer and fasting. Review the month. Seek direction. Present ministry before God. Quarterly: 24-hour personal retreat if possible — away from normal environment. Extended silence, prayer, scripture, journaling.",
          resources: [],
        },
        {
          id: "p2-s4",
          name: "Learning to Listen — Contemplative Prayer",
          description:
            "After your regular intercession, fall silent for 10-15 minutes. No words. Present yourself before God and wait. Have a pen ready. Pay attention to what comes to mind — scriptures, names, impressions, convictions, questions. Write them down without immediately evaluating them. The test is always scripture — genuine divine impressions will not contradict scripture.",
          resources: [],
        },
        {
          id: "p2-s5",
          name: "Scripture Meditation",
          description:
            "There is a difference between reading and meditating. Reading is moving through text. Meditation is staying with text. Practical: take one verse or short passage. Read it slowly five times. Ask: What does this say about God? About humans? About sin and grace? How does this apply to my specific life right now? What would change in me if I genuinely believed this? Turn your answers into prayer.",
          resources: [],
        },
        {
          id: "p2-s6",
          name: "Solitude, Silence & Sabbath",
          description:
            "Solitude: being alone with God — not with your thoughts, not with your phone, but with God. Begin with 20 minutes of intentional silence once per week. Sabbath is not primarily about rest but about trust — the weekly declaration that God's ministry does not depend on your frantic output. Choose one day per week (not Sunday for pastors — usually Monday or Saturday). Absolutely no ministry output.",
          resources: ["A Long Obedience in the Same Direction — Eugene Peterson"],
        },
      ],
      unlocks:
        "The engine that sustains all ministry. Without this, theological knowledge becomes cold orthodoxy and pastoral work becomes emotional depletion.",
    },
    {
      id: "phase-3",
      name: "Phase 3",
      title: "Character Formation & Integrity",
      duration: "Months 3–6",
      startMonth: 3,
      color: "#dc2626",
      icon: "🛡️",
      description:
        "1 Timothy 3 gives the New Testament qualification list for pastoral leadership. Only one item is a specific skill — 'able to teach.' Every other qualification is a character qualification. Ministry is not primarily a skill set — it is a character expression. A person of brilliant gifts but compromised integrity will damage the church far more than a person of modest gifts but sterling character.",
      dependsOn: ["phase-1", "phase-2"],
      steps: [
        {
          id: "p3-s1",
          name: "1 Timothy 3 Character Assessment",
          description:
            "Work through each qualification honestly: Above reproach (no legitimate charge against personal conduct), One-woman man (absolute sexual fidelity), Sober-minded (calm stable thinking), Self-controlled (disciplined over all appetite), Respectable (genuine not manufactured), Hospitable (home is open), Able to teach, Not a drunkard, Not violent but gentle, Not quarrelsome, Not a lover of money, Managing household well, Not a recent convert, Well thought of by outsiders.",
          resources: ["1 Timothy 3:1-7", "Titus 1:5-9"],
        },
        {
          id: "p3-s2",
          name: "Pride — Identification & Antidote",
          description:
            "Ministry provides a unique and dangerous form of public honor. Warning signs: inability to receive correction without defensiveness, needing to be the most important person in every room, comparing your church's numbers to others, surrounding yourself with only agreeing people. Antidote: regular examination of motive. Ask consistently: Am I doing this for God's glory or for recognition? Serve in ways no one will see.",
          resources: [],
        },
        {
          id: "p3-s3",
          name: "Sexual Integrity — Non-Negotiable Structures",
          description:
            "More pastoral ministries have been destroyed by sexual failure than any other category. Non-negotiable protections: Never meet alone in a private space with a person of the opposite sex. Never counsel opposite-sex member beyond 2-3 sessions without a co-counselor. Full transparency with spouse about all pastoral relationships. Regular accountability with same-sex partner about your sexual thought life. Software accountability (Covenant Eyes) on all devices.",
          resources: ["Covenant Eyes accountability software"],
        },
        {
          id: "p3-s4",
          name: "Financial Integrity",
          description:
            "Never handle church finances alone — always with another person, always with paper trails. Your personal financial life should be orderly and manageable. Compensation set by a board, never by yourself alone. Never receive significant personal gifts from individual members without full board knowledge. Regular financial audits. Financial chaos in your personal life creates temptation toward ministry resources.",
          resources: [],
        },
        {
          id: "p3-s5",
          name: "Emotional Maturity & Self-Regulation",
          description:
            "Emotional maturity does not mean having no emotions — it means not being controlled by them. Develop vocabulary for emotional states (beyond happy/sad/angry): grief, disappointment, embarrassment, fear, loneliness. Naming accurately is the beginning of managing it. Regular journaling of emotional responses to ministry events: not just what happened, but what you felt, why, and what that reveals about your interior state.",
          resources: ["Emotionally Healthy Spirituality — Peter Scazzero"],
        },
        {
          id: "p3-s6",
          name: "Three-Layer Accountability Structure",
          description:
            "Layer 1 — Personal Accountability Partner: one person, same sex, who knows everything about your interior life. Not a congregation member. Meets monthly minimum. Can ask any question. Layer 2 — Pastoral Peer Group: 3-5 pastors at similar life/ministry stage. Meets monthly or quarterly. Layer 3 — Spiritual Director/Mentor Pastor: more experienced pastor who has permission to challenge your direction, theology, character, and relationships. Meets quarterly or bi-annually.",
          resources: [],
        },
      ],
      unlocks:
        "The moral authority to shepherd. Without integrity, gifting becomes dangerous. Character is the foundation on which all pastoral skill is safely exercised.",
    },
    {
      id: "phase-4",
      name: "Phase 4",
      title: "Shepherding & Pastoral Care Skills",
      duration: "Months 3–6",
      startMonth: 3,
      color: "#d97706",
      icon: "🐑",
      description:
        "Jesus did not call himself a preacher first — He called himself the Good Shepherd (John 10). A shepherd's fundamental relationship is with individual sheep. He knows them by name. He leads them to food and water. He finds the lost ones. Preaching is one tool a shepherd uses but it is not the defining metaphor of pastoral ministry. The difference between a preacher and a shepherd is enormous.",
      dependsOn: ["phase-3"],
      steps: [
        {
          id: "p4-s1",
          name: "Know Your People — Member Knowledge System",
          description:
            "For every member you must know: full name, family situation (spouse/children/parents' spiritual state), spiritual history (how they came to faith), current spiritual state, life circumstances (employment/health/finances/relationships), active prayer requests, last pastoral interaction (date/nature/follow-up needed), spiritual gifts and current serving role. You cannot shepherd people you do not know.",
          resources: [],
        },
        {
          id: "p4-s2",
          name: "Member Record Card System",
          description:
            "Create and maintain a record card for every member: Name | Phone | Emergency Contact | Family members | Spiritual background | Salvation/baptism status | Current spiritual state (1-5 scale with notes) | Active prayer requests | Last pastoral contact (date, type, content) | Next follow-up (date, action) | Serving in | Known struggles | Strengths/gifts. Review all records weekly.",
          resources: ["Planning Center People (free tier)", "Google Sheets"],
        },
        {
          id: "p4-s3",
          name: "Visitation — The Lost Art of Pastoral Presence",
          description:
            "Go to where your members are — homes, workplaces, hospital beds — rather than waiting for them to come to you. Visitation system for 25 members: target every member visited in their home at least once per quarter. Plan 2-3 visits per week (30-45 minutes each). Track visits in your member record system. Priority: anyone absent 2+ weeks, anyone in crisis, anyone newly joined.",
          resources: [],
        },
        {
          id: "p4-s4",
          name: "Follow-Up System",
          description:
            "Every pastoral conversation ends with a specific follow-up commitment: 'I will call you on Thursday.' All follow-up commitments immediately logged in a follow-up tracker with specific date. Follow-up tracker reviewed every Monday morning as the first pastoral planning task of the week. A follow-up communicates: 'I remembered. I prayed. I care.' Failing to follow up tells people they are not truly seen.",
          resources: [],
        },
        {
          id: "p4-s5",
          name: "Crisis Management — Pastoral Response Protocol",
          description:
            "Respond immediately — when a crisis call comes, default is: 'I am coming.' Do not arrive with answers — arrive with presence. In acute phase of crisis: 'I am here. I am with you. God is with us.' Practical help first: what do the children need? Do they have food? Spiritual care flows from practical presence. Follow up persistently: daily for first week, weekly for first month, monthly for first year.",
          resources: [],
        },
        {
          id: "p4-s6",
          name: "Weekly Shepherding Rhythm",
          description:
            "Monday: Review follow-up tracker, identify 3-4 priority contacts, pray over member list. Tuesday: 2 home visits, phone calls. Wednesday: Phone follow-ups, midweek gathering, stay 30 min after for pastoral conversations. Thursday: 1-2 pastoral visits, counseling appointments, pray through congregation. Friday: Follow-up calls for active struggles, sermon finalization, review Sunday attendance needs. Sunday: Arrive early, greet by name, notice absences.",
          resources: [],
        },
      ],
      unlocks:
        "Real relationship with real people. The pastoral knowledge that makes preaching targeted and counseling effective. You cannot shepherd strangers.",
    },
    {
      id: "phase-5",
      name: "Phase 5",
      title: "Teaching, Preaching & Communication",
      duration: "Months 3–6",
      startMonth: 3,
      color: "#0ea5e9",
      icon: "📢",
      description:
        "Of all the pastor's public functions, preaching is the most visible and most influential over the congregation's theological formation. A congregation that is poorly taught is spiritually malnourished regardless of how good the worship team is. But preaching must never become a performance disconnected from pastoral relationship — it must come from a pastor who knows his people deeply.",
      dependsOn: ["phase-4"],
      steps: [
        {
          id: "p5-s1",
          name: "Expository Preaching — The Foundation",
          description:
            "Take a passage of scripture as the text, determine its original meaning through careful study, then apply that meaning to the congregation. The passage determines the structure, content, and theme of the sermon. Why this method: it forces you through the whole counsel of God, gives you authoritative text, trains your congregation to think biblically, and protects you from hobby-horse preaching. Target: 70%+ expository messages.",
          resources: ["Preaching — Timothy Keller", "Between Two Worlds — John Stott"],
        },
        {
          id: "p5-s2",
          name: "Sermon Preparation Process (10-15 hours)",
          description:
            "Day 1: Prayer over the text (30 min), then first reading and observation — read passage 10-15 times in different translations, write down everything you observe. Day 2: Context study. Days 2-3: Exegesis and word study. Day 3: Commentaries (after your own work, not before). Day 3: Identify the Big Idea — one sentence capturing the central message. Day 4: Structure (3-4 points), Application development. Day 4-5: Illustrations, Writing and Rehearsal.",
          resources: ["Bible Hub", "Blue Letter Bible", "ESV Study Bible"],
        },
        {
          id: "p5-s3",
          name: "Identifying the Big Idea",
          description:
            "Every text has one central idea. Write a single sentence that captures what this text is primarily saying. This is your sermon's non-negotiable core — every point, illustration, and application must serve this central idea. Common failure: the sermon has three unrelated points that don't build toward one transformative truth. A sermon that doesn't know what it's saying cannot change anyone.",
          resources: [],
        },
        {
          id: "p5-s4",
          name: "Application — Specific and Concrete",
          description:
            "This is where most pastors fail. Application is not 'therefore try harder.' It must answer: Given that this text is true, what would actually change in how this specific congregation thinks, feels, or behaves? It must be specific, concrete, and possible. 'We should all be more loving' is not application. 'This week, call the person in your life you have been avoiding, and listen to them for 30 minutes' is application.",
          resources: [],
        },
        {
          id: "p5-s5",
          name: "Preaching Delivery — Voice, Body, Connection",
          description:
            "Vary pace: speed up for narrative, slow down for weight. Vary volume: quiet commands more attention than shouting. Pausing: after a key statement, stop for 3 full seconds — let it land. Eye contact: look at real people, not your notes or the back wall. Build an illustration file: a systematic collection of stories, quotes, and observations organized by theme — add to it every time you encounter something powerful.",
          resources: [],
        },
        {
          id: "p5-s6",
          name: "Annual Preaching Plan",
          description:
            "Q1 (Jan-Mar): One book study — typically a NT letter (e.g., Philippians). Q2 (Apr-Jun): Topical series tied to observed congregational needs (e.g., marriage and family, anxiety). Q3 (Jul-Sep): Old Testament narrative book (e.g., Ruth, Jonah, Daniel). Q4 (Oct-Dec): Doctrinal series (What We Believe, The Holy Spirit) + Advent. Develop this plan in November for the following year.",
          resources: [],
        },
        {
          id: "p5-s7",
          name: "Catechetical Teaching — Systematic Instruction",
          description:
            "Beyond the Sunday sermon, provide systematic teaching through which the congregation is intentionally educated in theology, church history, apologetics, and practical Christian living. A weekly class, small group curriculum, or structured study series. A congregation that only hears topical preaching is not being systematically formed by the whole Bible.",
          resources: ["New City Catechism — Keller/Carson"],
        },
      ],
      unlocks:
        "The ability to bring accurate biblical truth to real pastoral situations. Your shepherding knowledge of your people should directly shape every illustration, application, and emphasis.",
    },
    {
      id: "phase-6",
      name: "Phase 6",
      title: "Evangelism, Outreach & Visitation",
      duration: "Months 6–9",
      startMonth: 6,
      color: "#f97316",
      icon: "🌍",
      description:
        "A church without a front door eventually becomes a museum. A healthy church grows — not because growth is the goal, but because a community genuinely experiencing the transforming power of the gospel will naturally speak about it and invite others. Your goal: 25 stable members within 12 months. This requires proactive, organized outreach through genuine gospel engagement.",
      dependsOn: ["phase-5"],
      steps: [
        {
          id: "p6-s1",
          name: "Personal Evangelism — The Three Relationships Rule",
          description:
            "At all times, maintain at least three active intentional relationships with non-Christians. Not acquaintances — real relationships where you are genuinely present in their lives. Sources: neighbors (simply know them by name and engage regularly), business relationships (barber, mechanic, grocery staff — learn names, ask about lives), community connections (gym, club, parenting group where you build ongoing relationships).",
          resources: [],
        },
        {
          id: "p6-s2",
          name: "Your Personal Testimony (2-3 Minutes)",
          description:
            "Your personal testimony told in 2-3 minutes is your primary evangelistic tool. It covers: what your life was like before Christ (without glorifying sin), what led you to faith (the turning point), and what has changed since. Practice this until it flows naturally in conversation. Learn open questions about spiritual life: 'Do you have any faith background?' 'Has anyone explained what Christians believe about Jesus?'",
          resources: [],
        },
        {
          id: "p6-s3",
          name: "Newcomer Welcome & Integration System",
          description:
            "Week 1: Visitor warmly welcomed, contact info collected, pastor personally greets. Within 48 hours: handwritten note or personal call from the pastor — specific and personal, not a form letter. Week 2: Invitation to a low-pressure community gathering. Weeks 3-4: Introduction to 2-3 existing members sharing similar life stage. Month 2: Pastoral conversation about their spiritual journey. Month 3: Invitation to serve in some capacity — belonging deepens through contributing.",
          resources: [],
        },
        {
          id: "p6-s4",
          name: "Four-Stage Assimilation Pathway",
          description:
            "Stage 1 — CONNECTED: Visitor attends once. You have each other's contact. Follow-up within 48 hours. Stage 2 — BELONGING: Regular attendance (3+ weeks). Knows 3 people by name. Personally invited to small group. Stage 3 — COMMITTED: Consistent attendance, giving toward needs, small group involvement, serving in at least one area. Stage 4 — CONTRIBUTING: Actively discipling others, carrying pastoral responsibility, contributing to outreach mission.",
          resources: [],
        },
        {
          id: "p6-s5",
          name: "Community Service & Presence",
          description:
            "Identify 1-2 specific community needs your church can address: food insecurity, literacy, support for single parents, neighborhood cleanup, youth mentoring. Organize your members around one or two focused initiatives. A church of 25 serving well in one area has more impact than 25 people dispersed across fifteen programs. Be visibly present as a church — wear shirts with the church name, introduce yourselves as members of your community.",
          resources: [],
        },
        {
          id: "p6-s6",
          name: "One-to-One Discipleship Structure",
          description:
            "Evangelism that does not connect to discipleship produces emotional converts who drift. Meet weekly with 1-3 new believers for structured discipleship: 60-90 minutes. Content: Bible study (work through a Gospel, then a NT letter), prayer together, life application, accountability. Target: after 12-18 months, the person is ready to disciple someone else. This multiplies your ministry geometrically.",
          resources: ["Two Ways to Live Gospel outline", "Christianity Explored course"],
        },
      ],
      unlocks:
        "A growing community. Real gospel advance into your specific neighborhood. The pipeline of new believers flowing into the discipleship system.",
    },
    {
      id: "phase-7",
      name: "Phase 7",
      title: "Counseling & People Management",
      duration: "Months 6–9",
      startMonth: 6,
      color: "#8b5cf6",
      icon: "💬",
      description:
        "People come to pastors with everything — marriage crises, suicidal ideation, addiction, grief, sexual confusion, trauma, doubt. They do not neatly separate 'spiritual problems' from 'psychological problems.' Pastors are not professional therapists, and functioning as one without training causes harm. The goal: develop real biblical counseling competence while knowing precisely when and how to refer to professional care.",
      dependsOn: ["phase-5"],
      steps: [
        {
          id: "p7-s1",
          name: "Three Tiers of Pastoral Counseling",
          description:
            "Tier 1 — Pastoral Support (pastor always handles): grief, loss, normal life transitions, spiritual doubt, encouragement, prayer support, accountability. Tier 2 — Biblical Counseling (pastor with training, 6-12 sessions max): marriage enrichment, mild depression/anxiety, conflict resolution, parenting challenges, early addiction. Tier 3 — Professional Referral (pastor facilitates): acute suicidal ideation, severe mental illness, active domestic abuse, sexual abuse/trauma, clinical depression, active addiction.",
          resources: [],
        },
        {
          id: "p7-s2",
          name: "Active Listening — Foundation of All Counseling",
          description:
            "Most people who sit across from a pastoral counselor do not primarily need answers — they need to be genuinely heard. Elements: Physical presence (full eye contact, leaning forward, no phone), Reflective listening ('What I'm hearing is... Is that right?'), Emotional naming ('It sounds like you're feeling grief/shame/fear'), Withholding premature advice (first goal is understanding, not solving), Open questions (What happened? How did that feel?) not closed questions.",
          resources: [],
        },
        {
          id: "p7-s3",
          name: "Biblical Counseling Competency",
          description:
            "Biblical counseling assumes scripture speaks meaningfully to every dimension of human experience. Core principles: every human struggle has a spiritual dimension (not always caused by sin, but always addressed by truth), the counseling relationship itself is part of the care (truth without love is ineffective), change is a process not an event — messy and non-linear. Obtain formal biblical counseling training.",
          resources: [
            "Instruments in the Redeemer's Hands — Paul Tripp",
            "Competent to Counsel — Jay Adams",
            "Soul Care — Rob Kellemen",
          ],
        },
        {
          id: "p7-s4",
          name: "Emotional Intelligence in Pastoral Relationships",
          description:
            "EQ competencies: Self-awareness (know your emotional triggers and blind spots — what kind of story makes you want to escape the conversation?), Self-regulation (not reacting emotionally to what you hear in counseling — the person confessing pornography addiction needs calm pastoral care, not a visible flinch), Empathy (feel with, not just for, the other person), Social awareness (noticing what is not being said, picking up on deflection and avoidance).",
          resources: ["Emotionally Healthy Spirituality — Peter Scazzero"],
        },
        {
          id: "p7-s5",
          name: "Conflict Resolution Between Members",
          description:
            "Church conflict is inevitable. Matthew 18:15-20 provides the framework. Process: Listen to each party separately (your role is not to decide who is right — it is to facilitate understanding). Bring parties together with ground rules (speak in first person, no interrupting, no generalizations). Identify the actual issue beneath the presenting conflict. Identify each party's contribution. Establish specific, behavioral resolution agreement.",
          resources: ["Matthew 18:15-20"],
        },
        {
          id: "p7-s6",
          name: "Build Your Professional Referral Network",
          description:
            "Build this before you need it: Licensed Christian counselor (2-3 options at different price points, including sliding scale), Psychiatrist or psychiatric nurse practitioner, Marriage and family therapist (Christian orientation), Domestic violence resource and shelter contact, Addiction counselor and residential treatment information, Crisis line numbers (local and national), Hospital emergency psychiatric services, Social worker for practical needs.",
          resources: [],
        },
      ],
      unlocks:
        "The capacity to sit with people in their deepest darkness without causing harm and without being overwhelmed. The ability to help the whole person, not just the presenting spiritual question.",
    },
    {
      id: "phase-8",
      name: "Phase 8",
      title: "Ministry Systems & Church Organization",
      duration: "Months 9–12",
      startMonth: 9,
      color: "#0d9488",
      icon: "⚙️",
      description:
        "A gifted pastor without systems will eventually fail — not because of lack of calling but because of capacity exhaustion. As your community grows, the volume of pastoral needs, administrative tasks, and follow-up requirements will exceed what any individual can manage from memory and good intention. Systems are not the enemy of spiritual ministry — they are its servant.",
      dependsOn: ["phase-6", "phase-7"],
      steps: [
        {
          id: "p8-s1",
          name: "Member Management System",
          description:
            "A structured database of every person in your community. For 25 members: Google Sheets member database or Planning Center People (free tier). For 100+: Planning Center full suite, Breeze, or Elvanto. Must capture: Name, Contact info, Family members, Spiritual status, Attendance history, Giving record (confidential), Serving role, Pastoral care history, Prayer requests, Follow-up schedule.",
          resources: ["Planning Center People", "ChurchTrac", "Google Sheets"],
        },
        {
          id: "p8-s2",
          name: "Attendance & Engagement Tracking",
          description:
            "Record attendance for every gathering. Flag anyone absent for 2+ consecutive weeks for immediate follow-up — absence is a pastoral alert, not an administrative data point. Track engagement level: attending only → small group → serving → giving → discipleship. Monthly engagement report: how many are at each tier? Where are people getting stuck? Use this to direct your pastoral energy.",
          resources: [],
        },
        {
          id: "p8-s3",
          name: "Financial Systems — Non-Negotiables",
          description:
            "Dual control: no single person handles money alone — all transactions require two authorized signatories. Monthly financial statements available to leadership team. Annual financial statements presented to congregation. Annual budget approved by leadership team before year begins. Pastoral salary: set by a board, not by the pastor. Separation of accounts: operating, reserve, pastoral salary are separate.",
          resources: [],
        },
        {
          id: "p8-s4",
          name: "Communication System",
          description:
            "Weekly: brief digital communication (WhatsApp group, email, or church app) with this week's gathering details, prayer points, and one encouraging scripture. 3-5 sentences maximum. Monthly: slightly longer update on church direction, upcoming events, ministry highlights — celebrate wins, share testimonies. Personal: every significant pastoral event communicated to the whole community so they can respond in love.",
          resources: [],
        },
        {
          id: "p8-s5",
          name: "Annual Ministry Calendar",
          description:
            "January: Year launch, vision Sunday, new member orientation, Bible reading plan. February: Relationship/marriage emphasis. March: Pre-Easter prayer focus. April: Easter (plan 8 weeks in advance). May: Community service initiative launch. June: Mid-year evaluation and leadership retreat. July-Aug: Summer — lighter programming, pastoral visits prioritized. September: Ministry year re-launch. October: Evangelism emphasis. November: Thanksgiving/generosity. December: Advent + Christmas outreach.",
          resources: [],
        },
        {
          id: "p8-s6",
          name: "Pastoral Time Management",
          description:
            "Office hours: 3-4 specific times per week for pastoral appointments — communicate clearly so members know when to reach you. Deep work blocks: 2-3 hour windows protected for sermon preparation and theological study. Family time: block on your calendar as firmly as any appointment. Email/communication: check and respond 2-3 times per day at set times, not continuously. Continuous availability is not responsiveness — it is slavery to other people's urgency.",
          resources: [],
        },
        {
          id: "p8-s7",
          name: "Monthly Ministry Dashboard",
          description:
            "Review monthly with your leadership team: Average Sunday attendance (weekly trend), Visitor return rate (% returning 3+ times), Active member engagement (% in small group + serving + giving), Pastoral contacts made this month, New member integrations at each assimilation stage, Financial health (giving vs. budget, reserve fund), Discipleship relationships active, Prayer tracker completion (% of members prayed for by name).",
          resources: [],
        },
      ],
      unlocks:
        "Sustainable ministry that scales. The infrastructure that ensures no one falls through the cracks as the community grows from 25 toward 100.",
    },
    {
      id: "phase-9",
      name: "Phase 9",
      title: "Leadership Development & Team Building",
      duration: "Months 9–12",
      startMonth: 9,
      color: "#ec4899",
      icon: "👥",
      description:
        "Moses tried to do everything himself. Jethro said plainly: 'What you are doing is not good. You will certainly wear yourselves out.' Jesus chose twelve and invested in them deeply. A church that depends entirely on one person is fragile. A church where pastoral gifts are distributed across a team is resilient. Stop being the only shepherd — begin developing a team of shepherds around you.",
      dependsOn: ["phase-8"],
      steps: [
        {
          id: "p9-s1",
          name: "Identifying Future Leaders",
          description:
            "Look for the combination of four things (in this order): Character (demonstrating genuine Christian character in ordinary life — integrity, humility, faithfulness in small things, self-control), Teachability (receives correction without defensiveness, actively seeks to learn), Faithfulness (shows up, does what they commit to, doesn't quit when things are difficult), Relational investment (naturally cares about people, notices when someone is struggling). Gifting is fourth on this list, not first.",
          resources: [],
        },
        {
          id: "p9-s2",
          name: "The Five-Stage Leadership Pipeline",
          description:
            "Stage 1 — Faithful Member: simply attending and being formed. Stage 2 — Serving Volunteer: contributing in a specific role (hospitality, music, children's ministry) — character is tested under real responsibility. Stage 3 — Ministry Leader: leading a specific area, mentored by the pastor, regular check-ins. Stage 4 — Pastoral Apprentice: actively trained for pastoral responsibility, involved in visits/teaching/counseling observation, 12-24 month track. Stage 5 — Recognized Leader/Elder: formally recognized with real pastoral authority.",
          resources: [],
        },
        {
          id: "p9-s3",
          name: "Mentoring — Four Phases",
          description:
            "Phase 1: I do, you watch (mentor carries out the ministry while apprentice observes, then debriefs: 'What did you notice?'). Phase 2: I do, you assist (mentor leads, apprentice has specific contributing role, debrief: 'What would you do differently?'). Phase 3: You do, I assist (apprentice leads, mentor supports, debrief: 'What went well?'). Phase 4: You do, I observe (apprentice leads independently, regular debrief). This progression takes 12-24 months. Do not rush it.",
          resources: [],
        },
        {
          id: "p9-s4",
          name: "Effective Delegation",
          description:
            "Delegation is not assigning tasks — it is transferring ownership and responsibility for a defined ministry area. Requires: Clarity about what is delegated (scope, expected outcomes), Authority to match the responsibility (don't give responsibility without decision-making power), Resources (time, relationships, budget), Accountability structures (regular check-ins — not distrust, but care), Permission to fail (the delegate must know they can make mistakes and bring them to you without excessive criticism).",
          resources: [],
        },
        {
          id: "p9-s5",
          name: "Building Leadership Culture",
          description:
            "Leadership culture is either consciously built or unconsciously inherited. Build the culture of servant leadership (Mark 10:42-45): the leader serves the team and the team serves the congregation. Leaders are the most consistent example of the values they ask others to embody. Failure is processed not punished — honest reflection and learning, not shame. The success of others is celebrated not threatened. A leader threatened by others' gifting is not fit for leadership.",
          resources: ["Mark 10:42-45", "Exodus 18:17-18"],
        },
      ],
      unlocks:
        "The multiply principle — ministry that outlasts you and expands beyond your personal capacity. Leadership that is pastor-shaped but team-carried.",
    },
    {
      id: "phase-10",
      name: "Phase 10",
      title: "Church Growth, Stability & Long-Term Vision",
      duration: "Year 2 and beyond",
      startMonth: 12,
      color: "#6366f1",
      icon: "🏛️",
      description:
        "Phases 0-9 have built you as a person and developed the foundational systems of your ministry. Phase 10 is where you zoom out and think in decades rather than months. 'Where there is no prophetic vision, the people are unrestrained' (Proverbs 29:18). A church without vision drifts. The pastor's responsibility is not just to shepherd the present congregation but to lead it toward what God intends it to become.",
      dependsOn: ["phase-9"],
      steps: [
        {
          id: "p10-s1",
          name: "Five Marks of a Healthy, Growing Church",
          description:
            "Biblical word central: preaching and teaching of scripture is the spine of every ministry — programs exist to support the word's work, not replace it. Prayer-saturated: the congregation prays together, not just the pastor. Genuine community: people know each other, serve each other, bear each other's burdens — a family, not a crowd. Active mission: congregation is outward-facing, gospel advancing. Reproducing leaders: new leaders constantly emerging, ministry is team-carried.",
          resources: [],
        },
        {
          id: "p10-s2",
          name: "Understanding Growth Stages",
          description:
            "0-15 members (Pioneering): pastor does almost everything — add depth, not programs. 15-35 members (Consolidating): your current target — systems established, core leaders emerging. 35-75 members (Developing): multiple ministry teams functioning, pastor shifts from doing to coaching, small group system critical. 75-150 members (Establishing): full leadership team required, pastor functions primarily as elder/teacher/vision carrier. 150+ members (Multiplying): multiple staff, potentially planting daughter congregations.",
          resources: [],
        },
        {
          id: "p10-s3",
          name: "Ten-Year Vision Plan",
          description:
            "Years 1-2: Foundation — 25 stable members, all Phase 0-8 systems operational, 2 developing leaders, financial sustainability, community identity formed. Years 3-4: Consolidation — 50 members, small groups fully operational (3-4 groups), leadership team of 3-5, community service well-established. Years 5-7: Expansion — 50-100 members, multiple delegated ministry teams, recognized local reputation. Years 8-10: Maturity — 100+ members, established church, potentially planting.",
          resources: [],
        },
        {
          id: "p10-s4",
          name: "Preaching Vision into Existence",
          description:
            "Long-term vision is not wishful thinking — it is disciplined faith-guided strategic imagination. The congregation needs to hear the vision preached regularly: not just the what but the why, the theological foundation for who God is calling you to become as a community. Annual vision Sunday (January): cast vision for the year ahead. Annual evaluation Sunday (November/December): honest report to the congregation on progress, failures, and lessons.",
          resources: ["Proverbs 29:18", "Nehemiah 1-2 (vision, planning, execution)"],
        },
        {
          id: "p10-s5",
          name: "Succession & Legacy Thinking",
          description:
            "A church built on one pastor's personality is a church with a terminal illness. From year one, build systems, culture, and leaders that could survive your departure. The test of great pastoral leadership is not how well the church functions when the pastor is present — it is how well it functions when the pastor is absent. Think generationally: what kind of church are you building for the next generation?",
          resources: ["2 Timothy 2:2 (the multiplication principle)"],
        },
      ],
      unlocks:
        "A church that transforms lives across generations. The culmination of everything built in Phases 0-9 — integrated into a sustainable, flourishing, reproducing pastoral ministry.",
    },
  ],
};

export const GRAPH_LAYOUT = {
  "phase-0":  { x: 50,   y: 300 },
  "phase-1":  { x: 380,  y: 140 },
  "phase-2":  { x: 380,  y: 460 },
  "phase-3":  { x: 710,  y: 300 },
  "phase-4":  { x: 1040, y: 140 },
  "phase-5":  { x: 1040, y: 460 },
  "phase-6":  { x: 1370, y: 300 },
  "phase-7":  { x: 1370, y: 500 },
  "phase-8":  { x: 1700, y: 300 },
  "phase-9":  { x: 2030, y: 300 },
  "phase-10": { x: 2360, y: 300 },
};
