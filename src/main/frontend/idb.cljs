(ns frontend.idb
  (:require ["localforage" :as localforage]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [promesa.core :as p]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.util :as util]
            [frontend.storage :as storage]))

;; offline db
(def store-name "dbs")
(.config localforage
         (bean/->js
          {:name "logseq-datascript"
           :version 1.0
           :storeName store-name}))

(defonce localforage-instance (.createInstance localforage store-name))

(defn clear-idb!
  []
  (p/let [_ (.clear localforage-instance)
          dbs (js/window.indexedDB.databases)]
    (doseq [db dbs]
      (js/window.indexedDB.deleteDatabase (gobj/get db "name")))))

(defn clear-local-storage-and-idb!
  []
  (storage/clear)
  (clear-idb!))

(defn remove-item!
  [key]
  (when key
    (.removeItem localforage-instance key)))

(defn set-item!
  [key value]
  (when key
    (.setItem localforage-instance key value)))

(defn get-item
  [key]
  (when key
    (.getItem localforage-instance key)))

(defn get-keys
  []
  (.keys localforage-instance))

(defn get-nfs-dbs
  []
  (p/let [ks (get-keys)]
    (->> (filter (fn [k] (string/starts-with? k (str config/idb-db-prefix config/local-db-prefix))) ks)
         (map #(string/replace-first % config/idb-db-prefix "")))))

(defn clear-local-db!
  [repo]
  (when repo
    (p/let [ks (get-keys)
            ks (filter (fn [k] (string/starts-with? k (str config/local-handle "/" repo))) ks)]
      (when (seq ks)
        (p/all (map (fn [key]
                      (remove-item! key)) ks))))))
