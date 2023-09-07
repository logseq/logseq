(ns frontend.idb
  "This system component provides indexedDB functionality"
  (:require ["/frontend/idbkv" :as idb-keyval :refer [Store]]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.storage :as storage]
            [goog.object :as gobj]
            [promesa.core :as p]))


;; offline db

;; To maintain backward compatibility


(defonce store (atom nil))

(defn clear-idb!
  []
  (when @store
    (->
     (p/let [_ (idb-keyval/clear @store)
             dbs (js/window.indexedDB.databases)]
       (doseq [db dbs]
         (js/window.indexedDB.deleteDatabase (gobj/get db "name"))))
     (p/catch (fn [_e])))))

(defn clear-local-storage-and-idb!
  []
  (storage/clear)
  (clear-idb!))

(defn remove-item!
  [key]
  (when (and key @store)
    (idb-keyval/del key @store)))

(defn set-item!
  [key value]
  (when (and key @store)
    (idb-keyval/set key value @store)))

(defn rename-item!
  [old-key new-key]
  (when (and old-key new-key @store)
    (p/let [value (idb-keyval/get old-key @store)]
      (when value
        (idb-keyval/set new-key value @store)
        (idb-keyval/del old-key @store)))))

(defn set-batch!
  [items]
  (when (and (seq items) @store)
    (idb-keyval/setBatch (clj->js items) @store)))

(defn get-item
  [key]
  (when (and key @store)
    (idb-keyval/get key @store)))

(defn get-keys
  []
  (when @store
    (idb-keyval/keys @store)))

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

(defn start
  "This component's only responsibility is to create a Store object"
  []
  (reset! store (Store. "localforage" "keyvaluepairs" 2)))
