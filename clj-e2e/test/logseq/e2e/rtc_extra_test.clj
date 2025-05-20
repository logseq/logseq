(ns logseq.e2e.rtc-extra-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures run-tests]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures :refer [*page1 *page2]]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.rtc :as rtc]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-2-pages)

(defn- offline
  []
  (.setOffline (.context (w/get-page)) true))

(defn- online
  []
  (.setOffline (.context (w/get-page)) false))

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
      (let [*latest-remote-tx (atom nil)]
        (w/with-page @*page1
          (offline))
        (w/with-page @*page2
          (let [{:keys [_local-tx remote-tx]}
                (rtc/with-wait-tx-updated
                  (dotimes [_i 3]
                    (doseq [i (range 10)]
                      (b/new-block (str "b" i))
                      (util/input-command "Doing"))))]
            (reset! *latest-remote-tx remote-tx))
          ;; TODO: more operations
          (util/exit-edit))
        (w/with-page @*page1
          (online)
          (rtc/wait-tx-update-to @*latest-remote-tx)
          ;; TODO: check blocks exist
          )))
    (testing "cleanup"
      (w/with-page @*page2
        (graph/remove-remote-graph graph-name)))))
