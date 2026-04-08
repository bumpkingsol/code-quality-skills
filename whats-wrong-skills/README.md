# whats-wrong

A Claude Code skill that deep-dives into a specific segment of your application to find everything that's broken, incomplete, or below world-class standards.

Point it at any subsystem — notifications, auth, payments, search, onboarding — and it will trace every code path, compare against industry best practices, and produce an actionable diagnosis report.

## Install

```bash
npx @anthropic-ai/claude-code skill add bumpkingsol/whats-wrong-skills
```

## Usage

Just tell Claude what part of your app you want investigated:

```
What's wrong with our notification system?
```

```
Our search feels broken, what's going on?
```

```
Why is our auth flow so janky? Users keep getting logged out
```

```
Diagnose our payment integration
```

The skill also triggers on phrases like "our [X] sucks", "deep dive into [X]", "figure out what's going on with [X]", or "why does [X] feel off?"

## What it does

### 1. Maps the subsystem
Finds every file, route, component, model, and background job that belongs to the subsystem you pointed at. Traces the full data flow from input to output.

### 2. Builds a best-practices baseline
Generates a checklist of what a world-class version of this type of system would have — functional completeness, reliability, user experience, and operational maturity. This becomes the rubric.

### 3. Deep investigation
Traces every code path: happy path, failure modes, edge cases, integration points, and test coverage gaps. Reads the actual code, not just grep patterns.

### 4. Diagnosis report
Produces a structured report with:

- **Architecture overview** — how the subsystem is structured and how data flows
- **Best-practices scorecard** — capability-by-capability comparison against industry standards
- **Findings by severity** — Critical / High / Medium / Low, each with file:line references, user impact, root cause, and concrete fix suggestions
- **What's working well** — patterns worth keeping
- **Recommended priority** — suggested order of attack

## How it differs from production-gap-auditor

| | whats-wrong | production-gap-auditor |
|---|---|---|
| **Scope** | One specific subsystem | Entire codebase |
| **Depth** | Traces every code path | Pattern-based sweep |
| **Best practices** | Compares against domain-specific standards | Checks for universal production gaps |
| **When to use** | You know what's broken, want to understand why | You want a broad health check |

Use the production-gap-auditor for codebase-wide sweeps. Use whats-wrong when you've already identified the area that needs attention.

## Example output

The report follows this structure:

```markdown
# What's Wrong With [Subsystem]

## Summary
## Architecture Overview
## Best Practices Scorecard
| Capability | Status | Details |
## Findings
### Critical
### High
### Medium
### Low
## What's Working Well
## Recommended Priority
```

## Requirements

Works with any language and framework. Uses Glob, Grep, Read, Bash (for git history), and Agent tools for parallel investigation.

## License

MIT
