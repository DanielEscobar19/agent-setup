# claude-setup

A portable, generic Claude Code setup: global instructions, settings, hooks, a tiered agent set,
and a selectable plugin/tool catalog. Clone it onto a new machine or workspace, run Claude, and
let Claude install it for you.

## Quick start

```bash
git clone https://github.com/DanielEscobar19/claude-setup.git
cd claude-setup
claude
```

Then tell Claude:

> Follow SETUP.md and install my Claude setup.

Claude will inspect the machine, show you the plugin/tool list, let you pick which to install,
and merge (never blindly overwrite) the config into `~/.claude` and your workspace.

## Layout

| Path | Purpose |
|---|---|
| `SETUP.md` | Step-by-step instructions Claude follows |
| `plugins/catalog.json` | Machine-readable list of installable plugins/tools |
| `plugins/<name>/README.md` | Install, verify and config notes per plugin |
| `global/` | Files that go to `~/.claude/` (CLAUDE.md, base settings) |
| `hooks/` | Optional hook snippets, merged into settings.json |
| `templates/agents/` | Generic junior / mid / senior / planner / researcher agents |
| `templates/workspace/` | Skeleton `.claude/` and CLAUDE.md for a workspace root |
| `templates/memory/` | Optional seed memories (working-style preferences) |

## Rules this repo follows

- Generic only: no employer, project, or secret data. Keep it that way.
- Never store credentials (`.credentials.json`, tokens) here.
- Installation merges into existing settings; it never deletes the user's existing config.
