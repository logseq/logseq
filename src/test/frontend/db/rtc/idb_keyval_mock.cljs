(ns frontend.db.rtc.idb-keyval-mock
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

(defn del
  [key store]
  (p/do! (swap! (:*kvs store) dissoc key)))

(defn keys
  [store]
  (p/do! (clojure.core/keys @(:*kvs store))))
