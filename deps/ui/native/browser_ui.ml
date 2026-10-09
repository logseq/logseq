(* Native twin of graphs/browser_ui.ml — file pickers + downloads go
   through host requests. The DOM element stubs the web module carried
   had no native callers and were removed. *)

open Promise_ext

let later ~(ms : int) (f : unit -> unit) : unit =
  ignore (Host.set_timeout f ms)

let open_url (u : string) : unit = Host.open_url u

let prefers_dark () : bool = Host.prefers_dark ()

let json_props (pairs : (string * Js.Json.t) list) : Js.Json.t =
  Js.Json.object_list pairs

let make_blob (_ : Js.Json.t array) (_ : Js.Json.t) : Webapi.Blob.t = 0
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
  (* the dom-op payload is a JSON body — binary goes base64 so it
     survives the envelope; the host decodes it in saveFile *)
  Host.dom_op "download-binary"
    (Js.Json.stringify
       (Js.Json.JObject
          [ ("name", Js.Json.JString filename)
          ; ("mime", Js.Json.JString mime)
          ; ("data-b64", Js.Json.JString (b64_encode data)) ]))

(* The file picker is imperative: "open-file-picker" makes the host run
   NSOpenPanel; the reply lands as a "files-picked" platform event
   carrying {request, files: [{name,size,path}]} (file snapshot shape,
   same as drag-drop payloads). *)
let pick_pending : (int, Js.Json.t array -> unit) Hashtbl.t =
  Hashtbl.create 4

let pick_req = ref 0
let pick_listener = ref false

let install_pick_listener () =
  if not !pick_listener then begin
    pick_listener := true;
    Platform.add_event_listener "files-picked" (fun j ->
        match Dom_ext.num_prop "request" j with
        | Some n -> (
            let id = int_of_float n in
            match Hashtbl.find_opt pick_pending id with
            | Some cb ->
                Hashtbl.remove pick_pending id;
                let files =
                  match Dom_ext.prop "files" j with
                  | Js.Json.JArray a -> a
                  | _ -> [||]
                in
                cb files
            | None -> ())
        | None -> ())
  end

let open_file_picker ?accept ?(multiple : bool = false)
    ?(directory : bool = false) (on_files : Js.Json.t array -> unit)
    : unit =
  install_pick_listener ();
  incr pick_req;
  Hashtbl.replace pick_pending !pick_req on_files;
  Host.dom_op "open-file-picker"
    (Js.Json.stringify
       (Js.Json.JObject
          ([ ("request", Js.Json.JNumber (float_of_int !pick_req))
           ; ("multiple", Js.Json.JBoolean multiple)
           ; ("directory", Js.Json.JBoolean directory) ]
          @
          match accept with
          | Some a -> [ ("accept", Js.Json.JString a) ]
          | None -> [])))

let confirm (_ : string) : bool = false

(* file inputs / drag-drop payloads — JSON File snapshots carry
   {name,size,path} the host fills in *)
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
