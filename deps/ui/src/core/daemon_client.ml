(* Electron renderer transport: the native OCaml db-worker daemon
   replaces the browser's JS worker. Graph lifecycle rides the
   electron-main IPC bridge (window.apis.doAction carries a transit
   frame on the 'main' channel); thread-api calls POST to
   {base-url}/v1/invoke and daemon pushes arrive on the SSE
   /v1/events stream. *)

open Promise_ext

(* ---------- js surface ---------- *)

external window_ : Js.Json.t = "window" [@@mel.scope "globalThis"]
external getf : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]
external reflect_apply :
  Js.Json.t -> Js.Json.t -> Js.Json.t array -> Js.Json.t = "apply"
  [@@mel.scope "Reflect"]

external reflect_apply_promise :
  Js.Json.t -> Js.Json.t -> Js.Json.t array -> 'a Js.Promise.t = "apply"
  [@@mel.scope "Reflect"]

let meth o m args : Js.Json.t = reflect_apply (getf o m) o args
let meth_promise o m args = reflect_apply_promise (getf o m) o args
external json_parse : string -> Js.Json.t = "parse" [@@mel.scope "JSON"]

external json_stringify : Js.Json.t -> string = "stringify"
  [@@mel.scope "JSON"]

external fetch_ : string -> Js.Json.t -> Js.Json.t Js.Promise.t =
  "fetch" [@@mel.scope "window"]

external resp_json : Js.Json.t -> Js.Json.t Js.Promise.t = "json"
  [@@mel.send]

let json_field (name : string) (j : Js.Json.t) : Js.Json.t option =
  match Js.Json.classify j with
  | Js.Json.JSONObject obj -> Js.Dict.get obj name
  | _ -> None

let jobj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

(* The preload bridge is the only window.apis that carries doAction —
   the web build's plugin-host shim is a bare event emitter. Guarded for
   the node test runner where window itself is absent. *)
let is_electron () : bool =
  match Js.typeof window_ with
  | "object" -> (
      match Js.typeof (getf window_ "apis") with
      | "object" ->
          Js.typeof (getf (getf window_ "apis") "doAction") = "function"
      | _ -> false)
  | _ -> false

(* ---------- ipc ---------- *)

(* apis.doAction(arg) -> ipcRenderer.invoke('main', arg). The handler
   decodes a transit string frame and answers a transit string. *)
let ipc (args : Wire.t list) : Wire.t Js.Promise.t =
  let apis = getf window_ "apis" in
  let* result =
    meth_promise apis "doAction"
      [| Js.Json.string (Transit.to_string (Wire.Array args)) |]
  in
  Js.Promise.resolve
    (match Js.Json.decodeString result with
     | Some s -> Transit.of_string s
     | None -> Wire.Nil)

let canonical_repo repo =
  let repo = String.trim repo in
  let prefix = "logseq_db_" in
  let key =
    if String.length repo > String.length prefix && String.starts_with ~prefix repo then
      String.sub repo (String.length prefix) (String.length repo - String.length prefix)
      |> String.trim
    else repo
  in
  if key = "" then invalid_arg "repo is required";
  prefix ^ key
let normalize_path path = path

(* Epochs fence client continuations, not server-side execution. *)
type scope = { repo : string; epoch : int }
type outcome = Not_sent | Outcome_unknown
type request_failure =
  { scope : scope option
  ; method_name : string
  ; outcome : outcome
  ; cause : exn
  }
exception Request_failed of request_failure
exception Remote_error of string
exception Identity_changed of string

type phase = Disconnected | Recovering | Ready | Failed of exn
type lifecycle = { scope : scope option; phase : phase }
type invoke = string -> Wire.t list -> Wire.t Js.Promise.t
type bootstrap =
  { scope : scope
  ; invoke : invoke
  ; is_current : unit -> bool
  }
type identity =
  { base_url : string
  ; repo : string
  ; root : string
  ; graphs_dir : string
  ; lifecycle_dir : string
  ; generation : string
  ; ticket : string
  ; pid : int
  ; port : int
  ; owner_source : string
  ; revision : string
  }
type control =
  { mark_sent : unit -> unit
  ; was_sent : unit -> bool
  ; cancel : unit -> unit
  ; install_cancel : (unit -> unit) -> unit
  }

let pending () =
  let resolve_ref = ref (fun _ -> ()) in
  let reject_ref = ref (fun (_ : exn) -> ()) in
  let promise =
    Js.Promise.make (fun ~resolve ~reject ->
        resolve_ref := (fun v -> resolve v [@u]);
        reject_ref := (fun e -> reject e [@u]))
  in
  promise, (fun v -> !resolve_ref v), (fun e -> !reject_ref e)

let required_string name json =
  match Option.bind (json_field name json) Js.Json.decodeString with
  | Some s when String.trim s <> "" -> s
  | _ -> failwith ("Missing daemon identity field: " ^ name)

let required_int name json =
  match Option.bind (json_field name json) Js.Json.decodeNumber with
  | Some n when n > 0. && n = Float.floor n && n <= float_of_int max_int ->
      int_of_float n
  | _ -> failwith ("Invalid daemon identity field: " ^ name)

let port_of_base base =
  let prefix = "http://127.0.0.1:" in
  let n = String.length prefix in
  if String.length base <= n || String.sub base 0 n <> prefix then
    failwith "Daemon endpoint must be IPv4 loopback";
  match int_of_string_opt (String.sub base n (String.length base - n)) with
  | Some port when port > 0 && port <= 65535 -> port
  | _ -> failwith "Invalid daemon endpoint port"

let decode_identity base json =
  if required_string "status" json <> "ready" then
    failwith "Daemon is not ready";
  if required_string "host" json <> "127.0.0.1"
     || required_string "ownership-protocol" json <> "sqlite-v1" then
    failwith "Unsupported daemon ownership";
  let storage =
    match json_field "storage" json with
    | Some s -> s
    | None -> failwith "Daemon storage identity is missing"
  in
  let port = required_int "port" json in
  if port <> port_of_base base then failwith "Daemon port identity changed";
  let root = normalize_path (required_string "root" storage) in
  if root <> normalize_path (required_string "root-dir" json) then
    failwith "Daemon root identity disagrees";
  { base_url = base
  ; repo = canonical_repo (required_string "repo" json)
  ; root
  ; graphs_dir = normalize_path (required_string "graphsDir" storage)
  ; lifecycle_dir = normalize_path (required_string "lifecycleDir" storage)
  ; generation = required_string "generation" json
  ; ticket = required_string "ticket" json
  ; pid = required_int "pid" json
  ; port
  ; owner_source = required_string "owner-source" json
  ; revision = required_string "revision" json
  }

let verify_binding (old : identity) (next : identity) =
  if old.repo <> next.repo || old.root <> next.root
     || old.graphs_dir <> next.graphs_dir
     || old.lifecycle_dir <> next.lifecycle_dir
     || old.generation <> next.generation then
    raise (Identity_changed "Graph or storage incarnation changed")

let verify_instance (old : identity) (next : identity) =
  verify_binding old next;
  if old.pid <> next.pid || old.ticket <> next.ticket
     || old.base_url <> next.base_url || old.owner_source <> next.owner_source
     || old.revision <> next.revision then
    raise (Identity_changed "Worker changed while attaching")

let decode_reply json =
  match Option.bind (json_field "ok" json) Js.Json.decodeBoolean with
  | Some false ->
      let message =
        match json_field "error" json with
        | Some error ->
            Option.value
              (Option.bind (json_field "message" error) Js.Json.decodeString)
              ~default:"Daemon rejected request"
        | None -> "Daemon rejected request"
      in
      raise (Remote_error message)
  | Some true ->
      (match Option.bind (json_field "resultTransit" json) Js.Json.decodeString with
       | Some result -> Transit.of_string result
       | None -> failwith "Daemon response has no resultTransit")
  | None -> failwith "Malformed daemon response"

let deliver sink data =
  let json = Js.Json.parseExn data in
  let kind = required_string "type" json in
  match Option.bind (json_field "payload" json) Js.Json.decodeString with
  | Some payload ->
      let payload =
        match Transit.of_string payload with
        | Wire.Array (Wire.Keyword framed_kind :: rest)
        | Wire.List (Wire.Keyword framed_kind :: rest) when framed_kind = kind ->
            (match rest with [p] -> p | _ -> Wire.Array rest)
        | payload -> payload
      in
      sink kind payload
  | None -> failwith "Daemon event has no payload"

let server_entries text =
  String.split_on_char '\n' text
  |> List.filter_map (fun line ->
      match String.split_on_char ' ' (String.trim line)
            |> List.filter (fun s -> s <> "") with
      | [pid; port] ->
          (match int_of_string_opt pid, int_of_string_opt port with
           | Some pid, Some port when pid > 0 && port > 0 && port <= 65535 ->
               Some (pid, port)
           | _ -> None)
      | _ -> None)

external set_timeout : (unit -> unit) -> float -> int = "setTimeout"
external clear_timeout : int -> unit = "clearTimeout"
type abort_controller
external new_abort_controller : unit -> abort_controller = "AbortController" [@@mel.new]
external abort_signal : abort_controller -> Js.Json.t = "signal" [@@mel.get]
external abort : abort_controller -> unit = "abort" [@@mel.send]
type reader
external response_reader : Js.Json.t -> reader = "getReader" [@@mel.send]
external read_chunk : reader -> Js.Json.t Js.Promise.t = "read" [@@mel.send]
type decoder
external new_decoder : string -> Js.Json.t -> decoder = "TextDecoder" [@@mel.new]
external decode_chunk : decoder -> Js.Json.t -> Js.Json.t -> string = "decode" [@@mel.send]

let after seconds callback =
  let timer = set_timeout callback (seconds *. 1000.) in
  fun () -> clear_timeout timer

let control () =
  let sent = ref false and cancelled = ref false in
  let close = ref (fun () -> ()) in
  { mark_sent = (fun () -> if !cancelled then failwith "Request cancelled"; sent := true)
  ; was_sent = (fun () -> !sent)
  ; cancel = (fun () -> cancelled := true; !close ())
  ; install_cancel = (fun f -> close := f; if !cancelled then f ())
  }

let request ?(mark_sent = false) ctl url opts =
  let controller = new_abort_controller () in
  ctl.install_cancel (fun () -> abort controller);
  let options =
    ("signal", abort_signal controller) :: opts |> jobj
  in
  if mark_sent then ctl.mark_sent ();
  fetch_ url options

let require_response response =
  match Option.bind (json_field "status" response) Js.Json.decodeNumber with
  | Some 200. -> ()
  | _ -> failwith "Daemon HTTP request failed"

let raw_post ctl base name args =
  let body = json_stringify
      (jobj ["method", Js.Json.string name
            ; "argsTransit", Js.Json.string (Transit.to_string (Wire.Array args))]) in
  let* response = request ~mark_sent:true ctl (base ^ "/v1/invoke")
      ["method", Js.Json.string "POST"
      ; "headers", jobj ["Content-Type", Js.Json.string "application/json"]
      ; "body", Js.Json.string body] in
  let* json = resp_json response in
  Js.Promise.resolve (decode_reply json)

let probe_identity base =
  ignore (port_of_base base);
  let ctl = control () in
  let timeout = after 1. ctl.cancel in
  let probe =
    let* response = request ctl (base ^ "/healthz") [] in
    require_response response;
    let* json = resp_json response in
    Js.Promise.resolve (decode_identity base json)
  in
  probe |> Js.Promise.then_ (fun id -> timeout (); Js.Promise.resolve id)
  |> Js.Promise.catch (fun e ->
      timeout (); Js.Promise.reject (Js.Exn.anyToExnInternal e))

let prepare_explicit ~is_current repo creating =
  let* generation =
    if creating then ipc [Wire.String "createGraph"; Wire.String repo]
    else Js.Promise.resolve Wire.Nil
  in
  if not (is_current ()) then failwith "Daemon connection superseded";
  let options =
    match generation with
    | Wire.String _ -> Wire.Map [Wire.kw "generation", generation]
    | _ -> Wire.Map []
  in
  let* rt = ipc [Wire.String "db-worker-runtime"; Wire.String repo; options] in
  if not (is_current ()) then failwith "Daemon connection superseded";
  match Wire.map_get_string rt "base-url", Wire.map_get_string rt "root-dir",
        Wire.map_get_string rt "generation", Wire.map_get_string rt "repo" with
  | Some base, Some root, Some generation, Some runtime_repo ->
      let* id = probe_identity base in
      if id.repo <> repo || canonical_repo runtime_repo <> repo
         || id.root <> root || id.generation <> generation then
        Js.Promise.reject (Identity_changed "Runtime graph identity disagrees")
      else Js.Promise.resolve id
  | _ -> Js.Promise.reject (Failure "Runtime has incomplete daemon identity")

let discover (old : identity) =
  let separator =
    if String.ends_with ~suffix:"/" old.root || String.ends_with ~suffix:"\\" old.root
    then "" else "/"
  in
  let* contents = ipc [Wire.String "readFile"; Wire.String (old.root ^ separator ^ "server-list")] in
  let entries =
    match contents with Wire.String text -> server_entries text | Wire.Nil -> []
    | _ -> failwith "Malformed daemon server list"
  in
  let rec loop = function
    | [] -> Js.Promise.resolve None
    | (pid,port) :: rest ->
        let probe =
          let* id = probe_identity ("http://127.0.0.1:" ^ string_of_int port) in
          if id.pid = pid && id.repo = old.repo then (
            verify_binding old id;
            Js.Promise.resolve (Some id))
          else Js.Promise.resolve None
        in
        let* candidate = probe |> Js.Promise.catch (fun error ->
          match Js.Exn.anyToExnInternal error with
          | Identity_changed _ as error -> Js.Promise.reject error
          | _ -> Js.Promise.resolve None) in
        match candidate with Some _ -> Js.Promise.resolve candidate | None -> loop rest
  in loop entries

let remember (_ : identity) = ()

let stream ctl (id : identity) on_keepalive on_data on_end =
  let run =
    let* response = request ctl (id.base_url ^ "/v1/events")
        ["headers", jobj ["Accept", Js.Json.string "text/event-stream"]] in
    require_response response;
    let body = getf response "body" in
    if Js.typeof body <> "object" || body = Js.Json.null then
      failwith "Daemon recovery requires fetch streaming";
    let reader = response_reader body in
    let decoder = new_decoder "utf-8" (jobj ["fatal", Js.Json.boolean true]) in
    let line = Buffer.create 256 and data = Buffer.create 1024 in
    let previous_cr = ref false in
    let consume_line () =
      let value = Buffer.contents line in
      Buffer.clear line;
      if value = ": keepalive" then on_keepalive ()
      else if value = "" then (
        if Buffer.length data > 0 then (
          let event = Buffer.contents data in Buffer.clear data; on_data event))
      else if String.starts_with ~prefix:"data:" value then (
        let value = String.sub value 5 (String.length value-5) in
        let value = if String.starts_with ~prefix:" " value then
            String.sub value 1 (String.length value-1) else value in
        if Buffer.length data > 0 then Buffer.add_char data '\n';
        Buffer.add_string data value)
    in
    let rec loop () =
      let* chunk = read_chunk reader in
      if Js.Json.decodeBoolean (getf chunk "done") = Some true then
        Js.Promise.reject (Failure "Daemon event stream ended")
      else (
        let text = decode_chunk decoder (getf chunk "value") (jobj ["stream", Js.Json.boolean true]) in
        String.iter (fun c ->
            if c = '\r' then (consume_line (); previous_cr := true)
            else if c = '\n' then (
              if not !previous_cr then consume_line ();
              previous_cr := false)
            else (previous_cr := false; Buffer.add_char line c)) text;
        loop ())
    in loop ()
  in
  ignore (run |> Js.Promise.catch (fun error ->
      on_end (Js.Exn.anyToExnInternal error); Js.Promise.resolve ()))

type attempt =
  { scope : scope
  ; promise : scope Js.Promise.t
  ; resolve : scope -> unit
  ; reject : exn -> unit
  ; mutable cancel_timer : unit -> unit
  }
type call =
  { scope : scope
  ; name : string
  ; control : control
  ; reject : exn -> unit
  }
type hooks =
  { on_state : lifecycle -> unit
  ; on_request_failure : request_failure -> unit
  ; rehydrate : bootstrap -> unit Js.Promise.t
  }
type transport =
  { mutable base_url : string
  ; mutable repo : string
  ; mutable sink : string -> Wire.t -> unit
  ; dead : string Js.Promise.t
  ; mutable epoch : int
  ; mutable status : lifecycle
  ; mutable hooks : hooks option
  ; mutable binding : identity option
  ; mutable attempt : attempt option
  ; mutable stop_stream : unit -> unit
  ; calls : (int, call) Hashtbl.t
  ; mutable next_call : int
  ; mutable handle_loss : scope -> exn -> unit
  }

let lifecycle t = t.status
let is_current t (scope : scope) =
  t.epoch = scope.epoch && t.status.scope = Some scope

let publish t phase =
  t.status <- { t.status with phase };
  match t.hooks with Some hooks -> hooks.on_state t.status | None -> ()

let report_failure t (scope : scope option) name outcome cause reject =
  let failure = {scope; method_name = name; outcome; cause} in
  reject (Request_failed failure);
  match t.hooks with
  | Some hooks ->
      if outcome = Outcome_unknown
         || (match scope with None -> true | Some scope -> t.epoch = scope.epoch)
      then hooks.on_request_failure failure
  | None -> ()

let retire t cause =
  t.epoch <- t.epoch + 1;
  let epoch = t.epoch in
  t.status <- {scope = None; phase = Disconnected};
  t.base_url <- "";
  t.repo <- "";
  let stop_stream = t.stop_stream in
  t.stop_stream <- (fun () -> ());
  let attempt = t.attempt in
  t.attempt <- None;
  let calls = Hashtbl.fold (fun _ call acc -> call :: acc) t.calls [] in
  Hashtbl.clear t.calls;
  stop_stream ();
  List.iter (fun (call : call) ->
      call.control.cancel ();
      report_failure t (Some call.scope) call.name
        (if call.control.was_sent () then Outcome_unknown else Not_sent)
        cause call.reject) calls;
  (match attempt with
   | Some attempt -> attempt.cancel_timer (); attempt.reject cause
   | None -> ());
  epoch

let disconnect t =
  let epoch = retire t (Failure "Daemon client disconnected") in
  if t.epoch = epoch then publish t Disconnected

let fail_attempt t (scope : scope) error =
  if is_current t scope then (
    let epoch = retire t error in
    if t.epoch = epoch then (
      t.status <- {scope = Some scope; phase = Failed error};
      publish t (Failed error)))

let dispatch t (scope : scope) base name args =
  if not (is_current t scope) then (
    let promise, _, reject = pending () in
    report_failure t (Some scope) name Not_sent (Failure "Stale daemon scope") reject;
    promise)
  else if name = "thread-api/init" then Js.Promise.resolve Wire.Nil
  else
    let promise, resolve, reject = pending () in
    let id = t.next_call in
    t.next_call <- id + 1;
    let call = {scope; name; control = control (); reject} in
    Hashtbl.add t.calls id call;
    let finish f =
      if Hashtbl.mem t.calls id then (
        Hashtbl.remove t.calls id;
        f ())
    in
    let request =
      try raw_post call.control base name args
      with error -> Js.Promise.reject error
    in
    ignore (request |> Js.Promise.then_ (fun result ->
        if is_current t scope then finish (fun () -> resolve result);
        Js.Promise.resolve ())
      |> Js.Promise.catch (fun error ->
        let error = Js.Exn.anyToExnInternal error in
        (match error with
         | Remote_error _ -> finish (fun () -> reject error)
         | _ ->
             if is_current t scope then t.handle_loss scope error);
        Js.Promise.resolve ()));
    promise

let rec start ?(cause = Failure "Daemon connection superseded") t repo explicit open_request =
  match t.hooks with
  | None -> Js.Promise.reject (Failure "Daemon recovery hooks are not configured")
  | Some hooks ->
      let old =
        match t.binding with Some id when id.repo = repo -> Some id | _ -> None
      in
      let epoch = retire t cause in
      if t.epoch <> epoch then Js.Promise.reject (Failure "Daemon connection superseded")
      else
        let scope = {repo; epoch} in
        let promise, resolve, reject = pending () in
        let attempt = {scope; promise; resolve; reject; cancel_timer = (fun () -> ())} in
        t.attempt <- Some attempt;
        t.status <- {scope = Some scope; phase = Recovering};
        attempt.cancel_timer <- after 60. (fun () ->
            if is_current t scope then fail_attempt t scope (Failure "Daemon connect timed out"));
        publish t Recovering;
        let current () =
          is_current t scope
          && (match t.attempt with Some active -> active == attempt | None -> false)
        in
        let check () = if not (current ()) then failwith "Daemon connection superseded" in
        let rec find () =
          check ();
          match old with
          | None -> Js.Promise.reject (Failure "No previously bound daemon to rediscover")
          | Some old ->
              let* candidate = discover old in
              check ();
              (match candidate with
               | Some id -> Js.Promise.resolve id
               | None ->
                   let delayed, resolve, _ = pending () in
                   let _cancel_delay = after 0.2 (fun () -> resolve ()) in
                   let* () = delayed in find ())
        in
        let connecting =
          try
            check ();
            let creating =
              match open_request with
              | Some ([_; (Wire.Map _ as opts)], _) -> Wire.get opts "config" <> None
              | _ -> false
            in
            let* id =
              if explicit then prepare_explicit ~is_current:current repo creating else find ()
            in
            check ();
            (match old with Some old when not creating -> verify_binding old id | _ -> ());
            if id.repo <> repo then raise (Identity_changed "Daemon repo identity changed");
            remember id;
            t.binding <- Some id;
            t.repo <- repo;
            t.base_url <- id.base_url;
            let* () =
              match open_request with
              | None -> Js.Promise.resolve ()
              | Some (args, result) ->
                  let* value = dispatch t scope id.base_url "thread-api/create-or-open-db" args in
                  result := value;
                  Js.Promise.resolve ()
            in
            check ();
            let subscribed, subscribed_resolve, subscribed_reject = pending () in
            let ctl = control () in
            t.stop_stream <- ctl.cancel;
            let observed = ref false in
            stream ctl id
              (fun () -> if current () && not !observed then (
                  observed := true; subscribed_resolve ()))
              (fun data -> if is_current t scope then (
                  try deliver t.sink data
                  with error -> t.handle_loss scope error))
              (fun error -> if is_current t scope then (
                  subscribed_reject error;
                  t.handle_loss scope error));
            let* () = subscribed in
            check ();
            let* confirmed = probe_identity id.base_url in
            check ();
            verify_instance id confirmed;
            let bootstrap =
              {scope
              ; invoke = (fun name args -> dispatch t scope id.base_url name args)
              ; is_current = (fun () -> is_current t scope)
              }
            in
            let* () = hooks.rehydrate bootstrap in
            check ();
            attempt.cancel_timer ();
            publish t Ready;
            if is_current t scope then (
              t.attempt <- None;
              resolve scope);
            Js.Promise.resolve ()
          with error -> Js.Promise.reject error
        in
        ignore (connecting |> Js.Promise.catch (fun error ->
            let error = Js.Exn.anyToExnInternal error in
            if is_current t scope then fail_attempt t scope error;
            Js.Promise.resolve ()));
        promise

and lost t scope error =
  if is_current t scope then
    match t.status.phase with
    | Ready ->
        ignore (
          start ~cause:error t scope.repo false None
          |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()))
    | Recovering -> fail_attempt t scope error
    | Disconnected | Failed _ -> ()

let configure_recovery t ~on_state ~on_request_failure ~rehydrate =
  match t.status.phase with
  | Recovering | Ready -> invalid_arg "Cannot replace active daemon recovery hooks"
  | Disconnected | Failed _ ->
      t.hooks <- Some {on_state; on_request_failure; rehydrate};
      on_state t.status

let connect t ~repo =
  try
    let repo = canonical_repo repo in
    match t.status.phase, t.status.scope, t.attempt with
    | Ready, Some scope, _ when scope.repo = repo -> Js.Promise.resolve scope
    | Recovering, Some scope, Some attempt when scope.repo = repo -> attempt.promise
    | _ -> start t repo true None
  with error -> Js.Promise.reject error

let reconnect_existing t ~repo =
  try
    let repo = canonical_repo repo in
    match t.binding with
    | Some binding when binding.repo = repo -> start t repo false None
    | _ -> Js.Promise.reject (Failure "No matching bound daemon to rediscover")
  with error -> Js.Promise.reject error

let list_graphs () =
  let* graphs = ipc [Wire.String "getGraphs"] in
  match graphs with
  | Wire.Array names | Wire.List names ->
      Js.Promise.resolve
        (Wire.Array (List.map (fun name -> Wire.Map [Wire.kw "name", name]) names))
  | _ -> Js.Promise.reject (Failure "Malformed graph listing")

let invoke t name args =
  match name with
  | "thread-api/init" -> Js.Promise.resolve Wire.Nil
  | "thread-api/list-db" -> list_graphs ()
  | "thread-api/create-or-open-db" ->
      (match args with
       | Wire.String repo :: _ ->
           let result = ref Wire.Nil in
           let* _ = start t (canonical_repo repo) true (Some (args, result)) in
           Js.Promise.resolve !result
       | _ -> Js.Promise.reject (Failure "create-or-open-db requires a repo"))
  | _ ->
      (match t.status.phase, t.status.scope with
       | Ready, Some scope -> dispatch t scope t.base_url name args
       | _ ->
           let promise, _, reject = pending () in
           let scope =
             match t.status.scope with
             | Some scope when is_current t scope -> Some scope
             | _ -> None
           in
           report_failure t scope name Not_sent
             (Failure "Daemon model is not ready") reject;
           promise)

let create_transport () =
  let t =
    { base_url = ""; repo = ""; sink = (fun _ _ -> ())
    ; dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())
    ; epoch = 0; status = {scope = None; phase = Disconnected}
    ; hooks = None; binding = None; attempt = None
    ; stop_stream = (fun () -> ())
    ; calls = Hashtbl.create 16; next_call = 0
    ; handle_loss = (fun _ _ -> ())
    }
  in
  t.handle_loss <- lost t;
  t
