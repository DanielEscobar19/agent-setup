# QMD

Local search engine over markdown/code. Provides MCP tools `query`, `get`, `multi_get`, `status`.

## Install
1. Install the CLI (requires Node). Check https://github.com/tobi/qmd for the current install command, then verify: `qmd --version`.
2. Register the marketplace and plugin:
   ```
   claude plugin marketplace add tobi/qmd
   claude plugin install qmd@qmd
   ```
   (Equivalent settings: `enabledPlugins: {"qmd@qmd": true}` and `extraKnownMarketplaces.qmd.source = {source: "github", repo: "tobi/qmd"}`.)
3. Create collections for the folders the user wants indexed. **Ask the user** for names and paths; do not guess. Use `qmd collection --help` for the exact syntax, then run `qmd update -c <name>` and `qmd embed -c <name>`.
   Typical file masks: code `{**/*.ts,**/*.tsx,**/*.cs,**/*.json,**/*.md}`; ignore `**/node_modules/**`, `**/bin/**`, `**/obj/**`, `**/dist/**`.
4. Optional: merge `hooks/qmd-reindex.json` so collections re-index at session start. Replace `<COLLECTIONS>` with the comma-separated names.

## Verify
`qmd collection list` shows the collections; the `mcp__plugin_qmd_qmd__status` tool responds.
