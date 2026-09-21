(ns logseq.db.common.view-all-pages-count-test
  "All Pages first-window count must match visible pages on compiled
  ClojureScript. nbb has no BTSet est-count, so it cannot catch the
  nightly empty-row bug (logseq/db-test#1235)."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.view :as db-view]
            [logseq.db.test.helper :as db-test]))

(defn- create-view-id
  [conn]
  (let [tx (d/transact! conn [{:db/id -100
                               :block/title "All pages"
                               :block/uuid (random-uuid)
                               :logseq.property.view/feature-type :all-pages
                               :logseq.property.view/type :logseq.property.view/type.table}])]
    (get-in tx [:tempids -100])))

(deftest all-pages-tags-groups-sort-by-readable-title-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}
                         :Project {:block/title "Project"}}
               :pages-and-blocks
               [{:page {:block/title "Alpha" :build/tags [:Topic]}}
                {:page {:block/title "Beta" :build/tags [:Topic]}}
                {:page {:block/title "Gamma" :build/tags [:Project]}}]})
        view-id (create-view-id conn)
        option {:view-feature-type :all-pages
                :group-by-property-ident :block/tags}
        result (db-view/get-view-data @conn view-id option)
        group->titles (fn [result]
                        (into {}
                              (map (fn [[group rows]]
                                     [(:block/title group)
                                      (set (map (fn [id]
                                                  (:block/title (d/entity @conn id)))
                                                rows))]))
                              (:data result)))]
    (is (= #{"Alpha" "Beta"} (get (group->titles result) "Topic")))
    (is (= #{"Gamma"} (get (group->titles result) "Project")))
    (is (= ["Topic" "Project"]
           (filter #{"Project" "Topic"}
                   (mapv (fn [[group _rows]] (:block/title group))
                         (:data result))))
        "Groups sort descending by default because sort-groups-desc? defaults to true.")
    (d/transact! conn [[:db/add view-id :logseq.property.view/sort-groups-desc? false]])
    (is (= ["Project" "Topic"]
           (filter #{"Project" "Topic"}
                   (mapv (fn [[group _rows]] (:block/title group))
                         (:data (db-view/get-view-data @conn view-id option))))))))


(deftest all-pages-ungrouped-multi-sort-keeps-visible-pages-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Foo"
                        :block/created-at 10
                        :block/updated-at 30}}
                {:page {:block/title "Good"
                        :block/created-at 20
                        :block/updated-at 20}}
                {:page {:block/title "Bar"
                        :block/created-at 30
                        :block/updated-at 10}}]})
        view-id (create-view-id conn)
        option {:view-feature-type :all-pages
                :sorting [{:id :block/title :asc? true}
                          {:id :block/created-at :asc? false}
                          {:id :block/updated-at :asc? true}]
                :filters {:or? false :filters []}}
        result (db-view/get-view-data @conn view-id option)]
    (is (= 3 (:count result)))
    (is (= ["Bar" "Foo" "Good"]
           (mapv (fn [id] (:block/title (d/entity @conn id)))
                 (:data result))))))

(deftest all-pages-first-window-count-matches-56-visible-pages
  (let [pages (mapv (fn [idx]
                      {:page {:block/title (str "Page " idx)
                              :block/updated-at idx}})
                    (range 56))
        conn (db-test/create-conn-with-blocks {:pages-and-blocks pages})
        view-id (create-view-id conn)
        option {:view-feature-type :all-pages
                :sorting [{:id :block/updated-at :asc? false}]}
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 30))
        full (db-view/get-view-data @conn view-id option)]
    (is (= 56 (:count full) (count (:data full))))
    (is (= 56 (:count window))
        "First-window count must not use BTSet est-count. Nightly painted empty rows because a 56-page graph reported 98.")
    (is (= 30 (count (:data window))))))
