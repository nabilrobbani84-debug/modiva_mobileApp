# Product Backlog

Gunakan tabel ini sebagai product backlog utama.

Status yang dipakai: `Todo`, `In Progress`, `Review`, `Blocked`, `Done`.

| ID | Epic | User Story | Priority | Estimate | Status | Acceptance Criteria | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PB-001 | Authentication | Sebagai siswa, saya ingin login menggunakan NISN dan kode sekolah sehingga saya bisa mengakses aplikasi. | High | 5 | Review | Login berhasil dengan kredensial valid, login gagal menampilkan pesan jelas, token session tersimpan, dan hasilnya diuji dari APK release. | Backend e2e valid sudah selesai; login gagal dan device APK masih perlu bukti release. |
| PB-002 | Reporting | Sebagai siswa, saya ingin mengirim laporan konsumsi vitamin sehingga data konsumsi saya tercatat. | High | 8 | In Progress | Form laporan dapat dikirim dari APK, foto tervalidasi, data masuk ke `reports`, dan `consumption_count` bertambah. | Backend e2e sudah lolos; device APK release belum final. |
| PB-003 | Profile | Sebagai siswa, saya ingin melihat dan mengubah profil saya sehingga data pribadi tetap akurat. | High | 5 | Review | Profile dapat dibaca, diperbarui, avatar diunggah/dihapus, dan perubahan tersimpan di MySQL. | Backend e2e sudah lolos; butuh acceptance dari APK release. |
| PB-004 | Notifications | Sebagai siswa, saya ingin melihat notifikasi pengingat sehingga saya tidak lupa minum vitamin. | Medium | 3 | Review | Notifikasi dapat dibaca, ditandai dibaca, mark all berhasil, dan delete berhasil. | Endpoint sudah lolos e2e; butuh device acceptance. |
| PB-005 | Schools | Sebagai siswa, saya ingin melihat data sekolah sehingga saya tahu profil sekolah saya. | Medium | 3 | Review | Daftar sekolah, detail sekolah, dan lokasi sekolah tampil dari backend. | Endpoint sudah lolos e2e; butuh device acceptance. |
| PB-006 | Production Backend | Sebagai operator sistem, saya ingin backend tersedia di domain HTTPS publik sehingga APK production bisa dipakai di luar jaringan lokal. | High | 8 | Blocked | Domain backend publik resolve, `/health` sukses, CORS benar, database production terhubung, dan upload folder/storage persisten. | `https://modiva.nurulfikri.id/health` belum resolve saat dicek. |
| PB-007 | Mobile Release | Sebagai QA, saya ingin APK release terbaru dibuild dan diuji di device nyata sehingga rilis tidak memakai artefak lama. | High | 5 | Blocked | APK release terbaru berasal dari source terbaru, terinstal di device Android, login/profile/report/notification/school diuji, dan hasil test dicatat. | Artefak release yang ada masih tanggal 11/05/2026; build terbaru belum selesai. |
| PB-008 | Operations | Sebagai operator sistem, saya ingin logging, backup, restore, dan storage upload siap sehingga data produksi aman. | High | 5 | Todo | Strategi log error, backup database, restore test, dan storage upload production terdokumentasi serta diuji minimal sekali. | Dibutuhkan sebelum rilis user umum. |
| PB-009 | UAT | Sebagai stakeholder, saya ingin melakukan UAT pada APK release sehingga saya bisa menerima atau menolak increment sprint. | Medium | 3 | Todo | Skenario UAT tersedia, stakeholder menjalankan flow utama, hasil diterima/ditolak dicatat, dan feedback masuk backlog. | Menunggu APK release terbaru dan backend production aktif. |

## Cara Memakai

- `Priority` gunakan `High`, `Medium`, atau `Low`
- `Estimate` gunakan story point
- `Status` gunakan `Todo`, `In Progress`, `Review`, `Blocked`, atau `Done`
- `Done` hanya dipakai jika acceptance criteria sudah terbukti dan dicatat di sprint/checklist

## Release-Critical Items

Untuk rilis pengguna umum, item berikut wajib `Done`:

- PB-001 Authentication
- PB-002 Reporting
- PB-003 Profile
- PB-004 Notifications
- PB-005 Schools
- PB-006 Production Backend
- PB-007 Mobile Release
- PB-008 Operations
- PB-009 UAT
