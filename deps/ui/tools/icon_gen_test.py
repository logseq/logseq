"""Compile generated icon constants and compare their runtime contents."""

import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

GENERATOR, COMPILER, JSON_SOURCE, NATIVE_COMPILER, ICON_SOURCE, ICON_FIXTURE = [
    str(pathlib.Path(p).resolve()) for p in sys.argv[1:]
]
sys.argv = sys.argv[:1]


class IconGeneratorTest(unittest.TestCase):
    def generate(self, source):
        work = tempfile.TemporaryDirectory()
        self.addCleanup(work.cleanup)
        root = pathlib.Path(work.name)
        (root / "icons.json").write_text(source)
        result = subprocess.run(
            [GENERATOR, str(root / "icons.json"), str(root / "icon_data_gen.ml")],
            capture_output=True, text=True,
        )
        return root, result

    def test_generated_constants_preserve_values_and_last_duplicate(self):
        source = r'''{
            "nested": [["path", {"d": "M0 0\\] }", "nested": "{x: [1, true, null]}"}]],
            "a\"b": [["circle", {"r": "2", "label": "你好\n\t\u0000"}]],
            "empty": [], "z": [], "z": [["path", {"d": "M1 2"}]]
        }'''
        root, result = self.generate(source)
        self.assertEqual(result.returncode, 0, result.stderr)
        (root / "json.ml").write_bytes(pathlib.Path(JSON_SOURCE).read_bytes())
        (root / "icon_tabler_data.ml").write_bytes(pathlib.Path(ICON_SOURCE).read_bytes())
        (root / "check.ml").write_text(
            "let children xs = Json.Array (Array.of_list (List.map "
            "(fun (tag,attrs) -> Json.Array [|Json.String tag; "
            "Json.Object (List.map (fun (k,v) -> k,Json.String v) attrs)|]) xs))\n"
            "let () = print_endline (Json.stringify (Json.Object "
            "(Array.to_list (Array.map (fun (k,v) -> k,children v) Icon_data_gen.table))))\n"
        )
        compiled = subprocess.run(
            [COMPILER, "-o", "check", "json.ml", "icon_tabler_data.ml", "icon_data_gen.ml", "check.ml"],
            cwd=root, capture_output=True, text=True,
        )
        self.assertEqual(compiled.returncode, 0, compiled.stderr)
        contents = subprocess.check_output([str(root / "check")], text=True)
        expected = json.loads(source)
        self.assertEqual(json.loads(contents), expected)
        self.assertEqual(list(json.loads(contents)), sorted(expected))

    def test_empty_table(self):
        _, result = self.generate("{}")
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_full_table_has_no_eager_runtime_construction(self):
        root, result = self.generate(pathlib.Path(ICON_FIXTURE).read_text())
        self.assertEqual(result.returncode, 0, result.stderr)
        (root / "json.ml").write_bytes(pathlib.Path(JSON_SOURCE).read_bytes())
        (root / "icon_tabler_data.ml").write_bytes(pathlib.Path(ICON_SOURCE).read_bytes())
        (root / "check.ml").write_text(
            'let () = Printf.printf "%.0f\\n" (Gc.allocated_bytes ()); '
            'assert (Array.length Icon_data_gen.table > 6000)\n'
        )
        compiled = subprocess.run(
            [NATIVE_COMPILER, "-o", "check", "json.ml", "icon_tabler_data.ml",
             "icon_data_gen.ml", "check.ml"],
            cwd=root, capture_output=True, text=True,
        )
        self.assertEqual(compiled.returncode, 0, compiled.stderr)
        allocated = float(subprocess.check_output([str(root / "check")], text=True))
        print(f"native compiled icon module initialization allocated {allocated:.0f} bytes", flush=True)
        self.assertLess(allocated, 512_000, "Compiled icons are constructed eagerly at startup")

    def test_invalid_assets_fail_at_build_time(self):
        for source in ["[]", '{"bad":42}', '{"bad":[}',
                       '{"bad":["unterminated]}', '{} trailing', '{"bad":[],}',
                       '{"bad":[[42,{}]]}', '{"bad":[["path",[]]]}',
                       '{"bad":[["path",{"d":42}]]}']:
            with self.subTest(source=source):
                _, result = self.generate(source)
                self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
