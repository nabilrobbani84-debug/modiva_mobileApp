import pymysql

try:
    connection = pymysql.connect(
        host="127.0.0.1",
        user="root",
        password="",
        database="modiva",
        port=3306
    )
    with connection.cursor() as cursor:
        sql = """
        ALTER TABLE distribusi_siswa
        ADD COLUMN tanggal_konsumsi DATE NULL,
        ADD COLUMN bukti_foto VARCHAR(255) NULL,
        ADD COLUMN keterangan TEXT NULL,
        ADD COLUMN status_konsumsi ENUM('belum', 'sudah') DEFAULT 'belum';
        """
        cursor.execute(sql)
    connection.commit()
    print("Table altered successfully.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'connection' in locals() and connection.open:
        connection.close()
