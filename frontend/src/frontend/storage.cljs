(ns frontend.storage
  (:refer-clojure :exclude [get set remove])
  (:require [cljs.reader :as reader]))

(defn get
  [key]
  (reader/read-string ^js (.getItem js/localStorage (name key))))

(defn set
  [key value]
  (.setItem ^js js/localStorage (name key) (pr-str value)))

(defn remove
  [key]
  (.removeItem ^js js/localStorage (name key)))

(defn clear
  []
  (.clear ^js js/localStorage))
