(ns frontend.worker.platform
  "Platform adapter contract for db-worker runtimes."
  (:require [frontend.worker-common.util :as worker-util]
            [goog.object :as gobj]
            [promesa.core :as p]))

(defn- normalize-missing-value
  [value]
  (if (identical? js/undefined value)
    nil
    value))

(defn- js-value
  [object key]
  (let [value (gobj/get object key)]
    (normalize-missing-value value)))

(defn- js-fn
  [object key]
  (when-let [f (js-value object key)]
    (fn [& args]
      (.apply f object (to-array args)))))

(defn- js-array->vec
  [value]
  (when (some? value)
    (vec (array-seq value))))

(defn- promise-js-array->vec
  [promise]
  (p/then promise js-array->vec))

(defn- runtime-keyword
  [runtime]
  (case runtime
    "browser" :browser
    "node" :node
    runtime))

(defn- owner-source-keyword
  [owner-source]
  (case owner-source
    "browser" :browser
    "electron" :electron
    "capacitor" :capacitor
    "cli" :cli
    "unknown" :unknown
    owner-source))

(defn- js-asset-stat->map
  [stat]
  (when (some? stat)
    (cond-> {:size (js-value stat "size")}
      (some? (js-value stat "type"))
      (assoc :type (js-value stat "type"))

      (some? (js-value stat "isFile"))
      (assoc :is-file? (js-value stat "isFile")))))

(defn- promise-asset-stat->map
  [promise]
  (p/then promise js-asset-stat->map))

(defn- unsupported-browser-mirror-storage!
  [& _args]
  (throw (ex-info "Markdown mirror storage is not supported in browser workers"
                  {:platform :browser
                   :feature :markdown-mirror})))

(defn- js-vector-result->map
  [result]
  (cond-> {:id (js-value result "id")
           :vector-score (js-value result "vectorScore")}
    (some? (js-value result "page"))
    (assoc :page (js-value result "page"))

    (some? (js-value result "title"))
    (assoc :title (js-value result "title"))

    (some? (js-value result "vectorTitle"))
    (assoc :vector-title (js-value result "vectorTitle"))))

(defn- js-vector-results->vec
  [results]
  (mapv js-vector-result->map (array-seq results)))

(defn- js-vector-index->map
  [index]
  {:query (fn [embedding limit page]
            (js-vector-results->vec
             ((js-fn index "query") (clj->js embedding) limit page)))
   :upsert! (fn [docs]
              ((js-fn index "upsert!") (clj->js docs)))
   :delete! (fn [ids]
              ((js-fn index "delete!") (clj->js ids)))
   :truncate! (js-fn index "truncate!")
   :metadata (fn []
               (js->clj ((js-fn index "metadata")) :keywordize-keys true))
   :set-metadata! (fn [metadata]
                    ((js-fn index "set-metadata!") (clj->js metadata)))
   :close! (js-fn index "close!")})

(defn- js-platform-env->map
  [env]
  {:publishing? (js-value env "publishing?")
   :runtime (runtime-keyword (js-value env "runtime"))
   :root-dir (js-value env "root-dir")
   :owner-source (owner-source-keyword (js-value env "owner-source"))
   :recreate-lock-fn (js-value env "recreate-lock-fn")})

(defn- ensure-pool-aliases
  [pool]
  (when (and (some? pool)
             (nil? (js-value pool "repoDir"))
             (some? (js-value pool "repo_dir")))
    (gobj/set pool "repoDir" (js-value pool "repo_dir")))
  pool)

(defn- js-platform-storage->map
  [env storage]
  (cond-> {:install-opfs-pool (fn [sqlite pool-name]
                                (p/then ((js-fn storage "install-opfs-pool")
                                         sqlite
                                         pool-name)
                                        ensure-pool-aliases))
           :list-graphs (fn []
                          (promise-js-array->vec ((js-fn storage "list-graphs"))))
           :db-exists? (js-fn storage "db-exists?")
           :resolve-db-path (js-fn storage "resolve-db-path")
           :export-file (js-fn storage "export-file")
           :import-db (js-fn storage "import-db")
           :remove-vfs! (js-fn storage "remove-vfs!")
           :read-text! (js-fn storage "read-text!")
           :write-text! (js-fn storage "write-text!")
           :asset-read-bytes! (js-fn storage "asset-read-bytes!")
           :asset-write-bytes! (js-fn storage "asset-write-bytes!")
           :asset-stat (fn [repo file-name]
                         (promise-asset-stat->map
                          ((js-fn storage "asset-stat") repo file-name)))}
    (js-value storage "write-text-atomic!")
    (assoc :write-text-atomic! (if (= :browser (:runtime env))
                                 unsupported-browser-mirror-storage!
                                 (js-fn storage "write-text-atomic!")))

    (js-value storage "delete-file!")
    (assoc :delete-file! (if (= :browser (:runtime env))
                           unsupported-browser-mirror-storage!
                           (js-fn storage "delete-file!")))

    (js-value storage "mirror-read-text!")
    (assoc :mirror-read-text! (if (= :browser (:runtime env))
                                unsupported-browser-mirror-storage!
                                (js-fn storage "mirror-read-text!")))

    (js-value storage "asset-delete!")
    (assoc :asset-delete! (js-fn storage "asset-delete!"))

    (js-value storage "transfer")
    (assoc :transfer (js-fn storage "transfer"))))

(def ^:private raw-sqlite-db-key "__logseqRawDb")

(defn- raw-sqlite-db
  [db]
  (or (js-value db raw-sqlite-db-key)
      db))

(declare js-sqlite-db-wrapper)

(defn- js-platform-sqlite->map
  [sqlite]
  (cond-> {:init! (js-fn sqlite "init!")
           :open-db (fn [opts]
                      (p/then ((js-fn sqlite "open-db") (clj->js opts))
                              (fn [db]
                                (js-sqlite-db-wrapper sqlite db))))
           :close-db (fn [db]
                       ((js-fn sqlite "close-db") (raw-sqlite-db db)))
           :exec (fn [db sql-or-opts]
                   ((js-fn sqlite "exec")
                    (raw-sqlite-db db)
                    (if (map? sql-or-opts)
                      (clj->js sql-or-opts)
                      sql-or-opts)))
           :transaction (fn [db f]
                          ((js-fn sqlite "transaction")
                           (raw-sqlite-db db)
                           (fn [tx-db]
                             (f (js-sqlite-db-wrapper sqlite tx-db)))))}
    (js-value sqlite "backup-db")
    (assoc :backup-db (fn [db path]
                        ((js-fn sqlite "backup-db")
                         (raw-sqlite-db db)
                         path)))))

(defn- js-sqlite-db-wrapper
  [sqlite db]
  (let [wrapper (js-obj)]
    (gobj/set wrapper raw-sqlite-db-key db)
    (gobj/set wrapper "exec"
              (fn [sql-or-opts]
                ((:exec (js-platform-sqlite->map sqlite)) wrapper sql-or-opts)))
    (gobj/set wrapper "transaction"
              (fn [f]
                ((:transaction (js-platform-sqlite->map sqlite)) wrapper f)))
    (gobj/set wrapper "backup"
              (fn [path]
                (when-let [backup-db (:backup-db (js-platform-sqlite->map sqlite))]
                  (backup-db wrapper path))))
    (gobj/set wrapper "close"
              (fn []
                ((:close-db (js-platform-sqlite->map sqlite)) wrapper)))
    wrapper))

(defn- js-platform-vector->map
  [vector]
  (when (some? vector)
    {:open-index (fn [opts]
                   (p/then ((js-fn vector "open-index") (clj->js opts))
                           js-vector-index->map))}))

(defn- js-platform-embedding->map
  [embedding]
  (when (some? embedding)
    {:model-id (js-value embedding "model-id")
     :dimension (js-value embedding "dimension")
     :embed-texts (fn [texts]
                    (p/then ((js-fn embedding "embed-texts") (clj->js texts))
                            (fn [embeddings]
                              (mapv js-array->vec (array-seq embeddings)))))}))

(defn js-platform->platform
  [js-platform]
  (let [env (js-platform-env->map (js-value js-platform "env"))]
    (cond-> {:env env
              :storage (js-platform-storage->map
                        env
                        (js-value js-platform "storage"))
              :kv {:get (js-fn (js-value js-platform "kv") "get")
                   :set! (js-fn (js-value js-platform "kv") "set!")}
              :broadcast {:post-message!
                          (js-fn (js-value js-platform "broadcast")
                                 "post-message!")}
              :websocket {:connect
                          (js-fn (js-value js-platform "websocket") "connect")}
              :sqlite (js-platform-sqlite->map
                       (js-value js-platform "sqlite"))
              :crypto {:save-secret-text!
                       (js-fn (js-value js-platform "crypto")
                              "save-secret-text!")
                       :read-secret-text
                       (js-fn (js-value js-platform "crypto")
                              "read-secret-text")
                       :delete-secret-text!
                       (js-fn (js-value js-platform "crypto")
                              "delete-secret-text!")}
              :timers {:set-interval!
                       (js-fn (js-value js-platform "timers")
                              "set-interval!")}}
      (some? (js-value js-platform "vector"))
      (assoc :vector (js-platform-vector->map (js-value js-platform "vector")))

      (some? (js-value js-platform "embedding"))
      (assoc :embedding
             (js-platform-embedding->map
              (js-value js-platform "embedding"))))))

(def ^:private required-sections
  [:env :storage :kv :broadcast :websocket :crypto :timers :sqlite])

(defonce ^:private *platform (atom nil))

(defn validate-platform!
  [platform]
  (doseq [section required-sections]
    (when-not (contains? platform section)
      (throw (ex-info (str "platform adapter missing section: " section)
                      {:section section
                       :platform-keys (keys platform)}))))
  platform)

(defn set-platform!
  [platform]
  (reset! *platform (validate-platform! platform)))

(defn current
  []
  (or @*platform
      (throw (ex-info "platform adapter not initialized" {}))))

(defn env-flag
  [platform flag]
  (get-in platform [:env flag]))

(defn storage
  [platform]
  (:storage platform))

(defn install-storage-pool
  [platform sqlite pool-name]
  (if-let [f (get-in platform [:storage :install-opfs-pool])]
    (f sqlite pool-name)
    (throw (ex-info "platform storage/install-opfs-pool missing"
                    {:pool-name pool-name}))))

(defn resolve-db-path
  [platform repo pool path]
  (if-let [f (get-in platform [:storage :resolve-db-path])]
    (f repo pool path)
    path))

(defn remove-storage-pool!
  [platform pool]
  (if-let [f (get-in platform [:storage :remove-vfs!])]
    (f pool)
    nil))

(defn kv-get
  [platform k]
  (if-let [f (get-in platform [:kv :get])]
    (-> (f k)
        (.then normalize-missing-value))
    (throw (ex-info "platform kv/get missing" {:key k}))))

(defn kv-set!
  [platform k value]
  (if-let [f (get-in platform [:kv :set!])]
    (f k value)
    (throw (ex-info "platform kv/set! missing" {:key k}))))

(defn read-text!
  [platform path]
  (if-let [f (get-in platform [:storage :read-text!])]
    (f path)
    (throw (ex-info "platform storage/read-text! missing" {:path path}))))

(defn write-text!
  [platform path text]
  (if-let [f (get-in platform [:storage :write-text!])]
    (f path text)
    (throw (ex-info "platform storage/write-text! missing" {:path path}))))

(defn asset-read-bytes!
  [platform repo file-name]
  (if-let [f (get-in platform [:storage :asset-read-bytes!])]
    (f repo file-name)
    (throw (ex-info "platform storage/asset-read-bytes! missing"
                    {:repo repo
                     :file-name file-name}))))

(defn asset-write-bytes!
  [platform repo file-name payload]
  (if-let [f (get-in platform [:storage :asset-write-bytes!])]
    (f repo file-name payload)
    (throw (ex-info "platform storage/asset-write-bytes! missing"
                    {:repo repo
                     :file-name file-name}))))

(defn asset-stat
  [platform repo file-name]
  (if-let [f (get-in platform [:storage :asset-stat])]
    (f repo file-name)
    (throw (ex-info "platform storage/asset-stat missing"
                    {:repo repo
                     :file-name file-name}))))

(defn save-secret-text!
  [platform key text]
  (if-let [f (get-in platform [:crypto :save-secret-text!])]
    (f key text)
    (throw (ex-info "platform crypto/save-secret-text! missing" {:key key}))))

(defn read-secret-text
  [platform key]
  (if-let [f (get-in platform [:crypto :read-secret-text])]
    (-> (f key)
        (.then normalize-missing-value))
    (throw (ex-info "platform crypto/read-secret-text missing" {:key key}))))

(defn delete-secret-text!
  [platform key]
  (if-let [f (get-in platform [:crypto :delete-secret-text!])]
    (f key)
    (throw (ex-info "platform crypto/delete-secret-text! missing" {:key key}))))

(defn websocket-connect
  [platform url]
  (if-let [f (get-in platform [:websocket :connect])]
    (f url)
    (throw (ex-info "platform websocket/connect missing" {:url url}))))

(defn sqlite-init!
  [platform]
  (when-let [f (get-in platform [:sqlite :init!])]
    (f)))

(defn sqlite-open
  [platform opts]
  (if-let [f (get-in platform [:sqlite :open-db])]
    (f opts)
    (throw (ex-info "platform sqlite/open-db missing" {:opts opts}))))

(defn vector-open
  [platform opts]
  (when-let [f (get-in platform [:vector :open-index])]
    (f opts)))

(defn embedding-model-id
  [platform]
  (get-in platform [:embedding :model-id]))

(defn embedding-dimension
  [platform]
  (or (get-in platform [:embedding :dimension])
      (throw (ex-info "platform embedding/dimension missing"
                      {:model-id (embedding-model-id platform)}))))

(defn embed-texts
  [platform texts]
  (if-let [f (get-in platform [:embedding :embed-texts])]
    (f texts)
    (throw (ex-info "platform embedding/embed-texts missing"
                    {:model-id (embedding-model-id platform)
                     :text-count (count texts)}))))

(defn post-message!
  [platform type payload]
  (if (= :browser (get-in platform [:env :runtime]))
    (worker-util/post-message type payload)
    (when-let [f (get-in platform [:broadcast :post-message!])]
      (f type payload))))
