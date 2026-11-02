# Boēthos and Spoudazō

## How the app fits together

- **Boēthos** (`#/home`) is the home page, and the app always opens there. A link from a notification still opens where it points. The page has:
  - the verse of the day;
  - what is still to do today, from both sections;
  - your streak, level and XP;
  - analytics for both sections;
  - two cards that lead into Spoudazō and Poimainō.

  Its tabs hold activity, calendar, achievements, weekly and monthly reviews, journal and the health of the ministry.
- **The top bar** has only the logo (which goes home), search, help and settings.
- **Inside a section,** a section bar under the header shows the section's places and a way back to Boēthos. On a phone the same appears as bottom tabs, with Home first.
- **Scripture on every page.** Each page shows a KJV verse chosen for it (`src/data/scripture.js`). The help sheet shows one too.

## Spoudazō: your own walk with God

The phased plan is retired. Spoudazō is now made of:

- **disciplines you keep daily**, built from the rhythm you set;
- **topics you choose to study**, one at a time.

| Place | What it holds |
|---|---|
| **Today** (`#/today`) | Quiet time, prayer minutes and prayer times, Bible chapters, your study topic, your book, your memory verse, messages this week, fast days, and closing the day. Each item is ticked only when the real thing is recorded, and you record it right there. |
| **Quiet time** (`#/quiet`) | A guided time: be still, read, meditate, pray, write. Also the journal of every quiet time, and Character (a weekly self-examination from 1 Timothy 3, plus your rule of life). |
| **Prayer** (`#/prayer`) | Prayer times, the prayer log (ACTS), requests, and fasting (weekly fast days, planned fasts, what God did). |
| **The Word** (`#/word`) | Bible reading through all 1,189 chapters, study topics, and memory with daily meditation. |
| **Library** (`#/library`) | Books for you, books for your members (Bishop Dag Heward-Mills' books first), and messages and camps. |

**Your rhythm** is set on the second first-run page and in Settings. It covers:

- wake time and quiet time (time and minutes);
- prayer minutes and prayer times;
- chapters a day;
- study minutes and study time;
- books a month and reading minutes;
- messages a week;
- memory verses a month;
- weekly fast days;
- which reminders you want.

**Reminders** come at your quiet time, at each prayer time, at your study time, and on fast days. You can receive them two ways:

- **In the app,** while it is open or in the background.
- **By push,** once cloud sync and push are on (see `CLOUD_SETUP.md`).

## Where the 11 phases went

| Phase | Where it went |
|---|---|
| 0 Spiritual foundation | The daily rhythm became **Today**. Fasting became **Prayer → Fasting**. Conversion, calling, rule of life, suffering, and burnout and rest became **study topics**. The rule of life is also in **Character**. |
| 1 Biblical knowledge | Bible reading became **The Word → Reading**. Hermeneutics, systematic and biblical theology, church history and apologetics became **study topics**, plus the two you asked for: other religions, and atheism and agnosticism. Memorisation became **The Word → Memory**. |
| 2 Disciplines and prayer | ACTS became the **prayer log**. Extended prayer, listening prayer and meditation became **study topics**. Sabbath became the Sabbath day in Settings. Member prayer is in **Poimainō** (on each person). |
| 3 Character and integrity | The 1 Timothy 3 qualities became **Character**. Pride, sexual integrity, money, emotions and accountability became **study topics**. |
| 4–10 Shepherding, preaching, evangelism, counselling, systems, leadership, growth | **Poimainō**: People, Follow-up and visits, Care, Sermons, Outreach, Workers and the pipeline, Services, Vision 25 and Campaigns. |

Each study topic that came from a phase keeps that step's guide text. Your old step notes are kept, and they still appear in the journal on Boēthos.

The Poimainō guides from phases 4–10 (for example the sermon preparation process) still need a home inside Poimainō. That is planned for the next round.

## Sources

- **Bishop Dag Heward-Mills' books.** The library offers a starter list of his titles to add with one tap. Check it against your own copies: every title is editable, and you can add any book.
- **Other authors.** Kept to three.
- **Scripture.** Quotations are KJV, which is public domain, and are quoted exactly.
