(ns frontend.db.query-react-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [cljs-time.core :as t]
            [clojure.pprint]
            [clojure.string :as string]
            [frontend.state :as state]
            [logseq.graph-parser.util.db :as db-util]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.db.query-custom :as query-custom]
            [frontend.db.utils :as db-utils]
            [frontend.db.react :as react]
            [goog.string :as gstring]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- custom-query
  "Use custom-query over react-query for testing since it tests react-query and
adds rules that users often use"
  [query & [opts]]
  (react/clear-query-state!)
  (when-let [result (query-custom/custom-query test-helper/test-db query opts)]
    (map first (deref result))))

(deftest resolve-input-for-page-and-block-inputs
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content
                     "- parent
   - child 1
   - child 2"}])

  (is (= ["child 2" "child 1" "parent"]
         (with-redefs [state/get-current-page (constantly "page1")]
           (map :block/content
                (custom-query {:inputs [:current-page]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-page
                                        :where [?b :block/page ?bp]
                                        [?bp :block/name ?current-page]]}))))
      ":current-page input resolves to current page name")

  (is (= ["child 1" "child 2"]
         (let [block-uuid (-> (db-utils/q '[:find (pull ?b [:block/uuid])
                                            :where [?b :block/content "parent"]])
                              ffirst
                              :block/uuid)]
           (map :block/content
                (custom-query {:inputs [:current-block]
                               :query '[:find (pull ?b [*])
                                        :in $ ?current-block
                                        :where [?b :block/parent ?current-block]]}
                              {:current-block-uuid block-uuid}))))
      ":current-block input resolves to current block's :db/id")
  (is (= ["parent"]
         (let [block-uuid (-> (db-utils/q '[:find (pull ?b [:block/uuid])
                                            :where [?b :block/content "child 1"]])
                              ffirst
                              :block/uuid)]
           (map :block/content
                (custom-query {:inputs [:parent-block]
                               :query '[:find (pull ?parent-block [*])
                                        :in $ ?parent-block
                                        :where [?parent-block :block/parent]]}
                              {:current-block-uuid block-uuid}))))
      ":parent-block input resolves to parent of current blocks's :db/id"))

(deftest resolve-input-for-journal-date-inputs
  (load-test-files [{:file/path "journals/2023_01_01.md"
                     :file/content "- b1"}
                    {:file/path "journals/2023_01_07.md"
                     :file/content "- b2"}])

  (is (= ["b2"]
         (with-redefs [t/today (constantly (t/date-time 2023 1 7))]
           (map :block/content
                (custom-query {:inputs [:3d-before :today]
                               :query '[:find (pull ?b [*])
                                        :in $ ?start ?end
                                        :where (between ?b ?start ?end)]}))))
      ":Xd-before and :today resolve to correct journal range")

  (is (= ["b1"]
         (with-redefs [t/today (constantly (t/date-time 2022 12 31))]
           (map :block/content
                (custom-query {:inputs [:tomorrow :4d-after]
                               :query '[:find (pull ?b [*])
                                        :in $ ?start ?end
                                        :where (between ?b ?start ?end)]}))))
      ":tomorrow and :Xd-after resolve to correct journal range"))

;; These tests rely on seeding timestamps with properties. If this ability goes
;; away we could still test page-level timestamps
(deftest resolve-input-for-timestamp-inputs
  (let [today-timestamp (db-util/date-at-local-ms 0 0 0 0)
        next-week-timestamp (db-util/date-at-local-ms (t/plus (t/today) (t/days 7))
                                                      0 0 0 0)]
    (load-test-files [{:file/path "pages/page1.md"
                       :file/content (gstring/format "foo::bar
- yesterday
created-at:: %s
- today
created-at:: %s
- next week
created-at:: %s"
                                                     (dec today-timestamp)
                                                     (inc today-timestamp)
                                                     next-week-timestamp)}])

    (is (= ["today"]
           (map #(-> % :block/content string/split-lines first)
                (custom-query {:inputs [:start-of-today-ms :end-of-today-ms]
                               :query '[:find (pull ?b [*])
                                        :in $ ?start ?end
                                        :where
                                        [?b :block/content]
                                        [?b :block/created-at ?timestamp]
                                        [(>= ?timestamp ?start)]
                                        [(<= ?timestamp ?end)]]})))
        ":start-of-today-ms and :end-of-today-ms resolve to correct datetime range")

    (is (= ["yesterday" "today"]
           (map #(-> % :block/content string/split-lines first)
                (custom-query {:inputs [:1d-before-ms :5d-after-ms]
                               :query '[:find (pull ?b [*])
                                        :in $ ?start ?end
                                        :where
                                        [?b :block/content]
                                        [?b :block/created-at ?timestamp]
                                        [(>= ?timestamp ?start)]
                                        [(<= ?timestamp ?end)]]})))
        ":Xd-before-ms and :Xd-after-ms resolve to correct datetime range")))
