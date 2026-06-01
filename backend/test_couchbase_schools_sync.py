from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import get_school_document_from_couchbase, get_schools_from_couchbase, is_couchbase_configured, sync_all_schools_to_couchbase


def main() -> None:
    if not is_couchbase_configured():
        print("SKIP: Couchbase dinonaktifkan di backend.")
        return

    sync_all_schools_to_couchbase()
    schools = get_schools_from_couchbase()
    if not schools:
        raise SystemExit("School documents tidak ditemukan di Couchbase.")

    first_school = schools[0]
    school_doc = get_school_document_from_couchbase(str(first_school["id"]))
    if not school_doc:
        raise SystemExit("School detail document tidak ditemukan di Couchbase.")

    print("School sync OK")
    print(f"Total: {len(schools)}")
    print(f"First school: {school_doc['nama']}")


if __name__ == "__main__":
    main()
