(* Shared handler-property wire-map helpers (frontend/worker/handler/
   property.cljs entity-direct-map / display-property-map* /
   property-plain-map / closed-values plumbing). Lives below
   Endpoint_property and Display_properties so both can use it without a
   module cycle. *)

open Datascript

let kw s = Wire.Keyword s

let select_keys_wire (keys : string list) (m : Wire.t) : Wire.t =
  match m with
  | Wire.Map pairs ->
      Wire.Map
        (List.filter_map
           (fun k ->
              match List.assoc_opt (kw k) pairs with
              | Some v -> Some (kw k, v)
              | None -> None)
           keys)
  | _ -> m

let wire_assoc (k : string) (v : Wire.t) (m : Wire.t) : Wire.t =
  match m with
  | Wire.Map pairs ->
      Wire.Map ((kw k, v) :: List.remove_assoc (kw k) pairs)
  | _ -> m

(* handler entity-direct-map: select-keys of entity-forward-map *)
let entity_direct_map db (e : entity) (keys : string list) : Wire.t =
  select_keys_wire keys (Plain_value.entity_forward_map db e)

let display_property_value_keys =
  [ "db/id"; "db/ident"; "block/title"; "block/uuid"; "block/order"
  ; "logseq.property/value"; "logseq.property/icon"
  ; "logseq.property/choice-checkbox-state"
  ; "logseq.property/choice-classes"; "logseq.property/deleted-at" ]

let display_property_keys =
  [ "db/id"; "db/ident"; "block/title"; "block/uuid"; "block/name"
  ; "block/order"; "block/tags"; "db/cardinality"; "logseq.property/type"
  ; "logseq.property/classes"; "logseq.property/icon"; "logseq.property/public?"
  ; "logseq.property/built-in?"; "logseq.property/hide?"
  ; "logseq.property/hide-empty-value"; "logseq.property/ui-position"
  ; "logseq.property/view-context"; "logseq.property/scalar-default-value"
  ; "logseq.property/default-value" ]

(* entity-direct-value: first :v of eavt datoms for eid+attr *)
let entity_direct_value db (eid : entity_id) (a : attr) : value option =
  match Seq.uncons (datoms db Eavt ~e:eid ~a ()) with
  | Some (d, _) -> Some d.v
  | None -> None

let display_property_description db (property : entity) : Wire.t option =
  match entity_direct_value db property.id "logseq.property/description" with
  | Some (Ref id) ->
      (match Ldb.ent_of_id db id with
       | Some desc ->
           Some (entity_direct_map db desc [ "db/id"; "block/title"; "block/uuid" ])
       | None -> None)
  | _ -> None

(* handler property-closed-values: reverse refs of
   :block/closed-value-property, minus recycled, sorted by :block/order,
   each as entity-direct-map *)
let property_closed_values db (property : entity) : Wire.t =
  Wire.Array
    (List.map
       (fun cv -> entity_direct_map db cv display_property_value_keys)
       (Outliner_property.closed_values_of property))

(* handler display-property-map* *)
let display_property_map db (property : entity) : Wire.t =
  let m = entity_direct_map db property display_property_keys in
  let m =
    match display_property_description db property with
    | Some d -> wire_assoc "logseq.property/description" d m
    | None -> m
  in
  match property_closed_values db property with
  | Wire.Array (_ :: _ as cvs) ->
      wire_assoc "property/closed-values" (Wire.Array cvs) m
  | _ -> m

(* handler property-plain-map: entity-forward-map + class-declared? +
   closed-values *)
let property_plain_map db (property : entity) : Wire.t =
  let m =
    wire_assoc "block.temp/class-declared?"
      (Wire.Bool
         (Seq.uncons
            (datoms db Avet ~a:"logseq.property.class/properties"
               ~v:(Ref property.id) ())
          |> Option.is_some))
      (Plain_value.entity_forward_map db property)
  in
  match property_closed_values db property with
  | Wire.Array (_ :: _ as cvs) ->
      wire_assoc "property/closed-values" (Wire.Array cvs) m
  | _ -> m
