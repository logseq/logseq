(ns frontend.modules.outliner.core-test
  (:require [cljs.test :refer [deftest is use-fixtures testing] :as test]
            [clojure.test.check.generators :as gen]
            [frontend.test.fixtures :as fixtures]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [clojure.walk :as walk]
            [logseq.graph-parser.block :as gp-block]
            [datascript.core :as d]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [clojure.set :as set]))

(def test-db test-helper/test-db)

(use-fixtures :each
  fixtures/load-test-env
  fixtures/react-components
  fixtures/reset-db)

(defn get-block
  ([id]
   (get-block id false))
  ([id node?]
   (cond-> (db/pull test-db '[*] [:block/uuid id])
     node?
     outliner-core/block)))

(defn build-node-tree
  [col]
  (let [blocks (->> col
                    (walk/postwalk
                     (fn [f]
                       (if (and (vector? f)
                                (= 2 (count f))
                                (integer? (first f))
                                (vector? (second f)))
                         {:block/uuid (first f)
                          :block/children (let [v (second f)]
                                            (cond
                                              (sequential? v)
                                              (mapv
                                               (fn [v]
                                                 (if (integer? v)
                                                   [v]
                                                   v))
                                               v)

                                              :else
                                              [[v]]))}
                         f)))

                    (walk/postwalk
                     (fn [f]
                       (if (and (vector? f)
                                (= 1 (count f))
                                (integer? (first f)))
                         {:block/uuid (first f)}
                         f))))
        blocks (outliner-core/tree-vec-flatten blocks :block/children)]
    (map (fn [block] (assoc block
                            :block/page 1
                            :block/content 1)) blocks)))

(defn- build-blocks
  [tree]
  (gp-block/with-parent-and-left 1 (build-node-tree tree)))

(defn transact-tree!
  [tree]
  (let [blocks (build-blocks tree)]
    (db/transact! test-db (concat [{:db/id 1
                                    :block/uuid 1
                                    :block/name "Test page"}]
                                  blocks))))

(def tree
  [[22 [[2 [[3 [[4]
                [5]]]
            [6 [[7 [[8]]]]]
            [9 [[10]
                [11]]]]]
        [12 [[13]
             [14]
             [15]]]
        [16 [[17]]]]]])

(defn get-blocks-count
  []
  (count (d/datoms (db/get-db test-db) :avet :block/uuid)))

(defn get-blocks-ids
  []
  (set (map :v (d/datoms (db/get-db test-db) :avet :block/uuid))))

(defn get-children
  [id]
  (->> (get-block id true)
       (tree/-get-children)
       (mapv #(-> % :data :block/uuid))))

(deftest test-delete-block
  (testing "
  Insert a node between 6 and 9.
  [1 [[2 [[3 [[4]
              [5]]]
          [6 [[7 [[8]]]]]  ;; delete 6
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
   "
    (transact-tree! tree)
    (let [block (get-block 6)]
      (outliner-tx/transact! {:graph test-db}
        (outliner-core/delete-blocks! [block] true))
      (is (= [3 9] (get-children 2))))))

(deftest test-move-block-as-sibling
  (testing "
  Move 3 between 14 and 15.
  [1 [[2 [[6 [[7 [[8]]]]]
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [3 [[4]    ;; moved 3
               [5]]]
           [15]]]
      [16 [[17]]]]]
   "
    (transact-tree! tree)
    (outliner-tx/transact!
      {:graph test-db}
      (outliner-core/move-blocks! [(get-block 3)] (get-block 14) true))
    (is (= [6 9] (get-children 2)))
    (is (= [13 14 3 15] (get-children 12))))

  (deftest test-move-block-as-first-child
    (testing "
  Move 3 as first child of 12.

  [1 [[2 [[6 [[7 [[8]]]]]
          [9 [[10]
              [11]]]]]
      [12 [[3 [[4]    ;; moved 3
               [5]]]
           [13]
           [14]
           [15]]]
      [16 [[17]]]]]
   "
      (transact-tree! tree)
      (outliner-tx/transact!
        {:graph test-db}
        (outliner-core/move-blocks! [(get-block 3)] (get-block 12) false))
      (is (= [6 9] (get-children 2)))
      (is (= [3 13 14 15] (get-children 12))))))

(deftest test-indent-blocks
  (testing "
  [1 [[2 [[3
           [[4]
            [5]
            [6 [[7 [[8]]]]] ;; indent 6, 9
            [9 [[10]
                [11]]]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
  "
    (transact-tree! tree)
    (outliner-tx/transact!
      {:graph test-db}
      (outliner-core/indent-outdent-blocks! [(get-block 6) (get-block 9)] true))
    (is (= [4 5 6 9] (get-children 3)))))

(deftest test-indent-blocks-regression-5604
  (testing "
  [22 [[2 [[3
           [[4]
            [5]
            [6 [[7 [[8]]]]]
            [9 [[10]
                [11]]]]]]]
      [12 [[13]                         ; outdents 13, 14, 15
           [14]
           [15]]]
      [16 [[17]]]]]
  "
    (transact-tree! tree)
    (outliner-tx/transact!
      {:graph test-db}
      (outliner-core/indent-outdent-blocks! [(get-block 13) (get-block 14) (get-block 15)] false))
    (is (= [2 12 13 14 15 16] (get-children 22))))
  (testing "
  [22 [[2 [[3
           [[4]
            [5]
            [6 [[7 [[8]]]]]
            [9 [[10]
                [11]]]]]]]
      [12 [[13]                         ; outdents 13, 14
           [14]
           [15]]]
      [16 [[17]]]]]
  "
    (transact-tree! tree)
    (outliner-tx/transact!
      {:graph test-db}
      (outliner-core/indent-outdent-blocks! [(get-block 13) (get-block 14)] false))
    (is (= [2 12 13 14 16] (get-children 22)))))

(deftest test-fix-top-level-blocks
  (testing "no need to fix"
    (let [blocks [{:block/uuid #uuid "62aa668b-e258-445d-aef6-5510054ff495",
                   :block/properties {},
                   :block/left #:db{:id 144},
                   :block/format :markdown,
                   :block/level 1,
                   :block/content "a",
                   :db/id 145,
                   :block/parent #:db{:id 144},
                   :block/page #:db{:id 144}}
                  {:block/uuid #uuid "62aa668d-65d1-440c-849b-a0717f691193",
                   :block/properties {},
                   :block/left #:db{:id 145},
                   :block/format :markdown,
                   :block/level 1,
                   :block/content "b",
                   :db/id 146,
                   :block/parent #:db{:id 144},
                   :block/page #:db{:id 144}}
                  {:block/uuid #uuid "62aa668e-f866-48ee-b8fe-737e101c548d",
                   :block/properties {},
                   :block/left #:db{:id 146},
                   :block/format :markdown,
                   :block/level 1,
                   :block/content "c",
                   :db/id 147,
                   :block/parent #:db{:id 144},
                   :block/page #:db{:id 144}}]]
      (= blocks (outliner-core/fix-top-level-blocks blocks)))))

(deftest test-outdent-blocks
  (testing "
  [1 [[2 [[3]
          [4] ;; outdent 4, 5
          [5]
          [6 [[7 [[8]]]]]
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
  "
    (transact-tree! tree)
    (outliner-tx/transact!
      {:graph test-db}
      (outliner-core/indent-outdent-blocks! [(get-block 4) (get-block 5)] false))
    (is (= [3 4 5 6 9] (get-children 2)))))

(deftest test-delete-blocks
  (testing "
  [1 [[2 [[3 [[4]
              [5]]]
          ;[6 [[7 [[8]]]]] delete 6, 9
          ;[9 [[10]
          ;    [11]]]
          ]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
"
    (transact-tree! tree)
    (outliner-tx/transact!
      {:graph test-db}
      (outliner-core/delete-blocks! [(get-block 6) (get-block 9)] {}))
    (is (= [3] (get-children 2)))))

(deftest test-move-blocks-up-down
  (testing "
  [1 [[2 [[3 [[4]
              [5]]]
          [9 [[10] ;; swap 6 and 9
              [11]]]
          [6 [[7 [[8]]]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
  "
    (transact-tree! tree)
    (outliner-tx/transact!
      {:graph test-db}
      (outliner-core/move-blocks-up-down! [(get-block 9)] true))
    (is (= [3 9 6] (get-children 2)))))

(deftest test-insert-blocks
  (testing "
  add [18 [19 20] 21] after 6

  [1 [[2 [[3 [[4]
              [5]]]
          [6 [[7 [[8]]]]]
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
 "
    (transact-tree! tree)
    (let [new-blocks (build-blocks [[18 [[19] [20]]]
                                    [21]])
          target-block (get-block 6)]
      (outliner-tx/transact!
        {:graph test-db}
        (outliner-core/insert-blocks! new-blocks target-block {:sibling? true
                                                               :keep-uuid? true
                                                               :replace-empty-target? false}))
      (is (= [3 6 18 21 9] (get-children 2)))

      (is (= [19 20] (get-children 18))))))

(deftest test-paste-into-empty-block
  (testing "
    Paste a block into the first block (its content is empty)
    [[22 [[2 [[3 [[4]
                [5]]]
            [6 [[7 [[8]]]]]
            [9 [[10]
                [11]]]]]
        [12 [[13]
             [14]
             [15]]]
        [16 [[17]]]]]]
 "
    (transact-tree! tree)
    (db/transact! test-db [{:block/uuid 22
                            :block/content ""}])
    (let [target-block (get-block 22)]
      (outliner-tx/transact!
        {:graph test-db}
        (outliner-core/insert-blocks! [{:block/left [:block/uuid 1]
                                        :block/content "test"
                                        :block/parent [:block/uuid 1]
                                        :block/page 1}]
                                      target-block
                                      {:sibling? false
                                       :outliner-op :paste
                                       :replace-empty-target? true}))
      (is (= "test" (:block/content (get-block 22))))
      (is (= [22] (get-children 1)))
      (is (= [2 12 16] (get-children 22))))))

(deftest test-batch-transact
  (testing "add 4, 5 after 2 and delete 3"
    (let [tree [[1 [[2] [3]]]]]
      (transact-tree! tree)
      (let [new-blocks (build-blocks [[4 [5]]])
            target-block (get-block 2)]
        (outliner-tx/transact!
          {:graph test-db}
          (outliner-core/insert-blocks! new-blocks target-block {:sibling? false
                                                                 :keep-uuid? true
                                                                 :replace-empty-target? false})
          (outliner-core/delete-blocks! [(get-block 3)] {}))

        (is (= [4] (get-children 2)))

        (is (= [5] (get-children 4)))

        (is (nil? (get-block 3)))))))

(deftest test-bocks-with-level
  (testing "blocks with level"
    (is (= (outliner-core/blocks-with-level
            [{:db/id 6,
              :block/left #:db{:id 3},
              :block/level 3,
              :block/parent #:db{:id 2},
              :block/uuid 6}
             {:db/id 9,
              :block/left #:db{:id 6},
              :block/level 3,
              :block/parent #:db{:id 2},
              :block/uuid 9}])
           [{:db/id 6,
             :block/left #:db{:id 3},
             :block/level 1,
             :block/parent #:db{:id 2},
             :block/uuid 6}
            {:db/id 9,
             :block/left #:db{:id 6},
             :block/level 1,
             :block/parent #:db{:id 2},
             :block/uuid 9}]))
    (is (= (outliner-core/blocks-with-level
            [{:db/id 6,
              :block/left #:db{:id 3},
              :block/level 3,
              :block/parent #:db{:id 2},
              :block/uuid 6}
             {:db/id 9,
              :block/left #:db{:id 6},
              :block/level 4,
              :block/parent #:db{:id 6},
              :block/uuid 9}])
           [{:db/id 6,
             :block/left #:db{:id 3},
             :block/level 1,
             :block/parent #:db{:id 2},
             :block/uuid 6}
            {:db/id 9,
             :block/left #:db{:id 6},
             :block/level 2,
             :block/parent #:db{:id 6},
             :block/uuid 9}]))))

(deftest test-get-sorted-block-and-children
  (testing "get-sorted-block-and-children"
    (transact-tree! tree)
    (is (=
         '(2 3 4 5 6 7 8 9 10 11)
         (map :block/uuid (tree/get-sorted-block-and-children test-db (:db/id (get-block 2))))))

    (is (=
         '(22 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17)
         (map :block/uuid (tree/get-sorted-block-and-children test-db (:db/id (get-block 22))))))

    (is (=
         '(16 17)
         (map :block/uuid (tree/get-sorted-block-and-children test-db (:db/id (get-block 16))))))))

(defn- save-block!
  [block]
  (outliner-tx/transact! {:graph test-db}
                         (outliner-core/save-block! block)))

(deftest save-test
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "alias:: foo, bar
tags:: tag1, tag2
- block #blarg #bar"}])
  (testing "save deletes a page's tags"
      (let [conn (db/get-db test-helper/test-db false)
            pre-block (->> (d/q '[:find (pull ?b [*])
                                  :where [?b :block/pre-block? true]]
                                @conn)
                           ffirst)
            _ (save-block! (-> pre-block
                               (update :block/properties dissoc :tags)
                               (update :block/properties-text-values dissoc :tags)))
            updated-page (-> (d/q '[:find (pull ?bp [* {:block/alias [*]}])
                                    :where [?b :block/pre-block? true]
                                    [?b :block/page ?bp]]
                                  @conn)
                             ffirst)]
        (is (nil? (:block/tags updated-page))
            "Page's tags are deleted")
        (is (= #{"foo" "bar"} (set (map :block/name (:block/alias updated-page))))
            "Page's aliases remain the same")
        (is (= {:block/properties {:alias #{"foo" "bar"}}
                :block/properties-text-values {:alias "foo, bar"}}
               (select-keys updated-page [:block/properties :block/properties-text-values]))
            "Page property attributes are correct")
        (is (= {:block/properties {:alias #{"foo" "bar"}}
                :block/properties-text-values {:alias "foo, bar"}}
               (-> (d/q '[:find (pull ?b [*])
                          :where [?b :block/pre-block? true]]
                        @conn)
                   ffirst
                   (select-keys [:block/properties :block/properties-text-values])))
            "Pre-block property attributes are correct")))

  (testing "save deletes orphaned pages when a block's refs change"
    (let [conn (db/get-db test-helper/test-db false)
          pages (set (map first (d/q '[:find ?bn :where [?b :block/name ?bn]] @conn)))
          _ (assert (set/subset? #{"blarg" "bar"} pages) "Pages from block exist")
          block-with-refs (ffirst (d/q '[:find (pull ?b [* {:block/refs [*]}])
                                         :where [?b :block/content "block #blarg #bar"]]
                                       @conn))
          _ (save-block! (-> block-with-refs
                             (assoc :block/content "block"
                                    :block/refs [])))
          updated-pages (set (map first (d/q '[:find ?bn :where [?b :block/name ?bn]] @conn)))]
      (is (not (contains? updated-pages "blarg"))
          "Deleted, orphaned page no longer exists")
      (is (contains? updated-pages "bar")
          "Deleted but not orphaned page still exists"))))

;;; Fuzzy tests

(def init-id (atom 100))

(def unique-id (gen/fmap (fn [_] (swap! init-id inc)) gen/nat))
(def compound (fn [inner-gen]
                (gen/tuple unique-id (gen/vector inner-gen 1 2))))

(def gen-node (gen/recursive-gen compound unique-id))

(def gen-tree (gen/vector gen-node))

(defn- gen-safe-tree
  []
  (->> (gen/generate gen-tree)
       (remove integer?)))

(defn gen-blocks
  []
  (let [tree (gen-safe-tree)]
    (if (seq tree)
      (let [result (build-blocks tree)]
        (if (seq result)
          result
          (gen-blocks)))
      (gen-blocks))))

(defn insert-blocks!
  [blocks target]
  (outliner-tx/transact! {:graph test-db}
    (outliner-core/insert-blocks! blocks
                                  target
                                  {:sibling? (gen/generate gen/boolean)
                                   :keep-uuid? true
                                   :replace-empty-target? false})))

(defn transact-random-tree!
  []
  (let [tree (gen-safe-tree)]
    (if (seq tree)
      (transact-tree! tree)
      (transact-random-tree!))))

(defn get-datoms
  []
  (d/datoms (db/get-db test-db) :avet :block/uuid))

(defn get-random-block
  []
  (let [datoms (->> (get-datoms)
                    (remove (fn [datom] (= 1 (:e datom)))))]
    (if (seq datoms)
      (let [id (:e (gen/generate (gen/elements datoms)))]
        (db/pull test-db '[*] id))
      (do
        (transact-random-tree!)
        (get-random-block)))))

(defn get-random-successive-blocks
  []
  (let [limit (inc (rand-int 20))]
    (when-let [block (get-random-block)]
      (loop [result [block]
             node block]
        (if-let [next (outliner-core/get-right-sibling (:db/id node))]
          (let [next (db/pull test-db '[*] (:db/id next))]
            (if (>= (count result) limit)
              result
              (recur (conj result next) next)))
          result)))))

(deftest ^:long random-inserts
  (testing "Random inserts"
    (transact-random-tree!)
    (let [c1 (get-blocks-ids)
          *random-blocks (atom c1)]
      (dotimes [_i 100]
        ;; (prn "random insert: " i)
        (let [blocks (gen-blocks)]
          (swap! *random-blocks (fn [old]
                                  (set/union old (set (map :block/uuid blocks)))))
          (insert-blocks! blocks (get-random-block)))
        (let [total (get-blocks-count)]
          (is (= total (count @*random-blocks))))))))

(deftest ^:long random-deletes
  (testing "Random deletes"
    (transact-random-tree!)
    (dotimes [_i 100]
      ;; (prn "Random deletes: " i)
      (insert-blocks! (gen-blocks) (get-random-block))
      (let [blocks (get-random-successive-blocks)]
        (when (seq blocks)
          (outliner-tx/transact! {:graph test-db}
            (outliner-core/delete-blocks! blocks {})))))))

(deftest ^:long random-moves
  (testing "Random moves"
    (transact-random-tree!)
    (let [c1 (get-blocks-ids)
          *random-blocks (atom c1)]
      (dotimes [_i 100]
        ;; (prn "Random move: " i)
        (let [blocks (gen-blocks)]
          (swap! *random-blocks (fn [old]
                                  (set/union old (set (map :block/uuid blocks)))))
          (insert-blocks! blocks (get-random-block)))
        (let [blocks (get-random-successive-blocks)]
          (when (seq blocks)
            (let [target (get-random-block)]
              (outliner-tx/transact! {:graph test-db}
                (outliner-core/move-blocks! blocks target (gen/generate gen/boolean)))
              (let [total (get-blocks-count)]
                (is (= total (count @*random-blocks)))))))))))

(deftest ^:long random-move-up-down
  (testing "Random move up down"
    (transact-random-tree!)
    (let [c1 (get-blocks-ids)
          *random-blocks (atom c1)]
      (dotimes [_i 100]
        ;; (prn "Random move up/down: " i)
        (let [blocks (gen-blocks)]
          (swap! *random-blocks (fn [old]
                                  (set/union old (set (map :block/uuid blocks)))))
          (insert-blocks! blocks (get-random-block)))
        (let [blocks (get-random-successive-blocks)]
          (when (seq blocks)
            (outliner-tx/transact! {:graph test-db}
              (outliner-core/move-blocks-up-down! blocks (gen/generate gen/boolean)))
            (let [total (get-blocks-count)]
              (is (= total (count @*random-blocks))))))))))

(deftest ^:long random-indent-outdent
  (testing "Random indent and outdent"
    (transact-random-tree!)
    (let [c1 (get-blocks-ids)
          *random-blocks (atom c1)]
      (dotimes [_i 100]
        ;; (prn "Random move indent/outdent: " i)
        (let [new-blocks (gen-blocks)]
          (swap! *random-blocks (fn [old]
                                  (set/union old (set (map :block/uuid new-blocks)))))
          (insert-blocks! new-blocks (get-random-block))
          (let [blocks (get-random-successive-blocks)
                indent? (gen/generate gen/boolean)]
            (when (seq blocks)
              (outliner-tx/transact! {:graph test-db}
                (outliner-core/indent-outdent-blocks! blocks indent?))
              (let [total (get-blocks-count)]
                (is (= total (count @*random-blocks)))))))))))

(deftest ^:long random-mixed-ops
  (testing "Random mixed operations"
    (transact-random-tree!)
    (let [c1 (get-blocks-ids)
          *random-blocks (atom c1)
          ops [
               ;; insert
               (fn []
                 (let [blocks (gen-blocks)]
                   (swap! *random-blocks (fn [old]
                                           (set/union old (set (map :block/uuid blocks)))))
                   (insert-blocks! blocks (get-random-block))))

               ;; delete
               (fn []
                 (let [blocks (get-random-successive-blocks)]
                   (when (seq blocks)
                     (swap! *random-blocks (fn [old]
                                             (set/difference old (set (map :block/uuid blocks)))))
                     (outliner-tx/transact! {:graph test-db}
                       (outliner-core/delete-blocks! blocks {})))))

               ;; move
               (fn []
                 (let [blocks (get-random-successive-blocks)]
                   (when (seq blocks)
                     (outliner-tx/transact! {:graph test-db}
                       (outliner-core/move-blocks! blocks (get-random-block) (gen/generate gen/boolean))))))

               ;; move up down
               (fn []
                 (let [blocks (get-random-successive-blocks)]
                   (when (seq blocks)
                     (outliner-tx/transact! {:graph test-db}
                      (outliner-core/move-blocks-up-down! blocks (gen/generate gen/boolean))))))

               ;; indent outdent
               (fn []
                 (let [blocks (get-random-successive-blocks)]
                   (when (seq blocks)
                     (outliner-tx/transact! {:graph test-db}
                       (outliner-core/indent-outdent-blocks! blocks (gen/generate gen/boolean))))))]]
      (dotimes [_i 100]
        ((rand-nth ops)))
      (let [total (get-blocks-count)
            page-id 1]

        ;; Invariants:

        ;; 1. total blocks <= inserted blocks - deleted block
        (is (<= total (count @*random-blocks)))

        ;; 2. verify page's length + page itself = total blocks
        (is (= (inc (db-model/get-page-blocks-count test-db page-id))
               total))

        ;; 3. verify the outliner parent/left structure
        (is (= (inc (count (db-model/get-paginated-blocks test-db page-id {:limit total
                                                                           :use-cache? false})))
               total))))))

(deftest test-non-consecutive-blocks->vec-tree
  (let [blocks [{:block/page #:db{:id 2313},
                 :block/uuid #uuid "62f49b4c-f9f0-4739-9985-8bd55e4c68d4",
                 :block/parent #:db{:id 2313},
                 :db/id 2315}
                {:block/page #:db{:id 2313},
                 :block/uuid #uuid "62f49b4c-aa84-416e-9554-b486b4e59b1b",
                 :block/parent #:db{:id 2315},
                 :db/id 2316}
                {:block/page #:db{:id 2313},
                 :block/uuid #uuid "62f49b4c-f80c-49b4-ae83-f78c4520c071",
                 :block/parent #:db{:id 2316},
                 :db/id 2317}
                {:block/page #:db{:id 2313},
                 :block/uuid #uuid "62f49b4c-8f5b-4a04-b749-68d34b28bcf2",
                 :block/parent #:db{:id 2317},
                 :db/id 2318}
                {:block/page #:db{:id 2313},
                 :block/uuid #uuid "62f4b8c1-a99b-434f-84c3-011d6afc48ba",
                 :block/parent #:db{:id 2315},
                 :db/id 2333}
                {:block/page #:db{:id 2313},
                 :block/uuid #uuid "62f4b8c6-072e-4133-90e2-0591021a7fea",
                 :block/parent #:db{:id 2333},
                 :db/id 2334}]]
    (= (tree/non-consecutive-blocks->vec-tree blocks)
       '({:db/id 2315,
          :block/uuid #uuid "62f49b4c-f9f0-4739-9985-8bd55e4c68d4",
          :block/parent #:db{:id 2313},
          :block/page #:db{:id 2313},
          :block/level 1,
          :block/children
          [{:db/id 2316,
            :block/uuid #uuid "62f49b4c-aa84-416e-9554-b486b4e59b1b",
            :block/parent #:db{:id 2315},
            :block/page #:db{:id 2313},
            :block/level 2,
            :block/children
            [{:db/id 2317,
              :block/uuid #uuid "62f49b4c-f80c-49b4-ae83-f78c4520c071",
              :block/parent #:db{:id 2316},
              :block/page #:db{:id 2313},
              :block/level 3,
              :block/children
              [{:db/id 2318,
                :block/uuid #uuid "62f49b4c-8f5b-4a04-b749-68d34b28bcf2",
                :block/parent #:db{:id 2317},
                :block/page #:db{:id 2313},
                :block/level 4}]}]}
           {:db/id 2333,
            :block/uuid #uuid "62f4b8c1-a99b-434f-84c3-011d6afc48ba",
            :block/parent #:db{:id 2315},
            :block/page #:db{:id 2313},
            :block/level 2,
            :block/children
            [{:db/id 2334,
              :block/uuid #uuid "62f4b8c6-072e-4133-90e2-0591021a7fea",
              :block/parent #:db{:id 2333},
              :block/page #:db{:id 2313},
              :block/level 3}]}]}))))

(comment
  (dotimes [i 5]
    (do
      (frontend.test.fixtures/reset-datascript test-db)
      (cljs.test/run-tests)))

  (do
    (frontend.test.fixtures/reset-datascript test-db)
    (cljs.test/test-vars [#'test-paste-first-empty-block]))

  )
