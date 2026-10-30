(function () {
  // Sold items: set data-sold="true" on an <article>. They sink to the bottom with a stamp.
  var catalogEl = document.getElementById("catalog");
  var all = Array.prototype.slice.call(catalogEl.querySelectorAll("article.card"));
  function isSold(c) { return c.getAttribute("data-sold") === "true"; }
  function price(c) { return parseInt(c.getAttribute("data-price-mxn") || "0", 10); }
  all.map(function (c, i) { return { c: c, i: i }; })
    .sort(function (a, b) {
      var s = isSold(a.c) - isSold(b.c);
      if (s) return s;
      var p = price(b.c) - price(a.c);
      return p || a.i - b.i;
    })
    .forEach(function (o, n) {
      catalogEl.appendChild(o.c);
      var idx = o.c.querySelector(".idx");
      if (idx) idx.textContent = (n < 9 ? "0" : "") + (n + 1);
      o.c.classList.toggle("sold", isSold(o.c));
      var row = o.c.querySelector(".toprow");
      if (isSold(o.c) && row && !row.querySelector(".chip")) {
        var chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = "Sold · Vendido";
        row.appendChild(chip);
      }
    });
  var nSold = all.filter(isSold).length, nAvail = all.length - nSold;
  var cEn = document.querySelector('[data-count="en"]');
  var cEs = document.querySelector('[data-count="es"]');
  if (cEn) cEn.textContent = nAvail + " available" + (nSold ? " · " + nSold + " sold" : "");
  if (cEs) cEs.textContent = nAvail + " disponibles" + (nSold ? " · " + nSold + (nSold === 1 ? " vendido" : " vendidos") : "");

  document.querySelectorAll("article.card").forEach(function (card) {
    var photos = [];
    try { photos = JSON.parse(card.getAttribute("data-photos") || "[]"); }
    catch (e) { photos = []; }
    var n = photos.length;
    var photoBox = card.querySelector(".photo");
    if (photoBox && !photoBox.querySelector(".photo-count")) {
      var badge = document.createElement("span");
      badge.className = "photo-count";
      badge.textContent = n === 1 ? "1 photo · 1 foto" : n + " photos · " + n + " fotos";
      photoBox.appendChild(badge);
    }
    var hero = card.querySelector("img.hero");
    if (hero) {
      var name = (card.querySelector("h2") || {}).textContent || "item";
      var en = card.getAttribute("data-title-en") || name;
      var es = card.getAttribute("data-title-es") || "";
      hero.setAttribute("aria-label", n === 1
        ? "View photo of " + en + (es ? " / Ver foto de " + es : "")
        : "View " + n + " photos of " + en + (es ? " / Ver " + n + " fotos de " + es : ""));
    }
  });

  var lb = document.getElementById("lightbox");
  var lbImg = lb.querySelector(".lb-img");
  var lbCaption = lb.querySelector(".lb-caption");
  var lbCounter = lb.querySelector(".lb-counter");
  var lbStrip = lb.querySelector(".lb-strip");
  var btnPrev = lb.querySelector(".lb-prev");
  var btnNext = lb.querySelector(".lb-next");
  var btnClose = lb.querySelector(".lb-close");
  var gallery = [];
  var index = 0;
  var title = "";
  var lastFocus = null;
  var isOpen = false;

  function parsePhotos(card) {
    try { return JSON.parse(card.getAttribute("data-photos") || "[]"); }
    catch (e) { return []; }
  }

  function focusables() {
    var nodes = [btnClose];
    if (!lb.classList.contains("single")) {
      nodes.push(btnPrev, btnNext);
    }
    lbStrip.querySelectorAll("button").forEach(function (b) { nodes.push(b); });
    return nodes.filter(function (el) {
      return el && !el.disabled && el.offsetParent !== null;
    });
  }

  function show(i) {
    if (!gallery.length) return;
    index = (i + gallery.length) % gallery.length;
    var src = gallery[index];
    lbImg.setAttribute("src", src);
    lbImg.setAttribute("alt", title + " — photo " + (index + 1) + " of " + gallery.length + " / foto " + (index + 1) + " de " + gallery.length);
    lbCaption.textContent = title;
    lbCounter.textContent = (index + 1) + " / " + gallery.length;
    lbStrip.querySelectorAll("button").forEach(function (b, n) {
      b.setAttribute("aria-current", n === index ? "true" : "false");
      if (n === index) {
        try { b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }
        catch (e) {}
      }
    });
    var preload = [gallery[(index + 1) % gallery.length], gallery[(index - 1 + gallery.length) % gallery.length]];
    preload.forEach(function (p) {
      if (p && p !== src) { var im = new Image(); im.src = p; }
    });
  }

  function openLightbox(card, startSrc) {
    gallery = parsePhotos(card);
    if (!gallery.length) return;
    var enT = (card.getAttribute("data-title-en") || "").trim();
    var esT = (card.getAttribute("data-title-es") || "").trim();
    title = enT && esT ? enT + " / " + esT : (enT || esT || ((card.querySelector("h2") || {}).textContent || "").trim());
    if (isSold(card)) title += " (Sold / Vendido)";
    var start = gallery.indexOf(startSrc);
    if (start < 0) start = 0;
    lastFocus = document.activeElement;
    isOpen = true;
    lb.hidden = false;
    lb.classList.add("open");
    lb.classList.toggle("single", gallery.length < 2);
    document.documentElement.classList.add("lb-open");
    lbStrip.innerHTML = "";
    gallery.forEach(function (src, n) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Photo " + (n + 1) + " / Foto " + (n + 1));
      var im = document.createElement("img");
      im.src = src;
      im.alt = "";
      b.appendChild(im);
      b.addEventListener("click", function () { show(n); });
      lbStrip.appendChild(b);
    });
    show(start);
    btnClose.focus();
  }

  function closeLightbox() {
    if (!isOpen) return;
    isOpen = false;
    lb.classList.remove("open");
    lb.hidden = true;
    document.documentElement.classList.remove("lb-open");
    lbImg.removeAttribute("src");
    lbStrip.innerHTML = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.getElementById("catalog").addEventListener("click", function (e) {
    var el = e.target.closest("[data-photo]");
    if (!el || !document.getElementById("catalog").contains(el)) return;
    var card = el.closest("article.card");
    if (!card) return;
    e.preventDefault();
    openLightbox(card, el.getAttribute("data-photo"));
  });

  document.getElementById("catalog").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest("img.hero[data-photo]");
    if (!el) return;
    e.preventDefault();
    var card = el.closest("article.card");
    if (!card) return;
    openLightbox(card, el.getAttribute("data-photo"));
  });

  btnClose.addEventListener("click", closeLightbox);
  lb.querySelector(".lb-backdrop").addEventListener("click", closeLightbox);
  btnPrev.addEventListener("click", function () { show(index - 1); });
  btnNext.addEventListener("click", function () { show(index + 1); });

  document.addEventListener("keydown", function (e) {
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      show(index - 1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      show(index + 1);
      return;
    }
    if (e.key === "Tab") {
      var f = focusables();
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey) {
        if (i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      } else {
        if (i === -1 || i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    }
  });
})();
