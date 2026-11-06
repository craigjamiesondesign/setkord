# Claude handoff

Use this repository as the shared source of truth for the Setkord redesign reference.

Read `README.md`, `reference/SITE-MAP.md` and `reference/manifest.json` before making changes. The reference screenshots are in `reference/screenshots/`.

The redesign is built, not hand-edited. The original capture is in `src/capture/`, the redesign layer is in `src/motion/` and the build scripts are in `tools/`. Run `python3 -I tools/build.py` to regenerate `docs/`, the GitHub Pages output, and never edit `docs/` directly.

The capture is deployed Next.js output rather than the original React source. Its JavaScript is production-minified and is treated as behavioural reference material; the preview pages don't load it.

Do not push, deploy or publish changes unless Craig explicitly asks. Do not submit the contact form or attempt to access authenticated areas. Preserve the existing capture until a specific redesign task is provided.

Craig will tell you what to start working on first soon. Until then, inspect the files and wait for that instruction.
