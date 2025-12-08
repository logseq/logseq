(ns frontend.db.restore
  "Fns for DB restore(from text or sqlite)"
  (:require [cljs-time.core :as t]
            [datascript.core :as d]
            [frontend.db.conn :as db-conn]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.undo-redo :as undo-redo]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn restore-graph!
  "Restore db from SQLite"
  [repo & {:as opts}]
  (state/set-state! :graph/loading? true)
  (p/let [start-time (t/now)
          {:keys [schema initial-data]} (persist-db/<fetch-init-data repo opts)
          _ (state/set-current-repo! repo)
          ;; Without valid schema app fails hard downstream
          _ (when (nil? schema)
              (throw (ex-info "No valid schema found when reloading db" {:repo repo})))
          conn (try
                 (d/conn-from-datoms initial-data schema)
                 (catch :default e
                   (prn :error :restore-initial-data-failed
                        (ldb/write-transit-str {:schema schema
                                                :initial-data initial-data}))
                   (js/console.error e)
                   (throw e)))
          _ (undo-redo/listen-db-changes! repo conn)
          db-name (db-conn/get-repo-path repo)
          _ (swap! db-conn/conns assoc db-name conn)
          end-time (t/now)]

    (log/info ::restore-graph! (str "loads " (count initial-data) " datoms in " (t/in-millis (t/interval start-time end-time)) " ms"))

    (state/pub-event! [:graph/restored repo])
    (state/set-state! :graph/loading? false)
    (state/pub-event! [:ui/re-render-root])))
