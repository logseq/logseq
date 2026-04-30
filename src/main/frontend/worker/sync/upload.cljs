(ns frontend.worker.sync.upload
  "Snapshot upload helpers for db sync."
  (:require
   [cljs-bean.core :as bean]
   [datascript.core :as d]
   [frontend.worker-common.util :as worker-util]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync.apply-txs :as sync-apply]
   [frontend.worker.sync.auth :as sync-auth]
   [frontend.worker.sync.client-op :as client-op]
   [frontend.worker.sync.crypt :as sync-crypt]
   [frontend.worker.sync.large-title :as sync-large-title]
   [frontend.worker.sync.temp-sqlite :as sync-temp-sqlite]
   [frontend.worker.sync.util :refer [coerce-http-request fail-fast fetch-json] :as sync-util]
   [logseq.common.config :as common-config]
   [logseq.db :as ldb]
   [logseq.db-sync.checksum :as sync-checksum]
   [logseq.db.sqlite.util :as sqlite-util]
   [promesa.core :as p]))

(def upload-kvs-batch-size 500)
(def upload-prepare-datoms-batch-size 100000)
(def snapshot-upload-max-bytes 1000000)
(def snapshot-frame-header-bytes 4)
(def ignored-oversized-upload-attrs #{:logseq.property.tldraw/page})
(def snapshot-content-type "application/transit+json")
(def snapshot-content-encoding "gzip")
(def snapshot-text-encoder (js/TextEncoder.))

(defn- http-base-url
  []
  (sync-auth/http-base-url @worker-state/*db-sync-config))

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

(defn- datom-value-byte-length
  [value]
  (.-byteLength ^js (.encode snapshot-text-encoder (sqlite-util/write-transit-str value))))

(defn- drop-oversized-upload-datoms
  [datoms]
  (let [threshold (- snapshot-upload-max-bytes snapshot-frame-header-bytes)]
    (reduce (fn [{:keys [kept dropped]} datom]
              (let [attr (:a datom)
                    size (when (contains? ignored-oversized-upload-attrs attr)
                           (datom-value-byte-length (:v datom)))]
                (if (and size (> size threshold))
                  {:kept kept
                   :dropped (conj dropped {:a attr
                                           :e (:e datom)
                                           :bytes size})}
                  {:kept (conj kept datom)
                   :dropped dropped})))
            {:kept []
             :dropped []}
            datoms)))

(defn- snapshot-rows-byte-length
  [rows]
  (+ snapshot-frame-header-bytes
     (.-byteLength ^js (encode-snapshot-rows rows))))

(defn- max-prefix-rows-within-bytes
  [rows max-bytes]
  (let [rows-count (count rows)]
    (loop [low 1
           high rows-count
           best 0]
      (if (> low high)
        best
        (let [mid (quot (+ low high) 2)
              rows' (subvec rows 0 mid)
              size (snapshot-rows-byte-length rows')]
          (if (<= size max-bytes)
            (recur (inc mid) high mid)
            (recur low (dec mid) best)))))))

(defn- split-snapshot-rows-by-max-bytes
  [rows max-bytes]
  (loop [remaining rows
         batches []]
    (if (empty? remaining)
      batches
      (let [prefix-count (max-prefix-rows-within-bytes remaining max-bytes)]
        (if (pos? prefix-count)
          (let [batch (subvec remaining 0 prefix-count)
                remaining' (subvec remaining prefix-count)]
            (recur remaining' (conj batches batch)))
          (let [row (first remaining)
                row-size (snapshot-rows-byte-length [row])]
            (fail-fast :db-sync/snapshot-row-too-large
                       {:max-bytes max-bytes
                        :row-size row-size
                        :addr (first row)})))))))

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

(defn- snapshot-upload-url
  [base graph-id reset? finished? checksum]
  (str base "/sync/" graph-id "/snapshot/upload?reset="
       (if reset? "true" "false")
       "&finished="
       (if finished? "true" "false")
       (when finished?
         (str "&checksum=" (js/encodeURIComponent checksum)))))

(defn- <upload-snapshot-rows-batches!
  [rows-batches {:keys [base graph-id first-batch? finished? checksum auth-fetch-f]}]
  (p/loop [remaining rows-batches
           first-request? first-batch?]
    (if-let [rows-batch (first remaining)]
      (let [last-request? (nil? (next remaining))
            finished-request? (and finished? last-request?)
            upload-url (snapshot-upload-url base graph-id first-request? finished-request? checksum)]
        (p/let [{:keys [body encoding]} (<snapshot-upload-body rows-batch)
                headers (cond-> {"content-type" snapshot-content-type}
                          (string? encoding) (assoc "content-encoding" encoding))
                _ (auth-fetch-f upload-url headers body)]
          (p/recur (next remaining) false)))
      nil)))
(defn <prepare-upload-temp-sqlite!
  [repo graph-id source-conn aes-key update-progress]
  (p/let [temp (sync-temp-sqlite/<create-temp-sqlite-conn (d/schema @source-conn) [])
          datoms (d/datoms @source-conn :eavt)
          _ (sync-large-title/process-upload-datoms-in-batches!
             datoms
             {:batch-size upload-prepare-datoms-batch-size
              :process-batch-f
              (fn [batch]
                (p/let [datoms* (sync-large-title/offload-large-titles-in-datoms-batch
                                 repo graph-id batch aes-key sync-apply/upload-large-title!)
                        {:keys [kept dropped]} (drop-oversized-upload-datoms datoms*)
                        _ (when (seq dropped)
                            (prn :db-sync/drop-oversized-upload-datoms
                                 {:repo repo
                                  :count (count dropped)
                                  :attrs (vec (distinct (map :a dropped)))
                                  :max-bytes (apply max (map :bytes dropped))}))
                        encrypted-datoms (if aes-key
                                           (sync-crypt/<encrypt-datoms aes-key kept)
                                           kept)
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

(defn- normalize-graph-e2ee?
  [graph-e2ee?]
  (if (nil? graph-e2ee?)
    true
    (true? graph-e2ee?)))

(defn- graph-id->uuid
  [repo graph-id]
  (when-not (seq graph-id)
    (fail-fast :db-sync/missing-field {:repo repo :field :graph-id}))
  (try
    (uuid graph-id)
    (catch :default e
      (fail-fast :db-sync/invalid-field {:repo repo
                                         :field :graph-id
                                         :value graph-id
                                         :error e}))))

(defn- set-graph-sync-metadata!
  [repo graph-id graph-e2ee?]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/transact! conn [(ldb/kv :logseq.kv/graph-uuid (graph-id->uuid repo graph-id))
                         (ldb/kv :logseq.kv/graph-remote? true)
                         (ldb/kv :logseq.kv/graph-rtc-e2ee? (true? graph-e2ee?))]
      {:outliner-op :set-kvs})))

(defn- persist-upload-graph-identity!
  [repo graph-id graph-e2ee?]
  (let [graph-id (some-> graph-id str)
        graph-e2ee? (normalize-graph-e2ee? graph-e2ee?)]
    (when-not (seq graph-id)
      (fail-fast :db-sync/missing-field {:repo repo :field :graph-id}))
    (set-graph-sync-metadata! repo graph-id graph-e2ee?)
    (ensure-client-graph-uuid! repo graph-id)
    {:graph-id graph-id
     :graph-e2ee? graph-e2ee?}))

(defn- <create-remote-graph-aux!
  [repo {:keys [graph-e2ee? graph-ready-for-use?]}]
  (let [base (http-base-url)
        graph-name (some-> repo common-config/strip-leading-db-version-prefix)
        schema-version (some-> (worker-state/get-datascript-conn repo)
                               deref
                               ldb/get-graph-schema-version
                               :major
                               str)
        graph-e2ee? (normalize-graph-e2ee? graph-e2ee?)]
    (cond
      (not (seq base))
      (fail-fast :db-sync/missing-field {:repo repo :field :http-base})

      (not (seq graph-name))
      (fail-fast :db-sync/missing-field {:repo repo :field :graph-name})

      :else
      (do
        (sync-util/require-auth-token! {:repo repo :field :auth-token})
        (p/let [_ (sync-crypt/ensure-user-rsa-keys! {:ensure-server? true})
                body (coerce-http-request :graphs/create
                                          {:graph-name graph-name
                                           :schema-version schema-version
                                           :graph-e2ee? graph-e2ee?
                                           :graph-ready-for-use? (not= false graph-ready-for-use?)})
                _ (when (nil? body)
                    (fail-fast :db-sync/invalid-field {:repo repo
                                                       :field :create-graph-body}))
                result (fetch-json (str base "/graphs")
                                   {:method "POST"
                                    :headers {"content-type" "application/json"}
                                    :body (js/JSON.stringify (clj->js body))}
                                   {:response-schema :graphs/create})
                graph-id (:graph-id result)
                graph-e2ee? (normalize-graph-e2ee? (if (contains? result :graph-e2ee?)
                                                     (:graph-e2ee? result)
                                                     graph-e2ee?))]
          (when-not (seq graph-id)
            (fail-fast :db-sync/missing-field {:repo repo
                                               :field :graph-id
                                               :op :create-graph}))
          (persist-upload-graph-identity! repo graph-id graph-e2ee?)
          {:graph-id graph-id
           :graph-e2ee? graph-e2ee?})))))

(defn list-remote-graphs!
  []
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if-not (seq base)
      (p/resolved [])
      (do
        (sync-util/require-auth-token! {:op :list-remote-graphs})
        (p/let [resp (fetch-json (str base "/graphs")
                                           {:method "GET"}
                                           {:response-schema :graphs/list})]
          (vec (or (:graphs resp) [])))))))

(defn- fail-upload-graph-already-exists!
  [repo {:keys [graph-id graph-name]}]
  (throw (ex-info "remote graph already exists; delete it before uploading again"
                  {:code :db-sync/graph-already-exists
                   :repo repo
                   :graph-id graph-id
                   :graph-name graph-name})))

(defn- remote-graph-matches-upload-target?
  [target-graph-name {:keys [graph-name]}]
  (= target-graph-name graph-name))

(defn create-remote-graph!
  [repo {:keys [graph-e2ee? graph-ready-for-use?]}]
  (let [target-graph-name (some-> repo common-config/strip-leading-db-version-prefix)]
    (cond
      (not (seq target-graph-name))
      (fail-fast :db-sync/missing-field {:repo repo :field :graph-name})

      :else
      (p/let [remote-graphs (list-remote-graphs!)
              matching-graphs (filterv (partial remote-graph-matches-upload-target?
                                                target-graph-name)
                                       remote-graphs)]
        (cond
          (> (count matching-graphs) 1)
          (fail-fast :db-sync/ambiguous-graph-match {:repo repo
                                                     :graph-name target-graph-name
                                                     :match-count (count matching-graphs)})

          (= 1 (count matching-graphs))
          (fail-upload-graph-already-exists! repo {:graph-name target-graph-name})

          :else
          (p/let [_ (sync-crypt/<preflight-upload-e2ee! repo graph-e2ee?)]
            (<create-remote-graph-aux! repo {:graph-e2ee? graph-e2ee?
                                             :graph-ready-for-use? graph-ready-for-use?})))))))

(defn upload-graph!
  [repo]
  (let [base (http-base-url)
        update-progress (fn [payload]
                          (worker-util/post-message :rtc-log
                                                    (merge {:type :rtc.log/upload}
                                                           payload)))]
    (if-not (seq base)
      (p/rejected (ex-info "db-sync missing base"
                           {:repo repo :base base}))
      (if-let [source-conn (worker-state/get-datascript-conn repo)]
        (p/let [graph-e2ee? (normalize-graph-e2ee? (sync-crypt/graph-e2ee? repo))
                {:keys [graph-id]} (create-remote-graph! repo {:graph-e2ee? graph-e2ee?
                                                               :graph-ready-for-use? false})]
          (p/let [aes-key (when graph-e2ee?
                            (sync-crypt/<ensure-graph-aes-key repo graph-id))
                  _ (when (and graph-e2ee? (nil? aes-key))
                      (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))]
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
                            (client-op/reset-local-tx repo)
                            (client-op/add-all-exists-asset-as-ops repo)
                            (update-progress {:sub-type :upload-completed
                                              :message "Graph upload finished!"})
                            {:graph-id graph-id})
                          (let [max-addr (apply max (map first rows))
                                rows* (normalize-snapshot-rows rows)
                                loaded' (+ loaded (count rows*))
                                finished? (= loaded' total-rows)
                                row-batches (split-snapshot-rows-by-max-bytes rows* snapshot-upload-max-bytes)
                                batch-payloads
                                (mapv (fn [rows-batch]
                                        {:rows (count rows-batch)
                                         :payload-bytes (snapshot-rows-byte-length rows-batch)})
                                      row-batches)]
                            (prn :db-sync/upload-kvs-batch
                                 {:total-kvs-rows total-rows
                                  :fetched-kvs-rows (count rows*)
                                  :upload-kvs-batch-size upload-kvs-batch-size
                                  :split-batch-count (count row-batches)
                                  :split-batches batch-payloads
                                  :max-request-bytes snapshot-upload-max-bytes})
                            (p/let [_ (<upload-snapshot-rows-batches!
                                       row-batches
                                       {:base base
                                        :graph-id graph-id
                                        :first-batch? first-batch?
                                        :finished? finished?
                                        :checksum snapshot-checksum
                                        :auth-fetch-f
                                        (fn [upload-url headers body]
                                          (fetch-json
                                           upload-url
                                           {:method "POST"
                                            :headers headers
                                            :body body}
                                           {:response-schema :sync/snapshot-upload}))})]
                              (update-progress {:sub-type :upload-progress
                                                :message (str "Uploading " loaded' "/" total-rows)})
                              (p/recur max-addr false loaded'))))))
                    (p/finally
                      (fn []
                        (sync-temp-sqlite/cleanup-temp-sqlite! temp))))))))
        (p/rejected (ex-info "db-sync missing datascript conn"
                             {:repo repo}))))))
