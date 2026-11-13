# Keepsake: arah desain

Dipilih pemilik produk pada 2026-11-14 (opsi A dari audit antislop 001).

## Identitas

Keepsake adalah buku tempel kenangan: tempat menyimpan daftar, rencana, dan perasaan seperti orang menempel tiket dan catatan di album. Nadanya hangat, personal, sedikit jenaka. Maskot tupai (bawaan bernama Pip) menyimpan biji ek, seperti pengguna menyimpan hal kecil yang berarti.

Design Read: aplikasi catatan dan jurnal pribadi untuk pengguna perorangan, dengan bahasa visual buku tempel kertas. Dial: ENERGY 2 / RHYTHM 2 / MOTION 1.

## Keputusan dan alasannya

- **Kertas, bukan kartu melayang.** Permukaan datar dengan garis tepi tipis dan sudut 6px, seperti potongan kertas. Bayangan hanya untuk yang benar-benar di atas halaman: modal, toast, menu, dan item yang sedang diseret.
- **Pita perekat (motif identitas).** Satu potong pita semi-transparan menempel di elemen utama tiap layar (kartu maskot di Home, kartu auth, contoh di landing). Satu per layar, supaya tetap jadi penanda, bukan hiasan.
- **Tulisan tangan untuk catatan pinggir.** Caveat dipakai hanya untuk ucapan maskot dan anotasi singkat, minimal 20px. Alasannya: itu suara "seseorang menulis di album".
- **Fraunces untuk judul.** Serif lembut bernuansa buku lama, cocok dengan album kenangan. Nunito tetap untuk teks isi karena bulat dan mudah dibaca di ukuran kecil.
- **Warna.** Lima tema tetap ada (fitur pengguna). Tiap tema: latar kertas, satu warna utama untuk tombol utama, satu aksen untuk pita. Teks dan ikon berwarna memakai `primary-text`, versi gelap dari warna utama yang lolos 4.5:1. Merah bahaya satu token (`danger`).
- **Bentuk.** Kertas 6px (kartu, input, modal). Tombol 10px. Pil penuh hanya untuk chip dan label, seperti stiker.
- **Tombol utama "stempel".** Bayangan keras 4px yang turun saat ditekan, hanya di tombol utama. Alasannya: rasa menekan stempel, satu gestur taktil.
- **Gerak.** Hover hanya mengubah warna garis. Maskot bernapas dan berkedip karena ia tokoh, dan bisa dimatikan lewat "Reduce motion". Confetti hanya sebagai umpan balik saat menyelesaikan sesuatu. Partikel latar mati secara bawaan; pengguna boleh menyalakannya.
- **Ikon.** Tetap Lucide. Alasannya: 70 lebih kunci ikon tersimpan di data pengguna (ikon note dan kategori), jadi mengganti pustaka berarti migrasi data. Ikon "sparkles" tidak lagi dipakai sebagai tanda fitur.
- **Logo.** Nama "Keepsake" dalam Fraunces. Belum ada logo gambar; ini penanda teks sampai pemilik memutuskan.
