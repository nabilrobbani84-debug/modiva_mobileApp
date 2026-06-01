from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import get_report_feed_from_couchbase, is_couchbase_configured, sync_user_reports_to_couchbase


def main() -> None:
    if not is_couchbase_configured():
        print("SKIP: Couchbase dinonaktifkan di backend.")
        return

    user_id = "99"
    sync_user_reports_to_couchbase(user_id)
    feed = get_report_feed_from_couchbase(user_id)

    if not feed:
        raise SystemExit("Report feed tidak ditemukan di Couchbase.")

    print("Report sync OK")
    print(f"User ID: {user_id}")
    print(f"Total: {feed['meta']['total']}")


if __name__ == "__main__":
    main()
