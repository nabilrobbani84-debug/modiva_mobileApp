from __future__ import annotations

import json
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
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3309"))
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "db_modiva")
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in str(os.environ.get("CORS_ALLOW_ORIGINS", "*")).split(",")
    if origin.strip()
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


def is_couchbase_configured() -> bool:
    return False


def validate_couchbase_config() -> None:
    return


def check_couchbase_connection() -> dict[str, Any]:
    return {
        "configured": False,
        "available": False,
        "message": "Couchbase dinonaktifkan. Backend menggunakan MySQL sebagai database utama.",
        "bucket": None,
    }


def get_couchbase_cluster():
    raise RuntimeError("Couchbase dinonaktifkan")


def get_couchbase_notification_collection():
    cluster = get_couchbase_cluster()
    bucket = cluster.bucket(COUCHBASE_BUCKET)
    collection = bucket.default_collection()
    return cluster, collection


def get_couchbase_report_collection():
    cluster = get_couchbase_cluster()
    bucket = cluster.bucket(COUCHBASE_BUCKET)
    collection = bucket.default_collection()
    return cluster, collection


def get_couchbase_school_collection():
    cluster = get_couchbase_cluster()
    bucket = cluster.bucket(COUCHBASE_BUCKET)
    collection = bucket.default_collection()
    return cluster, collection


def get_couchbase_profile_collection():
    cluster = get_couchbase_cluster()
    bucket = cluster.bucket(COUCHBASE_BUCKET)
    collection = bucket.default_collection()
    return cluster, collection


def build_notification_feed_doc_id(user_id: str) -> str:
    return f"{COUCHBASE_NOTIFICATION_FEED_PREFIX}{user_id}"


def build_report_feed_doc_id(user_id: str) -> str:
    return f"{COUCHBASE_REPORT_FEED_PREFIX}{user_id}"


def build_school_doc_id(school_id: str) -> str:
    return f"{COUCHBASE_SCHOOL_PREFIX}{school_id}"


def build_profile_doc_id(user_id: str) -> str:
    return f"{COUCHBASE_PROFILE_PREFIX}{user_id}"


def notification_row_to_payload(row: dict[str, Any]) -> dict[str, Any]:
    raw_metadata = row.get("metadata")
    parsed_metadata: Any = {}
    if isinstance(raw_metadata, str) and raw_metadata.strip():
        try:
            parsed_metadata = json.loads(raw_metadata)
        except json.JSONDecodeError:
            parsed_metadata = {"raw": raw_metadata}
    elif isinstance(raw_metadata, dict):
        parsed_metadata = raw_metadata

    return {
        "id": int(row["id"]),
        "type": row["type"],
        "title": row["title"],
        "message": row["message"],
        "timestamp": row["created_at"],
        "read": bool(row.get("is_read")),
        "icon": row.get("icon"),
        "color": row.get("color"),
        "action": row.get("action"),
        "metadata": parsed_metadata,
        "updated_at": row.get("updated_at"),
    }


def report_row_to_payload(row: dict[str, Any], user_row: Optional[dict[str, Any]] = None, request: Optional[Request] = None) -> dict[str, Any]:
    hb_value = (user_row or {}).get("hb_last")
    created_at = row["created_at"]
    created_at_dt = datetime.fromisoformat(created_at)
    return {
        "id": int(row["id"]),
        "user_id": row["user_id"],
        "date": row["report_date"],
        "hb_value": hb_value,
        "status": "Selesai",
        "photo_url": build_upload_url(request, row.get("photo_filename")) if request else row.get("photo_filename"),
        "notes": row.get("notes") or "",
        "created_at": created_at,
        "updated_at": row["updated_at"],
        "timestamp": int(created_at_dt.timestamp() * 1000),
    }


def build_app_hb_trends(user_id: str) -> list[dict[str, Any]]:
    rows = fetch_all(
        """
        SELECT id, legacy_hb_id, year_label, hb_value, notes, created_at
        FROM user_hb_history
        WHERE user_id = %s
        ORDER BY year_label ASC, id ASC
        """,
        (user_id,),
    )

    trends: list[dict[str, Any]] = []
    for row in rows:
        year = int(row["year_label"])
        point_id = row.get("legacy_hb_id") or row["id"]
        trends.append(
            {
                "id": f"hb-{point_id}",
                "hb_value": float(row["hb_value"]),
                "date": f"{year}-12-31",
                "timestamp": int(datetime(year, 12, 31).timestamp() * 1000),
                "notes": row.get("notes") or "",
            }
        )

    return trends


def write_notification_feed_to_couchbase(user_id: str, notifications: list[dict[str, Any]]) -> None:
    if not is_couchbase_configured():
        return

    cluster = None
    try:
        cluster, collection = get_couchbase_notification_collection()
        doc_id = build_notification_feed_doc_id(user_id)
        unread_total = sum(0 if item.get("read") else 1 for item in notifications)
        collection.upsert(
            doc_id,
            {
                "docType": "notification_feed",
                "user_id": str(user_id),
                "notifications": notifications,
                "total": len(notifications),
                "unread": unread_total,
                "updated_at": utc_now_iso(),
            },
        )
    except Exception as error:
        print(f"[Modiva] Sinkronisasi notifikasi ke Couchbase gagal untuk user {user_id}: {error}")
    finally:
        if cluster is not None:
            cluster.close()


def sync_user_notifications_to_couchbase(user_id: str) -> None:
    if not is_couchbase_configured():
        return

    rows = fetch_all(
        """
        SELECT * FROM notifications
        WHERE user_id = %s
        ORDER BY created_at DESC, id DESC
        """,
        (user_id,),
    )
    notifications = [notification_row_to_payload(row) for row in rows]
    write_notification_feed_to_couchbase(str(user_id), notifications)


def sync_all_notifications_to_couchbase() -> None:
    if not is_couchbase_configured():
        return

    user_rows = fetch_all("SELECT DISTINCT user_id FROM notifications ORDER BY user_id ASC")
    for user_row in user_rows:
        user_id = str(user_row.get("user_id") or "").strip()
        if user_id:
            sync_user_notifications_to_couchbase(user_id)


def write_report_feed_to_couchbase(user_id: str, reports: list[dict[str, Any]]) -> None:
    if not is_couchbase_configured():
        return

    cluster = None
    try:
        cluster, collection = get_couchbase_report_collection()
        doc_id = build_report_feed_doc_id(user_id)
        collection.upsert(
            doc_id,
            {
                "docType": "report_feed",
                "user_id": str(user_id),
                "reports": reports,
                "total": len(reports),
                "updated_at": utc_now_iso(),
            },
        )
    except Exception as error:
        print(f"[Modiva] Sinkronisasi laporan ke Couchbase gagal untuk user {user_id}: {error}")
    finally:
        if cluster is not None:
            cluster.close()


def sync_user_reports_to_couchbase(user_id: str) -> None:
    if not is_couchbase_configured():
        return

    user_row = fetch_one("SELECT * FROM users WHERE id = %s LIMIT 1", (user_id,))
    rows = fetch_all(
        """
        SELECT * FROM reports
        WHERE user_id = %s
        ORDER BY created_at DESC, id DESC
        """,
        (user_id,),
    )
    reports = [report_row_to_payload(row, user_row=user_row) for row in rows]
    write_report_feed_to_couchbase(str(user_id), reports)


def sync_all_reports_to_couchbase() -> None:
    if not is_couchbase_configured():
        return

    user_rows = fetch_all("SELECT DISTINCT user_id FROM reports ORDER BY user_id ASC")
    for user_row in user_rows:
        user_id = str(user_row.get("user_id") or "").strip()
        if user_id:
            sync_user_reports_to_couchbase(user_id)


def write_school_documents_to_couchbase(schools: list[dict[str, Any]]) -> None:
    if not is_couchbase_configured():
        return

    cluster = None
    try:
        cluster, collection = get_couchbase_school_collection()
        school_ids: list[str] = []
        for school in schools:
            school_id = str(school["id"])
            school_ids.append(school_id)
            collection.upsert(
                build_school_doc_id(school_id),
                {
                    "docType": "school",
                    **school,
                    "updated_at": utc_now_iso(),
                },
            )

        collection.upsert(
            COUCHBASE_SCHOOL_INDEX_DOC_ID,
            {
                "docType": "school_index",
                "school_ids": school_ids,
                "total": len(school_ids),
                "updated_at": utc_now_iso(),
            },
        )
    except Exception as error:
        print(f"[Modiva] Sinkronisasi schools ke Couchbase gagal: {error}")
    finally:
        if cluster is not None:
            cluster.close()


def sync_all_schools_to_couchbase() -> None:
    if not is_couchbase_configured():
        return

    rows = fetch_all("SELECT * FROM schools ORDER BY nama ASC")
    schools = [school_row_to_dict(row) for row in rows]
    write_school_documents_to_couchbase(schools)


def get_school_index_from_couchbase() -> Optional[dict[str, Any]]:
    if not is_couchbase_configured():
        return None

    cluster = None
    try:
        cluster, collection = get_couchbase_school_collection()
        result = collection.get(COUCHBASE_SCHOOL_INDEX_DOC_ID)
        return result.content_as[dict]
    except DocumentNotFoundException:
        return None
    except Exception:
        return None
    finally:
        if cluster is not None:
            cluster.close()


def get_school_document_from_couchbase(school_id: str) -> Optional[dict[str, Any]]:
    if not is_couchbase_configured():
        return None

    cluster = None
    try:
        cluster, collection = get_couchbase_school_collection()
        result = collection.get(build_school_doc_id(school_id))
        return result.content_as[dict]
    except DocumentNotFoundException:
        return None
    except Exception:
        return None
    finally:
        if cluster is not None:
            cluster.close()


def get_schools_from_couchbase(*, kota: Optional[str] = None, provinsi: Optional[str] = None) -> Optional[list[dict[str, Any]]]:
    index_doc = get_school_index_from_couchbase()
    if not index_doc:
        return None

    school_ids = [str(item) for item in index_doc.get("school_ids") or []]
    schools: list[dict[str, Any]] = []
    for school_id in school_ids:
        document = get_school_document_from_couchbase(school_id)
        if document:
            schools.append(document)

    if kota:
        expected = str(kota).lower()
        schools = [school for school in schools if expected in str(school.get("kota") or "").lower()]

    if provinsi:
        expected = str(provinsi).lower()
        schools = [school for school in schools if expected in str(school.get("provinsi") or "").lower()]

    schools.sort(key=lambda item: str(item.get("nama") or ""))
    return schools


def write_profile_snapshot_to_couchbase(user_id: str, payload: dict[str, Any]) -> None:
    if not is_couchbase_configured():
        return

    cluster = None
    try:
        cluster, collection = get_couchbase_profile_collection()
        collection.upsert(
            build_profile_doc_id(user_id),
            {
                "docType": "profile_snapshot",
                "user_id": str(user_id),
                "profile": payload,
                "updated_at": utc_now_iso(),
            },
        )
    except Exception as error:
        print(f"[Modiva] Sinkronisasi profile snapshot ke Couchbase gagal untuk user {user_id}: {error}")
    finally:
        if cluster is not None:
            cluster.close()


def sync_user_profile_to_couchbase(user_id: str) -> None:
    if not is_couchbase_configured():
        return

    user_row = fetch_one("SELECT * FROM users WHERE id = %s LIMIT 1", (user_id,))
    if user_row is None:
        return
    payload = user_to_profile_response(user_row)
    write_profile_snapshot_to_couchbase(str(user_id), payload)


def sync_all_profiles_to_couchbase() -> None:
    if not is_couchbase_configured():
        return

    user_rows = fetch_all("SELECT id FROM users ORDER BY id ASC")
    for user_row in user_rows:
        user_id = str(user_row.get("id") or "").strip()
        if user_id:
            sync_user_profile_to_couchbase(user_id)


def get_profile_snapshot_from_couchbase(user_id: str) -> Optional[dict[str, Any]]:
    if not is_couchbase_configured():
        return None

    cluster = None
    try:
        cluster, collection = get_couchbase_profile_collection()
        result = collection.get(build_profile_doc_id(user_id))
        content = result.content_as[dict]
        return dict(content.get("profile") or {})
    except DocumentNotFoundException:
        return None
    except Exception:
        return None
    finally:
        if cluster is not None:
            cluster.close()


def get_report_feed_from_couchbase(user_id: str) -> Optional[dict[str, Any]]:
    if not is_couchbase_configured():
        return None

    cluster = None
    try:
        cluster, collection = get_couchbase_report_collection()
        result = collection.get(build_report_feed_doc_id(user_id))
        content = result.content_as[dict]
        reports = list(content.get("reports") or [])
        return {
            "success": True,
            "data": reports,
            "meta": {
                "total": int(content.get("total") or len(reports)),
            },
        }
    except DocumentNotFoundException:
        return None
    except Exception:
        return None
    finally:
        if cluster is not None:
            cluster.close()


def get_notification_feed_from_couchbase(user_id: str) -> Optional[dict[str, Any]]:
    if not is_couchbase_configured():
        return None

    cluster = None
    try:
        cluster, collection = get_couchbase_notification_collection()
        result = collection.get(build_notification_feed_doc_id(user_id))
        content = result.content_as[dict]
        notifications = list(content.get("notifications") or [])
        return {
            "success": True,
            "data": notifications,
            "meta": {
                "total": int(content.get("total") or len(notifications)),
                "unread": int(content.get("unread") or 0),
            },
        }
    except DocumentNotFoundException:
        return None
    except Exception:
        return None
    finally:
        if cluster is not None:
            cluster.close()


def validate_runtime_config() -> None:
    validate_couchbase_config()

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
                gender VARCHAR(16) NOT NULL DEFAULT 'F',
                height DOUBLE NULL,
                weight DOUBLE NULL,
                hb_last DOUBLE NULL,
                consumption_count INT NOT NULL DEFAULT 0,
                total_target INT NOT NULL DEFAULT 90,
                role VARCHAR(32) NOT NULL DEFAULT 'siswi',
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
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_hb_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(32) NOT NULL,
                legacy_hb_id INT NULL UNIQUE,
                year_label INT NOT NULL,
                hb_value DOUBLE NOT NULL,
                notes TEXT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                CONSTRAINT fk_user_hb_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )


def seed_database() -> None:
    legacy_mode = is_laragon_legacy_schema_available()
    if legacy_mode:
        legacy_school_count = count_table_rows("sekolah")
        legacy_student_count = count_table_rows("siswa")
        app_school_count = count_table_rows("schools")
        app_user_count = count_table_rows("users")

        if app_school_count < legacy_school_count or app_user_count < legacy_student_count:
            sync_laragon_schema_to_app_tables()
        else:
            print("[Modiva] Tabel aplikasi sudah terisi. Bootstrap Laragon dilewati.")
    else:
        print(
            "[Modiva] Schema legacy Laragon tidak ditemukan. "
            "Backend tidak akan menambahkan seed users, schools, atau notifications otomatis."
        )


def init_database() -> None:
    ensure_database()
    ensure_tables()
    seed_database()
    normalize_siswi_runtime_data()


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


def count_table_rows(table_name: str) -> int:
    result = fetch_one(f"SELECT COUNT(*) AS total FROM `{table_name}`")
    return int((result or {}).get("total") or 0)


def table_exists(table_name: str) -> bool:
    result = fetch_one(
        """
        SELECT 1 AS ok
        FROM information_schema.tables
        WHERE table_schema = %s AND table_name = %s
        LIMIT 1
        """,
        (MYSQL_DATABASE, table_name),
    )
    return bool(result)


def table_columns(table_name: str) -> set[str]:
    rows = fetch_all(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        """,
        (MYSQL_DATABASE, table_name),
    )
    return {str(row["column_name"]) for row in rows}


def normalize_siswi_runtime_data() -> None:
    if not table_exists("users"):
        return

    execute_write(
        """
        UPDATE users
        SET gender = 'F', role = 'siswi'
        WHERE gender IS NULL
           OR gender <> 'F'
           OR role IS NULL
           OR role <> 'siswi'
        """
    )


def is_laragon_legacy_schema_available() -> bool:
    return table_exists("siswa") and table_exists("sekolah")


def parse_legacy_coordinates(value: Optional[str]) -> tuple[Optional[float], Optional[float]]:
    raw_value = str(value or "").strip()
    if not raw_value or "," not in raw_value:
        return None, None

    latitude_raw, longitude_raw = [segment.strip() for segment in raw_value.split(",", 1)]

    try:
        return float(latitude_raw), float(longitude_raw)
    except ValueError:
        return None, None


def sync_laragon_schema_to_app_tables() -> None:
    legacy_schools = fetch_all("SELECT * FROM sekolah ORDER BY id ASC")
    legacy_students = fetch_all("SELECT * FROM siswa ORDER BY id ASC")
    hb_rows = fetch_all("SELECT * FROM siswa_hb ORDER BY tahun ASC, id ASC")
    vitamin_rows = fetch_all(
        """
        SELECT siswa_id, COALESCE(SUM(jumlah), 0) AS total
        FROM distribusi_siswa
        GROUP BY siswa_id
        """
    )

    latest_hb_by_student: dict[str, Any] = {}
    for row in hb_rows:
        student_id = str(row["siswa_id"])
        latest_hb_by_student[student_id] = row

    consumption_by_student = {
        str(row["siswa_id"]): int(row.get("total") or 0)
        for row in vitamin_rows
    }

    timestamp = mysql_timestamp()

    with db_cursor(dictionary=False) as (_connection, cursor):
        for school in legacy_schools:
            latitude, longitude = parse_legacy_coordinates(school.get("gps_koordinat"))
            cursor.execute(
                """
                INSERT INTO schools (
                    id, kode, nama, nama_lengkap, alamat, kota, provinsi, kode_pos,
                    telepon, email, kepala_sekolah, akreditasi, npsn, latitude,
                    longitude, jumlah_siswa, status, jenjang
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    kode = VALUES(kode),
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
                    str(school["id"]),
                    school["kode"],
                    school["nama"],
                    school["nama"],
                    school.get("alamat"),
                    None,
                    None,
                    None,
                    school.get("telepon"),
                    school.get("email"),
                    None,
                    None,
                    None,
                    latitude,
                    longitude,
                    0,
                    "Aktif" if bool(school.get("status")) else "Nonaktif",
                    school.get("jenjang"),
                ),
            )

        for student in legacy_students:
            student_id = str(student["id"])
            school = next((item for item in legacy_schools if str(item["id"]) == str(student["sekolah_id"])), None)
            latest_hb = latest_hb_by_student.get(student_id)
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
                    role = VALUES(role),
                    updated_at = VALUES(updated_at)
                """,
                (
                    student_id,
                    student["nama"],
                    student["nis"],
                    student.get("email"),
                    None,
                    str(student["sekolah_id"]),
                    school.get("kode") if school else None,
                    None,
                    student.get("tmp_lahir"),
                    student.get("tgl_lahir"),
                    "F",
                    student.get("tinggi_badan"),
                    student.get("berat_badan"),
                    float(latest_hb["hb"]) if latest_hb and latest_hb.get("hb") is not None else None,
                    consumption_by_student.get(student_id, 0),
                    0,
                    "siswi",
                    None,
                    student.get("created_at") or timestamp,
                    student.get("updated_at") or timestamp,
                ),
            )

        for row in hb_rows:
            timestamp_value = row.get("created_at") or row.get("updated_at") or timestamp
            cursor.execute(
                """
                INSERT INTO user_hb_history (
                    user_id, legacy_hb_id, year_label, hb_value, notes, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    user_id = VALUES(user_id),
                    year_label = VALUES(year_label),
                    hb_value = VALUES(hb_value),
                    notes = VALUES(notes),
                    updated_at = VALUES(updated_at)
                """,
                (
                    str(row["siswa_id"]),
                    int(row["id"]),
                    int(row["tahun"]),
                    float(row["hb"]),
                    row.get("keterangan"),
                    timestamp_value,
                    row.get("updated_at") or timestamp,
                ),
            )


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
        "role": user_row.get("role") or "siswi",
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
        "role": user_row.get("role") or "siswi",
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
    try:
        init_database()
        check_database_connection()
    except pymysql.MySQLError as error:
        print(f"[Modiva] MySQL belum siap: {error}")


@app.get("/health")
def healthcheck() -> dict[str, Any]:
    database_error = None
    try:
        database_status = check_database_connection()
    except pymysql.MySQLError as error:
        database_status = {"ok": False}
        database_error = str(error)
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
            "error": database_error,
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
        or payload.get("kode_sekolah")
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


@app.post("/api/login")
def login_siswa_backend_modiva(payload: dict[str, Any], request: Request) -> dict[str, Any]:
    response = login_siswa(payload, request)
    user = response["user"]
    return {
        "success": True,
        "message": "Login berhasil",
        "access": response["token"],
        "token": response["token"],
        "refreshToken": response["refreshToken"],
        "data": {
            "siswa_id": user["id"],
            "nis": user["nisn"],
            "nama": user["name"],
            "sekolah": user["school"],
        },
        "user": user,
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
    return {"success": True, "data": user_to_profile_response(user, request), "meta": {"source": "mysql"}}


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

    # Sync to legacy 'siswa' table if available
    if is_laragon_legacy_schema_available():
        try:
            legacy_columns = table_columns("siswa")
            legacy_allowed_fields = {
                "name": "nama",
                "email": "email",
                "birthPlace": "tmp_lahir",
                "birth_place": "tmp_lahir",
                "birthDate": "tgl_lahir",
                "birth_date": "tgl_lahir",
                "height": "tinggi_badan",
                "weight": "berat_badan",
                "schoolId": "sekolah_id",
                "school_id": "sekolah_id",
                "gender": "gender",
            }
            legacy_assignments = []
            legacy_values = []
            for payload_key, column in legacy_allowed_fields.items():
                if payload_key in payload and column in legacy_columns:
                    legacy_assignments.append(f"{column} = %s")
                    legacy_values.append(payload[payload_key])
            if legacy_assignments:
                if "updated_at" in legacy_columns:
                    legacy_assignments.append("updated_at = %s")
                    legacy_values.append(updated_at)
                legacy_values.append(user["id"])
                execute_write(f"UPDATE siswa SET {', '.join(legacy_assignments)} WHERE id = %s", tuple(legacy_values))
        except Exception as sync_err:
            print(f"[Modiva] Gagal menyinkronkan edit-profile ke tabel legacy siswa: {sync_err}")

    refreshed_user = fetch_one("SELECT * FROM users WHERE id = %s LIMIT 1", (user["id"],))
    sync_user_profile_to_couchbase(str(user["id"]))
    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": user_to_profile_response(refreshed_user or user, request),
    }


@app.get("/api/siswa/profile")
def get_siswa_profile_backend_modiva(
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    profile = user_to_profile_response(user, request)
    return {
        "message": "Data profil berhasil diambil",
        "data": {
            "id": profile["id"],
            "nis": profile["nisn"],
            "nama": profile["name"],
            "email": profile["email"],
            "tmp_lahir": profile["birth_place"],
            "tgl_lahir": profile["birth_date"],
            "gender": profile["gender"],
            "tinggi_badan": profile["height"],
            "berat_badan": profile["weight"],
            "sekolah": profile["school"],
        },
    }


@app.put("/api/siswa/edit-profile")
def edit_siswa_profile_backend_modiva(
    payload: dict[str, Any],
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    mapped_payload = {
        "name": payload.get("nama"),
        "email": payload.get("email"),
        "birthPlace": payload.get("tmp_lahir"),
        "birthDate": payload.get("tgl_lahir"),
        "gender": payload.get("gender"),
        "height": payload.get("tinggi_badan"),
        "weight": payload.get("berat_badan"),
    }
    mapped_payload = {key: value for key, value in mapped_payload.items() if value is not None}
    update_profile(request, mapped_payload, authorization)
    return {"message": "Profil berhasil diperbarui"}


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
    sync_user_profile_to_couchbase(str(user["id"]))

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
    sync_user_profile_to_couchbase(str(user["id"]))
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
        if not is_laragon_legacy_schema_available():
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

    sync_user_reports_to_couchbase(str(user["id"]))

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


@app.post("/api/ttd")
async def submit_ttd_backend_modiva(
    request: Request,
    distribusi_id: int = Form(...),
    tanggal_konsumsi: str = Form(...),
    keterangan: str = Form(default=""),
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    try:
        datetime.strptime(tanggal_konsumsi, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Format tanggal harus YYYY-MM-DD")

    if not file.filename:
        raise HTTPException(status_code=400, detail="File bukti konsumsi wajib diupload")
    extension = Path(file.filename).suffix.lower().lstrip(".")
    if extension not in {"jpg", "jpeg", "png"}:
        raise HTTPException(status_code=400, detail="Format file harus JPG, JPEG, atau PNG")

    stored_filename, photo_size = await save_upload_file(file)
    created_at = mysql_timestamp()

    try:
        execute_insert(
            """
            INSERT INTO reports (
                user_id, report_date, notes, photo_filename, photo_original_name,
                photo_mime_type, photo_size, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user["id"],
                tanggal_konsumsi,
                keterangan,
                stored_filename,
                file.filename,
                file.content_type or "image/jpeg",
                photo_size,
                created_at,
                created_at,
            ),
        )

        if table_exists("distribusi_siswa"):
            columns = table_columns("distribusi_siswa")
            assignments: list[str] = []
            values: list[Any] = []
            update_values = {
                "tanggal_konsumsi": tanggal_konsumsi,
                "bukti_foto": stored_filename,
                "keterangan": keterangan,
                "status_konsumsi": "sudah",
                "updated_at": created_at,
            }
            for column, value in update_values.items():
                if column in columns:
                    assignments.append(f"{column} = %s")
                    values.append(value)
            if assignments:
                values.extend([distribusi_id, user["nisn"]])
                execute_write(
                    f"UPDATE distribusi_siswa SET {', '.join(assignments)} WHERE id = %s AND nis = %s",
                    tuple(values),
                )
    except Exception:
        await remove_uploaded_file_if_unused(stored_filename)
        raise

    sync_user_reports_to_couchbase(str(user["id"]))
    return {"message": "Laporan konsumsi berhasil disimpan", "file": stored_filename}


@app.get("/api/reports")
def get_reports(
    request: Request,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    offset = (page - 1) * limit
    hb_trends = build_app_hb_trends(str(user["id"]))

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
            "hb_trends": hb_trends,
            "consumption_rate": total_reports,
            "total_count": total_reports,
            "reports": [
                {
                    "id": row["id"],
                    "user_id": row["user_id"],
                    "date": row["report_date"],
                    "hb_value": None,
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
            "source": "mysql",
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
            "hb_value": None,
            "status": "Selesai",
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        },
    }


@app.get("/api/siswa/hb")
def get_siswa_hb_backend_modiva(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    user = get_current_user(authorization)
    rows = fetch_all(
        """
        SELECT year_label, hb_value, notes
        FROM user_hb_history
        WHERE user_id = %s
        ORDER BY year_label ASC, id ASC
        """,
        (user["id"],),
    )
    return {
        "message": "Data HB berhasil diambil",
        "data": [
            {
                "tahun": row["year_label"],
                "hb": float(row["hb_value"]) if row.get("hb_value") is not None else None,
                "keterangan": row.get("notes"),
            }
            for row in rows
        ],
    }


@app.get("/api/riwayat-konsumsi")
def get_riwayat_konsumsi_backend_modiva(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    user = get_current_user(authorization)
    rows = fetch_all(
        """
        SELECT id, report_date, notes, photo_filename, created_at
        FROM reports
        WHERE user_id = %s
        ORDER BY created_at DESC, id DESC
        """,
        (user["id"],),
    )
    data = [
        {
            "id": row["id"],
            "tgl_terima": row["created_at"],
            "tanggal_konsumsi": row["report_date"],
            "jumlah": 1,
            "status_konsumsi": "sudah",
            "bukti_foto": row["photo_filename"],
            "keterangan": row.get("notes") or "",
        }
        for row in rows
    ]
    return {"message": "Riwayat konsumsi berhasil diambil", "total": len(data), "data": data}


@app.get("/api/riwayat-konsumsi/{report_id}")
def get_detail_riwayat_konsumsi_backend_modiva(
    report_id: int,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    row = fetch_one(
        """
        SELECT id, user_id, report_date, notes, photo_filename, created_at
        FROM reports
        WHERE id = %s AND user_id = %s
        LIMIT 1
        """,
        (report_id, user["id"]),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Riwayat tidak ditemukan")
    return {
        "message": "Detail riwayat berhasil diambil",
        "data": {
            "id": row["id"],
            "nis": user["nisn"],
            "nama_siswa": user["name"],
            "tgl_terima": row["created_at"],
            "tanggal_konsumsi": row["report_date"],
            "jumlah": 1,
            "status_konsumsi": "sudah",
            "bukti_foto": row["photo_filename"],
            "keterangan": row.get("notes") or "",
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
            "source": "mysql",
        },
    }


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    user = get_current_user(authorization)
    updated_at = mysql_timestamp()
    updated = execute_write(
        """
        UPDATE notifications
        SET is_read = TRUE, updated_at = %s
        WHERE id = %s AND user_id = %s
        """,
        (updated_at, notification_id, user["id"]),
    )
    if updated == 0:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    sync_user_notifications_to_couchbase(str(user["id"]))
    return {"success": True, "message": "Notification marked as read"}


@app.put("/api/notifications/read-all")
def mark_all_notifications_read(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    user = get_current_user(authorization)
    execute_write(
        "UPDATE notifications SET is_read = TRUE, updated_at = %s WHERE user_id = %s",
        (mysql_timestamp(), user["id"]),
    )
    sync_user_notifications_to_couchbase(str(user["id"]))
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
    sync_user_notifications_to_couchbase(str(user["id"]))
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
    return {"success": True, "data": data, "meta": {"total": len(data), "source": "mysql"}}

@app.get("/api/vitamin/sekolah/siswahb")
def get_vitamin_sekolah_siswahb(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    user = get_current_user(authorization)
    
    query = """
        SELECT 
            u.nisn, 
            u.name as nama_siswa, 
            s.nama as sekolah, 
            h.year_label as tahun, 
            h.hb_value as hb, 
            h.notes as keterangan,
            u.id as siswa_id,
            h.id as history_id
        FROM user_hb_history h
        JOIN users u ON h.user_id = u.id
        LEFT JOIN schools s ON u.school_id = s.id
        ORDER BY h.year_label DESC, u.name ASC
    """
    rows = fetch_all(query)
    
    data = []
    for i, row in enumerate(rows):
        data.append({
            "no": i + 1,
            "nis": row["nisn"],
            "nama_siswa": row["nama_siswa"],
            "sekolah": row["sekolah"] or "Unknown",
            "tahun": row["tahun"],
            "hb": float(row["hb"]) if row["hb"] is not None else None,
            "keterangan": row["keterangan"] or "",
            "aksi": "view"
        })
        
    return {
        "success": True,
        "message": "Data HB Siswa berhasil diambil",
        "data": data,
        "total": len(data)
    }


@app.get("/api/sekolah/lokasi")
def get_lokasi_sekolah_backend_modiva(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    user = get_current_user(authorization)
    row = get_school_row(school_id=user["school_id"], school_code=user["school_code"])
    if row is None:
        raise HTTPException(status_code=404, detail="Data sekolah tidak ditemukan")
    gps_koordinat = None
    if row.get("latitude") is not None and row.get("longitude") is not None:
        gps_koordinat = f"{row['latitude']},{row['longitude']}"
    return {
        "nama_sekolah": row["nama"],
        "alamat": row.get("alamat"),
        "gps_koordinat": gps_koordinat,
    }


@app.get("/api/schools/{school_id}")
def get_school_by_id(school_id: str) -> dict[str, Any]:
    row = get_school_row(school_id=school_id, school_code=school_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Sekolah tidak ditemukan")
    payload = school_row_to_dict(row)
    payload["siswa"] = []
    return {"success": True, "data": payload, "meta": {"source": "mysql"}}


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
        "meta": {"source": "mysql"},
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=UVICORN_RELOAD)
