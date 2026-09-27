(* Command palette (cmdk) state + actions — mirrors
   src/main/frontend/components/cmdk/core.cljs:
   groups create -> nodes -> commands, flat data-item-index,
   keyboard/mouse highlight, debounced search-blocks. *)

type group_id =
  | G_create
  | G_nodes
  | G_commands

type command_id =
  | Cmd_journals
  | Cmd_search
  | Cmd_db_add
  | Cmd_move
  | Cmd_all_graphs
  | Cmd_all_pages
  | Cmd_graph_view
  | Cmd_validate
  | Cmd_rtc_start
  | Cmd_rtc_stop

type action =
  | Create_page of string
  | Open_page of string (* block/uuid *)
  | Open_block of string (* block/uuid -> resolve owning page *)
  | Run of command_id

type item =
  { ikey : string
  ; idx : int
  ; gid : group_id
  ; ititle : string
  ; info : string option
  ; header : string option
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
  }

type t =
  { vs : view Signal.state
  ; gen : int ref (* stale-response guard *)
  }

let initial_view =
  { open_ = false; input = ""; move_mode = false; groups = []
  ; expanded = []; hl = -1; mouse = false }

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
  ; (Cmd_graph_view, Ui_strings.t "command.go/graph-view")
  ; (Cmd_validate, "(Dev) Validate current graph")
  ; (Cmd_rtc_start, "(Dev) RTC Start")
  ; (Cmd_rtc_stop, "(Dev) RTC Stop") ]

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
         ; act = Run cid })

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
        ; header = None; act = Create_page tag } ]
  else
    [ { ikey = "create-" ^ q; idx = -1; gid = G_create
      ; ititle = Ui_strings.t "cmdk.create/page"
      ; info = Some (Ui_strings.tf "cmdk.info/create-page" [ q ])
      ; header = None; act = Create_page q } ]

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

let apply_results st q move_mode expanded rows total =
  set_in st (fun v ->
      if v.input <> q then v (* stale — input moved on *)
      else
        let groups =
          [ { gid = G_create; gtitle = ""; gitems = create_items q
            ; gtotal = 0; glimit = 1; gexpanded = false }
          ; { gid = G_nodes
            ; gtitle = Ui_strings.t "cmdk.groups/nodes"
            ; gitems = rows; gtotal = max total (List.length rows)
            ; glimit = nodes_limit move_mode expanded
            ; gexpanded = List.mem G_nodes expanded }
          ; { gid = G_commands
            ; gtitle = Ui_strings.t "cmdk.groups/commands"
            ; gitems = match_commands q; gtotal = List.length commands
            ; glimit = 5; gexpanded = List.mem G_commands expanded } ]
          |> List.filter (fun g -> g.gitems <> [])
          |> List.map (fun g ->
                 if g.gexpanded || List.length g.gitems <= g.glimit then g
                 else
                   { g with
                     gitems =
                       List.filteri (fun i _ -> i < g.glimit) g.gitems })
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

let on_input st q =
  set_in st (fun v -> upsert_create { v with input = q });
  let gen = (incr st.gen; !(st.gen)) in
  Dom_ext.set_timeout (fun () -> if gen = !(st.gen) then refresh st) 100

(* -- open/close ------------------------------------------------------ *)

let open_palette st =
  st.gen := !(st.gen) + 1;
  set_in st (fun v ->
      { v with open_ = true; input = ""; move_mode = false; mouse = false });
  (* prime synchronously so commands show before the search lands *)
  apply_results st "" false [] [] 0;
  refresh st;
  Dom_ext.set_timeout
    (fun () ->
      match Dom_ext.doc_query_selector ".cp__cmdk-search-input" with
      | Some el -> Dom_ext.focus el
      | None -> ())
    0

let close st = set_in st (fun v -> { v with open_ = false })

let clear_or_close st =
  let v = get st in
  if v.input <> "" then (
    set_in st (fun v -> { v with input = "" });
    (match Dom_ext.doc_query_selector ".cp__cmdk-search-input" with
     | Some el -> Dom_ext.set_value el ""
     | None -> ());
    refresh st;
    true)
  else false

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
  Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
    (Wire.String uuid)
  |> Js.Promise.then_ (fun page_w ->
         match Decode.page_of_summary page_w with
         | None -> Js.Promise.resolve ()
         | Some page ->
             load_page repo
               (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
             |> Js.Promise.then_ (fun blocks ->
                    let page = { page with Model.page_blocks = blocks } in
                    Runtime.send (Action.Navigate_to (Model.Page uuid));
                    Runtime.send (Action.Page_loaded page);
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
                (* TEMP-DEBUG: e wraps the real rejection in _1 *)
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

let run_item st it =
  let repo = !(Runtime.current_repo) in
  (match it.act with
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
            Platform.set_location_hash "#/journals"
        | Cmd_all_graphs ->
            close st;
            Runtime.send (Action.Navigate_to Model.All_graphs);
            Platform.set_location_hash "#/all-graphs"
        | Cmd_all_pages ->
            close st;
            Runtime.send (Action.Navigate_to Model.All_pages);
            Platform.set_location_hash "#/all-pages"
        | Cmd_graph_view ->
            close st;
            Runtime.send (Action.Navigate_to Model.Graph);
            Platform.set_location_hash "#/graph"
        | Cmd_db_add ->
            close st;
            Dialogs_state.open_ "new-graph"
        | Cmd_validate ->
            Option.iter validate_graph repo
        | Cmd_rtc_start | Cmd_rtc_stop ->
            (* RTC lifecycle lives outside this area; no-op per spec *)
            ()))

let run_highlighted st =
  let v = get st in
  match item_at v v.hl with Some it -> run_item st it | None -> ()

(* group of the currently highlighted item (for mod+down expand) *)
let hl_group st =
  let v = get st in
  Option.map (fun (it : item) -> it.gid) (item_at v v.hl)
