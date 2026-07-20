val app_name : string
val asset_protocol : string
val db_version_prefix : string
val file_version_prefix : string
val default_graphs_dir : string
val local_assets_dir : string
val unlinked_graphs_dir : string
val favorites_page_name : string
val views_page_name : string
val library_page_name : string
val quick_add_page_name : string
val recycle_page_name : string
val block_pattern : string
val unused_in_db_graphs_deprecation : string
val strip_leading_db_version_prefix : string -> string
val canonicalize_db_version_repo : string -> string option
val is_local_relative_asset : string -> bool
val is_local_protocol_asset : string -> bool
val is_protocol_path : string -> bool
val remove_asset_protocol : string -> string
val is_text_format : string -> bool
val is_image_format : string -> bool
val text_format_keys : unit -> string array
val image_format_keys : unit -> string array
val is_hidden : string -> string array -> bool
val file_only_config_keys : unit -> string array
val file_only_config_description : string -> string option
