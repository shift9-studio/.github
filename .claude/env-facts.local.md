# Environment facts (probed at session start — trust these over memory)

- python: Python 3.12.10
- python modules: bpy✗ PIL✓ numpy✓ requests✓
- node: v24.18.0
- blender CLI: yes
- egress probe: github.com:200 raw.githubusercontent.com:301 pypi.org:200 example.com:200  (000=blocked/timeout; GitHub+PyPI open with others blocked ⇒ allowlist box, pull assets via GitHub mirrors — PLAYBOOK P-16)
- disk free (this fs): 14G  (0 with low Used on a cloud box = session allowance spent, not a broken machine)
- git: branch main, 2 dirty files


## RULES: DELIVERED — 13662B of CLAUDE.md, 20 guard hooks, 8/9 agents carry the rules. Source: unknown

## YOU HAVE (verified just now — never claim otherwise without searching)
- 42 skills live at /c/Users/Kariim/.claude/skills — search BEFORE building or refusing: python3 skills/finding-skills/tool/find-skills.py "<task>"
- 9 agents at /c/Users/Kariim/.claude/agents — dispatchable via the Agent tool
- Connectors & deferred tools may exist beyond what is listed in context: check ListConnectors / ToolSearch before saying a capability is missing
- Source of all of it: the Kariimc/my-skills repo (public; raw.githubusercontent.com fetch works even when this box is not that repo)
- READ IN FULL what a task names: a skill you invoke, a file you edit, a doc you cite — skimming a staged skill and shipping a partial run is the #1 quality failure (the 3D run-card exists because of it)

## HUGGING FACE IS THE DEFAULT ENGINE (his standing order — check here BEFORE paying or refusing)
- Account KariimC, PRO. FREE on it: make/edit images, still -> moving clip (his private copy KariimC/bringup-desk-i2v),
  remove backgrounds, cut objects out, restore/upscale photos, read text off screenshots, speak text aloud,
  and ANY ZeroGPU Space duplicated PRIVATE to his account. Duplicate rather than queue on the public one.
- THE LIMIT: 40 GPU minutes a day, resets midnight UTC, SHARED across every project.
    used   0m 00s of 40m   [counted by hand, never checked against the account today]
    left  40m 00s
  Record every run, failures included: python ~/.claude/hf-gpu-ledger.py <seconds> "what it was"
- Test benches: one box per task, thrown away. hf_sandbox create --flavor cpu-basic (a penny an hour), run every
  check INCLUDING failure paths, terminate, then record with the control plane's tools/bench-spend.py. Ceiling $50/month.
- Nothing runs on his machine until it ran somewhere else first. Windows-only files are tested on COPIES.
- A login or a missing free key is NEVER a dead end: walk him to the door and ask. Check what he already has first.
- In batches, never drip fed: whole inventory first, then one pass.
- BEFORE calling anything blocked, impossible or needing a purchase: read WHAT-HE-HAS.md in the control
  plane. Every wall hit on 21 Aug was a thing he already owned and nobody had plugged in.
- Agent contracts topped up this session:
  agent contracts: 13/14 already current at v2, 0 brought up to date, 1 held back
     held back (protected, not forced): chief-of-staff.md | [Errno 13] Permission denied: 'C:\\Users

_Full sheet also at .claude/env-facts.local.md. Durable NEW facts (a capability gained/lost) belong in PROGRESS.md the same session — see rules/07._
