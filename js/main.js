/* Nicholas Barbiere — script classico (niente moduli: gira anche da file://) */
(function () {
  "use strict";
  window.NB_IN = true;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/393890097426?text=";
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- entrate ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sib = $$("[data-in]", el.parentNode).filter(function (c) { return c.parentNode === el.parentNode; });
        el.style.transitionDelay = Math.min(Math.max(0, sib.indexOf(el)) * 40, 160) + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-in]").forEach(function (el) { io.observe(el); });
  } else {
    root.classList.add("safe");
  }

  /* ---------- aperto / chiuso (ora di Roma) ---------- */
  // dalla sua pagina di prenotazione: mar-ven 08:00-12:30 e 15:00-19:30, sab 08:00-14:00
  var ORARI = { 2: [[480, 750], [900, 1170]], 3: [[480, 750], [900, 1170]], 4: [[480, 750], [900, 1170]], 5: [[480, 750], [900, 1170]], 6: [[480, 840]] };
  var GIORNI = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
  function hhmm(m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
  function romeNow() {
    try { return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })); } catch (e) { return new Date(); }
  }
  function stato() {
    var now = romeNow(), d = now.getDay(), m = now.getHours() * 60 + now.getMinutes(), oggi = ORARI[d] || [];
    for (var i = 0; i < oggi.length; i++) if (m >= oggi[i][0] && m < oggi[i][1]) return { open: true, day: d, text: "Aperto · fino alle " + hhmm(oggi[i][1]) };
    for (var k = 0; k < oggi.length; k++) if (m < oggi[k][0]) return { open: false, day: d, text: "Chiuso · riapre " + hhmm(oggi[k][0]) };
    for (var j = 1; j <= 7; j++) {
      var nd = (d + j) % 7;
      if (ORARI[nd]) return { open: false, day: d, text: "Chiuso · " + (j === 1 ? "domani" : GIORNI[nd]) + " " + hhmm(ORARI[nd][0][0]) };
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
    $$(".hours [data-day]").forEach(function (li) {
      var d = Number(li.getAttribute("data-day"));
      li.classList.toggle("today", d === s.day || (d === 0 && s.day === 1));
    });
  }
  aggiornaStato();
  setInterval(aggiornaStato, 60000);

  /* ---------- ventaglio dei reel ---------- */
  var stage = document.querySelector(".stage"), fan = stage && stage.querySelector(".fan");
  if (fan) {
    var reels = $$(".reel", fan), order = [0, 1, 2]; // indici in posizione l, c, r
    var POS = ["l", "c", "r"];
    var paint = function () { order.forEach(function (idx, p) { reels[idx].setAttribute("data-pos", POS[p]); }); };
    var turn = function (dir) { // dir 1 = porta avanti quello a destra
      if (dir > 0) order.push(order.shift()); else order.unshift(order.pop());
      paint();
    };
    reels.forEach(function (r) {
      r.addEventListener("click", function () {
        var p = r.getAttribute("data-pos");
        if (p === "r") turn(1); else if (p === "l") turn(-1);
      });
    });
    // trascina di lato per girare
    var x0 = null;
    stage.addEventListener("pointerdown", function (e) { x0 = e.clientX; }, { passive: true });
    stage.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) turn(dx < 0 ? 1 : -1);
    }, { passive: true });
    // inclinazione 3D col puntatore (solo dove c'è il mouse)
    if (!reduce && window.matchMedia("(hover: hover)").matches) {
      var raf = 0;
      stage.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var b = stage.getBoundingClientRect();
          var px = (e.clientX - b.left) / b.width - 0.5, py = (e.clientY - b.top) / b.height - 0.5;
          fan.style.setProperty("--ry", (px * 10).toFixed(2) + "deg");
          fan.style.setProperty("--rx", (-py * 8).toFixed(2) + "deg");
        });
      });
      stage.addEventListener("pointerleave", function () { fan.style.setProperty("--ry", "0deg"); fan.style.setProperty("--rx", "0deg"); });
    }
    // entrata: le carte partono impilate al centro e si aprono (sempre visibili, anche se i timer tardano)
    if (!reduce) {
      reels.forEach(function (r) { r.setAttribute("data-pos", "c"); });
      reels[1].style.zIndex = "4";
      setTimeout(function () { reels[1].style.zIndex = ""; paint(); }, 220);
    }
  }

  /* ---------- telefono: i tre passi della prenotazione ---------- */
  var track = document.querySelector("[data-ph-track]");
  if (track) {
    var steps = $$(".step[data-step]"), bar = document.querySelector("[data-ph-bar]"), label = document.querySelector("[data-ph-step]");
    var NOMI = ["Passo 1 · Servizio", "Passo 2 · Operatore", "Passo 3 · Giorno"], cur = 0, timer = null, visible = false;
    var go = function (n) {
      cur = (n + 3) % 3;
      track.style.transform = "translateX(" + (-100 * cur) + "%)";
      bar.style.width = ((cur + 1) * 33.34) + "%";
      label.textContent = NOMI[cur];
      steps.forEach(function (s, i) { s.classList.toggle("is-on", i === cur); s.setAttribute("aria-selected", i === cur ? "true" : "false"); });
    };
    var play = function () { stop(); if (!reduce && visible) timer = setInterval(function () { go(cur + 1); }, 2800); };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    steps.forEach(function (s) { s.addEventListener("click", function () { go(Number(s.getAttribute("data-step"))); play(); }); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? play() : stop(); }, { threshold: 0.3 }).observe(track.closest(".phone"));
    }
    go(0);
  }

  /* ---------- foglio «con chi ti siedi» ---------- */
  var sheet = document.getElementById("sheet"), lastFocus = null;
  function openSheet(e) {
    if (!sheet) return;
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    sheet.classList.remove("is-closing");
    sheet.style.transform = "";
    if (typeof sheet.showModal === "function") sheet.showModal(); else sheet.setAttribute("open", "");
  }
  function closeSheet() {
    if (!sheet || !sheet.open) return;
    var finish = function () {
      sheet.classList.remove("is-closing");
      sheet.style.transform = "";
      if (typeof sheet.close === "function") sheet.close(); else sheet.removeAttribute("open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    if (reduce) { finish(); return; }
    sheet.classList.add("is-closing");
    setTimeout(finish, 180);
  }
  $$("[data-sheet]").forEach(function (b) { b.addEventListener("click", openSheet); });
  if (sheet) {
    sheet.addEventListener("cancel", function (e) { e.preventDefault(); closeSheet(); });
    sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    $$("[data-close]", sheet).forEach(function (b) { b.addEventListener("click", closeSheet); });
    var grip = sheet.querySelector(".sheet-grip"), y0 = null, dy = 0;
    if (grip) {
      grip.addEventListener("pointerdown", function (e) { y0 = e.clientY; dy = 0; grip.setPointerCapture(e.pointerId); sheet.style.transition = "none"; });
      grip.addEventListener("pointermove", function (e) {
        if (y0 === null) return;
        dy = e.clientY - y0;
        sheet.style.transform = "translateY(" + (dy > 0 ? dy : dy / 6) + "px)";
      });
      var end = function () {
        if (y0 === null) return;
        y0 = null;
        sheet.style.transition = "transform 200ms cubic-bezier(0.23, 1, 0.32, 1)";
        if (dy > 90) closeSheet(); else sheet.style.transform = "";
        setTimeout(function () { sheet.style.transition = ""; }, 220);
      };
      grip.addEventListener("pointerup", end);
      grip.addEventListener("pointercancel", end);
      grip.addEventListener("click", function () { if (Math.abs(dy) < 4) closeSheet(); });
    }
  }

  /* ---------- consigliere di sfumatura ---------- */
  var adv = document.getElementById("consigliere");
  if (adv) {
    var ALT = {
      bassa: { y: 226, nome: "bassa", tip: "La più discreta: sfuma solo sopra il collo e attorno alle orecchie. Si nota poco e cresce senza stacchi." },
      media: { y: 190, nome: "media", tip: "La via di mezzo: la sfumatura sale fino a metà testa. Pulita, si vede senza essere drastica." },
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
      say: adv.querySelector("[data-say]"), tip: adv.querySelector("[data-tip]"), wa: adv.querySelector("[data-wa]"), box: adv.querySelector(".advice")
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
        el.wa.href = WA + encodeURIComponent("Ciao Nicholas, vorrei prenotare un taglio sfumato: sfumatura " + a.nome + ", " + sotto + ". Quando avete posto?");
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

  /* ---------- caroselli: indicatore ---------- */
  $$(".rail[data-dots]").forEach(function (rail) {
    var dots = document.getElementById(rail.getAttribute("data-dots"));
    if (!dots) return;
    var n = rail.children.length, html = "", ticking = false;
    for (var i = 0; i < n; i++) html += "<i></i>";
    dots.innerHTML = html;
    var mark = function () {
      ticking = false;
      var first = rail.children[0], w = first ? first.getBoundingClientRect().width + 12 : 1;
      var idx = Math.round(rail.scrollLeft / w);
      if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4) idx = n - 1;
      [].forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k === idx); });
    };
    rail.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }, { passive: true });
    mark();
  });

  /* ---------- barra in basso ---------- */
  var barEl = document.querySelector(".bar"), heroCta = document.querySelector(".hero-cta");
  if (barEl) {
    if (heroCta && "IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { barEl.classList.toggle("is-on", !e[0].isIntersecting); }).observe(heroCta);
    } else { barEl.classList.add("is-on"); }
  }
  var scale = document.querySelector(".bar-scale");
  if (scale) {
    var tk = false;
    var fill = function () {
      tk = false;
      var h = root.scrollHeight - window.innerHeight;
      scale.style.setProperty("--p", h > 0 ? Math.min(1, window.scrollY / h).toFixed(3) : "0");
    };
    window.addEventListener("scroll", function () { if (!tk) { tk = true; requestAnimationFrame(fill); } }, { passive: true });
    fill();
  }

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
