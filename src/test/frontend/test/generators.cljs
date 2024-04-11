(ns frontend.test.generators
  "Generators for block-related data"
  (:require [clojure.test.check.generators :as gen]
            [datascript.core :as d]))


(defn gen-available-block-uuid
  [db & {:keys [page-uuid]}]
  (let [query (cond-> '[:find ?block-uuid]
                page-uuid
                (concat '[:in $ ?page-uuid])
                true
                (concat '[:where
                          [?block :block/parent]
                          [?block :block/left]
                          [?block :block/uuid ?block-uuid]])
                page-uuid
                (concat '[[?block :block/page ?page]
                          [?page :block/uuid ?page-uuid]]))]
    (gen/elements
     (->> (if page-uuid
            (d/q query db page-uuid)
            (d/q query db))
          (apply concat)))))

(defn gen-available-parent-left-pair
  "generate [<parent-uuid> <left-uuid>]"
  [db & {:keys [page-uuid]}]
  (let [query (cond-> '[:find ?parent-uuid ?left-uuid]
                page-uuid
                (concat '[:in $ ?page-uuid])
                true
                (concat '[:where
                          [?b :block/uuid]
                          [?b :block/parent ?parent]
                          [?b :block/left ?left]
                          [?parent :block/uuid ?parent-uuid]
                          [?left :block/uuid ?left-uuid]])
                page-uuid
                (concat '[[?b :block/page ?page]
                          [?page :block/uuid ?page-uuid]]))]
    (gen/elements
     (if page-uuid
       (d/q query db page-uuid)
       (d/q query db)))))
