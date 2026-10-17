/* Taste Studio — studies.
   One original SVG composition per art source, 1200×750, drawn with CSS variables
   (--bg --fg --muted --line --accent --accent2 --display --body --mono) so palettes and
   type can change without redrawing. Each study demonstrates an operation; none reproduces
   a specific artwork. */

const STUDY = (() => {
  const F = n => `fill:var(--${n})`;
  const S = (n, w = 1) => `stroke:var(--${n});stroke-width:${w}`;
  const r2 = v => Math.round(v * 10) / 10;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function rng(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    let a = h >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // smooth closed path through points (Catmull-Rom → cubic Bézier)
  function smooth(pts) {
    const n = pts.length; let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ` C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`;
    }
    return d + "Z";
  }
  function blob(cx, cy, r, n, jit, R) {
    const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * (1 - jit / 2 + R() * jit); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (.7 + R() * .6)]); }
    return smooth(pts);
  }
  function torn(x, y, w, h, R, jag = 7) {
    const pts = []; const step = 22;
    for (let i = 0; i <= w; i += step) pts.push([x + i, y + (R() - .5) * jag]);
    for (let i = 0; i <= h; i += step) pts.push([x + w + (R() - .5) * jag, y + i]);
    for (let i = w; i >= 0; i -= step) pts.push([x + i, y + h + (R() - .5) * jag]);
    for (let i = h; i >= 0; i -= step) pts.push([x + (R() - .5) * jag, y + i]);
    return "M" + pts.map(p => `${r2(p[0])} ${r2(p[1])}`).join(" L") + "Z";
  }
  const word = (b, i) => (b.items[i % b.items.length] || b.name).trim();

  const draw = {
    albers: () => `<rect x="640" y="70" width="500" height="500" style="${F("accent2")}"/>
      <rect x="715" y="185" width="350" height="350" style="${F("accent")}"/>
      <rect x="790" y="300" width="200" height="200" style="${F("line")}"/>
      <rect x="70" y="560" width="130" height="130" style="${F("fg")}"/><rect x="105" y="600" width="60" height="60" style="${F("accent")}"/>
      <rect x="215" y="560" width="130" height="130" style="${F("line")}"/><rect x="250" y="600" width="60" height="60" style="${F("accent")}"/>`,

    kelly: () => `<path d="M690 0 C 980 110 1140 400 1200 750 L 1200 0 Z" style="${F("accent")}"/>
      <path d="M690 0 C 980 110 1140 400 1200 750" style="fill:none;${S("fg", 1)};opacity:.0"/>`,

    matisse: (b, R) => {
      const cols = ["accent", "accent2", "fg", "accent", "accent2", "accent", "fg"]; let s = "";
      const spots = [[820, 170, 120], [1060, 300, 140], [760, 470, 110], [990, 620, 130], [1170, 80, 90], [640, 690, 80], [900, 350, 70]];
      spots.forEach(([x, y, r], i) => { s += `<path d="${blob(x, y, r, 9 + (i % 3), .75, R)}" style="${F(cols[i])}" transform="rotate(${r2((R() - .5) * 40)} ${x} ${y})"/>`; });
      return s;
    },

    lewitt: (b, R) => {
      let s = ""; const corners = [[560, 0], [1200, 0], [560, 750], [1200, 750]];
      for (let i = 0; i < 56; i++) { const c = corners[i % 4], x = 600 + R() * 560, y = 40 + R() * 620;
        s += `<line x1="${c[0]}" y1="${c[1]}" x2="${r2(x)}" y2="${r2(y)}" style="${S(i % 9 === 0 ? "accent" : "fg", i % 9 === 0 ? 2 : .8)};opacity:${i % 9 === 0 ? 1 : .55}"/>`; }
      return s + `<text x="600" y="728" style="${F("muted")};font-family:var(--mono);font-size:14px;letter-spacing:.06em">LINES FROM FOUR CORNERS TO POINTS CHOSEN AT RANDOM</text>`;
    },

    destijl: (b, R) => {
      const xs = [560, 560 + 140 + R() * 120, 1200 - 90 - R() * 80], ys = [150 + R() * 100, 420 + R() * 120, 620 + R() * 60];
      let s = `<rect x="${xs[0]}" y="0" width="${xs[1] - xs[0]}" height="${ys[0]}" style="${F("accent")}"/>
        <rect x="${xs[1]}" y="${ys[1]}" width="${1200 - xs[1]}" height="${ys[2] - ys[1]}" style="${F("accent2")}"/>
        <rect x="${xs[2]}" y="0" width="${1200 - xs[2]}" height="${ys[0]}" style="${F("fg")}"/>`;
      xs.forEach(x => s += `<rect x="${r2(x - 7)}" y="0" width="14" height="750" style="${F("line")}"/>`);
      s += `<rect x="560" y="${r2(ys[0] - 7)}" width="640" height="14" style="${F("line")}"/><rect x="${xs[1]}" y="${r2(ys[1] - 7)}" width="${1200 - xs[1]}" height="14" style="${F("line")}"/>
        <rect x="0" y="${r2(ys[2] - 7)}" width="1200" height="14" style="${F("line")}"/>`;
      return s;
    },

    riley: () => {
      let s = ""; for (let i = 0; i < 46; i++) { const y0 = 8 + i * 16.2; let d = "";
        for (let x = 520; x <= 1200; x += 12) { const ph = (x - 520) / 680, y = y0 + Math.sin(x * .018 + i * .35 * ph) * (4 + 16 * ph); d += (x === 520 ? "M" : "L") + `${x} ${r2(y)} `; }
        s += `<path d="${d}" style="fill:none;${S(i % 7 === 3 ? "accent2" : "accent", 5.5)}"/>`; }
      return s;
    },

    miniature: (b, R) => {
      let s = `<rect x="18" y="18" width="1164" height="714" style="fill:none;${S("accent2", 16)}"/>
        <rect x="40" y="40" width="1120" height="670" style="fill:none;${S("line", 2)}"/>`;
      for (let x = 60; x < 1150; x += 34) s += `<rect x="${x}" y="13" width="9" height="9" transform="rotate(45 ${x + 4.5} 17.5)" style="${F("bg")}"/><rect x="${x}" y="728" width="9" height="9" transform="rotate(45 ${x + 4.5} 732.5)" style="${F("bg")}"/>`;
      s += `<path d="M640 700 L640 220 Q 640 90 860 90 Q 1080 90 1080 220 L1080 700 Z" style="${F("accent")}"/>
        <path d="M640 700 L640 220 Q 640 90 860 90 Q 1080 90 1080 220 L1080 700 Z" style="fill:none;${S("accent2", 6)}"/>
        <path d="M640 600 Q 760 520 860 560 T 1080 520 L1080 700 L640 700 Z" style="${F("accent2")};opacity:.85"/>
        <circle cx="770" cy="320" r="34" style="${F("bg")}"/><circle cx="950" cy="250" r="22" style="${F("bg")}"/>
        <rect x="1030" y="300" width="130" height="190" rx="65" style="${F("bg")};${S("fg", 3)}"/>
        <circle cx="1095" cy="270" r="38" style="${F("accent2")};${S("fg", 3)}"/>`;
      return s;
    },

    siyahmashq: (b, R) => {
      const letters = (b.name.replace(/[^A-Za-z]/g, "") || "ABC").toUpperCase(); let s = "";
      for (let i = 0; i < 70; i++) { const x = 380 + Math.pow(R(), .6) * 860, y = 80 + R() * 700, sz = 90 + R() * 220, op = r2(.06 + R() * .32);
        s += `<text x="${r2(x)}" y="${r2(y)}" transform="rotate(${r2(-28 + R() * 18)} ${r2(x)} ${r2(y)})" style="${F(i % 23 === 5 ? "accent2" : "fg")};opacity:${i % 23 === 5 ? .8 : op};font-family:var(--display);font-style:italic;font-size:${r2(sz)}px">${esc(letters[i % letters.length])}</text>`; }
      return s;
    },

    girih: () => {
      let s = `<defs><clipPath id="gc"><rect x="560" y="0" width="640" height="750"/></clipPath></defs><g clip-path="url(#gc)">`;
      const star = (cx, cy, r) => { let p = ""; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * .62 : r; p += `${i ? "L" : "M"}${r2(cx + Math.cos(a) * rr)} ${r2(cy + Math.sin(a) * rr)} `; } return p + "Z"; };
      for (let y = -75; y <= 825; y += 150) for (let x = 540; x <= 1290; x += 150) {
        const off = (Math.round((y + 75) / 150) % 2) * 75;
        s += `<path d="${star(x + off, y, 64)}" style="fill:${(x + y) % 300 === 0 ? "var(--accent2)" : "none"};${S("accent", 3)}"/>`;
        s += `<rect x="${x + off - 24}" y="${y - 24}" width="48" height="48" transform="rotate(45 ${x + off} ${y})" style="fill:none;${S("accent", 2)}"/>`;
      }
      return s + `</g><line x1="560" y1="0" x2="560" y2="750" style="${S("accent", 3)}"/>`;
    },

    ma: () => `<rect x="780" y="0" width="420" height="750" style="${F("fg")}"/>
      <circle cx="990" cy="360" r="118" style="${F("bg")}"/>
      <rect x="620" y="600" width="34" height="34" style="${F("accent")}"/>
      <line x1="560" y1="660" x2="760" y2="660" style="${S("fg", 1)}"/>`,

    ukiyoe: () => `<defs><linearGradient id="bk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset=".9" style="stop-color:var(--bg);stop-opacity:0"/></linearGradient></defs>
      <rect x="0" y="0" width="1200" height="300" style="fill:url(#bk)"/>
      <path d="M560 750 L930 140 L1300 750 Z" style="${F("accent")};${S("fg", 5)}"/>
      <path d="M800 340 L930 140 L1060 340 Q 1000 300 960 330 Q 930 300 900 330 Q 860 300 800 340 Z" style="${F("bg")};${S("fg", 5)}"/>
      <rect x="0" y="640" width="1200" height="110" style="${F("accent2")}"/><line x1="0" y1="640" x2="1200" y2="640" style="${S("fg", 5)}"/>
      <circle cx="1080" cy="170" r="52" style="${F("accent2")}"/>`,

    constructivist: (b) => `<polygon points="560,750 1200,120 1200,750" style="${F("accent")}"/>
      <g transform="rotate(-38 900 380)"><rect x="560" y="330" width="760" height="70" style="${F("fg")}"/>
      <text x="600" y="380" style="${F("bg")};font-family:var(--display);font-size:46px;letter-spacing:.06em;text-transform:uppercase">${esc(b.name.toUpperCase())}</text></g>
      <circle cx="1060" cy="160" r="70" style="${F("fg")}"/>`,

    triadic: () => `<ellipse cx="900" cy="640" rx="330" ry="54" style="${F("accent")};opacity:.18"/>
      <line x1="520" y1="640" x2="1200" y2="640" style="${S("fg", 2)}"/>
      <polygon points="700,640 760,330 820,640" style="${F("accent")}"/><circle cx="760" cy="300" r="34" style="${F("fg")}"/>
      <circle cx="930" cy="520" r="120" style="${F("accent2")}"/><rect x="905" y="300" width="50" height="100" style="${F("fg")}"/>
      <rect x="1060" y="380" width="70" height="260" rx="35" style="fill:none;${S("fg", 6)}"/><circle cx="1095" cy="340" r="30" style="${F("accent")}"/>`,

    fluxus: (b) => {
      const it = (b.items[0] || "something").toLowerCase();
      const lines = [`EVENT SCORE FOR ${b.name.toUpperCase()}`, "", `1. Describe a ${it}`, "   you have never met.", `2. ${b.cta}.`, "3. Wait.", "4. Greet whoever answers."];
      return `<g transform="rotate(-4 900 380)"><rect x="620" y="150" width="540" height="380" style="${F("line")}"/>
        <rect x="610" y="140" width="540" height="380" style="${F("bg")};${S("fg", 1.5)}"/>
        ${lines.map((l, i) => `<text x="645" y="${200 + i * 42}" style="${F("fg")};font-family:var(--mono);font-size:22px;white-space:pre">${esc(l)}</text>`).join("")}
        <g transform="rotate(-14 1060 470)"><rect x="985" y="440" width="150" height="56" rx="6" style="fill:none;${S("accent", 4)}"/><text x="1000" y="478" style="${F("accent")};font-family:var(--mono);font-weight:700;font-size:24px;letter-spacing:.1em">FLUXUS</text></g></g>`;
    },

    wordscape: (b) => `<defs><linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset=".62" style="stop-color:var(--bg)"/><stop offset="1" style="stop-color:var(--accent2)"/></linearGradient></defs>
      <rect width="1200" height="750" style="fill:url(#hz)"/><line x1="0" y1="470" x2="1200" y2="470" style="${S("fg", 1)};opacity:.5"/>
      <text x="600" y="440" text-anchor="middle" style="${F("fg")};font-family:var(--display);font-weight:var(--dw);font-size:${Math.min(220, 1700 / Math.max(4, b.name.length))}px;letter-spacing:.02em;text-transform:uppercase">${esc(b.name.toUpperCase())}</text>`,

    martin: (b, R) => {
      let s = ""; for (let i = 0; i < 10; i++) if (i % 2) s += `<rect x="0" y="${i * 75}" width="1200" height="75" style="${F("accent2")};opacity:.55"/>`;
      for (let x = 30; x < 1200; x += 30) { let d = `M${x} 0`; for (let y = 25; y <= 750; y += 25) d += ` L${r2(x + (R() - .5) * 1.6)} ${y}`; s += `<path d="${d}" style="fill:none;${S("line", .8)}"/>`; }
      for (let y = 15; y < 750; y += 15) { let d = `M0 ${y}`; for (let x = 40; x <= 1200; x += 40) d += ` L${x} ${r2(y + (R() - .5) * 1.2)}`; s += `<path d="${d}" style="fill:none;${S("line", .5)};opacity:.7"/>`; }
      return s;
    },

    colorfield: () => `<defs><filter id="sf" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter></defs>
      <rect x="640" y="60" width="500" height="330" rx="8" style="${F("accent")}" filter="url(#sf)"/>
      <rect x="640" y="420" width="500" height="270" rx="8" style="${F("accent2")}" filter="url(#sf)"/>`,

    suprematism: () => `<rect x="720" y="120" width="300" height="300" transform="rotate(9 870 270)" style="${F("fg")}"/>
      <rect x="980" y="430" width="180" height="70" transform="rotate(-22 1070 465)" style="${F("accent")}"/>
      <rect x="640" y="520" width="420" height="18" transform="rotate(-8 850 529)" style="${F("accent2")}"/>
      <rect x="700" y="580" width="260" height="10" transform="rotate(-8 830 585)" style="${F("fg")}"/>
      <circle cx="1100" cy="170" r="44" style="${F("accent")}"/>`,

    concrete: (b) => {
      const t1 = (Array(8).fill(b.name).join(" · ") + " · "), t2 = (b.items.concat(b.items).join(" · ") + " · ");
      return `<defs><path id="c1" d="M900 375 m-270 0 a270 270 0 1 1 540 0 a270 270 0 1 1 -540 0"/><path id="c2" d="M900 375 m-170 0 a170 170 0 1 0 340 0 a170 170 0 1 0 -340 0"/></defs>
        <text style="${F("fg")};font-family:var(--display);font-weight:600;font-size:34px;letter-spacing:.02em"><textPath href="#c1">${esc(t1)}</textPath></text>
        <text style="${F("accent")};font-family:var(--display);font-size:24px"><textPath href="#c2">${esc(t2)}</textPath></text>
        <text x="900" y="388" text-anchor="middle" style="${F("muted")};font-family:var(--mono);font-size:14px;letter-spacing:.12em">${esc((b.cta || "").toUpperCase())}</text>`;
    },

    swissposter: () => {
      let s = ""; for (let x = 560; x <= 1200; x += 80) s += `<line x1="${x}" y1="0" x2="${x}" y2="750" style="${S("line", 1)}"/>`;
      for (let y = 0; y <= 750; y += 75) s += `<line x1="560" y1="${y}" x2="1200" y2="${y}" style="${S("line", 1)}"/>`;
      [[800, 225, 150, "accent"], [960, 450, 110, "fg"], [880, 600, 60, "accent"], [1120, 150, 40, "fg"], [720, 525, 30, "fg"]].forEach(([x, y, r, c]) => s += `<circle cx="${x}" cy="${y}" r="${r}" style="${F(c)};mix-blend-mode:multiply"/>`);
      return s;
    },

    woodcut: (b, R) => {
      let s = `<rect x="580" y="60" width="580" height="630" style="${F("fg")}"/><circle cx="1000" cy="230" r="90" style="${F("accent")}"/>`;
      for (let i = 0; i < 26; i++) { const y = 360 + i * 13; let d = `M${590 + R() * 20} ${y}`;
        for (let x = 620; x < 1150; x += 30) d += ` Q ${x + 15} ${r2(y + (R() - .5) * 18)} ${x + 30} ${r2(y + (R() - .5) * 6)}`;
        s += `<path d="${d}" style="fill:none;${S("bg", 2 + R() * 5)};stroke-linecap:round"/>`; }
      for (let i = 0; i < 40; i++) { const x = 600 + R() * 540, y = 80 + R() * 250; s += `<path d="M${r2(x)} ${r2(y)} l${r2(10 + R() * 30)} ${r2((R() - .5) * 10)}" style="fill:none;${S("bg", 3)};stroke-linecap:round"/>`; }
      return s;
    },

    weaving: () => {
      let s = ""; const cw = 28, cols = ["accent", "accent2", "fg", "accent2"], rows = ["muted", "accent", "line", "accent"];
      for (let j = 0; j < 27; j++) for (let i = 0; i < 23; i++) {
        const x = 560 + i * cw, y = j * cw, warpOver = (i + j) % 4 < 2;
        s += `<rect x="${x + 2}" y="${y + 2}" width="${cw - 4}" height="${cw - 4}" rx="3" style="${F(warpOver ? cols[Math.floor(i / 3) % 4] : rows[Math.floor(j / 4) % 4])}"/>`;
      }
      return s;
    },

    mobile: () => `<g class="sway"><line x1="880" y1="0" x2="880" y2="120" style="${S("fg", 2)}"/>
      <line x1="640" y1="120" x2="1120" y2="160" style="${S("fg", 2)}"/>
      <line x1="660" y1="122" x2="660" y2="300" style="${S("fg", 1.5)}"/><ellipse cx="660" cy="350" rx="70" ry="50" style="${F("accent")}"/>
      <line x1="1100" y1="158" x2="1100" y2="420" style="${S("fg", 1.5)}"/><circle cx="1100" cy="460" r="40" style="${F("accent2")}"/>
      <line x1="900" y1="140" x2="900" y2="250" style="${S("fg", 1.5)}"/><line x1="780" y1="250" x2="1030" y2="280" style="${S("fg", 1.5)}"/>
      <line x1="790" y1="251" x2="790" y2="520" style="${S("fg", 1.5)}"/><path d="M790 520 q 60 30 40 110 q -90 -20 -40 -110 z" style="${F("fg")}"/>
      <line x1="1020" y1="279" x2="1020" y2="340" style="${S("fg", 1.5)}"/><circle cx="1020" cy="360" r="20" style="${F("fg")}"/></g>`,

    handscroll: (b, R) => {
      let s = "", d = "M0 750 L0 560";
      for (let x = 0; x <= 1200; x += 40) d += ` L${x} ${r2(560 - Math.abs(Math.sin(x * .006)) * 220 - R() * 30)}`;
      s += `<path d="${d} L1200 750 Z" style="${F("accent2")};opacity:.35"/>`;
      d = "M0 750 L0 640"; for (let x = 0; x <= 1200; x += 30) d += ` L${x} ${r2(640 - Math.abs(Math.sin(x * .01 + 2)) * 120 - R() * 20)}`;
      s += `<path d="${d} L1200 750 Z" style="${F("fg")};opacity:.55"/>`;
      for (let i = 0; i < 4; i++) s += `<rect x="0" y="${470 + i * 34}" width="1200" height="10" style="${F("bg")};opacity:.55"/>`;
      return s + `<rect x="1110" y="420" width="44" height="44" style="${F("accent")}"/>`;
    },

    cyanotype: (b, R) => {
      let s = "";
      [[720, 120, 0], [900, 170, 1], [1080, 110, 2]].forEach(([x, y, k]) => {
        let d = `M${x} ${y + 470} C ${x - 10} ${y + 300} ${x + 20} ${y + 160} ${x + (k - 1) * 30} ${y}`; s += `<path d="${d}" style="fill:none;${S("fg", 3)}"/>`;
        for (let i = 0; i < 12; i++) { const t = i / 12, py = y + 470 - t * 450, px = x + (k - 1) * 30 * t; const side = i % 2 ? 1 : -1, L = 70 * (1 - t * .6);
          s += `<ellipse cx="${r2(px + side * L * .55)}" cy="${r2(py)}" rx="${r2(L * .55)}" ry="${r2(9 + (1 - t) * 6)}" transform="rotate(${side * -24} ${r2(px + side * L * .55)} ${r2(py)})" style="${F("fg")};opacity:.92"/>`; }
        s += `<text x="${x - 60}" y="${y + 520}" style="${F("muted")};font-family:var(--mono);font-size:13px;letter-spacing:.08em">No. ${k + 1} — ${esc(word(b, k).toUpperCase())}</text>`;
      });
      return s;
    },

    collage: (b, R) => {
      const frags = [[620, 70, 340, 230, "accent", -6], [880, 230, 300, 320, "line", 5], [660, 400, 260, 250, "accent2", -3], [960, 540, 220, 160, "fg", 8]];
      let s = ""; frags.forEach(([x, y, w, h, c, rot], i) => {
        s += `<path d="${torn(x, y, w, h, R)}" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" style="${F(c)}"/>`;
        const txt = i === 1 ? word(b, 0) : i === 3 ? word(b, 1) : "";
        if (txt) s += `<text x="${x + 24}" y="${y + 60}" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" style="${F(i === 3 ? "bg" : "fg")};font-family:${i === 1 ? "var(--display)" : "var(--mono)"};font-size:${i === 1 ? 40 : 20}px">${esc(txt)}</text>`;
      });
      return s;
    },
  };

  function svg(id, b) {
    const fn = draw[id] || draw.albers;
    return `<svg class="art" viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${fn(b, rng(id + b.name))}</svg>`;
  }
  return { svg, ids: Object.keys(draw) };
})();
