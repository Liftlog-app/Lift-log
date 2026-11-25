#!/usr/bin/env python3
"""Copy the app from src/ into every place it ships from.

src/index.html          -> app/src/main/assets/index.html   (Android)
src/index.html (+meta)  -> docs/index.html                   (iPhone app + home-screen web version)
docs/img/ex/*.jpg       -> app/src/main/assets/img/ex/       (exercise photos)

Run after every change to src/index.html:  python3 scripts/sync.py
"""
import pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "src/index.html").read_text()

(ROOT / "app/src/main/assets/index.html").write_text(src)

VIEWPORT = '<meta name="viewport" content="width=device-width,initial-scale=1">'
IOS_META = VIEWPORT + """
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Lift Log">
<meta name="theme-color" content="#13161b">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="manifest" href="manifest.webmanifest">"""
assert VIEWPORT in src, "viewport meta tag missing from src/index.html"
(ROOT / "docs/index.html").write_text(src.replace(VIEWPORT, IOS_META, 1))

dst = ROOT / "app/src/main/assets/img/ex"
dst.mkdir(parents=True, exist_ok=True)
for jpg in (ROOT / "docs/img/ex").glob("*.jpg"):
    shutil.copy2(jpg, dst / jpg.name)
print("synced: android assets, docs/ (iPhone + web), exercise photos")
