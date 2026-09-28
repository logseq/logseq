(* User-facing strings, centralized until en.edn dict loading lands.
   Values match src/resources/dicts/en.edn so e2e text selectors hit. *)

let delete_page = "Delete page"
let convert_to_tag = "Convert to Tag"
let convert_tag_to_page = "Convert Tag to Page"
let convert_tag_to_page_desc =
  "Converting a tag to page also removes its tag properties and its tag \
   from all nodes tagged with it. Are you ok with that?"

let confirm = "Confirm"
let cancel = "Cancel"

(* app menu *)
let settings = "Settings"
let export_graph = "Export graph"
let import = "Import"
let login = "Login"

(* assets — en.edn :asset/* *)
let asset_align = "Align"
let asset_align_left = "Align left"
let asset_align_center = "Align center"
let asset_align_right = "Align right"
let asset_copy = "Copy image"
let asset_delete = "Delete image"
let asset_confirm_delete = "Are you sure you want to delete this image?"
let asset_already_exists title uuid =
  "Asset exists already, title: " ^ title ^ ", node reference: [[" ^ uuid
  ^ "]]"
let delete_page_title = "Delete page?"
let delete_page_desc = "Are you sure you want to delete this page?"
let page_not_found = "Page not found: "
let loading = "Loading..."
let go_to_journals = "Go to journals"
let unlinked_references = "Unlinked References"
let filter_placeholder = "Type to search"

(* graph view *)
let graph_settings = "Graph settings"
let graph_settings_saved_per_graph = "Saved per graph"
let graph_canvas_label = "Graph canvas"
let graph_time_travel = "Time travel"
let graph_time_travel_now = "Now"
let graph_view_mode = "View mode"
let graph_view_mode_tags = "Tags"
let graph_view_mode_all_pages = "All pages"
let graph_preparing = "Preparing"
let ui_close = "Close"
let recycle_title = "Recycle"
