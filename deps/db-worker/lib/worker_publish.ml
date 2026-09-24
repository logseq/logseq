(* Faithful port of src/main/frontend/worker/publish.cljs —
   build-publish-page-payload: collects a page's blocks, refs, tags,
   search blocks and datoms for the publish pipeline.

   init() wiring: none — called by Endpoint_publish. *)

open Datascript

module IntSet = Set.Make (Int)

let publish_entity_title (e : entity) : string =
  match Ldb.string_value e "block/title" with
  | Some t -> t
  | None -> "Untitled"

let page_tags (e : entity) : value list =
  Ldb.ref_ents e "block/tags"
  |> List.filter (fun (t : entity) ->
       Ldb.ident_of t <> Some "logseq.class/Page")
  |> List.map (fun (t : entity) ->
       Map
         [ ( Keyword "tag_uuid"
           , Option.value ~default:Nil (Ldb.value t "block/uuid") )
         ; ( Keyword "tag_title"
           , Option.value ~default:Nil (Ldb.value t "block/title") ) ])

let comments_class_ident = "logseq.class/Comments"
let comment_class_ident = "logseq.class/Comment"

let class_instance db (ident : string) (block : entity) : bool =
  match Datascript.entity db (Ident ident) with
  | Some cls -> Db_class.class_instance cls block
  | None -> false

let comments_area db (block : entity) : bool =
  class_instance db comments_class_ident block

let comment_block db (block : entity) : bool =
  class_instance db comment_class_ident block
  || (match Ldb.ref_ent block "block/parent" with
      | Some p -> comments_area db p
      | None -> false)

let publishable_block db (block : entity) : bool =
  not (comments_area db block || comment_block db block)

(* cljs publish-ref-eid — entity id when positive *)
let publish_ref_eid (e : entity) : entity_id option =
  if e.id > 0 then Some e.id else None

let uuid_str_of (e : entity) : string option =
  match Ldb.value e "block/uuid" with
  | Some (Uuid u) | Some (String u) -> Some u
  | _ -> None

let dedup xs =
  let seen = Hashtbl.create 11 in
  List.filter
    (fun x ->
      if Hashtbl.mem seen x then false
      else begin
        Hashtbl.add seen x ();
        true
      end)
    xs

let publish_refs_from_blocks (db : db) (blocks : entity list)
    (page_entity : entity) (graph_uuid : string) : value list =
  let page_uuid = uuid_str_of page_entity in
  let page_title = publish_entity_title page_entity in
  let is_page = Ldb.is_page page_entity in
  List.concat_map
    (fun (block : entity) ->
      match uuid_str_of block with
      | Some block_uuid_str when (not is_page) || Some block_uuid_str <> page_uuid
        ->
          let block_content =
            match Ldb.string_value block "block/title" with
            | Some t -> t
            | None -> Option.value ~default:"" (Ldb.string_value block "block/name")
          in
          let block_format =
            match Ldb.value block "block/format" with
            | Some (Keyword s) -> s
            | Some (String s) -> s
            | _ -> "markdown"
          in
          let targets =
            Ldb.ref_ents block "block/refs"
            |> List.filter_map publish_ref_eid
            |> List.filter_map (fun eid -> Datascript.entity db (Entity_id eid))
            |> List.filter_map uuid_str_of
            |> dedup
          in
          if targets = [] then []
          else
            List.map
              (fun target ->
                Map
                  [ Keyword "graph_uuid", String graph_uuid
                  ; Keyword "target_page_uuid", String target
                  ; ( Keyword "source_page_uuid"
                    , String (Option.value ~default:"" page_uuid) )
                  ; Keyword "source_page_title", String page_title
                  ; Keyword "source_block_uuid", String block_uuid_str
                  ; Keyword "source_block_content", String block_content
                  ; Keyword "source_block_format", String block_format
                  ; ( Keyword "updated_at"
                    , Instant (Date_time_util.time_ms ()) ) ])
              targets
      | _ -> [])
    blocks

(* cljs collect-publish-blocks *)
let collect_publish_blocks db (e : entity) : entity list =
  if Ldb.is_page e then Ldb.ref_ents e "block/_page"
  else
    match uuid_str_of e with
    | Some u -> Ldb.get_block_and_children db u
    | None -> []

let publish_search_max_length = 4096

let block_page_eid (block : entity) : entity_id option =
  match Ldb.value block "block/page" with
  | Some (Ref id) -> Some id
  | _ -> None

(* cljs block-search-content *)
let block_search_content (block : entity) : string option =
  let raw =
    match Ldb.string_value block "block/title" with
    | Some t -> t
    | None -> Option.value ~default:"" (Ldb.string_value block "block/name")
  in
  let raw = Unicode.trim raw in
  if raw = "" then None
  else begin
    (* cljs (recur-replace-uuid-in-block-title (assoc block :block/title
       raw-content)) — uuid-replace sees the trimmed title *)
    let content =
      match Db_content.recur_replace_uuid_in_block_title ~title:raw block with
      | Some s -> s
      | None -> raw
    in
    (* cljs (count content)/(subs content 0 n) are UTF-16 units, not bytes *)
    let content =
      Search_index.utf16_truncate ~max_units:publish_search_max_length content
    in
    Some (Unicode.trim content)
  end

let collect_search_blocks (blocks : entity list) (page_eid : entity_id)
    (page_uuid : string option) : value list =
  List.filter_map
    (fun (block : entity) ->
      if
        block_page_eid block = Some page_eid
        && block.id <> page_eid
        && Ldb.value block "logseq.property/created-from-property" = None
      then
        match uuid_str_of block with
        | Some block_uuid -> (
            match block_search_content block with
            | Some content ->
                Some
                  (Map
                     [ ( Keyword "page_uuid"
                       , String (Option.value ~default:"" page_uuid) )
                     ; Keyword "block_uuid", String block_uuid
                     ; Keyword "block_content", String content ])
            | None -> None)
        | None -> None
      else None)
    blocks

(* cljs collect-embedded-blocks — bfs over :block/link targets *)
let collect_embedded_blocks db (blocks : entity list) : entity list =
  let linked_eids =
    blocks
    |> List.filter_map (fun b -> Ldb.ref_ent b "block/link")
    |> List.filter_map publish_ref_eid
    |> dedup
  in
  let visited = Hashtbl.create 11 in
  let rec loop queue acc =
    match queue with
    | [] -> List.rev acc
    | eid :: rest ->
        if Hashtbl.mem visited eid then loop rest acc
        else begin
          Hashtbl.add visited eid ();
          match Datascript.entity db (Entity_id eid) with
          | Some ent -> (
              match uuid_str_of ent with
              | Some uuid ->
                  let children =
                    Ldb.get_block_and_children db uuid
                    |> List.filter (publishable_block db)
                  in
                  let child_links =
                    List.filter_map
                      (fun c -> Ldb.ref_ent c "block/link")
                      children
                    |> List.filter_map publish_ref_eid
                  in
                  loop (rest @ child_links) (List.rev children @ acc)
              | None -> loop rest acc)
          | None -> loop rest acc
        end
  in
  loop linked_eids []

(* cljs publish-collect-page-eids *)
let publish_collect_page_eids db (e : entity) : entity list * int list =
  let page_id = e.id in
  let blocks =
    List.filter (publishable_block db) (collect_publish_blocks db e)
  in
  let embedded_blocks = collect_embedded_blocks db blocks in
  let blocks = blocks @ embedded_blocks in
  let block_eids = List.map (fun (b : entity) -> b.id) blocks in
  let ref_eids =
    List.concat_map
      (fun (b : entity) -> List.filter_map publish_ref_eid (Ldb.ref_ents b "block/refs"))
      blocks
  in
  let tag_eids =
    List.concat_map
      (fun (b : entity) -> List.filter_map publish_ref_eid (Ldb.ref_ents b "block/tags"))
      blocks
  in
  let page_tag_eids = List.filter_map publish_ref_eid (Ldb.ref_ents e "block/tags") in
  let page_eids = List.filter_map block_page_eid blocks in
  let property_eids =
    List.concat_map
      (fun (ent : entity) ->
        List.concat_map
          (fun (k, tv) ->
            let property = Datascript.entity db (Ident k) in
            let pid =
              match property with
              | Some p -> [ p.id ]
              | None -> []
            in
            let value_eids =
              match property with
              | Some p
                when Ldb.value p "db/valueType" = Some (Keyword "db.type.ref")
                -> (
                  let many =
                    Ldb.value p "db/cardinality"
                    = Some (Keyword "db.cardinality/many")
                  in
                  match many, tv with
                  | true, Many_entities tes ->
                      List.filter_map (fun te -> te.db_id) tes
                      |> List.filter_map (function
                           | Entity_id i -> Some i
                           | _ -> None)
                  | false, One_entity te -> (
                      match te.db_id with
                      | Some (Entity_id i) -> [ i ]
                      | _ -> [])
                  | _ -> [])
              | _ -> []
            in
            pid @ value_eids)
          (Db_property.properties_of_entity ent))
      (e :: blocks)
  in
  let eids =
    page_id :: block_eids @ ref_eids @ tag_eids @ page_tag_eids @ page_eids
    @ property_eids
    |> dedup
  in
  (* cljs (->> (concat ...) (remove nil?) distinct) — first-occurrence
     order, not sorted *)
  (blocks, eids)

(* cljs normalize-block-publish-datoms *)
let normalize_block_publish_datoms (datoms : datom list) (block_eids : IntSet.t)
    (root_eid : entity_id) : datom list =
  List.map
    (fun (d : datom) ->
      if IntSet.mem d.e block_eids && d.a = "block/page" then
        { d with v = Ref root_eid }
      else d)
    datoms

let graph_uuid_of (db : db) : string option =
  match Ldb.get_graph_rtc_uuid db with
  | Some (Uuid u) | Some (String u) -> Some u
  | _ -> (
      match Ldb.get_graph_local_uuid db with
      | Some (Uuid u) | Some (String u) -> Some u
      | _ -> None)

(* cljs build-publish-page-payload — the :page field is a touched
   entity->map (transit #datascript/Entity), so the payload is built at
   Wire level with Ds_wire.entity_map_wire. *)
let build_publish_page_payload db (e : entity) : Wire.t =
  let blocks, eids = publish_collect_page_eids db e in
  let graph_uuid = graph_uuid_of db in
  let refs =
    match graph_uuid with
    | Some g -> publish_refs_from_blocks db blocks e g
    | None -> []
  in
  let tags = page_tags e in
  let search_blocks = collect_search_blocks blocks e.id (uuid_str_of e) in
  let raw_datoms =
    List.concat_map
      (fun eid -> List.of_seq (datoms db Eavt ~e:eid ()))
      eids
    |> List.filter (fun (d : datom) ->
         d.a <> "block/tx-id"
         && d.a <> "logseq.property.user/email")
  in
  let datoms =
    if Ldb.is_page e then raw_datoms
    else
      normalize_block_publish_datoms raw_datoms
        (IntSet.of_list (List.map (fun (b : entity) -> b.id) blocks))
        e.id
  in
  Wire.Map
    [ Wire.Keyword "page", Ds_wire.entity_map_wire e
    ; ( Wire.Keyword "page-uuid"
      , Ds_wire.transit_of_value
          (Option.value ~default:Nil (Ldb.value e "block/uuid")) )
    ; Wire.Keyword "page-title", Wire.String (publish_entity_title e)
    ; ( Wire.Keyword "graph-uuid"
      , match graph_uuid with
        | Some g -> Wire.String g
        | None -> Wire.Nil )
    ; Wire.Keyword "block-count", Wire.Int (List.length blocks)
    ; ( Wire.Keyword "schema-version"
      , Wire.String (Db_schema.schema_version_to_string Db_schema.version) )
    ; Wire.Keyword "refs", Wire.Array (List.map Ds_wire.transit_of_value refs)
    ; ( Wire.Keyword "page-tags"
      , Wire.Array (List.map Ds_wire.transit_of_value tags) )
    ; ( Wire.Keyword "blocks"
      , Wire.Array (List.map Ds_wire.transit_of_value search_blocks) )
    ; ( Wire.Keyword "datoms"
      , Wire.Array
          (List.map
             (fun (d : datom) ->
               Wire.Array
                 [ Wire.Int d.e; Wire.Keyword d.a
                 ; Ds_wire.transit_of_value d.v; Wire.Int d.tx
                 ; Wire.Bool d.added ])
             datoms) ) ]
