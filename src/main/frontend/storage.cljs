(ns frontend.storage
  "Provides fns for most common operations with localStorage. Assumes
  localStorage values are edn"
  (:refer-clojure :exclude [get set remove])
  (:require [cljs.reader :as reader]
            [datascript.transit :as dt]
            [frontend.spec.storage :as storage-spec]
            [cljs.spec.alpha :as s]
            [frontend.util :as util]))

;; TODO: refactor: separate side effects
(defn get
  [key]
  (when-not util/node-test?
    (reader/read-string ^js (.getItem js/localStorage (name key)))))

(defn set
  [key value]
  ;; Prevent invalid data from being saved into storage
  (s/assert ::storage-spec/local-storage
            ;; Translate key to keyword for spec as not all keys are keywords
            {(keyword key) value})
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
