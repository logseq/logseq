(ns ^:node-only logseq.outliner.cli
  "Primary ns for outliner CLI fns"
    (:require [clojure.string :as string]
              [datascript.core :as d]
              [logseq.db.sqlite.create-graph :as sqlite-create-graph]
              [logseq.db.sqlite.build :as sqlite-build]
              [logseq.db.sqlite.cli :as sqlite-cli]
              [logseq.outliner.db-pipeline :as db-pipeline]
              ["fs" :as fs]
              ["path" :as node-path]))

(defn- find-on-classpath [classpath rel-path]
  (some (fn [dir]
          (let [f (node-path/join dir rel-path)]
            (when (fs/existsSync f) f)))
        (string/split classpath #":")))

(defn- setup-init-data
  "Setup initial data same as frontend.handler.repo/create-db"
  [conn {:keys [additional-config classpath]}]
  (let [config-content
        (cond-> (or (some-> (find-on-classpath classpath "templates/config.edn") fs/readFileSync str)
                    (do (println "Setting graph's config to empty since no templates/config.edn was found.")
                        "{}"))
          additional-config
          ;; TODO: Replace with rewrite-clj when it's available
          (string/replace-first #"(:file/name-format :triple-lowbar)"
                                (str "$1 "
                                     (string/replace-first (str additional-config) #"^\{(.*)\}$" "$1"))))]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data config-content))))

(defn init-conn
  "Create sqlite DB, initialize datascript connection and sync listener and then
  transacts initial data. Takes the following options:
   * :additional-config - Additional config map to merge into repo config.edn
   * :classpath - A java classpath string i.e. paths delimited by ':'. Used to find default config.edn
     that comes with Logseq"
  [dir db-name & [opts]]
  (fs/mkdirSync (node-path/join dir db-name) #js {:recursive true})
  ;; Same order as frontend.db.conn/start!
  (let [conn (sqlite-cli/open-db! dir db-name)]
    (db-pipeline/add-listener conn)
    (setup-init-data conn opts)
    conn))

(def build-blocks-tx
  "An alias for build-blocks-tx to specify default options for this ns"
  sqlite-build/build-blocks-tx)