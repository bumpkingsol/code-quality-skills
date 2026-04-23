# Complexity Audit Skill

A Claude Code skill that audits codebases for unnecessary complexity and produces a prioritized, actionable report.

## What it does

Traces through frontend, backend/API, and database layers to find:
- **Oversized files** — screens, services, and stores that are doing too many things
- **Dead and unused code** — exports, imports, and files no longer referenced
- **Duplication** — repeated logic across utilities, components, and queries
- **Over-engineering** — unnecessary abstractions, indirection, and complexity
- **Schema drift** — database types that have diverged between layers
- **Zombie config** — old config files for tools no longer in use
- **State management problems** — stores absorbing side effects, prop drilling

## How it works

The skill runs in 4 phases:

1. **Orient** — Maps the project structure, identifies layers and scale
2. **Surface scans** — Fast heuristics: unused code, duplication, config complexity
3. **Deep dive** — Layer-specific: file sizes, state management, endpoint complexity, schema usage
4. **Synthesis** — Groups findings by root cause, prioritizes, flags dangerous simplifications

Output is a structured report with severity ratings (Critical → Low) and concrete fix recommendations.

## Severity scale

| Level | Meaning |
|-------|---------|
| Critical | Causing bugs, security issues, or broken builds |
| High | Major duplication, dead code, real performance impact |
| Medium | Over-engineering, unnecessary indirection |
| Low | Code smell, polish, non-blocking improvements |

## Installation

### Claude Code CLI

```bash
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/complexity-audit-skill/complexity-audit.skill
```

Or clone and install locally:

```bash
git clone https://github.com/bumpkingsol/code-quality-skills.git
cd code-quality-skills
claude install-skill complexity-audit-skill/complexity-audit.skill
```

### Manual

Copy `SKILL.md` into your skills directory:

```bash
cp SKILL.md ~/.claude/skills/complexity-audit/SKILL.md
```

## Usage

Just ask naturally in any project:

- "Audit this codebase for complexity"
- "Find unnecessary complexity in the frontend"
- "Is this file too large?"
- "Can we simplify the API layer?"
- "Do we have schema drift between mobile and web?"
- "Find files doing too many things"

The skill triggers automatically based on your request.

## Supported stacks

Works with any stack. Has specific audit guidance for:
- React Native / Expo
- Next.js (App Router and Pages Router)
- Supabase Edge Functions
- PostgreSQL migrations
- Zustand, Redux, React Query
- NativeWind / Tailwind CSS
- General TypeScript/JavaScript

## Example findings

Real patterns this skill has flagged in production codebases:

- **God files** — 2,400-line admin action files with 50 unrelated functions that should be split by domain
- **Oversized screens** — 1,100-line screen files mixing data fetching, business logic, and rendering
- **Stores absorbing side effects** — Zustand stores that also initialize biometrics, widgets, and notifications
- **Duplicate generated types** — `database.types.ts` files in mobile and web pointing to different schema snapshots
- **Migration sprawl** — 19 sequential migrations that could be consolidated into one
- **Shared utilities with computation** — `_shared/` folders containing computation logic instead of just utilities

## License

MIT
