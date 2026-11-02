# Boēthos

**A ministry companion for a church cell-group (Bacenta) leader: one app for a personal walk with God and for shepherding the people in their care.**

Live: **https://boethos.ecmeserver.uk** · Installable on phone and desktop (PWA) · Works offline

## At a glance

| | |
| --- | --- |
| **What it does** | Tracks a personal spiritual rhythm (quiet time, prayer, Bible reading, fasting, study) and runs a small congregation: attendance for two weekly meetings, a weekly telepastoring call rota with retries and deadlines, follow-ups, visits, evangelism and a soul list, sermon preparation and a pulpit view, and weekly reviews. |
| **Stack** | React 18, Vite 6, plain CSS; Supabase (Postgres with row-level security, Auth, Edge Functions, pg_cron); Web Push (VAPID); deployed on Cloudflare Pages. |
| **Tests** | 39 unit tests (Vitest) on the domain logic, and 11 end-to-end suites (Puppeteer) that drive the real app in Chrome at phone and laptop widths. |

## Engineering highlights

- **Offline-first, one reducer.** All state lives in the browser and changes through pure reducers (`src/store`), so every rule is unit-testable without a browser.
- **Cloud sync without silent overwrites.** Each save carries a version number; when two devices disagree, the user chooses which copy to keep. Sensitive pastoral notes stay on the device unless the user opts in.
- **Reminders that reach a locked phone.** The app computes the next seven days of reminders on the device, respecting quiet hours, busy periods and per-type switches. It queues them as opaque keys, and a scheduled Edge Function sends them by Web Push. No names or notes ever appear on the lock screen.
- **Domain rules encoded and tested**, for example:
  - first and second timers are derived from attendance, never from membership;
  - unmarked attendance is never counted as absent;
  - telepastoring days follow deadlines by location (Birmingham before Thursday, everyone else before Saturday);
  - a pace indicator turns red when the week falls behind.
- **Accessible, responsive UI** without a component library: keyboard-reachable controls, and tabs that wrap rather than hide at narrow widths. A design rule keeps paired columns the same height.

## Run and test

```bash
npm install
cp .env.example .env   # optional: your own Supabase project for cloud sync
npm run dev            # http://localhost:5175
npm test               # unit tests
npm run test:e2e       # end-to-end suites (needs Google Chrome)
```

Cloud sync and push setup: [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md).

---

## Inside the app

*"The Lord is my helper" (Hebrews 13:6).* βοηθός means helper.

Boēthos is the home page, and the app always opens there. It shows:

- the verse of the day;
- what is still to do today;
- your streak, XP and analytics.

From it, two cards lead into the two sections:

- **Spoudazō** (σπουδάζω, 2 Timothy 2:15): your own walk with God. Quiet time, prayer and fasting, the Word, study topics, books and messages, built from the rhythm you set.
- **Poimainō** (ποιμαίνω, John 21:16): your Bacenta. People, Thursday and Saturday, follow-up, sermons and campaigns.

Every page carries a KJV verse.

## Run it

```bash
cd shepherds-roadmap-app
npm install
npm run dev        # http://localhost:5175
```

## Spoudazō

| Place | What it does |
| --- | --- |
| **Today** | Your rhythm for today. Each discipline is ticked when you record the real thing, right there. |
| **Quiet time** | A guided morning time with God, the journal, and Character (self-examination and your rule of life). |
| **Prayer** | Prayer times, the prayer log (ACTS), requests and fasting. |
| **The Word** | Bible reading through all 66 books, study topics (one focus at a time), and memory verses. |
| **Library** | Books for you and for your members (Bishop Dag Heward-Mills' first), messages and camps. |

The phased plan has been retired. Where each phase went is in `docs/SPOUDAZO.md`.

## Poimainō

| Place | What it does |
| --- | --- |
| **Dashboard** | The action centre (every alert with its reason; done, snooze or dismiss), the latest Thursday and Saturday, Vision 25, the weekly review and Greater Love settings. |
| **People** | One record per person, from contact to stable member, with dated history. Also:<br>• soul list and outreach;<br>• workers and the leadership pipeline;<br>• private care needs. |
| **Services** | Thursday Bible study and Saturday church:<br>• attendance (unmarked is not absent);<br>• versioned reports;<br>• a deterministic reflection;<br>• trends. |
| **Follow-up** | Calls, messages, visits and welcomes. Attempted is kept separate from reached. Includes the pre-service call list. |
| **Sermons** | Thursday preparation, from the material arriving to reflection. |
| **Campaigns** | All 22 emphases with source and local actions, the setup wizard, reviews, and the manual's optional start-up preset. |

The earlier Flock and Pulpit pages now live in Poimainō, and their old addresses redirect.

Full details:

- Boēthos and Spoudazō, and where the old phases went: `docs/SPOUDAZO.md`;
- what comes from the books, what you required and what is app design: `docs/POIMAINO.md`;
- privacy rules and validation results: `docs/POIMAINO.md`;
- cloud sync and phone reminders: `docs/CLOUD_SETUP.md`.

## Your data

Your data is saved in this browser under the same key as before (`shepherd_os_v1`), so nothing you recorded is lost. The old Flock and Pulpit records were copied into Poimainō once, and the originals were left untouched.

To get the same data on your phone and computer, connect your own Supabase project (Account → Cloud and push), or use a backup file. Restricted pastoral notes stay out of backups and sync unless you choose otherwise.

Previous interfaces are kept in `_backup-v2-ui/` and `_backup-old-ui/`.
