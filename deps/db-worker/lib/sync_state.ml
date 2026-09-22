(* frontend.worker.state atoms used by the sync layer.
   Worker_state already covers datascript conns, single sqlite conn per repo,
   app-state and thread atoms; this module mirrors the remaining sync-specific
   atoms: *db-sync-client, client-ops sqlite conns, repo->pending-local-tx-count
   is in Worker_state. *)

(* cljs frontend.worker.sync client state — ensure-client-state! *)
type reconnect_state =
  { mutable attempt : int
  ; mutable timer : Timers.timer option
  }

(* in-flight upload batch tracked for response timeout reporting *)
type upload_request =
  { tx_ids : string list
  ; outliner_ops : string list
  ; large_upload_progress : Wire.t list
  ; t_before : int option
  ; mutable sent_at : float
  ; mutable timer : Timers.timer option
  }

type client =
  { repo : string
  ; mutable ws : Web_socket.t option
  ; mutable graph_id : string option
  ; send_queue : unit Db_worker_effect.t ref
  ; receive_queue : unit Db_worker_effect.t ref
  ; asset_queue : unit Db_worker_effect.t ref
  ; pending_pull_since : int option ref
  ; inflight : string list ref
  ; upload_request : upload_request option ref
  ; last_sync_error : Wire.t option ref
  ; reconnect : reconnect_state ref
  ; stale_kill_timer : Timers.timer option ref
  ; last_ws_message_ts : float ref
  ; online_users : Wire.t list ref
  ; ws_state : string ref (* "inactive" | "connecting" | "open" | "closed" | "stopped" *)
  }

let new_client repo : client =
  { repo
  ; ws = None
  ; graph_id = None
  ; send_queue = ref (Db_worker_effect.pure ())
  ; receive_queue = ref (Db_worker_effect.pure ())
  ; asset_queue = ref (Db_worker_effect.pure ())
  ; pending_pull_since = ref None
  ; inflight = ref []
  ; upload_request = ref None
  ; last_sync_error = ref None
  ; reconnect = ref { attempt = 0; timer = None }
  ; stale_kill_timer = ref None
  ; last_ws_message_ts = ref (Clock.now_ms ())
  ; online_users = ref []
  ; ws_state = ref "closed"
  }

(* worker-state/*db-sync-client — a single active client *)
let db_sync_client : client option ref = ref None

(* cljs queue semantics: promise-chained atoms.
   send/asset queues chain plainly (a rejected task poisons the chain);
   the receive queue additionally catches + logs errors to keep draining. *)
let enqueue (queue : unit Db_worker_effect.t ref) (task : unit -> unit Db_worker_effect.t) : unit =
  queue := Db_worker_effect.bind !queue (fun () -> task ())

let enqueue_catching queue task ~on_error =
  queue :=
    Db_worker_effect.catch
      (Db_worker_effect.bind
         (Db_worker_effect.catch !queue (fun _ -> Db_worker_effect.pure ()))
         (fun () -> task ()))
      on_error

(* worker-state/get-sqlite-conn [repo :client-ops] — separate sqlite db holding
   the client_ops tables. cljs db_core opens it at create-or-open-db; here it
   is opened lazily beside the graph db file. *)
let client_ops_conns : (string, Sqlite.db) Hashtbl.t = Hashtbl.create 7

let db_dir () =
  match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
  | Some dir -> dir
  | None -> "."

let sanitize_repo_name repo =
  String.map (fun c -> match c with '/' | '\\' | ':' -> '-' | c -> c) repo

let client_ops_path repo =
  Filename.concat (db_dir ()) (Printf.sprintf "client-ops-%s.sqlite" (sanitize_repo_name repo))

let client_ops_conn repo : Sqlite.db =
  match Hashtbl.find_opt client_ops_conns repo with
  | Some db -> db
  | None ->
      let db =
        Sqlite.open_db_pool ~name:(Graph_dir.pool_name repo)
          ~path:
            (if Sqlite.pooled_runtime () then "client-ops-/db.sqlite"
             else client_ops_path repo)
      in
      Sqlite.exec db ~sql:"pragma journal_mode=WAL" ~bind:[||];
      Hashtbl.replace client_ops_conns repo db;
      db

let has_client_ops_conn repo = Hashtbl.mem client_ops_conns repo

let close_client_ops_conn repo =
  match Hashtbl.find_opt client_ops_conns repo with
  | Some db -> Sqlite.close db; Hashtbl.remove client_ops_conns repo
  | None -> ()

(* worker-state/get-sqlite-conn [repo which-db] — :db main graph sqlite,
   :search the vector/search index db (search package owns the schema). *)
let search_conns : (string, Sqlite.db) Hashtbl.t = Hashtbl.create 7

let search_conn repo : Sqlite.db option =
  Hashtbl.find_opt search_conns repo

let set_search_conn repo db = Hashtbl.replace search_conns repo db
let drop_search_conn repo = Hashtbl.remove search_conns repo

(* worker-state/get-id-token — :auth/id-token in app state *)
let id_token () : string option =
  match Worker_state.state_get "auth/id-token" with
  | Some (Wire.String s) -> Some s
  | _ -> None

(* worker-state/non-auth-db-sync-config — db-sync-config minus auth keys *)
let non_auth_db_sync_config (config : Wire.t) : Wire.t =
  let drop = [ "auth-token"; "oauth-token-url"; "oauth-domain"; "oauth-client-id" ] in
  match config with
  | Wire.Map kvs ->
      Wire.Map
        (List.filter
           (fun (k, _) ->
              match k with
              | Wire.Keyword k | Wire.String k -> not (List.mem k drop)
              | _ -> true)
           kvs)
  | t -> t

let current_repo () : string option =
  match Worker_state.state_get "git/current-repo" with
  | Some (Wire.String r) -> Some r
  | _ -> None

let set_current_repo repo =
  Worker_state.merge_state (Wire.Map [ (Wire.Keyword "git/current-repo", Wire.String repo) ])

(* worker-state/online? — node checks navigator.onLine; browser worker uses
   the online-event thread atom. *)
let online () : bool =
  match Runtime_env.kind () with
  | Runtime_env.Native -> true
  | _ ->
      (match Worker_state.thread_atom "online-event" with
       | Some (Wire.Bool false) -> false
       | _ -> true)

(* common-util/distinct-by *)
let distinct_by f xs =
  let seen = Hashtbl.create 16 in
  List.filter
    (fun x ->
       let k = f x in
       if Hashtbl.mem seen k then false
       else (Hashtbl.replace seen k (); true))
    xs

(* common-util/uuid-string? *)
let uuid_re = Regexp.compile "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"

let uuid_string s = Regexp.test uuid_re s

let time_ms () = Clock.now_ms ()

(* worker-util/dev-or-test? — goog.DEBUG || node-test in cljs; a settable
   flag here, defaulting to off like production builds *)
let dev_or_test : bool ref = ref false
