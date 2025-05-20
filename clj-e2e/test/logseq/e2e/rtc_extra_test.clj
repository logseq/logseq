(ns logseq.e2e.rtc-extra-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures run-tests]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.fixtures :as fixtures :refer [*page1 *page2]]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]
   [logseq.e2e.block :as b]))

(use-fixtures :once fixtures/open-2-pages)

(defn- offline
  [offline?]
  (.setOffline (.context (w/get-page)) offline?))

(defn- wait-for-ops-synced
  []
  (w/wait-for "button.cloud.on.queuing" {:timeout 1000})
  (w/wait-for "button.cloud.on.idle" {:timeout 5000}))

(deftest rtc-extra-test
  (let [graph-name (str "rtc-extra-test-graph-" (.toEpochMilli (java.time.Instant/now)))]
    (testing "open 2 app instances, add a rtc graph, check this graph available on other instance"
      (cp/prun!
       2
       #(w/with-page %
          (util/login-test-account))
       [@*page1 @*page2])
      (w/with-page @*page1
        (graph/new-graph graph-name true))
      (w/with-page @*page2
        (graph/wait-for-remote-graph graph-name)
        (graph/switch-graph graph-name true)))
    (testing "rtc-stop app1, update app2, then rtc-start on app1"
      (w/with-page @*page1
        (offline true))
      (w/with-page @*page2
        (dotimes [_i 3]
          (b/new-blocks (map #(str "b" %) (range 10)))
          (wait-for-ops-synced))
        ;; TODO: more operations
        (repl/pause)
        )
      )
    ))
