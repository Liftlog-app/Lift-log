# Roadmap

Owned by the Product Lead. Newest decisions at the top of each section.

## This week (2026-W48 run 2, planned 2026-11-28)

Three pull requests, in this order, following Nheil's queue. Item 3 (domain + email) waits for the 2026-12-05 run.

| PR | What | Branch | Test file | Status |
|---|---|---|---|---|
| A | Item 0: Start Workout in every week, auto-advance to the next week | (PR #10) | (in PR #10) | Built, open as https://github.com/Liftlog-app/Lift-log/pull/10, in QA. Fix QA findings on that branch only |
| B | Item 2: Program tab, interactive and better looking | `agent/program-tab` | `tests/program_tab.test.cjs` | To build |
| C | Item 4: History tab with month calendar and workout cards | `agent/history-tab` | `tests/history_tab.test.cjs` | To build after B. If time runs short, open C as a draft PR that lists what is left |

### Rules for B and C (both branch from `main`, not from PR #10)

- **Do not use anything PR #10 adds.** It adds the session field `pw`, `sW(session)` (the program week of a session) and `curW()`. None of these exist on `main`.
  - Program (B): get the current program week from one small helper, `progNowWk=()=>wkOf(wOf(iso(today())))`, with a comment `// swap to curW() after PR #10 merges`. Call it everywhere and never inline the formula.
  - History (C): needs no program week at all. Work from `date`, `s`, `dn`, `ex`, `dur` and `live`. Do not show week numbers.
- **Merge-conflict risk:** A, B and C all edit `src/index.html`, and so the generated `docs/index.html` and `app/src/main/assets/index.html` too. PR #10 touches `renderHome`, `renderToday`, the header week strip, `startWorkout`/`sessionDoc` and the week helpers near `wOf`/`wkOf`. B and C share the global click handler and the `<style>` block. To keep conflicts small:
  - Only edit your own tab's render function. Put new functions right after it, inside a comment block such as `/* ---------- program tab ---------- */`.
  - Add click handling in **your own delimited block**: either a separate `document.addEventListener('click',…)` that returns early for other targets, or a clearly marked group of `if` lines. Do not reorder or reformat existing handler lines.
  - Put new CSS in one block at the end of `<style>` with a `/* program tab */` or `/* history tab */` comment. Do not edit shared rules (`.card`, `.hist`, `.cday`, `.btn`, `.small`).
  - Do not touch `renderHome`, `renderToday`, `wOf`, `wkOf`, `startWorkout`, `sessionDoc` or `openCal`.
  - Suggested merge order for Nheil: A (#10), then B, then C. After each merge, the next branch merges `main` back in and re-runs `python3 scripts/sync.py`. Generated-file conflicts are always solved by re-running sync, never by hand-editing.
- **Data:** B and C add no new stored fields. B writes only through the existing `putProfile({swaps})` and `editProg(...)`. C is read-only apart from the existing Delete. `sessions` must be byte-for-byte unchanged after opening and using either tab.

---

### PR B: Program tab (`agent/program-tab`)

**User problem:** The Program tab is a plain text editor, so a lifter can't see where they are in the 15-week plan, what any coming week asks of them, or what changes next week.

**What to build** (top to bottom on the tab):

1. **Header with progress ring.** Show this only for periodized plans (`p.ppl` or `p.periodize`).
   - An SVG ring (`.pring`, `role="img"`, aria-label "Week 3 of 15, 14% through the block") sits next to the plan name and block name.
   - Fill = `(wk − 1 + days done this week ÷ days in program) ÷ 15`. `wk = progNowWk()`, and "days done this week" uses the existing `doneThisWeek(k, wOf(today))`.
   - The centre text reads "Wk 3/15".
2. **Tappable 15-week timeline.** Show this only for periodized plans.
   - 15 buttons (`data-ptl="1".."15"`), coloured by block like the Home bar (Hypertrophy red, Strength blue, Peak yellow). Deload weeks 5 and 10 and test week 15 get a small marker.
   - The current week is outlined (`.now`) and the selected week is filled (`.sel`, `aria-pressed="true"`). Block labels sit underneath.
   - Each button is at least 44 px tall. 15 buttons fit in 390 px as a two-row grid (8 + 7) or a horizontal scroller with scroll-snap. Pick whichever looks better, but nothing may cause page-level horizontal scroll.
   - The selected week starts as the current week. It is kept in a module variable, so it survives re-renders, until the tab is reopened.
3. **Week preview: one day card per program day.**
   - Each card shows the day colour as the card accent (`--c: day.c`) and the day name. The heading reads "Week N · Block name", plus "deload" or "test week" where that applies.
   - Each card lists its exercises for the selected week. Each row has:
     - a photo thumbnail from `exPic(name)` (falls back to the drawn figure)
     - the name, with swaps applied
     - "sets × reps · RPE x" and the note, if any (for example "~85% of 1RM" or "Deload: ~60% of last week")
   - The data comes from the existing pure functions: `pplPlan(N,k)` for PPL plans, `periodize(day.ex,N)` for periodized custom plans, and the raw `day.ex` for other plans. Do not apply pain adjustments here; this is the plan.
   - Non-periodized custom plans have no ring and no timeline, just these cards with plain sets × reps.
4. **"This week vs next" changes.** On each exercise row in the preview, compare week N with week N+1 for the same exercise and show a small change chip: "RPE 8 → 9", "Sets 4 → 2", "Reps 8–10 → 6–8", or "New lift next week" / "Not in next week". Put a one-line banner above the cards when the next week starts a new phase: "Next week: Deload", "Next week: Strength block", "Next week: Peak block", "Next week: Test week", or "Next week: New cycle" after week 15. Unchanged exercises show no chip. Chips must also make sense without colour (the text carries the meaning).
5. **Tap to swap.**
   - A swap button (`data-pswap="di.ei"`, at least 44 px, same icon as the Workout tab) on each preview row opens an inline panel. The panel lists `alts(base)` with photos, reusing the Workout tab's photo dropdown markup and CSS if possible, and has "Use it", "Back to <original>" (when swapped) and "Cancel" buttons.
   - Saving copies the Workout tab logic (`data-swapgo` handler, around line 1723). PPL plan: `putProfile({swaps})` with key `k+'|'+base`, and the plan stays `ppl:true`. Custom plan: `editProg` renames that exercise.
   - Week 11–15 rows whose name comes from `B3MAIN`/`TEST` swap under their own base name, exactly as the Workout tab does today.
6. **Editor (kept, restyled).** All existing editor controls stay on the tab, visible without extra taps, with the same `data-` attributes: `data-pd`, `data-pdel`, `data-pe`/`data-pf`, `data-padd`, `data-pdayadd`, `data-pup`, `data-pxdel`, and the `#exlist` datalist.
   - Make the editor's day sections plate-coloured to match the preview, and add a photo thumbnail to each row.
   - **Reorder:** add a **Move down** button (`data-pdown="di.ei"`, disabled on the last row) next to the existing Move up. Make both at least 44 × 44 px. **No drag-to-reorder in this PR** (see `decisions.md`, 2026-11-28).
   - Keep the existing note that editing a PPL plan switches it to the custom block pattern.
7. **Transitions.** Changing the selected week cross-fades or slides the preview (CSS only, about 200 ms). Opening the swap panel expands smoothly. Everything is instant under `prefers-reduced-motion: reduce`.

**Acceptance criteria** (`tests/program_tab.test.cjs`, jsdom, fixed date **2026-11-28T12:00**, throws an Error on any failure, and the page logs no errors):

Seed: PPL user, `profile.start:'2026-11-14'`. Weeks 1 and 2 are complete, with all six PPL days logged on dates inside those weeks, plus `pushA` logged on 2026-11-28. So the calendar week and the completed-workout week are both **week 3**, and the test still holds after PR #10 merges.

- [ ] Opening Program shows the ring with "Wk 3/15" and an aria-label containing "Week 3 of 15". The fill fraction is (2 + 1/6) / 15 ≈ 14% (check the stroke-dasharray/offset value or a `data-pct="14"` attribute).
- [ ] The timeline has exactly 15 `[data-ptl]` buttons. `[data-ptl="3"]` has `.now` and `aria-pressed="true"`.
- [ ] There are 6 preview day cards. Push A's first row is "Bench press" with "RPE 8", and it has a change chip containing "RPE 8 → 9" (week 3 vs 4).
- [ ] Tapping `[data-ptl="5"]` marks it selected. Push A shows the deload: half the sets of week 4 (rounded up), "RPE 6", and a note containing "Deload". The banner reads "Next week: Strength block".
- [ ] Tapping `[data-ptl="11"]` shows Push A's first row as Bench press "4 × 4 · RPE 8" with "~85% of 1RM", matching `window.pplPlan(11,'pushA')[0]`.
- [ ] Each preview row has an `img` or drawn-figure `svg` thumbnail.
- [ ] Swap (PPL): tap `[data-pswap]` on Push A row 0, pick the 2nd alternative and tap Use it. Then `profile.swaps['pushA|Bench press']` equals that name, `profile.program` is unchanged and `ppl` is still true, the preview row shows the new name, and on the Workout tab Push A's first card `h3` shows it too. "Back to Bench press" removes the key.
- [ ] Swap (custom plan, second jsdom instance with a Full Body preset): swapping renames `profile.program.days[0].ex[0].n` in storage.
- [ ] Reorder: on the custom plan, `[data-pdown="0.0"]` swaps `ex[0]` and `ex[1]` in storage, and `[data-pup="0.1"]` swaps them back. The last row's `data-pdown` is disabled.
- [ ] Editor still works: `data-padd`, editing `data-pf=n`, `data-pdayadd` and `data-pdel` (two taps) all save as before.
- [ ] A non-periodized custom plan renders day cards with no `.pring` and no `[data-ptl]`, and logs no errors.
- [ ] `JSON.stringify(sessions)` in storage is identical before and after the whole test.
- [ ] CSS: `[data-ptl]`, `[data-pswap]`, `[data-pup]` and `[data-pdown]` have `min-height` (and, for the icon buttons, `min-width`) of at least 44 px. A `prefers-reduced-motion` rule disables the new transitions.
- [ ] Designer: screenshots at 390 px in dark and light mode, before and after. No horizontal page scroll. Text contrast is readable on all three plate colours.

**Must not break:** `tests/onboarding_and_program.test.cjs` unchanged (it uses `data-padd`, `data-pf=n`, `data-pdayadd` and the Workout swap); presets; periodization; the `profile.program`/`swaps` format; Workout-tab swaps with photos; header week strip and week navigation; all features listed in CLAUDE.md rule 5; all existing tests.

---

### PR C: History tab (`agent/history-tab`)

**User problem:** History is a flat list, so a lifter can't see at a glance which days they trained, how a month went, or what they lifted in a past workout without opening it in the Workout tab.

**What to build** (top to bottom):

1. **Month calendar** (inline, not a popup). Use the look of the custom date picker in `openCal`. You may copy its grid maths and day-cell styling into new `.hcal*` classes, but do not change `openCal`, `.cday` or the `custom_pickers` behaviour.
   - Month title, with previous and next arrows (`data-hm="-1"` / `data-hm="1"`, at least 44 px). Next is disabled after the current month.
   - Swipe: a horizontal swipe on the grid (more than 50 px, mostly horizontal, using `pointerdown`/`pointerup` like `openCal`) changes the month.
   - Each day is a button `data-hd="YYYY-MM-DD"` with an aria-label like "Tue, Nov 24, Push B logged".
   - Days with workouts show up to 2 dots in `dayColor(s)` (Push red, Pull blue, Legs yellow).
   - Today has a ring (`.td`). The selected day is filled (`.on`, `aria-pressed="true"`).
   - Opening month: today's month. If that month has no workouts but older ones exist, open the month of the most recent workout.
   - Live (in-progress) sessions count as logged.
2. **Month summary strip** (4 tiles under the calendar, reusing `.prs`/`.pr` styling):
   - **Workouts:** sessions in the month that have sets, plus live sessions.
   - **Volume:** Σ w × r, rounded, in `unit()`, the same maths as today's list.
   - **PRs:** PR events dated in the month. A PR is a lift whose `bestEst` beats that lift's previous best from all earlier sessions by more than 0.5% (the same rule as the Home "Recent records"). A first-ever log is not a PR.
   - **Longest streak:** the longest run of consecutive calendar days with a workout inside the month, labelled "days in a row".
   - The summary always covers all workouts in the month (filters do not change it).
3. **Workout cards** for the shown month, newest first (same sort as today).
   - **Keep the root class `hist`** (add a modifier such as `hist wcard`) and keep a first `.meta` line with the same text as today: "date · N sets · volume unit · N min", with the "In progress" tag for live sessions.
   - Keep the `[data-open]` and `[data-del]` buttons, with Delete needing two taps (`armed`).
   - Each card adds: the day colour accent and name (`dn`, or the `SESS` name), and a PR badge ("2 PRs") when the session has PRs.
   - Tapping the card header (a button, `aria-expanded`, `data-hx="<id>"`, at least 44 px) expands it smoothly (CSS `grid-template-rows` 0fr → 1fr or similar, instant under reduced motion). The expanded card lists every exercise with a small photo, and every set as "155 × 8 · RPE 8" (leave out RPE when it was not logged). PR sets are marked.
   - Tapping it again collapses it. Several cards can be open at once, and the open state survives re-renders.
4. **Tap a day.**
   - Tapping a calendar day with workouts selects it, expands that day's card(s), collapses the others and scrolls the first one into view (`scrollIntoView` guarded for jsdom).
   - Tapping a day with no workout shows a quiet line: "No workout on Tue, Nov 10."
   - Tapping the selected day again clears the selection.
5. **Filters and search** (in scope; if time runs out, ship without them and say so in the PR):
   - Chips All / Push / Pull / Legs (`data-hf="all|push|pull|legs"`, at least 44 px) narrow the card list by day colour (red = Push, blue = Pull, yellow = Legs; other colours appear only under All).
   - A search box (`#hq`, `type=search`, label "Search exercise") narrows cards to sessions with a matching exercise name (case-insensitive substring) **across all months**, under the heading "Results in all months".
   - Filter and search combine. With no results, show "No workouts match."
   - The calendar and summary are not filtered.
6. **Empty state** stays the same: "No workouts logged yet." when there are no sessions at all.

Not in this PR: a streak/heat strip (moved to Next).

**Acceptance criteria** (`tests/history_tab.test.cjs`, jsdom, fixed date **2026-11-28T12:00**, throws an Error on any failure, and the page logs no errors):

Seed (lb, PPL; sets without `e` count as RPE 10 in `estSet`, so the 11-02 bench is not a PR):
- 2026-10-15 `pushA`: Bench press 135×8
- 2026-11-02 `pushA`: Bench press 135×8, 135×8
- 2026-11-04 `pullA`: Barbell row 135×8
- 2026-11-06 `legsA`: Back squat 185×5
- 2026-11-24 `pushB`: Bench press 155×8 `e:8` (the only PR)
- 2026-11-25 `pullB`: Pull-up (weighted) 25×6, with `dur:52`
- 2026-11-26 `legsB`: Deadlift 225×5

- [ ] History opens on November 2026. The cells for 02, 04, 06, 24, 25 and 26 have a dot whose colour is `dayColor` of that session. `[data-hd="2026-11-28"]` has `.td`. Days with no workout have no dot.
- [ ] Summary: Workouts **6**, Volume **6,680 lb**, PRs **1**, Longest streak **3** days in a row.
- [ ] Six `.hist` cards, newest first, each with `[data-open]` and `[data-del]`. The 11-25 card's `.meta` contains "52 min". The 11-24 card shows a PR badge.
- [ ] Tapping `[data-hx]` on the 11-24 card sets `aria-expanded="true"`, and the card shows "155 × 8" and "RPE 8". Tapping again sets it to false.
- [ ] Tapping `[data-hd="2026-11-02"]` expands only the 11-02 card (the others collapse) and marks the day `.on`. Tapping `[data-hd="2026-11-10"]` shows "No workout on" and logs no error.
- [ ] `[data-hm="-1"]` shows October 2026: one dot (the 15th), summary Workouts 1, PRs 0 (first-ever log). `[data-hm="1"]` returns to November, and in November `[data-hm="1"]` is disabled.
- [ ] Swipe: dispatching `pointerdown` (clientX 300) then `pointerup` (clientX 200) on the grid in November goes to October. (jsdom: `new w.MouseEvent('pointerdown',{clientX:300,clientY:100,bubbles:true})` is enough, because the handler reads `clientX`/`clientY`.)
- [ ] Filters: `[data-hf="pull"]` leaves only the 11-04 and 11-25 cards, and the summary still says 6. Search "bench" (input event on `#hq`) shows the 10-15, 11-02 and 11-24 cards under "Results in all months". Search "zzz" shows "No workouts match."
- [ ] A second jsdom instance at **2026-12-03** with the same seed opens on November (latest workout's month).
- [ ] In a third instance (seed plus a live `pushA` session dated 2026-11-28), the 28th shows as logged and its card has "In progress". `[data-open]` on it opens the Workout tab on that day.
- [ ] Delete still needs two taps and removes only that session.
- [ ] `JSON.stringify(sessions)` is unchanged by everything except the Delete step.
- [ ] CSS: `[data-hd]`, `[data-hm]`, `[data-hx]` and `[data-hf]` are at least 44 px tall. 7 day columns fit in 390 px with no horizontal page scroll. A reduced-motion rule is present.
- [ ] Designer: screenshots at 390 px in dark and light mode, before and after.

**Must not break:** `tests/onboarding_and_program.test.cjs` (`.hist` text, `[data-open]`), `tests/start_end_workout.test.cjs` (`.hist .meta`), `tests/pain_log.test.cjs` (`.hist b` on the Body tab, so the `.hist` CSS must stay), `tests/custom_pickers.test.cjs` and the date picker, week navigation from the History tab (`data-jw` in the header strip, `tests/week_navigation.test.cjs`), all `sessions` data, all features in CLAUDE.md rule 5, and all existing tests.

---

## Queued by Nheil (2026-11-26), status after the 2026-11-28 planning

R. **Research: ways to monetize Lift Log.** **Done 2026-11-28** → `ops/research/monetization.md`. Outcome: Pro groundwork added to Now/Next/Blocked below. Nothing paid is built.
0. **Bug: no Start Workout button after Week 1 / no auto-advance.** **Built as PR #10, in QA** (This week, PR A).
1. **Bug: Home week bar Peak columns.** **Done, PR #6 merged.**
2. **Program tab.** **This week, PR B.**
3. **Domain + email (SMTP) setup for launch.** **Schedule: do this in the Saturday 2026-12-05 team run, NOT the 2026-11-28 run** (Nheil, 2026-11-26).
   - **Why:** Supabase's built-in mailer only reaches Nheil's own address, 2 emails/hour. Real users can't get "confirm your email" or "reset password" emails until a real email service is connected. A domain also gives the Google Play privacy-policy page and the brand a home.
   - **Agents can't buy, sign up or pay.** So this run produces a ready-to-follow kit and drafts, and Nheil does the account steps.
     1. **`ops/launch/email-setup.md`**: a short, step-by-step phone-friendly guide for Nheil:
        - pick and buy a domain (compare 2–3 registrars and prices, suggest available names like liftlog-style options, and check `.app` / `.com`)
        - create a free account at an email service (compare Resend vs Brevo free tiers with current numbers and sources)
        - verify the domain (the DNS records to add)
        - paste the SMTP settings into Supabase → Authentication → Emails → SMTP Settings
        - raise Authentication → Rate Limits
        - set the sender name to "Lift Log"
        - send a test
     2. **Branded auth email templates** (`ops/launch/email-templates/`): "Confirm your email", "Reset your password" and "Change email". Simple HTML with the check-bar logo and plate colours, using Supabase's template variables (`{{ .ConfirmationURL }}`), mobile-friendly and with a plain-text fallback.
     3. **Privacy policy page draft** (`docs/privacy.html`, via PR, needed for Google Play). It covers:
        - what's stored: workouts, profile and email, and only if you make an account
        - where: Supabase
        - no tracking, no ads networks, no selling data
        - how to delete: Settings → Delete account
        - a contact email (placeholder until the domain exists)
        - (added 2026-11-28) a short line that no payment data is handled by Lift Log; future purchases go through Google Play / the App Store
     4. Update `ops/accounts/README.md` and the "Waiting on Nheil" list with the exact remaining clicks.
   - **Acceptance:** Nheil can finish everything in about 20 minutes from the guide, and the templates render on a 390 px phone in light and dark email clients. The PR (privacy page only) passes tests. No accounts are created and nothing is bought by agents.
4. **History tab with calendar.** **This week, PR C.**
5. **Rest timer alert: more noticeable ring and vibration** (Nheil, 2026-11-26). Coder (+ Designer for the visual). **Next build after this week.** It creates the first native bridge, which Pro billing and share cards will reuse (see Now).
   - **Problem:**
     - When rest ends, the app plays a short `beep()` and calls `navigator.vibrate([250,120,250,120,400])`. Nheil doesn't notice it and wants the phone to vibrate.
     - Android has the VIBRATE permission, but its WebView may ignore `navigator.vibrate`. iPhone WKWebView has no vibration API at all.
     - When the screen is locked or the app is in the background, the JS timer may not fire at all.
   - **Build:**
     1. **Louder, more noticeable ring:** a 3-pulse chime that repeats every ~2 s until the user taps OK, or for up to ~10 s. Uses Web Audio, louder and in a higher register than now. Respects the existing "Beep and vibrate when rest is over" setting.
     2. **On-screen alert:** a full-width "Rest over, next set!" banner that flashes or pulses in the day's colour, with a big OK button (44 px or larger). Respects reduced motion (no flashing, just a solid banner).
     3. **Vibration that actually works:**
        - Android: add a JavaScript interface in the WebView wrapper (`app/`) that calls the native `Vibrator` / `VibrationEffect` with a short pattern (e.g. 3 × 200 ms).
        - iPhone: add a `WKScriptMessageHandler` in `ios/` that calls `UINotificationFeedbackGenerator` (success) or `AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)`.
        - The web app calls the bridge when it exists and falls back to `navigator.vibrate`.
        - (added 2026-11-28) Design the bridge as one general `window.LiftLogNative` object so billing and share can be added later. **Do not change how the page is loaded (`file://`) in this PR.** Moving to `WebViewAssetLoader` changes where localStorage lives and needs its own migration PR (see Now).
     4. **Background / locked screen:**
        - When a rest timer starts, schedule a local notification for its end time, with sound and vibration. Cancel it if the timer is stopped or skipped.
        - Android: the notification channel needs vibration, plus the POST_NOTIFICATIONS permission prompt on Android 13+.
        - iPhone: `UNUserNotificationCenter` with a permission prompt.
   - **Must keep:**
     - the timer only starts after a set is logged
     - adaptive rest
     - the existing sound setting
     - no new third-party code
     - one signing key, so existing installs update without losing data
   - **Acceptance:**
     - A jsdom test fakes the timer ending and checks that the banner shows, the chime repeats until OK, and the bridge is called (mock `window.LiftLogNative` / `webkit.messageHandlers`), with a fallback to `navigator.vibrate`.
     - Manual check on Nheil's Android: the phone vibrates and rings with the app open, and gets a notification with the screen locked. The PR must say clearly that the native parts can't be tested in CI.
6. **Accounts and cloud backup.** **Done, PR #8 merged.** Live with Nheil's Supabase project (`ops/accounts/README.md`). Real users' confirm/reset emails still need item 3.
7. **PR Perks + partner cards** (Nheil, 2026-11-26). Do this after accounts and the Google Play launch. Research ranks it the #2 income source (`research/monetization.md` §5).
   - **What it is:** brands advertise without being obnoxious.
     - Milestone rewards: a new PR or a streak unlocks a partner discount code (e.g. a bench PR → 15% off a belt).
     - At most one contextual gear tip or partner card per week, only after a workout. Never during sets, and no pop-ups.
     - Sponsored programs ("12-Week Strength, presented by X").
   - **Rules:**
     - Always labelled "Partner" or "Sponsored" (US FTC disclosure), plus the line "Lift Log earns a commission" right next to the link (added 2026-11-28, per the FTC FAQ in the research).
     - One-tap dismiss.
     - Fitness, gear, recovery and nutrition only. No fat burners or extreme-diet products.
     - **No tracking:** offers are static codes or links that open in the browser, and no user data goes to brands.
     - Pro users can turn partner cards off.
   - **Data:** offers come from a JSON file in the repo (e.g. `docs/partners.json`) that Nheil edits. The app reads it from Nheil's own GitHub Pages, never an ad network.
   - **Money:** affiliate commission per sale, or a flat monthly fee per slot. The Marketer (when resumed) drafts the brand pitch.
   - **Later extension:** the gear-gap partner card (`ideas.md`).

## Now (next 2–4 weeks, after this week's three PRs)

1. **Item 5, rest timer alert + first native bridge** (above). This is Nheil's next queued item, and the bridge it adds is reused by Pro billing and PR share cards.
2. **Cut guard** (must ship before 2027-02-15, when Nheil's cut starts; the bodyweight tracker has merged): a weekly card that compares weight-trend %/wk with main-lift (`MAIN`) e1RM trend. It warns when loss is above 1%/wk *and* main-lift e1RM has fallen 2+ weeks in a row. The thresholds are guesses to tune on Nheil's cut. Grows into Pro #3 Cut coach.
3. **PR forecast** (Pro #1, ships **free at first**; it goes behind Pro only when the paywall exists). Research says at least 2 Pro features must be live before charging.
4. **Android origin spike + localStorage migration test** (agent-doable, no account needed): check whether Play Billing over `addWebMessageListener` needs `WebViewAssetLoader` (`https://appassets.androidplatform.net`) instead of `file://`. If it does, build a one-time copy of `liftlog.v1`, `liftlog.auth` and `liftlog.cloud` to the new origin, with a test, **before** any billing code. This protects user data.
5. **RPE coach for beginners**: a first-time explainer (RPE 7 ≈ 3 reps left) and a "how many more reps?" picker that maps to RPE.
6. **Set cap on a grinder**: after an RPE 10 set or missed target reps, offer to drop the remaining sets or cut their load.
7. **PR share cards**: one tap turns a new personal record into a branded image to post. Research: growth matters more than price (about $740/yr at 1,000 downloads), so this is the main growth loop. Needs a share/save call on the native bridge.

## Pro features (queued by Nheil, 2026-11-26)

Nheil picked these as the premium features to build toward the Pro tier. Build them in this order. They can ship free at first and be put behind Pro later, once accounts and store billing exist (see Blocked). Idea #3 ("Gym's packed" mode) was left out on purpose. Research suggests **$4.99/mo or $29.99/yr, with a 7-day trial on yearly only** (a guess to test, not decided; see Blocked).

1. **PR forecast** (easy): "At your current rate you'll bench 225 on Mar 14." Projects each main lift's e1RM trend to a target the user sets, updates after every workout, shows a countdown. Must say it's an estimate. Share-card ready later. **In Now.**
2. **"Only got X minutes"** (easy to medium): pick 20/30/45/60 min and today's workout shrinks to fit, keeping the main lifts' work sets and dropping accessories and extra sets first. Uses rest times to estimate length. Saved sessions keep their normal format.
3. **Cut coach** (medium): grows the **Cut guard** item above. Links the bodyweight trend to main-lift e1RM, warns when strength drops during a cut and offers to trim training volume to protect strength. Training guidance only: no calorie, macro or diet advice. Must be live before 2027-02-15.
4. **Ghost race a friend** (medium, needs accounts, which are now merged): race a friend's numbers set by set, like the current ghost race against your own past. Needs a sharing design on top of PR #8.
5. **Velocity Coach** (hard, headline feature after launch): film a set, track the bar path and rep speed on the device, estimate reps left from slow-down, and draw the bar path on the video for sharing. Must run on the phone with no uploads. Start with a research spike on camera access in the Android/iPhone web views.

## Next

- **Pro paywall + Play Billing** (after the Blocked steps below, the origin spike and 2 live Pro features): `window.LiftLogNative.buy('pro_yearly')` → `profile.pro = {plan, until, store}` (new field) → receipt check in a Supabase Edge Function → "Restore purchases". The paywall shows the **free-forever pledge** and an **honest trial** (exact charge date and price, reminder 2 days before, one-tap "How to cancel"). No dark patterns: no pre-checked yearly upsells, no fake countdowns.
- **"Only got X minutes"** (Pro #2).
- Streak/heat strip on History (split out of PR C).
- Exercise library: browse exercises with photos, muscles and how-to steps (Free Exercise DB). Bundling the instruction text into the one-file app needs a size check first.
- Year recap card ("Lift Log Wrapped"): reuse the PR share card renderer. Aim for late December if share cards land first.
- Equipment-aware suggestions, part 2: dumbbell steps, Smith/EZ bar weights per exercise.
- Boxing mode: round timer for bag work that logs rounds
- Competition or event dates: plan peaking and tapering backward from a date
- Total training load: lifting + sport/cardio sessions and a this-week-vs-4-week-average warning
- Supersets and circuits
- Notes per exercise and per workout
- Export to CSV

## Later

- Founding Lifter lifetime ($79.99, first 90 days after Pro launch only) and Nheil's own programs as paid packs. Both reuse the billing bridge.
- Gear-gap partner card (extends PR Perks).
- Web checkout (Stripe) for the GitHub Pages version and maybe iPhone. Revisit after the Supreme Court ruling (argued 2027-01-11).
- Hands-free voice logging (web version first)
- Wearable data (heart rate variability, sleep) feeding the readiness score
- Coach view for trainers with several athletes

## Blocked (needs Nheil)

- **Confirm Pro pricing and the free-forever pledge** (a decision only, about 2 minutes). Reply in `ops/feedback.md` or chat:
  1. OK to promise "everything free today stays free, your data is never locked"? (PL recommends yes.)
  2. OK with $4.99/mo or $29.99/yr, with a 7-day trial on yearly only? Or name other prices.
  3. Want a Founding Lifter lifetime at launch (yes/no, price)?
- **Google Play release** (needed before any Play Billing):
  1. Create a Google Play developer account at play.google.com/console ($25 one-time) and complete identity verification.
  2. Item 3 (2026-12-05) gives the privacy policy page and support email that the listing needs.
  3. Run a closed test with 12+ testers for 14 days (Nheil's gym friends).
  4. Agents then switch the build to a private release signing key (an agent task, but Nheil must store the key backup safely).
- **Selling Pro on Android** (after the Play account): in Play Console, set up a **payments profile** (Setup → Payments profile: legal name, address, bank account for payouts) and create subscription products `pro_monthly` and `pro_yearly`. Check that the 15% service-fee rate applies to the account (research §3).
- **App Store release + selling Pro on iPhone**: join the Apple Developer Program ($99/yr), apply to the App Store Small Business Program (15%), and accept the Paid Apps agreement with tax and banking info in App Store Connect.
- ~~**Accounts and cloud sync**~~: done (PR #8 merged; Supabase project live).

## Done

- 2026-11-28 · Research: ways to monetize (item R) → `ops/research/monetization.md`
- PR #9 · new GitHub Pages address after the repo moved to `Liftlog-app`
- PR #8 · Accounts and cloud backup (Supabase, plain fetch, offline-first; item 6)
- PR #7 · Agent dashboard and Saturday run time (ops only)
- PR #6 · Home week bar fix: Peak weeks no longer giant columns (item 1)
- PR #5 · 3D interactive body for the pain map
- PR #4 · Tactile buttons, logo intro, custom dropdowns and date picker
- PR #3 · New check-bar logo for app icons and header
- PR #2 · Simpler, calmer, more eye-catching UI
- PR #1 · Bodyweight and cut tracker + barbell weights rounded to the user's real plates (equipment-aware part 1)
- Home screen with today's workout, week strip, streak, plan progress, recent records (build 17)
- Real exercise photos in the swap dropdown (build 16)
- Rest timer only while resting; swap dropdown with pictures (build 15)
- Start/End workout buttons with accurate workout time (build 14)
- UI polish: bottom tab bar, compact header, status pills (build 13)
- Warm-up sets, plate math, weekly coach report
- Week navigation and week-based checkmarks
- Pain and injury log with body map and automatic exercise swaps
- Plateau fixer, readiness check, effort-based rest, ghost race
- RPE-based weight suggestions
- Program presets and editor, rest timer, workout clock, backup and restore
- 15-week Push Pull Legs plan with Hypertrophy, Strength and Peak blocks
- Android app, iPhone app and home-screen web version
