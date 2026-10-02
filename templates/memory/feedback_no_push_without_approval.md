---
name: no-push-without-approval
description: Committing locally is fine, but always confirm before git push
metadata:
  type: feedback
---

Committing locally is fine. Always confirm with the user before `git push`, every time.

**Why:** Pushing is outward-facing and hard to reverse; approval for one push doesn't cover the next.
**How to apply:** Finish the commit, then ask before pushing.
