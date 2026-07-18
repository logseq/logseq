(ns frontend.modules.outliner.tree-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.modules.outliner.tree :as tree]))

(def root-id #uuid "00000000-0000-0000-0000-000000000001")
(def a-id #uuid "00000000-0000-0000-0000-000000000002")
(def b-id #uuid "00000000-0000-0000-0000-000000000003")
(def c-id #uuid "00000000-0000-0000-0000-000000000004")
(def d-id #uuid "00000000-0000-0000-0000-000000000005")

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
