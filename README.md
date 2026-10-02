# claude-setup

A portable, generic Claude Code setup: global instructions, settings, hooks, a tiered agent set, skills,
a workspace backlog convention, and a selectable plugin/tool catalog. Clone it onto a new machine or
workspace, run Claude, and let Claude install it for you.

## Prerequisites

- Claude Code, `git`, and Node.js 18+ (the helper scripts and QMD use it).
- Optional: `gh` (GitHub CLI) if you'll push changes back to this repo.

## Quick start

```bash
git clone https://github.com/DanielEscobar19/claude-setup.git
cd claude-setup
claude
```

Then tell Claude:

> Follow SETUP.md and install my Claude setup.

Claude inspects the machine, shows the plugin/hook/agent/skill list so you pick what to install, asks
for your workspace root, and merges (never overwrites) the config into `~/.claude` and the workspace.

## Layout

| Path | Purpose |
|---|---|
| `SETUP.md` | Step-by-step instructions Claude follows |
| `plugins/catalog.json` | Machine-readable list of everything installable |
| `plugins/<name>/README.md` | Install, verify and config notes per plugin (qmd, rtk) |
| `global/` | Files for `~/.claude/` (CLAUDE.md, base settings, RTK.md) |
| `hooks/` | Hook snippets merged into settings.json |
| `scripts/merge-settings.js` | Idempotent settings/hook merger (backs up, dedupes, reports conflicts) |
| `scripts/manifest.js` | Records what's installed in `~/.claude/.claude-setup.json` |
| `scripts/hooks/` | Cross-platform hook scripts (QMD tracking, commit guard, backlog reminder) |
| `templates/agents/` | Generic junior / mid / senior / planner / researcher agents |
| `templates/skills/` | Skill skeleton and a generic `pr-description` skill |
| `templates/workspace/` | Workspace CLAUDE.md and `.claude/plans/backlog.md` |
| `templates/permissions.local.json` | Optional safe git allowlist |
| `templates/memory/` | Optional seed memories (working-style preferences) |

## Conventions it sets up

- `.claude/` lives at the **workspace root**, never inside a repo.
- Repo-level `CLAUDE.md` files are allowed but git-excluded locally (`.git/info/exclude`).
- `.claude/plans/backlog.md` tracks small tasks and follow-ups across the workspace.
- Never push or open a PR without explicit confirmation.

## Rules this repo follows

- Generic only: no employer, project, or secret data. Keep it that way.
- Never store credentials here.
- Installation merges into existing settings and never deletes the user's config.

## Contributing / pushing changes

This repo has a single owner. Others can only propose changes through forks and pull requests; they
can't push to `main`. If you have multiple GitHub accounts, make sure pushes use the right one
(`gh auth switch`, or set `credential.username` in the repo's git config).
