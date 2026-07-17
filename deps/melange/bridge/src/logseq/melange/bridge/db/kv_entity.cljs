(ns logseq.melange.bridge.db.kv-entity
  "CLJS keyword and ordered-map conversion for the typed Melange KV catalog."
  (:require ["@logseq/melange-js-api/db" :as db-api]
            [flatland.ordered.map :refer [ordered-map]]))

(def kv-entities
  (into
   (ordered-map)
   (map (fn [entry]
          (let [key (keyword (aget entry 0))
                doc (aget entry 1)
                ignore? (aget entry 2)]
            [key
             (cond-> {:doc doc}
               ignore?
               (assoc :rtc {:rtc/ignore-entity-when-init-upload true}))]))
        (seq (.-entries (.-KvEntity db-api))))))
