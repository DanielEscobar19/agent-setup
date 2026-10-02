---
name: pr-description
description: Draft a pull request title and description for the current branch from its commits and diff, using the repo's PR template. Only asks for what git can't tell (ticket link, media). Trigger with /pr-description.
---

# PR description generator

## 1. Find the template
Use the first that exists:
1. The repo's own template: `.azuredevops/pull_request_template.md`, `.github/pull_request_template.md`, `docs/pull_request_template.md`.
2. The bundled default template: `{{DEFAULT_TEMPLATE}}` (relative to this file).
Read it first and keep its structure and wording; only replace placeholders.

## 2. Gather git context yourself
- `git branch --show-current`; find the base branch (`git remote show origin`, usually `develop` or `main`).
- `git log <base>..HEAD --oneline` (exclude merge commits and commits unrelated to this branch) and `git diff <base>...HEAD --stat`.
- Read actual diffs when a commit subject alone isn't enough to describe the change accurately.

## 3. Ask only what git can't tell you, in one message
- Ticket URL(s) (accept "N/A" and don't ask again in the same conversation).
- Whether media (screenshot/gif/video) will be attached.
- Related PR in another repo, only if the change plainly has a counterpart.
Infer everything else (change description, deployment notes, DB/API changes) from the diff.

## 4. Output rules
- PR title: natural English with spaces, never camelCase/PascalCase. Follow the template's title format.
- Markdown links must never be wrapped in backticks (they stop being clickable).
- Show the drafted title and full description in chat and wait for explicit confirmation.
  Never create or update the PR before that confirmation.
