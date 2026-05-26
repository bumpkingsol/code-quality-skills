# Code Quality Skills

A collection of Claude Code skills for code quality and audits — diagnosing issues, ensuring compliance, and cleaning up codebases.

## Included Skills

| Skill | Description |
|-------|-------------|
| `slop-remover` | Deep code-quality cleanup for duplication, types, dead code, circular deps, legacy paths, and AI slop |
| `production-gap-auditor` | Production-readiness audit for gaps tests miss: silent failures, broken flows, data integrity, auth, UX, and integration issues |
| `compliance-audit` | GDPR/HIPAA/privacy audit for consent, PHI/PII, retention, erasure, portability, breach, and user-data handling |
| `dead-code-removal` | Conservative dead-code removal for unused imports, functions, files, unreachable code, and pruning sweeps |
| `whats-wrong` | Focused subsystem diagnosis for auth, payments, notifications, search, onboarding, and similar product areas |
| `bug-hunter` | Runtime QA that drives a live app with computer-use or browser automation and reports bugs with evidence |
| `complexity-audit` | Complexity audit across frontend, API, backend, and database layers with prioritized simplification recommendations |

## Installation

These skills are plain `SKILL.md` files with YAML frontmatter — they work with any agent framework that supports skills (Claude Code, Gemini CLI, Codex, Cursor, Copilot CLI, etc.).

### Install via npx (any agent)

```bash
# List available skills
npx code-quality-skills list

# Install one skill (defaults to Claude, user scope)
npx code-quality-skills install bug-hunter

# Install to a different agent
npx code-quality-skills install slop-remover --agent gemini
npx code-quality-skills install production-gap-auditor --agent cursor

# Install to project scope instead of user scope
npx code-quality-skills install complexity-audit --scope project

# Install everything
npx code-quality-skills install-all --agent claude
```

**Supported agents:** `claude`, `gemini`, `codex`, `cursor`, `copilot`
**Scopes:** `user` (default, global) or `project` (local `.{agent}/skills/`)

> Prefer not to install from npm? The same CLI runs directly from GitHub:
> `npx github:bumpkingsol/code-quality-skills install <skill>`

### Install via Claude Code CLI

For Claude Code specifically, you can also use the bundled `.skill` packages:

```bash
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/bug-hunter-skill/bug-hunter.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/cleanup-skill/dead-code-removal.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/complexity-audit-skill/complexity-audit.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/compliance-audit-skill/compliance-audit.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/production-gap-auditor-skill/production-gap-auditor.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/slop-remover-skill/slop-remover.skill
claude install-skill https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/whats-wrong-skills/whats-wrong.skill
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
