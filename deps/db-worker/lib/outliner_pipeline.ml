(* logseq.outliner.pipeline (subset) — ref rebuilding fns used by
   outliner/core. The worker transact pipeline (tx-report processing)
   lives elsewhere; this file owns only block-content-refs and
   db-rebuild-block-refs (+ helpers). *)

open Datascript

(* ref->eid — ref: entity map (:db/id / :block/uuid), lookup-vec, int. *)
let ref_to_id db (v : value) : entity_id option =
  match v with
  | Ref id -> Some id
  | Int64 id -> Datascript.Util.int64_to_int id
  | Ref_to r -> Option.map (fun (e : entity) -> e.id) (entity db r)
  | Keyword k -> Option.map (fun (e : entity) -> e.id) (entity db (Ident k))
  | Map kvs -> (
      let get a =
        List.find_map
          (fun (k, x) -> if k = Keyword a || k = String a then Some x else None)
          kvs
      in
      match get "db/id" with
      | Some (Int64 id) -> Datascript.Util.int64_to_int id
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
    | Int64 n -> Some n
    | Float f -> Some (Int64.of_float f)
    | Instant f -> Some f
    | _ -> None
  in
  match ms with
  | None -> None
  | Some ms ->
      let day = Date_time_util.ms_to_journal_day ms in
      List.of_seq (datoms db Avet ~a:"block/journal-day" ~v:(Int64 (Int64.of_int day)) ())
      |> List.find_map (fun (d : datom) -> Some d.e)

(* cljs private-built-in-props:
   (set (keep (fn [[k v]] (when-not (get-in v [:schema :public?]) k))
              db-property/built-in-properties)) *)
let private_built_in_props : attr list =
  List.filter_map
    (fun (p : Db_property.built_in_property) ->
       match List.assoc_opt "public?" p.bip_schema with
       | Some (Bool true) -> None
       | _ -> Some p.bip_ident)
    Db_property.built_in_property_specs

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

(* entity's property entries: ident -> values (refs materialized as Ref).
   Forward attrs only — cljs (into {} entity) doesn't enumerate :_reverse
   attrs, so backrefs like :logseq.property.linked-references/_includes
   must not count as block properties here. *)
let properties_of (e : entity) : (attr * value list) list =
  entity_attrs e
  |> List.filter_map (fun (a, tv) ->
      if is_reverse_ref a || not (user_visible_property a) then None
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

(* page-or-object?-helper — cljs requires (de/entity? v): only a
   materialized entity ref counts; bare eids/keywords/maps/lookup-refs are
   not entities. *)
let page_or_object_helper db (v : value) : bool =
  match v with
  | Ref id | Ref_to (Entity_id id) -> (
      match entity db (Entity_id id) with
      | Some e ->
          (Ldb.is_page e || Ldb.is_object e)
          && not
               (Option.is_some
                  (Ldb.value e "logseq.property/created-from-property"))
      | None -> false)
  | _ -> false

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
    (page_or_object : value -> bool)
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
        if vs <> [] && List.for_all page_or_object vs then
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
  block_refs db block properties
    (Option.value page_or_object ~default:(page_or_object_helper db))
    (fun ident -> entity db (Ident ident))

(* db-rebuild-block-refs-fn — bulk-pass ref builder over the immutable
   db: memoized entity lookups, ref-producing property entities resolved
   once, per-eid properties precomputed from aevt scans, memoized
   page-or-object?. cljs materializes entities for ref-typed values;
   OCaml keeps Ref values — page_or_object resolves them identically. *)
let db_rebuild_block_refs_fn (db : db) : entity -> entity_id list =
  let memo_entity =
    let cache : (entity_ref, entity option) Hashtbl.t = Hashtbl.create 64 in
    fun r ->
      match Hashtbl.find_opt cache r with
      | Some e -> e
      | None ->
          let e = entity db r in
          Hashtbl.replace cache r e;
          e
  in
  let property_entities : (attr, entity) Hashtbl.t = Hashtbl.create 64 in
  Seq.iter
    (fun (d : datom) ->
      match d.v with
      | Keyword ident
        when user_visible_property ident && not (is_non_ref_property ident)
        -> (
          match memo_entity (Entity_id d.e) with
          | Some e -> Hashtbl.replace property_entities ident e
          | None -> ())
      | _ -> ())
    (Datascript.datoms db Avet ~a:"db/ident" ());
  let properties_by_id : (entity_id, (attr * value list) list) Hashtbl.t =
    Hashtbl.create 256
  in
  Hashtbl.iter
    (fun ident _ ->
      Seq.iter
        (fun (d : datom) ->
          let entry =
            match Hashtbl.find_opt properties_by_id d.e with
            | Some ps -> ps
            | None -> []
          in
          let vs =
            match List.assoc_opt ident entry with
            | Some vs -> vs @ [ d.v ]
            | None -> [ d.v ]
          in
          Hashtbl.replace properties_by_id d.e
            ((ident, vs) :: List.remove_assoc ident entry))
        (Datascript.datoms db Aevt ~a:ident ()))
    property_entities;
  let memo_page_or_object =
    let cache : (value, bool) Hashtbl.t = Hashtbl.create 256 in
    fun v ->
      match Hashtbl.find_opt cache v with
      | Some b -> b
      | None ->
          let b = page_or_object_helper db v in
          Hashtbl.replace cache v b;
          b
  in
  fun (block : entity) ->
    let properties =
      match Hashtbl.find_opt properties_by_id block.id with
      | Some ps -> ps
      | None -> []
    in
    block_refs db block properties memo_page_or_object
      (fun ident -> Hashtbl.find_opt property_entities ident)

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

(* outliner-pipeline/rebuild-block-refs-tx — per-block retract+set of
   :block/refs for blocks still present in db-after. *)
let rebuild_block_refs_tx (tx_report : tx_report) (blocks : entity list)
    : tx_op list =
  List.concat_map
    (fun (block : entity) ->
       match entity tx_report.db_after (Entity_id block.id) with
       | None -> []
       | Some _ ->
           let refs = db_rebuild_block_refs tx_report.db_after block () in
           if refs = [] then []
           else
             [ RetractAttr (Entity_id block.id, "block/refs")
             ; Entity
                 { db_id = Some (Entity_id block.id)
                 ; attrs =
                     [ ( "block/refs"
                       , Many_values
                           (List.map (fun id -> Ref id) refs) ) ]
                 } ])
    blocks

(* outliner-pipeline/transact-new-db-graph-refs — rebuild :block/refs
   for blocks in a fresh/imported graph tx-report. *)
let transact_new_db_graph_refs (conn : conn) (tx_report : tx_report)
    : tx_report option =
  let blocks, _pages = Ds_report.get_blocks_and_pages tx_report in
  let refs_tx =
    if blocks = [] then [] else rebuild_block_refs_tx tx_report blocks
  in
  if refs_tx = [] then None
  else
    Some
      (Db_tx.transact conn refs_tx
         ~tx_meta:
           (("transact-new-graph-refs?", Bool true) :: tx_report.tx_meta))
