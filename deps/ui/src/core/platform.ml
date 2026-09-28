(* Browser platform helpers: document/window access outside LUI's
   abstraction (boot mounting, hash routing, localStorage, globals the
   e2e contract requires). *)

module W = Webapi.Dom

external document_ : W.Document.t = "document"
external location_ : Js.Json.t = "location"

type loc

external location_obj : loc = "location"

external hash_of : loc -> string = "hash" [@@mel.get]

let location_hash () = hash_of location_obj

external set_hash : loc -> string -> unit = "hash" [@@mel.set]

let set_location_hash s = set_hash location_obj s

external search_of : loc -> string = "search" [@@mel.get]

let location_search () = search_of location_obj

external get_element_by_id : string -> W.Element.t option
  = "getElementById" [@@mel.scope "document"] [@@mel.return nullable]

external local_storage_obj : Js.Json.t option = "localStorage"
  [@@mel.scope "globalThis"] [@@mel.return nullable]

external ls_get_item : Js.Json.t -> string -> string option = "getItem"
  [@@mel.send] [@@mel.return nullable]

external ls_set_item : Js.Json.t -> string -> string -> unit = "setItem"
  [@@mel.send]

external ls_remove_item : Js.Json.t -> string -> unit = "removeItem"
  [@@mel.send]

(* localStorage is absent outside the browser (node test runner) *)
let local_storage_get k =
  match local_storage_obj with
  | Some s -> ls_get_item s k
  | None -> None

let local_storage_set k v =
  match local_storage_obj with Some s -> ls_set_item s k v | None -> ()

let local_storage_remove k =
  match local_storage_obj with Some s -> ls_remove_item s k | None -> ()

external document_element : Js.Json.t = "document.documentElement"
external document_body : Js.Json.t = "document.body"

external set_lang : Js.Json.t -> string -> unit = "lang" [@@mel.set]

let document_set_lang s = set_lang document_element s

external dataset_of : Js.Json.t -> Js.Json.t = "dataset" [@@mel.get]

external dataset_set :
  Js.Json.t -> string -> string -> unit = "" [@@mel.set_index]

(* generic object field set, e.g. el.style.visibility *)
external set_prop : Js.Json.t -> string -> Js.Json.t -> unit = ""
  [@@mel.set_index]

let document_set_data name value =
  dataset_set (dataset_of document_element) name value

let body_set_data name value =
  dataset_set (dataset_of document_body) name value

let body_rm_data : string -> unit =
  [%mel.raw "function (k) { delete document.body.dataset[k] }"]

let root_add_class : string -> unit =
  [%mel.raw "function (c) { document.documentElement.classList.add(c) }"]

let root_rm_class : string -> unit =
  [%mel.raw "function (c) { document.documentElement.classList.remove(c) }"]

let body_add_class : string -> unit =
  [%mel.raw "function (c) { document.body.classList.add(c) }"]

let body_rm_class : string -> unit =
  [%mel.raw "function (c) { document.body.classList.remove(c) }"]

external console_log : 'a -> unit = "log" [@@mel.scope "console"]
external console_error : 'a -> unit = "error" [@@mel.scope "console"]

external error_message :
  Js.Promise.error -> string Js.Nullable.t = "message" [@@mel.get]

(* Melange wraps JS rejections as Js.Exn.Error whose payload is the real
   error in field _1 *)
external error_inner : Js.Promise.error -> 'a = "_1" [@@mel.get]

external add_event_listener :
  string -> (Js.Json.t -> unit) -> unit = "addEventListener"
  [@@mel.scope "window"]

type url_search_params

external new_url_search_params : string -> url_search_params
  = "URLSearchParams" [@@mel.new]

external search_params_get :
  url_search_params -> string -> string option = "get"
  [@@mel.send] [@@mel.return nullable]

let query_param name =
  match location_search () with
  | "" -> None
  | search -> search_params_get (new_url_search_params search) name

(* query param inside the location hash: "#/page/x?graph-id=u" *)
let hash_query_param name =
  match location_hash () with
  | "" -> None
  | h -> (
      match String.index_opt h '?' with
      | Some i ->
          search_params_get
            (new_url_search_params
               (String.sub h (i + 1) (String.length h - i - 1)))
            name
      | None -> None)

(* rewrite the hash in place (no history entry, no hashchange) *)
external replace_state :
  Js.Json.t -> string -> string -> unit = "replaceState"
  [@@mel.scope "history"]

let replace_url_fragment hash = replace_state Js.Json.null "" hash

let on_hash_change f =
  add_event_listener "hashchange" (fun _ -> f ())

external history_back : unit -> unit = "back" [@@mel.scope "history"]
external history_forward : unit -> unit = "forward" [@@mel.scope "history"]

external clipboard_write_text : string -> unit Js.Promise.t = "writeText"
  [@@mel.scope "navigator.clipboard"]

let copy_to_clipboard s = ignore (clipboard_write_text s)

external add_document_listener :
  string -> (Js.Json.t -> unit) -> unit = "addEventListener"
  [@@mel.scope "document"]

(* CustomEvents dispatched on document do not bubble to window *)
let on_document_event name f = add_document_listener name f

external decode_uri : string -> string = "decodeURIComponent"

external js_escape : string -> string = "escape"

(* OCaml source literals hold UTF-8 bytes; Melange hands them to JS as a
   byte-string so non-ASCII renders mojibake. Percent-encode each byte then
   UTF-8 decode to obtain the real JS string. Only safe for literals — worker
   (transit-decoded) strings are already proper JS strings and would throw. *)
let utf8 s = decode_uri (js_escape s)

external navigator_ : Js.Json.t = "navigator"
external navigator_platform : Js.Json.t -> string = "platform" [@@mel.get]

external clipboard_write_text : string -> unit = "writeText"
  [@@mel.scope ("navigator", "clipboard")]

(* cljs (or util/mac? util/win32?) — goog platform detection *)
let desktop_os () =
  let p = String.lowercase_ascii (navigator_platform navigator_) in
  let n = String.length p in
  let rec contains i sub =
    let m = String.length sub in
    i + m <= n && (String.sub p i m = sub || contains (i + 1) sub)
  in
  contains 0 "mac" || contains 0 "win"

(* cljs util/mac? — goog.userAgent MAC *)
let is_mac () =
  let p = String.lowercase_ascii (navigator_platform navigator_) in
  let n = String.length p in
  let rec go i =
    i + 3 <= n && (String.sub p i 3 = "mac" || go (i + 1))
  in
  go 0

external json_parse : string -> Js.Json.t = "parse" [@@mel.scope "JSON"]
external json_prop : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]

(* string field from a JSON payload string (dom-event "payload") *)
let payload_str json key =
  match Js.Json.decodeString (json_prop (json_parse json) key) with
  | Some s -> s
  | None -> ""

let payload_bool json key =
  match Js.Json.decodeBoolean (json_prop (json_parse json) key) with
  | Some b -> b
  | None -> false

let payload_num json key =
  match Js.Json.decodeNumber (json_prop (json_parse json) key) with
  | Some n -> n
  | None -> 0.

(* raw DOM event field, e.g. keydown "key" *)
let event_str ev key =
  match Js.Json.decodeString (json_prop ev key) with
  | Some s -> s
  | None -> ""

let event_bool ev key =
  Js.Json.decodeBoolean (json_prop ev key) = Some true

let rtc_test_mode () =
  match query_param "rtc-test" with Some "true" -> true | _ -> false

external random_uuid : unit -> string = "randomUUID"
  [@@mel.scope "crypto"]

(* dispatch a DOM CustomEvent on document — cross-area comms *)
external custom_event : string -> Js.Json.t -> Js.Json.t = "CustomEvent"
  [@@mel.new]

external dispatch_event : Js.Json.t -> unit = "document.dispatchEvent"

let dispatch name detail =
  dispatch_event
    (custom_event name
       (Js.Json.object_ (Js.Dict.fromList [ ("detail", detail) ])))

external query_selector_all : string -> Js.Json.t array
  = "querySelectorAll" [@@mel.scope "document"]

external get_attribute : Js.Json.t -> string -> string option
  = "getAttribute" [@@mel.send] [@@mel.return nullable]

(* uuid list of .ls-block.selected blocks, in DOM order *)
let selected_block_uuids () =
  query_selector_all ".ls-block.selected"
  |> Array.to_list
  |> List.filter_map (fun el -> get_attribute el "blockid")
