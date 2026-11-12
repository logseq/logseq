"""Fake compiler/PE plumbing; none of these checks qualify native Windows."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_windows as builder
sys.path.pop(0)


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.repo = self.root / "repo"
        self.ui = self.repo / "deps/ui"
        self.host = self.ui / "nsh"
        self.output = self.ui / "_build/nsh-windows"
        self.lui = self.root / "lui"
        self.system = self.root / "Windows"
        self.trusted = self.root / "toolchain"
        self.failure = None
        self.schemas_exported = False
        self.copies = []
        self.commands = []
        for name, text in {
            "repo/deps/ui/assets/catalog.json":"catalog",
            "repo/deps/ui/assets/fonts/app.ttf":"font",
            "repo/resources/dicts/en.edn":"dict",
            "repo/resources/img/logo.svg":"icon",
            "repo/deps/db-worker/_build/default/bin/main.exe":"worker",
            "lui/tooling/nsh_delivery.py":"def architectures(*args): return {'x86_64'}\n",
            "lui/platform/nsh/Cargo.toml":"manifest",
            "compiled/app.exe":"host",
            "compiled/startup_preflight.exe":"gate",
            "Windows/System32/KERNEL32.dll":"system",
            "toolchain/native.dll":"native runtime",
        }.items():
            self.write(self.root / name, text)
        self.write(self.lui / "platform/nsh/src/runtime.rs",
                   'let exports = Exports {\n focus: optional!("lui_ocaml_focus_within_changed"),\n};\n')
        self.write(self.ui / "native/logseq_lui_bridge.c",
                   (builder.ocaml.UI / "native/logseq_lui_bridge.c").read_text(encoding="utf-8"))
        self.old = {
            "logseq-nsh.exe":"previous host",
            "Resources/logseq_ui.dll":"previous OCaml",
            "Resources/logseq-db-worker.exe":"previous worker",
            "Resources/obsolete.json":"owned previous resource",
            "Resources/unrelated.json":"unrelated",
            "old.dll":"old code",
            "logseq-nsh.exe.lui-build.json":json.dumps({
                "ownedResources":["logseq_ui.dll", "logseq-db-worker.exe", "obsolete.json"],
                "ownedCode":["old.dll"]}),
        }
        for name, text in self.old.items():
            self.write(self.output / name, text)
        self.original_copy = builder.atomic_copy

    def tearDown(self):
        self.temporary.cleanup()

    @staticmethod
    def write(file, text):
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(text, encoding="utf-8")

    def ocaml(self, output, **_):
        self.schemas_exported = True
        self.write(output / "schemas.json", "actual compiled schema")
        self.write(output / "logseq_ui.dll", "actual seven-argument DLL fixture")
        return output / "logseq_ui.dll"

    def execute(self, command, *, environment=None, cwd=None, capture=False, timeout=None):
        command = list(map(str, command))
        self.commands.append(command)
        if command[:2] == ["cargo", "metadata"]:
            return json.dumps({"packages":[{"name":"lui-nsh", "source":None,
                "manifest_path":str(self.lui / "platform/nsh/Cargo.toml")}]})
        if command[:2] == ["cargo", "build"]:
            self.assertTrue(self.schemas_exported, "Rust compiled before real schema export")
            return "\n".join(map(json.dumps, [
                {"reason":"compiler-artifact", "target":{"name":"lui_nsh"},
                 "manifest_path":str(self.lui / "platform/nsh/Cargo.toml")},
                {"reason":"compiler-artifact", "target":{"name":"nsh-app-logseq"},
                 "executable":str(self.root / "compiled/app.exe")},
            ]))
        if command[:2] == ["cargo", "test"]:
            return json.dumps({"reason":"compiler-artifact", "target":{"name":"startup_preflight"},
                               "executable":str(self.root / "compiled/startup_preflight.exe")})
        if len(command) > 2 and command[2] == "snapshot":
            self.write(Path(command[7]), "snapshot")
            self.assertIn("--dll-root", command[8])
        elif len(command) > 2 and command[2] == "check":
            if self.failure == "source-after-gate" and any(c[0].endswith("startup_preflight.exe") for c in self.commands):
                raise ValueError("Native sources changed during build")
        elif len(command) > 2 and command[2] == "receipt":
            executable = Path(command[5])
            resources = Path(command[9])
            extra = json.loads(Path(command[11]).read_text())
            self.write(Path(str(executable) + ".lui-build.json"), json.dumps({
                "ownedResources":[p.relative_to(resources).as_posix() for p in resources.rglob('*') if p.is_file()],
                "ownedCode":[Path(item['target']).name for item in extra],
            }))
        elif command[0].endswith("startup_preflight.exe"):
            self.assertEqual(timeout, 240)
            self.assertNotIn("toolchain", environment["PATH"])
            self.assertNotIn("OCAMLPATH", environment)
            resources = Path(environment["LOGSEQ_NATIVE_ASSET_DIR"])
            self.assertEqual(Path(environment["LUI_OCAML_LIBRARY"]).read_text(), "actual seven-argument DLL fixture")
            self.assertEqual(Path(environment["LOGSEQ_DB_WORKER_BIN"]).read_text(), "worker")
            for file in [resources / "native.dll", resources / "catalog.json", resources / "dicts/en.edn",
                         resources / "fonts/app.ttf", resources / "img/logo.svg",
                         resources.parent / "native.dll", Path(command[0]).parent / "native.dll"]:
                self.assertTrue(file.exists(), str(file))
            if self.failure == "gate":
                raise subprocess.CalledProcessError(7, command)
            if self.failure == "dependency-after-gate":
                self.write(self.trusted / "native.dll", "changed during qualification")
        return None

    def run_build(self):
        def copied(source, target):
            self.copies.append(target)
            self.original_copy(source, target)
        with patch.multiple(builder, REPO=self.repo, UI=self.ui, HOST=self.host), \
             patch.dict(os.environ, {"SystemRoot":str(self.system)}), \
             patch.object(builder.ocaml, 'native_config', return_value={"version":"5.5.1"}), \
             patch.object(builder.ocaml, 'build', side_effect=self.ocaml), \
             patch.object(builder, 'execute', side_effect=self.execute), \
             patch.object(builder, 'atomic_copy', side_effect=copied), \
             patch.object(builder.dependencies, 'inspector', return_value=lambda file: [] if file.name == 'native.dll' else ['native.dll', 'KERNEL32.dll']):
            return builder.build(output=self.output, lui_source=self.lui, dll_roots=[self.trusted], dumpbin=Path("dumpbin.exe"))

    def test_complete_candidate_clean_loader_environment_and_receipt_last(self):
        result = self.run_build()
        self.assertEqual(result.read_text(), "host")
        self.assertEqual((self.output / "Resources/logseq-db-worker.exe").read_text(), "worker")
        self.assertEqual((self.output / "native.dll").read_text(), "native runtime")
        self.assertEqual((self.output / "Resources/unrelated.json").read_text(), "unrelated")
        self.assertFalse((self.output / "Resources/obsolete.json").exists())
        self.assertFalse((self.output / "old.dll").exists())
        self.assertEqual(self.copies[-1].name, "logseq-nsh.exe.lui-build.json")
        self.assertFalse((self.output / "startup_preflight.exe").exists())

    def test_red_gate_or_changed_sources_never_publish(self):
        for failure in ["gate", "source-after-gate", "dependency-after-gate"]:
            with self.subTest(failure=failure):
                self.failure = failure
                self.commands = []
                self.write(self.trusted / "native.dll", "native runtime")
                with self.assertRaises((ValueError, subprocess.CalledProcessError)):
                    self.run_build()
                self.assertEqual(self.copies, [])
                for name, text in self.old.items():
                    self.assertEqual((self.output / name).read_text(), text)

    def test_wrong_platform_fails_before_tools_or_publication(self):
        with patch.object(builder.ocaml, 'native_config', side_effect=ValueError('native Windows required')), \
             patch.object(builder, 'execute') as execute:
            with self.assertRaisesRegex(ValueError, 'native Windows'):
                builder.build(output=self.output, lui_source=self.lui, dll_roots=[], dumpbin=Path('dumpbin'))
            execute.assert_not_called()


if __name__ == '__main__':
    unittest.main()
