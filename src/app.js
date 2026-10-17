/* Taste Studio v3 — the designer's console for tasteskill (design-taste-frontend).
   Flow: Material → Inventory → Argument → Direction → Live thing → Brief.
   The studio collects the decisions that need a person; the skill builds, inspects and critiques. */
(() => {
"use strict";

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => Math.random().toString(36).slice(2, 9);
const store = {
  get(k, d) { try { const v = localStorage.getItem("taste-studio:v3:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("taste-studio:v3:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

/* ---------------- fonts ---------------- */
const loaded = new Set();
function loadFont(name) {
  name = String(name || "").trim(); if (!name || loaded.has(name) || name.length > 40) return; loaded.add(name);
  const add = href => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); return l; };
  const fam = name.replace(/\s+/g, "+");
  if (typeof FONT_SPEC !== "undefined" && FONT_SPEC[name]) { add(`https://fonts.googleapis.com/css2?family=${FONT_SPEC[name]}&display=swap`); return; }
  const l = add(`https://fonts.googleapis.com/css2?family=${fam}:wght@400;500;700&display=swap`);
  l.onerror = () => add(`https://fonts.googleapis.com/css2?family=${fam}&display=swap`);
}

/* ---------------- constants ---------------- */
const STEPS = [
  { id: "material", t: "Material" }, { id: "inventory", t: "Inventory" }, { id: "argument", t: "Argument" },
  { id: "direction", t: "Direction" }, { id: "live", t: "Live thing" }, { id: "brief", t: "Brief" },
];
const TONES = ["quiet", "bold", "warm", "technical", "playful", "luxury", "editorial"];
const HAVE = [["photography", "Our own photographs"], ["product-photo", "Product photos (or an image tool)"], ["product-ui", "Real interface screenshots"], ["illustration", "Illustration"], ["video", "Video"]];
const KINDS = ["name", "number", "place", "constraint", "material", "ritual", "artefact", "output", "people", "other"];
const HOUSE_RULES = `House rules (strict): headlines two lines or fewer (aim for 32 characters or fewer); no eyebrow labels above headings; no monospace; no index numbering like 01/02; no thin rules, hairlines or 1px outlined boxes; no gradients (except a scrim under text on a photo); no shadows on resting elements; no cream ground with terracotta, no violet; no tiny uppercase letter-spaced labels; no icon-topped cards or rows of identical cards; no glass or blur; no emoji; no styled accent word in a headline; at most two typefaces. Fill space with scale, full real content, flat colour fields and pictures, never with ornament. One real button for the primary action on the first screen.`;
const EXAMPLE = {
  name: "YT Jobs", url: "https://ytjobs.co", what: "The job board for YouTube: creators hire editors, thumbnail designers, writers and strategists.",
  audience: "YouTube creators who need a crew, and the editors, designers and writers who want channel work", cta: "Post a job",
  sector: "consumer-app", tone: "", truth: "The people who make a video great are never in the video.",
  material: `Tagline on ytjobs.co: "Professional YouTube Job Board. Whether a talent or creator, here you can find your dream job or your next ideal teammate."
Co-founded by Paddy Galloway, a YouTube strategist.
141K editors, designers, writers and strategists have profiles. (verify)
3,000+ YouTube creators have hired on YT Jobs. (verify)
Example open jobs: Video editor, $800–1,600 a project, Crispy Concords (3.97M subs). Long-form editor, $750–1,250 a project, BenGtalks (2.35M subs). Senior editor, $36,000 a year, full-time, Dr. Josef (294K subs). Scriptwriter, $100–150 a project, Cross Court (true crime docs).
Recent hires: Ben Jackson, video editor for Charlie Chang (1.46M). Jordan Carpenter, scriptwriter for Michael Button (271K).
Site sections: Jobs, Talent, How it works, FAQ, Forum, Blog, Referral.
Roles: video editor, thumbnail designer, scriptwriter, channel manager, YouTube strategist, producer, creative director.
(Collected from ytjobs.co by an earlier build. Verify before publishing.)`,
  keepColors: "", keepFonts: "", have: ["product-ui"], notes: "",
};
const fresh = () => ({ step: 0, brief: { ...EXAMPLE }, inv: [], invBy: "", invKey: "", args: [], heads: [], head: "", argBy: "", argKey: "",
  artLens: true, dirs: [], dirBy: "", dirKey: "", dirPick: null, dirNope: [], sketches: {}, avoidLiteral: [],
  lives: [], liveBy: "", liveKey: "", livePick: null, liveCustom: "", briefText: "" });
const saved = store.get("session", {});
let S = Object.assign(fresh(), saved, { brief: { ...EXAMPLE, ...(saved.brief || {}) } });
const save = () => store.set("session", S);
let history = store.get("history", []);
const cur = () => STEPS[S.step].id;
const B = () => S.brief;
const dirById = id => id?.startsWith("art:") ? null : TASTE_DIRECTIONS.find(d => d.id === id);
const srcById = id => SOURCES.find(s => s.id === id);

/* ---------------- capabilities ---------------- */
let sample = null, downloads = null;
if (window.claude?.use) {
  window.claude.use("sample").then(s => { sample = s; if (s) render(); }).catch(() => {});
  window.claude.use("downloads").then(d => { downloads = d; if (d && cur() === "brief") render(); }).catch(() => {});
}
const errMsg = e => ({ not_granted: "Claude access wasn’t allowed", rate_limited: "Usage limit reached for now", refused: "Claude declined this request", invalid_json: "Claude’s answer couldn’t be read" }[e?.code] || "Couldn’t reach Claude");

/* ---------------- sketches ---------------- */
function sanitize(html) {
  html = String(html || "").replace(/^[\s\S]*?```[a-z]*\s*/i, m => /```/.test(m) ? "" : m).replace(/```[\s\S]*$/, "").trim();
  if (window.DOMPurify) html = window.DOMPurify.sanitize(html, { FORCE_BODY: true, ADD_TAGS: ["style"], FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "meta", "base", "form", "input", "textarea", "button", "img", "image", "video", "audio", "foreignObject"], FORBID_ATTR: ["srcset", "action", "formaction"] });
  else html = html.replace(/<(script|iframe|object|embed|form|video|audio|textarea)\b[\s\S]*?<\/\1\s*>/gi, "").replace(/<\/?(script|iframe|object|embed|link|meta|base|form|img|image|video|audio|input|button|textarea|foreignObject)\b[^>]*>/gi, "").replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/javascript:/gi, "");
  return html.replace(/@import[^;]+;/gi, "").replace(/@font-face\s*\{[^}]*\}/gi, "").replace(/url\(\s*(['"]?)(?!#|data:)[^)]*\)/gi, "none").replace(/position\s*:\s*fixed/gi, "position:absolute");
}
const sketchFonts = html => { const m = String(html).match(/<!--\s*fonts?:\s*([^>]*?)-->/i); return m ? m[1].split(",").map(s => s.trim()).filter(Boolean).slice(0, 3) : []; };
const sizer = new ResizeObserver(es => es.forEach(e => { const f = e.target.querySelector(".frame"); if (f) f.style.transform = `scale(${e.contentRect.width / 1200})`; }));
function mountSketch(stage, html) {
  if (!stage) return;
  stage.innerHTML = `<div class="frame"></div>`; const frame = stage.firstElementChild;
  sketchFonts(html).forEach(loadFont);
  const host = document.createElement("div"); host.style.cssText = "width:1200px;height:750px;position:relative;background:#fff"; frame.appendChild(host);
  host.attachShadow({ mode: "open" }).innerHTML = `<style>:host{display:block;width:1200px;height:750px;overflow:hidden}${reduce ? "*{animation:none!important;transition:none!important}" : ""}</style>${sanitize(html)}`;
  frame.style.transform = `scale(${(stage.clientWidth || 1200) / 1200})`; sizer.observe(stage);
}
function mountStudy(stage, src) {
  if (!stage) return; const p = src.pals[0], t = src.fonts[0]; [t.display, t.body, t.mono].forEach(loadFont);
  const b = { name: B().name || "Product", items: (B().material.match(/[^.\n]{6,40}/g) || ["one", "two", "three"]).slice(0, 4), cta: B().cta || "Start", head: S.head || B().name };
  stage.innerHTML = `<div class="frame" style="--bg:${p.bg};--fg:${p.fg};--muted:${p.muted};--line:${p.line};--accent:${p.accent};--accent2:${p.accent2};--display:'${t.display}',serif;--body:'${t.body}',sans-serif;--mono:'${t.mono}',monospace;--dw:${t.dw}"><div class="sketch">${STUDY.svg(src.id, b)}</div></div>`;
  stage.firstElementChild.style.transform = `scale(${(stage.clientWidth || 1200) / 1200})`; sizer.observe(stage);
}

/* ---------------- shared context for Claude ---------------- */
function ctx(withArg = true) {
  const b = B(), inv = S.inv.filter(i => i.keep);
  return `PRODUCT
Name: ${b.name}${b.url ? ` (${b.url})` : ""}
What it is: ${b.what}
Audience: ${b.audience}
Primary action: ${b.cta}
Sector: ${b.sector || "other"}${b.tone ? `; tone: ${b.tone}` : ""}
${b.truth ? `A truth about it: ${b.truth}` : ""}
Assets that really exist: ${b.have.length ? b.have.join(", ") : "none (pictures must be found in open collections or drawn)"}
${b.keepColors || b.keepFonts ? `Brand to keep: ${[b.keepColors, b.keepFonts].filter(Boolean).join("; ")}` : ""}
${inv.length ? `\nINVENTORY (only this client has these)\n${inv.map(i => `- [${i.kind}] ${i.text}${i.verify ? " (verify)" : ""}`).join("\n")}` : ""}
${withArg && S.args.length ? `\nARGUMENT (one section per claim, in order)\n- hero: headline "${S.head}"\n${S.args.map(a => `- ${a.role}: ${a.claim} → proof: ${a.proof}`).join("\n")}` : ""}`.replace(/\n{3,}/g, "\n\n");
}
const matKey = () => JSON.stringify([B().name, B().what, B().material, B().truth]);

/* ---------------- generic async helper ---------------- */
const busy = {}; const ctl = {};
async function ask(key, fn) {
  if (busy[key]) return; busy[key] = true; ctl[key] = new AbortController(); render();
  try { await fn(ctl[key].signal); } catch (e) { if (e?.code !== "cancelled") toast(`${errMsg(e)} — you can fill this step by hand`); }
  finally { busy[key] = false; ctl[key] = null; save(); render(); }
}
const loader = (title, sub, key) => `<div class="loader"><div class="pulse" aria-hidden="true"></div><strong>${title}</strong><span>${sub}</span><button class="btn" data-stop="${key}">Stop</button></div>`;
function bindStop(main) { main.querySelectorAll("[data-stop]").forEach(b => b.onclick = () => ctl[b.dataset.stop]?.abort()); }

/* ---------------- step: material ---------------- */
const F = (id, label, help, o = {}) => `<div class="field"><label for="f-${id}">${label}</label>${o.area
  ? `<textarea id="f-${id}" data-k="${id}" rows="${o.rows || 3}" placeholder="${esc(o.ph || "")}">${esc(B()[id])}</textarea>`
  : `<input id="f-${id}" data-k="${id}" value="${esc(B()[id])}" placeholder="${esc(o.ph || "")}">`}${help ? `<small>${help}</small>` : ""}</div>`;
function renderMaterial(main) {
  const b = B();
  main.innerHTML = `<div class="head"><div><h1>Start from what is real.</h1><p>The strongest pages in the study were built from facts only this client has. Paste everything real you know: site copy, numbers, examples, names. The form is filled with YT Jobs.</p></div></div>
  <div class="brief"><div class="card">
    <div class="row2">${F("name", "Product name", "")}${F("url", "Current site", "")}</div>
    ${F("what", "What it is, the way its maker would say it", "", { area: 1, rows: 2 })}
    ${F("audience", "Who reads this page", "")}
    <div class="row2">${F("cta", "The one action the page must get", "")}
      <div class="field"><label for="f-sector">Sector</label><select id="f-sector" data-k="sector">${TASTE_SECTORS.map(s => `<option ${s === b.sector ? "selected" : ""}>${s}</option>`).join("")}</select></div></div>
    <div class="section-label">Tone (only if the brief clearly asks for one)</div>
    <div class="chipset" id="m-tone">${TONES.map(t => `<button data-v="${t}" aria-pressed="${b.tone === t}">${t}</button>`).join("")}</div>
    <div class="section-label" style="margin-top:18px">Assets that really exist</div>
    <div class="chipset" id="m-have">${HAVE.map(([v, l]) => `<button data-v="${v}" aria-pressed="${b.have.includes(v)}">${l}</button>`).join("")}</div>
    <p class="note" style="margin:8px 0 16px">Leave all off if you have none. The skill then finds real pictures of the subject's world in open collections, or draws them.</p>
    <div class="row2">${F("keepColors", "Brand colors to keep", "Hex codes", { ph: "#ee4249, #151012" })}${F("keepFonts", "Brand fonts to keep", "Google Fonts names", { ph: "Rubik" })}</div>
  </div>
  <div class="card">
    ${F("material", "Real material", "Paste anything true: site text, numbers, prices, examples, names, places, hours, constraints. Mark doubtful lines with (verify).", { area: 1, rows: 14 })}
    ${F("truth", "A truth nobody puts on the homepage (optional)", "", { area: 1, rows: 2 })}
    ${F("notes", "Notes for the builder (optional)", "", { area: 1, rows: 2 })}
  </div></div>`;
  main.querySelectorAll("[data-k]").forEach(el => el.addEventListener("input", () => { B()[el.dataset.k] = el.value; save(); renderBar(); }));
  $("#f-sector").onchange = e => { B().sector = e.target.value; save(); };
  $("#m-tone").onclick = e => { const x = e.target.closest("button"); if (!x) return; b.tone = b.tone === x.dataset.v ? "" : x.dataset.v; e.currentTarget.querySelectorAll("button").forEach(y => y.setAttribute("aria-pressed", y.dataset.v === b.tone)); save(); };
  $("#m-have").onclick = e => { const x = e.target.closest("button"); if (!x) return; const s = new Set(b.have); s.has(x.dataset.v) ? s.delete(x.dataset.v) : s.add(x.dataset.v); b.have = [...s]; x.setAttribute("aria-pressed", s.has(x.dataset.v)); save(); };
}

/* ---------------- step: inventory ---------------- */
function localInventory() {
  const out = [];
  B().material.split(/\n+/).forEach(line => {
    const verify = /\(verify\)/i.test(line); line = line.replace(/\s*\(verify\)\s*/gi, " ").trim();
    if (!line || /^\(collected/i.test(line)) return;
    const parts = line.length > 140 ? line.split(/(?<!\b(?:Dr|Mr|Mrs|Ms|St|vs|No|e\.g|i\.e))\.\s+(?=[A-Z])/) : [line];
    parts.forEach(t => { t = t.trim(); if (t.length > 12) out.push({ id: uid(), kind: /\d/.test(t) ? "number" : "other", text: t, verify, keep: true }); });
  });
  return out.slice(0, 14);
}
function genInventory() {
  return ask("inv", async signal => {
    const r = await sample.json(`${ctx(false)}

REAL MATERIAL
${B().material}

Make the subject inventory for a landing page: 8 to 12 things that belong to this client and to no competitor. Look for its name and what it means, its numbers (prices, counts, years), the constraint it lives with, its people, its places, its rituals and hours, its outputs, and the printed things of its world (tickets, labels, posts, invoices, credits).
Use only what the material states or plainly implies. Mark anything the material flags as uncertain, or that you infer, with "verify": true. Never invent customers, quotes, numbers or names.
Each item is one short concrete line a designer could build from.
Reply with only JSON: {"items": [{"kind": "${KINDS.join("|")}", "text": "", "verify": false}]}`, { signal, cache: false });
    const items = (Array.isArray(r?.items) ? r.items : []).slice(0, 14).map(i => ({ id: uid(), kind: KINDS.includes(i.kind) ? i.kind : "other", text: String(i.text || "").trim(), verify: !!i.verify, keep: true })).filter(i => i.text);
    if (!items.length) throw { code: "invalid_json" };
    S.inv = items; S.invBy = "claude"; S.invKey = matKey();
  });
}
function renderInventory(main) {
  if (S.invKey !== matKey() && !busy.inv) { S.inv = []; S.args = []; S.dirs = []; S.lives = []; }
  if (!S.inv.length && !busy.inv) { if (sample) { genInventory(); return; } S.inv = localInventory(); S.invBy = "local"; S.invKey = matKey(); save(); }
  if (busy.inv) { main.innerHTML = `<div class="head"><div><h1>Reading your material…</h1></div></div>${loader("Making the inventory", "Eight to twelve things only this client has. Uses your Claude account.", "inv")}`; bindStop(main); return; }
  main.innerHTML = `<div class="head"><div><h1>What only this client has.</h1><p>The idea will come from this list, so keep what is specific and true. Cut anything a competitor could also say. Items marked <em>verify</em> need checking before launch.</p></div>
    <div class="legend">${sample ? `<button class="btn" id="i-redo">Read again</button>` : ""}<button class="btn" id="i-add">Add item</button></div></div>
    <div class="list" id="inv">${S.inv.map(i => `<div class="li ${i.keep ? "" : "off"}" data-id="${i.id}">
      <select data-f="kind" aria-label="Kind">${KINDS.map(k => `<option ${k === i.kind ? "selected" : ""}>${k}</option>`).join("")}</select>
      <input data-f="text" value="${esc(i.text)}" aria-label="Inventory item">
      <button class="icon-btn ${i.verify ? "warn-on" : ""}" data-a="verify" aria-pressed="${i.verify}" title="Needs checking">verify</button>
      <button class="icon-btn ${i.keep ? "" : "nope on"}" data-a="keep" aria-pressed="${!i.keep}">${i.keep ? "✕ Cut" : "Keep"}</button></div>`).join("")}</div>
    <p class="note" style="margin-top:14px">${S.invBy === "local" ? "Split from your material line by line. Inside Claude this list is written for you." : ""} The competitor test comes later: an idea that would also work for the nearest competitor is rejected.</p>`;
  const box = $("#inv");
  box.addEventListener("input", e => { const row = e.target.closest(".li"), it = S.inv.find(x => x.id === row.dataset.id); it[e.target.dataset.f] = e.target.value; save(); renderBar(); });
  box.addEventListener("change", e => { const row = e.target.closest(".li"), it = S.inv.find(x => x.id === row.dataset.id); it[e.target.dataset.f] = e.target.value; save(); });
  box.onclick = e => { const a = e.target.closest("[data-a]"); if (!a) return; const it = S.inv.find(x => x.id === a.closest(".li").dataset.id);
    if (a.dataset.a === "keep") it.keep = !it.keep; if (a.dataset.a === "verify") it.verify = !it.verify; save(); render(); };
  $("#i-add").onclick = () => { S.inv.push({ id: uid(), kind: "other", text: "", verify: false, keep: true }); save(); render(); setTimeout(() => box.querySelector(".li:last-child input")?.focus(), 0); };
  if ($("#i-redo")) $("#i-redo").onclick = () => { S.inv = []; S.invKey = ""; genInventory(); };
}

/* ---------------- step: argument ---------------- */
const invKey = () => JSON.stringify(S.inv.filter(i => i.keep).map(i => i.text));
function localArgument() {
  S.heads = [B().name]; S.head = B().name;
  S.args = ["intro", "list", "proof", "how-it-works", "cta", "footer"].map(role => ({ id: uid(), role, claim: "", proof: "" }));
}
function genArgument() {
  return ask("arg", async signal => {
    const r = await sample.json(`${ctx(false)}

Write the page's argument before any design. List the page as claims, one per section, each with its proof taken from the inventory or the product facts. The order of the argument is the order of the page. A section with no claim does not exist; avoid the stock sequence of hero, logos, three features, testimonial, pricing, call to action.
Roles must come from: ${TASTE_ROLES.join(", ")}. The hero is implied, do not list it. End with "cta" and "footer" unless the argument already closes.
Proof is never invented: no customers, quotes, reviews, press, logos or business statistics beyond the material.
Also write three hero headline options. Each must fit in two lines everywhere: 32 characters or fewer, sentence case, no colon, no question the reader didn't ask, no tricolon, no "reimagined". Good shapes: the name, what it is, a claim a competitor could not sign, an instruction, the place or moment.
Reply with only JSON: {"headlines": ["", "", ""], "argument": [{"role": "", "claim": "", "proof": ""}]}`, { signal, cache: false });
    const args = (Array.isArray(r?.argument) ? r.argument : []).map(a => ({ id: uid(), role: TASTE_ROLES.includes(a.role) ? a.role : "intro", claim: String(a.claim || ""), proof: String(a.proof || "") })).filter(a => a.claim).slice(0, 9);
    if (!args.length) throw { code: "invalid_json" };
    S.args = args; S.heads = (Array.isArray(r.headlines) ? r.headlines : []).map(String).filter(Boolean).slice(0, 4); S.head = S.heads[0] || B().name; S.argBy = "claude"; S.argKey = invKey();
  });
}
function renderArgument(main) {
  if (S.argKey !== invKey() && !busy.arg) { S.args = []; S.dirs = []; S.lives = []; }
  if (!S.args.length && !busy.arg) { if (sample) { genArgument(); return; } localArgument(); S.argBy = "local"; S.argKey = invKey(); save(); }
  if (busy.arg) { main.innerHTML = `<div class="head"><div><h1>Writing the argument…</h1></div></div>${loader("Claims and proof, one per section", "The order of the argument becomes the order of the page.", "arg")}`; bindStop(main); return; }
  const len = S.head.length;
  main.innerHTML = `<div class="head"><div><h1>The page as an argument.</h1><p>Every section makes one claim and shows its proof. Reorder, edit or cut. Sections without a claim are deleted, which is how the stock template disappears.</p></div>
    <div class="legend">${sample ? `<button class="btn" id="a-redo">Write again</button>` : ""}<button class="btn" id="a-add">Add section</button></div></div>
    <section class="card" style="margin-bottom:20px"><h2>Hero headline</h2><p class="lead">Two lines at every width means about 32 characters at a confident size.</p>
      <div class="chipset" id="a-heads">${S.heads.map(h => `<button data-v="${esc(h)}" aria-pressed="${h === S.head}">${esc(h)} <small>${h.length}</small></button>`).join("")}</div>
      <div class="field" style="margin-top:14px"><label for="a-head">Headline</label><input id="a-head" value="${esc(S.head)}"><small id="a-len" class="${len > 32 ? "bad" : ""}">${len} characters${len > 32 ? " — too long for two lines on a phone; cut words before shrinking type" : ""}</small></div></section>
    <div class="list" id="args">${S.args.map((a, k) => `<div class="li arg" data-id="${a.id}">
      <span class="pos">${k + 1}</span>
      <select data-f="role" aria-label="Section role">${TASTE_ROLES.map(r => `<option ${r === a.role ? "selected" : ""}>${r}</option>`).join("")}</select>
      <input data-f="claim" value="${esc(a.claim)}" placeholder="The claim this section makes" aria-label="Claim">
      <input data-f="proof" value="${esc(a.proof)}" placeholder="What proves it (from the inventory)" aria-label="Proof">
      <span class="moves"><button class="icon-btn" data-a="up" aria-label="Move up">↑</button><button class="icon-btn" data-a="down" aria-label="Move down">↓</button><button class="icon-btn nope" data-a="del" aria-label="Delete section">✕</button></span></div>`).join("")}</div>`;
  const box = $("#args"), upd = e => { const row = e.target.closest(".li"); const a = S.args.find(x => x.id === row.dataset.id); a[e.target.dataset.f] = e.target.value; save(); renderBar(); };
  box.addEventListener("input", upd); box.addEventListener("change", upd);
  box.onclick = e => { const b = e.target.closest("[data-a]"); if (!b) return; const i = S.args.findIndex(x => x.id === b.closest(".li").dataset.id);
    if (b.dataset.a === "del") S.args.splice(i, 1);
    if (b.dataset.a === "up" && i > 0) [S.args[i - 1], S.args[i]] = [S.args[i], S.args[i - 1]];
    if (b.dataset.a === "down" && i < S.args.length - 1) [S.args[i + 1], S.args[i]] = [S.args[i], S.args[i + 1]];
    S.dirs = []; save(); render(); };
  $("#a-heads").onclick = e => { const b = e.target.closest("button"); if (!b) return; S.head = b.dataset.v; save(); render(); };
  $("#a-head").oninput = e => { S.head = e.target.value; save(); const l = S.head.length, m = $("#a-len"); m.textContent = `${l} characters${l > 32 ? " — too long for two lines on a phone; cut words before shrinking type" : ""}`; m.className = l > 32 ? "bad" : ""; renderBar(); };
  $("#a-add").onclick = () => { S.args.push({ id: uid(), role: "intro", claim: "", proof: "" }); save(); render(); };
  if ($("#a-redo")) $("#a-redo").onclick = () => { S.args = []; S.argKey = ""; genArgument(); };
}

/* ---------------- step: direction ---------------- */
const argKey = () => JSON.stringify([S.head, S.args.map(a => [a.role, a.claim]), S.artLens]);
function candidateDirections() {
  const b = B(), have = new Set(b.have);
  return TASTE_DIRECTIONS.filter(d => (d.needs || []).every(n => have.has(n)))
    .map(d => ({ d, s: (d.sectors.includes(b.sector) ? 2 : 0) + (b.tone && d.tones.includes(b.tone) ? 2 : 0) + Math.random() }))
    .sort((a, b) => b.s - a.s).map(x => x.d);
}
function localDirections() {
  const list = candidateDirections().slice(0, 3).map(d => ({ id: d.id, idea: `On this page, [something only ${B().name} has] becomes [${d.name.toLowerCase()}].`, competitor: "", check: "", why: d.idea.split(". ")[0] + "." }));
  if (S.artLens) { const s = shuffle(SOURCES)[0]; list.push({ id: "art:" + s.id, idea: `On this page, [something only ${B().name} has] is treated the way ${s.after} works: ${s.op.toLowerCase()}`, competitor: "", check: "", why: s.rule }); }
  return list;
}
function genDirections() {
  return ask("dir", async signal => {
    const cands = candidateDirections().slice(0, 12);
    const r = await sample.json(`${ctx(true)}

DIRECTIONS AVAILABLE (ways of composing, from a study of award-level sites)
${cands.map(d => `- ${d.id}: ${d.name}. ${d.idea.split(". ").slice(0, 2).join(". ")}.`).join("\n")}
${S.artLens ? `\nART LENSES (optional; a way of operating borrowed from art, never its look)\n${SOURCES.map(s => `- art:${s.id}: ${s.name} (after ${s.after}). ${s.op}`).join("\n")}` : ""}

Choose the 3 directions above that can best carry something from the inventory${S.artLens ? ", plus 1 art lens whose operation fits an inventory item unusually well" : ""}. For each, write the idea sentence exactly in this form, with both blanks filled from the subject itself, not the category:
"On this page, [something that belongs to the subject] becomes [the device the direction calls for]."
Then run the competitor test: name the nearest real competitor and say in one sentence why the idea would not work for them. If it would, pick a different inventory item.
Reply with only JSON: {"avoid_literal": ["the most literal visual clichés for this product"], "options": [{"id": "direction or art id", "idea": "", "competitor": "", "check": "", "why": "one sentence on why this direction suits the subject"}]}`, { signal, cache: false });
    const ids = new Set(cands.map(d => d.id).concat(SOURCES.map(s => "art:" + s.id)));
    const opts = (Array.isArray(r?.options) ? r.options : []).filter(o => ids.has(String(o.id))).slice(0, 4)
      .map(o => ({ id: String(o.id), idea: String(o.idea || ""), competitor: String(o.competitor || ""), check: String(o.check || ""), why: String(o.why || "") }));
    if (!opts.length) throw { code: "invalid_json" };
    S.dirs = opts; S.avoidLiteral = Array.isArray(r.avoid_literal) ? r.avoid_literal.map(String).slice(0, 8) : []; S.sketches = {}; S.dirPick = null; S.dirNope = []; S.dirBy = "claude"; S.dirKey = argKey();
  });
}
function dirLabel(o) { const d = dirById(o.id), s = o.id.startsWith("art:") ? srcById(o.id.slice(4)) : null; return d ? d.name : s ? `Art lens: ${s.name}` : o.id; }
function sketchRequest(o) {
  const d = dirById(o.id), s = o.id.startsWith("art:") ? srcById(o.id.slice(4)) : null, b = B();
  return `${ctx(true)}

Draw the first screen (hero) of this landing page as a static HTML and CSS sketch, 1200 × 750 pixels, so the designer can judge the direction.

DIRECTION: ${dirLabel(o)}
${d ? `Idea engine: ${d.idea}\nComposition: ${d.composition}\nTypography: ${d.typography}\nColour: ${d.colour}\nImagery: ${d.imagery}\nPitfalls: ${(d.pitfalls || []).join ? d.pitfalls.join(" ") : d.pitfalls}` : `Operation borrowed from ${s.after}: ${s.op} Rule: ${s.rule}`}
IDEA: ${o.idea}
HEADLINE: ${S.head}
PRIMARY ACTION: ${b.cta}
Use real content from the inventory and material at full density; never placeholders like lorem. Where a real picture belongs, put a flat colour block with a short caption naming the picture it stands for (for example "Photo: an editor's two monitors at 2 a.m.").
${S.avoidLiteral.length ? `Avoid literal clichés: ${S.avoidLiteral.join(", ")}.` : ""}
${HOUSE_RULES}

TECHNICAL RULES
- Reply with ONLY: an HTML comment naming up to two Google Fonts like <!-- fonts: Name One, Name Two -->, then one <style> element, then one <div class="sketch">…</div>. No markdown fences, no explanation.
- .sketch is exactly 1200px by 750px, position: relative, overflow: hidden. Scope every selector under .sketch. Set your own colours.
- No <script>, no event attributes, no <img>, no external URLs, no @import, no @font-face. Shapes with CSS or inline <svg>.
- Text contrast at least 4.5:1. The primary action is a visible button.`;
}
let skQueue = [], skRunning = 0; const skBusy = new Set();
function queueSketch(i) { if (!sample || skBusy.has(i)) return; skBusy.add(i); skQueue.push(i); pump(); }
function pump() {
  while (skRunning < 2 && skQueue.length) {
    const i = skQueue.shift(), o = S.dirs[i]; if (!o) { skBusy.delete(i); continue; }
    skRunning++; paintDir(i);
    sample(sketchRequest(o), { cache: false }).then(({ text }) => { if (S.dirs[i] === o && /class=["']?sketch/.test(text)) { S.sketches[i] = text; save(); } })
      .catch(e => { if (e?.code === "not_granted" || e?.code === "sampling_disabled") { sample = null; skQueue.forEach(k => skBusy.delete(k)); skQueue = []; } })
      .finally(() => { skRunning--; skBusy.delete(i); if (cur() === "direction") paintDir(i); else if (i === S.dirPick && (cur() === "live" || cur() === "brief")) render(); pump(); });
  }
}
function paintDir(i) {
  const card = document.querySelector(`.concept[data-i="${i}"]`); if (!card) return; const o = S.dirs[i], stage = card.querySelector(".stage");
  if (S.sketches[i]) mountSketch(stage, S.sketches[i]);
  else if (o.id.startsWith("art:")) mountStudy(stage, srcById(o.id.slice(4)));
  else stage.innerHTML = `<div class="dir-text"><strong>${esc(dirLabel(o))}</strong><span>${esc((dirById(o.id)?.composition || "").split(". ").slice(0, 3).join(". "))}.</span></div>`;
  stage.insertAdjacentHTML("beforeend", `<span class="spin" ${skBusy.has(i) ? "" : "hidden"}>Sketching…</span>`);
}
function renderDirection(main) {
  if (S.dirKey !== argKey() && !busy.dir) { S.dirs = []; S.sketches = {}; S.dirPick = null; }
  if (!S.dirs.length && !busy.dir) { if (sample) { genDirections(); return; } S.dirs = localDirections(); S.dirBy = "local"; S.dirKey = argKey(); save(); }
  if (busy.dir) { main.innerHTML = `<div class="head"><div><h1>Holding the inventory against the directions…</h1></div></div>${loader("Choosing directions and writing idea sentences", "Each idea must pass the competitor test.", "dir")}`; bindStop(main); return; }
  main.innerHTML = `<div class="head"><div><h1>Which way of composing carries it?</h1><p>Each option is a direction from tasteskill's library${S.artLens ? " (plus one art lens)" : ""} with an idea sentence built from your inventory. Pick the one only this client could own, not the most familiar.</p></div>
    <div class="legend"><label class="check" style="margin:0"><input type="checkbox" id="d-art" ${S.artLens ? "checked" : ""}> Include an art lens</label>${sample ? `<button class="btn" id="d-redo">New options</button>` : ""}</div></div>
    <div class="concepts">${S.dirs.map((o, i) => { const picked = S.dirPick === i, noped = S.dirNope.includes(i);
      return `<article class="concept ${picked ? "picked" : ""} ${noped ? "noped" : ""}" data-i="${i}"><div class="stage static" role="img" aria-label="Sketch of ${esc(dirLabel(o))}"></div>
      <div class="body"><h3>${esc(dirLabel(o))}</h3><div class="src"><span>${esc(o.id)}</span></div>
      <label class="qlabel" for="d-idea-${i}" style="margin:0">Idea sentence</label><textarea class="idea-in" id="d-idea-${i}" data-i="${i}" rows="3">${esc(o.idea)}</textarea>
      ${o.competitor ? `<p class="rule">Competitor test — ${esc(o.competitor)}: ${esc(o.check)}</p>` : `<p class="note">Fill both blanks from the inventory, then ask: would this still work for the nearest competitor?</p>`}
      ${o.why ? `<p class="note">${esc(o.why)}</p>` : ""}
      <div class="acts"><button class="icon-btn pick ${picked ? "on" : ""}" data-act="pick" aria-pressed="${picked}">${picked ? "✓ This one" : "Pick this direction"}</button>
      <button class="icon-btn nope ${noped ? "on" : ""}" data-act="nope" aria-pressed="${noped}">✕ No</button>${sample ? `<button class="icon-btn" data-act="redraw">Redraw sketch</button>` : ""}</div></div></article>`; }).join("")}</div>
    ${S.dirBy === "local" ? `<p class="note" style="margin-top:14px">Local options matched on sector and tone. Inside Claude, directions are chosen against your inventory, idea sentences are written and each is sketched.</p>` : ""}`;
  S.dirs.forEach((_, i) => paintDir(i));
  if (sample && S.dirBy === "claude") S.dirs.forEach((_, i) => { if (!S.sketches[i]) queueSketch(i); });
  main.querySelectorAll(".idea-in").forEach(t => t.oninput = () => { S.dirs[+t.dataset.i].idea = t.value; S.briefText = ""; save(); });
  main.querySelectorAll(".concept").forEach(card => card.addEventListener("click", e => {
    const act = e.target.closest("[data-act]")?.dataset.act; if (!act) return; const i = +card.dataset.i;
    if (act === "redraw") { delete S.sketches[i]; save(); queueSketch(i); paintDir(i); return; }
    if (act === "pick") { S.dirPick = S.dirPick === i ? null : i; S.dirNope = S.dirNope.filter(x => x !== i); S.lives = []; }
    if (act === "nope") { if (S.dirNope.includes(i)) S.dirNope = S.dirNope.filter(x => x !== i); else { S.dirNope.push(i); if (S.dirPick === i) S.dirPick = null; } }
    save(); render();
  }));
  $("#d-art").onchange = e => { S.artLens = e.target.checked; save(); };
  if ($("#d-redo")) $("#d-redo").onclick = () => { S.dirs = []; S.dirKey = ""; genDirections(); };
}

/* ---------------- step: live thing ---------------- */
const dir = () => S.dirs[S.dirPick];
const liveKey = () => JSON.stringify([dir()?.id, dir()?.idea]);
function genLive() {
  return ask("live", async signal => {
    const o = dir();
    const r = await sample.json(`${ctx(true)}

CHOSEN DIRECTION: ${dirLabel(o)}
IDEA: ${o.idea}

Propose 4 candidates for the page's one live thing: something the visitor can do, or that is different on each visit, made from the idea and the real content. In blind tests every winning page had one and jurors named it first.
Rules: it uses the subject's real content, works on a phone with a thumb, has a plain fallback without script, never blocks reading, and is one thing, not a playground. Prefer one that moves the visitor toward the primary action.
Reply with only JSON: {"options": [{"title": "", "does": "what the visitor does and sees, two sentences", "uses": "which real content it uses", "section": "which section of the argument it lives in", "phone": "how it works on a phone", "fallback": "what shows without script"}]}`, { signal, cache: false });
    const opts = (Array.isArray(r?.options) ? r.options : []).slice(0, 4).map(x => ({ title: String(x.title || ""), does: String(x.does || ""), uses: String(x.uses || ""), section: String(x.section || ""), phone: String(x.phone || ""), fallback: String(x.fallback || "") })).filter(x => x.title);
    if (!opts.length) throw { code: "invalid_json" };
    S.lives = opts; S.livePick = null; S.liveBy = "claude"; S.liveKey = liveKey();
  });
}
function renderLive(main) {
  if (S.liveKey !== liveKey() && !busy.live) { S.lives = []; S.livePick = null; }
  if (!S.lives.length && !busy.live && sample && S.liveBy !== "skip") { genLive(); return; }
  if (busy.live) { main.innerHTML = `<div class="head"><div><h1>Finding the live thing…</h1></div></div>${loader("One thing the visitor can do", "Made from the idea and your real content.", "live")}`; bindStop(main); return; }
  main.innerHTML = `<div class="head"><div><h1>One thing the visitor can do.</h1><p>Every winning page in the skill's blind tests had one. Pick a candidate or describe your own; it is built into the page, not added as decoration.</p></div>
    <div class="legend">${sample ? `<button class="btn" id="l-redo">New candidates</button>` : ""}</div></div>
    <div class="grid two">${S.lives.map((x, i) => { const on = S.livePick === i;
      return `<article class="opt live ${on ? "picked" : ""}" data-i="${i}"><span class="badge">Picked</span><div class="live-body"><h3>${esc(x.title)}</h3><p>${esc(x.does)}</p>
        <dl><dt>Uses</dt><dd>${esc(x.uses)}</dd><dt>Lives in</dt><dd>${esc(x.section)}</dd><dt>Phone</dt><dd>${esc(x.phone)}</dd><dt>Fallback</dt><dd>${esc(x.fallback)}</dd></dl></div>
        <div class="meta"><div class="txt"></div><button class="icon-btn pick ${on ? "on" : ""}" data-act="pick" aria-pressed="${on}">${on ? "✓ Picked" : "Pick"}</button></div></article>`; }).join("")}</div>
    <section class="card" style="margin-top:20px"><h2>Or describe your own</h2>
      <div class="field"><label for="l-own">Your live thing</label><textarea id="l-own" rows="3" placeholder="e.g. Type the kind of teammate you need and see real open roles and recent hires that match.">${esc(S.liveCustom)}</textarea><small>If filled, this is used instead of a picked candidate.</small></div></section>`;
  main.querySelectorAll(".opt.live").forEach(c => c.addEventListener("click", e => { if (!e.target.closest("[data-act]")) return; const i = +c.dataset.i; S.livePick = S.livePick === i ? null : i; save(); render(); }));
  $("#l-own").oninput = e => { S.liveCustom = e.target.value; save(); renderBar(); };
  if ($("#l-redo")) $("#l-redo").onclick = () => { S.lives = []; S.liveKey = ""; genLive(); };
}

/* ---------------- step: brief ---------------- */
function liveText() {
  if (S.liveCustom.trim()) return S.liveCustom.trim();
  const x = S.lives[S.livePick]; if (!x) return "(not chosen — choose one from the idea during the build)";
  return `${x.title}${/[.?!]$/.test(x.title) ? "" : "."} ${x.does}\n- Uses: ${x.uses}\n- Lives in: ${x.section}\n- Phone: ${x.phone}\n- Fallback without script: ${x.fallback}`;
}
function buildBrief() {
  const b = B(), o = dir(), d = dirById(o.id), art = o.id.startsWith("art:") ? srcById(o.id.slice(4)) : null;
  const args = S.args.filter(a => a.claim.trim()), roles = args.map(a => a.role).filter((r, i, a) => a.indexOf(r) === i);
  const flags = [`--sector ${b.sector || "other"}`, `--brief "${(b.what || b.name).replace(/"/g, "'")}"`, `--sections ${roles.join(",")}`, b.tone ? `--tone ${b.tone}` : "", b.have.length ? `--have ${b.have.join(",")}` : "", (b.keepColors || b.keepFonts) ? `--keep ${[b.keepColors && "palette", b.keepFonts && "type"].filter(Boolean).join(",")}` : ""].filter(Boolean).join(" ");
  const inv = S.inv.filter(i => i.keep), cut = S.inv.filter(i => !i.keep);
  const sk = S.sketches[S.dirPick];
  return [
    `# Design brief: ${b.name}`, "",
    "Build this landing page with the **design-taste-frontend** skill (tasteskill v2). Follow its full run (draw, idea, words, build, gate, look, move, report). The decisions below were made by the designer in Taste Studio: use them instead of re-deciding them, and say in the report wherever you had to depart from one.", "",
    "## Draw", "```bash",
    d ? `node <skill>/scripts/draw.mjs ${flags} --direction ${d.id}` : `node <skill>/scripts/draw.mjs ${flags} --options 3`, "```",
    d ? `Direction chosen: **${d.name}** (\`${d.id}\`).` : `Art lens chosen: **${art.name}** (after ${art.after}). Deal three options and take the direction whose composition best carries the idea below; record the choice and why. Borrow the lens's operation, never the look of any artwork: ${art.op}`, "",
    "## Subject",
    `- Name: ${b.name}${b.url ? ` (${b.url})` : ""}`, `- What it is: ${b.what}`, `- Who reads the page: ${b.audience}`, `- The one action: ${b.cta}`,
    b.truth ? `- A truth about it: ${b.truth}` : null, "",
    "## Inventory (only this client has these)", ...inv.map(i => `- [${i.kind}] ${i.text}${i.verify ? " — verify before launch" : ""}`), "",
    "## Argument (one section per claim, in this order)", `- hero — headline: "${S.head}" (${S.head.length} characters)`,
    ...args.map((a, k) => `${k + 1}. **${a.role}** — ${a.claim}${a.proof ? ` → proof: ${a.proof}` : ""}`), "",
    "## Idea", `${o.idea}`, o.competitor ? `- Competitor test (${o.competitor}): ${o.check}` : "- Run the competitor test before building.", "",
    "## Live thing", liveText(), "",
    "## Real material (use it at full density; invent no proof beyond it)", "```", b.material.trim(), "```", "",
    "## Brand and assets",
    `- Brand colours to keep: ${b.keepColors || "none — use the dealt palette"}`, `- Brand fonts to keep: ${b.keepFonts || "none — use the dealt type system"}`,
    `- Assets that exist: ${b.have.length ? b.have.join(", ") : "none — find real pictures of the subject's world with assets.mjs, credit them, and draw only what no honest picture exists of"}`, "",
    (S.avoidLiteral.length || cut.length || S.dirNope.length || b.notes) ? "## Avoid and notes" : null,
    S.avoidLiteral.length ? `- Literal clichés for this product: ${S.avoidLiteral.join(", ")}` : null,
    cut.length ? `- Cut from the inventory by the designer (do not build on these): ${cut.map(i => i.text).join("; ")}` : null,
    S.dirNope.length ? `- Directions the designer rejected: ${S.dirNope.map(i => S.dirs[i] && dirLabel(S.dirs[i])).filter(Boolean).join(", ")}` : null,
    b.notes ? `- Designer notes: ${b.notes}` : null,
    sk ? "" : null, sk ? "## Reference sketch (hero structure and mood only; rebuild properly, do not copy)" : null,
    sk ? "```html\n" + sanitize(sk).slice(0, 9000) + "\n```" : null,
  ].filter(x => x !== null).join("\n").replace(/\n{3,}/g, "\n\n");
}
function renderBrief(main) {
  if (!S.briefText) S.briefText = buildBrief();
  const o = dir();
  main.innerHTML = `<div class="head"><div><h1>The brief for the build.</h1><p>Give this to Claude with the design-taste-frontend skill enabled. The skill draws the full direction, builds the page, measures it in a real browser and critiques its own screenshots.</p></div></div>
  <div class="result">
    <div class="stage static" id="b-sk" role="img" aria-label="Chosen direction sketch"></div>
    <ol class="how"><li><b>1</b><span>Make sure <strong>design-taste-frontend</strong> is installed (Customize → Skills in the Claude app, or <code>~/.claude/skills/</code> in Claude Code).</span></li>
      <li><b>2</b><span>Start a new chat or Claude Code session and paste this brief with: "Build this."</span></li>
      <li><b>3</b><span>Ask for the skill's report at the end: direction, idea, scores, image credits, and what still falls short.</span></li></ol>
    <div class="prompt-tools"><button class="btn primary" id="b-copy">Copy brief</button>${downloads ? `<button class="btn" id="b-dl">Download .md</button>` : ""}<button class="btn" id="b-keep">Save to history</button><button class="btn" id="b-rebuild">Rebuild from decisions</button>
      <span class="note">Edit freely; "Rebuild" discards edits.</span></div>
    <label for="b-text" class="section-label">Brief</label><textarea class="prompt" id="b-text" spellcheck="false">${esc(S.briefText)}</textarea>
    <div><h2 class="sub-title">History</h2><div class="history" id="hist"></div></div>
  </div>`;
  if (S.sketches[S.dirPick]) mountSketch($("#b-sk"), S.sketches[S.dirPick]);
  else if (o.id.startsWith("art:")) mountStudy($("#b-sk"), srcById(o.id.slice(4)));
  else $("#b-sk").remove();
  const ta = $("#b-text"); ta.oninput = () => { S.briefText = ta.value; save(); };
  $("#b-copy").onclick = () => copy(ta.value, ta);
  $("#b-rebuild").onclick = () => { S.briefText = buildBrief(); save(); render(); };
  $("#b-keep").onclick = () => { history.unshift({ ts: Date.now(), name: B().name, title: dirLabel(o), text: ta.value }); history = history.slice(0, 30); store.set("history", history); toast("Saved to history"); renderHistory(); };
  if ($("#b-dl")) $("#b-dl").onclick = async () => { try { await downloads.save({ filename: `${(B().name || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brief.md`, data: ta.value }); toast("Saved"); } catch (e) { if (e?.code !== "declined") toast("Download isn’t available here — use Copy"); } };
  renderHistory();
}
function renderHistory() {
  const box = $("#hist"); if (!box) return;
  if (!history.length) { box.innerHTML = `<div class="empty">Nothing saved yet.</div>`; return; }
  box.innerHTML = history.map((h, i) => `<div class="hist-item"><div class="t"><strong>${esc(h.name)} — ${esc(h.title)}</strong><span>${new Date(h.ts).toLocaleString("en-GB")}</span></div>
    <button class="icon-btn" data-h="copy" data-i="${i}">Copy</button><button class="icon-btn" data-h="del" data-i="${i}" aria-label="Delete">✕</button></div>`).join("");
  box.onclick = e => { const b = e.target.closest("[data-h]"); if (!b) return; const h = history[+b.dataset.i];
    if (b.dataset.h === "copy") copy(h.text); if (b.dataset.h === "del") { history.splice(+b.dataset.i, 1); store.set("history", history); renderHistory(); } };
}

/* ---------------- chrome ---------------- */
function copy(text, ta) { const fb = () => { if (ta) { ta.select(); toast("Text selected — press Ctrl/⌘+C"); } }; try { navigator.clipboard.writeText(text).then(() => toast("Copied"), fb); } catch { fb(); } }
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
function done(i) {
  const id = STEPS[i].id, b = B();
  if (id === "material") return !!(b.name.trim() && (b.material.trim() || b.what.trim()));
  if (id === "inventory") return S.inv.some(x => x.keep && x.text.trim());
  if (id === "argument") return !!S.head.trim() && S.args.some(a => a.claim.trim());
  if (id === "direction") return S.dirPick !== null && !!S.dirs[S.dirPick];
  if (id === "live") return true;
  return false;
}
function reachable(i) { for (let k = 0; k < i; k++) if (!done(k)) return false; return true; }
function go(i) {
  if (i < 0 || i >= STEPS.length || !reachable(i)) return;
  if (STEPS[i].id === "brief") S.briefText = "";
  S.step = i; save(); render(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}
function renderSteps() {
  $("#steps").innerHTML = STEPS.map((s, i) => `<button class="step-pill ${i === S.step ? "on" : ""} ${done(i) ? "done" : ""}" data-i="${i}" ${reachable(i) ? "" : "disabled"} ${i === S.step ? 'aria-current="step"' : ""}><span class="n">${String(i).padStart(2, "0")}</span>${s.t}</button>`).join("");
  $("#steps").querySelectorAll("button").forEach(b => b.onclick = () => go(+b.dataset.i));
}
function renderBar() {
  const id = cur(), ok = done(S.step), anyBusy = Object.values(busy).some(Boolean);
  const status = { material: "Name and some real material are enough to start.", inventory: "Keep what only this client has.", argument: "One claim per section, with proof.",
    direction: ok ? "Picked. Choose the live thing next." : "Pick the direction only this client could own.", live: "Optional, but every winning page had one.", brief: "Copy the brief into Claude with the skill enabled." }[id];
  const bar = $("#bar");
  if (bar.dataset.step === id && bar.dataset.busy === String(anyBusy) && $("#b-next")) { $("#b-next").disabled = !(ok && !anyBusy); bar.querySelector(".status").textContent = status; return; }
  bar.dataset.step = id; bar.dataset.busy = String(anyBusy);
  bar.innerHTML = `<div class="wrap"><span class="status">${anyBusy ? "Claude is working…" : status}</span>
    ${S.step > 0 ? `<button class="btn" id="b-back">← Back</button>` : ""}
    ${id === "brief" ? `<button class="btn" id="b-new">Start over</button>` : `<button class="btn primary" id="b-next" ${ok && !anyBusy ? "" : "disabled"}>${STEPS[S.step + 1].id === "brief" ? "Write the brief" : "Next"} →</button>`}</div>`;
  $("#b-back") && ($("#b-back").onclick = () => go(S.step - 1));
  $("#b-next") && ($("#b-next").onclick = () => go(S.step + 1));
  $("#b-new") && ($("#b-new").onclick = () => { S = fresh(); save(); render(); });
}
function render() {
  if (!reachable(S.step)) S.step = 0;
  const main = $("#main"); renderSteps();
  ({ material: renderMaterial, inventory: renderInventory, argument: renderArgument, direction: renderDirection, live: renderLive, brief: renderBrief })[cur()](main);
  renderBar();
}
loadFont("Hanken Grotesk"); loadFont("Geist Mono");
render();
})();
