(ns logseq.cli.common
  "Common fns between CLI and electron"
  (:require ["fs-extra" :as fs]
            ["path" :as node-path]
            [logseq.common.config :as common-config]
            [logseq.common.graph :as common-graph]
            [logseq.db.common.sqlite :as common-sqlite]))

(defn unlink-graph!
  "Unlinks the given repo by moving it to the 'Unlinked graphs' dir.
   Returns path of unlinked dir if move is successful or nil if not"
  [repo]
  (let [db-name (common-sqlite/sanitize-db-name repo)
        graphs-dir (common-graph/expand-home (common-graph/get-default-graphs-dir))
        path (node-path/join graphs-dir db-name)
        unlinked (node-path/join graphs-dir common-config/unlinked-graphs-dir)
        new-path (node-path/join unlinked db-name)
        new-path-exists? (fs/existsSync new-path)
        new-path' (if new-path-exists?
                    (node-path/join unlinked (str db-name "-" (random-uuid)))
                    new-path)]
    (when (fs/existsSync path)
      (fs/ensureDirSync unlinked)
      (fs/moveSync path new-path')
      new-path')))
