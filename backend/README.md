# Modiva FastAPI Backend

Backend FastAPI untuk menerima login siswa, profile, upload avatar, upload bukti vitamin, notifikasi, dan data sekolah dari app mobile lalu menyimpannya ke MySQL.

Saat ini backend aktif memakai arsitektur yang lebih sederhana:

- `server API`: FastAPI
- `database utama`: MySQL
- tidak ada dependency runtime ke Couchbase

Untuk environment lokal, backend sekarang disiapkan agar cocok dengan MySQL Laragon default:

- host: `127.0.0.1`
- port: `3306`
- user: `root`
- password: kosong

Jika database `modiva` di Laragon sudah memiliki schema asli seperti `siswa`, `sekolah`, `siswa_hb`, dan `distribusi_siswa`, backend akan menyinkronkan data itu ke tabel support aplikasi agar tampilan mobile tetap cocok dengan isi database Laragon.

## Jalankan Lokal

Isi environment berikut:

```bash
PORT=8000
UVICORN_RELOAD=false
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=modiva
HONO_PORT=8787
FASTAPI_BASE_URL=http://127.0.0.1:8000
```

Jalankan FastAPI sebagai API utama:

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

Server FastAPI akan aktif di `http://127.0.0.1:8000`.

Kalau ingin HonoJS sebagai gateway pendamping, jalankan di terminal kedua:

```bash
cd backend
npm install
npm run start:gateway
```

Gateway Hono akan aktif di `http://127.0.0.1:8787` dan meneruskan `/api/*` serta `/uploads/*` ke FastAPI.

## Endpoint

- `GET /health`
- `POST /api/auth/login-siswa`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/verify`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `POST /api/users/profile/avatar`
- `DELETE /api/users/profile/avatar`
- `POST /api/reports/submit`
- `GET /api/reports`
- `GET /api/reports/{id}`
- `GET /api/notifications`
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/{id}`
- `GET /api/schools`
- `GET /api/schools/{id}`
- `GET /api/schools/{id}/location`

## Data Awal

Backend sekarang tidak lagi menambahkan data seed otomatis ke MySQL.

Perilakunya:

- jika schema legacy Laragon seperti `siswa` dan `sekolah` ada, backend akan menyinkronkan data yang memang sudah ada di sana ke tabel aplikasi
- jika schema legacy tidak ada, backend hanya memastikan tabel aplikasi tersedia
- backend tidak akan membuat `users`, `schools`, atau `notifications` contoh sendiri

## Penyimpanan

- Database utama: MySQL `modiva`
- File upload: `backend/uploads/`

Saat user upload avatar baru atau menghapus avatar, backend akan membersihkan file avatar lama yang sudah tidak direferensikan lagi.

## Mapping Tabel Final

Bagian ini menjelaskan tabel mana yang dipakai tiap fitur setelah sinkronisasi dari schema Laragon.

### Tabel aplikasi yang dipakai runtime API

- `users`
  - dipakai untuk login siswa, profile user, informasi vitamin, `hb_last`, dan progres konsumsi
- `reports`
  - dipakai untuk riwayat laporan konsumsi vitamin yang dikirim dari APK
- `schools`
  - dipakai untuk daftar sekolah, detail sekolah, dan lokasi sekolah
- `notifications`
  - dipakai untuk daftar notifikasi user
- `sessions`
  - dipakai untuk token login/session aktif
- `user_hb_history`
  - dipakai untuk grafik/tren hemoglobin di aplikasi

### Sumber legacy Laragon yang disinkronkan

Jika tabel legacy Laragon tersedia, backend akan membaca dari tabel berikut lalu menyalinnya ke tabel aplikasi:

- `siswa` -> `users`
- `sekolah` -> `schools`
- `siswa_hb` -> `user_hb_history`
- `distribusi_siswa` -> `users.consumption_count`

### Ringkasan fitur ke tabel

- Login siswa:
  - runtime baca `users`
- Informasi Vitamin:
  - runtime baca `users.consumption_count` dan `users.total_target`
- Tren Hemoglobin:
  - runtime baca `user_hb_history`
- Riwayat laporan konsumsi:
  - runtime baca/tulis `reports`
- Sekolah:
  - runtime baca `schools`
- Notifikasi:
  - runtime baca/tulis `notifications`

### Catatan penting

- runtime API sekarang diusahakan membaca dari tabel aplikasi, bukan query langsung ke tabel legacy
- tabel legacy Laragon berperan sebagai sumber sinkronisasi awal, bukan target utama request mobile
- kalau data tidak ada di MySQL, backend tidak akan mengarang data contoh otomatis

## Siap Deploy

Backend ini sekarang sudah disiapkan untuk deploy generik, dan gateway Hono bersifat opsional:

- [Dockerfile](C:\project\mobile-app-modiva\mobile_tester\backend\Dockerfile)
- [docker-compose.vps.yml](C:\project\mobile-app-modiva\mobile_tester\backend\docker-compose.vps.yml)
- [.env.production.example](C:\project\mobile-app-modiva\mobile_tester\backend\.env.production.example)
- [deploy/Caddyfile](C:\project\mobile-app-modiva\mobile_tester\backend\deploy\Caddyfile)
- [deploy/VPS_DEPLOY.md](C:\project\mobile-app-modiva\mobile_tester\backend\deploy\VPS_DEPLOY.md)
- [Procfile](C:\project\mobile-app-modiva\mobile_tester\backend\Procfile)
- [.env.example](C:\project\mobile-app-modiva\mobile_tester\backend\.env.example)
- [railway.toml](C:\project\mobile-app-modiva\mobile_tester\backend\railway.toml)
- [server.js](C:\project\mobile-app-modiva\mobile_tester\backend\server.js)
- [package.json](C:\project\mobile-app-modiva\mobile_tester\backend\package.json)

### Opsi 1: Deploy dengan Docker di VPS

```bash
cd backend
cp .env.production.example .env.production
docker compose -f docker-compose.vps.yml --env-file .env.production up -d --build
```

Isi `PUBLIC_HOSTNAME` dan `PUBLIC_BASE_URL` di `.env.production` dengan domain backend publik kamu, misalnya `modiva.nurulfikri.id`.

Panduan lengkap VPS ada di [deploy/VPS_DEPLOY.md](C:\project\mobile-app-modiva\mobile_tester\backend\deploy\VPS_DEPLOY.md).

### Opsi 2: Deploy ke platform seperti Railway/Render

- gunakan root folder `backend`
- install command: `pip install -r requirements.txt`
- start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- set env `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- pastikan folder `uploads/` punya persistent storage

### Opsi 3: Deploy ke Railway

- root service: `backend`
- Railway akan memakai [Dockerfile](C:\project\mobile-app-modiva\mobile_tester\backend\Dockerfile) dan [railway.toml](C:\project\mobile-app-modiva\mobile_tester\backend\railway.toml)
- healthcheck: `/health`
- isi env:
  - `MYSQL_HOST`
  - `MYSQL_PORT`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`
- mount volume persisten untuk `/app/uploads`
- setelah deploy berhasil, catat domain publik Railway lalu gunakan sebagai `EXPO_PUBLIC_API_URL`

### Catatan penting produksi

- backend ini sekarang memakai MySQL
- compose VPS memakai `caddy` untuk HTTPS otomatis di port `80/443`
- file upload di produksi saat ini disimpan di volume Docker `uploads_data`
- upload file di produksi sebaiknya dipindah ke object storage seperti S3-compatible storage
- jangan build APK production ke IP laptop lokal; gunakan domain publik backend
- runtime aktif sekarang adalah [main.py](C:\project\mobile-app-modiva\mobile_tester\backend\main.py)
- [server.js](C:\project\mobile-app-modiva\mobile_tester\backend\server.js) sekarang berfungsi sebagai gateway/proxy opsional ke FastAPI, bukan sebagai API data utama
