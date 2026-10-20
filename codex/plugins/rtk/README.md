# RTK (Rust Token Killer) for Codex

Token-optimizing CLI proxy. Codex has no hook that rewrites commands, so RTK works through
instructions: `RTK.md` tells Codex to prefix shell commands with `rtk`.

## Install
Same binary as for Claude: `winget install rtk-ai.rtk` (other OS: the project's install instructions).
If `rtk gain` errors, a different "rtk" (Rust Type Kit) is installed; see `claude/plugins/rtk/README.md`.

## Configure
`rtk init --codex --global` writes `~/.codex/RTK.md` and adds an `@.../RTK.md` reference to
`~/.codex/AGENTS.md` (it creates the file if missing and does not patch any Claude settings).
Preview first with `rtk init --codex --global --dry-run`. Check with `rtk init --show`.
Without `--global`, it writes into the current project instead; run it from the workspace root only if
the user wants it workspace-local.

## Verify
`rtk --version`, `rtk gain`, and `~/.codex/AGENTS.md` references `RTK.md`. Restart Codex.
