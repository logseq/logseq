(ns logseq.e2e.rtc-extra-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures run-tests]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures :refer [*page1 *page2]]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.rtc :as rtc]
   [logseq.e2e.settings :as settings]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(defn- prepare-rtc-graph-fixture
  "open 2 app instances, add a rtc graph, check this graph available on other instance"
  [f]
  (let [graph-name (str "rtc-extra-test-graph-" (.toEpochMilli (java.time.Instant/now)))]
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
      (graph/switch-graph graph-name true))

    (f)

    ;; cleanup
    (w/with-page @*page2
      (graph/remove-remote-graph graph-name))))

(use-fixtures :once
  fixtures/open-2-pages
  prepare-rtc-graph-fixture)

(defn- insert-task-blocks
  [title-prefix]
  (doseq [status ["Backlog" "Todo" "Doing" "In review" "Done" "Canceled"]
          priority ["No priority" "Low" "Medium" "High" "Urgent"]]
    (b/new-block (str title-prefix "-" status "-" priority))
    (util/input-command status)
    (util/input-command priority)))

(deftest rtc-task-blocks-test
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
        (assert/assert-graph-summary-equal p1-summary p2-summary)))))

(defn- add-new-properties
  [title-prefix]
  (b/new-blocks (map #(str title-prefix "-" %) ["Text" "Number" "Date" "DateTime" "Checkbox" "Url" "Node"]))
  (doseq [property-type ["Text" "Number" "Date" "DateTime" "Checkbox" "Url" "Node"]]
    (w/click (util/get-by-text (str title-prefix "-" property-type) true))
    (k/press "Control+e")
    (util/input-command "Add new property")
    (util/input (str "p-" property-type))
    (w/click (w/get-by-text "New option:"))
    (assert/assert-is-visible (w/get-by-text "Select a property type"))
    (w/click (loc/and "span" (util/get-by-text property-type true)))
    (case property-type
      "Text" (util/input "Text")
      "Number" (do (assert/assert-is-visible (format "input[placeholder='%s']" (str "Set " "p-" property-type)))
                   (util/input "111")
                   (w/click (w/get-by-text "New option:")))
      ("DateTime" "Date") (do
                            (assert/assert-is-visible ".ls-property-dialog")
                            (k/enter)
                            (k/esc))
      "Checkbox" nil
      "Url" nil
      "Node" (do
               (w/click (w/get-by-text "Skip choosing tag"))
               (util/input (str title-prefix "-Node-value"))
               (w/click (w/get-by-text "New option:"))))))

(deftest rtc-property-test
  (let [*latest-remote-tx (atom nil)]
    (testing "create some user properties with different type, sync to the other client"
      (w/with-page @*page1
        (let [{:keys [_local-tx remote-tx]}
              (rtc/with-wait-tx-updated
                (add-new-properties "rtc-property-test"))]
          (reset! *latest-remote-tx remote-tx)))
      (w/with-page @*page2
        (rtc/wait-tx-update-to @*latest-remote-tx))
      (let [[p1-summary p2-summary]
            (map (fn [p]
                   (w/with-page p
                     (graph/validate-graph)))
                 [@*page1 @*page2])]
        (assert/assert-graph-summary-equal p1-summary p2-summary)))))

(comment
  (let [title-prefix "xxxx"
        property-type "Text"]
    (w/with-page @*page1
      (b/new-block (str title-prefix "-" property-type)))))
