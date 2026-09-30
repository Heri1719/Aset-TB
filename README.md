# ASET-TB

Web-mobile ASET-TB dengan frontend HTML/Tailwind, backend Node.js, autentikasi Google OAuth, chatbot AI, dan database PostgreSQL.

## Setup

1. Install dependency Node:

   ```bash
   npm install
   ```

2. Buat database PostgreSQL:

   ```bash
   createdb aset_tb
   ```

3. Salin konfigurasi environment:

   ```bash
   cp .env.example .env
   ```

4. Isi `.env`:

   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `GEMINI_API_KEY`

5. Jalankan migrasi dan seed data:

   ```bash
   npm run db:migrate
   ```

6. Jalankan aplikasi:

   ```bash
   npm start
   ```

## URL

- Landing: `http://127.0.0.1:3000/`
- Dashboard pasien: `http://127.0.0.1:3000/dashboard`
- Jadwal obat: `http://127.0.0.1:3000/schedule`
- Chatbot: `http://127.0.0.1:3000/chatbot`
- Dashboard perawat: `http://127.0.0.1:3000/nurse`

## Google OAuth

Di Google Cloud Console, tambahkan redirect URI:

```text
http://127.0.0.1:3000/api/auth/google/callback
```

Pasien akan otomatis dihubungkan ke data pasien jika email Google sama dengan `patients.google_email`.

## Chatbot AI

Chatbot memanggil Gemini API dari backend menggunakan `GEMINI_API_KEY`. Browser hanya memanggil endpoint lokal `/api/chat`, sehingga API key tidak terekspos ke frontend.

- Model primer: `GEMINI_MODEL_PRIMARY` (default `gemini-2.5-flash-lite`)
- Model fallback: `GEMINI_MODEL_FALLBACK` (default `gemini-3.1-flash-lite`), dipakai bila model primer error, timeout (`GEMINI_TIMEOUT_MS`), atau tidak mengembalikan teks.
- Bila kedua model Gemini gagal, chatbot mencoba OpenAI (`OPENAI_API_KEY`, opsional), lalu jawaban lokal.

Model yang aktif di server bisa dicek lewat `GET /api/config/status` (field `geminiModels`). Respons `POST /api/chat` menyertakan `provider` dan `model` yang menjawab.
