/* Swipe decks + Amazon image fallback.
   Progressive enhancement: touch swipe, keyboard, and links all work with JS off. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ------------------------------------------------------------------ */
  /* Amazon images                                                       */
  /* ------------------------------------------------------------------ */

  /* Amazon answers 200 with a 1x1 GIF when an ASIN has no catalogue image,
     so `onerror` never fires — the decoded width is the only tell. */
  function checkImage(img) {
    var media = img.parentNode;
    if (!media) return;
    if (!img.complete) return;
    if (!img.naturalWidth || img.naturalWidth <= 2) {
      media.classList.add("is-blank");
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll(".media img"), function (img) {
    img.addEventListener("load", function () {
      checkImage(img);
    });
    img.addEventListener("error", function () {
      if (img.parentNode) img.parentNode.classList.add("is-blank");
    });
    checkImage(img);
  });

  /* ------------------------------------------------------------------ */
  /* swipe decks                                                         */
  /* ------------------------------------------------------------------ */

  var decks = Array.prototype.slice.call(document.querySelectorAll(".deck"));
  if (!decks.length) return;

  decks.forEach(function (deck) {
    var scope = deck.closest(".deck-section") || document;
    var nav = scope.querySelector('[data-deck-nav="' + deck.id + '"]');
    var progress = scope.querySelector('[data-deck-progress="' + deck.id + '"]');
    var thumb = progress ? progress.querySelector(".deck-thumb") : null;
    var buttons = nav ? Array.prototype.slice.call(nav.querySelectorAll(".deck-btn")) : [];

    function maxScroll() {
      return deck.scrollWidth - deck.clientWidth;
    }

    function overflows() {
      return maxScroll() > 4;
    }

    function step() {
      var card = deck.querySelector(".card");
      if (!card) return deck.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(deck).columnGap || "0") || 0;
      var one = card.getBoundingClientRect().width + gap;
      var page = Math.floor(deck.clientWidth / one) * one;
      return Math.max(one, Math.min(page, deck.clientWidth));
    }

    function sync() {
      var max = maxScroll();
      var scrollable = overflows();
      var ratio = max > 0 ? Math.min(Math.max(deck.scrollLeft / max, 0), 1) : 0;

      if (nav) nav.classList.toggle("is-active", scrollable);
      buttons.forEach(function (button) {
        button.disabled =
          !scrollable ||
          (button.dataset.dir === "-1" ? deck.scrollLeft <= 4 : deck.scrollLeft >= max - 4);
      });

      if (progress) progress.hidden = !scrollable;
      if (thumb && scrollable) {
        var visible = Math.min(deck.clientWidth / deck.scrollWidth, 1);
        thumb.style.width = Math.max(visible * 100, 12) + "%";
        thumb.style.transform =
          "translateX(" + ratio * ((100 / Math.max(visible * 100, 12)) * 100 - 100) + "%)";
      }
      if (progress) progress.classList.toggle("is-done", ratio > 0.02);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        deck.scrollBy({ left: step() * Number(button.dataset.dir), behavior: "smooth" });
      });
    });

    /* Mouse / pen drag. Touch keeps the browser's own momentum scrolling. */
    var dragging = false;
    var moved = 0;
    var startX = 0;
    var startScroll = 0;
    var pointerId = null;

    deck.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch" || event.button !== 0) return;
      dragging = true;
      moved = 0;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = deck.scrollLeft;
      deck.classList.add("is-dragging");
    });

    deck.addEventListener("pointermove", function (event) {
      if (!dragging || event.pointerId !== pointerId) return;
      var delta = event.clientX - startX;
      if (Math.abs(delta) > moved) moved = Math.abs(delta);
      if (moved > 3 && !deck.hasPointerCapture(pointerId)) {
        deck.setPointerCapture(pointerId);
      }
      if (moved > 3) {
        event.preventDefault();
        deck.scrollLeft = startScroll - delta;
      }
    });

    function endDrag(event) {
      if (!dragging || (event && event.pointerId !== pointerId)) return;
      dragging = false;
      deck.classList.remove("is-dragging");
      if (pointerId !== null && deck.hasPointerCapture(pointerId)) {
        deck.releasePointerCapture(pointerId);
      }
      pointerId = null;
      if (moved > 3) {
        // Settle on the nearest snap position now that snapping is back on.
        deck.scrollTo({ left: deck.scrollLeft, behavior: "auto" });
      }
    }

    deck.addEventListener("pointerup", endDrag);
    deck.addEventListener("pointercancel", endDrag);
    deck.addEventListener("lostpointercapture", endDrag);

    /* A drag that ends on top of a card must not open Amazon. */
    deck.addEventListener(
      "click",
      function (event) {
        if (moved > 6) {
          event.preventDefault();
          event.stopPropagation();
          moved = 0;
        }
      },
      true
    );

    deck.addEventListener("dragstart", function (event) {
      if (moved > 3) event.preventDefault();
    });

    var queued = false;
    deck.addEventListener(
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
      new ResizeObserver(sync).observe(deck);
    } else {
      window.addEventListener("resize", sync);
    }

    window.addEventListener("load", sync);
    sync();
  });
})();
