(* logseq.db-sync.malli-schema — hand-written coercers matching the malli
   schemas + json transformer. Validation is fail-fast; uuid fields coerce
   string -> Uuid, keyword fields string -> Keyword, ints must be numbers.
   Unknown map keys are preserved (malli maps are open). *)

exception Coerce_error of string * Wire.t

let err what v = raise (Coerce_error (what, v))

let uuid_re =
  Regexp.compile
    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"

let as_str v = match v with Wire.String s -> s | _ -> err "string" v
let as_str_or_uuid v =
  match v with Wire.String s | Wire.Uuid s -> s | _ -> err "string" v

let as_uuid v =
  match v with
  | Wire.Uuid s -> s
  | Wire.String s when Regexp.test uuid_re s -> s
  | _ -> err "uuid" v

let as_int v =
  match v with
  | Wire.Int n -> n
  | Wire.Int64 n -> Int64.to_int n
  | Wire.Float f when Float.equal f (Float.of_int (int_of_float f)) ->
      int_of_float f
  | _ -> err "int" v

let as_bool v = match v with Wire.Bool b -> b | _ -> err "boolean" v
let as_seq v =
  match v with
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> err "seq" v

let as_kw v =
  match v with
  | Wire.Keyword s -> s
  | Wire.String s -> s
  | _ -> err "keyword" v

let opt_kw s = Wire.Keyword s
let kw_name = function Wire.Keyword s | Wire.String s -> s | _ -> ""

let map_kv v =
  match v with
  | Wire.Map kvs -> kvs
  | Wire.Nil -> []
  | _ -> err "map" v

let field v name = Wire.get name v
let req v name f =
  match field v name with
  | Some x -> f x
  | None -> err (Printf.sprintf "missing key :%s" name) v

let opt v name f =
  match field v name with
  | Some x -> Some (f x)
  | None -> None

let optm v name f =
  match field v name with
  | Some (Wire.Nil) -> None
  | Some x -> Some (f x)
  | None -> None

(* validation returns normalized Wire maps with uuid/keyword coercion applied
   to declared fields *)
let set_field kvs name v = Wire.Map (kvs @ [ (opt_kw name, v) ])

let norm_field kvs name f =
  if Option.is_some (field (Wire.Map kvs) name) then
    List.map (fun (k, v) -> if Wire.key_matches name k then (k, f v) else (k, v)) kvs
  else kvs

(* ---- schema validators: raise Coerce_error or return normalized map ---- *)

let tx_entry v =
  let kvs = map_kv v in
  ignore (opt (Wire.Map kvs) "tx-id" as_uuid);
  ignore (req (Wire.Map kvs) "tx" as_str);
  ignore (optm (Wire.Map kvs) "outliner-op" as_kw);
  Wire.Map (norm_field kvs "tx-id" (fun x -> Wire.Uuid (as_uuid x)))

let tx_log_entry v =
  let kvs = map_kv v in
  ignore (req (Wire.Map kvs) "t" as_int);
  ignore (req (Wire.Map kvs) "tx" as_str);
  ignore (optm (Wire.Map kvs) "outliner-op" as_kw);
  Wire.Map kvs

let coerce_seq elem xs = List.map elem xs

let user_presence v =
  let kvs = map_kv v in
  let m = Wire.Map kvs in
  ignore (req m "user-id" as_str_or_uuid);
  ignore (optm m "email" as_str);
  ignore (optm m "username" as_str);
  ignore (optm m "name" as_str);
  m

let online_users v =
  let kvs = map_kv v in
  let m = Wire.Map kvs in
  let users = req m "online-users" (fun x -> coerce_seq user_presence (as_seq x)) in
  Wire.Map (norm_field kvs "online-users" (fun _ -> Wire.Array users))

let pull_ok v =
  let kvs = map_kv v in
  let m = Wire.Map kvs in
  ignore (req m "t" as_int);
  ignore (opt m "checksum" as_str);
  ignore (req m "txs" (fun x -> coerce_seq tx_log_entry (as_seq x)));
  m

let tx_batch_ok v =
  let kvs = map_kv v in
  let m = Wire.Map kvs in
  ignore (req m "t" as_int);
  ignore (opt m "checksum" as_str);
  m

let tx_reject_reasons =
  [ "stale"; "empty tx data"; "invalid tx"; "invalid t-before"
  ; "db transact failed"; "snapshot upload in progress" ]

let uuid_seq v = coerce_seq (fun x -> Wire.Uuid (as_uuid x)) (as_seq v)

let tx_reject v =
  let kvs = map_kv v in
  let m = Wire.Map kvs in
  let reason = req m "reason" as_str in
  if not (List.mem reason tx_reject_reasons) then
    err (Printf.sprintf "tx-reject reason %s" reason) v;
  ignore (opt m "t" as_int);
  ignore (opt m "error-detail" as_str);
  ignore (opt m "data" as_str);
  Wire.Map
    (norm_field
       (norm_field
          (norm_field kvs "success-tx-ids"
             (fun x -> Wire.Array (uuid_seq x)))
          "failed-tx-id" (fun x -> Wire.Uuid (as_uuid x)))
       "missing-block-uuids" (fun x -> Wire.Array (uuid_seq x)))

let ws_type v = req v "type" as_str

let ws_server_message v =
  match ws_type v with
  | "hello" ->
      let m = Wire.Map (map_kv v) in
      ignore (req m "t" as_int); ignore (opt m "checksum" as_str); m
  | "online-users" -> online_users v
  | "presence" ->
      let m = Wire.Map (map_kv v) in
      ignore (req m "user-id" as_str_or_uuid);
      ignore (req m "editing-block-uuid" (fun x -> match x with Wire.Nil -> "" | v -> as_str v));
      m
  | "pull/ok" -> pull_ok v
  | "tx/batch/ok" -> tx_batch_ok v
  | "changed" -> let m = Wire.Map (map_kv v) in ignore (req m "t" as_int); m
  | "tx/reject" -> tx_reject v
  | "pong" -> Wire.Map (map_kv v)
  | "error" -> let m = Wire.Map (map_kv v) in ignore (req m "message" as_str); m
  | other -> err (Printf.sprintf "unknown ws server message type %s" other) v

let tx_batch_request v =
  let kvs = map_kv v in
  let m = Wire.Map kvs in
  ignore (req m "t-before" as_int);
  ignore (req m "txs" (fun x -> coerce_seq tx_entry (as_seq x)));
  ignore (opt m "client-revision" as_str);
  m

let ws_client_message v =
  match ws_type v with
  | "hello" -> let m = Wire.Map (map_kv v) in ignore (req m "client" as_str); m
  | "presence" ->
      let m = Wire.Map (map_kv v) in
      ignore (optm m "editing-block-uuid" as_str); m
  | "pull" -> let m = Wire.Map (map_kv v) in ignore (opt m "since" as_int); m
  | "tx/batch" -> tx_batch_request v
  | "ping" -> Wire.Map (map_kv v)
  | other -> err (Printf.sprintf "unknown ws client message type %s" other) v

let graph_member_role v =
  match as_str v with
  | "manager" | "member" -> v
  | _ -> err "graph-member-role" v

let graph_info v =
  let kvs = map_kv v in
  let m = Wire.Map kvs in
  ignore (req m "graph-id" as_str);
  ignore (req m "graph-name" as_str);
  ignore (optm m "schema-version" as_str);
  ignore (opt m "graph-e2ee?" as_bool);
  ignore (opt m "graph-ready-for-use?" as_bool);
  ignore (optm m "role" (fun x -> ignore (graph_member_role x); ()));
  ignore (optm m "invited-by" as_str);
  ignore (req m "created-at" as_int);
  ignore (req m "updated-at" as_int);
  m

let graphs_list_response v =
  let kvs = map_kv v in
  let m = Wire.Map kvs in
  ignore (req m "graphs" (fun x -> coerce_seq graph_info (as_seq x)));
  ignore (opt m "user-rsa-keys-exists?" as_bool);
  m

let graph_create_response v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "graph-id" as_str);
  ignore (opt m "graph-e2ee?" as_bool);
  ignore (opt m "graph-ready-for-use?" as_bool);
  m

let graph_delete_response v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "graph-id" as_str);
  ignore (req m "deleted" as_bool);
  m

let graph_member_info v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "user-id" as_str_or_uuid);
  ignore (req m "graph-id" as_str_or_uuid);
  ignore (req m "role" (fun x -> ignore (graph_member_role x); ()));
  ignore (optm m "invited-by" as_str);
  ignore (req m "created-at" as_int);
  ignore (optm m "email" as_str);
  ignore (optm m "username" as_str);
  m

let graph_members_list_response v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "members" (fun x -> coerce_seq graph_member_info (as_seq x)));
  m

let ok_response v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "ok" as_bool); m

let error_response v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "error" as_str); m

let snapshot_download_response v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "ok" as_bool);
  ignore (req m "key" as_str);
  ignore (req m "url" as_str);
  ignore (optm m "content-encoding" as_str);
  m

let snapshot_upload_response v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "ok" as_bool);
  ignore (req m "count" as_int);
  m

let e2ee_user_key_response v =
  let m = Wire.Map (map_kv v) in
  ignore (optm m "public-key" as_str);
  ignore (optm m "encrypted-private-key" as_str);
  m

let e2ee_user_public_key_response v =
  let m = Wire.Map (map_kv v) in
  ignore (optm m "public-key" as_str); m

let e2ee_graph_aes_key_response v =
  let m = Wire.Map (map_kv v) in
  ignore (optm m "encrypted-aes-key" as_str); m

let e2ee_grant_access_response v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "ok" as_bool);
  ignore (opt m "missing-users" (fun x -> coerce_seq as_str (as_seq x)));
  m

(* request-side validators *)
let graph_create_request v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "graph-name" as_str);
  ignore (optm m "schema-version" as_str);
  ignore (opt m "graph-e2ee?" as_bool);
  ignore (opt m "graph-ready-for-use?" as_bool);
  m

let graph_member_create_request v =
  let m = Wire.Map (map_kv v) in
  (match (field m "user-id", field m "email") with
   | Some u, _ -> ignore (as_str_or_uuid u)
   | _, Some e -> ignore (as_str e)
   | _ -> err "user-id or :email required" v);
  ignore (opt m "role" (fun x -> ignore (graph_member_role x); ()));
  m

let graph_member_update_request v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "role" (fun x -> ignore (graph_member_role x); ()));
  m

let e2ee_user_key_request v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "public-key" as_str);
  ignore (req m "encrypted-private-key" as_str);
  ignore (opt m "reset-private-key" as_bool);
  m

let e2ee_graph_aes_key_request v =
  let m = Wire.Map (map_kv v) in
  ignore (req m "encrypted-aes-key" as_str); m

let e2ee_grant_access_request v =
  let m = Wire.Map (map_kv v) in
  ignore
    (req m "target-user-email+encrypted-aes-key-coll"
       (fun x ->
          coerce_seq
            (fun e ->
               let em = Wire.Map (map_kv e) in
               ignore (req em "email" as_str);
               ignore (req em "encrypted-aes-key" as_str);
               em)
            (as_seq x)));
  m

(* :or [:any error] — pass through *)
let asset_get_response v = v

let ws_type_opt v = try Some (ws_type v) with Coerce_error _ -> None

let tx_batch_response v =
  (* [:or tx-batch-ok tx-reject http-error] *)
  match ws_type_opt v with
  | Some "tx/reject" -> tx_reject v
  | _ ->
      (match (Wire.get "ok" v, Wire.get "t" v) with
       | Some _, _ -> ok_response v
       | _, Some _ -> tx_batch_ok v
       | _ -> error_response v)

let http_request_coercers : (string, Wire.t -> Wire.t) Hashtbl.t =
  let t = Hashtbl.create 16 in
  Hashtbl.replace t "graphs/create" graph_create_request;
  Hashtbl.replace t "graph-members/create" graph_member_create_request;
  Hashtbl.replace t "graph-members/update" graph_member_update_request;
  Hashtbl.replace t "sync/tx-batch" tx_batch_request;
  Hashtbl.replace t "e2ee/user-keys" e2ee_user_key_request;
  Hashtbl.replace t "e2ee/graph-aes-key" e2ee_graph_aes_key_request;
  Hashtbl.replace t "e2ee/grant-access" e2ee_grant_access_request;
  t

let http_response_coercers : (string, Wire.t -> Wire.t) Hashtbl.t =
  let t = Hashtbl.create 24 in
  Hashtbl.replace t "graphs/list" graphs_list_response;
  Hashtbl.replace t "graphs/create" graph_create_response;
  Hashtbl.replace t "graphs/access" ok_response;
  Hashtbl.replace t "graphs/delete" graph_delete_response;
  Hashtbl.replace t "graph-members/list" graph_members_list_response;
  Hashtbl.replace t "graph-members/create" ok_response;
  Hashtbl.replace t "graph-members/update" ok_response;
  Hashtbl.replace t "graph-members/delete" ok_response;
  Hashtbl.replace t "worker/health" ok_response;
  Hashtbl.replace t "sync/health" ok_response;
  Hashtbl.replace t "sync/pull" pull_ok;
  Hashtbl.replace t "sync/tx-batch" tx_batch_response;
  Hashtbl.replace t "sync/snapshot-download" snapshot_download_response;
  Hashtbl.replace t "sync/snapshot-upload" snapshot_upload_response;
  Hashtbl.replace t "sync/admin-reset" ok_response;
  Hashtbl.replace t "e2ee/user-keys" e2ee_user_key_response;
  Hashtbl.replace t "e2ee/user-public-key" e2ee_user_public_key_response;
  Hashtbl.replace t "e2ee/graph-aes-key" e2ee_graph_aes_key_response;
  Hashtbl.replace t "e2ee/grant-access" e2ee_grant_access_response;
  Hashtbl.replace t "assets/get" asset_get_response;
  Hashtbl.replace t "assets/put" ok_response;
  Hashtbl.replace t "assets/delete" ok_response;
  Hashtbl.replace t "error" error_response;
  t

let ws_client_message v = ws_client_message v
let ws_server_message v = ws_server_message v
