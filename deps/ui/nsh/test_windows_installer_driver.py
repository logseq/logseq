"""Driver refusal/error plumbing; no native API or installer is run here."""
import importlib.util
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

SPEC=importlib.util.spec_from_file_location('windows_installer_driver',Path(__file__).with_name('qualify_windows_installer.py'))
driver=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(driver)


class InstallerDriverTests(unittest.TestCase):
    def test_non_windows_cannot_be_reported_as_native_qualification(self):
        with tempfile.TemporaryDirectory() as temporary, \
             patch.object(driver.platform,'system',return_value='Linux'), \
             patch.object(driver.subprocess,'run') as run:
            evidence=Path(temporary)/'evidence'
            with self.assertRaisesRegex(ValueError,'Actual Windows'):
                driver.qualify(Path('missing.zip'),Path('missing.exe'),evidence)
            run.assert_not_called()
            self.assertFalse(evidence.exists())

    def test_mutex_absence_is_distinguished_from_permission_failure(self):
        kernel=SimpleNamespace(OpenMutexW=Mock(return_value=None),CloseHandle=Mock())
        with patch.object(driver.ctypes,'get_last_error',return_value=2,create=True):
            self.assertFalse(driver.exists(kernel,'name'))
        with patch.object(driver.ctypes,'get_last_error',return_value=5,create=True), \
             patch.object(driver.ctypes,'WinError',return_value=PermissionError('access denied'),create=True):
            with self.assertRaises(PermissionError): driver.exists(kernel,'name')
        kernel.CloseHandle.assert_not_called()

    def test_existing_installer_is_not_taken_over_or_closed(self):
        kernel=SimpleNamespace(CreateMutexW=Mock(return_value=17),CloseHandle=Mock())
        with patch.object(driver.ctypes,'set_last_error',create=True), \
             patch.object(driver.ctypes,'get_last_error',return_value=183,create=True):
            with self.assertRaisesRegex(RuntimeError,'already active'):
                with driver.installer_presence(kernel): self.fail('must not enter')
        # This closes only the reference opened by the driver, not the existing
        # installer's independently owned kernel handle or process.
        kernel.CloseHandle.assert_called_once_with(17)


if __name__=='__main__': unittest.main()
