# Decisions

Newest first. Each entry: date, decision, why.

- **2026-11-24 · Marketer paused in all runs until Nheil resumes it.** Nheil's call.
- **2026-11-24 · Week 48 build: bodyweight and cut tracker (`agent/bodyweight-tracker`), plus barbell weights rounded to the user's real plates.** Why: (1) Nheil's feedback inbox has no open bugs, so the top-scored item wins. (2) Logging weight from now gives about 12 weeks of baseline before his cut starts around 2027-02-15. (3) It is the base for Cut guard, the one coaching gap no major competitor fills (`research/2026-11-24-cut-coaching.md`). The rounding fix is small and uses the existing gear setting. Default gear gives identical numbers, so existing users see no change unless they set different plates. There were no agent PRs to review (first cycle; REST API returned an empty list).
- **2026-11-24 · Bodyweight data lives in `profile.bw` and `profile.cut`, not in `sessions`.** Each entry keeps the unit it was logged in. Why: no migration is needed. Backup/restore and the hosted `db` sync already carry the whole profile. Session-based features (reports, ghost, plateau) are untouched. A typical user adds fewer than 400 entries a year, so the profile stays small. Revisit if weigh-ins move to a cloud table once Supabase exists.
- **2026-11-24 · Rate-of-loss guidance uses %/wk bands (green 0.25–0.75, yellow 0.75–1, red above 1) and never gives calorie or diet advice.** Why: these are the research consensus for keeping strength (Helms 2014, Garthe 2011), and CLAUDE.md rule 7 applies. The thresholds for the later Cut guard warning are guesses to tune on Nheil's own cut.
- **2026-11-24 · Exercise library moves from Now to Next.** Why: it is standard in every competitor, so it is not a differentiator. Bundling how-to text into the one-file app needs a size check first. Coaching features (Cut guard, RPE coach, set cap) come first.

- **2026-11-24 · Agent team runs weekly; Coder opens pull requests, Nheil merges.** Keeps a human check on every app change and keeps usage moderate.
- **2026-11-24 · Exercise photos come only from Free Exercise DB (public domain).** Avoids copyright problems; drawn figures are the fallback.
- **2026-11-23 · Release on Android (Google Play) first, iPhone later.** Lower cost to start and faster reviews; iPhone users use the home-screen web version or sideloaded app meanwhile.
- **2026-11-23 · Accounts and cloud sync will use Supabase.** Free tier, Postgres tables with row-level security, works offline-first; blocked until Nheil creates a project.
- **2026-11-23 · Focus on app features before accounts and store release.** Nheil's call.
- **2026-11-23 · One fixed signing key for all Android builds.** Lets updates install over old versions and keep data. Before the Play Store, switch to a private release key.
