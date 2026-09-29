(* Single i18n surface: en.edn-keyed lookups (t/tf/t1) plus the named
   helpers the areas used to keep in per-area tables
   (Strings/Views_i18n/Properties_i18n/Ui_strings/Graphs_text — all
   merged here).

   Dicts: Dicts_gen is generated at build time from the shared cljs
   dictionaries (src/resources/dicts/*.edn, see the rule in src/dune and
   tools/dict_gen.ml). Language follows the cljs :preferred-language
   signal — localStorage["preferred-language"] holds an EDN-quoted
   locale name (same read as Boot's document.lang wiring); a language
   change applies on the next app load, matching
   Settings_view.set_language.

   Lookup order for `t key`:
   - non-English: locale dict -> English path below
   - English: `en_overrides` (shipped text that deliberately differs
     from en.edn, e.g. casing kept for e2e/parity) -> en dict -> key.
   fn-valued cljs dict entries (plural/rich) are skipped by the
   generator; their OCaml call sites keep literal fns below. *)

(* substring search helpers (case-sensitive contains, case-insensitive
   contains/index) shared by popups, menus, icon picker, plugin list *)

let contains hay needle =
  let lh = String.length hay and ln = String.length needle in
  let rec go i = i + ln <= lh && (String.sub hay i ln = needle || go (i + 1)) in
  ln = 0 || go 0

let contains_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  contains h n

let index_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  let ln = String.length n and lh = String.length h in
  let rec go i =
    if ln = 0 || i + ln > lh then None
    else if String.sub h i ln = n then Some i
    else go (i + 1)
  in
  go 0

(* "{1}" / "{2}" placeholder substitution *)
let replace_all s pat rep =
  let plen = String.length pat in
  let b = Buffer.create (String.length s) in
  let i = ref 0 in
  while !i <= String.length s - plen do
    if String.sub s !i plen = pat then (
      Buffer.add_string b rep;
      i := !i + plen)
    else (
      Buffer.add_char b (String.get s !i);
      incr i)
  done;
  Buffer.add_string b (String.sub s !i (String.length s - !i));
  Buffer.contents b

(* positional substitution on a literal template *)
let sub s args =
  List.fold_left
    (fun (acc, i) a ->
      (replace_all acc ("{" ^ string_of_int i ^ "}") a, i + 1))
    (s, 1) args
  |> fst

(* cljs :preferred-language — an EDN-quoted string in localStorage *)
let unquote s =
  if String.length s >= 2 && String.get s 0 = '"'
     && String.get s (String.length s - 1) = '"'
  then String.sub s 1 (String.length s - 2)
  else s

let current_lang () =
  match Platform.local_storage_get "preferred-language" with
  | Some v -> unquote v
  | None -> "en"

let tbl_of arr =
  let h = Hashtbl.create (Array.length arr) in
  Array.iter (fun (k, v) -> Hashtbl.replace h k v) arr;
  h

(* lazy per-locale lookup tables over Dicts_gen.dicts *)
let locale_tbl =
  let cache = Hashtbl.create 8 in
  fun loc ->
    match Hashtbl.find_opt cache loc with
    | Some t -> t
    | None ->
        let t =
          match List.assoc_opt loc Dicts_gen.dicts with
          | Some arr -> Some (tbl_of arr)
          | None -> None
        in
        Hashtbl.replace cache loc t;
        t

let en_tbl = lazy (tbl_of Dicts_gen.en)

(* English text that ships different wording than en.edn — kept verbatim
   for e2e/DOM-parity while non-English lookups resolve through the same
   key. *)
let en_overrides = function
  | "ui/true" -> "true"
  | "ui/false" -> "false"
  | "property/use-choice-in-tag" -> "Use choice in #{1}"
  | "graph.switch/select-prompt" -> "Select a Graph"
  | "cmdk.group/current-page" -> "Current Page"
  | "view/unlinked-references" -> "Unlinked References"
  | "account/sign-in" -> "Sign in"
  | "publish/publish-error" -> "Publish failed. Please try again."
  | "graph/delete-server-action" -> "Delete remote graph"
  | "import/invalid-edn-file" -> "Invalid EDN file."
  | "flashcard.review/finished" ->
      "Congrats, you've reviewed all the cards for this query, see you \
       next time!"
  | "settings.editor/preferred-outdenting-tip" ->
      "The left side shows outdenting with the default setting, and the \
       right shows outdenting with logical outdenting enabled \
       \226\134\146 Learn more"
  | _ -> raise Not_found

let en_text key =
  try en_overrides key with
  | Not_found ->
      (try Hashtbl.find (Lazy.force en_tbl) key with
       | Not_found -> key)

let t (key : string) : string =
  match current_lang () with
  | "en" -> en_text key
  | loc ->
      (match locale_tbl loc with
       | Some tbl ->
           (try Hashtbl.find tbl key with Not_found -> en_text key)
       | None -> en_text key)

let tf (key : string) (args : string list) : string = sub (t key) args

let t1 key arg = replace_all (t key) "{1}" arg

let delete_page = t "page/delete"
let convert_to_tag = t "page/convert-to-tag"
let convert_tag_to_page = t "page.convert/tag-to-page-action"
let convert_tag_to_page_desc = t "page.convert/tag-to-page-confirm-desc"
let confirm = t "ui/confirm"
let cancel = t "ui/cancel"
let asset_align = t "asset/align"
let asset_align_left = t "asset/align-left"
let asset_align_center = t "asset/align-center"
let asset_align_right = t "asset/align-right"
let asset_copy = t "asset/copy"
let asset_delete = t "asset/delete"
let asset_confirm_delete = t "asset/confirm-delete-image"
let asset_already_exists title uuid = tf "asset/already-exists" [ title; uuid ]
let delete_page_title = t "page.delete/title"
let delete_page_desc = t "page.delete/confirm-title"
let page_not_found = t "page/not-found" ^ ": "
let loading = t "ui/loading"
let go_to_journals = t "command.go/journals"
let unlinked_references = t "view/unlinked-references"
let filter_placeholder = t "view.filter/type-to-search"
let add_to_favorites = t "page/add-to-favorites"
let unfavorite_page = t "page/unfavorite"
let settings = t "nav/settings"
let plugins = t "nav/plugins"
let recycle = t "storage.recycle/title"
let export_graph = t "export/graph"
let export_page = t "export/page"
let publish_page = t "publish/dialog-title"
let appearance = t "nav/appearance"
let help_handbook = t "help/handbook"
let help_shortcuts = t "help.shortcuts/label"
let help_docs = t "help/docs"
let help_bug = t "help/bug"
let help_feature = t "help/feature"
let help_feedback = t "help/submit-feedback"
let help_discord = t "help/ask-community"
let help_forum = t "help/support-forum"
let help_release_notes = t "help/release-notes"
let import_ = t "import/title"
let login = t "ui/login"
let graph_settings = t "graph/settings"
let graph_settings_saved_per_graph = t "graph/settings-saved-per-graph"
let graph_canvas_label = t "graph/canvas-label"
let graph_preparing = t "graph/preparing"
let ui_close = t "ui/close"
let recycle_title = t "storage.recycle/title"
let all = t "view/all"
let new_ = t "view/new"
let new_view = t "view/new-view"
let add_new_view = t "view/add-new-view"
let live_query n = tf "view.table/live-query-title" [ string_of_int n ]
let type_to_search = t "view.filter/type-to-search"
let no_matched_result = t "search/no-result"
let name_ = t "view.table/name-column"
let page_name = t "view.table/group-page-name"
let backlinks = t "page/backlinks"
let created_at = t "page/created-at"
let updated_at = t "page/updated-at"
let filter = t "view.filter/filter"
let rename = t "view/rename"
let delete = t "ui/delete"
let copied_view_nodes = t "export/view-nodes-data-copied"
let show_built_in_properties = t "query.builder/show-built-in-properties"
let is_empty = t "view.filter/is-empty"
let is_not_empty = t "view.filter/is-not-empty"
let empty_label = t "view.filter/empty"
let sort_ascending = t "view.table/sort-ascending"
let sort_descending = t "view.table/sort-descending"
let ascending = t "view.table/ascending"
let descending = t "view.table/descending"
let delete_sort = t "view.table/delete-sort"
let select_order = t "view.table/select-order"
let columns_visibility = t "view.table/columns-visibility"
let group_by = t "view.table/group-by"
let sort_groups_by = t "view.table/sort-groups-by"
let sort_groups_order = t "view.table/sort-groups-order"
let export_edn = t "view/export-edn"
let select_all = t "view.table/select-all"
let select_row = t "view.table/select-row"
let select_col = t "view.table/select-column"
let row_number = t "view.table/row-number"
let new_property = t "view/new-property"
let open_ = t "ui/open"
let open_in_sidebar = t "sidebar.right/open"
let table_view = t "property.view-type/table"
let list_view = t "property.view-type/list"
let gallery_view = t "property.view-type/gallery"
let new_node = t "node/new"
let pages = t "view.table/pages"
let no_group_value prop = tf "view.table/no-group-value" [ prop ]
let selected_count n = tf "view.table/selected-count" [ string_of_int n ]
let default_title n =
  (* en.edn :view.table/default-title is fn-valued (cljs str plural) — keep
     the OCaml-side literal *)
  string_of_int n ^ if n <= 1 then " Node" else " Nodes"
let page_label = t "view.table/page"
let match_all = t "view.filter/match-all-filters"
let match_any = t "view.filter/match-any-filter"
let set_query = t "block/set-query"
let batch_delete_title = t "page.delete/batch-confirm-title"
let total n = tf "view.table/total-count" [ string_of_int n ]
let yes = t "ui/yes"
let all_done = t "ui/all-done"
let operator_text = function
  | "is" -> t "view.filter/operator-is"
  | "is-not" -> t "view.filter/operator-is-not"
  | "text-contains" -> t "view.filter/operator-text-contains"
  | "text-not-contains" -> t "view.filter/operator-text-not-contains"
  | "date-before" -> t "view.filter/operator-date-before"
  | "date-after" -> t "view.filter/operator-date-after"
  | "before" -> t "view.filter/operator-before"
  | "after" -> t "view.filter/operator-after"
  | "number-gt" -> t "view.filter/operator-number-gt"
  | "number-lt" -> t "view.filter/operator-number-lt"
  | "number-gte" -> t "view.filter/operator-number-gte"
  | "number-lte" -> t "view.filter/operator-number-lte"
  | "between" -> t "view.filter/operator-between"
  | _ -> t "view.filter/operator-is"
let timestamp_options =
  [ ("1 day ago", t "view.filter/relative-1-day-ago")
  ; ("3 days ago", t "view.filter/relative-3-days-ago")
  ; ("1 week ago", t "view.filter/relative-1-week-ago")
  ; ("1 month ago", t "view.filter/relative-1-month-ago")
  ; ("3 months ago", t "view.filter/relative-3-months-ago")
  ; ("1 year ago", t "view.filter/relative-1-year-ago")
  ; ("custom-date", t "view.filter/custom-date") ]
let builder_add_filter_placeholder = t "query.builder/add-filter-or-operator-placeholder"
let builder_filter = t "query.builder/filter"
let builder_all_values = t "query.builder/all-values-label"
let builder_between_start = t "query.builder/between-start-label"
let builder_between_end = t "query.builder/between-end-label"
let builder_between_journal a b = tf "query.builder/between-journal-label" [ a; b ]
let builder_created = t "query.builder/created-label"
let builder_updated = t "query.builder/updated-label"
let builder_search s = tf "query.builder/search-label" [ s ]
let builder_show_builtin = t "query.builder/show-built-in-properties"
let builder_unwrap = t "query.builder/unwrap-operator"
let builder_wrap_label = t "query.builder/wrap-filter-with-label"
let builder_replace_label = t "query.builder/replace-with-label"
let select_prompt = t "select/default-prompt"
let select_multi_prompt = t "select/default-select-multiple"
let new_option s = tf "select/new-option" [ s ]
let apply = t "ui/apply"
let submit = t "ui/submit"
let loading_ = t "view/loading-label"
let true_ = t "ui/true"
let false_ = t "ui/false"
let group_journal_date = t "view.table/group-journal-date"
let group_page_name = t "view.table/group-page-name"
let group_page_updated = t "view.table/group-page-updated-date"
let group_page_created = t "view.table/group-page-created-date"
let filter_tags = t "property.built-in/tags"
let filter_page_ref = t "query.builder/filter-page-reference-label"
let filter_property = t "class.built-in/property"
let filter_task = t "class.built-in/task"
let filter_priority = t "property.built-in/priority"
let filter_page = t "query.builder/filter-page-label"
let filter_full_text = t "query.builder/filter-full-text-search-label"
let filter_sample = t "query.builder/filter-sample-label"
let op_and = t "query.builder/operator-and-label"
let op_or = t "view.filter/or"
let op_not = t "query.builder/operator-not-label"
let all_graphs = t "graph/all-graphs"
let create_new_graph = t "graph/create-new"
let local_graphs = t "graph/local-graphs"
let open_in_another_tab = t "graph/open-in-another-tab-action"
let remote_graphs = t "graph/remote-graphs"
let refresh = t "ui/refresh"
let restore = t "storage.recycle/restore"
let graph_name_placeholder = t "graph/name-placeholder"
let last_opened_at ts = tf "graph/last-opened-at-label" [ ts ]
let already_exists name = tf "graph/already-exists-error" [ name ]
let delete_local_graph = t "graph/delete-local-action"
let delete_remote_graph = t "graph/delete-server-action"
let delete_local_confirm name = tf "graph/delete-local-confirm-desc" [ name ]
let delete_remote_confirm name = tf "graph/delete-server-confirm-desc" [ name ]
let delete_warning = t "graph/delete-warning"
let removed name = tf "graph/removed" [ name ]
let removed_redirecting name next = tf "graph/removed-and-redirecting" [ name; next ]
let name_reserved_warning = t "graph.validation/name-reserved-characters-warning"
let creating = t "graph/creating"
let use_sync_label = t "graph/use-sync-label"
let encrypt_data_label = t "graph/encrypt-data-label"
let import_existing_notes = t "import/notes"
let import_later = t "onboarding.import-option/desc"
let import_title = t "onboarding.import/title"
let import_desc = t "onboarding.import/desc"
let import_sqlite_desc = t "onboarding.import/sqlite-desc"
let import_sqlite_zip_title = t "import/sqlite-and-assets-title"
let import_sqlite_zip_desc = t "import/sqlite-and-assets-desc"
let import_file_graph_title = t "import/file-to-db-title"
let import_file_graph_desc = t "import/file-to-db-desc"
let import_debug_transit_title = t "import/debug-transit-title"
let import_debug_transit_desc = t "import/debug-transit-desc"
let import_db_edn_title = t "import/db-edn-title"
let import_db_edn_desc = t "import/db-edn-desc"
let import_new_graph_name = t "import/new-graph-name"
let set_graph_name = t "import/set-graph-name-label"
let import_empty_name = t "import/empty-graph-name"
let invalid_name = t "graph.validation/name-invalid"
let import_name_conflict = t "import/graph-name-conflict"
let import_finished label graph = tf "import/finished-redirect-success" [ label; graph ]
let import_failed = t "import/import-error"
let import_invalid_edn = t "import/invalid-edn-file"
let import_unsupported kind = tf "import/unsupported-error" [ kind ]
let import_sqlite_title = t "import/sqlite-label"
let export_title = t "export/title"
let export_sqlite_db = t "export/sqlite-db"
let export_sqlite_zip = t "export/zip"
let export_edn_file = t "export/db-edn"
let export_markdown = t "export/markdown"
let export_debug_transit = t "export/debug-transit-file"
let export_debug_transit_desc = t "export/debug-transit-desc"
let export_sqlite_desc = t "export.backup/sqlite-desc"
let export_zip_desc = t "export.backup/zip-desc"
let export_edn_desc = t "export/edn-desc"
let export_zip_error = t "export/zip-error"
let export_validation_failed = t "export/validation-error"
let login_title = t "account/sign-in"
let login_username = t "account/username"
let login_password = t "account/password"
let login_failed = t "account/sign-in-error"
let settings_title = t "nav/settings"
let theme_label = t "mobile.settings/theme"
let theme_light = t "settings.general/theme-light"
let theme_dark = t "settings.general/theme-dark"
let theme_system = t "settings.general/theme-system"
let language_label = t "settings.general/language"
let recycle_retention = t "storage.recycle/retention-desc"
let recycle_empty = t "storage.recycle/empty"
let recycle_page_deleted ts = tf "storage.recycle/page-deleted-at" [ ts ]
let recycle_block_deleted ts = tf "storage.recycle/block-deleted-at" [ ts ]
let recycle_delete_confirm_page = t "storage.recycle/delete-page-confirm-desc"
let recycle_delete_confirm_block = t "storage.recycle/delete-block-confirm-desc"
let restored name = tf "storage.recycle/restored-feedback" [ name ]
let close = t "ui/close"
let settings_general = t "settings/general"
let settings_editor = t "settings/editor"
let settings_keymap = t "settings/keymap"
let settings_advanced = t "settings/advanced"
let settings_features = t "settings/features"
let current_version = t "settings.general/current-version"
let changelog = t "settings.general/changelog"
let switch_to_theme name = tf "theme/switch-to" [ name ]
let editor_font = t "settings.general/editor-font"
let editor_font_global = t "settings.general/editor-font-set-global"
let accent_color = t "settings.general/accent-color"
let accent_color_alert = t "settings.general/accent-color-alert"
let accent_color_logseq = t "settings.general/accent-color-logseq"
let accent_color_none = t "settings.general/accent-color-none-desc"
let color_tomato = t "color/tomato"
let color_red = t "color/red"
let color_crimson = t "color/crimson"
let color_pink = t "color/pink"
let color_plum = t "color/plum"
let color_purple = t "color/purple"
let color_violet = t "color/violet"
let color_indigo = t "color/indigo"
let color_blue = t "color/blue"
let color_cyan = t "color/cyan"
let color_teal = t "color/teal"
let color_green = t "color/green"
let color_grass = t "color/grass"
let color_orange = t "color/orange"
let config_custom_configuration = t "settings.general/custom-configuration"
let edit_config_edn = t "settings.general/edit-config-edn"
let config_custom_theme = t "settings.general/custom-theme"
let edit_custom_css = t "settings.general/edit-custom-css"
let current_revision_prefix = t "settings.general/current-revision-label"
let revision_title v = tf "settings.general/revision" [ v ]
let custom_date_format = t "settings.editor/custom-date-format"
let show_brackets = t "settings.editor/show-brackets"
let wide_mode = t "settings.editor/wide-mode"
let logical_outdenting = t "settings.editor/preferred-outdenting"
let show_full_blocks = t "settings.editor/show-full-blocks"
let preferred_pasting = t "settings.editor/preferred-pasting-file"
let auto_expand_refs = t "settings.editor/auto-expand-block-refs"
let outdenting_hint = t "settings.editor/preferred-outdenting-tip"
let pasting_hint = t "settings.editor/preferred-pasting-file-hint"
let auto_expand_hint = t "settings.editor/auto-expand-block-refs-tip"
let shortcut_tooltip = t "settings.editor/enable-shortcut-tooltip"
let tooltips = t "settings.editor/enable-tooltip"
let all_pages_public = t "settings.editor/enable-all-pages-public"
let usage_diagnostics = t "settings.advanced/disable-sentry"
let usage_diagnostics_desc = t "settings.advanced/disable-sentry-desc"
let developer_mode = t "settings.advanced/developer-mode"
let developer_mode_desc = t "settings.advanced/developer-mode-desc"
let sync_server_url = t "settings.sync-server/url"
let publish_server_url = t "settings-page/publish-server-url"
let sync_url_desc = t "settings.sync-server/url-desc"
let publish_url_desc = t "settings-page/publish-server-url-desc"
let publish_default = t "settings-page/publish-server-url-default"
let reset_default = t "settings.sync-server/reset"
let url_invalid = t "settings.sync-server/url-invalid-error"
let sync_saved = t "settings.sync-server/save-success"
let sync_cleared = t "settings.sync-server/clear-success"
let publish_saved = t "settings-page/publish-server-url-saved"
let publish_cleared = t "settings-page/publish-server-url-cleared"
let home_default_page = t "settings.features/home-default-page"
let home_updated = t "settings.features/home-default-page-update-success"
let page_not_found_msg name = tf "settings.features/page-not-found" [ name ]
let plugins_label = t "settings/plugins"
let flashcards = t "settings.features/enable-flashcards"
let refresh_required = t "settings.general/refresh-required-feedback"
let save = t "ui/save"
let keymap_all = t "keymap/all"
let keymap_custom = t "keymap/custom"
let keymap_unset = t "keymap/unset"
let keymap_disabled = t "keymap/disabled"
let keymap_search_placeholder = t "keymap/search-placeholder"
let keymap_search_by_keys = t "keymap/search-by-keys"
let keymap_toggle_categories = t "keymap/toggle-categories-pane"
let keymap_refresh_all = t "keymap/refresh-all"
let pin = t "view.table/pin"
let unpin = t "view.table/unpin"
let cannot_go_to_internal_page = t "nav/cannot-go-to-internal-page"
let e2ee_enter_password_title = t "encryption/enter-password-title"
let e2ee_set_password_title = t "encryption/set-password-title"
let e2ee_password_ph = t "encryption/enter-password"
let e2ee_password_again_ph = t "encryption/enter-password-again"
let e2ee_password_not_matched = t "encryption/password-not-matched"
