(* logseq.outliner.pipeline (subset) — ref rebuilding fns used by
   outliner/core. The worker transact pipeline (tx-report processing)
   lives elsewhere; this file owns only block-content-refs and
   db-rebuild-block-refs (+ helpers). *)

open Datascript

(* ref->eid — ref: entity map (:db/id / :block/uuid), lookup-vec, int. *)
let ref_to_id db (v : value) : entity_id option =
  match v with
  | Ref id -> Some id
  | Int id -> Some id
  | Ref_to r -> Option.map (fun (e : entity) -> e.id) (entity db r)
  | Keyword k -> Option.map (fun (e : entity) -> e.id) (entity db (Ident k))
  | Map kvs -> (
      let get a =
        List.find_map
          (fun (k, x) -> if k = Keyword a || k = String a then Some x else None)
          kvs
      in
      match get "db/id" with
      | Some (Int id) -> Some id
      | _ -> (
          match get "block/uuid" with
          | Some (Uuid u) ->
              Option.map
                (fun (e : entity) -> e.id)
                (entity db (Lookup_ref ("block/uuid", Uuid u)))
          | _ -> None))
  | _ -> None

(* db-content/get-matched-ids — distinct [[uuid]] ids in content *)
let get_matched_ids (content : string) : string list =
  let rec go pos acc =
    match Regexp.exec ~pos Db_content.id_ref_re content with
    | None -> List.rev acc
    | Some m ->
        let id = match m.groups.(1) with Some s -> s | None -> "" in
        go m.last (id :: acc)
  in
  go 0 [] |> List.sort_uniq String.compare

(* block-content-refs — ref block ids from title content *)
let block_content_refs (db : db) (block : entity) : entity_id list =
  let content =
    match Ldb.string_value block "block/raw-title" with
    | Some s -> Some s
    | None -> Ldb.string_value block "block/title"
  in
  match content with
  | Some c ->
      get_matched_ids c
      |> List.filter_map (fun id ->
          Option.map
            (fun (e : entity) -> e.id)
            (entity db (Lookup_ref ("block/uuid", Uuid id))))
  | None -> []

(* get-journal-day-from-long — journal entity for an epoch-ms value *)
let get_journal_day_from_long (db : db) (v : value) : entity_id option =
  let ms =
    match v with
    | Int n -> Some (Int64.of_int n)
    | Instant f -> Some (Int64.of_int f)
    | _ -> None
  in
  match ms with
  | None -> None
  | Some ms ->
      let day = Date_time_util.ms_to_journal_day ms in
      List.of_seq (datoms db Avet ~a:"block/journal-day" ~v:(Int day) ())
      |> List.find_map (fun (d : datom) -> Some d.e)

(* private-built-in-props — built-in properties without :public? schema *)
let private_built_in_props =
  [ "logseq.property/type"; "logseq.property/view-context"
  ; "logseq.property/ui-position"; "logseq.property/classes"
  ; "logseq.property/value"; "block/parent"; "block/order"; "block/page"
  ; "block/refs"; "block/link"; "block/title"; "block/closed-value-property"
  ; "block/journal-day"; "block/created-at"; "block/updated-at"
  ; "logseq.property.node/display-type"; "logseq.property.code/lang"
  ; "logseq.property/default-value"; "logseq.property/scalar-default-value"
  ; "logseq.property/background-color"; "logseq.property/heading"
  ; "logseq.property/created-from-property"; "logseq.property/asset"
  ; "logseq.property/ls-type"; "logseq.property.pdf/hl-type"
  ; "logseq.property.pdf/hl-color"; "logseq.property.pdf/hl-page"
  ; "logseq.property.pdf/hl-image"; "logseq.property.pdf/hl-value"
  ; "logseq.property/order-list-type"
  ; "logseq.property.linked-references/includes"
  ; "logseq.property.linked-references/excludes"
  ; "logseq.property.comments/blocks"
  ; "logseq.property.journal/title-format"
  ; "logseq.property/choice-checkbox-state"; "logseq.property/choice-classes"
  ; "logseq.property/choice-exclusions"
  ; "logseq.property/checkbox-display-properties"
  ; "logseq.property.repeat/recur-unit"; "logseq.property.repeat/repeat-type"
  ; "logseq.property.repeat/temporal-property"
  ; "logseq.property.repeat/checked-property"; "logseq.property.view/type"
  ; "logseq.property.view/feature-type"
  ; "logseq.property.view/group-by-property"
  ; "logseq.property.view/gallery-asset-property"
  ; "logseq.property.view/gallery-display-properties"
  ; "logseq.property.view/gallery-card-size"
  ; "logseq.property.view/gallery-card-width"
  ; "logseq.property.view/gallery-card-height"
  ; "logseq.property.view/sort-groups-by-property"
  ; "logseq.property.table/sorting"; "logseq.property.table/filters"
  ; "logseq.property.table/hidden-columns"
  ; "logseq.property.table/ordered-columns"
  ; "logseq.property.table/sized-columns"
  ; "logseq.property.table/pinned-columns"; "logseq.property/view-for"
  ; "logseq.property.asset/type"; "logseq.property.asset/external-file-name"
  ; "logseq.property.asset/size"; "logseq.property.asset/width"
  ; "logseq.property.asset/height"; "logseq.property.asset/checksum"
  ; "logseq.property.asset/last-visit-page"
  ; "logseq.property.asset/remote-metadata"
  ; "logseq.property.asset/resize-metadata"; "logseq.property.asset/align"
  ; "logseq.property.fsrs/due"; "logseq.property.fsrs/state"
  ; "logseq.property.history/block"; "logseq.property.history/property"
  ; "logseq.property.history/ref-value"
  ; "logseq.property.history/scalar-value"; "logseq.property/created-by-ref"
  ; "logseq.property/deleted-at"; "logseq.property/deleted-by-ref"
  ; "logseq.property.recycle/original-parent"
  ; "logseq.property.recycle/original-page"
  ; "logseq.property.recycle/original-order"
  ; "logseq.property.reaction/emoji-id"; "logseq.property.reaction/target"
  ; "logseq.property/used-template"; "logseq.property.sync/large-title-object" ]

(* non-ref-properties — never produce :block/refs *)
let non_ref_properties =
  private_built_in_props
  @ [ "logseq.property/query"; "logseq.property.publish/published-url"
    ; "logseq.property/exclude-from-graph-view" ]

let is_non_ref_property (k : attr) : bool = List.mem k non_ref_properties

(* db-property/property? — user-visible property ident *)
let user_visible_property (k : attr) : bool =
  match Db_property.namespace_of k with
  | Some ns ->
      List.mem ns Db_property.logseq_property_namespaces
      || Db_property.user_property_namespace ns
      || List.mem k Db_property.public_db_attribute_properties
  | None -> List.mem k Db_property.public_db_attribute_properties

(* entity's property entries: ident -> values (refs materialized as Ref). *)
let properties_of (e : entity) : (attr * value list) list =
  entity_attrs e
  |> List.filter_map (fun (a, tv) ->
      if not (user_visible_property a) then None
      else
        let ref_of (te : tx_entity) =
          match te.db_id with Some (Entity_id id) -> Some (Ref id) | _ -> None
        in
        let vs =
          match tv with
          | One_value v -> [ v ]
          | Many_values vs -> vs
          | One_entity te -> List.filter_map ref_of [ te ]
          | Many_entities tes -> List.filter_map ref_of tes
        in
        Some (a, vs))

(* page-or-object?-helper *)
let page_or_object_helper db (v : value) : bool =
  match ref_to_id db v with
  | Some id -> (
      match entity db (Entity_id id) with
      | Some e ->
          (Ldb.is_page e || Ldb.is_object e)
          && not
               (Option.is_some
                  (Ldb.value e "logseq.property/created-from-property"))
      | None -> false)
  | None -> false

(* build-journal-refs-for-datetime-properties *)
let build_journal_refs_for_datetime_properties (db : db)
    (property_ent : entity option) (v : value) : entity_id list =
  let allowed =
    match property_ent with
    | Some p -> (
        match Ldb.value p "logseq.property/type" with
        | Some (Keyword "datetime") -> (
            match Ldb.ident_of p with
            | Some ident ->
                if Db_property.internal_property ident then
                  ident = "logseq.property/scheduled"
                  || ident = "logseq.property/deadline"
                else not (Db_property.plugin_property ident)
            | None -> false)
        | _ -> false)
    | None -> false
  in
  if not allowed then []
  else
    match v with
    | Vector vs | List vs | Set vs ->
        List.filter_map (get_journal_day_from_long db) vs
    | v -> (
        match get_journal_day_from_long db v with
        | Some id -> [ id ]
        | None -> [])

(* block-refs — all ref ids for a block: tags + link + property key/value
   refs + content refs, dedup'd, minus self and alias refs. *)
let block_refs (db : db) (block : entity) (properties : (attr * value list) list)
    (property_entity : attr -> entity option) : entity_id list =
  let block_db_id = block.id in
  let alias_ids = Ldb.ref_ids block "block/alias" in
  let property_key_refs =
    List.filter_map
      (fun (ident, _) ->
        Option.map (fun (e : entity) -> e.id) (property_entity ident))
      properties
  in
  let property_value_refs =
    List.concat_map
      (fun (property, vs) ->
        if vs <> [] && List.for_all (page_or_object_helper db) vs then
          List.filter_map (ref_to_id db) vs
        else
          let prop_ent = property_entity property in
          List.concat_map
            (build_journal_refs_for_datetime_properties db prop_ent)
            vs)
      properties
  in
  let content_refs = block_content_refs db block in
  let link_refs =
    match Ldb.value block "block/link" with
    | Some v -> List.filter_map (ref_to_id db) [ v ]
    | None -> []
  in
  let tag_refs = List.filter_map (ref_to_id db) (Ldb.values block "block/tags") in
  tag_refs @ link_refs @ property_key_refs @ property_value_refs
  @ content_refs
  |> List.filter (fun id -> id <> block_db_id && not (List.mem id alias_ids))
  |> List.fold_left
      (fun acc id -> if List.mem id acc then acc else acc @ [ id ])
      []

(* db-rebuild-block-refs — rebuilt :block/refs ids for a block *)
let db_rebuild_block_refs (db : db) (block : entity)
    ?(page_or_object : (value -> bool) option) () : entity_id list =
  let properties =
    properties_of block
    |> List.filter (fun (k, _) -> not (is_non_ref_property k))
  in
  let _page_or_object =
    Option.value page_or_object ~default:(page_or_object_helper db)
  in
  block_refs db block properties (fun ident -> entity db (Ident ident))

(* outliner-pipeline/filter-deleted-blocks — retracted :block/uuid datoms
   as (eid, uuid) pairs. *)
let filter_deleted_blocks (datoms : datom list) : (entity_id * string) list =
  List.filter_map
    (fun (d : datom) ->
      if d.a = "block/uuid" && not d.added then
        match d.v with
        | Uuid u -> Some (d.e, u)
        | _ -> None
      else None)
    datoms
