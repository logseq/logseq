(ns frontend.db.outliner
  (:require [datascript.core :as d]
            [frontend.db.react :as react]))

(defn get-by-id
  [conn id]
  (d/pull @conn '[*] id))

(defn get-by-parent-&-left
  [conn parent-id left-id]
  (let [r (d/q '[:find (pull ?a [*])
                 :in $ ?p ?l
                 :where
                 [?a :block/left-id ?l]
                 [?a :block/parent-id ?p]]
            @conn parent-id left-id)]
    (ffirst r)))

;; key [:block/children parent-id]

(def get-by-parent-id
  '[:find (pull ?a [*])
    :in $ ?id
    :where
    [?a :block/parent-id ?id]])

(defn save-block
  [conn block-m]
  (d/transact! conn [block-m]))

(defn del-block
  [conn id-or-look-ref]
  (d/transact! conn [[:db.fn/retractEntity id-or-look-ref]]))

(defn get-journals
  [conn]
  (let [r (d/q '[:find (pull ?a [*])
                 :where
                 [?a :block/journal? true]]
               @conn)]
    (flatten r)))