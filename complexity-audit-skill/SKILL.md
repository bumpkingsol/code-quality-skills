---
name: complexity-audit
description: >
  Audits and identifies unnecessary complexity across frontend, API, backend, and database
  codebases, producing a prioritized report. Use when the user asks to "simplify",
  "find over-engineering", "do a complexity review", "is this over-engineered?", or
  "can we simplify this?". Works on any stack and is most useful on actively developed
  codebases where complexity accumulates as features are added.
---

# Complexity Audit

Audits a codebase layer by layer to find unnecessary complexity and produce a prioritized, actionable report. Complexity is anything that increases maintenance burden, cognitive load, or risk without proportional value.

## Severity Scale

Use this scale consistently so findings are comparable across any codebase:

| Severity | Meaning |
|----------|---------|
| **Critical** | Actively causing bugs, security vulnerabilities, or broken builds |
| **High** | Significant simplification possible; dead code, major duplication, real performance impact |
| **Medium** | Meaningful simplification available; over-engineering, unnecessary indirection |
| **Low** | Minor improvements; code smell, inconsistent naming, non-blocking polish |

A finding that could be fixed in minutes is Low/Medium. A finding that represents a weeks-long rewrite is High. Size the severity to the impact, not the effort.

---

## Audit Process

Run these phases in order. Don't skip phases even if you find obvious things early — thoroughness matters more than speed.

### Phase 1: Orient

First, understand what exists at a project level. Don't read deep into files yet.

1. **List all top-level directories** in the project root. Identify which layers are present (e.g., `mobile/`, `web/`, `api/`, `backend/`, `db/`, `functions/`).
2. **Identify stack and framework** for each layer (e.g., React Native, Next.js, Django, Supabase Edge Functions, FastAPI).
3. **Note the scale**: rough line counts, number of files, number of packages. A 50,000-line project needs deeper digging than a 5,000-line project.
4. **Find layer entry points**:
   - Frontend: `package.json` scripts, main route/screen files
   - Backend: API route directories, `src/routes/`, `functions/`
   - Database: `migrations/`, `schema.sql`, ORM model files

### Phase 2: Surface-Level Scans

Run these checks in parallel across all present layers. These are fast heuristics that surface most obvious complexity.

#### Dead / Unused Code

- **Unused files**: Components, utilities, types, or functions that are never imported anywhere.
- **Unused exports**: Functions or components exported but used nowhere in the codebase.
- **Commented-out code**: Large blocks of commented code representing abandoned implementations.
- **Unused dependencies**: Packages in `package.json` (or equivalent) that are never imported. Check with `grep -r "from 'package-name'"` across all source.

#### Duplication

- **Duplicate utility functions**: Same logic in multiple files (search for function name patterns like `format`, `parse`, `validate`, `build`).
- **Duplicate type definitions**: The same type defined in multiple places instead of shared.
- **Repeated UI patterns**: Components that are nearly identical and could share a base.
- **Repeated SQL patterns**: The same join or aggregation written in multiple queries.

#### Configuration Complexity

- **Zombie config**: Config files for tools or frameworks no longer used (e.g., Jest config in a Vitest-only project).
- **Duplicate config**: The same values duplicated across multiple files instead of centralized.
- **Excessive `.env` variables**: Variables defined but never referenced in code.
- **Overly complex build setups**: Bundlers with non-standard configurations adding overhead.

### Phase 3: Layer-Specific Deep Dives

After surface scans, go deeper in each layer present.

#### Frontend Audit (React Native / Next.js / Vue / Angular / etc.)

1. **File size**: List files by line count. Flag files over ~400 lines — look inside for multiple responsibilities that should be split.
2. **Component depth**: Identify deeply nested conditional rendering or excessive effect/useEffect chains — these signal state management problems.
3. **Prop drilling**: Search for components passing the same props through many intermediate layers.
4. **State management**: Identify stores with too many state slices or logic that should live closer to where it's used.
5. **Type complexity**: Flag TypeScript types with deeply nested generics or `as` casts that mask type mismatches.
6. **Error handling gaps**: Note `try/catch` blocks that silently swallow errors, or async operations without error handling.
7. **Missing boundaries**: Logic inside UI components that should be in a hook, utility, or service layer.

#### Backend / API Audit

1. **Endpoint inventory**: List all endpoints. Identify any with no incoming calls or that imply unused features.
2. **Request handling complexity**: Flag handlers with deeply nested conditionals, large switch statements, or functions doing too many things.
3. **Missing validation**: Handlers that accept user input without validating types or ranges.
4. **Repeated patterns**: Multiple functions doing the same auth check, schema validation, or response formatting — abstraction opportunity.
5. **Inconsistent return shapes**: Similar operations returning different response structures, forcing callers to handle too many cases.

#### Database Audit (Migrations / Schema)

1. **Table inventory**: List all tables. Flag any with no incoming foreign keys and no queries referencing them — may be orphaned.
2. **Column usage**: Check if schema columns are actually read/written in migrations or queries. Unused columns are common after feature changes.
3. **Index analysis**: Look for tables with no indexes on `WHERE`/`JOIN`/`ORDER BY` columns. Flag redundant indexes (e.g., `(a, b)` when `(a)` already covers queries).
4. **Migration sprawl**: Many small migrations doing similar things (e.g., ten migrations each adding one column) should be consolidated.
5. **Missing constraints**: Tables without `NOT NULL` where null is never semantically valid.

### Phase 4: Synthesis

After gathering findings across all layers:

1. **Group related findings**: If three findings are symptoms of the same root cause, describe the root cause once.
2. **Prioritize within each layer**: Sort findings Critical → Low.
3. **Identify the biggest wins**: Which 2-3 changes would eliminate the most complexity with the least risk?
4. **Flag dangerous simplifications**: Some changes require careful thought — flag where the "obvious" fix could break something or needs a migration.

---

## Output Location

Write the report to `.claude/audits/complexity-audit-YYYY-MM-DD.md` if the `.claude/` directory
exists, otherwise fall back to `complexity-audit.md` in the project root. If a previous audit
exists for the same date, suffix with `-2`, `-3`, etc. (e.g.,
`complexity-audit-2026-04-25-2.md`).

## Output Format

ALWAYS write the report (to the path above) using this structure:

```
# Complexity Audit Report

## Summary
[2-3 sentence overview. What's good, what's not.]

## By Layer

### [Frontend / Web / Mobile]
[Findings with file paths, severity, explanation, recommendation]

### [Backend / API]
[...]

### [Database]
[...]

## Quick Wins
[Top 3-5 changes with most value for least effort]

## Dangerous Simplifications
[Any changes needing careful thought before proceeding]
```

**For each finding, use this template:**
```
**[SEVERITY] Short descriptive title**
- **File(s)**: `path/to/file`
- **What**: [Specific issue]
- **Why it matters**: [Impact on maintainability, performance, or correctness]
- **Fix**: [Concrete recommendation]
```

---

## Principles

**Be specific.** "This file is complex" is useless. "This component mixes data fetching, business logic, and rendering across 600 lines — split into a hook and a presentation component" is useful.

**Size severity to impact, not effort.** A 5-line file that is a massive footgun is Critical. A 2000-line utility library that works and rarely changes is Low.

**Distinguish necessary complexity from unnecessary.** Some abstractions exist because requirements are genuinely complex. Don't flag the complex parts — flag the unnecessary parts.

**Context matters.** A pattern that's fine in a 5-file project is a problem in a 200-file project. Adjust your threshold based on scale.

**Recommend before you report.** If you see a complex situation, also sketch the simpler version. Don't just describe the wound — show the bandage.
