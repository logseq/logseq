(* Reducer actions for the app loop. *)

type t =
  | Boot_graph_ready of string
  | Repos_loaded of string list
  | Page_loaded of Model.page
  | Navigate_to of Model.route
  | Worker_event of string * Wire.t
  | Refresh_page
  | Toggle_left_sidebar
  | Toggle_right_sidebar
  | Toggle_search
  | Block_content_changed of string * string
  | Noop
