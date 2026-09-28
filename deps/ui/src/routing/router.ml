(* Hash routing — mirrors frontend.routes: "#/page/<name|uuid>",
   "#/block/<uuid>", "#/journals", "#/all-graphs", "#/library",
   default "#/". Listens hashchange + the "ls:navigate" CustomEvent
   (dispatched by sdk push_state). *)

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

let parse_hash () : Model.route =
  let p =
    match route_path () with
    | "" | "/" -> ""
    | p ->
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
          | "journals" -> Model.Journals
          | "library" -> Model.Library
          | "all-pages" -> Model.All_pages
          | "all-journals" -> Model.Journals
          | "all-graphs" -> Model.All_graphs
          | "graph" -> Model.Graph
          | _ -> Model.Not_found p)
      | None -> (
          match p with
          | "journals" | "all-journals" -> Model.Journals
          | "library" -> Model.Library
          | "all-pages" -> Model.All_pages
          | "all-graphs" -> Model.All_graphs
          | "graph" -> Model.Graph
          | "settings" -> Model.Settings
          | "page" | "block" -> Model.Not_found p
          | _ -> Model.Not_found p))

let repo () = Option.value !Runtime.current_repo ~default:""

(* ref wire for get-page-blocks-tree / get-page-route-info:
   Uuid for uuid strings, String for page names *)
let page_ref s =
  if Sdk_util.is_uuid_string s then Wire.Uuid s else Wire.String s

let ref_of_page (p : Model.page) =
  match p.Model.page_uuid, p.Model.page_title with
  | Some u, _ -> page_ref u
  | None, t -> page_ref t

let fetch_blocks (p : Model.page) =
  Runtime.invoke3 "thread-api/get-page-blocks-tree"
    (Wire.String (repo ())) (ref_of_page p) Wire.Nil
  |> Js.Promise.then_ (fun blocks_w ->
             (* fill :block/link rows' embed children so page embeds render
                the linked page's blocks *)
             let collapsed = ref Editor_state.String_set.empty in
             collapsed :=
               Outliner_ops.collect_collapsed !collapsed blocks_w;
             Outliner_ops.fill_embed_children (repo ())
               (Outliner_ops.ancestors_of p) collapsed
               (Decode.blocks_of_wire blocks_w)
             |> Js.Promise.then_ (fun blocks ->
                    Outliner_ops.set_collapsed !collapsed;
                    let blocks =
                      Decode.view_blocks ~library:p.Model.page_is_library
                        blocks
                    in
                    Outliner_ops.resolve_block_tags blocks))
      |> Js.Promise.then_ (fun blocks ->
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
             Js.Promise.resolve { p with Model.page_blocks = blocks })

let fetch_refs_blocks (p : Model.page) : Model.block list Js.Promise.t =
  match p.Model.page_db_id with
  | Some id ->
      Runtime.invoke2 "thread-api/get-block-refs"
        (Wire.String (repo ())) (Wire.Int id)
      |> Js.Promise.then_ (fun w ->
             (* cljs block-ref-count gates the references section with
                hidden-ref-id-pred, which excludes same-page refs — drop
                them here so a self-reference never shows the section *)
             let blocks =
               List.filter
                 (fun b ->
                   b.Model.block_page_name <> Some p.Model.page_title)
                 (Decode.blocks_of_wire w)
             in
             Js.Promise.resolve blocks)
  | None -> Js.Promise.resolve []

let fetch_refs (p : Model.page) =
  fetch_refs_blocks p
  |> Js.Promise.then_ (fun blocks ->
         Js.Promise.resolve (Runtime.send (Action.Refs_loaded blocks)))
  |> ignore

(* unlinked references: blocks whose title mentions the page title
   without a [[ref]] — the view search input filters by row title
   substring (cljs row-matched) *)
let fetch_unlinked (p : Model.page) =
  match p.Model.page_db_id with
  | Some id ->
      ignore
        (Runtime.invoke2 "thread-api/get-unlinked-references"
           (Wire.String (repo ())) (Wire.Int id)
         |> Js.Promise.then_ (fun w ->
                Js.Promise.resolve
                  (Runtime.send
                     (Action.Unlinked_loaded (Decode.blocks_of_wire w)))))
  | None -> ()

let fetch_unlinked_refs = Outliner_ops.fetch_unlinked_refs

let load_journals () =
  Runtime.invoke2 "thread-api/get-latest-journals" (Wire.String (repo ()))
    (Wire.Int 40)
  |> Js.Promise.then_ (fun w ->
         let pages =
           match w with
           | Wire.Array xs | Wire.List xs ->
               List.filter_map Decode.page_of_summary xs
           | _ -> []
         in
         let rec collect acc = function
           | [] -> Js.Promise.resolve (List.rev acc)
           | p :: rest ->
               fetch_blocks p
               |> Js.Promise.then_ (fun p' ->
                      fetch_refs_blocks p'
                      |> Js.Promise.then_ (fun refs ->
                             collect
                               ({ p' with Model.page_linked_refs = refs } :: acc)
                               rest))
         in
         collect [] pages
         |> Js.Promise.then_ (fun js ->
                Js.Promise.resolve
                  (match !Runtime.current_route with
                   | Some (Model.Journals | Model.Home) ->
                       Runtime.send (Action.Journals_loaded js)
                   | _ -> ())))

(* a fetch started for route R can resolve after navigation moved on —
   sending its Page_loaded would clobber the current page with stale data *)
let route_still_target missing =
  match !Runtime.current_route with
  | Some (Model.Page s) -> s = missing
  | Some Model.Library -> missing = "Library"
  | _ -> false

(* fetches for the same route can resolve out of order — only the
   latest-initiated load may commit, otherwise an older response lands
   last and clobbers fresher state (e.g. page_blocks before a pending
   insert was committed) *)
let bump_load_gen () = incr Runtime.load_gen

(* drop a send when the route moved on while the fetch was in-flight —
   otherwise a slow stale load overwrites the page the user navigated to *)
let stale (route : Model.route) = !Runtime.current_route <> Some route

(* get-page-route-info resolves name/uuid/lookup-ref -> summary *)
let load_page_ref for_route ref_v ~missing =
  incr Runtime.load_gen;
  Runtime.invoke2 "thread-api/get-page-route-info"
    (Wire.String (repo ())) ref_v
  |> Js.Promise.then_ (fun info ->
         match Decode.page_of_summary info with
         | Some p ->
             fetch_blocks p
             |> Js.Promise.then_ (fun p' ->
                    Outliner_ops.resolve_page_tags (repo ()) p'
                    |> Js.Promise.then_ (fun p'' ->
                           if not (stale for_route) then (
                             Runtime.send (Action.Page_loaded p'');
                             fetch_refs p'';
                             fetch_unlinked_refs p'');
                           Js.Promise.resolve ()))
         | None ->
             if not (stale for_route) then
               Runtime.send (Action.Navigate_to (Model.Not_found missing));             Js.Promise.resolve ())

(* Home: default-home config page when set & resolvable, else today's
   journal page (no config) or the journals list (config set but the
   page is missing). *)
let rec load_home () =
  let repo = repo () in
  Sdk_config.read_config repo
  |> Js.Promise.then_ (fun cfg ->
         let page_name =
           match Wire.get cfg "default-home" with
           | Some dh -> Wire.map_get_string dh "page"
           | None -> None
         in
         match page_name with
         | Some name ->
             Runtime.invoke2 "thread-api/get-page-route-info"
               (Wire.String repo) (Wire.String name)
             |> Js.Promise.then_ (fun info ->
                    match Decode.page_of_summary info, stale Model.Home with
                    | Some p, false ->
                        Runtime.send (Action.Navigate_to (Model.Page name));
                        fetch_blocks p
                        |> Js.Promise.then_ (fun p' ->
                               Outliner_ops.resolve_page_tags repo p'
                               |> Js.Promise.then_ (fun p'' ->
                                      if not (stale (Model.Page name)) then (
                                        Runtime.send (Action.Page_loaded p'');
                                        fetch_refs p'');
                                      Js.Promise.resolve ()))
                    | None, false ->
                        Runtime.send (Action.Navigate_to Model.Journals);
                        load_journals ()
                    | _ -> Js.Promise.resolve ())
         | None -> load_today_journal repo)

and load_today_journal repo =
  let day = Dates.today_journal_day () in
  incr Runtime.load_gen;
  Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
    (Wire.Int day)
  |> Js.Promise.then_ (fun page_w ->
         match Decode.page_of_summary page_w with
         | Some p ->
             fetch_blocks p
             |> Js.Promise.then_ (fun p' ->
                    Outliner_ops.resolve_page_tags repo p'
                    |> Js.Promise.then_ (fun p'' ->
                           if not (stale Model.Home) then
                             Runtime.send (Action.Page_loaded p'');
                           Js.Promise.resolve ()))
         | None -> Js.Promise.resolve ())

let load_block_zoom uuid =
  incr Runtime.load_gen;
  let gen = !Runtime.load_gen in
  Runtime.invoke2 "thread-api/get-blocks" (Wire.String (repo ()))
    (Wire.Array
       [ Wire.Map
           [ (Wire.String "id", Wire.Uuid uuid)
           ; ( Wire.String "opts"
             , Wire.Map [ (Wire.Keyword "children?", Wire.Bool true) ] )
           ]
       ])
  |> Js.Promise.then_ (fun w ->
         Js.Promise.resolve
           (match Sdk_util.wire_elems w with
            | [ pair ] -> (
                let blk =
                  match Wire.get pair "block" with
                  | Some b -> b
                  | None -> (
                      match Sdk_util.wire_elems pair with
                      | [ _; b ] -> b
                      | _ -> Wire.Nil)
                in
                match blk with
                | Wire.Map _ -> (
                    let b = Decode.block_of_wire blk in
                    (* cljs block-route-root renders the zoomed block itself
                       as the root row (children nested under it) *)
                    let ancestors =
                      match b.Model.block_db_id with
                      | Some id -> [ id ]
                      | None -> []
                    in
                    let collapsed = ref Editor_state.String_set.empty in
                    ignore
                      (Runtime.invoke2 "thread-api/get-block-parents"
                         (Wire.String (repo ()))
                         (Wire.List
                            [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
                       |> Js.Promise.then_ (fun parents_w ->
                              let page_parents =
                                Sdk_util.wire_elems parents_w
                                |> List.filter_map (fun w ->
                                       match w with
                                       | Wire.Map _ ->
                                           Some (Decode.block_of_wire w)
                                       | _ -> None)
                              in
                              Outliner_ops.fill_embed_children (repo ()) ancestors collapsed [ b ]
                              |> Js.Promise.then_ (fun bs0 ->
                                     Outliner_ops.resolve_block_tags bs0
                              |> Js.Promise.then_ (fun bs ->
                                     (* drop the late result when the
                                        zoom target is no longer routed *)
                                     if
                                       gen = !Runtime.load_gen
                                       && !Runtime.current_route
                                          = Some (Model.Block_zoom uuid)
                                     then
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
                                            ; page_blocks = bs
                                            ; page_linked_refs = []
                                            ; page_parents
                                            });
                                     (match
                                        Editor_actions.consume_pending_zoom ()
                                      with
                                      | Some u when Editor_state.ready () ->
                                          Editor_actions.enter_edit u
                                            (String.length b.Model.block_title)
                                      | _ -> ());
                                     Js.Promise.resolve ())))))
                | _ ->
                    if not (stale (Model.Block_zoom uuid)) then
                      Runtime.send
                        (Action.Navigate_to (Model.Not_found uuid)))
            | _ ->
                if not (stale (Model.Block_zoom uuid)) then
                  Runtime.send (Action.Navigate_to (Model.Not_found uuid))))

(* created-at range over named pages feeds the time-travel slider *)
let load_graph () =
  let query =
    "[:find (min ?ca) (max ?ca) :where [?e :block/name _]\
     [?e :block/created-at ?ca]]"
  in
  Runtime.invoke2 "thread-api/q" (Wire.String (repo ()))
    (Wire.Array [ Wire.String query ])
  |> Js.Promise.then_ (fun w ->
         let to_num = function
           | Wire.Int i -> Float.of_int i
           | Wire.Int64 i -> Int64.to_float i
           | Wire.Float f -> f
           | _ -> 0.
         in
         (match Sdk_util.wire_elems w with
          | [ row ] -> (
              match Sdk_util.wire_elems row with
              | [ mn; mx ] ->
                  Runtime.send (Action.Graph_loaded (to_num mn, to_num mx))
              | _ -> ())
          | _ -> ());
         Js.Promise.resolve ())

let load_route (route : Model.route) =
  match route with
  | Model.Home -> ignore (load_home ())
  | Model.Page s ->
      ignore (load_page_ref route (page_ref s) ~missing:s)
  | Model.Block_zoom uuid -> ignore (load_block_zoom uuid)
  | Model.Journals ->
      Runtime.reload_current_view := load_journals;
      ignore (load_journals ())
  | Model.Library ->
      ignore (load_page_ref route (Wire.String "Library") ~missing:"Library")
  | Model.Graph -> ignore (load_graph ())
  | Model.All_pages | Model.All_graphs | Model.Not_found _ -> ()
  | Model.Settings -> ()

let resolve () =
  let route = parse_hash () in
  match !Runtime.current_route with
  | Some r when r = route ->
      (* our own set_location_hash (or a repeat hashchange) for the route
         already shown — Navigate_to would blank route_page/current_page
         while the same data refetches; just refresh in place *)
      load_route route
  | _ ->
      (* commit and close any in-progress edit before the route swaps
         (cljs exits editing on navigation) *)
      Editor_actions.exit_edit ~select:false;
      Runtime.send (Action.Navigate_to route);
      (* cljs settings-effect cleanup: data-settings-tab only while the
         settings route/dialog is active *)
      if route <> Model.Settings then Settings_state.deactivate ();
      load_route route;
      Runtime.flush ()
(* worker sync-db-changes broadcast: reload the current route's data
   without Navigate_to (keeps route_page until the fresh one lands, so
   the page does not blank). Broadcasts can arrive in bursts (one per
   applied op), and each reload remounts the block tree — debounce so a
   burst collapses into one refetch *)
let reload_timer = ref 0

let reload () =
  Editor_dom.clear_timeout !reload_timer;
  reload_timer :=
    Editor_dom.set_timeout_id
      (fun () ->
        match !Runtime.current_route with
        | Some r -> load_route r
        | None -> resolve ())
      30

let init () =
  Platform.on_hash_change resolve;
  Platform.on_document_event "ls:navigate" (fun _ -> resolve ());
  Platform.add_document_listener "keydown" (fun ev ->
      if Platform.event_str ev "key" = "Escape" then (
        Runtime.send Action.Dismiss_all;
        Runtime.flush ()))
