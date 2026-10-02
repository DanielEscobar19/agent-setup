#!/usr/bin/env node
// Install manifest: records what was installed and from which repo commit, so re-runs and updates
// only touch what changed.
//
//   node manifest.js add <id> [--kind plugin|hook|agent|skill|extra] [--workspace <path>]
//   node manifest.js has <id>        exit 0 if installed, 1 if not
//   node manifest.js list            print the manifest
//   node manifest.js status          compare installed commits with this checkout; list changed files
//
// File: $AGENT_SETUP_MANIFEST or ~/.agent-setup/manifest.json
// (An older ~/.claude/.claude-setup.json is read once and migrated on the next `add`.)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const legacy = path.join(os.homedir(), '.claude', '.claude-setup.json');
const file = process.env.AGENT_SETUP_MANIFEST || process.env.CLAUDE_SETUP_MANIFEST || path.join(os.homedir(), '.agent-setup', 'manifest.json');
const [cmd, id, ...rest] = process.argv.slice(2);
const repoDir = path.resolve(__dirname, '..');

const git = (args) => execSync(`git ${args}`, { cwd: repoDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
const head = () => { try { return git('rev-parse HEAD'); } catch { return null; } };

let m = { version: 2, repo: 'DanielEscobar19/agent-setup', updatedAt: null, installed: {} };
for (const f of [file, legacy]) {
  try { m = { ...m, ...JSON.parse(fs.readFileSync(f, 'utf8')) }; break; } catch { /* try next */ }
}
const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };

if (cmd === 'add' && id) {
  m.version = 2;
  m.updatedAt = new Date().toISOString();
  m.installed[id] = { kind: flag('--kind') || 'item', workspace: flag('--workspace') || null, commit: head(), at: m.updatedAt };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n');
  console.log(`recorded ${id}`);
} else if (cmd === 'has' && id) {
  process.exit(id in m.installed ? 0 : 1);
} else if (cmd === 'list') {
  console.log(JSON.stringify(m, null, 2));
} else if (cmd === 'status') {
  const now = head();
  const rows = Object.entries(m.installed).map(([name, v]) => {
    let changed = [];
    let note = '';
    if (!v.commit) note = 'no commit recorded (installed by an older version); treat as possibly outdated';
    else if (v.commit !== now) {
      try { changed = git(`diff --name-only ${v.commit} ${now} -- shared claude copilot scripts`).split('\n').filter(Boolean); }
      catch { note = 'recorded commit not in this checkout; run git fetch --unshallow or compare manually'; }
    }
    return { id: name, kind: v.kind, workspace: v.workspace, installedAt: v.commit, upToDate: !!v.commit && v.commit === now, changedFiles: changed, note };
  });
  console.log(JSON.stringify({ current: now, items: rows }, null, 2));
} else {
  console.error('Usage: node manifest.js add <id> [--kind k] [--workspace p] | has <id> | list | status');
  process.exit(1);
}
