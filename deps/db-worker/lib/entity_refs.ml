(* Ref-attr access for entities.

   Datascript.entity_attr materializes resolved refs into
   One_entity/Many_entities tx_entity, so Ldb.ref_ids/ref_ent/ref_ents —
   which only match One_value/Many_values — cannot see resolved ref attrs.
   These helpers accept both the raw (Ref) and materialized shapes. *)

open Datascript

let entity_id_of_tx_entity (t : tx_entity) : entity_id option =
  match t.db_id with Some (Entity_id id) -> Some id | _ -> None

let ref_ids (e : entity) (a : attr) : entity_id list =
  match entity_attr e a with
  | Some (One_value (Ref id)) -> [ id ]
  | Some (Many_values vs) ->
      List.filter_map (function Ref id -> Some id | _ -> None) vs
  | Some (One_entity t) -> Option.to_list (entity_id_of_tx_entity t)
  | Some (Many_entities ts) -> List.filter_map entity_id_of_tx_entity ts
  | _ -> []

let ref_ent (e : entity) (a : attr) : entity option =
  match ref_ids e a with id :: _ -> Ldb.ent_of_id e.db id | [] -> None

let ref_ents (e : entity) (a : attr) : entity list =
  List.filter_map (fun id -> Ldb.ent_of_id e.db id) (ref_ids e a)

(* Ldb.has_tag equivalent that also sees materialized tag refs. *)
let has_tag (e : entity) (tag_ident : string) : bool =
  let raw_matches v =
    match v with
    | Ref id ->
        (match Ldb.ent_of_id e.db id with
         | Some t -> Ldb.ident_of t = Some tag_ident
         | None -> false)
    | Keyword s -> s = tag_ident
    | _ -> false
  in
  let entity_matches (t : tx_entity) =
    match entity_id_of_tx_entity t with
    | Some id ->
        (match Ldb.ent_of_id e.db id with
         | Some t' -> Ldb.ident_of t' = Some tag_ident
         | None -> false)
    | None -> false
  in
  match entity_attr e "block/tags" with
  | Some (One_value v) -> raw_matches v
  | Some (Many_values vs) -> List.exists raw_matches vs
  | Some (One_entity t) -> entity_matches t
  | Some (Many_entities ts) -> List.exists entity_matches ts
  | _ -> false
