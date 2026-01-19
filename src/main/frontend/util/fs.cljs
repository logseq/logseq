;; TODO: move all file path related util functions to here (excepts those fit graph-parser)

(ns frontend.util.fs
  "Misc util fns built on top of frontend.fs"
  (:require ["path" :as node-path]
            [clojure.string :as string]
            [frontend.common.file.util :as wfu]))

;; NOTE: This is not the same ignored-path? as src/electron/electron/utils.cljs.
;;       The assets directory is ignored.
;;
;; When in native-mode, dir and path are absolute paths.
(defn ignored-path?
  "Ignore path for ls-dir-files-with-handler! and reload-dir!"
  [dir path]
  (let [ignores ["." ".recycle" "node_modules" "logseq/bak"
                 "logseq/version-files" "logseq/graphs-txid.edn"]]
    (when (string? path)
      (or
       (some #(string/starts-with? path
                                   (if (= dir "")
                                     %
                                     (str dir "/" %))) ignores)
       (some #(string/includes? path (if (= dir "")
                                       (str "/" % "/")
                                       (str % "/"))) ignores)
       (some #(string/ends-with? path %)
             [".DS_Store" "logseq/graphs-txid.edn"])
      ;; hidden directory or file
       (let [relpath (node-path/relative dir path)]
         (or (re-find #"/\.[^.]+" relpath)
             (re-find #"^\.[^.]+" relpath)))
       (let [path (string/lower-case path)]
         (and
          (not (string/blank? (node-path/extname path)))
          (not
           (some #(string/ends-with? path %)
                 [".md" ".markdown" ".org" ".js" ".edn" ".css"]))))))))

(def include-reserved-chars? wfu/include-reserved-chars?)
(def windows-reserved-filebodies wfu/windows-reserved-filebodies)
(defn file-name-sanity
  [name _format]
  (wfu/file-name-sanity name))
