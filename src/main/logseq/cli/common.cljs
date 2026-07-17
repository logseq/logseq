(ns logseq.cli.common
  "Common fns between CLI and electron"
  (:require ["fs-extra" :as fs]
            ["path" :as node-path]
            [logseq.melange.bridge.common.api :as melange-common]
            [logseq.melange.bridge.platform.node :as platform-node]))

(defn unlink-graph!
  "Unlinks the given repo by moving it to the 'Unlinked graphs' dir.
   Returns path of unlinked dir if move is successful or nil if not"
  ([repo]
   (unlink-graph! (platform-node/expand-home (platform-node/get-default-graphs-dir)) repo))
  ([graphs-dir repo]
   (let [graph-dir-name (melange-common/repo-to-encoded-graph-dir-name repo)
         graphs-dir (platform-node/expand-home graphs-dir)
         path (node-path/join graphs-dir graph-dir-name)
         unlinked (node-path/join graphs-dir melange-common/unlinked-graphs-dir)
         new-path (node-path/join unlinked graph-dir-name)
         new-path-exists? (fs/existsSync new-path)
         new-path' (if new-path-exists?
                     (node-path/join unlinked (str graph-dir-name "-" (random-uuid)))
                     new-path)]
     (when (fs/existsSync path)
       (fs/ensureDirSync unlinked)
       (fs/moveSync path new-path')
       new-path'))))
