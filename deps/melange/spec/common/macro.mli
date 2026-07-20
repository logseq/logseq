val left_braces : string
val right_braces : string
val is_macro : string -> bool
val substitute : string -> string array -> string
val expand_value_if_macro : string -> (string -> string option) -> string
