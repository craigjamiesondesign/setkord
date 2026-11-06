# Setkord redesign reference

Public working reference for a presentation, layout and motion redesign of [setkord.com](https://setkord.com/).

## Preview

The redesigned preview is published with GitHub Pages at:

`https://craigjamiesondesign.github.io/setkord/`

## Repository structure

- `src/capture/`: the original capture of the deployed site (HTML, CSS, minified JavaScript, fonts, images). This is the input to the build and is not edited by it.
- `src/motion/`: the redesign layer: `motion.css` (layout, type, lines, hover, reveals), `motion.js` (GSAP scroll motion, intro sequence, reveals, glow, FAQ slider, log demo) and the self-hosted GSAP 3.13.0 files in `vendor/`.
- `tools/`: the build.
  - `build.py` builds everything into `docs/`.
  - `build_index.py` builds the home page.
  - `build_site.py` builds every other page.
  - `common.py` holds the shared page shell.
  - `serve.py` previews `docs/` locally at the Pages base path.
- `docs/`: generated, Pages-ready output. Don't edit it by hand; rebuild it.
- `reference/SITE-MAP.md`: page inventory, observed interactions and capture limitations.
- `reference/manifest.json`: captured URL-to-file manifest.
- `reference/screenshots/`: verified desktop and mobile homepage captures of the original site.
- `CLAUDE-HANDOFF.md`: context and working instructions for Claude.

## Building and previewing

```bash
python3 -I tools/build.py
python3 -I tools/serve.py
```

Then open `http://127.0.0.1:4176/setkord/`. The build rewrites every root-relative URL for the `/setkord/` base path and keeps `docs/.nojekyll`.

## Preview-only features

This is a capture of deployed Next.js output, not the private source repository. The React runtime is removed from the preview pages and replaced by the redesign scripts. Features that need the live service are non-functional previews:

- **Sign in** opens a page explaining that accounts need the live service.
- **Contact form** shows a note instead of sending.
- **Cloudflare Turnstile** and **account data** are not available.

The blog "Load more" posts are built from the post list the original page carries. Cloudflare-protected email addresses are restored as plain `mailto:` links.

No changes in this repository are deployed to the live Setkord website.
