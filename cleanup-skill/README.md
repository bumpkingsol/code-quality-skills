# Dead Code Removal Skill

A Claude Code skill that finds and removes dead, unused code from any codebase. Conservative by design — it proves code is unused before touching it, and always asks before removing.

## What it does

Detects and removes:
- Unused functions and methods
- Unused imports and includes
- Unused variables and constants
- Unreachable code (after returns, inside dead branches)
- Unused files (nothing imports them)
- Commented-out code blocks (unless documented intent exists)

## How it works

The skill runs in 5 phases:

1. **Build context** — Reads project docs (README, CLAUDE.md, architecture files) to build a "protected list" of code that has documented intent. Checks what compiler/linter tools are available. This protected list overrides all later detection.

2. **Detect candidates** — Uses the best available method:
   - **Compiler/linter output** (preferred) — `tsc`, `eslint`, `pyflakes`, `cargo check`, `go vet`, etc. already know what's unused
   - **Grep-based analysis** (fallback) — systematic file-by-file reference counting when no tools are available
   - **LSP references** — used as a verification accelerator when available
   - Git history is used to prioritize where to look first (older, untouched files are more suspect)

3. **Verify each candidate** — 8-point conservative checklist. If any check fails (mentioned in docs, could be dynamically referenced, is a public API, is framework-invoked, has a TODO nearby, etc.), the candidate is downgraded to "flagged for review" instead of "confirmed dead."

4. **Report and wait** — Shows two lists: confirmed dead (safe to remove) and flagged for review (needs your judgment). Nothing is removed until you say so.

5. **Clean removal** — Removes in small batches of 3-5, verifies the build after each batch. Checks for cascade effects (removing function A may make function B dead). Runs tests at the end.

## Three operating modes

- **Quick sweep** — Compiler-flagged dead code only. Fast and safe.
- **Deep sweep** — Full documentation review, multi-tool detection, cascade analysis. Default for "find all dead code."
- **Scoped analysis** — Single file or directory, but docs are still checked repo-wide.

## Key design decisions

- **Markdown-first**: Documentation is read before any code analysis. If a function is mentioned in a roadmap as planned for future use, it won't be flagged — even if it has zero references today.
- **Conservative gate**: Would rather miss dead code than remove something that's actually needed. Ambiguous = keep it.
- **Batched removal**: Removes 3-5 items at a time and verifies the build between batches. If something breaks, it's easy to identify which removal caused it.
- **Framework-aware**: Understands that route handlers, lifecycle hooks, page components, test fixtures, and decorator targets are called by the framework — not by your code.

## Installation

### Claude Code CLI

```bash
claude install-skill /path/to/dead-code-removal.skill
```

Or copy the `SKILL.md` file into your Claude Code skills directory:

```bash
cp SKILL.md ~/.claude/skills/dead-code-removal/SKILL.md
```

### Manual

Place `SKILL.md` in `~/.claude/skills/dead-code-removal/` and it will be available in your next Claude Code session.

## Usage

Just ask naturally in any project:

- "Find dead code in this project"
- "Clean up unused imports"
- "Are there any unused functions in this file?"
- "Do a deep sweep of the codebase"
- "Remove unused code from src/utils/"

The skill triggers automatically based on your request.

## Supported languages

Works with any language. Has specific compiler/linter integration for:
- TypeScript / JavaScript (tsc, ESLint)
- Python (pyflakes, vulture)
- Rust (cargo check)
- Go (go vet)
- Swift (Xcode build warnings)

Falls back to grep-based analysis for all other languages.

## License

MIT
