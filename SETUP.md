# SETUP.md — instructions for Claude (or any coding agent)

You are installing the user's portable AI-agent setup from this repo.

## Step -1: first install or update?
Run `node scripts/manifest.js list`. If it shows installed items, this is an **update**: stop here and follow `UPDATE.md` instead. Only continue below for a first install (or when the user explicitly wants a fresh install).

## Step 0: which tool(s)?
Ask the user (AskUserQuestion, multiSelect) which tool(s) to set up on this machine:
- **Claude Code** → follow `claude/SETUP.md` completely.
- **GitHub Copilot** → follow `copilot/SETUP.md` completely.

If they pick both, do Claude first, then Copilot, and reuse the same workspace root. Don't repeat the
questions both flows share (workspace root, repo list).

Rules for every flow:
- Merge into what exists; never overwrite or delete the user's config.
- Never commit or push anything unless asked.
- Don't install anything the user didn't select.

## How this repo is organised
- `shared/` — tool-neutral sources of truth: agent roles, workspace instructions, skills, backlog template.
- `claude/`, `copilot/` — per-tool installers plus **generated** files built from `shared/`.
- `scripts/build.js` regenerates the per-tool files; `scripts/selftest.js` verifies everything.

To change an agent or an instruction for all tools, edit `shared/` and run `node scripts/build.js`.
