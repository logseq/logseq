(ns frontend.storage
  (:refer-clojure :exclude [get set remove])
  (:require [cljs.reader :as reader]
            [datascript.transit :as dt]
            [frontend.util :as util]))

;; TODO: refactor: separate side effects
(defn get
  [key]
  (when-not util/node-test?
    (reader/read-string ^js (.getItem js/localStorage (name key)))))

(defn set
  [key value]
  (when-not util/node-test?
    (.setItem ^js js/localStorage (name key) (pr-str value))))

(defn get-transit
  [key]
  (when-not util/node-test?
    (dt/read-transit-str ^js (.getItem js/localStorage (name key)))))

(defn remove
  [key]
  (when-not util/node-test?
    (.removeItem ^js js/localStorage (name key))))

(defn clear
  []
  (when-not util/node-test?
    (.clear ^js js/localStorage)))
