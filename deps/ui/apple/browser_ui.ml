(* Native twin of graphs/browser_ui.ml — file pickers + downloads go
   through host requests; document queries return None. *)

open Promise_ext
module E = Webapi.Dom.Element

type rect = Js.Json.t
type el = E.t

let el_counter = ref 0
let new_el () = incr el_counter; !el_counter

let qs (_ : string) : el option = None
let qs_in (_ : el) (_ : string) : el option = None
let create (_ : string) : el = new_el ()
let append (_ : el) (_ : el) : unit = ()
let remove (_ : el) : unit = ()
let set_attr (_ : el) (_ : string) (_ : string) : unit = ()
let get_attr (_ : el) (_ : string) : string option = None
let set_text (_ : el) (_ : string) : unit = ()
let set_class (_ : el) (_ : string) : unit = ()
let inner_html_set (_ : el) (_ : string) : unit = ()
let remove_attr (_ : el) (_ : string) : unit = ()
let add_class (_ : el) (_ : string) : unit = ()
let rm_class (_ : el) (_ : string) : unit = ()
let focus (_ : el) : unit = ()
let value (_ : el) : string = ""
let set_value (_ : el) (_ : string) : unit = ()
let click (_ : el) : unit = ()

(* The macOS shell shows no window title — the breadcrumb carries the
   page name in the toolbar. Keep the dom-op out so "Logseq" never
   renders in the titlebar. *)
let set_document_title (_ : string) : unit = ()

let add_listener (_ : el) (name : string) (f : Js.Json.t -> unit)
    : unit =
  Platform.add_event_listener name f

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

let rect_of (_ : el) : rect = Js.Json.JObject []

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

let fmt_time (_ : float) : string = ""

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
