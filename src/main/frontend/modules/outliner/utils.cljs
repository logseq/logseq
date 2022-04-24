(ns frontend.modules.outliner.utils
  (:require [frontend.db.conn :as conn]
            [frontend.db.outliner :as db-outliner]
            [datascript.impl.entity :as e]
            [frontend.util :as util]))

(defn block-id?
  [id]
  (or
    (number? id)
    (string? id)
    (uuid? id)))

(defn check-block-id
  [id]
  (assert (block-id? id)
    (util/format "The id should match block-id?: %s" (pr-str id))))

(defn ->block-id
  [id]
  (cond
    (block-id? id)
    id

    (and
      (vector? id)
      (= (first id) :block/uuid))
    (second id)

    (and
      (vector? id)
      (= (first id) :block/name))
    (let [conn (conn/get-db false)]
      (-> (db-outliner/get-by-id conn id)
        (:block/uuid)))

    (or (e/entity? id) (map? id))
    (let [conn (conn/get-db false)]
      (-> (db-outliner/get-by-id conn (:db/id id))
        (:block/uuid)))

    :else nil))

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
