(ns frontend.worker.handler.sync
  "Sync operations for the db worker."
  (:require [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]))

(def-thread-api :thread-api/set-db-sync-config
  [config]
  (reset! worker-state/*db-sync-config (worker-state/non-auth-db-sync-config config))
  nil)

(def-thread-api :thread-api/get-db-sync-config
  []
  (worker-state/non-auth-db-sync-config @worker-state/*db-sync-config))

(def-thread-api :thread-api/db-sync-status
  [repo]
  (db-sync/status repo))

(def-thread-api :thread-api/db-sync-stop
  []
  (db-sync/stop!))

(def-thread-api :thread-api/db-sync-update-presence
  [editing-block-uuid]
  (db-sync/update-presence! editing-block-uuid))

(def-thread-api :thread-api/db-sync-request-asset-download
  [repo asset-uuid]
  (db-sync/request-asset-download! repo asset-uuid))

(def-thread-api :thread-api/db-sync-download-missing-assets
  [repo graph-id]
  (db-sync/download-missing-assets! repo graph-id))

(def-thread-api :thread-api/db-sync-retry-asset-upload
  [repo]
  (db-sync/retry-asset-upload! repo))

(def-thread-api :thread-api/db-sync-grant-graph-access
  [repo graph-id target-email]
  (sync-crypt/<grant-graph-access! repo graph-id target-email))

(def-thread-api :thread-api/db-sync-ensure-user-rsa-keys
  [& [opts]]
  (sync-crypt/ensure-user-rsa-keys! opts))

(def-thread-api :thread-api/db-sync-list-remote-graphs
  []
  (db-sync/list-remote-graphs!))

(def-thread-api :thread-api/db-sync-upload-graph
  [repo]
  (db-sync/upload-graph! repo))

(def-thread-api :thread-api/db-sync-create-remote-graph
  [repo graph-e2ee? graph-ready-for-use?]
  (db-sync/create-remote-graph! repo {:graph-e2ee? graph-e2ee?
                                      :graph-ready-for-use? graph-ready-for-use?}))

(def-thread-api :thread-api/db-sync-stop-upload
  [repo]
  (db-sync/stop-upload! repo))

(def-thread-api :thread-api/db-sync-resume-upload
  [repo]
  (db-sync/resume-upload! repo))

(def-thread-api :thread-api/db-sync-upload-stopped?
  [repo]
  (db-sync/upload-stopped? repo))

(def-thread-api :thread-api/db-sync-get-all-block-conflicts
  [repo]
  (let [conflicts (client-op/get-all-sync-conflicts repo)]
    (when-not (map? conflicts)
      (throw (ex-info "Expected sync conflicts grouped by block"
                      {:repo repo
                       :conflicts conflicts})))
    (into {}
          (map (fn [[block-uuid block-conflicts]]
                 (when-not (uuid? block-uuid)
                   (throw (ex-info "Expected sync conflict block UUID"
                                   {:repo repo
                                    :block-uuid block-uuid})))
                 [(str block-uuid) block-conflicts]))
          conflicts)))

(def-thread-api :thread-api/db-sync-clear-block-conflicts
  [repo block-uuid]
  (client-op/clear-sync-conflicts! repo block-uuid)
  (shared-service/broadcast-to-clients!
   :sync-conflicts-updated
   {:repo repo
    :block-uuid block-uuid
    :conflicts []}))

(def-thread-api :thread-api/db-sync-download-graph-by-id
  [repo graph-id graph-e2ee?]
  (sync-download/download-graph-by-id! repo graph-id graph-e2ee?))
