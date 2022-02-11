(ns frontend.util.fs
  (:require [clojure.string :as string]
            ["path" :as path]))

;; TODO: move all file path related util functions to here

;; keep same as ignored-path? in src/electron/electron/utils.cljs
;; TODO: merge them
(defn ignored-path?
  [dir path]
  (when (string? path)
    (or
     (some #(string/starts-with? path (str dir "/" %))
           ["." ".recycle" "assets" "node_modules" "logseq/bak"])
     (some #(string/includes? path (str "/" % "/"))
           ["." ".recycle" "assets" "node_modules" "logseq/bak"])
     (string/ends-with? path ".DS_Store")
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