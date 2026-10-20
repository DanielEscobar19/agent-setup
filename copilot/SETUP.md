# GitHub Copilot setup — instructions for Claude (or any agent)

Installs the Copilot flavour of the shared setup into a workspace. Everything here is generated from
`shared/` (see `scripts/build.js`), so it carries the same conventions, agent roles and PR workflow as
the Claude setup.

What Copilot has and doesn't have, compared with Claude Code:
- Has: repo instructions, agents (`.agent.md`), prompt files (slash commands), agent hooks
  (`.github/hooks/*.json`, VS Code preview), MCP servers (`.vscode/mcp.json`) and a terminal auto-approve setting.
- Does **not** have plugins/marketplaces, a user-editable memory system or a per-tool hook matcher.

How each Claude piece maps to Copilot:

| Claude | Copilot |
|---|---|
| `CLAUDE.md`, agents, skills, backlog | `copilot-instructions.md`, `.agent.md`, prompt files, `.github/plans/backlog.md` |
| Hooks | `<ws>/.github/hooks/<id>.json` + scripts in `<ws>/.github/hooks/scripts/` (same hook scripts; they filter by tool themselves because Copilot hooks have no matcher) |
| RTK | `rtk init --copilot` (instructions + rewrite hook) |
| QMD plugin | MCP server in `<ws>/.vscode/mcp.json` + the same index-tracking hook |
| `permissions.local.json` allowlist | `chat.tools.terminal.autoApprove` in VS Code settings |
| Global `CLAUDE.md`, `settings.base.json`, seed memories | no equivalent needed: workspace instructions carry the same rules; the model comes from the model picker |

Terms: `<repo>` = the root of this repo. `<ws>` = the workspace root chosen in step 2. Paths are relative
to `<repo>` unless they start with `<ws>`.

## 1. Inspect
- `node scripts/selftest.js` must pass (it also checks the generated Copilot files are current).
- Which of these already exist in `<ws>/.github/` (never overwrite; merge or skip, and tell the user):
  `copilot-instructions.md`, `agents/`, `prompts/`, `plans/`.

## 2. Let the user choose (AskUserQuestion, multiSelect)
- **Workspace instructions** (`copilot/templates/workspace/.github/copilot-instructions.md`).
- **Agents** (`copilot/templates/agents/*.agent.md`): junior, mid, senior, planner, researcher.
- **Prompts**: `pr-description`.
- **Backlog** (`.github/plans/backlog.md`).
- **Workspace README** (`<ws>/README.md`, shared with Claude): follow step 8b of `claude/SETUP.md`; skip if it already exists.
- **Path-specific instruction skeleton** (`copilot/templates/instructions/_skeleton.instructions.md`): optional; copy it to `<ws>/.github/instructions/<name>.instructions.md` only if the user wants scoped rules, and set `applyTo` with them.
- **Hooks** (optional, per hook): `no-ai-attribution-in-commits` (`copilot/hooks/block-claude-in-commits.json`), `backlog-reminder` (`copilot/hooks/backlog-reminder.json`), `qmd-tracking` (`copilot/hooks/qmd-tracking.json`, requires QMD).
- **RTK**: `copilot/plugins/rtk/README.md`. **QMD** (MCP server): `copilot/plugins/qmd/README.md`.
- **Terminal allowlist** (`copilot/templates/terminal-autoapprove.json`): safe read-only git commands auto-approved in agent mode.
- Workspace root `<ws>` (default suggestion: the parent folder of the user's repos).

## 3. Install into `<ws>/.github/`
- `copilot-instructions.md` → `<ws>/.github/copilot-instructions.md` (if one exists, append the missing
  sections instead of replacing it).
- Agents → `<ws>/.github/agents/<name>.agent.md`.
- Prompts → `<ws>/.github/prompts/` (copy both `pr-description.prompt.md` and `pr-description.template.md`).
- Backlog → `<ws>/.github/plans/backlog.md` (skip if it exists).
- **Hooks** (only those selected): copy the hook's script(s) from `scripts/hooks/` to `<ws>/.github/hooks/scripts/`,
  copy `copilot/hooks/<id>.json` to `<ws>/.github/hooks/<id>.json` with `<WS>` replaced by the absolute workspace
  path (forward slashes). One file per hook, so no merging is needed; if the target exists, ask. Hooks need
  `chat.useHooks` (on by default) and a trusted workspace, and are a VS Code preview feature. Copilot passes no matcher,
  so the scripts filter by tool name or command themselves.
- **RTK / QMD** (only if selected): follow their READMEs in `copilot/plugins/`; show what will change first, merge never overwrite.
- **Terminal allowlist**: merge `copilot/templates/terminal-autoapprove.json` into `<ws>/.vscode/settings.json`
  (or the user settings if they want it everywhere). Those files may contain comments; if
  `scripts/merge-settings.js` cannot parse the file, add the entry by hand. Behaviour of auto-approve varies by VS Code version.
- Agent `model:` is intentionally left out so the user's model picker decides. Tool names are Copilot
  aliases (`read`, `search`, `edit`, `execute`, `web`).

## 4. Where the files must NOT go
- This `<ws>/.github/` is the **workspace-root** folder (the parent of the repos), not inside any repo.
  VS Code picks it up when the workspace root is opened as the folder.
- If the user also wants repo-level Copilot instructions in an individual repo, create
  `<repo>/.github/copilot-instructions.md` there but add it to that repo's `.git/info/exclude` so it is
  never committed. Never edit a repo's tracked `.gitignore`. If the file is already tracked, leave it and
  tell the user.
- Copilot also reads `CLAUDE.md` and `AGENTS.md` at a repo root, so a repo that already has a
  git-excluded `CLAUDE.md` gets those instructions in Copilot too, without duplicating them.

## 5. Verify
- Each installed agent/prompt file starts with valid `---` YAML frontmatter.
- Each installed `<ws>/.github/hooks/*.json` parses as JSON and the scripts it references exist.
- No Copilot files were written inside any repo unless git-excluded.
- Tell the user to reload the VS Code window, then check that the agents appear in the Copilot chat agent
  picker and `/pr-description` appears in the slash menu. These checks need the real editor; say so if
  you can't run them.
- Record each installed item: `node scripts/manifest.js add <id> --kind <agent|prompt|hook|plugin|extra> --workspace <ws>` (ids such as `copilot-agent-junior`, `copilot-instructions`, `copilot-prompt-pr-description`, `copilot-hook-<id>`, `copilot-rtk`, `copilot-qmd`, `copilot-terminal-allowlist`). Updates depend on this.
- Do not commit or push anything unless asked.

## Notes
- Copilot agent/prompt file formats change between releases. If a file isn't picked up, check GitHub's
  current docs for custom agents and prompt files, then update the generator in `scripts/build.js`. Hooks are a preview feature; the tool names and
  `tool_input` shape Copilot sends to hooks are not documented, so the hook scripts match loosely. Check the agent debug
  log if a hook doesn't fire.
- Path-specific `.github/instructions/*.instructions.md` files are not generated: they hold rules for specific languages or folders, and this generic setup has none. Only a skeleton is provided.
