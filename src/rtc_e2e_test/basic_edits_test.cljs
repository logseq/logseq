(ns basic-edits-test
  (:require [client1-edits]
            [client2-edits]
            [cljs.test :as t :refer [deftest testing]]
            [const]
            [fixture]
            [helper]
            [missionary.core :as m]))

(t/use-fixtures :once
  fixture/install-some-consts
  fixture/install-example-db-fixture
  fixture/clear-test-remote-graphs-fixture
  fixture/upload-example-graph-fixture
  fixture/build-conn-by-download-example-graph-fixture)

(deftest basic-edits-test
  (t/async
   done
   (js/Promise.
    (if const/is-client1?
      (m/sp
        (testing "create page first"
          (client1-edits/step1--create-page))
        (testing "start rtc for client1"
          (m/? client1-edits/step2--task-start-rtc))
        (testing "wait page1 synced"
          (m/? client1-edits/step3--task-wait-page1-to-remote))
        (testing "insert 300 blocks"
          (m/? client1-edits/step4--task-insert-300-blocks-to-remote))
        (done))
      (m/sp
        (testing "start rtc for client2"
          (m/? client2-edits/step1--task-start-rtc))
        (testing "wait page1 synced from client1"
          (m/? client2-edits/step2--task-wait-page1-synced))
        (done))))))
