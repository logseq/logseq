(ns frontend.storage
  (:refer-clojure :exclude [get set remove])
  (:require [cljs.reader :as reader]
            [datascript.transit :as dt]
            [frontend.spec.storage :as storage-spec]
            [cljs.spec.alpha :as s]
            [frontend.util :as util]))

;; TODO: refactor: separate side effects
(defn get
  [key]
  (when-not (or util/node-test? util/exporter?)
    (reader/read-string ^js (.getItem js/localStorage (name key)))))

(defn set
  [key value]
  ;; Prevent invalid data from being saved into storage
  (s/assert ::storage-spec/local-storage
            ;; Translate key to keyword for spec as not all keys are keywords
            {(keyword key) value})
  (when-not (or util/node-test? util/exporter?)
    (.setItem ^js js/localStorage (name key) (pr-str value))))

(defn get-transit
  [key]
  (when-not (or util/node-test? util/exporter?)
    (dt/read-transit-str ^js (.getItem js/localStorage (name key)))))

(defn remove
  [key]
  (when-not (or util/node-test? util/exporter?)
    (.removeItem ^js js/localStorage (name key))))

(defn clear
  []
  (when-not (or util/node-test? util/exporter?)
    (.clear ^js js/localStorage)))
