# Scrum Guide For This Repo

Project ini memakai kerangka kerja Scrum untuk pengembangan aplikasi mobile dan backend.

## Status Penerapan

Status saat ini: `Aktif dipakai`

Artefak Scrum sudah tersedia dan menjadi sumber keputusan kerja:

- Product backlog: user story, prioritas, estimasi, status, dan acceptance criteria.
- Sprint backlog: sprint goal, item terpilih, task teknis, owner, status, blocker, dan catatan harian.
- Go-live checklist: bukti release readiness untuk APK, backend, database, dan UAT.
- GitHub template: user story, sprint task, bug report, dan pull request.

Catatan penting: Scrum sudah dipakai sebagai kerangka kerja, tetapi Sprint 01 belum selesai karena masih ada blocker production API, APK release terbaru, device testing, dan UAT.

## Tujuan Sprint

Setiap sprint harus menghasilkan increment yang bisa dipakai, dites, atau didemokan.

## Peran

- Product Owner
  Bertanggung jawab pada prioritas backlog, nilai bisnis, dan acceptance criteria.
- Scrum Master
  Menjaga ritme Scrum, menghilangkan blocker, dan memastikan proses berjalan sehat.
- Development Team
  Mengerjakan delivery lintas mobile, backend, testing, dan deployment.

## Artefak

- Product backlog:
  [docs/scrum/product-backlog.md](C:\project\mobile-app-modiva\mobile_tester\docs\scrum\product-backlog.md)
- Sprint backlog template:
  [docs/scrum/sprint-backlog-template.md](C:\project\mobile-app-modiva\mobile_tester\docs\scrum\sprint-backlog-template.md)
- Sprint aktif:
  [docs/scrum/sprints/sprint-01.md](C:\project\mobile-app-modiva\mobile_tester\docs\scrum\sprints\sprint-01.md)
- Go-live checklist:
  [docs/go-live-checklist.md](C:\project\mobile-app-modiva\mobile_tester\docs\go-live-checklist.md)
- Definition of Done:
  Lihat bagian DoD di dokumen ini.
- Increment:
  APK, backend, dan dokumentasi yang sudah lolos verifikasi sprint.

## Status Yang Dipakai

Gunakan status berikut agar semua dokumen konsisten:

- `Todo`: belum mulai.
- `In Progress`: sedang dikerjakan atau sedang divalidasi.
- `Review`: implementasi selesai, menunggu review, bukti test, atau acceptance.
- `Blocked`: tidak bisa lanjut tanpa dependency eksternal atau keputusan.
- `Done`: selesai dan memenuhi Definition of Done.

Status `Done` hanya boleh dipakai jika bukti test/review sudah dicatat di sprint backlog atau checklist.

## Seremoni

### Sprint Planning

- Tentukan sprint goal.
- Pilih backlog item prioritas tertinggi.
- Pecah user story menjadi task teknis.
- Tetapkan owner dan estimasi.
- Catat risiko, dependency, dan exit criteria sprint.

### Daily Scrum

Setiap anggota menjawab:

- Apa yang selesai kemarin
- Apa yang dikerjakan hari ini
- Apa blocker saat ini

Output wajib:

- update status task
- update blocker
- keputusan kecil yang mempengaruhi sprint

### Sprint Review

- Demo increment yang selesai
- Cocokkan hasil dengan acceptance criteria
- Kumpulkan feedback stakeholder
- Catat item yang diterima dan item yang belum diterima

### Sprint Retrospective

- Apa yang berjalan baik
- Apa yang perlu diperbaiki
- Action item sprint berikutnya

Retrospective final hanya diisi setelah sprint ditutup. Sebelum itu boleh ada catatan draft.

## Alur Kerja

1. Product Owner menambah atau memperbarui item di product backlog.
2. Tim melakukan refinement sampai item memenuhi Definition of Ready.
3. Saat sprint planning, item prioritas dipindah ke sprint backlog.
4. Development Team mengerjakan task dan memperbarui status harian.
5. QA mencatat bukti test di sprint backlog dan go-live checklist.
6. Sprint Review menentukan item diterima atau dikembalikan ke backlog.
7. Sprint Retrospective menghasilkan action item untuk sprint berikutnya.

## Definition of Ready

Sebuah item backlog dianggap siap masuk sprint jika:

- punya deskripsi yang jelas
- punya acceptance criteria
- dependency utama sudah diketahui
- ukuran kerja cukup kecil untuk dikerjakan dalam sprint
- risiko utama sudah dicatat
- data uji atau environment uji diketahui

## Definition of Done

Sebuah item dianggap selesai jika:

- implementasi code selesai
- perubahan sudah direview internal
- build tidak gagal
- testing utama sudah dijalankan
- dokumentasi yang terdampak sudah diperbarui
- tidak ada blocker kritis yang tersisa
- acceptance criteria sudah dicentang atau dicatat sebagai terpenuhi
- jika menyentuh API/mobile release, hasil uji device atau endpoint dicatat
- jika menyentuh production readiness, go-live checklist diperbarui

## Aturan Penulisan User Story

Format:

`Sebagai <role>, saya ingin <goal>, sehingga <benefit>.`

Acceptance criteria ditulis dengan format yang bisa diuji.

Contoh:

- `Given` siswa memiliki NISN valid, `When` siswa login, `Then` aplikasi membuka halaman utama.
- `Given` backend production aktif, `When` APK memanggil `/health`, `Then` response sukses dan tercatat di checklist.

## Struktur GitHub Yang Dipakai

- `User Story` issue untuk backlog item
- `Task` issue untuk pecahan teknis sprint
- `Bug Report` issue untuk defect
- pull request wajib mengisi ringkasan, testing, dan kaitan ke issue

## Definition of Release Ready

APK dianggap siap rilis jika:

- semua backlog item release-critical berstatus `Done`
- semua task release-critical di sprint berstatus `Done`
- go-live checklist tidak memiliki status `Blocked`
- APK release terbaru berhasil dibuild dari source terbaru
- APK release terbaru sudah diuji di device Android nyata
- backend production memakai HTTPS domain publik yang aktif
- UAT stakeholder dicatat sebagai selesai atau disetujui dengan catatan

## Ritme Yang Disarankan

- Durasi sprint: 1-2 minggu
- Review backlog: minimal 1 kali per sprint
- Retrospective: wajib di akhir sprint
