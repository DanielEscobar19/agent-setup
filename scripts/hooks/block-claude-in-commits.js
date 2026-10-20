#!/usr/bin/env node
// PreToolUse hook for shell tools (Claude Code, Codex, Copilot): denies a `git commit` whose command text
// attributes the commit to an AI tool (Claude/Anthropic, or Codex/Copilot co-author or "generated with" lines).
// It checks for `git commit` itself, so it also works in tools that cannot filter hooks by command.
// Cross-platform replacement for a shell one-liner.
let cmd = '';
try {
  const input = JSON.parse(require('fs').readFileSync(0, 'utf8')).tool_input || {};
  cmd = typeof input.command === 'string' ? input.command : JSON.stringify(input);
} catch { process.exit(0); }
const attribution = /claude|anthropic|co-authored-by:[^\n"']*(codex|openai|copilot)|generated (with|by) (codex|copilot)/i;
if (/\bgit\s+(-\S+\s+)*commit\b/.test(cmd) && attribution.test(cmd)) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: 'Commit blocked: message attributes the commit to an AI tool (Claude, Anthropic, Codex or Copilot).',
    },
  }));
}
