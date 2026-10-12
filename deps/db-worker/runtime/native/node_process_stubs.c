#include <caml/mlvalues.h>

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
