(function () {
  "use strict";

  var IMS = window.IMS;
  var store = IMS.store;
  var esc = IMS.esc;
  var money = IMS.money;

  var ui = {
    quiz: null,
    lastFocus: null
  };

  var practiceTabs = [
    { id: "dashboard", label: "Dashboard", icon: "grid" },
    { id: "products", label: "Products", icon: "box" },
    { id: "customers", label: "Customers", icon: "users" },
    { id: "sales", label: "Sales", icon: "cart" },
    { id: "credit", label: "Credit Book", icon: "wallet" },
    { id: "receipts", label: "Receipts", icon: "receipt" }
  ];

  var permissionLabels = {
    dashboard: "Dashboard",
    products: "Products",
    customers: "Customers",
    sales: "Sales",
    credit: "Credit Book",
    receipts: "Receipts",
    settings: "Settings and backup"
  };

  function role() {
    return IMS.roleInfo(store.state.role);
  }

  function can(permission) {
    return role().permissions.indexOf(permission) !== -1;
  }

  function go(hash) {
    if (window.location.hash === hash) renderCurrent();
    else window.location.hash = hash;
  }

  function parseRoute() {
    var raw = window.location.hash.replace(/^#\/?/, "");
    var parts = raw.split("/").filter(Boolean).map(function (part) {
      try { return decodeURIComponent(part); } catch (error) { return part; }
    });
    if (!parts.length) return { name: "welcome" };
    if (parts[0] === "module") return { name: "module", id: parts[1] || "" };
    if (parts[0] === "practice") return { name: "practice", tab: parts[1] || "dashboard" };
    if (parts[0] === "quiz") return { name: "quiz", id: parts[1] || "" };
    if (["course", "progress", "certificate", "settings"].indexOf(parts[0]) !== -1) return { name: parts[0] };
    return { name: "course" };
  }

  function pageTitleFor(route) {
    if (route.name === "course") return "Course map";
    if (route.name === "module") {
      var module = IMS.moduleById(route.id);
      return module ? module.title : "Lesson";
    }
    if (route.name === "practice") {
      var tab = practiceTabs.find(function (item) { return item.id === route.tab; });
      return tab ? tab.label : "Practice";
    }
    if (route.name === "quiz") {
      var quizModule = IMS.moduleById(route.id);
      return quizModule ? quizModule.title + " quiz" : "Quiz";
    }
    if (route.name === "progress") return "Progress";
    if (route.name === "certificate") return "Certificate";
    if (route.name === "settings") return "Settings";
    return "Welcome";
  }
  function missionResults(module) {
    return (module.missions || []).map(function (mission) {
      return { mission: mission, complete: store.missionDone(module.id, mission) };
    });
  }

  function moduleStats(module) {
    var progress = store.getProgress(module.id);
    var results = missionResults(module);
    var doneMissions = results.filter(function (row) { return row.complete; }).length;
    var allMissions = results.length === 0 || doneMissions === results.length;
    var passed = Boolean(progress.quizPassed);
    var complete = module.final
      ? passed
      : Boolean(progress.lessonRead) && allMissions && passed;
    var parts = module.final ? [passed] : [Boolean(progress.lessonRead), allMissions, passed];
    var percent = Math.round((parts.filter(Boolean).length / parts.length) * 100);
    var started = Boolean(progress.lessonRead) || doneMissions > 0 || progress.quizScore != null;
    return {
      progress: progress,
      results: results,
      doneMissions: doneMissions,
      totalMissions: results.length,
      complete: complete,
      percent: percent,
      started: started
    };
  }

  function overallPercent() {
    var complete = IMS.modules.filter(function (module) { return moduleStats(module).complete; }).length;
    return Math.round((complete / IMS.modules.length) * 100);
  }

  function allComplete() {
    return IMS.modules.every(function (module) { return moduleStats(module).complete; });
  }

  function nextModule() {
    return IMS.modules.find(function (module) { return !moduleStats(module).complete; }) || null;
  }

  function moduleHref(module) {
    return module.final ? "#/quiz/" + module.id : "#/module/" + module.id;
  }
  function navLink(href, icon, label, active) {
    return '<a class="nav-link ' + (active ? "active" : "") + '" href="' + href + '"' + (active ? ' aria-current="page"' : "") + '>' +
      IMS.icon(icon) + '<span>' + esc(label) + '</span></a>';
  }

  function sidebar(route) {
    var learnActive = route.name === "course" || route.name === "module" || route.name === "quiz";
    var practiceActive = route.name === "practice";
    var items = practiceTabs.filter(function (tab) {
      return tab.id === "dashboard" || can(tab.id);
    }).map(function (tab) {
      return navLink("#/practice/" + tab.id, tab.icon, tab.label, practiceActive && route.tab === tab.id);
    }).join("");

    return '<aside class="sidebar" id="sidebar" aria-label="Main navigation">' +
      '<a class="brand" href="#/course">' +
        '<img src="assets/logo.svg" alt="">' +
        '<span>' + esc(IMS.config.brand.shortName) + ' IMS<small>Tutor</small></span>' +
      '</a>' +
      '<nav class="nav">' +
        '<div class="nav-group">' +
          '<div class="nav-label">Learn</div>' +
          navLink("#/course", "book", "Course map", learnActive) +
          navLink("#/progress", "chart", "Progress", route.name === "progress") +
          navLink("#/certificate", "award", "Certificate", route.name === "certificate") +
        '</div>' +
        '<div class="nav-group">' +
          '<div class="nav-label">Practice</div>' +
          items +
        '</div>' +
        (can("settings")
          ? '<div class="nav-group"><div class="nav-label">Account</div>' + navLink("#/settings", "settings", "Settings", route.name === "settings") + '</div>'
          : "") +
      '</nav>' +
      '<div class="sidebar-foot">Training copy &middot; v1.0<br>Saved on this device</div>' +
    '</aside>' +
    '<div class="scrim" id="scrim" data-action="close-menu"></div>';
  }

  function topbar(route) {
    var roleOptions = IMS.config.roles.map(function (item) {
      return '<option value="' + esc(item.id) + '"' + (store.state.role === item.id ? " selected" : "") + '>' + esc(item.label) + '</option>';
    }).join("");
    return '<header class="topbar">' +
      '<div class="topbar-left">' +
        '<button class="btn-icon menu-btn" data-action="toggle-menu" aria-label="Open menu">' + IMS.icon("menu") + '</button>' +
        '<span class="topbar-title">' + esc(pageTitleFor(route)) + '</span>' +
      '</div>' +
      '<div class="topbar-actions">' +
        '<select class="role-select" id="role-select" aria-label="Training role">' + roleOptions + '</select>' +
        '<span class="user-chip"><span class="avatar">' + esc(IMS.initials(store.state.trainee.name)) + '</span><span class="user-name">' + esc(store.state.trainee.name) + '</span></span>' +
      '</div>' +
    '</header>';
  }

  function shell(route, content, contentClass) {
    return '<div class="shell">' +
      sidebar(route) +
      '<div class="main" id="main">' +
        topbar(route) +
        '<main class="content ' + (contentClass || "") + '" id="main-content" tabindex="-1">' +
          (store.memoryOnly
            ? '<div class="callout warn" style="margin-bottom:18px">' + IMS.icon("alert") + '<span>This browser is not saving data. Practice data will be lost when the page closes.</span></div>'
            : "") +
          content +
        '</main>' +
      '</div>' +
    '</div>';
  }
  function renderWelcome() {
    var name = store.state.trainee.name;
    var hasName = Boolean(name);
    var percent = overallPercent();
    var startLabel = hasName ? "Resume course" : "Start course";
    var headline = hasName ? "Welcome back, " + name.split(/\s+/)[0] + "." : "Learn the shop system before you touch the shop system.";

    document.title = "NASFON IMS TUTOR";
    document.getElementById("app").innerHTML =
      '<div class="welcome">' +
        '<section class="welcome-art">' +
          '<div class="brand-inline"><img src="assets/logo.svg" alt=""><span>' + esc(IMS.config.brand.name) + '</span></div>' +
          '<div class="welcome-headline">' +
            '<h1>' + esc(headline) + '</h1>' +
            '<p>A short, hands-on course for shop owners. Read a lesson, practise the exact task in a safe sandbox, then check what you learned.</p>' +
            '<div class="welcome-points">' +
              '<div class="welcome-point">' + IMS.icon("check") + '<span>Practise with fictional products, customers, and credit sales.</span></div>' +
              '<div class="welcome-point">' + IMS.icon("check") + '<span>Progress saves automatically on this device.</span></div>' +
              '<div class="welcome-point">' + IMS.icon("check") + '<span>Print a certificate when every module is complete.</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="welcome-foot">' + esc(IMS.config.shop.name) + ' &middot; Training environment, not the live shop system.</div>' +
        '</section>' +
        '<section class="welcome-panel">' +
          '<div class="welcome-form">' +
            '<h2>' + (hasName ? "Continue your training" : "Start your training") + '</h2>' +
            '<p>' + (hasName ? "Your progress is saved. Pick up where you left off." : "Enter your name so your certificate can be prepared. No account or password is needed.") + '</p>' +
            '<form id="welcome-form" novalidate>' +
              '<div class="field">' +
                '<label for="trainee-name">Your name</label>' +
                '<input class="input" id="trainee-name" name="name" maxlength="60" value="' + esc(name) + '" placeholder="e.g. Ada Obi" autocomplete="name">' +
                '<div class="field-error" id="welcome-error"></div>' +
              '</div>' +
              '<button class="btn btn-primary btn-block" type="submit" style="margin-top:18px">' + IMS.icon("arrow") + esc(startLabel) + '</button>' +
            '</form>' +
            (hasName ? '<div class="welcome-resume">Course progress: <strong>' + percent + '%</strong> complete. <a href="#/course">Open the course map</a></div>' : '') +
            '<div class="welcome-numbers">' +
              '<div class="welcome-number"><strong>6</strong><span>Core modules</span></div>' +
              '<div class="welcome-number"><strong>7</strong><span>Units</span></div>' +
              '<div class="welcome-number"><strong>100%</strong><span>Offline</span></div>' +
            '</div>' +
          '</div>' +
        '</section>' +
      '</div>';
  }
  function renderCourse() {
    var percent = overallPercent();
    var done = IMS.modules.filter(function (module) { return moduleStats(module).complete; }).length;
    var next = nextModule();
    var cards = IMS.modules.map(function (module) {
      var stats = moduleStats(module);
      var status = stats.complete
        ? '<span class="pill pill-green">Complete</span>'
        : stats.started
          ? '<span class="pill pill-blue">In progress</span>'
          : '<span class="pill pill-gray">Not started</span>';
      var best = stats.progress.quizBest != null
        ? stats.progress.quizBest + " / " + (stats.progress.quizBestTotal || module.quiz.length)
        : "\u2014";
      return '<a class="card module-card ' + (stats.complete ? "complete" : stats.started ? "in-progress" : "") + '" href="' + moduleHref(module) + '">' +
        '<div class="module-top">' +
          '<div class="module-num">' + (stats.complete ? IMS.icon("check", "icon-sm") : module.order) + '</div>' +
          '<div class="grow"><h3>' + esc(module.title) + '</h3><p>' + esc(module.short) + '</p></div>' +
          status +
        '</div>' +
        '<div class="module-progress-bar"><span style="width:' + stats.percent + '%"></span></div>' +
        '<div class="module-meta"><span>' + (module.final
          ? module.quiz.length + ' questions &middot; best score ' + esc(best)
          : stats.doneMissions + ' / ' + stats.totalMissions + ' missions &middot; best quiz ' + esc(best)) + '</span><span>' + stats.percent + '%</span></div>' +
      '</a>';
    }).join("");

    var primary = next
      ? '<a class="btn btn-primary" href="' + moduleHref(next) + '">' + (percent ? "Continue training" : "Start first module") + IMS.icon("arrow") + '</a>'
      : '<a class="btn btn-success" href="#/certificate">' + IMS.icon("award") + 'View certificate</a>';

    return '<div class="card course-hero">' +
        '<div class="ring" style="--p:' + percent + '"><div class="ring-inner"><div><strong>' + percent + '%</strong><span>complete</span></div></div></div>' +
        '<div class="grow">' +
          '<h1>' + (percent === 100 ? "Course complete" : "Your training course") + '</h1>' +
          '<p>' + esc(store.state.trainee.name) + ' &middot; ' + done + ' of ' + IMS.modules.length + ' units complete &middot; Practising as ' + esc(role().label) + '</p>' +
          '<div class="hero-actions">' + primary + '<a class="btn btn-secondary" href="#/progress">View progress</a></div>' +
        '</div>' +
      '</div>' +
      '<div class="section-head"><div><h2>Modules</h2><p>Learn, practise, then pass the short quiz. Modules can be taken in any order.</p></div></div>' +
      '<div class="module-grid">' + cards + '</div>';
  }
  function renderLesson(module) {
    var progress = store.getProgress(module.id);
    var steps = module.steps.map(function (step, index) {
      return '<div class="lesson-step">' +
        '<div class="step-num">' + (index + 1) + '</div>' +
        '<div class="grow"><h3>' + esc(step.title) + '</h3><p>' + esc(step.body) + '</p>' +
          (step.callout ? '<div class="callout">' + IMS.icon("info") + '<span>' + esc(step.callout) + '</span></div>' : "") +
        '</div>' +
      '</div>';
    }).join("");

    var keyPoints = module.keyPoints.map(function (point) {
      return '<li>' + esc(point) + '</li>';
    }).join("");

    return '<div class="lesson-head">' +
        '<div class="eyebrow">Module ' + module.order + ' of ' + IMS.modules.length + '</div>' +
        '<h1>' + esc(module.title) + '</h1>' +
        '<p>' + esc(module.intro) + '</p>' +
        (progress.lessonRead ? '<div style="margin-top:10px"><span class="pill pill-green">' + IMS.icon("check", "icon-sm") + ' Lesson read</span></div>' : "") +
      '</div>' +
      steps +
      '<div class="keypoints"><h3>Key points</h3><ul>' + keyPoints + '</ul></div>' +
      IMS.sandbox.missionPanel(module.id) +
      '<div class="lesson-actions">' +
        '<button class="btn btn-secondary" data-action="lesson-read" data-id="' + esc(module.id) + '">' + IMS.icon("check") + 'Mark as read</button>' +
        '<button class="btn btn-primary" data-action="start-practice" data-id="' + esc(module.id) + '" data-tab="' + esc(module.practice) + '">' + IMS.icon("arrow") + 'Start practice</button>' +
        '<a class="btn btn-ghost" href="#/course">Back to course</a>' +
      '</div>';
  }
  function ensureQuiz(module) {
    if (!ui.quiz || ui.quiz.moduleId !== module.id) {
      ui.quiz = {
        moduleId: module.id,
        index: 0,
        answers: module.quiz.map(function () { return null; }),
        done: false,
        score: null
      };
    }
    return ui.quiz;
  }

  function renderQuiz(module) {
    var state = ensureQuiz(module);
    var total = module.quiz.length;
    var passCount = Math.ceil(total * IMS.config.passMark);

    if (state.done) {
      var score = state.score;
      var passed = score / total >= IMS.config.passMark;
      var stats = moduleStats(module);
      var certReady = allComplete();
      return '<div class="quiz-wrap">' +
        '<div class="card quiz-card quiz-result">' +
          '<div class="cert-seal" style="margin-bottom:16px">' + IMS.icon(passed ? "award" : "refresh") + '</div>' +
          '<h1 style="font-size:24px">' + (passed ? "Quiz passed" : "Keep practising") + '</h1>' +
          '<div class="quiz-score" style="color:' + (passed ? "var(--accent)" : "var(--danger)") + '">' + score + ' / ' + total + '</div>' +
          '<p>' + (passed
            ? (stats.complete ? "This module is complete." : "Quiz passed. Finish the lesson and practice missions to complete the module.")
            : "You need " + passCount + " correct answers to pass. Review the lesson and try again.") + '</p>' +
          (module.final && passed
            ? '<p style="margin-top:10px">' + (certReady ? "Every unit is complete. Your certificate is ready." : "Passing the assessment is done. Complete the remaining modules to unlock the certificate.") + '</p>'
            : "") +
          '<div class="quiz-actions" style="justify-content:center;margin-top:24px">' +
            '<button class="btn btn-secondary" data-action="quiz-retry">' + IMS.icon("refresh") + 'Retry quiz</button>' +
            '<a class="btn btn-secondary" href="#/course">Back to course</a>' +
            (certReady ? '<a class="btn btn-primary" href="#/certificate">' + IMS.icon("award") + 'Certificate</a>' : '<a class="btn btn-primary" href="#/progress">View progress</a>') +
          '</div>' +
        '</div>' +
      '</div>';
    }

    var question = module.quiz[state.index];
    var selected = state.answers[state.index];
    var answered = selected != null;
    var dots = module.quiz.map(function (item, index) {
      var done = state.answers[index] != null;
      return '<span class="quiz-dot ' + (done ? "done" : "") + '"></span>';
    }).join("");
    var options = question.options.map(function (option, index) {
      var cls = "";
      if (answered) {
        if (index === question.answer) cls = "correct";
        else if (index === selected) cls = "wrong";
      }
      return '<button class="quiz-option ' + cls + '" data-action="quiz-answer" data-index="' + index + '"' + (answered ? " disabled" : "") + '>' +
        '<span class="letter">' + String.fromCharCode(65 + index) + '</span>' +
        '<span>' + esc(option) + '</span>' +
      '</button>';
    }).join("");
    var feedback = answered
      ? '<div class="quiz-feedback"><div class="callout ' + (selected === question.answer ? "green" : "danger") + '">' + IMS.icon(selected === question.answer ? "check" : "alert") + '<span>' + (selected === question.answer ? "Correct. " : "Not quite. ") + esc(question.explain) + '</span></div></div>'
      : "";
    var last = state.index === total - 1;

    return '<div class="quiz-wrap">' +
      '<div class="quiz-top">' +
        '<div><div class="eyebrow" style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--primary)">' + (module.final ? "Final assessment" : "Module " + module.order + " quiz") + '</div><h1 class="quiz-title">' + esc(module.title) + '</h1></div>' +
        '<span class="pill pill-gray">Question ' + (state.index + 1) + ' of ' + total + '</span>' +
      '</div>' +
      '<div class="quiz-dots" style="margin-bottom:16px">' + dots + '</div>' +
      '<div class="card quiz-card">' +
        '<h2>' + esc(question.q) + '</h2>' +
        '<div class="quiz-options">' + options + '</div>' +
        feedback +
        '<div class="quiz-actions">' +
          (answered
            ? '<button class="btn btn-primary" data-action="quiz-next">' + (last ? "Finish quiz" : "Next question") + IMS.icon("arrow") + '</button>'
            : '<span class="small muted">Choose an answer to continue.</span>') +
        '</div>' +
      '</div>' +
      '<div class="small muted" style="text-align:center;margin-top:14px">Pass mark: ' + Math.round(IMS.config.passMark * 100) + '% &middot; ' + passCount + ' of ' + total + ' correct</div>' +
    '</div>';
  }
  function renderProgress() {
    var percent = overallPercent();
    var done = IMS.modules.filter(function (module) { return moduleStats(module).complete; }).length;
    var rows = IMS.modules.map(function (module) {
      var stats = moduleStats(module);
      var best = stats.progress.quizBest != null
        ? stats.progress.quizBest + " / " + (stats.progress.quizBestTotal || module.quiz.length)
        : "\u2014";
      return '<div class="card progress-item">' +
        '<div class="module-num">' + (stats.complete ? IMS.icon("check", "icon-sm") : module.order) + '</div>' +
        '<div class="grow"><strong style="font-size:14px">' + esc(module.title) + '</strong>' +
          '<div class="progress-meta small muted">' +
            (module.final
              ? '<span>Assessment: ' + (stats.progress.quizPassed ? "passed" : "not passed") + '</span><span>&middot;</span><span>' + module.quiz.length + ' questions</span><span>&middot;</span><span>Best: ' + esc(best) + '</span>'
              : '<span>Lesson: ' + (stats.progress.lessonRead ? "read" : "not read") + '</span><span>&middot;</span><span>' + stats.doneMissions + '/' + stats.totalMissions + ' missions</span><span>&middot;</span><span>Quiz best: ' + esc(best) + '</span>') +
          '</div>' +
        '</div>' +
        (stats.complete ? '<span class="pill pill-green">Complete</span>' : stats.started ? '<span class="pill pill-blue">In progress</span>' : '<span class="pill pill-gray">Not started</span>') +
      '</div>';
    }).join("");

    var unlocked = allComplete();
    var finalProgress = store.getProgress("final");
    var finalScore = finalProgress.quizBest != null ? finalProgress.quizBest + " / " + (finalProgress.quizBestTotal || 10) : "\u2014";

    return '<div class="card course-hero">' +
        '<div class="ring" style="--p:' + percent + '"><div class="ring-inner"><div><strong>' + percent + '%</strong><span>complete</span></div></div></div>' +
        '<div class="grow"><h1>Your progress</h1><p>' + done + ' of ' + IMS.modules.length + ' units complete &middot; Final assessment: ' + esc(finalScore) + '</p>' +
          '<div class="hero-actions">' + (done === IMS.modules.length ? '<a class="btn btn-primary" href="#/certificate">' + IMS.icon("award") + 'View certificate</a>' : '<a class="btn btn-primary" href="#/course">Continue training</a>') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="progress-list">' + rows + '</div>' +
      '<div class="card card-pad" style="margin-top:18px"><div class="row-between">' +
        '<div><h2>Certificate</h2><p class="small muted" style="margin-top:4px">' + (unlocked ? "All units complete. Your certificate is ready to print." : "Complete the lessons, missions, and quizzes for every unit to unlock it.") + '</p></div>' +
        (unlocked ? '<a class="btn btn-success" href="#/certificate">' + IMS.icon("award") + 'Open certificate</a>' : '<span class="pill pill-gray">' + IMS.icon("lock", "icon-sm") + ' Locked</span>') +
      '</div></div>';
  }
  function renderCertificate() {
    if (!allComplete()) {
      return '<div class="card card-pad" style="text-align:center;max-width:560px;margin:0 auto">' +
        '<div class="cert-seal">' + IMS.icon("lock") + '</div>' +
        '<h1 style="font-size:22px">Certificate locked</h1>' +
        '<p class="muted" style="margin-top:8px">Complete every lesson, practice mission, and quiz to unlock your certificate.</p>' +
        '<a class="btn btn-primary" href="#/course" style="margin-top:20px">Back to course</a>' +
      '</div>';
    }
    var finalProgress = store.getProgress("final");
    var score = finalProgress.quizBest != null ? finalProgress.quizBest + " / " + (finalProgress.quizBestTotal || 10) : "Passed";
    var today = IMS.formatDate(IMS.localDateISO());

    return '<div class="certificate-shell">' +
      '<div class="row-between" style="margin-bottom:18px">' +
        '<div><h1 style="font-size:22px">Your certificate</h1><p class="small muted">Print it or save it as a PDF.</p></div>' +
        '<button class="btn btn-primary" data-action="certificate-print">' + IMS.icon("printer") + 'Print certificate</button>' +
      '</div>' +
      '<div class="certificate" id="certificate-doc">' +
        '<div class="cert-frame">' +
          '<div class="cert-seal">' + IMS.icon("award") + '</div>' +
          '<div class="cert-kicker">NASFON IMS TUTOR</div>' +
          '<h1>Certificate of Completion</h1>' +
          '<p class="cert-copy">This certifies that</p>' +
          '<div class="cert-name">' + esc(store.state.trainee.name) + '</div>' +
          '<div class="cert-line"></div>' +
          '<p class="cert-copy">has completed the NASFON inventory management training, including products, customers, sales, receipts, credit, and data safety.</p>' +
          '<div class="cert-meta">' +
            '<div>Date<strong>' + esc(today) + '</strong></div>' +
            '<div>Final assessment<strong>' + esc(score) + '</strong></div>' +
            '<div>Modules<strong>' + IMS.modules.length + ' / ' + IMS.modules.length + '</strong></div>' +
          '</div>' +
          '<div class="cert-sign">Training facilitator</div>' +
        '</div>' +
      '</div>' +
      '<p class="small muted" style="text-align:center;margin-top:14px">This is a training certificate. It is not a business licence.</p>' +
    '</div>';
  }
  function renderSettings() {
    var roles = IMS.config.roles.map(function (item) {
      var perms = item.permissions.map(function (permission) {
        return permissionLabels[permission] || permission;
      }).join(", ");
      return '<div class="card card-pad" style="box-shadow:none">' +
        '<div class="row-between"><h3>' + esc(item.label) + '</h3>' + (store.state.role === item.id ? '<span class="pill pill-blue">Current role</span>' : '') + '</div>' +
        '<p class="small muted" style="margin-top:6px">' + esc(item.description) + '</p>' +
        '<p class="small" style="margin-top:8px"><strong>Access:</strong> ' + esc(perms) + '</p>' +
      '</div>';
    }).join("");

    return '<div class="page-head"><div><h1>Settings</h1><p>Profile, backups, and training data controls.</p></div></div>' +
      IMS.sandbox.missionPanel("roles") +
      '<div class="stack">' +
        '<div class="card card-pad">' +
          '<div class="section-head"><div><h2>Your profile</h2><p>The name used on your certificate.</p></div></div>' +
          '<form id="settings-name-form" novalidate style="max-width:420px">' +
            '<div class="field"><label for="settings-name">Name</label><input class="input" id="settings-name" name="name" maxlength="60" value="' + esc(store.state.trainee.name) + '"><div class="field-error" id="settings-name-error"></div></div>' +
            '<button class="btn btn-primary" type="submit" style="margin-top:14px">Save name</button>' +
          '</form>' +
        '</div>' +
        '<div class="card card-pad">' +
          '<div class="section-head"><div><h2>Backup</h2><p>Export a copy of your training data or restore one.</p></div></div>' +
          '<div class="row" style="flex-wrap:wrap">' +
            '<button class="btn btn-primary" data-action="export-backup">' + IMS.icon("download") + 'Export backup</button>' +
            '<label class="btn btn-secondary" for="import-file">' + IMS.icon("upload") + 'Import backup</label>' +
            '<input type="file" id="import-file" class="hidden" accept="application/json,.json">' +
          '</div>' +
          '<p class="help" style="margin-top:10px">The export is a JSON file containing your practice data and course progress.</p>' +
        '</div>' +
        '<div class="card card-pad">' +
          '<div class="section-head"><div><h2>Role access</h2><p>Switch roles from the top bar to see the difference.</p></div></div>' +
          '<div class="stack" style="gap:10px">' + roles + '</div>' +
        '</div>' +
        '<div class="card card-pad" style="border-color:#fecaca">' +
          '<div class="section-head"><div><h2>Training data</h2><p>These actions cannot be undone. They affect only this training copy.</p></div></div>' +
          '<div class="row" style="flex-wrap:wrap">' +
            '<button class="btn btn-secondary" data-action="reset-practice">' + IMS.icon("refresh") + 'Reset practice data</button>' +
            '<button class="btn btn-secondary" data-action="reset-progress">' + IMS.icon("refresh") + 'Reset course progress</button>' +
            '<button class="btn btn-danger-soft" data-action="reset-all">' + IMS.icon("trash") + 'Reset everything</button>' +
          '</div>' +
          '<p class="help" style="margin-top:10px">Reset practice data keeps your course progress. Reset everything clears the trainee name too.</p>' +
        '</div>' +
      '</div>';
  }

  function renderRestricted(permission, label) {
    store.setFlag("restrictedAttempt");
    var current = role();
    return '<div class="card card-pad" style="max-width:600px;margin:0 auto;text-align:center">' +
      '<div class="cert-seal" style="background:var(--warning-soft);color:#92400e">' + IMS.icon("lock") + '</div>' +
      '<h1 style="font-size:23px">Access restricted</h1>' +
      '<p class="muted" style="margin-top:8px">The ' + esc(current.label) + ' role cannot open ' + esc(label) + '. This is how the real system protects sensitive areas.</p>' +
      '<div class="callout" style="text-align:left;margin-top:18px">' + IMS.icon("info") + '<span>' + esc(current.description) + ' Switch roles in the top bar to continue this part of the training.</span></div>' +
      '<div class="row" style="justify-content:center;margin-top:20px;flex-wrap:wrap">' +
        '<a class="btn btn-secondary" href="#/practice/dashboard">Go to dashboard</a>' +
        '<button class="btn btn-primary" data-action="switch-admin">Switch to Admin</button>' +
      '</div>' +
    '</div>';
  }
  function renderCurrent() {
    var route = parseRoute();
    var name = store.state.trainee.name.trim();

    if (!name && route.name !== "welcome") {
      renderWelcome();
      return;
    }

    if (route.name === "welcome") {
      renderWelcome();
      return;
    }

    var content = "";
    var contentClass = "";
    var title = pageTitleFor(route);

    if (route.name === "course") {
      content = renderCourse();
    } else if (route.name === "module") {
      var module = IMS.moduleById(route.id);
      if (!module) { go("#/course"); return; }
      if (module.final) { window.location.hash = "#/quiz/final"; return; }
      content = renderLesson(module);
      contentClass = "lesson";
      title = module.title;
    } else if (route.name === "quiz") {
      var quizModule = IMS.moduleById(route.id);
      if (!quizModule) { go("#/course"); return; }
      content = renderQuiz(quizModule);
      title = (quizModule.final ? "Final assessment" : quizModule.title + " quiz");
    } else if (route.name === "practice") {
      var tabId = route.tab;
      var tab = practiceTabs.find(function (item) { return item.id === tabId; });
      if (!tab) { go("#/practice/dashboard"); return; }
      if (tabId !== "dashboard" && !can(tabId)) {
        content = renderRestricted(tabId, tab.label);
        title = "Access restricted";
      } else {
        content = IMS.sandbox.render(tabId);
        title = tab.label === "Dashboard" ? "Practice dashboard" : tab.label;
      }
    } else if (route.name === "progress") {
      content = renderProgress();
    } else if (route.name === "certificate") {
      content = renderCertificate();
    } else if (route.name === "settings") {
      if (!can("settings")) {
        content = renderRestricted("settings", "Settings");
        title = "Access restricted";
      } else {
        content = renderSettings();
      }
    } else {
      content = renderCourse();
      title = "Course map";
    }

    document.title = title + " \u00b7 NASFON IMS TUTOR";
    document.getElementById("app").innerHTML = shell(route, content, contentClass);
  }
  function openModal(options) {
    var root = document.getElementById("modal-root");
    var size = options.size === "wide" ? "wide" : options.size === "slim" ? "slim" : "";
    ui.lastFocus = document.activeElement;
    root.innerHTML = '<div class="modal-backdrop" data-modal-backdrop>' +
      '<div class="modal ' + size + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<div class="modal-head">' +
          '<div><h2 id="modal-title">' + esc(options.title || "") + '</h2>' + (options.subtitle ? '<p>' + esc(options.subtitle) + '</p>' : "") + '</div>' +
          '<button class="modal-close" data-action="modal-close" aria-label="Close dialog">' + IMS.icon("close") + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (options.body || "") + '</div>' +
        (options.footer ? '<div class="modal-foot">' + options.footer + '</div>' : "") +
      '</div>' +
    '</div>';
    document.body.style.overflow = "hidden";
    var modal = root.querySelector(".modal");
    var first = modal.querySelector("input:not([type=hidden]), select, textarea");
    if (!first) first = modal.querySelector(".modal-foot .btn, .modal-close");
    if (first) window.setTimeout(function () { first.focus(); }, 20);
    return modal;
  }

  function closeModal() {
    var root = document.getElementById("modal-root");
    if (!root || !root.firstChild) return;
    var target = ui.lastFocus;
    root.innerHTML = "";
    document.body.style.overflow = "";
    ui.lastFocus = null;
    if (target && document.body.contains(target)) {
      try { target.focus(); } catch (error) { }
    }
  }

  function toast(message, type) {
    var root = document.getElementById("toast-root");
    if (!root) return;
    var node = document.createElement("div");
    node.className = "toast " + (type === "error" ? "error" : "");
    node.setAttribute("role", "status");
    node.innerHTML = IMS.icon(type === "error" ? "alert" : "check") + "<span>" + esc(message) + "</span>";
    root.appendChild(node);
    window.setTimeout(function () {
      node.style.opacity = "0";
      node.style.transform = "translateY(-6px)";
      node.style.transition = "opacity .2s ease, transform .2s ease";
      window.setTimeout(function () { node.remove(); }, 220);
    }, 3400);
  }

  IMS.ui = {
    openModal: openModal,
    closeModal: closeModal,
    toast: toast
  };

  function toggleMenu(open) {
    var sidebarNode = document.getElementById("sidebar");
    var scrim = document.getElementById("scrim");
    if (!sidebarNode || !scrim) return;
    var next = typeof open === "boolean" ? open : !sidebarNode.classList.contains("open");
    sidebarNode.classList.toggle("open", next);
    scrim.classList.toggle("show", next);
  }
  function downloadBackup() {
    try {
      var data = store.exportJSON();
      var blob = new Blob([data], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "nasfon-ims-training-backup.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      store.setFlag("backupExported");
      toast("Backup exported.");
      renderCurrent();
    } catch (error) {
      toast("The backup could not be created.", "error");
    }
  }

  function handleImport(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var result = store.importJSON(String(reader.result || ""));
      input.value = "";
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      toast("Backup imported.");
      ui.quiz = null;
      if (!store.state.trainee.name.trim()) {
        window.location.hash = "#/";
      } else {
        renderCurrent();
      }
    };
    reader.onerror = function () {
      input.value = "";
      toast("The file could not be read.", "error");
    };
    reader.readAsText(file);
  }

  function confirmAction(options) {
    var body = '<p>' + esc(options.message) + '</p>' +
      (options.warning ? '<div class="callout warn" style="margin-top:14px">' + IMS.icon("alert") + '<span>' + esc(options.warning) + '</span></div>' : "");
    var footer = '<button class="btn btn-secondary" data-action="modal-close">Cancel</button>' +
      '<button class="btn ' + (options.danger ? "btn-danger" : "btn-primary") + '" id="confirm-action">' + esc(options.label || "Confirm") + '</button>';
    var modal = openModal({ title: options.title, body: body, footer: footer, size: "slim" });
    modal.querySelector("#confirm-action").addEventListener("click", function () {
      options.onConfirm();
    });
  }

  var permissions = {
    resetPractice: function () {
      store.resetPractice();
      IMS.sandbox.resetSales();
      closeModal();
      toast("Practice data reset.");
      renderCurrent();
    },
    resetProgress: function () {
      closeModal();
      store.resetProgress();
      ui.quiz = null;
      toast("Course progress reset.");
      renderCurrent();
    },
    resetAll: function () {
      closeModal();
      store.resetAll();
      IMS.sandbox.resetSales();
      ui.quiz = null;
      toast("Training data reset.");
      window.location.hash = "#/";
      renderCurrent();
    }
  };
  function printCertificate() {
    var doc = document.getElementById("certificate-doc");
    if (!doc) return;
    var root = document.getElementById("print-root");
    root.innerHTML = doc.outerHTML;
    document.body.classList.add("printing");
    function cleanup() {
      document.body.classList.remove("printing");
      root.innerHTML = "";
    }
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 2000);
  }
  function onDocumentClick(event) {
    var navTarget = event.target.closest ? event.target.closest(".nav-link, .brand") : null;
    if (navTarget) toggleMenu(false);

    var backdrop = event.target.closest ? event.target.closest("[data-modal-backdrop]") : null;
    if (backdrop && event.target === backdrop) {
      closeModal();
      return;
    }

    var target = event.target.closest ? event.target.closest("[data-action]") : null;
    if (!target) return;
    var action = target.getAttribute("data-action");
    var id = target.getAttribute("data-id");
    var tab = target.getAttribute("data-tab");

    if (action === "toggle-menu") { toggleMenu(); return; }
    if (action === "close-menu") { toggleMenu(false); return; }
    if (action === "modal-close") { closeModal(); return; }

    if (action === "lesson-read") {
      store.markLessonRead(id);
      IMS.sandbox.refresh();
      toast("Lesson marked as read.");
      return;
    }
    if (action === "start-practice") {
      store.markLessonRead(id);
      toggleMenu(false);
      go("#/practice/" + tab);
      return;
    }
    if (action === "quiz-answer") {
      var module = IMS.moduleById(ui.quiz ? ui.quiz.moduleId : "");
      if (!module) return;
      var index = Number(target.getAttribute("data-index"));
      if (ui.quiz.answers[ui.quiz.index] != null) return;
      ui.quiz.answers[ui.quiz.index] = index;
      renderCurrent();
      return;
    }
    if (action === "quiz-next") {
      var quizModule = IMS.moduleById(ui.quiz ? ui.quiz.moduleId : "");
      if (!quizModule) return;
      if (ui.quiz.index < quizModule.quiz.length - 1) {
        ui.quiz.index += 1;
        renderCurrent();
        return;
      }
      var correct = ui.quiz.answers.reduce(function (sum, answer, position) {
        return sum + (answer === quizModule.quiz[position].answer ? 1 : 0);
      }, 0);
      store.recordQuiz(quizModule.id, correct, quizModule.quiz.length);
      ui.quiz.done = true;
      ui.quiz.score = correct;
      renderCurrent();
      return;
    }
    if (action === "quiz-retry") {
      ui.quiz = null;
      renderCurrent();
      return;
    }

    if (action === "product-add") { IMS.sandbox.openProductForm(null); return; }
    if (action === "product-edit") { IMS.sandbox.openProductForm(id); return; }
    if (action === "product-delete") { IMS.sandbox.confirmDeleteProduct(id); return; }
    if (action === "stock-add") { IMS.sandbox.openStockForm(id); return; }
    if (action === "customer-add") { IMS.sandbox.openCustomerForm(null); return; }
    if (action === "customer-edit") { IMS.sandbox.openCustomerForm(id); return; }
    if (action === "customer-delete") { IMS.sandbox.deleteCustomerFlow(id); return; }
    if (action === "customer-detail") { IMS.sandbox.openCustomerDetail(id); return; }
    if (action === "credit-pay") { IMS.sandbox.openPaymentForm(id); return; }

    if (action === "cart-add") { IMS.sandbox.addToCart(id); return; }
    if (action === "cart-inc") { IMS.sandbox.changeQty(id, 1); return; }
    if (action === "cart-dec") { IMS.sandbox.changeQty(id, -1); return; }
    if (action === "cart-remove") { IMS.sandbox.removeFromCart(id); return; }
    if (action === "checkout") { IMS.sandbox.checkout(); return; }

    if (action === "receipt-view") { IMS.sandbox.viewReceipt(id); return; }
    if (action === "receipt-print") { IMS.sandbox.printReceipt(id); return; }
    if (action === "receipt-download") { IMS.sandbox.downloadReceipt(id); return; }
    if (action === "certificate-print") { printCertificate(); return; }

    if (action === "switch-admin") {
      store.setRole("admin");
      toggleMenu(false);
      toast("Role switched to Admin.");
      IMS.sandbox.refresh();
      return;
    }

    if (action === "export-backup") { downloadBackup(); return; }
    if (action === "reset-practice") {
      confirmAction({
        title: "Reset practice data?",
        message: "Products, customers, sales, payments, and the role will return to the seeded training data. Your course progress stays.",
        warning: "This cannot be undone.",
        label: "Reset practice data",
        danger: true,
        onConfirm: permissions.resetPractice
      });
      return;
    }
    if (action === "reset-progress") {
      confirmAction({
        title: "Reset course progress?",
        message: "Lessons, quizzes, mission flags, and the certificate will be cleared. Practice data stays.",
        warning: "This cannot be undone.",
        label: "Reset progress",
        danger: true,
        onConfirm: permissions.resetProgress
      });
      return;
    }
    if (action === "reset-all") {
      confirmAction({
        title: "Reset everything?",
        message: "All practice data, course progress, and your trainee name will be cleared.",
        warning: "This cannot be undone.",
        label: "Reset everything",
        danger: true,
        onConfirm: permissions.resetAll
      });
    }
  }

  function onDocumentChange(event) {
    var target = event.target;
    if (target.id === "role-select") {
      if (!store.setRole(target.value)) {
        target.value = store.state.role;
        return;
      }
      toggleMenu(false);
      toast("Role switched to " + role().label + ".");
      renderCurrent();
      return;
    }
    if (target.id === "import-file") {
      handleImport(target);
      return;
    }
    var action = target.getAttribute("data-change");
    if (!action) return;
    var sale = IMS.sandbox.getSaleState();
    if (action === "sale-customer") {
      sale.customerId = target.value;
      return;
    }
    if (action === "sale-payment") {
      sale.payment = target.value;
      IMS.sandbox.refresh();
      return;
    }
    if (action === "sale-discount") {
      sale.discount = Math.max(0, Math.round(Number(target.value) || 0));
      IMS.sandbox.refresh();
      return;
    }
    if (action === "sale-due") {
      sale.dueDate = target.value;
    }
  }

  function onDocumentInput(event) {
    var target = event.target;
    var selector = target.getAttribute && target.getAttribute("data-filter");
    if (!selector) return;
    var query = target.value.trim().toLowerCase();
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (node) {
      var haystack = node.getAttribute("data-search") || "";
      node.classList.toggle("hidden", Boolean(query) && haystack.indexOf(query) === -1);
    });
  }

  function onDocumentSubmit(event) {
    var form = event.target;
    if (form.id === "welcome-form") {
      event.preventDefault();
      var input = form.elements.name;
      var name = input.value.trim();
      var error = document.getElementById("welcome-error");
      if (name.length < 2) {
        if (error) error.textContent = "Enter your name (at least 2 characters).";
        input.classList.add("invalid");
        input.focus();
        return;
      }
      if (name.length > 60) {
        if (error) error.textContent = "Keep your name under 60 characters.";
        input.classList.add("invalid");
        input.focus();
        return;
      }
      if (error) error.textContent = "";
      input.classList.remove("invalid");
      store.setName(name);
      toast("Welcome, " + name.split(/\s+/)[0] + ".");
      go("#/course");
      return;
    }
    if (form.id === "settings-name-form") {
      event.preventDefault();
      var nameInput = form.elements.name;
      var value = nameInput.value.trim();
      var node = document.getElementById("settings-name-error");
      if (value.length < 2) {
        if (node) node.textContent = "Enter your name (at least 2 characters).";
        nameInput.classList.add("invalid");
        nameInput.focus();
        return;
      }
      if (node) node.textContent = "";
      nameInput.classList.remove("invalid");
      store.setName(value);
      toast("Name saved.");
      renderCurrent();
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      if (document.querySelector("#modal-root .modal")) {
        closeModal();
        return;
      }
      toggleMenu(false);
      return;
    }
    if (event.key !== "Tab") return;
    var modal = document.querySelector("#modal-root .modal");
    if (!modal) return;
    var focusables = Array.prototype.slice.call(modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
      .filter(function (node) { return !node.disabled && node.type !== "hidden"; });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  function init() {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("change", onDocumentChange);
    document.addEventListener("input", onDocumentInput);
    document.addEventListener("submit", onDocumentSubmit);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("hashchange", function () {
      closeModal();
      toggleMenu(false);
      renderCurrent();
    });
    renderCurrent();
  }

  IMS.app = {
    render: renderCurrent,
    refresh: function () { renderCurrent(); },
    currentRoute: parseRoute
  };

  init();
})();
