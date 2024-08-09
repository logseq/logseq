(ns frontend.db.query-react-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [logseq.db.frontend.inputs :as db-inputs]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.db.query-custom :as query-custom]
            [goog.string :as gstring]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- custom-query
  "Use custom-query over react-query for testing since it tests react-query and
adds rules that users often use"
  [query & [opts]]
  (when-let [result (query-custom/custom-query test-helper/test-db query opts)]
    (map first (deref result))))

(defn- blocks-created-between-inputs [a b]
  (sort
   (map #(-> % :block/title string/split-lines first)
        (custom-query {:inputs [a b]
                       :query '[:find (pull ?b [*])
                                :in $ ?start ?end
                                :where
                                ;; exclude pages because pages don't have parents
                                [?b :block/parent ?p]
                                [?b :block/title]
                                [?b :block/created-at ?timestamp]
                                [(>= ?timestamp ?start)]
                                [(<= ?timestamp ?end)]]}))))


(defn- blocks-with-tag-on-specified-current-page [& {:keys [current-page tag]}]
  (map :block/title (custom-query {:title "Query title"
                                     :inputs [:current-page tag]
                                     :query '[:find (pull ?b [*])
                                              :in $ ?current-page ?tag-name
                                              :where [?b :block/page ?bp]
                                              [?bp :block/name ?current-page]
                                              [?b :block/ref-pages ?t]
                                              [?t :block/name ?tag-name]]}
                                    {:current-page-fn (constantly current-page)})))

;; These tests rely on seeding timestamps with properties. If this ability goes
;; away we could still test page-level timestamps
;; TODO: Move this test to inputs-test
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
                                                   (db-inputs/date-at-local-ms (t/minus (t/today) (t/years 1)) 0 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/minus (t/today) (t/months 1)) 0 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/minus (t/today) (t/weeks 1)) 0 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/minus (t/today) (t/days 1)) 0 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/today) 12 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/today) 18 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/plus (t/today) (t/days 1)) 0 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/plus (t/today) (t/weeks 1)) 0 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/plus (t/today) (t/months 1)) 0 0 0 0)
                                                   (db-inputs/date-at-local-ms (t/plus (t/today) (t/years 1)) 0 0 0 0))}])

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

(deftest cache-input-for-page-inputs
  (load-test-files [{:file/path "pages/a.md" :file/content "- a #shared-tag"}
                    {:file/path "pages/b.md" :file/content "- b #shared-tag"}])

  (is (not= (blocks-with-tag-on-specified-current-page :current-page "a" :tag "shared-tag")
            (blocks-with-tag-on-specified-current-page :current-page "b" :tag "shared-tag")
            [])
      "Querying for blocks with tag on current page from page returns not-empty but differing results"))
