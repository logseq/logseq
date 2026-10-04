(* Reducer actions for the app loop. *)

type t =
  | Boot_graph_ready of string
  | Graph_closed (* the open repo was deleted — no graph remains *)
  | Repos_loaded of string list
  | Page_loaded of Model.page
  | Page_load_failed (* page/block lookup resolved to nothing *)
  | Journals_loaded of Model.page list
  | Journals_spliced of Model.page list
  (* in-place delta splice into the journals list — same publish as
     Journals_loaded but no data_gen bump: the mounted keyed collections
     repaint only the touched rows instead of remounting the region *)
  | Refs_loaded of Model.block list
  | Ref_parents_loaded of (string * string list) list
  | Unlinked_loaded of Model.block list
  | Unlinked_exists of bool
  | Navigate_to of Model.route
  | Worker_event of string * Wire.t
  | Refresh_page
  | Toggle_left_sidebar
  | Toggle_right_sidebar
  | Toggle_search
  | Block_content_changed of string * string
  | Title_edit_start
  | Title_edit_done (* value already committed via page op *)
  | Page_menu_set of (float * float * bool * string option) option
    (* coords, with_app_items, menu page uuid; uuid None = resolve
       from the current route like cljs right-sidebar/get-current-page *)
  | Appearance_set of (float * float) option
  | Confirm_set of Model.confirm option
  | Dismiss_all (* Escape / outside click *)
  | Toast_push of Model.toast
  | Toast_dismiss of int
  | Toast_dismiss_key of string
  | Toasts_clear
  | Unlinked_toggle_open
  | Unlinked_toggle_search
  | Unlinked_set_query of string
  | Help_toggle
  | Rtc_state of Model.rtc (* rtc-sync-state broadcast *)
  | Rtc_state_clear (* a graph's sync is (re)starting — hide stale state *)
  | Search_index_progress of Model.index_progress_event
    (* worker remoteInvoke — header widget *)
  | Search_index_hide of string * string
    (* repo + build-id — 1.5s after :completed, if still current *)
  | Rtc_flow_flags of
      { downloading : bool
      ; uploading : bool
      } (* latest rtc.log sub-type activity — downloading-detail /
           uploading-detail header buttons *)
  | Noop
