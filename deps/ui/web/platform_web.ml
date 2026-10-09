(* Install browser services before constructing the shared application. *)
external enqueue : (unit -> unit) -> unit = "queueMicrotask" [@@mel.scope "globalThis"]

(* document state (theme dataset/classes, lang) — mirrors the web
   implementations in src/core/web_dom.ml; kept local because this
   library is the platform boundary and must not depend on shared src. *)
let doc_set_data : string -> string -> unit =
  [%mel.raw "function (k, v) { document.documentElement.setAttribute('data-' + k, v) }"]

let doc_add_class : string -> unit =
  [%mel.raw "function (c) { document.documentElement.classList.add(c) }"]

let doc_rm_class : string -> unit =
  [%mel.raw "function (c) { document.documentElement.classList.remove(c) }"]

let body_add_class : string -> unit =
  [%mel.raw "function (c) { document.body.classList.add(c) }"]

let body_rm_class : string -> unit =
  [%mel.raw "function (c) { document.body.classList.remove(c) }"]

let doc_set_lang : string -> unit =
  [%mel.raw "function (l) { document.documentElement.lang = l }"]

let body_rm_data : string -> unit =
  [%mel.raw "function (k) { document.body.removeAttribute('data-' + k) }"]

let prefers_dark : unit -> bool =
  [%mel.raw
    "function () { return window.matchMedia('(prefers-color-scheme: \
     dark)').matches }"]

external add_document_listener : string -> (Js.Json.t -> unit) -> unit =
  "addEventListener" [@@mel.scope "document"]

(* theme preference: reads/writes the raw cljs-quoted storage keys,
   callers see only semantic values *)
let theme_mode () =
  let system =
    match Platform.local_storage_get "system-theme?" with
    | Some v -> Platform.storage_unquote v = "true"
    | None -> Platform.desktop_os ()
  in
  if system then "system"
  else
    match Platform.local_storage_get "theme" with
    | Some v -> (match Platform.storage_unquote v with "dark" -> "dark" | _ -> "light")
    | None -> "light"

let theme_set_system_pref v =
  Platform.local_storage_set "system-theme?" (if v then "true" else "false")

let theme_set_pref v =
  Platform.local_storage_set "theme" (Platform.storage_quote v)

let theme_apply_dataset effective = doc_set_data "theme" effective

let theme_apply_classes effective =
  if effective = "dark" then begin
    doc_add_class "dark";
    body_add_class "dark-theme";
    body_rm_class "light-theme";
    body_rm_class "white-theme"
  end
  else begin
    doc_rm_class "dark";
    body_rm_class "dark-theme";
    body_add_class "white-theme";
    body_add_class "light-theme"
  end

let on_navigate f =
  Platform.on_hash_change f;
  (* imperative navigation re-dispatched even when the hash repeats *)
  add_document_listener "ls:navigate" (fun _ -> f ())

let on_change = Platform.on_hash_change

let preferred_lang () =
  match Platform.local_storage_get "preferred-language" with
  | Some v -> Platform.storage_unquote v
  | None -> "en"

let set_lang_pref code =
  Platform.local_storage_set "preferred-language" (Platform.storage_quote code)

(* JS Date wall-clock — local_fields/of_fields mirror the host's Date
   getters/constructor (month is 1-12 at this boundary, JS-side 0-11) *)
let local_fields ms : Ui_services.date_fields =
  let d = Js.Date.fromFloat ms in
  { year = int_of_float (Js.Date.getFullYear d)
  ; month = int_of_float (Js.Date.getMonth d) + 1
  ; day = int_of_float (Js.Date.getDate d)
  ; wday = int_of_float (Js.Date.getDay d)
  ; hours = int_of_float (Js.Date.getHours d)
  ; minutes = int_of_float (Js.Date.getMinutes d)
  ; seconds = int_of_float (Js.Date.getSeconds d)
  ; ms = int_of_float (Js.Date.getMilliseconds d)
  }

let of_fields (f : Ui_services.date_fields) =
  (* setMilliseconds returns the adjusted epoch ms; Date.make has no
     milliseconds parameter in the binding *)
  Js.Date.setMilliseconds ~milliseconds:(float_of_int f.ms)
    (Js.Date.make ~year:(float_of_int f.year)
       ~month:(float_of_int (f.month - 1)) ~date:(float_of_int f.day)
       ~hours:(float_of_int f.hours) ~minutes:(float_of_int f.minutes)
       ~seconds:(float_of_int f.seconds) ())

let date_parse s =
  let ms = Js.Date.getTime (Js.Date.fromString s) in
  if Float.is_nan ms then None else Some ms

(* window.__tablerChildren — resources/js/icon-data.js keeps the icon
   children table out of main.js; the closures read the live global so
   test fixtures that set it after install still resolve *)
external children_table_u : Js.Json.t Js.Dict.t Js.Undefined.t
  = "__tablerChildren"
  [@@mel.scope "window"]

external global : < logseq_revision : string Js.Undefined.t > Js.t
  = "globalThis"

(* Browser promise -> portable task (same bridge as cmdk_host). *)
let task_of (p : 'a Js.Promise.t) : 'a Ui_task.t =
  Ui_task.create (fun ~resolve ~reject ->
      ignore
        (Js.Promise.catch
           (fun e ->
             reject
               (Failure
                  (Option.value (Js.Json.stringifyAny e)
                     ~default:"clipboard request failed"));
             Js.Promise.resolve ())
           (Js.Promise.then_ (fun v -> resolve v; Js.Promise.resolve ()) p)))

let install ~request_flush ~dom ~timers ~files =
  if Platform.local_storage_obj = None then
    invalid_arg "Browser local storage is unavailable";
  Ui_services.install
    { storage =
        { get = Platform.local_storage_get
        ; set = Platform.local_storage_set
        ; remove = Platform.local_storage_remove
        }
    ; literal_text = Platform.utf8
    ; request_flush
    ; assert_owner = (fun () -> ())
    ; theme =
        { mode = theme_mode
        ; system_default = Platform.desktop_os
        ; prefers_dark
        ; set_system_pref = theme_set_system_pref
        ; set_theme_pref = theme_set_pref
        ; apply_dataset = theme_apply_dataset
        ; apply_classes = theme_apply_classes
        }
    ; nav =
        { hash = Platform.location_hash
        ; set_hash = Platform.set_location_hash
        ; replace_hash = Platform.replace_url_fragment
        ; back = Platform.history_back
        ; forward = Platform.history_forward
        ; on_change
        ; on_navigate
        ; search = Platform.location_search
        ; query_param = Platform.query_param
        ; hash_query_param = Platform.hash_query_param
        ; decode_uri = Platform.decode_uri
        ; reload = Platform.location_reload
        ; origin = (fun () -> Platform.location_origin)
        ; pathname = (fun () -> Platform.location_pathname)
        }
    ; doc =
        { set_lang = doc_set_lang
        ; preferred_lang
        ; set_lang_pref
        ; set_data = doc_set_data
        ; rm_data = body_rm_data
        ; set_title = Platform.set_document_title
        ; reload = Platform.location_reload
        }
    ; time =
        { now = Js.Date.now
        ; local_fields
        ; of_fields
        ; parse = date_parse
        ; fmt_date = Platform.fmt_time
        }
    ; log = { error = Platform.console_error; info = Platform.console_log
            ; error_message = Platform.console_error }
    ; perf = { mark = Platform.perf_mark }
    ; uri = { encode_component = Platform.encode_uri_component }
    ; clipboard =
        { copy = Platform.copy_to_clipboard
        ; write_text = (fun s -> task_of (Platform.clipboard_write_text s))
        ; read_text = (fun () -> task_of (Platform.clipboard_read_text ()))
        }
    ; session =
        { get = Platform.session_storage_get
        ; set = Platform.session_storage_set
        }
    ; env =
        { publishing = Platform.publishing
        ; dev_build = (fun () -> Platform.dev_build)
        ; rtc_test_mode = Platform.rtc_test_mode
        ; online = Platform.online
        ; is_mac = Platform.is_mac
        ; native_drag = Platform.native_drag
        ; native_block_controls = Platform.native_block_controls
        ; css_transform_icons = Platform.css_transform_icons
        ; edit_units = (fun () -> Platform.edit_units)
        ; random_uuid = Platform.random_uuid
        ; open_url = Platform.open_url
        }
    ; dom
    ; timers
    ; files
    };
  Version.set_revision
    (match Js.Undefined.toOption global##logseq_revision with
     | Some r -> r
     | None -> "");
  Icon_tabler_data.install
    { get =
        (fun name ->
          match Js.Undefined.toOption children_table_u with
          | Some dict -> Option.map Sdk_json.of_js (Js.Dict.get dict name)
          | None -> None)
    ; keys =
        (fun () ->
          match Js.Undefined.toOption children_table_u with
          | Some dict -> Js.Dict.keys dict
          | None -> [||])
    };
  Ui_task.install
    { enqueue
    ; assert_owner = (fun () -> ())
    }
