"""Builds the redesigned Setkord preview into docs/ for GitHub Pages.

1. Clears docs/ (keeping .nojekyll) and copies in the original capture (src/capture) and the
   motion layer (src/motion).
2. Rebuilds the home page (build_index.py) and every other page (build_site.py) on top of it.
3. Rewrites root-relative URLs so everything works under the Pages base path /setkord/.

Run from the repository root:  python3 -I tools/build.py
Preview the result locally:     python3 -I tools/serve.py   (then open http://127.0.0.1:4176/setkord/)
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
BASE = "/setkord/"

# 1. Fresh output
for item in DOCS.iterdir():
    if item.name == ".nojekyll":
        continue
    shutil.rmtree(item) if item.is_dir() else item.unlink()
shutil.copytree(ROOT / "src/capture", DOCS, dirs_exist_ok=True, ignore=shutil.ignore_patterns(".DS_Store"))
shutil.copytree(ROOT / "src/motion", DOCS / "motion", ignore=shutil.ignore_patterns(".DS_Store"))
(DOCS / ".nojekyll").touch()

# 2. Pages
for script in ("build_index.py", "build_site.py"):
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / script)], check=True)

# 3. Base path. Only root-relative URLs ("/x", not "//host" or "https://") are rewritten.
ATTR = re.compile(r'(\s(?:href|src|action|poster)=")/(?!/)')
SRCSET = re.compile(r'(\s(?:srcset|imagesrcset)=")([^"]*)"')
CSS_URL = re.compile(r'url\((["\']?)/(?!/)')


def rebase_srcset(m):
    parts = [p.strip() for p in m.group(2).split(",")]
    parts = [BASE + p[1:] if p.startswith("/") and not p.startswith("//") else p for p in parts]
    return f'{m.group(1)}{", ".join(parts)}"'


for page in DOCS.rglob("*.html"):
    text = page.read_text()
    text = ATTR.sub(lambda m: m.group(1) + BASE, text)
    text = SRCSET.sub(rebase_srcset, text)
    text = CSS_URL.sub(lambda m: f"url({m.group(1)}{BASE}", text)
    page.write_text(text)
for sheet in DOCS.rglob("*.css"):
    text = sheet.read_text()
    sheet.write_text(CSS_URL.sub(lambda m: f"url({m.group(1)}{BASE}", text))

print("built docs/ for", BASE)
