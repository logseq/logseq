(ns logseq.api-test
  (:require [cljs-bean.core :as bean]
            [cljs.test :refer [use-fixtures deftest is]]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.api.block :as api-block]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest get-block
  (with-redefs [state/get-current-repo (constantly test-helper/test-db)]
    (db/transact! test-helper/test-db
                  [{:db/id 10000
                    :block/uuid #uuid "4406f839-6410-43b5-87db-25e9b8f54cc0"
                    :block/title "1"}
                   {:db/id 10001
                    :block/uuid #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172"
                    :block/refs #{10000}
                    :block/title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"}
                   {:db/id 10002
                    :block/uuid #uuid "adae3006-f03e-4814-a1f5-f17f15b86556"
                    :block/parent 10001
                    :block/title "3"}
                   {:db/id 10003
                    :block/uuid #uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d"
                    :block/parent 10002
                    :block/title "4"}])

    (is (= (:title (bean/->clj (api-block/get_block 10000 #js {}))) "1"))
    (is (= (:content (bean/->clj (api-block/get_block 10000 #js {}))) "1"))
    (is (= (:title (bean/->clj (api-block/get_block "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {}))) "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"))
    (is (= (:fullTitle (bean/->clj (api-block/get_block "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {}))) "2 [[1]]"))
    (is (= (:title (bean/->clj (api-block/get_block #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {}))) "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"))
    (is (= {:id 10001, :title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :uuid "d9b7b45f-267f-4794-9569-f43d1ce77172", :children [["uuid" "adae3006-f03e-4814-a1f5-f17f15b86556"]]}
           (select-keys (js->clj (api-block/get_block 10001 #js {:includeChildren false}) :keywordize-keys true)
                        [:id :title :uuid :children])))
    ;; NOTE: `content` key is to be compatible with old APIs
    (is (= {:id 10001, :refs [{:id 10000}], :title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :uuid "d9b7b45f-267f-4794-9569-f43d1ce77172", :children [{:id 10002, :parent {:id 10001}, :title "3", :uuid "adae3006-f03e-4814-a1f5-f17f15b86556", :level 1, :children [{:id 10003, :parent {:id 10002}, :title "4", :uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d", :level 2, :children [], :content "4", :fullTitle "4"}], :content "3", :fullTitle "3"}], :content "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :fullTitle "2 [[1]]"}
           (js->clj (api-block/get_block 10001 #js {:includeChildren true}) :keywordize-keys true)))))

#_(cljs.test/run-tests)
