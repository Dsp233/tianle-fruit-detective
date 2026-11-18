"""Share the entry loader and the lazy progress store across all app pages."""

import re

from g1_reading_packets import ENTRIES, config, pack, replace_config, sha, unpack

APP_ENTRIES = (*ENTRIES, "qa/index.html", "qa/normal/index.html", "qa/history/index.html")
STORE_SOURCE = "canonical/w1/source/progress_store.js"
LOADER_SOURCE = "github-upload/rc79-fix15/loader-r2.js"
DECODER = "github-upload/rc79-fix6/load2-tools/pako_inflate.min.js"
PACKET_CHECK = "reading-art/packet-integrity.js"
SHA256_FALLBACK = "reading-art/vendor/js-sha256.js"
CONFIG_READ = "const config = JSON.parse(document.getElementById('learning-delivery').textContent);"


def bootstrap(checkout):
    loader, decoder, packet_reader, sha256 = (
        (checkout / name).read_text(encoding="utf-8")
        for name in (LOADER_SOURCE, DECODER, PACKET_CHECK, SHA256_FALLBACK)
    )
    if (loader.count("/*__PACKET_READER__*/") != 1
            or packet_reader.count("/*__CR4_SHA256_VENDOR__*/") != 1
            or packet_reader.count("row === packet") != 1):
        raise ValueError("Unexpected packet reader template")
    packet_reader = packet_reader.replace("row === packet", "row.id === packet.id")
    packet_reader = packet_reader.replace("/*__CR4_SHA256_VENDOR__*/", sha256)
    return (decoder + "\n" + loader.replace("/*__PACKET_READER__*/", packet_reader.strip())).encode()


def install(root, checkout, original, current, expected_entries):
    changes = {}
    rewritten = {}

    def write(path, body):
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(body)
        changes[path] = sha(body)

    script = bootstrap(checkout)
    loader_path = f"assets/g1-runtime/{sha(script)}.js"
    write(loader_path, script)
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
        if entry.get("legacy"):
            raise ValueError(f"Unexpected legacy entry: {name}")
        for channel in ("math", "reading"):
            rows = entry[channel]["scripts"]
            stripped = [without_store(row) for row in rows]
            if sum(old["id"] != new["id"] for old, new in zip(rows, stripped, strict=True)) != 1:
                raise ValueError(f"Missing or ambiguous progress store in {name} {channel}")
            entry[channel]["scripts"] = [shared, *stripped]
        inline = [match for match in re.finditer(r"<script>(.*?)</script>", html, re.S)
                  if CONFIG_READ in match[1]]
        if len(inline) != 1:
            raise ValueError(f"Missing or ambiguous runtime bootstrap: {name}")
        start, end = inline[0].span()
        html = html[:start] + f'<script src="{entry["base"]}{loader_path}"></script>' + html[end:]
        write(name, replace_config(html, entry).encode("utf-8"))
    return changes
