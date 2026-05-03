(ns frontend.worker.sync.assets
  "Asset sync helpers for db sync."
  (:require
   [datascript.core :as d]
   [frontend.common.crypt :as crypt]
   [frontend.worker.platform :as platform]
   [frontend.worker.shared-service :as shared-service]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync.auth :as sync-auth]
   [frontend.worker.sync.client-op :as client-op]
   [frontend.worker.sync.crypt :as sync-crypt]
   [frontend.worker.sync.large-title :as sync-large-title]
   [lambdaisland.glogi :as log]
   [logseq.common.util :as common-util]
   [logseq.db :as ldb]
   [promesa.core :as p]))

(def max-asset-size (* 100 1024 1024))

(defn graph-aes-key
  [repo graph-id fail-fast-f]
  (if (sync-crypt/graph-e2ee? repo)
    (p/let [aes-key (sync-crypt/<ensure-graph-aes-key repo graph-id)
            _ (when (nil? aes-key)
                (fail-fast-f :db-sync/missing-field {:repo repo :field :aes-key}))]
      aes-key)
    (p/resolved nil)))

(defn- asset-file-name
  [asset-uuid asset-type]
  (str asset-uuid "." asset-type))

(defn- ->uint8
  [payload]
  (cond
    (instance? js/Uint8Array payload)
    payload

    (instance? js/ArrayBuffer payload)
    (js/Uint8Array. payload)

    (and (exists? js/ArrayBuffer)
         (.isView js/ArrayBuffer payload))
    (js/Uint8Array. (.-buffer payload) (.-byteOffset payload) (.-byteLength payload))

    (array? payload)
    (js/Uint8Array. payload)

    (sequential? payload)
    (js/Uint8Array. (clj->js payload))

    (and (object? payload)
         (= "Buffer" (aget payload "type"))
         (array? (aget payload "data")))
    (js/Uint8Array. (aget payload "data"))

    :else
    (throw (ex-info "unsupported binary payload"
                    {:payload-type (str (type payload))}))))

(defn- payload-size
  [payload]
  (cond
    (string? payload) (count payload)
    (some? (.-byteLength payload)) (.-byteLength payload)
    (some? (.-length payload)) (.-length payload)
    :else 0))

(defn- notify-asset-progress!
  [repo asset-id direction loaded total]
  (shared-service/broadcast-to-clients!
   :rtc-asset-upload-download-progress
   {:repo repo
    :asset-id asset-id
    :progress {:direction direction
               :loaded loaded
               :total total}}))

(defn- mark-asset-write-finish!
  [repo asset-id]
  (shared-service/broadcast-to-clients!
   :asset-file-write-finish
   {:repo repo
    :asset-id asset-id
    :ts (common-util/time-ms)}))

(defn- <read-asset-bytes
  [repo asset-id asset-type]
  (platform/asset-read-bytes! (platform/current)
                              repo
                              (asset-file-name asset-id asset-type)))

(defn- <write-asset-bytes!
  [repo asset-id asset-type payload]
  (p/let [_ (platform/asset-write-bytes! (platform/current)
                                         repo
                                         (asset-file-name asset-id asset-type)
                                         payload)]
    (mark-asset-write-finish! repo asset-id)
    nil))

(defn upload-remote-asset!
  [repo graph-id asset-uuid asset-type checksum]
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if (and (seq base) (seq graph-id) (seq asset-type) (seq checksum))
      (-> (p/let [aes-key (graph-aes-key
                           repo graph-id
                           (fn [tag data]
                             (throw (ex-info (name tag) data))) )
                  asset-id (str asset-uuid)
                  put-url (sync-large-title/asset-url base graph-id asset-id asset-type)
                  asset-file (try
                               (<read-asset-bytes repo asset-id asset-type)
                               (catch :default e
                                 (log/info :read-asset e)
                                 (throw (ex-info "read-asset failed"
                                                 {:type :rtc.exception/read-asset-failed}
                                                 e))))
                  asset-bytes (if aes-key (->uint8 asset-file) asset-file)
                  payload (if (not aes-key)
                            asset-bytes
                            (p/let [encrypted-bytes (crypt/<encrypt-uint8array aes-key asset-bytes)]
                              (ldb/write-transit-str encrypted-bytes)))
                  total (payload-size payload)
                  _ (notify-asset-progress! repo asset-id :upload 0 total)
                  headers (merge (sync-auth/auth-headers (worker-state/get-id-token))
                                 {"x-amz-meta-checksum" checksum
                                  "x-amz-meta-type" asset-type})
                  ^js resp (js/fetch put-url
                                     (clj->js {:method "PUT"
                                               :headers headers
                                               :body payload}))
                  status (.-status resp)
                  _ (notify-asset-progress! repo asset-id :upload total total)]
            (when-not (.-ok resp)
              (throw (ex-info "upload-asset failed"
                              {:type :rtc.exception/upload-asset-failed
                               :data {:status status}})))
            nil)
          (p/catch
           (fn [e]
             (if (contains? #{:rtc.exception/read-asset-failed
                              :rtc.exception/upload-asset-failed}
                            (:type (ex-data e)))
               (p/rejected e)
               (p/rejected (ex-info "upload-asset failed"
                                    {:type :rtc.exception/upload-asset-failed}
                                    e))))))
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

(defn- parse-content-length
  [^js resp]
  (when-let [content-length (some-> (.-headers resp) (.get "content-length"))]
    (let [length (js/parseInt content-length 10)]
      (when (not (js/isNaN length))
        length))))

(defn download-remote-asset!
  [repo graph-id asset-uuid asset-type]
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if (and (seq base) (seq graph-id) (seq asset-type))
      (-> (p/let [aes-key (graph-aes-key
                           repo graph-id
                           (fn [tag data]
                             (throw (ex-info (name tag) data))))
                  asset-id (str asset-uuid)
                  get-url (sync-large-title/asset-url base graph-id asset-id asset-type)
                  headers (sync-auth/auth-headers (worker-state/get-id-token))
                  request-opts (cond-> {:method "GET"}
                                 (seq headers) (assoc :headers headers))
                  ^js resp (js/fetch get-url
                                     (clj->js request-opts))
                  status (.-status resp)
                  _ (when-not (.-ok resp)
                      (throw (ex-info "download asset failed"
                                      {:type :rtc.exception/download-asset-failed
                                       :data {:status status}})))
                  total (or (parse-content-length resp) 0)
                  _ (notify-asset-progress! repo asset-id :download 0 total)
                  body (.arrayBuffer resp)
                  body-size (.-byteLength body)
                  total' (if (pos? total) total body-size)
                  _ (notify-asset-progress! repo asset-id :download body-size total')
                  asset-file
                  (if (not aes-key)
                    body
                    (try
                      (let [asset-file-untransited (ldb/read-transit-str (.decode (js/TextDecoder.) body))]
                        (crypt/<decrypt-uint8array aes-key asset-file-untransited))
                      (catch js/SyntaxError _
                        body)
                      (catch :default e
                        ;; if decrypt failed, write origin-body
                        (if (= "decrypt-uint8array" (ex-message e))
                          body
                          (throw e)))))]
            (<write-asset-bytes! repo asset-id asset-type asset-file))
          (p/catch
           (fn [e]
             (if (= :rtc.exception/download-asset-failed (:type (ex-data e)))
               (p/rejected e)
               (p/rejected (ex-info "download asset failed"
                                    {:type :rtc.exception/download-asset-failed}
                                    e))))))
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
            (let [asset-type (:logseq.property.asset/type ent)
                  asset-id (str asset-uuid)
                  should-download? (and (seq asset-type)
                                        (:logseq.property.asset/remote-metadata ent))]
              (-> (p/let [meta (when should-download?
                                 (platform/asset-stat (platform/current)
                                                      repo
                                                      (asset-file-name asset-id asset-type)))
                          missing-local? (and should-download? (nil? meta))
                          _ (when missing-local?
                              (download-remote-asset! repo graph-id asset-uuid asset-type))
                          _ (when missing-local?
                              (when-let [target-ent (d/entity @conn [:block/uuid asset-uuid])]
                                (ldb/transact!
                                 conn
                                 [[:db/retract (:db/id target-ent)
                                   :logseq.property.asset/remote-metadata]]
                                 {:persist-op? true})))
                          _ (when missing-local?
                              (client-op/remove-asset-op repo asset-uuid))
                          _ (when missing-local?
                              (broadcast-rtc-state!-f client))]
                    nil)
                  (p/catch (fn [e]
                             (js/console.error e)))))))))))
