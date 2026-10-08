(* frontend.worker.sync.presence — sync-counts, rtc-state payload,
   online-user bookkeeping. *)

let current_client repo : Sync_state.client option =
  match !Sync_state.db_sync_client with
  | Some c when c.Sync_state.repo = repo -> Some c
  | _ -> None

let int_or_nil = function Some n -> Wire.Int n | None -> Wire.Nil
let str_or_nil = function Some s -> Wire.String s | None -> Wire.Nil

(* presence/sync-counts — remote values come from the apply_txs-side
   latest-remote tables; asset helpers from sync_assets. *)
let sync_counts ~get_missing_asset_upload_files ~latest_remote_tx
    ~latest_remote_checksum repo : Wire.t option =
  match Worker_state.datascript_conn repo with
  | None -> None
  | Some _ ->
      let pending_local = Sync_client_op.get_pending_local_tx_count repo in
      let pending_asset = Sync_client_op.get_unpushed_asset_ops_count repo in
      let missing_files = get_missing_asset_upload_files repo in
      let local_tx = Sync_client_op.get_local_tx repo in
      let remote_tx = Hashtbl.find_opt latest_remote_tx repo in
      let local_checksum = Sync_client_op.get_local_checksum repo in
      let remote_checksum = Hashtbl.find_opt latest_remote_checksum repo in
      let pending_server =
        match (local_tx, remote_tx) with
        | Some l, Some r -> Some (max 0 (r - l))
        | _ -> None
      in
      let graph_uuid = Sync_client_op.get_graph_uuid repo in
      let client = current_client repo in
      let ws_url =
        match Worker_state.db_sync_config () with
        | Wire.Map _ as c -> Wire.get "ws-url" c
        | _ -> None
      in
      let ws_state =
        match client with
        | Some c -> !(c.Sync_state.ws_state)
        | None ->
            (match ws_url with
             | Some (Wire.String s) when s <> "" -> "stopped"
             | _ -> "inactive")
      in
      let last_error =
        match client with
        | Some c -> (match !(c.Sync_state.last_sync_error) with Some e -> e | None -> Wire.Nil)
        | None -> Wire.Nil
      in
      Some
        (Wire.Map
           [ Wire.Keyword "repo", Wire.String repo
           ; Wire.Keyword "graph-id", str_or_nil graph_uuid
           ; Wire.Keyword "pending-local", Wire.Int pending_local
           ; Wire.Keyword "pending-asset", Wire.Int pending_asset
           ; Wire.Keyword "missing-asset-upload-files", Wire.Array missing_files
           ; Wire.Keyword "pending-server", int_or_nil pending_server
           ; Wire.Keyword "local-tx", int_or_nil local_tx
           ; Wire.Keyword "remote-tx", int_or_nil remote_tx
           ; Wire.Keyword "local-checksum", str_or_nil local_checksum
           ; Wire.Keyword "remote-checksum", str_or_nil remote_checksum
           ; Wire.Keyword "ws-state", Wire.Keyword ws_state
           ; Wire.Keyword "last-error", last_error ])

let normalize_online_users (users : Wire.t list) : Wire.t list =
  users
  |> List.filter_map (fun u ->
         match Wire.get "user-id" u with
         | Some (Wire.String user_id) ->
             (* cljs (or username name user-id) — first truthy, any type *)
             let truthy = function
               | Some (Wire.Nil) | None -> false
               | Some (Wire.Bool false) -> false
               | Some _ -> true
             in
             let display_name =
               let username = Wire.get "username" u
               and name = Wire.get "name" u in
               if truthy username then Option.get username
               else if truthy name then Option.get name
               else Wire.String user_id
             in
             let base =
               [ Wire.Keyword "user/uuid", Wire.String user_id
               ; Wire.Keyword "user/name", display_name ]
             in
             let base =
               match Wire.get "email" u with
               | Some (Wire.String e) ->
                   base @ [ (Wire.Keyword "user/email", Wire.String e) ]
               | _ -> base
             in
             Some (Wire.Map base)
         | _ -> None)
  |> Sync_state.distinct_by (fun u ->
         match Wire.get "user/uuid" u with
         | Some (Wire.String s) -> s
         | _ -> "")

(* rtc-state-payload *)
let rtc_state_payload ~sync_counts (client : Sync_state.client) : Wire.t =
  let counts =
    match sync_counts client.repo with
    | Some c -> c
    | None -> Wire.Map []
  in
  let get name = Option.value (Wire.get name counts) ~default:Wire.Nil in
  let missing_files =
    match get "missing-asset-upload-files" with
    | Wire.Array xs | Wire.List xs -> xs
    | _ -> []
  in
  let ws_state = !(client.Sync_state.ws_state) in
  Wire.Map
    [ Wire.Keyword "rtc-state"
    , Wire.Map [ (Wire.Keyword "ws-state", Wire.Keyword ws_state) ]
    ; Wire.Keyword "rtc-lock", Wire.Bool (ws_state = "open")
    ; Wire.Keyword "online-users", Wire.Array !(client.online_users)
    ; Wire.Keyword "unpushed-block-update-count"
    , (match get "pending-local" with Wire.Int n -> Wire.Int n | _ -> Wire.Int 0)
    ; Wire.Keyword "pending-asset-ops-count"
    , (match get "pending-asset" with Wire.Int n -> Wire.Int n | _ -> Wire.Int 0)
    ; Wire.Keyword "missing-asset-upload-files", Wire.Array missing_files
    ; Wire.Keyword "missing-asset-upload-files-count"
    , Wire.Int (List.length missing_files)
    ; Wire.Keyword "pending-server-ops-count"
    , (match get "pending-server" with Wire.Int n -> Wire.Int n | _ -> Wire.Int 0)
    ; Wire.Keyword "local-tx", get "local-tx"
    ; Wire.Keyword "remote-tx", get "remote-tx"
    ; Wire.Keyword "local-checksum", get "local-checksum"
    ; Wire.Keyword "remote-checksum", get "remote-checksum"
    ; Wire.Keyword "graph-uuid", get "graph-id" ]

(* set-ws-state! / update-online-users! / update-user-presence!
   broadcast-f = enqueue-broadcast-rtc-state (sync.cljs-side) *)
let set_ws_state ~broadcast (client : Sync_state.client) ws_state =
  client.ws_state := ws_state;
  broadcast client

let update_online_users ~broadcast (client : Sync_state.client)
    (users : Wire.t list) =
  let users' = normalize_online_users users in
  if users' <> !(client.online_users) then begin
    client.online_users := users';
    broadcast client
  end

let update_user_presence ~broadcast (client : Sync_state.client)
    ~(user_id : string) ~(editing_block_uuid : string option) =
  (* cljs (and user-id* editing-block-uuid) — truthy: nil blocks,
     an empty string does not *)
  match editing_block_uuid with
  | Some editing_block_uuid -> begin
    client.online_users :=
      List.map
        (fun u ->
           match Wire.get "user/uuid" u with
           | Some (Wire.String id) when id = user_id ->
               (match u with
                | Wire.Map kvs ->
                    Wire.Map
                      ((List.filter
                          (fun (k, _) -> k <> Wire.Keyword "user/editing-block-uuid")
                          kvs)
                       @ [ ( Wire.Keyword "user/editing-block-uuid"
                           , Wire.String editing_block_uuid ) ])
                | _ -> u)
           | _ -> u)
        !(client.online_users);
    broadcast client
  end
  | None -> ()
