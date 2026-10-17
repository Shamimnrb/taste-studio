# Taste Studio

**A designer's console for [tasteskill](#credits) (`design-taste-frontend`).** Taste Studio collects the decisions that need a person (what is real, what the page argues, which direction, which live thing) and hands them to the skill, which builds the page, measures it in a real browser and critiques its own screenshots.

Personal project.

## Why it works this way

Earlier versions generated design prompts from style choices and art references. The pages came out thin: decorative, empty, and full of the very devices that make generated pages recognisable. tasteskill's study of 247 gallery sites and its blind tests point elsewhere:

- The idea comes from **facts only this client has**, checked with a competitor test.
- The page is an **argument**: one claim per section, each with proof. Sections without a claim are cut.
- **Full, real content** beats restraint. Thin pages lose to busy ones.
- Every winning page had **one live thing**: something the visitor can do, made from the idea.
- Building, measuring and critiquing belong to the skill.

## The flow

| Step | You | Claude (inside the Claude app) |
|---|---|---|
| 00 Material | Name, site, what it is, audience, the one action, sector, tone, real assets, brand to keep, and all the real material you have | — |
| 01 Inventory | Keep, cut, edit or flag (verify) | Extracts 8–12 things only this client has |
| 02 Argument | Reorder, edit, cut sections; pick or write a headline (≤32 characters) | Writes claims with proof and three headline options |
| 03 Direction | Pick the direction only this client could own; edit the idea sentence | Chooses 3 of tasteskill's 20 directions (plus an optional art lens), writes "On this page, X becomes Y", runs the competitor test, sketches each hero |
| 04 Live thing | Pick one or write your own | Proposes four, each with phone and no-script versions |
| 05 Brief | Copy or download | — |

The brief contains the exact `draw.mjs` command (sector, sections in argument order, tone, assets, brand keep, direction), the inventory, argument, idea, live thing, real material and the chosen sketch. Paste it into Claude with **design-taste-frontend** enabled and say "Build this."

Outside Claude (opening `index.html` directly) the studio still works: the inventory is split from your material, directions are matched on sector and tone, and you fill in the rest by hand.

## Develop

```bash
python3 tools/import_taste.py <path to design-taste-frontend>   # refresh src/directions.js
python3 build.py                                                 # write index.html and dist/artifact.html
```

- `src/app.js`: the flow, Claude calls, sketch sanitising (DOMPurify + shadow DOM), brief builder.
- `src/directions.js`: trimmed copy of tasteskill's 20 directions (generated).
- `src/data.js`, `src/studies.js`: the art-lens library (26 sources stored as operations, with original SVG studies).
- `skills/`: earlier companion skills (design-prompt, design-system), kept for reference.

## Credits

Directions, the house rules, the argument, inventory, competitor test and live-thing method come from **tasteskill v2** (`design-taste-frontend`), an open-source skill distilled from a study of 247 curated gallery sites. The skill is installed separately and does the build; only a trimmed copy of its direction library is included here.
