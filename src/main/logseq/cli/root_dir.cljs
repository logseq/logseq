(ns logseq.cli.root-dir
  "Root-dir validation and path derivation for the CLI and db-worker-node."
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [logseq.common.graph :as common-graph]))

(defn default-root-dir
  []
  (node-path/join (.homedir os) "logseq"))

(defn normalize-root-dir
  [path]
  (node-path/resolve (common-graph/expand-home (or path (default-root-dir)))))

(defn graphs-dir
  [root-dir]
  (node-path/join (normalize-root-dir root-dir) "graphs"))

(defn ensure-root-dir!
  [path]
  (let [path (normalize-root-dir path)]
    (try
      (when-not (fs/existsSync path)
        (fs/mkdirSync path #js {:recursive true}))
      (let [stat (fs/statSync path)]
        (when-not (.isDirectory stat)
          (throw (ex-info (str "root-dir is not a directory: " path)
                          {:code :root-dir-permission
                           :path path
                           :cause "ENOTDIR"}))))
      (let [constants (.-constants fs)
            mode (bit-or (.-R_OK constants) (.-W_OK constants))]
        (fs/accessSync path mode))
      path
      (catch :default e
        (if (= :root-dir-permission (:code (ex-data e)))
          (throw e)
          (throw (ex-info (str "root-dir is not readable/writable: " path)
                          {:code :root-dir-permission
                           :path path
                           :cause (.-code e)})))))))
