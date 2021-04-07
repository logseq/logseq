(ns frontend.db.outliner
  (:require [datascript.core :as d]
            [frontend.db.react :as react]
            [frontend.util :as util]
            [frontend.debug :as debug]
            [frontend.db.utils :as db-utils]))

(defn get-by-id
  [conn id]
  (d/pull @conn '[*] id))

(defn get-by-parent-&-left
  [conn parent-id left-id]
  (let [r (d/q '[:find (pull ?a [*])
                 :in $ ?p ?l
                 :where
                 [?a :block/left ?l]
                 [?a :block/parent ?p]]
            @conn parent-id left-id)]
    (ffirst r)))

;; key [:block/children parent-id]

(def get-by-parent-id
  '[:find (pull ?a [*])
    :in $ ?id
    :where
    [?a :block/parent ?id]])

(defn save-block
  [conn block-m]
  (let [tx (-> (dissoc block-m :block/children)
             (util/remove-nils))
        lookup-ref (:block/uuid block-m)]
    (d/transact! conn [tx])
    (db-utils/pull [:block/uuid lookup-ref])))

(defn del-block
  [conn id-or-look-ref]
  (d/transact! conn [[:db.fn/retractEntity id-or-look-ref]]))

(defn del-blocks
  [ids-or-look-refs]
  (mapv (fn [id-or-look-ref]
         [:db.fn/retractEntity id-or-look-ref])
    ids-or-look-refs))

(defn get-journals
  [conn]
  (let [r (d/q '[:find (pull ?a [*])
                 :where
                 [?a :block/journal? true]]
               @conn)]
    (flatten r)))
