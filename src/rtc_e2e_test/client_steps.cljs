(ns client-steps
  (:require [cljs.test :as t :refer [is]]
            [const]
            [datascript.core :as d]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.core :as rtc-core]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [helper]
            [logseq.db :as ldb]
            [logseq.outliner.batch-tx :as batch-tx]
            [missionary.core :as m]))

(def step0
  {:client1
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)
           tx-data (const/tx-data-map :create-page)]
       (batch-tx/with-batch-tx-mode conn {:e2e-test const/downloaded-test-repo :skip-store-conn true}
         (d/transact! conn tx-data))
       (is (=
            #{[:update-page const/page1-uuid]
              [:update const/page1-uuid
               [[:block/title "[\"~#'\",\"basic-edits-test\"]" true]
                [:block/created-at "[\"~#'\",1724836490809]" true]
                [:block/updated-at "[\"~#'\",1724836490809]" true]
                [:block/type "[\"~#'\",\"page\"]" true]]]
              [:move const/block1-uuid]
              [:update const/block1-uuid
               [[:block/updated-at "[\"~#'\",1724836490810]" true]
                [:block/created-at "[\"~#'\",1724836490810]" true]
                [:block/title "[\"~#'\",\"block1\"]" true]]]}
            (set (map helper/simplify-client-op (client-op/get-all-ops const/downloaded-test-repo)))))))
   :client2 nil})

(def step1
  "client1: start rtc, wait page1, client1->remote
  client2: start rtc, wait page1, remote->client2"
  {:client1
   (m/sp
     (let [r (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))]
       (is (nil? r))
       (let [r (m/? (m/timeout
                     (m/reduce (fn [_ v]
                                 (when (and (= :rtc.log/push-local-update (:type v))
                                            (empty? (client-op/get-all-ops const/downloaded-test-repo)))
                                   (is (nil? (:ex-data v)))
                                   (reduced v)))
                               rtc-log-and-state/rtc-log-flow)
                     6000 :timeout))]
         (is (not= :timeout r)))))
   :client2
   (m/sp
    (let [r (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))]
      (is (nil? r)))
    (m/?
     (c.m/backoff
      (take 4 c.m/delays)
      (m/sp
       (let [conn (helper/get-downloaded-test-conn)
             page1 (d/pull @conn '[*] [:block/uuid const/page1-uuid])
             block1 (d/pull @conn '[*] [:block/uuid const/block1-uuid])]
         (when-not (:block/uuid page1)
           (throw (ex-info "wait page1 synced" {:missionary/retry true})))
         (is
          (= {:block/title "basic-edits-test"
              :block/name "basic-edits-test"
              :block/type "page"}
             (select-keys page1 [:block/title :block/name :block/type])))
         (is
          (= {:block/title "block1"
              :block/order "a0"
              :block/parent {:db/id (:db/id page1)}}
             (select-keys block1 [:block/title :block/order :block/parent]))))))))})

(def step2
  "client1: insert 300 blocks, wait for changes to sync to remote
  client2: wait for blocks to sync from remote"
  {:client1
   (m/sp
     (let [conn (helper/get-downloaded-test-conn)]
       (batch-tx/with-batch-tx-mode conn {:e2e-test const/downloaded-test-repo :skip-store-conn true}
         (d/transact! conn (const/tx-data-map :insert-300-blocks)))
       (let [r (m/? (m/timeout
                     (m/reduce (fn [_ v]
                                 (when (and (= :rtc.log/push-local-update (:type v))
                                            (empty? (client-op/get-all-ops const/downloaded-test-repo)))
                                   (is (nil? (:ex-data v)))
                                   (reduced v)))
                               rtc-log-and-state/rtc-log-flow)
                     10000 :timeout))]
         (is (not= :timeout r)))))
   :client2
   (c.m/backoff
    (take 4 c.m/delays)
    (m/sp
      (let [conn (helper/get-downloaded-test-conn)
            page (d/pull @conn '[*] [:block/uuid const/page2-uuid])]
        (when-not (:block/uuid page)
          (throw (ex-info "wait for page to be synced" {:missionary/retry true})))
        (let [blocks (ldb/sort-by-order (ldb/get-page-blocks @conn (:db/id page)))]
          (is (= 300 (count blocks)))
          (is (= (map #(str "x" %) (range 300))
                 (map :block/title blocks)))))))})

(defn- wrap-print-step-info
  [steps client]
  (map-indexed
   (fn [idx step]
     (m/sp
       (println (str "[" client "]") "start step" idx)
       (some-> (get step client) m/?)
       (println (str "[" client "]") "end step" idx)))
   steps))

(def client1-steps
  (wrap-print-step-info [step0 step1 step2] :client1))

(def client2-steps
  (wrap-print-step-info [step0 step1 step2] :client2))
