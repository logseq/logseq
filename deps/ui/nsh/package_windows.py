#!/usr/bin/env python3
"""Package a qualified actual Windows App; unsigned output is explicit evidence.

Reuse LUI's architecture, ZIP, Authenticode and Inno-discovery hooks without
rebuilding a generic runner or replacing the actual Logseq startup/service ABI.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile
import zipfile

REPO = Path(__file__).resolve().parents[3]
HELPER = REPO / "deps/ui/scripts/package-nsh.mjs"
PROTOCOL = "com.logseq.logseq.nsh-installation-admission-v1"
ACTIVE = r"Global\com.logseq.logseq.nsh-active-v1"
INSTALLER = r"Global\com.logseq.logseq.nsh-installer-v1"


def run(command, *, cwd=REPO, capture=False):
    result = subprocess.run(list(map(str, command)), cwd=cwd, check=True, text=True,
                            encoding="utf-8", stdout=subprocess.PIPE if capture else sys.stderr)
    return result.stdout if capture else None


def inno_script(application, version, installer_stem, payload_hashes):
    """An actual-App file installer; no user data/cache/graph paths are removed."""
    def escape(value):
        if any(character in value for character in "\r\n\0"):
            raise ValueError("Invalid Inno Setup value")
        return value.replace("{", "{{").replace('"', '""')
    source = escape(str(application))
    return f'''[Setup]
AppId=com.logseq.logseq
AppName=Logseq NSH
AppVersion={escape(version)}
DefaultDirName={{autopf}}\\Logseq-NSH
DefaultGroupName=Logseq NSH
DisableProgramGroupPage=yes
DisableDirPage=auto
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0.17763
OutputBaseFilename={escape(installer_stem)}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
CloseApplications=no
RestartApplications=no
AppMutex={ACTIVE}
UninstallDisplayIcon={{app}}\\logseq-nsh.exe
[InstallDelete]
Type: filesandordirs; Name: "{{app}}\\Resources"
Type: filesandordirs; Name: "{{app}}\\nsh"
Type: files; Name: "{{app}}\\*.dll"
[Files]
Source: "{source}\\*"; DestDir: "{{app}}"; Flags: ignoreversion recursesubdirs createallsubdirs
[Icons]
Name: "{{autoprograms}}\\Logseq NSH"; Filename: "{{app}}\\logseq-nsh.exe"; AppUserModelID: "com.logseq.logseq"
''' + admission_script(payload_hashes)



def admission_script(payload_hashes):
    checks = []
    for relative, digest in payload_hashes.items():
        name = relative.replace('/', '\\').replace("'", "''")
        checks.append(f"  FileName := AddBackslash(ExpandConst('{{app}}')) + '{name}';\n"
                      f"  if not FileExists(FileName) then RaiseException('Installed payload is incomplete: ' + FileName);\n"
                      f"  if CompareText(GetSHA256OfFile(FileName), '{digest}') <> 0 then RaiseException('Installed payload differs: ' + FileName);")
    return r'''
[Code]
type
  TNativeFindData = record
    Attributes: Cardinal;
    CreationTime: TFileTime;
    LastAccessTime: TFileTime;
    LastWriteTime: TFileTime;
    SizeHigh: Cardinal;
    SizeLow: Cardinal;
    Reserved0: Cardinal;
    Reserved1: Cardinal;
    FileName: array[0..259] of Char;
    AlternateFileName: array[0..13] of Char;
  end;
var
  Admission: THandle;
function WinCreateMutex(Attributes: NativeInt; Owner: Integer; Name: String): THandle;
  external 'CreateMutexW@kernel32.dll stdcall';
function WinOpenMutex(Access: Cardinal; Inherit: Integer; Name: String): THandle;
  external 'OpenMutexW@kernel32.dll stdcall';
function WinCloseHandle(Handle: THandle): Integer;
  external 'CloseHandle@kernel32.dll stdcall';
procedure WinSetLastError(Error: Cardinal);
  external 'SetLastError@kernel32.dll stdcall';
function WinFindFirst(FileName: String; var Data: TNativeFindData): NativeInt;
  external 'FindFirstFileW@kernel32.dll stdcall';
function WinFindNext(Handle: NativeInt; var Data: TNativeFindData): Integer;
  external 'FindNextFileW@kernel32.dll stdcall';
function WinFindClose(Handle: NativeInt): Integer;
  external 'FindClose@kernel32.dll stdcall';
function AcquireAdmission: Boolean;
var Error: Cardinal;
begin
  WinSetLastError(0);
  Admission := WinCreateMutex(0, 0, '@INSTALLER@');
  Error := DLLGetLastError;
  Result := (Admission <> 0) and (Error <> 183);
  if not Result then begin
    if Admission <> 0 then WinCloseHandle(Admission);
    Admission := 0;
    Log('Installation refused: another installer or an inaccessible admission object');
  end;
end;
function ApplicationInactive: Boolean;
var Active: THandle; Error: Cardinal;
begin
  Active := WinOpenMutex($00100000, 0, '@ACTIVE@');
  Error := DLLGetLastError;
  Result := (Active = 0) and (Error = 2);
  if Active <> 0 then WinCloseHandle(Active);
end;
procedure ReleaseAdmission;
begin
  if Admission <> 0 then WinCloseHandle(Admission);
  Admission := 0;
end;
function InitializeAdmission: Boolean;
begin
  Result := AcquireAdmission;
  if Result and not ApplicationInactive then begin
    Log('Change refused: Logseq or a shared native worker is active');
    ReleaseAdmission;
    SuppressibleMsgBox(FmtMessage(SetupMessage(msgSetupAppRunningError), ['Logseq NSH']), mbError, MB_OK, IDOK);
    Result := False;
  end;
end;
function InitializeSetup: Boolean;
begin
  { Register before the built-in AppMutex check, not SetupMutex's later check. }
  Result := InitializeAdmission;
end;
function InitializeUninstall: Boolean;
begin
  Result := InitializeAdmission;
end;
procedure DeinitializeSetup;
begin
  ReleaseAdmission;
end;
procedure DeinitializeUninstall;
begin
  ReleaseAdmission;
end;
function ProtocolMarker(FileName: String): Boolean;
var Value: AnsiString;
begin
  Result := LoadStringFromFile(FileName, Value);
  if Result then Result := Trim(String(Value)) = '@PROTOCOL@';
end;
function NonemptyDirectory(Directory: String): Boolean;
var Entry: TNativeFindData; Handle: NativeInt; Error: Cardinal;
begin
  { Built-in FindFirst/FindNext do not capture DLLGetLastError. Use the
    public WIN32_FIND_DATAW ABI so access/I/O failures cannot mean empty. }
  if SizeOf(Entry) <> 592 then
    RaiseException('Unsupported native directory enumeration ABI');
  Result := False;
  Handle := WinFindFirst(AddBackslash(Directory) + '*', Entry);
  Error := DLLGetLastError;
  if Handle = -1 then begin
    { ERROR_FILE_NOT_FOUND / ERROR_PATH_NOT_FOUND prove absent matches. }
    if (Error <> 2) and (Error <> 3) then
      RaiseException('Cannot inspect native installation directory: ' + IntToStr(Error));
    Exit;
  end;
  try
    while True do begin
      if not ((Entry.FileName[0] = '.') and
          ((Entry.FileName[1] = #0) or
           ((Entry.FileName[1] = '.') and (Entry.FileName[2] = #0)))) then begin
        Result := True;
        Exit;
      end;
      if WinFindNext(Handle, Entry) = 0 then begin
        Error := DLLGetLastError;
        { ERROR_NO_MORE_FILES is the only successful enumeration end. }
        if Error <> 18 then
          RaiseException('Cannot inspect native installation directory: ' + IntToStr(Error));
        Exit;
      end;
    end;
  finally
    WinFindClose(Handle);
  end;
end;
function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  Result := '';
  if not ApplicationInactive then begin
    Result := 'Close Logseq and all shared native database workers before installation.';
    Exit;
  end;
  if NonemptyDirectory(ExpandConst('{app}')) and
     not ProtocolMarker(ExpandConst('{app}\nsh\installation-admission-v1')) and
     not ProtocolMarker(ExpandConst('{app}\.nsh-installing')) then begin
    Result := 'This installation predates safe admission. Remove it after stopping its processes, or choose a new empty directory.';
    Exit;
  end;
  if not ForceDirectories(ExpandConst('{app}')) or
     not SaveStringToFile(ExpandConst('{app}\.nsh-installing'), '@PROTOCOL@', False) then
    Result := 'Cannot mark the native installation as in progress.';
end;
procedure CurStepChanged(Step: TSetupStep);
var FileName: String;
begin
  if Step = ssPostInstall then begin
@CHECKS@
    if not DeleteFile(ExpandConst('{app}\.nsh-installing')) then
      RaiseException('Cannot complete native installation admission');
  end;
end;
procedure CurUninstallStepChanged(Step: TUninstallStep);
begin
  if Step = usUninstall then begin
    if not SaveStringToFile(ExpandConst('{app}\.nsh-installing'), '@PROTOCOL@', False) then
      RaiseException('Cannot mark native removal as in progress');
  end;
  if Step = usPostUninstall then begin
    if not FileExists(ExpandConst('{app}\logseq-nsh.exe')) and
       not FileExists(ExpandConst('{app}\Resources\logseq-db-worker.exe')) then
      DeleteFile(ExpandConst('{app}\.nsh-installing'));
  end;
end;
'''.replace('@INSTALLER@', INSTALLER).replace('@ACTIVE@', ACTIVE).replace('@PROTOCOL@', PROTOCOL).replace('@CHECKS@', '\n'.join(checks))

def delivery_module(source):
    spec = importlib.util.spec_from_file_location("lui_windows_delivery", source / "tooling/nsh_delivery.py")
    delivery = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(delivery)
    return delivery


def verify_archived_code(archive, application, code):
    with zipfile.ZipFile(archive) as files:
        for file in code:
            name = application.name + "/" + file.relative_to(application).as_posix()
            with files.open(name) as archived, file.open("rb") as original:
                if hashlib.file_digest(archived, "sha256").digest() != hashlib.file_digest(original, "sha256").digest():
                    raise ValueError(f"Archive does not contain the final signed code: {name}")


def package(args):
    if platform.system() != "Windows" or platform.machine().lower() not in ("amd64", "x86_64"):
        raise ValueError("Actual Windows packages require native Windows x86_64")
    if args.windows_thumbprint is not None and not args.windows_thumbprint.strip():
        raise ValueError("An explicitly requested Windows signing thumbprint must not be empty")
    if args.timestamp_url is not None and not args.windows_thumbprint:
        raise ValueError("A timestamp URL requires an actual Windows signing certificate thumbprint")
    host = args.built_host.resolve(strict=True)
    source = args.lui_source.resolve(strict=True)
    delivery = delivery_module(source)
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    node = shutil.which(args.node)
    if not node:
        raise ValueError("Node.js is required for qualified application package receipts")
    environment = os.environ
    if any(environment.get(name) for name in ("LUI_OCAML_LIBRARY", "LOGSEQ_NATIVE_ASSET_DIR", "LOGSEQ_DB_WORKER_BIN", "NSH_RUNTIME", "NSH_RUNTIME_DIR")):
        raise ValueError("Unset native development artifact overrides before packaging")
    with tempfile.TemporaryDirectory(prefix=".windows-package-", dir=output) as temporary:
        stage = Path(temporary)
        application = stage / "Logseq-NSH"
        resources = application / "Resources"
        snapshot = stage / "snapshot.json"
        run([node, HELPER, "stage-windows", host, host.parent / "Resources/logseq_ui.dll",
             host.parent / "Resources", application, resources, snapshot, source,
             args.update_url or "", args.update_public_key.resolve() if args.update_public_key else ""])
        before = json.loads(snapshot.read_text(encoding="utf-8"))
        for binary in (host, host.parent / "Resources/logseq-db-worker.exe"):
            if run([binary, "--installation-admission-protocol"], capture=True).strip() != PROTOCOL:
                raise ValueError("Actual host and native worker must support the checked installation-admission protocol")
        marker = application / "nsh/installation-admission-v1"
        marker.write_text(PROTOCOL + "\n", encoding="utf-8")
        before["metadata"].append({"path":str(marker), "sha256":delivery.digest(marker)})
        snapshot.write_text(json.dumps(before), encoding="utf-8")
        code = list(dict.fromkeys(Path(name) for name in before["codeFiles"]))
        executable = application / "logseq-nsh.exe"
        for file in code:
            if delivery.architectures(file, "windows") != {"x86_64"}:
                raise ValueError(f"Expected qualified Windows x86_64 code: {file}")
        code.sort(key=lambda file: (file == executable, file.suffix.lower() == ".exe", str(file)))
        signing = delivery.sign_windows(code, args)
        archives = delivery.archive_package(application, stage,
            dict(before["application"], name="Logseq-NSH"), "windows", {"x86_64"})
        if len(archives) != 1 or archives[0].name != before["archiveName"]:
            raise ValueError("Unexpected canonical Windows archive name")
        archive = archives[0]
        verify_archived_code(archive, application, code)
        installer = None
        iscc = args.iscc.resolve(strict=True) if args.iscc else delivery.find_iscc()
        script = stage / "Logseq-NSH.iss"
        installer_name = before["archiveName"].removesuffix(".zip") + "-setup"
        hashes = {}
        with zipfile.ZipFile(archive) as files:
            for member in files.infolist():
                with files.open(member) as content:
                    hashes[member.filename.removeprefix(application.name + "/")] = hashlib.file_digest(content, "sha256").hexdigest()
        script.write_text(inno_script(application, before["application"]["version"], installer_name, hashes), encoding="utf-8")
        if iscc:
            run([iscc, "/Q", f"/O{stage}", script], cwd=stage)
            installer = stage / f"{installer_name}.exe"
            if not installer.is_file():
                raise ValueError("Inno Setup did not produce the expected actual application installer")
            delivery.sign_windows([installer], args)
        final = output / archive.name
        information = stage / "delivery.json"
        information.write_text(json.dumps({"signing":signing,
            **({"installer":str(installer)} if installer else {})}), encoding="utf-8")
        run([node, HELPER, "finish", snapshot, archive, final, information])
        release = Path(str(archive) + ".release")
        release.mkdir()
        shutil.copy2(stage / "release-config/nsh.json", release / "nsh.json")
        run([node, HELPER, "check-release-windows", archive, source], capture=True)
        files = [archive, *([installer] if installer else []), Path(str(archive) + ".lui-build.json")]
        if any((output / file.name).exists() for file in files) or Path(str(final) + ".release").exists():
            raise ValueError("Refusing to overwrite an existing Windows release")
        # Per-file publication, with the source/installed-code receipt last.
        # Installer compilation and every signature verification happened first.
        shutil.move(str(archive), final)
        if installer:
            shutil.move(str(installer), output / installer.name)
        shutil.move(str(release), Path(str(final) + ".release"))
        shutil.move(str(files[-1]), Path(str(final) + ".lui-build.json"))
        return final


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--built-host", type=Path, default=REPO / "deps/ui/_build/nsh-windows/logseq-nsh.exe")
    parser.add_argument("--lui-source", type=Path, default=Path(os.environ.get("LUI_SOURCE_ROOT", REPO.parent / "lui")))
    parser.add_argument("--output", type=Path, default=REPO / "deps/ui/_build/packages")
    parser.add_argument("--node", default="node")
    parser.add_argument("--windows-thumbprint")
    parser.add_argument("--timestamp-url")
    parser.add_argument("--signtool", default="signtool")
    parser.add_argument("--iscc", type=Path)
    parser.add_argument("--update-url")
    parser.add_argument("--update-public-key", type=Path)
    args = parser.parse_args()
    try:
        print(package(args))
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        parser.exit(1, f"Actual Windows packaging failed: {error}\n")


if __name__ == "__main__":
    main()
