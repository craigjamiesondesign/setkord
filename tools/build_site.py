"""Builds every page other than the home page into docs/ from the original capture in src/capture/.

The original pages are never modified. Each page goes through the same shell as the home page
(common.py), so the whole site shares the header, top bar, back-to-top button, glow, lines,
type sizes, hover transitions and the black-start, in-focus, one-after-another reveals.

Every page ends on the home page's closing call to action, with the same headline entrance and glow.
The blog index also gets its "Load more" posts, built from the post list the original page carries,
and its search.

Run through tools/build.py, which builds the whole site.
"""
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import add_shell, closing_cta, strip_runtime, tag_reveals  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "src" / "capture"
OUT = ROOT / "docs"


def blog_load_more(src, out):
    """Add the posts the original "Load more" button fetched, hidden, after the first nine."""
    # The original page carries every post in its framework payload (a JSON string inside a script).
    posts = []
    for m in re.finditer(r'\{\\"slug\\":.*?\\"tags\\":\[[^\]]*\]\}', src):
        posts.append(json.loads(json.loads('"' + m.group(0) + '"')))
    shown = re.findall(r'<li><a [^>]*href="/blog/([^"]+)"', out)
    template = re.search(r'<li><a [^>]*href="/blog/[^"]+".*?</a></li>', out, re.S).group(0)
    first = shown[0]
    t_cover = re.search(r'src="(/blog/attachments/[^"]+)"', template).group(1)
    t_date = re.search(r'tabular-nums text-site-text-2">([^<]*)</p>', template).group(1)
    t_title = re.search(r"<h3[^>]*>(.*?)</h3>", template, re.S).group(1)
    t_desc = re.search(r'line-clamp-2 text-site-text-2">(.*?)</p>', template, re.S).group(1)

    cards = []
    for post in posts:
        if post["slug"] in shown:
            continue
        date = datetime.fromisoformat(post["date"].replace("Z", "+00:00"))
        card = (template.replace(f'href="/blog/{first}"', f'href="/blog/{post["slug"]}"')
                .replace(t_cover, post.get("cover") or t_cover)
                .replace(f'>{t_date}</p>', f'>{date.day} {date:%B %Y}</p>', 1)
                .replace(f'>{t_title}</h3>', f'>{html.escape(post["title"])}</h3>', 1)
                .replace(f'>{t_desc}</p>', f'>{html.escape(post["description"])}</p>', 1))
        cards.append(card.replace("<li>", "<li data-sk-later hidden>", 1))

    list_end = out.find("</ul>", out.find(template))
    out = out[:list_end] + "".join(cards) + out[list_end:]
    more = '<div class="mt-14 flex justify-center"><button type="button" class="'
    assert out.count(more) == 1
    out = out.replace(more, '<div class="mt-14 flex justify-center"><button type="button" data-sk-more class="', 1)

    # Search: the original filters every post by title, description and tags as you type
    # (motion.js setupBlog). Each card carries its searchable text.
    for post in posts:
        q = html.escape("\n".join([post["title"], post["description"], *post["tags"]]).lower(), quote=True)
        pat = re.compile(r'<li( data-sk-later hidden)?><a ([^>]*)href="/blog/%s"' % re.escape(post["slug"]))
        assert len(pat.findall(out)) == 1, post["slug"]
        out = pat.sub(lambda m: f'<li data-sk-q="{q}"{m.group(1) or ""}><a {m.group(2)}href="/blog/{post["slug"]}"', out, 1)
    search = '<input type="search" '
    assert out.count(search) == 1
    out = out.replace(search, '<input type="search" data-sk-search ', 1)
    none = ('<div data-sk-none hidden role="status" class="flex flex-col items-start gap-4">'
            '<p class="font-site-body text-base leading-6 text-site-text-2">No posts match “<span data-sk-term></span>”.</p>'
            '<button type="button" data-sk-clear class="inline-flex cursor-pointer items-center justify-center gap-2 '
            'whitespace-nowrap rounded-[14px] border font-site-body font-semibold no-underline outline-none '
            'focus-visible:ring-2 focus-visible:ring-site-gold focus-visible:ring-offset-2 focus-visible:ring-offset-site-bg '
            'h-12 px-5 text-[0.9375rem] border-site-border-strong bg-transparent text-site-text hover:border-site-text-2">'
            'Clear search</button></div>')
    list_at = out.find('<ul class="grid grid-cols-1 gap-x-8')
    return out[:list_at] + none + out[list_at:]


# The closing call to action, exactly as the original site builds it on the home page.
home = (SITE / "index.html").read_text()
cta_at = home.rfind("<section", 0, home.find("Log your first set"))
CTA = home[cta_at:home.find("</section>", cta_at) + len("</section>")]

def sign_in_preview(kb):
    """The header's Sign in link points at /login, which needs the live service. The preview gets a
    plain page in the site's own layout (built from the knowledge-base page) explaining that."""
    out = kb.replace("<title>Knowledge base - Setkord</title>", "<title>Sign in - Setkord</title>", 1)
    out = out.replace(">Help centre</a></div>", ">Home</a></div>", 1).replace('href="/help"><svg', 'href="/"><svg', 1)
    out = out.replace(">Knowledge base</h1>", ">Sign in</h1>", 1)
    out = out.replace(">Quick answers to the questions we hear most.</p>", ">Your Setkord account lives on setkord.com.</p>", 1)
    note = re.search(r'<div class="border-t border-site-border pt-6">.*?</div>', out, re.S).group(0)
    return out.replace(note, (
        '<div class="border-t border-site-border pt-6"><p class="font-semibold">Not available in this preview</p>'
        '<p class="font-site-body text-base leading-6 mt-1 text-site-text-2">Signing in and account pages need the live '
        'Setkord service, so they don\'t work in this design preview. You can still '
        '<a class="rounded text-site-gold underline underline-offset-2 outline-none hover:text-site-gold-hover '
        'focus-visible:ring-2 focus-visible:ring-site-gold" href="/help">visit the help centre</a>.</p></div>'), 1)


pages = [p for p in SITE.rglob("index.html") if "_next" not in p.parts and p.parent != SITE]
for page in sorted(pages):
    rel = page.relative_to(SITE)
    src = page.read_text()
    out = strip_runtime(src)
    if rel.as_posix() == "blog/index.html":
        out = blog_load_more(src, out)
    out = closing_cta(out, CTA)
    out = tag_reveals(add_shell(out), skip=("sk-final",))
    (OUT / rel).write_text(out)
    print("wrote", (OUT / rel).relative_to(ROOT))
    if rel.as_posix() == "help/kb/index.html":
        login = tag_reveals(add_shell(closing_cta(strip_runtime(sign_in_preview(src)), CTA)), skip=("sk-final",))
        (OUT / "login").mkdir(exist_ok=True)
        (OUT / "login/index.html").write_text(login)
        print("wrote docs/login/index.html (sign-in preview)")
