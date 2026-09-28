(* App model — immutable snapshot consumed by the LUI view. *)

type route =
  | Home (* today's journal, or default-home config page *)
  | Page of string (* name or uuid *)
  | Block_zoom of string
  | Journals
  | Library
  | All_pages
  | All_graphs
  | Graph
  | Not_found of string

type block =
  { block_uuid : string option
  ; block_db_id : int option
  ; block_title : string
  ; block_level : int
  ; block_tag_ids : int list (* block/tags ref ids from the pull *)
  ; block_tags : string list (* resolved tag titles, for .block-tags *)
  ; block_children : block list
  ; block_page_name : string option (* containing page, for ref rows *)
  ; block_is_page : bool
    (* page-typed outline child (carries block/name; cljs entity/page?) *)
  ; block_default_collapsed : bool
    (* page children render collapsed outside the Library page
       (cljs block-default-collapsed?) — set per containing page view *)
  }

type page =
  { page_title : string
  ; page_uuid : string option
  ; page_db_id : int option
  ; page_is_tag : bool
  ; page_journal_day : int option
  ; page_is_library : bool
  ; page_tags : string list
  ; page_blocks : block list
  }

type phase =
  | Booting
  | Ready
  | Failed of string

(* modal confirm intent — carried as data so it survives the reducer *)
type confirm =
  | Confirm_delete_page of string (* page uuid *)
  | Confirm_convert_tag_to_page of int (* class db/id *)

(* worker :notification broadcast -> toast *)
type toast =
  { toast_id : int
  ; toast_text : string
  ; toast_kind : string (* "success" | "error" | "warning" | ... *)
  }

(* global graph view (#/graph) — toolbar/panel state; the canvas
   itself is DOM-less (cljs renders via pixi) *)
type graph_view =
  { gv_settings_open : bool
  ; gv_mode : string (* "tags-and-objects" | "all-pages" *)
  ; gv_tt_open : bool
  ; gv_tt_value : float option (* offset ms from gv_min; None = at now *)
  ; gv_min : float (* earliest block/created-at *)
  ; gv_max : float
  ; gv_loaded : bool
  }

let graph_view_initial =
  { gv_settings_open = false
  ; gv_mode = "tags-and-objects"
  ; gv_tt_open = false
  ; gv_tt_value = None
  ; gv_min = 0.
  ; gv_max = 0.
  ; gv_loaded = false
  }

type t =
  { phase : phase
  ; repo : string option
  ; route : route
  ; route_page : page option
  ; journals : page list
  ; page_refs : block list
  ; unlinked_refs : block list
  ; repos : string list
  ; theme_dark : bool
  ; left_sidebar_open : bool
  ; right_sidebar_open : bool
  ; editing_title : bool
  ; page_menu : (float * float) option (* click position *)
  ; confirm : confirm option
  ; toasts : toast list
  ; toast_next : int
  ; unlinked_open : bool
  ; unlinked_search : bool
  ; unlinked_query : string
  ; gv : graph_view
  }

let initial =
  { phase = Booting
  ; repo = None
  ; route = Home
  ; route_page = None
  ; journals = []
  ; page_refs = []
  ; unlinked_refs = []
  ; repos = []
  ; theme_dark = false
  ; left_sidebar_open = true
  ; right_sidebar_open = false
  ; editing_title = false
  ; page_menu = None
  ; confirm = None
  ; toasts = []
  ; toast_next = 0
  ; unlinked_open = false
  ; unlinked_search = false
  ; unlinked_query = ""
  ; gv = graph_view_initial
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
