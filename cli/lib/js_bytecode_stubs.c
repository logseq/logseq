#include <caml/alloc.h>
#include <caml/fail.h>
#include <caml/mlvalues.h>

CAMLprim value caml_js_from_string(value string) { return string; }

CAMLprim value caml_js_to_string(value value) { return value; }

CAMLprim value caml_js_var(value name) {
  caml_failwith("JavaScript global lookup is unavailable outside wasm");
}

CAMLprim value caml_js_get(value object, value field) {
  caml_failwith("JavaScript property access is unavailable outside wasm");
}

CAMLprim value caml_js_fun_call(value fn, value args) {
  caml_failwith("JavaScript function call is unavailable outside wasm");
}

CAMLprim value caml_js_meth_call(value object, value method_name, value args) {
  caml_failwith("JavaScript method call is unavailable outside wasm");
}

CAMLprim value caml_js_new(value constructor, value args) {
  caml_failwith("JavaScript object construction is unavailable outside wasm");
}

CAMLprim value caml_js_object(value fields) {
  caml_failwith("JavaScript object construction is unavailable outside wasm");
}

CAMLprim value caml_js_wrap_callback(value callback) { return callback; }

CAMLprim value caml_js_eval_string(value source) {
  caml_failwith("JavaScript eval is unavailable outside wasm");
}
