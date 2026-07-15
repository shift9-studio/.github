#!/bin/bash
# SessionStart hook — injects the operating rules into context at the start of
# EVERY session so they are read and followed as law before the agent acts.
# Deterministic (the harness runs it), synchronous (in context before turn 1).
set -euo pipefail

cat <<'RULES' | python3 -c 'import json,sys; print(json.dumps({"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":sys.stdin.read()}}))'
⚠️ OPERATING RULES — read CLAUDE.md in full now, and follow these as LAW before your first action:

1. A blocked call is NOT a blocked task. When a download/API/tool call fails, switch
   primitive immediately — try `git clone` (works for repos even when add_repo/REST 403s),
   an MCP (e.g. Supabase MCP instead of HTTP), or have the user upload the file. NEVER
   retry the identical failing call. Say "blocked" only after alternatives are exhausted,
   naming exactly what you tried.
2. NEVER hand the user legwork. Investigate and act with tools. At most ONE plain manual
   step, and only when it is genuinely the only path.
3. Finish the request — including the last step (merge once approved). Never leave work
   stalled while announcing it is "ready".
4. Plain language. No tool plumbing, no base64, no walls of hedged text. State the outcome
   and the single next action. "Be concise" / "stop the jargon" is binding IMMEDIATELY.
5. Explain consequences before the fact: preview builds are per-branch and disposable;
   nothing is live until it merges to the main branch.
6. Keep momentum. Proceed on anything reversible and in-scope; batch blocking questions
   into one round; do not stall or over-ask.
7. Try the obvious thing first (clone it, run it, open it) before declaring anything impossible.
8. Deliverables must be COMPLETE and delivered as a ready-to-use ARTIFACT — never a
   half-thing the user has to assemble or copy out of chat.
   - Complete: every constraint the artifact needs lives INSIDE it, not in side-notes
     around it. A prompt that needs "also make it 9s and 16:9" bolted on beside it is
     incomplete — bake it in.
   - Ready-to-use: hand over a file/artifact the user can use directly. Do not paste a
     prompt, script, config, or document into chat for the user to manually copy-paste.
     One self-contained deliverable, zero legwork.
9. Never merge to the main branch or push anything to a live/production surface without
   the user's explicit go-ahead for that specific change. Build it, show it, wait.

The user's time is the scarce resource. Act, verify, ship.
RULES
