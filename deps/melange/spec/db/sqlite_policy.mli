type property_input = {
  namespace_ : string;
  name : string;
  normalized_name : string;
  title : string option;
  property_type : string;
  cardinality : string;
  explicit_ref_type : bool;
  known_ref_type : bool;
  uuid : string;
  order : string;
}

type property_plan = {
  ident : string;
  title : string;
  normalized_name : string;
  property_type : string;
  cardinality : string;
  ref_type : bool;
  uuid : string;
  order : string;
}

val sanitize_db_name : prefix:string -> string -> string
val db_based_graph : prefix:string -> string -> bool

val reachable_addresses :
  roots:int Rrbvec.t -> (int * int Rrbvec.t) Rrbvec.t -> int Rrbvec.t

val unused_addresses :
  internal:int Rrbvec.t ->
  all:int Rrbvec.t ->
  referenced:int Rrbvec.t ->
  int Rrbvec.t

val missing_addresses :
  required:int Rrbvec.t -> present:int Rrbvec.t -> int Rrbvec.t

val property : property_input -> property_plan
val add_root_extends : ident:string -> has_extends:bool -> bool
val hide_page : title:string -> quick_add_title:string -> bool
val import_retract_idents : string Rrbvec.t
