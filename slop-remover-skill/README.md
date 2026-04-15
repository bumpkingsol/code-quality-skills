# Slop Remover Skill

A Claude Code skill that deep-cleans codebases by dispatching 8 parallel specialist agents, each targeting one dimension of code rot. Especially effective after heavy AI-assisted development, large refactors, or when onboarding to a messy project.

## The Problem

AI-assisted development produces code fast. It also produces:
- Duplicated functions across files because each generation doesn't know what already exists
- Weak types (`any`, `unknown`) used as shortcuts that never get cleaned up
- Narration comments that restate the code: `// increment counter` above `counter++`
- Defensive try/catch blocks wrapping code that can't throw
- Stubs that look real but return dummy data
- Deprecated code paths living next to their replacements
- Circular dependencies from quick-fix imports
- Scattered type definitions that should be shared

One agent doing a single pass catches the obvious stuff. Eight specialists each doing deep research on their domain catches the rest.

## What it does

Dispatches 8 focused agents that research, assess, and fix:

| # | Agent | What it hunts |
|---|-------|--------------|
| 1 | **Deduplicator** | Copy-pasted logic, redundant utilities, DRY violations |
| 2 | **Type Consolidator** | Scattered/duplicate type definitions across files |
| 3 | **Dead Code Remover** | Unused exports, orphan files, unreachable code |
| 4 | **Dependency Untangler** | Circular imports, tangled module graphs |
| 5 | **Type Strengthener** | `any`, `unknown`, weak/untyped parameters |
| 6 | **Error Handling Auditor** | Pointless try/catch, error-swallowing, redundant guards |
| 7 | **Legacy Sweeper** | Deprecated APIs, dead feature flags, compat shims |
| 8 | **Slop Scrubber** | AI stubs, narration comments, debug artifacts, noise |

## How it works

### 1. Pre-flight

The skill scans your project to understand what it's working with:
- Language and framework detection (package.json, tsconfig, Cargo.toml, etc.)
- Source root identification (src/, app/, lib/)
- Available tooling check (knip, madge, or language equivalents)
- Codebase size estimation
- Git state and worktree capability check

### 2. Parallel dispatch

All 8 agents launch simultaneously as separate subagents using the Agent tool. Each agent runs independently in its own context, which means:
- They work in parallel (8x throughput)
- Each gets deep, focused context on its domain
- No shallow scanning — each agent does thorough research

In **worktree mode** (preferred), each agent gets an isolated git worktree so there are zero conflicts. In **direct mode** (fallback), agents write assessment-only reports, then changes are implemented sequentially.

### 3. Research and assessment

Each agent:
- Searches the entire codebase for issues in its domain
- Verifies each finding (checks for dynamic imports, config references, framework magic)
- Categorizes findings by confidence level
- Documents every finding with file path, line number, what's wrong, why, and what to do

### 4. Implementation

Based on confidence:
- **High confidence** — implemented automatically (exact duplicates, empty catch blocks, commented-out code)
- **Medium confidence** — implemented only if tests pass and types check
- **Low confidence** — flagged in the assessment for human review, never auto-implemented

### 5. Consolidation

After all agents complete, the skill:
- Collects all assessments into a single summary
- Detects conflicts between agents (e.g., Agent 3 wants to delete a file Agent 1 refactored)
- Presents a clear picture: what was found, what was fixed, what needs your call
- Recommends a merge order: removals first (3, 7, 8) → structural changes (4, 2) → modifications (1, 5, 6)

### 6. Verification

Changes are merged one at a time with the type checker and test suite running between each merge. Any failures are flagged for you to decide — the skill never force-resolves conflicts.

## Agent details

### Agent 1: Deduplicator
Finds functions, methods, and logic blocks that are duplicated across files. Consolidates into shared modules grouped by domain (not a single god-util file). Won't merge things that are only superficially similar — if two functions share 5 lines but differ in edge cases, they stay separate.

### Agent 2: Type Consolidator
Maps every type/interface/enum definition: where it's defined, where it's imported, how many consumers it has. Finds exact duplicates, near-duplicates that have drifted apart, and types used across 3+ files but defined locally. Organizes by domain: `types/user.ts`, `types/order.ts` — not `types/index.ts` with everything.

### Agent 3: Dead Code Remover
Uses knip (JS/TS), vulture (Python), cargo-udeps (Rust), or grep-based analysis as fallback. For every flagged item, runs an 8-point verification: checks for dynamic imports, config references, framework invocations, reflection, and documented intent. Conservative — would rather miss dead code than delete something that's actually used.

### Agent 4: Dependency Untangler
Runs madge or equivalent to find circular dependency chains. Traces each cycle to understand why it exists (shared types? callback patterns? layering violation?) and applies the right fix: extract shared types, invert dependencies, merge modules, or use type-only imports. Verifies the cycle is actually broken after each fix.

### Agent 5: Type Strengthener
Finds every `any`, `unknown` (where type IS known), untyped parameter, `Object`, `{}`, `Function`, and replaces with real types. Traces data flow to determine correct types — checks what values flow in, what properties are accessed, what the function caller always passes. Checks third-party `.d.ts` files for types the developer didn't know existed.

### Agent 6: Error Handling Auditor
Scans all try/catch, .catch(), error boundaries. For each: what error could actually happen? Does the catch do anything useful? Is it swallowing errors silently? Removes empty catches, catch-and-rethrow that adds no context, try/catch wrapping code that can't throw. Keeps error handling at system boundaries (network, I/O, user input, third-party APIs).

### Agent 7: Legacy Sweeper
Finds `@deprecated`, `TODO`, `FIXME`, `HACK`, feature flags that are always on/off, polyfills for baseline APIs, completed migration code, compatibility shims for unsupported versions. Checks git blame for context on when things were deprecated. Removes dead paths and collapses always-true/false conditions.

### Agent 8: Slop Scrubber
Finds AI-generated noise: comments that restate the code (`// check if authenticated` above `if (user.isAuthenticated)`), development-process comments (`// replaced old auth with new auth`), stubs pretending to work, debug console.logs, commented-out code, section dividers. Rewrites comments that have a useful kernel buried in noise. Keeps comments explaining WHY and gotcha warnings.

## Scope control

Run all 8 agents or pick and choose:

```
"Clean up this codebase"              → full 8-agent sweep
"Just run agents 3 and 8"             → dead code + slop only
"Clean up the auth module"            → scoped to a directory
"Skip the type stuff"                 → omit agents 2 and 5
"Run slop-remover on admin-dashboard" → scoped to a subdirectory in a monorepo
```

## Supported languages

Works with any language. Has specific tooling integration for:

| Language | Dead code | Circular deps | Types | Error handling |
|----------|-----------|---------------|-------|----------------|
| **TypeScript/JS** | knip | madge | tsc strict mode | try/catch, .catch() |
| **Rust** | cargo-udeps, clippy | cargo dependency graph | compiler (already strict) | unwrap, expect, Result |
| **Python** | vulture | import-linter | mypy/pyright | try/except, bare except |
| **Go** | staticcheck, go vet | internal import analysis | already typed, check interface{} | error != nil, panic |

Falls back to grep-based manual analysis when specialized tools aren't available. Manual analysis is slower but catches the majority of real issues.

## Installation

### Claude Code CLI

```bash
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/slop-remover-skill/slop-remover.skill
```

Or if you've cloned the repo:

```bash
claude install-skill slop-remover-skill/slop-remover.skill
```

### Verify installation

Start a new Claude Code session and run `/skills` — you should see `slop-remover` in the list.

## Usage

Just ask naturally in any project:

- "Run slop-remover on this codebase"
- "Clean up this project, it's gotten messy"
- "Remove dead code and AI slop"
- "Do a full code quality sweep"
- "Just run the error handling and type agents"
- "Tidy up, there's a lot of junk in here"

The skill triggers automatically based on your request.

## Example output

When run on a 600+ file TypeScript monorepo (Expo + Next.js + Supabase), the skill found:

**Admin dashboard (57 files):**
- 70 findings across all 8 agents (24 high, 19 medium, 27 low confidence)
- Removed a dead 90-line modal component (never triggered)
- Extracted a duplicated utility function into a shared module
- Replaced 6 instances of `any` with `unknown`
- Removed 6 narration comments
- Flagged a 2400-line monolith file for splitting

**Mobile app (554 files):**
- 42 findings from 3 agents (dead code, error handling, slop)
- Found 2 orphaned components with zero non-test imports
- Identified 3 silent catch blocks hiding errors
- Found 28+ decorative section divider lines across type files
- Flagged a deprecated method still being called (always throws, caller swallows the error)

## File structure

```
slop-remover-skill/
  SKILL.md                       # Main skill — orchestration, pre-flight, dispatch, consolidation
  references/
    agent-prompts.md             # Detailed mission briefs for all 8 specialist agents
  README.md                      # This file
```

## License

MIT
