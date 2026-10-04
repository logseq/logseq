(* Native twin of graphs/browser_ui.ml — imperative elements materialize
   as LUI extension nodes via Editor_dom/Imperative_dom, so imperative
   views (graphs, recycle) render through the same element pipeline;
   file pickers + downloads go through host requests. *)

open Promise_ext

(* element handle = LUI element payload (snapshot or {#new} imperative
   node); matches the shared callers' B.E.t annotations *)
module E = struct
  type t = Js.Json.t
end

type rect = Js.Json.t
type el = E.t

type el_ops =
  { qs : string -> el option
  ; qs_in : el -> string -> el option
  ; create : string -> el
  ; append : el -> el -> unit
  ; remove : el -> unit
  ; set_attr : el -> string -> string -> unit
  ; get_attr : el -> string -> string option
  ; set_text : el -> string -> unit
  ; set_class : el -> string -> unit
  ; remove_attr : el -> string -> unit
  ; add_class : el -> string -> unit
  ; rm_class : el -> string -> unit
  ; focus : el -> unit
  ; value : el -> string
  ; set_value : el -> string -> unit
  ; click : el -> unit
  ; add_listener : el -> string -> (Js.Json.t -> unit) -> unit
  }

(* imperative_dom sits above this module (it calls Runtime, which calls
   here), so the element ops can't be linked in directly — editor_dom
   installs them at init, the same hook pattern it uses for
   Imperative_dom.lui_snapshot_by_node_id *)
let el_ops : el_ops option ref = ref None

let ops () =
  match !el_ops with
  | Some o -> o
  | None -> invalid_arg "Browser_ui.el_ops not installed"

let qs (sel : string) : el option = (ops ()).qs sel

let qs_in (root : el) (sel : string) : el option = (ops ()).qs_in root sel

let create (tag : string) : el = (ops ()).create tag

let append (parent : el) (child : el) : unit = (ops ()).append parent child

let remove (el : el) : unit = (ops ()).remove el

let set_attr (el : el) (name : string) (v : string) : unit =
  (ops ()).set_attr el name v

let get_attr (el : el) (name : string) : string option =
  (ops ()).get_attr el name

let set_text (el : el) (v : string) : unit = (ops ()).set_text el v

let set_class (el : el) (c : string) : unit = (ops ()).set_class el c

let inner_html_set (el : el) (v : string) : unit = (ops ()).set_text el v

let remove_attr (el : el) (name : string) : unit =
  (ops ()).remove_attr el name

let add_class (el : el) (c : string) : unit = (ops ()).add_class el c

let rm_class (el : el) (c : string) : unit = (ops ()).rm_class el c

let focus (el : el) : unit = (ops ()).focus el
let value (el : el) : string = (ops ()).value el
let set_value (el : el) (v : string) : unit = (ops ()).set_value el v
let click (el : el) : unit = (ops ()).click el

(* The macOS shell shows no window title — the breadcrumb carries the
   page name in the toolbar. Keep the dom-op out so "Logseq" never
   renders in the titlebar. *)
let set_document_title (_ : string) : unit = ()

let add_listener (el : el) (name : string) (f : Js.Json.t -> unit)
    : unit =
  (ops ()).add_listener el name f

let on_document (name : string) (f : Js.Json.t -> unit) : unit =
  Platform.add_event_listener name f

let set_timeout (f : unit -> unit) (ms : int) : int =
  Host.set_timeout f ms

let clear_timeout (id : int) : unit = Host.clear_timeout id

let later ~(ms : int) (f : unit -> unit) : unit =
  ignore (Host.set_timeout f ms)

let open_url (u : string) : unit = Host.open_url u
let location_origin () : string = "logseq://app"
let location_pathname () : string = "/"
let reload_page () : unit = ()

let rect_of (el : el) : rect = Dom_ext.bounding_rect el

let rect_left (r : rect) : float = Dom_ext.rect_left r
let rect_bottom (r : rect) : float = Dom_ext.rect_bottom r
let rect_top (r : rect) : float = Dom_ext.rect_top r
let rect_width (r : rect) : float = Dom_ext.rect_width r
let rect_right (r : rect) : float = Dom_ext.rect_right r

let prefers_dark () : bool = Host.prefers_dark ()

let make_date (ms : float) : Js.Json.t = Js.Json.JNumber ms
let date_to_string (_ : Js.Json.t) : string = ""
let date_to_localedate (_ : Js.Json.t) : string = ""

let json_props (pairs : (string * Js.Json.t) list) : Js.Json.t =
  Js.Json.object_list pairs
let str_to_json (s : string) : Js.Json.t = Js.Json.JString s
let u8_to_json (_ : Js.Typed_array.Uint8Array.t) : Js.Json.t =
  Js.Json.JNull
let from_entries (j : Js.Json.t) : Js.Json.t = j
let pairs_json (a : (string * Js.Json.t) array) : Js.Json.t =
  Js.Json.JObject (Array.to_list a)
let make_blob (_ : Js.Json.t array) (_ : Js.Json.t) : Webapi.Blob.t = 0
let blob_to_file (b : Webapi.Blob.t) : Webapi.File.t = b
let u8_of_buffer (_ : Js.Typed_array.ArrayBuffer.t) : string = ""
let file_text (_ : Js.Json.t) : string Js.Promise.t =
  Js.Promise.resolve ""

(* ---- downloads / picks ---- *)

let b64_encode (data : string) : string =
  let tbl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" in
  let b = Buffer.create (String.length data * 4 / 3 + 4) in
  let n = String.length data in
  let i = ref 0 in
  while !i < n do
    let a = Char.code data.[!i] in
    let b2 = if !i + 1 < n then Char.code data.[!i + 1] else 0 in
    let c = if !i + 2 < n then Char.code data.[!i + 2] else 0 in
    Buffer.add_char b tbl.[a lsr 2];
    Buffer.add_char b tbl.[((a land 3) lsl 4) lor (b2 lsr 4)];
    Buffer.add_char b
      (if !i + 1 < n then tbl.[((b2 land 15) lsl 2) lor (c lsr 6)] else '=');
    Buffer.add_char b
      (if !i + 2 < n then tbl.[c land 63] else '=');
    i := !i + 3
  done;
  Buffer.contents b

let binary_to_u8 (s : string) : Js.Typed_array.Uint8Array.t =
  Bytes.of_string s

let download_text ~(filename : string) ~(mime : string)
    (text : string) : unit =
  Host.dom_op "download-text"
    (Js.Json.stringify
       (Js.Json.JObject
          [ ("name", Js.Json.JString filename)
          ; ("mime", Js.Json.JString mime)
          ; ("text", Js.Json.JString text) ]))

let download_binary ~(filename : string) ~(mime : string)
    (data : string) : unit =
  Host.dom_op "download-binary"
    (Printf.sprintf "%s\n%s\n%s" filename mime (b64_encode data))

let confirm (_ : string) : bool = false

let fmt_time (ms : float) : string = Dates.short_date_of_ts ms

(* file inputs / drag-drop payloads — JSON File snapshots carry
   {name,size,path} the host fills in *)
(* native file selection goes through the host's NSOpenPanel dom-event
   (carries real paths), not <input type=file> — files_of on an opaque
   element yields nothing *)
let files_of (_ : 'a) : Js.Json.t array = [||]

let file_name (f : Js.Json.t) : string =
  match Dom_ext.str_prop "name" f with
  | Some s -> s
  | None -> ""

let file_size (f : Js.Json.t) : float =
  Option.value (Dom_ext.num_prop "size" f) ~default:0.

let file_buffer (f : Js.Json.t) : Js.Typed_array.Uint8Array.t Js.Promise.t =
  match Dom_ext.str_prop "path" f with
  | Some path -> (
      try
        let ic = open_in_bin path in
        let n = in_channel_length ic in
        let b = Bytes.of_string (really_input_string ic n) in
        close_in ic;
        Js.Promise.resolve b
      with e -> Js.Promise.reject e)
  | None -> Js.Promise.resolve (Bytes.create 0)

let now_ms () : float = Js.Date.now ()
