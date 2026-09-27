(* Browser platform helpers: document/window access outside LUI's
   abstraction (boot mounting, hash routing, localStorage, globals the
   e2e contract requires). *)

module W = Webapi.Dom

external window : Js.Json.t = "window"
external document_ : W.Document.t = "document"
external location_ : Js.Json.t = "location"

external location_hash : unit -> string = "hash"
  [@@mel.scope "location"]

type loc

external location_obj : loc = "location"

external set_hash : loc -> string -> unit = "hash" [@@mel.set]

let set_location_hash s = set_hash location_obj s

external location_search : unit -> string = "search"
  [@@mel.scope "location"]

external get_element_by_id : string -> W.Element.t option
  = "getElementById" [@@mel.scope "document"] [@@mel.return nullable]

external local_storage_get : string -> string option = "getItem"
  [@@mel.scope "localStorage"] [@@mel.return nullable] [@@mel.send]

external local_storage_set : string -> string -> unit = "setItem"
  [@@mel.scope "localStorage"] [@@mel.send]

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

let rtc_test_mode () =
  match query_param "rtc-test" with Some "true" -> true | _ -> false

external random_uuid : unit -> string = "randomUUID"
  [@@mel.scope "crypto"]

(* dispatch a DOM CustomEvent on document — cross-area comms *)
external custom_event : string -> Js.Json.t -> Js.Json.t = "CustomEvent"
  [@@mel.new]

external dispatch_event : Js.Json.t -> unit = "dispatchEvent"
  [@@mel.scope "document"] [@@mel.send]

let dispatch name detail =
  dispatch_event (custom_event name detail)
