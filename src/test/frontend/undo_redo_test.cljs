(ns frontend.undo-redo-test
  (:require [clojure.test :refer [deftest is]]
            [frontend.state :as state]
            [frontend.undo-redo :as undo-redo]))

;; ADR 0013 note: this namespace keeps main-thread coordination coverage only.
;; Worker-owned DB-history recording/replay tests belong under src/test/frontend/worker/.

(deftest undo-redo-proxy-to-worker-test
  (let [calls (atom [])
        invoke! (fn [& args]
                  (swap! calls conj (vec args))
                  (vec args))
        repo "repo-1"]
    (with-redefs [state/<invoke-db-worker invoke!]
      (is (= [:thread-api/undo-redo-undo repo]
             (undo-redo/undo repo)))
      (is (= [:thread-api/undo-redo-redo repo]
             (undo-redo/redo repo)))
      (is (= [[:thread-api/undo-redo-undo repo]
              [:thread-api/undo-redo-redo repo]]
             @calls)))))

(deftest clear-history-and-record-editor-info-proxy-test
  (let [calls (atom [])
        invoke! (fn [& args]
                  (swap! calls conj (vec args))
                  (vec args))
        repo "repo-2"
        editor-info {:block-uuid (random-uuid)
                     :container-id 1
                     :start-pos 0
                     :end-pos 3}]
    (with-redefs [state/<invoke-db-worker invoke!]
      (is (= [:thread-api/undo-redo-clear-history repo]
             (undo-redo/clear-history! repo)))
      (is (= [:thread-api/undo-redo-record-editor-info repo editor-info]
             (undo-redo/record-editor-info! repo editor-info)))
      (is (= [[:thread-api/undo-redo-clear-history repo]
              [:thread-api/undo-redo-record-editor-info repo editor-info]]
             @calls)))))

(deftest record-ui-state-proxy-test
  (let [calls (atom [])
        invoke! (fn [& args]
                  (swap! calls conj (vec args))
                  (vec args))
        repo "repo-3"
        ui-state-str "{:old-state {}, :new-state {:route-data {:to :page}}}"]
    (with-redefs [state/<invoke-db-worker invoke!]
      (is (nil? (undo-redo/record-ui-state! repo nil)))
      (is (= [:thread-api/undo-redo-record-ui-state repo ui-state-str]
             (undo-redo/record-ui-state! repo ui-state-str)))
      (is (= [[:thread-api/undo-redo-record-ui-state repo ui-state-str]]
             @calls)))))

(deftest undo-redo-action-meta-drops-original-tx-id-test
  (let [tx-id (random-uuid)
        data {:tx-meta {:outliner-op :save-block
                        :db-sync/tx-id tx-id}
              :db-sync/tx-id tx-id
              :db-sync/forward-outliner-ops [[:save-block [{:block/uuid (random-uuid)
                                                            :block/title "hello"} nil]]]
              :db-sync/inverse-outliner-ops [[:save-block [{:block/uuid (random-uuid)
                                                            :block/title ""} nil]]]}
        tx-meta (#'undo-redo/undo-redo-action-meta data false)]
    (is (nil? (:db-sync/tx-id tx-meta)))
    (is (= tx-id (:db-sync/source-tx-id tx-meta)))))
