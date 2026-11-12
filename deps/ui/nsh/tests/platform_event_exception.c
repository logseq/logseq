/* Test-only adapter enters the exported bridge with the same runtime-lock
   state as the native Rust owner. The callback remains real OCaml code. */
/* Include the actual implementation once so test-only callback installation
   can access its private callback slots without adding a production API. */
#include "../../native/logseq_lui_bridge.c"

/* A void host callback may leave any register value behind. Reproduce the
   crashing encoded value deterministically, without casting function types or
   manufacturing an OCaml exception. The primitive must return Val_unit after
   calling it. These are the desktop architectures supported by this runner. */
#if defined(__aarch64__)
#define CLOBBER_RETURN_REGISTER "mov x0, #30\nret"
#elif defined(__x86_64__)
#define CLOBBER_RETURN_REGISTER "mov $30, %eax\nret"
#else
#error "Add an adversarial void callback for this native desktop architecture"
#endif

__attribute__((naked)) static void clobber_wakeup(void) {
  __asm__(CLOBBER_RETURN_REGISTER);
}

__attribute__((naked)) static void clobber_request(
    const char *data __attribute__((unused)),
    int32_t length __attribute__((unused))) {
  __asm__(CLOBBER_RETURN_REGISTER);
}

static logseq_wakeup_callback saved_wakeup;
static logseq_platform_request_callback saved_request;

CAMLprim value caml_logseq_test_adversarial_callbacks(value enabled) {
  CAMLparam1(enabled);
  if (Bool_val(enabled)) {
    saved_wakeup = wakeup_callback;
    saved_request = platform_request_callback;
    wakeup_callback = clobber_wakeup;
    platform_request_callback = clobber_request;
  } else {
    wakeup_callback = saved_wakeup;
    platform_request_callback = saved_request;
  }
  CAMLreturn(Val_unit);
}

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

/* Exercise the actual length-independent integer mask ABI. The OCaml executable
   already owns its runtime; this follows the existing foreign-entry lock state. */
CAMLprim value caml_logseq_test_press_modifiers(value node, value modifiers) {
  CAMLparam2(node, modifiers);
  int64_t target = Long_val(node);
  int32_t mask = Int_val(modifiers);
  caml_enter_blocking_section();
  int32_t accepted = lui_ocaml_press_ex(target, mask);
  caml_leave_blocking_section();
  CAMLreturn(Val_int(accepted));
}

CAMLprim value caml_logseq_test_focus_within(value node, value within) {
  CAMLparam2(node, within);
  int64_t target = Long_val(node);
  int32_t focused = Bool_val(within);
  caml_enter_blocking_section();
  int32_t accepted = lui_ocaml_focus_within_changed(target, focused);
  caml_leave_blocking_section();
  CAMLreturn(Val_int(accepted));
}
