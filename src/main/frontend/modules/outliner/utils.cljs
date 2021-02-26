(ns frontend.modules.outliner.utils
  (:require [frontend.db.conn :as conn]
            [frontend.db.outliner :as db-outliner]))

(defrecord Block [data])

(defn get-block-by-id
  [id]
  (let [c (conn/get-outliner-conn)
        r (try (db-outliner/get-by-id c [:block/id id])
               (catch js/Error e nil))]
    (when r (->Block r))))