# Site map and interaction notes

Captured on 6 November 2026 from publicly accessible resources at `https://setkord.com/`.

## Main pages

- `/`: product landing page.
- `/features`: detailed feature overview.
- `/blog`: article index.
- `/about`: founder and product story.
- `/contact`: contact options.
- `/help`: help centre landing page.
- `/help/docs`, `/help/docs/getting-started`, `/help/docs/faq`: help articles.
- `/help/kb`: knowledge-base index.
- `/whats-new`: release history.
- `/privacy` and `/terms`: legal pages.
- `/blog/*`: 36 captured article pages. See `manifest.json` for the complete URL-to-file list.

## Observed interactions

- Responsive header navigation, including a compact mobile menu.
- Homepage weight and rep controls with a simulated “Log set” action.
- Homepage FAQ accordion.
- Contact form fields and topic selector.
- Internal page navigation and article links.
- External calls to action for the App Store, Instagram and Spotify.
- Contact email links which open the visitor's mail application.

## Capture boundaries

- The capture contains the public, deployed HTML, minified CSS and JavaScript, fonts, images, icons, sitemap and web-app manifest. It does not contain the private source repository, unminified React components, build configuration or server code.
- Next.js image optimisation is generated dynamically by the live server. The local pages use the captured original image files instead, so no optimisation server is required.
- Next.js client-side routing data is server-generated. Direct local page URLs work, but some framework prefetch or route transitions may request live-only data. If that happens, refresh the destination URL to load its mirrored HTML file.
- The deployed JavaScript also checks a live Auth.js session endpoint. A static server cannot provide that JSON response, so the local console records an authentication error. Public pages and their interactions continue to render, but sign-in and account areas are not available offline.
- The contact form posts to the live `/api/contact` endpoint and uses Cloudflare Turnstile. Its fields and layout are present locally, but submission and the third-party challenge require the live service and were not exercised.
- App Store, Instagram and Spotify content is external and was not copied. Email actions are preserved as links but were not exercised.
- No authenticated, private, form-submitted or app-only data was accessed.
