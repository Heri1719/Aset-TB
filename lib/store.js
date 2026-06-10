function toTime(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 5);
  return String(value).slice(0, 5);
}

function toDate(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    googleSub: row.google_sub,
    avatar: row.avatar_url
  };
}

function mapPatient(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    medicalRecordNumber: row.medical_record_number,
    name: row.name,
    phase: row.phase,
    treatmentDay: row.treatment_day,
    treatmentTargetDays: row.treatment_target_days,
    adherenceScore: row.computed_adherence_score ?? row.adherence_score,
    confirmedTreatmentDays: row.confirmed_treatment_days ?? 0,
    scheduledTreatmentDaysDue: row.scheduled_treatment_days_due ?? 0,
    totalScheduledDays: row.total_scheduled_days ?? 0,
    estimatedEndDate: toDate(row.estimated_end_date),
    selfEfficacyScore: row.self_efficacy_score,
    riskLevel: row.risk_level,
    nurseId: row.nurse_id,
    googleEmail: row.google_email,
    status: row.status,
    avatar: row.avatar_url
  };
}

function mapMedication(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    dose: row.dose,
    form: row.form,
    scheduledTime: toTime(row.scheduled_time),
    status: row.status,
    confirmedAt: toTime(row.confirmed_at),
    takenDate: toDate(row.taken_date),
    endDate: toDate(row.course_end_date),
    scheduleGroupId: row.schedule_group_id || null,
    generatedCount: row.generated_count ? Number(row.generated_count) : undefined,
    confirmationVideoPath: row.confirmation_video_path || row.video_path || null,
    confirmationVideoMimeType: row.confirmation_video_mime_type || row.video_mime_type || null
  };
}

function mapChat(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    sender: row.sender,
    message: row.message,
    createdAt: row.created_at,
    topic: row.topic
  };
}

function minutesFromTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function classifyConfirmation(scheduledTime, confirmedAt) {
  const lateBy = minutesFromTime(confirmedAt) - minutesFromTime(scheduledTime);
  return lateBy <= 30 ? "taken" : "late";
}

class PostgresStore {
  constructor(connectionString) {
    if (!connectionString) throw new Error("DATABASE_URL belum diatur");
    const { Pool } = require("pg");
    this.pool = new Pool({ connectionString });
  }

  async query(sql, params = []) {
    return this.pool.query(sql, params);
  }

  async ensureConnected() {
    await this.query("select 1");
    await this.query(`create table if not exists medication_confirmations (
      id uuid primary key default gen_random_uuid(),
      medication_id uuid not null references medications(id) on delete cascade,
      patient_id uuid references patients(id) on delete cascade,
      actor_id uuid,
      video_path text,
      video_mime_type text,
      confirmed_at timestamptz not null default now(),
      created_at timestamptz not null default now()
    )`);
    await this.query(`create table if not exists self_efficacy_surveys (
      id uuid primary key default gen_random_uuid(),
      patient_id uuid not null references patients(id) on delete cascade,
      score integer not null check (score between 0 and 100),
      answers jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )`);
    await this.query(`create table if not exists daily_motivation_scores (
      id uuid primary key default gen_random_uuid(),
      patient_id uuid not null references patients(id) on delete cascade,
      score integer not null check (score between 0 and 100),
      raw_value integer not null check (raw_value between 1 and 5),
      note text,
      created_at timestamptz not null default now()
    )`);
    await this.query("alter table medications add column if not exists schedule_group_id uuid");
    await this.query("alter table medications add column if not exists course_end_date date");
    await this.query("update medications set schedule_group_id = coalesce(schedule_group_id, id), course_end_date = coalesce(course_end_date, taken_date)");
    await this.query(`create table if not exists medication_email_notifications (
      id uuid primary key default gen_random_uuid(),
      medication_id uuid not null references medications(id) on delete cascade,
      patient_id uuid references patients(id) on delete cascade,
      recipient_email text not null,
      notification_type text not null default 'five_minute_reminder',
      sent_at timestamptz not null default now(),
      status text not null default 'sent',
      error_message text,
      unique (medication_id, notification_type)
    )`);
  }

  patientSelectSql() {
    return `select p.*, u.avatar_url,
      coalesce(c.confirmed_days, 0)::int as confirmed_treatment_days,
      coalesce(s.scheduled_days_due, 0)::int as scheduled_treatment_days_due,
      coalesce(s.total_scheduled_days, 0)::int as total_scheduled_days,
      s.estimated_end_date,
      case
        when coalesce(s.scheduled_days_due, 0) = 0 then 0
        else least(100, round((coalesce(c.confirmed_days, 0)::numeric / greatest(s.scheduled_days_due, 1)) * 100))::int
      end as computed_adherence_score
      from patients p
      left join users u on u.id = p.user_id
      left join (
        select patient_id, count(distinct taken_date) as confirmed_days
        from medications
        where status in ('taken', 'late')
        group by patient_id
      ) c on c.patient_id = p.id
      left join (
        select patient_id,
               count(distinct taken_date) filter (where taken_date <= current_date) as scheduled_days_due,
               count(distinct taken_date) as total_scheduled_days,
               max(coalesce(course_end_date, taken_date)) as estimated_end_date
        from medications
        group by patient_id
      ) s on s.patient_id = p.id`;
  }

  async getOrCreateGoogleUser(profile) {
    const existing = await this.query(
      "select * from users where google_sub = $1 or email = $2 limit 1",
      [profile.googleSub, profile.email]
    );
    if (existing.rows[0]) {
      const user = existing.rows[0];
      const updated = await this.query(
        `update users
         set google_sub = coalesce(google_sub, $2),
             name = coalesce(nullif($3, ''), name),
             avatar_url = coalesce($4, avatar_url),
             updated_at = now()
         where id = $1
         returning *`,
        [user.id, profile.googleSub, profile.name, profile.avatarUrl]
      );
      await this.ensurePatientForGoogleUser(updated.rows[0].id, profile);
      return mapUser(updated.rows[0]);
    }

    const created = await this.query(
      `insert into users (role, name, email, google_sub, avatar_url)
       values ('patient', $1, $2, $3, $4)
       returning *`,
      [profile.name, profile.email, profile.googleSub, profile.avatarUrl]
    );
    await this.ensurePatientForGoogleUser(created.rows[0].id, profile);
    return mapUser(created.rows[0]);
  }

  async ensurePatientForGoogleUser(userId, profile) {
    const linked = await this.query("select id from patients where user_id = $1 limit 1", [userId]);
    if (linked.rows[0]) return linked.rows[0].id;

    const matched = await this.query(
      `update patients
       set user_id = $1, updated_at = now()
       where lower(google_email) = lower($2) and user_id is null
       returning id`,
      [userId, profile.email]
    );
    if (matched.rows[0]) return matched.rows[0].id;

    const patient = await this.query(
      `insert into patients (
         user_id, medical_record_number, name, phase, treatment_day,
         treatment_target_days, adherence_score, self_efficacy_score,
         risk_level, google_email, status
       )
       values (
         $1,
         'TB-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5($2), 1, 6)),
         $3,
         'Intensif',
         1,
         180,
         0,
         0,
         'medium',
         $2,
         'active'
       )
       returning id`,
      [userId, profile.email, profile.name || profile.email]
    );
    const patientId = patient.rows[0].id;
    await this.query(
      `insert into medications (patient_id, name, dose, form, scheduled_time, status, taken_date)
       values
         ($1, 'Rifampicin', '450mg', '1 Kapsul', '07:00', 'pending', current_date),
         ($1, 'Isoniazid', '300mg', '1 Tablet', '13:00', 'upcoming', current_date),
         ($1, 'Ethambutol', '750mg', '2 Tablet', '20:00', 'upcoming', current_date)`,
      [patientId]
    );
    await this.query(
      `insert into chat_messages (patient_id, sender, message, topic)
       values ($1, 'assistant', 'Halo! Saya siap membantu Anda hari ini. Ada yang ingin Anda tanyakan seputar perawatan TB Anda?', 'general')`,
      [patientId]
    );
    return patientId;
  }

  async findUserById(id) {
    const result = await this.query("select * from users where id = $1", [id]);
    return mapUser(result.rows[0]);
  }

  async findNurseByEmail(email) {
    const result = await this.query("select * from users where role = 'nurse' and email = $1", [email]);
    return mapUser(result.rows[0]);
  }

  async getPatientForUser(userId) {
    const result = await this.query(
      `${this.patientSelectSql()}
       where p.user_id = $1
       order by p.created_at
       limit 1`,
      [userId]
    );
    return mapPatient(result.rows[0]);
  }

  async getPatientById(patientId) {
    const result = await this.query(
      `${this.patientSelectSql()}
       where p.id = $1`,
      [patientId]
    );
    return mapPatient(result.rows[0]);
  }

  async listMedications(patientId, date) {
    const result = await this.query(
      `select m.*, c.video_path as confirmation_video_path, c.video_mime_type as confirmation_video_mime_type
       from medications m
       left join lateral (
         select video_path, video_mime_type
         from medication_confirmations
         where medication_id = m.id
         order by created_at desc
         limit 1
       ) c on true
       where m.patient_id = $1 and m.taken_date = coalesce($2::date, current_date)
       order by m.scheduled_time`,
      [patientId, date || null]
    );
    return result.rows.map(mapMedication);
  }


  async listMedicationDates(patientId) {
    const result = await this.query(
      `select taken_date,
              count(*)::int as total,
              count(*) filter (where status in ('taken', 'late'))::int as confirmed,
              count(*) filter (where status in ('pending', 'upcoming'))::int as pending,
              min(scheduled_time) as first_time
       from medications
       where patient_id = $1
       group by taken_date
       order by taken_date`,
      [patientId]
    );
    return result.rows.map(row => ({
      date: toDate(row.taken_date),
      total: row.total,
      confirmed: row.confirmed,
      pending: row.pending,
      firstTime: toTime(row.first_time)
    }));
  }


  async getNextMedication(patientId) {
    const result = await this.query(
      `with now_jakarta as (
         select
           (now() at time zone 'Asia/Jakarta')::date as today,
           (now() at time zone 'Asia/Jakarta')::time as current_time
       )
       select m.*, c.video_path as confirmation_video_path, c.video_mime_type as confirmation_video_mime_type
       from medications m
       cross join now_jakarta n
       left join lateral (
         select video_path, video_mime_type
         from medication_confirmations
         where medication_id = m.id
         order by created_at desc
         limit 1
       ) c on true
       where m.patient_id = $1
         and m.status in ('pending', 'upcoming')
         and m.taken_date >= n.today
       order by
         case when m.taken_date = n.today and m.scheduled_time < n.current_time then 1 else 0 end,
         m.taken_date,
         m.scheduled_time,
         m.updated_at desc
       limit 1`,
      [patientId]
    );
    return mapMedication(result.rows[0]);
  }

  async getTodaySelfEfficacy(patientId) {
    const result = await this.query(
      `select score, answers, created_at
       from self_efficacy_surveys
       where patient_id = $1
         and created_at::date = (now() at time zone 'Asia/Jakarta')::date
       order by created_at desc
       limit 1`,
      [patientId]
    );
    const row = result.rows[0];
    if (!row) return { submittedToday: false, score: null, answers: [] };
    return {
      submittedToday: true,
      score: row.score,
      answers: row.answers?.answers || [],
      createdAt: row.created_at
    };
  }


  async getTodayMotivationScore(patientId) {
    const result = await this.query(
      `select score, raw_value, note, created_at
       from daily_motivation_scores
       where patient_id = $1
         and created_at::date = (now() at time zone 'Asia/Jakarta')::date
       order by created_at desc
       limit 1`,
      [patientId]
    );
    const row = result.rows[0];
    if (!row) return { submittedToday: false, score: null, rawValue: null, note: null };
    return {
      submittedToday: true,
      score: row.score,
      rawValue: row.raw_value,
      note: row.note,
      createdAt: row.created_at
    };
  }

  async saveMotivationScore(patientId, input) {
    const rawValue = Number(input.value || input.rawValue || input.score);
    if (!Number.isFinite(rawValue) || rawValue < 1 || rawValue > 5) {
      throw new Error("Nilai motivasi harian wajib diisi dari 1 sampai 5");
    }
    const cleanRaw = Math.round(rawValue);
    const score = Math.round((cleanRaw / 5) * 100);
    const note = String(input.note || "").trim() || null;
    await this.query(
      `insert into daily_motivation_scores (patient_id, score, raw_value, note)
       values ($1, $2, $3, $4)`,
      [patientId, score, cleanRaw, note]
    );
    return this.getTodayMotivationScore(patientId);
  }

  async listMedicationReminderDue({ targetDate, targetTime }) {
    const result = await this.query(
      `select m.*, p.name as patient_name, p.google_email, u.email as user_email
       from medications m
       join patients p on p.id = m.patient_id
       left join users u on u.id = p.user_id
       where m.taken_date = $1::date
         and m.scheduled_time >= $2::time
         and m.scheduled_time < ($2::time + interval '1 minute')
         and m.status in ('pending', 'upcoming')
         and coalesce(p.status, 'active') = 'active'
         and coalesce(p.google_email, u.email) is not null
         and not exists (
           select 1 from medication_email_notifications n
           where n.medication_id = m.id
             and n.notification_type = 'five_minute_reminder'
             and n.status = 'sent'
         )
       order by m.scheduled_time`,
      [targetDate, targetTime]
    );
    return result.rows.map(row => ({
      medication: mapMedication(row),
      patientName: row.patient_name,
      email: row.google_email || row.user_email
    }));
  }

  async recordMedicationReminder({ medicationId, patientId, email, status, errorMessage }) {
    await this.query(
      `insert into medication_email_notifications (medication_id, patient_id, recipient_email, status, error_message, sent_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (medication_id, notification_type) do update
       set recipient_email = excluded.recipient_email,
           status = excluded.status,
           error_message = excluded.error_message,
           sent_at = now()`,
      [medicationId, patientId, email, status || 'sent', errorMessage || null]
    );
  }

  async getMotivation() {
    const result = await this.query("select message from motivations order by created_at, id");
    const customMessages = result.rows.map(row => row.message).filter(Boolean);
    const dailyMessages = [
      "Setiap dosis hari ini adalah langkah nyata menuju napas yang lebih lega.",
      "Konsistensi kecil hari ini bisa membawa perubahan besar untuk kesehatan Anda.",
      "Anda tidak perlu sempurna, cukup terus kembali ke jadwal pengobatan.",
      "Satu obat yang diminum tepat waktu adalah kemenangan untuk tubuh Anda.",
      "Hari ini mungkin terasa biasa, tetapi kepatuhan Anda sedang membangun kesembuhan.",
      "Teruskan satu jadwal lagi; tubuh Anda layak mendapatkan usaha ini.",
      "Setiap konfirmasi adalah bukti bahwa Anda sedang menjaga masa depan Anda.",
      "Pengobatan panjang dimenangkan oleh langkah kecil yang dilakukan berulang.",
      "Fokus pada jadwal terdekat. Satu langkah cukup untuk hari ini.",
      "Anda sedang melakukan hal penting, meski hasilnya tidak selalu terlihat langsung.",
      "Minum obat hari ini membantu tubuh Anda bekerja melawan TB.",
      "Kedisiplinan hari ini adalah hadiah untuk diri Anda di masa depan.",
      "Saat lelah, ingat bahwa satu dosis tetap bisa membawa Anda maju.",
      "Jangan menyerah pada hari yang berat; cukup mulai dari obat berikutnya.",
      "Anda sudah sampai sejauh ini. Lanjutkan dengan satu tindakan sederhana.",
      "Setiap jadwal yang dijalani membuat rencana sembuh semakin kuat.",
      "Tubuh Anda sedang pulih sedikit demi sedikit. Bantu dengan konsistensi.",
      "Satu konfirmasi hari ini berarti satu alasan lagi untuk percaya pada proses.",
      "Tidak apa-apa pelan, selama Anda tetap berjalan bersama pengobatan.",
      "Obat yang diminum teratur adalah bagian penting dari keberanian Anda.",
      "Hari ini, pilih satu hal baik untuk diri sendiri: ikuti jadwal obat.",
      "Anda berhak sembuh, dan kepatuhan hari ini mendukung hak itu.",
      "Jadwal obat bukan beban, melainkan jalan kecil menuju tubuh yang lebih kuat.",
      "Langkah sederhana hari ini bisa menjaga pengobatan tetap efektif.",
      "Semangat tidak selalu besar; kadang cukup berupa tetap minum obat.",
      "Konfirmasi hari ini adalah catatan bahwa Anda memilih pulih.",
      "Setiap hari patuh adalah fondasi untuk kesehatan yang lebih stabil.",
      "Jika hari ini berat, biarkan jadwal obat menjadi pegangan kecil Anda.",
      "Anda tidak sendirian; pengobatan ini bisa dijalani satu hari demi satu hari.",
      "Satu dosis tepat waktu membantu menjaga arah kesembuhan tetap jelas.",
      "Perjalanan panjang ini dimulai lagi dari pilihan baik hari ini.",
      "Jangan tunggu semangat besar. Mulai saja dari jadwal berikutnya.",
      "Tubuh Anda membutuhkan dukungan rutin, dan obat hari ini adalah dukungan itu.",
      "Kepatuhan Anda adalah bentuk sayang kepada diri sendiri.",
      "Hari ini adalah kesempatan baru untuk memperkuat komitmen sembuh.",
      "Minum obat sesuai jadwal membuat usaha kemarin tidak sia-sia.",
      "Setiap dosis adalah bagian dari cerita pulih yang sedang Anda tulis.",
      "Anda boleh lelah, tetapi jangan lepaskan langkah kecil yang penting ini.",
      "Selesaikan jadwal hari ini, dan biarkan besok punya peluang lebih baik.",
      "Satu hari patuh menambah kekuatan pada perjalanan terapi Anda.",
      "Pengobatan TB membutuhkan waktu, dan Anda sedang menjalaninya dengan berani.",
      "Tepat waktu hari ini membantu tubuh Anda tetap berada di jalur pemulihan.",
      "Pilih sembuh dengan tindakan sederhana: minum obat sesuai jadwal.",
      "Kemenangan hari ini bisa sesederhana menekan tombol konfirmasi setelah minum obat.",
      "Setiap jadwal yang Anda jalani adalah tanda bahwa Anda menjaga harapan.",
      "Jangan mengecilkan usaha kecil; konsistensi kecil sering paling menentukan.",
      "Anda sedang melatih diri untuk kuat, satu dosis pada satu waktu.",
      "Jika motivasi turun, ikuti rencana. Rencana membantu saat semangat belum penuh.",
      "Obat hari ini adalah bagian dari perlindungan untuk diri dan orang terdekat.",
      "Langkah kecil yang diulang akan menjadi perubahan besar yang terasa.",
      "Pertahankan jadwal hari ini agar pengobatan tetap punya peluang terbaik.",
      "Anda sudah memilih jalan pulih. Hari ini, lanjutkan satu langkah lagi.",
      "Minum obat tepat waktu adalah cara sederhana untuk memenangkan hari ini.",
      "Tidak semua hari mudah, tetapi setiap dosis tetap berarti.",
      "Biarkan pengingat hari ini menjadi teman, bukan tekanan.",
      "Setiap konfirmasi memperlihatkan bahwa Anda mampu menjalani proses ini.",
      "Kesehatan yang lebih baik dibangun dari keputusan kecil yang konsisten.",
      "Jika ragu, kembali ke tujuan: sembuh dan hidup lebih kuat.",
      "Anda tidak harus menyelesaikan semuanya hari ini, cukup jadwal hari ini.",
      "Jaga ritme, jaga harapan, dan lanjutkan pengobatan sesuai jadwal.",
      "Satu dosis lagi hari ini adalah langkah berharga untuk masa depan Anda.",
      "Kepatuhan Anda membantu obat bekerja dan tubuh pulih lebih terarah.",
      "Hari ini, rayakan usaha kecil: Anda tetap berjuang.",
      "Jadwal obat adalah pengingat bahwa pemulihan sedang berlangsung.",
      "Teruskan. Setiap hari yang dijalani membuat Anda semakin dekat pada target.",
      "Bila terasa berat, minta bantuan. Anda tetap layak didukung sampai sembuh.",
      "Obat yang diminum hari ini adalah investasi untuk hari esok yang lebih sehat."
    ];
    const list = [...customMessages, ...dailyMessages];
    const jakartaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
    const dayIndex = Math.floor(new Date(jakartaDate + "T00:00:00Z").getTime() / 86_400_000) % list.length;
    return list[dayIndex];
  }

  async getPatientDashboard(patientId) {
    const patient = await this.getPatientById(patientId);
    if (!patient) return null;
    const medications = await this.listMedications(patientId);
    const nextMedication = await this.getNextMedication(patientId);
    const selfEfficacyToday = await this.getTodaySelfEfficacy(patientId);
    const motivationScoreToday = await this.getTodayMotivationScore(patientId);
    return {
      patient,
      motivation: await this.getMotivation(),
      medications,
      nextMedication,
      selfEfficacyToday,
      motivationScoreToday,
      adherence: {
        score: patient.adherenceScore,
        confirmedDays: patient.confirmedTreatmentDays || 0,
        treatmentDays: patient.scheduledTreatmentDaysDue || patient.treatmentDay || 1,
        totalScheduledDays: patient.totalScheduledDays || patient.treatmentTargetDays || 180,
        targetDays: patient.treatmentTargetDays || 180,
        estimatedEndDate: patient.estimatedEndDate || null
      },
      progressText: `Konfirmasi tercatat pada ${patient.confirmedTreatmentDays || 0} dari ${patient.scheduledTreatmentDaysDue || patient.treatmentDay || 1} hari jadwal yang sudah berjalan.${patient.estimatedEndDate ? ` Estimasi selesai pengobatan: ${patient.estimatedEndDate}.` : ""}`
    };
  }

  async saveSelfEfficacy(patientId, input) {
    const rawAnswers = Array.isArray(input.answers) ? input.answers.map(Number) : [];
    const answers = rawAnswers.filter(value => Number.isFinite(value) && value >= 1 && value <= 4);
    if (answers.length !== 10) throw new Error("Survei self-efficacy harian wajib mengisi 10 pertanyaan");
    const total = answers.reduce((sum, value) => sum + value, 0);
    const cleanScore = Math.max(0, Math.min(100, Math.round(((total - 10) / 30) * 100)));
    await this.query(
      `insert into self_efficacy_surveys (patient_id, score, answers)
       values ($1, $2, $3::jsonb)`,
      [patientId, cleanScore, JSON.stringify({ instrument: "General Self-Efficacy Scale", scale: "1-4", answers, rawTotal: total })]
    );
    const updated = await this.query(
      `update patients
       set self_efficacy_score = $2, updated_at = now()
       where id = $1
       returning *`,
      [patientId, cleanScore]
    );
    return mapPatient(updated.rows[0]);
  }

  async confirmMedication(id, actorId, confirmedAt, evidence = {}) {
    const current = await this.query("select * from medications where id = $1", [id]);
    const medication = current.rows[0];
    if (!medication) return null;
    const cleanConfirmedAt = confirmedAt.replace(".", ":").slice(0, 5);
    const status = classifyConfirmation(toTime(medication.scheduled_time), cleanConfirmedAt);
    const updated = await this.query(
      `update medications
       set confirmed_at = $2::time,
           status = $3,
           updated_at = now()
       where id = $1
       returning *`,
      [id, cleanConfirmedAt, status]
    );
    await this.query(
      "insert into audit_logs (actor_id, action, target_id) values ($1, 'confirm_medication', $2)",
      [actorId, id]
    );
    if (evidence.videoPath) {
      await this.query(
        `insert into medication_confirmations (medication_id, patient_id, actor_id, video_path, video_mime_type)
         values ($1, $2, $3, $4, $5)`,
        [id, medication.patient_id, actorId, evidence.videoPath, evidence.videoMimeType || null]
      );
    }
    const withEvidence = await this.query(
      `select m.*, c.video_path as confirmation_video_path, c.video_mime_type as confirmation_video_mime_type
       from medications m
       left join lateral (
         select video_path, video_mime_type
         from medication_confirmations
         where medication_id = m.id
         order by created_at desc
         limit 1
       ) c on true
       where m.id = $1`,
      [id]
    );
    return mapMedication(withEvidence.rows[0] || updated.rows[0]);
  }

  async createMedication(input, actorId) {
    const patientId = String(input.patientId || "").trim();
    const name = String(input.name || "").trim();
    const dose = String(input.dose || "").trim();
    const form = String(input.form || "").trim();
    const scheduledTime = String(input.scheduledTime || "").trim().slice(0, 5);
    const startDate = String(input.takenDate || new Date().toISOString().slice(0, 10)).trim().slice(0, 10);
    const endDate = String(input.endDate || startDate).trim().slice(0, 10);
    if (!patientId || !name || !dose || !form || !scheduledTime || !startDate || !endDate) {
      throw new Error("Pasien, tanggal mulai, tanggal selesai, nama obat, dosis, bentuk obat, dan jam minum wajib diisi");
    }
    if (endDate < startDate) throw new Error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai");

    const groupId = await this.query("select gen_random_uuid() as id");
    const result = await this.query(
      `with dates as (
         select generate_series($6::date, $7::date, interval '1 day')::date as taken_date
       ), inserted as (
         insert into medications (patient_id, name, dose, form, scheduled_time, status, confirmed_at, taken_date, schedule_group_id, course_end_date)
         select $1, $2, $3, $4, $5::time,
                case when taken_date <= current_date then 'pending' else 'upcoming' end,
                null, taken_date, $8::uuid, $7::date
         from dates
         returning *
       )
       select inserted.*, (select count(*) from inserted)::int as generated_count
       from inserted
       order by taken_date
       limit 1`,
      [patientId, name, dose, form, scheduledTime, startDate, endDate, groupId.rows[0].id]
    );
    await this.query(
      "insert into audit_logs (actor_id, action, target_id) values ($1, 'create_medication_schedule_series', $2)",
      [actorId || null, groupId.rows[0].id]
    );
    return mapMedication(result.rows[0]);
  }

  async updateMedication(id, input, actorId) {
    const name = String(input.name || "").trim();
    const dose = String(input.dose || "").trim();
    const form = String(input.form || "").trim();
    const scheduledTime = String(input.scheduledTime || "").trim().slice(0, 5);
    const takenDate = String(input.takenDate || "").trim().slice(0, 10);
    const endDate = String(input.endDate || takenDate).trim().slice(0, 10);
    const status = String(input.status || "pending").trim();
    if (!name || !dose || !form || !scheduledTime || !takenDate || !endDate) {
      throw new Error("Tanggal, nama obat, dosis, bentuk obat, dan jam minum wajib diisi");
    }
    const result = await this.query(
      `update medications
       set name = $2,
           dose = $3,
           form = $4,
           scheduled_time = $5::time,
           taken_date = $6::date,
           course_end_date = $8::date,
           status = $7,
           confirmed_at = case when $7 in ('pending', 'upcoming') then null else confirmed_at end,
           updated_at = now()
       where id = $1
       returning *`,
      [id, name, dose, form, scheduledTime, takenDate, status, endDate]
    );
    if (!result.rows[0]) return null;
    await this.query(
      "delete from medication_email_notifications where medication_id = $1",
      [id]
    );
    await this.query(
      "insert into audit_logs (actor_id, action, target_id) values ($1, 'update_medication_schedule', $2)",
      [actorId || null, id]
    );
    return mapMedication(result.rows[0]);
  }

  async deleteMedication(id, actorId) {
    const result = await this.query("delete from medications where id = $1 returning id", [id]);
    if (!result.rows[0]) return false;
    await this.query(
      "insert into audit_logs (actor_id, action, target_id) values ($1, 'delete_medication_schedule', $2)",
      [actorId || null, id]
    );
    return true;
  }

  async getNurseOverview() {
    const patients = await this.query(
      `${this.patientSelectSql()}
       where p.status = 'active'
       order by p.created_at`
    );
    const rows = patients.rows.map(mapPatient);
    const pending = await this.query("select count(*)::int as count from medications where status = 'pending' and taken_date = current_date");
    return {
      updatedAt: new Date().toISOString(),
      summary: {
        totalActive: rows.length,
        highCompliance: rows.filter(item => item.adherenceScore >= 90).length,
        mediumCompliance: rows.filter(item => item.adherenceScore >= 70 && item.adherenceScore < 90).length,
        lowCompliance: rows.filter(item => item.adherenceScore < 70).length,
        pendingMedication: pending.rows[0]?.count || 0
      },
      patients: rows
    };
  }

  async listEducation() {
    const result = await this.query(
      "select id, title, category, summary from education order by created_at, title"
    );
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      summary: row.summary
    }));
  }

  async listMotivations() {
    const result = await this.query(
      "select id, message, created_at from motivations order by created_at desc"
    );
    return result.rows.map(row => ({
      id: row.id,
      message: row.message,
      createdAt: row.created_at
    }));
  }

  async updatePatient(id, input) {
    const name = String(input.name || "").trim();
    const googleEmail = String(input.googleEmail || "").trim() || null;
    const phase = String(input.phase || "Intensif").trim();
    const treatmentDay = Number(input.treatmentDay || 1);
    const treatmentTargetDays = Number(input.treatmentTargetDays || 180);
    const adherenceScore = Number(input.adherenceScore || 0);
    const selfEfficacyScore = Number(input.selfEfficacyScore || 0);
    if (!name) throw new Error("Nama pasien wajib diisi");
    const result = await this.query(
      `update patients
       set name = $2,
           google_email = $3,
           phase = $4,
           treatment_day = greatest(1, $5),
           treatment_target_days = greatest(1, $6),
           adherence_score = greatest(0, least(100, $7)),
           self_efficacy_score = greatest(0, least(100, $8)),
           risk_level = case
             when $7 >= 90 then 'low'
             when $7 >= 70 then 'medium'
             else 'high'
           end,
           updated_at = now()
       where id = $1
       returning *`,
      [id, name, googleEmail, phase, treatmentDay, treatmentTargetDays, adherenceScore, selfEfficacyScore]
    );
    return mapPatient(result.rows[0]);
  }

  async deactivatePatient(id, actorId) {
    const result = await this.query(
      "update patients set status = 'inactive', updated_at = now() where id = $1 returning id",
      [id]
    );
    if (!result.rows[0]) return false;
    await this.query(
      "insert into audit_logs (actor_id, action, target_id) values ($1, 'deactivate_patient', $2)",
      [actorId || null, id]
    );
    return true;
  }

  async createPatient(input, nurseId) {
    const name = String(input.name || "").trim();
    const googleEmail = String(input.googleEmail || "").trim() || null;
    const phase = String(input.phase || "Intensif").trim();
    const treatmentDay = Number(input.treatmentDay || 1);
    const treatmentTargetDays = Number(input.treatmentTargetDays || 180);
    if (!name) throw new Error("Nama pasien wajib diisi");

    const patient = await this.query(
      `insert into patients (
         nurse_id, medical_record_number, name, phase, treatment_day,
         treatment_target_days, adherence_score, self_efficacy_score,
         risk_level, google_email, status
       )
       values (
         $1,
         'TB-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5($2 || now()::text), 1, 6)),
         $2,
         $3,
         greatest(1, $5),
         greatest(1, $6),
         0,
         0,
         'medium',
         $4,
         'active'
       )
       returning *`,
      [nurseId || null, name, phase, googleEmail, treatmentDay, treatmentTargetDays]
    );

    await this.query(
      `insert into medications (patient_id, name, dose, form, scheduled_time, status, taken_date)
       values
         ($1, 'Rifampicin', '450mg', '1 Kapsul', '07:00', 'pending', current_date),
         ($1, 'Isoniazid', '300mg', '1 Tablet', '13:00', 'upcoming', current_date),
         ($1, 'Ethambutol', '750mg', '2 Tablet', '20:00', 'upcoming', current_date)`,
      [patient.rows[0].id]
    );

    return mapPatient(patient.rows[0]);
  }

  async listChat(patientId) {
    const result = await this.query(
      "select * from chat_messages where patient_id = $1 order by created_at",
      [patientId]
    );
    return result.rows.map(mapChat);
  }

  async addChatMessage({ patientId, sender, message, topic }) {
    const result = await this.query(
      `insert into chat_messages (patient_id, sender, message, topic)
       values ($1, $2, $3, $4)
       returning *`,
      [patientId, sender, message, topic || "general"]
    );
    return mapChat(result.rows[0]);
  }
}

module.exports = { PostgresStore };
