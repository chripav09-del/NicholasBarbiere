/* Nicholas Barbiere — script classico (niente moduli: gira anche da file://) */
(function () {
  "use strict";
  window.NB_IN = true;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- entrate ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        // blocchi fratelli entrano uno dopo l'altro
        var sib = [].filter.call(e.target.parentNode.children, function (c) { return c.hasAttribute("data-in"); });
        e.target.style.transitionDelay = Math.min(Math.max(0, sib.indexOf(e.target)) * 60, 240) + "ms";
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-in]").forEach(function (el) { io.observe(el); });
  } else {
    root.classList.add("safe");
  }

  /* ---------- aperto / chiuso (ora di Roma) ---------- */
  // dalla sua pagina di prenotazione: mar-ven 08:00-12:30 e 15:00-19:30, sab 08:00-14:00
  var ORARI = { 2: [[480, 750], [900, 1170]], 3: [[480, 750], [900, 1170]], 4: [[480, 750], [900, 1170]], 5: [[480, 750], [900, 1170]], 6: [[480, 840]] };
  var GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  function hhmm(m) { return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }
  function romeNow() {
    try { return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })); } catch (e) { return new Date(); }
  }
  function stato() {
    var now = romeNow(), d = now.getDay(), m = now.getHours() * 60 + now.getMinutes(), oggi = ORARI[d] || [];
    for (var i = 0; i < oggi.length; i++) if (m >= oggi[i][0] && m < oggi[i][1]) return { open: true, day: d, text: "Aperto, chiude alle " + hhmm(oggi[i][1]) };
    for (var k = 0; k < oggi.length; k++) if (m < oggi[k][0]) return { open: false, day: d, text: "Chiuso, riapre alle " + hhmm(oggi[k][0]) };
    for (var j = 1; j <= 7; j++) {
      var nd = (d + j) % 7;
      if (ORARI[nd]) return { open: false, day: d, text: "Chiuso, apre " + (j === 1 ? "domani" : GIORNI[nd]) + " alle " + hhmm(ORARI[nd][0][0]) };
    }
    return { open: false, day: d, text: "Chiuso" };
  }
  function aggiornaStato() {
    var s = stato();
    $$("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", s.open);
      var t = el.querySelector("[data-status-text]");
      if (t) t.textContent = s.text;
    });
    $$(".hours [data-day]").forEach(function (li) { li.classList.toggle("today", Number(li.getAttribute("data-day")) === s.day); });
  }
  aggiornaStato();
  setInterval(aggiornaStato, 60000);

  /* ---------- ventaglio dei reel ---------- */
  var stage = document.querySelector(".stage"), fan = stage && stage.querySelector(".fan");
  if (fan) {
    var reels = $$(".reel", fan), order = [0, 1, 2], POS = ["l", "c", "r"];
    var paint = function () { order.forEach(function (idx, p) { reels[idx].setAttribute("data-pos", POS[p]); }); };
    var turn = function (dir) { if (dir > 0) order.push(order.shift()); else order.unshift(order.pop()); paint(); };
    reels.forEach(function (r) {
      r.addEventListener("click", function () {
        var p = r.getAttribute("data-pos");
        if (p === "r") turn(1); else if (p === "l") turn(-1);
      });
    });
    var x0 = null;
    stage.addEventListener("pointerdown", function (e) { x0 = e.clientX; }, { passive: true });
    stage.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) turn(dx < 0 ? 1 : -1);
    }, { passive: true });
    if (!reduce && window.matchMedia("(hover: hover)").matches) {
      var raf = 0;
      stage.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var b = stage.getBoundingClientRect();
          fan.style.setProperty("--ry", (((e.clientX - b.left) / b.width - 0.5) * 10).toFixed(2) + "deg");
          fan.style.setProperty("--rx", ((0.5 - (e.clientY - b.top) / b.height) * 8).toFixed(2) + "deg");
        });
      });
      stage.addEventListener("pointerleave", function () { fan.style.setProperty("--ry", "0deg"); fan.style.setProperty("--rx", "0deg"); });
    }
    // l'entrata è in CSS (.fan.intro); si toglie prima del primo giro, così non si ripete
    var endIntro = function () { fan.classList.remove("intro"); };
    setTimeout(endIntro, 900);
    stage.addEventListener("pointerdown", endIntro, { once: true, passive: true });
  }

  /* ---------- consigliere di sfumatura ---------- */
  var adv = document.getElementById("consigliere");
  if (adv) {
    var ALT = {
      bassa: { y: 226, nome: "bassa", tip: "La più discreta: sfuma solo sopra il collo e attorno alle orecchie." },
      media: { y: 190, nome: "media", tip: "La via di mezzo: la sfumatura sale fino a metà testa." },
      alta:  { y: 152, nome: "alta",  tip: "La più decisa: sfuma fin quasi in cima e fa risaltare la parte sopra." }
    };
    var RIA = {
      "0":   { d: 0.00, label: "0",   mm: "a zero", tip: "A zero sotto si vede la pelle: lo stacco è il più netto." },
      "0.5": { d: 0.16, label: "0,5", mm: "1,5 mm", tip: "Con lo 0,5 sotto resta appena un'ombra." },
      "1":   { d: 0.30, label: "1",   mm: "3 mm",   tip: "Con l'1 sotto l'ombra è leggera ma si vede." },
      "2":   { d: 0.50, label: "2",   mm: "6 mm",   tip: "Con il 2 sotto resta un tappeto corto: effetto morbido." },
      "3":   { d: 0.68, label: "3",   mm: "9 mm",   tip: "Con il 3 sotto la sfumatura è la più morbida e naturale." }
    };
    var G = 64, BOTTOM = 266;
    var el = {
      top: adv.querySelector("#fm-top"), grad: adv.querySelector("#fm-grad"), low: adv.querySelector("#fm-low"),
      stop: adv.querySelector("#fg-end"), line: adv.querySelector("#fade-line"), mm: adv.querySelector("#fig-mm"),
      say: adv.querySelector("[data-say]"), tip: adv.querySelector("[data-tip]"), box: adv.querySelector(".advice")
    };
    var now = { y: ALT.media.y, d: RIA["1"].d }, anim = null;
    var draw = function (v) {
      el.top.setAttribute("height", v.y.toFixed(1));
      el.grad.setAttribute("y", v.y.toFixed(1));
      el.low.setAttribute("y", (v.y + G).toFixed(1));
      el.low.setAttribute("height", Math.max(0, BOTTOM - v.y - G).toFixed(1));
      el.low.setAttribute("fill-opacity", v.d.toFixed(3));
      el.stop.setAttribute("stop-opacity", v.d.toFixed(3));
      el.line.setAttribute("transform", "translate(0 " + v.y.toFixed(1) + ")");
    };
    var tween = function (to) {
      if (anim) cancelAnimationFrame(anim);
      if (reduce) { now = to; draw(now); return; }
      var from = { y: now.y, d: now.d }, t0 = performance.now();
      (function step(t) {
        var k = Math.min(1, (t - t0) / 240), e = 1 - Math.pow(1 - k, 4);
        now = { y: from.y + (to.y - from.y) * e, d: from.d + (to.d - from.d) * e };
        draw(now);
        if (k < 1) anim = requestAnimationFrame(step);
      })(t0);
    };
    var val = function (name) { var c = adv.querySelector("input[name=" + name + "]:checked"); return c ? c.value : null; };
    var update = function (animate) {
      var a = ALT[val("altezza")] || ALT.media, r = RIA[val("rialzo")] || RIA["1"];
      var sotto = r.label === "0" ? "a zero sotto" : "rialzo " + r.label + " sotto";
      var swap = function () {
        el.say.textContent = "«Sfumatura " + a.nome + ", " + sotto + ".»";
        el.tip.textContent = a.tip + " " + r.tip;
        el.mm.textContent = r.label === "0" ? "sotto: a zero" : "sotto: " + r.label + " · " + r.mm;
      };
      if (animate && !reduce) {
        el.box.classList.add("is-swap");
        setTimeout(function () { swap(); el.box.classList.remove("is-swap"); }, 120);
        tween({ y: a.y, d: r.d });
      } else { swap(); now = { y: a.y, d: r.d }; draw(now); }
    };
    adv.addEventListener("change", function () { update(true); });
    update(false);
  }

  /* ---------- striscia dei lavori: si ferma col dito ---------- */
  $$("[data-strip]").forEach(function (strip) {
    strip.addEventListener("click", function () { strip.classList.toggle("is-paused"); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { strip.style.setProperty("--run", e[0].isIntersecting ? "running" : "paused"); }).observe(strip);
    }
  });

  /* ---------- recensioni: una alla volta ---------- */
  var box = document.querySelector("[data-quotes]");
  if (box) {
    var qs = $$(".q", box), count = box.querySelector("[data-count]"), barI = box.querySelector("[data-qbar]");
    var cur = 0, timer = null, visible = false, touched = false;
    var show = function (n) {
      qs[cur].classList.remove("is-on");
      cur = (n + qs.length) % qs.length;
      qs[cur].classList.add("is-on");
      count.textContent = (cur + 1) + " / " + qs.length;
    };
    var restartBar = function () {
      if (!barI) return;
      barI.classList.remove("run"); void barI.offsetWidth;
      if (!reduce && !touched && visible) barI.classList.add("run");
    };
    var play = function () {
      clearInterval(timer); timer = null;
      if (reduce || touched || !visible) { restartBar(); return; }
      timer = setInterval(function () { show(cur + 1); restartBar(); }, 7000);
      restartBar();
    };
    box.querySelector("[data-prev]").addEventListener("click", function () { touched = true; show(cur - 1); play(); });
    box.querySelector("[data-next]").addEventListener("click", function () { touched = true; show(cur + 1); play(); });
    var sx = null;
    box.addEventListener("pointerdown", function (e) { sx = e.clientX; }, { passive: true });
    box.addEventListener("pointerup", function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) { touched = true; show(cur + (dx < 0 ? 1 : -1)); play(); }
    }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; play(); }, { threshold: 0.4 }).observe(box);
    }
  }

  /* ---------- barra in basso ---------- */
  var barEl = document.querySelector(".bar"), heroCta = document.querySelector(".hero-cta");
  if (barEl) {
    if (heroCta && "IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { barEl.classList.toggle("is-on", !e[0].isIntersecting && e[0].boundingClientRect.top < 0); }).observe(heroCta);
    } else { barEl.classList.add("is-on"); }
  }

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
