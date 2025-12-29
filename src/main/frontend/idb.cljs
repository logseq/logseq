(ns frontend.idb
  "This system component provides indexedDB functionality"
  (:require ["/frontend/idbkv" :as idb-keyval]))

;; offline db

;; To maintain backward compatibility

(defonce store (atom nil))

(defn remove-item!
  [key]
  (when (and key @store)
    (idb-keyval/del key @store)))

(defn set-item!
  [key value]
  (when (and key @store)
    (idb-keyval/set key value @store)))

(comment
  (defn rename-item!
    [old-key new-key]
    (when (and old-key new-key @store)
      (p/let [value (idb-keyval/get old-key @store)]
        (when value
          (idb-keyval/set new-key value @store)
          (idb-keyval/del old-key @store))))))

(comment
  (defn set-batch!
    [items]
    (when (and (seq items) @store)
      (idb-keyval/setBatch (clj->js items) @store))))

(defn get-item
  [key]
  (when (and key @store)
    (idb-keyval/get key @store)))

(defn start
  "This component's only responsibility is to create a Store object"
  []
  (when (nil? @store)
    (reset! store (idb-keyval/newStore "localforage" "keyvaluepairs" 2))))
