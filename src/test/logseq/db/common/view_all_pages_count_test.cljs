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
