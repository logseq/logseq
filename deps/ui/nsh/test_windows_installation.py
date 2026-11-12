"""Admission source/model checks; actual Windows/Inno execution remains required."""
import importlib.util
import itertools
import json
from pathlib import Path
import unittest

SPEC=importlib.util.spec_from_file_location('windows_installer',Path(__file__).with_name('package_windows.py'))
package=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(package)
REPO=Path(__file__).resolve().parents[3]


class InstallationAdmissionTests(unittest.TestCase):
    def test_every_register_before_check_interleaving_excludes_live_installation(self):
        tested=0
        for order in itertools.permutations(['runtime-register','runtime-check','installer-register','installer-check']):
            if order.index('runtime-register')>order.index('runtime-check') or order.index('installer-register')>order.index('installer-check'):
                continue
            active=installing=False
            runtime_allowed=installer_allowed=False
            for event in order:
                if event=='runtime-register': active=True
                elif event=='installer-register': installing=True
                elif event=='runtime-check':
                    runtime_allowed=not installing
                    if not runtime_allowed: active=False
                else:
                    installer_allowed=not active
                    if not installer_allowed: installing=False
            self.assertFalse(runtime_allowed and installer_allowed,order)
            tested+=1
        self.assertEqual(tested,6)

    def test_host_worker_and_installer_share_exact_identity_and_order(self):
        rust=(REPO/'deps/ui/nsh/src/installation.rs').read_text()
        worker=(REPO/'deps/db-worker/runtime/native/node_process_stubs.c').read_text()
        for name in [package.ACTIVE,package.INSTALLER]:
            self.assertIn(json.dumps(name),rust)
            self.assertIn('L'+json.dumps(name),worker)
        self.assertIn(json.dumps(package.PROTOCOL),rust)
        self.assertIn(json.dumps(package.PROTOCOL),worker)
        self.assertLess(rust.index('let presence = CreateMutexW'),rust.index('let installing = OpenMutexW'))
        self.assertLess(worker.index('presence = CreateMutexW'),worker.index('installer = OpenMutexW'))
        self.assertIn('error != 2',rust)
        self.assertIn('error != ERROR_FILE_NOT_FOUND',worker)
        entry=(REPO/'deps/db-worker/bin/main.ml').read_text()
        self.assertLess(entry.index('installation_admission ()'),entry.index('Db_worker_node.main ();'))

    def test_installer_refuses_legacy_and_keeps_incomplete_files_closed(self):
        code=package.inno_script(Path('candidate'), '2.0.2','setup',{'logseq-nsh.exe':'a'*64})
        self.assertIn('CloseApplications=no',code)
        self.assertNotIn('CloseApplications=force',code)
        self.assertNotIn('RmShutdown',code)
        self.assertIn('AppMutex='+package.ACTIVE,code)
        self.assertIn('Result := AcquireAdmission;',code)
        self.assertIn('not ProtocolMarker',code)
        self.assertIn('NonemptyDirectory',code)
        self.assertLess(code.index('GetSHA256OfFile(FileName)'),code.index("if not DeleteFile(ExpandConst('{app}\\.nsh-installing'))"))
        self.assertIn('InitializeUninstall',code)
        self.assertIn('CloseHandle(Admission)',code)


if __name__=='__main__': unittest.main()
