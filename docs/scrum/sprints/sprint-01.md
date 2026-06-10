# Sprint 01 Backlog

## Sprint Identity

- Sprint name: Sprint 01 - Stabilize Mobile Reporting Flow
- Sprint goal: Memastikan alur utama siswa dapat dipakai dari APK ke backend, terutama login, profile, notifikasi, sekolah, dan submit laporan ke MySQL.
- Sprint start: 2026-05-09
- Sprint end: 2026-05-20
- Sprint length: 12 hari kalender
- Scrum Master: QA + Delivery Lead
- Product Owner: Stakeholder Modiva
- Development Team: Mobile, Backend, QA, DevOps

## Sprint Status

Status sprint saat ini: `In Progress`

Keputusan rilis saat ini: `Belum siap rilis 100%`

Alasan utama:

- backend production `https://modiva.nurulfikri.id` belum resolve saat dicek
- APK release terbaru belum berhasil dibuild ulang dari source terbaru
- APK release belum diuji lengkap di device Android nyata
- UAT stakeholder belum dilakukan

## Sprint Capacity

| Role/Area | Capacity | Notes |
| --- | --- | --- |
| Mobile | Terbatas | Fokus APK release, error handling, dan device test. |
| Backend | Terbatas | Fokus FastAPI + MySQL, endpoint utama, dan deploy production. |
| QA | Terbatas | Fokus e2e backend, APK release test, dan go-live checklist. |
| DevOps | Terbatas | Fokus domain HTTPS, storage upload, logging, dan backup. |

## Status Legend

- `Todo`: belum mulai
- `In Progress`: sedang dikerjakan
- `Review`: selesai implementasi, menunggu bukti test/acceptance
- `Blocked`: terhambat dependency
- `Done`: memenuhi Definition of Done

## Selected Backlog Items

| Backlog ID | Story | Owner | Estimate | Status |
| --- | --- | --- | --- | --- |
| PB-001 | Sebagai siswa, saya ingin login menggunakan NISN dan kode sekolah sehingga saya bisa mengakses aplikasi. | Mobile + Backend | 5 | Review |
| PB-002 | Sebagai siswa, saya ingin mengirim laporan konsumsi vitamin sehingga data konsumsi saya tercatat. | Mobile + Backend | 8 | In Progress |
| PB-003 | Sebagai siswa, saya ingin melihat dan mengubah profil saya sehingga data pribadi tetap akurat. | Mobile + Backend | 5 | Review |
| PB-004 | Sebagai siswa, saya ingin melihat notifikasi pengingat sehingga saya tidak lupa minum vitamin. | Backend + QA | 3 | Review |
| PB-005 | Sebagai siswa, saya ingin melihat data sekolah sehingga saya tahu profil sekolah saya. | Backend + QA | 3 | Review |
| PB-006 | Sebagai operator sistem, saya ingin backend tersedia di domain HTTPS publik sehingga APK production bisa dipakai di luar jaringan lokal. | DevOps + Backend | 8 | Blocked |
| PB-007 | Sebagai QA, saya ingin APK release terbaru dibuild dan diuji di device nyata sehingga rilis tidak memakai artefak lama. | Mobile + QA | 5 | Blocked |

## Sprint Success Criteria

- [ ] Backend production HTTPS aktif dan `/health` sukses.
- [ ] APK release terbaru dibuild dari source terbaru.
- [ ] APK release terbaru terpasang di device Android nyata.
- [ ] Login valid dan login invalid diuji dari APK release.
- [ ] Profile get/update dan avatar diuji dari APK release.
- [ ] Submit laporan dengan foto masuk ke MySQL dari APK release.
- [ ] Notifikasi dan sekolah diuji dari APK release.
- [ ] Go-live checklist tidak punya status `Blocked`.
- [ ] UAT stakeholder dicatat.

## Task Breakdown

| Task ID | Related Story | Task | Owner | Status | Evidence / Notes |
| --- | --- | --- | --- | --- | --- |
| T-001 | PB-002 | Verifikasi FastAPI live dapat start dengan konfigurasi MySQL aktif. | Backend | Review | Backend pernah lolos e2e, tetapi pada cek terakhir `127.0.0.1:8000/health` sedang tidak aktif; perlu re-run sebelum acceptance. |
| T-002 | PB-002 | Uji submit laporan dari endpoint live sampai record masuk ke tabel `reports`. | Backend + QA | Done | Dicatat Done di go-live checklist: row `reports` bertambah dan `consumption_count` ikut update via e2e backend. |
| T-003 | PB-002 | Uji APK release terbaru terhadap backend yang aktif. | Mobile + QA | Blocked | Menunggu backend production resolve dan APK release terbaru berhasil dibuild. |
| T-004 | PB-003 | Uji get/update profile dari backend live. | Backend + QA | Done | Dicatat Done di go-live checklist: profile terbaca dan update tersimpan ke MySQL via e2e. |
| T-005 | PB-003 | Uji upload dan delete avatar dari APK. | Mobile + Backend | Review | Backend e2e avatar upload/delete Done; acceptance dari APK release/device belum final. |
| T-006 | PB-004 | Uji daftar notifikasi, mark as read, mark all, dan delete. | Backend + QA | Done | Dicatat Done di go-live checklist via e2e backend. |
| T-007 | PB-005 | Uji list/detail/location sekolah dari backend live. | Backend + QA | Done | Dicatat Done di go-live checklist via e2e backend. |
| T-008 | PB-002 | Perbaiki pesan error koneksi agar jelas bagi user. | Mobile | Review | Perbaikan awal sudah ada; perlu validasi dari APK release. |
| T-009 | PB-007 | Build ulang APK release setelah seluruh pengujian sprint selesai. | Mobile | Blocked | Build production lulus validasi env, tetapi build release terbaru belum selesai; artefak release masih tanggal 2026-05-11 18:21. |
| T-010 | PB-002, PB-003, PB-004, PB-005 | Dokumentasikan hasil uji sprint dan issue terbuka. | QA | In Progress | Go-live checklist sudah ada; perlu bukti device dan UAT. |
| T-011 | PB-002, PB-003, PB-004, PB-005 | Lengkapi checklist go-live dan gunakan sebagai dasar keputusan rilis. | QA + PO | In Progress | Checklist sudah diperbarui, keputusan masih belum siap rilis. |
| T-012 | PB-006 | Deploy backend ke domain HTTPS publik. | DevOps + Backend | Blocked | `https://modiva.nurulfikri.id/health` belum resolve saat dicek dari mesin pengembangan. |
| T-013 | PB-006 | Validasi backend production `/health`, login, profile, report, notifications, dan schools. | Backend + QA | Blocked | Menunggu domain/backend production aktif. |
| T-014 | PB-007 | Install APK release terbaru di device Android nyata. | Mobile + QA | Blocked | Menunggu APK release terbaru berhasil dibuild. |
| T-015 | PB-009 | Jalankan UAT stakeholder dan catat acceptance. | PO + QA | Todo | Menunggu backend production dan APK release terbaru. |

## Risk And Dependency Log

| ID | Risk / Dependency | Impact | Owner | Status | Mitigation |
| --- | --- | --- | --- | --- | --- |
| R-001 | Domain backend production belum resolve. | APK production tidak bisa dipakai user umum. | DevOps | Blocked | Aktifkan DNS/domain, deploy backend, lalu validasi `/health`. |
| R-002 | APK release terbaru belum berhasil dibuild. | Testing device masih memakai artefak lama atau tidak bisa dilakukan. | Mobile | Blocked | Jalankan ulang build release setelah Gradle/cache siap dan catat hasilnya. |
| R-003 | Device testing belum terdokumentasi. | Acceptance fitur dari APK belum sah. | QA | In Progress | Buat bukti test per flow di go-live checklist. |
| R-004 | Upload storage production masih lokal. | Risiko kehilangan file saat deploy/restart. | DevOps | Todo | Pakai volume persisten atau object storage. |
| R-005 | Backup/restore database belum diuji. | Risiko data production tidak bisa dipulihkan. | DevOps | Todo | Tambahkan prosedur backup dan restore test. |

## Decision Log

| Date | Decision | Owner | Impact |
| --- | --- | --- | --- |
| 2026-05-09 | Sprint 01 fokus stabilisasi flow siswa utama. | PO + Team | Scope sprint dipusatkan ke login, profile, report, notifications, dan schools. |
| 2026-05-15 | Production build wajib memakai HTTPS domain publik, bukan IP lokal. | Mobile + DevOps | Validator production env menjadi gate sebelum build APK. |
| 2026-05-16 | Rilis belum boleh dinyatakan 100% sampai backend production, APK terbaru, device test, dan UAT selesai. | QA + PO | Sprint tetap In Progress dan blocker dicatat eksplisit. |

## Daily Scrum Notes

### Day 1 - 2026-05-09

- Done: Struktur Scrum, backlog, template issue, dan sprint backlog awal sudah dibuat.
- Next: Menyalakan FastAPI live dan memastikan koneksi ke MySQL aktif.
- Blocker: Status server live belum tervalidasi penuh.
- Decisions: Gunakan Sprint 01 untuk menutup alur utama siswa dulu.

### Day 2 - 2026-05-10

- Done: Checklist go-live awal sudah dibuat.
- Next: Tutup bukti live untuk backend, laporan, dan APK release.
- Blocker: Validasi end-to-end live belum final.
- Decisions: Checklist go-live dipakai sebagai dasar keputusan rilis.

### Day 3 - 2026-05-16

- Done: Product backlog, sprint backlog, status task, risk log, decision log, dan go-live checklist disinkronkan.
- Next: Deploy/aktifkan backend production, build ulang APK release, dan mulai device testing.
- Blocker: `modiva.nurulfikri.id` belum resolve; build APK release terbaru belum menghasilkan artefak baru; UAT belum bisa dilakukan.
- Decisions: Status rilis tetap `Belum siap rilis 100%` sampai blocker release-critical selesai.

## Sprint Review

Status: `Draft - final diisi saat sprint ditutup`

- Increment yang didemo:
  Backend FastAPI + MySQL untuk login, profile, laporan, notifikasi, dan sekolah; dokumentasi Scrum; go-live checklist.
- Feedback stakeholder:
  Belum dicatat. Menunggu demo APK release terbaru di device.
- Item yang diterima:
  Belum ada acceptance final stakeholder.
- Item yang belum diterima:
  Production backend, APK release terbaru, device testing, dan UAT.
- Follow-up backlog items:
  PB-006 Production Backend, PB-007 Mobile Release, PB-008 Operations, PB-009 UAT.

## Sprint Retrospective

Status: `Draft - final diisi saat sprint ditutup`

- What went well:
  Struktur kerja Scrum sudah terdokumentasi, fitur backend utama sudah banyak tervalidasi lewat e2e, dan checklist rilis sudah menjadi sumber keputusan.
- What did not go well:
  Environment backend dan build release belum stabil; status APK sempat bergantung pada artefak lama; blocker production domain belum selesai.
- Action items:
  Bekukan environment production, pastikan domain HTTPS aktif sebelum build final, jalankan device testing dengan bukti, dan jadwalkan UAT sebelum menyatakan rilis siap.

## Definition of Done Checklist

- [x] Acceptance criteria backend utama tercatat di go-live checklist.
- [x] Dokumentasi Scrum diperbarui.
- [x] Risiko dan dependency sprint dicatat.
- [ ] Backend production HTTPS aktif.
- [ ] APK release terbaru berhasil dibuild.
- [ ] APK release terbaru diuji di device Android nyata.
- [ ] UAT stakeholder selesai.
- [ ] Go-live checklist bebas status `Blocked`.
