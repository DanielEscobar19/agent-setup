# QMD for Codex

Local search over markdown/code, exposed to Codex as an MCP server (`qmd mcp`).

## Install
1. CLI (needs Node): `npm install -g @tobilu/qmd`. Verify: `qmd --version`.
2. Collections are shared with Claude (same index). If none exist yet, **ask the user** which folders to
   index and what to name each collection, then follow step 3 of `claude/plugins/qmd/README.md`
   (`qmd collection add ...`, `qmd update -c <name>`, `qmd embed -c <name>`).
3. Register the MCP server in `~/.codex/config.toml`. Merge, never overwrite: if `[mcp_servers.qmd]`
   already exists, leave it and tell the user; otherwise append:
   ```toml
   [mcp_servers.qmd]
   command = "qmd"
   args = ["mcp"]
   ```
   Equivalent: `codex mcp add qmd -- qmd mcp`. On Windows, `qmd` is an npm `.cmd` shim; if Codex
   cannot start it, use `command = "cmd"` and `args = ["/c", "qmd", "mcp"]`.

## Optional: index tracking hooks
Same behaviour as Claude (re-index on session start, and after turns that edited files in a mapped repo):
- Copy `scripts/hooks/qmd-hook.js` to `<ws>/.codex/hooks/`.
- Create `<ws>/.codex/qmd-map.json` mapping each repo's **folder name** to its **collection**:
  `{ "my-api": "my-api" }`.
- Merge `codex/hooks/qmd-tracking.json` into `<ws>/.codex/hooks.json` (see step 3 of `codex/SETUP.md`), then trust
  the hooks in `/hooks`. The `Write|Edit` matcher also matches Codex's `apply_patch`; the script finds the edited
  paths in the patch text.
- In each mapped repo, append `**/.codex/.qmd-dirty-*` to `.git/info/exclude` (marker files).

## Verify
`qmd collection list` shows the collections; start Codex, run `/mcp`, and `qmd` is listed and its tools
(`query`, `get`, `multi_get`, `status`) respond.
