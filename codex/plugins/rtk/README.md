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

## Windows / PowerShell
Codex runs commands in PowerShell on Windows. `rtk` wraps programs, not cmdlets: `rtk git status` works, `rtk Get-ChildItem`
fails. `codex/global/AGENTS.md` carries a line telling Codex this; keep it when merging into `~/.codex/AGENTS.md`.
For a cmdlet that must go through rtk: `rtk powershell -NoProfile -Command "..."`.

`rtk init --codex` writes `~/.codex/RTK.md` with the blunt rule "Always prefix shell commands with `rtk`." After every
`rtk init` (install or update), replace that sentence in `~/.codex/RTK.md` with the three lines above:

> Prefix shell commands that run a real executable with `rtk` (git, npm, cargo, dotnet, ...).
> On Windows, PowerShell cmdlets (Get-ChildItem, Select-String, ...) are not executables: run them without `rtk`,
> or as `rtk powershell -NoProfile -Command "..."`.

rtk owns that file, so a later `rtk init` or rtk upgrade can restore the old wording; check it when updating.

## Verify
`rtk --version`, `rtk gain`, and `~/.codex/AGENTS.md` references `RTK.md`. Restart Codex.
