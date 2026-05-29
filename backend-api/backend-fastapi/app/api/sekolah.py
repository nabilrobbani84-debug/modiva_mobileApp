from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.core.database import get_connection

router = APIRouter()


@router.get("/sekolah/lokasi")
def get_lokasi_sekolah(user=Depends(get_current_user)):

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User tidak valid"
        )

    siswa_id = user.get("siswa_id")

    if not siswa_id:
        raise HTTPException(
            status_code=401,
            detail="siswa_id tidak ditemukan di token"
        )

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        SELECT 
            sk.nama,
            sk.alamat,
            sk.gps_koordinat
        FROM siswa s
        JOIN sekolah sk ON s.sekolah_id = sk.id
        WHERE s.id = %s
        """

        cursor.execute(sql, (siswa_id,))

        result = cursor.fetchone()

        # DEBUG
        print("RESULT =", result)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Data sekolah tidak ditemukan"
            )

        return {
            "nama_sekolah": result["nama"],
            "alamat": result["alamat"],
            "gps_koordinat": result["gps_koordinat"]
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