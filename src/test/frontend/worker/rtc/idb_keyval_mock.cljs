(ns frontend.worker.rtc.idb-keyval-mock
  "Mock fns for frontend/idbkv.js"
  (:refer-clojure :exclude [get set keys])
  (:require [promesa.core :as p]))

(defrecord Store [db-name store-name *kvs])

(defn new-store [db-name store-name & _args]
  (Store. db-name store-name (atom {})))

(defn get
  [key store]
  (p/do! (clojure.core/get @(:*kvs store) key)))

(defn set
  [key val store]
  (p/do! (swap! (:*kvs store) assoc key val)))

(defn set-batch
  [items store]
  (p/do!
   (let [kvs (mapcat (fn [x] [(.-key x) (.-value x)]) items)]
     (swap! (:*kvs store) (partial apply assoc) kvs))))

(defn del
  [key store]
  (p/do! (swap! (:*kvs store) dissoc key)))

(defn keys
  [store]
  (p/do! (clojure.core/keys @(:*kvs store))))

(defn clear
  [store]
  (p/do! (reset! (:*kvs store) {})))
