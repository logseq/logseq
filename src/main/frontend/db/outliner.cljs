(ns frontend.db.outliner
  "Db related fns for the outliner module"
  (:require [datascript.core :as d]
            [frontend.db.utils :as db-utils]))
0
(defn get-by-id
  [conn id]
  (try
    (d/pull @conn '[*] id)
    (catch :default _e nil)))

;; key [:block/children parent-id]

(def get-by-parent-id
  '[:find (pull ?a [*])
    :in $ ?id
    :where
    [?a :block/parent ?id]])

(defn del-block
  [conn id-or-look-ref]
  (db-utils/transact! conn [[:db.fn/retractEntity id-or-look-ref]]))
