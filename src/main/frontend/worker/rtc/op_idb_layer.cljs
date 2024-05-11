(ns frontend.worker.rtc.op-idb-layer
  "Fns to read/write client-ops from/into indexeddb."
  (:require ["/frontend/idbkv" :as idb-keyval]
            [promesa.core :as p]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db :as ldb]))

(def stores (atom {}))

(defn- ensure-store
  "Return nil when 'repo' is not a db-graph"
  [repo]
  {:pre [(some? repo)]}
  (when (sqlite-util/db-based-graph? repo)
    (if-let [s (@stores repo)]
      s
      (do (swap! stores assoc repo (idb-keyval/newStore (str "rtc-ops-" repo) "ops"))
          (@stores repo)))))

(defn <reset2!
  [repo v]
  (p/do!
   (when-let [store (ensure-store repo)]
     (let [v (ldb/write-transit-str v)]
       (idb-keyval/set "v" v store)))))

(defn <read2
  [repo]
  (p/do!
   (when-let [store (ensure-store repo)]
     (p/let [v (idb-keyval/get "v" store)]
       (when v
         (ldb/read-transit-str v))))))
