(ns frontend.components.query.builder-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.query.builder :as query-builder]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.frontend.property :as db-property]))

(deftest closed-filter-choices-include-all-built-in-values-test
  (is (= ["Backlog" "Todo" "Doing" "In Review" "Done" "Canceled"]
         (#'query-builder/closed-filter-choices :logseq.property/status)))
  (is (= ["Low" "Medium" "High" "Urgent"]
         (#'query-builder/closed-filter-choices :logseq.property/priority)))
  (is (= ["Backlog" "Todo" "Doing" "In Review" "Done" "Canceled"]
         (mapv db-property/property-value-content
               (:property/closed-values
                (#'query-builder/built-in-property :logseq.property/status))))
      "built-in closed values should expose :block/title so property-value-content works"))

(deftest property-value-choice-items-prefer-closed-values-test
  (is (= [{:value "Open"} {:value "Closed"}]
         (#'query-builder/property-value-choice-items
          [{:block/title "Open"} {:block/title "Closed"}]
          [{:label "Used only"}])))
  (is (= [{:label "Used only" :value "Used only"}]
         (#'query-builder/property-value-choice-items
          nil
          [{:label "Used only"}]))))

(deftest tags-clause-shows-built-in-task-title-test
  (let [task-uuid (common-uuid/gen-uuid :db-ident-block-uuid :logseq.class/Task)]
    (is (= "Task" (#'query-builder/built-in-title task-uuid)))
    (is (= "Task" (#'query-builder/page-title (str task-uuid))))
    (is (= [:span "#" "Task"]
           (#'query-builder/dsl-human-output [:tags (str task-uuid)])))))
