(ns ^:node-only logseq.common.graph
  "This ns provides common fns for a graph directory and only runs in a node environment"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]))

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
  notifications"
  [dir path]
  (when (string? path)
    (or
     (some #(string/starts-with? path (str dir "/" %))
           ["." ".recycle" "node_modules" "logseq/bak" "version-files"])
     (some #(string/includes? path (str "/" % "/"))
           ["." ".recycle" "node_modules" "logseq/bak" "version-files"])
     (some #(string/ends-with? path %)
           [".DS_Store" "logseq/graphs-txid.edn"])
     ;; hidden directory or file
     (let [relpath (node-path/relative dir path)]
       (or (re-find #"/\.[^.]+" relpath)
           (re-find #"^\.[^.]+" relpath))))))

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