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
| `bug-hunter-skill` | Drives a running app as a real user to find production bugs — maps flows, hunts adversarially, reports with screenshots |
| `complexity-audit-skill` | Audits codebase for unnecessary complexity across frontend, API, backend, and database layers |

## Installation

Install any skill directly via the Claude Code CLI using the `.skill` file:

```bash
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/slop-remover-skill/slop-remover.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/bug-hunter-skill/bug-hunter.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/complexity-audit-skill/complexity-audit.skill
```

Or clone the repo and install locally:

```bash
git clone https://github.com/bumpkingsol/code-quality-skills.git
cd code-quality-skills
claude install-skill slop-remover-skill/slop-remover.skill
claude install-skill bug-hunter-skill/bug-hunter.skill
claude install-skill complexity-audit-skill/complexity-audit.skill
```

> Each subdirectory is a standalone skill. Refer to each skill's own README for details.
