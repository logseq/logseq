(* Browser platform services: storage, location/history, navigator,
   console/timing, crypto/pfs — everything that is NOT DOM element FFI
   (that lives in Web_dom). *)

open Promise_ext

type loc

external location_obj : loc = "location"

external hash_of : loc -> string = "hash" [@@mel.get]

let location_hash () = hash_of location_obj

external set_hash : loc -> string -> unit = "hash" [@@mel.set]

let set_location_hash s = set_hash location_obj s

external search_of : loc -> string = "search" [@@mel.get]

let location_search () = search_of location_obj

external reload_loc : loc -> unit = "reload" [@@mel.send]

let location_reload () = reload_loc location_obj

external location_origin : string = "location.origin"

external location_pathname : string = "location.pathname"

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

(* cljs storage.cljs reads with reader/read-string and writes pr-str,
   so cljs-stored strings appear double-quoted ("\"en\""). Strip/add
   that quoting at the storage boundary. *)
let storage_unquote s =
  let len = String.length s in
  if len >= 2 && String.get s 0 = '"' && String.get s (len - 1) = '"' then
    String.sub s 1 (len - 2)
  else s

let storage_quote v = "\"" ^ v ^ "\""

(* sessionStorage — cljs graph_tab.cljs persists the per-tab graph so a
   reload restores it; absent outside the browser *)
external session_storage_obj : Js.Json.t option = "sessionStorage"

let session_storage_get k =
  match session_storage_obj with
  | Some s -> ls_get_item s k
  | None -> None

let session_storage_set k v =
  match session_storage_obj with Some s -> ls_set_item s k v | None -> ()

external console_log : 'a -> unit = "log" [@@mel.scope "console"]
external console_error : 'a -> unit = "error" [@@mel.scope "console"]

external date_now_ms : unit -> float = "now" [@@mel.scope "Date"]

(* editor model unit system: U16 — Melange strings and DOM offsets
   both count UTF-16 code units *)
let edit_units = `U16

external make_date : float -> Js.Json.t = "Date" [@@mel.new]

external date_to_string : Js.Json.t -> string = "toLocaleString"
  [@@mel.send]

(* cljs i18n/locale-format-date: d.toLocaleDateString(locale,
   {year numeric, month short, day numeric}) e.g. "Sep 28, 2026";
   undefined locale = runtime default *)
let date_to_localedate : Js.Json.t -> string =
  [%mel.raw
    "function (d) { return d.toLocaleDateString(undefined, \
     { year: 'numeric', month: 'short', day: 'numeric' }) }"]

let fmt_time ms = date_to_localedate (make_date ms)

external perf_now : unit -> float = "now" [@@mel.scope "performance"]

let perf_mark : string -> unit =
  [%mel.raw
    "function (n) { if (window.__navEvents) window.__navEvents.push([n, performance.now()]); }"]

let perf_time (name : string) (f : unit -> 'a) : 'a =
  let t0 = perf_now () in
  let r = f () in
  if perf_now () -. t0 > 1.0 then
    perf_mark (name ^ ":" ^ string_of_float (perf_now () -. t0));
  r

external error_message :
  Js.Promise.error -> string Js.Nullable.t = "message" [@@mel.get]

(* Melange wraps JS rejections as Js.Exn.Error whose payload is the real
   error in field _1 *)
external error_inner : Js.Promise.error -> 'a = "_1" [@@mel.get]

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

external add_window_listener : string -> (Js.Json.t -> unit) -> unit
  = "addEventListener" [@@mel.scope "window"]

external open_url : string -> unit = "open" [@@mel.scope "window"]

external qs_all_arr : string -> Js.Json.t array = "querySelectorAll"
  [@@mel.scope "document"]

external get_attribute : Js.Json.t -> string -> string option
  = "getAttribute" [@@mel.send] [@@mel.return nullable]

(* uuid list of .ls-block.selected blocks, in DOM order *)
let selected_block_uuids () =
  qs_all_arr ".ls-block.selected"
  |> Array.to_list
  |> List.filter_map (fun el -> get_attribute el "blockid")

let on_hash_change f = add_window_listener "hashchange" (fun _ -> f ())

external history_back : unit -> unit = "back" [@@mel.scope "history"]
external history_forward : unit -> unit = "forward" [@@mel.scope "history"]

let clipboard_write_blob : Webapi.Blob.t -> unit Js.Promise.t =
  [%mel.raw
    "function (b) {        return navigator.clipboard.write([new ClipboardItem({'image/png': b})])      }"]

external clipboard_write_text : string -> unit Js.Promise.t = "writeText"
  [@@mel.scope ("navigator", "clipboard")]

external clipboard_read_text : unit -> string Js.Promise.t = "readText"
  [@@mel.scope ("navigator", "clipboard")]

let copy_to_clipboard s = ignore (clipboard_write_text s)

external decode_uri : string -> string = "decodeURIComponent"

external encode_uri_component : string -> string = "encodeURIComponent"
(* OCaml source literals hold UTF-8 bytes; Melange hands them to JS as a
   byte-string so non-ASCII renders mojibake. Copy the byte chars into a
   Uint8Array and UTF-8 decode to obtain the real JS string. Only safe for
   literals — worker (transit-decoded) strings are already proper JS strings
   and would throw. *)
let utf8 : string -> string =
  [%mel.raw
    "function (s) { var u8 = new Uint8Array(s.length); for (var i = 0; i < \
     s.length; i++) u8[i] = s.charCodeAt(i) & 0xff; return new \
     TextDecoder().decode(u8) }"]

external js_get : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]

(* base name for the same accessor — shared src calls Platform.json_prop *)
let json_prop = js_get

let set_document_title : string -> unit =
  [%mel.raw "function (t) { document.title = t }"]

external navigator_ : Js.Json.t = "navigator"
external navigator_platform : Js.Json.t -> string = "platform" [@@mel.get]

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

(* string field from a JSON payload (dom-event "payload", already an
   option — None reads as the empty object so callers don't need
   Option.value ~default:"{}") *)
let payload_str json key =
  match Option.map json_parse json with
  | Some json -> (
      match Js.Json.decodeString (js_get json key) with
      | Some s -> s
      | None -> "")
  | None -> ""

(* same, keeping the option for callers that need presence *)
let payload_str_opt json key =
  match Option.map json_parse json with
  | Some json -> (
      match Js.Json.decodeObject json with
      | Some d -> Option.bind (Js.Dict.get d key) Js.Json.decodeString
      | None -> None)
  | None -> None

let payload_bool json key =
  match Option.map json_parse json with
  | Some json -> (
      match Js.Json.decodeBoolean (js_get json key) with
      | Some b -> b
      | None -> false)
  | None -> false

let payload_num json key =
  match Option.map json_parse json with
  | Some json -> (
      match Js.Json.decodeNumber (js_get json key) with
      | Some n -> n
      | None -> 0.)
  | None -> 0.

(* raw DOM event field, e.g. keydown "key" *)
let event_str ev key =
  match Js.Json.decodeString (js_get ev key) with
  | Some s -> s
  | None -> ""

let rtc_test_mode () =
  match query_param "rtc-test" with Some "true" -> true | _ -> false

external navigator_on_line : bool = "navigator.onLine"

(* util/network-online? *)
let online () = navigator_on_line

external random_uuid : unit -> string = "randomUUID"
  [@@mel.scope "crypto"]

(* window.pfs — the LightningFS handle installed by the db-worker client
   (worker_client.ml set_worker_fs). Asset file writes go through it so
   the worker's asset-sync listener can upload them. *)
type pfs

external window_pfs : pfs Js.Nullable.t = "pfs" [@@mel.scope "window"]

let pfs_handle () = Js.Nullable.toOption window_pfs

external pfs_mkdir : pfs -> string -> unit Js.Promise.t = "mkdir"
  [@@mel.send]

external pfs_write_file :
  pfs -> string -> Js.Typed_array.Uint8Array.t -> unit Js.Promise.t =
  "writeFile" [@@mel.send]

type subtle

external crypto_subtle : subtle = "subtle" [@@mel.scope "crypto"]

external crypto_digest :
  subtle -> string -> Js.Typed_array.Uint8Array.t
  -> Js.Typed_array.ArrayBuffer.t Js.Promise.t = "digest" [@@mel.send]

(* cljs decode-digest: bytes -> lowercase hex *)
let sha256_hex (u8 : Js.Typed_array.Uint8Array.t) =
  let* buf = crypto_digest crypto_subtle "SHA-256" u8 in
  let a = Js.Typed_array.Uint8Array.fromBuffer buf () in
  let n = Js.Typed_array.Uint8Array.length a in
  let b = Buffer.create (n * 2) in
  for i = 0 to n - 1 do
    Buffer.add_string b
      (Printf.sprintf "%02x"
         (Js.Typed_array.Uint8Array.unsafe_get a i))
  done;
  Js.Promise.resolve (Buffer.contents b)

(* lightning-fs mkdir has no recursive flag — create each path segment,
   ignoring EEXIST-style rejections *)
let pfs_ensure_dir pfs path =
  let segs =
    List.filter (fun s -> s <> "") (String.split_on_char '/' path)
  in
  let* _ =
    List.fold_left
      (fun acc seg ->
        let* prefix = acc in
        let p = prefix ^ "/" ^ seg in
        let* () =
          pfs_mkdir pfs p
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())
        in
        Js.Promise.resolve p)
      (Js.Promise.resolve "") segs
  in
  Js.Promise.resolve ()

(* asset_store.ml browser_path — pfs paths strip one logseq_db_ prefix *)
let strip_db_prefix repo =
  let prefix = "logseq_db_" in
  let n = String.length prefix in
  if String.length repo >= n && String.sub repo 0 n = prefix then
    String.sub repo n (String.length repo - n)
  else repo

(* cljs config/dev? = dev-release? || goog.DEBUG — true in every build
   we ship (the vite bundle has no separate release config). Injected via
   vite `define`; guarded so the node test runner (no define) is safe. *)
let dev_build : bool =
  [%mel.raw "typeof logseq_dev !== 'undefined' && logseq_dev"]
