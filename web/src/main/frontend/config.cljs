(ns frontend.config
  (:require [clojure.set :as set]
            [frontend.state :as state]))

(defonce dev? ^boolean goog.DEBUG)
;; (defonce dev? true)

(def website
  (if dev?
    "http://localhost:3000"
    "https://logseq.com"))

(def api
  (if dev?
    "http://localhost:3000/api/v1/"
    (str website "/api/v1/")))

(def asset-domain "https://asset.logseq.com")

(defn asset-uri
  [path]
  (if dev? path
      (str asset-domain path)))

(defn git-pull-secs
  []
  (if dev?
    (* 60 5)
    (or 60 (get-in @state/state [:config :git-pull-secs]))))

(defn git-push-secs
  []
  (or 10 (get-in @state/state [:config :git-push-secs])))

(defn git-repo-status-secs
  []
  (or 10 (get-in @state/state [:config :git-push-secs])))

(defn text-formats
  []
  (let [config-formats (some->> (get-in @state/state [:config :text-formats])
                                (map :keyword)
                                (set))]
    (set/union
     config-formats
     #{:json :org :md :xml :yml :dat :asciidoc :rst :txt :markdown :adoc :html :js :ts :edn :clj :ml :rb :ex :erl :java :php :c
       :excalidraw})))

(defn img-formats
  []
  (let [config-formats (some->> (get-in @state/state [:config :image-formats])
                                (map :keyword)
                                (set))]
    (set/union
     config-formats
     #{:gif :svg :jpeg :ico :png :jpg :bmp})))

(def html-render-formats
  #{:adoc :asciidoc})

(defn supported-formats
  []
  (set/union (text-formats)
             (img-formats)))

(defonce hiccup-support-formats
  #{:org :markdown})

(def config-file "logseq.edn")

(def mobile?
  (re-find #"Mobi" js/navigator.userAgent))

;; Format

(defn get-heading-pattern
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "*"
      :markdown
      "#"

      "")))

(defn get-hr
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "-----"
      :markdown
      "---"
      "")))

(defn get-bold
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "*"
      :markdown
      "**"
      "")))

(defn get-italic
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "/"
      :markdown
      "__"
      "")))
(defn get-underline
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "/"
      :markdown
      "__"
      "")))
(defn get-strike-through
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "+"
      :markdown
      "~~"
      "")))

(defn get-highlight
  [format]
  "^^")

(defn get-code
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "~"
      :markdown
      "`"
      "")))

(defn get-subscript
  [format]
  "_")

(defn get-superscript
  [format]
  "^")

(defn default-empty-heading
  ([format]
   (default-empty-heading format 2))
  ([format n]
   (let [heading-pattern (get-heading-pattern format)]
     (apply str (repeat n heading-pattern)))))

(defonce default-draw-directory "draws")
