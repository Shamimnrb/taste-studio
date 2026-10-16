# Taste Studio

**Find your design taste by looking, not describing — then get a precise prompt an AI can build from.**

Taste Studio walks a designer through seven rounds of large, live design samples. Each round is rendered with the choices made so far, so you always judge real combinations rather than abstract swatches. At the end your picks — and everything you rejected — become a precise design prompt with exact fonts, hex colors, sizes, timings and a density budget.

> فارسی: [پایین صفحه](#فارسی)

## How it works

| Round | What you see | What it decides |
|---|---|---|
| 00 Brief | Your product name, one-liner, headline, real items | The copy every sample uses |
| 01 Direction | 6 complete hero mockups in different movements | Overall look, hero layout |
| 02 Typography | Big type specimens in your chosen colors | Display / body / label faces |
| 03 Color | Palettes applied to the same page | Ground, text, accents |
| 04 Structure | Page wireframes | Section order and count |
| 05 Signature | Live generative graphics (canvas / CSS) | The one memorable element |
| 06 Density + motion | Page silhouettes and playable motion demos | Hard limits, animation style |
| 07 Prompt | Your combined page + the generated prompt | — |

- **✕ No** on any option adds it to the prompt's AVOID list.
- **Shuffle** brings fresh options from the library (18 directions, 22 type pairings, 20 palettes, 7 structures, 14 signatures).
- **Keep your brand**: enter current fonts or hex colors in the brief and they appear as an option in their round.
- **Polish with Claude**: when the page runs as a Claude artifact, the final prompt can be refined by Claude on the viewer's own account, keeping every chosen value. Elsewhere, the prompt is generated locally and you copy it.
- History of saved prompts lives in the browser (localStorage).

## Run it

No build tools needed to use it:

```bash
open index.html            # or double-click it
```

Or serve it with GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

### Develop

Source lives in `src/`; `build.py` inlines it into one file.

```bash
python3 build.py           # writes index.html and dist/artifact.html
```

- `src/data.js` — the option library. Add directions, palettes, pairings or signatures here.
- `src/app.js` — rounds, sample renderers, signatures, prompt builder.
- `src/style.css` — studio chrome (theme-aware, RTL) and sample styles.
- `dist/artifact.html` — same page without a document skeleton, for publishing as a Claude artifact.

## Claude skills (included)

`skills/` holds two companion skills for Claude (claude.ai or Claude Code):

- **design-prompt** — generates varied design prompts without the visual rounds, using a sampling engine that steers away from earlier prompts, with density budgets and brand "keep" constraints.
- **design-system** — turns a prompt or a built page into tokens (`tokens.json`, `tokens.css`), component specs, a style guide page, and a WCAG contrast check.

Install in the Claude app: zip each folder (the folder at the zip root) and upload it in **Customize → Skills**. In Claude Code: copy the folders into `~/.claude/skills/`.

## Roadmap ideas

- Upload reference images and let Claude extract a starting direction
- Mix two picks ("this type with that layout")
- Export directly to the design-system skill
- Shareable sessions so a client can do the rounds

## License

No license file yet — choose one before accepting outside contributions.

---

## فارسی

**استودیو سلیقه**: سلیقه‌ی طراحی رو با دیدن پیدا کن، نه با توصیف. بعد یه پرامپت دقیق بگیر که هوش مصنوعی بتونه ازش صفحه بسازه.

در هفت مرحله نمونه‌های بزرگ و زنده می‌بینی: حال‌وهوا، فونت، رنگ، ساختار صفحه، عنصر امضا، تراکم و حرکت. هر مرحله با انتخاب‌های قبلیت ساخته می‌شه، پس همیشه ترکیب واقعی رو می‌بینی. چیزهایی که رد می‌کنی به فهرست «نکن‌ها»ی پرامپت اضافه می‌شن. آخر کار پرامپت با فونت‌ها، کدهای رنگ، اندازه‌ها و زمان‌بندی دقیق ساخته می‌شه.

**اجرا:** فایل `index.html` رو در مرورگر باز کن. برای تغییر کد، فایل‌های `src/` رو ویرایش کن و `python3 build.py` رو اجرا کن.

**اسکیل‌ها:** پوشه‌ی `skills/` دو اسکیل همراه داره: پرامپت‌ساز (design-prompt) و دیزاین سیستم (design-system).
