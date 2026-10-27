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
  var override = params.get("bm_now");
  var preview = params.has("preview_theme_id") || (window.Shopify && (Shopify.designMode || Shopify.previewMode || Shopify.visualPreviewMode));
  var clockOffset = 0;
  if (override && preview && root.getAttribute("data-bm-enabled") === "true") {
    var parsed = parseTime(override);
    if (parsed) {
      clockOffset = parsed - Date.now();
      var phase = phaseFor(Date.now() + clockOffset);
      root.setAttribute("data-bm-phase", phase);
      var scoped = root.classList.contains("template-index") || (root.className.indexOf("black-month") !== -1);
      root.classList.toggle("bm-dark", scoped && (phase === "pre" || phase === "live"));
    }
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
    if (prev) prev.addEventListener("click", function () { showSlide(slideIndex - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { showSlide(slideIndex + 1); });
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

  function messageFor(total, box) {
    var ship = Number(box.getAttribute("data-ship") || 0);
    var snack = Number(box.getAttribute("data-snack") || 0);
    var goal = Math.max(ship, snack);
    var format = box.getAttribute("data-money-format");
    if (snack > 0 && total >= snack) return box.getAttribute("data-msg-both");
    if (ship > 0 && total >= ship) {
      return box.getAttribute("data-msg-ship") + " · " + box.getAttribute("data-msg-need") + " " + formatMoney(snack - total, format) + " " + box.getAttribute("data-msg-goal-snack");
    }
    if (total > 0 && ship > 0) {
      return box.getAttribute("data-msg-need") + " " + formatMoney(ship - total, format) + " " + box.getAttribute("data-msg-goal-ship");
    }
    return box.getAttribute("data-msg-empty");
  }

  function paintShip(total) {
    document.querySelectorAll("[data-bm-ship]").forEach(function (box) {
      var ship = Number(box.getAttribute("data-ship") || 0);
      var snack = Number(box.getAttribute("data-snack") || 0);
      var goal = Math.max(ship, snack, 1);
      var fill = Math.min(100, Math.round((total / goal) * 100));
      var fillEl = box.querySelector("[data-bm-ship-fill]");
      var msg = box.querySelector("[data-bm-ship-msg]");
      var amount = box.querySelector("[data-bm-ship-amount]");
      if (fillEl) fillEl.style.width = fill + "%";
      if (msg) msg.textContent = messageFor(total, box);
      if (amount) amount.textContent = total > 0 ? formatMoney(total, box.getAttribute("data-money-format")) : formatMoney(ship, box.getAttribute("data-money-format"));
    });
  }

  function refreshCart() {
    return fetch((window.routes && window.routes.cart_url ? window.routes.cart_url : "/cart") + ".js", { credentials: "same-origin" })
      .then(function (response) { return response.json(); })
      .then(function (cart) { paintShip(cart.total_price || 0); return cart; })
      .catch(function () {});
  }

  if (window.subscribe) {
    subscribe("cart-update", function () { refreshCart(); });
  }

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
