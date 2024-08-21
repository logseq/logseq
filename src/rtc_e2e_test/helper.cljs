(ns helper
  (:require [const]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.core :as rtc.core]
            [missionary.core :as m]
            [frontend.worker.state :as worker-state]))

(def new-task--upload-example-graph
  (rtc.core/new-task--upload-graph const/test-token const/test-repo const/test-repo))

(defn new-task--wait-creating-graph
  [graph-uuid]
  (c.m/backoff
   (take 4 c.m/delays)
   (m/sp
     (let [graphs (m/? (rtc.core/new-task--get-graphs const/test-token))
           graph (some (fn [graph] (when (= graph-uuid (:graph-uuid graph)) graph)) graphs)]
       (when-not graph
         (throw (ex-info "graph not exist" {:graph-uuid graph-uuid})))
       (prn "waiting for graph " graph-uuid " finish creating")
       (when (= "creating" (:graph-status graph))
         (throw (ex-info "wait creating-graph" {:missionary/retry true})))))))

(def new-task--clear-all-test-remote-graphs
  (m/sp
    (let [graphs (m/? (rtc.core/new-task--get-graphs const/test-token))
          test-graphs (filter (fn [graph]
                                (and (= const/test-repo (:graph-name graph))
                                     (not= "deleting" (:graph-status graph))))
                              graphs)]
      (doseq [graph test-graphs]
        (m/? (rtc.core/new-task--delete-graph const/test-token (:graph-uuid graph)))))))

(defn new-task--download-graph
  [graph-uuid]
  (m/sp
    (let [download-info-uuid (m/? (rtc.core/new-task--request-download-graph const/test-token graph-uuid))
          result (m/? (rtc.core/new-task--wait-download-info-ready const/test-token download-info-uuid graph-uuid 60000))
          {:keys [_download-info-uuid
                  download-info-s3-url
                  _download-info-tx-instant
                  _download-info-t
                  _download-info-created-at]} result]
      (when (= result :timeout)
        (throw (ex-info "wait download-info-ready timeout" {})))
      (m/? (rtc.core/new-task--download-graph-from-s3
            graph-uuid const/downloaded-test-graph-name download-info-s3-url)))))

(defn get-downloaded-test-conn
  []
  (worker-state/get-datascript-conn const/downloaded-test-repo))

(defn get-example-test-conn
  []
  (worker-state/get-datascript-conn const/test-repo))
