(ns frontend.db.listener
  "DB listeners"
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]))

(defonce *db-listener (atom nil))

(defn repo-listen-to-tx!
  [repo conn]
  (d/listen! conn :persistence
             (fn [tx-report]
               (when (not (:new-graph? (:tx-meta tx-report))) ; skip initial txs
                 (when-let [db-listener @*db-listener]
                   (db-listener repo tx-report))))))

(defn listen-and-persist!
  [repo]
  (when-let [conn (conn/get-db repo false)]
    (d/unlisten! conn :persistence)
    (repo-listen-to-tx! repo conn)))
