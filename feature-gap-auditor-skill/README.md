# Feature Gap Auditor

An agent skill that performs deep audits of a specific feature, capability, screen, workflow, or user promise to find gaps between what the feature appears to offer and what it actually delivers.

## What it does

Focuses on one named feature instead of sweeping the whole product. It traces the real user path and reports where the feature promise breaks, even when the code compiles and local functions look reasonable.

- Defines the user-facing feature contract before implementation details.
- Traces entry points, UI state, stores, services, API calls, persistence, and recovery paths.
- Finds invalid product logic, stale state, missing personalization, integration gaps, failure traps, and weak observability.
- Produces a structured `feature-gap-audit-[feature-slug].md` report with severity-classified findings.

## Install

### Claude Code CLI

```bash
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/feature-gap-auditor-skill/feature-gap-auditor.skill
```

Or clone and install locally:

```bash
git clone https://github.com/bumpkingsol/code-quality-skills.git
cd code-quality-skills
claude install-skill feature-gap-auditor-skill/feature-gap-auditor.skill
```

### Manual

Copy `SKILL.md` into your skills directory:

```bash
mkdir -p ~/.claude/skills/feature-gap-auditor
cp SKILL.md ~/.claude/skills/feature-gap-auditor/SKILL.md
```

## Usage

Ask naturally when you want a focused product/feature audit:

- "Audit this feature"
- "Is this feature actually working?"
- "Find feature gaps in onboarding"
- "Dig deeper into this flow"
- "Does this recommendation logic make sense for users?"

## License

MIT
