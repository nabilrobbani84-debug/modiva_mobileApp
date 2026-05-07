import urllib.request
import json

data = json.dumps({"nisn": "0110222079", "schoolCode": "SMPN1JKT"}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login-siswa", data=data, headers={"Content-Type": "application/json"})
try:
    response = urllib.request.urlopen(req)
    print("STATUS:", response.status)
    print("BODY:", response.read().decode("utf-8"))
except Exception as e:
    print("ERROR:", e)
    if hasattr(e, "read"):
        print("BODY:", e.read().decode("utf-8"))
