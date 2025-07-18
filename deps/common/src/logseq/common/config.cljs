(ns logseq.common.config
  "Common config constants and fns that are shared between deps and app"
  (:require [clojure.string :as string]))

(goog-define PUBLISHING false)

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

(defonce db-version-prefix "logseq_db_")
(defonce file-version-prefix "logseq_local_")

(defonce local-assets-dir "assets")
(defonce unlinked-graphs-dir "Unlinked graphs")

(defonce favorites-page-name "$$$favorites")
(defonce views-page-name "$$$views")
(defonce library-page-name "Library")
(defonce quick-add-page-name "Quick add")

(defn local-asset?
  [s]
  (and (string? s)
       (re-find (re-pattern (str "^[./]*" local-assets-dir)) s)))

(defn local-protocol-asset?
  [s]
  (when (string? s)
    (string/starts-with? s asset-protocol)))

(defn remove-asset-protocol
  [s]
  (if (local-protocol-asset? s)
    (-> s
        (string/replace-first asset-protocol "file://"))
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

(defn create-config-for-db-graph
  "Given a new config.edn file string, creates a config.edn for use with only DB graphs"
  [config]
  (string/replace config #"(?m)[\s]*;; == FILE GRAPH CONFIG ==(?:.|\n)*?;; == END OF FILE GRAPH CONFIG ==\n?" ""))

(def file-only-config
  "File only config keys that are deprecated in DB graphs along with
  descriptions for their deprecation."
  (merge
   (zipmap
    [:file/name-format
     :file-sync/ignore-files
     :hidden
     :ignored-page-references-keywords
     :journal/file-name-format
     :journal/page-title-format
     :journals-directory
     :logbook/settings
     :org-mode/insert-file-link?
     :pages-directory
     :preferred-workflow
     :property/separated-by-commas
     :property-pages/excludelist
     :srs/learning-fraction
     :srs/initial-interval
     :whiteboards-directory]
    (repeat "is not used in DB graphs"))
   {:preferred-format
    "is not used in DB graphs as there is only markdown mode."
    :property-pages/enabled?
    "is not used in DB graphs as all properties have pages"
    :block-hidden-properties
    "is not used in DB graphs as hiding a property is done in its configuration"
    :feature/enable-block-timestamps?
    "is not used in DB graphs as it is always enabled"
    :favorites
    "is not stored in config for DB graphs"
    :default-templates
    "is replaced by #Template and the `Apply template to tags` property"}))
