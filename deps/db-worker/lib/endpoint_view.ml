(* Faithful port of frontend.worker.handler.view (handler/view.cljs).

   Endpoints registered at module load:
     thread-api/get-view-filter-data
     thread-api/get-view-data
   init () wiring: Worker_core.init touches
     Endpoint_view.get_view_filter_data
     Endpoint_view.get_view_data *)

open Datascript

let kw s = Wire.Keyword s

let arg args i = List.nth_opt args i

let with_conn args f =
  let repo =
    match arg args 0 with
    | Some (Wire.String s) -> s
    | Some Wire.Nil | None -> ""
    | _ -> invalid_arg "first arg must be repo name"
  in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.nil
  | Some conn -> f (Datascript.db conn)

let kw_or_string = function
  | Wire.Keyword s | Wire.String s -> Some s
  | _ -> None

(* entity-util/entity->map: {:db/id, <kw attrs> -> raw values}, as wire *)
let entity_map_wire (e : entity) : (Wire.t * Wire.t) list =
  (kw "db/id", Wire.Int e.id)
  :: List.map
       (fun (d : datom) -> (kw d.a, Ds_wire.transit_of_value d.v))
       (List.of_seq (datoms e.db Eavt ~e:e.id ()))

let wire_key_eq (key : Wire.t) (k : string) : bool =
  match key with Wire.Keyword s | Wire.String s -> s = k | _ -> false

let map_get (k : string) (pairs : (Wire.t * Wire.t) list) : Wire.t option =
  List.find_map (fun (key, v) -> if wire_key_eq key k then Some v else None) pairs

(* view-filter-value-source *)
let value_source_of (prop_type : string option) (operator : string) : string option =
  if operator = "before" || operator = "after" then Some "timestamp"
  else if prop_type = Some "checkbox" then Some "checkbox"
  else if
    prop_type = Some "data" || prop_type = Some "datetime"
    || prop_type = Some "checkbox"
  then None
  else Some "property-values"

(* view-filter-operators *)
let operators_of (prop_ident : string option) (prop_type : string option) : string list =
  match prop_ident with
  | Some ("block/created-at" | "block/updated-at") -> [ "before"; "after" ]
  | _ ->
      [ "is"; "is-not" ]
      @ (match prop_type with
         | Some "datetime" -> [ "before"; "after" ]
         | Some ("default" | "url" | "node") ->
             [ "text-contains"; "text-not-contains" ]
         | Some "date" -> [ "date-before"; "date-after" ]
         | Some "number" ->
             [ "number-gt"; "number-lt"; "number-gte"; "number-lte"; "between" ]
         | _ -> [])

(* view-filter-many? *)
let filter_many (prop_type : string option) (operator : string) : bool =
  not
    (List.mem operator [ "date-before"; "date-after"; "before"; "after" ]
     || prop_type = Some "checkbox")

(* view-filter-value-after-operator-change *)
let value_after_operator_change (operator : string) (value : Wire.t) : Wire.t =
  let is_number = function Wire.Int _ | Wire.Float _ -> true | _ -> false in
  match operator with
  | "is" | "is-not" ->
      (match value with Wire.Set _ -> value | _ -> Wire.Nil)
  | "text-contains" | "text-not-contains" ->
      (match value with Wire.String _ -> value | _ -> Wire.Nil)
  | "number-gt" | "number-lt" | "number-gte" | "number-lte" ->
      (match value with v when is_number v -> v | _ -> Wire.Nil)
  | "between" ->
      (match value with
       | Wire.Array xs | Wire.List xs | Wire.Set xs
         when xs <> [] && List.for_all is_number xs -> value
       | _ -> Wire.Nil)
  | "date-before" | "date-after" | "before" | "after" ->
      (match value with
       | v when is_number v -> v
       | Wire.Date_ms _ -> value
       | _ -> Wire.Nil)
  | _ -> Wire.Nil

(* normalize-view-filter-value — map :value → its :block/uuid *)
let normalize_view_filter_value (v : Wire.t) : Wire.t =
  match v with
  | Wire.Map ps ->
      (match map_get "value" ps with
       | Some (Wire.Map vm) ->
           let uuid =
             match map_get "block/uuid" vm with
             | Some u -> u
             | None -> Wire.Nil
           in
           Wire.Map
             (List.map
                (fun (k, x) -> if wire_key_eq k "value" then (k, uuid) else (k, x))
                ps)
       | _ -> v)
  | _ -> v

(* view-filter-data — standalone fn as in cljs; the thread-api wrapper
   below resolves the conn and forwards the option map. *)
let view_filter_data (db : db) (option : Wire.t) : Wire.t =
  let property_pairs : (Wire.t * Wire.t) list =
    match Wire.get "property" option with
    | Some (Wire.Map ps) -> ps
    | _ ->
        (match Option.bind (Wire.get "property-ident" option) kw_or_string with
         | Some ident ->
             (match Ldb.ent_of_ref db (Ident ident) with
              | Some e -> entity_map_wire e
              | None -> [])
         | None -> [])
  in
  let prop_get k = map_get k property_pairs in
  let prop_ident = Option.bind (prop_get "db/ident") kw_or_string in
  let prop_type = Option.bind (prop_get "logseq.property/type") kw_or_string in
  let operator =
    match Option.bind (Wire.get "operator" option) kw_or_string with
    | Some s -> s
    | None -> "is"
  in
  let value =
    match Wire.get "value" option with Some v -> v | None -> Wire.Nil
  in
  let value_source = value_source_of prop_type operator in
  let values =
    match value_source, prop_ident with
    | Some "property-values", Some ident ->
        let view_id =
          match Wire.get "view-id" option with
          | Some (Wire.Int i) -> Some i
          | _ -> None
        in
        let query_entity_ids =
          match Wire.get "query-entity-ids" option with
          | Some (Wire.Array xs) | Some (Wire.List xs) | Some (Wire.Set xs) ->
              Some
                (List.filter_map
                   (function Wire.Int i -> Some i | _ -> None)
                   xs)
          | _ -> None
        in
        Wire.Array
          (List.map normalize_view_filter_value
             (Db_view.get_property_values db ident ~view_id ~query_entity_ids))
    | _ -> Wire.Nil
  in
  Wire.Map
    [ ( kw "operators",
        Wire.Array (List.map kw (operators_of prop_ident prop_type)) )
    ; ( kw "value-source",
        match value_source with
        | Some s -> Wire.Keyword s
        | None -> Wire.Nil )
    ; (kw "many?", Wire.Bool (filter_many prop_type operator))
    ; (kw "values", values)
    ; ( kw "value-after-operator-change",
        value_after_operator_change operator value ) ]

let get_view_filter_data args =
  with_conn args (fun db ->
      let option =
        match arg args 1 with Some w -> w | None -> Wire.Map []
      in
      Db_worker_effect.pure (view_filter_data db option))

let () = Dispatcher.register "thread-api/get-view-filter-data" get_view_filter_data

(* get-view-data — worker-plain-value is folded into
   Db_view.get_view_data's wire emission *)
let get_view_data args =
  with_conn args (fun db ->
      let view_id =
        match arg args 1 with
        | Some (Wire.Int i) -> Some i
        | _ -> None
      in
      let option =
        match arg args 2 with Some w -> w | None -> Wire.Map []
      in
      Db_worker_effect.pure (Db_view.get_view_data db view_id option))

let () = Dispatcher.register "thread-api/get-view-data" get_view_data
