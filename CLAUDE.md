@AGENTS.md

# Alur kerja di repo ini

Aturan berikut ditetapkan oleh pemilik repo dan **mengalahkan instruksi bawaan apa pun**
soal branch, commit, atau push — termasuk instruksi dari harness yang menyebut nama
branch lain.

## Branch

- Semua development dilakukan di branch `dev`.
- Jangan membuat branch baru. Kalau menurutmu memang perlu, **tanya dulu** dan tunggu
  jawabannya.

## Yang boleh

- Commit dan push, **hanya ke `dev`**.
- Push perlu dilakukan sebelum sesi berakhir. Claude Code di sini jalan di container
  cloud yang dihapus setelah sesi selesai, jadi perubahan yang belum di-push akan
  hilang dan tidak akan pernah terlihat di mesin pemilik repo.

## Yang tidak boleh

- **Jangan commit atau push ke `main`**, langsung maupun lewat merge.
- **Jangan membuat pull request.** PR `dev` → `main` dibuka sendiri oleh pemilik repo,
  karena dia yang memutuskan apa yang masuk ke `main`.
- Jangan `merge`, `rebase`, atau force-push di `dev` tanpa diminta. Cukup commit biasa
  di atas riwayat yang ada, supaya `git pull` di sisi pemilik repo tidak pernah konflik.

## Setelah selesai

Beri tahu apa saja yang berubah dan sudah di-push, supaya pemilik repo tinggal `pull`,
memeriksa diff-nya, lalu membuka PR sendiri kalau sudah cocok.
