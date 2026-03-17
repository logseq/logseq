(ns frontend.worker.sync.assets
  "Asset sync helpers for db sync."
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.download :as sync-download]
            [frontend.worker.sync.large-title :as sync-large-title]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def max-asset-size (* 100 1024 1024))

(defn upload-remote-asset!
  [repo graph-id asset-uuid asset-type checksum]
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if (and (seq base) (seq graph-id) (seq asset-type) (seq checksum))
      (p/let [exported-aes-key (sync-download/exported-graph-aes-key
                                repo graph-id
                                (fn [tag data]
                                  (throw (ex-info (name tag) data))))]
        (worker-state/<invoke-main-thread :thread-api/rtc-upload-asset
                                          repo exported-aes-key (str asset-uuid) asset-type checksum
                                          (sync-large-title/asset-url base graph-id (str asset-uuid) asset-type)
                                          {:extra-headers (sync-auth/auth-headers (worker-state/get-id-token))}))
      (p/rejected (ex-info "missing asset upload info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :checksum checksum
                            :base base
                            :graph-id graph-id})))))

(defn process-asset-op!
  [repo graph-id asset-op {:keys [current-client-f broadcast-rtc-state!-f fail-fast-f]}]
  (let [asset-uuid (:block/uuid asset-op)
        op-type (cond
                  (contains? asset-op :update-asset) :update-asset
                  (contains? asset-op :remove-asset) :remove-asset
                  :else :unknown)]
    (when-not asset-uuid
      (fail-fast-f :db-sync/missing-field {:repo repo :field :asset-uuid :op op-type}))
    (cond
      (contains? asset-op :update-asset)
      (if-let [conn (worker-state/get-datascript-conn repo)]
        (let [ent (d/entity @conn [:block/uuid asset-uuid])
              asset-type (:logseq.property.asset/type ent)
              checksum (:logseq.property.asset/checksum ent)
              size (:logseq.property.asset/size ent 0)]
          (when-not asset-type
            (fail-fast-f :db-sync/missing-field {:repo repo
                                                 :field :asset-type
                                                 :op :update-asset
                                                 :asset-uuid asset-uuid}))
          (when-not checksum
            (fail-fast-f :db-sync/missing-field {:repo repo
                                                 :field :checksum
                                                 :op :update-asset
                                                 :asset-uuid asset-uuid
                                                 :asset-type asset-type}))
          (cond
            (> size max-asset-size)
            (do
              (log/info :db-sync/asset-too-large {:repo repo
                                                  :asset-uuid asset-uuid
                                                  :size size})
              (client-op/remove-asset-op repo asset-uuid)
              (when-let [client (current-client-f repo)]
                (broadcast-rtc-state!-f client))
              (p/resolved nil))

            :else
            (-> (upload-remote-asset! repo graph-id asset-uuid asset-type checksum)
                (p/then (fn [_]
                          (when (d/entity @conn [:block/uuid asset-uuid])
                            (ldb/transact!
                             conn
                             [{:block/uuid asset-uuid
                               :logseq.property.asset/remote-metadata {:checksum checksum :type asset-type}}]
                             {:persist-op? true}))
                          (client-op/remove-asset-op repo asset-uuid)
                          (when-let [client (current-client-f repo)]
                            (broadcast-rtc-state!-f client))))
                (p/catch (fn [e]
                           (case (:type (ex-data e))
                             :rtc.exception/read-asset-failed
                             (do
                               (client-op/remove-asset-op repo asset-uuid)
                               (when-let [client (current-client-f repo)]
                                 (broadcast-rtc-state!-f client)))

                             :rtc.exception/upload-asset-failed
                             nil

                             (log/error :db-sync/asset-upload-failed
                                        {:repo repo
                                         :asset-uuid asset-uuid
                                         :error e})))))))
        (fail-fast-f :db-sync/missing-db {:repo repo :op :process-asset-op}))

      (contains? asset-op :remove-asset)
      (-> (client-op/remove-asset-op repo asset-uuid)
          (p/then (fn [_]
                    (when-let [client (current-client-f repo)]
                      (broadcast-rtc-state!-f client))))
          (p/catch (fn [e]
                     (log/error :db-sync/asset-delete-failed
                                {:repo repo
                                 :asset-uuid asset-uuid
                                 :error e}))))

      :else
      (p/resolved nil))))

(defn process-asset-ops!
  [repo client {:keys [current-client-f broadcast-rtc-state!-f fail-fast-f]}]
  (let [graph-id (:graph-id client)
        asset-ops (not-empty (client-op/get-all-asset-ops repo))
        parallelism 10]
    (if (and (seq graph-id) asset-ops)
      (let [queue (atom (vec asset-ops))
            pop-queue! (fn []
                         (let [selected (atom nil)]
                           (swap! queue
                                  (fn [q]
                                    (if (seq q)
                                      (do
                                        (reset! selected (first q))
                                        (subvec q 1))
                                      q)))
                           @selected))
            worker (fn worker []
                     (when-let [asset-op (pop-queue!)]
                       (-> (process-asset-op! repo graph-id asset-op
                                              {:current-client-f current-client-f
                                               :broadcast-rtc-state!-f broadcast-rtc-state!-f
                                               :fail-fast-f fail-fast-f})
                           (p/then (fn [_] (worker)))
                           (p/catch (fn [e]
                                      (log/error :db-sync/process-asset-op-loop-failed
                                                 {:repo repo
                                                  :asset-op asset-op
                                                  :error e}))))))]
        (p/all (repeat (min parallelism (count asset-ops)) (worker))))
      (p/resolved nil))))

(defn enqueue-asset-sync!
  [repo client {:keys [enqueue-asset-task-f current-client-f broadcast-rtc-state!-f fail-fast-f]}]
  (enqueue-asset-task-f
   client
   #(process-asset-ops!
     repo client
     {:current-client-f current-client-f
      :broadcast-rtc-state!-f broadcast-rtc-state!-f
      :fail-fast-f fail-fast-f})))
