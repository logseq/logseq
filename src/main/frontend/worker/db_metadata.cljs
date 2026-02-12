(ns frontend.worker.db-metadata
  "Fns to read/write metadata.edn file for db-based."
  (:require [frontend.worker.platform :as platform]))

(defn- gen-key
  [repo]
  (str "metadata###" repo))

(defn <store
  [repo metadata-str]
  (platform/kv-set! (platform/current) (gen-key repo) metadata-str))

(defn <get
  [repo]
  (platform/kv-get (platform/current) (gen-key repo)))
