val split_first : string -> string -> (string * string) option
val split_last : string -> string -> (string * string) option
val is_valid_tag : string -> bool
val safe_substring : string -> start:int -> string
val safe_substring_range : string -> start:int -> end_:int -> string
val is_wrapped_by_quotes : string -> bool
val is_wrapped_by_parens : string -> bool
val zero_pad : int -> string
val clear_markdown_heading : string -> string
val normalize_nfc : string -> string
val remove_boundary_slashes : string -> string
val split_namespace_pages : string -> string Rrbvec.t
val page_name_sanity : string -> string
val page_name_sanity_lower : string -> string
val capitalize_all : string -> string
val decode_uri_component : string -> (string, string) result
val is_url : string -> bool
val url_encoded_pattern : Js.Re.t
val normalize_format_name : string -> string
val join : separator:string -> string Rrbvec.t -> string
val path_file_extension : string -> string option
val file_format_name : string -> string option
val file_extension : string -> string option
val join_path_segments : string Rrbvec.t -> string
val escape_regex_chars : string -> string
val replace_ignore_case : string -> string -> string -> string
val is_valid_edn_keyword : string -> bool
val re_find : Js.Re.t -> string -> string option Rrbvec.t option
val uuid_pattern : string
