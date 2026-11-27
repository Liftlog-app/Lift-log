# The Lift Log agent team

**Live dashboard:** https://liftlog-app.github.io/Lift-log/agents.html (needs GitHub Pages on: Settings → Pages → main /docs)

Six AI agents work on Lift Log once a week. They share notes in this folder and propose app changes as pull requests that Nheil approves.

| Agent | Job | Writes to |
|---|---|---|
| **Researcher** (`.claude/agents/researcher.md`) | Competitors, app reviews, training science, trends → scored ideas | `ops/research/`, `ops/ideas.md` |
| **Product Lead** (`product-lead.md`) | Reads feedback and research, picks this week's build, writes acceptance criteria | `ops/roadmap.md`, `ops/decisions.md` |
| **Coder** (`coder.md`) | Builds the chosen feature on an `agent/*` branch, adds tests, opens a pull request | `src/index.html`, `tests/`, pull requests |
| **QA** (`qa-tester.md`) | Verifies acceptance criteria, edge cases, old-data compatibility; extends tests | tests on the PR branch, PR comments |
| **Designer** (`designer.md`) | Screenshot review in dark/light at phone size; small polish on the branch | PR branch, `ops/ideas.md` |
| **Marketer** (`marketer.md`) | Weekly video ideas for Nheil's gym content, store listing, what's-new posts, growth experiment | `ops/marketing/` |

## The weekly loop

```
feedback.md + last week's PR
        │
  Researcher ──► ideas.md
        │
  Product Lead ──► roadmap.md "This week"
        │
  Coder ──► agent/<feature> branch ──► Pull request
        │                                 │
  QA ◄────────────── fix loop ────────────┤
  Designer ──► polish on the branch ──────┤
        │                                 ▼
  Marketer ──► posts, store copy     Nheil reviews & merges
        │                                 │
  Weekly report ──► message to Nheil   new APK / iPhone build
```

The exact steps are in `WEEKLY_CYCLE.md`.

## How Nheil steers the team

- **Give feedback:** add a line to `ops/feedback.md` (or tell Claude in chat). Feedback beats research ideas when the Product Lead plans.
- **Approve work:** review the pull request on GitHub. Try it, then **Merge** to ship it, or comment what to change. Closing a PR tells the team "not this".
- **Unblock things:** items under "Blocked" in `ops/roadmap.md` need you (for example creating a Supabase project for accounts, or a Google Play developer account).

## What the agents will not do

Merge pull requests, push app code straight to `main`, post on social media, create accounts, spend money, or give medical advice.
