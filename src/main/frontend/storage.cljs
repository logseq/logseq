(ns frontend.storage
  "Provides fns for most common operations with localStorage. Assumes
  localStorage values are edn"
  (:refer-clojure :exclude [get set remove])
  (:require [cljs.reader :as reader]
            [frontend.spec.storage :as storage-spec]
            [cljs.spec.alpha :as s]
            [frontend.util :as util]))

;; TODO: refactor: separate side effects
(defn- local-storage
  []
  (when-not util/node-test?
    (some-> js/globalThis (.-localStorage))))

(defn get
  [key]
  (some-> (local-storage)
          (.getItem (name key))
          reader/read-string))

(defn set
  [key value]
  ;; Prevent invalid data from being saved into storage
  (s/assert ::storage-spec/local-storage
            ;; Translate key to keyword for spec as not all keys are keywords
            {(keyword key) value})
  (when-let [storage (local-storage)]
    (.setItem ^js storage (name key) (pr-str value))))

(comment
  (defn get-transit
    [key]
    (when-let [storage (local-storage)]
      (dt/read-transit-str ^js (.getItem storage (name key))))))

(defn remove
  [key]
  (when-let [storage (local-storage)]
    (.removeItem ^js storage (name key))))

(comment
  (defn clear
    []
    (when-let [storage (local-storage)]
      (.clear ^js storage))))
