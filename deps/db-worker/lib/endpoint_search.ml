(* frontend.worker.handler.search — search thread-api endpoints and the
   index-build machinery (idle loop, vector-index rebuild/upsert).

   init () wiring (registered at module load):
   - Dispatcher.register endpoints:
       thread-api/search-blocks
       thread-api/search-upsert-blocks
       thread-api/search-delete-blocks
       thread-api/search-truncate-tables
       thread-api/search-build-blocks-indice
       thread-api/search-build-blocks-indice-in-worker
       thread-api/search-build-pages-indice
       thread-api/db-sync-invalidate-search-db  (db-core <invalidate-search-db!)
   - Db_listener.register "search" — the deferred :search db-listener method
   - Sync_deps.search_truncate_table hook for other packages that need to
     clear the FTS tables without depending on this module.

   cljs opens the :search sqlite conn in get-dbs during create-or-open-db;
   endpoint_lifecycle does the same via get-search-db, which also lazily
   opens it on first use (same path convention + create-tables-and-triggers!). *)

open Datascript
module Ev = Entity_view
module E = Db_worker_effect

(* ---- constants (cljs defs at top of handler/search.cljs) ---- *)

let search_db_version = 4

let search_index_build_batch_size = 200

let vector_embedding_batch_size = 32

let vector_embedding_parallelism = 2

let vector_embedding_max_batch_chars = vector_embedding_batch_size * 2048

let vector_embedding_max_title_length = 2048

let query_embedding_timeout_ms = 50.

let search_index_build_time_budget_ms = 8

let search_index_build_idle_status_ttl_ms = 2000.

let search_index_build_pause_ms = 300.

let node_runtime () = Runtime_env.kind () = Runtime_env.Node

let is_blank s = Unicode.trim s = ""

(* clear-search-index-builds! — cljs calls this from close-db-aux!. *)
let clear_search_index_builds repo =
  Worker_state.clear_search_index_build_id repo;
  Worker_state.clear_vector_index_rebuild_id repo

(* ---- get-search-db ---- *)

let sanitize_repo_name repo =
  String.map (fun c -> match c with '/' | '\\' | ':' -> '-' | c -> c) repo

let search_db_path repo =
  let base =
    match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
    | Some dir -> dir
    | None -> "."
  in
  Filename.concat base (sanitize_repo_name repo ^ "-search.sqlite")

(* cljs get-dbs/resolve-db-path: the search sqlite lives inside the
   graph's OPFS pool as "search/db.sqlite" (browser path is the identity
   through resolve-db-path); on node it is a sibling file. *)
let open_search_db repo : Sqlite.db =
  let db =
    if Worker_state.publishing () then Sqlite.open_db ~path:"/search-db.sqlite"
    else if Sqlite.pooled_runtime () then
      Sqlite.open_db_pool ~name:(Graph_dir.pool_name repo)
        ~path:"search/db.sqlite"
    else Sqlite.open_db ~path:(search_db_path repo)
  in
  Search_index.create_tables_and_triggers db;
  db

let get_search_db repo : Sqlite.db option =
  match Worker_state.sqlite_conn_of repo Worker_state.Search with
  | Some db -> Some db
  | None -> (
      (* repo not opened through create-or-open-db has no search db *)
      match Worker_state.sqlite_conn repo with
      | None -> None
      | Some _ ->
          let db = open_search_db repo in
          Worker_state.set_sqlite_conn_of repo Worker_state.Search db;
          Some db)

let search_index_version (db : Sqlite.db) : int =
  match Sqlite.query db ~sql:"PRAGMA user_version" ~bind:[||] with
  | [| Sqlite.Integer v |] :: _ -> Int64.to_int v
  | _ -> 0

(* ---- expected vector-index metadata / persist ---- *)

let expected_vector_index_metadata () : (string * Wire.t) list =
  [ ( "embedding-model-id",
      (match Embedding.model_id () with
       | Some m -> Wire.String m
       | None -> Wire.Nil) );
    ("embedding-dimension", Wire.Int (Embedding.dimension ()));
    ("context-version", Wire.Int Search_index.vector_context_version) ]

let persist_vector_index_metadata repo : unit E.t =
  match Worker_state.vector_index repo with
  | Some index -> Vector_index.set_metadata index (expected_vector_index_metadata ())
  | None -> E.pure ()

(* ---- build-id bookkeeping (cljs *search-index-build-ids /
   *vector-index-rebuild-ids) ---- *)

let start_vector_index_rebuild repo build_id =
  Worker_state.set_vector_index_rebuild_id repo build_id

let active_vector_index_rebuild repo build_id =
  match Worker_state.vector_index_rebuild_id repo with
  | Some id -> id = build_id
  | None -> false

let clear_vector_index_rebuild repo build_id =
  match Worker_state.vector_index_rebuild_id repo with
  | Some id when id = build_id -> Worker_state.clear_vector_index_rebuild_id repo
  | _ -> ()

let start_search_index_build repo =
  let build_id = Uuid_gen.uuid () in
  Worker_state.set_search_index_build_id repo build_id;
  build_id

let clear_search_index_build repo build_id =
  match Worker_state.search_index_build_id repo with
  | Some id when id = build_id -> Worker_state.clear_search_index_build_id repo
  | _ -> ()

exception Stale_index_build of string * string

let ensure_active_search_index_build repo build_id =
  match Worker_state.search_index_build_id repo with
  | Some id when id = build_id -> ()
  | _ -> raise (Stale_index_build (repo, build_id))

(* ---- report-search-index-progress! ---- *)

let report_search_index_progress repo (payload : Wire.t) : unit E.t =
  if node_runtime () then begin
    Broadcast.to_clients ~kind:"thread-api/search-index-build-progress"
      ~transit_payload:
        (Transit_codec.to_string
           (Wire.Array
              [ Wire.Keyword "thread-api/search-index-build-progress"
              ; Wire.Array [ Wire.String repo; payload ] ]));
    E.pure ()
  end
  else
    E.map
      (fun _ -> ())
      (E.catch
         (Comlink.invoke_remote "thread-api/search-index-build-progress"
            (Transit_codec.to_string
               (Wire.Array [ Wire.String repo; payload ])))
         (fun _ -> E.pure ""))

let progress_payload ~build_id ~status ~stage ~progress ~processed ~total :
    Wire.t =
  Wire.kw_map
    [ ("build-id", Wire.String build_id); ("status", Wire.Keyword status)
    ; ("stage", Wire.Keyword stage); ("progress", Wire.Int progress)
    ; ("processed", Wire.Int processed); ("total", Wire.Int total) ]

(* ---- search-index-input-idle? / <wait-for-search-index-idle! ---- *)

let search_index_input_idle repo : bool =
  if node_runtime () then true
  else
    let idle_opt, fresh =
      match Worker_state.thread_atom "thread-atom/search-input-idle-status" with
      | Some status -> (
          match Wire.get repo status with
          | Some entry ->
              let fresh =
                match Wire.get "ts" entry with
                | Some (Wire.Float ts) ->
                    Time.epoch_ms_to_float (Time.now ()) -. ts
                    <= search_index_build_idle_status_ttl_ms
                | Some (Wire.Int ts) ->
                    Time.epoch_ms_to_float (Time.now ()) -. float_of_int ts
                    <= search_index_build_idle_status_ttl_ms
                | _ -> false
              in
              (Wire.get "idle?" entry, fresh)
          | None -> (None, false))
      | None -> (None, false)
    in
    (match fresh, idle_opt with
     | true, Some (Wire.Bool b) -> b
     | _ -> true)

let rec wait_for_search_index_idle repo build_id : unit E.t =
  ensure_active_search_index_build repo build_id;
  if search_index_input_idle repo then E.pure ()
  else
    E.bind (E.sleep search_index_build_pause_ms) (fun () ->
        wait_for_search_index_idle repo build_id)

(* ---- take-search-index-batch ---- *)

let take_search_index_batch (items : 'a list) batch_size time_budget_ms :
    'a list * 'a list =
  let start = Time.monotonic_now () in
  let rec loop batch remaining n =
    match remaining with
    | [] -> (List.rev batch, [])
    | x :: rest ->
        if
          n >= batch_size
          || (n > 0
              && Time.diff_monotonic_ms start (Time.monotonic_now ())
                 >= float_of_int time_budget_ms)
        then (List.rev batch, x :: rest)
        else loop (x :: batch) rest (n + 1)
  in
  loop [] items 0

(* ---- vector embedding helpers ---- *)

let validate_embedding_count blocks embeddings =
  if List.length blocks <> List.length embeddings then
    raise
      (Dispatcher.Exn_info
         ( "embedding result count mismatch",
           [ (Wire.Keyword "block-count", Wire.Int (List.length blocks))
           ; (Wire.Keyword "embedding-count", Wire.Int (List.length embeddings))
           ; ( Wire.Keyword "model-id",
               (match Embedding.model_id () with
                | Some m -> Wire.String m
                | None -> Wire.Nil) ) ] ))

let embeddable_index_block (b : Search_index.index_item) : bool =
  not (is_blank (Unicode.trim b.item_title))

(* vector-embedding-title — truncates at UTF-16 length > 2048. *)
let vector_embedding_title (b : Search_index.index_item) : string =
  let title =
    match b.item_vector_title with
    | Some t -> t
    | None -> b.item_title
  in
  Search_index.utf16_truncate ~max_units:vector_embedding_max_title_length title

let vector_embedding_batches (blocks : Search_index.index_item list) :
    Search_index.index_item list list =
  let rec loop remaining batch batch_chars result =
    match remaining with
    | [] -> (match batch with [] -> result | _ -> result @ [ List.rev batch ])
    | b :: rest ->
        let text = vector_embedding_title b in
        let text_chars = Array.length (Search_fuzzy.utf16_units text) in
        let full =
          List.length batch >= vector_embedding_batch_size
          || (batch <> []
              && batch_chars + text_chars > vector_embedding_max_batch_chars)
        in
        if full then loop rest [ b ] text_chars (result @ [ List.rev batch ])
        else loop rest (b :: batch) (batch_chars + text_chars) result
  in
  loop blocks [] 0 []

let rec lt_embed_index_batch_with_fallback (batch : Search_index.index_item list)
    : Search_index.index_item list E.t =
  E.catch
    (E.bind (Embedding.embed_texts (List.map vector_embedding_title batch))
       (fun embeddings ->
          validate_embedding_count batch embeddings;
          E.pure
            (List.map2
               (fun b emb -> { b with Search_index.item_embedding = Some emb })
               batch embeddings)))
    (fun exn ->
       match batch with
       | [ _ ] -> E.error exn
       | _ ->
           let split_index = List.length batch / 2 in
           let left = List.filteri (fun i _ -> i < split_index) batch in
           let right = List.filteri (fun i _ -> i >= split_index) batch in
           E.bind (lt_embed_index_batch_with_fallback left) (fun left_embedded ->
               E.bind (lt_embed_index_batch_with_fallback right)
                 (fun right_embedded -> E.pure (left_embedded @ right_embedded))))

(* <embed-index-batches — vector-embedding-parallelism workers draining a
   shared queue, results re-assembled in batch order. *)
let lt_embed_index_batches (batches : Search_index.index_item list list)
    : Search_index.index_item list E.t =
  match batches with
  | [] -> E.pure []
  | _ ->
      let queue = ref (List.mapi (fun i b -> (i, b)) batches) in
      let results : (int, Search_index.index_item list) Hashtbl.t =
        Hashtbl.create (List.length batches)
      in
      let pop_batch () =
        match !queue with
        | [] -> None
        | x :: rest -> queue := rest; Some x
      in
      let rec worker () : unit E.t =
        match pop_batch () with
        | None -> E.pure ()
        | Some (idx, batch) ->
            E.bind (lt_embed_index_batch_with_fallback batch)
              (fun embedded ->
                 Hashtbl.replace results idx embedded;
                 worker ())
      in
      let worker_count =
        min vector_embedding_parallelism (List.length batches)
      in
      E.bind
        (E.map (fun _ -> ())
           (E.all (List.init worker_count (fun _ -> worker ()))))
        (fun () ->
           E.pure
             (List.concat_map
                (fun idx ->
                   Option.value (Hashtbl.find_opt results idx) ~default:[])
                (List.init (List.length batches) Fun.id)))

(* <embed-index-blocks *)
let lt_embed_index_blocks repo (blocks : Search_index.index_item list) :
    Search_index.index_item list E.t =
  let blocks = List.filter embeddable_index_block blocks in
  if blocks <> [] && Option.is_some (Worker_state.vector_index repo) then
    lt_embed_index_batches (vector_embedding_batches blocks)
  else E.pure []

(* schedule-vector-index-upsert! *)
let schedule_vector_index_upsert repo (blocks : Search_index.index_item list)
    : unit =
  if blocks <> [] && Option.is_some (Worker_state.vector_index repo) then
    E.async (fun () ->
        E.catch
          (E.bind (lt_embed_index_blocks repo blocks)
             (fun vector_blocks ->
                (match vector_blocks, Worker_state.vector_index repo with
                 | _ :: _, Some vi ->
                     Search_index.upsert_vector_blocks vi vector_blocks
                 | _ -> ());
                E.pure ()))
          (fun exn ->
             Worker_log.error "search/vector-index-upsert-failed"
               [ ("repo", repo); ("error", Printexc.to_string exn) ];
             E.pure ()))

(* schedule-vector-index-rebuild! *)
let schedule_vector_index_rebuild repo build_id
    (indexed_blocks : Search_index.index_item list) : unit =
  match Worker_state.vector_index repo with
  | None -> ()
  | Some _ ->
      start_vector_index_rebuild repo build_id;
      E.async (fun () ->
          E.finally
            (E.catch
               (E.bind
                  (if indexed_blocks = [] then E.pure []
                   else
                     lt_embed_index_batches
                       (vector_embedding_batches indexed_blocks))
                  (fun vector_blocks ->
                     if active_vector_index_rebuild repo build_id then
                       match Worker_state.vector_index repo with
                       | Some vi ->
                           Search_index.upsert_vector_blocks vi vector_blocks;
                           E.pure ()
                       | None -> E.pure ()
                     else E.pure ()))
               (fun exn ->
                  if active_vector_index_rebuild repo build_id then
                    Worker_log.error "search/vector-index-rebuild-failed"
                      [ ("repo", repo); ("error", Printexc.to_string exn) ];
                  E.pure ()))
            (fun () ->
               if active_vector_index_rebuild repo build_id then
                 E.map (fun _ -> ()) (persist_vector_index_metadata repo)
               else E.pure ())
          |> E.map (fun _ -> clear_vector_index_rebuild repo build_id))

(* ---- <build-blocks-index! ---- *)

let lt_build_blocks_index repo search_db (conn : conn) build_id : unit E.t =
  ensure_active_search_index_build repo build_id;
  let db = Datascript.db conn in
  let blocks = Search_index.get_all_blocks db in
  let total = List.length blocks in
  let vector_index = Worker_state.vector_index repo in
  let include_vector_title = Option.is_some vector_index in
  let progress_for_fts processed =
    if total = 0 then 100
    else min 100 (int_of_float (100. *. float_of_int processed /. float_of_int total))
  in
  let report_progress progress processed total =
    report_search_index_progress repo
      (progress_payload ~build_id ~status:"running" ~stage:"search-index"
         ~progress ~processed ~total)
  in
  let rec loop remaining processed last_progress indexed_blocks : unit E.t =
    ensure_active_search_index_build repo build_id;
    match remaining with
    | [] -> begin
        ensure_active_search_index_build repo build_id;
        schedule_vector_index_rebuild repo build_id indexed_blocks;
        Sqlite.exec search_db
          ~sql:(Printf.sprintf "PRAGMA user_version = %d" search_db_version)
          ~bind:[||];
        E.map
          (fun _ -> ())
          (report_search_index_progress repo
             (progress_payload ~build_id ~status:"completed"
                ~stage:"search-index" ~progress:100 ~processed:total ~total))
      end
    | _ ->
        let batch, remaining' =
          take_search_index_batch remaining search_index_build_batch_size
            search_index_build_time_budget_ms
        in
        let processed' = processed + List.length batch in
        let indexed =
          List.filter_map
            (Search_index.block_to_index ~include_vector_title)
            (List.map Ev.of_entity batch)
        in
        let indexed_blocks' = indexed_blocks @ indexed in
        let progress = progress_for_fts processed' in
        let should_report = progress > last_progress in
        E.bind
          (if indexed <> [] then begin
             Search_index.upsert_blocks search_db indexed;
             E.pure ()
           end
           else E.pure ())
          (fun () ->
             E.bind
               (if should_report then report_progress progress processed' total
                else E.pure ())
               (fun () ->
                  E.bind (E.sleep 0.) (fun () ->
                      loop remaining' processed'
                        (if should_report then progress else last_progress)
                        indexed_blocks')))
  in
  E.bind
    (report_search_index_progress repo
       (progress_payload ~build_id ~status:"running" ~stage:"search-index"
          ~progress:0 ~processed:0 ~total))
    (fun () ->
       E.bind (wait_for_search_index_idle repo build_id) (fun () ->
           ensure_active_search_index_build repo build_id;
           Search_index.truncate_table search_db;
           Search_index.truncate_vector_index vector_index;
           loop blocks 0 0 []))

(* ---- option decoding (cljs :keys map) ---- *)

let decode_search_opts (t : Wire.t) : Search_index.search_opts =
  let bool k = match Wire.get k t with Some (Wire.Bool b) -> b | _ -> false in
  let int_opt k = match Wire.get k t with Some (Wire.Int n) -> Some n | _ -> None in
  let str_opt k = match Wire.get k t with Some (Wire.String s) -> Some s | _ -> None in
  let embedding_opt =
    match Wire.get "query-embedding" t with
    | Some (Wire.Array xs) ->
        Some (Array.of_list (List.filter_map Wire.as_float xs))
    | Some (Wire.List xs) ->
        Some (Array.of_list (List.filter_map Wire.as_float xs))
    | _ -> None
  in
  { Search_index.opt_limit =
      Option.value (int_opt "limit") ~default:100
  ; opt_search_limit = int_opt "search-limit"
  ; opt_page = str_opt "page"
  ; opt_enable_snippet = (
      match Wire.get "enable-snippet?" t with
      | Some (Wire.Bool b) -> b
      | _ -> true)
  ; opt_dev = bool "dev?"
  ; opt_code_only = bool "code-only?"
  ; opt_page_only = bool "page-only?"
  ; opt_built_in = bool "built-in?"
  ; opt_library_page_search = bool "library-page-search?"
  ; opt_include_breadcrumb = bool "include-breadcrumb?"
  ; opt_include_matched_count = bool "include-matched-count?"
  ; opt_enable_semantic_search = bool "feature/enable-semantic-search?"
  ; opt_query_embedding = embedding_opt
  }

let block_result_to_wire (br : Search_index.block_result) : Wire.t =
  Wire.Map
    (List.map (fun (k, v) -> (Wire.Keyword k, Ds_wire.transit_of_value v)) br)

let outcome_to_wire (outcome : Search_index.search_outcome) : Wire.t =
  match outcome with
  | Search_index.Rows rows ->
      Wire.Array (List.map block_result_to_wire rows)
  | Search_index.Rows_with_count (rows, n) ->
      Wire.kw_map
        [ ("items", Wire.Array (List.map block_result_to_wire rows))
        ; ("matched-count", Wire.Int n) ]

(* cljs search-blocks — looks up conns and delegates. cljs derefs @conn
   inside search/search-blocks, so a missing conn is a hard failure. *)
let call_search_blocks repo q opts : Wire.t =
  let search_db = get_search_db repo in
  let vector_index = Worker_state.vector_index repo in
  match Worker_state.datascript_conn repo with
  | Some conn ->
      outcome_to_wire
        (Search_index.search_blocks ~conn ~search_db ~vector_index ~q0:q ~opts)
  | None ->
      raise
        (Dispatcher.Exn_info
           ( "Missing worker graph connection",
             [ (Wire.Keyword "type", Wire.Keyword "db/missing-connection")
             ; (Wire.Keyword "repo", Wire.String repo) ] ))

(* <search-blocks — embeds the query when semantic search is on and no
   pre-computed :query-embedding was passed, with a 50ms timeout and
   warn+fallback on failure. *)
let rec lt_search_blocks repo q (opts : Search_index.search_opts) : Wire.t E.t =
  match
    ( Worker_state.vector_index repo
    , opts.opt_enable_semantic_search
    , opts.opt_page_only
    , opts.opt_query_embedding )
  with
  | Some _, true, false, None when not (is_blank q) ->
      E.catch
        (E.bind
           (E.timeout (Embedding.embed_texts [ q ]) query_embedding_timeout_ms)
           (fun embeddings ->
              validate_embedding_count [ q ] embeddings;
              match embeddings with
              | emb :: _ ->
                  lt_search_blocks repo q
                    { opts with Search_index.opt_query_embedding = Some emb }
              | [] -> E.pure (call_search_blocks repo q opts)))
        (fun exn ->
           Worker_log.warn "search/query-embedding-failed"
             [ ("repo", repo); ("error", Printexc.to_string exn) ];
           E.pure (call_search_blocks repo q opts))
  | _ -> E.pure (call_search_blocks repo q opts)

(* ---- index-item <-> wire ---- *)

let index_item_of_wire (t : Wire.t) : Search_index.index_item =
  let str k = match Wire.get k t with Some (Wire.String s) -> Some s | _ -> None in
  let embedding =
    match Wire.get "embedding" t with
    | Some (Wire.Array xs) | Some (Wire.List xs) ->
        Some (Array.of_list (List.filter_map Wire.as_float xs))
    | _ -> None
  in
  Search_index.mk_index_item ~id:(Option.value (str "id") ~default:"")
    ~page:(Option.value (str "page") ~default:"")
    ~title:(Option.value (str "title") ~default:"")
    ?vector_title:(str "vector-title")
    ?embedding ()

let wire_of_index_item (it : Search_index.index_item) : Wire.t =
  Wire.kw_map
    ([ ("id", Wire.String it.item_id)
     ; ("page", Wire.String it.item_page)
     ; ("title", Wire.String it.item_title) ]
     @ (match it.item_vector_title with
        | Some t -> [ ("vector-title", Wire.String t) ]
        | None -> [])
     @ (match it.item_embedding with
        | Some emb ->
            [ ("embedding",
               Wire.Array (List.map (fun f -> Wire.Float f) (Array.to_list emb))) ]
        | None -> []))

(* ---- handlers ---- *)

let normalize_repo_args args =
  match args with
  | Wire.Nil :: rest -> Wire.String "" :: rest
  | _ -> args

let search_blocks_handler args : Wire.t E.t =
  let args = normalize_repo_args args in
  match args with
  | Wire.String repo :: Wire.String q :: option_rest ->
      let opts = match option_rest with t :: _ -> decode_search_opts t | [] -> Search_index.default_opts in
      lt_search_blocks repo q opts
  | _ -> invalid_arg "search-blocks expects (repo q option)"

let search_upsert_blocks args : Wire.t E.t =
  let args = normalize_repo_args args in
  match args with
  | Wire.String repo :: blocks_w :: _ -> (
      match get_search_db repo with
      | None -> E.pure Wire.nil
      | Some db ->
          let items = List.map index_item_of_wire (Wire.as_seq blocks_w) in
          Search_index.upsert_blocks db items;
          schedule_vector_index_upsert repo items;
          E.pure Wire.nil)
  | _ -> invalid_arg "search-upsert-blocks expects (repo blocks)"

let search_delete_blocks args : Wire.t E.t =
  let args = normalize_repo_args args in
  match args with
  | Wire.String repo :: ids_w :: _ -> (
      match get_search_db repo with
      | None -> E.pure Wire.nil
      | Some db ->
          let ids = List.filter_map Wire.as_string (Wire.as_seq ids_w) in
          Search_index.delete_vector_blocks (Worker_state.vector_index repo) ids;
          Search_index.delete_blocks db ids;
          E.pure Wire.nil)
  | _ -> invalid_arg "search-delete-blocks expects (repo ids)"

let search_truncate_tables args : Wire.t E.t =
  let args = normalize_repo_args args in
  match args with
  | Wire.String repo :: _ -> (
      match get_search_db repo with
      | None -> E.pure Wire.nil
      | Some db ->
          Search_index.truncate_vector_index (Worker_state.vector_index repo);
          Search_index.truncate_table db;
          E.pure Wire.nil)
  | _ -> invalid_arg "search-truncate-tables expects (repo)"

let search_build_blocks_indice args : Wire.t E.t =
  let args = normalize_repo_args args in
  match args with
  | Wire.String repo :: _ -> (
      match Worker_state.datascript_conn repo with
      | None -> E.pure Wire.nil
      | Some conn ->
          let include_vector_title =
            Option.is_some (Worker_state.vector_index repo)
          in
          E.pure
            (Wire.Array
               (List.map wire_of_index_item
                  (Search_index.build_blocks_indice ~include_vector_title
                     (Datascript.db conn)))))
  | _ -> invalid_arg "search-build-blocks-indice expects (repo)"

let search_build_blocks_indice_in_worker args : Wire.t E.t =
  let args = normalize_repo_args args in
  match args with
  | Wire.String repo :: rest -> (
      let force =
        match rest with
        | t :: _ -> (match Wire.as_bool t with Some b -> b | None -> false)
        | [] -> false
      in
      match get_search_db repo with
      | None -> E.pure Wire.nil
      | Some search_db -> (
          let version = search_index_version search_db in
          if version = search_db_version && not force then
            E.pure (Wire.Int version)
          else
            match Worker_state.datascript_conn repo with
            | None -> E.pure Wire.nil
            | Some conn ->
                let build_id = start_search_index_build repo in
                let run () =
                  E.bind (E.sleep 0.) (fun () ->
                      E.finally
                        (E.catch
                           (lt_build_blocks_index repo search_db conn build_id)
                           (fun exn ->
                              (match exn with
                               | Stale_index_build _ -> ()
                               | _ ->
                                   Worker_log.error "search/index-build-failed"
                                     [ ("repo", repo)
                                     ; ("error", Printexc.to_string exn) ]);
                              E.pure ()))
                        (fun () ->
                           if Worker_state.search_index_build_id repo
                              = Some build_id
                           then
                             E.map
                               (fun _ -> clear_search_index_build repo build_id)
                               (report_search_index_progress repo
                                  (Wire.kw_map
                                     [ ("build-id", Wire.String build_id)
                                     ; ("status", Wire.Keyword "idle") ]))
                           else begin
                             clear_search_index_build repo build_id;
                             E.pure ()
                           end))
                in
                E.map
                  (fun _ -> Wire.Keyword "started")
                  (E.bind
                     (report_search_index_progress repo
                        (progress_payload ~build_id ~status:"running"
                           ~stage:"search-index" ~progress:0 ~processed:0
                           ~total:0))
                     run)))
  | _ -> invalid_arg "search-build-blocks-indice-in-worker expects (repo)"

let search_build_pages_indice _args : Wire.t E.t = E.pure Wire.nil

(* <invalidate-search-db! — cljs db-core: truncates via the open :search
   conn; when absent (and not publishing) opens the search db file directly,
   truncates and closes. *)
let invalidate_search_db args : Wire.t E.t =
  let args = normalize_repo_args args in
  match args with
  | Wire.String repo :: _ -> (
      match Worker_state.sqlite_conn_of repo Worker_state.Search with
      | Some db ->
          Search_index.truncate_table db;
          Search_index.truncate_vector_index (Worker_state.vector_index repo);
          E.pure Wire.nil
      | None ->
          if Worker_state.publishing () then E.pure Wire.nil
          else
            (* cljs <invalidate-search-db!: even without a cached conn it
               opens the pool's search db and truncates it. *)
            E.bind
              (Sqlite.prepare_pool ~name:(Graph_dir.pool_name repo))
              (fun () ->
                let db = open_search_db repo in
                (try Search_index.truncate_table db
                 with exn ->
                   Worker_log.error "search/invalidate-search-db-failed"
                     [ ("repo", repo); ("error", Printexc.to_string exn) ]);
                Sqlite.close db;
                E.pure Wire.nil))
  | _ -> invalid_arg "db-sync-invalidate-search-db expects (repo)"

(* ---- db-listener :search method ----

   cljs db-listener :search (handler/search.cljs): on each committed tx,
   sync-search-indice then call the delete/upsert thread-api fns. Skipped
   for tx-meta :from-disk? and the importer flags. *)

let search_listener repo (r : tx_report) : unit =
  (* cljs wraps the whole handler in p/do! — async so it does not block the
     commit's broadcast to the main thread. *)
  Db_worker_effect.async (fun () ->
      try
        let meta k =
          match List.assoc_opt k r.tx_meta with
          | Some (Bool b) -> b
          | _ -> false
        in
        if meta "from-disk?"
           || meta "logseq.graph-parser.exporter/imported-data?"
           || meta "logseq.db.sqlite.export/imported-data?"
        then Db_worker_effect.pure ()
        else
          let include_vector_title =
            Option.is_some (Worker_state.vector_index repo)
          in
          match Search_index.sync_search_indice ~include_vector_title r with
          | None -> Db_worker_effect.pure ()
          | Some { Search_index.blocks_to_remove; blocks_to_add } ->
              Db_worker_effect.catch
                (Db_worker_effect.bind
                   (search_delete_blocks
                      [ Wire.String repo
                      ; Wire.Array
                          (List.map (fun s -> Wire.String s) blocks_to_remove) ])
                   (fun _ ->
                     Db_worker_effect.map
                       (fun _ -> ())
                       (search_upsert_blocks
                          [ Wire.String repo
                          ; Wire.Array
                              (List.map wire_of_index_item blocks_to_add) ])))
                (fun e ->
                  Worker_log.error "search/sync-search-indice-failed"
                    [ ("repo", repo); ("error", Printexc.to_string e) ];
                  Db_worker_effect.pure ())
      with e ->
        Worker_log.error "search/search-listener-failed"
          [ ("repo", repo); ("error", Printexc.to_string e) ];
        Db_worker_effect.pure ())

(* ---- init wiring ---- *)

let () =
  Dispatcher.register "thread-api/search-blocks" search_blocks_handler;
  Dispatcher.register "thread-api/search-upsert-blocks" search_upsert_blocks;
  Dispatcher.register "thread-api/search-delete-blocks" search_delete_blocks;
  Dispatcher.register "thread-api/search-truncate-tables" search_truncate_tables;
  Dispatcher.register "thread-api/search-build-blocks-indice"
    search_build_blocks_indice;
  Dispatcher.register "thread-api/search-build-blocks-indice-in-worker"
    search_build_blocks_indice_in_worker;
  Dispatcher.register "thread-api/search-build-pages-indice"
    search_build_pages_indice;
  Dispatcher.register "thread-api/db-sync-invalidate-search-db"
    invalidate_search_db;
  Db_listener.register "search" search_listener;
  Sync_deps.search_truncate_table := Some Search_index.truncate_table;
  (* render-resource consumes search-handler/search-blocks results as
     :db/id maps; the hook returns entities so call sites stay
     representation-free *)
  Render_deps.search_blocks_fn :=
    Some
      (fun ~repo ~db q limit ->
         match Worker_state.datascript_conn repo with
         | Some conn ->
             let search_db = get_search_db repo in
             let vector_index = Worker_state.vector_index repo in
             let opts =
               { Search_index.default_opts with
                 Search_index.opt_limit = limit }
             in
             let rows =
               match
                 Search_index.search_blocks ~conn ~search_db ~vector_index
                   ~q0:q ~opts
               with
               | Search_index.Rows rows -> rows
               | Search_index.Rows_with_count (rows, _) -> rows
             in
             List.filter_map
               (fun (br : Search_index.block_result) ->
                  match List.assoc_opt "db/id" br with
                  | Some (Datascript.Int id) -> Ldb.ent_of_id db id
                  | _ -> None)
               rows
         | None -> [])
