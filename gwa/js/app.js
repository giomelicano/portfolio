/* ==========================================================================
   GWA Calculator & Honours Tracker
   Plain JavaScript. No libraries, no build step.

     1. Rules          — every threshold in one editable place
     2. State          — shape + persistence
     3. Calculations   — pure functions, no DOM
     4. Planner        — "what do I need in my remaining grades?"
     5. Rendering      — structure vs. values, kept separate on purpose
     6. Events
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Rules

     Kept together so they can be checked and changed in one place rather
     than hunted for through the calculation code.
     ------------------------------------------------------------------------ */

  var RULES = {
    passing: 75,

    // Highest first — the first band a general average reaches is the award.
    honours: [
      { min: 98, label: "With Highest Honors" },
      { min: 95, label: "With High Honors" },
      { min: 90, label: "With Honors" }
    ],

    // Honours also require no single subject below this.
    honourMinSubject: 85,

    gradeMin: 0,
    gradeMax: 100
  };

  var DEFAULT_SUBJECTS = [
    "Filipino",
    "English",
    "Mathematics",
    "Science",
    "Araling Panlipunan",
    "Edukasyon sa Pagpapakatao",
    "TLE",
    "MAPEH"
  ];

  var STORAGE_KEY = "gwa:v1";

  /* ------------------------------------------------------------------------
     2. State
     ------------------------------------------------------------------------ */

  var state = { termCount: 4, subjects: [] };
  var nextId = 1;

  function makeSubject(name, termCount) {
    return { id: "s" + nextId++, name: name || "", grades: new Array(termCount).fill(null) };
  }

  function defaultState() {
    return {
      termCount: 4,
      subjects: DEFAULT_SUBJECTS.map(function (n) { return makeSubject(n, 4); })
    };
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      flashSaved();
    } catch (e) {
      /* Private browsing blocks storage — the app still works for this visit. */
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.subjects)) return null;

      // Re-key on load so ids stay unique, and coerce anything odd in storage.
      var terms = parsed.termCount === 3 ? 3 : 4;
      return {
        termCount: terms,
        subjects: parsed.subjects.map(function (s) {
          var grades = Array.isArray(s.grades) ? s.grades.slice(0, terms) : [];
          while (grades.length < terms) grades.push(null);
          return {
            id: "s" + nextId++,
            name: typeof s.name === "string" ? s.name : "",
            grades: grades.map(function (g) {
              return typeof g === "number" && isFinite(g) ? g : null;
            })
          };
        })
      };
    } catch (e) {
      return null;   // corrupt or unreadable storage — fall back to defaults
    }
  }

  /* ------------------------------------------------------------------------
     3. Calculations

     All pure: they take subjects in, return numbers out, and never touch the
     DOM. That's what lets the planner in section 4 replay them cheaply.
     ------------------------------------------------------------------------ */

  /**
   * A subject's final grade: the mean of its grading periods, rounded to a
   * whole number. While periods are still blank it's a running average of
   * whatever has been entered.
   */
  function subjectFinal(grades) {
    var filled = grades.filter(function (g) { return g !== null; });
    if (filled.length === 0) return { value: null, complete: false, empty: true };

    var sum = filled.reduce(function (a, b) { return a + b; }, 0);
    return {
      value: Math.round(sum / filled.length),
      complete: filled.length === grades.length,
      empty: false
    };
  }

  /** Mean of the rounded subject finals. Null until at least one grade exists. */
  function generalAverage(subjects) {
    var finals = subjects
      .map(function (s) { return subjectFinal(s.grades); })
      .filter(function (f) { return f.value !== null; });

    if (finals.length === 0) return null;

    var sum = finals.reduce(function (a, f) { return a + f.value; }, 0);
    return sum / finals.length;
  }

  function lowestFinal(subjects) {
    var values = subjects
      .map(function (s) { return subjectFinal(s.grades).value; })
      .filter(function (v) { return v !== null; });
    return values.length ? Math.min.apply(null, values) : null;
  }

  /** Which award, if any, the current standing earns. */
  function award(subjects) {
    var ga = generalAverage(subjects);
    if (ga === null) return null;

    var lowest = lowestFinal(subjects);

    for (var i = 0; i < RULES.honours.length; i++) {
      if (ga >= RULES.honours[i].min) {
        // The band is reached — but honours also need every subject at 85+.
        return {
          label: RULES.honours[i].label,
          earned: lowest >= RULES.honourMinSubject,
          blockedBySubject: lowest < RULES.honourMinSubject,
          band: RULES.honours[i].min
        };
      }
    }
    return { label: ga >= RULES.passing ? "Passing" : "Below passing", earned: ga >= RULES.passing };
  }

  function countBlanks(subjects) {
    return subjects.reduce(function (n, s) {
      return n + s.grades.filter(function (g) { return g === null; }).length;
    }, 0);
  }

  /* ------------------------------------------------------------------------
     4. Planner

     The question is "what's the lowest grade I could get in every remaining
     box and still hit my target?"

     Solving that algebraically looks easy until the rounding gets involved —
     subject finals are rounded to whole numbers *before* they're averaged, so
     the relationship between an input grade and the general average is a step
     function, not a straight line. An algebraic answer would be off by one
     around the boundaries.

     So instead of solving it, this searches it: try every whole grade from 0
     to 100, recompute the entire result each time, and return the first one
     that actually works. 101 iterations over a handful of subjects is far too
     cheap to be worth optimising, and it's exact by construction.
     ------------------------------------------------------------------------ */

  /** A copy of the subjects with every blank filled by `value`. */
  function fillBlanks(subjects, value) {
    return subjects.map(function (s) {
      return {
        id: s.id,
        name: s.name,
        grades: s.grades.map(function (g) { return g === null ? value : g; })
      };
    });
  }

  function meetsTarget(subjects, target, requireHonourMin) {
    var ga = generalAverage(subjects);
    if (ga === null || ga < target) return false;
    if (requireHonourMin && lowestFinal(subjects) < RULES.honourMinSubject) return false;
    return true;
  }

  function planFor(subjects, target) {
    // Honours targets carry the per-subject minimum with them; passing doesn't.
    var requireHonourMin = target >= RULES.honours[RULES.honours.length - 1].min;
    var blanks = countBlanks(subjects);

    if (blanks === 0) {
      return {
        kind: meetsTarget(subjects, target, requireHonourMin) ? "done-met" : "done-missed",
        blanks: 0
      };
    }

    for (var g = RULES.gradeMin; g <= RULES.gradeMax; g++) {
      var filled = fillBlanks(subjects, g);
      if (meetsTarget(filled, target, requireHonourMin)) {
        return {
          kind: "reachable",
          grade: g,
          blanks: blanks,
          resulting: generalAverage(filled),
          requireHonourMin: requireHonourMin
        };
      }
    }
    return { kind: "impossible", blanks: blanks, requireHonourMin: requireHonourMin };
  }

  /* ------------------------------------------------------------------------
     5. Rendering

     Split in two on purpose:
       renderSubjects() rebuilds the rows, and only runs on structural changes
         (add, remove, reset, term count) — rebuilding on every keystroke would
         destroy the input the user is typing in.
       renderResults() updates the computed values in place, and runs on
         every input event.
     ------------------------------------------------------------------------ */

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };

  var listEl    = $("#subject-list");
  var headEl    = $("#head-terms");
  var gaEl      = $("#general-average");
  var gaNoteEl  = $("#ga-note");
  var awardEl   = $("#award");
  var critEl    = $("#criteria");
  var verdictEl = $("#verdict");
  var statsEl   = $("#mini-stats");
  var savedEl   = $("#saved-note");

  function termLabels() {
    var prefix = state.termCount === 3 ? "T" : "Q";
    var out = [];
    for (var i = 1; i <= state.termCount; i++) out.push(prefix + i);
    return out;
  }

  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var ICON_CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_DOT   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';

  function renderSubjects() {
    // Column headers
    headEl.innerHTML = termLabels().map(function (l) {
      return "<span>" + l + "</span>";
    }).join("");

    if (state.subjects.length === 0) {
      listEl.innerHTML = '<p class="empty-note">No subjects yet — add one to start.</p>';
      return;
    }

    var labels = termLabels();

    listEl.innerHTML = state.subjects.map(function (s) {
      var cells = s.grades.map(function (g, i) {
        return '' +
          '<div class="grade-cell">' +
            '<span>' + labels[i] + '</span>' +
            '<input class="grade-input" type="number" inputmode="numeric" ' +
                   'min="' + RULES.gradeMin + '" max="' + RULES.gradeMax + '" step="1" ' +
                   'value="' + (g === null ? "" : g) + '" ' +
                   'data-id="' + s.id + '" data-term="' + i + '" ' +
                   'aria-label="' + escapeAttr(s.name || "Subject") + ' — ' + labels[i] + '">' +
          '</div>';
      }).join("");

      return '' +
        '<div class="row row--subject" data-row="' + s.id + '">' +
          '<input class="subject-name" type="text" value="' + escapeAttr(s.name) + '" ' +
                 'placeholder="Subject name" data-id="' + s.id + '" aria-label="Subject name">' +
          '<div class="row__grades">' + cells + '</div>' +
          '<span class="row__final"><span class="final-value" data-final="' + s.id + '">—</span></span>' +
          '<button class="remove-btn" type="button" data-remove="' + s.id + '" ' +
                  'aria-label="Remove ' + escapeAttr(s.name || "subject") + '">' + ICON_CROSS + '</button>' +
        '</div>';
    }).join("");
  }

  function escapeAttr(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderResults() {
    // --- per-subject finals -------------------------------------------------
    state.subjects.forEach(function (s) {
      var cell = listEl.querySelector('[data-final="' + s.id + '"]');
      if (!cell) return;

      var f = subjectFinal(s.grades);
      cell.className = "final-value";

      if (f.value === null) {
        cell.textContent = "—";
        return;
      }
      cell.textContent = f.value + (f.complete ? "" : "*");
      cell.classList.add(
        f.value < RULES.passing ? "is-fail" : (f.complete ? "is-pass" : "is-partial")
      );
      cell.title = f.complete
        ? "Final grade"
        : "Running average — some grading periods are still blank";
    });

    // --- general average ----------------------------------------------------
    var ga = generalAverage(state.subjects);
    var blanks = countBlanks(state.subjects);

    if (ga === null) {
      gaEl.textContent = "—";
      gaNoteEl.textContent = "Enter a grade to begin";
      awardEl.textContent = "—";
      awardEl.className = "award";
      critEl.innerHTML = "";
      statsEl.innerHTML = "";
      verdictEl.textContent = "Enter some grades first.";
      verdictEl.className = "verdict";
      return;
    }

    gaEl.textContent = ga.toFixed(2);
    gaNoteEl.textContent = blanks === 0
      ? "All grades entered"
      : blanks + " grade" + (blanks === 1 ? "" : "s") + " still blank — this is a running figure";

    // --- award --------------------------------------------------------------
    var a = award(state.subjects);
    awardEl.textContent = a.blockedBySubject
      ? a.label + " — blocked"
      : a.label;
    awardEl.className = "award " +
      (a.blockedBySubject ? "is-warn" : (a.earned ? "is-pass" : "is-fail"));

    // --- criteria checklist -------------------------------------------------
    var lowest = lowestFinal(state.subjects);
    var items = [
      criterion(ga >= RULES.passing,
        "General average at least " + RULES.passing,
        "General average is " + ga.toFixed(2)),
      criterion(lowest >= RULES.passing,
        "No subject below " + RULES.passing,
        "Lowest subject is " + lowest)
    ];
    if (ga >= RULES.honours[RULES.honours.length - 1].min || lowest < RULES.honourMinSubject) {
      items.push(criterion(lowest >= RULES.honourMinSubject,
        "No subject below " + RULES.honourMinSubject + " (needed for honours)",
        "Lowest subject is " + lowest));
    }
    if (blanks > 0) {
      items.push(criterion(null, blanks + " grade" + (blanks === 1 ? "" : "s") + " still to come", ""));
    }
    critEl.innerHTML = items.join("");

    // --- planner ------------------------------------------------------------
    renderPlanner(ga, blanks);
  }

  function criterion(ok, text, detail) {
    var cls  = ok === null ? "todo" : (ok ? "ok" : "no");
    var icon = ok === null ? ICON_DOT : (ok ? ICON_CHECK : ICON_CROSS);
    return '<li><span class="' + cls + '">' + icon + "</span><span>" +
           escapeHtml(text) + (detail ? " — " + escapeHtml(detail) : "") + "</span></li>";
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function currentTarget() {
    var sel = $("#target").value;
    if (sel === "custom") {
      var v = parseFloat($("#custom-target").value);
      return isFinite(v) ? v : 90;
    }
    return parseFloat(sel);
  }

  function renderPlanner(ga, blanks) {
    var target = currentTarget();
    var plan = planFor(state.subjects, target);

    var html, cls;
    if (plan.kind === "done-met") {
      html = "<strong>Target reached.</strong> Every grade is in and your general average of " +
             ga.toFixed(2) + " meets " + target + ".";
      cls = "is-pass";
    } else if (plan.kind === "done-missed") {
      html = "<strong>Not reached.</strong> Every grade is in, so " + ga.toFixed(2) +
             " is final — short of " + target + ".";
      cls = "is-fail";
    } else if (plan.kind === "impossible") {
      html = "<strong>Out of reach.</strong> Even with " + RULES.gradeMax +
             " in all " + plan.blanks + " remaining grade" + (plan.blanks === 1 ? "" : "s") +
             ", " + target + " can't be reached" +
             (plan.requireHonourMin
               ? " — a subject is already below " + RULES.honourMinSubject + "."
               : ".");
      cls = "is-fail";
    } else {
      html = "You need <strong>" + plan.grade + "</strong> in each of your " +
             plan.blanks + " remaining grade" + (plan.blanks === 1 ? "" : "s") +
             " to reach " + target + ".";
      if (plan.grade <= RULES.passing) {
        html += " That's comfortable — you're well placed.";
        cls = "is-pass";
      } else if (plan.grade >= 95) {
        html += " That's a tall order.";
        cls = "is-warn";
      } else {
        cls = "";
      }
    }
    verdictEl.innerHTML = html;
    verdictEl.className = "verdict " + cls;

    // --- supporting numbers -------------------------------------------------
    var best  = generalAverage(fillBlanks(state.subjects, RULES.gradeMax));
    var worst = generalAverage(fillBlanks(state.subjects, RULES.gradeMin));
    var lowest = lowestFinal(state.subjects);

    statsEl.innerHTML =
      stat("Best possible", blanks ? best.toFixed(2) : ga.toFixed(2)) +
      stat("Worst possible", blanks ? worst.toFixed(2) : ga.toFixed(2)) +
      stat("Grades left", String(blanks)) +
      stat("Lowest subject", lowest === null ? "—" : String(lowest));
  }

  function stat(label, value) {
    return "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>";
  }

  var savedTimer;
  function flashSaved() {
    savedEl.textContent = "Saved";
    clearTimeout(savedTimer);
    savedTimer = setTimeout(function () { savedEl.textContent = ""; }, 1400);
  }

  function renderAll() {
    renderSubjects();
    renderResults();
  }

  /* ------------------------------------------------------------------------
     6. Events
     ------------------------------------------------------------------------ */

  function findSubject(id) {
    return state.subjects.filter(function (s) { return s.id === id; })[0];
  }

  // Grade + name editing, delegated so new rows work without rebinding.
  listEl.addEventListener("input", function (e) {
    var el = e.target;

    if (el.classList.contains("grade-input")) {
      var subject = findSubject(el.dataset.id);
      if (!subject) return;

      var raw = el.value.trim();
      if (raw === "") {
        subject.grades[+el.dataset.term] = null;
        el.classList.remove("is-invalid");
      } else {
        var n = parseFloat(raw);
        var valid = isFinite(n) && n >= RULES.gradeMin && n <= RULES.gradeMax;
        el.classList.toggle("is-invalid", !valid);
        subject.grades[+el.dataset.term] = valid ? n : null;
      }
      renderResults();
      save();
      return;
    }

    if (el.classList.contains("subject-name")) {
      var s = findSubject(el.dataset.id);
      if (s) { s.name = el.value; save(); }
    }
  });

  // Removing a row is structural, so it rebuilds.
  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    if (!btn) return;
    state.subjects = state.subjects.filter(function (s) { return s.id !== btn.dataset.remove; });
    renderAll();
    save();
  });

  $("#add-subject").addEventListener("click", function () {
    state.subjects.push(makeSubject("", state.termCount));
    renderAll();
    save();
    // Put the cursor straight into the new subject's name field.
    var rows = listEl.querySelectorAll(".subject-name");
    if (rows.length) rows[rows.length - 1].focus();
  });

  $("#reset").addEventListener("click", function () {
    if (!confirm("Reset to the default subject list and clear all grades?")) return;
    state = defaultState();
    renderAll();
    save();
  });

  $("#clear-grades").addEventListener("click", function () {
    if (!confirm("Clear every grade but keep your subjects?")) return;
    state.subjects.forEach(function (s) {
      s.grades = s.grades.map(function () { return null; });
    });
    renderAll();
    save();
  });

  // Switching between 3 terms and 4 quarters keeps whatever grades still fit.
  document.querySelectorAll("[data-terms]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var n = +btn.dataset.terms;
      if (n === state.termCount) return;

      state.termCount = n;
      state.subjects.forEach(function (s) {
        if (s.grades.length > n) s.grades = s.grades.slice(0, n);
        while (s.grades.length < n) s.grades.push(null);
      });

      document.querySelectorAll("[data-terms]").forEach(function (b) {
        b.classList.toggle("is-active", +b.dataset.terms === n);
      });
      renderAll();
      save();
    });
  });

  $("#target").addEventListener("change", function () {
    $("#custom-field").hidden = this.value !== "custom";
    renderResults();
  });
  $("#custom-target").addEventListener("input", renderResults);

  // Theme
  var themeToggle = $("#theme-toggle");
  themeToggle.addEventListener("click", function () {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (dark) document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", "dark");
    try { localStorage.setItem("theme", dark ? "light" : "dark"); } catch (e) {}
  });

  /* ------------------------------------------------------------------------
     Start
     ------------------------------------------------------------------------ */

  state = load() || defaultState();
  document.querySelectorAll("[data-terms]").forEach(function (b) {
    b.classList.toggle("is-active", +b.dataset.terms === state.termCount);
  });
  renderAll();

  // Exposed so the calculations can be exercised from the console.
  window.GWA = {
    rules: RULES,
    subjectFinal: subjectFinal,
    generalAverage: generalAverage,
    planFor: planFor,
    getState: function () { return state; }
  };

})();
