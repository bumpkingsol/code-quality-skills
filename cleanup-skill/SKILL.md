---
name: dead-code-removal
description: Finds and removes dead, unused code from any codebase. Use when the user asks to "clean up unused code", "find dead code", "remove unused imports", "unreachable code", or wants to prune a codebase. Also trigger on "dead code", "unused functions", or scoped requests like "are there unused functions in this file?".
---

# Dead Code Removal

A conservative, evidence-based approach to finding and removing dead code. The core principle: **never remove code that might be intentionally kept**. When evidence is ambiguous, keep the code and flag it for human review.

## What counts as dead code

- Unused functions and methods — defined but never called
- Unused imports and includes — imported but never referenced
- Unused variables and constants — declared but never read
- Unreachable code — after unconditional returns, inside impossible branches
- Unused files — source files nothing imports or references
- Commented-out code blocks — unless documented intent exists to uncomment them

## What is NOT dead code

Even if something has zero grep hits, it may still be alive:

- Code referenced in Markdown files (README, CLAUDE.md, architecture docs, plans) as planned or intended for future use
- Code with nearby `TODO`, `FIXME`, or comments indicating future use (e.g., "will need this for v2", "keep for migration")
- Public API surface consumed by external packages or users
- Code used via reflection, dynamic dispatch, string-based lookups, decorators, or metaprogramming
- Framework-invoked code: route handlers, lifecycle hooks, pages/ directory components, event listeners, serialization classes, test fixtures
- Entry points: main functions, CLI handlers, bin scripts

Understanding why something looks unused but isn't is just as important as finding what's truly dead. Many false positives come from framework magic and dynamic references — always consider how the runtime actually discovers and calls code, not just what static text search reveals.

---

## Choosing your mode

Before starting, decide which mode fits the request:

**Quick sweep** — The user wants obvious wins: unused imports, compiler-flagged dead code, clearly orphaned files. Use compiler/linter output as your only source. Skip deep grep verification. Fast, safe, minimal.

**Deep sweep** — The user wants a thorough audit. Full documentation review, multi-tool detection, verification gate, cascade analysis. This is the default for "find all dead code" or "clean up this codebase."

**Scoped analysis** — The user points at a specific file, directory, or module. Analyze only that scope but still check documentation repo-wide (intent can be documented anywhere).

---

## Phase 1: Build context

This phase determines what's protected and what tools you have. Skipping it leads to false positives — removing code that someone documented intent to keep is worse than missing dead code.

### Check available tooling first

Before planning your detection strategy, verify what's actually installed. Run quick checks:

```bash
# Check what's available (run whichever are relevant to the stack)
which tsc 2>/dev/null && echo "tsc available"
which eslint 2>/dev/null && echo "eslint available"
which pyflakes 2>/dev/null && echo "pyflakes available"
which vulture 2>/dev/null && echo "vulture available"
which cargo 2>/dev/null && echo "cargo available"
which go 2>/dev/null && echo "go available"
```

Record what's available. Your detection strategy in Phase 2 depends on this — if compiler/linter tools exist, they become your primary candidate source. If nothing is available, you fall back to grep-based analysis (slower, more manual).

### Read project configuration

Check for `package.json`, `tsconfig.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `Gemfile`, `.csproj`, or equivalent. Extract:
- **Entry points** — `main`, `bin`, `scripts`, `exports` fields. These are alive by definition.
- **Framework** — Next.js, Rails, Django, Expo, etc. each have conventions for how code gets invoked without explicit imports. Know these before flagging anything.
- **Test configuration** — test files, fixtures, and helpers are alive even if nothing outside the test directory imports them.

### Read priority Markdown files

Don't try to read every `.md` file upfront. Start with the ones most likely to contain intent:

1. **Always read**: `README.md`, `CLAUDE.md`, `AGENTS.md`, any file with "architecture" or "design" in the name
2. **Read if they exist**: files matching `**/ROADMAP.md`, `**/TODO.md`, `**/PLAN*.md`, `**/MIGRATION*.md`, `**/CHANGELOG.md`
3. **Scan names of remaining `.md` files** via `Glob: **/*.md` — read any whose names suggest they might contain code intent (e.g., `api-design.md`, `v2-plan.md`)

Build a **protected list** — any code artifact (function, file, module, variable) mentioned in documentation as planned, intended, or deliberately kept. This list overrides dead code detection in all later phases.

If a specific candidate is ambiguous later (Phase 3), come back and read additional `.md` files at that point. This avoids consuming your working memory on docs upfront.

---

## Phase 2: Detect candidates

The goal is to generate a list of suspects efficiently. How you do this depends on what tools are available.

### Path A: Compiler/linter-driven detection (preferred)

If language-specific tools are available, use them as your primary candidate source. They already understand scope, types, and language semantics — far more reliable than grep.

| Stack | Command | What it finds |
|-------|---------|---------------|
| TypeScript/JS | `tsc --noUnusedLocals --noUnusedParameters --noEmit 2>&1` | Unused variables, parameters, imports |
| TypeScript/JS | `npx eslint --rule '{"no-unused-vars": "warn", "@typescript-eslint/no-unused-vars": "warn"}' --no-eslintrc .` | Unused variables (broader) |
| Python | `pyflakes .` or `vulture .` | Unused imports, variables, functions, classes |
| Rust | `cargo check 2>&1 \| grep "warning.*dead_code\|warning.*unused"` | Dead code, unused imports/variables |
| Go | `go vet ./... 2>&1` | Unused variables (imports are compiler errors) |
| Swift | `xcodebuild 2>&1 \| grep "warning.*unused\|warning.*never"` | Unused variables, unreachable code |

Parse the output into a candidate list. These candidates have high initial confidence because the compiler identified them. They still need verification in Phase 3 (a compiler doesn't know about your Markdown docs or planned intent).

### Path B: Grep-based detection (fallback)

When no compiler/linter tools are available, or for finding things compilers miss (unused files, unused exports, commented-out code), use this approach. Work systematically — don't try to analyze the whole codebase at once.

**Step 1: Use git history to prioritize where to look**

```bash
git log --diff-filter=M --name-only --since="6 months ago" --pretty=format:""
```

Files NOT in this list haven't been touched recently — start there. Old, untouched files are more likely to contain accumulated dead code. But remember: old code that's stable and referenced is alive. This is triage, not verdict.

**Step 2: Work file by file, starting with the oldest untouched files**

For each file, read it and identify exported/public symbols. Then grep for each symbol across the repo:

```
Grep: pattern="symbolName" (search the entire repo, not just the current file)
```

If a symbol appears only at its definition site, it's a candidate. Search with multiple patterns — bare name, potential aliases, string interpolations.

**Step 3: Find orphan files**

For each source file, check if anything imports it:

```
Grep: pattern="from.*filename|import.*filename|require.*filename"
```

A file with zero inbound imports that isn't an entry point, route handler, or config file is a strong candidate.

**Step 4: Find commented-out code**

Look for multi-line comment blocks that contain code syntax (function definitions, variable assignments, control flow). Distinguish from documentation comments — you want blocks that look like they were once live code.

### Path C: LSP-assisted detection (when available)

If LSP is working, use `find references` to verify candidates from Path A or B. LSP understands namespacing, overloading, and type-level references that grep cannot. Zero references (excluding definition) = strong candidate.

Treat LSP as a verification accelerator, not a primary detection method — it's most useful for confirming that a specific symbol is unused, not for scanning an entire codebase.

### For large codebases: parallelize with subagents

If the project has multiple independent modules or packages, dispatch one subagent per module to run detection in parallel. Each subagent should:
- Receive the protected list from Phase 1
- Run detection within its module
- Search the FULL repo (not just its module) when verifying candidates — something may be imported by a sibling module
- Return its candidate list

Merge the candidate lists and proceed to Phase 3.

---

## Phase 3: Verify each candidate

This is the conservative gate. For each candidate, walk through this checklist. If ANY check fails, move the candidate from "confirmed dead" to "flagged for review."

1. **Zero references confirmed** — Grep with multiple patterns returns zero hits outside the definition. For common names (e.g., `init`, `handle`, `process`), also try qualified patterns like `ClassName.methodName` to avoid false matches.
2. **Not in the Markdown protected list** — No documentation mentions intent to use it. If unsure, this is the moment to read additional `.md` files you skipped in Phase 1.
3. **Not a public export** — Not exported from a package boundary that external consumers could depend on. Check `package.json` `exports` field, `__init__.py` `__all__`, or equivalent.
4. **Not dynamically referenced** — Search for dynamic access patterns in the codebase:
   - JavaScript/TypeScript: bracket notation `obj["name"]`, `Object.keys`, spread patterns
   - Python: `getattr()`, `__dict__`, `globals()`, string formatting with function names
   - General: config files, mapping objects, registries that reference symbols by string
5. **Not an entry point or framework-invoked** — Not in route definitions, lifecycle hooks, pages/ directories, event handlers, test fixtures, serialization classes, decorator targets, CLI command registrations.
6. **No intent comments nearby** — No TODO, FIXME, "keep", "needed for", "will use", or similar language within 5 lines of the definition.
7. **Not an interface/protocol requirement** — Not a method required by a contract even if the body is never called directly.
8. **Not a type-only export** — Not used in `.d.ts` files or by downstream TypeScript consumers.

### Track dependencies during verification

As you verify each candidate, note what it calls or imports. For example, if dead function `processLegacy()` is the only caller of helper `formatLegacyDate()`, record that relationship. You'll need it for cascade detection in Phase 5.

---

## Phase 4: Report before removing

Present findings organized by confidence level. Do not remove anything until the user confirms.

Start with a summary count, then the details:

```
## Dead Code Summary

Found **12 confirmed dead** items and **3 flagged for review** across 8 files.

### Confirmed dead (will remove on your go-ahead)

**Unused files (2):**
- `src/api/v1.ts` — nothing imports it, not a route, not in any plan
- `src/utils/legacy-helpers.ts` — zero inbound imports, no docs reference

**Unused functions (5):**
- `src/utils/format.ts`: `formatOldDate()` — 0 references, no docs mention it
- `src/services/auth.ts`: `validateLegacyToken()` — 0 references, removed from routes 8 months ago
- ...

**Unused imports (3):**
- `src/components/Dashboard.tsx`: `import { OldChart } from './charts'` — OldChart never used in file
- ...

**Commented-out code (2):**
- `src/components/Modal.tsx` lines 45-52 — commented-out JSX, no associated TODO or explanation
- ...

### Flagged for review (will NOT remove without explicit approval)
- `src/lib/crypto.ts`: `hashWithSalt()` — 0 grep hits, BUT mentioned in ARCHITECTURE.md migration plan
- `src/utils/index.ts`: export `parseConfig` — unused internally, but it's a public export
- `src/hooks/useAnalytics.ts`: `trackLegacyEvent()` — 0 direct references, but analytics SDK may call it via string registration
```

Wait for the user. "Go ahead" means remove confirmed-dead items only. Flagged items require explicit per-item approval.

---

## Phase 5: Remove cleanly

### Remove in small batches

Don't remove everything at once. Group related items into batches of 3-5 (e.g., a dead file and its exclusively-used helpers). After each batch:

1. **Remove the dead code** — delete functions, imports, variables, or entire files
2. **Cascade check** — using the dependency notes from Phase 3, check anything that was exclusively called by what you just removed. If helper `formatLegacyDate()` was only used by the dead function `processLegacy()` you just removed, `formatLegacyDate()` is now dead too. Add it to the next batch.
3. **Clean up empty containers** — if a file, class, or module is now empty after removals, remove it too
4. **Fix formatting** — remove leftover blank lines, trailing commas, etc.
5. **Verify the build** — run the project's build command

```bash
# Run whichever applies
npm run build    # or tsc --noEmit
cargo build
go build ./...
python -m py_compile <changed-files>
```

If the build fails, the last batch contained something that was actually used. Revert that batch, bisect it (try removing half), and identify which specific item caused the failure. Move it to "flagged for review."

Only proceed to the next batch after the build is green.

### After all batches: run tests

Once all removals are complete and the build passes:

```bash
# Run whichever applies
npm test
cargo test
pytest
go test ./...
```

If tests fail, identify which removal caused it (check git diff against test errors), revert that specific change, and flag it for review.

### Report what was done

After everything is clean:

```
## Removal Complete

Removed 12 items across 8 files:
- Deleted 2 files entirely
- Removed 5 unused functions
- Cleaned 3 unused imports
- Removed 2 commented-out code blocks
- 1 cascade removal found and cleaned (formatLegacyDate was only used by removed processLegacy)

Build: passing
Tests: passing (or: no test suite found)
```

---

## Scope control

- **Single file/directory request** — scope code analysis there, but still check documentation repo-wide. Intent documentation can live anywhere.
- **Full codebase sweep** — work systematically, prioritized by impact:
  1. **Unused files** — biggest wins. An entire file with zero inbound imports is a large chunk of dead weight.
  2. **Unused exports** — functions/classes exported but never imported anywhere.
  3. **Unused internal functions** — defined and never called within their module or anywhere else.
  4. **Unused variables and constants** — smallest individual impact but often most numerous.
  5. **Unused imports** — low impact per item but quick to verify and clean.
  6. **Commented-out code** — last priority since it has zero runtime cost, but still clutter.
  Within each tier, start with files that git history shows haven't been touched the longest.
- **Monorepos** — a function "unused" in one package may be imported by a sibling package. Always search the entire repository, not just the current package directory.

## Edge cases to watch for

- **Dynamic imports** — `import()`, `require()` with variables, `importlib.import_module()` won't appear in static grep. Check for dynamic import patterns before declaring a module unused.
- **String-registered code** — dependency injection containers, plugin registries, service locators. A class registered via a container is not dead even if it has no direct import.
- **Build-time code** — Webpack loaders, Babel plugins, PostCSS configs reference files that may look unused to grep.
- **Conditional compilation** — `#ifdef`, feature flags, environment-gated code. Something disabled in dev may be active in production.
- **Re-exports** — `export { foo } from './bar'` chains can make intermediate modules look unused when they're actually the public API surface.
- **Monorepo cross-references** — always search the full repo, not just the current package. A function may be unused locally but imported by a sibling.
