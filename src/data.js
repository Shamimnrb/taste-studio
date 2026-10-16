/* Taste Studio — option library. Everything the studio can show lives here.
   Add options freely: each list is shuffled into rounds of six. */

// Google Fonts load specs (only weights each family really has).
const FONT_SPEC = {
  "Unbounded": "Unbounded:wght@400;700;900", "Syne": "Syne:wght@500;700;800",
  "Bricolage Grotesque": "Bricolage+Grotesque:wght@400;700;800", "Fraunces": "Fraunces:ital,wght@0,400;0,700;0,900;1,400",
  "Instrument Serif": "Instrument+Serif:ital@0;1", "Instrument Sans": "Instrument+Sans:wght@400;500;600",
  "Anton": "Anton", "Big Shoulders Display": "Big+Shoulders+Display:wght@500;800",
  "Bodoni Moda": "Bodoni+Moda:ital,wght@0,400;0,700;1,400", "DM Serif Display": "DM+Serif+Display:ital@0;1",
  "Archivo Black": "Archivo+Black", "Darker Grotesque": "Darker+Grotesque:wght@500;800",
  "Familjen Grotesk": "Familjen+Grotesk:wght@400;700", "Gloock": "Gloock", "Young Serif": "Young+Serif",
  "Climate Crisis": "Climate+Crisis", "Tilt Warp": "Tilt+Warp", "Six Caps": "Six+Caps", "Italiana": "Italiana",
  "Chakra Petch": "Chakra+Petch:wght@400;700", "Major Mono Display": "Major+Mono+Display",
  "Bagel Fat One": "Bagel+Fat+One", "Dela Gothic One": "Dela+Gothic+One",
  "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,400;0,600;1,400", "Krona One": "Krona+One",
  "Shrikhand": "Shrikhand", "Michroma": "Michroma", "Abril Fatface": "Abril+Fatface",
  "Red Hat Display": "Red+Hat+Display:wght@400;700;900", "Space Grotesk": "Space+Grotesk:wght@400;700",
  "Archivo": "Archivo:wght@400;600;800", "Inter Tight": "Inter+Tight:wght@400;600;800", "Manrope": "Manrope:wght@400;600;800",
  "DM Sans": "DM+Sans:wght@400;600", "IBM Plex Sans": "IBM+Plex+Sans:wght@400;600", "Work Sans": "Work+Sans:wght@400;600",
  "Karla": "Karla:wght@400;600", "Public Sans": "Public+Sans:wght@400;600;900", "Figtree": "Figtree:wght@400;600",
  "Schibsted Grotesk": "Schibsted+Grotesk:wght@400;600;900", "Hanken Grotesk": "Hanken+Grotesk:wght@400;600",
  "Source Serif 4": "Source+Serif+4:wght@400;600", "Newsreader": "Newsreader:ital,wght@0,400;0,600;1,400",
  "Literata": "Literata:wght@400;600", "Libre Franklin": "Libre+Franklin:wght@400;600;900", "Onest": "Onest:wght@400;600",
  "JetBrains Mono": "JetBrains+Mono:wght@400;500", "IBM Plex Mono": "IBM+Plex+Mono:wght@400;500",
  "Space Mono": "Space+Mono:wght@400;700", "DM Mono": "DM+Mono:wght@400;500", "Fragment Mono": "Fragment+Mono",
  "Martian Mono": "Martian+Mono:wght@400;500", "Geist Mono": "Geist+Mono:wght@400;500",
  "Azeret Mono": "Azeret+Mono:wght@400;500", "Red Hat Mono": "Red+Hat+Mono:wght@400;500",
};

// A palette: ground, surface, text, muted, line, accent (+fg on accent), second accent.
const P = (bg, sf, tx, mu, ln, ac, acfg, ac2) => ({ bg, sf, tx, mu, ln, ac, acfg, ac2 });

const PALETTES = [
  { id: "swiss", fa: "Cool paper, Swiss red", en: "cool paper, Swiss red", ...P("#efefeb", "#e4e4df", "#141414", "#5d5d58", "#cfcfc8", "#e2401c", "#ffffff", "#141414"), avoid: "Swiss red-on-paper palette" },
  { id: "ink-orange", fa: "Ink black and orange", en: "ink black, signal orange", ...P("#0d0d0e", "#18181a", "#f1eee7", "#a19d95", "#2a2a2c", "#ff6b2c", "#0d0d0e", "#f5b400"), avoid: "near-black with a hot orange accent" },
  { id: "riso", fa: "Riso blue and fluo pink", en: "riso blue + fluo pink", ...P("#f6efe2", "#ece2cf", "#1d2a6b", "#4e5891", "#d9cdb6", "#ff5c8a", "#1d2a6b", "#ffd23f"), avoid: "riso blue and fluorescent pink" },
  { id: "washi", fa: "Washi white, one red mark", en: "washi white, one red mark", ...P("#fbfaf7", "#f1efe9", "#1a1a1a", "#8b8985", "#e3e0d8", "#c8102e", "#ffffff", "#1a1a1a"), avoid: "white page with a single red mark" },
  { id: "bauhaus", fa: "Bauhaus primaries", en: "Bauhaus primaries", ...P("#f1ece1", "#e6dfd0", "#111111", "#55524b", "#d3cab7", "#e63022", "#ffffff", "#1f4fd1"), avoid: "red/blue/yellow primary palette" },
  { id: "phosphor", fa: "Phosphor green on black", en: "phosphor green on black", ...P("#0a0f0a", "#101810", "#b6f5a8", "#5f8f58", "#1f2e1d", "#39ff6a", "#0a0f0a", "#b6f5a8"), avoid: "green-on-black terminal palette" },
  { id: "blueprint", fa: "Blueprint blue and yellow", en: "blueprint blue + yellow", ...P("#0e3a6b", "#124477", "#e9f2ff", "#9cb8d9", "#2d5a8c", "#ffd166", "#0e3a6b", "#e9f2ff"), avoid: "blueprint blue palette" },
  { id: "rave", fa: "Acid magenta and cyan", en: "acid magenta + cyan", ...P("#111111", "#1c1c1c", "#ffffff", "#a8a8a8", "#2c2c2c", "#ff2bd6", "#111111", "#00e5ff"), avoid: "magenta/cyan rave palette" },
  { id: "broadcast", fa: "Broadcast navy", en: "broadcast navy, red, yellow", ...P("#0b1b3a", "#11264f", "#ffffff", "#9fb0d0", "#22386a", "#ff3b1f", "#ffffff", "#ffd400"), avoid: "sports-broadcast navy palette" },
  { id: "letterpress", fa: "Letterpress paper, ink blue", en: "letterpress paper, ink blue", ...P("#ece6da", "#e2dacb", "#2b2724", "#6f675e", "#cfc5b2", "#3d5a80", "#ffffff", "#9b2c2c"), avoid: "warm paper with ink-blue" },
  { id: "sun70", fa: "70s sun-warm", en: "70s sun-warm", ...P("#f7d9a8", "#f1c98c", "#3b1f0e", "#7a4a2c", "#e3b77a", "#e5582b", "#ffffff", "#2f7d6d"), avoid: "warm 70s orange/teal palette" },
  { id: "chrome", fa: "Y2K silver and blue", en: "Y2K silver + electric blue", ...P("#dfe3ea", "#cdd3dd", "#0d0f14", "#4b5363", "#b9c1ce", "#2f6bff", "#ffffff", "#0d0f14"), avoid: "silver chrome Y2K palette" },
  { id: "signage", fa: "Signage white and yellow", en: "signage white + yellow", ...P("#ffffff", "#f2f2f2", "#111111", "#5c5c5c", "#dddddd", "#ffcc00", "#111111", "#0057b8"), avoid: "signage yellow on white" },
  { id: "clay", fa: "Clay, olive, sand", en: "clay, olive, sand", ...P("#b9a58f", "#ad977f", "#1f1a15", "#4a3f33", "#9e8a73", "#2e4a3a", "#f2ead9", "#7a3b1d"), avoid: "earthy clay mid-tone palette" },
  { id: "jewel", fa: "Emerald and oxblood on dark", en: "emerald + oxblood on dark", ...P("#101614", "#16201d", "#e8efe9", "#93a39b", "#25332e", "#2fbf8f", "#0b1210", "#a33a3a"), avoid: "dark jewel-tone palette" },
  { id: "mono-blue", fa: "Single-hue blue", en: "single-hue blue", ...P("#eef2fb", "#dfe6f6", "#0f1f4d", "#4a5b8a", "#c7d2ec", "#1e3fbf", "#ffffff", "#5b78d6"), avoid: "monochrome blue palette" },
  { id: "safety", fa: "Safety orange and black", en: "safety orange + black", ...P("#f2f0ea", "#e5e2d8", "#121212", "#545249", "#cfcbbd", "#ff5a00", "#121212", "#ffd000"), avoid: "hazard orange/black palette" },
  { id: "pastel", fa: "Sun-faded pastels", en: "sun-faded pastels", ...P("#f3ece4", "#e9dfd3", "#2a2a33", "#6e6a72", "#d9cfc2", "#e98a7a", "#2a2a33", "#8fb3a6"), avoid: "faded pastel palette" },
  { id: "graphite", fa: "Graphite and soft citron", en: "graphite + soft citron", ...P("#1d1f20", "#26292a", "#e9e7e1", "#9d9b94", "#34383a", "#d8e36b", "#1d1f20", "#9fb8c8"), avoid: "graphite with citron accent" },
  { id: "paper-green", fa: "Paper and forest green", en: "paper + forest green", ...P("#f4f3ee", "#e9e8e0", "#18201b", "#59625c", "#d4d5ca", "#1f6b45", "#ffffff", "#c9772b"), avoid: "paper with forest green" },
];

const PAIRS = [
  { id: "unb", d: "Unbounded", dw: 900, dc: "uppercase", dt: "-0.045em", lh: .9, b: "Archivo", m: "JetBrains Mono", fa: "Wide and heavy, all caps", rule: "Every headline ends with a period in the accent color." },
  { id: "ins", d: "Instrument Sans", dw: 500, dc: "none", dt: "-0.025em", lh: 1.05, b: "Instrument Sans", m: "IBM Plex Mono", fa: "One family, Swiss and exact", rule: "No bold anywhere; hierarchy only from size and color." },
  { id: "bod", d: "Bodoni Moda", dw: 400, dc: "none", dt: "-0.02em", lh: 1, b: "Newsreader", m: "Azeret Mono", fa: "High-contrast magazine Didone", rule: "One italic word per headline carries the emphasis." },
  { id: "anton", d: "Anton", dw: 400, dc: "uppercase", dt: "0", lh: .92, b: "Libre Franklin", m: "Space Mono", fa: "Ultra-condensed and tall", rule: "Headlines stack on 2–3 short lines, never one long line." },
  { id: "frau", d: "Fraunces", dw: 900, dc: "none", dt: "-0.03em", lh: .95, b: "Manrope", m: "DM Mono", fa: "Soft serif with character", rule: "Display set tight; body always in one measured column." },
  { id: "syne", d: "Syne", dw: 800, dc: "none", dt: "-0.03em", lh: .95, b: "Inter Tight", m: "Martian Mono", fa: "Avant-garde grotesk", rule: "Headlines are lowercase-led sentences, never title case." },
  { id: "bri", d: "Bricolage Grotesque", dw: 800, dc: "none", dt: "-0.035em", lh: .95, b: "Figtree", m: "Geist Mono", fa: "Warm, tight grotesk", rule: "Numbers always in the mono face with tabular figures." },
  { id: "corm", d: "Cormorant Garamond", dw: 400, dc: "none", dt: "-0.01em", lh: 1.05, b: "Manrope", m: "DM Mono", fa: "Delicate, quiet serif", rule: "Display never above weight 400; whitespace does the work." },
  { id: "chakra", d: "Chakra Petch", dw: 700, dc: "uppercase", dt: "0.02em", lh: 1, b: "IBM Plex Sans", m: "IBM Plex Mono", fa: "Techno, squared", rule: "Labels carry coordinates or codes, e.g. A-01." },
  { id: "climate", d: "Climate Crisis", dw: 400, dc: "uppercase", dt: "-0.02em", lh: .9, b: "Inter Tight", m: "Martian Mono", fa: "Display, very loud", rule: "Only one display line per screen." },
  { id: "bigsh", d: "Big Shoulders Display", dw: 800, dc: "uppercase", dt: "0", lh: .9, b: "Public Sans", m: "Geist Mono", fa: "Sporty condensed", rule: "Numbers set huge; words set small beside them." },
  { id: "young", d: "Young Serif", dw: 400, dc: "none", dt: "-0.01em", lh: 1.1, b: "Literata", m: "Fragment Mono", fa: "Warm bookish serif", rule: "Small caps for all labels; no uppercase display." },
  { id: "michroma", d: "Michroma", dw: 400, dc: "uppercase", dt: "0.04em", lh: 1.1, b: "Onest", m: "Geist Mono", fa: "Wide and spacey", rule: "Display always widely spaced and short." },
  { id: "dela", d: "Dela Gothic One", dw: 400, dc: "none", dt: "-0.02em", lh: 1, b: "Work Sans", m: "Red Hat Mono", fa: "Heavy and geometric", rule: "Display only in the hero and footer." },
  { id: "gloock", d: "Gloock", dw: 400, dc: "none", dt: "-0.02em", lh: 1, b: "Source Serif 4", m: "IBM Plex Mono", fa: "Heavy, serious serif", rule: "Serif everywhere; mono only for metadata." },
  { id: "rhd", d: "Red Hat Display", dw: 900, dc: "none", dt: "-0.04em", lh: .95, b: "Hanken Grotesk", m: "Red Hat Mono", fa: "Black, blunt sans", rule: "Arrows (→) are the only ornament." },
  { id: "darker", d: "Darker Grotesque", dw: 800, dc: "none", dt: "-0.02em", lh: .9, b: "Karla", m: "Space Mono", fa: "Condensed, zine-like", rule: "Headlines overlap images by 10–20%." },
  { id: "italiana", d: "Italiana", dw: 400, dc: "uppercase", dt: "0.08em", lh: 1.1, b: "Newsreader", m: "DM Mono", fa: "Thin and luxurious", rule: "Display always letter-spaced, never bold." },
  { id: "archblk", d: "Archivo Black", dw: 400, dc: "uppercase", dt: "-0.02em", lh: .92, b: "Work Sans", m: "Red Hat Mono", fa: "Black poster type", rule: "Headlines may rotate 90° in one place only." },
  { id: "shrik", d: "Shrikhand", dw: 400, dc: "none", dt: "0", lh: 1, b: "Figtree", m: "DM Mono", fa: "Warm 70s display", rule: "Display only in the accent color." },
  { id: "space", d: "Space Grotesk", dw: 700, dc: "none", dt: "-0.03em", lh: 1, b: "Space Grotesk", m: "Space Mono", fa: "One family with its mono", rule: "Everything left-aligned to one edge." },
  { id: "majmono", d: "Major Mono Display", dw: 400, dc: "none", dt: "0", lh: 1.05, b: "IBM Plex Mono", m: "IBM Plex Mono", fa: "All mono", rule: "Hierarchy only from size and inverse blocks." },
];

// Hero layouts the samples can use, with a precise spec for the prompt.
const LAYOUTS = {
  split: "Asymmetric split hero: headline block on the left (≈56%), a tall signature panel on the right with small mono labels in its corners.",
  giant: "One enormous headline spanning the full width, the signature graphic as a wide band beneath it, a single CTA and one meta line at the bottom.",
  letter: "Centered narrow column like a printed letter: small mark at top, a modest headline (≤20ch), one paragraph, one link. Vast margins.",
  index: "Left: short headline and intro; right: a ruled list of real items (title left, meta right) that IS the content; first row highlighted in the accent.",
  mag: "Magazine spread: headline across the top, then a 2-column grid — an image-like signature block with italic caption, and a text column with the CTA.",
  term: "Terminal-like: left column of mono prompt lines ending in a blinking cursor, right column an ASCII/graphic panel inside a 1px frame.",
  bento: "Bento grid of unequal tiles: a tall headline tile, a wide signature tile, a small data tile and one tile filled with the accent as the CTA.",
};

const SIGS = [
  { id: "pixel", fa: "Pixel-grid gradient", quiet: false, avoid: "pixelated gradient panels", spec: "Pixel-grid gradient panels drawn on <canvas>: a multi-stop gradient ({ac} → {ac2} → {sf}) quantized into ~22px square cells with 1px gaps in {bg}, hue drifting very slowly (requestAnimationFrame, value noise, ~20fps)." },
  { id: "halftone", fa: "Halftone field", quiet: false, avoid: "halftone dot fields", spec: "Halftone dot field on <canvas>: 12px grid, dot radius driven by slow 3D value noise, dots in {ac} on {sf}; dots near the cursor swell by up to 40%." },
  { id: "contour", fa: "Topographic lines", quiet: false, avoid: "topographic contour lines", spec: "Generative contour lines on <canvas>: 18 horizontal noise-displaced lines in {tx} at 30% opacity, every fifth line in {ac}, morphing very slowly." },
  { id: "dither", fa: "1-bit dither", quiet: false, avoid: "1-bit dithered graphics", spec: "1-bit ordered (Bayer 4×4) dither of a moving radial gradient, rendered at 1/4 resolution and scaled up with image smoothing off; two colors only: {ac} and {sf}." },
  { id: "ascii", fa: "ASCII render", quiet: false, avoid: "ASCII-art renders", spec: "ASCII rendering on <canvas>: characters \" .:-=+*#%@\" mapped from a slow noise field, mono font 12px, color {ac}, refreshed at ~12fps." },
  { id: "grain", fa: "Misregistered print", quiet: false, avoid: "misregistered print offsets", spec: "Oversized initial letter printed twice — {ac} and {ac2} — offset 6px with mix-blend-mode: multiply (screen on dark), plus a static film-grain canvas at 8% opacity." },
  { id: "outline", fa: "Outlined type that fills", quiet: false, avoid: "outlined type that fills with color", spec: "The product name set huge as outlined type (1.5px stroke in {tx}), with an {ac} copy revealed by an animated clip-path wipe (4.5s, alternate)." },
  { id: "marquee", fa: "Marquee ribbons", quiet: false, avoid: "rotated marquee ribbons", spec: "Two marquee ribbons crossing at -6° and 4°: one in {ac} with {acfg} text, one in {tx} with {bg} text, display font uppercase, 14s and 18s loops in opposite directions." },
  { id: "numbers", fa: "Oversized cropped numbers", quiet: true, avoid: "oversized cropped numbers", spec: "Oversized numerals (01, 02, 03) as graphic elements in {ac}, cropped by the panel edge, with a small mono label beside each." },
  { id: "hairline", fa: "Hairline rule system", quiet: true, avoid: "hairline rule systems", spec: "A hairline rule system in SVG: vertical and horizontal 1px lines in {ln} that draw in once on load (stroke-dashoffset, 3.2s), one rectangle traced in {ac}." },
  { id: "glyph", fa: "One giant letter", quiet: true, avoid: "a single giant glyph", spec: "One giant glyph (the product's initial) in the display face, color {ac}, cropped by the panel; no other graphic on the page." },
  { id: "shapes", fa: "Geometric shapes", quiet: false, avoid: "Bauhaus geometric shapes", spec: "Primary geometric shapes (circle in {ac}, half-circle in {ac2}, square in {tx}) composed on a modular grid, rotating imperceptibly (22s per turn)." },
  { id: "tickets", fa: "Ticket cards", quiet: false, avoid: "ticket-style stacked cards", spec: "Stacked ticket cards with perforated side notches (radial-gradient mask), each showing one real item; the stack fans out on hover (600ms)." },
  { id: "blob", fa: "Morphing blob", quiet: true, avoid: "morphing blobs", spec: "A single shape in {ac} whose border-radius morphs slowly (10s loop) between three organic outlines; nothing else moves." },
];

const DIRECTIONS = [
  { id: "swiss", fa: "Swiss print", en: "Swiss print on cool paper", not: "a startup template", layout: "index", pal: "swiss", pair: "ins", sig: "hairline", r: 0, sh: "none" },
  { id: "dark-poster", fa: "Dark editorial poster", en: "dark editorial poster", not: "a generic SaaS page", layout: "split", pal: "ink-orange", pair: "unb", sig: "pixel", r: 10, sh: "5px 5px 0 rgba(0,0,0,.5)" },
  { id: "riso", fa: "Risograph zine", en: "risograph zine, two spot inks", not: "a glossy tech site", layout: "mag", pal: "riso", pair: "darker", sig: "halftone", r: 4, sh: "none" },
  { id: "japan", fa: "Japanese minimal", en: "Japanese minimal print", not: "a busy marketing page", layout: "letter", pal: "washi", pair: "corm", sig: "glyph", r: 0, sh: "none" },
  { id: "bauhaus", fa: "Bauhaus geometry", en: "Bauhaus modular geometry", not: "a soft rounded app", layout: "bento", pal: "bauhaus", pair: "archblk", sig: "shapes", r: 0, sh: "none" },
  { id: "terminal", fa: "Terminal and CRT", en: "terminal / CRT interface", not: "a cartoon hacker cliché", layout: "term", pal: "phosphor", pair: "majmono", sig: "ascii", r: 0, sh: "none" },
  { id: "luxury", fa: "Luxury fashion magazine", en: "luxury fashion magazine", not: "an e-commerce template", layout: "giant", pal: "signage", pair: "bod", sig: "outline", r: 0, sh: "none" },
  { id: "blueprint", fa: "Architectural blueprint", en: "architectural blueprint", not: "a corporate brochure", layout: "split", pal: "blueprint", pair: "chakra", sig: "contour", r: 2, sh: "none" },
  { id: "rave", fa: "90s rave flyer", en: "90s rave flyer", not: "a tidy corporate page", layout: "giant", pal: "rave", pair: "climate", sig: "marquee", r: 999, sh: "none" },
  { id: "broadcast", fa: "Sports broadcast", en: "sports broadcast graphics", not: "a sports betting site", layout: "bento", pal: "broadcast", pair: "bigsh", sig: "numbers", r: 4, sh: "none" },
  { id: "letterpress", fa: "Letterpress, warm paper", en: "letterpress stationery", not: "a rustic wedding template", layout: "letter", pal: "letterpress", pair: "young", sig: "grain", r: 2, sh: "none" },
  { id: "seventies", fa: "70s warm print", en: "70s warm print", not: "a retro pastiche with stock badges", layout: "split", pal: "sun70", pair: "shrik", sig: "contour", r: 999, sh: "none" },
  { id: "y2k", fa: "Y2K chrome", en: "Y2K chrome and gloss", not: "a vaporwave meme", layout: "bento", pal: "chrome", pair: "michroma", sig: "dither", r: 18, sh: "inset 0 1px 0 rgba(255,255,255,.6), 0 6px 16px rgba(13,15,20,.18)" },
  { id: "signage", fa: "Museum wayfinding", en: "museum wayfinding signage", not: "a cluttered info portal", layout: "index", pal: "signage", pair: "rhd", sig: "numbers", r: 6, sh: "none" },
  { id: "earth", fa: "Earthy and quiet", en: "earthy, quiet editorial", not: "a wellness cliché", layout: "letter", pal: "clay", pair: "gloock", sig: "blob", r: 999, sh: "none" },
  { id: "jewel", fa: "Jewel night", en: "dark jewel-tone editorial", not: "a crypto landing page", layout: "mag", pal: "jewel", pair: "frau", sig: "tickets", r: 8, sh: "none" },
  { id: "graphite", fa: "Precise graphite", en: "precise graphite instrument", not: "a dashboard template", layout: "index", pal: "graphite", pair: "space", sig: "dither", r: 6, sh: "none" },
  { id: "forest", fa: "Paper and forest", en: "paper and forest, calm print", not: "an eco-brand cliché", layout: "mag", pal: "paper-green", pair: "syne", sig: "hairline", r: 2, sh: "none" },
];

const STRUCTURES = [
  { id: "manifesto", fa: "Manifesto", desc: "One strong sentence, one proof row, one button", blocks: [["hero", "Main statement", 150], ["", "Proof row", 44], ["acc", "Primary button", 40], ["", "Footer", 30]],
    sections: n => ["Hero — one strong statement about {name} and one link", "Proof row — 3 real facts about {name} (placeholders if unknown)", "Call to action — one sentence, one button", "Footer — contact and legal in one line"] },
  { id: "index", fa: "Index first", desc: "The page is the list of content, with a short intro", blocks: [["hero", "Short intro", 70], ["", "Item 1", 30], ["", "Item 2", 30], ["", "Item 3", 30], ["", "Item 4", 30], ["acc", "See all", 32], ["", "Footer", 26]],
    sections: n => ["Intro — one-line headline and one sentence", "The list — the latest {items} as ruled rows (title, meta, date)", "Filter or 'see all' — one line", "How it works — 3 short steps in one row", "Footer"] },
  { id: "doors", fa: "Two doors", desc: "Two paths for two audiences from the first screen", blocks: [["hero", "Short headline", 64], ["split", ["Path one", "Path two"], 150], ["", "FAQ", 50], ["", "Footer", 26]],
    sections: n => ["Hero — short headline naming both audiences", "Two doors — side-by-side paths, each with 3 points and its own CTA", "How it works — per door, 3 steps", "FAQ — 4 real questions", "Footer"] },
  { id: "question", fa: "Question-led", desc: "The headline is a question; each section answers part of it", blocks: [["hero", "Headline as a question", 90], ["", "Answer 1", 50], ["", "Answer 2", 50], ["", "Answer 3", 50], ["acc", "Button", 34], ["", "Footer", 26]],
    sections: n => ["Hero — the headline is a question the visitor already has", "Answer 1 — what {name} is", "Answer 2 — who it is for", "Answer 3 — how to start", "Call to action", "Footer"] },
  { id: "classic", fa: "Classic", desc: "Hero, value, steps, proof, FAQ, call to action", blocks: [["hero", "Hero", 90], ["", "Value", 46], ["", "How it works", 46], ["", "Proof", 40], ["", "FAQ", 40], ["acc", "Button", 34], ["", "Footer", 24]],
    sections: n => ["Hero — headline, one sentence, one CTA", "Value — 3 benefits in the product's own words", "How it works — 3 steps", "Proof — real logos or quotes, or placeholders", "FAQ — 5 questions", "Final CTA", "Footer"] },
  { id: "story", fa: "Three-chapter story", desc: "Three chapters in one scroll", blocks: [["hero", "Chapter 1", 110], ["", "Chapter 2", 110], ["", "Chapter 3", 110], ["acc", "Ending + button", 36]],
    sections: n => ["Chapter 1 — the problem, told in one image and one line", "Chapter 2 — what {name} changes", "Chapter 3 — what you do next", "Ending — one CTA", "Footer"] },
  { id: "search", fa: "Search first", desc: "The search and filter bar is the hero", blocks: [["hero", "Headline + search", 80], ["split", ["Filters", "Results"], 170], ["", "Footer", 26]],
    sections: n => ["Hero — headline with the search/filter bar as the main element", "Results — real {items} with filters beside them", "Why {name} — 3 short points", "Footer"] },
];

const DENSITIES = [
  { id: "ultra", fa: "Ultra-minimal", desc: "3–4 sections, one type family, one accent used at most 3 times, no animation", n: 4, blocks: [["x", 70], ["", 22], ["", 22], ["", 14]],
    budget: "3–4 sections; ONE typeface family (display + body from it); one accent used at most 3 times; no animated elements (hover/focus only); no texture; no interactive widgets.", sizes: "56–72px" },
  { id: "minimal", fa: "Minimal", desc: "4–5 sections, two typefaces, one accent, one quiet signature", n: 5, blocks: [["x", 60], ["", 30], ["a", 16], ["", 30], ["", 14]],
    budget: "4–5 sections; two typefaces + a mono for labels; one accent; one quiet signature element; at most 2 animated elements; no interactive widgets beyond basic links.", sizes: "64–88px" },
  { id: "balanced", fa: "Balanced", desc: "5–7 sections, one signature, considered motion", n: 7, blocks: [["x", 54], ["a", 18], ["", 30], ["", 26], ["", 26], ["", 24], ["", 14]],
    budget: "5–7 sections; 2–3 typefaces; one primary accent + up to 2 secondary accents with strict usage rules; one signature graphic; up to 5 animated elements; up to 2 interactive widgets.", sizes: "88–120px" },
  { id: "maximal", fa: "Maximal", desc: "7+ sections, layered, rich motion and texture", n: 9, blocks: [["x", 46], ["a", 20], ["", 26], ["a", 18], ["", 26], ["", 22], ["a", 18], ["", 22], ["", 14]],
    budget: "7–10 sections; up to 3 typefaces; up to 4 accents; layered signature graphic; rich motion and texture allowed.", sizes: "110–150px" },
];

const MOTIONS = [
  { id: "none", fa: "Almost still", desc: "Print-like; hover and focus only", cls: "", spec: "No entrance animations. Only hover and focus states, 120–160ms ease-out. Print-like stillness." },
  { id: "calm", fa: "Calm and slow", desc: "Soft entrances, nothing under 600ms", cls: "play-calm", spec: "Slow and calm: entrances fade and rise 28px over 900–1100ms, cubic-bezier(.2,.7,.2,1); nothing faster than 600ms except hover (200ms)." },
  { id: "snappy", fa: "Snappy with overshoot", desc: "Small pops with overshoot", cls: "play-snappy", spec: "Snappy with small overshoot: pops scale .82→1 in 380–420ms, cubic-bezier(.34,1.56,.64,1); hovers 160ms; buttons press translate(3px,3px)." },
  { id: "mech", fa: "Mechanical, stepped", desc: "Stepped moves, counters and ticks", cls: "play-mech", spec: "Mechanical: stepped timing with steps(4–8), counters tick up, labels advance like a split-flap board; 600ms per move." },
  { id: "type", fa: "Typographic", desc: "Letters roll up from a mask, one by one", cls: "play-type", spec: "Typographic: headline letters roll up from a mask with a 40ms stagger, 550ms each, cubic-bezier(.16,1,.3,1); body text never animates." },
  { id: "glitch", fa: "Glitch", desc: "Brief color split on hover", cls: "play-glitch", spec: "Glitchy: on hover, a 300–420ms RGB-split offset (text-shadow in the two accents) in steps(2); otherwise still." },
];

const BASE_AVOID = [
  "centered hero with two buttons over a gradient",
  "three rounded feature cards with line icons",
  "purple/blue gradients, glassmorphism, emoji",
  "copywriting words: seamless, elevate, unlock, empower, revolutionize",
  "invented numbers, prices, testimonials or client logos (use placeholders like [PRICE])",
];

/* ---------------- Discover: abstract questions ----------------
   Every vector is [energy, tone, time, access, voice, finish], each -2..2:
   quiet↔loud, precise↔playful, timeless↔of-the-moment, exclusive↔welcoming, serious↔witty, crafted↔raw. */
const SLIDERS = [
  { id: "energy", left: "Quiet", right: "Loud" },
  { id: "tone", left: "Precise", right: "Playful" },
  { id: "time", left: "Timeless", right: "Of the moment" },
  { id: "access", left: "Exclusive", right: "Welcoming" },
  { id: "voice", left: "Serious", right: "Witty" },
  { id: "finish", left: "Crafted", right: "Raw" },
];

const PLACES = [
  { id: "library", name: "A library", desc: "Quiet, ordered, timeless", vec: [-2, -2, 2, 0, -1, -2] },
  { id: "studio", name: "A recording studio", desc: "Focused, technical, a little raw", vec: [0, -1, 0, -1, 0, 1] },
  { id: "market", name: "A street market", desc: "Loud, open, everyone welcome", vec: [2, 2, -1, 2, 1, 2] },
  { id: "gallery", name: "A gallery", desc: "Space around every object", vec: [-1, -1, 1, -2, -1, -2] },
  { id: "workshop", name: "A workshop", desc: "Tools out, work in progress", vec: [0, 0, 0, 1, 0, 2] },
  { id: "stadium", name: "A stadium", desc: "Big, collective, energetic", vec: [2, 0, -1, 2, 0, 0] },
  { id: "lab", name: "A laboratory", desc: "Exact, measured, clean", vec: [-1, -2, 0, -1, -1, -1] },
  { id: "cafe", name: "A neighborhood café", desc: "Warm, familiar, unhurried", vec: [-1, 1, 0, 2, 1, 0] },
];

const FEELINGS = ["Trust", "Excitement", "Calm", "Curiosity", "Belonging", "Urgency", "Delight", "Authority", "Focus", "Ambition"];
const CONTEXTS = ["At a desk, focused", "On the phone, between things", "Browsing for inspiration", "Comparing options, skeptical", "Arriving from a link someone shared"];
const DEVICES = ["Mostly desktop", "Mostly mobile", "Both equally"];

// Character of each direction on the same six axes (used to rank the Direction round).
const DIR_VEC = {
  swiss: [-1, -2, 2, 0, -1, -1], "dark-poster": [2, 0, 0, 0, 0, 1], riso: [1, 2, -1, 1, 2, 2], japan: [-2, -2, 2, -1, -1, -2],
  bauhaus: [1, -1, 2, 0, 0, -1], terminal: [0, -1, -1, -1, 0, 2], luxury: [-1, -2, 2, -2, -2, -2], blueprint: [0, -2, 1, 0, -1, -1],
  rave: [2, 2, -2, 1, 2, 2], broadcast: [2, 0, -1, 1, 0, 0], letterpress: [-2, -1, 2, 0, -1, -2], seventies: [1, 2, -1, 2, 1, 0],
  y2k: [1, 1, -2, 1, 1, -1], signage: [0, -2, 1, 2, -1, -1], earth: [-2, -1, 1, 1, -1, -1], jewel: [0, -1, 1, -1, -1, -2],
  graphite: [-1, -2, 0, -1, -1, -1], forest: [-1, -1, 1, 1, 0, -1],
};
