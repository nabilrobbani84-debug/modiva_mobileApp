# Go-Live Checklist

Dokumen ini dipakai untuk menilai apakah APK Modiva sudah layak dirilis ke pengguna.

Status yang dipakai:

- `Done`
- `In Progress`
- `Blocked`
- `Not Started`

Last updated: 2026-05-16

## 1. Backend Readiness

| Item | Status | Notes |
| --- | --- | --- |
| FastAPI backend dapat dijalankan lokal tanpa error startup | In Progress | Pernah tervalidasi via e2e, tetapi cek terakhir ke `127.0.0.1:8000/health` gagal karena server sedang tidak aktif. Perlu re-run sebelum acceptance final. |
| Koneksi backend ke MySQL berhasil | Done | Backend sudah diarahkan ke MySQL dan schema `modiva` sudah terbentuk. |
| Tabel utama tersedia (`users`, `sessions`, `notifications`, `schools`, `reports`) | Done | Sudah dibuat melalui inisialisasi backend. |
| Backend aktif hanya memakai MySQL | Done | Runtime Couchbase dinonaktifkan agar alur data lebih sederhana dan stabil. |
| `.env` backend dibekukan untuk sprint aktif | Done | Konfigurasi lokal backend aktif dipakai untuk validasi live. |
| Endpoint `/health` merespons sukses saat server aktif | In Progress | Sudah pernah terverifikasi via e2e test; perlu bukti ulang untuk backend lokal/production yang sedang aktif. |

## 2. Authentication

| Item | Status | Notes |
| --- | --- | --- |
| Login siswa berhasil dengan data valid | Done | Sudah terverifikasi via e2e test dengan data siswa valid. |
| Login gagal dengan pesan jelas saat data salah | In Progress | Perlu verifikasi dari APK release di device nyata. |
| Session token tersimpan dan dipakai request berikutnya | Done | Token dipakai oleh request profile/report/features saat uji e2e live. |
| Login dari APK release terbaru | Blocked | Menunggu APK release terbaru dan backend production aktif. |

## 3. Profile

| Item | Status | Notes |
| --- | --- | --- |
| Ambil profile dari backend | Done | Tersedia dan lolos uji live e2e. |
| Update profile tersimpan ke MySQL | Done | Terbukti row di MySQL terupdate via e2e test. |
| Upload avatar berhasil | Done | Fitur bekerja live dan mengembalikan URL gambar. |
| Hapus avatar berhasil | Done | Fitur bekerja live dan menghapus relasi avatar. |
| File avatar lama dibersihkan aman | Done | Terbukti file lama terhapus saat diganti/dihapus via e2e. |
| Profile diuji dari APK release terbaru | Blocked | Menunggu APK release terbaru dan backend production aktif. |

## 4. Reporting

| Item | Status | Notes |
| --- | --- | --- |
| Form laporan bisa dikirim dari APK | In Progress | Submit laporan live sudah lolos e2e backend, tetapi verifikasi dari device release belum final. |
| Upload foto bukti tervalidasi | Done | Sudah tervalidasi di backend dan lolos alur upload live. |
| Data laporan tersimpan ke tabel `reports` | Done | Terbukti row baru masuk ke MySQL setelah submit form via e2e test. |
| `consumption_count` user bertambah setelah submit | Done | Sudah ikut diupdate saat submit laporan live berhasil. |
| Pesan error koneksi cukup jelas untuk user | In Progress | Sudah diperbaiki sebagian di sisi mobile. |
| Submit laporan dari APK release terbaru | Blocked | Menunggu APK release terbaru, backend production aktif, dan device Android nyata. |

## 5. Notifications

| Item | Status | Notes |
| --- | --- | --- |
| Daftar notifikasi tampil dari backend | Done | Tersedia dan lolos uji live e2e. |
| Mark as read berhasil | Done | Lolos uji live e2e. |
| Mark all as read berhasil | Done | Lolos uji live e2e. |
| Delete notification berhasil | Done | Lolos uji live e2e. |
| Notifikasi diuji dari APK release terbaru | Blocked | Menunggu APK release terbaru dan backend production aktif. |

## 6. Schools

| Item | Status | Notes |
| --- | --- | --- |
| Daftar sekolah tampil dari backend | Done | Endpoint tersedia dan lolos uji live e2e. |
| Detail sekolah tampil benar | Done | Lolos uji live e2e. |
| Location endpoint berfungsi | Done | Peta lokasi tervalidasi via e2e test. |
| Sekolah diuji dari APK release terbaru | Blocked | Menunggu APK release terbaru dan backend production aktif. |

## 7. Mobile Release Readiness

| Item | Status | Notes |
| --- | --- | --- |
| APK release artifact tersedia | Done | Artifact lama tersedia pada `11/05/2026 18:21:18`. |
| APK release terbaru berhasil dibuild dari source terbaru | Blocked | Build production env lulus, tetapi build release terbaru belum selesai dan artifact belum berubah dari `11/05/2026 18:21:18`. |
| APK release terbaru terpasang di device uji | Not Started | Belum ada bukti instalasi device pada checklist ini. |
| APK dapat reach backend production | Blocked | `https://api.modiva.id/health` belum resolve saat dicek; APK production belum bisa reach API publik. |
| Base URL backend final sudah dipastikan | Blocked | `.env.production` sudah mengarah ke `https://api.modiva.id/api`, tetapi domain belum resolve. `.env` lokal masih memakai IP private untuk development. |
| `npm run validate:production-env` lolos | Done | Validasi production env sukses pada 2026-05-15/2026-05-16. |
| `npm run lint` tidak memiliki error | Done | Lint sukses dengan 31 warning, 0 error. |
| Uji minimal pada device Android nyata | Not Started | Belum terdokumentasi. |

## 8. Production Readiness

| Item | Status | Notes |
| --- | --- | --- |
| Backend memakai domain/server stabil | Blocked | `api.modiva.id` belum resolve dari mesin pengembangan saat dicek. |
| File upload punya strategi penyimpanan aman | In Progress | Saat ini masih file lokal backend. |
| Logging error backend tersedia | In Progress | Ada log file lokal, belum jelas strategi produksi. |
| Backup/restore database dipikirkan | Not Started | Belum terdokumentasi. |
| UAT stakeholder selesai | Not Started | Belum terdokumentasi. |

## Keputusan Saat Ini

Status go-live saat ini: `Belum siap rilis 100% ke pengguna umum`

Alasan utama:

- backend production belum aktif/resolve di domain publik
- backend aktif sudah disederhanakan ke FastAPI + MySQL
- submit laporan ke MySQL sudah terbukti via e2e test
- artifact release lama tersedia, tetapi APK release terbaru dari source terbaru belum terbukti berhasil dibuild
- sebagian besar fitur utama (profile, notifikasi, sekolah) sudah terselesaikan
- uji device nyata APK (release testing) belum terdokumentasi lengkap
- UAT stakeholder belum dilakukan

## Exit Criteria Untuk Rilis

APK baru bisa dinyatakan layak rilis jika poin berikut sudah `Done`:

- FastAPI production aktif stabil
- `/health` sukses di domain production
- login siswa sukses dari APK
- profile get/update sukses dari APK
- submit laporan menambah record di tabel `reports`
- notifikasi dan sekolah lolos uji live
- APK release terbaru diuji di device nyata
- base URL backend final sudah dipastikan
- `EXPO_PUBLIC_API_URL` sudah mengarah ke domain HTTPS publik
- `npm run validate:production-env` lolos
- UAT stakeholder selesai atau diterima dengan catatan tertulis
