# Bug Hunter

An agent skill that hunts production bugs in a running application by driving it as a real user would — via `computer-use` for native apps, or a browser MCP (Chrome DevTools / Playwright) for web apps. This skill does **not** read code. It launches the app, clicks through it, and reports what's broken.

## What it does

Three phases, one persistent artifact.

1. **Map** — crawls the running app breadth-first, enumerating every screen, button, link, tab, form field, and toggle. For each element records its label, location, type, and *intended* behavior. Persists to `flow-map.json` so subsequent runs start fast and can detect regressions.
2. **Hunt** — drives each flow happy-path, then runs adversarial variants: empty inputs, boundary values (very long strings, emoji, negatives, far-future dates), interrupted flows (background/return), rapid repeat (double-tap, spam toggle), back-navigation mid-flow, offline. Screenshots every deviation and records exact reproduction steps.
3. **Report** — structured markdown at `~/.claude/bug-hunter/<app-slug>/reports/YYYY-MM-DD.md` with findings classified by severity (Critical / High / Medium / Low) and confidence (High / Medium / Low), plus regressions vs. the last map, plus a coverage summary.

Bug classes surfaced include: dead interactions, wrong destinations, stuck loading states, silent failures, visual defects, data loss / persistence bugs, state inconsistency, navigation dead-ends, missing empty/error states, validation gaps.

Destructive actions (delete, cancel subscription, real payments, real outbound communications) are never executed without explicit per-session permission.

## Requirements

- **Read / Write / Bash** for persisting the flow map and writing reports
- One driver for the app under test:
  - `computer-use` MCP (`mcp__computer-use__*`) for native desktop or visible simulator apps
  - `chrome-devtools` MCP or `playwright` MCP for web apps (computer-use browsers are granted at "read" tier, so actual clicking/typing must go through a browser MCP)

## Install

### Claude Code

```bash
# Global (all projects)
mkdir -p ~/.claude/skills/bug-hunter
curl -o ~/.claude/skills/bug-hunter/SKILL.md \
  https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/bug-hunter-skill/SKILL.md

# Project-only
mkdir -p .claude/skills/bug-hunter
curl -o .claude/skills/bug-hunter/SKILL.md \
  https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/bug-hunter-skill/SKILL.md
```

### Codex / OpenAI Agents

Add the skill content to your agent's system instructions, or reference the raw file:

```
https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/bug-hunter-skill/SKILL.md
```

### Gemini CLI

```bash
mkdir -p .gemini/skills/bug-hunter
curl -o .gemini/skills/bug-hunter/SKILL.md \
  https://raw.githubusercontent.com/bumpkingsol/code-quality-skills/main/bug-hunter-skill/SKILL.md
```

### Any LLM agent

The skill is a standalone markdown file with YAML frontmatter. It works with any agent framework that supports system-prompt injection or skill loading — as long as the agent has access to a computer-use or browser automation toolkit.

## Usage

Once installed, trigger the skill by asking your agent:

- "Hunt bugs in my app"
- "Test [AppName] end-to-end"
- "QA the onboarding flow"
- "Run a regression sweep"
- "Something's off — poke at it and find what's broken"
- "Check if the settings page actually works"

On first run the skill will ask how to launch the app, which driver to use, test credentials, and any destructive actions to avoid. This is persisted per-app so subsequent runs skip the setup.

## Related skills

- **production-gap-auditor** — code-side audit for bugs unit tests miss. Complements bug-hunter: bug-hunter finds the UI symptom, production-gap-auditor finds the code-side gap.
- **systematic-debugging** — once bug-hunter surfaces a bug, use systematic-debugging to drive it to root cause.

## License

MIT
