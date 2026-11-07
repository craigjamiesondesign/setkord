/* Setkord redesign prototype: scroll-driven motion.
   Requires GSAP + ScrollTrigger for the motion layer; everything else
   (mobile menu, reveals, the log demo controls) works without them. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motion = !reduce && window.gsap && window.ScrollTrigger;

  if (!motion) root.classList.remove("sk-motion");

  var home = !!document.querySelector(".skh-stage");

  setupMobileMenu();
  var demo = home ? setupLogDemo() : null;
  setupFaq();
  setupToTop();
  setupContactForm();
  setupLoadMore();

  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add("sk-motion");
    if (home) {
      splitWords(document.querySelectorAll(".skh-line, .sk2-title"));
      setupHero();
      setupLogDemoScroll(demo);
    } else {
      setupPageIntro();
    }
    setupFinal();
    setupGlow();
    setupBuyBar();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  setupReveals();
  root.classList.add("sk-ready");

  /* ---------------------------------------------------------------- */

  function splitWords(nodes) {
    nodes.forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w) {
        return '<span class="sk-word"><span>' + w + "</span></span>";
      }).join(" ");
    });
  }

  // Split an element into masked words (like splitWords) while keeping inline elements such as
  // a gold span intact. Returns the inner word spans in reading order.
  function splitRich(el) {
    var words = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      var parts = node.textContent.trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return;
      var html = parts.map(function (w) { return '<span class="sk-word"><span>' + w + "</span></span>"; }).join(" ");
      if (node.nodeType === 1) {
        node.innerHTML = html;
      } else {
        var tmp = document.createElement("span");
        tmp.innerHTML = (/^\s/.test(node.textContent) ? " " : "") + html + (/\s$/.test(node.textContent) ? " " : "");
        while (tmp.firstChild) el.insertBefore(tmp.firstChild, node);
        el.removeChild(node);
      }
    });
    return Array.prototype.slice.call(el.querySelectorAll(".sk-word > span"));
  }

  // Every page opens the same way: black, then the logo, the navigation and the header rule.
  var RULE = "rgba(255, 255, 255, 0.13)"; // matches .border-site-border in motion.css
  function headerParts() {
    var header = document.querySelector("header");
    return {
      header: header,
      logo: header.querySelector('a[aria-label="Setkord home"]'),
      nav: header.querySelectorAll('nav[aria-label="Main"] a, [aria-controls="mobile-menu"]')
    };
  }
  function headerIntro() {
    var h = headerParts();
    return gsap.timeline({ defaults: { ease: "expo.out" }, delay: .35 })
      .fromTo(h.logo, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .7 })
      .fromTo(h.nav, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .5, stagger: .08 }, ">-.25")
      .to(h.header, { borderBottomColor: RULE, duration: .5, ease: "power1.out" }, ">-.2");
  }
  function showHeader() {
    var h = headerParts();
    gsap.set([h.logo, h.nav], { opacity: 1 });
    gsap.set(h.header, { borderBottomColor: RULE });
  }

  // Other pages: after the header, the page headline rises word by word like the hero's.
  // Everything else on the page then reveals in order as it comes into focus (setupReveals).
  function setupPageIntro() {
    var h1 = document.querySelector("[data-sk-h1]");
    var words = h1 ? splitRich(h1) : [];
    if (h1) { gsap.set(words, { yPercent: 110 }); gsap.set(h1, { opacity: 1 }); }
    if (window.scrollY < 10) {
      window.skIntro = headerIntro();
      if (words.length) window.skIntro.to(words, { yPercent: 0, duration: .8, stagger: .06 }, ">-.15");
      window.skIntro.call(function () { root.classList.add("sk-glow-on"); });
    } else {
      showHeader();
      gsap.set(words, { yPercent: 0 });
      root.classList.add("sk-glow-on");
    }
  }

  function setupHero() {
    var stage = document.querySelector(".skh-stage");
    var copy = stage.querySelector(".skh-copy");
    var title = stage.querySelector(".skh-title");
    var pill = stage.querySelector(".skh-pill");
    var pillWrap = stage.querySelector(".skh-pillwrap");
    var sub = stage.querySelector(".skh-sub");
    var device = stage.querySelector(".skh-device");
    var hint = stage.querySelector(".skh-scrollhint");
    var callouts = gsap.utils.toArray(".skh-callout");
    var lines = title.querySelectorAll(".skh-line");
    var lede = sub.querySelector("p");
    var cta = sub.querySelector(".skh-cta a");
    var small = sub.querySelector(".skh-cta p");

    var heroWords = title.querySelectorAll(".sk-word > span");

    // Load intro. The stylesheet starts all of this hidden; each beat reveals from nothing:
    // logo, navigation, header rule, pill, headline, paragraph, button, small print, scroll hint.
    // The phone is not part of it; it only arrives once you scroll.
    gsap.set(heroWords, { yPercent: 110 });
    gsap.set(title, { opacity: 1 });
    if (window.scrollY < 10) {
      window.skIntro = headerIntro() // exposed so the intro can be replayed from the console
        .fromTo(pill, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6 }, ">-.1")
        .to(lines[0].querySelectorAll(".sk-word > span"), { yPercent: 0, duration: .8, stagger: .07 }, ">-.15")
        .to(lines[1].querySelectorAll(".sk-word > span"), { yPercent: 0, duration: .8, stagger: .07 }, ">-.35")
        .fromTo(lede, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7 }, ">-.2")
        .fromTo(cta, { opacity: 0, y: 16, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .6 }, ">-.25")
        .fromTo(small, { opacity: 0 }, { opacity: 1, duration: .5 }, ">-.2")
        .call(function () { hint.classList.add("is-shown"); }, null, ">-.1")
        .call(function () { root.classList.add("sk-glow-on"); }, null, "<");
    } else {
      // Arrived mid-page: show the top as it is, no intro.
      showHeader();
      gsap.set([pill, lede, cta, small], { opacity: 1 });
      gsap.set(heroWords, { yPercent: 0 });
      hint.classList.add("is-shown");
      root.classList.add("sk-glow-on");
    }

    // The scroll hint leaves as soon as scrolling starts (a class, so it never fights the intro).
    ScrollTrigger.create({
      trigger: stage, start: "top+=10 top",
      onEnter: function () { hint.classList.add("is-hidden"); },
      onLeaveBack: function () { hint.classList.remove("is-hidden"); }
    });

    var mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)" }, function (ctx) {
      var desktop = ctx.conditions.desktop;
      var endScale = desktop ? .4 : .6;
      var vh = function () { return stage.offsetHeight; };
      var titleTop = function () { return title.offsetTop + copy.offsetTop; };
      var titleEndTop = function () { return vh() * (desktop ? .06 : .08); };
      var deviceEndTop = device.skEndTop = function () { // also read by the shared glow
        return titleEndTop() + title.offsetHeight * endScale + vh() * .035;
      };

      // Scroll sequence. Each beat finishes before the next one starts:
      //   1. copy below the headline leaves   2. pill leaves
      //   3. headline shrinks to the top      4. phone fades up into place (glow follows)
      //   5. callouts arrive one at a time    6. short hold, then the pin releases
      var tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: desktop ? "+=260%" : "+=180%",
          pin: true,
          scrub: 1.6, // generous catch-up so the headline glides to a stop rather than tracking the wheel
          invalidateOnRefresh: true
        }
      });

      tl.to(sub, { opacity: 0, y: -30, duration: .1, ease: "power1.in" }, 0)
        .to(pillWrap, { opacity: 0, y: -16, duration: .05, ease: "power1.in" }, .1)
        .to(title, {
          scale: endScale,
          y: function () { return titleEndTop() - titleTop(); },
          duration: .32, ease: "power1.inOut" // long and soft at both ends; starts as the copy below it fades
        }, .1)
        .fromTo(device,
          { opacity: 0, y: function () { return deviceEndTop() + vh() * .18; } },
          { opacity: 1, y: deviceEndTop, duration: .2, ease: "power3.out" }, .44);

      if (desktop) {
        callouts.forEach(function (c, i) {
          tl.fromTo(c,
            { opacity: 0, scale: .8, x: c.dataset.side === "left" ? 40 : -40 },
            { opacity: 1, scale: 1, x: 0, duration: .06, ease: "back.out(1.6)" },
            .68 + i * .06);
        });
      }
      tl.to({}, { duration: .08 }, .92); // hold before releasing the pin

      return function () { gsap.set([device, callouts, title, pillWrap, sub], { clearProps: "all" }); };
    });

    // Mobile feature chips below the stage: one at a time as they scroll in.
    var chips = gsap.utils.toArray(".skh-chips li");
    if (chips.length) {
      var ctl = gsap.timeline({
        scrollTrigger: { trigger: ".skh-chips", start: "top 90%", end: "bottom 55%", scrub: .5 }
      });
      gsap.set(chips, { opacity: 0, y: 20 });
      chips.forEach(function (c, i) {
        ctl.to(c, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, i * 1.1);
      });
    }
  }

  /* ---------------- Log demo ---------------- */

  // Shared glow: one gradient that is only visible while a download button is hovered or while the
  // hero phone is on screen. It slides between those places rather than appearing in each.
  function setupGlow() {
    var glow = document.querySelector(".sk-glow");
    var heroSub = document.querySelector(".skh-sub");
    var device = document.querySelector(".skh-device");
    var heroBtn = document.querySelector('.skh-cta a[href*="apps.apple.com"]');
    var buttons = document.querySelectorAll('main a[href*="apps.apple.com"]');
    var final = document.querySelector(".sk-final");
    var finalBtn = final && final.querySelector('a[href*="apps.apple.com"]');
    if (!glow) return;

    var slide = { duration: 1.1, ease: "power3.out" };
    var xTo = gsap.quickTo(glow, "x", slide), yTo = gsap.quickTo(glow, "y", slide);
    var oTo = gsap.quickTo(glow, "opacity", { duration: .6, ease: "power1.out" });
    var sxTo = gsap.quickTo(glow, "scaleX", slide), syTo = gsap.quickTo(glow, "scaleY", slide); // quickTo takes single properties, not the scale shorthand
    var hover = null, last = [];

    function centre(el, fy) {
      var r = el.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height * fy];
    }
    function target() {
      // The hero button fades out on scroll; once it's gone, hovering where it was does nothing.
      if (hover && (hover !== heroBtn || +getComputedStyle(heroSub).opacity > .5)) return centre(hover, .5).concat(.45, 1);
      if (final && finalBtn && final.getBoundingClientRect().top < innerHeight * .7) return [innerWidth / 2, -innerHeight * .35, 1, 0]; // waits, hidden, above the screen (where the phone went), so hovering the closing button brings it down
      // Pages without the phone: it waits, hidden, below the screen, so a hovered button brings it up.
      if (!device) return [innerWidth / 2, innerHeight * 1.35, 1, 0];
      // Otherwise it goes back under the phone, and only shows as much as the phone does: hidden on
      // the opening screen, appearing as the phone scrolls into view.
      var low = [0, innerHeight * 1.35]; // below the screen, where the phone rises from, so hovering the hero button brings it up
      var o = +getComputedStyle(device).opacity;
      var dev = centre(device, .5);
      return [dev[0], low[1] + (dev[1] - low[1]) * o, 1, o];
    }
    // Checked every frame (after ScrollTrigger has moved the phone), but only retargeted when the target moves.
    function update() {
      var t = target();
      if (Math.abs(t[0] - last[0]) < .5 && Math.abs(t[1] - last[1]) < .5 && t[2] === last[2] && Math.abs(t[3] - last[3]) < .01 && last[4] === root.classList.contains("sk-glow-on")) return;
      last = t.concat(root.classList.contains("sk-glow-on"));
      xTo(t[0]); yTo(t[1]); sxTo(t[2]); syTo(t[2]);
      oTo(root.classList.contains("sk-glow-on") ? t[3] : 0); // stays dark until the opening sequence ends
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      function on() { hover = btn; update(); }
      function off() { if (hover === btn) hover = null; update(); }
      btn.addEventListener("pointerenter", on);
      btn.addEventListener("pointerleave", off);
      btn.addEventListener("focus", on);
      btn.addEventListener("blur", off);
    });
    gsap.ticker.add(update);

    var start = target();
    gsap.set(glow, { x: start[0], y: start[1], scale: start[2], opacity: 0 });
  }

  function setupLogDemo() {
    var section = document.querySelector(".sk2");
    var card = section.querySelector(".sk2-card");
    var kgEl = card.querySelector("[data-kg]");
    var repsEl = card.querySelector("[data-reps]");
    var timerChip = card.querySelector(".sk2-timer");
    var timerEl = card.querySelector("[data-timer]");
    var rowsEl = card.querySelector(".sk2-rows");
    var newRow = card.querySelector(".sk2-row.is-new");
    var logBtn = card.querySelector("[data-log]");
    var steps = section.querySelectorAll(".sk2-step");
    var BEST_E1RM = e1rm(28, 9); // 36.4 kg, matches the progress section
    var countdown = null;

    var state = { kg: 28, reps: 9, logged: false, pr: false, timer: 90, running: false, step: 0 };

    function e1rm(kg, reps) { return kg * (1 + reps / 30); }
    function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function bump(el) { el.classList.remove("is-bumped"); void el.offsetWidth; el.classList.add("is-bumped"); }
    function press(el) {
      el.classList.add("is-pressed");
      setTimeout(function () { el.classList.remove("is-pressed"); }, 220);
    }

    function render() {
      if (kgEl.textContent !== String(state.kg)) { kgEl.textContent = state.kg; bump(kgEl); }
      if (repsEl.textContent !== String(state.reps)) { repsEl.textContent = state.reps; bump(repsEl); }
      newRow.classList.toggle("is-shown", state.logged);
      newRow.classList.toggle("has-pr", state.logged && state.pr);
      timerChip.classList.toggle("is-running", state.running);
      timerEl.textContent = fmt(state.timer);
      steps.forEach(function (li, i) {
        li.classList.toggle("is-active", i === state.step);
        li.classList.toggle("is-done", i < state.step);
      });
    }

    function stopCountdown() { clearInterval(countdown); countdown = null; }
    function startCountdown() {
      stopCountdown();
      state.timer = 90; state.running = true;
      countdown = setInterval(function () {
        state.timer -= 1;
        if (state.timer <= 0) { state.running = false; state.timer = 90; stopCountdown(); }
        render();
      }, 1000);
    }

    function logSet() {
      var isPr = e1rm(state.kg, state.reps) > BEST_E1RM;
      if (!state.logged) {
        newRow.querySelector("[data-row-kg]").textContent = state.kg;
        newRow.querySelector("[data-row-reps]").textContent = state.reps;
        state.logged = true; state.pr = isPr;
      } else {
        // Extra sets logged by hand: add a row (keep the card a sensible height).
        var rows = rowsEl.querySelectorAll(".sk2-row");
        if (rows.length >= 5) rowsEl.removeChild(rows[3]);
        var clone = newRow.cloneNode(true);
        clone.classList.remove("is-shown", "has-pr");
        clone.querySelector("[data-row-kg]").textContent = state.kg;
        clone.querySelector("[data-row-reps]").textContent = state.reps;
        clone.querySelector(".grid.h-8").textContent = rowsEl.children.length + 1;
        clone.dataset.extra = "";
        rowsEl.appendChild(clone);
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          clone.classList.add("is-shown");
          if (isPr) clone.classList.add("has-pr");
        }); });
      }
      if (isPr) BEST_E1RM = e1rm(state.kg, state.reps);
      startCountdown();
      render();
    }

    card.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (btn) {
        api.manual = true;
        var act = btn.dataset.act;
        if (act === "kg+") state.kg += 1;
        if (act === "kg-") state.kg = Math.max(0, state.kg - 1);
        if (act === "reps+") state.reps += 1;
        if (act === "reps-") state.reps = Math.max(1, state.reps - 1);
        render();
        return;
      }
      if (e.target.closest("[data-log]")) { api.manual = true; logSet(); }
    });

    var api = {
      manual: false,
      section: section,
      card: card,
      // Scroll-driven state: discrete beats plus a continuous rest timer.
      setProgress: function (p) {
        if (p < .03 && api.manual) reset();
        if (api.manual) return;
        // Beats: +1 kg, +1 kg, press Log set, set 3 lands + timer starts, PR badge.
        var beat = p < .1 ? 0 : p < .2 ? 1 : p < .3 ? 2 : p < .38 ? 3 : p < .55 ? 4 : 5;
        var prev = api.beat == null ? 0 : api.beat;
        api.beat = beat;
        if (beat !== prev && beat > prev) {
          if (beat === 1 || beat === 2) press(card.querySelector('[data-act="kg+"]'));
          if (beat === 3) press(logBtn);
        }
        state.kg = beat >= 2 ? 30 : beat === 1 ? 29 : 28;
        state.reps = 9;
        if (beat >= 4 && !state.logged) {
          newRow.querySelector("[data-row-kg]").textContent = 30;
          newRow.querySelector("[data-row-reps]").textContent = 9;
        }
        state.logged = beat >= 4;
        state.pr = beat >= 5;
        state.running = beat >= 4;
        state.timer = beat >= 4 ? 90 - (p - .38) / .62 * 50 : 90;
        state.step = p <= 0 ? -1 : beat < 4 ? 0 : p < .75 ? 1 : 2;
        render();
      }
    };

    function reset() {
      api.manual = false;
      stopCountdown();
      rowsEl.querySelectorAll("[data-extra]").forEach(function (r) { r.remove(); });
      BEST_E1RM = e1rm(28, 9);
      state = { kg: 28, reps: 9, logged: false, pr: false, timer: 90, running: false, step: 0 };
    }

    render();
    return api;
  }

  function setupLogDemoScroll(demo) {
    var section = demo.section;
    var title = section.querySelector(".sk2-title");
    var titleWords = title.querySelectorAll(".sk-word > span");
    var lede = section.querySelector(".sk2-lede");
    var steps = section.querySelectorAll(".sk2-step");

    var card = demo.card;
    var cardParts = [
      card.firstElementChild,                       // exercise name + rest timer
      card.querySelectorAll(".sk2-row-inner")[0],   // set 1
      card.querySelectorAll(".sk2-row-inner")[1],   // set 2
      card.querySelector(".grid-cols-2"),            // kg / reps steppers
      card.querySelector(".sk2-actions")             // Log set + hint
    ];
    var BUILD = .3; // share of the card timeline spent building the card before the demo plays

    // Hidden start states are set explicitly (not with .from()), so a ScrollTrigger
    // refresh can never reveal an element before its turn.
    var END = { opacity: 1, x: 0, y: 0, yPercent: 0, scale: 1 };
    function appear(tl, targets, start, vars, position) {
      gsap.set(targets, start);
      var to = {};
      Object.keys(start).forEach(function (k) { to[k] = END[k]; });
      return tl.to(targets, Object.assign(to, vars), position);
    }

    // Copy: headline words, then the paragraph, then each bullet. Nothing overlaps.
    function copyTimeline(tl) {
      gsap.set(title, { opacity: 1 }); // words stay hidden below their masks until their beat
      appear(tl, titleWords, { yPercent: 110 }, { duration: .5, stagger: .12, ease: "power3.out" }, 0);
      var t = tl.duration();
      appear(tl, lede, { opacity: 0, y: 24 }, { duration: .5, ease: "power2.out" }, t);
      t += .5;
      steps.forEach(function (li, i) {
        appear(tl, li, { opacity: 0, y: 16 }, { duration: .35, ease: "power2.out" }, t + i * .4);
      });
      return tl;
    }

    // Card: the panel, then each part inside it, one at a time; then the demo plays.
    function cardTimeline(tl) {
      appear(tl, card, { opacity: 0, y: 50, scale: .97 }, { duration: .08, ease: "power3.out" }, 0);
      cardParts.forEach(function (el, i) {
        appear(tl, el, { opacity: 0, y: 12 }, { duration: .035, ease: "power2.out" }, .1 + i * .04);
      });
      tl.to({}, { duration: 1 - BUILD }, BUILD);
      return tl;
    }
    function demoProgress(self) { demo.setProgress(Math.max(0, (self.progress - BUILD) / (1 - BUILD))); }

    var mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)" }, function (ctx) {
      if (ctx.conditions.desktop) {
        // Copy starts only once the headline is well inside the viewport, and finishes as the
        // section pins; the card waits for the pin.
        copyTimeline(gsap.timeline({
          scrollTrigger: { trigger: title, start: "top 75%", endTrigger: section, end: "top top", scrub: .5 }
        }));
        cardTimeline(gsap.timeline({
          scrollTrigger: {
            trigger: section, start: "top top", end: "+=260%", pin: true, scrub: .5,
            onUpdate: demoProgress
          }
        }));
      } else {
        copyTimeline(gsap.timeline({
          scrollTrigger: { trigger: title, start: "top 75%", endTrigger: ".sk2-copy", end: "bottom 45%", scrub: .5 }
        }));
        cardTimeline(gsap.timeline({
          scrollTrigger: { trigger: card, start: "top 70%", end: "bottom 15%", scrub: .5, onUpdate: demoProgress }
        }));
      }
    });
  }

  // Closing call to action: the same entrance as the hero, played once when the headline is well in view.
  // Headline words rise from their masks line by line ("today" last), then the paragraph, button and small print.
  function setupFinal() {
    var final = document.querySelector(".sk-final");
    if (!final) return;
    var title = final.querySelector("h2");
    var lede = title.nextElementSibling;
    var btn = final.querySelector('a[href*="apps.apple.com"]');
    var small = btn.nextElementSibling;

    // Masked words like the hero; the gold "today" is the second line.
    var words = splitRich(title);
    var lines = [
      words.filter(function (w) { return !w.closest(".text-site-gold"); }),
      words.filter(function (w) { return w.closest(".text-site-gold"); })
    ];
    gsap.set(lines[0].concat(lines[1]), { yPercent: 110 });
    gsap.set(title, { opacity: 1 });

    gsap.timeline({
      defaults: { ease: "expo.out" },
      scrollTrigger: { trigger: title, start: "top 75%", once: true },
      onStart: function () { final.classList.add("sk-lined"); lineUp(final); }
    })
      .to(lines[0], { yPercent: 0, duration: .8, stagger: .07 })
      .to(lines[1], { yPercent: 0, duration: .8, stagger: .07 }, ">-.35")
      .fromTo(lede, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7 }, ">-.2")
      .fromTo(btn, { opacity: 0, y: 16, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .6 }, ">-.25")
      .fromTo(small, { opacity: 0 }, { opacity: 1, duration: .5 }, ">-.2");
  }

  function setupBuyBar() {
    var bar = document.querySelector("[data-buybar]");
    var marker = document.getElementById("log-demo");
    ScrollTrigger.create({
      trigger: marker || document.body,
      start: marker ? "top 80%" : function () { return innerHeight * .6; },
      onEnter: function () { bar.classList.add("is-on"); },
      onLeaveBack: function () { bar.classList.remove("is-on"); }
    });
  }

  /* ---------------- Without React: reveals + mobile menu ---------------- */

  // Section and divider lines that sit outside the content blocks stay hidden until the first
  // piece of content inside them reveals, so no line is ever on screen before its content.
  function lineUp(el) {
    for (var a = el.parentElement; a && a.tagName !== "MAIN" && a !== document.body; a = a.parentElement) a.classList.add("sk-lined");
  }

  // Reveals, site-wide. Blocks wait, hidden, until they're a quarter of the way up the screen,
  // then join a queue and come in one after another, never together. Nothing starts until the
  // page's opening sequence has finished.
  function setupReveals() {
    var els = Array.prototype.slice.call(document.querySelectorAll(".reveal, .reveal-group, [data-sk]"));
    if (!motion) { els.forEach(show); return; }
    // The PR card comes in as part of the chart above it, not on its own turn.
    var pending = els.filter(function (el) { return !el.hasAttribute("data-sk-pr"); });
    var queue = [], busy = false, ready = !window.skIntro;

    // The 1RM chart: the line draws on, the estimate counts up to its new value, then the
    // personal-record card rises in, timed as on the original site.
    function playChart(card) {
      var line = card.querySelector("[data-sk-line]"), num = card.querySelector("[data-sk-count]");
      var pr = document.querySelector("[data-sk-pr]");
      var text = num.firstChild, to = parseFloat(num.getAttribute("data-sk-count"));
      if (!motion) {
        line.style.strokeDashoffset = 0;
        text.nodeValue = to.toFixed(1);
        return;
      }
      var v = { kg: parseFloat(text.nodeValue) };
      gsap.timeline({ delay: .2 })
        .to(line, { strokeDashoffset: 0, duration: 1.4, ease: "expo.out" }, 0)
        .to(v, { kg: to, duration: 1.2, ease: "power3.out", onUpdate: function () { text.nodeValue = v.kg.toFixed(1); } }, 0)
        .add(function () { if (pr) show(pr); }, 1.1);
    }

    function show(el) {
      el.classList.add("is-in");
      lineUp(el);
      if (el.querySelector("[data-sk-line]")) playChart(el);
      // The original site animated a few card details itself once in view; play those now.
      el.querySelectorAll(".opacity-0").forEach(function (d) {
        d.classList.remove("opacity-0", "translate-y-2", "translate-y-3", "scale-[0.6]");
      });
      el.querySelectorAll('[style*="width:0%"]').forEach(function (d) { d.style.width = "100%"; });
    }
    function scan() {
      if (!pending.length) return;
      var atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      pending = pending.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width && !r.height && !el.offsetParent) return true; // hidden (e.g. unloaded blog cards)
        if (r.top < innerHeight * .75 || (atEnd && r.top < innerHeight)) { queue.push(el); return false; }
        return true;
      });
      pump();
    }
    function pump() {
      if (!ready || busy || !queue.length) return;
      var el = queue.shift();
      show(el);
      busy = true;
      // A group staggers its own children; wait for them. Catch up quickly if a lot arrived at once.
      var n = el.classList.contains("reveal-group") ? el.children.length : 1;
      var rush = queue.length > 3 ? .35 : 1;
      setTimeout(function () { busy = false; pump(); }, (140 + (n - 1) * 160) * rush);
    }
    // Checked straight from the scroll event (a cheap pass over what's still hidden) so a reveal
    // never waits on an animation frame that a background tab might not deliver.
    addEventListener("scroll", scan, { passive: true });
    addEventListener("resize", scan);
    window.skRevealScan = scan; // for content added later (blog "Load more")
    if (!ready) window.skIntro.eventCallback("onComplete", function () { ready = true; pump(); });
    scan();
  }

  // Contact form: the original posts to the live service. In this local prototype it never sends;
  // it says so instead.
  function setupContactForm() {
    var form = document.querySelector("main form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-sk-note]");
      if (!note) {
        note = document.createElement("p");
        note.setAttribute("data-sk-note", "");
        note.setAttribute("role", "status");
        note.className = "sk-form-note";
        note.textContent = "This is a local preview, so messages aren't sent from here.";
        form.appendChild(note);
      }
    });
  }

  // Blog "Load more": the remaining posts are already in the page (built from the original
  // page's own post list); each press shows the next batch.
  function setupLoadMore() {
    var btn = document.querySelector("[data-sk-more]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var hidden = document.querySelectorAll("[data-sk-later][hidden]");
      Array.prototype.slice.call(hidden, 0, 9).forEach(function (li) { li.hidden = false; });
      if (hidden.length <= 9) btn.parentElement.hidden = true;
      if (window.skRevealScan) window.skRevealScan();
    });
  }

  // FAQ slider: one card per question. Dots jump to a card; while the section is in view it
  // advances on its own (unless reduced motion is on), and stops on the last card with a replay button.
  function setupFaq() {
    var section = document.getElementById("faq");
    if (!section) return;
    var track = section.querySelector("[data-faq-track]");
    var cards = track.children;
    var dots = section.querySelectorAll("[data-faq-dot]");
    var play = section.querySelector("[data-faq-play]");
    var current = 0, state = "idle", seeking = false, seekTimer;

    function setState(next) {
      state = next;
      section.classList.toggle("is-playing", next === "playing");
      section.classList.toggle("is-paused", next === "paused");
      section.classList.toggle("is-ended", next === "ended");
      play.setAttribute("aria-label", next === "playing" ? "Pause" : next === "ended" ? "Replay" : "Play");
    }
    function mark(i) {
      current = i;
      dots.forEach(function (d, n) {
        d.classList.toggle("is-done", n < i);
        d.classList.remove("is-active");
        d.setAttribute("aria-current", n === i ? "true" : "false");
      });
      void dots[i].offsetWidth; // restart the progress fill
      dots[i].classList.add("is-active");
    }
    function go(i, smooth) {
      mark(i);
      seeking = true;
      clearTimeout(seekTimer);
      seekTimer = setTimeout(function () { seeking = false; }, 700);
      track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: smooth === false || reduce ? "auto" : "smooth" });
    }

    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { go(i); if (state === "ended") setState("playing"); });
      d.firstElementChild.addEventListener("animationend", function () {
        if (state !== "playing" || i !== current) return;
        if (i < cards.length - 1) go(i + 1); else setState("ended");
      });
    });
    play.addEventListener("click", function () {
      if (state === "playing") setState("paused");
      else if (state === "ended") { go(0); setState("playing"); }
      else setState("playing");
    });

    // Swiping or trackpad-scrolling the cards moves the dots to whichever card is now first.
    track.addEventListener("scroll", function () {
      if (seeking) return;
      var max = track.scrollWidth - track.clientWidth;
      var step = cards[1].offsetLeft - cards[0].offsetLeft;
      var i = track.scrollLeft >= max - 2 ? cards.length - 1 : Math.round(track.scrollLeft / step);
      if (i !== current) mark(i);
    }, { passive: true });

    mark(0);
    setState(reduce ? "paused" : "idle");
    if (reduce || !("IntersectionObserver" in window)) return;
    // Start once the cards are properly in view (after their entrance), pause when scrolled away.
    var started = false;
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      if (e.isIntersecting && !started) {
        started = true;
        setTimeout(function () { mark(current); setState("playing"); }, 1400);
      } else if (!e.isIntersecting && state === "playing") setState("paused");
    }, { threshold: .6 }).observe(track);
  }

  // Back-to-top button: slides in once the hero (or the first screen on other pages) is behind you.
  function setupToTop() {
    var btn = document.querySelector("[data-totop]");
    var marker = document.getElementById("log-demo");
    if (!btn) return;
    var queued = false;
    function update() {
      queued = false;
      var on = marker ? marker.getBoundingClientRect().top < innerHeight * .8 : scrollY > innerHeight * .6;
      btn.classList.toggle("is-on", on);
      btn.tabIndex = on ? 0 : -1;
    }
    addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    btn.addEventListener("click", function () {
      scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var logo = document.querySelector('header a[aria-label="Setkord home"]');
      if (logo) logo.focus({ preventScroll: true });
    });
  }

  function setupMobileMenu() {
    var btn = document.querySelector('[aria-controls="mobile-menu"]');
    var header = btn && btn.closest("header");
    if (!btn || !header) return;
    var menu = document.createElement("nav");
    menu.id = "mobile-menu";
    menu.className = "sk-menu";
    menu.setAttribute("aria-label", "Mobile");
    menu.hidden = true;
    header.querySelectorAll('nav[aria-label="Main"] a').forEach(function (a) {
      var link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent;
      menu.appendChild(link);
    });
    header.appendChild(menu);
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add("is-open"); });
      } else {
        menu.classList.remove("is-open");
        setTimeout(function () { if (btn.getAttribute("aria-expanded") !== "true") menu.hidden = true; }, 450);
      }
    });
  }
})();
