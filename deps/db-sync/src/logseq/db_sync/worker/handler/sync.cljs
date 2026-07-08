(ns logseq.db-sync.worker.handler.sync
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.batch :as batch]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.tx-sanitize :as tx-sanitize]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.routes.sync :as sync-routes]
            [logseq.db-sync.worker.ws :as ws]
            [promesa.core :as p]))

(def ^:private snapshot-download-batch-size 10000)
;; (def ^:private snapshot-cache-control "private, max-age=300")
(def ^:private snapshot-content-type "application/transit+json")
(def ^:private snapshot-content-encoding "gzip")
(def ^:private snapshot-uploading-meta-key :snapshot-uploading?)
(def ^:private large-tx-min-items 500)
(def ^:private large-tx-max-chunk-items 500)
;; 10m
;; (def ^:private snapshot-multipart-part-size (* 10 1024 1024))

(defn parse-int [value]
  (when (some? value)
    (let [n (js/parseInt value 10)]
      (when-not (js/isNaN n)
        n))))

(defn- ensure-schema! [^js self]
  (when-not (true? (.-schema-ready self))
    (try
      (storage/init-schema! (.-sql self))
      (catch :default e
        ;; Schema may already exist. If DDL writes are rejected, probe
        ;; existing tables before deciding this is a fatal error.
        (try
          (common/sql-exec (.-sql self) "select 1 from kvs limit 1")
          (common/sql-exec (.-sql self) "select 1 from tx_log limit 1")
          (common/sql-exec (.-sql self) "select 1 from sync_meta limit 1")
          (catch :default _
            (throw e)))))
    (set! (.-schema-ready self) true)))

(defn- ensure-conn! [^js self]
  (ensure-schema! self)
  (when-not (.-conn self)
    (set! (.-conn self)
          (storage/open-conn (.-sql self)))))

(defn t-now [^js self]
  (ensure-schema! self)
  (storage/get-t (.-sql self)))

(defn current-checksum [^js self]
  (ensure-conn! self)
  (storage/get-checksum (.-sql self)))

(defn snapshot-upload-finished? [^js self]
  (ensure-schema! self)
  (not= "true" (storage/get-meta (.-sql self) snapshot-uploading-meta-key)))

(defn <ready-for-sync?
  [^js self graph-id]
  (if-not (snapshot-upload-finished? self)
    (p/resolved false)
    (if-let [db (some-> self .-env (aget "DB"))]
      (p/let [graph-ready-for-use? (index/<graph-ready-for-use? db graph-id)]
        (not= false graph-ready-for-use?))
      (p/resolved true))))

(defn- <set-graph-ready-for-use!
  [^js self graph-id graph-ready-for-use?]
  (if-let [db (some-> self .-env (aget "DB"))]
    (p/let [result (index/<graph-ready-for-use-set! db graph-id graph-ready-for-use?)
            meta (some-> result (aget "meta"))
            rows-affected (or (some-> meta (aget "changes"))
                              (some-> meta (aget "rows_written"))
                              (some-> result (aget "changes"))
                              (some-> result (aget "rows_written")))]
      (when (or (nil? result)
                (false? (some-> result (aget "success"))))
        (throw (ex-info "failed to persist graph_ready_for_use"
                        {:type :db-sync/graph-ready-for-use-set-failed
                         :graph-id graph-id
                         :graph-ready-for-use? graph-ready-for-use?
                         :result result})))
      (when (and (number? rows-affected)
                 (<= rows-affected 0))
        (throw (ex-info "graph_ready_for_use update affected no rows"
                        {:type :db-sync/graph-ready-for-use-set-no-rows
                         :graph-id graph-id
                         :graph-ready-for-use? graph-ready-for-use?
                         :rows-affected rows-affected
                         :result result})))
      result)
    (p/rejected (ex-info "missing DB binding for graph_ready_for_use update"
                         {:type :db-sync/missing-db-binding
                          :graph-id graph-id
                          :graph-ready-for-use? graph-ready-for-use?}))))

(defn- import-snapshot-rows!
  [sql table rows]
  (when (seq rows)
    (doseq [batch (batch/rows->insert-batches table rows nil)]
      (let [sql-str (:sql batch)
            args (:args batch)]
        (apply common/sql-exec sql sql-str args)))))

(defn- reset-import!
  [sql]
  (common/sql-exec sql "delete from kvs")
  (common/sql-exec sql "delete from tx_log")
  (common/sql-exec sql "delete from sync_meta")
  (storage/set-t! sql 0))

(defn- graph-id-from-sync-path
  [^js url]
  (let [path (.-pathname url)
        prefix "/sync/"]
    (when (string/starts-with? path prefix)
      (let [rest-path (subs path (count prefix))
            slash-idx (or (string/index-of rest-path "/") -1)
            graph-id (if (neg? slash-idx)
                       rest-path
                       (subs rest-path 0 slash-idx))]
        (when (seq graph-id)
          graph-id)))))

(defn graph-id-from-request [request]
  (let [header-id (.get (.-headers request) "x-graph-id")
        url (js/URL. (.-url request))
        param-id (.get (.-searchParams url) "graph-id")
        graph-id (or header-id param-id (graph-id-from-sync-path url))]
    (when (seq graph-id)
      graph-id)))

;; (defn- snapshot-key [graph-id snapshot-id]
;;   (str graph-id "/" snapshot-id ".snapshot"))

;; (defn- snapshot-url [request graph-id snapshot-id]
;;   (let [url (js/URL. (.-url request))]
;;     (str (.-origin url) "/assets/" graph-id "/" snapshot-id ".snapshot")))

(defn- snapshot-stream-url [request graph-id]
  (let [url (js/URL. (.-url request))]
    (str (.-origin url) "/sync/" graph-id "/snapshot/stream")))

(defn- maybe-decompress-stream [stream encoding]
  (if (and (= encoding snapshot-content-encoding) (exists? js/DecompressionStream))
    (.pipeThrough stream (js/DecompressionStream. "gzip"))
    stream))

(defn- maybe-compress-stream [stream]
  (.pipeThrough stream (js/CompressionStream. snapshot-content-encoding)))

(defn- snapshot-stream-gzip-enabled?
  [^js self]
  (let [v (some-> self .-env (aget "DB_SYNC_SNAPSHOT_STREAM_GZIP"))]
    (cond
      (nil? v) true
      (false? v) false
      (string? v) (not (contains? #{"false" "0" "off" "no"}
                                   (string/lower-case v)))
      :else (boolean v))))

;; (defn- <buffer-stream
;;   [stream]
;;   (p/let [resp (js/Response. stream)
;;           buf (.arrayBuffer resp)]
;;     buf))

;; (defn- ->uint8 [data]
;;   (cond
;;     (instance? js/Uint8Array data) data
;;     (instance? js/ArrayBuffer data) (js/Uint8Array. data)
;;     :else (js/Uint8Array. data)))

;; (defn- concat-uint8 [^js a ^js b]
;;   (cond
;;     (nil? a) b
;;     (nil? b) a
;;     :else
;;     (let [out (js/Uint8Array. (+ (.-byteLength a) (.-byteLength b)))]
;;       (.set out a 0)
;;       (.set out b (.-byteLength a))
;;       out)))

(defn- frame-bytes
  [^js data]
  (let [len (.-byteLength data)
        out (js/Uint8Array. (+ 4 len))
        view (js/DataView. (.-buffer out))]
    (.setUint32 view 0 len false)
    (.set out data 4)
    out))

(defn- fetch-snapshot-kvs-rows
  [sql last-addr limit]
  (let [rows (common/get-sql-rows
              (common/sql-exec sql
                               "select addr, content, addresses from kvs where addr > ? order by addr asc limit ?"
                               last-addr
                               limit))]
    (mapv (fn [row]
            [(aget row "addr")
             (aget row "content")
             (aget row "addresses")])
          rows)))

(defn- snapshot-row-count
  [sql]
  (if-let [row (first (common/get-sql-rows
                       (common/sql-exec sql "select count(*) as row_count from kvs")))]
    (or (aget row "row_count") 0)
    0))

(defn- snapshot-export-stream [^js self]
  (ensure-schema! self)
  (let [sql (.-sql self)
        last-addr (volatile! -1)]
    (js/ReadableStream.
     (clj->js
      {:pull (fn [controller]
               (let [batch (fetch-snapshot-kvs-rows sql @last-addr snapshot-download-batch-size)]
                 (if (empty? batch)
                   (.close controller)
                   (let [payload (snapshot/encode-rows batch)]
                     (vreset! last-addr (first (peek batch)))
                     (.enqueue controller (frame-bytes payload))))))}))))

;; (defn- upload-multipart!
;;   [^js bucket key stream opts]
;;   (p/let [^js upload (.createMultipartUpload bucket key opts)]
;;     (let [reader (.getReader stream)]
;;       (-> (p/loop [buffer nil
;;                    part-number 1
;;                    parts []]
;;             (p/let [chunk (.read reader)]
;;               (if (.-done chunk)
;;                 (cond
;;                   (and buffer (pos? (.-byteLength buffer)))
;;                   (p/let [^js resp (.uploadPart upload part-number buffer)
;;                           parts (conj parts {:partNumber part-number :etag (.-etag resp)})]
;;                     (p/let [_ (.complete upload (clj->js parts))]
;;                       {:ok true}))

;;                   (seq parts)
;;                   (p/let [_ (.complete upload (clj->js parts))]
;;                     {:ok true})

;;                   :else
;;                   (p/let [_ (.abort upload)]
;;                     (.put bucket key (js/Uint8Array. 0) opts)))
;;                 (let [value (.-value chunk)
;;                       buffer (concat-uint8 buffer (->uint8 value))]
;;                   (if (>= (.-byteLength buffer) snapshot-multipart-part-size)
;;                     (let [part (.slice buffer 0 snapshot-multipart-part-size)
;;                           rest-parts (.slice buffer snapshot-multipart-part-size (.-byteLength buffer))]
;;                       (p/let [^js resp (.uploadPart upload part-number part)
;;                               parts (conj parts {:partNumber part-number :etag (.-etag resp)})]
;;                         (p/recur rest-parts (inc part-number) parts)))
;;                     (p/recur buffer part-number parts))))))
;;           (p/catch (fn [error]
;;                      (.abort upload)
;;                      (throw error)))))))

(declare import-snapshot!)
(defn- import-snapshot-stream! [^js self stream reset?]
  (let [reader (.getReader stream)
        reset-pending? (volatile! reset?)
        total-count (volatile! 0)]
    (p/let [buffer nil]
      (p/catch
       (p/loop [buffer buffer]
         (p/let [chunk (.read reader)]
           (if (.-done chunk)
             (let [rows (snapshot/finalize-framed-buffer buffer)
                   rows-count (count rows)
                   reset? (and @reset-pending? true)]
               (when (or reset? (seq rows))
                 (import-snapshot! self rows reset?)
                 (vreset! reset-pending? false))
               (vswap! total-count + rows-count)
               @total-count)
             (let [value (.-value chunk)
                   {:keys [rows buffer]} (snapshot/parse-framed-chunk buffer value)
                   rows-count (count rows)
                   reset? (boolean (and @reset-pending? (seq rows)))]
               (when (seq rows)
                 (import-snapshot! self rows reset?)
                 (vreset! reset-pending? false))
               (vswap! total-count + rows-count)
               (p/recur buffer)))))
       (fn [error]
         (throw error))))))

(defn pull-response [^js self since]
  (let [sql (.-sql self)
        txs (storage/fetch-tx-since sql since)
        checksum (current-checksum self)]
    (cond-> {:type "pull/ok"
             :t (t-now self)
             :txs txs}
      (string? checksum) (assoc :checksum checksum))))

(defn- block-uuid-lookup-ref
  [entity-id]
  (when (and (sequential? entity-id)
             (= :block/uuid (first entity-id))
             (uuid? (second entity-id)))
    (second entity-id)))

(defn- missing-block-uuids-from-error
  [error]
  (loop [e error
         result []]
    (if e
      (let [missing-uuid (block-uuid-lookup-ref (:entity-id (ex-data e)))]
        (recur (ex-cause e)
               (cond-> result
                 missing-uuid (conj missing-uuid))))
      (-> result distinct vec))))

(def ^:private delete-outliner-ops
  #{:delete-blocks
    :delete-page})

(defn- request-context->tx-meta
  [{:keys [graph-id client-revision username]}]
  (cond-> {}
    graph-id (assoc :graph-id graph-id)
    client-revision (assoc :client-revision client-revision)
    username (assoc :username username)))

(defn- tempid?
  [value]
  (or (and (integer? value) (neg? value))
      (string? value)))

(defn- ref-attr?
  [db attr]
  (= :db.type/ref (:db/valueType (d/entity db attr))))

(defn- tx-item-tempids
  [db item]
  (cond
    (and (map? item) (tempid? (:db/id item)))
    #{(:db/id item)}

    (and (vector? item)
         (contains? #{:db/add :db/retract :db/cas :db.fn/cas} (first item))
         (<= 4 (count item)))
    (let [[_op entity attr value] item]
      (cond-> #{}
        (tempid? entity)
        (conj entity)
        (and (ref-attr? db attr)
             (tempid? value))
        (conj value)))

    (and (vector? item)
         (contains? #{:db/retractEntity :db.fn/retractEntity} (first item))
         (= 2 (count item))
         (tempid? (second item)))
    #{(second item)}

    :else
    #{}))

(defn- merge-ranges
  [ranges]
  (loop [remaining (sort-by first ranges)
         merged []]
    (if-let [[start end] (first remaining)]
      (if-let [[prev-start prev-end] (peek merged)]
        (if (<= start prev-end)
          (recur (next remaining)
                 (conj (pop merged) [prev-start (max prev-end end)]))
          (recur (next remaining)
                 (conj merged [start end])))
        (recur (next remaining) [[start end]]))
      merged)))

(defn- tempid-ranges
  [db tx-data]
  (let [ranges-by-tempid
        (reduce-kv
         (fn [acc idx item]
           (reduce (fn [acc* tempid]
                     (update acc* tempid
                             (fn [[start end]]
                               [(if (some? start) (min start idx) idx)
                                (if (some? end) (max end idx) idx)])))
                   acc
                   (tx-item-tempids db item)))
         {}
         tx-data)]
    (merge-ranges (vals ranges-by-tempid))))

(defn- tempid-range-by-start
  [db tx-data]
  (let [ranges (tempid-ranges db tx-data)
        range-by-start (into {} (map (fn [[start end]] [start end]) ranges))]
    range-by-start))

(defn- next-ordered-tx-group
  [tx-data range-by-start idx]
  (if-let [end (get range-by-start idx)]
    [(inc end) (subvec tx-data idx (inc end))]
    [(inc idx) [(nth tx-data idx)]]))

(defn- add-group-to-chunk
  [items group]
  (into items group))

(defn- reduce-ordered-tx-chunks
  [db f init tx-data]
  (let [tx-data (vec tx-data)
        item-count (count tx-data)
        range-by-start (tempid-range-by-start db tx-data)]
    (loop [idx 0
           chunk []
           acc init]
      (if (< idx item-count)
        (let [[next-idx group] (next-ordered-tx-group tx-data range-by-start idx)
              next-count (+ (count chunk) (count group))]
          (if (and (seq chunk)
                   (> next-count large-tx-max-chunk-items))
            (recur idx [] (f acc chunk))
            (recur next-idx (add-group-to-chunk chunk group) acc)))
        (cond-> acc
          (seq chunk) (f chunk))))))

(defn- large-tx?
  [tx-data]
  (>= (count tx-data) large-tx-min-items))

(defn- import-snapshot! [^js self rows reset?]
  (let [sql (.-sql self)]
    (ensure-schema! self)
    (when reset?
      (set! (.-conn self) nil)
      (reset-import! sql))
    (import-snapshot-rows! sql "kvs" rows)))

(defn- apply-client-tx-meta
  [request-context outliner-op]
  (cond-> (merge {:op :apply-client-tx}
                 (request-context->tx-meta request-context))
    outliner-op
    (assoc :outliner-op outliner-op)
    (= outliner-op :db-migrate)
    (assoc :db-migrate? true
           :skip-validate-db? true)))

(defn- apply-large-tx-entry!
  [self conn tx-data {:keys [tx-id outliner-op]} request-context]
  (let [db-before @conn
        tx-meta (apply-client-tx-meta request-context outliner-op)
        chunk-count (volatile! 0)]
    (log/info :db-sync/apply-large-tx-entry-start
              {:graph-id (:graph-id request-context)
               :tx-id tx-id
               :outliner-op outliner-op
               :tx-count (count tx-data)
               :max-chunk-items large-tx-max-chunk-items})
    (try
      ((if-let [sql (when self (.-sql ^js self))]
         #(storage/with-sql-transaction! sql %)
         (fn [f] (f)))
       (fn []
         (reduce-ordered-tx-chunks
          db-before
          (fn [_ chunk]
            (vswap! chunk-count inc)
            (ldb/transact! conn chunk tx-meta)
            nil)
          nil
          tx-data)))
      (log/info :db-sync/apply-large-tx-entry-done
                {:graph-id (:graph-id request-context)
                 :tx-id tx-id
                 :outliner-op outliner-op
                 :tx-count (count tx-data)
                 :chunk-count @chunk-count})
      true
      (catch :default error
        (log/info :db-sync/apply-large-tx-entry-failed
                  {:graph-id (:graph-id request-context)
                   :tx-id tx-id
                   :outliner-op outliner-op
                   :tx-count (count tx-data)
                   :chunk-count @chunk-count})
        (reset! conn db-before)
        (throw error)))))

(defn- sanitize-tx-entry
  [db {:keys [tx outliner-op] :as tx-entry}]
  (let [tx-data (tx-sanitize/sanitize-tx db
                                         (protocol/transit->tx tx)
                                         {:drop-missing-retract-ops? (or (= outliner-op :fix)
                                                                         (contains? delete-outliner-ops outliner-op))
                                          :drop-ops-targeting-retracted-entities? (contains? delete-outliner-ops
                                                                                             outliner-op)
                                          :retract-touched-descendants? (contains? delete-outliner-ops outliner-op)})]
    {:tx-data tx-data
     :tx-entry tx-entry}))

(defn- apply-tx-entry!
  ([conn tx-entry]
   (apply-tx-entry! nil conn tx-entry nil))
  ([self conn {:keys [outliner-op] :as tx-entry} request-context]
   (let [sanitized (sanitize-tx-entry @conn tx-entry)
         tx-data (:tx-data sanitized)
         sanitized-entry (:tx-entry sanitized)]
     (if (seq tx-data)
       (try
         (if (and (not= outliner-op :db-migrate)
                  (large-tx? tx-data))
           (apply-large-tx-entry! self conn tx-data sanitized-entry request-context)
           (do
             (ldb/transact! conn tx-data (apply-client-tx-meta request-context outliner-op))
             true))
         (catch :default e
           ;; Rebase/fix txs are inferred from local history and can become stale
           ;; when concurrent remote edits remove referenced entities before upload.
           ;; Treat stale :entity-id/missing rebases/fixes as no-op so sync can continue.
           (if (and (contains? #{:rebase :fix} outliner-op)
                    (= :entity-id/missing (:error (ex-data e))))
             (do
               (log/warn :db-sync/drop-stale-rebase-tx
                         {:outliner-op outliner-op
                          :tx-data tx-data
                          :error (str e)})
               false)
             (throw e))))
       false))))

(defn- apply-tx! [^js self tx-entries request-context]
  (let [sql (.-sql self)]
    (ensure-conn! self)
    (let [conn (.-conn self)]
      (loop [remaining tx-entries
             applied? false
             successful-tx-ids []]
        (if-let [tx-entry (first remaining)]
          (let [tx-id (:tx-id tx-entry)
                applied-entry? (try
                                 (boolean (apply-tx-entry! self conn tx-entry request-context))
                                 (catch :default e
                                   (log/error :db-sync/transact-failed e)
                                   (let [missing-block-uuids (missing-block-uuids-from-error e)]
                                     (throw (ex-info "tx entry apply failed"
                                                     (cond-> {:type :db-sync/tx-entry-failed
                                                              :successful-tx-ids successful-tx-ids}
                                                       tx-id (assoc :failed-tx-id tx-id)
                                                       (seq missing-block-uuids)
                                                       (assoc :missing-block-uuids missing-block-uuids))
                                                     e)))))
                next-successful-tx-ids (cond-> successful-tx-ids
                                         tx-id (conj tx-id))]
            (recur (next remaining)
                   (or applied? applied-entry?)
                   next-successful-tx-ids))
          (let [new-t (storage/get-t sql)]
            {:t new-t
             :applied? applied?
             :successful-tx-ids successful-tx-ids}))))))

(defn handle-tx-batch!
  ([^js self sender txs t-before]
   (handle-tx-batch! self sender txs t-before nil))
  ([^js self sender txs t-before request-context]
   (let [current-t (t-now self)]
     (cond
       (not (snapshot-upload-finished? self))
       {:type "tx/reject"
        :reason "snapshot upload in progress"
        :t current-t}

       (or (not (number? t-before)) (neg? t-before))
       {:type "tx/reject"
        :reason "invalid t-before"}

       (not= t-before current-t)
       {:type "tx/reject"
        :reason "stale"
        :t current-t}

       :else
       (if (seq txs)
         (try
           (let [{:keys [t applied?]} (apply-tx! self txs request-context)
                 checksum (current-checksum self)]
             (when applied?
               ;; Broadcast once per processed batch after tx-log/checksum settle.
               (ws/broadcast! self sender {:type "changed" :t t}))
             (cond-> {:type "tx/batch/ok"
                      :t t}
               (string? checksum) (assoc :checksum checksum)))
           (catch :default e
             (let [new-t (t-now self)
                   checksum (current-checksum self)
                   {:keys [successful-tx-ids failed-tx-id missing-block-uuids]}
                   (ex-data e)]
               (log/error :db-sync/transact-failed e)
               (when (> new-t current-t)
                 ;; Broadcast once when partial batch writes advanced the graph.
                 (ws/broadcast! self sender {:type "changed" :t new-t}))
               (cond-> {:type "tx/reject"
                        :reason "db transact failed"
                        :error-detail (str e)
                        :t new-t}
                 (seq successful-tx-ids) (assoc :success-tx-ids successful-tx-ids)
                 failed-tx-id (assoc :failed-tx-id failed-tx-id)
                 (seq missing-block-uuids) (assoc :missing-block-uuids missing-block-uuids)
                 (string? checksum) (assoc :checksum checksum)))))
         {:type "tx/reject"
          :reason "empty tx data"})))))

(defn- handle-sync-pull
  [^js self ^js url]
  (let [raw-since (.get (.-searchParams url) "since")
        since (if (some? raw-since) (parse-int raw-since) 0)
        graph-id (.get (.-searchParams url) "graph-id")]
    (if (or (and (some? raw-since) (not (number? since))) (neg? since))
      (http/bad-request "invalid since")
      (p/let [ready-for-sync? (<ready-for-sync? self graph-id)]
        (if-not ready-for-sync?
          (http/error-response "graph not ready" 409)
          (http/json-response :sync/pull (pull-response self since)))))))

(defn- normalize-diagnostic-block
  [{:keys [block/uuid block/parent block/page block/order] :as block}]
  (cond-> block
    uuid (assoc :block/uuid (str uuid))
    parent (assoc :block/parent (str parent))
    page (assoc :block/page (str page))
    order (assoc :block/order order)))

(defn- checksum-diagnostics-response
  [^js self]
  (ensure-conn! self)
  (-> (sync-checksum/recompute-checksum-diagnostics @(.-conn self))
      (update :blocks (fn [blocks]
                        (mapv normalize-diagnostic-block blocks)))))

(defn- handle-sync-checksum-diagnostics
  [^js self request]
  (let [graph-id (graph-id-from-request request)]
    (if (not (seq graph-id))
      (http/bad-request "missing graph id")
      (p/let [ready-for-sync? (<ready-for-sync? self graph-id)]
        (if-not ready-for-sync?
          (http/error-response "graph not ready" 409)
          (http/json-response :sync/checksum-diagnostics
                              (checksum-diagnostics-response self)))))))

(defn- handle-sync-snapshot-stream
  [^js self request]
  (let [graph-id (graph-id-from-request request)]
    (if (not (seq graph-id))
      (http/bad-request "missing graph id")
      (let [gzip? (and (snapshot-stream-gzip-enabled? self)
                       (exists? js/CompressionStream))
            stream (cond-> (snapshot-export-stream self)
                     gzip?
                     (maybe-compress-stream))
            row-count (snapshot-row-count (.-sql self))
            headers (cond-> {"content-type" snapshot-content-type}
                      gzip?
                      (assoc "content-encoding" snapshot-content-encoding))]
        (js/Response. stream
                      #js {:status 200
                           :headers (js/Object.assign
                                     (clj->js headers)
                                     #js {"x-snapshot-row-count" (str row-count)}
                                     (common/cors-headers))})))))

(defn- handle-sync-snapshot-download
  [^js self request]
  (let [graph-id (graph-id-from-request request)]
    (cond
      (not (seq graph-id))
      (http/bad-request "missing graph id")

      :else
      (p/let [ready-for-sync? (<ready-for-sync? self graph-id)]
        (if-not ready-for-sync?
          (http/error-response "graph not ready" 409)
          (let [key (str "stream/" graph-id ".snapshot")
                url (snapshot-stream-url request graph-id)
                content-encoding (when (and (snapshot-stream-gzip-enabled? self)
                                            (exists? js/CompressionStream))
                                   snapshot-content-encoding)]
            (http/json-response :sync/snapshot-download
                                (cond-> {:ok true
                                         :key key
                                         :url url}
                                  content-encoding
                                  (assoc :content-encoding content-encoding)))))))))

(defn- handle-sync-admin-reset
  [^js self]
  (let [^js state (.-state self)
        ^js storage (.-storage state)
        delete-all (.-deleteAll storage)
        delete-alarm (.-deleteAlarm storage)]
    (doseq [^js ws (.getWebSockets state)]
      (.close ws 1000 "graph deleted"))
    (p/let [_ (when (fn? delete-alarm)
                (.deleteAlarm storage))]
      (if (fn? delete-all)
        (p/let [_ (.deleteAll storage)]
          (set! (.-schema-ready self) false)
          (set! (.-conn self) nil)
          (http/json-response :sync/admin-reset {:ok true}))
        (do
          (common/sql-exec (.-sql self) "drop table if exists kvs")
          (common/sql-exec (.-sql self) "drop table if exists tx_log")
          (common/sql-exec (.-sql self) "drop table if exists sync_meta")
          (storage/init-schema! (.-sql self))
          (set! (.-schema-ready self) true)
          (set! (.-conn self) nil)
          (http/json-response :sync/admin-reset {:ok true}))))))

(defn- handle-sync-tx-batch
  [^js self request]
  (.then (common/read-json request)
         (fn [result]
           (if (nil? result)
             (http/bad-request "missing body")
             (let [body (js->clj result :keywordize-keys true)
                   body (http/coerce-http-request :sync/tx-batch body)
                   graph-id (graph-id-from-request request)]
               (if (nil? body)
                 (http/bad-request "invalid tx")
                 (let [{:keys [client-revision txs t-before]} body
                       t-before (parse-int t-before)]
                   (if (sequential? txs)
                     (p/let [ready-for-sync? (<ready-for-sync? self graph-id)]
                       (if-not ready-for-sync?
                         (http/error-response "graph not ready" 409)
                         (http/json-response :sync/tx-batch
                                             (handle-tx-batch! self nil txs t-before
                                                               {:graph-id graph-id
                                                                :client-revision client-revision}))))
                     (http/bad-request "invalid tx")))))))))

(defn- parse-reset-param
  [value]
  (if (nil? value)
    true
    (not (contains? #{"false" "0"} value))))

(defn- parse-finished-param
  [value]
  (contains? #{"true" "1"} value))

(defn- sqlite-too-big-error?
  [error]
  (let [message (-> (or (ex-message error)
                        (some-> error .-message)
                        (str error))
                    string/lower-case)]
    (or (string/includes? message "sqlite_toobig")
        (string/includes? message "string or blob too big")
        (string/includes? message "statement too long"))))

(defn- handle-sync-snapshot-upload
  [^js self request url]
  (let [graph-id (graph-id-from-request request)
        reset-param (.get (.-searchParams url) "reset")
        reset? (parse-reset-param reset-param)
        finished-param (.get (.-searchParams url) "finished")
        finished? (parse-finished-param finished-param)
        checksum-param (.get (.-searchParams url) "checksum")
        req-encoding (.get (.-headers request) "content-encoding")]
    (cond
      (not (seq graph-id))
      (http/bad-request "missing graph id")

      (nil? (.-body request))
      (http/bad-request "missing body")

      :else
      (let [stream (.-body request)
            encoding (or req-encoding "")]
        (if (and (= encoding snapshot-content-encoding)
                 (not (exists? js/DecompressionStream)))
          (http/error-response "gzip not supported" 500)
          (p/catch
           (p/let [_ (ensure-schema! self)
                   _ (when reset?
                       (storage/set-meta! (.-sql self) snapshot-uploading-meta-key true))
                   _ (when reset?
                       (<set-graph-ready-for-use! self graph-id false))
                   stream (maybe-decompress-stream stream encoding)
                   count (import-snapshot-stream! self stream reset?)
                   _ (when finished?
                       (storage/set-meta! (.-sql self) snapshot-uploading-meta-key false))
                   _ (when finished?
                       (when (seq checksum-param)
                         (storage/set-initial-checksum! (.-sql self) checksum-param)))
                   _ (when finished?
                       (<set-graph-ready-for-use! self graph-id true))]
             (http/json-response :sync/snapshot-upload {:ok true
                                                        :count count}))
           (fn [error]
             (if (sqlite-too-big-error? error)
               (http/error-response "snapshot row too large" 413)
               (throw error)))))))))

(defn handle [{:keys [^js self request url route]}]
  (case (:handler route)
    :sync/health
    (http/json-response :sync/health {:ok true})

    :sync/pull
    (handle-sync-pull self url)

    :sync/checksum-diagnostics
    (handle-sync-checksum-diagnostics self request)

    :sync/snapshot-stream
    (handle-sync-snapshot-stream self request)

    :sync/snapshot-download
    (handle-sync-snapshot-download self request)

    :sync/admin-reset
    (handle-sync-admin-reset self)

    :sync/tx-batch
    (handle-sync-tx-batch self request)

    :sync/snapshot-upload
    (handle-sync-snapshot-upload self request url)

    (http/not-found)))

(defn- strip-sync-prefix [path]
  (if (string/starts-with? path "/sync/")
    (let [rest-path (subs path (count "/sync/"))
          slash-idx (string/index-of rest-path "/")]
      (if (neg? slash-idx)
        "/"
        (subs rest-path slash-idx)))
    path))

(defn handle-http [^js self request]
  (letfn [(with-cors-error [resp]
            (if (instance? js/Promise resp)
              (.catch resp
                      (fn [e]
                        (log/error :db-sync/http-error {:error e})
                        (common/json-response
                         {:error "server error"
                          :debug-message (str e)
                          :debug-stack (when (instance? js/Error e) (.-stack e))}
                         500)))
              resp))]
    (try
      (let [url (js/URL. (.-url request))
            raw-path (.-pathname url)
            path (strip-sync-prefix raw-path)
            method (.-method request)]
        (with-cors-error
          (cond
            (= method "OPTIONS")
            (common/options-response)

            :else
            (if-let [route (sync-routes/match-route method path)]
              (handle {:self self
                       :request request
                       :url url
                       :route route})
              (http/not-found)))))
      (catch :default e
        (log/error :db-sync/http-error {:error e})
        (common/json-response
         {:error "server error"
          :debug-message (str e)
          :debug-stack (when (instance? js/Error e) (.-stack e))}
         500)))))
