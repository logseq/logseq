(* Lui_web apply layer: deterministic + property tests.

   Regression shape this guards: retained children without a DOM presence
   (portal-mounted kinds, same-batch dropped nodes, never-mounted dynamic
   segments, detached platform nodes like a raw-text placeholder swapped
   to a Text node by the document observer) used to corrupt the DOM
   insertion index, so apply raised "DOM child index is out of bounds"
   and popups never mounted.

   Drives the real backend pipeline — Store.apply_batch_with_extensions +
   Lui_web_apply.apply_dom_batch via Lui_web.backend — over Stub_dom and
   asserts after every batch:
   - every retained child whose platform node is attached to a container
     is a DOM child of exactly that container;
   - element platform nodes attached to a container appear in its
     `children` in retained order (the array insertBefore indexes);
   - the DOM-visible retained count never exceeds the container's
     element-child capacity (the insertion-index bound);
   - no foreign platform node lands inside a container;
   - apply never raises.

   The property pass synthesizes random legal op batches — legality is
   checked against the live store (attach state, index bounds, kind
   support, cycle freedom) — under fixed seeds so failures reproduce. *)

open Test_check
module Wv = Lui_protocol
module Store = Lui_web_store
module T = Lui_web_types

external as_node : Js.Json.t -> 'a = "%identity"
external of_json : 'a -> Js.Json.t = "%identity"

(* -- stub-dom views -- *)

let node_type el : int = Stub_dom.get_field el "nodeType"
let is_element el = node_type el = 1

let parent_element el =
  let p : Js.Json.t = Stub_dom.get_field el "parentElement" in
  if Js.testAny p then None else Some p

let collection el name =
  let kids : Js.Json.t = Stub_dom.get_field el name in
  let n = Stub_dom.arr_len kids in
  let rec go i acc =
    if i = n then List.rev acc else go (i + 1) (Stub_dom.arr_at kids i :: acc)
  in
  go 0 []

let dom_children el = collection el "children"
let dom_child_nodes el = collection el "childNodes"

let rec phys_eq_list a b =
  match a, b with
  | [], [] -> true
  | x :: xs, y :: ys -> x == y && phys_eq_list xs ys
  | _ -> false
let detach el =
  match parent_element el with
  | Some _ -> Stub_dom.detach el
  | None -> ()

(* -- renderer over stub dom, real logseq-* adapters -- *)

let make_renderer () =
  Stub_dom.install ();
  let host = Stub_dom.make_element "div" in
  Stub_dom.set_field host "ownerDocument" (Stub_dom.document ());
  let registry = Lui_extension.registry () in
  Logseq_dom.register registry;
  Logseq_el.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  Lui_web.create_with_extensions (as_node host) Wv.String_map.empty
    registry Dom_adapter.adapters

let apply renderer gen ops =
  (Lui_web.backend renderer).Wv.apply_batch { Wv.generation = gen; ops }

let ext_fp registry ident =
  match Lui_extension.schema registry ident with
  | Some sch -> Lui_extension.fingerprint sch
  | None -> invalid_arg ("no extension schema " ^ ident)

(* -- retained <-> DOM invariants -- *)

let container_of node =
  match Store.standard_kind node with
  | Some kind ->
      of_json
        (Lui_web_util.content_container kind node.T.platform_node)
  | None -> of_json node.T.platform_node

let id_of_platform store p =
  Hashtbl.fold
    (fun id n acc ->
      match acc with
      | Some _ -> acc
      | None -> if of_json n.T.platform_node == p then Some id else None)
    store.T.retained_nodes None

let check_dom_invariants renderer tag =
  let store = renderer.T.web_store in
  let all_platforms =
    Hashtbl.fold
      (fun _ n acc -> of_json n.T.platform_node :: acc)
      store.T.retained_nodes []
  in
  Hashtbl.iter
    (fun id node ->
      let container = container_of node in
      let kids = dom_children container in
      let slots = dom_child_nodes container in
      let attached =
        List.filter_map
          (fun cid ->
            match Store.node store cid with
            | Some c -> (
                match parent_element (of_json c.T.platform_node) with
                | Some p when p == container ->
                    Some (cid, of_json c.T.platform_node)
                | _ -> None)
            | None -> None)
          node.T.retained_children
      in
      List.iter
        (fun (cid, platform) ->
          check
            (Printf.sprintf "%s: %d child %d in childNodes" tag id cid)
            (List.exists (fun k -> k == platform) slots);
          check
            (Printf.sprintf "%s: %d child %d in children" tag id cid)
            (not (is_element platform)
            || List.exists (fun k -> k == platform) kids))
        attached;
      let counted = List.length attached in
      check
        (Printf.sprintf "%s: %d bound %d <= children %d" tag id counted
           (List.length kids))
        (counted <= List.length kids);
      let retained_elements =
        List.filter_map
          (fun (_cid, p) -> if is_element p then Some p else None)
          attached
      in
      let dom_platforms =
        List.filter (fun k -> List.exists (fun r -> r == k) retained_elements)
          kids
      in
      let show xs =
        Printf.sprintf "[%s]"
          (String.concat ";"
             (List.map
                (fun k ->
                  match id_of_platform store k with
                  | Some i -> string_of_int i
                  | None -> "?")
                xs))
      in
      if not (phys_eq_list dom_platforms retained_elements) then
        Js.log
          (Printf.sprintf "ORDER node %d dom=%s retained=%s" id
             (show dom_platforms) (show retained_elements));
      check (Printf.sprintf "%s: %d children order" tag id)
        (phys_eq_list dom_platforms retained_elements);
      let foreign =
        List.filter
          (fun k ->
            List.exists (fun p -> p == k) all_platforms
            && not
                 (List.exists (fun (_cid, p) -> p == k) attached))
          kids
      in
      check
        (Printf.sprintf "%s: %d no foreign platform children" tag id)
        (phys_eq_list foreign []))
    store.T.retained_nodes

(* -- deterministic cases -- *)

let test_deterministic () =
  let renderer = make_renderer () in
  let counter = ref 0 in
  let fresh () =
    incr counter;
    !counter
  in
  let gen = ref 0 in
  let run ops =
    incr gen;
    check "apply ok" (apply renderer !gen ops)
  in
  let store = renderer.T.web_store in
  let supported parent child =
    match Store.node store parent, Store.node store child with
    | Some pn, Some cn ->
        Store.retained_child_supported renderer.T.web_extension_registry
          store.T.retained_nodes pn cn
    | _ -> false
  in
  let root = fresh () in
  run [ Wv.CreateNode (root, Wv.Box) ];

  (* overlays shape: container retains an element, a detached platform
     node (post-MO-swap placeholder) and a second element; the insert
     index counts retained children, so the detached slot must be
     skipped — the a4ae9b6 regression shape *)
  let a = fresh () and ext = fresh () and b = fresh () and c = fresh () in
  run
    [ Wv.CreateNode (a, Wv.Box)
    ; Wv.CreateExtension
        ( ext, Logseq_dom.identifier "div"
        , ext_fp renderer.T.web_extension_registry
            (Logseq_dom.identifier "div") )
    ; Wv.CreateNode (b, Wv.Box) ];
  if supported root ext then (
    run
      [ Wv.InsertChild (root, a, 0); Wv.InsertChild (root, ext, 1)
      ; Wv.InsertChild (root, b, 2) ];
    (* MutationObserver swap: the placeholder's platform element leaves
       the DOM while the node stays retained *)
    (match Store.node store ext with
     | Some e -> detach (of_json e.T.platform_node)
     | None -> ());
    run [ Wv.CreateNode (c, Wv.Box); Wv.InsertChild (root, c, 3) ];
    check_dom_invariants renderer "det:detached-child")
  else check "extension child supported" false;

  (* same shape through the real logseq-raw-text extension *)
  let raw = fresh () and d = fresh () in
  run
    [ Wv.CreateExtension
        ( raw, Logseq_dom.identifier "raw-text"
        , ext_fp renderer.T.web_extension_registry
            (Logseq_dom.identifier "raw-text") )
    ; Wv.CreateNode (d, Wv.Box) ];
  if supported root raw then (
    run [ Wv.InsertChild (root, raw, 0); Wv.InsertChild (root, d, 1) ];
    (match Store.node store raw with
     | Some e -> detach (of_json e.T.platform_node)
     | None -> ());
    check_dom_invariants renderer "det:raw-text-swap")
  else check "raw-text child supported" false;

  (* portal-mounted retained children do not advance the DOM index *)
  let menu = fresh () and e = fresh () in
  run [ Wv.CreateNode (menu, Wv.DropdownMenu); Wv.CreateNode (e, Wv.Box) ];
  if supported root menu then (
    run [ Wv.InsertChild (root, menu, 0); Wv.InsertChild (root, e, 1) ];
    check_dom_invariants renderer "det:portal")
  else
    Js.log "note: DropdownMenu under Box unsupported — skipping portal case";

  (* move + remove + drop keep DOM order aligned *)
  run [ Wv.MoveChild (root, b, 0) ];
  check_dom_invariants renderer "det:move";
  run [ Wv.RemoveChild (root, a); Wv.DropNode a ];
  check_dom_invariants renderer "det:drop";
  renderer

(* -- property pass: random legal op sequences.

   Legality is tracked in a shadow of the store's attach state — ops in
   one batch see each other's effects (a node created+inserted in the
   same batch, a child dropped after removal). A legal op that raises is
   a finding; generation resyncs to the store's accepted generation. *)

let kind_pool =
  [ Wv.Box; Wv.Row; Wv.Column; Wv.Stack; Wv.Card; Wv.Scroll; Wv.Text
  ; Wv.Heading; Wv.DropdownMenu; Wv.Overlay ]

let pick xs = List.nth xs (Random.int (List.length xs))

type shadow =
  { mutable s_parent : int option
  ; mutable s_children : int list
  ; s_ext : bool
  ; s_kind : Wv.node_kind option
  ; mutable s_dead : bool }

let gen_ops renderer fresh n =
  let store = renderer.T.web_store in
  let shadow = Hashtbl.create 32 in
  let created = ref [] in
  let pull id =
    match Hashtbl.find_opt shadow id with
    | Some s -> s
    | None -> (
        match Store.node store id with
        | Some n ->
            let s =
              { s_parent = n.T.retained_parent
              ; s_children = n.T.retained_children
              ; s_ext = Store.standard_kind n = None
              ; s_kind = Store.standard_kind n
              ; s_dead = false }
            in
            Hashtbl.replace shadow id s;
            s
        | None ->
            { s_parent = None; s_children = []; s_ext = false
            ; s_kind = None; s_dead = true })
  in
  let live id = not (pull id).s_dead in
  let all_ids () =
    Hashtbl.fold
      (fun id _ acc -> if live id then id :: acc else acc)
      store.T.retained_nodes !created
  in
  (* is parent a descendant of child (insert would cycle) *)
  let rec would_cycle child parent =
    child = parent
    || match (pull parent).s_parent with
       | Some p -> would_cycle child p
       | None -> false
  in
  let child_ok parent child =
    let ps = pull parent in
    match ps.s_kind with
    | Some pk -> (
        let cs = pull child in
        if cs.s_ext then Lui_extension.standard_container_supported pk
        else
          match cs.s_kind with
          | Some ck ->
              Wv.can_contain_children pk && Wv.child_kind_supported pk ck
          | None -> false)
    | None -> false
  in
  let insert_shadow parent child index =
    let ps = pull parent in
    let rec ins i acc = function
      | [] -> List.rev (child :: acc)
      | xs when i = 0 -> List.rev_append acc (child :: xs)
      | x :: xs -> ins (i - 1) (x :: acc) xs
    in
    ps.s_children <- ins index [] ps.s_children;
    (pull child).s_parent <- Some parent
  in
  let remove_shadow parent child =
    let ps = pull parent in
    ps.s_children <- List.filter (fun c -> c <> child) ps.s_children;
    (pull child).s_parent <- None
  in
  (* store move_at: remove then reinsert at index *)
  let move_shadow parent child index =
    let ps = pull parent in
    let without = List.filter (fun c -> c <> child) ps.s_children in
    let rec ins i acc = function
      | [] -> List.rev (child :: acc)
      | xs when i = 0 -> List.rev_append acc (child :: xs)
      | x :: xs -> ins (i - 1) (x :: acc) xs
    in
    ps.s_children <- ins index [] without
  in
  let gen_one () =
    let ids = all_ids () in
    let unattached =
      List.filter (fun id -> live id && (pull id).s_parent = None) ids
    in
    let droppable =
      List.filter
        (fun id ->
          live id && (pull id).s_parent = None && (pull id).s_children = [])
        ids
    in
    let attached_pairs =
      List.filter_map
        (fun id ->
          if live id then Option.map (fun p -> (p, id)) (pull id).s_parent
          else None)
        ids
    in
    let parents =
      List.filter
        (fun id ->
          live id
          && (match (pull id).s_kind with
             | Some k -> Wv.can_contain_children k
             | None -> false))
        ids
    in
    match Random.int 100 with
    | x when x < 26 ->
        let id = fresh () in
        let kind = pick kind_pool in
        Hashtbl.replace shadow id
          { s_parent = None; s_children = []; s_ext = false
          ; s_kind = Some kind; s_dead = false };
        created := id :: !created;
        Some (Wv.CreateNode (id, kind))
    | x when x < 30 ->
        let id = fresh () in
        let ident =
          if Random.int 2 = 0 then Logseq_dom.identifier "raw-text"
          else Logseq_dom.identifier "div"
        in
        Hashtbl.replace shadow id
          { s_parent = None; s_children = []; s_ext = true
          ; s_kind = None; s_dead = false };
        created := id :: !created;
        Some
          (Wv.CreateExtension
             (id, ident, ext_fp renderer.T.web_extension_registry ident))
    | x when x < 34 -> (
        (* DOM drift: an external agent (the raw-text MutationObserver
           swap, manual DOM surgery) detaches a platform node while the
           node stays retained — apply must keep indexes sane *)
        let attached_platforms =
          List.filter
            (fun id ->
              match Store.node store id with
              | Some n ->
                  parent_element (of_json n.T.platform_node) <> None
              | None -> false)
            ids
        in
        match attached_platforms with
        | [] -> None
        | _ ->
            let id = pick attached_platforms in
            (match Store.node store id with
             | Some n -> detach (of_json n.T.platform_node)
             | None -> ());
            None)
    | x when x < 62 && unattached <> [] && parents <> [] -> (
        let child = pick unattached in
        let parent = pick parents in
        if child_ok parent child && not (would_cycle child parent) then (
          let index = Random.int (List.length (pull parent).s_children + 1) in
          insert_shadow parent child index;
          Some (Wv.InsertChild (parent, child, index)))
        else None)
    | x when x < 78 && attached_pairs <> [] ->
        let parent, child = pick attached_pairs in
        remove_shadow parent child;
        Some (Wv.RemoveChild (parent, child))
    | x when x < 88 -> (
        let movable =
          List.filter
            (fun (p, _c) -> List.length (pull p).s_children > 1)
            attached_pairs
        in
        match movable with
        | [] -> None
        | _ ->
            let parent, child = pick movable in
            let len = List.length (pull parent).s_children in
            let index = Random.int len in
            move_shadow parent child index;
            Some (Wv.MoveChild (parent, child, index)))
    | x when x < 94 && droppable <> [] ->
        let id = pick droppable in
        (pull id).s_dead <- true;
        Some (Wv.DropNode id)
    | _ -> (
        let texty =
          List.filter
            (fun id ->
              live id
              && (match (pull id).s_kind with
                 | Some k -> k = Wv.Text || k = Wv.Heading
                 | None -> false))
            ids
        in
        match texty with
        | [] -> None
        | _ ->
            let id = pick texty in
            if Random.int 2 = 0 then
              Some (Wv.SetProp (id, Wv.TextValue, Wv.StringValue "x"))
            else Some (Wv.RemoveProp (id, Wv.TextValue)))
  in
  let rec go retries acc =
    if List.length acc >= n then acc
    else if retries <= 0 then acc
    else
      match gen_one () with
      | Some op -> go retries (op :: acc)
      | None -> go (retries - 1) acc
  in
  List.rev (go (n * 6) [])

let test_property ?(verbose = false) seed =
  Random.init seed;
  let renderer = make_renderer () in
  let counter = ref 0 in
  let fresh () =
    incr counter;
    !counter
  in
  let root = fresh () in
  let gen = ref 1 in
  let ok = ref (apply renderer !gen [ Wv.CreateNode (root, Wv.Box) ]) in
  if !ok then incr gen;
  let batch = ref 0 in
  while !ok && !batch < 40 do
    incr batch;
    let ops = gen_ops renderer fresh (1 + Random.int 8) in
    if verbose then
      List.iter
        (fun op ->
          Js.log (Printf.sprintf "gen %d op %s" !gen (Lui_wire.encode_op op)))
        ops;
    if ops <> [] then (
      (try
         if apply renderer !gen ops then incr gen
         else (
           check
             (Printf.sprintf "seed %d batch %d apply returned false" seed
                !gen)
             false;
           ok := false)
       with exn ->
         check
           (Printf.sprintf "seed %d batch %d raised: %s" seed !gen
              (Printexc.to_string exn))
           false;
         ok := false);
      if !ok then (
        let before = !failures in
        check_dom_invariants renderer (Printf.sprintf "seed %d" seed);
        if !failures > before then (
          ok := false;
          List.iter
            (fun op -> Js.log ("  op: " ^ Lui_wire.encode_op op))
            ops;
          Hashtbl.iter
            (fun id n ->
              let container = container_of n in
              let kids =
                List.map
                  (fun k ->
                    match id_of_platform renderer.T.web_store k with
                    | Some i -> string_of_int i
                    | None -> "?")
                  (dom_children container)
              in
              Js.log
                (Printf.sprintf
                   "  node %d kind=%s retained=[%s] dom_children=[%s]" id
                   (match Store.standard_kind n with
                    | Some _ -> "std"
                    | None -> "ext")
                   (String.concat ";"
                      (List.map string_of_int n.T.retained_children))
                   (String.concat ";" kids)))
            renderer.T.web_store.T.retained_nodes)))
  done

let run () =
  ignore (test_deterministic ());
  if Array.exists (fun a -> a = "verbose") Sys.argv then
    test_property ~verbose:true 7
  else
    List.iter test_property
      [ 17; 23; 42; 99; 7; 3; 11; 13; 19; 29; 31; 37; 41; 43; 47 ]
;;
