(ns frontend.db.restore
  "Fns for DB restore(from text or sqlite)"
  (:require [frontend.db.conn :as db-conn]
            [frontend.state :as state]
            [frontend.persist-db :as persist-db]
            [promesa.core :as p]
            [cljs-time.core :as t]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [datascript.transit :as dt]))

(defn restore-graph!
  "Restore db from SQLite"
  [repo]
  (state/set-state! :graph/loading? true)
  (p/let [start-time (t/now)
          data (persist-db/<fetch-init-data repo)
          _ (assert (some? data) "No data found when reloading db")
          {:keys [schema initial-data]} (dt/read-transit-str data)
          conn (try
                 (sqlite-common-db/restore-initial-data initial-data schema)
                 (catch :default e
                   (js/console.error e)
                   (throw e)))
          db-name (db-conn/datascript-db repo)
          _ (swap! db-conn/conns assoc db-name conn)
          end-time (t/now)]

    (println ::restore-graph! "loads" (count initial-data) "datoms in" (t/in-millis (t/interval start-time end-time)) "ms")

    (state/set-state! :graph/loading? false)
    (state/pub-event! [:ui/re-render-root])
    ;; (async/go
    ;;   (async/<! (async/timeout 100))
    ;;   (db-async/<fetch-all-pages repo))
    ))
