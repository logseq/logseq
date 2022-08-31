(ns logseq.graph-parser.config
  "Config that is shared between graph-parser and rest of app"
  (:require [clojure.set :as set]
            [clojure.string :as string]))

(def app-name
  "Copy of frontend.config/app-name. Too small to couple to main app"
  "logseq")

(defonce asset-protocol "assets://")
(defonce capacitor-protocol "capacitor://")
(defonce capacitor-protocol-with-prefix (str capacitor-protocol "localhost/_capacitor_file_"))

(defonce local-assets-dir "assets")

(defn local-asset?
  [s]
  (and (string? s)
       (re-find (re-pattern (str "^[./]*" local-assets-dir)) s)))

(defn local-protocol-asset?
  [s]
  (when (string? s)
    (or (string/starts-with? s asset-protocol)
        (string/starts-with? s capacitor-protocol))))

(defn remove-asset-protocol
  [s]
  (if (local-protocol-asset? s)
    (-> s
        (string/replace-first asset-protocol "")
        (string/replace-first capacitor-protocol-with-prefix "file://"))
    s))

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

(defn text-formats
  []
  #{:json :org :md :yml :dat :asciidoc :rst :txt :markdown :adoc :html :js :ts :edn :clj :ml :rb :ex :erl :java :php :c :css
    :excalidraw :sh})

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
