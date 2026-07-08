(ns frontend.db.query-react-test
  (:require [cljs-time.core :as t]
            [cljs.reader]
            [cljs.test :refer [is use-fixtures]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.query-custom :as query-custom]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async load-test-files]]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.inputs :as db-inputs]
            [promesa.core :as p]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- query-input-value
  [input]
  (if (and (string? input)
           (not (page-ref/page-ref? input)))
    (try
      (let [value (cljs.reader/read-string input)]
        (if (symbol? value)
          input
          value))
      (catch :default _
        input))
    input))

(defn- test-worker-read
  [api repo & args]
  (let [db (conn/get-db repo)]
    (case api
      :thread-api/get-today-journal-title
      (p/resolved "today")

      :thread-api/resolve-query-inputs
      (let [[inputs {:keys [current-page current-page-title today-title]}] args
            current-page-title (or current-page-title
                                   (some-> (when current-page
                                             (ldb/get-page db current-page))
                                           :block/title))]
        (p/resolved
         (mapv (fn [input]
                 (db-inputs/resolve-input db
                                          (query-input-value input)
                                          {:current-page-fn (fn []
                                                              (or current-page-title
                                                                  today-title))}))
               inputs)))

      :thread-api/q
      (let [[inputs] args]
        (p/resolved (apply d/q (first inputs) db (rest inputs)))))))

(defn- <custom-query
  "Use custom-query over react-query for testing since it tests react-query and
adds rules that users often use"
  [query & [opts]]
  (let [opts (assoc opts
                    :return-promise? true
                    :use-cache? false)]
    (p/let [result (last (query-custom/custom-query test-helper/test-db query opts))]
      (map first result))))

(defn- <blocks-created-between-inputs [a b]
  (p/let [blocks (<custom-query {:inputs [a b]
                                 :query '[:find (pull ?b [*])
                                          :in $ ?start ?end
                                          :where
                                          ;; exclude pages because pages don't have parents
                                          [?b :block/parent ?p]
                                          [?b :block/title]
                                          [?b :block/created-at ?timestamp]
                                          [(missing? $ ?b :logseq.property/built-in?)]
                                          [(>= ?timestamp ?start)]
                                          [(<= ?timestamp ?end)]]})]
    (sort (map :block/title blocks))))

(defn- <blocks-with-tag-on-specified-current-page [& {:keys [current-page tag]}]
  (p/let [blocks (<custom-query {:title "Query title"
                                 :inputs [:current-page tag]
                                 :query '[:find (pull ?b [*])
                                          :in $ ?current-page ?tag-name
                                          :where [?b :block/page ?bp]
                                          [?bp :block/name ?current-page]
                                          [?b :block/refs ?t]
                                          [?t :block/name ?tag-name]]}
                                {:current-page-fn (constantly current-page)})]
    (map :block/title blocks)))

(deftest-async query-with-empty-rules-input
  (load-test-files [{:page {:block/title "rules-input"}
                     :blocks [{:block/title "block with empty rules input"}]}])
  (p/with-redefs [state/<invoke-db-worker test-worker-read]
    (p/let [blocks (<custom-query {:query '[:find (pull ?b [*])
                                            :in $ %
                                            :where
                                            [?b :block/title "block with empty rules input"]]})]
      (is (= ["block with empty rules input"]
             (map :block/title blocks))))))

;; TODO: Move this test to inputs-test
(deftest-async resolve-input-for-timestamp-inputs
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks [{:block/title "-1y"
               :block/created-at (db-inputs/date-at-local-ms (t/minus (t/today) (t/years 1)) 0 0 0 0)}
              {:block/title "-1m"
               :block/created-at (db-inputs/date-at-local-ms (t/minus (t/today) (t/months 1)) 0 0 0 0)}
              {:block/title "-1w"
               :block/created-at (db-inputs/date-at-local-ms (t/minus (t/today) (t/weeks 1)) 0 0 0 0)}
              {:block/title "-1d"
               :block/created-at (db-inputs/date-at-local-ms (t/minus (t/today) (t/days 1)) 0 0 0 0)}
              {:block/title "today"
               :block/created-at (db-inputs/date-at-local-ms (t/today) 12 0 0 0)}
              {:block/title "tonight"
               :block/created-at (db-inputs/date-at-local-ms (t/today) 18 0 0 0)}
              {:block/title "+1d"
               :block/created-at (db-inputs/date-at-local-ms (t/plus (t/today) (t/days 1)) 0 0 0 0)}
              {:block/title "+1w"
               :block/created-at (db-inputs/date-at-local-ms (t/plus (t/today) (t/weeks 1)) 0 0 0 0)}
              {:block/title "+1m"
               :block/created-at (db-inputs/date-at-local-ms (t/plus (t/today) (t/months 1)) 0 0 0 0)}
              {:block/title "+1y"
               :block/created-at (db-inputs/date-at-local-ms (t/plus (t/today) (t/years 1)) 0 0 0 0)}]}])

  (p/with-redefs [state/<invoke-db-worker test-worker-read]
    (p/let [zero-day (<blocks-created-between-inputs :-0d-ms :+0d-ms)
            day-range (<blocks-created-between-inputs :-1d-ms :+5d-ms)
            week-range (<blocks-created-between-inputs :-1w-ms :+1w-ms)
            month-range (<blocks-created-between-inputs :-1m-ms :+1m-ms)
            year-range (<blocks-created-between-inputs :-1y-ms :+1y-ms)
            today-ms (<blocks-created-between-inputs :start-of-today-ms :end-of-today-ms)
            day-before-after (<blocks-created-between-inputs :1d-before-ms :5d-after-ms)
            today-start-end (<blocks-created-between-inputs :today-start :today-end)
            relative-start-end (<blocks-created-between-inputs :-0d-start :+1d-end)
            today-hhmm (<blocks-created-between-inputs :today-1159 :today-1201)
            today-hhmmss (<blocks-created-between-inputs :today-115959 :today-120001)
            today-hhmmssmmm (<blocks-created-between-inputs :today-115959999 :today-120000001)
            invalid-today-time (<blocks-created-between-inputs :today-1199 :today-9901)
            relative-hhmm (<blocks-created-between-inputs :-0d-1201 :+1d-2359)
            relative-hhmmss (<blocks-created-between-inputs :-0d-120001 :+1d-235959)
            relative-hhmmssmmm (<blocks-created-between-inputs :-0d-120000001 :+1d-235959999)
            relative-hhmm-again (<blocks-created-between-inputs :-0d-1201 :+1d-2359)
            invalid-relative-time (<blocks-created-between-inputs :-0d-abcd :+1d-23.45)]
      (is (= ["today" "tonight"] zero-day)
          ":+0d-ms and :-0d-ms resolve to correct datetime range")
      (is (= ["+1d" "-1d" "today" "tonight"] day-range)
          ":-Xd-ms and :+Xd-ms resolve to correct datetime range")
      (is (= ["+1d" "+1w" "-1d" "-1w" "today" "tonight"] week-range)
          ":-Xw-ms and :+Xw-ms resolve to correct datetime range")
      (is (= ["+1d" "+1m" "+1w" "-1d" "-1m" "-1w" "today" "tonight"] month-range)
          ":-Xm-ms and :+Xm-ms resolve to correct datetime range")
      (is (= ["+1d" "+1m" "+1w" "+1y" "-1d" "-1m" "-1w" "-1y" "today" "tonight"] year-range)
          ":-Xy-ms and :+Xy-ms resolve to correct datetime range")
      (is (= ["today" "tonight"] today-ms)
          ":start-of-today-ms and :end-of-today-ms resolve to correct datetime range")
      (is (= ["+1d" "-1d" "today" "tonight"] day-before-after)
          ":Xd-before-ms and :Xd-after-ms resolve to correct datetime range")
      (is (= ["today" "tonight"] today-start-end)
          ":today-start and :today-end resolve to correct datetime range")
      (is (= ["+1d" "today" "tonight"] relative-start-end)
          ":-XT-start and :+XT-end resolve to correct datetime range")
      (is (= ["today"] today-hhmm)
          ":today-HHMM and :today-HHMM resolve to correct datetime range")
      (is (= ["today"] today-hhmmss)
          ":today-HHMMSS and :today-HHMMSS resolve to correct datetime range")
      (is (= ["today"] today-hhmmssmmm)
          ":today-HHMMSSmmm and :today-HHMMSSmmm resolve to correct datetime range")
      (is (= ["today" "tonight"] invalid-today-time)
          ":today-HHMM and :today-HHMM resolve to valid datetime ranges")
      (is (= ["+1d" "tonight"] relative-hhmm)
          ":-XT-HHMM and :+XT-HHMM resolve to correct datetime range")
      (is (= ["+1d" "tonight"] relative-hhmmss)
          ":-XT-HHMMSS and :+XT-HHMMSS resolve to correct datetime range")
      (is (= ["+1d" "tonight"] relative-hhmmssmmm)
          ":-XT-HHMMSSmmm and :+XT-HHMMSSmmm resolve to correct datetime range")
      (is (= ["+1d" "tonight"] relative-hhmm-again)
          ":-XT-HHMM and :+XT-HHMM resolve to correct datetime range")
      (is (= [] invalid-relative-time)
          ":-XT-HHMM and :+XT-HHMM will not resolve with invalid time formats but will fail gracefully"))))

(deftest-async cache-input-for-page-inputs
  (load-test-files [{:page {:block/title "a"}
                     :blocks [{:block/title "a [[shared-tag]]"
                               :build/tags [:shared-tag]}]}
                    {:page {:block/title "b"}
                     :blocks [{:block/title "b [[shared-tag]]"
                               :build/tags [:shared-tag]}]}])
  (p/with-redefs [state/<invoke-db-worker test-worker-read]
    (p/let [a (<blocks-with-tag-on-specified-current-page :current-page "a" :tag "shared-tag")
            b (<blocks-with-tag-on-specified-current-page :current-page "b" :tag "shared-tag")]
      (is (not= a b [])
          "Querying for blocks with tag on current page from page returns not-empty but differing results"))))
