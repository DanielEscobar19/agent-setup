#!/usr/bin/env node
// Generates the per-tool files (Claude Code, GitHub Copilot) from the tool-neutral sources in shared/.
//
//   node scripts/build.js           write generated files
//   node scripts/build.js --check   exit 1 if any generated file is out of date (used by selftest)
//
// Sources:   shared/agents/*.md, shared/instructions/workspace.md, shared/skills/**, shared/templates/backlog.md
// Outputs:   claude/templates/{agents,skills,workspace}, copilot/templates/{agents,workspace}
// Never edit the outputs by hand; edit shared/ and rebuild.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
const stale = [];

const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8').replace(/\r\n/g, '\n');
function write(rel, content) {
  const file = path.join(root, rel);
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null;
  if (cur === content) return;
  if (check) { stale.push(rel); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

// Per-tool vocabulary
const TOOLS = {
  claude: {
    vars: { CONFIG_DIR: '.claude', PLANS_DIR: '.claude/plans', REPO_INSTRUCTIONS: 'CLAUDE.md', DEFAULT_TEMPLATE: 'templates/default-template.md' },
    model: { fast: 'haiku', balanced: 'sonnet', deep: 'opus' },
    toolMap: { read: ['Read', 'Grep', 'Glob'], edit: ['Edit', 'Write'], execute: ['Bash'], web: ['WebSearch', 'WebFetch'] },
  },
  copilot: {
    vars: { CONFIG_DIR: '.github', PLANS_DIR: '.github/plans', REPO_INSTRUCTIONS: '.github/copilot-instructions.md', DEFAULT_TEMPLATE: 'pr-description.template.md' },
    model: null, // Copilot model names depend on the subscription; leave to the user's model picker
    toolMap: { read: ['read', 'search'], edit: ['edit'], execute: ['execute'], web: ['web'] },
  },
};
const sub = (text, vars) => text.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
const banner = (src) => `<!-- GENERATED from ${src} by scripts/build.js — edit the source, not this file. -->`;

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('missing frontmatter');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2].replace(/^\n+/, '') };
}

// ---- Agents
for (const f of fs.readdirSync(path.join(root, 'shared', 'agents')).filter((n) => n.endsWith('.md'))) {
  const src = `shared/agents/${f}`;
  const { meta, body } = parseFrontmatter(read('shared', 'agents', f));
  const abstract = meta.tools.split(',').map((s) => s.trim());
  const name = meta.name;

  const c = TOOLS.claude;
  write(`claude/templates/agents/${f}`,
    `---\nname: ${name}\ndescription: ${meta.description}\nmodel: ${c.model[meta.tier]}\ntools: ${abstract.flatMap((t) => c.toolMap[t]).join(', ')}\n---\n${banner(src)}\n\n${body}`);

  const g = TOOLS.copilot;
  const gTools = JSON.stringify([...new Set(abstract.flatMap((t) => g.toolMap[t]))]);
  write(`copilot/templates/agents/${name}.agent.md`,
    `---\nname: ${name}\ndescription: ${JSON.stringify(meta.description)}\ntools: ${gTools}\n---\n${banner(src)}\n\n${body}`);
}

// ---- Workspace instructions + backlog
const instructions = read('shared', 'instructions', 'workspace.md');
const backlog = read('shared', 'templates', 'backlog.md');
write('claude/templates/workspace/CLAUDE.md',
  `# CLAUDE.md\n\n${banner('shared/instructions/workspace.md')}\n\n${sub(instructions, TOOLS.claude.vars)}`);
write('claude/templates/workspace/.claude/plans/backlog.md', backlog);
write('copilot/templates/workspace/.github/copilot-instructions.md',
  `# Copilot instructions\n\n${banner('shared/instructions/workspace.md')}\n\n${sub(instructions, TOOLS.copilot.vars)}`);
write('copilot/templates/workspace/.github/plans/backlog.md', backlog);

// ---- Skills
// Claude: copied as-is (placeholders resolved) to claude/templates/skills/
(function copySkills(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const r = `${rel}/${e.name}`;
    if (e.isDirectory()) copySkills(p, r);
    else if (e.name !== 'README.md' || rel !== '') write(`claude/templates/skills${r}`, sub(fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n'), TOOLS.claude.vars));
  }
})(path.join(root, 'shared', 'skills'), '');

// Copilot: pr-description -> prompt file (+ bundled default template next to it)
{
  const { meta, body } = parseFrontmatter(read('shared', 'skills', 'pr-description', 'SKILL.md'));
  write('copilot/templates/workspace/.github/prompts/pr-description.prompt.md',
    `---\ndescription: ${JSON.stringify(meta.description)}\nmode: agent\n---\n${banner('shared/skills/pr-description/SKILL.md')}\n\n${sub(body, TOOLS.copilot.vars)}`);
  write('copilot/templates/workspace/.github/prompts/pr-description.template.md', read('shared', 'skills', 'pr-description', 'templates', 'default-template.md'));
}

if (check) {
  if (stale.length) { console.error(`Out of date (run node scripts/build.js):\n  ${stale.join('\n  ')}`); process.exit(1); }
  console.log('Generated files are up to date');
} else console.log('Build complete');
