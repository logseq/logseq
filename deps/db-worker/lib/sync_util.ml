(* frontend.worker.sync.util — auth token, graph-id resolution, error
   diagnostics, malli-style request/response coercion, fetch-json. *)

open Db_worker_effect.Infix

let ex_info msg kvs = Dispatcher.Exn_info (msg, kvs)

let kw s = Wire.Keyword s

let kw_name k =
  match String.rindex_opt k '/' with
  | Some i -> String.sub k (i + 1) (String.length k - i - 1)
  | None -> k

(* sync-util/fail-fast *)
let fail_fast tag (data : Wire.t) : 'a =
  let field_of (k, v) =
    let k' =
      match k with
      | Wire.Keyword s -> s
      | Wire.String s -> s
      | _ -> "?"
    in
    let v' = match v with Wire.String s -> s | _ -> "<non-string>" in
    (k', v')
  in
  Worker_log.error tag
    (match data with
     | Wire.Map kvs -> List.map field_of kvs
     | _ -> []);
  raise (ex_info (kw_name tag) (Wire.as_map data))

let cli_node_owner () =
  Runtime_env.kind () = Runtime_env.Node
  && Runtime_env.env "LOGSEQ_OWNER_SOURCE" = Some "cli"

let auth_token_impl () : string option =
  match Worker_state.state_get "auth/id-token" with
  | Some (Wire.String s) -> Some s
  | _ ->
      (match Worker_state.state_get "auth/access-token" with
       | Some (Wire.String s) -> Some s
       | _ -> None)

(* test seam — cljs with-redefs [sync-util/auth-token] *)
let auth_token_fn = ref auth_token_impl

let auth_token () : string option = !auth_token_fn ()

let get_graph_id repo : string option =
  match
    (match Worker_state.datascript_conn repo with
     | Some conn ->
         (match Ldb.get_graph_rtc_uuid (Datascript.Conn.db conn) with
          | Some (Datascript.String s) -> Some s
          | Some (Datascript.Uuid s) -> Some s
          | _ -> None)
     | None -> None)
  with
  | Some _ as r -> r
  | None -> Sync_client_op.get_graph_uuid repo

let require_auth_token (context : Wire.t) : unit =
  match auth_token () with
  | Some "" | None -> fail_fast "db-sync/missing-field" context
  | Some _ -> ()

let code_re = Regexp.compile "^[a-zA-Z0-9._/\\-]+$"

let ex_message = function
  | Dispatcher.Exn_info (msg, _) -> msg
  | Failure msg -> msg
  | e -> Printexc.to_string e

let ex_data e =
  match e with
  | Dispatcher.Exn_info (_, kvs) -> Wire.Map kvs
  | _ -> Wire.Map []

(* sync-util/ex-message->code *)
let ex_message_to_code message : string option =
  if Regexp.test code_re message then Some message else None

(* sync-util/error->diagnostic *)
let error_to_diagnostic (e : exn) : Wire.t =
  let data = ex_data e in
  let code =
    match Wire.get "code" data with
    | Some (Wire.Keyword c | Wire.String c) -> c
    | _ ->
        (match ex_message_to_code (ex_message e) with
         | Some c -> c
         | None -> "exception")
  in
  Wire.kw_map
    [ "code", kw code
    ; "message", Wire.String (ex_message e)
    ; "at", Wire.Float (Clock.now_ms ())
    ; "data", (if Wire.as_map data = [] then Wire.Nil else data)
    ]

let set_last_sync_error (client : Sync_state.client) (e : exn) =
  client.last_sync_error := Some (error_to_diagnostic e)

let clear_last_sync_error (client : Sync_state.client) =
  client.last_sync_error := None

(* sync-util/coerce — returns None on coerce failure (invalid-coerce) *)
let coerce (f : Wire.t -> Wire.t) (v : Wire.t) ~context : Wire.t option =
  try Some (f v)
  with e ->
    Worker_log.error "db-sync/malli-coerce-failed"
      (context @ [ "error", ex_message e ]);
    None

let build_revision () = Common_version.revision ()

(* sync-util/with-client-revision — :sync/tx-batch gets :client-revision *)
let with_client_revision schema_key (body : Wire.t) : Wire.t =
  if schema_key = "sync/tx-batch" then
    match body with
    | Wire.Map kvs
      when not (List.exists
                  (fun (k, _) -> Wire.key_matches "client-revision" k)
                  kvs) ->
        Wire.Map
          (kvs @ [ (kw "client-revision", Wire.String (build_revision ())) ])
    | _ -> body
  else body

let coerce_http_request schema_key (body : Wire.t) : Wire.t option =
  match Hashtbl.find_opt Db_sync_coerce.http_request_coercers schema_key with
  | Some coercer ->
      coerce coercer (with_client_revision schema_key body)
        ~context:[ "schema", schema_key; "dir", "request" ]
  | None -> Some body

let coerce_http_response schema_key (body : Wire.t) : Wire.t option =
  match Hashtbl.find_opt Db_sync_coerce.http_response_coercers schema_key with
  | Some coercer ->
      coerce coercer body
        ~context:[ "schema", schema_key; "dir", "response" ]
  | None -> Some body

let auth_headers () : (string * string) list =
  match auth_token () with
  | None -> raise (ex_info "Empty token" [])
  | Some token -> [ "authorization", "Bearer " ^ token ]

(* sync-util/fetch-json — the platform impl wired as the default
   Sync_deps.fetch_json hook; tests may override the hook. *)
let fetch_json_default url ?(meth = "GET") ?(headers = []) ?body
    ?response_schema ?(error_schema = "error") () : Wire.t Db_worker_effect.t =
  let headers = auth_headers () @ headers in
  Http.send { Http.url; method_ = meth; headers; body } >>= fun resp ->
  let data =
    if String.length resp.body = 0 then Wire.Nil
    else Json_codec.parse resp.body
  in
  if resp.status >= 200 && resp.status < 300 then
    match response_schema with
    | Some schema ->
        (match coerce_http_response schema data with
         | Some body -> Db_worker_effect.pure body
         | None ->
             Db_worker_effect.error
               (ex_info "db-sync invalid response"
                  [ kw "status", Wire.Int resp.status
                  ; kw "url", Wire.String url
                  ; kw "body", data ]))
    | None -> Db_worker_effect.pure data
  else
    let body =
      match coerce_http_response error_schema data with
      | Some b -> b
      | None -> data
    in
    Db_worker_effect.error
      (ex_info "db-sync request failed"
         [ kw "status", Wire.Int resp.status
         ; kw "url", Wire.String url
         ; kw "body", body ])

let fetch_json url ?(meth = "GET") ?(headers = []) ?body ?response_schema
    ?(error_schema = "error") () : Wire.t Db_worker_effect.t =
  match !Sync_deps.fetch_json with
  | Some f -> f url ~meth ~headers ?body ?response_schema ~error_schema ()
  | None ->
      fetch_json_default url ~meth ~headers ?body ?response_schema
        ~error_schema ()

(* sync-deps: platform JSON fetch *)
let () = Sync_deps.fetch_json := Some fetch_json_default

(* worker-common/parse-jwt — decode the payload segment *)
let b64_alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

let b64_val c =
  match String.index_opt b64_alphabet c with
  | Some i -> i
  | None -> invalid_arg (Printf.sprintf "bad base64 char %c" c)

let decode_b64url s =
  let s =
    String.map (fun c -> match c with '-' -> '+' | '_' -> '/' | c -> c) s
  in
  let pad = (4 - String.length s mod 4) mod 4 in
  let s' = s ^ String.make pad '=' in
  let len = String.length s' in
  if len mod 4 <> 0 then None
  else
    let b = Buffer.create (len / 4 * 3) in
    (try
       for i = 0 to (len / 4) - 1 do
         let j = i * 4 in
         let c0 = b64_val s'.[j] and c1 = b64_val s'.[j + 1] in
         let c2 = if s'.[j + 2] = '=' then -1 else b64_val s'.[j + 2] in
         let c3 = if s'.[j + 3] = '=' then -1 else b64_val s'.[j + 3] in
         Buffer.add_char b (Char.chr (((c0 lsl 2) lor (c1 lsr 4)) land 0xff));
         if c2 >= 0 then
           Buffer.add_char b
             (Char.chr ((((c1 land 15) lsl 4) lor (c2 lsr 2)) land 0xff));
         if c3 >= 0 then
           Buffer.add_char b
             (Char.chr ((((c2 land 3) lsl 6) lor c3) land 0xff))
       done;
       Some (Buffer.contents b)
     with _ -> None)

let parse_jwt (token : string) : Wire.t option =
  match String.split_on_char '.' token with
  | [ _h; payload; _sig ] ->
      (match decode_b64url payload with
       | Some json ->
           (try Some (Json_codec.parse json) with Json_codec.Json_error _ -> None)
       | None -> None)
  | _ -> None

(* test seam — cljs with-redefs [worker-util/parse-jwt] *)
let parse_jwt_fn = ref parse_jwt

(* cljs decode-username: cognito:username may be URL-encoded *)
let url_decode s =
  let b = Buffer.create (String.length s) in
  let i = ref 0 in
  while !i < String.length s do
    (match s.[!i] with
     | '%' when !i + 2 < String.length s ->
         (match int_of_string_opt ("0x" ^ String.sub s (!i + 1) 2) with
          | Some c -> Buffer.add_char b (Char.chr c); i := !i + 3
          | None -> Buffer.add_char b '%'; incr i)
     | '+' -> Buffer.add_char b ' '; incr i
     | c -> Buffer.add_char b c; incr i)
  done;
  Buffer.contents b

let jwt_payload_field token name =
  match !parse_jwt_fn token with
  | Some payload ->
      (match Wire.get name payload with
       | Some (Wire.String s) -> Some (url_decode s)
       | _ -> None)
  | None -> None

let jwt_exp token : float option =
  match !parse_jwt_fn token with
  | Some payload ->
      (match Wire.get "exp" payload with
       | Some w -> Wire.as_float w
       | None -> None)
  | None -> None
