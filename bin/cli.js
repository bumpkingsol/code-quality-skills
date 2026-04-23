#!/usr/bin/env node
// Cross-agent installer for code-quality-skills.
// Usage:
//   npx github:bumpkingsol/code-quality-skills install <skill> [--agent <a>] [--scope <s>]
//   npx github:bumpkingsol/code-quality-skills install-all [--agent <a>] [--scope <s>]
//   npx github:bumpkingsol/code-quality-skills list
//   npx github:bumpkingsol/code-quality-skills agents

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const REPO = 'bumpkingsol/code-quality-skills';
const BRANCH = 'main';

// skill name -> repo subdirectory
const SKILLS = {
  'bug-hunter': 'bug-hunter-skill',
  'cleanup': 'cleanup-skill',
  'complexity-audit': 'complexity-audit-skill',
  'compliance-audit': 'compliance-audit-skill',
  'production-gap-auditor': 'production-gap-auditor-skill',
  'slop-remover': 'slop-remover-skill',
  'whats-wrong': 'whats-wrong-skills',
};

// agent -> { user: absolute-ish path, project: relative path }
const AGENTS = {
  claude:  { user: '~/.claude/skills',  project: '.claude/skills'  },
  gemini:  { user: '~/.gemini/skills',  project: '.gemini/skills'  },
  codex:   { user: '~/.codex/skills',   project: '.codex/skills'   },
  cursor:  { user: '~/.cursor/skills',  project: '.cursor/skills'  },
  copilot: { user: '~/.copilot/skills', project: '.copilot/skills' },
};

function expand(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : path.resolve(p);
}

function fetchText(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'code-quality-skills-cli' } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
          res.resume();
          return fetchText(res.headers.location, redirects - 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function usage() {
  const skills = Object.keys(SKILLS).join(', ');
  const agents = Object.keys(AGENTS).join(', ');
  console.log(`code-quality-skills — cross-agent skill installer

Usage:
  npx code-quality-skills install <skill> [--agent <agent>] [--scope <user|project>]
  npx code-quality-skills install-all     [--agent <agent>] [--scope <user|project>]
  npx code-quality-skills list
  npx code-quality-skills agents

Skills: ${skills}
Agents: ${agents}   (default: claude)
Scopes: user, project                  (default: user)

Examples:
  npx code-quality-skills install bug-hunter
  npx code-quality-skills install slop-remover --agent gemini
  npx code-quality-skills install-all --agent cursor --scope project
`);
}

async function installOne(skillName, agent, scope) {
  const dir = SKILLS[skillName];
  if (!dir) throw new Error(`Unknown skill '${skillName}'. Run 'list' to see options.`);
  const agentPaths = AGENTS[agent];
  if (!agentPaths) throw new Error(`Unknown agent '${agent}'. Run 'agents' to see options.`);
  const base = agentPaths[scope];
  if (!base) throw new Error(`Unknown scope '${scope}'. Use 'user' or 'project'.`);

  const targetDir = path.join(expand(base), skillName);
  fs.mkdirSync(targetDir, { recursive: true });

  const rawBase = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${dir}`;
  const skillMd = await fetchText(`${rawBase}/SKILL.md`);
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), skillMd);

  // best-effort fetch README too
  try {
    const readme = await fetchText(`${rawBase}/README.md`);
    fs.writeFileSync(path.join(targetDir, 'README.md'), readme);
  } catch {
    // skills without READMEs are fine
  }

  console.log(`✓ Installed ${skillName} → ${targetDir}`);
}

function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { flags, positional } = parseFlags(rest);
  const agent = flags.agent || 'claude';
  const scope = flags.scope || 'user';

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
    usage();
    return;
  }
  if (cmd === 'list') {
    Object.keys(SKILLS).forEach((s) => console.log(s));
    return;
  }
  if (cmd === 'agents') {
    Object.entries(AGENTS).forEach(([k, v]) => {
      console.log(`${k.padEnd(8)} user=${v.user}  project=${v.project}`);
    });
    return;
  }
  if (cmd === 'install') {
    const skill = positional[0];
    if (!skill) {
      console.error('Missing skill name. Try: list');
      process.exit(1);
    }
    await installOne(skill, agent, scope);
    return;
  }
  if (cmd === 'install-all') {
    for (const s of Object.keys(SKILLS)) {
      await installOne(s, agent, scope);
    }
    return;
  }
  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
