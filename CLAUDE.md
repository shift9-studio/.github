# Shift-9 Studio — Claude Code Rules

## Higgsfield / AI Generation

- **One job per asset, no duplicates.** Never submit the same generation twice. Do not launch a backup or fallback workflow while a generation workflow is still running or before checking whether the first one succeeded.
- **Test before fanning out.** When using a new model or prompt style, submit a single test job, confirm it completes with a valid result, then fan out to the full set.
- **One workflow at a time for generation tasks.** Do not run parallel workflows that both call generate_video/generate_image for the same project list. Fan out *within* a single workflow instead.
- **No auto-retry loops on generation.** If a job fails, report it and ask before resubmitting. Do not silently retry or submit replacement jobs.
- **Never generate without an explicit request.** Only call generate_video/generate_image/generate_audio when the user has explicitly asked for it in this turn.

## Git / PRs

- All development goes on the designated feature branch (`claude/...`). Never push directly to `main`.
- Create a PR after pushing. Do not merge without user approval.

## General

- Do not run the same agent task twice in parallel. If two workflows would do the same work, run one and wait for the result.
