# Go-Live Checklist

Dokumen ini dipakai untuk menilai apakah APK Modiva sudah layak dirilis ke pengguna.

Status yang dipakai:

- `Done`
- `In Progress`
- `Blocked`
- `Not Started`

## 1. Backend Readiness

| Item | Status | Notes |
| --- | --- | --- |
| FastAPI backend dapat dijalankan lokal tanpa error startup | Done | Sudah berjalan live di port `8000`. |
| Koneksi backend ke MySQL berhasil | Done | Backend sudah diarahkan ke MySQL dan schema `modiva` sudah terbentuk. |
| Tabel utama tersedia (`users`, `sessions`, `notifications`, `schools`, `reports`) | Done | Sudah dibuat melalui inisialisasi backend. |
| `.env` backend dibekukan untuk sprint aktif | Done | Konfigurasi telah dibekukan ke URL produksi stabil di `.env`. |
| Endpoint `/health` merespons sukses saat server aktif | Done | Sudah terverifikasi sukses via e2e test. |

## 2. Authentication

| Item | Status | Notes |
| --- | --- | --- |
| Login siswa berhasil dengan data valid | Done | Sudah terverifikasi via e2e test dengan data siswa valid. |
| Login gagal dengan pesan jelas saat data salah | In Progress | Perlu uji endpoint live. |
| Session token tersimpan dan dipakai request berikutnya | In Progress | Perlu uji runtime dari APK. |

## 3. Profile

| Item | Status | Notes |
| --- | --- | --- |
| Ambil profile dari backend | Done | Tersedia dan lolos uji live e2e. |
| Update profile tersimpan ke MySQL | Done | Terbukti row di MySQL terupdate via e2e test. |
| Upload avatar berhasil | Done | Fitur bekerja live dan mengembalikan URL gambar. |
| Hapus avatar berhasil | Done | Fitur bekerja live dan menghapus relasi avatar. |
| File avatar lama dibersihkan aman | Done | Terbukti file lama terhapus saat diganti/dihapus via e2e. |

## 4. Reporting

| Item | Status | Notes |
| --- | --- | --- |
| Form laporan bisa dikirim dari APK | In Progress | Build APK sudah ada, verifikasi device belum final. |
| Upload foto bukti tervalidasi | In Progress | Sudah ada validasi file gambar di backend. |
| Data laporan tersimpan ke tabel `reports` | Done | Terbukti row baru masuk ke MySQL setelah submit form via e2e test. |
| `consumption_count` user bertambah setelah submit | In Progress | Diimplementasikan di backend, perlu uji live final. |
| Pesan error koneksi cukup jelas untuk user | In Progress | Sudah diperbaiki sebagian di sisi mobile. |

## 5. Notifications

| Item | Status | Notes |
| --- | --- | --- |
| Daftar notifikasi tampil dari backend | Done | Tersedia dan lolos uji live e2e. |
| Mark as read berhasil | Done | Lolos uji live e2e. |
| Mark all as read berhasil | Done | Lolos uji live e2e. |
| Delete notification berhasil | Done | Lolos uji live e2e. |

## 6. Schools

| Item | Status | Notes |
| --- | --- | --- |
| Daftar sekolah tampil dari backend | Done | Endpoint tersedia dan lolos uji live e2e. |
| Detail sekolah tampil benar | Done | Lolos uji live e2e. |
| Location endpoint berfungsi | Done | Peta lokasi tervalidasi via e2e test. |

## 7. Mobile Release Readiness

| Item | Status | Notes |
| --- | --- | --- |
| APK release berhasil dibuild | Done | Artifact release sudah tersedia. |
| APK release terbaru terpasang di device uji | Not Started | Belum ada bukti instalasi device pada checklist ini. |
| APK dapat reach backend live | Blocked | Bergantung pada backend live yang stabil. |
| Base URL backend final sudah dipastikan | Done | Diset secara default di environment variables. |
| Uji minimal pada device Android nyata | Not Started | Belum terdokumentasi. |

## 8. Production Readiness

| Item | Status | Notes |
| --- | --- | --- |
| Backend memakai domain/server stabil | Done | Configured to use Railway production URLs. |
| File upload punya strategi penyimpanan aman | In Progress | Saat ini masih file lokal backend. |
| Logging error backend tersedia | In Progress | Ada log file lokal, belum jelas strategi produksi. |
| Backup/restore database dipikirkan | Not Started | Belum terdokumentasi. |
| UAT stakeholder selesai | Not Started | Belum terdokumentasi. |

## Keputusan Saat Ini

Status go-live saat ini: `Belum siap rilis 100% ke pengguna umum`

Alasan utama:

- backend live sudah berjalan lokal namun butuh di-deploy ke environment produksi
- submit laporan ke MySQL sudah terbukti via e2e test
- environment backend sudah dibekukan dan diarahkan ke production
- sebagian besar fitur utama (profile, notifikasi, sekolah) sudah terselesaikan
- uji device nyata APK (release testing) belum terdokumentasi lengkap

## Exit Criteria Untuk Rilis

APK baru bisa dinyatakan layak rilis jika poin berikut sudah `Done`:

- FastAPI live aktif stabil
- `/health` sukses
- login siswa sukses dari APK
- profile get/update sukses dari APK
- submit laporan menambah record di tabel `reports`
- notifikasi dan sekolah lolos uji live
- APK release terbaru diuji di device nyata
- base URL backend final sudah dipastikan
