(* App model — immutable snapshot consumed by the LUI view. *)

type route =
  | Home (* today's journal, or default-home config page *)
  | Page of string (* name or uuid *)
  | Block_zoom of string
  | Journals
  | Library
  | All_pages
  | All_graphs
  | Graph_view
  | Import
  | Settings
  | Not_found of string

type icon =
  { icon_kind : string (* "emoji" | "tabler-icon" *)
  ; icon_id : string
  }

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
  ; block_order : string option
    (* :block/order fractional key — child-list membership patches from
       worker deltas sort on it (cljs patch-items sort-by (str order)) *)
  ; block_code_lang : string option (* logseq.property.code/lang *)
  ; block_tag_uuids : string list (* aligned with block_tags *)
  ; block_tag_idents : string list (* resolved tag idents, same filtering *)
  ; block_tag_db_ids : int list (* aligned with block_tags — chip ctx menu *)
  ; block_page_name : string option (* containing page, for ref rows *)
  ; block_page_uuid : string option (* containing page uuid — ref-group
                                       namespace breadcrumbs resolve the
                                       page's ancestors through it *)
  ; block_reactions : (string * int) list (* emoji-id, count *)
  ; block_is_comments_area : bool
  ; block_is_comment : bool
  ; block_comment_targets : int (* live :comments/blocks target count *)
  ; block_comment_target_ids : int list (* db-ids of :comments/blocks refs *)
  ; block_icon : icon option (* logseq.property/icon on the block *)
  ; block_tag_icons : icon list (* logseq.property/icon of each tag *)
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
  ; block_is_query : bool
    (* db/id == parent's logseq.property/query ref — renders the query
       builder instead of plain content (cljs query-block? branch) *)
  ; block_db_collapsable : bool
    (* cljs db-collapsable?: entity carries property keys other than
       internal created-* ones (logseq.property/query etc.) *)
  ; block_ls_type : string option (* logseq.property/ls-type *)
    (* pdf annotation props — on Pdf-annotation child blocks *)
  ; block_hl_type : string option (* logseq.property.pdf/hl-type *)
  ; block_hl_page : int option (* logseq.property.pdf/hl-page *)
  ; block_hl_color : string option (* hl-value properties.color *)
  ; block_hl : hl option (* logseq.property.pdf/hl-value *)
  ; block_asset_ref : int option (* logseq.property/asset ref db/id *)
  ; block_hl_image : int option (* logseq.property.pdf/hl-image ref db/id *)
  }

(* pdf hl record — logseq.property.pdf/hl-value map. Scaled positions
   carry pdf-space coords (x1/y1/x2/y2/width/height); vw rects carry
   viewport px (left/top/width/height) — one record shape for both. *)
and hl_rect =
  { hl_x1 : float
  ; hl_y1 : float
  ; hl_x2 : float
  ; hl_y2 : float
  ; hl_w : float
  ; hl_h : float
  }

and hl =
  { hl_id : string option (* annotation block uuid *)
  ; hl_page : int
  ; hl_bounding : hl_rect
  ; hl_rects : hl_rect list
  ; hl_text : string
  ; hl_image : int64 option (* image asset block db/id (or Date.now
                               timestamp while the area crop persists) *)
  ; hl_color : string option
  }

(* cljs pdf-assets/inflate-asset — an open pdf asset *)
type pdf_asset =
  { pdf_key : string (* stable identity source *)
  ; pdf_block_uuid : string option
  ; pdf_block_db_id : int option
  ; pdf_block_external_url : string option
  ; pdf_identity : string (* last 15 chars of key — container id suffix *)
  ; pdf_filename : string
  ; pdf_url : string
  ; pdf_original_path : string
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
  ; page_tag_idents : string list (* aligned with page_tags *)
  ; page_tag_uuids : string list (* aligned — chip ctx menu *)
  ; page_tag_db_ids : int list (* aligned with page_tags *)
  ; page_blocks : block list
  ; page_linked_refs : block list (* linked references, for journal items *)
  ; page_parents : block list (* block-zoom breadcrumb chain, root first *)
  ; page_db_collapsable : bool
    (* cljs db-collapsable? on the page entity — drives the title-row
       fold arrow + data-db-collapsable *)
  }

type phase =
  | Booting
  | Ready
  | Failed of string

(* modal confirm intent — carried as data so it survives the reducer *)
type confirm =
  | Confirm_delete_page of string * string * bool (* uuid, title, permanent? *)
  | Confirm_convert_tag_to_page of int (* class db/id *)
  | Confirm_delete_asset of string (* asset block uuid *)

(* rtc-sync-state broadcast projection — the fields the header indicator
   and e2e rtc-tx element need (components/rtc/indicator.cljs) *)
type rtc_user =
  { ru_uuid : string (* user/uuid *)
  ; ru_name : string (* user/name *)
  ; ru_email : string option (* user/email *)
  }

type rtc =
  { rtc_lock : bool (* ws open *)
  ; rtc_ws_state : string
  ; rtc_local_tx : int option
  ; rtc_remote_tx : int option
  ; rtc_pending_local : int (* unpushed-block-update-count *)
  ; rtc_pending_asset : int
  ; rtc_pending_server : int
  ; rtc_online_users : rtc_user list (* online-users *)
  ; rtc_missing_files : string list (* missing-asset-upload-files :file *)
  }

(* :search/index-build — worker search-index progress pushed through the
   thread-api/search-index-build-progress remoteInvoke (cljs
   persist_db/browser.cljs). Rendered by the header widget *)
type index_build =
  { ib_visible : bool
  ; ib_running : bool
  ; ib_status : string (* "" | "idle" | "running" | "completed" *)
  ; ib_progress : int (* 0-100 *)
  ; ib_repo : string
  ; ib_build_id : string option
  }

(* one decoded search-index-build-progress event *)
type index_progress_event =
  { ip_repo : string
  ; ip_status : string
  ; ip_stage : string (* "search-index" | "vector-index" *)
  ; ip_progress : int
  ; ip_build_id : string option
  }

(* worker :notification broadcast -> toast *)
type toast =
  { toast_id : int
  ; toast_text : string
  ; toast_kind : string (* "success" | "error" | "warning" | ... *)
  ; toast_key : string option (* sdk show_msg key — close_msg targets it *)
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
  ; page_ref_count : int (* cljs [:block-ref-count page-uuid] — the
                              unfiltered total gating the linked-references
                              section *)
  ; unlinked_exists : bool (* cljs :block-unlinked-ref-exists — gates
                              whether the collapsed section renders at all *)
  ; repos : string list
  ; theme_dark : bool
  ; left_sidebar_open : bool
  ; left_sidebar_width : int (* cljs --ls-left-sidebar-width, px *)
  ; right_sidebar_open : bool
  ; editing_title : bool
  ; page_menu
      : (float * float * float * bool * string option) option
        (* anchor cx/top/bottom, with_app_items, page uuid *)
    (* click position + with_app_items (toolbar dots vs page context
       menu) + the menu page uuid; uuid None = resolve from the current
       route like cljs right-sidebar/get-current-page *)
  ; appearance : (float * float) option
    (* cljs :ui/toggle-appearance popup anchored to .toolbar-dots-btn *)
  ; confirm : confirm option
  ; toasts : toast list
  ; toast_next : int
  ; unlinked_open : bool
  ; help_open : bool
  ; unlinked_blocks : block list
  ; rtc : rtc option
  ; index_build : index_build
  ; (* latest rtc.log/download|upload sub-type activity — the cljs
       *downloading?/*uploading? atoms behind the header
       downloading-detail/uploading-detail buttons *)
    rtc_downloading : bool
  ; rtc_uploading : bool
  ; data_gen : int (* bumped whenever a block/page-bearing field is
                      reassigned — cheap revision for dyn ~equal so
                      block trees are never structurally compared *)
  }

let initial =
  { phase = Booting
  ; repo = None
  ; route = Home
  ; route_page = None
  ; page_missing = false
  ; journals = []
  ; page_ref_count = 0
  ; unlinked_exists = false
  ; repos = []
  ; theme_dark = false
  ; left_sidebar_open =
      (* cljs: (boolean (storage/get :ls-left-sidebar-open?)) — nil -> false.
         Raw platform op: Model.initial evaluates at module init, before
         Ui_services is installed. *)
      (match Platform.local_storage_get "ls-left-sidebar-open?" with
       | Some "true" -> true
       | _ -> false)
  ; left_sidebar_width =
      (* cljs restores persisted :ls-left-sidebar-width into
         --ls-left-sidebar-width on mount; default 246px. Raw platform
         op — module init, same as left_sidebar_open above. *)
      (match Platform.local_storage_get "ls-left-sidebar-width" with
       | Some w0 ->
           let w0 = String.trim w0 in
           let n =
             if String.length w0 > 2
                && String.sub w0 (String.length w0 - 2) 2 = "px"
             then String.sub w0 0 (String.length w0 - 2)
             else w0
           in
           (match float_of_string_opt n with
            | Some f -> int_of_float (Float.round f)
            | None -> 246)
       | None -> 246)
  ; right_sidebar_open = false
  ; editing_title = false
  ; page_menu = None
  ; appearance = None
  ; confirm = None
  ; toasts = []
  ; toast_next = 0
  ; unlinked_open = true
  ; help_open = false
  ; unlinked_blocks = []
  ; rtc = None
  ; index_build =
      { ib_visible = false
      ; ib_running = false
      ; ib_status = ""
      ; ib_progress = 0
      ; ib_repo = ""
      ; ib_build_id = None
      }
  ; rtc_downloading = false
  ; rtc_uploading = false
  ; data_gen = 0
  }

let empty_block ~uuid ~title ~is_page : block =
  { block_uuid = Some uuid
  ; block_db_id = None
  ; block_title = title
  ; block_level = 0
  ; block_tag_ids = []
  ; block_tags = []
  ; block_display_type = None
  ; block_order_list = None
  ; block_order_index = None
  ; block_order = None
  ; block_code_lang = None
  ; block_tag_uuids = []
  ; block_tag_idents = []
  ; block_tag_db_ids = []
  ; block_page_name = None
  ; block_page_uuid = None
  ; block_reactions = []
  ; block_is_comments_area = false
  ; block_is_comment = false
  ; block_comment_targets = 0
  ; block_comment_target_ids = []
  ; block_icon = None
  ; block_tag_icons = []
  ; block_children = []
  ; block_link = None
  ; block_embed_children = []
  ; block_is_page = is_page
  ; block_heading = None
  ; block_default_collapsed = false
  ; block_asset_type = None
  ; block_asset_url = None
  ; block_asset_width = None
  ; block_asset_height = None
  ; block_asset_resize = None
  ; block_asset_align = None
  ; block_is_query = false
  ; block_db_collapsable = false
  ; block_ls_type = None
  ; block_hl_type = None
  ; block_hl_page = None
  ; block_hl_color = None
  ; block_hl = None
  ; block_asset_ref = None
  ; block_hl_image = None
  }

(* spine-only transform: apply [f] to the deepest siblings list where
   [here] holds for some member, rebuilding records only along that
   list's ancestor spine. Untouched blocks keep their record identity so
   keyed compare / row [==] checks take the fast path. Returns None when
   no list matches — pure search, no allocation *)
let map_list_where (here : block -> bool) (f : block list -> block list)
    (blocks : block list) : block list option =
  let rec map_list (blocks : block list) : block list option =
    if List.exists here blocks then Some (f blocks)
    else
      let rec seek acc = function
        | [] -> None
        | b :: rest -> (
            match map_list b.block_children with
            | Some children' ->
                Some
                  (List.rev_append acc
                     ({ b with block_children = children' } :: rest))
            | None -> seek (b :: acc) rest)
      in
      seek [] blocks
  in
  map_list blocks

(* optimistic Enter: retitle the split block and insert the new block as
   its next sibling (or first child when the op expands into children).
   The worker delta stays authoritative — it lands ~100ms later with the
   same uuid and splices the real record over this placeholder *)
let split_insert ?(above = false) (page : page) ~uuid ~before ~(new_block : block) ~sibling
    : page option =
  let edit blocks =
    List.concat_map
      (fun b ->
        if b.block_uuid = Some uuid then
          if above then [ new_block; { b with block_title = before } ]
          else if sibling then [ { b with block_title = before }; new_block ]
          else
            [ { b with
                block_title = before
              ; block_children = new_block :: b.block_children
              } ]
        else [ b ])
      blocks
  in
  Option.map
    (fun blocks' -> { page with page_blocks = blocks' })
    (map_list_where
       (fun b -> b.block_uuid = Some uuid)
       edit page.page_blocks)

(* optimistic indent: move the selected run under its previous sibling so
   the reparent repaints synchronously (the async worker refresh then
   reconciles an identical structure instead of remounting the editing
   textarea mid-flight — e2e boundingBox races that remount). Returns None
   when nothing moves; worker refresh stays authoritative. *)
let delete_block (page : page) uuid : page option =
  let changed = ref false in
  let rec remove blocks =
    List.filter_map
      (fun b ->
        if b.block_uuid = Some uuid then (changed := true; None)
        else Some { b with block_children = remove b.block_children })
      blocks
  in
  let blocks = remove page.page_blocks in
  if !changed then Some { page with page_blocks = blocks } else None

let indent_blocks (page : page) (uuids : string list) : page option =
  let sel = List.sort_uniq compare uuids in
  let is_sel b =
    match b.block_uuid with Some u -> List.mem u sel | None -> false
  in
  let changed = ref false in
  (* the selection sits inside one siblings list — absorb_runs there;
     deeper lists are unreachable by a real indent selection *)
  let absorb_runs (blocks : block list) : block list =
    let rec loop acc = function
      | b1 :: b2 :: rest when (not (is_sel b1)) && is_sel b2 -> (
          let rec take_run acc = function
            | b :: tl when is_sel b -> take_run (b :: acc) tl
            | l -> List.rev acc, l
          in
          let run, rest' = take_run [ b2 ] rest in
          match b1.block_link with
          | Some _ ->
              (* linked/embed rows are not indent targets *)
              loop (b1 :: acc) (b2 :: rest)
          | None ->
              changed := true;
              loop
                acc
                ({ b1 with
                   block_children = b1.block_children @ run
                 }
                :: rest'))
      | b :: rest -> loop (b :: acc) rest
      | [] -> List.rev acc
    in
    loop [] blocks
  in
  match
    map_list_where is_sel absorb_runs page.page_blocks
  with
  | Some blocks' when !changed ->
      Some { page with page_blocks = blocks' }
  | _ -> None

(* optimistic outdent: lift selected children out of their parent and
   reinsert them after it *)
let outdent_blocks ~logical (page : page) (uuids : string list) : page option =
  let sel = List.sort_uniq compare uuids in
  let is_sel b =
    match b.block_uuid with Some u -> List.mem u sel | None -> false
  in
  let changed = ref false in
  (* outdent = move the selected run to be siblings right after their
     parent, then move the run's former right-siblings under the LAST
     outdented block (cljs/worker get_right_siblings drag). Operates on
     the one siblings list containing the parent *)
  let lift blocks =
    List.concat_map
      (fun b ->
        match List.filter is_sel b.block_children with
        | [] -> [ b ]
        | _ ->
            changed := true;
            (* children after the last selected become its children;
               children before the first selected stay with the parent *)
            let prefix, after =
              let rec split acc = function
                | c :: tl when not (is_sel c) -> split (c :: acc) tl
                | rest -> List.rev acc, rest
              in
              split [] b.block_children
            in
            let selected, suffix =
              let rec take acc = function
                | c :: tl when is_sel c -> take (c :: acc) tl
                | rest -> List.rev acc, rest
              in
              take [] after
            in
            let parent_children = if logical then prefix @ suffix else prefix in
            let selected =
              match logical, List.rev selected, suffix with
              | false, last :: rprev, _ :: _ ->
                  let last =
                    { last with
                      block_children = last.block_children @ suffix }
                  in
                  List.rev (last :: rprev)
              | _ -> selected
            in
            { b with block_children = parent_children } :: selected)
      blocks
  in
  match
    map_list_where
      (fun b -> List.exists is_sel b.block_children)
      lift page.page_blocks
  with
  | Some blocks' when !changed ->
      Some { page with page_blocks = blocks' }
  | _ -> None

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
