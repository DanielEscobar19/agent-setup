# QMD for Copilot

Local search over markdown/code, exposed to Copilot agent mode as an MCP server (`qmd mcp`).

## Install
1. CLI (needs Node): `npm install -g @tobilu/qmd`. Verify: `qmd --version`.
2. Collections are shared with Claude and Codex (same index). If none exist yet, **ask the user** which
   folders to index, then follow step 3 of `claude/plugins/qmd/README.md`.
3. Merge `copilot/templates/mcp.qmd.json` into `<ws>/.vscode/mcp.json` (create it if missing; keep other
   servers). Then in VS Code: Command Palette, "MCP: List Servers", start `qmd` and trust it.
4. Optional index tracking (re-index on session start and after edits):
   - Copy `scripts/hooks/qmd-hook.js` to `<ws>/.github/hooks/scripts/`.
   - Create `<ws>/.github/qmd-map.json` mapping each repo's **folder name** to its **collection**.
   - Copy `copilot/hooks/qmd-tracking.json` to `<ws>/.github/hooks/qmd-tracking.json`, replacing `<WS>`
     with the absolute workspace path (forward slashes).
   - In each mapped repo, append `**/.github/.qmd-dirty-*` to `.git/info/exclude`.
   Copilot hooks have no per-tool matcher, so the script itself ignores non-edit tools.

## Verify
`qmd collection list` shows the collections; the `qmd` server is listed and running under MCP: List Servers.
