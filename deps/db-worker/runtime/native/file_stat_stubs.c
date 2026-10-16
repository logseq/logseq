#include <caml/mlvalues.h>
#include <caml/memory.h>
#include <caml/alloc.h>
#ifdef _WIN32
#include <windows.h>
#else
#include <sys/stat.h>
#endif

CAMLprim value logseq_file_birthtime(value path) {
  CAMLparam1(path);
  CAMLlocal2(result, timestamp);
  double seconds;
#ifdef _WIN32
  int length = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, String_val(path), -1, NULL, 0);
  if (!length) CAMLreturn(Val_none);
  wchar_t *wide = caml_stat_alloc(length * sizeof(wchar_t));
  MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, String_val(path), -1, wide, length);
  WIN32_FILE_ATTRIBUTE_DATA data;
  BOOL success = GetFileAttributesExW(wide, GetFileExInfoStandard, &data);
  caml_stat_free(wide);
  if (!success) CAMLreturn(Val_none);
  ULARGE_INTEGER ticks;
  ticks.LowPart = data.ftCreationTime.dwLowDateTime;
  ticks.HighPart = data.ftCreationTime.dwHighDateTime;
  seconds = ((double)ticks.QuadPart / 10000000.0) - 11644473600.0;
#elif defined(__APPLE__)
  struct stat data;
  if (stat(String_val(path), &data)) CAMLreturn(Val_none);
  seconds = data.st_birthtimespec.tv_sec + data.st_birthtimespec.tv_nsec / 1000000000.0;
#else
  CAMLreturn(Val_none);
#endif
  timestamp = caml_copy_double(seconds);
  result = caml_alloc_some(timestamp);
  CAMLreturn(result);
}
