/* ==========================================================================
   Illomi behaviour

   Scroll rule: there is no scroll event listener in this file. One rAF loop
   samples scrollY per frame and writes transforms only.

   The inertial scroll drives the REAL scroll position (it does not transform a
   wrapper), which is why position:sticky, anchors and the pinned sections all
   keep working underneath it.

   Every animation has a job:
     intro curtain  -> state transition, the page arrives composed rather than
                       assembling itself in front of the visitor
     word reveal    -> hierarchy, the headline lands before the supporting copy
     statement fill -> storytelling, the sentence is read at reading pace
     pinned pan     -> breadth, five projects read as one horizontal gesture
     sticky bands   -> sequence, the four steps happen in an order
     pointer peek   -> feedback, hovering a service shows what it looks like
     link rule wipe -> feedback, the only coloured moment on the page
   ========================================================================== */
(function () {
  "use strict";

  /* Paste a form endpoint here (Formspree, Basin, Netlify) to post directly.
     Left empty, the form hands off to the visitor's mail app rather than
     pretending to send. */
  var ENDPOINT = "";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var wide = window.matchMedia("(min-width: 901px)");

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rich() { return !reduced.matches && wide.matches; }
  function navH() { return parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 64; }

  /* ======================================================================
     inertial scroll
     ====================================================================== */
  var scroller = (function () {
    if (reduced.matches || !fine.matches) return null;

    var target = window.scrollY, cur = target, raf = 0, engaged = false;

    function maxY() { return Math.max(0, root.scrollHeight - window.innerHeight); }
    function to(y) {
      target = clamp(y, 0, maxY());
      engaged = true;
      if (!raf) raf = requestAnimationFrame(step);
    }
    function step() {
      raf = 0;
      cur += (target - cur) * 0.105;
      if (Math.abs(target - cur) < 0.35) { cur = target; engaged = false; }
      window.scrollTo(0, cur);
      if (engaged) raf = requestAnimationFrame(step);
    }

    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;                                   /* pinch zoom */
      var menu = document.getElementById("menu");
      if (menu && !menu.hidden) return;
      e.preventDefault();
      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 18;                          /* lines */
      else if (e.deltaMode === 2) d *= window.innerHeight;      /* pages */
      to(target + d);
    }, { passive: false });

    return {
      to: to,
      /* keep in step with scrollbar drags, keyboard paging and anchor jumps */
      sync: function (y) { if (!engaged) { target = y; cur = y; } }
    };
  })();

  /* anchors go through the same path so nothing fights over the position */
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href");
    if (!id || id === "#") return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    var y = el.getBoundingClientRect().top + window.scrollY - (id === "#top" ? 0 : navH());
    if (scroller) scroller.to(y);
    else window.scrollTo({ top: Math.max(0, y), behavior: reduced.matches ? "auto" : "smooth" });
  });

  /* ======================================================================
     intro curtain
     ====================================================================== */
  (function intro() {
    var el = document.getElementById("intro");
    if (!el) return;

    function lift() {
      el.classList.add("is-done");
      root.classList.add("is-entered");
      window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1100);
    }

    if (reduced.matches) { el.parentNode.removeChild(el); root.classList.add("is-entered"); return; }

    var done = false;
    function go() { if (done) return; done = true; window.setTimeout(lift, 260); }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    window.setTimeout(go, 1400);                               /* never hostage to a slow font */
  })();

  /* ======================================================================
     appearance
     ====================================================================== */
  /* Auto -> Light -> Dark -> Auto.
     Auto is a real state, not just the starting value. Once someone picks
     Light or Dark they must be able to hand control back to their system,
     which a two way toggle cannot do. */
  (function theme() {
    var btn = document.getElementById("theme-toggle");
    var label = document.getElementById("theme-label");
    if (!btn || !label) return;

    var order = ["auto", "light", "dark"];
    var names = { auto: "Auto", light: "Light", dark: "Dark" };
    var sysLight = window.matchMedia("(prefers-color-scheme: light)");

    function current() {
      var set = root.getAttribute("data-theme");
      return (set === "light" || set === "dark") ? set : "auto";
    }
    function resolved() {
      var m = current();
      return m === "auto" ? (sysLight.matches ? "light" : "dark") : m;
    }
    function apply(m, save) {
      if (m === "auto") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", m);
      label.textContent = names[m];
      btn.setAttribute("aria-label",
        "Appearance: " + names[m] + (m === "auto" ? " (" + resolved() + ")" : "") + ". Activate to change.");
      if (save) {
        try {
          if (m === "auto") localStorage.removeItem("illomi-theme");
          else localStorage.setItem("illomi-theme", m);
        } catch (e) { /* private mode */ }
      }
      if (window.IllomiHero) window.IllomiHero.refresh();
      /* var hoisting means this is simply undefined on the first pass, before
         the footer wordmark has been built */
      if (wordmark) wordmark.refresh();
    }

    apply(current(), false);

    btn.addEventListener("click", function () {
      apply(order[(order.indexOf(current()) + 1) % order.length], true);
    });

    /* while on Auto, follow the system if it changes under us */
    sysLight.addEventListener("change", function () {
      if (current() === "auto") apply("auto", false);
    });
  })();

  /* ======================================================================
     menu
     ====================================================================== */
  (function menu() {
    var burger = document.getElementById("burger");
    var panel = document.getElementById("menu");
    if (!burger || !panel) return;

    function close() {
      panel.hidden = true;
      root.classList.remove("menu-open");
      document.body.style.overflow = "";
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
    }
    function open() {
      panel.hidden = false;
      root.classList.add("menu-open");
      document.body.style.overflow = "hidden";
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Close menu");
    }

    burger.addEventListener("click", function () { if (panel.hidden) open(); else close(); });
    panel.addEventListener("click", function (e) { if (e.target.tagName === "A") close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { close(); burger.focus(); }
    });
    wide.addEventListener("change", function (e) { if (e.matches) close(); });
  })();

  /* ======================================================================
     word splitting, reveals, and the scroll filled statement
     ====================================================================== */
  function splitWords(el, cls) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    var made = [];
    words.forEach(function (w, i) {
      var outer = document.createElement("span");
      outer.className = cls;
      var inner = document.createElement("span");
      inner.className = cls + "__i";
      inner.textContent = w;
      outer.appendChild(inner);
      el.appendChild(outer);
      made.push(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return made;
  }

  var fills = [];

  (function reveals() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-split]"), function (el) {
      var made = splitWords(el, "sw");
      made.forEach(function (o, i) { o.style.setProperty("--d", (i * 40) + "ms"); });
      el.classList.add("is-ready");
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-fill]"), function (el) {
      var made = splitWords(el, "fw");
      if (!reduced.matches) made.forEach(function (o) { o.style.opacity = "0.16"; });
      fills.push({ el: el, words: made, from: 0, span: 1 });
    });

    var targets = document.querySelectorAll("[data-split], [data-reveal]");

    if (!window.IntersectionObserver || reduced.matches) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add("is-in"); });
      return;
    }

    var seen = new Map();
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]"), function (el) {
      var p = el.parentNode;
      var n = seen.get(p) || 0;
      el.style.setProperty("--d", (n * 90) + "ms");
      seen.set(p, n + 1);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });

    /* the hero is above the fold, so it waits on the curtain instead */
    var heroBits = document.querySelectorAll(".hero [data-split], .hero [data-reveal]");
    function enter() {
      Array.prototype.forEach.call(heroBits, function (el) { el.classList.add("is-in"); io.unobserve(el); });
    }
    if (root.classList.contains("is-entered")) enter();
    else {
      var t = window.setInterval(function () {
        if (root.classList.contains("is-entered")) { window.clearInterval(t); enter(); }
      }, 60);
      window.setTimeout(function () { window.clearInterval(t); enter(); }, 2600);
    }
  })();

  /* ======================================================================
     live mockup frames

     Each card holds a REAL page from /mockups, authored 1000px wide. The
     mockups are different heights (1109px to 1981px), so the height is read
     from the embedded document rather than assumed: getting it wrong makes
     the hover reveal scroll past the end of the design into blank space.
       --k    scale, frame width over the 1000px design width
       --h    the embedded page's real height
       --play how far it can travel to show the rest of the design
     ====================================================================== */
  function fitFrame(scroll) {
    if (!scroll) return;
    var iframe = scroll.querySelector("iframe");
    var w = scroll.clientWidth, hgt = scroll.clientHeight;
    if (!w || !iframe) return;

    var contentH = 1400;
    try {
      var d = iframe.contentDocument;
      /* Measure the BODY box, not documentElement.scrollHeight. The iframe is
         sized from --h, and scrollHeight never reports less than the viewport
         it is in, so reading it here would just echo back the previous value
         and pin every short page to the default. */
      var mh = d && d.body ? Math.ceil(d.body.getBoundingClientRect().height) : 0;
      if (mh > 200) contentH = mh;
    } catch (e) { /* not loaded yet, the default stands until it is */ }

    var k = w / 1000;
    scroll.style.setProperty("--k", k.toFixed(4));
    scroll.style.setProperty("--h", contentH + "px");
    /* how far the preview can travel before it runs out of page */
    scroll.style.setProperty("--play", Math.max(0, Math.round(contentH * k - hgt)) + "px");
  }

  /* Only the previews actually on screen animate. The rail is horizontal, so
     most cards sit off to one side, and a CSS animation keeps running for
     off screen elements unless something stops it. */
  (function playWhenSeen() {
    var cards = document.querySelectorAll(".proj");
    if (!cards.length) return;
    if (!window.IntersectionObserver) {
      Array.prototype.forEach.call(cards, function (c) { c.classList.add("is-onscreen"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle("is-onscreen", e.isIntersecting); });
    }, { root: null, rootMargin: "10% 15%", threshold: 0 });
    Array.prototype.forEach.call(cards, function (c) { io.observe(c); });
  })();

  /* re-fit once each embedded page has actually loaded */
  Array.prototype.forEach.call(document.querySelectorAll(".proj__scroll iframe"), function (f) {
    f.addEventListener("load", function () { fitFrame(f.closest(".proj__scroll")); });
  });

  /* ======================================================================
     scroll engine: one loop, no scroll listener
     ====================================================================== */
  (function scrollEngine() {
    var nav = document.getElementById("nav");
    var pin = document.querySelector(".work__pin");
    var track = document.getElementById("work-track");
    var bar = document.getElementById("work-bar");
    var projects = document.querySelectorAll(".proj");
    var items = document.querySelectorAll(".proc__item");

    var pinTop = 0, pinRange = 1, shift = 0;
    var stack = [], flyers = [], rows = [], flyMid = 0, stuck = false;

    function measure() {
      if (pin && track) {
        shift = Math.max(0, track.scrollWidth - window.innerWidth);
        /* scroll distance derived from pan distance, not a hardcoded vh */
        if (rich()) pin.style.height = Math.round(window.innerHeight + shift * 1.15) + "px";
        else pin.style.height = "";

        pinTop = pin.getBoundingClientRect().top + window.scrollY;
        pinRange = Math.max(1, pin.offsetHeight - window.innerHeight);
      }

      Array.prototype.forEach.call(projects, function (p) {
        fitFrame(p.querySelector(".proj__scroll"));
      });

      stack = [];
      Array.prototype.forEach.call(items, function (item, i) {
        if (i === items.length - 1) return;
        var band = item.querySelector(".proc__band");
        stack.push({
          band: band,
          from: item.getBoundingClientRect().top + window.scrollY,
          span: Math.max(1, band.offsetHeight)
        });
      });

      fills.forEach(function (f) {
        var r = f.el.getBoundingClientRect();
        var top = r.top + window.scrollY;
        f.from = top - window.innerHeight * 0.85;
        f.span = Math.max(1, r.height + window.innerHeight * 0.43);
      });

      /* The five names sit ~160px apart inside a ~520px reach, so driving each
         one off its OWN position would leave neighbours permanently mid effect
         and let them travel far enough to collide. The whole group is driven
         off the section instead, with a per row stagger, so the list arrives
         and leaves as one wave. */
      flyers = [];
      var flySec = document.querySelector(".svc");
      if (flySec) {
        var sr = flySec.getBoundingClientRect();
        flyMid = sr.top + window.scrollY + sr.height / 2;
        Array.prototype.forEach.call(document.querySelectorAll("[data-fly]"), function (el, i) {
          flyers.push({ el: el, i: i, flying: false });
        });
      }

      rows = [];
      Array.prototype.forEach.call(document.querySelectorAll(".svc__row"), function (el) {
        var r = el.getBoundingClientRect();
        rows.push({ el: el, mid: r.top + window.scrollY + r.height / 2, lit: false });
      });
    }

    var lastY = -1;

    function frame() {
      var y = window.scrollY || window.pageYOffset || 0;
      if (scroller) scroller.sync(y);

      if (y !== lastY) {
        lastY = y;

        if (nav) {
          var want = y > 8;
          if (want !== stuck) { stuck = want; nav.classList.toggle("is-stuck", want); }
        }

        if (pin && track && rich()) {
          var p = clamp((y - pinTop) / pinRange, 0, 1);
          track.style.transform = "translate3d(" + (-shift * p).toFixed(2) + "px, 0, 0)";
          if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
        }

        if (rows.length) {
          var eye = y + window.innerHeight * 0.5;
          var near = -1, best = Infinity;
          for (var v = 0; v < rows.length; v++) {
            var dist = Math.abs(rows[v].mid - eye);
            if (dist < best) { best = dist; near = v; }
          }
          /* only when the list is actually at the reading line, otherwise a
             row stays lit while the section is nowhere near the viewport */
          if (best > window.innerHeight * 0.45) near = -1;
          for (var v2 = 0; v2 < rows.length; v2++) {
            var want = v2 === near;
            if (want !== rows[v2].lit) {
              rows[v2].lit = want;
              rows[v2].el.classList.toggle("is-lit", want);
            }
          }
        }

        if (rich()) {
          for (var j = 0; j < stack.length; j++) {
            var s = stack[j];
            var sp = clamp((y - s.from) / s.span, 0, 1);
            s.band.style.setProperty("--s", (1 - sp * 0.06).toFixed(4));
            s.band.style.setProperty("--o", (1 - sp * 0.45).toFixed(3));
          }

          for (var k2 = 0; k2 < fills.length; k2++) {
            var f = fills[k2];
            var fp = clamp((y - f.from) / f.span, 0, 1) * f.words.length;
            for (var w2 = 0; w2 < f.words.length; w2++) {
              f.words[w2].style.opacity = (0.16 + 0.84 * clamp(fp - w2, 0, 1)).toFixed(3);
            }
          }

          /* Type that flies in, settles, and flies away.
             d is the signed distance of the SECTION from the reading zone:
             positive while it is still arriving from below, negative once it
             is leaving above. Each row is offset along that wave by its index,
             so the list staggers instead of moving as a slab. At d = 0 every
             name is still, solid and unmasked: the effect belongs to the
             travel, never to the reading. */
          var centre = y + window.innerHeight / 2;
          var reach = window.innerHeight * 0.62;
          var base = clamp((flyMid - centre) / reach, -1.4, 1.4);

          for (var q = 0; q < flyers.length; q++) {
            var fl = flyers[q];
            var d = clamp(base + (fl.i - (flyers.length - 1) / 2) * 0.1, -1, 1);

            /* Dead zone. Without it the outermost rows sit permanently at a
               fifth of the effect while the section is centred, which is
               exactly where the copy has to be legible and aligned. Below 0.22
               the row is plain text on its baseline; past it the effect ramps
               to full. */
            var mag = clamp((Math.abs(d) - 0.22) / 0.78, 0, 1);
            var on = mag > 0.02;

            if (on !== fl.flying) { fl.flying = on; fl.el.classList.toggle("is-flying", on); }

            /* 44px of travel against ~160px of row spacing: staggered
               neighbours can never overlap each other */
            fl.el.style.setProperty("--fy", ((d < 0 ? -1 : 1) * mag * 44).toFixed(1) + "px");
            if (on) {
              fl.el.style.setProperty("--solid", ((1 - mag) * 100).toFixed(1) + "%");
              fl.el.style.setProperty("--px", (2 + mag * 7).toFixed(2) + "px");
              fl.el.style.setProperty("--bgx", (d * 120).toFixed(1) + "%");
            }
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    var raf = 0;
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    measure();
    start();

    var t = 0;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (!rich() && track) track.style.transform = "";
        measure();
        lastY = -1;
      }, 150);
    });
    window.addEventListener("load", function () { measure(); lastY = -1; });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); lastY = -1; });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else { lastY = -1; start(); }
    });
  })();

  /* ======================================================================
     the example sites, opened full screen

     Previews are static. Clicking one opens the real page full screen where it
     can be scrolled properly, which is the point of shipping real pages rather
     than screenshots.

     Getting out again is deliberately over provided for, because a full screen
     iframe on a phone is the easiest place on the web to feel trapped:
       a 48px labelled Close button, always visible in the bar
       the Escape key
       the phone's own back gesture, via a history entry
     ====================================================================== */
  (function viewer() {
    var box = document.getElementById("viewer");
    var frame = document.getElementById("viewer-site");
    var title = document.getElementById("viewer-title");
    var closeBtn = document.getElementById("viewer-close");
    if (!box || !frame || !closeBtn) return;

    var opener = null;
    var open = false;
    var hideTimer = 0;

    function show(src, name, el) {
      opener = el || null;
      title.textContent = name;
      frame.setAttribute("title", name + ", example site");
      frame.setAttribute("src", src);
      box.hidden = false;
      document.body.style.overflow = "hidden";
      open = true;
      /* read a layout property so the browser commits the hidden -> shown
         change before the class lands, otherwise there is nothing to
         transition from and the panel just appears */
      void box.offsetHeight;
      box.classList.add("is-open");
      closeBtn.focus();
      /* a history entry so the back gesture closes the viewer rather than
         leaving the site altogether */
      try { history.pushState({ illomiViewer: true }, ""); } catch (e) { /* file:// */ }
    }

    function hide(fromPop) {
      if (!open) return;
      open = false;
      box.classList.remove("is-open");
      document.body.style.overflow = "";

      /* let the panel animate out before it leaves the tree. The timeout is
         the authority, not transitionend, which never fires under reduced
         motion or if the layer is offscreen. */
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () {
        box.hidden = true;
        frame.removeAttribute("src");        /* stop it loading in the background */
      }, reduced.matches ? 0 : 460);
      if (opener) { opener.focus(); opener = null; }
      if (!fromPop) {
        try {
          if (history.state && history.state.illomiViewer) history.back();
        } catch (e) { /* nothing to go back to */ }
      }
    }

    Array.prototype.forEach.call(document.querySelectorAll(".proj__open"), function (btn) {
      btn.addEventListener("click", function () {
        show(btn.getAttribute("data-site"), btn.getAttribute("data-title"), btn);
      });
    });

    closeBtn.addEventListener("click", function () { hide(false); });
    var scrim = document.getElementById("viewer-scrim");
    if (scrim) scrim.addEventListener("click", function () { hide(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) hide(false);
    });
    window.addEventListener("popstate", function () { if (open) hide(true); });
  })();

  /* ======================================================================
     the live footer wordmark

     The same dot field as the hero, masked to the letterforms, running the
     same wind. It is a TRANSPARENT canvas that only paints dots, so the page
     background shows through and it is correct in light and dark without ever
     asking which one is active. The two colours come from the same tokens the
     hero reads, and are re-read when the appearance changes.

     The letterforms are not rasterised here: canvas 2D ignores
     font-variation-settings, so it would quietly render Archivo at the default
     width. The coverage grid in wordmark-data.js was baked with the axes
     honoured, which is what keeps this identical to the GIF.
     ====================================================================== */
  var wordmark = (function () {
    var data = window.IllomiWordmark;
    var canvas = document.getElementById("foot-canvas");
    var mark = document.getElementById("foot-mark");
    if (!data || !canvas || !mark) return null;
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return null;                       /* plain text stays */

    var cells = [];
    for (var i = 0; i < data.grid.length; i++) {
      var v = data.grid.charCodeAt(i) - 48;
      if (v > 0) cells.push([i % data.cols, (i / data.cols) | 0, v / 9]);
    }
    if (!cells.length) return null;

    mark.style.setProperty("--mark-aspect", data.aspect);
    root.classList.add("is-wordmark-live");

    var W = 0, H = 0, cw = 0, ch = 0, dpr = 1, step = 1;
    var LUT = [], LEVELS = 18, R0 = 0.14, R1 = 0.44;

    function rgb(name) {
      var s = getComputedStyle(root).getPropertyValue(name).trim();
      if (s.charAt(0) === "#") {
        if (s.length === 4) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
        return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)];
      }
      var m = s.match(/\d+(\.\d+)?/g) || [0, 0, 0];
      return [+m[0], +m[1], +m[2]];
    }

    /* one colour string per light level, so the draw loop never builds strings */
    function buildLUT() {
      var dot = rgb("--dot-ink"), acc = rgb("--accent");
      /* floor and radius are both per appearance: see --dot-min, --dot-r0 */
      var cs = getComputedStyle(root);
      var floor = parseFloat(cs.getPropertyValue("--dot-min")) || 0.6;
      R0 = parseFloat(cs.getPropertyValue("--dot-r0")) || 0.14;
      R1 = parseFloat(cs.getPropertyValue("--dot-r1")) || 0.44;
      LUT = [];
      for (var l = 0; l < LEVELS; l++) {
        var t = l / (LEVELS - 1);
        var mix = Math.max(0, Math.min(1, (t * 1.07 - 0.25) / 0.70));
        var a = Math.min(1, floor + t * 1.07 * (1 - floor));
        LUT.push("rgba(" + Math.round(dot[0] + (acc[0] - dot[0]) * mix) + "," +
                 Math.round(dot[1] + (acc[1] - dot[1]) * mix) + "," +
                 Math.round(dot[2] + (acc[2] - dot[2]) * mix) + "," + a.toFixed(3) + ")");
      }
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, coarse() ? 1.5 : 2);
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      cw = W / data.cols; ch = H / data.rows;
      /* The grid is fixed at 104 columns, so on a narrow footer the cells fall
         under 3 CSS px and the letterforms turn to mush. Drop to every other
         cell and double the dot instead, which keeps the halftone readable at
         any width. */
      step = (cw / dpr) < 3 ? 2 : 1;
    }

    function coarse() { return window.matchMedia("(pointer: coarse)").matches; }

    var pointer = null;
    mark.addEventListener("pointermove", function (e) {
      if (coarse() || reduced.matches) return;
      var r = canvas.getBoundingClientRect();
      pointer = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    }, { passive: true });
    mark.addEventListener("pointerleave", function () { pointer = null; });

    var RATE_X = 0.55, RATE_Y = 0.28;
    function paint(t) {
      ctx.clearRect(0, 0, W, H);
      var aspect = 1 / data.aspect;
      for (var i = 0; i < cells.length; i++) {
        var gx = cells[i][0], gy = cells[i][1], cover = cells[i][2];
        if (step > 1 && ((gx % step) || (gy % step))) continue;
        var u = (gx + 0.5) / data.cols, v = (gy + 0.5) / data.rows;
        var phase = u * 8.0 - t * RATE_X + Math.sin(v * 5.5 + t * RATE_Y) * 0.9;
        var gust = Math.sin(phase) * 0.5 + 0.5;
        var light = 0.12 + gust * gust * 0.95;

        if (pointer) {                            /* the interactive part */
          var dx = (u - pointer[0]) * aspect, dy = v - pointer[1];
          light += Math.exp(-(dx * dx + dy * dy) * 9.0) * 0.9;
        }
        if (light > 1.07) light = 1.07;

        var sway = Math.sin(phase - 0.6) * 0.5 + 0.5;
        var r = (R0 + light * R1) * cw * step * cover;
        if (r < 0.3) continue;
        ctx.fillStyle = LUT[Math.min(LEVELS - 1, Math.max(0, Math.round(light / 1.07 * (LEVELS - 1))))];
        ctx.beginPath();
        ctx.arc((gx + 0.5) * cw + (sway - 0.5) * cw * 0.34,
                (gy + 0.5) * ch + (sway - 0.5) * ch * 0.08, r, 0, 6.2832);
        ctx.fill();
      }
    }

    var raf = 0, visible = false, start = 0, lastPaint = 0;
    function frame(now) {
      raf = 0;
      if (visible && !reduced.matches) raf = requestAnimationFrame(frame);
      var minDelta = coarse() ? 1000 / 30 : 0;
      if (minDelta && now - lastPaint < minDelta) return;
      lastPaint = now;
      if (!start) start = now;
      paint((now - start) / 1000);
    }

    buildLUT();
    resize();
    paint(0);

    if (window.ResizeObserver) new ResizeObserver(function () { resize(); paint(0); }).observe(canvas);
    else window.addEventListener("resize", function () { resize(); paint(0); });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible && !raf && !reduced.matches) raf = requestAnimationFrame(frame);
        else if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
      }, { threshold: 0 }).observe(canvas);
    } else { visible = true; raf = requestAnimationFrame(frame); }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (!document.hidden && visible && !raf && !reduced.matches) raf = requestAnimationFrame(frame);
    });

    return { refresh: function () { buildLUT(); resize(); paint(lastPaint ? (lastPaint - start) / 1000 : 0); } };
  })();

  /* ======================================================================
     contact form: idle, invalid, sending, sent, failed
     ====================================================================== */
  (function form() {
    var f = document.getElementById("form");
    if (!f) return;
    var status = document.getElementById("form-status");

    var checks = [
      { input: "f-name", err: "e-name", test: function (v) { return v.trim().length > 1; }, msg: "Please add your name." },
      { input: "f-email", err: "e-email", test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "That email does not look right." },
      { input: "f-msg", err: "e-msg", test: function (v) { return v.trim().length > 5; }, msg: "A line or two about what you need." }
    ];

    function setError(check, bad) {
      var input = document.getElementById(check.input);
      var err = document.getElementById(check.err);
      input.parentNode.classList.toggle("is-bad", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) {
        err.querySelector("span").textContent = check.msg;
        err.hidden = false;
        input.setAttribute("aria-describedby", check.err);
      } else {
        err.hidden = true;
        input.removeAttribute("aria-describedby");
      }
    }

    checks.forEach(function (check) {
      var input = document.getElementById(check.input);
      input.addEventListener("blur", function () {
        if (input.value.trim() !== "") setError(check, !check.test(input.value));
      });
      input.addEventListener("input", function () {
        if (input.parentNode.classList.contains("is-bad") && check.test(input.value)) setError(check, false);
      });
    });

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      status.classList.remove("is-ok");

      var first = null;
      checks.forEach(function (check) {
        var input = document.getElementById(check.input);
        var bad = !check.test(input.value);
        setError(check, bad);
        if (bad && !first) first = input;
      });
      if (first) { first.focus(); return; }

      var data = new FormData(f);

      if (!ENDPOINT) {
        var body = "Name: " + data.get("name") + "\n" +
                   "Company: " + (data.get("company") || "not given") + "\n" +
                   "Email: " + data.get("email") + "\n\n" + data.get("message");
        status.textContent = "Opening your email app with the message ready to send.";
        window.location.href = "mailto:hello@illomi.com" +
          "?subject=" + encodeURIComponent("New project enquiry") +
          "&body=" + encodeURIComponent(body);
        return;
      }

      f.classList.add("is-sending");
      status.textContent = "Sending.";

      fetch(ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("bad response");
          f.reset();
          status.textContent = "Thank you. We will come back within a working day.";
          status.classList.add("is-ok");
        })
        .catch(function () {
          status.textContent = "That did not send. Please email hello@illomi.com instead.";
        })
        .then(function () { f.classList.remove("is-sending"); });
    });
  })();
})();
