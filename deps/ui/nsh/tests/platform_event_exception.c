/* Test-only adapter enters the exported bridge with the same runtime-lock
   state as the native Rust owner. The callback remains real OCaml code. */
#include <stdint.h>
#include <string.h>
#include <caml/alloc.h>
#include <caml/memory.h>
#include <caml/mlvalues.h>
#include <caml/signals.h>

extern int32_t lui_ocaml_platform_event(const char *data, int32_t length);

CAMLprim value caml_logseq_test_platform_event(value payload) {
  CAMLparam1(payload);
  mlsize_t length = caml_string_length(payload);
  char *copy = caml_stat_alloc(length);
  memcpy(copy, String_val(payload), length);
  caml_enter_blocking_section();
  int32_t accepted = lui_ocaml_platform_event(copy, (int32_t)length);
  caml_leave_blocking_section();
  caml_stat_free(copy);
  CAMLreturn(Val_int(accepted));
}
