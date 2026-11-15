// PLEDGE Inc. corporate v8 — language toggle + fail-open scroll reveal
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

  var hd = document.querySelector(".hd");
  function onScroll() { if (hd) hd.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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
