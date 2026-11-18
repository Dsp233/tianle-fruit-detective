"""Share the entry loader and the lazy progress store across all app pages."""

import re

from g1_reading_packets import ENTRIES, config, pack, replace_config, sha, unpack

APP_ENTRIES = (*ENTRIES, "qa/index.html", "qa/normal/index.html", "qa/history/index.html")
STORE_SOURCE = "canonical/w1/source/progress_store.js"
ANSWER_SOURCE = "canonical/w1/source/reading_answer.js"
LOADER_SOURCE = "github-upload/rc79-fix15/loader-r2.js"
DECODER = "github-upload/rc79-fix6/load2-tools/pako_inflate.min.js"
PACKET_CHECK = "reading-art/packet-integrity.js"
SHA256_FALLBACK = "reading-art/vendor/js-sha256.js"
FIX15_READING_ENGINE = "github-upload/rc79-fix15/overlay/source/reading_engine.js"
FIX14_READING_UI = "github-upload/rc79-fix14/overlay/source/reading_ui.js"
FIX15_MATH_APP = "github-upload/rc79-fix15/overlay/source/app.js"
MATH_BRIDGE = "github-upload/rc79-fix15/math-reading-bridge.js"
MATH_STORE = re.compile(rb"(?m)^const STORE='([^'\r\n]+)';$")
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


def replace_once(source, old, new):
    if source.count(old) != 1:
        raise ValueError(f"Missing or ambiguous runtime implementation: {old[:60]!r}")
    return source.replace(old, new)


def source_line(source, prefix):
    line, = (line for line in source.splitlines(keepends=True) if line.startswith(prefix))
    return line


def math_edits(app):
    launch = app[app.index(b" if(action==='workshop'){"):app.index(b" if(action==='stage'){")]
    banks = b",".join(b"'" + name + b"'" for name in re.findall(rb"if\(action==='([a-z]+)'\)", launch))
    duplicate_grades = app[app.index(b" else if(task.mode==='fractionLab'){"):app.index(b" else if(task.mode==='pairs'){")]
    duplicate_actions = app[app.index(b" if((view==='workshop'||view==='stage')"):app.index(b" if(action==='sortObject'){")]
    incomplete = source_line(app, b" const incomplete=!ok&&(")
    simple_modes = incomplete[incomplete.index(b"['choice','cycleOverlap']"):]
    return (
        (launch, b" if(Object.hasOwn(PRACTICE_BANKS,action)){\n"
                 b"  const code=btn.dataset.code;\n"
                 b"  if(PRACTICE_BANKS[action][code])open(action,code);\n  return;\n }\n"),
        (b"," + banks + b",'stage','transfer','jump'", b",'stage','transfer','jump'"),
        (b" if(!navigation.includes(action))return true;",
         b" if(!navigation.includes(action)&&!Object.hasOwn(PRACTICE_BANKS,action))return true;"),
        (source_line(app, b" if(taskAdapter(task)){const result="),
         b" const grade=taskAdapter(task)?.grade(task);\n if(grade){ok=grade.ok;reason=grade.reason}\n"),
        (duplicate_grades, b""),
        # Joint adapters can omit completeness even when the underlying lab
        # still needs an answer. Preserve that base check and the workshop fallback.
        (incomplete, b" const incomplete=!ok&&(grade?.incomplete||view==='workshop'&&workshopGrade(task).incomplete\n"
                     b"  ||task.joint&&task.mode.endsWith('Lab')&&TASK_ADAPTERS[task.mode]?.grade(task).incomplete\n"
                     b"  ||"+simple_modes),
        # Scale's change task also uses percent controls. The task adapter
        # already handles all of the other lab actions.
        (duplicate_actions,
         b" if((view==='percent'||view==='stage'||view==='scale')&&action.startsWith('percent')){\n"
         b"  const task=taskNow();\n"
         b"  if(task?.mode==='scaleLab'&&task.kind==='change'&&percentAct(action,btn.dataset,task)){feedback=null;render()}\n"
         b"  return;\n }\n"),
    )


def channel_edits(checkout, original):
    engine = (checkout / FIX15_READING_ENGINE).read_bytes()
    start_backup = engine.index(b"   const latestUpgrade=", engine.index(b"  function backup(){"))
    old_lookup = engine[start_backup:engine.index(b"   return JSON.stringify(", start_backup)]
    shared_lookup = (b"   const {upgradeOriginal,upgradeOriginalReadable}="
                     b"window.__AMC8_READING_HOST.readUpgradeOriginal(name=>storage.getItem(name),key,state.events);\n")
    ui = (checkout / FIX14_READING_UI).read_bytes()
    bridge = (checkout / MATH_BRIDGE).read_bytes()
    narrow_bridge = replace_once(bridge, b",saved:{configurable:true,get:()=>saved}", b"")
    narrow_bridge = replace_once(narrow_bridge, b"readingHost.render=render;",
                                 b"readingHost.mathSummary=readingHost.mathSummary.bind(null,()=>saved);\n"
                                 b"readingHost.render=render;")

    wrapped_backup = source_line(ui, b" function importText(")
    return {
        "math": (
            (original, b""),
            (bridge, narrow_bridge),
            (MATH_STORE, b"const STORE=window.__AMC8_STORE_KEY;"),
            *math_edits((checkout / FIX15_MATH_APP).read_bytes()),
        ),
        "reading": (
            (original, b""),
            (old_lookup, shared_lookup),
            (source_line(ui, b" function mathBridge("), b""),
            (b",entry,mathBridge,leave,", b",entry,mathBridge:window.ReadingUI.mathBridge,leave,"),
            (b"math={attempts:host.saved.attempts?.length||0,topics:host.saved.topicPractice?.selectedTopicIds?.length||0}",
             b"math=host.mathSummary()"),
            (wrapped_backup, b""),
            (b"importText(ui.importText)", b"e.importBackup(ui.importText)"),
            (b"const r=importText(text)", b"const r=engine.importBackup(text)"),
            # These definitions belong to the W1-extended engine in the checked packet.
            (re.compile(rb"(?m)^  function validAnswer\(q,value\)\{[^\n]+\n"),
             (checkout / ANSWER_SOURCE).read_bytes()),
            (re.compile(rb"(?m)^  function select\(value\)\{[^\n]+\n"),
             b"  function select(value){const c=current();if(!c||state.session.paused)return false;"
             b"const ok=validAnswer(c.question,value,false);\n"),
            (re.compile(rb"(?m)^   for\(const \[qid,value\]of Object\.entries\(s\.drafts\)\)\{[^\n]+\n"),
             b"   for(const [qid,value]of Object.entries(s.drafts)){const q=qs.get(qid)?.q;"
             b"if(!q||!validAnswer(q,value,false))return false;}\n"),
        ),
    }


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
    edits = channel_edits(checkout, original)

    def rewrite_script(row, channel):
        cache_key = (row["id"], channel)
        if cache_key not in rewritten:
            raw = unpack(row, lambda path: (root / path).read_bytes())
            applied = []
            math_namespace = None
            for index, (old, new) in enumerate(edits[channel]):
                if isinstance(old, bytes):
                    if old not in raw:
                        continue
                    raw = replace_once(raw, old, new)
                else:
                    if old is MATH_STORE:
                        match = old.search(raw)
                        if match:
                            math_namespace = match[1].decode()
                    raw, hits = old.subn(lambda _: new, raw)
                    if not hits:
                        continue
                    if hits != 1:
                        raise ValueError(f"Repeated runtime edit: {old.pattern!r}")
                applied.append(index)
            rewritten[cache_key] = (pack(raw, "g1-runtime", write, kind="js") if applied else row,
                                    applied, math_namespace)
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
            rows = [rewrite_script(row, channel) for row in entry[channel]["scripts"]]
            applied = sorted(index for _, indices, _ in rows for index in indices)
            if applied != list(range(len(edits[channel]))):
                raise ValueError(f"Missing or repeated runtime edit in {name} {channel}: {applied}")
            if channel == "math" and [key for _, _, key in rows if key is not None] != [entry["store"]]:
                raise ValueError(f"Unexpected mathematics storage namespace: {name}")
            entry[channel]["scripts"] = [shared, *(row for row, _, _ in rows)]
        inline = [match for match in re.finditer(r"<script>(.*?)</script>", html, re.S)
                  if CONFIG_READ in match[1]]
        if len(inline) != 1:
            raise ValueError(f"Missing or ambiguous runtime bootstrap: {name}")
        start, end = inline[0].span()
        html = html[:start] + f'<script src="{entry["base"]}{loader_path}"></script>' + html[end:]
        write(name, replace_config(html, entry).encode("utf-8"))
    return changes
