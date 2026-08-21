(ns logseq.cli.common
  "Common fns between CLI and electron"
  (:require ["fs-extra" :as fs]
            ["path" :as node-path]
            [logseq.common.config :as common-config]
            [logseq.common.file-graph-import :as file-graph-import]
            [logseq.common.graph :as common-graph]
            [logseq.common.graph-dir :as graph-dir]))

(defn publish-file-graph-import!
  [graphs-dir staging-repo target-repo]
  (let [graphs-dir (common-graph/expand-home graphs-dir)]
    (when-not (file-graph-import/staging-repo? staging-repo)
      (throw (ex-info "source is not a file graph import staging graph"
                      {:code :invalid-import-staging-graph
                       :repo staging-repo})))
    (when (or (not (seq target-repo))
              (file-graph-import/staging-repo? target-repo))
      (throw (ex-info "target cannot be a file graph import staging graph"
                      {:code :invalid-import-target-graph
                       :repo target-repo})))
    (let [staging-path (node-path/join graphs-dir (graph-dir/repo->encoded-graph-dir-name staging-repo))
          target-path (node-path/join graphs-dir (graph-dir/repo->encoded-graph-dir-name target-repo))]
      (when-not (and (fs/existsSync staging-path)
                     (.isDirectory (fs/statSync staging-path)))
        (throw (ex-info "file graph import staging graph does not exist"
                        {:code :import-staging-graph-not-found
                         :repo staging-repo})))
      (when (fs/existsSync target-path)
        (throw (ex-info "target graph already exists"
                        {:code :graph-already-exists
                         :repo target-repo})))
      (fs/moveSync staging-path target-path #js {:overwrite false})
      target-path)))

(defn- existing-graph-dir-name
  [graphs-dir repo]
  (let [graph-dir-key (graph-dir/repo->graph-dir-key repo)
        encoded-name (graph-dir/repo->encoded-graph-dir-name repo)]
    (or
     (when (fs/existsSync (node-path/join graphs-dir encoded-name))
       encoded-name)
     (when (fs/existsSync graphs-dir)
       (->> (common-graph/read-directories graphs-dir)
            (remove #(= % common-config/unlinked-graphs-dir))
            (some #(when (= graph-dir-key (graph-dir/decode-graph-dir-name %))
                     %)))))))

(defn unlink-graph!
  "Unlinks the given repo by moving it to the 'Unlinked graphs' dir.
   Returns path of unlinked dir if move is successful or nil if not"
  ([repo]
   (unlink-graph! (common-graph/expand-home (common-graph/get-default-graphs-dir)) repo))
  ([graphs-dir repo]
   (let [graphs-dir (common-graph/expand-home graphs-dir)]
     (when-let [graph-dir-name (existing-graph-dir-name graphs-dir repo)]
       (let [path (node-path/join graphs-dir graph-dir-name)
             unlinked (node-path/join graphs-dir common-config/unlinked-graphs-dir)
             new-path (node-path/join unlinked graph-dir-name)
             new-path-exists? (fs/existsSync new-path)
             new-path' (if new-path-exists?
                         (node-path/join unlinked (str graph-dir-name "-" (random-uuid)))
                         new-path)]
         (fs/ensureDirSync unlinked)
         (fs/moveSync path new-path')
         new-path')))))

(defn cleanup-file-graph-imports!
  ([]
   (cleanup-file-graph-imports! (common-graph/get-db-graphs-dir)))
  ([graphs-dir]
   (let [graphs-dir (common-graph/expand-home graphs-dir)]
     (when (fs/existsSync graphs-dir)
       (->> (fs/readdirSync graphs-dir #js {:withFileTypes true})
            (remove #(.isSymbolicLink ^js %))
            (filter #(.isDirectory ^js %))
            (map #(.-name ^js %))
            (keep graph-dir/decode-graph-dir-name)
            (filter file-graph-import/staging-repo?)
            (keep #(unlink-graph! graphs-dir %))
            (vec))))))
