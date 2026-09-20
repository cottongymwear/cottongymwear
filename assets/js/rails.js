/* Rail affordances: arrow buttons, disabled end states, edge fades.
   Progressive enhancement — the rails scroll fine without this file. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var rails = Array.prototype.slice.call(document.querySelectorAll(".rail"));
  if (!rails.length) return;

  rails.forEach(function (rail) {
    var wrap = rail.closest(".rail-wrap");
    var nav = document.querySelector('[data-rail-nav="' + rail.id + '"]');
    var buttons = nav ? Array.prototype.slice.call(nav.querySelectorAll(".rail-btn")) : [];

    function step() {
      var card = rail.querySelector(".card");
      if (!card) return rail.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(rail).columnGap || "0") || 0;
      var one = card.getBoundingClientRect().width + gap;
      // On wide screens move a page of cards at a time, but never past the viewport.
      return Math.max(one, Math.min(Math.floor(rail.clientWidth / one) * one, rail.clientWidth));
    }

    function overflows() {
      return rail.scrollWidth - rail.clientWidth > 4;
    }

    function sync() {
      var max = rail.scrollWidth - rail.clientWidth;
      var atStart = rail.scrollLeft <= 4;
      var atEnd = rail.scrollLeft >= max - 4;
      var scrollable = overflows();

      if (nav) nav.classList.toggle("is-active", scrollable);
      buttons.forEach(function (button) {
        button.disabled = !scrollable || (button.dataset.dir === "-1" ? atStart : atEnd);
      });
      if (wrap) {
        wrap.classList.toggle("fade-start", scrollable && !atStart);
        wrap.classList.toggle("fade-end", scrollable && !atEnd);
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        rail.scrollBy({ left: step() * Number(button.dataset.dir), behavior: "smooth" });
      });
    });

    var queued = false;
    rail.addEventListener(
      "scroll",
      function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          sync();
        });
      },
      { passive: true }
    );

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(sync).observe(rail);
    } else {
      window.addEventListener("resize", sync);
    }

    window.addEventListener("load", sync);
    sync();
  });
})();
