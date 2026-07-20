type 'value snapshot = {
  value : 'value;
  id : int option;
  uuid : string option;
  page_ref : bool;
  page : bool;
  asset : bool;
  title : string option;
  raw_title : string option;
  children : 'value Rrbvec.t;
  referrers : 'value Rrbvec.t;
  history_block : 'value option;
  history_property : 'value option;
  history_ref_value : 'value option;
  history_scalar : bool;
  reactions : 'value Rrbvec.t;
  views : 'value Rrbvec.t;
  histories : 'value Rrbvec.t;
}

type 'value transaction_kind =
  | Retract_entity_tx of { operation : string; target : 'value }
  | Retract_tx of { entity : 'value; attribute : string }
  | Add_tx of { entity : 'value; attribute : string; value : 'value }
  | Map_tx of 'value
  | Other_tx

type 'value transaction = { source : 'value; kind : 'value transaction_kind }
type 'value output = Existing of 'value | Planned of Delete_plan.operation

type ('database, 'value) capabilities = {
  entity : 'database -> 'value -> 'value option;
  snapshot : 'value -> 'value snapshot;
  integer : 'value -> int option;
  int_value : int -> 'value;
  uuid_text : 'value -> string option;
  equal : 'value -> 'value -> bool;
}

val expand :
  ('database, 'value) capabilities ->
  'database ->
  delete_blocks:bool ->
  'value transaction Rrbvec.t ->
  'value output Rrbvec.t

val cleanup :
  ('database, 'value) capabilities ->
  'database ->
  'value transaction Rrbvec.t ->
  Delete_plan.operation Rrbvec.t
