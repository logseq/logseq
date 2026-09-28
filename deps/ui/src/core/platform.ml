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

external local_storage_get : string -> string option = "getItem"
  [@@mel.scope "localStorage"] [@@mel.return nullable]

external local_storage_set : string -> string -> unit = "setItem"
  [@@mel.scope "localStorage"]

external document_element : Js.Json.t = "document.documentElement"

external set_lang : Js.Json.t -> string -> unit = "lang" [@@mel.set]

let document_set_lang s = set_lang document_element s

external dataset_of : Js.Json.t -> Js.Json.t = "dataset" [@@mel.get]

external dataset_set :
  Js.Json.t -> string -> string -> unit = "" [@@mel.set_index]

let document_set_data name value =
  dataset_set (dataset_of document_element) name value

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

let on_hash_change f =
  add_event_listener "hashchange" (fun _ -> f ())

external add_document_listener :
  string -> (Js.Json.t -> unit) -> unit = "addEventListener"
  [@@mel.scope "document"]

(* CustomEvents dispatched on document do not bubble to window *)
let on_document_event name f = add_document_listener name f

external decode_uri : string -> string = "decodeURIComponent"

external json_parse : string -> Js.Json.t = "parse" [@@mel.scope "JSON"]
external json_prop : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]

(* string field from a JSON payload string (dom-event "payload") *)
let payload_str json key =
  match Js.Json.decodeString (json_prop (json_parse json) key) with
  | Some s -> s
  | None -> ""

let payload_num json key =
  match Js.Json.decodeNumber (json_prop (json_parse json) key) with
  | Some n -> n
  | None -> 0.

(* raw DOM event field, e.g. keydown "key" *)
let event_str ev key =
  match Js.Json.decodeString (json_prop ev key) with
  | Some s -> s
  | None -> ""

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
