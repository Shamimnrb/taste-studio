---
name: design-system
description: Turns a design prompt (from design-prompt) or a built page into a full design system with tokens, component specs and a style guide. Use when asked for a design system.
argument-hint: "[prompt file, HTML page, or 'latest']"
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/contrast.py *) Read Write
---

# Design system from a design prompt

You turn the decisions in a design prompt into a complete, reusable system.
You extend those decisions; you never add a new aesthetic.

User input: $ARGUMENTS

**Paths.** `${CLAUDE_SKILL_DIR}` means the folder that contains this SKILL.md.
If it appears literally, replace it with that folder's real path. If the input
line shows a literal `$ARGUMENTS`, use the user's latest message instead.

## 1. Find the source

In this order:
1. A file path the user gave (a prompt `.md` or a built `.html` page).
2. A prompt pasted into the conversation, or one written earlier in it.
3. "latest" or nothing: the newest file in `./design-prompts/`.
If none exists, ask the user for the prompt in one short question and stop.

If the source is an HTML page, read its CSS and treat the values it actually
uses as the decisions.

## 2. Extract the decisions

List every value the source fixes: fonts and weights, sizes, colors, radii,
shadows, spacing, borders, durations, easings, usage rules ("accent used only
for X"), and the AVOID list. These are fixed; the system is built around them.

## 3. Build the system

Fill the gaps the prompt left open, staying inside its character and density:

- **Color**: every source color becomes a named role (`bg`, `surface`, `text`,
  `text-muted`, `border`, `accent`, `accent-contrast`, ...). Add a 9-step scale
  for the accent and the neutral, plus `success`, `warning`, `danger` tuned to
  the palette's lightness and chroma. Add a dark or light counterpart only if
  the source implies it. Usage rules from the prompt become written rules.
- **Typography**: a modular scale (state the ratio) from the source sizes,
  with named roles (`display-xl` ... `caption`, `label`), each with font,
  weight, size, line-height, letter-spacing, case. Desktop and mobile sizes.
- **Space**: a 4px- or 8px-based scale that contains the source's values.
- **Radius, border, shadow, z-index**: small named scales that contain the
  source's values. If the source says "no radius", the scale is `0` only.
- **Motion**: duration tokens and easing tokens from the source; reduced-motion
  rule.
- **Components**: only those the source uses plus the basics any product needs
  (button primary/secondary/link, input, select, checkbox, card or list row,
  nav, footer, tag/badge, toast). For each: anatomy, tokens used, sizes, and
  every state (default, hover, active, focus-visible, disabled, error/loading
  where relevant).
- **Rules**: do / don't list derived from the AVOID list and usage rules.

## 4. Write the files

Into `./design-system/<slug>/` (slug from the product name):

1. `tokens.json` — design tokens, grouped (`color`, `font`, `type`, `space`,
   `radius`, `border`, `shadow`, `motion`), each token `{ "$value": ..., "$type": ... }`.
2. `tokens.css` — the same tokens as CSS custom properties on `:root`
   (plus a theme block if there is a second theme), and `.type-<role>` utility
   classes.
3. `system.md` — the human guide: principles (3–5 lines), every token table,
   component specs with states, do/don't rules.
4. `style-guide.html` — one self-contained page that imports nothing but
   Google Fonts and inlines `tokens.css`. It shows: color swatches with name,
   hex and contrast ratio against `bg`; the type scale set in real copy; the
   space, radius and shadow scales; motion samples you can hover; every
   component in every state. The style guide itself follows the system's own
   density and AVOID list.

## 5. Check contrast

```
python3 ${CLAUDE_SKILL_DIR}/scripts/contrast.py ./design-system/<slug>/tokens.json
```

It reports every text/background pair that fails WCAG AA. Fix failing tokens
(adjust lightness, keep hue) and re-run until it passes. Mention any
deliberate exceptions (large display text only) in `system.md`.

## 6. Reply

In the Claude app: if the Artifact tool lists a "Design System" artifact type,
offer to publish the system there as well, so it can be reused for future
designs. Otherwise hand over the files.

Say in two or three lines what was fixed by the prompt and what you added.
Reply in the user's language.
