const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const { clearSessionCookie, createSessionCookie, readSession, requireSession } = require("./lib/auth");
const { loadEnv } = require("./lib/env");
const { exchangeCodeForProfile, googleAuthUrl } = require("./lib/google");
const { askTbAssistant } = require("./lib/openai-chatbot");
const { isEmailConfigured, sendSmtpMail } = require("./lib/email");
const { PostgresStore } = require("./lib/store");

loadEnv();

const root = __dirname;
const uploadRoot = path.join(root, "uploads", "confirmations");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const sessionSecret = process.env.SESSION_SECRET || "aset-tb-dev-session-secret-change-me";
const appOrigin = process.env.APP_ORIGIN || `http://${host}:${port}`;

const config = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || `${appOrigin}/api/auth/google/callback`,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  EMAIL_NOTIFICATIONS_ENABLED: process.env.EMAIL_NOTIFICATIONS_ENABLED !== "false",
  EMAIL_APP_URL: process.env.EMAIL_APP_URL || appOrigin,
  SMTP: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    startTls: process.env.SMTP_STARTTLS !== "false",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, "") : undefined,
    from: process.env.SMTP_FROM
  }
};

const store = new PostgresStore(process.env.DATABASE_URL);

const routes = {
  "/": "/landing_page_aset_tb/code.html",
  "/landing": "/landing_page_aset_tb/code.html",
  "/dashboard": "/dashboard_pasien_aset_tb/code.html",
  "/schedule": "/jadwal_konfirmasi_obat/code.html",
  "/chatbot": "/chatbot_ai_edukasi_tb/code.html",
  "/education": "/education_tb/code.html",
  "/profile": "/profile_aset_tb/code.html",
  "/nurse": "/dashboard_perawat_monitoring_kepatuhan/code.html"
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function isConfigured(value, placeholder) {
  return Boolean(value) && value !== placeholder && !String(value).includes("your-");
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { location, ...headers });
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 30_000_000) {
        req.destroy();
        reject(new Error("Request body terlalu besar. Maksimal video konfirmasi sekitar 20 MB."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON tidak valid"));
      }
    });
  });
}

function jakartaTime() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta"
  }).replace(".", ":");
}

async function saveConfirmationVideo(medicationId, body) {
  if (!body.videoData) return null;

  const videoData = String(body.videoData);
  const match = videoData.match(/^data:([^,]+),(.+)$/s);
  if (!match) throw new Error("Format video konfirmasi tidak valid. Silakan rekam ulang video.");

  const metadata = match[1];
  const encoded = match[2];
  const isBase64 = metadata.toLowerCase().includes(";base64");
  const mimeType = body.videoMimeType || metadata.split(";")[0] || "video/webm";
  const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("quicktime") ? "mov" : "webm";
  const bytes = isBase64 ? Buffer.from(encoded, "base64") : Buffer.from(decodeURIComponent(encoded));

  if (!bytes.length) throw new Error("Video konfirmasi kosong. Silakan rekam ulang video.");
  if (bytes.length > 25_000_000) throw new Error("Video terlalu besar. Gunakan rekaman lebih pendek.");

  await fs.mkdir(uploadRoot, { recursive: true });
  const filename = `${medicationId}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadRoot, filename);
  await fs.writeFile(filePath, bytes);
  return {
    videoPath: path.relative(root, filePath),
    videoMimeType: mimeType
  };
}

async function resolvePatientId(req, res, url) {
  const session = requireSession(req, res, sessionSecret);
  if (!session) return null;
  if (session.role === "nurse" && url.searchParams.get("patientId")) return url.searchParams.get("patientId");
  if (session.patientId) return session.patientId;
  const patient = await store.getPatientForUser(session.userId);
  return patient?.id || null;
}

function jakartaParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`
  };
}

function reminderEmailText({ patientName, medication, appUrl }) {
  return [
    `Halo ${patientName || "Pasien ASET-TB"},`,
    "",
    "Ini pengingat minum obat dari ASET-TB.",
    "",
    `Obat: ${medication.name}`,
    `Dosis/Jumlah: ${medication.dose} - ${medication.form}`,
    `Tanggal: ${medication.takenDate}`,
    `Jam minum: ${medication.scheduledTime} WIB`,
    "",
    "Silakan buka aplikasi ASET-TB untuk melihat jadwal dan melakukan konfirmasi setelah obat diminum:",
    `${appUrl}/schedule`,
    "",
    "Semoga lancar hari ini. Konsistensi kecil membantu proses pengobatan Anda.",
    "",
    "ASET-TB"
  ].join("\n");
}

async function sendDueMedicationReminders() {
  if (!config.EMAIL_NOTIFICATIONS_ENABLED) return;
  if (!isEmailConfigured(config.SMTP)) {
    if (!sendDueMedicationReminders.warned) {
      console.log("Email reminder belum aktif: isi SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, dan SMTP_FROM di .env");
      sendDueMedicationReminders.warned = true;
    }
    return;
  }

  const target = new Date(Date.now() + 5 * 60 * 1000);
  const { date, time } = jakartaParts(target);
  const due = await store.listMedicationReminderDue({ targetDate: date, targetTime: time });
  for (const item of due) {
    const medication = item.medication;
    try {
      await sendSmtpMail(config.SMTP, {
        to: item.email,
        subject: `Pengingat minum obat ${medication.name} pukul ${medication.scheduledTime} WIB`,
        text: reminderEmailText({ patientName: item.patientName, medication, appUrl: config.EMAIL_APP_URL })
      });
      await store.recordMedicationReminder({
        medicationId: medication.id,
        patientId: medication.patientId,
        email: item.email,
        status: "sent"
      });
      console.log(`Email reminder terkirim ke ${item.email} untuk ${medication.name} ${medication.scheduledTime}`);
    } catch (error) {
      await store.recordMedicationReminder({
        medicationId: medication.id,
        patientId: medication.patientId,
        email: item.email,
        status: "failed",
        errorMessage: error.message
      });
      console.error("Gagal mengirim email reminder:", error.message);
    }
  }
}

function startReminderScheduler() {
  sendDueMedicationReminders().catch(error => console.error("Scheduler email reminder gagal:", error.message));
  return setInterval(() => {
    sendDueMedicationReminders().catch(error => console.error("Scheduler email reminder gagal:", error.message));
  }, 60_000);
}

async function handleAuth(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/auth/google/start") {
    const state = crypto.randomBytes(24).toString("base64url");
    redirect(res, googleAuthUrl(config, state), {
      "set-cookie": `aset_tb_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/google/callback") {
    const expectedState = (req.headers.cookie || "").match(/aset_tb_oauth_state=([^;]+)/)?.[1];
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    if (!code || !state || state !== expectedState) {
      sendJson(res, 400, { error: "Callback Google tidak valid" });
      return true;
    }

    try {
      const profile = await exchangeCodeForProfile(config, code);
      const user = await store.getOrCreateGoogleUser(profile);
      const patient = await store.getPatientForUser(user.id);
      const session = {
        userId: user.id,
        role: user.role,
        patientId: patient?.id || null
      };
      redirect(res, patient ? "/dashboard" : "/landing?status=waiting-verification", {
        "set-cookie": [
          createSessionCookie(session, sessionSecret),
          "aset_tb_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
        ]
      });
    } catch (error) {
      console.error("Login Google gagal:", error.message);
      sendJson(res, 502, {
        error: `Login Google gagal: ${error.message}`,
        hint: "Pastikan server dijalankan dari Terminal lokal, GOOGLE_CLIENT_ID/SECRET benar, dan Authorized redirect URI di Google Cloud sama persis: " + config.GOOGLE_REDIRECT_URI
      });
    }
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/nurse-login") {
    const body = await readBody(req);
    const user = await store.findNurseByEmail(body.email);
    if (!user) {
      sendJson(res, 401, { error: "Akun perawat tidak ditemukan" });
      return true;
    }
    sendJson(res, 200, { user }, {
      "set-cookie": createSessionCookie({ userId: user.id, role: "nurse", patientId: null }, sessionSecret)
    });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    sendJson(res, 200, { ok: true }, { "set-cookie": clearSessionCookie() });
    return true;
  }

  return false;
}

async function handleApi(req, res, url) {
  if (await handleAuth(req, res, url)) return;

  if (req.method === "GET" && url.pathname === "/api/config/status") {
    sendJson(res, 200, {
      googleOAuth: isConfigured(config.GOOGLE_CLIENT_ID, "your-google-client-id.apps.googleusercontent.com")
        && isConfigured(config.GOOGLE_CLIENT_SECRET, "your-google-client-secret"),
      openAi: isConfigured(config.OPENAI_API_KEY, "sk-your-openai-key"),
      gemini: isConfigured(config.GEMINI_API_KEY, "your-gemini-api-key"),
      database: true,
      emailNotifications: config.EMAIL_NOTIFICATIONS_ENABLED && isEmailConfigured(config.SMTP),
      redirectUri: config.GOOGLE_REDIRECT_URI
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const session = readSession(req, sessionSecret);
    if (!session) {
      sendJson(res, 200, { authenticated: false });
      return;
    }
    const user = await store.findUserById(session.userId);
    const patient = session.patientId ? await store.getPatientById(session.patientId) : await store.getPatientForUser(session.userId);
    sendJson(res, 200, { authenticated: true, user, patient });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/patient/dashboard") {
    const patientId = await resolvePatientId(req, res, url);
    if (!patientId) return;
    const payload = await store.getPatientDashboard(patientId);
    if (!payload) {
      sendJson(res, 404, { error: "Pasien tidak ditemukan" });
      return;
    }
    sendJson(res, 200, payload);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/patient/self-efficacy") {
    const patientId = await resolvePatientId(req, res, url);
    if (!patientId) return;
    try {
      const patient = await store.saveSelfEfficacy(patientId, await readBody(req));
      sendJson(res, 200, { patient });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/patient/motivation-score") {
    const patientId = await resolvePatientId(req, res, url);
    if (!patientId) return;
    try {
      const motivationScore = await store.saveMotivationScore(patientId, await readBody(req));
      sendJson(res, 200, { motivationScore });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/medication-dates") {
    const patientId = await resolvePatientId(req, res, url);
    if (!patientId) return;
    sendJson(res, 200, await store.listMedicationDates(patientId));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/medications") {
    const patientId = await resolvePatientId(req, res, url);
    if (!patientId) return;
    sendJson(res, 200, await store.listMedications(patientId, url.searchParams.get("date")));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/nurse/medications") {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    if (session.role !== "nurse") {
      sendJson(res, 403, { error: "Hanya perawat yang dapat mengatur jadwal obat" });
      return;
    }
    try {
      const medication = await store.createMedication(await readBody(req), session.userId);
      sendJson(res, 201, medication);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "PUT" && url.pathname.match(/^\/api\/nurse\/medications\/[^/]+$/)) {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    if (session.role !== "nurse") {
      sendJson(res, 403, { error: "Hanya perawat yang dapat mengatur jadwal obat" });
      return;
    }
    const id = url.pathname.split("/").at(-1);
    try {
      const medication = await store.updateMedication(id, await readBody(req), session.userId);
      if (!medication) {
        sendJson(res, 404, { error: "Jadwal obat tidak ditemukan" });
        return;
      }
      sendJson(res, 200, medication);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "DELETE" && url.pathname.match(/^\/api\/nurse\/medications\/[^/]+$/)) {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    if (session.role !== "nurse") {
      sendJson(res, 403, { error: "Hanya perawat yang dapat mengatur jadwal obat" });
      return;
    }
    const id = url.pathname.split("/").at(-1);
    const deleted = await store.deleteMedication(id, session.userId);
    if (!deleted) {
      sendJson(res, 404, { error: "Jadwal obat tidak ditemukan" });
      return;
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/education") {
    requireSession(req, res, sessionSecret);
    if (res.headersSent) return;
    sendJson(res, 200, await store.listEducation());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/motivations") {
    requireSession(req, res, sessionSecret);
    if (res.headersSent) return;
    sendJson(res, 200, await store.listMotivations());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/nurse/patients") {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    if (session.role !== "nurse") {
      sendJson(res, 403, { error: "Hanya perawat yang dapat menambah pasien" });
      return;
    }
    try {
      const patient = await store.createPatient(await readBody(req), session.userId);
      sendJson(res, 201, patient);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "PUT" && url.pathname.match(/^\/api\/nurse\/patients\/[^/]+$/)) {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    if (session.role !== "nurse") {
      sendJson(res, 403, { error: "Hanya perawat yang dapat mengedit pasien" });
      return;
    }
    const id = url.pathname.split("/").at(-1);
    try {
      const patient = await store.updatePatient(id, await readBody(req));
      if (!patient) {
        sendJson(res, 404, { error: "Pasien tidak ditemukan" });
        return;
      }
      sendJson(res, 200, patient);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "DELETE" && url.pathname.match(/^\/api\/nurse\/patients\/[^/]+$/)) {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    if (session.role !== "nurse") {
      sendJson(res, 403, { error: "Hanya perawat yang dapat menghapus pasien" });
      return;
    }
    const id = url.pathname.split("/").at(-1);
    const deleted = await store.deactivatePatient(id, session.userId);
    if (!deleted) {
      sendJson(res, 404, { error: "Pasien tidak ditemukan" });
      return;
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname.match(/^\/api\/medications\/[^/]+\/confirm$/)) {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    const id = url.pathname.split("/")[3];
    const body = await readBody(req);
    const evidence = await saveConfirmationVideo(id, body);
    const medication = await store.confirmMedication(id, session.userId, body.confirmedAt || jakartaTime(), evidence || {});
    if (!medication) {
      sendJson(res, 404, { error: "Jadwal obat tidak ditemukan" });
      return;
    }
    sendJson(res, 200, medication);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/nurse/overview") {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    if (session.role !== "nurse") {
      sendJson(res, 403, { error: "Hanya perawat yang dapat membuka dashboard ini" });
      return;
    }
    sendJson(res, 200, await store.getNurseOverview());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/nurse/reminders/run") {
    const session = requireSession(req, res, sessionSecret);
    if (!session) return;
    if (session.role !== "nurse") {
      sendJson(res, 403, { error: "Hanya perawat yang dapat menjalankan reminder" });
      return;
    }
    await sendDueMedicationReminders();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/chat") {
    const patientId = await resolvePatientId(req, res, url);
    if (!patientId) return;
    sendJson(res, 200, await store.listChat(patientId));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    const patientId = await resolvePatientId(req, res, url);
    if (!patientId) return;
    const body = await readBody(req);
    const message = String(body.message || "").trim();
    if (!message) {
      sendJson(res, 400, { error: "Pesan tidak boleh kosong" });
      return;
    }

    const patient = await store.getPatientById(patientId);
    const history = (await store.listChat(patientId)).slice(-8);
    const userMessage = await store.addChatMessage({ patientId, sender: "user", message, topic: "general" });
    const answer = await askTbAssistant({
      apiKey: config.OPENAI_API_KEY,
      model: config.OPENAI_MODEL,
      geminiApiKey: config.GEMINI_API_KEY,
      geminiModel: config.GEMINI_MODEL,
      message,
      history,
      patient
    });
    const assistantMessage = await store.addChatMessage({
      patientId,
      sender: "assistant",
      message: answer.message,
      topic: answer.topic
    });
    sendJson(res, 201, { messages: [userMessage, assistantMessage], provider: answer.provider });
    return;
  }

  sendJson(res, 404, { error: "Endpoint tidak ditemukan" });
}

async function serveStatic(req, res, url) {
  const mappedPath = routes[url.pathname] || url.pathname;
  const filePath = path.normalize(path.join(root, mappedPath));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const stat = await fs.stat(filePath);
    const actualPath = stat.isDirectory() ? path.join(filePath, "code.html") : filePath;
    const ext = path.extname(actualPath);
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
    res.end(await fs.readFile(actualPath));
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Halaman tidak ditemukan");
  }
}

let readyPromise;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = store.ensureConnected();
  }
  return readyPromise;
}

async function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await ensureReady();
      await handleApi(req, res, url);
      return;
    }
    if (url.pathname.startsWith("/uploads/confirmations/")) {
      await serveStatic(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Terjadi kesalahan server" });
  }
}

const server = http.createServer(requestHandler);

if (require.main === module) {
  ensureReady()
    .then(() => {
      server.listen(port, host, () => {
        console.log(`ASET-TB berjalan di http://${host}:${port}`);
        startReminderScheduler();
      });
    })
    .catch(error => {
      console.error("Gagal terhubung ke PostgreSQL:", error.message);
      console.error("Pastikan DATABASE_URL benar dan jalankan: npm run db:migrate");
      process.exit(1);
    });
}

module.exports = requestHandler;
