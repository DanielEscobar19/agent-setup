# RTK (Rust Token Killer)

Token-optimizing CLI proxy for Bash output.

## Install
- Windows: `winget install rtk-ai.rtk`. Other OS: follow the project's install instructions; the binary must be on PATH.
- Name collision: a different "rtk" (Rust Type Kit) exists. Verify with `rtk gain`; if it errors, the wrong binary is installed.

## Configure
Preferred: `rtk init --global --auto-patch` (patches `~/.claude/settings.json` with the hook and writes
`~/.claude/RTK.md`). Check the result with `rtk init --show`.

Fallback if that doesn't produce the hook / `RTK.md` (merge, never overwrite):
1. Copy `global/RTK.md` to `~/.claude/RTK.md` and make sure `~/.claude/CLAUDE.md` contains the line `@RTK.md`.
2. Merge `claude/hooks/rtk.json` into `~/.claude/settings.json` with `scripts/merge-settings.js`.

## Verify
`rtk --version`, `rtk gain`, and a Bash call in Claude shows rewritten `rtk ...` commands.
