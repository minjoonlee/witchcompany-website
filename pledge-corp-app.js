// PLEDGE Inc. corporate v10 — language toggle, hero slideshow, structure map, fail-open reveal
(function () {
  var I18N = window.PLEDGE_I18N;
  var lang = "ko";
  try { lang = localStorage.getItem("pledgeCorpLang") || "ko"; } catch (e) {}

  function renderRich(el, text) {
    el.textContent = "";
    text.split("\n").forEach(function (line, i) {
      if (i > 0) el.appendChild(document.createElement("br"));
      line.split("*").forEach(function (seg, j) {
        if (!seg) return;
        if (j % 2 === 1) { var em = document.createElement("em"); em.textContent = seg; el.appendChild(em); }
        else el.appendChild(document.createTextNode(seg));
      });
    });
  }
  function apply() {
    var d = I18N[lang] || I18N.ko;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = d[el.getAttribute("data-i18n")];
      if (v != null) renderRich(el, v);
    });
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
  }
  document.querySelectorAll(".lang-toggle button").forEach(function (b) {
    b.addEventListener("click", function () {
      lang = b.dataset.lang;
      try { localStorage.setItem("pledgeCorpLang", lang); } catch (e) {}
      apply();
    });
  });
  if (lang !== "ko") apply();

  // header: transparent over the hero, solid afterwards
  var hd = document.querySelector(".hd"), darks = document.querySelectorAll(".hero, .structure, .contact, .ft");
  function onScroll() {
    if (!hd) return;
    var y = hd.offsetHeight / 2, dark = false, top = false;
    darks.forEach(function (d) { var r = d.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { dark = true; if (d.classList.contains("hero")) top = true; } });
    hd.classList.toggle("on-dark", dark);
    hd.classList.toggle("at-top", top);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // hero slideshow
  (function () {
    var slides = document.querySelectorAll(".hero .slide");
    var ticks = document.querySelectorAll("#heroTicks i"), cap = document.getElementById("heroCap");
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var i = 0;
    setInterval(function () {
      if (document.hidden) return;
      slides[i].classList.remove("is-on"); if (ticks[i]) ticks[i].classList.remove("on");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-on"); if (ticks[i]) ticks[i].classList.add("on");
      if (cap) { cap.style.opacity = 0; setTimeout(function () { cap.textContent = slides[i].dataset.cap; cap.style.opacity = 1; }, 300); }
    }, 6000);
  })();

  // structure map: IP → technology → generations
  (function () {
    var map = document.getElementById("map");
    if (!map) return;
    var svg = map.querySelector(".map-lines");
    var EDGES = [["ip","ai"],["ip","mv"],["ip","bc"],["ai","u10"],["ai","u20"],["mv","u10"],["mv","u20"],["bc","u20"],["bc","u30"],["bc","u40",1]];
    var NS = "http://www.w3.org/2000/svg";
    function node(id) { return map.querySelector('[data-id="' + id + '"]'); }
    function draw() {
      svg.textContent = "";
      if (getComputedStyle(svg).display === "none") return;
      var m = map.getBoundingClientRect();
      EDGES.forEach(function (e) {
        var a = node(e[0]).getBoundingClientRect(), b = node(e[1]).getBoundingClientRect();
        var x1 = a.right - m.left, y1 = a.top + a.height / 2 - m.top;
        var x2 = b.left - m.left, y2 = b.top + b.height / 2 - m.top, dx = (x2 - x1) * 0.5;
        var p = document.createElementNS(NS, "path");
        p.setAttribute("d", "M" + x1 + " " + y1 + " C" + (x1 + dx) + " " + y1 + " " + (x2 - dx) + " " + y2 + " " + x2 + " " + y2);
        p.dataset.a = e[0]; p.dataset.b = e[1];
        if (e[2]) p.setAttribute("class", "dash");
        svg.appendChild(p);
      });
      if (current) activate(current);
    }
    var current = null;
    function activate(id) {
      current = id;
      map.classList.toggle("has-active", !!id);
      map.querySelectorAll(".node").forEach(function (n) { n.classList.remove("on"); });
      svg.querySelectorAll("path").forEach(function (p) { p.classList.remove("on"); });
      if (!id) return;
      var on = {}; on[id] = 1; on.ip = 1;
      EDGES.forEach(function (e) {
        if (e[0] === id || e[1] === id) { on[e[0]] = on[e[1]] = 1; }
      });
      svg.querySelectorAll("path").forEach(function (p) {
        var a = p.dataset.a, b = p.dataset.b;
        if (a === id || b === id || (a === "ip" && on[b] && b.charAt(0) !== "u")) p.classList.add("on");
      });
      Object.keys(on).forEach(function (k) { var n = node(k); if (n) n.classList.add("on"); });
    }
    var order = ["ai", "mv", "bc"], idx = 0, timer = null, touched = false;
    function cycle() { if (getComputedStyle(svg).display === "none") return activate(null); activate(order[idx++ % order.length]); }
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!still && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (touched) return;
          if (e.isIntersecting && !timer) { cycle(); timer = setInterval(cycle, 2600); }
          else if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
        });
      }, { threshold: 0.3 }).observe(map);
    }
    function stop() { touched = true; if (timer) { clearInterval(timer); timer = null; } }
    map.querySelectorAll(".node.tech, .node.user").forEach(function (n) {
      n.addEventListener("mouseenter", function () { stop(); activate(n.dataset.id); });
      n.addEventListener("click", function () { stop(); activate(current === n.dataset.id ? null : n.dataset.id); });
      n.addEventListener("focus", function () { stop(); activate(n.dataset.id); });
    });
    map.addEventListener("mouseleave", function () { if (touched) activate(null); });
    if ("ResizeObserver" in window) new ResizeObserver(draw).observe(map); else window.addEventListener("resize", draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    window.addEventListener("load", draw);
    draw();
  })();

  // reveal: only below-the-fold elements are hidden, and only once JS runs
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var vh = window.innerHeight;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll(".rv").forEach(function (el) {
    if (el.getBoundingClientRect().top > vh * 0.9) { el.classList.add("pre"); io.observe(el); }
  });
  setTimeout(function () { document.querySelectorAll(".rv.pre").forEach(function (el) { el.classList.remove("pre"); }); }, 4000);
})();
