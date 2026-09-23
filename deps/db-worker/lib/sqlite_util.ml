(* Port of the tx-building helpers in logseq.db.sqlite.util
   (deps/db/src/logseq/db/sqlite/util.cljs) and
   entity-plus/db-based-graph?. *)

open Datascript

(* common-util/block-with-timestamps *)
let block_with_timestamps (block : Wire.t) : Wire.t =
  let updated_at = Wire.Int64 (Int64.of_float (Clock.now_ms ())) in
  let block = Cljs_map.assoc block "block/updated-at" updated_at in
  match Cljs_map.get block "block/created-at" with
  | None | Some Wire.Nil -> Cljs_map.assoc block "block/created-at" updated_at
  | Some _ -> block

(* entity-plus/db-based-graph? *)
let db_based_graph (db : db) : bool =
  match Ldb.get_key_value db "logseq.kv/db-type" with
  | Some (String "db") -> true
  | _ -> false

(* sqlite-util/build-new-property.
   [prop_schema] is a cljs-style map (Wire.t); optional opts mirror the
   {:keys [title block-uuid ref-type? properties]} map. *)
let build_new_property ?(title : string option) ?(block_uuid : string option)
    ?(ref_type : bool = false) ?(properties : Wire.t option)
    (db_ident : string) (prop_schema : Wire.t) : Wire.t =
  let db_ident' =
    if String.contains db_ident '/' then db_ident
    else Db_ident.create_user_property_ident_from_name db_ident
  in
  let prop_name =
    match title with
    | Some t -> t
    | None ->
        (match String.index_opt db_ident' '/' with
         | Some i -> String.sub db_ident' (i + 1) (String.length db_ident' - i - 1)
         | None -> db_ident')
  in
  let prop_type =
    match Cljs_map.get prop_schema "logseq.property/type" with
    | Some (Wire.Keyword k) -> k
    | _ -> "default"
  in
  let schema = Cljs_map.dissoc prop_schema "db/cardinality" in
  let many =
    match Cljs_map.get prop_schema "db/cardinality" with
    | Some (Wire.Keyword ("many" | "db.cardinality/many")) -> true
    | _ -> false
  in
  let block =
    Wire.Map
      [ (Wire.Keyword "db/ident", Wire.Keyword db_ident');
        (Wire.Keyword "block/tags", Wire.Set [ Wire.Keyword "logseq.class/Property" ]);
        (Wire.Keyword "logseq.property/type", Wire.Keyword prop_type);
        (Wire.Keyword "block/name",
         Wire.String (Ldb.page_name_sanity_lc prop_name));
        (Wire.Keyword "block/uuid",
         Wire.Uuid
           (match block_uuid with
            | Some u -> u
            | None -> Common_uuid.gen_uuid "db-ident-block-uuid" db_ident'));
        (Wire.Keyword "block/title", Wire.String prop_name);
        (Wire.Keyword "db/index", Wire.Bool true);
        (Wire.Keyword "db/cardinality",
         Wire.Keyword
           (if many then "db.cardinality/many" else "db.cardinality/one"));
        (Wire.Keyword "block/order", Wire.String (Db_order.gen_key_from_max ())) ]
  in
  let block =
    if ref_type || List.mem prop_type Db_schema.all_ref_property_types then
      Cljs_map.assoc block "db/valueType" (Wire.Keyword "db.type/ref")
    else block
  in
  let block =
    match properties with
    | Some (Wire.Map _ as props) -> Cljs_map.merge block props
    | _ -> block
  in
  Cljs_map.merge schema (block_with_timestamps block)

(* sqlite-util/build-new-class *)
let build_new_class (block : Wire.t) : Wire.t =
  let ident = Cljs_map.get block "db/ident" in
  let block =
    Cljs_map.conj
      (match Cljs_map.get block "block/tags" with
       | Some t -> t
       | None -> Wire.Nil)
      (Wire.Keyword "logseq.class/Tag")
    |> Cljs_map.into_set
    |> fun tags -> Cljs_map.assoc block "block/tags" tags
  in
  let block =
    match ident with
    | Some (Wire.Keyword "logseq.class/Root") -> block
    | _ ->
        (match Cljs_map.get block "logseq.property.class/extends" with
         | None | Some Wire.Nil ->
             Cljs_map.assoc block "logseq.property.class/extends"
               (Wire.Keyword "logseq.class/Root")
         | Some _ -> block)
  in
  block_with_timestamps block

(* sqlite-util/build-new-page *)
let quick_add_page_name = "Quick add"

let build_new_page ?(uuid : string option) (title : string) : Wire.t =
  let block =
    Wire.Map
      [ (Wire.Keyword "block/name",
         Wire.String (Ldb.page_name_sanity_lc title));
        (Wire.Keyword "block/title", Wire.String title);
        (Wire.Keyword "block/uuid",
         Wire.Uuid
           (match uuid with
            | Some u -> u
            | None -> Common_uuid.gen_uuid "builtin-block-uuid" title));
        (Wire.Keyword "block/tags", Wire.Set [ Wire.Keyword "logseq.class/Page" ]) ]
  in
  let block =
    if String.equal title quick_add_page_name then
      Cljs_map.assoc block "logseq.property/hide?" (Wire.Bool true)
    else block
  in
  block_with_timestamps block

(* sqlite-util/kv *)
let kv (k : string) (v : Wire.t) : Wire.t =
  assert
    (match String.index_opt k '/' with
     | Some i -> String.sub k 0 i = "logseq.kv"
     | None -> false);
  Wire.Map [ (Wire.Keyword "db/ident", Wire.Keyword k); (Wire.Keyword "kv/value", v) ]
