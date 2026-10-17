# Taste Studio

**Art-led concepts for landing pages: collide the truth about your product with how great art works, then get a precise prompt an AI can build from.**

Most AI-generated pages are assembled from digital trends: bento grids, gradients, glitch effects. Taste Studio starts somewhere else. It asks what is *true* about your product, lets you choose works of art by the way they *operate*, and turns the collision of the two into concepts. Each concept comes with one rule that generates the whole page.

## The flow

| Step | What you do | What it produces |
|---|---|---|
| 00 Brief | Product name, one-liner, headline, primary action, real items | The copy every sketch uses |
| 01 Discover | The truth nobody puts on the homepage, character sliders, "if it were a place", first-five-seconds feelings, references you love and are tired of | Ranks the art sources and feeds the concepts |
| 02 Art sources | Pick up to three of 26 sources from a library of original studies (Persian miniature, siyah-mashq, girih, Albers, Kelly, LeWitt, Fluxus, ukiyo-e, handscroll, cyanotype, weaving…) | The operations the concepts may borrow |
| 03 Concepts | Claude writes four concepts, three from your sources and one from a deliberately distant source, and draws each as a live HTML sketch | Title, idea, **rule**, composition, type, color, motion, sacrifice |
| 04 Refine | Palette, type and intensity, varied only *inside* the chosen concept | Starting values that can't break the rule |
| 05 Prompt | A concept-first prompt with a removal test; optional polish by Claude | The prompt, plus history |

Principles built into the studio:

- **The concept is the unit of choice, not components.** After you pick a concept, nothing can override it.
- **Art as operation, never as look.** Sources are stored as what the work *does* ("everything has a frame, and the most important thing breaks out of it"). The prompt forbids copies and pastiche.
- **The removal test.** If the rule can be removed and the page still works the same, the rule was decoration.
- **No invented facts.** Placeholders such as `[PRICE]` instead of made-up numbers.

## Running it

- **Inside Claude** (as an artifact): the full experience. Concepts, sketches and polishing run on the viewer's own Claude account.
- **Standalone** (`index.html`, or GitHub Pages): works offline from the built-in library. Concepts are local drafts built from your chosen sources, and sketches use the source studies.

```bash
python3 build.py   # inlines src/ into index.html and dist/artifact.html
```

- `src/data.js`: art sources (operation, rule, expression, palettes, type, character vector) and Discover questions.
- `src/studies.js`: one original SVG study per source, drawn with CSS variables so palette and type can change live.
- `src/app.js`: flow, Claude calls (concepts, sketches, polish), sketch sanitizing (DOMPurify + shadow DOM), prompt builder.
- `src/style.css`: studio chrome and local sketch layout.

To add an art source, add an entry to `SOURCES` in `data.js` and a matching drawing function in `studies.js`.

## Claude skills (included)

`skills/` holds two earlier companion skills for Claude: **design-prompt**, a non-interactive prompt generator, and **design-system**, which turns a prompt or page into tokens, component specs and a style guide. design-prompt still uses the v1 trend-based approach and has not been updated to the concept engine yet.

## Not yet

- A business layer: conversion goal, key interaction, personalization. Deliberately postponed until the artistic result is right.
- Connecting to a product's repo for real content and brand tokens.

## License

No license file yet. Choose one before accepting outside contributions.
