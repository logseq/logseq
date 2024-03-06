(ns frontend.db.restore
  "Fns for DB restore(from text or sqlite)"
  (:require [frontend.db.conn :as db-conn]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.persist-db :as persist-db]
            [promesa.core :as p]
            [cljs-time.core :as t]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [datascript.transit :as dt]
            [frontend.db.async :as db-async]
            [clojure.core.async :as async]))

(defn restore-graph!
  "Restore db from SQLite"
  [repo]
  (state/set-state! :graph/loading? true)
  (p/let [start-time (t/now)
          data (persist-db/<fetch-init-data repo)
          _ (assert (some? data) "No data found when reloading db")
          data' (dt/read-transit-str data)
          db-schema (db-conn/get-schema repo)
          conn (sqlite-common-db/restore-initial-data data' db-schema)
          db-name (db-conn/datascript-db repo)
          _ (swap! db-conn/conns assoc db-name conn)
          end-time (t/now)]

    (println ::restore-graph! "loads" (count data') "txs in" (t/in-millis (t/interval start-time end-time)) "ms")

    (state/set-state! :graph/loading? false)
    (react/clear-query-state!)
    (state/pub-event! [:ui/re-render-root])
    (async/go
      (async/<! (async/timeout 100))
      (db-async/<fetch-all-pages repo))))
