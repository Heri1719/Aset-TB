# PRD: Project Requirements Document

# ASET-TB

**Aplikasi Web-Mobile Berbasis AI untuk Peningkatan Kepatuhan Minum Obat dan Self-Efficacy Pasien Tuberkulosis**

---

## 1. Overview

### 1.1 Ringkasan Aplikasi

ASET-TB adalah aplikasi web-mobile berbasis Artificial Intelligence yang dikembangkan untuk membantu pasien tuberkulosis meningkatkan kepatuhan minum obat dan self-efficacy selama menjalani pengobatan. Aplikasi ini menyediakan fitur reminder obat, edukasi TB, chatbot AI, motivasi harian, monitoring kepatuhan, serta dashboard perawat sebagai admin untuk mengatur jadwal minum obat dan memantau perkembangan pasien.

Pasien dapat mengakses aplikasi menggunakan akun Google sehingga proses login menjadi lebih mudah, cepat, dan aman. Perawat sebagai admin bertugas mengelola data pasien, menghubungkan akun Google pasien dengan data pasien, mengatur jadwal minum obat, memantau kepatuhan, serta melihat hasil penilaian kepatuhan dan self-efficacy.

### 1.2 Latar Belakang Masalah

Kepatuhan minum obat merupakan salah satu faktor penting dalam keberhasilan terapi tuberkulosis. Pengobatan TB membutuhkan waktu yang panjang dan konsistensi tinggi. Pasien sering mengalami hambatan seperti lupa minum obat, kejenuhan, kurang motivasi, efek samping obat, keterbatasan pemahaman tentang penyakit, dan rendahnya keyakinan diri dalam menyelesaikan pengobatan.

Ketidakpatuhan minum obat dapat berdampak pada kegagalan terapi, kekambuhan, penularan berkelanjutan, hingga risiko resistensi obat. Oleh karena itu, dibutuhkan intervensi digital yang tidak hanya berfungsi sebagai pengingat, tetapi juga mampu memberikan edukasi, motivasi, pemantauan, serta dukungan berbasis AI yang dapat diakses pasien secara mudah.

ASET-TB dirancang sebagai sistem pendukung intervensi keperawatan digital yang membantu pasien menjalani terapi TB secara lebih terarah dan terpantau. Aplikasi ini juga membantu perawat melakukan monitoring kepatuhan pasien secara lebih sistematis melalui dashboard admin.

### 1.3 Tujuan Aplikasi

Tujuan utama aplikasi ASET-TB adalah:

1. Membantu pasien TB mengingat jadwal minum obat secara teratur.
2. Meningkatkan pengetahuan pasien tentang TB melalui edukasi digital.
3. Meningkatkan motivasi pasien dalam menjalani pengobatan TB.
4. Meningkatkan self-efficacy pasien dalam menyelesaikan terapi TB.
5. Menyediakan chatbot AI sebagai pendamping edukasi dan konsultasi dasar.
6. Membantu perawat mengatur jadwal minum obat pasien.
7. Membantu perawat memantau kepatuhan pasien secara digital.
8. Menghasilkan data penilaian kepatuhan dan self-efficacy pasien.
9. Mendukung proses evaluasi intervensi keperawatan berbasis teknologi.

### 1.4 Target Pengguna

#### Pasien Tuberkulosis

Pasien yang sedang menjalani pengobatan TB dan membutuhkan bantuan dalam mengingat jadwal obat, memperoleh edukasi, mendapatkan motivasi, berinteraksi dengan chatbot AI, serta memantau perkembangan kepatuhan dan self-efficacy dirinya.

#### Perawat sebagai Admin

Perawat yang bertugas mengelola data pasien, mengatur jadwal minum obat, memantau riwayat kepatuhan, melihat hasil penilaian kepatuhan dan self-efficacy, serta melakukan pendampingan berdasarkan data yang tersedia pada dashboard.

### 1.5 Nilai Manfaat Aplikasi

1. Bagi pasien, aplikasi membantu meningkatkan kedisiplinan, pemahaman, motivasi, dan keyakinan diri dalam menjalani pengobatan TB.
2. Bagi perawat, aplikasi memudahkan proses pemantauan kepatuhan pasien secara lebih cepat, terstruktur, dan terdokumentasi.
3. Bagi institusi layanan kesehatan, aplikasi mendukung digitalisasi pemantauan pengobatan TB.
4. Bagi pengembangan intervensi keperawatan, aplikasi dapat menjadi media inovatif dalam pemberian edukasi, reminder, dan monitoring pasien.
5. Bagi penelitian, aplikasi dapat menghasilkan data kepatuhan, self-efficacy, jadwal obat, dan interaksi chatbot yang dapat dianalisis untuk evaluasi efektivitas intervensi.

---

## 2. Requirements

### 2.1 Functional Requirements

#### A. Kebutuhan Fungsional untuk Pasien

1. Pasien dapat login menggunakan akun Google.
2. Sistem dapat memverifikasi akun Google pasien.
3. Pasien dapat melengkapi profil dasar setelah login pertama.
4. Pasien dapat terhubung dengan data pasien yang sudah dibuat oleh perawat/admin.
5. Pasien dapat melihat jadwal minum obat harian.
6. Pasien dapat menerima notifikasi reminder minum obat sesuai jadwal.
7. Pasien dapat melakukan konfirmasi setelah minum obat.
8. Pasien dapat melihat status minum obat: tepat waktu, terlambat, atau belum konfirmasi.
9. Pasien dapat melihat riwayat kepatuhan minum obat.
10. Pasien dapat mengakses materi edukasi tentang TB.
11. Pasien dapat berinteraksi dengan chatbot AI.
12. Pasien dapat menerima pesan motivasi harian.
13. Pasien dapat mengisi penilaian kepatuhan.
14. Pasien dapat mengisi penilaian self-efficacy.
15. Pasien dapat melihat ringkasan perkembangan kepatuhan dan self-efficacy dirinya.

#### B. Kebutuhan Fungsional untuk Perawat sebagai Admin

1. Perawat dapat login ke dashboard admin.
2. Perawat dapat menambahkan data pasien.
3. Perawat dapat mengedit data pasien.
4. Perawat dapat menghapus atau menonaktifkan data pasien.
5. Perawat dapat menghubungkan akun Google pasien dengan data pasien di sistem.
6. Perawat dapat membuat dan mengatur jadwal minum obat pasien.
7. Perawat dapat mengubah jadwal minum obat pasien.
8. Perawat dapat melihat status kepatuhan pasien.
9. Perawat dapat melihat riwayat konfirmasi minum obat pasien.
10. Perawat dapat melihat pasien yang belum melakukan konfirmasi minum obat.
11. Perawat dapat melihat hasil penilaian kepatuhan pasien.
12. Perawat dapat melihat hasil penilaian self-efficacy pasien.
13. Perawat dapat melihat rekap data pasien berdasarkan kategori kepatuhan.
14. Perawat dapat mengelola materi edukasi TB.
15. Perawat dapat mengelola pesan motivasi.
16. Perawat dapat melihat riwayat percakapan chatbot jika diperlukan untuk monitoring.
17. Perawat dapat mengunduh laporan kepatuhan dan self-efficacy pasien.

#### C. Kebutuhan Fungsional AI

1. Chatbot AI dapat menjawab pertanyaan pasien seputar TB, pengobatan, kepatuhan minum obat, efek samping umum, pencegahan penularan, dan motivasi menjalani terapi.
2. Chatbot AI memberikan jawaban edukatif dengan bahasa yang sederhana dan mudah dipahami pasien.
3. Chatbot AI memberikan dukungan motivasional untuk meningkatkan self-efficacy pasien.
4. Chatbot AI tidak memberikan diagnosis medis.
5. Chatbot AI tidak menyarankan pasien menghentikan obat tanpa arahan tenaga kesehatan.
6. Chatbot AI dapat memberikan arahan kepada pasien untuk menghubungi perawat atau fasilitas kesehatan apabila pasien menyampaikan keluhan berat.
7. Sistem AI dapat membantu memberi tanda risiko ketidakpatuhan berdasarkan riwayat konfirmasi obat dan interaksi pasien.
8. Sistem dapat mengelompokkan topik percakapan chatbot, seperti edukasi TB, keluhan obat, lupa obat, motivasi, dan pertanyaan umum.

### 2.2 Non-Functional Requirements

1. Aplikasi harus dapat diakses melalui browser pada smartphone, tablet, dan laptop.
2. Tampilan aplikasi harus responsif pada berbagai ukuran layar.
3. Tampilan pasien harus sederhana, jelas, dan mudah digunakan.
4. Dashboard perawat harus informatif dan mudah dibaca.
5. Sistem harus menggunakan autentikasi Google untuk pasien.
6. Sistem harus menggunakan autentikasi aman untuk perawat/admin.
7. Sistem harus membedakan hak akses pasien dan perawat.
8. Data pasien harus tersimpan secara aman.
9. Password perawat/admin harus disimpan dalam bentuk hash.
10. Data kepatuhan harus tercatat otomatis setelah pasien melakukan konfirmasi minum obat.
11. Notifikasi harus dikirim sesuai jadwal yang telah diatur.
12. Sistem harus menyimpan timestamp pada aktivitas penting.
13. Sistem harus tetap dapat berjalan pada koneksi internet standar.
14. Sistem harus memiliki backup database berkala.
15. Sistem harus memiliki log aktivitas pengguna untuk kebutuhan audit dan keamanan.

### 2.3 Platform

ASET-TB dikembangkan sebagai aplikasi web-mobile, yaitu aplikasi berbasis web yang responsif dan dapat digunakan melalui perangkat mobile tanpa harus diunduh melalui Play Store atau App Store.

Aplikasi dapat dikembangkan dengan pendekatan Progressive Web App agar pasien dapat menambahkan aplikasi ke layar utama smartphone dan menerima notifikasi lebih mudah.

### 2.4 Role Pengguna

| Role | Hak Akses Utama |
|---|---|
| Pasien | Login dengan akun Google, melihat jadwal obat, menerima reminder, konfirmasi minum obat, akses edukasi, menggunakan chatbot AI, menerima motivasi, mengisi penilaian kepatuhan dan self-efficacy |
| Perawat/Admin | Login dashboard, kelola pasien, verifikasi akun Google pasien, setting jadwal obat, monitoring kepatuhan, kelola edukasi, kelola motivasi, melihat hasil penilaian, unduh laporan |

### 2.5 Authentication Requirement

#### Pasien

Pasien menggunakan Google Sign-In sebagai metode login utama. Setelah pasien login menggunakan akun Google, sistem akan menyimpan identitas dasar berupa nama, email, dan Google user ID. Untuk menjaga validitas data, akun Google pasien harus dihubungkan terlebih dahulu dengan data pasien yang telah dibuat oleh perawat/admin.

#### Perawat/Admin

Perawat sebagai admin dapat login menggunakan akun yang dibuat khusus oleh sistem. Login perawat menggunakan email/username dan password yang terenkripsi. Jika diperlukan, sistem dapat dikembangkan dengan autentikasi dua langkah untuk meningkatkan keamanan dashboard admin.

---

## 3. Core Features

### 3.1 Login dengan Akun Google untuk Pasien

Fitur ini memungkinkan pasien masuk ke aplikasi menggunakan akun Google sehingga pasien tidak perlu membuat username dan password baru.

#### Fungsi utama:

1. Pasien menekan tombol “Login dengan Google”.
2. Sistem membuka proses autentikasi Google.
3. Sistem mengambil data dasar akun Google pasien, seperti nama dan email.
4. Sistem memeriksa apakah email pasien sudah terhubung dengan data pasien di database.
5. Jika sudah terhubung, pasien langsung masuk ke halaman utama.
6. Jika belum terhubung, pasien diarahkan untuk melengkapi profil dasar atau menunggu verifikasi perawat/admin.
7. Perawat/admin dapat menghubungkan email Google pasien dengan data pasien yang sesuai.

#### Manfaat:

1. Memudahkan pasien mengakses aplikasi.
2. Mengurangi risiko pasien lupa password.
3. Meningkatkan keamanan login.
4. Mempercepat proses onboarding pasien.

### 3.2 Reminder Obat

Fitur reminder obat berfungsi untuk mengingatkan pasien agar minum obat sesuai jadwal yang telah ditentukan oleh perawat.

#### Fungsi utama:

1. Menampilkan jadwal minum obat harian.
2. Mengirim notifikasi pada waktu yang ditentukan.
3. Memberikan tombol konfirmasi “Sudah Minum Obat”.
4. Mencatat waktu konfirmasi pasien.
5. Menandai status sebagai “Tepat Waktu”, “Terlambat”, atau “Belum Konfirmasi”.
6. Menampilkan riwayat minum obat pasien.

### 3.3 Edukasi TB

Fitur edukasi berisi materi singkat tentang tuberkulosis yang mudah dipahami pasien. Materi edukasi ditulis dengan bahasa sederhana, ringkas, dan aplikatif.

#### Konten edukasi meliputi:

1. Pengertian tuberkulosis.
2. Cara penularan TB.
3. Gejala umum TB.
4. Pentingnya minum obat teratur.
5. Dampak putus obat.
6. Efek samping obat TB yang umum.
7. Cara menghadapi efek samping ringan.
8. Kapan pasien harus menghubungi tenaga kesehatan.
9. Etika batuk.
10. Pencegahan penularan di rumah.
11. Nutrisi dan istirahat bagi pasien TB.
12. Peran keluarga dalam mendukung pengobatan.

### 3.4 Chatbot AI

Chatbot AI berfungsi sebagai pendamping digital pasien. Chatbot membantu menjawab pertanyaan umum pasien, memberikan edukasi, serta memberikan dukungan motivasi selama pasien menjalani pengobatan TB.

#### Fungsi utama:

1. Menjawab pertanyaan umum tentang TB.
2. Memberikan edukasi tentang pentingnya kepatuhan minum obat.
3. Memberikan motivasi ketika pasien merasa bosan atau lelah menjalani pengobatan.
4. Memberikan arahan umum ketika pasien lupa minum obat.
5. Memberikan informasi dasar tentang efek samping obat.
6. Mengarahkan pasien kepada perawat atau fasilitas kesehatan jika muncul keluhan serius.
7. Menyimpan riwayat percakapan untuk kebutuhan monitoring.

#### Contoh pertanyaan pasien:

1. “Kenapa saya harus minum obat TB setiap hari?”
2. “Apa yang harus dilakukan kalau saya lupa minum obat?”
3. “Apakah batuk saya masih bisa menular?”
4. “Saya bosan minum obat, harus bagaimana?”
5. “Apa makanan yang baik untuk pasien TB?”
6. “Saya merasa mual setelah minum obat, apa yang harus saya lakukan?”

#### Batasan chatbot:

Chatbot tidak menggantikan dokter atau perawat. Jika pasien mengalami keluhan berat seperti sesak napas, muntah terus-menerus, kuning pada mata, reaksi alergi berat, pingsan, atau kondisi darurat lainnya, chatbot harus menyarankan pasien segera menghubungi tenaga kesehatan atau fasilitas layanan kesehatan terdekat.

### 3.5 Monitoring Kepatuhan

Fitur monitoring kepatuhan digunakan untuk mencatat dan menampilkan riwayat minum obat pasien berdasarkan jadwal yang telah ditetapkan.

#### Data yang ditampilkan:

1. Jumlah jadwal obat.
2. Jumlah konfirmasi minum obat.
3. Jumlah konfirmasi tepat waktu.
4. Jumlah konfirmasi terlambat.
5. Jumlah tidak konfirmasi.
6. Persentase kepatuhan.
7. Kategori kepatuhan: tinggi, sedang, rendah.
8. Riwayat harian kepatuhan pasien.

### 3.6 Motivasi Harian

Fitur motivasi memberikan pesan singkat kepada pasien untuk meningkatkan semangat, keyakinan diri, dan konsistensi selama menjalani pengobatan TB.

#### Contoh pesan motivasi:

1. “Setiap obat yang diminum hari ini adalah langkah menuju kesembuhan.”
2. “Tetap semangat, pengobatan TB membutuhkan konsistensi.”
3. “Anda mampu menyelesaikan pengobatan ini dengan baik.”
4. “Minum obat tepat waktu membantu tubuh melawan TB.”
5. “Jangan menyerah, perawat siap mendampingi Anda.”
6. “Kesembuhan dimulai dari kebiasaan kecil yang dilakukan setiap hari.”

### 3.7 Dashboard Perawat

Dashboard digunakan oleh perawat sebagai admin untuk mengelola pasien dan memantau kepatuhan pasien.

#### Fitur dashboard:

1. Ringkasan jumlah pasien aktif.
2. Daftar pasien aktif.
3. Status kepatuhan setiap pasien.
4. Pasien yang belum konfirmasi minum obat.
5. Jadwal minum obat pasien.
6. Pengaturan jadwal minum obat.
7. Hasil penilaian kepatuhan.
8. Hasil penilaian self-efficacy.
9. Riwayat konfirmasi minum obat.
10. Riwayat percakapan chatbot.
11. Manajemen edukasi TB.
12. Manajemen pesan motivasi.
13. Export laporan kepatuhan dan self-efficacy.

### 3.8 Penilaian Kepatuhan dan Self-Efficacy

Fitur ini digunakan untuk mengukur kepatuhan minum obat dan self-efficacy pasien. Penilaian dapat dilakukan pada tahap pretest, posttest, dan follow-up sesuai kebutuhan penelitian atau layanan.

#### Fungsi utama:

1. Pasien mengisi instrumen penilaian secara digital.
2. Sistem menyimpan skor pretest dan posttest.
3. Sistem menampilkan perubahan skor.
4. Sistem mengelompokkan hasil dalam kategori rendah, sedang, dan tinggi.
5. Perawat dapat melihat hasil penilaian setiap pasien.
6. Perawat dapat melihat rekap hasil penilaian seluruh pasien.

#### Output penilaian:

1. Skor kepatuhan.
2. Kategori kepatuhan.
3. Skor self-efficacy.
4. Kategori self-efficacy.
5. Perubahan skor pretest dan posttest.
6. Ringkasan evaluasi pasien.

---

## 4. User Flow

### 4.1 User Flow Pasien

1. Pasien membuka aplikasi ASET-TB melalui browser atau shortcut aplikasi di smartphone.
2. Pasien menekan tombol “Login dengan Google”.
3. Sistem memverifikasi akun Google pasien.
4. Jika pasien pertama kali login, sistem meminta pasien melengkapi profil dasar.
5. Sistem memeriksa apakah email Google pasien sudah terhubung dengan data pasien.
6. Jika akun belum terhubung, pasien menunggu verifikasi atau penghubungan akun oleh perawat/admin.
7. Perawat/admin menghubungkan akun Google pasien dengan data pasien pada dashboard.
8. Setelah akun terhubung, pasien masuk ke halaman utama aplikasi.
9. Pasien melihat jadwal minum obat hari ini.
10. Sistem mengirim notifikasi reminder minum obat sesuai jadwal.
11. Pasien minum obat sesuai jadwal.
12. Pasien menekan tombol “Sudah Minum Obat”.
13. Sistem menyimpan waktu konfirmasi minum obat.
14. Sistem menampilkan status kepatuhan pasien.
15. Pasien dapat membuka materi edukasi TB.
16. Pasien dapat bertanya kepada chatbot AI.
17. Pasien menerima pesan motivasi.
18. Pasien mengisi penilaian kepatuhan dan self-efficacy sesuai jadwal evaluasi.
19. Pasien melihat ringkasan perkembangan kepatuhan dan self-efficacy dirinya.

### 4.2 User Flow Perawat/Admin

1. Perawat membuka halaman dashboard ASET-TB.
2. Perawat login menggunakan akun admin.
3. Perawat masuk ke dashboard utama.
4. Perawat menambahkan data pasien baru.
5. Perawat memasukkan identitas pasien dan data pengobatan.
6. Perawat menghubungkan email Google pasien dengan data pasien.
7. Perawat mengatur jadwal minum obat pasien.
8. Sistem mengaktifkan reminder obat sesuai jadwal.
9. Perawat memantau status kepatuhan pasien.
10. Perawat melihat pasien yang belum melakukan konfirmasi minum obat.
11. Perawat melihat riwayat konfirmasi minum obat pasien.
12. Perawat melihat hasil penilaian kepatuhan dan self-efficacy.
13. Perawat memperbarui materi edukasi TB jika diperlukan.
14. Perawat memperbarui pesan motivasi jika diperlukan.
15. Perawat mengunduh laporan monitoring pasien.

### 4.3 Diagram Alur Pasien

```text
Pasien Membuka Aplikasi
        ↓
Login dengan Akun Google
        ↓
Verifikasi Akun Google
        ↓
Akun Terhubung dengan Data Pasien
        ↓
Masuk ke Halaman Utama
        ↓
Melihat Jadwal Minum Obat
        ↓
Menerima Reminder Obat
        ↓
Konfirmasi Sudah Minum Obat
        ↓
Data Kepatuhan Tersimpan
        ↓
Pasien Mengakses Edukasi / Chatbot / Motivasi
        ↓
Pasien Mengisi Penilaian Kepatuhan dan Self-Efficacy
        ↓
Pasien Melihat Ringkasan Perkembangan
```

### 4.4 Diagram Alur Perawat/Admin

```text
Perawat Login Dashboard
        ↓
Kelola Data Pasien
        ↓
Hubungkan Akun Google Pasien
        ↓
Setting Jadwal Minum Obat
        ↓
Sistem Mengirim Reminder
        ↓
Pasien Konfirmasi Minum Obat
        ↓
Dashboard Perawat Terupdate
        ↓
Perawat Memantau Kepatuhan
        ↓
Perawat Melihat Hasil Penilaian
        ↓
Perawat Mengunduh Laporan
```

---

## 5. Architecture

### 5.1 Gambaran Arsitektur Sistem

ASET-TB menggunakan arsitektur client-server dengan frontend web-mobile, backend API, database, sistem autentikasi Google, sistem notifikasi, dashboard admin, dan layanan AI chatbot.

```text
Pasien / Perawat
        ↓
Frontend Web-Mobile
        ↓
Authentication Layer
        ↓
Backend API
        ↓
Database Server
        ↓
AI Chatbot Service
        ↓
Notification Service
```

### 5.2 Komponen Sistem

| Komponen | Fungsi |
|---|---|
| Frontend Web-Mobile | Menampilkan antarmuka pasien dan dashboard perawat |
| Google Authentication | Memfasilitasi login pasien menggunakan akun Google |
| Admin Authentication | Memfasilitasi login perawat/admin |
| Backend API | Mengatur login, data pasien, jadwal obat, kepatuhan, edukasi, motivasi, penilaian, dan chatbot |
| Database | Menyimpan data pasien, jadwal obat, riwayat kepatuhan, percakapan, dan skor penilaian |
| AI Chatbot Service | Memberikan respons edukasi, motivasi, dan informasi dasar TB |
| Notification Service | Mengirim reminder minum obat dan pesan motivasi |
| Admin Dashboard | Memfasilitasi perawat dalam monitoring dan pengelolaan pasien |
| Reporting Module | Menghasilkan laporan kepatuhan dan self-efficacy |

### 5.3 Rekomendasi Teknologi

| Bagian | Teknologi yang Direkomendasikan |
|---|---|
| Frontend | React.js / Next.js / Vue.js |
| Mobile Responsive | Progressive Web App / Responsive Web Design |
| Backend | Node.js Express / Laravel / Django |
| Database | MySQL / PostgreSQL |
| AI Chatbot | API LLM / NLP model terintegrasi |
| Autentikasi Pasien | Google OAuth 2.0 / Google Sign-In |
| Autentikasi Admin | JWT / Session-based login |
| Notifikasi | Web Push Notification / WhatsApp Gateway / Telegram Bot |
| Export Laporan | PDF / Excel Export Library |
| Hosting | VPS / Cloud Server |

### 5.4 Modul Utama Sistem

1. Modul autentikasi pasien dengan Google.
2. Modul autentikasi perawat/admin.
3. Modul manajemen pasien.
4. Modul penghubung akun Google pasien.
5. Modul jadwal minum obat.
6. Modul reminder obat.
7. Modul konfirmasi kepatuhan.
8. Modul edukasi TB.
9. Modul chatbot AI.
10. Modul pesan motivasi.
11. Modul penilaian kepatuhan.
12. Modul penilaian self-efficacy.
13. Modul laporan dan dashboard perawat.
14. Modul manajemen notifikasi.
15. Modul audit log aktivitas.

### 5.5 Alur Integrasi Google Login

```text
Pasien Klik Login dengan Google
        ↓
Google OAuth Verification
        ↓
Sistem Menerima Google ID, Nama, dan Email
        ↓
Sistem Mengecek Email di Database
        ↓
Jika Terdaftar: Masuk ke Dashboard Pasien
        ↓
Jika Belum Terdaftar: Lengkapi Profil / Tunggu Verifikasi Admin
        ↓
Admin Menghubungkan Email Google dengan Data Pasien
        ↓
Pasien Dapat Menggunakan Aplikasi
```

---

## 6. Database Schema

### 6.1 Tabel Users

Digunakan untuk menyimpan akun pengguna, baik pasien maupun perawat/admin.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| name | varchar | Nama pengguna |
| email | varchar | Email pengguna |
| password | varchar | Password terenkripsi untuk admin; nullable untuk pasien Google login |
| role | enum | pasien / perawat |
| phone | varchar | Nomor telepon |
| google_id | varchar | ID unik dari akun Google pasien |
| auth_provider | enum | google / local |
| email_verified_at | datetime | Waktu verifikasi email |
| status | enum | aktif / tidak aktif / menunggu verifikasi |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.2 Tabel Patients

Digunakan untuk menyimpan data pasien TB.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| user_id | integer | Relasi ke tabel users |
| patient_code | varchar | Kode pasien |
| medical_record_number | varchar | Nomor rekam medis, jika digunakan |
| gender | enum | Laki-laki / perempuan |
| birth_date | date | Tanggal lahir |
| address | text | Alamat pasien |
| diagnosis_date | date | Tanggal diagnosis TB |
| treatment_phase | varchar | Fase intensif / fase lanjutan |
| treatment_start_date | date | Tanggal mulai pengobatan |
| treatment_end_date | date | Perkiraan tanggal selesai pengobatan |
| assigned_nurse_id | integer | Perawat penanggung jawab |
| status | enum | aktif / selesai / drop out / pindah layanan |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.3 Tabel Nurses

Digunakan untuk menyimpan data perawat/admin.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| user_id | integer | Relasi ke tabel users |
| nurse_code | varchar | Kode perawat |
| position | varchar | Jabatan atau unit kerja |
| phone | varchar | Nomor telepon |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.4 Tabel Medication_Schedules

Digunakan untuk menyimpan jadwal minum obat pasien.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| patient_id | integer | Relasi ke tabel patients |
| medication_name | varchar | Nama obat |
| dosage | varchar | Dosis obat |
| schedule_time | time | Jam minum obat |
| start_date | date | Tanggal mulai |
| end_date | date | Tanggal selesai |
| frequency | varchar | Frekuensi minum obat |
| instruction | text | Instruksi tambahan |
| created_by | integer | ID perawat pembuat jadwal |
| is_active | boolean | Status jadwal aktif |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.5 Tabel Medication_Logs

Digunakan untuk mencatat konfirmasi minum obat pasien.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| schedule_id | integer | Relasi ke jadwal obat |
| patient_id | integer | Relasi ke pasien |
| scheduled_time | datetime | Waktu seharusnya minum obat |
| confirmed_time | datetime | Waktu pasien konfirmasi |
| status | enum | tepat waktu / terlambat / belum konfirmasi |
| confirmation_method | enum | manual / chatbot / admin |
| note | text | Catatan pasien jika ada |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.6 Tabel Education_Contents

Digunakan untuk menyimpan materi edukasi TB.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| title | varchar | Judul edukasi |
| content | text | Isi edukasi |
| category | varchar | Kategori edukasi |
| media_type | enum | teks / gambar / video / link |
| media_url | varchar | Link gambar/video jika ada |
| created_by | integer | ID perawat/admin |
| is_active | boolean | Status konten |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.7 Tabel Chatbot_Conversations

Digunakan untuk menyimpan riwayat percakapan pasien dengan chatbot AI.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| patient_id | integer | Relasi ke pasien |
| user_message | text | Pesan dari pasien |
| bot_response | text | Jawaban chatbot |
| intent | varchar | Kategori pertanyaan |
| risk_flag | boolean | Penanda risiko jika ada keluhan serius |
| escalation_required | boolean | Penanda perlu diteruskan ke perawat |
| created_at | datetime | Waktu percakapan |

### 6.8 Tabel Motivation_Messages

Digunakan untuk menyimpan pesan motivasi.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| message | text | Isi pesan motivasi |
| category | varchar | Kategori motivasi |
| is_active | boolean | Status pesan |
| created_by | integer | ID perawat/admin |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.9 Tabel Assessment_Results

Digunakan untuk menyimpan hasil penilaian kepatuhan dan self-efficacy.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| patient_id | integer | Relasi ke pasien |
| assessment_type | enum | kepatuhan / self-efficacy |
| assessment_period | enum | pretest / posttest / follow-up |
| total_score | integer | Skor total |
| category | enum | rendah / sedang / tinggi |
| assessment_date | date | Tanggal penilaian |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.10 Tabel Assessment_Items

Digunakan untuk menyimpan butir instrumen penilaian kepatuhan dan self-efficacy.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| assessment_type | enum | kepatuhan / self-efficacy |
| item_number | integer | Nomor item |
| question_text | text | Teks pertanyaan |
| options | json | Pilihan jawaban |
| scoring_rule | json | Aturan skor |
| is_active | boolean | Status item |
| created_at | datetime | Tanggal dibuat |
| updated_at | datetime | Tanggal diperbarui |

### 6.11 Tabel Assessment_Answers

Digunakan untuk menyimpan jawaban pasien pada setiap item penilaian.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| assessment_result_id | integer | Relasi ke tabel assessment_results |
| assessment_item_id | integer | Relasi ke tabel assessment_items |
| answer_value | varchar | Jawaban pasien |
| score | integer | Skor jawaban |
| created_at | datetime | Tanggal dibuat |

### 6.12 Tabel Notifications

Digunakan untuk mencatat notifikasi yang dikirim kepada pasien.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| patient_id | integer | Relasi ke pasien |
| schedule_id | integer | Relasi ke jadwal obat |
| notification_type | enum | reminder obat / motivasi / edukasi |
| message | text | Isi notifikasi |
| sent_at | datetime | Waktu pengiriman |
| read_at | datetime | Waktu dibaca |
| status | enum | terkirim / gagal / dibaca |
| created_at | datetime | Tanggal dibuat |

### 6.13 Tabel Audit_Logs

Digunakan untuk menyimpan aktivitas penting di dalam sistem.

| Field | Type | Keterangan |
|---|---|---|
| id | integer | Primary key |
| user_id | integer | ID pengguna |
| action | varchar | Aktivitas yang dilakukan |
| module | varchar | Modul terkait |
| description | text | Deskripsi aktivitas |
| ip_address | varchar | Alamat IP |
| user_agent | text | Perangkat/browser pengguna |
| created_at | datetime | Waktu aktivitas |

### 6.14 Relasi Database Utama

```text
users
  ├── patients
  │      ├── medication_schedules
  │      │       └── medication_logs
  │      ├── chatbot_conversations
  │      ├── assessment_results
  │      │       └── assessment_answers
  │      └── notifications
  │
  ├── nurses
  ├── education_contents
  ├── motivation_messages
  └── audit_logs

assessment_items
  └── assessment_answers
```

---

## 7. Design & Technical Constraints

### 7.1 Design Guidelines untuk Pasien

Tampilan pasien harus dibuat sederhana, jelas, dan mudah digunakan. Prioritas utama adalah kemudahan akses bagi pasien TB yang mungkin tidak terbiasa menggunakan aplikasi kompleks.

#### Prinsip desain:

1. Menu sederhana dan tidak terlalu banyak.
2. Tombol utama harus besar dan mudah ditekan.
3. Jadwal obat ditampilkan pada halaman utama.
4. Tombol “Sudah Minum Obat” harus terlihat jelas.
5. Warna tampilan nyaman dan tidak melelahkan mata.
6. Bahasa yang digunakan sederhana, sopan, dan edukatif.
7. Informasi tidak terlalu padat dalam satu halaman.
8. Status minum obat ditampilkan dengan indikator yang mudah dipahami.
9. Chatbot mudah diakses dari halaman utama.
10. Materi edukasi dibuat singkat dan dapat dibaca cepat.

### 7.2 Design Guidelines untuk Perawat/Admin

Dashboard perawat harus menampilkan data secara ringkas, informatif, dan mudah dianalisis.

#### Komponen dashboard:

1. Total pasien aktif.
2. Jumlah pasien dengan kepatuhan tinggi.
3. Jumlah pasien dengan kepatuhan sedang.
4. Jumlah pasien dengan kepatuhan rendah.
5. Jumlah pasien yang belum konfirmasi minum obat hari ini.
6. Grafik kepatuhan harian atau mingguan.
7. Tabel daftar pasien.
8. Filter berdasarkan status kepatuhan.
9. Filter berdasarkan fase pengobatan.
10. Detail pasien.
11. Tombol setting jadwal obat.
12. Tombol export laporan.

### 7.3 Technical Constraints

1. Aplikasi harus responsif pada layar smartphone.
2. Sistem harus mendukung Google Sign-In untuk pasien.
3. Sistem harus menyediakan login admin yang aman untuk perawat.
4. Sistem notifikasi harus berjalan sesuai jadwal yang diatur perawat.
5. Data pasien harus disimpan secara aman.
6. Setiap role pengguna hanya dapat mengakses fitur sesuai kewenangannya.
7. Chatbot AI harus memiliki batasan agar tidak memberikan diagnosis medis.
8. Sistem harus menyimpan log aktivitas penting.
9. Dashboard harus mampu menampilkan data pasien secara real-time atau mendekati real-time.
10. Sistem harus dapat mengekspor laporan dalam format PDF atau Excel.
11. Aplikasi harus memiliki backup database berkala.
12. Sistem harus tetap ringan agar dapat digunakan pada koneksi internet terbatas.
13. Sistem harus dapat menangani data pasien, jadwal obat, notifikasi, dan riwayat kepatuhan tanpa penurunan performa yang signifikan.

### 7.4 Security & Privacy

1. Login pasien menggunakan Google OAuth 2.0 atau Google Sign-In.
2. Password admin harus disimpan dalam bentuk hash.
3. Data pasien tidak boleh ditampilkan kepada pengguna yang tidak berwenang.
4. Perawat hanya dapat mengakses data pasien yang menjadi tanggung jawabnya, jika sistem menerapkan pembagian perawat penanggung jawab.
5. Riwayat percakapan chatbot harus disimpan secara aman.
6. Sistem harus memiliki logout otomatis setelah periode tidak aktif.
7. Akses dashboard admin harus dilindungi autentikasi.
8. Data sensitif pasien harus dibatasi aksesnya.
9. Aktivitas login dan perubahan data harus tercatat.
10. Export laporan hanya boleh dilakukan oleh perawat/admin.
11. Sistem perlu menampilkan persetujuan penggunaan data sebelum pasien menggunakan aplikasi.

### 7.5 AI Safety Constraints

1. Chatbot tidak boleh menyatakan diagnosis.
2. Chatbot tidak boleh menyarankan penghentian obat.
3. Chatbot tidak boleh mengganti keputusan dokter atau perawat.
4. Chatbot harus mengarahkan pasien ke tenaga kesehatan jika ada gejala serius.
5. Chatbot harus menggunakan bahasa yang sopan, empatik, dan mudah dipahami.
6. Chatbot harus menjawab dalam konteks edukasi TB dan dukungan kepatuhan.
7. Chatbot perlu memiliki daftar topik yang dibatasi, terutama instruksi medis berisiko tinggi.
8. Chatbot harus memberikan disclaimer bahwa informasi yang diberikan bersifat edukatif.
9. Chatbot harus memberi tanda risiko jika pasien menyampaikan keluhan berat atau indikasi putus obat.
10. Chatbot harus dapat merekomendasikan pasien menghubungi perawat apabila pasien berulang kali tidak patuh atau menyatakan ingin berhenti minum obat.

### 7.6 Output Sistem

Output utama aplikasi ASET-TB meliputi:

1. Notifikasi minum obat.
2. Jadwal minum obat pasien.
3. Status konfirmasi minum obat.
4. Riwayat minum obat.
5. Persentase kepatuhan.
6. Kategori kepatuhan.
7. Skor kepatuhan.
8. Skor self-efficacy.
9. Kategori self-efficacy.
10. Perubahan skor pretest dan posttest.
11. Riwayat percakapan chatbot.
12. Pesan motivasi harian.
13. Laporan monitoring pasien.
14. Rekomendasi tindak lanjut untuk perawat berdasarkan status kepatuhan pasien.

---

## 8. Ringkasan Prioritas Pengembangan

| Prioritas | Fitur | Keterangan |
|---|---|---|
| P1 | Login pasien dengan akun Google | Wajib dikembangkan pertama untuk akses pasien |
| P1 | Login perawat/admin | Wajib untuk pengelolaan sistem |
| P1 | Manajemen data pasien | Dasar pengelolaan pengguna dan pasien |
| P1 | Penghubung akun Google pasien | Agar akun Google sesuai dengan data pasien |
| P1 | Setting jadwal minum obat | Fitur inti perawat |
| P1 | Reminder obat | Fitur inti pasien |
| P1 | Konfirmasi minum obat | Dasar monitoring kepatuhan |
| P1 | Dashboard kepatuhan | Fitur utama perawat |
| P2 | Edukasi TB | Mendukung peningkatan pengetahuan pasien |
| P2 | Motivasi harian | Mendukung peningkatan self-efficacy |
| P2 | Penilaian kepatuhan | Mendukung evaluasi pasien |
| P2 | Penilaian self-efficacy | Mendukung evaluasi pasien |
| P3 | Chatbot AI | Fitur lanjutan berbasis AI |
| P3 | Export laporan | Fitur pelengkap untuk dokumentasi |
| P3 | Risk flag chatbot | Fitur lanjutan untuk deteksi risiko ketidakpatuhan atau keluhan serius |

---

## 9. Kesimpulan PRD

ASET-TB merupakan aplikasi web-mobile berbasis AI yang dikembangkan untuk mendukung intervensi keperawatan pada pasien tuberkulosis. Fokus utama aplikasi adalah meningkatkan kepatuhan minum obat dan self-efficacy pasien melalui reminder obat, edukasi TB, chatbot AI, motivasi, serta monitoring oleh perawat.

Aplikasi ini memungkinkan pasien login menggunakan akun Google sehingga akses menjadi lebih mudah dan aman. Perawat sebagai admin memiliki peran penting dalam mengelola data pasien, menghubungkan akun Google pasien, mengatur jadwal minum obat, memantau kepatuhan, serta melihat hasil penilaian kepatuhan dan self-efficacy.

Dengan fitur dashboard, sistem notifikasi, chatbot AI, dan pencatatan data kepatuhan, ASET-TB dapat menjadi media intervensi keperawatan digital yang lebih terstruktur, adaptif, dan mendukung evaluasi pengobatan TB secara berkelanjutan.
