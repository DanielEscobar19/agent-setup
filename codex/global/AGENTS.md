# Global Codex instructions

<!-- `rtk init --codex --global` adds an @RTK.md reference to this file (see codex/plugins/rtk/README.md). -->

- Prefer dedicated file/search tools over shell equivalents.
- Confirm before any outward-facing or hard-to-reverse action (push, PR creation, deletes).
- Committing locally is fine; always confirm before `git push`, every time.
- On Windows/PowerShell, use `rtk` only with real executables (git, npm, dotnet, ...). PowerShell cmdlets such as Get-ChildItem aren't programs, so run them without `rtk`, or as `rtk powershell -NoProfile -Command "..."`.
