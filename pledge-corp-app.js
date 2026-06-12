// PLEDGE Inc. corporate — app logic: i18n, loop animation, reveals, tweak hooks
(function () {
  var I18N = window.PLEDGE_I18N;
  var state = {
    lang: localStorage.getItem("pledgeCorpLang") || "ko",
    headline: "circle",
    motion: true,
    step: 0
  };

  // ---------- i18n ----------
  // renders "\n" as <br> and *word* as <em>
  function renderRich(el, text) {
    el.textContent = "";
    text.split("\n").forEach(function (line, i) {
      if (i > 0) el.appendChild(document.createElement("br"));
      line.split("*").forEach(function (seg, j) {
        if (!seg) return;
        if (j % 2 === 1) {
          var em = document.createElement("em");
          em.textContent = seg;
          el.appendChild(em);
        } else {
          el.appendChild(document.createTextNode(seg));
        }
      });
    });
  }

  function applyLang() {
    var dict = I18N[state.lang];
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) renderRich(el, dict[key]);
    });
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang));
    });
    applyHeadline();
    renderCaption(true);
  }

  function applyHeadline() {
    var h = document.getElementById("hero-headline");
    if (!h) return;
    var v = (I18N.headlines[state.headline] || I18N.headlines.circle)[state.lang === "ko" ? "ko" : "en"];
    h.textContent = "";
    v.split("\n").forEach(function (line) {
      var s = document.createElement("span");
      s.className = "accent-row";
      renderRich(s, line);
      h.appendChild(s);
    });
  }

  document.querySelectorAll(".lang-toggle button").forEach(function (b) {
    b.addEventListener("click", function () {
      state.lang = b.dataset.lang;
      localStorage.setItem("pledgeCorpLang", state.lang);
      applyLang();
    });
  });

  // ---------- loop diagram ----------
  var STEPS = 5;
  var stepNodeMap = ["pledge", "pledge", "wavist", "witchbox", null];
  var captionEl = document.getElementById("loop-caption");
  var stepnoEl = document.getElementById("loop-stepno");
  var nodes = document.querySelectorAll(".loop-node");
  var stepRows = document.querySelectorAll(".loop-step");
  var cycleTimer = null;

  function renderCaption(instant) {
    var dict = I18N[state.lang];
    var key = "step" + (state.step + 1);
    function swap() {
      captionEl.textContent = dict[key];
      stepnoEl.textContent = (state.step + 1) + " / " + STEPS;
      captionEl.classList.remove("fading");
    }
    if (instant) { swap(); return; }
    captionEl.classList.add("fading");
    setTimeout(swap, 320);
    nodes.forEach(function (n) {
      n.classList.toggle("is-active", n.dataset.node === stepNodeMap[state.step]);
    });
    stepRows.forEach(function (r, i) {
      r.classList.toggle("active", i === state.step);
    });
  }

  function setStep(i, manual) {
    state.step = i % STEPS;
    renderCaption(false);
    if (manual) restartCycle();
  }

  function restartCycle() {
    clearInterval(cycleTimer);
    cycleTimer = null;
    if (state.motion && !prefersReduced()) {
      cycleTimer = setInterval(function () { setStep(state.step + 1); }, 3400);
    }
  }

  function prefersReduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  stepRows.forEach(function (r, i) {
    r.addEventListener("click", function () { setStep(i, true); });
  });

  // traveling dots on the ring (rAF)
  var dotEls = document.querySelectorAll(".flow-dot");
  var CX = 360, CY = 360, R = 250;
  var t0 = performance.now();
  function tick(now) {
    if (state.motion && !prefersReduced()) {
      var t = (now - t0) / 1000;
      dotEls.forEach(function (d, i) {
        var a = (t * 0.22 + i / dotEls.length) * Math.PI * 2 - Math.PI / 2;
        d.setAttribute("cx", (CX + R * Math.cos(a)).toFixed(1));
        d.setAttribute("cy", (CY + R * Math.sin(a)).toFixed(1));
        d.setAttribute("opacity", "1");
      });
    } else {
      dotEls.forEach(function (d) { d.setAttribute("opacity", "0"); });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ---------- scroll reveal ----------
  // Elements are visible by default; below-fold elements get .pre (hidden),
  // removed when they scroll into view. JS failure = everything still visible.
  (function setupReveals() {
    if (prefersReduced()) return;
    var vh = window.innerHeight;
    document.querySelectorAll(".rv").forEach(function (el) {
      if (el.getBoundingClientRect().top > vh * 0.88) el.classList.add("pre");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -4% 0px" });
    document.querySelectorAll(".rv.pre").forEach(function (el) { io.observe(el); });
  })();

  // ---------- tweak hooks ----------
  window.applyPledgeTweaks = function (t) {
    var map = { "Fandom Economy": "circle", "One Economy": "economy", "Value Stays": "stays" };
    state.headline = map[t.headline] || "circle";
    state.motion = !!t.motion;
    document.documentElement.setAttribute("data-motion", state.motion ? "on" : "off");
    document.documentElement.setAttribute("data-color", t.colorMode === "Subtle" ? "subtle" : "full");
    applyHeadline();
    restartCycle();
    if (!state.motion) {
      document.querySelectorAll(".rv.pre").forEach(function (el) { el.classList.remove("pre"); });
    }
  };

  // ---------- init ----------
  document.documentElement.setAttribute("data-motion", "on");
  document.documentElement.setAttribute("data-color", "full");
  applyLang();
  nodes.forEach(function (n) {
    n.classList.toggle("is-active", n.dataset.node === stepNodeMap[state.step]);
  });
  stepRows[0] && stepRows[0].classList.add("active");
  restartCycle();
})();
