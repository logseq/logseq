(ns logseq.cli.data-dir
  "Data-dir validation and normalization for the CLI and db-worker-node."
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [logseq.common.graph :as common-graph]))

(defn normalize-data-dir
  [path]
  (node-path/resolve (common-graph/expand-home (or path (common-graph/get-default-graphs-dir)))))

(defn ensure-data-dir!
  [path]
  (let [path (normalize-data-dir path)]
    (try
      (when-not (fs/existsSync path)
        (fs/mkdirSync path #js {:recursive true}))
      (let [stat (fs/statSync path)]
        (when-not (.isDirectory stat)
          (throw (ex-info (str "data-dir is not a directory: " path)
                          {:code :data-dir-permission
                           :path path
                           :cause "ENOTDIR"}))))
      (let [constants (.-constants fs)
            mode (bit-or (.-R_OK constants) (.-W_OK constants))]
        (fs/accessSync path mode))
      path
      (catch :default e
        (if (= :data-dir-permission (:code (ex-data e)))
          (throw e)
          (throw (ex-info (str "data-dir is not readable/writable: " path)
                          {:code :data-dir-permission
                           :path path
                           :cause (.-code e)})))))))
