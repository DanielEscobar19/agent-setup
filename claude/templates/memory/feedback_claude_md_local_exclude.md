---
name: claude-md-local-exclude
description: New CLAUDE.md files in repos go to .git/info/exclude, keeping them local-only
metadata:
  type: feedback
---

When creating a CLAUDE.md (e.g. via init) inside a repo, add it to that repo's `.git/info/exclude` so it stays local and isn't pushed to the shared repo. Likewise keep `.claude/` at the workspace root, never inside a repo.

**Why:** Repos are shared with a team; Claude config is personal.
**How to apply:** After creating a repo-level CLAUDE.md, append it to `.git/info/exclude`.
