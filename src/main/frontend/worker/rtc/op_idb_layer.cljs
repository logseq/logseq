(ns frontend.worker.rtc.op-idb-layer
  "Fns to read/write client-ops from/into indexeddb."
  (:require ["/frontend/idbkv" :as idb-keyval]
            [cljs.core.async.interop :refer [p->c]]
            [promesa.core :as p]
            [logseq.db.sqlite.util :as sqlite-util]))

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


(defn- ops=>idb-items
  [ops]
  (keep
   (fn [op]
     (when-let [key (:epoch (second op))]
       {:key key :value op}))
   ops))

(defn <reset!
  [repo ops graph-uuid local-tx]
  (p->c
   ;; ensure return a promise
   (p/do!
    (when-let [store (ensure-store repo)]
      (let [idb-items (ops=>idb-items ops)]
        (p/do!
         (idb-keyval/clear store)
         (idb-keyval/setBatch (clj->js idb-items) store)
         (when graph-uuid
           (idb-keyval/set "graph-uuid" graph-uuid store))
         (when local-tx
           (idb-keyval/set "local-tx" local-tx store))))))))


(defn <read
  [repo]
  ;; ensure return a promise
  (p/do!
   (when-let [store (ensure-store repo)]
     (p/let [idb-keys (idb-keyval/keys store)]
       (-> (p/all (mapv (fn [k] (p/chain (idb-keyval/get k store) (partial vector k))) idb-keys))
           (p/then (fn [items] (mapv #(js->clj % :keywordize-keys true) items))))))))
