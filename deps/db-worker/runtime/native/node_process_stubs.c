#include <caml/mlvalues.h>
#include <caml/alloc.h>
#include <caml/fail.h>
#include <stdio.h>
#include <wchar.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

/* Unix.getpid on win32unix returns a duplicated self HANDLE value (a
   small slot number), not the OS process id. The lifecycle protocol
   compares pids against Node's child.pid / tasklist / OpenProcess, all
   of which use real OS pids. */
CAMLprim value caml_logseq_process_id(value unit)
{
#ifdef _WIN32
  return Val_int((intnat)GetCurrentProcessId());
#else
  return Val_int((intnat)getpid());
#endif
}

CAMLprim value logseq_macos_arm64(value unit)
{
#if defined(__APPLE__) && defined(__aarch64__)
  return Val_true;
#else
  return Val_false;
#endif
}

/* Shared native-worker lifetime, independent of the UI that first started it.
   Default non-inheritable handles are kept until complete process exit. */
#define LOGSEQ_ADMISSION_PROTOCOL "com.logseq.logseq.nsh-installation-admission-v1"

CAMLprim value caml_logseq_installation_protocol(value unit)
{
  (void)unit;
  return caml_copy_string(LOGSEQ_ADMISSION_PROTOCOL);
}

CAMLprim value caml_logseq_installation_admission(value unit)
{
  (void)unit;
#ifdef _WIN32
  static HANDLE presence = NULL;
  WCHAR executable[32768];
  DWORD length = GetModuleFileNameW(NULL, executable, 32768);
  WCHAR *separator;
  HANDLE installer;
  DWORD error;
  char message[160];
  if (presence != NULL) return Val_unit;
  if (length == 0 || length >= 32768)
    caml_failwith("Cannot determine native worker installation path");
  separator = wcsrchr(executable, L'\\');
  if (separator == NULL) caml_failwith("Native worker has no directory");
  *separator = L'\0';
  separator = wcsrchr(executable, L'\\');
  if (separator != NULL && _wcsicmp(separator + 1, L"Resources") == 0)
    *separator = L'\0';
  if (wcslen(executable) + wcslen(L"\\.nsh-installing") >= 32768)
    caml_failwith("Native worker installation path exceeds the Windows limit");
  memcpy(executable + wcslen(executable), L"\\.nsh-installing", sizeof(L"\\.nsh-installing"));
  if (GetFileAttributesW(executable) != INVALID_FILE_ATTRIBUTES)
    caml_failwith("Native installation is incomplete; repair it before starting a worker");
  error = GetLastError();
  if (error != ERROR_FILE_NOT_FOUND && error != ERROR_PATH_NOT_FOUND)
    caml_failwith("Cannot check native worker installation marker");
  presence = CreateMutexW(NULL, FALSE, L"Global\\com.logseq.logseq.nsh-active-v1");
  if (presence == NULL) {
    error = GetLastError();
    snprintf(message, sizeof(message), "CreateMutexW(worker activity) failed: %lu", (unsigned long)error);
    caml_failwith(message);
  }
  installer = OpenMutexW(SYNCHRONIZE, FALSE, L"Global\\com.logseq.logseq.nsh-installer-v1");
  error = installer == NULL ? GetLastError() : ERROR_SUCCESS;
  if (installer != NULL || error != ERROR_FILE_NOT_FOUND) {
    if (installer != NULL) CloseHandle(installer);
    CloseHandle(presence);
    presence = NULL;
    snprintf(message, sizeof(message), "Native installation is active or cannot be checked: %lu", (unsigned long)error);
    caml_failwith(message);
  }
#endif
  return Val_unit;
}
