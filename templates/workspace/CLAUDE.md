# CLAUDE.md

Workspace-level guidance for Claude Code when working across the repos in this folder.
Repo-specific guidance lives in each repo's own CLAUDE.md.

## Conventions

- Plans and working notes for multi-step features go in `.claude/plans/` at this workspace root, not inside any repo.
- Hooks, settings and agents live in this workspace's `.claude/`, never inside the individual repos.
- Individual repos may have their own `CLAUDE.md`, but it must be listed in that repo's `.git/info/exclude` (local-only, never committed or pushed). Do this whenever you create one.
- Never push or create a PR without showing the draft and getting explicit confirmation.
- Delegate: use junior/mid agents for implementation, senior for design and review.
