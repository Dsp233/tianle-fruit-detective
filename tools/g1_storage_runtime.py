"""Build the single lazy progress store shared by math and reading."""

from g1_reading_packets import ENTRIES, config, pack, replace_config, sha, unpack

APP_ENTRIES = (*ENTRIES, "qa/index.html", "qa/normal/index.html", "qa/history/index.html")
STORE_SOURCE = "canonical/w1/source/progress_store.js"


def install(root, original, current, expected_entries):
    changes = {}
    rewritten = {}

    def write(path, body):
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(body)
        changes[path] = sha(body)

    shared = pack(current, "g1-runtime", write, kind="js")

    def without_store(row):
        if row["id"] not in rewritten:
            raw = unpack(row, lambda path: (root / path).read_bytes())
            count = raw.count(original)
            if count > 1:
                raise ValueError("Multiple progress stores in one script")
            stripped = pack(raw.replace(original, b""), "g1-runtime", write, kind="js") if count else row
            rewritten[row["id"]] = stripped
        return rewritten[row["id"]]

    for name in APP_ENTRIES:
        body = (root / name).read_bytes()
        if sha(body) != expected_entries[name][1]:
            raise ValueError(f"Unexpected storage baseline: {name}")
        html = body.decode()
        entry = config(html)
        for channel in ("math", "reading"):
            rows = entry[channel]["scripts"]
            stripped = [without_store(row) for row in rows]
            if sum(old["id"] != new["id"] for old, new in zip(rows, stripped, strict=True)) != 1:
                raise ValueError(f"Missing or ambiguous progress store in {name} {channel}")
            entry[channel]["scripts"] = [shared, *stripped]
        if name in ENTRIES:
            # Math can load the shared packet first. Check its digest on either route.
            marker = "readingRows.some(row => row === packet)"
            if html.count(marker) != 1:
                raise ValueError(f"Missing packet digest check in {name}")
            html = html.replace(marker, "readingRows.some(row => row.id === packet.id)")
        write(name, replace_config(html, entry).encode("utf-8"))
    return changes
