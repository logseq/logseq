(ns frontend.worker.platform.node
  "Node.js platform adapter for db-worker."
  (:require ["node:sqlite" :as node-sqlite]
            ["fs/promises" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            ["ws" :as ws]
            [clojure.string :as string]
            [cognitect.transit :as transit]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

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
  (if (node-path/isAbsolute path)
    path
    (node-path/join data-dir path)))

(defn- ->buffer
  [data]
  (cond
    (instance? js/Buffer data) data
    (instance? js/ArrayBuffer data) (js/Buffer.from data)
    (and (some? data) (some? (.-buffer data))) (js/Buffer.from (.-buffer data))
    :else (js/Buffer.from (str data))))

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
          bind' (normalize-bind bind)
          ^js stmt (.prepare db sql)]
      (if (= row-mode "array")
        (do
          (.setReturnArrays stmt true)
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

(defn- wrap-node-sqlite-db
  [db]
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
  [{:keys [path]}]
  (p/let [_ (ensure-dir! (node-path/dirname path))]
    (wrap-node-sqlite-db (new DatabaseSync path))))

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
  [write-guard-fn ^js pool]
  (when pool
    (p/let [_ (when write-guard-fn
                (write-guard-fn))]
      (fs/rm (.-repoDir pool) #js {:recursive true :force true}))))

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

(defn- websocket-connect
  [url]
  (ws. url))

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
  [{:keys [data-dir event-fn write-guard-fn owner-source]}]
  (let [data-dir (expand-home (or data-dir "~/logseq/graphs"))
        owner-source (db-lock/normalize-owner-source owner-source)
        kv (kv-store data-dir)]
    (p/do!
     (ensure-dir! data-dir)
     (log/info :db-worker-node-platform {:data-dir data-dir})
     {:env {:publishing? false
            :runtime :node
            :data-dir data-dir
            :owner-source owner-source}
      :storage {:install-opfs-pool (fn [sqlite-module pool-name]
                                     (install-opfs-pool data-dir sqlite-module pool-name))
                :list-graphs (fn [] (list-graphs data-dir))
                :db-exists? (fn [graph] (db-exists? data-dir graph))
                :resolve-db-path (fn [_repo pool path]
                                   (pool-path pool path))
                :export-file export-file
                :import-db (fn [pool path data] (import-db write-guard-fn pool path data))
                :remove-vfs! (fn [pool] (remove-vfs! write-guard-fn pool))
                :read-text! (fn [path] (read-text! data-dir path))
                :write-text! (fn [path text] (write-text! write-guard-fn data-dir path text))}
      :kv {:get (:get kv)
           :set! (:set! kv)}
      :broadcast {:post-message! (fn [type payload]
                                   (when event-fn
                                     (event-fn type payload)))}
      :websocket {:connect websocket-connect}
      :sqlite {:init! (fn [] nil)
               :open-db open-sqlite-db
               :close-db (fn [db] (.close db))
               :exec (fn [db sql-or-opts] (.exec db sql-or-opts))
               :transaction (fn [db f] (.transaction db f))}
      :crypto {}
      :timers {:set-interval! (fn [f ms] (js/setInterval f ms))}})))
