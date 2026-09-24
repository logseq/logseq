(ns logseq.e2e.query-results-basic-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- edit-query!
  [query]
  (when-not (w/visible? "pre.CodeMirror-line")
    (w/click ".ls-query-setting"))
  (w/click (.first (w/-query "pre.CodeMirror-line")))
  (k/press "ControlOrMeta+a")
  (util/input query)
  (k/esc))

(defn- create-query!
  [query]
  (b/new-block "")
  (util/input-command "advanced query")
  (edit-query! query))

(defn- journal-query
  [start end]
  (pr-str {:title "Journals - last 3 days"
           :query '[:find (pull ?p [:block/journal-day])
                    :in $ ?start ?end
                    :where [?p :block/journal-day ?d]
                    [(>= ?d ?start)] [(<= ?d ?end)]]
           :inputs [start end]}))

(defn- seed-journals!
  []
  (mapv #(ls-api-call! :editor.createJournalPage %)
        ["2020-01-01T12:00:00" "2020-01-02T12:00:00" "2020-01-03T12:00:00"]))

(defn- select-view!
  [view]
  (w/click ".custom-query-results .view-action-type")
  (w/click (util/get-by-text view true)))

(defn- assert-query-count!
  [n]
  (assert/assert-is-visible
   (loc/filter ".custom-query-results" :has-text (str "Live query (" n ")"))))

(deftest partial-journal-query-table-list-and-reload-test
  (let [journals (seed-journals!)]
    (create-query! (journal-query 20200101 20200103))
    (assert-query-count! 3)
    (select-view! "Table View")
    (doseq [journal journals]
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-table-row" :has-text (get journal "title"))))
    (select-view! "List View")
    (assert/assert-is-visible ".custom-query-results .view-action-type .ls-icon-list")
    (doseq [journal journals]
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-block" :has-text (get journal "title"))))
    (util/refresh-until-graph-loaded)
    (assert/assert-is-visible ".custom-query-results .view-action-type .ls-icon-list")
    (doseq [journal journals]
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-block" :has-text (get journal "title"))))
    (select-view! "Table View")
    (assert-query-count! 3)
    (doseq [journal journals]
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-table-row" :has-text (get journal "title"))))))

(deftest partial-query-edit-empty-and-live-update-test
  (seed-journals!)
  (create-query! (journal-query 20200101 20200103))
  (assert-query-count! 3)
  (testing "editing the query updates its result set"
    (edit-query! (journal-query 20200102 20200103))
    (assert-query-count! 2))
  (testing "empty results recover when matching data is added"
    (edit-query! (journal-query 20200104 20200104))
    (assert/assert-is-visible (loc/filter ".custom-query-results" :has-text "No matched result"))
    (let [journal (ls-api-call! :editor.createJournalPage "2020-01-04T12:00:00")]
      (assert-query-count! 1)
      (select-view! "Table View")
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-table-row" :has-text (get journal "title")))
      (ls-api-call! :editor.deletePage (get journal "name"))
      (assert/assert-is-visible (loc/filter ".custom-query-results" :has-text "No matched result")))))

(deftest scalar-and-multiple-column-query-results-test
  (seed-journals!)
  (create-query!
   "{:query [:find ?day :where [?p :block/journal-day ?day] [(= ?day 20200101)]]}")
  (assert/assert-is-visible (loc/filter ".custom-query-results li" :has-text "20200101"))
  (assert/assert-have-count ".custom-query-results .view-action-type" 0)
  (edit-query!
   "{:query [:find ?day (pull ?p [:block/journal-day]) :where [?p :block/journal-day ?day] [(= ?day 20200101)]]}")
  (assert/assert-is-visible (loc/filter ".custom-query-results li" :has-text ":block/journal-day"))
  (assert/assert-have-count ".custom-query-results .view-action-type" 0))

(deftest partial-query-result-transform-test
  (seed-journals!)
  (create-query!
   "{:query [:find (pull ?p [:block/journal-day]) :where [?p :block/journal-day ?day] [(<= 20200101 ?day 20200103)]] :result-transform (fn [rows] (filter (fn [row] (= 20200102 (:block/journal-day row))) rows))}")
  (assert-query-count! 1)
  (select-view! "Table View")
  (is (= 1 (.count (w/-query ".custom-query-results .ls-table-row")))))

(deftest query-set-literals-do-not-create-tags-test
  (seed-journals!)
  (is (nil? (ls-api-call! :editor.getTag "{")))
  (create-query!
   "{:query [:find (pull ?p [:block/journal-day]) :where [?p :block/journal-day ?day] [(contains? #{ 20200101 20200102} ?day)]]}")
  (is (nil? (ls-api-call! :editor.getTag "{"))
      "Saving a Clojure set literal must not create a tag")
  (assert/assert-is-visible ".CodeMirror")
  (assert-query-count! 2)
  (edit-query!
   "{:query [:find (pull ?p [:block/journal-day]) :where [?p :block/journal-day ?day] [(contains? #{20200103} ?day)]]}")
  (assert-query-count! 1)
  (is (nil? (ls-api-call! :editor.getTag "{")))
  (is (nil? (ls-api-call! :editor.getTag "{20200103")))
  (util/refresh-until-graph-loaded)
  (assert-query-count! 1)
  (is (nil? (ls-api-call! :editor.getTag "{")))
  (is (nil? (ls-api-call! :editor.getTag "{20200103"))))

(deftest partial-query-uses-requested-columns-test
  (seed-journals!)
  (create-query!
   "{:query [:find (pull ?p [:block/title :block/created-at]) :where [?p :block/journal-day 20200101]]}")
  (assert-query-count! 1)
  (select-view! "Table View")
  (assert/assert-is-visible
   (loc/filter ".custom-query-results .ls-table-header-cell" :has-text "Created At"))
  (assert/assert-have-count
   (loc/filter ".custom-query-results .ls-table-header-cell" :has-text "Updated At") 0)
  (edit-query!
   "{:query [:find (pull ?p [:block/title :block/updated-at]) :where [?p :block/journal-day 20200101]]}")
  (assert/assert-is-visible
   (loc/filter ".custom-query-results .ls-table-header-cell" :has-text "Updated At"))
  (assert/assert-have-count
   (loc/filter ".custom-query-results .ls-table-header-cell" :has-text "Created At") 0))

(deftest simple-query-builder-views-and-live-results-test
  (let [reference "simple-query-ux-reference"
        empty-reference "simple-query-ux-empty-reference"
        seed-title (str "[[" reference "]] query seed")
        candidate-title "Simple query candidate"]
    (b/new-blocks [seed-title candidate-title ""])
    (let [candidate-uuid (.getAttribute
                          (w/-query (str ".ls-block[data-block-title='" candidate-title "']"))
                          "blockid")]
      (util/input-command "query")
      (w/click (util/-query-last "button:text('filter')"))
      (util/input "page reference")
      (w/click "a.menu-link:has-text('page reference')")
      (w/click (loc/filter ".cp__select-results a.menu-link" :has-text reference))
      (assert-query-count! 1)
      (select-view! "Table View")
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-table-row" :has-text "query seed"))
      (ls-api-call! :editor.updateBlock candidate-uuid
                    (str "[[" reference "]] " candidate-title))
      (assert-query-count! 2)
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-table-row" :has-text candidate-title))
      (select-view! "List View")
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-block" :has-text candidate-title))
      (util/refresh-until-graph-loaded)
      (assert/assert-is-visible ".custom-query-results .view-action-type .ls-icon-list")
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-block" :has-text candidate-title))
      (ls-api-call! :editor.updateBlock candidate-uuid candidate-title)
      (assert/assert-have-count
       (loc/filter ".custom-query-results .ls-block" :has-text candidate-title) 0)
      (select-view! "Table View")
      (assert-query-count! 1)
      (testing "editing a simple query can produce an empty result and recover live"
        (ls-api-call! :editor.createPage empty-reference {} {:redirect false})
        (w/click (loc/filter ".cp__query-builder .query-clause" :has-text reference))
        (w/click (util/get-by-text "Delete" true))
        (w/click (util/-query-last "button:text('filter')"))
        (util/input "page reference")
        (w/click "a.menu-link:has-text('page reference')")
        (w/click (loc/filter ".cp__select-results a.menu-link" :has-text empty-reference))
        (assert-query-count! 0)
        (assert/assert-have-count ".custom-query-results .ls-table-row" 0)
        (ls-api-call! :editor.updateBlock candidate-uuid
                      (str "[[" empty-reference "]] " candidate-title))
        (assert-query-count! 1)
        (assert/assert-is-visible
         (loc/filter ".custom-query-results .ls-table-row" :has-text candidate-title))
        (util/refresh-until-graph-loaded)
        (assert/assert-is-visible
         (loc/filter ".cp__query-builder .query-clause" :has-text empty-reference))
        (assert-query-count! 1)))))

(deftest advanced-query-relative-journal-inputs-test
  (let [today (java.time.LocalDate/now)
        journals (mapv #(ls-api-call! :editor.createJournalPage
                                      (str (.minusDays today %) "T12:00:00"))
                       [0 1 2])]
    (create-query! (journal-query :-2d :today))
    (assert-query-count! 3)
    (select-view! "Table View")
    (doseq [journal journals]
      (assert/assert-is-visible
       (loc/filter ".custom-query-results .ls-table-row" :has-text (get journal "title"))))))

(deftest simple-query-incomplete-syntax-does-not-crash-test
  (let [reference "query-mid-edit-ref"
        seed (str "[[" reference "]] query seed")]
    (b/new-blocks [seed ""])
    (util/input-command "query")
    (w/click (util/-query-last "button:text('filter')"))
    (util/input "page reference")
    (w/click "a.menu-link:has-text('page reference')")
    (w/click (loc/filter ".cp__select-results a.menu-link" :has-text reference))
    (assert-query-count! 1)
    (let [parent-uuid (.getAttribute
                       (.first (w/-query ".ls-block:has(.ls-query-setting)"))
                       "blockid")
          parent (ls-api-call! :editor.getBlock parent-uuid)
          query-ref (get parent ":logseq.property/query")
          query-uuid (cond
                       (string? query-ref) query-ref
                       (map? query-ref) (or (get query-ref "uuid")
                                            (get (ls-api-call! :editor.getBlock (get query-ref "id")) "uuid"))
                       :else nil)]
      (is (string? parent-uuid))
      (is (some? query-ref)
          "The /query command stores the live query on the block property.")
      (is (string? query-uuid)
          (str "query property should resolve to a uuid, got " (pr-str query-ref)))
      (testing "live mid-edit incomplete syntax does not crash the page"
        (ls-api-call! :editor.updateBlock query-uuid (str "(and [[" reference "]]"))
        (assert/assert-is-visible ".ls-page-blocks")
        (assert/assert-is-visible ".cp__query-builder")
        (assert/assert-is-visible (loc/filter ".ls-block" :has-text "query seed")))
      (testing "completing the query resumes evaluation"
        (ls-api-call! :editor.updateBlock query-uuid (str "(and [[" reference "]])"))
        (assert-query-count! 1)))))
