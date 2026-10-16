---
name: design-prompt
description: Writes a precise, original design prompt for a landing page or website that differs from earlier ones. Use when asked for a design prompt or /design-prompt.
argument-hint: "[count] <product> [minimal] [keep fonts|colors|look] [lock axis=value]"
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/engine.py *) Read Write
---

# Design prompt generator

You write design prompts for an AI that builds web pages. Variety comes from the
engine script, not from you. You commit fully to the direction it gives you,
even when you would have chosen differently.

User input: $ARGUMENTS

**Paths.** `${CLAUDE_SKILL_DIR}` means the folder that contains this SKILL.md.
If it appears literally (not expanded), replace it with that folder's real path,
the directory you read this file from. If the user-input line above shows a
literal `$ARGUMENTS`, use the user's latest message instead.

## Hard rules

1. **No prompt without a sampled direction.** The engine must run. If the
   command fails, find the script (`find / -path "*design-prompt/scripts/engine.py" 2>/dev/null | head -1`)
   and run it from there. If it still fails, tell the user the exact error and
   stop. Never invent a direction yourself.
2. **No obvious metaphor.** Before writing, list to yourself the 3 most literal
   visual metaphors for this product (for a video product: timeline, play
   button, film strip, waveform). None of them may be the signature graphic or
   the page concept. Find a second-order idea, or let the sampled direction
   carry the page on its own.
3. **No invented facts.** No made-up counts, prices, testimonials, user numbers
   or client names. Use real facts the user gave or that you verified;
   otherwise write a placeholder like `[PRICE]` or `[NUMBER OF OPEN JOBS]`.
4. **Respect the density budget** in `reference/anatomy.md`. Minimal means
   minimal: every element must earn its place.
5. **The sampled ground and palette decide light or dark.** Do not default to a
   dark page.

## 1. Parse the input

- A leading number (1–6) is how many prompts to make; default 1. Several
  prompts must be clearly different from each other.
- **Minimal**: words like minimal, simple, clean, quiet, مینیمال, ساده, خلوت
  mean `--lock density=minimal`. "Very / ultra / خیلی" means `density=ultra`.
  If the user says nothing about density, lock the default from `taste.md`
  ("random" means no lock).
- **Keep** (brand constraints): phrases like "keep the fonts", "keep the
  colors", "keep the look and feel", "فونت فعلی بمونه", "حس فعلی حفظ شه".
  See step 2.
- `lock axis=value` pins any axis. Axes: density, ground, page_structure,
  movement, mood, palette_strategy, type_strategy, signature_graphic,
  layout_archetype, motion_personality, texture, wildcard_rule.
- Everything else describes the product. It may be in any language. If there
  is no product description, ask for one in one short question and stop.

## 2. Brand constraints (only when the user asked to keep something)

Find the real current values first. Never guess them.
- If the product has a live site, fetch it and look for font names and colors.
- If they can't be found, ask the user for the font names / hex colors, or a
  screenshot, in one short question, and stop until they answer.

Then turn each "keep" into locks:
- keep fonts → `--lock "type_strategy=brand fonts: <Display> / <Body>"`
- keep colors → `--lock "palette_strategy=brand palette: <hex list>"`
- keep look and feel → also lock `movement`, `mood` and `ground` to short
  descriptions of the current look. Layout, structure, signature, motion and
  texture stay free; that is where the redesign happens.

After sampling, check each direction against the constraints. If an axis
clashes (e.g. a playful rounded brand font with a harsh constructivist
movement), sample again, at most 3 times; if it still clashes, lock that axis to
a compatible value and say so in your reply. Locking more than 3 things leaves
little to redesign; mention that if the user locks more.

## 3. Load context

- Read `${CLAUDE_SKILL_DIR}/taste.md` (standing preferences and dislikes).
- Read `${CLAUDE_SKILL_DIR}/reference/anatomy.md` (structure, density budgets,
  quality bar, examples of precision).

## 4. Sample

```
python3 ${CLAUDE_SKILL_DIR}/scripts/engine.py sample --count <N> [--lock axis=value ...]
```

Each direction has a `combo` (one value per axis) and `font_candidates`.
`avoid_reusing` lists fonts, accent colors and signature ideas used recently.

## 5. Write each prompt

- Follow the anatomy sections exactly, in English, at the precision of the
  examples.
- Start the prompt with a `DIRECTION` block that copies the combo verbatim, so
  the builder and the user can see what was sampled.
- The opening line names the movement and what the page must NOT become.
- Build the section list from `page_structure`, sized by the density budget.
  Section names use the product's own words.
- Fonts: from `font_candidates` or another real Google Font that fits, never
  from `avoid_reusing.fonts` (unless locked by the brand). Colors: exact hex
  from `ground` + `palette_strategy`, primary accent not in
  `avoid_reusing.accent_hexes`.
- Apply `signature_graphic`, `layout_archetype`, `motion_personality`,
  `texture` and `wildcard_rule`. In minimal densities, texture and wildcard may
  be dropped if they add noise; say which in a one-line note.
- Honour taste.md dislikes always. Taste likes never override the direction.
- Run the self-check in anatomy.md and fix anything that fails.

## 6. Save and record

1. Write each prompt to `./design-prompts/<YYYY-MM-DD>-<short-slug>.md` in the
   current working directory (create the folder if needed). In the Claude app,
   also hand the file to the user.
2. Record it:
```
python3 ${CLAUDE_SKILL_DIR}/scripts/engine.py record --file "<path>" --product "<short product name>" --combo '<combo JSON on one line>' --fonts "Display,Body,Mono" --accents "#hex,#hex" --signature "<6-10 word summary of the signature graphic>"
```

## 7. Reply

Show each prompt in a fenced code block, headed by a one-line name for the
direction (e.g. "Swiss minimal · warm paper · index-first"). Then offer, in one
line: build one now, regenerate, lock or keep something, or turn it into a
design system with the `design-system` skill. Reply in the user's language.

If the user asks to build one, build it as a single self-contained HTML file
following the prompt exactly, including its density budget.
