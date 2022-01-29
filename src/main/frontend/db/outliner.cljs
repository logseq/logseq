(ns frontend.db.outliner
  (:require [datascript.core :as d]))

(defn get-by-id
  [conn id]
  (try
    (d/pull @conn '[*] id)
    (catch js/Error _e nil)))

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
