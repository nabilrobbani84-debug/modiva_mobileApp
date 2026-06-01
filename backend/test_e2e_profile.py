import urllib.request
import urllib.parse
import json
import uuid
import os

# Login
TEST_NISN = os.environ.get("MODIVA_TEST_NISN", "10001")
TEST_SCHOOL_CODE = os.environ.get("MODIVA_TEST_SCHOOL_CODE", "20223819")

data = json.dumps({"nisn": TEST_NISN, "schoolCode": TEST_SCHOOL_CODE}).encode("utf-8")
req_login = urllib.request.Request("http://127.0.0.1:8000/api/auth/login-siswa", data=data, headers={"Content-Type": "application/json"})
token = json.loads(urllib.request.urlopen(req_login).read().decode())["token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Test Get Profile
req = urllib.request.Request("http://127.0.0.1:8000/api/users/profile", headers=headers)
profile = json.loads(urllib.request.urlopen(req).read().decode())["data"]
print("Get profile OK:", profile["name"])

# Test Update Profile
update_data = json.dumps({"phone": "08111222333"}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/users/profile", data=update_data, method="PUT", headers=headers)
updated_profile = json.loads(urllib.request.urlopen(req).read().decode())["data"]
print("Update profile OK, new phone:", updated_profile["phone"])

# Test Upload Avatar
boundary = uuid.uuid4().hex
body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="avatar"; filename="avatar.jpg"\r\n'
    f'Content-Type: image/jpeg\r\n\r\n'
    f'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xd9\r\n'
    f"--{boundary}--\r\n"
).encode("utf-8")
avatar_headers = {"Authorization": f"Bearer {token}", "Content-Type": f"multipart/form-data; boundary={boundary}"}
req = urllib.request.Request("http://127.0.0.1:8000/api/users/profile/avatar", data=body, method="POST", headers=avatar_headers)
avatar_res = json.loads(urllib.request.urlopen(req).read().decode())["data"]
print("Upload avatar OK, URL:", avatar_res["avatar"])

# Test Delete Avatar
req = urllib.request.Request("http://127.0.0.1:8000/api/users/profile/avatar", method="DELETE", headers=headers)
del_avatar_res = json.loads(urllib.request.urlopen(req).read().decode())["data"]
print("Delete avatar OK, URL:", del_avatar_res["avatar"])
