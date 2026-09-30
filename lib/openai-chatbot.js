const DEFAULT_GEMINI_PRIMARY_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";

function pickVariant(message, variants) {
  const seed = Array.from(String(message || "")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[seed % variants.length];
}

function normalizeText(message) {
  return String(message || "").toLowerCase().trim();
}

const ENGLISH_WORDS = /\b(i|i'm|my|me|you|your|the|a|an|is|are|am|was|what|how|why|when|can|could|should|would|do|does|did|if|and|to|of|for|with|about|it|this|that|please|thanks|thank|hello|hi|hey|give|take|taking|tell|help|feel|feeling|need|want|today|medicine|medication|pills?|doses?|side|effects?)\b/g;
const INDONESIAN_WORDS = /\b(saya|aku|kamu|anda|apa|bagaimana|gimana|kenapa|mengapa|kapan|bisa|harus|yang|dan|di|ke|ini|itu|tidak|nggak|gak|obat|minum|sudah|belum|tolong|terima|kasih|makasih|halo|hai|dengan|untuk|ada|mau|lagi|ya|beri|berikan|jelaskan|hari|efek|samping|merasa|perlu|boleh)\b/g;
const ENGLISH_MISSED_DOSE = /\b(forgot|forget|forgotten|missed|skipped)\b|\b(miss|missing|skip|late)\b[^.?!]{0,25}\b(doses?|pills?|medicines?|medications?)\b/;
const ENGLISH_SIDE_EFFECT = /\b(side effects?|nausea|nauseous|dizzy|dizziness|rash|itchy?|itching|vomit|vomiting)\b/;
const ENGLISH_MOTIVATION = /\b(motivation|motivate|motivated|encourage|encouragement|give up)\b/;
const ENGLISH_ADHERENCE = /\b(why|every day|daily|regularly|information|medicines?|medications?|pills?|tuberculosis)\b/;

function normalizeLanguage(language) {
  return language === "en" ? "en" : "id";
}

// Returns "en" / "id" when the message clearly leans one way, otherwise null.
function guessMessageLanguage(message) {
  const text = normalizeText(message);
  const english = (text.match(ENGLISH_WORDS) || []).length;
  const indonesian = (text.match(INDONESIAN_WORDS) || []).length;
  if (english === indonesian) return null;
  return english > indonesian ? "en" : "id";
}

function detectMessageLanguage(message, fallbackLanguage) {
  return guessMessageLanguage(message) || normalizeLanguage(fallbackLanguage);
}

function languageName(language) {
  return language === "en" ? "English" : "Indonesian (Bahasa Indonesia)";
}

function isGreeting(text) {
  // Time-of-day words only greet at the start ("pagi kak") or after "selamat"; "lupa minum obat tadi pagi" is not a greeting.
  return /\b(halo|hai|hello|hi|hey|selamat (pagi|siang|sore|malam)|good morning|good afternoon|good evening|apa kabar|gimana kabar|bagaimana kabar|kabar kamu|lagi apa|how are you)\b/i.test(text)
    || /^(pagi|siang|sore|malam)\b/i.test(text);
}

function isThanks(text) {
  return /\b(terima kasih|makasih|thanks|thank you|sip|oke|ok)\b/i.test(text);
}

function isConfused(text) {
  return /\b(tidak nyambung|nggak nyambung|ga nyambung|bingung|maksudnya|apa maksud|kurang paham|confused|don't understand|do not understand|what do you mean)\b/i.test(text);
}

function isMoodSharing(text) {
  return /\b(sedih|capek|lelah|bosan|jenuh|takut|cemas|khawatir|malas|putus asa|berat|curhat|cerita|temani|sendiri|kesepian|sad|tired|exhausted|bored|scared|afraid|worried|anxious|lonely|hopeless|stressed|depressed)\b/i.test(text);
}

function wantsOpenConversation(text) {
  return /\b(aku cuma mau cerita|saya cuma mau cerita|mau cerita|ingin cerita|boleh curhat|mau curhat|temani saya|dengarkan saya|just want to talk|want to talk|can i vent|keep me company|listen to me)\b/i.test(text);
}

function lastAssistantMessage(history = []) {
  return [...history].reverse().find(item => item.sender === "assistant")?.message || "";
}

function localSafetyAnswer(message, context = {}) {
  const text = normalizeText(message);
  const history = context.history || [];
  const en = detectMessageLanguage(message, context.language) === "en";
  const say = (indonesian, english) => (en ? english : indonesian);

  if (isThanks(text)) {
    return {
      topic: "conversation",
      message: pickVariant(message, say([
        "Sama-sama. Saya senang bisa menemani. Kalau nanti ada yang terasa membingungkan tentang jadwal, obat, atau keluhan ringan, tulis saja pelan-pelan ya.",
        "Dengan senang hati. Semoga hari ini sedikit lebih ringan. Kita bisa lanjut kapan pun Anda butuh teman untuk memahami jadwal atau menjaga semangat.",
        "Sama-sama. Terima kasih juga sudah tetap berusaha menjalani proses ini. Kalau ada yang ingin ditanyakan lagi, saya siap bantu."
      ], [
        "You're welcome. I'm glad I could keep you company. If anything about your schedule, medication, or mild symptoms feels confusing later, just write it here, one step at a time.",
        "My pleasure. I hope today feels a little lighter. We can pick this up whenever you need help understanding your schedule or keeping your spirits up.",
        "You're welcome. And thank you for sticking with your treatment. If there's anything else you'd like to ask, I'm here to help."
      ]))
    };
  }

  if (isConfused(text)) {
    const previous = lastAssistantMessage(history);
    return {
      topic: "conversation",
      message: previous
        ? say(
          "Maaf kalau jawaban saya tadi kurang pas. Saya coba luruskan: maksud saya, kita fokus dulu pada hal yang Anda tanyakan sekarang. Bisa tuliskan bagian mana yang ingin diperjelas, misalnya jadwal obat, efek samping, atau cara menjaga motivasi?",
          "Sorry if my last answer missed the point. Let's focus on what you're asking right now. Which part would you like me to explain more clearly: your medication schedule, side effects, or how to stay motivated?"
        )
        : say(
          "Maaf kalau terasa membingungkan. Coba tuliskan pertanyaan Anda dengan satu kalimat sederhana, misalnya: 'obat saya telat diminum, bagaimana?' atau 'saya bosan minum obat, bantu semangati'. Saya akan jawab lebih langsung.",
          "Sorry if that was confusing. Try writing your question in one simple sentence, for example: 'I took my medicine late, what should I do?' or 'I'm tired of taking pills, cheer me up'. I'll answer more directly."
        )
    };
  }

  if (isGreeting(text)) {
    return {
      topic: "greeting",
      message: pickVariant(message, say([
        "Saya baik, terima kasih sudah menyapa. Bagaimana kabar Anda hari ini? Kalau ada yang terasa berat soal pengobatan, kita bahas satu per satu.",
        "Halo, saya di sini. Hari ini rasanya bagaimana? Ceritakan sedikit saja; saya akan bantu dengan jawaban yang sederhana dan aman.",
        "Hai, senang Anda mampir. Mau ngobrol ringan dulu atau langsung bahas jadwal obat, efek samping, atau motivasi hari ini?",
        "Kabar saya baik. Yang penting, bagaimana kabar Anda? Kalau sedang lelah menjalani pengobatan, kita bisa mulai dari langkah kecil dulu."
      ], [
        "I'm doing well, thanks for saying hello. How are you today? If anything about your treatment feels heavy, we can go through it one thing at a time.",
        "Hi, I'm here. How are you feeling today? Share as much or as little as you like; I'll keep my answers simple and safe.",
        "Hi, glad you stopped by. Would you like a light chat first, or shall we talk about your medication schedule, side effects, or today's motivation?",
        "I'm fine, thank you. More importantly, how are you? If the treatment is wearing you out, we can start with one small step."
      ]))
    };
  }

  if (wantsOpenConversation(text)) {
    return {
      topic: "conversation",
      message: pickVariant(message, say([
        "Boleh, saya dengarkan. Ceritakan pelan-pelan saja, tidak harus rapi. Apa yang paling terasa mengganggu atau memenuhi pikiran Anda hari ini?",
        "Tentu boleh. Kadang yang dibutuhkan memang bukan jawaban panjang, tapi tempat untuk mulai bercerita. Saya di sini; apa yang sedang Anda rasakan?",
        "Silakan cerita. Saya akan menemani dengan tenang. Mulai dari bagian mana pun yang paling mudah untuk Anda tuliskan."
      ], [
        "Of course, I'm listening. Take your time; it doesn't have to come out neatly. What's weighing on you most today?",
        "Sure. Sometimes what helps isn't a long answer but a place to start talking. I'm here; what are you feeling right now?",
        "Go ahead, I'm here with you. Start with whichever part is easiest for you to write."
      ]))
    };
  }

  if (text.includes("lupa") || text.includes("telat") || ENGLISH_MISSED_DOSE.test(text)) {
    return {
      topic: "missed_dose",
      message: say(
        "Kalau lupa minum obat, biasanya obat diminum segera saat ingat bila belum terlalu dekat dengan jadwal berikutnya. Jangan menggandakan dosis. Catat kejadian ini, lalu beri tahu perawat bila sering terulang atau Anda ragu dengan jadwalnya.",
        "If you forget a dose, you can usually take it as soon as you remember, unless your next dose is already close. Don't take a double dose. Make a note of it, and tell your nurse if it keeps happening or if you're unsure about your schedule."
      )
    };
  }

  if (text.includes("mual") || text.includes("efek") || text.includes("pusing") || text.includes("ruam") || text.includes("gatal") || ENGLISH_SIDE_EFFECT.test(text)) {
    return {
      topic: "side_effect",
      message: say(
        "Keluhan ringan seperti mual atau pusing bisa terjadi pada sebagian pasien, tetapi tetap perlu dipantau. Minum air cukup dan ikuti anjuran makan/minum obat dari perawat. Segera hubungi fasilitas kesehatan bila muncul mata atau kulit kuning, muntah berat, ruam luas, sesak, nyeri dada, batuk darah banyak, atau lemas berat.",
        "Mild complaints like nausea or dizziness can happen for some patients, but they still need to be watched. Drink enough water and follow your nurse's advice about taking the medicine with or without food. Contact a health facility right away if you notice yellow eyes or skin, heavy vomiting, a widespread rash, shortness of breath, chest pain, coughing up a lot of blood, or severe weakness."
      )
    };
  }

  if (isMoodSharing(text) || text.includes("semangat") || text.includes("motivasi") || ENGLISH_MOTIVATION.test(text)) {
    return {
      topic: "motivation",
      message: pickVariant(message, say([
        "Saya paham, pengobatan TB bisa terasa panjang dan melelahkan. Untuk hari ini, jangan pikirkan semuanya sekaligus. Cukup fokus pada jadwal obat terdekat, lalu akui bahwa itu sudah sebuah kemajuan.",
        "Rasa bosan atau lelah itu manusiawi. Yang penting, jangan biarkan perasaan hari ini mengambil alih keputusan besar. Ambil satu langkah kecil: siapkan obat, minum sesuai jadwal, lalu konfirmasi.",
        "Kalau semangat sedang turun, gunakan rencana sebagai pegangan. Jadwal obat membantu Anda tetap bergerak meski motivasi belum penuh. Anda boleh pelan, asal tidak berhenti tanpa bicara dengan perawat/dokter.",
        "Hari ini tidak harus sempurna. Satu dosis yang berhasil diminum tetap berarti. Itu tanda Anda masih menjaga diri dan memberi tubuh kesempatan untuk pulih."
      ], [
        "I understand; TB treatment can feel long and tiring. For today, don't think about everything at once. Just focus on your next dose, and count getting it done as real progress.",
        "Feeling bored or tired is human. What matters is not letting today's feelings make big decisions for you. Take one small step: get your medicine ready, take it on schedule, then confirm it.",
        "When your motivation dips, let your plan carry you. Your medication schedule keeps you moving even when motivation isn't full. It's fine to go slowly, as long as you don't stop without talking to your nurse or doctor.",
        "Today doesn't have to be perfect. Every dose you manage to take still counts. It shows you're still looking after yourself and giving your body a chance to heal."
      ]))
    };
  }

  if (text.includes("kenapa") || text.includes("setiap hari") || text.includes("teratur") || text.includes("informasi") || text.includes("tb") || text.includes("tbc") || text.includes("obat") || ENGLISH_ADHERENCE.test(text)) {
    return {
      topic: "adherence",
      message: say(
        "Obat TB perlu diminum teratur agar kuman TB benar-benar ditekan dan risiko kebal obat berkurang. Karena pengobatan berjalan cukup lama, jadwal harian dan konfirmasi minum obat membantu Anda dan perawat melihat apakah terapi berjalan konsisten.",
        "TB medicine needs to be taken regularly so the TB bacteria are fully suppressed and the risk of drug resistance goes down. Because treatment lasts quite a while, a daily schedule and confirming each dose help you and your nurse see whether the therapy is on track."
      )
    };
  }

  return {
    topic: "conversation",
    message: say(
      "Saya menangkap pesan Anda, tapi saya belum yakin bagian mana yang ingin dibantu. Coba pilih salah satu: ingin motivasi, bertanya soal jadwal obat, efek samping, atau informasi TB? Tulis dengan bebas, saya akan bantu jawab lebih tepat.",
      "I got your message, but I'm not sure yet which part you'd like help with. Would you like some motivation, or do you have a question about your medication schedule, side effects, or TB in general? Write freely and I'll answer more precisely."
    )
  };
}

function isPlaceholderKey(apiKey) {
  return !apiKey || apiKey.includes("your-") || apiKey.includes("YOUR_") || apiKey === "sk-your-openai-key";
}

// Gemini tends to keep the language of the conversation history, so the reply language is stated explicitly
// whenever the latest message clearly is English or Indonesian; only ambiguous messages ("ok") follow the app language.
function languageRule(message, language) {
  const messageLanguage = guessMessageLanguage(message);
  if (messageLanguage) {
    return `LANGUAGE RULE: The patient's latest message is in ${languageName(messageLanguage)}. Reply entirely in ${languageName(messageLanguage)}, even if earlier messages in the conversation used another language.`;
  }
  return `LANGUAGE RULE: Reply entirely in the language of the patient's latest message, even if earlier messages used another language. If the latest message is too short or ambiguous to tell (for example "ok", "hmm", "?"), reply in the patient's app language: ${languageName(normalizeLanguage(language))}.`;
}

// Written in English on purpose: an Indonesian prompt made Gemini answer in Indonesian even when the
// patient wrote in English or had the app set to English. languageRule() decides the reply language.
function tbSystemPrompt({ language, patient, message } = {}) {
  return [
    "You are the ASET-TB Assistant, a conversational companion for tuberculosis (TB) patients in Indonesia.",
    "Your job is not only education but also keeping patients company in a natural, empathetic, human way. Replies should feel like a short conversation, not a health brochure.",
    "Respond to what the patient actually means. If they only greet you or ask how you are, reply lightly and warmly; do not force TB education.",
    "If they want to vent or just want company, do not lecture. Gently ask how they feel, then offer support that fits the context.",
    "If they ask for TB information, explain it simply, briefly, and safely.",
    "Answer the patient's actual question directly in your first sentence. Keep context from the conversation history, but do not repeat explanations you already gave; add something new or clarify what was asked. You do not need to open with an empathy line or end with a question every time.",
    "Avoid a robotic style, long lists, repeated phrases, and generic answers. Everyday language is fine as long as it stays polite and warm.",
    "At most 2-4 short paragraphs. For simple answers, 1-2 paragraphs are enough.",
    "Do not diagnose, never tell the patient to stop their medication or change the dose, and refer them to their nurse or doctor for serious complaints.",
    "Serious complaints include shortness of breath, yellow eyes or skin, persistent vomiting, fainting, a widespread rash, chest pain, coughing up a lot of blood, or severe weakness.",
    patientContext(patient),
    languageRule(message, language)
  ].join(" ");
}

function patientContext(patient) {
  return "Patient context: " + (patient?.name || "ASET-TB patient") + ", treatment phase " + (patient?.phase || "TB treatment") + ", treatment day " + (patient?.treatmentDay || "-") + ". Use it only as background; do not invent other medical data, and do not mention the phase or treatment day unless it is relevant to the question.";
}

function buildGeminiContents({ message, history = [] }) {
  const contents = [];

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

function openAiInput({ message, history = [], patient, language }) {
  const conversation = history.slice(-8).map(item => ({
    role: item.sender === "assistant" ? "assistant" : "user",
    content: [{ type: item.sender === "assistant" ? "output_text" : "input_text", text: String(item.message || "") }]
  }));
  return [
    { role: "developer", content: [{ type: "input_text", text: tbSystemPrompt({ language, patient, message }) }] },
    ...conversation,
    { role: "user", content: [{ type: "input_text", text: message }] }
  ];
}

function extractGeminiText(payload) {
  const parts = [];
  for (const candidate of payload.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.text && !part.thought) parts.push(part.text);
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
  if (text.includes("lupa") || text.includes("telat") || ENGLISH_MISSED_DOSE.test(text)) return "missed_dose";
  if (text.includes("mual") || text.includes("efek") || text.includes("pusing") || text.includes("ruam") || ENGLISH_SIDE_EFFECT.test(text)) return "side_effect";
  if (isMoodSharing(text) || text.includes("semangat") || text.includes("motivasi") || ENGLISH_MOTIVATION.test(text)) return "motivation";
  if (text.includes("teratur") || text.includes("obat") || text.includes("tb") || text.includes("tbc") || ENGLISH_ADHERENCE.test(text)) return "adherence";
  return "conversation";
}

async function askGeminiAssistant({ apiKey, model, message, history = [], patient, language, generationConfig = {}, timeoutMs = 15000 }) {
  if (isPlaceholderKey(apiKey)) return null;
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model || DEFAULT_GEMINI_PRIMARY_MODEL) + ":generateContent";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: tbSystemPrompt({ language, patient, message }) }] },
      contents: buildGeminiContents({ message, history }),
      generationConfig: {
        temperature: generationConfig.temperature ?? 0.2,
        topP: generationConfig.topP ?? 0.9,
        maxOutputTokens: generationConfig.maxOutputTokens ?? 250
      }
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || "Gemini API error " + response.status);
  const text = extractGeminiText(payload);
  if (!text) {
    const reason = payload.promptFeedback?.blockReason || payload.candidates?.[0]?.finishReason || "EMPTY";
    throw new Error("Gemini returned no text (" + reason + ")");
  }
  return {
    topic: classifyTopic(message),
    message: text,
    provider: "gemini",
    model: model || DEFAULT_GEMINI_PRIMARY_MODEL
  };
}

async function askOpenAiAssistant({ apiKey, model, message, history = [], patient, language }) {
  if (isPlaceholderKey(apiKey)) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify({ model, input: openAiInput({ message, history, patient, language }), max_output_tokens: 420 })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || "OpenAI API error " + response.status);
  return {
    topic: classifyTopic(message),
    message: extractOpenAiText(payload) || localSafetyAnswer(message, { history, patient, language }).message,
    provider: "openai"
  };
}

async function askTbAssistant({
  apiKey,
  model,
  geminiApiKey,
  geminiPrimaryModel,
  geminiFallbackModel,
  geminiTemperature = 0.2,
  geminiTopP = 0.9,
  geminiMaxOutputTokens = 250,
  geminiTimeoutMs = 15000,
  language,
  message,
  history = [],
  patient
}) {
  const geminiModels = [...new Set([
    geminiPrimaryModel || DEFAULT_GEMINI_PRIMARY_MODEL,
    geminiFallbackModel || DEFAULT_GEMINI_FALLBACK_MODEL
  ])];
  for (const geminiCandidate of geminiModels) {
    try {
      const geminiAnswer = await askGeminiAssistant({
        apiKey: geminiApiKey,
        model: geminiCandidate,
        message,
        history,
        patient,
        language,
        generationConfig: { temperature: geminiTemperature, topP: geminiTopP, maxOutputTokens: geminiMaxOutputTokens },
        timeoutMs: geminiTimeoutMs
      });
      if (!geminiAnswer) break;
      return geminiAnswer;
    } catch (error) {
      console.warn(`Gemini API fallback (${geminiCandidate}):`, error.message);
    }
  }

  try {
    const openAiAnswer = await askOpenAiAssistant({ apiKey, model, message, history, patient, language });
    if (openAiAnswer) return openAiAnswer;
  } catch (error) {
    console.warn("OpenAI API fallback:", error.message);
  }

  const fallback = localSafetyAnswer(message, { history, patient, language });
  return { ...fallback, provider: "local-fallback" };
}

module.exports = { askTbAssistant, localSafetyAnswer, DEFAULT_GEMINI_PRIMARY_MODEL, DEFAULT_GEMINI_FALLBACK_MODEL };
