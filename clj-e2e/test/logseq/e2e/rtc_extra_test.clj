(ns logseq.e2e.rtc-extra-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures run-tests]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures :refer [*page1 *page2]]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.rtc :as rtc]
   [logseq.e2e.settings :as settings]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(def *graph-name (atom nil))
(defn cleanup-fixture
  [f]
  (f)
  (w/with-page @*page2
    (assert (some? @*graph-name))
    (graph/remove-remote-graph @*graph-name)))

(use-fixtures :once
  fixtures/open-2-pages
  cleanup-fixture)

(defn- insert-task-blocks
  [title-prefix]
  (doseq [status ["Backlog" "Todo" "Doing" "In review" "Done" "Canceled"]
          priority ["No priority" "Low" "Medium" "High" "Urgent"]]
    (b/new-block (str title-prefix "-" status "-" priority))
    (util/input-command status)
    (util/input-command priority)))

(deftest rtc-extra-test
  (let [graph-name (str "rtc-extra-test-graph-" (.toEpochMilli (java.time.Instant/now)))]
    (reset! *graph-name graph-name)
    (testing "open 2 app instances, add a rtc graph, check this graph available on other instance"
      (cp/prun!
       2
       #(w/with-page %
          (settings/developer-mode)
          (w/refresh)
          (util/login-test-account))
       [@*page1 @*page2])
      (w/with-page @*page1
        (graph/new-graph graph-name true))
      (w/with-page @*page2
        (graph/wait-for-remote-graph graph-name)
        (graph/switch-graph graph-name true)))
    (testing "rtc-stop app1, add some task blocks, then rtc-start on app1"
      (let [*latest-remote-tx (atom nil)]
        (w/with-page @*page1
          (rtc/rtc-stop))
        (w/with-page @*page2
          (let [{:keys [_local-tx remote-tx]}
                (rtc/with-wait-tx-updated
                  (insert-task-blocks "t1"))]
            (reset! *latest-remote-tx remote-tx))
          ;; TODO: more operations
          (util/exit-edit))
        (w/with-page @*page1
          (rtc/rtc-start)
          (rtc/wait-tx-update-to @*latest-remote-tx))
        (let [[p1-summary p2-summary]
              (map (fn [p]
                     (w/with-page p
                       (graph/validate-graph)))
                   [@*page1 @*page2])]
          (assert/assert-graph-summary-equal p1-summary p2-summary))))))
