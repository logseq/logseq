type node = { id : int; block : bool; children : int Rrbvec.t }
type referrer = { id : int; raw_title : string option }

type block = {
  id : int;
  uuid : string;
  title : string option;
  asset : bool;
  referrers : referrer Rrbvec.t;
}

type entity = {
  id : int;
  block : block option;
  history : bool;
  reactions : int Rrbvec.t;
  views : int Rrbvec.t;
  histories : int Rrbvec.t;
}

type retract_target = By_id of int | By_uuid of string

type history_candidate = {
  target : retract_target;
  block_id : int option;
  property_id : int option;
  ref_value_id : int option;
  own_ref_retracted : bool;
}

type operation =
  | Retract_entity of int
  | Retract_ref of { entity_id : int; block_id : int }
  | Add_title of { entity_id : int; title : string }
  | Retract_uuid of string

val expand_retract_ids : root_ids:int Rrbvec.t -> node Rrbvec.t -> int Rrbvec.t
val direct_cleanup : entity Rrbvec.t -> operation Rrbvec.t

val new_history_retracts :
  retracted_ids:int Rrbvec.t -> history_candidate Rrbvec.t -> operation Rrbvec.t
