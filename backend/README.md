# Modiva FastAPI Backend

Backend FastAPI untuk menerima login siswa, profile, upload avatar, upload bukti vitamin, notifikasi, dan data sekolah dari app mobile lalu menyimpannya ke MySQL.

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

## Akun Seed

Beberapa akun siswa awal akan otomatis dibuat di MySQL saat startup pertama:

- NISN `10001` dengan kode sekolah `20223819`
- NISN `10002` dengan kode sekolah `20223819`
- NISN `0110222079` dengan kode sekolah `SMPN1JKT`

## Penyimpanan

- Database utama: MySQL `modiva`
- File upload: `backend/uploads/`

Saat user upload avatar baru atau menghapus avatar, backend akan membersihkan file avatar lama yang sudah tidak direferensikan lagi.

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
