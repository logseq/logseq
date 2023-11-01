(ns frontend.db.rtc.ops-idb-store
  "Fns to RW ops in indexeddb"
  (:require ["/frontend/idbkv" :as idb-keyval]
            [promesa.core :as p]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs.core.async :as async]
            [cljs.core.async.interop :refer [p->c]]))


(def stores (atom {}))

(defn- ensure-store
  [repo]
  {:pre [(some? repo)]}
  (if-let [s (@stores repo)]
    s
    (do (swap! stores assoc repo (idb-keyval/newStore (str "rtc-ops-" repo) "ops"))
        (@stores repo))))

(defn <update-local-tx!
  [repo tx]
  (idb-keyval/set "local-tx" tx (ensure-store repo)))

(defn <update-graph-uuid!
  [repo graph-uuid]
  {:pre [(some? graph-uuid)]}
  (idb-keyval/set "graph-uuid" graph-uuid (ensure-store repo)))

(defn- <add-ops*!
  [repo ops]
  (let [store (ensure-store repo)
        key* (* 1000 (tc/to-long (t/now)))]
    (p/loop [key* key* ops ops]
      (let [[op & other-ops] ops]
        (when op
          (p/let [old-v (idb-keyval/get key* store)]
            (if old-v
              (p/recur (inc key*) ops)
              (p/do! (idb-keyval/set key* (clj->js op) store)
                     (p/recur (inc key*) other-ops)))))))))

(defonce ^:private add-ops-ch (async/chan 100))
(defonce #_:clj-kondo/ignore _add-ops-loop
  (let [id (random-uuid)]
    (async/go-loop []
      (prn ::add-ops-loop id)
      (if-let [[repo ops] (async/<! add-ops-ch)]
        (do (async/<! (p->c (<add-ops*! repo ops)))
            (recur))
        (recur)))))

(defn <add-ops!
  [repo ops]
  (async/go (async/>! add-ops-ch [repo ops])))

(defn <clear-ops!
  [repo keys]
  (let [store (ensure-store repo)]
    (p/all (map #(idb-keyval/del % store) keys))))

(defn <get-all-ops
  [repo]
  (p/let [store (ensure-store repo)
          keys (idb-keyval/keys store)]
    (-> (p/all (mapv (fn [k] (p/chain (idb-keyval/get k store) (partial vector k))) keys))
        (p/then (fn [items] (mapv #(js->clj % :keywordize-keys true) items))))))

(defn <get-graph-uuid
  [repo]
  (p/let [store (ensure-store repo)]
    (idb-keyval/get "graph-uuid" store)))

(comment
  (defn <get-local-tx
   [repo]
   (p/let [store (ensure-store repo)]
     (idb-keyval/get "local-tx" store))))
