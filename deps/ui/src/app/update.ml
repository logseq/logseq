(* Pure reducer: Model.t -> Action.t -> Model.t *)

open Model

let update (model : t) (action : Action.t) : t =
  match action with
  | Action.Boot_graph_ready repo ->
      (* rtc broadcast state belongs to the previous graph's conn; clear it
         so the header indicator only shows the new graph once its conn
         reports — a stale "on.idle" would let e2e switch-graph proceed
         while the navigation is still in flight *)
      { model with phase = Ready; repo = Some repo; rtc = None }
  | Repos_loaded repos -> { model with repos }
  | Page_loaded page ->
      { model with
        route_page = Some page
      ; page_missing = false
      ; data_gen =
          (if model.route_page = Some page then model.data_gen
           else model.data_gen + 1)
      }
  | Page_load_failed ->
      { model with
        route_page = None
      ; page_missing = true
      ; data_gen = model.data_gen + 1
      }
  | Journals_loaded js ->
      { model with
        journals = js
      ; data_gen =
          (if js = model.journals then model.data_gen
           else model.data_gen + 1)
      }
  | Refs_loaded refs ->
      { model with
        page_refs = refs
      ; data_gen =
          (if refs = model.page_refs then model.data_gen
           else model.data_gen + 1)
      }
  | Unlinked_loaded refs ->
      { model with
        unlinked_refs = refs
      ; data_gen =
          (if refs = model.unlinked_refs then model.data_gen
           else model.data_gen + 1)
      }
  | Unlinked_exists b ->
      { model with
        unlinked_exists = b
      ; data_gen =
          (if b = model.unlinked_exists then model.data_gen
           else model.data_gen + 1)
      }
  | Navigate_to route ->
      { model with
        route
      ; route_page = None
      ; page_missing = false
      ; page_refs = []
      ; unlinked_refs = []
      ; unlinked_exists = false
      ; editing_title = false
      ; page_menu = None
      ; appearance = None
      ; confirm = None
      ; unlinked_open = false
      ; unlinked_search = false
      ; unlinked_query = ""
      ; unlinked_blocks = []
      ; data_gen = model.data_gen + 1
      }
  | Title_edit_start -> { model with editing_title = true }
  | Title_edit_done -> { model with editing_title = false }
  | Page_menu_set pos -> { model with page_menu = pos; appearance = None }
  | Appearance_set pos ->
      (* cljs popup toggle: clicking the menu item again hides it *)
      { model with appearance = pos; page_menu = None }
  | Confirm_set c ->
      { model with confirm = c; page_menu = None; appearance = None }
  | Dismiss_all ->
      { model with page_menu = None; confirm = None; appearance = None }
  | Toggle_left_sidebar ->
      (* cljs set-left-sidebar-open! persists to storage *)
      let open_ = not model.left_sidebar_open in
      Platform.local_storage_set "ls-left-sidebar-open?"
        (if open_ then "true" else "false");
      { model with left_sidebar_open = open_ }
  | Toggle_right_sidebar ->
      { model with right_sidebar_open = not model.right_sidebar_open }
  | Toast_push t ->
      { model with
        toasts = { t with toast_id = model.toast_next } :: model.toasts
      ; toast_next = model.toast_next + 1
      }
  | Toast_dismiss id ->
      { model with
        toasts = List.filter (fun (t : toast) -> t.toast_id <> id) model.toasts
      }
  | Toast_dismiss_key key ->
      { model with
        toasts =
          List.filter
            (fun (t : toast) -> t.toast_key <> Some key)
            model.toasts
      }
  | Toasts_clear -> { model with toasts = [] }
  | Unlinked_toggle_open ->
      { model with unlinked_open = not model.unlinked_open }
  | Unlinked_toggle_search ->
      { model with
        unlinked_search = not model.unlinked_search
      ; unlinked_query = ""
      }
  | Unlinked_set_query q -> { model with unlinked_query = q }
  | Help_toggle -> { model with help_open = not model.help_open }
  | Rtc_state rtc -> { model with rtc = Some rtc }
  | Rtc_state_clear -> { model with rtc = None }
  | Worker_event _ | Refresh_page | Block_content_changed _ | Toggle_search
  | Noop ->
      model
