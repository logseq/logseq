val is_ignored_path : dir:string -> path:string -> bool
val is_allowed_file_path : string -> bool
val is_visible_filesystem_entry : name:string -> is_symbolic_link:bool -> bool
val default_graphs_dir : environment_value:string option -> string
val home_relative_suffix : string -> string option
val normalize_filesystem_path : win32:bool -> string -> string
val canonical_db_graph_repos : string Rrbvec.t -> string Rrbvec.t
