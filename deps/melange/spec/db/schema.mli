type uniqueness = Identity
type value_type = Ref
type cardinality = Many
type entry

val uniqueness_to_string : uniqueness -> string
val value_type_to_string : value_type -> string
val cardinality_to_string : cardinality -> string
val keyword : entry -> string
val uniqueness : entry -> uniqueness option
val value_type : entry -> value_type option
val indexed : entry -> bool
val cardinality : entry -> cardinality option
val entries : entry Rrbvec.t
val retract_attributes : string Rrbvec.t
val ref_type_attributes : string Rrbvec.t
val card_many_attributes : string Rrbvec.t
val card_many_ref_type_attributes : string Rrbvec.t
val card_one_ref_type_attributes : string Rrbvec.t
val db_non_ref_attributes : string Rrbvec.t
