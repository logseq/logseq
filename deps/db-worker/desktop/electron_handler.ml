(* Port of src/electron/electron/handler.cljs (+ handler_interface.cljs) —
   the ipcMain "main" channel dispatcher. `handle` mirrors the defmulti:
   dispatch on the first message element's keyword name; every defmethod
   resolves to a Wire.t that set_ipc_handler transit-encodes, unless the
   message's last element is the keyword :js-obj, in which case the raw
   JS value is returned. *)

open Electron_bindings
module E = Db_worker_effect

(* ---------- externals (non-electron npm modules / JS builtins) ------- *)

external new_js_error : string -> Js.Json.t = "Error" [@@mel.new]
external json_as_exn : Js.Json.t -> exn = "%identity"
external json_of_any : 'a -> Js.Json.t = "%identity"
external get_index : 'a -> string -> 'b Js.Undefined.t = "" [@@mel.get_index]

external promise_finally :
  ((unit -> unit)[@u]) -> ('a Js.Promise.t[@mel.this]) -> 'a Js.Promise.t
  = "finally"
[@@mel.send]

external headers_for_each :
  Js.Json.t -> ((Js.Json.t -> string -> unit)[@u]) -> unit = "forEach"
[@@mel.send]

external buffer_from_string :
  string -> encoding:(_[@mel.as "latin1"]) -> Node.Buffer.t = "from"
[@@mel.scope "Buffer"]

external buffer_from_array_buffer :
  Js.Typed_array.ArrayBuffer.t -> Node.Buffer.t = "from"
[@@mel.scope "Buffer"]

external json_of_buffer : Node.Buffer.t -> Js.Json.t = "%identity"

external window_state_manage :
  Electron_window.window_state -> Browser_window.t -> unit = "manage"
[@@mel.send]

external resp_status : Js.Json.t -> int = "status" [@@mel.get]
external resp_status_text : Js.Json.t -> string = "statusText" [@@mel.get]
external resp_ok : Js.Json.t -> bool = "ok" [@@mel.get]
external resp_url : Js.Json.t -> string = "url" [@@mel.get]
external resp_headers : Js.Json.t -> Js.Json.t = "headers" [@@mel.get]
external resp_json : Js.Json.t -> Js.Json.t Js.Promise.t = "json" [@@mel.send]
external resp_text : Js.Json.t -> string Js.Promise.t = "text" [@@mel.send]

external resp_array_buffer :
  Js.Json.t -> Js.Typed_array.ArrayBuffer.t Js.Promise.t = "arrayBuffer"
[@@mel.send]

external buffer_from_any : Js.Json.t -> Node.Buffer.t = "from"
[@@mel.scope "Buffer"]

external array_buffer_is_view : 'a -> bool = "isView"
[@@mel.scope "ArrayBuffer"]

module Fs_node = struct
  external access_sync : string -> int -> unit = "accessSync"
  [@@mel.module "fs"]

  external w_ok : int = "W_OK" [@@mel.module "fs"]
  external chmod_sync : string -> 'a -> unit = "chmodSync" [@@mel.module "fs"]

  external write_file_sync : string -> 'a -> unit = "writeFileSync"
  [@@mel.module "fs"]

  external mkdir_sync : string -> unit = "mkdirSync" [@@mel.module "fs"]

  external mkdir_sync_opts : string -> 'a -> unit = "mkdirSync"
  [@@mel.module "fs"]

  external read_file_sync : string -> Node.Buffer.t = "readFileSync"
  [@@mel.module "fs"]

  external unlink_sync : string -> unit = "unlinkSync" [@@mel.module "fs"]

  external rename_sync : string -> string -> unit = "renameSync"
  [@@mel.module "fs"]

  external exists_sync : string -> bool = "existsSync" [@@mel.module "fs"]

  type stats =
    < dev : float
    ; mode : float
    ; nlink : float
    ; uid : float
    ; gid : float
    ; rdev : float
    ; blksize : float
    ; ino : float
    ; size : float
    ; blocks : float
    ; atimeMs : float
    ; mtimeMs : float
    ; ctimeMs : float
    ; birthtimeMs : float
    ; birthtime : Js.Date.t
    ; mtime : Js.Date.t
    ; ctime : Js.Date.t
    ; isDirectory : unit -> bool [@mel.meth] >
    Js.t

  external stat_sync : string -> stats = "statSync" [@@mel.module "fs"]
end

module Fs_extra = struct
  external copy : string -> string -> 'a Js.Promise.t = "copy"
  [@@mel.module "fs-extra"]

  external path_exists_sync : string -> bool = "pathExistsSync"
  [@@mel.module "fs-extra"]

  external ensure_dir_sync : string -> unit = "ensureDirSync"
  [@@mel.module "fs-extra"]
end

module Graph_lifecycle = struct
  (* snapshot/createGraph/deleteGraph are not on Cli_server.Lifecycle. *)
  external snapshot : Cli_server.storage -> string -> Js.Json.t option
    = "snapshot"
  [@@mel.module "@logseq/graph-lifecycle"] [@@mel.return { undefined_to_opt }]

  external create_graph :
    Cli_server.storage -> Js.Json.t -> Js.Json.t Js.Promise.t = "createGraph"
  [@@mel.module "@logseq/graph-lifecycle"]

  external delete_graph :
    Cli_server.storage ->
    string ->
    ((unit -> Js.Json.t)[@u]) ->
    Js.Json.t Js.Promise.t = "deleteGraph"
  [@@mel.module "@logseq/graph-lifecycle"]
end

module Os_node = struct
  external homedir : unit -> string = "homedir" [@@mel.module "os"]
end

external auto_updater_quit_and_install : bool -> bool -> unit = "quitAndInstall"
[@@mel.module "electron-updater"] [@@mel.scope "autoUpdater"]

type abort_controller =
  < signal : Js.Json.t [@mel.get] ; abort : unit -> unit [@mel.meth] > Js.t

external new_abort_controller : unit -> abort_controller = "AbortController"
[@@mel.new] [@@mel.module "abort-controller"]

(* ---------- small helpers ------------------------------------------- *)

let error_exn (msg : string) : exn = json_as_exn (new_js_error msg)

let str_of_exn (e : exn) : string =
  match Js.Exn.asJsExn e with
  | Some je -> Js.String.make je
  | None -> Printexc.to_string e

let exn_json (e : exn) : Js.Json.t = Cli_server.exn_as_json e
let resolve_nil () : Wire.t Js.Promise.t = Js.Promise.resolve Wire.Nil
let ( let* ) p f = Js.Promise.then_ f p

exception Fetch_timeout

(* promesa's p/timeout: rejects with a TimeoutException once ms elapse *)
let promise_timeout (p : 'a Js.Promise.t) (ms : float) : 'a Js.Promise.t =
  let timer =
    Js.Promise.make (fun ~resolve:_ ~reject ->
        ignore
          (Js.Global.setTimeout
             ~f:(fun () -> (reject Fetch_timeout [@u]))
             (int_of_float ms)))
  in
  Js.Promise.race [| p; timer |]

(* transit ~b values (Buffer/Uint8Array/ArrayBuffer) need a real binary
   check that json_to_wire can't see. *)
let is_js_binary (v : Js.Json.t) : bool =
  Node.Buffer.isBuffer v || array_buffer_is_view v
  ||
  match Js.Json.classify v with
  | Js.Json.JSONObject _ -> (
      match Js.Undefined.toOption (get_index v "constructor") with
      | Some ctor -> (
          match Js.Undefined.toOption (get_index ctor "name") with
          | Some "ArrayBuffer" -> true
          | _ -> false)
      | None -> false)
  | _ -> false

(* local copies of runtime/melange/json.ml's hidden wire_of_json /
   json_of_wire (the spec .mli only exports parse/stringify) *)
let name_part s =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

let rec json_to_wire (json : Js.Json.t) : Wire.t =
  match Js.Json.classify json with
  | Js.Json.JSONFalse -> Wire.Bool false
  | Js.Json.JSONTrue -> Wire.Bool true
  | Js.Json.JSONNull -> Wire.Nil
  | Js.Json.JSONString s -> Wire.String s
  | Js.Json.JSONNumber f ->
      if Float.is_integer f then Wire.Int64 (Int64.of_float f) else Wire.Float f
  | Js.Json.JSONObject o ->
      Wire.Map
        (Array.to_list
           (Array.map
              (fun (k, v) -> (Wire.String k, json_to_wire v))
              (Js.Dict.entries o)))
  | Js.Json.JSONArray a -> Wire.Array (Array.to_list (Array.map json_to_wire a))

let json_key_name = function
  | Wire.String s -> s
  | Wire.Keyword s -> name_part s
  | _ -> invalid_arg "Json.stringify: map key must be string or keyword"

let rec wire_to_json (w : Wire.t) : Js.Json.t =
  match w with
  | Wire.Nil -> Js.Json.null
  | Wire.Bool b -> Js.Json.boolean b
  | Wire.Int i -> Js.Json.number (Float.of_int i)
  | Wire.Int64 i -> Js.Json.number (Int64.to_float i)
  | Wire.Float f -> Js.Json.number f
  | Wire.String s -> Js.Json.string s
  | Wire.Keyword s -> Js.Json.string (name_part s)
  | Wire.Uuid s | Wire.Uri s -> Js.Json.string s
  | Wire.Date_ms ms -> Js.Json.number (Int64.to_float ms)
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      Js.Json.array (Array.map wire_to_json (Array.of_list xs))
  | Wire.Map kvs ->
      Js.Json.object_
        (Js.Dict.fromList
           (List.map (fun (k, v) -> (json_key_name k, wire_to_json v)) kvs))
  | Wire.Binary _ -> invalid_arg "Json.stringify: Binary values unsupported"
  | Wire.Symbol s -> Js.Json.string s
  | Wire.Big_decimal s | Wire.Big_int s -> Js.Json.string s
  | Wire.Tagged (tag, _) ->
      invalid_arg ("Json.stringify: tagged value unsupported: " ^ tag)

let js_to_wire (v : Js.Json.t) : Wire.t =
  if is_js_binary v then
    Wire.Binary (Node.Buffer.toString ~encoding:`latin1 (buffer_from_any v))
  else json_to_wire v

let arg (message : Wire.t) (n : int) : Wire.t =
  match Wire.nth message n with Some v -> v | None -> Wire.Nil

let str_arg (m : Wire.t) (n : int) : string option = Wire.as_string (arg m n)

let str_arg_exn (m : Wire.t) (n : int) : string =
  match str_arg m n with
  | Some s -> s
  | None -> Js.Exn.raiseError (Printf.sprintf "expected string arg %d" n)

let wire_truthy = function Wire.Nil -> false | Wire.Bool b -> b | _ -> true

let canonical_repo (graph : string) : string option =
  Graph_registry.canonical_repo graph

(* utils/fs-stat->clj — {:size :birthtime :mtime :ctime}; dates transit
   as the same JS-time values as the cljs Date objects. *)
let fs_stat_wire (path : string) : Wire.t =
  let s = Fs_node.stat_sync path in
  Wire.kw_map
    [
      ("size", Wire.Float s##size);
      ("birthtime", Wire.Date_ms (Int64.of_float (Js.Date.getTime s##birthtime)));
      ("mtime", Wire.Date_ms (Int64.of_float (Js.Date.getTime s##mtime)));
      ("ctime", Wire.Date_ms (Int64.of_float (Js.Date.getTime s##ctime)));
    ]

(* bean/->js of a cljs Stats object: all enumerable numeric fields on
   string keys. *)
let stats_to_wire (s : Fs_node.stats) : Wire.t =
  Wire.Map
    (List.map
       (fun (k, v) -> (Wire.String k, Wire.Float v))
       [
         ("dev", s##dev);
         ("mode", s##mode);
         ("nlink", s##nlink);
         ("uid", s##uid);
         ("gid", s##gid);
         ("rdev", s##rdev);
         ("blksize", s##blksize);
         ("ino", s##ino);
         ("size", s##size);
         ("blocks", s##blocks);
         ("atimeMs", s##atimeMs);
         ("mtimeMs", s##mtimeMs);
         ("ctimeMs", s##ctimeMs);
         ("birthtimeMs", s##birthtimeMs);
       ])

(* utils/read-file — sync existsSync/readFileSync->toString, catch ->
   log + nil. *)
let read_file_sync (path : string) : string Js.Null.t =
  try
    if Fs_extra.path_exists_sync path then
      Js.Null.return (Node.Buffer.toString (Fs_node.read_file_sync path))
    else Js.Null.empty
  with e ->
    Electron_logger.error_args [| Js.Json.string "Read file:"; exn_json e |];
    Js.Null.empty

(* utils/send-to-renderer window "notification" {...} *)
let send_notification (window : Browser_window.t) ~(typ : string)
    ~(payload : string) ~(i18n_key : string option)
    ~(i18n_args : Js.Json.t array) : unit =
  let d =
    Js.Dict.fromList
      [ ("type", Js.Json.string typ); ("payload", Js.Json.string payload) ]
  in
  (match i18n_key with
  | Some k ->
      Js.Dict.set d "i18n-key" (Js.Json.string k);
      Js.Dict.set d "i18n-args" (Js.Json.array i18n_args)
  | None -> ());
  Electron_utils.send_to_window window "notification" [| Js.Json.object_ d |]

(* string/replace — first occurrence only *)
let replace_first (s : string) (pat : string) (by : string) : string =
  match Js.String.indexOf ~search:pat s with
  | i when i < 0 -> s
  | i ->
      String.sub s 0 i ^ by
      ^ String.sub s
          (i + String.length pat)
          (String.length s - i - String.length pat)

let writable_ (path : string) : bool =
  try
    Fs_node.access_sync path Fs_node.w_ok;
    true
  with _ -> false

let chmod_enabled () : bool =
  match Electron_configs.get_item "feature/enable-automatic-chmod?" with
  | Datascript.Nil -> true
  | Datascript.Bool b -> b
  | _ -> false

(* (nil -> transit nil) for optional string values *)
let wstr_opt (o : string option) : Wire.t =
  match o with Some s -> Wire.String s | None -> Wire.Nil

(* get-files — vec of file-objs {:path :content :stat} *)
let get_files (path : string) : Wire.t list Db_worker_effect.t =
  E.map
    (fun files ->
      List.filter_map
        (fun file_path ->
          let stat = Fs_node.stat_sync file_path in
          if stat##isDirectory () then None
          else
            Some
              (Wire.kw_map
                 [
                   ("path", wstr_opt (Electron_utils.fix_win_path file_path));
                   ( "content",
                     wstr_opt (Js.Null.toOption (read_file_sync file_path)) );
                   ("stat", stats_to_wire stat);
                 ]))
        files)
    (Common_graph.get_files path)

let files_map (path : string) (files : Wire.t list) : Wire.t =
  Wire.kw_map [ ("path", Wire.String path); ("files", Wire.Array files) ]

let open_dir_dialog () : string option Js.Promise.t =
  let* result =
    dialog_show_open_dialog
      (Cli_server.js_obj
         [
           ( "properties",
             Js.Json.stringArray
               [| "openDirectory"; "createDirectory"; "promptToCreate" |] );
         ])
  in
  Js.Promise.resolve
    (match Cli_server.field result "filePaths" with
    | Some paths -> (
        match Js.Json.decodeArray paths with
        | None -> None
        | Some [||] -> None
        | Some arr -> Js.Json.decodeString arr.(0))
    | None -> None)

(* re-matches — the whole Error string must match. *)
let pretty_print_js_error (e : exn) : string option =
  let s = str_of_exn e in
  match
    Regexp.exec
      (Regexp.compile "^(?:Error: )(.+)(?:\\: )(.+)(?:, \\w+ )('.+')$")
      s
  with
  | Some m -> (
      match m.groups with
      | [| _whole; Some code; Some reason; Some path |] ->
          Some
            (String.capitalize_ascii (String.lowercase_ascii reason)
            ^ " for path: " ^ path ^ " (Code: " ^ code ^ ")")
      | _ -> None)
  | None -> None

let blank (s : string) : bool = String.trim s = ""
let get_graphs () : string list = Electron_url.get_graphs ()

let get_graph_name (graph_identifier : string) : string option =
  Electron_url.get_graph_name graph_identifier

let notify_graph_lifecycle (repo : string) ~(phase : Js.Json.t)
    ~(generation : Js.Json.t) : unit =
  let payload =
    Cli_server.js_obj
      [
        ("repo", Js.Json.string repo);
        ("phase", phase);
        ("generation", generation);
      ]
  in
  Array.iter
    (fun window ->
      Web_contents.send_v
        (Browser_window.web_contents window)
        "graph-lifecycle" [| payload |])
    (Electron_window.get_all_windows ())

let on_graph_lifecycle_fn : Js.Json.t =
  json_of_any (fun[@u] (repo : string) (state : Js.Json.t) ->
      notify_graph_lifecycle repo
        ~phase:
          (Option.value (Cli_server.field state "phase") ~default:Js.Json.null)
        ~generation:
          (Option.value
             (Cli_server.field state "generation")
             ~default:Js.Json.null))

(* logseq.cli.common/<unlink-graph! — deleteGraph through resolved
   lifecycle storage; throws when the graph did not exist. *)
let unlink_graph (graphs_dir : string) (repo : string)
    (commit : (unit -> Js.Json.t[@u])) : Wire.t Js.Promise.t =
  let graphs_dir = Common_graph.expand_home graphs_dir in
  let storage =
    Cli_server.Lifecycle.resolve_storage
      (Node.Path.dirname graphs_dir)
      graphs_dir
  in
  Js.Promise.then_
    (fun result ->
      match Cli_server.field_bool result "existed" with
      | Some true ->
          Js.Promise.resolve
            (match Cli_server.field_string result "destination" with
            | Some s -> Wire.String s
            | None -> Wire.Nil)
      | _ ->
          Js.Promise.reject
            (error_exn (Printf.sprintf "Graph does not exist: %s" repo)))
    (Graph_lifecycle.delete_graph storage repo commit)

let stop_all_db_workers () : bool Js.Promise.t =
  Electron_db_worker.stop_all_managed ()

let open_new_window (repo : string option) : Browser_window.t Js.Promise.t =
  Js.Promise.then_
    (fun win ->
      Electron_window.on_close_actions win;
      let _ : unit -> unit = Electron_window.setup_window win in
      Js.Promise.resolve win)
    (Electron_window.create_main_window ~url:Electron_window.main_window_entry
       (Some [%mel.obj { graph = Cli_server.jstr_opt repo }]))

let set_current_graph (window : Browser_window.t) (graph_path : string) : unit =
  Electron_state.set_window_graph window graph_path

(* cljs `keyword` on wire values: keywords/strings give their name *)
let keyword_name (w : Wire.t) : string option =
  match w with Wire.Keyword s | Wire.String s -> Some s | _ -> None

let request_abort_signals : (string, abort_controller) Hashtbl.t =
  Hashtbl.create 8

let response_headers_to_wire (headers : Js.Json.t) : Wire.t =
  match Js.Json.classify headers with
  | Js.Json.JSONNull -> Wire.Map []
  | _ ->
      let result = Js.Dict.empty () in
      headers_for_each headers (fun[@u] value key ->
          Js.Dict.set result key value);
      json_to_wire (Js.Json.object_ result)

(* (request-body->js payload) — nil|string|ArrayBuffer|ArrayBuffer.isView
   pass through, anything else is JSON-stringified. *)
let request_body_js (payload : Wire.t) : Js.Json.t =
  match payload with
  | Wire.Nil -> Js.Json.null
  | Wire.String s -> Js.Json.string s
  | Wire.Binary b ->
      (* cljs keeps the ArrayBuffer; Binary becomes a Buffer (a
         Uint8Array — ArrayBuffer.isView true). *)
      json_of_buffer (Node.Buffer.fromStringWithEncoding b ~encoding:`latin1)
  | w -> Js.Json.string (Js.Json.stringify (wire_to_json w))

let read_response_body (res : Js.Json.t) (return_type : string)
    (method_name : string) : Wire.t Js.Promise.t =
  if method_name = "HEAD" || List.mem (resp_status res) [ 204; 205 ] then
    Js.Promise.resolve Wire.Nil
  else
    match return_type with
    | "json" ->
        Js.Promise.then_
          (fun j -> Js.Promise.resolve (js_to_wire j))
          (resp_json res)
    | "arraybuffer" ->
        Js.Promise.then_
          (fun ab -> Js.Promise.resolve (js_to_wire (json_of_any ab)))
          (resp_array_buffer res)
    | "base64" ->
        Js.Promise.then_
          (fun ab ->
            Js.Promise.resolve
              (Wire.String
                 (Node.Buffer.toString ~encoding:`base64
                    (buffer_from_array_buffer ab))))
          (resp_array_buffer res)
    | _ (* "text" *) ->
        Js.Promise.then_
          (fun s -> Js.Promise.resolve (Wire.String s))
          (resp_text res)

external json_to_buffer : Js.Json.t -> Node.Buffer.t = "%identity"

(* (writeFile content): instance? ArrayBuffer -> Buffer.from, else
   pass through. *)
let content_to_js (w : Wire.t) : Js.Json.t =
  match w with
  | Wire.Binary b ->
      json_of_buffer (Node.Buffer.fromStringWithEncoding b ~encoding:`latin1)
  | _ -> wire_to_json w

(* command-name — (keyword (first message)) name or string *)
let command_name (message : Wire.t) : string option =
  match Wire.nth message 0 with
  | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
  | _ -> None

let option_str (w : Wire.t option) : string option =
  match w with Some (Wire.String s) -> Some s | _ -> None

let truthy_opt (w : Wire.t option) : bool =
  match w with Some v -> wire_truthy v | None -> false

let user_app_cfgs (window : Browser_window.t) (message : Wire.t) :
    Wire.t Js.Promise.t =
  let k_w = arg message 1 and v = arg message 2 in
  match keyword_name k_w with
  | Some k ->
      if not (Wire.is_nil v) then
        let* python_available =
          if
            String.equal k "feature/enable-semantic-search?"
            && v = Wire.Bool true
          then Electron_embedding_server.python_command_available "python3" ()
          else Js.Promise.resolve true
        in
        if not python_available then
          Js.Promise.reject
            (error_exn "python3 is required to enable semantic search")
        else begin
          Electron_configs.set_item k (Ds_wire.value_of_transit v);
          if String.equal k "spell-check" then
            ignore
              (Electron_spell_check.apply_window_spellcheck window
                 (Electron_spell_check.session_spellcheck_enabled
                    (Ds_wire.value_of_transit v)));
          (match v with
          | Wire.Bool false
            when String.equal k "feature/enable-semantic-search?" ->
              Electron_embedding_server.stop ()
          | _ -> ());
          Electron_state.set_config_item k (wire_to_json v);
          resolve_nil ()
        end
      else
        Js.Promise.resolve
          (Ds_wire.transit_of_value (Electron_configs.get_item k))
  | None ->
      Js.Promise.resolve
        (Ds_wire.transit_of_value (Electron_configs.get_config ()))

let run_cli (window : Browser_window.t) (message : Wire.t) : Wire.t Js.Promise.t
    =
  let opts = arg message 1 in
  let command = option_str (Wire.get "command" opts)
  and cli_args = option_str (Wire.get "args" opts)
  and return_result = truthy_opt (Wire.get "returnResult" opts) in
  try
    let command = Option.value command ~default:""
    and cli_args = Option.value cli_args ~default:"" in
    let on_data (msg : 'a) : unit =
      let result = "Running " ^ command ^ ": " ^ Js.String.make msg in
      if return_result then
        Electron_utils.send_to_window window "notification"
          [|
            Cli_server.js_obj
              [
                ("type", Js.Json.string "success");
                ("payload", Js.Json.string result);
              ];
          |]
    in
    Js.Promise.make (fun ~resolve ~reject:_ ->
        let on_exit (code : Js.Json.t) : unit =
          (resolve (js_to_wire code) [@u])
        in
        ignore
          (Electron_shell.run_command_safely ~on_data ~on_exit command cli_args))
  with e ->
    send_notification window ~typ:"error"
      ~payload:(Electron_configs.exn_message e)
      ~i18n_key:None ~i18n_args:[||];
    resolve_nil ()

(* cljs (bean/->js) then JSON.stringify keying *)
let wire_stringify (w : Wire.t) : string = Js.Json.stringify (wire_to_json w)
let req_key (w : Wire.t) : string = wire_stringify w

let http_request (message : Wire.t) : Wire.t Js.Promise.t =
  let req_id = arg message 1 and opts = arg message 2 in
  match option_str (Wire.get "url" opts) with
  | Some url when not (blank url) ->
      let method_name =
        String.uppercase_ascii
          (Option.value
             (Option.bind (Wire.get "method" opts) keyword_name)
             ~default:"GET")
      in
      let return_type =
        String.lowercase_ascii
          (Option.value
             (Option.bind (Wire.get "returnType" opts) keyword_name)
             ~default:"json")
      in
      let payload =
        match Wire.get "body" opts with
        | Some b when not (Wire.is_nil b) -> b
        | _ -> (
            match Wire.get "data" opts with Some d -> d | None -> Wire.Nil)
      in
      let timeout_ms =
        match Wire.get "timeout" opts with
        | Some (Wire.Int n) when n > 0 -> Some (Float.of_int n)
        | Some (Wire.Int64 n) when Int64.compare n 0L > 0 ->
            Some (Int64.to_float n)
        | Some (Wire.Float f) when Float.compare f 0. > 0 -> Some f
        | _ -> None
      in
      let abortable = truthy_opt (Wire.get "abortable" opts) in
      let controller =
        if abortable || Option.is_some timeout_ms then
          Some (new_abort_controller ())
        else None
      in
      let timeout_id =
        match (timeout_ms, controller) with
        | Some ms, Some c ->
            Some
              (Js.Global.setTimeout
                 ~f:(fun () -> c##abort ())
                 (int_of_float ms))
        | _ -> None
      in
      let key = req_key req_id in
      (match controller with
      | Some c -> Hashtbl.replace request_abort_signals key c
      | None -> ());
      let fetch_opts = Js.Dict.empty () in
      Js.Dict.set fetch_opts "method" (Js.Json.string method_name);
      (match Wire.get "headers" opts with
      | Some h when not (Wire.is_nil h) ->
          Js.Dict.set fetch_opts "headers" (wire_to_json h)
      | _ -> ());
      (match method_name with
      | "GET" | "HEAD" -> ()
      | _ ->
          if not (Wire.is_nil payload) then
            Js.Dict.set fetch_opts "body" (request_body_js payload));
      (match controller with
      | Some c -> Js.Dict.set fetch_opts "signal" c##signal
      | None -> ());
      Electron_utils.fetch url (Some fetch_opts)
      |> Js.Promise.then_ (fun res ->
          Js.Promise.then_
            (fun payload ->
              if truthy_opt (Wire.get "includeResponse" opts) then
                Js.Promise.resolve
                  (Wire.kw_map
                     [
                       ("status", Wire.Float (Float.of_int (resp_status res)));
                       ("statusText", Wire.String (resp_status_text res));
                       ("ok", Wire.Bool (resp_ok res));
                       ("url", Wire.String (resp_url res));
                       ("headers", response_headers_to_wire (resp_headers res));
                       ("body", payload);
                     ])
              else Js.Promise.resolve payload)
            (read_response_body res return_type method_name))
      |> Js.Promise.catch (fun e ->
          Js.Promise.reject (Cli_server.promise_error_as_exn e))
      |> promise_finally (fun[@u] () ->
          (match timeout_id with
          | Some id -> Js.Global.clearTimeout id
          | None -> ());
          Hashtbl.remove request_abort_signals key)
  | _ -> resolve_nil ()

(* ---------- the defmulti -------------------------------------------- *)

let handle (window : Browser_window.t) (message : Wire.t) : Wire.t Js.Promise.t
    =
  match command_name message with
  | Some "mkdir" ->
      Fs_node.mkdir_sync (str_arg_exn message 1);
      resolve_nil ()
  | Some "mkdir-recur" ->
      Fs_node.mkdir_sync_opts (str_arg_exn message 1) [%mel.obj { recursive = true }];
      resolve_nil ()
  | Some "readdir" ->
      let dir = str_arg_exn message 1 in
      let* files = Cli_server.promise_of_task (Common_graph.readdir dir) in
      Js.Promise.resolve (Wire.List (List.map (fun s -> Wire.String s) files))
  | Some "listdir" -> (
      let flat = match arg message 2 with Wire.Bool b -> b | _ -> true in
      match str_arg message 1 with
      | Some dir when Fs_extra.path_exists_sync dir ->
          let* res = Electron_js_utils.deep_read_dir ~flat dir in
          Js.Promise.resolve (js_to_wire res)
      | _ -> resolve_nil ())
  | Some "unlink" -> (
      let repo_dir = str_arg message 1 and path = str_arg message 2 in
      match (repo_dir, path) with
      | Some repo_dir, Some path ->
          (if
             Electron_plugin.dotdir_file (Some path)
             || Electron_plugin.assetsdir_file (Some path)
           then Fs_node.unlink_sync path
           else
             try
               Electron_logger.info_args
                 [|
                   Js.Json.string ":electron.handler/unlink";
                   Cli_server.js_obj [ ("path", Js.Json.string path) ];
                 |];
               let file_name =
                 path |> fun p ->
                 replace_first p (repo_dir ^ "/") "" |> fun p ->
                 Common_util.str_replace_all p "/" "_" |> fun p ->
                 Common_util.str_replace_all p "\\" "_"
               in
               let recycle_dir = repo_dir ^ "/logseq/.recycle" in
               Fs_extra.ensure_dir_sync recycle_dir;
               let new_path = recycle_dir ^ "/" ^ file_name in
               Fs_node.rename_sync path new_path;
               Electron_logger.debug_args
                 [| ":electron.handler/unlink"; "recycle to"; new_path |]
             with e ->
               Electron_logger.error_args
                 [|
                   Js.Json.string ":electron.handler/unlink";
                   Js.Json.string path;
                   exn_json e;
                 |]);
          resolve_nil ()
      | _ -> resolve_nil ())
  | Some "openFileInFolder" ->
      (match
         Option.bind (str_arg message 1) Electron_utils.to_native_win_path
       with
      | Some full_path ->
          Electron_logger.info_args
            [| ":electron.handler/open-file-in-folder"; full_path |];
          Shell_.show_item_in_folder full_path
      | None -> ());
      resolve_nil ()
  | Some "readFile" -> (
      match str_arg message 1 with
      | Some path ->
          let* contents = Electron_utils.read_file path in
          Js.Promise.resolve
            (match Js.Null.toOption contents with
            | Some s -> Wire.String s
            | None -> Wire.Nil)
      | None -> resolve_nil ())
  | Some "readFileRaw" ->
      (* cljs returns a Buffer — transit encodes it as ~b bytes *)
      Js.Promise.resolve
        (Wire.Binary
           (Node.Buffer.toString ~encoding:`latin1
              (Fs_node.read_file_sync (str_arg_exn message 1))))
  | Some "copyFile" ->
      Electron_logger.info_args
        [|
          Js.Json.string ":electron.handler/copy-file";
          Cli_server.jstr_opt (str_arg message 2);
          Cli_server.jstr_opt (str_arg message 3);
        |];
      let* _ = Fs_extra.copy (str_arg_exn message 2) (str_arg_exn message 3) in
      resolve_nil ()
  | Some "writeFile" -> (
      let repo = str_arg message 1
      and path = str_arg message 2
      and content = arg message 3 in
      match path with
      | Some path -> (
          let content_js = content_to_js content in
          try
            if chmod_enabled () && Fs_node.exists_sync path && not (writable_ path)
            then Fs_node.chmod_sync path "644";
            Fs_node.write_file_sync path content_js;
            Js.Promise.resolve (fs_stat_wire path)
          with e ->
            Electron_logger.warn_args
              [|
                Js.Json.string ":electron.handler/write-file";
                Js.Json.string path;
                exn_json e;
              |];
            let error_message = str_of_exn e in
            (* cljs backup-file returns nil in every path — the
                 notification always takes the non-backup branch;
                 keep the branch anyway for fidelity. *)
            let backup_path : string option =
              try
                match repo with
                | Some repo ->
                    (* cljs passes the raw content arg; fs
                         writeFileSync throws unless it is a
                         string/Buffer — mirror that by failing for
                         other transit types. The peer API takes
                         string content, so Binary goes through its
                         latin1 string form. *)
                    let content_str =
                      match content with
                      | Wire.String s -> s
                      | Wire.Binary b -> b
                      | _ ->
                          invalid_arg
                            "writeFileSync: data must be a string or Buffer"
                    in
                    Electron_backup_file.backup_file ~repo ~dir:`Backup_dir
                      ~relative_path:path ~ext:(Node.Path.extname path)
                      ~content:content_str ();
                    None
                | None -> None
              with backup_error ->
                Electron_logger.error_args
                  [|
                    Js.Json.string ":electron.handler/write-file";
                    Js.Json.string "backup file failed:";
                    exn_json backup_error;
                  |];
                None
            in
            (match backup_path with
            | Some backup ->
                send_notification window ~typ:"error"
                  ~payload:
                    (Printf.sprintf
                       "Write to the file %s failed, %s. A backup file was \
                        saved to %s."
                       path error_message backup)
                  ~i18n_key:(Some "electron/write-file-error-with-backup")
                  ~i18n_args:
                    [|
                      Js.Json.string path;
                      Js.Json.string error_message;
                      Js.Json.string backup;
                    |]
            | None ->
                send_notification window ~typ:"error"
                  ~payload:
                    (Printf.sprintf "Write to the file %s failed, %s" path
                       error_message)
                  ~i18n_key:(Some "electron/write-file-error")
                  ~i18n_args:
                    [| Js.Json.string path; Js.Json.string error_message |]);
            resolve_nil ())
      | None -> resolve_nil ())
  | Some "rename" ->
      let old_path = str_arg_exn message 1
      and new_path = str_arg_exn message 2 in
      Electron_logger.info_args
        [| ":electron.handler/rename"; "from"; old_path; "to"; new_path |];
      Fs_node.rename_sync old_path new_path;
      resolve_nil ()
  | Some "stat" ->
      let path = str_arg_exn message 1 in
      Js.Promise.resolve (fs_stat_wire path)
  | Some "openDir" -> (
      Electron_logger.info_args
        [| ":electron.handler/open-dir"; "open folder selection dialog" |];
      let* path_opt = open_dir_dialog () in
      let path = Option.bind path_opt Electron_utils.fix_win_path in
      Electron_logger.debug_args
        [|
          Js.Json.string ":electron.handler/open-dir";
          Cli_server.js_obj [ ("path", Cli_server.jstr_opt path) ];
        |];
      match path with
      | Some path ->
          Cli_server.promise_of_task
            (E.catch
               (E.map (fun files -> files_map path files) (get_files path))
               (fun e ->
                 match Js.Exn.asJsExn e with
                 | Some _ ->
                     let error_message =
                       match pretty_print_js_error e with
                       | Some m -> m
                       | None -> "Unexpected error: " ^ str_of_exn e
                     in
                     send_notification window ~typ:"error"
                       ~payload:
                         ("Opening the specified directory failed.\n"
                        ^ error_message)
                       ~i18n_key:(Some "electron/open-dir-error")
                       ~i18n_args:[| Js.Json.string error_message |];
                     E.error e
                 | None -> E.error e))
      | None -> Js.Promise.reject (error_exn "path empty"))
  | Some "getFiles" -> (
      match str_arg message 1 with
      | Some path ->
          Electron_logger.debug_args
            [|
              Js.Json.string ":electron.handler/get-files";
              Cli_server.js_obj [ ("path", Js.Json.string path) ];
            |];
          Cli_server.promise_of_task
            (E.map (fun files -> files_map path files) (get_files path))
      | None -> resolve_nil ())
  | Some "getGraphs" ->
      Js.Promise.resolve
        (Wire.List (List.map (fun s -> Wire.String s) (get_graphs ())))
  | Some "upsertGraphRegistryEntry" ->
      Js.Promise.resolve
        (match Electron_configs.upsert_graph_registry_entry (arg message 1) with
        | Some entries -> Wire.List entries
        | None -> Wire.Nil)
  | Some "deleteGraph" -> (
      match Option.bind (str_arg message 1) canonical_repo with
      | Some repo ->
          let graphs_dir = Common_graph.get_db_graphs_dir () in
          let current =
            Graph_lifecycle.snapshot
              (Cli_server.resolve_storage
                 (Cli_server.config_of_js (Js.Json.object_ (Js.Dict.empty ()))))
              repo
          in
          let generation =
            Option.bind current (fun c -> Cli_server.field c "generation")
            |> Option.value ~default:Js.Json.null
          in
          Electron_db_worker.invalidate_repo Electron_db_worker.manager_state
            repo;
          notify_graph_lifecycle repo
            ~phase:(Js.Json.string "deleting")
            ~generation;
          unlink_graph graphs_dir repo (fun[@u] () ->
              notify_graph_lifecycle repo ~phase:(Js.Json.string "deleted")
                ~generation;
              Cli_server.js_obj [ ("ok", Js.Json.boolean true) ])
      | None -> resolve_nil ())
  | Some "createGraph" ->
      let* generation =
        Graph_lifecycle.create_graph
          (Cli_server.resolve_storage
             (Cli_server.config_of_js (Js.Json.object_ (Js.Dict.empty ()))))
          (match Option.bind (str_arg message 1) canonical_repo with
          | Some repo -> Js.Json.string repo
          | None -> Js.Json.null)
      in
      Js.Promise.resolve (js_to_wire generation)
  | Some "db-worker-runtime" -> (
      match str_arg message 1 with
      | Some repo when not (blank repo) ->
          let* embedding_endpoint =
            if Electron_configs.semantic_search_enabled () then
              Js.Promise.then_
                (fun e -> Js.Promise.resolve (Some e))
                (Electron_embedding_server.ensure_endpoint App.t)
            else Js.Promise.resolve None
          in
          let opts_json = Js.Dict.empty () in
          (match Wire.get "generation" (arg message 2) with
          | Some g -> Js.Dict.set opts_json "generation" (wire_to_json g)
          | None -> ());
          Js.Dict.set opts_json "on-graph-lifecycle!" on_graph_lifecycle_fn;
          (match Option.bind embedding_endpoint Js.Nullable.toOption with
          | Some endpoint -> (
              Js.Dict.set opts_json "embedding-endpoint"
                (Js.Json.string endpoint);
              match Js.Dict.get process_env "LOGSEQ_EMBEDDING_MODEL" with
              match Js.Dict.get (process_env ()) "LOGSEQ_EMBEDDING_MODEL" with
              | Some m ->
                  Js.Dict.set opts_json "embedding-model-id" (Js.Json.string m)
              | None -> ())
          | None -> ());
          let* runtime =
            Electron_db_worker.ensure_runtime
              (Option.get (canonical_repo repo))
              (Browser_window.id window)
              ~opts:(Js.Json.object_ opts_json)
              ()
          in
          Js.Promise.resolve
            (Wire.kw_map
               [
                 ("repo", Wire.String runtime.repo);
                 ("root-dir", Wire.String runtime.root_dir);
                 ("generation", wstr_opt runtime.generation);
                 ("base-url", wstr_opt runtime.base_url);
                 ("auth-token", js_to_wire runtime.auth_token);
                 ( "owned?",
                   match runtime.owned with
                   | Some b -> Wire.Bool b
                   | None -> Wire.Nil );
               ])
      | _ -> Js.Promise.reject (error_exn "repo is required"))
  | Some "releaseDbWorkerRuntime" -> (
      match str_arg message 1 with
      | Some repo when not (blank repo) ->
          let* result =
            Electron_db_worker.release_runtime
              (Option.get (canonical_repo repo))
              (Browser_window.id window) ()
          in
          Js.Promise.resolve (Wire.Bool result)
      | _ -> Js.Promise.reject (error_exn "repo is required"))
  | Some "db-export" -> (
      match Option.bind (str_arg message 1) canonical_repo with
      | Some repo ->
          ignore (Electron_db.ensure_graph_dir repo);
          let* result =
            Electron_db.backup_db_via_worker ~db_name:repo
              ~window_id:(Browser_window.id window)
              ~opts:
                (Cli_server.js_obj
                   [
                     ( "force-backup?",
                       Js.Json.boolean (wire_truthy (arg message 2)) );
                   ])
          in
          Js.Promise.resolve
            (Wire.kw_map
               [
                 ("backup-name", wstr_opt result.backup_name);
                 ("path", wstr_opt result.path);
                 ("created", Wire.Bool result.created);
                 ("reason", wstr_opt result.reason);
               ])
      | None -> resolve_nil ())
  | Some "db-export-as" -> (
      match
        (Option.bind (str_arg message 1) canonical_repo, str_arg message 2)
      with
      | Some repo, Some filename ->
          let* result =
            Electron_db.export_db_to_export_dir_via_worker ~db_name:repo
              ~window_id:(Browser_window.id window) ~filename
          in
          Js.Promise.resolve (Ds_wire.transit_of_value result)
      | _ -> resolve_nil ())
  | Some "db-get" -> (
      match Option.bind (str_arg message 1) canonical_repo with
      | Some repo ->
          Electron_logger.warn_args
            [|
              Js.Json.string ":electron.handler/db-get-compat";
              Cli_server.js_obj
                [
                  ("repo", Js.Json.string repo);
                  ( "message",
                    Js.Json.string
                      "legacy db-get IPC path invoked; desktop should use \
                       db-worker runtime" );
                ];
            |];
          Js.Promise.resolve
            (match Electron_db.get_db repo with
            | Some b when Node.Buffer.isBuffer b ->
                Wire.Binary
                  (Node.Buffer.toString ~encoding:`latin1 (json_to_buffer b))
            | _ -> Wire.Nil)
      | None -> resolve_nil ())
  | Some "openDialog" ->
      let* path = open_dir_dialog () in
      Js.Promise.resolve
        (match path with Some p -> Wire.String p | None -> Wire.Nil)
  | Some "showOpenDialog" ->
      let* result = dialog_show_open_dialog (wire_to_json (arg message 1)) in
      Js.Promise.resolve (js_to_wire result)
  | Some "getLogseqDotDirRoot" ->
      Js.Promise.resolve
        (match Electron_utils.get_ls_dotdir_root () with
        | Some p -> Wire.String p
        | None -> Wire.Nil)
  | Some "setProxy" ->
      let proxy =
        Electron_utils.proxy_of_value (Ds_wire.value_of_transit (arg message 1))
      in
      let* () = Electron_utils.set_proxy proxy in
      Electron_utils.save_proxy_settings proxy;
      resolve_nil ()
  | Some "testProxyUrl" -> (
      match str_arg message 1 with
      | Some url ->
          let opts = Js.Dict.empty () in
          Js.Dict.set opts "proxy" (wire_to_json (arg message 2));
          let start_ms = Js.Date.now () in
          promise_timeout
            (Js.Promise.then_
               (fun resp ->
                 let code = resp_status resp in
                 let response_ms = Js.Date.now () -. start_ms in
                 if code >= 200 && code <= 299 then
                   Js.Promise.resolve
                     (Wire.kw_map
                        [
                          ("code", Wire.Float (Float.of_int code));
                          ("response-ms", Wire.Float response_ms);
                        ])
                 else
                   Js.Promise.reject
                     (error_exn (Printf.sprintf "HTTP status %d" code)))
               (Electron_utils.fetch url (Some opts)))
            10000.0
          |> Js.Promise.catch (fun e ->
              match Cli_server.promise_error_as_exn e with
              | Fetch_timeout -> Js.Promise.reject (error_exn "Timeout")
              | exn -> Js.Promise.reject exn)
      | None -> resolve_nil ())
  | Some "httpFetchJSON" -> (
      match str_arg message 1 with
      | Some url ->
          let* res =
            Electron_utils.fetch url
              (match Js.Json.classify (wire_to_json (arg message 2)) with
              | Js.Json.JSONObject dict -> Some dict
              | _ -> Some (Js.Dict.empty ()))
          in
          let* json = resp_json res in
          Js.Promise.resolve (js_to_wire json)
      | None -> resolve_nil ())
  | Some "getUserDefaultPlugins" ->
      Js.Promise.resolve
        (Wire.List
           (List.map
              (fun s -> Wire.String s)
              (Electron_utils.get_ls_default_plugins ())))
  | Some "validateUserExternalPlugins" ->
      let urls = Wire.as_seq (arg message 1) in
      Js.Promise.resolve
        (Wire.Map
           (List.map
              (fun url_w ->
                let url =
                  match Wire.as_string url_w with Some s -> s | None -> ""
                in
                ( url_w,
                  Wire.Bool
                    (try
                       Fs_extra.path_exists_sync url
                       && Fs_extra.path_exists_sync
                            (Node.Path.join [| url; "package.json" |])
                     with _ -> false) ))
              urls))
  | Some "relaunchApp" ->
      App.relaunch App.t None;
      App.quit App.t;
      resolve_nil ()
  | Some "quitApp" ->
      App.quit App.t;
      resolve_nil ()
  | Some "userAppCfgs" -> user_app_cfgs window message
  | Some "getAppBaseInfo" ->
      Js.Promise.resolve
        (Wire.kw_map
           [
             ("isFullScreen", Wire.Bool (Browser_window.is_full_screen window));
             ("isMaximized", Wire.Bool (browser_window_is_maximized window));
             ("platform", Wire.String process_platform);
             ("arch", Wire.String process_arch);
           ])
  | Some "getAssetsFiles" -> (
      match Electron_state.window_graph_path window with
      | Some graph_path ->
          let assets_path = Node.Path.join [| graph_path; "assets" |] in
          if Fs_extra.path_exists_sync assets_path then
            let exts =
              match Wire.get "exts" (arg message 1) with
              | Some (Wire.Array xs | Wire.List xs) ->
                  Some (Array.of_list (List.filter_map Wire.as_string xs))
              | _ -> None
            in
            let* files = Electron_js_utils.get_all_files assets_path exts in
            Js.Promise.resolve (js_to_wire (json_of_any files))
          else resolve_nil ()
      | None -> resolve_nil ())
  | Some "setCurrentGraph" ->
      let graph_name = str_arg message 1 in
      let next_graph_path =
        Option.bind graph_name Electron_utils.get_graph_dir
      in
      let current_graph_path = Electron_state.window_graph_path window in
      let release_runtime =
        Electron_graph_switch_flow.release_runtime_on_set_current_graph
          (Cli_server.js_obj
             [
               ("previous-graph-path", Cli_server.jstr_opt current_graph_path);
               ("next-graph-path", Cli_server.jstr_opt next_graph_path);
             ])
      in
      let* () =
        if release_runtime then
          Js.Promise.then_
            (fun (_ : bool) -> Js.Promise.resolve ())
            (Electron_db_worker.release_window (Browser_window.id window))
        else Js.Promise.resolve ()
      in
      Electron_db.sync_auto_backup_repo (Browser_window.id window) graph_name;
      (match next_graph_path with
      | Some path -> set_current_graph window path
      | None -> Electron_state.close_window window);
      resolve_nil ()
  | Some "updateElectronLocale" ->
      (match str_arg message 1 with
      | Some locale -> Electron_i18n.update_locale locale
      | None -> ());
      resolve_nil ()
  | Some "runCli" -> run_cli window message
  | Some "installMarketPlugin" | Some "updateMarketPlugin" ->
      Electron_plugin.install_or_update (arg message 1)
      |> Js.Promise.then_ (fun () -> resolve_nil ())
  | Some "uninstallMarketPlugin" ->
      Electron_plugin.uninstall (str_arg_exn message 1);
      resolve_nil ()
  | Some "httpRequest" -> http_request message
  | Some "httpRequestAbort" ->
      (match str_arg message 1 with
      | Some req_id -> (
          match Hashtbl.find_opt request_abort_signals req_id with
          | Some controller -> controller##abort ()
          | None -> ())
      | None -> ());
      resolve_nil ()
  | Some "quitAndInstall" ->
      Electron_logger.info_args [| ":electron.handler/quick-and-install" |];
      auto_updater_quit_and_install false true;
      resolve_nil ()
  | Some "graphHasOtherWindow" ->
      Js.Promise.resolve
        (Wire.Bool
           (match
              Option.bind (str_arg message 1) Electron_utils.get_graph_dir
            with
           | Some dir -> Electron_window.graph_has_other_window window dir
           | None -> false))
  | Some "graphHasMultipleWindows" ->
      Js.Promise.resolve
        (Wire.Bool
           (match
              Option.bind (str_arg message 1) Electron_utils.get_graph_dir
            with
           | Some dir ->
               List.length (Electron_window.get_graph_all_windows dir) > 1
           | None -> List.length (Electron_window.get_graph_all_windows "") > 1))
  | Some "openNewWindow" ->
      Electron_logger.info_args [| ":electron.handler/open-new-window" |];
      let* (_ : Browser_window.t) = open_new_window (str_arg message 1) in
      resolve_nil ()
  | Some "graphReady" ->
      (match Electron_state.take_once_graph_ready () with
      | Some f -> (
          match str_arg message 1 with
          | Some graph_name -> f window graph_name
          | None -> ())
      | None -> ());
      resolve_nil ()
  | Some "window-minimize" ->
      Browser_window.minimize window;
      resolve_nil ()
  | Some "window-toggle-maximized" ->
      if browser_window_is_maximized window then
        browser_window_unmaximize window
      else browser_window_maximize window;
      resolve_nil ()
  | Some "window-toggle-fullscreen" ->
      Browser_window.set_full_screen window
        (not (Browser_window.is_full_screen window));
      resolve_nil ()
  | Some "window-close" ->
      Browser_window.close window;
      resolve_nil ()
  | Some "set-window-title" ->
      (match str_arg message 1 with
      | Some title ->
          if not (Browser_window.is_destroyed window) then
            browser_window_set_title window title
      | None -> ());
      resolve_nil ()
  | Some "theme-loaded" ->
      window_state_manage
        (Electron_window.window_state_keeper Js.Undefined.empty)
        window;
      resolve_nil ()
  | Some "keychain/save-e2ee-password" -> (
      match str_arg message 2 with
      | Some text ->
          Js.Promise.then_
            (fun r -> Js.Promise.resolve (Wire.Bool r))
            (Electron_keychain.set_password (str_arg message 1) text)
      | _ -> resolve_nil ())
  | Some "keychain/get-e2ee-password" ->
      Js.Promise.then_
        (fun r ->
          Js.Promise.resolve
            (match Js.Nullable.toOption r with
            | Some s -> Wire.String s
            | None -> Wire.Nil))
        (Electron_keychain.get_password (str_arg message 1))
  | Some "keychain/delete-e2ee-password" ->
      Js.Promise.then_
        (fun r -> Js.Promise.resolve (Wire.Bool r))
        (Electron_keychain.delete_password (str_arg message 1))
  | Some "find-in-page" ->
      Js.Promise.resolve
        (Wire.Bool
           (Electron_find_in_page.find (Js.Null.return window)
              (Option.value (str_arg message 1) ~default:"")
              (wire_to_json (arg message 2))))
  | Some "clear-find-in-page" ->
      Electron_find_in_page.clear (Js.Null.return window);
      resolve_nil ()
  | Some "server/load-state" ->
      Electron_server.load_state_to_renderer ();
      resolve_nil ()
  | Some "server/do" ->
      Electron_server.do_server (str_arg_exn message 1);
      resolve_nil ()
  | Some "server/set-config" ->
      Electron_server.set_config (Ds_wire.value_of_transit (arg message 1));
      resolve_nil ()
  | Some "system/info" ->
      Js.Promise.resolve
        (Wire.kw_map
           [
             ("home-dir", Wire.String (Os_node.homedir ()));
             ("graphs-dir", Wire.String (Common_graph.get_db_graphs_dir ()));
           ])
  | Some "window/open-blank-callback" ->
      let _ : unit -> unit = Electron_window.setup_window window in
      resolve_nil ()
  | _ ->
      (* cljs defmethod :default binds [args] = the window — logging the
         window object there is a cljs quirk preserved here. *)
      Electron_logger.error_args
        [| Js.Json.string "Error: no ipc handler for:"; json_of_any window |];
      resolve_nil ()

(* ---------- ipc plumbing --------------------------------------------- *)

let decode_main_ipc_message (args_js : Js.Json.t) : Wire.t =
  match Js.Json.decodeString args_js with
  | Some s -> Transit_codec.of_string s
  | None -> js_to_wire args_js

(* (some-> message last keyword) = :js-obj? *)
let ends_with_js_obj (message : Wire.t) : bool =
  match List.rev (Wire.as_seq message) with
  | Wire.Keyword s :: _ | Wire.String s :: _ -> String.equal s "js-obj"
  | _ -> false

(* bean/->js of the handler result — Binary needs a real Buffer. *)
let result_to_json (w : Wire.t) : Js.Json.t =
  match w with
  | Wire.Binary b ->
      json_of_buffer (Node.Buffer.fromStringWithEncoding b ~encoding:`latin1)
  | _ -> wire_to_json w

let set_ipc_handler (window : Browser_window.t) : unit -> unit =
  let main_channel = "main" in
  Ipc_main.handle main_channel (fun[@u] event args_js ->
      let message_ref : Wire.t option ref = ref None in
      Js.Promise.catch
        (fun e ->
          let command =
            match !message_ref with Some m -> command_name m | None -> None
          in
          (match command with
          | Some "mkdir" | Some "stat" -> ()
          | _ ->
              Electron_logger.error_args
                [|
                  Js.Json.string "IPC error: ";
                  Cli_server.js_obj
                    [ ("event", json_of_any event); ("args", args_js) ];
                  Cli_server.promise_error_as_exn e |> exn_json;
                |]);
          Js.Promise.reject (Cli_server.promise_error_as_exn e))
        (Js.Promise.then_
           (fun (message, result) ->
             if ends_with_js_obj message then
               Js.Promise.resolve (result_to_json result)
             else
               Js.Promise.resolve
                 (Js.Json.string (Transit_codec.to_string result)))
           (Js.Promise.then_
              (fun message ->
                message_ref := Some message;
                Js.Promise.then_
                  (fun result -> Js.Promise.resolve (message, result))
                  (handle
                     (match Electron_utils.get_win_from_sender event with
                     | Some w -> w
                     | None -> window)
                     message))
              (Js.Promise.resolve (decode_main_ipc_message args_js)))));
  fun () -> Ipc_main.remove_handler main_channel
