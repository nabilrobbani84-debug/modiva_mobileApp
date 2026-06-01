from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.core.database import get_connection

router = APIRouter()

# GET LIST RIWAYAT
@router.get("/riwayat-konsumsi")
def get_riwayat(user=Depends(get_current_user)):

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User tidak valid"
        )

    nis = user.get("nis")

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        SELECT
            id,
            tgl_terima,
            tanggal_konsumsi,
            jumlah,
            status_konsumsi,
            bukti_foto,
            keterangan
        FROM distribusi_siswa
        WHERE nis = %s
        ORDER BY tgl_terima DESC
        """

        cursor.execute(sql, (nis,))
        data = cursor.fetchall()

        return {
            "message": "Riwayat konsumsi berhasil diambil",
            "total": len(data),
            "data": data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


# GET DETAIL RIWAYAT
@router.get("/riwayat-konsumsi/{distribusi_id}")
def detail_riwayat(
    distribusi_id: int,
    user=Depends(get_current_user)
):

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User tidak valid"
        )

    nis = user.get("nis")

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        SELECT
            id,
            nis,
            nama_siswa,
            tgl_terima,
            tanggal_konsumsi,
            jumlah,
            status_konsumsi,
            bukti_foto,
            keterangan
        FROM distribusi_siswa
        WHERE id = %s
        AND nis = %s
        """

        cursor.execute(sql, (distribusi_id, nis))

        data = cursor.fetchone()

        if not data:
            raise HTTPException(
                status_code=404,
                detail="Riwayat tidak ditemukan"
            )

        return {
            "message": "Detail riwayat berhasil diambil",
            "data": data
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()