# RTK (Rust Token Killer)

Token-optimizing CLI proxy for Bash output.

## Install
- Windows: `winget search rtk` to find the package id, then `winget install <id>`.
- Other OS: follow the project's install instructions; the binary must be on PATH.
- Name collision: a different "rtk" (Rust Type Kit) exists. Verify with `rtk gain`; if it errors, the wrong binary is installed.

## Configure
1. Copy `global/RTK.md` to `~/.claude/RTK.md`.
2. Ensure `~/.claude/CLAUDE.md` contains the line `@RTK.md` (append; keep existing content).
3. Merge `hooks/rtk.json` into `~/.claude/settings.json` (PreToolUse, matcher `Bash`, command `rtk hook claude`).

## Verify
`rtk --version`, `rtk gain`.
