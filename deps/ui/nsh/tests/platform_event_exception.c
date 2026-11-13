/* Test-only adapter enters the exported bridge with the same runtime-lock
   state as the native Rust owner. The callback remains real OCaml code. */
/* Include the actual implementation once so test-only callback installation
   can access its private callback slots without adding a production API. */
#include <caml/mlvalues.h>
#include <caml/printexc.h>
static char *check_exception_roots(value exception);
#define caml_format_exception check_exception_roots
#include "../../native/logseq_lui_bridge.c"
#undef caml_format_exception

static int check_roots_enabled;
static int exception_root_checks;
static int invalid_exception_roots;
static int exception_collections;

/* Inspect real registered roots at the reporting boundary, then collect while
   that boundary is live. Detect unsafe old code before asking GC to visit it. */
static char *check_exception_roots(value exception) {
  CAMLparam1(exception);
  if (check_roots_enabled) {
    int invalid = 0;
    exception_root_checks++;
    for (struct caml__roots_block *block = CAML_LOCAL_ROOTS;
         block != NULL; block = block->next) {
      for (intnat table = 0; table < block->ntables; table++) {
        for (intnat item = 0; item < block->nitems; item++) {
          if (Is_exception_result(block->tables[table][item])) invalid++;
        }
      }
    }
    invalid_exception_roots += invalid;
    if (invalid != 0)
      CAMLreturnT(char *, caml_stat_strdup_noexc("invalid encoded exception root"));
    const value *collect = caml_named_value("logseq_test_exception_collect");
    if (collect != NULL) {
      bridge_callback_result result = bridge_callback1(*collect, Val_unit);
      if (!result.raised) exception_collections++;
    }
  }
  CAMLreturnT(char *, caml_format_exception(exception));
}

CAMLprim value caml_logseq_test_exception_roots(value enabled) {
  CAMLparam1(enabled);
  check_roots_enabled = Bool_val(enabled);
  if (check_roots_enabled) {
    exception_root_checks = 0;
    invalid_exception_roots = 0;
    exception_collections = 0;
  }
  CAMLreturn(Val_unit);
}

CAMLprim value caml_logseq_test_exception_root_counts(value unit) {
  CAMLparam1(unit);
  CAMLlocal1(result);
  result = caml_alloc_tuple(3);
  Store_field(result, 0, Val_int(exception_root_checks));
  Store_field(result, 1, Val_int(invalid_exception_roots));
  Store_field(result, 2, Val_int(exception_collections));
  CAMLreturn(result);
}

static void discard_patch(const char *json) { (void)json; }
static void discard_snapshot(const char *data, int32_t length) {
  (void)data;
  (void)length;
}

/* Real public entries, with only their existing private startup bit scoped for
   this already-running OCaml executable. No application initialization runs. */
CAMLprim value caml_logseq_test_callback_family(value family) {
  CAMLparam1(family);
  int previous_started = runtime_started;
  int selected = Int_val(family);
  int32_t accepted = 0;
  int64_t pins[] = {1, 2};
  runtime_started = 1;
  caml_enter_blocking_section();
  switch (selected) {
    case 0: accepted = lui_ocaml_start(patch_callback, wakeup_callback,
      platform_request_callback, 0, 6, "{}", 2); break;
    case 1: accepted = lui_ocaml_agent_utf8("{}", 2, discard_patch); break;
    case 2: accepted = lui_ocaml_editor_snapshot_utf8("block", 5, discard_snapshot); break;
    case 3: accepted = lui_ocaml_text_changed_utf8(1, "text", 4); break;
    case 4: accepted = lui_ocaml_pointer_down_utf8(1, 2., 3., 0, 0, "cell", 4); break;
    case 5: accepted = lui_ocaml_navigation_key_utf8(1, "Home", 4, 0); break;
    case 6: accepted = lui_ocaml_scroll_completed(1, 1, "finished"); break;
    case 7: accepted = lui_ocaml_virtual_window(1, 1, 0, 2, pins, 2); break;
    case 8: accepted = lui_ocaml_extension_event_utf8(1, "identifier", 10, "event", 5, "{}", 2); break;
    case 9: accepted = lui_ocaml_document_event_utf8("event\n{}", 8); break;
    case 10: accepted = lui_ocaml_press(1); break;
  }
  caml_leave_blocking_section();
  runtime_started = previous_started;
  CAMLreturn(Val_int(accepted));
}

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

/* Capture the real bridge callbacks, not a replacement Host implementation.
   The bounded fixture creates only three incremental batches and two requests. */
static char *ordered_messages[32];
static size_t ordered_message_count;
static int ordered_message_error;
static int ordered_capture_active;
static lui_patch_callback ordered_saved_patch;
static logseq_platform_request_callback ordered_saved_request;

static void record_ordered_message(char kind, const char *data, size_t length) {
  if (ordered_message_count == 32) {
    ordered_message_error = 1;
    return;
  }
  char *copy = malloc(length + 2);
  if (copy == NULL) {
    ordered_message_error = 1;
    return;
  }
  copy[0] = kind;
  memcpy(copy + 1, data, length);
  copy[length + 1] = '\0';
  ordered_messages[ordered_message_count++] = copy;
}
static void ordered_patch(const char *json) {
  record_ordered_message('P', json, strlen(json));
}
static void ordered_request(const char *data, int32_t length) {
  if (length < 0) ordered_message_error = 1;
  else record_ordered_message('R', data, (size_t)length);
}
CAMLprim value caml_logseq_test_ordered_callbacks_start(value unit) {
  CAMLparam1(unit);
  if (ordered_capture_active) caml_failwith("Bridge order capture already active");
  ordered_saved_patch = patch_callback;
  ordered_saved_request = platform_request_callback;
  ordered_message_count = 0;
  ordered_message_error = 0;
  ordered_capture_active = 1;
  patch_callback = ordered_patch;
  platform_request_callback = ordered_request;
  CAMLreturn(Val_unit);
}
CAMLprim value caml_logseq_test_ordered_callbacks_without_patch(value unit) {
  CAMLparam1(unit);
  if (!ordered_capture_active) caml_failwith("Bridge order capture is not active");
  patch_callback = NULL;
  CAMLreturn(Val_unit);
}
CAMLprim value caml_logseq_test_ordered_callbacks_finish(value unit) {
  CAMLparam1(unit);
  CAMLlocal3(result, cell, message);
  if (!ordered_capture_active) caml_failwith("Bridge order capture is not active");
  patch_callback = ordered_saved_patch;
  platform_request_callback = ordered_saved_request;
  ordered_capture_active = 0;
  result = Val_emptylist;
  while (ordered_message_count > 0) {
    char *bytes = ordered_messages[--ordered_message_count];
    message = caml_copy_string(bytes);
    free(bytes);
    cell = caml_alloc_small(2, 0);
    Field(cell, 0) = message;
    Field(cell, 1) = result;
    result = cell;
  }
  if (ordered_message_error) caml_failwith("Bridge order capture exceeded its bounded storage");
  CAMLreturn(result);
}

CAMLprim value caml_logseq_test_ordered_pump(value unit) {
  CAMLparam1(unit);
  caml_enter_blocking_section();
  int32_t accepted = lui_ocaml_pump();
  caml_leave_blocking_section();
  CAMLreturn(Val_int(accepted));
}
