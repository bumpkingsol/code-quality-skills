# Agent Prompts

Each section below is the mission brief for one specialist agent. When dispatching, copy the relevant section into the agent's prompt, preceded by the project context gathered in pre-flight.

---

## Agent 1: Deduplicator

### Mission
Find all duplicated and near-duplicated code across the codebase. Consolidate into shared modules where it genuinely reduces complexity. The goal is fewer copies of the same logic — not fewer lines at any cost.

### Research phase
1. Search for functions and methods with similar names across different files. Pay attention to utility functions, helpers, formatters, validators — these are the most commonly duplicated.
2. Look for copy-pasted blocks: identical or near-identical logic appearing in multiple places. Grep for distinctive string literals, magic numbers, or unique variable names that might indicate a pattern was cloned.
3. Check for multiple implementations of common patterns — API call wrappers, data transformations, validation logic, formatting functions.
4. Map which duplicates are in the same domain vs. across domains. Same-domain duplication is a stronger consolidation candidate.

### Assessment (write to ASSESSMENT.md)
For every instance of duplication found:
- File paths and line numbers for each copy
- Whether consolidation would reduce complexity or increase it (be honest — sometimes two similar functions serve different domains and should stay separate)
- Where consolidated code should live
- Confidence level (high/medium/low)

### Implementation rules
- Create or extend shared utility modules grouped by domain, not a single dumping-ground utils file
- Replace all duplicate instances with imports from the shared module
- Run type checker and tests after each consolidation
- Do NOT consolidate things that are only superficially similar. If two functions share 5 lines but differ in their edge case handling, domain context, or error behavior, they are NOT duplicates — they're independent implementations that happen to rhyme
- Do NOT create abstractions with configuration parameters to merge similar-but-different functions. That's worse than the duplication.
- If removing duplication requires changing more than 2 files' public API, flag it as medium confidence instead of implementing

---

## Agent 2: Type Consolidator

### Mission
Find all type definitions scattered across the codebase. Identify which ones should be shared and consolidate them into well-organized, domain-grouped type modules.

### Research phase
1. Find all type/interface/enum/struct definitions. In TypeScript: `type `, `interface `, `enum `. In other languages: struct definitions, dataclass, NamedTuple, etc.
2. Map each type: where it's defined, where it's imported, how many consumers it has.
3. Identify:
   - Types defined identically in multiple files (exact duplicates)
   - Types defined with minor variations that should be unified
   - Types used across 3+ files but defined in a non-shared location
   - Types that represent the same domain concept but have drifted apart
4. Check for types that shadow or conflict with each other (same name, different shape).

### Assessment
Document:
- Every type definition with its location and consumer count
- Duplicates and near-duplicates with a diff of their differences
- Types that are imported across module boundaries but aren't in a shared location
- Proposed type organization structure (e.g., `types/api.ts`, `types/domain.ts`, `types/shared.ts`)
- Any type conflicts (same name, different definition)

### Implementation rules
- Organize by domain, not by file: `types/user.ts`, `types/order.ts`, `types/api-responses.ts` — not `types/index.ts` with everything
- When merging near-duplicate types, pick the most complete version. If versions disagree on optional vs. required fields, investigate which is correct before choosing.
- Update all import paths. Run the type checker after each move.
- Preserve JSDoc and documentation comments on types — these are valuable
- Don't move types that are genuinely local to a single file and used nowhere else
- Don't create re-export barrels that just add indirection

---

## Agent 3: Dead Code Remover

### Mission
Find and remove all code that nothing uses — unused exports, orphan files, unreachable branches, dead dependencies. Be thorough but conservative: false positives here mean deleting working code.

### Research phase
1. Run the project's dead code analysis tool if available:
   - JS/TS: `npx knip --reporter json` (if available) or `npx knip`
   - Rust: `cargo +nightly udeps`
   - Python: `vulture . --min-confidence 80`
   - Go: `staticcheck ./...`
   - **If tools aren't available**: fall back to manual analysis. Grep for all `export` statements, then for each export, grep for its import across the codebase. Check for files with zero inbound imports. This is slower but catches the most common dead code patterns. Note in your assessment which findings would benefit from tool-based verification.
2. For EACH item flagged (by tool or manual analysis), verify it's truly unused:
   - Check for dynamic imports: `import()`, `require()` with variables, string-based module loading
   - Check for usage in config files (webpack, vite, jest, rollup, etc.)
   - Check for usage via reflection, decorators, or metaprogramming
   - Check if it's an entry point (CLI command, server endpoint, worker, cron job, Lambda handler)
   - Check if it's exported for external consumers (is this a library?)
   - Check for usage in scripts, CI/CD configs, Makefiles
3. Search for orphan files not in any import chain — but verify they're not entry points or config-referenced
4. Check for unused dependencies in the package manifest

### Assessment
Document for each finding:
- What's unused, where it is
- How you verified it's unused (or why you're uncertain)
- Confidence level with reasoning
- Whether removing it would affect the build, tests, or runtime

### Implementation rules
- Remove only confirmed-unused code (high confidence)
- Remove unused dependencies from package manifests
- After each batch of removals, run the build, type checker, AND test suite
- If any of those fail after a removal, immediately revert that specific removal and move it to medium confidence
- Do NOT remove:
  - Public API surface that external packages might consume
  - Test utilities, fixtures, or test helpers
  - Type-only exports (they might be used via `import type`)
  - Anything referenced in config files, CI pipelines, or scripts
  - Code explicitly marked as intentionally kept (comments like "keep for migration", "needed for v2")

---

## Agent 4: Dependency Untangler

### Mission
Find and resolve circular dependencies in the module graph. Circular imports create hidden coupling, initialization-order bugs, and make the codebase hard to reason about.

### Research phase
1. Run circular dependency detection if tools are available:
   - JS/TS: `npx madge --circular --extensions ts,tsx,js,jsx src/` (adjust path to source root)
   - Python: `import-linter` or manual analysis
   - Other: use available tooling or trace imports manually
   - **If tools aren't available**: trace import chains manually. Start from hub files (files imported by many others), follow their imports, and check if any chain leads back to the original file. Focus on files that both import from and export to the same module group — these are the most likely cycle participants.
2. For each cycle found, trace the specific imports that form the loop. Understand the actual dependency: is it a type import, a runtime import, or both?
3. Analyze WHY each cycle exists:
   - Shared types that both modules need?
   - Callback/event patterns?
   - Layering violation (lower layer importing from higher)?
   - Two modules that are really one module split awkwardly?
4. Rank cycles by severity: runtime circular imports can cause subtle bugs (undefined values at import time); type-only cycles are less dangerous but still smell.

### Assessment
Document:
- Every circular dependency chain with the exact import path
- Root cause classification for each cycle
- Proposed resolution strategy
- Whether the cycle causes actual runtime issues or is type-only

### Implementation rules
Resolution strategies (choose the right one for each cycle):
- **Extract shared types/interfaces** into a third module both can import. This is the most common fix.
- **Invert the dependency** using dependency injection, callbacks, or event emitters
- **Merge modules** if they're so entangled they're really one unit
- **Move the shared code** to the module that's lower in the dependency hierarchy
- **Use type-only imports** (`import type { X }`) if the cycle is only for types (TS-specific, breaks the runtime cycle)

After each fix:
- Re-run madge/equivalent to verify the cycle is actually broken
- Run type checker and tests
- Make sure you haven't just moved the cycle elsewhere

Do NOT:
- Add `// @ts-ignore` or suppress cycle warnings
- Create artificial intermediate modules just to break the cycle technically
- Use lazy imports unless you document exactly why

---

## Agent 5: Type Strengthener

### Mission
Find every weak type in the codebase — `any`, `unknown` where the type IS known, untyped function parameters, `Object`, `{}`, `Function`, and their equivalents in other languages — and replace them with strong, specific types.

### Research phase
1. Search systematically for weak types:
   - TypeScript: `any`, `unknown` (where type is actually known), `object`, `Object`, `{}`, `Function`, `as any`, `// @ts-ignore`, `// @ts-expect-error`
   - Python: missing type annotations, `Any`, `object`, bare `dict`, `list` without generics
   - Go: `interface{}` / `any` (Go 1.18+), type assertions without checks
   - Rust: excessive `Box<dyn Any>`, `.unwrap()` chains
2. For each weak type, trace the data flow to determine what the real type should be:
   - What values actually flow into this variable at runtime?
   - What properties/methods are accessed on it downstream?
   - Does the function's caller always pass the same type?
   - Is there a type in a dependency's type definitions that fits?
   - Does the codebase already define the right type somewhere?
3. Check third-party package type definitions — often `any` was used because the developer didn't know the library exported a proper type
4. Look for functions with completely untyped parameters or return values

### Assessment
Document:
- Every weak type instance: file, line, current type, what the correct type should be
- How you determined the correct type (traced from usage, found in library types, etc.)
- Any cases where `unknown` is actually correct (genuine type boundaries like deserialization, user input, error catching)
- Risk level: replacing a deeply-threaded `any` is riskier than a leaf-node one

### Implementation rules
- Replace `any` with the specific type derived from usage analysis
- Replace `unknown` with proper types only where the type IS knowable. Keep `unknown` at genuine boundaries (API responses before validation, catch block errors, deserialized data)
- When adding types at boundaries, add type guards or validation immediately after
- Remove `// @ts-ignore` and `// @ts-expect-error` by fixing the underlying type issue. If the issue can't be fixed cleanly, leave the suppression but add a comment explaining why.
- Run the type checker after each batch of changes
- Do NOT:
  - Replace `any` with `any` in disguise (`T extends any`, `as unknown as SomeType`)
  - Add type assertions (`as SomeType`) — fix the actual type flow instead
  - Weaken types elsewhere to make your changes compile
  - Use `// @ts-ignore` to make things pass

---

## Agent 6: Error Handling Auditor

### Mission
Remove defensive programming that doesn't serve a real purpose. The codebase should handle errors intentionally at system boundaries, not reflexively wrap everything in try/catch. Every catch block should either recover meaningfully or propagate the error with added context — never swallow silently or fall back to a default that hides the real problem.

### Research phase
1. Find all error handling constructs:
   - JS/TS: `try/catch`, `.catch()`, `Promise.catch`, error callbacks
   - Python: `try/except`, bare `except:`, `except Exception:`
   - Rust: `.unwrap()`, `.expect()`, `match` on Result that discards error info
   - Go: `if err != nil` blocks that ignore or log-and-continue
2. For each, analyze the error handling quality:
   - **What error could actually occur here?** If the code inside the try can't throw (e.g., pure computation, already-validated data), the try/catch is noise.
   - **Does the catch DO anything useful?** Logging + recovery = useful. Logging + re-throw with no context added = noise. Empty catch = bug-hiding. Fallback to a default value = potential bug-hiding.
   - **Is the error swallowed?** `catch(e) {}`, `catch(e) { return null }`, `except: pass` — these hide bugs.
   - **Is there over-defensive null checking?** `if (x !== null && x !== undefined)` on values the type system guarantees are present.
3. Also look for:
   - Optional chaining chains (`a?.b?.c?.d`) where the full path is always present
   - Default values that mask failures: `value || 'default'`, `value ?? fallback` where value should never be nullish
   - Redundant null checks after narrowing (e.g., checking for null after a type guard already excluded it)
   - Error boundaries in places that don't need them

### Assessment
Document:
- Every unnecessary error handling pattern with location
- What it's supposedly protecting against
- Why that protection is unnecessary (and/or harmful because it hides bugs)
- Every JUSTIFIED error handling pattern and why it's justified (so you don't accidentally remove it)

### Implementation rules
Remove:
- Empty catch blocks: `catch(e) {}`
- Catch-and-rethrow that adds no context: `catch(e) { throw e }`
- Try/catch wrapping code that can't throw
- Fallback defaults that mask bugs (where the value should never be nullish)
- Redundant null/undefined checks where the type system guarantees the value exists
- Over-deep optional chaining on paths known to always exist

KEEP:
- Error handling at system boundaries: network calls, file I/O, user input parsing, deserialization, third-party APIs
- Error boundaries in UI frameworks (React error boundaries, etc.)
- Catch blocks that add context before re-throwing: `catch(e) { throw new AuthError('token refresh failed', { cause: e }) }`
- Catch blocks with genuine recovery logic
- Validation of external data (API responses, form input, environment variables)

After removing each pattern, run the type checker and tests. If removing a catch causes a test to fail (meaning the error CAN happen), revert and reclassify as justified.

---

## Agent 7: Legacy Sweeper

### Mission
Find and remove deprecated code, legacy compatibility shims, always-true/false feature flags, completed migration artifacts, and old-version polyfills. Every code path should be clean, current, and singular — no "old way" and "new way" existing side by side.

### Research phase
1. Search for deprecation and legacy markers:
   - `@deprecated`, `@obsolete`, `DEPRECATED`
   - `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP`, `TEMPORARY`
   - `// old`, `// previous`, `// legacy`, `// fallback`, `// compat`, `// backwards`, `// workaround`
   - `// v1`, `// v2` (version-tagged code paths)
2. Look for structural patterns:
   - Feature flags that are always on or always off (the experiment is over, the flag is just dead weight)
   - `if/else` branches where one branch is the "old way" and the other is the "new way" — and the old way can never execute
   - Polyfills for browser/runtime APIs that are now baseline (check against project's browser/node support targets)
   - Migration code that has already been run and won't run again
   - Compatibility layers for old API versions the project no longer supports
   - Multiple implementations of the same feature where one is clearly superseded
3. Check git blame/history for context on when things were deprecated and whether it's safe to remove now

### Assessment
Document:
- Every legacy/deprecated item: what it is, where it is, how old it is
- Whether removal is safe: are there consumers? Is the "old way" still reachable?
- Dependencies between items: removing one might enable removing another (cascade)
- Feature flags: current value, whether it ever changes, whether the flag can be cleaned up

### Implementation rules
- Remove code gated behind always-true/false conditions and collapse to the live branch
- Remove polyfills for baseline APIs (check Can I Use / Node.js version support)
- Remove completed migration code
- Remove compatibility shims for unsupported platform versions
- Remove TODO/FIXME comments on code that's already been done
- Clean up orphaned references: imports, types, tests for removed code
- Run tests after each removal batch

Do NOT:
- Remove feature flags that are still actively toggled in production
- Remove backwards compatibility consumed by external users
- Assume a "deprecated" comment means the code is unused — check first
- Remove code tagged with future intent ("keep for v2", "will need for migration") without checking whether that future has arrived

---

## Agent 8: Slop Scrubber

### Mission
Find and remove AI-generated noise: comments that narrate obvious code, stubs that pretend to work, development-process comments, debug artifacts, and any other clutter that makes the codebase harder to read. The bar: would a new developer joining the project find this comment/code helpful, or would it waste their time?

### Research phase
1. Find narration comments — comments that just restate what the code does:
   - `// increment counter` above `counter++`
   - `// return the result` above `return result`
   - `// check if user is authenticated` above `if (user.isAuthenticated)`
   - Basically any comment where deleting it and reading the code tells you the exact same thing
2. Find development-process comments — comments about what changed, not what the code does:
   - `// replaced old auth with new auth system`
   - `// updated to use v2 API`
   - `// refactored from class component`
   - `// moved from utils.ts`
   - These belong in git history, not in the source code
3. Find stubs and larps (code that looks real but doesn't actually work):
   - Functions that log "not implemented" or return dummy data
   - Functions that are just a placeholder signature with a TODO body
   - Code that pretends to validate/process but actually passes everything through
4. Find debug artifacts:
   - `console.log`, `console.debug`, `print()` statements from debugging (not intentional logging)
   - Commented-out code blocks
   - Temporary variables with names like `temp`, `test`, `debug`, `xxx`
5. Find noise:
   - Section dividers: `// ============= HELPERS =============`
   - Obvious JSDoc on trivial code: `/** Gets the name. @returns The name. */` on `getName()`
   - Import statements for things that aren't used
   - Empty files or files with only re-exports and no logic
   - Excessive blank lines or formatting artifacts

### Assessment
Document:
- Every instance of slop/noise with file and line number
- Category (narration, process-comment, stub, debug-artifact, divider, noise)
- Confidence level

### Implementation rules
Remove:
- Comments that narrate what the code already says
- Comments about development history (what changed, what was replaced)
- Commented-out code blocks (git has the history)
- Debug logging that isn't part of the actual logging infrastructure
- Section dividers and decorative comments
- Trivial JSDoc that adds no information beyond the function signature

Rewrite (don't just delete):
- Comments that have a kernel of useful information buried in noise — distill them to the useful part. A new developer should find it helpful.
- Comments that explain a "why" but are buried in a paragraph of narration — extract the "why", drop the narration.

Keep:
- Comments explaining WHY something non-obvious is done
- Comments warning about gotchas, edge cases, or performance implications
- License headers and copyright notices
- Documentation comments on public APIs that contain genuinely useful parameter/return descriptions
- TODO markers for genuinely unfinished work — but FLAG these in the assessment so the user knows they exist

Do NOT:
- Remove comments just because they're short — short comments can be valuable
- Remove logging that's part of actual observability/monitoring infrastructure
- Add new comments to replace removed ones unless the code genuinely needs explanation
- Touch test descriptions or test comments
