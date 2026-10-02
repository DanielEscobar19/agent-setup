#!/usr/bin/env node
// QMD index maintenance hook (cross-platform). Installed to <workspace>/.claude/scripts/.
//
//   qmd-hook.js session   SessionStart: re-index every mapped collection (background)
//   qmd-hook.js mark      PostToolUse (Write|Edit): mark the collection owning the edited file as dirty
//   qmd-hook.js reindex   Stop: re-index only collections marked dirty, then clear the markers
//
// Config: <workspace>/.claude/qmd-map.json, {"<repo-folder-name>": "<qmd-collection>", ...}
// Markers: <workspace>/.claude/.qmd-dirty-<collection>   (git-exclude these in each repo)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const dir = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude');
let map;
try { map = JSON.parse(fs.readFileSync(path.join(dir, 'qmd-map.json'), 'utf8')); } catch { process.exit(0); }

const marker = (c) => path.join(dir, `.qmd-dirty-${c}`);
const safe = (c) => /^[\w.-]+$/.test(c);

function reindex(cols) {
  const list = [...new Set(cols)].filter(safe).join(',');
  if (!list) return;
  spawn(`qmd update -c ${list} && qmd embed -c ${list}`, { shell: true, detached: true, stdio: 'ignore', windowsHide: true }).unref();
}

const mode = process.argv[2];
if (mode === 'session') {
  reindex(Object.values(map));
} else if (mode === 'mark') {
  let file = '';
  try { file = (JSON.parse(fs.readFileSync(0, 'utf8')).tool_input || {}).file_path || ''; } catch { /* no stdin */ }
  const p = '/' + file.replace(/\\/g, '/').toLowerCase();
  for (const [folder, col] of Object.entries(map)) {
    if (safe(col) && p.includes('/' + folder.toLowerCase() + '/')) fs.writeFileSync(marker(col), '');
  }
} else if (mode === 'reindex') {
  const dirty = Object.values(map).filter((c) => safe(c) && fs.existsSync(marker(c)));
  dirty.forEach((c) => fs.rmSync(marker(c), { force: true }));
  reindex(dirty);
}
