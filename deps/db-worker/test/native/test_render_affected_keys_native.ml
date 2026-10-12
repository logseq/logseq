(* 1:1 OCaml translation of
   src/test/frontend/worker/render_affected_keys_test.cljs (26 deftests).
   cljs deftest names are kept as OCaml test names.

   Route: cljs `(d/with db-before tx-data)` ->
   `Datascript.with_tx db_before (parse_tx_data_string "<same EDN>")`,
   then `Render_affected_keys.affected_keys` on the report.

   cljs set equality `#{...}` -> `keys_eq` (structural set compare).
   cljs `keys-with-tag` -> `keys_with_tag`. *)

open Datascript
open Test_shared

(* cljs render-affected-keys-test/schema *)
let affected_keys_schema () =
  Datascript.schema_of_edn_string
    "{:db/ident {:db/unique :db.unique/identity}
      :block/uuid {:db/unique :db.unique/identity}
      :block/tags {:db/valueType :db.type/ref
                   :db/cardinality :db.cardinality/many}
      :block/refs {:db/valueType :db.type/ref
                   :db/cardinality :db.cardinality/many}
      :block/alias {:db/valueType :db.type/ref
                    :db/cardinality :db.cardinality/many}
      :block/parent {:db/valueType :db.type/ref}
      :block/page {:db/valueType :db.type/ref}
      :logseq.property/status {:db/valueType :db.type/ref}
      :logseq.property/default-value {:db/valueType :db.type/ref}
      :logseq.property.class/properties {:db/valueType :db.type/ref
                                         :db/cardinality :db.cardinality/many}
      :block/closed-value-property {:db/valueType :db.type/ref
                                    :db/cardinality :db.cardinality/many}
      :logseq.property/created-from-property {:db/valueType :db.type/ref}
      :logseq.property.comments/blocks {:db/valueType :db.type/ref
                                        :db/cardinality :db.cardinality/many}
      :logseq.property.history/block {:db/valueType :db.type/ref}
      :logseq.property.history/property {:db/valueType :db.type/ref}
      :logseq.property.history/ref-value {:db/valueType :db.type/ref}
      :logseq.property.reaction/target {:db/valueType :db.type/ref}
      :logseq.property/view-for {:db/valueType :db.type/ref}
      :logseq.property.class/extends {:db/valueType :db.type/ref
                                      :db/cardinality :db.cardinality/many}
      :logseq.property/classes {:db/valueType :db.type/ref
                                :db/cardinality :db.cardinality/many}
      :user.property/target {:db/valueType :db.type/ref}
      :plugin.property.example/target {:db/valueType :db.type/ref}}"

(* cljs db-with: (d/db-with (d/empty-db schema) entities) *)
let db_with (entities_edn : string) : db =
  db_with_string entities_edn (empty_db ~schema:(affected_keys_schema ()) ())

(* cljs affected-keys: (render-affected-keys/affected-keys (d/with db tx)) *)
let affected_keys (db_before : db) (tx_edn : string) : Wire.t list =
  Render_affected_keys.affected_keys
    (with_tx db_before (parse_tx_data_string tx_edn))

(* cljs keys-with-tag: keys whose first element equals tag *)
let keys_with_tag (tag : string) (keys : Wire.t list) : Wire.t list =
  List.filter
    (function
      | Wire.Array (Wire.Keyword t :: _) | Wire.List (Wire.Keyword t :: _)
        -> String.equal t tag
      | _ -> false)
    keys

(* cljs set equality on key lists *)
let keys_eq (expected : Wire.t list) (actual : Wire.t list) : bool =
  let norm = List.sort_uniq Stdlib.compare in
  norm expected = norm actual

let contains_key (k : Wire.t) (keys : Wire.t list) : bool = List.mem k keys

let kw s = Wire.Keyword s
let u () = Uuid_gen.uuid ()

let key1 tag = Wire.Array [ kw tag ]
let key2 tag v = Wire.Array [ kw tag; v ]
let key3 tag a b = Wire.Array [ kw tag; a; b ]
let entity_key s = key2 "entity" (Wire.Uuid s)
let attr_key a = key2 "attr" (kw a)
let pm_key a = key2 "property-membership" (kw a)

(* ---------- tests ---------- *)

(* (deftest affected-keys-do-not-add-a-global-invalidation-test) *)
let test_affected_keys_do_not_add_a_global_invalidation_test () =
  let block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\" :block/title \"Before\"}]"
         block_uuid)
  in
  let title_change =
    affected_keys db "[[:db/add 10 :block/title \"After\"]]"
  in
  check "Exact transactions must not invalidate every renderer resource."
    (not (contains_key (key1 "graph") title_change));
  check "An empty transaction has no renderer dependencies."
    (affected_keys db "[]" = [])

(* (deftest direct-children-invalidation-follows-membership-and-order-test) *)
let test_direct_children_invalidation_follows_membership_and_order_test () =
  let parent_before_uuid = u () in
  let parent_after_uuid = u () in
  let child_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\" :block/title \"Child\"
            :block/parent 10 :block/order \"a0\"}]"
         parent_before_uuid parent_after_uuid child_uuid)
  in
  let children_keys ks = keys_with_tag "children" ks in
  (* adding and removing a direct child *)
  let db_without_child =
    db_with
      (Printf.sprintf "[{:db/id 10 :block/uuid #uuid \"%s\"}]"
         parent_before_uuid)
  in
  check "children: add direct child"
    (keys_eq
       [ key2 "children" (Wire.Uuid parent_before_uuid) ]
       (children_keys
          (affected_keys db_without_child
             (Printf.sprintf
                "[{:db/id 12 :block/uuid #uuid \"%s\" :block/parent 10 \
                  :block/order \"a0\"}]"
                child_uuid))));
  check "children: retractEntity child"
    (keys_eq
       [ key2 "children" (Wire.Uuid parent_before_uuid) ]
       (children_keys (affected_keys db "[[:db/retractEntity 12]]")));
  (* moving a child invalidates both parents *)
  check "children: moving invalidates both parents"
    (keys_eq
       [ key2 "children" (Wire.Uuid parent_before_uuid)
       ; key2 "children" (Wire.Uuid parent_after_uuid) ]
       (children_keys (affected_keys db "[[:db/add 12 :block/parent 11]]")));
  (* ordering and visibility invalidate the current parent *)
  List.iter
    (fun tx_data ->
       check "children: ordering/visibility invalidate current parent"
         (keys_eq
            [ key2 "children" (Wire.Uuid parent_before_uuid) ]
            (children_keys (affected_keys db tx_data))))
    [ "[[:db/add 12 :block/order \"b0\"]]"
    ; "[[:db/add 12 :block/closed-value-property 11]]"
    ; "[[:db/add 12 :logseq.property/created-from-property 11]]"
    ; "[[:db/add 12 :logseq.property/deleted-at 1000]]" ];
  (* renaming a child does not invalidate membership *)
  check "children: rename does not invalidate membership"
    (keys_eq []
       (children_keys
          (affected_keys db "[[:db/add 12 :block/title \"Renamed\"]]")))

(* (deftest route-page-invalidation-is-limited-to-heading-candidates-test) *)
let test_route_page_invalidation_is_limited_to_heading_candidates_test () =
  let page_before_uuid = u () in
  let page_after_uuid = u () in
  let reference_before_uuid = u () in
  let reference_after_uuid = u () in
  let heading_uuid = u () in
  let plain_block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\" :block/title \"Before reference\"}
           {:db/id 13 :block/uuid #uuid \"%s\" :block/title \"After reference\"}
           {:db/id 14 :block/uuid #uuid \"%s\" :block/title \"Heading\"
            :block/page 10 :block/refs 12 :logseq.property/heading 2}
           {:db/id 15 :block/uuid #uuid \"%s\" :block/title \"Plain\"
            :block/page 10}]"
         page_before_uuid page_after_uuid reference_before_uuid
         reference_after_uuid heading_uuid plain_block_uuid)
  in
  let route_page_keys ks = keys_with_tag "route-page" ks in
  (* candidate title, refs, tags, and heading changes *)
  List.iter
    (fun tx_data ->
       check "route-page: candidate title/refs/tags/heading"
         (keys_eq
            [ key2 "route-page" (Wire.Uuid page_before_uuid) ]
            (route_page_keys (affected_keys db tx_data))))
    [ "[[:db/add 14 :block/title \"Renamed heading\"]]"
    ; "[[:db/retract 14 :block/refs 12] [:db/add 14 :block/refs 13]]"
    ; "[[:db/add 14 :block/tags 13]]"
    ; "[[:db/retract 14 :logseq.property/heading 2]]" ];
  (* moving a candidate invalidates the old and new page scopes *)
  check "route-page: moving candidate hits old+new page"
    (keys_eq
       [ key2 "route-page" (Wire.Uuid page_before_uuid)
       ; key2 "route-page" (Wire.Uuid page_after_uuid) ]
       (route_page_keys (affected_keys db "[[:db/add 14 :block/page 11]]")));
  (* adding heading status makes an existing block a candidate *)
  check "route-page: heading add makes candidate"
    (keys_eq
       [ key2 "route-page" (Wire.Uuid page_before_uuid) ]
       (route_page_keys
          (affected_keys db "[[:db/add 15 :logseq.property/heading 2]]")));
  (* unrelated plain block and referenced-title changes stay exact *)
  check "route-page: plain block edit stays exact"
    (keys_eq []
       (route_page_keys
          (affected_keys db "[[:db/add 15 :block/title \"Still plain\"]]")));
  let keys =
    affected_keys db "[[:db/add 12 :block/title \"Renamed reference\"]]"
  in
  check "route-page: referenced title stays exact" (keys_eq [] (route_page_keys keys));
  check "Referenced entities invalidate through their exact entity key."
    (contains_key (entity_key reference_before_uuid) keys)

(* (deftest transaction-stamps-have-no-renderer-dependencies-test) *)
let test_transaction_stamps_have_no_renderer_dependencies_test () =
  let block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\" :block/tx-id 10}]" block_uuid)
  in
  check "empty tx" (affected_keys db "[]" = []);
  check
    "Pipeline transaction stamps are transport metadata, not resource dependencies."
    (affected_keys db "[[:db/add 10 :block/tx-id 11]]" = [])

(* (deftest empty-block-insertion-does-not-invalidate-page-reference-resources-test) *)
let test_empty_block_insertion_does_not_invalidate_page_reference_resources_test
    () =
  let page_uuid = u () in
  let block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\" :block/name \"page\" \
           :block/title \"Page\" :block/updated-at 1000}]"
         page_uuid)
  in
  let keys =
    affected_keys db
      (Printf.sprintf
         "[[:db/add 10 :block/updated-at 2000]
           {:db/id 11 :block/uuid #uuid \"%s\" :block/title \"\"
            :block/parent 10 :block/page 10 :block/order \"a0\"
            :block/created-at 2000 :block/updated-at 2000}]"
         block_uuid)
  in
  check
    "A parent timestamp update must not invalidate resources derived from page content."
    (not (contains_key (entity_key page_uuid) keys))

(* (deftest semantic-attributes-invalidate-the-entity-and-property-membership-test) *)
let test_semantic_attributes_invalidate_the_entity_and_property_membership_test
    () =
  let block_uuid = u () in
  let property_ident = ":user.property/priority" in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\" %s \"low\"}]" block_uuid
         property_ident)
  in
  check "semantic attr invalidation"
    (keys_eq
       [ entity_key block_uuid
       ; attr_key "user.property/priority"
       ; pm_key "user.property/priority" ]
       (affected_keys db
          (Printf.sprintf "[[:db/add 10 %s \"high\"]]" property_ident)))

(* (deftest page-identity-invalidation-uses-old-and-new-lookups-test) *)
let test_page_identity_invalidation_uses_old_and_new_lookups_test () =
  let old_uuid = u () in
  let new_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\" :block/name \"old page\"}]"
         old_uuid)
  in
  check "page identity old+new lookups"
    (keys_eq
       [ entity_key old_uuid
       ; entity_key new_uuid
       ; attr_key "block/uuid"
       ; attr_key "block/name"
       ; pm_key "block/uuid"
       ; pm_key "block/name"
       ; key2 "page-lookup" (Wire.Uuid old_uuid)
       ; key2 "page-lookup" (Wire.Uuid new_uuid)
       ; key2 "page-lookup" (Wire.String "old page")
       ; key2 "page-lookup" (Wire.String "new page")
       ; key1 "page-membership" ]
       (affected_keys db
          (Printf.sprintf
             "[{:db/id 10 :block/uuid #uuid \"%s\" :block/name \"new page\"}]"
             new_uuid)))

(* (deftest page-visibility-invalidates-page-membership-test) *)
let test_page_visibility_invalidates_page_membership_test () =
  let page_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\" :block/name \"page\" \
           :block/title \"Page\"}]"
         page_uuid)
  in
  check "page visibility membership"
    (keys_eq
       [ entity_key page_uuid
       ; attr_key "logseq.property/deleted-at"
       ; pm_key "logseq.property/deleted-at"
       ; key1 "page-membership"
       ; key1 "recycle-roots" ]
       (affected_keys db
          "[[:db/add 10 :logseq.property/deleted-at 1000]]"))

(* (deftest recycle-root-membership-follows-deleted-at-test) *)
let test_recycle_root_membership_follows_deleted_at_test () =
  let block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\" :block/title \"Recycled block\"}]"
         block_uuid)
  in
  check "recycle on add deleted-at"
    (contains_key (key1 "recycle-roots")
       (affected_keys db
          "[[:db/add 10 :logseq.property/deleted-at 1000]]"));
  let recycled_db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\" :block/title \"Recycled block\" \
           :logseq.property/deleted-at 1000}]"
         block_uuid)
  in
  check "recycle on retract deleted-at"
    (contains_key (key1 "recycle-roots")
       (affected_keys recycled_db
          "[[:db/retract 10 :logseq.property/deleted-at 1000]]"))

(* (deftest journal-membership-follows-journal-identity-and-visibility-test) *)
let test_journal_membership_follows_journal_identity_and_visibility_test () =
  let journal_tag_uuid = u () in
  let journal_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 1 :db/ident :logseq.class/Journal :block/uuid #uuid \"%s\"}
           {:db/id 10 :block/uuid #uuid \"%s\" :block/name \"journal\"
            :block/title \"Journal\" :block/journal-day 20260720
            :block/tags 1}]"
         journal_tag_uuid journal_uuid)
  in
  check "journal day changes"
    (keys_eq
       [ entity_key journal_uuid
       ; attr_key "block/journal-day"
       ; pm_key "block/journal-day"
       ; key1 "journals" ]
       (affected_keys db "[[:db/add 10 :block/journal-day 20260721]]"));
  check "recycling a journal"
    (keys_eq
       [ entity_key journal_uuid
       ; attr_key "logseq.property/deleted-at"
       ; pm_key "logseq.property/deleted-at"
       ; key1 "page-membership"
       ; key1 "journals"
       ; key1 "recycle-roots" ]
       (affected_keys db
          "[[:db/add 10 :logseq.property/deleted-at 1000]]"))

(* (deftest reaction-invalidation-resolves-targets-from-both-databases-test) *)
let test_reaction_invalidation_resolves_targets_from_both_databases_test () =
  let target_before_uuid = u () in
  let target_after_uuid = u () in
  let reaction_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\"
            :logseq.property.reaction/target 10
            :logseq.property.reaction/emoji-id \"old\"}]"
         target_before_uuid target_after_uuid reaction_uuid)
  in
  check "moving a reaction invalidates old and new target"
    (keys_eq
       [ entity_key reaction_uuid
       ; attr_key "logseq.property.reaction/target"
       ; pm_key "logseq.property.reaction/target"
       ; key2 "reactions" (Wire.Uuid target_before_uuid)
       ; key2 "reactions" (Wire.Uuid target_after_uuid) ]
       (affected_keys db
          "[[:db/add 12 :logseq.property.reaction/target 11]]"));
  check "editing a reaction still invalidates unchanged target"
    (keys_eq
       [ entity_key reaction_uuid
       ; attr_key "logseq.property.reaction/emoji-id"
       ; pm_key "logseq.property.reaction/emoji-id"
       ; key2 "reactions" (Wire.Uuid target_before_uuid) ]
       (affected_keys db
          "[[:db/add 12 :logseq.property.reaction/emoji-id \"new\"]]"));
  check "deleting a target does not reload its retiring reactions resource"
    (keys_eq []
       (keys_with_tag "reactions"
          (affected_keys db
             "[[:db/retractEntity 12] [:db/retractEntity 10]]")))

(* (deftest view-definition-invalidation-uses-before-and-after-owner-feature-pairs-test) *)
let test_view_definition_invalidation_uses_before_and_after_owner_feature_pairs_test
    () =
  let owner_before_uuid = u () in
  let owner_after_uuid = u () in
  let view_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\" :block/order \"a0\"
            :logseq.property/view-for 10
            :logseq.property.view/feature-type :class-objects}]"
         owner_before_uuid owner_after_uuid view_uuid)
  in
  check "owner and feature changes produce two real pairs"
    (keys_eq
       [ entity_key view_uuid
       ; attr_key "logseq.property/view-for"
       ; attr_key "logseq.property.view/feature-type"
       ; pm_key "logseq.property/view-for"
       ; pm_key "logseq.property.view/feature-type"
       ; key3 "views" (Wire.Uuid owner_before_uuid) (kw "class-objects")
       ; key3 "views" (Wire.Uuid owner_after_uuid) (kw "linked-references") ]
       (affected_keys db
          "[{:db/id 12 :logseq.property/view-for 11
             :logseq.property.view/feature-type :linked-references}]"));
  check "ordering a view invalidates its current definition list"
    (keys_eq
       [ entity_key view_uuid
       ; attr_key "block/order"
       ; pm_key "block/order"
       ; key3 "views" (Wire.Uuid owner_before_uuid) (kw "class-objects") ]
       (affected_keys db "[[:db/add 12 :block/order \"b0\"]]"))

(* (deftest class-membership-invalidation-uses-old-and-new-classes-test) *)
let test_class_membership_invalidation_uses_old_and_new_classes_test () =
  let class_before_uuid = u () in
  let class_after_uuid = u () in
  let object_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\" :block/tags 10}]"
         class_before_uuid class_after_uuid object_uuid)
  in
  check "class membership old+new classes"
    (keys_eq
       [ entity_key object_uuid
       ; attr_key "block/tags"
       ; pm_key "block/tags"
       ; key2 "display-properties" (Wire.Uuid object_uuid)
       ; key2 "class-membership" (Wire.Uuid class_before_uuid)
       ; key2 "class-membership" (Wire.Uuid class_after_uuid) ]
       (affected_keys db
          "[[:db/retract 12 :block/tags 10] [:db/add 12 :block/tags 11]]"))

(* (deftest class-property-definition-invalidation-uses-class-tree-test) *)
let test_class_property_definition_invalidation_uses_class_tree_test () =
  let class_uuid = u () in
  let property_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}]"
         class_uuid property_uuid)
  in
  check "class property definition -> class-tree"
    (contains_key (key1 "class-tree")
       (affected_keys db
          "[[:db/add 10 :logseq.property.class/properties 11]]"))

(* (deftest property-presentation-configuration-invalidates-property-resources-test) *)
let test_property_presentation_configuration_invalidates_property_resources_test
    () =
  let property_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 1 :db/ident :logseq.class/Property}
           {:db/id 2 :db/ident :user.property/configured
            :block/uuid #uuid \"%s\" :block/tags 1
            :logseq.property/ui-position :block-right}]"
         property_uuid)
  in
  check "property presentation config"
    (contains_key (key1 "property-config")
       (affected_keys db
          "[[:db/add 2 :logseq.property/ui-position :properties]]"))

(* (deftest class-hierarchy-and-aliases-invalidate-reference-scope-test) *)
let test_class_hierarchy_and_aliases_invalidate_reference_scope_test () =
  let class_uuid = u () in
  let parent_before_uuid = u () in
  let parent_after_uuid = u () in
  let alias_before_uuid = u () in
  let alias_after_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"
            :logseq.property.class/extends 11 :block/alias 13}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\"}
           {:db/id 13 :block/uuid #uuid \"%s\"}
           {:db/id 14 :block/uuid #uuid \"%s\"}
           {:db/id 15 :db/ident :block/alias :block/tags 16}
           {:db/id 16 :db/ident :logseq.class/Property}]"
         class_uuid parent_before_uuid parent_after_uuid alias_before_uuid
         alias_after_uuid)
  in
  check "class hierarchy"
    (keys_eq
       [ entity_key class_uuid
       ; attr_key "logseq.property.class/extends"
       ; pm_key "logseq.property.class/extends"
       ; key1 "class-tree"
       ; key1 "ref-scope" ]
       (affected_keys db
          "[[:db/retract 10 :logseq.property.class/extends 11]
            [:db/add 10 :logseq.property.class/extends 12]]"));
  check "aliases"
    (keys_eq
       [ entity_key class_uuid
       ; attr_key "block/alias"
       ; pm_key "block/alias"
       ; key2 "display-properties" (Wire.Uuid class_uuid)
       ; key1 "ref-scope" ]
       (affected_keys db
          "[[:db/retract 10 :block/alias 13] [:db/add 10 :block/alias 14]]"))

(* (deftest reference-invalidation-uses-old-and-new-targets-test) *)
let test_reference_invalidation_uses_old_and_new_targets_test () =
  let target_before_uuid = u () in
  let target_after_uuid = u () in
  let ref_block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\" :block/title \"Reference\"
            :block/refs 10}]"
         target_before_uuid target_after_uuid ref_block_uuid)
  in
  check "ref invalidation old+new targets"
    (keys_eq
       [ entity_key ref_block_uuid
       ; attr_key "block/refs"
       ; pm_key "block/refs"
       ; key2 "refs" (Wire.Uuid target_before_uuid)
       ; key2 "refs" (Wire.Uuid target_after_uuid) ]
       (affected_keys db
          "[[:db/retract 12 :block/refs 10] [:db/add 12 :block/refs 11]]"))

(* (deftest ref-bearing-block-content-structure-and-visibility-invalidate-its-target-test) *)
let test_ref_bearing_block_content_structure_and_visibility_invalidate_its_target_test
    () =
  let target_uuid = u () in
  let parent_before_uuid = u () in
  let parent_after_uuid = u () in
  let ref_block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\"}
           {:db/id 13 :block/uuid #uuid \"%s\" :block/title \"Before\"
            :block/parent 11 :block/refs 10}]"
         target_uuid parent_before_uuid parent_after_uuid ref_block_uuid)
  in
  let common =
    [ entity_key ref_block_uuid; key2 "refs" (Wire.Uuid target_uuid) ]
  in
  check "content"
    (keys_eq
       (common @ [ attr_key "block/title"; pm_key "block/title" ])
       (affected_keys db "[[:db/add 13 :block/title \"After\"]]"));
  check "sorting attributes"
    (keys_eq
       [ attr_key "block/updated-at"
       ; pm_key "block/updated-at"
       ; key2 "refs" (Wire.Uuid target_uuid) ]
       (affected_keys db "[[:db/add 13 :block/updated-at 1000]]"));
  check "structure"
    (keys_eq
       (common
        @ [ attr_key "block/parent"
          ; pm_key "block/parent"
          ; key2 "children" (Wire.Uuid parent_before_uuid)
          ; key2 "children" (Wire.Uuid parent_after_uuid) ])
       (affected_keys db "[[:db/add 13 :block/parent 12]]"));
  check "visibility"
    (keys_eq
       (common
        @ [ attr_key "logseq.property/deleted-at"
          ; pm_key "logseq.property/deleted-at"
          ; key2 "children" (Wire.Uuid parent_before_uuid)
          ; key1 "recycle-roots" ])
       (affected_keys db
          "[[:db/add 13 :logseq.property/deleted-at 1000]]"))

(* (deftest comments-invalidation-resolves-old-and-new-thread-targets-test) *)
let test_comments_invalidation_resolves_old_and_new_thread_targets_test () =
  let comments_tag_uuid = u () in
  let target_before_uuid = u () in
  let target_after_uuid = u () in
  let comments_area_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 1 :db/ident :logseq.class/Comments
            :block/uuid #uuid \"%s\"}
           {:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\" :block/tags 1
            :logseq.property.comments/blocks 10}]"
         comments_tag_uuid target_before_uuid target_after_uuid
         comments_area_uuid)
  in
  let comments_key u = key2 "comments" (Wire.Uuid u) in
  check "thread target assignment"
    (keys_eq
       [ comments_key target_before_uuid; comments_key target_after_uuid ]
       (keys_with_tag "comments"
          (affected_keys db
             "[[:db/retract 12 :logseq.property.comments/blocks 10]
               [:db/add 12 :logseq.property.comments/blocks 11]]")));
  check "comments tag removal"
    (keys_eq [ comments_key target_before_uuid ]
       (keys_with_tag "comments"
          (affected_keys db "[[:db/retract 12 :block/tags 1]]")));
  check "comments area deletion"
    (keys_eq [ comments_key target_before_uuid ]
       (keys_with_tag "comments"
          (affected_keys db
             "[[:db/add 12 :logseq.property/deleted-at 1000]]")));
  check "comments area reorder"
    (keys_eq [ comments_key target_before_uuid ]
       (keys_with_tag "comments"
          (affected_keys db "[[:db/add 12 :block/order \"a0\"]]")))

(* (deftest task-time-invalidation-covers-history-lifecycle-and-edits-test) *)
let test_task_time_invalidation_covers_history_lifecycle_and_edits_test () =
  let task_before_uuid = u () in
  let task_after_uuid = u () in
  let history_uuid = u () in
  let status_property_uuid = u () in
  let other_property_uuid = u () in
  let status_before_uuid = u () in
  let status_after_uuid = u () in
  let base_entities =
    Printf.sprintf
      "[{:db/id 10 :block/uuid #uuid \"%s\"}
        {:db/id 11 :block/uuid #uuid \"%s\"}
        {:db/id 12 :db/ident :logseq.property/status
         :block/uuid #uuid \"%s\"}
        {:db/id 13 :db/ident :user.property/other
         :block/uuid #uuid \"%s\"}
        {:db/id 14 :db/ident :logseq.property/status.doing
         :block/uuid #uuid \"%s\"}
        {:db/id 15 :db/ident :logseq.property/status.done
         :block/uuid #uuid \"%s\"}"
      task_before_uuid task_after_uuid status_property_uuid
      other_property_uuid status_before_uuid status_after_uuid
  in
  let history =
    Printf.sprintf
      "{:db/id 16 :block/uuid #uuid \"%s\" :block/created-at 1000
        :logseq.property.history/block 10
        :logseq.property.history/property 12
        :logseq.property.history/ref-value 14}]"
      history_uuid
  in
  let db_without_history = db_with (base_entities ^ "]") in
  let db = db_with (base_entities ^ history) in
  let task_time_keys ks = keys_with_tag "task-time" ks in
  (* history creation and deletion *)
  check "task-time: history creation"
    (keys_eq
       [ key2 "task-time" (Wire.Uuid task_before_uuid) ]
       (task_time_keys
          (affected_keys db_without_history ("[" ^ history))));
  check "task-time: history deletion"
    (keys_eq
       [ key2 "task-time" (Wire.Uuid task_before_uuid) ]
       (task_time_keys (affected_keys db "[[:db/retractEntity 16]]")));
  (* history fields *)
  List.iter
    (fun tx_data ->
       check "task-time: history fields"
         (keys_eq
            [ key2 "task-time" (Wire.Uuid task_before_uuid) ]
            (task_time_keys (affected_keys db tx_data))))
    [ "[[:db/add 16 :block/created-at 2000]]"
    ; "[[:db/add 16 :logseq.property.history/property 13]]"
    ; "[[:db/add 16 :logseq.property.history/ref-value 15]]" ];
  (* moving history invalidates both tasks *)
  check "task-time: moving history invalidates both tasks"
    (keys_eq
       [ key2 "task-time" (Wire.Uuid task_before_uuid)
       ; key2 "task-time" (Wire.Uuid task_after_uuid) ]
       (task_time_keys
          (affected_keys db
             "[[:db/add 16 :logseq.property.history/block 11]]")))

(* (deftest task-query-invalidation-is-semantic-test) *)
let test_task_query_invalidation_is_semantic_test () =
  let status_value_uuid = u () in
  let default_status_value_uuid = u () in
  let plain_block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 1 :db/ident :logseq.property/status
            :logseq.property/default-value 5}
           {:db/id 2 :block/uuid #uuid \"%s\" :block/title \"Doing\"}
           {:db/id 3 :block/uuid #uuid \"%s\" :logseq.property/status 2}
           {:db/id 4 :block/uuid #uuid \"%s\" :block/title \"Plain\"}
           {:db/id 5 :block/uuid #uuid \"%s\" :block/title \"Todo\"}
           {:db/id 10 :block/uuid #uuid \"%s\"
            :logseq.property.class/properties 1}]"
         status_value_uuid (u ()) plain_block_uuid
         default_status_value_uuid (u ()))
  in
  let task_keys tx = keys_with_tag "tasks" (affected_keys db tx) in
  check "ordinary block title edits do not rerun task queries"
    (keys_eq [] (task_keys "[[:db/add 4 :block/title \"Edited\"]]"));
  check "task status edits rerun task queries"
    (keys_eq [ key1 "tasks" ]
       (task_keys "[[:db/retract 3 :logseq.property/status 2]]"));
  check "status label edits rerun task queries"
    (keys_eq [ key1 "tasks" ]
       (task_keys "[[:db/add 2 :block/title \"In progress\"]]"));
  check "default status label edits rerun task queries"
    (keys_eq [ key1 "tasks" ]
       (task_keys "[[:db/add 5 :block/title \"Not started\"]]"));
  check "class membership changes can change a default task status"
    (keys_eq [ key1 "tasks" ] (task_keys "[[:db/add 4 :block/tags 10]]"))

(* (deftest task-attribute-invalidation-only-follows-task-entities-test) *)
let test_task_attribute_invalidation_only_follows_task_entities_test () =
  let task_uuid = u () in
  let default_task_uuid = u () in
  let plain_block_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 1 :db/ident :logseq.property/status
            :logseq.property/default-value 2}
           {:db/id 2 :block/uuid #uuid \"%s\" :block/title \"Doing\"}
           {:db/id 3 :block/uuid #uuid \"%s\" :logseq.property/status 2
            :block/page 10}
           {:db/id 4 :block/uuid #uuid \"%s\" :block/page 10}
           {:db/id 5 :block/uuid #uuid \"%s\" :block/tags 12
            :block/page 10}
           {:db/id 10 :block/uuid #uuid \"%s\"}
           {:db/id 11 :block/uuid #uuid \"%s\"}
           {:db/id 12 :block/uuid #uuid \"%s\"
            :logseq.property.class/properties 1}]"
         (u ()) task_uuid plain_block_uuid default_task_uuid (u ()) (u ())
         (u ()))
  in
  let task_attr_keys tx = keys_with_tag "task-attr" (affected_keys db tx) in
  check "ordinary block insertion and movement do not invalidate task attributes"
    (keys_eq [] (task_attr_keys "[[:db/add 4 :block/page 11]]"));
  check "moving a task invalidates its task-scoped page dependency"
    (keys_eq
       [ key2 "task-attr" (kw "block/page") ]
       (task_attr_keys "[[:db/add 3 :block/page 11]]"));
  check "moving a default task invalidates task-attr"
    (keys_eq
       [ key2 "task-attr" (kw "block/page") ]
       (task_attr_keys "[[:db/add 5 :block/page 11]]"))

(* (deftest display-properties-ignore-title-and-timestamp-edits-test) *)
let test_display_properties_ignore_title_and_timestamp_edits_test () =
  let block_uuid = u () in
  let property_uuid = u () in
  let db =
    db_with
      (Printf.sprintf
         "[{:db/id 1 :db/ident :user.property/display
            :block/uuid #uuid \"%s\"}
           {:db/id 2 :block/uuid #uuid \"%s\" :block/title \"Before\"}]"
         property_uuid block_uuid)
  in
  let display_keys tx =
    keys_with_tag "display-properties" (affected_keys db tx)
  in
  check "title edit ignored"
    (keys_eq [] (display_keys "[[:db/add 2 :block/title \"After\"]]"));
  check "timestamp edit ignored"
    (keys_eq [] (display_keys "[[:db/add 2 :block/updated-at 1000]]"));
  check "property value edit hits display-properties"
    (keys_eq
       [ key2 "display-properties" (Wire.Uuid block_uuid) ]
       (display_keys "[[:db/add 2 :user.property/display \"value\"]]"))

(* cljs bidirectional-db helper *)
type bidirectional_fixture =
  { class_uuid : string
  ; disabled_class_uuid : string
  ; property_uuid : string
  ; source_uuid : string
  ; target_before_uuid : string
  ; target_after_uuid : string
  ; db : db }

let bidirectional_db (property_ident : string) : bidirectional_fixture =
  let tag_uuid = u () in
  let class_uuid = u () in
  let disabled_class_uuid = u () in
  let property_uuid = u () in
  let source_uuid = u () in
  let target_before_uuid = u () in
  let target_after_uuid = u () in
  { class_uuid
  ; disabled_class_uuid
  ; property_uuid
  ; source_uuid
  ; target_before_uuid
  ; target_after_uuid
  ; db =
      db_with
        (Printf.sprintf
           "[{:db/id 1 :db/ident :logseq.class/Tag
              :block/uuid #uuid \"%s\"}
             {:db/id 2 :block/uuid #uuid \"%s\" :block/tags 1
              :logseq.property.class/enable-bidirectional? true}
             {:db/id 3 :block/uuid #uuid \"%s\" :block/tags 1
              :logseq.property.class/enable-bidirectional? false}
             {:db/id 4 :db/ident %s :block/uuid #uuid \"%s\"
              :db/valueType :db.type/ref :db/cardinality :db.cardinality/one
              :logseq.property/classes 2}
             {:db/id 5 :block/uuid #uuid \"%s\" :block/tags 2 %s 6}
             {:db/id 6 :block/uuid #uuid \"%s\"}
             {:db/id 7 :block/uuid #uuid \"%s\"}]"
           tag_uuid class_uuid disabled_class_uuid property_ident
           property_uuid source_uuid property_ident target_before_uuid
           target_after_uuid) }

(* (deftest bidirectional-invalidation-resolves-old-and-new-user-and-plugin-property-targets-test) *)
let test_bidirectional_invalidation_resolves_old_and_new_user_and_plugin_property_targets_test
    () =
  List.iter
    (fun property_ident ->
       let f = bidirectional_db (":" ^ property_ident) in
       check (Printf.sprintf "bidirectional: %s" property_ident)
         (keys_eq
            [ key2 "bidirectional" (Wire.Uuid f.target_before_uuid)
            ; key2 "bidirectional" (Wire.Uuid f.target_after_uuid) ]
            (keys_with_tag "bidirectional"
               (affected_keys f.db
                  (Printf.sprintf "[[:db/add 5 %s 7]]" property_ident)))))
    [ "user.property/target"; "plugin.property.example/target" ]

(* (deftest bidirectional-invalidation-covers-source-membership-and-visibility-test) *)
let test_bidirectional_invalidation_covers_source_membership_and_visibility_test
    () =
  let f = bidirectional_db ":user.property/target" in
  let expected = [ key2 "bidirectional" (Wire.Uuid f.target_before_uuid) ] in
  check "source class membership"
    (keys_eq expected
       (keys_with_tag "bidirectional"
          (affected_keys f.db "[[:db/retract 5 :block/tags 2]]")));
  check "source deletion"
    (keys_eq expected
       (keys_with_tag "bidirectional"
          (affected_keys f.db
             "[[:db/add 5 :logseq.property/deleted-at 1000]]")))

(* (deftest bidirectional-invalidation-covers-property-and-class-configuration-test) *)
let test_bidirectional_invalidation_covers_property_and_class_configuration_test
    () =
  let f = bidirectional_db ":user.property/target" in
  let expected = [ key2 "bidirectional" (Wire.Uuid f.target_before_uuid) ] in
  check "property class scope"
    (keys_eq expected
       (keys_with_tag "bidirectional"
          (affected_keys f.db
             "[[:db/retract 4 :logseq.property/classes 2]
               [:db/add 4 :logseq.property/classes 3]]")));
  check "class enablement"
    (keys_eq expected
       (keys_with_tag "bidirectional"
          (affected_keys f.db
             "[[:db/add 2 :logseq.property.class/enable-bidirectional? false]]")));
  check "class deletion"
    (keys_eq expected
       (keys_with_tag "bidirectional"
          (affected_keys f.db
             "[[:db/add 2 :logseq.property/deleted-at 1000]]")))

let cases : unit Alcotest.test_case list =
  [ Alcotest.test_case
      "affected-keys-do-not-add-a-global-invalidation-test" `Quick
      test_affected_keys_do_not_add_a_global_invalidation_test
  ; Alcotest.test_case
      "direct-children-invalidation-follows-membership-and-order-test" `Quick
      test_direct_children_invalidation_follows_membership_and_order_test
  ; Alcotest.test_case
      "route-page-invalidation-is-limited-to-heading-candidates-test" `Quick
      test_route_page_invalidation_is_limited_to_heading_candidates_test
  ; Alcotest.test_case
      "transaction-stamps-have-no-renderer-dependencies-test" `Quick
      test_transaction_stamps_have_no_renderer_dependencies_test
  ; Alcotest.test_case
      "empty-block-insertion-does-not-invalidate-page-reference-resources-test"
      `Quick
      test_empty_block_insertion_does_not_invalidate_page_reference_resources_test
  ; Alcotest.test_case
      "semantic-attributes-invalidate-the-entity-and-property-membership-test"
      `Quick
      test_semantic_attributes_invalidate_the_entity_and_property_membership_test
  ; Alcotest.test_case
      "page-identity-invalidation-uses-old-and-new-lookups-test" `Quick
      test_page_identity_invalidation_uses_old_and_new_lookups_test
  ; Alcotest.test_case "page-visibility-invalidates-page-membership-test"
      `Quick test_page_visibility_invalidates_page_membership_test
  ; Alcotest.test_case "recycle-root-membership-follows-deleted-at-test"
      `Quick test_recycle_root_membership_follows_deleted_at_test
  ; Alcotest.test_case
      "journal-membership-follows-journal-identity-and-visibility-test"
      `Quick
      test_journal_membership_follows_journal_identity_and_visibility_test
  ; Alcotest.test_case
      "reaction-invalidation-resolves-targets-from-both-databases-test"
      `Quick
      test_reaction_invalidation_resolves_targets_from_both_databases_test
  ; Alcotest.test_case
      "view-definition-invalidation-uses-before-and-after-owner-feature-pairs-test"
      `Quick
      test_view_definition_invalidation_uses_before_and_after_owner_feature_pairs_test
  ; Alcotest.test_case
      "class-membership-invalidation-uses-old-and-new-classes-test" `Quick
      test_class_membership_invalidation_uses_old_and_new_classes_test
  ; Alcotest.test_case
      "class-property-definition-invalidation-uses-class-tree-test" `Quick
      test_class_property_definition_invalidation_uses_class_tree_test
  ; Alcotest.test_case
      "property-presentation-configuration-invalidates-property-resources-test"
      `Quick
      test_property_presentation_configuration_invalidates_property_resources_test
  ; Alcotest.test_case
      "class-hierarchy-and-aliases-invalidate-reference-scope-test" `Quick
      test_class_hierarchy_and_aliases_invalidate_reference_scope_test
  ; Alcotest.test_case
      "reference-invalidation-uses-old-and-new-targets-test" `Quick
      test_reference_invalidation_uses_old_and_new_targets_test
  ; Alcotest.test_case
      "ref-bearing-block-content-structure-and-visibility-invalidate-its-target-test"
      `Quick
      test_ref_bearing_block_content_structure_and_visibility_invalidate_its_target_test
  ; Alcotest.test_case
      "comments-invalidation-resolves-old-and-new-thread-targets-test" `Quick
      test_comments_invalidation_resolves_old_and_new_thread_targets_test
  ; Alcotest.test_case
      "task-time-invalidation-covers-history-lifecycle-and-edits-test" `Quick
      test_task_time_invalidation_covers_history_lifecycle_and_edits_test
  ; Alcotest.test_case "task-query-invalidation-is-semantic-test" `Quick
      test_task_query_invalidation_is_semantic_test
  ; Alcotest.test_case
      "task-attribute-invalidation-only-follows-task-entities-test" `Quick
      test_task_attribute_invalidation_only_follows_task_entities_test
  ; Alcotest.test_case
      "display-properties-ignore-title-and-timestamp-edits-test" `Quick
      test_display_properties_ignore_title_and_timestamp_edits_test
  ; Alcotest.test_case
      "bidirectional-invalidation-resolves-old-and-new-user-and-plugin-property-targets-test"
      `Quick
      test_bidirectional_invalidation_resolves_old_and_new_user_and_plugin_property_targets_test
  ; Alcotest.test_case
      "bidirectional-invalidation-covers-source-membership-and-visibility-test"
      `Quick
      test_bidirectional_invalidation_covers_source_membership_and_visibility_test
  ; Alcotest.test_case
      "bidirectional-invalidation-covers-property-and-class-configuration-test"
      `Quick
      test_bidirectional_invalidation_covers_property_and_class_configuration_test
  ]
