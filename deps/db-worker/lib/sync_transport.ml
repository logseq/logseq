(* frontend.worker.sync.transport — ws/url/message-shaping helpers.
   ws payloads are JSON (not transit) both directions. *)

let contains s sub =
  let ls = String.length s and lsub = String.length sub in
  let rec go i =
    if i + lsub > ls then false
    else if String.sub s i lsub = sub then true
    else go (i + 1)
  in
  lsub = 0 || go 0

let replace_all s pat rep =
  let ls = String.length s and lp = String.length pat in
  let b = Buffer.create ls in
  let rec go i =
    if i + lp > ls then Buffer.add_substring b s i (ls - i)
    else if String.sub s i lp = pat then begin
      Buffer.add_string b rep;
      go (i + lp)
    end else begin
      Buffer.add_char b s.[i];
      go (i + 1)
    end
  in
  go 0;
  Buffer.contents b

let ends_with s suffix =
  let ls = String.length s and lf = String.length suffix in
  ls >= lf && String.sub s (ls - lf) lf = suffix

let format_ws_url base graph_id =
  (* cljs string/replace — every %s, not just the first *)
  if contains base "%s" then replace_all base "%s" graph_id
  else if ends_with base "/" then base ^ graph_id
  else base ^ "/" ^ graph_id

(* encodeURIComponent: unreserved + !'()*-._~ left raw *)
let uri_encode s =
  let b = Buffer.create (String.length s) in
  String.iter
    (fun c ->
       let keep =
         (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')
         || (c >= '0' && c <= '9')
         || List.mem c [ '!'; '\''; '('; ')'; '*'; '-'; '.'; '_'; '~' ]
       in
       if keep then Buffer.add_char b c
       else
         Buffer.add_string b
           (Printf.sprintf "%%%02X" (Char.code c)))
    s;
  Buffer.contents b

let append_token url token =
  match token with
  | Some token ->
      let sep = if contains url "?" then "&" else "?" in
      url ^ sep ^ "token=" ^ uri_encode token
  | None -> url

let ws_open (ws : Sync_state.ws_endpoint) =
  Sync_state.ws_endpoint_ready_state ws = 1

(* uuid-like -> string (legacy tx/reject fields) *)
let uuid_like_to_string = function
  | Wire.Uuid u -> Wire.String u
  | Wire.Map kvs ->
      (match Wire.get "uuid" (Wire.Map kvs) with
       | Some (Wire.String s) -> Wire.String s
       | _ -> Wire.Map kvs)
  | v -> v

(* cljs (mapv uuid-like->string (or ids [])) — nil -> [], any other
   non-seq value throws, same failure channel as a coerce rejection *)
let normalize_string_list = function
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      Wire.Array (List.map uuid_like_to_string xs)
  | Wire.Nil -> Wire.Array []
  | v ->
      raise
        (Db_sync_coerce.Coerce_error
           ("tx/reject-field-not-seqable", v))

(* normalize-legacy-tx-reject: stringify uuid-likes before schema coercion *)
let normalize_legacy_tx_reject (m : Wire.t) : Wire.t =
  match m with
  | Wire.Map kvs when
      (match Wire.get "type" m with
       | Some (Wire.String "tx/reject" | Wire.Keyword "tx/reject") -> true
       | _ -> false) ->
      Wire.Map
        (List.map
           (fun (k, v) ->
              match k with
              | Wire.Keyword "failed-tx-id" -> (k, uuid_like_to_string v)
              | Wire.Keyword "success-tx-ids"
              | Wire.Keyword "missing-block-uuids" ->
                  (k, normalize_string_list v)
              | _ -> (k, v))
           kvs)
  | _ -> m

let coerce_ws_client_message (message : Wire.t) : Wire.t option =
  if Wire.is_nil message then None
  else
    match Db_sync_coerce.ws_client_message message with
    | v -> Some v
    | exception Db_sync_coerce.Coerce_error (schema, _) ->
        Worker_log.error "db-sync/malli-coerce-failed"
          [ ("schema", schema) ];
        None

let coerce_ws_server_message (message : Wire.t) : Wire.t option =
  if Wire.is_nil message then None
  else
    let message = normalize_legacy_tx_reject message in
    match Db_sync_coerce.ws_server_message message with
    | v -> Some v
    | exception Db_sync_coerce.Coerce_error (schema, _) ->
        Worker_log.error "db-sync/malli-coerce-failed"
          [ ("schema", schema) ];
        None

let parse_transit tag context value : Wire.t =
  match Transit_codec.of_string value with
  | v -> v
  | exception e ->
      Sync_util.fail_fast tag
        (Wire.Map (context @ [ (Wire.Keyword "error", Wire.String (Printexc.to_string e)) ]))

let () = Random.self_init ()

let reconnect_delay_ms attempt ~(base_delay_ms : int) ~(max_delay_ms : int)
    ~(jitter_ms : int) : int =
  let exp = Float.of_int (1 lsl min attempt 30) in
  let delay =
    min (float_of_int max_delay_ms) (float_of_int base_delay_ms *. exp)
  in
  int_of_float delay + (if jitter_ms > 0 then Random.int jitter_ms else 0)

let parse_message (raw : string) : Wire.t option =
  match Json_codec.parse raw with
  | v -> Some v
  | exception _ -> None

(* cljs (str tx-id) — stringify any truthy tx-id before JSON encoding *)
let str_of_wire (v : Wire.t) : string =
  match v with
  | Wire.String s | Wire.Uuid s | Wire.Keyword s -> s
  | Wire.Int n -> string_of_int n
  | Wire.Int64 n -> Int64.to_string n
  | Wire.Float f -> Common_util.js_string_of_float f
  | Wire.Bool b -> if b then "true" else "false"
  | w -> Transit_codec.to_string w

let normalize_tx_batch_ids = function
  | Wire.Map kvs as m ->
      (match Wire.get "type" m, Wire.get "txs" m with
       | Some (Wire.String "tx/batch" | Wire.Keyword "tx/batch"), Some txs ->
           let txs' =
             match txs with
             | Wire.Array entries | Wire.List entries ->
                 Wire.Array
                   (List.map
                      (fun entry ->
                         match Wire.get "tx-id" entry with
                         | Some (Wire.Nil) | Some (Wire.Bool false)
                         | None -> entry
                         | Some tx_id ->
                             (match entry with
                              | Wire.Map kvs ->
                                  Wire.Map
                                    (List.map
                                       (fun (k, v) ->
                                          match k with
                                          | Wire.Keyword "tx-id" ->
                                              (k, Wire.String (str_of_wire tx_id))
                                          | _ -> (k, v))
                                       kvs)
                              | _ -> entry))
                      entries)
             | v -> v
           in
           Wire.Map
             (List.map
                (fun (k, v) ->
                   match k with
                   | Wire.Keyword "txs" -> (k, txs')
                   | _ -> (k, v))
                kvs)
       | _ -> m)
  | m -> m

let send (ws : Sync_state.ws_endpoint) (message : Wire.t)
    : unit Db_worker_effect.t =
  if ws_open ws then
    match coerce_ws_client_message message with
    | Some coerced ->
        Sync_state.ws_endpoint_send ws
          (Json_codec.encode (normalize_tx_batch_ids coerced))
    | None ->
        Worker_log.error "db-sync/ws-request-invalid"
          [ ("message", Json_codec.encode message) ];
        Db_worker_effect.pure ()
  else Db_worker_effect.pure ()
