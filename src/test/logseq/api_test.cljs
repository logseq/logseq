(ns logseq.api-test
  (:require [cljs.test :refer [use-fixtures deftest is]]
            [frontend.test.helper :as test-helper]
            [frontend.db :as db]
            [logseq.api.block :as api-block]
            [frontend.state :as state]
            [cljs-bean.core :as bean]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest get-block
  (with-redefs [state/get-current-repo (constantly test-helper/test-db)]
    (db/transact! test-helper/test-db
      [{:db/id 10000
        :block/uuid #uuid "4406f839-6410-43b5-87db-25e9b8f54cc0"
        :block/content "1"}
       {:db/id 10001
        :block/uuid #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172"
        :block/content "2"}
       {:db/id 10002
        :block/uuid #uuid "adae3006-f03e-4814-a1f5-f17f15b86556"
        :block/parent 10001
        :block/left 10001
        :block/content "3"}
       {:db/id 10003
        :block/uuid #uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d"
        :block/parent 10002
        :block/left 10002
        :block/content "4"}])

    (is (= (:content (bean/->clj (api-block/get_block 10000 #js {}))) "1"))
    (is (= (:content (bean/->clj (api-block/get_block "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {}))) "2"))
    (is (= (:content (bean/->clj (api-block/get_block #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {}))) "2"))
    (is (= {:id 10001, :content "2", :uuid "d9b7b45f-267f-4794-9569-f43d1ce77172", :children [["uuid" "adae3006-f03e-4814-a1f5-f17f15b86556"]]}
           (bean/->clj (api-block/get_block 10001 #js {:includeChildren false}))))
    (is (= {:content "2", :uuid "d9b7b45f-267f-4794-9569-f43d1ce77172", :id 10001, :children [{:content "3", :left {:id 10001}, :parent {:id 10001}, :uuid "adae3006-f03e-4814-a1f5-f17f15b86556", :id 10002, :level 1, :children [{:content "4", :left {:id 10002}, :parent {:id 10002}, :uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d", :id 10003, :level 2, :children []}]}]}
           (bean/->clj (api-block/get_block 10001 #js {:includeChildren true}))))))

#_(cljs.test/run-tests)
