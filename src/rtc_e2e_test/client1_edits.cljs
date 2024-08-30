(ns client1-edits
  (:require [cljs.test :as t :refer [is]]
            [const]
            [datascript.core :as d]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.core :as rtc-core]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [helper]
            [logseq.outliner.batch-tx :as batch-tx]
            [missionary.core :as m]))

(defn step1--create-page
  []
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

(def step2--task-start-rtc
  (m/sp
    (let [r (m/? (rtc-core/new-task--rtc-start const/downloaded-test-repo const/test-token))]
      (is (nil? r)))))

(def step3--task-wait-page1-synced
  (m/sp
    (let [r (m/? (m/timeout
                  (m/reduce (fn [_ v]
                              (when (and (= :rtc.log/push-local-update (:type v))
                                         (empty? (client-op/get-all-ops const/downloaded-test-repo)))
                                (reduced v)))
                            rtc-log-and-state/rtc-log-flow)
                  6000 :timeout))]
      (is (not= :timeout r)))))
