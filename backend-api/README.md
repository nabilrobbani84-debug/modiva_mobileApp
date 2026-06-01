# MODIVA Backend API

REST API backend untuk sistem monitoring distribusi Tablet Tambah Darah (MODIVA) menggunakan Django, FastAPI, dan MySQL.

## Teknologi yang Digunakan

* Django REST Framework
* FastAPI
* MySQL / MariaDB
* JWT Authentication
* Uvicorn

---

# Struktur Project

```bash
backend-django/
backend-fastapi/
uploads/
```

---

# Fitur API

* Login siswa menggunakan JWT
* Verifikasi token
* Statistik hemoglobin siswa
* Upload bukti konsumsi tablet tambah darah
* Riwayat konsumsi
* Profil siswa
* Edit profil siswa
* Lokasi sekolah

---

# Instalasi Project

## 1. Clone Repository

```bash
git clone https://github.com/USERNAME/modiva-backend-api.git
```

Masuk ke folder project:

```bash
cd modiva-backend-api
```

---

# Setup Virtual Environment

```bash
python -m venv venv
```

Aktifkan virtual environment:

### Windows

```bash
venv\Scripts\activate
```

### Linux / MacOS

```bash
source venv/bin/activate
```

---

# Install Dependencies

```bash
pip install -r requirements.txt
```

---

# Konfigurasi Database

Buat database MySQL:

```sql
CREATE DATABASE modiva;
```

Sesuaikan konfigurasi database pada:

```bash
backend-django/config/settings.py
```

Contoh:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'modiva',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3309',
    }
}
```

---

# Menjalankan Django

Masuk ke folder Django:

```bash
cd backend-django
```

Jalankan server:

```bash
python manage.py runserver
```

Django berjalan pada:

```bash
http://127.0.0.1:8000
```

---

# Menjalankan FastAPI

Buka terminal baru.

Masuk ke folder FastAPI:

```bash
cd backend-fastapi
```

Jalankan server:

```bash
python -m uvicorn app.main:app --reload --port 8001
```

FastAPI berjalan pada:

```bash
http://127.0.0.1:8001
```

Swagger Documentation:

```bash
http://127.0.0.1:8001/docs
```

---

# Endpoint API

| Endpoint                | Method | Deskripsi             |
| ----------------------- | ------ | --------------------- |
| /api/login              | POST   | Login siswa           |
| /api/siswa/profile      | GET    | Profil siswa          |
| /api/siswa/edit-profile | PUT    | Edit profil siswa     |
| /api/siswa/hb           | GET    | Statistik hemoglobin  |
| /api/ttd                | POST   | Upload bukti konsumsi |
| /api/riwayat-konsumsi   | GET    | Riwayat konsumsi      |
| /api/sekolah/lokasi     | GET    | Lokasi sekolah        |

---

# Authentication

Gunakan Bearer Token pada setiap endpoint protected.

Contoh:

```bash
Authorization: Bearer your_token
```

---

# Author

Wisnu Nugroho
Teknik Informatika
STT Terpadu Nurul Fikri