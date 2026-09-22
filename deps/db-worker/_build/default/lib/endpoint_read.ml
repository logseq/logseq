(* Read-side endpoints (handler/page.cljs + handler/graph.cljs).
   Args are positional transit values; results are pure wire values —
   no async effects needed for these reads. *)

open Datascript

let kw s = Wire.Keyword s

let repo_arg args =
  match List.nth_opt args 0 with
  | Some (Wire.String repo) -> repo
  | _ -> invalid_arg "first arg must be repo name"

let arg args i = List.nth_opt args i

let with_conn args f =
  let repo = repo_arg args in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.nil
  | Some conn -> f (Datascript.db conn)

(* entity->plain-map = entity-forward-map + with-explicit-ref-fields-recursive *)
let plain_map_wire db (e : entity) : Wire.t =
  Plain_value.with_explicit_ref_fields_recursive
    (Plain_value.entity_forward_map db e)

(* handler/page.cljs page-entity->summary *)
let page_summary db (page : entity) : Wire.t =
  let field k v =
    match v with
    | Some v -> [ (kw k, Ds_wire.transit_of_value v) ]
    | None -> []
  in
  Wire.Map
    (field "db/id" (Some (Int page.id))
     @ field "block/uuid" (Ldb.value page "block/uuid")
     @ field "block/title" (Ldb.value page "block/title")
     @ field "block/raw-title" (Ldb.raw_title db page)
     @ field "block/name" (Ldb.value page "block/name")
     @ field "block/journal-day" (Ldb.value page "block/journal-day"))

(* :thread-api/get-journal-page-by-day [repo journal-day] *)
let get_journal_page_by_day args =
  with_conn args (fun db ->
      let day = Option.bind (arg args 1) Wire.as_int in
      Db_worker_effect.pure
        (match day with
         | Some day ->
             (match Ldb.get_journal_page_by_day db (Int day) with
              | Some e -> page_summary db e
              | None -> Wire.nil)
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-journal-page-by-day" get_journal_page_by_day

(* :thread-api/get-latest-journals [repo n] *)
let get_latest_journals args =
  with_conn args (fun db ->
      let n = Option.value (Option.bind (arg args 1) Wire.as_int) ~default:0 in
      let js = Ldb.get_latest_journals db in
      Db_worker_effect.pure
        (Wire.Array (List.map (page_summary db) (List.filteri (fun i _ -> i < n) js))))

let () = Dispatcher.register "thread-api/get-latest-journals" get_latest_journals

(* :thread-api/page-exists? [repo page-name tags] *)
let page_exists args =
  with_conn args (fun db ->
      let name = Option.bind (arg args 1) Wire.as_string in
      let tags =
        match arg args 2 with
        | Some t -> List.filter_map Wire.as_keyword (Wire.as_seq t)
        | None -> []
      in
      Db_worker_effect.pure
        (Wire.Bool
           (match name with
            | Some name -> Ldb.page_exists db name tags
            | None -> false)))

let () = Dispatcher.register "thread-api/page-exists?" page_exists

(* :thread-api/get-case-page [repo page-name-or-uuid] *)
let get_case_page args =
  with_conn args (fun db ->
      let ref_v = Option.map Ds_wire.value_of_transit (arg args 1) in
      Db_worker_effect.pure
        (match Option.bind ref_v (Ldb.get_case_page db) with
         | Some e -> Ds_wire.entity_map_wire e
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-case-page" get_case_page

(* :thread-api/get-tags-by-name [repo name] *)
let get_tags_by_name args =
  with_conn args (fun db ->
      let name = Option.bind (arg args 1) Wire.as_string in
      Db_worker_effect.pure
        (match name with
         | None -> Wire.Array []
         | Some name ->
             Ldb.pages_by_name db name
             |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
             |> List.filter Ldb.is_class
             |> fun es -> Wire.Array (List.map Ds_wire.entity_map_wire es)))

let () = Dispatcher.register "thread-api/get-tags-by-name" get_tags_by_name

(* :thread-api/get-block-parent [repo block-uuid] *)
let get_block_parent args =
  with_conn args (fun db ->
      let uuid = Option.bind (arg args 1) Wire.as_uuid in
      Db_worker_effect.pure
        (match uuid with
         | None -> Wire.nil
         | Some uuid ->
             (match
                entity db (Lookup_ref ("block/uuid", Uuid uuid))
              with
              | Some block ->
                  (match Ldb.ref_ent block "block/parent" with
                   | Some p -> Ds_wire.entity_map_wire p
                   | None -> Wire.nil)
              | None -> Wire.nil)))

let () = Dispatcher.register "thread-api/get-block-parent" get_block_parent

(* handler/page.cljs block-ref-entity *)
let block_ref_entity db (t : Wire.t) : entity option =
  match t with
  | Wire.Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
  | Wire.String s when Ldb.is_uuid_string s ->
      entity db (Lookup_ref ("block/uuid", Uuid s))
  | t ->
      (try entity db (Ds_wire.entity_ref_of_transit t)
       with Invalid_argument _ -> None)

(* :thread-api/get-block-page-info [repo block-ref] *)
let get_block_page_info args =
  with_conn args (fun db ->
      Db_worker_effect.pure
        (match Option.bind (arg args 1) (block_ref_entity db) with
         | Some block ->
             (match Ldb.ref_ent block "block/page" with
              | Some page ->
                  let f k v =
                    match v with
                    | Some v -> [ (kw k, Ds_wire.transit_of_value v) ]
                    | None -> []
                  in
                  Wire.Map
                    (f "db/id" (Some (Int page.id))
                     @ f "block/uuid" (Ldb.value page "block/uuid")
                     @ f "block/title" (Ldb.value page "block/title")
                     @ f "block/name" (Ldb.value page "block/name"))
              | None -> Wire.nil)
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-block-page-info" get_block_page_info

(* :thread-api/get-block-immediate-children [repo block-uuid] *)
let get_block_immediate_children args =
  with_conn args (fun db ->
      let uuid = Option.bind (arg args 1) Wire.as_uuid in
      Db_worker_effect.pure
        (match uuid with
         | Some uuid ->
             (match
                entity db (Lookup_ref ("block/uuid", Uuid uuid))
              with
              | Some parent ->
                  Wire.Array
                    (List.map Ds_wire.entity_map_wire (Ldb.get_children parent))
              | None -> Wire.Array [])
         | None -> Wire.Array []))

let () = Dispatcher.register "thread-api/get-block-immediate-children" get_block_immediate_children

(* :thread-api/get-block-sibling [repo block-id direction] *)
let get_block_sibling args =
  with_conn args (fun db ->
      let block =
        Option.bind (arg args 1) (fun t ->
            try entity db (Ds_wire.entity_ref_of_transit t)
            with Invalid_argument _ -> None)
      in
      let direction = Option.bind (arg args 2) Wire.as_keyword in
      Db_worker_effect.pure
        (match block, direction with
         | Some block, Some dir ->
             let sibling =
               match dir with
               | "left" -> Ldb.get_left_sibling block
               | "right" -> Ldb.get_right_sibling block
               | "last-child" ->
                   Option.bind
                     (Ldb.get_block_last_direct_child_id db block.id)
                     (Ldb.ent_of_id db)
               | _ -> None
             in
             (match sibling with
              | Some s -> plain_map_wire db s
              | None -> Wire.nil)
         | _ -> Wire.nil))

let () = Dispatcher.register "thread-api/get-block-sibling" get_block_sibling

(* :thread-api/get-route-title [repo route-name] *)
let get_route_title args =
  with_conn args (fun db ->
      let route = Option.bind (arg args 1) Wire.as_string in
      Db_worker_effect.pure
        (match route with
         | None -> Wire.nil
         | Some route ->
             (match Ldb.get_page db (String route) with
              | Some page when Ldb.is_page page ->
                  let t =
                    match Ldb.value page "block/title" with
                    | Some v -> Ds_wire.transit_of_value v
                    | None -> Wire.Nil
                  in
                  Wire.Map [ (kw "page-title", t) ]
              | _ ->
                  if Ldb.is_uuid_string route then
                    match
                      entity db (Lookup_ref ("block/uuid", Uuid route))
                    with
                    | Some block ->
                        let t =
                          match Ldb.value block "block/title" with
                          | Some v -> Ds_wire.transit_of_value v
                          | None -> Wire.Nil
                        in
                        Wire.Map [ (kw "block-title", t) ]
                    | None -> Wire.nil
                  else
                    Wire.nil)))

let () = Dispatcher.register "thread-api/get-route-title" get_route_title

(* :thread-api/get-file-content [repo path] *)
let get_file_content args =
  with_conn args (fun db ->
      let path = Option.bind (arg args 1) Wire.as_string in
      Db_worker_effect.pure
        (match path with
         | Some path ->
             (match
                entity db (Lookup_ref ("file/path", String path))
              with
              | Some e ->
                  (match Ldb.value e "file/content" with
                   | Some v -> Ds_wire.transit_of_value v
                   | None -> Wire.nil)
              | None -> Wire.nil)
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-file-content" get_file_content

(* :thread-api/get-key-value [repo key] *)
let get_key_value args =
  with_conn args (fun db ->
      let key = Option.bind (arg args 1) Wire.as_keyword in
      Db_worker_effect.pure
        (match Option.bind key (Ldb.get_key_value db) with
         | Some v -> Ds_wire.transit_of_value v
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-key-value" get_key_value

(* :thread-api/get-rtc-graph-uuid [repo] *)
let get_rtc_graph_uuid args =
  with_conn args (fun db ->
      Db_worker_effect.pure
        (match Ldb.get_graph_rtc_uuid db with
         | Some v -> Ds_wire.transit_of_value v
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-rtc-graph-uuid" get_rtc_graph_uuid

(* :thread-api/get-graph-uuid [repo] *)
let get_graph_uuid args =
  with_conn args (fun db ->
      Db_worker_effect.pure
        (match Ldb.get_graph_rtc_uuid db, Ldb.get_graph_local_uuid db with
         | Some v, _ | None, Some v -> Ds_wire.transit_of_value v
         | None, None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-graph-uuid" get_graph_uuid

(* :thread-api/get-all-page-titles [repo]
   cljs caches on [repo max-tx]; recomputing is semantics-identical. *)
let get_all_page_titles args =
  with_conn args (fun db ->
      let titles =
        Ldb.get_all_pages db
        |> List.map (fun e ->
               match Ldb.value e "block/title" with
               | Some v -> Ds_wire.transit_of_value v
               | None -> Wire.Nil)
      in
      Db_worker_effect.pure
        (Wire.Array
           (List.stable_sort
              (fun a b ->
                 match a, b with
                 | Wire.String x, Wire.String y -> String.compare x y
                 | Wire.Nil, Wire.Nil -> 0
                 | Wire.Nil, _ -> -1
                 | _, Wire.Nil -> 1
                 | _, _ -> 0)
              titles)))

let () = Dispatcher.register "thread-api/get-all-page-titles" get_all_page_titles

(* handler/graph.cljs favorite-page *)
let favorites_page_name = "$$$favorites"

let favorite_page db = Ldb.get_page db (String favorites_page_name)

(* :thread-api/get-favorite-pages [repo] *)
let get_favorite_pages args =
  with_conn args (fun db ->
      Db_worker_effect.pure
        (match favorite_page db with
         | None -> Wire.Array []
         | Some fav ->
             Ldb.sort_by_order (Ldb.ref_ents fav "block/_parent")
             |> List.filter_map (fun block -> Ldb.ref_ent block "block/link")
             |> List.filter (fun e -> not (Ldb.recycled e))
             |> fun es -> Wire.Array (List.map (plain_map_wire db) es)))

let () = Dispatcher.register "thread-api/get-favorite-pages" get_favorite_pages

(* :thread-api/favorited-page? [repo page-block-uuid] *)
let favorited_page args =
  with_conn args (fun db ->
      let uuid = Option.bind (arg args 1) Wire.as_uuid in
      Db_worker_effect.pure
        (Wire.Bool
           (match uuid with
            | Some uuid ->
                (match
                   entity db (Lookup_ref ("block/uuid", Uuid uuid)),
                   favorite_page db
                 with
                 | Some target, Some fav ->
                     List.of_seq
                       (datoms db Avet ~a:"block/page" ~v:(Ref fav.id) ())
                     |> List.exists (fun (d : datom) ->
                            match Ldb.ent_of_id db d.e with
                            | Some block ->
                                List.mem target.id (Ldb.ref_ids block "block/link")
                            | None -> false)
                 | _ -> false)
            | None -> false)))

let () = Dispatcher.register "thread-api/favorited-page?" favorited_page

(* :thread-api/get-recent-pages [repo page-ids] *)
let get_recent_pages args =
  with_conn args (fun db ->
      let ids =
        match arg args 1 with
        | Some t ->
            List.filter_map
              (fun t ->
                 try Some (Ds_wire.entity_ref_of_transit t)
                 with Invalid_argument _ -> None)
              (Wire.as_seq t)
        | None -> []
      in
      let seen = Hashtbl.create 31 in
      Db_worker_effect.pure
        (Wire.Array
           (ids
            |> List.filter (fun r ->
                   if Hashtbl.mem seen r then false
                   else (Hashtbl.replace seen r (); true))
            |> List.filteri (fun i _ -> i < 20)
            |> List.filter_map (fun r -> entity db r)
            |> List.filter Ldb.is_page
            |> List.filter (fun e -> not (Ldb.hidden e))
            |> List.filter (fun e ->
                   not
                     ((Ldb.is_property e
                       && Ldb.value e "logseq.property/hide?" = Some (Bool true))
                      ||
                      match Ldb.raw_title db e with
                      | Some (String s) -> String.trim s = ""
                      | _ -> true))
            |> List.map (plain_map_wire db))))

let () = Dispatcher.register "thread-api/get-recent-pages" get_recent_pages

(* :thread-api/get-block-source [repo id] — :db/id of first
   :block/_alias of the entity. *)
let get_block_source args =
  with_conn args (fun db ->
      let r =
        match arg args 1 with
        | Some (Wire.Int id) -> Some (Entity_id id)
        | Some t -> (try Some (Ds_wire.entity_ref_of_transit t) with _ -> None)
        | None -> None
      in
      Db_worker_effect.pure
        (match r with
         | Some r ->
             (match entity db r with
              | Some e ->
                  (match Ldb.ref_ents e "block/_alias" with
                   | src :: _ -> Wire.Int src.id
                   | [] -> Wire.nil)
              | None -> Wire.nil)
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-block-source" get_block_source

(* :thread-api/get-block-parents [repo id depth] — parents
   farthest-first, each as entity map + explicit :db/id/:block/title. *)
let get_block_parents args =
  with_conn args (fun db ->
      let depth =
        Option.value (Option.bind (arg args 2) Wire.as_int) ~default:3
      in
      let r =
        match arg args 1 with
        | Some (Wire.Int id) -> Some (Entity_id id)
        | Some t -> (try Some (Ds_wire.entity_ref_of_transit t) with _ -> None)
        | None -> None
      in
      Db_worker_effect.pure
        (match r with
         | Some r ->
             (match entity db r with
              | Some e ->
                  (match Ldb.value e "block/uuid" with
                   | Some (Uuid u) ->
                       Wire.List
                         (List.map
                            (fun (p : entity) ->
                              let m =
                                match Ds_wire.entity_map_wire p with
                                | Wire.Map kvs -> kvs
                                | w -> [ (Wire.nil, w) ]
                              in
                              let m =
                                ( kw "db/id",
                                  Wire.Int p.id )
                                :: ( kw "block/title",
                                     Ds_wire.transit_of_value
                                       (Option.value
                                          (Ldb.value p "block/title")
                                          ~default:Nil) )
                                :: List.filter
                                     (fun (k, _) ->
                                       not
                                         (Wire.key_matches "db/id" k
                                          || Wire.key_matches
                                               "block/title" k))
                                     m
                              in
                              Wire.Map m)
                            (Ldb.get_block_parents db ~depth u))
                   | _ -> Wire.nil)
              | None -> Wire.nil)
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-block-parents" get_block_parents

(* :thread-api/get-alias-source-page [repo page-id] — entity->map of
   the first :block/_alias entity. *)
let get_alias_source_page args =
  with_conn args (fun db ->
      Db_worker_effect.pure
        (match Option.bind (arg args 1) Wire.as_int with
         | Some page_id ->
             (match Ldb.get_alias_source_page db page_id with
              | Some src -> Ds_wire.entity_map_wire src
              | None -> Wire.nil)
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-alias-source-page" get_alias_source_page

(* :thread-api/get-bidirectional-properties [repo {:keys [target-id]}] *)
let get_bidirectional_properties args =
  with_conn args (fun db ->
      let target_id =
        Option.bind (arg args 1) (fun t ->
            Option.bind (Wire.get "target-id" t) Wire.as_int)
      in
      Db_worker_effect.pure
        (match target_id with
         | Some target_id ->
             Wire.List
               (List.map
                  (fun (g : Ldb.bidirectional_group) ->
                    Wire.Map
                      [ ( kw "title", Wire.String g.title )
                      ; ( kw "class", Ds_wire.entity_map_wire g.class_ )
                      ; ( kw "entities",
                          Wire.List
                            (List.map
                               (fun (e : entity) ->
                                 Wire.Tagged
                                   ( "datascript/Entity",
                                     Ds_wire.entity_map_wire e ))
                               g.entities) )
                      ])
                  (Ldb.get_bidirectional_properties db target_id))
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-bidirectional-properties" get_bidirectional_properties

(* :thread-api/get-page-route-info [repo page-id-name-or-uuid] *)
let get_page_route_info args =
  with_conn args (fun db ->
      let ref_v = Option.map Ds_wire.value_of_transit (arg args 1) in
      Db_worker_effect.pure
        (match ref_v with
         | Some v ->
             (match Ldb.get_page db v with
              | None -> Wire.nil
              | Some page ->
                  let base =
                    [ ( kw "page-id", Wire.Int page.id )
                    ; ( kw "page-uuid",
                        Ds_wire.transit_of_value
                          (Option.value (Ldb.value page "block/uuid") ~default:Nil) )
                    ; ( kw "page-title",
                        Ds_wire.transit_of_value
                          (Option.value (Ldb.value page "block/title") ~default:Nil) )
                    ; ( kw "hidden?", Wire.Bool (Ldb.hidden page) )
                    ; ( kw "property?", Wire.Bool (Ldb.is_property page) )
                    ; ( kw "built-in?", Wire.Bool (Ldb.built_in page) )
                    ; ( kw "private-built-in?",
                        Wire.Bool
                          (Ldb.built_in page && Ldb.private_built_in_page page) )
                    ]
                  in
                  let base =
                    if Option.is_some (Ldb.value page "logseq.property/heading")
                    then begin
                      let page_name =
                        match Ldb.ref_ent page "block/page" with
                        | Some p -> Ldb.value p "block/name"
                        | None -> None
                      in
                      let route_name =
                        match Ldb.string_value page "block/title" with
                        | Some t -> Db_content.heading_content_to_route_name t
                        | None -> None
                      in
                      base
                      @ [ ( kw "block-page-name",
                            Ds_wire.transit_of_value
                              (Option.value page_name ~default:Nil) )
                        ; ( kw "block-route-name",
                            match route_name with
                            | Some s -> Wire.String s
                            | None -> Wire.nil )
                        ]
                    end
                    else base
                  in
                  let base =
                    match Ldb.get_alias_source_page db page.id with
                    | Some src ->
                        base
                        @ [ ( kw "alias-source-id", Wire.Int src.id )
                          ; ( kw "alias-source-uuid",
                              Ds_wire.transit_of_value
                                (Option.value
                                   (Ldb.value src "block/uuid")
                                   ~default:Nil) )
                          ]
                    | None -> base
                  in
                  Wire.Map base)
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-page-route-info" get_page_route_info

(* :thread-api/get-block-by-page-name-and-block-route-name
   [repo page-id-name-or-uuid route-name] — {:block/uuid} only. *)
let get_block_by_page_name_and_block_route_name args =
  with_conn args (fun db ->
      let ref_v = Option.map Ds_wire.value_of_transit (arg args 1) in
      let route_name = Option.bind (arg args 2) Wire.as_string in
      Db_worker_effect.pure
        (match ref_v, route_name with
         | Some v, Some route_name ->
             (match Db_content.block_route_resolution db v route_name with
              | Some { Db_content.block = Some b; _ } ->
                  Wire.Map
                    [ ( kw "block/uuid",
                        Ds_wire.transit_of_value
                          (Option.value (Ldb.value b "block/uuid") ~default:Nil) )
                    ]
              | _ -> Wire.nil)
         | _ -> Wire.nil))

let () =
  Dispatcher.register "thread-api/get-block-by-page-name-and-block-route-name"
    get_block_by_page_name_and_block_route_name
