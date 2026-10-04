(* Native twin of graphs/browser_ui.ml — file pickers + downloads go
   through host requests; document queries return None. *)

open Promise_ext
module E = Webapi.Dom.Element

type rect = Js.Json.t
type el = E.t

let el_counter = ref 0
let new_el () = incr el_counter; !el_counter

(* ---- file picks ----

   The host's pick-files dom-op answers with a "file-picked" platform
   event {id, files:[{name,path,size}]} followed by a "change" dom-event
   on the input node — the same object shape a browser's el.files
   reports. Picks are stashed keyed by the input's "#id" selector so
   shared code can keep its qs -> files_of pattern: qs resolves a
   selector to a token element and files_of drains the stash.
   (file-picked and the change dispatch run on the same OCaml worker
   queue in emission order, so the stash lands before any handler
   that reads it.) *)

(* picks land stashed by "#id" selector AND in arrival order: the
   host's pick-files answer and the "change" dom-event it emits run on
   the same OCaml worker queue in emission order, so files_of drains
   the oldest pending pick regardless of which selector it is read
   through (matching the web's polymorphic files_of signature) *)
let picked : (string, Js.Json.t array) Hashtbl.t = Hashtbl.create 8
let picked_order : string Queue.t = Queue.create ()
let sel_els : (string, el) Hashtbl.t = Hashtbl.create 8
let el_sel : (el, string) Hashtbl.t = Hashtbl.create 8
(* caller-supplied pick completions keyed by "#id" — hidden inputs
   never mount an element to emit "change", so the file-picked event
   itself fires the subscriber *)
let change_subs : (string, unit -> unit) Hashtbl.t = Hashtbl.create 8

let pick_listener_installed = ref false

let install_pick_listener () =
  if not !pick_listener_installed then begin
    pick_listener_installed := true;
    Platform.add_event_listener "file-picked" (fun payload ->
        match payload with
        | Js.Json.JObject kvs -> (
            match List.assoc_opt "id" kvs, List.assoc_opt "files" kvs with
            | Some (Js.Json.JString id), Some (Js.Json.JArray files) ->
                let sel = "#" ^ id in
                Hashtbl.replace picked sel files;
                Queue.add sel picked_order;
                (match Hashtbl.find_opt change_subs sel with
                 | Some f ->
                     Hashtbl.remove change_subs sel;
                     f ()
                 | None -> ())
            | _ -> ())
        | _ -> ())
  end

(* opens the host's NSOpenPanel for the file input identified by its
   DOM id (webkitdirectory maps to a directory pick) *)
let pick_files ?(accept = "") ?(multiple = false) ?(directory = false)
    ?(on_picked = fun () -> ()) (id : string) : unit =
  Hashtbl.replace change_subs ("#" ^ id) on_picked;
  install_pick_listener ();
  Host.dom_op "pick-files"
    (Js.Json.stringify
       (Js.Json.JObject
          [ "ref", Js.Json.JObject [ "#ref", Js.Json.JString id ]
          ; "accept", Js.Json.JString accept
          ; "multiple", Js.Json.JBoolean multiple
          ; "directory", Js.Json.JBoolean directory ]))

let el_for_sel (sel : string) : el =
  match Hashtbl.find_opt sel_els sel with
  | Some e -> e
  | None ->
      let e = new_el () in
      Hashtbl.replace sel_els sel e;
      Hashtbl.replace el_sel e sel;
      e

let qs (sel : string) : el option =
  install_pick_listener ();
  match Dom_ext.doc_query_selector sel with
  | Some _ -> Some (el_for_sel sel)
  | None when Hashtbl.mem picked sel -> Some (el_for_sel sel)
  | None -> None

let qs_in (_ : el) (sel : string) : el option =
  match Dom_ext.doc_query_selector sel with
  | Some _ -> Some (el_for_sel sel)
  | None -> None
let create (_ : string) : el = new_el ()
let append (_ : el) (_ : el) : unit = ()
let remove (_ : el) : unit = ()

(* registry id for a token el — the selector without its leading "#"
   (dom-op refs resolve against DOM ids, not selector syntax) *)
let ref_id_of (e : el) : string option =
  match Hashtbl.find_opt el_sel e with
  | Some sel ->
      Some
        (if String.length sel > 0 && sel.[0] = '#'
         then String.sub sel 1 (String.length sel - 1)
         else sel)
  | None -> None

let set_attr (el : el) (name : string) (v : string) : unit =
  match ref_id_of el with
  | Some id ->
      Host.dom_op "set-attr"
        (Js.Json.stringify
           (Js.Json.JObject
              [ ("ref", Js.Json.JObject [ "#ref", Js.Json.JString id ])
              ; ("name", Js.Json.JString name)
              ; ("value", Js.Json.JString v) ]))
  | None -> ()
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
let u8_of_buffer (buf : Js.Typed_array.ArrayBuffer.t) : string =
  Bytes.to_string buf

let read_path (path : string) : string =
  let ic = open_in_bin path in
  let n = in_channel_length ic in
  let s = really_input_string ic n in
  close_in ic;
  s

let file_text (f : Js.Json.t) : string Js.Promise.t =
  match Dom_ext.str_prop "path" f with
  | Some path -> (try Js.Promise.resolve (read_path path)
                  with e -> Js.Promise.reject e)
  | None -> Js.Promise.resolve ""

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

(* cljs t/now into a filename-safe stamp *)
let fmt_time (ms : float) : string =
  let t = Unix.localtime (ms /. 1000.) in
  Printf.sprintf "%04d%02d%02d_%02d%02d%02d"
    (t.Unix.tm_year + 1900)
    (t.Unix.tm_mon + 1)
    t.Unix.tm_mday t.Unix.tm_hour t.Unix.tm_min t.Unix.tm_sec

(* file inputs / drag-drop payloads — JSON File snapshots carry
   {name,size,path} the host fills in *)
(* web signature is polymorphic ('a) — callers pass element snapshots
   of differing types on each platform; the FIFO above is what
   actually resolves a pick *)
let files_of (_ : 'a) : Js.Json.t array =
  match Queue.take_opt picked_order with
  | Some sel -> (
      match Hashtbl.find_opt picked sel with
      | Some files ->
          Hashtbl.remove picked sel;
          files
      | None -> [||])
  | None -> [||]

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
