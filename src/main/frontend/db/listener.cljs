(ns frontend.db.listener
  "DB listeners"
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.rtc.db-listener :as rtc-db-listener]
            [frontend.db.rtc.op-mem-layer :as op-mem-layer]))

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
    (repo-listen-to-tx! repo conn)
    (d/unlisten! conn :gen-ops)
    (when (op-mem-layer/rtc-db-graph? repo)
      (rtc-db-listener/listen-db-to-generate-ops repo conn))))
