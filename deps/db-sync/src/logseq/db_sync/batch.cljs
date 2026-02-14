(ns logseq.db-sync.batch
  (:require [clojure.string :as string]))

(def ^:private max-sql-params 99)
(def ^:private row-param-count 3)

(defn rows->insert-batches
  [table rows {:keys [max-params] :or {max-params max-sql-params}}]
  (if (seq rows)
    (let [max-rows (max 1 (js/Math.floor (/ max-params row-param-count)))
          batches (partition-all max-rows rows)]
      (mapv (fn [batch]
              (let [placeholders (string/join "," (repeat (count batch) "(?, ?, ?)"))
                    sql (str "insert or replace into " table " (addr, content, addresses) values " placeholders)
                    args (vec (mapcat identity batch))]
                {:sql sql :args args}))
            batches))
    []))
