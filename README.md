# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Backend aplikasi

Repo ini sekarang juga punya backend FastAPI di [backend/README.md](C:\project\mobile-app-modiva\mobile_tester\backend\README.md) untuk login, profile, upload avatar, notifikasi, sekolah, dan upload bukti vitamin dengan penyimpanan **MySQL**.

Mapping tabel final backend juga sudah didokumentasikan di [backend/README.md](C:\project\mobile-app-modiva\mobile_tester\backend\README.md), termasuk relasi antara schema legacy Laragon dan tabel aplikasi runtime.

Jalankan backend:

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

Kalau ingin gateway HonoJS pendamping:

```bash
cd backend
npm install
npm run start:gateway
```

Endpoint utama:

- `POST /api/auth/login-siswa`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `POST /api/users/profile/avatar`
- `DELETE /api/users/profile/avatar`
- `POST /api/reports/submit`
- `GET /api/reports`
- `GET /api/reports/{id}`

## Deploy backend

Backend sekarang sudah disiapkan untuk deploy ke server publik dengan:

- [backend/Dockerfile](C:\project\mobile-app-modiva\mobile_tester\backend\Dockerfile)
- [backend/Procfile](C:\project\mobile-app-modiva\mobile_tester\backend\Procfile)
- [backend/.env.example](C:\project\mobile-app-modiva\mobile_tester\backend\.env.example)
- [backend/server.js](C:\project\mobile-app-modiva\mobile_tester\backend\server.js)
- [backend/package.json](C:\project\mobile-app-modiva\mobile_tester\backend\package.json)

Untuk build app ke server publik:

1. Deploy FastAPI ke domain HTTPS publik.
2. Siapkan MySQL produksi dan isi env `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`.
3. Isi `PUBLIC_BASE_URL` dan `CORS_ALLOW_ORIGINS` di backend.
4. Salin [.env.production.example](C:\project\mobile-app-modiva\mobile_tester\.env.production.example) menjadi `.env.production` lalu isi `EXPO_PUBLIC_API_URL` dengan domain backend publik.
5. Jalankan validasi:

```bash
npm run validate:production-env
```

6. Build APK production hanya lewat script berikut agar validasi selalu dijalankan lebih dulu:

```bash
npm run build:android:production
```

Catatan penting:

- build `production` sekarang tidak boleh mengandalkan IP laptop atau `localhost`
- fallback offline/mock untuk login dan data laporan dinonaktifkan pada mode produksi nyata
- jika `EXPO_PUBLIC_API_URL` belum valid, build tetap bisa jalan tetapi akan ditandai belum siap produksi di aplikasi
- Android production sekarang dipaksa HTTPS-only (`usesCleartextTraffic: false`)
- paket deploy VPS siap dipakai di [backend/deploy/VPS_DEPLOY.md](C:\project\mobile-app-modiva\mobile_tester\backend\deploy\VPS_DEPLOY.md)
- build production final tidak boleh memakai IP lokal seperti `192.168.x.x`; validator akan otomatis menolak konfigurasi itu

## Scrum workflow

Repo ini sekarang memakai struktur kerja Scrum agar pengerjaan fitur lebih tertata.

- panduan utama Scrum:
  [SCRUM.md](C:\project\mobile-app-modiva\mobile_tester\SCRUM.md)
- product backlog:
  [docs/scrum/product-backlog.md](C:\project\mobile-app-modiva\mobile_tester\docs\scrum\product-backlog.md)
- sprint backlog template:
  [docs/scrum/sprint-backlog-template.md](C:\project\mobile-app-modiva\mobile_tester\docs\scrum\sprint-backlog-template.md)
- sprint aktif:
  [docs/scrum/sprints/sprint-01.md](C:\project\mobile-app-modiva\mobile_tester\docs\scrum\sprints\sprint-01.md)
- checklist go-live:
  [docs/go-live-checklist.md](C:\project\mobile-app-modiva\mobile_tester\docs\go-live-checklist.md)

GitHub juga sudah disiapkan dengan template:

- `User Story`
- `Sprint Task`
- `Bug Report`
- `Pull Request Template`

Alur yang disarankan:

1. Buat `User Story` dari backlog.
2. Masukkan story terpilih ke sprint backlog.
3. Pecah menjadi `Sprint Task`.
4. Kerjakan task lewat pull request.
5. Tutup sprint dengan review dan retrospective.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
