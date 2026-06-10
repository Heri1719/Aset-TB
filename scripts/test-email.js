const { loadEnv } = require("../lib/env");
const { sendSmtpMail } = require("../lib/email");

loadEnv();

const config = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  startTls: process.env.SMTP_STARTTLS !== "false",
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, "") : undefined,
  from: process.env.SMTP_FROM
};

const to = process.argv[2] || process.env.SMTP_USER;

sendSmtpMail(config, {
  to,
  subject: "Tes email ASET-TB",
  text: [
    "Ini tes pengiriman email ASET-TB dari server lokal.",
    "",
    "Jika email ini masuk, konfigurasi SMTP sudah benar dan reminder jadwal obat bisa berjalan."
  ].join("\n")
}).then(() => {
  console.log(`Email tes berhasil dikirim ke ${to}`);
}).catch(error => {
  console.error(`Email tes gagal: ${error.message}`);
  process.exit(1);
});
