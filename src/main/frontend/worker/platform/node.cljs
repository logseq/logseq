(ns frontend.worker.platform.node
  "Node.js platform adapter for db-worker."
  (:require ["better-sqlite3" :as sqlite3]
            ["fs/promises" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            ["ws" :as ws]
            [clojure.string :as string]
            [frontend.worker-common.util :as worker-util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def ^:private sqlite
  (or (aget sqlite3 "default") sqlite3))

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
  [data-dir pool-name]
  (node-path/join data-dir (str "." pool-name)))

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
  (let [dir? #(and % (.isDirectory %))
        db-dir-prefix ".logseq-pool-"]
    (p/let [entries (fs/readdir data-dir #js {:withFileTypes true})
            db-dirs (->> entries
                         (filter dir?)
                         (filter (fn [dirent]
                                   (string/starts-with? (.-name dirent) db-dir-prefix))))
            graph-names (map (fn [dirent]
                               (-> (.-name dirent)
                                   (string/replace-first db-dir-prefix "")
                                   ;; TODO: DRY
                                   (string/replace "+3A+" ":")
                                   (string/replace "++" "/")))
                             db-dirs)]
      (vec graph-names))))

(defn- db-exists?
  [data-dir graph]
  (p/let [pool-name (worker-util/get-pool-name graph)
          db-path (node-path/join (repo-dir data-dir pool-name) "db.sqlite")]
    (-> (fs/stat db-path)
        (p/then (fn [_] true))
        (p/catch (fn [_] false)))))

(defn- exec-sql
  [db opts-or-sql]
  (if (string? opts-or-sql)
    (.exec db opts-or-sql)
    (let [sql (gobj/get opts-or-sql "sql")
          bind (gobj/get opts-or-sql "bind")
          row-mode (gobj/get opts-or-sql "rowMode")
          bind' (if (and bind (object? bind))
                  (let [out (js-obj)]
                    (doseq [key (js/Object.keys bind)]
                      (let [value (gobj/get bind key)
                            normalized (cond
                                         (string/starts-with? key "$") (subs key 1)
                                         (string/starts-with? key ":") (subs key 1)
                                         :else key)]
                        (gobj/set out normalized value)))
                    out)
                  bind)
          stmt (.prepare db sql)]
      (if (= row-mode "array")
        (do
          (.raw stmt)
          (if (some? bind')
            (.all stmt bind')
            (.all stmt)))
        (do
          (if (some? bind')
            (.run stmt bind')
            (.run stmt))
          nil)))))

(defn- wrap-better-db
  [db]
  (let [wrapper (js-obj)]
    (set! (.-exec wrapper) (fn [opts-or-sql] (exec-sql db opts-or-sql)))
    (set! (.-transaction wrapper)
          (fn [f]
            (let [run-tx (.transaction db (fn [] (f wrapper)))]
              (run-tx))))
    (set! (.-close wrapper) (fn [] (.close db)))
    wrapper))

(defn- open-sqlite-db
  [{:keys [path]}]
  (p/let [_ (ensure-dir! (node-path/dirname path))]
    (wrap-better-db (new sqlite path))))

(defn- install-opfs-pool
  [data-dir _sqlite pool-name]
  (p/let [repo-dir-path (repo-dir data-dir pool-name)
          _ (ensure-dir! repo-dir-path)
          pool (js-obj)]
    (set! (.-repoDir pool) repo-dir-path)
    (set! (.-getCapacity pool) (fn [] 1))
    (set! (.-pauseVfs pool) (fn [] nil))
    (set! (.-unpauseVfs pool) (fn [] nil))
    pool))

(defn- export-file
  [pool path]
  (fs/readFile (pool-path pool path)))

(defn- import-db
  [pool path data]
  (let [full-path (pool-path pool path)
        dir (node-path/dirname full-path)]
    (p/let [_ (ensure-dir! dir)]
      (fs/writeFile full-path (->buffer data)))))

(defn- remove-vfs!
  [pool]
  (when pool
    (fs/rm (.-repoDir pool) #js {:recursive true :force true})))

(defn- read-text!
  [data-dir path]
  (fs/readFile (path-under-data-dir data-dir path) "utf8"))

(defn- write-text!
  [data-dir path text]
  (let [full-path (path-under-data-dir data-dir path)
        dir (node-path/dirname full-path)]
    (p/let [_ (ensure-dir! dir)]
      (fs/writeFile full-path text "utf8"))))

(defn- websocket-connect
  [url]
  (ws. url))

(defn- kv-store
  [data-dir]
  (let [kv-path (node-path/join data-dir "kv-store.json")
        state (atom nil)
        <load! (fn []
                 (if (some? @state)
                   (p/resolved @state)
                   (-> (fs/readFile kv-path "utf8")
                       (p/then (fn [contents]
                                 (let [data (js/JSON.parse contents)]
                                   (reset! state (js->clj data :keywordize-keys false))
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
                     payload (js/JSON.stringify (clj->js @state))]
               (fs/writeFile kv-path payload "utf8")))}))

(defn node-platform
  [{:keys [data-dir event-fn]}]
  (let [data-dir (expand-home (or data-dir "~/.logseq/db-worker"))
        kv (kv-store data-dir)]
    (p/do!
     (ensure-dir! data-dir)
     (log/info :db-worker-node-platform {:data-dir data-dir})
     {:env {:publishing? false
            :runtime :node
            :data-dir data-dir}
      :storage {:install-opfs-pool (fn [sqlite-module pool-name]
                                     (install-opfs-pool data-dir sqlite-module pool-name))
                :list-graphs (fn [] (list-graphs data-dir))
                :db-exists? (fn [graph] (db-exists? data-dir graph))
                :resolve-db-path (fn [_repo pool path]
                                   (pool-path pool path))
                :export-file export-file
                :import-db import-db
                :remove-vfs! remove-vfs!
                :read-text! (fn [path] (read-text! data-dir path))
                :write-text! (fn [path text] (write-text! data-dir path text))}
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
