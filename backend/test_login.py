import urllib.request
import json
import os

TEST_NISN = os.environ.get("MODIVA_TEST_NISN", "10001")
TEST_SCHOOL_CODE = os.environ.get("MODIVA_TEST_SCHOOL_CODE", "20223819")

data = json.dumps({"nisn": TEST_NISN, "schoolCode": TEST_SCHOOL_CODE}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login-siswa", data=data, headers={"Content-Type": "application/json"})
try:
    response = urllib.request.urlopen(req)
    print("STATUS:", response.status)
    print("BODY:", response.read().decode("utf-8"))
except Exception as e:
    print("ERROR:", e)
    if hasattr(e, "read"):
        print("BODY:", e.read().decode("utf-8"))
