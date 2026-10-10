(* Faithful port of deps/publishing/src/logseq/publishing/db.cljs —
   the db filtering fns behind build-publishing-html.

   Queries keep the same EDN text and rule inputs as cljs
   (rules/extract-rules over :property, rules/rules :alias).

   init() wiring: none — called by Publishing_html. *)

open Datascript

module IntSet = Set.Make (Int)

let prop_rules () : query_arg =
  Db_query_dsl.parse_rules_input (Db_query_dsl.extract_rules [ "property" ])

let result_eids rows : entity_id list =
  List.concat_map
    (List.filter_map (function Result_entity n -> Some n | _ -> None))
    rows

(* entity-plus/lookup-kv-then-entity :block/properties — the
   :block/properties attr when present, else the computed
   {ident -> value} map of attrs whose key is a db-property/property?. *)
let property_idents (e : entity) : string list =
  match Ldb.value e "block/properties" with
  | Some (Map kvs) ->
      List.filter_map
        (fun (k, _) ->
          match k with
          | Keyword s -> Some s
          | String s -> Some s
          | _ -> None)
        kvs
  | _ ->
      List.filter_map
        (fun (k, _) -> if Db_property.property k then Some k else None)
        (entity_attrs e)

(* cljs get-db-public-pages — public pages plus directly related tag and
   property pages. Returns the full (concat ...) list like cljs. *)
let get_db_public_pages (db : db) : entity_id list =
  let pages =
    q_string db
      ~inputs:[ prop_rules () ]
      "[:find [?p ...]
        :in $ %
        :where (property ?p :logseq.property/publishing-public? true) [?p :block/name]]"
    |> result_eids |> IntSet.of_list
  in
  let page_ents =
    List.filter_map
      (fun id -> Datascript.entity db (Entity_id id))
      (IntSet.elements pages)
  in
  let tag_pages =
    List.concat_map
      (fun (e : entity) ->
        List.map (fun (t : entity) -> t.id) (Ldb.ref_ents e "block/tags"))
      page_ents
  in
  let tag_pages =
    match tag_pages with
    | [] -> []
    | _ :: _ ->
        (* built-in property needs to be public to display tags *)
        tag_pages
        @ (match Datascript.entity db (Ident "block/tags") with
           | Some t -> [ t.id ]
           | None -> [])
  in
  let property_pages =
    List.concat_map
      (fun (e : entity) ->
        List.filter_map
          (fun ident ->
            match Datascript.entity db (Ident ident) with
            | Some p -> Some p.id
            | None -> None)
          (property_idents e))
      page_ents
  in
  IntSet.elements pages @ tag_pages @ property_pages

let get_db_public_false_pages (db : db) : IntSet.t =
  q_string db
    ~inputs:[ prop_rules () ]
    "[:find [?p ...]
      :in $ %
      :where (property ?p :logseq.property/publishing-public? false) [?p :block/name]]"
  |> result_eids |> IntSet.of_list

(* cljs rules/rules :alias — not part of db-query-dsl-rules *)
let alias_rules () : query_arg =
  Arg_rules
    (Parser.parse_rules
       (Parser.read_edn
          "[[(alias ?e2 ?e1) [?e2 :block/alias ?e1]] \
           [(alias ?e2 ?e1) [?e1 :block/alias ?e2]]]"))

let get_aliases_for_page_ids (db : db) (page_ids : entity_id list) : IntSet.t =
  if page_ids = [] then IntSet.empty
  else
    q_string db
      ~inputs:
        [ Arg_scalar (Result_value (Set (List.map (fun i -> Int64 (Int64.of_int i)) page_ids)))
        ; alias_rules () ]
      "[:find [?e ...]
        :in $ ?pages %
        :where
        [?page :block/name]
        [(contains? ?pages ?page)]
        (alias ?page ?e)]"
    |> result_eids |> IntSet.of_list

(* cljs str on a keyword keeps the colon; asset types are strings in
   practice. *)
let cljs_str = function
  | String s -> s
  | Keyword s -> ":" ^ s
  | Uuid s -> s
  | Int64 n -> Int64.to_string n
  | Bool b -> if b then "true" else "false"
  | _ -> "nil"

let get_db_assets (db : db) : string list =
  match Datascript.entity db (Ident "logseq.class/Asset") with
  | None -> []
  | Some asset_cls ->
      List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref asset_cls.id) ())
      |> List.filter_map (fun (d : datom) ->
           match Ldb.ent_of_id db d.e with
           | Some e -> (
               match
                 ( Ldb.value e "block/uuid"
                 , Ldb.value e "logseq.property.asset/type" )
               with
               | Some (Uuid u), Some tv -> Some (u ^ "." ^ cljs_str tv)
               | Some (String u), Some tv -> Some (u ^ "." ^ cljs_str tv)
               | _ -> None)
           | None -> None)

let add_missing_built_in_block_timestamps (db : db) : db =
  let tx_ops =
    List.of_seq
      (datoms db Avet ~a:"logseq.property/built-in?" ~v:(Bool true) ())
    |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
    |> List.concat_map (fun (e : entity) ->
         let created_at =
           match Ldb.value e "block/created-at" with
           | Some v -> v
           | None -> Option.value ~default:(Int64 0L) (Ldb.value e "block/updated-at")
         in
         let updated_at =
           match Ldb.value e "block/updated-at" with
           | Some v -> v
           | None -> created_at
         in
         (if Ldb.value e "block/created-at" = None then
            [ Entity
                { db_id = Some (Entity_id e.id)
                ; attrs = [ "block/created-at", One_value created_at ] } ]
          else [])
         @
         (if Ldb.value e "block/updated-at" = None then
            [ Entity
                { db_id = Some (Entity_id e.id)
                ; attrs = [ "block/updated-at", One_value updated_at ] } ]
          else []))
  in
  if tx_ops = [] then db else Datascript.db_with tx_ops db

let eid_of_v = function Ref n -> n | _ -> -1

(* cljs clean-export! — all pages public unless publishing-public? false *)
let clean_export (db : db) : db * string list =
  let non_public = get_db_public_false_pages db in
  let filtered =
    Datascript.filter db (fun _db (d : datom) ->
      let ns =
        match String.index_opt d.a '/' with
        | Some i -> String.sub d.a 0 i
        | None -> ""
      in
      ns <> "file"
      && not (IntSet.mem d.e non_public)
      && not (IntSet.mem (eid_of_v d.v) non_public && d.a = "block/page"))
  in
  let datoms' = List.of_seq (datoms filtered Eavt ()) in
  let assets = get_db_assets filtered in
  let db' =
    Datascript.db (conn_from_datoms ~schema:(Datascript.schema db) datoms')
  in
  (add_missing_built_in_block_timestamps db', assets)

let get_properties_on_nodes (db : db) (nodes : IntSet.t) : IntSet.t =
  q_string db
    ~inputs:
      [ Arg_collection
          (List.map (fun i -> Result_entity i) (IntSet.elements nodes)) ]
    "[:find [?p ...]
      :in $ [?node ...]
      :where
      [?p :db/ident ?a]
      [?node ?a ?v]
      [(missing? $ ?a :logseq.property/built-in?)]]"
  |> result_eids |> IntSet.of_list

let get_property_values_on_nodes (db : db) (nodes : IntSet.t) : IntSet.t =
  q_string db
    ~inputs:
      [ Arg_collection
          (List.map (fun i -> Result_entity i) (IntSet.elements nodes)) ]
    "[:find [?pv ...]
      :in $ [?node ...]
      :where
      [?p :db/ident ?a]
      [?p :db/valueType :db.type/ref]
      [?node ?a ?pv]
      [(missing? $ ?p :logseq.property/built-in?)]]"
  |> result_eids |> IntSet.of_list

let get_db_public_ents (db : db) (public_pages : IntSet.t) : IntSet.t =
  let page_blocks =
    List.of_seq (datoms db Avet ~a:"block/page" ())
    |> List.filter_map (fun (d : datom) ->
         match d.v with
         | Ref v when IntSet.mem v public_pages -> Some d.e
         | _ -> None)
    |> IntSet.of_list
  in
  let public_nodes = IntSet.union public_pages page_blocks in
  let eavt = List.of_seq (datoms db Eavt ()) in
  let tags =
    eavt
    |> List.filter_map (fun (d : datom) ->
         if IntSet.mem d.e public_nodes && d.a = "block/tags" then
           match d.v with
           | Ref v -> Some v
           | _ -> None
         else None)
    |> IntSet.of_list
  in
  let properties = get_properties_on_nodes db public_nodes in
  let property_values = get_property_values_on_nodes db public_nodes in
  let internal_ents =
    IntSet.union
      (eavt
       |> List.filter_map (fun (d : datom) ->
            match d.a, d.v with
            | "db/ident", Keyword s when Db_schema.internal_ident s -> Some d.e
            | "db/ident", String s when Db_schema.internal_ident s -> Some d.e
            | _ -> None)
       |> IntSet.of_list)
      (List.of_seq
         (datoms db Avet ~a:"logseq.property/built-in?" ~v:(Bool true) ())
       |> List.map (fun (d : datom) -> d.e)
       |> IntSet.of_list)
  in
  List.fold_left IntSet.union IntSet.empty
    [ internal_ents; public_pages; page_blocks; properties; property_values
    ; tags ]

(* cljs filter-only-public-pages-and-blocks — all pages private unless
   publishing-public? true *)
let filter_only_public_pages_and_blocks (db : db) : db * string list =
  let public_pages' = get_db_public_pages db in
  let public_pages =
    IntSet.union (IntSet.of_list public_pages')
      (get_aliases_for_page_ids db public_pages')
  in
  let public_ents = get_db_public_ents db public_pages in
  let filtered =
    Datascript.filter db (fun _db (d : datom) -> IntSet.mem d.e public_ents)
  in
  let datoms' = List.of_seq (datoms filtered Eavt ()) in
  let assets = get_db_assets filtered in
  let db' =
    Datascript.db (conn_from_datoms ~schema:(Datascript.schema db) datoms')
  in
  (add_missing_built_in_block_timestamps db', assets)
