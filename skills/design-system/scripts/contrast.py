#!/usr/bin/env python3
"""WCAG contrast check for a design-tokens file.

usage: contrast.py tokens.json

Finds color tokens, pairs every text-like token (text, fg, foreground, on-*,
link, label, accent-contrast ...) with every background-like token (bg,
background, surface, ground, paper, card, canvas), and reports ratios.
Text needs 4.5:1; tokens whose name says display/large/headline need 3:1.
Exits 1 if any pair fails. Token values may be hex, rgb()/rgba(), or
references like "{color.text}".
"""
import json, re, sys

TEXT_HINTS = ("text", "fg", "foreground", "on-", "on_", "link", "label", "ink", "contrast", "heading", "title")
BG_HINTS = ("bg", "background", "surface", "ground", "paper", "card", "canvas", "base")
LARGE_HINTS = ("display", "large", "headline", "hero")
SKIP_HINTS = ("border", "hairline", "divider", "rule", "shadow", "outline", "ring", "overlay", "scrim")


def flatten(node, path=()):
    if isinstance(node, dict):
        if "$value" in node:
            yield ".".join(path), node["$value"], node.get("$type")
        else:
            for k, v in node.items():
                if not k.startswith("$"):
                    yield from flatten(v, path + (k,))
    elif isinstance(node, str):
        yield ".".join(path), node, None


def parse_color(v):
    v = v.strip().lower()
    m = re.fullmatch(r"#([0-9a-f]{3,8})", v)
    if m:
        h = m.group(1)
        if len(h) in (3, 4):
            h = "".join(c * 2 for c in h)
        r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
        return (r, g, b, a)
    m = re.fullmatch(r"rgba?\(([^)]+)\)", v)
    if m:
        parts = [p.strip() for p in re.split(r"[,\s/]+", m.group(1)) if p.strip()]
        try:
            r, g, b = (float(p.rstrip("%")) * (2.55 if p.endswith("%") else 1) for p in parts[:3])
            a = float(parts[3].rstrip("%")) / (100 if parts[3].endswith("%") else 1) if len(parts) > 3 else 1.0
            return (r, g, b, a)
        except ValueError:
            return None
    return None


def lum(c):
    def ch(x):
        x /= 255
        return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    r, g, b = c[:3]
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def over(fg, bg):
    a = fg[3]
    return tuple(fg[i] * a + bg[i] * (1 - a) for i in range(3)) + (1.0,)


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    raw = {name: val for name, val, _ in flatten(data) if isinstance(val, str)}

    def resolve(v, depth=0):
        m = re.fullmatch(r"\{([^}]+)\}", v.strip())
        if m and depth < 10:
            return resolve(raw.get(m.group(1), ""), depth + 1)
        return v

    colors = {}
    for name, val in raw.items():
        c = parse_color(resolve(val))
        if c:
            colors[name] = c

    def has(name, hints):
        n = name.lower()
        return any(h in n for h in hints)

    texts = {n: c for n, c in colors.items() if has(n, TEXT_HINTS) and not has(n, SKIP_HINTS)}
    bgs = {n: c for n, c in colors.items() if has(n, BG_HINTS) and not has(n, SKIP_HINTS) and n not in texts}

    if not texts or not bgs:
        print(f"Found {len(colors)} colors but could not tell text from backgrounds "
              f"(text-like: {len(texts)}, background-like: {len(bgs)}). Name tokens with words like "
              f"'text' and 'bg'/'surface'.")
        sys.exit(1)

    def partner(tn):
        """'accent-contrast' / 'on-accent' pair only with 'accent'."""
        parts = tn.split(".")
        leaf = parts[-1]
        base = None
        for suf in ("-contrast", "_contrast", "-on", "-foreground", "-fg"):
            if leaf.endswith(suf):
                base = leaf[: -len(suf)]
        for pre in ("on-", "on_"):
            if leaf.startswith(pre):
                base = leaf[len(pre):]
        if base:
            key = ".".join(parts[:-1] + [base])
            if key in colors:
                return {key: colors[key]}
        return None

    fails = 0
    print(f"{'text token':38} {'background':28} ratio  need  result")
    for tn, tc in texts.items():
        need = 3.0 if has(tn, LARGE_HINTS) else 4.5
        for bn, bc in (partner(tn) or bgs).items():
            bcol = bc if bc[3] == 1 else over(bc, (255, 255, 255, 1))
            r = ratio(over(tc, bcol), bcol)
            ok = r >= need
            fails += not ok
            print(f"{tn[:38]:38} {bn[:28]:28} {r:5.2f}  {need:3.1f}  {'ok' if ok else 'FAIL'}")
    print(f"\n{fails} failing pair(s)." if fails else "\nAll pairs pass WCAG AA.")
    print("Note: not every text token is meant for every background; ignore pairs that never occur.")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
