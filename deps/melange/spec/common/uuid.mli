val is_string : string -> bool
val journal_page : int -> string

val journal_template :
  journal_uuid:string -> template_block_uuid:string -> string

val db_ident_block : namespace_:string option -> name:string -> string
val builtin_block : string -> string
val builtin_keyword_block : namespace_:string option -> name:string -> string
val view_block : string -> string
