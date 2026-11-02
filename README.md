# Boēthos

**A ministry companion for a church cell-group (Bacenta) leader: one app for a personal walk with God and for shepherding the people in their care.**

Live: **https://boethos.ecmeserver.uk** · Installable on phone and desktop (PWA) · Works offline

## At a glance

| | |
| --- | --- |
| **What it does** | Tracks a personal spiritual rhythm (quiet time, prayer, Bible reading, fasting, study) and runs a small congregation: attendance for two weekly meetings, a weekly telepastoring call rota with retries and deadlines, follow-ups, visits, evangelism and a soul list, sermon preparation and a pulpit view, and weekly reviews. |
| **Stack** | React 18, Vite 6, plain CSS; Supabase (Postgres with row-level security, Auth, Edge Functions, pg_cron); Web Push (VAPID); deployed on Cloudflare Pages. |
| **Tests** | 60 unit tests (Vitest) on the domain logic, and 14 end-to-end suites (Puppeteer) that drive the real app in Chrome at phone and laptop widths. |

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

The app opens on the Boēthos home page: the verse of the day, what is still to do today, your streak and your analytics. From there, two sections:

- **Spoudazō** (σπουδάζω, 2 Timothy 2:15): your own walk with God.
- **Poimainō** (ποιμαίνω, John 21:16): the Bacenta you lead.

Every page carries a KJV verse.

### Spoudazō

| Place | What it does |
| --- | --- |
| **Today** | Your rhythm for today. Each discipline is ticked when you record the real thing. |
| **Quiet time** | A guided time with God, connected to your reading plan and study topic; the journal; character self-examination. |
| **Prayer** | Prayer times and the prayer log, prayer points by category, and fasting (recurring fast days included). |
| **The Word** | Bible reading through all 66 books, study topics with streaks, and a journal of what you learned. |
| **Library** | Books, messages and camps, with reading streaks. |

### Poimainō

| Place | What it does |
| --- | --- |
| **Dashboard** | The action centre (each alert with its reason), the daily rhythm, attendance charts, PVTI, the state of the flock, Vision 25 and the weekly review. |
| **People** | Everyone who has come to church at least once: members, stable members, first and second timers, visitors, new converts. Also:<br>• needs attention, by level;<br>• raising leaders;<br>• care needs, kept private.<br>“Gave their life” records the day and plans first steps. |
| **Services** | Thursday Bible study and Saturday church:<br>• attendance (unmarked is not absent);<br>• versioned reports;<br>• reflection;<br>• trends with first and second timers. |
| **Shepherding** | Five parts:<br>• the follow-up queue;<br>• **telepastoring**: everyone on the soul list once a week, Birmingham Monday to Wednesday and everyone else Thursday or Friday, with retries, invitations, a pace indicator and Saturday wake-up calls;<br>• visits;<br>• the PVTI log;<br>• the Bacenta chat. |
| **Evangelism** | Encounters, and the soul list: everyone from church, from evangelism, and anyone you pray for, by category and location. |
| **Sermons** | Every Thursday sermon, with the next one first. Materials (PDF, YouTube, audio), preparation stages, and a clean view to preach from. |

More detail:

- Boēthos and Spoudazō: `docs/SPOUDAZO.md`;
- Poimainō, its sources and its privacy rules: `docs/POIMAINO.md`;
- cloud sync and phone reminders: `docs/CLOUD_SETUP.md`.

## Your data

Everything is saved in your browser first, so the app works offline.

In **Settings → Phone and cloud**, create an account with your email and a password. Your data is then also kept in your private cloud copy and stays the same on your phone and computer. Only your account can read it.

Restricted pastoral notes stay on the device, and out of backups, unless you choose otherwise. Notifications never show names or notes on the lock screen.
