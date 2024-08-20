(ns fixture
  (:require [cljs.test :as t]
            [const]
            [datascript.core :as d]
            [example]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.state :as worker-state]
            [helper]
            [missionary.core :as m]))

(def install-some-consts
  {:before
   (fn []
     (reset! worker-state/*rtc-ws-url "wss://ws-dev.logseq.com/rtc-sync?token=%s"))})

(def install-example-db-fixture
  {:before
   (fn []
     (swap! worker-state/*client-ops-conns assoc const/test-repo (d/create-conn client-op/schema-in-db))
     (let [conn (d/conn-from-db example/example-db)]
       (swap! worker-state/*datascript-conns assoc const/test-repo conn)))
   :after
   (fn []
     (swap! worker-state/*datascript-conns dissoc const/test-repo)
     (swap! worker-state/*client-ops-conns dissoc const/test-repo))})

(def clear-test-remote-graphs-fixture
  {:before
   #(t/async
     done
     (c.m/run-task
      (m/sp
       (m/? helper/new-task--clear-all-test-remote-graphs)
       (done))
      :clear-test-remote-graphs))})
