(ns logseq.api.db-based.tools-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.api.db-based.tools :as api-tools]
            [logseq.db.test.helper :as db-test]))

;; ─── normalize-block-tree unit tests ───────────────────────────────────────
;; These test the recursive normalizer in isolation with hand-crafted tree data,
;; avoiding any dependency on Datascript entity resolution or blocks->vec-tree.

(defn- make-block
  "Minimal block map for testing normalize-block-tree"
  [title uuid-str & children]
  (cond-> {:block/uuid uuid-str
           :block/title title}
    (seq children) (assoc :block/children (vec children))))

(deftest normalize-stringifies-uuids
  (testing "UUIDs are stringified at every depth level"
    (let [tree [(make-block "root" "r-uuid"
                 (make-block "child" "c-uuid"
                   (make-block "grandchild" "gc-uuid")))]
          result (api-tools/normalize-block-tree tree {} 1)
          root (first result)
          child (first (:block/children root))
          grandchild (first (:block/children child))]
      (is (string? (:block/uuid root)))
      (is (string? (:block/uuid child)))
      (is (string? (:block/uuid grandchild)))
      (is (= "r-uuid" (:block/uuid root)))
      (is (= "c-uuid" (:block/uuid child)))
      (is (= "gc-uuid" (:block/uuid grandchild))))))

(deftest normalize-depth-1-truncates-all-children
  (testing "depth=1: all children replaced with [{:truncated true}]"
    (let [tree [(make-block "root" "r-uuid"
                 (make-block "child" "c-uuid"))]
          result (api-tools/normalize-block-tree tree {:depth 1} 1)
          root (first result)]
      (is (= [{:truncated true}] (:block/children root))))))

(deftest normalize-depth-2-expands-level-1-truncates-level-2
  (testing "depth=2: level-1 children expanded, level-2 truncated"
    (let [tree [(make-block "root" "r-uuid"
                 (make-block "child" "c-uuid"
                   (make-block "grandchild" "gc-uuid")))]
          result (api-tools/normalize-block-tree tree {:depth 2} 1)
          root (first result)
          child (first (:block/children root))]
      ;; Level 1 children are expanded as a seq
      (is (sequential? (:block/children root)))
      (is (= "c-uuid" (:block/uuid child)))
      ;; Level 2 grandchildren are truncated
      (is (= [{:truncated true}] (:block/children child))))))

(deftest normalize-depth-default-50-expands-shallow-trees
  (testing "Default depth (50) fully expands a 3-level tree"
    (let [tree [(make-block "root" "r-uuid"
                 (make-block "child" "c-uuid"
                   (make-block "grandchild" "gc-uuid")))]
          result (api-tools/normalize-block-tree tree {} 1)
          root (first result)
          child (first (:block/children root))
          grandchild (first (:block/children child))]
      (is (sequential? (:block/children root)))
      (is (sequential? (:block/children child)))
      (is (not (contains? grandchild :block/children)) "Leaf should not get :block/children added"))))

(deftest normalize-depth-capped-at-100
  (testing "depth values > 100 are capped to 100"
    (let [leaf (make-block "leaf" "l-uuid")
          result (api-tools/normalize-block-tree [leaf] {:depth 999} 1)]
      (is (= 1 (count result)))
      (is (= "l-uuid" (:block/uuid (first result)))))))

(deftest normalize-leaf-without-children-key-left-alone
  (testing "Blocks without :block/children key are returned as-is (no key added)"
    (let [leaf (make-block "leaf" "l-uuid")
          result (api-tools/normalize-block-tree [leaf] {:depth 1} 1)]
      (is (not (contains? (first result) :block/children))))))

(deftest normalize-empty-children-seq-is-truthy-at-depth-boundary
  (testing "Empty children seq [] should not cause truncation (nothing to truncate)"
    (let [block (assoc (make-block "b" "b-uuid") :block/children [])
          result (api-tools/normalize-block-tree [block] {:depth 1} 1)
          b (first result)]
      ;; Empty children seq is NOT truncated because (seq []) is nil
      (is (contains? b :block/children))
      (is (sequential? (:block/children b)))
      (is (empty? (:block/children b))))))

(deftest normalize-removes-hidden-properties
  (testing "Hidden properties like :block/tx-id are stripped"
      (let [block {:block/uuid "u" :block/title "t" :block/tx-id 42 :block.temp/foo "bar"}
          result (api-tools/normalize-block-tree [block] {} 1)]
      (is (not (contains? (first result) :block/tx-id)))
      (is (not (contains? (first result) :block.temp/foo))))))

;; ─── Integration: get-page-data with create-conn-with-blocks ───────────────
;; These verify the full end-to-end path through Datascript and blocks->vec-tree.
;; Note: blocks->vec-tree-aux ALWAYS assocs :block/children on every node, so
;; even leaf blocks carry :block/children = [] rather than a missing key.

(defn- create-nested-page-db
  "Creates a test db with a page that has 3 levels of nested blocks"
  []
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Nested Page"}
                 :blocks [{:block/title "Level 1 - A"
                           :build/children [{:block/title "Level 2 - A1"
                                             :build/children [{:block/title "Level 3 - A1a"}]}
                                            {:block/title "Level 2 - A2"}]}
                          {:block/title "Level 1 - B"
                           :build/children [{:block/title "Level 2 - B1"}]}
                          {:block/title "Level 1 - C"}]}]})]
    @conn))

(deftest get-page-data-default-returns-top-level-only
  (testing "Default (no opts): top-level blocks, no children, no page ref"
    (let [db (create-nested-page-db)
          result (api-tools/get-page-data db "Nested Page" nil)]
      (is result)
      (is (:entity result))
      (is (= "Nested Page" (get-in result [:entity :block/title])))
      (let [blocks (:blocks result)]
        (is (= 3 (count blocks)))
        (doseq [b blocks]
          (is (string? (:block/uuid b)))
          (is (not (contains? b :block/children)))
          (is (not (contains? b :block/page))))))))

(deftest get-page-data-empty-opts-same-as-default
  (testing "Empty opts map {} is identical to nil opts"
    (let [db (create-nested-page-db)
          result (api-tools/get-page-data db "Nested Page" {})]
      (is result)
      (let [blocks (:blocks result)]
        (is (= 3 (count blocks)))
        (doseq [b blocks]
          (is (string? (:block/uuid b)))
          (is (not (contains? b :block/children)))
          (is (not (contains? b :block/page))))))))

(deftest get-page-data-include-children-false-is-default
  (testing "Explicit includeChildren=false is same as default"
    (let [db (create-nested-page-db)
          result (api-tools/get-page-data db "Nested Page" {:includeChildren false})]
      (is result)
      (let [blocks (:blocks result)]
        (is (= 3 (count blocks)))
        (doseq [b blocks]
          (is (string? (:block/uuid b)))
          (is (not (contains? b :block/children)))
          (is (not (contains? b :block/page))))))))

(deftest get-page-data-include-children-returns-tree
  (testing "includeChildren=true returns blocks with nested children"
    (let [db (create-nested-page-db)
          result (api-tools/get-page-data db "Nested Page" {:includeChildren true})]
      (is result)
      (let [blocks (:blocks result)]
        (is (= 3 (count blocks)))
        (doseq [b blocks]
          (is (string? (:block/uuid b)) "UUID stringified at top level")
          ;; Every block from blocks->vec-tree-aux has :block/children (maybe [])
          (is (contains? b :block/children) "Every block has :block/children from tree builder"))
        ;; Level 1 - A should have children (non-empty)
        (let [level1-a (first blocks)
              children (:block/children level1-a)]
          (is (sequential? children))
          (doseq [child children]
            (is (string? (:block/uuid child)) "UUID stringified at level 2")
            (is (contains? child :block/children) "Every block has :block/children at level 2")
            (when (seq (:block/children child))
              (doseq [gc (:block/children child)]
                (is (string? (:block/uuid gc)) "UUID stringified at level 3")))))))))

(deftest get-page-data-depth-cap-100
  (testing "depth=999 is capped to 100, no crash"
    (let [db (create-nested-page-db)
          result (api-tools/get-page-data db "Nested Page" {:includeChildren true :depth 999})]
      (is result))))
