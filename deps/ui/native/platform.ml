let published_db : string option = None
let published_state : string option = None
let publishing () = false

(* Native twin of core/platform.ml — same surface, DOM effects replaced
   by in-memory host state + platform requests to the native host.

   - localStorage  -> persistent JSON file under the app support dir
   - sessionStorage-> process-lifetime map
   - document/body class+data effects -> in-memory sets (the native
     renderer reads theme/lang/font via host_state instead of CSS)
   - hash routing    -> in-memory hash string + listener list (the
     router works unchanged)
   - clipboard/etc.  -> queued host requests (the host replies via pump) *)

open Promise_ext

include Platform_native

(* ---------- console / perf ---------- *)

let console_log (_ : 'a) : unit = ()
let console_error (_ : 'a) : unit = ()
let date_now_ms () = Unix.gettimeofday () *. 1000.

(* editor model unit system: Bytes — native OCaml strings are UTF-8
   bytes; the host translates its UTF-16 layout offsets at the
   logseq_editor boundary *)
let edit_units = `Bytes
let perf_now () = Unix.gettimeofday () *. 1000.

let perf_log =
  lazy (match Sys.getenv_opt "LOGSEQ_PERF" with Some _ -> true | None -> false)

let perf_mark name =
  if Lazy.force perf_log then
    Printf.eprintf "[mark] %s u=%.3f\n%!" name (Unix.gettimeofday ())

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

(* document listeners registered with capture=true run before the
   per-element bubble walk — DOM capture-phase parity. The web relies on
   it to let document handlers suppress an element's own listener
   (paste_into_editor stopImmediatePropagation before the conduit's
   paste listener splices raw text). *)
let capture_listeners : (string, (Js.Json.t -> unit) list) Hashtbl.t =
  Hashtbl.create 8

let add_event_listener ?(capture = false) name f =
  let tbl = if capture then capture_listeners else window_listeners in
  let cur = Option.value (Hashtbl.find_opt tbl name) ~default:[] in
  Hashtbl.replace tbl name (f :: cur)

let add_document_listener ?(capture = false) name f =
  add_event_listener ~capture name f
let on_document_event name f = add_event_listener name f

(* runs on every event payload before listeners see it — lets the DOM
   shim refresh live element state (value/selection) so listeners that
   read el_value during dispatch never see a stale snapshot regardless
   of registration order *)
let pre_dispatch_hook : (Js.Json.t -> unit) ref = ref (fun _ -> ())

(* runs after the bubble walk and document listeners — the DOM shim
   installs the click default action here (a[href^="#"] navigation) *)
let post_dispatch_hook : (string -> Js.Json.t -> unit) ref =
  ref (fun _ _ -> ())

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

(* runtime-node-id -> element snapshot for the event's "target" prop,
   installed by the embed layer; host payloads only carry nodeId, and
   document listeners resolve ev_target/closest through this *)
let event_target_of : (int -> Js.Json.t option) ref = ref (fun _ -> None)

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

(* the web drives block drags through dnd-kit sensors; here the gesture
   is driven by editor_keys' mousedown/mousemove/click listeners *)
let native_drag () = true

(* the web reveals the fold caret on row hover (lui-core.css
   [data-has-children] rule); there's no hover here, so collapsable
   blocks keep the caret visible at rest *)
let native_block_controls () = true

(* no stylesheet transforms here — views swap the icon itself *)
let css_transform_icons () = false

(* host -> OCaml event entry; called by the bridge. *)
let emit_event name payload =
  let now = date_now_ms () in
  if name = "click" && now -. !last_click_ms < 60. then
    ()
  else begin
  if name = "click" then last_click_ms := now;
  propagation_stopped := false;
  !pre_dispatch_hook payload;
  (* every listener sees the enriched payload: "target" injected from
     the host's nodeId — capture listeners run before the element bubble
     walk, so they need it just as early *)
  let payload =
    match payload with
    | Js.Json.JObject kvs -> (
        if List.mem_assoc "target" kvs then payload
        else
          match List.assoc_opt "nodeId" kvs with
          | Some v -> (
              match Js.Json.decodeNumber v with
              | Some n -> (
                  match !event_target_of (int_of_float n) with
                  | Some target ->
                      Js.Json.JObject (kvs @ [ ("target", target) ])
                  | None -> payload)
              | None -> payload)
          | None -> payload)
    | _ -> payload
  in
  let run_listeners tbl =
    match Hashtbl.find_opt tbl name with
    | Some fns ->
        List.iter
          (fun f ->
            if not !propagation_stopped then
              try f payload
              with e ->
                Printf.eprintf "[emit_event] listener threw ev=%s: %s\n%!"
                  name (Printexc.to_string e))
          fns
    | None -> ()
  in
  run_listeners capture_listeners;
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
                        List.iter
                          (fun dh ->
                            if
                              (not !propagation_stopped)
                              && event_listed dh.dh_events name
                            then
                              try dh.dh_fn name (Some payload_str)
                              with e ->
                                Printf.eprintf
                                  "[emit_event] handler threw id=%d ev=%s: %s\n%!"
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
  if not !propagation_stopped then run_listeners window_listeners;
  (* DOM default action — runs after listeners had their chance to
     prevent; skipped entirely for coalesced duplicate clicks *)
  (try !post_dispatch_hook name payload
   with e ->
     Printf.eprintf "[emit_event] post hook threw ev=%s: %s\n%!" name
       (Printexc.to_string e));
  (* imperative navigation also reaches Ui_services.nav_on_navigate
     observers — the same second channel the browser's "ls:navigate"
     document listener provides *)
  if name = "ls:navigate" then notify_navigate ()
  end

(* ---------- clipboard ---------- *)

let copy_to_clipboard s = Host.clipboard_write s

(* window.open → the native host shells out to the system browser *)
let open_url (u : string) = Host.open_url u

let clipboard_write_text (s : string) : unit Js.Promise.t =
  ignore (copy_to_clipboard s);
  Js.Promise.resolve ()

(* "clipboard-read" requests are answered by a same-named platform
   event; one resolver per outstanding read, FIFO *)
let clipboard_read_resolvers : (string -> unit) Queue.t = Queue.create ()

let clipboard_read_text () : string Js.Promise.t =
  Js.Promise.make (fun ~resolve ~reject:_ ->
      Queue.add resolve clipboard_read_resolvers;
      Host.clipboard_read ())

let note_clipboard_text s =
  match Queue.take_opt clipboard_read_resolvers with
  | Some resolve -> resolve s
  | None -> ()

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

let rtc_test_mode () =
  match query_param "rtc-test" with Some "true" -> true | _ -> false

let random_uuid = Host.random_uuid

(* ---------- file access (pfs equivalent: real FS) ---------- *)

(* Assets live under the graph directory on disk — no LightningFS. *)
type pfs = string (* graphs-dir-relative base path *)

let pfs_root = ref ""

(* nothing in-tree assigns a pfs root today — pfs_handle reports None
   until a host does *)
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

(* native elements are Json snapshots — attrs ride the "attrs" object the
   native host attaches, same decode as Dom_ext.el_attr *)
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

(* recycle-view timestamp — host-side formatting not wired yet *)
let fmt_time (_ : float) : string = ""

(* window reload is a web concept — native restarts through the host *)
let location_reload () : unit = ()

(* no browser origin on native — "open in another tab" isn't a native
   concept; share/other-tab URLs degrade to the graph fragment *)
let location_origin = ""
let location_pathname = ""
