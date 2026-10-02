#!/usr/bin/env node
// Install manifest, so re-running the setup only adds what is new.
//
//   node manifest.js add  <id> [--kind plugin|hook|agent|skill|extra] [--workspace <path>]
//   node manifest.js has  <id>      # exit 0 if installed, 1 if not
//   node manifest.js list
//
// Manifest file: $CLAUDE_SETUP_MANIFEST or ~/.claude/.claude-setup.json
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const file = process.env.CLAUDE_SETUP_MANIFEST || path.join(os.homedir(), '.claude', '.claude-setup.json');
const [cmd, id, ...rest] = process.argv.slice(2);

let m = { version: 1, repo: 'DanielEscobar19/agent-setup', commit: null, updatedAt: null, installed: {} };
try { m = { ...m, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { /* new manifest */ }

function flag(name) { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; }

if (cmd === 'add' && id) {
  try { m.commit = execSync('git rev-parse HEAD', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a git checkout */ }
  m.updatedAt = new Date().toISOString();
  m.installed[id] = { kind: flag('--kind') || 'item', workspace: flag('--workspace') || null, at: m.updatedAt };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n');
  console.log(`recorded ${id}`);
} else if (cmd === 'has' && id) {
  process.exit(id in m.installed ? 0 : 1);
} else if (cmd === 'list') {
  console.log(JSON.stringify(m, null, 2));
} else {
  console.error('Usage: node manifest.js add <id> [--kind k] [--workspace p] | has <id> | list');
  process.exit(1);
}
