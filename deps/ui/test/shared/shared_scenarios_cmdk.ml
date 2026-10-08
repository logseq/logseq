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
  List.filter_map
    (fun n ->
      match M.string_prop n "data-attrs" with
      | Some data ->
          List.assoc_opt "data-cmdk-group-kind"
            (Lui_protocol.data_attrs_decode data)
      | None -> None)
    (H.nodes h)

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

(* Query entry produces ordered results: contiguous flat indexes, first
   item highlighted, groups in the cljs order (create/current-page ->
   nodes -> recents -> commands -> files -> filters). *)
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
  (* meta+ArrowDown expands the highlighted group, and the refresh that
     lands the expansion also publishes the local groups for the query:
     canonical cljs order create -> current-page -> nodes ->
     recently-updated -> commands -> files -> filters *)
  h.H.keydown ~meta:true "ArrowDown";
  h.flush ();
  let rank = function
    | "create" -> 0
    | "current-page" -> 1
    | "nodes" -> 2
    | "recently-updated" -> 3
    | "commands" -> 4
    | "files" -> 5
    | "filters" -> 6
    | _ -> 99
  in
  let kinds = group_kinds h in
  h.H.check "create group precedes other groups"
    (kinds <> [] && List.hd kinds = "create");
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

let run h =
  results_order h;
  selection_moves h;
  enter_navigates h;
  escape_close h;
  close_persists h
