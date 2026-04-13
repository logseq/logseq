(ns frontend.worker.sync.download
  "Download helpers for graph snapshots."
  (:require
   [datascript.core :as d]
   [frontend.common.thread-api :as thread-api]
   [frontend.worker-common.util :as worker-util]
   [frontend.worker.search :as search]
   [frontend.worker.shared-service :as shared-service]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync.auth :as sync-auth]
   [frontend.worker.sync.client-op :as client-op]
   [frontend.worker.sync.crypt :as sync-crypt]
   [frontend.worker.sync.log-and-state :as rtc-log-and-state]
   [frontend.worker.sync.temp-sqlite :as sync-temp-sqlite]
   [frontend.worker.sync.transport :as sync-transport]
   [logseq.db-sync.snapshot :as snapshot]
   [logseq.db.common.sqlite :as common-sqlite]
   [logseq.db.frontend.schema :as db-schema]
   [promesa.core :as p]))

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

(defn- <stream-starts-with-gzip?
  [^js stream]
  (let [reader (.getReader stream)]
    (-> (.read reader)
        (p/then (fn [result]
                  (if (.-done result)
                    false
                    (gzip-bytes? (->uint8 (.-value result))))))
        (p/catch (fn [_] false))
        (p/finally (fn []
                     (try
                       (.releaseLock reader)
                       (catch :default _)))))))

(defn- <response-body-stream
  [^js resp]
  (let [body (.-body resp)
        encoding (some-> resp .-headers (.get "content-encoding"))]
    (cond
      (nil? body)
      (p/resolved nil)

      (and (= "gzip" encoding) (exists? js/DecompressionStream))
      (if (fn? (.-tee body))
        (let [branches (.tee body)
              probe (aget branches 0)
              payload (aget branches 1)]
          (-> (<stream-starts-with-gzip? probe)
              (p/then (fn [gzip?]
                        (if gzip?
                          (.pipeThrough payload (js/DecompressionStream. "gzip"))
                          payload)))
              (p/catch (fn [_] payload))))
        (p/resolved (.pipeThrough body (js/DecompressionStream. "gzip"))))

      :else
      (p/resolved body))))

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
  (p/let [stream (<response-body-stream resp)]
    (if stream
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
          {:chunk-count 0})))))

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

(defn- fail-fast
  [tag data]
  (throw (ex-info (name tag) data)))

(defonce ^:private *import-state (atom nil))
(def ^:private snapshot-import-datoms-batch-size 10000)

(defn complete-datoms-import!
  [repo graph-id remote-tx]
  (-> (p/do!
       (when-let [search-db (worker-state/get-sqlite-conn repo :search)]
         (search/truncate-table! search-db))
       (rtc-log-and-state/rtc-log :rtc.log/download
                                  {:sub-type :download-progress
                                   :graph-uuid graph-id
                                   :message "Saving data to DB"})
       (if-let [rehydrate-f (@thread-api/*thread-apis :thread-api/db-sync-rehydrate-large-titles)]
         (rehydrate-f repo graph-id)
         (fail-fast :db-sync/missing-field {:field :thread-api/db-sync-rehydrate-large-titles}))
       (rtc-log-and-state/rtc-log :rtc.log/download
                                  {:sub-type :download-completed
                                   :graph-uuid graph-id
                                   :message "Graph is ready!"})
       (when-let [^js db (worker-state/get-sqlite-conn repo :db)]
         (.exec db "PRAGMA wal_checkpoint(2)"))
       (client-op/update-local-tx repo remote-tx)
       (shared-service/broadcast-to-clients! :add-repo {:repo repo}))
      (p/catch (fn [error]
                 (js/console.error error)))))

(defn- require-thread-api-f!
  [k]
  (if-let [f (@thread-api/*thread-apis k)]
    f
    (fail-fast :db-sync/missing-field {:field k})))

(defn- stale-import-ex-info
  [repo graph-id import-id]
  (ex-info "stale db sync import"
           {:type :db-sync/stale-import
            :repo repo
            :graph-id graph-id
            :import-id import-id}))

(defn- <remove-import-temp-db-file!
  [repo path]
  (-> (p/let [^js root (.getDirectory js/navigator.storage)
              ^js dir (.getDirectoryHandle root (str "." (worker-util/get-pool-name repo)))]
        (.removeEntry dir (subs path 1)))
      (p/catch
       (fn [error]
         (if (= "NotFoundError" (.-name error))
           nil
           (p/rejected error))))))

(defn- close-import-state!
  [{:keys [repo rows-db rows-path]}]
  (when rows-db
    (try
      (.close rows-db)
      (catch :default _)))
  (when (and repo rows-path)
    (-> (<remove-import-temp-db-file! repo rows-path)
        (p/catch (fn [_] nil)))))

(defn- clear-import-state!
  [import-id]
  (when-let [state @*import-state]
    (when (= import-id (:import-id state))
      (close-import-state! state)
      (reset! *import-state nil))))

(defn close-import-state-for-repo!
  [repo]
  (when-let [state @*import-state]
    (when (= repo (:repo state))
      (close-import-state! state)
      (reset! *import-state nil)))
  nil)

(defn- require-import-state!
  [repo graph-id import-id]
  (let [state @*import-state]
    (when-not (and state
                   (= import-id (:import-id state))
                   (or (nil? repo) (= repo (:repo state)))
                   (= graph-id (:graph-id state)))
      (throw (stale-import-ex-info repo graph-id import-id)))
    state))

(defn- upsert-addr-content!
  [^js db data]
  (.transaction
   db
   (fn [tx]
     (doseq [item data]
       (.exec tx #js {:sql "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses"
                      :bind item})))))

(defn import-rows-batch!
  [{:keys [rows-db]} rows]
  (when-not rows-db
    (throw (ex-info "missing import rows db"
                    {:type :db-sync/missing-field
                     :field :rows-db})))
  (let [data (map (fn [[addr content addresses]]
                    #js {:$addr addr
                         :$content content
                         :$addresses addresses})
                  rows)]
    (upsert-addr-content! rows-db data))
  (count rows))

(defn- <create-import-temp-db!
  [repo]
  (if-let [^js pool (worker-state/get-opfs-pool repo)]
    (p/let [path (str "/download-import-" (random-uuid) ".sqlite")
            ^js db (new (.-OpfsSAHPoolDb pool) path)]
      (common-sqlite/create-kvs-table! db)
      {:rows-db db
       :rows-path path})
    (fail-fast :db-sync/missing-field {:repo repo :field :opfs-pool})))

(defn- <ensure-import-rows-db!
  [{:keys [import-id repo rows-db] :as state}]
  (if rows-db
    (p/resolved state)
    (p/let [{:keys [rows-db rows-path]} (<create-import-temp-db! repo)]
      (swap! *import-state
             (fn [current]
               (if (= import-id (:import-id current))
                 (assoc current
                        :rows-db rows-db
                        :rows-path rows-path)
                 current)))
      (assoc state
             :rows-db rows-db
             :rows-path rows-path))))

(defn- datom->tx
  [{:keys [e a v]}]
  [:db/add e a v])

(defn- import-datoms-batch!
  [conn aes-key graph-e2ee? datoms]
  (p/let [datoms-batch (if graph-e2ee?
                         (sync-crypt/<decrypt-snapshot-datoms-batch aes-key datoms)
                         datoms)
          schema-tx-data (into [] (comp (filter #(= "db" (namespace (:a %))))
                                        (map datom->tx))
                               datoms-batch)
          regular-tx-data (into [] (comp (remove #(= "db" (namespace (:a %))))
                                         (map datom->tx))
                                datoms-batch)
          tx-data (into schema-tx-data regular-tx-data)]
    (when (seq tx-data)
      (d/transact! conn tx-data {:sync-download-graph? true}))))

(defn- schema-datom?
  [ident-eids schema-version-eid datom]
  (or (= schema-version-eid (:e datom))
      (and (contains? ident-eids (:e datom))
           (or (= :db/ident (:a datom))
               (= "db" (namespace (:a datom)))))))

(defn snapshot-datoms-in-import-order
  [conn]
  (let [db @conn
        schema-version-eid (some-> (d/entity db :logseq.kv/schema-version) :db/id)
        ident-eids (into #{}
                         (map :e)
                         (d/datoms db :avet :db/ident))
        schema-datom?* #(schema-datom? ident-eids schema-version-eid %)
        ordered-datoms (fn [pred]
                         (sequence
                          (comp (filter pred)
                                (map #(select-keys % [:e :a :v])))
                          (d/datoms db :eavt)))]
    (concat (ordered-datoms schema-datom?*)
            (ordered-datoms #(not (schema-datom?* %))))))

(defn- take-import-datoms-batch
  [datoms batch-size]
  (loop [batch (transient [])
         remaining (seq datoms)
         n 0]
    (if (or (nil? remaining)
            (>= n batch-size))
      [(persistent! batch) remaining]
      (recur (conj! batch (first remaining))
             (next remaining)
             (inc n)))))

(defn- <yield-next-tick
  []
  (js/Promise. (fn [resolve] (js/setTimeout resolve 0))))

(defn- log-import-progress!
  [graph-id import-id datoms-count]
  (when (pos? datoms-count)
    (let [{:keys [imported-datoms total-datoms]}
          (swap! *import-state
                 (fn [state]
                   (if (= import-id (:import-id state))
                     (update state :imported-datoms (fnil + 0) datoms-count)
                     state)))]
      (rtc-log-and-state/rtc-log :rtc.log/download
                                 {:sub-type :download-progress
                                  :graph-uuid graph-id
                                  :message (if (some? total-datoms)
                                             (str "Importing data " imported-datoms "/" total-datoms)
                                             (str "Importing data " imported-datoms))}))))

(defn- <replay-imported-rows!
  [{:keys [conn rows-db aes-key graph-e2ee? graph-id import-id]}]
  (if (nil? rows-db)
    (p/resolved nil)
    (let [source-storage (sync-temp-sqlite/new-temp-sqlite-storage rows-db)
          source-conn (common-sqlite/get-storage-conn source-storage db-schema/schema)]
      (p/loop [remaining (seq (snapshot-datoms-in-import-order source-conn))]
        (if (seq remaining)
          (let [[batch remaining'] (take-import-datoms-batch remaining snapshot-import-datoms-batch-size)]
            (p/let [_ (import-datoms-batch! conn aes-key graph-e2ee? batch)
                    _ (log-import-progress! graph-id import-id (count batch))
                    _ (<yield-next-tick)]
              (p/recur remaining')))
          (p/resolved nil))))))

(defn prepare-import!
  [repo reset? graph-id graph-e2ee? & [total-datoms]]
  (let [graph-e2ee? (if (nil? graph-e2ee?) true (true? graph-e2ee?))]
    (-> (p/let [close-db-f (require-thread-api-f! :thread-api/db-sync-close-db)
                unlink-db-f (require-thread-api-f! :thread-api/unsafe-unlink-db)
                invalidate-search-db-f (require-thread-api-f! :thread-api/db-sync-invalidate-search-db)
                create-or-open-db-f (require-thread-api-f! :thread-api/create-or-open-db)
                _ (when-let [state @*import-state]
                    (close-import-state! state)
                    (close-db-f (:repo state)))
                _ (reset! *import-state nil)
                _ (when reset? (close-db-f repo))
                _ (when reset? (unlink-db-f repo))
                _ (when reset? (invalidate-search-db-f repo))
                import-id (str (random-uuid))
                aes-key (when graph-e2ee?
                          (sync-crypt/<fetch-graph-aes-key-for-download graph-id))
                _ (when (and graph-e2ee? (nil? aes-key))
                    (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
                _ (create-or-open-db-f repo {:close-other-db? true
                                             :sync-download-graph? true})
                conn (worker-state/get-datascript-conn repo)
                _ (when-not conn
                    (fail-fast :db-sync/missing-field {:repo repo :field :datascript-conn}))]
          (reset! *import-state {:aes-key aes-key
                                 :conn conn
                                 :graph-e2ee? graph-e2ee?
                                 :graph-id graph-id
                                 :import-id import-id
                                 :imported-datoms 0
                                 :rows-db nil
                                 :rows-imported? false
                                 :rows-path nil
                                 :repo repo
                                 :total-datoms total-datoms})
          {:import-id import-id})
        (p/catch (fn [error]
                   (reset! *import-state nil)
                   (throw error))))))

(defn import-rows-chunk!
  [rows graph-id import-id]
  (-> (p/let [state (require-import-state! nil graph-id import-id)
              state (<ensure-import-rows-db! state)
              _ (import-rows-batch! state rows)
              _ (swap! *import-state
                       (fn [current]
                         (if (= import-id (:import-id current))
                           (assoc current :rows-imported? true)
                           current)))]
        true)
      (p/catch (fn [error]
                 (when-not (= :db-sync/stale-import (:type (ex-data error)))
                   (clear-import-state! import-id))
                 (throw error)))))

(defn finalize-import!
  [repo graph-id remote-tx import-id]
  (-> (p/let [state (require-import-state! repo graph-id import-id)
              _ (when (:rows-imported? state)
                  (<replay-imported-rows! state))
              result (complete-datoms-import! repo graph-id remote-tx)
              _ (reset! *import-state nil)]
        result)
      (p/catch (fn [error]
                 (when-not (= :db-sync/stale-import (:type (ex-data error)))
                   (clear-import-state! import-id))
                 (throw error)))))

(defn download-graph-by-id!
  [repo graph-id graph-e2ee?]
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if (and (seq repo) (seq graph-id) (seq base))
      (p/let [log-f (fn [payload]
                      (rtc-log-and-state/rtc-log :rtc.log/download payload))
              _ (log-f {:sub-type :download-progress
                        :graph-uuid graph-id
                        :message "Preparing graph snapshot download"})
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
              _ (log-f {:sub-type :download-progress
                        :graph-uuid graph-id
                        :message "Start downloading graph snapshot"})]
        (when-not (.-ok resp)
          (throw (ex-info "snapshot download failed"
                          {:repo repo
                           :status (.-status resp)})))
        (let [import-id* (atom nil)
              ensure-import! (fn []
                               (if-let [import-id @import-id*]
                                 (p/resolved import-id)
                                 (p/let [{:keys [import-id]} (prepare-import! repo true graph-id graph-e2ee?)]
                                   (reset! import-id* import-id)
                                   import-id)))]
          (p/let [_ (<stream-snapshot-row-batches!
                     resp
                     25000
                     (fn [rows]
                       (p/let [import-id (ensure-import!)]
                         (import-rows-chunk! rows graph-id import-id))))
                  _ (log-f {:sub-type :download-completed
                            :graph-uuid graph-id
                            :message "Graph snapshot downloaded"})
                  _ (when-let [import-id @import-id*]
                      (finalize-import! repo graph-id remote-tx import-id))]
            true)))
      (p/rejected (ex-info "db-sync missing graph download info"
                           {:repo repo
                            :graph-id graph-id
                            :base base})))))
