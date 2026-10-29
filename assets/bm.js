(function () {
  var root = document.body;
  if (!root) return;

  function parseTime(value) {
    var time = Date.parse(value);
    return Number.isNaN(time) ? null : time;
  }

  function phaseFor(now) {
    var mode = root.getAttribute("data-bm-phase-mode") || "auto";
    if (mode === "pre" || mode === "live" || mode === "post") return mode;
    var end = parseTime(root.getAttribute("data-bm-end"));
    if (!end) return root.getAttribute("data-bm-phase") || "live";
    if (now > end) return "post";
    return "live";
  }

  var params = new URLSearchParams(window.location.search);
  var preview = params.has("preview_theme_id") || (window.Shopify && (Shopify.designMode || Shopify.previewMode || Shopify.visualPreviewMode));
  // Sticky test clock (preview/theme-editor only): ?bm_now=<ISO date> is stored in sessionStorage and re-applied on every page of this
  // tab/session; ?bm_now=off|clear removes it. Without an explicit bm_now (and outside preview) nothing changes for customers.
  var BM_NOW_KEY = "bm_now_test";
  var override = null;
  (function () {
    var q = params.get("bm_now");
    var stored = null;
    try {
      if (!preview) { sessionStorage.removeItem(BM_NOW_KEY); return; }
      if (q !== null) {
        q = q.trim().replace(/\s(\d\d:?\d\d)$/, "+$1"); // an unencoded "+" in the URL arrives as a space
        if (!q || /^(off|clear|none|reset)$/i.test(q)) sessionStorage.removeItem(BM_NOW_KEY);
        else if (parseTime(q)) sessionStorage.setItem(BM_NOW_KEY, q);
      }
      stored = sessionStorage.getItem(BM_NOW_KEY);
    } catch (e) {
      stored = preview && q && parseTime(q) ? q : null;
    }
    override = stored && parseTime(stored) ? stored : null;
  })();
  var clockOffset = 0;
  if (override && preview && root.getAttribute("data-bm-enabled") === "true") {
    var parsed = parseTime(override);
    if (parsed) {
      clockOffset = parsed - Date.now();
      var phase = phaseFor(Date.now() + clockOffset);
      root.setAttribute("data-bm-phase", phase);
      root.classList.toggle("bm-on", phase === "pre" || phase === "live");
    }
  }
  if (override && preview) {
    // visible marker so testers know the clock is simulated; click to leave test mode
    var bmPill = document.createElement("div");
    bmPill.setAttribute("data-bm-test-pill", "");
    bmPill.setAttribute("style", "position:fixed;left:12px;bottom:64px;z-index:2147483000;background:#b00020;color:#fff;font:600 12px/1.3 system-ui,sans-serif;padding:7px 12px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;gap:10px;align-items:center;");
    var bmPillDate = new Date(parseTime(override)).toLocaleString("da-DK", { timeZone: "Europe/Copenhagen", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    var bmPillText = document.createElement("span");
    bmPillText.textContent = "TESTTILSTAND: dato " + bmPillDate;
    var bmPillOff = document.createElement("a");
    bmPillOff.textContent = "afslut";
    bmPillOff.setAttribute("href", "#");
    bmPillOff.setAttribute("style", "color:#fff;text-decoration:underline;");
    bmPillOff.addEventListener("click", function (ev) {
      ev.preventDefault();
      try { sessionStorage.removeItem(BM_NOW_KEY); } catch (e) {}
      var u = new URL(window.location.href);
      u.searchParams.set("bm_now", "off");
      window.location.href = u.toString();
    });
    bmPill.appendChild(bmPillText);
    bmPill.appendChild(bmPillOff);
    document.body.appendChild(bmPill);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function tick() {
    var phaseNow = phaseFor(Date.now() + clockOffset);
    if (override && preview) root.setAttribute("data-bm-phase", phaseNow);
    var targetAttr = phaseNow === "pre" ? "data-bm-start" : "data-bm-end";
    document.querySelectorAll("[data-bm-countdown]").forEach(function (box) {
      var target = parseTime(box.getAttribute(targetAttr));
      var diff = Math.max(0, (target || 0) - (Date.now() + clockOffset));
      var total = Math.floor(diff / 1000);
      var days = Math.floor(total / 86400);
      var hours = Math.floor((total % 86400) / 3600);
      var minutes = Math.floor((total % 3600) / 60);
      var seconds = total % 60;
      var daysEl = box.querySelector("[data-bm-days]");
      var hoursEl = box.querySelector("[data-bm-hours]");
      var minutesEl = box.querySelector("[data-bm-minutes]");
      var secondsEl = box.querySelector("[data-bm-seconds]");
      if (daysEl) daysEl.textContent = pad(days);
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minutesEl) minutesEl.textContent = pad(minutes);
      if (secondsEl) secondsEl.textContent = pad(seconds);
      var label = box.querySelector("[data-bm-countdown-label]");
      if (label) {
        label.textContent = phaseNow === "pre" ? label.getAttribute("data-label-pre") : label.getAttribute("data-label-live");
      }
    });
  }

  if (document.querySelector("[data-bm-countdown]")) {
    tick();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches || true) {
      window.setInterval(tick, 1000);
    }
  }

  var announcement = document.querySelector("[data-bm-announcement]");
  if (announcement) {
    if (window.sessionStorage && sessionStorage.getItem("bm-announcement-hidden") === "1") {
      announcement.hidden = true;
    }
    var slides = Array.prototype.slice.call(announcement.querySelectorAll("[data-bm-ann-slide]"));
    var slideIndex = 0;
    function showSlide(next) {
      if (!slides.length) return;
      slides[slideIndex].classList.remove("is-active");
      slideIndex = (next + slides.length) % slides.length;
      slides[slideIndex].classList.add("is-active");
    }
    var prev = announcement.querySelector("[data-bm-ann-prev]");
    var nextBtn = announcement.querySelector("[data-bm-ann-next]");
    var close = announcement.querySelector("[data-bm-ann-close]");
    var annTimer = null;
    function annStart() {
      if (annTimer || slides.length < 2) return;
      annTimer = window.setInterval(function () { showSlide(slideIndex + 1); }, 4000);
    }
    function annStop() { if (annTimer) { window.clearInterval(annTimer); annTimer = null; } }
    announcement.addEventListener("mouseenter", annStop);
    announcement.addEventListener("mouseleave", annStart);
    annStart();
    if (prev) prev.addEventListener("click", function () { annStop(); showSlide(slideIndex - 1); annStart(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { annStop(); showSlide(slideIndex + 1); annStart(); });
    if (close) close.addEventListener("click", function () {
      announcement.hidden = true;
      try { sessionStorage.setItem("bm-announcement-hidden", "1"); } catch (error) {}
    });
  }

  document.querySelectorAll("[data-bm-carousel]").forEach(function (carousel) {
    var track = carousel.querySelector("[data-bm-track]");
    var prevBtn = carousel.querySelector("[data-bm-prev]");
    var nextBtn = carousel.querySelector("[data-bm-next]");
    if (!track) return;
    var amount = function () { return Math.max(220, track.clientWidth * 0.7); };
    if (prevBtn) prevBtn.addEventListener("click", function () { track.scrollBy({ left: -amount(), behavior: "smooth" }); });
    if (nextBtn) nextBtn.addEventListener("click", function () { track.scrollBy({ left: amount(), behavior: "smooth" }); });
  });

  function formatMoney(cents, format) {
    var amount = (cents / 100).toFixed(2);
    var withComma = amount.replace(".", ",");
    var parts = withComma.split(",");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    var pretty = parts.join(",");
    if (!format) return pretty;
    return format
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, pretty)
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/g, parts[0])
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, parts[0].replace(/\./g, ","))
      .replace(/\{\{\s*amount\s*\}\}/g, amount);
  }

  // ---- Gift start gate: the free snack basket must not be promised or auto-added before the BXGY discount starts ----
  // Must equal the startsAt of the "Black Month | Gratis snackkurv" automatic discount (2026-10-29T23:01:00Z = 30.10 00:01 CET).
  var BM_GIFT_START = "2026-10-29T23:01:00Z";
  function giftOpen(box) {
    var raw = (box && box.getAttribute("data-gift-start")) || BM_GIFT_START;
    var t = Date.parse(raw);
    var e = Date.parse((box && box.getAttribute("data-gift-end")) || "2026-11-30T22:59:00Z"); // endsAt of the BXGY discount
    var now = Date.now() + clockOffset;
    if (!isNaN(e) && now >= e) return false;
    if (isNaN(t)) return true;
    return now >= t;
  }
  function gated(box) { return !!(box && box.hasAttribute("data-gift-start")); }
  function effSnack(box) {
    var snack = Number(box.getAttribute("data-snack") || 0);
    return gated(box) && !giftOpen(box) ? 0 : snack;
  }

  function messageFor(total, box) {
    var ship = Number(box.getAttribute("data-ship") || 0);
    var snack = effSnack(box);
    var goal = Math.max(ship, snack);
    var format = box.getAttribute("data-money-format");
    var fm = function (c) { return formatMoney(c, format).replace(/,00(?=\D|$)/, ""); };
    if (snack > 0 && total >= snack) return box.getAttribute("data-msg-both");
    if (ship > 0 && total >= ship && snack <= 0) return box.getAttribute("data-msg-ship");
    if (ship > 0 && total >= ship) {
      return box.getAttribute("data-msg-ship") + " · " + box.getAttribute("data-msg-need") + " " + fm(snack - total) + " " + box.getAttribute("data-msg-goal-snack");
    }
    if (total > 0 && ship > 0) {
      return box.getAttribute("data-msg-need") + " " + fm(ship - total) + " " + box.getAttribute("data-msg-goal-ship");
    }
    if (snack <= 0 && box.getAttribute("data-msg-empty-pre")) return box.getAttribute("data-msg-empty-pre");
    return box.getAttribute("data-msg-empty");
  }

  function paintShip(total) {
    document.querySelectorAll("[data-bm-ship]").forEach(function (box) {
      var ship = Number(box.getAttribute("data-ship") || 0);
      var snack = effSnack(box);
      var goal = Math.max(ship, snack, 1);
      var fill = Math.min(100, Math.round((total / goal) * 100));
      var fillEl = box.querySelector("[data-bm-ship-fill]");
      var msg = box.querySelector("[data-bm-ship-msg]");
      var amount = box.querySelector("[data-bm-ship-amount]");
      if (fillEl) fillEl.style.width = fill + "%";
      var m1 = box.querySelector("[data-bm-m1]"), m2 = box.querySelector("[data-bm-m2]");
      if (m1) m1.classList.toggle("is-on", ship > 0 && total >= ship);
      if (m2) m2.classList.toggle("is-on", snack > 0 && total >= snack);
      if (gated(box)) {
        box.classList.toggle("is-pregift", snack <= 0);
        if (m1) m1.style.left = Math.round((ship / goal) * 100) + "%";
        var lbl = box.querySelector(".bm-cp__lbl");
        if (lbl) lbl.style.gridTemplateColumns = Math.round((ship / goal) * 100) + "fr " + (100 - Math.round((ship / goal) * 100)) + "fr";
        var open = snack > 0;
        document.querySelectorAll("[data-bm-gift-block]").forEach(function (g) { g.hidden = !open; });
      }
      if (msg) msg.textContent = messageFor(total, box);
      if (amount) amount.textContent = total > 0 ? formatMoney(total, box.getAttribute("data-money-format")) : formatMoney(ship, box.getAttribute("data-money-format"));
    });
  }


  // ---- Black Month: free snack basket auto-add (one line, qty 1, property _bm_gift) ----
  function bmIsGift(item, vid) {
    return !!(item && ((item.properties && item.properties._bm_gift) || (vid && item.variant_id === vid)));
  }
  function bmGiftLines(cart, vid) {
    return ((cart && cart.items) || []).filter(function (it) { return bmIsGift(it, vid); });
  }
  function bmBaseTotal(cart) {
    var total = (cart && cart.total_price) || 0;
    bmGiftLines(cart, bmGiftCfg().vid).forEach(function (it) { total -= it.final_line_price || 0; });
    return Math.max(0, total);
  }
  var bmGiftTestVid = null;
  (function () {
    // preview-only test override: ?bm_gift_vid=<variant id> (honored only with preview_theme_id)
    try {
      var q = params.get("bm_gift_vid");
      if (preview && q && /^\d+$/.test(q)) sessionStorage.setItem("bm_gift_vid", q);
      if (preview) bmGiftTestVid = Number(sessionStorage.getItem("bm_gift_vid")) || null;
    } catch (e) {}
  })();
  function bmGiftCfg() {
    var box = document.querySelector("[data-bm-ship]");
    var live = root.classList.contains("bm-on") && (root.getAttribute("data-bm-phase") || "live") === "live";
    var vid = box ? Number(box.getAttribute("data-gift-variant") || 0) : 0;
    if (bmGiftTestVid) vid = bmGiftTestVid;
    return {
      box: box,
      on: !!(box && live && vid && giftOpen(box)),
      vid: vid || null,
      threshold: box ? Number(box.getAttribute("data-snack") || 0) : 0
    };
  }
  function bmGiftState(cart) {
    try {
      var raw = JSON.parse(sessionStorage.getItem("bm_gift_state") || "null");
      if (raw && raw.t === cart.token) return raw.s || "";
    } catch (e) {}
    return "";
  }
  function bmSetGiftState(cart, s) {
    try {
      if (!s) sessionStorage.removeItem("bm_gift_state");
      else sessionStorage.setItem("bm_gift_state", JSON.stringify({ t: cart.token, s: s }));
    } catch (e) {}
  }
  var bmGiftBusy = false, bmGiftGen = 0, bmGiftOps = 0, bmGiftWindow = Date.now();
  function bmGiftRerender() {
    // re-render the drawer / cart page via the Section Rendering API (the theme has no cart-update listener)
    var drawer = document.querySelector("cart-drawer");
    var main = document.getElementById("main-cart");
    var ids = ["cart-icon-bubble"];
    if (drawer) ids.push("cart-drawer");
    if (main && main.dataset.id) ids.push(main.dataset.id);
    var url = new URL(window.location.href);
    url.searchParams.set("sections", ids.join(","));
    return fetch(url.toString(), { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error("bm-gift-sections"); return r.json(); })
      .then(function (sections) {
        var parse = function (html, sel) {
          var el = html ? new DOMParser().parseFromString(html, "text/html").querySelector(sel) : null;
          return el ? el.innerHTML : null;
        };
        var bubble = document.getElementById("cart-icon-bubble");
        var bubbleHtml = parse(sections["cart-icon-bubble"], ".shopify-section");
        if (bubble && bubbleHtml !== null) bubble.innerHTML = bubbleHtml;
        if (drawer) {
          var inner = drawer.querySelector("#CartDrawer") || document.getElementById("CartDrawer");
          var drawerHtml = parse(sections["cart-drawer"], "#CartDrawer");
          if (inner && drawerHtml !== null) {
            inner.innerHTML = drawerHtml;
            var overlay = drawer.querySelector("#CartDrawer-Overlay");
            if (overlay && drawer.close) overlay.addEventListener("click", drawer.close.bind(drawer));
          }
        }
        if (main && main.dataset.id) {
          var mainHtml = parse(sections[main.dataset.id], "#main-cart");
          if (mainHtml !== null) main.innerHTML = mainHtml;
        }
      })
      .catch(function () {});
  }
  function bmGiftRequest(url, body, cart, nextState) {
    // loop guard: max 6 automatic cart writes per 30 s
    if (Date.now() - bmGiftWindow > 30000) { bmGiftWindow = Date.now(); bmGiftOps = 0; }
    if (++bmGiftOps > 6) return;
    bmGiftBusy = true;
    bmGiftGen++;
    fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (r) { if (!r.ok) throw new Error("bm-gift"); return r.json(); })
      .then(function () {
        bmSetGiftState(cart, nextState);
        return bmGiftRerender();
      })
      .then(function () {
        bmGiftBusy = false;
        bmGiftGen++;
        if (window.publish) publish("cart-update", { source: "bm-gift" });
        return refreshCart();
      })
      .catch(function () { bmGiftBusy = false; bmGiftGen++; });
  }
  function bmGiftSync(cart) {
    if (!cart || !cart.items || bmGiftBusy) return;
    var cfg = bmGiftCfg();
    var lines = bmGiftLines(cart, cfg.vid);
    var changeUrl = ((window.routes && window.routes.cart_change_url) || "/cart/change") + ".js";
    changeUrl = changeUrl.replace(/\.js\.js$/, ".js");
    var auto = lines.filter(function (it) { return it.properties && it.properties._bm_gift; });
    if (!cfg.on) {
      // campaign over / not live: drop auto-added gift lines we put there
      if (auto.length) bmGiftRequest(changeUrl, { id: auto[0].key, quantity: 0 }, cart, "");
      return;
    }
    var qualifies = cfg.threshold > 0 && bmBaseTotal(cart) >= cfg.threshold;
    var state = bmGiftState(cart);
    if (!qualifies) {
      if (auto.length) return bmGiftRequest(changeUrl, { id: auto[0].key, quantity: 0 }, cart, "");
      if (state) bmSetGiftState(cart, "");
      return;
    }
    if (auto.length > 1) return bmGiftRequest(changeUrl, { id: auto[1].key, quantity: 0 }, cart, "on");
    if (auto.length === 1) {
      if (auto[0].quantity > 1) return bmGiftRequest(changeUrl, { id: auto[0].key, quantity: 1 }, cart, "on");
      if (state !== "on") bmSetGiftState(cart, "on");
      return;
    }
    if (lines.length) return; // customer added the gift variant themselves; leave it
    if (state === "on") { bmSetGiftState(cart, "off"); return; } // customer removed it: respect until cart drops below the threshold
    if (state === "off") return;
    bmGiftRequest((window.routes && window.routes.cart_add_url) || "/cart/add.js",
      { items: [{ id: cfg.vid, quantity: 1, properties: { _bm_gift: "1" } }] }, cart, "on");
  }

  function refreshCart() {
    var gen = bmGiftGen;
    return fetch((window.routes && window.routes.cart_url ? window.routes.cart_url : "/cart") + ".js", { credentials: "same-origin" })
      .then(function (response) { return response.json(); })
      .then(function (cart) { paintShip(bmBaseTotal(cart)); if (gen === bmGiftGen) bmGiftSync(cart); return cart; })
      .catch(function () {});
  }

  (function hookCart() {
    var tries = 0, hooked = false;
    function hook() {
      if (hooked) return;
      if (window.subscribe) { hooked = true; subscribe("cart-update", function () { refreshCart(); }); return; }
      if (++tries < 40) setTimeout(hook, 250);
    }
    hook();
    if (document.querySelector("[data-bm-ship]") || sessionStorage.getItem("bm_gift_state")) refreshCart();
    // fallback: repaint when the drawer / cart items are re-rendered by the section rendering API
    var t;
    var mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var n = list[i].target;
        if (n.nodeType === 1 && (n.matches("cart-drawer-items, cart-items, .cart__contents, .cart-drawer__footer, .cart__totals") || n.closest("cart-drawer-items, cart-items"))) {
          clearTimeout(t); t = setTimeout(refreshCart, 350); return;
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  })();

  document.querySelectorAll("[data-bm-bundle-add]").forEach(function (button) {
    button.addEventListener("click", function () {
      var ids = (button.getAttribute("data-ids") || "").split(",").filter(Boolean);
      if (!ids.length) return;
      var name = button.getAttribute("data-name") || "Black Month";
      var items = ids.map(function (id) {
        return { id: Number(id), quantity: 1, properties: { _bm_bundle: name } };
      });
      button.disabled = true;
      fetch((window.routes && window.routes.cart_add_url) || "/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ items: items })
      })
        .then(function (response) {
          if (!response.ok) throw new Error("cart");
          return response.json();
        })
        .then(function () {
          document.dispatchEvent(new CustomEvent("cart:refresh"));
          if (window.publish) publish("cart-update", { source: "bm-bundle" });
          return refreshCart();
        })
        .catch(function () {
          window.alert((window.cartStrings && window.cartStrings.error) || "Kurven kunne ikke opdateres.");
        })
        .finally(function () { button.disabled = false; });
    });
  });

  document.querySelectorAll("[data-bm-sticky-submit]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.querySelector("product-form [data-add-to-cart], .product-form [data-add-to-cart]");
      if (target) target.click();
    });
  });
})();
