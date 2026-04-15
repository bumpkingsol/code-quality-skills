# Slop Remover Skill

A Claude Code skill that deep-cleans codebases by dispatching 8 parallel specialist agents, each targeting one dimension of code rot. Especially effective after heavy AI-assisted development, large refactors, or when onboarding to a messy project.

## What it does

Dispatches 8 focused agents that research, assess, and fix:

| # | Agent | What it hunts |
|---|-------|--------------|
| 1 | Deduplicator | Copy-pasted logic, redundant utilities, DRY violations |
| 2 | Type Consolidator | Scattered/duplicate type definitions |
| 3 | Dead Code Remover | Unused exports, orphan files, unreachable code |
| 4 | Dependency Untangler | Circular imports, tangled module graphs |
| 5 | Type Strengthener | `any`, `unknown`, weak/untyped parameters |
| 6 | Error Handling Auditor | Pointless try/catch, error-swallowing, redundant guards |
| 7 | Legacy Sweeper | Deprecated APIs, dead feature flags, compat shims |
| 8 | Slop Scrubber | AI stubs, narration comments, debug artifacts, noise |

## How it works

1. **Pre-flight** — Detects the project language, framework, available tooling (knip, madge, etc.), and source root. Determines whether to use worktree isolation or direct mode.

2. **Parallel dispatch** — Spawns 8 subagents simultaneously using the Agent tool. Each agent does deep research on its domain across the entire codebase, writes a detailed assessment with every finding categorized by confidence level.

3. **Implementation** — Each agent implements high-confidence fixes automatically. Medium-confidence items are implemented only if verifiable (tests pass, types check). Low-confidence items are flagged for human review.

4. **Consolidation** — After all agents complete, the skill consolidates findings, detects conflicts between agents, and presents a summary with a recommended merge order.

5. **Verification** — Changes are merged one at a time with type checking and test runs between each merge. Any failures are flagged rather than force-resolved.

## Confidence levels

- **High** — Implement automatically. Exact duplicate functions, empty catch blocks, `// TODO` on finished code, `any` where the type is clearly derivable.
- **Medium** — Implement only if verifiable. Similar-but-not-identical functions, try/catch that probably can't throw.
- **Low** — Flag only. Code that looks unused but might be called dynamically, error handling around third-party APIs.

## Execution modes

- **Worktree mode** (preferred) — Each agent works in an isolated git worktree. Fully parallel, no conflicts.
- **Direct mode** (fallback) — When worktrees aren't available. Agents assess first, then changes are implemented sequentially.

## Scope control

Run all 8 agents or pick and choose:

- "Clean up this codebase" — full 8-agent sweep
- "Just run agents 3 and 8" — dead code + slop only
- "Clean up the auth module" — scoped to a directory
- "Skip the type stuff" — omit agents 2 and 5

## Supported languages

Works with any language. Has specific tooling integration for:
- **TypeScript/JavaScript** — knip, madge, tsc strict mode
- **Rust** — cargo-udeps, cargo clippy
- **Python** — vulture, import-linter, mypy/pyright
- **Go** — staticcheck, go vet

Falls back to grep-based manual analysis when specialized tools aren't available.

## Installation

### Claude Code CLI

Copy the skill directory into your Claude Code skills:

```bash
cp -r slop-remover-skill ~/.claude/skills/slop-remover
```

### Manual

Place `SKILL.md` and the `references/` directory in `~/.claude/skills/slop-remover/`:

```
~/.claude/skills/slop-remover/
  SKILL.md
  references/
    agent-prompts.md
```

## Usage

Just ask naturally in any project:

- "Run slop-remover on this codebase"
- "Clean up this project, it's gotten messy"
- "Remove dead code and AI slop"
- "Do a full code quality sweep"
- "Just run the error handling and type agents"

The skill triggers automatically based on your request.

## License

MIT
