from __future__ import annotations

import mimetypes
import os
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator, Optional

import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pymysql.cursors import DictCursor


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

PORT = int(os.environ.get("PORT", "8000"))
UVICORN_RELOAD = str(os.environ.get("UVICORN_RELOAD", "false")).strip().lower() == "true"
APP_ENV = str(os.environ.get("APP_ENV", "development")).strip().lower()
PUBLIC_BASE_URL = str(os.environ.get("PUBLIC_BASE_URL", "")).strip()

MYSQL_HOST = os.environ.get("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "modiva")
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in str(os.environ.get("CORS_ALLOW_ORIGINS", "*")).split(",")
    if origin.strip()
]


SEED_SCHOOLS = [
    {
        "id": "1",
        "kode": "SMPN1JKT",
        "nama": "SMPN 1 Jakarta",
        "nama_lengkap": "Sekolah Menengah Pertama Negeri 1 Jakarta",
        "alamat": "Jl. Cikini Raya No.1, Cikini, Menteng, Jakarta Pusat",
        "kota": "Jakarta Pusat",
        "provinsi": "DKI Jakarta",
        "kode_pos": "10330",
        "telepon": "(021) 3913371",
        "email": "smpn1jkt@disdik.jakarta.go.id",
        "kepala_sekolah": "Drs. H. Ahmad Fauzi, M.Pd",
        "akreditasi": "A",
        "npsn": "20100047",
        "latitude": -6.196241,
        "longitude": 106.836671,
        "jumlah_siswa": 1,
        "status": "Negeri",
        "jenjang": "SMP",
    },
    {
        "id": "3",
        "kode": "20223819",
        "nama": "SMAN 1 KOTA DEPOK",
        "nama_lengkap": "Sekolah Menengah Atas Negeri 1 Kota Depok",
        "alamat": "Jl. Nusantara Raya 317, Depok, Kota Depok",
        "kota": "Kota Depok",
        "provinsi": "Jawa Barat",
        "kode_pos": "16431",
        "telepon": "(021) 7520137",
        "email": "sman1depokjabar@gmail.com",
        "kepala_sekolah": "Kepala Sekolah SMAN 1 Kota Depok",
        "akreditasi": "A",
        "npsn": "20223819",
        "latitude": -6.402222,
        "longitude": 106.801944,
        "jumlah_siswa": 5,
        "status": "Negeri",
        "jenjang": "SMA",
    },
    {
        "id": "8",
        "kode": "20223818",
        "nama": "SMAN 2 KOTA DEPOK",
        "nama_lengkap": "Sekolah Menengah Atas Negeri 2 Kota Depok",
        "alamat": "Jl. Gede Raya No. 177, Depok Timur, Abadi Jaya, Kota Depok",
        "kota": "Kota Depok",
        "provinsi": "Jawa Barat",
        "kode_pos": "16412",
        "telepon": "(021) 7708359",
        "email": "sman2.depok@yahoo.com",
        "kepala_sekolah": "Kepala Sekolah SMAN 2 Kota Depok",
        "akreditasi": "A",
        "npsn": "20223818",
        "latitude": -6.389722,
        "longitude": 106.831667,
        "jumlah_siswa": 4,
        "status": "Negeri",
        "jenjang": "SMA",
    },
    {
        "id": "9",
        "kode": "20258460",
        "nama": "SMAN 15 Depok",
        "nama_lengkap": "Sekolah Menengah Atas Negeri 15 Depok",
        "alamat": "Jl. Merdeka No. 78, Abadijaya, Kec. Sukmajaya, Kota Depok",
        "kota": "Kota Depok",
        "provinsi": "Jawa Barat",
        "kode_pos": "16417",
        "telepon": None,
        "email": None,
        "kepala_sekolah": "Kepala Sekolah SMAN 15 Depok",
        "akreditasi": "A",
        "npsn": "20258460",
        "latitude": -6.381667,
        "longitude": 106.8425,
        "jumlah_siswa": 8,
        "status": "Negeri",
        "jenjang": "SMA",
    },
    {
        "id": "12",
        "kode": "20223817",
        "nama": "SMAN 3 KOTA DEPOK",
        "nama_lengkap": "Sekolah Menengah Atas Negeri 3 Kota Depok",
        "alamat": "Jl. Raden Saleh No.45, Sukmajaya, Kec. Sukmajaya, Kota Depok",
        "kota": "Kota Depok",
        "provinsi": "Jawa Barat",
        "kode_pos": "16412",
        "telepon": "021-7700310",
        "email": "SMANTIGADEPOK@YAHOO.COM",
        "kepala_sekolah": "Kepala Sekolah SMAN 3 Kota Depok",
        "akreditasi": "A",
        "npsn": "20223817",
        "latitude": -6.390833,
        "longitude": 106.835556,
        "jumlah_siswa": 6,
        "status": "Negeri",
        "jenjang": "SMA",
    },
]

SEED_USERS = [
    {
        "id": "1",
        "name": "Gita Hidayat",
        "nisn": "10001",
        "email": "gita.hidayat@outlook.com",
        "phone": "081234567801",
        "school_id": "3",
        "school_code": "20223819",
        "address": "Depok",
        "birth_place": "Depok",
        "birth_date": "2010-05-25",
        "gender": "M",
        "height": 155,
        "weight": 45,
        "hb_last": 12.0,
        "consumption_count": 5,
        "total_target": 90,
        "role": "siswa",
        "avatar": None,
    },
    {
        "id": "2",
        "name": "Nanda Lestari",
        "nisn": "10002",
        "email": "nanda.lestari@yahoo.com",
        "phone": "081234567802",
        "school_id": "3",
        "school_code": "20223819",
        "address": "Depok",
        "birth_place": "Bekasi",
        "birth_date": "2006-06-18",
        "gender": "M",
        "height": 158,
        "weight": 48,
        "hb_last": 11.5,
        "consumption_count": 10,
        "total_target": 90,
        "role": "siswa",
        "avatar": None,
    },
    {
        "id": "99",
        "name": "Rizky Pratama",
        "nisn": "0110222079",
        "email": "rizky.pratama@modiva.id",
        "phone": "081234567899",
        "school_id": "1",
        "school_code": "SMPN1JKT",
        "address": "Jakarta",
        "birth_place": "Jakarta",
        "birth_date": "2008-08-17",
        "gender": "M",
        "height": 170,
        "weight": 60,
        "hb_last": 13.5,
        "consumption_count": 15,
        "total_target": 90,
        "role": "siswa",
        "avatar": None,
    },
]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_now_iso() -> str:
    return utc_now().isoformat()


def mysql_timestamp(value: Optional[datetime] = None) -> str:
    target = value or utc_now()
    return target.astimezone(timezone.utc).replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S")


def parse_timestamp(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc).isoformat()
        return value.astimezone(timezone.utc).isoformat()
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return text
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat()


def mysql_connect(*, database: Optional[str] = None) -> pymysql.connections.Connection:
    connection_kwargs = {
        "host": MYSQL_HOST,
        "port": MYSQL_PORT,
        "user": MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "cursorclass": DictCursor,
        "charset": "utf8mb4",
        "autocommit": False,
    }
    if database:
        connection_kwargs["database"] = database
    return pymysql.connect(**connection_kwargs)


def check_database_connection() -> dict[str, Any]:
    with db_cursor() as (_, cursor):
        cursor.execute("SELECT 1 AS ok")
        result = cursor.fetchone() or {}
    return {"ok": bool(result.get("ok"))}


def validate_runtime_config() -> None:
    if APP_ENV == "production":
        if not PUBLIC_BASE_URL.startswith("https://"):
            raise RuntimeError("PUBLIC_BASE_URL wajib memakai HTTPS saat APP_ENV=production")
        if "*" in CORS_ALLOW_ORIGINS:
            raise RuntimeError("CORS_ALLOW_ORIGINS tidak boleh '*' saat APP_ENV=production")
        if not MYSQL_PASSWORD:
            raise RuntimeError("MYSQL_PASSWORD wajib diisi saat APP_ENV=production")


@contextmanager
def db_cursor(*, dictionary: bool = True) -> Iterator[tuple[pymysql.connections.Connection, Any]]:
    cursor_class = DictCursor if dictionary else None
    connection = mysql_connect(database=MYSQL_DATABASE)
    cursor = connection.cursor(cursor=cursor_class)
    try:
        yield connection, cursor
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


def ensure_database() -> None:
    connection = mysql_connect(database=None)
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        connection.commit()
    finally:
        connection.close()


def ensure_tables() -> None:
    with db_cursor(dictionary=False) as (_connection, cursor):
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS schools (
                id VARCHAR(32) PRIMARY KEY,
                kode VARCHAR(64) NOT NULL UNIQUE,
                nama VARCHAR(255) NOT NULL,
                nama_lengkap VARCHAR(255) NULL,
                alamat TEXT NULL,
                kota VARCHAR(128) NULL,
                provinsi VARCHAR(128) NULL,
                kode_pos VARCHAR(32) NULL,
                telepon VARCHAR(64) NULL,
                email VARCHAR(255) NULL,
                kepala_sekolah VARCHAR(255) NULL,
                akreditasi VARCHAR(16) NULL,
                npsn VARCHAR(64) NULL,
                latitude DOUBLE NULL,
                longitude DOUBLE NULL,
                jumlah_siswa INT NOT NULL DEFAULT 0,
                status VARCHAR(64) NULL,
                jenjang VARCHAR(64) NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(32) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                nisn VARCHAR(64) NOT NULL UNIQUE,
                email VARCHAR(255) NULL,
                phone VARCHAR(64) NULL,
                school_id VARCHAR(32) NOT NULL,
                school_code VARCHAR(64) NOT NULL,
                address TEXT NULL,
                birth_place VARCHAR(128) NULL,
                birth_date VARCHAR(32) NULL,
                gender VARCHAR(16) NULL,
                height DOUBLE NULL,
                weight DOUBLE NULL,
                hb_last DOUBLE NULL,
                consumption_count INT NOT NULL DEFAULT 0,
                total_target INT NOT NULL DEFAULT 90,
                role VARCHAR(32) NOT NULL DEFAULT 'siswa',
                avatar VARCHAR(255) NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id)
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token VARCHAR(191) PRIMARY KEY,
                refresh_token VARCHAR(191) NOT NULL UNIQUE,
                user_id VARCHAR(32) NOT NULL,
                created_at DATETIME NOT NULL,
                expires_at DATETIME NOT NULL,
                CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(32) NOT NULL,
                type VARCHAR(64) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                icon VARCHAR(64) NULL,
                color VARCHAR(64) NULL,
                action VARCHAR(255) NULL,
                metadata TEXT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(32) NOT NULL,
                report_date VARCHAR(32) NOT NULL,
                notes TEXT NULL,
                photo_filename VARCHAR(255) NOT NULL,
                photo_original_name VARCHAR(255) NULL,
                photo_mime_type VARCHAR(128) NULL,
                photo_size INT NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )


def seed_database() -> None:
    timestamp = mysql_timestamp()
    with db_cursor(dictionary=False) as (_connection, cursor):
        for school in SEED_SCHOOLS:
            cursor.execute(
                """
                INSERT INTO schools (
                    id, kode, nama, nama_lengkap, alamat, kota, provinsi, kode_pos,
                    telepon, email, kepala_sekolah, akreditasi, npsn, latitude,
                    longitude, jumlah_siswa, status, jenjang
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    nama = VALUES(nama),
                    nama_lengkap = VALUES(nama_lengkap),
                    alamat = VALUES(alamat),
                    kota = VALUES(kota),
                    provinsi = VALUES(provinsi),
                    kode_pos = VALUES(kode_pos),
                    telepon = VALUES(telepon),
                    email = VALUES(email),
                    kepala_sekolah = VALUES(kepala_sekolah),
                    akreditasi = VALUES(akreditasi),
                    npsn = VALUES(npsn),
                    latitude = VALUES(latitude),
                    longitude = VALUES(longitude),
                    jumlah_siswa = VALUES(jumlah_siswa),
                    status = VALUES(status),
                    jenjang = VALUES(jenjang)
                """,
                (
                    school["id"],
                    school["kode"],
                    school["nama"],
                    school["nama_lengkap"],
                    school["alamat"],
                    school["kota"],
                    school["provinsi"],
                    school["kode_pos"],
                    school["telepon"],
                    school["email"],
                    school["kepala_sekolah"],
                    school["akreditasi"],
                    school["npsn"],
                    school["latitude"],
                    school["longitude"],
                    school["jumlah_siswa"],
                    school["status"],
                    school["jenjang"],
                ),
            )

        for user in SEED_USERS:
            cursor.execute(
                """
                INSERT INTO users (
                    id, name, nisn, email, phone, school_id, school_code, address,
                    birth_place, birth_date, gender, height, weight, hb_last,
                    consumption_count, total_target, role, avatar, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    email = VALUES(email),
                    phone = VALUES(phone),
                    school_id = VALUES(school_id),
                    school_code = VALUES(school_code),
                    address = VALUES(address),
                    birth_place = VALUES(birth_place),
                    birth_date = VALUES(birth_date),
                    gender = VALUES(gender),
                    height = VALUES(height),
                    weight = VALUES(weight),
                    hb_last = VALUES(hb_last),
                    consumption_count = VALUES(consumption_count),
                    total_target = VALUES(total_target),
                    role = VALUES(role)
                """,
                (
                    user["id"],
                    user["name"],
                    user["nisn"],
                    user["email"],
                    user["phone"],
                    user["school_id"],
                    user["school_code"],
                    user["address"],
                    user["birth_place"],
                    user["birth_date"],
                    user["gender"],
                    user["height"],
                    user["weight"],
                    user["hb_last"],
                    user["consumption_count"],
                    user["total_target"],
                    user["role"],
                    user["avatar"],
                    timestamp,
                    timestamp,
                ),
            )

        cursor.execute("SELECT COUNT(*) AS total FROM notifications")
        notification_count = int(cursor.fetchone()["total"])
        if notification_count == 0:
            for user in SEED_USERS:
                for notification in (
                    {
                        "type": "reminder",
                        "title": "Pengingat Minum Vitamin",
                        "message": f"Halo {user['name']}, jangan lupa minum vitamin hari ini ya.",
                        "is_read": False,
                        "icon": "notifications",
                        "color": "blue",
                    },
                    {
                        "type": "info",
                        "title": "Data Sekolah Aktif",
                        "message": f"Akun kamu terhubung dengan kode sekolah {user['school_code']}.",
                        "is_read": True,
                        "icon": "school",
                        "color": "yellow",
                    },
                ):
                    cursor.execute(
                        """
                        INSERT INTO notifications (
                            user_id, type, title, message, is_read, icon, color,
                            action, metadata, created_at, updated_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            user["id"],
                            notification["type"],
                            notification["title"],
                            notification["message"],
                            notification["is_read"],
                            notification["icon"],
                            notification["color"],
                            None,
                            "{}",
                            timestamp,
                            timestamp,
                        ),
                    )


def init_database() -> None:
    ensure_database()
    ensure_tables()
    seed_database()


def normalize_db_row(row: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if row is None:
        return None
    normalized = dict(row)
    for key in ("created_at", "updated_at", "expires_at"):
        if key in normalized:
            normalized[key] = parse_timestamp(normalized.get(key))
    if "is_read" in normalized:
        normalized["is_read"] = bool(normalized.get("is_read"))
    return normalized


def fetch_one(query: str, params: tuple[Any, ...] = ()) -> Optional[dict[str, Any]]:
    with db_cursor() as (_connection, cursor):
        cursor.execute(query, params)
        return normalize_db_row(cursor.fetchone())


def fetch_all(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db_cursor() as (_connection, cursor):
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [normalize_db_row(row) for row in rows]


def execute_write(query: str, params: tuple[Any, ...] = ()) -> int:
    with db_cursor(dictionary=False) as (_connection, cursor):
        cursor.execute(query, params)
        return int(cursor.rowcount or 0)


def execute_insert(query: str, params: tuple[Any, ...] = ()) -> int:
    with db_cursor(dictionary=False) as (_connection, cursor):
        cursor.execute(query, params)
        return int(cursor.lastrowid)


def get_origin(request: Request) -> str:
    return str(request.base_url).rstrip("/")


def build_upload_url(request: Request, filename: Optional[str]) -> Optional[str]:
    if not filename:
        return None
    return f"{get_origin(request)}/uploads/{filename}"


def resolve_media_url(request: Optional[Request], value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    if str(value).startswith("http://") or str(value).startswith("https://"):
        return value
    if request is None:
        return value
    return build_upload_url(request, value)


async def save_upload_file(file: UploadFile) -> tuple[str, int]:
    extension = Path(file.filename or "").suffix.lower()
    if not extension:
        extension = mimetypes.guess_extension(file.content_type or "") or ".jpg"
    stored_filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / stored_filename
    content = await file.read()
    destination.write_bytes(content)
    return stored_filename, len(content)


def get_school_row(*, school_id: Optional[str] = None, school_code: Optional[str] = None) -> Optional[dict[str, Any]]:
    if school_id:
        return fetch_one("SELECT * FROM schools WHERE id = %s LIMIT 1", (school_id,))
    if school_code:
        return fetch_one("SELECT * FROM schools WHERE UPPER(kode) = UPPER(%s) LIMIT 1", (school_code,))
    return None


def school_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "kode": row["kode"],
        "nama": row["nama"],
        "nama_lengkap": row["nama_lengkap"],
        "alamat": row["alamat"],
        "kota": row["kota"],
        "provinsi": row["provinsi"],
        "kode_pos": row["kode_pos"],
        "telepon": row["telepon"],
        "email": row["email"],
        "kepala_sekolah": row["kepala_sekolah"],
        "akreditasi": row["akreditasi"],
        "npsn": row["npsn"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "jumlah_siswa": row["jumlah_siswa"],
        "status": row["status"],
        "jenjang": row["jenjang"],
    }


def user_to_payload(user_row: dict[str, Any], request: Optional[Request] = None) -> dict[str, Any]:
    school = get_school_row(school_id=user_row["school_id"], school_code=user_row["school_code"])
    school_name = school["nama"] if school else user_row["school_code"]
    return {
        "id": user_row["id"],
        "name": user_row["name"],
        "nisn": user_row["nisn"],
        "school": school_name,
        "schoolId": user_row["school_id"],
        "schoolCode": user_row["school_code"],
        "role": user_row.get("role") or "siswa",
        "email": user_row.get("email"),
        "phone": user_row.get("phone"),
        "address": user_row.get("address"),
        "birthPlace": user_row.get("birth_place"),
        "birthDate": user_row.get("birth_date"),
        "gender": user_row.get("gender"),
        "height": user_row.get("height"),
        "weight": user_row.get("weight"),
        "avatar": resolve_media_url(request, user_row.get("avatar")),
        "createdAt": user_row.get("created_at"),
        "updatedAt": user_row.get("updated_at"),
        "hbLast": user_row.get("hb_last"),
        "consumptionCount": user_row.get("consumption_count"),
        "totalTarget": user_row.get("total_target"),
    }


def user_to_profile_response(user_row: dict[str, Any], request: Optional[Request] = None) -> dict[str, Any]:
    school = get_school_row(school_id=user_row["school_id"], school_code=user_row["school_code"])
    school_name = school["nama"] if school else user_row["school_code"]
    return {
        "id": user_row["id"],
        "name": user_row["name"],
        "nisn": user_row["nisn"],
        "email": user_row.get("email"),
        "phone": user_row.get("phone"),
        "school": school_name,
        "school_id": user_row["school_id"],
        "school_code": user_row["school_code"],
        "address": user_row.get("address"),
        "birth_place": user_row.get("birth_place"),
        "birth_date": user_row.get("birth_date"),
        "gender": user_row.get("gender"),
        "height": user_row.get("height"),
        "weight": user_row.get("weight"),
        "avatar": resolve_media_url(request, user_row.get("avatar")),
        "role": user_row.get("role") or "siswa",
        "hb_last": user_row.get("hb_last"),
        "consumption_count": user_row.get("consumption_count"),
        "total_target": user_row.get("total_target"),
        "created_at": user_row.get("created_at"),
        "updated_at": user_row.get("updated_at"),
    }


def create_session(user_id: str) -> tuple[str, str]:
    token = f"session-{user_id}-{uuid.uuid4().hex}"
    refresh_token = f"refresh-{user_id}-{uuid.uuid4().hex}"
    created_at = mysql_timestamp()
    expires_at = mysql_timestamp(utc_now() + timedelta(days=1))

    with db_cursor(dictionary=False) as (_connection, cursor):
        cursor.execute("DELETE FROM sessions WHERE user_id = %s", (user_id,))
        cursor.execute(
            """
            INSERT INTO sessions (token, refresh_token, user_id, created_at, expires_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (token, refresh_token, user_id, created_at, expires_at),
        )
    return token, refresh_token


def extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token is required")
    return authorization[7:].strip()


def get_session_row(token: str) -> dict[str, Any]:
    session = fetch_one("SELECT * FROM sessions WHERE token = %s LIMIT 1", (token,))
    if session is None:
        raise HTTPException(status_code=401, detail="Sesi tidak valid")
    expires_at = session.get("expires_at")
    if expires_at and datetime.fromisoformat(expires_at) < utc_now():
        execute_write("DELETE FROM sessions WHERE token = %s", (token,))
        raise HTTPException(status_code=401, detail="Sesi telah berakhir")
    return session


def get_current_user(authorization: Optional[str]) -> dict[str, Any]:
    token = extract_bearer_token(authorization)
    session = get_session_row(token)
    user = fetch_one("SELECT * FROM users WHERE id = %s LIMIT 1", (session["user_id"],))
    if user is None:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    return user


async def remove_uploaded_file_if_unused(filename: Optional[str]) -> bool:
    normalized = str(filename or "").strip()
    if not normalized or "/" in normalized or "\\" in normalized:
        return False

    avatar_usage = fetch_one("SELECT id FROM users WHERE avatar = %s LIMIT 1", (normalized,))
    if avatar_usage is not None:
        return False

    report_usage = fetch_one("SELECT id FROM reports WHERE photo_filename = %s LIMIT 1", (normalized,))
    if report_usage is not None:
        return False

    file_path = UPLOADS_DIR / normalized
    if file_path.exists():
        file_path.unlink()
        return True
    return False


app = FastAPI(title="Modiva Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    validate_runtime_config()
    init_database()
    check_database_connection()


@app.get("/health")
def healthcheck() -> dict[str, Any]:
    database_status = check_database_connection()
    return {
        "success": True,
        "message": "Backend aktif",
        "environment": APP_ENV,
        "public_base_url": PUBLIC_BASE_URL or None,
        "database": {
            "driver": "mysql",
            "host": MYSQL_HOST,
            "port": MYSQL_PORT,
            "name": MYSQL_DATABASE,
            "status": "connected" if database_status["ok"] else "error",
        },
    }


@app.get("/uploads/{filename}")
def get_uploaded_file(filename: str) -> FileResponse:
    if "/" in filename or "\\" in filename:
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    return FileResponse(file_path)


@app.post("/api/auth/login-siswa")
def login_siswa(payload: dict[str, Any], request: Request) -> dict[str, Any]:
    submitted_nisn = str(payload.get("nisn") or payload.get("nis") or "").strip()
    submitted_school = str(
        payload.get("schoolCode")
        or payload.get("school_code")
        or payload.get("schoolId")
        or payload.get("school_id")
        or ""
    ).strip().upper()

    if not submitted_nisn or not submitted_school:
        raise HTTPException(status_code=422, detail="NISN dan kode sekolah wajib diisi")

    user = fetch_one(
        """
        SELECT * FROM users
        WHERE nisn = %s AND (UPPER(school_code) = %s OR school_id = %s)
        LIMIT 1
        """,
        (submitted_nisn, submitted_school, submitted_school),
    )
    if user is None:
        raise HTTPException(status_code=401, detail="NIS atau Kode Sekolah salah / tidak terdaftar")

    token, refresh_token = create_session(user["id"])
    return {
        "success": True,
        "token": token,
        "refreshToken": refresh_token,
        "user": user_to_payload(user, request),
    }


@app.post("/api/auth/login-guru")
def login_guru(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "success": True,
        "token": f"guru-{uuid.uuid4().hex}",
        "refreshToken": f"guru-refresh-{uuid.uuid4().hex}",
        "user": {
            "id": "guru-1",
            "name": payload.get("email") or "Guru",
            "role": "guru",
            "school": "SMAN 1 KOTA DEPOK",
        },
    }


@app.post("/api/auth/login-admin")
def login_admin(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "success": True,
        "token": f"admin-{uuid.uuid4().hex}",
        "refreshToken": f"admin-refresh-{uuid.uuid4().hex}",
        "user": {
            "id": "admin-1",
            "name": payload.get("username") or "Admin",
            "role": "admin",
            "school": "Modiva",
        },
    }


@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    token = extract_bearer_token(authorization)
    execute_write("DELETE FROM sessions WHERE token = %s", (token,))
    return {"success": True, "message": "Logout successful"}


@app.post("/api/auth/refresh")
def refresh_token(payload: dict[str, Any]) -> dict[str, Any]:
    refresh = str(payload.get("refreshToken") or "").strip()
    if not refresh:
        raise HTTPException(status_code=422, detail="Refresh token wajib diisi")
    session = fetch_one("SELECT * FROM sessions WHERE refresh_token = %s LIMIT 1", (refresh,))
    if session is None:
        raise HTTPException(status_code=401, detail="Refresh token tidak valid")
    token, refresh_token_value = create_session(session["user_id"])
    return {"success": True, "token": token, "refreshToken": refresh_token_value}


@app.get("/api/auth/verify")
def verify_token(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    session = get_session_row(extract_bearer_token(authorization))
    return {"success": True, "valid": True, "expiresAt": session["expires_at"]}


@app.post("/api/auth/password-reset")
def reset_password(payload: dict[str, Any]) -> dict[str, Any]:
    email = str(payload.get("email") or "").strip()
    if not email:
        raise HTTPException(status_code=422, detail="Email wajib diisi")
    return {"success": True, "message": "Password reset email sent"}


@app.put("/api/auth/password-change")
def change_password(payload: dict[str, Any], authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    _token = extract_bearer_token(authorization)
    if not payload.get("oldPassword") or not payload.get("newPassword"):
        raise HTTPException(status_code=422, detail="Password lama dan baru wajib diisi")
    return {"success": True, "message": "Password changed successfully"}


@app.get("/api/users/profile")
def get_profile(request: Request, authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    user = get_current_user(authorization)
    return {"success": True, "data": user_to_profile_response(user, request)}


@app.put("/api/users/profile")
def update_profile(
    request: Request,
    payload: dict[str, Any],
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    allowed_fields = {
        "name": "name",
        "email": "email",
        "phone": "phone",
        "address": "address",
        "birthPlace": "birth_place",
        "birth_place": "birth_place",
        "birthDate": "birth_date",
        "birth_date": "birth_date",
        "gender": "gender",
        "height": "height",
        "weight": "weight",
        "schoolId": "school_id",
        "school_id": "school_id",
        "schoolCode": "school_code",
        "school_code": "school_code",
        "avatar": "avatar",
        "hbLast": "hb_last",
        "hb_last": "hb_last",
        "consumptionCount": "consumption_count",
        "consumption_count": "consumption_count",
        "totalTarget": "total_target",
        "total_target": "total_target",
    }

    assignments: list[str] = []
    values: list[Any] = []

    for payload_key, column in allowed_fields.items():
        if payload_key in payload:
            assignments.append(f"{column} = %s")
            values.append(payload[payload_key])

    if not assignments:
        return {
            "success": True,
            "message": "No changes applied",
            "data": user_to_profile_response(user, request),
        }

    updated_at = mysql_timestamp()
    assignments.append("updated_at = %s")
    values.append(updated_at)
    values.append(user["id"])

    execute_write(f"UPDATE users SET {', '.join(assignments)} WHERE id = %s", tuple(values))
    refreshed_user = fetch_one("SELECT * FROM users WHERE id = %s LIMIT 1", (user["id"],))
    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": user_to_profile_response(refreshed_user or user, request),
    }


@app.post("/api/users/profile/avatar")
async def upload_avatar(
    request: Request,
    avatar: UploadFile = File(...),
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    if not avatar.filename:
        raise HTTPException(status_code=422, detail="File avatar wajib diupload")
    if avatar.content_type and not avatar.content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="File avatar harus berupa gambar")

    stored_filename, _size = await save_upload_file(avatar)
    previous_avatar = user.get("avatar")
    updated_at = mysql_timestamp()
    execute_write(
        "UPDATE users SET avatar = %s, updated_at = %s WHERE id = %s",
        (stored_filename, updated_at, user["id"]),
    )
    await remove_uploaded_file_if_unused(previous_avatar)

    return {
        "success": True,
        "message": "Avatar uploaded successfully",
        "data": {
            "avatar": resolve_media_url(request, stored_filename),
            "updated_at": parse_timestamp(updated_at),
        },
    }


@app.delete("/api/users/profile/avatar")
async def delete_avatar(
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    previous_avatar = user.get("avatar")
    updated_at = mysql_timestamp()
    execute_write(
        "UPDATE users SET avatar = NULL, updated_at = %s WHERE id = %s",
        (updated_at, user["id"]),
    )
    await remove_uploaded_file_if_unused(previous_avatar)
    return {
        "success": True,
        "message": "Avatar deleted successfully",
        "data": {
            "avatar": None,
            "updated_at": parse_timestamp(updated_at),
        },
    }


@app.post("/api/reports/submit")
async def submit_report(
    request: Request,
    date: str = Form(...),
    photo: UploadFile = File(...),
    notes: str = Form(default=""),
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    normalized_date = str(date).strip()
    normalized_notes = str(notes or "").strip()

    if not normalized_date:
        raise HTTPException(status_code=422, detail="Tanggal wajib diisi")
    if not photo.filename:
        raise HTTPException(status_code=422, detail="Foto bukti wajib diupload")
    if photo.content_type and not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="File harus berupa gambar")

    stored_filename, photo_size = await save_upload_file(photo)
    created_at = mysql_timestamp()

    try:
        report_id = execute_insert(
            """
            INSERT INTO reports (
                user_id, report_date, notes, photo_filename, photo_original_name,
                photo_mime_type, photo_size, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user["id"],
                normalized_date,
                normalized_notes,
                stored_filename,
                photo.filename,
                photo.content_type or "image/jpeg",
                photo_size,
                created_at,
                created_at,
            ),
        )
        execute_write(
            """
            UPDATE users
            SET consumption_count = COALESCE(consumption_count, 0) + 1, updated_at = %s
            WHERE id = %s
            """,
            (created_at, user["id"]),
        )
    except Exception:
        await remove_uploaded_file_if_unused(stored_filename)
        raise

    return {
        "success": True,
        "message": "Laporan berhasil dikirim.",
        "data": {
            "report_id": report_id,
            "date": normalized_date,
            "timestamp": parse_timestamp(created_at),
            "photo_url": build_upload_url(request, stored_filename),
        },
    }


@app.get("/api/reports")
def get_reports(
    request: Request,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    offset = (page - 1) * limit
    reports = fetch_all(
        """
        SELECT * FROM reports
        WHERE user_id = %s
        ORDER BY created_at DESC, id DESC
        LIMIT %s OFFSET %s
        """,
        (user["id"], limit, offset),
    )
    total_row = fetch_one("SELECT COUNT(*) AS total FROM reports WHERE user_id = %s", (user["id"],))
    total_reports = int((total_row or {}).get("total") or 0)

    return {
        "success": True,
        "data": {
            "hb_trends": [(user.get("hb_last") or 12.0) for _ in reports],
            "consumption_rate": total_reports,
            "total_count": total_reports,
            "reports": [
                {
                    "id": row["id"],
                    "user_id": row["user_id"],
                    "date": row["report_date"],
                    "hb_value": user.get("hb_last") or 12.0,
                    "status": "Selesai",
                    "photo_url": build_upload_url(request, row.get("photo_filename")),
                    "notes": row.get("notes") or "",
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                    "timestamp": int(datetime.fromisoformat(row["created_at"]).timestamp() * 1000),
                }
                for row in reports
            ],
        },
        "meta": {
            "page": page,
            "limit": limit,
            "total": total_reports,
        },
    }


@app.get("/api/reports/{report_id}")
def get_report_by_id(
    request: Request,
    report_id: int,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    row = fetch_one(
        "SELECT * FROM reports WHERE id = %s AND user_id = %s LIMIT 1",
        (report_id, user["id"]),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    return {
        "success": True,
        "data": {
            "id": row["id"],
            "user_id": row["user_id"],
            "date": row["report_date"],
            "photo_url": build_upload_url(request, row.get("photo_filename")),
            "notes": row.get("notes") or "",
            "hb_value": user.get("hb_last") or 12.0,
            "status": "Selesai",
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        },
    }


@app.get("/api/notifications")
def get_notifications(
    authorization: Optional[str] = Header(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    offset = (page - 1) * limit
    notifications = fetch_all(
        """
        SELECT * FROM notifications
        WHERE user_id = %s
        ORDER BY created_at DESC, id DESC
        LIMIT %s OFFSET %s
        """,
        (user["id"], limit, offset),
    )
    total_row = fetch_one("SELECT COUNT(*) AS total FROM notifications WHERE user_id = %s", (user["id"],))
    unread_row = fetch_one(
        "SELECT COUNT(*) AS total FROM notifications WHERE user_id = %s AND is_read = FALSE",
        (user["id"],),
    )
    total_notifications = int((total_row or {}).get("total") or 0)
    unread_total = int((unread_row or {}).get("total") or 0)

    return {
        "success": True,
        "data": [
            {
                "id": row["id"],
                "type": row["type"],
                "title": row["title"],
                "message": row["message"],
                "timestamp": row["created_at"],
                "read": bool(row.get("is_read")),
                "icon": row.get("icon"),
                "color": row.get("color"),
                "action": row.get("action"),
                "metadata": {},
            }
            for row in notifications
        ],
        "meta": {
            "total": total_notifications,
            "unread": unread_total,
            "page": page,
            "limit": limit,
        },
    }


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    updated = execute_write(
        """
        UPDATE notifications
        SET is_read = TRUE, updated_at = %s
        WHERE id = %s AND user_id = %s
        """,
        (mysql_timestamp(), notification_id, user["id"]),
    )
    if updated == 0:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    return {"success": True, "message": "Notification marked as read"}


@app.put("/api/notifications/read-all")
def mark_all_notifications_read(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    user = get_current_user(authorization)
    execute_write(
        "UPDATE notifications SET is_read = TRUE, updated_at = %s WHERE user_id = %s",
        (mysql_timestamp(), user["id"]),
    )
    return {"success": True, "message": "All notifications marked as read"}


@app.delete("/api/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    deleted = execute_write(
        "DELETE FROM notifications WHERE id = %s AND user_id = %s",
        (notification_id, user["id"]),
    )
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    return {"success": True, "message": "Notification deleted"}


@app.get("/api/schools")
def get_schools(
    kota: Optional[str] = Query(default=None),
    provinsi: Optional[str] = Query(default=None),
) -> dict[str, Any]:
    query = "SELECT * FROM schools WHERE 1 = 1"
    params: list[Any] = []
    if kota:
        query += " AND LOWER(COALESCE(kota, '')) LIKE %s"
        params.append(f"%{str(kota).lower()}%")
    if provinsi:
        query += " AND LOWER(COALESCE(provinsi, '')) LIKE %s"
        params.append(f"%{str(provinsi).lower()}%")
    query += " ORDER BY nama ASC"

    rows = fetch_all(query, tuple(params))
    data = [school_row_to_dict(row) for row in rows]
    return {"success": True, "data": data, "meta": {"total": len(data)}}


@app.get("/api/schools/{school_id}")
def get_school_by_id(school_id: str) -> dict[str, Any]:
    row = get_school_row(school_id=school_id, school_code=school_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Sekolah tidak ditemukan")
    payload = school_row_to_dict(row)
    payload["siswa"] = []
    return {"success": True, "data": payload}


@app.get("/api/schools/{school_id}/location")
def get_school_location(school_id: str) -> dict[str, Any]:
    row = get_school_row(school_id=school_id, school_code=school_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Sekolah tidak ditemukan")
    return {
        "success": True,
        "data": {
            "id": row["id"],
            "nama": row["nama"],
            "alamat": row["alamat"],
            "kota": row["kota"],
            "latitude": row["latitude"],
            "longitude": row["longitude"],
            "maps_url": f"https://www.google.com/maps?q={row['latitude']},{row['longitude']}",
            "embed_url": f"https://maps.google.com/maps?q={row['latitude']},{row['longitude']}&z=16&output=embed",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=UVICORN_RELOAD)
