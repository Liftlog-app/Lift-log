# Roadmap

Owned by the Product Lead. Newest decisions at the top of each section.

## This week (2026-W48, planned 2026-11-24)

**Branch:** `agent/bodyweight-tracker` · one pull request · test file `tests/bodyweight_tracker.test.cjs`

### Feature: Bodyweight and cut tracker

**User problem:** A lifter who is cutting (Nheil: 180 → 165 lb by 2027-06-01, cut from about 2027-02-15) has no way in Lift Log to log weight, see the real trend through daily noise, or tell whether he is losing at a pace that keeps his strength.

**Why now:** Highest-value item that fits one PR. Starting to log now gives Nheil about 12 weeks of baseline before the cut, and the tracker is what next feature, **Cut guard**, needs. Cut guard compares this weight trend with main-lift e1RM, and none of the six main competitors does that automatically. See `ops/research/2026-11-24-cut-coaching.md`.

**What to build**

1. **Data (profile only, sessions untouched)**
   - `profile.bw`: array of `{d:'YYYY-MM-DD', w:Number, u:'lb'|'kg'}`, sorted by `d`, at most one entry per date. Logging the same date again replaces that entry. Missing `bw` means `[]`.
   - `profile.cut`: `{goal:Number, u:'lb'|'kg', by:'YYYY-MM-DD'}` or missing/null.
   - Save with `putProfile({bw})` / `putProfile({cut})` so local storage, the hosted `db` sync and backup/restore all keep working with no new code paths.
   - Each entry keeps the unit it was logged in. Display converts to the current `unit()` (1 kg = 2.20462 lb). Changing units never rewrites stored entries.
2. **Progress tab: new "Bodyweight" section at the very top** (above the weekly report)
   - Inputs: weight (`#bww`, `type=number`, `inputmode=decimal`, label "Morning weight (lb|kg)"), date (`#bwd`, `type=date`, default today, `max` = today), and a "Log weight" button (`#bwlog`, at least 44 px). Accept 30–700 lb (14–318 kg). Otherwise show a flash message and save nothing. Future dates are rejected.
   - Stat tiles (reuse `.prs`/`.pr`): **Trend** (exponential moving average: seed = first weigh-in, then `trend += 0.1 × (weight − trend)` per weigh-in in date order, shown to 1 decimal) and **Rate**.
   - **Rate** = 7 × least-squares slope of weight vs. day number for weigh-ins dated in the last 14 days (today − 13 … today). Shown as `−1.4 lb/wk · 0.78%/wk`, where % = rate ÷ mean weight of those weigh-ins. Needs at least 4 weigh-ins spanning at least 7 days. Otherwise show "Log 4 weigh-ins over a week to see your rate."
   - Rate colour (class on the rate tile or pill): loss 0.25–0.75 %/wk = `good` (green), loss above 0.75 up to 1.0 = `warn` (yellow), loss above 1.0 = `pain` (red, reuse existing pain colours), anything else (loss under 0.25 or a gain) = neutral, with the text "About steady" or "Gaining".
   - Chart: SVG of the last 56 days. Raw weigh-ins are faint dots, the trend is a solid line. Follow `mountChart` style, readable at 390 px in both themes. Give it `role="img"` and an aria-label.
   - "Recent" list: last 7 weigh-ins, newest first. Each has a remove button that needs a second tap to confirm (same "armed" pattern as restore).
   - **Goal**: goal weight (`#bwgoal`) and goal date (`#bwby`), plus "Save goal" and "Clear goal" buttons. When set, show "Goal: 165 lb by Jun 1 · needs 0.56 lb/wk (0.31%/wk)", where needed = (current trend − goal) ÷ weeks left (days ÷ 7). If needed %/wk > 1.0, show a `.hint.plat` warning: "That's faster than 1% a week. A later date or a smaller target keeps more strength." If the goal date has passed, or the trend is already at or below the goal, show a short neutral message instead of a rate.
   - Footnote (always shown, `.meta`): "Rate colours follow research guidelines for keeping strength while cutting (about 0.5–1% of bodyweight a week). This is training guidance, not medical or diet advice." No calorie, macro or diet advice anywhere.
3. **Home tab: one small card** (`.hcard`, below the week card, above Recent records)
   - If today is logged: "Bodyweight · 180.2 lb today · trend 180.6 lb", plus the rate when one exists.
   - Otherwise: "Bodyweight" with a "Log today's weight" button (`data-gotab="progress"`) that opens Progress and focuses `#bww`.
   - Never nag: no badge, no repeated prompts, no streak pressure for weigh-ins.

### Small fix 1: Suggested barbell weights you can actually load

**Problem:** `roundW` always rounds to 5 lb / 2.5 kg, even when Settings → Bar and plates says the smallest plate is bigger, so the coach suggests weights the user can't load. The plateau hint also says "add just 2.5 lb", which needs 1.25 lb plates the default gear doesn't have.

**Build:** For barbell lifts (`isBarbell(name)`), round suggested, warm-up, deload, back-off and PR-chance weights to `bar + k × step`, where `step = 2 × smallest plate in gear()`. Non-barbell lifts keep today's 5 lb / 2.5 kg step. With default gear (45 lb bar + 2.5 lb plates, or 20 kg bar + 1.25 kg plates) every number must stay exactly the same as today. In the 2-workout plateau hint for barbell lifts, show the real smallest jump ("add just 5 lb (2.5 per side)"). Non-barbell text stays as it is.

### Acceptance criteria (QA verifies with jsdom, fixed date 2026-11-24)

Bodyweight tracker:
- [ ] Old data with no `bw`/`cut` loads with no page errors. Home, Progress, Workout, History and Settings all render.
- [ ] Logging 180.4 on Progress saves `profile.bw = [{d:'2026-11-24', w:180.4, u:'lb'}]` to `localStorage['liftlog.v1']`. Logging 180.0 on the same date replaces it (still 1 entry).
- [ ] Logging a past date via `#bwd` adds a second entry, and the array stays sorted by date.
- [ ] Inputs of 0, 5, 900 and empty are rejected (nothing saved, message shown). A future date is rejected.
- [ ] Seed 14 daily weigh-ins from 2026-11-11 to 2026-11-24 going 180.0 → 177.4 (−0.2/day). Rate shows −1.4 lb/wk and 0.78%/wk (±0.02) with the yellow class. The same test with −0.1/day gives about 0.39%/wk, green. With −0.3/day it gives about 1.18%/wk, red.
- [ ] With only 3 weigh-ins, the rate tile shows the "Log 4 weigh-ins over a week" text and no number.
- [ ] Trend equals the EMA defined above, to 1 decimal, for the −0.2/day fixture.
- [ ] Goal 165 lb by 2027-06-01 with one weigh-in of 180 lb today shows needed ≈ 0.56 lb/wk and ≈ 0.31%/wk, with no warning. Goal 165 by 2027-01-05 shows the "faster than 1% a week" warning. Clear goal removes `profile.cut`.
- [ ] Switching Settings → Units to kg shows the 180 lb entry as 81.6 kg. The stored entry still reads `{w:180, u:'lb'}`.
- [ ] Remove needs two taps. After the second tap the entry is gone from storage.
- [ ] Home shows the "Log today's weight" button when today isn't logged. Tapping it opens Progress. After logging, Home shows today's weight and trend.
- [ ] Settings → Copy all data includes `bw`. Restoring a backup that has no `bw` keeps the existing `bw`. Restoring a backup that has `bw` brings it back.
- [ ] The disclaimer footnote is present on Progress. No text mentions calories, macros or diets.
- [ ] Layout check at 390 px: inputs and buttons at least 44 px high, no horizontal scroll (`document.documentElement.scrollWidth <= 390`).

Fix 1:
- [ ] Default gear (lb): bench/squat suggestions and warm-ups are exactly the same as on `main`. The existing tests pass unchanged, apart from updating printed expectations in `warmups_plates_report.test.cjs` if they move.
- [ ] Plates set to `45, 25, 10, 5` (smallest 5 → step 10): every barbell suggestion and warm-up on Legs A is `45 + 10k`, and its "Load:" line has no "short" note. Leg press and other non-barbell suggestions are still multiples of 5.
- [ ] kg with default gear: suggestions are still multiples of 2.5.
- [ ] Barbell 2-workout plateau hint names the real jump (5 lb with default gear). The text for non-barbell lifts is unchanged.

### Must not break
- Start/End workout, workout clock, rest timer (only after a set), RPE suggestions, plateau fixer, readiness check, pain log and its disclaimer, ghost race, warm-ups and plate math, weekly report, week navigation and checkmarks, swaps with photos, backup and restore, hosted `db` sync.
- Existing `liftlog.v1` data: add `bw` and `cut` only. Rename or remove nothing, and do not touch `sessions`.
- All existing `tests/*.test.cjs` pass. Run `python3 scripts/sync.py` so `docs/` and `app/src/main/assets/` match `src/index.html`.

## Now (next 2–4 weeks)

- **Cut guard** (after the tracker merges; must ship before 2027-02-15, when Nheil's cut starts): weekly card that compares weight-trend %/wk with main-lift (`MAIN`) e1RM trend. Warns when loss is above 1%/wk *and* main-lift e1RM has fallen 2+ weeks in a row. Thresholds are guesses to tune on Nheil's cut.
- **RPE coach for beginners**: first-time explainer (RPE 7 ≈ 3 reps left) and a "how many more reps?" picker that maps to RPE. Protects the input our core suggestion feature depends on.
- **Set cap on a grinder**: after an RPE 10 set or missed target reps, offer to drop the remaining sets or cut their load.
- **PR share cards**: one tap turns a new personal record into a branded image to post. Growth loop for Nheil's gym content. Needs a native share/save bridge in the Android and iPhone wrappers.

## Queued by Nheil (2026-11-26), do these first

1. **Bug: Home "Week X of 15" bar, Peak weeks are giant yellow columns** (screenshot from Nheil's Android, 2026-11-26). **Fix in PR: https://github.com/nheilmangoba1/Lift-log/pull/6** (awaiting Nheil's merge).
   - **Cause:** CSS class clash. The 3D body viewer (PR #5) styles `.b3` (height `min(560px,70vh)`, `min-height:420px`, border, background). The plan bar marks Peak-block weeks with `<i class="b3">`, so they inherit that height.
   - **Fix:** rename the viewer's classes (e.g. `.b3` → `.body3d`, along with every `.b3*` selector and the JS that sets `className='b3'`), or scope the bar rules (`.bar15 i.b3`). The renaming option is safer.
   - **Acceptance:** on Home, all 15 week squares are 10 px tall with Peak weeks in yellow, in dark and light mode at 390 px. The Body tab 3D viewer looks unchanged. Add a test that checks `.bar15 i` heights are equal.
2. **Program tab: more interactive and better looking** (Nheil, 2026-11-26). Designer + Coder. The current tab is mostly a static editor and list.
   - **Ideas to choose from:**
     - a visual 15-week timeline (Hypertrophy → Strength → Peak) you can tap to preview any week's sets, reps and RPE
     - day cards in plate colours (Push red, Pull blue, Legs yellow) with exercise photos
     - drag to reorder exercises
     - tap an exercise to swap it using the photo dropdown
     - a progress ring for how far through the block you are
     - "this week vs next week" changes highlighted
     - smooth transitions between views
   - **Must keep:** the program editor features, presets, swaps, periodization and saved data (`profile.program`, `swaps`) working.
   - **Acceptance:**
     - Designer screenshots at 390 px, dark and light, before and after.
     - Tap targets at least 44 px.
     - A test that opens the tab, previews a future week and edits an exercise.

3. **History tab: calendar, more interactive, better looking** (Nheil, 2026-11-26). Designer + Coder.
   - **Month calendar at the top**, in the style of the new date picker:
     - days with a workout get a dot or fill in that day's colour (Push red, Pull blue, Legs yellow)
     - today is ringed
     - swipe or use arrows to change month
     - tap a day to jump to or expand that day's workout below
   - **Workout cards** instead of a plain list:
     - day name and colour, date, duration, sets, volume, PRs hit
     - tap to expand the sets (weight × reps, RPE), with smooth open/close animation
   - **Small month summary:** workouts, total volume, PRs, longest streak.
   - **Nice extras if they fit:**
     - filter by Push/Pull/Legs
     - search by exercise
     - a streak/heat strip
   - **Must keep:** existing history actions (edit or delete a session, if present) and all saved `sessions` data, untouched. Reuse the calendar code from the custom date picker where possible.
   - **Acceptance:**
     - Designer screenshots at 390 px, dark and light, before and after.
     - Tap targets at least 44 px.
     - A test that opens History, checks logged days are marked on the calendar, taps a day and expands its workout, and changes month.

4. **Rest timer alert: more noticeable ring and vibration** (Nheil, 2026-11-26). Coder (+ Designer for the visual).
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

## Pro features (queued by Nheil, 2026-11-26)

Nheil picked these as the premium features to build toward the Pro tier. Build them in this order. They can ship free at first and be put behind Pro later, once accounts and store billing exist (see Blocked). Idea #3 ("Gym's packed" mode) was left out on purpose.

1. **PR forecast** (easy): "At your current rate you'll bench 225 on Mar 14." Projects each main lift's e1RM trend to a target the user sets, updates after every workout, shows a countdown. Must say it's an estimate. Share-card ready later.
2. **"Only got X minutes"** (easy to medium): pick 20/30/45/60 min and today's workout shrinks to fit, keeping the main lifts' work sets and dropping accessories and extra sets first. Uses rest times to estimate length. Saved sessions keep their normal format.
3. **Cut coach** (medium): grows the **Cut guard** item above. Links the bodyweight trend to main-lift e1RM, warns when strength drops during a cut and offers to trim training volume to protect strength. Training guidance only: no calorie, macro or diet advice. Must be live before 2027-02-15.
4. **Ghost race a friend** (medium, needs accounts): race a friend's numbers set by set, like the current ghost race against your own past. Needs accounts and sharing (Blocked until Supabase is set up).
5. **Velocity Coach** (hard, headline feature after launch): film a set, track the bar path and rep speed on the device, estimate reps left from slow-down, and draw the bar path on the video for sharing. Must run on the phone with no uploads. Replaces "Video form check" under Later. Start with a research spike on camera access in the Android/iPhone web views.

## Next

- Exercise library: browse exercises with photos, muscles and how-to steps (Free Exercise DB). Bundling the instruction text into the one-file app needs a size check first.
- Year recap card ("Lift Log Wrapped"): reuse the PR share card renderer. Aim for late December if share cards land first.
- Equipment-aware suggestions, part 2: dumbbell steps, Smith/EZ bar weights per exercise (part 1, barbell rounding, ships this week).
- Boxing mode: round timer for bag work that logs rounds
- Competition or event dates: plan peaking and tapering backward from a date
- Total training load: lifting + sport/cardio sessions and a this-week-vs-4-week-average warning
- Supersets and circuits
- Notes per exercise and per workout
- Export to CSV

## Later

- Hands-free voice logging (web version first)
- Wearable data (heart rate variability, sleep) feeding the readiness score
- Coach view for trainers with several athletes
- (Video form check moved to Pro features: Velocity Coach)

## Blocked (needs Nheil)

- **Accounts and cloud sync**: needs a free Supabase project. Steps: sign up at supabase.com, create a project, then share the Project URL and the public `anon` key (Project Settings → API). Never share the `service_role` key.
- **Google Play release**: needs a Google Play developer account (one-time fee, paid by Nheil), a private release signing key, a privacy policy page and a 12-tester, 14-day closed test.
- **App Store release**: needs an Apple Developer Program membership (yearly fee, paid by Nheil).
- **Pro subscriptions**: only after accounts and store accounts exist.

## Done

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
