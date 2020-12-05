(ns frontend.storage
  (:refer-clojure :exclude [get set remove])
  (:require [cljs.reader :as reader]
            [datascript.transit :as dt]))

(defn get
  [key]
  (reader/read-string ^js (.getItem js/localStorage (name key))))

(defn set
  [key value]
  (.setItem ^js js/localStorage (name key) (pr-str value)))

(defn get-transit
  [key]
  (dt/read-transit-str ^js (.getItem js/localStorage (name key))))

(defn set-transit!
  [key value]
  (.setItem ^js js/localStorage (name key) (dt/write-transit-str value)))

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
