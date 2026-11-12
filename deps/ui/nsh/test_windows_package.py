"""Real ZIP/receipt plumbing with synthetic PE headers and fake signing/Inno.

These tests do not compile, execute, Authenticode-verify or install native code.
"""
import importlib.util
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import zipfile

SPEC = importlib.util.spec_from_file_location('windows_package', Path(__file__).with_name('package_windows.py'))
packager = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(packager)
REAL_REPO = Path(__file__).resolve().parents[3]
LUI = Path(os.environ.get('LUI_SOURCE_ROOT', REAL_REPO.parent / 'lui')).resolve()


def pe():
    code = bytearray(256)
    code[:2] = b'MZ'
    struct.pack_into('<I', code, 60, 128)
    code[128:134] = b'PE\0\0\x64\x86'
    return code


class WindowsPackageTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.repo = self.root / 'repo'
        self.host = self.repo / 'deps/ui/_build/nsh-windows/logseq-nsh.exe'
        self.resources = self.host.parent / 'Resources'
        self.helper = self.repo / 'deps/ui/scripts/package-nsh.mjs'
        self.source = self.root / 'lui'
        self.output = self.root / 'packages'
        self.calls = []
        self.failure = None
        for name in ['package-nsh.mjs', 'package-nsh.sh', 'launch-nsh.sh']:
            self.copy(REAL_REPO / 'deps/ui/scripts' / name, self.helper.parent / name)
        self.copy(REAL_REPO / 'deps/ui/nsh/package_windows.py', self.repo / 'deps/ui/nsh/package_windows.py')
        for name in ['lui_build_receipt.mjs', 'nsh_delivery.py']:
            self.copy(LUI / 'tooling' / name, self.source / 'tooling' / name)
        semver = subprocess.check_output(['node', '-p', 'require.resolve("semver/package.json")'], cwd=REAL_REPO, text=True).strip()
        (self.repo / 'node_modules').mkdir()
        # Windows CI can require symlink privileges; copy only this already
        # installed small package for the disposable fake-toolchain fixture.
        shutil.copytree(Path(semver).parent, self.repo / 'node_modules/semver')
        for name, data in {
            'resources/package.json':json.dumps({'version':'2.0.2'}),
            'deps/ui/nsh/nsh.json':json.dumps({'name':'Logseq','id':'com.logseq.logseq','build':1}),
            'package.json':'{}', 'pnpm-lock.yaml':'locked fixture',
            'native-source/app.ml':'qualified source',
        }.items():
            self.write(self.repo / name, data)
        for file in [self.host, self.host.parent / 'native.dll', self.resources / 'logseq_ui.dll',
                     self.resources / 'logseq-db-worker.exe', self.resources / 'ocaml.dll']:
            self.write(file, pe())
        self.write(self.resources / 'dicts/en.edn', 'dictionary')
        self.write(self.resources / 'other-backend.txt', 'unowned')
        self.write(self.resources / 'windows-dependencies.json',json.dumps({'files':[
            {'destination':name,'sha256':hashlib.sha256(pe()).hexdigest()}
            for name in ['native.dll','Resources/ocaml.dll']]}))
        self.iscc = self.root / 'ISCC.exe'
        self.write(self.iscc, 'fake compiler')
        # Dynamic import uses the actual receipt module, not a schema mock.
        script = '''const {writeReceipt} = await import(process.argv[1]);
const fs = await import('node:fs');
const path = await import('node:path');
const [host,root,resources,source,code] = process.argv.slice(2);
const receipt = writeReceipt({artifact:host,root,inputs:[resources+'/logseq_ui.dll',resources+'/logseq-db-worker.exe',resources+'/ocaml.dll',resources+'/dicts/en.edn',resources+'/windows-dependencies.json',source,code].map(file=>path.relative(root,file).split(path.sep).join('/')),command:'fake qualified toolchain'});
const value=JSON.parse(fs.readFileSync(receipt));
value.ownedResources=['logseq_ui.dll','logseq-db-worker.exe','ocaml.dll','dicts/en.edn','windows-dependencies.json'];
value.ownedCode=['native.dll'];fs.writeFileSync(receipt,JSON.stringify(value));'''
        subprocess.run(['node','--input-type=module','-e',script,
            (self.source / 'tooling/lui_build_receipt.mjs').as_uri(),str(self.host),str(self.root),
            str(self.resources),str(self.repo / 'native-source'),str(self.host.parent / 'native.dll')],check=True)
        self.delivery = packager.delivery_module(self.source)
        self.delivery.find_iscc = lambda: None
        self.original_run = packager.run
        self.args = SimpleNamespace(built_host=self.host,lui_source=self.source,output=self.output,
            node='node',windows_thumbprint=None,timestamp_url=None,signtool='signtool',
            iscc=None,update_url=None,update_public_key=None)

    def tearDown(self):
        self.temporary.cleanup()

    @staticmethod
    def write(file, data):
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data.encode() if isinstance(data,str) else data)

    @staticmethod
    def copy(source, target):
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    def native_tool(self, command, **_):
        self.calls.append(list(map(str,command)))
        file = Path(command[-1])
        if command[1] == 'sign':
            file.write_bytes(file.read_bytes()+b'FAKE_SIGNATURE')
        if command[1] == 'verify' and (self.failure == 'signature' or
                (self.failure == 'installer-signature' and file.name.endswith('-setup.exe'))):
            raise subprocess.CalledProcessError(1,command)
        return ''

    def execute(self, command, **kwargs):
        if str(command[0]) == str(self.iscc):
            self.calls.append(list(map(str,command)))
            stage = Path(str(command[2])[2:])
            script = Path(command[-1]).read_text()
            self.assertIn('PrivilegesRequired=lowest',script)
            self.assertNotIn('UninstallDelete',script)
            name = next(line.split('=',1)[1] for line in script.splitlines() if line.startswith('OutputBaseFilename='))
            self.write(stage / (name+'.exe'),b'fake installer includes signed candidate')
            return None
        if 'finish' in command and self.failure == 'source':
            self.write(self.repo / 'native-source/app.ml','source changed after signing')
        return self.original_run(command, **kwargs)

    def package(self):
        with patch.object(packager,'REPO',self.repo),patch.object(packager,'HELPER',self.helper), \
             patch.object(packager.platform,'system',return_value='Windows'), \
             patch.object(packager.platform,'machine',return_value='AMD64'), \
             patch.object(packager,'delivery_module',return_value=self.delivery), \
             patch.object(packager,'run',side_effect=self.execute), \
             patch.object(self.delivery,'run',side_effect=self.native_tool):
            return packager.package(self.args)

    def test_real_zip_contains_complete_root_and_unsigned_receipt(self):
        archive=self.package()
        with zipfile.ZipFile(archive) as file:
            names=set(file.namelist())
            for name in ['logseq-nsh.exe','native.dll','Resources/logseq_ui.dll','Resources/logseq-db-worker.exe','Resources/ocaml.dll','Resources/dicts/en.edn','nsh/app.json']:
                self.assertIn('Logseq-NSH/'+name,names)
            self.assertNotIn('Logseq-NSH/Resources/other-backend.txt',names)
        receipt=json.loads(Path(str(archive)+'.lui-build.json').read_text())
        self.assertEqual(receipt['signing'],'unsigned')
        self.assertEqual(len(receipt['installedCodeSha256']),5)
        self.assertNotIn('installer',receipt)
        self.assertEqual(self.calls,[])

    def test_all_code_signed_before_installer_then_zip_and_receipt(self):
        self.args.windows_thumbprint='FAKE_TEST_CERTIFICATE_NOT_A_CREDENTIAL'
        self.args.timestamp_url='https://timestamp.example.invalid'
        self.args.iscc=self.iscc
        archive=self.package()
        receipt=json.loads(Path(str(archive)+'.lui-build.json').read_text())
        self.assertEqual(receipt['signing'],'authenticode')
        self.assertTrue((archive.parent / receipt['installer']['name']).is_file())
        compiler=next(i for i,c in enumerate(self.calls) if c[0]==str(self.iscc))
        self.assertEqual(len([c for c in self.calls[:compiler] if c[1]=='verify']),5)
        self.assertEqual(self.calls[-1][1],'verify')
        with zipfile.ZipFile(archive) as file:
            self.assertTrue(file.read('Logseq-NSH/Resources/logseq_ui.dll').endswith(b'FAKE_SIGNATURE'))
            self.assertTrue(file.read('Logseq-NSH/logseq-nsh.exe').endswith(b'FAKE_SIGNATURE'))

    def test_empty_requested_credentials_cannot_become_an_unsigned_release(self):
        self.args.windows_thumbprint=''
        with self.assertRaisesRegex(ValueError,'must not be empty'):
            self.package()
        self.assertFalse(self.output.exists())

    def test_existing_release_is_never_overwritten(self):
        archive=self.package()
        before={file.name:file.read_bytes() for file in self.output.iterdir() if file.is_file()}
        with self.assertRaisesRegex(ValueError,"existing Windows release"):
            self.package()
        self.assertEqual(before,{file.name:file.read_bytes() for file in self.output.iterdir() if file.is_file()})

    def test_archive_cannot_omit_or_replace_final_native_code(self):
        original=self.delivery.archive_package
        def corrupted(*args):
            paths=original(*args)
            with zipfile.ZipFile(paths[0]) as archive:
                entries={name:archive.read(name) for name in archive.namelist()}
            entries['Logseq-NSH/logseq-nsh.exe']=b'wrong archive code'
            with zipfile.ZipFile(paths[0],'w') as archive:
                for name,data in entries.items():
                    archive.writestr(name,data)
            return paths
        with patch.object(self.delivery,'archive_package',side_effect=corrupted), \
             self.assertRaisesRegex(ValueError,'final signed code'):
            self.package()
        self.assertEqual(list(self.output.iterdir()),[])

    def test_failed_signatures_or_changed_source_never_publish(self):
        for failure in ['signature','installer-signature','source']:
            with self.subTest(failure=failure):
                self.failure=failure
                self.args.iscc=self.iscc if failure=='installer-signature' else None
                self.args.windows_thumbprint='FAKE_TEST_CERTIFICATE_NOT_A_CREDENTIAL'
                self.args.timestamp_url='https://timestamp.example.invalid'
                with self.assertRaises(subprocess.CalledProcessError):
                    self.package()
                self.assertEqual(list(self.output.iterdir()),[])


if __name__=='__main__':
    unittest.main()
