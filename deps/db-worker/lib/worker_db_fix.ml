(* frontend.worker.db.fix — check-and-fix-schema! (d/transact!,
   not ldb/transact!). *)

open Datascript

(* Canonical schema map entries parsed from Db_schema.schema_edn:
   attr -> (schema-field-attr, value) pairs — cljs db-schema/schema. *)
let canonical_entries : (attr * (attr * value) list) list lazy_t =
  lazy
    (match Edn_util.read_string Db_schema.schema_edn with
     | Map kvs ->
         List.filter_map
           (fun (k, v) ->
              match k, v with
              | Keyword attr, Map fields ->
                  Some
                    ( attr
                    , List.filter_map
                        (fun (fk, fv) ->
                           match fk with
                           | Keyword fa -> Some (fa, fv)
                           | _ -> None)
                        fields )
              | _ -> None)
           kvs
     | _ -> [])

let value_type_kw = function
  | RefType -> "db.type/ref"
  | TupleType -> "db.type/tuple"
  | StringType -> "db.type/string"
  | KeywordType -> "db.type/keyword"
  | NumberType -> "db.type/number"
  | UuidType -> "db.type/uuid"
  | InstantType -> "db.type/instant"

(* schema_attr -> the EDN map form cljs (:schema @conn) yields for it
   (minus :db/ident, which the cljs diff strips anyway). *)
let schema_attr_map (a : schema_attr) : (attr * value) list =
  (match a.value_type with
   | Some t -> [ ("db/valueType", Keyword (value_type_kw t)) ]
   | None -> [])
  @ (match a.unique with
     | Some Identity -> [ ("db/unique", Keyword "db.unique/identity") ]
     | Some Value -> [ ("db/unique", Keyword "db.unique/value") ]
     | None -> [])
  @ [ ( "db/cardinality"
      , Keyword
          (match a.cardinality with
           | Many -> "db.cardinality/many"
           | One -> "db.cardinality/one") ) ]
  @ (if a.indexed then [ ("db/index", Bool true) ] else [])
  @ (if a.is_component then [ ("db/isComponent", Bool true) ] else [])
  @ (if a.no_history then [ ("db/noHistory", Bool true) ] else [])
  @ (match a.doc with Some d -> [ ("db/doc", String d) ] | None -> [])
  @ (match a.tuple_attrs with
     | Some attrs -> [ ("db/tupleAttrs", List (List.map (fun x -> Keyword x) attrs)) ]
     | None -> [])
  @ (match a.tuple_types with
     | Some ts -> [ ("db/tupleTypes", List (List.map (fun t -> Keyword (value_type_kw t)) ts)) ]
     | None -> [])

(* cljs normalization of the conn's schema-v: drop :db/cardinality
   when it is :db.cardinality/one; drop :db/index when truthy but
   absent from the canonical map. *)
let normalize_conn_schema_v (conn_map : (attr * value) list) (canonical_v : (attr * value) list)
    : (attr * value) list =
  conn_map
  |> List.filter (fun (k, v) ->
         not (k = "db/cardinality" && v = Keyword "db.cardinality/one"))
  |> List.filter (fun (k, v) ->
         not
           (k = "db/index" && v <> Nil
            && List.assoc_opt "db/index" canonical_v = None))

let maps_equal (a : (attr * value) list) (b : (attr * value) list) : bool =
  List.length a = List.length b
  && List.for_all (fun (k, v) -> List.assoc_opt k b = Some v) a

(* cljs writes inst values only for :file/created-at and
   :file/last-modified-at (malli inst? schema); a ~m value on any other
   attr is a corrupt epoch-ms number — rewrite it as the numeric rep
   cljs would have stored. Runs before the db listener is installed on
   open, same as check-and-fix-schema, so it never enters local-tx. *)
let instant_attrs = [ "file/created-at"; "file/last-modified-at" ]

let heal_instant_values (conn : conn) =
  let db = Datascript.db conn in
  let ops =
    List.of_seq (datoms db Eavt ())
    |> List.concat_map (fun (d : datom) ->
         match d.v with
         | Instant ms when not (List.mem d.a instant_attrs) ->
             [ Retract (Entity_id d.e, d.a, Some d.v)
             ; Add (Entity_id d.e, d.a, Common_util.value_of_ms ms) ]
         | _ -> [])
  in
  if ops <> [] then begin
    Worker_log.info "worker-db-fix/heal-instant-values"
      [ ("datoms", string_of_int (List.length ops / 2)) ];
    ignore (Datascript.transact_bang conn ops)
  end

let check_and_fix_schema (conn : conn) =
  let conn_schema = Datascript.schema (Datascript.db conn) in
  let canonical = Lazy.force canonical_entries in
  let diffs =
    List.filter_map
      (fun (k, v) ->
         let schema_v' =
           match Datascript.Schema.schema_attr_by_name conn_schema k with
           | Some a -> normalize_conn_schema_v (schema_attr_map a) v
           | None -> []
         in
         if not (maps_equal v schema_v' || k = "db/ident") then Some (k, v)
         else None)
      canonical
  in
  if diffs <> [] then begin
    Worker_log.debug "worker-db-fix/check-and-fix-schema"
      [ ("diffs"
        , String.concat " " (List.map fst diffs)) ];
    let tx_ops =
      List.map
        (fun (k, v) ->
           Entity
             { db_id = None
             ; attrs =
                 ("db/ident", One_value (Keyword k))
                 :: List.map (fun (a, v) -> (a, One_value v)) v
             })
        diffs
    in
    ignore (Datascript.transact_bang conn tx_ops)
  end
