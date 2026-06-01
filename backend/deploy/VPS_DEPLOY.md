# Deploy VPS Modiva

Panduan ini menyiapkan backend FastAPI + MySQL + HTTPS publik di VPS memakai Docker Compose.

## Arsitektur

- `caddy`: reverse proxy HTTPS otomatis
- `backend`: FastAPI API utama
- `mysql`: database produksi

## Prasyarat

- VPS Linux Ubuntu 22.04 atau 24.04
- domain atau subdomain publik, misalnya `api.modiva.id`
- DNS `A record` domain mengarah ke IP VPS

## 1. Install Docker di VPS

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Logout lalu login lagi ke VPS setelah perintah terakhir.

## 2. Clone repo

```bash
git clone <repo-kamu> modiva
cd modiva/backend
```

## 3. Siapkan env produksi

```bash
cp .env.production.example .env.production
```

Lalu edit `.env.production`:

- `PUBLIC_BASE_URL=https://api.domain-kamu`
- `PUBLIC_HOSTNAME=api.domain-kamu`
- `CORS_ALLOW_ORIGINS=https://app.domain-kamu`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`

## 4. Buka firewall VPS

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 5. Jalankan stack produksi

```bash
docker compose -f docker-compose.vps.yml --env-file .env.production up -d --build
```

## 6. Verifikasi backend

```bash
docker compose -f docker-compose.vps.yml ps
curl https://api.domain-kamu/health
```

Respon sehat yang diharapkan:

```json
{
  "success": true,
  "message": "Backend aktif",
  "environment": "production",
  "public_base_url": "https://api.domain-kamu",
  "database": {
    "driver": "mysql",
    "status": "connected"
  }
}
```

## 7. Set env mobile production

Di root project mobile:

```bash
EXPO_PUBLIC_API_URL=https://api.domain-kamu/api
```

Lalu validasi:

```bash
npm run validate:production-env
```

## 8. Build APK final

Setelah backend publik sehat, build APK release baru dari project mobile agar mengarah ke server nyata.

## Operasional dasar

Lihat log:

```bash
docker compose -f docker-compose.vps.yml logs -f backend
docker compose -f docker-compose.vps.yml logs -f mysql
docker compose -f docker-compose.vps.yml logs -f caddy
```

Restart:

```bash
docker compose -f docker-compose.vps.yml restart
```

Update deploy:

```bash
git pull
docker compose -f docker-compose.vps.yml --env-file .env.production up -d --build
```

## Catatan penting

- Jangan commit `.env.production`
- Ganti semua password contoh
- Backup volume MySQL secara berkala
- Folder upload saat ini masih lokal di volume Docker. Untuk skala besar, sebaiknya pindah ke object storage
