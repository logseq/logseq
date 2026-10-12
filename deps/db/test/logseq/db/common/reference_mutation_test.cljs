(ns logseq.db.common.reference-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.common.reference :as db-reference]
            [logseq.db.test.helper :as db-test]))

(defn- id-of
  [db title]
  (d/q '[:find ?e . :in $ ?title :where [?e :block/title ?title]] db title))

(def ^:private class-filter-db
  "Class page Topic filtered to include Inc. On page P:
   - T1 refs Topic; its child M1 is tagged Topic and refs Inc
   - T2 refs Topic; its child M2 is tagged Topic; M2's child C2 refs Inc"
  (delay
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Topic {:block/title "Topic"}}
                 :pages-and-blocks
                 [{:page {:block/title "Inc"}}
                  {:page {:block/title "P"}
                   :blocks [{:block/title "T1"
                             :build/children [{:block/title "M1" :build/tags [:Topic]}]}
                            {:block/title "T2"
                             :build/children [{:block/title "M2" :build/tags [:Topic]
                                               :build/children [{:block/title "C2"}]}]}]}]})
          db @conn
          topic (:db/id (d/entity db :user.class/Topic))
          inc-id (id-of db "Inc")]
      (d/transact! conn [[:db/add (id-of db "T1") :block/refs topic]
                         [:db/add (id-of db "T2") :block/refs topic]
                         [:db/add (id-of db "M1") :block/refs inc-id]
                         [:db/add (id-of db "C2") :block/refs inc-id]
                         [:db/add topic :logseq.property.linked-references/includes inc-id]])
      @conn)))

(defn- titles
  [db ids]
  (set (map #(:block/title (d/entity db %)) ids)))

;; Fails if, in `matched-ref-block-ids-under-top`, `when` becomes `when-not`, `seq` becomes `empty?`, `empty?` becomes `seq`, `or` becomes `and` or `not` becomes `identity`.
;; Fails if, in `expand-to-top-refs`, `if` becomes `if-not`.
(deftest class-page-filter-skips-blocks-tagged-with-the-class-test
  (let [db @class-filter-db
        {:keys [ref-blocks ref-matched-children-ids]}
        (db-reference/get-linked-references db (:db/id (d/entity db :user.class/Topic)))]
    (testing "top blocks match through their children"
      (is (= #{"T1" "T2"} (set (map :block/title ref-blocks)))))
    (testing "a block tagged with the class never matches itself, but its matching child does and brings it along as a parent"
      (is (= #{"M2" "C2"} (titles db ref-matched-children-ids))))))

(def ^:private ties-db
  "Target is referenced by B (on page P), which also refs A; B's child C refs Z.
   P, A and Z are each counted once."
  (delay
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Target"}}
                  {:page {:block/title "A"}}
                  {:page {:block/title "Z"}}
                  {:page {:block/title "Big"}}
                  {:page {:block/title "P"}
                   :blocks [{:block/title "B"
                             :build/children [{:block/title "C"}]}]}]})
          db @conn
          b (id-of db "B")
          c (id-of db "C")]
      (d/transact! conn [[:db/add b :block/refs (id-of db "Target")]
                         [:db/add b :block/refs (id-of db "A")]
                         [:db/add b :block/refs (id-of db "Big")]
                         [:db/add c :block/refs (id-of db "Z")]
                         [:db/add c :block/refs (id-of db "Big")]])
      @conn)))

;; Fails if, in `get-ref-pages-count`, `>` becomes `>=`.
(deftest ref-pages-count-keeps-tied-pages-in-first-seen-order-test
  (let [db @ties-db
        {:keys [ref-pages-count]} (db-reference/get-linked-references db (id-of db "Target"))]
    (is (= ["Big" 2] (first ref-pages-count)))
    (is (= [["P" 1] ["A" 1] ["Z" 1]] (vec (rest ref-pages-count)))
        "pages with equal counts keep the order they were first seen in: the block's page, its refs, its children's refs")))
