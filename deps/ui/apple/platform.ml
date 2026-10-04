(* Native twin of core/platform.ml — same surface, DOM effects replaced
   by in-memory host state + platform requests to the Swift host.

   - localStorage  -> persistent JSON file under the app support dir
   - sessionStorage-> process-lifetime map
   - document/body class+data effects -> in-memory sets (the native
     renderer reads theme/lang/font via host_state instead of CSS)
   - hash routing    -> in-memory hash string + listener list (the
     router works unchanged)
   - clipboard/etc.  -> queued host requests (Swift replies via pump) *)

open Promise_ext

(* ---------- host request channel ---------- *)

(* Requests the OCaml side needs the Swift host to perform. Serialized
   to JSON and passed through the platform-request wakeup. *)
let host_request : (string -> unit) ref = ref (fun _ -> ())

let request_host name payload = !host_request (name ^ "\n" ^ payload)

(* ---------- persisted ui state (localStorage equivalent) ---------- *)

let app_support_dir () =
  Filename.concat
    (Filename.concat (Unix.getenv "HOME") "Library")
    "Application Support/logseq"

let state_file () =
  Filename.concat (app_support_dir ()) "ui-state.json"

let ls : (string, string) Hashtbl.t = Hashtbl.create 64
let ls_loaded = ref false

let rec mkdir_p path =
  if path <> "" && path <> "/" && not (Sys.file_exists path) then begin
    mkdir_p (Filename.dirname path);
    try Unix.mkdir path 0o755 with _ -> ()
  end

let load_state () =
  if not !ls_loaded then begin
    ls_loaded := true;
    (try
       if Sys.file_exists (state_file ()) then
         let ic = open_in_bin (state_file ()) in
         let n = in_channel_length ic in
         let s = really_input_string ic n in
         close_in ic;
         match Yojson.Safe.from_string s with
         | `Assoc kvs ->
             List.iter
               (fun (k, v) ->
                 match v with
                 | `String v -> Hashtbl.replace ls k v
                 | _ -> ())
               kvs
         | _ -> ()
     with _ -> ())
  end

let save_state () =
  (try
     mkdir_p (app_support_dir ());
     let json =
       `Assoc
         (Hashtbl.fold (fun k v acc -> (k, `String v) :: acc) ls [])
     in
     let oc = open_out_bin (state_file ()) in
     output_string oc (Yojson.Safe.to_string json);
     close_out oc
   with _ -> ())

let local_storage_get k =
  load_state ();
  Hashtbl.find_opt ls k

let local_storage_set k v =
  load_state ();
  Hashtbl.replace ls k v;
  save_state ()

let local_storage_remove k =
  load_state ();
  Hashtbl.remove ls k;
  save_state ()

let session : (string, string) Hashtbl.t = Hashtbl.create 16

let session_storage_get k = Hashtbl.find_opt session k
let session_storage_set k v = Hashtbl.replace session k v

(* ---------- host-side document state ---------- *)

(* Classes/data the web build puts on <html>/<body>; the native
   renderer subscribes to these via the ui-state extension event. *)
let root_classes : (string, unit) Hashtbl.t = Hashtbl.create 8
let body_classes : (string, unit) Hashtbl.t = Hashtbl.create 8
let doc_data : (string, string) Hashtbl.t = Hashtbl.create 8
let lang = ref "en"

let push_ui_state () =
  let classes h =
    Hashtbl.fold (fun k _ acc -> k :: acc) h [] |> String.concat " "
  in
  request_host "ui-state"
    (Yojson.Safe.to_string
       (`Assoc
         [ "lang", `String !lang
         ; "root-classes", `String (classes root_classes)
         ; "body-classes", `String (classes body_classes)
         ; ( "data"
           , `Assoc (Hashtbl.fold (fun k v acc -> (k, `String v) :: acc) doc_data [])
           ) ]))

let document_set_lang s =
  lang := s;
  push_ui_state ()

let document_set_data name value =
  Hashtbl.replace doc_data name value;
  push_ui_state ()

let body_set_data name value = document_set_data name value

let body_rm_data name =
  Hashtbl.remove doc_data name;
  push_ui_state ()

let root_add_class c =
  Hashtbl.replace root_classes c ();
  push_ui_state ()

let root_rm_class c =
  Hashtbl.remove root_classes c;
  push_ui_state ()

let body_add_class c =
  Hashtbl.replace body_classes c ();
  push_ui_state ()

let body_rm_class c =
  Hashtbl.remove body_classes c;
  push_ui_state ()

(* ---------- console / perf ---------- *)

let console_log (_ : 'a) : unit = ()
let console_error (_ : 'a) : unit = ()
let date_now_ms () = Unix.gettimeofday () *. 1000.
let perf_now () = Unix.gettimeofday () *. 1000.
let perf_mark _ = ()

let perf_time (name : string) (f : unit -> 'a) : 'a =
  let t0 = perf_now () in
  let r = f () in
  if perf_now () -. t0 > 50.0 then
    prerr_endline
      (Printf.sprintf "[perf] %s %.1fms" name (perf_now () -. t0));
  r

let error_message (e : exn) = Some (Printexc.to_string e)
let error_inner (e : exn) = e

(* ---------- event listeners ---------- *)

(* The native host posts synthetic events through on_event below; the
   web build listened on window/document. *)
let window_listeners : (string, (Js.Json.t -> unit) list) Hashtbl.t =
  Hashtbl.create 8

let add_event_listener name f =
  let cur = Option.value (Hashtbl.find_opt window_listeners name) ~default:[] in
  Hashtbl.replace window_listeners name (f :: cur)

let add_document_listener name f = add_event_listener name f
let on_document_event name f = add_document_listener name f

(* runs on every event payload before listeners see it — lets the DOM
   shim refresh live element state (value/selection) so listeners that
   read el_value during dispatch never see a stale snapshot regardless
   of registration order *)
let pre_dispatch_hook : (Js.Json.t -> unit) ref = ref (fun _ -> ())

(* DOM-style event bubbling: the host posts a dom-event only to the
   deepest hit node, so element-level handlers registered on ancestors
   would never run natively. Views register their per-element handlers
   here keyed by extension node id; emit_event walks the hit node and
   its parents (runtime_parents, installed by the embed layer) and
   invokes each registered handler whose `events` list contains the
   event name — mirroring a browser's bubble phase. *)
type dom_handler =
  { dh_events : string
  ; dh_fn : string -> string option -> unit
  }

(* node id -> handlers; a node can carry several (declarative on_dom_event
   plus imperative el_listen registrations share the same bubble walk) *)
let dom_handlers : (int, dom_handler list) Hashtbl.t = Hashtbl.create 256

let register_dom_handler id ~events fn =
  if events <> "" then
    let cur = Option.value (Hashtbl.find_opt dom_handlers id) ~default:[] in
    Hashtbl.replace dom_handlers id
      (cur @ [ { dh_events = events; dh_fn = fn } ])

let unregister_dom_handlers id = Hashtbl.remove dom_handlers id

(* stopPropagation / stopImmediatePropagation: handlers flip this during
   dispatch; the bubble walk and the document-level fan-out check it *)
let propagation_stopped = ref false
let request_stop () = propagation_stopped := true

let dom_parent_of : (int -> int option) ref = ref (fun _ -> None)

let event_listed events name =
  List.exists
    (fun e -> e = name)
    (String.split_on_char ' ' events
    |> List.concat_map (String.split_on_char ','))

(* the leftMouseUp monitor emits "click" for every hit (DOM parity —
   taps on views without their own gesture would otherwise never reach
   document click listeners), while elements with their own tap gesture
   also emit one. The monitor defers a runloop tick so the element emit
   wins; drop the duplicate inside a coalescing window far shorter than
   a human double-click. *)
let last_click_ms = ref (-1.)

(* host -> OCaml event entry; called by the bridge. *)
let emit_event name payload =
  let now = date_now_ms () in
  (try
     Printf.eprintf "DBG emit %s nid=%s dedup=%b\n%!" name
       (match payload with
        | Js.Json.JObject kvs -> (
            match List.assoc_opt "nodeId" kvs with
            | Some v -> Js.Json.stringify v
            | None -> "-")
        | _ -> "?")
       (name = "click" && now -. !last_click_ms < 60.)
   with _ -> ());
  if name = "click" && now -. !last_click_ms < 60. then
    ()
  else begin
  if name = "click" then last_click_ms := now;
  propagation_stopped := false;
  !pre_dispatch_hook payload;
  (match payload with
   | Js.Json.JObject kvs -> (
       match List.assoc_opt "nodeId" kvs with
       | Some v -> (
           match Js.Json.decodeNumber v with
           | None -> ()
           | Some n ->
               let payload_str = Js.Json.stringify payload in
               let rec bubble id depth =
                 if depth < 64 && not !propagation_stopped then begin
                   (match Hashtbl.find_opt dom_handlers id with
                    | Some dhs ->
                        Printf.eprintf "DBG bubble id=%d handlers=%d\n%!"
                          id (List.length dhs);
                        List.iter
                          (fun dh ->
                            if
                              (not !propagation_stopped)
                              && event_listed dh.dh_events name
                            then
                              try dh.dh_fn name (Some payload_str)
                              with e ->
                                Printf.eprintf "DBG dh THREW id=%d ev=%s: %s\n%!"
                                  id name (Printexc.to_string e))
                          dhs
                    | None -> ());
                   match !dom_parent_of id with
                   | Some parent -> bubble parent (depth + 1)
                   | None -> ()
                 end
               in
               bubble (int_of_float n) 0)
       | None -> ())
   | _ -> ());
  if not !propagation_stopped then
  match Hashtbl.find_opt window_listeners name with
  | Some fns ->
      List.iter
        (fun f ->
          try f payload
          with e ->
            Printf.eprintf "DBG listener THREW ev=%s: %s\n%!" name
              (Printexc.to_string e))
        fns
  | None -> ()
  end

(* ---------- url / hash routing ---------- *)

let hash_ref = ref ""

(* in-memory navigation history — the native app has no browser
   history, so back/forward is a pair of hash stacks. [set_location_hash]
   pushes the previous hash; back/forward swap stacks and re-notify. *)
let back_stack : string list ref = ref []

let fwd_stack : string list ref = ref []

let hash_change_fns : (unit -> unit) list ref = ref []

let notify_hash () = List.iter (fun f -> f ()) !hash_change_fns

let location_hash () = !hash_ref

let set_location_hash s =
  if s <> !hash_ref then begin
    (* the pre-route empty hash is not a destination — never push it *)
    if !hash_ref <> "" then back_stack := !hash_ref :: !back_stack;
    fwd_stack := [];
    hash_ref := s;
    notify_hash ()
  end

let can_history_back () = !back_stack <> []

let can_history_forward () = !fwd_stack <> []

let search_ref = ref ""
let location_search () = !search_ref

let on_hash_change f = hash_change_fns := f :: !hash_change_fns

(* URLSearchParams = k=v&.. query, percent-decoded *)
let new_url_search_params (s : string) : (string * string) list =
  let s =
    if String.length s > 0 && s.[0] = '?' then
      String.sub s 1 (String.length s - 1)
    else s
  in
  String.split_on_char '&' s
  |> List.filter_map (fun kv ->
         match String.index_opt kv '=' with
         | Some i ->
             let k = String.sub kv 0 i in
             let v = String.sub kv (i + 1) (String.length kv - i - 1) in
             Some (k, Uri.pct_decode v)
         | None -> Some (kv, ""))

let search_params_get (params : (string * string) list) name =
  match List.assoc_opt name params with
  | Some v -> Some v
  | None -> None

let query_param name =
  if !search_ref = "" then None
  else search_params_get (new_url_search_params !search_ref) name

let hash_query_param name =
  if !hash_ref = "" then None
  else
    match String.index_opt !hash_ref '?' with
    | Some i ->
        search_params_get
          (new_url_search_params
             (String.sub !hash_ref (i + 1)
                (String.length !hash_ref - i - 1)))
          name
    | None -> None

let replace_url_fragment hash = hash_ref := hash

let history_back () =
  match !back_stack with
  | [] -> ()
  | h :: t ->
      fwd_stack := !hash_ref :: !fwd_stack;
      back_stack := t;
      hash_ref := h;
      notify_hash ()

let history_forward () =
  match !fwd_stack with
  | [] -> ()
  | h :: t ->
      back_stack := !hash_ref :: !back_stack;
      fwd_stack := t;
      hash_ref := h;
      notify_hash ()

(* ---------- clipboard ---------- *)

let copy_to_clipboard s = request_host "clipboard-write" s

(* ---------- misc ---------- *)

let decode_uri = Uri.pct_decode
let encode_uri_component s = Uri.pct_encode ~component:`Query_value s
let js_escape s = s
let utf8 s = s (* OCaml strings are already UTF-8 bytes *)

let desktop_os () = true
let is_mac () = true
let online () = true
let document_visible () = true
let dev_build = true

let json_parse s = Js.Json.parseExn s

let json_prop j key =
  match j with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt key kvs with
      | Some v -> v
      | None -> Js.Json.JNull)
  | _ -> Js.Json.JNull

let payload_str json key =
  match Option.map json_parse json with
  | Some json -> (
      match Js.Json.decodeString (json_prop json key) with
      | Some s -> s
      | None -> "")
  | None -> ""

let payload_bool json key =
  match Option.map json_parse json with
  | Some json -> (
      match Js.Json.decodeBoolean (json_prop json key) with
      | Some b -> b
      | None -> false)
  | None -> false

let payload_num json key =
  match Option.map json_parse json with
  | Some json -> (
      match Js.Json.decodeNumber (json_prop json key) with
      | Some n -> n
      | None -> 0.)
  | None -> 0.

let event_str ev key =
  match Js.Json.decodeString (json_prop ev key) with
  | Some s -> s
  | None -> ""

let rtc_test_mode () =
  match query_param "rtc-test" with Some "true" -> true | _ -> false

let random_uuid () =
  let b = Bytes.create 16 in
  for i = 0 to 15 do
    Bytes.set b i (Char.chr (Random.int 256))
  done;
  Bytes.set b 6 (Char.chr ((Char.code (Bytes.get b 6) land 0x0f) lor 0x40));
  Bytes.set b 8 (Char.chr ((Char.code (Bytes.get b 8) land 0x3f) lor 0x80));
  Printf.sprintf
    "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x"
    (Char.code (Bytes.get b 0)) (Char.code (Bytes.get b 1))
    (Char.code (Bytes.get b 2)) (Char.code (Bytes.get b 3))
    (Char.code (Bytes.get b 4)) (Char.code (Bytes.get b 5))
    (Char.code (Bytes.get b 6)) (Char.code (Bytes.get b 7))
    (Char.code (Bytes.get b 8)) (Char.code (Bytes.get b 9))
    (Char.code (Bytes.get b 10)) (Char.code (Bytes.get b 11))
    (Char.code (Bytes.get b 12)) (Char.code (Bytes.get b 13))
    (Char.code (Bytes.get b 14)) (Char.code (Bytes.get b 15))

(* ---------- file access (pfs equivalent: real FS) ---------- *)

(* Assets live under the graph directory on disk — no LightningFS. *)
type pfs = string (* graphs-dir-relative base path *)

let pfs_root = ref ""

let set_pfs_root p = pfs_root := p
let pfs_handle () = if !pfs_root = "" then None else Some !pfs_root

let pfs_ensure_dir (_pfs : pfs) (path : string) =
  try
    mkdir_p path;
    Js.Promise.resolve ()
  with e -> Js.Promise.reject e

let pfs_write_file (_pfs : pfs) (path : string)
    (u8 : Js.Typed_array.Uint8Array.t) =
  try
    mkdir_p (Filename.dirname path);
    let oc = open_out_bin path in
    output_bytes oc u8;
    close_out oc;
    Js.Promise.resolve ()
  with e -> Js.Promise.reject e

(* ---------- sha256 ---------- *)

let sha256_hex (u8 : Js.Typed_array.Uint8Array.t) =
  Js.Promise.resolve
    (Digestif.SHA256.(to_hex (digest_bytes u8)))

(* ---------- misc web leftovers ---------- *)

(* asset_store.ml browser_path — pfs paths strip one logseq_db_ prefix *)
let strip_db_prefix repo =
  let prefix = "logseq_db_" in
  let n = String.length prefix in
  if String.length repo >= n && String.sub repo 0 n = prefix then
    String.sub repo n (String.length repo - n)
  else repo

(* CustomEvent dispatch on document — cross-area comms; native: call
   the registered listeners directly. *)
(* CustomEvent semantics: listeners read ev.detail.<key> (json_field
   "detail"), so the payload must be wrapped under "detail" the way
   `new CustomEvent(name, {detail})` does it on web. *)
let dispatch name detail =
  emit_event name (Js.Json.JObject [ ("detail", detail) ])

let selected_block_uuids () = []

let get_element_by_id (_id : string) : Webapi.Dom.Element.t option = None

(* native elements are Json snapshots — attrs ride the "attrs" object the
   Swift host attaches, same decode as Dom_ext.el_attr *)
let get_attribute (el : Js.Json.t) (name : string) : string option =
  match el with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt "attrs" kvs with
      | Some (Js.Json.JObject attrs) ->
          Option.bind (List.assoc_opt name attrs) Js.Json.decodeString
      | _ -> (
          match List.assoc_opt ("attr-" ^ name) kvs with
          | Some v -> Js.Json.decodeString v
          | None -> None))
  | _ -> None
