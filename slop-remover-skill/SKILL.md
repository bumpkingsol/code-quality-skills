---
name: slop-remover
description: Deep-cleans a codebase by dispatching 8 parallel specialist agents that research, assess, and fix code duplication, scattered type definitions, dead code, circular dependencies, weak types (any/unknown), unnecessary defensive programming, legacy patterns, and AI-generated slop. Use when the user wants to clean up a codebase, reduce technical debt, or improve code hygiene — especially after heavy AI-assisted development or large refactors. Trigger on phrases like "slop", "clean up this codebase", "code quality sweep", "technical debt", or "code hygiene".
---

# Slop Remover

Eight specialist agents run in parallel, each targeting one dimension of code rot. Each agent researches its area across the entire codebase, writes a critical assessment with findings and recommendations, then implements all high-confidence fixes. After all agents finish, you consolidate, resolve conflicts, and merge in a safe order.

**This skill's power comes from parallel dispatch.** You MUST use the Agent tool to spawn separate subagents — do NOT perform the 8 analyses yourself sequentially. Each agent runs independently with its own context, which means they can work simultaneously and produce deeper analysis than a single pass. If you skip parallel dispatch and do the work yourself, you'll produce a shallow surface scan instead of the deep per-domain analysis each specialist is designed for.

## Pre-flight

Before dispatching anything, establish the terrain:

1. **Clean git state preferred.** Run `git status`. If there are uncommitted changes, ask the user to commit or stash — worktree isolation works best from a clean baseline. If the user says to proceed anyway, note it and continue.

2. **Detect the project.** Scan for project manifests and configuration:
   - Language: package.json / tsconfig.json → JS/TS; Cargo.toml → Rust; go.mod → Go; pyproject.toml / setup.py → Python
   - Framework: Next.js, React, Express, FastAPI, etc.
   - Linters and formatters already configured (eslint, biome, prettier, rustfmt, etc.)
   - Test runner and test locations
   - Build system and entry points

3. **Find the source root.** Where the actual application code lives (`src/`, `app/`, `lib/`, or project root). Identify what to exclude: node_modules, build outputs, vendor dirs, generated code, lock files.

4. **Check tooling availability.** For JS/TS projects, check for `knip` and `madge`:
   ```bash
   npx knip --version 2>/dev/null && npx madge --version 2>/dev/null
   ```
   If missing, ask the user before installing. If they decline or installation isn't possible, that's fine — agents will fall back to grep-based analysis and manual import tracing. Specialized tools produce more thorough results but are not required. For other languages, identify equivalents:
   - Rust: `cargo-udeps`, `cargo clippy`
   - Python: `vulture`, `import-linter`, `mypy`/`pyright`
   - Go: `staticcheck`, `go vet`

5. **Take stock.** Get a rough sense of codebase size and complexity — this helps you brief the agents. Run a quick line count on source files, note how many modules/packages exist, and whether there's a monorepo structure.

6. **Determine execution mode.** Check whether you can create git worktrees (requires Bash access and a git repo). This determines how agents run:
   - **Worktree mode** (preferred): Each agent gets `isolation: "worktree"` — fully parallel, no conflicts, changes on separate branches. Use this when possible.
   - **Direct mode** (fallback): If worktrees aren't available (no Bash, not a git repo, permissions restricted), agents work directly in the codebase. In this mode, have each agent write its assessment first WITHOUT making changes, then implement changes sequentially by agent after review to avoid conflicts.

## Dispatching the agents

Read `references/agent-prompts.md` — it contains the detailed mission brief for each of the 8 agents.

**You must use the Agent tool to spawn each specialist as a separate subagent.** This is not optional — the entire value of this skill comes from deep, parallel analysis. A single agent doing 8 shallow passes produces surface-level findings. Eight focused agents each doing deep research on their one domain is what finds the real problems.

### How to dispatch

1. Read `references/agent-prompts.md` to get the mission brief for each agent
2. Construct a prompt for each agent by combining the project context (from pre-flight) with that agent's mission brief
3. Call the Agent tool 8 times (or however many agents are requested) **in a single message** so they all launch concurrently
4. If worktree mode is available, set `isolation: "worktree"` on each Agent call
5. If in direct mode, omit isolation — but instruct each agent to write ASSESSMENT.md only (no code changes) so there are no conflicts

Each agent prompt should follow this template. Adjust the output requirements section based on whether you're in worktree mode or direct mode:

```
You are Agent N: [Name], a specialist in [domain]. Your job is to do deep research
on the codebase and produce a thorough assessment, then implement high-confidence fixes.

Project context:
- Language: [detected language]
- Framework: [detected framework]
- Source root: [path]
- Excluded dirs: [list]
- Available tools: [knip, madge, etc. — or "none available, use grep-based analysis"]
- Approx size: [X files, Y lines]
- Test runner: [jest, vitest, pytest, etc.]
- Entry points: [list of known entry points]

Your mission:
[Paste the full agent section from references/agent-prompts.md]

Output requirements:
- Write your findings to `.claude/audits/slop-N-[name].md`
  (e.g., `.claude/audits/slop-3-dead-code.md`) if the `.claude/` directory exists,
  otherwise fall back to `slop-N-[name].md` at the project root. If a file with that
  name already exists for today, suffix with `-2`, `-3`, etc. Use a unique filename —
  other agents are writing their own assessments concurrently.
- Categorize every finding by confidence: HIGH (implement), MEDIUM (implement if verifiable), LOW (flag only)
- For each finding: file path, line number, what's wrong, why, and what to do
```

**Add for worktree mode:**
```
- After assessment, implement all HIGH confidence fixes
- Run type checker and tests after changes — revert anything that breaks
- Commit changes with message prefixed by [slop-N]
```

**Add for direct mode:**
```
- Assessment ONLY — do NOT modify any source files. Other agents are running
  concurrently in the same codebase and changes would cause conflicts.
  Implementation happens after all agents report back.
```

### When tools aren't available

If knip, madge, or other specialized tools can't be installed or run, agents should fall back to manual analysis:
- **Dead code**: grep for exports, then grep for their imports across the codebase. Check for dynamic imports, config references, and framework magic.
- **Circular deps**: trace import chains manually by following import statements through the module graph
- **Type checking**: read the tsconfig/equivalent, then check types by tracing data flow through the code

Manual analysis is slower and less comprehensive than tooling, but still catches the majority of real issues. The agent should note in its assessment which findings would benefit from tool-based verification.

### Agent roster

| # | Name | What it hunts | Primary tools |
|---|------|--------------|---------------|
| 1 | Deduplicator | Copy-pasted logic, redundant utilities, DRY violations | Grep, structural comparison |
| 2 | Type Consolidator | Scattered/duplicate type defs → shared type modules | Grep for `type`, `interface`, struct defs |
| 3 | Dead Code Remover | Unused exports, orphan files, unreachable code | knip / language equivalent |
| 4 | Dependency Untangler | Circular imports, tangled module graph | madge / language equivalent |
| 5 | Type Strengthener | `any`, `unknown`, untyped params → real types | Type checker, package .d.ts inspection |
| 6 | Error Handling Auditor | Pointless try/catch, error-swallowing, redundant guards | Catch-block analysis |
| 7 | Legacy Sweeper | Deprecated APIs, dead feature flags, compat shims | Deprecation markers, TODO/FIXME scan |
| 8 | Slop Scrubber | AI stubs, narration comments, debug artifacts, noise | Comment and stub detection |

## Confidence levels

Each agent sorts findings into three buckets. This is the decision framework, not just a label — it determines what gets auto-implemented vs. flagged:

**High confidence** — implement automatically. The fix is obvious and verifiable.
- Exact duplicate functions, empty catch blocks, `// TODO` on finished code, imports of deleted modules, commented-out code, `any` where the type is clearly derivable from usage

**Medium confidence** — implement only if the change can be verified (tests pass, types check). Describe reasoning in the assessment.
- Similar-but-not-identical functions that might consolidate, try/catch around code that *probably* can't throw, types that are `any` but feed into complex generics

**Low confidence** — flag in assessment only, never auto-implement. These need human judgment.
- Code that looks unused but might be called dynamically, error handling around third-party APIs, types that require domain knowledge to determine

## After all agents complete

This is where you consolidate and present results. Don't just dump 8 branches on the user — synthesize.

### 1. Collect assessments

Each agent returns its results. In worktree mode, each agent has a branch — read its `.claude/audits/slop-N-[name].md` from the worktree (falling back to the project root if `.claude/` doesn't exist there). In direct mode, all assessments are written to `.claude/audits/slop-1-deduplicator.md`, `.claude/audits/slop-3-dead-code.md`, etc. (or the project-root fallback) — collect them all. Note:
- Total findings per agent (high/medium/low)
- What was actually implemented vs. just flagged
- Any warnings about risky changes

### 2. Present a consolidated summary

Show the user a clear picture before merging anything:

```
## Slop Removal Summary

### Agent 1 — Deduplicator
- Found: 12 instances of duplication
- Implemented: 8 consolidations (high confidence)
- Flagged: 4 similar-but-different pairs (medium, need your call)

### Agent 3 — Dead Code Remover  
- Found: 23 unused exports, 5 orphan files
- Removed: 18 exports, 3 files (high confidence)
- Flagged: 5 exports possibly used via dynamic import

[... etc for all 8 agents]

### Potential conflicts
- Agent 3 deleted `utils/format.ts` which Agent 1 refactored → Agent 1's branch will fail to merge cleanly
- Agents 5 and 2 both touched type definitions in `types/api.ts`

### Recommended merge order
1. Removals first (3, 7, 8) — deleting code rarely conflicts
2. Structural changes (4, 2) — import restructuring, type consolidation  
3. Modifications (1, 5, 6) — these touch the most existing code
```

### 3. Implement / merge with verification

**Worktree mode:** After the user approves, merge branches one at a time in the recommended order. Between each merge:
- Run the type checker
- Run the test suite
- If either fails, flag the specific failure and ask the user whether to keep or skip that agent's changes

**Direct mode:** After the user reviews the consolidated assessment, implement changes sequentially by agent in the recommended order. Between each agent's changes:
- Run the type checker and test suite
- If anything breaks, revert the specific change and flag it

### 4. Final verification

After all changes are applied, run the full build + test suite one final time. Report the final state: what changed, what was flagged for human review, and whether the project is green.

## Language adaptation

The 8 agents are defined by their mission, not their tools. The tools adapt to whatever ecosystem the project uses:

| Language | Dead code | Circular deps | Types | Error handling |
|----------|-----------|---------------|-------|----------------|
| TypeScript/JS | knip | madge | tsc strict mode | try/catch, .catch() |
| Rust | cargo-udeps, clippy | cargo dependency graph | compiler already strict | unwrap, expect, Result patterns |
| Python | vulture | import-linter | mypy/pyright | try/except, bare except |
| Go | staticcheck, go vet | internal import analysis | already typed, check interface{} | error != nil patterns, panic |

If the project uses a language not listed, agents should research the best available tools for that ecosystem before starting their analysis.

## Scope control

By default, the skill targets the entire source tree (minus exclusions). If the user wants to scope it narrower:

- "Clean up the auth module" → pass `--scope src/auth/` context to all agents
- "Just do agents 3 and 8" → dispatch only those two
- "Skip the type stuff" → omit agents 2 and 5

Respect what the user asks for. The full 8-agent sweep is the default, not a requirement.
