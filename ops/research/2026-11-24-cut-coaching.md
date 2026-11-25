# Deep dive: how should Lift Log coach a cut?

Date: 2026-11-24 · Researcher · Feeds the roadmap "Now" item **Bodyweight and cut tracker**

## Question

The roadmap plans a bodyweight and cut tracker (morning weight, weekly average, rate of loss against a goal date). What do the research and competitors say about the right rate of loss and how to read scale weight? Can the tracker *coach* (link weight trend to lifting performance), not just chart a line?

## Why this topic (opinion)

Of the three "Now" items, this one has the clearest coaching gap. PR share cards are a growth loop, and competitors already share workouts and PRs (Boostcamp has PR alerts and a yearly "Wrapped"). An exercise library is standard everywhere: Fitbod, JEFIT and Strong all have 1,000+ exercises with videos. A cut tracker that connects bodyweight to strength is something none of the six main apps does automatically (see `competitors.md`). It is also timely: Nheil starts a cut mid-February, so he can test it in real use and post about it.

## What we found

### 1. Rate of loss: 0.5–1% of bodyweight per week, slower is safer for strength

| Source | Finding |
|---|---|
| [Helms, Aragon & Fitschen 2014, JISSN review](https://pmc.ncbi.nlm.nih.gov/articles/PMC4033492) | For natural bodybuilding prep, recommends losing about 0.5–1% of bodyweight a week to keep as much muscle as possible. Leaner lifters may need a slower pace near the end. Warns that very-low-carb diets were linked to worse performance. |
| [Garthe et al. 2011 (PubMed)](https://www.pubmed.gov/21558571/) | 24 athletes did 4 lifting sessions a week. The slower group (~0.7%/wk) *gained* about 2% lean mass. The faster group (~1.0%/wk) did not. Both lost about 5.5% of bodyweight. The authors recommend ~0.7%/wk for athletes who want to keep gaining strength while cutting. |
| [Trexler, Stronger By Science, 2022](https://www.strongerbyscience.com/muscle-caloric-deficit/) | Suggests up to ~0.5%/wk to protect strength and muscle, up to ~1%/wk if in a hurry, and roughly 1 kg/wk as an upper cap. |

**Takeaway (fact):** 0.5–1%/wk is the consensus range. ~0.5–0.7%/wk is the better target for a lifter who cares about strength.

### 2. Strength holds up better than muscle in a deficit

- A meta-analysis found that energy deficits slowed lean-mass gains from lifting, but strength gains were not significantly different from non-deficit groups. A deficit of about 500 kcal/day was predicted to stop lean-mass gains. [Murphy & Koehler 2022 (PubMed)](https://www.pubmed.gov/34623696/)
- Trexler notes the ~500 kcal figure is not a hard cutoff. Studies showing real muscle gain mostly used deficits of about 200–300 kcal/day or less. [Stronger By Science](https://www.strongerbyscience.com/muscle-caloric-deficit/)

**Takeaway (fact plus inference):** a moderate cut should not cause big strength drops. If e1RM on main lifts falls steadily while weight drops fast, that is a useful warning that the cut may be too aggressive. The research supports the direction. The exact threshold for "too much drop" is our guess and needs tuning.

### 3. Read the trend, not the daily number

- MacroFactor says single weigh-ins are noisy (water, food, digestion). It recommends a smoothed trend, with weigh-ins daily or at least 3 times a week. [MacroFactor help](https://help.macrofactorapp.com/en/articles/278-weight-trend-workouts)
- MacroFactor also tells users to compare the weight trend with workout data. A falling trend plus dropping volume and more fatigue may mean the deficit is too big for the program. This is written advice; the user still has to make the connection themselves. [MacroFactor help](https://help.macrofactorapp.com/en/articles/278-weight-trend-workouts)
- Hevy logs bodyweight with a graph but has no built-in trend. It tells users to track their weekly average themselves. [Hevy](https://www.hevyapp.com/features/track-body-measurements/)

### 4. Competitor gap

| App | Bodyweight log | Smoothed trend | Goal rate / date | Links weight to lifting automatically |
|---|---|---|---|---|
| Hevy | Yes | No | No | No |
| Strong | Yes (measurements, Apple Health) | Not found | Not found | No |
| JuggernautAI | Yes | Not found | Not found | Not described |
| MacroFactor (nutrition + Workouts) | Yes | Yes | Yes (nutrition app) | Advice only, across two separate paid apps |
| Lift Log (planned) | Planned | Planned (weekly average) | Planned | **Opportunity** |

Sources: [Hevy](https://www.hevyapp.com/features/track-body-measurements/), [Strong App Store](https://apps.apple.com/app/strong/id464254577), [JuggernautAI App Store](https://apps.apple.com/ca/app/juggernautai/id1515756471), [MacroFactor help](https://help.macrofactorapp.com/en/articles/278-weight-trend-workouts). "Not found" means the sources we read did not mention it.

## What it means for Lift Log (recommendations, opinion)

1. **Show a smoothed trend, not just a 7-day average.** A simple exponential moving average (e.g. about 10% weight on today, 90% on yesterday's trend) handles missed days better than a fixed 7-day window. Show the raw dots faintly behind it. The method and smoothing factor are suggestions to test.
2. **Express the rate in % of bodyweight per week** next to lb/week. Colour it: green for 0.25–0.75%, yellow for 0.75–1%, red above 1%. Base these bands on the sources above and say so in the UI ("guideline for keeping strength"). Never give calorie or diet prescriptions. That stays within CLAUDE.md rule 7.
3. **"Cut guard" (the coaching hook):** each week, compare the weight-trend rate with the e1RM trend on the main lifts the app already tracks. If weight is dropping faster than 1%/wk *and* main-lift e1RM falls for 2+ weeks, show a short card. For example: "You're losing 1.2%/wk and bench e1RM is down 4%. Consider slowing the cut." Pair it with the existing readiness check: low energy or poor sleep during a cut lowers that day's suggested load, as readiness already does. The thresholds are guesses; we need Nheil's February cut to tune them.
4. **Goal date in reverse:** user enters a target weight and date. The app shows the required %/wk and warns if it is above 1%/wk. Nheil's own goal is already in `ideas.md`.
5. **Content angle:** "Cutting without losing your bench" fits the brand voice (specific numbers, no extreme dieting). Nheil can post his weekly cut-guard card from February.
6. **Data safety:** store weigh-ins as a new field (for example `profile.weights` or a new top-level array) and don't touch existing `sessions`. Developer call; noted for the Product Lead.

## Limits of this research

- Garthe 2011: we read only the abstract, so the strength and power results are inferred from the authors' conclusion.
- The studies are on athletes and bodybuilders, mostly young adults. Results may differ for beginners or people with more body fat. Trexler notes beginners have more room for "recomp."
- We did not check whether Strong or JuggernautAI have trend lines inside the app. We only read their store pages.
