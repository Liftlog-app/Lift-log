# Lift Log: project guide for agents

Lift Log is a strength-training tracker for Android, iPhone and the web. The goal is to become the best lifting app in the stores: the one that coaches every set, not just records it. The owner is Nheil, a college student and lifter who will also grow it through his gym social media.

## How the app is built

- **One file is the whole app:** `src/index.html` (HTML + CSS + JavaScript, no framework, no build step). Edit only this file for app changes.
- **Generated copies (never edit by hand):** run `python3 scripts/sync.py` after every change to `src/index.html`. It writes:
  - `app/src/main/assets/index.html`: Android app (WebView wrapper in `app/`, built by `.github/workflows/build.yml`)
  - `docs/index.html`: iPhone app (WKWebView wrapper in `ios/`, built by `.github/workflows/ios.yml`) and the home-screen web version (GitHub Pages from `docs/`)
- **Exercise photos:** `docs/img/ex/<id>-0.jpg` (start) and `-1.jpg` (end), from Free Exercise DB (public domain). The `PHOTOS` map in `src/index.html` links exercise names to ids. Never add copyrighted images; when a photo is missing the app falls back to a drawn figure.
- **Data:** saved on the device in `localStorage` key `liftlog.v1` as `{profile, sessions}`. Inside Claude's hosted version it syncs through the artifact `db`. Existing users' data must keep working after every change: add fields, never rename or remove them without a migration.
- **Releases:** every push to `main` that touches app files builds a new Android APK (`build-N`) and iPhone .ipa (`ios-N`) on the repo's Releases page. All builds share one signing key so updates install over the old app and keep user data.

## Commands

```bash
npm install            # once (jsdom for tests)
python3 scripts/sync.py
npm test               # runs tests/*.test.cjs against src/index.html
```

Each test file loads the app in jsdom with a fixed date and fake data, clicks through a feature and prints results. A test fails if it crashes or the page logs errors. When you add a feature, add `tests/<feature>.test.cjs` that exercises it and checks the important outcome (throw an Error if it is wrong).

## GitHub from Claude sessions

`gh pr …` and other GraphQL-based commands are blocked here. Use the REST API through `gh api`:

```bash
gh api "repos/Liftlog-app/Lift-log/pulls?state=all&per_page=10" --jq '.[]|"#\(.number) \(.state) merged=\(.merged_at!=null) \(.head.ref) \(.title)"'
gh api repos/Liftlog-app/Lift-log/pulls -f title='...' -f head='agent/<slug>' -f base=main -f body="$(cat /tmp/pr.md)"
gh api repos/Liftlog-app/Lift-log/pulls/<n>                 # one PR
gh api repos/Liftlog-app/Lift-log/issues/<n>/comments -f body="$(cat /tmp/comment.md)"   # comment on a PR
gh api "repos/Liftlog-app/Lift-log/actions/runs?branch=agent/<slug>&per_page=3"           # CI status
```

## Rules for every agent

1. **App code changes go through pull requests.** Work on a branch named `agent/<short-feature-name>`, open a PR, and stop. Never push app code to `main`, never merge a PR. Nheil reviews and merges.
2. Notes in `ops/`, `.claude/` and `CLAUDE.md` may be committed straight to `main` (they don't trigger app builds).
3. Keep the app one self-contained file. No frameworks, no new network calls to third-party servers, no tracking.
4. Mobile first: design for a 390 px wide phone in both dark and light mode. Tap targets at least 44 px. Follow the existing look: Barlow / Barlow Condensed type, plate colours (Push red `#d8342c`, Pull blue `#2a63d4`, Legs yellow `#e0a800`), cards with 14 px corners.
5. Never break existing data, tests, or the start/end workout, rest timer, RPE suggestion, plateau, readiness, pain-log and ghost features.
6. Be honest in reports: say what you could not do or verify.
7. Health and safety: the app gives training guidance, not medical advice. Keep the pain-log disclaimer. Never promote extreme dieting or unsafe training.

## Where the team keeps its notes

- `ops/README.md`: how the agent team works
- `ops/WEEKLY_CYCLE.md`: the step-by-step weekly run
- `ops/roadmap.md`: what is being built now, next and later (Product Lead owns it)
- `ops/ideas.md`: scored idea backlog (Researcher adds, Product Lead scores)
- `ops/feedback.md`: feedback from Nheil and testers (read it every cycle)
- `ops/research/`: competitor and market notes with sources
- `ops/marketing/`: brand voice, store listing, content calendar, post drafts
- `ops/weekly/`: one report per weekly cycle
- `ops/decisions.md`: decisions and why
