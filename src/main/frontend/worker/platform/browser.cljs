(ns frontend.worker.platform.browser
  "Browser platform adapter for db-worker."
  (:require ["/frontend/idbkv" :as idb-keyval]
            ["@sqlite.org/sqlite-wasm" :default sqlite3InitModule]
            ["comlink" :as Comlink]
            [clojure.string :as string]
            [frontend.common.file.opfs :as opfs]
            [frontend.worker-common.util :as worker-util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- iter->vec
  [iter']
  (when iter'
    (p/loop [acc []]
      (p/let [elem (.next iter')]
        (if (.-done elem)
          acc
          (p/recur (conj acc (.-value elem))))))))

(defn- list-graphs
  []
  (let [dir? #(= (.-kind %) "directory")
        db-dir-prefix ".logseq-pool-"]
    (p/let [^js root (.getDirectory js/navigator.storage)
            values-iter (when (dir? root) (.values root))
            values (when values-iter (iter->vec values-iter))
            current-dir-dirs (filter dir? values)
            db-dirs (filter (fn [file]
                              (string/starts-with? (.-name file) db-dir-prefix))
                            current-dir-dirs)
            graph-names (map (fn [dir]
                               (-> (.-name dir)
                                   (string/replace-first ".logseq-pool-" "")
                                   ;; TODO: DRY
                                   (string/replace "+3A+" ":")
                                   (string/replace "++" "/")))
                             db-dirs)]
      (log/info :db-dirs (map #(.-name %) db-dirs) :all-dirs (map #(.-name %) current-dir-dirs))
      (vec graph-names))))

(defn- db-exists?
  [graph]
  (->
   (p/let [^js root (.getDirectory js/navigator.storage)
           _dir-handle (.getDirectoryHandle root (str "." (worker-util/get-pool-name graph)))]
     true)
    (p/catch
    (fn [_e]                         ; not found
      false))))

(defonce ^:private kv-store
  (delay (idb-keyval/newStore "localforage" "keyvaluepairs" 2)))

(defn- kv-get
  [k]
  (idb-keyval/get k @kv-store))

(defn- kv-set!
  [k value]
  (idb-keyval/set k value @kv-store))

(defn- install-opfs-pool
  [sqlite pool-name]
  (.installOpfsSAHPoolVfs ^js sqlite #js {:name pool-name
                                          :initialCapacity 20}))

(defn- export-file
  [pool path]
  (.exportFile ^js pool path))

(defn- import-db
  [pool path data]
  (.importDb ^js pool path data))

(defn- remove-vfs!
  [pool]
  (when pool
    (.removeVfs ^js pool)))

(defn- read-text!
  [path]
  (opfs/<read-text! path))

(defn- write-text!
  [path text]
  (opfs/<write-text! path text))

(defn- websocket-connect
  [url]
  (js/WebSocket. url))

(defn- init-sqlite!
  []
  (sqlite3InitModule (clj->js {:print #(log/info :init-sqlite-module! %)
                               :printErr #(log/error :init-sqlite-module! %)})))

(defn- open-sqlite-db
  [{:keys [sqlite pool path mode]}]
  (if pool
    (new (.-OpfsSAHPoolDb pool) path)
    (let [^js DB (.-DB ^js (.-oo1 ^js sqlite))]
      (new DB path (or mode "c")))))

(defn browser-platform
  []
  {:env {:publishing? (string/includes? (.. js/location -href) "publishing=true")
         :runtime :browser}
   :storage {:install-opfs-pool install-opfs-pool
             :list-graphs list-graphs
             :db-exists? db-exists?
             :resolve-db-path (fn [_repo _pool path] path)
             :export-file export-file
             :import-db import-db
             :remove-vfs! remove-vfs!
             :read-text! read-text!
             :write-text! write-text!
             :transfer (fn [data transferables]
                         (Comlink/transfer data transferables))}
   :kv {:get kv-get
        :set! kv-set!}
   :broadcast {:post-message! worker-util/post-message}
   :websocket {:connect websocket-connect}
   :sqlite {:init! init-sqlite!
            :open-db open-sqlite-db
            :close-db (fn [db] (.close db))
            :exec (fn [db sql-or-opts] (.exec db sql-or-opts))
            :transaction (fn [db f] (.transaction db f))}
   :crypto {}
   :timers {:set-interval! (fn [f ms] (js/setInterval f ms))}})
