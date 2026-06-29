# premium-web-craft

A Claude Code skill: a repeatable method for taking a site to award-tier visuals
and harvesting the work into a reusable UI/UX component library. It researches the
*current* highest-regarded sites (Awwwards / FWA / CSS Design Awards / Godly + the
top motion studios), ingests only bleeding-edge, battle-tested techniques, and
applies them under hard gates — reduced-motion, performance, accessibility, and no
slop — verifying every effect in a real browser.

It is project-agnostic: nothing here is tied to any one codebase.

## Install it globally (every project)

The skill ships as a plugin in this repo's `shift9` marketplace, so you install it
once and it's available in **all** your projects, with one-command updates.

```bash
# add this repo as a marketplace (once)
/plugin marketplace add shift9-studio/.github

# install the skill globally
/plugin install premium-web-craft@shift9

# later, pull updates everywhere
/plugin marketplace update shift9
```

Then trigger it in any session with `/premium-web-craft`, or just describe the goal
("take these animations to award tier") and it activates.

> For your own permanent home, copy `plugins/premium-web-craft/` into a personal
> skills/plugins repo (e.g. `my-skills`) and add THAT repo as the marketplace
> instead — same files, same commands. The marketplace mechanism is what makes a
> skill global and updatable across machines and Claude Code on the web (where the
> local `~/.claude/` does not persist).

## Install it locally only (one machine, terminal/desktop)

Copy the skill into your user skills directory:

```bash
cp -r plugins/premium-web-craft ~/.claude/skills/premium-web-craft
```

Global on that machine; does not cover web sessions or other machines (use the
marketplace route for those).

## Install it for one project

```bash
mkdir -p .claude/skills
cp -r plugins/premium-web-craft .claude/skills/premium-web-craft
```

## Layout
- `SKILL.md` — the loop, the non-negotiables, when to use.
- `references/sources.md` — where to research; how to find the current winners.
- `references/techniques.md` — the bleeding-edge catalog, tier by tier.
- `references/quality-gates.md` — the verification protocol + runtime gotchas.
- `references/component-library.md` — harvesting into a reusable codebase.
