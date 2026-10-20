# RTK (Rust Token Killer) for Copilot

Token-optimizing CLI proxy. `rtk init --copilot` installs the Copilot integration (VS Code + CLI): it adds
instructions plus a Copilot hook config (`rtk-rewrite.json`) that rewrites shell commands.

## Install
Same binary as for Claude: `winget install rtk-ai.rtk` (other OS: the project's install instructions).
If `rtk gain` errors, a different "rtk" (Rust Type Kit) is installed; see `claude/plugins/rtk/README.md`.

## Configure
Preview first: `rtk init --copilot --dry-run` (workspace-local) or `rtk init --copilot --global --dry-run`.
- Workspace-local (run from `<ws>`): adds to `<ws>/.github/copilot-instructions.md` and creates
  `<ws>/.github/hooks/rtk-rewrite.json`. If the instructions file already exists, rtk appends to it.
- Global (`--global`): `~/.copilot/copilot-instructions.md` and `~/.copilot/hooks/rtk-rewrite.json`.
Pick one scope with the user; show the dry-run output before writing.

## Verify
`rtk --version`, `rtk gain`, the hook file exists, then reload the VS Code window and run a terminal
command in agent mode; it should show as an `rtk ...` command. Needs `chat.useHooks` (on by default) and a trusted workspace.
