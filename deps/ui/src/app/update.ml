(* Pure reducer: Model.t -> Action.t -> Model.t *)

open Model

let update (model : t) (action : Action.t) : t =
  match action with
  | Action.Boot_graph_ready repo ->
      { model with phase = Ready; repo = Some repo }
  | Repos_loaded repos -> { model with repos }
  | Page_loaded page -> { model with route_page = Some page }
  | Journals_loaded js -> { model with journals = js }
  | Refs_loaded refs -> { model with page_refs = refs }
  | Navigate_to route ->
      { model with
        route
      ; route_page = None
      ; page_refs = []
      ; editing_title = false
      ; page_menu = None
      }
  | Title_edit_start -> { model with editing_title = true }
  | Title_edit_done -> { model with editing_title = false }
  | Page_menu_set pos -> { model with page_menu = pos }
  | Confirm_set c -> { model with confirm = c; page_menu = None }
  | Dismiss_all ->
      { model with page_menu = None; confirm = None }
  | Toggle_left_sidebar ->
      { model with left_sidebar_open = not model.left_sidebar_open }
  | Toggle_right_sidebar ->
      { model with right_sidebar_open = not model.right_sidebar_open }
  | Toast_push t ->
      { model with
        toasts =
          model.toasts @ [ { t with toast_id = model.toast_next } ]
      ; toast_next = model.toast_next + 1
      }
  | Toast_dismiss id ->
      { model with
        toasts = List.filter (fun (t : toast) -> t.toast_id <> id) model.toasts
      }
  | Toasts_clear -> { model with toasts = [] }
  | Worker_event _ | Refresh_page | Block_content_changed _ | Toggle_search
  | Noop ->
      model
