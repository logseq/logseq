(* Imperative DOM/browser helpers for the graphs/dialogs/settings areas.
   Views that cannot be expressed through LUI (file inputs, downloads,
   imperative host mounts) go through these. *)

module E = Webapi.Dom.Element

external qs : string -> E.t option = "querySelector"
  [@@mel.scope "document"] [@@mel.return nullable]

external qs_in : E.t -> string -> E.t option = "querySelector"
  [@@mel.send] [@@mel.return nullable]

external create : string -> E.t = "createElement" [@@mel.scope "document"]
external append : E.t -> E.t -> unit = "appendChild" [@@mel.send]
external remove : E.t -> unit = "remove" [@@mel.send]

external set_attr : E.t -> string -> string -> unit = "setAttribute"
  [@@mel.send]

external get_attr : E.t -> string -> string option = "getAttribute"
  [@@mel.send] [@@mel.return nullable]

let set_document_title : string -> unit =
  [%mel.raw "function (t) { document.title = t }"]

external remove_attr : E.t -> string -> unit = "removeAttribute"
  [@@mel.send]

external set_text : E.t -> string -> unit = "textContent" [@@mel.set]

external inner_html_set : E.t -> string -> unit = "innerHTML" [@@mel.set]
external set_class : E.t -> string -> unit = "className" [@@mel.set]

let add_class : E.t -> string -> unit =
  [%mel.raw "function (e, c) { e.classList.add(c) }"]

let rm_class : E.t -> string -> unit =
  [%mel.raw "function (e, c) { e.classList.remove(c) }"]

external add_listener : E.t -> string -> (Js.Json.t -> unit) -> unit =
  "addEventListener" [@@mel.send]

external on_document : string -> (Js.Json.t -> unit) -> unit =
  "addEventListener" [@@mel.scope "document"]

external set_timeout : (unit -> unit) -> int -> int = "setTimeout"
  [@@mel.scope "window"]

external clear_timeout : int -> unit = "clearTimeout" [@@mel.scope "window"]

external focus : E.t -> unit = "focus" [@@mel.send]
external click : E.t -> unit = "click" [@@mel.send]
external value : E.t -> string = "value" [@@mel.get]
external confirm : string -> bool = "confirm" [@@mel.scope "window"]
external open_url : string -> unit = "open" [@@mel.scope "window"]
external location_origin : unit -> string = "origin" [@@mel.scope "location"]
external location_pathname : unit -> string = "pathname"
  [@@mel.scope "location"]
external reload_page : unit -> unit = "reload" [@@mel.scope "location"]

type rect

external rect_of : E.t -> rect = "getBoundingClientRect" [@@mel.send]
external rect_left : rect -> float = "left" [@@mel.get]
external rect_top : rect -> float = "top" [@@mel.get]
external rect_bottom : rect -> float = "bottom" [@@mel.get]
external rect_right : rect -> float = "right" [@@mel.get]
external make_date : float -> Js.Json.t = "Date" [@@mel.new]
external date_to_string : Js.Json.t -> string = "toLocaleString" [@@mel.send]
(* cljs i18n/locale-format-date: d.toLocaleDateString(locale,
   {year numeric, month short, day numeric}) e.g. "Sep 28, 2026";
   undefined locale = runtime default *)
let date_to_localedate : Js.Json.t -> string =
  [%mel.raw
    "function (d) { return d.toLocaleDateString(undefined, \
     { year: 'numeric', month: 'short', day: 'numeric' }) }"]

let prefers_dark : unit -> bool =
  [%mel.raw
    "function () { return window.matchMedia('(prefers-color-scheme: \
     dark)').matches }"]

(* -- files -- *)
(* 'a so both Webapi Dom.element and the abstract Editor_dom.el work *)
let files_of : 'a -> Js.Json.t array =
  [%mel.raw "function (el) { return Array.from(el.files || []) }"]

external file_name : Js.Json.t -> string = "name" [@@mel.get]
external file_size : Js.Json.t -> float = "size" [@@mel.get]
external file_text : Js.Json.t -> string Js.Promise.t = "text" [@@mel.send]

external file_buffer :
  Js.Json.t -> Js.Typed_array.ArrayBuffer.t Js.Promise.t =
  "arrayBuffer" [@@mel.send]

(* -- blob download -- *)
external make_blob : Js.Json.t array -> Js.Json.t -> Webapi.Blob.t =
  "Blob" [@@mel.new]

external from_entries : Js.Json.t -> Js.Json.t =
  "fromEntries" [@@mel.scope "Object"]

external pairs_json : (string * Js.Json.t) array -> Js.Json.t =
  "%identity"

(* tuples compile to JS pairs, so an OCaml (k*v) array is iterable *)
let json_props pairs = from_entries (pairs_json (Array.of_list pairs))

external str_to_json : string -> Js.Json.t = "%identity"
external u8_to_json : Js.Typed_array.Uint8Array.t -> Js.Json.t = "%identity"

external blob_to_file : Webapi.Blob.t -> Webapi.File.t = "%identity"

let download_blob ~filename ~mime payload_u8 =
  let blob =
    make_blob [| u8_to_json payload_u8 |]
      (json_props [ ("type", str_to_json mime) ])
  in
  let url = Webapi.Url.createObjectURL (blob_to_file blob) in
  let a = create "a" in
  set_attr a "href" url;
  set_attr a "download" filename;
  (match qs "body" with Some b -> append b a | None -> ());
  click a;
  ignore
    (set_timeout
       (fun () ->
         remove a;
         Webapi.Url.revokeObjectURL url)
       0)

let binary_to_u8 s =
  let u8 = Js.Typed_array.Uint8Array.fromLength (String.length s) in
  String.iteri
    (fun i c -> Js.Typed_array.Uint8Array.unsafe_set u8 i (Char.code c))
    s;
  u8

let download_binary ~filename ~mime payload =
  download_blob ~filename ~mime (binary_to_u8 payload)

let download_text ~filename ~mime text =
  download_binary ~filename ~mime text

let u8_of_buffer buf =
  let u8 = Js.Typed_array.Uint8Array.fromBuffer buf () in
  let n = Js.Typed_array.Uint8Array.length u8 in
  let out = Bytes.create n in
  for i = 0 to n - 1 do
    Bytes.set out i
      (Char.chr (Js.Typed_array.Uint8Array.unsafe_get u8 i land 0xff))
  done;
  Bytes.unsafe_to_string out

let now_ms () = Js.Date.now ()
let fmt_time ms = date_to_localedate (make_date ms)

(* 5s auto-dismiss helper shared by toasts *)
let later ?(ms = 5000) f = ignore (set_timeout f ms)
