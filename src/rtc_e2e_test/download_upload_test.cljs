(ns download-upload-test
  "RTC e2e tests for download-graph and upload-graph"
  (:require [cljs.test :as t :refer [deftest]]
            [const]
            [datascript.core :as d]
            [example]
            [fixture]
            [frontend.common.missionary-util :as c.m]
            [helper]
            [missionary.core :as m]
            [frontend.worker.state :as worker-state]))

(t/use-fixtures :once
  fixture/install-some-consts
  fixture/install-example-db-fixture
  fixture/clear-test-remote-graphs-fixture)

(deftest upload-download-graph-test
  (t/async
   done
   (c.m/run-task-throw
    (m/sp
      (println :example-db-block-count (count (d/datoms @(helper/get-example-test-conn) :avet :block/uuid)))
      (let [{:keys [graph-uuid]} (m/? helper/new-task--upload-example-graph)]
        (m/? (helper/new-task--wait-creating-graph graph-uuid))
        (m/? (helper/new-task--download-graph graph-uuid))
        (let [conn (helper/get-downloaded-test-conn)]
          (println :repos (keys @worker-state/*datascript-conns))
          (println :block-count (count (d/datoms @conn :avet :block/uuid)))))
      (done))
    :upload-download-graph-test)))
