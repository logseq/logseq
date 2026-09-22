(* Port of logseq.db.frontend.validate (deps/db/.../frontend/validate.cljs):
   validate-tx-report, validate-db, graph-counts, validate-local-db!.

   Entities are validated as ent-maps ((attr * value) lists wrapped as
   Map values); schemas live in Db_malli_schema + Malli. *)

open Datascript
open Db_malli_schema

let ctx_of (db : db) : Malli.vctx = { db }

let schema_for ~closed : Malli.schema =
  if closed then Malli.closed_schema Db_malli_schema.db_schema
  else Db_malli_schema.db_schema

let valid_db ~closed ctx (ents : value) : bool =
  Malli.valid ctx (schema_for ~closed) ents

let explain_db ~closed ctx (ents : value) : Malli.error list =
  Malli.explain ctx (schema_for ~closed) ents

let map_value_of_ent_map (m : ent_map) : value =
  (* cljs stores :logseq.property/type datoms as keywords; the OCaml db
     convention keeps them as String, so normalize back here *)
  Map
    (List.map
       (fun (a, v) ->
         match a, v with
         | "logseq.property/type", String s -> Keyword a, Keyword s
         | _ -> Keyword a, v)
       m)

type tx_entity_error =
  { entity_map : value (* :entity-map — Map value *)
  ; errors_humanized : value (* me/humanize result *) }

(* validate-tx-report — returns (valid?, errors) *)
let validate_tx_report ~(closed_schema : bool) (db_after : db)
    (tx_data : datom list) : bool * tx_entity_error list =
  Db_malli_schema.skip_strict_url_validate := true;
  Fun.protect
    ~finally:(fun () -> Db_malli_schema.skip_strict_url_validate := false)
    (fun () ->
      let seen = Hashtbl.create 16 in
      let changed_ids =
        List.filter
          (fun (d : datom) ->
            if Hashtbl.mem seen d.e then false
            else (Hashtbl.add seen d.e (); true))
          tx_data
        |> List.map (fun (d : datom) -> d.e)
      in
      let tx_datoms =
        List.concat_map
          (fun id -> List.of_seq (datoms db_after Eavt ~e:id ()))
          changed_ids
      in
      let entity_fn (k : attr) : ent_map option =
        match Ldb.ent_of_ref db_after (Ident k) with
        | Some e ->
            (match Ldb.value e "db/cardinality" with
             | Some v -> Some [ ("db/cardinality", v) ]
             | None -> Some [])
        | None -> None
      in
      let ent_maps_star =
        List.map
          (fun (eid, m) -> m @ [ ("db/id", Int eid) ])
          (datoms_to_entity_maps ~entity_fn tx_datoms)
      in
      let ent_maps = update_properties_in_ents db_after ent_maps_star in
      let ctx = ctx_of db_after in
      let invalid =
        List.filter
          (fun m ->
            let m' = List.remove_assoc "db/id" m in
            not
              (valid_db ~closed:closed_schema ctx
                 (Vector [ map_value_of_ent_map m' ])))
          ent_maps
      in
      let errors =
        List.map
          (fun m ->
            let m' =
              List.map
                (fun (a, v) ->
                  if a = "block/properties" then
                    match v with
                    | Vector tuples ->
                        ( a
                        , Vector
                            (List.map
                               (fun t ->
                                 match t with
                                 | Vector (p :: rest) ->
                                     let ident =
                                       match
                                         Db_malli_schema.vget "db/ident" p
                                       with
                                       | Some (Keyword i) -> Keyword i
                                       | _ -> Nil
                                     in
                                     Vector (ident :: rest)
                                 | other -> other)
                               tuples) )
                    | _ -> (a, v)
                  else (a, v))
                m
            in
            let errs =
              explain_db ~closed:closed_schema ctx
                (Vector [ map_value_of_ent_map (List.remove_assoc "db/id" m) ])
            in
            { entity_map = map_value_of_ent_map m'
            ; errors_humanized = Malli.humanize errs })
          invalid
      in
      (errors = [], errors))

type grouped_error =
  { ge_entity : value (* ent Map, :block/page expanded for debugging *)
  ; ge_dispatch_key : string
  ; ge_errors : Malli.error list (* grouped errs; :in keeps entity idx *)
  }

(* group-errors-by-entity *)
let group_errors_by_entity (db : db) (ent_maps : ent_map list)
    (errors : Malli.error list) : grouped_error list =
  let arr = Array.of_list ent_maps in
  let groups = Hashtbl.create 32 in
  let order = ref [] in
  List.iter
    (fun (e : Malli.error) ->
      let key =
        match e.e_in with
        | Int i :: _ -> i
        | _ -> -1
      in
      if not (Hashtbl.mem groups key) then
        (Hashtbl.add groups key []; order := key :: !order)
      else ();
      Hashtbl.replace groups key (e :: Hashtbl.find groups key))
    errors;
  List.rev_map
    (fun idx ->
      let errs = List.rev (Hashtbl.find groups idx) in
      let ent =
        if idx >= 0 && idx < Array.length arr then arr.(idx) else []
      in
      let ent' =
        match Db_malli_schema.mget "block/page" ent with
        | Some (Ref pid | Int pid) ->
            let page_ent = Ldb.ent_of_id db pid in
            let page_map =
              match page_ent with
              | Some pe ->
                  let base =
                    List.filter_map
                      (fun a -> Option.map (fun v -> (Keyword a, v)) (Ldb.value pe a))
                      [ "block/name"; "db/id"; "block/created-at" ]
                  in
                  let tags =
                    List.filter_map
                      (fun t -> Option.map (fun e -> Keyword e) (Ldb.ident_of t))
                      (Ldb.ref_ents pe "block/tags")
                  in
                  if tags <> [] then base @ [ (Keyword "block/tags", Vector tags) ]
                  else base
              | None -> []
            in
            List.map
              (fun (a, v) ->
                if a = "block/page" then (a, Map page_map) else (a, v))
              ent
        | _ -> ent
      in
      let dk =
        Db_malli_schema.entity_dispatch_key db (List.remove_assoc "db/id" ent)
      in
      { ge_entity = map_value_of_ent_map ent'
      ; ge_dispatch_key = dk
      ; ge_errors = errs })
    !order

type db_validation_result =
  { datom_count : int
  ; entities : ent_map list
  ; errors : grouped_error list (* grouped + humanized in worker layer *)
  }

(* validate-db *)
let validate_db (db : db) : db_validation_result =
  let datoms_list = List.of_seq (datoms db Eavt ()) in
  let ent_maps_star = datoms_to_entities datoms_list in
  let ent_maps =
    update_properties_in_ents db
      (List.map
         (fun m ->
           List.filter
             (fun (a, _) ->
               a <> "block.temp/load-status" && a <> "block.temp/has-children?")
             m)
         ent_maps_star)
  in
  let ctx = ctx_of db in
  let errors =
    explain_db ~closed:true ctx
      (Vector
         (List.map
            (fun m -> map_value_of_ent_map (List.remove_assoc "db/id" m))
            ent_maps))
  in
  { datom_count = List.length datoms_list
  ; entities = ent_maps_star
  ; errors =
      (match errors with
       | [] -> []
       | errs -> group_errors_by_entity db ent_maps errs) }

type graph_counts =
  { entities : int
  ; pages : int
  ; blocks : int
  ; classes : int
  ; properties : int
  ; objects : int
  ; property_pairs : int
  ; datoms : int }

(* graph-counts *)
let graph_counts (db : db) (entities : ent_map list) (datom_count : int)
    : graph_counts =
  let ident_eid ident =
    match Ldb.ent_of_ref db (Ident ident) with
    | Some e -> e.id
    | None -> -1
  in
  let classes_count =
    List.length
      (List.of_seq
         (datoms db Avet ~a:"block/tags" ~v:(Ref (ident_eid "logseq.class/Tag")) ()))
  in
  let properties_count =
    List.length
      (List.of_seq
         (datoms db Avet ~a:"block/tags"
            ~v:(Ref (ident_eid "logseq.class/Property")) ()))
  in
  let tags_count =
    List.length (List.of_seq (datoms db Avet ~a:"block/tags" ()))
  in
  { entities = List.length entities
  ; pages =
      List.length
        (List.filter (fun m -> Db_malli_schema.mget "block/name" m <> None)
           entities)
  ; blocks =
      List.length
        (List.filter (fun m -> Db_malli_schema.mget "block/page" m <> None)
           entities)
  ; classes = classes_count
  ; properties = properties_count
  ; objects = tags_count - classes_count - properties_count
  ; property_pairs =
      List.length
        (List.concat_map
           (fun m ->
             List.filter
               (fun (a, _) -> a <> "block/tags")
               (Db_property.properties m))
           entities)
  ; datoms = datom_count }

(* validate-local-db! — returns errors grouped by entity with humanized
   maps (each {attr -> msgs}) *)
let validate_local_db ?(open_schema = false) (db : db) : grouped_error list =
  let datoms_list = List.of_seq (datoms db Eavt ()) in
  let ent_maps_star = datoms_to_entities datoms_list in
  let ent_maps =
    update_properties_in_ents db
      (List.map
         (fun m ->
           List.filter
             (fun (a, _) ->
               a <> "block.temp/load-status" && a <> "block.temp/has-children?")
             m)
         ent_maps_star)
  in
  let ctx = ctx_of db in
  Db_malli_schema.closed_values_validate := true;
  Fun.protect
    ~finally:(fun () -> Db_malli_schema.closed_values_validate := false)
    (fun () ->
      let errs =
        explain_db ~closed:(not open_schema) ctx
          (Vector
             (List.map
                (fun m -> map_value_of_ent_map (List.remove_assoc "db/id" m))
                ent_maps))
      in
      match errs with
      | [] -> []
      | errs -> group_errors_by_entity db ent_maps errs)
