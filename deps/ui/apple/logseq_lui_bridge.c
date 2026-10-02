#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <caml/alloc.h>
#include <caml/callback.h>
#include <caml/memory.h>
#include <caml/mlvalues.h>
#include <caml/printexc.h>
#include <caml/signals.h>
#include <caml/startup.h>

#if defined(_WIN32)
#define LUI_EXPORT __declspec(dllexport)
#else
#define LUI_EXPORT __attribute__((visibility("default")))
#endif

typedef void (*lui_patch_callback)(const char *json);
typedef void (*logseq_wakeup_callback)(void);
typedef void (*logseq_platform_request_callback)(const char *data,
                                                 int32_t length);

static int runtime_started = 0;
static lui_patch_callback patch_callback = NULL;
static logseq_wakeup_callback wakeup_callback = NULL;
static logseq_platform_request_callback platform_request_callback = NULL;

static void report_ocaml_exception(const char *where, value result) {
  char *message = caml_format_exception(Extract_exception(result));
  fprintf(stderr, "logseq_lui_bridge: OCaml exception in %s: %s\n", where,
          message);
  caml_stat_free(message);
}

static int emit_patch(const char *where, value result) {
  if (Is_exception_result(result)) {
    report_ocaml_exception(where, result);
    return 0;
  }
  const char *json = String_val(result);
  if (patch_callback != NULL && json[0] != '\0') {
    patch_callback(json);
  }
  return 1;
}

static value copy_bytes(const char *data, int32_t length) {
  value text = caml_alloc_string((mlsize_t)length);
  memcpy(Bytes_val(text), data, (size_t)length);
  return text;
}

LUI_EXPORT int32_t lui_ocaml_start(lui_patch_callback callback,
                                   logseq_wakeup_callback wakeup_cb,
                                   logseq_platform_request_callback
                                       platform_request_cb,
                                   int32_t platform_code,
                                   int32_t host_code,
                                   const char *payload_data,
                                   int32_t payload_length) {
  int32_t accepted;
  patch_callback = callback;
  wakeup_callback = wakeup_cb;
  platform_request_callback = platform_request_cb;
  if (!runtime_started) {
    char *arguments[] = {"logseq_lui_ocaml", NULL};
    caml_startup(arguments);
    runtime_started = 1;
  } else {
    caml_leave_blocking_section();
  }

  const value *initialize = caml_named_value("lui_ocaml_init");
  if (initialize == NULL) {
    caml_enter_blocking_section();
    return 0;
  }
  CAMLparam0();
  CAMLlocal2(payload_value, result);
  payload_value = copy_bytes(payload_data, payload_length);
  result = caml_callback3_exn(*initialize, Val_long(platform_code),
                            Val_long(host_code), payload_value);
  accepted = emit_patch("lui_ocaml_init", result);
  CAMLdrop;
  caml_enter_blocking_section();
  return accepted;
}

/* OCaml-internal: native_embed.ml's `external wakeup` calls here; we
   bounce to the Swift callback so async completions pump on the UI
   thread. Must NOT call back into the OCaml runtime. */
LUI_EXPORT void logseq_lui_wakeup(void) {
  if (wakeup_callback != NULL) wakeup_callback();
}

LUI_EXPORT void logseq_lui_platform_request(value payload) {
  const char *data = String_val(payload);
  int32_t length = (int32_t)caml_string_length(payload);
  if (platform_request_callback != NULL)
    platform_request_callback(data, length);
}

static int dispatch_long(const char *name, int64_t node) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value(name);
  if (dispatch != NULL) {
    result = emit_patch(name, caml_callback_exn(*dispatch, Val_long(node)));
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_appear(int64_t node) {
  return dispatch_long("lui_ocaml_appear", node);
}

LUI_EXPORT int32_t lui_ocaml_press(int64_t node) {
  return dispatch_long("lui_ocaml_press", node);
}

LUI_EXPORT int32_t lui_ocaml_long_press(int64_t node) {
  return dispatch_long("lui_ocaml_long_press", node);
}

static int dispatch_string(const char *name, int64_t node,
                           const char *text) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value(name);
  if (dispatch != NULL && text != NULL) {
    CAMLparam0();
    CAMLlocal2(text_value, callback_result);
    text_value = caml_copy_string(text);
    callback_result =
        caml_callback2_exn(*dispatch, Val_long(node), text_value);
    result = emit_patch(name, callback_result);
    CAMLdrop;
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_text_changed(int64_t node,
                                          const char *text) {
  return dispatch_string("lui_ocaml_text_changed", node, text);
}

LUI_EXPORT int32_t lui_ocaml_submit(int64_t node) {
  return dispatch_long("lui_ocaml_submit", node);
}

LUI_EXPORT int32_t lui_ocaml_dismiss(int64_t node) {
  return dispatch_long("lui_ocaml_dismiss", node);
}

LUI_EXPORT int32_t lui_ocaml_double_press(int64_t node) {
  return dispatch_long("lui_ocaml_double_press", node);
}

LUI_EXPORT int32_t lui_ocaml_toggle_changed(int64_t node, int32_t checked) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value("lui_ocaml_toggle_changed");
  if (dispatch != NULL) {
    result = emit_patch("lui_ocaml_toggle_changed",
                        caml_callback2_exn(*dispatch, Val_long(node),
                                           Val_bool(checked)));
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_radio_changed(int64_t node) {
  return dispatch_long("lui_ocaml_radio_changed", node);
}

LUI_EXPORT int32_t lui_ocaml_slider_changed(int64_t node,
                                            double fraction) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value("lui_ocaml_slider_changed");
  if (dispatch != NULL) {
    result = emit_patch("lui_ocaml_slider_changed",
                        caml_callback2_exn(*dispatch, Val_long(node),
                                           caml_copy_double(fraction)));
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_scroll_completed(int64_t node, int64_t token,
                                              const char *outcome) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value("lui_ocaml_scroll_completed");
  if (dispatch != NULL && outcome != NULL) {
    CAMLparam0();
    CAMLlocal2(outcome_value, callback_result);
    outcome_value = caml_copy_string(outcome);
    callback_result = caml_callback3_exn(*dispatch, Val_long(node),
                                         Val_long(token), outcome_value);
    result = emit_patch("lui_ocaml_scroll_completed", callback_result);
    CAMLdrop;
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_visible_range(int64_t node, int64_t first,
                                           int64_t last) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value("lui_ocaml_visible_range");
  if (dispatch != NULL) {
    result = emit_patch("lui_ocaml_visible_range",
                        caml_callback3_exn(*dispatch, Val_long(node),
                                           Val_long(first), Val_long(last)));
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_picked(int64_t node, const char *payload) {
  return dispatch_string("lui_ocaml_picked", node, payload);
}

static int dispatch_three_strings(const char *name, int64_t node,
                                  const char *a, const char *b) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value(name);
  if (dispatch != NULL && a != NULL && b != NULL) {
    CAMLparam0();
    CAMLlocal3(a_value, b_value, callback_result);
    a_value = caml_copy_string(a);
    b_value = caml_copy_string(b);
    callback_result = caml_callback3_exn(*dispatch, Val_long(node),
                                         a_value, b_value);
    result = emit_patch(name, callback_result);
    CAMLdrop;
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_extension_event(int64_t node,
                                             const char *name,
                                             const char *values) {
  return dispatch_three_strings("lui_ocaml_extension_event", node, name,
                                values);
}

LUI_EXPORT int32_t lui_ocaml_pump(void) {
  int result = 0;
  caml_leave_blocking_section();
  const value *pump = caml_named_value("lui_ocaml_pump");
  if (pump != NULL) {
    result = emit_patch("lui_ocaml_pump",
                        caml_callback_exn(*pump, Val_unit));
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_platform_event(const char *data,
                                            int32_t length) {
  int result = 0;
  caml_leave_blocking_section();
  const value *handler = caml_named_value("lui_ocaml_platform_event");
  if (handler != NULL && data != NULL) {
    CAMLparam0();
    CAMLlocal2(payload_value, callback_result);
    payload_value = copy_bytes(data, length);
    callback_result = caml_callback_exn(*handler, payload_value);
    result = 1;
    CAMLdrop;
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_stop(void) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispose = caml_named_value("lui_ocaml_dispose");
  if (dispose != NULL) {
    result = emit_patch("lui_ocaml_dispose",
                        caml_callback_exn(*dispose, Val_unit));
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int64_t lui_ocaml_root_node(void) {
  int64_t node = 0;
  caml_leave_blocking_section();
  const value *root = caml_named_value("lui_ocaml_root_node");
  if (root != NULL) {
    value result = caml_callback_exn(*root, Val_unit);
    if (!Is_exception_result(result)) node = Int64_val(result);
  }
  caml_enter_blocking_section();
  return node;
}
