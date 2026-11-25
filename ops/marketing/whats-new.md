# What's new

Marketer drafts. Newest round at the top. Nothing here has been posted.

**Limits:** Google Play "What's new" allows 500 characters per language ([secondary source citing Play Console help](https://deku.posstree.com/en/share/google-play/release-notes-character-limit/), checked 2026-11-24). App Store "What's New in This Version" is "Limited to 4000 characters" and isn't available for an app's first version ([App Store Connect help](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information), checked 2026-11-24). Keep every release note under 500 characters so one text works in both stores.

---

## Round 0: launch round (cycle 2026-W48, 2026-11-24)

No PRs have been merged through the agent team yet. This round covers what is already in the app (roadmap "Done", builds 13–17 and earlier) so there is launch copy ready, plus a clearly marked teaser.

### Launch release notes (first store version, under 500 characters)

> Lift Log coaches every set. Log a set with how hard it felt (RPE) and get the weight for your next one. Rate your sleep, soreness and energy, and the day's weights adjust. Stalled lifts get a plateau fix. Race last week's numbers set by set. Includes a 15-week Push Pull Legs plan, warm-ups with plate math, a pain log with joint-friendly swaps, rest timer and backup. Training guidance, not medical advice.

(About 410 characters by hand count. Paste into the console and check the counter before saving.)

### One line per feature (for release notes and changelogs)

| Build | Release-notes line |
|---|---|
| 17 | New Home screen: today's workout, your week at a glance, streak, plan progress and recent records. |
| 16 | Real exercise photos in the swap menu, so you can see the movement before you switch. |
| 15 | The rest timer now appears only after you log a set. Swap menu shows pictures. |
| 14 | Clear Start and End workout buttons, so your workout time is accurate. |
| 13 | Cleaner look: bottom tab bar, compact header and status pills. |
| earlier | Warm-up sets with plates per side, plus a weekly coach report. |
| earlier | Move between weeks. Workouts are checked off for the week you did them. |
| earlier | Pain log with a body map. Exercises that load a sore area are swapped for joint-friendly options. (Not medical advice.) |
| earlier | Plateau fixer, readiness check, effort-based rest times and ghost race against last week. |
| earlier | Weight suggestions for your next set based on RPE. |
| earlier | Program presets and editor, rest timer, workout clock, backup and restore. |
| earlier | 15-week Push Pull Legs plan in Hypertrophy, Strength and Peak blocks. |
| earlier | Available as an Android app, iPhone app and home-screen web app. |

### Short posts (social text or story slides, one per feature group)

**1. Launch: "Why I built Lift Log"**
> I built Lift Log because every tracker I tried only recorded my sets. I wanted one that tells me what to do next. Rate how hard a set felt and it suggests your next weight. Bad sleep? The day adjusts. Stuck? It suggests a fix. It's the app I use for my own training, and now you can use it too.

**2. RPE suggestions**
> Lift Log reads your effort. Log a set at RPE 9 and it suggests a lighter next set. Log an RPE 6 and it tells you to go up. That's coaching, not just logging.

**3. Ghost race**
> Every set races last week's you. Green, you beat it. Red, past you won. Progressive overload with a scoreboard.

**4. Readiness check**
> Slept 5 hours? Rate your sleep, soreness and energy before you lift, and Lift Log adjusts today's weights. No skipping, no ego lifting.

**5. Plateau fixer**
> When a lift stalls, Lift Log notices and tells you what to change. No more guessing for weeks.

**6. Warm-ups and plate math**
> Warm-up sets to your top weight, with the plates for each side already worked out. Less mental math between sets.

**7. Pain log with swaps**
> Shoulder feeling off? Mark it on the body map and Lift Log swaps in joint-friendly exercises. Training guidance, not medical advice. If something hurts, get it checked.

**8. Home screen and real photos (builds 16–17)**
> New Home screen: today's workout, your week, your streak and your latest records in one place. The swap menu now shows real exercise photos.

**9. Start/End and rest timer fixes (builds 14–15)**
> Clear Start and End buttons so your workout time is right. The rest timer only shows up after you log a set.

### Teaser: coming soon (NOT shipped, PR #1 is open and unmerged)

Only post this once Nheil decides to tease unmerged work. Don't put it in store release notes until the build that includes it is published.

> **Coming soon to Lift Log: bodyweight and cut tracker.** Log your morning weight and see the trend line through the daily noise, your weekly rate in lb and % of bodyweight, and whether that pace keeps your strength (colour-coded from research guidelines). Set a goal weight and date and see the weekly pace it needs. Training guidance, not diet advice. I'm starting my own cut in February and will be using it the whole way.

Release-notes line ready for when it merges:

> New: Bodyweight tracker. Log your morning weight to see a smoothed trend, your weekly rate (lb and % per week, colour-coded), an 8-week chart and the pace your goal date needs. Barbell suggestions now round to plates you actually have.

(The second sentence covers the same PR's small fix: barbell weights rounded to the user's smallest plate.)
