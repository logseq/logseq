(* Command palette (cmdk) state + actions — mirrors
   src/main/frontend/components/cmdk/core.cljs:
   groups create -> nodes -> commands, flat data-item-index,
   keyboard/mouse highlight, debounced search-blocks. *)

open Promise_ext
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

type badge_kind =
  | No_badge
  | Text_badge (* inline "Current Page" after the title (page results) *)
  | Header_badge (* "Current Page" on the header row (block results) *)


type action =
  | Create_page of string
  | Create_tag of string
  | Open_page of string (* block/uuid *)
  | Open_block of string (* block/uuid -> resolve owning page *)
  | Open_file of string (* file/path, e.g. logseq/config.edn *)
  | Run of string (* cljs shortcut id, e.g. "editor/move-blocks" *)
  | Set_filter of group_id

type item =
  { ikey : string
  ; idx : int
  ; gid : group_id
  ; ititle : string
  ; info : string option
  ; header : string option
  ; iicon : string (* tabler icon name, "" = none *)
  ; isc : string (* decorated shortcut display string, "" = none *)
  ; ibadge : badge_kind
  ; act : action
  ; ihl : bool (* view.hl = idx — baked in by [decorate] *)
  ; imouse : bool (* mouse-mode flag, baked in by [decorate] *)
  ; iq : string (* query that produced this item (marks source) *)
  }

type group =
  { gid : group_id
  ; gtitle : string
  ; gitems : item list
  ; gtotal : int
  ; glimit : int
  ; gexpanded : bool
  ; gfilter_active : bool (* view.filter = Some gid, baked by [decorate] *)
  }

(* FTS5 highlight markers the worker embeds in search-result titles
   (`$pfts_2lqh>$match$<pfts_2lqh$`); the view parses them for rendering,
   title comparisons strip them *)
let pfts_open = "$pfts_2lqh>$"
let pfts_close = "$<pfts_2lqh$"

let find_sub sub s start =
  let n = String.length s and m = String.length sub in
  let rec go i =
    if i + m > n then -1
    else if String.sub s i m = sub then i
    else go (i + 1)
  in
  go start

(* strip the pfts markers, keeping the marked text itself *)
let strip_pfts text =
  let n = String.length text in
  let lo = String.length pfts_open and lc = String.length pfts_close in
  let buf = Buffer.create n in
  let rec go pos =
    let i = find_sub pfts_open text pos in
    if i < 0 then Buffer.add_substring buf text pos (n - pos)
    else
      let j = find_sub pfts_close text (i + lo) in
      if j < 0 then Buffer.add_substring buf text pos (n - pos)
      else begin
        Buffer.add_substring buf text pos (i - pos);
        Buffer.add_substring buf text (i + lo) (j - i - lo);
        go (j + lc)
      end
  in
  go 0;
  Buffer.contents buf

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
  ; edited : bool (* input was edited since open — cljs only loads the
                     filters group once :default refresh-results fires on
                     an input change, so a fresh-open blank palette shows
                     no filters *)
  ; tip : int (* 0 = filter-results, 1 = open-sidebar (cljs rand-tip) *)
  ; sidebar : bool (* cljs :sidebar? — drops the hints row and the group
                      show-more link *)
  }

type t =
  { vs : view Signal.state
  ; gen : int ref (* stale-response guard *)
  }

let initial_view =
  { open_ = false; input = ""; move_mode = false; groups = []
  ; expanded = []; hl = -1; mouse = false; filter = None
  ; recents = []; edited = false; tip = 0; sidebar = false }

let latest_vs : view Signal.signal option ref = ref None
let latest_t : t option ref = ref None

(* the palette singleton — lets keyboard shortcuts dispatch command ids
   through the same run_command path palette items take *)
let latest_st : t option ref = ref None

let make ?(register = true) scheduler : t =
  let vs = Signal.state scheduler initial_view in
  let st = { vs; gen = ref 0 } in
  (* the modal palette is the singleton shortcuts dispatch through;
     sidebar cmdk blocks are independent and must not steal the refs *)
  if register then begin
    latest_vs := Some vs.Signal.state_signal;
    latest_t := Some st;
    latest_st := Some st
  end;
  st
(* Signal.set stages the value as pending until the next stabilize —
   state_signal still reads the previously published value. Read pending
   first so same-tick updates (on_input -> refresh, chained set_in calls)
   see the freshest view instead of lagging one update behind. *)
let get st =
  match !(st.vs.Signal.pending) with
  | Some v -> v
  | None -> Signal.get st.vs.Signal.state_signal

(* whether the palette is open — chrome like the selection action-bar
   hides while it is up *)
let open_signal () =
  match !latest_vs with
  | Some vs -> Some (Signal.map (fun v -> v.open_) vs)
  | None -> None

let is_open () =
  match open_signal () with
  | Some s -> Signal.get s
  | None -> false

(* View-derived flags are baked into every item and group at publish
   time so keyed rows never subscribe the view signal themselves: a row
   removed mid-flush would otherwise re-mount its branch and emit DOM
   ops for nodes that the same batch tears down. *)
let decorate (v : view) : view =
  { v with
    groups =
      List.map
        (fun g ->
          { g with
            gfilter_active = v.filter = Some g.gid
          ; gitems =
              List.map
                (fun it ->
                  { it with
                    ihl = v.hl = it.idx
                  ; imouse = v.mouse
                  ; iq = (if g.gid = G_create then "" else v.input) })
                g.gitems })
        v.groups }

let set st v = Runtime.signal_set st.vs (decorate v)
let set_in st f = set st (f (get st))

(* Stable DOM key: every dynamic field (query, highlight, mouse state,
   position, rendered strings) republishes into the row's item_sig
   reactive props, so in-place updates are safe — a stable key can never
   re-mount dynamic branches mid-flush. Versioning the key on any of
   those fields instead remounts every result row on each keystroke or
   hover (~600 patch ops per char on a 50-item list). *)
let item_dom_key (it : item) = it.ikey

let flat_items (v : view) : item array =
  Array.of_list (List.concat_map (fun g -> g.gitems) v.groups)

let item_at v i =
  let xs = flat_items v in
  if i >= 0 && i < Array.length xs then Some xs.(i) else None

(* -- commands -------------------------------------------------------- *)

(* cljs state/developer-mode? — the storage value may be raw "true"
   (our settings) or JSON-quoted "\"true\"" (cljs storage) *)
let dev_mode () =
  match Platform.local_storage_get "developer-mode" with
  | Some "true" | Some "\"true\"" -> true
  | _ -> false


(* cljs command-palette/history: localStorage "commands-history" is a
   JSON array of {id,timestamp}; top-commands sorts by invoke count
   descending, ties keep the :id sort order *)
let invoke_counts () : (string, int) Hashtbl.t =
  let h = Hashtbl.create 16 in
  (match Platform.local_storage_get "commands-history" with
   | None -> ()
   | Some s -> (
       try
         match Js.Json.decodeArray (Platform.json_parse s) with
         | Some entries ->
             Array.iter
               (fun e ->
                 match Js.Json.decodeObject e with
                 | Some o -> (
                     match Js.Dict.get o "id" with
                     | Some idj -> (
                         match Js.Json.decodeString idj with
                         | Some id ->
                             Hashtbl.replace h id
                               (Option.value (Hashtbl.find_opt h id)
                                  ~default:0
                               + 1)
                         | None -> ())
                     | None -> ())
                 | None -> ())
               entries
         | None -> ()
       with _ -> ()));
  h

let record_invoke (c : Commands_data.cmd) =
  let ts = int_of_float (Js.Date.now ()) in
  let entry =
    Js.Json.object_
      (Js.Dict.fromList
         [ ("id", Js.Json.string c.id)
         ; ("timestamp", Js.Json.number (float_of_int ts)) ])
  in
  let hist =
    match Platform.local_storage_get "commands-history" with
    | Some s -> (
        try
          match Js.Json.decodeArray (Platform.json_parse s) with
          | Some a -> Array.to_list a
          | None -> []
        with _ -> [])
    | None -> []
  in
  Platform.local_storage_set "commands-history"
    (Js.Json.stringify (Js.Json.array (Array.of_list (entry :: hist))))

(* cljs top-commands: get-commands sorted by :id, then sorted by
   :invokes-count ascending and reversed — so counts end up descending
   and every equal-count run keeps reverse :id order *)
let command_table () : Commands_data.cmd list =
  let counts = invoke_counts () in
  let n c = Option.value (Hashtbl.find_opt counts c.Commands_data.id) ~default:0 in
  (* cljs commands.cljs plugin-commands-table merges palette-registered
     plugin simple commands into the same table *)
  Commands_data.table @ Plugin_host.palette_commands ()
  |> List.filter (fun c -> (not c.Commands_data.dev) || dev_mode ())
  |> List.stable_sort (fun a b -> compare a.Commands_data.id b.Commands_data.id)
  |> List.stable_sort (fun a b -> compare (n a) (n b))
  |> List.rev

let cmd_label (c : Commands_data.cmd) =
  if c.i18n then I18n.t c.label else c.label

let command_item (c : Commands_data.cmd) : item =
  { ikey = "cmd-" ^ c.id; idx = -1; gid = G_commands
  ; ititle = cmd_label c; info = None; header = None
  ; iicon = "command"; isc = Commands_data.display c.sc
  ; ibadge = No_badge; act = Run c.id
  ; ihl = false; imouse = false; iq = "" }

(* cljs load-results :commands — fuzzy-search-multi over the english
   label (en locale), limit 20 *)
let commands_matched q : Commands_data.cmd list =
  let cmds = command_table () in
  if String.trim q = "" then cmds
  else
    Fuzzy.fuzzy_search_multi ~extract_fns:[ cmd_label ] ~limit:20 cmds q

let commands_items q : item list =
  List.map command_item (commands_matched q)

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
        ; ititle = I18n.t "cmdk.create/tag"
        ; info = Some (I18n.tf "cmdk.info/create-tag" [ tag ])
        ; header = None; iicon = "new-page"; isc = ""; ibadge = No_badge
        ; act = Create_tag tag; ihl = false; imouse = false; iq = "" } ]
  else
    [ { ikey = "create-" ^ q; idx = -1; gid = G_create
      ; ititle = I18n.t "cmdk.create/page"
      ; info = Some (I18n.tf "cmdk.info/create-page" [ q ])
      ; header = None; iicon = "new-page"; isc = ""; ibadge = No_badge
      ; act = Create_page q; ihl = false; imouse = false; iq = "" } ]

(* cljs state/get-current-page equivalent — the :page route counts, and a
   block zoom is still a :page route there (path param = block uuid) *)
let current_page_uuid () =
  match Runtime.route () with
  | Model.Page _ | Model.Block_zoom _ ->
      Option.bind (Runtime.model ()).Model.route_page (fun p -> p.Model.page_uuid)
  | _ -> None

(* cljs `filters` — leading "Search only current page" row exists only
   when a current page is loaded *)
let filter_items () : item list =
  let row gid label icon =
    { ikey = "filter-" ^ label; idx = -1; gid = G_filters
    ; ititle = label; info = Some (I18n.t "cmdk.filter/add")
    ; header = None; iicon = icon; isc = ""; ibadge = No_badge
    ; act = Set_filter gid; ihl = false; imouse = false; iq = "" }
  in
  (match current_page_uuid () with
   | Some _ ->
       [ row G_current_page (I18n.t "cmdk.filter/current-page")
           "file" ]
   | None -> [])
  @ [ row G_nodes (I18n.t "cmdk.filter/nodes") "point-filled"
    ; row G_codes (I18n.t "cmdk.filter/codes") "code"
    ; row G_commands (I18n.t "cmdk.filter/commands") "command"
    ; row G_files (I18n.t "cmdk.filter/files") "file"
    ; row G_themes (I18n.t "cmdk.filter/themes") "palette" ]

(* cljs search/file-search on a db graph — the only :file/path entity is
   logseq/config.edn; fuzzy-match like cljs (clean-str + limit 99) *)
let known_files = [ "logseq/config.edn" ]

let file_items q : item list =
  if String.trim q = "" then []
  else
    Fuzzy.fuzzy_search ~extract:(fun f -> f) ~limit:99 known_files q
    |> List.map (fun f ->
           { ikey = "file-" ^ f; idx = -1; gid = G_files; ititle = f
           ; info = None; header = None; iicon = "file"; isc = ""
           ; ibadge = No_badge; act = Open_file f
           ; ihl = false; imouse = false; iq = "" })

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

(* cljs list-item current-page-badge-placement: page results badge the
   title, block results badge the header *)
let badge_of w is_page uuid =
  match current_page_uuid () with
  | None -> No_badge
  | Some cur ->
      let row_page =
        if is_page then Some uuid
        else Wire.map_get_uuid w "block/page"
      in
      (match row_page with
       | Some p when p = cur ->
           if is_page then Text_badge else Header_badge
       | _ -> No_badge)

(* cljs icon-component/get-node-icon: the entity's own
   logseq.property/icon, then class -> hash, property -> letter-p, a
   first-tag icon, page -> file, else the generic block point *)
let node_icon_of w is_page =
  let tags =
    match Wire.get w "block/tags" with
    | Some (Wire.List xs) | Some (Wire.Array xs) -> xs
    | _ -> []
  in
  let has_tag ident =
    List.exists (fun t -> str_field t "db/ident" = Some ident) tags
  in
  match str_field w "logseq.property/icon" with
  | Some ic when ic <> "" -> ic
  | _ ->
      if has_tag "logseq.class/Tag" then "hash"
      else if has_tag "logseq.class/Property" then "letter-p"
      else
        (match
           List.find_map
             (fun t -> str_field t "logseq.property/icon")
             tags
         with
         | Some ic when ic <> "" -> ic
         | _ -> if is_page then "file" else "point-filled")

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
      [ str_field w "block.temp/unique-title"
      ; str_field w "block.temp/original-title"; str_field w "block/title" ]
      |> List.filter_map Fun.id
    with
    | t :: _ -> t
    | [] -> ""
  in
  { ikey = "node-" ^ uuid ^ "-" ^ string_of_int i; idx = -1
  ; gid = G_nodes; ititle = title; info = None
  ; header = (if is_page then None else breadcrumb_of w)
  ; iicon = node_icon_of w is_page
  ; isc = ""; ibadge = badge_of w is_page uuid
  ; act = (if is_page then Open_page uuid else Open_block uuid)
  ; ihl = false; imouse = false; iq = "" }

let wmap kvs = Wire.Map (List.map (fun (k, v) -> (Wire.kw k, v)) kvs)

let search_opts ~dev move_mode nodes_limit =
  wmap
    ([ ("limit", Wire.Int nodes_limit)
     ; ("search-limit", Wire.Int 100)
     ; ("enable-snippet?", Wire.Bool true)
     ; ("include-breadcrumb?", Wire.Bool true)
     ; ("include-matched-count?", Wire.Bool true)
     ; ("built-in?", Wire.Bool true)
     ; ("dev?", Wire.Bool dev) ]
    @ if move_mode then [ ("page-only?", Wire.Bool true) ] else [])

(* cljs get-group-limit: nodes-ish groups page at 10, expand to 100 on
   mod+down (the filtered current-page group behaves the same) *)
let nodes_limit move_mode expanded =
  if List.mem G_nodes expanded then 100 else if move_mode then 20 else 10

let current_page_limit expanded =
  if List.mem G_current_page expanded then 100 else 10

(* include-matched-count? returns {items, matched-count}; fall back to
   a bare array if the shape differs *)
let run_search repo q move_mode nodes_limit =
  let* w =
    Runtime.invoke3 "thread-api/search-blocks" (Wire.String repo)
      (Wire.String q) (search_opts ~dev:Platform.dev_build move_mode nodes_limit)
  in
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
  Js.Promise.resolve (List.mapi (fun i w -> item_of_row w i) rows, total)



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
             String.lowercase_ascii (String.trim (strip_pfts it.ititle)) = q'
         | _ -> false)
       rows

let group_order v q rows total =
  let create_g () =
    if node_exists q rows then None
    else
      Some
        { gid = G_create; gtitle = I18n.t "cmdk.group/create"
        ; gitems = create_items q; gtotal = 1; glimit = 1
        ; gexpanded = false; gfilter_active = false }
  in
  let nodes_g () =
    { gid = G_nodes; gtitle = I18n.t "cmdk.group/nodes"
    ; gitems = rows; gtotal = max total (List.length rows)
    ; glimit = nodes_limit v.move_mode v.expanded
    ; gexpanded = List.mem G_nodes v.expanded; gfilter_active = false }
  in
  (* cljs :current-page group — same block search as nodes, then
     filtered client-side to items on the current page *)
  let current_page_g () =
    let items =
      List.filter_map
        (fun (it : item) ->
          if it.ibadge <> No_badge then Some { it with gid = G_current_page }
          else None)
        rows
    in
    { gid = G_current_page
    ; gtitle = I18n.t "cmdk.group/current-page"
      (* cljs laziness: current-page results load only via the filter row
         or group expansion — a normal search leaves the group empty so it
         renders nothing *)
    ; gitems =
        (if v.filter = Some G_current_page
            || List.mem G_current_page v.expanded
         then items else [])
    ; gtotal = max total (List.length items)
    ; glimit = current_page_limit v.expanded
    ; gexpanded = List.mem G_current_page v.expanded
    ; gfilter_active = v.filter = Some G_current_page }
  in
  let commands_g () =
    let items = commands_items q in
    { gid = G_commands; gtitle = I18n.t "cmdk.group/commands"
    ; gitems = items; gtotal = List.length items
    ; glimit = 5; gexpanded = List.mem G_commands v.expanded
    ; gfilter_active = false }
  in
  let files_g () =
    let items = file_items q in
    { gid = G_files; gtitle = I18n.t "cmdk.group/files"
    ; gitems = items; gtotal = List.length items
    ; glimit = 5; gexpanded = List.mem G_files v.expanded
    ; gfilter_active = false }
  in
  let filters_g () =
    let items = filter_items () in
    { gid = G_filters; gtitle = I18n.t "cmdk.group/filters"
    ; gitems = items; gtotal = List.length items
    ; glimit = 5; gexpanded = List.mem G_filters v.expanded
    ; gfilter_active = false }
  in
  let recents_g () =
    { gid = G_recently_updated
    ; gtitle = I18n.t "cmdk.group/recently-updated"
    ; gitems =
        (if String.trim q = "" then v.recents
         else
           Fuzzy.fuzzy_search ~extract:(fun (it : item) -> strip_pfts it.ititle)
             ~limit:99 v.recents q)
    ; gtotal = List.length v.recents
    ; glimit = 5; gexpanded = List.mem G_recently_updated v.expanded
    ; gfilter_active = false }
  in
  (* cljs emits the "Search only current page" row only on page
     routes — no page, no group *)
  let cp () =
    if current_page_uuid () <> None then [ current_page_g () ] else []
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
        | G_nodes -> cp () @ [ nodes_g () ]
        | G_current_page -> [ current_page_g () ]
        | G_commands -> [ commands_g () ]
        | G_files -> [ files_g () ]
        | _ -> [] (* codes/themes have no backend yet *)
      in
      (* cljs filtered order puts the Create row after the group *)
      only @ Option.to_list (create_g ())
  | None ->
      (* cljs group order: create?, current-page, nodes,
         recently-updated, commands, files, filters — slash-prefixed
         queries reorder to filters, current-page, nodes *)
      if starts_slash then filters_g () :: cp () @ [ nodes_g () ]
      else if has_slash then
        Option.to_list (create_g ())
        @ cp () @ [ nodes_g (); files_g (); filters_g () ]
      else if String.trim q = "" then
        (* cljs :default on blank input runs :initial + :filters — but a
           fresh-open palette never triggers :default (refresh-key
           unchanged), so a blank-opened palette shows only recents;
           filters appear once the user edits the input *)
        if v.edited then cp () @ [ recents_g (); filters_g () ]
        else cp () @ [ recents_g () ]
      else
        Option.to_list (create_g ())
        @ cp ()
        @ [ nodes_g (); recents_g (); commands_g (); files_g ()
          ; filters_g () ]

let apply_results st q move_mode expanded rows total =
  ignore move_mode;
  ignore expanded;
  set_in st (fun v ->
      if v.input <> q then v (* stale — input moved on *)
      else
        let groups =
          group_order v q rows total
          |> List.map (fun g ->
                 (* cljs visible-items: the filtered group is never
                    truncated *)
                 if v.filter = Some g.gid || g.gexpanded
                    || List.length g.gitems <= g.glimit then g
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

(* ~clear:false keeps the previous groups visible while the async search
   is in flight — cljs keeps rendering the last results during the input
   debounce instead of blanking the list *)
let refresh ?(clear = true) st =
  let v = get st in
  incr st.gen;
  let gen = !(st.gen) in
  (* commands/filters are local — apply them synchronously so a hanging
     worker query (e.g. repo mid-transition) can't leave stale groups *)
  if clear then apply_results st v.input v.move_mode v.expanded [] 0;
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      ignore
        ((let* (rows, total) =
           run_search repo v.input v.move_mode
             (match v.filter with
              | Some G_current_page -> current_page_limit v.expanded
              | _ -> nodes_limit v.move_mode v.expanded)
         in
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
  let g =
    { gid = G_create; gtitle = ""; gitems = create_items v.input
    ; gtotal = 0; glimit = 1; gexpanded = false; gfilter_active = false }
  in
  (* cljs filtered order puts create after the filtered group.
     renumber here too: until the search lands there is no apply_results
     pass, and hl addresses items by idx — an unnumbered create row
     could never be highlighted *)
  { v with
    groups =
      renumber
        (match v.filter with
         | Some _ -> others @ [ g ]
         | None -> g :: others)
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
            ; iicon = "file"; isc = ""
            ; ibadge = No_badge (* cljs recent-page-items never sets
                                 :current-page? *)
            ; act = Open_page uuid
            ; ihl = false; imouse = false; iq = "" }
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
    ((let* w = Runtime.invoke2 "thread-api/get-recent-pages" (Wire.String repo) ids in
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
  set_in st (fun v -> upsert_create { v with input = q; edited = true });
  (* search fires on the keystroke itself — a debounce delays the last
     keystroke's results past the worker roundtrip it should overlap.
     gen-stamped responses keep stale answers from overwriting newer
     input *)
  refresh ~clear:false st

(* -- open/close ------------------------------------------------------ *)

external js_random : unit -> float = "random" [@@mel.scope "Math"]

(* cljs components/cmdk/state.cljs: the global palette's last query and
   filter persist per repo in localStorage "ls-cmdk-last-search" and are
   restored on the next default-context open *)
let last_search_key = "ls-cmdk-last-search"

let filter_name = function
  | G_nodes -> Some "nodes"
  | G_commands -> Some "commands"
  | G_files -> Some "files"
  | G_themes -> Some "themes"
  | G_codes -> Some "codes"
  | G_current_page -> Some "current-page"
  | _ -> None

let filter_of_name = function
  | "nodes" -> Some G_nodes
  | "commands" -> Some G_commands
  | "files" -> Some G_files
  | "themes" -> Some G_themes
  | "codes" -> Some G_codes
  | "current-page" -> Some G_current_page
  | _ -> None

let save_last_search (v : view) =
  let repo =
    Option.value (Runtime.model ()).Model.repo ~default:"__no-repo__"
  in
  let entry =
    Js.Json.object_
      (Js.Dict.fromList
         [ ("query", Js.Json.string v.input)
         ; ( "filter-group"
           , (match Option.bind v.filter filter_name with
              | Some s -> Js.Json.string s
              | None -> Js.Json.null) )
         ; ("updated-at", Js.Json.number (Js.Date.now ())) ])
  in
  let map =
    match Platform.local_storage_get last_search_key with
    | Some s -> (
        try
          match Js.Json.decodeObject (Platform.json_parse s) with
          | Some o -> o
          | None -> Js.Dict.empty ()
        with _ -> Js.Dict.empty ())
    | None -> Js.Dict.empty ()
  in
  Js.Dict.set map repo entry;
  Platform.local_storage_set last_search_key
    (Js.Json.stringify (Js.Json.object_ map))

let load_last_search () : (string * group_id option) option =
  let repo =
    Option.value (Runtime.model ()).Model.repo ~default:"__no-repo__"
  in
  match Platform.local_storage_get last_search_key with
  | None -> None
  | Some s -> (
      try
        match Js.Json.decodeObject (Platform.json_parse s) with
        | Some o -> (
            match Option.bind (Js.Dict.get o repo) Js.Json.decodeObject with
            | Some eo ->
                let q =
                  Option.bind (Js.Dict.get eo "query")
                    Js.Json.decodeString
                  |> Option.value ~default:""
                in
                let fg =
                  Option.bind
                    (Option.bind (Js.Dict.get eo "filter-group")
                       Js.Json.decodeString)
                    filter_of_name
                in
                Some (q, fg)
            | None -> None)
        | None -> None
      with _ -> None)

let open_palette ?(move = false) st =
  st.gen := !(st.gen) + 1;
  (* publish the reset view before opening: the mount reads derived signals
     whose republish lags the source publish by one stabilize round, so
     this separate flush guarantees every derived map already carries the
     values the modal must mount with — a stale mount remounts
     mid-stabilize and emits create+drop ops for the same extension nodes
     in one batch, which the store/dom replay cannot survive *)
  let tip = if js_random () < 0.5 then 0 else 1 in
  let saved = if move then None else load_last_search () in
  set_in st (fun v ->
          { v with groups = []; hl = -1
          ; input = (match saved with Some (q, _) -> q | None -> "")
          ; move_mode = move
          ; mouse = false
          ; edited = false
          (* cljs move-selected-blocks opens via go-to-search! :nodes,
             which pins the nodes filter — keeps recents/filters out *)
          ; filter =
              (if move then Some G_nodes
               else match saved with Some (_, g) -> g | None -> None)
          ; tip });
  set_in st (fun v -> { v with open_ = true });
  let q = (get st).input in
  (* prime synchronously so commands show before the search lands *)
  apply_results st q move [] [] 0;
  refresh st;
  (match (Runtime.model ()).Model.repo with
   | Some repo -> load_recents st repo
   | None -> ());
  let rec focus_input tries =
    match Web_dom.query_selector ".cp__cmdk-search-input" with
    | Some el ->
        Web_dom.el_focus el;
        if q <> "" then (
          Web_dom.el_set_value el q;
          (* cljs mounts with the restored query fully selected
             (core.cljs (.select el)) so typing replaces it *)
          Web_dom.el_set_selection_range el 0 (String.length q))
    | None ->
        if tries > 0 then Web_dom.set_timeout (fun () -> focus_input (tries - 1)) 20
  in
  Web_dom.set_timeout (fun () -> focus_input 20) 0

let close st =
  let v = get st in
  (* cljs persist-cmdk-query-state! runs on unmount and every committed
     action; move mode is outside the default context *)
  if not v.move_mode then save_last_search v;
  set_in st (fun v -> { v with open_ = false })

let clear_filter st =
  set_in st (fun v -> { v with filter = None });
  refresh st

(* sidebar cmdk block: independent state seeded with the query —
   a fresh make() never runs :default in cljs either, but here the
   query is already non-blank so groups load normally *)
let make_sidebar scheduler q : t =
  let st = make ~register:false scheduler in
  set_in st (fun v -> { v with input = q; edited = true; sidebar = true });
  apply_results st q false [] [] 0;
  refresh st;
  st

(* cljs mod+enter -> consume-open-search-sidebar-keydown!: close the
   palette and pin the current query as a sidebar search pane *)
let open_search_sidebar st =
  let v = get st in
  close st;
  if String.trim v.input <> "" then
    match !Sidebar_state.st_ref with
    | Some sst -> Sidebar_state.add_search_item sst v.input
    | None -> ()

let clear_or_close st =
  let v = get st in
  (* cljs esc: move mode never clears its pinned nodes filter — blank input
     closes the dialog, non-blank just clears the text *)
  if v.move_mode && v.input = "" then (close st; true)
  else if v.filter <> None && not v.move_mode then (clear_filter st; true)
  else if v.input <> "" then (
    set_in st (fun v -> { v with input = "" });
    (match Web_dom.query_selector ".cp__cmdk-search-input" with
     | Some el -> Web_dom.el_set_value el ""
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
    (match Web_dom.query_selector ".cp__cmdk .cp__cmdk-scroller" with
     | Some scroller -> (
         match
           Web_dom.el_query scroller
             (Printf.sprintf "[data-item-index=\"%d\"]" i)
         with
         | Some row -> Web_dom.scroll_row_into_view ~scroller ~row
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
  Web_dom.dispatch_custom "ls:toast" (Js.Json.object_ d)

let goto_page _repo uuid =
  (* navigation intent: commit and close any in-progress edit so the old
     page stops rendering an editor during the async load gap (e2e
     waits on .editor-visible and must not see the stale one) *)
  Editor_actions.exit_edit ~select:false;
  (* cljs redirect-to-page! adds the page to recents — mark the nav so
     the sidebar pushes it once the page loads *)
  Runtime.mark_nav ();
  (* one navigation path: set the hash and let the router's hashchange
     resolve drive Navigate_to + load (a manual prefetch here double-
     fetched and bypassed nav_hash's ?graph-id) *)
  Platform.set_location_hash
    (Runtime.nav_hash ("#/page/" ^ uuid))
let goto_today_journal repo =
  let day = Dates.today_journal_day () in
  let* page_w =
    Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
      (Wire.Int day)
  in
  match Decode.page_of_summary page_w with
  | None -> Js.Promise.resolve ()
  | Some page -> (
      match page.Model.page_uuid with
      | Some uuid ->
          goto_page repo uuid;
          Js.Promise.resolve ()
      | None -> Js.Promise.resolve ())

(* worker create-page/create-class ops return the new entity's uuid as
   [:op-name uuid] *)
let created_uuid w =
  match Wire.get w "result" with
  | Some (Wire.Array [ _; Wire.Uuid u ]) -> Some u
  | Some (Wire.List [ _; Wire.Uuid u ]) -> Some u
  | _ -> None

let apply_create op label on_ok =
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      (* navigation intent: commit and close any in-progress edit so the
         old page stops rendering an editor during the async gap (e2e
         waits on .editor-visible and must not see the stale one) *)
      Editor_actions.exit_edit ~select:false;
      ignore
        ((let* w =
           Runtime.invoke3 "thread-api/apply-outliner-ops" (Wire.String repo)
             (Wire.Array [ op ]) (Wire.Map [])
         in
         (match created_uuid w with Some uuid -> on_ok repo uuid
          | None -> ());
         Js.Promise.resolve ())
         |> Js.Promise.catch (fun e ->
                Platform.console_error (label, Platform.error_inner e);
                Js.Promise.resolve ()))

let create_page title =
  apply_create
    (Outliner_ops.create_page title)
    "cmdk create-page failed"
    (fun repo uuid ->
      (* a fresh page has no blocks; append_block inserts the first
         block and enters edit mode on it — wait for the navigation's
         Page_loaded so it lands on the new page *)
      Runtime.on_page_loaded uuid (fun () ->
          Editor_actions.append_block ());
      goto_page repo uuid)

(* cljs cmdk "#tag" create: <create-class! without redirect, then the
   tag dialog opens — there is no tag dialog surface, so navigate to
   the new class page instead *)
let create_tag title =
  apply_create
    (Outliner_ops.create_class title)
    "cmdk create-tag failed"
    (fun repo uuid -> goto_page repo uuid)

let validate_graph repo =
  ignore
    ((let* _ =
       Runtime.invoke2 "thread-api/validate-db" (Wire.String repo)
         (Wire.Map [])
     in
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
      (* document order, not String_set uuid order — the worker applies
         move-blocks in the given order *)
      match Editor_actions.selected_uuids () with
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
        | u :: _ -> Web_dom.query_selector ("[data-blockid='" ^ u ^ "']")
        | [] -> None
      in
      match anchor with
      | None -> ()
      | Some anchor ->
          (* cljs icon-search {:tabs [[:emoji]] :default-tab :emoji} —
             the reaction picker is emoji-only *)
          ignore
            (Icon_picker.open_picker_with_opts ~anchor ~del:false
               ~opts:{ Icon_picker.emoji_only = true; sub = false }
               ~on_chosen:(fun c ->
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
                 | _ -> ())))

(* :editor/add-comment — ensure-comments-area-for-blocks over the block
   selection (or the edited block); the area renders once the refresh
   lands *)
let run_add_comment repo st =
  close st;
  let uuids = target_uuids () in
  match repo, uuids with
  | Some repo, _ :: _ ->
      ignore
        (let* _ =
          Runtime.invoke2 "thread-api/ensure-comments-area-for-blocks"
            (Wire.String repo)
            (Wire.Array (List.map (fun u -> Wire.Uuid u) uuids))
        in
        Outliner_ops.refresh_page ())
  | _ -> ()

(* :editor/add-property-icon — cljs opens the property dialog on
   :logseq.property/icon, whose editing cell is the icon picker; LUI
   opens the same picker chrome directly on the anchored block *)
let run_add_property_icon st =
  close st;
  match target_uuids () with
  | [] -> ()
  | uuids -> (
      let anchor =
        match uuids with
        | u :: _ -> Web_dom.query_selector ("[data-blockid='" ^ u ^ "']")
        | [] -> None
      in
      match anchor with
      | None -> ()
      | Some anchor -> (
          (let* first =
             match uuids with
             | u :: _ -> Properties_data.entity_by_uuid u
             | [] -> Js.Promise.resolve Wire.Nil
           in
           let has_icon =
             Properties_data.getf (Properties_data.untag first)
               "logseq.property/icon"
             <> None
           in
           Icon_picker.open_picker ~anchor ~del:has_icon
             ~on_chosen:(fun c ->
               let op_for u =
                 match c with
                 | Icon_picker.Remove ->
                     Outliner_ops.op "remove-block-property"
                       [ Wire.Uuid u
                       ; Wire.Keyword "logseq.property/icon" ]
                 | Icon_picker.Emoji id ->
                     Outliner_ops.op "set-block-property"
                       [ Wire.Uuid u
                       ; Wire.Keyword "logseq.property/icon"
                       ; Wire.Map
                           [ Wire.Keyword "type", Wire.Keyword "emoji"
                           ; Wire.Keyword "id", Wire.String id ] ]
                 | Icon_picker.Tabler (id, color) ->
                     Outliner_ops.op "set-block-property"
                       [ Wire.Uuid u
                       ; Wire.Keyword "logseq.property/icon"
                       ; Wire.Map
                           ([ Wire.Keyword "type"
                            , Wire.Keyword "tabler-icon"
                            ; Wire.Keyword "id", Wire.String id ]
                           @ (match color with
                              | Some c ->
                                  [ Wire.Keyword "color"
                                  , Wire.String c ]
                              | None -> [])) ]
               in
               ignore
                 (Outliner_ops.apply_and_refresh
                    (List.map op_for uuids)));
           Js.Promise.resolve ())
          |> ignore))

let with_sidebar f () =
  match !Sidebar_state.st_ref with
  | Some sst -> f sst
  | None -> ()

(* palette dispatch for commands that map onto existing editor/sidebar/
   settings actions; None when the id has no local equivalent *)
let editor_action cid : (unit -> unit) option =
  let first_target f () =
    match target_uuids () with u :: _ -> f u | [] -> ()
  in
  match cid with
  | "editor/indent" -> Some (fun () -> Editor_actions.indent_or_outdent ~indent:true)
  | "editor/outdent" -> Some (fun () -> Editor_actions.indent_or_outdent ~indent:false)
  | "editor/move-block-up" -> Some (fun () -> Editor_actions.move_blocks_up_down true)
  | "editor/move-block-down" -> Some (fun () -> Editor_actions.move_blocks_up_down false)
  | "editor/delete-selection" -> Some (fun () -> Editor_actions.delete_selection ())
  | "editor/select-all-blocks" -> Some (fun () -> Editor_actions.select_all ())
  | "editor/select-up" -> Some (fun () -> Editor_actions.extend_selection true)
  | "editor/select-down" -> Some (fun () -> Editor_actions.extend_selection false)
  | "editor/select-block-up" -> Some (fun () -> Editor_actions.move_selection_focus true)
  | "editor/select-block-down" -> Some (fun () -> Editor_actions.move_selection_focus false)
  | "editor/select-parent" ->
      Some
        (first_target (fun u ->
             match Editor_state.find_parent u with
             | Some (Some p, _) ->
                 Option.iter Editor_actions.select_single p.Model.block_uuid
             | _ -> ()))
  | "editor/open-edit" ->
      Some (first_target (fun u -> Editor_actions.enter_edit u 0))
  | "editor/open-selected-blocks-in-sidebar" ->
      Some
        (with_sidebar (fun sst ->
             Sidebar_state.ensure_right_open ();
             List.iter (Sidebar_state.open_uuid sst) (target_uuids ())))
  | "editor/toggle-block-children" ->
      Some (first_target Editor_actions.toggle_collapse)
  | "editor/expand-block-children" ->
      Some (first_target (fun u -> Editor_actions.set_collapsed u false))
  | "editor/collapse-block-children" ->
      Some (first_target (fun u -> Editor_actions.set_collapsed u true))
  | "editor/toggle-open-blocks" -> Some (fun () -> Editor_actions.toggle_open_blocks ())
  | "editor/cycle-todo" ->
      Some
        (fun () -> List.iter Editor_commands.cycle_todo (target_uuids ()))
  | "editor/undo" -> Some (fun () -> Editor_actions.undo ())
  | "editor/redo" -> Some (fun () -> Editor_actions.redo ())
  | "editor/quick-add" -> Some (fun () -> Editor_actions.quick_add ())
  | "editor/copy" -> Some (fun () -> Editor_actions.copy_selection_text ())
  | "editor/cut" ->
      Some
        (fun () ->
          Editor_actions.copy_selection_text ();
          Editor_actions.delete_selection ())
  | "editor/toggle-display-hidden-properties" ->
      Some
        (fun () ->
          Properties_state.toggle_hidden ();
          Properties_state.refresh_all ())
  | _ -> None

let shortcut_action cid : (unit -> unit) option =
  match cid with
  | "page/toggle-favorite" -> Some (with_sidebar Sidebar_state.toggle_favorite)
  | "misc/copy" -> Some (fun () -> Editor_actions.copy_selection_text ())
  | "go/backward" -> Some (fun () -> Platform.history_back ())
  | "go/forward" -> Some (fun () -> Platform.history_forward ())
  | "sidebar/clear" ->
      Some
        (with_sidebar (fun sst ->
             List.iter
               (fun (i : Sidebar_state.item) ->
                 Sidebar_state.remove_item sst i.key)
               (Runtime.signal_get sst.Sidebar_state.items)))
  | "sidebar/close-top" ->
      Some
        (with_sidebar (fun sst ->
             match List.rev (Runtime.signal_get sst.Sidebar_state.items) with
             | last :: _ -> Sidebar_state.remove_item sst last.key
             | [] -> ()))
  | "ui/toggle-contents" ->
      Some
        (with_sidebar (fun sst ->
             Sidebar_state.ensure_right_open ();
             Sidebar_state.ensure_contents sst))
  | "ui/select-theme-color" | "ui/customize-appearance" ->
      Some
        (fun () ->
          (* cljs :ui/toggle-appearance — appearance popup anchored to
             the toolbar dots trigger *)
          match Web_dom.query_selector ".toolbar-dots-btn" with
          | Some el ->
              let r = Web_dom.el_bounding_rect el in
              Runtime.send
                (Action.Appearance_set
                   (Some
                      (Web_dom.rect_right r, Web_dom.rect_bottom r +. 4.)))
          | None -> ())
  | _ -> editor_action cid

let rec run_item st it =
  let repo = (Runtime.model ()).Model.repo in
  let v = get st in
  (match v.move_mode, it.act with
   | true, (Open_page target | Open_block target) -> run_move st target
   | _ -> (
   match it.act with
   | Create_page title ->
       close st;
       create_page title
   | Create_tag title ->
       close st;
       create_tag title
   | Open_page uuid ->
       close st;
       Option.iter (fun repo -> goto_page repo uuid) repo
   | Open_block uuid ->
       close st;
       Option.iter
         (fun repo ->
           ignore
             (let* w =
               Runtime.invoke2 "thread-api/get-block-page-info"
                 (Wire.String repo)
                 (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid uuid ])
             in
             match Wire.map_get_uuid w "block/uuid" with
             | Some puuid ->
                 goto_page repo puuid;
                 Js.Promise.resolve ()
             | None -> Js.Promise.resolve ()))
         repo
   | Set_filter gid ->
       set_in st (fun v ->
           { v with filter = Some gid; input = "" });
       (match Web_dom.query_selector ".cp__cmdk-search-input" with
        | Some el -> Web_dom.el_set_value el ""
        | None -> ());
       refresh st
   | Run cid -> run_command st repo cid
   | Open_file _ ->
       (* cljs file rows open the file editor — no such route here;
          just close *)
       close st))

(* cljs invoke-command: record the invoke in "commands-history" then
   dispatch the shortcut's :f. Many cljs handlers need an editing
   context the open palette lacks; they degrade to close+no-op like
   cljs does when the context is missing *)
and run_command st repo (cid : string) =
  if String.length cid > 7 && String.sub cid 0 7 = "plugin." then (
    (* plugin simple command — cljs handle-exec →
       LSPluginCore.hookEditor(eventKey, payload) *)
    close st;
    Plugin_host.exec_palette_command cid)
  else
  let nav hash route =
    (* navigation intent, same as goto_page: commit and close any
       in-progress edit — go/journals etc. can target the current route,
       where the hash no-ops and no later hook clears the editor *)
    Editor_actions.exit_edit ~select:false;
    close st;
    let target = Runtime.nav_hash hash in
    (* setting an identical hash fires no hashchange, so resolve would
       never run and the cleared route would stick on the empty view *)
    let same = Platform.location_hash () = target in
    Runtime.send (Action.Navigate_to route);
    Platform.set_location_hash target;
    if same then Router.resolve ()
  in
  let goto_journal_day day =
    match repo with
    | Some repo ->
        ignore
          (let* w =
            Runtime.invoke2 "thread-api/get-journal-page-by-day"
              (Wire.String repo) (Wire.Int day)
          in
          match Decode.page_of_summary w with
          | Some p -> (
              match p.Model.page_uuid with
              | Some u ->
                  goto_page repo u;
                  Js.Promise.resolve ()
              | None -> Js.Promise.resolve ())
          | None ->
              (* cljs redirect-to-journal!: a journal that doesn't exist
                 yet goes through page/<create! — materialize it like the
                 palette's create_page (worker infers block/journal-day
                 from the title) *)
              let title =
                Dates.journal_title_of
                  (Js.Date.make ~year:(float_of_int (day / 10000))
                     ~month:(float_of_int (day / 100 mod 100 - 1))
                     ~date:(float_of_int (day mod 100)) ())
              in
              create_page title;
              Js.Promise.resolve ())
    | None -> ()
  in
  let rel_journal delta = (* today's journal +/- delta days *)
    close st;
    goto_journal_day
      (Dates.journal_day_of (Dates.add_days (Dates.date_now ()) delta))
  in
  let cur_day () =
    Option.bind (Runtime.model ()).Model.route_page (fun p -> p.Model.page_journal_day)
  in
  (match Commands_data.command_by_id cid with
   | Some c -> record_invoke c
   | None -> ());
  match cid with
  | "editor/move-blocks" ->
      (* stay open in move-blocks mode; cljs go-to-search! :nodes scopes
         the palette to the nodes group — no recents/filters *)
      set_in st (fun v ->
          { v with move_mode = true; filter = Some G_nodes; input = "" });
      (match Web_dom.query_selector ".cp__cmdk-search-input" with
       | Some el -> Web_dom.el_set_value el ""; Web_dom.el_focus el
       | None -> ());
      refresh st
  | "go/search" -> () (* keep palette open on the input *)
  | "go/search-in-page" ->
      set_in st (fun v ->
          { v with filter = Some G_current_page; input = "" });
      (match Web_dom.query_selector ".cp__cmdk-search-input" with
       | Some el -> Web_dom.el_set_value el ""
       | None -> ());
      refresh st
  | "go/search-themes" ->
      set_in st (fun v ->
          { v with filter = Some G_themes; input = "" });
      (match Web_dom.query_selector ".cp__cmdk-search-input" with
       | Some el -> Web_dom.el_set_value el ""
       | None -> ());
      refresh st
  | "go/home" -> nav "#/" Model.Home
  | "go/journals" ->
      (* cljs go-to-journals! — #/all-journals when a default-home page
         owns #/ *)
      ignore
        (let* h, r = Router.go_to_journals_target () in
         Js.Promise.resolve (nav h r; Router.scroll_to_top ()))
  | "go/all-graphs" -> nav "#/graphs" Model.All_graphs
  | "go/graph-view" -> nav "#/graph" Model.Graph_view
  | "go/all-pages" -> nav "#/all-pages" Model.All_pages
  | "ui/toggle-settings" ->
      (* cljs toggle-settings-modal! — toggles the settings dialog,
         not the #/settings route *)
      close st;
      if Dialogs_state.is_open "settings" then
        Dialogs_state.close_named "settings"
      else Dialogs_state.open_ "settings"
  | "go/keyboard-shortcuts" ->
      (* cljs open-settings! :keymap — settings dialog on the keymap tab *)
      close st;
      Settings_state.open_at "keymap";
      Dialogs_state.open_ "settings"
  | "sidebar/open-today-page" ->
      close st;
      goto_journal_day (Dates.today_journal_day ())
  | "go/tomorrow" -> rel_journal 1
  | "go/next-journal" -> (
      close st;
      match cur_day () with
      | Some d -> goto_journal_day (d + 1)
      | None -> ())
  | "go/prev-journal" -> (
      close st;
      match cur_day () with
      | Some d -> goto_journal_day (d - 1)
      | None -> ())
  | "graph/db-add" | "graph/add" ->
      close st;
      Dialogs_state.open_ "new-graph"
  | "dev/validate-db" ->
      close st;
      Option.iter validate_graph repo
  | "dev/rtc-start" -> (
      close st;
      match repo with Some r -> Rtc_ops.start r | None -> ())
  | "dev/rtc-stop" ->
      close st;
      Rtc_ops.stop ()
  | "ui/toggle-left-sidebar" ->
      close st;
      Runtime.send Action.Toggle_left_sidebar
  | "ui/toggle-right-sidebar" ->
      close st;
      Runtime.send Action.Toggle_right_sidebar
  | "ui/toggle-help" ->
      close st;
      Runtime.send Action.Help_toggle
  | "ui/toggle-wide-mode" ->
      close st;
      Settings_state.toggle_wide_mode ()
  | "ui/toggle-theme" ->
      close st;
      Settings_view.toggle_theme ()
  | "editor/add-property" ->
      close st;
      (match target_uuids () with
       | u :: _ -> Properties_dialog.open_for_block u
       | [] -> Properties_dialog.open_for_current ())
  (* cljs :editor/new-property {:property-key _} — the named property's
     dedicated picker, not the generic property sheet *)
  | "editor/add-property-deadline" | "editor/add-property-status"
  | "editor/add-property-priority" | "editor/set-tags" ->
      close st;
      (match target_uuids () with
       | u :: _ as uuids ->
           Properties_dialog.open_for_block_with_property ~uuids u
             ~ident:
               (match cid with
                | "editor/add-property-deadline" ->
                    "logseq.property/deadline"
                | "editor/add-property-status" ->
                    "logseq.property/status"
                | "editor/add-property-priority" ->
                    "logseq.property/priority"
                | _ -> "block/tags")
       | [] -> ())
  | "editor/add-property-icon" -> run_add_property_icon st
  | "editor/add-reaction" -> run_add_reaction st
  | "editor/add-comment" -> run_add_comment repo st
  | "go/flashcards" ->
      close st;
      Sidebar_state.open_cards ()
  | "editor/toggle-number-list" ->
      close st;
      List.iter
        (fun u -> Editor_commands.toggle_own_list u 0)
        (Editor_actions.selected_uuids ())
  | "ui/toggle-brackets" ->
      close st;
      ignore (Settings_state.config_toggle "ui/show-brackets?" ~default:true)
  | "graph/open" -> nav "#/graphs" Model.All_graphs
  | _ -> (
      (match shortcut_action cid with
       | Some f -> f ()
       | None -> ());
      close st (* no local equivalent / editing-context commands *))


let run_highlighted st =
  let v = get st in
  match item_at v v.hl with Some it -> run_item st it | None -> ()

(* keyboard-shortcut entry point: run a command id exactly as the
   palette would. Palette-shaped commands open the palette in the right
   mode first; everything else dispatches straight through run_command *)
let dispatch_id (cid : string) =
  match !latest_st with
  | Some st -> (
      match cid with
      | "go/search" -> open_palette st
      | "command-palette/toggle" ->
          if (get st).open_ then close st
          else begin
            open_palette st;
            set_in st (fun v -> { v with filter = Some G_commands; input = "" });
            refresh st
          end
      | "go/search-in-page" | "editor/move-blocks" | "go/search-themes" ->
          if not (get st).open_ then open_palette st;
          run_command st (Runtime.model ()).Model.repo cid
      | _ -> run_command st (Runtime.model ()).Model.repo cid)
  | None -> ()

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

(* open the current palette without a handle — global shortcuts
   (mod+k, mod+shift+p) fire before any caller holds st *)
let open_latest ?(move = false) () =
  match !latest_t with
  | Some st ->
      (* mod+k toggles; move mode always switches the open palette over *)
      if (get st).open_ && not move then close st else open_palette ~move st
  | None -> ()

(* mod+shift+k (go/search-in-page): the command-table arm only scopes an
   already-open palette; the chord must also open it when closed *)
let open_in_page () =
  match !latest_t with
  | Some st ->
      if not (get st).open_ then open_palette st;
      set_in st (fun v -> { v with filter = Some G_current_page; input = "" });
      (match Web_dom.doc_query ".cp__cmdk-search-input" with
       | Some el -> Web_dom.el_set_value el ""
       | None -> ());
      refresh st
  | None -> ()
