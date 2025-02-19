(ns helper
  (:require [cljs.test :as t :refer [is]]
            [const]
            [datascript.core :as d]
            [datascript.transit :as dt]
            [fixture]
            [frontend.common.missionary :as c.m]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.core :as rtc.core]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [logseq.db.frontend.order :as db-order]
            [logseq.outliner.batch-tx :as batch-tx]
            [meander.epsilon :as me]
            [missionary.core :as m]))

(defn log
  [& objs]
  (apply println (if const/is-client1? "[client1]" "[client2]") objs))

(def new-task--upload-example-graph
  (rtc.core/new-task--upload-graph const/test-token const/test-repo const/test-graph-name))

(defn new-task--wait-creating-graph
  [graph-uuid]
  (c.m/backoff
   (take 4 c.m/delays)
   (m/sp
     (let [graphs (m/? (rtc.core/new-task--get-graphs const/test-token))
           graph (some (fn [graph] (when (= graph-uuid (:graph-uuid graph)) graph)) graphs)]
       (when-not graph
         (throw (ex-info "graph not exist" {:graph-uuid graph-uuid})))
       (log "waiting for graph " graph-uuid " finish creating")
       (when (= "creating" (:graph-status graph))
         (throw (ex-info "wait creating-graph" {:missionary/retry true})))))))

(def new-task--clear-all-test-remote-graphs
  (m/sp
    (let [graphs (m/? (rtc.core/new-task--get-graphs const/test-token))
          test-graphs (filter (fn [graph]
                                (not= "deleting" (:graph-status graph)))
                              graphs)]
      (doseq [graph test-graphs]
        (m/? (rtc.core/new-task--delete-graph const/test-token (:graph-uuid graph) fixture/graph-schema-version))
        (log :deleted-graph (:graph-name graph) (:graph-uuid graph))))))

(def new-task--get-remote-example-graph-uuid
  (c.m/backoff
   (take 5 c.m/delays)
   (m/sp
     (let [graphs (m/? (rtc.core/new-task--get-graphs const/test-token))
           graph
           (some (fn [graph]
                   (when (= const/test-graph-name (:graph-name graph))
                     graph))
                 graphs)]
       (when (= "deleting" (:graph-status graph))
         (throw (ex-info "example graph status is \"deleting\", check server's background-upload-graph log"
                         {:graph-name (:graph-name graph)
                          :graph-uuid (:graph-uuid graph)})))
       (when-not graph
         (throw (ex-info "wait remote-example-graph" {:missionary/retry true
                                                      :graphs graphs})))
       (when (= "creating" (:graph-status graph))
         (throw (ex-info "wait remote-example-graph (creating)" {:missionary/retry true
                                                                 :graphs graphs})))
       (:graph-uuid graph)))))

(defn new-task--download-graph
  [graph-uuid graph-name]
  (m/sp
    (let [download-info-uuid (m/? (rtc.core/new-task--request-download-graph
                                   const/test-token graph-uuid fixture/graph-schema-version))
          result (m/? (rtc.core/new-task--wait-download-info-ready
                       const/test-token download-info-uuid graph-uuid fixture/graph-schema-version 60000))
          {:keys [_download-info-uuid
                  download-info-s3-url
                  _download-info-tx-instant
                  _download-info-t
                  _download-info-created-at]} result]
      (when (= result :timeout)
        (throw (ex-info "wait download-info-ready timeout" {})))
      (m/? (rtc.core/new-task--download-graph-from-s3
            graph-uuid graph-name download-info-s3-url)))))

(defn get-downloaded-test-conn
  []
  {:post [(some? %)]}
  (worker-state/get-datascript-conn const/downloaded-test-repo))

(defn simplify-client-op
  [client-op]
  #_:clj-kondo/ignore
  (me/find
   client-op
   [?op-type _ {:block-uuid ?block-uuid :av-coll [[!a !v _ !add] ...]}]
   [?op-type ?block-uuid (map vector !a !v !add)]

   [?op-type _ {:block-uuid ?block-uuid}]
   [?op-type ?block-uuid]))

(defn new-task--wait-all-client-ops-sent
  [& {:keys [timeout] :or {timeout 10000}}]
  (m/sp
    (let [r (m/? (m/timeout
                  (m/reduce (fn [_ v]
                              (when (and (= :rtc.log/push-local-update (:type v))
                                         (empty? (client-op/get-all-block-ops const/downloaded-test-repo)))
                                (is (nil? (:ex-data v)))
                                (reduced v)))
                            rtc-log-and-state/rtc-log-flow)
                  timeout :timeout))]
      (is (not= :timeout r)))))

(defn new-task--send-message-to-other-client
  [message]
  (m/sp
    (let [conn (get-downloaded-test-conn)
          message-page-id (:db/id (ldb/get-page @conn const/message-page-uuid))
          sorted-blocks (when message-page-id
                          (ldb/sort-by-order (ldb/get-page-blocks @conn message-page-id)))
          min-order (db-order/gen-key nil (:block/order (first sorted-blocks)))
          tx-data [{:db/id "page"
                    :block/uuid const/message-page-uuid
                    :block/name "message-page"
                    :block/title "message-page"
                    :block/created-at 1725024677501
                    :block/updated-at 1725024677501
                    :block/type "page"}
                   {:block/uuid (random-uuid)
                    :block/parent "page"
                    :block/order min-order
                    :block/title (dt/write-transit-str message)
                    :block/page "page"
                    :block/updated-at 1724836490810
                    :block/created-at 1724836490810}]]
      (batch-tx/with-batch-tx-mode conn {:e2e-test const/downloaded-test-repo :frontend.worker.pipeline/skip-store-conn true}
        (d/transact! conn tx-data))
      (m/? (new-task--wait-all-client-ops-sent))
      (log :sent-message message))))

(defn new-task--wait-message-from-other-client
  "Return a task that return message from other client"
  [block-title-pred-fn & {:keys [retry-message retry-count] :or {retry-count 4}}]
  (c.m/backoff
   (take retry-count c.m/delays)
   (m/sp
     (let [conn (get-downloaded-test-conn)
           message-page-id (:db/id (ldb/get-page @conn const/message-page-uuid))
           first-block (when message-page-id
                         (first (ldb/sort-by-order (ldb/get-page-blocks @conn message-page-id))))
           first-block-title (some->> (:block/title first-block) dt/read-transit-str)]
       (when-not (and (some? first-block-title)
                      (block-title-pred-fn first-block-title))
         (throw (ex-info (str "wait message from other client " retry-message) {:missionary/retry true})))
       first-block-title))))

(defn new-task--client1-sync-barrier-1->2
  [message]
  (m/sp
    (m/? (new-task--send-message-to-other-client (str message "-client1")))
    (m/? (new-task--wait-message-from-other-client #(= (str message "-client2") %)))
    (log "sync-barrier-1->2" message)))

(defn new-task--client2-sync-barrier-1->2
  [message]
  (m/sp
    (m/? (new-task--wait-message-from-other-client #(= (str message "-client1") %)))
    (m/? (new-task--send-message-to-other-client (str message "-client2")))
    (log "sync-barrier-1->2" message)))

(defn new-task--client1-sync-barrier-2->1
  [message]
  (m/sp
    (m/? (new-task--wait-message-from-other-client #(= (str message "-client2") %)))
    (m/? (new-task--send-message-to-other-client (str message "-client1")))
    (log "sync-barrier-2->1" message)))

(defn new-task--client2-sync-barrier-2->1
  [message]
  (m/sp
    (m/? (new-task--send-message-to-other-client (str message "-client2")))
    (m/? (new-task--wait-message-from-other-client #(= (str message "-client1") %)))
    (log "sync-barrier-2->1" message)))

(defn transact!
  [conn tx-data]
  {:pre [(seq tx-data)]}
  (batch-tx/with-batch-tx-mode conn {:e2e-test const/downloaded-test-repo :frontend.worker.pipeline/skip-store-conn true}
    (d/transact! conn tx-data)))

(def new-task--stop-rtc
  (m/sp
    (rtc.core/rtc-stop)
    (let [r (m/?
             (m/timeout
              (m/reduce
               (fn [_ v]
                 (when (= :rtc.log/cancelled (:type v))
                   (log :debug-stop-rtc v)
                   (reduced v)))
               rtc-log-and-state/rtc-log-flow)
              3000
              :timeout))]
      (is (not= :timeout r))
      ;; sleep 0.1s to ensure *rtc-lock released
      (m/? (m/sleep 100)))))
