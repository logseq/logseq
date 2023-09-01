(ns logseq.outliner.pipeline
  "Core fns for use with frontend.modules.outliner.pipeline"
  (:require [logseq.db.schema :as db-schema]
            [datascript.core :as d]
            [cognitect.transit :as t]))

(defn filter-deleted-blocks
  [datoms]
  (keep
   (fn [d]
     (when (and (= :block/uuid (:a d)) (false? (:added d)))
       (:v d)))
   datoms))

(defn datom->av-vector
  [db datom]
  (let [a (:a datom)
        v (:v datom)
        v' (cond
             (contains? db-schema/ref-type-attributes a)
             (when-some [block-uuid-datom (first (d/datoms db :eavt v :block/uuid))]
               [:block/uuid (str (:v block-uuid-datom))])

             (and (= :block/uuid a) (uuid? v))
             (str v)

             :else
             v)]
    (when (some? v')
      [a v'])))

(defn build-upsert-blocks
  [blocks deleted-block-uuids db-after]
  (let [t-writer (t/writer :json)]
    (->> blocks
         (remove (fn [b] (contains? deleted-block-uuids (:block/uuid b))))
         (map (fn [b]
                (let [datoms (d/datoms db-after :eavt (:db/id b))]
                  (assoc b :datoms
                         (->> datoms
                              (keep
                               (partial datom->av-vector db-after))
                              (t/write t-writer))))))
         (map (fn [b]
                (if-some [page-uuid (:block/uuid (d/entity db-after (:db/id (:block/page b))))]
                  (assoc b :page_uuid page-uuid)
                  b)))
         (map (fn [b]
                (let [uuid (or (:block/uuid b) (random-uuid))]
                  (assoc b :block/uuid uuid)))))))