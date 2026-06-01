from __future__ import annotations

import os
from datetime import timedelta

from dotenv import load_dotenv


def main() -> None:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(base_dir, ".env"))

    connection_string = os.environ.get("COUCHBASE_CONNECTION_STRING", "").strip()
    username = os.environ.get("COUCHBASE_USERNAME", "").strip()
    password = os.environ.get("COUCHBASE_PASSWORD", "").strip()
    bucket_name = os.environ.get("COUCHBASE_BUCKET", "").strip()

    if not all([connection_string, username, password, bucket_name]):
        print("SKIP: Couchbase tidak dikonfigurasi.")
        return

    try:
        from couchbase.auth import PasswordAuthenticator
        from couchbase.cluster import Cluster
        from couchbase.options import ClusterOptions
    except Exception as error:  # pragma: no cover
        print(f"SKIP: SDK Couchbase belum tersedia: {error}")
        return

    options = ClusterOptions(PasswordAuthenticator(username, password))
    options.apply_profile("wan_development")
    cluster = Cluster.connect(connection_string, options)
    cluster.wait_until_ready(timedelta(seconds=20))
    bucket = cluster.bucket(bucket_name)
    bucket.ping()

    print("Couchbase connected")
    print(f"Bucket: {bucket_name}")

    cluster.close()


if __name__ == "__main__":
    main()
