(* frontend.worker.handler.block — :thread-api/get-blocks and the
   membership tree machinery it shares with renderer snapshots
   (direct-children-membership, open-children-tree, open-block-tree). *)

open Datascript

let kw s = Wire.Keyword s

let arg args i = List.nth_opt args i

let fail_render_read message data =
  raise (Dispatcher.Exn_info (message, data))

(* ---------------------------------------------------------------
   resolve-block-entity
   --------------------------------------------------------------- *)

let resolve_block_entity db (id_or_page_name : value) : entity option =
  match id_or_page_name with
  | Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
  | Int i -> entity db (Entity_id i)
  | Keyword k -> entity db (Ident k)
  | String s ->
      if Ldb.is_uuid_string s then
        entity db (Lookup_ref ("block/uuid", Uuid s))
      else
        Option.bind (Ldb.first_page_by_name db s) (Ldb.ent_of_id db)
  | _ -> None

let block_has_children (db : db) (block_id : entity_id) : bool =
  Option.is_some
    (Seq.uncons (datoms db Avet ~a:"block/parent" ~v:(Ref block_id) ()))

(* ---------------------------------------------------------------
   get-block-children
   --------------------------------------------------------------- *)

let block_children_limit = 100

let direct_child_blocks db (block_id : entity_id) ?(reverse = false)
    ?(include_property_block = false) () : entity list =
  let blocks =
    List.of_seq (datoms db Avet ~a:"block/parent" ~v:(Ref block_id) ())
    |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
    |> Ldb.sort_by_order
    |> fun l -> if reverse then List.rev l else l
  in
  List.filter
    (fun (c : entity) ->
      (include_property_block
       || Option.is_none
            (Ldb.value c "logseq.property/created-from-property"))
      && Option.is_none (Ldb.value c "block/closed-value-property"))
    blocks

(* (count result) >= limit -> [true result] means "large page" *)
let get_block_children db (block : entity) ~(all : bool)
    ~(include_collapsed_children : bool) ~(include_property_block : bool)
    : bool * entity list =
  let rec loop pending seen result =
    if (not all) && List.length result >= block_children_limit then
      (true, result)
    else
      match pending with
      | [] -> (false, result)
      | parent :: rest ->
          let expand =
            include_collapsed_children
            || not
                 (Ldb.truthy
                    (Endpoint_property.entity_direct_value db parent.id
                       "block/collapsed?"))
            || Option.is_some
                 (Endpoint_property.entity_direct_value db parent.id
                    "block/name")
          in
          let children =
            if expand then
              direct_child_blocks db parent.id
                ~include_property_block ()
              |> List.filter (fun (c : entity) ->
                     not (Hashtbl.mem seen c.id))
            else []
          in
          List.iter (fun (c : entity) -> Hashtbl.replace seen c.id ()) children;
          (* cljs pending is a stack: (into pending children) appends and
             peek pops the last child first *)
          loop (List.rev children @ rest) seen (result @ children)
  in
  let seen = Hashtbl.create 64 in
  Hashtbl.replace seen block.id ();
  let large_page, children_blocks = loop [ block ] seen [] in
  let children_blocks =
    List.filter (fun (c : entity) -> not (Ldb.recycled c)) children_blocks
  in
  let children =
    if large_page then
      direct_child_blocks db block.id ~include_property_block ()
      |> List.filter (fun (c : entity) -> not (Ldb.recycled c))
    else children_blocks
  in
  (large_page, children)

(* ---------------------------------------------------------------
   render data
   --------------------------------------------------------------- *)

(* block-property-keys minus block/tags empty *)
let plain_render_block db (block : entity) : bool =
  Display_properties.block_property_keys db block
  |> List.filter (fun k -> k <> "block/tags")
  |> ( = ) []

let block_positioned_properties_map db (block : entity) : Wire.t =
  Wire.Map
    (List.map
       (fun (position, idents) ->
         ( kw position
         , Wire.Array
             (List.filter_map
                (fun ident ->
                  match entity db (Ident ident) with
                  | Some p ->
                      Some (Endpoint_property.display_property_map db p)
                  | None -> None)
                idents) ))
       (Render_snapshot.block_positioned_property_idents_by_position db
          block.id))

let reaction_selector =
  "[:db/id :block/uuid :logseq.property.reaction/emoji-id \
   {:logseq.property/created-by-ref [:db/id :block/uuid :block/title]}]"

let block_reactions db (block_id : entity_id) : Wire.t =
  Wire.Array
    (List.of_seq
       (datoms db Avet ~a:"logseq.property.reaction/target"
          ~v:(Ref block_id) ())
    |> List.map (fun (d : datom) ->
           match pull_string db reaction_selector (Entity_id d.e) with
           | Some p -> Ds_wire.transit_of_pulled p
           | None -> Wire.Nil))

let empty_render_display_properties =
  Wire.Map
    [ (kw "full-properties", Wire.Array [])
    ; (kw "hidden-properties", Wire.Array [])
    ; (kw "description-property", Wire.Nil)
    ; (kw "class-properties-property", Wire.Nil) ]

let display_properties_empty_ctx db (block : entity) : Wire.t =
  Display_properties.display_properties db block ~gallery_view:false
    ~page_title:false ~sidebar_properties:false ~tag_dialog:false
    ~publishing:false ~state_hide_empty_properties:false
    ~show_empty_and_hidden_properties:false

let assoc_base_render_data db (block : entity) (block_map : Wire.t) : Wire.t =
  let m =
    Plain_value.assoc "block.temp/reactions" (block_reactions db block.id)
      (Wire.as_map block_map)
  in
  let m =
    if plain_render_block db block then
      m
      |> Plain_value.assoc "block.temp/positioned-properties"
           (Wire.Map [])
      |> Plain_value.assoc "block.temp/display-properties"
           empty_render_display_properties
    else m
  in
  Wire.Map m

let assoc_render_property_data db (block : entity) (block_map : Wire.t) :
    Wire.t =
  let plain = plain_render_block db block in
  Wire.Map
    (Wire.as_map block_map
     |> Plain_value.assoc "block.temp/positioned-properties"
          (if plain then Wire.Map []
           else block_positioned_properties_map db block)
     |> Plain_value.assoc "block.temp/display-properties"
          (if plain then empty_render_display_properties
           else display_properties_empty_ctx db block)
     |> Plain_value.assoc "block.temp/reactions"
          (block_reactions db block.id))

let bidirectional_properties_wire (groups : Ldb.bidirectional_group list) :
    Wire.t =
  Wire.Array
    (List.map
       (fun (g : Ldb.bidirectional_group) ->
         Wire.Map
           [ (kw "title", Wire.String g.title)
           ; (kw "class", Ds_wire.entity_map_wire g.class_)
           ; ( kw "entities"
             , Wire.List
                 (List.map
                    (fun (e : entity) ->
                      Wire.Tagged
                        ("datascript/Entity", Ds_wire.entity_map_wire e))
                    g.entities) ) ])
       groups)

let assoc_root_render_data db (block : entity) (block_map : Wire.t) : Wire.t =
  Wire.Map
    (Wire.as_map (assoc_render_property_data db block block_map)
     |> Plain_value.assoc "block.temp/page-display-properties"
          (Display_properties.display_properties db block
             ~gallery_view:false ~page_title:true
             ~sidebar_properties:false ~tag_dialog:false ~publishing:false
             ~state_hide_empty_properties:false
             ~show_empty_and_hidden_properties:false)
     |> Plain_value.assoc "block.temp/bidirectional-properties"
          (bidirectional_properties_wire
             (Ldb.get_bidirectional_properties db block.id)))

(* cljs merge for wire maps — later keys win *)
let wire_merge (a : (Wire.t * Wire.t) list) (b : (Wire.t * Wire.t) list) =
  b @ List.filter (fun (k, _) -> not (List.mem_assoc k b)) a

(* ---------------------------------------------------------------
   get-block-and-children
   --------------------------------------------------------------- *)

let block_refs_count_dispatch db (block_id : entity_id) : int option =
  Render_snapshot.block_refs_count db block_id

type gb_opts =
  { gb_all : bool
  ; gb_children : bool
  ; gb_properties : string list
  ; gb_render_data : bool option (* false | true | nil *)
  ; gb_root_render_data : bool
  ; gb_include_collapsed_children : bool
  ; gb_include_property_block : bool
  }

let bool_opt w = match w with Some (Wire.Bool b) -> Some b | _ -> None

let get_block_and_children db (id_or_page_name : value) (opts : gb_opts) :
    Wire.t =
  match resolve_block_entity db id_or_page_name with
  | None -> Wire.Nil
  | Some block ->
      let block_refs_count =
        List.mem "block.temp/refs-count" opts.gb_properties
      in
      let children =
        if opts.gb_children then
          if opts.gb_include_property_block then
            match Ldb.value block "block/uuid" with
            | Some (Uuid u) ->
                (match Ldb.get_block_and_children db ~include_property_block:true u with
                 | _ :: rest ->
                     Some
                       (List.filter
                          (fun (c : entity) ->
                            (not (Ldb.recycled c))
                            && Option.is_none
                                 (Ldb.value c "block/closed-value-property"))
                          rest)
                 | [] -> Some [])
            | _ -> Some []
          else
            Some
              (snd
                 (get_block_children db block ~all:opts.gb_all
                    ~include_collapsed_children:
                      opts.gb_include_collapsed_children
                    ~include_property_block:opts.gb_include_property_block))
        else None
      in
      let children' =
        Option.map
          (List.map (fun (child : entity) ->
               let child_map_base =
                 Plain_value.entity_forward_map db child
                   ~include_derived:(not opts.gb_include_property_block)
               in
               let child_map =
                 match opts.gb_render_data with
                 | Some true ->
                     assoc_render_property_data db child child_map_base
                 | Some false -> assoc_base_render_data db child child_map_base
                 | None -> child_map_base
               in
               if opts.gb_include_property_block then child_map
               else
                 Wire.Map
                   (child_map |> Wire.as_map
                    |> Plain_value.assoc "block.temp/property-keys"
                         (Wire.Array
                            (List.map kw
                               (Display_properties.block_property_keys db
                                  child)))
                    |> Plain_value.assoc "block.temp/has-children?"
                         (Wire.Bool (block_has_children db child.id)))))
          children
      in
      let block_map_base =
        let direct =
          Endpoint_property.entity_direct_map db block
            [ "db/id"; "db/ident"; "block/uuid"; "block/name"; "block/tags" ]
        in
        let forward =
          Plain_value.entity_forward_map db block
            ~properties:opts.gb_properties
            ~include_derived:(not opts.gb_include_property_block)
        in
        let merged =
          Wire.Map
            (wire_merge (Wire.as_map direct) (Wire.as_map forward))
        in
        let merged =
          if
            (not opts.gb_include_property_block)
            && (opts.gb_render_data = Some true
                || opts.gb_properties = [])
          then
            Wire.Map
              (Plain_value.assoc "block/properties"
                 (Wire.Map
                    (Display_properties.display_properties_for_block db
                       block))
                 (Wire.as_map merged))
          else merged
        in
        if opts.gb_include_property_block then merged
        else
          Wire.Map
            (Plain_value.assoc "block.temp/property-keys"
               (Wire.Array
                  (List.map kw
                     (Display_properties.block_property_keys db block)))
               (Wire.as_map merged))
      in
      let block_map =
        if opts.gb_root_render_data then
          assoc_root_render_data db block block_map_base
        else
          match opts.gb_render_data with
          | Some true -> assoc_render_property_data db block block_map_base
          | Some false -> assoc_base_render_data db block block_map_base
          | None -> block_map_base
      in
      let block' =
        let m =
          Wire.as_map block_map
          |> Plain_value.assoc "block/tags"
               (match Plain_value.map_get "block/tags" (Wire.as_map block_map) with
                | Some v -> v
                | None -> Wire.Array [])
          |> Plain_value.assoc "block/collapsed?"
               (Wire.Bool
                  (match
                     Plain_value.map_get "block/collapsed?"
                       (Wire.as_map block_map)
                   with
                   | Some Wire.Nil | Some (Wire.Bool false) | None -> false
                   | _ -> true))
        in
        let m =
          if block_refs_count then
            Plain_value.assoc "block.temp/refs-count"
              (Wire.Int (Db_view.get_block_refs_count db block.id))
              m
          else m
        in
        let m =
          if not opts.gb_include_property_block then
            Plain_value.assoc "block.temp/has-children?"
              (Wire.Bool (block_has_children db block.id))
              m
          else m
        in
        Wire.Map m
      in
      Wire.Map
        ((kw "block", block')
         ::
         (match children' with
          | Some cs -> [ (kw "children", Wire.List cs) ]
          | None -> []))

(* ---------------------------------------------------------------
   get-blocks-response
   --------------------------------------------------------------- *)

let uuid_eid_of_string db (u : string) : entity_id option =
  match
    Seq.uncons (datoms db Avet ~a:"block/uuid" ~v:(Uuid u) ())
  with
  | Some (d, _) -> Some d.e
  | None -> None

let comment_thread_block_uuids db (block_uuids : string list) : string list =
  let id_uuid =
    List.filter_map
      (fun u ->
        match uuid_eid_of_string db u with
        | Some eid -> Some (eid, u)
        | None -> None)
      block_uuids
  in
  if id_uuid = [] then []
  else
    List.concat_map
      (fun (block_id, uuid_str) ->
        List.of_seq
          (datoms db Avet ~a:"logseq.property.comments/blocks"
             ~v:(Ref block_id) ())
        |> List.filter_map (fun (d : datom) ->
               match entity db (Entity_id d.e) with
               | Some comments_area ->
                   let tagged =
                     List.mem "logseq.class/Comments"
                       (List.filter_map Ldb.ident_of
                          (Ldb.ref_ents comments_area "block/tags"))
                   in
                   let not_parent =
                     match Ldb.ref_ent comments_area "block/parent" with
                     | Some p -> p.id <> block_id
                     | None -> true
                   in
                   let live =
                     not
                       (Ldb.truthy
                          (Ldb.value comments_area
                             "logseq.property/deleted-at"))
                   in
                   if tagged && not_parent && live then Some uuid_str
                   else None
               | None -> None))
      id_uuid

let conflict_wire (c : Sync_client_op.sync_conflict) : Wire.t =
  Wire.Map
    [ (kw "id", Wire.Int c.id)
    ; (kw "block-uuid", Wire.Uuid c.block_uuid)
    ; (kw "attr", Wire.Keyword c.attr)
    ; (kw "value", Wire.String c.value)
    ; ( kw "remote-t"
      , match c.remote_t with Some t -> Wire.Int t | None -> Wire.Nil )
    ; (kw "created-at", Wire.Int c.created_at) ]

let remove_nils (kvs : (Wire.t * Wire.t) list) =
  List.filter (fun (_, v) -> v <> Wire.Nil) kvs

(* common-util/remove-nils-non-nested on a wire map *)
let sanitize_block_result (result : Wire.t) : Wire.t =
  match result with
  | Wire.Map kvs ->
      Wire.Map
        (List.map
           (fun (k, v) ->
             match k, v with
             | Wire.Keyword "block", Wire.Map bm -> (k, Wire.Map (remove_nils bm))
             | Wire.Keyword "children", Wire.Array cs ->
                 ( k
                 , Wire.Array
                     (List.map
                        (fun c ->
                          match c with
                          | Wire.Map cm -> Wire.Map (remove_nils cm)
                          | _ -> c)
                        cs) )
             | _ -> (k, v))
           kvs)
  | _ -> result

(* children ++ [block] *)
let result_blocks (result : Wire.t) : Wire.t list =
  match result with
  | Wire.Map kvs ->
      let children =
        match Plain_value.map_get "children" kvs with
        | Some (Wire.Array cs) -> cs
        | _ -> []
      in
      (match Plain_value.map_get "block" kvs with
       | Some b -> children @ [ b ]
       | None -> children)
  | _ -> []

let assoc_block_metadata db conflicts_by_block commented_block_uuids
    now_ms render_data (block : Wire.t) : Wire.t =
  let m = Wire.as_map block in
  let block_id =
    match Plain_value.map_get "db/id" m with
    | Some (Wire.Int i) -> i
    | _ -> -1
  in
  let block_uuid =
    match Plain_value.map_get "block/uuid" m with
    | Some (Wire.Uuid u) -> Some u
    | _ -> None
  in
  let m =
    m
    |> Plain_value.assoc "block.temp/refs-count"
         (match block_refs_count_dispatch db block_id with
          | Some n -> Wire.Int n
          | None -> Wire.Nil)
    |> Plain_value.assoc "block.temp/comment-thread-present?"
         (Wire.Bool
            (match block_uuid with
             | Some u -> List.mem u commented_block_uuids
             | None -> false))
    |> Plain_value.assoc "block.temp/sync-conflicts"
         (Wire.Array
            (match block_uuid with
             | Some u -> (
                 match List.assoc_opt u conflicts_by_block with
                 | Some cs -> List.map conflict_wire cs
                 | None -> [])
             | None -> []))
  in
  let m =
    if render_data then
      Plain_value.assoc "block.temp/task-spent-time"
        (match
           Endpoint_query.task_spent_time_impl db block_id now_ms
         with
         | Wire.Nil -> Wire.Array []
         | w -> w)
        m
    else m
  in
  Wire.Map m

let assoc_result_block_metadata (result : Wire.t) db conflicts_by_block
    commented_block_uuids now_ms render_data root_render_data : Wire.t =
  match result with
  | Wire.Map kvs ->
      Wire.Map
        (List.map
           (fun (k, v) ->
             match k, v with
             | Wire.Keyword "block", (Wire.Map _ as bm) ->
                 ( k
                 , assoc_block_metadata db conflicts_by_block
                     commented_block_uuids now_ms
                     (render_data || root_render_data)
                     bm )
             | Wire.Keyword "children", Wire.Array cs ->
                 ( k
                 , Wire.Array
                     (List.map
                        (assoc_block_metadata db conflicts_by_block
                           commented_block_uuids now_ms render_data)
                        cs) )
             | _ -> (k, v))
           kvs)
  | _ -> result

let wire_bool k m =
  match Wire.get k m with Some (Wire.Bool b) -> b | _ -> false

let opts_of_wire (opts : Wire.t) : gb_opts =
  let props =
    match Wire.get "properties" opts with
    | Some (Wire.Array xs) | Some (Wire.List xs) | Some (Wire.Set xs) ->
        List.filter_map
          (fun w -> match w with Wire.Keyword s -> Some s | _ -> None)
          xs
    | _ -> []
  in
  { gb_all = wire_bool "all?" opts
  ; gb_children = wire_bool "children?" opts
  ; gb_properties = props
  ; gb_render_data = bool_opt (Wire.get "render-data?" opts)
  ; gb_root_render_data = wire_bool "root-render-data?" opts
  ; gb_include_collapsed_children =
      wire_bool "include-collapsed-children?" opts
  ; gb_include_property_block = wire_bool "include-property-block?" opts
  }

let get_blocks_response repo (requests : Wire.t) : Wire.t option =
  match Worker_state.datascript_conn repo with
  | None -> None
  | Some conn ->
      let db = Datascript.db conn in
      let request_list =
        match requests with
        | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
        | _ -> []
      in
      let results =
        List.map
          (fun req ->
            let id = Wire.get "id" req in
            let opts = Wire.get "opts" req in
            let id' =
              match id with
              | Some (Wire.String s) when Ldb.is_uuid_string s ->
                  Uuid s
              | Some w -> Ds_wire.value_of_transit w
              | None -> Nil
            in
            let result =
              get_block_and_children db id'
                (match opts with
                 | Some o -> opts_of_wire o
                 | None -> opts_of_wire (Wire.Map []))
            in
            let result =
              (* cljs (assoc result :id id) — on a nil result this is
                 {:id id}, not {:id id :block nil} *)
              match result, id with
              | Wire.Map kvs, Some idw -> Wire.Map ((kw "id", idw) :: kvs)
              | m, Some idw when m = Wire.Nil ->
                  Wire.Map [ (kw "id", idw) ]
              | m, _ -> m
            in
            (req, result))
          request_list
      in
      let metadata_blocks =
        List.concat_map
          (fun (req, result) ->
            match Wire.get "opts" req with
            | Some o when wire_bool "block-metadata?" o ->
                result_blocks result
            | _ -> [])
          results
      in
      let commented_block_uuids =
        if metadata_blocks <> [] then
          metadata_blocks
          |> List.filter_map (fun b ->
                 match Plain_value.map_get "block/uuid" (Wire.as_map b) with
                 | Some (Wire.Uuid u) -> Some u
                 | Some (Wire.String u) -> Some u
                 | _ -> None)
          |> comment_thread_block_uuids db
        else []
      in
      let conflicts_by_block =
        if metadata_blocks <> [] then
          let tbl = Hashtbl.create 15 in
          List.iter
            (fun (c : Sync_client_op.sync_conflict) ->
               match Hashtbl.find_opt tbl c.block_uuid with
               | Some cs -> Hashtbl.replace tbl c.block_uuid (cs @ [ c ])
               | None -> Hashtbl.replace tbl c.block_uuid [ c ])
            (Sync_client_op.get_all_sync_conflicts repo);
          tbl
        else Hashtbl.create 0
      in
      let now_ms = Clock.now_ms () in
      Wire.Array
        (List.map
           (fun (req, result) ->
             let result =
               match Wire.get "opts" req with
               | Some o when wire_bool "block-metadata?" o ->
                   assoc_result_block_metadata result db
                     (Hashtbl.fold (fun k v acc -> (k, v) :: acc)
                        conflicts_by_block [])
                     commented_block_uuids now_ms
                     (wire_bool "render-data?" o)
                     (wire_bool "root-render-data?" o)
               | _ -> result
             in
             Plain_value.with_explicit_ref_fields_recursive
               (sanitize_block_result result))
           results)
      |> Option.some

(* :thread-api/get-blocks [repo requests] *)
let get_blocks args =
  let repo =
    match arg args 0 with
    | Some (Wire.String s) -> s
    | _ -> invalid_arg "first arg must be repo name"
  in
  let requests = Option.value (arg args 1) ~default:(Wire.List []) in
  Db_worker_effect.pure
    (match get_blocks_response repo requests with
     | Some r -> r
     | None -> Wire.nil)

let () = Dispatcher.register "thread-api/get-blocks" get_blocks

(* ---------------------------------------------------------------
   membership machinery (shared with the render-resource engine)
   --------------------------------------------------------------- *)

let membership_row_attrs =
  [ "block/uuid"; "block/order"; "block/collapsed?";
    "block/closed-value-property"; "logseq.property/created-from-property";
    "logseq.property/deleted-at" ]

let membership_row_attr_map db (child_id : entity_id) : (attr * value) list =
  List.of_seq (datoms db Eavt ~e:child_id ())
  |> List.filter_map (fun (d : datom) ->
         if List.mem d.a membership_row_attrs then Some (d.a, d.v)
         else None)

let recycled_chain db (entity_id : entity_id) : bool =
  let rec loop eid seen =
    if List.mem eid seen then false
    else if
      Option.is_some
        (Render_snapshot.eavt_scalar db eid "logseq.property/deleted-at")
    then true
    else
      match
        Render_snapshot.eavt_scalar db eid "block/parent"
      with
      | Some (Ref pid) | Some (Int pid) -> loop pid (eid :: seen)
      | _ -> false
  in
  loop entity_id []

type membership_child =
  { mc_id : entity_id
  ; mc_uuid : string
  ; mc_order : string
  ; mc_collapsed : bool
  }

let membership_row db (parent_uuid : string) (parent_recycled : bool)
    (child_id : entity_id) : membership_child option =
  let attrs = membership_row_attr_map db child_id in
  let has a = List.mem_assoc a attrs in
  if
    parent_recycled || has "logseq.property/deleted-at"
    || has "block/closed-value-property"
    || has "logseq.property/created-from-property"
  then None
  else
    let child_uuid = List.assoc_opt "block/uuid" attrs in
    let order = List.assoc_opt "block/order" attrs in
    (match child_uuid with
     | Some (Uuid u) -> (
         match order with
         | Some (String o) ->
             Some
               { mc_id = child_id
               ; mc_uuid = u
               ; mc_order = o
               ; mc_collapsed =
                   (match List.assoc_opt "block/collapsed?" attrs with
                    | Some (Bool b) -> b
                    | _ -> false)
               }
         | _ ->
             fail_render_read "Invalid direct-child order"
               [ (kw "parent-uuid", Wire.Uuid parent_uuid)
               ; (kw "block-uuid", Wire.Uuid u)
               ; ( kw "block-order"
                 , Option.value order ~default:Nil
                   |> Ds_wire.transit_of_value ) ])
     | _ ->
         fail_render_read "Invalid direct-child UUID"
           [ (kw "parent-uuid", Wire.Uuid parent_uuid)
           ; ( kw "block-uuid"
             , Option.value child_uuid ~default:Nil
               |> Ds_wire.transit_of_value ) ])

let resolve_parent_id db (parent_uuid : string) : entity_id =
  match
    Seq.uncons (datoms db Avet ~a:"block/uuid" ~v:(Uuid parent_uuid) ())
  with
  | Some (d, _) -> d.e
  | None ->
      fail_render_read "Missing direct-children parent"
        [ (kw "parent-uuid", Wire.Uuid parent_uuid) ]

let parent_membership db (parent_uuid : string) (parent_id : entity_id)
    (parent_recycled : bool) : int * membership_child list =
  let parent_tx_id = Render_snapshot.block_revision db parent_id in
  if parent_tx_id < 0 then
    fail_render_read "Invalid direct-children parent transaction ID"
      [ (kw "parent-uuid", Wire.Uuid parent_uuid)
      ; (kw "block-tx-id", Wire.Int parent_tx_id) ];
  ( parent_tx_id
  , List.of_seq (datoms db Avet ~a:"block/parent" ~v:(Ref parent_id) ())
    |> List.filter_map (fun (d : datom) ->
           membership_row db parent_uuid parent_recycled d.e)
    |> List.stable_sort (fun a b -> String.compare a.mc_order b.mc_order)
  )

let items_wire (rows : membership_child list) : Wire.t =
  Wire.Array
    (List.map
       (fun r -> Wire.Array [ Wire.Uuid r.mc_uuid; Wire.String r.mc_order ])
       rows)

let direct_children_membership db (parent_uuid : string) : Wire.t =
  let parent_id = resolve_parent_id db parent_uuid in
  let parent_tx_id, rows =
    parent_membership db parent_uuid parent_id
      (recycled_chain db parent_id)
  in
  Wire.Map
    [ (kw "basis-rev", Wire.Int (Render_snapshot.render_basis_rev db))
    ; (kw "parent-tx-id", Wire.Int parent_tx_id)
    ; (kw "items", items_wire rows) ]

(* open-children-tree — {uuid {:parent-tx-id :items}} *)
let open_children_tree db (root_uuid : string) ?(node_limit : int option)
    () : (string * (int * membership_child list)) list =
  let root_id = resolve_parent_id db root_uuid in
  let remaining0 = Option.value node_limit ~default:max_int in
  let rec loop pending seen remaining children =
    match pending with
    | (parent_id, parent_uuid, parent_recycled) :: rest when remaining > 0 ->
        if Hashtbl.mem seen parent_uuid then
          loop rest seen remaining children
        else
          let parent_tx_id, rows =
            parent_membership db parent_uuid parent_id parent_recycled
          in
          (* cljs (into pending open-children): open-children built from
             (rseq rows) then consed onto the pending list, so the stack
             pops children in document order before later siblings *)
          let open_children =
            List.filter_map
              (fun r ->
                if r.mc_collapsed then None
                else Some (r.mc_id, r.mc_uuid, false))
              rows
          in
          Hashtbl.replace seen parent_uuid ();
          loop (open_children @ rest) seen (remaining - 1)
            ((parent_uuid, (parent_tx_id, rows)) :: children)
    | _ -> children
  in
  loop
    [ (root_id, root_uuid, recycled_chain db root_id) ]
    (Hashtbl.create 63) remaining0 []

(* document-order-uuids — first `limit` uuids in render order *)
let document_order_uuids (children : (string * (int * membership_child list)) list)
    (root_uuid : string) (limit : int) : string list =
  let items_of u =
    match List.assoc_opt u children with
    | Some (_, rows) -> List.map (fun r -> r.mc_uuid) rows
    | None -> []
  in
  let rec loop pending n result =
    match pending with
    | [] -> result
    | uuid :: rest ->
        if n <= 0 then result
        else loop (items_of uuid @ rest) (n - 1) (result @ [ uuid ])
  in
  loop [ root_uuid ] limit []

(* open-block-tree — {:parent-tx-id :items :blocks :children} *)
let open_block_tree db (root_uuid : string) : Wire.t =
  let children = open_children_tree db root_uuid () in
  let block_uuids =
    List.sort_uniq String.compare
      (root_uuid
       :: List.concat_map
            (fun (_, (_, rows)) -> List.map (fun r -> r.mc_uuid) rows)
            children)
  in
  let canonical =
    Render_snapshot.canonical_blocks db
      (List.map (fun u -> Wire.Uuid u) block_uuids)
  in
  let blocks =
    match canonical with
    | Wire.Map kvs -> (
        match Plain_value.map_get "blocks" kvs with
        | Some (Wire.Map bm) ->
            Wire.Map
              (List.filter
                 (fun (k, _) ->
                   match k with
                   | Wire.Uuid u -> List.mem u block_uuids
                   | _ -> false)
                 bm)
        | _ -> Wire.Map [])
    | _ -> Wire.Map []
  in
  let root_membership =
    match List.assoc_opt root_uuid children with
    | Some (tx_id, rows) ->
        [ (kw "parent-tx-id", Wire.Int tx_id); (kw "items", items_wire rows) ]
    | None -> []
  in
  Wire.Map
    (root_membership
     @ [ (kw "blocks", blocks)
       ; ( kw "children"
         , Wire.Map
             (List.map
                (fun (u, (tx_id, rows)) ->
                  ( Wire.Uuid u
                  , Wire.Map
                      [ (kw "parent-tx-id", Wire.Int tx_id)
                      ; (kw "items", items_wire rows) ] ))
                children) ) ])
