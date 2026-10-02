#!/usr/bin/env node
// Stop hook: reminds Claude to update the workspace backlog at the end of a turn.
// Optional argv[2]: backlog path to mention (default .claude/plans/backlog.md).
const p = process.argv[2] || '.claude/plans/backlog.md';
console.log(JSON.stringify({ systemMessage: `Reminder: update ${p} with what was completed this session.` }));
