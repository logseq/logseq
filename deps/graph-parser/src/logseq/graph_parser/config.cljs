(ns logseq.graph-parser.config
  "Config that is shared between graph-parser and rest of app"
  (:require [logseq.graph-parser.util :as gp-util]
            [clojure.set :as set]
            [clojure.string :as string]))

(def app-name
  "Copy of frontend.config/app-name. Too small to couple to main app"
  "logseq")

(defonce local-assets-dir "assets")

(defn local-asset?
  [s]
  (gp-util/safe-re-find (re-pattern (str "^[./]*" local-assets-dir)) s))

(defonce default-draw-directory "draws")
;; TODO read configurable value?
(defonce default-whiteboards-directory "whiteboards")

(defn draw?
  [path]
  (string/starts-with? path default-draw-directory))

(defn whiteboard?
  [path]
  (and path
       (string/includes? path (str default-whiteboards-directory "/"))
       (string/ends-with? path ".edn")))

;; TODO: rename
(defonce mldoc-support-formats
  #{:org :markdown :md})

(defn mldoc-support?
  [format]
  (contains? mldoc-support-formats (keyword format)))

(defn text-formats
  []
  #{:json :org :md :yml :dat :asciidoc :rst :txt :markdown :adoc :html :js :ts :edn :clj :ml :rb :ex :erl :java :php :c :css
    :excalidraw :tldr :sh})

(defn img-formats
  []
  #{:gif :svg :jpeg :ico :png :jpg :bmp :webp})

(defn supported-formats
  []
  (set/union (text-formats)
             (img-formats)))

(defn get-date-formatter
  [config]
  (or
   (:journal/page-title-format config)
   ;; for compatibility
   (:date-formatter config)
   "MMM do, yyyy"))

(defn get-block-pattern
  [format]
  (let [format' (keyword format)]
    (case format'
      :org
      "*"

      "-")))
