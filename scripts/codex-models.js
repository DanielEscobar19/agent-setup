#!/usr/bin/env node
// Choose and apply models for the installed Codex agents. The repo's agent templates carry no `model`
// (names depend on the account and change often); this script adds them per tier after install.
//
//   node codex-models.js list                          models available to this Codex account
//   node codex-models.js read  --dir <agents dir>      current tier -> model of the installed agents
//   node codex-models.js apply --dir <agents dir> --fast <m> --balanced <m> --deep <m> [--dry-run]
//
// Tiers come from each agent's model_reasoning_effort (low = fast, medium = balanced, high = deep), which
// build.js derives from the shared agent tier. `apply` inserts or replaces the `model = "..."` line and is idempotent.
// Models are checked against $CODEX_HOME/models_cache.json (default ~/.codex); pass --force to skip the check.
const fs = require('fs');
const os = require('os');
const path = require('path');

const [cmd, ...rest] = process.argv.slice(2);
const flag = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };
const has = (n) => rest.includes(n);
const tierOf = { low: 'fast', medium: 'balanced', high: 'deep' };

const home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
function available() {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(home, 'models_cache.json'), 'utf8'));
    return (m.models || m).filter((x) => (x.visibility || 'list') === 'list')
      .map((x) => ({ slug: x.slug || x.id || x.name, description: x.description || '' }));
  } catch { return null; }
}
const agentFiles = (dir) => fs.readdirSync(dir).filter((n) => n.endsWith('.toml')).map((n) => path.join(dir, n));
const effortOf = (t) => (t.match(/^model_reasoning_effort\s*=\s*"(\w+)"/m) || [])[1];
const modelOf = (t) => (t.match(/^model\s*=\s*"([^"]+)"/m) || [])[1];

if (cmd === 'list') {
  const a = available();
  if (!a) { console.error(`No model list found at ${path.join(home, 'models_cache.json')}. Start Codex once to create it.`); process.exit(1); }
  console.log(JSON.stringify(a, null, 2));
} else if (cmd === 'read' && flag('--dir')) {
  const out = {};
  for (const f of agentFiles(flag('--dir'))) {
    const t = fs.readFileSync(f, 'utf8');
    const tier = tierOf[effortOf(t)];
    if (tier && modelOf(t)) out[tier] = modelOf(t);
  }
  console.log(JSON.stringify(out));
} else if (cmd === 'apply' && flag('--dir')) {
  const chosen = { fast: flag('--fast'), balanced: flag('--balanced'), deep: flag('--deep') };
  const a = available();
  if (!has('--force')) {
    if (!a) { console.error('Cannot verify models (no models_cache.json). Use --force to skip the check.'); process.exit(1); }
    const bad = Object.values(chosen).filter((m) => m && !a.some((x) => x.slug === m));
    if (bad.length) { console.error(`Not available to this account: ${bad.join(', ')}. Run: node scripts/codex-models.js list`); process.exit(2); }
  }
  const changes = [];
  for (const f of agentFiles(flag('--dir'))) {
    let t = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    const tier = tierOf[effortOf(t)];
    const model = tier && chosen[tier];
    if (!model) continue;
    const line = `model = ${JSON.stringify(model)}`;
    const next = modelOf(t)
      ? t.replace(/^model\s*=\s*"[^"]*"/m, line)
      : t.replace(/^(description\s*=.*)$/m, `$1\n${line}`);
    if (next !== t) { changes.push(`${path.basename(f)}: ${model}`); if (!has('--dry-run')) fs.writeFileSync(f, next); }
  }
  console.log(JSON.stringify({ dryRun: has('--dry-run'), changed: changes }));
} else {
  console.error('Usage: codex-models.js list | read --dir <dir> | apply --dir <dir> --fast <m> --balanced <m> --deep <m> [--dry-run] [--force]');
  process.exit(1);
}
