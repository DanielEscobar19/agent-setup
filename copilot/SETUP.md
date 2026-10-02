# GitHub Copilot setup — instructions for Claude (or any agent)

Installs the Copilot flavour of the shared setup into a workspace. Everything here is generated from
`shared/` (see `scripts/build.js`), so it carries the same conventions, agent roles and PR workflow as
the Claude setup.

What Copilot has and doesn't have, compared with Claude Code:
- Has: repo instructions, agents (`.agent.md`), prompt files (slash commands).
- Does **not** have hooks, plugins/marketplaces or a memory system. Those parts of the Claude setup have
  no Copilot equivalent and are skipped.

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
- **Path-specific instruction skeleton** (`copilot/templates/instructions/_skeleton.instructions.md`): optional; copy it to `<ws>/.github/instructions/<name>.instructions.md` only if the user wants scoped rules, and set `applyTo` with them.
- Workspace root `<ws>` (default suggestion: the parent folder of the user's repos).

## 3. Install into `<ws>/.github/`
- `copilot-instructions.md` → `<ws>/.github/copilot-instructions.md` (if one exists, append the missing
  sections instead of replacing it).
- Agents → `<ws>/.github/agents/<name>.agent.md`.
- Prompts → `<ws>/.github/prompts/` (copy both `pr-description.prompt.md` and `pr-description.template.md`).
- Backlog → `<ws>/.github/plans/backlog.md` (skip if it exists).
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
- No Copilot files were written inside any repo unless git-excluded.
- Tell the user to reload the VS Code window, then check that the agents appear in the Copilot chat agent
  picker and `/pr-description` appears in the slash menu. These checks need the real editor; say so if
  you can't run them.
- Record each installed item: `node scripts/manifest.js add <id> --kind <agent|prompt|extra> --workspace <ws>` (ids such as `copilot-agent-junior`, `copilot-instructions`, `copilot-prompt-pr-description`). Updates depend on this.
- Do not commit or push anything unless asked.

## Notes
- Copilot agent/prompt file formats change between releases. If a file isn't picked up, check GitHub's
  current docs for custom agents and prompt files, then update the generator in `scripts/build.js`.
- Path-specific `.github/instructions/*.instructions.md` files are not generated: they hold rules for specific languages or folders, and this generic setup has none. Only a skeleton is provided.
