(ns frontend.db.rtc.ops-idb-store
  "Fns to RW ops in indexeddb"
  (:require ["/frontend/idbkv" :as idb-keyval :refer [Store]]
            [promesa.core :as p]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs.core.async.interop :refer [p->c]]
            [cljs.core.async :as async :refer [poll!]]))


(def stores (atom {}))

(defn- ensure-store
  [graph-uuid]
  {:pre [(some? graph-uuid)]}
  (swap! stores assoc graph-uuid (Store. "rtc-ops" graph-uuid))
  (@stores graph-uuid))

(defn <update-local-tx!
  [graph-uuid tx]
  (idb-keyval/set "local-state" (clj->js {:local-tx tx}) (ensure-store graph-uuid)))

(defn <add-op!
  [graph-uuid op]
  (p/let [store (ensure-store graph-uuid)
          now (tc/to-long (t/now))
          old-v (idb-keyval/get now store)
          key (if old-v (inc now) now)]
    (idb-keyval/set key (clj->js op) store)))


(defn <get-all-ops
  [graph-uuid]
  (p/let [store (ensure-store graph-uuid)
          keys (idb-keyval/keys store)]
    (prn keys)
    (-> (p/all (mapv (fn [k] (p/chain (idb-keyval/get k store) (partial vector k))) keys))
        (p/then (fn [items] (mapv #(js->clj % :keywordize-keys true) items))))))
