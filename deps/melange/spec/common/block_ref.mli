val left_parens : string
val right_parens : string
val left_and_right_parens : string
val block_ref_re : Js.Re.t
val get_block_ref_id : string -> string option
val get_string_block_ref_id : string -> string
val is_block_ref : string -> bool
val is_string_block_ref : string -> bool
val to_block_ref : string -> string
