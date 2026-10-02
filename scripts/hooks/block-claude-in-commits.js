#!/usr/bin/env node
// PreToolUse hook (Bash, `if: Bash(git commit *)`): denies a commit whose command text
// mentions Claude or Anthropic. Cross-platform replacement for a shell one-liner.
let cmd = '';
try { cmd = (JSON.parse(require('fs').readFileSync(0, 'utf8')).tool_input || {}).command || ''; } catch { process.exit(0); }
if (/claude|anthropic/i.test(cmd)) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: 'Commit blocked: message mentions Claude or Anthropic.',
    },
  }));
}
