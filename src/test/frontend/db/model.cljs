(ns frontend.db.model
  "Test-only core db helpers."
  (:require [clojure.walk :as walk]
            [logseq.db :as ldb]))

(def hidden-page? ldb/hidden?)

(def sort-by-order ldb/sort-by-order)

(defn sort-by-order-recursive
  [form]
  (walk/postwalk (fn [f]
                   (if (and (map? f)
                            (:block/_parent f))
                     (let [children (:block/_parent f)]
                       (-> f
                           (dissoc :block/_parent)
                           (assoc :block/children (sort-by-order children))))
                     f))
                 form))
