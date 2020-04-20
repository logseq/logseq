(ns frontend.config
  (:require [clojure.set :as set]))

(defonce tasks-org "tasks.org")
(defonce hidden-file ".hidden")
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

(def auto-pull-secs 60)
(def auto-push-secs 10)

;; Add coding too

(defonce text-formats
  #{:json :org :md :xml :yml :dat :asciidoc :rst :txt :markdown :adoc :html :js :ts :clj :ml :rb :ex :erl :java :php :c})

(defonce html-render-formats
  #{:org :md :markdown
    :adoc :asciidoc})

(defonce img-formats
  #{:gif :svg :jpeg :ico :png :jpg :bmp})

(defonce all-formats
  (set/union text-formats img-formats))
