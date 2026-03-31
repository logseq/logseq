(ns frontend.worker.sync.download
  "Download helpers for db sync assets and graph snapshots."
  (:require [datascript.core :as d]
            [frontend.common.crypt :as crypt]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.large-title :as sync-large-title]
            [frontend.worker.sync.transport :as sync-transport]
            [logseq.db :as ldb]
            [logseq.db-sync.snapshot :as snapshot]
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

(defn- ->uint8 [data]
  (cond
    (instance? js/Uint8Array data) data
    (instance? js/ArrayBuffer data) (js/Uint8Array. data)
    (string? data) (.encode (js/TextEncoder.) data)
    :else (js/Uint8Array. data)))

(defn- gzip-bytes?
  [^js payload]
  (and (some? payload)
       (>= (.-byteLength payload) 2)
       (= 31 (aget payload 0))
       (= 139 (aget payload 1))))

(defn- bytes->stream
  [^js payload]
  (js/ReadableStream.
   #js {:start (fn [controller]
                 (.enqueue controller payload)
                 (.close controller))}))

(defn- <decompress-gzip-bytes
  [^js payload]
  (if (exists? js/DecompressionStream)
    (p/let [stream (bytes->stream payload)
            decompressed (.pipeThrough stream (js/DecompressionStream. "gzip"))
            resp (js/Response. decompressed)
            buf (.arrayBuffer resp)]
      (->uint8 buf))
    (p/rejected (ex-info "gzip decompression not supported"
                         {:type :db-sync/decompression-not-supported}))))

(defn- <snapshot-response-bytes
  [^js resp]
  (p/let [buf (.arrayBuffer resp)
          chunk (->uint8 buf)]
    (if (gzip-bytes? chunk)
      (<decompress-gzip-bytes chunk)
      chunk)))

(defn- response-body-stream
  [^js resp]
  (let [encoding (some-> resp .-headers (.get "content-encoding"))]
    (cond
      (nil? (.-body resp))
      nil

      (= "gzip" encoding)
      (when (exists? js/DecompressionStream)
        (.pipeThrough (.-body resp) (js/DecompressionStream. "gzip")))

      :else
      (.-body resp))))

(defn- <flush-row-batches!
  [rows batch-size on-batch]
  (p/loop [remaining rows]
    (if (>= (count remaining) batch-size)
      (let [batch (subvec remaining 0 batch-size)
            rest-rows (subvec remaining batch-size)]
        (p/let [_ (on-batch batch)]
          (p/recur rest-rows)))
      remaining)))

(defn- <stream-snapshot-row-batches!
  [^js resp batch-size on-batch]
  (if-let [stream (response-body-stream resp)]
    (let [reader (.getReader stream)]
      (p/loop [buffer nil
               pending []]
        (p/let [result (.read reader)]
          (if (.-done result)
            (let [pending (if (and buffer (pos? (.-byteLength buffer)))
                            (into pending (snapshot/finalize-framed-buffer buffer))
                            pending)]
              (if (seq pending)
                (p/let [_ (on-batch pending)]
                  {:chunk-count 1})
                {:chunk-count 0}))
            (let [{rows :rows next-buffer :buffer} (snapshot/parse-framed-chunk buffer (->uint8 (.-value result)))
                  pending (into pending rows)]
              (p/let [pending (<flush-row-batches! pending batch-size on-batch)]
                (p/recur next-buffer pending)))))))
    (p/let [snapshot-bytes (<snapshot-response-bytes resp)
            rows (vec (snapshot/finalize-framed-buffer snapshot-bytes))]
      (if (seq rows)
        (p/let [_ (on-batch rows)]
          {:chunk-count 1})
        {:chunk-count 0}))))

(defn- with-auth-headers
  [opts]
  (sync-auth/with-auth-headers
   #(sync-auth/auth-headers (worker-state/get-id-token))
   opts))

(defn- fetch-json
  [url opts schema]
  (sync-transport/fetch-json
   with-auth-headers
   url
   opts
   {:response-schema schema}))

(defn download-graph-snapshot!
  [repo graph-id graph-e2ee? {:keys [prepare-f import-rows-f finalize-f log-f]}]
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if (and (seq repo) (seq graph-id) (seq base))
      (p/let [_ (when log-f
                  (log-f {:sub-type :download-progress
                          :graph-uuid graph-id
                          :message "Preparing graph snapshot download"}))
              pull-resp (fetch-json (str base "/sync/" graph-id "/pull")
                                    {:method "GET"}
                                    :sync/pull)
              remote-tx (:t pull-resp)
              _ (when-not (integer? remote-tx)
                  (throw (ex-info "non-integer remote-tx when downloading graph"
                                  {:repo repo
                                   :remote-tx remote-tx})))
              snapshot-resp (fetch-json (str base "/sync/" graph-id "/snapshot/download")
                                        {:method "GET"}
                                        :sync/snapshot-download)
              resp (js/fetch (:url snapshot-resp)
                             (clj->js (with-auth-headers {:method "GET"})))
              _ (when log-f
                  (log-f {:sub-type :download-progress
                          :graph-uuid graph-id
                          :message "Start downloading graph snapshot"}))]
        (when-not (.-ok resp)
          (throw (ex-info "snapshot download failed"
                          {:repo repo
                           :status (.-status resp)})))
        (let [import-id* (atom nil)
              ensure-import! (fn []
                               (if-let [import-id @import-id*]
                                 (p/resolved import-id)
                                 (p/let [{:keys [import-id]} (prepare-f repo true graph-id graph-e2ee?)]
                                   (reset! import-id* import-id)
                                   import-id)))]
          (p/let [_ (<stream-snapshot-row-batches!
                     resp
                     25000
                     (fn [rows]
                       (p/let [import-id (ensure-import!)]
                         (import-rows-f rows graph-id import-id))))
                  _ (when log-f
                      (log-f {:sub-type :download-completed
                              :graph-uuid graph-id
                              :message "Graph snapshot downloaded"}))
                  _ (when-let [import-id @import-id*]
                      (finalize-f repo graph-id remote-tx import-id))]
            true)))
      (p/rejected (ex-info "db-sync missing graph download info"
                           {:repo repo
                            :graph-id graph-id
                            :base base})))))
