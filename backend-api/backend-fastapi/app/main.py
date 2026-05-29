from fastapi import Depends, FastAPI
from app.api.deps import get_current_user 
from fastapi.security import HTTPBearer
from app.api import ttd
from app.api import siswa_hb
from app.api import profile
from app.api import sekolah
from app.api import riwayat

app = FastAPI()

# Register bukti konsumsi
app.include_router(ttd.router, prefix="/api")

# Register statistik hb
app.include_router(siswa_hb.router, prefix="/api")

# Register profile siswa
app.include_router(profile.router, prefix="/api")

# Register lokasi sekolah ketika login
app.include_router(sekolah.router, prefix="/api")

# Register riwayat konsumsi obat
app.include_router(riwayat.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "FastAPI is running"}

@app.get("/protected", dependencies=[Depends(HTTPBearer())])
def protected(user=Depends(get_current_user)):
    return {
        "message": "Akses berhasil",
        "user": user
    }
