(ns frontend.worker.db-metadata
  "Fns to read/write metadata.edn file for db-based."
  (:require ["/frontend/idbkv" :as idb-keyval]))

(defonce ^:private store (delay (idb-keyval/newStore "localforage" "keyvaluepairs" 2)))

(defn- gen-key
  [repo]
  (str "metadata###" repo))

(defn <store
  [repo metadata-str]
  (idb-keyval/set (gen-key repo) metadata-str @store))

(defn <get
  [repo]
  (idb-keyval/get (gen-key repo) @store))
