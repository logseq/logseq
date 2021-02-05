(ns frontend.modules.journal.core
  (:require [frontend.db.conn :as conn]
            [frontend.db.outliner :as outliner]))

(defn get-latest-journals
  [length]
  (let [conn (conn/get-outliner-conn)]
    (->> (outliner/get-journals conn)
         (take length))))
