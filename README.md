# Tuckbury

> Tuck it away. Never forget.

Note taker dan jurnal harian dengan sidekick tupai. Fiturnya: list untuk segala hal, deteksi kategori otomatis, pengingat deadline (in-app dan push), jurnal dengan mood dan streak, tema dan vibe, pesan penyemangat, maskot yang berevolusi, focus timer dengan ambience, Year in Pixels, dan Time Capsule.

Spesifikasi produk ada di [`docs/PRD.md`](docs/PRD.md).

## Tech stack

- **Next.js 16** (App Router, Server Actions, TypeScript) + **Tailwind CSS 4** + **motion**
- **Supabase**: Postgres dengan Row Level Security, Auth (email + password + reset), `pg_cron` + `pg_net` untuk penjadwal reminder
- **Web Push** (VAPID, `web-push`) + service worker, bisa di-install sebagai PWA
- Hosting: **Vercel** (Hobby) + **Supabase** (Free)

## Setup

### 1. Supabase

1. Buat project baru di [supabase.com](https://supabase.com). Region yang dekat dengan user (misalnya Singapore) memberi latency terendah.
2. Buka **SQL Editor**, paste seluruh isi [`supabase/migrations/20260926000000_init.sql`](supabase/migrations/20260926000000_init.sql), lalu **Run**.
3. Buka **Project Settings → API** dan catat tiga nilai ini:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` / secret key → `SUPABASE_SERVICE_ROLE_KEY` (**rahasia**, jangan dibagikan)
4. **Template email tidak perlu diubah.** Tujuan link konfirmasi diatur dari kode (`emailRedirectTo` di `src/actions/auth.ts`), bukan dari template, jadi template bawaan Supabase sudah otomatis mengarah ke `/auth/confirm` milik app ini.

   Satu keterbatasan: link bawaan memakai alur PKCE, sehingga **harus dibuka di browser yang sama** dengan saat mendaftar. Kalau dibuka di device lain, user diarahkan ke `/login?error=link` dan perlu mengulang.

   Untuk menghilangkan keterbatasan itu, Anda harus memasang custom SMTP dulu (lihat §5), karena Supabase mengunci pengeditan template di balik SMTP. Setelah SMTP aktif, buka **Authentication → Emails → Templates** dan ganti link-nya:
   - *Confirm signup*:
     `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding">Confirm your email</a>`
   - *Reset password*:
     `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset your password</a>`

### 2. Kunci tambahan

```bash
npx web-push generate-vapid-keys   # → NEXT_PUBLIC_VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY
openssl rand -hex 32               # → CRON_SECRET
```

### 3. Vercel

1. **Add New → Project**, import repo ini. Framework akan terdeteksi otomatis sebagai Next.js.
2. Di **Environment Variables**, isi semua variabel dari [`.env.example`](.env.example). `NEXT_PUBLIC_SITE_URL` diisi domain Vercel Anda, misalnya `https://tuckbury.vercel.app`.
3. Klik **Deploy**. Kalau domain baru diketahui setelah deploy pertama, perbarui `NEXT_PUBLIC_SITE_URL`, lalu **Redeploy**.

### 4. Hubungkan Supabase ke domain

1. Buka Supabase **Authentication → URL Configuration**.
   - **Site URL**: `https://<domain-anda>`
   - **Redirect URLs**: `https://<domain-anda>/**` (tambahkan juga `http://localhost:3000/**` untuk development)
2. Buka [`supabase/cron.sql`](supabase/cron.sql) dan ganti dua placeholder (URL app dan `CRON_SECRET`), lalu jalankan di SQL Editor. Script ini mengaktifkan `pg_cron` dan `pg_net`, lalu memanggil `/api/cron/reminders` setiap menit.
3. Cek hasilnya: `select * from net._http_response order by created desc limit 5;` harus menunjukkan status `200`.

### 5. Email untuk production

Email bawaan Supabase dibatasi ketat dan dimaksudkan untuk uji coba. Untuk user sungguhan, pasang SMTP sendiri (misalnya Resend) di **Authentication → Emails → SMTP Settings**.

## Development lokal

```bash
cp .env.example .env.local   # isi nilainya
npm install
npm run dev                  # http://localhost:3000
```

| Perintah            | Fungsi                              |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Dev server                          |
| `npm run build`     | Production build                    |
| `npm run lint`      | ESLint                              |
| `npm run typecheck` | Generate route types + `tsc`        |
| `npm test`          | Unit test (Vitest)                  |

Reminder in-app tetap berjalan tanpa cron. Setiap kali app terbuka, pengingat milik user yang sudah jatuh tempo diproses. Cron hanya dibutuhkan untuk push notification saat app tertutup.

## Struktur

```
src/
  actions/        Server Actions (validasi zod, semua lewat RLS)
  app/(auth)/     login, signup, forgot/reset password
  app/(app)/      home, notes, journal, focus, pixels, capsules, categories, notifications, settings
  app/api/cron/   endpoint reminder (dilindungi CRON_SECRET)
  components/     UI, maskot SVG, nav, toast, push
  lib/            kategori, smart date, timezone, pesan, maskot, tema, ambience
supabase/
  migrations/     skema + RLS + fungsi SQL
  cron.sql        penjadwal reminder
```

## Keamanan

- RLS aktif di semua tabel (`user_id = auth.uid()`), ditambah column-level grants untuk kolom yang tidak boleh diubah user. Contohnya `counts_for_streak`, `created_at` pada capsule, dan isi capsule yang terkunci.
- Isi Time Capsule tidak bisa di-`select` oleh user. Isinya hanya bisa dibaca lewat `open_capsule()` setelah tanggal buka.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di route cron dan penghapusan akun.
- Konten jurnal dirender sebagai text node (tanpa `dangerouslySetInnerHTML`).
- Security headers dan CSP dipasang di `next.config.ts`.
