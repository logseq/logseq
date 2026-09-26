(* Port of electron.server — the fastify HTTP API server that proxies
   requests into the renderer over :invokeLogseqAPI. npm externals
   (fastify, @fastify/cors) live here; request/reply helpers live in
   Electron_mcp_transport. *)

module Fastify = struct
  type t

  type request = Electron_mcp_transport.request

  type reply = Electron_mcp_transport.reply

  external make :
    < logger : bool
    ; requestTimeout : int
    ; forceCloseConnections : bool >
    Js.t ->
    t = "default"
    [@@mel.new] [@@mel.module "fastify"]

  external cors_plugin : Js.Json.t = "default"
    [@@mel.module "@fastify/cors"]

  external register : t -> 'plugin -> 'opts -> unit Js.Promise.t
    = "register" [@@mel.send]

  external add_hook :
    t ->
    string ->
    (request -> reply -> (unit -> unit [@u]) -> unit [@u]) ->
    t = "addHook" [@@mel.send]

  external post :
    t -> string -> (request -> reply -> 'a [@u]) -> t = "post"
    [@@mel.send]

  external get :
    t -> string -> (request -> reply -> 'a [@u]) -> t = "get"
    [@@mel.send]

  external delete :
    t -> string -> (request -> reply -> 'a [@u]) -> t = "delete"
    [@@mel.send]

  external listen : t -> 'opts -> unit Js.Promise.t = "listen"
    [@@mel.send]

  external close : t -> unit Js.Promise.t = "close" [@@mel.send]
end

module Fs_extra = struct
  (* `[@mel.as "utf8"]` params are erased from the call site but emitted
     as the constant arg, so this emits readFileSync(path, "utf8"). *)
  external read_file_utf8 :
    string -> (_ [@mel.as "utf8"]) -> string = "readFileSync"
    [@@mel.module "fs-extra"]
end

external __dirname : string = "__dirname"

external get_index : 'a -> string -> 'b Js.Undefined.t = ""
  [@@mel.get_index]

external js_error_make : string -> Js.Json.t = "Error" [@@mel.new]

external exn_as_json : exn -> Js.Json.t = "%identity"
external promise_error_as_json : Js.Promise.error -> Js.Json.t
  = "%identity"
external promise_error_as_exn : Js.Promise.error -> exn = "%identity"

external console_error_args : 'a array -> unit = "error"
  [@@mel.scope "console"] [@@mel.variadic]

let js_obj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

(* ---------- atoms ---------- *)

let win : Electron_bindings.Browser_window.t option ref = ref None
let server : Fastify.t option ref = ref None

(* *state — a JS object mirroring the cljs map {:status :error :host
   :port :tokens :autostart :mcp-enabled?}; keys keep their kebab-case
   names because bean/->js preserves them for the renderer. *)
let state : Js.Json.t ref = ref Js.Json.null

(* cljs add-watch emulation: (old-state -> new-state -> unit) *)
let watchers : (Js.Json.t -> Js.Json.t -> unit) list ref = ref []

let set_state (v : Js.Json.t) : unit =
  let old = !state in
  state := v;
  List.iter (fun f -> f old v) !watchers

let state_dict () : Js.Json.t Js.Dict.t =
  match Js.Json.classify !state with
  | Js.Json.JSONObject d -> d
  | _ -> Js.Dict.empty ()

let state_get (key : string) : Js.Json.t option =
  Js.Dict.get (state_dict ()) key

let state_string (key : string) : string option =
  Option.bind (state_get key) Js.Json.decodeString

let state_bool (key : string) : bool =
  match Option.bind (state_get key) Js.Json.decodeBoolean with
  | Some b -> b
  | None -> false

let cid : int ref = ref 0

(* ---------- Datascript.value -> Js.Json.t (bean/->js equivalent) --- *)

let rec value_to_js (v : Datascript.value) : Js.Json.t =
  match v with
  | Datascript.Nil -> Js.Json.null
  | Datascript.Int64 i -> Js.Json.number (Int64.to_float i)
  | Datascript.Float f -> Js.Json.number f
  | Datascript.String s -> Js.Json.string s
  | Datascript.Symbol s -> Js.Json.string s
  | Datascript.Bool b -> Js.Json.boolean b
  | Datascript.Keyword s -> Js.Json.string s
  | Datascript.Uuid s -> Js.Json.string s
  | Datascript.Instant ms -> Js.Json.number (Int64.to_float ms)
  | Datascript.Regex s -> Js.Json.string s
  | Datascript.Ref id -> Js.Json.number (float_of_int id)
  | Datascript.List vs | Datascript.Vector vs | Datascript.Set vs ->
      Js.Json.array (Array.of_list (List.map value_to_js vs))
  | Datascript.Map kvs ->
      js_obj
        (List.map
           (fun (k, v') -> (value_key_name k, value_to_js v'))
           kvs)
  | Datascript.Tuple vs ->
      Js.Json.array
        (Array.of_list
           (List.map
              (fun v' ->
                match v' with
                | Some v'' -> value_to_js v''
                | None -> Js.Json.null)
              vs))
  | Datascript.TxRef | Datascript.Ref_to _ -> Js.Json.null

and value_key_name (k : Datascript.value) : string =
  match k with
  | Datascript.Keyword s -> s
  | Datascript.String s -> s
  | Datascript.Symbol s -> s
  | _ -> Js.Json.stringify (value_to_js k)

(* ---------- config items ---------- *)

(* get-host *)
let get_host () : string =
  match Electron_configs.get_item "server/host" with
  | Datascript.String s -> s
  | _ -> "127.0.0.1"

(* get-port *)
let get_port () : int =
  match Electron_configs.get_item "server/port" with
  | Datascript.Int64 i -> Int64.to_int i
  | Datascript.Float f -> int_of_float f
  | _ -> 12315

(* normalize-tokens *)
let normalize_tokens (tokens : Datascript.value) : Datascript.value =
  match tokens with Datascript.Nil -> Datascript.Vector [] | _ -> tokens

(* reset-state! *)
let reset_state () : unit =
  set_state
    (js_obj
       [ ("status", Js.Json.null)
       ; ("error", Js.Json.null)
       ; ("host", Js.Json.string (get_host ()))
       ; ("port", Js.Json.number (float_of_int (get_port ())))
       ; ( "tokens"
         , value_to_js
             (normalize_tokens
                (Electron_configs.get_item "server/tokens")) )
       ; ( "autostart"
         , value_to_js (Electron_configs.get_item "server/autostart") )
       ; ( "mcp-enabled?"
         , value_to_js
             (Electron_configs.get_item "server/mcp-enabled?") )
       ])

(* set-status! *)
let set_status ?(error : Js.Json.t = Js.Json.null) (status : string)
    : unit =
  let d = state_dict () in
  Js.Dict.set d "status" (Js.Json.string status);
  Js.Dict.set d "error" error;
  set_state (Js.Json.object_ d)

(* ---------- renderer sync ---------- *)

(* load-state-to-renderer! *)
let load_state_to_renderer ?(s : Js.Json.t = !state) () : unit =
  Array.iter
    (fun w ->
      Electron_utils.send_to_window w "syncAPIServerState" [| s |])
    (Electron_bindings.Browser_window.get_all_windows ())

(* set-config! — config is a cljs map decoded as Datascript.value *)
let set_config (config : Datascript.value) : unit =
  match config with
  | Datascript.Map kvs ->
      let kvs =
        List.filter
          (fun (k, _) -> not (Clj_value.key_eq k "status"))
          kvs
      in
      let kvs =
        List.map
          (fun (k, v) ->
            if Clj_value.key_eq k "tokens" then
              (k, normalize_tokens v)
            else (k, v))
          kvs
      in
      let d = state_dict () in
      List.iter
        (fun (k, v) -> Js.Dict.set d (value_key_name k) (value_to_js v))
        kvs;
      set_state (Js.Json.object_ d);
      List.iter
        (fun (k, v) ->
          Electron_configs.set_item
            ("server/" ^ value_key_name k)
            v)
        kvs;
      load_state_to_renderer ()
  | _ -> ()

(* setup-state-watch! — returns the teardown thunk *)
let setup_state_watch () : unit -> unit =
  let watcher (_old : Js.Json.t) (new_ : Js.Json.t) : unit =
    load_state_to_renderer ~s:new_ ()
  in
  watchers := watcher :: !watchers;
  fun () -> watchers := List.filter (fun w -> not (w == watcher)) !watchers

(* ---------- api method resolution ---------- *)

let type_proxy_api (s : Js.Json.t) : bool =
  match Js.Json.decodeString s with
  | Some s -> String.starts_with ~prefix:"logseq." s
  | None -> false

(* csk/->snake_case — word separators {space, -, _} collapse to a
   single '_'; camelCase/acronym boundaries insert '_'; '@' and other
   chars pass through untouched (the renderer splits on '@'). *)
let to_snake_case (s : string) : string =
  let is_upper c =
    Char.uppercase_ascii c = c && Char.lowercase_ascii c <> c
  in
  let is_lower c =
    Char.lowercase_ascii c = c && Char.uppercase_ascii c <> c
  in
  let is_sep c = c = ' ' || c = '-' || c = '_' in
  let b = Buffer.create (String.length s) in
  let prev_written = ref ' ' in
  String.iteri
    (fun i c ->
      if is_sep c then (
        if Buffer.length b > 0 && !prev_written <> '_' then
          Buffer.add_char b '_';
        prev_written := '_')
      else if is_upper c then (
        let prev = if i > 0 then Some s.[i - 1] else None in
        let next =
          if i + 1 < String.length s then Some s.[i + 1] else None
        in
        let boundary =
          match prev with
          | Some p ->
              (is_lower p || (p >= '0' && p <= '9'))
              || (is_upper p
                  && (match next with Some n -> is_lower n | None -> false))
          | None -> false
        in
        if boundary && Buffer.length b > 0 && !prev_written <> '_' then
          Buffer.add_char b '_';
        Buffer.add_char b (Char.lowercase_ascii c);
        prev_written := c)
      else (
        Buffer.add_char b c;
        prev_written := c))
    s;
  Buffer.contents b

(* resolve-real-api-method *)
let resolve_real_api_method (s : Js.Json.t) : string option =
  match Js.Json.decodeString s with
  | Some s ->
      if String.trim s = "" then None
      else if type_proxy_api (Js.Json.string s) then
        let parts = String.split_on_char '.' (String.trim s) in
        let ns =
          match parts with
          | _ :: ns :: _ -> String.lowercase_ascii ns
          | _ -> ""
        in
        let method_ =
          match List.rev parts with m :: _ -> m | [] -> ""
        in
        Some (to_snake_case (ns ^ "@" ^ method_))
      else Some (String.trim s)
  | None -> None

(* str/replace — literal replace-all *)
let replace_all (s : string) ~(sub : string) ~(by : string) : string =
  let sub_len = String.length sub in
  if sub_len = 0 then s
  else
    let b = Buffer.create (String.length s) in
    let rec loop i =
      if i + sub_len <= String.length s
         && String.sub s i sub_len = sub
      then (
        Buffer.add_string b by;
        loop (i + sub_len))
      else if i < String.length s then (
        Buffer.add_char b s.[i];
        loop (i + 1))
    in
    loop 0;
    Buffer.contents b

(* validate-auth-token *)
let validate_auth_token (token : Js.Json.t) : unit =
  let token =
    match Js.Json.decodeString token with
    | Some t -> replace_all t ~sub:"Bearer " ~by:""
    | None -> ""
  in
  match Electron_configs.get_item "server/tokens" with
  | Datascript.Nil -> ()
  | valid_tokens -> (
      let items =
        match valid_tokens with
        | Datascript.List l | Datascript.Vector l | Datascript.Set l ->
            l
        | _ -> []
      in
      let matches (v : Datascript.value) : bool =
        match v with
        | Datascript.String s -> String.equal s token
        | Datascript.Map _ as m -> (
            match Clj_value.map_get m "value" with
            | Datascript.String s -> String.equal s token
            | _ -> false)
        | _ -> false
      in
      if String.trim token = "" || not (List.exists matches items) then
        Js.Exn.raiseError "Access Denied!")

(* api-pre-handler! *)
let api_pre_handler (req : Fastify.request) (rep : Fastify.reply)
    (callback : unit -> unit [@u]) : unit =
  if String.equal (Electron_mcp_transport.req_url req) "/" then
    callback () [@u]
  else
    try
      validate_auth_token
        (match
           Js.Undefined.toOption
             (get_index
                (Electron_mcp_transport.req_headers req)
                "authorization")
         with
         | Some v -> v
         | None -> Js.Json.null);
      callback () [@u]
    with e ->
      ignore
        (Electron_mcp_transport.reply_send
           (Electron_mcp_transport.reply_code rep 401)
           (exn_as_json e))

(* invoke-logseq-api! *)
let invoke_logseq_api (method_ : string) (args : Js.Json.t)
    : Js.Json.t Js.Promise.t =
  Js.Promise.make (fun ~resolve ~reject:_ ->
      incr cid;
      let sid = !cid in
      (match !win with
       | Some w ->
           Electron_utils.send_to_window w "invokeLogseqAPI"
             [| js_obj
                  [ ("syncId", Js.Json.number (float_of_int sid))
                  ; ("method", Js.Json.string method_)
                  ; ("args", args)
                  ]
             |]
       | None -> ());
      Electron_bindings.Ipc_main.handle_once
        ("electron.server/sync!" ^ string_of_int sid)
        (fun [@u] _evt ret -> (resolve ret [@u])))

(* Responses with an :error key are unexpected failures from
   electron.listener — surface a 500. *)
let report_api_error (rep : Fastify.reply) (result : Js.Json.t)
    : unit =
  match Js.Undefined.toOption (get_index result "error") with
  | Some err -> (
      match Js.Json.classify err with
      | Js.Json.JSONNull -> ()
      | _ ->
          ignore (Electron_mcp_transport.reply_code rep 500);
          console_error_args
            [| Js.Json.string "Unexpected API error:"; err |])
  | None -> ()

(* api-handler! *)
let api_handler (req : Fastify.request) (rep : Fastify.reply) : unit =
  match Electron_mcp_transport.req_body req with
  | Some body -> (
      let field (name : string) : Js.Json.t =
        match Js.Undefined.toOption (get_index body name) with
        | Some v -> v
        | None -> Js.Json.null
      in
      match resolve_real_api_method (field "method") with
      | Some method_ ->
          invoke_logseq_api method_ (field "args")
          |> Js.Promise.then_ (fun result ->
               report_api_error rep result;
               Electron_mcp_transport.reply_send rep result;
               Js.Promise.resolve ())
          |> Js.Promise.catch (fun e ->
               Electron_mcp_transport.reply_send rep
                 (promise_error_as_json e);
               Js.Promise.resolve ())
          |> ignore
      | None ->
          ignore
            (Electron_mcp_transport.reply_send
               (Electron_mcp_transport.reply_code rep 400)
               (js_error_make ":method of body is missing!")))
  | None -> Js.Exn.raiseError "Body{:method :args} is required!"

(* close! *)
let close () : unit Js.Promise.t =
  match !server, state_string "status" with
  | Some s, (None | Some "running" | Some "error") ->
      Electron_logger.debug "[server] closing ...";
      set_status "closing";
      Js.Promise.catch
        (fun e ->
          set_status "running" ~error:(promise_error_as_json e);
          Js.Promise.resolve ())
        (Js.Promise.then_
           (fun () ->
             server := None;
             set_status "closed";
             Js.Promise.resolve ())
           (Fastify.close s))
  | _ -> Js.Promise.resolve ()

(* initialize-mcp-routes *)
let initialize_mcp_routes (s : Fastify.t) : unit =
  let api_fn : Electron_mcp_server.api_fn =
   fun meth args ->
    match resolve_real_api_method (Js.Json.string meth) with
    | Some meth' -> invoke_logseq_api meth' args
    | None ->
        Js.Promise.resolve
          (js_obj
             [ ( "error"
               , Js.Json.string
                   ("No method found for "
                    ^ Js.Json.stringify (Js.Json.string meth)) )
             ])
  in
  Electron_logger.debug "[server] MCP routes initialized";
  ignore
    (Fastify.post s "/mcp" (fun [@u] req rep ->
         Electron_mcp_server.handle_post_request api_fn
           ~port:(get_port ()) ~host:(get_host ()) req rep));
  ignore
    (Fastify.get s "/mcp" (fun [@u] req rep ->
         Electron_mcp_server.handle_get_request req rep));
  ignore
    (Fastify.delete s "/mcp" (fun [@u] req rep ->
         Electron_mcp_server.handle_delete_request req rep))

(* GET / — serves the api docs page with host/port templated in *)
let replace_first (s : string) ~(sub : string) ~(by : string)
    : string =
  let sub_len = String.length sub in
  if sub_len = 0 then s
  else
    let rec find i =
      if i + sub_len > String.length s then None
      else if String.sub s i sub_len = sub then Some i
      else find (i + 1)
    in
    match find 0 with
    | None -> s
    | Some i ->
        String.sub s 0 i ^ by
        ^ String.sub s (i + sub_len) (String.length s - i - sub_len)

let api_docs_handler (_req : Fastify.request) (rep : Fastify.reply)
    : unit =
  let html =
    Fs_extra.read_file_utf8
      (Node.Path.join [| __dirname; "./docs/api_server.html" |])
  in
  let html =
    replace_first html ~sub:"${HOST}" ~by:(get_host ())
  in
  let html =
    replace_first html ~sub:"${PORT}" ~by:(string_of_int (get_port ()))
  in
  Electron_mcp_transport.reply_send
    (Electron_mcp_transport.reply_type rep "text/html")
    html

(* start! *)
let start () : unit Js.Promise.t =
  let chain =
    Js.Promise.then_
      (fun () ->
        set_status "starting";
        let s =
          Fastify.make
            [%mel.obj
              { logger = not Electron_state.win32
              ; requestTimeout = 1000 * 42
              ; forceCloseConnections = true
              }]
        in
        Js.Promise.then_
          (fun () ->
            ignore
              (Fastify.get
                 (Fastify.post
                    (Fastify.add_hook s "preHandler"
                       (fun [@u] req rep callback ->
                         api_pre_handler req rep callback))
                    "/api" (fun [@u] req rep -> api_handler req rep))
                 "/" (fun [@u] req rep -> api_docs_handler req rep));
            (if state_bool "mcp-enabled?" then initialize_mcp_routes s);
            Js.Promise.then_
              (fun () ->
                server := Some s;
                set_status "running";
                Js.Promise.resolve ())
              (Fastify.listen s
                 [%mel.obj
                   { host =
                       Option.value (state_string "host")
                         ~default:(get_host ())
                   ; port =
                       (match state_get "port" with
                        | Some v -> (
                            match Js.Json.decodeNumber v with
                            | Some f -> int_of_float f
                            | None -> get_port ())
                        | None -> get_port ())
                   }]))
          (Fastify.register s Fastify.cors_plugin
             [%mel.obj
               { origin = "*"
               ; exposedHeaders = [| "mcp-session-id" |]
               }]))
      (close ())
  in
  Js.Promise.catch
    (fun e ->
      set_status "error" ~error:(promise_error_as_json e);
      Electron_logger.error_args
        [| Js.Json.string "[server] start error! "
         ; promise_error_as_json e
        |];
      Js.Promise.resolve ())
    (Js.Promise.then_
       (fun () ->
         Electron_logger.debug "[server] start successfully!";
         Js.Promise.resolve ())
       chain)

(* do-server! *)
let do_server (action : string) : unit =
  match action with
  | "start" -> (
      match state_string "status" with
      | None | Some "closed" | Some "error" -> ignore (start ())
      | Some _ -> ())
  | "stop" -> ignore (close ())
  | "restart" ->
      ignore (Js.Promise.then_ (fun () -> start ()) (close ()))
  | _ -> ()

(* setup! *)
let setup (w : Electron_bindings.Browser_window.t) : unit -> unit =
  win := Some w;
  let teardown = setup_state_watch () in
  reset_state ();
  teardown
