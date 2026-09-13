/* ==========================================================================
   Jose Gio L. Melicano — Portfolio
   Plain JavaScript, no libraries, no build step.

   Contents
     1. Theme toggle
     2. Mobile navigation
     3. Scroll reveal
     4. Active navigation link
     5. Screenshot lightbox
     6. Contact form (validation + Netlify submit)
     7. Footer year
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Small helpers so the rest of the file reads cleanly */
  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ------------------------------------------------------------------------
     1. Theme toggle
     The initial theme is applied by the inline script in <head> so the page
     never flashes the wrong colours. This only handles clicks afterwards.
     ------------------------------------------------------------------------ */

  var themeToggle = $("#theme-toggle");

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* Private browsing can block storage — the toggle still works for this visit. */
    }
  }

  if (themeToggle) {
    applyTheme(currentTheme());
    themeToggle.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  /* ------------------------------------------------------------------------
     2. Mobile navigation
     ------------------------------------------------------------------------ */

  var navToggle = $("#nav-toggle");
  var navLinks = $("#nav-links");

  function closeNav(returnFocus) {
    if (!navToggle || !navLinks) return;
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    if (returnFocus) navToggle.focus();
  }

  function openNav() {
    if (!navToggle || !navLinks) return;
    navLinks.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeNav(false) : openNav();
    });

    /* Tapping a link should close the menu and jump to the section */
    $$(".nav__link", navLinks).forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });

    /* Clicking outside the open menu closes it */
    document.addEventListener("click", function (event) {
      if (navToggle.getAttribute("aria-expanded") !== "true") return;
      if (navLinks.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav(false);
    });
  }

  /* ------------------------------------------------------------------------
     3. Scroll reveal
     Elements marked .reveal fade up once as they enter the viewport.
     ------------------------------------------------------------------------ */

  var revealItems = $$(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    /* No animation wanted, or an old browser — just show everything. */
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);   // only animate once
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------------
     4. Active navigation link
     Highlights whichever section is currently in view.
     ------------------------------------------------------------------------ */

  var sectionLinks = $$('.nav__link[href^="#"]');

  if ("IntersectionObserver" in window && sectionLinks.length) {
    var linkFor = {};
    var watched = [];

    sectionLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) {
        linkFor[id] = link;
        watched.push(section);
      }
    });

    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkFor[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          sectionLinks.forEach(function (l) { l.classList.remove("is-active"); });
          link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    watched.forEach(function (section) { navObserver.observe(section); });
  }

  /* ------------------------------------------------------------------------
     5. Screenshot lightbox
     Opens a gallery thumbnail full size. Arrow keys move between shots,
     Escape closes, and focus returns to the thumbnail that opened it.
     ------------------------------------------------------------------------ */

  var lightbox = $("#lightbox");
  var lbImg = $("#lb-img");
  var lbCaption = $("#lb-caption");
  var lbClose = $("#lb-close");
  var lbPrev = $("#lb-prev");
  var lbNext = $("#lb-next");
  var slides = $$(".gallery__item");
  var slideIndex = 0;
  var lastFocused = null;

  function showSlide(index) {
    if (!slides.length) return;

    /* Wrap around at both ends */
    slideIndex = (index + slides.length) % slides.length;

    var slide = slides[slideIndex];
    var src = slide.getAttribute("data-full");
    var caption = slide.getAttribute("data-caption") || "";

    lbCaption.textContent = caption;
    lbImg.alt = caption;

    /* If the screenshot hasn't been added yet, say so rather than showing
       a broken image icon. */
    lbImg.onerror = function () {
      lbImg.removeAttribute("src");
      lbCaption.textContent = caption + " — screenshot not added yet (" + src + ")";
    };
    lbImg.src = src;

    /* Only offer prev/next when there is more than one shot */
    var multiple = slides.length > 1;
    lbPrev.hidden = !multiple;
    lbNext.hidden = !multiple;
  }

  function openLightbox(index, trigger) {
    if (!lightbox) return;
    lastFocused = trigger || document.activeElement;
    showSlide(index);
    lightbox.classList.add("is-open");
    document.body.classList.add("is-locked");
    lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    lbImg.removeAttribute("src");
    if (lastFocused) lastFocused.focus();
  }

  slides.forEach(function (slide, index) {
    slide.addEventListener("click", function () { openLightbox(index, slide); });
  });

  if (lightbox) {
    lbClose.addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", function () { showSlide(slideIndex - 1); });
    lbNext.addEventListener("click", function () { showSlide(slideIndex + 1); });

    /* Clicking the backdrop (but not the image) closes */
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showSlide(slideIndex - 1);
      if (event.key === "ArrowRight") showSlide(slideIndex + 1);
    });
  }

  /* Escape also closes the mobile menu */
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (navToggle && navToggle.getAttribute("aria-expanded") === "true") {
      closeNav(true);
    }
  });

  /* ------------------------------------------------------------------------
     6. Contact form
     Validates in the browser, then posts to Netlify Forms in the background
     so the visitor stays on the page.
     ------------------------------------------------------------------------ */

  var form = $("#contact-form");
  var status = $("#form-status");
  var submitBtn = $("#submit-btn");

  var rules = {
    name: {
      test: function (v) { return v.trim().length >= 2; },
      message: "Please enter your name."
    },
    email: {
      /* Deliberately loose: the only real test of an address is sending to it */
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      message: "Please enter a valid email address."
    },
    message: {
      test: function (v) { return v.trim().length >= 10; },
      message: "Please write at least 10 characters."
    }
  };

  function setFieldError(fieldName, message) {
    var wrapper = $("#field-" + fieldName);
    var errorEl = $("#err-" + fieldName);
    if (!wrapper || !errorEl) return;

    errorEl.textContent = message || "";
    wrapper.classList.toggle("has-error", Boolean(message));
    var input = $("#" + fieldName);
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateField(fieldName) {
    var input = $("#" + fieldName);
    var rule = rules[fieldName];
    if (!input || !rule) return true;

    var valid = rule.test(input.value);
    setFieldError(fieldName, valid ? "" : rule.message);
    return valid;
  }

  function showStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.className = "form__status is-visible " + (type === "success" ? "is-success" : "is-error");
  }

  if (form) {
    /* Clear a field's error as soon as it becomes valid */
    Object.keys(rules).forEach(function (fieldName) {
      var input = $("#" + fieldName);
      if (!input) return;
      input.addEventListener("blur", function () { validateField(fieldName); });
      input.addEventListener("input", function () {
        if ($("#field-" + fieldName).classList.contains("has-error")) {
          validateField(fieldName);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      /* Validate every field, and focus the first one that fails */
      var firstInvalid = null;
      Object.keys(rules).forEach(function (fieldName) {
        if (!validateField(fieldName) && !firstInvalid) firstInvalid = fieldName;
      });

      if (firstInvalid) {
        showStatus("Please fix the highlighted fields and try again.", "error");
        $("#" + firstInvalid).focus();
        return;
      }

      submitBtn.disabled = true;
      var originalLabel = submitBtn.innerHTML;
      submitBtn.textContent = "Sending…";

      /* Netlify expects a urlencoded body containing form-name */
      var body = new URLSearchParams(new FormData(form)).toString();

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed: " + response.status);
          form.reset();
          showStatus("Thanks — your message was sent. I'll get back to you soon.", "success");
        })
        .catch(function () {
          showStatus(
            "Something went wrong sending that. Please email me directly at giomelicano16@gmail.com.",
            "error"
          );
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
        });
    });
  }

  /* ------------------------------------------------------------------------
     7. Footer year
     ------------------------------------------------------------------------ */

  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
