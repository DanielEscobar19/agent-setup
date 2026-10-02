# QMD

Local search engine over markdown/code. Provides MCP tools `query`, `get`, `multi_get`, `status`.

## Install
1. CLI (needs Node): `npm install -g @tobilu/qmd`. Verify: `qmd --version`.
2. Marketplace and plugin:
   ```
   claude plugin marketplace add tobi/qmd
   claude plugin install qmd@qmd
   ```
   (Equivalent settings: `enabledPlugins: {"qmd@qmd": true}` and `extraKnownMarketplaces.qmd.source = {source: "github", repo: "tobi/qmd"}`.)
3. Collections. **Ask the user** which folders to index and what to name each collection; don't guess.
   Run `qmd collection add --help` / `qmd --help` for the exact syntax (name, path, file mask, ignore
   globs), then `qmd update -c <name>` and `qmd embed -c <name>`. Typical masks: code
   `{**/*.ts,**/*.tsx,**/*.cs,**/*.json,**/*.md}`; ignore `**/node_modules/**`, `**/bin/**`,
   `**/obj/**`, `**/dist/**`.
4. Optional index-tracking hooks (`hooks/qmd-tracking.json`):
   - Copy `scripts/hooks/qmd-hook.js` to `<workspace>/.claude/scripts/`.
   - Create `<workspace>/.claude/qmd-map.json` mapping each repo's **folder name** to its **collection**:
     `{ "my-api": "my-api", "my-web": "my-web" }`.
   - Merge the hooks with `scripts/merge-settings.js` into `<workspace>/.claude/settings.json`.
   - In each mapped repo, append `**/.claude/.qmd-dirty-*` to `.git/info/exclude` (marker files).
   How it works: SessionStart re-indexes everything; each Write/Edit marks the owning collection dirty;
   the Stop hook re-indexes only dirty collections in the background. Works on Windows/macOS/Linux.

## Verify
`qmd collection list` shows the collections; the `mcp__plugin_qmd_qmd__status` tool responds.
