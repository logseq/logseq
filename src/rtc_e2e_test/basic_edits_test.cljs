(ns basic-edits-test
  (:require [client-steps]
            [cljs.test :as t :refer [deftest]]
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
        (doseq [task client-steps/client1-steps]
          (m/? task))
        (done))
      (m/sp
        (doseq [task client-steps/client2-steps]
          (m/? task))
        (done))))))
