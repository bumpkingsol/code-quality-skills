# Code Quality Skills

A collection of Claude Code skills for code quality and audits — diagnosing issues, ensuring compliance, and cleaning up codebases.

## Included Skills

| Skill | Description |
|-------|-------------|
| `slop-remover-skill` | 8-agent parallel deep-clean — deduplication, dead code, weak types, circular deps, error handling, legacy code, AI slop |
| `production-gap-auditor-skill` | Production gap auditing against world-class best practices |
| `compliance-audit-skill` | GDPR and HIPAA compliance audit with structured reports |
| `cleanup-skill` | Automated code cleanup |
| `whats-wrong-skills` | Deep-dive diagnosis of application subsystems |

## Installation

Install any skill with a single command using `npx degit`:

```bash
# Install slop-remover
npx degit bumpkingsol/code-quality-skills/slop-remover-skill ~/.claude/skills/slop-remover

# Install production-gap-auditor
npx degit bumpkingsol/code-quality-skills/production-gap-auditor-skill ~/.claude/skills/production-gap-auditor

# Install compliance-audit
npx degit bumpkingsol/code-quality-skills/compliance-audit-skill ~/.claude/skills/compliance-audit

# Install cleanup (dead-code-removal)
npx degit bumpkingsol/code-quality-skills/cleanup-skill ~/.claude/skills/dead-code-removal

# Install whats-wrong
npx degit bumpkingsol/code-quality-skills/whats-wrong-skills ~/.claude/skills/whats-wrong
```

Or clone the full collection:

```bash
git clone https://github.com/bumpkingsol/code-quality-skills.git
cp -r code-quality-skills/slop-remover-skill ~/.claude/skills/slop-remover
cp -r code-quality-skills/production-gap-auditor-skill ~/.claude/skills/production-gap-auditor
# ... etc
```

Verify installation by starting a new Claude Code session and running `/skills`.

> Each subdirectory is a standalone skill. Refer to each skill's own README for details.
