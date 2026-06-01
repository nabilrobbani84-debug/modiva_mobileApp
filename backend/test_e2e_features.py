import urllib.request
import urllib.parse
import json
import os

TEST_NISN = os.environ.get("MODIVA_TEST_NISN", "10001")
TEST_SCHOOL_CODE = os.environ.get("MODIVA_TEST_SCHOOL_CODE", "20223819")

data = json.dumps({"nisn": TEST_NISN, "schoolCode": TEST_SCHOOL_CODE}).encode("utf-8")
req_login = urllib.request.Request("http://127.0.0.1:8000/api/auth/login-siswa", data=data, headers={"Content-Type": "application/json"})
login_res = urllib.request.urlopen(req_login)
login_data = json.loads(login_res.read().decode("utf-8"))
token = login_data["token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Test Schools
req = urllib.request.Request("http://127.0.0.1:8000/api/schools", headers=headers)
schools = json.loads(urllib.request.urlopen(req).read().decode())["data"]
print("Schools list OK, count:", len(schools))

req = urllib.request.Request(f"http://127.0.0.1:8000/api/schools/{schools[0]['id']}", headers=headers)
school_detail = json.loads(urllib.request.urlopen(req).read().decode())["data"]
print("School detail OK:", school_detail["nama"])

req = urllib.request.Request(f"http://127.0.0.1:8000/api/schools/{schools[0]['id']}/location", headers=headers)
school_loc = json.loads(urllib.request.urlopen(req).read().decode())["data"]
print("School location OK:", school_loc["maps_url"])

# Test Notifications
req = urllib.request.Request("http://127.0.0.1:8000/api/notifications", headers=headers)
notifs = json.loads(urllib.request.urlopen(req).read().decode())["data"]
print("Notifications list OK, count:", len(notifs))

if len(notifs) > 0:
    notif_id = notifs[0]["id"]
    req = urllib.request.Request(f"http://127.0.0.1:8000/api/notifications/{notif_id}/read", method="PUT", headers=headers)
    urllib.request.urlopen(req)
    print("Mark notification as read OK")

    req = urllib.request.Request("http://127.0.0.1:8000/api/notifications/read-all", method="PUT", headers=headers)
    urllib.request.urlopen(req)
    print("Mark all notifications as read OK")

    req = urllib.request.Request(f"http://127.0.0.1:8000/api/notifications/{notif_id}", method="DELETE", headers=headers)
    urllib.request.urlopen(req)
    print("Delete notification OK")
