(* User-facing strings for the graphs/dialogs/settings/import/export areas.
   Values mirror src/resources/dicts/en.edn so e2e text selectors hit.
   TODO(shared): Strings (src/core/strings.ml) is owned by another area —
   merge this table into the shared i18n layer when dict loading lands. *)

(* "{1}" "{2}" positional substitution, matching cljs i18n placeholders *)
let replace_all hay pat rep =
  let plen = String.length pat and hlen = String.length hay in
  let buf = Buffer.create hlen in
  let rec go i =
    if i >= hlen - plen + 1 then
      Buffer.add_substring buf hay i (hlen - i)
    else if String.sub hay i plen = pat then (
      Buffer.add_string buf rep;
      go (i + plen))
    else (
      Buffer.add_char buf hay.[i];
      go (i + 1))
  in
  go 0;
  Buffer.contents buf

let sub s args =
  List.fold_left
    (fun acc (i, a) ->
      replace_all acc ("{" ^ string_of_int (i + 1) ^ "}") a)
    s (List.mapi (fun i a -> (i, a)) args)

let all_graphs = "All graphs"
let create_new_graph = "Create a new graph"
let local_graphs = "Local graphs:"
let remote_graphs = "Remote graphs:"
let refresh = "Refresh"
let submit = "Submit"
let cancel = "Cancel"
let confirm = "Confirm"
let delete = "Delete"
let restore = "Restore"
let graph_name_placeholder = "your graph name"
let last_opened_at ts = sub "Last opened at: {1}" [ ts ]
let already_exists name =
  sub "The graph '{1}' already exists. Please try again with another name."
    [ name ]
let delete_local_graph = "Delete local graph"
let delete_remote_graph = "Delete remote graph"
let delete_local_confirm name =
  sub
    "Are you sure you want to permanently delete the graph \"{1}\" from \
     Logseq?"
    [ name ]
let delete_remote_confirm name =
  sub
    "Are you sure you want to permanently delete the graph \"{1}\" from our \
     server?"
    [ name ]
let delete_warning =
  "\226\154\160\239\184\143 Notice that we can't recover this graph after \
   being deleted. Make sure you have backups before deleting it."
let removed name = sub "Removed graph \"{1}\"" [ name ]
let removed_redirecting name next =
  sub "Removed graph \"{1}\". Redirecting to graph \"{2}\"" [ name; next ]
let name_reserved_warning =
  "Graph name can't contain following reserved characters:"
let creating = "Creating graph"
let use_sync_label = "Use Logseq Sync?"
let encrypt_data_label = "Encrypt graph data"
let import_title = "Do you already have notes that you want to import?"
let import_desc =
  "If they are in an EDN or Markdown format Logseq can work with them."
let import_sqlite_desc =
  "Import a SQLite DB Export of your Logseq graph into a new DB graph"
let import_sqlite_zip_title = "SQLite + assets (.zip)"
let import_sqlite_zip_desc =
  "Import a zip containing db.sqlite and an assets folder"
let import_file_graph_title = "File to DB graph"
let import_file_graph_desc =
  "Import a file-based Logseq graph folder into a new DB graph"
let import_debug_transit_title = "Debug Transit"
let import_debug_transit_desc =
  "Import debug transit file into a new DB graph"
let import_db_edn_title = "EDN to DB graph"
let import_db_edn_desc =
  "Import a DB graph's EDN export into a new DB graph"
let import_new_graph_name = "New graph name"
let set_graph_name = "Set graph name"
let import_empty_name = "Empty graph name."
let invalid_name = "Invalid graph name"
let import_name_conflict =
  "Please specify another name as another graph with this name already \
   exists!"
let import_finished label graph =
  sub "{1} import finished! Redirecting to \"{2}\"" [ label; graph ]
let import_failed = "Import failed"
let import_invalid_edn = "Invalid EDN file."
let import_unsupported kind =
  sub "{1} import is not supported yet." [ kind ]
let import_sqlite_title = "SQLite DB"
let export_title = "Export"
let export_sqlite_db = "Export SQLite DB"
let export_sqlite_zip = "Export both SQLite DB and assets"
let export_edn = "Export EDN file"
let export_markdown = "Export as standard Markdown (no block properties)"
let export_debug_transit = "Export debug transit file"
let export_debug_transit_desc =
  "Exports to a .transit file to send to us for debugging. Any sensitive \
   data will be removed in the exported file."
let export_sqlite_desc = "Exports the graph's SQLite DB file."
let export_zip_desc = "Exports the SQLite DB plus the graph's assets."
let export_edn_desc =
  "Exports to a readable and editable .edn file. Don't rely on this as a \
   primary backup."
let export_zip_error = "Export zip failed."
let export_validation_failed = "Graph validation failed"
let login_title = "Sign in"
let login_username = "Username"
let login_password = "Password"
let login_failed = "Sign in failed"
let settings_title = "Settings"
let theme_label = "Theme"
let theme_light = "light"
let theme_dark = "dark"
let theme_system = "system"
let language_label = "Language"
let recycle_retention =
  "Deleted pages and blocks stay here until restored or automatically \
   garbage collected after 30 days."
let recycle_empty = "Recycle is empty."
let recycle_page_deleted ts = sub "Page deleted {1}" [ ts ]
let recycle_block_deleted ts = sub "Block deleted {1}" [ ts ]
let recycle_delete_confirm_page =
  "Permanently delete this page from Recycle? This cannot be undone."
let recycle_delete_confirm_block =
  "Permanently delete this block from Recycle? This cannot be undone."
let restored name = sub "Restored \"{1}\"" [ name ]
let close = "Close"

(* ---- settings page/dialog (components/settings.cljs) ---- *)
let settings_general = "General"
let settings_editor = "Editor"
let settings_keymap = "Keymap"
let settings_advanced = "Advanced"
let settings_features = "Features"
let current_version = "Current version"
let changelog = "What's new?"
let switch_to_theme name = sub "Switch to {1} theme" [ name ]
let editor_font = "Font"
let editor_font_global = "Set as global font family"
let accent_color = "Accent color"
let accent_color_alert =
  "Choosing an accent color may override any theme you have selected."
let accent_color_logseq = "Logseq classic color"
let accent_color_none =
  "Cancel accent color. This is currently in beta stage and mainly used \
   for compatibility with custom themes."
let color_tomato = "Tomato"
let color_red = "Red"
let color_crimson = "Crimson"
let color_pink = "Pink"
let color_plum = "Plum"
let color_purple = "Purple"
let color_violet = "Violet"
let color_indigo = "Indigo"
let color_blue = "Blue"
let color_cyan = "Cyan"
let color_teal = "Teal"
let color_green = "Green"
let color_grass = "Grass"
let color_orange = "Orange"
let config_custom_configuration = "Custom configuration"
let edit_config_edn = "Edit config.edn"
let config_custom_theme = "Custom theme"
let edit_custom_css = "Edit custom.css"
let current_revision_prefix = "Current Revision: "
let revision_title v = sub "Revision: {1}" [ v ]
let custom_date_format = "Preferred date format"
let show_brackets = "Show brackets"
let wide_mode = "Wide mode"
let logical_outdenting = "Logical outdenting"
let show_full_blocks = "Show all lines of a block reference"
let preferred_pasting = "Prefer pasting file"
let auto_expand_refs = "Expand block references automatically when zoom-in"

let outdenting_hint =
  "The left side shows outdenting with the default setting, and the \
   right shows outdenting with logical outdenting enabled → Learn more"

let pasting_hint =
  "When enabled, pasting an image from the internet will download and \
   insert the image. When disabled, it will paste the link to the \
   image."

let auto_expand_hint =
  "This option controls whether to expand the block references \
   automatically when zoom-in."
let shortcut_tooltip = "Enable shortcut tooltip"
let tooltips = "Tooltips"
let all_pages_public = "All pages public when publishing"
let usage_diagnostics = "Send usage data and diagnostics to Logseq"
let usage_diagnostics_desc =
  "Logseq will never collect your local graph database or sell your data."
let developer_mode = "Developer mode"
let developer_mode_desc =
  "Developer mode helps contributors and extension developers test their \
   integrations with Logseq more efficiently."
let sync_server_url = "Sync Server URL"
let publish_server_url = "Publish Server URL"
let sync_url_desc =
  "Set a custom HTTPS sync server URL for self-hosted sync. Your Logseq \
   authentication tokens will be sent to this server, so only use a \
   trusted URL. Leave empty to use the official Logseq Sync."
let publish_url_desc =
  "Set a custom HTTPS publish server URL for self-hosted single-page \
   publishing. Your Logseq authentication tokens will be sent to this \
   server, so only use a trusted URL. Leave empty to use the official \
   Logseq Publish service."
let publish_default = "Logseq Publish"
let reset_default = "Reset to default"
let url_invalid = "URL must start with https:// or http://"
let sync_saved = "Sync server URL saved."
let sync_cleared = "Sync server URL cleared. Using official Logseq Sync."
let publish_saved = "Publish server URL saved."
let publish_cleared =
  "Publish server URL cleared. Using official Logseq Publish."
let home_default_page = "Set the default home page"
let home_updated = "Home default page updated successfully!"
let page_not_found_msg name =
  sub
    "The page \"{1}\" doesn't exist yet. Please create that page first, \
     and then try again."
    [ name ]
let plugins_label = "Plugins"
let flashcards = "Flashcards"
let refresh_required =
  "Please refresh the app for this change to take effect"
let save = "Save"
let keymap_all = "All"
let keymap_custom = "Custom"
let keymap_unset = "Unset"
let keymap_disabled = "Disabled"
let keymap_search_placeholder = "Search shortcuts..."
let keymap_search_by_keys = "Search by keys"
let keymap_toggle_categories = "Toggle categories pane"
let keymap_refresh_all = "Refresh all"
