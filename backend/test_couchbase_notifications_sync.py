from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import get_notification_feed_from_couchbase, is_couchbase_configured, sync_user_notifications_to_couchbase


def main() -> None:
    if not is_couchbase_configured():
        print("SKIP: Couchbase dinonaktifkan di backend.")
        return

    user_id = "99"
    sync_user_notifications_to_couchbase(user_id)
    feed = get_notification_feed_from_couchbase(user_id)

    if not feed:
        raise SystemExit("Notification feed tidak ditemukan di Couchbase.")

    print("Notification sync OK")
    print(f"User ID: {user_id}")
    print(f"Total: {feed['meta']['total']}")
    print(f"Unread: {feed['meta']['unread']}")


if __name__ == "__main__":
    main()
