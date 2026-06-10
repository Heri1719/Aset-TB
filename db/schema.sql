CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('patient', 'nurse')),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  google_sub text UNIQUE,
  avatar_url text,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  nurse_id uuid REFERENCES users(id) ON DELETE SET NULL,
  medical_record_number text NOT NULL UNIQUE,
  name text NOT NULL,
  phase text NOT NULL DEFAULT 'Intensif',
  treatment_day integer NOT NULL DEFAULT 1,
  treatment_target_days integer NOT NULL DEFAULT 180,
  adherence_score integer NOT NULL DEFAULT 0 CHECK (adherence_score BETWEEN 0 AND 100),
  self_efficacy_score integer NOT NULL DEFAULT 0 CHECK (self_efficacy_score BETWEEN 0 AND 100),
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  google_email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  dose text NOT NULL,
  form text NOT NULL,
  scheduled_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('taken', 'late', 'pending', 'upcoming')),
  confirmed_at time,
  taken_date date NOT NULL DEFAULT CURRENT_DATE,
  schedule_group_id uuid,
  course_end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS motivations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user', 'assistant')),
  message text NOT NULL,
  topic text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS self_efficacy_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medication_email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  notification_type text NOT NULL DEFAULT 'five_minute_reminder',
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE (medication_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient_date ON medications(patient_id, taken_date);
CREATE INDEX IF NOT EXISTS idx_medications_schedule_group ON medications(schedule_group_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_patient_created ON chat_messages(patient_id, created_at);

INSERT INTO users (id, role, name, email, google_sub, avatar_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'patient', 'Bapak Ahmad Santoso', 'ahmad@example.com', NULL, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCX7SqghtUdM2EF8VNZkKllrSZeVPL1arAB5bc-I12V9bDcAa5NyArBsh2u_M9wofmgnFixSwqtnlQTLX8CBz7Biq3PXHtEpbrcz8rps8XP4jiOE1smZjTFWq627HdO4hQ9y_tbWdP3ZGGxzE_McNu_TeybVRBd2YVHX9N4scYE3IQ8I0gtla6k1l1q97chEffVeKpqPHM2Hq4Zoy5PuSYfMM4rlJgqWOWtCtK5eadkwbZr8xSWrvX5VlEjgDBrd4qguyBvIgixHqsZ'),
  ('00000000-0000-0000-0000-000000000101', 'nurse', 'Ns. Heri Nur Cahyanto', 'hcahyanto@ikbis.ac.id', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO patients (
  id, user_id, nurse_id, medical_record_number, name, phase, treatment_day,
  treatment_target_days, adherence_score, self_efficacy_score, risk_level,
  google_email, status
)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'TB-2024-001', 'Bapak Ahmad Santoso', 'Intensif', 45, 180, 92, 86, 'low', 'ahmad@example.com', 'active'),
  ('10000000-0000-0000-0000-000000000002', NULL, '00000000-0000-0000-0000-000000000101', 'TB-2024-002', 'Ibu Rina Wijaya', 'Lanjutan', 102, 180, 78, 74, 'medium', 'rina@example.com', 'active'),
  ('10000000-0000-0000-0000-000000000003', NULL, '00000000-0000-0000-0000-000000000101', 'TB-2024-003', 'Sdr. Dimas Pratama', 'Intensif', 23, 180, 64, 68, 'high', NULL, 'active')
ON CONFLICT (medical_record_number) DO NOTHING;

INSERT INTO medications (id, patient_id, name, dose, form, scheduled_time, status, confirmed_at, taken_date, schedule_group_id, course_end_date)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Rifampicin', '450mg', '1 Kapsul', '07:00', 'taken', '07:05', CURRENT_DATE, '20000000-0000-0000-0000-000000000001', CURRENT_DATE + interval '60 days'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Isoniazid', '300mg', '1 Tablet', '13:00', 'pending', NULL, CURRENT_DATE, '20000000-0000-0000-0000-000000000002', CURRENT_DATE + interval '60 days'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Ethambutol', '750mg', '2 Tablet', '20:00', 'upcoming', NULL, CURRENT_DATE, '20000000-0000-0000-0000-000000000003', CURRENT_DATE + interval '60 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO education (title, category, summary)
VALUES
  ('Mengapa obat TB harus diminum teratur?', 'Kepatuhan', 'Pengobatan teratur membantu membunuh kuman TB sepenuhnya dan mencegah resistensi obat.'),
  ('Efek samping yang perlu diwaspadai', 'Keamanan', 'Segera hubungi tenaga kesehatan bila muncul mata kuning, muntah berat, sesak, ruam luas, atau lemas berat.')
ON CONFLICT DO NOTHING;

INSERT INTO motivations (message)
VALUES
  ('Setiap obat yang diminum hari ini adalah langkah menuju kesembuhan.'),
  ('Konsistensi kecil setiap hari bisa membawa perubahan besar untuk kesehatan Anda.'),
  ('Tidak harus sempurna. Cukup lanjutkan satu jadwal obat lagi hari ini.'),
  ('Tubuh Anda sedang berjuang, dan kepatuhan Anda membantu pengobatan bekerja.'),
  ('Konfirmasi kecil hari ini menjadi bukti besar bahwa Anda terus bergerak maju.')
ON CONFLICT DO NOTHING;

INSERT INTO chat_messages (id, patient_id, sender, message, topic, created_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'assistant', 'Halo! Saya siap membantu Anda hari ini. Ada yang ingin Anda tanyakan seputar perawatan TB Anda?', 'general', now() - interval '3 minutes'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'user', 'Terima kasih. Saya merasa sedikit mual hari ini.', 'side_effect', now() - interval '2 minutes'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'assistant', 'Mual ringan terkadang bisa terjadi di awal pengobatan. Cobalah minum obat setelah makan ringan. Jika mual menetap, muntah berat, mata kuning, atau tubuh sangat lemas, segera hubungi klinik.', 'side_effect', now() - interval '1 minute')
ON CONFLICT (id) DO NOTHING;
