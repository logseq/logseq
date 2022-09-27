(ns ^:no-doc frontend.db.migrate
  (:require [datascript.core :as d]))

(defn get-collapsed-blocks
  [db]
  (d/q
    '[:find [?b ...]
      :where
      [?b :block/properties ?properties]
      [(get ?properties :collapsed) ?collapsed]
      [(= true ?collapsed)]]
    db))

(defn migrate
  [db]
  (when db
    (let [collapsed-blocks (get-collapsed-blocks db)]
      (if (seq collapsed-blocks)
        (let [tx-data (map (fn [id] {:db/id id
                                     :block/collapsed? true}) collapsed-blocks)]
          (d/db-with db tx-data))
        db))))
