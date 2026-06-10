const dns = require("dns/promises");
const https = require("https");

function requireGoogleConfig(config) {
  const missing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"]
    .filter(key => !config[key]);
  if (missing.length) {
    throw new Error(`Konfigurasi Google OAuth belum lengkap: ${missing.join(", ")}`);
  }
}

function googleAuthUrl(config, state) {
  requireGoogleConfig(config);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", config.GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  return url.toString();
}

async function resolveGoogleHosts(hostname) {
  try {
    const addresses = await dns.resolve4(hostname);
    return addresses.length ? addresses : [hostname];
  } catch {
    return [hostname];
  }
}

async function requestJson(urlValue, options = {}) {
  const url = new URL(urlValue);
  const body = options.body ? Buffer.from(options.body) : null;
  const addresses = await resolveGoogleHosts(url.hostname);
  let lastError;

  for (const address of addresses) {
    try {
      return await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: address,
          servername: url.hostname,
          family: address === url.hostname ? undefined : 4,
          path: `${url.pathname}${url.search}`,
          method: options.method || "GET",
          headers: {
            host: url.hostname,
            accept: "application/json",
            ...(body ? { "content-length": body.length } : {}),
            ...(options.headers || {})
          },
          timeout: 20000
        }, response => {
          let data = "";
          response.setEncoding("utf8");
          response.on("data", chunk => { data += chunk; });
          response.on("end", () => {
            let payload = {};
            try {
              payload = data ? JSON.parse(data) : {};
            } catch {
              payload = { error: data || "Respons Google tidak valid" };
            }
            resolve({ ok: response.statusCode >= 200 && response.statusCode < 300, status: response.statusCode, payload });
          });
        });
        req.on("timeout", () => req.destroy(new Error(`Koneksi Google OAuth timeout ke ${address}`)));
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Backend tidak bisa menghubungi Google OAuth");
}

async function exchangeCodeForProfile(config, code) {
  requireGoogleConfig(config);
  let tokenResponse;
  try {
    tokenResponse = await requestJson("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        redirect_uri: config.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code"
      }).toString()
    });
  } catch (error) {
    throw new Error(`Backend tidak bisa menghubungi Google OAuth (${error.message}). Pastikan koneksi internet aktif dan Node.js tidak diblokir firewall/proxy.`);
  }

  const tokenPayload = tokenResponse.payload;
  if (!tokenResponse.ok) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || "Gagal menukar kode Google");
  }

  let profileResponse;
  try {
    const profileUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    profileUrl.searchParams.set("id_token", tokenPayload.id_token);
    profileResponse = await requestJson(profileUrl.toString());
  } catch (error) {
    throw new Error(`Backend tidak bisa memverifikasi profil Google (${error.message}).`);
  }

  const profile = profileResponse.payload;
  if (!profileResponse.ok) {
    throw new Error(profile.error_description || profile.error || "Gagal memverifikasi profil Google");
  }
  if (profile.aud !== config.GOOGLE_CLIENT_ID) {
    throw new Error("Audience Google token tidak sesuai");
  }

  return {
    googleSub: profile.sub,
    email: profile.email,
    name: profile.name || profile.email,
    avatarUrl: profile.picture || null
  };
}

module.exports = { exchangeCodeForProfile, googleAuthUrl };
