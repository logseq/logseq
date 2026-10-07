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
  | Ref_count_loaded of int (* cljs [:block-ref-count] — gates the
                                linked-references section *)
  | Unlinked_exists of bool
  | Navigate_to of Model.route
  | Worker_event of string * Wire.t
  | Refresh_page
  | Toggle_left_sidebar
  | Set_left_sidebar_width of int
  | Toggle_right_sidebar
  | Toggle_search
  | Block_content_changed of string * string
  | Title_edit_start
  | Title_edit_done (* value already committed via page op *)
  | Page_menu_set of
      (float * float * float * bool * string option) option
      (* (anchor cx, anchor top, anchor bottom, with_app_items, page
         uuid) — cljs popup-show! re-anchors pointer menus to the event
         target element; the toolbar-dots path passes its right-edge
         anchor as cx and the trigger rect as top/bottom *)
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

(* short constructor name for perf attribution — __uiPerf labels *)
let tag (a : t) : string =
  match a with
  | Boot_graph_ready _ -> "boot-graph-ready"
  | Graph_closed -> "graph-closed"
  | Repos_loaded _ -> "repos-loaded"
  | Page_loaded _ -> "page-loaded"
  | Page_load_failed -> "page-load-failed"
  | Journals_loaded _ -> "journals-loaded"
  | Journals_spliced _ -> "journals-spliced"
  | Ref_count_loaded _ -> "ref-count-loaded"
  | Unlinked_exists _ -> "unlinked-exists"
  | Navigate_to _ -> "navigate-to"
  | Worker_event (n, _) -> "worker-event:" ^ n
  | Refresh_page -> "refresh-page"
  | Toggle_left_sidebar -> "toggle-left-sidebar"
  | Set_left_sidebar_width _ -> "set-left-sidebar-width"
  | Toggle_right_sidebar -> "toggle-right-sidebar"
  | Toggle_search -> "toggle-search"
  | Block_content_changed _ -> "block-content-changed"
  | Title_edit_start -> "title-edit-start"
  | Title_edit_done -> "title-edit-done"
  | Page_menu_set _ -> "page-menu-set"
  | Appearance_set _ -> "appearance-set"
  | Confirm_set _ -> "confirm-set"
  | Dismiss_all -> "dismiss-all"
  | Toast_push _ -> "toast-push"
  | Toast_dismiss _ -> "toast-dismiss"
  | Toast_dismiss_key _ -> "toast-dismiss-key"
  | Toasts_clear -> "toasts-clear"
  | Unlinked_toggle_open -> "unlinked-toggle-open"
  | Help_toggle -> "help-toggle"
  | Rtc_state _ -> "rtc-state"
  | Rtc_state_clear -> "rtc-state-clear"
  | Search_index_progress _ -> "search-index-progress"
  | Search_index_hide _ -> "search-index-hide"
  | Rtc_flow_flags _ -> "rtc-flow-flags"
  | Noop -> "noop"
