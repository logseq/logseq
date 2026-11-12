#!/usr/bin/env python3
"""Exercise real Windows worker admission and actual Inno install/refusal/repair.

Only fresh fixture subprocesses and temporary installation roots are controlled.
No OS window, shared graph daemon, production certificate or N-to-N+1 graph save
is qualified by this driver. It must run on an isolated native Windows runner.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import ctypes
from ctypes import wintypes
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import tempfile
import zipfile

from package_windows import ACTIVE, INSTALLER, PROTOCOL, delivery_module
import windows_dependencies as dependencies
from build_windows import clean_environment
from qualify_packaged_startup import native_environment

REPO = Path(__file__).resolve().parents[3]


def digest(file):
    with file.open('rb') as content:
        return hashlib.file_digest(content,'sha256').hexdigest()


def kernel_api():
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.CreateMutexW.argtypes=[ctypes.c_void_p,wintypes.BOOL,wintypes.LPCWSTR]
    kernel.CreateMutexW.restype=wintypes.HANDLE
    kernel.OpenMutexW.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.LPCWSTR]
    kernel.OpenMutexW.restype=wintypes.HANDLE
    kernel.CloseHandle.argtypes=[wintypes.HANDLE]
    kernel.CloseHandle.restype=wintypes.BOOL
    return kernel


def exists(kernel,name):
    handle=kernel.OpenMutexW(0x00100000,False,name)
    if handle:
        kernel.CloseHandle(handle)
        return True
    if ctypes.get_last_error()!=2:
        raise ctypes.WinError(ctypes.get_last_error())
    return False


@contextmanager
def installer_presence(kernel):
    ctypes.set_last_error(0)
    handle=kernel.CreateMutexW(None,False,INSTALLER)
    error=ctypes.get_last_error()
    if not handle:
        raise ctypes.WinError(error)
    try:
        if error==183:
            raise RuntimeError('An installer is already active; use an isolated Windows runner')
        yield
    finally:
        kernel.CloseHandle(handle)


def qualify(archive,fixture,evidence,*,dumpbin=None,dll_roots=()):
    if platform.system()!='Windows':
        raise ValueError('Actual Windows/Inno execution is required')
    if dumpbin is None:
        raise ValueError('Pass the actual x64 dumpbin and explicit trusted DLL roots')
    evidence=evidence.resolve()
    evidence.mkdir(parents=True,exist_ok=True)
    archive=archive.resolve(strict=True)
    fixture=fixture.resolve(strict=True)
    source=Path(os.environ.get('LUI_SOURCE_ROOT',REPO.parent/'lui')).resolve()
    subprocess.run(['node',str(REPO/'deps/ui/scripts/package-nsh.mjs'),
        'check-release-windows',str(archive),str(source)],check=True,capture_output=True)
    delivery=delivery_module(source)
    inspect=dependencies.inspector(dumpbin,delivery.architectures)
    receipt=json.loads(Path(str(archive)+'.lui-build.json').read_text(encoding='utf-8'))
    installer=archive.parent/receipt['installer']['name']
    result={'qualified':False,'protocol':PROTOCOL,'archive':str(archive),
        'driverSha256':digest(Path(__file__)), 'nativeWindowLaunch':'unqualified',
        'authenticodeTrust':'unqualified', 'graphSaveUpgrade':'unqualified',
        'multiUserSidIsolation':'unqualified; protocol v1 is machine-conservative', 'phases':[]}
    kernel=kernel_api()
    if exists(kernel,ACTIVE) or exists(kernel,INSTALLER):
        raise RuntimeError('Native Logseq/installer is active; refuse an ambiguous qualification')
    try:
        with tempfile.TemporaryDirectory(prefix='logseq-nsh-inno-') as temporary:
            private=Path(temporary).resolve()
            environment=native_environment(private/'profile',('127.0.0.1',49399),os.environ)
            environment['LUI_AGENT_LISTEN']=''
            clean=clean_environment(environment,Path(os.environ['SystemRoot']))
            installation=private/'installed'
            holders=[]
            sequence=0
            def run(binary,arguments,label,*,success,expected=None,clean_path=False):
                nonlocal sequence
                sequence+=1
                completed=subprocess.run([str(binary),*map(str,arguments)],cwd=private,
                    env=clean if clean_path else environment,stdin=subprocess.DEVNULL,
                    capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=90)
                transcript=completed.stdout+'\n'+completed.stderr
                (evidence/f'{sequence:02d}-{label}.log').write_text(transcript,encoding='utf-8')
                if (completed.returncode==0)!=success or (expected and expected not in transcript):
                    raise RuntimeError(f'{label}: exit={completed.returncode}; expected {expected!r}\n{transcript}')
                result['phases'].append({'phase':label,'exitCode':completed.returncode})
                return completed
            def setup(target,label,success):
                log=evidence/f'{label}-inno.log'
                run(installer,['/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART',
                    f'/DIR={target}',f'/LOG={log}'],label,success=success)
            def prepare_fixture(name):
                directory=private/name
                directory.mkdir()
                binary=directory/'worker-presence.exe'
                shutil.copy2(fixture,binary)
                closure=dependencies.collect([(binary,directory)],roots=dll_roots,
                    system_directory=Path(os.environ['SystemRoot'])/'System32',inspect=inspect)
                dependencies.copy(closure)
                return binary
            def hold(name):
                binary=prepare_fixture(name)
                process=subprocess.Popen([str(binary)],cwd=private,env=clean,
                    stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                    text=True,encoding='utf-8')
                holders.append(process)
                # The small fixture writes one readiness line then blocks on
                # stdin. A bounded helper thread prevents an invalid child from
                # hanging the job while preserving real kernel ownership.
                import concurrent.futures
                reader=concurrent.futures.ThreadPoolExecutor(max_workers=1)
                future=reader.submit(process.stdout.readline)
                try:
                    if future.result(timeout=10).strip()!='ACTIVE':
                        raise RuntimeError('Real worker primitive did not register activity')
                finally:
                    reader.shutdown(wait=False,cancel_futures=True)
                return process
            def release(process):
                process.stdin.write('stop\n')
                process.stdin.flush()
                process.wait(timeout=10)
                if process.returncode!=0:
                    raise RuntimeError('Worker admission fixture failed on clean exit')
                holders.remove(process)
                process.stdin.close();process.stdout.close();process.stderr.close()
            def verify_installed():
                with zipfile.ZipFile(archive) as files:
                    for member in files.infolist():
                        relative=Path(member.filename).relative_to('Logseq-NSH')
                        target=installation/relative
                        with files.open(member) as content:
                            if not target.is_file() or digest(target)!=hashlib.file_digest(content,'sha256').hexdigest():
                                raise RuntimeError(f'Installed payload differs: {relative}')
                if (installation/'.nsh-installing').exists():
                    raise RuntimeError('Successful installation retained its incomplete marker')
            try:
                probe=run(prepare_fixture('probe'),['--installation-admission-protocol'],'fixture-protocol',success=True,clean_path=True)
                if probe.stdout.strip()!=PROTOCOL:
                    raise RuntimeError('Native primitive protocol differs from the package')
                first=hold('old-version');second=hold('new-version')
                release(first)
                if not exists(kernel,ACTIVE):
                    raise RuntimeError('Closing one version released another worker presence')
                refused=private/'refused'
                setup(refused,'active-worker-refused',False)
                if refused.exists():
                    raise RuntimeError('Refused installation created application files')
                release(second)
                if exists(kernel,ACTIVE):
                    raise RuntimeError('Exited fixtures retained activity')
                setup(installation,'fresh-install',True)
                verify_installed()
                host=installation/'logseq-nsh.exe'
                worker=installation/'Resources/logseq-db-worker.exe'
                for binary in [host,worker]:
                    value=run(binary,['--installation-admission-protocol'],binary.stem+'-protocol',success=True,clean_path=True)
                    if value.stdout.strip()!=PROTOCOL: raise RuntimeError('Installed protocol differs')
                with installer_presence(kernel):
                    run(host,['--startup-preflight',private/'profile'],'host-start-refused',success=False,
                        expected='Logseq installation admission:',clean_path=True)
                    run(worker,[],'worker-start-refused',success=False,
                        expected='Native installation is active',clean_path=True)
                marker=installation/'.nsh-installing'
                marker.write_text(PROTOCOL,encoding='utf-8')
                (installation/'Resources/dicts/en.edn').write_text('interrupted copy',encoding='utf-8')
                run(host,['--startup-preflight',private/'profile'],'incomplete-host-refused',success=False,
                    expected='installation is incomplete',clean_path=True)
                run(worker,[],'incomplete-worker-refused',success=False,
                    expected='installation is incomplete',clean_path=True)
                setup(installation,'interrupted-repair',True)
                verify_installed()
                legacy=private/'legacy';legacy.mkdir()
                old=legacy/'logseq-nsh.exe';old.write_bytes(b'old unqualified code')
                setup(legacy,'legacy-target-refused',False)
                if old.read_bytes()!=b'old unqualified code' or (legacy/'Resources').exists():
                    raise RuntimeError('Legacy refusal modified old files')
                denied=private/'enumeration-denied';denied.mkdir()
                sentinel=denied/'logseq-nsh.exe';sentinel.write_bytes(b'nonempty denied target')
                icacls=Path(os.environ['SystemRoot'])/'System32/icacls.exe'
                # A non-inheriting deny applies only to listing this fresh
                # directory. Child bytes and DACL repair remain accessible.
                run(icacls,[denied,'/deny','*S-1-1-0:(RD)'],'deny-target-listing',success=True)
                try:
                    try:
                        with os.scandir(denied) as entries:
                            list(entries)
                    except PermissionError:
                        pass
                    else:
                        raise RuntimeError('Native fixture did not deny directory enumeration')
                    setup(denied,'enumeration-error-refused',False)
                    log=(evidence/'enumeration-error-refused-inno.log').read_text(encoding='utf-8-sig')
                    if 'Cannot inspect native installation directory: 5' not in log:
                        raise RuntimeError('Installer did not report its actual directory access error')
                    if sentinel.read_bytes()!=b'nonempty denied target' or (denied/'.nsh-installing').exists():
                        raise RuntimeError('Enumeration refusal modified the denied installation')
                finally:
                    run(icacls,[denied,'/remove:d','*S-1-1-0'],'restore-target-listing',success=True)
                uninstallers=list(installation.glob('unins*.exe'))
                if len(uninstallers)!=1: raise RuntimeError('Expected one actual Inno uninstaller')
                active=hold('uninstall-worker')
                run(uninstallers[0],['/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART'],
                    'active-worker-uninstall-refused',success=False)
                verify_installed();release(active)
                run(uninstallers[0],['/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART'],
                    'inactive-uninstall',success=True)
                if host.exists() or worker.exists(): raise RuntimeError('Uninstall retained host/worker')
                result['qualified']=True
            finally:
                for process in holders:
                    try:
                        process.stdin.write('stop\n');process.stdin.flush();process.wait(timeout=10)
                    except (OSError,subprocess.TimeoutExpired):
                        # Only these fresh stdin-blocking fixtures belong here;
                        # no service-daemon or foreign process id is terminated.
                        if process.poll() is None:
                            process.kill()
                        process.wait(timeout=10)
                if exists(kernel,INSTALLER):
                    raise RuntimeError('Installer admission remained after owned processes exited')
    except Exception as error:
        result['error']=str(error)
        raise
    finally:
        (evidence/'result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive',type=Path,required=True)
    parser.add_argument('--fixture',type=Path,required=True)
    parser.add_argument('--evidence',type=Path,required=True)
    parser.add_argument('--dumpbin',type=Path,required=True)
    parser.add_argument('--dll-root',type=Path,action='append',default=[])
    args=parser.parse_args()
    print(json.dumps(qualify(args.archive,args.fixture,args.evidence,dumpbin=args.dumpbin,dll_roots=args.dll_root)))


if __name__=='__main__': main()
