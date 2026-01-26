(ns logseq.db-sync.worker.routes.sync
  (:require [reitit.core :as r]))

(def ^:private route-data
  [["/health" {:methods {"GET" :sync/health}}]
   ["/pull" {:methods {"GET" :sync/pull}}]
   ["/snapshot/download" {:methods {"GET" :sync/snapshot-download}}]
   ["/admin/reset" {:methods {"DELETE" :sync/admin-reset}}]
   ["/tx/batch" {:methods {"POST" :sync/tx-batch}}]
   ["/snapshot/upload" {:methods {"POST" :sync/snapshot-upload}}]])

(def ^:private router
  (r/router route-data))

(defn match-route [method path]
  (when-let [match (r/match-by-path router path)]
    (when-let [handler (get-in match [:data :methods method])]
      (assoc match :handler handler))))
