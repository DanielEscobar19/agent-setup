# Copilot instructions

<!-- GENERATED from shared/instructions/workspace.md by scripts/build.js — edit the source, not this file. -->

Workspace-level guidance for the AI coding agent when working across the repos in this folder.
Repo-specific guidance lives in each repo's own instruction file.

## Conventions

- Plans and working notes for multi-step features go in `.github/plans/` at this workspace root, not inside any repo.
- Agent configuration (`.github/`) lives at this workspace root, never inside the individual repos.
- Individual repos may have their own instruction file (`.github/copilot-instructions.md`), but it must be listed in that repo's `.git/info/exclude` (local-only, never committed or pushed). Do this whenever you create one.
- Never push or create a PR without showing the draft and getting explicit confirmation.
- Delegate: use junior/mid agents for implementation, senior for design and review.

## Backlog

- `.github/plans/backlog.md` is the workspace task tracker for small items and follow-ups found along the way.
- When you discover a side issue you are not fixing now, add it as an unchecked `- [ ]` item (what, where, why, and a plan link if any). Don't silently drop it.
- When work completes (or a PR merges), tick the item and note the branch/PR. Update it before ending a session in which anything was completed.
- Items that need more than a few lines get their own plan file in `.github/plans/`, linked from the backlog entry.
