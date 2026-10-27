(ns frontend.worker.handler.property-reorder-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.handler.property]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(def ^:private test-repo "logseq_db_property-reorder-test")

(deftest reorder-display-property-returns-a-value-the-renderer-can-read-test
  (testing "dragging a property to a new place in a block's property list: the reorder is saved and the call
           answers with a value that can be sent back to the renderer (it returned the tx report, which can't)"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:p1 {:logseq.property/type :default}
                              :p2 {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "b1"
                                               :build/properties {:p1 "one" :p2 "two"}}]}]})
          block (db-test/find-block-by-content @conn "b1")
          previous @worker-state/*datascript-conns
          order-of (fn [ident] (:block/order (d/entity @conn ident)))]
      (reset! worker-state/*datascript-conns {test-repo conn})
      (try
        (let [f (get @thread-api/*thread-apis :thread-api/reorder-display-property)
              result (f test-repo {:block-id (:db/id block)
                                   :active-ident :user.property/p1
                                   :over-ident :user.property/p2
                                   :direction :down
                                   :property-idents [:user.property/p1 :user.property/p2]})]
          (is (string? (ldb/write-transit-str result)) "the result can be sent to the renderer")
          (is (pos? (compare (order-of :user.property/p1) (order-of :user.property/p2)))
              "p1 moved after p2"))
        (finally
          (reset! worker-state/*datascript-conns previous))))))
