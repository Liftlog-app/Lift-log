# Store listing (draft)

The Marketer keeps this current. Last updated 2026-11-24 (cycle 2026-W48).

**Status:** not submitted anywhere. Google Play needs a developer account, a release key, a privacy policy and a 12-tester closed test. The App Store needs an Apple Developer membership. Both are blocked on Nheil (`ops/roadmap.md`). This copy describes only features that are in the app today. The bodyweight tracker line is marked and should go in only after PR #1 merges and ships.

## Field limits (checked 2026-11-24)

| Store | Field | Limit | Source |
|---|---|---|---|
| Google Play | App name | 30 characters | [Play Console help: store listing best practices](https://support.google.com/googleplay/android-developer/answer/13393723?hl=en) |
| Google Play | Short description | 80 characters | same |
| Google Play | Full description | 4,000 characters | same |
| Google Play | Release notes ("What's new") | 500 characters per language | [secondary source citing Play Console help](https://deku.posstree.com/en/share/google-play/release-notes-character-limit/) (not confirmed on Google's own page) |
| Google Play | Phone screenshots | 2–8, PNG/JPEG, sides 320–3,840 px, long side at most 2.3× the short side. For recommendation eligibility: at least 4 at 1080 px or more (9:16 portrait at least 1080×1920) | [Play Console help: preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en) |
| Google Play | Feature graphic / icon | 1024×500 JPEG or 24-bit PNG / 512×512 32-bit PNG, at most 1,024 KB | same |
| App Store | Name | 2–30 characters | [App Store Connect help: app information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information) |
| App Store | Subtitle | 30 characters | same |
| App Store | Promotional text | 170 characters | [App Store Connect help: platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information) |
| App Store | Description | 4,000 characters, plain text, no HTML | same |
| App Store | Keywords | 100 bytes, comma-separated, each keyword more than 2 characters | same; [Apple product page guide](https://developer.apple.com/app-store/product-page) |
| App Store | What's New | 4,000 characters (not available for the first version) | [platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information) |
| App Store | Screenshots | 1–10 per device size. At least one for "iPhone with Dynamic Island (medium display)" is required. Large display accepts 1320×2868 portrait, among others | [App Store Connect help: screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) |

### Copy rules that apply to us

- **Google Play:** the title must not use "Free", "#1", "Best" or all caps. The short description must not have "free", ranking claims or misleading claims. The full description must not have unattributed testimonials, keyword stuffing, comparisons to other apps, or ranking/pricing/promo text ([Play help](https://support.google.com/googleplay/android-developer/answer/13393723?hl=en)). Screenshot text should take no more than 20% of the image, with no "Best/#1/Top/New" and no "Download now" calls to action ([Play help](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)).
- **App Store:** keywords must not include competitor app names, plurals of words already used, the word "app", category names or words already in the name. Avoid prices in the description and generic claims like "world's best app". If the app supports dark mode, show at least one dark screenshot. The first 1–3 screenshots appear in search results ([Apple product page guide](https://developer.apple.com/app-store/product-page)).
- **Our own rules:** no fake numbers or reviews, no medical or diet claims, no mention of competitors in store copy. The "coaching apps cost $72–$350/yr while loggers only log" point is for social posts and Reddit only, with sources from `ops/research/competitors.md`.

---

## Google Play

- **App name (23/30):** `Lift Log: Workout Coach`
  - Alternative (27/30): `Lift Log: Gym Workout Coach` adds "gym", a word Strong and Hevy both use in their titles (see Keywords).
- **Short description (78/80):**
  `Workout tracker that picks your next set's weight from RPE and fixes plateaus.`
  - Alternative (75/80): `Coaches every set: next-set weight from your RPE, readiness, plateau fixes.`
- **Full description** (about 2,100 characters by estimate, well under 4,000. Check the console counter):

```
Lift Log is a lifting app that coaches every set, not just records it.

Log a set, rate how hard it felt, and Lift Log suggests the weight for your next one. Feeling beat up? Rate your sleep, soreness and energy and the day's weights adjust. Stuck on a lift? It spots the plateau and tells you what to change.

COACHING ON EVERY SET
• Next-set weight from your effort (RPE): harder than planned, it eases off; easier, it moves you up
• Readiness check: sleep, soreness and energy adjust today's weights
• Plateau fixer: notices when a lift stalls and suggests a fix
• Rest times that follow how hard the set was

RACE YOUR PAST SELF
• Ghost race: every set is compared with last week, green when you beat it
• Recent records on your Home screen

A REAL PLAN, OR YOUR OWN
• 15-week Push Pull Legs plan in Hypertrophy, Strength and Peak blocks
• Program presets and a program editor for your own split
• Week navigation with check marks for what you finished

LESS MATH BETWEEN SETS
• Warm-up sets to your top weight with plates per side
• Rest timer that starts after you log a set
• Start and End buttons for an accurate workout time
• Weekly coach report

TRAIN AROUND PAIN
• Pain log with a body map
• Exercises that load a sore area are swapped for joint-friendly options, with real exercise photos

YOUR DATA STAYS YOURS
• Works offline, data saved on your phone
• Backup and restore whenever you want
• No ads, no tracking

Built by Nheil, a college lifter and engineering student, for his own training.

Lift Log gives training guidance, not medical advice. If something hurts, see a qualified professional.
```

**After PR #1 ships**, add this section above "LESS MATH BETWEEN SETS":

```
TRACK YOUR CUT
• Log your morning weight and see the trend through daily noise
• Weekly rate in lb and % of bodyweight, colour-coded against research guidelines for keeping strength
• Set a goal weight and date and see the weekly pace it needs
```

**Check before publishing:** "No ads, no tracking" is true today (CLAUDE.md rule 3). Remove it if that ever changes. Also make sure the Play "Data safety" form matches it.

---

## App Store

- **Name (23/30):** `Lift Log: Workout Coach`
- **Subtitle (30/30):** `Gym Log That Picks Your Weight`
  - Alternative (29/30): `RPE Lifting Log & Gym Tracker`
- **Promotional text (153/170, can be changed without a new build):**
  `Rate your set, get your next weight. Lift Log coaches every set with RPE suggestions, readiness checks, plateau fixes and a ghost race against last week.`
- **Keywords (99/100 bytes, all ASCII, no spaces after commas, no words already in name/subtitle, no competitor names):**
  `rpe,rir,progressive overload,strength,tracker,powerlifting,ppl,plateau,deload,1rm,hypertrophy,bench`
  - If you use the alternative subtitle, swap `tracker` for `weight`. ("tracker" would then be in the subtitle and "weight" no longer would.)
- **Description:** same text as Google Play. Apple's description doesn't affect search, so no keyword stuffing is needed.

---

## Keyword ideas and reasoning

**What I could and couldn't verify:** I found no free, reliable search-volume data for these terms, so there are no volume numbers here. The reasoning comes from competitor titles (what the market already fights over) and from what makes Lift Log different. Once a store account exists, check real popularity in Apple Search Ads keyword tools and Play Console's acquisition reports, then update this list.

**Competitor titles, checked 2026-11-24:**
- Strong: "Strong Workout Tracker Gym Log" / "Strength Training Planner" ([App Store](https://apps.apple.com/app/strong/id464254577))
- Hevy: "Hevy - Gym Tracker Workout Log" / "Weight Lifting Rep Planner" ([App Store](https://apps.apple.com/za/app/id1458862350))
- MacroFactor Workouts: "MacroFactor Workouts: Tracker" / "Gym Planner, Fitness Coach" ([App Store](https://apps.apple.com/us/app/6737156524))

| Keyword | Where | Why |
|---|---|---|
| workout, gym, tracker, log | Name, subtitle, short description | These are the category head terms. All three big competitors use them, so they are crowded and we won't rank high early. We still need them so the store understands what the app is. |
| coach | Name | Our positioning. Few loggers can honestly claim it, and MacroFactor Workouts' subtitle shows the store accepts it as a lifting term. |
| rpe, rir | Keywords field, description | Our core feature. Lifters who search for these already understand autoregulation. Likely low volume but high intent (assumption, not measured). |
| progressive overload | Keywords | Describes what ghost race and the suggestions do. A common phrase in lifting content. |
| plateau, deload | Keywords | Direct features (plateau fixer, deload weights). Probably less contested than "workout". |
| ppl | Keywords | Our built-in 15-week plan is Push Pull Legs. A short form lifters search for. |
| powerlifting, hypertrophy, strength | Keywords | Our plan's blocks are Hypertrophy, Strength and Peak. |
| 1rm, bench | Keywords | Lifters search for their lifts. The app tracks records and estimates. |
| cut, bodyweight | Add after PR #1 ships | Only when the feature exists. Don't add it early. |
| plate calculator, warm up | Candidates if room frees up | Real features, but used up the byte budget this round. |

Rejected: competitor names (not allowed by Apple), "free" (not allowed by Google in name/short description, and there's no pricing decision yet), "app" and plurals (wasted bytes per Apple), "weight loss" and "diet" (clash with our no-diet-advice rule and would attract the wrong users).

---

## Screenshot plan

Format: 9:16 portrait at 1080×1920 for Play (at least 4 for recommendation eligibility), 1320×2868 for the App Store's large iPhone size, plus the required medium Dynamic Island size. Short caption at the top in Barlow Condensed, taking under 20% of the image. App screen below on a dark charcoal background with a plate-colour accent per screen. No device frames (Play advises against device imagery), no "New", "Best" or "#1", no "Download now". Use real app screens with realistic demo data. Numbers in the demo data must be plausible, not record-breaking.

The first three tell the whole pitch, since they show in search results.

| # | Screen | Caption | Accent | Theme |
|---|---|---|---|---|
| 1 | Workout card after logging a set: RPE entered, next-set suggestion box highlighted | **Rate the set. Get your next weight.** | Push red | Dark |
| 2 | Ghost race: three sets with green/red ghost lines and the race score | **Race last week's you, set by set.** | Pull blue | Dark |
| 3 | Readiness check (sleep, soreness, energy) with the adjusted weights | **Rough night? Today's weights adjust.** | Legs yellow | Light (so the set shows both themes) |
| 4 | Plateau hint on an exercise card | **Stuck? It tells you the fix.** | Push red | Dark |
| 5 | Warm-up list with plates per side | **Warm-ups and plates, worked out.** | Legs yellow | Dark |
| 6 | Home: today's workout, week strip, streak, recent records | **Your week and your records, at a glance.** | Pull blue | Dark |
| 7 | Body map with a sore area and the swapped exercise with photo | **Log pain. Get joint-friendly swaps.** | Push red | Dark |
| 8 | Weekly coach report | **Your week, reviewed.** | Green | Light |
| 9 (after PR #1 ships, App Store only or replaces #8 on Play) | Progress: Bodyweight section with trend line and green Rate tile | **See the trend, not the daily noise.** | Green | Dark |

Alt text for Play (140 characters max, don't start with "photo of" or "image of"), e.g. #1: "Workout screen suggesting the next set's weight after the lifter rates the last set at RPE 9."
