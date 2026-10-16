#!/usr/bin/env python3
"""Diversity engine for the design-prompt skill.

  engine.py sample [--count N] [--lock axis=value ...]
      Prints JSON: N design directions that differ from each other and from
      past history, plus font candidates and concrete choices to avoid.

  engine.py record --file PATH --combo JSON --fonts "A,B,C" --accents "#hex,#hex"
                   --signature "short text" [--product "text"]
      Appends a generated prompt to history so future runs steer away from it.

  engine.py history [--last N]
      Shows recent prompts.
"""
import argparse, json, math, random, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPACE = json.loads((ROOT / "design-space.json").read_text(encoding="utf-8"))
AXES = {k: v for k, v in SPACE["axes"].items() if not k.startswith("_")}
DATA = ROOT / "data"
HIST = DATA / "history.jsonl"
COMPARE_LAST = 60          # how many past prompts to stay away from
RECENT_CONCRETE = 15       # how many past prompts' fonts/colors to avoid reusing


def load_history():
    if not HIST.exists():
        return []
    out = []
    for line in HIST.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return out


def distance(a, b):
    return sum(1 for k in AXES if a.get(k) != b.get(k))


def resolve_lock(axis, value):
    """Match a lock value to an option by case-insensitive substring; else use it as free text."""
    v = value.lower()
    for opt in AXES[axis]:          # prefer options that START with the value
        if opt.lower().startswith(v):
            return opt
    for opt in AXES[axis]:
        if v in opt.lower():
            return opt
    return value


QUIET = {k: v for k, v in SPACE.get("quiet_options", {}).items() if not k.startswith("_")}


def draw(locks):
    """One random direction. Density is drawn first; minimal densities pull quiet options."""
    c = {}
    dens = locks.get("density") or random.choice(AXES["density"])
    c["density"] = dens
    quiet = "minimal" in dens.lower()
    for k, opts in AXES.items():
        if k == "density":
            continue
        if k in locks:
            c[k] = locks[k]
        elif quiet and k in QUIET:
            c[k] = random.choice(QUIET[k])
        else:
            c[k] = random.choice(opts)
    return c


def sample(count, locks):
    hist = [h["combo"] for h in load_history()[-COMPARE_LAST:] if "combo" in h]
    n = len(AXES)
    free_axes = n - len(locks)
    # Required distance: ~2/3 of the free axes must differ. Relax if the space can't satisfy it.
    need = max(1, math.ceil(free_axes * 0.66))
    picked = []
    while need >= 1:
        picked = []
        for _ in range(6000):
            c = draw(locks)
            # the most visible axes must never repeat inside a batch or vs the last few prompts
            visible_clash = any(
                c[k] == o.get(k)
                for o in picked + hist[-5:]
                for k in ("movement", "signature_graphic") if k not in locks
            )
            if not visible_clash and all(distance(c, o) >= need for o in hist + picked):
                picked.append(c)
                if len(picked) == count:
                    break
        if len(picked) == count:
            break
        need -= 1
    while len(picked) < count:  # last resort
        picked.append(draw(locks))

    recent = load_history()[-RECENT_CONCRETE:]
    used_fonts = sorted({f.strip() for h in recent for f in h.get("fonts", []) if f.strip()})
    used_accents = sorted({a.strip().lower() for h in recent for a in h.get("accents", []) if a.strip()})
    used_sigs = [h.get("signature", "") for h in recent if h.get("signature")]

    def cands(pool, k):
        fresh = [f for f in SPACE["fonts"][pool] if f not in used_fonts]
        return random.sample(fresh or SPACE["fonts"][pool], min(k, len(fresh or SPACE["fonts"][pool])))

    directions = []
    for c in picked:
        directions.append({
            "combo": c,
            "font_candidates": {"display": cands("display", 4), "body": cands("body", 3), "mono": cands("mono", 2)},
        })
    return {
        "directions": directions,
        "min_axes_different_from_history": need,
        "history_size": len(load_history()),
        "avoid_reusing": {"fonts": used_fonts, "accent_hexes": used_accents, "signature_ideas": used_sigs},
    }


def record(args):
    DATA.mkdir(exist_ok=True)
    try:
        combo = json.loads(args.combo)
    except json.JSONDecodeError:
        sys.exit("--combo must be the JSON object of the direction used")
    entry = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "file": args.file,
        "product": args.product or "",
        "combo": combo,
        "fonts": [f.strip() for f in args.fonts.split(",") if f.strip()],
        "accents": [a.strip() for a in args.accents.split(",") if a.strip()],
        "signature": args.signature,
    }
    with HIST.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(json.dumps({"recorded": True, "history_size": len(load_history())}))


def show_history(last):
    for h in load_history()[-last:]:
        c = h.get("combo", {})
        print(f'{h.get("ts","")}  {h.get("product","")[:40]:40}  {c.get("movement","")[:38]:38}  {", ".join(h.get("fonts", []))}')


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("sample")
    s.add_argument("--count", type=int, default=1)
    s.add_argument("--lock", action="append", default=[], help="axis=value (substring match or free text)")
    r = sub.add_parser("record")
    r.add_argument("--file", required=True)
    r.add_argument("--combo", required=True)
    r.add_argument("--fonts", default="")
    r.add_argument("--accents", default="")
    r.add_argument("--signature", default="")
    r.add_argument("--product", default="")
    h = sub.add_parser("history")
    h.add_argument("--last", type=int, default=20)
    a = p.parse_args()

    if a.cmd == "sample":
        locks = {}
        for item in a.lock:
            if "=" not in item:
                sys.exit(f"bad --lock '{item}', use axis=value")
            k, v = item.split("=", 1)
            k = k.strip()
            if k not in AXES:
                sys.exit(f"unknown axis '{k}'. axes: {', '.join(AXES)}")
            locks[k] = resolve_lock(k, v.strip())
        print(json.dumps(sample(max(1, min(a.count, 6)), locks), ensure_ascii=False, indent=2))
    elif a.cmd == "record":
        record(a)
    else:
        show_history(a.last)


if __name__ == "__main__":
    main()
