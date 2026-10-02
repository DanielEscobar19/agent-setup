# Shared skills (source of truth)

Edit skills here, then run `node scripts/build.js` to regenerate the per-tool copies.

- `_skeleton/` — a blank skill to copy when creating a new one (Claude only).
- `pr-description/` — drafts a PR description from git history using a PR template. Generic: it uses
  the repo's own PR template if there is one, else the bundled default.

How each tool consumes them:
- **Claude Code:** copied to `<workspace>/.claude/skills/<name>/` (needs `SKILL.md`).
- **Copilot:** `pr-description` becomes a prompt file `.github/prompts/pr-description.prompt.md`.
