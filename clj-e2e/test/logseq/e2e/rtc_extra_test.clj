(ns logseq.e2e.rtc-extra-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures run-test run-tests]]
   [com.climate.claypoole :as cp]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.custom-report :as custom-report]
   [logseq.e2e.fixtures :as fixtures :refer [*page1 *page2]]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.outliner-basic-test :as outliner-basic-test]
   [logseq.e2e.page :as page]
   [logseq.e2e.property-basic-test :as property-basic-test]
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

    (binding [custom-report/*preserve-graph* false]
      (f)
      ;; cleanup
      (if custom-report/*preserve-graph*
        (println "Don't remove graph: " graph-name)
        (w/with-page @*page2
          (graph/remove-remote-graph graph-name))))))

(defn- new-logseq-page
  "new logseq page and switch to this page on both page1 and page2"
  []
  (let [*page-name (atom nil)
        {:keys [_local-tx remote-tx]}
        (w/with-page @*page1
          (rtc/with-wait-tx-updated
            (reset! *page-name (fixtures/create-page))))]
    (w/with-page @*page2
      (rtc/wait-tx-update-to remote-tx)
      (page/goto-page @*page-name))))

(defn- new-logseq-page-fixture
  [f]
  (new-logseq-page)
  (f))

(use-fixtures :once
  fixtures/open-2-pages
  prepare-rtc-graph-fixture)

(use-fixtures :each
  new-logseq-page-fixture)

(defn- with-stop-restart-rtc
  [pw-page f]
  (w/with-page pw-page
    (rtc/rtc-stop))
  (f)
  (w/with-page pw-page
    (rtc/rtc-start)))

(defn- validate-2-graphs
  []
  (let [[p1-summary p2-summary]
        (map
         (fn [p]
           (w/with-page p
             (graph/validate-graph)))
         [@*page1 @*page2])]
    (assert/assert-graph-summary-equal p1-summary p2-summary)))

(def status->icon-name
  {"Backlog" "Backlog"
   "Todo" "Todo"
   "Doing" "InProgress50"
   "In review" "InReview"
   "Done" "Done"
   "Canceled" "Cancelled"})

(def priorities ["No priority" "Low" "Medium" "High" "Urgent"])

(defn- validate-task-blocks
  []
  (let [icon-names (vals status->icon-name)
        icon-name->count
        (w/with-page @*page2
          (into
           {}
           (map
            (fn [icon-name]
              [icon-name (.count (w/-query (str ".ls-icon-" icon-name)))])
            icon-names)))]
    (prn :validate-task-blocks icon-name->count)
    (w/with-page @*page1
      (doseq [[icon-name count*] icon-name->count]
        (assert/assert-have-count (str ".ls-icon-" icon-name) count*)))))

(defn- insert-task-blocks
  [title-prefix]
  (doseq [status (keys status->icon-name)
          priority priorities]
    (b/new-block (str title-prefix "-" status "-" priority))
    (util/input-command status)
    (util/input-command priority)))

(defn- update-task-blocks
  []
  (let [qs-partitions (partition-all 5 (seq (.all (loc/filter ".ls-block" :has ".ui__icon"))))]
    (doseq [q-seq qs-partitions]
      (doseq [q q-seq]
        (w/click q)
        (util/input-command (rand-nth (keys status->icon-name)))
        (util/input-command (rand-nth priorities))))))

(deftest rtc-task-blocks-test
  (let [insert-task-blocks-in-page2
        (fn [*latest-remote-tx]
          (w/with-page @*page2
            (let [{:keys [_local-tx remote-tx]}
                  (rtc/with-wait-tx-updated
                    (insert-task-blocks "t1"))]
              (reset! *latest-remote-tx remote-tx))
            (util/exit-edit)))
        update-task-blocks-in-page2
        (fn [*latest-remote-tx]
          (w/with-page @*page2
            (let [{:keys [_local-tx remote-tx]}
                  (rtc/with-wait-tx-updated
                    (update-task-blocks))]
              (reset! *latest-remote-tx remote-tx))))]
    (testing "add some task blocks while rtc disconnected on page1"
      (let [*latest-remote-tx (atom nil)]
        (rtc/with-stop-restart-rtc
          [@*page1]
          [@*page1 (rtc/wait-tx-update-to @*latest-remote-tx)]
          (insert-task-blocks-in-page2 *latest-remote-tx))
        (validate-task-blocks)
        (validate-2-graphs)))

    (testing "update task blocks while rtc disconnected on page1"
      (let [*latest-remote-tx (atom nil)]
        (rtc/with-stop-restart-rtc
          [@*page1]
          [@*page1 (rtc/wait-tx-update-to @*latest-remote-tx)]
          (update-task-blocks-in-page2 *latest-remote-tx))
        (validate-task-blocks)
        (validate-2-graphs)))

    (new-logseq-page)

    (testing "perform same operations on page2 while keeping rtc connected on page1"
      (let [*latest-remote-tx (atom nil)]
        (insert-task-blocks-in-page2 *latest-remote-tx)
        (w/with-page @*page1
          (rtc/wait-tx-update-to @*latest-remote-tx))
        (validate-task-blocks)
        (validate-2-graphs)))

    (testing "update task blocks while rtc connected on page1"
      (let [*latest-remote-tx (atom nil)]
        (update-task-blocks-in-page2 *latest-remote-tx)
        (w/with-page @*page1
          (rtc/wait-tx-update-to @*latest-remote-tx))
        (validate-task-blocks)
        (validate-2-graphs)))))

(deftest rtc-property-test
  (let [insert-new-property-blocks-in-page2
        (fn [*latest-remote-tx title-prefix]
          (w/with-page @*page2
            (let [{:keys [_local-tx remote-tx]}
                  (rtc/with-wait-tx-updated
                    (property-basic-test/add-new-properties title-prefix))]
              (reset! *latest-remote-tx remote-tx))))]
    (testing "add different types user properties on page2 while keeping rtc connected on page1"
      (let [*latest-remote-tx (atom nil)]
        (rtc/with-stop-restart-rtc
          [@*page1]
          [@*page1 (rtc/wait-tx-update-to @*latest-remote-tx)]
          (insert-new-property-blocks-in-page2 *latest-remote-tx "rtc-property-test-1"))
        (validate-2-graphs)))

    (new-logseq-page)

    (testing "perform same operations on page2 while keeping rtc connected on page1"
      (let [*latest-remote-tx (atom nil)]
        (insert-new-property-blocks-in-page2 *latest-remote-tx "rtc-property-test-2")
        (w/with-page @*page1
          (rtc/wait-tx-update-to @*latest-remote-tx))
        (validate-2-graphs)))))

(deftest rtc-outliner-test
  (doseq [test-fn [outliner-basic-test/create-test-page-and-insert-blocks
                   outliner-basic-test/indent-and-outdent
                   outliner-basic-test/move-up-down
                   outliner-basic-test/delete
                   outliner-basic-test/delete-test-with-children]]
    (let [test-fn-in-page2 (fn [*latest-remote-tx]
                             (w/with-page @*page2
                               (let [{:keys [_local-tx remote-tx]}
                                     (rtc/with-wait-tx-updated
                                       (test-fn))]
                                 (reset! *latest-remote-tx remote-tx))))
          *latest-remote-tx (atom nil)]
      (new-logseq-page)
      (rtc/with-stop-restart-rtc
        [@*page1]
        [@*page1 (rtc/wait-tx-update-to @*latest-remote-tx)]
        (test-fn-in-page2 *latest-remote-tx))
      (validate-2-graphs))))

(deftest rtc-outliner-conflict-update-test
  (let [title-prefix "rtc-outliner-conflict-update-test"]
    (testing "add some blocks, ensure them synced"
      (let [*latest-remote-tx (atom nil)]
        (w/with-page @*page1
          (let [{:keys [_local-tx remote-tx]}
                (rtc/with-wait-tx-updated
                  (b/new-blocks (map #(str title-prefix "-" %) (range 10))))]
            (reset! *latest-remote-tx remote-tx)))
        (w/with-page @*page2
          (rtc/wait-tx-update-to @*latest-remote-tx))
        (validate-2-graphs)))
    (testing "page1: indent block1 as child of block0, page2: delete block0"
      (rtc/with-stop-restart-rtc
        [@*page1 @*page2]
        [@*page1 (rtc/with-wait-tx-updated
                   (k/esc)
                   (assert/assert-in-normal-mode?)
                   (b/new-block "page1-done-1"))
         @*page2 (rtc/with-wait-tx-updated
                   (k/esc)
                   (assert/assert-in-normal-mode?)
                   (b/new-block "page2-done-1"))]
        (w/with-page @*page1
          (w/click (format ".ls-block :text('%s')" (str title-prefix "-" 1)))
          (b/indent))
        (w/with-page @*page2
          (w/click (format ".ls-block :text('%s')" (str title-prefix "-" 0)))
          (b/delete-blocks)))
      (validate-2-graphs))
    (testing "
origin:
- block2
- block3
- block4
page1:
- block2
  - block3
    - block4
page2:
;; block2 deleted
- block4
  - block3"
      (rtc/with-stop-restart-rtc
        [@*page1 @*page2]
        [@*page1 (rtc/with-wait-tx-updated (b/new-block "page1-done-2"))
         @*page2 (rtc/with-wait-tx-updated (b/new-block "page2-done-2"))]
        (w/with-page @*page1
          (w/click (format ".ls-block :text('%s')" (str title-prefix "-" 3)))
          (b/indent)
          (k/arrow-down)
          (b/indent)
          (b/indent))
        (w/with-page @*page2
          (w/click (format ".ls-block :text('%s')" (str title-prefix "-" 2)))
          (b/delete-blocks)
          (w/click (format ".ls-block :text('%s')" (str title-prefix "-" 3)))
          (k/shift+arrow-down)
          (k/meta+shift+arrow-down)
          (k/enter)
          (b/indent)))
      (validate-2-graphs))))

(deftest rtc-page-test
  (let [prefix "rtc-page-test-"]
    ;; (testing "create same name page in different clients.
;; - client1: offline, create page1
;; - client2: offline, create page1
;; - restart rtc"
;;       (rtc/with-stop-restart-rtc
;;         [@*page1 @*page2]
;;         [@*page1 (rtc/with-wait-tx-updated (b/new-block "pw1-done-1"))
;;          @*page2 (rtc/with-wait-tx-updated (b/new-block "pw2-done-1"))]
;;         (w/with-page @*page1
;;           (page/new-page (str prefix 1)))
;;         (w/with-page @*page2
;;           (page/new-page (str prefix 1))))
;;       (validate-2-graphs))

;;     (testing "
;; - client1: offline, add blocks on page-2
;; - client2: offline, delete page-2"
;;       (let [page-name (str prefix 2)]
;;         (let [*latest-remote-tx (atom nil)]
;;           (w/with-page @*page1
;;             (let [{:keys [_local-tx remote-tx]}
;;                   (rtc/with-wait-tx-updated
;;                     (page/new-page page-name))]
;;               (reset! *latest-remote-tx remote-tx)))
;;           (w/with-page @*page2
;;             (rtc/wait-tx-update-to @*latest-remote-tx)))
;;         (validate-2-graphs)

;;         (rtc/with-stop-restart-rtc
;;           [@*page1 @*page2]
;;           [@*page1 (rtc/with-wait-tx-updated (b/new-block "pw1-done-2"))
;;            @*page2 (rtc/with-wait-tx-updated (b/new-block "pw2-done-2"))]
;;           (w/with-page @*page1
;;             (b/new-blocks (map #(str "block-" %) (range 5))))
;;           (w/with-page @*page2
;;             (page/delete-page page-name)))
;;         (validate-2-graphs)))
    (testing "page rename"
      (let [page-name (str prefix 3)]
        (let [*latest-remote-tx (atom nil)]
          (w/with-page @*page1
            (let [{:keys [_local-tx remote-tx]}
                  (rtc/with-wait-tx-updated
                    (page/new-page page-name))]
              (reset! *latest-remote-tx remote-tx)))
          (w/with-page @*page2
            (rtc/wait-tx-update-to @*latest-remote-tx)))
        (validate-2-graphs)
        (rtc/with-stop-restart-rtc
          [@*page1 @*page2]
          [@*page1 (rtc/with-wait-tx-updated (b/new-block "pw1-done-3"))
           @*page2 (rtc/with-wait-tx-updated (b/new-block "pw2-done-3"))]
          (w/with-page @*page1
            (page/rename-page page-name (str page-name "-rename1")))
          (w/with-page @*page2
            (page/rename-page page-name (str page-name "-rename2"))))
        (validate-2-graphs)))))
