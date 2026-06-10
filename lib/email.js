const dns = require("dns/promises");
const net = require("net");
const tls = require("tls");

function isEmailConfigured(config) {
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;
}

function normalizeAddress(value) {
  const text = String(value || "").trim();
  const match = text.match(/<([^>]+)>/);
  return match ? match[1].trim() : text;
}

function dotStuff(value) {
  return String(value).replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function createReader(socket) {
  let buffer = "";
  const waiters = [];
  socket.on("data", chunk => {
    buffer += chunk.toString("utf8");
    flush();
  });
  socket.on("error", error => {
    while (waiters.length) waiters.shift().reject(error);
  });
  function flush() {
    while (waiters.length) {
      const response = parseResponse(buffer);
      if (!response) return;
      buffer = buffer.slice(response.length);
      waiters.shift().resolve(response.text);
    }
  }
  function read() {
    return new Promise((resolve, reject) => {
      waiters.push({ resolve, reject });
      flush();
    });
  }
  return { read };
}

function parseResponse(buffer) {
  const lines = buffer.split(/\r?\n/);
  let consumed = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) return null;
    consumed += Buffer.byteLength(line) + 2;
    if (/^\d{3} /.test(line)) {
      const text = lines.slice(0, i + 1).join("\n");
      return { text, length: consumed };
    }
  }
  return null;
}

function expect(response, codes, command) {
  const code = Number(String(response).slice(0, 3));
  if (!codes.includes(code)) {
    throw new Error(`SMTP ${command} gagal: ${String(response).split("\n").at(-1)}`);
  }
}

function writeLine(socket, line) {
  socket.write(`${line}\r\n`);
}

async function connect(config) {
  const port = Number(config.port || 587);
  let addresses = [];
  try {
    addresses = await dns.resolve4(config.host);
  } catch {
    addresses = [config.host];
  }
  let lastError;
  for (const address of addresses) {
    try {
      const socket = await new Promise((resolve, reject) => {
        const options = { host: address, port, servername: config.host, family: 4 };
        const candidate = config.secure ? tls.connect(options, () => resolve(candidate)) : net.connect(options, () => resolve(candidate));
        candidate.setTimeout(20_000, () => {
          candidate.destroy();
          reject(new Error(`Koneksi SMTP timeout ke ${address}`));
        });
        candidate.once("error", reject);
      });
      socket.setTimeout(20_000);
      return socket;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Tidak bisa terhubung ke SMTP");
}

async function startTls(socket, reader, config) {
  writeLine(socket, `EHLO ${config.helloName || "localhost"}`);
  expect(await reader.read(), [250], "EHLO");
  writeLine(socket, "STARTTLS");
  expect(await reader.read(), [220], "STARTTLS");
  return tls.connect({ socket, servername: config.host });
}

async function sendSmtpMail(config, message) {
  if (!isEmailConfigured(config)) {
    return { skipped: true, reason: "SMTP belum dikonfigurasi" };
  }

  let socket = await connect(config);
  let reader = createReader(socket);
  try {
    expect(await reader.read(), [220], "CONNECT");
    if (!config.secure && config.startTls !== false) {
      socket = await startTls(socket, reader, config);
      reader = createReader(socket);
    }

    writeLine(socket, `EHLO ${config.helloName || "localhost"}`);
    expect(await reader.read(), [250], "EHLO");
    writeLine(socket, "AUTH LOGIN");
    expect(await reader.read(), [334], "AUTH LOGIN");
    writeLine(socket, Buffer.from(config.user).toString("base64"));
    expect(await reader.read(), [334], "SMTP USER");
    writeLine(socket, Buffer.from(config.pass).toString("base64"));
    expect(await reader.read(), [235], "SMTP PASSWORD");

    writeLine(socket, `MAIL FROM:<${normalizeAddress(config.from)}>`);
    expect(await reader.read(), [250], "MAIL FROM");
    writeLine(socket, `RCPT TO:<${normalizeAddress(message.to)}>`);
    expect(await reader.read(), [250, 251], "RCPT TO");
    writeLine(socket, "DATA");
    expect(await reader.read(), [354], "DATA");

    const body = [
      `From: ${config.from}`,
      `To: ${message.to}`,
      `Subject: ${encodeHeader(message.subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      dotStuff(message.text),
      "."
    ].join("\r\n");
    socket.write(`${body}\r\n`);
    expect(await reader.read(), [250], "SEND");
    writeLine(socket, "QUIT");
    return { sent: true };
  } finally {
    socket.end();
  }
}

module.exports = { isEmailConfigured, sendSmtpMail };
