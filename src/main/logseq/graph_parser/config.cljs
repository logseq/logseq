(ns ^:nbb-compatible logseq.graph-parser.config
  "Config that is shared between graph-parser and rest of app"
  (:require [logseq.graph-parser.util :as gp-util]
            [clojure.string :as string]))

(defonce local-assets-dir "assets")

(defn local-asset?
  [s]
  (gp-util/safe-re-find (re-pattern (str "^[./]*" local-assets-dir)) s))

(defonce default-draw-directory "draws")

(defn draw?
  [path]
  (string/starts-with? path default-draw-directory))

;; TODO: rename
(defonce mldoc-support-formats
  #{:org :markdown :md})

(defn mldoc-support?
  [format]
  (contains? mldoc-support-formats (keyword format)))
