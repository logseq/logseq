(* 1:1 OCaml translation of
   src/test/frontend/worker/render_delta_test.cljs (12 deftests).

   All cases are pure `Render_delta.build` calls on in-memory tx
   reports — `with_tx` on a bare `empty_db` schema. No seeded graph
   needed; the cljs test does the same.

   Divergences:
   - cljs `(d/with db-before tx-data)` → `Datascript.with_tx db_before
     (Datascript.parse_tx_data_string "<same EDN>")`.
   - cljs `{:db/id 1 ...}` fixture maps keep numeric db/ids — same EDN.
   - `membership-operations` cljs helper = strip :base-rev/:rev per
     parent patch — `membership_ops` below.
   - cljs delta key :deleted-block-uuids in `build` input → OCaml
     `~deleted_block_uuids : string list` (uuid strings); the output key
     is `:deleted` (not :deleted-block-uuids) — assertions adjusted.
   - cljs `thrown-with-msg?` → `throws_with` needle on the exception
     message (`Sync_util.ex_info` / `Dispatcher.Exn_info`).
   - cljs `{:deleted-block-uuids #{"not-a-uuid"}}` (malformed deleted
     identity) cannot be expressed: OCaml `~deleted_block_uuids` is a
     `string list` wrapped as `Wire.Uuid` unconditionally — the "Invalid
     deleted block UUID" guard is unreachable through the typed API;
     sub-assertion dropped.

   Known lib/engine bugs hit by these tests (no workarounds — left red):
     - none at translation time.
*)

open Datascript
open Test_shared

(* cljs render-delta-test/schema *)
let render_delta_schema () =
  Datascript.schema_of_edn_string
    "{:block/uuid {:db/unique :db.unique/identity}
      :block/parent {:db/valueType :db.type/ref}
      :block/closed-value-property {:db/valueType :db.type/ref
                                   :db/cardinality :db.cardinality/many}
      :logseq.property/created-from-property {:db/valueType :db.type/ref}
      :block/order {}
      :block/tx-id {}
      :logseq.property/deleted-at {}}"

(* cljs db-with-blocks: (d/db-with (d/empty-db schema) blocks) *)
let db_with_blocks (blocks_edn : string) : db =
  db_with_string blocks_edn (empty_db ~schema:(render_delta_schema ()) ())

(* cljs tx-report: (d/with db-before tx-data) *)
let tx_report (db_before : db) (tx_edn : string) : tx_report =
  with_tx db_before (parse_tx_data_string tx_edn)

(* cljs block: {:block/uuid u :block/tx-id t :block/title s} *)
let block (u : string) (tx_id : int) (title : string) : Wire.t =
  Wire.Map
    [ Wire.Keyword "block/uuid", Wire.Uuid u
    ; Wire.Keyword "block/tx-id", Wire.Int tx_id
    ; Wire.Keyword "block/title", Wire.String title ]

let kw k = Wire.Keyword k

(* cljs build-delta: merge defaults {:graph-id "graph" :rev 101
   :op-id "operation" :blocks {} :deleted-block-uuids #{}
   :affected-keys #{} :tx-report report} *)
let build_delta ?(graph_id = "graph") ?(rev = 101)
    ?(op_id = Wire.String "operation") ?(blocks = Wire.Map [])
    ?(deleted_block_uuids = []) ?(affected_keys = []) (r : tx_report) :
    Wire.t =
  Render_delta.build ~graph_id ~rev ~op_id ~blocks ~deleted_block_uuids
    ~affected_keys ~tx_report:r

let get k (w : Wire.t) = Wire.get k w

(* cljs membership-operations — {parent-uuid {:remove [...] :upsert [...]}}
   dropping :base-rev/:rev *)
let membership_ops (children : Wire.t) : Wire.t =
  match children with
  | Wire.Map kvs ->
      Wire.Map
        (List.filter_map
           (fun (pk, patch) ->
             match patch with
             | Wire.Map fields ->
                 let keep =
                   List.filter
                     (fun (k, _) ->
                       match k with
                       | Wire.Keyword ("base-rev" | "rev") -> false
                       | _ -> true)
                     fields
                 in
                 Some (pk, Wire.Map keep)
             | _ -> Some (pk, patch))
           kvs)
  | _ -> children

let exn_text (e : exn) : string =
  match e with
  | Dispatcher.Exn_info (msg, _) -> msg
  | Failure s | Invalid_argument s -> s
  | _ -> Printexc.to_string e

let str_contains (s : string) (sub : string) : bool =
  let ls = String.length s and lsub = String.length sub in
  let rec loop i =
    i + lsub <= ls && (String.sub s i lsub = sub || loop (i + 1))
  in
  lsub = 0 || loop 0

let throws_with (name : string) (needle : string) (f : unit -> _) : unit =
  let ok =
    (try
       ignore (f ());
       false
     with e -> str_contains (exn_text e) needle)
  in
  check name ok

(* ---------- tests ---------- *)

let u () = Uuid_gen.uuid ()

(* (deftest complete-block-replacements-and-delta-invariants-test) *)
let test_complete_block_replacements () =
  let bu = u () in
  let replacement = block bu 42 "new" in
  let db =
    db_with_blocks
      (Printf.sprintf "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 42 :block/title \"new\"}]" bu)
  in
  let delta =
    build_delta (with_tx db [])
      ~blocks:(Wire.Map [ Wire.Uuid bu, replacement ])
      ~affected_keys:
        [ Wire.Array [ kw "graph" ]; Wire.Array [ kw "query"; kw "tasks" ] ]
  in
  check "delta shape"
    (delta
     = Wire.Map
         [ kw "graph-id", Wire.String "graph"
         ; kw "rev", Wire.Int 101
         ; kw "op-id", Wire.String "operation"
         ; kw "blocks", Wire.Map [ Wire.Uuid bu, replacement ]
         ; kw "deleted", Wire.Map []
         ; kw "children", Wire.Map []
         ; ( kw "affected-keys"
           , Wire.Set
               [ Wire.Array [ kw "graph" ]
               ; Wire.Array [ kw "query"; kw "tasks" ] ] ) ]);
  check "complete replacement"
    (get "blocks" delta |> function
     | Some (Wire.Map kvs) -> List.assoc_opt (Wire.Uuid bu) kvs = Some replacement
     | _ -> false)

(* (deftest affected-resource-keys-pass-through-without-delta-owned-invalidation-test) *)
let test_affected_keys_pass_through () =
  let db = db_with_blocks "[]" in
  let affected =
    Wire.Set [ Wire.Array [ kw "entity"; Wire.Uuid (u ()) ]
             ; Wire.Array [ kw "refs"; Wire.Uuid (u ()) ] ]
  in
  let delta =
    build_delta (with_tx db [])
      ~affected_keys:(match affected with Wire.Set xs -> xs | _ -> [])
  in
  check "affected-keys transported verbatim"
    (get "affected-keys" delta = Some affected)

(* (deftest deleted-blocks-become-revisioned-tombstones-test) *)
let test_deleted_tombstones () =
  let pu = u () and cu = u () in
  let db_before =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 10}
           {:db/id 2 :block/uuid #uuid \"%s\" :block/parent 1 :block/order \"a0\" :block/tx-id 10}]"
         pu cu)
  in
  let report =
    tx_report db_before
      (Printf.sprintf
         "[[:db/retractEntity [:block/uuid #uuid \"%s\"]] [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 11]]"
         cu pu)
  in
  let parent = block pu 11 "parent" in
  let delta =
    build_delta ~rev:202 report
      ~blocks:(Wire.Map [ Wire.Uuid pu, parent ])
      ~deleted_block_uuids:[ cu ]
  in
  (match get "deleted" delta with
   | Some (Wire.Map kvs) -> (
       match List.assoc_opt (Wire.Uuid cu) kvs with
       | Some (Wire.Map fields) ->
           check "tombstone rev"
             (List.assoc_opt (kw "rev") fields = Some (Wire.Int 202));
           check "tombstone db/id"
             (List.assoc_opt (kw "db/id") fields = Some (Wire.Int 2))
       | _ -> check "tombstone" false)
   | _ -> check "deleted map" false);
  check "children membership"
    (membership_ops
       (Option.value (get "children" delta) ~default:(Wire.Map []))
     = Wire.Map
         [ ( Wire.Uuid pu
           , Wire.Map
               [ kw "remove"
               , Wire.Array
                   [ Wire.Array [ Wire.Uuid cu; Wire.String "a0" ] ]
               ; kw "upsert", Wire.Array [] ] ) ]);
  (match get "children" delta with
   | Some (Wire.Map [ Wire.Uuid p, Wire.Map pf ]) when p = pu ->
       check "children rev"
         (List.assoc_opt (kw "rev") pf = Some (Wire.Int 202));
       check "children base-rev nat"
         (match List.assoc_opt (kw "base-rev") pf with
          | Some (Wire.Int n) -> n >= 0
          | _ -> false)
   | _ -> check "children parent patch" false)

(* (deftest content-only-change-has-no-children-patch-test) *)
let test_content_only_no_children () =
  let pu = u () and cu = u () in
  let db_before =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 10}
           {:db/id 2 :block/uuid #uuid \"%s\" :block/parent 1 :block/order \"a0\" :block/tx-id 10 :block/title \"before\"}]"
         pu cu)
  in
  let report =
    tx_report db_before
      (Printf.sprintf
         "[[:db/add [:block/uuid #uuid \"%s\"] :block/title \"after\"] [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 11]]"
         cu cu)
  in
  let delta =
    build_delta report ~blocks:(Wire.Map [ Wire.Uuid cu, block cu 11 "after" ])
  in
  check "no children patch"
    (get "children" delta = Some (Wire.Map []))

(* (deftest unordered-parent-reference-has-no-children-patch-test) *)
let test_unordered_parent_no_children () =
  let pu = u () and gu = u () in
  let db_before =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 10}]" pu)
  in
  let report =
    tx_report db_before
      (Printf.sprintf
         "[{:block/uuid #uuid \"%s\" :block/name \"nested page\" :block/parent [:block/uuid #uuid \"%s\"] :block/tx-id 11}]"
         gu pu)
  in
  let delta =
    build_delta report ~blocks:(Wire.Map [ Wire.Uuid gu, block gu 11 "Nested page" ])
  in
  check "unordered parent is not membership"
    (get "children" delta = Some (Wire.Map []))

(* (deftest direct-child-visibility-builds-remove-and-upsert-patches-test) *)
let test_direct_child_visibility () =
  List.iter
    (fun (label, attr, value) ->
      let pu = u () and cu = u () and ru = u () in
      let visible_db =
        db_with_blocks
          (Printf.sprintf
             "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 10}
               {:db/id 2 :block/uuid #uuid \"%s\" :block/parent 1 :block/order \"a0\" :block/tx-id 10}
               {:db/id 3 :block/uuid #uuid \"%s\" :block/tx-id 10}]"
             pu cu ru)
      in
      let hide_report =
        tx_report visible_db
          (Printf.sprintf "[[:db/add 2 %s %s] [:db/add 1 :block/tx-id 11]]"
             attr value)
      in
      let hide_delta =
        build_delta hide_report
          ~blocks:(Wire.Map [ Wire.Uuid pu, block pu 11 "parent" ])
      in
      let hidden_db = hide_report.db_after in
      let show_report =
        tx_report hidden_db
          (Printf.sprintf "[[:db/retract 2 %s %s] [:db/add 1 :block/tx-id 12]]"
             attr value)
      in
      let show_delta =
        build_delta show_report
          ~blocks:(Wire.Map [ Wire.Uuid pu, block pu 12 "parent" ])
      in
      check (Printf.sprintf "%s hide → remove" label)
        (membership_ops
           (Option.value (get "children" hide_delta) ~default:(Wire.Map []))
         = Wire.Map
             [ ( Wire.Uuid pu
               , Wire.Map
                   [ kw "remove"
                   , Wire.Array
                       [ Wire.Array [ Wire.Uuid cu; Wire.String "a0" ] ]
                   ; kw "upsert", Wire.Array [] ] ) ]);
      check (Printf.sprintf "%s show → upsert" label)
        (membership_ops
           (Option.value (get "children" show_delta) ~default:(Wire.Map []))
         = Wire.Map
             [ ( Wire.Uuid pu
               , Wire.Map
                   [ kw "remove", Wire.Array []
                   ; ( kw "upsert"
                     , Wire.Array
                         [ Wire.Array [ Wire.Uuid cu; Wire.String "a0" ] ] ) ] ) ]))
    [ "recycled child", ":logseq.property/deleted-at", "1000"
    ; "closed property value", ":block/closed-value-property", "3"
    ; "text property value", ":logseq.property/created-from-property", "3" ]

(* (deftest insert-builds-a-minimal-child-upsert-test) *)
let test_insert_minimal_upsert () =
  let pu = u () and cu = u () in
  let db_before =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 10}]" pu)
  in
  let report =
    tx_report db_before
      (Printf.sprintf
         "[{:block/uuid #uuid \"%s\" :block/parent [:block/uuid #uuid \"%s\"] :block/order \"a1\" :block/tx-id 11}
           [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 11]]"
         cu pu pu)
  in
  let delta =
    build_delta report
      ~blocks:
        (Wire.Map
           [ Wire.Uuid pu, block pu 11 "parent"
           ; Wire.Uuid cu, block cu 11 "child" ])
  in
  check "minimal upsert"
    (membership_ops
       (Option.value (get "children" delta) ~default:(Wire.Map []))
     = Wire.Map
         [ ( Wire.Uuid pu
           , Wire.Map
               [ kw "remove", Wire.Array []
               ; ( kw "upsert"
                 , Wire.Array
                     [ Wire.Array [ Wire.Uuid cu; Wire.String "a1" ] ] ) ] ) ])

(* (deftest same-parent-order-change-removes-old-order-and-upserts-new-order-test) *)
let test_same_parent_order_change () =
  let pu = u () and cu = u () in
  let db_before =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 10}
           {:db/id 2 :block/uuid #uuid \"%s\" :block/parent 1 :block/order \"a0\" :block/tx-id 10}]"
         pu cu)
  in
  let report =
    tx_report db_before
      (Printf.sprintf
         "[[:db/add [:block/uuid #uuid \"%s\"] :block/order \"a2\"] [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 11]]"
         cu pu)
  in
  check "old order removed, new upserted"
    (membership_ops
       (Option.value
          (get "children"
             (build_delta report
                ~blocks:(Wire.Map [ Wire.Uuid pu, block pu 11 "parent" ])))
          ~default:(Wire.Map []))
     = Wire.Map
         [ ( Wire.Uuid pu
           , Wire.Map
               [ ( kw "remove"
                 , Wire.Array
                     [ Wire.Array [ Wire.Uuid cu; Wire.String "a0" ] ] )
               ; ( kw "upsert"
                 , Wire.Array
                     [ Wire.Array [ Wire.Uuid cu; Wire.String "a2" ] ] ) ] ) ])

(* (deftest move-builds-old-parent-removal-and-new-parent-upsert-test) *)
let test_move_patch () =
  let old_u = u () and new_u = u () and cu = u () in
  let db_before =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 17}
           {:db/id 2 :block/uuid #uuid \"%s\" :block/tx-id 18}
           {:db/id 3 :block/uuid #uuid \"%s\" :block/parent 1 :block/order \"a0\" :block/tx-id 19}]"
         old_u new_u cu)
  in
  let report =
    tx_report db_before
      (Printf.sprintf
         "[[:db/add [:block/uuid #uuid \"%s\"] :block/parent [:block/uuid #uuid \"%s\"]]
           [:db/add [:block/uuid #uuid \"%s\"] :block/order \"a3\"]
           [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 20]
           [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 20]]"
         cu new_u cu old_u new_u)
  in
  let children =
    membership_ops
      (Option.value
         (get "children"
            (build_delta report
               ~blocks:
                 (Wire.Map
                    [ Wire.Uuid old_u, block old_u 20 "old parent"
                    ; Wire.Uuid new_u, block new_u 20 "new parent" ])))
         ~default:(Wire.Map []))
  in
  let parent_patch pu =
    match children with
    | Wire.Map kvs -> List.assoc_opt (Wire.Uuid pu) kvs
    | _ -> None
  in
  check "old parent removal"
    (parent_patch old_u
     = Some
         (Wire.Map
            [ ( kw "remove"
              , Wire.Array
                  [ Wire.Array [ Wire.Uuid cu; Wire.String "a0" ] ] )
            ; kw "upsert", Wire.Array [] ]));
  check "new parent upsert"
    (parent_patch new_u
     = Some
         (Wire.Map
            [ kw "remove", Wire.Array []
            ; ( kw "upsert"
              , Wire.Array
                  [ Wire.Array [ Wire.Uuid cu; Wire.String "a3" ] ] ) ]));
  check "exactly two parent patches"
    (match children with Wire.Map [ _; _ ] -> true | _ -> false)

(* cljs insertion-report helper *)
let insertion_report (parent_uuid : string) (child_uuid : string)
    (unrelated_count : int) : tx_report =
  let unrelated =
    List.init unrelated_count (fun i ->
        Printf.sprintf
          "{:db/id %d :block/uuid #uuid \"%s\" :block/parent 1 :block/order \"z%d\" :block/tx-id 10}"
          (3 + i) (u ()) i)
  in
  let db_before =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 10} %s]"
         parent_uuid
         (String.concat " " unrelated))
  in
  tx_report db_before
    (Printf.sprintf
       "[{:block/uuid #uuid \"%s\" :block/parent [:block/uuid #uuid \"%s\"] :block/order \"a1\" :block/tx-id 11}
         [:db/add [:block/uuid #uuid \"%s\"] :block/tx-id 11]]"
       child_uuid parent_uuid parent_uuid)

(* (deftest structural-delta-cardinality-is-independent-of-unrelated-siblings-test) *)
let test_cardinality_independent () =
  let pu = u () and cu = u () in
  let build n =
    build_delta (insertion_report pu cu n)
      ~blocks:
        (Wire.Map
           [ Wire.Uuid pu, block pu 11 "parent"
           ; Wire.Uuid cu, block cu 11 "child" ])
  in
  let small_delta = build 10 in
  let large_delta = build 10000 in
  check "children identical across sizes"
    (get "children" small_delta = get "children" large_delta);
  (match get "children" large_delta with
   | Some (Wire.Map [ Wire.Uuid p, Wire.Map pf ]) when p = pu ->
       check "one parent patch" true;
       (match List.assoc_opt (kw "upsert") pf with
        | Some (Wire.Array [ _ ]) -> check "one upsert op" true
        | _ -> check "one upsert op" false)
   | _ -> check "one parent patch" false)

(* (deftest malformed-identities-and-revisions-fail-fast-test) *)
let test_malformed_fail_fast () =
  let bu = u () and ou = u () in
  let valid_block = block bu 11 "block" in
  let db =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 11}]" bu)
  in
  let report = with_tx db [] in
  throws_with "delta revision" "Invalid renderer revision" (fun () ->
      build_delta report ~rev:(-1));
  throws_with "block map key" "Invalid block UUID" (fun () ->
      build_delta report
        ~blocks:(Wire.Map [ Wire.String "not-a-uuid", valid_block ]));
  throws_with "replacement identity" "Block UUID does not match its key"
    (fun () ->
      build_delta report
        ~blocks:(Wire.Map [ Wire.Uuid ou, valid_block ]));
  throws_with "replacement revision" "Invalid block transaction ID"
    (fun () ->
      build_delta report
        ~blocks:
          (Wire.Map
             [ ( Wire.Uuid bu
               , Wire.Map
                   [ kw "block/uuid", Wire.Uuid bu
                   ; kw "block/title", Wire.String "block" ] ) ]));
  (* cljs `{:deleted-block-uuids #{"not-a-uuid"}}` cannot be expressed:
     OCaml ~deleted_block_uuids is a `string list` wrapped as
     Wire.Uuid unconditionally — a structurally valid tag, so the
     "Invalid deleted block UUID" check can never trigger through the
     typed API (divergence documented in the header). *)
  throws_with "one block cannot be replaced and deleted"
    "Block cannot be replaced and deleted" (fun () ->
      build_delta report
        ~blocks:(Wire.Map [ Wire.Uuid bu, valid_block ])
        ~deleted_block_uuids:[ bu ])

(* (deftest structural-owner-does-not-require-a-new-transaction-id-test) *)
let test_no_new_txid_required () =
  let pu = u () and cu = u () in
  let db_before =
    db_with_blocks
      (Printf.sprintf
         "[{:db/id 1 :block/uuid #uuid \"%s\" :block/tx-id 10}]" pu)
  in
  let report =
    tx_report db_before
      (Printf.sprintf
         "[{:block/uuid #uuid \"%s\" :block/parent [:block/uuid #uuid \"%s\"] :block/order \"a1\" :block/tx-id 11}]"
         cu pu)
  in
  check "upsert without parent tx-id bump"
    (membership_ops
       (Option.value
          (get "children"
             (build_delta report
                ~blocks:(Wire.Map [ Wire.Uuid cu, block cu 11 "child" ])))
          ~default:(Wire.Map []))
     = Wire.Map
         [ ( Wire.Uuid pu
           , Wire.Map
               [ kw "remove", Wire.Array []
               ; ( kw "upsert"
                 , Wire.Array
                     [ Wire.Array [ Wire.Uuid cu; Wire.String "a1" ] ] ) ] ) ])

let cases =
  [ Alcotest.test_case
      "complete-block-replacements-and-delta-invariants-test" `Quick
      test_complete_block_replacements
  ; Alcotest.test_case
      "affected-resource-keys-pass-through-without-delta-owned-invalidation-test"
      `Quick test_affected_keys_pass_through
  ; Alcotest.test_case "deleted-blocks-become-revisioned-tombstones-test"
      `Quick test_deleted_tombstones
  ; Alcotest.test_case "content-only-change-has-no-children-patch-test"
      `Quick test_content_only_no_children
  ; Alcotest.test_case
      "unordered-parent-reference-has-no-children-patch-test" `Quick
      test_unordered_parent_no_children
  ; Alcotest.test_case
      "direct-child-visibility-builds-remove-and-upsert-patches-test"
      `Quick test_direct_child_visibility
  ; Alcotest.test_case "insert-builds-a-minimal-child-upsert-test" `Quick
      test_insert_minimal_upsert
  ; Alcotest.test_case
      "same-parent-order-change-removes-old-order-and-upserts-new-order-test"
      `Quick test_same_parent_order_change
  ; Alcotest.test_case
      "move-builds-old-parent-removal-and-new-parent-upsert-test" `Quick
      test_move_patch
  ; Alcotest.test_case
      "structural-delta-cardinality-is-independent-of-unrelated-siblings-test"
      `Quick test_cardinality_independent
  ; Alcotest.test_case "malformed-identities-and-revisions-fail-fast-test"
      `Quick test_malformed_fail_fast
  ; Alcotest.test_case
      "structural-owner-does-not-require-a-new-transaction-id-test" `Quick
      test_no_new_txid_required ]
