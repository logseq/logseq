(ns frontend.config
  (:require [clojure.set :as set]
            [frontend.state :as state]))

(defonce dev? ^boolean goog.DEBUG)

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
  (or 60 (get-in @state/state [:config :git-pull-secs])))

(defn git-push-secs
  []
  (or 10 (get-in @state/state [:config :git-push-secs])))

;; TODO: 1. add more formats
;;       2. configure in the file `logseq.json`

(defn text-formats
  []
  (let [config-formats (some->> (get-in @state/state [:config :text-formats])
                                (map :keyword)
                                (set))]
    (set/union
     config-formats
     #{:json :org :md :xml :yml :dat :asciidoc :rst :txt :markdown :adoc :html :js :ts :clj :ml :rb :ex :erl :java :php :c}
     )))

(defn img-formats
  []
  (let [config-formats (some->> (get-in @state/state [:config :image-formats])
                                (map :keyword)
                                (set))]
    (set/union
     config-formats
     #{:gif :svg :jpeg :ico :png :jpg :bmp})))

(defonce html-render-formats
  #{:org :md :markdown
    :adoc :asciidoc})

(defn supported-formats
  []
  (set/union (text-formats)
             (img-formats)))

(defonce hiccup-support-formats
  #{:org :markdown})

(defonce config-file "logseq.json")

(def mobile?
  (re-find #"Mobi" js/navigator.userAgent))

;; Format
(defonce default-empty-heading
  "** ")
