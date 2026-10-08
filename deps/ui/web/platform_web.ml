(* Install browser services before constructing the shared application. *)
external enqueue : (unit -> unit) -> unit = "queueMicrotask" [@@mel.scope "globalThis"]

(* document state (theme dataset/classes, lang) — mirrors the web
   implementations in src/core/web_dom.ml; kept local because this
   library is the platform boundary and must not depend on shared src. *)
let doc_set_data : string -> string -> unit =
  [%mel.raw "function (k, v) { document.documentElement.dataset[k] = v }"]

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
  [%mel.raw "function (k) { delete document.body.dataset[k] }"]

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

let install ~request_flush =
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
        }
    ; doc =
        { set_lang = doc_set_lang
        ; preferred_lang
        ; set_lang_pref
        ; set_data = doc_set_data
        ; rm_data = body_rm_data
        ; reload = Platform.location_reload
        }
    };
  Ui_task.install
    { enqueue
    ; assert_owner = (fun () -> ())
    }
