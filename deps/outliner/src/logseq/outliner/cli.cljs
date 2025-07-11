(ns ^:node-only logseq.outliner.cli
  "Primary ns for outliner CLI fns"
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["path" :as node-path]
            [borkdude.rewrite-edn :as rewrite]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.outliner.db-pipeline :as db-pipeline]))

(defn- find-on-classpath [classpath rel-path]
  (some (fn [dir]
          (let [f (node-path/join dir rel-path)]
            (when (fs/existsSync f) f)))
        (string/split classpath #":")))

(defn- pretty-print-merge
  "Merge map into string while preversing whitespace"
  [s m]
  (-> (reduce (fn [acc [k v]]
                (rewrite/assoc acc k v))
              (rewrite/parse-string s)
              m)
      str))

(defn- get-git-sha
  []
  (let [res (child-process/spawnSync "git"
                                     #js ["rev-parse" "--short" "HEAD"]
                                     #js {})]
    (when (zero? (.-status res))
      (string/trim (str (.-stdout res))))))

(defn- setup-init-data
  "Setup initial data same as frontend.handler.repo/create-db"
  [conn {:keys [additional-config classpath import-type]
         :or {import-type :cli/default}}]
  (let [config-content
        (cond-> (or (some-> (find-on-classpath classpath "templates/config.edn") fs/readFileSync str)
                    (do (println "Setting graph's config to empty since no templates/config.edn was found.")
                        "{}"))
          true
          (common-config/create-config-for-db-graph)
          additional-config
          (pretty-print-merge additional-config))
        git-sha (get-git-sha)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data config-content
                                                                 (merge {:import-type import-type}
                                                                        (when git-sha {:graph-git-sha git-sha}))))))

(defn init-conn
  "Create sqlite DB, initialize datascript connection and sync listener and then
  transacts initial data. Takes the following options:
   * :additional-config - Additional config map to merge into repo config.edn
   * :classpath - A java classpath string i.e. paths delimited by ':'. Used to find default config.edn
     that comes with Logseq"
  [& args*]
  (let [[args opts] (if (map? (last args*))
                      [(butlast args*) (last args*)]
                      [args* {}])
        ;; Only mkdir when a dir and db-name are passed
        _ (when (= 2 (count args))
            (fs/mkdirSync (apply node-path/join args) #js {:recursive true}))
        ;; Same order as frontend.db.conn/start!
        conn (apply sqlite-cli/open-db! args)]
    (db-pipeline/add-listener conn)
    (setup-init-data conn opts)
    conn))

(def build-blocks-tx
  "An alias for build-blocks-tx to specify default options for this ns"
  sqlite-build/build-blocks-tx)
