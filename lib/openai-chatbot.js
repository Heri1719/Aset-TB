function pickVariant(message, variants) {
  const seed = Array.from(String(message || "")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[seed % variants.length];
}

function normalizeText(message) {
  return String(message || "").toLowerCase().trim();
}

function isGreeting(text) {
  return /\b(halo|hai|hello|pagi|siang|sore|malam|apa kabar|gimana kabar|bagaimana kabar|kabar kamu|lagi apa)\b/i.test(text);
}

function isThanks(text) {
  return /\b(terima kasih|makasih|thanks|thank you|sip|oke|ok)\b/i.test(text);
}

function isConfused(text) {
  return /\b(tidak nyambung|nggak nyambung|ga nyambung|bingung|maksudnya|apa maksud|kurang paham)\b/i.test(text);
}

function isMoodSharing(text) {
  return /\b(sedih|capek|lelah|bosan|jenuh|takut|cemas|khawatir|malas|putus asa|berat|curhat|cerita|temani|sendiri|kesepian)\b/i.test(text);
}

function wantsOpenConversation(text) {
  return /\b(aku cuma mau cerita|saya cuma mau cerita|mau cerita|ingin cerita|boleh curhat|mau curhat|temani saya|dengarkan saya)\b/i.test(text);
}

function lastAssistantMessage(history = []) {
  return [...history].reverse().find(item => item.sender === "assistant")?.message || "";
}

function localSafetyAnswer(message, context = {}) {
  const text = normalizeText(message);
  const history = context.history || [];

  if (isThanks(text)) {
    return {
      topic: "conversation",
      message: pickVariant(message, [
        "Sama-sama. Saya senang bisa menemani. Kalau nanti ada yang terasa membingungkan tentang jadwal, obat, atau keluhan ringan, tulis saja pelan-pelan ya.",
        "Dengan senang hati. Semoga hari ini sedikit lebih ringan. Kita bisa lanjut kapan pun Anda butuh teman untuk memahami jadwal atau menjaga semangat.",
        "Sama-sama. Terima kasih juga sudah tetap berusaha menjalani proses ini. Kalau ada yang ingin ditanyakan lagi, saya siap bantu."
      ])
    };
  }

  if (isConfused(text)) {
    const previous = lastAssistantMessage(history);
    return {
      topic: "conversation",
      message: previous
        ? "Maaf kalau jawaban saya tadi kurang pas. Saya coba luruskan: maksud saya, kita fokus dulu pada hal yang Anda tanyakan sekarang. Bisa tuliskan bagian mana yang ingin diperjelas, misalnya jadwal obat, efek samping, atau cara menjaga motivasi?"
        : "Maaf kalau terasa membingungkan. Coba tuliskan pertanyaan Anda dengan satu kalimat sederhana, misalnya: 'obat saya telat diminum, bagaimana?' atau 'saya bosan minum obat, bantu semangati'. Saya akan jawab lebih langsung."
    };
  }

  if (isGreeting(text)) {
    return {
      topic: "greeting",
      message: pickVariant(message, [
        "Saya baik, terima kasih sudah menyapa. Bagaimana kabar Anda hari ini? Kalau ada yang terasa berat soal pengobatan, kita bahas satu per satu.",
        "Halo, saya di sini. Hari ini rasanya bagaimana? Ceritakan sedikit saja; saya akan bantu dengan jawaban yang sederhana dan aman.",
        "Hai, senang Anda mampir. Mau ngobrol ringan dulu atau langsung bahas jadwal obat, efek samping, atau motivasi hari ini?",
        "Kabar saya baik. Yang penting, bagaimana kabar Anda? Kalau sedang lelah menjalani pengobatan, kita bisa mulai dari langkah kecil dulu."
      ])
    };
  }

  if (wantsOpenConversation(text)) {
    return {
      topic: "conversation",
      message: pickVariant(message, [
        "Boleh, saya dengarkan. Ceritakan pelan-pelan saja, tidak harus rapi. Apa yang paling terasa mengganggu atau memenuhi pikiran Anda hari ini?",
        "Tentu boleh. Kadang yang dibutuhkan memang bukan jawaban panjang, tapi tempat untuk mulai bercerita. Saya di sini; apa yang sedang Anda rasakan?",
        "Silakan cerita. Saya akan menemani dengan tenang. Mulai dari bagian mana pun yang paling mudah untuk Anda tuliskan."
      ])
    };
  }

  if (text.includes("lupa") || text.includes("telat")) {
    return {
      topic: "missed_dose",
      message: "Kalau lupa minum obat, biasanya obat diminum segera saat ingat bila belum terlalu dekat dengan jadwal berikutnya. Jangan menggandakan dosis. Catat kejadian ini, lalu beri tahu perawat bila sering terulang atau Anda ragu dengan jadwalnya."
    };
  }

  if (text.includes("mual") || text.includes("efek") || text.includes("pusing") || text.includes("ruam") || text.includes("gatal")) {
    return {
      topic: "side_effect",
      message: "Keluhan ringan seperti mual atau pusing bisa terjadi pada sebagian pasien, tetapi tetap perlu dipantau. Minum air cukup dan ikuti anjuran makan/minum obat dari perawat. Segera hubungi fasilitas kesehatan bila muncul mata atau kulit kuning, muntah berat, ruam luas, sesak, nyeri dada, batuk darah banyak, atau lemas berat."
    };
  }

  if (isMoodSharing(text) || text.includes("semangat") || text.includes("motivasi")) {
    return {
      topic: "motivation",
      message: pickVariant(message, [
        "Saya paham, pengobatan TB bisa terasa panjang dan melelahkan. Untuk hari ini, jangan pikirkan semuanya sekaligus. Cukup fokus pada jadwal obat terdekat, lalu akui bahwa itu sudah sebuah kemajuan.",
        "Rasa bosan atau lelah itu manusiawi. Yang penting, jangan biarkan perasaan hari ini mengambil alih keputusan besar. Ambil satu langkah kecil: siapkan obat, minum sesuai jadwal, lalu konfirmasi.",
        "Kalau semangat sedang turun, gunakan rencana sebagai pegangan. Jadwal obat membantu Anda tetap bergerak meski motivasi belum penuh. Anda boleh pelan, asal tidak berhenti tanpa bicara dengan perawat/dokter.",
        "Hari ini tidak harus sempurna. Satu dosis yang berhasil diminum tetap berarti. Itu tanda Anda masih menjaga diri dan memberi tubuh kesempatan untuk pulih."
      ])
    };
  }

  if (text.includes("kenapa") || text.includes("setiap hari") || text.includes("teratur") || text.includes("informasi") || text.includes("tb") || text.includes("tbc") || text.includes("obat")) {
    return {
      topic: "adherence",
      message: "Obat TB perlu diminum teratur agar kuman TB benar-benar ditekan dan risiko kebal obat berkurang. Karena pengobatan berjalan cukup lama, jadwal harian dan konfirmasi minum obat membantu Anda dan perawat melihat apakah terapi berjalan konsisten."
    };
  }

  return {
    topic: "conversation",
    message: "Saya menangkap pesan Anda, tapi saya belum yakin bagian mana yang ingin dibantu. Coba pilih salah satu: ingin motivasi, bertanya soal jadwal obat, efek samping, atau informasi TB? Tulis dengan bebas, saya akan bantu jawab lebih tepat."
  };
}

function isPlaceholderKey(apiKey) {
  return !apiKey || apiKey.includes("your-") || apiKey.includes("YOUR_") || apiKey === "sk-your-openai-key";
}

function tbSystemPrompt() {
  return [
    "Anda adalah Asisten ASET-TB, pendamping percakapan untuk pasien tuberkulosis di Indonesia.",
    "Tugas Anda bukan hanya edukasi, tetapi juga menemani pasien dengan gaya bicara natural, empatik, dan manusiawi. Jawaban harus terasa seperti percakapan singkat, bukan brosur kesehatan.",
    "Jawab sesuai maksud pengguna. Jika pengguna hanya menyapa atau bertanya kabar, jawab ringan dan hangat; jangan memaksakan edukasi TB.",
    "Jika pengguna curhat atau hanya ingin ditemani, jangan langsung memberi kuliah. Tanyakan dengan lembut apa yang sedang dirasakan, lalu beri dukungan sesuai konteks.",
    "Jika pengguna bertanya informasi TB, jelaskan dengan bahasa sederhana, ringkas, dan aman.",
    "Jaga konteks dari riwayat percakapan. Jangan mengulang jawaban yang sama bila pengguna bertanya lanjutan.",
    "Hindari gaya robotik, daftar terlalu panjang, frasa berulang, dan jawaban generik. Boleh menggunakan bahasa sehari-hari yang sopan dan hangat.",
    "Maksimal 2-4 paragraf pendek. Untuk jawaban sederhana, 1-2 paragraf cukup.",
    "Jangan memberi diagnosis, jangan menyuruh pasien menghentikan obat, jangan mengganti dosis, dan arahkan ke perawat/dokter untuk keluhan berat.",
    "Keluhan berat termasuk sesak, mata/kulit kuning, muntah terus, pingsan, ruam luas, nyeri dada, batuk darah banyak, atau lemas berat."
  ].join(" ");
}

function patientContext(patient) {
  return "Konteks pasien: " + (patient?.name || "Pasien ASET-TB") + ", fase " + (patient?.phase || "pengobatan TB") + ", hari terapi " + (patient?.treatmentDay || "-") + ". Gunakan hanya sebagai konteks, jangan mengarang data medis lain.";
}

function buildGeminiContents({ message, history = [], patient }) {
  const contents = [
    { role: "user", parts: [{ text: patientContext(patient) }] },
    { role: "model", parts: [{ text: "Baik, saya akan menjawab dengan hangat, singkat, dan tetap aman secara kesehatan." }] }
  ];

  for (const item of history.slice(-8)) {
    const text = String(item.message || "").trim();
    if (!text) continue;
    contents.push({
      role: item.sender === "assistant" ? "model" : "user",
      parts: [{ text }]
    });
  }

  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

function openAiInput({ message, history = [], patient }) {
  const conversation = history.slice(-8).map(item => ({
    role: item.sender === "assistant" ? "assistant" : "user",
    content: [{ type: item.sender === "assistant" ? "output_text" : "input_text", text: String(item.message || "") }]
  }));
  return [
    { role: "developer", content: [{ type: "input_text", text: tbSystemPrompt() + " " + patientContext(patient) }] },
    ...conversation,
    { role: "user", content: [{ type: "input_text", text: message }] }
  ];
}

function extractGeminiText(payload) {
  const parts = [];
  for (const candidate of payload.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.text) parts.push(part.text);
    }
  }
  return parts.join("\n").trim();
}

function extractOpenAiText(payload) {
  if (payload.output_text) return payload.output_text;
  const parts = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function classifyTopic(message) {
  const text = normalizeText(message);
  if (isGreeting(text)) return "greeting";
  if (isThanks(text) || isConfused(text)) return "conversation";
  if (text.includes("lupa") || text.includes("telat")) return "missed_dose";
  if (text.includes("mual") || text.includes("efek") || text.includes("pusing") || text.includes("ruam")) return "side_effect";
  if (isMoodSharing(text) || text.includes("semangat") || text.includes("motivasi")) return "motivation";
  if (text.includes("teratur") || text.includes("obat") || text.includes("tb") || text.includes("tbc")) return "adherence";
  return "conversation";
}

async function askGeminiAssistant({ apiKey, model, message, history = [], patient }) {
  if (isPlaceholderKey(apiKey)) return null;
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model || "gemini-2.0-flash") + ":generateContent";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: tbSystemPrompt() }] },
      contents: buildGeminiContents({ message, history, patient }),
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: 420
      }
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || "Gemini API error " + response.status);
  return {
    topic: classifyTopic(message),
    message: extractGeminiText(payload) || localSafetyAnswer(message, { history, patient }).message,
    provider: "gemini"
  };
}

async function askOpenAiAssistant({ apiKey, model, message, history = [], patient }) {
  if (isPlaceholderKey(apiKey)) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify({ model, input: openAiInput({ message, history, patient }), max_output_tokens: 420 })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || "OpenAI API error " + response.status);
  return {
    topic: classifyTopic(message),
    message: extractOpenAiText(payload) || localSafetyAnswer(message, { history, patient }).message,
    provider: "openai"
  };
}

async function askTbAssistant({ apiKey, model, geminiApiKey, geminiModel, message, history = [], patient }) {
  let aiError = null;
  try {
    const geminiAnswer = await askGeminiAssistant({ apiKey: geminiApiKey, model: geminiModel, message, history, patient });
    if (geminiAnswer) return geminiAnswer;
  } catch (error) {
    aiError = error;
    console.warn("Gemini API fallback:", error.message);
  }

  try {
    const openAiAnswer = await askOpenAiAssistant({ apiKey, model, message, history, patient });
    if (openAiAnswer) return openAiAnswer;
  } catch (error) {
    console.warn("OpenAI API fallback:", error.message);
  }

  const fallback = localSafetyAnswer(message, { history, patient });
  return { ...fallback, provider: "local-fallback" };
}

module.exports = { askTbAssistant, localSafetyAnswer };
