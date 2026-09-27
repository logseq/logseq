(* App model — immutable snapshot consumed by the LUI view. *)

type route =
  | Home (* today's journal *)
  | Page of string (* block/uuid *)
  | Block_zoom of string
  | All_pages
  | All_graphs
  | Not_found of string

type block =
  { block_uuid : string option
  ; block_db_id : int option
  ; block_title : string
  ; block_level : int
  ; block_children : block list
  }

type page =
  { page_title : string
  ; page_uuid : string option
  ; page_blocks : block list
  }

type phase =
  | Booting
  | Ready
  | Failed of string

type t =
  { phase : phase
  ; repo : string option
  ; route : route
  ; route_page : page option
  ; repos : string list
  ; theme_dark : bool
  ; left_sidebar_open : bool
  ; right_sidebar_open : bool
  }

let initial =
  { phase = Booting
  ; repo = None
  ; route = Home
  ; route_page = None
  ; repos = []
  ; theme_dark = false
  ; left_sidebar_open = true
  ; right_sidebar_open = false
  }
