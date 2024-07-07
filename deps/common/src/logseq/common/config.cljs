(ns logseq.common.config
  "Common config and constants that are shared between deps and app"
  (:require [clojure.string :as string]
            [goog.object :as gobj]))

(defn hidden?
  [path patterns]
  (let [path (if (and (string? path)
                      (= \/ (first path)))
               (subs path 1)
               path)]
    (some (fn [pattern]
            (let [pattern (if (and (string? pattern)
                                   (not= \/ (first pattern)))
                            (str "/" pattern)
                            pattern)]
              (string/starts-with? (str "/" path) pattern))) patterns)))

(defn remove-hidden-files
  "Removes files that match a pattern specified by :hidden config"
  [files config get-path-fn]
  (if-let [patterns (seq (:hidden config))]
    (remove (fn [file]
              (let [path (get-path-fn file)]
                (hidden? path patterns))) files)
    files))

(def app-name "logseq")

(defonce asset-protocol "assets://")
(defonce capacitor-protocol "capacitor://")
(defonce capacitor-prefix "_capacitor_file_")
(defonce capacitor-protocol-with-prefix (str capacitor-protocol "localhost/" capacitor-prefix))
(defonce capacitor-x-protocol-with-prefix (str (gobj/getValueByKeys js/globalThis "location" "href") capacitor-prefix))

(defonce local-assets-dir "assets")

(defonce favorites-page-name "$$$favorites")
(defonce views-page-name "$$$views")

(defn local-asset?
  [s]
  (and (string? s)
       (re-find (re-pattern (str "^[./]*" local-assets-dir)) s)))

(defn local-protocol-asset?
  [s]
  (when (string? s)
    (or (string/starts-with? s asset-protocol)
        (string/starts-with? s capacitor-protocol)
        (string/starts-with? s capacitor-x-protocol-with-prefix))))

(defn remove-asset-protocol
  [s]
  (if (local-protocol-asset? s)
    (-> s
        (string/replace-first asset-protocol "file://")
        (string/replace-first capacitor-protocol-with-prefix "file://")
        (string/replace-first capacitor-x-protocol-with-prefix "file://"))
    s))

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

(defn get-date-formatter
  [config]
  (or
   (:journal/page-title-format config)
   ;; for compatibility
   (:date-formatter config)
   "MMM do, yyyy"))

(defn get-preferred-format
  [config]
  (or
   (when-let [fmt (:preferred-format config)]
     (keyword (string/lower-case (name fmt))))
   :markdown))

(defn get-block-pattern
  [format]
  (let [format' (keyword format)]
    (case format'
      :org
      "*"

      "-")))
