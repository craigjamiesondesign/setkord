"""Builds the home page (docs/index.html) from the original capture in src/capture/index.html.

The original page is never modified. This script:
- strips the Next.js runtime scripts (so React can't overwrite the new markup on hydration),
- replaces the hero and the "Built for the seconds between sets" section with
  scroll-driven versions,
- adds the motion stylesheet and scripts (GSAP + ScrollTrigger).

Run through tools/build.py, which builds the whole site.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import add_shell, strip_runtime, tag_reveals  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
src = (ROOT / "src/capture/index.html").read_text()

hero_start = src.find('<section class="relative overflow-hidden pt-14 md:pt-24">')
hero_end = src.find("</section>", hero_start) + len("</section>")
sec3_start = src.rfind("<section", 0, src.find("No signal"))
hero = src[hero_start:hero_end]
sec2 = src[hero_end:sec3_start]

cta = re.search(r'<a href="https://apps.apple.com[^>]*>.*?</a>', hero, re.S).group(0)
cta = cta.replace(" mt-9", "")
callouts = re.findall(r'<li class="hero-rise absolute[^>]*>(.*?)</li>', hero, re.S)
chips = re.search(r'<ul class="mx-auto mt-10 grid.*?</ul>', hero, re.S).group(0)
chips = chips.replace('<ul class="', '<ul class="skh-chips ', 1)

# Callout placement around the phone: (side, top %)
placement = [("left", 30), ("left", 60), ("right", 40), ("right", 70)]
callout_html = "".join(
    f'<li class="skh-callout" data-side="{side}" style="top:{top}%">{inner}</li>'
    for (side, top), inner in zip(placement, callouts)
)

new_hero = f"""<section class="skh" id="hero" aria-labelledby="hero-title">
<div class="skh-stage">
<div class="skh-copy">
<div class="skh-pillwrap"><span class="skh-pill inline-flex min-h-[24px] items-center justify-center whitespace-nowrap rounded-full px-3 py-1 font-site-body text-sm font-medium bg-site-gold-tint text-site-gold">Free on iPhone</span></div>
<h1 id="hero-title" class="skh-title font-site-heading font-extrabold uppercase [font-stretch:68%]"><span class="skh-line">Log every lift in two taps.</span><span class="skh-line text-site-gold">Even with no signal.</span></h1>
<div class="skh-sub">
<p class="font-site-body max-w-[36rem] text-lg leading-7 text-site-text-2 md:text-xl md:leading-8">Your last weight and reps are already filled in, the rest timer starts itself and new PRs show up the moment you hit them, all on your iPhone with or without a connection.</p>
<div class="skh-cta">{cta}<p class="font-site-body text-sm leading-5 text-site-text-2">Free to download. iPhone, iOS 17 or later.</p></div>
</div>
</div>
<div class="skh-device">
<img class="skh-phone" alt="Logging Bulgarian split squats in Setkord: last session&#x27;s 28 kg × 8 pre-filled, two sets ticked off and a gold Log set button" fetchpriority="high" width="800" height="1447" decoding="async" src="/images/phones/phone-workout.webp"/>
<ul class="skh-callouts">{callout_html}</ul>
</div>
<div class="skh-scrollhint" aria-hidden="true"><span></span></div>
</div>
{chips}
</section>"""

check = '<span class="sk2-check grid h-6 w-6 place-items-center rounded-full bg-site-success text-site-on-gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5"><path d="M20 6 9 17l-5-5"></path></svg></span>'
minus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4"><path d="M5 12h14"></path></svg>'
plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>'
timer_icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-3.5 w-3.5"><line x1="10" x2="14" y1="2" y2="2"></line><line x1="12" x2="15" y1="14" y2="11"></line><circle cx="12" cy="14" r="8"></circle></svg>'
stepbtn = 'class="sk2-btn grid h-9 w-9 place-items-center rounded-full text-site-text outline-none focus-visible:ring-2 focus-visible:ring-site-gold"'


def row(n, kg, reps, last_kg, last_reps, extra_cls=""):
    return (
        f'<li class="sk2-row {extra_cls}"><div class="sk2-row-inner flex items-center gap-3 rounded-2xl bg-site-row px-3 py-2.5">'
        f'<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#14130f] font-site-mono text-sm">{n}</span>'
        f'<span class="min-w-0 flex-1"><span class="block font-site-mono text-[15px] tabular-nums"><span data-row-kg>{kg}</span> kg × <span data-row-reps>{reps}</span></span>'
        f'<span class="block font-site-mono text-xs text-site-text-2">last · {last_kg} kg × {last_reps}</span></span>'
        f'<span class="sk2-pr" aria-label="New personal record">PR</span>{check}</div></li>'
    )


def stepper(label, key, value):
    return (
        f'<div class="flex flex-col items-center gap-2 rounded-2xl border border-site-border-strong px-2 py-3">'
        f'<span class="text-[11px] font-semibold text-site-text-2">{label.upper()}</span>'
        f'<div class="flex w-full items-center justify-between">'
        f'<button type="button" aria-label="Decrease {label}" data-act="{key}-" {stepbtn}>{minus}</button>'
        f'<span class="sk2-val font-site-mono text-2xl font-medium tabular-nums" data-{key} aria-live="polite">{value}</span>'
        f'<button type="button" aria-label="Increase {label}" data-act="{key}+" {stepbtn}>{plus}</button>'
        f"</div></div>"
    )


steps = [
    "Weight x reps, bodyweight or timed sets",
    "Warm-ups never inflate your volume or steal a PR",
    "Supersets and giant sets stay as fast as a straight set",
]
steps_html = "".join(
    f'<li class="sk2-step flex items-center gap-4 border-t border-site-border py-4 text-base text-site-text" data-step="{i}"><span aria-hidden="true" class="sk2-dot h-2 w-2 shrink-0 rounded-full bg-site-gold"></span>{t}</li>'
    for i, t in enumerate(steps)
)

new_sec2 = f"""<section class="sk2" id="log-demo" aria-labelledby="sk2-title">
<div class="sk2-inner mx-auto grid w-full max-w-[1192px] items-center gap-14 px-5 md:max-w-[1216px] md:px-8 lg:grid-cols-[1fr_440px] lg:gap-24">
<div class="sk2-copy max-w-xl">
<h2 id="sk2-title" class="sk2-title font-site-heading text-balance font-extrabold uppercase [font-stretch:72%] text-[2.5rem] leading-[0.95] tracking-[-0.01em] md:text-[4rem] md:leading-[0.92] md:tracking-[-0.015em]">Built for the seconds between sets</h2>
<p class="sk2-lede font-site-body mt-6 text-lg leading-7 text-site-text-2">Two taps and the set is logged, with your last session&#x27;s numbers already in place and the rest timer counting down. Warm-up sets, a plate calculator and per-set notes are there when you want them and out of the way when you don&#x27;t.</p>
<ul class="sk2-steps mt-10 flex flex-col">{steps_html}</ul>
</div>
<div class="sk2-cardwrap flex justify-center lg:justify-end">
<div class="sk2-card w-full max-w-[440px] rounded-[22px] border border-site-panel-border bg-site-panel p-5 text-site-text">
<div class="flex items-start justify-between gap-4">
<div><p class="text-lg font-semibold">Bulgarian Split Squat</p><p class="mt-0.5 font-site-mono text-sm text-site-text-2">Last · 28 kg × 8</p></div>
<div class="sk2-timer flex items-center gap-1.5 rounded-full px-3 py-1.5 font-site-mono text-sm tabular-nums" role="timer" aria-label="Rest timer">{timer_icon}<span data-timer>1:30</span></div>
</div>
<ol class="sk2-rows mt-5 flex flex-col">{row(1, 28, 8, 28, 9)}{row(2, 28, 9, 28, 8)}{row(3, 30, 9, 28, 9, "is-new")}</ol>
<div class="mt-4 grid grid-cols-2 gap-3">{stepper("kg", "kg", 28)}{stepper("reps", "reps", 9)}</div>
<div class="sk2-actions"><button type="button" class="sk2-log mt-3 h-14 w-full rounded-2xl bg-site-gold text-base font-bold text-site-on-gold outline-none focus-visible:ring-2 focus-visible:ring-site-text focus-visible:ring-offset-2 focus-visible:ring-offset-site-panel" data-log>Log set</button>
<p class="sk2-hint mt-3 text-center text-xs text-site-text-2" data-hint>Keep scrolling to log a set, or try it yourself.</p></div>
</div>
</div>
</div>
</section>"""


out = src[:hero_start] + new_hero + new_sec2 + src[sec3_start:]

# FAQ: replace the accordion with an Apple-style "highlights" slider, one text card per question.
faq_title = out.find("Questions, answered")
faq_start = out.rfind("<section", 0, faq_title)
faq_end = out.find("</section>", faq_title) + len("</section>")
faq = out[faq_start:faq_end]
qas = re.findall(r"<summary[^>]*>(.*?)<svg.*?</summary><div[^>]*>(.*?)</div></details>", faq, re.S)
faq_cards = "".join(
    f'<li class="skf-card" aria-roledescription="slide" aria-label="{i + 1} of {len(qas)}">'
    f'<span class="skf-num font-site-mono">{i + 1:02d}</span>'
    f'<h3 class="skf-q font-site-heading font-extrabold uppercase [font-stretch:72%]">{q.strip()}</h3>'
    f'<p class="skf-a font-site-body">{re.sub(r"<!-- -->", "", a).strip()}</p></li>'
    for i, (q, a) in enumerate(qas)
)
faq_dots = "".join(
    f'<button type="button" class="skf-dot" aria-label="Question {i + 1}" data-faq-dot="{i}"><span></span></button>'
    for i in range(len(qas))
)
play_icon = '<svg class="skf-i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>'
pause_icon = '<svg class="skf-i-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor"/></svg>'
replay_icon = '<svg class="skf-i-replay" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>'
help_link = re.search(r'<a [^>]*href="/help">Visit the help centre</a>', faq).group(0).replace(" mt-8", "")
new_faq = f"""<section class="skf" id="faq" aria-labelledby="skf-title" aria-roledescription="carousel">
<div class="skf-head mx-auto flex w-full max-w-[1192px] flex-wrap items-end justify-between gap-6 px-5 md:max-w-[1216px] md:px-8">
<h2 id="skf-title" class="skf-title reveal font-site-heading text-balance font-extrabold uppercase [font-stretch:72%] text-[2.5rem] leading-[0.95] tracking-[-0.01em] md:text-[4rem] md:leading-[0.92] md:tracking-[-0.015em]">Questions, answered</h2>
<div class="skf-help reveal" style="--reveal-delay:.15s">{help_link}</div>
</div>
<ul class="skf-track reveal-group" style="--reveal-delay:.3s" data-faq-track>{faq_cards}</ul>
<div class="skf-controls reveal" style="--reveal-delay:.9s">
<div class="skf-dots">{faq_dots}</div>
<button type="button" class="skf-play" data-faq-play aria-label="Pause">{pause_icon}{play_icon}{replay_icon}</button>
</div>
</section>"""
out = out[:faq_start] + new_faq + out[faq_end:]

out = strip_runtime(out)

# Every section after the log demo gets its own screen (see .sk-sec in motion.css).
out = re.sub(r'<section class="(?!skh|sk2)', '<section class="sk-sec ', out)
cta_at = out.rfind('<section class="sk-sec ', 0, out.find("Log your first set"))
out = out[:cta_at] + out[cta_at:].replace('class="sk-sec ', 'class="sk-sec sk-final ', 1)
# The closing headline gets the hero's word-by-word entrance (motion.js), so drop the generic fade on its block.
final_reveal = '<div style="--reveal-delay:0s" class="reveal flex flex-col items-center text-center">'
assert out.count(final_reveal, cta_at) == 1
out = out[:cta_at] + out[cta_at:].replace(final_reveal, '<div class="flex flex-col items-center text-center">', 1)

# "Watch yourself get stronger": the 1RM chart's line draws, its number counts up and the PR card
# follows, all played by motion.js (playChart) instead of the original's React state.
chart_line = ' class="transition-[stroke-dashoffset] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" style="stroke-dashoffset:1"'
chart_num = '<p class="mt-1 font-site-mono text-4xl font-medium tabular-nums">30.0<span'
pr_wrap = '<div class="transition-[opacity,transform] delay-[1100ms] duration-500 ease-out motion-reduce:transition-none translate-y-3 opacity-0"><div class="'
for s in (chart_line, chart_num, pr_wrap):
    assert out.count(s) == 1, s
out = out.replace(chart_line, ' data-sk-line style="stroke-dashoffset:1"')
out = out.replace(chart_num, chart_num.replace("<p ", '<p data-sk-count="36.4" '))
out = out.replace(pr_wrap, '<div><div data-sk-pr class="')

out = add_shell(out)
# Sections the home page animates itself (hero, log demo, FAQ slider, closing CTA) are skipped.
out = tag_reveals(out, skip=("skh", "sk2", "skf", "sk-final"))

(ROOT / "docs/index.html").write_text(out)
print("wrote docs/index.html")
