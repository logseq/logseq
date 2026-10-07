(* Hash routing — mirrors frontend.routes: "#/page/<name|uuid>",
   "#/block/<uuid>", "#/all-journals", "#/all-pages", "#/graphs",
   "#/settings", default "#/". Listens hashchange + the "ls:navigate"
   CustomEvent (dispatched by sdk push_state). *)

open Promise_ext
module SSet = Stdlib.Set.Make (String)

let decode s = try Platform.decode_uri s with _ -> s

(* strip "#" and "?graph-id=..." — hash may carry query params *)
let route_path () =
  let h = Platform.location_hash () in
  let h =
    if String.length h > 0 && String.get h 0 = '#' then
      String.sub h 1 (String.length h - 1)
    else h
  in
  match String.index_opt h '?' with
  | Some i -> String.sub h 0 i
  | None -> h

let parse_path (p : string) : Model.route =
  (* hashes are "#/page/x" style — strip the leading "/" *)
  let p =
    if String.length p > 0 && String.get p 0 = '/' then
      String.sub p 1 (String.length p - 1)
    else p
  in
  match p with
  | "" -> Model.Home
  | p -> (
      match String.index_opt p '/' with
      | Some i -> (
          let seg = String.sub p 0 i in
          let rest = String.sub p (i + 1) (String.length p - i - 1) in
          match seg with
          | "page" -> Model.Page (decode rest)
          | "block" -> Model.Block_zoom (decode rest)
          | "all-journals" | "journals" -> Model.Journals
          | "all-pages" -> Model.All_pages
          | "graphs" -> Model.All_graphs
          | "graph" -> Model.Graph_view
          | "import" -> Model.Import
          | "settings" -> Model.Settings
          | _ -> Model.Not_found p)
      | None -> (
          match p with
          | "all-journals" | "journals" -> Model.Journals
          | "all-pages" -> Model.All_pages
          | "graphs" -> Model.All_graphs
          | "graph" -> Model.Graph_view
          | "import" -> Model.Import
          | "settings" -> Model.Settings
          | "page" | "block" -> Model.Not_found p
          | _ -> Model.Not_found p))

let parse_hash () : Model.route =
  let p =
    match route_path () with
    | "" | "/" -> ""
    | p ->
        if String.length p > 0 && String.get p 0 = '/' then
          String.sub p 1 (String.length p - 1)
        else p
  in
  parse_path p

let repo = Runtime.repo

(* cljs set-route-match!: the hash can carry query params —
   ?anchor=ls-block-<uuid> on block-ref/backlink navigation *)
let route_anchor () =
  let h = Platform.location_hash () in
  match String.index_opt h '?' with
  | None -> None
  | Some i ->
      Platform.search_params_get
        (Platform.new_url_search_params
           (String.sub h (i + 1) (String.length h - i - 1)))
        "anchor"

(* cljs ui-handler/highlight-element!: a "ls-block-<uuid>" anchor
   scrolls the row into view and selects the block; other fragment ids
   scroll and flash block-highlight for 4s. Rows inside collapsed or
   lazily mounted subtrees appear after the route commits — poll like
   cljs wait-for-anchor-element! *)
let anchor_timer = ref 0

let rec poll_anchor anchor n =
  match Web_dom.get_element_by_id anchor with
  | Some el ->
      Web_dom.el_scroll_into_view el;
      if String.length anchor > 36 then
        let tail =
          String.sub anchor (String.length anchor - 36) 36
        in
        if Wire.is_uuid_string tail then
          Editor_actions.select_single tail
        else (
          Web_dom.el_class_add el "block-highlight";
          anchor_timer :=
            Web_dom.set_timeout_id
              (fun () ->
                Web_dom.el_class_remove el "block-highlight")
              4000)
  | None ->
      if n < 120 then
        anchor_timer :=
          Web_dom.set_timeout_id (fun () -> poll_anchor anchor (n + 1))
            50

let jump_to_anchor anchor =
  Web_dom.clear_timeout !anchor_timer;
  poll_anchor anchor 0

let fetch_blocks (p : Model.page) =
  let* blocks = Outliner_ops.fetch_page_blocks (repo ()) p in
  (* cljs page-membership :class: children tagged with the class
                itself are excluded from the block tree — they render in
                the class-objects table instead *)
  let blocks =
    match p.Model.page_db_id with
    | Some id when p.Model.page_is_tag ->
        List.filter
          (fun (b : Model.block) ->
            not (List.mem id b.Model.block_tag_ids))
          blocks
    | _ -> blocks
  in
  Js.Promise.resolve { p with Model.page_blocks = blocks }
let fetch_refs_blocks (p : Model.page) : Model.block list Js.Promise.t =
  match p.Model.page_db_id with
  | Some id ->
      let* w =
        Runtime.invoke2 "thread-api/get-block-refs"
          (Wire.String (repo ())) (Wire.Int id)
      in
      (* cljs block-ref-count gates the references section with
                hidden-ref-id-pred, which excludes same-page refs — drop
                them here so a self-reference never shows the section *)
      let blocks =
        List.filter
          (fun b ->
            b.Model.block_page_name <> Some p.Model.page_title)
          (Decode.blocks_of_wire w)
      in
      Js.Promise.resolve blocks
  | None -> Js.Promise.resolve []

(* cljs [:block-ref-count page-uuid] resource — the unfiltered refs
   total that gates .references; fetches resolve after the page load
   committed so a stale in-flight fetch can't overwrite the route *)
let fetch_ref_count ~stale:(is_stale : unit -> bool) (p : Model.page) =
  match p.Model.page_uuid with
  | Some uuid ->
      let rk =
        Wire.Array [ Wire.Keyword "block-ref-count"; Wire.Uuid uuid ]
      in
      (let* w =
         Runtime.invoke2 "thread-api/get-render-snapshots"
           (Wire.String (repo ()))
           (Wire.Map
              [ (Wire.Keyword "blocks", Wire.Array [])
              ; (Wire.Keyword "children", Wire.Array [])
              ; (Wire.Keyword "resources", Wire.Array [ rk ]) ])
       in
       Js.Promise.resolve
         (match Views_wire.snapshot_slot_value w rk with
          | Some (Wire.Int n) when not (is_stale ()) ->
              Runtime.send (Action.Ref_count_loaded n)
          | _ -> ()))
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("block-ref-count failed", e);
             Js.Promise.resolve ())
      |> ignore
  | None -> ()


(* only the on-screen days are fetched up front — scrolling near the
   bottom of the journals list pulls the next chunk (chat-style
   pagination) instead of preloading 40 days of trees + refs *)
let journals_initial = 3
let journals_chunk = 2
let journals_has_more = ref true
let journals_loading_more = ref false

let collect_journal p =
  let* p' = fetch_blocks p in
  let* refs = fetch_refs_blocks p' in
  (* title-tag chips need tag uuids/id for their context menu *)
  Outliner_ops.resolve_page_tags (repo ())
    { p' with Model.page_linked_refs = refs }

let journal_summaries w =
  match w with
  | Wire.Array xs | Wire.List xs ->
      List.filter_map Decode.page_of_summary xs
  | _ -> []

(* a journals list shorter than the scroller fires no scroll event —
   after each commit, pull the next chunk until the content overflows
   or the db runs out of days. Goes through the journals_load_more hook
   so it works for whichever loader the route installed *)
let maybe_fill_journals () =
  ignore
    (Web_dom.set_timeout_id
       (fun () ->
         match Web_dom.get_element_by_id "main-content-container" with
         | Some el
           when !journals_has_more
             (* native DOM stubs report 0 metrics — 0<=0+1 would pump
                every journal day eagerly *)
             && Web_dom.el_client_height el > 0.
             && Web_dom.el_scroll_height el
                <= Web_dom.el_client_height el +. 1. ->
             ignore (!Runtime.journals_load_more ())
         | _ -> ())
       150)

let load_journals () =
  Platform.perf_mark "nav:journals";
  journals_has_more := true;
  journals_loading_more := false;
  (let* w =
    Runtime.invoke2 "thread-api/get-latest-journals" (Wire.String (repo ()))
      (Wire.Int journals_initial)
  in
  let pages = journal_summaries w in
  if List.length pages < journals_initial then journals_has_more := false;
  let* arr = Js.Promise.all (Array.of_list (List.map collect_journal pages)) in
  let* js = Js.Promise.resolve (Array.to_list arr) in
  Js.Promise.resolve
    (match Runtime.route () with
     | Model.Journals | Model.Home ->
         Runtime.send (Action.Journals_loaded js);
         maybe_fill_journals ()
     | _ -> ()))
  |> Js.Promise.catch (fun e ->
         Platform.console_error ("load_journals failed", e);
         (match Runtime.route () with
          | Model.Journals | Model.Home ->
              Runtime.send Action.Page_load_failed
          | _ -> ());
         Js.Promise.resolve ())

(* scroll-end pagination — the next [journals_chunk] days fetch + append;
   days already loaded (e.g. a fresh page created mid-session) are
   deduped by uuid so the keyed list never sees the same day twice *)
let load_more_journals () : unit Js.Promise.t =
  if
    !journals_loading_more || not !journals_has_more
    || !Runtime.current_journals = []
  then Js.Promise.resolve ()
  else (
    journals_loading_more := true;
    (let* w =
       Runtime.invoke3 "thread-api/get-latest-journals"
         (Wire.String (repo ()))
         (Wire.Int journals_chunk)
         (Wire.Int (List.length !Runtime.current_journals))
     in
     let pages = journal_summaries w in
     if List.length pages < journals_chunk then
       journals_has_more := false;
     let* arr =
       Js.Promise.all (Array.of_list (List.map collect_journal pages))
     in
     (match !Runtime.current_route with
      | Some (Model.Journals | Model.Home) ->
          let known =
            List.fold_left
              (fun s (p : Model.page) ->
                match p.Model.page_uuid with
                | Some u -> SSet.add u s
                | None -> s)
              SSet.empty !Runtime.current_journals
          in
          let fresh =
            Array.to_list arr
            |> List.filter (fun (p : Model.page) ->
                   match p.Model.page_uuid with
                   | Some u -> not (SSet.mem u known)
                   | None -> true)
          in
          if fresh <> [] then (
            Runtime.send
              (Action.Journals_loaded
                 (!Runtime.current_journals @ fresh));
            maybe_fill_journals ())
      | _ -> ());
     journals_loading_more := false;
     Js.Promise.resolve ())
    |> Js.Promise.catch (fun e ->
           journals_loading_more := false;
           Platform.console_error ("load_more_journals failed", e);
           Js.Promise.resolve ()))

(* cljs go-to-journals!: a configured :default-home page takes over the
   home route, so the Journals nav lands on #/all-journals there and on
   #/ otherwise *)
let go_to_journals_target () : (string * Model.route) Js.Promise.t =
  let* cfg = Sdk_config.read_config (repo ()) in
  Js.Promise.resolve
    (match
       match Wire.get cfg "default-home" with
       | Some dh -> Wire.map_get_string dh "page"
       | None -> None
     with
     | Some _ -> ("#/all-journals", Model.Journals)
     | None -> ("#/", Model.Home))

(* cljs util/scroll-to-top on the app scroller *)
let scroll_to_top () =
  match Web_dom.get_element_by_id "main-content-container" with
  | Some el -> Web_dom.el_set_scroll_top el 0.
  | None -> ()

(* fetches for the same route can resolve out of order — only the
   latest-initiated load may commit, otherwise an older response lands
   last and clobbers fresher state (e.g. page_blocks before a pending
   insert was committed); callers capture !Runtime.load_gen right after
   their own incr and compare at commit time *)

(* drop a send when the route moved on while the fetch was in-flight —
   otherwise a slow stale load overwrites the page the user navigated to *)
let stale (route : Model.route) = Runtime.route () <> route

(* routes that already committed a route_page — a same-route reload can
   race a mid-apply sync tx and read the page as missing; that transient
   must not swap the live view for "Page not found" *)
let loaded_route : Model.route option ref = ref None

(* route whose load is in flight — push_page_route resolves a route
   twice (set_location_hash's synchronous "ls:navigate" dispatch, then
   the hashchange event) and the second resolve used to refetch the
   whole route while the first fetch was still running *)
let loading_route : Model.route option ref = ref None

let stale_page (p : Model.page) () =
  match (Runtime.model ()).Model.route_page with
  | Some c -> c.Model.page_uuid <> p.Model.page_uuid
  | None -> true

(* get-page-route-info resolves name/uuid/lookup-ref -> summary *)
let rec load_page_ref for_route ref_v =
  incr Runtime.load_gen;
  let gen = !Runtime.load_gen in
  let is_stale () = stale for_route || gen <> !Runtime.load_gen in
  (let* info =
    Runtime.invoke2 "thread-api/get-page-route-info"
      (Wire.String (repo ())) ref_v
  in
  Platform.perf_mark "nav:route-info";
  (* cljs redirect-to-page!: an alias page's route resolves to
            its source page (self-alias guard: don't loop when the route
            already targets the source uuid) *)
  match
    ( Wire.map_get_uuid info "alias-source-uuid"
    , Wire.as_uuid ref_v )
  with
  | Some src, cur when cur <> Some src ->
      if not (is_stale ()) then
        Platform.set_location_hash
          (Runtime.nav_hash ("#/page/" ^ src));
      Js.Promise.resolve ()
  | _ -> (
  match Decode.page_of_summary info with
  | Some p ->
      let* p' = fetch_blocks p in
      Platform.perf_mark "nav:blocks";
      let* p'' = Outliner_ops.resolve_page_tags (repo ()) p' in
      (* cljs page-inner renders the :block/parent namespace chain as a
         breadcrumb above the title — same parents endpoint the
         block-zoom load uses, keyed by the page uuid *)
      let* p'' =
        match p''.Model.page_uuid with
        | Some u ->
            (let* parents_w =
               Runtime.invoke2 "thread-api/get-block-parents"
                 (Wire.String (repo ()))
                 (Wire.List
                    [ Wire.Keyword "block/uuid"; Wire.Uuid u ])
             in
             let page_parents =
               Wire.elems parents_w
               |> List.filter_map (fun w ->
                      match w with
                      | Wire.Map _ -> Some (Decode.block_of_wire w)
                      | _ -> None)
             in
             Js.Promise.resolve { p'' with Model.page_parents })
        | None -> Js.Promise.resolve p''
      in
      Platform.perf_mark "nav:tags";
      if not (is_stale ()) then (
        (* a fresh page snapshot is authoritative —
           drop pending committed-buffer title paints *)
        Editor_state.clear_overrides ();
        loaded_route := Some for_route;
        (* cljs update-page-label!: body[data-page] carries the route
           page title (pdf overlay CSS keys off the attribute) *)
        Web_dom.body_set_data "page" p''.Model.page_title;
        (Platform.perf_mark "router:page-loaded"; Runtime.send (Action.Page_loaded p''));
        fetch_ref_count ~stale:is_stale p'';
        Outliner_ops.fetch_unlinked_exists
          ~stale:is_stale p'';
        (* zoom-out to a page parent keeps the zoomed
           block in edit mode (cljs pending-edit) *)
        (match Editor_actions.consume_pending_zoom ()
         with
         | Some u when Editor_state.ready () -> (
             match Editor_state.find u with
             | Some zb ->
                 Editor_actions.enter_edit ~scope:"main"
                   u
                   (String.length zb.Model.block_title)
             | None -> ())
         | _ -> ()));
      Js.Promise.resolve ()
  | None -> (
      (* cljs journal nav lands on dates that have no page yet — the
         route creates the journal page on the fly; non-journal names
         keep the inline :page/not-found *)
      match ref_v with
      | Wire.String n when Dates.is_journal_title n ->
          (let* _ = Outliner_ops.apply_create_page n in
           load_page_ref for_route ref_v)
      | _ ->
          if (not (is_stale ())) && !loaded_route <> Some for_route
          then Runtime.send Action.Page_load_failed;
          Js.Promise.resolve ())))
  |> Js.Promise.catch (fun _ ->
         if (not (is_stale ())) && !loaded_route <> Some for_route then
           Runtime.send Action.Page_load_failed;
         Js.Promise.resolve ())

(* Home: default-home config page when set & resolvable, else today's
   journal page (no config) or the journals list (config set but the
   page is missing). *)
let load_home () =
  let repo = repo () in
  (let* cfg = Sdk_config.read_config repo in
  let page_name =
    match Wire.get cfg "default-home" with
    | Some dh -> Wire.map_get_string dh "page"
    | None -> None
  in
  match page_name with
  | Some name ->
      (let* info =
        Runtime.invoke2 "thread-api/get-page-route-info"
          (Wire.String repo) (Wire.String name)
      in
      match Decode.page_of_summary info, stale Model.Home with
      | Some p, false ->
          Runtime.send (Action.Navigate_to (Model.Page name));
          let* p' = fetch_blocks p in
          let* p'' = Outliner_ops.resolve_page_tags repo p' in
          if not (stale (Model.Page name)) then (
            Editor_state.clear_overrides ();
            loaded_route := Some (Model.Page name);
            (Platform.perf_mark "router:page-loaded"; Runtime.send (Action.Page_loaded p''));
            fetch_ref_count
              ~stale:(fun () ->
                stale (Model.Page name))
              p'');
          Js.Promise.resolve ()
      | None, false ->
          Runtime.send (Action.Navigate_to Model.Journals);
          load_journals ()
      | _ -> Js.Promise.resolve ())
  (* cljs home renders the journals list (all-journals >
     journal-item), not today's journal as a standalone page *)
  | None ->
      Runtime.reload_current_view := load_journals;
      Runtime.journals_load_more := load_more_journals;
      load_journals ())
  |> Js.Promise.catch (fun e ->
         Platform.console_error ("load_home failed", e);
         (match Runtime.route () with
          | Model.Home -> Runtime.send Action.Page_load_failed
          | _ -> ());
         Js.Promise.resolve ())

let load_block_zoom uuid =
  incr Runtime.load_gen;
  let gen = !Runtime.load_gen in
  (let* w =
    Runtime.invoke2 "thread-api/get-blocks" (Wire.String (repo ()))
      (Wire.Array
         [ Wire.Map
             [ (Wire.String "id", Wire.Uuid uuid)
             ; ( Wire.String "opts"
               , Wire.Map
                   [ (Wire.Keyword "children?", Wire.Bool true)
                   ; (* the zoomed block is the container's root — its
                        children render even when the block is collapsed in
                        the page *)
                     ( Wire.Keyword "include-collapsed-children?"
                     , Wire.Bool true )
                   ] )
             ]
         ])
  in
  Js.Promise.resolve
    (match Wire.elems w with
     | [ pair ] -> (
         let blk =
           (* the pair's flat `children` carry the full maps;
              splice them into block/children before decoding *)
           match Decode.nest_get_blocks pair with
           | Some w -> Some w
           | None -> Wire.block_of_pair pair
         in
         match blk with
         | Some (Wire.Map _ as blk) -> (
             let b = Decode.block_of_wire blk in
             (match b.Model.block_uuid with
              | Some u ->
                  Editor_state.expand_root
                    ~scope:("zoom-" ^ u) u
              | None -> ());
             (* cljs block-route-root renders the zoomed block itself
                as the root row (children nested under it) *)
             let ancestors =
               match b.Model.block_db_id with
               | Some id -> [ id ]
               | None -> []
             in
             let collapsed = ref Editor_state.String_set.empty in
             ignore
               ((let* parents_w =
                  Runtime.invoke2 "thread-api/get-block-parents"
                    (Wire.String (repo ()))
                    (Wire.List
                       [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
                in
                let page_parents =
                  Wire.elems parents_w
                  |> List.filter_map (fun w ->
                         match w with
                         | Wire.Map _ ->
                             Some (Decode.block_of_wire w)
                         | _ -> None)
                in
                let* bs0 = Outliner_ops.fill_embed_children (repo ()) ancestors collapsed [ b ] in
                let* bs = Outliner_ops.resolve_block_tags bs0 in
                (* drop the late result when the
                   zoom target is no longer routed *)
                if
                  gen = !Runtime.load_gen
                  && Runtime.route ()
                     = Model.Block_zoom uuid
                then (
                  Editor_state.clear_overrides ();
                  loaded_route
                  := Some (Model.Block_zoom uuid);
                  (Platform.perf_mark "router:page-loaded";
                  Runtime.send
                    (Action.Page_loaded
                       { Model.page_title =
                           b.Model.block_title
                       ; page_uuid = b.block_uuid
                       ; page_db_id = b.block_db_id
                       ; page_is_tag = false
                       ; page_is_property = false
                       ; page_icon = None
                       ; page_journal_day = None
                       ; page_is_library = false
                       ; page_internal = false
                       ; page_built_in = false
                       ; page_add_object = false
                       ; page_tags = b.Model.block_tags
                       ; page_tag_idents =
                           b.Model.block_tag_idents
                       ; page_tag_uuids =
                           b.Model.block_tag_uuids
                       ; page_tag_db_ids =
                           b.Model.block_tag_db_ids
                       ; page_blocks = bs
                       ; page_linked_refs = []
                       ; page_parents
                       ; page_db_collapsable =
                           b.Model
                             .block_db_collapsable
                       })));
                (match
                   Editor_actions.consume_pending_zoom ()
                 with
                 | Some u when Editor_state.ready () ->
                     Editor_actions.enter_edit
                       ~scope:("zoom-" ^ uuid)
                       u
                       (String.length b.Model.block_title)
                 | _ -> ());
                Js.Promise.resolve ())
                      |> Js.Promise.catch (fun e ->
                             Platform.console_error
                               ("load_block_zoom parents failed", e);
                             if
                               gen = !Runtime.load_gen
                               && Runtime.route ()
                                  = Model.Block_zoom uuid
                             then (
                               if
                                 !loaded_route
                                 <> Some (Model.Block_zoom uuid)
                               then
                                 Runtime.send
                                   Action.Page_load_failed);
                             Js.Promise.resolve ())))
         | _ ->
             if
               (not (stale (Model.Block_zoom uuid)))
               && !loaded_route <> Some (Model.Block_zoom uuid)
             then Runtime.send Action.Page_load_failed)
     | _ ->
         if
           (not (stale (Model.Block_zoom uuid)))
           && !loaded_route <> Some (Model.Block_zoom uuid)
         then Runtime.send Action.Page_load_failed))
  |> Js.Promise.catch (fun e ->
         Platform.console_error ("load_block_zoom failed", e);
         if
           (not (stale (Model.Block_zoom uuid)))
           && !loaded_route <> Some (Model.Block_zoom uuid)
         then Runtime.send Action.Page_load_failed;
         Js.Promise.resolve ())

let load_route (route : Model.route) =
  loading_route := Some route;
  (* the non-page refresh hook belongs to the route that assigned it —
     re-arm it per route so callers (page-icon writes, the refresh
     fallback) reload *this* view instead of whatever route last set it *)
  (match route with
   | Model.Journals | Model.Home ->
       Runtime.reload_current_view := load_journals;
       Runtime.journals_load_more := load_more_journals
   | Model.Page s ->
       Runtime.reload_current_view :=
         (fun () -> load_page_ref route (Wire.page_ref s));
       Runtime.journals_load_more := (fun () -> Js.Promise.resolve ())
   | Model.Block_zoom uuid ->
       Runtime.reload_current_view := (fun () -> load_block_zoom uuid);
       Runtime.journals_load_more := (fun () -> Js.Promise.resolve ())
   | Model.Library ->
       Runtime.reload_current_view :=
         (fun () -> load_page_ref route (Wire.String "Library"));
       Runtime.journals_load_more := (fun () -> Js.Promise.resolve ())
   | Model.All_pages | Model.All_graphs | Model.Graph_view | Model.Import
   | Model.Not_found _ | Model.Settings ->
       Runtime.reload_current_view := (fun () -> Js.Promise.resolve ());
       Runtime.journals_load_more := (fun () -> Js.Promise.resolve ()));
  match route with
  | Model.Home -> ignore (load_home ())
  | Model.Page s ->
      ignore (load_page_ref route (Wire.page_ref s))
  | Model.Block_zoom uuid -> ignore (load_block_zoom uuid)
  | Model.Journals -> ignore (load_journals ())
  | Model.Library ->
      ignore (load_page_ref route (Wire.String "Library"))
  | Model.All_pages | Model.All_graphs | Model.Graph_view | Model.Import
  | Model.Not_found _ | Model.Settings ->
      ()

let resolve () =
  Platform.perf_mark "router:resolve";
  let route = parse_hash () in
  (match Runtime.route () with
  | r when r = route ->
      (* our own set_location_hash (or a repeat hashchange) for the route
         already shown — Navigate_to would blank route_page
         while the same data refetches; just refresh in place. A load
         for this same route already in flight (the push's second
         resolve) is skipped entirely — the dedupe clears on commit *)
      if !loading_route <> Some route then load_route route;
      Option.iter jump_to_anchor (route_anchor ())
  | _ ->
      (* commit and close any in-progress edit before the route swaps
         (cljs exits editing on navigation) *)
      Editor_actions.exit_edit ~select:false;
      (* cljs unmounts its modal stack on route change *)
      if Dialogs_state.ready () then Dialogs_state.close_all ();
      Runtime.send (Action.Navigate_to route);
      (* cljs events.cljs router/route-changed → plugin route hook *)
      Plugin_host.fire_route_changed route;
      (* the new route hasn't loaded yet — a lookup miss must be allowed
         to render :page/not-found *)
      loaded_route := None;
      (* cljs settings-effect cleanup: data-settings-tab only while the
         settings route/dialog is active *)
      if route <> Model.Settings then Settings_state.deactivate ();
      load_route route;
      Option.iter jump_to_anchor (route_anchor ());
      Runtime.flush ())

(* worker sync-db-changes broadcast: reload the current route's data
   without Navigate_to (keeps route_page until the fresh one lands, so
   the page does not blank). Broadcasts can arrive in bursts (one per
   applied op), and each reload remounts the block tree — debounce so a
   burst collapses into one refetch *)
let reload_timer = ref 0

let reload () =
  Platform.perf_mark "router:reload";
  Web_dom.clear_timeout !reload_timer;
  reload_timer :=
    Web_dom.set_timeout_id
      (fun () ->
        load_route (Runtime.route ()))
      30

let init () =
  Runtime.hooks.nav_load_done <- (fun () -> loading_route := None);
  (* the cheap side-fetches a delta-spliced refresh still needs — the
     linked-refs count plus the unlinked section's exists check *)
  Runtime.refresh_page_side :=
    (fun p ->
      let stale = stale_page p in
      fetch_ref_count ~stale p;
      Outliner_ops.fetch_unlinked_exists ~stale p);
  (* delta-spliced journals update: the owning journal's linked refs
     still need their cheap refresh (a block-title edit can create or
     remove a mention) — refetch just that page's refs and republish *)
  Runtime.hooks.refresh_journal_side <-
    (fun p ->
      ignore
        ((let* refs = fetch_refs_blocks p in
          Js.Promise.resolve
            (match Runtime.route () with
             | Model.Journals | Model.Home ->
                 Runtime.send
                   (Action.Journals_spliced
                      (List.map
                         (fun (j : Model.page) ->
                           if j.Model.page_uuid = p.Model.page_uuid then
                             { j with Model.page_linked_refs = refs }
                           else j)
                         (Runtime.model ()).Model.journals))
             | _ -> ()))
         |> Js.Promise.catch (fun e ->
                Platform.console_error
                  ("journal refs refresh failed", e);
                Js.Promise.resolve ())));
  (* cljs all-journals' Virtuoso endReached — scroll doesn't bubble, so a
     capture listener on the document sees the app scroller's events;
     nearing the bottom pulls the next chunk of journal days *)
  Web_dom.add_document_listener "scroll" (fun ev ->
      match Runtime.route () with
      | Model.Journals | Model.Home -> (
          match Web_dom.ev_target ev with
          | Some el
            when Web_dom.el_id el = "main-content-container"
              && Web_dom.el_client_height el > 0.
              && Web_dom.el_scroll_height el -. Web_dom.el_scroll_top el
                 -. Web_dom.el_client_height el
                 <= Web_dom.el_client_height el ->
              ignore (!Runtime.journals_load_more ())
          | _ -> ())
      | _ -> ())
    true;
  Platform.on_hash_change resolve;
  Web_dom.on_document_event "ls:navigate" (fun _ -> resolve ());
  Web_dom.on_document_event "keydown" (fun ev ->
      if Platform.event_str ev "key" = "Escape" then (
        Runtime.send Action.Dismiss_all;
        Runtime.flush ()))
