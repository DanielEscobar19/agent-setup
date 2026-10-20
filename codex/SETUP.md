# OpenAI Codex setup — instructions for Claude (or any agent)

Installs the Codex flavour of the shared setup into a workspace. The workspace files are generated from
`shared/` (see `scripts/build.js`), so they carry the same conventions, agent roles and PR workflow as
the Claude and Copilot setups. Hooks, permissions and global settings have Codex equivalents too.

How each Claude piece maps to Codex:

| Claude | Codex |
|---|---|
| `CLAUDE.md`, `.claude/agents`, skills, backlog | `AGENTS.md`, `.codex/agents/*.toml`, `.agents/skills/`, `.codex/plans/backlog.md` |
| Hooks (`settings.json`) | `<ws>/.codex/hooks.json` + scripts in `<ws>/.codex/hooks/` (same hook scripts) |
| RTK hook | instruction-based: `rtk init --codex --global` (Codex has no command-rewrite hook) |
| QMD plugin | MCP server in `~/.codex/config.toml` + the same index-tracking hooks |
| `permissions.local.json` allowlist | `~/.codex/rules/default.rules` (`prefix_rule` allow) |
| Global `CLAUDE.md` + `settings.base.json` | `~/.codex/AGENTS.md` + base keys in `~/.codex/config.toml` |
| Seed memories | not needed: the same rules are already in the workspace `AGENTS.md` (Codex's own memory is automatic) |

Terms: `<repo>` = the root of this repo. `<ws>` = the workspace root chosen in step 2. Paths are relative
to `<repo>` unless they start with `<ws>`.

## 1. Inspect
- `node scripts/selftest.js` must pass (it also checks the generated Codex files are current).
- Which of these already exist in `<ws>` (never overwrite; merge or skip, and tell the user):
  `AGENTS.md`, `.codex/agents/`, `.agents/skills/`, `.codex/plans/`, `.codex/hooks.json`.

## 2. Let the user choose (AskUserQuestion, multiSelect)
- **Workspace instructions** (`codex/templates/workspace/AGENTS.md`).
- **Agents** (`codex/templates/agents/*.toml`): junior, mid, senior, planner, researcher.
- **Skills** (`codex/templates/skills/`): `pr-description`. `_skeleton` is a blank to copy when authoring a new skill; install it only on request.
- **Backlog** (`.codex/plans/backlog.md`).
- **Workspace README** (`<ws>/README.md`, shared with Claude): follow step 8b of `claude/SETUP.md`; skip if it already exists.
- **Hooks** (optional, per hook, workspace scope):
  - `no-ai-attribution-in-commits` (`codex/hooks/block-claude-in-commits.json`): blocks commits whose command mentions Claude/Anthropic or a Codex/Copilot co-author line.
  - `backlog-reminder` (`codex/hooks/backlog-reminder.json`): end-of-turn reminder to update `.codex/plans/backlog.md`.
  - `qmd-tracking` (`codex/hooks/qmd-tracking.json`): re-index QMD collections; requires QMD.
- **RTK** (token-saving CLI proxy): `codex/plugins/rtk/README.md`. Touches `~/.codex/`.
- **QMD** (local search, as an MCP server): `codex/plugins/qmd/README.md`. Touches `~/.codex/config.toml`.
- **Permissions allowlist** (`codex/templates/default.rules`): safe read-only git commands. Touches `~/.codex/rules/`.
- **Global base** (`codex/global/AGENTS.md`, `codex/global/config.base.toml`): global instructions and base settings (reasoning effort, notifications). Touches `~/.codex/`.
- Workspace root `<ws>` (default suggestion: the parent folder of the user's repos).

## 3. Install
- `AGENTS.md` → `<ws>/AGENTS.md` (if one exists, append the missing sections instead of replacing it).
- Agents → `<ws>/.codex/agents/<name>.toml`.
- Skills → `<ws>/.agents/skills/<name>/` (copy the whole folder; don't overwrite a skill of the same name).
- Backlog → `<ws>/.codex/plans/backlog.md` (skip if it exists).
- Agent `model` is intentionally left out so the user's Codex config decides. `model_reasoning_effort`
  is tiered (junior low, mid/researcher medium, senior/planner high). Subagents inherit the parent's
  sandbox and approvals, so read-only roles are enforced by their instructions, not by a tool list.
- **Hooks** (only those selected):
  1. Copy the hook's script(s) from `scripts/hooks/` to `<ws>/.codex/hooks/` (`qmd-hook.js` also needs
     `<ws>/.codex/qmd-map.json`; see `codex/plugins/qmd/README.md`).
  2. Merge the hook snippet into `<ws>/.codex/hooks.json`:
     `node scripts/merge-settings.js --target <ws>/.codex/hooks.json --source codex/hooks/<id>.json --var WS=<ws with forward slashes> --dry-run`,
     show the report, then run it for real. It never overwrites existing hooks and backs the file up.
  3. Codex runs a hook only after it is trusted: tell the user to open `/hooks` in Codex and trust the new ones.
     Project hooks also load only when the project's `.codex/` layer is trusted.
  Use one hook format per layer: if `<ws>/.codex/config.toml` already has inline `[hooks]`, tell the user and ask which to use.
- **Permissions**: append the rules from `codex/templates/default.rules` that are missing to
  `~/.codex/rules/default.rules` (create the folder/file if needed). Check with
  `codex execpolicy check --pretty --rules ~/.codex/rules/default.rules -- git status`.
- **Global base**: append the lines from `codex/global/AGENTS.md` that are missing to `~/.codex/AGENTS.md`
  (keep any `@RTK.md` reference rtk added). Add only the missing keys of `codex/global/config.base.toml` to
  `~/.codex/config.toml`; put top-level keys above the first `[table]` and never change a value the user already set.
- **RTK / QMD** (only if selected): follow their READMEs in `codex/plugins/`. These edit the user's global
  `~/.codex/` files, so show what will change (`rtk init --codex --global --dry-run`; the TOML block)
  and merge, never overwrite. Ask before installing a missing binary.

## 4. Where the files must NOT go
- `<ws>` is the **workspace root** (the parent of the repos), not inside any repo. Codex walks from the
  git root down to the current directory, so launch it from `<ws>` (or have `<ws>` be the project root)
  for the workspace `AGENTS.md` to load. If `<ws>` is not a git repo Codex only reads the current
  directory, so say so and suggest starting Codex from `<ws>`.
- Repo-level `AGENTS.md` files are allowed but must be listed in that repo's `.git/info/exclude`. Never
  edit a repo's tracked `.gitignore`. If the file is already tracked, leave it and tell the user.
- Combined `AGENTS.md` content is capped at 32 KiB by default (`project_doc_max_bytes`); keep the
  workspace file small.
- Copilot also reads `AGENTS.md`, so installing both tools gives Copilot this file too.

## 5. Verify
- Each installed agent file parses as TOML and has `name`, `description` and `developer_instructions`.
- Each installed skill folder contains `SKILL.md` with `name` and `description` frontmatter.
- `<ws>/.codex/hooks.json` parses as JSON and every script it references exists.
- No Codex files were written inside any repo unless git-excluded.
- Tell the user to restart Codex from `<ws>`, trust the hooks in `/hooks`, then check that the agents are
  listed and `$pr-description` (or `/skills`) shows the skill. These checks need the real tool; say so if you can't run them.
- RTK: `rtk gain` works and `~/.codex/AGENTS.md` references `RTK.md`. QMD: `qmd --version` works and `[mcp_servers.qmd]` is in `~/.codex/config.toml`; `/mcp` in Codex lists it.
- Record each installed item: `node scripts/manifest.js add <id> --kind <agent|skill|hook|plugin|extra> --workspace <ws>` (ids such as `codex-agent-junior`, `codex-hook-<id>`, `codex-rtk`, `codex-qmd`, `codex-permissions`, `codex-global-base`, `codex-instructions`, `codex-skill-pr-description`). Updates depend on this.
- Do not commit or push anything unless asked.

## Notes
- Codex file formats change between releases. If a file isn't picked up, check OpenAI's current docs for
  AGENTS.md, skills, custom agents, hooks and rules, then update the generator in `scripts/build.js`.
- The `backlog-reminder` hook returns a `systemMessage` on `Stop`; if a Codex version rejects that, drop the hook.
