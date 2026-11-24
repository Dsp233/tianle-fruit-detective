"""Use already verified controlled archives in the existing native offline sandbox.
This is a provisioning alternative, not a bypass of any file or runtime lock.
The original bundle and Python executable identity remain documented in the source receipt.
"""
import hashlib, json, os, sys, tempfile, shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import g1_offline_build as native
import build_site
def main():
    source, output, receipts=map(Path,sys.argv[1:])
    native.verify_checkout()
    lock=json.loads(build_site.SOURCE_LOCK.read_bytes())
    toolchain=build_site.check_toolchain(lock)
    assert source.is_dir() and not source.is_symlink()
    # Existing build_site performs the exact compiler, content, wheel and output lock checks.
    output.mkdir()
    with tempfile.TemporaryFile() as stream:
        native.offline_filter(stream)
        native.native_build(source,output,stream)
    m=json.loads((output/"build-manifest.json").read_bytes())
    actual={p.relative_to(output/"dist").as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((output/"dist").rglob("*")) if p.is_file()}
    assert all(actual.get(k)==v for k,v in m["files"].items())
    m["completeOutputFiles"]=actual
    m["provisioning"]="hash-verified W1/HOME1 recovered source files; original bundle not recovered"
    m["supersededPythonSha256"]="fa67443527ed9647f760d807e2a38f26340757123e643c4639cf273ed15d5ea7"
    m["isolation"]="original bwrap readonly mounts and seccomp socket ban"
    (receipts/"build-manifest.json").write_text(json.dumps(m,sort_keys=True,indent=2)+"\n")
    os.chmod(receipts/"build-manifest.json",0o644)
    print("NATIVE_G1_REBUILD_PASS",len(actual),toolchain)
if __name__=="__main__":main()
