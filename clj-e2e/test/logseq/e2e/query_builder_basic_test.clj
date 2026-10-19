(ns logseq.e2e.query-builder-basic-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is testing use-fixtures]]
            [logseq.e2e.block :as b]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(def ^:private status-choices
  ["Backlog" "Todo" "Doing" "In Review" "Done" "Canceled"])

(def ^:private priority-choices
  ["Low" "Medium" "High" "Urgent"])

(defn- start-query-filter!
  []
  (b/new-block "")
  (util/input-command "query")
  (w/wait-for ".cp__query-builder")
  (w/click (util/-query-last "button:text('filter')"))
  (w/wait-for ".query-builder-picker .cp__select-input"))

(defn- choose-select-item!
  [label]
  (w/wait-for ".cp__select-input")
  (w/click ".cp__select-input")
  (util/input label)
  (w/click (loc/filter ".cp__select-results a.menu-link" :has-text label)))

(defn- select-choice-texts
  []
  (->> (w/all-text-contents ".query-builder-picker .cp__select-results a.menu-link")
       (map string/trim)
       (remove string/blank?)
       vec))

(defn- assert-select-choices!
  [expected]
  (w/wait-for (loc/filter ".query-builder-picker .cp__select-results a.menu-link"
                          :has-text (first expected)))
  (let [texts (set (select-choice-texts))]
    (doseq [choice expected]
      (is (contains? texts choice)
          (str "query builder should list choice " (pr-str choice)
               " in " (pr-str texts))))))

(deftest query-builder-task-filter-shows-all-status-choices-test
  (testing "task filter lists every built-in status"
    (start-query-filter!)
    (choose-select-item! "Task")
    (assert-select-choices! status-choices)))

(deftest query-builder-priority-filter-shows-all-priority-choices-test
  (testing "priority filter lists every built-in priority"
    (start-query-filter!)
    (choose-select-item! "Priority")
    (assert-select-choices! priority-choices)))

(deftest query-builder-property-filter-shows-all-status-choices-test
  (testing "property filter lists every Status closed value, not only used ones"
    (start-query-filter!)
    (choose-select-item! "Property")
    (w/wait-for ".query-builder-picker")
    (w/click (util/get-by-text "Show built-in properties" true))
    (w/wait-for (loc/filter ".cp__select-results a.menu-link" :has-text "Status"))
    (choose-select-item! "Status")
    (assert-select-choices! status-choices)))

(deftest query-builder-task-tag-shows-title-not-uuid-test
  (testing "a tags filter for Task shows #Task instead of the class uuid"
    (start-query-filter!)
    (choose-select-item! "Tags")
    (choose-select-item! "Task")
    (w/wait-for ".cp__query-builder .query-clause")
    (let [clause (util/get-text ".cp__query-builder .query-clause")]
      (is (string/includes? clause "Task")
          (str "query clause should show Task title, got " (pr-str clause)))
      (is (not (re-find #"(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" clause))
          (str "query clause should not show a uuid, got " (pr-str clause))))))
