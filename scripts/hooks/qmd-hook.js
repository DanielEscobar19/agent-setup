#!/usr/bin/env node
// QMD index maintenance hook (cross-platform). Installed to <workspace>/.claude/scripts/ (Claude Code),
// <workspace>/.codex/hooks/ (Codex) or <workspace>/.github/hooks/scripts/ (Copilot).
//
//   qmd-hook.js session   SessionStart: re-index every mapped collection (background)
//   qmd-hook.js mark      PostToolUse (edit tools): mark the collection owning the edited file as dirty
//   qmd-hook.js reindex   Stop: re-index only collections marked dirty, then clear the markers
//
// Config: qmd-map.json in the tool's config folder (<workspace>/.claude, .codex or .github), found by searching
//         up from this script or via $CLAUDE_PROJECT_DIR: {"<repo-folder-name>": "<qmd-collection>", ...}
// Markers: .qmd-dirty-<collection> in the same folder   (git-exclude these in each repo)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const candidates = [];
if (process.env.CLAUDE_PROJECT_DIR) candidates.push(path.join(process.env.CLAUDE_PROJECT_DIR, '.claude'));
for (let d = __dirname, i = 0; i < 3; i++, d = path.dirname(d)) candidates.push(d);
candidates.push(path.join(process.cwd(), '.claude'));
const dir = candidates.find((d) => fs.existsSync(path.join(d, 'qmd-map.json'))) || candidates[0];
let map;
try { map = JSON.parse(fs.readFileSync(path.join(dir, 'qmd-map.json'), 'utf8')); } catch { process.exit(0); }

const marker = (c) => path.join(dir, `.qmd-dirty-${c}`);
const safe = (c) => /^[\w.-]+$/.test(c);

function reindex(cols) {
  const list = [...new Set(cols)].filter(safe).join(',');
  if (!list) return;
  // On Windows, `detached: true` makes the child DETACHED_PROCESS, which overrides windowsHide:
  // cmd.exe then gets no console and every console child (qmd -> node) opens its own visible window.
  // Without `detached`, windowsHide gives CREATE_NO_WINDOW and the whole chain stays hidden.
  const win = process.platform === 'win32';
  spawn(`qmd update -c ${list} && qmd embed -c ${list}`, { shell: true, detached: !win, stdio: 'ignore', windowsHide: true }).unref();
}

const mode = process.argv[2];
if (mode === 'session') {
  reindex(Object.values(map));
} else if (mode === 'mark') {
  // Edited paths appear differently per tool: Claude has tool_input.file_path, Codex's apply_patch has the patch
  // text in tool_input.command, Copilot's edit tools use their own fields. Search all of tool_input (plus cwd).
  let text = '';
  try {
    const ev = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (ev.tool_name && !/write|edit|patch|replace|create|insert/i.test(ev.tool_name)) process.exit(0);
    text = `${ev.cwd || ''}/ ${JSON.stringify(ev.tool_input || {})}`;
  } catch { /* no stdin */ }
  const p = text.replace(/\\+/g, '/').toLowerCase();
  for (const [folder, col] of Object.entries(map)) {
    const f = folder.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (safe(col) && new RegExp(`(^|[\\s/"':])${f}/`).test(p)) fs.writeFileSync(marker(col), '');
  }
} else if (mode === 'reindex') {
  const dirty = Object.values(map).filter((c) => safe(c) && fs.existsSync(marker(c)));
  dirty.forEach((c) => fs.rmSync(marker(c), { force: true }));
  reindex(dirty);
}
