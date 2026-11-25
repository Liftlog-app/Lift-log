# Decisions

Newest first. Each entry: date, decision, why.

- **2026-11-24 · Agent team runs weekly; Coder opens pull requests, Nheil merges.** Keeps a human check on every app change and keeps usage moderate.
- **2026-11-24 · Exercise photos come only from Free Exercise DB (public domain).** Avoids copyright problems; drawn figures are the fallback.
- **2026-11-23 · Release on Android (Google Play) first, iPhone later.** Lower cost to start and faster reviews; iPhone users use the home-screen web version or sideloaded app meanwhile.
- **2026-11-23 · Accounts and cloud sync will use Supabase.** Free tier, Postgres tables with row-level security, works offline-first; blocked until Nheil creates a project.
- **2026-11-23 · Focus on app features before accounts and store release.** Nheil's call.
- **2026-11-23 · One fixed signing key for all Android builds.** Lets updates install over old versions and keep data. Before the Play Store, switch to a private release key.
