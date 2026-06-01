from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from datetime import datetime
import os
import shutil

from app.api.deps import get_current_user
from app.core.database import get_connection

router = APIRouter()

UPLOAD_FOLDER = "uploads"


@router.post("/ttd")
def update_ttd(
    distribusi_id: int = Form(...),
    tanggal_konsumsi: str = Form(...),
    keterangan: str = Form(None),
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):

    # VALIDASI USER
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User tidak valid"
        )

    nis = user.get("nis")
    nama = user.get("nama")

    if not nis or not nama:
        raise HTTPException(
            status_code=401,
            detail="Data user tidak lengkap dalam token"
        )

    # VALIDASI TANGGAL
    try:
        tanggal = datetime.strptime(
            tanggal_konsumsi,
            "%Y-%m-%d"
        ).strftime("%Y%m%d")

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Format tanggal harus YYYY-MM-DD"
        )

    # VALIDASI FILE
    if not file:
        raise HTTPException(
            status_code=400,
            detail="File bukti konsumsi wajib diupload"
        )

    if file.filename == "":
        raise HTTPException(
            status_code=400,
            detail="File tidak boleh kosong"
        )

    # validasi extension
    allowed_extensions = ["jpg", "jpeg", "png"]

    ext = file.filename.split(".")[-1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Format file harus JPG, JPEG, atau PNG"
        )

    # validasi ukuran file maksimal 5MB
    contents = file.file.read()

    max_size = 5 * 1024 * 1024  # 5MB

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Ukuran file maksimal 5MB"
        )

    # reset pointer file
    file.file.seek(0)

    # FORMAT NAMA FILE
    nama_clean = nama.replace(" ", "_")

    filename = f"{nis}_{tanggal}_{nama_clean}.{ext}"

    # SIMPAN FILE
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal upload file: {str(e)}"
        )

    # UPDATE DATABASE
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        sql = """
        UPDATE distribusi_siswa
        SET 
            tanggal_konsumsi = %s,
            bukti_foto = %s,
            keterangan = %s,
            status_konsumsi = 'sudah'
        WHERE id = %s AND nis = %s
        """

        cursor.execute(sql, (
            tanggal_konsumsi,
            filename,
            keterangan,
            distribusi_id,
            nis
        ))

        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Data distribusi tidak ditemukan"
            )

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

    # RESPONSE
    return {
        "message": "Laporan konsumsi berhasil disimpan",
        "file": filename
    }