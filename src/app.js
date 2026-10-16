/* Taste Studio — app logic. Plain JS, no build step needed beyond inlining. */
(() => {
"use strict";

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rgb = h => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map(c => c + c).join(""); const n = parseInt(h.slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lum = h => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; const [r, g, b] = rgb(h); return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const isHex = s => /^#?[0-9a-f]{6}$/i.test(s.trim());

// value noise
const perm = new Uint8Array(512); { const p = shuffle([...Array(256).keys()]); for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
const fade = t => t * t * (3 - 2 * t);
const hh = (x, y, z) => perm[(perm[(perm[x & 255] + y) & 255] + z) & 255] / 255;
function noise(x, y, z) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), u = fade(x - X), v = fade(y - Y), w = fade(z - Z);
  const L = (a, b, t) => a + (b - a) * t, c = (a, b, d) => hh(X + a, Y + b, Z + d);
  return L(L(L(c(0,0,0), c(1,0,0), u), L(c(0,1,0), c(1,1,0), u), v), L(L(c(0,0,1), c(1,0,1), u), L(c(0,1,1), c(1,1,1), u), v), w);
}

/* ---------------- storage (per-viewer convenience only) ---------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("taste-studio:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("taste-studio:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

/* ---------------- fonts ---------------- */
const loaded = new Set();
const SERIF = new Set(["Bodoni Moda", "Fraunces", "Instrument Serif", "DM Serif Display", "Gloock", "Young Serif", "Cormorant Garamond", "Abril Fatface", "Newsreader", "Literata", "Source Serif 4", "Italiana"]);
const MONO = new Set(["JetBrains Mono", "IBM Plex Mono", "Space Mono", "DM Mono", "Fragment Mono", "Martian Mono", "Geist Mono", "Azeret Mono", "Red Hat Mono", "Major Mono Display"]);
function loadFont(name) {
  if (!name || loaded.has(name)) return; loaded.add(name);
  const spec = FONT_SPEC[name] || name.trim().replace(/\s+/g, "+");
  const l = document.createElement("link"); l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.appendChild(l);
}
const stack = n => `"${n}", ${MONO.has(n) ? "ui-monospace, monospace" : SERIF.has(n) ? "Georgia, serif" : "system-ui, sans-serif"}`;

/* ---------------- state ---------------- */
const STEPS = [
  { id: "brief", fa: "Brief" }, { id: "discover", fa: "Discover" }, { id: "dir", fa: "Direction" }, { id: "type", fa: "Type" }, { id: "pal", fa: "Color" },
  { id: "struct", fa: "Structure" }, { id: "sig", fa: "Signature" }, { id: "dens", fa: "Density & motion" }, { id: "result", fa: "Prompt" },
];
const EXAMPLE_BRIEF = {
  name: "YT Jobs", what: "A job board for the YouTube economy: creators hire editors, thumbnail designers and writers.",
  audience: "YouTube creators hiring, and freelancers looking for channel work", pageType: "landing page",
  headline: "Hire the people behind great channels", cta: "Post a job",
  items: "Video editor, Thumbnail designer, Scriptwriter, Channel manager, Shorts clipper", keepFonts: "", keepColors: "", notes: "",
};
const DISCOVER0 = { sliders: {}, place: null, feel: [], context: null, device: null, who: "", must: "", never: "", love: "", tired: "", remember: true, thesis: "", thesisSource: "" };
const fresh = () => ({ step: 0, maxStep: 0, brief: { ...EXAMPLE_BRIEF }, discover: { ...DISCOVER0, ...store.get("designer", {}) }, picks: {}, nope: {}, shown: {}, prompt: "", promptSource: "" });
const stored = store.get("session", {});
let S = Object.assign(fresh(), stored, { brief: { ...EXAMPLE_BRIEF, ...(stored.brief || {}) }, discover: { ...DISCOVER0, ...store.get("designer", {}), ...(stored.discover || {}) }, picks: stored.picks || {}, nope: stored.nope || {}, shown: stored.shown || {} });
const save = () => store.set("session", S);
let history = store.get("history", []);
const usedIds = () => { const u = new Set(); history.forEach(h => Object.values(h.picks || {}).forEach(v => u.add(v))); return u; };

/* ---------------- tokens: what the samples are drawn with ---------------- */
function brandPair() {
  const f = S.brief.keepFonts.split(/[,،/+]/).map(s => s.trim()).filter(Boolean);
  if (!f.length) return null;
  return { id: "brand", d: f[0], dw: 700, dc: "none", dt: "-0.02em", lh: 1, b: f[1] || f[0], m: f[2] || "IBM Plex Mono", fa: "Your current brand fonts", rule: "Brand fonts are fixed; express the new direction through size, spacing and layout." };
}
function brandPalette() {
  const hs = (S.brief.keepColors.match(/#?[0-9a-f]{6}\b/gi) || []).map(h => "#" + h.replace("#", "").toLowerCase());
  if (hs.length < 2) return null;
  const byL = hs.slice().sort((a, b) => lum(b) - lum(a));
  const bg = byL[0], tx = byL[byL.length - 1];
  const sat = h => { const [r, g, b] = rgb(h); return Math.max(r, g, b) - Math.min(r, g, b); };
  const rest = hs.filter(h => h !== bg && h !== tx).sort((a, b) => sat(b) - sat(a));
  const ac = rest[0] || tx, ac2 = rest[1] || tx;
  const m = (a, b, t) => "#" + mixRGB(rgb(a), rgb(b), t).map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  return { id: "brand", fa: "Your current brand colors", en: "brand palette", bg, sf: m(bg, tx, .06), tx, mu: m(tx, bg, .42), ln: m(bg, tx, .16), ac, acfg: contrast(ac, "#ffffff") > contrast(ac, "#111111") ? "#ffffff" : "#111111", ac2, avoid: "" };
}
const findPair = id => id === "brand" ? brandPair() : PAIRS.find(p => p.id === id);
const findPal = id => id === "brand" ? brandPalette() : PALETTES.find(p => p.id === id);
const dirOf = id => DIRECTIONS.find(d => d.id === id);

// Build a token set from a direction, overridden by any picks / explicit overrides.
function tokens(over = {}) {
  const dir = dirOf(over.dir || S.picks.dir) || DIRECTIONS[0];
  const pair = findPair(over.type || S.picks.type) || findPair(dir.pair);
  const pal = findPal(over.pal || S.picks.pal) || findPal(dir.pal);
  const sig = over.sig || S.picks.sig || dir.sig;
  [pair.d, pair.b, pair.m].forEach(loadFont);
  return { dir, pair, pal, sig, layout: over.layout || dir.layout, r: dir.r, sh: dir.sh };
}
function mockStyle(T) {
  const p = T.pal, f = T.pair;
  return [`--m-bg:${p.bg}`, `--m-sf:${p.sf}`, `--m-tx:${p.tx}`, `--m-mu:${p.mu}`, `--m-ln:${p.ln}`, `--m-ac:${p.ac}`, `--m-acfg:${p.acfg}`, `--m-ac2:${p.ac2}`,
    `--m-fd:${stack(f.d)}`, `--m-fb:${stack(f.b)}`, `--m-fm:${stack(f.m)}`, `--m-dw:${f.dw}`, `--m-dc:${f.dc}`, `--m-dt:${f.dt}`, `--m-lh:${f.lh}`,
    `--m-r:${Math.min(T.r, 999)}px`, `--m-sh:${T.sh}`].join(";").replace(/"/g, "&quot;");
}

/* ---------------- sample renderers ---------------- */
const B = () => {
  const b = S.brief, items = b.items.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
  return { name: b.name || "Product", head: b.headline || b.what || b.name || "Your headline", what: b.what || "", cta: b.cta || "Get started", items: items.length ? items : ["First item", "Second item", "Third item", "Fourth item"] };
};

function heroHTML(T) {
  const b = B(), h = esc(b.head), n = esc(b.name), w = esc(b.what), c = esc(b.cta), it = b.items.map(esc);
  const nav = `<div class="nav"><span class="logo">${n}</span><span class="links mo"><span>${it[0] || ""}</span><span>Menu</span></span></div>`;
  const sig = `<div class="sig" data-sig="${T.sig}"></div>`;
  const L = {
    split: `<div class="body"><div class="left"><span class="mo">${n} — ${new Date().getFullYear()}</span><h2 class="d">${h}</h2><p class="bd">${w}</p><div><span class="cta">${c} →</span></div></div>${sig}</div>`,
    giant: `<div class="body"><div class="foot"><span class="mo">${it[0] || ""}</span><span class="mo">${it[1] || ""}</span></div><h2 class="d">${h}</h2>${sig}<div class="foot"><p class="bd">${w}</p><span class="cta">${c}</span></div></div>`,
    letter: `<div class="body">${sig}<span class="mo">${n}</span><h2 class="d">${h}</h2><p class="bd">${w}</p><span class="lnk">${c} →</span></div>`,
    index: `<div class="body"><div class="left"><span class="mo">${n}</span><div style="display:flex;flex-direction:column;gap:2cqh"><h2 class="d">${h}</h2><p class="bd">${w}</p></div><span class="lnk">${c} →</span></div><div class="rows">${sig}<div style="height:2cqh"></div>${it.slice(0, 5).map((x, i) => `<div class="r"><span>${x}</span><span class="mo">${["Open", "New", "Open", "Remote", "Open"][i]}</span></div>`).join("")}</div></div>`,
    mag: `<div class="body"><h2 class="d">${h}</h2><div style="display:flex;flex-direction:column;gap:1.4cqh;min-height:0">${sig}<span class="cap">Fig. 1 — ${it[0] || n}</span></div><div class="col"><p class="bd">${w}</p><span class="mo">${it.slice(0, 3).join(" · ")}</span><div><span class="cta">${c}</span></div></div></div>`,
    term: `<div class="body"><div class="lines"><span class="mo">~/${n.toLowerCase().replace(/\s+/g, "-")}</span><span>&gt; ${n.toLowerCase()} --help</span><h2 class="d">${h}</h2><span style="color:var(--m-mu)">&gt; ${w}</span><span>&gt; ${c.toLowerCase()} <span class="cur"></span></span></div>${sig}</div>`,
    bento: `<div class="body"><div class="tile t1"><span class="mo">${n}</span><h2 class="d">${h}</h2><p class="bd">${w}</p></div><div class="tile t2" style="position:relative">${sig}</div><div class="tile t3"><span class="mo">${it[0] || ""}</span><span class="big">→</span></div><div class="tile t4"><span class="mo">Start</span><span class="big" style="font-size:4.4cqi">${c}</span></div></div>`,
  };
  return `<div class="mock L-${T.layout}" style="${mockStyle(T)}">${nav}${L[T.layout] || L.split}</div>`;
}

function specimenHTML(T) {
  const b = B(), f = T.pair;
  return `<div class="mock" style="${mockStyle(T)}"><div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:var(--pad)">
    <div style="display:flex;justify-content:space-between;gap:12px"><span class="mo">${esc(f.d)} · ${f.dw}</span><span class="mo">${esc(f.b)} / ${esc(f.m)}</span></div>
    <h2 class="d" style="font-size:9.4cqi">${esc(b.head)}</h2>
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:var(--pad);align-items:end">
      <p class="bd" style="color:var(--m-tx);opacity:.82">${esc(b.what || "Body text sits here in the body face, set at a comfortable size and measure so it reads easily.")}</p>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start"><span class="mo">${esc(b.items.slice(0, 2).join(" · "))}</span><span class="cta">${esc(b.cta)}</span></div>
    </div></div></div>`;
}

function sigStageHTML(T) {
  const b = B();
  return `<div class="mock" style="${mockStyle(T)}"><div class="sig" data-sig="${T.sig}" style="position:absolute;inset:0"></div>
    <div style="position:absolute;left:var(--pad);bottom:var(--pad);right:var(--pad);display:flex;justify-content:space-between;align-items:end;gap:12px;pointer-events:none">
    <h2 class="d" style="font-size:6cqi;background:var(--m-bg);padding:.25em .4em;border-radius:4px">${esc(b.name)}</h2><span class="mo" style="background:var(--m-bg);padding:.4em .6em;border-radius:4px">${esc(b.items[0] || "")}</span></div></div>`;
}

function wireHTML(st, T) {
  const blk = ([k, label, h]) => k === "split"
    ? `<div class="split" style="height:${h}px">${label.map(l => `<div class="blk" style="height:100%">${l}</div>`).join("")}</div>`
    : `<div class="blk ${k}" style="height:${h}px">${label}</div>`;
  return `<div class="mock" style="${mockStyle(T)}"><div class="wf">${st.blocks.map(blk).join("")}</div></div>`;
}

function densHTML(d, T) {
  return `<div class="mock" style="${mockStyle(T)}"><div class="dens"><div class="page">${d.blocks.map(([k, h]) => `<div class="b ${k}" style="height:${h * 2.4}px"></div>`).join("")}</div></div></div>`;
}

function motionHTML(m, T) {
  const word = (B().name || "Hello").slice(0, 10);
  const letters = m.id === "type" ? [...word].map((ch, i) => `<span style="animation-delay:${i * 40}ms">${esc(ch)}</span>`).join("") : esc(word);
  return `<div class="mock" style="${mockStyle(T)}"><div class="mdemo" data-motion="${m.cls}"><div class="w">${letters}</div><span class="cta">${esc(B().cta)}</span>${m.id === "mech" ? `<span class="cnt" data-count>00</span>` : ""}</div></div>`;
}

/* ---------------- signatures ---------------- */
const LIVE = new Set();
let liveT0 = performance.now();
function addLive(el, fps, fn) { const it = { el, fn, every: 1000 / fps, last: 0 }; LIVE.add(it); if (reduce) fn(0); return it; }
const vis = new IntersectionObserver(es => es.forEach(e => { e.target._vis = e.isIntersecting; }));
function loop(now) {
  LIVE.forEach(it => {
    if (!it.el.isConnected) { LIVE.delete(it); return; }
    if (it.el._vis === false || now - it.last < it.every) return;
    it.last = now; it.fn(now - liveT0);
  });
  requestAnimationFrame(loop);
}
if (!reduce) requestAnimationFrame(loop);

function canvasIn(el, onSize) {
  const cv = document.createElement("canvas"); el.appendChild(cv);
  const ctx = cv.getContext("2d"); const st = { cv, ctx, w: 0, h: 0 };
  const fit = () => { const r = el.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); if (!r.width) return; st.w = r.width; st.h = r.height; cv.width = r.width * d | 0; cv.height = r.height * d | 0; ctx.setTransform(d, 0, 0, d, 0, 0); onSize && onSize(st); };
  new ResizeObserver(fit).observe(el); fit(); vis.observe(el); return st;
}

function mountSig(el, id, T) {
  const p = T.pal, b = B(), A = rgb(p.ac), A2 = rgb(p.ac2), TX = rgb(p.tx), BG = rgb(p.bg), SF = rgb(p.sf);
  const dark = lum(p.bg) < .2;
  el.innerHTML = "";
  const S2 = {
    pixel() {
      const st = canvasIn(el), stops = [SF, A, A2, TX];
      const draw = t => { const { ctx, w, h } = st; if (!w) return; const cell = 22, cols = Math.ceil(w / cell), rows = Math.ceil(h / cell), z = t * .00005;
        ctx.fillStyle = p.bg; ctx.fillRect(0, 0, w, h);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          let v = (x / cols * .6 + y / rows * .7) + (noise(x * .1, y * .1, z) - .5) * .7; v = Math.min(.999, Math.max(0, v)) * 3;
          const i = Math.floor(v); ctx.fillStyle = css(mixRGB(stops[i], stops[Math.min(3, i + 1)], v - i)); ctx.fillRect(x * cell + .5, y * cell + .5, cell - 1, cell - 1); } };
      addLive(el, 20, draw); draw(0);
    },
    halftone() {
      const st = canvasIn(el);
      const draw = t => { const { ctx, w, h } = st; if (!w) return; const g = 12, z = t * .00025; ctx.fillStyle = p.sf; ctx.fillRect(0, 0, w, h); ctx.fillStyle = p.ac;
        for (let y = g / 2; y < h; y += g) for (let x = g / 2; x < w; x += g) { const r = Math.max(0, noise(x * .012, y * .012, z) * 1.3 - .25) * g * .55; if (r > .3) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); } } };
      addLive(el, 20, draw); draw(0);
    },
    contour() {
      const st = canvasIn(el);
      const draw = t => { const { ctx, w, h } = st; if (!w) return; const z = t * .00012; ctx.fillStyle = p.sf; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 18; i++) { ctx.beginPath(); const base = h * (i + .5) / 18;
          for (let x = 0; x <= w; x += 6) { const y = base + (noise(x * .006, i * .35, z) - .5) * h * .35; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.strokeStyle = i % 5 === 2 ? p.ac : `rgba(${TX.join(",")},.3)`; ctx.lineWidth = i % 5 === 2 ? 2 : 1; ctx.stroke(); } };
      addLive(el, 20, draw); draw(0);
    },
    dither() {
      const st = canvasIn(el), off = document.createElement("canvas"), oc = off.getContext("2d");
      const M = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      const draw = t => { const { ctx, w, h } = st; if (!w || h < 4) return; const px = 4, W = Math.ceil(w / px), H = Math.ceil(h / px); off.width = W; off.height = H;
        const img = oc.createImageData(W, H), cx = W * (.5 + .3 * Math.sin(t * .0003)), cy = H * (.5 + .25 * Math.cos(t * .00023)), R = Math.max(W, H) * .7;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy) / R, v = 1 - d + (noise(x * .05, y * .05, t * .0002) - .5) * .4;
          const on = v > (M[(y & 3) * 4 + (x & 3)] + .5) / 16, c = on ? A : SF, k = (y * W + x) * 4; img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255; }
        oc.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, W * px, H * px); };
      addLive(el, 15, draw); draw(0);
    },
    ascii() {
      const st = canvasIn(el), ch = " .:-=+*#%@";
      const draw = t => { const { ctx, w, h } = st; if (!w) return; ctx.fillStyle = p.bg; ctx.fillRect(0, 0, w, h); ctx.font = `12px ${stack(T.pair.m).replace(/&quot;/g, '"')}`; ctx.fillStyle = p.ac;
        for (let y = 12; y < h; y += 14) for (let x = 0; x < w; x += 8) { const v = noise(x * .02, y * .02, t * .00025); ctx.fillText(ch[Math.min(9, v * 10 | 0)], x, y); } };
      addLive(el, 12, draw); draw(0);
    },
    grain() {
      const L = esc((b.name[0] || "A").toUpperCase());
      el.innerHTML = `<div class="sg-glyph" style="color:${p.ac};mix-blend-mode:${dark ? "screen" : "multiply"};font-size:min(80cqh,95%)">${L}</div><div class="sg-glyph" style="color:${p.ac2};mix-blend-mode:${dark ? "screen" : "multiply"};transform:translate(6px,4px)">${L}</div>`;
      el.querySelectorAll(".sg-glyph").forEach(g => g.style.fontSize = (el.clientHeight * .95 || 300) + "px");
      const st = canvasIn(el, s => { const { ctx, w, h } = s; if (w < 1 || h < 1) return; const im = ctx.createImageData(Math.max(1, w | 0), Math.max(1, h | 0)); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 22; } ctx.putImageData(im, 0, 0); });
      st.cv.style.mixBlendMode = "overlay";
    },
    outline() {
      const nm = esc(b.name);
      el.innerHTML = `<div class="sg-outline"><span class="o">${nm}</span><span class="f">${nm}</span></div>`;
      const fit = () => { const s = Math.min(el.clientHeight * .5, el.clientWidth / Math.max(3, b.name.length) * 1.5); el.querySelectorAll(".sg-outline span").forEach(x => x.style.fontSize = s + "px"); };
      new ResizeObserver(fit).observe(el); fit();
    },
    marquee() {
      const words = b.items.concat(b.items).map(esc).join(" ✦ ");
      el.innerHTML = `<div class="sg-marq" style="top:28%;transform:rotate(-6deg);background:${p.ac};color:${p.acfg}"><div class="tr" style="font-size:min(6cqh,40px)"><span>${words}</span><span>${words}</span></div></div>
        <div class="sg-marq b" style="top:56%;transform:rotate(4deg);background:${p.tx};color:${p.bg}"><div class="tr" style="font-size:min(6cqh,40px)"><span>${words}</span><span>${words}</span></div></div>`;
    },
    numbers() {
      const roomy = (el.clientHeight || 300) > 140;
      el.innerHTML = `<div class="sg-num" style="font-size:${(el.clientHeight || 300) * .95}px">01</div>${(roomy ? b.items : []).slice(0, 3).map((x, i) => `<span class="mo" style="position:absolute;left:8%;top:${12 + i * 12}%;color:var(--m-tx)">0${i + 1} / ${esc(x)}</span>`).join("")}`;
    },
    hairline() {
      const v = [...Array(7)].map((_, i) => `<line x1="${(i + 1) * 12.5}%" y1="0" x2="${(i + 1) * 12.5}%" y2="100%" style="animation-delay:${i * 90}ms"/>`).join("");
      const hz = [...Array(5)].map((_, i) => `<line x1="0" y1="${(i + 1) * 16.6}%" x2="100%" y2="${(i + 1) * 16.6}%" style="animation-delay:${300 + i * 90}ms"/>`).join("");
      el.innerHTML = `<div class="sg-hair sg-fill"><svg aria-hidden="true"><g stroke="${p.ln}" stroke-width="1" fill="none">${v}${hz}</g><rect x="25%" y="33.2%" width="37.5%" height="33.2%" fill="none" stroke="${p.ac}" stroke-width="2" style="animation-delay:900ms"/></svg></div>`;
      el.style.background = p.bg;
    },
    glyph() {
      el.innerHTML = `<div class="sg-glyph">${esc((b.name[0] || "A").toUpperCase())}</div>`;
      const g = el.firstChild, fit = () => g.style.fontSize = Math.max(el.clientHeight, el.clientWidth * .7) * 1.05 + "px";
      new ResizeObserver(fit).observe(el); fit();
    },
    shapes() {
      el.innerHTML = `<div class="sg-shape" style="left:8%;top:12%;width:44%;aspect-ratio:1;border-radius:50%;background:${p.ac}"></div>
        <div class="sg-shape" style="right:6%;top:8%;width:30%;aspect-ratio:2/1;border-radius:999px 999px 0 0;background:${p.ac2};animation-duration:30s"></div>
        <div class="sg-shape" style="right:14%;bottom:10%;width:26%;aspect-ratio:1;background:${p.tx};animation-direction:reverse"></div>
        <div style="position:absolute;left:30%;bottom:6%;width:22%;aspect-ratio:1;background:${p.ac2};clip-path:polygon(50% 0,100% 100%,0 100%)"></div>`;
    },
    tickets() {
      el.innerHTML = b.items.slice(0, 3).map((x, i) => `<div class="sg-ticket" style="top:${16 + i * 22}%;transform:rotate(${(i - 1) * 4}deg);z-index:${3 - i}"><span class="mo">No. 0${i + 1}</span><strong style="font-family:var(--m-fd);font-size:max(13px,2.4cqi);color:var(--m-tx)">${esc(x)}</strong></div>`).join("");
      el.onmouseenter = () => el.querySelectorAll(".sg-ticket").forEach((t, i) => t.style.transform = `rotate(${(i - 1) * 9}deg) translateX(${(i - 1) * 14}px)`);
      el.onmouseleave = () => el.querySelectorAll(".sg-ticket").forEach((t, i) => t.style.transform = `rotate(${(i - 1) * 4}deg)`);
    },
    blob() { el.innerHTML = `<div class="sg-blob"></div>`; el.style.background = "transparent"; },
  };
  (S2[id] || S2.glyph)();
}
const mountAll = root => root.querySelectorAll("[data-sig]").forEach(el => { const card = el.closest("[data-tok]"); mountSig(el, el.dataset.sig, card ? card._T : tokens()); });

/* ---------------- step: brief ---------------- */
const F = (id, label, help, opts = {}) => `<div class="field"><label for="f-${id}">${label}</label>${opts.area
  ? `<textarea id="f-${id}" data-k="${id}" ${opts.ltr ? 'dir="ltr"' : ""} placeholder="${esc(opts.ph || "")}">${esc(S.brief[id])}</textarea>`
  : `<input id="f-${id}" data-k="${id}" ${opts.ltr ? 'dir="ltr"' : ""} value="${esc(S.brief[id])}" placeholder="${esc(opts.ph || "")}">`}${help ? `<small>${help}</small>` : ""}</div>`;

function renderBrief(main) {
  main.innerHTML = `<div class="head"><div><h1>First, what are we designing?</h1><p>Every sample in the next rounds is built from this copy, so keep it short and real. The form is filled with the YT Jobs example.</p></div></div>
  <div class="brief"><div class="card">
    <div class="row2">${F("name", "Product name", "", { ltr: 1 })}${F("pageType", "Page type", "e.g. landing page, portfolio, shop", { ltr: 1 })}</div>
    ${F("what", "The product in one sentence", "", { ltr: 1, area: 1 })}
    ${F("audience", "Audience", "", { ltr: 1 })}
    <div class="row2">${F("headline", "Sample headline", "Shown in every sample", { ltr: 1 })}${F("cta", "Primary button text", "", { ltr: 1 })}</div>
    ${F("items", "A few real items", "Comma-separated; used in lists and ribbons", { ltr: 1 })}
    <div class="section-label">Keep your brand (optional)</div>
    <div class="row2">${F("keepFonts", "Current fonts", "e.g. Poppins, Inter (Google Fonts)", { ltr: 1, ph: "Display, Body" })}${F("keepColors", "Current colors", "Hex codes, comma-separated", { ltr: 1, ph: "#111111, #ffffff, #ff0033" })}</div>
    ${F("notes", "Extra notes for the prompt", "Anything the design must respect", { area: 1 })}
  </div>
  <div class="card"><div class="section-label">Copy preview</div><div class="preview-mini" id="brief-prev" data-tok></div>
    <ol class="how"><li><b>01</b><span>Each round shows six large, live samples. Click the one you like.</span></li>
    <li><b>02</b><span>Use “No” to reject what you don’t want; rejections go into the prompt’s AVOID list.</span></li>
    <li><b>03</b><span>“More options” brings fresh samples from the library.</span></li>
    <li><b>04</b><span>Each round is drawn with your earlier picks, so you judge real combinations.</span></li></ol></div></div>`;
  const prev = $("#brief-prev");
  const paint = () => { const T = tokens(); prev._T = T; prev.innerHTML = heroHTML(T); mountAll(prev); };
  paint();
  let tm; main.querySelectorAll("[data-k]").forEach(inp => inp.addEventListener("input", () => { S.brief[inp.dataset.k] = inp.value; save(); clearTimeout(tm); tm = setTimeout(paint, 300); }));
}


/* ---------------- step: discover ---------------- */
const D = () => S.discover;
function discoverTarget() {
  const d = D(), t = [], w = [];
  SLIDERS.forEach((s, i) => { const v = d.sliders[s.id]; t[i] = 0; w[i] = 0; if (typeof v === "number") { t[i] += v; w[i] += 1; } });
  const pl = PLACES.find(p => p.id === d.place);
  if (pl) pl.vec.forEach((v, i) => { t[i] += v * .6; w[i] += .6; });
  if (!w.some(Boolean)) return null;
  return t.map((v, i) => w[i] ? { v: v / w[i], w: w[i] } : null);
}
function dirScore(id) {
  const tg = discoverTarget(), vec = DIR_VEC[id]; if (!tg || !vec) return 0;
  let s = 0; tg.forEach((x, i) => { if (x) s -= x.w * (vec[i] - x.v) ** 2; }); return s;
}
const discoverSig = () => JSON.stringify([D().sliders, D().place]);
const sliderWords = () => SLIDERS.map(s => { const v = D().sliders[s.id]; if (typeof v !== "number" || v === 0) return null;
  return `${Math.abs(v) === 2 ? "strongly" : "leans"} ${(v < 0 ? s.left : s.right).toLowerCase()}`; }).filter(Boolean);
function localThesis() {
  const d = D(), b = S.brief, pl = PLACES.find(p => p.id === d.place), words = sliderWords();
  const parts = [];
  parts.push(`${b.name || "The product"} should make ${d.who || b.audience || "its visitors"} feel ${d.feel.length ? d.feel.map(f => f.toLowerCase()).join(" and ") : "clear about what to do"} within five seconds${d.context ? `, arriving ${d.context.toLowerCase()}` : ""}.`);
  if (words.length || pl) parts.push(`Its character ${words.length ? `is ${words.join(", ")}` : "is defined by restraint"}${pl ? `, with the quality of ${pl.name.toLowerCase()} (${pl.desc.toLowerCase()}) as a feeling, never as imagery` : ""}.`);
  parts.push(`Everything on the page serves one action: ${d.must || b.cta || "the primary call to action"}.`);
  return parts.join(" ");
}
function renderDiscover(main) {
  const d = D(), b = S.brief;
  if (!d.who) d.who = b.audience; if (!d.must) d.must = b.cta;
  const seg = s => `<div class="sl" role="group" aria-label="${s.left} to ${s.right}"><span class="l">${s.left}</span><div class="seg">${[-2, -1, 0, 1, 2].map(v =>
    `<button data-sl="${s.id}" data-v="${v}" aria-pressed="${d.sliders[s.id] === v}" aria-label="${v === 0 ? "In between" : (Math.abs(v) === 2 ? "Strongly " : "Somewhat ") + (v < 0 ? s.left : s.right)}" style="--d:${[16, 11, 6, 11, 16][v + 2]}px"></button>`).join("")}</div><span class="r">${s.right}</span></div>`;
  const chips = (key, list, multi) => `<div class="chipset" data-chips="${key}" data-multi="${multi ? 1 : 0}">${list.map(x => `<button data-val="${esc(x)}" aria-pressed="${multi ? d[key].includes(x) : d[key] === x}">${esc(x)}</button>`).join("")}</div>`;
  main.innerHTML = `<div class="head"><div><h1>Before the visuals: what is this, and who is it for?</h1><p>Abstract questions, quick answers. They rank the samples you will see next and give the prompt a point of view. Everything here is optional.</p></div></div>
  <div class="disc">
    <section class="card"><h2>The character</h2><p>Where does ${esc(b.name || "the product")} sit between each pair? Leave a row untouched if it doesn't matter.</p><div class="sliders">${SLIDERS.map(seg).join("")}</div></section>
    <section class="card"><h2>If it were a place</h2><p>Pick the place whose atmosphere is closest. This shapes the feeling, not the imagery.</p>
      <div class="tiles">${PLACES.map(p => `<button class="tile-btn" data-place="${p.id}" aria-pressed="${d.place === p.id}"><strong>${p.name}</strong><span>${p.desc}</span></button>`).join("")}</div></section>
    <section class="card"><h2>The first five seconds</h2><p>What should a visitor feel before they read anything? Pick up to two.</p>${chips("feel", FEELINGS, true)}</section>
    <section class="card"><h2>The audience moment</h2><p>Who arrives, in what situation, and what must they do.</p>
      <label class="qlabel" for="q-who">Who arrives</label><div class="field"><input id="q-who" data-q="who" value="${esc(d.who)}"></div>
      <span class="qlabel">Their situation</span>${chips("context", CONTEXTS, false)}
      <span class="qlabel">Device</span>${chips("device", DEVICES, false)}
      <label class="qlabel" for="q-must">The one thing they must do</label><div class="field"><input id="q-must" data-q="must" value="${esc(d.must)}"></div>
      <label class="qlabel" for="q-never">It must never look like…</label><div class="field"><input id="q-never" data-q="never" value="${esc(d.never)}" placeholder="e.g. a generic freelancer marketplace"></div></section>
    <section class="card"><h2>About you, the designer</h2><p>Claude reads these as references to learn from, never to copy.</p>
      <label class="qlabel" for="q-love">Something you love that isn't a website</label><div class="field"><input id="q-love" data-q="love" value="${esc(d.love)}" placeholder="a book cover, a building, an album, an object"></div>
      <label class="qlabel" for="q-tired">What are you tired of seeing?</label><div class="field"><input id="q-tired" data-q="tired" value="${esc(d.tired)}" placeholder="e.g. bento grids, gradient blobs"></div>
      <label class="check"><input type="checkbox" id="q-remember" ${d.remember ? "checked" : ""}> Remember these two answers for my next session</label></section>
    <section class="card"><h2>Design thesis</h2><p>Three sentences the whole design has to serve. Draft it from your answers, then edit freely.</p>
      <label for="q-thesis" class="qlabel">Thesis</label><textarea class="thesis" id="q-thesis" placeholder="Draft it from your answers, or write your own.">${esc(d.thesis)}</textarea>
      <div class="thesis-tools">${sample ? `<button class="btn accent" id="t-claude">Draft with Claude</button>` : ""}<button class="btn" id="t-local">Draft from my answers</button><span class="note" id="t-note">${d.thesisSource === "claude" ? "Drafted by Claude." : ""}</span></div></section>
  </div>`;
  const keepDesigner = () => { if (d.remember) store.set("designer", { love: d.love, tired: d.tired, remember: true }); else store.set("designer", { remember: false }); };
  main.querySelectorAll("[data-sl]").forEach(btn => btn.onclick = () => {
    const id = btn.dataset.sl, v = +btn.dataset.v; d.sliders[id] = d.sliders[id] === v ? undefined : v;
    btn.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", d.sliders[id] === +x.dataset.v)); save(); renderSteps();
  });
  main.querySelectorAll("[data-place]").forEach(btn => btn.onclick = () => {
    d.place = d.place === btn.dataset.place ? null : btn.dataset.place;
    main.querySelectorAll("[data-place]").forEach(x => x.setAttribute("aria-pressed", d.place === x.dataset.place)); save();
  });
  main.querySelectorAll("[data-chips]").forEach(set => set.onclick = e => {
    const btn = e.target.closest("button"); if (!btn) return; const key = set.dataset.chips, val = btn.dataset.val;
    if (set.dataset.multi === "1") { const cur = new Set(d[key]); cur.has(val) ? cur.delete(val) : cur.add(val); d[key] = [...cur].slice(-2); }
    else d[key] = d[key] === val ? null : val;
    set.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", set.dataset.multi === "1" ? d[key].includes(x.dataset.val) : d[key] === x.dataset.val)); save();
  });
  main.querySelectorAll("[data-q]").forEach(inp => inp.oninput = () => { d[inp.dataset.q] = inp.value; save(); if (inp.dataset.q === "love" || inp.dataset.q === "tired") keepDesigner(); });
  $("#q-remember").onchange = e => { d.remember = e.target.checked; keepDesigner(); save(); };
  const th = $("#q-thesis"); th.oninput = () => { d.thesis = th.value; d.thesisSource = "edited"; save(); };
  $("#t-local").onclick = () => { d.thesis = localThesis(); d.thesisSource = "local"; th.value = d.thesis; $("#t-note").textContent = "Drafted from your answers. Edit freely."; save(); };
  if ($("#t-claude")) $("#t-claude").onclick = async () => {
    const btn = $("#t-claude"), note = $("#t-note"); btn.disabled = true; note.textContent = "Claude is thinking…";
    const ask = `Write a design thesis for a web page: exactly three plain sentences that every design decision must serve. Base it only on these answers from the designer. Use the character and place as qualities, never as literal imagery. No marketing words (seamless, elevate, unlock), no invented facts or numbers. English. Output only the three sentences.

Product: ${b.name} — ${b.what}
Audience: ${d.who || b.audience}
Situation: ${d.context || "not given"}; device: ${d.device || "not given"}
Character: ${sliderWords().join(", ") || "not given"}
Feels like: ${(PLACES.find(p => p.id === d.place) || {}).name || "not given"}
First five seconds: ${d.feel.join(", ") || "not given"}
The one action: ${d.must || b.cta}
Must never look like: ${d.never || "not given"}`;
    try { const { text } = await sample(ask, { cache: false, onText: ({ text }) => { th.value = text; } }); d.thesis = text.trim(); d.thesisSource = "claude"; th.value = d.thesis; note.textContent = "Drafted by Claude. Edit freely."; save(); }
    catch (e) { note.textContent = e?.code === "not_granted" ? "Claude access wasn’t allowed — use “Draft from my answers”." : e?.code === "rate_limited" ? "Usage limit reached for now — try later." : "Couldn’t reach Claude — try again or draft from your answers."; }
    finally { btn.disabled = false; }
  };
}

/* ---------------- rounds ---------------- */
const ROUNDS = {
  dir: { title: "Which direction fits your product?", sub: "Each sample is a complete direction: color, type, layout and signature. Judge the overall feel; the details change in later rounds.",
    pool: () => DIRECTIONS, label: o => o.fa, desc: o => o.en, tok: o => tokens({ dir: o.id, type: o.pair, pal: o.pal, sig: o.sig }), render: heroHTML },
  type: { title: "Which type pairing?", sub: "All shown in the colors of the direction you picked.",
    pool: () => [brandPair(), ...PAIRS].filter(Boolean), label: o => o.fa, desc: o => `${o.d} + ${o.b}`, tok: o => tokens({ type: o.id, pal: S.picks.pal || dirOf(S.picks.dir)?.pal }), render: specimenHTML },
  pal: { title: "Which palette?", sub: "Each palette is applied to the same page, with your type.",
    pool: () => [brandPalette(), ...PALETTES].filter(Boolean), label: o => o.fa, desc: o => o.en, tok: o => tokens({ pal: o.id }), render: heroHTML },
  struct: { title: "What structure should the page have?", sub: "The order and number of sections. These are skeletons, not final designs.", three: true,
    pool: () => STRUCTURES, label: o => o.fa, desc: o => o.desc, tok: () => tokens(), render: (T, o) => wireHTML(o, T) },
  sig: { title: "Which signature element?", sub: "The one thing people will remember the page by. Samples are live.",
    pool: () => SIGS, label: o => o.fa, desc: o => o.quiet ? "Quiet, suits minimal pages" : "More energetic", tok: o => tokens({ sig: o.id }), render: sigStageHTML },
};

function ensureShown(kind) {
  const pool = ROUNDS[kind].pool().map(o => o.id), nope = new Set(S.nope[kind] || []);
  let shown = (S.shown[kind] || []).filter(id => pool.includes(id));
  if (kind === "dir" && S.discSig !== discoverSig()) { S.discSig = discoverSig(); shown = []; }
  if (!shown.length && kind === "dir" && discoverTarget()) {
    const ranked = pool.filter(id => !nope.has(id)).sort((x, y) => dirScore(y) - dirScore(x));
    const top = ranked.slice(0, 4), wild = shuffle(ranked.slice(4)).slice(0, 2);
    shown = top.concat(wild); if (S.picks.dir && !shown.includes(S.picks.dir)) shown[5] = S.picks.dir;
  }
  if (!shown.length) { const lead = pool.includes("brand") ? ["brand"] : []; shown = lead.concat(shuffle(pool.filter(id => id !== "brand" && !nope.has(id)))).slice(0, 6); }
  S.shown[kind] = shown; return shown;
}
function reshuffle(kind) {
  const pool = ROUNDS[kind].pool().map(o => o.id), nope = new Set(S.nope[kind] || []), cur = S.shown[kind] || [];
  const keep = cur.filter(id => id === S.picks[kind]);
  let fresh = shuffle(pool.filter(id => !cur.includes(id) && !nope.has(id) && !keep.includes(id)));
  if (fresh.length < 6 - keep.length) fresh = fresh.concat(shuffle(pool.filter(id => !keep.includes(id) && !nope.has(id) && !fresh.includes(id))));
  S.shown[kind] = keep.concat(fresh).slice(0, 6); save(); render();
}

function optCard(kind, o, T, html, used, fit) {
  const picked = S.picks[kind] === o.id, noped = (S.nope[kind] || []).includes(o.id);
  return `<article class="opt ${picked ? "picked" : ""} ${noped ? "noped" : ""}" data-id="${esc(o.id)}">
    <span class="badge">Your pick</span>
    <button class="stage" data-act="pick" aria-label="Pick ${esc(ROUNDS[kind] ? ROUNDS[kind].label(o) : o.fa)}" data-tok>${html}</button>
    <div class="meta"><div class="txt"><strong>${esc(ROUNDS[kind] ? ROUNDS[kind].label(o) : o.fa)}${fit ? `<span class="used fit">fits your answers</span>` : ""}${used ? `<span class="used">used before</span>` : ""}</strong><span>${esc(ROUNDS[kind] ? ROUNDS[kind].desc(o) : o.desc)}</span></div>
    <button class="icon-btn nope ${noped ? "on" : ""}" data-act="nope" aria-pressed="${noped}">✕ No</button>
    <button class="icon-btn pick ${picked ? "on" : ""}" data-act="pick" aria-pressed="${picked}">${picked ? "✓ Picked" : "Pick"}</button></div></article>`;
}

function bindCards(main, kind, map) {
  main.querySelectorAll(".opt").forEach(card => {
    const id = card.dataset.id, stage = card.querySelector(".stage");
    stage._T = map[id];
    card.addEventListener("click", e => {
      const act = e.target.closest("[data-act]")?.dataset.act; if (!act) return;
      if (act === "pick") { S.picks[kind] = S.picks[kind] === id ? undefined : id; S.nope[kind] = (S.nope[kind] || []).filter(x => x !== id); }
      if (act === "nope") { const n = new Set(S.nope[kind] || []); n.has(id) ? n.delete(id) : n.add(id); S.nope[kind] = [...n]; if (S.picks[kind] === id) S.picks[kind] = undefined; }
      save(); refreshCards(main, kind); renderBar();
    });
  });
  mountAll(main);
}
function refreshCards(main, kind) {
  main.querySelectorAll(".opt").forEach(card => {
    const id = card.dataset.id, picked = S.picks[kind] === id, noped = (S.nope[kind] || []).includes(id);
    card.classList.toggle("picked", picked); card.classList.toggle("noped", noped);
    const pb = card.querySelector(".icon-btn.pick"), nb = card.querySelector(".icon-btn.nope");
    pb.classList.toggle("on", picked); pb.setAttribute("aria-pressed", picked); pb.textContent = picked ? "✓ Picked" : "Pick";
    nb.classList.toggle("on", noped); nb.setAttribute("aria-pressed", noped);
  });
}

function renderRound(main, kind) {
  const R = ROUNDS[kind], ids = ensureShown(kind), pool = R.pool(), used = usedIds(), map = {};
  const fits = kind === "dir" && discoverTarget() ? new Set(pool.map(o => o.id).sort((x, y) => dirScore(y) - dirScore(x)).slice(0, 4)) : new Set();
  const cards = ids.map(id => pool.find(o => o.id === id)).filter(Boolean).map(o => { const T = R.tok(o); map[o.id] = T; return optCard(kind, o, T, R.render(T, o), used.has(o.id) && o.id !== "brand", fits.has(o.id)); }).join("");
  main.innerHTML = `<div class="head"><div><h1>${R.title}</h1><p>${R.sub}</p></div><div class="legend"><span><b>${pool.length}</b> in the library</span><span><b>${(S.nope[kind] || []).length}</b> rejected</span></div></div>
    <div class="grid ${R.three ? "three" : ""}">${cards}</div>`;
  bindCards(main, kind, map); save();
}

function renderDens(main) {
  const T = tokens(), used = usedIds();
  const card = (kind, o, html) => optCard(kind, o, T, html, used.has(o.id));
  main.innerHTML = `<div class="head"><div><h1>How busy, and how should it move?</h1><p>Density sets the ceiling for everything: sections, typefaces, colors and animations. Hover a motion sample to replay it.</p></div></div>
    <h2 class="sub-title">Density</h2><div class="grid three" id="g-dens">${DENSITIES.map(d => card("dens", d, densHTML(d, T))).join("")}</div>
    <h2 class="sub-title">Motion</h2><div class="grid three" id="g-motion">${MOTIONS.map(m => card("motion", m, motionHTML(m, T))).join("")}</div>`;
  const map = {}; DENSITIES.concat(MOTIONS).forEach(o => map[o.id] = T);
  bindCards($("#g-dens"), "dens", map); bindCards($("#g-motion"), "motion", map);
  main.querySelectorAll("[data-motion]").forEach(el => {
    const play = () => { const cls = el.dataset.motion; if (!cls || reduce) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      const cnt = el.querySelector("[data-count]"); if (cnt) { let n = 0; const iv = setInterval(() => { n += 6; cnt.textContent = String(Math.min(n, 48)).padStart(2, "0"); if (n >= 48) clearInterval(iv); }, 90); } };
    el.closest(".opt").addEventListener("mouseenter", play); setTimeout(play, 200);
  });
}

/* ---------------- prompt ---------------- */
const fill = (s, p) => s.replace(/\{(\w+)\}/g, (_, k) => p[k] || "");
function buildPrompt() {
  const b = S.brief, T = tokens(), p = T.pal, f = T.pair, dir = T.dir;
  const st = STRUCTURES.find(x => x.id === S.picks.struct) || STRUCTURES[4];
  const dn = DENSITIES.find(x => x.id === S.picks.dens) || DENSITIES[1];
  const mo = MOTIONS.find(x => x.id === S.picks.motion) || MOTIONS[0];
  const sg = SIGS.find(x => x.id === T.sig);
  const items = B().items.join(", ");
  const secs = st.sections(dn.n).slice(0, dn.id === "ultra" ? 4 : dn.id === "minimal" ? 5 : 8).map((s, i) => `${i + 1}. ${fill(s, { name: b.name, items: items ? `items (${items})` : "items" })}`);
  const nopes = [];
  [["dir", DIRECTIONS, o => `the "${o.en}" look`], ["type", PAIRS, o => `${o.d} / ${o.b} typography`], ["pal", PALETTES, o => o.avoid], ["sig", SIGS, o => o.avoid], ["struct", STRUCTURES, o => `a "${o.id}" page structure`]]
    .forEach(([k, list, txt]) => (S.nope[k] || []).forEach(id => { const o = list.find(x => x.id === id); if (o) nopes.push(txt(o)); }));
  const accentUse = dn.id === "ultra" ? "the primary CTA and at most two other marks" : dn.id === "minimal" ? "the primary CTA, links on hover, and the signature element" : "CTAs, active states, the signature graphic and key highlights";
  const keep = [];
  if (S.picks.type === "brand") keep.push(`Brand fonts are FIXED: ${f.d} (display) and ${f.b} (body). Do not substitute them.`);
  if (S.picks.pal === "brand") keep.push(`Brand colors are FIXED: ${b.keepColors}. Use them in the roles below; add only neutrals.`);
  const lines = [
    `Build a ${b.pageType || "landing page"} for ${b.name}${b.what ? ` — ${b.what.trim().replace(/[.!]+$/, "")}` : ""}.`,
    `Direction: ${dir.en}, ${dn.id === "ultra" ? "ultra-minimal" : dn.id} density. NOT ${dir.not}.`,
    b.audience ? `Audience: ${b.audience}.` : "",
    ...discoverLines(),
    "",
    "DIRECTION (chosen visually by the designer — follow exactly)",
    `- Movement: ${dir.en}`, `- Density: ${dn.id === "ultra" ? "ultra-minimal" : dn.id}`, `- Structure: ${st.id}`,
    `- Signature: ${sg ? sg.id : T.sig}`, `- Motion: ${mo.id}`,
    "",
    "PAGE STRUCTURE", ...secs,
    "",
    "TYPOGRAPHY",
    `- Display: "${f.d}" weight ${f.dw}, ${f.dc === "uppercase" ? "ALL CAPS" : "sentence case"}, ${dn.sizes} desktop / 40–48px mobile, letter-spacing ${f.dt}, line-height ${f.lh}.`,
    `- Body: "${f.b}" 400, 16–18px, line-height 1.6, color ${p.mu} on ${p.bg}; measure ≤ 65ch.`,
    `- Labels and data: "${f.m}" 500, 12px, uppercase, letter-spacing 0.14em, tabular figures.`,
    `- Rule: ${f.rule}`,
    "",
    "COLOR",
    `- Ground ${p.bg}, surface ${p.sf}, text ${p.tx}, muted ${p.mu}, hairlines ${p.ln}.`,
    `- Primary accent ${p.ac} (text on it ${p.acfg}): used ONLY for ${accentUse}.`,
    dn.id === "balanced" || dn.id === "maximal" ? `- Secondary accent ${p.ac2}: used ONLY inside the signature graphic and one highlight per section.` : `- No second accent color.`,
    `- Text contrast at least 4.5:1 everywhere.`,
    "",
    "SIGNATURE",
    `- ${sg ? fill(sg.spec, p) : "One typographic signature element."}`,
    dn.id === "ultra" ? "- Keep it static: render once, no animation loop." : "",
    "",
    "LAYOUT",
    `- Hero: ${LAYOUTS[T.layout]}`,
    `- Grid: 12 columns, max-width 1200px, gutter 24px, side padding max(16px, 4vw). Spacing scale 4/8/16/24/40/64/104px; ${dn.id === "ultra" || dn.id === "minimal" ? "104px" : "64–104px"} between sections.`,
    "",
    "COMPONENTS",
    `- Primary button: fill ${p.ac}, text ${p.acfg}, radius ${Math.min(T.r, 999) >= 999 ? "999px (pill)" : T.r + "px"}${T.sh !== "none" ? `, shadow ${T.sh}` : ", no shadow"}, padding 14px 22px, ${f.b} 600 15px; hover darkens 6%; active translateY(1px); focus-visible 2px ${p.ac} ring, offset 3px.`,
    `- Secondary action: text link with 1px underline offset 4px; no second filled button in the hero.`,
    `- Lists/rows: 1px ${p.ln} top border, 18–22px vertical padding, title left, meta right in the label face.`,
    "",
    "MOTION",
    `- ${mo.spec}`, "- prefers-reduced-motion: no movement, show final states.",
    "",
    "DENSITY BUDGET (hard limits)", `- ${dn.budget}`,
    keep.length ? "" : null, keep.length ? "BRAND CONSTRAINTS" : null, ...keep.map(k => `- ${k}`),
    "",
    "AVOID",
    ...BASE_AVOID.map(a => `- ${a}`),
    ...nopes.map(a => `- ${a} (the designer rejected it)`),
    D().never ? `- anything that looks like ${D().never}` : null,
    D().tired ? `- ${D().tired} (the designer is tired of it)` : null,
    `- the most literal visual metaphor for ${b.name}`,
    b.notes ? "" : null, b.notes ? "NOTES FROM THE DESIGNER" : null, b.notes ? `- ${b.notes}` : null,
    "",
    "OUTPUT: one self-contained HTML file, vanilla CSS/JS, Google Fonts only, works at 390px width with no horizontal scroll.",
  ];
  return lines.filter(l => l !== null).join("\n").replace(/\n{3,}/g, "\n\n");
}

function discoverLines() {
  const d = D(), pl = PLACES.find(p => p.id === d.place), words = sliderWords(), out = [];
  if (words.length || pl || d.feel.length) {
    out.push("", "BRAND CHARACTER (from the designer's discovery answers; use for tone, hierarchy and copy, never as literal imagery)");
    if (words.length) out.push(`- Character: ${words.join(", ")}`);
    if (pl) out.push(`- Atmosphere: like ${pl.name.toLowerCase()} — ${pl.desc.toLowerCase()} (a quality, not a picture)`);
    if (d.feel.length) out.push(`- In the first five seconds the visitor should feel: ${d.feel.map(f => f.toLowerCase()).join(" and ")}`);
  }
  if (d.who || d.context || d.device || d.must) {
    out.push("", "AUDIENCE MOMENT");
    if (d.who) out.push(`- Who arrives: ${d.who}`);
    if (d.context) out.push(`- Situation: ${d.context.toLowerCase()}`);
    if (d.device) out.push(`- Device: ${d.device.toLowerCase()}${d.device === "Mostly mobile" ? " — design the 390px layout first" : ""}`);
    if (d.must) out.push(`- The one action every section leads to: ${d.must}`);
  }
  if (d.thesis.trim()) out.push("", "DESIGN THESIS (every decision must serve this)", ...d.thesis.trim().split(/\n+/).map(l => `- ${l}`));
  if (d.love.trim()) out.push("", "DESIGNER REFERENCE", `- The designer loves: ${d.love.trim()}. Borrow its principles (proportion, restraint, rhythm), never its look.`);
  return out;
}

/* ---------------- step: result ---------------- */
let sample = null, abortCtl = null, downloads = null;
if (window.claude?.use) {
  window.claude.use("sample").then(s => { sample = s; if (STEPS[S.step].id === "result") render(); }).catch(() => {});
  window.claude.use("downloads").then(d => { downloads = d; if (STEPS[S.step].id === "result") render(); }).catch(() => {});
}

function renderResult(main) {
  if (!S.prompt || S.promptSource === "local") { S.prompt = buildPrompt(); S.promptSource = "local"; }
  const T = tokens(), name = s => s ? s : "—";
  const st = STRUCTURES.find(x => x.id === S.picks.struct), dn = DENSITIES.find(x => x.id === S.picks.dens), mo = MOTIONS.find(x => x.id === S.picks.motion), sg = SIGS.find(x => x.id === T.sig);
  const chip = (i, l, v) => `<button class="chip" data-go="${i}"><small>${l}</small><strong>${esc(name(v))}</strong></button>`;
  const nopeCount = Object.values(S.nope).reduce((a, v) => a + (v || []).length, 0);
  main.innerHTML = `<div class="head"><div><h1>This is your combination.</h1><p>Every pick on one page. Click a card to change that round. The prompt is ready below.</p></div></div>
  <div class="result">
    <div class="final-stage" data-tok id="final">${heroHTML(T)}</div>
    <div class="chips">${chip(1, "Thesis", D().thesis ? D().thesis.split(/(?<=\.)\s/)[0] : "")}${chip(2, "Direction", T.dir.fa)}${chip(3, "Type", `${T.pair.d} + ${T.pair.b}`)}${chip(4, "Color", T.pal.fa)}${chip(5, "Structure", st?.fa)}${chip(6, "Signature", sg?.fa)}${chip(7, "Density & motion", dn && mo ? `${dn.fa} · ${mo.fa}` : "")}
      <div class="chip nopes"><small>Rejected</small><strong>${nopeCount ? `${nopeCount}, listed under AVOID` : "None"}</strong></div></div>
    <div class="prompt-box">
      <div class="prompt-tools">
        ${sample ? `<button class="btn accent" id="refine">${S.promptSource === "claude" ? "Polish again with Claude" : "Polish with Claude"}</button><button class="btn" id="stop" hidden>Stop</button>` : ""}
        <button class="btn primary" id="copy">Copy prompt</button>
        ${downloads ? `<button class="btn" id="dl">Download .md</button>` : ""}
        <button class="btn" id="keep">Save to history</button>
        ${S.promptSource === "claude" ? `<button class="btn" id="reset">Back to base version</button>` : ""}
        <span class="note" id="pnote">${S.promptSource === "claude" ? "Polished by Claude. You can edit it directly." : sample ? "Base version built from your picks. Claude can complete section copy and details for your product while keeping every chosen value (uses your own Claude account)." : "Built from your picks. Copy it and give it to Claude."}</span>
      </div>
      <label for="ptext" class="section-label">Prompt</label>
      <textarea class="prompt" id="ptext" spellcheck="false">${esc(S.prompt)}</textarea>
    </div>
    <div><h2 class="sub-title">History</h2><div class="history" id="hist"></div></div>
  </div>`;
  $("#final")._T = T; mountAll(main);
  main.querySelectorAll("[data-go]").forEach(c => c.onclick = () => go(+c.dataset.go));
  const ta = $("#ptext"); ta.oninput = () => { S.prompt = ta.value; if (S.promptSource === "local") S.promptSource = "edited"; save(); };
  $("#copy").onclick = () => copy(ta.value, ta);
  $("#keep").onclick = () => { history.unshift({ ts: Date.now(), name: S.brief.name, title: `${T.dir.fa} · ${T.pal.fa}`, prompt: ta.value, picks: { ...S.picks } }); history = history.slice(0, 30); store.set("history", history); toast("Saved to history"); renderHistory(); };
  if ($("#dl")) $("#dl").onclick = async () => { try { await downloads.save({ filename: `${(S.brief.name || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-prompt.md`, data: ta.value }); toast("Saved"); } catch (e) { if (e?.code !== "declined") toast("Download isn’t available here — use Copy"); } };
  if ($("#reset")) $("#reset").onclick = () => { S.prompt = buildPrompt(); S.promptSource = "local"; save(); render(); };
  if ($("#refine")) $("#refine").onclick = refine;
  renderHistory();
}

async function refine() {
  const ta = $("#ptext"), note = $("#pnote"), btn = $("#refine"), stop = $("#stop");
  const draft = ta.value;
  abortCtl = new AbortController(); btn.disabled = true; stop.hidden = false; note.textContent = "Claude is thinking…";
  stop.onclick = () => abortCtl?.abort();
  const instr = `You are a senior art director. A designer picked every visual choice below by looking at live samples. Rewrite the DRAFT into the final design prompt for an AI that builds web pages.

Rules:
- Keep EVERY concrete value exactly: font names and weights, hex colors, px sizes, ms durations, cubic-bezier curves, radii, the density budget and the section order. Never swap a choice for one you like better.
- Fill the gaps at the same precision: for each PAGE STRUCTURE section, give one line of real content direction using the product's own words; add component states and responsive behaviour where missing.
- Stay inside the density budget. If the density is minimal or ultra-minimal, remove anything decorative that is not required.
- Do not invent facts: no numbers, prices, testimonials, logos or names that the brief does not contain. Use placeholders like [PRICE].
- Use BRAND CHARACTER, AUDIENCE MOMENT and DESIGN THESIS to decide copy tone, what comes first, and what to cut. Never turn the character or atmosphere into literal imagery.
- Keep the same section headings in the same order. English only. Output ONLY the prompt, no preface.

BRIEF
Product: ${S.brief.name}
What it is: ${S.brief.what}
Audience: ${S.brief.audience}
Real items: ${S.brief.items}
Headline idea: ${S.brief.headline}
Primary action: ${S.brief.cta}
${S.brief.notes ? "Designer notes: " + S.brief.notes : ""}

DRAFT
${draft}`;
  try {
    const { text, truncated } = await sample(instr, { signal: abortCtl.signal, cache: false, onText: ({ text }) => { ta.value = text; note.textContent = "Claude is writing…"; } });
    ta.value = text; S.prompt = text; S.promptSource = "claude"; save();
    note.textContent = truncated ? "The answer was cut short; try again." : "Done. You can edit it directly.";
    render();
  } catch (e) {
    if (e?.text) ta.value = e.text; else ta.value = draft;
    const msg = { cancelled: "Stopped.", not_granted: "Claude access wasn’t allowed — copy the base version instead.", rate_limited: "Usage limit reached for now — try again later.", refused: "Claude declined this request; the base version is back.", session_expired: "Please sign in again." }[e?.code] || "The connection dropped — try again.";
    note.textContent = msg; if (e?.code === "refused") ta.value = draft;
    if (e?.code === "not_granted" || e?.code === "sampling_disabled") { sample = null; }
  } finally { btn.disabled = false; stop.hidden = true; abortCtl = null; }
}

function renderHistory() {
  const box = $("#hist"); if (!box) return;
  if (!history.length) { box.innerHTML = `<div class="empty">Nothing saved yet. Prompts you keep appear here, and options you used before are marked in later rounds.</div>`; return; }
  box.innerHTML = history.map((h, i) => `<div class="hist-item"><div class="t"><strong>${esc(h.name)} — ${esc(h.title)}</strong><span>${new Date(h.ts).toLocaleString("en-GB")}</span></div>
    <button class="icon-btn" data-h="copy" data-i="${i}">Copy</button><button class="icon-btn" data-h="load" data-i="${i}">Open</button><button class="icon-btn" data-h="del" data-i="${i}" aria-label="Delete">✕</button></div>`).join("");
  box.onclick = e => { const b = e.target.closest("[data-h]"); if (!b) return; const h = history[+b.dataset.i];
    if (b.dataset.h === "copy") copy(h.prompt);
    if (b.dataset.h === "load") { S.prompt = h.prompt; S.promptSource = "claude"; S.picks = { ...h.picks }; save(); render(); toast("Loaded"); }
    if (b.dataset.h === "del") { history.splice(+b.dataset.i, 1); store.set("history", history); renderHistory(); } };
}

/* ---------------- chrome ---------------- */
function copy(text, ta) {
  const done = () => toast("Copied");
  try { navigator.clipboard.writeText(text).then(done, () => { if (ta) { ta.select(); toast("Text selected — press Ctrl/⌘+C"); } }); }
  catch { if (ta) { ta.select(); toast("Text selected — press Ctrl/⌘+C"); } }
}
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }

const needs = { dir: "dir", type: "type", pal: "pal", struct: "struct", sig: "sig" };
function stepDone(i) {
  const id = STEPS[i].id;
  if (id === "brief") return !!S.brief.name.trim();
  if (id === "discover") return true;
  if (id === "dens") return !!(S.picks.dens && S.picks.motion);
  if (id === "result") return false;
  return !!S.picks[needs[id]];
}
function go(i) { if (i < 0 || i >= STEPS.length || i > S.maxStep + 1) return; if (STEPS[S.step].id === "result" || i !== S.step) { if (S.promptSource === "local" || !S.prompt) S.prompt = ""; } S.step = i; S.maxStep = Math.max(S.maxStep, i); save(); render(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }

function renderSteps() {
  $("#steps").innerHTML = STEPS.map((s, i) => `<button class="step-pill ${i === S.step ? "on" : ""} ${stepDone(i) ? "done" : ""}" data-i="${i}" ${i > S.maxStep + 1 ? "disabled" : ""} ${i === S.step ? 'aria-current="step"' : ""}><span class="n">${String(i).padStart(2, "0")}</span>${s.fa}</button>`).join("");
  $("#steps").querySelectorAll("button").forEach(b => b.onclick = () => go(+b.dataset.i));
  $("#steps .on")?.scrollIntoView({ block: "nearest", inline: "center" });
}
function renderBar() {
  const id = STEPS[S.step].id, done = stepDone(S.step), isRound = !!ROUNDS[id];
  const status = id === "brief" ? "A product name is enough to start." : id === "discover" ? "Answer what you like and skip the rest." : id === "result" ? "Go back and change any round whenever you like." : id === "dens" ? (done ? "Great — on to the prompt." : "Pick one density and one motion style.") : done ? "Picked. You can move to the next round." : "Click the sample you like.";
  $("#bar").innerHTML = `<div class="wrap"><span class="status">${status}</span>
    ${S.step > 0 ? `<button class="btn" id="b-back">← Back</button>` : ""}
    ${isRound ? `<button class="btn" id="b-shuf">More options</button>` : ""}
    ${isRound && !done ? `<button class="btn" id="b-rand">Surprise me</button>` : ""}
    ${id === "result" ? `<button class="btn" id="b-new">Start over</button>` : `<button class="btn primary" id="b-next" ${done ? "" : "disabled"}>${STEPS[S.step + 1].id === "result" ? "Build prompt" : "Next"} →</button>`}</div>`;
  $("#b-back") && ($("#b-back").onclick = () => go(S.step - 1));
  $("#b-next") && ($("#b-next").onclick = () => go(S.step + 1));
  $("#b-shuf") && ($("#b-shuf").onclick = () => reshuffle(id));
  $("#b-rand") && ($("#b-rand").onclick = () => { const ids = (S.shown[id] || []).filter(x => !(S.nope[id] || []).includes(x)); S.picks[id] = shuffle(ids)[0]; save(); render(); });
  $("#b-new") && ($("#b-new").onclick = () => { const brief = S.brief, disc = S.discover; S = fresh(); S.brief = brief; S.discover = disc; S.step = 2; S.maxStep = 2; save(); render(); });
}

function render() {
  const main = $("#main"), id = STEPS[S.step].id;
  renderSteps();
  if (id === "brief") renderBrief(main);
  else if (id === "discover") renderDiscover(main);
  else if (ROUNDS[id]) renderRound(main, id);
  else if (id === "dens") renderDens(main);
  else renderResult(main);
  renderBar();
}

loadFont("Hanken Grotesk"); loadFont("Geist Mono");
render();
})();
