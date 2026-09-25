(* 1:1 translations of the cljs unit tests under
   src/test/frontend/worker/handler/:

   Sources:
   - block_test.cljs       — canonical-block / canonical-blocks /
     direct-children-membership / open-block-tree /
     get-block-and-children / property-handler positioned helpers
   - comments_test.cljs    — comments handler (ensure/delete/get)
   - property_test.cljs    — property handler (selector data,
     display-properties, display-property-map, positioned properties,
     get-class-properties, closed values, pull regression)
   - transaction_test.cljs — thread-api/apply-outliner-ops plumbing

   cljs deftest names are kept as OCaml test names.

   Fixture mapping:
   - cljs db-test/create-conn -> Sqlite_export.create_conn () (full
     seeded graph: built-in properties/classes, status+priority closed
     values with icons).
   - cljs db-test/create-conn-with-blocks -> create_conn () +
     Db_test_util.build_blocks_tx + transact_maps (record DSL
     equivalents of the cljs {:properties :classes :pages-and-blocks}
     options). Sqlite_build.create_blocks works now (the keyword-keyed
     :build/properties and #uuid-literal bugs below are fixed), but the
     fixtures keep the Db_test_util DSL — same datoms, no EDN round-trip.
   - comments/property fixtures re-transact
     sqlite-create-graph/build-db-initial-data "{}" after
     create-conn-with-blocks; Sqlite_export.create_conn already seeds
     that data, so the redundant re-transact is omitted (divergence,
     noted, not behavior-changing).
   - cljs (random-uuid) -> a fixed uuid literal per call site.
   - Lazy entities bind a db snapshot — entities are re-resolved after
     each transact.

   cljs with-redefs / plumbing divergences:
   - transaction_test redefs outliner-op/apply-ops!,
     db-listener/take-outliner-op-delta!, take-outliner-op-perf!,
     block-handler/canonical-blocks and get-block-and-children. OCaml
     has injection points only for canonical-blocks
     (Sync_deps.canonical_blocks_fn) and the listener delta store
     (Db_listener.note_outliner_op_delta seeds what
     take_outliner_op_delta returns). The real endpoint is invoked with
     a real no-op op (move-blocks-up-down on missing uuids) instead of
     the cljs stubbed [:save-block []], so :result is Wire.Nil rather
     than the stub map. The cljs test passes a #uuid as :ui/perf-id;
     the OCaml endpoint only reads ui/perf-id as a string, so the perf
     id is passed as a string (lib divergence — cljs wire callers send
     uuids).
   - canonical-block-batch-shares-positioned-property-work-test counts
     property-handler/property-closed-values calls via with-redefs.
     Endpoint_property.property_closed_values is a plain function with
     no injection point; the shared-cache behavior is asserted
     indirectly (all 50 canonical blocks produced, identical status
     choice rows shared across the batch).
   - cljs (d/pull db '[* {:property/closed-values [*]}] ident) throws a
     #"db\.type/ref" message; the OCaml pull parser rejects the
     non-ref virtual attr with "pull map spec requires ref attr".
     Asserted with the OCaml message; intent identical.
   - entity/page? class? property? journal? url-property-value? are
     asserted via local wire-map predicates over canonical
     shallow-identity refs (entity.cljs semantics on plain maps).
   - get-class-properties is invoked as the endpoint body does
     (Outliner_property.get_class_properties + property_plain_map);
     the cljs test calls the handler fn which returns the same maps.

   Resolved lib bugs (documented while red; all fixed since):
   - Db_property_build.build_property_values_tx_m read
     original-property-id / db/ident via Block_map.string_attr
     (String-only) while Sqlite_build.build_property_map_for_pvalue_tx
     wrote them as Keyword values, so Sqlite_build.create_blocks threw
     "Key in map must have a :db/ident" for keyword-keyed
     :build/properties entries. Fixed — it now accepts both.
   - Edn_util.read_string mapped #uuid literals to
     Tuple [Symbol "uuid"; String] instead of Datascript.Uuid; fixture
     paths feeding create_blocks options through it lost uuid values.
     Fixed — it now returns Uuid.
   - datascript-ocaml rejected nested Map values on non-ref attrs in
     entity-map tx form ("nested entity attribute requires ref
     schema"); cljs accepts them as raw map values. Fixed upstream.
     The canonical-block fixture still stores a plain string under
     :block/properties (the attr is excluded from canonical output —
     assertion intent unchanged), and fixture code emits
     :logseq.property/icon maps via [:db/add ...] ops rather than
     entity-map form (see Db_test_util.op_db_add). *)

open Datascript
open Test_shared

(* Endpoint modules self-register via top-level Dispatcher.register
   effects; force module init before invoking by name. *)
let () = Worker_core.init ()

let kw s = Wire.Keyword s
let kwm entries = Wire.Map (List.map (fun (k, v) -> (kw k, v)) entries)

(* ---------- wire helpers ---------- *)

(* (get-in m [k i k ...]) — `K map-key, `I seq index *)
let get_in (w : Wire.t) (path : [ `K of string | `I of int ] list) :
    Wire.t option =
  List.fold_left
    (fun acc p ->
      Option.bind acc (fun w ->
          match p with
          | `K k -> Wire.get k w
          | `I i -> Wire.nth w i))
    (Some w) path

let wg (w : Wire.t) (k : string) : Wire.t option = Wire.get k w
let wseq (w : Wire.t) : Wire.t list = Wire.as_seq w
let wmap (w : Wire.t) : (Wire.t * Wire.t) list = Wire.as_map w
let wkeys (w : Wire.t) : string list =
  List.filter_map (fun (k, _) -> Wire.as_keyword k) (wmap w)
let wuuid (w : Wire.t option) : string option =
  Option.bind w Wire.as_uuid
let wkw (w : Wire.t option) : string option =
  Option.bind w Wire.as_keyword
let wstr (w : Wire.t option) : string option =
  Option.bind w Wire.as_string
let wint (w : Wire.t option) : int option = Option.bind w Wire.as_int
let wbool (w : Wire.t option) : bool option =
  Option.bind w Wire.as_bool
(* block/uuid of a wire map *)
let map_uuid (m : Wire.t) : string option =
  match wg m "block/uuid" with
  | Some (Wire.Uuid u) -> Some u
  | Some (Wire.String u) -> Some u
  | _ -> None

let map_title (m : Wire.t) : string option = wstr (wg m "block/title")
let map_ident (m : Wire.t) : string option = wkw (wg m "db/ident")

(* sorted set of uuid strings for cljs (set (keys m)) comparisons *)
let uuid_key_set (m : Wire.t) : string list =
  List.sort_uniq String.compare
    (List.filter_map (fun (k, _) -> Wire.as_uuid k) (wmap m))

(* ---------- entity.cljs predicates on canonical ref maps ---------- *)

let tagged_with_ident (v : Wire.t) (tag_ident : string) : bool =
  match wg v "block/tags" with
  | None -> false
  | Some tags ->
      List.exists
        (fun t -> wg t "db/ident" = Some (Wire.Keyword tag_ident))
        (wseq tags)

let entity_page_w (v : Wire.t) : bool =
  List.exists (tagged_with_ident v)
    [ "logseq.class/Page"; "logseq.class/Journal"; "logseq.class/Tag"
    ; "logseq.class/Property" ]
let entity_class_w (v : Wire.t) : bool =
  tagged_with_ident v "logseq.class/Tag"
let entity_property_w (v : Wire.t) : bool =
  tagged_with_ident v "logseq.class/Property"
let entity_journal_w (v : Wire.t) : bool =
  tagged_with_ident v "logseq.class/Journal"

(* entity/url-property-value? — :logseq.property/created-from-property
   points at a :url typed property *)
let url_property_value_w (v : Wire.t) : bool =
  match wg v "logseq.property/created-from-property" with
  | Some p -> wg p "logseq.property/type" = Some (Wire.Keyword "url")
  | None -> false

(* ---------- throw assertions ---------- *)

let str_contains (s : string) (sub : string) : bool =
  let ls = String.length s and lsub = String.length sub in
  let rec loop i =
    i + lsub <= ls && (String.sub s i lsub = sub || loop (i + 1))
  in
  lsub = 0 || loop 0

let exn_message (e : exn) : string =
  match e with
  | Dispatcher.Exn_info (msg, _) -> msg
  | Outliner_validate.Notification w ->
      (match Wire.get "payload" w with
       | Some p ->
           (match Wire.get "message" p with
            | Some (Wire.String s) -> s
            | _ -> "")
       | None -> "")
  | Failure s | Invalid_argument s -> s
  | _ -> Printexc.to_string e

let throws_with (name : string) (needle : string) (f : unit -> _) : unit =
  let ok =
    (try
       ignore (f ());
       false
     with e -> str_contains (exn_message e) needle)
  in
  check name ok

let throws_any (name : string) (f : unit -> _) : unit =
  let ok =
    (try
       ignore (f ());
       false
     with _ -> true)
  in
  check name ok

(* ---------- fixtures ---------- *)

(* cljs (random-uuid) — deterministic literal per call site *)
let uuid_seq = ref 0
let fresh_uuid () =
  incr uuid_seq;
  Printf.sprintf "aa000000-0000-4000-8000-%012d" !uuid_seq

let uuid_of_index (prefix : int) (index : int) : string =
  Printf.sprintf "%02x000000-0000-4000-8000-%012d" prefix index

(* cljs db-test/create-conn — full seeded graph. Seeding takes ~25s, so
   the seeded db snapshot is built once and every conn clones it via
   conn_from_db (structural sharing — transacts never mutate the
   snapshot). *)
let seeded_db : db option ref = ref None

let create_conn () : conn =
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

(* cljs db-test/create-conn-with-blocks — seeded conn plus the
   create-conn-with-blocks options. The Db_test_util record DSL
   (build_blocks_tx + transact_maps) is used rather than
   Sqlite_build.create_blocks: the EDN options path cannot express
   keyword-keyed :build/properties (see Known issues) and
   Edn_util.read_string maps #uuid literals to Tuple so :build/closed-values
   :uuid fields are lost. *)
let create_conn_with_blocks ?(properties = []) ?(classes = [])
    ?(pages_and_blocks = []) () : conn =
  let conn = create_conn () in
  let init_tx, block_props_tx =
    Db_test_util.build_blocks_tx
      { Db_test_util.default_options with properties; classes; pages_and_blocks }
  in
  if init_tx <> [] then Db_test_util.transact_maps conn init_tx;
  if block_props_tx <> [] then Db_test_util.transact_maps conn block_props_tx;
  conn

let ent_uuid (db : db) (u : string) : entity option = entity_at_uuid db u
let ent_uuid_exn (db : db) (u : string) : entity =
  match entity_at_uuid db u with
  | Some e -> e
  | None -> failwith ("no entity for uuid " ^ u)

let block_by_content (db : db) (t : string) : entity =
  match Db_test_util.find_block_by_content db t with
  | Some e -> e
  | None -> failwith ("no block titled " ^ t)

let fresh_cache () : Block_breadcrumb.cache = Hashtbl.create 64

(* cljs (block-handler/canonical-block @conn entity) *)
let canonical_block (db : db) (block : entity) : Wire.t =
  Render_snapshot.canonical_block ~ref_cache:(fresh_cache ()) db block

let canonical_blocks (db : db) (block_uuids : Wire.t list) : Wire.t =
  Render_snapshot.canonical_blocks db block_uuids

let canonical_blocks_uuids (db : db) (uuids : string list) : Wire.t =
  canonical_blocks db (List.map (fun u -> Wire.Uuid u) uuids)

let blocks_map (resp : Wire.t) : (Wire.t * Wire.t) list =
  match wg resp "blocks" with
  | Some m -> wmap m
  | None -> []

let block_row (resp : Wire.t) (uuid : string) : Wire.t option =
  List.assoc_opt (Wire.Uuid uuid) (blocks_map resp)

(* ---------- canonical-block fixture (cljs canonical-block-fixture) ---------- *)

let page_uuid = "10000000-0000-0000-0000-000000000001"
let parent_uuid = "10000000-0000-0000-0000-000000000002"
let ref_uuid = "10000000-0000-0000-0000-000000000003"
let tag_uuid = "10000000-0000-0000-0000-000000000004"
let target_uuid = "10000000-0000-0000-0000-000000000005"
let order_type_uuid = "10000000-0000-0000-0000-000000000006"
let excluded_uuid = "10000000-0000-0000-0000-000000000007"

let canonical_block_fixture () : conn =
  let conn = create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/id -1\n\
       \  :block/uuid #uuid \"10000000-0000-0000-0000-000000000001\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Page\"\n\
       \  :block/name \"page\"\n\
       \  :block/tags :logseq.class/Page}\n\
       {:db/id -2\n\
       \  :block/uuid #uuid \"10000000-0000-0000-0000-000000000002\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Parent\"\n\
       \  :block/page -1\n\
       \  :block/parent -1\n\
       \  :block/order \"a0\"}\n\
       {:db/id -3\n\
       \  :block/uuid #uuid \"10000000-0000-0000-0000-000000000003\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Referenced title must not be copied\"}\n\
       {:db/id -4\n\
       \  :db/ident :user.class/Test\n\
       \  :block/uuid #uuid \"10000000-0000-0000-0000-000000000004\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Referenced tag title must not be copied\"\n\
       \  :logseq.property.class/hide-from-node true\n\
       \  :logseq.property/choice-exclusions [-7]}\n\
       {:db/id -7\n\
       \  :block/uuid #uuid \"10000000-0000-0000-0000-000000000007\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Excluded choice\"}\n\
       {:db/id -6\n\
       \  :block/uuid #uuid \"10000000-0000-0000-0000-000000000006\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"number\"\n\
       \  :logseq.property/created-from-property :logseq.property/order-list-type}\n\
       {:db/id -5\n\
       \  :block/uuid #uuid \"10000000-0000-0000-0000-000000000005\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Target\"\n\
       \  :block/page -1\n\
       \  :block/parent -2\n\
       \  :block/order \"a1\"\n\
       \  :block/link -3\n\
       \  :block/refs [-3]\n\
       \  :block/tags [-4]\n\
       \  :block/collapsed? true\n\
       \  :logseq.property/order-list-type -6\n\
       \  :block/created-at 1000\n\
       \  :user.property/priority \"high\"\n\
       \  :block/children \"legacy tree\"\n\
       \  :block/properties \"legacy\"\n\
       \  :block.temp/load-status :full}]");
  conn

(* cljs assert-shallow-identity-ref *)
let shallow_identity_allowed_keys =
  [ "db/id"; "block/uuid"; "db/ident"; "block/title"; "block/name"
  ; "block/tags"; "logseq.property/value"; "logseq.property/icon"
  ; "logseq.property/type"; "db/cardinality"
  ; "logseq.property.class/hide-from-node"
  ; "logseq.property/choice-exclusions"; "logseq.property.asset/type"
  ; "logseq.property.asset/width"; "logseq.property.asset/height"
  ; "logseq.property.asset/resize-metadata"
  ; "logseq.property.asset/external-url" ]

let assert_shallow_identity_ref (label : string) (reference : Wire.t) : unit =
  check (label ^ ": ref is a map") (match reference with Wire.Map _ -> true | _ -> false);
  check (label ^ ": ref has :db/id") (wg reference "db/id" <> None);
  check (label ^ ": ref has uuid or ident")
    (wuuid (wg reference "block/uuid") <> None
     || wkw (wg reference "db/ident") <> None);
  List.iter
    (fun k ->
      check (label ^ ": allowed key " ^ k)
        (List.mem k shallow_identity_allowed_keys))
    (wkeys reference)

(* ================= block_test.cljs ================= *)

(* (deftest canonical-property-reference-values-keep-type-tags-test ...) *)
let test_canonical_property_reference_values_keep_type_tags () =
  let conn = create_conn () in
  let block_uuid = fresh_uuid () in
  let cases =
    [ "user.property/Page", -11, "logseq.class/Page", entity_page_w
    ; "user.property/Class", -12, "logseq.class/Tag", entity_class_w
    ; "user.property/Property", -13, "logseq.class/Property", entity_property_w
    ; "user.property/Journal", -14, "logseq.class/Journal", entity_journal_w ]
  in
  let prop_txs =
    List.mapi
      (fun i (ident, _, _, _) ->
        Printf.sprintf
          "{:db/id %d :db/ident :%s :db/valueType :db.type/ref \
           :db/cardinality :db.cardinality/one}"
          (-20 - i) ident)
      cases
  and target_txs =
    List.map
      (fun (_, target_id, tag_ident, _) ->
        Printf.sprintf
          "{:db/id %d :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"%s\" :block/name \"%s\" :block/tags :%s}"
          target_id (fresh_uuid ()) tag_ident tag_ident tag_ident)
      cases
  and block_tx =
    Printf.sprintf
      "{:db/id -2 :block/uuid #uuid \"%s\" :block/tx-id 1 \
       :block/title \"Block\"%s}"
      block_uuid
      (String.concat ""
         (List.map
            (fun (ident, tid, _, _) ->
              Printf.sprintf " :%s %d" ident tid)
            cases))
  in
  ignore
    (Datascript.transact_conn_string conn
       ("[" ^ String.concat " " (prop_txs @ target_txs @ [ block_tx ]) ^ "]"));
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db block_uuid) in
  List.iter
    (fun (ident, _, tag_ident, predicate) ->
      let value =
        match wg block ident with
        | Some v -> v
        | None -> failwith ("missing " ^ ident)
      in
      check (ident ^ " tag ident")
        (get_in value [ `K "block/tags"; `I 0; `K "db/ident" ]
         = Some (Wire.Keyword tag_ident));
      check (ident ^ " keeps renderer type identity") (predicate value))
    cases

(* (deftest canonical-property-values-retain-source-property-type-test ...) *)
let test_canonical_property_values_retain_source_property_type () =
  let conn = canonical_block_fixture () in
  let property_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1\n\
          \  :block/uuid #uuid \"%s\"\n\
          \  :block/title \"URL\"\n\
          \  :db/ident :user.property/URL\n\
          \  :db/valueType :db.type/ref\n\
          \  :db/cardinality :db.cardinality/many\n\
          \  :block/tags :logseq.class/Property\n\
          \  :logseq.property/type :url}\n\
          {:block/uuid #uuid \"%s\"\n\
          \  :logseq.property/created-from-property -1}]"
          property_uuid target_uuid));
  List.iter
    (fun property_type ->
      ignore
        (Datascript.transact_conn_string conn
           (Printf.sprintf
              "[{:block/uuid #uuid \"%s\" :logseq.property/type :%s}]"
              property_uuid property_type));
      let db = db_of conn in
      let block = canonical_block db (ent_uuid_exn db target_uuid) in
      check ("source property type " ^ property_type)
        (get_in block
           [ `K "logseq.property/created-from-property"
           ; `K "logseq.property/type" ]
         = Some (Wire.Keyword property_type));
      check "created-from cardinality"
        (get_in block
           [ `K "logseq.property/created-from-property"; `K "db/cardinality" ]
         = Some (Wire.Keyword "db.cardinality/many"));
      check ("url-property-value? " ^ property_type)
        (url_property_value_w block = (property_type = "url")))
    [ "url"; "default" ];
  let db = db_of conn in
  check "page is not a url property value"
    (not (url_property_value_w (canonical_block db (ent_uuid_exn db page_uuid))))

(* (deftest canonical-block-keeps-own-attributes-and-only-shallow-references-test ...) *)
let test_canonical_block_keeps_own_attributes () =
  let conn = canonical_block_fixture () in
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db target_uuid) in
  let references =
    List.filter_map (fun k -> wg block k)
      [ "block/page"; "block/parent"; "block/link" ]
    @ wseq (Option.value (wg block "block/tags") ~default:Wire.Nil)
  in
  check "select-keys own attrs"
    (wuuid (wg block "block/uuid") = Some target_uuid
     && wint (wg block "block/tx-id") = Some 10
     && wstr (wg block "block/title") = Some "Target"
     && wstr (wg block "block/order") = Some "a1"
     && wbool (wg block "block/collapsed?") = Some true
     && wint (wg block "block/created-at") = Some 1000
     && wstr (wg block "user.property/priority") = Some "high");
  check "4 shallow references" (List.length references = 4);
  List.iteri
    (fun i r -> assert_shallow_identity_ref ("ref " ^ string_of_int i) r)
    references;
  check "plain titles skip :block/refs" (wg block "block/refs" = None);
  check "tag choice-exclusions keep shallow uuid"
    (wuuid
       (get_in block
          [ `K "block/tags"; `I 0
          ; `K "logseq.property/choice-exclusions"; `I 0
          ; `K "block/uuid" ])
     = Some excluded_uuid);
  check "tag hide-from-node kept"
    (get_in block
       [ `K "block/tags"; `I 0; `K "logseq.property.class/hide-from-node" ]
     = Some (Wire.Bool true));
  check "order-list-type title kept"
    (wstr
       (get_in block [ `K "logseq.property/order-list-type"; `K "block/title" ])
     = Some "number");
  check "order-list-index"
    (wint (wg block "block.temp/order-list-index") = Some 1);
  check "positioned-properties is a map"
    (match wg block "block.temp/positioned-properties" with
     | Some (Wire.Map _) -> true
     | _ -> false);
  check "no block.temp/breadcrumb" (wg block "block.temp/breadcrumb" = None);
  check "refs-count is an integer"
    (match wg block "block.temp/refs-count" with
     | Some (Wire.Int _) -> true
     | _ -> false);
  check "no block.temp/property-keys" (wg block "block.temp/property-keys" = None);
  check "no block/children" (wg block "block/children" = None);
  check "no block/properties" (wg block "block/properties" = None);
  check "no other block.temp keys"
    (List.for_all
       (fun k ->
         not
           (String.length k > 10
            && String.sub k 0 10 = "block.temp"
            && not
                 (List.mem k
                    [ "block.temp/positioned-properties"
                    ; "block.temp/order-list-index"
                    ; "block.temp/refs-count"
                    ; "block.temp/has-children?"
                    ; "block.temp/class-property-idents" ])))
       (wkeys block))

(* (deftest canonical-block-marks-class-provided-property-idents-test ...) *)
let test_canonical_block_marks_class_provided_property_idents () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "task only"
                  ; b_tags = [ "logseq.class/Task" ] }
              ; Db_test_util.{ default_block with b_title = Some "plain" } ] } ]
      ()
  in
  let db = db_of conn in
  let task_row = canonical_block db (block_by_content db "task only") in
  let plain_row = canonical_block db (block_by_content db "plain") in
  let has_status_ident (row : Wire.t) : bool =
    match wg row "block.temp/class-property-idents" with
    | Some s -> List.mem (Wire.Keyword "logseq.property/status") (wseq s)
    | None -> false
  in
  check "task member row advertises class-provided status ident"
    (has_status_ident task_row);
  check "untagged row does not advertise status ident"
    (not (has_status_ident plain_row))

(* (deftest canonical-block-numbers-ref-typed-list-siblings-test ...) *)
let test_canonical_block_numbers_ref_typed_list_siblings () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let pa_uuid = fresh_uuid () in
  let type_uuid = fresh_uuid () in
  let a_uuid = fresh_uuid () in
  let b_uuid = fresh_uuid () in
  let c_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"List page\" :block/name \"list page\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -2 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"parent\" :block/page -1 :block/parent -1 \
           :block/order \"a0\"}\n\
          {:db/id -3 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"number\" \
           :logseq.property/created-from-property :logseq.property/order-list-type}\n\
          {:db/id -4 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"a\" :block/page -1 :block/parent -2 \
           :block/order \"a1\" :logseq.property/order-list-type -3}\n\
          {:db/id -5 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"b\" :block/page -1 :block/parent -2 \
           :block/order \"a2\" :logseq.property/order-list-type -3}\n\
          {:db/id -6 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"c\" :block/page -1 :block/parent -2 \
           :block/order \"a3\" :logseq.property/order-list-type -3}]"
          p_uuid pa_uuid type_uuid a_uuid b_uuid c_uuid));
  let db = db_of conn in
  let indexes =
    List.map
      (fun u -> wint (wg (canonical_block db (ent_uuid_exn db u))
                          "block.temp/order-list-index"))
      [ a_uuid; b_uuid; c_uuid ]
  in
  check "sibling number-list indexes stay 1. 2. 3."
    (indexes = [ Some 1; Some 2; Some 3 ])

(* (deftest canonical-block-keeps-empty-placeholder-priority-ident-test ...) *)
let test_canonical_block_keeps_empty_placeholder_priority_ident () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let block_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Priority page\" :block/name \"priority page\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -2 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"No priority test\" :block/page -1 \
           :block/parent -1 :block/order \"a0\" \
           :logseq.property/priority :logseq.property/empty-placeholder}]"
          p_uuid block_uuid));
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db block_uuid) in
  check "empty-placeholder ident survives shallow-ref-identity"
    (wkw
       (get_in block [ `K "logseq.property/priority"; `K "db/ident" ])
     = Some "logseq.property/empty-placeholder")

(* (deftest canonical-view-block-includes-default-groups-sort-order-test ...) *)
let test_canonical_view_block_includes_default_groups_sort_order () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let default_view_uuid = fresh_uuid () in
  let asc_view_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Page\" :block/name \"page\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -2 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"All\" :logseq.property/view-for -1 \
           :logseq.property.view/feature-type :all-pages \
           :logseq.property.view/type :logseq.property.view/type.table}\n\
          {:db/id -3 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Ascending\" :logseq.property/view-for -1 \
           :logseq.property.view/feature-type :all-pages \
           :logseq.property.view/type :logseq.property.view/type.table \
           :logseq.property.view/sort-groups-desc? false}]"
          p_uuid default_view_uuid asc_view_uuid));
  let db = db_of conn in
  check "default descending group order on view blocks"
    (wbool
       (wg
          (canonical_block db (ent_uuid_exn db default_view_uuid))
          "logseq.property.view/sort-groups-desc?")
     = Some true);
  check "explicit ascending selection not overwritten"
    (wbool
       (wg
          (canonical_block db (ent_uuid_exn db asc_view_uuid))
          "logseq.property.view/sort-groups-desc?")
     = Some false)

(* (deftest canonical-block-skips-path-refs-and-plain-title-block-refs-test ...) *)
let test_canonical_block_skips_path_refs () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let actor_uuid = fresh_uuid () in
  let row_uuid = fresh_uuid () in
  let prop_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Movies\" :block/name \"movies\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -2 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Paul Walker\" :block/name \"paul walker\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -3 :db/ident :user.property/actors \
           :db/valueType :db.type/ref :db/cardinality :db.cardinality/many \
           :block/uuid #uuid \"%s\" :block/tx-id 1 :block/title \"Actors\"}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"2 Fast 2 Furious (2003)\" :block/page -1 \
           :block/refs [-1 -2] :block/path-refs [-1 -2] \
           :user.property/actors [-2]}]"
          p_uuid actor_uuid prop_uuid row_uuid));
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db row_uuid) in
  check "plain titles skip :block/refs" (wg block "block/refs" = None);
  check "legacy path-refs excluded" (wg block "block/path-refs" = None);
  check "displayed column values stay shallow identities"
    (wuuid
       (get_in block [ `K "user.property/actors"; `I 0; `K "block/uuid" ])
     = Some actor_uuid);
  check "page-valued cells are one eavt scan"
    (match get_in block [ `K "user.property/actors"; `I 0 ] with
     | Some m ->
         List.sort String.compare (wkeys m)
         = [ "block/name"; "block/tags"; "block/title"; "block/uuid"; "db/id" ]
     | None -> false);
  check "positioned-properties is a map"
    (match wg block "block.temp/positioned-properties" with
     | Some (Wire.Map _) -> true
     | _ -> false);
  check "no block.temp/property-keys" (wg block "block.temp/property-keys" = None)

(* (deftest canonical-block-uses-stored-journal-title-test ...) *)
let test_canonical_block_uses_stored_journal_title () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let journal_uuid = fresh_uuid () in
  let journal_title = "20260915" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Mentioned\" :block/name \"mentioned\" \
           :block/tags :logseq.class/Page}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"%s\" :block/name \"%s\" \
           :block/journal-day 20260915 :block/tags :logseq.class/Journal \
           :block/refs [-1]}]"
          p_uuid journal_uuid journal_title journal_title));
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db journal_uuid) in
  check "stored journal title" (wstr (wg block "block/title") = Some journal_title);
  check "stored journal raw-title"
    (wstr (wg block "block/raw-title") = Some journal_title);
  check "journal rows skip refs" (wg block "block/refs" = None)

(* (deftest canonical-block-full-replacement-drops-retracted-attributes-test ...) *)
let test_canonical_block_full_replacement_drops_retracted_attributes () =
  let conn = canonical_block_fixture () in
  let db = db_of conn in
  let before = canonical_block db (ent_uuid_exn db target_uuid) in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[[:db/retract [:block/uuid #uuid \"%s\"] :block/collapsed? true]\n\
          [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 11]]"
          target_uuid target_uuid));
  let db = db_of conn in
  let after = canonical_block db (ent_uuid_exn db target_uuid) in
  check "before collapsed" (wbool (wg before "block/collapsed?") = Some true);
  check "after tx-id" (wint (wg after "block/tx-id") = Some 11);
  check "retracted attr dropped" (wg after "block/collapsed?" = None)

(* (deftest canonical-block-exposes-page-reference-titles-for-editing-test ...) *)
let test_canonical_block_exposes_page_reference_titles_for_editing () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let block_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Foo\" :block/name \"foo\" \
           :block/tags :logseq.class/Page}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Reference [[%s]]\" :block/refs [-1]}]"
          p_uuid block_uuid p_uuid));
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db block_uuid) in
  check "raw title keeps id ref"
    (wstr (wg block "block/raw-title")
     = Some (Printf.sprintf "Reference [[%s]]" p_uuid));
  check "display title resolves page ref"
    (wstr (wg block "block/title") = Some "Reference [[Foo]]")

(* (deftest canonical-property-includes-derived-closed-values-test ...) *)
let test_canonical_property_includes_derived_closed_values () =
  let conn = canonical_block_fixture () in
  let db = db_of conn in
  let property =
    match entity db (Ident "logseq.property/priority") with
    | Some p -> p
    | None -> failwith "logseq.property/priority not seeded"
  in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf "[[:db/add %d :block/tx-id 10]]" property.id));
  let db = db_of conn in
  let property = ident_ent_exn db "logseq.property/priority" in
  let canonical_property = canonical_block db property in
  let display_property = Endpoint_property.display_property_map db property in
  let display_closed = wg display_property "property/closed-values" in
  check "property rows skip refs-count"
    (wint (wg canonical_property "block.temp/refs-count") = Some 0);
  check "closed values carried on canonical property"
    (wg canonical_property "property/closed-values" = display_closed);
  (match display_closed with
   | Some cvs ->
       check "closed values non-empty" (wseq cvs <> []);
       check "every closed value has a uuid"
         (List.for_all (fun cv -> wuuid (wg cv "block/uuid") <> None) (wseq cvs));
       check "priority titles"
         (List.sort_uniq String.compare
            (List.filter_map map_title (wseq cvs))
          = [ "High"; "Low"; "Medium"; "Urgent" ])
   | None -> check "closed values present" false)

(* (deftest canonical-class-skips-refs-count-test ...) *)
let test_canonical_class_skips_refs_count () =
  let conn = create_conn () in
  let class_uuid = fresh_uuid () in
  let p_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Movie\" :block/name \"movie\" \
           :block/tags :logseq.class/Tag}\n\
          {:db/id -2 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Mentions movie\" :block/refs [-1]}]"
          class_uuid p_uuid));
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db class_uuid) in
  check "class rows skip refs-count"
    (wint (wg block "block.temp/refs-count") = Some 0)

(* (deftest canonical-block-allows-db-id-only-reference-identities-test ...) *)
let test_canonical_block_allows_db_id_only_reference_identities () =
  let conn = create_conn () in
  let block_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :file/path \"assets/image.png\"}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Asset link\" :block/link -1}]"
          block_uuid));
  let db = db_of conn in
  let file_id =
    match entity db (Lookup_ref ("file/path", String "assets/image.png")) with
    | Some e -> e.id
    | None -> failwith "file entity missing"
  in
  let block = canonical_block db (ent_uuid_exn db block_uuid) in
  check "db/id-only ref identity"
    (match wg block "block/link" with
     | Some m -> wmap m = [ (kw "db/id", Wire.Int file_id) ]
     | None -> false)

(* (deftest canonical-block-requires-a-uuid-and-numeric-transaction-id-test ...) *)
let test_canonical_block_requires_uuid_and_numeric_tx_id () =
  let conn = create_conn () in
  let missing_tx_id_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/tx-id 1 :block/title \"Missing UUID\"}\n\
          {:block/uuid #uuid \"%s\" :block/title \"Missing transaction ID\"}\n\
          {:block/uuid \"not-a-uuid\" :block/tx-id 1 \
           :block/title \"Invalid UUID\"}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id \"not-a-number\" \
           :block/title \"Invalid transaction ID\"}]"
          missing_tx_id_uuid (fresh_uuid ())));
  let db = db_of conn in
  throws_any "missing UUID"
    (fun () ->
      match
        result_eids
          (Datascript.q_string db
             "[:find ?e :where [?e :block/title \"Missing UUID\"]]")
      with
      | eid :: _ ->
          ignore
            (canonical_block db
               (match entity db (Entity_id eid) with
                | Some e -> e
                | None -> failwith "missing entity"))
      | [] -> failwith "missing entity");
  throws_any "non-UUID identity"
    (fun () ->
      ignore
        (canonical_block db
           (match entity db (Lookup_ref ("block/uuid", String "not-a-uuid")) with
            | Some e -> e
            | None -> failwith "missing entity")));
  (let db = db_of conn in
   let block = canonical_block db (ent_uuid_exn db missing_tx_id_uuid) in
   check "missing tx-id defaults to zero"
     (wint (wg block "block/tx-id") = Some 0);
   check "read did not write"
     (Ldb.value (ent_uuid_exn db missing_tx_id_uuid) "block/tx-id" = None));
  throws_any "non-numeric transaction ID"
    (fun () ->
      match
        result_eids
          (Datascript.q_string db
             "[:find ?e :where [?e :block/title \"Invalid transaction ID\"]]")
      with
      | eid :: _ ->
          ignore
            (canonical_block db
               (match entity db (Entity_id eid) with
                | Some e -> e
                | None -> failwith "missing entity"))
      | [] -> failwith "missing entity")

(* (deftest missing-revisions-render-as-zero-without-writing-test ...) *)
let test_missing_revisions_render_as_zero () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let child_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/title \"Parent\"}\n\
          {:block/uuid #uuid \"%s\" :block/title \"Child\" \
           :block/parent -1 :block/page -1 :block/order \"a0\"}]"
          p_uuid child_uuid));
  let db = db_of conn in
  let resp = canonical_blocks_uuids db [ p_uuid; child_uuid ] in
  let membership = Endpoint_block.direct_children_membership db p_uuid in
  check "missing revisions render as zero"
    (List.map
       (fun u ->
         match block_row resp u with
         | Some row -> wint (wg row "block/tx-id")
         | None -> None)
       [ p_uuid; child_uuid ]
     = [ Some 0; Some 0 ]);
  check "parent-tx-id defaults to zero"
    (wint (wg membership "parent-tx-id") = Some 0);
  check "items" (
    match wg membership "items" with
    | Some items ->
        wseq items
        = [ Wire.Array [ Wire.Uuid child_uuid; Wire.String "a0" ] ]
    | None -> false);
  check "open-block-tree is a map"
    (match Endpoint_block.open_block_tree db p_uuid with
     | Wire.Map _ -> true
     | _ -> false);
  check "reads did not write tx-ids"
    (List.for_all
       (fun u -> Ldb.value (ent_uuid_exn db u) "block/tx-id" = None)
       [ p_uuid; child_uuid ]);
  List.iter
    (fun revision ->
      ignore
        (Datascript.transact_conn_string conn
           (Printf.sprintf
              "[[:db/add [:block/uuid #uuid \"%s\"] :block/tx-id %d]]"
              p_uuid revision));
      let db = db_of conn in
      check (Printf.sprintf "block tx-id %d" revision)
        (wint
           (wg (canonical_block db (ent_uuid_exn db p_uuid)) "block/tx-id")
         = Some revision);
      check (Printf.sprintf "parent-tx-id %d" revision)
        (wint
           (wg (Endpoint_block.direct_children_membership db p_uuid)
              "parent-tx-id")
         = Some revision))
    [ 0; 12 ];
  List.iter
    (fun revision ->
      ignore
        (Datascript.transact_conn_string conn
           (Printf.sprintf
              "[[:db/add [:block/uuid #uuid \"%s\"] :block/tx-id %s]]"
              p_uuid revision));
      let db = db_of conn in
      throws_any ("canonical-block throws on tx-id " ^ revision)
        (fun () -> ignore (canonical_block db (ent_uuid_exn db p_uuid)));
      throws_any ("membership throws on tx-id " ^ revision)
        (fun () ->
          ignore (Endpoint_block.direct_children_membership db p_uuid)))
    [ "-1"; "1.5"; "false"; "\"invalid\"" ]

(* (deftest canonical-blocks-returns-uuid-keyed-replacements-at-one-basis-test ...) *)
let test_canonical_blocks_returns_uuid_keyed_replacements () =
  let conn = canonical_block_fixture () in
  let db = db_of conn in
  let response = canonical_blocks_uuids db [ target_uuid; page_uuid ] in
  check "basis-rev = max-tx"
    (wint (wg response "basis-rev") = Some db.max_tx);
  let keys = uuid_key_set (Option.value (wg response "blocks") ~default:(Wire.Map [])) in
  check "only requested rows"
    (keys = List.sort String.compare [ page_uuid; target_uuid ]);
  check "unrequested refs target stays out"
    (not (List.mem ref_uuid keys));
  check "plain-title rows skip :block/refs"
    (match block_row response target_uuid with
     | Some row -> wg row "block/refs" = None
     | None -> false);
  List.iter
    (fun (k, row) ->
      let u = match k with Wire.Uuid u -> u | _ -> "" in
      check ("row uuid " ^ u) (wuuid (wg row "block/uuid") = Some u);
      check ("row equals canonical-block " ^ u)
        (row = canonical_block db (ent_uuid_exn db u)))
    (blocks_map response)

(* (deftest canonical-blocks-inlines-positioned-property-definitions-test ...) *)
let test_canonical_blocks_inlines_positioned_property_definitions () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Page" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "task doing"
                  ; b_tags = [ "logseq.class/Task" ]
                  ; b_properties =
                      [ ( "logseq.property/status"
                        , Db_test_util.Kw "logseq.property/status.doing" ) ] } ] } ]
      ()
  in
  let db = db_of conn in
  let task = block_by_content db "task doing" in
  let status_uuid =
    match Ldb.value (ident_ent_exn db "logseq.property/status") "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> failwith "status property has no uuid"
  in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf "[{:db/id %d :block/tx-id 1}]" task.id));
  let db = db_of conn in
  let task_uuid = uuid_of (ent_uuid_exn db (uuid_of task)) in
  let response = canonical_blocks_uuids db [ task_uuid ] in
  let keys = uuid_key_set (Option.value (wg response "blocks") ~default:(Wire.Map [])) in
  check "definitions inlined on the row"
    (keys = [ task_uuid ]);
  check "status property itself not a row"
    (not (List.mem status_uuid keys));
  (match block_row response task_uuid with
   | Some block ->
       check "status at block-left"
         (List.filter_map map_uuid
            (wseq
               (Option.value
                  (get_in block
                     [ `K "block.temp/positioned-properties"; `K "block-left" ])
                  ~default:(Wire.Array [])))
          = [ status_uuid ]);
       check "written status stays on the row"
         (wg block "logseq.property/status" <> None)
   | None -> check "row present" false)

(* (deftest canonical-blocks-omits-absent-requested-uuids-at-the-same-basis-test ...) *)
let test_canonical_blocks_omits_absent_uuids () =
  let conn = canonical_block_fixture () in
  let missing_uuid = fresh_uuid () in
  let db = db_of conn in
  let response = canonical_blocks_uuids db [ target_uuid; missing_uuid ] in
  check "basis-rev = max-tx"
    (wint (wg response "basis-rev") = Some db.max_tx);
  check "missing uuids stay omitted"
    (uuid_key_set
       (Option.value (wg response "blocks") ~default:(Wire.Map []))
     = [ target_uuid ]);
  check "row uuid"
    (match block_row response target_uuid with
     | Some row -> wuuid (wg row "block/uuid") = Some target_uuid
     | None -> false)

let padded_order (index : int) : string =
  Printf.sprintf "a-%s%d"
    (if index < 10 then "00" else if index < 100 then "0" else "")
    index

(* (deftest direct-page-children-membership-is-complete-ordered-and-visible-test ...) *)
let test_direct_page_children_membership () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let property_uuid = fresh_uuid () in
  let children =
    List.init 105 (fun i -> (uuid_of_index 1 i, padded_order i))
  in
  let first_child_uuid = fst (List.hd children) in
  let child_txs =
    List.mapi
      (fun i (u, order) ->
        Printf.sprintf
          "{:block/uuid #uuid \"%s\" :block/tx-id 11 \
           :block/title \"Child %d\" :block/page [:block/uuid #uuid \"%s\"] \
           :block/parent [:block/uuid #uuid \"%s\"] :block/order \"%s\"}"
          u i p_uuid p_uuid order)
      children
  in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/tx-id 10 :block/title \"Page\" \
           :block/name \"page\" :block/tags :logseq.class/Page}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 10 \
           :block/title \"Closed value property\"}]"
          p_uuid property_uuid));
  ignore
    (Datascript.transact_conn_string conn
       ("[[:db/add [:block/uuid #uuid \"" ^ p_uuid ^ "\"] :block/tx-id 11] "
        ^ String.concat " " child_txs ^ "]"));
  let grandchild_uuid = fresh_uuid () in
  let recycled_uuid = fresh_uuid () in
  let closed_uuid = fresh_uuid () in
  let prop_value_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[[:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 12]\n\
          [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 12]\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 12 \
           :block/title \"Grandchild\" :block/page [:block/uuid #uuid \"%s\"] \
           :block/parent [:block/uuid #uuid \"%s\"] \
           :block/order \"a-grandchild\"}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 12 \
           :block/title \"Recycled direct child\" \
           :block/page [:block/uuid #uuid \"%s\"] \
           :block/parent [:block/uuid #uuid \"%s\"] \
           :block/order \"a-recycled\" :logseq.property/deleted-at 1000}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 12 \
           :block/title \"Closed value direct child\" \
           :block/page [:block/uuid #uuid \"%s\"] \
           :block/parent [:block/uuid #uuid \"%s\"] \
           :block/order \"a-closed\" \
           :block/closed-value-property [:block/uuid #uuid \"%s\"]}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 12 \
           :block/title \"Text property value\" \
           :block/page [:block/uuid #uuid \"%s\"] \
           :block/parent [:block/uuid #uuid \"%s\"] \
           :block/order \"a-property-value\" \
           :logseq.property/created-from-property [:block/uuid #uuid \"%s\"]}]"
          p_uuid first_child_uuid grandchild_uuid p_uuid first_child_uuid
          recycled_uuid p_uuid p_uuid closed_uuid p_uuid p_uuid
          property_uuid prop_value_uuid p_uuid p_uuid property_uuid));
  let db = db_of conn in
  let response = Endpoint_block.direct_children_membership db p_uuid in
  check "basis-rev = max-tx"
    (wint (wg response "basis-rev") = Some db.max_tx);
  check "parent-tx-id is latest"
    (wint (wg response "parent-tx-id") = Some 12);
  check "105 items" (
    match wg response "items" with
    | Some items -> List.length (wseq items) = 105
    | None -> false);
  check "ordered items" (
    match wg response "items" with
    | Some items ->
        wseq items
        = List.map
            (fun (u, o) -> Wire.Array [ Wire.Uuid u; Wire.String o ])
            children
    | None -> false)

(* (deftest direct-block-children-membership-does-not-traverse-descendants-test ...) *)
let test_direct_block_children_membership () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let par_uuid = fresh_uuid () in
  let first_child_uuid = fresh_uuid () in
  let second_child_uuid = fresh_uuid () in
  let grandchild_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 20 \
           :block/title \"Page\" :block/name \"page\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -2 :block/uuid #uuid \"%s\" :block/tx-id 21 \
           :block/title \"Parent\" :block/page -1 :block/parent -1 \
           :block/order \"a0\"}\n\
          {:db/id -3 :block/uuid #uuid \"%s\" :block/tx-id 21 \
           :block/title \"First child\" :block/page -1 :block/parent -2 \
           :block/order \"a0\"}\n\
          {:db/id -4 :block/uuid #uuid \"%s\" :block/tx-id 21 \
           :block/title \"Second child\" :block/page -1 :block/parent -2 \
           :block/order \"b0\"}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 21 \
           :block/title \"Grandchild\" :block/page -1 :block/parent -3 \
           :block/order \"a0\"}]"
          p_uuid par_uuid first_child_uuid second_child_uuid grandchild_uuid));
  let db = db_of conn in
  let response = Endpoint_block.direct_children_membership db par_uuid in
  check "basis-rev = max-tx"
    (wint (wg response "basis-rev") = Some db.max_tx);
  check "parent-tx-id"
    (wint (wg response "parent-tx-id") = Some 21);
  check "direct children only" (
    match wg response "items" with
    | Some items ->
        wseq items
        = [ Wire.Array [ Wire.Uuid first_child_uuid; Wire.String "a0" ]
          ; Wire.Array [ Wire.Uuid second_child_uuid; Wire.String "b0" ] ]
    | None -> false)

(* children-map lookup: children keyed by Wire.Uuid *)
let children_entry (tree_children : Wire.t) (uuid : string) : Wire.t option =
  List.assoc_opt (Wire.Uuid uuid) (wmap tree_children)

(* (deftest open-block-tree-includes-open-descendants-and-stops-at-collapsed-blocks-test ...) *)
let test_open_block_tree () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let open_child_uuid = fresh_uuid () in
  let open_grandchild_uuid = fresh_uuid () in
  let collapsed_child_uuid = fresh_uuid () in
  let hidden_grandchild_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 30 \
           :block/title \"Page\" :block/name \"page\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -2 :block/uuid #uuid \"%s\" :block/tx-id 30 \
           :block/title \"Open child\" :block/page -1 :block/parent -1 \
           :block/order \"a0\"}\n\
          {:db/id -3 :block/uuid #uuid \"%s\" :block/tx-id 30 \
           :block/title \"Open grandchild\" :block/page -1 \
           :block/parent -2 :block/order \"a0\"}\n\
          {:db/id -4 :block/uuid #uuid \"%s\" :block/tx-id 30 \
           :block/title \"Collapsed child\" :block/collapsed? true \
           :block/page -1 :block/parent -1 :block/order \"b0\"}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 30 \
           :block/title \"Hidden grandchild\" :block/page -1 \
           :block/parent -4 :block/order \"a0\"}]"
          p_uuid open_child_uuid open_grandchild_uuid collapsed_child_uuid
          hidden_grandchild_uuid));
  let db = db_of conn in
  let tree = Endpoint_block.open_block_tree db p_uuid in
  let blocks = Option.value (wg tree "blocks") ~default:(Wire.Map []) in
  let children = Option.value (wg tree "children") ~default:(Wire.Map []) in
  check "blocks keys"
    (uuid_key_set blocks
     = List.sort String.compare
         [ p_uuid; open_child_uuid; open_grandchild_uuid
         ; collapsed_child_uuid ]);
  check "children keys"
    (uuid_key_set children
     = List.sort String.compare
         [ p_uuid; open_child_uuid; open_grandchild_uuid ]);
  check "root items"
    (match children_entry children p_uuid with
     | Some entry ->
         wseq (Option.value (wg entry "items") ~default:(Wire.Array []))
         = [ Wire.Array [ Wire.Uuid open_child_uuid; Wire.String "a0" ]
           ; Wire.Array [ Wire.Uuid collapsed_child_uuid; Wire.String "b0" ] ]
     | None -> false);
  check "open child items"
    (match children_entry children open_child_uuid with
     | Some entry ->
         wseq (Option.value (wg entry "items") ~default:(Wire.Array []))
         = [ Wire.Array [ Wire.Uuid open_grandchild_uuid; Wire.String "a0" ] ]
     | None -> false)

(* (deftest direct-children-membership-defaults-missing-parent-transaction-id-test ...) *)
let test_direct_children_membership_defaults_missing_tx_id () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let child_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/title \"Page without transaction ID\" \
           :block/name \"page\" :block/tags :logseq.class/Page}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 1 :block/title \"Child\" \
           :block/page -1 :block/parent -1 :block/order \"a0\"}]"
          p_uuid child_uuid));
  let db = db_of conn in
  check "missing parent tx-id defaults to zero"
    (wint
       (wg (Endpoint_block.direct_children_membership db p_uuid)
          "parent-tx-id")
     = Some 0);
  throws_any "missing parent throws"
    (fun () ->
      ignore
        (Endpoint_block.direct_children_membership db (fresh_uuid ())))

(* (deftest canonical-block-snapshots-are-transit-safe-pure-results-test ...) *)
let test_canonical_block_snapshots_are_transit_safe () =
  let conn = canonical_block_fixture () in
  let db = db_of conn in
  let blocks = canonical_blocks_uuids db [ target_uuid ] in
  let membership = Endpoint_block.direct_children_membership db parent_uuid in
  let tree = Endpoint_block.open_block_tree db parent_uuid in
  List.iteri
    (fun i value ->
      check (Printf.sprintf "transit roundtrip %d" i)
        (value = Transit_codec.of_string (Transit_codec.to_string value)))
    [ blocks; membership; tree ]

(* (deftest block-property-keys-include-own-and-class-properties-test ...) *)
let test_block_property_keys_include_own_and_class () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ ( "c1"
          , Db_test_util.
              { default_class with c_class_properties = [ "p1" ] } ) ]
      ~properties: [ "own", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Page" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "with-own"
                  ; b_properties = [ "own", Db_test_util.Str "v" ] }
              ; Db_test_util.
                  { default_block with
                    b_title = Some "with-class"
                  ; b_tags = [ "c1" ] }
              ; Db_test_util.{ default_block with b_title = Some "plain" } ] } ]
      ()
  in
  let db = db_of conn in
  let with_own = block_by_content db "with-own" in
  let with_class = block_by_content db "with-class" in
  let plain = block_by_content db "plain" in
  let gb opts = Endpoint_block.opts_of_wire (kwm opts) in
  let own_map =
    Endpoint_block.get_block_and_children db (Int with_own.id)
      (gb [ "children?", Wire.Bool false ])
  in
  let class_map =
    Endpoint_block.get_block_and_children db (Int with_class.id)
      (gb [ "children?", Wire.Bool false ])
  in
  let plain_map =
    Endpoint_block.get_block_and_children db (Int plain.id)
      (gb [ "children?", Wire.Bool false ])
  in
  let property_keys (m : Wire.t) : string list =
    List.filter_map Wire.as_keyword
      (wseq
         (Option.value
            (get_in m [ `K "block"; `K "block.temp/property-keys" ])
            ~default:(Wire.Array [])))
  in
  check "own property keys"
    (List.mem "user.property/own"
       (Display_properties.block_property_keys db with_own));
  check "class-provided property keys"
    (List.mem "user.property/p1"
       (Display_properties.block_property_keys db with_class));
  check "plain has neither"
    (not
       (List.exists
          (fun k ->
            List.mem k [ "user.property/own"; "user.property/p1" ])
          (Display_properties.block_property_keys db plain)));
  check "own-map property-keys"
    (List.mem "user.property/own" (property_keys own_map));
  check "class-map property-keys"
    (List.mem "user.property/p1" (property_keys class_map));
  check "plain-map property-keys"
    (not
       (List.exists
          (fun k ->
            List.mem k [ "user.property/own"; "user.property/p1" ])
          (property_keys plain_map)));
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf "[{:db/id %d :block/tx-id 1}]" with_class.id));
  let db = db_of conn in
  let with_class = ent_of_ref_exn db (Entity_id with_class.id) in
  let canonical = canonical_block db with_class in
  check "canonical row skips property-keys"
    (wg canonical "block.temp/property-keys" = None)

(* (deftest canonical-block-positions-default-task-status-test ...) *)
let test_canonical_block_positions_default_task_status () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Page" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "task only"
                  ; b_tags = [ "logseq.class/Task" ] }
              ; Db_test_util.
                  { default_block with
                    b_title = Some "task doing"
                  ; b_tags = [ "logseq.class/Task" ]
                  ; b_properties =
                      [ ( "logseq.property/status"
                        , Db_test_util.Kw "logseq.property/status.doing" ) ] } ] } ]
      ()
  in
  let db = db_of conn in
  let task_only = block_by_content db "task only" in
  let task_doing = block_by_content db "task doing" in
  let status_uuid =
    match Ldb.value (ident_ent_exn db "logseq.property/status") "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> failwith "status property has no uuid"
  in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf "[{:db/id %d :block/tx-id 1}\n{:db/id %d :block/tx-id 1}]"
          task_only.id task_doing.id));
  let db = db_of conn in
  let task_only = ent_of_ref_exn db (Entity_id task_only.id) in
  let task_doing = ent_of_ref_exn db (Entity_id task_doing.id) in
  let only_block = canonical_block db task_only in
  let doing_block = canonical_block db task_doing in
  let idents_at (eid : entity_id) (position : string) : string list =
    match
      List.assoc_opt position
        (Render_snapshot.block_positioned_property_idents_by_position db eid)
    with
    | Some idents -> idents
    | None -> []
  in
  let only_left = idents_at task_only.id "block-left" in
  let doing_left = idents_at task_doing.id "block-left" in
  check "status property at block-left"
    (List.filter_map map_uuid
       (wseq
          (Option.value
             (get_in only_block
                [ `K "block.temp/positioned-properties"; `K "block-left" ])
             ~default:(Wire.Array [])))
     = [ status_uuid ]);
  check "tag-only Task exposes default status"
    (List.mem "logseq.property/status" only_left);
  check "row omits unset status"
    (wg only_block "logseq.property/status" = None);
  check "explicit status still positions"
    (List.mem "logseq.property/status" doing_left);
  check "written status stays"
    (wg doing_block "logseq.property/status" <> None);
  check "status uuid is a uuid" (status_uuid <> "")

(* (deftest structured-copy-tree-keeps-property-children-and-skips-hidden-nodes-test ...) *)
let test_structured_copy_tree () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let property_uuid = fresh_uuid () in
  let root_uuid = fresh_uuid () in
  let visible_uuid = fresh_uuid () in
  let property_value_uuid = fresh_uuid () in
  let recycled_uuid = fresh_uuid () in
  let closed_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Page\" :block/name \"page\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -2 :db/ident :user.property/Text \
           :db/valueType :db.type/ref :db/cardinality :db.cardinality/one \
           :block/uuid #uuid \"%s\" :block/tx-id 1 :block/title \"Text\" \
           :block/tags :logseq.class/Property}\n\
          {:db/id -3 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Root\" :block/page -1 :block/parent -1 \
           :block/order \"a0\" :block/collapsed? true}\n\
          {:db/id -4 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Visible child\" :block/page -1 \
           :block/parent -3 :block/order \"a0\"}\n\
          {:db/id -5 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Property value\" :block/page -1 \
           :block/parent -3 :block/order \"a1\" \
           :logseq.property/created-from-property -2}\n\
          {:db/id -6 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Recycled child\" :block/page -1 \
           :block/parent -3 :block/order \"a2\" \
           :logseq.property/deleted-at 1}\n\
          {:db/id -7 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Closed value\" :block/page -1 \
           :block/parent -3 :block/order \"a3\" \
           :block/closed-value-property -2}]"
          p_uuid property_uuid root_uuid visible_uuid property_value_uuid
          recycled_uuid closed_uuid));
  let db = db_of conn in
  let result =
    Endpoint_block.get_block_and_children db (Uuid root_uuid)
      (Endpoint_block.opts_of_wire
         (kwm
            [ "children?", Wire.Bool true
            ; "include-property-block?", Wire.Bool true ]))
  in
  let child_titles =
    List.filter_map map_title
      (wseq
         (Option.value (wg result "children") ~default:(Wire.List [])))
  in
  check "root title"
    (get_in result [ `K "block"; `K "block/title" ]
     = Some (Wire.String "Root"));
  check "property children kept, hidden skipped"
    (child_titles = [ "Visible child"; "Property value" ]);
  check "structured copies skip display properties"
    (get_in result [ `K "block"; `K "block/properties" ] = None)

(* (deftest get-block-and-children-positions-default-task-status-test ...) *)
let test_get_block_and_children_positions_default_task_status () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Page" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "task only"
                  ; b_tags = [ "logseq.class/Task" ] }
              ; Db_test_util.{ default_block with b_title = Some "plain" } ] } ]
      ()
  in
  let db = db_of conn in
  let task_only = block_by_content db "task only" in
  let plain = block_by_content db "plain" in
  let gb_result (e : entity) =
    Endpoint_block.get_block_and_children db (Int e.id)
      (Endpoint_block.opts_of_wire
         (kwm
            [ "children?", Wire.Bool false; "render-data?", Wire.Bool true ]))
  in
  let task_result = gb_result task_only in
  let plain_result = gb_result plain in
  let left_idents (r : Wire.t) : string list =
    List.filter_map map_ident
      (wseq
         (Option.value
            (get_in r
               [ `K "block"; `K "block.temp/positioned-properties"
               ; `K "block-left" ])
            ~default:(Wire.Array [])))
  in
  check "tag-only Task positions default status"
    (List.mem "logseq.property/status" (left_idents task_result));
  check "untagged blocks skip positioned status"
    (left_idents plain_result = [])

(* ---------- cover-row fixture ---------- *)
let cover_page_uuid = "20000000-0000-0000-0000-000000000001"
let cover_row_uuid = "20000000-0000-0000-0000-000000000002"
let cover_uuid = "20000000-0000-0000-0000-000000000003"
let cover_property_uuid = "20000000-0000-0000-0000-000000000004"

let cover_row_fixture () : conn =
  let conn = create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/id -1\n\
       \  :block/uuid #uuid \"20000000-0000-0000-0000-000000000001\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Movies\"\n\
       \  :block/name \"movies\"\n\
       \  :block/tags :logseq.class/Page}\n\
       {:db/id -2\n\
       \  :db/ident :user.property/cover\n\
       \  :db/valueType :db.type/ref\n\
       \  :db/cardinality :db.cardinality/one\n\
       \  :block/uuid #uuid \"20000000-0000-0000-0000-000000000004\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Cover\"\n\
       \  :logseq.property/type :asset\n\
       \  :block/tags :logseq.class/Property}\n\
       {:db/id -3\n\
       \  :block/uuid #uuid \"20000000-0000-0000-0000-000000000003\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"poster\"\n\
       \  :block/tags :logseq.class/Asset\n\
       \  :logseq.property.asset/type \"webp\"\n\
       \  :logseq.property.asset/width 800\n\
       \  :logseq.property.asset/height 1200\n\
       \  :logseq.property.asset/external-url \"https://example.com/poster.webp\"}\n\
       {:db/id -4\n\
       \  :block/uuid #uuid \"20000000-0000-0000-0000-000000000002\"\n\
       \  :block/tx-id 10\n\
       \  :block/title \"Inception\"\n\
       \  :block/page -1\n\
       \  :block/parent -1\n\
       \  :block/order \"a0\"\n\
       \  :user.property/cover -3}]");
  conn

(* (deftest canonical-page-property-values-keep-eavt-tags-test ...) *)
let test_canonical_page_property_values_keep_eavt_tags () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let block_uuid = fresh_uuid () in
  let prop_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Actor\" :block/name \"actor\" \
           :block/tags :logseq.class/Page}\n\
          {:db/id -2 :db/ident :user.property/Cast \
           :db/valueType :db.type/ref :db/cardinality :db.cardinality/one \
           :block/uuid #uuid \"%s\" :block/tx-id 1 :block/title \"Cast\" \
           :block/tags :logseq.class/Property}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Movie\" :user.property/Cast -1}]"
          p_uuid prop_uuid block_uuid));
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db block_uuid) in
  let cast =
    match wg block "user.property/Cast" with
    | Some c -> c
    | None -> failwith "missing cast"
  in
  check "cast tag ident"
    (get_in cast [ `K "block/tags"; `I 0; `K "db/ident" ]
     = Some (Wire.Keyword "logseq.class/Page"));
  check "page-valued cell keeps type tag" (entity_page_w cast)

(* (deftest canonical-blocks-reuse-shared-ref-identities-test ...) *)
let test_canonical_blocks_reuse_shared_ref_identities () =
  let conn = create_conn () in
  let p_uuid = fresh_uuid () in
  let first_uuid = fresh_uuid () in
  let second_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Shared\" :block/name \"shared\" \
           :block/tags :logseq.class/Page}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"One [[%s]]\" :block/refs [-1]}\n\
          {:block/uuid #uuid \"%s\" :block/tx-id 1 \
           :block/title \"Two [[%s]]\" :block/refs [-1]}]"
          p_uuid first_uuid p_uuid second_uuid p_uuid));
  let db = db_of conn in
  let response = canonical_blocks_uuids db [ first_uuid; second_uuid ] in
  let first_ref =
    match block_row response first_uuid with
    | Some row -> get_in row [ `K "block/refs"; `I 0 ]
    | None -> None
  in
  let second_ref =
    match block_row response second_uuid with
    | Some row -> get_in row [ `K "block/refs"; `I 0 ]
    | None -> None
  in
  check "shared ref identities are equal" (first_ref = second_ref);
  (match first_ref with
   | Some r ->
       check "ref uuid" (wuuid (wg r "block/uuid") = Some p_uuid);
       check "ref tag ident"
         (get_in r [ `K "block/tags"; `I 0; `K "db/ident" ]
          = Some (Wire.Keyword "logseq.class/Page"))
   | None -> check "ref present" false)

(* (deftest canonical-cover-property-is-not-a-db-id-stub-test ...) *)
let test_canonical_cover_property_is_not_a_db_id_stub () =
  let conn = cover_row_fixture () in
  let db = db_of conn in
  let block = canonical_block db (ent_uuid_exn db cover_row_uuid) in
  let cover =
    match wg block "user.property/cover" with
    | Some c -> c
    | None -> failwith "missing cover"
  in
  check "cover is a map" (match cover with Wire.Map _ -> true | _ -> false);
  check "cover is not a bare db/id stub"
    (match wmap cover with
     | [ (k, _) ] -> Wire.as_keyword k <> Some "db/id"
     | _ -> true);
  check "cover uuid" (wuuid (wg cover "block/uuid") = Some cover_uuid);
  check "asset type" (wstr (wg cover "logseq.property.asset/type") = Some "webp");
  check "asset width" (wint (wg cover "logseq.property.asset/width") = Some 800);
  check "asset height" (wint (wg cover "logseq.property.asset/height") = Some 1200);
  check "asset url"
    (wstr (wg cover "logseq.property.asset/external-url")
     = Some "https://example.com/poster.webp");
  assert_shallow_identity_ref "cover" cover

(* (deftest canonical-task-snapshot-includes-complete-positioned-choices-test ...) *)
let test_canonical_task_snapshot_includes_complete_positioned_choices () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Tasks" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "Task with status"
                  ; b_tags = [ "logseq.class/Task" ]
                  ; b_properties =
                      [ ( "logseq.property/status"
                        , Db_test_util.Kw "logseq.property/status.doing" ) ] }
              ; Db_test_util.
                  { default_block with
                    b_title = Some "Task with default"
                  ; b_tags = [ "logseq.class/Task" ] }
              ; Db_test_util.{ default_block with b_title = Some "Plain block" } ] } ]
      ()
  in
  let db = db_of conn in
  let tasks =
    List.map (block_by_content db)
      [ "Task with status"; "Task with default"; "Plain block" ]
  in
  ignore
    (Datascript.transact_conn_string conn
       ("["
        ^ String.concat " "
            (List.map
               (fun (t : entity) ->
                 Printf.sprintf "{:db/id %d :block/tx-id 1}" t.id)
               tasks)
        ^ " {:db/ident :logseq.property/status :block/tx-id 1}]"));
  let db = db_of conn in
  let task_uuids = List.map (fun t -> uuid_of t) tasks in
  let response = canonical_blocks_uuids db task_uuids in
  let status = ident_ent_exn db "logseq.property/status" in
  let expected =
    Endpoint_property.property_closed_values db status
  in
  let expected_idents =
    List.sort_uniq String.compare
      (List.filter_map map_ident (wseq expected))
  in
  check "6 closed status values" (List.length (wseq expected) = 6);
  List.iter
    (fun task ->
      let properties =
        match block_row response (uuid_of task) with
        | Some row ->
            wseq
              (Option.value
                 (get_in row
                    [ `K "block.temp/positioned-properties"; `K "block-left" ])
                 ~default:(Wire.Array []))
        | None -> []
      in
      let status_property =
        List.find_opt
          (fun m -> map_ident m = Some "logseq.property/status")
          properties
      in
      (match status_property with
       | Some sp ->
           let closed =
             Option.value (wg sp "property/closed-values")
               ~default:(Wire.Array [])
           in
           check "positioned status choice idents"
             (List.sort_uniq String.compare
                (List.filter_map map_ident (wseq closed))
              = expected_idents);
           check "every choice keeps its icon"
             (List.for_all
                (fun cv -> wg cv "logseq.property/icon" <> None)
                (wseq closed))
       | None -> check "status property positioned" false))
    (List.filteri (fun i _ -> i < 2) tasks);
  check "plain block has empty positioned-properties"
    (match block_row response (uuid_of (List.nth tasks 2)) with
     | Some row ->
         (match wg row "block.temp/positioned-properties" with
          | Some (Wire.Map kvs) -> kvs = []
          | _ -> false)
     | None -> false);
  check "canonical property gets complete choice set"
    (wg (canonical_block db status) "property/closed-values"
     = Some expected)

(* (deftest canonical-block-batch-shares-positioned-property-work-test ...) *)
let test_canonical_block_batch_shares_positioned_property_work () =
  let conn = create_conn () in
  let ids = List.init 50 (fun _ -> fresh_uuid ()) in
  ignore
    (Datascript.transact_conn_string conn
       ("["
        ^ String.concat " "
            (List.map
               (fun id ->
                 Printf.sprintf
                   "{:block/uuid #uuid \"%s\" :block/title \"Task\" \
                    :block/tx-id 1 :block/tags :logseq.class/Task}"
                   id)
               ids)
        ^ "]"));
  let db = db_of conn in
  let result = canonical_blocks_uuids db ids in
  check "50 canonical rows" (List.length (blocks_map result) = 50);
  (* cljs asserts the shared status choices are read once per batch via
     a with-redefs counter — no OCaml injection point; assert the rows
     share the identical status choice wire value instead. *)
  let status_choices =
    List.filter_map
      (fun (_, row) ->
        match
          get_in row
            [ `K "block.temp/positioned-properties"; `K "block-left"; `I 0
            ; `K "property/closed-values" ]
        with
        | Some cvs -> Some cvs
        | None -> None)
      (blocks_map result)
  in
  check "every row carries the shared status choices"
    (List.length status_choices = 50);
  (match status_choices with
   | first :: rest ->
       check "status choices shared across the batch"
         (List.for_all (fun c -> c = first) rest)
   | [] -> ())

(* (deftest positioned-node-property-preserves-selector-and-icon-contract-test ...) *)
let test_positioned_node_property_preserves_selector_and_icon_contract () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ ( "owner"
          , Db_test_util.
              { default_property with
                p_type = "node"
              ; p_extra =
                  [ "logseq.property/ui-position", Db_test_util.Kw "block-left" ] } ) ]
      ~classes:
        [ ( "Work"
          , Db_test_util.
              { default_class with c_class_properties = [ "owner" ] } )
        ; "Person", Db_test_util.default_class ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Assignments" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "Assignment"
                  ; b_tags = [ "Work" ] }
              ; Db_test_util.
                  { default_block with
                    b_title = Some "Alice"
                  ; b_tags = [ "Person" ] }
              ; Db_test_util.{ default_block with b_title = Some "Unrelated" } ] } ]
      ()
  in
  let db = db_of conn in
  let assignment = block_by_content db "Assignment" in
  let person = ident_ent_exn db "user.class/Person" in
  let person_uuid = uuid_of person in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/ident :user.property/owner\n\
          \  :logseq.property/classes [%d]}\n\
          [:db/add [:db/ident :user.property/owner] :logseq.property/icon\n\
          \  {:type :tabler-icon :id \"user\"}]\n\
          {:db/id %d :block/tx-id 1}]"
          person.id assignment.id));
  let db = db_of conn in
  let block = canonical_block db (ent_of_ref_exn db (Entity_id assignment.id)) in
  let property =
    match
      get_in block
        [ `K "block.temp/positioned-properties"; `K "block-left"; `I 0 ]
    with
    | Some p -> p
    | None -> failwith "no positioned property"
  in
  let selector =
    Endpoint_property.property_node_selector_data db
      (kwm [ "property", property; "block", block ])
  in
  check "positioned property ident"
    (map_ident property = Some "user.property/owner");
  check "picker retains class filter idents"
    (List.filter_map map_ident
       (wseq
          (Option.value (wg property "logseq.property/classes")
             ~default:(Wire.Array [])))
     = [ "user.class/Person" ]);
  check "picker retains class filter uuids"
    (List.filter_map map_uuid
       (wseq
          (Option.value (wg property "logseq.property/classes")
             ~default:(Wire.Array [])))
     = [ person_uuid ]);
  check "initial choices offer allowed-class nodes"
    (List.filter_map map_title
       (wseq
          (Option.value (wg selector "initial-choices")
             ~default:(Wire.Array [])))
     = [ "Alice" ]);
  check "configured icon survives"
    (match wg property "logseq.property/icon" with
     | Some icon ->
         wkw (wg icon "type") = Some "tabler-icon"
         && wstr (wg icon "id") = Some "user"
     | None -> false)

(* (deftest get-block-and-children-respects-include-property-block ...) *)
let test_get_block_and_children_respects_include_property_block () =
  let conn =
    create_conn_with_blocks
      ~properties: [ "p1", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "b1"
                  ; b_properties = [ "p1", Db_test_util.Str "value" ]
                  ; b_children =
                      [ Db_test_util.{ default_block with b_title = Some "child" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let b1 = block_by_content db "b1" in
  let gb (inc : bool) =
    Endpoint_block.get_block_and_children db (Uuid (uuid_of b1))
      (Endpoint_block.opts_of_wire
         (kwm
            ([ "children?", Wire.Bool true ]
             @ if inc then [ "include-property-block?", Wire.Bool true ] else [])))
  in
  let titles_of (result : Wire.t) : string list =
    List.sort_uniq String.compare
      (List.filter_map map_title
         (wseq (Option.value (wg result "children") ~default:(Wire.List []))))
  in
  check "default children omit property-value blocks"
    (titles_of (gb false) = [ "child" ]);
  check "include-property-block returns property-value children"
    (titles_of (gb true) = [ "child"; "value" ])

let block_cases =
  [ Alcotest.test_case
      "canonical-property-reference-values-keep-type-tags-test" `Quick
      test_canonical_property_reference_values_keep_type_tags
  ; Alcotest.test_case
      "canonical-property-values-retain-source-property-type-test" `Quick
      test_canonical_property_values_retain_source_property_type
  ; Alcotest.test_case
      "canonical-block-keeps-own-attributes-and-only-shallow-references-test"
      `Quick test_canonical_block_keeps_own_attributes
  ; Alcotest.test_case
      "canonical-block-marks-class-provided-property-idents-test" `Quick
      test_canonical_block_marks_class_provided_property_idents
  ; Alcotest.test_case
      "canonical-block-numbers-ref-typed-list-siblings-test" `Quick
      test_canonical_block_numbers_ref_typed_list_siblings
  ; Alcotest.test_case
      "canonical-block-keeps-empty-placeholder-priority-ident-test" `Quick
      test_canonical_block_keeps_empty_placeholder_priority_ident
  ; Alcotest.test_case
      "canonical-view-block-includes-default-groups-sort-order-test" `Quick
      test_canonical_view_block_includes_default_groups_sort_order
  ; Alcotest.test_case
      "canonical-block-skips-path-refs-and-plain-title-block-refs-test"
      `Quick test_canonical_block_skips_path_refs
  ; Alcotest.test_case "canonical-block-uses-stored-journal-title-test"
      `Quick test_canonical_block_uses_stored_journal_title
  ; Alcotest.test_case
      "canonical-block-full-replacement-drops-retracted-attributes-test"
      `Quick test_canonical_block_full_replacement_drops_retracted_attributes
  ; Alcotest.test_case
      "canonical-block-exposes-page-reference-titles-for-editing-test"
      `Quick test_canonical_block_exposes_page_reference_titles_for_editing
  ; Alcotest.test_case
      "canonical-property-includes-derived-closed-values-test" `Quick
      test_canonical_property_includes_derived_closed_values
  ; Alcotest.test_case "canonical-class-skips-refs-count-test" `Quick
      test_canonical_class_skips_refs_count
  ; Alcotest.test_case
      "canonical-block-allows-db-id-only-reference-identities-test" `Quick
      test_canonical_block_allows_db_id_only_reference_identities
  ; Alcotest.test_case
      "canonical-block-requires-a-uuid-and-numeric-transaction-id-test"
      `Quick test_canonical_block_requires_uuid_and_numeric_tx_id
  ; Alcotest.test_case "missing-revisions-render-as-zero-without-writing-test"
      `Quick test_missing_revisions_render_as_zero
  ; Alcotest.test_case
      "canonical-blocks-returns-uuid-keyed-replacements-at-one-basis-test"
      `Quick test_canonical_blocks_returns_uuid_keyed_replacements
  ; Alcotest.test_case
      "canonical-blocks-inlines-positioned-property-definitions-test"
      `Quick test_canonical_blocks_inlines_positioned_property_definitions
  ; Alcotest.test_case
      "canonical-blocks-omits-absent-requested-uuids-at-the-same-basis-test"
      `Quick test_canonical_blocks_omits_absent_uuids
  ; Alcotest.test_case
      "direct-page-children-membership-is-complete-ordered-and-visible-test"
      `Quick test_direct_page_children_membership
  ; Alcotest.test_case
      "direct-block-children-membership-does-not-traverse-descendants-test"
      `Quick test_direct_block_children_membership
  ; Alcotest.test_case
      "open-block-tree-includes-open-descendants-and-stops-at-collapsed-blocks-test"
      `Quick test_open_block_tree
  ; Alcotest.test_case
      "direct-children-membership-defaults-missing-parent-transaction-id-test"
      `Quick test_direct_children_membership_defaults_missing_tx_id
  ; Alcotest.test_case
      "canonical-block-snapshots-are-transit-safe-pure-results-test" `Quick
      test_canonical_block_snapshots_are_transit_safe
  ; Alcotest.test_case
      "block-property-keys-include-own-and-class-properties-test" `Quick
      test_block_property_keys_include_own_and_class
  ; Alcotest.test_case "canonical-block-positions-default-task-status-test"
      `Quick test_canonical_block_positions_default_task_status
  ; Alcotest.test_case
      "structured-copy-tree-keeps-property-children-and-skips-hidden-nodes-test"
      `Quick test_structured_copy_tree
  ; Alcotest.test_case
      "get-block-and-children-positions-default-task-status-test" `Quick
      test_get_block_and_children_positions_default_task_status
  ; Alcotest.test_case "canonical-page-property-values-keep-eavt-tags-test"
      `Quick test_canonical_page_property_values_keep_eavt_tags
  ; Alcotest.test_case "canonical-blocks-reuse-shared-ref-identities-test"
      `Quick test_canonical_blocks_reuse_shared_ref_identities
  ; Alcotest.test_case "canonical-cover-property-is-not-a-db-id-stub-test"
      `Quick test_canonical_cover_property_is_not_a_db_id_stub
  ; Alcotest.test_case
      "canonical-task-snapshot-includes-complete-positioned-choices-test"
      `Quick test_canonical_task_snapshot_includes_complete_positioned_choices
  ; Alcotest.test_case
      "canonical-block-batch-shares-positioned-property-work-test" `Quick
      test_canonical_block_batch_shares_positioned_property_work
  ; Alcotest.test_case
      "positioned-node-property-preserves-selector-and-icon-contract-test"
      `Quick test_positioned_node_property_preserves_selector_and_icon_contract
  ; Alcotest.test_case "get-block-and-children-respects-include-property-block"
      `Quick test_get_block_and_children_respects_include_property_block ]

(* ================= comments_test.cljs ================= *)

let comments_blocks_property = "logseq.property.comments/blocks"

(* cljs conn-with-single-comment-thread *)
let conn_with_single_comment_thread () : conn =
  create_conn_with_blocks
    ~pages_and_blocks:
      [ { Db_test_util.page =
            Db_test_util.{ default_page with pg_title = Some "Page" }
        ; Db_test_util.blocks =
            [ Db_test_util.
                { default_block with
                  b_title = Some "Target"
                ; b_children =
                    [ Db_test_util.
                        { default_block with
                          b_title = Some "Comments"
                        ; b_tags = [ "logseq.class/Comments" ]
                        ; b_children =
                            [ Db_test_util.
                                { default_block with b_title = Some "Reply" } ] } ] } ] } ]
    ()

(* cljs conn-with-multi-comment-thread *)
let conn_with_multi_comment_thread () : conn =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Page" }
          ; Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "First" }
              ; Db_test_util.{ default_block with b_title = Some "Second" }
              ; Db_test_util.
                  { default_block with
                    b_title = Some "Comments"
                  ; b_tags = [ "logseq.class/Comments" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let first_block = block_by_content db "First" in
  let second_block = block_by_content db "Second" in
  let comments_area = block_by_content db "Comments" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id %d :logseq.property.comments/blocks [%d %d]}]"
          comments_area.id first_block.id second_block.id));
  conn

(* (deftest ensure-comments-area-updates-existing-thread-atomically ...) *)
let test_ensure_comments_area_updates_existing_thread_atomically () =
  let conn = conn_with_single_comment_thread () in
  let db = db_of conn in
  let target = block_by_content db "Target" in
  let result =
    match Endpoint_comment.ensure_comments_area conn (Wire.Uuid (uuid_of target)) with
    | Some r -> r
    | None -> failwith "ensure-comments-area returned None"
  in
  let comments_area =
    match wuuid (wg result "block/uuid") with
    | Some u -> ent_uuid_exn (db_of conn) u
    | None -> failwith "result has no uuid"
  in
  check "comments area title"
    (wstr (wg result "block/title") = Some "Comments");
  check "comments area points at target"
    (List.sort_uniq String.compare
       (List.map uuid_of
          (Ldb.ref_ents comments_area comments_blocks_property))
     = [ uuid_of target ])

(* (deftest ensure-comments-area-is-idempotent ...) *)
let test_ensure_comments_area_is_idempotent () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Page" }
          ; Db_test_util.blocks =
              [ Db_test_util.{ default_block with b_title = Some "Target" } ] } ]
      ()
  in
  let db = db_of conn in
  let target = block_by_content db "Target" in
  let first_result =
    Endpoint_comment.ensure_comments_area conn (Wire.Uuid (uuid_of target))
  in
  let second_result =
    Endpoint_comment.ensure_comments_area conn (Wire.Uuid (uuid_of target))
  in
  check "idempotent uuid"
    (Option.bind first_result (fun r -> wuuid (wg r "block/uuid"))
     = Option.bind second_result (fun r -> wuuid (wg r "block/uuid")));
  let target = ent_of_ref_exn (db_of conn) (Entity_id target.id) in
  check "one Comments child"
    (List.length
       (List.filter
          (fun (c : entity) -> Ldb.string_value c "block/title" = Some "Comments")
          (Ldb.get_children target))
     = 1)

(* (deftest ensure-comments-area-for-blocks-reuses-matching-thread ...) *)
let test_ensure_comments_area_for_blocks_reuses_matching_thread () =
  let conn = conn_with_multi_comment_thread () in
  let db = db_of conn in
  let first_block = block_by_content db "First" in
  let second_block = block_by_content db "Second" in
  let comments_area = block_by_content db "Comments" in
  let result =
    Endpoint_comment.ensure_comments_area_for_blocks conn
      [ Wire.Uuid (uuid_of first_block); Wire.Uuid (uuid_of second_block) ]
  in
  check "reuses matching thread"
    (Option.bind result (fun r -> wuuid (wg r "block/uuid"))
     = Some (uuid_of comments_area))

(* (deftest delete-comment-removes-thread-when-deleting-last-reply ...) *)
let test_delete_comment_removes_thread_when_deleting_last_reply () =
  let conn = conn_with_single_comment_thread () in
  let db = db_of conn in
  let reply = block_by_content db "Reply" in
  let comments_area_uuid = uuid_of (block_by_content db "Comments") in
  Endpoint_comment.delete_comment conn (Wire.Uuid (uuid_of reply));
  check "comments area deleted"
    (ent_uuid (db_of conn) comments_area_uuid = None)

(* (deftest delete-comment-keeps-thread-when-another-reply-exists ...) *)
let test_delete_comment_keeps_thread_when_another_reply_exists () =
  let conn = conn_with_single_comment_thread () in
  let db = db_of conn in
  let comments_area = block_by_content db "Comments" in
  let first_reply = block_by_content db "Reply" in
  let page_id =
    match Ldb.ref_ent comments_area "block/page" with
    | Some p -> p.id
    | None -> failwith "comments area has no page"
  in
  let second_reply_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/title \"Second reply\"\n\
          \  :block/uuid #uuid \"%s\"\n\
          \  :block/parent %d\n\
          \  :block/page %d}]"
          second_reply_uuid comments_area.id page_id));
  Endpoint_comment.delete_comment conn (Wire.Uuid (uuid_of first_reply));
  let db = db_of conn in
  let comments_area = ent_of_ref_exn db (Entity_id comments_area.id) in
  check "thread survives" (not (Ldb.recycled comments_area));
  check "only the selected reply is recycled"
    (ent_uuid db (uuid_of first_reply) = None)

(* (deftest get-comment-thread-block-uuids-finds-comment-targets ...) *)
let test_get_comment_thread_block_uuids_finds_comment_targets () =
  let conn = conn_with_multi_comment_thread () in
  register_conn conn;
  let db = db_of conn in
  let first_block = block_by_content db "First" in
  let second_block = block_by_content db "Second" in
  let result =
    await
      (Dispatcher.invoke "thread-api/get-comment-thread-block-uuids"
         [ Wire.String test_repo
         ; Wire.List
             [ Wire.Uuid (uuid_of first_block)
             ; Wire.Uuid (uuid_of second_block) ] ])
  in
  check "comment targets"
    (List.sort_uniq String.compare
       (List.filter_map Wire.as_string (wseq result))
     = List.sort_uniq String.compare
         [ uuid_of first_block; uuid_of second_block ])

(* (deftest get-comment-threads-for-block-loads-thread-blocks ...) *)
let test_get_comment_threads_for_block_loads_thread_blocks () =
  let conn = conn_with_single_comment_thread () in
  register_conn conn;
  let db = db_of conn in
  let target = block_by_content db "Target" in
  let comments_area = block_by_content db "Comments" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id %d :logseq.property.comments/blocks %d}]"
          comments_area.id target.id));
  let threads =
    await
      (Dispatcher.invoke "thread-api/get-comment-threads-for-block"
         [ Wire.String test_repo; Wire.Uuid (uuid_of target) ])
  in
  check "one thread block"
    (List.filter_map map_uuid (wseq threads)
     = [ uuid_of comments_area ]);
  let reply_uuid = uuid_of (block_by_content (db_of conn) "Reply") in
  check "thread children"
    (match wseq threads with
     | thread :: _ ->
         List.filter_map map_uuid
           (wseq (Option.value (wg thread "block/children") ~default:(Wire.List [])))
         = [ reply_uuid ]
     | [] -> false)

let comments_cases =
  [ Alcotest.test_case "ensure-comments-area-updates-existing-thread-atomically"
      `Quick test_ensure_comments_area_updates_existing_thread_atomically
  ; Alcotest.test_case "ensure-comments-area-is-idempotent" `Quick
      test_ensure_comments_area_is_idempotent
  ; Alcotest.test_case "ensure-comments-area-for-blocks-reuses-matching-thread"
      `Quick test_ensure_comments_area_for_blocks_reuses_matching_thread
  ; Alcotest.test_case "delete-comment-removes-thread-when-deleting-last-reply"
      `Quick test_delete_comment_removes_thread_when_deleting_last_reply
  ; Alcotest.test_case "delete-comment-keeps-thread-when-another-reply-exists"
      `Quick test_delete_comment_keeps_thread_when_another_reply_exists
  ; Alcotest.test_case "get-comment-thread-block-uuids-finds-comment-targets"
      `Quick test_get_comment_thread_block_uuids_finds_comment_targets
  ; Alcotest.test_case "get-comment-threads-for-block-loads-thread-blocks"
      `Quick test_get_comment_threads_for_block_loads_thread_blocks ]

(* ================= property_test.cljs ================= *)

(* (deftest property-node-selector-data-prepares-class-options-and-initial-choices ...) *)
let test_property_node_selector_data () =
  let conn = create_conn () in
  let page_uuid = "11111111-1111-1111-1111-111111111111" in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1\n\
          \  :db/ident :user.class/Topic\n\
          \  :block/title \"Topic\"\n\
          \  :block/name \"topic\"\n\
          \  :block/tags :logseq.class/Tag\n\
          \  :logseq.property.class/extends :logseq.class/Tag}\n\
          {:block/title \"Page A\"\n\
          \  :block/name \"page-a\"\n\
          \  :block/uuid #uuid \"%s\"\n\
          \  :block/tags -1}]"
          page_uuid));
  let db = db_of conn in
  let topic_class = ident_ent_exn db "user.class/Topic" in
  let topic_class_map =
    kwm
      [ "db/id", Wire.Int topic_class.id
      ; "db/ident", kw "user.class/Topic"
      ; "block/title", Wire.String "Topic" ]
  in
  let property =
    kwm
      [ "db/ident", kw "block/tags"
      ; "logseq.property/type", kw "node"
      ; "logseq.property/classes", Wire.Array [ topic_class_map ] ]
  in
  let page =
    match ent_uuid db page_uuid with
    | Some p -> p
    | None -> failwith "Page A missing"
  in
  let data =
    Endpoint_property.property_node_selector_data db
      (kwm
         [ "property", property
         ; "block", kwm [ "db/id", Wire.Int page.id ] ])
  in
  check "all-classes includes Topic"
    (List.exists
       (fun m -> map_ident m = Some "user.class/Topic")
       (wseq (Option.value (wg data "all-classes") ~default:(Wire.Array []))));
  check "class-options excludes Root"
    (not
       (List.exists
          (fun m -> map_ident m = Some "logseq.class/Root")
          (wseq
             (Option.value (wg data "class-options")
                ~default:(Wire.Array [])))));
  check "structured-children keyed by class id"
    (List.mem_assoc (Wire.Int topic_class.id)
       (wmap
          (Option.value (wg data "structured-children-by-class-id")
             ~default:(Wire.Map []))));
  check "extends-by-class-id keeps Tag"
    (match
       List.assoc_opt (Wire.Int topic_class.id)
         (wmap
            (Option.value (wg data "extends-by-class-id")
               ~default:(Wire.Map [])))
     with
     | Some extends ->
         List.exists
           (fun m -> map_ident m = Some "logseq.class/Tag") (wseq extends)
     | None -> false);
  check "initial choices"
    (List.filter_map map_title
       (wseq
          (Option.value (wg data "initial-choices")
             ~default:(Wire.Array [])))
     = [ "Page A" ])

(* (deftest display-properties-hides-hide-by-default-properties-on-nodes ...) *)
let test_display_properties_hides_hide_by_default () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ ( "keywords"
          , Db_test_util.
              { default_property with
                p_extra = [ "logseq.property/hide?", Db_test_util.Bool true ] } )
        ; "author", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.
                { default_page with
                  pg_title = Some "Work"
                ; pg_properties =
                    [ "keywords", Db_test_util.Str "clojure"
                    ; "author", Db_test_util.Str "Ada" ] }
          ; Db_test_util.blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let page =
    match Db_test_util.find_page_by_title db "Work" with
    | Some p -> p
    | None -> failwith "Work page missing"
  in
  let result =
    Display_properties.display_properties db page ~gallery_view:false
      ~page_title:true ~sidebar_properties:false ~tag_dialog:false
      ~publishing:false ~state_hide_empty_properties:false
      ~show_empty_and_hidden_properties:false
  in
  let ids_of key =
    List.filter_map wkw
      (List.map (fun row -> wg row "property-id")
         (wseq (Option.value (wg result key) ~default:(Wire.Array []))))
  in
  let full_ids = ids_of "full-properties" in
  let hidden_ids = ids_of "hidden-properties" in
  check "hide-by-default hides on node"
    (List.mem "user.property/keywords" hidden_ids
     && not (List.mem "user.property/keywords" full_ids));
  check "visible properties appear"
    (List.mem "user.property/author" full_ids
     && not (List.mem "user.property/author" hidden_ids))

(* bug 45: a property whose value is a blank-title value block counts as
   empty for :logseq.property/hide-empty-value — the row hides under
   "Show hidden properties" like upstream. *)
let test_display_properties_hide_empty_value_blank_title_block () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ ( "notes"
          , Db_test_util.
              { default_property with
                p_extra =
                  [ "logseq.property/hide-empty-value", Db_test_util.Bool true ] } )
        ; "author", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.
                { default_page with
                  pg_title = Some "Work"
                ; pg_properties =
                    [ ( "notes"
                      , Db_test_util.build_property_value ~title:"" () )
                    ; ( "author"
                      , Db_test_util.build_property_value ~title:"Ada" () ) ] }
          ; Db_test_util.blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let page =
    match Db_test_util.find_page_by_title db "Work" with
    | Some p -> p
    | None -> failwith "Work page missing"
  in
  let result =
    Display_properties.display_properties db page ~gallery_view:false
      ~page_title:true ~sidebar_properties:false ~tag_dialog:false
      ~publishing:false ~state_hide_empty_properties:false
      ~show_empty_and_hidden_properties:false
  in
  let ids_of key =
    List.filter_map wkw
      (List.map (fun row -> wg row "property-id")
         (wseq (Option.value (wg result key) ~default:(Wire.Array []))))
  in
  let full_ids = ids_of "full-properties" in
  let hidden_ids = ids_of "hidden-properties" in
  check "blank-title value block counts as empty"
    (List.mem "user.property/notes" hidden_ids
     && not (List.mem "user.property/notes" full_ids));
  check "non-empty value stays visible"
    (List.mem "user.property/author" full_ids
     && not (List.mem "user.property/author" hidden_ids))

(* (deftest display-property-map-reflects-default-value-entity-updates ...) *)
let test_display_property_map_reflects_default_value_updates () =
  let conn = create_conn () in
  let color_uuid = fresh_uuid () in
  let red_uuid = fresh_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/ident :user.property/color\n\
          \  :block/uuid #uuid \"%s\"\n\
          \  :block/title \"Color\"\n\
          \  :block/tags :logseq.class/Property\n\
          \  :logseq.property/type :default}\n\
          {:db/ident :user.property/color.red\n\
          \  :block/uuid #uuid \"%s\"\n\
          \  :block/title \"Red\"\n\
          \  :block/closed-value-property :user.property/color}\n\
          [:db/add :user.property/color\n\
          \  :logseq.property/default-value\n\
          \  :user.property/color.red]]"
          color_uuid red_uuid));
  let db = db_of conn in
  let color = ident_ent_exn db "user.property/color" in
  let before = Endpoint_property.display_property_map db color in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add :user.property/color.red :block/title \"Crimson\"]]");
  let db = db_of conn in
  let after =
    Endpoint_property.display_property_map db
      (ident_ent_exn db "user.property/color")
  in
  check "before default value title"
    (get_in before
       [ `K "logseq.property/default-value"; `K "block/title" ]
     = Some (Wire.String "Red"));
  check "after default value title"
    (get_in after
       [ `K "logseq.property/default-value"; `K "block/title" ]
     = Some (Wire.String "Crimson"))

(* cljs positioned-idents — idents of display-property-maps at a
   position; block_positioned_property_idents_by_position already
   groups the same idents. *)
let positioned_idents (db : db) (block_id : entity_id) (position : string) :
    string list =
  List.sort_uniq String.compare
    (Option.value
       (List.assoc_opt position
          (Render_snapshot.block_positioned_property_idents_by_position db
             block_id))
       ~default:[])

(* (deftest task-tag-only-positions-default-status ...) *)
let test_task_tag_only_positions_default_status () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "task only"
                  ; b_tags = [ "logseq.class/Task" ] }
              ; Db_test_util.
                  { default_block with
                    b_title = Some "task doing"
                  ; b_tags = [ "logseq.class/Task" ]
                  ; b_properties =
                      [ ( "logseq.property/status"
                        , Db_test_util.Kw "logseq.property/status.doing" ) ] }
              ; Db_test_util.{ default_block with b_title = Some "plain" } ] } ]
      ()
  in
  let db = db_of conn in
  let task_only = block_by_content db "task only" in
  let task_doing = block_by_content db "task doing" in
  let plain = block_by_content db "plain" in
  check "tag-only Task positions default status"
    (List.mem "logseq.property/status"
       (positioned_idents db task_only.id "block-left"));
  check "status resolved from property default, not a written datom"
    (Endpoint_property.entity_direct_value db task_only.id
       "logseq.property/status"
     = None);
  check "explicit status still positions"
    (List.mem "logseq.property/status"
       (positioned_idents db task_doing.id "block-left"));
  check "written status datom"
    (Endpoint_property.entity_direct_value db task_doing.id
       "logseq.property/status"
     <> None);
  check "unset priority stays hidden"
    (not
       (List.mem "logseq.property/priority"
          (positioned_idents db task_only.id "block-left")));
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id %d :logseq.property/priority :logseq.property/empty-placeholder}]"
          plain.id));
  check "empty-placeholder still positions dashed chip"
    (List.mem "logseq.property/priority"
       (positioned_idents (db_of conn) plain.id "block-left"));
  check "untagged blocks do not get a status icon"
    (not
       (List.mem "logseq.property/status"
          (positioned_idents db plain.id "block-left")));
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/retract :logseq.property/status :logseq.property/default-value]]");
  check "removing the default hides empty status again"
    (not
       (List.mem "logseq.property/status"
          (positioned_idents (db_of conn) task_only.id "block-left")))

(* (deftest class-declared-property-defaults-apply-only-to-members ...) *)
let test_class_declared_property_defaults_apply_only_to_members () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ ( "SubTask"
          , Db_test_util.
              { default_class with c_extends = [ "logseq.class/Task" ] } ) ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "task only"
                  ; b_tags = [ "logseq.class/Task" ] }
              ; Db_test_util.
                  { default_block with
                    b_title = Some "sub task"
                  ; b_tags = [ "SubTask" ] }
              ; Db_test_util.{ default_block with b_title = Some "plain" } ] } ]
      ()
  in
  let db = db_of conn in
  let task_block = block_by_content db "task only" in
  let sub_task_block = block_by_content db "sub task" in
  let plain_block = block_by_content db "plain" in
  let status_ident_of (b : entity) : string option =
    (* cljs entity-plus/lookup-kv-then-entity resolves ref defaults to
       entities, then :db/ident *)
    match Outliner_property.lookup_kv_with_default_value b "logseq.property/status" with
    | Some (Ref id) -> (
        match Ldb.ent_of_id db id with
        | Some e -> (match Ldb.value e "db/ident" with Some (Keyword k) -> Some k | _ -> None)
        | None -> None)
    | Some (Keyword k) -> Some k
    | _ -> None
  in
  check "task member gets status.todo class default"
    (status_ident_of task_block = Some "logseq.property/status.todo");
  check "subclass member gets status.todo class default"
    (status_ident_of sub_task_block = Some "logseq.property/status.todo");
  check "non-member gets no status default"
    (status_ident_of plain_block = None);
  check "task member advertises status ident"
    (List.mem "logseq.property/status"
       (Outliner_property.block_class_property_idents db task_block.id));
  check "subclass member advertises status ident"
    (List.mem "logseq.property/status"
       (Outliner_property.block_class_property_idents db sub_task_block.id));
  check "non-member does not advertise status ident"
    (not
       (List.mem "logseq.property/status"
          (Outliner_property.block_class_property_idents db plain_block.id)));
  let plain_map_flag (ident : string) : bool option =
    match Datascript.entity db (Ident ident) with
    | Some property ->
        (match wg (Property_maps.property_plain_map db property)
                 "block.temp/class-declared?" with
         | Some (Wire.Bool b) -> Some b
         | _ -> None)
    | None -> None
  in
  check "status flagged class-declared"
    (plain_map_flag "logseq.property/status" = Some true);
  check "undeclared property not flagged"
    (plain_map_flag "logseq.property.repeat/recur-unit" = Some false)

(* endpoint body's wire shape: get-class-properties *)
let get_class_properties_wire (db : db) (class_ : entity) : Wire.t list =
  List.map
    (Endpoint_property.property_plain_map db)
    (Outliner_property.get_class_properties class_)

(* (deftest get-class-properties-keeps-closed-values-for-icons ...) *)
let test_get_class_properties_keeps_closed_values_for_icons () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ ( "my-status"
          , Db_test_util.
              { default_property with
                p_closed_values =
                  [ { Db_test_util.cv_value = "Todo"
                    ; cv_uuid = Some "bb000000-0000-4000-8000-000000000001"
                    ; cv_ident = None
                    ; cv_icon =
                        Some
                          [ "type", Db_test_util.Kw "tabler-icon"
                          ; "id", Db_test_util.Str "circle" ]
                    ; cv_properties = [] }
                  ; { Db_test_util.cv_value = "Doing"
                    ; cv_uuid = Some "bb000000-0000-4000-8000-000000000002"
                    ; cv_ident = None
                    ; cv_icon =
                        Some
                          [ "type", Db_test_util.Kw "tabler-icon"
                          ; "id", Db_test_util.Str "circle-half" ]
                    ; cv_properties = [] } ] } )
        ; "note", Db_test_util.default_property ]
      ~classes:
        [ ( "MyTask"
          , Db_test_util.
              { default_class with
                c_class_properties = [ "my-status"; "note" ] } ) ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "Page" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "task1"
                  ; b_tags = [ "MyTask" ]
                  ; b_properties = [ "my-status", Db_test_util.Str "Doing" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let class_ = ident_ent_exn db "user.class/MyTask" in
  let properties = get_class_properties_wire db class_ in
  let by_ident ident =
    List.find_opt (fun m -> map_ident m = Some ident) properties
  in
  let status = by_ident "user.property/my-status" in
  let note = by_ident "user.property/note" in
  (match status with
   | Some status ->
       let closed =
         wseq
           (Option.value (wg status "property/closed-values")
              ~default:(Wire.Array []))
       in
       check "closed value titles"
         (List.sort_uniq String.compare
            (List.filter_map map_title closed)
          = [ "Doing"; "Todo" ]);
       check "each closed value keeps its icon"
         (List.sort_uniq String.compare
            (List.filter_map
               (fun cv -> wstr (get_in cv [ `K "logseq.property/icon"; `K "id" ]))
               closed)
          = [ "circle"; "circle-half" ])
   | None -> check "status property returned" false);
  (match note with
   | Some note ->
       check "plain properties keep their map shape"
         (wg note "property/closed-values" = None)
   | None -> check "note property returned" false)

let status_choice_titles =
  [ "Backlog"; "Canceled"; "Doing"; "Done"; "In Review"; "Todo" ]

(* (deftest property-closed-values-include-every-status-choice ...) *)
let test_property_closed_values_include_every_status_choice () =
  let conn = create_conn () in
  let db = db_of conn in
  let reverse_titles =
    List.sort_uniq String.compare
      (List.filter_map
         (fun (e : entity) -> Ldb.string_value e "block/title")
         (Db_property.get_closed_property_values db
            "logseq.property/status"))
  in
  let display =
    Endpoint_property.display_property_map db
      (ident_ent_exn db "logseq.property/status")
  in
  let class_props =
    get_class_properties_wire db (ident_ent_exn db "logseq.class/Task")
  in
  let task_status =
    List.find_opt
      (fun m -> map_ident m = Some "logseq.property/status") class_props
  in
  check "reverse lookup is the complete set"
    (reverse_titles = status_choice_titles);
  (let closed =
     wseq
       (Option.value (wg display "property/closed-values")
          ~default:(Wire.Array []))
   in
   check "display-property-map complete"
     (List.sort_uniq String.compare (List.filter_map map_title closed)
      = status_choice_titles);
   check "every closed value has an ident"
     (List.for_all (fun cv -> map_ident cv <> None) closed);
   check "icons survive"
     (List.for_all
        (fun cv -> get_in cv [ `K "logseq.property/icon"; `K "id" ] <> None)
        closed));
  (match task_status with
   | Some ts ->
       let closed =
         wseq
           (Option.value (wg ts "property/closed-values")
              ~default:(Wire.Array []))
       in
       check "task class properties complete"
         (List.sort_uniq String.compare (List.filter_map map_title closed)
          = status_choice_titles);
       check "task closed value icons"
         (List.for_all
            (fun cv ->
              get_in cv [ `K "logseq.property/icon"; `K "id" ] <> None)
            closed)
   | None -> check "status in Task class properties" false)

(* (deftest property-closed-values-keep-choice-classes-for-scoped-tags ...) *)
let test_property_closed_values_keep_choice_classes_for_scoped_tags () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ ( "t1"
          , Db_test_util.
              { default_class with c_class_properties = [ "priority" ] } )
        ; "t2", Db_test_util.default_class ]
      ~properties: [ "priority", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ { Db_test_util.page =
              Db_test_util.{ default_page with pg_title = Some "page1" }
          ; Db_test_util.blocks =
              [ Db_test_util.
                  { default_block with
                    b_title = Some "b1"
                  ; b_tags = [ "t1" ] }
              ; Db_test_util.
                  { default_block with
                    b_title = Some "b2"
                  ; b_tags = [ "t2" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let t1 = (ident_ent_exn db "user.class/t1").id in
  Outliner_property.upsert_closed_value conn "user.property/priority"
    ~id:None ~value:(Wire.String "P1") ~description:None
    ~scoped_class_id:(Wire.Int t1);
  let db = db_of conn in
  let closed =
    Endpoint_property.property_closed_values db
      (ident_ent_exn db "user.property/priority")
  in
  let p1 =
    match wseq closed with
    | c :: _ -> c
    | [] -> failwith "no closed values"
  in
  check "closed value titles"
    (List.filter_map map_title (wseq closed) = [ "P1" ]);
  check "scoped tag ids survive"
    (List.filter_map wint
       (List.map (fun m -> wg m "db/id")
          (wseq
             (Option.value (wg p1 "logseq.property/choice-classes")
                ~default:(Wire.Array []))))
     = [ t1 ])

(* (deftest pull-default-value-property-rejects-virtual-closed-values-attr ...) *)
let test_pull_default_value_property_rejects_virtual_closed_values_attr () =
  let conn = create_conn () in
  let db = db_of conn in
  check "default-value property seeded"
    (entity db (Ident "logseq.property/default-value") <> None);
  throws_with "pull rejects the virtual closed-values attr"
    "requires ref attr"
    (fun () ->
      ignore
        (Datascript.pull_string db "[* {:property/closed-values [*]}]"
           (Ident "logseq.property/default-value")));
  (match Datascript.pull_string db "[*]" (Ident "logseq.property/default-value") with
   | Some p ->
       check "wildcard pull loads default-value"
         (wg (Ds_wire.transit_of_pulled p) "db/ident"
          = Some (Wire.Keyword "logseq.property/default-value"))
   | None -> check "wildcard pull loads default-value" false)

let property_cases =
  [ Alcotest.test_case
      "property-node-selector-data-prepares-class-options-and-initial-choices"
      `Quick test_property_node_selector_data
  ; Alcotest.test_case
      "display-properties-hides-hide-by-default-properties-on-nodes" `Quick
      test_display_properties_hides_hide_by_default
  ; Alcotest.test_case
      "display-properties-hide-empty-value-treats-blank-title-value-block-as-empty"
      `Quick test_display_properties_hide_empty_value_blank_title_block
  ; Alcotest.test_case
      "display-property-map-reflects-default-value-entity-updates" `Quick
      test_display_property_map_reflects_default_value_updates
  ; Alcotest.test_case "task-tag-only-positions-default-status" `Quick
      test_task_tag_only_positions_default_status
  ; Alcotest.test_case
      "class-declared-property-defaults-apply-only-to-members" `Quick
      test_class_declared_property_defaults_apply_only_to_members
  ; Alcotest.test_case "get-class-properties-keeps-closed-values-for-icons"
      `Quick test_get_class_properties_keeps_closed_values_for_icons
  ; Alcotest.test_case "property-closed-values-include-every-status-choice"
      `Quick test_property_closed_values_include_every_status_choice
  ; Alcotest.test_case
      "property-closed-values-keep-choice-classes-for-scoped-tags" `Quick
      test_property_closed_values_keep_choice_classes_for_scoped_tags
  ; Alcotest.test_case
      "pull-default-value-property-rejects-virtual-closed-values-attr" `Quick
      test_pull_default_value_property_rejects_virtual_closed_values_attr ]

(* ================= transaction_test.cljs ================= *)

(* (deftest apply-outliner-ops-returns-stored-delta-and-canonical-editor-rows-test ...) *)
let test_apply_outliner_ops_returns_stored_delta_and_canonical_editor_rows () =
  let repo = "transaction-handler-test" in
  (* cljs (d/create-conn) + with-redefs apply-ops! stub — the real op
     never runs. OCaml invokes the real endpoint with a real no-op op,
     so the conn needs the schema for [:block/uuid u] lookup-refs to
     resolve empty instead of raising "not marked as :db/unique". *)
  let conn = Datascript.create_conn ~schema:(Db_test_util.schema ()) () in
  let perf_id = "11111111-1111-1111-1111-111111111111" in
  let first_row_uuid = "22222222-2222-2222-2222-222222222222" in
  let second_row_uuid = "33333333-3333-3333-3333-333333333333" in
  let editor_row_uuids =
    [ Wire.Uuid second_row_uuid; Wire.Uuid first_row_uuid ]
  in
  let first_row =
    kwm
      [ "block/uuid", Wire.Uuid first_row_uuid
      ; "block/tx-id", Wire.Int 6 ]
  in
  let second_row =
    kwm
      [ "block/uuid", Wire.Uuid second_row_uuid
      ; "block/tx-id", Wire.Int 7 ]
  in
  let editor_rows =
    Wire.Map
      [ (Wire.Uuid first_row_uuid, first_row)
      ; (Wire.Uuid second_row_uuid, second_row) ]
  in
  let delta =
    kwm
      [ "graph-id", Wire.String repo
      ; "rev", Wire.Int 7
      ; "blocks", Wire.Map []
      ; "deleted", Wire.Map []
      ; "children", Wire.Map []
      ; "affected-keys", Wire.Set [ Wire.Array [ kw "graph" ] ] ]
  in
  let canonical_calls = ref [] in
  let saved = !Sync_deps.canonical_blocks_fn in
  Worker_state.set_datascript_conn repo conn;
  Db_listener.note_outliner_op_delta perf_id delta;
  Sync_deps.canonical_blocks_fn :=
    Some
      (fun db row_uuids ->
        canonical_calls := (db, row_uuids) :: !canonical_calls;
        kwm [ "basis-rev", Wire.Int 7; "blocks", editor_rows ]);
  Fun.protect
    ~finally:(fun () ->
      Sync_deps.canonical_blocks_fn := saved;
      Worker_state.drop_datascript_conn repo)
    (fun () ->
      let response =
        await
          (Dispatcher.invoke "thread-api/apply-outliner-ops"
             [ Wire.String repo
             ; Wire.Array
                 [ Wire.Array
                     [ kw "move-blocks-up-down"
                     ; Wire.Array
                         [ Wire.Array [ Wire.Uuid first_row_uuid ]
                         ; Wire.Bool false ] ] ]
             ; Wire.Map
                 [ (kw "affected-block-uuids", Wire.Set [])
                 ; (kw "editor-row-uuids", Wire.Array editor_row_uuids)
                 ; (kw "ui/perf-id", Wire.String perf_id) ] ])
      in
      check "result is the apply-ops return"
        (wg response "result" = Some Wire.Nil);
      check "listener delta returned"
        (wg response "delta" = Some delta);
      check "editor row uuids retain order"
        (wg response "editor-row-uuids"
         = Some (Wire.Array editor_row_uuids));
      check "editor rows are the canonical response"
        (wg response "editor-rows" = Some editor_rows);
      check "canonical-blocks called once with db and uuids"
        (match !canonical_calls with
         | [ (_, uuids) ] -> uuids = editor_row_uuids
         | _ -> false);
      List.iter
        (fun k -> check ("absent " ^ k) (wg response k = None))
        [ "affected-page-uuids"; "deleted-block-uuids"
        ; "entity-updated-block-uuids"; "render-invalidated-block-uuids"
        ; "structural-parent-uuids"; "updated-blocks" ])

let transaction_cases =
  [ Alcotest.test_case
      "apply-outliner-ops-returns-stored-delta-and-canonical-editor-rows-test"
      `Quick test_apply_outliner_ops_returns_stored_delta_and_canonical_editor_rows ]
