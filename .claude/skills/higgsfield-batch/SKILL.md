---
name: higgsfield-batch
description: Safe procedure for generating a set of images/videos/audio with Higgsfield — canary-first fan-out, a job manifest that prevents duplicate submissions, and explicit failure handling with no auto-retry. Use for ANY Higgsfield generation request involving more than one asset, or any new model/prompt style.
---

# Higgsfield batch generation — canary, manifest, no duplicates

Hard rules (from CLAUDE.md, they override everything here if in tension):
generate only on an explicit request this turn; one job per asset; one generation
workflow at a time; no auto-retry; failed jobs are reported, not resubmitted.

## 0. Before submitting anything

1. Restate the batch back to the user as a table — asset name, prompt, model,
   aspect/duration, reference media — **counting the jobs and the approximate
   credits** (`balance` / `show_plans_and_credits` if cost matters). If the request
   was explicit and unambiguous, proceed; if scope is fuzzy (how many? which
   model?), ask first.
2. Check for prior work: `show_generations` / `job_display` for jobs matching this
   project. Anything already generated or still running for the same asset is
   **excluded** from the batch — never resubmit an asset that has a pending or
   successful job.
3. If the model or prompt style is unfamiliar, `models_explore(action:'recommend')`
   with the goal before choosing.

## 1. Manifest (the duplicate-prevention mechanism)

Create `SCRATCHPAD/higgsfield-manifest-<task>.md` before the first submission:

```
| # | asset | prompt (short) | model | job_id | status | result_url |
```

One row per asset, written **before** its job is submitted, `job_id` filled in
**immediately** after submission returns. Every subsequent action starts by
re-reading the manifest. If the session is interrupted, the manifest is the
source of truth — reconcile it against `show_generations` before doing anything.

## 2. Canary

Submit **exactly one** job — the most representative asset. Poll its status
(job status tools, not sleep-loops shorter than the model's realistic runtime).
Then judge the result against the request: correct subject, style, aspect,
no artifacts, on-brand (palette/voice per surface if it's for a Shift-9 property).

- Canary good → proceed to fan-out.
- Canary wrong → adjust the prompt/model, report what changed, and re-canary.
  The bad canary counts as that asset's job; note it in the manifest.
- Canary **failed** (error state) → stop. Report the failure and the proposed fix;
  wait for the user before any resubmission.

## 3. Fan-out

Submit the remaining assets **within this single workflow**, updating the manifest
row-by-row as each `job_id` returns. Never launch a second workflow, backup batch,
or parallel agent that also calls `generate_*` for this list. Before each
submission, check the manifest: if the row already has a `job_id`, skip it.

## 4. Collection and failure handling

Poll until every row is terminal. Mark each row `done` (+ result URL) or `failed`
(+ error). For failures: **do not resubmit.** Deliver a report — successes with
links, failures with error text and a recommended fix per asset — and ask which
failed jobs to resubmit. Only resubmit the ones the user names, as new manifest
rows referencing the failed originals.

## 5. Deliverable

The final message includes the manifest table, total jobs submitted vs. assets
requested (these must match — any excess is a bug to explain), and credits used
if available. If assets are destined for the repo, hand off to normal git flow
(feature branch, PR) — this skill ends at generated assets, it does not merge.
