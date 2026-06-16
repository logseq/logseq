type parsed = { ids : Cli_primitive.db_id list; multi : bool }

val valid_id : Cli_primitive.db_id -> bool
val parse_id_string : string -> parsed Error.build_result
val to_single : parsed -> Cli_primitive.db_id option
