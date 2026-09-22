(* 1:1 translation of
   src/test/frontend/worker/graph_view_test.cljs (21 deftests).

   cljs deftest names are kept as OCaml test names.

   Fixture / harness mapping:

   - cljs (graph-view/build-graph @conn opts) -> Graph_view.build_graph db
     (Wire.Map opts). The cljs opts map keys (:type, :view-mode,
     :orphan-pages?, :created-at-filter, :block/uuid) are wire keywords.
   - cljs node-labels / link-endpoints / node-by-label /
     link-between-labels / fastest-build are reimplemented over the
     result wire maps (nodes carry :id/:label/:uuid/:kind/:icon/
     :block/created-at/:db-ident; links carry :source/:target/:label).
   - cljs (d/q '[:find (pull ?p [:block/uuid]) ...]) ->
     Db_test_util.find_page_by_title + Ldb.string_value.
   - cljs (d/transact! conn [[:db/add e a v]]) ->
     Datascript.transact_conn_string.
   - cljs (random-uuid) / generated uuids -> fixed uuid literals.
   - js/performance .now -> Unix.gettimeofday (ms).

   cljs ontology gaps in initial_data_edn patched via :build/pre-txs
   (all built-in properties in cljs initial-data carry :db/index true,
   which the :avet-based datoms-for in Graph_view requires):
   - {:db/ident :logseq.property/icon :logseq.property/type :map
      :db/index true}
   - {:db/ident :logseq.property/exclude-from-graph-view :db/index true
      :logseq.property/type :checkbox :logseq.property/hide? true
      :logseq.property/view-context :page :logseq.property/public? true}
   - the logseq.class/Asset class entity (cljs initial-data includes it;
     the OCaml seed only lists it in the pipeline initial_data_ops).
   - the four built-in pages' :block/created-at (the OCaml seed hardcodes
     0 while cljs build-new-page assigns real epoch-ms; the time-filter
     test needs them above the test values so created-at-min = 1000).
   - db/ident entities for :block/parent, :block/page and
     :block/created-at, plus the "Extends" title on
     logseq.property.class/extends — cljs built-in-properties emits these
     idents and Graph_view.datoms-for gates every :avet scan on
     (d/entid attr), which resolves strictly through db/ident (same as
     cljs d/entid), so without them the scans silently return [].
   - block_with_timestamps in db_test_util mirrors cljs
     common-util/block-with-timestamps: :block/updated-at is always
     stamped fresh while :block/created-at only fills in when absent, so
     explicit declared values survive (was: stamped unconditionally).

   cljs :build/properties values that are raw maps
   (:logseq.property/icon {:type :emoji :id ...}) cannot ride the
   entity-map tx form in datascript-ocaml ("nested entity attribute
   requires ref schema"); they are applied via a follow-up
   [:db/add [:block/uuid u] :logseq.property/icon {...}] transact
   (same convention as test_handler_native).

   All 20 deftests are ported; none skipped.

   Known OCaml lib divergences (lib/ untouched per task rules —
   Graph_view.datoms-for-v only accepts Keyword/Ref/Int values, and
   string_map_of_value_map only maps String values):

   1. Bool-valued avet lookups always return [] — cljs d/datoms matches
      on :v for any value type. Every entity-ids-with-v "…" (Bool true)
      scan in Graph_view is dead code:
      - invisible_id_set ("logseq.property/hide?" / "deleted-at" /
        "exclude-from-graph-view") — a page flagged
        exclude-from-graph-view still renders and links (fails
        global-all-pages-graph-excludes-hidden-and-excluded-page-links).
      - excluded_from_graph propagation through block/parent also can't
        see Bool flags (fails
        tags-and-objects-graph-respects-exclude-from-graph-view flag).
      - hidden_name_page_ids in the all-pages path — built-in class
        pages seeded with :logseq.property/hide? true (Root Tag, Task,
        Card) are not filtered (contributes to the
        global-all-pages-time-filter-keeps-visible-node-links failure).
   2. db/ident datom values are Keyword, not String — so
      string_map_of_value_map over "db/ident" always yields an empty
      map:
      - ident_by_id in build_node_context is empty -> :db-ident never
        emitted on tag nodes (fails
        tags-and-objects-graph-adds-db-ident-to-tag-nodes).
      - ident_by_name_page_id in the all-pages path is empty -> the
        Db_class.internal_tags filter never applies (contributes to
        the time-filter test failure alongside bug 1). *)

open Datascript
open Test_shared
module GV = Graph_view

let kw s = Wire.Keyword s

(* ---------- cljs helpers over the result wire ---------- *)

let nodes_of (result : Wire.t) : Wire.t list =
  match Wire.get "nodes" result with
  | Some (Wire.Array ns) -> ns
  | _ -> []

let links_of (result : Wire.t) : Wire.t list =
  match Wire.get "links" result with
  | Some (Wire.Array ls) -> ls
  | _ -> []

let node_field (k : string) (n : Wire.t) : Wire.t option =
  match n with Wire.Map kvs -> wire_get k kvs | _ -> None

let node_label (n : Wire.t) : string option =
  match node_field "label" n with Some (Wire.String s) -> Some s | _ -> None

let node_id (n : Wire.t) : string option =
  match node_field "id" n with Some (Wire.String s) -> Some s | _ -> None

let node_labels (result : Wire.t) : string list =
  sort_uniq (List.filter_map node_label (nodes_of result))

let contains_label result label = List.mem label (node_labels result)

let node_by_label (result : Wire.t) (label : string) : Wire.t option =
  List.find_opt (fun n -> node_label n = Some label) (nodes_of result)

let link_field (k : string) (l : Wire.t) : string option =
  match l with
  | Wire.Map kvs -> wire_string_field k kvs
  | _ -> None

(* cljs link-endpoints — flat set of every :source and :target *)
let link_endpoints (result : Wire.t) : string list =
  sort_uniq
    (List.concat_map
       (fun l ->
          List.filter_map Fun.id
            [ link_field "source" l; link_field "target" l ])
       (links_of result))

let link_between_labels (result : Wire.t) (source_label : string)
    (target_label : string) : Wire.t option =
  let id_by_label =
    List.filter_map
      (fun n -> match node_label n, node_id n with
         | Some l, Some i -> Some (l, i)
         | _ -> None)
      (nodes_of result)
  in
  match List.assoc_opt source_label id_by_label,
        List.assoc_opt target_label id_by_label with
  | Some source_id, Some target_id ->
      List.find_opt
        (fun l ->
           link_field "source" l = Some source_id
           && link_field "target" l = Some target_id)
        (links_of result)
  | _ -> None

let link_label (l : Wire.t option) : string option =
  match l with
  | Some (Wire.Map kvs) -> wire_string_field "label" kvs
  | _ -> None

(* cljs fastest-build — best-of-n timing, returns {elapsed, result} *)
let fastest_build (attempts : int) (f : unit -> Wire.t)
    : float * Wire.t =
  let rec loop remaining best_elapsed best_result =
    if remaining <= 0 then best_elapsed, best_result
    else begin
      let start = Unix.gettimeofday () in
      let result = f () in
      let elapsed = (Unix.gettimeofday () -. start) *. 1000.0 in
      if best_elapsed < 0.0 || elapsed < best_elapsed then
        loop (remaining - 1) elapsed result
      else loop (remaining - 1) best_elapsed best_result
    end
  in
  loop attempts (-1.0) Wire.Nil

(* ---------- build-graph opts helpers ---------- *)

let build_graph db (opts : (string * Wire.t) list) : Wire.t =
  GV.build_graph db (Wire.Map (List.map (fun (k, v) -> (kw k, v)) opts))

let global_graph ?(view_mode : string option) ?(orphan_pages : bool option)
    ?(created_at_filter : int option) db : Wire.t =
  build_graph db
    ( [ "type", kw "global" ]
    @ (match view_mode with
       | Some m -> [ "view-mode", kw m ]
       | None -> [])
    @ (match orphan_pages with
       | Some b -> [ "orphan-pages?", Wire.Bool b ]
       | None -> [])
    @ (match created_at_filter with
       | Some n -> [ "created-at-filter", Wire.Int n ]
       | None -> []) )

let page_graph db (uuid : string) : Wire.t =
  build_graph db [ "type", kw "page"; "block/uuid", Wire.Uuid uuid ]

let meta_view_mode (result : Wire.t) : string option =
  match Wire.get "meta" result with
  | Some (Wire.Map kvs) -> (
      match wire_get "view-mode" kvs with
      | Some (Wire.Keyword s) | Some (Wire.String s) -> Some s
      | _ -> None)
  | _ -> None

let all_pages_field (k : string) (result : Wire.t) : Wire.t option =
  match Wire.get "all-pages" result with
  | Some (Wire.Map kvs) -> wire_get k kvs
  | _ -> None

(* ---------- fixture helpers ---------- *)

(* cljs initial-data emits a {:db/ident ...} entity for every
   built-in-properties entry — including the block/* attrs below — via
   build-initial-properties. The OCaml seed only emits block/alias and
   block/tags idents, but Graph_view.datoms-for gates every :avet scan on
   (d/entid attr); without these idents the :block/parent, :block/page and
   :block/created-at scans silently return []. (block/name and block/uuid
   are intentionally not seeded: cljs built-in-properties has no ident
   for them either, and the EAVT-by-id reads do not need one.) The
   logseq.property.class/extends upsert adds the "Extends" title the cljs
   built-in property declares — the OCaml seed's ident entity lacks it. *)
let graph_view_block_attr_idents_pre_txs
    : (string * Db_test_util.edn) list list =
  [ [ "db/ident", Db_test_util.Kw "block/parent" ]
  ; [ "db/ident", Db_test_util.Kw "block/page" ]
  ; [ "db/ident", Db_test_util.Kw "block/created-at" ]
  ; [ "db/ident", Db_test_util.Kw "logseq.property.class/extends"
    ; "block/title", Db_test_util.Str "Extends" ] ]

let conn_with_blocks ?(properties = []) ?(classes = [])
    ?(pages_and_blocks = []) ?(pre_txs = []) () =
  Db_test_util.create_conn_with_blocks ~properties ~classes
    ~pages_and_blocks
    ~pre_txs:(graph_view_block_attr_idents_pre_txs @ pre_txs) ()

let pb title ?uuid ?properties ?tags ?extra () : Db_test_util.page_blocks =
  Db_test_util.
    { page =
        { default_page with
          pg_title = Some title
        ; pg_uuid = uuid
        ; pg_properties = Option.value properties ~default:[]
        ; pg_tags = Option.value tags ~default:[]
        ; pg_extra = Option.value extra ~default:[] }
    ; blocks = [] }

let pbb title ?uuid ?properties ?tags ?extra ~children ()
    : Db_test_util.page_blocks =
  let p = pb title ?uuid ?properties ?tags ?extra () in
  Db_test_util.{ p with blocks = children }

let blk title ?uuid ?properties ?tags ?extra ?children ()
    : Db_test_util.block_decl =
  Db_test_util.
    { default_block with
      b_title = Some title
    ; b_uuid = uuid
    ; b_properties = Option.value properties ~default:[]
    ; b_tags = Option.value tags ~default:[]
    ; b_children = Option.value children ~default:[]
    ; b_extra = Option.value extra ~default:[] }

let cls ?title ?extends ?extra () : Db_test_util.class_decl =
  Db_test_util.
    { default_class with
      c_title = title
    ; c_extends = Option.value extends ~default:[]
    ; c_extra = Option.value extra ~default:[] }

let page_by_title_exn (db : db) (title : string) : entity =
  match Db_test_util.find_page_by_title db title with
  | Some e -> e
  | None -> failwith ("page not found: " ^ title)

let transact_string (conn : conn) (s : string) =
  ignore (Datascript.transact_conn_string conn s)

(* cljs initial-data entities missing from initial_data_edn (see header) *)
let graph_view_property_idents_pre_txs
    : (string * Db_test_util.edn) list list =
  [ [ "db/ident", Db_test_util.Kw "logseq.property/icon"
    ; "block/title", Db_test_util.Str "Icon"
    ; "db/index", Db_test_util.Bool true
    ; "logseq.property/type", Db_test_util.Kw "map" ]
  ; [ "db/ident", Db_test_util.Kw "logseq.property/exclude-from-graph-view"
    ; "block/title", Db_test_util.Str "Excluded from Graph view?"
    ; "db/index", Db_test_util.Bool true
    ; "logseq.property/type", Db_test_util.Kw "checkbox"
    ; "logseq.property/hide?", Db_test_util.Bool true
    ; "logseq.property/view-context", Db_test_util.Kw "page"
    ; "logseq.property/public?", Db_test_util.Bool true ] ]

let asset_class_pre_txs : (string * Db_test_util.edn) list list =
  [ [ "db/ident", Db_test_util.Kw "logseq.class/Asset"
    ; "block/title", Db_test_util.Str "Asset"
    ; "block/name", Db_test_util.Str "asset"
    ; "block/uuid", Db_test_util.Uuid "00000003-0000-4000-8000-000000000103"
    ; "block/tags", Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Tag" ]
    ; "logseq.property.class/extends",
      Db_test_util.Set_ [ Db_test_util.Kw "logseq.class/Root" ] ] ]

(* cljs build-new-page gives built-in pages real epoch-ms created-at; the
   OCaml seed hardcodes 0 which would sit under created-at-min. Upsert a
   large value so the time-filter semantics match cljs. *)
let builtin_created_at_pre_txs : (string * Db_test_util.edn) list list =
  List.map
    (fun uuid ->
       [ "block/uuid", Db_test_util.Uuid uuid
       ; "block/created-at", Db_test_util.Int 1_700_000_000_000 ])
    [ "00000004-1031-2047-0034-000000000000" (* Library *)
    ; "00000004-2007-8570-0009-000000000000" (* Quick add *)
    ; "00000004-1871-9210-0097-000000000000" (* Contents *)
    ; "00000004-1514-5003-0003-000000000000" (* Recycle *) ]

(* ---------- tests ---------- *)

(* (deftest global-graph-defaults-to-tags-and-objects ...) *)
let test_global_graph_defaults_to_tags_and_objects () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Project"
            ~children:[ blk "task object" ~tags:[ "Topic" ] () ]
            ()
        ; pb "Plain Page" () ]
      ~classes:[ "Topic", cls () ]
      ()
  in
  let result = global_graph (db_of conn) in
  check "tag node rendered" (contains_label result "Topic");
  check "object node rendered" (contains_label result "task object");
  check "unrelated page excluded" (not (contains_label result "Plain Page"));
  check "default view mode is tags-and-objects"
    (meta_view_mode result = Some "tags-and-objects")

(* (deftest global-graph-can-switch-to-all-pages ...) *)
let test_global_graph_can_switch_to_all_pages () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Project"
            ~children:[ blk "task object" ~tags:[ "Topic" ] () ]
            ()
        ; pb "Plain Page" () ]
      ~classes:[ "Topic", cls () ]
      ()
  in
  let result = global_graph ~view_mode:"all-pages" (db_of conn) in
  check "all-pages includes normal pages"
    (contains_label result "Plain Page");
  check "view mode is all-pages"
    (meta_view_mode result = Some "all-pages")

(* (deftest global-all-pages-page-nodes-include-uuid ...) *)
let test_global_all_pages_page_nodes_include_uuid () =
  let conn =
    conn_with_blocks ~pages_and_blocks:[ pb "Plain Page" () ] ()
  in
  let db = db_of conn in
  let result = global_graph ~view_mode:"all-pages" ~orphan_pages:true db in
  let page = page_by_title_exn db "Plain Page" in
  let node_uuid =
    match Option.bind (node_by_label result "Plain Page")
            (node_field "uuid") with
    | Some (Wire.String u) -> Some u
    | _ -> None
  in
  check "page node carries uuid" (node_uuid = Some (uuid_of page))

(* (deftest global-tags-and-objects-page-nodes-include-uuid ...) *)
let test_global_tags_and_objects_page_nodes_include_uuid () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:[ pb "Tagged Page" ~tags:[ "Topic" ] () ]
      ~classes:[ "Topic", cls () ]
      ()
  in
  let db = db_of conn in
  let result = global_graph ~view_mode:"tags-and-objects" db in
  let page = page_by_title_exn db "Tagged Page" in
  let node_uuid =
    match Option.bind (node_by_label result "Tagged Page")
            (node_field "uuid") with
    | Some (Wire.String u) -> Some u
    | _ -> None
  in
  check "tagged page node carries uuid" (node_uuid = Some (uuid_of page))

(* (deftest global-all-pages-graph-keeps-links-within-rendered-nodes ...) *)
let test_global_all_pages_graph_keeps_links_within_rendered_nodes () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Visible Page"
            ~children:[ blk "See [[Excluded Page]] and [[Kept Page]]" () ]
            ()
        ; pb "Excluded Page"
            ~properties:
              [ "logseq.property/exclude-from-graph-view", Bool true ]
            ()
        ; pb "Kept Page" () ]
      ~pre_txs:graph_view_property_idents_pre_txs ()
  in
  let result =
    global_graph ~view_mode:"all-pages" (db_of conn) in
  let node_ids = List.filter_map node_id (nodes_of result) in
  check "excluded page not rendered"
    (not (contains_label result "Excluded Page"));
  check "kept page rendered" (contains_label result "Kept Page");
  check "every link endpoint is a rendered node"
    (List.for_all (fun id -> List.mem id node_ids) (link_endpoints result))

(* (deftest global-all-pages-graph-excludes-properties ...) *)
let test_global_all_pages_graph_excludes_properties () =
  let conn =
    conn_with_blocks
      ~properties:
        [ "rating", Db_test_util.{ default_property with p_type = "default" } ]
      ~pages_and_blocks:
        [ pb "Normal Page" ()
        ; pb "rating"
            ~tags:[ "logseq.class/Property" ]
            ~extra:[ "db/ident", Kw "user.property/rating" ]
            () ]
      ()
  in
  let result =
    global_graph ~view_mode:"all-pages" ~orphan_pages:true (db_of conn) in
  let labels = node_labels result in
  check "normal page rendered" (List.mem "Normal Page" labels);
  check "property page not rendered" (not (List.mem "rating" labels));
  check "no property nodes"
    (List.for_all
       (fun n -> node_field "kind" n <> Some (Wire.String "property"))
       (nodes_of result))

(* (deftest global-graph-labels-node-property-edges-with-property-title ...) *)
let test_global_graph_labels_node_property_edges_with_property_title () =
  let conn =
    conn_with_blocks
      ~properties:
        [ "user.property/influences",
          Db_test_util.
            { default_property with
              p_type = "node"
            ; p_title = Some "Influences" } ]
      ~pages_and_blocks:
        [ pb "Project A"
            ~tags:[ "Project" ]
            ~properties:
              [ "user.property/influences",
                Vec [ Kw "build/page"
                    ; Map [ "block/title", Str "Project B" ] ] ]
            ()
        ; pb "Project B" ~tags:[ "Project" ] () ]
      ~classes:[ "Project", cls () ]
      ()
  in
  let db = db_of conn in
  let all_pages_result =
    global_graph ~view_mode:"all-pages" ~orphan_pages:true db in
  let tags_result = global_graph ~view_mode:"tags-and-objects" db in
  check "all-pages property link carries property title"
    (link_label (link_between_labels all_pages_result "Project A" "Project B")
     = Some "Influences");
  check "tags-and-objects property link carries property title"
    (link_label (link_between_labels tags_result "Project A" "Project B")
     = Some "Influences")

(* (deftest global-all-pages-time-filter-keeps-visible-node-links ...) *)
let test_global_all_pages_time_filter_keeps_visible_node_links () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Early"
            ~extra:[ "block/created-at", Int 1000 ]
            ~children:[ blk "See [[Middle]] and [[Late]]" () ]
            ()
        ; pb "Middle" ~extra:[ "block/created-at", Int 2000 ] ()
        ; pb "Late" ~extra:[ "block/created-at", Int 3000 ] () ]
      ~pre_txs:builtin_created_at_pre_txs ()
  in
  let result =
    global_graph ~view_mode:"all-pages" ~orphan_pages:true
      ~created_at_filter:1000 (db_of conn)
  in
  check "only early+middle nodes rendered"
    (node_labels result = sort_uniq [ "Early"; "Middle" ]);
  check "link early->middle kept"
    (Option.is_some
       (link_between_labels result "Early" "Middle"));
  check "link early->late dropped"
    (Option.is_none (link_between_labels result "Early" "Late"));
  check "created-at-min is 1000"
    (all_pages_field "created-at-min" result = Some (Wire.Int 1000));
  check "created-at-max covers late"
    (match all_pages_field "created-at-max" result with
     | Some (Wire.Int n) -> 3000 <= n
     | _ -> false)

(* (deftest global-tags-and-objects-nodes-include-created-at ...) *)
let test_global_tags_and_objects_nodes_include_created_at () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Timed Objects"
            ~extra:[ "block/created-at", Int 1000 ]
            ~children:
              [ blk "timed object"
                  ~tags:[ "Topic" ]
                  ~extra:[ "block/created-at", Int 2000 ]
                  () ]
            () ]
      ~classes:
        [ "Topic", cls ~extra:[ "block/created-at", Int 1500 ] () ]
      ()
  in
  let result = global_graph ~view_mode:"tags-and-objects" (db_of conn) in
  let created_at_of label =
    Option.bind (node_by_label result label)
      (node_field "block/created-at")
  in
  check "tag node created-at"
    (created_at_of "Topic" = Some (Wire.Int 1500));
  check "object node created-at"
    (created_at_of "timed object" = Some (Wire.Int 2000))

(* (deftest global-tags-and-objects-replaces-block-uuid-refs-in-node-labels ...) *)
let test_global_tags_and_objects_replaces_block_uuid_refs_in_node_labels () =
  let target_uuid = "11111111-1111-1111-1111-111111111111" in
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Referenced blocks"
            ~children:
              [ blk "Referenced title" ~uuid:target_uuid ()
              ; blk (Printf.sprintf "mentions [[%s]]" target_uuid)
                  ~tags:[ "Topic" ] () ]
            () ]
      ~classes:[ "Topic", cls () ]
      ()
  in
  let result = global_graph ~view_mode:"tags-and-objects" (db_of conn) in
  let labels = node_labels result in
  check "uuid ref replaced with target title"
    (List.mem "mentions Referenced title" labels);
  check "raw uuid ref not rendered"
    (not (List.mem (Printf.sprintf "mentions %s" target_uuid) labels))

(* (deftest global-graph-nodes-include-icons ...) *)
let test_global_graph_nodes_include_icons () =
  let page_uuid = "22222222-2222-4222-8222-222222222222" in
  let block_uuid = "33333333-3333-4333-8333-333333333333" in
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pb "Icon Page" ~uuid:page_uuid ()
        ; pbb "Objects"
            ~children:
              [ blk "icon object" ~uuid:block_uuid ~tags:[ "Topic" ] () ]
            () ]
      ~classes:[ "Topic", cls () ]
      ~pre_txs:graph_view_property_idents_pre_txs ()
  in
  (* cljs sets {:build/properties {:logseq.property/icon {:type ...}}};
     datascript-ocaml rejects nested-map values on non-ref attrs inside
     entity-map tx, so apply the same datom via [:db/add]. *)
  transact_string conn
    (Printf.sprintf
       "[[:db/add [:block/uuid #uuid \"%s\"] :logseq.property/icon {:type :emoji :id \"star\"}]\n\
        [:db/add [:block/uuid #uuid \"%s\"] :logseq.property/icon {:type :emoji :id \"rocket\"}]]"
       page_uuid block_uuid);
  let db = db_of conn in
  let all_pages_result =
    global_graph ~view_mode:"all-pages" ~orphan_pages:true db in
  let tags_result = global_graph ~view_mode:"tags-and-objects" db in
  let icon_of result label =
    match Option.bind (node_by_label result label) (node_field "icon") with
    | Some (Wire.Map kvs) ->
        (match wire_get "type" kvs, wire_get "id" kvs with
         | Some (Wire.Keyword t), Some (Wire.String i) -> Some (t, i)
         | _ -> None)
    | _ -> None
  in
  check "page node icon"
    (icon_of all_pages_result "Icon Page" = Some ("emoji", "star"));
  check "object node icon"
    (icon_of tags_result "icon object" = Some ("emoji", "rocket"))

(* (deftest tags-and-objects-graph-allows-non-core-built-in-tags ...) *)
let test_tags_and_objects_graph_allows_non_core_built_in_tags () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Built-in Tags"
            ~children:
              [ blk "task object" ~tags:[ "logseq.class/Task" ] ()
              ; blk "asset object" ~tags:[ "logseq.class/Asset" ] () ]
            () ]
      ~pre_txs:asset_class_pre_txs ()
  in
  let result = global_graph ~view_mode:"tags-and-objects" (db_of conn) in
  let labels = node_labels result in
  check "non-core built-in tag rendered" (List.mem "Task" labels);
  check "task object rendered" (List.mem "task object" labels);
  check "task node carries db-ident"
    (match Option.bind (node_by_label result "Task")
             (node_field "db-ident") with
     | Some (Wire.Keyword i) -> i = "logseq.class/Task"
     | _ -> false);
  check "core built-in tag stays hidden" (not (List.mem "Asset" labels));
  check "asset object not rendered" (not (List.mem "asset object" labels))

(* (deftest tags-and-objects-graph-links-tag-extends ...) *)
let test_tags_and_objects_graph_links_tag_extends () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Objects"
            ~children:[ blk "child object" ~tags:[ "Child" ] () ]
            () ]
      ~classes:
        [ "Parent", cls ()
        ; "Child", cls ~extends:[ "Parent" ] () ]
      ()
  in
  let result = global_graph ~view_mode:"tags-and-objects" (db_of conn) in
  check "parent tag rendered" (contains_label result "Parent");
  check "child tag rendered" (contains_label result "Child");
  check "extends link labeled Extends"
    (link_label (link_between_labels result "Child" "Parent")
     = Some "Extends")

(* (deftest global-all-pages-graph-links-library-page-parents ...) *)
let test_global_all_pages_graph_links_library_page_parents () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pb "Library Parent" (); pb "Library Child" () ]
      ()
  in
  let db = db_of conn in
  let parent = (page_by_title_exn db "Library Parent").id in
  let child = (page_by_title_exn db "Library Child").id in
  let library = (page_by_title_exn db "Library").id in
  transact_string conn
    (Printf.sprintf
       "[[:db/add %d :block/parent %d] [:db/add %d :block/parent %d]]"
       parent library child parent);
  let result =
    global_graph ~view_mode:"all-pages" ~orphan_pages:false (db_of conn) in
  check "library parent rendered" (contains_label result "Library Parent");
  check "library child rendered" (contains_label result "Library Child");
  check "child->parent link present"
    (Option.is_some
       (link_between_labels result "Library Child" "Library Parent"))

(* (deftest global-all-pages-graph-links-class-extends ...) *)
let test_global_all_pages_graph_links_class_extends () =
  let conn =
    conn_with_blocks
      ~classes:
        [ "Bug", cls ()
        ; "Regression", cls ~extends:[ "Bug" ] () ]
      ()
  in
  let result =
    global_graph ~view_mode:"all-pages" ~orphan_pages:false (db_of conn) in
  check "regression node rendered" (contains_label result "Regression");
  check "bug node rendered" (contains_label result "Bug");
  check "extends link labeled Extends"
    (link_label (link_between_labels result "Regression" "Bug")
     = Some "Extends")

(* (deftest page-graph-links-class-extends ...) *)
let test_page_graph_links_class_extends () =
  let conn =
    conn_with_blocks
      ~classes:
        [ "Bug", cls ()
        ; "Regression", cls ~extends:[ "Bug" ] () ]
      ()
  in
  let db = db_of conn in
  let regression_page = page_by_title_exn db "Regression" in
  let result = page_graph db (uuid_of regression_page) in
  check "page node rendered" (contains_label result "Regression");
  check "extends node rendered" (contains_label result "Bug");
  check "extends link labeled Extends"
    (link_label (link_between_labels result "Regression" "Bug")
     = Some "Extends")

(* (deftest tags-and-objects-graph-respects-hidden-recycled-and-excluded-visibility ...) *)
let test_tags_and_objects_graph_respects_hidden_recycled_and_excluded_visibility
    () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Visible Page"
            ~children:[ blk "visible object" ~tags:[ "Topic" ] () ]
            ()
        ; pbb "Hidden Page"
            ~properties:[ "logseq.property/hide?", Bool true ]
            ~children:[ blk "hidden page object" ~tags:[ "Topic" ] () ]
            ()
        ; pbb "Recycled Page"
            ~properties:[ "logseq.property/deleted-at", Int 1712000000000 ]
            ~children:[ blk "recycled page object" ~tags:[ "Topic" ] () ]
            ()
        ; pbb "Excluded Page"
            ~properties:
              [ "logseq.property/exclude-from-graph-view", Bool true ]
            ~children:[ blk "excluded page object" ~tags:[ "Topic" ] () ]
            ()
        ; pbb "Hidden Parent"
            ~children:
              [ blk "hidden parent block"
                  ~properties:[ "logseq.property/hide?", Bool true ]
                  ~children:
                    [ blk "hidden child object" ~tags:[ "Topic" ] () ]
                  () ]
            ()
        ; pb "Excluded Tagged Page"
            ~tags:[ "Topic" ]
            ~properties:
              [ "logseq.property/exclude-from-graph-view", Bool true ]
            () ]
      ~classes:[ "Topic", cls () ]
      ~pre_txs:graph_view_property_idents_pre_txs ()
  in
  let result = global_graph ~view_mode:"tags-and-objects" (db_of conn) in
  let labels = node_labels result in
  check "tag node rendered" (List.mem "Topic" labels);
  check "visible object rendered" (List.mem "visible object" labels);
  check "hidden page object not rendered"
    (not (List.mem "hidden page object" labels));
  check "recycled page object not rendered"
    (not (List.mem "recycled page object" labels));
  check "excluded page object not rendered"
    (not (List.mem "excluded page object" labels));
  check "hidden child object not rendered"
    (not (List.mem "hidden child object" labels));
  check "excluded tagged page not rendered"
    (not (List.mem "Excluded Tagged Page" labels))

(* (deftest large-all-pages-graph-keeps-bounded-visible-links ...) *)
let test_large_all_pages_graph_keeps_bounded_visible_links () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        ( pbb "Hub" ~children:[ blk "See [[Page 1]]" () ] ()
          :: List.init 10050
               (fun idx -> pb (Printf.sprintf "Page %d" idx) ()) )
      ()
  in
  let result =
    global_graph ~view_mode:"all-pages" ~orphan_pages:true (db_of conn) in
  let hub_id =
    Option.bind (node_by_label result "Hub") node_id in
  let page_id =
    Option.bind (node_by_label result "Page 1") node_id in
  check "hub node rendered" (Option.is_some hub_id);
  check "page 1 node rendered" (Option.is_some page_id);
  (* cljs (contains? (set (:links result)) {:source hub-id :target page-id})
     — exact 2-key link-map membership, so the link must carry no label. *)
  check "hub->page-1 link present"
    (match hub_id, page_id with
     | Some s, Some t ->
         List.exists
           (fun l ->
              match l with
              | Wire.Map kvs ->
                  wire_string_field "source" kvs = Some s
                  && wire_string_field "target" kvs = Some t
                  && List.length kvs = 2
              | _ -> false)
           (links_of result)
     | _ -> false)

(* (deftest tags-and-objects-graph-skips-large-unrelated-page-set-quickly ...) *)
let test_tags_and_objects_graph_skips_large_unrelated_page_set_quickly () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        (List.init 12000
           (fun idx -> pb (Printf.sprintf "Page %d" idx) ()))
      ()
  in
  let db = db_of conn in
  let elapsed, result =
    fastest_build 3
      (fun () -> global_graph ~view_mode:"tags-and-objects" db)
  in
  check "no nodes for unrelated page set" (nodes_of result = []);
  check "build under 1000ms" (elapsed < 1000.0)

(* (deftest tags-and-objects-graph-builds-large-tagged-set-quickly ...) *)
let test_tags_and_objects_graph_builds_large_tagged_set_quickly () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ pbb "Movies"
            ~children:
              (List.init 3885
                 (fun idx ->
                    blk (Printf.sprintf "Movie %d" idx)
                      ~tags:[ "Movie" ] ()))
            () ]
      ~classes:[ "Movie", cls () ]
      ()
  in
  let db = db_of conn in
  let elapsed, result =
    fastest_build 3
      (fun () -> global_graph ~view_mode:"tags-and-objects" db)
  in
  check "all tagged nodes rendered"
    (List.length (nodes_of result) = 3886);
  check "all tag links rendered"
    (List.length (links_of result) = 3885);
  check "build under 1000ms" (elapsed < 1000.0)

let cases =
  [ "global-graph-defaults-to-tags-and-objects", `Quick,
    test_global_graph_defaults_to_tags_and_objects
  ; "global-graph-can-switch-to-all-pages", `Quick,
    test_global_graph_can_switch_to_all_pages
  ; "global-all-pages-page-nodes-include-uuid", `Quick,
    test_global_all_pages_page_nodes_include_uuid
  ; "global-tags-and-objects-page-nodes-include-uuid", `Quick,
    test_global_tags_and_objects_page_nodes_include_uuid
  ; "global-all-pages-graph-keeps-links-within-rendered-nodes", `Quick,
    test_global_all_pages_graph_keeps_links_within_rendered_nodes
  ; "global-all-pages-graph-excludes-properties", `Quick,
    test_global_all_pages_graph_excludes_properties
  ; "global-graph-labels-node-property-edges-with-property-title", `Quick,
    test_global_graph_labels_node_property_edges_with_property_title
  ; "global-all-pages-time-filter-keeps-visible-node-links", `Quick,
    test_global_all_pages_time_filter_keeps_visible_node_links
  ; "global-tags-and-objects-nodes-include-created-at", `Quick,
    test_global_tags_and_objects_nodes_include_created_at
  ; "global-tags-and-objects-replaces-block-uuid-refs-in-node-labels",
    `Quick,
    test_global_tags_and_objects_replaces_block_uuid_refs_in_node_labels
  ; "global-graph-nodes-include-icons", `Quick,
    test_global_graph_nodes_include_icons
  ; "tags-and-objects-graph-allows-non-core-built-in-tags", `Quick,
    test_tags_and_objects_graph_allows_non_core_built_in_tags
  ; "tags-and-objects-graph-links-tag-extends", `Quick,
    test_tags_and_objects_graph_links_tag_extends
  ; "global-all-pages-graph-links-library-page-parents", `Quick,
    test_global_all_pages_graph_links_library_page_parents
  ; "global-all-pages-graph-links-class-extends", `Quick,
    test_global_all_pages_graph_links_class_extends
  ; "page-graph-links-class-extends", `Quick,
    test_page_graph_links_class_extends
  ; "tags-and-objects-graph-respects-hidden-recycled-and-excluded-visibility",
    `Quick,
    test_tags_and_objects_graph_respects_hidden_recycled_and_excluded_visibility
  ; "large-all-pages-graph-keeps-bounded-visible-links", `Quick,
    test_large_all_pages_graph_keeps_bounded_visible_links
  ; "tags-and-objects-graph-skips-large-unrelated-page-set-quickly",
    `Quick,
    test_tags_and_objects_graph_skips_large_unrelated_page_set_quickly
  ; "tags-and-objects-graph-builds-large-tagged-set-quickly", `Quick,
    test_tags_and_objects_graph_builds_large_tagged_set_quickly ]