"""Materialize only checksum-pinned QuickJS build inputs, never its OS helpers."""
import hashlib
import io
import json
import os
from pathlib import Path
import sys
import tarfile
import tempfile
import urllib.request


def main():
    spec = json.loads(Path(sys.argv[1]).read_text())
    output = Path(sys.argv[2])
    cache = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "logseq/quickjs"
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / spec["sha256"]
    if target.exists():
        data = target.read_bytes()
    else:
        with urllib.request.urlopen(spec["url"], timeout=60) as response:
            data = response.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024 or hashlib.sha256(data).hexdigest() != spec["sha256"]:
        raise ValueError("QuickJS dependency checksum/size mismatch")
    if not target.exists():
        with tempfile.NamedTemporaryFile(dir=cache, delete=False) as stream:
            stream.write(data)
            temporary = Path(stream.name)
        temporary.replace(target)
    names = ["quickjs.c", "quickjs.h", "quickjs-atom.h", "quickjs-opcode.h",
             "cutils.c", "cutils.h", "dtoa.c", "dtoa.h", "list.h", "libregexp.c",
             "libregexp.h", "libregexp-opcode.h", "libunicode.c", "libunicode.h",
             "libunicode-table.h"]
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:xz") as archive:
        for name in names:
            path = "quickjs-" + spec["version"] + "/" + name
            members = [member for member in archive.getmembers() if member.name == path]
            if len(members) != 1 or not members[0].isfile():
                raise ValueError("Invalid QuickJS archive member: " + path)
            (output / name).write_bytes(archive.extractfile(members[0]).read())


if __name__ == "__main__":
    main()
