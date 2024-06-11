(ns ^:node-only logseq.outliner.db-pipeline
  "This ns provides a datascript listener for DB graphs and helper fns that
  build on top of it.  The listener adds additional changes that the frontend
  also adds per transact.  Missing features from frontend.worker.pipeline including:
   * Deleted blocks don't update effected :block/tx-id
   * Delete empty property parent"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]
            ["fs" :as fs]
            ["path" :as node-path]))


(defn- rebuild-block-refs
  [{:keys [db-after]} blocks]
  (mapcat (fn [block]
            (when (d/entity db-after (:db/id block))
              (let [refs (outliner-pipeline/db-rebuild-block-refs db-after block)]
                (when (seq refs)
                  [[:db/retract (:db/id block) :block/refs]
                   {:db/id (:db/id block)
                    :block/refs refs}]))))
          blocks))

(defn- invoke-hooks
  "Modified copy of frontend.worker.pipeline/invoke-hooks that doesn't
  handle :block/tx-id"
  [conn tx-report]
  (when (not (get-in tx-report [:tx-meta :pipeline-replace?]))
    (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
          refs-tx-report (when-let [refs-tx (and (seq blocks) (rebuild-block-refs tx-report blocks))]
                           (d/transact! conn refs-tx {:pipeline-replace? true}))
          blocks' (if refs-tx-report
                    (keep (fn [b] (d/entity (:db-after refs-tx-report) (:db/id b))) blocks)
                    blocks)
          block-path-refs-tx (distinct (outliner-pipeline/compute-block-path-refs-tx tx-report blocks'))]
      (when (seq block-path-refs-tx)
        (d/transact! conn block-path-refs-tx {:pipeline-replace? true})))))

(defn add-listener
  "Adds a listener to the datascript connection to add additional changes from outliner.pipeline"
  [conn]
  (d/listen! conn :pipeline-updates (fn pipeline-updates [tx-report]
                                      (invoke-hooks conn tx-report))))

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
  (let [conn (sqlite-db/open-db! dir db-name)]
    (add-listener conn)
    (setup-init-data conn opts)
    conn))

(def build-blocks-tx
  "An alias for build-blocks-tx to specify default options for this ns"
  sqlite-build/build-blocks-tx)