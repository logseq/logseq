(ns frontend.db.restore
  "Fns for DB restore(from text or sqlite)"
  (:require [frontend.db.conn :as db-conn]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.persist-db :as persist-db]
            [promesa.core :as p]
            [cljs-time.core :as t]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [clojure.edn :as edn]))

(comment
  (defn- old-schema?
    "Requires migration if the schema version is older than db-schema/version"
    [db]
    (let [v (db-migrate/get-schema-version db)
        ;; backward compatibility
          v (if (integer? v) v 0)]
      (cond
        (= db-schema/version v)
        false

        (< db-schema/version v)
        (do
          (js/console.error "DB schema version is newer than the app, please update the app. " ":db-version" v)
          false)

        :else
        true))))

(defn restore-graph!
  "Restore db from SQLite"
  [repo]
  (state/set-state! :graph/loading? true)
  (p/let [start-time (t/now)
          data (persist-db/<fetch-init-data repo)
          _ (assert (some? data) "No data found when reloading db")
          data' (edn/read-string data)
          db-schema (db-conn/get-schema repo)
          conn (sqlite-common-db/restore-initial-data data' db-schema)
          db-name (db-conn/datascript-db repo)
          _ (swap! db-conn/conns assoc db-name conn)
          end-time (t/now)]

    (println :restore-graph-from-sqlite!-prepare (t/in-millis (t/interval start-time end-time)) "ms")

    ;; FIXME:
    ;; (db-migrate/migrate attached-db)

    (p/let [_ (p/delay 150)]          ; More time for UI refresh
      (state/set-state! :graph/loading? false)
      (react/clear-query-state!)
      (state/pub-event! [:ui/re-render-root]))))
