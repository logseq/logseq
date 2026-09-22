(* frontend.worker.handler.cli — cli-list-* / api-list-*/
   api-get-page-data endpoints.

   Sources:
   - src/main/logseq/cli/common/db_worker.cljs
   - src/main/logseq/api/db_based/tools.cljs *)

open Datascript

let kw s = Wire.Keyword s

let arg args i = List.nth_opt args i

let with_conn args f =
  let repo =
    match arg args 0 with
    | Some (Wire.String s) -> s
    | _ -> invalid_arg "first arg must be repo name"
  in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.nil
  | Some conn -> f (Datascript.db conn)

let opt_bool t k ~default =
  match Wire.get k t with
  | Some (Wire.Bool b) -> b
  | Some (Wire.Keyword "false") -> false
  | Some Wire.Nil | None -> default
  | _ -> default

let opt_str t k = Option.bind (Wire.get k t) Wire.as_string

let str_contains hay needle =
  let hl = String.length hay and nl = String.length needle in
  if nl = 0 then true
  else begin
    let rec go i =
      if i + nl > hl then false
      else if String.sub hay i nl = needle then true
      else go (i + 1)
    in
    go 0
  end

(* --- cli/common/db_worker.cljs --- *)

let ident_wire s = Wire.Keyword s

let minimal_list_item (e : entity) : (Wire.t * Wire.t) list =
  let m =
    [ (kw "db/id", Wire.Int e.id)
    ; ( kw "block/title",
        Ds_wire.transit_of_value
          (Option.value (Ldb.value e "block/title") ~default:Nil) )
    ; ( kw "block/created-at",
        Ds_wire.transit_of_value
          (Option.value (Ldb.value e "block/created-at") ~default:Nil) )
    ; ( kw "block/updated-at",
        Ds_wire.transit_of_value
          (Option.value (Ldb.value e "block/updated-at") ~default:Nil) )
    ]
  in
  let m =
    match Ldb.ident_of e with
    | Some ident -> (kw "db/ident", ident_wire ident) :: m
    | None -> m
  in
  match Ldb.value e "logseq.property/type" with
  | Some (Keyword t) -> (kw "logseq.property/type", ident_wire t) :: m
  | _ -> m

let uuid_str e =
  match Ldb.value e "block/uuid" with
  | Some (Uuid u) -> Some u
  | _ -> None

let property_entities db : entity list =
  match entity db (Ident "logseq.class/Property") with
  | Some tag ->
      List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref tag.id) ())
      |> List.filter_map (fun (d : datom) -> entity db (Entity_id d.e))
  | None -> []

let class_entities db : entity list =
  match entity db (Ident "logseq.class/Tag") with
  | Some tag ->
      List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref tag.id) ())
      |> List.filter_map (fun (d : datom) -> entity db (Entity_id d.e))
  | None -> []

let map_drop_keys drop (pairs : (Wire.t * Wire.t) list) =
  List.filter (fun (k, _) -> not (List.mem k (List.map kw drop))) pairs

let set_uuid_string (pairs : (Wire.t * Wire.t) list) =
  List.map
    (fun (k, v) ->
      match k, v with
      | Wire.Keyword "block/uuid", Wire.Uuid u -> (k, Wire.String u)
      | _ -> (k, v))
    pairs

let entity_expand_pairs (e : entity) ~dissoc_attrs
    ~(ref_idents : string list) ~(contents : string list) :
    (Wire.t * Wire.t) list =
  let pairs =
    match Ds_wire.entity_map_wire e with
    | Wire.Map pairs -> map_drop_keys dissoc_attrs pairs
    | _ -> []
  in
  let pairs = set_uuid_string pairs in
  List.fold_left
    (fun acc attr ->
      if List.exists (fun (k, _) -> k = kw attr) acc then
        let idents =
          Ldb.ref_ents e attr
          |> List.filter_map Ldb.ident_of
          |> List.map ident_wire
        in
        List.map
          (fun (k, v) -> if k = kw attr then (k, Wire.List idents) else (k, v))
          acc
      else acc)
    pairs ref_idents
  |> fun pairs ->
  List.fold_left
    (fun acc attr ->
      if List.exists (fun (k, _) -> k = kw attr) acc then
        match Ldb.ref_ent e attr with
        | Some v ->
            List.map
              (fun (k, v') ->
                if k = kw attr then
                  (k,
                   match Ldb.property_value_content v with
                   | Some s -> Wire.String s
                   | None -> Wire.Nil)
                else (k, v'))
              acc
        | None -> acc
      else acc)
    pairs contents

let cli_list_properties db (opts : Wire.t option) : Wire.t =
  let expand =
    match opts with
    | Some t -> opt_bool t "expand" ~default:false
    | None -> false
  in
  let include_built_in =
    match opts with
    | Some t -> opt_bool t "include-built-in" ~default:true
    | None -> true
  in
  Wire.List
    (property_entities db
     |> List.filter (fun e -> include_built_in || not (Ldb.built_in e))
     |> List.map (fun e ->
            if expand then
              Wire.Map
                (entity_expand_pairs e
                   ~dissoc_attrs:
                     [ "block/tags"; "block/order"; "block/refs"
                     ; "block/name"; "db/index"
                     ; "logseq.property.embedding/hnsw-label-updated-at"
                     ; "logseq.property/default-value" ]
                   ~ref_idents:[ "logseq.property/classes" ]
                   ~contents:[ "logseq.property/description" ])
            else
              Wire.Map
                (( kw "db/cardinality",
                   (match Ldb.value e "db/cardinality" with
                    | Some (Keyword c) -> ident_wire c
                    | _ -> ident_wire "db.cardinality/one") )
                 :: minimal_list_item e)))

let cli_list_tags db (opts : Wire.t option) : Wire.t =
  let expand =
    match opts with
    | Some t -> opt_bool t "expand" ~default:false
    | None -> false
  in
  let include_built_in =
    match opts with
    | Some t -> opt_bool t "include-built-in" ~default:true
    | None -> true
  in
  Wire.List
    (class_entities db
     |> List.filter (fun e -> include_built_in || not (Ldb.built_in e))
     |> List.map (fun e ->
            if expand then
              let pairs =
                entity_expand_pairs e
                  ~dissoc_attrs:
                    [ "block/tags"; "block/order"; "block/refs"
                    ; "block/name"
                    ; "logseq.property.embedding/hnsw-label-updated-at" ]
                  ~ref_idents:
                    [ "logseq.property.class/extends"
                    ; "logseq.property.class/properties" ]
                  ~contents:[ "logseq.property/description" ]
              in
              (* :logseq.property.view/type → its db/ident *)
              let pairs =
                match Ldb.ref_ent e "logseq.property.view/type" with
                | Some vt ->
                    List.map
                      (fun (k, v) ->
                        if k = kw "logseq.property.view/type" then
                          (k,
                           match Ldb.ident_of vt with
                           | Some i -> ident_wire i
                           | None -> Wire.Nil)
                        else (k, v))
                      pairs
                | None -> pairs
              in
              Wire.Map pairs
            else Wire.Map (minimal_list_item e)))

let ref_ident_of_value db (v : value) : string option =
  match v with
  | Keyword k -> Some k
  | Ref id ->
      (match entity db (Entity_id id) with
       | Some e -> Ldb.ident_of e
       | None -> None)
  | _ -> None

let ref_to_ident (e : entity) (a : attr) : Wire.t option =
  match Ldb.ref_ent e a with
  | Some r ->
      (match Ldb.ident_of r with
       | Some i -> Some (ident_wire i)
       | None -> None)
  | None -> None

let minimal_task_item (e : entity) : (Wire.t * Wire.t) list =
  let m = minimal_list_item e in
  let m =
    match ref_to_ident e "logseq.property/status" with
    | Some v -> (kw "logseq.property/status", v) :: m
    | None -> (kw "logseq.property/status", Wire.Nil) :: m
  in
  let m =
    match ref_to_ident e "logseq.property/priority" with
    | Some v -> (kw "logseq.property/priority", v) :: m
    | None -> (kw "logseq.property/priority", Wire.Nil) :: m
  in
  let m =
    ( kw "logseq.property/scheduled",
      Ds_wire.transit_of_value
        (Option.value (Ldb.value e "logseq.property/scheduled")
           ~default:Nil) )
    :: m
  in
  ( kw "logseq.property/deadline",
    Ds_wire.transit_of_value
      (Option.value (Ldb.value e "logseq.property/deadline") ~default:Nil) )
  :: m

let cli_list_tasks db (opts : Wire.t option) : Wire.t =
  let status, priority, content =
    match opts with
    | Some t ->
        ( Option.bind (Wire.get "status" t) (function
              | Wire.Keyword k -> Some k
              | Wire.String s -> Some s
              | Wire.Map _ -> None
              | _ -> None)
        , Option.bind (Wire.get "priority" t) (function
              | Wire.Keyword k -> Some k
              | Wire.String s -> Some s
              | _ -> None)
        , opt_str t "content" )
    | None -> (None, None, None)
  in
  let task_entities =
    match entity db (Ident "logseq.class/Task") with
    | Some tag ->
        List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref tag.id) ())
        |> List.filter_map (fun (d : datom) -> entity db (Entity_id d.e))
    | None -> []
  in
  Wire.List
    (task_entities
     |> List.filter (fun e ->
            match status with
            | Some s -> ref_to_ident e "logseq.property/status"
                        = Some (ident_wire s)
            | None -> true)
     |> List.filter (fun e ->
            match priority with
            | Some p -> ref_to_ident e "logseq.property/priority"
                        = Some (ident_wire p)
            | None -> true)
     |> List.filter (fun e ->
            match content with
            | Some c ->
                let needle = Unicode.lowercase c in
                (match Ldb.string_value e "block/title" with
                 | Some t -> str_contains (Unicode.lowercase t) needle
                 | None -> false)
            | None -> true)
     |> List.map (fun e -> Wire.Map (minimal_task_item e)))

(* list-nodes helpers *)
let is_schema_definition (e : entity) : bool =
  let tag_idents =
    List.filter_map Ldb.ident_of (Ldb.ref_ents e "block/tags")
  in
  List.mem "logseq.class/Tag" tag_idents
  || List.mem "logseq.class/Property" tag_idents

let ordinary_node_entities db : entity list =
  let pages =
    List.of_seq (datoms db Avet ~a:"block/name" ())
    |> List.filter_map (fun (d : datom) -> entity db (Entity_id d.e))
  in
  let blocks =
    List.of_seq (datoms db Avet ~a:"block/page" ())
    |> List.filter_map (fun (d : datom) -> entity db (Entity_id d.e))
  in
  let tbl : (entity_id, entity) Hashtbl.t = Hashtbl.create 256 in
  List.iter
    (fun e -> if not (is_schema_definition e) then Hashtbl.replace tbl e.id e)
    (pages @ blocks);
  Hashtbl.fold (fun _ e acc -> e :: acc) tbl []

let has_all_tag_ids (e : entity) (tag_ids : entity_id list) : bool =
  match tag_ids with
  | [] -> true
  | _ ->
      let node_tags = Ldb.ref_ids e "block/tags" in
      List.for_all (fun t -> List.mem t node_tags) tag_ids

let has_all_properties (e : entity) (property_idents : string list) : bool =
  match property_idents with
  | [] -> true
  | _ ->
      List.for_all
        (fun ident -> Option.is_some (Ldb.value e ident))
        property_idents

let minimal_node_item (e : entity) : (Wire.t * Wire.t) list =
  let page = Ldb.ref_ent e "block/page" in
  let is_block = Option.is_some page in
  let m =
    minimal_list_item e
    |> fun m ->
    ( kw "node/type", Wire.String (if is_block then "block" else "page") )
    :: ( kw "block/uuid",
         match Ldb.value e "block/uuid" with
         | Some (Uuid u) -> Wire.Uuid u
         | _ -> Wire.Nil )
    :: m
  in
  let m =
    match Ldb.ident_of e with
    | Some i -> (kw "db/ident", ident_wire i) :: List.remove_assoc (kw "db/ident") m
    | None -> m
  in
  let m =
    match page with
    | Some p ->
        (kw "block/page-id", Wire.Int p.id)
        :: ( kw "block/page-title",
             Ds_wire.transit_of_value
               (Option.value (Ldb.value p "block/title") ~default:Nil) )
        :: m
    | None -> m
  in
  let m =
    match Ldb.value e "logseq.property.asset/type" with
    | Some v -> (kw "logseq.property.asset/type", Ds_wire.transit_of_value v) :: m
    | None -> m
  in
  match Ldb.value e "logseq.property.asset/size" with
  | Some v -> (kw "logseq.property.asset/size", Ds_wire.transit_of_value v) :: m
  | None -> m

let cli_list_nodes db (opts : Wire.t option) : Wire.t =
  let tag_ids, property_idents =
    match opts with
    | Some t ->
        ( (match Wire.get "tag-ids" t with
           | Some l ->
               List.filter_map
                 (fun w ->
                   match w with
                   | Wire.Int id -> Some id
                   | _ -> None)
                 (Wire.as_seq l)
           | None -> [])
        , match Wire.get "property-idents" t with
          | Some l ->
              List.filter_map
                (function Wire.Keyword k -> Some k | Wire.String s -> Some s | _ -> None)
                (Wire.as_seq l)
          | None -> [] )
    | None -> ([], [])
  in
  Wire.List
    (ordinary_node_entities db
     |> List.filter (fun e -> has_all_tag_ids e tag_ids)
     |> List.filter (fun e -> has_all_properties e property_idents)
     |> List.map (fun e -> Wire.Map (minimal_node_item e)))

let parse_time (t : Wire.t option) : float option =
  match t with
  | Some (Wire.Int n) -> Some (float_of_int n)
  | Some (Wire.Float f) -> Some f
  | Some (Wire.String s) ->
      (* cljs (js/Date.parse value) — ISO/US/month-name date strings *)
      Option.map Int64.to_float (Date_time_util.js_date_parse s)
  | _ -> None

let cli_list_pages db (opts : Wire.t option) : Wire.t =
  let expand, include_hidden, include_built_in, include_journal,
      journal_only, created_after, updated_after =
    match opts with
    | Some t ->
        ( opt_bool t "expand" ~default:false
        , opt_bool t "include-hidden" ~default:false
        , opt_bool t "include-built-in" ~default:true
        , opt_bool t "include-journal" ~default:true
        , opt_bool t "journal-only" ~default:false
        , parse_time (Wire.get "created-after" t)
        , parse_time (Wire.get "updated-after" t) )
    | None -> (false, false, true, true, false, None, None)
  in
  let pages =
    List.of_seq (datoms db Avet ~a:"block/name" ())
    |> List.filter_map (fun (d : datom) -> entity db (Entity_id d.e))
    |> List.filter (fun e -> include_hidden || not (Ldb.hidden e))
    |> List.filter (fun e -> include_built_in || not (Ldb.built_in e))
    |> List.filter (fun e ->
           let j = Ldb.is_journal e in
           if journal_only then j else not (not include_journal && j))
    |> List.filter (fun e ->
           match created_after with
           | Some ms ->
               (match Ldb.value e "block/created-at" with
                | Some (Int n) -> float_of_int n > ms
                | Some (Float f) -> f > ms
                | _ -> false)
           | None -> true)
    |> List.filter (fun e ->
           match updated_after with
           | Some ms ->
               (match Ldb.value e "block/updated-at" with
                | Some (Int n) -> float_of_int n > ms
                | Some (Float f) -> f > ms
                | _ -> false)
           | None -> true)
  in
  Wire.List
    (List.map
       (fun e ->
         if expand then
           Wire.Map
             ((kw "db/id", Wire.Int e.id)
              :: (match Ldb.ident_of e with
                  | Some i -> [ (kw "db/ident", ident_wire i) ]
                  | None -> [])
              @ [ ( kw "block/uuid",
                    match uuid_str e with
                    | Some u -> Wire.String u
                    | None -> Wire.Nil )
                ; ( kw "block/title",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/title") ~default:Nil) )
                ; ( kw "block/created-at",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/created-at")
                         ~default:Nil) )
                ; ( kw "block/updated-at",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/updated-at")
                         ~default:Nil) )
                ])
         else Wire.Map (minimal_list_item e))
       pages)

(* --- api/db-based/tools.cljs --- *)

let api_list_properties db (opts : Wire.t option) : Wire.t =
  let expand =
    match opts with
    | Some t -> opt_bool t "expand" ~default:false
    | None -> false
  in
  Wire.List
    (property_entities db
     |> List.map (fun e ->
            if expand then
              Wire.Map
                (entity_expand_pairs e
                   ~dissoc_attrs:
                     [ "block/tags"; "block/order"; "block/refs"
                     ; "block/name"; "db/index"
                     ; "logseq.property/default-value" ]
                   ~ref_idents:[ "logseq.property/classes" ]
                   ~contents:[ "logseq.property/description" ])
            else
              Wire.Map
                [ ( kw "block/title",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/title") ~default:Nil) )
                ; ( kw "block/uuid",
                    match uuid_str e with
                    | Some u -> Wire.String u
                    | None -> Wire.Nil )
                ]))

let api_list_tags db (opts : Wire.t option) : Wire.t =
  let expand =
    match opts with
    | Some t -> opt_bool t "expand" ~default:false
    | None -> false
  in
  Wire.List
    (class_entities db
     |> List.map (fun e ->
            if expand then
              let pairs =
                entity_expand_pairs e
                  ~dissoc_attrs:
                    [ "block/tags"; "block/order"; "block/refs"; "block/name" ]
                  ~ref_idents:
                    [ "logseq.property.class/extends"
                    ; "logseq.property.class/properties" ]
                  ~contents:[ "logseq.property/description" ]
              in
              let pairs =
                match Ldb.ref_ent e "logseq.property.view/type" with
                | Some vt ->
                    List.map
                      (fun (k, v) ->
                        if k = kw "logseq.property.view/type" then
                          (k,
                           match Ldb.ident_of vt with
                           | Some i -> ident_wire i
                           | None -> Wire.Nil)
                        else (k, v))
                      pairs
                | None -> pairs
              in
              Wire.Map pairs
            else
              Wire.Map
                [ ( kw "block/title",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/title") ~default:Nil) )
                ; ( kw "block/uuid",
                    match uuid_str e with
                    | Some u -> Wire.String u
                    | None -> Wire.Nil )
                ]))

let api_list_pages db (opts : Wire.t option) : Wire.t =
  let expand =
    match opts with
    | Some t -> opt_bool t "expand" ~default:false
    | None -> false
  in
  Wire.List
    (List.of_seq (datoms db Avet ~a:"block/name" ())
     |> List.filter_map (fun (d : datom) -> entity db (Entity_id d.e))
     |> List.filter (fun e -> not (Ldb.hidden e))
     |> List.map (fun e ->
            if expand then
              Wire.Map
                [ ( kw "block/uuid",
                    match uuid_str e with
                    | Some u -> Wire.String u
                    | None -> Wire.Nil )
                ; ( kw "block/title",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/title") ~default:Nil) )
                ; ( kw "block/created-at",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/created-at")
                         ~default:Nil) )
                ; ( kw "block/updated-at",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/updated-at")
                         ~default:Nil) )
                ]
            else
              Wire.Map
                [ ( kw "block/title",
                    Ds_wire.transit_of_value
                      (Option.value (Ldb.value e "block/title") ~default:Nil) )
                ; ( kw "block/uuid",
                    match uuid_str e with
                    | Some u -> Wire.String u
                    | None -> Wire.Nil )
                ]))

let remove_hidden_properties (pairs : (Wire.t * Wire.t) list) =
  List.filter
    (fun (k, _) ->
      match k with
      | Wire.Keyword "block/tx-id" -> false
      | Wire.Keyword a ->
          (match Schema.split_namespaced_attr a with
           | Some ns, _ -> ns <> "block.temp"
           | _ -> true)
      | _ -> true)
    pairs

let api_get_page_data db (title : string) : Wire.t =
  match Ldb.get_page db (String title) with
  | Some page ->
      let entity_pairs =
        (match Ds_wire.entity_map_wire page with
         | Wire.Map pairs -> pairs
         | _ -> [])
        |> remove_hidden_properties
        |> map_drop_keys [ "block/tags"; "block/refs" ]
        |> set_uuid_string
      in
      let blocks =
        Ldb.get_page_blocks db page.id
        |> List.map (fun (p : pulled_entity) ->
               match
                 Option.bind
                   (entity db (Entity_id p.pulled_id))
                   Db_content.recur_replace_uuid_in_block_title
               with
               | Some t ->
                   { p with
                     pulled_attrs =
                       (Keyword "block/title", Pulled_scalar (String t))
                       :: List.remove_assoc
                            (Keyword "block/title") p.pulled_attrs }
               | None -> p)
        |> fun bs -> Outliner_tree.page_blocks_vec_tree db bs page.id
      in
      let blocks' =
        List.map
          (fun w ->
            match w with
            | Wire.Map pairs ->
                Wire.Map
                  (pairs
                   |> remove_hidden_properties
                   |> map_drop_keys [ "block/children"; "block/page" ]
                   |> set_uuid_string)
            | _ -> w)
          blocks
      in
      Wire.Map
        [ (kw "entity", Wire.Map entity_pairs)
        ; (kw "blocks", Wire.List blocks')
        ]
  | None -> Wire.nil

let () =
  Dispatcher.register "thread-api/cli-list-properties" (fun args ->
      with_conn args (fun db -> Db_worker_effect.pure (cli_list_properties db (arg args 1))));
  Dispatcher.register "thread-api/cli-list-tags" (fun args ->
      with_conn args (fun db -> Db_worker_effect.pure (cli_list_tags db (arg args 1))));
  Dispatcher.register "thread-api/cli-list-pages" (fun args ->
      with_conn args (fun db -> Db_worker_effect.pure (cli_list_pages db (arg args 1))));
  Dispatcher.register "thread-api/cli-list-tasks" (fun args ->
      with_conn args (fun db -> Db_worker_effect.pure (cli_list_tasks db (arg args 1))));
  Dispatcher.register "thread-api/cli-list-nodes" (fun args ->
      with_conn args (fun db -> Db_worker_effect.pure (cli_list_nodes db (arg args 1))));
  Dispatcher.register "thread-api/api-get-page-data" (fun args ->
      with_conn args (fun db ->
          Db_worker_effect.pure
            (match Option.bind (arg args 1) Wire.as_string with
             | Some title -> api_get_page_data db title
             | None -> Wire.nil)));
  Dispatcher.register "thread-api/api-list-properties" (fun args ->
      with_conn args (fun db -> Db_worker_effect.pure (api_list_properties db (arg args 1))));
  Dispatcher.register "thread-api/api-list-tags" (fun args ->
      with_conn args (fun db -> Db_worker_effect.pure (api_list_tags db (arg args 1))));
  Dispatcher.register "thread-api/api-list-pages" (fun args ->
      with_conn args (fun db -> Db_worker_effect.pure (api_list_pages db (arg args 1))));
  Dispatcher.register "thread-api/build-graph" (fun args ->
      with_conn args (fun db ->
          Db_worker_effect.pure
            (Graph_view.build_graph db
               (match arg args 1 with Some o -> o | None -> Wire.Map []))));
  Dispatcher.register "thread-api/api-build-upsert-nodes-edn" (fun args ->
      with_conn args (fun db ->
          let ops =
            match arg args 1 with
            | Some (Wire.Array xs | Wire.List xs) -> xs
            | _ -> []
          in
          Db_worker_effect.pure (Api_tools.build_upsert_nodes_edn db ops)))
