(* Conversions between wire transit values, datascript types, and
   EDN text. Structured API args (queries, tx-data, pull patterns)
   are rendered to EDN and parsed by datascript-ocaml's own reader —
   no query forms are built by hand. *)

open Datascript

(* ---- transit -> EDN text ---- *)

let escape_string s =
  let b = Buffer.create (String.length s + 8) in
  String.iter
    (fun c ->
       match c with
       | '"' -> Buffer.add_string b "\\\""
       | '\\' -> Buffer.add_string b "\\\\"
       | '\n' -> Buffer.add_string b "\\n"
       | '\t' -> Buffer.add_string b "\\t"
       | '\r' -> Buffer.add_string b "\\r"
       | c -> Buffer.add_char b c)
    s;
  Buffer.contents b

let iso_of_ms ms =
  (* ISO 8601 from epoch millis, mode-agnostic
     (civil-from-days algorithm, no platform time API). *)
  let total_seconds = Int64.div ms 1000L in
  let total_seconds =
    if ms < 0L && Int64.rem ms 1000L <> 0L then Int64.sub total_seconds 1L
    else total_seconds
  in
  let day_rem = Int64.rem total_seconds 86400L in
  let day_secs, days =
    if day_rem < 0L then
      Int64.add day_rem 86400L, Int64.to_int (Int64.sub (Int64.div total_seconds 86400L) 1L)
    else
      day_rem, Int64.to_int (Int64.div total_seconds 86400L)
  in
  let hh = Int64.to_int (Int64.div day_secs 3600L) in
  let mm = Int64.to_int (Int64.div (Int64.rem day_secs 3600L) 60L) in
  let ss = Int64.to_int (Int64.rem day_secs 60L) in
  let z = days + 719468 in
  let era = (if z >= 0 then z else z - 146096) / 146097 in
  let doe = z - (era * 146097) in
  let yoe = (doe - (doe / 1460) + (doe / 36524) - (doe / 146096)) / 365 in
  let y = yoe + (era * 400) in
  let doy = doe - ((365 * yoe) + (yoe / 4) - (yoe / 100)) in
  let mp = ((5 * doy) + 2) / 153 in
  let d = doy - (((153 * mp) + 2) / 5) + 1 in
  let m = if mp < 10 then mp + 3 else mp - 9 in
  let y = if m <= 2 then y + 1 else y in
  let ms_part = Int64.to_int (Int64.rem ms 1000L) in
  let ms_part = if ms_part < 0 then ms_part + 1000 else ms_part in
  Printf.sprintf "%04d-%02d-%02dT%02d:%02d:%02d.%03dZ" y m d hh mm ss ms_part

let edn_date ms = "#inst \"" ^ iso_of_ms ms ^ "\""

let rec edn_of_transit (t : Wire.t) =
  match t with
  | Wire.Nil -> "nil"
  | Wire.Bool b -> if b then "true" else "false"
  | Wire.String s -> Printf.sprintf "\"%s\"" (escape_string s)
  | Wire.Int n -> string_of_int n
  (* int64 has no int-width EDN literal; #inst is the only literal the
     reader widens to int64, and Instant is the int64 value rep *)
  | Wire.Int64 n -> edn_date n
  | Wire.Float f -> Printf.sprintf "%.17g" f
  | Wire.Binary s -> Printf.sprintf "\"%s\"" (escape_string s)
  | Wire.Keyword s -> ":" ^ s
  | Wire.Symbol s -> s
  | Wire.Big_decimal s -> s ^ "M"
  | Wire.Big_int s -> s ^ "N"
  | Wire.Date_ms ms -> edn_date ms
  | Wire.Uuid s -> Printf.sprintf "#uuid \"%s\"" s
  | Wire.Uri s -> Printf.sprintf "#uri \"%s\"" s
  | Wire.Array xs -> "[" ^ String.concat " " (List.map edn_of_transit xs) ^ "]"
  | Wire.List xs -> "(" ^ String.concat " " (List.map edn_of_transit xs) ^ ")"
  | Wire.Set xs -> "#{" ^ String.concat " " (List.map edn_of_transit xs) ^ "}"
  | Wire.Map kvs ->
      let pair (k, v) = edn_of_transit k ^ " " ^ edn_of_transit v in
      "{" ^ String.concat " " (List.map pair kvs) ^ "}"
  | Wire.Tagged (tag, rep) -> "#" ^ tag ^ " " ^ edn_of_transit rep

(* An API arg that is already EDN text stays text; data forms are
   rendered to EDN. Both paths end at datascript-ocaml's reader —
   never a hand-built query form. *)
let edn_text_of_arg = function
  | Wire.String s -> s
  | t -> edn_of_transit t

(* ---- value <-> transit ---- *)

let rec transit_of_value (v : value) : Wire.t =
  match v with
  | Nil -> Wire.Nil
  | Int n -> Wire.Int n
  | Float f -> Wire.Float f
  | String s -> Wire.String s
  | Symbol s -> Wire.Symbol s
  | Bool b -> Wire.Bool b
  | Keyword s -> Wire.Keyword s
  | Uuid s -> Wire.Uuid s
  | Instant ms -> Wire.Int64 ms
  | Regex s -> Wire.String s
  | Ref n -> Wire.Int n
  | List vs -> Wire.List (List.map transit_of_value vs)
  | Vector vs -> Wire.Array (List.map transit_of_value vs)
  | Map kvs -> Wire.Map (List.map (fun (k, v) -> (transit_of_value k, transit_of_value v)) kvs)
  | Set vs -> Wire.Set (List.map transit_of_value vs)
  | Tuple vs -> Wire.Array (List.map (function Some v -> transit_of_value v | None -> Wire.Nil) vs)
  | TxRef -> Wire.Keyword "db/current-tx"
  | Ref_to eref -> transit_of_entity_ref eref

and transit_of_entity_ref (r : entity_ref) : Wire.t =
  match r with
  | Entity_id n -> Wire.Int n
  | Temp_id s -> Wire.String s
  | CurrentTx -> Wire.Keyword "db/current-tx"
  | Ident s -> Wire.Keyword s
  | Lookup_ref (a, v) -> Wire.Array [ Wire.Keyword a; transit_of_value v ]

let rec value_of_transit (t : Wire.t) : value =
  match t with
  | Wire.Nil -> Nil
  | Wire.Bool b -> Bool b
  | Wire.String s -> String s
  | Wire.Int n -> Int n
  | Wire.Int64 n ->
      if Int64.abs n <= Int64.of_int max_int then Int (Int64.to_int n)
      else Instant n
  | Wire.Float f -> Float f
  | Wire.Binary s -> String s
  | Wire.Keyword s -> Keyword s
  | Wire.Symbol s -> Symbol s
  | Wire.Big_int s -> Int (int_of_string s)
  | Wire.Big_decimal s -> Float (float_of_string s)
  | Wire.Date_ms ms -> Instant ms
  | Wire.Uuid s -> Uuid s
  | Wire.Uri s -> String s
  | Wire.Array xs -> Vector (List.map value_of_transit xs)
  | Wire.List xs -> List (List.map value_of_transit xs)
  | Wire.Set xs -> Set (List.map value_of_transit xs)
  | Wire.Map kvs -> Map (List.map (fun (k, v) -> (value_of_transit k, value_of_transit v)) kvs)
  | Wire.Tagged ("datascript/Datom", rep) -> Vector [ Symbol "datascript/Datom"; value_of_transit rep ]
  | Wire.Tagged (tag, rep) -> Vector [ String ("#" ^ tag); value_of_transit rep ]

let entity_ref_of_transit (t : Wire.t) : entity_ref =
  match t with
  | Wire.Int n -> Entity_id n
  | Wire.Int64 n -> Entity_id (Int64.to_int n)
  | Wire.String s -> Temp_id s
  | Wire.Keyword "db/current-tx" -> CurrentTx
  | Wire.Keyword s -> Ident s
  | Wire.Array [ Wire.Keyword a; v ] | Wire.List [ Wire.Keyword a; v ] -> Lookup_ref (a, value_of_transit v)
  | _ -> invalid_arg "invalid entity ref"

let tx_meta_of_transit (t : Wire.t) : tx_meta =
  match t with
  | Wire.Nil -> []
  | Wire.Map kvs ->
      List.filter_map
        (fun (k, v) ->
           match k with
           | Wire.Keyword a -> Some (a, value_of_transit v)
           | _ -> None)
        kvs
  | _ -> invalid_arg "tx-meta must be a map or nil"

(* ---- datom ---- *)

let transit_of_datom (d : datom) : Wire.t =
  let tx = if d.added then d.tx else -d.tx in
  Wire.Array [ Wire.Int d.e; Wire.Keyword d.a; transit_of_value d.v; Wire.Int tx ]

(* ---- query results ---- *)

(* cljs pull emits exactly the pattern's attrs — :db/id only appears when
   :db/id or * was requested (the engine then includes it in pulled_attrs). *)
let rec transit_of_pulled (p : pulled_entity) : Wire.t =
  let entries =
    List.map
         (fun (k, v) ->
            let key =
              match k with
              | Keyword s -> Wire.Keyword s
              | other -> transit_of_value other
            in
            (key, transit_of_pulled_value v))
         p.pulled_attrs
  in
  Wire.Map entries

and transit_of_pulled_value (v : pulled_value) : Wire.t =
  match v with
  | Pulled_scalar v -> transit_of_value v
  | Pulled_many vs -> Wire.Set (List.map transit_of_pulled_value vs)
  | Pulled_entity e -> transit_of_pulled e

(* ---- entity-util/entity->map wire encoding ----

   cljs transit writes a touched de/Entity as
   {"~#datascript/Entity" (.-kv e) + :db/id}. Nested entity values are
   untouched, so their rep collapses to just {:db/id ref}. *)

let transit_of_entity_stub (r : entity_ref) : Wire.t =
  Wire.Tagged
    ( "datascript/Entity",
      Wire.Map [ (Wire.Keyword "db/id", transit_of_entity_ref r) ] )

let entity_map_wire (e : entity) : Wire.t =
  let pair_of (a, v) =
    ( Wire.Keyword a,
      match v with
      | One_entity te ->
          (match te.db_id with
           | Some r -> transit_of_entity_stub r
           | None -> Wire.Nil)
      | Many_entities tes ->
          Wire.Set
            (List.map
               (fun te ->
                  match te.db_id with
                  | Some r -> transit_of_entity_stub r
                  | None -> Wire.Nil)
               tes)
      | One_value v -> transit_of_value v
      | Many_values vs -> Wire.Set (List.map transit_of_value vs) )
  in
  Wire.Map
    ((Wire.Keyword "db/id", Wire.Int e.id)
     :: List.map pair_of (Datascript.entity_attrs e))

let rec transit_of_query_result (r : query_result) : Wire.t =
  match r with
  | Result_entity n -> Wire.Int n
  | Result_attr a -> Wire.Keyword a
  | Result_value v -> transit_of_value v
  | Result_db db -> transit_of_serializable_db (Datascript.serializable db)
  | Result_pull p -> transit_of_pulled p

and transit_of_serializable_db (db : serializable_db) : Wire.t =
  Wire.Tagged
    ( "datascript/DB",
      Wire.Map
        [
          (Wire.Keyword "schema", transit_of_schema db.serializable_schema);
          (Wire.Keyword "datoms", Wire.Array (List.map transit_of_datom db.serializable_datoms));
        ] )

and transit_of_schema (schema : schema) : Wire.t =
  let kw s = Wire.Keyword s in
  Wire.Map
    (List.map
       (fun (a, sa) ->
          let fields =
            [
              ( if sa.cardinality = Many then Some ("db/cardinality", kw "db.cardinality/many")
                else None );
              ( match sa.unique with
              | Some Value -> Some ("db/unique", kw "db.unique/value")
              | Some Identity -> Some ("db/unique", kw "db.unique/identity")
              | None -> None );
              (if sa.indexed then Some ("db/index", Wire.Bool true) else None);
              (if sa.is_component then Some ("db/isComponent", Wire.Bool true) else None);
              (if sa.no_history then Some ("db/noHistory", Wire.Bool true) else None);
              ( match sa.doc with
              | Some doc -> Some ("db/doc", Wire.String doc)
              | None -> None );
              ( match sa.value_type with
              | Some RefType -> Some ("db/valueType", kw "db.type/ref")
              | Some TupleType -> Some ("db/valueType", kw "db.type/tuple")
              | Some StringType -> Some ("db/valueType", kw "db.type/string")
              | Some KeywordType -> Some ("db/valueType", kw "db.type/keyword")
              | Some NumberType -> Some ("db/valueType", kw "db.type/number")
              | Some UuidType -> Some ("db/valueType", kw "db.type/uuid")
              | Some InstantType -> Some ("db/valueType", kw "db.type/instant")
              | None -> None );
              ( match sa.tuple_attrs with
              | Some attrs ->
                  Some ("db/tupleAttrs", Wire.Array (List.map kw attrs))
              | None -> None );
              ( match sa.tuple_types with
              | Some types ->
                  let type_kw = function
                    | RefType -> "db.type/ref"
                    | TupleType -> "db.type/tuple"
                    | StringType -> "db.type/string"
                    | KeywordType -> "db.type/keyword"
                    | NumberType -> "db.type/number"
                    | UuidType -> "db.type/uuid"
                    | InstantType -> "db.type/instant"
                  in
                  Some ("db/tupleTypes", Wire.Array (List.map (fun t -> kw (type_kw t)) types))
              | None -> None );
            ]
          in
          ( Wire.Keyword a,
            Wire.Map
              (List.filter_map (fun f -> Option.map (fun (k, v) -> (Wire.Keyword k, v)) f) fields)
          ))
       schema)

let wire_map_of_pairs pairs =
  Wire.Map
    (List.map
       (fun (k, r) -> (transit_of_value k, transit_of_query_result r))
       pairs)

(* cljs (apply d/q ...) honours the :find spec: relation -> #{[row]},
   collection -> #{value}, tuple -> [value], scalar -> value;
   :keys/:syms/:strs produce result maps instead of tuples. *)
let wire_of_query_output (output : query_output) : Wire.t =
  match output with
  | Query_scalar (Some r) -> transit_of_query_result r
  | Query_scalar None -> Wire.nil
  | Query_collection rs -> Wire.Set (List.map transit_of_query_result rs)
  | Query_tuple (Some rs) -> Wire.Array (List.map transit_of_query_result rs)
  | Query_tuple None -> Wire.nil
  | Query_relation rows ->
      Wire.Set
        (List.map
           (fun row -> Wire.Array (List.map transit_of_query_result row))
           rows)
  | Query_relation_maps rows -> Wire.Set (List.map wire_map_of_pairs rows)
  | Query_tuple_map (Some pairs) -> wire_map_of_pairs pairs
  | Query_tuple_map None -> Wire.nil

(* ---- tx_report -> transit ---- *)

let transit_of_tx_report (r : tx_report) : Wire.t =
  Wire.Map
    [
      (Wire.Keyword "db-before", transit_of_serializable_db (Datascript.serializable r.db_before));
      (Wire.Keyword "db-after", transit_of_serializable_db (Datascript.serializable r.db_after));
      ( Wire.Keyword "tx-data",
        Wire.Array (List.map (fun d -> Wire.Tagged ("datascript/Datom", transit_of_datom d)) r.tx_data) );
      ( Wire.Keyword "tempids",
        Wire.Map (List.map (fun (t, e) -> (Wire.String t, Wire.Int e)) r.tempids) );
      ( Wire.Keyword "tx-meta",
        Wire.Map (List.map (fun (a, v) -> (Wire.Keyword a, transit_of_value v)) r.tx_meta) );
    ]

(* ---- query inputs ---- *)

let query_arg_of_transit (t : Wire.t) : query_arg =
  match t with
  | Wire.Tagged ("datascript/DB", _) -> invalid_arg "db-as-input not yet supported"
  | Wire.Array xs | Wire.List xs ->
      (* relation/collection arg: rows of query_result *)
      let row_of v =
        match value_of_transit v with
        | Keyword s -> Result_attr s
        | v -> Result_value v
      in
      let is_row = function
        | Wire.Array _ | Wire.List _ -> true
        | _ -> false
      in
      if List.for_all is_row xs then
        Arg_relation (List.map (fun x -> List.map row_of (Wire.as_seq x)) xs)
      else Arg_collection (List.map row_of xs)
  | t ->
      (match value_of_transit t with
       | Keyword s -> Arg_scalar (Result_attr s)
       | Int n -> Arg_scalar (Result_entity n)
       | v -> Arg_scalar (Result_value v))

let rec edn_of_query_form (f : query_form) : string =
  match f with
  | QueryFormNil -> "nil"
  | QueryFormBool b -> if b then "true" else "false"
  | QueryFormInt n -> string_of_int n
  | QueryFormFloat x -> Printf.sprintf "%.17g" x
  | QueryFormString s -> Printf.sprintf "\"%s\"" (escape_string s)
  | QueryFormKeyword s -> ":" ^ s
  | QueryFormSymbol s -> s
  | QueryFormVector xs -> "[" ^ String.concat " " (List.map edn_of_query_form xs) ^ "]"
  | QueryFormList xs -> "(" ^ String.concat " " (List.map edn_of_query_form xs) ^ ")"
  | QueryFormSet xs -> "#{" ^ String.concat " " (List.map edn_of_query_form xs) ^ "}"
  | QueryFormTagged (tag, rep) -> "#" ^ tag ^ " " ^ edn_of_query_form rep
  | QueryFormMap kvs ->
      let pair (k, v) = edn_of_query_form k ^ " " ^ edn_of_query_form v in
      "{" ^ String.concat " " (List.map pair kvs) ^ "}"

let query_result_of_transit (t : Wire.t) : query_result =
  match value_of_transit t with
  | Keyword s -> Result_attr s
  | Int n -> Result_entity n
  | v -> Result_value v

(* Canonical string key for a wire scalar (ui-request ids, state keys). *)
let wire_key (t : Wire.t) : string =
  match t with
  | Wire.String s | Wire.Keyword s | Wire.Symbol s -> s
  | Wire.Int n -> string_of_int n
  | Wire.Int64 n -> Int64.to_string n
  | Wire.Float x -> Printf.sprintf "%.17g" x
  | Wire.Uuid s -> s
  | _ -> Transit_codec.to_string t

(* ---- transit -> serializable_db (decode of transit_of_serializable_db /
   cljs d/transit-read DB payload) ---- *)

let rec datom_of_transit (t : Wire.t) : datom =
  match t with
  | Wire.Tagged ("datascript/Datom", rep) -> datom_of_transit rep
  | Wire.Array [ e; a; v; tx ] | Wire.List [ e; a; v; tx ] ->
      let e' =
        match e with Wire.Int n -> n | _ -> invalid_arg "datom e must be int"
      in
      let a' =
        match a with Wire.Keyword s -> s | _ -> invalid_arg "datom a must be keyword"
      in
      let tx' =
        match tx with Wire.Int n -> n | _ -> invalid_arg "datom tx must be int"
      in
      { e = e'; a = a'; v = value_of_transit v; tx = abs tx'; added = tx' >= 0 }
  | _ -> invalid_arg "datom_of_transit: unexpected shape"

let schema_attr_of_transit (v : Wire.t) : schema_attr =
  let bool_field k = match Wire.get k v with Some (Wire.Bool b) -> b | _ -> false in
  let value_type_of_kw = function
    | Wire.Keyword "db.type/ref" -> Some RefType
    | Wire.Keyword "db.type/tuple" -> Some TupleType
    | Wire.Keyword "db.type/string" -> Some StringType
    | Wire.Keyword "db.type/keyword" -> Some KeywordType
    | Wire.Keyword "db.type/number" -> Some NumberType
    | Wire.Keyword "db.type/uuid" -> Some UuidType
    | Wire.Keyword "db.type/instant" -> Some InstantType
    | _ -> None
  in
  { cardinality =
      (match Wire.get "db/cardinality" v with
       | Some (Wire.Keyword "db.cardinality/many") -> Many
       | _ -> One);
    unique =
      (match Wire.get "db/unique" v with
       | Some (Wire.Keyword "db.unique/value") -> Some Value
       | Some (Wire.Keyword "db.unique/identity") -> Some Identity
       | _ -> None);
    indexed = bool_field "db/index";
    is_component = bool_field "db/isComponent";
    no_history = bool_field "db/noHistory";
    doc = Option.bind (Wire.get "db/doc" v) Wire.as_string;
    value_type = Option.bind (Wire.get "db/valueType" v) value_type_of_kw;
    tuple_attrs =
      Option.map
        (fun w -> List.filter_map Wire.as_keyword (Wire.as_seq w))
        (Wire.get "db/tupleAttrs" v);
    tuple_types =
      Option.map
        (fun w -> List.filter_map value_type_of_kw (Wire.as_seq w))
        (Wire.get "db/tupleTypes" v) }

let schema_of_transit (t : Wire.t) : schema =
  match t with
  | Wire.Map kvs ->
      List.filter_map
        (fun (k, v) ->
           match k with
           | Wire.Keyword a -> Some (a, schema_attr_of_transit v)
           | _ -> None)
        kvs
  | _ -> []

let serializable_db_of_transit (t : Wire.t) : serializable_db =
  let body =
    match t with Wire.Tagged ("datascript/DB", rep) -> rep | other -> other
  in
  let datoms =
    match Wire.get "datoms" body with
    | Some w -> List.map datom_of_transit (Wire.as_seq w)
    | None -> []
  in
  { serializable_schema =
      (* transit DB rep nests the attr->spec map under :schema *)
      (match Wire.get "schema" body with
       | Some s -> schema_of_transit s
       | None -> schema_of_transit body);
    serializable_datoms = datoms;
    serializable_max_eid = 0;
    serializable_max_tx = 0 }

(* tx ops back to cljs tx-data forms — the *result* of insert-blocks /
   apply-template carries the transacted entries, not the tx_report. *)

let rec transit_of_tx_entity (e : tx_entity) : Wire.t =
  let attrs =
    List.map
      (fun (a, v) -> (Wire.Keyword a, transit_of_tx_value v))
      e.attrs
  in
  let head =
    match e.db_id with
    | Some r -> [ (Wire.Keyword "db/id", transit_of_entity_ref r) ]
    | None -> []
  in
  Wire.Map (head @ attrs)

and transit_of_tx_value (v : tx_value) : Wire.t =
  match v with
  | One_value v -> transit_of_value v
  | Many_values vs -> Wire.Set (List.map transit_of_value vs)
  | One_entity e -> transit_of_tx_entity e
  | Many_entities es -> Wire.Array (List.map transit_of_tx_entity es)

let transit_of_tx_op (op : tx_op) : Wire.t =
  let kw_ s = Wire.Keyword s in
  match op with
  | Add (e, a, v) ->
      Wire.Array
        [ kw_ "db/add"; transit_of_entity_ref e; kw_ a; transit_of_value v ]
  | Retract (e, a, Some v) ->
      Wire.Array
        [ kw_ "db/retract"; transit_of_entity_ref e; kw_ a; transit_of_value v ]
  | Retract (e, a, None) | RetractAttr (e, a) ->
      Wire.Array [ kw_ "db/retract"; transit_of_entity_ref e; kw_ a ]
  | RetractEntity e ->
      Wire.Array [ kw_ "db/retractEntity"; transit_of_entity_ref e ]
  | CompareAndSet (e, a, old_v, new_v) ->
      Wire.Array
        [ kw_ "db/cas"; transit_of_entity_ref e; kw_ a
        ; (match old_v with Some v -> transit_of_value v | None -> Wire.Nil)
        ; transit_of_value new_v ]
  | Entity e -> transit_of_tx_entity e
  | Raw_datom d ->
      Wire.Array
        [ (if d.added then kw_ "db/add" else kw_ "db/retract")
        ; Wire.Int d.e; kw_ d.a; transit_of_value d.v ]
  | InstallTxFn (ident, _) ->
      (* cljs form is [fn-ref & args]; the OCaml closure has no wire rep *)
      Wire.Array [ transit_of_entity_ref ident ]
  | CallIdent (ident, args) ->
      Wire.Array
        (transit_of_entity_ref ident :: List.map transit_of_value args)
  | Call _ -> Wire.Nil

let transit_of_tx_meta (meta : tx_meta) : Wire.t =
  Wire.Map
    (List.map (fun (a, v) -> (Wire.Keyword a, transit_of_value v)) meta)

let transit_of_tx_result (tx_data : tx_op list) (tx_meta : tx_meta) : Wire.t =
  Wire.Map
    [ (Wire.Keyword "tx-data", Wire.Array (List.map transit_of_tx_op tx_data))
    ; (Wire.Keyword "tx-meta", transit_of_tx_meta tx_meta) ]
