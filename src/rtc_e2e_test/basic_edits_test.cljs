(ns basic-edits-test
  (:require [client1-edits]
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
        (testing "start rtc on repo"
          (m/? (client1-edits/step2--task-start-rtc)))
        (testing "waiting for :create-page synced"
          (m/? (client1-edits/step3--task-wait-:create-page-synced)))
        (done))
      (m/sp
        (testing "TODO: client2 cases")
        (done))))))
