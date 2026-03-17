(ns frontend.worker.sync.upload
  "Snapshot upload helpers for db sync."
  (:require [cljs-bean.core :as bean]
            [datascript.core :as d]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.large-title :as sync-large-title]
            [frontend.worker.sync.temp-sqlite :as sync-temp-sqlite]
            [frontend.worker.sync.transport :as sync-transport]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(def upload-kvs-batch-size 2000)
(def upload-prepare-datoms-batch-size 100000)
(def snapshot-content-type "application/transit+json")
(def snapshot-content-encoding "gzip")
(def snapshot-text-encoder (js/TextEncoder.))
(def upload-temp-pool-name (worker-util/get-pool-name "upload-temp"))

(defn- fail-fast
  [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(defn- http-base-url
  []
  (sync-auth/http-base-url @worker-state/*db-sync-config))

(defn- get-graph-id
  [repo]
  (sync-large-title/get-graph-id worker-state/get-datascript-conn repo))

(defn- ensure-client-graph-uuid!
  [repo graph-id]
  (when (seq graph-id)
    (client-op/update-graph-uuid repo graph-id)))

(defn fetch-kvs-rows
  [db last-addr limit]
  (.exec db #js {:sql "select addr, content, addresses from kvs where addr > ? order by addr asc limit ?"
                 :bind #js [last-addr limit]
                 :rowMode "array"}))

(defn count-kvs-rows
  [db]
  (when-let [result (-> (.exec db #js {:sql "select count(*) from kvs"
                                       :rowMode "array"})
                        first)]
    (first (bean/->clj result))))

(defn normalize-snapshot-rows
  [rows]
  (mapv (fn [row] (vec row)) (array-seq rows)))

(defn encode-snapshot-rows
  [rows]
  (.encode snapshot-text-encoder (sqlite-util/write-transit-str rows)))

(defn frame-bytes
  [^js data]
  (let [len (.-byteLength data)
        out (js/Uint8Array. (+ 4 len))
        view (js/DataView. (.-buffer out))]
    (.setUint32 view 0 len false)
    (.set out data 4)
    out))

(defn maybe-compress-stream
  [stream]
  (if (exists? js/CompressionStream)
    (.pipeThrough stream (js/CompressionStream. "gzip"))
    stream))

(defn <buffer-stream
  [stream]
  (p/let [resp (js/Response. stream)
          buf (.arrayBuffer resp)]
    buf))

(defn <snapshot-upload-body
  [rows]
  (let [frame (frame-bytes (encode-snapshot-rows rows))
        stream (js/ReadableStream.
                #js {:start (fn [controller]
                              (.enqueue controller frame)
                              (.close controller))})
        use-compression? (exists? js/CompressionStream)
        body (if use-compression? (maybe-compress-stream stream) stream)]
    (if use-compression?
      (p/let [buf (<buffer-stream body)]
        {:body buf :encoding snapshot-content-encoding})
      (p/resolved {:body frame :encoding nil}))))

(defn set-graph-sync-metadata!
  [repo graph-e2ee?]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/transact! conn [(ldb/kv :logseq.kv/graph-remote? true)
                         (ldb/kv :logseq.kv/graph-rtc-e2ee? (true? graph-e2ee?))]
                   {:persist-op? false})))

(defn <prepare-upload-temp-sqlite!
  [repo graph-id source-conn aes-key update-progress]
  (p/let [temp (sync-temp-sqlite/<create-temp-sqlite-conn
                (d/schema @source-conn)
                []
                #(sync-temp-sqlite/<create-temp-sqlite-db!
                  {:get-pool-f (fn []
                                 (sync-temp-sqlite/<get-upload-temp-sqlite-pool
                                  {:*pool sync-apply/*upload-temp-opfs-pool
                                   :sqlite @worker-state/*sqlite
                                   :pool-name upload-temp-pool-name
                                   :fail-fast-f fail-fast}))
                   :upload-path-f sync-temp-sqlite/upload-temp-sqlite-path}))
          datoms (d/datoms @source-conn :eavt)
          _ (sync-large-title/process-upload-datoms-in-batches!
             datoms
             {:batch-size upload-prepare-datoms-batch-size
              :process-batch-f
              (fn [batch]
                (p/let [datoms* (sync-large-title/offload-large-titles-in-datoms-batch
                                 repo graph-id batch aes-key sync-large-title/upload-large-title!)
                        encrypted-datoms (if aes-key
                                           (sync-crypt/<encrypt-datoms aes-key datoms*)
                                           datoms*)
                        tx-data (mapv sync-large-title/datom->tx encrypted-datoms)]
                  (d/transact! (:conn temp) tx-data {:initial-db? true})
                  nil))
              :progress-f
              (fn [processed total]
                (update-progress {:sub-type :upload-progress
                                  :message (if aes-key
                                             (str "Encrypting " processed "/" total)
                                             (str "Preparing " processed "/" total))}))})]
    temp))

(defn upload-graph!
  [repo]
  (let [base (http-base-url)
        graph-id (get-graph-id repo)
        update-progress (fn [payload]
                          (worker-util/post-message :rtc-log
                                                    (merge {:type :rtc.log/upload
                                                            :graph-uuid graph-id}
                                                           payload)))]
    (cond
      (not (and (seq base) (seq graph-id)))
      (p/rejected (ex-info "db-sync missing upload info"
                           {:repo repo :base base :graph-id graph-id}))

      :else
      (if-let [source-conn (worker-state/get-datascript-conn repo)]
        (let [graph-e2ee? (true? (sync-crypt/graph-e2ee? repo))]
          (p/let [aes-key (when graph-e2ee?
                            (sync-crypt/<ensure-graph-aes-key repo graph-id))
                  _ (when (and graph-e2ee? (nil? aes-key))
                      (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))]
            (set-graph-sync-metadata! repo graph-e2ee?)
            (ensure-client-graph-uuid! repo graph-id)
            (let [snapshot-checksum (sync-checksum/recompute-checksum @source-conn)]
              (client-op/update-local-checksum repo snapshot-checksum)
              (p/let [_ (update-progress {:sub-type :upload-progress
                                          :message (if graph-e2ee? "Encrypting..." "Preparing...")})
                      {:keys [db] :as temp} (<prepare-upload-temp-sqlite!
                                             repo graph-id source-conn aes-key update-progress)
                      total-rows (count-kvs-rows db)]
                (-> (p/loop [last-addr -1
                             first-batch? true
                             loaded 0]
                      (let [rows (fetch-kvs-rows db last-addr upload-kvs-batch-size)]
                        (if (empty? rows)
                          (do
                            (sync-apply/clear-pending-txs! repo)
                            (client-op/remove-local-tx repo)
                            (client-op/update-local-tx repo 0)
                            (client-op/add-all-exists-asset-as-ops repo)
                            (update-progress {:sub-type :upload-completed
                                              :message "Graph upload finished!"})
                            {:graph-id graph-id})
                          (let [max-addr (apply max (map first rows))
                                rows* (normalize-snapshot-rows rows)
                                loaded' (+ loaded (count rows*))
                                finished? (= loaded' total-rows)
                                upload-url (str base "/sync/" graph-id "/snapshot/upload?reset="
                                                (if first-batch? "true" "false")
                                                "&finished="
                                                (if finished? "true" "false")
                                                (when finished?
                                                  (str "&checksum=" (js/encodeURIComponent snapshot-checksum))))]
                            (p/let [{:keys [body encoding]} (<snapshot-upload-body rows*)
                                    headers (cond-> {"content-type" snapshot-content-type}
                                              (string? encoding) (assoc "content-encoding" encoding))
                                    _ (sync-transport/fetch-json
                                       (fn [opts]
                                         (sync-auth/with-auth-headers
                                           #(sync-auth/auth-headers (worker-state/get-id-token))
                                           opts))
                                       upload-url
                                       {:method "POST"
                                        :headers headers
                                        :body body}
                                       {:response-schema :sync/snapshot-upload})]
                              (update-progress {:sub-type :upload-progress
                                                :message (str "Uploading " loaded' "/" total-rows)})
                              (p/recur max-addr false loaded'))))))
                    (p/finally
                      (fn []
                        (sync-temp-sqlite/cleanup-temp-sqlite!
                         temp
                         (partial sync-temp-sqlite/<remove-upload-temp-sqlite-db-file!
                                  upload-temp-pool-name)))))))))
        (p/rejected (ex-info "db-sync missing datascript conn"
                             {:repo repo :graph-id graph-id}))))))
