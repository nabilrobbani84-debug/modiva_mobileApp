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

Repo ini sekarang juga punya backend FastAPI di [backend/README.md](C:\project\mobile-app-modiva\mobile_tester\backend\README.md) untuk login, profile, upload avatar, notifikasi, sekolah, dan upload bukti vitamin dengan penyimpanan file JSON lokal.

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

Untuk build app ke server publik, set `EXPO_PUBLIC_API_URL` ke domain backend kamu sebelum build APK/IPA. Untuk penyimpanan lokal, backend FastAPI membaca `DATABASE_PATH` dan default ke `backend/data/modiva-fastapi.json`.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
