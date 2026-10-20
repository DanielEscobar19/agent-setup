# agent-setup

A portable, generic AI coding-agent setup for **Claude Code**, **GitHub Copilot** and **OpenAI Codex**: workspace
conventions, tiered agents, skills/prompts, a backlog convention, and (for Claude) hooks and a selectable
plugin catalog. Clone it onto a new machine or workspace, start your agent, and let it install the setup.

## Prerequisites

- Claude Code, VS Code with GitHub Copilot and/or OpenAI Codex, plus `git` and Node.js 18+ (the helper scripts and
  QMD use it).
- Optional: `gh` (GitHub CLI) if you'll push changes back to this repo.

## Quick start

```bash
git clone https://github.com/DanielEscobar19/agent-setup.git
cd agent-setup
claude        # or `codex`, or open the folder in VS Code and use Copilot Chat in agent mode
```

Then tell the agent:

> Follow SETUP.md and install my agent setup.

It asks which tool(s) you want, lets you pick plugins/hooks/agents/skills, asks for your workspace root,
and merges (never overwrites) the config into your machine and workspace.

## How it's organised

One source of truth, per-tool adapters:

```
shared/    tool-neutral sources: agent roles, workspace instructions, skills, backlog template
claude/    Claude Code installer + generated files + plugin catalog, hooks, global config, memory seeds
copilot/   GitHub Copilot installer + generated files (instructions, agents, prompts)
codex/     OpenAI Codex installer + generated files (AGENTS.md, agents, skills)
scripts/   build.js (shared -> per-tool), merge-settings.js, manifest.js, selftest.js, hook scripts
```

| Capability | Claude Code | Copilot | Codex |
|---|---|---|---|
| Workspace instructions | `CLAUDE.md` | `.github/copilot-instructions.md` | `AGENTS.md` |
| Agents (junior/mid/senior/planner/researcher) | `.claude/agents/*.md` | `.github/agents/*.agent.md` | `.codex/agents/*.toml` |
| PR-description workflow | skill | prompt file `/pr-description` | skill (`.agents/skills/`) |
| Backlog tracker | `.claude/plans/backlog.md` | `.github/plans/backlog.md` | `.codex/plans/backlog.md` |
| Workspace README (dev notes, run table) | `<ws>/README.md` | `<ws>/README.md` | `<ws>/README.md` |
| Hooks (commit guard, backlog reminder, QMD tracking) | `settings.json` | `.github/hooks/*.json` (VS Code preview) | `.codex/hooks.json` |
| RTK (token saver) | hook | `rtk init --copilot` | `rtk init --codex` (instructions, no hook) |
| QMD (local search) | plugin | MCP (`.vscode/mcp.json`) | MCP (`~/.codex/config.toml`) |
| Safe read-only git allowlist | `settings.local.json` | `chat.tools.terminal.autoApprove` | `~/.codex/rules/default.rules` |
| Global instructions + base settings | `~/.claude/` | model picker (nothing to install) | `~/.codex/AGENTS.md` + `config.toml` |
| Plugin marketplace, seed memories | yes | no | no (workspace instructions already carry the memory rules) |

To change an agent or an instruction for every tool, edit `shared/` and run `node scripts/build.js`.
`node scripts/selftest.js` fails if the generated files are out of date.

## Updating

```bash
cd agent-setup && git pull
claude        # or codex, or Copilot Chat in agent mode
```

Then say: *"Follow UPDATE.md and update my agent setup."* It compares what you installed with what changed,
overwrites only files you never customized, asks about the ones you edited, and never touches your backlog,
plans, memories or local settings. See `UPDATE.md`.

## Conventions it sets up

- Agent config lives at the **workspace root**, never inside a repo.
- Repo-level instruction files (`CLAUDE.md`, etc.) are allowed but git-excluded locally (`.git/info/exclude`).
- A workspace backlog tracks small tasks and follow-ups.
- Never push or open a PR without explicit confirmation.

## Rules this repo follows

- Generic only: no employer, project, or secret data. Keep it that way.
- Never store credentials here.
- Installation merges into existing settings and never deletes the user's config.

## Contributing / pushing changes

This repo has a single owner. Others can only propose changes through forks and pull requests; they
can't push to `main`. If you have multiple GitHub accounts, make sure pushes use the right one
(`gh auth switch`, or set `credential.username` in the repo's git config).
