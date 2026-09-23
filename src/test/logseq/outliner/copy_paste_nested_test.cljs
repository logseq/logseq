(ns logseq.outliner.copy-paste-nested-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(defn- entity-or-ref-map?
  [v]
  (or (de/entity? v)
      (and (map? v) (or (:db/id v) (:block/uuid v)))))

(defn- clipboard-block
  [block]
  (-> (into {:db/id (:db/id block)
             :block/uuid (:block/uuid block)}
            (map (fn [k]
                   [k (let [v (get block k)]
                        (cond
                          (entity-or-ref-map? v)
                          [:block/uuid (:block/uuid v)]
                          (and (coll? v) (seq v) (every? entity-or-ref-map? v))
                          (set (map (fn [item] [:block/uuid (:block/uuid item)]) v))
                          :else
                          v))]))
            (keys block))))

(defn- outline-child-titles
  [block]
  (->> (ldb/sort-by-order (:block/_parent block))
       (remove :logseq.property/created-from-property)
       (mapv :block/title)))

(deftest copy-paste-does-not-steal-live-children
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "source"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}
               {:page {:block/title "dest"}
                :blocks [{:block/title ""}]}])
        parent (db-test/find-block-by-content @conn "parent")
        parent-uuid (:block/uuid parent)
        copied (mapv clipboard-block
                     (ldb/get-block-and-children @conn parent-uuid
                                                 {:include-property-block? true}))
        target (db-test/find-block-by-content @conn "")]
    (outliner-core/insert-blocks! conn copied target
                                  {:sibling? true
                                   :keep-uuid? true
                                   :replace-empty-target? true
                                   :outliner-op :paste})
    (let [original (d/entity @conn [:block/uuid parent-uuid])]
      (is (= ["child"] (outline-child-titles original))
          "Pasting a copied tree must not move the original child"))))

(deftest paste-page-entity-links-to-existing-page
  (testing "Pasting a copied page entity (e.g. a dragged embed node) links to the
            existing page instead of creating a duplicate page with the same name."
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "PageA"}
                  :blocks [{:block/title "a-child"}]}
                 {:page {:block/title "PageB"}
                  :blocks [{:block/title "target"}]}])
          page-a (ldb/get-page @conn "pagea")
          copied [(clipboard-block page-a)]
          target (db-test/find-block-by-content @conn "target")]
      (outliner-core/insert-blocks! conn copied target
                                    {:sibling? true
                                     :outliner-op :paste})
      (is (= [(:db/id page-a)]
             (d/q '[:find [?e ...] :where [?e :block/name "pagea"]] @conn))
          "Paste must not create a second page entity with the same name")
      (let [target' (d/entity @conn (:db/id target))
            siblings (ldb/sort-by-order (:block/_parent (:block/parent target')))
            pasted (first (filter :block/link siblings))]
        (is (some? pasted) "Pasted node should be a link node")
        (is (= (:db/id page-a) (:db/id (:block/link pasted))))))))
