# Sprint 01 Backlog

## Sprint Identity

- Sprint name: Sprint 01 - Stabilize Mobile Reporting Flow
- Sprint goal: Memastikan alur utama siswa dapat dipakai dari APK ke backend, terutama login, profile, notifikasi, sekolah, dan submit laporan ke MySQL.
- Sprint start: 2026-05-09
- Sprint end: 2026-05-20

## Selected Backlog Items

| Backlog ID | Story | Owner | Estimate | Status |
| --- | --- | --- | --- | --- |
| PB-002 | Sebagai siswa, saya ingin mengirim laporan konsumsi vitamin sehingga data konsumsi saya tercatat. | Mobile + Backend | 8 | In Progress |
| PB-003 | Sebagai siswa, saya ingin melihat dan mengubah profil saya sehingga data pribadi tetap akurat. | Mobile + Backend | 5 | In Progress |
| PB-004 | Sebagai siswa, saya ingin melihat notifikasi pengingat sehingga saya tidak lupa minum vitamin. | Backend + QA | 3 | In Progress |
| PB-005 | Sebagai siswa, saya ingin melihat data sekolah sehingga saya tahu profil sekolah saya. | Backend + QA | 3 | In Progress |

## Task Breakdown

| Task ID | Related Story | Task | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| T-001 | PB-002 | Verifikasi FastAPI live dapat start dengan konfigurasi MySQL aktif. | Backend | Todo | Blocking untuk tes end-to-end. |
| T-002 | PB-002 | Uji submit laporan dari endpoint live sampai record masuk ke tabel `reports`. | Backend + QA | Todo | Bukti akhir koneksi form pelaporan. |
| T-003 | PB-002 | Uji APK release terbaru terhadap backend yang aktif. | Mobile + QA | Todo | Pastikan base URL dan upload berjalan. |
| T-004 | PB-003 | Uji get/update profile dari backend live. | Backend + QA | Todo | Pastikan data profil sinkron dengan MySQL. |
| T-005 | PB-003 | Uji upload dan delete avatar dari APK. | Mobile + Backend | Todo | Verifikasi file dan data DB. |
| T-006 | PB-004 | Uji daftar notifikasi, mark as read, mark all, dan delete. | Backend + QA | Todo | Validasi endpoint dan state app. |
| T-007 | PB-005 | Uji list/detail/location sekolah dari backend live. | Backend + QA | Todo | Pastikan data sekolah terbaca dari DB. |
| T-008 | PB-002 | Perbaiki pesan error koneksi agar jelas bagi user. | Mobile | In Progress | Sudah ada perbaikan awal, perlu validasi. |
| T-009 | PB-002 | Build ulang APK release setelah seluruh pengujian sprint selesai. | Mobile | Todo | Artifact final sprint. |
| T-010 | PB-002, PB-003, PB-004, PB-005 | Dokumentasikan hasil uji sprint dan issue terbuka. | QA | Todo | Input untuk sprint review. |
| T-011 | PB-002, PB-003, PB-004, PB-005 | Lengkapi checklist go-live dan gunakan sebagai dasar keputusan rilis. | QA + PO | In Progress | Lihat `docs/go-live-checklist.md`. |

## Daily Scrum Notes

### Day 1

- Done: Struktur Scrum, backlog, template issue, dan sprint backlog awal sudah dibuat.
- Next: Menyalakan FastAPI live dan memastikan koneksi ke MySQL aktif.
- Blocker: Status server live belum tervalidasi penuh.

### Day 2

- Done: Checklist go-live awal sudah dibuat.
- Next: Tutup bukti live untuk backend, laporan, dan APK release.
- Blocker: Validasi end-to-end live belum final.

## Sprint Review

- Increment yang didemo:
  APK release terbaru, backend FastAPI yang tersambung ke MySQL, dan hasil uji alur utama siswa.
- Feedback stakeholder:
- Item yang diterima:
- Item yang belum diterima:

## Sprint Retrospective

- What went well:
  Struktur kerja mulai terdokumentasi dan backlog prioritas sudah jelas.
- What did not go well:
  Environment backend sempat berubah-ubah sehingga verifikasi end-to-end tertunda.
- Action items:
  Bekukan konfigurasi `.env` untuk sprint aktif dan gunakan checklist pengujian live sebelum build release.
