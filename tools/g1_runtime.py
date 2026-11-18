"""Share the entry loader and the lazy progress store across all app pages."""

import re

from g1_reading_packets import ENTRIES, config, pack, replace_config, sha, unpack

APP_ENTRIES = (*ENTRIES, "qa/index.html", "qa/normal/index.html", "qa/history/index.html")
STORE_SOURCE = "canonical/w1/source/progress_store.js"
LOADER_SOURCE = "github-upload/rc79-fix15/loader-r2.js"
DECODER = "github-upload/rc79-fix6/load2-tools/pako_inflate.min.js"
PACKET_CHECK = "reading-art/packet-integrity.js"
SHA256_FALLBACK = "reading-art/vendor/js-sha256.js"
FIX15_READING_ENGINE = "github-upload/rc79-fix15/overlay/source/reading_engine.js"
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
    engine = (checkout / FIX15_READING_ENGINE).read_bytes()
    start_backup = engine.index(b"   const latestUpgrade=", engine.index(b"  function backup(){"))
    old_lookup = engine[start_backup:engine.index(b"   return JSON.stringify(", start_backup)]
    shared_lookup = (b"   const {upgradeOriginal,upgradeOriginalReadable}="
                     b"window.__AMC8_READING_HOST.readUpgradeOriginal(name=>storage.getItem(name),key,state.events);\n")

    def rewrite_script(row, channel):
        cache_key = (row["id"], channel)
        if cache_key not in rewritten:
            raw = unpack(row, lambda path: (root / path).read_bytes())
            count = raw.count(original)
            if count > 1:
                raise ValueError("Multiple progress stores in one script")
            if count:
                raw = raw.replace(original, b"")
                if channel == "reading":
                    if raw.count(old_lookup) != 1:
                        raise ValueError("Unexpected reading backup implementation")
                    raw = raw.replace(old_lookup, shared_lookup)
            rewritten[cache_key] = pack(raw, "g1-runtime", write, kind="js") if count else row
        return rewritten[cache_key]

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
            stripped = [rewrite_script(row, channel) for row in rows]
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
