(ns download-upload-test
  "RTC e2e tests for download-graph and upload-graph"
  (:require [cljs.test :as t :refer [deftest]]
            [const]
            [example]
            [fixture]
            [frontend.common.missionary-util :as c.m]
            [helper]
            [missionary.core :as m]))

(t/use-fixtures :each fixture/install-example-db-fixture)

(deftest upload-graph-test
  (t/async
   done
   (c.m/run-task
    (m/sp
      (let [{:keys [graph-uuid]} (m/? (helper/new-task--upload-example-graph))]
        (m/? (helper/new-task--wait-creating-graph graph-uuid)))
      (done))
    :upload-graph-test)))
