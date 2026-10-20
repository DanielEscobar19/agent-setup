# UPDATE.md — instructions for Claude (or any coding agent)

Use this when the setup is already installed and the repo has new commits. It brings the installed
files up to date **without** clobbering the user's local changes.

## For the user (two commands)
```bash
cd agent-setup && git pull
claude        # or codex, or Copilot Chat in agent mode
```
Then say: **"Follow UPDATE.md and update my agent setup."**

## Steps for the agent

### 1. Check the checkout
- `git status --short` in the repo must be clean. If not, tell the user and stop (local edits in this
  checkout would be mixed into the update).
- `node scripts/selftest.js` must pass. If it fails, stop and report.

### 2. See what changed
- `node scripts/manifest.js status` lists every installed item with the commit it was installed from,
  whether it is up to date, and which repo files changed since then.
- `git log --oneline <installedCommit>..HEAD` for the human-readable summary. Show the user a short
  digest of what's new before changing anything.
- Also look for items that exist now but were never installed (new agents, hooks, plugins, skills in
  `claude/plugins/catalog.json`, `copilot/templates/`, `codex/templates/`). List them as "New available" and ask which to add.
  Use `claude/SETUP.md` / `copilot/SETUP.md` / `codex/SETUP.md` to install those.

### 2b. Repo-level steps
Some setup steps act on the repos inside the workspace rather than on an installed item, so the manifest and the
template comparison never see them: the per-repo init (`claude/SETUP.md` step 8, `codex/SETUP.md` step 3b,
`copilot/SETUP.md` step 3b) and its `.git/info/exclude` entries. On every update, for each tool that is installed:
- List the git repos directly under `<ws>`; note which have the tool's repo file (`CLAUDE.md`, `AGENTS.md`,
  `.github/copilot-instructions.md`).
- For repos that lack it, offer the init step once (multiSelect) and do it as the SETUP file describes: draft from the
  real repo, show the draft, save it. Check an existing sibling file (e.g. a `CLAUDE.md`) for commands, but verify them
  against the code, since they can be stale.
- For repos that already have the file, check it is still accurate (these files go stale, e.g. after a folder move or a
  package-manager change). Only mechanical facts, read-only: every path it mentions exists; every command it lists still
  exists in `package.json` scripts, `Makefile`, `pyproject.toml` or the README's run section; the stack/tool names match the
  manifests; sibling files (`CLAUDE.md` vs `AGENTS.md` vs `copilot-instructions.md`) don't contradict each other. Report the
  drift as a short list per repo ("line X says `npm run test:frontend`, but the script is now `frontend:test`") and propose the
  exact edits. The files are user-owned: apply an edit only after the user agrees, change only the wrong lines, and never
  rewrite or reformat the rest. If nothing is wrong, say it is up to date.
- Always make sure the file and any tool folder/marker patterns are in the repo's `.git/info/exclude`, even when the
  repo file already exists. Never edit a tracked `.gitignore`.

### 3. Update each installed item
Installed copy ↔ repo source (the repo side is generated from `shared/`):

| Installed file | Repo source |
|---|---|
| `<ws>/.claude/agents/<n>.md` | `claude/templates/agents/<n>.md` |
| `<ws>/.claude/skills/<n>/` | `claude/templates/skills/<n>/` |
| `<ws>/CLAUDE.md` | `claude/templates/workspace/CLAUDE.md` |
| `<ws>/README.md` | `shared/templates/workspace-readme.md` (only the section structure; see below) |
| `<ws>/.claude/scripts/<s>.js` | `scripts/hooks/<s>.js` |
| `<ws>/.github/agents/<n>.agent.md` | `copilot/templates/agents/<n>.agent.md` |
| `<ws>/.github/prompts/*` | `copilot/templates/workspace/.github/prompts/*` |
| `<ws>/.github/copilot-instructions.md` | `copilot/templates/workspace/.github/copilot-instructions.md` |
| `<ws>/.codex/agents/<n>.toml` | `codex/templates/agents/<n>.toml` |
| `<ws>/.agents/skills/<n>/` | `codex/templates/skills/<n>/` |
| `<ws>/AGENTS.md` | `codex/templates/workspace/AGENTS.md` |
| `<ws>/.codex/hooks/<s>.js`, `<ws>/.github/hooks/scripts/<s>.js` | `scripts/hooks/<s>.js` |

For each file whose source changed since the recorded commit:
1. Read the version the user originally got: `git show <installedCommit>:<repo-source-path>`.
2. Compare it with the installed file:
   - **Identical** → the user never customized it. Overwrite with the new version, no question.
   - **Different** → the user customized it. Show both diffs (old upstream → new upstream, and installed
     → new upstream) and ask: keep mine / take the new one / merge by hand. Never overwrite silently.
   - **Missing** → the user deleted it on purpose. Skip it and mention it.
3. Hook and settings JSON is never copied over. Re-run `node scripts/merge-settings.js ... --dry-run`
   with the item's snippet, show the report, then run it for real. It adds new hooks and keeps existing
   values.
4. Plugins/tools (qmd, rtk): only act if `claude/plugins/<id>/README.md` or the catalog entry changed;
   follow the changed steps, don't reinstall what already works.

**Never touch** user-owned content: `<ws>/README.md` (at most refresh the table between the `repos:start`/`repos:end` markers after asking, and mention new template sections), `<ws>/.claude/plans/backlog.md` and other plans,
`<ws>/.claude/qmd-map.json`, memories, `settings.local.json`, repo-level `CLAUDE.md` files. If the
backlog *template* gained a new section, mention it and let the user decide.

### 4. Record and verify
- `node scripts/manifest.js add <id> --kind <kind> --workspace <ws>` for every item handled, so the
  next update starts from the new commit.
- Re-run the verification checklist from `claude/SETUP.md` step 9 (Claude), `copilot/SETUP.md` step 5 or `codex/SETUP.md` step 5.
- Tell the user to restart Claude Code or Codex (or reload the VS Code window).
- Do not commit or push anything unless asked.

## Updating from the first layout (before commit `f460842`)
Older installs used these paths; the installed files in the workspace are unchanged, only the repo
paths moved:

| Old repo path | New repo path |
|---|---|
| `SETUP.md` (Claude steps) | `claude/SETUP.md` |
| `plugins/`, `hooks/`, `global/` | `claude/plugins/`, `claude/hooks/`, `claude/global/` |
| `templates/agents/`, `templates/skills/`, `templates/workspace/`, `templates/memory/`, `templates/permissions.local.json` | the same names under `claude/templates/` |

The old manifest lived at `~/.claude/.claude-setup.json`; `scripts/manifest.js` reads it and migrates it
to `~/.agent-setup/manifest.json` on the next `add`. Agent files gained a "GENERATED" comment line and
skills/instructions were lightly reworded, so expect the "customized" branch to trigger for them even if
the user changed nothing. Batch those into one question ("these differ only by the new header; take the
new versions?") instead of asking per file.

## Tip: changing things for good
If the user wants a different agent prompt or instruction everywhere, edit the source in `shared/`, run
`node scripts/build.js`, and push. A local edit to an installed file only lives on that machine and will
show up as "customized" at every update.
