---
name: whats-wrong
description: >
  Deep-dives into a specific segment of an application (e.g., notifications, auth, payments,
  search, onboarding) to find everything broken, incomplete, or below world-class standards,
  then produces a detailed diagnosis with concrete fixes. Use when the user asks "what's wrong
  with our [X]?", "diagnose [X]", "deep dive into [X]", or "our [X] sucks". This is the
  focused, deep counterpart to production-gap-auditor — use that for codebase-wide sweeps,
  use this when the user has already identified the area that needs attention.
---

# What's Wrong

You are performing a deep diagnosis of a specific subsystem. The user has pointed at something
— a service, feature, flow, or component — and your job is to figure out everything that's
wrong with it, from outright bugs to "it works but it's mediocre."

The key difference from a general audit: you are going **deep, not broad**. You're not scanning
the whole codebase for patterns. You're tracing every code path in one subsystem, understanding
every decision that was made, and measuring the result against what a world-class implementation
of this type of system looks like.

Think of yourself as a specialist consultant brought in to evaluate one specific part of the
product. A cardiologist, not a general practitioner.

---

## Phase 1: Understand the Segment

Before you can judge what's wrong, you need to fully understand what you're looking at.

### 1.1 Identify the Boundaries

The user said something like "what's wrong with our notifications" — your first job is to find
every file, function, route, component, model, migration, queue, and config that belongs to
this subsystem.

Use Glob and Grep extensively. Search for:
- **Naming patterns**: files/folders named after the subsystem (`notification`, `notif`, `alert`, `push`)
- **Domain models**: database tables, schemas, types, interfaces related to this concept
- **API endpoints**: routes that serve this feature
- **UI components**: screens, modals, toasts, cards that display this feature
- **Background jobs**: workers, crons, queues that process this feature
- **Config and env vars**: feature flags, API keys, service URLs related to this
- **Tests**: what's being tested (and what isn't)

Build a map. Write it down. You should be able to say: "The notification system consists of
these N files across these layers: [data model, API, service logic, background workers, UI]."

### 1.2 Understand the Intent

Figure out what this subsystem is *supposed* to do. Read:
- README, docs, comments, commit messages related to this area
- The data model — what entities exist and how they relate
- The API surface — what operations are exposed
- The UI — what the user sees and can interact with

Formulate a clear statement: "This subsystem is supposed to [do X, Y, Z] for the user."

### 1.3 Trace the Architecture

Map how data flows through this subsystem end-to-end:
- **Input**: Where does data enter? (user action, webhook, cron, another service)
- **Processing**: What happens to it? (validation, transformation, business logic)
- **Storage**: Where is it persisted? (database, cache, queue, file)
- **Output**: How does the result reach the user? (API response, push notification, email, UI update)
- **Feedback loops**: Does the user get confirmation? Can they undo? Are they notified of failures?

Draw the full picture before you start judging.

---

## Phase 2: Best Practices Baseline

This is what makes this skill different from just "find bugs." Before you evaluate the code,
you need to establish what *good* looks like for this type of system.

### How to Build the Baseline

Based on the type of subsystem you're investigating, generate a best-practices checklist.
Think about what the best implementations in the industry do. Consider:

**Functional completeness** — What capabilities should a world-class version of this have?
For example, a world-class notification system would have:
- Delivery guarantees (at-least-once, retry with backoff)
- Multiple channels (in-app, push, email, SMS) with user preferences per channel
- Read/unread state management
- Grouping and batching (don't send 50 separate notifications)
- Quiet hours / do-not-disturb
- Notification preferences (granular opt-in/opt-out per notification type)
- Real-time delivery (WebSocket or SSE, not just polling)
- Rich content (actions, images, deep links)
- History / notification center

**Reliability** — What should never go wrong?
- Idempotency (same event doesn't produce duplicate notifications)
- Failure handling (what happens when a delivery channel is down?)
- Queue management (dead letter queues, retry policies)
- Monitoring and alerting on delivery failures

**User experience** — What should the experience feel like?
- Instant feedback when actions are taken
- Clear, contextual content (not generic "something happened")
- Easy to manage preferences without hunting through settings
- Graceful degradation (if push fails, fall back to in-app)
- Accessible (screen readers, reduced motion)

**Operational maturity** — Can the team maintain and evolve this?
- Observability (can you tell if notifications are being delivered?)
- Configuration (can you add new notification types without code changes?)
- Testing (are critical paths tested? can you test in staging?)
- Documentation (do new engineers know how this works?)

Write out this checklist explicitly. It becomes the rubric you evaluate against.

The checklist should be tailored to the specific subsystem — a payment system has different
best practices than a search system. Use your knowledge of industry standards, but keep it
grounded in what's realistic and valuable, not theoretical perfection.

---

## Phase 3: Deep Investigation

Now trace every code path in this subsystem. Unlike a broad audit where you scan for patterns,
here you *read the actual code* for every significant function and flow.

### 3.1 Happy Path Trace

Follow the primary flow end-to-end. Read every file in the chain. For each step, note:
- Does it handle errors from the previous step?
- Does it validate its inputs?
- Does it produce the right output for the next step?
- Is the user kept informed of progress?

### 3.2 Failure Mode Analysis

For every operation in the subsystem, ask: "What happens when this fails?"
- Network request times out?
- Database write fails?
- External service returns an error?
- User provides unexpected input?
- Two requests arrive simultaneously?
- The background job crashes mid-execution?

Trace each failure. Does the user get a meaningful error? Does the system retry? Does data
get corrupted? Does the failure cascade to other parts of the system?

### 3.3 Edge Case Exploration

Think about the scenarios that developers tend to forget:
- **First use**: What happens when there's no data yet? Empty states?
- **Scale**: What happens with 10,000 items instead of 10? Any unbounded queries?
- **Concurrency**: What if two users (or the same user on two devices) act simultaneously?
- **Permissions**: Can users access or modify things they shouldn't?
- **State transitions**: Are there impossible or stuck states? Can you get halfway through a flow and get stuck?
- **Cleanup**: When things are deleted, is all related data cleaned up?
- **Timing**: Are there race conditions between async operations?

### 3.4 Integration Point Inspection

Where this subsystem talks to other parts of the system or external services:
- Are API contracts correct on both sides?
- Are errors from external services handled gracefully?
- Are timeouts configured? What happens when they fire?
- Are there circuit breakers or fallbacks for external dependencies?
- Are webhook signatures validated?
- Are retries idempotent?

### 3.5 Test Coverage Analysis

Look at what's tested and what isn't:
- Which flows have test coverage?
- Are tests testing real behavior or just mocking everything?
- Are there integration tests that exercise the full flow?
- Are edge cases tested?
- Are failure modes tested?

The gaps in test coverage often correlate directly with the gaps in the implementation.

---

## Phase 4: Diagnosis Report

Generate the report at `.claude/audits/whats-wrong-[subsystem]-YYYY-MM-DD.md` if `.claude/`
exists, otherwise `whats-wrong-[subsystem].md` in the project root.

### Report Structure

```markdown
# What's Wrong With [Subsystem Name]

**Date**: [date]
**Codebase**: [project name]
**Subsystem**: [what was investigated]
**Files examined**: [count and key paths]

## Summary

[2-3 sentences: what state is this subsystem in? Is it fundamentally broken, partially
working, or working but mediocre? What's the single biggest issue?]

## Architecture Overview

[Brief description of how this subsystem is structured — the layers, the data flow,
the key components. Include a simple diagram if it helps. This gives the reader context
for the findings that follow.]

## Best Practices Scorecard

How this implementation measures up against what a world-class version of this type of
system would look like.

| Capability | Status | Details |
|------------|--------|---------|
| [e.g., Delivery guarantees] | Missing / Partial / Solid | [specifics] |
| [e.g., User preferences] | Missing / Partial / Solid | [specifics] |
| ... | ... | ... |

**Overall grade**: [e.g., "This is a minimal viable implementation — it handles the
happy path but lacks the reliability, flexibility, and UX polish that users expect
from a production system."]

## Findings

### Critical
[Things that are actively broken — data loss, security holes, complete feature failure]

### High
[Things that fail in common real-world scenarios — not edge cases, but realistic usage
patterns that real users will hit]

### Medium
[Things that work but are noticeably below par — missing features, poor UX, lack of
resilience]

### Low
[Things that are suboptimal but unlikely to bite users today — tech debt, missing
observability, design limitations that will matter at scale]

### Finding Format

For each finding:

- **What's wrong**: [describe what the user experiences, not just what the code does]
- **Where**: `file:line` (and related files)
- **Why it happens**: [root cause in the code — trace the execution path]
- **Impact**: [who is affected, how often, how badly]
- **Best practice**: [what a good implementation would do instead]
- **Suggested fix**: [concrete recommendation — not "improve error handling" but
  "wrap the call on line 42 in a try/catch that shows a toast with the error message
  and retries up to 3 times with exponential backoff"]
- **Evidence**: [code snippets that demonstrate the issue]

## What's Working Well

[Genuine positives — patterns worth keeping and building on. This isn't filler; it helps
the team understand what foundation they have to work with.]

## Recommended Priority

[A suggested order of attack. What should be fixed first and why? Group related fixes
that can be done together. Distinguish between quick wins and larger efforts.]
```

### Writing Findings

Be specific and empathetic. The person reading this built the system and probably knows it
has problems — they're asking for help, not judgment. Frame findings as "here's what's
happening and here's how to make it better," not "this is bad."

Every finding must include the best-practice comparison — not just "this is broken" but
"here's what the standard is and here's how this falls short." That's the value-add over
a plain bug report.

---

## Execution Strategy

### Parallel Investigation

Spawn subagents for maximum coverage:

1. **Explore agent** -> Phase 1 (map the subsystem boundaries, architecture, data flow)
2. **General-purpose agent** -> Phase 3.1 + 3.2 (happy path trace + failure mode analysis)
3. **General-purpose agent** -> Phase 3.3 + 3.4 (edge cases + integration points)
4. **General-purpose agent** -> Phase 3.5 + Phase 2 research (test coverage + best practices for this type of system)

Give each agent:
- The subsystem name and the user's description of what's wrong
- The detected language/framework
- Instructions to read actual code, not just grep for patterns

### Synthesis

After agents report back:

1. **Build the best-practices checklist** from agent 4's research, augmented by your own knowledge
2. **Score each capability** against the checklist using evidence from agents 2 and 3
3. **Verify Critical/High findings yourself** — read the code, confirm the execution path
4. **Prioritize** — order findings by a combination of impact and fix difficulty
5. **Write the report** — specific, empathetic, actionable
