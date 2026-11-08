# Setkord redesign handover

**How to use this:** open Claude Code in the setkord.com codebase and say:

> Read https://github.com/craigjamiesondesign/setkord/tree/handover/handover and follow the README.

The rest of this note is written for Claude Code.

## The task

Rebuild setkord.com's public marketing pages to match a finished redesign, inside the existing Next.js codebase. Do not replace the app with static files. Do not commit, push or deploy until the owner approves.

## What has been done

A static redesign of the public pages was built from a capture of setkord.com, then given an agent-readiness layer and published as a preview on Netlify. The preview scored 98/100 on Is Agentic, with all 6 essential checks passing. The only two failures come from it being a preview: `noindex`, and a `netlify.app` address that does not rank for the brand. The current setkord.com scored 65/100 on 8 November 2026.

The redesign's published pages were tested with Lighthouse: Accessibility 98-100, Best Practices 96, SEO 92, Performance 80-88 on mobile and 95-100 on desktop.

## Reference

- Working redesign: https://setkord-site.netlify.app
- Is Agentic report: https://is-agentic.com/scan/setkord-site.netlify.app
- Redesign source: https://github.com/craigjamiesondesign/setkord, on `main`. `src/motion` holds the layout, motion and GSAP layer; `tools` holds the build
- `setkord-launch.zip` in this folder: the built pages, with URLs set to setkord.com
- `markdown.ts` in this folder: the Netlify version of the Markdown negotiation; adapt it to this stack

## Keep working

`/login`, the signed-in web app, `/api/*`, `/admin`, `/.well-known/apple-app-site-association`, the contact form with `/api/contact` and Turnstile, Auth.js and the Sentry setup. The zip's `/login` page is a static copy; ignore it.

The contact form has not been tested on the redesign build.

## Agent readiness: must carry over

1. `Accept: text/markdown` returns a Markdown version of each public page, with `Content-Type: text/markdown` and `Vary: Accept`. HTML is unchanged for browsers. Markdown sources are in the zip under `_md/`.
2. Unknown public URLs return a real 404, in HTML or Markdown (`404.html`, `_md/404.md`). They currently redirect to `/login`.
3. Absolute canonical URLs on `https://setkord.com`.
4. Organization and WebSite JSON-LD on the home page, Organization on About and Contact, BreadcrumbList on inner pages. Copy from the zip.
5. Keep `robots.txt`, `sitemap.xml` and `llms.txt`. Use `llms.txt` from the zip. There must be no `noindex`. Add no visible links to agent documentation.
6. Beat the Logbook must keep the corrected App Store wording, with no waitlist.

## Known issues in the redesign

- Mobile LCP is about 3.8-5.2 s, mainly the hero headline (`.skh-line`) waiting on the intro animation. Paint the text immediately and keep the motion.
- The logo is 173 KB for a 32px-high image. Fix its size and remove priority loading from it.
- Remove preloads for fonts that are not used.
- Serve card-sized blog images; the blog index is 2.7 MB.
- Blog cards should be `h2`, not `h3`.
- FAQ dots are 8x8px; make the targets at least 24x24.
- Make scrolling tables keyboard-focusable.
- Name empty table headers.
- Fix the `.skh-pill` contrast.
- Put the buy bar inside a landmark.
- Investigate why `/contact` is slower on mobile.

## Current production issues

- Cloudflare Web Analytics is blocked by the CSP, causing a console error. Remove it or allow it; ask the owner which.
- Cloudflare Email Obfuscation causes React hydration errors. Turn it off.
- Remove duplicate HSTS, Referrer-Policy and X-Content-Type-Options headers.
- Stop setting auth cookies on anonymous public pages.
- Load Turnstile on form interaction, not page load.

## Owner decisions

Do not change Privacy or Terms wording without owner approval. Raise these with the owner:

1. Privacy says the web uses a single essential session cookie, but live pages set two Auth.js cookies for anonymous visitors.
2. If Cloudflare Web Analytics stays on, Privacy should cover it.
3. Privacy describes the company as both "registered in the United Kingdom" and "England and Wales".
4. Confirm the registered address and hello@setkord.com are acceptable in structured data.

## Do not

Publish a placeholder OpenAPI or MCP endpoint. Setkord has no public API.

## Before asking for approval

Test on staging: Lighthouse on mobile and desktop, axe, and sign-in, web app and contact form checks. Report the results honestly. After deployment, rescan setkord.com on https://is-agentic.com.
