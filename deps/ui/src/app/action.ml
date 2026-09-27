(* Reducer actions for the app loop. *)

type t =
  | Boot_graph_ready of string
  | Repos_loaded of string list
  | Page_loaded of Model.page
  | Journals_loaded of Model.page list
  | Refs_loaded of Model.block list
  | Navigate_to of Model.route
  | Worker_event of string * Wire.t
  | Refresh_page
  | Toggle_left_sidebar
  | Toggle_right_sidebar
  | Toggle_search
  | Block_content_changed of string * string
  | Title_edit_start
  | Title_edit_done (* value already committed via page op *)
  | Page_menu_set of (float * float) option
  | Confirm_set of Model.confirm option
  | Dismiss_all (* Escape / outside click *)
  | Toast_push of Model.toast
  | Toast_dismiss of int
  | Toasts_clear
  | Unlinked_toggle_open
  | Unlinked_toggle_search
  | Unlinked_set_query of string
  | Graph_toggle_settings
  | Graph_set_mode of string
  | Graph_toggle_tt
  | Graph_set_tt of float
  | Graph_tt_reset
  | Graph_loaded of float * float (* created-at min, max *)
  | Noop
