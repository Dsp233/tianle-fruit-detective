"""Reproduce G1 with a clean Git checkout and a hash-pinned private Git bundle."""

import argparse
import ctypes
import ctypes.util
import errno
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def git(*args, cwd=ROOT):
    return subprocess.check_output(["git", *args], cwd=cwd, text=True).strip()


def offline_filter(stream):
    """Install an inherited socket ban, including io_uring network operations."""
    lib = ctypes.CDLL(ctypes.util.find_library("seccomp") or "libseccomp.so.2")
    lib.seccomp_init.argtypes = [ctypes.c_uint32]
    lib.seccomp_init.restype = ctypes.c_void_p
    lib.seccomp_syscall_resolve_name.argtypes = [ctypes.c_char_p]
    lib.seccomp_rule_add.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_int, ctypes.c_uint]
    lib.seccomp_export_bpf.argtypes = [ctypes.c_void_p, ctypes.c_int]
    lib.seccomp_release.argtypes = [ctypes.c_void_p]
    context = lib.seccomp_init(0x7FFF0000)  # SCMP_ACT_ALLOW
    if not context:
        raise ValueError("Could not initialize the offline syscall filter")
    try:
        denied = 0x00050000 | errno.EPERM  # SCMP_ACT_ERRNO(EPERM)
        # Node child processes require unnamed local socketpairs for stdio.
        # A socketpair cannot address another host or bind a network socket.
        for syscall in (b"socket", b"socketcall", b"io_uring_setup"):
            number = lib.seccomp_syscall_resolve_name(syscall)
            if number >= 0 and lib.seccomp_rule_add(context, denied, number, 0) != 0:
                raise ValueError(f"Could not forbid {syscall.decode()}")
        if lib.seccomp_export_bpf(context, stream.fileno()) != 0:
            raise ValueError("Could not export the offline syscall filter")
        stream.seek(0)
    finally:
        lib.seccomp_release(context)


def provision(bundle, recipe, source):
    with bundle.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != recipe["bundleSha256"]:
            raise ValueError("Canonical source bundle SHA-256 mismatch")
    subprocess.run(["git", "-c", "core.autocrlf=false", "clone", "--quiet", "--single-branch",
                    "--branch", recipe["ref"], str(bundle), str(source)], check=True)
    if git("rev-parse", "HEAD", cwd=source) != recipe["commit"]:
        raise ValueError("Canonical source bundle resolved to an unexpected Git commit")


def verify_checkout():
    if (not (ROOT / ".git").is_dir() or (ROOT / ".git/objects/info/alternates").exists()
            or git("status", "--porcelain", "--untracked-files=all")):
        raise ValueError("Use a clean standalone checkout with an independent Git object database")
    archives = git("ls-files", "-z", "--", "*.zip", "*.zip.part-*", "*.tar.gz").split("\0")
    present = [name for name in archives if name and (ROOT / name).exists()]
    if present:
        raise ValueError(f"Exclude historical archive files from the checkout: {present[:3]}")


def native_build(source, output, stream):
    node = shutil.which("node")
    if node is None:
        raise ValueError("Node is required for the original compiler")
    python_root = Path(sys.base_prefix).resolve()
    node_root = Path(node).resolve().parent.parent
    command = [
        "bwrap", "--die-with-parent", "--unshare-pid", "--unshare-ipc",
        "--ro-bind", "/usr", "/usr", "--symlink", "usr/lib", "/lib",
        "--symlink", "usr/lib64", "/lib64", "--symlink", "usr/bin", "/bin",
        "--ro-bind", "/etc/ld.so.cache", "/etc/ld.so.cache",
        "--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp",
        "--ro-bind", str(python_root), "/toolchain/python",
        "--ro-bind", str(node_root), "/toolchain/node",
        "--ro-bind", str(ROOT), "/checkout", "--ro-bind", str(source), "/canonical",
        "--bind", str(output), "/output", "--chdir", "/checkout",
        "--clearenv", "--setenv", "PATH", "/toolchain/python/bin:/toolchain/node/bin:/usr/bin",
        "--setenv", "GIT_CONFIG_NOSYSTEM", "1", "--setenv", "GIT_CONFIG_GLOBAL", "/dev/null",
        "--setenv", "PYTHONNOUSERSITE", "1", "--setenv", "LC_ALL", "C.UTF-8",
        "--setenv", "TZ", "UTC", "--setenv", "TMPDIR", "/tmp",
        "--seccomp", str(stream.fileno()), "--",
        "/toolchain/python/bin/python3", "-I", "-B", "-c",
        """import errno, pathlib, runpy, socket, sys
try:
    socket.socket()
except PermissionError as exc:
    assert exc.errno == errno.EPERM
else:
    raise SystemExit('offline sandbox allowed a socket')
assert not pathlib.Path('/workspace').exists(), 'unexpected host workspace mount'
assert not pathlib.Path('/opt').exists(), 'unexpected host toolchain or cache mount'
assert not list(pathlib.Path('/tmp').iterdir()), 'unexpected build cache'
sys.path.insert(0, '/checkout/tools')
sys.argv = ['build_site.py', 'build', '--inputs', '/canonical', '--output', '/output/dist']
runpy.run_path('/checkout/tools/build_site.py', run_name='__main__')
""",
    ]
    with (output / "build-manifest.json").open("xb") as manifest:
        subprocess.run(command, stdout=manifest, pass_fds=(stream.fileno(),), check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--proof-dir", type=Path, required=True)
    args = parser.parse_args()
    try:
        verify_checkout()
        output = args.proof_dir.resolve()
        if output.is_relative_to(ROOT) or ROOT.is_relative_to(output):
            raise ValueError("Proof directory must be separate from the checkout")
        output.mkdir()
        recipe = json.loads((ROOT / "tools/g1-source-lock.json").read_bytes())["canonicalSource"]
        with tempfile.TemporaryDirectory(dir=output, prefix=".g1-supply-") as scratch:
            source = Path(scratch) / "tree"
            provision(args.bundle.resolve(strict=True), recipe, source)
            with tempfile.TemporaryFile() as stream:
                offline_filter(stream)
                native_build(source, output, stream)
        receipt = json.loads((output / "build-manifest.json").read_bytes())
        proof = {
            "checkout": git("rev-parse", "HEAD"),
            "canonicalSource": recipe["commit"],
            "files": len(receipt["files"]),
            "isolation": "read-only allowlisted mounts, empty scratch, sockets denied",
        }
        print(json.dumps(proof, ensure_ascii=False))
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as exc:
        print(f"Offline G1 build rejected: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
