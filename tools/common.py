"""Shared page transforms for the Setkord redesign prototype.

Every page (home and the rest of the site) goes through the same shell so it reads as one site:
- the Next.js runtime is removed (the motion layer and small scripts replace what it did),
- the header gets the signed-out "Sign in" link, the buy bar and back-to-top button are added,
- one shared glow sits behind the page,
- content blocks are tagged so they reveal one after another as they come into focus,
- the motion stylesheet and scripts are linked, with a boot script so the first frame is black.
"""
import re
from html.parser import HTMLParser

SIGNIN = '<a class="inline-flex h-11 items-center px-1 text-[0.9375rem] font-semibold rounded outline-none focus-visible:ring-2 focus-visible:ring-site-gold text-site-gold hover:text-site-gold-hover" href="/login?callbackUrl=/app/account">Sign in</a>'

BUYBAR = """<div class="sk-buybar" data-buybar><div class="sk-buybar-inner mx-auto flex w-full max-w-[1216px] items-center justify-between gap-3 px-5 md:px-8"><a href="#main-content" class="sk-buybar-logo" aria-label="Setkord"><img src="/images/setkord-logo-trim.png" alt="" width="1475" height="325" decoding="async"/></a><a href="https://apps.apple.com/app/id6799150529" target="_blank" rel="noopener noreferrer" class="sk-buybar-cta rounded-full bg-site-gold px-4 py-1.5 text-sm font-semibold text-site-on-gold">Download free</a></div></div>"""

TOTOP = '<button type="button" class="sk-top" data-totop aria-label="Back to top" tabindex="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg></button>'

# Opt into the motion layout before first paint; fall back to the static layout if motion.js never arrives.
BOOT = (
    "<script>(function(d){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;"
    # Always start at the top so the opening sequence plays from the beginning on reload.
    "if('scrollRestoration' in history)history.scrollRestoration='manual';"
    "d.classList.add('sk-motion');setTimeout(function(){if(!d.classList.contains('sk-ready'))d.classList.remove('sk-motion')},4000)})(document.documentElement)</script>"
)
HEAD = (
    BOOT
    + '<link rel="stylesheet" href="/motion/motion.css"/>'
    '<script src="/motion/vendor/gsap.min.js" defer></script>'
    '<script src="/motion/vendor/ScrollTrigger.min.js" defer></script>'
    '<script src="/motion/motion.js" defer></script>'
)


def strip_runtime(out):
    """Remove the Next.js runtime: script tags (keep JSON-LD), script preloads and stale image preloads.
    Cloudflare-protected email links are decoded at the same time, since their script goes too."""
    out = decode_emails(out)
    out = re.sub(r'<script(?![^>]*application/ld\+json)[^>]*>.*?</script>', "", out, flags=re.S)
    out = re.sub(r'<link rel="preload" as="script"[^>]*/>', "", out)
    out = re.sub(r'<link rel="preload" as="image"[^>]*/>', "", out)
    return out


def _cf_decode(hexed):
    key = int(hexed[:2], 16)
    return "".join(chr(int(hexed[i:i + 2], 16) ^ key) for i in range(2, len(hexed), 2))


def decode_emails(out):
    """The live site hides email addresses behind Cloudflare's email protection, which only its
    server can decode. Restore them as the plain mailto links they stand for."""
    # Two forms: the address in a span inside the link, or the link itself carrying the code.
    out = re.sub(r'<a href="/cdn-cgi/l/email-protection[^"]*"([^>]*)><span class="__cf_email__" data-cfemail="([0-9a-f]+)">[^<]*</span></a>',
                 lambda m: f'<a href="mailto:{_cf_decode(m.group(2))}"{m.group(1)}>{_cf_decode(m.group(2))}</a>', out)
    out = re.sub(r'<a href="/cdn-cgi/l/email-protection[^"]*" class="__cf_email__" data-cfemail="([0-9a-f]+)">[^<]*</a>',
                 lambda m: f'<a href="mailto:{_cf_decode(m.group(1))}">{_cf_decode(m.group(1))}</a>', out)
    return out


def add_shell(out):
    # One shared glow. The page wrapper is isolated so the glow can sit behind the content but
    # still above the wrapper's own background (see .sk-glow in motion.css).
    # The page wrapper: "min-h-dvh bg-site-bg ..." on home, "flex min-h-dvh flex-col bg-site-bg ..." elsewhere.
    wrap = re.search(r'class="((?:flex )?min-h-dvh (?:flex-col )?bg-site-bg)', out)
    assert wrap, "page wrapper not found"
    out = out[:wrap.start(1)] + "sk-page " + out[wrap.start(1):]
    wrap_end = out.find(">", out.find('class="sk-page')) + 1
    out = out[:wrap_end] + '<div class="sk-glow" aria-hidden="true"></div>' + out[wrap_end:]

    # Sign in: the original header adds this client-side after checking the login session
    # (signed-out state). Without the React runtime it is restored as the plain signed-out link.
    nav_at = out.find('<nav aria-label="Main"')
    nav_end = out.find("</nav>", nav_at)
    out = out[:nav_end] + SIGNIN + out[nav_end:]

    out = out.replace("</header>", "</header>" + BUYBAR + TOTOP, 1)
    return out.replace("</head>", HEAD + "</head>", 1)


def closing_cta(out, cta_html):
    """Every page ends on the same "Log your first set today" section as the home page, with the
    home page's headline entrance and glow (motion.js setupFinal / setupGlow look for .sk-final).
    Pages that already have it get it marked up; pages without it get the original component."""
    if "Log your first set" not in out[out.find("<main"):out.find("</main>")]:
        out = out.replace("</main>", cta_html + "</main>", 1)
    at = out.rfind("<section", 0, out.find("Log your first set"))
    section = out[at:out.find("</section>", at)]
    if "sk-final" not in section[:200]:
        out = out[:at] + out[at:].replace('<section class="', '<section class="sk-sec sk-final ', 1)
    # The headline gets the word-by-word entrance, so drop the generic fade on its block.
    out = out[:at] + out[at:].replace(
        '<div style="--reveal-delay:0s" class="reveal flex flex-col items-center text-center">',
        '<div class="flex flex-col items-center text-center">', 1)
    return out


# ---------- Reveal tagging ----------
# Blocks that reveal on their own. A card-like element (rounded with a border or panel background)
# reveals as one piece; otherwise each heading, paragraph, list item, image and so on is its own beat.
BLOCK_TAGS = {"h2", "h3", "h4", "h5", "h6", "p", "li", "img", "picture", "figure", "blockquote",
              "table", "pre", "details", "form", "hr", "nav", "video", "dl"}
VOID = {"img", "hr", "br", "input", "source", "meta", "link", "wbr", "col", "area", "embed", "track"}


def _is_card(tag, cls):
    # Cards and panels, and buttons or button-styled links, each reveal as one piece.
    return tag in {"a", "article", "div", "li", "aside", "button"} and "rounded" in cls and (
        re.search(r"(^|\s)border(\s|$)", cls) or "bg-site-panel" in cls or "bg-site-row" in cls
        or "bg-site-bg-2" in cls or "bg-site-gold" in cls)


class _Tagger(HTMLParser):
    def __init__(self, skip):
        super().__init__(convert_charrefs=False)
        self.skip = skip          # class prefixes whose whole subtree is animated elsewhere
        self.stack = []           # (tag, covered): covered = already revealed by an ancestor
        self.inserts = []         # (line, col, tag, attr)
        self.in_main = 0
        self.h1 = False

    def _covered(self):
        return bool(self.stack) and self.stack[-1][1]

    def handle_starttag(self, tag, attrs):
        self._start(tag, attrs, void=tag in VOID)

    def handle_startendtag(self, tag, attrs):
        self._start(tag, attrs, void=True)

    def _start(self, tag, attrs, void):
        a = dict(attrs)
        cls = a.get("class") or ""
        if tag == "main":
            self.in_main += 1
        covered = self._covered()
        if tag == "h1" and self.in_main and not self.h1 and not any(
                re.search(r"(^|\s)" + re.escape(p), cls) for p in self.skip):
            # The page headline rises word by word in the intro, even inside a reveal group.
            self.h1 = True
            self.inserts.append((*self.getpos(), tag, "data-sk-h1"))
            covered = True
        elif not covered and self.in_main:
            if any(re.search(r"(^|\s)" + re.escape(p), cls) for p in self.skip) or "reveal" in cls.split() \
                    or "reveal-group" in cls.split():
                covered = True                       # revealed by its own animation
            elif _is_card(tag, cls) or tag in BLOCK_TAGS:
                self.inserts.append((*self.getpos(), tag, "data-sk"))
                covered = True
        if not void:
            self.stack.append((tag, covered))

    def handle_endtag(self, tag):
        if tag == "main":
            self.in_main -= 1
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break


def tag_reveals(out, skip=()):
    """Add data-sk to content blocks inside <main> (and data-sk-h1 to the page headline)."""
    p = _Tagger(skip)
    p.feed(out)
    p.close()
    starts = [0]                                     # HTMLParser counts lines by "\n" only
    i = out.find("\n")
    while i != -1:
        starts.append(i + 1)
        i = out.find("\n", i + 1)
    for line, col, tag, attr in sorted(p.inserts, reverse=True):
        at = starts[line - 1] + col + 1 + len(tag)   # just after "<tag"
        out = out[:at] + " " + attr + out[at:]
    return out
