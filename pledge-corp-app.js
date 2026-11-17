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

  // structure map: IP → technology → audience (horizontal on desktop, vertical layers on mobile)
  (function () {
    var map = document.getElementById("map");
    if (!map) return;
    var svg = map.querySelector(".map-lines");
    var EDGES = [["ip","ai"],["ip","mv"],["ip","bc"],["ai","u10"],["ai","u20"],["mv","u10"],["mv","u30"],["bc","u30"],["bc","u40"]];
    var NS = "http://www.w3.org/2000/svg";
    function node(id) { return map.querySelector('[data-id="' + id + '"]'); }
    function draw() {
      svg.textContent = "";
      if (getComputedStyle(svg).display === "none") return;
      var m = map.getBoundingClientRect();
      var vertical = Math.abs(node("ai").getBoundingClientRect().top - node("mv").getBoundingClientRect().top) < 4;
      EDGES.forEach(function (e) {
        var a = node(e[0]).getBoundingClientRect(), b = node(e[1]).getBoundingClientRect(), d;
        if (vertical) {
          var vx1 = a.left + a.width / 2 - m.left, vy1 = a.bottom - m.top, vx2 = b.left + b.width / 2 - m.left, vy2 = b.top - m.top;
          if (e[0] === "ip") { vx1 = vx2; d = "M" + vx1 + " " + vy1 + " V" + vy2; }
          else {
            // rounded elbow: down → across → down
            var ym = vy1 + (vy2 - vy1) / 2, r = Math.min(10, Math.abs(vx2 - vx1) / 2, (vy2 - vy1) / 4), s = vx2 > vx1 ? 1 : -1;
            d = Math.abs(vx2 - vx1) < 1 ? "M" + vx1 + " " + vy1 + " V" + vy2
              : "M" + vx1 + " " + vy1 + " V" + (ym - r) + " Q" + vx1 + " " + ym + " " + (vx1 + s * r) + " " + ym +
                " H" + (vx2 - s * r) + " Q" + vx2 + " " + ym + " " + vx2 + " " + (ym + r) + " V" + vy2;
          }
        } else {
          var x1 = a.right - m.left, y1 = a.top + a.height / 2 - m.top;
          var x2 = b.left - m.left, y2 = b.top + b.height / 2 - m.top, dx = (x2 - x1) * 0.5;
          d = "M" + x1 + " " + y1 + " C" + (x1 + dx) + " " + y1 + " " + (x2 - dx) + " " + y2 + " " + x2 + " " + y2;
        }
        var p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.dataset.a = e[0]; p.dataset.b = e[1];
        if (vertical && e[0] !== "ip") p.classList.add("v-aud");
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
      if (!id) { caption(null); return; }
      var on = {}; on[id] = 1; on.ip = 1;
      EDGES.forEach(function (e) {
        if (e[0] === id || e[1] === id) { on[e[0]] = on[e[1]] = 1; }
      });
      svg.querySelectorAll("path").forEach(function (p) {
        var a = p.dataset.a, b = p.dataset.b;
        if (a === id || b === id || (a === "ip" && on[b] && b.charAt(0) !== "u")) p.classList.add("on");
      });
      Object.keys(on).forEach(function (k) { var n = node(k); if (n) n.classList.add("on"); });
      caption(id);
    }
    var cap = document.getElementById("mapCap");
    function name(id) { var n = node(id); var b = n && n.querySelector("b"); return b ? b.textContent : ""; }
    function caption(id) {
      if (!cap) return;
      if (!id) { cap.textContent = ""; return; }
      var n = node(id), small = n.querySelector("small"), isTech = n.classList.contains("tech"), peers = [];
      EDGES.forEach(function (e) { if (e[0] === "ip") return; if (e[0] === id) peers.push(name(e[1])); if (e[1] === id) peers.push(name(e[0])); });
      cap.textContent = "";
      var b = document.createElement("b"); b.textContent = name(id); cap.appendChild(b);
      cap.appendChild(document.createTextNode((isTech ? " → " : " ← ") + peers.join(" · ")));
      if (small) { cap.appendChild(document.createElement("br")); cap.appendChild(document.createTextNode(small.textContent)); }
    }
    var order = ["ai", "mv", "bc"], idx = 0, timer = null, touched = false;
    function cycle() { activate(order[idx++ % order.length]); }
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
      n.addEventListener("click", function () { stop(); activate(n.dataset.id); });
      n.addEventListener("focus", function () { stop(); activate(n.dataset.id); });
    });
    map.addEventListener("mouseleave", function () { if (touched) activate(null); });
    if ("ResizeObserver" in window) new ResizeObserver(draw).observe(map); else window.addEventListener("resize", draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    window.addEventListener("load", draw);
    draw();
    if (!current) activate("ai");
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
