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

Each skill is installed independently via the Skill tool:

```
/skill <skill-name>
```

> Each subdirectory is a standalone skill. Refer to each skill's own `CLAUDE.md` for usage.