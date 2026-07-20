type conflict_group = { indices : int Rrbvec.t; tx : int option }

type reorder_kind =
  | Recreated_retract
  | Retracted_datom
  | Other
  | Final_retract

type reorder_entry = { index : int; kind : reorder_kind }

type item_shape = {
  index : int;
  retract_block_uuid : bool;
  has_attr : bool;
  has_value : bool;
}

type item_action = Retract_entity | Keep_item | Shorten_item
type item_plan = { index : int; action : item_action }
type replacement_entry = { index : int; replacement_group : int option }
type entity_retraction_action = Emit_retraction of int | Keep_original of int

type resolution_availability = {
  has_before_lookup : bool;
  has_after_tempid : bool;
}

type resolution_source = Before_lookup | After_tempid | Original_value
type datom_operation = Drop_datom | Add_datom | Retract_datom

type datom_shape = {
  added : bool;
  entity : resolution_availability;
  resolve_value : bool;
  value : resolution_availability;
  original_value_present : bool;
}

type datom_plan = {
  operation : datom_operation;
  entity_source : resolution_source option;
  value_source : resolution_source option;
}

val select_conflict_indices : conflict_group Rrbvec.t -> int Rrbvec.t
val sort_priority_indices : int Rrbvec.t -> int Rrbvec.t
val reorder_retract_indices : reorder_entry Rrbvec.t -> int Rrbvec.t
val plan_item_actions : item_shape Rrbvec.t -> item_plan Rrbvec.t
val retained_indices : bool Rrbvec.t -> int Rrbvec.t

val plan_entity_retractions :
  replacement_entry Rrbvec.t -> entity_retraction_action Rrbvec.t

val plan_datom : datom_shape -> datom_plan
