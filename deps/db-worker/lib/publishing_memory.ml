(* Read-only publishing data access. The existing rendering/query API runs
   against an in-memory DataScript connection in the page's own thread. *)

let open_db repo transit =
  let db = Datascript.from_serializable
      (Ds_wire.serializable_db_of_transit (Transit_codec.of_string transit)) in
  Worker_state.set_publishing true;
  Worker_state.set_datascript_conn repo (Datascript.conn_from_db db)

let code_class_for db (opts : Search_index.search_opts) =
  if opts.opt_code_only then Datascript.entity db (Datascript.Ident "logseq.class/Code-block")
  else None

let matches conn query (opts : Search_index.search_opts) =
  let db = Datascript.db conn in
  let code_class = code_class_for db opts in
  let in_page id = match opts.opt_page with
    | None -> true
    | Some uuid -> List.exists (fun page ->
        match Datascript.find_datom db Datascript.Eavt ~e:page ~a:"block/uuid" () with
        | Some d -> d.v = Datascript.Uuid uuid | None -> false)
        (Search_index.ref_ids_datom db id "block/page") in
  if String.trim query = "" then [] else
  Datascript.datoms db Datascript.Avet ~a:"block/title" ()
  |> Seq.filter_map (fun (d : Datascript.datom) ->
      match d.v with
      | Datascript.String title ->
          let score = Search_fuzzy.score query title in
          if score <= 0. || not (in_page d.e)
             || Search_index.hidden_entity_datom db d.e then None else
          (match Ldb.ent_of_id db d.e with
           | Some entity when Search_index.include_search_block ~conn
               (Entity_view.of_entity entity) ~code_class
               ~library_page_search:opts.opt_library_page_search
               ~page_only:opts.opt_page_only ~dev:opts.opt_dev
               ~built_in:opts.opt_built_in ~code_only:opts.opt_code_only -> Some (score, entity)
           | _ -> None)
      | _ -> None)
  |> List.of_seq
  |> List.sort (fun (a, e1) (b, e2) ->
      let c = Float.compare b a in if c = 0 then Int.compare e1.Datascript.id e2.Datascript.id else c)

let rec take n = function
  | _ when n <= 0 -> []
  | [] -> []
  | (_, entity) :: rest -> entity :: take (n - 1) rest

let search_blocks args =
  let repo = Endpoint_db.require_repo args in
  let conn = Endpoint_db.require_conn repo in
  let db = Datascript.db conn in
  let query = match List.nth_opt args 1 with
    | Some (Wire.String q) -> q | _ -> invalid_arg "search query missing" in
  let opts = match List.nth_opt args 2 with
    | Some w -> Endpoint_search.decode_search_opts w | None -> Search_index.default_opts in
  let found = matches conn query opts in
  let code_class = code_class_for db opts in
  let items = take opts.opt_limit found
    |> List.filter_map (fun entity ->
        let result = Search_index.result_of_row
            ~id:(Option.get (Ldb.uuid_value entity "block/uuid"))
            ~block:(Entity_view.of_entity entity) () in
        Search_index.search_result_to_block_result ~conn ~q:query
          ~code_class ~opts result) in
  let outcome = if opts.opt_include_matched_count then
      Search_index.Rows_with_count (items, List.length found)
    else Search_index.Rows items in
  Db_worker_effect.pure (Endpoint_search.outcome_to_wire outcome)

let () =
  ignore Endpoint_db.q;
  ignore Endpoint_read.get_page_blocks_tree;
  ignore Endpoint_block.get_blocks;
  ignore Endpoint_property.get_display_properties_endpoint;
  ignore Endpoint_view.get_view_data;
  ignore Endpoint_query.query_dsl_query;
  ignore Render_resource.get_render_snapshots;
  ignore Edn_eval.apply_edn;
  Dispatcher.register "thread-api/search-blocks" search_blocks;
  Render_deps.search_blocks_fn := Some (fun ~repo:_ ~db query limit ->
    take limit (matches (Datascript.conn_from_db db) query Search_index.default_opts))

let readable name =
  List.mem name
    [ "thread-api/search-blocks"; "thread-api/q"; "thread-api/datoms"; "thread-api/pull"
    ; "thread-api/pull-many"; "thread-api/entity"; "thread-api/db"
    ; "thread-api/query-dsl-query"; "thread-api/query-dsl-custom-query"
    ; "thread-api/query-custom"; "thread-api/resolve-query-inputs"
    ; "thread-api/task-spent-time"; "thread-api/favorited-page?" ]
  || (String.length name >= 15 && String.sub name 0 15 = "thread-api/get-")

let invoke_transit name args on_ok on_error =
  if not (readable name) then on_error (Failure ("Publishing is read-only: " ^ name))
  else
    try
      Db_worker_effect.on_any (Dispatcher.invoke_transit name args) on_ok on_error
    with exn -> on_error exn
