# Weekly cycle runbook

The scheduled weekly task follows this file. One cycle = research → plan → build → test → design → marketing → report. Run the agents in this order with the Agent tool, passing each one the previous agent's summary. Total effort target: one focused pull request plus notes.

## 0. Set up

1. Make sure the repo is available at `/home/claude/lift-log` with push access: if it is missing, attach `nheilmangoba1/Lift-log` with push access and clone it there.
2. `cd /home/claude/lift-log && git checkout main && git pull`
3. `npm install --no-audit --no-fund` and `npm test`. If tests fail on `main`, the Coder's job this week is to fix that first.
4. Read `CLAUDE.md`, `ops/feedback.md`, `ops/roadmap.md` and the newest `ops/weekly/` report.

## 1. Researcher

Run the `researcher` agent. Output: updated `ops/research/competitors.md`, one deep-dive note, 3–5 new ideas in `ops/ideas.md`, and a 5-line summary.

## 2. Product Lead

Run the `product-lead` agent with the Researcher's summary. Output: updated `ops/roadmap.md` with a "This week" item (branch name + acceptance criteria), updated ICE scores, `ops/decisions.md` entries.

If two or more agent PRs are already open and unmerged, skip step 3 and have the Coder address review comments on the oldest open PR instead.

## 3. Coder

Run the `coder` agent with the "This week" brief. Output: branch `agent/<slug>` pushed, a pull request opened against `main`, tests passing.

## 4. QA

Run the `qa-tester` agent on that PR. If it finds blockers, run the `coder` agent again to fix them, then QA once more. At most two fix rounds; leave anything left as a PR comment.

## 5. Designer

Run the `designer` agent on the PR. Small polish goes on the branch; bigger ideas go to `ops/ideas.md`.

## 6. Marketer (PAUSED)

**Paused by Nheil on 2026-11-24. Skip this step every run until Nheil says to resume it** (he will say so in chat or in `ops/feedback.md`). Don't run the Marketer, don't write marketing files, and leave the video idea out of the report.

When resumed: run the `marketer` agent. Output: this week's content calendar in `ops/marketing/posts/`, "what's new" posts for features merged since last cycle, store listing updates, one growth experiment.

## 7. Report and notify

1. Write `ops/weekly/<yyyy>-W<ww>.md`:
   - **For Nheil (top, 5 lines max):** the PR link to review, what it does, and anything he must do (merge, test on phone, create an account). Add the best video idea only while the Marketer is active.
   - What each agent did, with links to files and the PR.
   - What failed or couldn't be verified.
2. Commit everything in `ops/` (and only `ops/`) straight to `main` with a message like `ops: weekly cycle <yyyy>-W<ww>` and push. These notes don't trigger app builds.
3. Send Nheil the "For Nheil" section as a message.

## Guardrails

- Never merge a PR or push app code (`src/`, `app/`, `docs/`, `ios/`) to `main`.
- Never create accounts, spend money, post publicly or message anyone.
- Don't delete other agents' notes; append or edit.
- If a step fails, record it in the report and continue with the next step.
