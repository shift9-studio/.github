# premium-web-craft — a global Claude Code skill

A repeatable method for taking a site to award-tier visuals and harvesting the
work into a reusable UI/UX component library. It researches the *current*
highest-regarded sites (Awwwards / FWA / CSS Design Awards / Godly + the top
motion studios), ingests only bleeding-edge, battle-tested techniques, and
applies them with hard quality gates — reduced-motion, performance,
accessibility, and no slop — verifying every effect in a real browser.

This directory is a durable copy. To use it, install it as a skill.

## Install globally (all your projects, on your machine)
Copy this folder into your user skills directory:

```bash
cp -r skills/premium-web-craft ~/.claude/skills/premium-web-craft
```

Then invoke it in any session with `/premium-web-craft`, or just describe the
goal ("make these animations award-tier") and it will trigger.

## Install for one project only
```bash
mkdir -p .claude/skills
cp -r skills/premium-web-craft .claude/skills/premium-web-craft
```

## Keep it with your other skills
If you maintain a personal skills repo (e.g. `my-skills`), drop this folder in
there alongside the rest so it versions with them.

## Layout
- `SKILL.md` — the loop, the non-negotiables, when to use.
- `references/sources.md` — where to research; how to find the current winners.
- `references/techniques.md` — the bleeding-edge catalog, tier by tier.
- `references/quality-gates.md` — the verification protocol + runtime gotchas.
- `references/component-library.md` — harvesting into a reusable codebase.
