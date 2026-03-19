(ns frontend.worker.sync.download
  "Download helpers for db sync assets."
  (:require [datascript.core :as d]
            [frontend.common.crypt :as crypt]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.large-title :as sync-large-title]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn exported-graph-aes-key
  [repo graph-id fail-fast-f]
  (if (sync-crypt/graph-e2ee? repo)
    (p/let [aes-key (sync-crypt/<ensure-graph-aes-key repo graph-id)
            _ (when (nil? aes-key)
                (fail-fast-f :db-sync/missing-field {:repo repo :field :aes-key}))]
      (crypt/<export-aes-key aes-key))
    (p/resolved nil)))

(defn download-remote-asset!
  [repo graph-id asset-uuid asset-type]
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if (and (seq base) (seq graph-id) (seq asset-type))
      (p/let [exported-aes-key (exported-graph-aes-key
                                repo graph-id
                                (fn [tag data]
                                  (throw (ex-info (name tag) data))))]
        (worker-state/<invoke-main-thread :thread-api/rtc-download-asset
                                          repo exported-aes-key (str asset-uuid) asset-type
                                          (sync-large-title/asset-url base graph-id (str asset-uuid) asset-type)
                                          {:extra-headers (sync-auth/auth-headers (worker-state/get-id-token))}))
      (p/rejected (ex-info "missing asset download info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :base base
                            :graph-id graph-id})))))

(defn request-asset-download!
  [repo asset-uuid {:keys [current-client-f enqueue-asset-task-f broadcast-rtc-state!-f]}]
  (when-let [client (current-client-f repo)]
    (when-let [graph-id (:graph-id client)]
      (enqueue-asset-task-f
       client
       #(when-let [conn (worker-state/get-datascript-conn repo)]
          (when-let [ent (d/entity @conn [:block/uuid asset-uuid])]
            (let [asset-type (:logseq.property.asset/type ent)]
              (-> (p/let [meta (when (seq asset-type)
                                 (worker-state/<invoke-main-thread
                                  :thread-api/get-asset-file-metadata
                                  repo (str asset-uuid) asset-type))]
                    (when (and (seq asset-type)
                               (:logseq.property.asset/remote-metadata ent)
                               (nil? meta))
                      (p/let [_ (download-remote-asset! repo graph-id asset-uuid asset-type)]
                        (when (d/entity @conn [:block/uuid asset-uuid])
                          (ldb/transact!
                           conn
                           [{:block/uuid asset-uuid
                             :logseq.property.asset/remote-metadata nil}]
                           {:persist-op? true}))
                        (client-op/remove-asset-op repo asset-uuid)
                        (broadcast-rtc-state!-f client))))
                  (p/catch (fn [e]
                             (js/console.error e)))))))))))
