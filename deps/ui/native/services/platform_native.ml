(* Native persistence, appearance state, navigation, and scheduling services.
   This library contains no browser runtime emulation. *)

(* Sys.os_type reports Unix on both macOS and Linux. Probe once and
   retain the native system name for services that differ between them. *)
let native_system =
  if Sys.os_type <> "Unix" then Sys.os_type
  else
    let ic = Unix.open_process_args_in "uname" [| "uname"; "-s" |] in
    let name =
      Fun.protect
        ~finally:(fun () ->
          match Unix.close_process_in ic with
          | Unix.WEXITED 0 -> ()
          | _ -> failwith "Could not identify the native operating system")
        (fun () -> In_channel.input_all ic |> String.trim)
    in
    if name = "" then
      failwith "The native operating system name is empty";
    name

let is_mac () = native_system = "Darwin"

let home_directory () =
  match Sys.getenv_opt "HOME" with
  | Some path when path <> "" -> path
  | Some _ -> invalid_arg "HOME must not be empty"
  | None when Sys.os_type = "Win32" ->
      (match Sys.getenv_opt "USERPROFILE" with
       | Some path when path <> "" -> path
       | Some _ -> invalid_arg "USERPROFILE must not be empty"
       | None -> failwith "USERPROFILE not set")
  | None -> failwith "HOME not set"

let packaged_resource_dir =
  Filename.concat (Filename.dirname Sys.executable_name)
    (if is_mac () then "../Resources" else "Resources")

let asset_path path =
  if not (Filename.is_relative path) then path
  else
    let root =
      match Sys.getenv_opt "LOGSEQ_NATIVE_ASSET_DIR" with
      | Some "" -> invalid_arg "LOGSEQ_NATIVE_ASSET_DIR must not be empty"
      | Some path -> path
      | None -> packaged_resource_dir
    in
    Filename.concat root path

let resource_url path =
  let resource_path = asset_path path in
  let absolute_path =
    if Filename.is_relative resource_path then Filename.concat (Sys.getcwd ()) resource_path
    else resource_path in
  let encoded = Uri.pct_encode ~component:(`Custom (`Path, "/", "")) absolute_path in
  Uri.to_string (Uri.make ~scheme:"file" ~host:"" ~path:encoded ())

(* ---------- host request channel ---------- *)

(* Requests the OCaml side needs the native host to perform. Serialized
   to JSON and passed through the platform-request wakeup. *)
let host_request : (string -> unit) ref = ref (fun _ -> ())

let request_host name payload = !host_request (name ^ "\n" ^ payload)

let desktop_updates_enabled = ref false
let desktop_update_state : Ui_services.desktop_update_state ref =
  ref { Ui_services.configured = false; busy = false }
let desktop_update_listeners = Hashtbl.create 2
let desktop_update_listener_id = ref 0
let reset_desktop_updates () =
  desktop_updates_enabled := false;
  desktop_update_state := { Ui_services.configured = false; busy = false };
  Hashtbl.clear desktop_update_listeners
let update_desktop_updates (value : Ui_services.desktop_update_state) =
  if not !desktop_updates_enabled then invalid_arg "Desktop updates require the NSH host";
  if value <> !desktop_update_state then begin
    desktop_update_state := value;
    let listeners = Hashtbl.fold (fun _ notify all -> notify :: all) desktop_update_listeners [] in
    List.iter (fun notify -> notify value) listeners
  end
let desktop_updates : Ui_services.desktop_updates =
  { current = (fun () -> !desktop_update_state)
  ; subscribe = (fun notify ->
      incr desktop_update_listener_id;
      let id = !desktop_update_listener_id in
      Hashtbl.add desktop_update_listeners id notify;
      fun () -> Hashtbl.remove desktop_update_listeners id)
  ; check = (fun () ->
      if not !desktop_updates_enabled then invalid_arg "Desktop updates require the NSH host";
      let state = !desktop_update_state in
      if state.configured && not state.busy then request_host "application-update-check" "{}")
  }

let native_performance_sample : Ui_services.native_performance_sample ref =
  ref { Ui_services.fps = None; panel_open = false }
let native_performance_listeners = Hashtbl.create 2
let native_performance_listener_id = ref 0

let update_native_performance (sample : Ui_services.native_performance_sample) =
  Option.iter (fun fps ->
    if not (Float.is_finite fps) || fps < 0. then
      invalid_arg "Invalid native presentation rate") sample.fps;
  if sample <> !native_performance_sample then begin
    native_performance_sample := sample;
    Hashtbl.iter (fun _ notify -> notify sample) native_performance_listeners
  end

let native_performance : Ui_services.native_performance =
  { current = (fun () -> !native_performance_sample)
  ; subscribe = (fun notify ->
      incr native_performance_listener_id;
      let id = !native_performance_listener_id in
      Hashtbl.add native_performance_listeners id notify;
      fun () -> Hashtbl.remove native_performance_listeners id)
  ; toggle_panel = (fun () -> request_host "native-performance-toggle" "{}")
  }

(* ---------- persisted ui state (localStorage equivalent) ---------- *)

let app_support_dir =
  let path =
    match Sys.getenv_opt "LOGSEQ_UI_STATE_DIR" with
    | Some path when path <> "" -> path
    | Some _ -> invalid_arg "LOGSEQ_UI_STATE_DIR must not be empty"
    | None when Sys.os_type = "Win32" ->
        (match Sys.getenv_opt "APPDATA" with
         | Some path when path <> "" && not (Filename.is_relative path) ->
             Filename.concat path "logseq"
         | Some _ -> invalid_arg "APPDATA must be an absolute nonempty directory"
         | None -> failwith "APPDATA not set")
    | None when native_system = "Linux" ->
        let state_home =
          match Sys.getenv_opt "XDG_STATE_HOME" with
          | Some path when path <> "" && not (Filename.is_relative path) ->
              path
          | Some _ | None ->
              (* XDG ignores empty or relative base directories. *)
              Filename.concat (home_directory ()) ".local/state"
        in
        Filename.concat state_home "logseq"
    | None ->
        Filename.concat
          (Filename.concat (home_directory ()) "Library")
          "Application Support/logseq"
  in
  fun () -> path

let state_file () =
  Filename.concat (app_support_dir ()) "ui-state.json"

let ls : (string, string) Hashtbl.t = Hashtbl.create 64
let ls_loaded = ref false

let auth_token_keys = [ "id-token"; "access-token"; "refresh-token" ]
let auth_tokens : (string * string) list ref = ref []
let auth_managed = ref false
let is_auth_token key = List.mem key auth_token_keys

let state_exists () =
  match Unix.stat (state_file ()) with
  | _ -> true
  | exception Unix.Unix_error (Unix.ENOENT, _, _) -> false

exception Incompatible_auth_record
exception Credential_storage_error of string

let auth_tokens_of_json = function
  | `Assoc fields ->
      List.map (fun key ->
        match List.assoc_opt key fields with
        | Some (`String value) when value <> "" -> key, value
        | None | Some `Null | Some (`String "") -> raise Incompatible_auth_record
        | _ -> raise (Credential_storage_error "Invalid authentication token field")) auth_token_keys
  | _ -> raise (Credential_storage_error "Invalid authentication record")

let parse_auth_record text =
  try auth_tokens_of_json (Yojson.Safe.from_string text)
  with Yojson.Json_error _ ->
    raise (Credential_storage_error "Invalid authentication record encoding")

let read_legacy_auth_file path =
  match Unix.openfile path [ Unix.O_RDONLY ] 0 with
  | descriptor ->
      let channel = Unix.in_channel_of_descr descriptor in
      Fun.protect ~finally:(fun () -> close_in_noerr channel) (fun () ->
        let json = try Yojson.Safe.from_channel channel
          with Yojson.Json_error _ ->
            raise (Credential_storage_error "Invalid legacy authentication record encoding") in
        try auth_tokens_of_json json with Incompatible_auth_record -> [])
  | exception Unix.Unix_error (Unix.ENOENT, _, _) -> []

let legacy_auth_tokens () =
  let native_fields = List.filter_map (fun key ->
    Option.map (fun value -> key, `String value) (Hashtbl.find_opt ls key)) auth_token_keys in
  if native_fields <> [] then
    (try auth_tokens_of_json (`Assoc native_fields) with Incompatible_auth_record -> [])
  else if state_exists () then []
  else
    read_legacy_auth_file
      (Filename.concat (Filename.concat (home_directory ()) "logseq") "auth.json")

let rec mkdir_p path =
  if path <> "" && path <> "/" && not (Sys.file_exists path) then begin
    mkdir_p (Filename.dirname path);
    try Unix.mkdir path 0o755 with _ -> ()
  end

let load_state () =
  if not !ls_loaded then begin
    if state_exists () then begin
      let json = try In_channel.with_open_bin (state_file ()) Yojson.Safe.from_channel
        with Yojson.Json_error _ -> failwith "Invalid native UI state encoding" in
      match json with
      | `Assoc kvs ->
          List.iter (fun (key, value) ->
            match value with
            | `String text -> Hashtbl.replace ls key text
            | _ when is_auth_token key -> failwith "Invalid native authentication token"
            | _ -> ()) kvs
      | _ -> failwith "Invalid native UI state"
    end;
    ls_loaded := true
  end

let save_state_strict () =
  if not !auth_managed then invalid_arg "Authentication storage has not been resolved";
  let directory = app_support_dir () in
  mkdir_p directory;
  let json = `Assoc (Hashtbl.fold (fun key value acc ->
    if is_auth_token key then acc else (key, `String value) :: acc) ls []) in
  let temporary, channel = Filename.open_temp_file ~mode:[ Open_binary ]
    ~perms:0o600 ~temp_dir:directory "ui-state-" ".tmp" in
  Fun.protect ~finally:(fun () ->
    close_out_noerr channel;
    if Sys.file_exists temporary then Sys.remove temporary) (fun () ->
    output_string channel (Yojson.Safe.to_string json);
    flush channel;
    Unix.fsync (Unix.descr_of_out_channel channel);
    close_out channel;
    Unix.rename temporary (state_file ()))

let save_state () =
  if !auth_managed then (try save_state_strict () with _ -> ())

(* cljs storage.cljs reads with reader/read-string and writes pr-str,
   so cljs-stored strings appear double-quoted. Strip/add that quoting
   at the storage boundary. *)
let storage_unquote s =
  let len = String.length s in
  if len >= 2 && String.get s 0 = '"' && String.get s (len - 1) = '"' then
    String.sub s 1 (len - 2)
  else s

let storage_quote v = "\"" ^ v ^ "\""

(* the native window title is host-managed — the call is a no-op *)
let set_document_title (_ : string) : unit = ()

let local_storage_get k =
  load_state ();
  if is_auth_token k then List.assoc_opt k !auth_tokens
  else Hashtbl.find_opt ls k

let local_storage_set k v =
  if is_auth_token k then invalid_arg "Authentication requires OS keychain storage";
  load_state ();
  Hashtbl.replace ls k v;
  save_state ()

let local_storage_remove k =
  if is_auth_token k then invalid_arg "Authentication requires OS keychain removal";
  load_state ();
  Hashtbl.remove ls k;
  save_state ()

let session : (string, string) Hashtbl.t = Hashtbl.create 16

let session_storage_get k = Hashtbl.find_opt session k
let session_storage_set k v = Hashtbl.replace session k v

(* ---------- perf marks ---------- *)

let perf_log =
  lazy (match Sys.getenv_opt "LOGSEQ_PERF" with Some _ -> true | None -> false)

let perf_mark name =
  if Lazy.force perf_log then
    Printf.eprintf "[mark] %s u=%.3f\n%!" name (Unix.gettimeofday ())

(* ---------- clipboard ---------- *)

type host_task =
  { operation : string
  ; cancel : unit -> unit
  ; complete : Yojson.Safe.t -> unit
  }

(* Clipboard writes and date parsing share one cancellable request owner. *)
let host_task_id = ref 0
let host_tasks : (string, host_task) Hashtbl.t = Hashtbl.create 8

let request_host_task ~operation ~fields ~decode =
  if !host_task_id = max_int then invalid_arg "Native request identity exhausted";
  incr host_task_id;
  let id = string_of_int !host_task_id in
  let complete = ref None in
  let task = Ui_task.create ~cancel:(fun () -> Hashtbl.remove host_tasks id)
    (fun ~resolve ~reject -> complete := Some (resolve,reject)) in
  let resolve,reject = Option.get !complete in
  Hashtbl.add host_tasks id
    {operation;cancel=(fun () -> Ui_task.cancel task);
     complete=(fun payload ->
       try match decode payload with Ok value -> resolve value | Error error -> reject error
       with error -> reject error)};
  (try !Host.host_op operation (Yojson.Safe.to_string
    (`Assoc (("request-id",`String id)::fields)))
   with error -> Ui_task.cancel task; raise error);
  task

let note_host_task ~operation ~decode json =
  let invalid () = invalid_arg ("Invalid native " ^ operation ^ " result") in
  let id = match json with
    | `Assoc fields -> (match List.assoc_opt "request-id" fields with
        | Some (`String id) ->
            (match int_of_string_opt id with
             | Some value when value > 0 && string_of_int value = id
                               && value <= !host_task_id -> id
             | _ -> invalid ())
        | _ -> invalid ())
    | _ -> invalid () in
  (* Validate the wire payload even after cancellation; operational failures
     remain result values and reject only their matching live task. *)
  ignore (decode json);
  Host.enqueue (fun () ->
    match Hashtbl.find_opt host_tasks id with
    | None -> ()
    | Some pending when pending.operation = operation ->
        Hashtbl.remove host_tasks id;
        pending.complete json
    | Some _ -> invalid ())

let decode_clipboard_write = function
  | `Assoc fields ->
      (match List.sort String.compare (List.map fst fields),List.assoc_opt "ok" fields with
       | ["ok";"request-id"],Some (`Bool true) -> Ok ()
       | ["error";"ok";"request-id"],Some (`Bool false) ->
           (match List.assoc_opt "request-id" fields,List.assoc_opt "error" fields with
            | Some (`String id),Some (`String message) when message <> "" ->
                Error (Failure ("Clipboard write " ^ id ^ ": " ^ message))
            | _ -> invalid_arg "Invalid native clipboard write result")
       | _ -> invalid_arg "Invalid native clipboard write result")
  | _ -> invalid_arg "Invalid native clipboard write result"

let clipboard_write_text text =
  request_host_task ~operation:"clipboard-write" ~fields:["text",`String text]
    ~decode:decode_clipboard_write

let note_clipboard_write json =
  note_host_task ~operation:"clipboard-write" ~decode:decode_clipboard_write json

let cancel_host_tasks () =
  let cancel = Hashtbl.fold (fun _ task acc -> task.cancel::acc) host_tasks [] in
  Hashtbl.clear host_tasks;
  List.iter (fun cancel -> cancel ()) cancel

let natural_dates_supported = ref false
let configure_natural_dates ~nsh = natural_dates_supported := nsh

let decode_natural_date = function
  | `Assoc fields ->
      (match List.sort String.compare (List.map fst fields),List.assoc_opt "status" fields with
       | ["request-id";"status"],Some (`String "no-match") -> Ok None
       | ["epoch-ms";"request-id";"status"],Some (`String "parsed") ->
           let value = match List.assoc_opt "epoch-ms" fields with
             | Some (`Int value) -> float_of_int value
             | Some (`Intlit value) -> Int64.to_float (Int64.of_string value)
             | _ -> invalid_arg "Invalid natural date epoch" in
           if not (Float.is_finite value) || abs_float value > 8640000000000000. then
             invalid_arg "Invalid natural date epoch";
           Ok (Some value)
       | ["error";"request-id";"status"],Some (`String "error") ->
           (match List.assoc_opt "error" fields with
            | Some (`String message) when message <> "" -> Error (Failure message)
            | _ -> invalid_arg "Invalid natural date error")
       | _ -> invalid_arg "Invalid native natural date result")
  | _ -> invalid_arg "Invalid native natural date result"

let date_parse_natural ~reference text =
  if not (Float.is_finite reference) || abs_float reference > 8640000000000000.
     || Float.floor reference <> reference then
    invalid_arg "Natural date reference requires finite integer epoch milliseconds";
  if not !natural_dates_supported then
    Ui_task.reject (Failure "Natural date parsing is unavailable on this native host")
  else request_host_task ~operation:"natural-date-parse"
    ~fields:["input",`String text;
             "reference-ms",`Intlit (Int64.to_string (Int64.of_float reference))]
    ~decode:decode_natural_date

let note_natural_date json =
  note_host_task ~operation:"natural-date-parse" ~decode:decode_natural_date json

(* "clipboard-read" requests are answered by a same-named platform
   event; one resolver per outstanding read, FIFO *)
let clipboard_read_resolvers : ((string, exn) result -> unit) Queue.t = Queue.create ()

let clipboard_read_text () : string Ui_task.t =
  Ui_task.create (fun ~resolve ~reject ->
      Queue.add (function Ok text -> resolve text | Error error -> reject error)
        clipboard_read_resolvers;
      Host.clipboard_read ())

let note_clipboard_result result =
  Host.enqueue (fun () ->
    match Queue.take_opt clipboard_read_resolvers with
    | Some settle -> settle result
    | None -> ())

(* ---------- host-side document state ---------- *)

(* Classes/data the web build puts on <html>/<body>; the native
   renderer subscribes to these via the ui-state extension event. *)
let root_classes : (string, unit) Hashtbl.t = Hashtbl.create 8
let body_classes : (string, unit) Hashtbl.t = Hashtbl.create 8
let doc_data : (string, string) Hashtbl.t = Hashtbl.create 8
let lang = ref "en"
let theme_snapshots : (string, Ui_services.theme_snapshot) Hashtbl.t = Hashtbl.create 2

let push_theme_snapshot (snap : Ui_services.theme_snapshot) =
  let accent = Option.value (Hashtbl.find_opt doc_data "color") ~default:"logseq" in
  let palette = Ui_theme.css_palette (Ui_theme.mode_of_string snap.mode) ~accent in
  let vars = Ui_theme_vars.resolve_layers ~root:palette.root ~body:palette.body
    ~application:palette.application ~overrides:snap.vars in
  let vars = Hashtbl.fold (fun name value vars -> (name, `String value) :: vars)
    vars [] |> List.sort (fun (a, _) (b, _) -> String.compare a b) in
  request_host "theme-snapshot"
    (Yojson.Safe.to_string (`Assoc
      [ "mode", `String snap.mode; "vars", `Assoc vars ]))

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
  if name = "color" then Hashtbl.iter (fun _ -> push_theme_snapshot) theme_snapshots;
  push_ui_state ()

let body_set_data name value = document_set_data name value

let body_rm_data name =
  Hashtbl.remove doc_data name;
  if name = "color" then Hashtbl.iter (fun _ -> push_theme_snapshot) theme_snapshots;
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

(* hosts pass the launched URL's query through here; tests use it to
   reach flags like rtc-test mode *)
let set_location_search s = search_ref := s

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

(* ---------- semantic theme/nav/doc service impls ---------- *)

(* imperative "ls:navigate" navigation: dispatched through the event
   emulation (native/platform.ml emit_event) and mirrored here so service
   observers see the same two channels the browser exposes. *)
let navigate_fns : (unit -> unit) list ref = ref []
let notify_navigate () = List.iter (fun f -> f ()) !navigate_fns

let on_navigate f =
  hash_change_fns := f :: !hash_change_fns;
  navigate_fns := f :: !navigate_fns

let theme_mode () =
  let system =
    match local_storage_get "system-theme?" with
    | Some v -> storage_unquote v = "true"
    | None -> true (* native host is a desktop app — follows system *)
  in
  if system then "system"
  else
    match local_storage_get "theme" with
    | Some v -> (match storage_unquote v with "dark" -> "dark" | _ -> "light")
    | None -> "light"

let theme_set_system_pref v =
  local_storage_set "system-theme?" (if v then "true" else "false")

let theme_set_pref v = local_storage_set "theme" (storage_quote v)

let theme_apply_dataset effective = document_set_data "theme" effective

(* Theme snapshot delivery — serialized through the same host-request
   channel as ui-state/app-icons; FIFO ordering means the host installs
   the application tokens before the ui-state mode flip that follows
   apply_dataset/apply_classes. *)
let theme_apply_snapshot (snap : Ui_services.theme_snapshot) =
  Hashtbl.replace theme_snapshots snap.mode snap;
  push_theme_snapshot snap

let theme_apply_classes effective =
  if effective = "dark" then begin
    root_add_class "dark";
    body_add_class "dark-theme";
    body_rm_class "light-theme";
    body_rm_class "white-theme"
  end
  else begin
    root_rm_class "dark";
    body_rm_class "dark-theme";
    body_add_class "white-theme";
    body_add_class "light-theme"
  end

let preferred_lang () =
  match local_storage_get "preferred-language" with
  | Some v -> storage_unquote v
  | None -> "en"

let set_lang_pref code =
  local_storage_set "preferred-language" (storage_quote code)

let document_refresh : (unit -> unit) option ref = ref None

let doc_reload () =
  match !document_refresh with
  | Some refresh -> refresh ()
  | None -> failwith "Native document is not mounted"

(* wall-clock via Unix — mktime normalizes overflow the way the JS Date
   constructor does (month 13 -> January, day 0 -> previous month) *)
let local_fields ms : Ui_services.date_fields =
  let tm = Unix.localtime (ms /. 1000.) in
  { year = tm.Unix.tm_year + 1900
  ; month = tm.Unix.tm_mon + 1
  ; day = tm.Unix.tm_mday
  ; wday = tm.Unix.tm_wday
  ; hours = tm.Unix.tm_hour
  ; minutes = tm.Unix.tm_min
  ; seconds = tm.Unix.tm_sec
  ; ms = int_of_float (Float.rem ms 1000.)
  }

let of_fields (f : Ui_services.date_fields) =
  let tm =
    { Unix.tm_sec = f.seconds
    ; tm_min = f.minutes
    ; tm_hour = f.hours
    ; tm_mday = f.day
    ; tm_mon = f.month - 1
    ; tm_year = f.year - 1900
    ; tm_wday = 0
    ; tm_yday = 0
    ; tm_isdst = false
    }
  in
  (fst (Unix.mktime tm) *. 1000.) +. float_of_int f.ms

(* the web accepts RFC 3339 and its own Date.parse shapes; here the
   same contract covers RFC 3339, bare YYYY-MM-DD (UTC midnight, as JS
   does), and the "Sep 30, 2026" journal-title shape *)
let month_of_abbr =
  [ "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"; "Jul"; "Aug"; "Sep"
  ; "Oct"; "Nov"; "Dec" ]

let date_parse s =
  match Ptime.of_rfc3339 s with
  | Ok (pt, _, _) -> Some (Ptime.to_float_s pt *. 1000.)
  | Error _ -> (
      let ymd m d y =
        match Ptime.of_date_time ((y, m, d), ((0, 0, 0), 0)) with
        | Some pt -> Some (Ptime.to_float_s pt *. 1000.)
        | None -> None
      in
      (* YYYY-MM-DD *)
      match String.split_on_char '-' s with
      | [ ys; ms'; ds' ] -> (
          match
            ( int_of_string_opt ys
            , int_of_string_opt ms'
            , int_of_string_opt ds' )
          with
          | Some y, Some m, Some d when m >= 1 && m <= 12 && d >= 1 && d <= 31 ->
              ymd m d y
          | _ -> None)
      | _ -> (
          (* "Sep 30, 2026" / "Sep 30th, 2026" *)
          match String.index_opt s ' ' with
          | Some sp when sp = 3 -> (
              match String.index_opt s ',' with
              | Some comma when comma > sp + 1 -> (
                  let mon = String.sub s 0 sp in
                  let rest = String.sub s (sp + 1) (comma - sp - 1) in
                  let digits =
                    String.sub rest 0
                      (String.length rest
                       - (if String.length rest > 2
                             && Char.code rest.[String.length rest - 1] > 57
                          then 2
                          else 0))
                  in
                  match
                    ( List.find_index
                        (fun m -> m = mon)
                        month_of_abbr
                    , int_of_string_opt digits
                    , int_of_string_opt
                        (String.sub s (comma + 2)
                           (String.length s - comma - 2)) )
                  with
                  | Some mi, Some d, Some y -> ymd (mi + 1) d y
                  | _ -> None)
              | _ -> None)
          | _ -> None))

let fmt_date ms =
  let f = local_fields ms in
  Printf.sprintf "%s %d, %d"
    (List.nth month_of_abbr (f.month - 1))
    f.day f.year

let install_ui_services ~paints_caret ~nsh_updates ~assert_owner ~request_flush ~dom ~timers ~files =
  reset_desktop_updates ();
  desktop_updates_enabled := nsh_updates;
  Ui_services.install
    { storage =
        { get = local_storage_get
        ; set = local_storage_set
        ; remove = local_storage_remove
        }
    ; request_flush
    ; native_performance = Some native_performance
    ; desktop_updates = (if nsh_updates then Some desktop_updates else None)
    ; assert_owner
    ; theme =
        { mode = theme_mode
        ; system_default = (fun () -> true)
        ; prefers_dark = Host.prefers_dark
        ; set_system_pref = theme_set_system_pref
        ; set_theme_pref = theme_set_pref
        ; apply_dataset = theme_apply_dataset
        ; apply_classes = theme_apply_classes
        ; apply_snapshot = theme_apply_snapshot
        }
    ; nav =
        { hash = location_hash
        ; set_hash = set_location_hash
        ; replace_hash = replace_url_fragment
        ; back = history_back
        ; forward = history_forward
        ; on_change = on_hash_change
        ; subscribe_change = (fun callback ->
            on_hash_change callback;
            fun () -> hash_change_fns := List.filter (fun f -> f != callback) !hash_change_fns)
        ; on_navigate
        ; search = location_search
        ; query_param
        ; hash_query_param
        ; decode_uri = Uri.pct_decode
        ; reload = doc_reload
        (* the native app has no public origin — share URLs degrade to
           the graph fragment *)
        ; origin = (fun () -> "")
        ; pathname = (fun () -> "")
        }
    ; doc =
        { set_lang = document_set_lang
        ; preferred_lang
        ; set_lang_pref
        ; set_data = document_set_data
        ; rm_data = body_rm_data
        ; set_title = set_document_title
        ; reload = doc_reload
        }
    ; time =
        { now = (fun () -> Unix.gettimeofday () *. 1000.)
        ; local_fields
        ; of_fields
        ; parse = date_parse
        ; parse_natural = date_parse_natural
        ; fmt_date
        }
    ; log = { error = (fun _ -> ()); info = (fun _ -> ())
            ; error_message = prerr_endline }
    ; perf = { mark = perf_mark }
    ; uri =
        { encode_component =
            (fun s -> Uri.pct_encode ~component:`Query_value s)
        }
    ; clipboard =
        { copy = Host.clipboard_write
        ; write_text = clipboard_write_text
        ; read_text = clipboard_read_text
        }
    ; session =
        { get = session_storage_get
        ; set = session_storage_set
        }
    ; env =
        { publishing = (fun () -> false)
        ; dev_build = (fun () -> true)
        ; rtc_test_mode =
            (fun () ->
              match query_param "rtc-test" with
              | Some "true" -> true
              | _ -> false)
        ; online = (fun () -> true)
        ; is_mac
        ; user_agent = (fun () -> "Logseq Native/" ^ Sys.ocaml_version ^ " (" ^ native_system ^ ")")
        ; language = preferred_lang
        ; native_drag = (fun () -> true)
        ; native_block_controls = (fun () -> true)
        ; css_transform_icons = (fun () -> false)
        ; edit_units = (fun () -> `Bytes)
        ; random_uuid = Host.random_uuid
        ; open_url = Host.open_url
        ; resource_url
        ; paints_caret = (fun () -> paints_caret)
        ; component_menus = (fun () -> true)
        ; css_animations = (fun () -> false)
        }
    ; dom
    ; timers
    ; files
    };
  Ui_task.install { enqueue = Host.enqueue; assert_owner };
  (* Platform-owned icon data and launcher build revision. *)
  Icon_data.install ();
  (match Sys.getenv_opt "LOGSEQ_REVISION" with
   | Some r -> Version.set_revision r
   | None -> ())
