(function () {

  const API_BASE = "http://localhost:6001";

  console.log('Dashboard loading...');
  console.log('localStorage keys:', Object.keys(localStorage));


  const token = localStorage.getItem("token");
  console.log('Token:', token ? 'Present' : 'Missing');
  if (!token) {
    console.warn('No token, redirecting to auth');
    window.location.href = "auth.html";
    return;
  }
  console.log('Auth OK, continuing...');


  const html = document.documentElement;
  html.setAttribute("data-theme", localStorage.getItem("theme") || "dark");

  const themeToggle = document.getElementById("themeToggle");
  function refreshThemeIcon() {
    if (!themeToggle) return;
    themeToggle.innerHTML = html.getAttribute("data-theme") === "dark"
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
    lucide?.createIcons();
  }
  themeToggle?.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    refreshThemeIcon();
  });
  if (themeToggle) refreshThemeIcon();


  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userNameEl = document.getElementById("userName");
  const userAvatarEl = document.getElementById("userAvatar");

  if (user.name) {
    if (userNameEl) userNameEl.textContent = user.name;
    if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
  } else if (user.email) {
    const fallbackName = user.email.split('@')[0];
    if (userNameEl) userNameEl.textContent = fallbackName;
    if (userAvatarEl) userAvatarEl.textContent = fallbackName.charAt(0).toUpperCase();
  }


  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "intro.html";
  });


  function showToast(type, message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i data-lucide="${type === "success" ? "check-circle" :
      type === "error" ? "alert-triangle" : "info"
      }"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide?.createIcons();

    // Fade out and remove
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400); // Match CSS transition
    }, 3100);
  }


  const navItems = document.querySelectorAll(".nav-item");
  const views = {
    analysis: document.getElementById("view-analysis"),
    pdfchat: document.getElementById("view-pdfchat"),
    sessions: document.getElementById("view-sessions"),
    settings: document.getElementById("view-settings")
  };

  const pageTitle = document.getElementById("pageTitle");
  const pageSub = document.getElementById("pageSub");

  function setView(name) {
    // 1. Identify current active view
    const currentActive = document.querySelector('.view.active');

    // 2. Identify target view
    const targetView = views[name];
    if (!targetView) return;
    if (currentActive === targetView) return; // Already there

    // 3. Update Nav
    navItems.forEach(b => b.classList.remove("active"));
    document.querySelector(`.nav-item[data-view="${name}"]`)?.classList.add("active");

    // 4. Update Header Text (Delay slightly to match visual transition if desired, or instant)
    if (name === "analysis") {
      pageTitle.textContent = "Data Analysis";
      pageSub.textContent = "Upload CSV or paste numeric values. Export charts and report.";
    } else if (name === "pdfchat") {
      pageTitle.textContent = "Chat with PDF";
      pageSub.textContent = "Upload PDF and chat. AI powered by RAG.";
    } else if (name === "sessions") {
      pageTitle.textContent = "Sessions";
      pageSub.textContent = "History of your previous interactions.";
    } else if (name === "settings") {
      pageTitle.textContent = "Settings";
      pageSub.textContent = "Manage your preferences and profile.";
    }

    // 5. Transition Logic
    if (currentActive) {
      // Fade out
      currentActive.style.opacity = '0';
      currentActive.style.transform = 'translateY(10px)';

      setTimeout(() => {
        currentActive.classList.remove("active");
        currentActive.style.display = 'none'; // Ensure it's gone

        // Prepare target view for entry
        targetView.style.display = 'block';
        targetView.style.opacity = '0';
        targetView.style.transform = 'translateY(10px)';
        targetView.classList.add("active");

        // Force Reflow
        void targetView.offsetWidth;

        // Fade in
        targetView.style.opacity = '1';
        targetView.style.transform = 'translateY(0)';
      }, 300); // Wait for CSS transition (0.3s)
    } else {
      // First load (instant)
      targetView.classList.add("active");
      targetView.style.opacity = '1';
      targetView.style.transform = 'translateY(0)';
    }
  }

  navItems.forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));


  const sessionKey = "insightflow_sessions";
  const sessionList = document.getElementById("sessionList");

  function loadSessions() {
    return JSON.parse(localStorage.getItem(sessionKey) || "[]");
  }
  function saveSessions(s) {
    localStorage.setItem(sessionKey, JSON.stringify(s));
  }
  function renderSessions() {
    const s = loadSessions();
    sessionList.innerHTML = "";
    if (!s.length) {
      sessionList.innerHTML = `<div class="muted">No sessions yet.</div>`;
      return;
    }

    s.slice().reverse().forEach((item, index) => {
      const reportNumber = s.length - index;
      const div = document.createElement("div");
      div.className = "session-item";
      div.innerHTML = `
        <div class="session-meta">
          <strong>${item.title.replace('Report: ID...', `Report #${reportNumber}`)}</strong>
          <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
            <span class="muted tiny">${new Date(item.createdAt).toLocaleString()}</span>
            <span class="muted tiny" style="opacity: 0.4;">|</span>
            <span class="muted tiny">${item.type === 'analysis' ? 'Data Analysis' : 'PDF Chat'}</span>
            <span class="muted tiny" style="opacity: 0.4;">|</span>
            <span class="muted tiny" style="color: var(--accent-cyan); opacity: 0.8;">Report #${reportNumber}</span>
          </div>
        </div>
        <div class="session-actions">
          <button class="btn btn-outline btn-sm" data-action="open">Open</button>
          <button class="btn btn-outline btn-sm" data-action="delete">Delete</button>
        </div>
      `;

      div.querySelector('[data-action="open"]').addEventListener("click", () => {
        currentSessionId = item.id;
        if (item.type === "analysis") {
          setView("analysis");
          csvData = item.csvData || null;
          lastReport = item.report || null;
          if (item.dataInputValue) {
            const dataInput = document.getElementById("dataInput");
            if (dataInput) dataInput.value = item.dataInputValue;
          } else {
            const dataInput = document.getElementById("dataInput");
            if (dataInput) dataInput.value = "";
            if (csvData) renderPreview(csvData);
          }
          if (lastReport) {
            renderReportUI(lastReport);
          } else {
            const proDashboard = document.getElementById("proDashboard");
            if (proDashboard) proDashboard.style.display = "none";
          }
          showToast("info", "Switched to Analysis Session.");
        } else {
          setView("pdfchat");
          currentPdfName = item.pdfName;
          currentDocumentId = item.documentId;
          chatHistory = item.chatHistory || [];
          renderChat();
          showToast("info", "Switched to PDF Chat Session.");
        }
      });

      div.querySelector('[data-action="delete"]').addEventListener("click", () => {
        const all = loadSessions();
        const idx = all.findIndex(x => x.id === item.id);
        if (idx >= 0) {
          all.splice(idx, 1);
          saveSessions(all);
          renderSessions();
          showToast("success", "Session deleted.");
        }
      });

      sessionList.appendChild(div);
    });
  }

  document.getElementById("newSessionBtn")?.addEventListener("click", () => {
    const all = loadSessions();
    currentSessionId = crypto.randomUUID?.() || String(Date.now());
    const activeView = document.querySelector(".nav-item.active")?.dataset.view || "analysis";

    const newSession = {
      id: currentSessionId,
      title: `Session ${all.length + 1}`,
      type: activeView === "pdfchat" ? "pdfchat" : "analysis",
      createdAt: Date.now()
    };
    all.push(newSession);
    saveSessions(all);
    renderSessions();
    showToast("success", "New session created.");

    if (activeView === "analysis") {
      csvData = null;
      lastReport = null;
      const dataInput = document.getElementById("dataInput");
      if (dataInput) dataInput.value = "";
      const fileInput = document.getElementById("fileInput");
      if (fileInput) fileInput.value = "";
      const proDashboard = document.getElementById("proDashboard");
      if (proDashboard) proDashboard.style.display = "none";
    } else if (activeView === "pdfchat") {
      currentPdfName = null;
      currentDocumentId = null;
      chatHistory = [];
      renderChat();
    }
  });

  document.getElementById("clearSessionsBtn")?.addEventListener("click", () => {
    localStorage.removeItem(sessionKey);
    renderSessions();
    showToast("success", "Sessions cleared.");
  });

  document.getElementById("exportSessionsBtn")?.addEventListener("click", () => {
    const s = loadSessions();
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sessions.json";
    a.click();
    URL.revokeObjectURL(url);
  });


  let currentSessionId = null;
  let csvData = null;
  let lastReport = null;
  let barChart = null;
  let pieChart = null;

  const fileInput = document.getElementById("fileInput");
  const dataInput = document.getElementById("dataInput");
  const generateBtn = document.getElementById("generateBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const validationMessage = document.getElementById("validationMessage");
  const insightText = document.getElementById("insightText");
  const tableContent = document.getElementById("tableContent");
  const tableSkeleton = document.getElementById("tableSkeleton");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const barDownload = document.getElementById("barDownload");
  const pieDownload = document.getElementById("pieDownload");

  function showValidation(type, message) {
    validationMessage.classList.remove("hidden", "validation-error", "validation-success");
    validationMessage.classList.add(type === "error" ? "validation-error" : "validation-success");
    validationMessage.innerHTML = `<i data-lucide="${type === "error" ? "alert-circle" : "check-circle"}"></i><span>${message}</span>`;
    lucide?.createIcons();
  }
  function hideValidation() {
    validationMessage.classList.add("hidden");
  }

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error("CSV must contain header + at least 1 row.");

    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(",").map(v => Number(v.trim())));
    return { headers, rows };
  }

  function renderPreview(data) {
    let html = "<table style='width:100%; text-align:left; border-collapse: collapse;'><tr>";
    data.headers.forEach(h => html += `<th style='padding:12px; border-bottom:1px solid rgba(186,150,255,0.2);'>${h}</th>`);
    html += "</tr>";

    data.rows.slice(0, 25).forEach((row, i) => {
      html += `<tr style='animation: slideDownFade 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; animation-delay: ${0.1 + (i * 0.05)}s; border-bottom: 1px solid rgba(255,255,255,0.05);'>`;
      row.forEach(cell => {
        html += `<td style='padding: 12px; color: #E6D2FF;'>${Number.isFinite(cell) ? cell : ""}</td>`;
      });
      html += "</tr>";
    });

    html += "</table>";
    if (tableContent) {
      tableContent.innerHTML = html;
    }
  }

  function showSkeleton() {
    if (tableSkeleton) tableSkeleton.style.display = "block";
    if (tableContent) tableContent.style.display = "none";
  }
  function hideSkeleton() {
    if (tableSkeleton) tableSkeleton.style.display = "none";
    if (tableContent) tableContent.style.display = "block";
  }

  fileInput?.addEventListener("change", (e) => {
    hideValidation();
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showValidation("error", "Upload a valid CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        csvData = parseCSV(ev.target.result);
        renderPreview(csvData);
        showValidation("success", "CSV loaded successfully.");
      } catch (err) {
        showValidation("error", err.message);
      }
    };
    reader.readAsText(file);
  });

  dataInput?.addEventListener("input", () => {
    hideValidation();
    const input = dataInput.value.trim();
    if (!input) return;

    const valid = /^[0-9,\s.\-]+$/.test(input);
    if (!valid) {
      showValidation("error", "Only numbers, commas, dot, minus allowed.");
      return;
    }
    csvData = null;
    showValidation("success", "Valid numeric input detected.");
  });

  generateBtn?.addEventListener("click", () => {
    hideValidation();

    if (!csvData && !dataInput.value.trim()) {
      showValidation("error", "Upload CSV or paste numeric values.");
      return;
    }

    showSkeleton();
    loadingSpinner.classList.remove("hidden");
    generateBtn.disabled = true;

    setTimeout(() => {
      try {
        let data = csvData;
        if (!data) {
          const values = dataInput.value.split(",").map(v => Number(v.trim()));
          data = { headers: ["Values"], rows: values.map(v => [v]) };
        }

        const report = [];
        data.headers.forEach((header, colIndex) => {
          const vals = data.rows.map(r => r[colIndex]).filter(v => Number.isFinite(v));
          if (vals.length === 0) return; // Skip columns that have no valid numeric data

          const total = vals.reduce((a, b) => a + b, 0);
          const avg = total / vals.length;
          const max = Math.max(...vals);
          const min = Math.min(...vals);
          report.push({ header, total, avg, max, min });
        });

        if (report.length === 0) {
          throw new Error("No valid numeric data found in the dataset.");
        }

        lastReport = report;
        hideSkeleton();
        downloadBtn.classList.remove("hidden");

        currentSessionId = crypto.randomUUID?.() || String(Date.now());
        const sessionTitle = csvData ? `Report: ${csvData.headers[0]}...` : `Report: Manual Data`;
        const newSession = {
          id: currentSessionId,
          title: sessionTitle,
          type: "analysis",
          createdAt: Date.now(),
          csvData: csvData,
          report: lastReport,
          dataInputValue: !csvData ? dataInput.value : ""
        };
        const all = loadSessions();
        all.push(newSession);
        saveSessions(all);
        renderSessions();

        renderReportUI(report);
        showToast("success", "Report generated.");
      } catch (err) {
        showValidation("error", err.message);
      } finally {
        loadingSpinner.classList.add("hidden");
        generateBtn.disabled = false;
        hideSkeleton();
      }
    }, 650);
  });

  let kpiCharts = [];

  function renderReportUI(report) {
    document.getElementById("proDashboard").style.display = "block";
    document.getElementById("reportIdDisplay").textContent = currentSessionId || 'N/A';

    // Clean up old charts
    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();
    kpiCharts.forEach(c => { if (c) c.destroy(); });
    kpiCharts = [];

    // Infer Dashboard Theme based on data headers
    const joinedHeaders = report.map(r => r.header).join(" ").toLowerCase();

    // Default Fallback Theme
    let themeTitles = {
      main: "Data Analysis",
      summary: "Summary Report",
      trend: "Trend Overview",
      dist: "Distribution",
      comp: "Composition Ratio",
      perf: "Performance Metrics",
      recent: "Recent Breakdown & Insights"
    };

    if (joinedHeaders.includes("sales") || joinedHeaders.includes("revenue") || joinedHeaders.includes("profit")) {
      themeTitles = { main: "Sales Analytics", summary: "Sales Summary", trend: "Revenue & Profit Trends", dist: "Top Products", comp: "Market Demographics", perf: "Sales Performance", recent: "Recent Transactions & Insights" };
    } else if (joinedHeaders.includes("risk") || joinedHeaders.includes("coverage") || joinedHeaders.includes("breach")) {
      themeTitles = { main: "Risk Metrics", summary: "Risk Evaluation", trend: "Average Risk Over Time", dist: "High-Risk Entities", comp: "Risk By Division", perf: "Mitigation Metrics", recent: "Current Exposures & Insights" };
    } else if (joinedHeaders.includes("price") || joinedHeaders.includes("cost") || joinedHeaders.includes("market")) {
      themeTitles = { main: "Financial Overview", summary: "Financial Summary", trend: "Market Volume Trends", dist: "Asset Distribution", comp: "Portfolio Weights", perf: "Alpha/Beta Ratios", recent: "Latest Trades & Insights" };
    } else if (joinedHeaders.includes("student") || joinedHeaders.includes("score") || joinedHeaders.includes("grade")) {
      themeTitles = { main: "Academic Performance", summary: "Term Summary", trend: "Grade Progression", dist: "Subject Breakdown", comp: "Class Demographics", perf: "Attendance & Pass Rates", recent: "Recent Assessments & Insights" };
    } else if (joinedHeaders.includes("patient") || joinedHeaders.includes("health") || joinedHeaders.includes("blood")) {
      themeTitles = { main: "Health Diagnostics", summary: "Patient Overview", trend: "Vital Trends", dist: "Condition Frequency", comp: "Demographic Spread", perf: "Recovery Metrics", recent: "Latest Diagnostics & Insights" };
    }

    // Inject smart titles into the UI
    const ptMain = document.getElementById("pageTitle"); if (ptMain) ptMain.textContent = themeTitles.main;
    const pSumm = document.getElementById("panelSummaryTitle"); if (pSumm) pSumm.textContent = themeTitles.summary;
    const pTrend = document.getElementById("panelTrendTitle"); if (pTrend) pTrend.textContent = themeTitles.trend;
    const pDist = document.getElementById("panelDistTitle"); if (pDist) pDist.textContent = themeTitles.dist;
    const pComp = document.getElementById("panelCompTitle"); if (pComp) pComp.textContent = themeTitles.comp;
    const pPerf = document.getElementById("panelPerfTitle"); if (pPerf) pPerf.textContent = themeTitles.perf;
    const pRec = document.getElementById("panelRecentTitle"); if (pRec) pRec.textContent = themeTitles.recent;

    // Ensure we have at least 4 columns of data to fake the dashboard feel (or duplicate if small)
    const metrics = report.length >= 4 ? report.slice(0, 4) : [...report, ...report, ...report, ...report].slice(0, 4);

    // Build KPI Cards (Top 4 Boxes)
    for (let i = 0; i < 4; i++) {
      const met = metrics[i];
      if (!met) continue;

      const titleEl = document.getElementById(`kpiTitle${i + 1}`);
      const valEl = document.getElementById(`kpiValue${i + 1}`);

      if (titleEl) titleEl.textContent = met.header;

      if (valEl) {
        if (themeTitles.main === "Sales Analytics" && i === 0) {
          valEl.textContent = "$" + (met.total > 1000 ? (met.total / 1000).toFixed(1) + 'k' : met.total.toFixed(0));
        } else {
          valEl.textContent = met.total > 1000 ? (met.total / 1000).toFixed(1) + 'k' : met.total.toFixed(0);
        }
      }
    }

    // Populate Performance Metrics (Bottom Right Box)
    const p1 = document.getElementById("perfValue1");
    const p2 = document.getElementById("perfValue2");
    const p3 = document.getElementById("perfValue3");

    // Mock calculations based on report averages
    const avgScore = report.reduce((s, r) => s + r.avg, 0) / report.length;
    if (p1) p1.textContent = (avgScore % 15 + 2).toFixed(1) + "%";
    if (p2) p2.textContent = (avgScore % 10 + 1).toFixed(1) + "%";
    if (p3) p3.textContent = (avgScore % 30 + 10).toFixed(1) + "%";

    // Chart Global Overrides for Premium Feel
    Chart.defaults.color = '#a0aec0';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(20, 25, 40, 0.95)';
    Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold', family: "'Outfit', sans-serif" };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 13, family: "'Outfit', sans-serif" };
    Chart.defaults.plugins.tooltip.padding = 16;
    Chart.defaults.plugins.tooltip.cornerRadius = 12;
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;

    // Main Line Chart (Mocking "Revenue Over Time")
    const ctxBar = document.getElementById("mainBarChart").getContext("2d");
    const labels = Array.from({ length: 6 }, (_, i) => ['Apr 1', 'Apr 7', 'Apr 14', 'Apr 21', 'Apr 27', 'May 3'][i]);

    // Gradient for the Line Area
    const grad1 = ctxBar.createLinearGradient(0, 0, 0, 200);
    grad1.addColorStop(0, 'rgba(0, 243, 255, 0.4)');
    grad1.addColorStop(1, 'rgba(124, 92, 255, 0)');

    // Generate smooth trend data based on report metrics
    let baseVal = metrics[0].avg * 0.5;
    const ds1 = labels.map(() => {
      baseVal += (Math.random() * baseVal * 0.4) - (baseVal * 0.1);
      return baseVal;
    });

    barChart = new Chart(ctxBar, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Trend Value',
            data: ds1,
            borderColor: '#00f3ff',
            backgroundColor: grad1,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#00f3ff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          x: {
            type: 'number',
            easing: 'linear',
            duration: 2000,
            from: NaN, // delayed reveal
            delay(ctx) {
              if (ctx.type !== 'data' || ctx.xStarted) {
                return 0;
              }
              ctx.xStarted = true;
              return ctx.index * 300; // staggered delay
            }
          },
          y: {
            type: 'number',
            easing: 'linear',
            duration: 2000,
            from: (ctx) => {
              return ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
            },
            delay(ctx) {
              if (ctx.type !== 'data' || ctx.yStarted) {
                return 0;
              }
              ctx.yStarted = true;
              return ctx.index * 300; // staggered delay
            }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, border: { display: true, dash: [5, 5] }, beginAtZero: false }
        },
        plugins: { legend: { display: false } }
      }
    });

    // Modern Doughnut Chart
    const ctxPie = document.getElementById("mainPieChart").getContext("2d");
    pieChart = new Chart(ctxPie, {
      type: "doughnut",
      data: {
        labels: report.map(r => r.header).slice(0, 4),
        datasets: [{
          data: report.map(r => r.total).slice(0, 4),
          backgroundColor: ['#00f3ff', '#7c5cff', '#10b981', '#f59e0b'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        animation: {
          duration: 3000,
          easing: 'easeOutBounce',
          animateRotate: true,
          animateScale: true
        },
        plugins: {
          legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 6, padding: 15, font: { size: 11 } } },
        }
      }
    });

    // Populate Right Sidebar Progress Bars
    let progressHTML = '';
    const colors = ['#00f3ff', '#7c5cff', '#10b981', '#f59e0b', '#ec4899'];
    report.slice(0, 5).forEach((r, idx) => {
      const percentage = Math.min(100, Math.max(10, (r.avg / r.max) * 100)).toFixed(0);
      progressHTML += `
          <div class="progress-item" style="animation: fadeInUp ${0.5 + (idx * 0.1)}s ease forwards;">
            <div class="progress-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span style="display: inline-block; flex: 1; text-align: left; padding-right: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.header}</span>
              <span class="rate" style="flex-shrink: 0; min-width: 45px; text-align: right;">${percentage}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: 0%; background: ${colors[idx % colors.length]};" data-target="${percentage}%"></div>
            </div>
          </div>
        `;
    });
    document.getElementById("progressList").innerHTML = progressHTML;

    // Trigger progressive fill animations
    setTimeout(() => {
      document.querySelectorAll('.progress-fill').forEach(el => {
        el.style.width = el.getAttribute('data-target');
      });
    }, 100);

    // Setup AI Insights based on Semantic Theme
    const avgOfAvgs = report.reduce((s, r) => s + r.avg, 0) / report.length;
    const insightText = document.getElementById("insightText");
    if (insightText) {
      let generatedInsight = "";
      if (themeTitles.main === "Sales Analytics") {
        generatedInsight = avgOfAvgs >= 50 ? "Profit margins and revenue streams show strong upward consistency." : "Sales channels are underperforming compared to historic averages. Action recommended.";
      } else if (themeTitles.main === "Risk Metrics") {
        generatedInsight = avgOfAvgs >= 50 ? "Warning: High risk metrics detected across multiple relational coverage vectors. Mitigation required." : "Risk matrix is within acceptable thresholds across most business units.";
      } else if (themeTitles.main === "Financial Overview") {
        generatedInsight = "Portfolio exhibits volatility but maintains structural integrity. Cost normalization observed.";
      } else if (themeTitles.main === "Academic Performance") {
        generatedInsight = "Overall student score frequencies have normalized. Grade progression remains stable.";
      } else if (themeTitles.main === "Health Diagnostics") {
        generatedInsight = "Patient vital trends are within expected variance. Demographic spread remains uniform.";
      } else {
        generatedInsight = avgOfAvgs >= 50 ? "Overall dataset indicates high numeric frequencies with strong performance continuity." : "Data points exhibit low average density indicating scope for systemic improvement.";
      }
      insightText.textContent = generatedInsight;
    }

    lucide?.createIcons();
  }

  downloadBtn?.addEventListener("click", () => {
    if (!lastReport) return;
    let csv = "Column,Total,Average,Maximum,Minimum\n";
    lastReport.forEach(r => {
      csv += `${r.header},${r.total},${r.avg.toFixed(2)},${r.max},${r.min}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "CSV downloaded.");
  });

  function downloadChart(id, name) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = name;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  barDownload?.addEventListener("click", () => downloadChart("barChart", "bar_chart.png"));
  pieDownload?.addEventListener("click", () => downloadChart("pieChart", "pie_chart.png"));


  const pdfInput = document.getElementById("pdfInput");
  const chatPrompt = document.getElementById("chatPrompt");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const chatArea = document.getElementById("chatArea");
  const clearChatBtn = document.getElementById("clearChatBtn");


  console.log('PDF Chat Elements:');
  console.log('  pdfInput:', pdfInput ? 'Found' : 'MISSING!');
  console.log('  chatPrompt:', chatPrompt ? 'Found' : 'MISSING!');
  console.log('  sendChatBtn:', sendChatBtn ? 'Found' : 'MISSING!');
  console.log('  chatArea:', chatArea ? 'Found' : 'MISSING!');
  console.log('  clearChatBtn:', clearChatBtn ? 'Found' : 'MISSING!');

  let currentPdfName = null;
  let currentDocumentId = null;
  let chatHistory = [];
  let isUploading = false;



  const savedPdfName = sessionStorage.getItem('currentPdfName');
  const savedDocumentId = sessionStorage.getItem('currentDocumentId');
  if (savedPdfName && savedDocumentId) {
    console.log('Restoring state from sessionStorage');
    currentPdfName = savedPdfName;
    currentDocumentId = savedDocumentId;
    console.log('Restored: PDF=', currentPdfName, 'ID=', currentDocumentId);
  }

  pdfInput?.addEventListener("change", async (e) => {
    console.log('=== PDF INPUT CHANGE EVENT ===');
    if (isUploading) {
      console.warn('Upload already in progress');
      return;
    }
    isUploading = true;
    console.log('Upload started');


    const preventUnload = (evt) => {
      evt.preventDefault();
      evt.returnValue = '';
      console.log('✓ Page unload prevented');
    };
    window.addEventListener('beforeunload', preventUnload);
    console.log('✓ Unload prevention attached');

    try {
      console.log('Step 1: Getting file...');
      const file = e.target.files[0];
      if (!file) {
        console.log('No file selected');
        isUploading = false;
        window.removeEventListener('beforeunload', preventUnload);
        return;
      }
      console.log('✓ File:', file.name);

      console.log('Step 2: Checking file type...');
      if (file.type !== "application/pdf") {
        console.warn('Invalid file type:', file.type);
        showToast("error", "Please upload a valid PDF.");
        isUploading = false;
        window.removeEventListener('beforeunload', preventUnload);
        return;
      }
      console.log('✓ File type is PDF');


      console.log('Step 3: Creating FormData...');
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", "default-rag-project"); // Satisfy older backend versions
      console.log('✓ FormData created');

      console.log('Step 4: Sending fetch request...');
      const res = await fetch(`${API_BASE}/api/rag/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      console.log('✓ Fetch response received, status:', res.status);

      console.log('Step 5: Checking response status...');
      if (!res.ok) {
        console.error('Response not OK');
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      console.log('✓ Response OK');

      console.log('Step 6: Parsing JSON response...');
      const data = await res.json();
      console.log('✓ JSON parsed:', data);

      // Support both wrapped {document: {id}} and unwrapped {id} responses
      const docData = data.document || data;

      console.log('Step 7: Validating document ID...');
      if (!docData || !docData.id) {
        console.error('Document ID missing in response!', data);
        throw new Error('Server returned invalid document ID. Check backend logs.');
      }
      console.log('✓ Document ID valid:', docData.id);

      console.log('Step 8: Updating state variables...');
      currentDocumentId = docData.id;
      currentPdfName = docData.filename || docData.name || file.name;
      console.log('✓ State updated:', { currentPdfName, currentDocumentId });


      console.log('Step 9: Persisting to sessionStorage...');
      sessionStorage.setItem('currentPdfName', currentPdfName);
      sessionStorage.setItem('currentDocumentId', currentDocumentId);
      console.log('✓ SessionStorage updated');

      showToast("success", `PDF uploaded: ${currentPdfName}`);

      chatHistory = [];
      sessionStorage.removeItem('chatHistory'); // Clear old history for new file

      currentSessionId = crypto.randomUUID?.() || String(Date.now());
      const newSession = {
        id: currentSessionId,
        title: `PDF: ${currentPdfName}`,
        type: "pdfchat",
        createdAt: Date.now(),
        pdfName: currentPdfName,
        documentId: currentDocumentId,
        chatHistory: []
      };
      const all = loadSessions();
      all.push(newSession);
      saveSessions(all);
      renderSessions();

      console.log('Step 12: Calling renderChat()...');
      try {
        renderChat();
        if (pdfInput) pdfInput.value = ''; // Reset to allow re-uploading same file
        console.log('✓ renderChat() completed and input reset');
      } catch (renderErr) {
        console.error('✗ renderChat() threw error:', renderErr);
        console.error('  Error message:', renderErr.message);
        console.error('  Error stack:', renderErr.stack);
        throw renderErr;
      }

      console.log('=== UPLOAD COMPLETE - SUCCESS ===');
    } catch (err) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      showToast("error", `Upload error: ${err.message}`);

      if (pdfInput) pdfInput.value = '';
    } finally {
      console.log('Step FINAL: Cleanup...');
      isUploading = false;
      window.removeEventListener('beforeunload', preventUnload);
      console.log('✓ Upload flag reset, unload prevention removed');
    }
  });

  function pushMsg(role, text) {
    chatHistory.push({ role, text, at: Date.now() });

    if (currentSessionId) {
      const all = loadSessions();
      const idx = all.findIndex(x => x.id === currentSessionId);
      if (idx >= 0) {
        all[idx].chatHistory = chatHistory;
        saveSessions(all);
      }
    }

    renderChat();
  }

  function renderChat() {
    if (!chatArea) {
      console.error('chatArea element not found!');
      return;
    }
    console.log('renderChat called, currentPdfName:', currentPdfName, 'chatArea:', chatArea);
    chatArea.innerHTML = "";
    if (!currentPdfName) {
      chatArea.innerHTML = `<div class="placeholder">Upload a PDF and ask a question.</div>`;
      console.log('No PDF - showing placeholder');
      return;
    }
    if (!chatHistory.length) {
      const msg = `PDF ready: ${currentPdfName}. Ask your first question.`;
      chatArea.innerHTML = `<div class="placeholder">${msg}</div>`;
      console.log('PDF ready - showing ready message:', msg);
      return;
    }

    chatHistory.forEach(m => {
      const div = document.createElement("div");
      div.className = `bubble ${m.role === "user" ? "user" : "bot"}`;
      div.textContent = m.text;
      chatArea.appendChild(div);
    });

    chatArea.scrollTop = chatArea.scrollHeight;
  }

  sendChatBtn?.addEventListener("click", async () => {
    const q = chatPrompt.value.trim();
    if (!q) {
      showToast("error", "Type a question.");
      return;
    }
    if (!currentPdfName) {
      showToast("error", "Upload a PDF first.");
      return;
    }

    pushMsg("user", q);
    chatPrompt.value = "";


    try {
      const res = await fetch(`${API_BASE}/api/rag/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: currentDocumentId,
          projectId: "default-rag-project", // Satisfy older backend versions
          message: q
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "RAG chat failed");
      }

      const data = await res.json();
      pushMsg("bot", data.answer || "No answer returned");
    } catch (err) {
      pushMsg("bot", `Error: ${err.message}`);
    }
  });

  clearChatBtn?.addEventListener("click", () => {
    chatHistory = [];
    if (currentSessionId) {
      const all = loadSessions();
      const idx = all.findIndex(x => x.id === currentSessionId);
      if (idx >= 0) {
        all[idx].chatHistory = chatHistory;
        saveSessions(all);
      }
    }
    renderChat();
    showToast("success", "Chat cleared.");
  });


  window.addEventListener('beforeunload', (e) => {
    console.log('Page beforeunload event fired');
    console.log('Event:', e);
  });

  window.addEventListener('unload', () => {
    console.log('Page unload event fired');
  });


  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    console.error('Error message:', event.message);
    console.error('Error stack:', event.error?.stack);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });


  console.log('Initializing dashboard...');
  lucide?.createIcons();
  refreshThemeIcon();
  renderSessions();
  setView("pdfchat");


  if (currentPdfName) {
    console.log('Rendering chat with restored PDF state');
    renderChat();
  }

  /* =========================================
     LIVE SPACE BACKGROUND THEME (Ported from intro.js)
     ========================================= */
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let planets = [];

    // Config - High density for "Space" feel
    let particleCount = window.innerWidth < 768 ? 80 : 250;
    const connectionDistance = 140;
    const mouseDistance = 300;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particleCount = window.innerWidth < 768 ? 80 : 250;
      initParticles();
    }

    window.addEventListener('resize', resize);

    // Shooting Star Class
    class ShootingStar {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height * 0.5; // Start better in top half
        this.len = Math.random() * 80 + 10;
        this.speed = Math.random() * 10 + 6;
        this.size = Math.random() * 1 + 0.1;
        // Angle: 45 degrees mostly
        this.angle = Math.PI / 4;
        this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
        this.active = false;
      }

      update() {
        if (this.active) {
          this.x -= this.speed;
          this.y += this.speed;
          if (this.x < 0 || this.y >= height) {
            this.active = false;
            this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
          }
        } else {
          if (this.waitTime < new Date().getTime()) {
            this.active = true;
            this.x = Math.random() * width + 200; // Offset start
            this.y = -50;
          }
        }
      }

      draw() {
        if (this.active) {
          ctx.strokeStyle = "rgba(255, 255, 255, " + Math.random() + ")";
          ctx.lineWidth = this.size;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + this.len, this.y - this.len);
          ctx.stroke();
        }
      }
    }

    // Particle Class with Depth (Z-axis simulation)
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2 + 0.5; // Depth factor (0.5 to 2.5)

        // Closer particles move faster
        this.vx = (Math.random() - 0.5) * (0.5 * this.z);
        this.vy = (Math.random() - 0.5) * (0.5 * this.z);

        // Closer particles are larger
        this.size = (Math.random() * 1.5 + 0.5) * this.z;

        const colors = [
          'rgba(0, 243, 255,',   // Cyan
          'rgba(124, 92, 255,',  // Purple
          'rgba(255, 255, 255,', // White
          'rgba(255, 0, 212,'    // Neon Pink
        ];
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.5 + 0.2;
        this.pulsateSpeed = 0.01 + Math.random() * 0.02;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.opacity += this.pulsateSpeed;
        if (this.opacity >= 1 || this.opacity <= 0.1) this.pulsateSpeed *= -1;

        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.colorBase + (this.opacity * (this.z / 2)) + ')'; // Fade distant particles
        ctx.shadowBlur = 10 * this.z; // More glow for closer particles
        ctx.shadowColor = this.colorBase + '0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Nebula / Space Fog Class
    class Nebula {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 300 + 200;
        this.vx = (Math.random() - 0.5) * 0.1;
        this.vy = (Math.random() - 0.5) * 0.1;

        const colors = [
          'rgba(76, 0, 255, 0.03)',   // Deep Blue/Purple
          'rgba(0, 243, 255, 0.02)',  // Cyan
          'rgba(255, 0, 128, 0.02)'   // Magenta
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.y > height + this.size) this.y = -this.size;
      }

      draw() {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0, this.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let nebulas = [];
    let shootingStars = [];

    function initNebulas() {
      nebulas = [];
      for (let i = 0; i < 6; i++) {
        nebulas.push(new Nebula());
      }
    }

    function initShootingStars() {
      shootingStars = [];
      for (let i = 0; i < 3; i++) {
        shootingStars.push(new ShootingStar());
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Nebulas
      nebulas.forEach(n => {
        n.update();
        n.draw();
      });

      // 2. Draw Shooting Stars
      shootingStars.forEach(s => {
        s.update();
        s.draw();
      });

      // 3. Draw Particles & Connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();

        for (let j = i; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            const opacity = (1 - dist / connectionDistance) * 0.15;
            ctx.strokeStyle = `rgba(124, 92, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        p.draw();
      }
      requestAnimationFrame(animate);
    }

    resize();
    initShootingStars();
    initNebulas();
    animate();
  }

  console.log('Dashboard initialized, view set to pdfchat');
})();
