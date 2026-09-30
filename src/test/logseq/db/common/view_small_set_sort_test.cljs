(ns logseq.db.common.view-small-set-sort-test
  "A small set of class objects asked for without a row limit (the table's
  request for its remaining rows) must be sorted by its own values, not by
  walking the whole sort index."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.view :as db-view]
            [logseq.db.test.helper :as db-test]))

(defn- create-view-id
  [conn class-id]
  (let [tx (d/transact! conn [{:db/id -100
                               :block/title "Test view"
                               :block/uuid (random-uuid)
                               :logseq.property.view/feature-type :class-objects
                               :logseq.property.view/type :logseq.property.view/type.table
                               :logseq.property/view-for class-id}])]
    (get-in tx [:tempids -100])))

(deftest small-class-without-row-limit-does-not-scan-unrelated-sort-values-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "Tagged 1" :block/updated-at 1 :build/tags [:Topic]}}
                {:page {:block/title "Tagged 2" :block/updated-at 2 :build/tags [:Topic]}}
                {:page {:block/title "Unrelated"}
                 :blocks (mapv (fn [i] {:block/title (str "Unrelated " i)}) (range 1000))}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn class-id)
        scanned (atom 0)
        instrument (fn [scan]
                     (fn [db index & components]
                       (let [datoms (apply scan db index components)]
                         (if (and (= :avet index) (= :block/updated-at (first components)))
                           (map (fn [datom] (swap! scanned inc) datom) datoms)
                           datoms))))
        result (with-redefs [d/datoms (instrument d/datoms)
                             d/rseek-datoms (instrument d/rseek-datoms)]
                 (db-view/get-view-data @conn view-id
                                       {:view-feature-type :class-objects
                                        :view-for-id class-id
                                        :sorting [{:id :block/updated-at :asc? false}]}))]
    (is (= 2 (:count result)))
    (is (= ["Tagged 2" "Tagged 1"] (mapv #(:block/title (d/entity @conn %)) (:data result))))
    (is (< @scanned 26)
        (str "2 class objects without a row limit scanned " @scanned
             " updated-at datoms of unrelated blocks"))))

(deftest remaining-rows-keep-the-first-window-order-on-ties-test
  ;; An import stamps many pages in the same millisecond. The first window
  ;; (row limit, AVET walk) and the full list (no row limit, sorted eids) must
  ;; order equal values the same way, or tied rows swap when the rest loads.
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               (mapv (fn [i] {:page {:block/title (str "Tagged " i)
                                     :block/updated-at (if (< i 5) (- 100 i) 50)
                                     :build/tags [:Topic]}})
                     (range 25))})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :sorting [{:id :block/updated-at :asc? false}]}
        window (db-view/get-view-data @conn view-id (assoc option :row-limit 20))
        full (db-view/get-view-data @conn view-id option)]
    (is (= 25 (:count window) (:count full)))
    (is (= (:data window) (vec (take 20 (:data full))))
        "The full list starts with the first window, ties included")))
