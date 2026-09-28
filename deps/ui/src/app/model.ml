(* App model — immutable snapshot consumed by the LUI view. *)

type route =
  | Home (* today's journal, or default-home config page *)
  | Page of string (* name or uuid *)
  | Block_zoom of string
  | Journals
  | Library
  | All_pages
  | All_graphs
  | Import
  | Settings
  | Not_found of string

type block =
  { block_uuid : string option
  ; block_db_id : int option
  ; block_title : string
  ; block_level : int
  ; block_tag_ids : int list (* block/tags ref ids from the pull *)
  ; block_tags : string list (* resolved tag titles, for .block-tags *)
  ; block_display_type : string option (* logseq.property.node/display-type *)
  ; block_order_list : string option (* logseq.property/order-list-type *)
  ; block_order_index : int option (* 1-based position among list siblings *)
  ; block_code_lang : string option (* logseq.property.code/lang *)
  ; block_tag_uuids : string list (* aligned with block_tags *)
  ; block_tag_idents : string list (* resolved tag idents, same filtering *)
  ; block_page_name : string option (* containing page, for ref rows *)
  ; block_reactions : (string * int) list (* emoji-id, count *)
  ; block_is_comments_area : bool
  ; block_is_comment : bool
  ; block_comment_targets : int (* live :comments/blocks target count *)
  ; block_children : block list
  ; (* db id of a :block/link target — the block renders the linked
       page's blocks instead of its own children *)
    block_link : int option
  ; (* fetched blocks of the linked entity; never written back by
       structure ops (they belong to the source page) *)
    block_embed_children : block list
  ; block_is_page : bool
  ; block_heading : int option (* resolved h1..h6 level *)
    (* page-typed outline child (carries block/name; cljs entity/page?) *)
  ; block_default_collapsed : bool
    (* page children render collapsed outside the Library page
       (cljs block-default-collapsed?) — set per containing page view *)
  ; block_asset_type : string option (* logseq.property.asset/type *)
  ; block_asset_url : string option (* logseq.property.asset/external-url *)
  ; block_asset_width : int option (* logseq.property.asset/width *)
  ; block_asset_height : int option (* logseq.property.asset/height *)
  ; block_asset_resize : int option (* resize-metadata width *)
  ; block_asset_align : string option (* logseq.property.asset/align *)
  }

type page =
  { page_title : string
  ; page_uuid : string option
  ; page_db_id : int option
  ; page_is_tag : bool
  ; page_is_property : bool
  ; page_icon : (string * string) option (* (type, id) from logseq.property/icon *)
  ; page_journal_day : int option
  ; page_is_library : bool
  ; (* entity predicates used by menu/convert actions:
       internal-page? = tagged with :logseq.class/Page;
       built-in? = :logseq.property/built-in? *)
    page_internal : bool
  ; page_built_in : bool
  ; (* objects.cljs: class-objects "new object" unless the class ident is
       private (worker-computed "add-object?") *)
    page_add_object : bool
  ; page_tags : string list
  ; page_blocks : block list
  ; page_linked_refs : block list (* linked references, for journal items *)
  ; page_parents : block list (* block-zoom breadcrumb chain, root first *)
  }

type phase =
  | Booting
  | Ready
  | Failed of string

(* modal confirm intent — carried as data so it survives the reducer *)
type confirm =
  | Confirm_delete_page of string (* page uuid *)
  | Confirm_convert_tag_to_page of int (* class db/id *)
  | Confirm_delete_asset of string (* asset block uuid *)

(* worker :notification broadcast -> toast *)
type toast =
  { toast_id : int
  ; toast_text : string
  ; toast_kind : string (* "success" | "error" | "warning" | ... *)
  }

type t =
  { phase : phase
  ; repo : string option
  ; route : route
  ; route_page : page option
  ; page_missing : bool (* page/block route resolved to nothing — cljs
                           renders inline (t :page/not-found), keeping
                           the chrome, not the route-level 404 *)
  ; journals : page list
  ; page_refs : block list
  ; unlinked_refs : block list
  ; repos : string list
  ; theme_dark : bool
  ; left_sidebar_open : bool
  ; right_sidebar_open : bool
  ; editing_title : bool
  ; page_menu : (float * float * bool) option
    (* click position + with_app_items (toolbar dots vs page context menu) *)
  ; appearance : (float * float) option
    (* cljs :ui/toggle-appearance popup anchored to .toolbar-dots-btn *)
  ; confirm : confirm option
  ; toasts : toast list
  ; toast_next : int
  ; unlinked_open : bool
  ; unlinked_search : bool
  ; unlinked_query : string
  ; help_open : bool
  ; unlinked_blocks : block list
  }

let initial =
  { phase = Booting
  ; repo = None
  ; route = Home
  ; route_page = None
  ; page_missing = false
  ; journals = []
  ; page_refs = []
  ; unlinked_refs = []
  ; repos = []
  ; theme_dark = false
  ; left_sidebar_open =
      (* cljs: (boolean (storage/get :ls-left-sidebar-open?)) — nil -> false *)
      (match Platform.local_storage_get "ls-left-sidebar-open?" with
       | Some "true" -> true
       | _ -> false)
  ; right_sidebar_open = false
  ; editing_title = false
  ; page_menu = None
  ; appearance = None
  ; confirm = None
  ; toasts = []
  ; toast_next = 0
  ; unlinked_open = true
  ; unlinked_search = false
  ; unlinked_query = ""
  ; help_open = false
  ; unlinked_blocks = []
  }

(* optimistic reorder for move-up/down: only handles the common case of a
   contiguous run of top-level blocks; anything else is left for the worker
   refresh to reconcile *)
let move_selected_top_blocks (page : page) (uuids : string list) (up : bool)
    : page =
  let sel = List.sort_uniq compare uuids in
  let idx =
    List.mapi (fun i b -> (b, i)) page.page_blocks
    |> List.filter_map (fun (b, i) ->
           match b.block_uuid with
           | Some u when List.mem u sel -> Some (i, b)
           | _ -> None)
  in
  match idx with
  | [] -> page
  | _ ->
      let positions = List.map fst idx in
      let contiguous =
        match positions with
        | first :: rest ->
            snd
              (List.fold_left
                 (fun (expected, ok) i -> (expected + 1, ok && i = expected))
                 (first + 1, true) rest)
        | [] -> false
      in
      if not contiguous then page
      else
        let first = List.hd positions in
        let n = List.length positions in
        if up && first = 0 then page
        else if (not up) && first + n >= List.length page.page_blocks then page
        else
          let arr = Array.of_list page.page_blocks in
          if up then (
            let pivot = arr.(first - 1) in
            Array.blit arr first arr (first - 1) n;
            arr.(first - 1 + n) <- pivot)
          else (
            let pivot = arr.(first + n) in
            Array.blit arr first arr (first + 1) n;
            arr.(first) <- pivot);
          { page with page_blocks = Array.to_list arr }
