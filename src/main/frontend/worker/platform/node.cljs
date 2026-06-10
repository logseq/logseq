(ns frontend.worker.platform.node
  "Node.js platform adapter for db-worker."
  (:require ["fs" :as node-fs]
            ["fs/promises" :as fs]
            ["node:sqlite" :as node-sqlite]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [cognitect.transit :as transit]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.db.sqlite.backup :as sqlite-backup]
            [promesa.core :as p]
            ["keytar" :as keytar]))

(defn- resolve-database-sync-ctor
  []
  (or (gobj/get node-sqlite "DatabaseSync")
      (some-> (gobj/get node-sqlite "default")
              (gobj/get "DatabaseSync"))
      (let [default-export (gobj/get node-sqlite "default")]
        (when (fn? default-export)
          default-export))
      (throw (ex-info "node:sqlite DatabaseSync constructor missing"
                      {:module-keys (js->clj (js/Object.keys node-sqlite))}))))

(def ^:private DatabaseSync
  (resolve-database-sync-ctor))

(defn- macos?
  []
  (= "darwin" (.-platform js/process)))

(defn- macos-arm64?
  []
  (and (macos?)
       (= "arm64" (.-arch js/process))))

(defn- expand-home
  [path]
  (if (string/starts-with? path "~")
    (node-path/join (.homedir os) (subs path 1))
    path))

(defn- ensure-dir!
  [dir]
  (fs/mkdir dir #js {:recursive true}))

(defn- strip-leading-slash
  [path]
  (string/replace-first path #"^/" ""))

(defn- repo-dir
  [data-dir repo]
  (db-lock/repo-dir data-dir repo))

(defn- pool-path
  [^js pool path]
  (node-path/join (.-repoDir pool) (strip-leading-slash path)))

(defn- path-under-data-dir
  [data-dir path]
  (let [expanded-path (expand-home path)]
    (if (node-path/isAbsolute expanded-path)
      expanded-path
      (node-path/join data-dir expanded-path))))

(defn- ->buffer
  [data]
  (cond
    (instance? js/Buffer data) data
    (instance? js/ArrayBuffer data) (js/Buffer.from data)
    (and (some? data) (some? (.-buffer data))) (js/Buffer.from (.-buffer data))
    :else (js/Buffer.from (str data))))

(def ^:private backup-root-dir-name "backup")

(defn- list-graphs
  [data-dir]
  (let [dir? #(and % (.isDirectory %))]
    (p/let [entries (fs/readdir data-dir #js {:withFileTypes true})
            db-dirs (->> entries
                         (filter dir?))
            graph-names (map (fn [dirent]
                               (db-lock/decode-canonical-graph-dir-key (.-name dirent)))
                             db-dirs)]
      (->> graph-names
           (remove #(or (= % common-config/unlinked-graphs-dir)
                        (= % backup-root-dir-name)))
           (filter some?)
           (vec)))))

(defn- db-exists?
  [data-dir graph]
  (p/let [db-path (node-path/join (repo-dir data-dir graph) "db.sqlite")]
    (-> (fs/stat db-path)
        (p/then (fn [_] true))
        (p/catch (fn [_] false)))))

(defn- normalize-bind
  [bind]
  (cond
    (array? bind) bind
    (and bind (object? bind))
    (let [out (js-obj)]
      (doseq [key (js/Object.keys bind)]
        (let [value (gobj/get bind key)
              normalized (cond
                           (string/starts-with? key "$") (subs key 1)
                           (string/starts-with? key ":") (subs key 1)
                           :else key)]
          (gobj/set out normalized value)))
      out)
    :else bind))

(defn- stmt-all
  [^js stmt bind]
  (cond
    (array? bind) (.apply (.-all stmt) stmt bind)
    (some? bind) (.all stmt bind)
    :else (.all stmt)))

(defn- stmt-run
  [^js stmt bind]
  (cond
    (array? bind) (.apply (.-run stmt) stmt bind)
    (some? bind) (.run stmt bind)
    :else (.run stmt)))

(defn- exec-sql
  [^js db opts-or-sql]
  (if (string? opts-or-sql)
    (.exec db opts-or-sql)
    (let [sql (gobj/get opts-or-sql "sql")
          bind (gobj/get opts-or-sql "bind")
          row-mode (gobj/get opts-or-sql "rowMode")
          return-value (gobj/get opts-or-sql "returnValue")
          bind' (normalize-bind bind)
          ^js stmt (.prepare db sql)]
      (if (or (= row-mode "array")
              (= row-mode "object")
              (= return-value "resultRows"))
        (do
          (when (= row-mode "array")
            (.setReturnArrays stmt true))
          (stmt-all stmt bind'))
        (do
          (stmt-run stmt bind')
          nil)))))

(defn- with-transaction
  [^js db tx-depth savepoint-seq tx-body]
  (let [outermost? (zero? @tx-depth)
        savepoint (when-not outermost?
                    (str "__logseq_tx_" (swap! savepoint-seq inc)))]
    (if outermost?
      (.exec db "BEGIN")
      (.exec db (str "SAVEPOINT " savepoint)))
    (swap! tx-depth inc)
    (try
      (let [result (tx-body)]
        (if outermost?
          (.exec db "COMMIT")
          (.exec db (str "RELEASE SAVEPOINT " savepoint)))
        result)
      (catch :default e
        (if outermost?
          (try
            (.exec db "ROLLBACK")
            (catch :default _))
          (do
            (try
              (.exec db (str "ROLLBACK TO SAVEPOINT " savepoint))
              (catch :default _))
            (try
              (.exec db (str "RELEASE SAVEPOINT " savepoint))
              (catch :default _))))
        (throw e))
      (finally
        (swap! tx-depth dec)))))

(defn- backup-db!
  [write-guard-fn ^js db path]
  (p/let [_ (when write-guard-fn
              (write-guard-fn))
          _ (ensure-dir! (node-path/dirname path))]
    (sqlite-backup/backup-connection! db path)))

(defn- wrap-node-sqlite-db
  [db write-guard-fn]
  (let [wrapper (js-obj)
        closed? (atom false)
        tx-depth (atom 0)
        savepoint-seq (atom 0)]
    (set! (.-exec wrapper) (fn [opts-or-sql] (exec-sql db opts-or-sql)))
    (set! (.-transaction wrapper)
          (fn [f]
            (with-transaction db tx-depth savepoint-seq
              (fn []
                (f wrapper)))))
    (set! (.-backup wrapper)
          (fn [path]
            (backup-db! write-guard-fn db path)))
    (set! (.-close wrapper)
          (fn []
            (when-not @closed?
              (reset! closed? true)
              (try
                (.close db)
                (catch :default e
                  (when-not (string/includes? (str e) "database is not open")
                    (throw e)))))
            nil))
    wrapper))

(defn- open-sqlite-db
  [write-guard-fn {:keys [path]}]
  (p/let [_ (ensure-dir! (node-path/dirname path))]
    (wrap-node-sqlite-db (new DatabaseSync path) write-guard-fn)))

(def ^:private default-embedding-model "all-MiniLM-L6-v2")
(def ^:private embedding-fetch-timeout-ms 120000)
(def ^:private embedding-fetch-retry-ms 250)
(def ^:private embedding-model-dimensions
  {default-embedding-model 384
   "BAAI/bge-m3" 1024
   "Qwen/Qwen3-Embedding-4B" 1024})

(defn- resolve-embedding-endpoint
  [configured-endpoint]
  (or configured-endpoint
      (gobj/get (.-env js/process) "LOGSEQ_EMBEDDINGS_URL")))

(defn- resolve-embedding-model-id
  [configured-model-id]
  (or configured-model-id
      (gobj/get (.-env js/process) "LOGSEQ_EMBEDDING_MODEL")
      default-embedding-model))

(defn- resolve-embedding-dimension
  [model-id]
  (or (get embedding-model-dimensions model-id)
      (throw (ex-info "Unsupported embedding model dimension"
                      {:model-id model-id}))))

(defn- embedding-response->vectors
  [response]
  (let [data (-> (js->clj response :keywordize-keys true)
                 :data)]
    (->> data
         (sort-by #(or (:index %) 0))
         (mapv (comp vec :embedding)))))

(defn- <fetch-embedding-response
  [endpoint model-id request]
  (let [deadline (+ (js/Date.now) embedding-fetch-timeout-ms)]
    (letfn [(attempt! []
              (-> (js/fetch endpoint request)
                  (p/catch
                   (fn [error]
                     (if (< (js/Date.now) deadline)
                       (p/let [_ (p/delay embedding-fetch-retry-ms)]
                         (attempt!))
                       (throw (ex-info "embedding server fetch failed"
                                       {:endpoint endpoint
                                        :model-id model-id}
                                       error)))))))]
      (attempt!))))

(defn- <embed-texts
  [endpoint model-id texts]
  (let [texts (vec texts)]
    (if (empty? texts)
      (p/resolved [])
      (p/let [resp (<fetch-embedding-response
                    endpoint
                    model-id
                    #js {:method "POST"
                         :headers #js {"Content-Type" "application/json"}
                         :body (js/JSON.stringify
                                (clj->js {:model model-id
                                          :input texts}))})
              _ (when-not (.-ok resp)
                  (throw (ex-info "embedding server request failed"
                                  {:endpoint endpoint
                                   :status (.-status resp)
                                   :model-id model-id})))
              body (.json resp)]
        (embedding-response->vectors body)))))

(defonce ^:private *zvec-module (atom nil))
(defonce ^:private *zvec-initialized? (atom false))

(def ^:private zvec-vector-field "embedding")
(def ^:private zvec-page-field "page")
(def ^:private zvec-title-field "title")

(defn- zvec-enum-value
  [enum-name value-name]
  (gobj/get (gobj/get @*zvec-module enum-name) value-name))

(defn- zvec-module []
  (or @*zvec-module
      (let [module (js/require "@zvec/zvec")]
        (reset! *zvec-module module)
        module)))

(defn- initialize-zvec! []
  (zvec-module)
  (when (compare-and-set! *zvec-initialized? false true)
    ((gobj/get @*zvec-module "ZVecInitialize")
     #js {:logLevel (zvec-enum-value "ZVecLogLevel" "WARN")})))

(defn- zvec-schema
  [dimension]
  (let [Schema (gobj/get @*zvec-module "ZVecCollectionSchema")]
    (new Schema
         #js {:name "blocks"
              :vectors #js [#js {:name zvec-vector-field
                                  :dataType (zvec-enum-value "ZVecDataType" "VECTOR_FP32")
                                  :dimension dimension
                                  :indexParams #js {:indexType (zvec-enum-value "ZVecIndexType" "HNSW")
                                                    :metricType (zvec-enum-value "ZVecMetricType" "COSINE")}}]
              :fields #js [#js {:name zvec-page-field
                                 :dataType (zvec-enum-value "ZVecDataType" "STRING")
                                 :indexParams #js {:indexType (zvec-enum-value "ZVecIndexType" "INVERT")}}
                            #js {:name zvec-title-field
                                 :dataType (zvec-enum-value "ZVecDataType" "STRING")}]})))

(defn- create-zvec-collection!
  [path dimension]
  ((gobj/get @*zvec-module "ZVecCreateAndOpen")
   path
   (zvec-schema dimension)
   #js {:enableMMAP true}))

(defn- zvec-collection-missing-error?
  [error]
  (or (= "ZVEC_NOT_FOUND" (gobj/get error "code"))
      (and (= "ZVEC_INVALID_ARGUMENT" (gobj/get error "code"))
           (string/includes? (str error) " not exist"))))

(defn- open-zvec-collection!
  [path dimension]
  (initialize-zvec!)
  (try
    ((gobj/get @*zvec-module "ZVecOpen") path #js {:enableMMAP true})
    (catch :default error
      (if (zvec-collection-missing-error? error)
        (create-zvec-collection! path dimension)
        (throw error)))))

(defn- zvec-doc
  [{:keys [id page embedding vector-title]}]
  (let [vectors (js-obj)
        fields (js-obj)]
    (gobj/set vectors zvec-vector-field (clj->js embedding))
    (gobj/set fields zvec-page-field page)
    (gobj/set fields zvec-title-field (or vector-title ""))
    #js {:id id
         :vectors vectors
         :fields fields}))

(defn- zvec-result->map
  [doc]
  (let [fields (gobj/get doc "fields")
        distance (gobj/get doc "score")]
    {:id (gobj/get doc "id")
     :page (gobj/get fields zvec-page-field)
     :vector-title (gobj/get fields zvec-title-field)
     :vector-score (if (number? distance)
                     (/ 1 (+ 1 distance))
                     0.0)}))

(defn- vector-metadata-path
  [path]
  (node-path/join path "metadata.json"))

(defn- read-vector-metadata
  [path]
  (let [metadata-path (vector-metadata-path path)]
    (when (.existsSync node-fs metadata-path)
      (-> (.readFileSync node-fs metadata-path "utf8")
          js/JSON.parse
          (js->clj :keywordize-keys true)))))

(defn- write-vector-metadata!
  [path metadata]
  (.mkdirSync node-fs path #js {:recursive true})
  (.writeFileSync node-fs
                  (vector-metadata-path path)
                  (js/JSON.stringify (clj->js metadata))
                  "utf8"))

(def ^:private vector-page-filter-topk-multipliers [4 16 64])

(defn- vector-query-topks
  [limit page]
  (let [limit (or limit 100)]
    (if page
      (mapv #(* limit %) vector-page-filter-topk-multipliers)
      [limit])))

(defn- query-zvec
  [collection embedding topk]
  (.querySync ^js collection
              #js {:fieldName zvec-vector-field
                   :topk topk
                   :vector (clj->js embedding)
                   :outputFields #js [zvec-page-field zvec-title-field]
                   :params #js {:indexType (zvec-enum-value "ZVecIndexType" "HNSW")
                                :ef 300}}))

(defn- enough-vector-results?
  [results limit page]
  (or (nil? page)
      (>= (count results) limit)))

(defn- open-vector-index
  [{:keys [path dimension]}]
  (p/let [_ (ensure-dir! (node-path/dirname path))]
    (let [collection* (atom (open-zvec-collection! path dimension))
          reopen! (fn []
                    (reset! collection* (open-zvec-collection! path dimension)))]
      {:query (fn [embedding limit page]
                (let [limit (or limit 100)
                      topks (vector-query-topks limit page)]
                  (loop [remaining-topks (seq topks)
                         latest-results []]
                    (if-let [topk (first remaining-topks)]
                      (let [docs (query-zvec @collection* embedding topk)
                            results (->> (array-seq docs)
                                         (map zvec-result->map)
                                         (filter (fn [result]
                                                   (or (nil? page)
                                                       (= page (:page result)))))
                                         (take limit)
                                         vec)]
                        (if (or (enough-vector-results? results limit page)
                                (nil? (next remaining-topks)))
                          results
                          (recur (next remaining-topks) results)))
                      latest-results))))
       :upsert! (fn [docs]
                  (.upsertSync ^js @collection* (clj->js (mapv zvec-doc docs)))
                  nil)
       :delete! (fn [ids]
                  (.deleteSync ^js @collection* (clj->js (vec ids)))
                  nil)
       :truncate! (fn []
                    (.destroySync ^js @collection*)
                    (reopen!)
                    nil)
       :metadata (fn []
                   (read-vector-metadata path))
       :set-metadata! (fn [metadata]
                        (write-vector-metadata! path metadata)
                        nil)
       :close! (fn []
                 (.closeSync ^js @collection*)
                 nil)})))

(defn- install-opfs-pool
  [data-dir _sqlite pool-name]
  (p/let [repo-dir-path (repo-dir data-dir pool-name)
          _ (ensure-dir! repo-dir-path)
          ^js pool (js-obj)]
    (set! (.-repoDir pool) repo-dir-path)
    (set! (.-getCapacity pool) (fn [] 1))
    (set! (.-pauseVfs pool) (fn [] nil))
    (set! (.-unpauseVfs pool) (fn [] nil))
    pool))

(defn- export-file
  [pool path]
  (fs/readFile (pool-path pool path)))

(defn- import-db
  [write-guard-fn pool path data]
  (let [full-path (pool-path pool path)
        dir (node-path/dirname full-path)]
    (p/let [_ (when write-guard-fn
                (write-guard-fn))
            _ (ensure-dir! dir)]
      (fs/writeFile full-path (->buffer data)))))

(defn- remove-vfs!
  [^js pool]
  (when pool
    (fs/rm (.-repoDir pool) #js {:recursive true :force true})))

(defn- read-text!
  [data-dir path]
  (fs/readFile (path-under-data-dir data-dir path) "utf8"))

(defn- write-text!
  [write-guard-fn data-dir path text]
  (let [full-path (path-under-data-dir data-dir path)
        dir (node-path/dirname full-path)]
    (p/let [_ (when write-guard-fn
                (write-guard-fn))
            _ (ensure-dir! dir)]
      (fs/writeFile full-path text "utf8"))))

(defn- write-text-atomic!
  [write-guard-fn data-dir path text]
  (let [full-path (path-under-data-dir data-dir path)
        dir (node-path/dirname full-path)
        tmp-path (node-path/join dir (str "." (node-path/basename full-path) ".tmp-" (random-uuid)))]
    (p/let [_ (when write-guard-fn
                (write-guard-fn))
            _ (ensure-dir! dir)
            _ (fs/writeFile tmp-path text "utf8")
            _ (fs/rename tmp-path full-path)]
      nil)))

(defn- delete-file!
  [write-guard-fn data-dir path]
  (let [full-path (path-under-data-dir data-dir path)]
    (p/let [_ (when write-guard-fn
                (write-guard-fn))]
      (-> (fs/rm full-path #js {:force true})
          (p/catch (constantly nil))))))

(defn- asset-file-path
  [data-dir repo file-name]
  (node-path/join (repo-dir data-dir repo)
                  common-config/local-assets-dir
                  file-name))

(defn- asset-read-bytes!
  [data-dir repo file-name]
  (fs/readFile (asset-file-path data-dir repo file-name)))

(defn- asset-write-bytes!
  [write-guard-fn data-dir repo file-name payload]
  (let [full-path (asset-file-path data-dir repo file-name)
        dir (node-path/dirname full-path)]
    (p/let [_ (when write-guard-fn
                (write-guard-fn))
            _ (ensure-dir! dir)]
      (fs/writeFile full-path (->buffer payload)))))

(defn- asset-stat
  [data-dir repo file-name]
  (-> (fs/stat (asset-file-path data-dir repo file-name))
      (p/then (fn [^js stat]
                {:size (.-size stat)
                 :is-file? (.isFile stat)}))
      (p/catch (constantly nil))))

(defn- asset-delete!
  [write-guard-fn data-dir repo file-name]
  (let [full-path (asset-file-path data-dir repo file-name)]
    (p/let [_ (when write-guard-fn
                (write-guard-fn))]
      (-> (fs/rm full-path #js {:force true})
          (p/catch (constantly nil))))))

(defn- websocket-connect
  [url]
  (let [WebSocket (js/require "ws")]
    (new WebSocket url)))

(def ^:private kv-transit-writer
  (transit/writer
   :json
   {:handlers
    {js/Uint8Array
     (transit/write-handler
      (constantly "uint8array")
      (fn [value]
        (js->clj (js/Array.from value))))}}))

(def ^:private kv-transit-reader
  (transit/reader
   :json
   {:handlers
    {"uint8array"
     (fn [value]
       (js/Uint8Array. (clj->js value)))}}))

(defn- parse-kv-state
  [contents]
  (try
    (let [state (transit/read kv-transit-reader contents)]
      (if (map? state)
        state
        {}))
    (catch :default error
      (log/warn :db-worker-node-kv-parse-failed
                {:error error})
      {})))

(defn- serialize-kv-state
  [state]
  (transit/write kv-transit-writer state))

(def ^:private keychain-service "Logseq E2EE")

(defn- <save-secret-text!
  [kv key text]
  (-> (p/let [_ (.setPassword ^js keytar keychain-service key text)]
        nil)
      (p/catch (fn [e]
                 (log/warn :db-worker/keychain-save-failed {:error e
                                                            :key key})
                 ((:set! kv) key text)))))

(defn- <read-secret-text
  [kv key]
  (-> (p/let [secret (.getPassword ^js keytar keychain-service key)]
        secret)
      (p/catch (fn [e]
                 (log/warn :db-worker/keychain-read-failed {:error e
                                                            :key key})
                 ((:get kv) key)))))

(defn- <delete-secret-text!
  [kv key]
  (-> (p/let [_ (.deletePassword ^js keytar keychain-service key)]
        nil)
      (p/catch (fn [e]
                 (log/warn :db-worker/keychain-delete-failed {:error e
                                                              :key key})
                 ((:set! kv) key nil)))))

(defn- truthy-env?
  [value]
  (contains? #{"1" "true" "yes" "on"}
             (string/lower-case (string/trim (str (or value ""))))))

(defn- use-keychain-for-owner?
  [owner-source]
  (not (and (= :cli owner-source)
            (truthy-env? (gobj/get (.-env js/process) "CLI_E2E_TEST")))))

(defn- <save-secret-text-by-owner!
  [kv owner-source key text]
  (if (use-keychain-for-owner? owner-source)
    (<save-secret-text! kv key text)
    ((:set! kv) key text)))

(defn- <read-secret-text-by-owner
  [kv owner-source key]
  (if (use-keychain-for-owner? owner-source)
    (<read-secret-text kv key)
    ((:get kv) key)))

(defn- <delete-secret-text-by-owner!
  [kv owner-source key]
  (if (use-keychain-for-owner? owner-source)
    (<delete-secret-text! kv key)
    ((:set! kv) key nil)))

(defn- kv-store
  [data-dir]
  (let [kv-path (node-path/join data-dir "kv-store.json")
        state (atom nil)
        <load! (fn []
                 (if (some? @state)
                   (p/resolved @state)
                   (-> (fs/readFile kv-path "utf8")
                       (p/then (fn [contents]
                                 (let [data (parse-kv-state contents)]
                                   (reset! state data)
                                   @state)))
                       (p/catch (fn [_]
                                  (reset! state {})
                                  @state)))))]
    {:get (fn [k]
            (p/let [_ (<load!)]
              (get @state k)))
     :set! (fn [k value]
             (p/let [_ (<load!)
                     _ (swap! state assoc k value)
                     payload (serialize-kv-state @state)]
               (fs/writeFile kv-path payload "utf8")))}))

(defn node-platform
  [{:keys [root-dir event-fn write-guard-fn owner-source recreate-lock-fn
           embedding-endpoint embedding-model-id open-vector-index-fn]}]
  (let [root-dir (db-lock/resolve-root-dir root-dir)
        data-dir (db-lock/graphs-dir root-dir)
        owner-source (db-lock/normalize-owner-source owner-source)
        embedding-endpoint (resolve-embedding-endpoint embedding-endpoint)
        vector-embedding-enabled? (boolean
                                   (and (macos-arm64?)
                                        (seq embedding-endpoint)))
        embedding-model-id (when vector-embedding-enabled?
                             (resolve-embedding-model-id embedding-model-id))
        embedding-dimension (when vector-embedding-enabled?
                              (resolve-embedding-dimension embedding-model-id))
        open-vector-index-fn (or open-vector-index-fn open-vector-index)
        kv (kv-store root-dir)]
    (p/do!
     (ensure-dir! root-dir)
     (ensure-dir! data-dir)
     (log/info :db-worker-node-platform {:root-dir root-dir
                                          :vector-embedding-enabled? vector-embedding-enabled?
                                          :embedding-endpoint embedding-endpoint
                                          :embedding-model-id embedding-model-id})
     (cond->
      {:env {:publishing? false
             :runtime :node
             :root-dir root-dir
             :owner-source owner-source
             :recreate-lock-fn recreate-lock-fn}
       :storage {:install-opfs-pool (fn [sqlite-module pool-name]
                                      (install-opfs-pool data-dir sqlite-module pool-name))
                 :list-graphs (fn [] (list-graphs data-dir))
                 :db-exists? (fn [graph] (db-exists? data-dir graph))
                 :resolve-db-path (fn [_repo pool path]
                                    (pool-path pool path))
                 :export-file export-file
                 :import-db (fn [pool path data] (import-db write-guard-fn pool path data))
                 :remove-vfs! (fn [pool] (remove-vfs! pool))
                 :read-text! (fn [path] (read-text! data-dir path))
                 :write-text! (fn [path text] (write-text! write-guard-fn data-dir path text))
                 :write-text-atomic! (fn [path text] (write-text-atomic! write-guard-fn data-dir path text))
                 :delete-file! (fn [path] (delete-file! write-guard-fn data-dir path))
                 :asset-read-bytes! (fn [repo file-name]
                                      (asset-read-bytes! data-dir repo file-name))
                 :asset-write-bytes! (fn [repo file-name payload]
                                       (asset-write-bytes! write-guard-fn data-dir repo file-name payload))
                 :asset-stat (fn [repo file-name]
                               (asset-stat data-dir repo file-name))
                 :asset-delete! (fn [repo file-name]
                                  (asset-delete! write-guard-fn data-dir repo file-name))}
       :kv {:get (:get kv)
            :set! (:set! kv)}
       :broadcast {:post-message! (fn [type payload]
                                    (when event-fn
                                      (event-fn type payload)))}
       :websocket {:connect websocket-connect}
       :sqlite {:init! (fn [] nil)
                :open-db (fn [opts] (open-sqlite-db write-guard-fn opts))
                :close-db (fn [db] (.close db))
                :exec (fn [db sql-or-opts] (.exec db sql-or-opts))
                :transaction (fn [db f] (.transaction db f))
                :backup-db (fn [^js db path]
                             (.backup db path))}
       :crypto {:save-secret-text! (fn [key text]
                                     (<save-secret-text-by-owner! kv owner-source key text))
                :read-secret-text (fn [key]
                                    (<read-secret-text-by-owner kv owner-source key))
                :delete-secret-text! (fn [key]
                                       (<delete-secret-text-by-owner! kv owner-source key))}
       :timers {:set-interval! (fn [f ms] (js/setInterval f ms))}}
       vector-embedding-enabled?
       (assoc :embedding {:model-id embedding-model-id
                          :dimension embedding-dimension
                          :embed-texts (fn [texts]
                                         (<embed-texts embedding-endpoint embedding-model-id texts))}
              :vector {:open-index open-vector-index-fn})))))
