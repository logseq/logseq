(ns frontend.modules.outliner.tree-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.modules.outliner.tree :as tree]
            [logseq.outliner.tree :as otree]))

(def root-id #uuid "00000000-0000-0000-0000-000000000001")
(def a-id #uuid "00000000-0000-0000-0000-000000000002")
(def b-id #uuid "00000000-0000-0000-0000-000000000003")
(def c-id #uuid "00000000-0000-0000-0000-000000000004")
(def d-id #uuid "00000000-0000-0000-0000-000000000005")

(deftest vec-tree-data-materializes-indexable-children
  (let [result (otree/blocks->vec-tree-data
                [{:db/id 2
                  :block/parent {:db/id 1}
                  :block/order "a"}]
                {:db/id 1}
                {:include-root? false})]
    (is (vector? result))))

(defn- loaded-tree
  []
  {:db/id 1
   :block/uuid root-id
   :block/level 0
   :block/children
   [{:db/id 2
     :block/uuid a-id
     :block/parent {:db/id 1}
     :block/order "a"
     :block/level 1
     :block/children
     [{:db/id 3
       :block/uuid b-id
       :block/title "B"
       :block/parent {:db/id 2}
       :block/order "a"
       :block/level 2
       :block/children []}]}
    {:db/id 4
     :block/uuid c-id
     :block/parent {:db/id 1}
     :block/order "c"
     :block/level 1
     :block/children []}]})

(deftest reconcile-block-tree-preserves-unchanged-subtree-identities
  (let [root (tree/index-block-tree (loaded-tree))
        old-a (first (:block/children root))
        old-c (second (:block/children root))
        result (tree/reconcile-block-tree root
                                          [{:db/id 3
                                            :block/uuid b-id
                                            :block/title "B changed"
                                            :block/parent {:db/id 2}
                                            :block/order "a"}]
                                          #{})]
    (is (not (identical? root result)))
    (is (not (identical? old-a (first (:block/children result)))))
    (is (identical? old-c (second (:block/children result))))
    (is (= "B changed" (get-in result [:block/children 0 :block/children 0 :block/title])))))

(deftest reconcile-block-tree-applies-structural-deltas-without-full-refresh
  (testing "insert and sort"
    (let [result (tree/reconcile-block-tree
                  (tree/index-block-tree (loaded-tree))
                  [{:db/id 5
                    :block/uuid d-id
                    :block/title "D"
                    :block/parent {:db/id 1}
                    :block/order "b"}]
                  #{})]
      (is (= [a-id d-id c-id] (mapv :block/uuid (:block/children result))))))

  (testing "move retains descendants"
    (let [result (tree/reconcile-block-tree
                  (tree/index-block-tree (loaded-tree))
                  [{:db/id 2
                    :block/uuid a-id
                    :block/parent {:db/id 1}
                    :block/order "z"}]
                  #{})]
      (is (= [c-id a-id] (mapv :block/uuid (:block/children result))))
      (is (= [b-id] (mapv :block/uuid (get-in result [:block/children 1 :block/children]))))))

  (testing "deleting a parent removes its loaded descendants"
    (let [result (tree/reconcile-block-tree (tree/index-block-tree (loaded-tree)) [] #{a-id})]
      (is (= [c-id] (mapv :block/uuid (:block/children result)))))))

(deftest inserting-a-sibling-does-not-resort-the-loaded-list
  (let [root (tree/index-block-tree (loaded-tree))
        result (with-redefs [cljs.core/sort-by
                             (fn [& _]
                               (throw (js/Error. "Existing siblings must not be resorted")))]
                 (tree/reconcile-block-tree
                  root
                  [{:db/id 5
                    :block/uuid d-id
                    :block/title "D"
                    :block/parent {:db/id 1}
                    :block/order "b"}]
                  #{}))]
    (is (= [a-id d-id c-id]
           (mapv :block/uuid (:block/children result))))))

(deftest equal-sibling-orders-remain-addressable
  (let [inserted (tree/reconcile-block-tree
                  (tree/index-block-tree (loaded-tree))
                  [{:db/id 5
                    :block/uuid d-id
                    :block/title "D"
                    :block/parent {:db/id 1}
                    :block/order "a"}]
                  #{})
        updated (tree/reconcile-block-tree inserted
                                           [{:db/id 5
                                             :block/uuid d-id
                                             :block/title "D changed"
                                             :block/parent {:db/id 1}
                                             :block/order "a"}]
                                           #{})]
    (is (= [a-id d-id c-id]
           (mapv :block/uuid (:block/children updated))))
    (is (= "D changed"
           (get-in updated [:block/children 1 :block/title])))))

(deftest deleting-a-sibling-does-not-reindex-the-surviving-list
  (let [root (tree/index-block-tree (loaded-tree))
        result (with-redefs [cljs.core/reduce-kv
                             (fn [& _]
                               (throw (js/Error. "Surviving siblings must not be reindexed")))]
                 (tree/reconcile-block-tree root [] #{a-id}))]
    (is (= [c-id]
           (mapv :block/uuid (:block/children result))))))

(deftest structural-deltas-accept-sequential-children
  (let [root (loaded-tree)
        root (assoc root :block/children (seq (:block/children root)))
        result (tree/reconcile-block-tree (tree/index-block-tree root) [] #{a-id})]
    (is (= [c-id]
           (mapv :block/uuid (:block/children result))))))

(defn- fail-if-realized
  []
  (lazy-seq
   (throw (js/Error. "Unrelated subtree was realized"))))

(defn- indexed-tree-with-unrealized-c-children
  []
  (let [indexed (tree/index-block-tree (loaded-tree))]
    (with-meta
      (assoc-in indexed [:block/children 1 :block/children] (fail-if-realized))
      (meta indexed))))

(deftest reconcile-block-tree-does-not-scan-unrelated-subtrees
  (testing "content updates only rebuild the changed node's ancestor path"
    (let [result (tree/reconcile-block-tree
                  (indexed-tree-with-unrealized-c-children)
                  [{:db/id 3
                    :block/uuid b-id
                    :block/title "B changed"
                    :block/parent {:db/id 2}
                    :block/order "a"}]
                  #{})]
      (is (= "B changed"
             (get-in result [:block/children 0 :block/children 0 :block/title])))))

  (testing "inserts only sort the affected sibling list"
    (let [result (tree/reconcile-block-tree
                  (indexed-tree-with-unrealized-c-children)
                  [{:db/id 5
                    :block/uuid d-id
                    :block/title "D"
                    :block/parent {:db/id 2}
                    :block/order "b"}]
                  #{})]
      (is (= [b-id d-id]
             (mapv :block/uuid (get-in result [:block/children 0 :block/children]))))))

  (testing "moves retain descendants and only update affected sibling lists"
    (let [result (tree/reconcile-block-tree
                  (indexed-tree-with-unrealized-c-children)
                  [{:db/id 3
                    :block/uuid b-id
                    :block/title "B"
                    :block/parent {:db/id 1}
                    :block/order "b"}]
                  #{})]
      (is (empty? (get-in result [:block/children 0 :block/children])))
      (is (= [a-id b-id c-id]
             (mapv :block/uuid (:block/children result))))))

  (testing "deletes only traverse the removed subtree"
    (let [result (tree/reconcile-block-tree
                  (indexed-tree-with-unrealized-c-children)
                  []
                  #{a-id})]
      (is (= [c-id] (mapv :block/uuid (:block/children result)))))))

(deftest unrelated-worker-deltas-preserve-the-root-identity
  (let [root (tree/index-block-tree (loaded-tree))
        result (tree/reconcile-block-tree
                root
                [{:db/id 999
                  :block/uuid (random-uuid)
                  :block/title "Another page"
                  :block/parent {:db/id 998}
                  :block/order "a"}]
                #{(random-uuid)})]
    (is (identical? root result)
        "An unrelated transaction must not wake or reconcile this page tree.")))

(defn- fractional-loaded-tree
  []
  (-> (loaded-tree)
      (assoc-in [:block/children 0 :block/order] "a0")
      (assoc-in [:block/children 0 :block/children 0 :block/order] "a0")
      (assoc-in [:block/children 1 :block/order] "a2")))

(deftest optimistic-enter-inserts-a-sibling-without-rebuilding-the-tree
  (let [root (tree/index-block-tree (fractional-loaded-tree))
        old-a (first (:block/children root))
        old-c (second (:block/children root))
        result (tree/apply-optimistic-ops
                root
                [[:save-block [{:block/uuid a-id
                                :block/title "A edited"}
                               nil]]
                 [:insert-blocks [[{:block/uuid d-id
                                    :block/title ""}]
                                   a-id
                                   {:sibling? true
                                    :keep-uuid? true
                                    :outliner-op :insert-blocks}]]])]
    (is (= [a-id d-id c-id]
           (mapv :block/uuid (:block/children result))))
    (is (= "A edited" (get-in result [:block/children 0 :block/title])))
    (is (= {:db/id 1} (get-in result [:block/children 1 :block/parent])))
    (is (neg? (compare "a0" (get-in result [:block/children 1 :block/order]))))
    (is (neg? (compare (get-in result [:block/children 1 :block/order]) "a2")))
    (is (not (identical? old-a (first (:block/children result)))))
    (is (identical? old-c (get-in result [:block/children 2])))))

(deftest optimistic-enter-inserts-the-first-child
  (let [result (tree/apply-optimistic-ops
                (tree/index-block-tree (fractional-loaded-tree))
                [[:insert-blocks [[{:block/uuid d-id
                                    :block/title ""}]
                                   a-id
                                   {:sibling? false
                                    :keep-uuid? true
                                    :outliner-op :insert-blocks}]]])]
    (is (= [d-id b-id]
           (mapv :block/uuid
                 (get-in result [:block/children 0 :block/children]))))
    (is (= {:db/id 2}
           (get-in result [:block/children 0 :block/children 0 :block/parent])))
    (is (= 2
           (get-in result [:block/children 0 :block/children 0 :block/level])))))

(deftest optimistic-simple-delete-applies-the-accompanying-save
  (let [result (tree/apply-optimistic-ops
                (tree/index-block-tree (loaded-tree))
                [[:delete-blocks [[c-id] {}]]
                 [:save-block [{:block/uuid a-id
                                :block/title "merged"}
                               nil]]])]
    (is (= [a-id] (mapv :block/uuid (:block/children result))))
    (is (= "merged" (get-in result [:block/children 0 :block/title])))))

(deftest optimistic-tree-rejects-operations-it-cannot-prove
  (let [root (tree/index-block-tree (loaded-tree))]
    (is (nil? (tree/apply-optimistic-ops
               root
               [[:move-blocks [[a-id] c-id {:sibling? true}]]])))
    (is (nil? (tree/apply-optimistic-ops
               root
               [[:insert-blocks [[{:block/uuid d-id}]
                                  a-id
                                  {:sibling? true
                                  :keep-uuid? false}]]])))))

(deftest loaded-tree-events-confirm-or-rollback-an-optimistic-delta
  (let [root (tree/index-block-tree (fractional-loaded-tree))
        tx-id (random-uuid)
        ops [[:insert-blocks [[{:block/uuid d-id
                                :block/title ""}]
                              a-id
                              {:sibling? true
                               :keep-uuid? true
                               :outliner-op :insert-blocks}]]]
        optimistic (tree/apply-loaded-tree-event
                    root
                    nil
                    {:optimistic-tx-id tx-id
                     :optimistic-ops ops})
        optimistic-root (:root optimistic)
        optimistic-state (:optimistic-state optimistic)
        confirmed (tree/apply-loaded-tree-event
                   optimistic-root
                   optimistic-state
                   {:confirmed-optimistic-tx-id tx-id
                    :updated-blocks [{:db/id 5
                                      :block/uuid d-id
                                      :block/parent {:db/id 1}
                                      :block/order "a1"
                                      :block/title "persisted"}]
                    :deleted-ids #{}})
        rolled-back (tree/apply-loaded-tree-event
                     optimistic-root
                     optimistic-state
                     {:rollback-optimistic-tx-id tx-id})]
    (is (= [a-id d-id c-id]
           (mapv :block/uuid (:block/children optimistic-root))))
    (is (identical? root (:base-root optimistic-state)))
    (is (= "persisted" (get-in confirmed [:root :block/children 1 :block/title])))
    (is (nil? (:optimistic-state confirmed)))
    (is (identical? root (:root rolled-back)))
    (is (nil? (:optimistic-state rolled-back)))))

(deftest loaded-tree-events-replay-rapid-optimistic-enters-from-the-authoritative-base
  (let [root (tree/index-block-tree (fractional-loaded-tree))
        first-tx-id (random-uuid)
        second-tx-id (random-uuid)
        second-id (random-uuid)
        insert-after (fn [block-id target-id]
                       [[:insert-blocks [[{:block/uuid block-id
                                          :block/title ""}]
                                        target-id
                                        {:sibling? true
                                         :keep-uuid? true
                                         :outliner-op :insert-blocks}]]])
        first-event (tree/apply-loaded-tree-event
                     root nil
                     {:optimistic-tx-id first-tx-id
                      :optimistic-ops (insert-after d-id a-id)})
        second-event (tree/apply-loaded-tree-event
                      (:root first-event)
                      (:optimistic-state first-event)
                      {:optimistic-tx-id second-tx-id
                       :optimistic-ops (insert-after second-id d-id)})
        confirmed-first (tree/apply-loaded-tree-event
                         (:root second-event)
                         (:optimistic-state second-event)
                         {:confirmed-optimistic-tx-id first-tx-id
                          :updated-blocks [{:db/id 5
                                            :block/uuid d-id
                                            :block/parent {:db/id 1}
                                            :block/order "a1"}]
                          :deleted-ids #{}})
        rolled-back-first (tree/apply-loaded-tree-event
                           (:root second-event)
                           (:optimistic-state second-event)
                           {:rollback-optimistic-tx-id first-tx-id})]
    (is (= [a-id d-id second-id c-id]
           (mapv :block/uuid (:block/children (:root second-event)))))
    (is (= [a-id d-id second-id c-id]
           (mapv :block/uuid (:block/children (:root confirmed-first))))
        "Confirming the first Enter must replay the still-pending second Enter.")
    (is (= [second-tx-id]
           (mapv :tx-id (get-in confirmed-first [:optimistic-state :pending]))))
    (is (= [a-id c-id]
           (mapv :block/uuid (:block/children (:root rolled-back-first))))
        "A delta depending on a failed target stays pending but cannot render invalid data.")
    (is (= [second-tx-id]
           (mapv :tx-id (get-in rolled-back-first [:optimistic-state :pending]))))))

(deftest resident-journal-tree-keeps-receiving-worker-deltas
  (tree/keep-block-tree-resident! (loaded-tree))
  (tree/reconcile-resident-block-trees!
   [{:db/id 3
     :block/uuid b-id
     :block/title "Updated while unmounted"
     :block/parent {:db/id 2}
     :block/order "a"}]
   #{})
  (is (= "Updated while unmounted"
         (get-in (tree/resident-block-tree root-id)
                 [:block/children 0 :block/children 0 :block/title]))))

(deftest resident-journal-cache-keeps-only-two-most-recent-trees
  (let [first-root (assoc (loaded-tree) :db/id 101 :block/uuid (random-uuid))
        second-root (assoc (loaded-tree) :db/id 102 :block/uuid (random-uuid))
        third-root (assoc (loaded-tree) :db/id 103 :block/uuid (random-uuid))]
    (tree/keep-block-tree-resident! first-root)
    (tree/keep-block-tree-resident! second-root)
    (tree/keep-block-tree-resident! third-root)
    (is (nil? (tree/resident-block-tree (:db/id first-root))))
    (is (= second-root (tree/resident-block-tree (:block/uuid second-root))))
    (is (= third-root (tree/resident-block-tree (:db/id third-root))))))
