# Skills

Skills live in `<workspace>/.claude/skills/<name>/SKILL.md` (workspace-wide) or `~/.claude/skills/<name>/`
(all workspaces). Never inside an individual repo.

- `_skeleton/` — a blank skill to copy when creating a new one.
- `pr-description/` — drafts a PR description from git history using a PR template. Generic: it uses the
  template in its own `templates/` folder, or the repo's own PR template if there is one.

Install = copy the chosen folder(s) into `<workspace>/.claude/skills/`. Don't overwrite an existing skill
with the same name; ask first.
