/* Taste Studio v2 — concept engine.
   Flow: Brief → Discover → Sources → Concepts → Refine → Prompt.
   Choices never override the concept: after a concept is picked, everything varies inside it. */
(() => {
"use strict";

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const HEX = /^#[0-9a-f]{6}$/i;
const rgb = h => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lum = h => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; const [r, g, b] = rgb(h); return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const mixHex = (a, b, t) => "#" + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
const meaningful = s => !!s && /[A-Za-z؀-ۿ]{3,}/.test(s) && s.trim().length >= 4;

const store = {
  get(k, d) { try { const v = localStorage.getItem("taste-studio:v2:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("taste-studio:v2:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

/* ---------------- fonts ---------------- */
const loaded = new Set();
const SERIF = /garamond|serif|bodoni|fraunces|gloock|young|literata|newsreader|spectral|marcellus|caslon|playfair|abril|alfa slab|cormorant/i;
const MONO = /mono|courier/i;
function loadFont(name) {
  if (!name || loaded.has(name)) return; loaded.add(name);
  const add = href => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); return l; };
  const fam = name.trim().replace(/\s+/g, "+");
  if (FONT_SPEC[name]) { add(`https://fonts.googleapis.com/css2?family=${FONT_SPEC[name]}&display=swap`); return; }
  const l = add(`https://fonts.googleapis.com/css2?family=${fam}:wght@400;700&display=swap`);
  l.onerror = () => add(`https://fonts.googleapis.com/css2?family=${fam}&display=swap`);
}
const stack = n => `"${n}", ${MONO.test(n) ? "ui-monospace, monospace" : SERIF.test(n) ? "Georgia, serif" : "system-ui, sans-serif"}`;

/* ---------------- state ---------------- */
const STEPS = [
  { id: "brief", t: "Brief" }, { id: "discover", t: "Discover" }, { id: "sources", t: "Art sources" },
  { id: "concepts", t: "Concepts" }, { id: "refine", t: "Refine" }, { id: "prompt", t: "Prompt" },
];
const EXAMPLE_BRIEF = {
  name: "YT Jobs", what: "A job board for the YouTube economy: creators hire editors, thumbnail designers and writers.",
  audience: "YouTube creators hiring, and freelancers looking for channel work", headline: "Hire the people behind great channels",
  cta: "Post a job", items: "Video editor, Thumbnail designer, Scriptwriter, Channel manager, Shorts clipper", keepFonts: "", keepColors: "", notes: "",
};
const DISCOVER0 = { truth: "", sliders: {}, place: null, feel: [], who: "", never: "", love: "", tired: "", remember: true };
const fresh = () => ({ step: 0, maxStep: 0, brief: { ...EXAMPLE_BRIEF }, discover: { ...DISCOVER0, ...store.get("designer", {}) },
  srcPicks: [], srcNope: [], srcShown: [], srcSig: "", concepts: [], conceptsBy: "", conceptKey: "", conceptNope: [], conceptPick: null,
  sketches: {}, avoidLiteral: [], refine: { pal: 0, type: 0, intensity: "measured" }, attachSketch: true, prompt: "", promptSource: "" });
const saved = store.get("session", {});
let S = Object.assign(fresh(), saved, { brief: { ...EXAMPLE_BRIEF, ...(saved.brief || {}) }, discover: { ...DISCOVER0, ...store.get("designer", {}), ...(saved.discover || {}) }, refine: { pal: 0, type: 0, intensity: "measured", ...(saved.refine || {}) } });
const save = () => store.set("session", S);
let history = store.get("history", []);
const D = () => S.discover;
const B = () => {
  const b = S.brief, items = b.items.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
  const what = (b.what || "").split(/(?<=[.!?])\s/)[0].slice(0, 130);
  return { name: b.name || "Product", head: b.headline || b.name || "Your headline", what, cta: b.cta || "Get started", items: items.length ? items : ["First", "Second", "Third"] };
};
const srcById = id => SOURCES.find(s => s.id === id);

/* ---------------- capabilities ---------------- */
let sample = null, downloads = null;
const cur = () => STEPS[S.step].id;
if (window.claude?.use) {
  window.claude.use("sample").then(s => { sample = s; if (s) render(); }).catch(() => {});
  window.claude.use("downloads").then(d => { downloads = d; if (d && cur() === "prompt") render(); }).catch(() => {});
}

/* ---------------- discover → ranking ---------------- */
function target() {
  const d = D(), t = [], w = [];
  SLIDERS.forEach((s, i) => { const v = d.sliders[s.id]; t[i] = 0; w[i] = 0; if (typeof v === "number") { t[i] = v; w[i] = 1; } });
  const pl = PLACES.find(p => p.id === d.place); if (pl) pl.vec.forEach((v, i) => { t[i] += v * .6; w[i] += .6; });
  if (!w.some(Boolean)) return null;
  return t.map((v, i) => w[i] ? { v: v / w[i], w: w[i] } : null);
}
function score(src) { const tg = target(); if (!tg) return 0; let s = 0; tg.forEach((x, i) => { if (x) s -= x.w * (src.vec[i] - x.v) ** 2; }); return s; }
const sliderWords = () => SLIDERS.map(s => { const v = D().sliders[s.id]; if (typeof v !== "number" || v === 0) return null; return `${Math.abs(v) === 2 ? "strongly" : "leaning"} ${(v < 0 ? s.left : s.right).toLowerCase()}`; }).filter(Boolean);

/* ---------------- palettes, type, vars ---------------- */
function fixPal(p) {
  p = { ...(p || {}) }; ["bg", "fg", "muted", "line", "accent", "accent2"].forEach(k => { if (!HEX.test(p[k] || "")) p[k] = null; });
  p.bg = p.bg || "#f4f2ed"; p.fg = p.fg || (lum(p.bg) > .4 ? "#141414" : "#f2f0ea");
  if (contrast(p.fg, p.bg) < 4.5) p.fg = contrast("#111111", p.bg) > contrast("#f5f5f2", p.bg) ? "#111111" : "#f5f5f2";
  p.muted = p.muted || mixHex(p.fg, p.bg, .4);
  let t = .4; while (contrast(p.muted, p.bg) < 3.2 && t > 0) { t -= .08; p.muted = mixHex(p.fg, p.bg, Math.max(0, t)); }
  p.line = p.line || mixHex(p.bg, p.fg, .16); p.accent = p.accent || p.fg; p.accent2 = p.accent2 || p.muted;
  return p;
}
function brandType() {
  const f = S.brief.keepFonts.split(/[,،/+]/).map(s => s.trim()).filter(Boolean);
  return f.length ? { display: f[0], dw: 700, body: f[1] || f[0], mono: f[2] || "IBM Plex Mono", dc: "none", dt: "-0.02em", lh: 1.02, brand: true } : null;
}
function brandPal() {
  const hs = (S.brief.keepColors.match(/#?[0-9a-f]{6}\b/gi) || []).map(h => "#" + h.replace("#", "").toLowerCase());
  if (hs.length < 2) return null;
  const byL = hs.slice().sort((a, b) => lum(b) - lum(a)), bg = byL[0], fg = byL[byL.length - 1], rest = hs.filter(h => h !== bg && h !== fg);
  return { ...fixPal({ bg, fg, accent: rest[0] || fg, accent2: rest[1] || rest[0] || fg }), brand: true };
}
function vars(p, t) {
  [t.display, t.body, t.mono].forEach(loadFont);
  return [`--bg:${p.bg}`, `--fg:${p.fg}`, `--muted:${p.muted}`, `--line:${p.line}`, `--accent:${p.accent}`, `--accent2:${p.accent2}`,
    `--display:${stack(t.display)}`, `--body:${stack(t.body)}`, `--mono:${stack(t.mono)}`, `--dw:${t.dw}`, `--dc:${t.dc || "none"}`, `--dt:${t.dt || "-0.02em"}`, `--lh:${t.lh || 1.02}`]
    .join(";").replace(/"/g, "&quot;");
}

/* ---------------- sketches ---------------- */
function localSketch(srcId, layout) {
  const b = B();
  return `<div class="sketch">${STUDY.svg(srcId, b)}<div class="ov ${layout}"><span class="eyebrow">${esc(b.name)}</span><h2>${esc(b.head)}</h2>${b.what ? `<p>${esc(b.what)}</p>` : ""}<span class="act">${esc(b.cta)} →</span></div></div>`;
}
function sanitize(html) {
  html = String(html || "").replace(/^[\s\S]*?```[a-z]*\s*/i, m => /```/.test(m) ? "" : m).replace(/```[\s\S]*$/, "").trim();
  if (window.DOMPurify) html = window.DOMPurify.sanitize(html, { FORCE_BODY: true, ADD_TAGS: ["style"], FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "meta", "base", "form", "input", "textarea", "button", "img", "image", "video", "audio", "foreignObject"], FORBID_ATTR: ["srcset", "action", "formaction"] });
  else html = html.replace(/<(script|iframe|object|embed|form|video|audio|textarea)\b[\s\S]*?<\/\1\s*>/gi, "").replace(/<\/?(script|iframe|object|embed|link|meta|base|form|img|image|video|audio|input|button|textarea|foreignObject)\b[^>]*>/gi, "").replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/javascript:/gi, "");
  return html.replace(/@import[^;]+;/gi, "").replace(/@font-face\s*\{[^}]*\}/gi, "").replace(/url\(\s*(['"]?)(?!#|data:)[^)]*\)/gi, "none").replace(/position\s*:\s*fixed/gi, "position:absolute");
}
const sizer = new ResizeObserver(es => es.forEach(e => { const f = e.target.querySelector(".frame"); if (f) f.style.transform = `scale(${e.contentRect.width / 1200})`; }));
function mountStage(stage, { html, claude, styleVars }) {
  if (!stage) return;
  stage.innerHTML = `<div class="frame" style="${styleVars}"></div>`;
  const frame = stage.firstElementChild;
  if (claude) {
    const host = document.createElement("div"); host.style.cssText = "width:1200px;height:750px;position:relative";
    frame.appendChild(host);
    host.attachShadow({ mode: "open" }).innerHTML = `<style>:host{display:block;width:1200px;height:750px;overflow:hidden}${reduce ? "*{animation:none!important;transition:none!important}" : ""}</style>${sanitize(html)}`;
  } else frame.innerHTML = html;
  frame.style.transform = `scale(${(stage.clientWidth || 1200) / 1200})`;
  sizer.observe(stage);
}

/* ---------------- concept helpers ---------------- */
const concept = () => S.concepts[S.conceptPick] || null;
const conceptType = c => {
  const f = c.fonts || {}, src = srcById(c.sources[0]) || SOURCES[0];
  return f.display ? { display: f.display, dw: +f.display_weight || 400, body: f.body || f.display, mono: f.mono || "IBM Plex Mono", dc: f.display_case === "uppercase" ? "uppercase" : "none", dt: "-0.02em", lh: 1.02 } : src.fonts[0];
};
function palVariants(c) {
  const cp = fixPal(c.palette), out = [{ label: "Concept palette", p: cp }];
  const bp = brandPal(); if (bp) out.unshift({ label: "Your brand colors", p: bp });
  c.sources.forEach(id => { const s = srcById(id); if (s) s.pals.forEach((p, i) => out.push({ label: `${s.name} · ${i + 1}`, p: fixPal(p) })); });
  out.push({ label: "Concept, inverted", p: fixPal({ ...cp, bg: cp.fg, fg: cp.bg, muted: null, line: null }) });
  const seen = new Set(); return out.filter(v => { const k = v.p.bg + v.p.accent; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
}
function typeVariants(c) {
  const out = [{ label: "Concept type", t: conceptType(c) }];
  const bt = brandType(); if (bt) out.unshift({ label: "Your brand fonts", t: bt });
  c.sources.forEach(id => { const s = srcById(id); if (s) s.fonts.forEach(t => out.push({ label: `${t.display} + ${t.body}`, t })); });
  const seen = new Set(); return out.filter(v => { const k = v.t.display + v.t.body; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
}
const curPal = () => { const v = palVariants(concept()); return (v[S.refine.pal] || v[0]).p; };
const curType = () => { const v = typeVariants(concept()); return (v[S.refine.type] || v[0]).t; };
function sketchFor(c, i, p, t) {
  const html = S.sketches[i];
  return html ? { html, claude: true, styleVars: vars(p, t) } : { html: localSketch(c.sources[0], c.layout || (srcById(c.sources[0]) || {}).layout || "left"), claude: false, styleVars: vars(p, t) };
}

/* ---------------- step: brief ---------------- */
const F = (id, label, help, o = {}) => `<div class="field"><label for="f-${id}">${label}</label>${o.area
  ? `<textarea id="f-${id}" data-k="${id}" placeholder="${esc(o.ph || "")}">${esc(S.brief[id])}</textarea>`
  : `<input id="f-${id}" data-k="${id}" value="${esc(S.brief[id])}" placeholder="${esc(o.ph || "")}">`}${help ? `<small>${help}</small>` : ""}</div>`;
function renderBrief(main) {
  main.innerHTML = `<div class="head"><div><h1>First, what are we designing?</h1><p>Every sketch is built from this copy, so keep it short and real. The form is filled with the YT Jobs example.</p></div></div>
  <div class="brief"><div class="card">
    ${F("name", "Product name", "")}${F("what", "The product in one sentence", "", { area: 1 })}${F("audience", "Audience", "")}
    <div class="row2">${F("headline", "Sample headline", "Shown in every sketch")}${F("cta", "Primary action", "")}</div>
    ${F("items", "A few real items", "Comma-separated; some art sources use them")}
    <div class="section-label">Keep your brand (optional)</div>
    <div class="row2">${F("keepFonts", "Current fonts", "e.g. Poppins, Inter (Google Fonts)", { ph: "Display, Body" })}${F("keepColors", "Current colors", "Hex codes, comma-separated", { ph: "#111111, #ffffff, #ff0033" })}</div>
    ${F("notes", "Notes for the prompt", "Anything the design must respect", { area: 1 })}
  </div>
  <div class="card"><div class="section-label">How this works</div>
    <div class="stage static" id="brief-prev" aria-hidden="true"></div>
    <ol class="how"><li><b>01</b><span>Discover: a few abstract questions, starting with the truth about your product that nobody puts on a homepage.</span></li>
    <li><b>02</b><span>Art sources: pick up to three bodies of work whose <em>operation</em> you're drawn to. Not their look.</span></li>
    <li><b>03</b><span>Concepts: Claude collides your truth with the art and sketches four concepts, each with one rule that generates the page.</span></li>
    <li><b>04</b><span>Refine palette, type and intensity inside the concept you pick, then take the prompt.</span></li></ol></div></div>`;
  const prev = $("#brief-prev"), s = srcById("miniature");
  const paint = () => mountStage(prev, { html: localSketch(s.id, s.layout), claude: false, styleVars: vars(fixPal(s.pals[0]), s.fonts[0]) });
  paint(); let tm;
  main.querySelectorAll("[data-k]").forEach(inp => inp.addEventListener("input", () => { S.brief[inp.dataset.k] = inp.value; save(); clearTimeout(tm); tm = setTimeout(paint, 300); renderBar(); }));
}

/* ---------------- step: discover ---------------- */
function renderDiscover(main) {
  const d = D(), b = S.brief; if (!d.who) d.who = b.audience;
  const seg = s => `<div class="sl" role="group" aria-label="${s.left} to ${s.right}"><span class="l">${s.left}</span><div class="seg">${[-2, -1, 0, 1, 2].map(v =>
    `<button data-sl="${s.id}" data-v="${v}" aria-pressed="${d.sliders[s.id] === v}" aria-label="${v === 0 ? "In between" : (Math.abs(v) === 2 ? "Strongly " : "Somewhat ") + (v < 0 ? s.left : s.right)}" style="--d:${[16, 11, 6, 11, 16][v + 2]}px"></button>`).join("")}</div><span class="r">${s.right}</span></div>`;
  main.innerHTML = `<div class="head"><div><h1>Before the visuals: what is true here?</h1><p>The concepts grow from these answers. The first question matters most; everything else is optional.</p></div></div>
  <div class="disc">
    <section class="card"><h2>The truth</h2><p class="lead">What is true about ${esc(b.name || "this product")} that nobody puts on the homepage? A tension, a paradox, something people feel but don't say.</p>
      <label class="qlabel" for="q-truth" style="margin-top:0">The truth</label>
      <textarea class="truth" id="q-truth" data-q="truth" placeholder="e.g. The people who make a video great are never in the video.">${esc(d.truth)}</textarea></section>
    <section class="card"><h2>The character</h2><p class="lead">Where does it sit between each pair? Skip rows that don't matter.</p><div class="sliders">${SLIDERS.map(seg).join("")}</div></section>
    <section class="card"><h2>If it were a place</h2><p class="lead">This shapes the atmosphere, never the imagery.</p>
      <div class="tiles">${PLACES.map(p => `<button class="tile-btn" data-place="${p.id}" aria-pressed="${d.place === p.id}"><strong>${p.name}</strong><span>${p.desc}</span></button>`).join("")}</div></section>
    <section class="card"><h2>The first five seconds</h2><p class="lead">What should a visitor feel before reading anything? Up to two.</p>
      <div class="chipset" data-chips="feel">${FEELINGS.map(x => `<button data-val="${x}" aria-pressed="${d.feel.includes(x)}">${x}</button>`).join("")}</div></section>
    <section class="card"><h2>Who, and what to avoid</h2>
      <div class="field"><label for="q-who">Who arrives</label><input id="q-who" data-q="who" value="${esc(d.who)}"></div>
      <div class="field"><label for="q-never">It must never look like…</label><input id="q-never" data-q="never" value="${esc(d.never)}" placeholder="e.g. a generic freelancer marketplace"></div></section>
    <section class="card"><h2>About you</h2><p class="lead">Read as principles to learn from, never as a look to copy.</p>
      <div class="field"><label for="q-love">A work you love that isn't a website</label><input id="q-love" data-q="love" value="${esc(d.love)}" placeholder="a building, an album cover, a book, an object"></div>
      <div class="field"><label for="q-tired">What are you tired of seeing?</label><input id="q-tired" data-q="tired" value="${esc(d.tired)}" placeholder="e.g. bento grids, gradient blobs"></div>
      <label class="check"><input type="checkbox" id="q-remember" ${d.remember ? "checked" : ""}> Remember these two answers next time</label></section>
  </div>`;
  const keep = () => store.set("designer", d.remember ? { love: d.love, tired: d.tired, remember: true } : { remember: false });
  main.querySelectorAll("[data-sl]").forEach(btn => btn.onclick = () => {
    const id = btn.dataset.sl, v = +btn.dataset.v; d.sliders[id] = d.sliders[id] === v ? undefined : v;
    btn.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", d.sliders[id] === +x.dataset.v)); save();
  });
  main.querySelectorAll("[data-place]").forEach(btn => btn.onclick = () => { d.place = d.place === btn.dataset.place ? null : btn.dataset.place; main.querySelectorAll("[data-place]").forEach(x => x.setAttribute("aria-pressed", d.place === x.dataset.place)); save(); });
  $("[data-chips=feel]").onclick = e => { const btn = e.target.closest("button"); if (!btn) return; const s = new Set(d.feel); s.has(btn.dataset.val) ? s.delete(btn.dataset.val) : s.add(btn.dataset.val); d.feel = [...s].slice(-2);
    e.currentTarget.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", d.feel.includes(x.dataset.val))); save(); };
  main.querySelectorAll("[data-q]").forEach(inp => inp.oninput = () => { d[inp.dataset.q] = inp.value; save(); if (inp.dataset.q === "love" || inp.dataset.q === "tired") keep(); });
  $("#q-remember").onchange = e => { d.remember = e.target.checked; keep(); save(); };
}

/* ---------------- step: sources ---------------- */
const discSig = () => JSON.stringify([D().sliders, D().place]);
function ensureShown() {
  const nope = new Set(S.srcNope);
  if (S.srcSig !== discSig()) { S.srcSig = discSig(); S.srcShown = []; }
  let shown = S.srcShown.filter(id => srcById(id));
  if (!shown.length) {
    const ranked = SOURCES.filter(s => !nope.has(s.id)).sort((a, b) => score(b) - score(a)).map(s => s.id);
    shown = target() ? ranked.slice(0, 4).concat(shuffle(ranked.slice(4)).slice(0, 2)) : shuffle(ranked).slice(0, 6);
    S.srcPicks.forEach(id => { if (!shown.includes(id)) shown.unshift(id); });
    shown = shown.slice(0, Math.max(6, S.srcPicks.length));
  }
  return (S.srcShown = shown);
}
function moreSources() {
  const nope = new Set(S.srcNope), now = new Set(S.srcShown);
  let next = shuffle(SOURCES.map(s => s.id).filter(id => !now.has(id) && !nope.has(id) && !S.srcPicks.includes(id)));
  if (next.length < 6) next = next.concat(shuffle(SOURCES.map(s => s.id).filter(id => !nope.has(id) && !S.srcPicks.includes(id) && !next.includes(id))));
  S.srcShown = S.srcPicks.concat(next).slice(0, Math.max(6, S.srcPicks.length + 3)); save(); render();
}
function renderSources(main) {
  const ids = ensureShown(), fits = target() ? new Set(SOURCES.slice().sort((a, b) => score(b) - score(a)).slice(0, 5).map(s => s.id)) : new Set();
  main.innerHTML = `<div class="head"><div><h1>Which works of art speak to this?</h1><p>Each plate is an original study of how a body of work <em>operates</em>. You're choosing the operation, not the look. Pick up to three; reject what feels wrong.</p></div>
    <div class="legend"><span><b>${S.srcPicks.length}</b> of 3 picked</span><span><b>${SOURCES.length}</b> in the library</span></div></div>
    <div class="grid">${ids.map(id => { const s = srcById(id), picked = S.srcPicks.includes(id), noped = S.srcNope.includes(id);
      return `<article class="opt ${picked ? "picked" : ""} ${noped ? "noped" : ""}" data-id="${id}"><span class="badge">Picked</span>
        <button class="stage" data-act="pick" aria-label="Pick ${esc(s.name)}"></button>
        <div class="meta"><div class="txt"><strong>${esc(s.name)}${fits.has(id) ? `<span class="tag fit">fits your answers</span>` : ""}</strong><span>after ${esc(s.after)} · ${s.kind}</span></div>
        <button class="icon-btn nope ${noped ? "on" : ""}" data-act="nope" aria-pressed="${noped}">✕ No</button>
        <button class="icon-btn pick ${picked ? "on" : ""}" data-act="pick" aria-pressed="${picked}">${picked ? "✓ Picked" : "Pick"}</button></div>
        <p class="op">${esc(s.op)}</p></article>`; }).join("")}</div>`;
  main.querySelectorAll(".opt").forEach(card => {
    const s = srcById(card.dataset.id);
    mountStage(card.querySelector(".stage"), { html: localSketch(s.id, s.layout), claude: false, styleVars: vars(fixPal(s.pals[0]), s.fonts[0]) });
    card.addEventListener("click", e => {
      const act = e.target.closest("[data-act]")?.dataset.act; if (!act) return; const id = s.id;
      if (act === "pick") {
        if (S.srcPicks.includes(id)) S.srcPicks = S.srcPicks.filter(x => x !== id);
        else { if (S.srcPicks.length >= 3) { toast("Three at most — unpick one first"); return; } S.srcPicks.push(id); S.srcNope = S.srcNope.filter(x => x !== id); }
      }
      if (act === "nope") { if (S.srcNope.includes(id)) S.srcNope = S.srcNope.filter(x => x !== id); else { S.srcNope.push(id); S.srcPicks = S.srcPicks.filter(x => x !== id); } }
      save(); render();
    });
  });
}

/* ---------------- step: concepts ---------------- */
const conceptKey = () => JSON.stringify([S.srcPicks, D().truth, S.brief.name, S.brief.what]);
function farSource() {
  const pool = SOURCES.filter(s => !S.srcPicks.includes(s.id) && !S.srcNope.includes(s.id));
  const kinds = new Set(S.srcPicks.map(id => srcById(id).kind)), other = pool.filter(s => !kinds.has(s.kind)), list = other.length ? other : pool;
  if (!list.length) return null;
  return target() ? list.slice().sort((a, b) => score(a) - score(b))[Math.floor(Math.random() * Math.min(3, list.length))] : shuffle(list)[0];
}
function localConcepts() {
  const b = B(), d = D(), truth = d.truth.trim() || S.brief.what || `${b.name} exists for ${S.brief.audience}`;
  const list = S.srcPicks.map(srcById).filter(Boolean), far = farSource();
  if (far) list.push(far);
  while (list.length < 4) { const f = farSource(); if (!f || list.includes(f)) break; list.push(f); }
  return list.slice(0, 4).map(s => ({
    title: `${s.name}${s === far ? " (wildcard)" : ""}`, sources: [s.id],
    idea: `${truth.replace(/[.!]+$/, "")}. Told the way ${s.after} works: ${s.op.charAt(0).toLowerCase() + s.op.slice(1)}`,
    rule: s.rule, composition: s.comp, typography: s.type, color: s.color, motion: s.motion, sacrifice: s.sacrifice,
    removal_test: "Remove the rule and the page should stop making sense; if it still works the same, the rule was decoration.",
    palette: s.pals[0], fonts: { display: s.fonts[0].display, display_weight: s.fonts[0].dw, display_case: s.fonts[0].dc, body: s.fonts[0].body, mono: s.fonts[0].mono }, layout: s.layout,
  }));
}
const srcLine = s => `- ${s.id}: ${s.name} (after ${s.after}). Operation: ${s.op} Rule: ${s.rule}`;
function conceptRequest(far) {
  const b = S.brief, d = D(), pl = PLACES.find(p => p.id === d.place);
  return `You are an art director known for concepts that come from art, not from digital design trends.
Create exactly 4 landing-page concepts for the product below by colliding THE TRUTH about the product with the ART SOURCES.

PRODUCT
Name: ${b.name}
What it is: ${b.what}
Audience: ${d.who || b.audience}
Real items: ${b.items}
Headline idea: ${b.headline}
Primary action: ${b.cta}

THE TRUTH (what nobody puts on the homepage)
${d.truth.trim() || "(not given: find one yourself from the product description and state it inside each idea)"}

CHARACTER
- ${sliderWords().join(", ") || "not given"}
- Atmosphere: ${pl ? `${pl.name} (${pl.desc})` : "not given"}
- First five seconds: ${d.feel.join(", ") || "not given"}
- Must never look like: ${d.never || "not given"}
${meaningful(d.love) ? `- The designer loves (borrow principles only): ${d.love}` : ""}
${meaningful(d.tired) ? `- The designer is tired of: ${d.tired}` : ""}

ART SOURCES THE DESIGNER CHOSE (use their operations; never imitate the look of a specific artwork)
${S.srcPicks.map(id => srcLine(srcById(id))).join("\n")}

FAR SOURCE (concept 4 only, to force a surprising collision)
${far ? srcLine(far) : "(none)"}

Rules
- Concepts 1–3 each start from one chosen source; at most one of them may combine two chosen sources. Concept 4 collides THE TRUTH with the far source.
- The idea comes from the truth, not from a literal picture of the product. List the literal metaphors you avoided in "avoid_literal".
- Each concept has one RULE: a single sentence that generates the whole page and can be checked against any element.
- Avoid digital-trend devices: ${TREND_AVOID}.
- No invented facts, numbers, testimonials or names.
- Palette: six hex colors that suit the source; "fg" must have at least 4.5:1 contrast on "bg".
- Fonts: real Google Fonts only.
- Keep every text field to one or two sentences. Use the source ids exactly as given.

Reply with only JSON in this shape:
{"avoid_literal": ["..."], "concepts": [{"title": "", "sources": ["source id"], "idea": "", "rule": "", "composition": "", "typography": "", "color": "", "motion": "", "sacrifice": "", "removal_test": "", "palette": {"bg": "#", "fg": "#", "muted": "#", "line": "#", "accent": "#", "accent2": "#"}, "fonts": {"display": "", "display_weight": 400, "display_case": "none", "body": "", "mono": ""}, "layout": "left"}]}`;
}
function normalizeConcepts(raw, far) {
  const list = Array.isArray(raw?.concepts) ? raw.concepts : Array.isArray(raw) ? raw : [];
  return list.slice(0, 4).map((c, i) => {
    let sources = (Array.isArray(c.sources) ? c.sources : []).map(x => String(x).toLowerCase()).filter(id => srcById(id));
    if (!sources.length) sources = [i === 3 && far ? far.id : (S.srcPicks[i % S.srcPicks.length] || "albers")];
    const s = srcById(sources[0]);
    return { title: String(c.title || s.name), sources, idea: String(c.idea || ""), rule: String(c.rule || s.rule), composition: String(c.composition || s.comp),
      typography: String(c.typography || s.type), color: String(c.color || s.color), motion: String(c.motion || s.motion), sacrifice: String(c.sacrifice || s.sacrifice),
      removal_test: String(c.removal_test || "Remove the rule and the page should stop making sense."),
      palette: fixPal(c.palette && typeof c.palette === "object" ? c.palette : s.pals[0]),
      fonts: c.fonts?.display ? c.fonts : { display: s.fonts[0].display, display_weight: s.fonts[0].dw, display_case: s.fonts[0].dc, body: s.fonts[0].body, mono: s.fonts[0].mono },
      layout: ["left", "center", "bottom", "top"].includes(c.layout) ? c.layout : s.layout };
  }).filter(c => c.idea);
}
function useLocal(msg) { S.concepts = localConcepts(); S.conceptsBy = "local"; S.conceptKey = conceptKey(); S.conceptPick = null; S.conceptNope = []; S.sketches = {}; save(); if (msg) toast(msg); }

let genCtl = null, genBusy = false; const sketchBusy = new Set(); let sketchQueue = [], sketchRunning = 0;
async function generateConcepts() {
  if (genBusy || !sample) return; genBusy = true; render();
  const far = farSource(); genCtl = new AbortController();
  try {
    const raw = await sample.json(conceptRequest(far), { signal: genCtl.signal, cache: false });
    const list = normalizeConcepts(raw, far); if (!list.length) throw { code: "invalid_json" };
    S.concepts = list; S.conceptsBy = "claude"; S.avoidLiteral = Array.isArray(raw?.avoid_literal) ? raw.avoid_literal.map(String).slice(0, 8) : [];
    S.conceptPick = null; S.conceptNope = []; S.sketches = {}; S.conceptKey = conceptKey(); save();
  } catch (e) {
    if (e?.code !== "cancelled") useLocal(e?.code === "not_granted" ? "Claude access wasn’t allowed — showing local drafts" : e?.code === "rate_limited" ? "Usage limit reached — showing local drafts" : "Couldn’t get concepts from Claude — showing local drafts");
  } finally { genBusy = false; genCtl = null; render(); }
}
function sketchRequest(c) {
  const b = B();
  return `Draw the first screen (hero) of this landing-page concept as a static HTML and CSS sketch. It should read as an art piece first and a web page second.

CONCEPT: ${c.title}
Idea: ${c.idea}
RULE (make it visible; someone should be able to guess the rule from the sketch): ${c.rule}
Composition: ${c.composition}
Typography: ${c.typography}
Color: ${c.color}
Motion: ${c.motion}
Art source operations: ${c.sources.map(id => { const s = srcById(id); return `${s.name} (after ${s.after}): ${s.op}`; }).join(" | ")}
Never imitate the look of a specific artwork. Avoid: ${TREND_AVOID}${S.avoidLiteral.length ? `; literal metaphors such as ${S.avoidLiteral.join(", ")}` : ""}.

CONTENT
Product name: ${b.name}
Headline (you may tighten it): ${b.head}
One supporting line: ${b.what}
Primary action: ${b.cta}
Real items you may use: ${b.items.join(", ")}

TECHNICAL RULES (strict)
- Reply with ONLY an HTML fragment: one <style> element followed by one <div class="sketch">…</div>. No markdown fences, no explanation.
- .sketch is exactly 1200px wide and 750px tall, position: relative, overflow: hidden, background: var(--bg). Scope every selector under .sketch.
- Colors: only var(--bg), var(--fg), var(--muted), var(--line), var(--accent), var(--accent2), color-mix() of them, or transparent.
- Fonts: only var(--display), var(--body), var(--mono); the display weight is var(--dw).
- Shapes with CSS or inline <svg>. No <script>, no event attributes, no <img>, no external URLs, no @import, no @font-face.
- CSS @keyframes only if the concept's motion calls for it, inside @media (prefers-reduced-motion: no-preference).
- Text readable (at least 4.5:1) and the primary action clearly visible.`;
}
function queueSketch(i) { if (!sample || sketchBusy.has(i)) return; sketchBusy.add(i); sketchQueue.push(i); pump(); }
function pump() {
  while (sketchRunning < 2 && sketchQueue.length) {
    const i = sketchQueue.shift(), c = S.concepts[i]; if (!c) { sketchBusy.delete(i); continue; }
    sketchRunning++; spinner(i);
    sample(sketchRequest(c), { cache: false }).then(({ text }) => { if (S.concepts[i] === c && /class=["']?sketch/.test(text)) { S.sketches[i] = text; save(); } })
      .catch(e => { if (e?.code === "not_granted" || e?.code === "sampling_disabled") { sample = null; sketchQueue.forEach(k => sketchBusy.delete(k)); sketchQueue = []; } })
      .finally(() => { sketchRunning--; sketchBusy.delete(i); afterSketch(i); pump(); });
  }
}
function spinner(i) { const el = document.querySelector(`.concept[data-i="${i}"] .spin`); if (el) el.hidden = !sketchBusy.has(i); }
function afterSketch(i) {
  if (cur() === "concepts") paintConcept(i);
  else if ((cur() === "refine" || cur() === "prompt") && i === S.conceptPick) render();
}
function paintConcept(i) {
  const card = document.querySelector(`.concept[data-i="${i}"]`); if (!card) return; const c = S.concepts[i], stage = card.querySelector(".stage");
  mountStage(stage, sketchFor(c, i, fixPal(c.palette), conceptType(c)));
  stage.insertAdjacentHTML("beforeend", `<span class="spin" ${sketchBusy.has(i) ? "" : "hidden"}>Sketching…</span>`);
}
function renderConcepts(main) {
  if (S.conceptKey !== conceptKey()) { S.concepts = []; S.sketches = {}; S.conceptPick = null; S.conceptsBy = ""; }
  if (!S.concepts.length && !genBusy) { if (sample) { generateConcepts(); return; } useLocal(); }
  if (genBusy) {
    main.innerHTML = `<div class="head"><div><h1>Colliding your truth with the art…</h1><p>Claude is writing four concepts, each with one rule that generates the page. This usually takes under a minute.</p></div></div>
      <div class="loader"><div class="pulse" aria-hidden="true"></div><strong>Writing concepts</strong><span>Uses your own Claude account.</span><button class="btn" id="g-stop">Stop and use local drafts</button></div>`;
    $("#g-stop").onclick = () => { genCtl?.abort(); useLocal(); };
    return;
  }
  const local = S.conceptsBy === "local";
  main.innerHTML = `<div class="head"><div><h1>Four concepts. Pick the one with a pulse.</h1><p>${local
    ? "These are local drafts built straight from your sources. Open the studio inside Claude to get concepts and sketches written for your product."
    : "Each concept has one rule. Claude draws a sketch for each; until it arrives you see a study of the source."}</p></div>
    <div class="legend">${sample ? `<button class="btn" id="c-new">New concepts</button>` : ""}</div></div>
    <div class="concepts">${S.concepts.map((c, i) => {
      const picked = S.conceptPick === i, noped = S.conceptNope.includes(i);
      return `<article class="concept ${picked ? "picked" : ""} ${noped ? "noped" : ""}" data-i="${i}">
        <div class="stage static" role="img" aria-label="Sketch of ${esc(c.title)}"></div>
        <div class="body"><h3>${esc(c.title)}</h3><div class="src">${c.sources.map(id => `<span>after ${esc(srcById(id).after)}</span>`).join("")}</div>
        <p class="idea">${esc(c.idea)}</p><p class="rule">Rule: ${esc(c.rule)}</p>
        <dl><dt>Composition</dt><dd>${esc(c.composition)}</dd><dt>Type</dt><dd>${esc(c.typography)}</dd><dt>Color</dt><dd>${esc(c.color)}</dd><dt>Motion</dt><dd>${esc(c.motion)}</dd><dt>Sacrifice</dt><dd>${esc(c.sacrifice)}</dd></dl>
        <div class="acts"><button class="icon-btn pick ${picked ? "on" : ""}" data-act="pick" aria-pressed="${picked}">${picked ? "✓ This one" : "Pick this concept"}</button>
        <button class="icon-btn nope ${noped ? "on" : ""}" data-act="nope" aria-pressed="${noped}">✕ No</button>
        ${sample ? `<button class="icon-btn" data-act="redraw">Redraw sketch</button>` : ""}</div></div></article>`; }).join("")}</div>`;
  if (sample && !local) S.concepts.forEach((_, i) => { if (!S.sketches[i]) queueSketch(i); });
  S.concepts.forEach((_, i) => paintConcept(i));
  main.querySelectorAll(".concept").forEach(card => card.addEventListener("click", e => {
    const act = e.target.closest("[data-act]")?.dataset.act; if (!act) return; const i = +card.dataset.i;
    if (act === "redraw") { delete S.sketches[i]; save(); queueSketch(i); paintConcept(i); return; }
    if (act === "pick") { S.conceptPick = S.conceptPick === i ? null : i; S.conceptNope = S.conceptNope.filter(x => x !== i); S.refine = { pal: 0, type: 0, intensity: S.refine.intensity }; S.prompt = ""; }
    if (act === "nope") { if (S.conceptNope.includes(i)) S.conceptNope = S.conceptNope.filter(x => x !== i); else { S.conceptNope.push(i); if (S.conceptPick === i) S.conceptPick = null; } }
    save(); render();
  }));
  if ($("#c-new")) $("#c-new").onclick = () => { S.concepts = []; S.sketches = {}; S.conceptKey = ""; generateConcepts(); };
}

/* ---------------- step: refine ---------------- */
const INTENSITY = [
  { id: "quiet", t: "Quiet", d: "Generous space, one focal point per screen, motion only on interaction." },
  { id: "measured", t: "Measured", d: "One focal point per screen; restrained motion that serves the rule." },
  { id: "bold", t: "Bold", d: "The rule pushed to its extreme on the first screen; large scale and contrast." },
];
function varCard(kind, k, label) {
  const on = S.refine[kind] === k;
  return `<article class="opt ${on ? "picked" : ""}" data-k="${k}"><span class="badge">Selected</span><button class="stage" data-act="pick" aria-label="Use ${esc(label)}"></button>
    <div class="meta"><div class="txt"><strong>${esc(label)}</strong></div><button class="icon-btn pick ${on ? "on" : ""}" data-act="pick" aria-pressed="${on}">${on ? "✓ Selected" : "Use"}</button></div></article>`;
}
function renderRefine(main) {
  const c = concept(), i = S.conceptPick, pv = palVariants(c), tv = typeVariants(c);
  main.innerHTML = `<div class="head"><div><h1>Refine inside the concept.</h1><p>Nothing here can break the rule; you're tuning how it sounds.${S.sketches[i] ? "" : " Previews use the source study until Claude's sketch arrives."}</p></div></div>
    <div class="refine-top"><div class="stage static" id="r-main" role="img" aria-label="Current sketch"></div>
      <div class="card"><div class="section-label">Concept</div><h2>${esc(c.title)}</h2><p class="lead" style="margin:6px 0 14px">${esc(c.idea)}</p>
      <p style="margin:0 0 18px;padding:12px 14px;background:var(--surface);border-left:3px solid var(--accent);border-radius:0 8px 8px 0;font-weight:600">Rule: ${esc(c.rule)}</p>
      <div class="section-label">Intensity</div><div class="chipset" id="r-int">${INTENSITY.map(x => `<button data-v="${x.id}" aria-pressed="${S.refine.intensity === x.id}">${x.t}</button>`).join("")}</div>
      <p class="note" id="r-int-d" style="margin-top:10px">${esc(INTENSITY.find(x => x.id === S.refine.intensity).d)}</p></div></div>
    <h2 class="sub-title">Palette</h2><div class="grid three" id="r-pal">${pv.map((v, k) => varCard("pal", k, v.label)).join("")}</div>
    <h2 class="sub-title">Type</h2><div class="grid three" id="r-type">${tv.map((v, k) => varCard("type", k, v.label)).join("")}</div>`;
  mountStage($("#r-main"), sketchFor(c, i, curPal(), curType()));
  pv.forEach((v, k) => mountStage(document.querySelector(`#r-pal [data-k="${k}"] .stage`), sketchFor(c, i, v.p, curType())));
  tv.forEach((v, k) => mountStage(document.querySelector(`#r-type [data-k="${k}"] .stage`), sketchFor(c, i, curPal(), v.t)));
  ["pal", "type"].forEach(kind => $("#r-" + kind).onclick = e => {
    const card = e.target.closest(".opt"); if (!card || !e.target.closest("[data-act]")) return;
    S.refine[kind] = +card.dataset.k; S.prompt = ""; save(); render();
  });
  $("#r-int").onclick = e => { const b = e.target.closest("button"); if (!b) return; S.refine.intensity = b.dataset.v; S.prompt = ""; save();
    $("#r-int").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === b.dataset.v)); $("#r-int-d").textContent = INTENSITY.find(x => x.id === b.dataset.v).d; };
  if (sample && S.conceptsBy === "claude" && !S.sketches[i]) queueSketch(i);
}

/* ---------------- step: prompt ---------------- */
function warnings() {
  const d = D(), w = [], e = d.sliders.energy, it = S.refine.intensity;
  if (!d.truth.trim()) w.push("No truth was given, so the concept leans on the product description. Add one in Discover for a sharper idea.");
  if (typeof e === "number" && e >= 1 && it === "quiet") w.push("You described the product as loud but chose a quiet intensity. The prompt follows the intensity; change one if that's not what you want.");
  if (typeof e === "number" && e <= -1 && it === "bold") w.push("You described the product as quiet but chose a bold intensity. Bold pushes the rule hard; check that's intended.");
  if (curType().brand) w.push("Your brand fonts replace the concept's type, so the concept has to work through composition and color.");
  if (S.conceptsBy === "local") w.push("This concept is a local draft. Inside Claude, concepts are written for your product and the prompt can be polished.");
  return w;
}
function buildPrompt() {
  const b = S.brief, d = D(), c = concept(), p = curPal(), t = curType(), it = INTENSITY.find(x => x.id === S.refine.intensity), pl = PLACES.find(x => x.id === d.place);
  const srcs = c.sources.map(srcById), bp = brandPal(), bt = brandType(), sketch = S.sketches[S.conceptPick] && S.attachSketch ? S.sketches[S.conceptPick] : null;
  const L = [
    `Build a landing page for ${b.name}${b.what ? ` — ${b.what.trim().replace(/[.!]+$/, "")}` : ""}.`,
    "It must read as an art piece first and a web page second, while staying usable.",
    "", "THE TRUTH", `- ${d.truth.trim() || "(not stated; the concept below carries it)"}`,
    "", `CONCEPT — ${c.title}`, `- ${c.idea}`,
    "", "THE RULE (every element on the page obeys this)", `- ${c.rule}`,
    "", "ART SOURCE (borrow the operation, never the look; no copies or recognizable reproductions)",
    ...srcs.map(s => `- ${s.name}, after ${s.after}: ${s.op}`),
    "", "HOW THE RULE SHOWS UP",
    `- Composition: ${c.composition}`, `- Typography: ${c.typography}`, `- Color: ${c.color}`, `- Motion: ${c.motion}`,
    "", "WHAT WE SACRIFICE", `- ${c.sacrifice}`,
    "", "PAGE",
    "- A hero and two to four further sections. Choose them from what the rule can express; every section must obey the rule.",
    "- No generic SaaS sections. If a section cannot be made to obey the rule, cut it.",
    "", "AUDIENCE", `- Who arrives: ${d.who || b.audience}`,
    d.feel.length ? `- In the first five seconds they should feel: ${d.feel.map(x => x.toLowerCase()).join(" and ")}` : null,
    sliderWords().length ? `- Character: ${sliderWords().join(", ")}` : null,
    pl ? `- Atmosphere: like ${pl.name.toLowerCase()}, ${pl.desc.toLowerCase()} (a quality, never a picture)` : null,
    "", "CONTENT", `- Headline: "${b.headline}"`, `- Primary action: "${b.cta}"`, `- Real items: ${b.items}`,
    "- Invent nothing: no numbers, prices, testimonials or names that are not given. Use placeholders like [PRICE].",
    b.notes ? `- Designer notes: ${b.notes}` : null,
    "", "STARTING VALUES (the concept wins over any value here)",
    `- Ground ${p.bg}, text ${p.fg}, muted ${p.muted}, lines ${p.line}, accent ${p.accent}, second accent ${p.accent2}. Text contrast at least 4.5:1.`,
    `- Display "${t.display}" weight ${t.dw}${t.dc === "uppercase" ? ", uppercase" : ""}; body "${t.body}"; labels "${t.mono}". Google Fonts only.`,
    `- Intensity: ${it.t.toLowerCase()}. ${it.d}`,
    (bp || bt) ? "" : null, (bp || bt) ? "BRAND CONSTRAINTS (fixed)" : null,
    bt ? `- Fonts are fixed: ${bt.display} for display, ${bt.body} for body.` : null,
    bp ? `- Colors are fixed: ${b.keepColors}. Add only neutrals.` : null,
    meaningful(d.love) ? "" : null, meaningful(d.love) ? "DESIGNER REFERENCE" : null,
    meaningful(d.love) ? `- The designer loves ${d.love.trim()}. Borrow its principles (proportion, restraint, rhythm), never its look.` : null,
    "", "REMOVAL TEST", `- ${c.removal_test}`,
    "- If the rule can be removed and the page still works the same, the rule was decoration. Redo it until removing the rule breaks the page.",
    "", "AVOID",
    `- Digital-trend devices unless the rule demands them: ${TREND_AVOID}.`,
    `- Literal metaphors for ${b.name}${S.avoidLiteral.length ? `: ${S.avoidLiteral.join(", ")}` : ""}.`,
    "- Imitating the source artwork itself: no copies, pastiche or recognizable reproductions.",
    d.never ? `- Anything that looks like ${d.never}.` : null,
    meaningful(d.tired) ? `- ${d.tired.trim()} (the designer is tired of it).` : null,
    ...S.srcNope.map(srcById).filter(Boolean).map(s => `- The operation of ${s.name.toLowerCase()} (the designer rejected it).`),
    "- Marketing words: seamless, elevate, unlock, empower, revolutionize. No emoji.",
    sketch ? "" : null, sketch ? "REFERENCE SKETCH (structure and mood of the hero only; rebuild it properly, do not copy its code)" : null,
    sketch ? sanitize(sketch).slice(0, 9000) : null,
    "", "OUTPUT", "- One self-contained HTML file, vanilla CSS and JS, Google Fonts only. Works at 390px width with no horizontal scroll. Respects prefers-reduced-motion. Visible focus states.",
  ];
  return L.filter(x => x !== null).join("\n").replace(/\n{3,}/g, "\n\n");
}
let polCtl = null;
function renderPrompt(main) {
  if (!S.prompt) { S.prompt = buildPrompt(); S.promptSource = "local"; }
  const c = concept(), w = warnings(), hasSketch = !!S.sketches[S.conceptPick];
  main.innerHTML = `<div class="head"><div><h1>${esc(c.title)}</h1><p>Rule: ${esc(c.rule)}</p></div></div>
  <div class="result">
    <div class="stage static" id="p-main" role="img" aria-label="Final sketch"></div>
    ${w.length ? `<div class="warn"><strong>Before you use it</strong>${w.map(x => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
    <div class="prompt-tools">
      ${sample ? `<button class="btn accent" id="p-pol">${S.promptSource === "claude" ? "Polish again" : "Polish with Claude"}</button><button class="btn" id="p-stop" hidden>Stop</button>` : ""}
      <button class="btn primary" id="p-copy">Copy prompt</button>
      ${downloads ? `<button class="btn" id="p-dl">Download .md</button>` : ""}
      <button class="btn" id="p-keep">Save to history</button>
      ${S.promptSource !== "local" ? `<button class="btn" id="p-reset">Rebuild from picks</button>` : ""}
      ${hasSketch ? `<label class="check" style="margin:0"><input type="checkbox" id="p-att" ${S.attachSketch ? "checked" : ""}> Attach sketch as reference</label>` : ""}
      <span class="note" id="p-note">${S.promptSource === "claude" ? "Polished by Claude. Edit freely." : sample ? "Base version from your picks. Polishing resolves contradictions in favor of the rule and makes each section specific (uses your Claude account)." : "Built from your picks. Copy it and give it to Claude."}</span>
    </div>
    <label for="p-text" class="section-label">Prompt</label><textarea class="prompt" id="p-text" spellcheck="false">${esc(S.prompt)}</textarea>
    <div><h2 class="sub-title">History</h2><div class="history" id="hist"></div></div>
  </div>`;
  mountStage($("#p-main"), sketchFor(c, S.conceptPick, curPal(), curType()));
  const ta = $("#p-text"); ta.oninput = () => { S.prompt = ta.value; S.promptSource = "edited"; save(); };
  $("#p-copy").onclick = () => copy(ta.value, ta);
  $("#p-keep").onclick = () => { history.unshift({ ts: Date.now(), name: S.brief.name, title: c.title, prompt: ta.value }); history = history.slice(0, 30); store.set("history", history); toast("Saved to history"); renderHistory(); };
  if ($("#p-dl")) $("#p-dl").onclick = async () => { try { await downloads.save({ filename: `${(S.brief.name || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-prompt.md`, data: ta.value }); toast("Saved"); } catch (e) { if (e?.code !== "declined") toast("Download isn’t available here — use Copy"); } };
  if ($("#p-reset")) $("#p-reset").onclick = () => { S.prompt = buildPrompt(); S.promptSource = "local"; save(); render(); };
  if ($("#p-att")) $("#p-att").onchange = e => { S.attachSketch = e.target.checked; if (S.promptSource === "local") S.prompt = buildPrompt(); save(); render(); };
  if ($("#p-pol")) $("#p-pol").onclick = polish;
  renderHistory();
}
async function polish() {
  const ta = $("#p-text"), note = $("#p-note"), btn = $("#p-pol"), stop = $("#p-stop"), draft = ta.value;
  polCtl = new AbortController(); btn.disabled = true; stop.hidden = false; stop.onclick = () => polCtl?.abort(); note.textContent = "Claude is thinking…";
  const instr = `You are a senior art director. Rewrite the DRAFT below into the final design prompt for an AI that builds web pages.

1. First, silently check the draft for contradictions (for example a loud character with a quiet intensity, or a value that breaks the rule). Resolve every contradiction in favor of THE RULE.
2. Keep the truth, concept, rule, art source and every concrete value (hex colors, font names, weights) unless it breaks the rule.
3. Make PAGE specific: name the hero and two to four sections in the product's own words, and for each say exactly how it obeys the rule.
4. Make HOW THE RULE SHOWS UP buildable: concrete composition, type sizes, spacing and motion decisions.
5. Do not add business sections the rule cannot justify. Do not invent facts, numbers or names.
6. Never describe imitating a specific artwork. Keep AVOID and the removal test, and keep any REFERENCE SKETCH as is.
7. English only. Keep the section headings. Output only the prompt.

DRAFT
${draft.slice(0, 50000)}`;
  try {
    const { text, truncated } = await sample(instr, { signal: polCtl.signal, cache: false, onText: ({ text }) => { ta.value = text; note.textContent = "Claude is writing…"; } });
    S.prompt = text; S.promptSource = "claude"; save(); note.textContent = truncated ? "The answer was cut short; try again." : "Polished by Claude. Edit freely."; render();
  } catch (e) {
    ta.value = e?.code === "refused" || !e?.text ? draft : e.text;
    note.textContent = { cancelled: "Stopped.", not_granted: "Claude access wasn’t allowed — copy the base version.", rate_limited: "Usage limit reached — try later." }[e?.code] || "The connection dropped — try again.";
  } finally { btn.disabled = false; stop.hidden = true; polCtl = null; }
}
function renderHistory() {
  const box = $("#hist"); if (!box) return;
  if (!history.length) { box.innerHTML = `<div class="empty">Nothing saved yet.</div>`; return; }
  box.innerHTML = history.map((h, i) => `<div class="hist-item"><div class="t"><strong>${esc(h.name)} — ${esc(h.title)}</strong><span>${new Date(h.ts).toLocaleString("en-GB")}</span></div>
    <button class="icon-btn" data-h="copy" data-i="${i}">Copy</button><button class="icon-btn" data-h="del" data-i="${i}" aria-label="Delete">✕</button></div>`).join("");
  box.onclick = e => { const b = e.target.closest("[data-h]"); if (!b) return; const h = history[+b.dataset.i];
    if (b.dataset.h === "copy") copy(h.prompt);
    if (b.dataset.h === "del") { history.splice(+b.dataset.i, 1); store.set("history", history); renderHistory(); } };
}

/* ---------------- chrome ---------------- */
function copy(text, ta) {
  const fallback = () => { if (ta) { ta.select(); toast("Text selected — press Ctrl/⌘+C"); } };
  try { navigator.clipboard.writeText(text).then(() => toast("Copied"), fallback); } catch { fallback(); }
}
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2400); }
function done(i) {
  const id = STEPS[i].id;
  if (id === "brief") return !!S.brief.name.trim();
  if (id === "discover") return true;
  if (id === "sources") return S.srcPicks.length > 0;
  if (id === "concepts") return S.conceptPick !== null && !!S.concepts[S.conceptPick];
  if (id === "refine") return !!concept();
  return false;
}
function reachable(i) { for (let k = 0; k < i; k++) if (!done(k)) return false; return true; }
function go(i) { if (i < 0 || i >= STEPS.length || !reachable(i)) return; S.step = i; S.maxStep = Math.max(S.maxStep, i); save(); render(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
function renderSteps() {
  $("#steps").innerHTML = STEPS.map((s, i) => `<button class="step-pill ${i === S.step ? "on" : ""} ${done(i) ? "done" : ""}" data-i="${i}" ${reachable(i) ? "" : "disabled"} ${i === S.step ? 'aria-current="step"' : ""}><span class="n">${String(i).padStart(2, "0")}</span>${s.t}</button>`).join("");
  $("#steps").querySelectorAll("button").forEach(b => b.onclick = () => go(+b.dataset.i));
}
function renderBar() {
  const id = cur(), ok = done(S.step);
  const status = { brief: "A product name is enough to start.", discover: "The truth matters most; skip anything else.", sources: ok ? "Pick up to three, then continue." : "Pick at least one source.",
    concepts: genBusy ? "Writing concepts…" : ok ? "Picked. Refine it next." : "Pick the concept with a pulse.", refine: "Tune palette, type and intensity.", prompt: "Copy the prompt, or go back and change anything." }[id];
  $("#bar").innerHTML = `<div class="wrap"><span class="status">${status}</span>
    ${S.step > 0 ? `<button class="btn" id="b-back">← Back</button>` : ""}
    ${id === "sources" ? `<button class="btn" id="b-more">More sources</button>` : ""}
    ${id === "prompt" ? `<button class="btn" id="b-new">Start over</button>` : `<button class="btn primary" id="b-next" ${ok ? "" : "disabled"}>${STEPS[S.step + 1].id === "prompt" ? "Build prompt" : "Next"} →</button>`}</div>`;
  $("#b-back") && ($("#b-back").onclick = () => go(S.step - 1));
  $("#b-next") && ($("#b-next").onclick = () => go(S.step + 1));
  $("#b-more") && ($("#b-more").onclick = moreSources);
  $("#b-new") && ($("#b-new").onclick = () => { const brief = S.brief, disc = S.discover; S = fresh(); S.brief = brief; S.discover = disc; S.step = 1; S.maxStep = 1; save(); render(); });
}
function render() {
  if (!reachable(S.step)) S.step = 0;
  const main = $("#main");
  renderSteps();
  ({ brief: renderBrief, discover: renderDiscover, sources: renderSources, concepts: renderConcepts, refine: renderRefine, prompt: renderPrompt })[cur()](main);
  renderBar();
}
loadFont("Hanken Grotesk"); loadFont("Geist Mono");
render();
})();
