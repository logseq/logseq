(ns frontend.storage
  (:refer-clojure :exclude [get set remove])
  (:require [cljs.reader :as reader]))

;; TODO: deprecate this, will persistent datascript
(defn get
  [key]
  (reader/read-string ^js (.getItem js/localStorage (name key))))

(defn set
  [key value]
  (.setItem ^js js/localStorage (name key) (pr-str value)))

(defn get-json
  [key]
  (when-let [value (.getItem js/localStorage (name key))]
    (js/JSON.parse value)))

(defn set-json
  [key value]
  (.setItem ^js js/localStorage (name key) (js/JSON.stringify value)))

(defn remove
  [key]
  (.removeItem ^js js/localStorage (name key)))

(defn clear
  []
  (.clear ^js js/localStorage))
