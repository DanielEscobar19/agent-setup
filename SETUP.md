# SETUP.md — instructions for Claude

You are installing the user's portable Claude Code setup from this repo. Follow these steps in order.
Be additive: **merge** into existing files, never overwrite or delete the user's existing config. Show
the user what you will change before changing `~/.claude/settings.json`.

Paths: `~/.claude` is `$env:USERPROFILE\.claude` on Windows, `$HOME/.claude` elsewhere. `<repo>` is the
directory containing this file.

## 1. Inspect the machine
- OS and shell; whether `node`, `npm`, `git`, `gh`, `winget`/`brew` are available.
- What already exists: `~/.claude/settings.json`, `~/.claude/CLAUDE.md`, `~/.claude/plugins/installed_plugins.json`.
- Which of `qmd` and `rtk` are already on PATH (`qmd --version`, `rtk --version`).

## 2. Let the user choose (use AskUserQuestion, multiSelect)
Read `plugins/catalog.json`. Ask which of these to install; mark already-installed ones:
- **Plugins/tools** (`items`): qmd, rtk.
- **Optional hooks** (`optionalHooks`).
- **Agents** (`optionalAgents`): junior, mid, senior, planner, researcher.
- **Extras**: global base settings, seed memories, workspace skeleton.
Don't install anything the user didn't select.

## 3. Global base (if selected)
- `global/CLAUDE.md`: if `~/.claude/CLAUDE.md` is missing, copy it; otherwise append missing lines.
- `global/settings.base.json`: merge keys into `~/.claude/settings.json`, but don't overwrite keys that already have a value without asking.

## 4. Each selected plugin/tool
Follow its `details` README in `plugins/<id>/README.md` exactly (install, config, verify).
After installing, run its Verify step and report the result.
- Plugins that need user-specific input (e.g. QMD collection names and paths): **ask**, never guess.
- Merge hook files from `hooks/` into the right `settings.json` (global for tool-wide hooks like rtk; the
  workspace `.claude/settings.json` for workspace-specific ones). Merging a hooks file means: for each
  event, append the entries to the existing array, skipping any whose `command` is already present.
  Strip `_note` keys. Fill `<PLACEHOLDERS>`. Hooks marked "Windows PowerShell form" need translating on
  macOS/Linux.

## 5. Workspace setup (if selected)
Ask which directory is the workspace root (default: the parent folder of the user's repos).
- Copy `templates/workspace/CLAUDE.md` to `<workspace>/CLAUDE.md` (merge if one exists).
- Create `<workspace>/.claude/plans/`.
- Copy chosen agents from `templates/agents/` to `<workspace>/.claude/agents/`. If QMD was installed,
  uncomment the QMD tool hints in planner/researcher and ask which collections they should search.
- Never put Claude hooks/settings/agents inside the individual repos.

## 6. Seed memories (if selected)
Memory lives at `~/.claude/projects/<workspace-path-slug>/memory/`. The slug is the absolute workspace path
with separators and `:` replaced by `-` (check an existing `~/.claude/projects/` entry for the exact form).
Copy `templates/memory/*` there, merging `MEMORY.md` lines without duplicates.

## 7. Finish
- Summarize what was installed, what was skipped, and any manual follow-ups.
- Tell the user to restart Claude Code (or run `/reload-plugins`) so plugins and hooks load.
- Do not commit or push anything unless asked.
