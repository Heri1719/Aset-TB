(function () {
  function showToast(message) {
    let toast = document.getElementById("aset-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "aset-toast";
      toast.className = "fixed left-4 right-4 top-20 z-[100] mx-auto max-w-xl rounded-lg bg-error-container text-on-error-container px-4 py-3 shadow-lg font-body-md";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    window.setTimeout(() => toast.remove(), 7000);
  }

  async function api(path, options = {}) {
    const { redirectOnAuth, headers, ...fetchOptions } = options;
    const response = await fetch(path, {
      headers: { "content-type": "application/json", ...(headers || {}) },
      credentials: "same-origin",
      ...fetchOptions
    });
    if (response.status === 401) {
      if (redirectOnAuth !== false) window.location.href = "/";
      throw new Error("Silakan login terlebih dahulu");
    }
    if (!response.ok) throw new Error((await response.json()).error || "API error");
    return response.json();
  }

  function textIncludes(value) {
    return Array.from(document.querySelectorAll("p, h1, h2, h3, h4, span, button"))
      .find(node => node.textContent.trim().includes(value));
  }

  function go(path) {
    window.location.href = path;
  }


  function routeForLabel(label) {
    const normalized = String(label || "").trim().toLowerCase();
    if (!normalized) return null;
    if (normalized.includes("home") || normalized.includes("dashboard") || normalized.includes("beranda")) return "/dashboard";
    if (normalized.includes("schedule") || normalized.includes("jadwal") || normalized.includes("pill")) return "/schedule";
    if (normalized.includes("assistant") || normalized.includes("asisten") || normalized.includes("chatbot")) return "/chatbot";
    if (normalized.includes("profile") || normalized.includes("profil")) return "/profile";
    if (normalized.includes("edukasi") || normalized.includes("gejala") || normalized.includes("education")) return "/education";
    return null;
  }

  function bindNavigation() {
    initPatientDrawer();
    document.querySelectorAll("[data-nav]").forEach(element => {
      const raw = element.getAttribute("data-nav");
      const path = raw?.startsWith("/") ? raw : routeForLabel(raw);
      if (!path) return;
      element.addEventListener("click", event => {
        event.preventDefault();
        go(path);
      });
    });

    document.querySelectorAll("nav a, nav button").forEach(element => {
      if (element.dataset.nav || element.dataset.nurseBound) return;
      const path = routeForLabel(element.textContent);
      if (!path) return;
      element.setAttribute("type", element.tagName === "BUTTON" ? "button" : element.getAttribute("type") || "");
      element.addEventListener("click", event => {
        event.preventDefault();
        go(path);
      });
    });

    const nextScheduleCard = textIncludes("Jadwal Berikutnya")?.closest("div.bg-surface-container-lowest, section, article");
    if (nextScheduleCard && !nextScheduleCard.dataset.asetScheduleBound) {
      nextScheduleCard.dataset.asetScheduleBound = "true";
      nextScheduleCard.classList.add("cursor-pointer", "hover:bg-primary/5", "transition-colors");
      nextScheduleCard.setAttribute("role", "button");
      nextScheduleCard.setAttribute("tabindex", "0");
      nextScheduleCard.setAttribute("aria-label", "Buka jadwal pengobatan");
      const openSchedule = () => go("/schedule");
      nextScheduleCard.addEventListener("click", openSchedule);
      nextScheduleCard.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSchedule();
        }
      });
    }

    const educationCard = textIncludes("Pelajari Gejala")?.closest("div.bg-surface-container-lowest, section, article");
    if (educationCard && !educationCard.dataset.asetEducationBound) {
      educationCard.dataset.asetEducationBound = "true";
      educationCard.classList.add("cursor-pointer");
      educationCard.setAttribute("role", "button");
      educationCard.setAttribute("tabindex", "0");
      const openEducation = () => go("/education");
      educationCard.addEventListener("click", openEducation);
      educationCard.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEducation();
        }
      });
    }
  }

  function updatePatientHeader(patient = {}) {
    const avatar = patient.avatar;
    const name = patient.name || patient.email || "Pasien ASET-TB";
    document.querySelectorAll('img[alt="User Profile"], #profile-avatar').forEach(img => {
      if (!avatar) return;
      img.src = avatar;
      img.referrerPolicy = "no-referrer";
      img.alt = name;
      img.classList.remove("hidden");
      img.classList.add("w-full", "h-full", "object-cover");
      const fallbackIcon = img.parentElement?.querySelector(".material-symbols-outlined");
      if (fallbackIcon && fallbackIcon.textContent.trim() === "person") fallbackIcon.classList.add("hidden");
    });
    document.querySelectorAll("[data-patient-name]").forEach(node => { node.textContent = name; });
  }

  async function initPatientIdentity() {
    const hasPatientAvatar = document.querySelector('img[alt="User Profile"], #profile-avatar');
    if (!hasPatientAvatar) return;
    const me = await api("/api/me", { redirectOnAuth: false });
    if (!me.authenticated) return;
    updatePatientHeader({ ...(me.user || {}), ...(me.patient || {}), avatar: me.patient?.avatar || me.user?.avatar });
  }

  function setTextByCurrentText(current, replacement) {
    const node = textIncludes(current);
    if (node && replacement != null) node.textContent = replacement;
  }

  function formatMedication(medication) {
    if (!medication) return "Tidak ada jadwal";
    const parts = [medication.name, medication.form ? `(${medication.form})` : ""].filter(Boolean);
    return parts.join(" ");
  }

  function statusLabel(status) {
    const labels = {
      pending: "Belum Konfirmasi",
      upcoming: "Belum Konfirmasi",
      taken: "Diminum",
      late: "Terlambat",
      missed: "Terlewat"
    };
    return labels[status] || status || "-";
  }

  function patientRoutes() {
    return [
      { label: "Home", path: "/dashboard", icon: "home" },
      { label: "Schedule", path: "/schedule", icon: "pill" },
      { label: "Assistant", path: "/chatbot", icon: "smart_toy" },
      { label: "Profile", path: "/profile", icon: "person" }
    ];
  }

  function ensurePatientDrawer() {
    let drawer = document.getElementById("patient-drawer");
    if (drawer) return drawer;

    drawer = document.createElement("div");
    drawer.id = "patient-drawer";
    drawer.className = "fixed inset-0 z-[120] hidden";
    drawer.innerHTML = `
      <div class="absolute inset-0 bg-black/40" data-drawer-close></div>
      <aside class="absolute left-0 top-0 h-full w-72 max-w-[82vw] bg-surface-container-lowest shadow-2xl p-md flex flex-col gap-md">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary">medical_services</span>
            <h2 class="font-headline-sm text-primary">ASET-TB</h2>
          </div>
          <button type="button" class="p-2 rounded-full hover:bg-surface-container" data-drawer-close aria-label="Tutup menu">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav class="flex flex-col gap-xs">
          ${patientRoutes().map(route => `
            <a href="${route.path}" class="flex items-center gap-sm rounded-lg px-4 py-3 text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors" data-patient-drawer-link>
              <span class="material-symbols-outlined">${route.icon}</span>
              <span class="font-button-text">${route.label}</span>
            </a>`).join("")}
        </nav>
      </aside>`;
    document.body.appendChild(drawer);
    return drawer;
  }

  function setPatientDrawerOpen(open) {
    const drawer = ensurePatientDrawer();
    drawer.classList.toggle("hidden", !open);
    document.body.classList.toggle("overflow-hidden", open);
  }

  function initPatientDrawer() {
    document.querySelectorAll("button").forEach(button => {
      const nestedIcon = button.querySelector(".material-symbols-outlined")?.textContent.trim();
      const directIcon = button.classList.contains("material-symbols-outlined") ? button.textContent.trim() : "";
      if (nestedIcon === "menu" || directIcon === "menu") {
        button.setAttribute("data-patient-menu", "true");
        button.setAttribute("type", "button");
        button.setAttribute("aria-label", "Buka menu navigasi");
      }
    });
    ensurePatientDrawer();
    if (window.__asetPatientNavigationBound) return;
    window.__asetPatientNavigationBound = true;

    document.addEventListener("click", event => {
      const menuButton = event.target.closest("[data-patient-menu]");
      if (menuButton) {
        event.preventDefault();
        setPatientDrawerOpen(true);
        return;
      }

      const closeButton = event.target.closest("[data-drawer-close]");
      if (closeButton) {
        event.preventDefault();
        setPatientDrawerOpen(false);
        return;
      }

      const drawerLink = event.target.closest("[data-patient-drawer-link]");
      if (drawerLink) {
        event.preventDefault();
        go(drawerLink.getAttribute("href"));
        return;
      }

      const assistantCard = event.target.closest("[data-ai-assistant-card]");
      if (assistantCard) {
        event.preventDefault();
        go("/chatbot?intent=motivation");
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") setPatientDrawerOpen(false);
      if ((event.key === "Enter" || event.key === " ") && event.target.closest("[data-ai-assistant-card]")) {
        event.preventDefault();
        go("/chatbot?intent=motivation");
      }
    });
  }


  function adherenceMessage(adherence) {
    const score = adherence?.score || 0;
    const confirmed = adherence?.confirmedDays || 0;
    const days = adherence?.treatmentDays || 1;
    if (score >= 90) return `Luar biasa. ${confirmed} dari ${days} hari jadwal yang sudah berjalan memiliki konfirmasi.`;
    if (score >= 60) return `${confirmed} dari ${days} hari jadwal sudah terkonfirmasi. Terus pertahankan ritmenya.`;
    return `Mulai hari ini, setiap konfirmasi akan menaikkan catatan kepatuhan Anda. Saat ini ${confirmed} dari ${days} hari jadwal.`;
  }

  function homeMedicationStatusClass(status) {
    if (status === "taken" || status === "late") return "bg-secondary-container text-on-secondary-container";
    return "bg-error-container text-on-error-container";
  }

  const selfEfficacyQuestions = [
    "Saya yakin dapat mengikuti jadwal minum obat meskipun sedang sibuk.",
    "Saya yakin tetap minum obat walaupun muncul rasa bosan atau jenuh.",
    "Saya yakin dapat mengingat jadwal obat tanpa harus selalu diingatkan orang lain.",
    "Saya yakin dapat meminta bantuan keluarga/perawat bila mengalami kesulitan.",
    "Saya yakin dapat mengatasi efek samping ringan tanpa langsung berhenti minum obat.",
    "Saya yakin dapat tetap menjalani pengobatan saat bepergian atau ada acara.",
    "Saya yakin dapat menjaga motivasi sampai pengobatan selesai.",
    "Saya yakin dapat mencatat atau mengonfirmasi obat setiap hari.",
    "Saya yakin dapat mengikuti anjuran perawat/dokter secara konsisten.",
    "Saya yakin mampu menyelesaikan pengobatan TB sesuai rencana."
  ];

  function nextMedicationText(medication) {
    if (!medication) return { time: "-", label: "Tidak ada jadwal" };
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const dateLabel = medication.takenDate && medication.takenDate !== today ? ` • ${formatDateId(medication.takenDate)}` : "";
    return {
      time: medication.scheduledTime || "-",
      label: `${formatMedication(medication)}${dateLabel}`
    };
  }

  function motivationScoreFormMarkup(data) {
    const current = data.motivationScoreToday || {};
    const submitted = Boolean(current.submittedToday);
    const score = current.score ?? 0;
    return `
      <form id="motivation-score-form" class="rounded-xl bg-primary-fixed/40 border border-primary-fixed-dim p-sm space-y-sm">
        <div class="flex items-start justify-between gap-sm">
          <div>
            <h4 class="font-label-md font-bold text-on-surface">Nilai Motivasi Hari Ini</h4>
            <p class="text-sm text-on-surface-variant">Beri nilai motivasi Anda hari ini dari 1 sampai 5. ${submitted ? "Sudah dinilai hari ini." : "Diisi setiap hari."}</p>
          </div>
          <span id="motivation-score-current" class="px-3 py-1 rounded-full bg-primary text-on-primary font-bold text-sm">${score}%</span>
        </div>
        <div class="grid grid-cols-5 gap-xs" aria-label="Nilai motivasi harian">
          ${[1, 2, 3, 4, 5].map(value => `
            <label class="text-center rounded-lg border border-outline-variant/60 bg-surface-container-lowest py-2 cursor-pointer hover:bg-primary/5">
              <input class="sr-only peer" type="radio" name="motivationValue" value="${value}" ${current.rawValue === value ? "checked" : ""} required>
              <span class="block peer-checked:text-primary peer-checked:font-bold">${value}</span>
            </label>`).join("")}
        </div>
        <button class="w-full h-10 bg-primary text-on-primary rounded-lg font-button-text active:scale-[0.98] transition-transform" type="submit">${submitted ? "Perbarui Nilai Motivasi" : "Simpan Nilai Motivasi"}</button>
      </form>`;
  }

  function dailyMotivationMessagesMarkup(data) {
    const current = data.motivationScoreToday || {};
    const score = Number(current.score || 0);
    const raw = Number(current.rawValue || 0);
    const submitted = Boolean(current.submittedToday);
    let tone = "Isi nilai motivasi hari ini untuk mendapatkan pesan yang lebih sesuai.";
    let messages = [
      "Mulai dari satu hal kecil: lihat jadwal obat terdekat hari ini.",
      "Letakkan obat dan air minum di tempat yang mudah terlihat.",
      "Beri tahu keluarga atau pendamping bahwa Anda ingin dibantu mengingat jadwal."
    ];

    if (score >= 80 || raw >= 4) {
      tone = raw === 5 ? "Motivasi Anda sangat kuat hari ini. Jadikan ini modal untuk konsisten." : "Motivasi Anda kuat hari ini. Pertahankan ritme baik ini.";
      messages = [
        "Gunakan energi positif ini untuk menjaga jadwal minum obat tetap konsisten.",
        "Catatan konfirmasi hari ini akan menjadi bukti nyata kemajuan Anda.",
        "Bagikan semangat ini kepada keluarga agar dukungan di rumah semakin kuat."
      ];
    } else if (score >= 60 || raw === 3) {
      tone = "Motivasi Anda cukup baik. Jaga dengan langkah sederhana.";
      messages = [
        "Siapkan obat dan air minum sebelum jam jadwal agar lebih mudah dilakukan.",
        "Ingat tujuan utama: setiap dosis membawa Anda lebih dekat ke pemulihan.",
        "Bila mulai ragu, buka jadwal dan lakukan satu konfirmasi hari ini."
      ];
    } else if (score >= 40 || raw === 2) {
      tone = "Motivasi Anda sedang rendah. Kita sederhanakan target hari ini.";
      messages = [
        "Fokus hanya pada jadwal obat berikutnya, bukan seluruh perjalanan pengobatan.",
        "Pasang pengingat tambahan dan siapkan obat di tempat yang mudah dijangkau.",
        "Hubungi keluarga atau perawat untuk menemani satu langkah kecil hari ini."
      ];
    } else if (submitted) {
      tone = "Motivasi Anda sangat rendah hari ini. Anda tidak perlu menghadapinya sendirian.";
      messages = [
        "Segera minta dukungan keluarga, pendamping, atau perawat sebelum jadwal obat berikutnya.",
        "Mulai dari tindakan paling ringan: duduk, siapkan air, dan dekatkan obat.",
        "Jika merasa sangat berat atau ingin berhenti obat, hubungi perawat/dokter sebelum mengambil keputusan."
      ];
    }

    const description = submitted ? tone : "Isi nilai motivasi hari ini untuk mendapatkan pesan yang lebih sesuai.";
    const messageItems = messages.map(message => `<li class="flex gap-xs"><span class="material-symbols-outlined text-secondary text-base">check_circle</span><span>${message}</span></li>`).join("");
    return `
      <section id="daily-motivation-messages" class="rounded-xl bg-surface-container-low border border-outline-variant/30 p-sm space-y-sm">
        <div class="flex items-start justify-between gap-sm">
          <div>
            <h4 class="font-label-md font-bold text-on-surface">Pesan Motivasi Sesuai Nilai Hari Ini</h4>
            <p class="text-sm text-on-surface-variant">${description}</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-bold text-sm">${score}%</span>
        </div>
        <ul class="space-y-xs text-sm text-on-surface-variant">${messageItems}</ul>
      </section>`;

  }

  function renderHomeDailyCard(data) {
    const card = document.querySelector("[data-home-daily-card]")
      || textIncludes("Nilai Motivasi Harian")?.closest(".bg-white")
      || textIncludes("Catatan Harian")?.closest(".bg-white")
      || textIncludes("Motivasi & Catatan Harian")?.closest(".bg-white");
    if (!card) return;
    card.setAttribute("data-home-daily-card", "true");
    card.className = "bg-white rounded-xl p-md border border-outline-variant/30 shadow-sm space-y-md";
    card.innerHTML = `
      <div class="flex items-start gap-sm">
        <span class="material-symbols-outlined text-primary mt-1" style="font-variation-settings: 'FILL' 1;">psychology_alt</span>
        <div>
          <h3 class="font-headline-sm text-headline-sm">Nilai Motivasi Harian</h3>
          <p class="text-on-surface-variant text-sm">Nilai motivasi hari ini akan menampilkan pesan dukungan yang sesuai.</p>
        </div>
      </div>
      <blockquote class="rounded-lg bg-primary-fixed/50 border border-primary-fixed-dim p-sm text-on-surface font-label-md italic">"${data.motivation}"</blockquote>
      ${motivationScoreFormMarkup(data)}
      ${dailyMotivationMessagesMarkup(data)}`;

    card.querySelector("#motivation-score-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const value = Number(new FormData(form).get("motivationValue"));
      if (!Number.isFinite(value)) {
        showToast("Mohon pilih nilai motivasi hari ini.");
        return;
      }
      try {
        const result = await api("/api/patient/motivation-score", {
          method: "POST",
          body: JSON.stringify({ value })
        });
        form.querySelector("button").textContent = "Nilai Motivasi Tersimpan";
        const current = document.getElementById("motivation-score-current");
        if (current) current.textContent = `${result.motivationScore.score}%`;
        const messages = document.getElementById("daily-motivation-messages");
        if (messages) messages.outerHTML = dailyMotivationMessagesMarkup({ ...data, motivationScoreToday: result.motivationScore });
        showToast(`Nilai motivasi harian tersimpan: ${result.motivationScore.score}%.`);
      } catch (error) {
        showToast(error.message);
      }
    });
  }


  async function initLanding() {
    const label = textIncludes("Masuk dengan Google");
    const button = document.querySelector("[data-google-login]") || label?.closest("a, button");
    if (!button) return;
    button.setAttribute("href", "/api/auth/google/start");
    const status = await api("/api/config/status");
    if (!status.googleOAuth) {
      showToast("Google OAuth belum lengkap. Periksa GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, dan redirect URI di .env.");
      button.addEventListener("click", event => {
        event.preventDefault();
        showToast("Lengkapi konfigurasi Google OAuth dulu sebelum login.");
      });
    }
    if (!status.gemini && !status.openAi) {
      showToast("Chatbot akan memakai mode fallback lokal sampai GEMINI_API_KEY atau OPENAI_API_KEY diisi.");
    }
    const me = await api("/api/me", { redirectOnAuth: false });
    if (me.authenticated && me.patient) {
      const textNode = button.querySelector("span:last-child") || button;
      textNode.textContent = "Lanjut ke Dashboard";
      button.setAttribute("href", "/dashboard");
      button.addEventListener("click", event => {
        event.preventDefault();
        window.location.href = "/dashboard";
      });
      return;
    }
    button.addEventListener("click", event => {
      if (!status.googleOAuth) return;
      event.preventDefault();
      window.location.href = "/api/auth/google/start";
    });


  }

  async function initDashboard() {
    const data = await api("/api/patient/dashboard");
    updatePatientHeader(data.patient);
    setTextByCurrentText('"Setiap obat yang diminum hari ini adalah langkah menuju kesembuhan"', `"${data.motivation}"`);

    const adherence = data.adherence || { score: data.patient.adherenceScore || 0, confirmedDays: 0, treatmentDays: data.patient.treatmentDay || 1 };
    const adherenceCard = textIncludes("Kepatuhan Pengobatan")?.closest(".rounded-xl");
    const adherenceScore = adherenceCard?.querySelector("h2");
    if (adherenceScore) adherenceScore.textContent = `${adherence.score}%`;
    const adherenceBar = adherenceCard?.querySelector(".bg-secondary.h-3");
    if (adherenceBar) adherenceBar.style.width = `${adherence.score}%`;
    const adherenceNote = adherenceCard?.querySelector("p.italic");
    if (adherenceNote) adherenceNote.textContent = adherenceMessage(adherence);

    const next = nextMedicationText(data.nextMedication);
    setTextByCurrentText("18:30", next.time);
    setTextByCurrentText("Rifampicin (1 Kaplet)", next.label);
    setTextByCurrentText("Pengobatan TB membutuhkan kedisiplinan. Anda sudah menyelesaikan 45 hari dari program 180 hari.", data.progressText);
    renderHomeDailyCard(data);

    const chatAccess = document.querySelector("[data-ai-assistant-card]") || textIncludes("Tanya Asisten")?.closest("section");
    if (chatAccess) {
      const title = chatAccess.querySelector("h3");
      if (title) title.textContent = "Tanya Asisten ASET-TB";
      const description = chatAccess.querySelector("p.font-body-md, p");
      if (description) description.textContent = "Motivasi dan informasi TB dari AI ASET.";
      chatAccess.classList.add("cursor-pointer");
      chatAccess.setAttribute("role", "button");
      chatAccess.setAttribute("tabindex", "0");
      const openAi = () => { window.location.href = "/chatbot?intent=motivation"; };
      chatAccess.addEventListener("click", openAi);
      chatAccess.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openAi();
        }
      });
    }
  }

  async function initEducation() {
    const list = document.getElementById("education-list");
    if (!list) return;
    const items = await api("/api/education");
    list.innerHTML = "";
    items.forEach(item => {
      const card = document.createElement("article");
      card.className = "bg-white rounded-xl border border-[#c1c6d7]/40 p-5 shadow-sm";
      card.innerHTML = `
        <div class="inline-flex px-3 py-1 rounded-full bg-[#67fcc6]/30 text-[#007354] text-sm font-bold mb-3"></div>
        <h2 class="font-[Manrope] text-xl font-bold mb-2"></h2>
        <p class="text-[#414754] leading-relaxed"></p>
      `;
      card.querySelector("div").textContent = item.category;
      card.querySelector("h2").textContent = item.title;
      card.querySelector("p").textContent = item.summary;
      list.appendChild(card);
    });
  }

  async function initProfile() {
    const name = document.getElementById("profile-name");
    if (!name) return;
    const [me, dashboard] = await Promise.all([
      api("/api/me"),
      api("/api/patient/dashboard")
    ]);
    if (!me.authenticated) {
      window.location.href = "/";
      return;
    }
    const patient = dashboard.patient || me.patient || {};
    const user = me.user || {};
    const adherence = dashboard.adherence || {};
    const selfToday = dashboard.selfEfficacyToday || {};
    const motivationToday = dashboard.motivationScoreToday || {};

    name.textContent = patient.name || user.name || "-";
    document.getElementById("profile-email").textContent = user.email || patient.googleEmail || "-";
    document.getElementById("profile-mrn").textContent = patient.medicalRecordNumber || "-";
    document.getElementById("profile-phase").textContent = patient.phase || "-";
    document.getElementById("profile-day").textContent = `${adherence.confirmedDays || 0}/${adherence.treatmentDays || 0} hari dikonfirmasi`;
    document.getElementById("profile-self").textContent = selfToday.submittedToday ? `${selfToday.score}%` : "Belum diisi hari ini";
    const adherenceNode = document.getElementById("profile-adherence");
    if (adherenceNode) adherenceNode.textContent = `${adherence.score ?? patient.adherenceScore ?? 0}%`;
    const estimatedNode = document.getElementById("profile-estimated");
    if (estimatedNode) estimatedNode.textContent = adherence.estimatedEndDate ? formatDateId(adherence.estimatedEndDate) : "Belum ada jadwal";
    const motivationNode = document.getElementById("profile-motivation");
    if (motivationNode) motivationNode.textContent = motivationToday.submittedToday ? `${motivationToday.score}%` : "Belum dinilai hari ini";

    const avatar = document.getElementById("profile-avatar");
    if (avatar && (patient.avatar || user.avatar)) {
      avatar.src = patient.avatar || user.avatar;
      avatar.referrerPolicy = "no-referrer";
      avatar.classList.remove("hidden");
      avatar.parentElement?.querySelector(".material-symbols-outlined")?.classList.add("hidden");
    }
    document.getElementById("logout-button")?.addEventListener("click", async () => {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
      window.location.href = "/";
    });
  }

  function medicationStatusClass(status) {
    if (status === "taken") return "bg-secondary-container text-on-secondary-container";
    if (status === "late") return "bg-tertiary-fixed text-on-tertiary-fixed";
    return "bg-error-container text-on-error-container";
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function captureMedicationVideo() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("Browser belum mendukung rekaman video dari kamera.");
    }

    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4";
    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-xl p-md w-full max-w-xl shadow-2xl space-y-sm">
        <h3 class="font-headline-sm text-headline-sm text-on-surface">Rekam Video Minum Obat</h3>
        <p class="text-on-surface-variant">Arahkan kamera saat pasien meminum obat. Rekam video singkat sebagai bukti konfirmasi.</p>
        <video class="w-full rounded-lg bg-black aspect-video" autoplay muted playsinline></video>
        <p class="text-sm text-on-surface-variant" data-recording-status>Tekan Mulai Rekam saat siap.</p>
        <div class="flex flex-wrap gap-sm justify-end">
          <button type="button" class="px-4 py-2 rounded-lg border border-outline-variant" data-video-cancel>Batal</button>
          <button type="button" class="px-4 py-2 rounded-lg bg-primary text-on-primary" data-video-start>Mulai Rekam</button>
          <button type="button" class="hidden px-4 py-2 rounded-lg bg-secondary text-on-secondary" data-video-stop>Selesai & Konfirmasi</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const video = overlay.querySelector("video");
    const status = overlay.querySelector("[data-recording-status]");
    const startButton = overlay.querySelector("[data-video-start]");
    const stopButton = overlay.querySelector("[data-video-stop]");
    const cancelButton = overlay.querySelector("[data-video-cancel]");
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
    video.srcObject = stream;

    return new Promise((resolve, reject) => {
      let recorder;
      const chunks = [];
      let timeout;
      function cleanup() {
        clearTimeout(timeout);
        stream.getTracks().forEach(track => track.stop());
        overlay.remove();
      }
      cancelButton.addEventListener("click", () => {
        cleanup();
        reject(new Error("Konfirmasi video dibatalkan."));
      });
      startButton.addEventListener("click", () => {
        chunks.length = 0;
        const candidates = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
        const supportedType = candidates.find(type => MediaRecorder.isTypeSupported(type));
        recorder = supportedType ? new MediaRecorder(stream, { mimeType: supportedType }) : new MediaRecorder(stream);
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = event => {
          cleanup();
          reject(new Error(event.error?.message || "Gagal merekam video konfirmasi."));
        };
        recorder.onstop = async () => {
          try {
            if (!chunks.length) throw new Error("Video konfirmasi kosong. Rekam minimal beberapa detik.");
            const blob = new Blob(chunks, { type: recorder.mimeType || supportedType || "video/webm" });
            if (!blob.size) throw new Error("Video konfirmasi kosong. Rekam minimal beberapa detik.");
            const videoData = await blobToDataUrl(blob);
            cleanup();
            resolve({ videoData, videoMimeType: blob.type || "video/webm" });
          } catch (error) {
            cleanup();
            reject(error);
          }
        };
        recorder.start(1000);
        status.textContent = "Merekam... maksimal 15 detik.";
        startButton.classList.add("hidden");
        stopButton.classList.remove("hidden");
        timeout = setTimeout(() => recorder?.state === "recording" && recorder.stop(), 15000);
      });
      stopButton.addEventListener("click", () => {
        status.textContent = "Menyimpan video dan konfirmasi...";
        stopButton.disabled = true;
        if (recorder?.state === "recording") recorder.stop();
      });
    });
  }

  function isoTodayJakarta() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }

  function scheduleDayName(value) {
    return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(`${value}T00:00:00`)).toUpperCase().replace(".", "");
  }

  function scheduleMonthYear(value) {
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
  }

  function nearestScheduledDate(dates) {
    const today = isoTodayJakarta();
    return dates.find(item => item.date >= today)?.date || dates.at(-1)?.date || today;
  }

  function scheduledDateWindow(dates, selectedDate) {
    if (!dates.length) return [];
    const index = Math.max(0, dates.findIndex(item => item.date === selectedDate));
    const start = Math.max(0, Math.min(index - 2, dates.length - 5));
    return dates.slice(start, start + 5);
  }

  function renderScheduleCalendar(section, dates, selectedDate) {
    const selected = dates.find(item => item.date === selectedDate) || { date: selectedDate, total: 0, confirmed: 0 };
    const windowDates = scheduledDateWindow(dates, selectedDate);
    section.innerHTML = `
      <div class="flex justify-between items-center gap-sm">
        <div>
          <h2 class="font-headline-sm text-headline-sm text-on-surface">Jadwal Pengobatan</h2>
          <p class="text-sm text-on-surface-variant">Tanggal yang tampil adalah jadwal yang sudah dibuat perawat.</p>
        </div>
        <div class="flex items-center gap-xs text-primary font-label-md capitalize">
          <span class="material-symbols-outlined text-[18px]">calendar_month</span>
          ${scheduleMonthYear(selected.date)}
        </div>
      </div>
      <div class="flex justify-between items-center bg-surface-container-lowest rounded-xl p-sm shadow-sm border border-outline-variant/30" data-schedule-calendar>
        <button type="button" class="material-symbols-outlined text-on-surface-variant p-2 rounded-full hover:bg-surface-container" data-schedule-prev ${dates.findIndex(item => item.date === selectedDate) <= 0 ? "disabled" : ""}>chevron_left</button>
        <div class="flex gap-sm overflow-x-auto no-scrollbar py-1">
          ${windowDates.length ? windowDates.map(item => `
            <button type="button" data-schedule-date="${item.date}" class="flex flex-col items-center gap-xs min-w-[58px] p-2 rounded-lg transition-colors ${item.date === selectedDate ? "bg-primary-container text-on-primary-container shadow-md" : "text-on-surface-variant hover:bg-primary/5"}">
              <span class="font-label-md text-[12px]">${scheduleDayName(item.date)}</span>
              <span class="font-headline-sm">${new Date(`${item.date}T00:00:00`).getDate()}</span>
              <span class="text-[10px] ${item.pending ? "text-tertiary" : "text-secondary"}">${item.confirmed}/${item.total}</span>
            </button>`).join("") : `
            <div class="py-sm text-center text-on-surface-variant">Belum ada tanggal jadwal dari perawat.</div>`}
        </div>
        <button type="button" class="material-symbols-outlined text-on-surface-variant p-2 rounded-full hover:bg-surface-container" data-schedule-next ${dates.findIndex(item => item.date === selectedDate) >= dates.length - 1 ? "disabled" : ""}>chevron_right</button>
      </div>`;
  }

  function medicationCard(med) {
    const canConfirm = med.status === "pending" || med.status === "upcoming";
    return `
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md shadow-sm space-y-md" data-medication-card="${med.id}">
        <div class="flex justify-between items-start gap-md">
          <div class="flex items-start gap-md">
            <div class="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-[32px]">pill</span>
            </div>
            <div>
              <h4 class="font-headline-sm text-on-surface">${med.name}</h4>
              <p class="text-on-surface-variant font-body-md">${med.dose} • ${med.form}</p>
              <p class="text-on-surface-variant text-sm">${formatDateId(med.takenDate)}</p>
              <div class="flex items-center gap-xs mt-1 text-primary font-semibold">
                <span class="material-symbols-outlined text-[18px]">schedule</span>
                <span class="text-label-md">${med.scheduledTime} WIB</span>
              </div>
            </div>
          </div>
          <span class="${medicationStatusClass(med.status)} text-[12px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">${statusLabel(med.status)}</span>
        </div>
        ${med.confirmedAt ? `<div class="flex flex-col gap-xs bg-surface-container-low p-sm rounded-lg border border-secondary/20"><div class="flex items-center gap-sm"><span class="material-symbols-outlined text-secondary">check_circle</span><span class="text-on-surface font-label-md">Sudah diminum pukul ${med.confirmedAt}</span></div>${med.confirmationVideoPath ? `<a class="text-primary font-label-md underline" href="/${med.confirmationVideoPath}" target="_blank">Lihat video konfirmasi</a>` : ""}</div>` : ""}
        ${canConfirm ? `<button data-confirm-medication="${med.id}" class="w-full h-14 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-sm shadow-md active:scale-[0.98] transition-transform"><span class="material-symbols-outlined">videocam</span>Rekam & Konfirmasi Minum Obat</button>` : ""}
      </div>`;
  }

  async function initSchedule() {
    const calendarSection = textIncludes("Jadwal Pengobatan")?.closest("section");
    const listSection = textIncludes("Obat Hari Ini")?.closest("section");
    let dates = await api("/api/medication-dates");
    let selectedDate = new URLSearchParams(window.location.search).get("date") || nearestScheduledDate(dates);

    async function loadDate(date) {
      selectedDate = date;
      const meds = await api(`/api/medications?date=${encodeURIComponent(selectedDate)}`);
      dates = await api("/api/medication-dates");
      if (calendarSection) renderScheduleCalendar(calendarSection, dates, selectedDate);
      if (listSection) {
        listSection.innerHTML = `
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-secondary">medication</span>
            <div>
              <h3 class="font-headline-sm text-headline-sm">Jadwal Terjadwal</h3>
              <p class="text-sm text-on-surface-variant">${formatDateId(selectedDate)} • ${meds.length} jadwal obat</p>
            </div>
          </div>
          <div class="space-y-md" id="patient-medication-list">${meds.length ? meds.map(medicationCard).join("") : `<div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md text-on-surface-variant">Belum ada jadwal obat pada tanggal ini.</div>`}</div>
        `;
      }
      bindScheduleActions();
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("date", selectedDate);
      window.history.replaceState({}, "", nextUrl);
    }

    function bindScheduleActions() {
      document.querySelectorAll("[data-schedule-date]").forEach(button => {
        button.addEventListener("click", () => loadDate(button.dataset.scheduleDate));
      });
      document.querySelector("[data-schedule-prev]")?.addEventListener("click", () => {
        const index = dates.findIndex(item => item.date === selectedDate);
        if (index > 0) loadDate(dates[index - 1].date);
      });
      document.querySelector("[data-schedule-next]")?.addEventListener("click", () => {
        const index = dates.findIndex(item => item.date === selectedDate);
        if (index >= 0 && index < dates.length - 1) loadDate(dates[index + 1].date);
      });
      document.querySelectorAll("[data-confirm-medication]").forEach(button => {
        button.addEventListener("click", async () => {
          try {
            button.disabled = true;
            const evidence = await captureMedicationVideo();
            const updated = await api(`/api/medications/${button.dataset.confirmMedication}/confirm`, {
              method: "POST",
              body: JSON.stringify(evidence)
            });
            showToast(`Konfirmasi video ${updated.name} berhasil dicatat pukul ${updated.confirmedAt}. Status: ${statusLabel(updated.status)}.`);
            await loadDate(selectedDate);
          } catch (error) {
            showToast(error.message);
            button.disabled = false;
          }
        });
      });
    }

    await loadDate(selectedDate);
  }


  function chatTime(value) {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(new Date(value));
  }

  function renderChatMessage(message) {
    const isUser = message.sender === "user";
    const row = document.createElement("div");
    row.className = isUser
      ? "flex gap-sm items-start self-end flex-row-reverse w-full max-w-[92%] sm:max-w-[78%]"
      : "flex gap-sm items-start w-full max-w-[92%] sm:max-w-[78%]";
    row.innerHTML = `
      <div class="w-8 h-8 rounded-full ${isUser ? "bg-primary-container" : "bg-secondary-container"} flex items-center justify-center shrink-0 mt-1">
        <span class="material-symbols-outlined text-[18px] ${isUser ? "text-on-primary-container" : "text-on-secondary-container"}">${isUser ? "person" : "smart_toy"}</span>
      </div>
      <div class="${isUser ? "bg-primary text-on-primary chat-bubble-user" : "bg-surface-container-high text-on-surface chat-bubble-ai"} min-w-0 max-w-full p-md rounded-2xl shadow-sm">
        <p class="font-body-md leading-relaxed whitespace-pre-wrap break-words"></p>
        <span data-chat-time class="text-[11px] ${isUser ? "text-primary-fixed-dim text-right" : "text-outline"} mt-2 block"></span>
      </div>`;
    row.querySelector("p").textContent = message.message;
    row.querySelector("[data-chat-time]").textContent = chatTime(message.createdAt);
    return row;
  }

  async function initChatbot() {
    const chatList = document.querySelector("main .flex.flex-col.gap-md");
    const textarea = document.querySelector("textarea");
    const sendButton = document.querySelector(".fixed button.bg-primary");
    if (!chatList || !textarea || !sendButton) return;

    const introTitle = textIncludes("Asisten Kesehatan TB");
    if (introTitle) introTitle.textContent = "Asisten AI ASET";
    const introText = introTitle?.closest("section")?.querySelector("p");
    if (introText) introText.textContent = "AI ASET siap memberi motivasi harian dan informasi TB yang aman. Untuk keluhan berat, tetap hubungi perawat atau dokter.";

    const chips = Array.from(document.querySelectorAll("button")).filter(button => button.textContent.trim().endsWith("?"));
    const chipLabels = [
      "Beri saya motivasi untuk minum obat hari ini",
      "Jelaskan informasi penting tentang TB",
      "Kenapa obat TB harus diminum teratur?",
      "Apa efek samping yang perlu saya waspadai?"
    ];
    chips.forEach((button, index) => {
      if (chipLabels[index]) button.textContent = chipLabels[index];
    });

    async function refresh() {
      const messages = await api("/api/chat");
      chatList.innerHTML = "";
      messages.forEach(message => chatList.appendChild(renderChatMessage(message)));
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }

    async function send(message) {
      const content = message.trim();
      if (!content) return;
      textarea.value = "";
      try {
        const result = await api("/api/chat", {
          method: "POST",
          body: JSON.stringify({ message: content })
        });
        result.messages.forEach(item => chatList.appendChild(renderChatMessage(item)));
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      } catch (error) {
        showToast(error.message);
      }
    }

    sendButton.addEventListener("click", () => send(textarea.value));
    textarea.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send(textarea.value);
      }
    });
    document.querySelectorAll("button").forEach(button => {
      const text = button.textContent.trim();
      if (text.endsWith("?") || text.toLowerCase().includes("motivasi") || text.toLowerCase().includes("informasi")) {
        button.addEventListener("click", () => send(button.textContent.trim()));
      }
    });
    await refresh();

    const intent = new URLSearchParams(window.location.search).get("intent");
    if (intent === "motivation" && !sessionStorage.getItem("aset-ai-motivation-opened")) {
      sessionStorage.setItem("aset-ai-motivation-opened", "1");
      await send("Beri saya motivasi hari ini dan informasi singkat agar saya semangat menjalani pengobatan TB.");
    }
  }

  function nurseInitials(name) {
    return String(name || "?").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  }

  function complianceTone(score) {
    if (score >= 90) return { text: "On Track", color: "text-secondary", bg: "bg-secondary" };
    if (score >= 70) return { text: "At Risk", color: "text-tertiary", bg: "bg-tertiary" };
    return { text: "Critical", color: "text-error", bg: "bg-error" };
  }

  function todayDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDateId(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
  }

  function adminMedicationTone(status) {
    if (status === "taken") return "text-secondary";
    if (status === "late") return "text-tertiary";
    return "text-error";
  }

  const tbMedicationOptions = [
    { group: "Obat TBC Lini Pertama", items: [
      "Isoniazid (INH)",
      "Rifampicin (Rifampisin)",
      "Pyrazinamide (Pirasinamid)",
      "Ethambutol (Etambutol)",
      "Streptomisin"
    ] },
    { group: "Obat TBC Lini Kedua", items: [
      "Levofloxacin",
      "Moxifloxacin",
      "Kanamisin",
      "Amikasin",
      "Kapreomisin",
      "Etionamid",
      "Sikloserin",
      "Asam p-aminosalisilat (PAS)"
    ] }
  ];

  function medicationOptionMarkup(selected = "") {
    const groups = tbMedicationOptions.map(group => `
      <optgroup label="${group.group}">
        ${group.items.map(item => `<option value="${item}" ${item === selected ? "selected" : ""}>${item}</option>`).join("")}
      </optgroup>`).join("");
    const known = tbMedicationOptions.some(group => group.items.includes(selected));
    return `<option value="">Pilih obat</option>${groups}<option value="__other" ${selected && !known ? "selected" : ""}>Lainnya / isi sendiri</option>`;
  }

  function resolveMedicationName(form) {
    const selected = form.elements.name.value;
    if (selected === "__other") return form.elements.customName.value.trim();
    return selected.trim();
  }

  function syncCustomMedicationField(form) {
    const isOther = form.elements.name.value === "__other";
    const custom = form.elements.customName;
    if (!custom) return;
    custom.classList.toggle("hidden", !isOther);
    custom.required = isOther;
    if (!isOther) custom.value = "";
  }

  function nurseShell() {
    return document.querySelector("main.md\\:ml-80 .p-gutter") || document.querySelector("main.md\\:ml-80 > div:last-child");
  }

  function renderNursePatientTable(patients) {
    if (!patients.length) {
      return `<div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md text-on-surface-variant">Tidak ada pasien sesuai pencarian.</div>`;
    }
    return `
      <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div class="p-md border-b border-outline-variant/30 flex justify-between items-center">
          <h5 class="font-headline-sm text-headline-sm">Detailed Patient List</h5>
          <p class="text-label-md text-on-surface-variant">Showing ${patients.length} patients</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-container-low/50">
              <tr>
                <th class="px-md py-4 font-label-md text-outline uppercase tracking-wider">Patient Name</th>
                <th class="px-md py-4 font-label-md text-outline uppercase tracking-wider">Compliance Score</th>
                <th class="px-md py-4 font-label-md text-outline uppercase tracking-wider">Phase</th>
                <th class="px-md py-4 font-label-md text-outline uppercase tracking-wider">Self-Efficacy</th>
                <th class="px-md py-4 font-label-md text-outline uppercase tracking-wider">Status</th>
                <th class="px-md py-4 font-label-md text-outline uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/20">
              ${patients.map(patient => {
                const tone = complianceTone(patient.adherenceScore || 0);
                return `
                  <tr class="hover:bg-surface-container-low/30 transition-colors">
                    <td class="px-md py-4">
                      <div class="flex items-center gap-sm">
                        <div class="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center font-bold text-primary">${nurseInitials(patient.name)}</div>
                        <div>
                          <button class="font-label-md font-bold text-primary hover:underline text-left" data-patient-schedule="${patient.id}">${patient.name}</button>
                          <p class="text-[12px] text-on-surface-variant">${patient.medicalRecordNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-md py-4">
                      <div class="flex items-center gap-sm">
                        <span class="font-bold ${tone.color}">${patient.adherenceScore}%</span>
                        <div class="w-20 bg-surface-container-low h-1.5 rounded-full overflow-hidden"><div class="${tone.bg} h-full" style="width:${patient.adherenceScore}%"></div></div>
                      </div>
                    </td>
                    <td class="px-md py-4"><span class="px-3 py-1 bg-primary-container/10 text-primary font-label-md rounded-full">${patient.phase}</span></td>
                    <td class="px-md py-4 text-on-surface-variant font-label-md">${patient.selfEfficacyScore}%</td>
                    <td class="px-md py-4"><div class="flex items-center gap-xs ${tone.color}"><span class="w-2 h-2 rounded-full ${tone.bg}"></span><span class="font-label-md">${tone.text}</span></div></td>
                    <td class="px-md py-4"><div class="flex gap-sm"><button class="text-primary hover:underline font-label-md" data-patient-edit="${patient.id}">Edit</button><button class="text-error hover:underline font-label-md" data-patient-delete="${patient.id}">Hapus</button></div></td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderNurseCards(summary) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-md">
        <div class="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30"><p class="text-on-surface-variant font-label-md">Total Patients Active</p><h4 class="text-[32px] font-bold text-on-surface mt-1">${summary.totalActive}</h4><p class="text-[12px] text-on-secondary-container bg-secondary-container/30 px-2 py-0.5 rounded-full inline-block mt-2">Live database</p></div>
        <div class="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30"><p class="text-on-surface-variant font-label-md">High Compliance (90%+)</p><h4 class="text-[32px] font-bold text-on-surface mt-1">${summary.highCompliance}</h4></div>
        <div class="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30"><p class="text-on-surface-variant font-label-md">Medium Compliance</p><h4 class="text-[32px] font-bold text-on-surface mt-1">${summary.mediumCompliance}</h4><p class="text-[12px] text-on-surface-variant mt-2">70% - 89% score</p></div>
        <div class="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30"><p class="text-on-surface-variant font-label-md">Low Compliance</p><h4 class="text-[32px] font-bold text-on-surface mt-1">${summary.lowCompliance}</h4><p class="text-[12px] text-error font-semibold mt-2">Needs intervention</p></div>
        <div class="bg-primary-container p-md rounded-xl shadow-lg text-on-primary"><p class="text-on-primary/80 font-label-md">No Confirmation Today</p><h4 class="text-[32px] font-bold mt-1">${summary.pendingMedication}</h4><p class="text-[12px] font-semibold mt-2 text-on-primary">From today's schedule</p></div>
      </div>`;
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map(row => row.map(cell => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function initNurse() {
    let data;
    try {
      data = await api("/api/nurse/overview", { redirectOnAuth: false });
    } catch (error) {
      const email = window.prompt("Masukkan email admin/perawat:", "hcahyanto@ikbis.ac.id");
      if (!email) throw error;
      await api("/api/auth/nurse-login", { method: "POST", body: JSON.stringify({ email }) });
      data = await api("/api/nurse/overview");
    }

    const shell = nurseShell();
    if (!shell) return;
    const state = { data, filtered: data.patients, view: "overview" };
    const title = document.querySelector("main.md\\:ml-80 h2");
    const searchInput = document.querySelector('input[placeholder="Search patient name or ID..."]');

    function filterPatients() {
      const query = (searchInput?.value || "").toLowerCase().trim();
      state.filtered = state.data.patients.filter(patient =>
        patient.name.toLowerCase().includes(query) ||
        patient.medicalRecordNumber.toLowerCase().includes(query) ||
        String(patient.googleEmail || "").toLowerCase().includes(query)
      );
    }

    function actionBar(heading, subtitle = "Data tersambung ke PostgreSQL") {
      return `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm mb-base">
          <div><h3 class="font-headline-sm text-headline-sm text-on-surface">${heading}</h3><p class="text-on-surface-variant font-label-md">${subtitle}</p></div>
          <div class="flex items-center gap-sm">
            <button data-nurse-action="export" class="flex items-center gap-xs px-4 py-3 border border-secondary text-secondary font-button-text rounded-lg hover:bg-secondary/5 transition-colors h-12"><span class="material-symbols-outlined text-[20px]">ios_share</span>Export Report</button>
            <button data-nurse-action="add-patient" class="flex items-center gap-xs px-6 py-3 bg-primary text-on-primary font-button-text rounded-lg shadow-md active:scale-95 transition-all h-12"><span class="material-symbols-outlined text-[20px]">person_add</span>Add Patient</button>
          </div>
        </div>`;
    }

    async function render(view = state.view) {
      state.view = view;
      filterPatients();
      if (title) title.textContent = view === "overview" ? "Dashboard Perawat" : view;
      document.querySelectorAll("aside nav a").forEach(link => {
        const active = link.textContent.trim().toLowerCase().includes(view.toLowerCase()) || (view === "overview" && link.textContent.includes("Overview"));
        link.classList.toggle("bg-primary-container", active);
        link.classList.toggle("text-on-primary-container", active);
      });

      if (view === "overview") {
        shell.innerHTML = `${actionBar("Overview Tracking", `Data update: ${new Date(state.data.updatedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`)}${renderNurseCards(state.data.summary)}<div class="grid grid-cols-1 lg:grid-cols-3 gap-md"><div class="lg:col-span-2">${renderNursePatientTable(state.filtered)}</div><div class="bg-surface-container-highest/30 p-md rounded-xl border border-dashed border-outline-variant"><h5 class="font-headline-sm text-headline-sm mb-md">Key Insights</h5><p class="text-on-surface-variant">${state.data.summary.lowCompliance} pasien perlu intervensi dan ${state.data.summary.pendingMedication} jadwal obat belum dikonfirmasi hari ini.</p></div></div>`;
      } else if (view === "patient list") {
        shell.innerHTML = `${actionBar("Patient List")}${renderNursePatientTable(state.filtered)}`;
      } else if (view === "medication schedule") {
        const selectedPatientId = state.selectedMedicationPatientId || state.filtered[0]?.id || state.data.patients[0]?.id;
        state.selectedMedicationPatientId = selectedPatientId;
        const selectedPatient = state.data.patients.find(patient => patient.id === selectedPatientId) || state.data.patients[0];
        const selectedDate = state.selectedMedicationDate || todayDate();
        state.selectedMedicationDate = selectedDate;
        const rows = selectedPatient ? (await api(`/api/medications?patientId=${selectedPatient.id}&date=${selectedDate}`).catch(() => [])).map(med => ({ patient: selectedPatient, med })) : [];
        shell.innerHTML = `${actionBar("Medication Schedule", "Pilih pasien, tanggal mulai, tanggal selesai, dan jam. Jika rentangnya 2 bulan, jadwal harian otomatis dibuat dengan jam yang sama.")}
          <form id="medication-form" class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md shadow-sm grid grid-cols-1 md:grid-cols-8 gap-sm items-end">
            <input type="hidden" name="medicationId" />
            <label class="md:col-span-2"><span class="font-label-md text-on-surface-variant">Pasien</span><select name="patientId" class="mt-xs w-full rounded-lg border-outline-variant bg-surface-container-lowest">${state.data.patients.map(patient => `<option value="${patient.id}" ${patient.id === selectedPatientId ? "selected" : ""}>${patient.name} - ${patient.medicalRecordNumber}</option>`).join("")}</select></label>
            <label><span class="font-label-md text-on-surface-variant">Tanggal Mulai</span><input name="takenDate" type="date" value="${selectedDate}" class="mt-xs w-full rounded-lg border-outline-variant" required /></label>
            <label><span class="font-label-md text-on-surface-variant">Tanggal Selesai</span><input name="endDate" type="date" value="${state.selectedMedicationEndDate || selectedDate}" class="mt-xs w-full rounded-lg border-outline-variant" required /></label>
            <label><span class="font-label-md text-on-surface-variant">Obat</span><select name="name" class="mt-xs w-full rounded-lg border-outline-variant bg-surface-container-lowest" required>${medicationOptionMarkup()}</select><input name="customName" class="hidden mt-xs w-full rounded-lg border-outline-variant" placeholder="Tulis nama obat lainnya" /></label>
            <label><span class="font-label-md text-on-surface-variant">Dosis</span><input name="dose" class="mt-xs w-full rounded-lg border-outline-variant" placeholder="450mg" required /></label>
            <label><span class="font-label-md text-on-surface-variant">Bentuk/Jumlah</span><input name="form" class="mt-xs w-full rounded-lg border-outline-variant" placeholder="1 Kapsul" required /></label>
            <label><span class="font-label-md text-on-surface-variant">Jam</span><input name="scheduledTime" type="time" class="mt-xs w-full rounded-lg border-outline-variant" required /></label>
            <div class="md:col-span-8 flex flex-wrap gap-sm">
              <button class="px-5 py-3 bg-primary text-on-primary rounded-lg font-button-text" type="submit">Simpan Jadwal Harian</button>
              <button class="px-5 py-3 border border-outline-variant rounded-lg font-button-text" type="button" data-medication-reset>Reset Form</button>
            </div>
          </form>
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md shadow-sm"><h4 class="font-headline-sm">${selectedPatient ? selectedPatient.name : "Tidak ada pasien"}</h4><p class="text-on-surface-variant">Jadwal yang ditampilkan untuk ${formatDateId(selectedDate)}. Estimasi selesai mengikuti tanggal selesai terjauh dari jadwal pasien.</p></div>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">${rows.length ? rows.map(({ patient, med }) => `<div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md shadow-sm"><div class="flex justify-between gap-sm"><div><p class="font-bold text-on-surface">${med.name}</p><p class="text-on-surface-variant text-sm">${med.dose} • ${med.form}</p></div><div class="text-right"><span class="text-primary font-bold block">${med.scheduledTime}</span><span class="text-xs text-on-surface-variant">${formatDateId(med.takenDate)}</span></div></div><div class="mt-sm text-xs text-on-surface-variant">Rentang sampai ${formatDateId(med.endDate || med.takenDate)}</div><div class="mt-md pt-sm border-t border-outline-variant/20"><p class="font-label-md">${patient.name}</p><p class="text-sm text-on-surface-variant">${patient.medicalRecordNumber}</p><p class="mt-sm text-sm font-bold ${adminMedicationTone(med.status)}">${statusLabel(med.status)}${med.confirmedAt ? ` pukul ${med.confirmedAt}` : ""}</p>${med.confirmationVideoPath ? `<a class="block mt-xs text-primary font-label-md underline" href="/${med.confirmationVideoPath}" target="_blank">Lihat Video</a>` : ""}<div class="flex gap-sm mt-sm"><button class="text-primary font-label-md" data-med-edit="${med.id}" data-patient-id="${patient.id}" data-name="${med.name}" data-dose="${med.dose}" data-form="${med.form}" data-time="${med.scheduledTime}" data-date="${med.takenDate}" data-end-date="${med.endDate || med.takenDate}">Edit</button><button class="text-error font-label-md" data-med-delete="${med.id}">Hapus</button></div></div></div>`).join("") : `<div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md text-on-surface-variant">Belum ada jadwal obat untuk pasien dan tanggal ini.</div>`}</div>`;
      } else if (view === "assessment results") {
        shell.innerHTML = `${actionBar("Assessment Results")}<div class="grid grid-cols-1 md:grid-cols-2 gap-md">${state.filtered.map(patient => `<div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md shadow-sm"><h4 class="font-headline-sm">${patient.name}</h4><p class="text-on-surface-variant mb-md">${patient.medicalRecordNumber}</p><p>Kepatuhan: <b>${patient.adherenceScore}%</b></p><p>Self-Efficacy: <b>${patient.selfEfficacyScore}%</b></p><p>Risiko: <b>${patient.riskLevel}</b></p></div>`).join("")}</div>`;
      } else if (view === "education content") {
        const items = await api("/api/education");
        shell.innerHTML = `${actionBar("Education Content")}<div class="grid grid-cols-1 md:grid-cols-2 gap-md">${items.map(item => `<article class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md shadow-sm"><span class="text-sm text-secondary font-bold">${item.category}</span><h4 class="font-headline-sm mt-xs">${item.title}</h4><p class="text-on-surface-variant mt-sm">${item.summary}</p></article>`).join("")}</div>`;
      } else if (view === "motivation messages") {
        const items = await api("/api/motivations");
        shell.innerHTML = `${actionBar("Motivation Messages")}<div class="space-y-sm">${items.map(item => `<div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md shadow-sm"><p class="font-headline-sm italic">"${item.message}"</p></div>`).join("")}</div>`;
      } else {
        shell.innerHTML = `${actionBar("Settings")}<div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-md shadow-sm"><p class="text-on-surface-variant">Pengaturan admin akan dikembangkan di tahap berikutnya. Session dan logout sudah aktif.</p></div>`;
      }
      bindNurseActions();
    }

    function bindNurseActions() {
      shell.querySelectorAll("[data-patient-schedule]").forEach(button => {
        button.addEventListener("click", async () => {
          state.selectedMedicationPatientId = button.dataset.patientSchedule;
          state.selectedMedicationDate = todayDate();
          await render("medication schedule");
        });
      });

      shell.querySelectorAll("[data-patient-edit]").forEach(button => {
        button.addEventListener("click", async () => {
          const patient = state.data.patients.find(item => item.id === button.dataset.patientEdit);
          if (!patient) return;
          const name = window.prompt("Nama pasien:", patient.name);
          if (!name) return;
          const googleEmail = window.prompt("Email Google pasien:", patient.googleEmail || "") || "";
          const phase = window.prompt("Fase pengobatan:", patient.phase || "Intensif") || "Intensif";
          const treatmentDay = window.prompt("Jumlah hari perawatan yang sudah berjalan:", patient.treatmentDay || 1) || patient.treatmentDay || 1;
          const treatmentTargetDays = window.prompt("Target total hari pengobatan:", patient.treatmentTargetDays || 180) || patient.treatmentTargetDays || 180;
          const adherenceScore = window.prompt("Skor kepatuhan manual (opsional, akan dihitung ulang dari konfirmasi):", patient.adherenceScore ?? 0) ?? patient.adherenceScore ?? 0;
          const selfEfficacyScore = window.prompt("Skor self-efficacy (0-100):", patient.selfEfficacyScore ?? 0) ?? patient.selfEfficacyScore ?? 0;
          await api(`/api/nurse/patients/${patient.id}`, {
            method: "PUT",
            body: JSON.stringify({ name, googleEmail, phase, treatmentDay, treatmentTargetDays, adherenceScore, selfEfficacyScore })
          });
          state.data = await api("/api/nurse/overview");
          showToast("Data pasien berhasil diperbarui.");
          await render(state.view);
        });
      });

      shell.querySelectorAll("[data-patient-delete]").forEach(button => {
        button.addEventListener("click", async () => {
          const patient = state.data.patients.find(item => item.id === button.dataset.patientDelete);
          if (!patient || !window.confirm(`Hapus/nonaktifkan data pasien ${patient.name}?`)) return;
          await api(`/api/nurse/patients/${patient.id}`, { method: "DELETE" });
          state.data = await api("/api/nurse/overview");
          showToast("Data pasien berhasil dinonaktifkan.");
          await render(state.view);
        });
      });
      shell.querySelector('[data-nurse-action="export"]')?.addEventListener("click", () => {
        downloadCsv("aset-tb-patients.csv", [
          ["MRN", "Name", "Phase", "Adherence", "Self Efficacy", "Risk", "Email"],
          ...state.filtered.map(p => [p.medicalRecordNumber, p.name, p.phase, p.adherenceScore, p.selfEfficacyScore, p.riskLevel, p.googleEmail || ""])
        ]);
      });
      shell.querySelector('[data-nurse-action="add-patient"]')?.addEventListener("click", async () => {
        const name = window.prompt("Nama pasien baru:");
        if (!name) return;
        const googleEmail = window.prompt("Email Google pasien (opsional):") || "";
        const phase = window.prompt("Fase pengobatan:", "Intensif") || "Intensif";
        const treatmentDay = window.prompt("Jumlah hari perawatan yang sudah berjalan:", "1") || "1";
        const treatmentTargetDays = window.prompt("Target total hari pengobatan:", "180") || "180";
        await api("/api/nurse/patients", { method: "POST", body: JSON.stringify({ name, googleEmail, phase, treatmentDay, treatmentTargetDays }) });
        state.data = await api("/api/nurse/overview");
        showToast("Pasien berhasil ditambahkan.");
        await render(state.view);
      });

      const medicationForm = shell.querySelector("#medication-form");
      if (medicationForm) {
        syncCustomMedicationField(medicationForm);
        medicationForm.elements.name?.addEventListener("change", () => syncCustomMedicationField(medicationForm));
      }
      medicationForm?.elements.patientId?.addEventListener("change", async event => {
        state.selectedMedicationPatientId = event.target.value;
        state.selectedMedicationDate = medicationForm.elements.takenDate?.value || todayDate();
        state.selectedMedicationEndDate = medicationForm.elements.endDate?.value || state.selectedMedicationDate;
        await render("medication schedule");
      });
      medicationForm?.elements.takenDate?.addEventListener("change", async event => {
        state.selectedMedicationDate = event.target.value || todayDate();
        state.selectedMedicationEndDate = medicationForm.elements.endDate?.value || state.selectedMedicationDate;
        state.selectedMedicationPatientId = medicationForm.elements.patientId?.value || state.selectedMedicationPatientId;
        await render("medication schedule");
      });
      medicationForm?.elements.endDate?.addEventListener("change", event => {
        state.selectedMedicationEndDate = event.target.value || state.selectedMedicationDate || todayDate();
      });
      medicationForm?.addEventListener("submit", async event => {
        event.preventDefault();
        const form = new FormData(medicationForm);
        const payload = Object.fromEntries(form.entries());
        payload.name = resolveMedicationName(medicationForm);
        delete payload.customName;
        const medicationId = payload.medicationId;
        delete payload.medicationId;
        if (!payload.name) {
          showToast("Pilih obat atau isi nama obat lainnya.");
          return;
        }
        if (medicationId) {
          await api(`/api/nurse/medications/${medicationId}`, {
            method: "PUT",
            body: JSON.stringify({ ...payload, status: "pending" })
          });
          showToast("Jadwal obat berhasil diperbarui dan status pasien direset menjadi belum konfirmasi.");
        } else {
          await api("/api/nurse/medications", {
            method: "POST",
            body: JSON.stringify(payload)
          });
          showToast("Jadwal obat harian berhasil dibuat sampai tanggal selesai.");
        }
        await render("medication schedule");
      });

      shell.querySelector("[data-medication-reset]")?.addEventListener("click", () => {
        medicationForm?.reset();
        if (medicationForm?.elements.medicationId) medicationForm.elements.medicationId.value = "";
        if (medicationForm?.elements.takenDate) medicationForm.elements.takenDate.value = state.selectedMedicationDate || todayDate();
        if (medicationForm?.elements.endDate) medicationForm.elements.endDate.value = state.selectedMedicationEndDate || state.selectedMedicationDate || todayDate();
        if (medicationForm) syncCustomMedicationField(medicationForm);
      });

      shell.querySelectorAll("[data-med-edit]").forEach(button => {
        button.addEventListener("click", () => {
          if (!medicationForm) return;
          medicationForm.elements.medicationId.value = button.dataset.medEdit;
          medicationForm.elements.patientId.value = button.dataset.patientId;
          const knownMedication = tbMedicationOptions.some(group => group.items.includes(button.dataset.name));
          medicationForm.elements.name.value = knownMedication ? button.dataset.name : "__other";
          medicationForm.elements.customName.value = knownMedication ? "" : button.dataset.name;
          syncCustomMedicationField(medicationForm);
          medicationForm.elements.dose.value = button.dataset.dose;
          medicationForm.elements.form.value = button.dataset.form;
          medicationForm.elements.scheduledTime.value = button.dataset.time;
          medicationForm.elements.takenDate.value = button.dataset.date || todayDate();
          if (medicationForm.elements.endDate) medicationForm.elements.endDate.value = button.dataset.endDate || button.dataset.date || todayDate();
          state.selectedMedicationPatientId = button.dataset.patientId;
          state.selectedMedicationDate = button.dataset.date || todayDate();
          state.selectedMedicationEndDate = button.dataset.endDate || state.selectedMedicationDate;
          medicationForm.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });

      shell.querySelectorAll("[data-med-delete]").forEach(button => {
        button.addEventListener("click", async () => {
          if (!window.confirm("Hapus jadwal obat ini?")) return;
          await api(`/api/nurse/medications/${button.dataset.medDelete}`, { method: "DELETE" });
          showToast("Jadwal obat berhasil dihapus.");
          await render("medication schedule");
        });
      });
    }

    document.querySelectorAll("aside nav a, aside .mt-auto a").forEach(link => {
      link.addEventListener("click", async event => {
        event.preventDefault();
        const label = link.textContent.trim().toLowerCase();
        if (label.includes("sign out")) {
          await api("/api/auth/logout", { method: "POST", body: "{}" });
          window.location.href = "/";
          return;
        }
        if (label.includes("overview")) await render("overview");
        else if (label.includes("patient")) await render("patient list");
        else if (label.includes("medication")) await render("medication schedule");
        else if (label.includes("assessment")) await render("assessment results");
        else if (label.includes("education")) await render("education content");
        else if (label.includes("motivation")) await render("motivation messages");
        else if (label.includes("settings")) await render("settings");
      });
    });

    searchInput?.addEventListener("input", () => render(state.view));
    await render("overview");
  }

  function runFeature(name, task) {
    Promise.resolve()
      .then(task)
      .catch(error => {
        console.error(`${name} gagal:`, error);
        showToast(`${name} belum bisa dimuat: ${error.message}`);
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    runFeature("Navigasi", bindNavigation);
    if (!["/", "/landing", "/nurse"].includes(path)) runFeature("Profil Google", initPatientIdentity);
    if (path === "/" || path === "/landing") runFeature("Login Google", initLanding);
    if (path.includes("dashboard_pasien") || path === "/dashboard") runFeature("Dashboard pasien", initDashboard);
    if (path.includes("jadwal") || path === "/schedule") runFeature("Jadwal obat", initSchedule);
    if (path.includes("chatbot") || path === "/chatbot") runFeature("Asisten ASET-TB", initChatbot);
    if (path === "/education") runFeature("Edukasi TB", initEducation);
    if (path === "/profile") runFeature("Profil pasien", initProfile);
    if (path.includes("dashboard_perawat") || path === "/nurse") runFeature("Dashboard perawat", initNurse);
  });
})();
