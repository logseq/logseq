(* 1:1 translation of
   src/test/frontend/worker/handler/render_resource_test.cljs — the
   render-resource engine tests (render_snapshots, watch keys, resource
   values, dispatcher registration).

   cljs deftest names are kept as OCaml test names verbatim.

   Fixture: cljs `db-test/create-conn` maps to `Sqlite_export.create_conn ()`
   (full seeded graph incl. built-in ontology); the page/journal/view/block/
   comment fixture is transacted verbatim as EDN via
   `Datascript.transact_conn_string`.

   Skipped cljs cases (unported dependency):
   - block-comment-summary-follows-comment-lifecycle-and-author-renames-test:
     needs frontend.worker.render-affected-keys (db-listener surface, not
     ported).
   - unlinked-references-resource-normalizes-list-partitions-test and
     view-data-resource-watches-effective-persisted-configuration-test:
     `with-redefs db-view/get-view-data` — Db_view.get_view_data has no
     injection ref in the OCaml port.
   - query-resource-executes-dsl-with-only-serialized-context-test,
     query-resource-applies-serialized-transform-and-top-level-filter-test,
     query-resource-can-keep-nested-block-results-test: `with-redefs
     query-dsl/execute-query` supplies the rows — the cljs assertions check
     the injected rows, which the real Db_query_dsl cannot reproduce.
     (partial-port attempts would only exercise watch keys.)

   Partial ports (cljs-only dependency dropped, rest kept):
   - block-snapshot-dependencies-do-not-depend-on-batch-order-test: the
     `subs-loader/entry-response` patch assertions are frontend-side; the
     batch-order group assertions are ported.
   - route-block-resource-reuses-reference-aware-page-route-matching-test
     and missing-route-block-is-invalidated-when-a-heading-starts-matching-test:
     the affected-keys assertions are dropped; envelope + value assertions
     kept.

   cljs-vs-OCaml divergences surfaced (asserted where observable):
   - cljs function values (identity, query-fn) cannot exist on the wire in
     OCaml; the "non-data contract" rejections are exercised with a
     datascript/Entity tagged value instead (same fail path).
   - cljs `re-pattern` compiles eagerly; datascript-ocaml binds a Regex
     lazily so an invalid pattern like "(" never errors. The
     render-snapshots-isolates-failing-query-resources test therefore shows
     a currently-red engine divergence.
   - Regex values serialize as Wire.String, not a regexp object —
     query-resource-keeps-escaped-paren-regex-inputs asserts the string.
   - block-task-time cljs test redefs time-ms to 10000; with doing@1000 ->
     done@4000 the :seconds total is clock-independent (done is terminal),
     so the resource is exercised with the real clock.
   - `doseq`/`testing` blocks map to List.iter with suffixed check names.
   - assert-resource-envelope's first cljs assertion (the record's key set)
     is checked against the raw snapshot response keys (basis-rev/slots/
     groups), and `ldb/write-transit-str` maps to Transit_codec to_string/
     of_string round-trip on the raw response.

   Known lib/engine bugs (documented, NOT worked around — currently red):

   lib (deps/db-worker/lib):
   - render_snapshot emits a canonical block wire Map with DUPLICATE keys
     (:block/title and :block/tx-id each appear twice). cljs maps cannot
     hold duplicate keys, so the value is not transit-representable:
     write->read round-trip dedups and the `= response (read (write
     response))` assertions fail (worker-exposes-one-normalized-render-
     snapshots-api, all-pages-view-data-returns-the-first-window-ids).
   - sidebar-page-resources block value lacks :block/raw-title.
   - views resource ignores its feature-type argument — returns every
     view for the owner instead of filtering (views-resource-returns-...,
     view-data-resource-returns-...-sibling-views).
   - view-data for a :query-result view does not emit :properties maps
     (query-view-data-resource-...-property-maps-test).
   - result_arg wraps scalar Int query inputs as Result_entity — a
     [:in $ ?x] Int input renders as {db/id n} instead of the scalar
     (query-resource-preserves-scalar-inputs).
   - pull result maps include :db/id that cljs pull omits
     (query-resource-keeps-pull-map-...).
   - query_result_cell_uuid returns None for Result_entity cells, so the
     current-block-uuid filter cannot drop them
     (quoted-full-text-query-uses-worker-search-and-filters-results).
   - positioned-property chips snapshot is empty for a property whose
     value is positioned (canonical-visible-blocks-...-positioned-chips).
   - failing-query isolation: lazy re-pattern (below) means no error
     value is produced.

   engine (datascript-ocaml):
   - :in scalar bindings are rebound by later clauses instead of acting
     as a filter. Minimal repro on a block with no status history:
     [:find ?h :in $ ?bid :where [?h :logseq.property.history/block ?bid]]
       -> 0 rows (correct)
     [...same + [?h :logseq.property.history/property :logseq.property/status]]
       -> every status-history row (incorrect)
     Endpoint_query.block_status_history/task_spent_time_impl therefore
     returns another block's history
     (block-task-time-resource-has-an-authoritative-empty-value).
   - {:db/id [:block/uuid u] :block/title "x"} lookup-ref entity-map
     updates are not applied (block-breadcrumb-...-updated-title).
   - AVET index strictness: unindexed :user.property/page-mode raises
     Invalid_argument on plain datoms access
     (view-data-resource-supports-view-config).
   - lazy re-pattern: "(" binds without erroring — cljs
     re-pattern/regex-match compile eagerly and raise
     "Invalid regular expression" (render-snapshots-isolates-failing-
     query-resources). *)

open Datascript
open Test_shared

let () = Worker_core.init ()

let kw s = Wire.Keyword s
let wu s = Wire.Uuid s
let wkey parts = Wire.Array parts

(* ------------------------- wire helpers ------------------------- *)

let rec wire_of_form (f : query_form) : Wire.t =
  match f with
  | QueryFormNil -> Wire.Nil
  | QueryFormBool b -> Wire.Bool b
  | QueryFormInt n -> Wire.Int n
  | QueryFormFloat x -> Wire.Float x
  | QueryFormString s -> Wire.String s
  | QueryFormKeyword s -> Wire.Keyword s
  | QueryFormSymbol s -> Wire.Symbol s
  | QueryFormVector xs -> Wire.Array (List.map wire_of_form xs)
  | QueryFormList xs -> Wire.List (List.map wire_of_form xs)
  | QueryFormSet xs -> Wire.Set (List.map wire_of_form xs)
  | QueryFormTagged ("uuid", QueryFormString s) -> Wire.Uuid s
  | QueryFormTagged (tag, rep) -> Wire.Tagged (tag, wire_of_form rep)
  | QueryFormMap kvs ->
      Wire.Map (List.map (fun (k, v) -> (wire_of_form k, wire_of_form v)) kvs)

let wire_of_edn (s : string) : Wire.t = wire_of_form (Parser.read_edn s)

(* cljs `=` is order-insensitive on maps/sets and treats vectors and lists
   alike; cljs has a single Number type so Int64 is folded into Int.
   norm_wire canonicalizes before structural compare. *)
let rec norm_wire (w : Wire.t) : Wire.t =
  match w with
  | Wire.Int64 n -> Wire.Int (Int64.to_int n)
  | Wire.List xs -> Wire.Array (List.map norm_wire xs)
  | Wire.Array xs -> Wire.Array (List.map norm_wire xs)
  | Wire.Set xs -> Wire.Set (List.sort_uniq Stdlib.compare (List.map norm_wire xs))
  | Wire.Map kvs ->
      Wire.Map
        (List.sort Stdlib.compare
           (List.map (fun (k, v) -> (norm_wire k, norm_wire v)) kvs))
  | Wire.Tagged (t, rep) -> Wire.Tagged (t, norm_wire rep)
  | w -> w

(* `compare` rather than `=`: cljs `=` on data is a total ordering; OCaml
   polymorphic `=` returns false on Float NaN leaves while compare treats
   them as equal — matching cljs NaN semantics closely enough. *)
let wire_eq a b = Stdlib.compare (norm_wire a) (norm_wire b) = 0

(* cljs compares watch keys / slot groups as sets — duplicates collapse *)
let wire_list_eq xs ys =
  List.sort_uniq Stdlib.compare (List.map norm_wire xs)
  = List.sort_uniq Stdlib.compare (List.map norm_wire ys)

let slot_get (key : Wire.t) (w : Wire.t) : Wire.t option =
  match w with
  | Wire.Map kvs -> (
      match List.find_opt (fun (k, _) -> wire_eq k key) kvs with
      | Some (_, v) -> Some v
      | None -> None)
  | _ -> None

let wire_mem key w = slot_get key w <> None

let wire_eq_opt a b =
  match a, b with
  | Some x, Some y -> wire_eq x y
  | None, None -> true
  | _ -> false

let list_take n xs =
  let rec go acc n = function
    | x :: tl when n > 0 -> go (x :: acc) (n - 1) tl
    | _ -> List.rev acc
  in
  go [] n xs

let string_contains s sub =
  let n = String.length s and m = String.length sub in
  let rec find i =
    if i + m > n then false else String.sub s i m = sub || find (i + 1)
  in
  m = 0 || find 0

let get_in (w : Wire.t) (path : Wire.t list) : Wire.t option =
  List.fold_left
    (fun acc k -> match acc with Some m -> slot_get k m | None -> None)
    (Some w) path

(* fns/entities cannot cross the wire; cljs uses `identity` and raw entity
   refs — the OCaml equivalent non-data value is a datascript/Entity tag. *)
let wire_entity_tag = Wire.Tagged ("datascript/Entity", Wire.Int 1)

(* ------------------------- fixture ------------------------- *)

let tx conn edn = ignore (Datascript.transact_conn_string conn edn)

let quid s = Printf.sprintf "#uuid \"%s\"" s
let uref s = Printf.sprintf "[:block/uuid #uuid \"%s\"]" s

let next_uuid_i = ref 0
let next_uuid () =
  incr next_uuid_i;
  Printf.sprintf "00000000-0000-4000-8000-%012x" !next_uuid_i

let fixture_uuid_keys =
  [ "page"; "journal-a"; "journal-b"; "journal-child-a"; "journal-child-b"
  ; "journal-grandchild"; "reaction-target"; "creator-a"; "creator-b"
  ; "reaction-a"; "reaction-b"; "view-owner"; "view-a"; "view-b"; "other-view"
  ; "view-row"; "resource-block"; "display-property"; "positioned-property"
  ; "hidden-property"; "property-value"; "closed-value"; "bidirectional-class"
  ; "bidirectional-property"; "bidirectional-entity"; "reference-block"
  ; "comment-thread"; "comment-block"; "comment-block-b"; "comment-author-a"
  ; "comment-author-b"; "empty-comment-thread"; "task-block"
  ; "task-history-doing"; "task-history-done"; "route-heading"; "class-page"
  ; "class-visible-child"; "class-filtered-child"; "property-page"
  ; "property-visible-child"; "property-filtered-child"; "quick-add-page"
  ; "current-user"; "other-user"; "quick-add-unowned"; "quick-add-current-user"
  ; "quick-add-other-user" ]

let fixture_uuids () : (string * string) list =
  List.mapi
    (fun i k ->
      (k, Printf.sprintf "00000000-0000-4000-9000-%012x" (i + 1)))
    fixture_uuid_keys

let page_and_journal_tx (u : string -> string) : string =
  Printf.sprintf
    "{:db/id -1 :block/uuid %s :block/tx-id 20 :block/title \"Page Identity\" :block/name \"page identity\" :block/tags :logseq.class/Page}
     {:db/id -2 :block/uuid %s :block/tx-id 20 :block/title \"Jan 1st, 2020\" :block/name \"jan 1st, 2020\" :block/journal-day 20200101 :block/tags :logseq.class/Journal}
     {:db/id -3 :block/uuid %s :block/tx-id 20 :block/title \"Jan 2nd, 2020\" :block/name \"jan 2nd, 2020\" :block/journal-day 20200102 :block/tags :logseq.class/Journal}
     {:db/id -4 :block/uuid %s :block/tx-id 20 :block/title \"First child\" :block/page -2 :block/parent -2 :block/order \"a0\"}
     {:db/id -5 :block/uuid %s :block/tx-id 20 :block/title \"Second child\" :block/page -2 :block/parent -2 :block/order \"b0\"}
     {:db/id -6 :block/uuid %s :block/tx-id 20 :block/title \"Nested child\" :block/page -2 :block/parent -4 :block/order \"a1\"}"
    (quid (u "page")) (quid (u "journal-a")) (quid (u "journal-b"))
    (quid (u "journal-child-a")) (quid (u "journal-child-b"))
    (quid (u "journal-grandchild"))

let reaction_tx (u : string -> string) : string =
  Printf.sprintf
    "{:db/id -7 :block/uuid %s :block/tx-id 20 :block/title \"Reaction target\" :block/page -1 :block/parent -1 :block/order \"a0\"}
     {:db/id -8 :block/uuid %s :block/tx-id 20 :block/title \"Alpha\"}
     {:db/id -9 :block/uuid %s :block/tx-id 20 :block/title \"Zed\"}
     {:db/id -10 :block/uuid %s :block/tx-id 20 :logseq.property.reaction/emoji-id \"thumbsup\" :logseq.property.reaction/target -7 :logseq.property/created-by-ref -8}
     {:db/id -11 :block/uuid %s :block/tx-id 20 :logseq.property.reaction/emoji-id \"thumbsup\" :logseq.property.reaction/target -7 :logseq.property/created-by-ref -9}"
    (quid (u "reaction-target")) (quid (u "creator-a")) (quid (u "creator-b"))
    (quid (u "reaction-a")) (quid (u "reaction-b"))

let view_tx (u : string -> string) : string =
  Printf.sprintf
    "{:db/id -12 :block/uuid %s :block/tx-id 20 :block/title \"Projects\" :block/name \"projects\" :block/tags :logseq.class/Tag}
     {:db/id -13 :block/uuid %s :block/tx-id 20 :block/title \"First view\" :block/order \"a0\" :logseq.property/view-for -12 :logseq.property.view/feature-type :class-objects}
     {:db/id -14 :block/uuid %s :block/tx-id 20 :block/title \"Second view\" :block/order \"b0\" :logseq.property/view-for -12 :logseq.property.view/feature-type :class-objects}
     {:db/id -15 :block/uuid %s :block/tx-id 20 :block/title \"Other view\" :block/order \"c0\" :logseq.property/view-for -12 :logseq.property.view/feature-type :linked-references :logseq.property.view/type :logseq.property.view/type.table}
     {:db/id -16 :block/uuid %s :block/tx-id 20 :block/title \"Object row\" :block/tags -12}"
    (quid (u "view-owner")) (quid (u "view-a")) (quid (u "view-b"))
    (quid (u "other-view")) (quid (u "view-row"))

let block_resource_tx (u : string -> string) : string =
  Printf.sprintf
    "{:db/id -18 :db/ident :user.property/display :block/uuid %s :block/tx-id 20 :block/title \"Display\" :block/tags :logseq.class/Property :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :logseq.property/type :node :logseq.property/ui-position :properties :logseq.property/public? true}
     {:db/id -19 :db/ident :user.property/positioned :block/uuid %s :block/tx-id 20 :block/title \"Positioned\" :block/tags :logseq.class/Property :db/valueType :db.type/string :db/cardinality :db.cardinality/one :logseq.property/type :default :logseq.property/ui-position :block-right :logseq.property/public? true}
     {:db/id -20 :db/ident :user.property/hidden :block/uuid %s :block/tx-id 20 :block/title \"Hidden\" :block/tags :logseq.class/Property :db/valueType :db.type/string :db/cardinality :db.cardinality/one :logseq.property/type :default :logseq.property/ui-position :properties :logseq.property/public? true :logseq.property/hide? true}
     {:db/id -21 :block/uuid %s :block/tx-id 20 :block/title \"Property value\"}
     {:db/id -22 :block/uuid %s :block/tx-id 20 :block/title \"Closed value\" :block/order \"a0\" :block/closed-value-property -18}
     {:db/id -17 :block/uuid %s :block/tx-id 20 :block/title \"Resource block\" :block/page -1 :block/parent -1 :block/order \"r0\" :user.property/display -21 :user.property/positioned \"right\" :user.property/hidden \"secret\"}"
    (quid (u "display-property")) (quid (u "positioned-property"))
    (quid (u "hidden-property")) (quid (u "property-value"))
    (quid (u "closed-value")) (quid (u "resource-block"))

let related_resource_tx (u : string -> string) : string =
  Printf.sprintf
    "{:db/id -23 :block/uuid %s :block/tx-id 20 :block/title \"Project\" :block/created-at 1000 :block/tags :logseq.class/Tag :logseq.property.class/enable-bidirectional? true}
     {:db/id -24 :db/ident :user.property/target :block/uuid %s :block/tx-id 20 :block/title \"Target\" :block/tags :logseq.class/Property :db/valueType :db.type/ref :db/cardinality :db.cardinality/one :logseq.property/type :node :logseq.property/classes -23}
     {:db/id -25 :block/uuid %s :block/tx-id 20 :block/title \"Related project\" :block/created-at 2000 :block/tags -23 :user.property/target -17}
     {:db/id -26 :block/uuid %s :block/tx-id 20 :block/title \"Reference\" :block/page -1 :block/parent -1 :block/order \"s0\" :block/refs -17}
     {:db/id -27 :block/uuid %s :block/tx-id 20 :block/title \"Comments\" :block/page -1 :block/parent -1 :block/order \"t0\" :block/tags :logseq.class/Comments :logseq.property.comments/blocks -17}
     {:db/id -28 :block/uuid %s :block/tx-id 20 :block/title \"A comment\" :block/created-at 1000 :block/page -1 :block/parent -27 :block/order \"a0\" :block/tags :logseq.class/Comment :logseq.property/created-by-ref -45}
     {:db/id -45 :block/uuid %s :block/tx-id 20 :block/title \"Alpha\"}
     {:db/id -46 :block/uuid %s :block/tx-id 20 :block/title \"  Beta  \"}
     {:db/id -47 :block/uuid %s :block/tx-id 20 :block/title \"A later comment\" :block/created-at 3000 :block/page -1 :block/parent -27 :block/order \"b0\" :block/tags :logseq.class/Comment :logseq.property/created-by-ref -46}
     {:db/id -48 :block/uuid %s :block/tx-id 20 :block/title \"Empty comments\" :block/tags :logseq.class/Comments}"
    (quid (u "bidirectional-class")) (quid (u "bidirectional-property"))
    (quid (u "bidirectional-entity")) (quid (u "reference-block"))
    (quid (u "comment-thread")) (quid (u "comment-block"))
    (quid (u "comment-author-a")) (quid (u "comment-author-b"))
    (quid (u "comment-block-b")) (quid (u "empty-comment-thread"))

let task_and_route_resource_tx (u : string -> string) : string =
  Printf.sprintf
    "{:db/id -29 :block/uuid %s :block/tx-id 20 :block/title \"Task\" :block/page -1 :block/parent -1 :block/order \"u0\" :logseq.property/status :logseq.property/status.done}
     {:db/id -30 :block/uuid %s :block/tx-id 20 :block/created-at 1000 :logseq.property.history/block -29 :logseq.property.history/property :logseq.property/status :logseq.property.history/ref-value :logseq.property/status.doing}
     {:db/id -31 :block/uuid %s :block/tx-id 20 :block/created-at 4000 :logseq.property.history/block -29 :logseq.property.history/property :logseq.property/status :logseq.property.history/ref-value :logseq.property/status.done}
     {:db/id -32 :block/uuid %s :block/tx-id 20 :block/title \"## Route Heading\" :block/page -1 :block/parent -1 :block/order \"v0\" :logseq.property/heading true}"
    (quid (u "task-block")) (quid (u "task-history-doing"))
    (quid (u "task-history-done")) (quid (u "route-heading"))

let special_page_membership_tx (u : string -> string) : string =
  Printf.sprintf
    "{:db/id -33 :block/uuid %s :block/tx-id 20 :block/title \"Class page\" :block/name \"class page\" :block/tags :logseq.class/Tag}
     {:db/id -34 :block/uuid %s :block/tx-id 20 :block/title \"Visible class child\" :block/page -33 :block/parent -33 :block/order \"a0\"}
     {:db/id -35 :block/uuid %s :block/tx-id 20 :block/title \"Filtered class child\" :block/page -33 :block/parent -33 :block/order \"b0\" :block/tags -33}
     {:db/id -36 :db/ident :user.property/page-mode :block/uuid %s :block/tx-id 20 :block/title \"Property page\" :block/name \"property page\" :block/tags :logseq.class/Property :db/valueType :db.type/string :db/cardinality :db.cardinality/one :logseq.property/type :default}
     {:db/id -37 :block/uuid %s :block/tx-id 20 :block/title \"Visible property child\" :block/page -36 :block/parent -36 :block/order \"a0\"}
     {:db/id -38 :block/uuid %s :block/tx-id 20 :block/title \"Filtered property child\" :block/page -36 :block/parent -36 :block/order \"b0\" :user.property/page-mode \"set\"}
     {:db/id -39 :block/uuid %s :block/tx-id 20 :block/title \"Quick add\" :block/name \"quick add\" :block/tags :logseq.class/Page}
     {:db/id -40 :block/uuid %s :block/tx-id 20 :block/title \"Current user\"}
     {:db/id -41 :block/uuid %s :block/tx-id 20 :block/title \"Other user\"}
     {:db/id -42 :block/uuid %s :block/tx-id 20 :block/title \"Unowned\" :block/page -39 :block/parent -39 :block/order \"a0\"}
     {:db/id -43 :block/uuid %s :block/tx-id 20 :block/title \"Mine\" :block/page -39 :block/parent -39 :block/order \"b0\" :logseq.property/created-by-ref -40}
     {:db/id -44 :block/uuid %s :block/tx-id 20 :block/title \"Theirs\" :block/page -39 :block/parent -39 :block/order \"c0\" :logseq.property/created-by-ref -41}"
    (quid (u "class-page")) (quid (u "class-visible-child"))
    (quid (u "class-filtered-child")) (quid (u "property-page"))
    (quid (u "property-visible-child")) (quid (u "property-filtered-child"))
    (quid (u "quick-add-page")) (quid (u "current-user")) (quid (u "other-user"))
    (quid (u "quick-add-unowned")) (quid (u "quick-add-current-user"))
    (quid (u "quick-add-other-user"))

(* seeded db cached once — Sqlite_export.create_conn seeds the full
   built-in ontology (~25s); conn_from_db clones share it. Same pattern
   as test_db_listener_native.seeded_conn. *)
let seeded_db : db option ref = ref None

let seeded_conn () : conn =
  let db =
    match !seeded_db with
    | Some d -> d
    | None ->
        let c = Sqlite_export.create_conn () in
        let d = db_of c in
        seeded_db := Some d;
        d
  in
  conn_from_db db

(* cljs (db-test/create-conn) + concat fixture txs as one transact. *)
let fixture_db : db option ref = ref None

let render_resource_fixture () : conn * (string -> string) =
  let uuids = fixture_uuids () in
  let u k = List.assoc k uuids in
  let db =
    match !fixture_db with
    | Some d -> d
    | None ->
        let conn = seeded_conn () in
        tx conn
          ("["
           ^ String.concat "\n"
               [ page_and_journal_tx u; reaction_tx u; view_tx u
               ; block_resource_tx u; related_resource_tx u
               ; task_and_route_resource_tx u; special_page_membership_tx u ]
           ^ "]");
        let d = db_of conn in
        fixture_db := Some d;
        d
  in
  (Datascript.conn_from_db db, u)

(* ------------------------- engine helpers ------------------------- *)

type one_resource =
  { basis_rev : int
  ; res_key : Wire.t
  ; watch_keys : Wire.t list
  ; watch_all : bool
  ; value : Wire.t
  ; slots : (Wire.t * Wire.t) list (* group's slots minus self *)
  ; slots_all : (Wire.t * Wire.t) list (* all response slots *)
  ; raw : Wire.t
  }

let empty_one_resource =
  { basis_rev = 0; res_key = Wire.Nil; watch_keys = []; watch_all = false
  ; value = Wire.Nil; slots = []; slots_all = []; raw = Wire.Nil }

let default_runtime : Render_resource.runtime = { repo = None }

let render_one_resource ?(runtime = default_runtime) db (resource_key : Wire.t)
    : one_resource =
  let request =
    Wire.Map
      [ kw "blocks", Wire.Array []
      ; kw "children", Wire.Array []
      ; kw "resources", Wire.Array [ resource_key ] ]
  in
  let response = Render_resource.render_snapshots db request runtime in
  let slot_key = wkey [ kw "resource"; resource_key ] in
  let slots_w =
    match Wire.get "slots" response with
    | Some (Wire.Map kvs) -> kvs
    | _ -> []
  in
  (match slot_get slot_key (Wire.Map slots_w) with
   | None -> Alcotest.fail "expected [:resource k] slot for resource key"
   | Some slot ->
       let watch =
         match Wire.get "watch" slot with Some w -> w | None -> Wire.Nil
       in
       let watch_keys =
         match Wire.get "keys" watch with
         | Some w -> Wire.as_seq w
         | None -> []
       in
       let watch_all = Wire.get "all?" watch = Some (Wire.Bool true) in
       let value =
         match Wire.get "value" slot with Some v -> v | None -> Wire.Nil
       in
       let group_keys =
         match get_in response [ kw "groups"; slot_key ] with
         | Some g -> Wire.as_seq g
         | None -> []
       in
       let slots =
         List.filter_map
           (fun gk ->
             if wire_eq gk slot_key then None
             else
               match slot_get gk (Wire.Map slots_w) with
               | Some v -> Some (gk, v)
               | None -> None)
           group_keys
       in
       let basis_rev =
         match Wire.get "basis-rev" response with
         | Some (Wire.Int n) -> n
         | _ -> -1
       in
       { basis_rev; res_key = resource_key; watch_keys; watch_all; value
       ; slots; slots_all = slots_w; raw = response })

let call_resource ?runtime db resource_key : one_resource =
  try render_one_resource ?runtime db resource_key
  with _ ->
    check "call-resource supported" false;
    empty_one_resource

let call_resource_raw ?runtime db resource_key : one_resource =
  render_one_resource ?runtime db resource_key

(* cljs thrown? — any raised error counts *)
let expect_thrown (name : string) (f : unit -> 'a) : unit =
  check name
    (try
       ignore (f ());
       false
     with _ -> true)

(* cljs thrown-with-msg? — the OCaml failure surface is Dispatcher.Exn_info *)
let expect_exn_msg (name : string) (substr : string) (f : unit -> 'a) : unit =
  check name
    (try
       ignore (f ());
       false
     with
     | Dispatcher.Exn_info (msg, _) -> string_contains msg substr
     | _ -> false)

let is_query_key = function
  | Wire.Array (Wire.Keyword "query" :: _) -> true
  | _ -> false

let assert_resource_envelope db resource_key expected_watch expected_value
    (r : one_resource) : unit =
  let graph_key = wkey [ kw "graph" ] in
  let watch_all = List.exists (wire_eq graph_key) expected_watch in
  let expected =
    List.filter (fun k -> not (wire_eq graph_key k)) expected_watch
  in
  let expected =
    if is_query_key resource_key && not watch_all then
      expected
      @ [ wkey [ kw "attr"; kw "logseq.property/hide?" ]
        ; wkey [ kw "attr"; kw "logseq.property/deleted-at" ]
        ; wkey [ kw "attr"; kw "block/parent" ] ]
    else expected
  in
  (match r.raw with
   | Wire.Map kvs ->
       check "envelope response keys"
         (wire_list_eq (List.map fst kvs)
            [ kw "basis-rev"; kw "slots"; kw "groups" ])
   | _ -> check "envelope response keys" false);
  check "envelope basis-rev" (r.basis_rev = db.max_tx);
  check "envelope key" (wire_eq r.res_key resource_key);
  check "envelope watch-keys" (wire_list_eq r.watch_keys expected);
  check "envelope watch-all" (r.watch_all = watch_all);
  check "envelope value" (wire_eq expected_value r.value);
  check "envelope slots map"
    (List.for_all (fun (k, _) -> wire_mem k (Wire.Map r.slots_all)) r.slots);
  check "envelope transit"
    (try
       wire_eq
         (Transit_codec.of_string (Transit_codec.to_string r.raw))
         r.raw
     with _ -> false)

let canonical_ref_keys =
  [ "db/id"; "db/ident"; "block/uuid"; "block/title"; "block/name"
  ; "block/tags"; "logseq.property/value"; "logseq.property/icon" ]

let canonical_tag_keys = [ "db/id"; "db/ident"; "block/uuid" ]

let canonical_block_temp_keys =
  [ "block.temp/positioned-properties"; "block.temp/refs-count"
  ; "block.temp/order-list-index"; "block.temp/has-children?" ]

let assert_canonical_block (block : Wire.t) : unit =
  match block with
  | Wire.Map kvs ->
      check "canonical block uuid"
        (match slot_get (kw "block/uuid") block with
         | Some (Wire.Uuid _) -> true
         | _ -> false);
      check "canonical block tx-id"
        (match slot_get (kw "block/tx-id") block with
         | Some (Wire.Int _) | Some (Wire.Int64 _) -> true
         | _ -> false);
      check "canonical no children"
        (slot_get (kw "block/children") block = None);
      check "canonical no properties"
        (slot_get (kw "block/properties") block = None);
      check "canonical no properties-text-values"
        (slot_get (kw "block/properties-text-values") block = None);
      check "canonical block.temp keys"
        (List.for_all
           (fun (k, _) ->
             match k with
             | Wire.Keyword s
               when String.length s >= 10
                    && String.sub s 0 10 = "block.temp" ->
                 List.mem s canonical_block_temp_keys
             | _ -> true)
           kvs);
      let refs =
        List.filter_map Fun.id
          [ slot_get (kw "block/page") block; slot_get (kw "block/parent") block ]
        @ (match slot_get (kw "block/refs") block with
           | Some w -> Wire.as_seq w
           | None -> [])
        @ (match slot_get (kw "block/tags") block with
           | Some w -> Wire.as_seq w
           | None -> [])
      in
      List.iter
        (fun reference ->
          match reference with
          | Wire.Map rkvs ->
              check "canonical ref keys"
                (List.for_all
                   (fun (k, _) ->
                     match k with
                     | Wire.Keyword s -> List.mem s canonical_ref_keys
                     | _ -> false)
                   rkvs);
              (match slot_get (kw "block/tags") reference with
               | Some tags ->
                   List.iter
                     (fun t ->
                       match t with
                       | Wire.Map tkvs ->
                           check "canonical tag keys"
                             (List.for_all
                                (fun (k, _) ->
                                  match k with
                                  | Wire.Keyword s ->
                                      List.mem s canonical_tag_keys
                                  | _ -> false)
                                tkvs)
                       | _ -> ())
                     (Wire.as_seq tags)
               | None -> ())
          | _ -> ())
        refs
  | _ -> check "canonical block is map" false

let default_display_context : Wire.t =
  Wire.Map
    [ kw "gallery-view?", Wire.Bool false
    ; kw "page-title?", Wire.Bool false
    ; kw "sidebar-properties?", Wire.Bool false
    ; kw "tag-dialog?", Wire.Bool false
    ; kw "publishing?", Wire.Bool false
    ; kw "state-hide-empty-properties?", Wire.Bool false
    ; kw "show-empty-and-hidden-properties?", Wire.Bool false ]

let add_view ?owner ?(attrs = "") (conn : conn) (feature_type : string) :
    string =
  let view_uuid = next_uuid () in
  let view_for =
    match owner with
    | Some o -> Printf.sprintf ":logseq.property/view-for %s" (uref o)
    | None -> ""
  in
  tx conn
    (Printf.sprintf
       "[{:block/uuid %s :block/tx-id 20 :block/title \"%s view\" \
        :logseq.property.view/feature-type :%s \
        :logseq.property.view/type :logseq.property.view/type.table %s %s}]"
       (quid view_uuid) feature_type feature_type view_for attrs);
  view_uuid

let entity_id db (block_uuid : string) : int =
  match Datascript.entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
  | Some e -> e.id
  | None -> Alcotest.fail ("missing entity for uuid " ^ block_uuid)

let select_keys_wire (e : entity) (attrs : string list) : Wire.t =
  Wire.Map
    (List.filter_map
       (fun a ->
         if a = "db/id" then Some (kw a, Wire.Int e.id)
         else
           match Ldb.value e a with
           | Some v -> Some (kw a, Ds_wire.transit_of_value v)
           | None -> None)
       attrs)

(* cljs (query-handler/custom-query-watch-dependencies (second resource-key)) *)
let datalog_query_watch_keys (resource_key : Wire.t) : Wire.t list =
  match resource_key with
  | Wire.Array [ _; Wire.Map kvs ] -> (
      let forms k =
        match List.assoc_opt (kw k) kvs with
        | Some (Wire.Array xs) -> List.map Render_resource.form_of_wire xs
        | _ -> []
      in
      let attrs, task_attrs, tasks, opaque =
        Render_resource.custom_query_watch_dependencies
          (forms "query") (forms "rules")
      in
      let keys =
        List.map (fun a -> wkey [ kw "attr"; kw a ]) attrs
        @ List.map (fun a -> wkey [ kw "task-attr"; kw a ]) task_attrs
        @ if tasks then [ wkey [ kw "tasks" ] ] else []
      in
      if opaque || keys = [] then [ wkey [ kw "graph" ] ] else keys)
  | _ -> [ wkey [ kw "graph" ] ]

let wkey_has (keys : Wire.t list) (k : Wire.t) = List.exists (wire_eq k) keys

(* ==================== tests ==================== *)

(* task-query-uses-semantic-watch-key-test *)
let test_task_query_uses_semantic_watch_key () =
  let query_spec =
    wire_of_edn
      "{:kind :datalog
        :query [:find (pull ?b [*])
                :in $ ?start ?today
                :where
                (task ?b #{\"Doing\"})
                [?b :block/page ?page]
                [?page :block/journal-day ?day]
                [(>= ?day ?start)]
                [(<= ?day ?today)]]
        :inputs [20260718 :today]}"
  in
  let resource_key = wkey [ kw "query"; query_spec ] in
  let watch_keys = datalog_query_watch_keys resource_key in
  check "watch [:tasks]" (wkey_has watch_keys (wkey [ kw "tasks" ]));
  check "watch [:task-attr :block/page]"
    (wkey_has watch_keys (wkey [ kw "task-attr"; kw "block/page" ]));
  check "watch no [:attr :block/page]"
    (not (wkey_has watch_keys (wkey [ kw "attr"; kw "block/page" ])));
  check "watch [:attr :block/journal-day]"
    (wkey_has watch_keys (wkey [ kw "attr"; kw "block/journal-day" ]));
  check "watch no [:graph]" (not (wkey_has watch_keys (wkey [ kw "graph" ])));
  check "watch no [:attr :block/title]"
    (not (wkey_has watch_keys (wkey [ kw "attr"; kw "block/title" ])))

(* simple-dsl-query-resource-uses-attribute-watch-keys-test — the cljs test
   redefs execute-query but only asserts watch keys; the real DSL runs. *)
let test_simple_dsl_query_resource_uses_attribute_watch_keys () =
  let conn, u = render_resource_fixture () in
  ignore u;
  let db = db_of conn in
  let resource_key =
    wire_of_edn "[:query {:kind :dsl :query \"(page Page)\"}]"
  in
  let r = call_resource db resource_key in
  check "dsl watch no graph" (not (wkey_has r.watch_keys (wkey [ kw "graph" ])));
  check "dsl watch block/name"
    (wkey_has r.watch_keys (wkey [ kw "attr"; kw "block/name" ]));
  check "dsl watch block/title"
    (wkey_has r.watch_keys (wkey [ kw "attr"; kw "block/title" ]))

(* property-choices-resource-tracks-choice-entity-updates-test *)
let test_property_choices_resource_tracks_choice_entity_updates () =
  let conn = seeded_conn () in
  let property_uuid = next_uuid () in
  let choice_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -1 :block/uuid %s :block/tx-id 1 :block/title \"Priority\" :db/ident :user.property/priority :block/tags :logseq.class/Property}
         {:block/uuid %s :block/tx-id 1 :block/title \"High\" :block/closed-value-property -1 :block/order \"a0\"}]"
       (quid property_uuid) (quid choice_uuid));
  let db = db_of conn in
  let resource_key = wkey [ kw "property-choices"; wu property_uuid ] in
  let r = call_resource db resource_key in
  check "property-choices watch-keys"
    (wire_list_eq r.watch_keys
       [ wkey [ kw "entity"; wu property_uuid ]
       ; wkey [ kw "entity"; wu choice_uuid ]
       ; wkey [ kw "property-membership"; kw "block/closed-value-property" ] ]);
  check "property-choices value"
    (match r.value with
     | Wire.Array [ Wire.Map _ as choice ] ->
         slot_get (kw "block/title") choice = Some (Wire.String "High")
     | _ -> false)

(* recycle-roots-resource-returns-newest-first-canonical-blocks-test *)
let test_recycle_roots_resource_returns_newest_first_canonical_blocks () =
  let conn = seeded_conn () in
  let older_uuid = next_uuid () in
  let newer_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:block/uuid %s :block/tx-id 1 :block/title \"Older recycled page\" :block/name \"older recycled page\" :logseq.property/deleted-at 1000}
         {:block/uuid %s :block/tx-id 1 :block/title \"Newer recycled block\" :logseq.property/deleted-at 2000}]"
       (quid older_uuid) (quid newer_uuid));
  let db = db_of conn in
  let r = call_resource db (wkey [ kw "recycle-roots" ]) in
  check "recycle-roots watch"
    (wire_list_eq r.watch_keys [ wkey [ kw "recycle-roots" ] ]);
  check "recycle-roots order"
    (match r.value with
     | Wire.Array [ Wire.Map _ as a; Wire.Map _ as b ] ->
         slot_get (kw "block/uuid") a = Some (wu newer_uuid)
         && slot_get (kw "block/uuid") b = Some (wu older_uuid)
     | _ -> false);
  (match r.value with
   | Wire.Array items | Wire.List items ->
       List.iter assert_canonical_block items
   | _ -> check "recycle-roots canonical blocks" false)

(* render-snapshots-validates-bounded-unique-requests-test *)
let test_render_snapshots_validates_bounded_unique_requests () =
  let conn, _ = render_resource_fixture () in
  let db = db_of conn in
  let mk_request resources =
    Wire.Map
      [ kw "blocks", Wire.Array []
      ; kw "children", Wire.Array []
      ; kw "resources", resources ]
  in
  let resources =
    List.init 25 (fun i ->
        wkey [ kw "page-identity"; Wire.String (Printf.sprintf "missing page %d" i) ])
  in
  let ok = Render_resource.render_snapshots db (mk_request (Wire.Array resources)) default_runtime in
  check "25 groups"
    (match Wire.get "groups" ok with
     | Some (Wire.Map gkvs) -> List.length gkvs = 25
     | _ -> false);
  let resource_key = wkey [ kw "page-identity"; Wire.String "page identity" ] in
  List.iter
    (fun (label, invalid_request) ->
      expect_thrown
        ("invalid request " ^ label)
        (fun () ->
          ignore
            (Render_resource.render_snapshots db invalid_request default_runtime)))
    [ "nil", mk_request Wire.Nil
    ; "empty", mk_request (Wire.Array [])
    ; "dup", mk_request (Wire.Array [ resource_key; resource_key ])
    ; ( "over-limit"
      , mk_request (Wire.Array (resources @ [ resource_key ])) ) ]

(* legacy-render-read-thread-apis-are-removed-test *)
let test_legacy_render_read_thread_apis_are_removed () =
  List.iter
    (fun api_key ->
      check
        ("legacy api absent " ^ api_key)
        (not (Dispatcher.registered api_key)))
    [ "thread-api/get-render-resource"; "thread-api/get-render-resources"
    ; "thread-api/get-canonical-blocks"; "thread-api/get-direct-children" ]

(* worker-exposes-one-normalized-render-snapshots-api-test *)
let test_worker_exposes_one_normalized_render_snapshots_api () =
  if not (Dispatcher.registered "thread-api/get-render-snapshots") then
    check "get-render-snapshots registered" false
  else (
    let conn, u = render_resource_fixture () in
    let db = db_of conn in
    let page_key = wkey [ kw "page-identity"; Wire.String "page identity" ] in
    let journals_key = wkey [ kw "journals" ] in
    let request =
      Wire.Map
        [ kw "blocks", Wire.Array [ wu (u "reference-block") ]
        ; kw "children", Wire.Array [ wu (u "journal-a") ]
        ; kw "resources", Wire.Array [ page_key; journals_key ] ]
    in
    register_conn conn;
    let response =
      await
        (Dispatcher.invoke "thread-api/get-render-snapshots"
           [ Wire.String test_repo; request ])
    in
    (match Wire.get "basis-rev" response with
     | Some (Wire.Int n) -> check "basis-rev" (n = db.max_tx)
     | _ -> check "basis-rev" false);
    let slots =
      match Wire.get "slots" response with
      | Some (Wire.Map kvs) -> Wire.Map kvs
      | _ -> Wire.Nil
    in
    let groups =
      match Wire.get "groups" response with
      | Some (Wire.Map kvs) -> kvs
      | _ -> []
    in
    check "group keys"
      (wire_list_eq (List.map fst groups)
         [ wkey [ kw "block"; wu (u "reference-block") ]
         ; wkey [ kw "children"; wu (u "journal-a") ]
         ; wkey [ kw "resource"; page_key ]
         ; wkey [ kw "resource"; journals_key ] ]);
    let block_slot = wkey [ kw "block"; wu (u "reference-block") ] in
    (match get_in slots [ block_slot; kw "value"; kw "block/uuid" ] with
     | Some (Wire.Uuid x) -> check "block slot uuid" (x = u "reference-block")
     | _ -> check "block slot uuid" false);
    (match slot_get block_slot slots with
     | Some (Wire.Map kvs) ->
         check "block slot only :value"
           (wire_list_eq (List.map fst kvs) [ kw "value" ])
     | _ -> check "block slot only :value" false);
    check "unrequested refs target absent"
      (not (wire_mem (wkey [ kw "block"; wu (u "resource-block") ]) slots));
    (match slot_get block_slot (Wire.Map groups) with
     | Some g ->
         check "block group self"
           (wire_list_eq (Wire.as_seq g)
              [ block_slot ])
     | None -> check "block group self" false);
    (match
       get_in slots [ wkey [ kw "children"; wu (u "journal-a") ]; kw "items" ]
     with
     | Some (Wire.Array _) | Some (Wire.List _) ->
         check "children items vector" true
     | _ -> check "children items vector" false);
    (match
       get_in slots [ wkey [ kw "resource"; page_key ]; kw "watch" ]
     with
     | Some watch ->
         let keys =
           match Wire.get "keys" watch with
           | Some w -> Wire.as_seq w
           | None -> []
         in
         check "page-identity watch keys"
           (wire_list_eq keys
              [ wkey [ kw "page-lookup"; Wire.String "page identity" ] ]);
         check "page-identity watch all? false"
           (Wire.get "all?" watch = Some (Wire.Bool false))
     | None -> check "page-identity watch" false);
    (match
       slot_get (wkey [ kw "resource"; journals_key ]) (Wire.Map groups)
     with
     | Some g ->
         check "journals group"
           (wire_list_eq (Wire.as_seq g)
              [ wkey [ kw "resource"; journals_key ] ])
     | None -> check "journals group" false);
    check "response transit"
      (try
         wire_eq
           (Transit_codec.of_string (Transit_codec.to_string response))
           response
       with _ -> false))

(* block-snapshot-dependencies-do-not-depend-on-batch-order-test
   — subs-loader patch assertions dropped (frontend-side, not ported). *)
let test_block_snapshot_dependencies_do_not_depend_on_batch_order () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let request blocks =
    Render_resource.render_snapshots db
      (Wire.Map
         [ kw "blocks", Wire.Array (List.map wu blocks)
         ; kw "children", Wire.Array []
         ; kw "resources", Wire.Array [] ])
      default_runtime
  in
  let reference_dependencies blocks =
    get_in (request blocks)
      [ kw "groups"; wkey [ kw "block"; wu (u "reference-block") ] ]
  in
  check "batch-order stable"
    (wire_eq_opt
       (reference_dependencies [ u "reference-block"; u "resource-block" ])
       (reference_dependencies [ u "resource-block"; u "reference-block" ]));
  (match
     reference_dependencies [ u "resource-block"; u "reference-block" ]
   with
   | Some g ->
       check "root group owns only itself"
         (wire_list_eq (Wire.as_seq g)
            [ wkey [ kw "block"; wu (u "reference-block") ] ])
   | None -> check "root group owns only itself" false)

(* render-snapshots-thread-api-fails-fast-without-a-database-test *)
let test_render_snapshots_thread_api_fails_fast_without_a_database () =
  if not (Dispatcher.registered "thread-api/get-render-snapshots") then
    check "get-render-snapshots registered" false
  else
    let request =
      Wire.Map
        [ kw "blocks", Wire.Array []
        ; kw "children", Wire.Array []
        ; kw "resources", Wire.Array [ wkey [ kw "journals" ] ] ]
    in
    check "missing db error"
      (try
         ignore
           (await
              (Dispatcher.invoke "thread-api/get-render-snapshots"
                 [ Wire.String "render-resource-missing-repo"; request ]));
         false
       with
       | Dispatcher.Exn_info (msg, _) -> msg = "Missing renderer snapshot database"
       | _ -> false)

(* page-identity-resource-resolves-only-the-page-uuid-test *)
let test_page_identity_resource_resolves_only_the_page_uuid () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key = wkey [ kw "page-identity"; Wire.String "page identity" ] in
  assert_resource_envelope db resource_key
    [ wkey [ kw "page-lookup"; Wire.String "page identity" ] ]
    (wu (u "page"))
    (call_resource db resource_key)

(* sidebar-page-resources-track-favorites-status-and-recent-page-content-test *)
let test_sidebar_page_resources () =
  let conn = seeded_conn () in
  let favorite_page =
    match Ldb.get_page (db_of conn) (String "$$$favorites") with
    | Some p -> p
    | None ->
        let fav_uuid = next_uuid () in
        tx conn
          (Printf.sprintf
             "[{:block/uuid %s :block/tx-id 1 :block/title \"$$$favorites\" :block/name \"$$$favorites\"}]"
             (quid fav_uuid));
        (match Ldb.get_page (db_of conn) (String "$$$favorites") with
         | Some p -> p
         | None -> Alcotest.fail "missing favorites page")
  in
  let favorite_page_id = favorite_page.id in
  let favorite_page_uuid =
    match Ldb.value favorite_page "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> Alcotest.fail "favorites page uuid"
  in
  let first_page_uuid = next_uuid () in
  let second_page_uuid = next_uuid () in
  let favorite_block_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -1 :block/uuid %s :block/tx-id 2 :block/title \"First\" :block/name \"first\" :block/tags :logseq.class/Page}
         {:db/id -2 :block/uuid %s :block/tx-id 2 :block/title \"Second\" :block/name \"second\" :block/tags :logseq.class/Page}
         {:block/uuid %s :block/tx-id 2 :block/title \"\" :block/link -1 :block/page %d :block/parent %d :block/order \"a0\"}]"
       (quid first_page_uuid) (quid second_page_uuid)
       (quid favorite_block_uuid) favorite_page_id favorite_page_id);
  let db = db_of conn in
  let first_page_id = entity_id db first_page_uuid in
  let second_page_id = entity_id db second_page_uuid in
  let page_tag =
    match Datascript.entity db (Ident "logseq.class/Page") with
    | Some e -> select_keys_wire e [ "db/id"; "db/ident"; "logseq.property/icon" ]
    | None -> Wire.Nil
  in
  let page_summary id uuid_s title name =
    Wire.Map
      [ kw "db/id", Wire.Int id
      ; kw "block/uuid", wu uuid_s
      ; kw "block/title", Wire.String title
      ; kw "block/raw-title", Wire.String title
      ; kw "block/name", Wire.String name
      ; kw "block/tags", Wire.Array [ page_tag ] ]
  in
  let favorites_response =
    call_resource db (wkey [ kw "favorites" ])
  in
  assert_resource_envelope db
    (wkey [ kw "favorites" ])
    [ wkey [ kw "children"; wu favorite_page_uuid ]
    ; wkey [ kw "attr"; kw "block/link" ]
    ; wkey [ kw "entity"; wu first_page_uuid ] ]
    (Wire.Array [ page_summary first_page_id first_page_uuid "First" "first" ])
    favorites_response;
  let status_response =
    call_resource db (wkey [ kw "favorite-status"; wu first_page_uuid ])
  in
  assert_resource_envelope db
    (wkey [ kw "favorite-status"; wu first_page_uuid ])
    [ wkey [ kw "children"; wu favorite_page_uuid ]
    ; wkey [ kw "attr"; kw "block/link" ] ]
    (Wire.Bool true) status_response;
  let recent_response =
    call_resource db
      (wkey
         [ kw "recent-pages"
         ; Wire.Array [ Wire.Int second_page_id; Wire.Int first_page_id ] ])
  in
  assert_resource_envelope db
    (wkey
       [ kw "recent-pages"
       ; Wire.Array [ Wire.Int second_page_id; Wire.Int first_page_id ] ])
    [ wkey [ kw "entity"; wu first_page_uuid ]
    ; wkey [ kw "entity"; wu second_page_uuid ] ]
    (Wire.Array
       [ page_summary second_page_id second_page_uuid "Second" "second"
       ; page_summary first_page_id first_page_uuid "First" "first" ])
    recent_response

(* missing-page-identity-keeps-a-creation-watch-key-test *)
let test_missing_page_identity_keeps_a_creation_watch_key () =
  let conn, _ = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "page-identity"; Wire.String "missing page" ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "page-lookup"; Wire.String "missing page" ] ]
    Wire.Nil (call_resource db resource_key)

(* page-preview-source-resource-resolves-aliases-to-one-uuid-test *)
let test_page_preview_source_resolves_aliases () =
  let conn, u = render_resource_fixture () in
  let source_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -100 :block/uuid %s :block/tx-id 21 :block/title \"Alias source\" :block/name \"alias source\" :block/tags :logseq.class/Page :block/alias [:block/uuid %s]}]"
       (quid source_uuid) (quid (u "page")));
  let db = db_of conn in
  let resource_key = wkey [ kw "page-preview-source"; wu (u "page") ] in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "page") ]
    ; wkey [ kw "attr"; kw "block/alias" ] ]
    (wu source_uuid) (call_resource db resource_key)

(* page-preview-source-resource-keeps-the-page-without-an-alias-test *)
let test_page_preview_source_keeps_page_without_alias () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key = wkey [ kw "page-preview-source"; wu (u "journal-a") ] in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "journal-a") ]
    ; wkey [ kw "attr"; kw "block/alias" ] ]
    (wu (u "journal-a")) (call_resource db resource_key)

(* breadcrumbs: (attr * value) list list -> wire *)
let crumbs_wire crumbs : Wire.t =
  Wire.Array
    (List.map
       (fun crumb ->
         Wire.Map
           (List.map (fun (a, v) -> (kw a, Ds_wire.transit_of_value v)) crumb))
       crumbs)

let crumb_title (crumb : (attr * value) list) : string option =
  match List.assoc_opt "block/title" crumb with
  | Some (String t) -> Some t
  | _ -> None

(* block-breadcrumb-resource-returns-only-ordered-uuids-test *)
let test_block_breadcrumb_resource_returns_only_ordered_uuids () =
  let conn, u = render_resource_fixture () in
  let parent_a = next_uuid () in
  let parent_b = next_uuid () in
  let target = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -101 :block/uuid %s :block/tx-id 21 :block/title \"Parent A\" :block/page %s :block/parent %s :block/order \"x0\"}
         {:db/id -102 :block/uuid %s :block/tx-id 21 :block/title \"Parent B\" :block/page %s :block/parent -101 :block/order \"x1\"}
         {:db/id -103 :block/uuid %s :block/tx-id 21 :block/title \"Target\" :block/page %s :block/parent -102 :block/order \"x2\" :logseq.property/created-from-property %s}]"
       (quid parent_a) (uref (u "page")) (uref (u "page"))
       (quid parent_b) (uref (u "page"))
       (quid target) (uref (u "page")) (uref (u "positioned-property")));
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-breadcrumb"; wu target; Wire.Int 16 ]
  in
  let target_block =
    Option.get
      (Datascript.entity db (Lookup_ref ("block/uuid", Uuid target)))
  in
  let ancestors =
    Block_breadcrumb.block_breadcrumb ~depth:16 db
      (Entity_view.of_entity target_block)
  in
  check "breadcrumb titles"
    (List.filter_map crumb_title (list_take 3 ancestors)
     = [ "Page Identity"; "Parent A"; "Parent B" ]);
  let expected =
    Wire.Map
      [ kw "target-uuid", wu target
      ; ( kw "ancestor-uuids"
        , Wire.Array
            [ wu (u "page"); wu parent_a; wu parent_b
            ; wu (u "positioned-property") ] )
      ; kw "ancestors", crumbs_wire ancestors
      ; kw "ref-titles", Wire.Map [] ]
  in
  let r = call_resource db resource_key in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu target ]
    ; wkey [ kw "entity"; wu (u "page") ]
    ; wkey [ kw "entity"; wu parent_a ]
    ; wkey [ kw "entity"; wu parent_b ]
    ; wkey [ kw "entity"; wu (u "positioned-property") ] ]
    expected r;
  (match slot_get (kw "ancestor-uuids") r.value with
   | Some w ->
       check "ancestor-uuids all uuid"
         (let xs = Wire.as_seq w in
          xs <> []
          && List.for_all (function Wire.Uuid _ -> true | _ -> false) xs)
   | None -> check "ancestor-uuids all uuid" false);
  (match slot_get (kw "ancestors") r.value with
   | Some (Wire.Array xs) ->
       check "ancestor titles"
         (List.filter_map
            (fun m -> slot_get (kw "block/title") m)
            xs
          |> List.map (function Wire.String s -> s | _ -> "")
          = [ "Page Identity"; "Parent A"; "Parent B"; "Positioned" ])
   | _ -> check "ancestor titles" false)

(* block-breadcrumb-resource-honors-the-requested-depth-test *)
let test_block_breadcrumb_resource_honors_requested_depth () =
  let conn, u = render_resource_fixture () in
  let parent_a = next_uuid () in
  let parent_b = next_uuid () in
  let target = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -104 :block/uuid %s :block/tx-id 21 :block/title \"Parent A\" :block/page %s :block/parent %s :block/order \"y0\"}
         {:db/id -105 :block/uuid %s :block/tx-id 21 :block/title \"Parent B\" :block/page %s :block/parent -104 :block/order \"y1\"}
         {:db/id -106 :block/uuid %s :block/tx-id 21 :block/title \"Target\" :block/page %s :block/parent -105 :block/order \"y2\"}]"
       (quid parent_a) (uref (u "page")) (uref (u "page"))
       (quid parent_b) (uref (u "page"))
       (quid target) (uref (u "page")));
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-breadcrumb"; wu target; Wire.Int 1 ]
  in
  let target_block =
    Option.get (Datascript.entity db (Lookup_ref ("block/uuid", Uuid target)))
  in
  let ancestors =
    Block_breadcrumb.block_breadcrumb ~depth:1 db
      (Entity_view.of_entity target_block)
  in
  let expected =
    Wire.Map
      [ kw "target-uuid", wu target
      ; kw "ancestor-uuids", Wire.Array [ wu (u "page"); wu parent_b ]
      ; kw "ancestors", crumbs_wire ancestors
      ; kw "ref-titles", Wire.Map [] ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu target ]
    ; wkey [ kw "entity"; wu (u "page") ]
    ; wkey [ kw "entity"; wu parent_b ] ]
    expected (call_resource db resource_key)

(* block-breadcrumb-resource-includes-ref-titles-and-exact-watch-keys-test *)
let test_block_breadcrumb_resource_includes_ref_titles () =
  let conn, u = render_resource_fixture () in
  let ref_uuid = next_uuid () in
  let parent_uuid = next_uuid () in
  let target_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -107 :block/uuid %s :block/tx-id 21 :block/title \"Referenced title\"}
         {:db/id -108 :block/uuid %s :block/tx-id 21 :block/title \"See [[%s]]\" :block/page %s :block/parent %s :block/order \"z0\" :block/refs -107}
         {:db/id -109 :block/uuid %s :block/tx-id 21 :block/title \"Target\" :block/page %s :block/parent -108 :block/order \"z1\"}]"
       (quid ref_uuid) (quid parent_uuid) ref_uuid (uref (u "page"))
       (uref (u "page")) (quid target_uuid) (uref (u "page")));
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-breadcrumb"; wu target_uuid; Wire.Int 1 ]
  in
  let target_block =
    Option.get
      (Datascript.entity db (Lookup_ref ("block/uuid", Uuid target_uuid)))
  in
  let ancestors =
    Block_breadcrumb.block_breadcrumb ~depth:1 db
      (Entity_view.of_entity target_block)
  in
  let expected =
    Wire.Map
      [ kw "target-uuid", wu target_uuid
      ; kw "ancestor-uuids", Wire.Array [ wu (u "page"); wu parent_uuid ]
      ; kw "ancestors", crumbs_wire ancestors
      ; kw "ref-titles", Wire.Map [ wu ref_uuid, Wire.String "Referenced title" ] ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu target_uuid ]
    ; wkey [ kw "entity"; wu (u "page") ]
    ; wkey [ kw "entity"; wu parent_uuid ]
    ; wkey [ kw "entity"; wu ref_uuid ] ]
    expected (call_resource db resource_key);
  tx conn
    (Printf.sprintf
       "[{:db/id [:block/uuid %s] :block/tx-id 22 :block/title \"Updated title\"}]"
       (quid ref_uuid));
  (match
     get_in
       (call_resource db resource_key).value
       [ kw "ref-titles"; wu ref_uuid ]
   with
   | Some (Wire.String "Updated title") -> check "updated ref title" true
   | _ -> check "updated ref title" false)

(* block-breadcrumb-resource-returns-empty-payload-for-missing-blocks-test *)
let test_block_breadcrumb_resource_returns_empty_payload_for_missing () =
  let conn, _ = render_resource_fixture () in
  let db = db_of conn in
  let missing = next_uuid () in
  let resource_key =
    wkey [ kw "block-breadcrumb"; wu missing; Wire.Int 16 ]
  in
  let expected =
    Wire.Map
      [ kw "target-uuid", wu missing
      ; kw "ancestor-uuids", Wire.Array []
      ; kw "ancestors", Wire.Array []
      ; kw "ref-titles", Wire.Map [] ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu missing ] ]
    expected (call_resource db resource_key)

(* block-breadcrumb-keeps-root-first-order-when-zoomed-into-nested-page-block-test *)
let test_block_breadcrumb_keeps_root_first_order () =
  let conn = seeded_conn () in
  let library =
    match Ldb.get_built_in_page (db_of conn) "Library" with
    | Some e -> e
    | None -> Alcotest.fail "Built-in Library page is required"
  in
  let library_uuid =
    match Ldb.value library "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> Alcotest.fail "library uuid"
  in
  let some_page = next_uuid () in
  let test_a = next_uuid () in
  let test_b = next_uuid () in
  let test_c = next_uuid () in
  let inner = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -1 :block/uuid %s :block/tx-id 21 :block/title \"some page\" :block/name \"some page\" :block/tags :logseq.class/Page :block/parent %d}
         {:db/id -2 :block/uuid %s :block/tx-id 21 :block/title \"test a\" :block/name \"test a\" :block/tags :logseq.class/Page :block/parent -1}
         {:db/id -3 :block/uuid %s :block/tx-id 21 :block/title \"test b\" :block/name \"test b\" :block/tags :logseq.class/Page :block/parent -2}
         {:db/id -4 :block/uuid %s :block/tx-id 21 :block/title \"test c\" :block/page -3 :block/parent -3 :block/order \"a0\"}
         {:db/id -5 :block/uuid %s :block/tx-id 21 :block/title \"inner\" :block/page -3 :block/parent -4 :block/order \"a1\"}]"
       (quid some_page) library.id (quid test_a) (quid test_b)
       (quid test_c) (quid inner));
  let db = db_of conn in
  let ent u = Option.get (Datascript.entity db (Lookup_ref ("block/uuid", Uuid u))) in
  let page_ancestors =
    Block_breadcrumb.block_breadcrumb db (Entity_view.of_entity (ent test_b))
  in
  let zoomed_ancestors =
    Block_breadcrumb.block_breadcrumb db (Entity_view.of_entity (ent test_c))
  in
  let depth_limited =
    Block_breadcrumb.block_breadcrumb ~depth:1 db
      (Entity_view.of_entity (ent inner))
  in
  check "page ancestors root-first"
    (List.filter_map crumb_title page_ancestors
     = [ "Library"; "some page"; "test a" ]);
  check "zoomed ancestors root-first"
    (List.filter_map crumb_title zoomed_ancestors
     = [ "Library"; "some page"; "test a"; "test b" ]);
  check "truncated prepends page"
    (List.filter_map crumb_title depth_limited = [ "test b"; "test c" ]);
  let resource_key =
    wkey [ kw "block-breadcrumb"; wu test_c; Wire.Int 16 ]
  in
  let expected =
    Wire.Map
      [ kw "target-uuid", wu test_c
      ; ( kw "ancestor-uuids"
        , Wire.Array [ wu library_uuid; wu some_page; wu test_a; wu test_b ] )
      ; kw "ancestors", crumbs_wire zoomed_ancestors
      ; kw "ref-titles", Wire.Map [] ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu test_c ]
    ; wkey [ kw "entity"; wu library_uuid ]
    ; wkey [ kw "entity"; wu some_page ]
    ; wkey [ kw "entity"; wu test_a ]
    ; wkey [ kw "entity"; wu test_b ] ]
    expected (call_resource db resource_key)

(* journals-resource-returns-only-ordered-uuids-test *)
let test_journals_resource_returns_only_ordered_uuids () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let r = call_resource db (wkey [ kw "journals" ]) in
  check "journals value"
    (wire_eq r.value (Wire.Array [ wu (u "journal-b"); wu (u "journal-a") ]));
  let no_slot k = not (wire_mem k (Wire.Map r.slots_all)) in
  check "no block slot journal-b"
    (no_slot (wkey [ kw "block"; wu (u "journal-b") ]));
  check "no block slot journal-a"
    (no_slot (wkey [ kw "block"; wu (u "journal-a") ]));
  check "no children slot journal-b"
    (no_slot (wkey [ kw "children"; wu (u "journal-b") ]));
  check "no children slot journal-a"
    (no_slot (wkey [ kw "children"; wu (u "journal-a") ]));
  check "no block slot journal-child-a"
    (no_slot (wkey [ kw "block"; wu (u "journal-child-a") ]));
  check "no block slot journal-grandchild"
    (no_slot (wkey [ kw "block"; wu (u "journal-grandchild") ]));
  check "journals watch"
    (wire_list_eq r.watch_keys [ wkey [ kw "journals" ] ]);
  check "journals transit"
    (try
       wire_eq (Transit_codec.of_string (Transit_codec.to_string r.raw)) r.raw
     with _ -> false)

(* journals-resource-does-not-prewarm-roots-test *)
let test_journals_resource_does_not_prewarm_roots () =
  let conn = seeded_conn () in
  let journals =
    List.init 60 (fun index ->
        Printf.sprintf
          "{:block/uuid %s :block/tx-id 1 :block/title \"Journal %d\" :block/name \"journal %d\" :block/journal-day %d :block/tags :logseq.class/Journal}"
          (quid (next_uuid ())) index index
          (20200101 + (100 * (index / 28)) + (index mod 28)))
  in
  tx conn ("[" ^ String.concat "\n" journals ^ "]");
  let db = db_of conn in
  let r = call_resource db (wkey [ kw "journals" ]) in
  check "60 journals"
    (match r.value with
     | Wire.Array xs -> List.length xs = 60
     | _ -> false);
  check "no block slots"
    (List.for_all
       (fun (k, _) ->
         match k with Wire.Array (Wire.Keyword "block" :: _) -> false | _ -> true)
       r.slots_all)

(* journal-bundle-resource-is-removed-test *)
let test_journal_bundle_resource_is_removed () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "journal-bundle"; wu (u "journal-a") ]
  in
  expect_exn_msg "journal-bundle removed" "Unknown renderer resource key"
    (fun () -> ignore (call_resource_raw db resource_key))

(* canonical-visible-blocks-keep-properties-without-preloading-breadcrumbs-test *)
let test_canonical_visible_blocks_keep_properties () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let positioned_property_id =
    entity_id db (u "positioned-property")
  in
  tx conn
    (Printf.sprintf "[[:db/add %d :block/tx-id 20]]" positioned_property_id);
  let db = db_of conn in
  let response =
    Render_snapshot.canonical_blocks db [ wu (u "resource-block") ]
  in
  let target =
    get_in response [ kw "blocks"; wu (u "resource-block") ]
  in
  check "no sibling positioned snapshot"
    (get_in response [ kw "blocks"; wu (u "positioned-property") ] = None);
  (match target with
   | Some t -> (
       match get_in t [ kw "block.temp/positioned-properties"; kw "block-right" ] with
       | Some w ->
           let ok =
             match Wire.as_seq w with
             | [ Wire.Map _ as prop ] ->
                 slot_get (kw "block/uuid") prop
                 = Some (wu (u "positioned-property"))
             | _ -> false
           in
           check "positioned chips" ok
       | None -> check "positioned chips" false);
       check "property value on row"
         (slot_get (kw "user.property/positioned") t
          = Some (Wire.String "right"));
       check "no breadcrumb preload"
         (slot_get (kw "block.temp/breadcrumb") t = None)
   | None ->
       check "positioned chips" false;
       check "property value on row" false;
       check "no breadcrumb preload" false);
  check "canonical transit"
    (try
       wire_eq
         (Transit_codec.of_string (Transit_codec.to_string response))
         response
     with _ -> false)

(* block-reactions-resource-returns-final-render-summary-test *)
let test_block_reactions_resource_returns_final_render_summary () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-reactions"; wu (u "reaction-target"); wu (u "creator-a") ]
  in
  let expected =
    Wire.Array
      [ Wire.Map
          [ kw "emoji-id", Wire.String "thumbsup"
          ; kw "count", Wire.Int 2
          ; kw "reacted-by-me?", Wire.Bool true
          ; kw "usernames"
          , Wire.Array [ Wire.String "Alpha"; Wire.String "Zed" ] ] ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "reactions"; wu (u "reaction-target") ]
    ; wkey [ kw "entity"; wu (u "creator-a") ]
    ; wkey [ kw "entity"; wu (u "creator-b") ] ]
    expected (call_resource db resource_key)

(* block-display-properties-resource-returns-only-normalized-entity-identities-test *)
let test_block_display_properties_returns_normalized_identities () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let description_property_uuid =
    match Datascript.entity db (Ident "logseq.property/description") with
    | Some e -> (
        match Ldb.value e "block/uuid" with
        | Some (Uuid x) -> x
        | _ -> Alcotest.fail "description uuid")
    | None -> Alcotest.fail "missing logseq.property/description"
  in
  let class_properties_property_uuid =
    match Datascript.entity db (Ident "logseq.property.class/properties") with
    | Some e -> (
        match Ldb.value e "block/uuid" with
        | Some (Uuid x) -> x
        | _ -> Alcotest.fail "class/properties uuid")
    | None -> Alcotest.fail "missing logseq.property.class/properties"
  in
  let resource_key =
    wkey
      [ kw "block-display-properties"; wu (u "resource-block")
      ; default_display_context ]
  in
  let expected =
    Wire.Map
      [ ( kw "full-properties"
        , Wire.Array
            [ Wire.Map
                [ kw "property-uuid", wu (u "display-property")
                ; kw "property-ident", kw "user.property/display"
                ; kw "value", wu (u "property-value")
                ; ( kw "closed-value-uuids"
                  , Wire.Array [ wu (u "closed-value") ] ) ] ] )
      ; ( kw "hidden-properties"
        , Wire.Array
            [ Wire.Map
                [ kw "property-uuid", wu (u "hidden-property")
                ; kw "property-ident", kw "user.property/hidden"
                ; kw "value", Wire.String "secret" ] ] )
      ; kw "description-property-uuid", wu description_property_uuid
      ; kw "class-properties-property-uuid", wu class_properties_property_uuid ]
  in
  let r = call_resource db resource_key in
  assert_resource_envelope db resource_key
    [ wkey [ kw "display-properties"; wu (u "resource-block") ]
    ; wkey [ kw "class-tree" ]
    ; wkey [ kw "property-config" ]
    ; wkey [ kw "entity"; wu (u "display-property") ]
    ; wkey [ kw "entity"; wu (u "hidden-property") ]
    ; wkey [ kw "entity"; wu (u "property-value") ]
    ; wkey [ kw "entity"; wu (u "closed-value") ]
    ; wkey [ kw "property-membership"; kw "block/closed-value-property" ] ]
    expected r;
  let prop_values k =
    match get_in r.value [ kw k ] with
    | Some w -> List.filter_map (fun m -> slot_get (kw "value") m) (Wire.as_seq w)
    | None -> []
  in
  check "values are uuids"
    (List.for_all (fun v -> match v with Wire.Map _ -> false | _ -> true)
       (prop_values "full-properties" @ prop_values "hidden-properties"))

(* block-display-properties-resource-includes-configured-class-properties-test *)
let test_block_display_properties_includes_configured_class_properties () =
  let conn, u = render_resource_fixture () in
  let class_uuid = next_uuid () in
  let property_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -100 :db/ident :user.property/configured :block/uuid %s :block/tx-id 21 :block/title \"Configured property\" :block/tags :logseq.class/Property :db/valueType :db.type/string :db/cardinality :db.cardinality/one :logseq.property/type :default :logseq.property/ui-position :properties :logseq.property/public? true}
         {:db/id -101 :db/ident :user.class/configured :block/uuid %s :block/tx-id 21 :block/title \"Configured class\" :block/tags :logseq.class/Tag :logseq.property.class/properties -100}
         [:db/add [:block/uuid %s] :block/tags -101]]"
       (quid property_uuid) (quid class_uuid) (quid (u "resource-block")));
  let db = db_of conn in
  let resource_key =
    wkey
      [ kw "block-display-properties"; wu (u "resource-block")
      ; default_display_context ]
  in
  let r = call_resource db resource_key in
  let found =
    match get_in r.value [ kw "full-properties" ] with
    | Some w ->
        List.exists
          (fun m -> slot_get (kw "property-uuid") m = Some (wu property_uuid))
          (Wire.as_seq w)
    | None -> false
  in
  check "class-configured property rendered" found

(* block-bidirectional-properties-resource-returns-uuid-groups-test *)
let test_block_bidirectional_properties_returns_uuid_groups () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-bidirectional-properties"; wu (u "resource-block") ]
  in
  let expected =
    Wire.Array
      [ Wire.Map
          [ kw "class-uuid", wu (u "bidirectional-class")
          ; kw "entity-uuids", Wire.Array [ wu (u "bidirectional-entity") ] ] ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "bidirectional"; wu (u "resource-block") ] ]
    expected (call_resource db resource_key)

(* block-bidirectional-properties-resource-has-an-authoritative-empty-value-test *)
let test_block_bidirectional_properties_empty_value () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-bidirectional-properties"; wu (u "journal-child-b") ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "bidirectional"; wu (u "journal-child-b") ] ]
    (Wire.Array []) (call_resource db resource_key)

(* block-ref-count-resource-uses-the-target-reference-key-test *)
let test_block_ref_count_uses_target_reference_key () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-ref-count"; wu (u "resource-block") ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "refs"; wu (u "resource-block") ] ]
    (Wire.Int 1) (call_resource db resource_key)

(* block-ref-count-resource-has-an-authoritative-zero-test *)
let test_block_ref_count_authoritative_zero () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-ref-count"; wu (u "journal-child-b") ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "refs"; wu (u "journal-child-b") ] ]
    (Wire.Int 0) (call_resource db resource_key)

(* block-ref-count-resource-skips-class-incoming-refs-test *)
let test_block_ref_count_skips_class_incoming_refs () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let class_id = entity_id db (u "class-page") in
  let child_id = entity_id db (u "class-visible-child") in
  tx conn
    (Printf.sprintf "[[:db/add %d :block/refs %d]]" child_id class_id);
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-ref-count"; wu (u "class-page") ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "refs"; wu (u "class-page") ] ]
    (Wire.Int 0) (call_resource db resource_key)

(* block-ref-count-resource-skips-property-incoming-refs-test *)
let test_block_ref_count_skips_property_incoming_refs () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let property_id = entity_id db (u "property-page") in
  let child_id = entity_id db (u "property-visible-child") in
  tx conn
    (Printf.sprintf "[[:db/add %d :block/refs %d]]" child_id property_id);
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-ref-count"; wu (u "property-page") ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "refs"; wu (u "property-page") ] ]
    (Wire.Int 0) (call_resource db resource_key)

(* block-unlinked-ref-exists-resource-gates-empty-reference-views-test *)
let test_block_unlinked_ref_exists_gates_empty_reference_views () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let page_id = entity_id db (u "page") in
  let row_id = entity_id db (u "view-row") in
  tx conn
    (Printf.sprintf
       "[[:db/add %d :block/title \"Reference target\"]
         [:db/add %d :block/title \"Mentions reference target\"]]"
       page_id row_id);
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-unlinked-ref-exists"; wu (u "page") ]
  in
  let runtime = { Render_resource.repo = Some test_repo } in
  let row_ent =
    match Datascript.entity db (Lookup_ref ("block/uuid", Uuid (u "view-row"))) with
    | Some e -> e
    | None -> Alcotest.fail "missing view-row"
  in
  let saved = !Render_deps.search_blocks_fn in
  Render_deps.search_blocks_fn :=
    Some (fun ~repo:_ ~db:_ _query _limit -> [ row_ent ]);
  Fun.protect ~finally:(fun () -> Render_deps.search_blocks_fn := saved)
    (fun () ->
      let r = call_resource ~runtime db resource_key in
      assert_resource_envelope db resource_key [] (Wire.Bool true) r);
  Render_deps.search_blocks_fn := Some (fun ~repo:_ ~db:_ _query _limit -> []);
  Fun.protect ~finally:(fun () -> Render_deps.search_blocks_fn := saved)
    (fun () ->
      let r = call_resource ~runtime db resource_key in
      assert_resource_envelope db resource_key [] (Wire.Bool false) r)

(* block-comment-threads-resource-returns-only-ordered-thread-uuids-test *)
let test_block_comment_threads_returns_only_ordered_thread_uuids () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-comment-threads"; wu (u "resource-block") ]
  in
  let r = call_resource db resource_key in
  assert_resource_envelope db resource_key
    [ wkey [ kw "comments"; wu (u "resource-block") ] ]
    (Wire.Array [ wu (u "comment-thread") ]) r;
  match r.value with
  | Wire.Array xs ->
      check "comment threads not maps"
        (List.for_all (function Wire.Map _ -> false | _ -> true) xs)
  | _ -> check "comment threads not maps" false

(* block-comment-threads-resource-has-an-authoritative-empty-value-test *)
let test_block_comment_threads_empty_value () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-comment-threads"; wu (u "journal-child-b") ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "comments"; wu (u "journal-child-b") ] ]
    (Wire.Array []) (call_resource db resource_key)

(* block-comment-summary-resource-returns-plain-summary-and-exact-watches-test *)
let test_block_comment_summary_plain_summary_and_watches () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-comment-summary"; wu (u "comment-thread") ]
  in
  let watch_keys =
    [ wkey [ kw "entity"; wu (u "comment-thread") ]
    ; wkey [ kw "children"; wu (u "comment-thread") ]
    ; wkey [ kw "entity"; wu (u "comment-block") ]
    ; wkey [ kw "entity"; wu (u "comment-block-b") ]
    ; wkey [ kw "entity"; wu (u "comment-author-a") ]
    ; wkey [ kw "entity"; wu (u "comment-author-b") ] ]
  in
  let expected =
    Wire.Map
      [ kw "count", Wire.Int 2
      ; kw "latest-author", Wire.String "Beta"
      ; kw "latest-created-at", Wire.Int 3000 ]
  in
  assert_resource_envelope db resource_key watch_keys expected
    (call_resource db resource_key);
  tx conn
    (Printf.sprintf
       "[[:db/add [:block/uuid %s] :block/title \"Edited comment\"]
         [:db/add [:block/uuid %s] :logseq.property/created-by-ref [:block/uuid %s]]
         [:db/add [:block/uuid %s] :block/created-at 500]]"
       (quid (u "comment-block-b")) (quid (u "comment-block-b"))
       (quid (u "comment-author-a")) (quid (u "comment-block-b")));
  let db = db_of conn in
  let expected' =
    Wire.Map
      [ kw "count", Wire.Int 2
      ; kw "latest-author", Wire.String "Alpha"
      ; kw "latest-created-at", Wire.Int 1000 ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "comment-thread") ]
    ; wkey [ kw "children"; wu (u "comment-thread") ]
    ; wkey [ kw "entity"; wu (u "comment-block") ]
    ; wkey [ kw "entity"; wu (u "comment-block-b") ]
    ; wkey [ kw "entity"; wu (u "comment-author-a") ] ]
    expected' (call_resource db resource_key)

(* SKIPPED: block-comment-summary-follows-comment-lifecycle-and-author-renames-test
   — render-affected-keys is not ported. *)

(* block-comment-summary-resource-has-an-authoritative-empty-value-test *)
let test_block_comment_summary_empty_value () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-comment-summary"; wu (u "empty-comment-thread") ]
  in
  let expected =
    Wire.Map
      [ kw "count", Wire.Int 0
      ; kw "latest-author", Wire.Nil
      ; kw "latest-created-at", Wire.Nil ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "empty-comment-thread") ]
    ; wkey [ kw "children"; wu (u "empty-comment-thread") ] ]
    expected (call_resource db resource_key)

(* block-comment-summary-resource-rejects-invalid-uuid-and-thread-test *)
let test_block_comment_summary_rejects_invalid_uuid_and_thread () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  List.iter
    (fun resource_key ->
      expect_thrown "invalid comment summary resource"
        (fun () -> ignore (call_resource_raw db resource_key)))
    [ wkey [ kw "block-comment-summary"; Wire.String "not-a-uuid" ]
    ; wkey [ kw "block-comment-summary"; wu (next_uuid ()) ]
    ; wkey [ kw "block-comment-summary"; wu (u "resource-block") ]
    ; wkey [ kw "block-comment-summary"; wu (u "resource-block"); kw "extra" ] ]

(* block-task-time-resource-normalizes-statuses-and-uses-an-explicit-clock-test
   — cljs redefs time-ms to 10000; doing@1000 -> done@4000 makes :seconds
   clock-independent (3), so the real clock is used. *)
let test_block_task_time_normalizes_statuses () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let ident_uuid ident =
    match Datascript.entity db (Ident ident) with
    | Some e -> (
        match Ldb.value e "block/uuid" with
        | Some (Uuid x) -> x
        | _ -> Alcotest.fail ("missing uuid " ^ ident))
    | None -> Alcotest.fail ("missing ident " ^ ident)
  in
  let doing_status_uuid = ident_uuid "logseq.property/status.doing" in
  let done_status_uuid = ident_uuid "logseq.property/status.done" in
  let resource_key = wkey [ kw "block-task-time"; wu (u "task-block") ] in
  let expected =
    Wire.Map
      [ ( kw "history"
        , Wire.Array
            [ Wire.Map
                [ kw "created-at", Wire.Int 1000
                ; kw "status-uuid", wu doing_status_uuid ]
            ; Wire.Map
                [ kw "created-at", Wire.Int 4000
                ; kw "status-uuid", wu done_status_uuid ] ] )
      ; kw "seconds", Wire.Int 3 ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "task-time"; wu (u "task-block") ] ]
    expected (call_resource db resource_key)

(* block-task-time-resource-preserves-custom-status-uuid-test *)
let test_block_task_time_preserves_custom_status_uuid () =
  let conn, u = render_resource_fixture () in
  let custom_status_uuid = next_uuid () in
  let custom_history_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:db/id -1001 :block/uuid %s :block/tx-id 21 :block/title \"Paused\" :logseq.property/created-from-property :logseq.property/status}
         {:block/uuid %s :block/tx-id 21 :block/created-at 7000 :logseq.property.history/block [:block/uuid %s] :logseq.property.history/property :logseq.property/status :logseq.property.history/ref-value -1001}]"
       (quid custom_status_uuid) (quid custom_history_uuid)
       (quid (u "task-block")));
  let db = db_of conn in
  let r = call_resource db (wkey [ kw "block-task-time"; wu (u "task-block") ]) in
  (match slot_get (kw "history") r.value with
   | Some w -> (
       match List.nth_opt (Wire.as_seq w) 2 with
       | Some hist ->
           check "custom status uuid"
             (slot_get (kw "status-uuid") hist = Some (wu custom_status_uuid))
       | None -> check "custom status uuid" false)
   | None -> check "custom status uuid" false)

(* block-task-time-resource-has-an-authoritative-empty-value-test *)
let test_block_task_time_empty_value () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key = wkey [ kw "block-task-time"; wu (u "journal-child-b") ] in
  assert_resource_envelope db resource_key
    [ wkey [ kw "task-time"; wu (u "journal-child-b") ] ]
    (Wire.Map [ kw "history", Wire.Array []; kw "seconds", Wire.Int 0 ])
    (call_resource db resource_key)

(* route-block-resource-watches-the-page-lookup-and-resolved-entities-test *)
let test_route_block_resource_watches_lookup_and_entities () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "route-block"; Wire.String "Page Identity"
         ; Wire.String "ROUTE HEADING" ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "page-lookup"; Wire.String "page identity" ]
    ; wkey [ kw "entity"; wu (u "page") ]
    ; wkey [ kw "route-page"; wu (u "page") ] ]
    (wu (u "route-heading")) (call_resource db resource_key)

(* missing-route-block-keeps-the-page-lookup-and-page-entity-watch-test *)
let test_missing_route_block_keeps_watch () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "route-block"; Wire.String "page identity"
         ; Wire.String "missing heading" ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "page-lookup"; Wire.String "page identity" ]
    ; wkey [ kw "entity"; wu (u "page") ]
    ; wkey [ kw "route-page"; wu (u "page") ] ]
    Wire.Nil (call_resource db resource_key)

(* route-block-resource-reuses-reference-aware-page-route-matching-test
   — affected-keys assertions dropped (not ported). *)
let test_route_block_resource_reuses_reference_aware_matching () =
  let conn, u = render_resource_fixture () in
  let reference_uuid = next_uuid () in
  let heading_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:block/uuid %s :block/tx-id 21 :block/title \"Project Atlas\" :block/name \"project atlas\" :block/tags :logseq.class/Page}
         {:block/uuid %s :block/tx-id 21 :block/title \"## Plans [[%s]]\" :block/page %s :block/parent %s :block/order \"v1\" :block/refs [:block/uuid %s] :logseq.property/heading 2}]"
       (quid reference_uuid) (quid heading_uuid) reference_uuid
       (uref (u "page")) (uref (u "page")) (quid reference_uuid));
  let db = db_of conn in
  let resource_key =
    wkey [ kw "route-block"; Wire.String "Page Identity"
         ; Wire.String "PLANS [[PROJECT ATLAS]]" ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "page-lookup"; Wire.String "page identity" ]
    ; wkey [ kw "entity"; wu (u "page") ]
    ; wkey [ kw "route-page"; wu (u "page") ]
    ; wkey [ kw "entity"; wu reference_uuid ] ]
    (wu heading_uuid) (call_resource db resource_key);
  tx conn
    (Printf.sprintf
       "[[:db/add [:block/uuid %s] :block/title \"Project Nova\"]]"
       (quid reference_uuid));
  let db = db_of conn in
  let r = call_resource db resource_key in
  check "renamed reference no longer matches" (r.value = Wire.Nil)

(* missing-route-block-is-invalidated-when-a-heading-starts-matching-test
   — affected-keys assertions dropped (not ported). *)
let test_missing_route_block_is_invalidated_when_heading_matches () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "route-block"; Wire.String "page identity"
         ; Wire.String "new route" ]
  in
  let before = call_resource db resource_key in
  check "missing route value nil" (before.value = Wire.Nil);
  check "watch route-page"
    (wkey_has before.watch_keys (wkey [ kw "route-page"; wu (u "page") ]));
  tx conn
    (Printf.sprintf
       "[[:db/add [:block/uuid %s] :block/title \"## New Route\"]]"
       (quid (u "route-heading")));
  let db = db_of conn in
  let r = call_resource db resource_key in
  check "route matches after rename" (wire_eq r.value (wu (u "route-heading")))

(* class-page-membership-returns-only-visible-direct-child-uuids-test *)
let test_class_page_membership_returns_visible_children () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "page-membership"; wu (u "class-page"); kw "class" ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "class-page") ]
    ; wkey [ kw "children"; wu (u "class-page") ]
    ; wkey [ kw "class-membership"; wu (u "class-page") ] ]
    (Wire.Array [ wu (u "class-visible-child") ])
    (call_resource db resource_key)

(* stale-class-page-membership-returns-direct-children-after-tag-conversion-test *)
let test_stale_class_page_membership_after_tag_conversion () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let class_id = entity_id db (u "class-page") in
  tx conn
    (Printf.sprintf
       "[[:db/retract %d :db/ident]
         [:db/retract %d :block/tags :logseq.class/Tag]
         [:db/add %d :block/tags :logseq.class/Page]]"
       class_id class_id class_id);
  let db = db_of conn in
  let resource_key =
    wkey [ kw "page-membership"; wu (u "class-page"); kw "class" ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "class-page") ]
    ; wkey [ kw "children"; wu (u "class-page") ]
    ; wkey [ kw "class-membership"; wu (u "class-page") ] ]
    (Wire.Array [ wu (u "class-visible-child"); wu (u "class-filtered-child") ])
    (call_resource db resource_key)

(* property-page-membership-watches-its-property-ident-test *)
let test_property_page_membership_watches_ident () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "page-membership"; wu (u "property-page"); kw "property" ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "property-page") ]
    ; wkey [ kw "children"; wu (u "property-page") ]
    ; wkey [ kw "property-membership"; kw "user.property/page-mode" ] ]
    (Wire.Array [ wu (u "property-visible-child") ])
    (call_resource db resource_key)

(* quick-add-page-membership-keeps-unowned-and-current-user-blocks-test *)
let test_quick_add_page_membership_keeps_unowned_and_current_user () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "page-membership"; wu (u "quick-add-page"); kw "quick-add"
         ; wu (u "current-user") ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "quick-add-page") ]
    ; wkey [ kw "children"; wu (u "quick-add-page") ]
    ; wkey [ kw "attr"; kw "logseq.property/created-by-ref" ] ]
    (Wire.Array
       [ wu (u "quick-add-unowned"); wu (u "quick-add-current-user") ])
    (call_resource db resource_key)

(* views-resource-returns-only-ordered-definition-uuids-test *)
let test_views_resource_returns_only_ordered_definition_uuids () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "views"; wu (u "view-owner"); kw "class-objects" ]
  in
  let r = call_resource db resource_key in
  assert_resource_envelope db resource_key [ resource_key ]
    (Wire.Array [ wu (u "view-a"); wu (u "view-b") ]) r;
  let by_name_key =
    wkey [ kw "views"; Wire.String "projects"; kw "class-objects" ]
  in
  let by_name = call_resource db by_name_key in
  check "views by-name watch"
    (wire_list_eq by_name.watch_keys [ resource_key ]);
  check "views by-name value"
    (wire_eq by_name.value (Wire.Array [ wu (u "view-a"); wu (u "view-b") ]))

let sorting_title_asc =
  Wire.Array
    [ Wire.Map [ kw "id", kw "block/title"; kw "asc?", Wire.Bool true ] ]

(* view-data-resource-supports-every-feature-with-flat-uuid-rows-test *)
let test_view_data_resource_supports_every_feature_flat_rows () =
  let conn, u = render_resource_fixture () in
  let all_pages_view = add_view conn "all-pages" in
  let property_view = add_view ~owner:(u "property-page") conn "property-objects" in
  let unlinked_view = add_view ~owner:(u "page") conn "unlinked-references" in
  let query_view = add_view conn "query-result" in
  let db = db_of conn in
  let reference_id = entity_id db (u "reference-block") in
  let row_id = entity_id db (u "view-row") in
  tx conn
    (Printf.sprintf
       "[[:db/add %d :block/refs %d]
         [:db/add %d :block/title \"Mentions Page Identity without a link\"]]"
       reference_id (entity_id db (u "view-owner")) row_id);
  let db = db_of conn in
  let cases =
    [ ( wkey [ kw "view-data"; wu all_pages_view
             ; Wire.Map
                 [ kw "feature-type", kw "all-pages"
                 ; kw "sorting", sorting_title_asc ] ]
      , [ wkey [ kw "entity"; wu all_pages_view ]
        ; wkey [ kw "page-membership" ]
        ; wkey [ kw "attr"; kw "block/title" ] ]
      , u "page" )
    ; ( wkey [ kw "view-data"; wu (u "view-a")
             ; Wire.Map
                 [ kw "feature-type", kw "class-objects"
                 ; kw "sorting", sorting_title_asc ] ]
      , [ wkey [ kw "entity"; wu (u "view-a") ]
        ; wkey [ kw "entity"; wu (u "view-owner") ]
        ; wkey [ kw "class-membership"; wu (u "view-owner") ]
        ; wkey [ kw "class-tree" ]
        ; wkey [ kw "attr"; kw "block/title" ] ]
      , u "view-row" )
    ; ( wkey [ kw "view-data"; wu property_view
             ; Wire.Map
                 [ kw "feature-type", kw "property-objects"
                 ; kw "sorting", sorting_title_asc ] ]
      , [ wkey [ kw "entity"; wu property_view ]
        ; wkey [ kw "entity"; wu (u "property-page") ]
        ; wkey [ kw "property-membership"; kw "user.property/page-mode" ]
        ; wkey [ kw "attr"; kw "block/title" ] ]
      , u "property-filtered-child" )
    ; ( wkey [ kw "view-data"; wu (u "other-view")
             ; Wire.Map
                 [ kw "feature-type", kw "linked-references"
                 ; kw "sorting", sorting_title_asc ] ]
      , [ wkey [ kw "entity"; wu (u "other-view") ]
        ; wkey [ kw "entity"; wu (u "view-owner") ]
        ; wkey [ kw "refs"; wu (u "view-owner") ]
        ; wkey [ kw "ref-scope" ] ]
      , u "reference-block" )
    ; ( wkey [ kw "view-data"; wu unlinked_view
             ; Wire.Map
                 [ kw "feature-type", kw "unlinked-references"
                 ; kw "sorting", sorting_title_asc ] ]
      , []
      , u "view-row" )
    ; ( wkey [ kw "view-data"; wu query_view
             ; Wire.Map
                 [ kw "feature-type", kw "query-result"
                 ; kw "sorting", sorting_title_asc
                 ; kw "query-row-uuids", Wire.Array [ wu (u "view-row") ] ] ]
      , [ wkey [ kw "entity"; wu query_view ]
        ; wkey [ kw "attr"; kw "block/title" ] ]
      , u "view-row" ) ]
  in
  List.iteri
    (fun i (key, watch, row) ->
      let r = call_resource db key in
      assert_resource_envelope db key watch r.value r;
      check ("case flat " ^ string_of_int i)
        (slot_get (kw "partition") r.value = Some (kw "flat"));
      (match get_in r.value [ kw "rows" ] with
       | Some rows ->
           let xs = Wire.as_seq rows in
           check ("case rows uuid " ^ string_of_int i)
             (xs <> []
              && List.for_all (function Wire.Uuid _ -> true | _ -> false) xs
              && List.exists (wire_eq (wu row)) xs)
       | None -> check ("case rows uuid " ^ string_of_int i) false))
    cases

(* query-view-data-resource-returns-property-maps-for-columns-test *)
let test_query_view_data_returns_property_maps_for_columns () =
  let conn, u = render_resource_fixture () in
  let query_view = add_view conn "query-result" in
  let db = db_of conn in
  tx conn
    (Printf.sprintf
       "[[:db/add %d :logseq.property/status :logseq.property/status.doing]]"
       (entity_id db (u "view-row")));
  let db = db_of conn in
  let resource_key =
    wkey [ kw "view-data"; wu query_view
         ; Wire.Map
             [ kw "feature-type", kw "query-result"
             ; kw "sorting", Wire.Array []
             ; kw "query-row-uuids", Wire.Array [ wu (u "view-row") ] ] ]
  in
  let r = call_resource db resource_key in
  match get_in r.value [ kw "properties" ] with
  | Some props_w -> (
      match Wire.as_seq props_w with
      | (_ :: _) as properties ->
          check "properties non-empty" true;
          check "properties have db/ident"
            (List.for_all
               (fun m ->
                 match slot_get (kw "db/ident") m with
                 | Some (Wire.Keyword _) -> true
                 | _ -> false)
               properties);
          let status =
            List.find_opt
              (fun m ->
                slot_get (kw "db/ident") m
                = Some (kw "logseq.property/status"))
              properties
          in
          (match status with
           | Some st ->
               check "status title"
                 (slot_get (kw "block/title") st = Some (Wire.String "Status"));
               check "status type"
                 (slot_get (kw "logseq.property/type") st = Some (kw "default"));
               (match slot_get (kw "property/closed-values") st with
                | Some cvs ->
                    let vs = Wire.as_seq cvs in
                    let titles =
                      List.sort_uniq String.compare
                        (List.filter_map
                           (fun m ->
                             match slot_get (kw "block/title") m with
                             | Some (Wire.String s) -> Some s
                             | _ -> None)
                           vs)
                    in
                    check "status closed values"
                      (titles
                       = [ "Backlog"; "Canceled"; "Doing"; "Done"
                         ; "In Review"; "Todo" ])
                | None -> check "status closed values" false)
           | None -> check "status title" false)
      | [] -> check "properties non-empty" false)
  | None -> check "properties non-empty" false

(* query-view-data-keeps-projected-columns-even-without-values-test *)
let test_query_view_data_keeps_projected_columns () =
  let conn, u = render_resource_fixture () in
  let query_uuid = next_uuid () in
  let query_view = add_view conn "query-result" in
  let resource_key =
    wkey [ kw "view-data"; wu query_view
         ; Wire.Map
             [ kw "feature-type", kw "query-result"
             ; kw "query-row-uuids", Wire.Array [ wu (u "view-row") ] ] ]
  in
  tx conn
    (Printf.sprintf
       "[{:block/uuid %s :block/title \"{:query [:find (pull ?b [:logseq.property/priority]) :where [?b :block/title]]}\" :logseq.property.node/display-type :code}
         {:block/uuid %s :logseq.property/query [:block/uuid %s]}]"
       (quid query_uuid) (quid query_view) (quid query_uuid));
  let db = db_of conn in
  let r = call_resource db resource_key in
  (match get_in r.value [ kw "properties" ] with
   | Some props_w -> (
       match Wire.as_seq props_w with
       | props ->
           check "projected columns"
             (List.filter_map (fun m -> slot_get (kw "db/ident") m) props
              = [ kw "logseq.property/priority" ]))
   | None -> check "projected columns" false);
  check "watch query entity"
    (wkey_has r.watch_keys (wkey [ kw "entity"; wu query_uuid ]))

(* view-data-resource-returns-empty-rows-after-the-view-is-deleted-test *)
let test_view_data_returns_empty_rows_after_view_deleted () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "view-data"; wu (u "view-a")
         ; Wire.Map
             [ kw "feature-type", kw "class-objects"
             ; kw "sorting", sorting_title_asc ] ]
  in
  let views_key =
    wkey [ kw "views"; wu (u "view-owner"); kw "class-objects" ]
  in
  let live = call_resource db resource_key in
  (match get_in live.value [ kw "rows" ] with
   | Some w ->
       check "live rows non-empty" (Wire.as_seq w <> [])
   | None -> check "live rows non-empty" false);
  tx conn
    (Printf.sprintf "[[:db/retractEntity [:block/uuid %s]]]"
       (quid (u "view-a")));
  let db = db_of conn in
  let empty_value =
    Wire.Map
      [ kw "partition", kw "flat"; kw "count", Wire.Int 0
      ; kw "rows", Wire.Array [] ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "view-a") ] ]
    empty_value (call_resource db resource_key);
  let batch =
    Render_resource.render_snapshots db
      (Wire.Map
         [ kw "blocks", Wire.Array []
         ; kw "children", Wire.Array []
         ; kw "resources", Wire.Array [ resource_key; views_key ] ])
      default_runtime
  in
  check "sibling views ok"
    (match get_in batch [ kw "slots"; wkey [ kw "resource"; views_key ]; kw "value" ] with
     | Some (Wire.Array [ Wire.Uuid x ]) -> x = u "view-b"
     | _ -> false);
  check "deleted view empty value"
    (match get_in batch [ kw "slots"; wkey [ kw "resource"; resource_key ]; kw "value" ] with
     | Some v -> wire_eq v empty_value
     | None -> false)

(* all-pages-view-data-returns-the-first-window-ids-without-row-snapshots-test *)
let test_all_pages_view_data_returns_first_window_ids () =
  let conn, _ = render_resource_fixture () in
  let view_uuid = add_view conn "all-pages" in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "view-data"; wu view_uuid
         ; Wire.Map
             [ kw "feature-type", kw "all-pages"
             ; kw "sorting", sorting_title_asc
             ; kw "initial-row-count", Wire.Int 2 ] ]
  in
  let r = call_resource db resource_key in
  check "no initial-blocks" (slot_get (kw "initial-blocks") r.value = None);
  let rows =
    match slot_get (kw "rows") r.value with
    | Some w -> Wire.as_seq w
    | None -> []
  in
  let initial_rows = list_take 2 rows in
  check "two initial rows" (List.length initial_rows = 2);
  check "initial rows uuids"
    (List.for_all (function Wire.Uuid _ -> true | _ -> false) initial_rows);
  check "no row snapshots"
    (List.for_all
       (fun u -> not (wire_mem (wkey [ kw "block"; u ]) (Wire.Map r.slots_all)))
       initial_rows);
  check "title watch key"
    (wkey_has r.watch_keys (wkey [ kw "attr"; kw "block/title" ]));
  let previews =
    match slot_get (kw "row-previews") r.value with
    | Some (Wire.Map kvs) -> kvs
    | _ -> []
  in
  check "preview count" (List.length previews = List.length initial_rows);
  check "preview shape"
    (List.for_all
       (fun row ->
         match slot_get row (Wire.Map previews) with
         | Some preview ->
             slot_get (kw "block/uuid") preview = Some row
             && (match slot_get (kw "block/title") preview with
                 | Some (Wire.String _) -> true
                 | _ -> false)
             && (match slot_get (kw "db/id") preview with
                 | Some (Wire.Int _) | Some (Wire.Int64 _) -> true
                 | _ -> false)
             && slot_get (kw "block.temp/first-window-preview?") preview
                = Some (Wire.Bool true)
         | None -> false)
       initial_rows);
  check "first-window transit"
    (try
       wire_eq (Transit_codec.of_string (Transit_codec.to_string r.raw)) r.raw
     with _ -> false)

(* class-objects-view-data-returns-the-first-window-ids-without-row-snapshots-test *)
let test_class_objects_view_data_returns_first_window_ids () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "view-data"; wu (u "view-a")
         ; Wire.Map
             [ kw "feature-type", kw "class-objects"
             ; kw "sorting", sorting_title_asc
             ; kw "initial-row-count", Wire.Int 1 ] ]
  in
  let r = call_resource db resource_key in
  let rows =
    match slot_get (kw "rows") r.value with
    | Some w -> Wire.as_seq w
    | None -> []
  in
  check "one row" (List.length rows = 1);
  check "row is view-row" (List.exists (wire_eq (wu (u "view-row"))) rows);
  check "no block slot"
    (not (wire_mem (wkey [ kw "block"; wu (u "view-row") ]) (Wire.Map r.slots_all)));
  match get_in r.value [ kw "row-previews"; wu (u "view-row") ] with
  | Some preview ->
      check "preview uuid"
        (slot_get (kw "block/uuid") preview = Some (wu (u "view-row")));
      check "preview title"
        (slot_get (kw "block/title") preview = Some (Wire.String "Object row"));
      check "preview flag"
        (slot_get (kw "block.temp/first-window-preview?") preview
         = Some (Wire.Bool true));
      check "preview id"
        (match slot_get (kw "db/id") preview with
         | Some (Wire.Int _) | Some (Wire.Int64 _) -> true
         | _ -> false)
  | None -> check "preview" false

(* all-pages-view-data-row-offset-returns-the-scrolled-window-without-remaining-ids-test *)
let test_all_pages_view_data_row_offset () =
  let conn, _ = render_resource_fixture () in
  let view_uuid = add_view conn "all-pages" in
  let db = db_of conn in
  let mk_key offset =
    let kvs =
      [ kw "feature-type", kw "all-pages"
      ; kw "sorting", sorting_title_asc
      ; kw "initial-row-count", Wire.Int 2 ]
      @ (match offset with
         | Some n -> [ kw "row-offset", Wire.Int n ]
         | None -> [])
    in
    wkey [ kw "view-data"; wu view_uuid; Wire.Map kvs ]
  in
  let first_key = mk_key None in
  let offset_key = mk_key (Some 1) in
  let first_value = (call_resource db first_key).value in
  let offset_value = (call_resource db offset_key).value in
  let first_rows =
    match slot_get (kw "rows") first_value with
    | Some w -> Wire.as_seq w
    | None -> []
  in
  let offset_rows =
    match slot_get (kw "rows") offset_value with
    | Some w -> Wire.as_seq w
    | None -> []
  in
  check "first rows 2" (List.length first_rows = 2);
  check "offset rows 2" (List.length offset_rows = 2);
  check "offset starts after first"
    (match List.nth_opt first_rows 1, List.nth_opt offset_rows 0 with
     | Some a, Some b -> wire_eq a b
     | _ -> false);
  check "windows differ" (not (wire_list_eq first_rows offset_rows));
  let previews =
    match slot_get (kw "row-previews") offset_value with
    | Some (Wire.Map kvs) -> kvs
    | _ -> []
  in
  check "offset preview count" (List.length previews = List.length offset_rows);
  (match List.nth_opt offset_rows 0 with
   | Some row -> (
       match slot_get row (Wire.Map previews) with
       | Some preview ->
           check "offset preview flag"
             (slot_get (kw "block.temp/first-window-preview?") preview
              = Some (Wire.Bool true));
           check "offset preview title"
             (match slot_get (kw "block/title") preview with
              | Some (Wire.String _) -> true
              | _ -> false)
       | None -> check "offset preview" false)
   | None -> check "offset preview" false);
  let r = call_resource db offset_key in
  check "offset rows no block slots"
    (List.for_all
       (fun u -> not (wire_mem (wkey [ kw "block"; u ]) (Wire.Map r.slots_all)))
       offset_rows)

(* opaque-query-resource-declares-watch-all-test — cljs redef'd
   execute-query but only asserted watch keys; real DSL runs. *)
let test_opaque_query_resource_declares_watch_all () =
  let conn, _ = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wire_of_edn "[:query {:kind :dsl :query \"(task TODO)\"}]"
  in
  let r = call_resource db resource_key in
  check "opaque watch-keys empty" (r.watch_keys = []);
  check "opaque watch-all" r.watch_all;
  check "opaque no graph key"
    (not (wkey_has r.watch_keys (wkey [ kw "graph" ])))

(* query-view-resource-supports-transient-missing-feature-type-test *)
let test_query_view_resource_supports_transient_missing_feature_type () =
  let conn, u = render_resource_fixture () in
  let query_view = add_view conn "query-result" in
  let db = db_of conn in
  let query_view_id = entity_id db query_view in
  tx conn
    (Printf.sprintf
       "[[:db/retract %d :logseq.property.view/feature-type :query-result]]"
       query_view_id);
  let db = db_of conn in
  let resource_key =
    wkey [ kw "view-data"; wu query_view
         ; Wire.Map
             [ kw "feature-type", kw "query-result"
             ; kw "sorting", Wire.Array []
             ; kw "query-row-uuids", Wire.Array [ wu (u "view-row") ] ] ]
  in
  let r = call_resource db resource_key in
  check "transient missing feature-type rows"
    (match get_in r.value [ kw "rows" ] with
     | Some w ->
         wire_eq w (Wire.Array [ wu (u "view-row") ])
     | None -> false);
  check "watch view entity"
    (wkey_has r.watch_keys (wkey [ kw "entity"; wu query_view ]))

(* view-data-resource-normalizes-grouped-and-grouped-list-partitions-test *)
let test_view_data_resource_normalizes_partitions () =
  (* testing "grouped scalar rows" *)
  (let conn, u = render_resource_fixture () in
   let db = db_of conn in
   let view_id = entity_id db (u "view-a") in
   tx conn
     (Printf.sprintf
        "[[:db/add %d :logseq.property.view/group-by-property :block/title]]"
        view_id);
   let db = db_of conn in
   let resource_key =
     wkey [ kw "view-data"; wu (u "view-a")
          ; Wire.Map
              [ kw "feature-type", kw "class-objects"
              ; kw "sorting", sorting_title_asc ] ]
   in
   let expected =
     Wire.Map
       [ kw "partition", kw "grouped"
       ; kw "count", Wire.Int 1
       ; ( kw "groups"
         , Wire.Array
             [ Wire.Map
                 [ ( kw "value"
                   , Wire.Map
                       [ kw "kind", kw "scalar"
                       ; kw "value", Wire.String "Object row" ] )
                 ; kw "rows", Wire.Array [ wu (u "view-row") ] ] ] ) ]
   in
   assert_resource_envelope db resource_key
     [ wkey [ kw "entity"; wu (u "view-a") ]
     ; wkey [ kw "entity"; wu (u "view-owner") ]
     ; wkey [ kw "class-membership"; wu (u "view-owner") ]
     ; wkey [ kw "class-tree" ]
     ; wkey [ kw "attr"; kw "block/title" ]
     ; wkey [ kw "attr"; kw "block/journal-day" ] ]
     expected (call_resource db resource_key));
  (* testing "grouped list rows" *)
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let view_id = entity_id db (u "view-a") in
  let owner_id = entity_id db (u "view-owner") in
  let row_id = entity_id db (u "view-row") in
  let child_id = entity_id db (u "journal-child-a") in
  let grandchild_id = entity_id db (u "journal-grandchild") in
  tx conn
    (Printf.sprintf
       "[[:db/retract %d :block/tags %d]
         [:db/add %d :block/tags %d]
         [:db/add %d :block/tags %d]
         [:db/add %d :logseq.property.view/group-by-property :block/page]
         [:db/add %d :logseq.property.view/type :logseq.property.view/type.list]]"
       row_id owner_id child_id owner_id grandchild_id owner_id view_id
       view_id);
  let db = db_of conn in
  let resource_key =
    wkey [ kw "view-data"; wu (u "view-a")
         ; Wire.Map
             [ kw "feature-type", kw "class-objects"
             ; kw "sorting", sorting_title_asc ] ]
  in
  let r = call_resource db resource_key in
  assert_resource_envelope db resource_key
    [ wkey [ kw "entity"; wu (u "view-a") ]
    ; wkey [ kw "entity"; wu (u "view-owner") ]
    ; wkey [ kw "class-membership"; wu (u "view-owner") ]
    ; wkey [ kw "class-tree" ]
    ; wkey [ kw "attr"; kw "block/title" ]
    ; wkey [ kw "attr"; kw "block/page" ]
    ; wkey [ kw "attr"; kw "block/journal-day" ]
    ; wkey [ kw "attr"; kw "block/parent" ]
    ; wkey [ kw "attr"; kw "block/order" ] ]
    r.value r;
  check "grouped-list partition"
    (slot_get (kw "partition") r.value = Some (kw "grouped-list"));
  check "grouped-list count"
    (slot_get (kw "count") r.value = Some (Wire.Int 2));
  let group =
    match slot_get (kw "groups") r.value with
    | Some (Wire.Array (g :: _)) -> Some g
    | _ -> None
  in
  (match group with
   | Some g ->
       check "group value"
         (wire_eq
            (Option.value (slot_get (kw "value") g) ~default:Wire.Nil)
            (Wire.Map [ kw "kind", kw "entity"; kw "uuid", wu (u "journal-a") ]));
       let partitions =
         match slot_get (kw "partitions") g with
         | Some w -> Wire.as_seq w
         | None -> []
       in
       let pairs =
         List.sort_uniq Stdlib.compare
           (List.filter_map
              (fun p ->
                match slot_get (kw "breadcrumb-uuid") p, slot_get (kw "rows") p with
                | Some b, Some rs -> Some (norm_wire b, norm_wire rs)
                | _ -> None)
              partitions)
       in
       check "grouped-list partitions"
         (pairs
          = List.sort_uniq Stdlib.compare
              [ ( wu (u "journal-child-a")
                , Wire.Array [ wu (u "journal-child-a") ] )
              ; ( wu (u "journal-grandchild")
                , Wire.Array [ wu (u "journal-grandchild") ] ) ]);
       check "nested rows are uuids"
         (List.for_all
            (fun p ->
              match slot_get (kw "rows") p with
              | Some w ->
                  List.for_all
                    (function Wire.Map _ -> false | _ -> true)
                    (Wire.as_seq w)
              | None -> false)
            partitions)
   | None -> check "grouped-list group" false)

(* SKIPPED: unlinked-references-resource-normalizes-list-partitions-test —
   needs with-redefs db-view/get-view-data (no OCaml injection ref). *)

(* SKIPPED: view-data-resource-watches-effective-persisted-configuration-test —
   needs with-redefs db-view/get-view-data (no OCaml injection ref). *)

(* SKIPPED: query-resource-executes-dsl-with-only-serialized-context-test —
   needs with-redefs query-dsl/execute-query (row capture). *)

(* blank-dsl-query-resource-renders-an-empty-result-test *)
let test_blank_dsl_query_resource_renders_empty_result () =
  let conn, _ = render_resource_fixture () in
  let db = db_of conn in
  let resource_key = wire_of_edn "[:query {:kind :dsl :query \"\"}]" in
  let expected =
    Wire.Map [ kw "rows", Wire.Array [] ]
  in
  assert_resource_envelope db resource_key
    [ wkey [ kw "graph" ] ] expected (call_resource db resource_key)

(* query-resource-resolves-advanced-page-block-and-today-inputs-test *)
let test_query_resource_resolves_advanced_inputs () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let query =
    wire_of_edn
      "[:find (pull ?child [:block/uuid])
        :in $ ?current-page ?query-page ?current-block ?parent-block ?today
        :where
        [?child :block/parent ?current-block]
        [?current-block :block/parent ?parent-block]
        [?current-block :block/page ?page]
        [?page :block/name ?query-page]
        [(= ?current-page ?query-page)]
        [(= ?today 20200101)]]"
  in
  let resource_key =
    wkey [ kw "query"
         ; Wire.Map
             [ kw "kind", kw "datalog"
             ; kw "query", query
             ; ( kw "inputs"
               , Wire.Array
                   [ kw "current-page"; kw "query-page"
                   ; kw "current-block"; kw "parent-block"
                   ; kw "today" ] )
             ; kw "current-block-uuid", wu (u "journal-child-a")
             ; kw "today-day", Wire.Int 20200101 ] ]
  in
  let expected =
    Wire.Map [ kw "rows", Wire.Array [ wu (u "journal-grandchild") ] ]
  in
  assert_resource_envelope db resource_key
    (datalog_query_watch_keys resource_key)
    expected (call_resource db resource_key)

(* query-resource-keeps-escaped-paren-regex-inputs-test — OCaml re-pattern is
   lazy and Regex serializes to Wire.String (see header). *)
let test_query_resource_keeps_escaped_paren_regex_inputs () =
  let conn, _ = render_resource_fixture () in
  let db = db_of conn in
  let matcher =
    "\\([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\)"
  in
  let query =
    wire_of_edn
      "[:find ?regex :in $ ?matcher :where [(re-pattern ?matcher) ?regex]]"
  in
  let resource_key =
    wkey [ kw "query"
         ; Wire.Map
             [ kw "kind", kw "datalog"
             ; kw "query", query
             ; kw "inputs", Wire.Array [ Wire.String matcher ] ] ]
  in
  let r = call_resource db resource_key in
  match get_in r.value [ kw "rows" ] with
  | Some (Wire.Array (first :: _)) ->
      check "regex row value" (wire_eq first (Wire.String matcher))
  | _ -> check "regex row value" false

(* render-snapshots-isolates-failing-query-resources-test — lazy re-pattern
   means "(" produces no error value; this is a known engine divergence
   (currently red upstream). *)
let test_render_snapshots_isolates_failing_query_resources () =
  let conn, _ = render_resource_fixture () in
  let db = db_of conn in
  let journals_key = wkey [ kw "journals" ] in
  let failing_query =
    wkey [ kw "query"
         ; Wire.Map
             [ kw "kind", kw "datalog"
             ; kw "query"
             , wire_of_edn
                 "[:find ?regex :in $ ?matcher :where [(re-pattern ?matcher) ?regex]]"
             ; kw "inputs", Wire.Array [ Wire.String "(" ] ] ]
  in
  let response =
    Render_resource.render_snapshots db
      (Wire.Map
         [ kw "blocks", Wire.Array []
         ; kw "children", Wire.Array []
         ; kw "resources", Wire.Array [ failing_query; journals_key ] ])
      default_runtime
  in
  check "sibling no error"
    (get_in response [ kw "slots"; wkey [ kw "resource"; journals_key ]; kw "error" ]
     = None);
  check "sibling value vector"
    (match get_in response [ kw "slots"; wkey [ kw "resource"; journals_key ]; kw "value" ] with
     | Some (Wire.Array _) -> true
     | _ -> false);
  check "failing query error message"
    (match
       get_in response
         [ kw "slots"; wkey [ kw "resource"; failing_query ]; kw "value"
         ; kw "error"; kw "message" ]
     with
     | Some (Wire.String m) -> string_contains m "Invalid regular expression"
     | _ -> false);
  check "failing query rows empty"
    (match
       get_in response
         [ kw "slots"; wkey [ kw "resource"; failing_query ]; kw "value"; kw "rows" ]
     with
     | Some (Wire.Array []) -> true
     | _ -> false);
  check "isolation transit"
    (try
       wire_eq
         (Transit_codec.of_string (Transit_codec.to_string response))
         response
     with _ -> false)

(* query-resource-injects-built-in-rules-and-merges-user-rules-test *)
let test_query_resource_injects_builtin_rules () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let query_without_rules =
    wire_of_edn
      "[:find (pull ?b [:block/uuid])
        :in $ ?target-uuid
        :where
        (has-ref ?b ?target)
        [?target :block/uuid ?target-uuid]]"
  in
  let query_with_user_rules =
    wire_of_edn
      "[:find (pull ?b [:block/uuid])
        :in $ ?target-uuid %
        :where
        (custom-ref ?b ?target)
        (has-ref ?b ?target)
        [?target :block/uuid ?target-uuid]]"
  in
  let user_rules =
    wire_of_edn "[[(custom-ref ?b ?target) [?b :block/refs ?target]]]"
  in
  List.iter
    (fun spec ->
      let resource_key = wkey [ kw "query"; spec ] in
      let expected =
        Wire.Map [ kw "rows", Wire.Array [ wu (u "reference-block") ] ]
      in
      assert_resource_envelope db resource_key
        (datalog_query_watch_keys resource_key)
        expected (call_resource db resource_key))
    [ Wire.Map
        [ kw "kind", kw "datalog"
        ; kw "query", query_without_rules
        ; kw "inputs", Wire.Array [ wu (u "resource-block") ] ]
    ; Wire.Map
        [ kw "kind", kw "datalog"
        ; kw "query", query_with_user_rules
        ; kw "inputs", Wire.Array [ wu (u "resource-block") ]
        ; kw "rules", user_rules ] ]

(* query-resource-preserves-scalar-tuples-test *)
let test_query_resource_preserves_scalar_tuples () =
  let conn, _ = render_resource_fixture () in
  let db = db_of conn in
  let query =
    wire_of_edn
      "[:find ?title ?day
        :in $ ?day
        :where
        [?page :block/journal-day ?day]
        [?page :block/title ?title]]"
  in
  let resource_key =
    wkey [ kw "query"
         ; Wire.Map
             [ kw "kind", kw "datalog"
             ; kw "query", query
             ; kw "inputs", Wire.Array [ Wire.Int 20200101 ] ] ]
  in
  let expected =
    Wire.Map
      [ ( kw "rows"
        , Wire.Array
            [ Wire.Array
                [ Wire.String "Jan 1st, 2020"; Wire.Int 20200101 ] ] ) ]
  in
  assert_resource_envelope db resource_key
    (datalog_query_watch_keys resource_key)
    expected (call_resource db resource_key)

(* query-resource-renders-partial-block-pulls-as-blocks-test — the cljs
   transform is SCI-evaluated; OCaml routes through
   Render_deps.result_transform_fn, so a small evaluator for this exact EDN
   form is injected (the row encoding is tuple-wrapped — see header). *)
let eval_transform_filter_journal_day (rows : Wire.t list) : Wire.t =
  Wire.Array
    (List.filter
       (fun row ->
         match row with
         | Wire.Array [ cell ] | Wire.List [ cell ] -> (
             match cell with
             | Wire.Map _ -> (
                 match slot_get (kw "block/journal-day") cell with
                 | Some (Wire.Int 20200101) -> true
                 | _ -> false)
             | _ -> false)
         | _ -> false)
       rows)

let test_query_resource_renders_partial_block_pulls_as_blocks () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let queries =
    [ "[:find (pull ?p [:block/journal-day])
        :in $ ?start ?end
        :where [?p :block/journal-day ?day]
        [(>= ?day ?start)] [(<= ?day ?end)]]"
    ; "[:find (pull $ ?p [:block/journal-day])
        :in $ ?start ?end
        :where [?p :block/journal-day ?day]
        [(>= ?day ?start)] [(<= ?day ?end)]]" ]
  in
  let saved = !Render_deps.result_transform_fn in
  Render_deps.result_transform_fn :=
    Some (fun _edn rows -> eval_transform_filter_journal_day rows);
  Fun.protect ~finally:(fun () -> Render_deps.result_transform_fn := saved)
    (fun () ->
      List.iteri
        (fun i q ->
          let query = wire_of_edn q in
          let resource_key =
            wkey [ kw "query"
                 ; Wire.Map
                     [ kw "kind", kw "datalog"
                     ; kw "query", query
                     ; kw "inputs"
                     , Wire.Array [ Wire.Int 20200101; Wire.Int 20200102 ] ] ]
          in
          let r = call_resource db resource_key in
          (match get_in r.value [ kw "rows" ] with
           | Some (Wire.Array xs) | Some (Wire.List xs) ->
               check ("partial pulls rows " ^ string_of_int i)
                 (wire_list_eq xs [ wu (u "journal-a"); wu (u "journal-b") ])
           | _ -> check ("partial pulls rows " ^ string_of_int i) false);
          let transformed_key =
            match resource_key with
            | Wire.Array [ tag; Wire.Map kvs ] ->
                Wire.Array
                  [ tag
                  ; Wire.Map
                      ( kvs
                      @ [ ( kw "result-transform-edn"
                          , Wire.String
                              "(fn [rows] (filter #(= 20200101 (:block/journal-day %)) rows))" )
                        ] ) ]
            | _ -> resource_key
          in
          let r2 = call_resource db transformed_key in
          match get_in r2.value [ kw "rows" ] with
          | Some (Wire.Array xs) | Some (Wire.List xs) ->
              check ("transformed rows " ^ string_of_int i)
                (wire_list_eq xs [ wu (u "journal-a") ])
          | _ -> check ("transformed rows " ^ string_of_int i) false)
        queries)

(* partial-block-pull-filters-hidden-and-deleted-results-test *)
let test_partial_block_pull_filters_hidden_and_deleted () =
  let conn, u = render_resource_fixture () in
  let resource_key =
    wkey [ kw "query"
         ; Wire.Map
             [ kw "kind", kw "datalog"
             ; kw "query"
             , wire_of_edn
                 "[:find (pull ?p [:block/journal-day])
                   :where [?p :block/journal-day]]" ] ]
  in
  tx conn
    (Printf.sprintf
       "[{:block/uuid %s :logseq.property/hide? true}
         {:block/uuid %s :logseq.property/deleted-at 1000}]"
       (quid (u "journal-a")) (quid (u "journal-b")));
  let db = db_of conn in
  let r = call_resource db resource_key in
  check "hidden rows empty"
    (match get_in r.value [ kw "rows" ] with
     | Some (Wire.Array []) | Some (Wire.List []) -> true
     | _ -> false);
  check "watch hide?"
    (wkey_has r.watch_keys (wkey [ kw "attr"; kw "logseq.property/hide?" ]));
  check "watch deleted-at"
    (wkey_has r.watch_keys (wkey [ kw "attr"; kw "logseq.property/deleted-at" ]))

(* query-resource-keeps-pull-maps-without-uuid-test *)
let test_query_resource_keeps_pull_maps_without_uuid () =
  let conn, u = render_resource_fixture () in
  let doing_uuid = next_uuid () in
  tx conn
    (Printf.sprintf
       "[{:block/uuid %s :block/tx-id 20 :block/title \"Doing task\" :block/page %s :block/parent %s :block/order \"z0\" :logseq.property/status :logseq.property/status.doing}]"
       (quid doing_uuid) (uref (u "journal-a")) (uref (u "journal-a")));
  let db = db_of conn in
  let query =
    wire_of_edn
      "[:find (pull ?h [*]) (pull ?p [:block/title :block/journal-day])
        :where
        (task ?h #{\"Doing\"})
        [?h :block/page ?p]]"
  in
  let resource_key =
    wkey [ kw "query"; Wire.Map [ kw "kind", kw "datalog"; kw "query", query ] ]
  in
  let expected =
    Wire.Map
      [ ( kw "rows"
        , Wire.Array
            [ Wire.Array
                [ wu doing_uuid
                ; Wire.Map
                    [ kw "block/title", Wire.String "Jan 1st, 2020"
                    ; kw "block/journal-day", Wire.Int 20200101 ] ] ] ) ]
  in
  assert_resource_envelope db resource_key
    (datalog_query_watch_keys resource_key)
    expected (call_resource db resource_key)

(* SKIPPED: query-resource-applies-serialized-transform-and-top-level-filter-test
   and query-resource-can-keep-nested-block-results-test — need with-redefs
   query-dsl/execute-query supplying rows (no OCaml injection ref). *)

(* quoted-full-text-query-uses-worker-search-and-filters-results-test *)
let test_quoted_full_text_query_uses_worker_search () =
  let conn, u = render_resource_fixture () in
  let hidden_uuid = next_uuid () in
  let calls = ref [] in
  let resource_key =
    wkey [ kw "query"
         ; Wire.Map
             [ kw "kind", kw "dsl"
             ; kw "query", Wire.String "\"needle\""
             ; kw "current-block-uuid", wu (u "view-row") ] ]
  in
  tx conn
    (Printf.sprintf
       "[{:block/uuid %s :block/title \"needle hidden\" :logseq.property/hide? true}]"
       (quid hidden_uuid));
  let db = db_of conn in
  let ent uuid_s =
    match Datascript.entity db (Lookup_ref ("block/uuid", Uuid uuid_s)) with
    | Some e -> e
    | None -> Alcotest.fail "fixture entity missing"
  in
  let saved = !Render_deps.search_blocks_fn in
  Render_deps.search_blocks_fn :=
    Some
      (fun ~repo ~db:_ query_text limit ->
        calls := (repo, query_text, limit) :: !calls;
        [ ent (u "view-row"); ent hidden_uuid; ent (u "resource-block") ]);
  Fun.protect ~finally:(fun () -> Render_deps.search_blocks_fn := saved)
    (fun () ->
      let r =
        call_resource ~runtime:{ repo = Some test_repo } db resource_key
      in
      check "search call args"
        (!calls = [ (test_repo, "needle", 30) ]);
      assert_resource_envelope db resource_key
        [ wkey [ kw "graph" ] ]
        (Wire.Map [ kw "rows", Wire.Array [ wu (u "resource-block") ] ])
        r)

(* view-and-query-resources-reject-non-data-contracts-test *)
let test_view_and_query_resources_reject_non_data_contracts () =
  let conn, u = render_resource_fixture () in
  let ownerless_class_view = add_view conn "class-objects" in
  let db = db_of conn in
  (* view contexts are one typed serializable path *)
  List.iter
    (fun resource_key ->
      expect_thrown "invalid view resource"
        (fun () -> ignore (call_resource_raw db resource_key)))
    [ wkey [ kw "view-data"; wu (u "view-a")
           ; Wire.Map
               [ kw "feature-type", kw "class-objects"
               ; kw "owner-uuid", wu (next_uuid ()) ] ]
    ; wkey [ kw "view-data"; wu (u "view-a")
           ; Wire.Map [ kw "feature-type", kw "linked-references" ] ]
    ; wkey [ kw "view-data"; wu ownerless_class_view
           ; Wire.Map [ kw "feature-type", kw "class-objects" ] ]
    ; wkey [ kw "view-data"; wu (u "view-a")
           ; Wire.Map
               [ kw "feature-type", kw "class-objects"
               ; kw "sorting"
               , Wire.Array
                   [ Wire.Map
                       [ kw "id", kw "block/title"
                       ; kw "value-fn", wire_entity_tag ] ] ] ]
    ; wkey [ kw "view-data"; wu (u "view-a")
           ; Wire.Map
               [ kw "feature-type", kw "class-objects"
               ; kw "filters"
               , Wire.Map
                   [ kw "or?", Wire.Bool false
                   ; kw "filters"
                   , Wire.Array
                       [ Wire.Array
                           [ kw "block/tags"; kw "is"
                           ; Wire.Set [ wire_entity_tag ] ] ] ] ] ]
    ; wkey [ kw "view-data"; wu (u "view-a")
           ; Wire.Map
               [ kw "feature-type", kw "query-result"
               ; kw "query-row-uuids"
               , Wire.Array [ Wire.String "not-a-uuid" ] ] ] ];
  (* query specs contain no closures, entities, or untyped options *)
  List.iter
    (fun resource_key ->
      expect_thrown "invalid query resource"
        (fun () -> ignore (call_resource_raw db resource_key)))
    [ wkey [ kw "query"
           ; Wire.Map
               [ kw "kind", kw "dsl"
               ; kw "query", Wire.String "(task TODO)"
               ; kw "cards?", Wire.String "false" ] ]
    ; wkey [ kw "query"
           ; Wire.Map
               [ kw "kind", kw "dsl"
               ; kw "query", Wire.String "(task TODO)"
               ; kw "query-fn", wire_entity_tag ] ]
    ; wkey [ kw "query"
           ; Wire.Map
               [ kw "kind", kw "datalog"
               ; kw "query"
               , wire_of_edn "[:find ?e :where [?e :block/title]]"
               ; kw "inputs", Wire.Array [ wire_entity_tag ] ] ]
    ; wkey [ kw "query"
           ; Wire.Map
               [ kw "kind", kw "datalog"
               ; kw "query", Wire.String "not datalog" ] ]
    ; wkey [ kw "query"
           ; Wire.Map
               [ kw "kind", kw "datalog"
               ; kw "query"
               , wire_of_edn "[:find ?e :where [?e :block/title]]"
               ; kw "result-transform-edn"
               , Wire.List
                   [ Wire.Symbol "fn"; Wire.Array [ Wire.Symbol "rows" ]
                   ; Wire.Symbol "rows" ] ] ] ];
  (* full-text has one worker-search path and requires repo context *)
  expect_thrown "full-text needs repo"
    (fun () ->
      ignore
        (call_resource_raw db
           (wkey [ kw "query"
                 ; Wire.Map
                     [ kw "kind", kw "dsl"
                     ; kw "query", Wire.String "\"needle\"" ] ])))

(* block-sync-conflicts-resource-is-owned-by-the-sync-state-provider-test *)
let test_block_sync_conflicts_resource_owned_by_sync_state_provider () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let resource_key =
    wkey [ kw "block-sync-conflicts"; wu (u "resource-block") ]
  in
  match
    (try
       ignore (call_resource_raw db resource_key);
       None
     with e -> Some e)
  with
  | None -> check "sync-state resource rejected" false
  | Some (Dispatcher.Exn_info (msg, data)) ->
      check "sync-state message"
        (msg = "Renderer resource belongs to a non-DB provider");
      check "sync-state provider"
        (List.assoc_opt (kw "provider") data = Some (kw "sync-state"));
      check "sync-state resource-key"
        (List.assoc_opt (kw "resource-key") data
         = Some resource_key)
  | Some _ -> check "sync-state resource rejected" false

(* render-resource-dispatch-rejects-unknown-and-malformed-keys-test *)
let test_render_resource_dispatch_rejects_unknown_and_malformed_keys () =
  let conn, u = render_resource_fixture () in
  let db = db_of conn in
  let bad_context_missing =
    match default_display_context with
    | Wire.Map kvs ->
        Wire.Map
          (List.filter
             (fun (k, _) -> not (wire_eq k (kw "publishing?"))) kvs)
    | _ -> default_display_context
  in
  let bad_context_extra =
    match default_display_context with
    | Wire.Map kvs -> Wire.Map (kvs @ [ kw "unknown?", Wire.Bool false ])
    | _ -> default_display_context
  in
  List.iteri
    (fun i resource_key ->
      expect_thrown
        ("dispatch rejects " ^ string_of_int i)
        (fun () -> ignore (call_resource_raw db resource_key)))
    [ Wire.Nil
    ; Wire.Array []
    ; wkey [ kw "unknown" ]
    ; wkey [ kw "journals"; kw "extra" ]
    ; wkey [ kw "journal-window"; Wire.Array [ wu (next_uuid ()) ] ]
    ; wkey [ kw "journal-bundle"; Wire.String "not-a-uuid" ]
    ; wkey [ kw "block-display-properties"; wu (u "resource-block")
           ; bad_context_missing ]
    ; wkey [ kw "block-display-properties"; wu (u "resource-block")
           ; bad_context_extra ]
    ; wkey [ kw "block-positioned-properties"; wu (u "resource-block")
           ; kw "properties" ]
    ; wkey [ kw "block-bidirectional-properties"; Wire.String "not-a-uuid" ]
    ; wkey [ kw "block-ref-count"; wu (u "resource-block"); kw "extra" ]
    ; wkey [ kw "block-comment-threads"; Wire.Nil ]
    ; wkey [ kw "block-task-time"; wu (u "resource-block"); kw "extra" ]
    ; wkey [ kw "route-block"; Wire.String ""; Wire.String "route" ]
    ; wkey [ kw "route-block"; Wire.String "page identity"; Wire.String "" ]
    ; wkey [ kw "page-membership"; wu (u "page"); kw "property" ]
    ; wkey [ kw "page-membership"; wu (u "quick-add-page"); kw "quick-add"
           ; Wire.Nil ]
    ; wkey [ kw "page-membership"; wu (u "quick-add-page"); kw "unknown" ]
    ; wkey [ kw "view-data"; wu (next_uuid ()) ]
    ; wkey [ kw "query"; Wire.Map [ kw "kind", kw "dsl" ] ] ]

let cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "task-query-uses-semantic-watch-key-test" `Quick
      test_task_query_uses_semantic_watch_key
  ; Alcotest.test_case "simple-dsl-query-resource-uses-attribute-watch-keys-test" `Quick
      test_simple_dsl_query_resource_uses_attribute_watch_keys
  ; Alcotest.test_case "property-choices-resource-tracks-choice-entity-updates-test" `Quick
      test_property_choices_resource_tracks_choice_entity_updates
  ; Alcotest.test_case "recycle-roots-resource-returns-newest-first-canonical-blocks-test" `Quick
      test_recycle_roots_resource_returns_newest_first_canonical_blocks
  ; Alcotest.test_case "render-snapshots-validates-bounded-unique-requests-test" `Quick
      test_render_snapshots_validates_bounded_unique_requests
  ; Alcotest.test_case "legacy-render-read-thread-apis-are-removed-test" `Quick
      test_legacy_render_read_thread_apis_are_removed
  ; Alcotest.test_case "worker-exposes-one-normalized-render-snapshots-api-test" `Quick
      test_worker_exposes_one_normalized_render_snapshots_api
  ; Alcotest.test_case "block-snapshot-dependencies-do-not-depend-on-batch-order-test" `Quick
      test_block_snapshot_dependencies_do_not_depend_on_batch_order
  ; Alcotest.test_case "render-snapshots-thread-api-fails-fast-without-a-database-test" `Quick
      test_render_snapshots_thread_api_fails_fast_without_a_database
  ; Alcotest.test_case "page-identity-resource-resolves-only-the-page-uuid-test" `Quick
      test_page_identity_resource_resolves_only_the_page_uuid
  ; Alcotest.test_case "sidebar-page-resources-track-favorites-status-and-recent-page-content-test" `Quick
      test_sidebar_page_resources
  ; Alcotest.test_case "missing-page-identity-keeps-a-creation-watch-key-test" `Quick
      test_missing_page_identity_keeps_a_creation_watch_key
  ; Alcotest.test_case "page-preview-source-resource-resolves-aliases-to-one-uuid-test" `Quick
      test_page_preview_source_resolves_aliases
  ; Alcotest.test_case "page-preview-source-resource-keeps-the-page-without-an-alias-test" `Quick
      test_page_preview_source_keeps_page_without_alias
  ; Alcotest.test_case "block-breadcrumb-resource-returns-only-ordered-uuids-test" `Quick
      test_block_breadcrumb_resource_returns_only_ordered_uuids
  ; Alcotest.test_case "block-breadcrumb-resource-honors-the-requested-depth-test" `Quick
      test_block_breadcrumb_resource_honors_requested_depth
  ; Alcotest.test_case "block-breadcrumb-resource-includes-ref-titles-and-exact-watch-keys-test" `Quick
      test_block_breadcrumb_resource_includes_ref_titles
  ; Alcotest.test_case "block-breadcrumb-resource-returns-empty-payload-for-missing-blocks-test" `Quick
      test_block_breadcrumb_resource_returns_empty_payload_for_missing
  ; Alcotest.test_case "block-breadcrumb-keeps-root-first-order-when-zoomed-into-nested-page-block-test" `Quick
      test_block_breadcrumb_keeps_root_first_order
  ; Alcotest.test_case "journals-resource-returns-only-ordered-uuids-test" `Quick
      test_journals_resource_returns_only_ordered_uuids
  ; Alcotest.test_case "journals-resource-does-not-prewarm-roots-test" `Quick
      test_journals_resource_does_not_prewarm_roots
  ; Alcotest.test_case "journal-bundle-resource-is-removed-test" `Quick
      test_journal_bundle_resource_is_removed
  ; Alcotest.test_case "canonical-visible-blocks-keep-properties-without-preloading-breadcrumbs-test" `Quick
      test_canonical_visible_blocks_keep_properties
  ; Alcotest.test_case "block-reactions-resource-returns-final-render-summary-test" `Quick
      test_block_reactions_resource_returns_final_render_summary
  ; Alcotest.test_case "block-display-properties-resource-returns-only-normalized-entity-identities-test" `Quick
      test_block_display_properties_returns_normalized_identities
  ; Alcotest.test_case "block-display-properties-resource-includes-configured-class-properties-test" `Quick
      test_block_display_properties_includes_configured_class_properties
  ; Alcotest.test_case "block-bidirectional-properties-resource-returns-uuid-groups-test" `Quick
      test_block_bidirectional_properties_returns_uuid_groups
  ; Alcotest.test_case "block-bidirectional-properties-resource-has-an-authoritative-empty-value-test" `Quick
      test_block_bidirectional_properties_empty_value
  ; Alcotest.test_case "block-ref-count-resource-uses-the-target-reference-key-test" `Quick
      test_block_ref_count_uses_target_reference_key
  ; Alcotest.test_case "block-ref-count-resource-has-an-authoritative-zero-test" `Quick
      test_block_ref_count_authoritative_zero
  ; Alcotest.test_case "block-ref-count-resource-skips-class-incoming-refs-test" `Quick
      test_block_ref_count_skips_class_incoming_refs
  ; Alcotest.test_case "block-ref-count-resource-skips-property-incoming-refs-test" `Quick
      test_block_ref_count_skips_property_incoming_refs
  ; Alcotest.test_case "block-unlinked-ref-exists-resource-gates-empty-reference-views-test" `Quick
      test_block_unlinked_ref_exists_gates_empty_reference_views
  ; Alcotest.test_case "block-comment-threads-resource-returns-only-ordered-thread-uuids-test" `Quick
      test_block_comment_threads_returns_only_ordered_thread_uuids
  ; Alcotest.test_case "block-comment-threads-resource-has-an-authoritative-empty-value-test" `Quick
      test_block_comment_threads_empty_value
  ; Alcotest.test_case "block-comment-summary-resource-returns-plain-summary-and-exact-watches-test" `Quick
      test_block_comment_summary_plain_summary_and_watches
  ; Alcotest.test_case "block-comment-summary-resource-has-an-authoritative-empty-value-test" `Quick
      test_block_comment_summary_empty_value
  ; Alcotest.test_case "block-comment-summary-resource-rejects-invalid-uuid-and-thread-test" `Quick
      test_block_comment_summary_rejects_invalid_uuid_and_thread
  ; Alcotest.test_case "block-task-time-resource-normalizes-statuses-and-uses-an-explicit-clock-test" `Quick
      test_block_task_time_normalizes_statuses
  ; Alcotest.test_case "block-task-time-resource-preserves-custom-status-uuid-test" `Quick
      test_block_task_time_preserves_custom_status_uuid
  ; Alcotest.test_case "block-task-time-resource-has-an-authoritative-empty-value-test" `Quick
      test_block_task_time_empty_value
  ; Alcotest.test_case "route-block-resource-watches-the-page-lookup-and-resolved-entities-test" `Quick
      test_route_block_resource_watches_lookup_and_entities
  ; Alcotest.test_case "missing-route-block-keeps-the-page-lookup-and-page-entity-watch-test" `Quick
      test_missing_route_block_keeps_watch
  ; Alcotest.test_case "route-block-resource-reuses-reference-aware-page-route-matching-test" `Quick
      test_route_block_resource_reuses_reference_aware_matching
  ; Alcotest.test_case "missing-route-block-is-invalidated-when-a-heading-starts-matching-test" `Quick
      test_missing_route_block_is_invalidated_when_heading_matches
  ; Alcotest.test_case "class-page-membership-returns-only-visible-direct-child-uuids-test" `Quick
      test_class_page_membership_returns_visible_children
  ; Alcotest.test_case "stale-class-page-membership-returns-direct-children-after-tag-conversion-test" `Quick
      test_stale_class_page_membership_after_tag_conversion
  ; Alcotest.test_case "property-page-membership-watches-its-property-ident-test" `Quick
      test_property_page_membership_watches_ident
  ; Alcotest.test_case "quick-add-page-membership-keeps-unowned-and-current-user-blocks-test" `Quick
      test_quick_add_page_membership_keeps_unowned_and_current_user
  ; Alcotest.test_case "views-resource-returns-only-ordered-definition-uuids-test" `Quick
      test_views_resource_returns_only_ordered_definition_uuids
  ; Alcotest.test_case "view-data-resource-supports-every-feature-with-flat-uuid-rows-test" `Quick
      test_view_data_resource_supports_every_feature_flat_rows
  ; Alcotest.test_case "query-view-data-resource-returns-property-maps-for-columns-test" `Quick
      test_query_view_data_returns_property_maps_for_columns
  ; Alcotest.test_case "query-view-data-keeps-projected-columns-even-without-values-test" `Quick
      test_query_view_data_keeps_projected_columns
  ; Alcotest.test_case "view-data-resource-returns-empty-rows-after-the-view-is-deleted-test" `Quick
      test_view_data_returns_empty_rows_after_view_deleted
  ; Alcotest.test_case "all-pages-view-data-returns-the-first-window-ids-without-row-snapshots-test" `Quick
      test_all_pages_view_data_returns_first_window_ids
  ; Alcotest.test_case "class-objects-view-data-returns-the-first-window-ids-without-row-snapshots-test" `Quick
      test_class_objects_view_data_returns_first_window_ids
  ; Alcotest.test_case "all-pages-view-data-row-offset-returns-the-scrolled-window-without-remaining-ids-test" `Quick
      test_all_pages_view_data_row_offset
  ; Alcotest.test_case "opaque-query-resource-declares-watch-all-test" `Quick
      test_opaque_query_resource_declares_watch_all
  ; Alcotest.test_case "query-view-resource-supports-transient-missing-feature-type-test" `Quick
      test_query_view_resource_supports_transient_missing_feature_type
  ; Alcotest.test_case "view-data-resource-normalizes-grouped-and-grouped-list-partitions-test" `Quick
      test_view_data_resource_normalizes_partitions
  ; Alcotest.test_case "blank-dsl-query-resource-renders-an-empty-result-test" `Quick
      test_blank_dsl_query_resource_renders_empty_result
  ; Alcotest.test_case "query-resource-resolves-advanced-page-block-and-today-inputs-test" `Quick
      test_query_resource_resolves_advanced_inputs
  ; Alcotest.test_case "query-resource-keeps-escaped-paren-regex-inputs-test" `Quick
      test_query_resource_keeps_escaped_paren_regex_inputs
  ; Alcotest.test_case "render-snapshots-isolates-failing-query-resources-test" `Quick
      test_render_snapshots_isolates_failing_query_resources
  ; Alcotest.test_case "query-resource-injects-built-in-rules-and-merges-user-rules-test" `Quick
      test_query_resource_injects_builtin_rules
  ; Alcotest.test_case "query-resource-preserves-scalar-tuples-test" `Quick
      test_query_resource_preserves_scalar_tuples
  ; Alcotest.test_case "query-resource-renders-partial-block-pulls-as-blocks-test" `Quick
      test_query_resource_renders_partial_block_pulls_as_blocks
  ; Alcotest.test_case "partial-block-pull-filters-hidden-and-deleted-results-test" `Quick
      test_partial_block_pull_filters_hidden_and_deleted
  ; Alcotest.test_case "query-resource-keeps-pull-maps-without-uuid-test" `Quick
      test_query_resource_keeps_pull_maps_without_uuid
  ; Alcotest.test_case "quoted-full-text-query-uses-worker-search-and-filters-results-test" `Quick
      test_quoted_full_text_query_uses_worker_search
  ; Alcotest.test_case "view-and-query-resources-reject-non-data-contracts-test" `Quick
      test_view_and_query_resources_reject_non_data_contracts
  ; Alcotest.test_case "block-sync-conflicts-resource-is-owned-by-the-sync-state-provider-test" `Quick
      test_block_sync_conflicts_resource_owned_by_sync_state_provider
  ; Alcotest.test_case "render-resource-dispatch-rejects-unknown-and-malformed-keys-test" `Quick
      test_render_resource_dispatch_rejects_unknown_and_malformed_keys ]
