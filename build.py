#!/usr/bin/env python3
"""Inline src/ into two outputs:
  index.html          — standalone page (open locally or serve with GitHub Pages)
  dist/artifact.html  — the same page without a document skeleton, for publishing as a Claude artifact
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
src = ROOT / "src"
shell = (src / "shell.html").read_text(encoding="utf-8")
body = (shell
        .replace("/*CSS*/", (src / "style.css").read_text(encoding="utf-8"))
        .replace("/*DATA*/", (src / "data.js").read_text(encoding="utf-8"))
        .replace("/*DIRS*/", (src / "directions.js").read_text(encoding="utf-8"))
        .replace("/*STUDIES*/", (src / "studies.js").read_text(encoding="utf-8"))
        .replace("/*APP*/", (src / "app.js").read_text(encoding="utf-8")))

(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist" / "artifact.html").write_text(body, encoding="utf-8")

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>
{body}
</body>
</html>
"""
(ROOT / "index.html").write_text(page, encoding="utf-8")
print("built index.html and dist/artifact.html")
