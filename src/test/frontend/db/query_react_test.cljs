(ns frontend.db.query-react-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [cljs-time.core :as t]
            [clojure.pprint]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.date :as date]
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

(defn- blocks-created-between-inputs [a b]
   (sort
     (map #(-> % :block/content string/split-lines first)
          (custom-query {:inputs [a b]
                         :query '[:find (pull ?b [*])
                                  :in $ ?start ?end
                                  :where
                                  [?b :block/content]
                                  [?b :block/created-at ?timestamp]
                                  [(>= ?timestamp ?start)]
                                  [(<= ?timestamp ?end)]]}))))

(defn- blocks-journaled-between-inputs [a b]
  (map :block/content (custom-query {:inputs [a b]
                                     :query '[:find (pull ?b [*])
                                              :in $ ?start ?end
                                              :where (between ?b ?start ?end)]})))

(defn- block-with-content [block-content]
  (-> (db-utils/q '[:find (pull ?b [:block/uuid])
                    :in $ ?content
                    :where [?b :block/content ?content]]
                  block-content)
      ffirst))

(defn- blocks-on-journal-page-from-block-with-content [page-input block-content]
  (map :block/content (custom-query {:inputs [page-input]
                                     :query '[:find (pull ?b [*])
                                              :in $ ?page
                                              :where [?b :block/page ?e]
                                                     [?e :block/name ?page]]}
                                    {:current-block-uuid (get (block-with-content block-content) :block/uuid)})))

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

  (is (= []
         (map :block/content
              (custom-query {:inputs [:current-page]
                             :query '[:find (pull ?b [*])
                                      :in $ ?current-page
                                      :where [?b :block/page ?bp]
                                      [?bp :block/name ?current-page]]}
                            {:current-page-fn nil})))
      ":current-page input doesn't resolve when not present")

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

  (is (= []
         (map :block/content
              (custom-query {:inputs [:current-block]
                             :query '[:find (pull ?b [*])
                                      :in $ ?current-block
                                      :where [?b :block/parent ?current-block]]})))
      ":current-block input doesn't resolve when current-block-uuid is not provided")

  (is (= []
         (map :block/content
              (custom-query {:inputs [:current-block]
                             :query '[:find (pull ?b [*])
                                      :in $ ?current-block
                                      :where [?b :block/parent ?current-block]]}
                            {:current-block-uuid :magic})))
      ":current-block input doesn't resolve when current-block-uuid is invalid")

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
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content (gstring/format "foo::bar
- -1y
created-at:: %s
- -1m
created-at:: %s
- -1w
created-at:: %s
- -1d
created-at:: %s
- today
created-at:: %s
- tonight
created-at:: %s
- +1d
created-at:: %s
- +1w
created-at:: %s
- +1m
created-at:: %s
- +1y
created-at:: %s"
                                                   (db-util/date-at-local-ms (t/minus (t/today) (t/years 1)) 0 0 0 0)
                                                   (db-util/date-at-local-ms (t/minus (t/today) (t/months 1)) 0 0 0 0)
                                                   (db-util/date-at-local-ms (t/minus (t/today) (t/weeks 1)) 0 0 0 0)
                                                   (db-util/date-at-local-ms (t/minus (t/today) (t/days 1)) 0 0 0 0)
                                                   (db-util/date-at-local-ms (t/today) 12 0 0 0)
                                                   (db-util/date-at-local-ms (t/today) 18 0 0 0)
                                                   (db-util/date-at-local-ms (t/plus (t/today) (t/days 1)) 0 0 0 0)
                                                   (db-util/date-at-local-ms (t/plus (t/today) (t/weeks 1)) 0 0 0 0)
                                                   (db-util/date-at-local-ms (t/plus (t/today) (t/months 1)) 0 0 0 0)
                                                   (db-util/date-at-local-ms (t/plus (t/today) (t/years 1)) 0 0 0 0))}])

  (is (= ["today" "tonight"] (blocks-created-between-inputs :-0d-ms :+0d-ms))
      ":+0d-ms and :-0d-ms resolve to correct datetime range")

  (is (= ["+1d" "-1d" "today" "tonight"] (blocks-created-between-inputs :-1d-ms :+5d-ms))
      ":-Xd-ms and :+Xd-ms resolve to correct datetime range")

  (is (= ["+1d" "+1w" "-1d" "-1w" "today" "tonight"] (blocks-created-between-inputs :-1w-ms :+1w-ms))
      ":-Xw-ms and :+Xw-ms resolve to correct datetime range")

  (is (= ["+1d" "+1m" "+1w" "-1d" "-1m" "-1w" "today" "tonight"] (blocks-created-between-inputs :-1m-ms :+1m-ms))
      ":-Xm-ms and :+Xm-ms resolve to correct datetime range")

  (is (= ["+1d" "+1m" "+1w" "+1y" "-1d" "-1m" "-1w" "-1y" "today" "tonight"] (blocks-created-between-inputs :-1y-ms :+1y-ms))
      ":-Xy-ms and :+Xy-ms resolve to correct datetime range")

  (is (= ["today" "tonight"] (blocks-created-between-inputs :start-of-today-ms :end-of-today-ms))
      ":start-of-today-ms and :end-of-today-ms resolve to correct datetime range")

  (is (= ["+1d" "-1d" "today" "tonight"] (blocks-created-between-inputs :1d-before-ms :5d-after-ms))
      ":Xd-before-ms and :Xd-after-ms resolve to correct datetime range")

  (is (= ["today" "tonight"] (blocks-created-between-inputs :today-start :today-end))
      ":today-start and :today-end resolve to correct datetime range")

  (is (= ["+1d" "today" "tonight"] (blocks-created-between-inputs :-0d-start :+1d-end))
      ":-XT-start and :+XT-end resolve to correct datetime range")

  (is (= ["today"] (blocks-created-between-inputs :today-1159 :today-1201))
      ":today-HHMM and :today-HHMM resolve to correct datetime range")

  (is (= ["today"] (blocks-created-between-inputs :today-115959 :today-120001))
      ":today-HHMMSS and :today-HHMMSS resolve to correct datetime range")

  (is (= ["today"] (blocks-created-between-inputs :today-115959999 :today-120000001))
      ":today-HHMMSSmmm and :today-HHMMSSmmm resolve to correct datetime range")

  (is (= ["today" "tonight"] (blocks-created-between-inputs :today-1199 :today-9901))
      ":today-HHMM and :today-HHMM resolve to valid datetime ranges")

  (is (= ["+1d" "tonight"] (blocks-created-between-inputs :-0d-1201 :+1d-2359))
      ":-XT-HHMM and :+XT-HHMM resolve to correct datetime range")

  (is (= ["+1d" "tonight"] (blocks-created-between-inputs :-0d-120001 :+1d-235959))
      ":-XT-HHMMSS and :+XT-HHMMSS resolve to correct datetime range")

  (is (= ["+1d" "tonight"] (blocks-created-between-inputs :-0d-120000001 :+1d-235959999))
      ":-XT-HHMMSSmmm and :+XT-HHMMSSmmm resolve to correct datetime range")

  (is (= ["+1d" "tonight"] (blocks-created-between-inputs :-0d-1201 :+1d-2359))
      ":-XT-HHMM and :+XT-HHMM resolve to correct datetime range")

  (is (= [] (blocks-created-between-inputs :-0d-abcd :+1d-23.45))
      ":-XT-HHMM and :+XT-HHMM will not reoslve with invalid time formats but will fail gracefully"))


(deftest resolve-input-for-relative-date-queries
  (load-test-files [{:file/content "- -1y" :file/path "journals/2022_01_01.md"}
                    {:file/content "- -1m" :file/path "journals/2022_12_01.md"}
                    {:file/content "- -1w" :file/path "journals/2022_12_25.md"}
                    {:file/content "- -1d" :file/path "journals/2022_12_31.md"}
                    {:file/content "- now" :file/path "journals/2023_01_01.md"}
                    {:file/content "- +1d" :file/path "journals/2023_01_02.md"}
                    {:file/content "- +1w" :file/path "journals/2023_01_08.md"}
                    {:file/content "- +1m" :file/path "journals/2023_02_01.md"}
                    {:file/content "- +1y" :file/path "journals/2024_01_01.md"}])

  (with-redefs [t/today (constantly (t/date-time 2023 1 1))]
    (is (= ["now" "-1d" "-1w" "-1m" "-1y"] (blocks-journaled-between-inputs :-365d :today))
        ":-365d and today resolve to correct journal range")

    (is (= ["now" "-1d" "-1w" "-1m" "-1y"] (blocks-journaled-between-inputs :-1y :today))
        ":-1y and today resolve to correct journal range")

    (is (= ["now" "-1d" "-1w" "-1m"] (blocks-journaled-between-inputs :-1m :today))
        ":-1m and today resolve to correct journal range")

    (is (= ["now" "-1d" "-1w"] (blocks-journaled-between-inputs :-1w :today))
        ":-1w and today resolve to correct journal range")

    (is (= ["now" "-1d"] (blocks-journaled-between-inputs :-1d :today))
        ":-1d and today resolve to correct journal range")

    (is (= ["+1y" "+1m" "+1w" "+1d" "now"] (blocks-journaled-between-inputs :today :+365d))
        ":+365d and today resolve to correct journal range")

    (is (= ["+1y" "+1m" "+1w" "+1d" "now"] (blocks-journaled-between-inputs :today :+1y))
        ":+1y and today resolve to correct journal range")

    (is (= ["+1m" "+1w" "+1d" "now"] (blocks-journaled-between-inputs :today :+1m))
        ":+1m and today resolve to correct journal range")

    (is (= ["+1w" "+1d" "now"] (blocks-journaled-between-inputs :today :+1w))
        ":+1w and today resolve to correct journal range")

    (is (= ["+1d" "now"] (blocks-journaled-between-inputs :today :+1d))
        ":+1d and today resolve to correct journal range")

    (is (= ["+1d" "now"] (blocks-journaled-between-inputs :today :today/+1d))
        ":today/+1d and today resolve to correct journal range")))

(deftest resolve-input-for-query-page
  (load-test-files [{:file/content "- -1d" :file/path "journals/2022_12_31.md"}
                    {:file/content "- now" :file/path "journals/2023_01_01.md"}
                    {:file/content "- +1d" :file/path "journals/2023_01_02.md"}])

  (with-redefs [state/get-current-page (constantly (date/journal-name (t/date-time 2023 1 1)))]
    (is (= ["now"] (blocks-on-journal-page-from-block-with-content :current-page "now"))
        ":current-page resolves to the stateful page when called from a block on the stateful page")

    (is (= ["now"] (blocks-on-journal-page-from-block-with-content :query-page "now"))
        ":query-page resolves to the stateful page when called from a block on the stateful page")

    (is (= ["now"] (blocks-on-journal-page-from-block-with-content :current-page "+1d"))
        ":current-page resolves to the stateful page when called from a block on another page")

    (is (= ["+1d"] (blocks-on-journal-page-from-block-with-content :query-page "+1d"))
        ":query-page resolves to the parent page when called from another page")))
