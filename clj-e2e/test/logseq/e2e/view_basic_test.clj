(ns logseq.e2e.view-basic-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is use-fixtures]]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.page :as page]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(defn- select-view-type
  [view-type]
  (w/click ".view-action-type")
  (w/click (util/get-by-text view-type true)))

(defn- seed-table-view!
  [tag-name]
  (let [container-page (page/get-page-name)]
    (ls-api-call! :editor.createTag
                  tag-name
                  {:tagProperties [{:name "Status"}
                                   {:name "Priority"
                                    :schema {:type "number"}}]})
    (doseq [[title status priority]
            [["Alpha table object" "Open" 2]
             ["Beta table object" "Closed" 1]]]
      (ls-api-call! :editor.insertBlock
                    container-page
                    (str title " #" tag-name)
                    {:properties {"Status" status
                                  "Priority" priority}}))
    (page/goto-page tag-name)
    (assert/assert-is-visible ".ls-view-body .ls-table-header-cell")
    (w/click ".views button[title='Add new view']")
    (assert/assert-is-visible
     (loc/filter ".views > button" :has-text "New view"))
    (select-view-type "List View")
    (assert/assert-is-visible ".view-action-type .ls-icon-list")
    (select-view-type "Table View")
    (assert/assert-is-visible ".view-action-type .ls-icon-table")
    (assert/assert-is-visible
     (loc/filter ".ls-view-body .ls-table-row" :has-text "Alpha table object"))
    (assert/assert-is-visible
     (loc/filter ".ls-view-body .ls-table-row" :has-text "Beta table object"))))

(defn- view-action-button
  [icon]
  (.first (.locator (w/get-page)
                    (str ".view-actions button:has(.ls-icon-" icon ")"))))

(defn- open-view-more-actions!
  []
  (w/click (view-action-button "dots")))

(defn- open-view-submenu!
  [label]
  (let [item-index ({"Columns visibility" 0
                     "Group by" 1
                     "Sort groups by" 2
                    "Sort groups order" 3}
                    label)]
    (k/press "Home")
    (dotimes [_ item-index]
      (k/arrow-down))
    (k/arrow-right)))

(deftest table-row-selection-shows-action-bar-test
  (seed-table-view! "table-row-selection-actions")
  (doseq [title ["Alpha table object" "Beta table object"]]
    (let [row (loc/filter ".ls-view-body .ls-table-row" :has-text title)]
      (w/click (.locator row "[data-table-row-select]"))))
  (assert/assert-is-visible ".ls-table-actions")
  (assert/assert-is-visible
   (loc/filter ".ls-table-actions .selection-count" :has-text "2")))

(deftest view-lifecycle-and-display-type-persistence-test
  (let [tag-name "view-lifecycle"
        container-page (page/get-page-name)
        object-title "view lifecycle object"
        view-title "Persistent view"]
    (ls-api-call! :editor.createTag tag-name)
    (ls-api-call! :editor.insertBlock
                  container-page
                  (str object-title " #" tag-name))
    (page/goto-page tag-name)
    (assert/assert-is-visible
     (loc/filter ".ls-view-body" :has-text object-title))

    (w/click ".views button[title='Add new view']")
    (w/click (loc/filter ".views > button" :has-text "New view"))
    (w/click (loc/filter "[role='menuitem']" :has-text "Rename"))
    (w/click "[role='menu'] .block-title-wrap")
    (util/press-seq view-title)
    (k/enter)
    (assert/assert-is-visible
     (loc/filter ".views > button" :has-text view-title))
    (util/double-esc)

    (select-view-type "List View")
    (assert/assert-is-visible ".view-action-type .ls-icon-list")
    (assert/assert-is-visible
     (loc/filter ".ls-view-body .ls-block" :has-text object-title))

    (select-view-type "Gallery View")
    (assert/assert-is-visible ".view-action-type .ls-icon-layout-grid")
    (assert/assert-is-visible
     (loc/filter ".ls-card-item" :has-text object-title))

    (util/refresh-until-graph-loaded)
    (assert/assert-is-visible
     (loc/filter ".views > button" :has-text view-title))
    (assert/assert-is-visible ".view-action-type .ls-icon-table")
    (w/click (loc/filter ".views > button" :has-text view-title))
    (assert/assert-is-visible ".view-action-type .ls-icon-layout-grid")
    (assert/assert-is-visible
     (loc/filter ".ls-card-item" :has-text object-title))

    (w/click (loc/filter ".views > button" :has-text view-title))
    (w/click (loc/filter "[role='menuitem']" :has-text "Delete"))
    (assert/assert-have-count
     (loc/filter ".views > button" :has-text view-title)
     0)
    (assert/assert-is-visible
     (loc/filter ".views > button" :has-text "All"))))

(deftest table-view-search-filter-and-new-record-actions-test
  (seed-table-view! "table-search-filter-actions")

  (w/click (view-action-button "search"))
  (w/fill "input[placeholder='Type to search']" "Alpha")
  (assert/assert-is-visible
   (loc/filter ".ls-view-body .ls-table-row" :has-text "Alpha table object"))
  (assert/assert-have-count
   (loc/filter ".ls-view-body .ls-table-row" :has-text "Beta table object")
   0)
  (w/click (view-action-button "search"))
  (w/fill "input[placeholder='Type to search']" "")
  (assert/assert-is-visible
   (loc/filter ".ls-view-body .ls-table-row" :has-text "Beta table object"))

  (w/click (view-action-button "filter"))
  (w/click (loc/filter ".cp__select-results a" :has-text "Status"))
  (assert/assert-is-visible ".cp__select-input[placeholder='Status']")
  (w/click (util/get-by-text "Is Not Empty" true))
  (assert/assert-is-visible ".filters-row")
  (assert/assert-is-visible
   (loc/filter ".ls-view-body .ls-table-row" :has-text "Alpha table object"))
  (assert/assert-is-visible
   (loc/filter ".ls-view-body .ls-table-row" :has-text "Beta table object"))
  (util/double-esc)
  (w/click ".filters-row button:has(.ls-icon-x)")
  (assert/assert-is-visible
   (loc/filter ".ls-view-body .ls-table-row" :has-text "Alpha table object"))

  (w/click (view-action-button "plus"))
  (assert/assert-is-visible ".cp__right-sidebar.open")
  (util/wait-editor-visible)
  (util/press-seq "New table object")
  (util/exit-edit)
  (assert/assert-is-visible
   (loc/filter ".ls-view-body .ls-table-row" :has-text "New table object")))

(deftest table-view-column-visibility-action-test
  (seed-table-view! "table-column-actions")
  (open-view-more-actions!)
  (open-view-submenu! "Columns visibility")
  (w/click (loc/filter "[role='menuitemcheckbox']" :has-text "Status"))
  (assert/assert-have-count
   (loc/filter ".ls-table-header-cell" :has-text "Status")
   0)
  (util/double-esc)

  (open-view-more-actions!)
  (open-view-submenu! "Columns visibility")
  (w/click (loc/filter "[role='menuitemcheckbox']" :has-text "Status"))
  (assert/assert-is-visible
   (loc/filter ".ls-table-header-cell" :has-text "Status"))
  (util/double-esc)

  (util/refresh-until-graph-loaded)
  (assert/assert-is-visible
   (loc/filter ".ls-table-header-cell" :has-text "Status")))

(defn- seed-scroll-table-view!
  [tag-name row-count]
  (let [container-page (page/get-page-name)]
    (ls-api-call! :editor.createTag
                  tag-name
                  {:tagProperties [{:name "Status"}
                                   {:name "Priority"
                                    :schema {:type "number"}}
                                   {:name "Owner"}
                                   {:name "Team"}
                                   {:name "Estimate"
                                    :schema {:type "number"}}
                                   {:name "Label"}
                                   {:name "Sprint"}
                                   {:name "Notes"}
                                   {:name "Risk"}
                                   {:name "Area"}]})
    (dotimes [i row-count]
      (ls-api-call! :editor.insertBlock
                    container-page
                    (str "Scroll row " i " #" tag-name)
                    {:properties {"Status" (if (even? i) "Open" "Closed")
                                  "Priority" i
                                  "Owner" "Ada"
                                  "Team" "Core"
                                  "Estimate" 3
                                  "Label" "perf"
                                  "Sprint" "S1"
                                  "Notes" "n"
                                  "Risk" "low"
                                  "Area" "views"}}))
    (page/goto-page tag-name)
    (assert/assert-is-visible ".ls-view-body .ls-table-header-cell")
    (assert/assert-is-visible
     (loc/filter ".ls-view-body .ls-table-row" :has-text "Scroll row 0"))))

(defn- table-row-remounts-after-scroll
  []
  (w/eval-js
   "() => {
      const rows = () => Array.from(document.querySelectorAll('.ls-view-body .ls-table-row'));
      window.__tableRowNodes = new Map(rows().map((el) => [el.getAttribute('data-id'), el]));
      const scroller = document.getElementById('main-content-container');
      if (!scroller) {
        return {error: 'missing-scroller', overlap: 0, remounted: 0};
      }
      scroller.scrollBy(0, 120);
      return {
        before: window.__tableRowNodes.size
      };
    }")
  (util/wait-timeout 400)
  (w/eval-js
   "() => {
      const next = new Map(
        Array.from(document.querySelectorAll('.ls-view-body .ls-table-row'))
          .map((el) => [el.getAttribute('data-id'), el])
      );
      let overlap = 0;
      let remounted = 0;
      (window.__tableRowNodes || new Map()).forEach((node, id) => {
        const current = next.get(id);
        if (current) {
          overlap += 1;
          if (current !== node) {
            remounted += 1;
          }
        }
      });
      return {overlap, remounted, after: next.size};
    }"))

(deftest table-view-scroll-does-not-remount-visible-rows-test
  (seed-scroll-table-view! "table-scroll-perf" 36)
  (let [result (table-row-remounts-after-scroll)
        overlap (or (get result "overlap") (:overlap result))
        remounted (or (get result "remounted") (:remounted result))]
    (is (pos? (or overlap 0))
        (str "Expected overlapping table rows after a small scroll: " (pr-str result)))
    (is (number? remounted)
        (str "Scroll remount probe did not return a count: " (pr-str result)))
    (is (zero? remounted)
        (str "Visible table rows remounted during scroll: " (pr-str result)))))

(deftest table-view-group-and-export-actions-test
  (seed-table-view! "table-group-export-actions")

  (open-view-more-actions!)
  (open-view-submenu! "Group by")
  (w/click (loc/filter "[role='menuitemcheckbox']" :has-text "Status"))
  (assert/assert-is-visible
   (loc/filter ".ls-view-body" :has-text "Open"))
  (assert/assert-is-visible
   (loc/filter ".ls-view-body" :has-text "Closed"))
  (util/double-esc)

  (open-view-more-actions!)
  (open-view-submenu! "Sort groups by")
  (w/click (loc/filter "[role='menuitemcheckbox']" :has-text "Page name"))
  (util/double-esc)
  (open-view-more-actions!)
  (open-view-submenu! "Sort groups by")
  (assert/assert-is-visible
   (loc/filter "[role='menuitemcheckbox'][aria-checked='true']"
               :has-text "Page name"))
  (util/double-esc)

  (open-view-more-actions!)
  (open-view-submenu! "Sort groups order")
  (w/click (loc/filter "[role='menuitemcheckbox']" :has-text "Descending"))
  (util/double-esc)
  (let [body-text (.innerText (.locator (w/get-page) ".ls-view-body"))]
    (is (< (string/index-of body-text "Open")
           (string/index-of body-text "Closed"))))

  (open-view-more-actions!)
  (w/click (.last (loc/filter "[role='menuitem']" :has-text "Export EDN")))
  (assert/assert-is-visible
   (util/get-by-text "Copied view nodes" false))
  (let [content (w/eval-js "navigator.clipboard.readText()")]
    (is (string/includes? content "Alpha table object"))
    (is (string/includes? content "Beta table object"))))
