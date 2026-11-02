# Poimainō: Greater Love Bacenta management

Boēthos (βοηθός, "helper", Hebrews 13:6) has two sections:

- **Spoudazō** (σπουδάζω, "be diligent", 2 Timothy 2:15): your own formation. This covers Today, Path, Prayer and Progress.
- **Poimainō** (ποιμαίνω, "shepherd", John 21:16): the people you shepherd at Greater Love Bacenta.

Switch between them with the control next to the logo. Each section remembers the page you were on.

## Where everything lives

| Area | Address | What it holds |
|---|---|---|
| Dashboard | `#/poimaino` | Action centre, latest Thursday and Saturday, Vision 25, stage distribution |
| Vision 25 | `#/poimaino/vision` | Stable members, movement over a period, roster review |
| Weekly review | `#/poimaino/week` | Unique people vs attendances, notes, copyable figures, weekly cycle |
| Settings | `#/poimaino/settings` | Times, report deadline, windows, stages, statuses, criteria, milestones, recipients, reminders |
| People | `#/poimaino/people` (`/souls`, `/workers`, `/care`, `/<id>`) | One record per person, from contact to stable member |
| Outreach | `#/poimaino/outreach` | Gospel encounters, invitations and next steps |
| Services | `#/poimaino/services` (`/trends`, `/<meeting>`) | Thursday and Saturday attendance, reports, reflection |
| Follow-up | `#/poimaino/followup` (`/visits`, `/calls`) | Calls, messages, visits, welcomes, the pre-service call list |
| Sermons | `#/poimaino/sermons` | Thursday preparation, from the material arriving to reflection |
| Campaigns | `#/poimaino/campaigns` (`/startup`, `/<id>`) | All 22 emphases, the wizard, reviews, the manual's start-up preset |

### Merged features (one feature in one place)

Features that existed before now live only in Poimainō:

- **Flock** became People.
- **Visits** became Follow-up → Visits.
- **Leaders** became People → Workers, plus the leadership pipeline on each person.
- **Counselling** became People → Care, as restricted care needs.
- **Pulpit** became Sermons.

The old addresses (`#/flock…`, `#/pulpit`) redirect to the new ones. Today still shows your care and sermon tasks, plus one "Poimainō" item when something needs you.

## Labels: source, requirement, design

Every template and rule carries one of three labels in the code (`src/data/ministry.js`). In the app they appear as tags:

- **Source teaching.** A short paraphrase of a reviewed book, with its chapter or page:
  - **D**: Dag Heward-Mills, *The Double Mega Missionary Church* (1st ed. 2019, © 2016), chapters as cited.
  - **H**: Dag Heward-Mills, *How to Start a Church* (© 2008), physical PDF pages, cover = page 1.
  - **B**: *The Bacenta Manual* (the supplied PDF, 22 pages; authorship and date not stated).
- **Your requirement.** Something you stated:
  - Greater Love;
  - Vision 25, with a baseline of about 3;
  - Thursday Bible study, which you lead and preach;
  - Saturday as the main service;
  - the seven camp stages.
- **App design.** A choice made in this app: statuses, workflows, calculations, reminders and screens. The books teach ministry practice; they do not prescribe software.

Still pending:

- **Mega Church chapter content** has not been reviewed. No chapter text or page numbers from it are used, and none have been invented.
- **Stage 5** is Son. People not yet assessed show as "Not assessed", never as stage 0.

## Data rules

- **One person, one record.** A soul becomes a visitor, then a member, then a stable member on the same record. Each change is dated and has a reason; becoming stable requires a reason. Possible duplicates are flagged (same name, or a similar name plus a shared phone or email; a shared phone alone is not enough), and merging keeps all history.
- **Meetings.** Thursday and Saturday are generated each week; there is no Sunday service unless you add one. A meeting is in one of these states:
  - scheduled;
  - unconfirmed ("Was it held?"), which counts as missing, not zero;
  - held, draft or submitted;
  - amending or amended;
  - cancelled.
- **Unmarked and zero.** An unmarked person is not absent. A held meeting submitted with nobody present is a real zero.
- **Submitting and amending.** Submitting twice with the same content adds nothing. Changing a submitted report starts an amendment, and the earlier versions are kept.
- **Counting.** Each person counts once. The weekly review shows unique people separately from service attendances. A record linked to several campaigns counts once.
- **Reflection** is deterministic: it compares Thursday with Thursday and Saturday with Saturday, using submitted meetings only. A percentage change from zero is not shown, and it never guesses why numbers moved.
- **Vision 25** counts stable members, kept separate from registered and active members. The baseline stays "reported" until you review the roster, and no pace is shown without a deadline.
- **Nothing is sent for you.** The app prepares reports and drafts, and you send them yourself. Adding someone to a WhatsApp group requires their consent, which is recorded on their page.

## Privacy

Restricted pastoral notes and care needs:

- **Where they appear.** They stay on the person's page, behind a Show button. They never appear in:
  - search;
  - the dashboard and alerts (a care review shows only "Care review: name");
  - reflections and shared figures;
  - notifications.
- **Backups.** The backup file leaves them out unless you tick "Include restricted notes".
- **Cloud sync.** Sync leaves them out unless you turn that on.
- **Restoring.** Restoring a backup or loading the cloud copy never removes notes already on this device.

Lock-screen text is always generic, for example "Greater Love: 2 things need you (follow-ups)."

The app has no surveillance features, no face recognition and no external AI. Nothing is uploaded except to your own Supabase project, and only if you connect one.

## Migration and rollback

- On first load, the old Flock, Visits, Leaders, Counselling and Pulpit records are **copied** into Poimainō. This happens once, and only adds records: anything already in Poimainō is kept.
- The old arrays (`members`, `visits`, `leaders`, `counselingCases`, `sermons`) are left untouched in the saved data.
- **To roll back,** restore an earlier backup file. The previous interfaces are kept in `_backup-v2-ui/` and `_backup-old-ui/`.

## Validation

The validation suites run on 1 November 2026. The checks run the real reducer and selectors in a browser.

| Spec check | Result |
|---|---|
| Soul → visitor → member, one record; duplicate flagged; shared phone alone not a duplicate | Pass |
| Merge joins attendance, follow-ups and notes; one entry per service | Pass |
| Stage 5 unresolved; not assessed ≠ stage 0 | Pass |
| Thursday and Saturday distinct, no default Sunday; 2 attendances = 1 unique person | Pass |
| Idempotent submit | Pass |
| Missing, zero, cancelled, unmarked and scheduled are distinct | Pass |
| Amendment is version 2; version 1 untouched | Pass |
| Reflection from 0 to 3 shows +3 with no percentage; like-for-like comparison | Pass |
| An encounter linked to two campaigns counts once; invitations unique per meeting | Pass |
| Tuesday material moves the plan; no material means "waiting", not overdue | Pass |
| 22 campaign templates, each with source, emphasis and local actions | Pass |
| Stable movement reconciles to net change; baseline stays reported | Pass |
| Reminders: quiet hours, categories, sent once, generic text, opaque push schedule, timezone | Pass |
| Restricted notes stay out of alerts, search, backups and sync | Pass |
| Migration is additive | Pass |

That is 35 of 35 checks. In addition:

- every page renders without errors (37 routes);
- the old addresses redirect;
- the earlier Spoudazō suites still pass.

**Not yet verified:** push notifications on a real phone. The app marks push as working only after you send a test from Account and confirm that it arrived (see `CLOUD_SETUP.md`).

## Still yours to configure

All of this is in Poimainō → Settings:

- meeting start times;
- the report deadline;
- report recipients;
- the Vision 25 deadline (optional);
- stage 5's name;
- reviewing the roster, so that the baseline is no longer an estimate.

For sync and push, see `CLOUD_SETUP.md`.
