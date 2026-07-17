type entry = {
  index : int;
  entity_id : int;
  attribute : string;
  schema_many : bool;
  value_truthy : bool;
  value_is_set : bool;
}

type action_kind = Assign | Begin_set | Start_set | Add_set
type action

val kind : action -> action_kind
val previous_index : action -> int option
val plan : entry Rrbvec.t -> action Rrbvec.t
