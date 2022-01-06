(ns frontend.handler.file-sync
  (:require [cljs.core.async :as async :refer [go timeout go-loop offer! poll! chan <! >!]]
            [frontend.fs.macro :refer [exception-> exception->>]]
            [frontend.fs.sync :as sync]
            [frontend.state :as state]
            [frontend.util.persist-var :as persist-var]
            [frontend.handler.notification :as notification]))


(def refresh-file-sync-component (atom false))

(defn graph-txid-exists?
  []
  (let [[graph-uuid txid] @sync/graphs-txid]
    (some? graph-uuid)))


(defn create-graph
  [name]
  (go
    (let [r (exception->
             (<! (sync/create-graph sync/remoteapi name))
             :GraphUUID)]
      (if (and (not (instance? ExceptionInfo r))
               (string? r))
        (do
          (persist-var/-reset-value! sync/graphs-txid [r 0] (state/get-current-repo))
          (persist-var/persist-save sync/graphs-txid)
          (swap! refresh-file-sync-component not))
        (if (= 404 (get-in (ex-data r) [:err :status]))
          (notification/show! (str "create graph failed: already existed graph: " name) :warning)
          (notification/show! (str "create graph failed: " r) :warning))))))


(defn list-graphs
  []
  (go
    (:Graphs (<! (sync/list-remote-graphs sync/remoteapi)))))


(defn switch-graph [graph-uuid]
  (persist-var/-reset-value! sync/graphs-txid [graph-uuid 0] (state/get-current-repo))
  (persist-var/persist-save sync/graphs-txid)
  (swap! refresh-file-sync-component not))
