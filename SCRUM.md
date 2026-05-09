# Scrum Guide For This Repo

Project ini memakai kerangka kerja Scrum untuk pengembangan aplikasi mobile dan backend.

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
- Sprint backlog:
  [docs/scrum/sprint-backlog-template.md](C:\project\mobile-app-modiva\mobile_tester\docs\scrum\sprint-backlog-template.md)
- Definition of Done:
  Lihat bagian DoD di dokumen ini.
- Increment:
  APK, backend, dan dokumentasi yang sudah lolos verifikasi sprint.

## Seremoni

### Sprint Planning

- Tentukan sprint goal.
- Pilih backlog item prioritas tertinggi.
- Pecah user story menjadi task teknis.
- Tetapkan owner dan estimasi.

### Daily Scrum

Setiap anggota menjawab:

- Apa yang selesai kemarin
- Apa yang dikerjakan hari ini
- Apa blocker saat ini

### Sprint Review

- Demo increment yang selesai
- Cocokkan hasil dengan acceptance criteria
- Kumpulkan feedback stakeholder

### Sprint Retrospective

- Apa yang berjalan baik
- Apa yang perlu diperbaiki
- Action item sprint berikutnya

## Definition of Ready

Sebuah item backlog dianggap siap masuk sprint jika:

- punya deskripsi yang jelas
- punya acceptance criteria
- dependency utama sudah diketahui
- ukuran kerja cukup kecil untuk dikerjakan dalam sprint

## Definition of Done

Sebuah item dianggap selesai jika:

- implementasi code selesai
- perubahan sudah direview internal
- build tidak gagal
- testing utama sudah dijalankan
- dokumentasi yang terdampak sudah diperbarui
- tidak ada blocker kritis yang tersisa

## Aturan Penulisan User Story

Format:

`Sebagai <role>, saya ingin <goal>, sehingga <benefit>.`

Acceptance criteria ditulis dengan format yang bisa diuji.

## Struktur GitHub Yang Dipakai

- `User Story` issue untuk backlog item
- `Task` issue untuk pecahan teknis sprint
- `Bug Report` issue untuk defect
- pull request wajib mengisi ringkasan, testing, dan kaitan ke issue

## Ritme Yang Disarankan

- Durasi sprint: 1-2 minggu
- Review backlog: minimal 1 kali per sprint
- Retrospective: wajib di akhir sprint
