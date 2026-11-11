/* Linked with the same native_embed object as the application. This process
   exports canonical schemas without initializing any application services. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <caml/alloc.h>
#include <caml/callback.h>
#include <caml/fail.h>
#include <caml/memory.h>
#include <caml/mlvalues.h>
#include <caml/printexc.h>
#include <caml/startup.h>

void logseq_lui_wakeup(void) {
  fputs("schema export unexpectedly started an application service\n", stderr);
  abort();
}
void logseq_lui_platform_request(value payload) {
  (void)payload;
  fputs("schema export unexpectedly requested a platform service\n", stderr);
  abort();
}

int main(void) {
#if defined(_WIN32)
  wchar_t *arguments[] = {L"logseq_schema_export", NULL};
#else
  char *arguments[] = {"logseq_schema_export", NULL};
#endif
  caml_startup(arguments);
  CAMLparam0();
  CAMLlocal1(result);
  const value *callback = caml_named_value("logseq_lui_extension_schemas");
  if (callback == NULL) {
    fputs("missing canonical extension schema callback\n", stderr);
    CAMLreturnT(int, 1);
  }
  result = caml_callback_exn(*callback, Val_unit);
  if (Is_exception_result(result)) {
    char *message = caml_format_exception(Extract_exception(result));
    fprintf(stderr, "extension schema export: %s\n", message);
    caml_stat_free(message);
    CAMLreturnT(int, 1);
  }
  size_t length = caml_string_length(result);
  int failed = fwrite(String_val(result), 1, length, stdout) != length;
  if (!failed) failed = fputc('\n', stdout) == EOF;
  if (!failed) failed = fflush(stdout) != 0;
  CAMLreturnT(int, failed ? 1 : 0);
}
