# Feedback inbox

Nheil and testers: add a line here any time (newest at the top), or tell Claude in chat and it will add it. The Product Lead reads this first every cycle and marks items it has acted on.

Format: `- YYYY-MM-DD · who · what happened or what you want · (status)`

- 2026-11-27 · Nheil · Wants research on ways to monetize the app · (done 2026-11-28: `ops/research/monetization.md`. PL planned Pro groundwork in the roadmap; nothing paid is built. 3 pricing/pledge questions for Nheil are under Blocked)
- 2026-11-27 · Nheil · Only Week 1 workouts have a Start Workout button. After finishing every workout in a week, Home and Workout should move on to the next week · (built 2026-11-28 as PR #10, in QA; awaiting Nheil's merge)
- 2026-11-24 · Nheil · Hold off on the Marketer in every run until he says so · (active: Marketer paused)
- 2026-11-24 · Nheil · Wants the team to turn Lift Log into the best app in the App Store and Google Play · (goal; drives the roadmap, read by Product Lead 2026-11-24)
- 2026-11-24 · Nheil · Drawn exercise pictures looked bad; real photos are much better · (done, build 16)
- 2026-11-24 · Nheil · The rest-timer bar was always showing on the Workout tab; it should only appear after logging a set · (done, build 15)
- 2026-11-23 · Nheil · Workout clock kept counting after the workout; wants clear Start and End buttons · (done, build 14)
- 2026-11-23 · Nheil · Couldn't look at future weeks; Push A wasn't checked off when done earlier in the week · (done)

## 2026-11-26 (Nheil, via chat)
- Bug: on Home, the "Week 1 of 15" bar shows the 5 Peak weeks as huge yellow columns (Android screenshot). Queued; cause found (`.b3` class clash with the 3D body viewer). (done: PR #6 merged)
- Wants the Program tab more interactive and better looking. Queued. (planned 2026-11-28 as PR B, `agent/program-tab`)
- Wants the History tab more interactive and more appealing, with a calendar. Queued. (planned 2026-11-28 as PR C, `agent/history-tab`)
- Wants a more noticeable ring when the rest timer ends and the phone to vibrate. Queued (needs native vibration and notification bridges in the Android and iPhone wrappers). (roadmap Now #1, next build after this run)
- Queue accounts and cloud backup. Queued as item 6 (was listed as 5). (done: PR #8 merged)
- Wants a way for fitness brands to advertise without being obnoxious. Queued "PR Perks + partner cards" (after accounts and the store launch).
- Queue "domain + email (SMTP) setup" for the **2026-12-05** run (not 2026-11-28). Queued as item 3 with that date.
- Move the History tab redesign into the 2026-11-28 run, alongside the Program tab (two PRs). (acted on 2026-11-28: PR B then PR C)
