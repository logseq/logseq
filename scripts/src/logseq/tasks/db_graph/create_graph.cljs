(ns logseq.tasks.db-graph.create-graph
  "This ns provides fns to create a DB graph using EDN. See `init-conn` for
  initializing a DB graph with a datascript connection that syncs to a sqlite DB
  at the given directory. See `build-blocks-tx` for the EDN format to create a
  graph and current limitations"
  (:require [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [clojure.string :as string]
            [datascript.core :as d]
            ["fs" :as fs]
            ["path" :as node-path]
            [nbb.classpath :as cp]
            [logseq.db.sqlite.build :as sqlite-build]))

(defn- find-on-classpath [rel-path]
  (some (fn [dir]
          (let [f (node-path/join dir rel-path)]
            (when (fs/existsSync f) f)))
        (string/split (cp/get-classpath) #":")))

(defn- setup-init-data
  "Setup initial data same as frontend.handler.repo/create-db"
  [conn additional-config]
  (let [config-content
        (cond-> (or (some-> (find-on-classpath "templates/config.edn") fs/readFileSync str)
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
  transacts initial data"
  [dir db-name & {:keys [additional-config]}]
  (fs/mkdirSync (node-path/join dir db-name) #js {:recursive true})
  ;; Same order as frontend.db.conn/start!
  (let [conn (sqlite-db/open-db! dir db-name)]
    (db-pipeline/add-listener conn)
    (setup-init-data conn additional-config)
    conn))

(def build-blocks-tx sqlite-build/build-blocks-tx)