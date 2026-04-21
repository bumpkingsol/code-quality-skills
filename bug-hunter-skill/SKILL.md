---
name: bug-hunter
description: >
  Hunts production bugs in a running application by driving it as a real user would — via
  computer-use (or a browser MCP for web apps). First maps every route, screen, button, and
  intended behavior, then systematically exercises each one and reports deviations with
  screenshots, reproduction steps, and severity. Use this skill whenever the user wants to
  find bugs in a live app, test a production build, do a QA pass, check what's broken, run a
  regression sweep, or says things like "hunt bugs", "find bugs in [app]", "test the app",
  "what's broken in production", "QA [app]", "regression test", or "something's off with the
  app". Also trigger on focused requests like "test the onboarding flow" or "check if the
  settings page works". This skill drives a real running application — it does not read code.
  For code-level audits, use production-gap-auditor instead; for investigating a specific
  reported bug's root cause, use systematic-debugging.
---

# Bug Hunter

You are hunting bugs in a running application. Your job is to find every place where the
product fails a real user — buttons that do nothing, states that get stuck, flows that
dead-end, data that doesn't save, screens that render wrong.

**You do this by driving the real running app**, not by reading code. Think like a user opening
the app for the first time, then like a power user stress-testing every corner. A developer
sees functions; a user sees a tapped button that sat there doing nothing for six seconds and
then silently failed. Your job is to find every such betrayal of user intent.

This skill has three phases: **Map** (discover every route and its intended behavior), **Hunt**
(drive through the map and log deviations), **Report** (write up findings with evidence). The
map persists between runs so subsequent hunts start fast and catch regressions.

---

## Prerequisites

This skill requires:
- **Read / Write / Bash** — for persisting the flow map and writing reports
- At least one driver for the app under test:
  - **computer-use MCP** (`mcp__computer-use__*`) — for native desktop or visible simulator apps
  - **chrome-devtools MCP** or **playwright MCP** — for web apps (computer-use browsers are
    granted at "read" tier, so actual clicking/typing must go through a browser MCP)

**Before any computer-use action**, call `request_access` with the target app in the app list.
You will likely also need to request access to any app the target integrates with.

Persist state under `~/.claude/bug-hunter/<app-slug>/` (slugify the app name — e.g., "My App"
→ `my-app`):
- `config.json` — how to launch the app, test account, destructive-action guardrails
- `flow-map.json` — the living map of routes/screens/elements and intended behavior
- `reports/YYYY-MM-DD.md` — one report per hunt
- `reports/screenshots/YYYY-MM-DD/` — evidence screenshots

Create these directories on first run if they don't exist.

---

## Phase 0: Setup (every run)

1. **Identify the target app.** If the user named it in their request ("hunt bugs in X"), use
   that. Otherwise ask which app to hunt in. Slugify the name for the storage directory.

2. **On first ever run for this app**, ask and persist to `config.json`:
   - How is the app launched? (app name for `open_application`, URL, simulator command, etc.)
   - Which driver to use? (computer-use for native, chrome-devtools/playwright for web)
   - What's the authenticated test state? (test account credentials, or "assume already
     signed in")
   - Are there destructive actions to avoid? (real payments, real notifications to real
     users, emails that would actually send, deletions of real data)

   On subsequent runs, read this config and confirm it's still valid before proceeding.

3. **Request access** to the target app and any co-required apps (browser, settings, etc.).
   If denied, stop and ask the user.

4. **Check for an existing map** at `flow-map.json`. If present and fresh (< 7 days old AND
   the user hasn't indicated the app changed significantly), use it as the starting point for
   Phase 2. If stale, missing, or the user explicitly asked to "remap" or "full audit", do
   Phase 1 first.

---

## Phase 1: Discover & Map

Goal: produce a structured map of everything a user can do in the app, and the intended
behavior of each element. This is the spec against which you'll later detect deviations.

### 1.1 Launch and orient

- Launch the app via the configured method (`open_application`, navigate a browser, boot a
  simulator).
- Take a screenshot of the entry screen.
- Describe what you see: what's the app's apparent purpose, what are the top-level navigation
  anchors (tabs, sidebar, top nav, buttons), what state is the app in (logged out, onboarding,
  home, etc.)?

If the user has given you reference material (README, design docs, prior reports), read those
first so your notion of "intended behavior" isn't purely inferred from the UI.

### 1.2 Crawl every reachable screen

Breadth-first, systematically:

1. From the current screen, enumerate every interactive element visible: buttons, links, tabs,
   form fields, toggles, menus, list items that look tappable.
2. For each element, record:
   - **Label / accessibility name** (what the user would call it)
   - **Location** (screen name + rough position: "Settings tab, top-right")
   - **Type** (button, link, toggle, input, tab, etc.)
   - **Intended behavior** — what you believe tapping/using it should do. Base this on:
     its label, surrounding context, platform conventions, any docs the user provided. Mark as
     `inferred` vs `documented` so later you know how much trust to place in the expectation.
3. Pick one unexplored element, interact with it, screenshot the result, and repeat.
4. Track visited screens by their visible title/content signature so you don't loop forever.
5. Back out (swipe back, Esc, close) to continue crawling siblings.

**When you encounter a form**: note every field, its type, any validation hints (placeholder,
required markers), and what submitting should do. Don't submit with garbage yet — that's Phase 2.

**When you encounter a destructive action** (delete, cancel subscription, log out of all
sessions, etc.): note it in the map as `destructive: true` but DO NOT execute during mapping.
You'll decide with the user in Phase 2 whether to test it on a throwaway account or skip.

**When you hit a paywall, external link, or auth wall**: record it as a boundary and move on.

### 1.3 Persist the map

Write to `flow-map.json` as you go (not just at the end — you might crash). Structure:

```json
{
  "app": "<app name>",
  "mapped_at": "2026-04-20T14:30:00Z",
  "version_notes": "observed build/version string if visible",
  "screens": [
    {
      "id": "home",
      "title": "Home",
      "path": ["entry"],
      "screenshot": "reports/screenshots/map/home.png",
      "elements": [
        {
          "id": "home.primary_cta",
          "label": "Get started",
          "type": "button",
          "location": "center",
          "intended_behavior": "Opens the onboarding flow",
          "source": "inferred",
          "destructive": false,
          "leads_to": "onboarding_step_1"
        }
      ],
      "outgoing_flows": ["onboarding", "settings", "history"]
    }
  ],
  "flows": [
    {
      "id": "onboarding",
      "name": "Complete first-run onboarding",
      "steps": ["home.primary_cta", "onboarding_step_1", "..."],
      "intended_outcome": "User lands on home screen with account set up"
    }
  ]
}
```

Keep screen and element IDs stable across runs — that's how regressions are detected.

### 1.4 Map review

When the crawl feels complete, show the user a summary: screens found, flows identified,
anything ambiguous where you guessed at intended behavior. Let them correct the map before
Phase 2 — a wrong spec produces wrong bug reports.

---

## Phase 2: Hunt

Now you have a spec. Drive through it as adversarially as a real user base would, and log
every deviation.

### 2.1 What to hunt for

Categories of bugs to look for at every step:

- **Dead interactions** — element tapped, nothing happens, no feedback for > 2s
- **Wrong destination** — button claims X, takes you to Y (or nowhere)
- **Stuck states** — loading spinners that never resolve, buttons that stay disabled
- **Silent failures** — action claims to succeed but state doesn't change; or fails with
  no visible message
- **Visual defects** — clipped text, overlapping elements, broken layouts, wrong theme in
  dark mode, unreadable contrast
- **Data loss / persistence bugs** — form input discarded on back-navigation, changes that
  don't save, data that appears then disappears on refresh
- **State inconsistency** — list shows item count 5 but displays 4 items; header says
  logged-in but actions fail with "not authorized"
- **Navigation dead-ends** — no back button, no way out, modal that can't be dismissed
- **Empty/error states missing** — new user sees a broken blank screen instead of a helpful
  empty state
- **Validation gaps** — form accepts obviously invalid input, or rejects valid input with
  an unhelpful message
- **Regression against last map** — elements that moved, disappeared, or changed behavior
  compared to the stored `flow-map.json`

### 2.2 Hunt procedure

For each flow in the map, in order of importance (critical user journeys first):

1. Execute the flow happy-path as a user would. Screenshot at each step.
2. Compare actual behavior to `intended_behavior` from the map. Any deviation is a candidate
   finding.
3. Run adversarial variations on the same flow:
   - **Empty inputs** — submit with nothing filled
   - **Boundary inputs** — very long strings, emoji, leading/trailing whitespace, zero, negative
     numbers, far-future dates, dates in the past
   - **Interrupted flow** — start the flow, background the app, come back, try to resume
   - **Rapid repeat** — double-tap the submit button, spam a toggle
   - **Back-navigation mid-flow** — start filling, navigate back, return — is input preserved
     or discarded?
   - **Offline** (if feasible to simulate) — toggle Wi-Fi off mid-action
4. For every anomaly, immediately:
   - Screenshot the bad state (save to `reports/screenshots/YYYY-MM-DD/bug-NNN-*.png`)
   - Record exact reproduction steps (starting screen, every click/key press in order)
   - Note what was expected vs what happened
   - Guess at severity and confidence (criteria below)
5. Move on — don't get stuck debugging a single issue. Keep ground coverage high.

### 2.3 Destructive actions

For elements marked `destructive: true` in the map, pause and ask the user how to test each
one before executing. Options typically: skip, test on a throwaway account, or user performs
it manually while you watch. Never execute real payments, real outbound communications, or
deletions of real data without explicit permission in the current session.

### 2.4 Be thorough, but bounded

A full hunt across a large app can go on indefinitely. Budget yourself: aim for complete
coverage of the core flows and breadth-first coverage of everything else. If you're running
long, tell the user what you've covered and what remains, and ask whether to continue or
cut a report now.

---

## Phase 3: Report

Write to `~/.claude/bug-hunter/<app-slug>/reports/YYYY-MM-DD.md` (append `-2`, `-3` if a
report for today already exists).

### Report structure

```markdown
# <App> Bug Hunt — [Date]

**App version**: [observed version/build]
**Hunt scope**: [full map / specific flows: X, Y, Z]
**Flows exercised**: [N of M mapped]
**Duration**: [approx time]

## Executive summary
[2-3 sentences: overall health, worst finding, count by severity]

## Critical
[Data loss, security exposure, core feature fully broken, crashes]

### [Finding title]
- **Where**: [Screen → element path]
- **User experience**: [describe what a real user sees/feels, not technical jargon]
- **Expected**: [per the map's intended_behavior]
- **Actual**: [what happened]
- **Repro**:
  1. Open the app
  2. Tap "X"
  3. ...
- **Evidence**: ![bad state](screenshots/2026-04-20/bug-001-stuck-loader.png)
- **Confidence**: High / Medium / Low — [why]
- **Suspected area**: [best guess at the subsystem — "auth refresh", "submission handler", etc. Only if you have a clear signal, otherwise omit]
- **Severity**: Critical — [impact statement]

## High
[Common flows degraded, realistic scenarios that frustrate users]

## Medium
[Edge cases, non-critical flows, minor UX]

## Low
[Cosmetic, rare conditions, nitpicks worth tracking]

## Regressions from previous map
[Elements/flows that changed or disappeared since flow-map.json was last updated — may be
intentional changes, may be regressions. List for user triage.]

## Positive observations
[Flows that worked flawlessly across adversarial testing — so the team knows what patterns
are holding up]

## Coverage summary
| Flow | Happy path | Adversarial | Status |
|------|-----------|-------------|--------|
| [flow name] | ✅ | ✅ | 2 findings |
| ...  |

## Not tested
[Anything skipped — destructive actions declined, external auth, paid-only flows — so the
user can decide whether to cover them separately]
```

### Severity criteria

- **Critical**: data loss, security exposure, core feature completely broken, app crash,
  inability to complete a flow that the app's value proposition hinges on
- **High**: common flows noticeably degraded, data inconsistency that would alarm a user,
  features that work sometimes but fail in realistic scenarios
- **Medium**: edge cases, degraded UX under specific but realistic conditions, recoverable
  confusion
- **Low**: cosmetic, rare, or requires unusual user behavior to hit

### Confidence criteria

- **High**: reproduced multiple times, screenshots show the failure unambiguously
- **Medium**: observed once clearly, but not re-verified
- **Low**: seen briefly, might be a transient glitch, worth someone taking a second look

Never promote a Low-confidence finding to Critical severity. If it might be critical, go back
and reproduce it before filing.

### Writing findings

Write from the user's perspective, not the tester's. Bad: "ButtonView returns nil on second
tap." Good: "After creating a record and tapping New Record again, nothing happens. User has
to force-quit and reopen the app to create another one."

---

## Execution notes

- **Screenshot liberally.** Every state transition, every finding. Storage is cheap;
  re-running a hunt to recreate evidence is expensive.
- **Update `flow-map.json` as you learn.** If during hunting you discover a screen or element
  the map missed, add it. The map should get better every run.
- **If the app crashes**, that's a Critical finding. Record the exact steps, reopen the app,
  continue where you left off.
- **If you get stuck** — an auth wall, an external service down, a modal you can't dismiss —
  don't spin. Screenshot the stuck state, note it, and move on to another flow. Tell the user
  at the end.
- **Don't invent intended behavior under uncertainty.** If you genuinely don't know what a
  button is supposed to do, mark the finding confidence as Low and ask the user for the spec
  before filing.
- **When the user says "quick hunt"** — skip the full Phase 1 remap, exercise only the top
  5-10 most critical flows from the existing map, report findings without adversarial variants.
- **When the user names a specific flow** ("test the onboarding") — run Phase 2 on just that
  flow, including adversarial variants, and report.

## Related skills

- **production-gap-auditor** — code-side audit for bugs unit tests miss. Complement this skill
  with that one to cross-reference UI findings against their likely source files.
- **systematic-debugging** — once this skill surfaces a bug, use systematic-debugging to drive
  it to root cause.
