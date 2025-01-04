(ns fixture
  (:require [cljs.test :as t]
            [const]
            [datascript.core :as d]
            [example]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.db-listener]
            [frontend.worker.state :as worker-state]
            [helper]
            [frontend.common.missionary :as c.m]
            [missionary.core :as m]))

(def install-some-consts
  {:before
   (fn []
     (reset! worker-state/*rtc-ws-url "wss://ws-dev.logseq.com/rtc-sync?token=%s"))})

(def install-example-db-fixture
  {:before
   (fn []
     (prn :test-repo const/test-repo)
     (swap! worker-state/*client-ops-conns assoc const/test-repo (d/create-conn client-op/schema-in-db))
     (let [conn (d/conn-from-db example/example-db)]
       (swap! worker-state/*datascript-conns assoc const/test-repo conn)))
   :after
   (fn []
     (swap! worker-state/*datascript-conns dissoc const/test-repo)
     (swap! worker-state/*client-ops-conns dissoc const/test-repo))})

(def clear-test-remote-graphs-fixture
  {:before
   #(when const/is-client1?
      (t/async
       done
       (c.m/run-task-throw
        (m/sp
          (m/? helper/new-task--clear-all-test-remote-graphs)
          (done))
        :clear-test-remote-graphs)))})

(def upload-example-graph-fixture
  {:before
   #(when const/is-client1?
      (t/async
       done
       (c.m/run-task-throw
        (m/sp
          (swap! worker-state/*datascript-conns dissoc const/downloaded-test-repo)
          (swap! worker-state/*client-ops-conns assoc
                 const/downloaded-test-repo (d/create-conn client-op/schema-in-db))
          (let [{:keys [graph-uuid]} (m/? helper/new-task--upload-example-graph)]
            (assert (some? graph-uuid))
            (m/? (helper/new-task--wait-creating-graph graph-uuid))
            (println :uploaded-graph graph-uuid))
          (done))
        :upload-example-graph-fixture)))})

(def build-conn-by-download-example-graph-fixture
  {:before
   #(t/async
     done
     (c.m/run-task-throw
      (m/sp
        (swap! worker-state/*datascript-conns dissoc const/downloaded-test-repo)
        (swap! worker-state/*client-ops-conns assoc
               const/downloaded-test-repo (d/create-conn client-op/schema-in-db))
        (let [graph-uuid (m/? helper/new-task--get-remote-example-graph-uuid)]
          (assert (some? graph-uuid))
          (m/? (helper/new-task--download-graph graph-uuid const/downloaded-test-graph-name)))
        (done))
      :build-conn-by-download-example-graph-fixture))
   :after
   #(do (swap! worker-state/*datascript-conns dissoc const/downloaded-test-repo)
        (swap! worker-state/*client-ops-conns dissoc const/downloaded-test-repo))})
