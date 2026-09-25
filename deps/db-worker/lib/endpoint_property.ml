(* Property endpoints (frontend/worker/handler/property.cljs).
   Wiring note for worker_core.ml — add:

     ignore Endpoint_property.get_all_classes;
     ignore Endpoint_property.get_structured_children;
     ignore Endpoint_property.get_class_extends_children_tree;
     ignore Endpoint_property.get_block_class_default_properties;
     ignore Endpoint_property.get_class_properties;
     ignore Endpoint_property.get_property_closed_values;
     ignore Endpoint_property.get_property_node_selector_data;
     ignore Endpoint_property.get_class_objects;
     ignore Endpoint_property.validate_block_tag;
     ignore Endpoint_property.get_property_values;
     ignore Endpoint_property.get_all_properties;
     ignore Endpoint_property.validate_property_value;
     ignore Endpoint_property.get_first_url_property_value;
     ignore Endpoint_property.convert_tag_to_page;
     ignore Endpoint_property.convert_page_to_tag;
     ignore Endpoint_property.get_date_scheduled_or_deadlines_endpoint;
     ignore Endpoint_property.get_display_properties_endpoint;
     ignore Endpoint_property.reorder_display_property;
*)

open Datascript

let kw s = Wire.Keyword s

let repo_arg args =
  match List.nth_opt args 0 with
  | Some (Wire.String repo) -> repo
  | Some Wire.Nil | None -> ""
  | _ -> "" (* cljs: conn lookup misses on any non-string arg *)

let arg args i = List.nth_opt args i

let with_conn args f =
  let repo = repo_arg args in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.nil
  | Some conn -> f (Datascript.db conn)

let pure v = Db_worker_effect.pure v

let opt_bool opts name ~default =
  match opts with
  | Some (Wire.Map _ as m) ->
      (match Wire.get name m with Some (Wire.Bool b) -> b | _ -> default)
  | _ -> default

let entity_of_arg db (v : Wire.t) : entity option =
  (* cljs accepts entity, eid, lookup-ref, ident — and plain {:db/id n} maps *)
  match v with
  | Wire.Map _ ->
      (match Wire.get "db/id" v with
       | Some (Wire.Int id) -> Ldb.ent_of_id db id
       | Some (Wire.Int64 id) -> Ldb.ent_of_id db (Int64.to_int id)
       | _ -> None)
  | Wire.Tagged ("datascript/Entity", m) ->
      (match Wire.get "db/id" m with
       | Some (Wire.Int id) -> Ldb.ent_of_id db id
       | Some (Wire.Int64 id) -> Ldb.ent_of_id db (Int64.to_int id)
       | _ -> None)
  | _ ->
      (try entity db (Ds_wire.entity_ref_of_transit v) with _ -> None)

let eid_of_arg db (v : Wire.t) : entity_id option =
  match v with
  | Wire.Int id -> Some id
  | _ -> Option.map (fun (e : entity) -> e.id) (entity_of_arg db v)

let ident_of (e : entity) : string =
  match Ldb.ident_of e with Some i -> i | None -> ""

(* ---------- shared handler helpers ---------- *)
(* Property-map helpers live in Property_maps (below Endpoint_property and
   Display_properties to avoid a module cycle); alias them here so existing
   Endpoint_property.X call sites keep working. *)

let select_keys_wire = Property_maps.select_keys_wire
let wire_assoc = Property_maps.wire_assoc
let entity_direct_map = Property_maps.entity_direct_map
let display_property_value_keys = Property_maps.display_property_value_keys
let display_property_keys = Property_maps.display_property_keys
let entity_direct_value = Property_maps.entity_direct_value
let display_property_description = Property_maps.display_property_description
let property_closed_values = Property_maps.property_closed_values
let display_property_map = Property_maps.display_property_map
let property_plain_map = Property_maps.property_plain_map

(* handler get-all-classes *)
let get_all_class_entities db ~except_root_class ~except_private_tags
    ~except_extends_hidden_tags : entity list =
  match Ldb.ent_of_ref db (Ident "logseq.class/Tag") with
  | None -> []
  | Some tag_ent ->
      List.of_seq
        (datoms db Avet ~a:"block/tags" ~v:(Ref tag_ent.id) ())
      |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
      |> List.filter (fun (c : entity) -> not (Ldb.recycled c))
      |> List.filter (fun (c : entity) ->
             (not except_private_tags)
             || (match Ldb.ident_of c with
                | Some i -> not (List.mem i Db_class.private_tags)
                | None -> true))
      |> List.filter (fun (c : entity) ->
             (not except_extends_hidden_tags)
             || (match Ldb.ident_of c with
                | Some i -> not (List.mem i Db_class.extends_hidden_tags)
                | None -> true))
      |> List.filter (fun (c : entity) ->
             (not except_root_class)
             || Ldb.ident_of c <> Some "logseq.class/Root")

let get_all_classes_maps db ~except_root_class ~except_private_tags
    ~except_extends_hidden_tags : Wire.t list =
  List.map Ds_wire.entity_map_wire
    (get_all_class_entities db ~except_root_class ~except_private_tags
       ~except_extends_hidden_tags)

(* handler class-extends-children-tree *)
let rec class_extends_children_tree db (class_id : entity_id)
    (seen : entity_id list) : Wire.t list =
  if List.mem class_id seen then []
  else
    let seen' = class_id :: seen in
    List.of_seq
      (datoms db Avet ~a:"logseq.property.class/extends"
         ~v:(Ref class_id) ())
    |> List.filter_map (fun (d : datom) ->
           match Ldb.ent_of_id db d.e with
           | Some child ->
               Some
                 (wire_assoc "class/children"
                    (Wire.Array
                       (class_extends_children_tree db d.e seen'))
                    (select_keys_wire
                       [ "db/id"; "block/title"; "block/uuid"; "db/ident" ]
                       (Ds_wire.entity_map_wire child)))
           | None -> None)
    |> List.stable_sort (fun a b ->
           let title_of m =
             match Wire.get "block/title" m with
             | Some (Wire.String s) -> s
             | _ -> ""
           in
           String.compare (title_of a) (title_of b))

(* :thread-api/get-first-url-property-value [repo block-id] *)
let get_first_url_property_value args =
  with_conn args (fun db ->
      pure
        (match Option.bind (arg args 1) (entity_of_arg db) with
         | None -> Wire.nil
         | Some block ->
             let rec find = function
               | [] -> None
               | (d : datom) :: tl ->
                   if Plain_value.db_property_pred d.a then
                     match entity db (Ident d.a) with
                     | Some property
                       when Ldb.value property "logseq.property/type"
                            = Some (Keyword "url") ->
                         (match d.v with
                          | Ref id ->
                              (match Ldb.ent_of_id db id with
                               | Some e ->
                                   (match Ldb.value e "block/title" with
                                    | Some (String s) -> Some (Wire.String s)
                                    | _ -> find tl)
                               | None -> find tl)
                          | String s -> Some (Wire.String s)
                          | _ -> find tl)
                     | _ -> find tl
                   else find tl
             in
             (match find (List.of_seq (datoms db Eavt ~e:block.id ())) with
              | Some v -> v
              | None -> Wire.nil)))

let () =
  Dispatcher.register "thread-api/get-first-url-property-value"
    get_first_url_property_value

(* :thread-api/get-all-classes [repo opts] *)
let get_all_classes args =
  with_conn args (fun db ->
      let opts = arg args 1 in
      pure
        (Wire.Array
           (get_all_classes_maps db
              ~except_root_class:(opt_bool opts "except-root-class?" ~default:false)
              ~except_private_tags:
                (opt_bool opts "except-private-tags?" ~default:true)
              ~except_extends_hidden_tags:
                (opt_bool opts "except-extends-hidden-tags?" ~default:false))))

let () = Dispatcher.register "thread-api/get-all-classes" get_all_classes

(* :thread-api/get-structured-children [repo class-id] *)
let get_structured_children args =
  with_conn args (fun db ->
      pure
        (match Option.bind (arg args 1) Wire.as_int with
         | Some cid ->
             Wire.Array
               (List.map (fun id -> Wire.Int id)
                  (Db_class.get_structured_children db cid))
         | None -> Wire.nil))

let () =
  Dispatcher.register "thread-api/get-structured-children"
    get_structured_children

(* :thread-api/get-class-extends-children-tree [repo class-id] *)
let get_class_extends_children_tree args =
  with_conn args (fun db ->
      pure
        (match Option.bind (arg args 1) Wire.as_int with
         | Some cid ->
             Wire.Array (class_extends_children_tree db cid [])
         | None -> Wire.nil))

let () =
  Dispatcher.register "thread-api/get-class-extends-children-tree"
    get_class_extends_children_tree

(* :thread-api/get-block-class-default-properties [repo block-id] *)
let get_block_class_default_properties args =
  with_conn args (fun db ->
      pure
        (match Option.bind (arg args 1) (eid_of_arg db) with
         | None -> Wire.nil
         | Some eid ->
             (match Ldb.ent_of_id db eid with
              | None -> Wire.nil
              | Some _ ->
             let r = Outliner_property.get_block_classes_properties db eid in
             Wire.Map
               (List.filter_map
                  (fun (p : entity) ->
                     match Ldb.value p "logseq.property/default-value" with
                     | Some (Ref id) ->
                         (match Ldb.ent_of_id db id with
                          | Some dv ->
                              Some (kw (ident_of p), Ds_wire.entity_map_wire dv)
                          | None -> None)
                     | Some v -> Some (kw (ident_of p), Ds_wire.transit_of_value v)
                     | None -> None)
                  r.classes_properties))))

let () =
  Dispatcher.register "thread-api/get-block-class-default-properties"
    get_block_class_default_properties

(* :thread-api/get-class-properties [repo class-id] *)
let get_class_properties args =
  with_conn args (fun db ->
      pure
        (match Option.bind (arg args 1) (entity_of_arg db) with
         | Some class_ ->
             Wire.Array
               (List.map (property_plain_map db)
                  (Outliner_property.get_class_properties class_))
         | None -> Wire.nil))

let () =
  Dispatcher.register "thread-api/get-class-properties" get_class_properties

(* :thread-api/get-property-closed-values [repo property-ident] *)
let get_property_closed_values args =
  with_conn args (fun db ->
      pure
        (match Option.bind (arg args 1) (entity_of_arg db) with
         | Some property -> property_closed_values db property
         | None -> Wire.nil))

let () =
  Dispatcher.register "thread-api/get-property-closed-values"
    get_property_closed_values

(* get-property-values option decode *)
let get_property_values_of_option db (property_ident : string) (option : Wire.t)
    : Wire.t =
  let view_id =
    match Wire.get "view-id" option with
    | Some (Wire.Int id) -> Some id
    | _ -> None
  in
  let query_entity_ids =
    match Wire.get "query-entity-ids" option with
    | Some w -> Some (List.filter_map Wire.as_int (Wire.as_seq w))
    | None -> None
  in
  Wire.Array (Db_view.get_property_values db property_ident ~view_id ~query_entity_ids)

(* cljs property-node-selector-* read `property` as either an entity or a
   plain map {:db/ident :logseq.property/type :db/valueType
   :logseq.property/classes} — read the fields uniformly. *)
type prop_view =
  { pv_ident : string
  ; pv_type : string option
  ; pv_value_type : string option
  ; pv_classes : entity list }

let string_of_keyword_wire (v : Wire.t option) : string option =
  match v with
  | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
  | _ -> None

let prop_view_of_entity (e : entity) : prop_view =
  { pv_ident = ident_of e
  ; pv_type =
      (match Ldb.value e "logseq.property/type" with
       | Some (Keyword k) -> Some k
       | _ -> None)
  ; pv_value_type =
      (match Ldb.value e "db/valueType" with
       | Some (Keyword k) -> Some k
       | _ -> None)
  ; pv_classes = Ldb.ref_ents e "logseq.property/classes" }

let prop_view_of_arg db (v : Wire.t) : prop_view option =
  match entity_of_arg db v with
  | Some e -> Some (prop_view_of_entity e)
  | None ->
      (match v with
       | Wire.Map _ ->
           (match string_of_keyword_wire (Wire.get "db/ident" v) with
            | Some ident ->
                Some
                  { pv_ident = ident
                  ; pv_type =
                      string_of_keyword_wire
                        (Wire.get "logseq.property/type" v)
                  ; pv_value_type =
                      string_of_keyword_wire (Wire.get "db/valueType" v)
                  ; pv_classes =
                      (match Wire.get "logseq.property/classes" v with
                       | Some cs ->
                           List.filter_map (entity_of_arg db) (Wire.as_seq cs)
                       | None -> []) }
            | None -> None)
       | _ -> None)

(* handler property-node-selector-values *)
let property_node_selector_values db (property : prop_view) (option : Wire.t)
    : Wire.t =
  let values = get_property_values_of_option db property.pv_ident option in
  match property.pv_value_type with
  | Some "db.type/ref" ->
      (match values with
       | Wire.Array choices ->
           Wire.Array
             (List.map
                (fun choice ->
                   let value_eid =
                     match Wire.get "value" choice with
                     | Some v -> Option.bind (Wire.get "db/id" v) Wire.as_int
                     | None -> None
                   in
                   match Option.bind value_eid (Ldb.ent_of_id db) with
                   | Some value_entity ->
                       let fwd =
                         Plain_value.entity_forward_map db value_entity
                           ~properties:
                             [ "db/ident"; "block/uuid"; "block/tags"; "block/alias" ]
                       in
                       let alias_sources =
                         List.of_seq
                           (datoms db Avet ~a:"block/alias"
                              ~v:(Ref value_entity.id) ())
                       in
                       let fwd =
                         match alias_sources with
                         | src :: _ -> wire_assoc "block/alias-source-page-id" (Wire.Int src.e) fwd
                         | [] -> fwd
                       in
                       wire_assoc "value" fwd choice
                   | None -> choice)
                choices)
       | _ -> values)
  | _ -> values

(* handler broad-scoped-node-property? *)
let broad_scoped_node_property (property : prop_view) (classes : entity list)
    : bool =
  property.pv_type = Some "node"
  && List.exists
       (fun (c : entity) -> Ldb.ident_of c = Some "logseq.class/Page")
       classes

(* handler property-node-selector-initial-choices *)
let property_node_selector_initial_choices db (property : prop_view)
    (non_root_classes : entity list) (option : Wire.t) : Wire.t =
  match property.pv_type with
  | Some "property" -> Wire.nil
  | _ ->
      if non_root_classes <> [] then
        if broad_scoped_node_property property non_root_classes then
          property_node_selector_values db property option
        else
          Wire.Array
            (List.concat_map
               (fun (c : entity) -> Db_class.get_class_objects db c.id)
               non_root_classes
             |> (fun es ->
                  let seen = Hashtbl.create 7 in
                  List.filter
                    (fun (e : entity) ->
                       if Hashtbl.mem seen e.id then false
                       else begin
                         Hashtbl.replace seen e.id ();
                         true
                       end)
                    es)
             |> List.map (fun e -> Plain_value.worker_plain_entity db e))
      else property_node_selector_values db property option

(* handler property-node-selector-data *)
let property_node_selector_data db (option : Wire.t) : Wire.t =
  let property =
    Option.bind (Wire.get "property" option) (prop_view_of_arg db)
  in
  let block =
    match Wire.get "block" option with
    | Some b -> entity_of_arg db b
    | None -> None
  in
  match property with
  | None -> Wire.nil
  | Some property ->
      let property_ident = property.pv_ident in
      let all_classes =
        get_all_class_entities db ~except_root_class:false
          ~except_private_tags:false ~except_extends_hidden_tags:false
      in
      let class_options =
        get_all_classes_maps db ~except_root_class:true
          ~except_private_tags:
            (property_ident <> "logseq.property/template-applied-to")
          ~except_extends_hidden_tags:false
      in
      let extends_class_options =
        get_all_classes_maps db ~except_root_class:false
          ~except_private_tags:true ~except_extends_hidden_tags:true
      in
      let classes = property.pv_classes in
      let class_pred = property.pv_type = Some "class" in
      let tag_class =
        List.find_opt
          (fun (c : entity) -> Ldb.ident_of c = Some "logseq.class/Tag")
          all_classes
      in
      let non_root_classes =
        List.filter
          (fun (c : entity) -> Ldb.ident_of c <> Some "logseq.class/Root")
          classes
      in
      let non_root_classes =
        match class_pred, tag_class with
        | true, Some t ->
            (* cljs conj onto a seq prepends *)
            if List.exists (fun (c : entity) -> c.id = t.id) non_root_classes
            then non_root_classes
            else t :: non_root_classes
        | _ -> non_root_classes
      in
      let extends_property =
        property_ident = "logseq.property.class/extends"
      in
      let class_ids =
        let ids =
          List.map (fun (c : entity) -> c.id) all_classes
          @ List.map (fun (c : entity) -> c.id) classes
          @ (match extends_property, block with
             | true, Some b -> [ b.id ]
             | _ -> [])
        in
        let seen = Hashtbl.create 7 in
        List.filter
          (fun id ->
             if Hashtbl.mem seen id then false
             else begin
               Hashtbl.replace seen id ();
               true
             end)
          ids
      in
      let structured_children_by_class_id =
        Wire.Map
          (List.map
             (fun cid ->
                ( Wire.Int cid
                , Wire.Array
                    (List.map (fun i -> Wire.Int i)
                       (Db_class.get_structured_children db cid)) ))
             class_ids)
      in
      let extends_by_class_id =
        Wire.Map
          (List.map
             (fun cid ->
                ( Wire.Int cid
                , Wire.Array
                    (match Ldb.ent_of_id db cid with
                     | Some ce ->
                         List.map Ds_wire.entity_map_wire
                           (Db_class.get_class_extends ce)
                     | None -> []) ))
             class_ids)
      in
      Wire.Map
        [ ( kw "all-classes"
          , Wire.Array (List.map Ds_wire.entity_map_wire all_classes) )
        ; (kw "class-options", Wire.Array class_options)
        ; (kw "extends-class-options", Wire.Array extends_class_options)
        ; ( kw "structured-children-by-class-id"
          , structured_children_by_class_id )
        ; (kw "extends-by-class-id", extends_by_class_id)
        ; ( kw "initial-choices"
          , property_node_selector_initial_choices db property
              non_root_classes option ) ]

(* :thread-api/get-property-node-selector-data [repo option] *)
let get_property_node_selector_data args =
  with_conn args (fun db ->
      pure
        (match arg args 1 with
         | Some option -> property_node_selector_data db option
         | None -> Wire.nil))

let () =
  Dispatcher.register "thread-api/get-property-node-selector-data"
    get_property_node_selector_data

(* :thread-api/get-class-objects [repo class-id] *)
let get_class_objects args =
  with_conn args (fun db ->
      pure
        (match Option.bind (arg args 1) Wire.as_int with
         | Some cid ->
             Db_class.get_class_objects db cid
             |> List.map (fun e -> Plain_value.worker_plain_entity db e)
             |> (fun xs ->
                  Plain_value.with_explicit_ref_fields_recursive
                    (Wire.Array xs))
         | None -> Wire.nil))

let () = Dispatcher.register "thread-api/get-class-objects" get_class_objects

(* :thread-api/validate-block-tag [repo block-id tag-id] *)
let validate_block_tag args =
  with_conn args (fun db ->
      let block =
        match arg args 1 with
        | Some w -> entity_of_arg db w
        | None -> None
      in
      let tag =
        match arg args 2 with
        | Some w -> entity_of_arg db w
        | None -> None
      in
      let title =
        Option.bind block (fun (b : entity) -> Ldb.string_value b "block/title")
      in
      pure
        (try
           Outliner_validate.validate_unique_by_name_and_tags db title block tag;
           Wire.Map [ (kw "valid?", Wire.Bool true) ]
         with
         | Outliner_validate.Notification w ->
             Wire.Map
               [ (kw "valid?", Wire.Bool false)
               ; ( kw "payload"
                 , match Wire.get "payload" w with
                   | Some p -> p
                   | None -> w ) ]))

let () = Dispatcher.register "thread-api/validate-block-tag" validate_block_tag

(* :thread-api/get-property-values [repo option] *)
let get_property_values args =
  with_conn args (fun db ->
      pure
        (match arg args 1 with
         | Some option ->
             (match Wire.get "property-ident" option with
              | Some (Wire.Keyword ident) ->
                  get_property_values_of_option db ident option
              | Some (Wire.String ident) ->
                  get_property_values_of_option db ident option
              | _ -> Wire.nil)
         | None -> Wire.nil))

let () =
  Dispatcher.register "thread-api/get-property-values" get_property_values

(* entity-util/get-entity-types — tag idents mapped to type keywords *)
let entity_type_idents (e : entity) : string list =
  List.filter_map
    (fun (t : entity) ->
       match Ldb.ident_of t with
       | Some "logseq.class/Tag" -> Some "class"
       | Some "logseq.class/Property" -> Some "property"
       | Some "logseq.class/Journal" -> Some "journal"
       | Some "logseq.class/Page" -> Some "page"
       | _ -> None)
    (Ldb.ref_ents e "block/tags")

(* handler ui-non-suitable-property? *)
let ui_non_suitable_property (block : entity option) (property : entity)
    ~class_schema : bool =
  match block with
  | None -> false
  | Some block ->
      let ident = ident_of property in
      let block_page = Ldb.is_page block in
      let block_types =
        let types = entity_type_idents block in
        let types =
          if block_page && not (List.mem "page" types) then types @ [ "page" ]
          else types
        in
        if types = [] then [ "block" ] else types
      in
      let view_context =
        match Ldb.value property "logseq.property/view-context" with
        | Some (Keyword k) -> k
        | _ -> "all"
      in
      let has_view_context =
        Option.is_some (Ldb.value property "logseq.property/view-context")
      in
      ident = "logseq.property/query"
      || ((not block_page) && ident = "block/alias")
      || (view_context <> "all" && not (List.mem view_context block_types))
      || (Ldb.built_in block && ident = "logseq.property.class/extends")
      || (class_schema && Ldb.public_built_in_property property
          && has_view_context)

(* handler get-all-properties *)
let get_all_properties db (opts : Wire.t) : Wire.t =
  let remove_built_in =
    opt_bool (Some opts) "remove-built-in-property?" ~default:true
  in
  let remove_non_queryable =
    opt_bool (Some opts) "remove-non-queryable-built-in-property?"
      ~default:false
  in
  let remove_ui_non_suitable =
    opt_bool (Some opts) "remove-ui-non-suitable-properties?" ~default:false
  in
  let class_schema =
    opt_bool (Some opts) "class-schema?" ~default:false
  in
  let block =
    match Wire.get "block" opts with
    | Some b -> entity_of_arg db b
    | None -> None
  in
  let property_tag =
    match Ldb.ent_of_ref db (Ident "logseq.class/Property") with
    | Some e -> e.id
    | None -> -1
  in
  List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref property_tag) ())
  |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
  |> List.filter (fun (p : entity) -> not (Ldb.recycled p))
  |> List.stable_sort (fun (a : entity) (b : entity) ->
         let triple e =
           ( (match Ldb.ident_of e with
              | Some i -> Ldb.plugin_property i
              | None -> false)
           , Ldb.built_in e
           , Ldb.string_value e "block/title" )
         in
         compare (triple a) (triple b))
  |> List.filter (fun (p : entity) ->
         (not remove_built_in)
         || not
              (Ldb.built_in p
               && (not (Ldb.public_built_in_property p))
               && Ldb.ident_of p <> Some "logseq.property/icon"))
  |> List.filter (fun (p : entity) ->
         (not remove_non_queryable)
         || not
              (Ldb.built_in p
               &&
               (match Ldb.ident_of p with
                | Some i -> not (Db_property.built_in_property_queryable i)
                | None -> true)))
  |> List.filter (fun (p : entity) ->
         (not remove_ui_non_suitable)
         || not (ui_non_suitable_property block p ~class_schema))
  |> List.map (fun (p : entity) ->
         let m = display_property_map db p in
         let raw_title =
           match Ldb.raw_title db p with
           | Some v -> Some (Ds_wire.transit_of_value v)
           | None -> Option.map Ds_wire.transit_of_value (Ldb.value p "block/name")
         in
         let m =
           match raw_title with
           | Some t -> wire_assoc "block/raw-title" t m
           | None -> m
         in
         match Ldb.value p "logseq.property/deleted-at" with
         | Some v -> wire_assoc "logseq.property/deleted-at" (Ds_wire.transit_of_value v) m
         | None -> m)
  |> fun ms -> Wire.Array ms

(* :thread-api/get-all-properties [repo opts] *)
let get_all_properties_endpoint args =
  with_conn args (fun db ->
      let opts =
        match arg args 1 with Some o -> o | None -> Wire.Map []
      in
      pure (get_all_properties db opts))

let () =
  Dispatcher.register "thread-api/get-all-properties" get_all_properties_endpoint

(* :thread-api/validate-property-value [repo option] *)
let validate_property_value args =
  with_conn args (fun db ->
      pure
        (match arg args 1 with
         | Some option ->
             let property =
               match Wire.get "property" option with
               | Some p -> p
               | None -> Wire.nil
             in
             let value =
               match Wire.get "value" option with
               | Some v -> v
               | None -> Wire.nil
             in
             Outliner_property.validate_property_value db property value
         | None -> Wire.nil))

let () =
  Dispatcher.register "thread-api/validate-property-value" validate_property_value

(* handler/property.cljs convert-tag-to-page-tx *)
let convert_tag_to_page_tx db (class_id : entity_id) : Wire.t list =
  let objects = Db_class.get_class_objects db class_id in
  let page_txs =
    [ Wire.Array [ kw "db/retract"; Wire.Int class_id; kw "db/ident" ]
    ; Wire.Array
        [ kw "db/retract"; Wire.Int class_id; kw "block/tags"
        ; kw "logseq.class/Tag" ]
    ; Wire.Array
        [ kw "db/retract"; Wire.Int class_id
        ; kw "logseq.property.class/extends" ]
    ; Wire.Array
        [ kw "db/retract"; Wire.Int class_id
        ; kw "logseq.property.class/properties" ]
    ; Wire.Array
        [ kw "db/add"; Wire.Int class_id; kw "block/tags"
        ; kw "logseq.class/Page" ] ]
  in
  let object_txs =
    List.concat_map
      (fun (obj : entity) ->
        let title =
          match Ldb.string_value obj "block/title" with
          | Some t ->
              Db_content.replace_tag_refs_with_page_refs t
                (Ldb.ref_ents obj "block/tags")
          | None -> invalid_arg "class object missing :block/title"
        in
        [ Wire.Map
            [ (kw "db/id", Wire.Int obj.id)
            ; (kw "block/title", Wire.String title) ]
        ; Wire.Array
            [ kw "db/retract"; Wire.Int obj.id; kw "block/tags"
            ; Wire.Int class_id ] ])
      objects
  in
  page_txs @ object_txs

(* :thread-api/convert-tag-to-page [repo class-id] *)
let convert_tag_to_page args =
  let repo = repo_arg args in
  let conn = Endpoint_transaction.require_conn repo in
  let class_id =
    match arg args 1 with
    | Some (Wire.Int n) -> n
    | Some (Wire.Int64 n) -> Int64.to_int n
    | Some w ->
        invalid_arg
          ("convert-tag-to-page: class-id must be an entity id: "
           ^ Transit_codec.to_string w)
    | None -> invalid_arg "convert-tag-to-page: missing class-id"
  in
  Worker_state.set_db_latest_tx_time repo;
  ignore
    (Db_transact.transact conn
       (convert_tag_to_page_tx (Datascript.db conn) class_id)
       [ ("outliner-op", Keyword "save-block") ]);
  pure Wire.nil

let () = Dispatcher.register "thread-api/convert-tag-to-page" convert_tag_to_page

(* handler/property.cljs convert-page-to-tag-tx *)
let convert_page_to_tag_tx db (page_id : entity_id) : Wire.t list =
  let page =
    match entity db (Entity_id page_id) with
    | Some e -> e
    | None -> invalid_arg "convert-page-to-tag: page entity not found"
  in
  let value_of a =
    match Ldb.value page a with
    | Some v -> Ds_wire.transit_of_value v
    | None -> Wire.Nil
  in
  let page_m =
    Wire.Map
      [ (kw "block/uuid", value_of "block/uuid")
      ; (kw "block/title", value_of "block/title")
      ; (kw "block/created-at", value_of "block/created-at") ]
  in
  [ Db_class.build_new_class db page_m
  ; Wire.Array
      [ kw "db/retract"; Wire.Int page_id; kw "block/tags"
      ; kw "logseq.class/Page" ] ]

(* :thread-api/convert-page-to-tag [repo page-id] *)
let convert_page_to_tag args =
  let repo = repo_arg args in
  let conn = Endpoint_transaction.require_conn repo in
  let page_id =
    match arg args 1 with
    | Some (Wire.Int n) -> n
    | Some (Wire.Int64 n) -> Int64.to_int n
    | Some w ->
        invalid_arg
          ("convert-page-to-tag: page-id must be an entity id: "
           ^ Transit_codec.to_string w)
    | None -> invalid_arg "convert-page-to-tag: missing page-id"
  in
  Worker_state.set_db_latest_tx_time repo;
  ignore
    (Db_transact.transact conn
       (convert_page_to_tag_tx (Datascript.db conn) page_id)
       [ ("outliner-op", Keyword "save-block") ]);
  pure Wire.nil

let () = Dispatcher.register "thread-api/convert-page-to-tag" convert_page_to_tag

(* cljs walk/postwalk over Wire.t — children first, then the fn. *)
let rec wire_postwalk (f : Wire.t -> Wire.t) (v : Wire.t) : Wire.t =
  let inner w =
    match w with
    | Wire.Map pairs ->
        Wire.Map
          (List.map
             (fun (k, x) -> (wire_postwalk f k, wire_postwalk f x))
             pairs)
    | Wire.Array xs -> Wire.Array (List.map (wire_postwalk f) xs)
    | Wire.List xs -> Wire.List (List.map (wire_postwalk f) xs)
    | Wire.Set xs -> Wire.Set (List.map (wire_postwalk f) xs)
    | Wire.Tagged (t, x) -> Wire.Tagged (t, wire_postwalk f x)
    | w -> w
  in
  f (inner v)

(* handler/property.cljs sort-by-order-recursive — postwalk over pulled
   wire maps: rewrite :block/_parent sets into :block/children sorted by
   :block/order (nil order sorts first). *)
let sort_by_order_recursive (form : Wire.t) : Wire.t =
  let sort_children children =
    List.stable_sort
      (fun a b ->
        let order_of w =
          match Wire.get "block/order" w with
          | Some (Wire.Int n) -> (0, n)
          | Some (Wire.Int64 n) -> (0, Int64.to_int n)
          | _ -> (-1, 0)
        in
        compare (order_of a) (order_of b))
      children
  in
  let value v =
    match v with
    | Wire.Map pairs ->
        (match List.assoc_opt (kw "block/_parent") pairs with
         | Some (Wire.Set children | Wire.Array children | Wire.List children) ->
             let pairs' =
               List.filter (fun (k, _) -> k <> kw "block/_parent") pairs
             in
             Wire.Map (pairs' @ [ (kw "block/children", Wire.Array (sort_children children)) ])
         | Some _ ->
             let pairs' =
               List.filter (fun (k, _) -> k <> kw "block/_parent") pairs
             in
             Wire.Map (pairs' @ [ (kw "block/children", Wire.Array []) ])
         | None -> Wire.Map pairs)
    | v -> v
  in
  wire_postwalk value form

(* handler/property.cljs group-by-page — group by the :block/page wire
   map when the first block carries one, preserving first-seen order. *)
let group_by_page (blocks : Wire.t list) : Wire.t =
  match blocks with
  | first :: _ when
      (match Wire.get "block/page" first with
       | Some (Wire.Map _) -> true
       | _ -> false) ->
      let groups : (Wire.t, Wire.t list) Hashtbl.t = Hashtbl.create 17 in
      let order = ref [] in
      List.iter
        (fun b ->
          let page =
            match Wire.get "block/page" b with
            | Some (Wire.Map _ as p) -> p
            | _ -> Wire.Nil
          in
          (match Hashtbl.find_opt groups page with
           | Some _ -> ()
           | None -> order := page :: !order);
          Hashtbl.replace groups page
            (b :: Option.value (Hashtbl.find_opt groups page) ~default:[]))
        blocks;
      Wire.Map
        (List.map
           (fun page ->
             (page, Wire.Array (List.rev (Hashtbl.find groups page))))
           (List.rev !order))
  | _ -> Wire.Array blocks

(* handler/property.cljs get-date-scheduled-or-deadlines. The cljs passes the
   pull selector '[:* {:block/page [:db/id :block/title :block/uuid]}] as the
   ?block-attrs query input; datascript-ocaml parses input pull patterns
   against an empty db, which rejects ref map-specs, so the same selector is
   inlined here — wire args are unchanged ([repo start-time end-time]). *)
let get_date_scheduled_or_deadlines db (start_time : int64) (end_time : int64)
    : Wire.t =
  let rows =
    Datascript.q_string db
      "[:find [(pull ?block [:* {:block/page [:db/id :block/title :block/uuid]}]) ...] \
       :in $ ?start-time ?end-time \
       :where \
       (or [?block :logseq.property/scheduled ?n] \
           [?block :logseq.property/deadline ?n]) \
       [(>= ?n ?start-time)] \
       [(<= ?n ?end-time)] \
       [?block :logseq.property/status ?status] \
       [?status :db/ident ?status-ident] \
       [(not= ?status-ident :logseq.property/status.done)] \
       [(not= ?status-ident :logseq.property/status.canceled)]]"
      ~inputs:
        [ Arg_scalar (Result_value (Common_util.value_of_ms start_time))
        ; Arg_scalar (Result_value (Common_util.value_of_ms end_time)) ]
  in
  let blocks =
    List.filter_map
      (function
        | [ Result_pull p ] -> Some (Ds_wire.transit_of_pulled p)
        | _ -> None)
      rows
  in
  group_by_page (List.map sort_by_order_recursive blocks)

(* :thread-api/get-date-scheduled-or-deadlines [repo start-time end-time]
   — cljs (when-let [conn ...] ...) returns nil without a conn. *)
let get_date_scheduled_or_deadlines_endpoint args =
  with_conn args (fun db ->
      let epoch_ms_arg i =
        match arg args i with
        | Some (Wire.Int n) -> Int64.of_int n
        | Some (Wire.Int64 n) -> n
        | Some w ->
            invalid_arg
              ("get-date-scheduled-or-deadlines: time arg must be epoch ms: "
               ^ Transit_codec.to_string w)
        | None -> invalid_arg "get-date-scheduled-or-deadlines: missing time arg"
      in
      pure
        (get_date_scheduled_or_deadlines db (epoch_ms_arg 1)
           (epoch_ms_arg 2)))

let () =
  Dispatcher.register "thread-api/get-date-scheduled-or-deadlines"
    get_date_scheduled_or_deadlines_endpoint

(* :thread-api/get-display-properties [repo {:keys [block opts
   show-empty-and-hidden-properties?]}] *)
let get_display_properties_endpoint args =
  let opts_v =
    match arg args 1 with
    | Some (Wire.Map _ as m) -> m
    | _ -> Wire.Nil
  in
  with_conn args (fun db ->
      match entity_of_arg db (Option.value ~default:Wire.Nil (Wire.get "block" opts_v)) with
      | None -> pure Wire.nil
      | Some block ->
          let opts = Wire.get "opts" opts_v in
          pure
            (Display_properties.display_properties db block
               ~gallery_view:(opt_bool opts "gallery-view?" ~default:false)
               ~page_title:(opt_bool opts "page-title?" ~default:false)
               ~sidebar_properties:(opt_bool opts "sidebar-properties?" ~default:false)
               ~tag_dialog:(opt_bool opts "tag-dialog?" ~default:false)
               ~publishing:(opt_bool opts "publishing?" ~default:false)
               ~state_hide_empty_properties:
                 (opt_bool opts "state-hide-empty-properties?" ~default:false)
               ~show_empty_and_hidden_properties:
                 (match Wire.get "show-empty-and-hidden-properties?" opts_v with
                  | Some v -> Clj_value.truthy (Ds_wire.value_of_transit v)
                  | None -> false)))

let () =
  Dispatcher.register "thread-api/get-display-properties"
    get_display_properties_endpoint

(* :thread-api/reorder-display-property [repo {:keys [block-id active-ident
   over-ident direction property-idents]}] *)
let reorder_display_property args =
  let repo = repo_arg args in
  let conn = Endpoint_transaction.require_conn repo in
  let opts_v =
    match arg args 1 with
    | Some (Wire.Map _ as m) -> m
    | _ -> Wire.Nil
  in
  let db = Datascript.db conn in
  let property_idents =
    match Wire.get "property-idents" opts_v with
    | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
    | _ -> []
  in
  let sorted_properties =
    Export_file.sort_properties
      (List.filter_map (entity_of_arg db) property_idents)
  in
  let normalize_tx_data =
    List.map Ds_wire.transit_of_value
      (Db_property.normalize_sorted_entities_block_order sorted_properties)
  in
  let direction =
    match Wire.get "direction" opts_v with
    | Some (Wire.Keyword d) | Some (Wire.String d) -> d
    | _ -> ""
  in
  let move_down = direction = "down" in
  let over =
    entity_of_arg db (Option.value ~default:Wire.Nil (Wire.get "over-ident" opts_v))
  in
  let active =
    entity_of_arg db (Option.value ~default:Wire.Nil (Wire.get "active-ident" opts_v))
  in
  let order_of_eid (e : entity option) =
    match e with
    | Some e -> Db_order.order_of e
    | None -> None
  in
  let over_order = order_of_eid over in
  let over_id =
    match over with Some e -> e.id | None -> -1
  in
  let new_order =
    if move_down then
      let next_order = Db_order.get_next_order db None over_id in
      Db_order.gen_key over_order next_order
    else
      let prev_order = Db_order.get_prev_order db None over_id in
      Db_order.gen_key prev_order over_order
  in
  let block_id =
    match Wire.get "block-id" opts_v with
    | Some (Wire.Int n) -> n
    | Some (Wire.Int64 n) -> Int64.to_int n
    | _ -> invalid_arg "reorder-display-property: missing block-id"
  in
  let active_uuid =
    match active with
    | Some e -> (
        match Ldb.value e "block/uuid" with
        | Some v -> Ds_wire.transit_of_value v
        | None -> Wire.Nil)
    | None -> Wire.Nil
  in
  let tx_data =
    normalize_tx_data
    @ [ Wire.Map
          [ kw "block/uuid", active_uuid
          ; kw "block/order", Wire.String new_order ]
      ; Outliner_blocks.block_with_updated_at
          (Wire.Map [ kw "db/id", Wire.Int block_id ]) ]
  in
  Worker_state.set_db_latest_tx_time repo;
  ignore
    (Db_transact.transact conn tx_data
       [ ("outliner-op", Keyword "save-block") ]);
  pure Wire.nil

let () =
  Dispatcher.register "thread-api/reorder-display-property"
    reorder_display_property
