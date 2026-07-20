(ns frontend.worker.handler.transaction-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.handler.transaction]
            [frontend.worker.state :as worker-state]
            [logseq.outliner.op :as outliner-op]))

(deftest apply-outliner-ops-returns-stored-delta-and-ordered-editor-rows-test
  (let [repo "transaction-handler-test"
        conn (d/create-conn)
        perf-id #uuid "11111111-1111-1111-1111-111111111111"
        first-row-uuid #uuid "22222222-2222-2222-2222-222222222222"
        second-row-uuid #uuid "33333333-3333-3333-3333-333333333333"
        editor-row-uuids [second-row-uuid first-row-uuid]
        delta {:graph-id repo
               :rev 7
               :blocks {}
               :deleted {}
               :children {}
               :affected-keys #{[:graph]}}
        result {:cursor-position 3}
        previous-conns @worker-state/*datascript-conns
        taken-perf-ids (atom [])
        hydration-calls (atom 0)]
    (try
      (reset! worker-state/*datascript-conns {repo conn})
      (with-redefs [outliner-op/apply-ops! (fn [_conn _ops _opts]
                                             result)
                    db-listener/take-outliner-op-delta!
                    (fn [requested-perf-id]
                      (swap! taken-perf-ids conj requested-perf-id)
                      delta)
                    db-listener/take-outliner-op-perf! (fn [_perf-id] nil)
                    block-handler/get-block-and-children
                    (fn [& _args]
                      (swap! hydration-calls inc)
                      nil)]
        (let [apply-ops! (get @thread-api/*thread-apis
                              :thread-api/apply-outliner-ops)
              response (apply-ops! repo
                                   [[:save-block []]]
                                   {:affected-block-uuids #{}
                                    :editor-row-uuids editor-row-uuids
                                    :ui/perf-id perf-id})]
          (is (= [perf-id] @taken-perf-ids))
          (is (= result (:result response)))
          (is (identical? delta (:delta response))
              "The direct response must return the delta stored by the database listener.")
          (is (= editor-row-uuids (:editor-row-uuids response))
              "Editor rows must retain operation order beside the shared delta.")
          (is (zero? @hydration-calls)
              "The origin handler must not reconstruct updated block payloads.")
          (is (not-any? #(contains? response %)
                        [:affected-page-uuids
                         :deleted-block-uuids
                         :entity-updated-block-uuids
                         :render-invalidated-block-uuids
                         :structural-parent-uuids
                         :updated-blocks]))))
      (finally
        (reset! worker-state/*datascript-conns previous-conns)))))
