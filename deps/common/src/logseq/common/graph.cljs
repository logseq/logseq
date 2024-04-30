(ns ^:node-only logseq.common.graph
  "This ns provides common fns for a graph directory and only runs in a node environment"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.common.path :as path]))

(def ^:private win32?
  "Copy of electron.utils/win32? . Too basic to couple the two libraries"
  (= (.-platform js/process) "win32"))

(defn- fix-win-path!
  "Copy of electron.utils/fix-win-path!. Too basic to couple the two libraries"
  [path]
  (when (not-empty path)
    (if win32?
      (string/replace path "\\" "/")
      path)))

(defn readdir
  "Reads given directory recursively and returns all filenames. Also applies
  some graph-specific filtering e.g. symbolic links and files starting with '.'
  are removed"
  [root-dir]
  (->> (tree-seq
        (fn [[is-dir _fpath]]
          is-dir)
        (fn [[_is-dir dir]]
          (let [files (fs/readdirSync dir #js {:withFileTypes true})]
            (->> files
                 (remove #(.isSymbolicLink ^js %))
                 (remove #(string/starts-with? (.-name ^js %) "."))
                 (map #(do
                         [(.isDirectory %)
                          (node-path/join dir (.-name %))])))))
        [true root-dir])
       (filter (complement first))
       (map second)
       (map fix-win-path!)
       (vec)))

(defn ignored-path?
  "Given a graph directory and path, returns truthy value on whether the path is
  ignored. Useful for contexts like reading a graph's directory and file watcher
  notifications

Rules:

- Paths starting with '.' are ignored
- Paths ending with '.DS_Store' are ignored
- Dynamic caches used by Logseq are ignored: graph-txid.edn and pages-metadata.edn
- Contents in '**/node_modules/' are ignored
- Contents in '/logseq/.recycle/' are ignored
- Contents in '/logseq/bak/' are ignored
- Contents in  with '/logseq/version-files/' are ignored
"
  [dir path]
  (let [dir (path/path-normalize dir)
        path (path/path-normalize path)
        rpath (path/trim-dir-prefix dir path)]
    (when (string? path)
      (or
       (some #(string/starts-with? rpath %)
             ["." "logseq/.recycle" "logseq/bak" "logseq/version-files"])
       (contains? #{"logseq/graphs-txid.edn" "logseq/pages-metadata.edn"} rpath)
       (some #(string/includes? rpath (str "/" % "/"))
             ["node_modules"])
       (some #(string/ends-with? rpath %)
             [".DS_Store"])
         ;; hidden directory or file
       (or (re-find #"/\.[^.]+" rpath)
           (re-find #"^\.[^.]+" rpath))))))

(def ^:private allowed-formats
  #{:org :markdown :md :edn :json :js :css :excalidraw :tldr})

(defn- get-ext
  [p]
  (-> (node-path/extname p)
      (subs 1)
      keyword))

(defn get-files
  "Given a graph's root dir, returns a list of all files that it recognizes.
   Graph dir must be an absolute path in order for ignoring to work correctly"
  [graph-dir]
  (->> (readdir graph-dir)
       (remove (partial ignored-path? graph-dir))
       (filter #(contains? allowed-formats (get-ext %)))))
