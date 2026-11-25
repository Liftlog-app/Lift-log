# Growth experiments

Marketer proposals. Newest at the top. Nheil decides whether to run them. Agents never message people, post or spend money.

---

## Experiment 1: "Hold Your Strength" 4-week challenge with gym friends (proposed 2026-11-24)

### Idea

Nheil invites 5–8 lifting friends to use Lift Log for 4 weeks. The scoreboard is **consistency and ghost-race wins, not pounds lost.** Friends who are cutting can also log bodyweight and try to stay in the green or yellow rate band. Nobody wins anything for losing the most weight. Nheil films the challenge as a weekly series.

**Why this design:** a "who loses the most" contest rewards crash dieting, which breaks CLAUDE.md rule 7 and our brand voice. Scoring ghost wins and sessions shows off what makes Lift Log different (it coaches and races, not just records). The research behind the bodyweight tracker says strength can hold up in a moderate deficit, which makes "hold your strength" a fair goal to aim for ([cut-coaching deep dive](../research/2026-11-24-cut-coaching.md)).

### Goal

Learn whether real lifters other than Nheil keep using Lift Log for 4 weeks, and collect their honest feedback and bugs before any store launch. Second goal: get a 4-part video series that stays honest.

### Cost

$0. Friends use the web version (iPhone and Android) or the Android APK from the repo's Releases page. No ads, no prizes needed. If Nheil wants a prize, keep it small and non-weight-based (for example, loser buys the winner a protein shake). That's his call and his money.

### Rules for participants (draft for Nheil to share in person or in his own group chat)

1. Use Lift Log for every lifting session for 4 weeks.
2. Points: 1 per logged workout (max 4 a week), 1 per ghost-race set won.
3. Bodyweight is optional and private. Share your Rate colour only if you want. No prize is tied to weight.
4. If you're cutting, the app's guide is 0.5–1% of bodyweight a week. Red means slow down. Training guidance, not diet advice.
5. Pain or injury: stop, and use the pain log swaps or see a professional. Nobody trains through pain for points.
6. Nobody gets filmed or named in a post without saying yes first.

### Steps

| When | What | Who |
|---|---|---|
| Week 0 (before start) | Merge PR #1 so the bodyweight tracker is in the build. Test the install on one Android and one iPhone (web version, add to home screen). Pick a start Monday that avoids finals week and holiday travel. Recruit in person at the gym. | Nheil |
| Week 0 | Write one shared note for participants: install link, the rules above, and how to send feedback (one message to Nheil). | Marketer can draft on request |
| Week 1 | Everyone logs. Friday: each person sends Nheil a screenshot of their Home screen or weekly coach report. Nheil films video 1: "4 lifters, 4 weeks, one app. Rules: beat your ghost." | Participants, Nheil |
| Week 2 | Same check-in. Nheil logs every bug or confusion in `ops/feedback.md` (format: date · tester · what happened). Video 2: best ghost-race moment (with that person's OK). | Nheil |
| Week 3 | Same check-in. One-question pulse: "What's the one thing you'd change?" Video 3: a readiness or plateau moment from someone's real session. | Nheil |
| Week 4 | Final scores. 3-question exit survey (below). Video 4: final leaderboard, honest. Include who dropped out and why, if they're OK with it. | Nheil |
| After | Marketer and Product Lead read results in `ops/feedback.md` and decide what goes in the backlog. | Agents |

### What to measure (all counted by hand. The app has no analytics and must not get any, per CLAUDE.md rule 3.)

| Metric | How | Target to call it a win (a goal we set, not a prediction) |
|---|---|---|
| Activation | Friends who logged at least 1 workout in week 1 ÷ friends invited At least 3 in 4 invited |
| 4-week retention | Friends who logged at least 2 workouts in week 4 (from their screenshot) ÷ friends who activated | Half or more |
| Feature use | From screenshots and exit survey: who used RPE ratings, readiness, ghost race, bodyweight | Note which features got ignored |
| Bugs and confusions | Lines added to `ops/feedback.md` | Every one logged. Any number is useful |
| Would they keep using it? | Exit survey Q1 (yes / maybe / no) | Count of "yes" |
| Content result | Each platform's analytics for videos 1–4: views, saves, shares, profile visits. Compare with Nheil's average non-app gym video | Profile visits above his usual average |

**Exit survey (3 questions):**
1. Will you keep using Lift Log after this? (yes / maybe / no, and why)
2. Which feature did you actually use most?
3. What almost made you stop?

### What we learn either way

- **High retention:** the core loop works for other lifters. Next: a Reddit or Discord launch post using the same honest framing.
- **Low retention:** the exit answers tell the Product Lead what to fix before a store launch. For example, if RPE confuses people, move the RPE coach for beginners (already in roadmap "Now") up.
- **Videos beat his average:** the series format becomes the plan for Nheil's own cut in February, which can reuse it as "Cut guard, week 1…15".

### Risks and guardrails

- Weight talk in a friend group can get unhealthy. Keep weight optional and private, never rank it, and stop the weight part if anyone starts crash dieting.
- Sideloading an APK is a trust ask. Lead with the web version.
- 5–8 people is a small sample. Treat results as signals, not proof, and don't quote them as statistics in marketing.
- No testimonials from participants go in store listings. Social posts can quote a friend only with their clear OK and their real words.
