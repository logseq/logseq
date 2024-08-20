(ns fixture
  (:require [const]
            [datascript.core :as d]
            [example]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.state :as worker-state]))

(def install-example-db-fixture
  {:before
   (fn []
     (reset! worker-state/*rtc-ws-url "wss://ws-dev.logseq.com/rtc-sync?token=%s")
     (swap! worker-state/*client-ops-conns assoc const/test-repo (d/create-conn client-op/schema-in-db))
     (let [conn (d/conn-from-db example/example-db)]
       (swap! worker-state/*datascript-conns assoc const/test-repo conn)))
   :after
   (fn []
     (swap! worker-state/*datascript-conns dissoc const/test-repo)
     (swap! worker-state/*client-ops-conns dissoc const/test-repo))})
