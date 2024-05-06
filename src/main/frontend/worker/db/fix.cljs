(ns frontend.worker.db.fix
  "Fix db"
  (:require [datascript.core :as d]))

(defn fix-cardinality-many->one
  [db property-id]
  (when-let [attribute (:db/ident (d/entity db property-id))]
    (let [deleting-datoms (->> (d/datoms db :avet attribute)
                               (group-by :e)
                               (mapcat (fn [[_e v-datoms]]
                                         (let [recent-datom (last (sort-by :t v-datoms))]
                                           (remove #{recent-datom} v-datoms)))))]
      (map
       (fn [d]
         [:db/retract (:e d) (:a d) (:v d)])
       deleting-datoms))))
