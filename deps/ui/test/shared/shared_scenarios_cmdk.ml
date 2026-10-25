(* Command-palette behavior scenarios — run in both runtimes through the
   shared Drive harness, same host record as Shared_scenarios. Covers the
   batch-3c contract: query entry produces ordered results, selection
   moves over flat items, Enter dispatches navigation, Escape clears
   then closes, and closing persists the query for the next open. *)

module M = Drive.Model
module S = Drive.Session
module H = Shared_scenarios

let contains sub s =
  let n = String.length s and m = String.length sub in
  let rec go i =
    if i + m > n then false
    else if String.sub s i m = sub then true
    else go (i + 1)
  in
  go 0

let cmdk_items (h : ('m, 'a) Shared_scenarios.host) =
  List.filter
    (fun n -> H.has_attr n "data-cmdk-item" "true")
    (H.nodes h)

let item_index n =
  match M.string_prop n "data-attrs" with
  | Some data -> (
      match
        List.assoc_opt "data-item-index"
          (Lui_protocol.data_attrs_decode data)
      with
      | Some s -> ( try Some (int_of_string s) with _ -> None)
      | None -> None)
  | None -> None

let highlighted_indexes (h : ('m, 'a) Shared_scenarios.host) =
  List.filter_map
    (fun n ->
      if H.has_attr n "data-highlighted" "true" then item_index n
      else None)
    (H.nodes h)

let group_kinds (h : ('m, 'a) Shared_scenarios.host) =
  let rec walk acc n =
    List.fold_left walk (n :: acc) (M.children (H.tree h) n.M.id)
  in
  let modal = List.find (fun n -> H.has_class n "cp__cmdk__modal") (H.nodes h) in
  List.filter_map
    (fun n ->
      match M.string_prop n "data-attrs" with
      | Some data ->
          List.assoc_opt "data-cmdk-group-kind"
            (Lui_protocol.data_attrs_decode data)
      | None -> None)
    (List.rev (walk [] modal))

let input_node (h : ('m, 'a) Shared_scenarios.host) =
  List.find (fun n -> H.has_class n "cp__cmdk-search-input") (H.nodes h)

let open_palette (h : ('m, 'a) Shared_scenarios.host) =
  h.H.keydown ~meta:true "k";
  (* recents land through the fake worker — pump so the roundtrip
     settles before asserting *)
  h.flush ();
  h.flush ();
  h.H.check "cmdk opens" (H.exists_class h "cp__cmdk__modal")

let close_palette (h : ('m, 'a) Shared_scenarios.host) =
  h.H.keydown ~meta:true "k";
  h.flush ();
  h.H.check "mod+k closes the open palette"
    (not (H.exists_class h "cp__cmdk__modal"))


(* ---- shared visual spec: emitted structure + typed props -------------
   The cmdk look is expressed through shared recipes + typed props +
   Ui_theme tokens (one source for web and native). These assertions pin
   the emitted contract: recipe kinds, prop values bound to theme
   tokens, and the DOM hooks tests/commands depend on. *)

let str_prop_eq n name expected =
  match M.string_prop n name with
  | Some s -> s = expected
  | None -> false

let prop_contains n name needle =
  match M.string_prop n name with
  | Some s -> contains needle s
  | None -> false

let int_prop_eq n name expected =
  match Hashtbl.find_opt n.M.props name with
  | Some (Lui_protocol.IntValue i) -> i = expected
  | _ -> false

let float_prop_eq n name expected =
  match Hashtbl.find_opt n.M.props name with
  | Some (Lui_protocol.FloatValue f) -> Float.abs (f -. expected) < 0.001
  | _ -> false

let by_class h cls =
  List.find_opt (fun n -> H.has_class n cls) (H.nodes h)

let by_kind h kind =
  List.find_opt (fun n -> n.M.kind = kind) (H.nodes h)

(* kbds exist outside the palette too (the global shortcut hints in the
   chrome) — scope lookups to the cmdk subtree *)
let in_palette h n =
  let rec climb id =
    match List.find_opt (fun p -> p.M.id = id) (H.nodes h) with
    | None -> false
    | Some p ->
        H.has_class p "cp__cmdk"
        || (match p.M.parent with Some pid -> climb pid | None -> false)
  in
  match n.M.parent with Some pid -> climb pid | None -> false

let cmdk_kbd h =
  List.find_opt
    (fun n -> n.M.kind = "kbd" && in_palette h n)
    (H.nodes h)

(* Query entry produces ordered results: contiguous flat indexes, first
   item highlighted, and stable result groups. Create follows the first
   page/block match, or precedes filters when there is no match. *)
let results_order (h : ('m, 'a) Shared_scenarios.host) =
  open_palette h;
  let input = input_node h in
  (* the upserted Create row renders immediately; local groups join on
     the next refresh-results pass *)
  S.text_changed (h.session ()) input.M.id "e";
  h.flush ();
  let items = cmdk_items h in
  h.H.check "query produces result items" (items <> []);
  let idxs = List.filter_map item_index items |> List.sort compare in
  h.H.check "result indexes are contiguous from zero"
    (idxs = List.init (List.length idxs) Fun.id);
  h.H.keydown ~meta:false "ArrowDown";
  h.flush ();
  h.H.check "ArrowDown highlights the first result"
    (highlighted_indexes h = [ 0 ]);
  (* Expanding the highlighted group also publishes the local groups. *)
  h.H.keydown ~meta:true "ArrowDown";
  h.flush ();
  let rank = function
    | "current-page" -> 0
    | "nodes" -> 1
    | "recently-updated" -> 2
    | "commands" -> 3
    | "files" -> 4
    | "create" -> 5
    | "filters" -> 6
    | _ -> 99
  in
  let kinds = group_kinds h in
  h.H.check "create appears exactly once"
    (List.length
       (List.filter (fun n -> H.has_attr n "data-item-key" "create-e")
          (cmdk_items h)) = 1);
  h.H.check "commands group is present" (List.mem "commands" kinds);
  let rec increasing = function
    | a :: (b :: _ as rest) -> rank a < rank b && increasing rest
    | _ -> true
  in
  h.H.check "groups follow the canonical cljs order" (increasing kinds);
  close_palette h

(* Keyboard selection moves over the flat item list and wraps. *)
let selection_moves (h : ('m, 'a) Shared_scenarios.host) =
  open_palette h;
  let input = input_node h in
  S.text_changed (h.session ()) input.M.id "e";
  h.flush ();
  (* expand the highlighted group so the refresh lands the local groups
     and the flat list has several items to move across *)
  h.H.keydown ~meta:true "ArrowDown";
  h.flush ();
  h.H.check "first item highlighted after query"
    (highlighted_indexes h = [ 0 ]);
  h.H.keydown ~meta:false "ArrowDown";
  h.flush ();
  h.H.check "ArrowDown moves highlight to next item"
    (highlighted_indexes h = [ 1 ]);
  h.H.keydown ~meta:false "ArrowUp";
  h.flush ();
  h.H.check "ArrowUp moves highlight back"
    (highlighted_indexes h = [ 0 ]);
  let n = List.length (cmdk_items h) in
  h.H.keydown ~meta:false "ArrowUp";
  h.flush ();
  h.H.check "ArrowUp wraps to the last item"
    (highlighted_indexes h = [ n - 1 ]);
  close_palette h

(* Enter dispatches the highlighted item — here the go/all-graphs
   command row, which navigates without needing a worker roundtrip. *)
let index_of_item_key (h : ('m, 'a) Shared_scenarios.host) key =
  List.find_map
    (fun n ->
      if H.has_attr n "data-item-key" key then item_index n else None)
    (H.nodes h)

let enter_navigates (h : ('m, 'a) Shared_scenarios.host) =
  h.route_set "#/";
  open_palette h;
  let input = input_node h in
  (* unique-enough query: only nav-ish command rows fuzzy-match *)
  S.text_changed (h.session ()) input.M.id "all graphs";
  h.flush ();
  (* land the local groups so the commands row exists, then walk the
     highlight down to the go/all-graphs command row *)
  h.H.keydown ~meta:true "ArrowDown";
  h.flush ();
  let target = index_of_item_key h "cmd-go/all-graphs" in
  h.H.check "go/all-graphs command row is present" (target <> None);
  let idx = Option.value target ~default:0 in
  let rec walk i =
    if i > 40 then ()
    else
      match highlighted_indexes h with
      | [ x ] when x = idx -> ()
      | _ ->
          h.H.keydown ~meta:false "ArrowDown";
          h.flush ();
          walk (i + 1)
  in
  walk 0;
  h.H.keydown ~meta:false "Enter";
  h.flush ();
  let route = h.route_get () in
  h.H.check "Enter navigates via the highlighted command"
    (contains "graph" route);
  h.route_set "#/"

(* Escape clears the query first, then closes; the app keeps rendering
   its chrome (the drive model has no DOM focus channel, so restoration
   is observed as close + intact app). *)
let escape_close (h : ('m, 'a) Shared_scenarios.host) =
  open_palette h;
  let input = input_node h in
  S.text_changed (h.session ()) input.M.id "abc";
  h.flush ();
  h.H.keydown ~meta:false "Escape";
  h.flush ();
  h.H.check "first Escape clears the query and keeps cmdk open"
    (H.exists_class h "cp__cmdk__modal");
  h.H.check "cleared query drops the create group"
    (not (List.mem "create" (group_kinds h)));
  h.H.keydown ~meta:false "Escape";
  h.flush ();
  h.H.check "second Escape closes cmdk"
    (not (H.exists_class h "cp__cmdk__modal"));
  h.H.check "app chrome is intact after close"
    (try
       ignore (H.by_identifier h "main-container");
       true
     with _ -> false)

(* Closing persists the query for the next open (cljs
   persist-cmdk-query-state!). *)
let close_persists (h : ('m, 'a) Shared_scenarios.host) =
  open_palette h;
  let input = input_node h in
  S.text_changed (h.session ()) input.M.id "seeded";
  h.flush ();
  close_palette h;
  h.H.check "last search persists on close"
    (match h.storage_get "ls-cmdk-last-search" with
     | Some s -> contains "\"seeded\"" s
     | None -> false)

(* command-palette/toggle forces "Search only: Commands". That session
   must not become the next Cmd-K's restored filter — pages and blocks
   stay searchable. *)
let command_palette_filter_does_not_stick
    (h : ('m, 'a) Shared_scenarios.host) =
  let search_only () =
    List.exists
      (fun n -> M.string_prop n "text" = Some "Search only:")
      (H.nodes h)
  in
  open_palette h;
  let input = input_node h in
  S.text_changed (h.session ()) input.M.id "seeded-pages";
  h.flush ();
  close_palette h;
  h.command "command-palette/toggle";
  h.flush ();
  h.flush ();
  h.H.check "command palette opens on commands"
    (search_only () && H.exists_class h "cp__cmdk__modal");
  close_palette h;
  h.H.check "command palette does not overwrite the last search"
    (match h.storage_get "ls-cmdk-last-search" with
     | Some s ->
         contains "\"seeded-pages\"" s && not (contains "\"commands\"" s)
     | None -> false);
  open_palette h;
  h.H.check "cmd-k searches everything after the command palette"
    (H.exists_class h "cp__cmdk__modal" && not (search_only ()));
  close_palette h

let structure_props (h : ('m, 'a) Shared_scenarios.host) =
  open_palette h;
  let input = input_node h in
  S.text_changed (h.session ()) input.M.id "e";
  h.flush ();
  h.H.keydown ~meta:true "ArrowDown";
  h.flush ();
  (* -- modal + palette frame -- *)
  h.H.check "modal shell is a clipped, rounded column"
    (match by_class h "cp__cmdk__modal" with
     | Some n ->
         n.M.kind = "column"
         && int_prop_eq n "corner-radius" 8
         && str_prop_eq n "overflow" "hidden"
     | None -> false);
  h.H.check "dialog carries the host geometry class"
    (match by_kind h "dialog" with
     | Some n -> H.has_class n "ls-dialog-cmdk"
     | None -> false);
  h.H.check "palette frame is a rounded token-colored column"
    (match by_class h "cp__cmdk" with
     | Some n ->
         n.M.kind = "column"
         && int_prop_eq n "corner-radius" 8
         && prop_contains n "foreground" "--lx-gray-12"
         && prop_contains n "data-attrs" "data-keep-selection"
     | None -> false);
  (* -- input row -- *)
  h.H.check "input row is a 54px bordered row"
    (match by_class h "cp__cmdk-input-row" with
     | Some n ->
         n.M.kind = "row"
         && int_prop_eq n "height" 54
         && prop_contains n "background" "--lx-gray-02"
         && prop_contains n "shadow" "inset 0 -1px"
     | None -> false);
  h.H.check "search input uses the input typography token"
    (input.M.kind = "input"
     && float_prop_eq input "grow" 1.0
     && str_prop_eq input "font-size" "var(--lx-text-input)"
     && str_prop_eq input "line-height" "1.75rem"
     && int_prop_eq input "min-width" 256
     && prop_contains input "foreground" "--lx-gray-12");
  (* -- scroller -- *)
  h.H.check "scroller is a viewport-height scroll kind"
    (match by_class h "cp__cmdk-scroller" with
     | Some n ->
         n.M.kind = "scroll"
         && float_prop_eq n "min-height-viewport" 0.65
         && float_prop_eq n "max-height-viewport" 0.65
     | None -> false);
  (* -- group header -- *)
  h.H.check "group header is a 32px token-colored row"
    (match by_class h "cp__cmdk-group-header" with
     | Some n ->
         n.M.kind = "row"
         && int_prop_eq n "height" 32
         && int_prop_eq n "padding-horizontal" 12
         && str_prop_eq n "font-size" "var(--lx-text-header)"
         && str_prop_eq n "line-height" "16px"
         && int_prop_eq n "gap" 8
         && prop_contains n "foreground" "--lx-gray-11"
         && prop_contains n "background" "--lx-gray-02"
     | None -> false);
  h.H.check "group title is bold non-selectable text"
    (match by_class h "cp__cmdk-group-title" with
     | Some n ->
         n.M.kind = "text"
         && int_prop_eq n "font-weight" 700
         && str_prop_eq n "user-select" "none"
         && str_prop_eq n "cursor" "pointer"
     | None -> false);
  (* -- item rows -- *)
  let items = cmdk_items h in
  h.H.check "items render as rounded token-typed columns"
    (match items with
     | it :: _ ->
         it.M.kind = "column"
         && int_prop_eq it "gap" 2
         && int_prop_eq it "padding-vertical" 6
         && int_prop_eq it "padding-horizontal" 12
         && int_prop_eq it "corner-radius" 8
         && str_prop_eq it "font-size" "var(--lx-text-row)"
         && str_prop_eq it "line-height" "1.25rem"
     | [] -> false);
  h.H.check "item hook attrs survive"
    (match items with
     | it :: _ ->
         H.has_attr it "data-cmdk-item" "true"
         && (match M.string_prop it "data-attrs" with
            | Some data ->
                List.mem "data-item-index"
                  (List.map fst (Lui_protocol.data_attrs_decode data))
                && List.mem "data-item-key"
                     (List.map fst (Lui_protocol.data_attrs_decode data))
            | None -> false)
     | [] -> false);
  h.H.check "keyboard-highlighted row paints the chosen-row state"
    (match
       List.find_opt
         (fun n -> H.has_attr n "data-kb-highlighted" "true")
         (H.nodes h)
     with
     | Some n ->
         prop_contains n "background" "--lx-gray-03"
         && prop_contains n "shadow" "--lx-cmdk-kb-shadow"
     | None -> false);
  h.H.check "item icon is a 20x20 chip"
    (match by_class h "cmdk-item-icon" with
     | Some n ->
         int_prop_eq n "width" 20
         && int_prop_eq n "min-width" 20
         && int_prop_eq n "height" 20
         && int_prop_eq n "corner-radius" 4
         && prop_contains n "background" "--lx-gray-05"
     | None -> false);
  h.H.check "main text has a medium-weight two-line paragraph contract"
    (match by_class h "cp__cmdk-item-main-text" with
     | Some n ->
         n.M.kind = "text"
         && int_prop_eq n "line-clamp" 2
         && int_prop_eq n "font-weight" 500
         && str_prop_eq n "overflow" "hidden"
     | None -> false);
  h.H.check "info suffix is inline text in header type"
    (match by_class h "cp__cmdk-item-info" with
     | Some n ->
         n.M.kind = "text"
         && str_prop_eq n "as" "span"
         && str_prop_eq n "font-size" "var(--lx-text-header)"
         && str_prop_eq n "line-height" "16px"
         && prop_contains n "foreground" "--lx-gray-11"
     | None -> false);
  (* -- shortcut keycaps -- *)
  h.H.check "kbd cells carry shortcut typography"
    (match cmdk_kbd h with
     | Some n ->
         str_prop_eq n "font-size" "var(--lx-text-header)"
         && float_prop_eq n "letter-spacing" (-0.5)
         && str_prop_eq n "white-space" "nowrap"
     | None -> false);
  h.H.check "boxed keycap wrappers size the 20px slot"
    (let parent_of id =
       List.find_opt (fun p -> p.M.id = id) (H.nodes h)
     in
     List.exists
       (fun n ->
         n.M.kind = "kbd" && in_palette h n
         && (match
               Option.bind n.M.parent (fun pid -> parent_of pid)
             with
             | Some p ->
                 int_prop_eq p "height" 20 && int_prop_eq p "min-width" 20
             | None -> false))
       (H.nodes h));
  (* -- group bottom hairline (skipped on the last group) -- *)
  let hairlines =
    List.filter
      (fun n ->
        n.M.kind = "box"
        && int_prop_eq n "height" 1
        && prop_contains n "background" "--lx-gray-06")
      (H.nodes h)
  in
  h.H.check "group hairlines separate stacked groups" (hairlines <> []);
  (* -- hints bar -- *)
  h.H.check "hints bar owns its background and intrinsic content height"
    (match by_class h "hints" with
     | Some n ->
         n.M.kind = "column"
         && int_prop_eq n "gap" 0
         && prop_contains n "background" "--lx-gray-03"
     | None -> false);
  h.H.check "hint buttons are flat 28px rows"
    (match by_class h "cp__cmdk-hint" with
     | Some n ->
         int_prop_eq n "height" 28
         && float_prop_eq n "opacity" 0.4
         && int_prop_eq n "padding-horizontal" 12
         && int_prop_eq n "padding-vertical" 4
         && str_prop_eq n "font-size" "var(--lx-text-row)"
     | None -> false);
  close_palette h

(* Running the move-blocks command flips the open palette into move
   mode — the search input stays mounted and only its placeholder prop
   republishes. *)
let move_mode_placeholder (h : ('m, 'a) Shared_scenarios.host) =
  open_palette h;
  let input = input_node h in
  h.H.check "default placeholder"
    (M.string_prop input "placeholder"
     = Some "What are you looking for?");
  h.H.command "editor/move-blocks";
  h.flush ();
  let input' = input_node h in
  h.H.check "move-mode placeholder updates in place"
    (input'.M.id = input.M.id
     && M.string_prop input' "placeholder" = Some "Move blocks to");
  close_palette h

(* Native layout gives a spacer with no explicit grow flex-grow 1, so a
   fixed-height spacer in the results column (filter-chip placeholder,
   group pads) used to soak up the free space of
   the 65vh scroller and center a short result list vertically. Every
   fixed-height spacer in the palette must pin grow = 0. *)
let results_top_aligned (h : ('m, 'a) Shared_scenarios.host) =
  open_palette h;
  let input = input_node h in
  S.text_changed (h.session ()) input.M.id "zzqq-no-match";
  h.flush ();
  h.flush ();
  let spacers =
    List.filter
      (fun n ->
        n.M.kind = "spacer" && in_palette h n
        && Hashtbl.mem n.M.props "height"
        (* fixed-width insets live in shrink-wrapped rows *)
        && not (Hashtbl.mem n.M.props "width"))
      (H.nodes h)
  in
  h.H.check "palette has fixed-height spacers" (spacers <> []);
  h.H.check "fixed-height palette spacers never grow"
    (List.for_all (fun n -> float_prop_eq n "grow" 0.0) spacers);
  close_palette h

let run h =
  results_order h;
  selection_moves h;
  enter_navigates h;
  escape_close h;
  close_persists h;
  command_palette_filter_does_not_stick h;
  structure_props h;
  move_mode_placeholder h;
  results_top_aligned h
