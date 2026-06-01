from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.api.deps import get_current_user
from app.core.database import get_connection

router = APIRouter()

# REQUEST BODY
class EditProfileRequest(BaseModel):
    nama: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    tmp_lahir: str = Field(..., min_length=1)
    tgl_lahir: str = Field(..., min_length=1)
    gender: str = Field(..., min_length=1)
    tinggi_badan: float
    berat_badan: float

    # VALIDASI STRING KOSONG
    @field_validator(
        "nama",
        "email",
        "tmp_lahir",
        "tgl_lahir",
        "gender"
    )
    @classmethod
    def tidak_boleh_kosong(cls, value):

        if not value.strip():
            raise ValueError("Field tidak boleh kosong")

        return value

    # VALIDASI TINGGI BADAN
    @field_validator("tinggi_badan")
    @classmethod
    def validasi_tinggi(cls, value):

        if value <= 0:
            raise ValueError("Tinggi badan harus lebih dari 0")

        return value

    # VALIDASI BERAT BADAN
    @field_validator("berat_badan")
    @classmethod
    def validasi_berat(cls, value):

        if value <= 0:
            raise ValueError("Berat badan harus lebih dari 0")

        return value

# GET PROFILE
@router.get("/siswa/profile")
def get_profile(user=Depends(get_current_user)):

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
            s.id,
            s.nis,
            s.nama,
            s.email,
            s.tmp_lahir,
            s.tgl_lahir,
            s.gender,
            s.tinggi_badan,
            s.berat_badan,
            sk.nama AS sekolah
        FROM siswa s
        JOIN sekolah sk ON s.sekolah_id = sk.id
        WHERE s.nis = %s
        """

        cursor.execute(sql, (nis,))
        data = cursor.fetchone()

        if not data:
            raise HTTPException(
                status_code=404,
                detail="Data siswa tidak ditemukan"
            )
        
        return {
            "message": "Data profil berhasil diambil",
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

# EDIT PROFILE
@router.put("/siswa/edit-profile")
def edit_profile(
    request: EditProfileRequest,
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
        UPDATE siswa
        SET
            nama = %s,
            email = %s,
            tmp_lahir = %s,
            tgl_lahir = %s,
            gender = %s,
            tinggi_badan = %s,
            berat_badan = %s
        WHERE nis = %s
        """

        cursor.execute(sql, (
            request.nama,
            request.email,
            request.tmp_lahir,
            request.tgl_lahir,
            request.gender,
            request.tinggi_badan,
            request.berat_badan,
            nis
        ))

        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Data siswa tidak ditemukan"
            )

        return {
            "message": "Profil berhasil diperbarui"
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