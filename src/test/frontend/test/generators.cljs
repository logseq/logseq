(ns frontend.test.generators
  "Generators for block-related data"
  (:require [clojure.test.check.generators :as gen]
            [datascript.core :as d]))


(defn gen-available-block-uuid
  [db]
  (gen/elements
   (->> (d/q '[:find ?block-uuid
               :where
               [?block :block/parent]
               [?block :block/left]
               [?block :block/uuid ?block-uuid]]
             db)
        (apply concat))))


(defn gen-available-parent-left-pair
  "generate [<parent-uuid> <left-uuid>]"
  [db]
  (gen/elements
   (d/q '[:find ?parent-uuid ?left-uuid
          :where
          [?b :block/uuid]
          [?b :block/parent ?parent]
          [?b :block/left ?left]
          [?parent :block/uuid ?parent-uuid]
          [?left :block/uuid ?left-uuid]]
        db)))
