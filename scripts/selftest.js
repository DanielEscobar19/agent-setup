#!/usr/bin/env node
// Self-test for the helper scripts. Runs entirely in a temp directory; touches no real config.
//   node scripts/selftest.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-setup-test-'));
const run = (script, args, input, env) =>
  spawnSync('node', [path.join(root, script), ...args], { input, env: { ...process.env, ...env }, encoding: 'utf8' });
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : ' -> ' + detail}`);
  if (!ok) failed++;
}

// Every shipped JSON file parses
const jsonFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith('.json')) jsonFiles.push(p);
  }
})(root);
const bad = jsonFiles.filter((f) => { try { read(f); return false; } catch { return true; } });
check(`all ${jsonFiles.length} JSON files parse`, bad.length === 0, bad.join(', '));

// Files the setup references must exist (catches e.g. a gitignored template)
const cat = read(path.join(root, 'claude', 'plugins', 'catalog.json'));
const refs = [
  ...cat.optionalHooks.flatMap((h) => [h.file, ...(h.scripts || [])]),
  ...cat.optionalSkills.map((s) => s.dir),
  ...cat.extras.flatMap((e) => [...(e.files || []), e.file, e.dir].filter(Boolean)),
];
const missing = refs.filter((r) => !fs.existsSync(path.join(root, r)));
check('every file in catalog.json exists', missing.length === 0, missing.join(', '));
const ignored = spawnSync('git', ['check-ignore', ...refs], { cwd: root, encoding: 'utf8' }).stdout.trim();
check('no catalog file is git-ignored', ignored === '', ignored);

// generated files are in sync with shared/
const build = run('scripts/build.js', ['--check']);
check('generated files are up to date (node scripts/build.js)', build.status === 0, build.stderr.trim());
const cop = path.join(root, 'copilot', 'templates', 'agents');
const badAgents = fs.readdirSync(cop).filter((n) => !/^---\nname: [\w-]+\ndescription: ".+"\ntools: \[.*\]\n---\n/.test(fs.readFileSync(path.join(cop, n), 'utf8').replace(/\r\n/g, '\n')));
check('copilot agents have valid frontmatter', badAgents.length === 0, badAgents.join(', '));

// merge-settings: add, idempotent, conflict kept, placeholder error
const ws = path.join(tmp, 'ws', '.claude');
fs.mkdirSync(ws, { recursive: true });
const target = path.join(ws, 'settings.json');
fs.writeFileSync(target, JSON.stringify({ model: 'opus' }));
const hooksSrc = path.join(root, 'claude', 'hooks', 'qmd-tracking.json');
let r = run('scripts/merge-settings.js', ['--target', target, '--source', hooksSrc]);
check('merge adds hooks', r.status === 0 && read(target).hooks?.Stop?.length === 1, r.stderr);
r = run('scripts/merge-settings.js', ['--target', target, '--source', hooksSrc]);
check('merge is idempotent', JSON.parse(r.stdout).changed === false);
check('_note keys are stripped', !fs.readFileSync(target, 'utf8').includes('_note'));
r = run('scripts/merge-settings.js', ['--target', target, '--source', path.join(root, 'claude', 'global', 'settings.base.json')]);
const out = JSON.parse(r.stdout);
check('scalar conflict is kept and reported', read(target).model === 'opus' && out.conflicts.some((c) => c.startsWith('model')));
fs.writeFileSync(path.join(tmp, 'ph.json'), JSON.stringify({ x: '<MISSING_VAR>' }));
r = run('scripts/merge-settings.js', ['--target', target, '--source', path.join(tmp, 'ph.json')]);
check('unresolved placeholder exits 2', r.status === 2);
const perm = path.join(ws, 'settings.local.json');
r = run('scripts/merge-settings.js', ['--target', perm, '--source', path.join(root, 'claude', 'templates', 'permissions.local.json')]);
check('permissions snippet merges', r.status === 0 && read(perm).permissions.allow.length > 0, r.stderr);

// manifest
const manifestEnv = { CLAUDE_SETUP_MANIFEST: path.join(tmp, 'm.json') };
run('scripts/manifest.js', ['add', 'qmd', '--kind', 'plugin'], '', manifestEnv);
check('manifest has installed item', run('scripts/manifest.js', ['has', 'qmd'], '', manifestEnv).status === 0);
check('manifest lacks other item', run('scripts/manifest.js', ['has', 'nope'], '', manifestEnv).status === 1);

// hook scripts
r = run('scripts/hooks/block-claude-in-commits.js', [], JSON.stringify({ tool_input: { command: 'git commit -m "by Claude"' } }));
check('commit guard denies Claude mention', r.stdout.includes('"deny"'));
r = run('scripts/hooks/block-claude-in-commits.js', [], JSON.stringify({ tool_input: { command: 'git commit -m fix' } }));
check('commit guard allows clean commit', r.stdout.trim() === '');
fs.writeFileSync(path.join(ws, 'qmd-map.json'), JSON.stringify({ 'my-api': 'my-api' }));
const hookEnv = { CLAUDE_PROJECT_DIR: path.join(tmp, 'ws') };
run('scripts/hooks/qmd-hook.js', ['mark'], JSON.stringify({ tool_input: { file_path: 'C:\\x\\My-Api\\a.cs' } }), hookEnv);
check('qmd-hook marks owning collection dirty', fs.existsSync(path.join(ws, '.qmd-dirty-my-api')));
run('scripts/hooks/qmd-hook.js', ['mark'], JSON.stringify({ tool_input: { file_path: '/x/other/a.cs' } }), hookEnv);
check('qmd-hook ignores unmapped files', fs.readdirSync(ws).filter((f) => f.startsWith('.qmd-dirty')).length === 1);
check('backlog reminder emits systemMessage', run('scripts/hooks/backlog-reminder.js', []).stdout.includes('systemMessage'));

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
