# PRD — Noteling (working name)

> Note taker + daily journal yang terasa seperti main, bukan kerja.

| | |
|---|---|
| Status | Draft v1, menunggu review |
| Tanggal | 2026-09-26 |
| Bahasa UI | English |
| Platform | Web responsive, installable sebagai PWA |

---

## 1. Latar Belakang & Masalah

Orang sering lupa hal kecil: barang yang harus dibeli, tugas dengan deadline, jadwal kegiatan. Aplikasi to-do yang ada umumnya fungsional tetapi membosankan, sehingga jarang dipakai konsisten. Aplikasi jurnal juga cenderung ditinggalkan setelah beberapa hari karena tidak ada dorongan untuk kembali.

**Hipotesis produk:** kalau pencatatan, pengingat, dan jurnal dibungkus dengan feedback yang menyenangkan (maskot yang bereaksi, streak, animasi, ambience), user akan lebih konsisten kembali ke app.

> Catatan: hipotesis ini belum divalidasi dengan data user. Metrik di §9 dipakai untuk mengujinya.

## 2. Tujuan

1. User bisa mencatat apa pun dalam bentuk list dengan friksi minimal (≤ 3 tap untuk membuat catatan baru).
2. Tidak ada deadline atau jadwal yang terlewat tanpa diingatkan.
3. User membangun kebiasaan journaling harian (streak).
4. Pengalaman terasa hidup, personal, dan menyenangkan.

### Non-goals (v1)

- Kolaborasi atau sharing catatan antar user.
- Native mobile app (cukup PWA).
- Offline-first sync penuh.
- Lampiran file/gambar.
- End-to-end encryption.
- Kategorisasi berbasis LLM (disiapkan interface-nya, tetapi tidak diimplementasikan).
- Reminder via email.
- Multi-bahasa (i18n).

## 3. Target User & Persona

- **Mahasiswa atau pekerja muda (18–30 tahun)** dengan banyak tugas dan jadwal, yang suka app dengan estetika playful.
- **Journaler kasual** yang ingin refleksi harian tanpa tekanan menulis panjang.

**Skenario utama**

- *"Aku mau belanja bulanan"* → buat list barang, centang satu per satu di toko.
- *"Tugas Data Mining dikumpulkan Jumat 23:59"* → buat tugas dengan deadline dan reminder, lalu dapat notifikasi H-1 dan 1 jam sebelum deadline.
- *"Hari ini capek tapi seneng"* → tulis jurnal singkat, pilih mood 😊, streak naik, dan maskot ikut senang.

---

## 4. Scope Fitur

Prioritas: **P0** = wajib di v1, **P1** = masuk v1 bila waktu cukup, **P2** = backlog.

### 4.1 Autentikasi & Akun — P0

| ID | Requirement |
|---|---|
| AUTH-1 | Sign up dengan email dan password (minimal 8 karakter), disertai verifikasi email. |
| AUTH-2 | Login/logout, dengan session persisten (cookie httpOnly via Supabase SSR). |
| AUTH-3 | Forgot password: kirim link reset ke email, lalu halaman untuk set password baru. |
| AUTH-4 | Onboarding singkat setelah sign up: pilih nama panggilan, timezone (auto-detect), tema, dan nama maskot. |
| AUTH-5 | Isolasi data: setiap user hanya bisa membaca atau menulis datanya sendiri. Aturan ini ditegakkan di level database (Row Level Security), bukan hanya di UI. |
| AUTH-6 | Halaman Settings: ubah nama, timezone, password, preferensi notifikasi, dan hapus akun. |

### 4.2 Notes (List) — P0

Konsep: satu **Note** adalah sebuah list yang berisi banyak **Item**.

| ID | Requirement |
|---|---|
| NOTE-1 | CRUD Note: judul, deskripsi opsional, tipe, warna/emoji, pin, dan archive. |
| NOTE-2 | Tipe Note: `checklist` (barang, belanja), `tasks` (tugas dengan deadline), `schedule` (kegiatan dengan waktu), `free` (list bebas). Tipe hanya mengubah field default yang ditampilkan; strukturnya tetap sama. |
| NOTE-3 | CRUD Item di dalam Note: teks, `is_done`, urutan (drag-to-reorder), serta opsional `due_at`, `remind_at`, dan quantity (untuk checklist). |
| NOTE-4 | Checklist: tap untuk menandai item selesai, disertai animasi dan micro-reward. Jika semua item selesai, Note otomatis berstatus *completed* dengan confetti. User tetap bisa un-check. |
| NOTE-5 | Status Note: `active`, `completed`, `archived`. |
| NOTE-6 | Smart date parsing: teks seperti "submit report tomorrow 5pm" otomatis menyarankan `due_at` (library `chrono-node`, English). User bisa menerima atau mengabaikan saran tersebut. |
| NOTE-7 | Dashboard: filter berdasarkan kategori, status, dan tipe; search full-text sederhana pada judul dan item; sort by deadline, updated, atau created. |
| NOTE-8 | Section "Today" dan "Upcoming" di Home: item dengan `due_at` hari ini atau dalam 7 hari ke depan, serta item yang overdue. |
| NOTE-9 (P1) | Recurring item (daily/weekly), misalnya "minum vitamin". |

### 4.3 Kategori — P0

| ID | Requirement |
|---|---|
| CAT-1 | Kategori default dibuat saat sign up: Shopping, Tasks, Work, Study, Events, Health, Finance, Ideas, Travel, Personal. Masing-masing punya emoji, warna, dan daftar keyword. |
| CAT-2 | **Deteksi otomatis (rule-based):** judul dan teks item di-tokenize lalu dicocokkan dengan keyword setiap kategori. Skor dihitung dari jumlah kecocokan dan bobot keyword. Kategori dengan skor di atas threshold ditambahkan dengan `source = auto`. Deteksi berjalan saat create dan saat edit, selama user belum mengubah kategori secara manual. |
| CAT-3 | Satu Note bisa punya lebih dari satu kategori (many-to-many). User bisa menghapus kategori auto atau menambah kategori secara manual (`source = manual`). Setelah user mengubah kategori secara manual, auto-detect tidak lagi menimpa kategori note tersebut. |
| CAT-4 | Kelola kategori: CRUD nama, emoji, warna, dan keyword. User bisa mengajari detector dengan menambah keyword sendiri. Kategori yang dihapus dilepas dari semua note, tetapi note-nya tidak ikut terhapus. |
| CAT-5 | Detector dibungkus di balik interface `categorize(text) → suggestions[]`, sehingga nanti bisa diganti dengan LLM tanpa mengubah UI. |

### 4.4 Pengingat Otomatis — P0

| ID | Requirement |
|---|---|
| REM-1 | Item dengan `due_at` otomatis mendapat reminder default (dapat diatur di Settings, default: H-1 dan 1 jam sebelum). User bisa override per item. |
| REM-2 | Item bertipe `schedule` diingatkan X menit sebelum waktu mulai (default 30 menit). |
| REM-3 | **In-app:** bell icon dengan badge, notification center (list, mark as read), dan toast saat app terbuka. |
| REM-4 | **Browser push (Web Push + VAPID):** user opt-in dari Settings atau prompt kontekstual saat pertama kali membuat deadline. Notifikasi push memuat judul item dan deep link ke note terkait. |
| REM-5 | Reminder batal atau dijadwalkan ulang otomatis bila item selesai, dihapus, atau `due_at` berubah. |
| REM-6 | Aksi di notifikasi (P1): "Mark done" dan "Snooze 1h". |
| REM-7 | Daily nudge opsional: pengingat menulis jurnal pada jam yang dipilih user jika hari itu belum menulis. |

### 4.5 Jurnal Harian — P0

| ID | Requirement |
|---|---|
| JRN-1 | Satu entri per tanggal lokal user (unique `user_id + entry_date`). Entri hari ini bisa diedit kapan saja pada hari itu. Entri hari sebelumnya tetap bisa diedit, tetapi tidak mempengaruhi streak. |
| JRN-2 | Editor teks dengan formatting ringan (bold, italic, list) dan autosave. |
| JRN-3 | Mood picker: 5 level (😭 😔 😐 🙂 🤩), masing-masing dengan warna. Opsional ditambah tag perasaan (grateful, tired, anxious, excited, ...). |
| JRN-4 | Daily prompt opsional (misalnya "What made you smile today?"), diambil acak dari pool prompt. |
| JRN-5 | List jurnal: tampilan timeline dan kalender, dengan filter mood serta search. |
| JRN-6 | Jurnal bersifat privat. Tidak ada fitur share. |

### 4.6 Streak — P0

| ID | Requirement |
|---|---|
| STK-1 | Streak = jumlah hari berturut-turut (menurut timezone user) dengan entri jurnal yang dibuat pada hari itu. |
| STK-2 | Tampilan: current streak, longest streak, dan animasi api 🔥 yang makin besar di milestone 3, 7, 14, 30, 100, dan 365 hari. |
| STK-3 | Streak freeze (P1): 1 freeze didapat setiap 7 hari streak (maksimal 2 disimpan). Freeze otomatis terpakai untuk menjaga streak jika user melewatkan 1 hari. |
| STK-4 | Streak dihitung di server (SQL function) agar konsisten dan tidak bisa dimanipulasi dari client. |

### 4.7 Tema & Suasana — P0

| ID | Requirement |
|---|---|
| THM-1 | Tema warna: minimal 5 preset (misalnya *Sunny Pastel*, *Ocean Breeze*, *Forest Cozy*, *Candy Pop*, *Midnight*), masing-masing dalam mode light dan dark. Implementasi via CSS variables. |
| THM-2 | Suasana (vibe): background animasi ringan yang bisa dipilih, seperti none, floating bubbles, falling leaves, starry night, dan rain. Tersedia toggle reduce motion, dan preferensi `prefers-reduced-motion` dihormati. |
| THM-3 | Preferensi tema disimpan di profil, sehingga sinkron antar device. |

### 4.8 Pesan Penyemangat — P0

| ID | Requirement |
|---|---|
| MSG-1 | Pesan tampil di Home dan saat event tertentu. Pesan kontekstual berdasarkan: waktu (pagi/siang/malam), mood terakhir, streak, jumlah tugas overdue, dan note yang baru saja selesai. |
| MSG-2 | Pool pesan dikurasi statis (JSON, ± 150 pesan) dengan tag konteks. Pemilihan dilakukan secara random dengan bobot sesuai konteks, dan pesan tidak diulang dalam 7 hari terakhir. |
| MSG-3 | Tone: hangat dan playful, tidak menggurui. Untuk mood rendah, pesan bersifat suportif, bukan "tetap semangat!" yang terkesan dipaksakan. |
| MSG-4 | Disampaikan lewat maskot (speech bubble). |

### 4.9 Fitur Hiburan

#### 4.9.1 Maskot / Pet Virtual — P0

| ID | Requirement |
|---|---|
| PET-1 | Maskot SVG dengan animasi idle (bernapas, berkedip) dan nama yang dipilih user. |
| PET-2 | **Mood maskot** berasal dari aktivitas: menulis jurnal hari ini, tugas yang selesai, dan item overdue. Terdapat 5 state: ecstatic, happy, neutral, sleepy, dan sad. Maskot tidak pernah "mati" atau menghukum; paling buruk hanya sleepy/sad dan langsung ceria lagi ketika user kembali. |
| PET-3 | **Evolusi**: maskot tumbuh (egg → baby → teen → adult) berdasarkan total hari aktif, bukan streak, agar tidak hilang saat streak putus. |
| PET-4 | Interaksi: tap maskot untuk memicu reaksi random dan pesan penyemangat. |
| PET-5 (P1) | Aksesori yang terbuka di milestone (topi, kacamata, syal) dan bisa dipakaikan. |

#### 4.9.2 Focus Timer + Ambient — P0

| ID | Requirement |
|---|---|
| FOC-1 | Pomodoro timer (default 25/5, dapat dikonfigurasi) yang bisa dikaitkan ke satu item tugas. |
| FOC-2 | Ambient sound **dihasilkan di browser via Web Audio API** (white/pink/brown noise, rain, dan wind dari noise yang difilter). Tidak ada file audio sehingga tidak ada isu lisensi dan bandwidth. Tersedia mixer volume per layer. |
| FOC-3 | Selesai 1 sesi → maskot bereaksi, dan sesi dicatat (`focus_sessions`) untuk statistik harian. |
| FOC-4 | Timer tetap akurat saat tab di background (berbasis timestamp, bukan `setInterval` counter), dan memunculkan notifikasi ketika selesai. |

> Lofi music tidak masuk v1. Musik lofi membutuhkan aset berlisensi, dan saya tidak akan menambahkan file audio yang lisensinya belum jelas.

#### 4.9.3 Year in Pixels — P0

| ID | Requirement |
|---|---|
| PIX-1 | Grid 12 × 31 (bulan × tanggal). Setiap sel diberi warna sesuai mood jurnal hari itu, sedangkan hari tanpa jurnal dibiarkan kosong. |
| PIX-2 | Hover/tap sel menampilkan preview jurnal, lalu klik untuk membukanya. |
| PIX-3 | Selector tahun dan ringkasan distribusi mood (bar sederhana). |
| PIX-4 | Export sebagai gambar PNG (P1). |

#### 4.9.4 Time Capsule — P0

| ID | Requirement |
|---|---|
| CAP-1 | Tulis surat untuk diri sendiri dengan tanggal buka (minimal 1 minggu ke depan). |
| CAP-2 | Sebelum tanggal buka, kapsul tampil terkunci dengan countdown. **Isinya tidak dikirim ke client**: isi hanya bisa diambil lewat SQL function yang memeriksa `open_at <= now()`. |
| CAP-3 | Saat tanggal tiba: notifikasi, lalu animasi "membuka kapsul". |
| CAP-4 | Kapsul tidak bisa diedit setelah dikunci, tetapi bisa dihapus. |

### 4.10 Gamifikasi ringan (pendukung, bukan fitur utama)

Anda tidak memilih XP & badge, jadi sistem level tidak saya buat. Yang tetap ada hanya **micro-reward** yang dibutuhkan fitur lain: confetti saat note selesai, animasi centang, milestone streak, dan evolusi maskot.

---

## 5. UX & Visual Direction

- **Personality:** playful, cozy, dan rounded. Elemennya meliputi sudut membulat besar, bayangan lembut, warna pastel (atau neon lembut di tema Midnight), dan font display yang bulat (misalnya *Fredoka* atau *Nunito* dari Google Fonts) dipadukan dengan font body yang mudah dibaca.
- **Motion:** setiap aksi punya feedback (spring animation saat centang, bounce saat menambah item, dan confetti di momen besar). Durasi animasi singkat (< 400 ms) agar tidak menghambat. Seluruh animasi mengikuti setting *reduce motion*.
- **Sound effects (opsional, default off):** "pop" saat centang, dihasilkan via Web Audio.
- **Navigasi:** bottom nav di mobile (Home, Notes, Journal, Focus, Me) dan sidebar di desktop. Tersedia Floating Action Button "+" untuk quick add.
- **Quick add:** satu input di Home yang otomatis mendeteksi kategori dan tanggal dari teks, dilengkapi preview chip sebelum disimpan.
- **Empty states** yang lucu, dengan ilustrasi maskot dan ajakan aksi (bukan layar kosong).
- **Aksesibilitas:** kontras warna memenuhi WCAG AA di semua tema, navigasi keyboard, label ARIA, dan target sentuh minimal 44 px.

### Struktur halaman

```
/                 Landing (belum login)
/login /signup /forgot-password /reset-password
/onboarding
/home             Greeting + maskot + pesan, Today/Upcoming, quick add, streak
/notes            Daftar note (filter, search)
/notes/[id]       Detail note + items
/categories       Kelola kategori
/journal          Timeline/kalender jurnal
/journal/[date]   Editor jurnal + mood
/pixels           Year in Pixels
/capsules         Time capsule
/focus            Focus timer + ambient mixer
/notifications    Notification center
/settings         Profil, tema, vibe, notifikasi, akun
```

---

## 6. Arsitektur Teknis

### 6.1 Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js** (App Router, TypeScript) | Fullstack dalam satu repo (UI + API routes/Server Actions), deploy mudah di Vercel. |
| Styling | **Tailwind CSS** + CSS variables untuk tema | Mudah dipakai untuk theming multi-preset. |
| Animasi | **motion** (sebelumnya Framer Motion), **canvas-confetti** | Spring animation dan confetti. |
| Icons | **lucide-react** | Gratis dan konsisten. |
| Backend/DB | **Supabase**: Postgres, Auth, Row Level Security, pg_cron | Menyediakan auth dan reset password bawaan, RLS untuk isolasi data, dan punya free tier. |
| Validasi | **zod** | Validasi input di server. |
| Date parsing | **chrono-node** | Natural language date (English). |
| Push | **web-push** (Node) + Service Worker + VAPID | Standar Web Push tanpa vendor lock-in. |
| Hosting | **Vercel** (Hobby) + **Supabase** (Free) | Keduanya gratis untuk skala personal. |
| Testing | Vitest (unit: detector, streak, parser) + Playwright (E2E alur utama) | |

Versi terbaru di npm per hari ini: `next` 16.3.6, `@supabase/supabase-js` 2.117.2, `@supabase/ssr` 0.12.7, `tailwindcss` 4.3.3, `motion` 13.4.4, `chrono-node` 2.10.1, `web-push` 3.6.7, `zod` 4.6.5. Versi dikunci di `package-lock.json` saat implementasi.

### 6.2 Alur Reminder

```
item.due_at berubah ──► trigger DB membuat/mengupdate baris di `reminders` (status=pending)

pg_cron (tiap 1 menit) ──► pg_net POST /api/cron/reminders (header: CRON_SECRET)
                               │
                               ├─ ambil reminders pending dengan fire_at <= now()
                               ├─ insert ke `notifications` (in-app)
                               ├─ kirim Web Push ke semua push_subscriptions user
                               │    (hapus subscription yang 404/410)
                               └─ tandai reminder sent
```

Alasannya: Vercel Cron di plan Hobby setahu saya dibatasi frekuensinya (*this needs verification*), sehingga penjadwalan dipindahkan ke `pg_cron` di Supabase. Library `web-push` dijalankan di Node runtime Next.js untuk menghindari isu kompatibilitas Deno di Edge Functions.

### 6.3 Data Model (ringkas)

```
profiles          id(=auth.uid) , display_name, timezone, theme, vibe, reduce_motion,
                  pet_name, reminder_defaults(jsonb), journal_nudge_time, created_at
categories        id, user_id, name, emoji, color, keywords text[], is_default
notes             id, user_id, title, description, type, emoji, color,
                  status, pinned, categories_locked bool, created_at, updated_at
note_categories   note_id, category_id, source('auto'|'manual')   PK(note_id, category_id)
note_items        id, note_id, user_id, text, is_done, done_at, position,
                  quantity, due_at, remind_offsets int[], recurrence
reminders         id, user_id, item_id, fire_at, status('pending'|'sent'|'cancelled')
notifications     id, user_id, title, body, link, read_at, created_at
push_subscriptions id, user_id, endpoint UNIQUE, p256dh, auth, user_agent
journal_entries   id, user_id, entry_date date, content, mood smallint(1-5),
                  feelings text[], prompt, created_at, updated_at   UNIQUE(user_id, entry_date)
streak_freezes    user_id, available, used_dates date[]
pet_state         user_id, stage, total_active_days, accessories, equipped
focus_sessions    id, user_id, item_id?, started_at, duration_min, completed
time_capsules     id, user_id, title, content, open_at, opened_at, created_at
message_history   user_id, message_id, shown_at
```

**Security**

- RLS aktif di **semua** tabel dengan policy `user_id = auth.uid()`.
- `time_capsules.content`: hak `SELECT` pada kolom tersebut dicabut dari role `authenticated`. Isi hanya bisa dibaca lewat function `open_capsule(id)` yang memeriksa `open_at`.
- Service role key hanya dipakai di route cron (server-side), yang diproteksi `CRON_SECRET`.
- Semua input divalidasi dengan zod di Server Actions.
- Konten user dirender sebagai teks/markdown yang sudah disanitasi, tanpa `dangerouslySetInnerHTML` dari input mentah.
- Security headers (CSP, dan lainnya) dipasang di `next.config`.
- Rate limiting auth ditangani Supabase Auth.

### 6.4 Environment variables

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        (server only)
NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
CRON_SECRET
NEXT_PUBLIC_SITE_URL
```

---

## 7. Non-Functional Requirements

- **Performance:** LCP < 2.5 s di koneksi 4G untuk halaman Home, dan interaksi centang terasa instan (optimistic UI).
- **Responsif:** layout mulai dari lebar 360 px hingga desktop.
- **PWA:** manifest, ikon, dan service worker (untuk push dan install).
- **Privacy:** tidak ada analytics pihak ketiga di v1. Data jurnal tidak keluar dari Supabase.
- **Reliability:** reminder terkirim paling lambat ±1–2 menit dari `fire_at`, karena cron berjalan setiap 1 menit.

## 8. Milestones

| # | Milestone | Isi |
|---|---|---|
| M0 | Setup | Scaffold Next.js, Tailwind, Supabase client, migrasi SQL, CI lint/typecheck/test |
| M1 | Auth | Sign up/in/out, forgot/reset password, onboarding, RLS, seed kategori default |
| M2 | Notes & Kategori | CRUD note/item, checklist, status, detector rule-based, kelola kategori, smart date |
| M3 | Reminder | Tabel reminders + trigger, cron route, notification center, Web Push + service worker |
| M4 | Jurnal & Streak | Editor, mood, list/kalender, streak function, streak freeze (P1) |
| M5 | Vibe | Tema, background animasi, pesan penyemangat |
| M6 | Fun | Maskot + evolusi, focus timer + ambient, Year in Pixels, Time Capsule |
| M7 | Polish & Deploy | Aksesibilitas, empty states, E2E test, dokumentasi setup, deploy |

## 9. Metrik Keberhasilan

- **Aktivasi:** ≥ 60% user baru membuat minimal 1 note dan 1 jurnal pada hari pertama.
- **Retensi:** D7 retention (user yang kembali di hari ke-7).
- **Kebiasaan:** median current streak jurnal dari user aktif.
- **Reminder efficacy:** persentase item ber-deadline yang ditandai selesai sebelum `due_at`.

> Angka target di atas adalah asumsi awal, bukan benchmark dari sumber mana pun. Karena tidak ada analytics pihak ketiga, metrik diukur via query SQL agregat.

## 10. Risiko & Keterbatasan

| Risiko | Mitigasi |
|---|---|
| Web Push di iOS hanya jalan bila app di-install ke Home Screen (PWA) | Tampilkan panduan "Add to Home Screen" di iOS. In-app notification tetap menjadi fallback. |
| Email bawaan Supabase Auth punya rate limit rendah dan tidak ditujukan untuk production (*this needs verification* untuk angka limitnya) | Untuk production, konfigurasikan custom SMTP (misalnya Resend free tier). |
| Project Supabase free tier bisa di-pause saat tidak aktif (*this needs verification* untuk kebijakan terbaru) | Dicatat di README. Untuk skala personal, dampaknya dapat diterima. |
| Detector rule-based salah kategori untuk teks ambigu | User bisa koreksi dan menambah keyword. Koreksi manual bersifat final (lock). |
| Timezone salah akan merusak perhitungan streak | Timezone di-auto-detect saat onboarding, bisa diubah di Settings, dan semua perhitungan tanggal dilakukan di server dengan timezone profil. |
| Animasi berlebihan membuat app terasa lambat atau mengganggu | Ada toggle reduce motion, animasi dibuat ringan (CSS/transform), dan vibe background default diset ke ringan. |

## 11. Yang dibutuhkan dari Anda

1. **Akun Supabase dan Vercel** (gratis). Saya tidak bisa membuat akun atas nama Anda. Kode akan berisi migrasi SQL dan panduan setup step-by-step. Anda cukup membuat project, lalu mengisi env vars.
2. Konfirmasi nama app (*Noteling* hanya working name) dan nama default maskot.
3. Review PRD ini, terutama prioritas P0/P1.
