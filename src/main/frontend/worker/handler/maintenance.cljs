(ns frontend.worker.handler.maintenance
  "Database schema, reset, and garbage-collection operations."
  (:require
   [datascript.core :as d]
   [frontend.common.thread-api :refer [def-thread-api]]
   [frontend.worker.state :as worker-state]
   [lambdaisland.glogi :as log]
   [logseq.common.util :as common-util]
   [logseq.db :as ldb]
   [logseq.db.sqlite.gc :as sqlite-gc]
   [me.tonsky.persistent-sorted-set :refer [BTSet]]))

(defn- reset-db!
  [repo db-transit-str]
  (when-let [conn (get @worker-state/*datascript-conns repo)]
    (let [new-db (ldb/read-transit-str db-transit-str)
          new-db' (update new-db :eavt (fn [^BTSet eavt]
                                         (set! (.-storage eavt) (.-storage (:eavt @conn)))
                                         eavt))]
      (d/reset-conn! conn new-db' {:reset-conn! true})
      (d/reset-schema! conn (:schema new-db)))))

(def-thread-api :thread-api/get-db-schema
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    {:schema (:schema @conn)}))

(def-thread-api :thread-api/reset-db
  [repo db-transit]
  (reset-db! repo db-transit)
  nil)

(def-thread-api :thread-api/gc-graph
  [repo]
  (let [{:keys [db]} (get @worker-state/*sqlite-conns repo)
        conn (get @worker-state/*datascript-conns repo)]
    (when (and db conn)
      (log/info :gc-sqlite-dbs "gc current graph")
      (sqlite-gc/gc-kvs-table! db {:full-gc? true})
      (.exec db "VACUUM")
      (ldb/transact! conn [{:db/ident :logseq.kv/graph-last-gc-at
                            :kv/value (common-util/time-ms)}]
                     {:skip-validate-db? true
                      :persist-op? false})
      nil)))
