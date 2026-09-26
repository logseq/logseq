(* Port of src/electron/electron/logger.cljs — thin wrappers over
   electron-log; the cljs file also registered a glogi handler that
   forwarded {:level :message :exception} records here. *)

external log_debug : 'a array -> unit = "debug"
  [@@mel.module "electron-log"] [@@mel.variadic]

external log_info : 'a array -> unit = "info"
  [@@mel.module "electron-log"] [@@mel.variadic]

external log_warn : 'a array -> unit = "warn"
  [@@mel.module "electron-log"] [@@mel.variadic]

external log_error : 'a array -> unit = "error"
  [@@mel.module "electron-log"] [@@mel.variadic]

(* glogi's variadic fns accepted keyword/map/seq args which it printed;
   Js.Json.stringifyAny keeps arbitrary JS/EDN-shaped values readable. *)
let js_str (v : 'a) : string =
  match Js.Json.stringifyAny v with
  | Some s -> s
  | None -> Js.String.make v

let stringify_args args = Array.map js_str args

let debug_args args = log_debug (stringify_args args)
let info_args args = log_info (stringify_args args)
let warn_args args = log_warn (stringify_args args)
let error_args args = log_error (stringify_args args)

let debug fmt = Printf.ksprintf (fun s -> log_debug [| s |]) fmt
let info fmt = Printf.ksprintf (fun s -> log_info [| s |]) fmt
let warn fmt = Printf.ksprintf (fun s -> log_warn [| s |]) fmt
let error fmt = Printf.ksprintf (fun s -> log_error [| s |]) fmt
