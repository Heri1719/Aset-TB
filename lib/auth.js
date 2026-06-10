const crypto = require("crypto");

const cookieName = "aset_tb_session";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSessionCookie(session, secret) {
  const payload = base64url(JSON.stringify(session));
  const signature = sign(payload, secret);
  return `${cookieName}=${payload}.${signature}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 14}`;
}

function clearSessionCookie() {
  return `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";")
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => {
        const index = item.indexOf("=");
        return [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
      })
  );
}

function readSession(req, secret) {
  const value = parseCookies(req.headers.cookie || "")[cookieName];
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function requireSession(req, res, secret) {
  const session = readSession(req, secret);
  if (!session) {
    res.writeHead(401, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Silakan login terlebih dahulu" }));
    return null;
  }
  return session;
}

module.exports = {
  clearSessionCookie,
  createSessionCookie,
  readSession,
  requireSession
};
