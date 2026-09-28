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
  ; block_children : block list
  ; (* db id of a :block/link target — the block renders the linked
       page's blocks instead of its own children *)
    block_link : int option
  ; (* fetched blocks of the linked entity; never written back by
       structure ops (they belong to the source page) *)
    block_embed_children : block list
  }

type page =
  { page_title : string
  ; page_uuid : string option
  ; page_db_id : int option
  ; page_is_tag : bool
  ; page_journal_day : int option
  ; page_blocks : block list
  }

type phase =
  | Booting
  | Ready
  | Failed of string

(* modal confirm intent — carried as data so it survives the reducer *)
type confirm = Confirm_delete_page of string (* page uuid *)

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
