(* Shared check helpers + Model builders for the deps/ui unit tests. *)

let checks = ref 0
let failures = ref 0

let check name cond =
  incr checks;
  if not cond then (
    incr failures;
    Js.log ("FAIL: " ^ name))

let eq name expected actual to_string =
  check
    (name ^ " (expected " ^ to_string expected ^ ", got " ^ to_string actual
   ^ ")")
    (expected = actual)

let eqs name expected actual = eq name expected actual Fun.id
let eqi name expected actual = eq name expected actual string_of_int

let block ?(children = []) uuid title : Model.block =
  { Model.block_uuid = Some uuid
  ; block_is_query = false
  ; block_db_id = None
  ; block_title = title
  ; block_level = 1
  ; block_tag_ids = []
  ; block_tags = []
  ; block_tag_uuids = []
  ; block_tag_idents = []
  ; block_tag_db_ids = []
  ; block_children = children
  ; block_page_name = None
  ; block_page_uuid = None
  ; block_reactions = []
  ; block_is_comments_area = false
  ; block_is_comment = false
  ; block_comment_targets = 0
  ; block_comment_target_ids = []
  ; block_link = None
  ; block_embed_children = []
  ; block_is_page = false
  ; block_heading = None
  ; block_default_collapsed = false
  ; block_asset_type = None
  ; block_asset_url = None
  ; block_asset_width = None
  ; block_asset_height = None
  ; block_asset_resize = None
  ; block_asset_align = None
  ; block_display_type = None
  ; block_order_list = None
  ; block_order_index = None
  ; block_order = None
  ; block_code_lang = None
  ; block_db_collapsable = false
  ; block_icon = None
  ; block_tag_icons = []
  ; block_ls_type = None
  ; block_hl_type = None
  ; block_hl_page = None
  ; block_hl_color = None
  ; block_hl = None
  ; block_asset_ref = None
  ; block_hl_image = None
  }

let page blocks : Model.page =
  { Model.page_title = "p"
  ; page_uuid = Some "p"
  ; page_db_collapsable = false
  ; page_db_id = None
  ; page_is_tag = false
  ; page_is_property = false
  ; page_icon = None
  ; page_journal_day = None
  ; page_is_library = false
  ; page_internal = false
  ; page_built_in = false
  ; page_add_object = false
  ; page_tags = []
  ; page_tag_idents = []
  ; page_tag_uuids = []
  ; page_tag_db_ids = []
  ; page_blocks = blocks
  ; page_linked_refs = []
  ; page_parents = []
  }

let titles (p : Model.page) =
  List.map (fun (b : Model.block) -> b.block_title) p.page_blocks
