from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.core.database import get_connection

router = APIRouter()

@router.get("/siswa/hb")
def get_hb(user=Depends(get_current_user)):
    conn = None
    try:
        nis = user.get("nis")

        if not nis:
            raise HTTPException(status_code=400, detail="NIS tidak ditemukan di token")

        conn = get_connection()
        cursor = conn.cursor()

        # 1. ambil siswa_id
        cursor.execute("SELECT id FROM siswa WHERE nis = %s", (nis,))
        siswa = cursor.fetchone()

        if not siswa:
            raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")

        siswa_id = siswa["id"]

        # 2. ambil data HB
        cursor.execute("""
            SELECT tahun, hb, keterangan
            FROM siswa_hb
            WHERE siswa_id = %s
            ORDER BY tahun ASC
        """, (siswa_id,))

        # Respones
        rows = cursor.fetchall()

        data = []
        for row in rows:
            data.append({
                "tahun": row["tahun"],
                "hb": float(row["hb"]) if row["hb"] is not None else None,
                "keterangan": row["keterangan"]
            })

        return {
            "message": "Data HB berhasil diambil",
            "data": data
        }

    except Exception as e:
        # biar error kebaca jelas
        raise HTTPException(status_code=500, detail=f"Database error: {repr(e)}")

    finally:
        if conn:
            conn.close()