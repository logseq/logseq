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
      { model with route; route_page = None; page_refs = [] }
  | Toggle_left_sidebar ->
      { model with left_sidebar_open = not model.left_sidebar_open }
  | Toggle_right_sidebar ->
      { model with right_sidebar_open = not model.right_sidebar_open }
  | Worker_event _ | Refresh_page | Block_content_changed _ | Toggle_search
  | Noop ->
      model
