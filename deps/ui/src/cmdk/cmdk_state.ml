(* Command palette (cmdk) state + actions — mirrors
   src/main/frontend/components/cmdk/core.cljs:
   groups create -> nodes -> commands, flat data-item-index,
   keyboard/mouse highlight, debounced search-blocks. *)

type group_id =
  | G_create
  | G_current_page
  | G_nodes
  | G_recently_updated
  | G_commands
  | G_files
  | G_filters
  | G_codes
  | G_themes

type command_id =
  | Cmd_journals
  | Cmd_search
  | Cmd_db_add
  | Cmd_move
  | Cmd_all_graphs
  | Cmd_all_pages
  | Cmd_validate
  | Cmd_rtc_start
  | Cmd_rtc_stop
  | Cmd_add_reaction
  | Cmd_add_comment

type action =
  | Create_page of string
  | Open_page of string (* block/uuid *)
  | Open_block of string (* block/uuid -> resolve owning page *)
  | Run of command_id
  | Set_filter of group_id

type item =
  { ikey : string
  ; idx : int
  ; gid : group_id
  ; ititle : string
  ; info : string option
  ; header : string option
  ; iicon : string (* tabler icon name, "" = none *)
  ; act : action
  }

type group =
  { gid : group_id
  ; gtitle : string
  ; gitems : item list
  ; gtotal : int
  ; glimit : int
  ; gexpanded : bool
  }

type view =
  { open_ : bool
  ; input : string
  ; move_mode : bool
  ; groups : group list
  ; expanded : group_id list (* groups showing their full result set *)
  ; hl : int (* flat index of the highlighted item, -1 = none *)
  ; mouse : bool
  ; filter : group_id option
  ; recents : item list
  }

type t =
  { vs : view Signal.state
  ; gen : int ref (* stale-response guard *)
  }

let initial_view =
  { open_ = false; input = ""; move_mode = false; groups = []
  ; expanded = []; hl = -1; mouse = false; filter = None
  ; recents = [] }

let make scheduler : t =
  { vs = Signal.state scheduler initial_view; gen = ref 0 }

let get st = Signal.get st.vs.state_signal

let set st v = Runtime.signal_set st.vs v
let set_in st f = set st (f (get st))

let flat_items (v : view) : item array =
  Array.of_list (List.concat_map (fun g -> g.gitems) v.groups)

let item_at v i =
  let xs = flat_items v in
  if i >= 0 && i < Array.length xs then Some xs.(i) else None

(* -- commands table ------------------------------------------------- *)

let commands : (command_id * string) list =
  [ (Cmd_journals, Ui_strings.t "command.go/journals")
  ; (Cmd_search, Ui_strings.t "cmdk.action/search")
  ; (Cmd_db_add, Ui_strings.t "command.graph/db-add")
  ; (Cmd_move, Ui_strings.t "command.editor/move-blocks")
  ; (Cmd_all_graphs, Ui_strings.t "command.go/all-graphs")
  ; (Cmd_all_pages, Ui_strings.t "command.go/all-pages")
  ; (Cmd_validate, "(Dev) Validate current graph")
  ; (Cmd_rtc_start, "(Dev) RTC Start")
  ; (Cmd_rtc_stop, "(Dev) RTC Stop")
  ; (Cmd_add_reaction, Ui_strings.t "command.editor/add-reaction")
  ; (Cmd_add_comment, Ui_strings.t "block.comments/add-comment") ]

let match_commands q =
  let q' = String.lowercase_ascii q in
  commands
  |> List.filter (fun (_, label) ->
         q' = ""
         || String.length q' = 0
         ||
         let l = String.lowercase_ascii label in
         let rec find i =
           i + String.length q' <= String.length l
           && (String.sub l i (String.length q') = q' || find (i + 1))
         in
         find 0)
  |> List.map (fun (cid, label) ->
         { ikey = "cmd-" ^ label; idx = -1; gid = G_commands
         ; ititle = label; info = None; header = None
         ; iicon = "command"; act = Run cid })

(* -- search --------------------------------------------------------- *)

let hidden_create_names = [ "config.edn"; "custom.js"; "custom.css" ]

let create_items q =
  if String.trim q = "" then []
  else if
    List.exists
      (fun n -> n = String.lowercase_ascii (String.trim q))
      hidden_create_names
  then []
  else if String.length q > 0 && String.get q 0 = '#' then
    let tag = String.sub q 1 (String.length q - 1) in
    if String.trim tag = "" then []
    else
      [ { ikey = "create-" ^ q; idx = -1; gid = G_create
        ; ititle = Ui_strings.t "cmdk.create/tag"
        ; info = Some (Ui_strings.tf "cmdk.info/create-tag" [ tag ])
        ; header = None; iicon = "new-page"; act = Create_page tag } ]
  else
    [ { ikey = "create-" ^ q; idx = -1; gid = G_create
      ; ititle = Ui_strings.t "cmdk.create/page"
      ; info = Some (Ui_strings.tf "cmdk.info/create-page" [ q ])
      ; header = None; iicon = "new-page"; act = Create_page q } ]

(* fixed rows under the Filters group (cljs `filters`; current-page entry
   needs current-page tracking we do not have yet) *)
let filter_items : item list =
  let row gid label icon =
    { ikey = "filter-" ^ label; idx = -1; gid = G_filters
    ; ititle = label; info = Some (Ui_strings.t "cmdk.filter/add")
    ; header = None; iicon = icon; act = Set_filter gid }
  in
  [ row G_nodes (Ui_strings.t "cmdk.filter/nodes") "point-filled"
  ; row G_codes (Ui_strings.t "cmdk.filter/codes") "code"
  ; row G_commands (Ui_strings.t "cmdk.filter/commands") "command"
  ; row G_files (Ui_strings.t "cmdk.filter/files") "file"
  ; row G_themes (Ui_strings.t "cmdk.filter/themes") "palette" ]

let str_field w k = Wire.map_get_string w k

let breadcrumb_of w =
  match Wire.get w "block.temp/breadcrumb" with
  | Some (Wire.List xs) | Some (Wire.Array xs) ->
      let parts =
        List.filter_map
          (fun m -> str_field m "block/title")
          xs
      in
      if parts = [] then None else Some (String.concat " / " parts)
  | _ -> None

let item_of_row w i : item =
  let uuid =
    match Wire.map_get_uuid w "block/uuid" with
    | Some u -> u
    | None -> Option.value (str_field w "block/uuid") ~default:""
  in
  let is_page =
    match Wire.get w "page?" with
    | Some (Wire.Bool b) -> b
    | _ -> false
  in
  let title =
    match
      [ str_field w "block.temp/original-title"; str_field w "block/title" ]
      |> List.filter_map Fun.id
    with
    | t :: _ -> t
    | [] -> ""
  in
  { ikey = "node-" ^ uuid ^ "-" ^ string_of_int i; idx = -1
  ; gid = G_nodes; ititle = title; info = None
  ; header = (if is_page then None else breadcrumb_of w)
  ; iicon = (if is_page then "file" else "point-filled")
  ; act = (if is_page then Open_page uuid else Open_block uuid) }

let wmap kvs = Wire.Map (List.map (fun (k, v) -> (Wire.kw k, v)) kvs)

let search_opts move_mode nodes_limit =
  wmap
    ([ ("limit", Wire.Int nodes_limit)
     ; ("search-limit", Wire.Int 100)
     ; ("enable-snippet?", Wire.Bool true)
     ; ("include-breadcrumb?", Wire.Bool true)
     ; ("include-matched-count?", Wire.Bool true)
     ; ("built-in?", Wire.Bool true) ]
    @ if move_mode then [ ("page-only?", Wire.Bool true) ] else [])

let nodes_limit move_mode expanded =
  if List.mem G_nodes expanded then 100 else if move_mode then 20 else 10

(* include-matched-count? returns {items, matched-count}; fall back to
   a bare array if the shape differs *)
let run_search repo q move_mode nodes_limit =
  Runtime.invoke3 "thread-api/search-blocks" (Wire.String repo)
    (Wire.String q) (search_opts move_mode nodes_limit)
  |> Js.Promise.then_ (fun w ->
         let rows, total =
           match w with
           | Wire.Array xs | Wire.List xs -> (xs, List.length xs)
           | Wire.Map _ ->
               let items =
                 match Wire.get w "items" with
                 | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
                 | _ -> []
               in
               ( items
               , Option.value (Wire.map_get_int w "matched-count")
                   ~default:(List.length items) )
           | _ -> ([], 0)
         in
         Js.Promise.resolve (List.mapi (fun i w -> item_of_row w i) rows, total))



(* number the flat item indices left-to-right, top-to-bottom *)
let renumber groups =
  let i = ref 0 in
  List.map
    (fun g ->
      let items =
        List.map
          (fun it ->
            let it = { it with idx = !i } in
            incr i;
            it)
          g.gitems
      in
      { g with gitems = items })
    groups

(* cljs `node-exists?`: a page result whose original-title matches the
   input suppresses the Create group *)
let node_exists q rows =
  let q' = String.lowercase_ascii (String.trim q) in
  q' <> ""
  && List.exists
       (fun (it : item) ->
         match it.act with
         | Open_page _ ->
             String.lowercase_ascii (String.trim it.ititle) = q'
         | _ -> false)
       rows

let group_order v q rows total =
  let create_g () =
    if node_exists q rows then None
    else
      Some
        { gid = G_create; gtitle = Ui_strings.t "cmdk.groups/create"
        ; gitems = create_items q; gtotal = 1; glimit = 1
        ; gexpanded = false }
  in
  let nodes_g () =
    { gid = G_nodes; gtitle = Ui_strings.t "cmdk.groups/nodes"
    ; gitems = rows; gtotal = max total (List.length rows)
    ; glimit = nodes_limit v.move_mode v.expanded
    ; gexpanded = List.mem G_nodes v.expanded }
  in
  let commands_g () =
    { gid = G_commands; gtitle = Ui_strings.t "cmdk.groups/commands"
    ; gitems = match_commands q; gtotal = List.length commands
    ; glimit = 5; gexpanded = List.mem G_commands v.expanded }
  in
  let filters_g () =
    { gid = G_filters; gtitle = Ui_strings.t "cmdk.groups/filters"
    ; gitems = filter_items; gtotal = List.length filter_items
    ; glimit = 99; gexpanded = false }
  in
  let recents_g () =
    let q' = String.lowercase_ascii (String.trim q) in
    let items =
      if q' = "" then v.recents
      else
        List.filter
          (fun (it : item) ->
            let l = String.lowercase_ascii it.ititle in
            let rec find i =
              i + String.length q' <= String.length l
              && (String.sub l i (String.length q') = q' || find (i + 1))
            in
            find 0)
          v.recents
    in
    { gid = G_recently_updated
    ; gtitle = Ui_strings.t "cmdk.groups/recently-updated"
    ; gitems = items; gtotal = List.length items
    ; glimit = 5; gexpanded = List.mem G_recently_updated v.expanded }
  in
  let starts_slash =
    String.length q > 0 && String.get q 0 = '/'
  in
  let has_slash =
    starts_slash
    || (try ignore (String.index q '/'); true with Not_found -> false)
  in
  match v.filter with
  | Some gid ->
      let only =
        match gid with
        | G_nodes -> [ nodes_g () ]
        | G_commands -> [ commands_g () ]
        | _ -> [] (* codes/files/themes have no backend yet *)
      in
      Option.to_list (create_g ()) @ only
  | None ->
      (* cljs `load-results :initial` resets the results atom to just
         recently-updated when the input is blank, and empty groups are
         dropped at render — so an empty query shows only recents *)
      let nonempty gs = List.filter (fun g -> g.gitems <> []) gs in
      if String.trim q = "" then [ recents_g () ]
      else if starts_slash then nonempty [ filters_g (); nodes_g () ]
      else if has_slash then
        nonempty
          (Option.to_list (create_g ()) @ [ nodes_g (); filters_g () ])
      else
        nonempty
          (Option.to_list (create_g ())
          @ [ nodes_g (); recents_g (); commands_g (); filters_g () ])

let apply_results st q move_mode expanded rows total =
  ignore move_mode;
  ignore expanded;
  set_in st (fun v ->
      if v.input <> q then v (* stale — input moved on *)
      else
        let groups =
          group_order v q rows total
          |> List.map (fun g ->
                 if g.gexpanded || List.length g.gitems <= g.glimit then g
                 else
                   { g with
                     gitems =
                       List.filteri (fun i _ -> i < g.glimit) g.gitems })
          |> List.filter (fun g -> g.gitems <> [])
          |> renumber
        in
        { v with
          groups
        ; hl =
            (match groups with
             | g :: _ -> (
                 match g.gitems with x :: _ -> x.idx | [] -> -1)
             | [] -> -1)
        })

let refresh st =
  let v = get st in
  incr st.gen;
  let gen = !(st.gen) in
  match !(Runtime.current_repo) with
  | None -> apply_results st v.input v.move_mode v.expanded [] 0
  | Some repo ->
      ignore
        (run_search repo v.input v.move_mode
           (nodes_limit v.move_mode v.expanded)
         |> Js.Promise.then_ (fun (rows, total) ->
                if gen = !(st.gen) then
                  apply_results st v.input v.move_mode v.expanded rows total;
                Js.Promise.resolve ())
         |> Js.Promise.catch (fun e ->
                Platform.console_error
                  ( "cmdk search failed"
                  , Option.value (Js.Json.stringifyAny e)
                      ~default:"unknown" );
                Js.Promise.resolve ()))

(* the create row must not depend on the worker search resolving *)
let upsert_create v =
  let others = List.filter (fun g -> g.gid <> G_create) v.groups in
  { v with
    groups =
      { gid = G_create; gtitle = ""; gitems = create_items v.input
      ; gtotal = 0; glimit = 1; gexpanded = false }
      :: others
  }

(* cljs load-results :initial — recently-updated pages from storage ids *)
let recents_item_of_wire w =
  match Decode.page_of_summary w with
  | Some p -> (
      match p.Model.page_uuid with
      | Some uuid ->
          Some
            { ikey = "recent-" ^ uuid; idx = -1; gid = G_recently_updated
            ; ititle = p.page_title; info = None; header = None
            ; iicon = "file"; act = Open_page uuid }
      | None -> None)
  | None -> None

let load_recents st repo =
  let ids =
    Wire.List
      (List.map
         (fun i -> Wire.Int i)
         (Sidebar_state.recent_ids_of_storage repo))
  in
  ignore
    (Runtime.invoke2 "thread-api/get-recent-pages" (Wire.String repo) ids
     |> Js.Promise.then_ (fun w ->
            let items =
              match w with
              | Wire.Array xs | Wire.List xs ->
                  List.filter_map recents_item_of_wire xs
              | _ -> []
            in
            set_in st (fun v -> { v with recents = items });
            refresh st;
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()))

let on_input st q =
  set_in st (fun v -> upsert_create { v with input = q });
  let gen = (incr st.gen; !(st.gen)) in
  Dom_ext.set_timeout (fun () -> if gen = !(st.gen) then refresh st) 100

(* -- open/close ------------------------------------------------------ *)

let open_palette ?(move = false) st =
  st.gen := !(st.gen) + 1;
  set_in st (fun v ->
          { v with open_ = true; input = ""; move_mode = move; mouse = false
          ; filter = None });
  (* prime synchronously so commands show before the search lands *)
  apply_results st "" move [] [] 0;
  refresh st;
  (match !(Runtime.current_repo) with
   | Some repo -> load_recents st repo
   | None -> ());
  let rec focus_input tries =
    match Dom_ext.doc_query_selector ".cp__cmdk-search-input" with
    | Some el -> Dom_ext.focus el
    | None ->
        if tries > 0 then Dom_ext.set_timeout (fun () -> focus_input (tries - 1)) 20
  in
  Dom_ext.set_timeout (fun () -> focus_input 20) 0

let close st = set_in st (fun v -> { v with open_ = false })

let clear_filter st =
  set_in st (fun v -> { v with filter = None });
  refresh st

let clear_or_close st =
  let v = get st in
  if v.filter <> None then (clear_filter st; true)
  else if v.input <> "" then (
    set_in st (fun v -> { v with input = "" });
    (match Dom_ext.doc_query_selector ".cp__cmdk-search-input" with
     | Some el -> Dom_ext.set_value el ""
     | None -> ());
    refresh st;
    true)
  else (close st; true)

(* -- highlight ------------------------------------------------------- *)

let set_hl st i mouse =
  set_in st (fun v -> { v with hl = i; mouse })

let move_hl st dir =
  let v = get st in
  let xs = flat_items v in
  let n = Array.length xs in
  if n > 0 then
    let i =
      if v.hl < 0 then (if dir > 0 then 0 else n - 1)
      else ((v.hl + dir) mod n + n) mod n
    in
    set_in st (fun v -> { v with hl = i; mouse = false });
    (match Dom_ext.doc_query_selector ".cp__cmdk .overflow-y-auto" with
     | Some scroller -> (
         match
           Dom_ext.query_selector scroller
             (Printf.sprintf "[data-item-index=\"%d\"]" i)
         with
         | Some row -> Dom_ext.scroll_row_into_view ~scroller ~row
         | None -> ())
     | None -> ())

let toggle_expand st gid expand =
  set_in st (fun v ->
      { v with
        expanded =
          if expand then
            if List.mem gid v.expanded then v.expanded
            else gid :: v.expanded
          else List.filter (fun g -> g <> gid) v.expanded });
  refresh st

(* -- run actions ----------------------------------------------------- *)

let toast msg cls =
  let d = Js.Dict.empty () in
  Js.Dict.set d "msg" (Js.Json.string msg);
  Js.Dict.set d "cls" (Js.Json.string cls);
  Dom_ext.dispatch_custom "ls:toast" (Js.Json.object_ d)

let load_page repo ref_v =
  Runtime.invoke3 "thread-api/get-page-blocks-tree" (Wire.String repo)
    ref_v Wire.Nil
  |> Js.Promise.then_ (fun blocks_w ->
         Js.Promise.resolve (Decode.blocks_of_wire blocks_w))

let goto_page repo uuid =
  (* navigation intent: commit and close any in-progress edit so the old
     page stops rendering an editor during the async load gap (e2e
     waits on .editor-visible and must not see the stale one) *)
  Editor_actions.exit_edit ~select:false;
  Runtime.invoke2 "thread-api/get-page-route-info" (Wire.String repo)
    (Wire.String uuid)
  |> Js.Promise.then_ (fun page_w ->
         match Decode.page_of_summary page_w with
         | None -> Js.Promise.resolve ()
         | Some page ->
             load_page repo
               (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
             |> Js.Promise.then_ (fun blocks ->
                    let page = { page with Model.page_blocks = blocks } in
                    (* invalidate in-flight route loads so their late
                       Page_loaded cannot clobber this fresh page *)
                    Router.bump_load_gen ();
                    Runtime.send (Action.Navigate_to (Model.Page uuid));
                    Runtime.send (Action.Page_loaded page);
                    Router.fetch_refs page;
                    Runtime.mark_nav ();
                    Platform.set_location_hash ("#/page/" ^ uuid);
                    Js.Promise.resolve ()))
let goto_today_journal repo =
  let day = Dates.today_journal_day () in
  Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
    (Wire.Int day)
  |> Js.Promise.then_ (fun page_w ->
         match Decode.page_of_summary page_w with
         | None -> Js.Promise.resolve ()
         | Some page -> (
             match page.Model.page_uuid with
             | Some uuid -> goto_page repo uuid
             | None -> Js.Promise.resolve ()))

let create_page title =
  match !(Runtime.current_repo) with
  | None -> ()
  | Some repo ->
      (* navigation intent: commit and close any in-progress edit so the
         old page stops rendering an editor during the async gap (e2e
         waits on .editor-visible and must not see the stale one) *)
      Editor_actions.exit_edit ~select:false;
      ignore
        (Runtime.invoke3 "thread-api/apply-outliner-ops" (Wire.String repo)
           (Wire.Array
              [ Wire.Array
                  [ Wire.Keyword "create-page"
                  ; Wire.Array
                      [ Wire.String title; Wire.Map [] ] ] ])
           (Wire.Map [])
         |> Js.Promise.then_ (fun w ->
                let uuid =
                  match Wire.get w "result" with
                  | Some (Wire.Array [ _; Wire.Uuid u ]) -> u
                  | Some (Wire.List [ _; Wire.Uuid u ]) -> u
                  | _ -> ""
                in
                goto_page repo uuid
                |> Js.Promise.then_ (fun () ->
                       (* a fresh page has no blocks; append_block inserts
                          the first block and enters edit mode on it *)
                       Editor_actions.append_block ();
                       Js.Promise.resolve ()))
         |> Js.Promise.catch (fun e ->
                Platform.console_error
                  ("cmdk create-page failed", Platform.error_inner e);
                Js.Promise.resolve ()))

let validate_graph repo =
  ignore
    (Runtime.invoke2 "thread-api/validate-db" (Wire.String repo)
       (Wire.Map [])
     |> Js.Promise.then_ (fun _ ->
            toast "Your graph is valid" "success";
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            toast "Validation failed" "error";
            Platform.console_error ("validate-db failed", e);
            Js.Promise.resolve ()))

(* "Move blocks to" trigger: move the selection (or the editing block)
   to the bottom of the chosen page — cljs editor/move-blocks trigger *)
let run_move st target =
  let uuids =
    if Editor_state.ready () then
      match
        Editor_state.String_set.elements (Editor_state.selected ())
      with
      | [] -> Option.to_list (Editor_state.editing_uuid ())
      | sel -> sel
    else []
  in
  close st;
  if uuids <> [] then (
    Editor_actions.clear_selection ();
    (* committing the dirty editing buffer must run before the move —
       move-blocks carries no titles, and apply would cancel the
       debounced save and lose it *)
    if Editor_state.ready () && Editor_state.editing () <> None then
      Editor_actions.exit_edit ~select:false;
    ignore
      (Outliner_ops.apply_and_refresh
         [ Outliner_ops.move_blocks_bottom uuids target ]))


(* :editor/add-reaction — applies to the block selection (or the block
   being edited); the picker anchors on the first target's row *)
let target_uuids () : string list =
  let sel = Editor_state.selected () in
  if not (Editor_state.String_set.is_empty sel) then
    Editor_state.String_set.elements sel
  else
    match Editor_state.editing () with
    | Some e -> [ e.Editor_state.uuid ]
    | None -> []

let run_add_reaction st =
  close st;
  match target_uuids () with
  | [] -> ()
  | uuids -> (
      let anchor =
        match uuids with
        | u :: _ -> Properties_dom.doc_query ("[blockid='" ^ u ^ "']")
        | [] -> None
      in
      match anchor with
      | None -> ()
      | Some anchor ->
          Icon_picker.open_picker ~anchor ~del:false ~on_chosen:(fun c ->
              match c with
              | Icon_picker.Emoji emoji_id ->
                  ignore
                    (Outliner_ops.apply_and_refresh
                       (List.map
                          (fun u ->
                            Outliner_ops.op "toggle-reaction"
                              [ Wire.Uuid u; Wire.String emoji_id
                              ; Wire.Nil ])
                          uuids))
              | _ -> ()))

(* :editor/add-comment — ensure-comments-area-for-blocks over the block
   selection (or the edited block); the area renders once the refresh
   lands *)
let run_add_comment repo st =
  close st;
  let uuids = target_uuids () in
  match repo, uuids with
  | Some repo, _ :: _ ->
      ignore
        (Runtime.invoke2 "thread-api/ensure-comments-area-for-blocks"
           (Wire.String repo)
           (Wire.Array (List.map (fun u -> Wire.Uuid u) uuids))
        |> Js.Promise.then_ (fun _ -> Outliner_ops.refresh_page ()))
  | _ -> ()
let run_item st it =
  let repo = !(Runtime.current_repo) in
  let v = get st in
  (match v.move_mode, it.act with
   | true, (Open_page target | Open_block target) -> run_move st target
   | _ -> (
   match it.act with
   | Create_page title ->
       close st;
       create_page title
   | Open_page uuid ->
       close st;
       Option.iter (fun repo -> ignore (goto_page repo uuid)) repo
   | Open_block uuid ->
       close st;
       Option.iter
         (fun repo ->
           ignore
             (Runtime.invoke2 "thread-api/get-block-page-info"
                (Wire.String repo)
                (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
              |> Js.Promise.then_ (fun w ->
                     match Wire.map_get_uuid w "block/uuid" with
                     | Some puuid -> goto_page repo puuid
                     | None -> Js.Promise.resolve ())))
         repo
   | Set_filter gid ->
       set_in st (fun v ->
           { v with filter = Some gid; input = "" });
       (match Dom_ext.doc_query_selector ".cp__cmdk-search-input" with
        | Some el -> Dom_ext.set_value el ""
        | None -> ());
       refresh st
   | Run cid ->
       (match cid with
        | Cmd_move ->
            (* stay open in move-blocks mode; page-only search *)
            set_in st (fun v ->
                { v with move_mode = true; input = "" });
            (match Dom_ext.doc_query_selector ".cp__cmdk-search-input" with
             | Some el ->
                 Dom_ext.set_value el "";
                 Dom_ext.focus el
             | None -> ());
            refresh st
        | Cmd_search -> () (* keep palette open on the input *)
        | Cmd_journals ->
            close st;
            (* cljs route-handler/go-to-journals! -> :home/:all-journals *)
            Platform.set_location_hash (Runtime.nav_hash "#/journals")
        | Cmd_all_graphs ->
            close st;
            Runtime.send (Action.Navigate_to Model.All_graphs);
            Platform.set_location_hash (Runtime.nav_hash "#/graphs")
        | Cmd_all_pages ->
            close st;
            Runtime.send (Action.Navigate_to Model.All_pages);
            Platform.set_location_hash (Runtime.nav_hash "#/all-pages")
        | Cmd_db_add ->
            close st;
            Dialogs_state.open_ "new-graph"
        | Cmd_validate ->
            close st;
            Option.iter validate_graph repo
        | Cmd_rtc_start | Cmd_rtc_stop ->
            (* RTC lifecycle lives outside this area; no-op per spec *)
            ()
        | Cmd_add_reaction -> run_add_reaction st
        | Cmd_add_comment -> run_add_comment repo st)))

let run_highlighted st =
  let v = get st in
  match item_at v v.hl with Some it -> run_item st it | None -> ()

(* shift+enter opens the highlighted page/block in the right sidebar
   (cljs cmdk on-shift-enter -> ui/open-in-right-sidebar) *)
let run_highlighted_sidebar st =
  let v = get st in
  match item_at v v.hl with
  | Some it -> (
      match it.act, !Sidebar_state.st_ref with
      | (Open_page uuid | Open_block uuid), Some sst ->
          close st;
          Sidebar_state.open_uuid sst uuid
      | _ -> run_item st it)
  | None -> ()

(* group of the currently highlighted item (for mod+down expand) *)
let hl_group st =
  let v = get st in
  Option.map (fun (it : item) -> it.gid) (item_at v v.hl)
