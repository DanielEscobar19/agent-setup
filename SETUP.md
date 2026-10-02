# SETUP.md — instructions for Claude

You are installing the user's portable Claude Code setup from this repo. Follow these steps in order.
Be additive: **merge** into existing files, never overwrite or delete the user's existing config. Show
the user what you will change before changing `~/.claude/settings.json`.

Terms: `<repo>` = the directory containing this file. `~/.claude` = `%USERPROFILE%\.claude` on Windows,
`$HOME/.claude` elsewhere. `<ws>` = the workspace root chosen in step 2.

**Operating-system rule:** the hook scripts here are Node.js and run on Windows, macOS and Linux. If
you ever need a hook or command that is shell-specific, write it for this machine's OS and shell
(check step 1) rather than copying a Windows/PowerShell snippet verbatim, and tell the user what you
adapted.

## 1. Inspect the machine
- OS and shell; availability of `node` (18+), `npm`, `git`, `gh`, and `winget`/`brew`/`apt`.
  If Node is missing, stop and ask the user to install it (the scripts need it).
- What exists: `~/.claude/settings.json`, `~/.claude/CLAUDE.md`, `~/.claude/plugins/installed_plugins.json`.
- `node <repo>/scripts/selftest.js` — checks that this repo's scripts and files work on this machine. If
  any check fails, stop and tell the user before installing anything.
- `node <repo>/scripts/manifest.js list` — what a previous run already installed (skip those unless the
  user wants a reinstall).
- Whether `qmd` and `rtk` are already on PATH.

## 2. Let the user choose
Read `plugins/catalog.json`. Use AskUserQuestion (multiSelect; split across several questions if needed)
for: plugins/tools (`items`), optional hooks, agents, skills, and extras. Mark what's already installed.
Then ask for the **workspace root** (default suggestion: the parent folder of the user's repos).
Install nothing that wasn't selected.

## 3. Merging settings (applies to every step below)
Never hand-edit JSON for hooks/settings. Use the merge script:
```
node <repo>/scripts/merge-settings.js --target <settings.json> --source <snippet.json> [--var NAME=value] --dry-run
```
Run with `--dry-run` first, show the user the added/skipped/conflicts report, then run it for real. It
backs up the target, dedupes hooks, drops `_note` keys, and keeps existing scalar values (conflicts are
reported; use `--overwrite` only if the user agrees). Global settings: `~/.claude/settings.json`.
Workspace settings: `<ws>/.claude/settings.json`. Personal workspace settings:
`<ws>/.claude/settings.local.json`.

## 4. Extras (if selected)
- **global-base:** `global/CLAUDE.md` → `~/.claude/CLAUDE.md` (copy if missing, otherwise append missing
  lines). `global/settings.base.json` → merge into `~/.claude/settings.json`.
- **permissions:** merge `templates/permissions.local.json` into `<ws>/.claude/settings.local.json`.
- **seed-memories:** memory lives at `~/.claude/projects/<workspace-path-slug>/memory/` (the slug is the
  absolute workspace path with separators and `:` replaced by `-`; copy the form of an existing entry in
  `~/.claude/projects/`). Copy `templates/memory/*` there, merging `MEMORY.md` lines without duplicates.

## 5. Plugins/tools (each selected `items` entry)
Follow `plugins/<id>/README.md` exactly: install, configure, then run its Verify step and report the
result. Ask the user for anything user-specific (e.g. QMD collection names and folders); never guess.

## 6. Hooks (each selected `optionalHooks` entry, plus any listed under a plugin)
All three optional hooks are workspace-scoped. For each: create `<ws>/.claude/scripts/`, copy the
entry's `scripts` files there, then merge the entry's `file` into `<ws>/.claude/settings.json`
(step 3). For `qmd-tracking` also create `<ws>/.claude/qmd-map.json` (see `plugins/qmd/README.md`).

## 7. Workspace (if `workspace-skeleton`, agents or skills were selected)
- Copy `templates/workspace/CLAUDE.md` to `<ws>/CLAUDE.md` (append missing sections if one exists).
- Copy `templates/workspace/.claude/plans/backlog.md` to `<ws>/.claude/plans/backlog.md` (skip if it exists).
- Copy chosen agents from `templates/agents/` to `<ws>/.claude/agents/`. If QMD is installed, uncomment
  the QMD tool hints in planner/researcher and ask which collections they should search.
- Copy chosen skill folders from `templates/skills/` to `<ws>/.claude/skills/` (don't overwrite an
  existing skill of the same name).
- **`.claude/` lives only at the workspace root.** Never put hooks, settings, agents or skills inside
  an individual repo.

## 8. Repos inside the workspace
- **Optional: init each repo.** List the git repos directly under `<ws>` and ask (multiSelect) which
  should get a repo-level `CLAUDE.md`. For each selected repo that lacks one, run the `init` skill with
  that repo as the working directory. Skip repos that already have one.
- **Always, right after init (and for every repo that already has a `CLAUDE.md`):** append `CLAUDE.md`
  to that repo's `.git/info/exclude` (create the file if missing, skip lines already present), and also
  `.claude/` and `**/.claude/.qmd-dirty-*` if QMD tracking was installed. Don't edit tracked
  `.gitignore` files. If `CLAUDE.md` is already tracked by git, skip that repo and tell the user.
- Folders in `<ws>` that aren't git repos need nothing.

## 9. Record and verify
- For every installed item: `node <repo>/scripts/manifest.js add <id> --kind <plugin|hook|agent|skill|extra> --workspace <ws>`.
- Verification checklist; report each as pass/fail:
  - `~/.claude/settings.json` and `<ws>/.claude/settings.json` parse as valid JSON.
  - Each installed CLI answers (`qmd --version`, `rtk --version`/`rtk gain`).
  - `<ws>/.claude/` contains the expected agents/skills/scripts; no `.claude/` inside any repo.
  - Each repo's `CLAUDE.md` is untracked and listed in its `.git/info/exclude` (`git status` is clean of it).
  - Hook scripts run: `echo '{}' | node <ws>/.claude/scripts/<script>.js ...` exits 0 without errors.
- Summarize what was installed, skipped, and any manual follow-ups. Tell the user to restart Claude Code
  (or run `/reload-plugins`) so plugins and hooks load.
- Do not commit or push anything unless asked.
