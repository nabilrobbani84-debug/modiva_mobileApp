from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import get_profile_snapshot_from_couchbase, is_couchbase_configured, sync_user_profile_to_couchbase


def main() -> None:
    if not is_couchbase_configured():
        print("SKIP: Couchbase dinonaktifkan di backend.")
        return

    user_id = "99"
    sync_user_profile_to_couchbase(user_id)
    profile = get_profile_snapshot_from_couchbase(user_id)

    if not profile:
        raise SystemExit("Profile snapshot tidak ditemukan di Couchbase.")

    print("Profile sync OK")
    print(f"User ID: {user_id}")
    print(f"Name: {profile['name']}")
    print(f"School: {profile['school']}")


if __name__ == "__main__":
    main()
