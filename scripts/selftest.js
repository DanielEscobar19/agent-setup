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
const cdx = path.join(root, 'codex', 'templates', 'agents');
const badCodex = fs.readdirSync(cdx).filter((n) => { const t = fs.readFileSync(path.join(cdx, n), 'utf8'); return !/^name = ".+"$/m.test(t) || !/^description = ".+"$/m.test(t) || !/^developer_instructions = ".+"$/m.test(t); });
check('codex agents have required TOML fields', badCodex.length === 0, badCodex.join(', '));
check('copilot instruction skeleton exists', fs.existsSync(path.join(root, 'copilot', 'templates', 'instructions', '_skeleton.instructions.md')));
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
const st = JSON.parse(run('scripts/manifest.js', ['status'], '', manifestEnv).stdout || '{}');
check('manifest status reports installed item', Array.isArray(st.items) && st.items.some((i) => i.id === 'qmd'));
const rootCommit = spawnSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim().split('\n')[0];
if (rootCommit) {
  fs.writeFileSync(manifestEnv.CLAUDE_SETUP_MANIFEST, JSON.stringify({ installed: { old: { kind: 'item', commit: rootCommit } } }));
  const old = JSON.parse(run('scripts/manifest.js', ['status'], '', manifestEnv).stdout).items[0];
  check('manifest status detects outdated item', old.upToDate === false);
}

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
// commit guard works in tools that can't filter by command (Codex, Copilot) and recognises other AI attributions
r = run('scripts/hooks/block-claude-in-commits.js', [], JSON.stringify({ tool_input: { command: 'git status # mentions claude' } }));
check('commit guard ignores non-commit commands', r.stdout.trim() === '');
r = run('scripts/hooks/block-claude-in-commits.js', [], JSON.stringify({ tool_input: { command: 'git commit -m "x Co-authored-by: Codex <noreply@openai.com>"' } }));
check('commit guard denies Codex co-author line', r.stdout.includes('"deny"'));
r = run('scripts/hooks/block-claude-in-commits.js', [], JSON.stringify({ tool_name: 'terminal', tool_input: { input: 'git commit -m "by Claude"' } }));
check('commit guard handles unknown tool_input shape', r.stdout.includes('"deny"'));
// qmd-hook: Codex layout (apply_patch text, config found next to the script, no CLAUDE_PROJECT_DIR)
const cws = path.join(tmp, 'cws', '.codex');
fs.mkdirSync(path.join(cws, 'hooks'), { recursive: true });
fs.copyFileSync(path.join(root, 'scripts', 'hooks', 'qmd-hook.js'), path.join(cws, 'hooks', 'qmd-hook.js'));
fs.writeFileSync(path.join(cws, 'qmd-map.json'), JSON.stringify({ 'my-api': 'my-api' }));
const cq = (ev) => spawnSync('node', [path.join(cws, 'hooks', 'qmd-hook.js'), 'mark'], { input: JSON.stringify(ev), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: '' } });
cq({ tool_name: 'apply_patch', cwd: 'C:/ws', tool_input: { command: '*** Begin Patch *** Update File: my-api/src/a.ts *** End Patch' } });
check('qmd-hook marks collection from a Codex apply_patch', fs.existsSync(path.join(cws, '.qmd-dirty-my-api')));
fs.rmSync(path.join(cws, '.qmd-dirty-my-api'));
cq({ tool_name: 'Read', tool_input: { file_path: '/x/my-api/a.ts' } });
check('qmd-hook ignores non-edit tools', !fs.existsSync(path.join(cws, '.qmd-dirty-my-api')));
cq({ tool_name: 'Edit', cwd: '/x/my-api', tool_input: { file_path: 'src/b.ts' } });
check('qmd-hook uses cwd for relative edit paths', fs.existsSync(path.join(cws, '.qmd-dirty-my-api')));
// codex-models: inserts, is idempotent, reads back, rejects unknown models
const ma = path.join(tmp, 'agents');
fs.mkdirSync(ma);
for (const f of fs.readdirSync(cdx)) fs.copyFileSync(path.join(cdx, f), path.join(ma, f));
const mh = { CODEX_HOME: path.join(tmp, 'codexhome') };
fs.mkdirSync(mh.CODEX_HOME);
fs.writeFileSync(path.join(mh.CODEX_HOME, 'models_cache.json'), JSON.stringify({ models: [{ slug: 'm-fast', visibility: 'list' }, { slug: 'm-mid', visibility: 'list' }, { slug: 'm-deep', visibility: 'list' }, { slug: 'm-hidden', visibility: 'hide' }] }));
const mArgs = ['apply', '--dir', ma, '--fast', 'm-fast', '--balanced', 'm-mid', '--deep', 'm-deep'];
r = run('scripts/codex-models.js', mArgs, '', mh);
check('codex-models applies a model per tier', r.status === 0 && JSON.parse(r.stdout).changed.length === 5, r.stderr);
check('codex-models is idempotent', JSON.parse(run('scripts/codex-models.js', mArgs, '', mh).stdout).changed.length === 0);
check('codex-models reads the mapping back', run('scripts/codex-models.js', ['read', '--dir', ma], '', mh).stdout.trim() === JSON.stringify({ fast: 'm-fast', balanced: 'm-mid', deep: 'm-deep' }));
check('codex-models rejects unavailable or hidden models', run('scripts/codex-models.js', ['apply', '--dir', ma, '--fast', 'm-hidden'], '', mh).status === 2);
check('codex-models keeps one model line per agent', fs.readdirSync(ma).every((n) => (fs.readFileSync(path.join(ma, n), 'utf8').match(/^model\s*=/gm) || []).length === 1));
// hook snippets: Codex ones merge with a placeholder var; Copilot ones are flat per-hook files
for (const f of fs.readdirSync(path.join(root, 'codex', 'hooks'))) {
  const t = path.join(tmp, 'codex-hooks.json');
  r = run('scripts/merge-settings.js', ['--target', t, '--source', path.join(root, 'codex', 'hooks', f), '--var', 'WS=C:/ws']);
  check('codex hook ' + f + ' merges', r.status === 0, r.stderr);
}
check('codex hooks.json has all events', ['PreToolUse', 'PostToolUse', 'Stop', 'SessionStart'].every((e) => read(path.join(tmp, 'codex-hooks.json')).hooks[e]));
const badCop = fs.readdirSync(path.join(root, 'copilot', 'hooks')).filter((f) => !Object.values(read(path.join(root, 'copilot', 'hooks', f)).hooks).every((arr) => arr.every((h) => h.type === 'command' && h.command.includes('<WS>'))));
check('copilot hook files are flat command entries', badCop.length === 0, badCop.join(', '));
const rules = fs.readFileSync(path.join(root, 'codex', 'templates', 'default.rules'), 'utf8');
check('codex rules template only allows read-only git', /prefix_rule/.test(rules) && !/"(push|commit|reset|checkout)"/.test(rules));
check('backlog reminder emits systemMessage', run('scripts/hooks/backlog-reminder.js', []).stdout.includes('systemMessage'));

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
