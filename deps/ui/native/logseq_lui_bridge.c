#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <caml/alloc.h>
#include <caml/fail.h>
#include <caml/callback.h>
#include <caml/memory.h>
#include <caml/mlvalues.h>
#include <caml/printexc.h>
#include <caml/signals.h>
#include <caml/startup.h>
#include <caml/threads.h>

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
    /* The default 256KB minor heap forces a stop-the-world collection
       every few thousand allocations — typing bursts allocate heavily
       (snapshot rebuilds, JSON) and stall the main thread. 16MB moves
       collection pressure off the interaction path. Only set when the
       user hasn't provided their own OCAMLRUNPARAM. */
#if defined(_WIN32)
    if (getenv("OCAMLRUNPARAM") == NULL) _putenv_s("OCAMLRUNPARAM", "s=16M");
    /* The Windows OCaml runtime takes UTF-16 argv (char_os = wchar_t). */
    wchar_t *warguments[] = {L"logseq_lui_ocaml", NULL};
    caml_startup((char_os **)warguments);
#else
    setenv("OCAMLRUNPARAM", "s=16M", 0);
    char *arguments[] = {"logseq_lui_ocaml", NULL};
    caml_startup(arguments);
#endif
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

/* Registers a foreign thread (the UI thread) as a domain-0 systhread so
   it may call the lui_ocaml_* entries synchronously — the acquire/release
   pattern inside each entry then serializes it against the OCaml worker
   and OCaml's own systhreads. Returns 1 on success. */
LUI_EXPORT int32_t lui_ocaml_register_current_thread(void) {
  return caml_c_thread_register();
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

LUI_EXPORT int32_t lui_ocaml_press_ex(int64_t node, int32_t modifiers) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value("lui_ocaml_press_ex");
  if (dispatch != NULL) {
    result = emit_patch("lui_ocaml_press_ex",
        caml_callback2_exn(*dispatch, Val_long(node), Val_int(modifiers)));
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_long_press(int64_t node) {
  return dispatch_long("lui_ocaml_long_press", node);
}

static int dispatch_bytes(const char *name, int64_t node,
                          const char *text, int32_t length) {
  if (text == NULL || length < 0) return 0;
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value(name);
  if (dispatch != NULL) {
    CAMLparam0();
    CAMLlocal2(text_value, callback_result);
    text_value = copy_bytes(text, length);
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
  if (text == NULL) return 0;
  return dispatch_bytes("lui_ocaml_text_changed", node, text,
                        (int32_t)strlen(text));
}

LUI_EXPORT int32_t lui_ocaml_text_changed_utf8(int64_t node,
    const char *text, int32_t length) {
  return dispatch_bytes("lui_ocaml_text_changed", node, text, length);
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

/* Pointer-detail exports — mirrors upstream lui's
   platform/native/lui_ocaml_bridge.c LUI_POINTER_DETAIL_EXPORT block.
   Required by lui-gpui (press_detail / context_menu_press are called from
   kinds.rs); pointer_down/up/enter/leave round out the ABI. */
static int dispatch_pointer_detail(const char *name, int64_t node,
                                   double x, double y, int32_t modifiers,
                                   int32_t button,
                                   const char *target_class) {
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value(name);
  if (dispatch != NULL) {
    value argv[6];
    argv[0] = Val_long(node);
    argv[1] = caml_copy_double(x);
    argv[2] = caml_copy_double(y);
    argv[3] = Val_long(modifiers);
    argv[4] = Val_long(button);
    argv[5] = caml_copy_string(target_class != NULL ? target_class : "");
    result = emit_patch(name, caml_callbackN_exn(*dispatch, 6, argv));
  }
  caml_enter_blocking_section();
  return result;
}

#define LUI_POINTER_DETAIL_EXPORT(c_name)                                 \
  LUI_EXPORT int32_t c_name(int64_t node, double x, double y,             \
                            int32_t modifiers, int32_t button,            \
                            const char *target_class) {                   \
    return dispatch_pointer_detail(#c_name, node, x, y, modifiers,        \
                                   button, target_class);                 \
  }

LUI_POINTER_DETAIL_EXPORT(lui_ocaml_press_detail)
LUI_POINTER_DETAIL_EXPORT(lui_ocaml_pointer_down)
LUI_POINTER_DETAIL_EXPORT(lui_ocaml_pointer_up)
LUI_POINTER_DETAIL_EXPORT(lui_ocaml_context_menu_press)

LUI_EXPORT int32_t lui_ocaml_pointer_enter(int64_t node) {
  return dispatch_long("lui_ocaml_pointer_enter", node);
}

LUI_EXPORT int32_t lui_ocaml_pointer_leave(int64_t node) {
  return dispatch_long("lui_ocaml_pointer_leave", node);
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

LUI_EXPORT int32_t lui_ocaml_load(int64_t node) {
  return dispatch_long("lui_ocaml_load", node);
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
  if (payload == NULL) return 0;
  return dispatch_bytes("lui_ocaml_picked", node, payload,
                        (int32_t)strlen(payload));
}

LUI_EXPORT int32_t lui_ocaml_picked_utf8(int64_t node,
    const char *payload, int32_t length) {
  return dispatch_bytes("lui_ocaml_picked", node, payload, length);
}

LUI_EXPORT int32_t lui_ocaml_extension_event_utf8(int64_t node,
    const char *identifier, int32_t identifier_length,
    const char *name, int32_t name_length,
    const char *values, int32_t values_length) {
  if (identifier == NULL || identifier_length < 0 || name == NULL ||
      name_length < 0 || values == NULL || values_length < 0) return 0;
  int result = 0;
  caml_leave_blocking_section();
  const value *dispatch = caml_named_value("lui_ocaml_extension_event");
  if (dispatch != NULL) {
    CAMLparam0();
    CAMLlocal4(identifier_value, name_value, values_value, callback_result);
    identifier_value = copy_bytes(identifier, identifier_length);
    name_value = copy_bytes(name, name_length);
    values_value = copy_bytes(values, values_length);
    value arguments[] = { Val_long(node), identifier_value, name_value, values_value };
    callback_result = caml_callbackN_exn(*dispatch, 4, arguments);
    result = emit_patch("lui_ocaml_extension_event", callback_result);
    CAMLdrop;
  }
  caml_enter_blocking_section();
  return result;
}

LUI_EXPORT int32_t lui_ocaml_extension_event(int64_t node,
                                             const char *identifier,
                                             const char *name,
                                             const char *values) {
  if (identifier == NULL || name == NULL || values == NULL) return 0;
  return lui_ocaml_extension_event_utf8(node,
      identifier, (int32_t)strlen(identifier), name, (int32_t)strlen(name),
      values, (int32_t)strlen(values));
}

LUI_EXPORT int32_t lui_ocaml_resync(void) {
  return dispatch_long("lui_ocaml_resync", 0);
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
    /* The OCaml side returns a plain tagged int — Long_val, not
       Int64_val (which would dereference the immediate as a custom
       block pointer and segfault). */
    if (!Is_exception_result(result) && Is_long(result))
      node = Long_val(result);
  }
  caml_enter_blocking_section();
  return node;
}

/* ---------- web-external shims -------------------------------------------
   Shared (melange) sources copied into the native library declare
   `external` names the browser provides. On native the C linker still
   needs the symbol:

   - atob: actually called (rtc_flows JWT decode) — real base64 decode.
   - require / loadDictFile / loadIconNames: lazy-asset loaders; on
     native all dicts and icon names are compiled in, so they must never
     run — fail loudly if reached. */

static const char b64_alphabet[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static int b64_val(char c) {
  const char *p = strchr(b64_alphabet, c);
  return p == NULL ? -1 : (int)(p - b64_alphabet);
}

value atob(value input) {
  CAMLparam1(input);
  CAMLlocal1(out);
  mlsize_t n = caml_string_length(input);
  const char *src = String_val(input);
  /* output ≤ n*3/4 + slack for '=' handling */
  char *buf = malloc(n + 1);
  if (buf == NULL) caml_failwith("atob: oom");
  mlsize_t w = 0;
  for (mlsize_t i = 0; i < n;) {
    int vals[4] = {0, 0, 0, 0};
    int pad = 0;
    for (int k = 0; k < 4; k++) {
      if (i >= n) {
        pad = 4 - k;
        vals[k] = 0;
      } else if (src[i] == '=') {
        pad++;
        vals[k] = 0;
        i++;
      } else {
        int v = b64_val(src[i]);
        if (v < 0) { free(buf); caml_failwith("atob: bad base64"); }
        vals[k] = v;
        i++;
      }
    }
    buf[w++] = (char)((vals[0] << 2) | (vals[1] >> 4));
    if (pad < 2) buf[w++] = (char)((vals[1] << 4) | (vals[2] >> 2));
    if (pad < 1) buf[w++] = (char)((vals[2] << 6) | vals[3]);
  }
  out = caml_alloc_initialized_string(w, buf);
  free(buf);
  CAMLreturn(out);
}

value require(value arg) {
  caml_failwith("require: lazy-asset chunks are web-only on native");
  return Val_unit;
}

value loadDictFile(value arg, value name) {
  caml_failwith("loadDictFile: dicts are compiled in on native");
  return Val_unit;
}

value loadIconNames(value arg) {
  caml_failwith("loadIconNames: icon names are compiled in on native");
  return Val_unit;
}
