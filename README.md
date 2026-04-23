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

These skills are plain `SKILL.md` files with YAML frontmatter — they work with any agent framework that supports skills (Claude Code, Gemini CLI, Codex, Cursor, Copilot CLI, etc.).

### Install via npx (any agent)

The installer runs straight from GitHub — no npm package required.

```bash
# List available skills
npx github:bumpkingsol/code-quality-skills list

# Install one skill (defaults to Claude, user scope)
npx github:bumpkingsol/code-quality-skills install bug-hunter

# Install to a different agent
npx github:bumpkingsol/code-quality-skills install slop-remover --agent gemini
npx github:bumpkingsol/code-quality-skills install production-gap-auditor --agent cursor

# Install to project scope instead of user scope
npx github:bumpkingsol/code-quality-skills install complexity-audit --scope project

# Install everything
npx github:bumpkingsol/code-quality-skills install-all --agent claude
```

**Supported agents:** `claude`, `gemini`, `codex`, `cursor`, `copilot`
**Scopes:** `user` (default, global) or `project` (local `.{agent}/skills/`)

> Tip: alias it for convenience —
> `alias cqs='npx github:bumpkingsol/code-quality-skills'`
> then run `cqs install bug-hunter --agent gemini`.

### Install via Claude Code CLI

For Claude Code specifically, you can also use the bundled `.skill` packages:

```bash
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/slop-remover-skill/slop-remover.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/bug-hunter-skill/bug-hunter.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/complexity-audit-skill/complexity-audit.skill
```

### Manual install

Each subdirectory is a standalone skill. Copy the skill's folder into your agent's skills directory:

| Agent | User scope | Project scope |
|-------|------------|---------------|
| Claude Code | `~/.claude/skills/<name>/` | `.claude/skills/<name>/` |
| Gemini CLI | `~/.gemini/skills/<name>/` | `.gemini/skills/<name>/` |
| Codex | `~/.codex/skills/<name>/` | `.codex/skills/<name>/` |
| Cursor | `~/.cursor/skills/<name>/` | `.cursor/skills/<name>/` |
| Copilot CLI | `~/.copilot/skills/<name>/` | `.copilot/skills/<name>/` |

> Refer to each skill's own README for usage details.
