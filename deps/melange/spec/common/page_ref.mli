val left_brackets : string
val right_brackets : string
val left_and_right_brackets : string
val page_ref_re : Js.Re.t
val page_ref_without_nested_re : Js.Re.t
val page_ref_any_re : Js.Re.t
val markdown_page_ref_re : Js.Re.t
val get_file_basename : string -> string option
val is_page_ref : string -> bool
val to_page_ref : string -> string
val get_page_name : string -> string option
val get_page_name_or_self : string -> string
val matched_names : string -> string Rrbvec.t
