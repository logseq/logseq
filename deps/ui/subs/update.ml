(* Reducer: Model.t -> Action.t -> Model.t, plus the per-action effect
   pass (Update.apply) — one dispatch path for every action, whether it
   arrives through Runtime.send or a LUI event. *)

open Model

(* side effects of actions — run inside the dispatch (Update.apply) on
   the pre-update action, before the state transition *)
let effects (action : Action.t) : unit =
  match action with
  | Action.Boot_graph_ready repo ->
      Runtime.current_repo := Some repo;
      Runtime.current_graph_uuid := None;
      Runtime.hooks.on_graph_opened repo;
      Runtime.hooks.rtc_graph_ready repo
  | Action.Graph_closed ->
      Runtime.current_repo := None;
      Runtime.current_page := None;
      Runtime.current_route := None
  | Action.Page_loaded page ->
      Runtime.hooks.nav_load_done ();
      (* a fresh full-fetch replaces the tree at an unknown rev — the
         delta basis only survives splices applied through Page_delta *)
      if not (Page_delta.is_own_commit page) then Page_delta.reset ();
      Runtime.current_page := Some page;
      (* splice-merged loads republish the same page: push the items
         into the mounted list's signal so rows repaint even when the
         view skips a remount *)
      Runtime.push_page_items page;
      (* cljs route.cljs update-page-title!: document.title follows the
         loaded page's title *)
      Web_dom.set_document_title page.Model.page_title;
      Runtime.sync_hash_graph_id ();
      (match !Runtime.after_page_load, page.Model.page_uuid with
       | Some (want, f), Some u when u = want ->
           Runtime.after_page_load := None;
           f ()
       | _ -> ())
  | Action.Page_load_failed ->
      Runtime.hooks.nav_load_done ();
      Runtime.after_page_load := None
  | Action.Journals_loaded js ->
      Runtime.hooks.nav_load_done ();
      (* a fresh full-fetch replaces every journal tree at an unknown
         rev — the delta basis only survives splices applied through
         Page_delta *)
      Page_delta.reset ();
      Runtime.push_journals_items js
  | Action.Journals_spliced js ->
      Runtime.hooks.nav_load_done ();
      Runtime.push_journals_items js
  | Action.Navigate_to r ->
      Page_delta.reset ();
      Runtime.clear_page_items ();
      Runtime.clear_journal_items ();
      !Runtime.on_navigate ();
      Runtime.current_page := None;
      Runtime.current_route := Some r;
      (* in-graph routes always carry ?graph-id — navigation call sites
         write raw hashes, so re-append it here after the hash settles *)
      (match r with
       | Model.All_graphs | Model.Import | Model.Not_found _ -> ()
       | _ -> Runtime.sync_hash_graph_id ());
      (* cljs route.cljs static-title for non-page routes (page routes
         get their title when Page_loaded lands) *)
      (match r with
       | Model.Home -> Web_dom.set_document_title "Logseq"
       | Model.Journals ->
           Web_dom.set_document_title (I18n.t "nav/all-journals")
       | Model.All_pages ->
           Web_dom.set_document_title (I18n.t "nav.all-pages/title")
       | Model.All_graphs ->
           Web_dom.set_document_title (I18n.t "mobile.tab/graphs")
       | Model.Settings ->
           Web_dom.set_document_title (I18n.t "nav/settings")
       | Model.Import ->
           Web_dom.set_document_title (I18n.t "import/title")
       | Model.Library | Model.Not_found _ ->
           Web_dom.set_document_title "Logseq"
       | Model.Page _ | Model.Block_zoom _ -> ())
  | _ -> ()

let update (model : t) (action : Action.t) : t =
  match action with
  | Action.Boot_graph_ready repo ->
      (* rtc broadcast state belongs to the previous graph's conn; clear it
         so the header indicator only shows the new graph once its conn
         reports — a stale "on.idle" would let e2e switch-graph proceed
         while the navigation is still in flight *)
      { model with phase = Ready; repo = Some repo; rtc = None }
  | Graph_closed -> { model with repo = None; rtc = None }
  | Repos_loaded repos -> { model with repos }
  | Page_loaded page ->
      { model with
        route_page = Some page
      ; page_missing = false
      ; data_gen =
          (if
             (* spliced block trees reach the mounted flat row stream
                through the model signal — skipping the gen bump keeps
                the whole .ls-page subtree (and the virtual window)
                from remounting per editing op. Only safe when nothing
                but the block tree changed *)
             match model.route_page with
             | Some p
               when { p with Model.page_blocks = [] }
                    = { page with page_blocks = [] }
                    && Runtime.has_page_items ~scope:"main"
                         ~puuid:page.Model.page_uuid -> true
             | _ -> false
           then model.data_gen
           else model.data_gen + 1)
      }
  | Page_load_failed ->
      { model with
        route_page = None
      ; page_missing = true
      ; data_gen = model.data_gen + 1
      }
  | Journals_loaded js | Journals_spliced js ->
      (* the journals view is signal-driven end to end (keyed items,
         keyed blocks, dyn'd refs) — a publish never needs a data_gen
         bump; the collections repaint or reconcile themselves *)
      { model with journals = js }
  | Refs_loaded refs ->
      { model with
        page_refs = refs
      ; data_gen =
          (if refs = model.page_refs then model.data_gen
           else model.data_gen + 1)
      }
  | Ref_parents_loaded entries ->
      (* merge into the keyed assoc — linked and unlinked fetches each
         contribute their own group pages; an unchanged merge keeps the
         same list so refs_eq's physical compare holds *)
      let merged =
        List.fold_left
          (fun acc (k, v) ->
            match List.assoc_opt k acc with
            | Some v' when v' = v -> acc
            | _ -> (k, v) :: List.remove_assoc k acc)
          model.ref_parents entries
      in
      { model with
        ref_parents = merged
      ; data_gen =
          (if merged == model.ref_parents then model.data_gen
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
      ; ref_parents = []
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
  | Search_index_progress ev ->
      (* cljs persist_db/browser.cljs thread-api/search-index-build-progress:
         :running shows + tracks, :completed shows at 100% (the event
         layer sends Search_index_hide 1.5s later), :idle hides unless
         the last build completed. vector-index stages aren't surfaced *)
      let ib = model.index_build in
      let visible_repo =
        model.repo = Some ev.ip_repo || ib.ib_repo = ev.ip_repo
      in
      if (not visible_repo) || ev.ip_stage = "vector-index" then model
      else
        let keep =
          { ib with
            ib_status = ev.ip_status
          ; ib_repo = ev.ip_repo
          ; ib_build_id =
              (match ev.ip_build_id with
               | Some _ -> ev.ip_build_id
               | None -> ib.ib_build_id)
          }
        in
        (match ev.ip_status with
         | "idle" ->
             if ib.ib_status = "completed" then model
             else
               { model with
                 index_build =
                   { keep with ib_visible = false; ib_running = false }
               }
         | "running" | "completed" ->
             { model with
               index_build =
                 { keep with
                   ib_visible = true
                 ; ib_running = ev.ip_status = "running"
                 ; ib_progress = max 0 (min 100 ev.ip_progress)
                 }
             }
         | _ -> model)
  | Search_index_hide (repo, build_id) ->
      let ib = model.index_build in
      if ib.ib_repo = repo && ib.ib_build_id = Some build_id then
        { model with index_build = { ib with ib_visible = false } }
      else model
  | Rtc_flow_flags { downloading; uploading } ->
      { model with rtc_downloading = downloading
      ; rtc_uploading = uploading
      }
  | Worker_event _ | Refresh_page | Block_content_changed _ | Toggle_search
  | Noop ->
      model

(* the single dispatch path — every action gets its effect pass, then
   the state transition (wired as the Lui_app reducer in main.ml) *)
let apply (model : t) (action : Action.t) : t =
  effects action;
  update model action
