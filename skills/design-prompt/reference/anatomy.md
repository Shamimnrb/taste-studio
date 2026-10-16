# Anatomy of a strong design prompt

A strong prompt removes guesswork. Every line is a decision with a value
attached, so the building model has nothing generic to fall back on. Precision
is not the same as quantity: a minimal prompt is just as exact, with fewer
things in it.

## Density budgets (hard limits)

| | ultra-minimal | minimal | balanced | maximal |
|---|---|---|---|---|
| Sections (incl. hero and footer) | 3–4 | 4–5 | 5–7 | 7–10 |
| Typefaces | 1 family | 2 | 2–3 | 3 |
| Accent colors | 1, used ≤3 times | 1 | 1 + up to 2 secondary | up to 4 |
| Signature graphic | typographic or one static mark | one quiet element | one | layered |
| Animated elements | 0 (focus/hover only) | ≤2 | ≤5 | free |
| Interactive widgets (filters, sliders, drag) | 0 | 0–1 | ≤2 | free |
| Texture | none | ≤1 subtle | 1 | free |

Anything over budget gets cut, not shrunk. When in doubt, remove.

## Required sections, in this order

0. **DIRECTION** — the sampled combo, copied verbatim, one line per axis.
1. **Opening line** — `Build a <page type> for <product>. <movement, in a few words>. NOT <the cliché it would otherwise become>.`
2. **PAGE STRUCTURE** — numbered list of sections from `page_structure`, within
   the density budget. Each: name in the product's words + one line of content.
3. **TYPOGRAPHY** — fonts (real Google Fonts), weight, size range in px,
   letter-spacing in em, line-height, case. One typographic rule.
4. **COLOR** — ground, text, borders as exact hex or rgba; accents with strict
   usage rules ("used ONLY for X"). Name banned colors.
5. **SIGNATURE** — the one element that makes the page recognisable: how it is
   built (CSS / SVG / canvas), parameters, where it appears. In ultra-minimal
   this may be purely typographic.
6. **LAYOUT** — hero composition, grid, spacing scale in px, section rhythm.
7. **COMPONENTS** — only the ones the structure needs: buttons, cards, lists,
   footer. CSS-level values and states.
8. **MOTION** — named animations, ms, exact cubic-bezier, triggers,
   `prefers-reduced-motion`. In ultra-minimal: hover and focus only.
9. **AVOID** — 5–8 items: the clichés THIS direction tends toward, the obvious
   product metaphors, and banned copywriting words.

## Self-check before saving

- [ ] Within the density budget on every row of the table.
- [ ] No adjective without a value ("modern", "clean", "sleek" are banned).
- [ ] Fonts are real Google Fonts, none in `avoid_reusing.fonts` unless brand-locked.
- [ ] Every color is hex/rgba; primary accent not in `avoid_reusing.accent_hexes`.
- [ ] Light/dark follows the sampled `ground`.
- [ ] The signature is not one of the 3 obvious metaphors for the product.
- [ ] No invented numbers, prices, testimonials or names; placeholders instead.
- [ ] Section order follows `page_structure`, not a default SaaS order.
- [ ] Reading it, you could not mistake it for a previous prompt.

## Example A — balanced, dark (shows the level of precision)

```
Build a landing page for [PRODUCT]. Dark, editorial, poster-like — NOT a generic SaaS page.

TYPOGRAPHY
- Display: "Unbounded" weight 900, ALL CAPS, 96–128px, letter-spacing -0.045em,
  line-height 0.9. Every headline ends with a period in the section's accent color.
- Body: "Archivo", 16–18px, muted off-white.
- Labels: "JetBrains Mono", uppercase, 12px, letter-spacing 0.2em.

COLOR
- bg #0c0c0d, text #f2efe8, hairlines rgba(255,255,255,.08).
- One primary accent: acid lime #c9ff1a. Secondary accents (amber #f5b400,
  coral #f0704a) used ONLY for the headline period and the section's CTA.

SIGNATURE
- "Pixel-grid gradient" panels on <canvas>: a multi-stop gradient quantized into
  ~30px cells with 1px gaps, colors drifting slowly via requestAnimationFrame.

COMPONENTS
- Buttons: lime fill, black text, radius 10px, hard shadow 5px 5px 0 rgba(0,0,0,.5);
  on press translate(3px,3px). 160ms transitions.

MOTION
- Stats roll up from a mask, 550ms, cubic-bezier(0.16,1,0.3,1).

AVOID: centered hero with two buttons, rounded shadowed feature cards with line
icons, emoji, "seamless/elevate/unlock".
```

## Example B — ultra-minimal, light (precision with almost nothing)

```
Build a landing page for [PRODUCT]. Swiss print minimalism on warm paper — NOT a
startup page, NOT a dashboard.

PAGE STRUCTURE
1. Hero — one sentence, one link.
2. The list — the 8 most recent [ITEMS], one per row: title, meta, date.
3. Footer — one line of contact, one line of legal.

TYPOGRAPHY
- One family: "Instrument Sans". Hero 64px/1.05 weight 500, letter-spacing -0.02em.
  Body 17px/1.6 weight 400. Meta 13px, tabular figures, color #6b6760.
- Rule: no bold anywhere; hierarchy only from size and color.

COLOR
- ground #f4f1ea, text #1c1b19, hairlines #d9d4c8.
- Accent #d4380d, used ONLY for the hero link and the row hover rule. 2 uses total.

SIGNATURE
- Typographic: the hero sentence is the only large element on the page; 40vh of
  empty paper above it.

LAYOUT
- 8-column grid, max-width 1120px, side gutter 24px; content in columns 2–7.
- Spacing scale 4/8/16/32/64/128px; 128px between sections.

COMPONENTS
- List rows: 1px top hairline, 20px vertical padding, title left, meta right.
  Hover: hairline turns accent, 120ms.
- Link: underline 1px offset 4px; no buttons on the page.

MOTION
- None except hover and focus. Focus ring 2px accent, offset 3px.

AVOID: cards, icons, gradients, shadows, any filled button, any image,
dark mode, centered text, emoji, "seamless/elevate/unlock".
```

Copy the precision, never the choices: do not reuse these fonts, colors or
signatures unless the user locks them.
