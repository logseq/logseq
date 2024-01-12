(ns logseq.outliner.util
  "Util fns for outliner"
  (:require [datascript.impl.entity :as e]
            [logseq.common.util :as common-util]))

(defn block-id?
  [id]
  (or
   (number? id)
   (string? id)
   (uuid? id)))

(defn check-block-id
  [id]
  (assert (block-id? id)
          (common-util/format "The id should match block-id?: %s" (pr-str id))))

(defn ->block-lookup-ref
  "
  string? or number?  -> [:block/uuid x]
  [:block/uuid x] -> [:block/uuid x]
  {:db/id x} -> {:db/id x}
  :else -> nil
  "
  [id]
  (cond
    (and
     (vector? id)
     (= (first id) :block/uuid))
    id

    (block-id? id)
    [:block/uuid id]

    (or (e/entity? id) (map? id))
    id

    :else nil))
