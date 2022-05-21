(ns frontend.util.fs
  (:require [clojure.string :as string]
            ["path" :as path]))

;; TODO: move all file path related util functions to here

;; NOTE: This is not the same ignored-path? as src/electron/electron/utils.cljs.
;;       The assets directory is ignored.
;;
;; When in nfs-mode, dir is "", path is relative path to graph dir.
;; When in native-mode, dir and path are absolute paths.
(defn ignored-path?
  "Ignore path for ls-dir-files-with-handler! and reload-dir!"
  [dir path]
  (when (string? path)
    (or
     (some #(string/starts-with? path (str dir "/" %))
           ["." ".recycle" "assets" "node_modules" "logseq/bak" "version-files"])
     (some #(string/includes? path (str "/" % "/"))
           ["." ".recycle" "assets" "node_modules" "logseq/bak" "version-files"])
     (some #(string/ends-with? path %)
           [".DS_Store" "logseq/graphs-txid.edn" "logseq/broken-config.edn"])
     ;; hidden directory or file
     (let [relpath (path/relative dir path)]
       (or (re-find #"/\.[^.]+" relpath)
           (re-find #"^\.[^.]+" relpath)))
     (let [path (string/lower-case path)]
       (and
        (not (string/blank? (path/extname path)))
        (not
         (some #(string/ends-with? path %)
               [".md" ".markdown" ".org" ".js" ".edn" ".css"])))))))
