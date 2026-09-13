(ns logseq.e2e.table-sort-basic-test
  (:require [clojure.test :refer [deftest is use-fixtures]]
            [jsonista.core :as json]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as block]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.page :as page]
            [logseq.e2e.util :as util]
            [wally.main :as w])
  (:import [com.microsoft.playwright Mouse$MoveOptions]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- seed-table!
  [tag-name]
  (ls-api-call! :editor.createTag tag-name {:uuid (str (random-uuid))})
  (let [page-name (page/get-page-name)
        ids (mapv (fn [title]
                    (get (ls-api-call! :editor.insertBlock page-name (str title " #" tag-name)) "uuid"))
                  ["Alpha" "Beta" "Gamma"])]
    (ls-api-call! :editor.exitEditingMode)
    (page/goto-page tag-name)
    (assert/assert-have-count ".ls-view-body [data-table-row-drag]" 3)
    ids))

(defn- row-selector [row-id]
  (str ".ls-view-body .ls-table-row[blockid='" row-id "']"))

(defn- wait-for-order!
  [ids]
  (.waitForFunction
   (w/get-page)
   "expected => JSON.stringify([...document.querySelectorAll('.ls-view-body .ls-table-row')].map(row => row.getAttribute('blockid'))) === expected"
   (json/write-value-as-string ids))
  (is (= ids (w/eval-js "[...document.querySelectorAll('.ls-view-body .ls-table-row')].map(row => row.getAttribute('blockid'))"))))

(defn- sort-by-name!
  [direction]
  (w/click ".ls-table-header-cell span[title='Name']")
  (w/click (util/get-by-text (str "Sort " direction) true)))

(defn- drag-row!
  [source-id target-id]
  (let [source (.boundingBox (w/-query (str (row-selector source-id) " [data-table-row-drag]")))
        target (.boundingBox (w/-query (row-selector target-id)))
        mouse (.mouse (w/get-page))
        x (+ (.-x source) (/ (.-width source) 2))
        y (+ (.-y source) (/ (.-height source) 2))]
    (.move mouse x y)
    (.down mouse)
    (.move mouse x (- y 10))
    (assert/assert-is-visible ".table-row-drag-preview")
    (.move mouse x (+ (.-y target) 2)
           (doto (Mouse$MoveOptions.) (.setSteps 12)))
    (.up mouse)))

(deftest drag-replaces-column-sort-and-persists-with-undo-test
  (let [[alpha beta gamma :as ids] (seed-table! "table-sort-pointer")]
    (sort-by-name! "descending")
    (wait-for-order! [gamma beta alpha])
    ;; The gutter comes before selection, and the handle appears on row hover.
    (is (w/eval-js
         "selector => { const row = document.querySelector(selector); return row.querySelector('[data-table-row-drag]').getBoundingClientRect().right <= row.querySelector('[data-table-row-select]').getBoundingClientRect().left; }"
         (row-selector alpha)))
    (.hover (w/-query "[data-testid='page title']"))
    (-> (w/-query (str (row-selector alpha) " [data-table-row-drag]"))
        assert/assert-that (.hasCSS "opacity" "0"))
    (.hover (w/-query (row-selector alpha)))
    (-> (w/-query (str (row-selector alpha) " [data-table-row-drag]"))
        assert/assert-that (.hasCSS "opacity" "1"))
    (drag-row! alpha gamma)
    (wait-for-order! [alpha gamma beta])
    (block/undo)
    (wait-for-order! [gamma beta alpha])
    (block/redo)
    (wait-for-order! [alpha gamma beta])
    (util/refresh-until-graph-loaded)
    (wait-for-order! [alpha gamma beta])
    (assert/assert-have-count ".ls-table-header-cell:has-text('Sort Order')" 0)
    (sort-by-name! "ascending")
    (wait-for-order! ids)))

(deftest keyboard-reorder-cancel-and-selection-test
  (let [[alpha beta gamma :as ids] (seed-table! "table-sort-keyboard")
        handle-selector (str (row-selector gamma) " [data-table-row-drag]")]
    (sort-by-name! "ascending")
    (wait-for-order! ids)
    (.focus (w/-query handle-selector))
    (k/press "Space")
    (assert/assert-is-visible ".table-row-drag-preview")
    (k/arrow-up)
    (k/esc)
    (assert/assert-have-count ".table-row-drag-preview" 0)
    (wait-for-order! ids)
    (.focus (w/-query handle-selector))
    (k/press "Space")
    (k/arrow-up)
    (k/press "Space")
    (wait-for-order! [alpha gamma beta])
    (-> (w/-query handle-selector) assert/assert-that .isFocused)
    (w/click (str (row-selector beta) " [data-table-row-select]"))
    (assert/assert-is-visible ".ls-table-actions")
    (wait-for-order! [alpha gamma beta])))

(defn- wait-for-block-page!
  [block-id page-title]
  (let [query (str "[:find ?title :where [?b :block/uuid #uuid \"" block-id
                   "\"] [?b :block/page ?page] [?page :block/title ?title]]")]
    (.waitForFunction
     (w/get-page)
     "async payload => { const [query, title] = JSON.parse(payload); const result = await logseq.api.datascript_query(query); return result[0]?.[0] === title; }"
     (json/write-value-as-string [query page-title]))))

(defn- wait-for-group-order!
  [ids]
  (.waitForFunction
   (w/get-page)
   "payload => { const ids = JSON.parse(payload); const anchor = document.querySelector('[blockid=\"' + ids[0] + '\"]'); const table = anchor?.closest('.ls-table'); return table && JSON.stringify([...table.querySelectorAll('.ls-table-row')].map(row => row.getAttribute('blockid'))) === payload; }"
   (json/write-value-as-string ids)))

(deftest page-group-drop-moves-children-and-undo-restores-them-test
  (let [source-page (page/get-page-name)
        tag-name "table-sort-page-groups"
        [alpha beta gamma] (seed-table! tag-name)
        child (ls-api-call! :editor.insertBlock alpha "Table sort child" {:sibling false})
        destination "table-sort-destination"
        _ (ls-api-call! :editor.createPage destination)
        delta (get (ls-api-call! :editor.insertBlock destination (str "Delta #" tag-name)) "uuid")]
    (ls-api-call! :editor.exitEditingMode)
    (page/goto-page tag-name)
    (sort-by-name! "ascending")
    (wait-for-order! [alpha beta delta gamma])
    (w/click ".view-actions button:has(.ls-icon-dots)")
    (k/press "Home")
    (k/arrow-down)
    (k/arrow-right)
    (w/click "[role='menuitemcheckbox']:has-text('Page')")
    (util/double-esc)
    (assert/assert-have-count "[data-table-drop-group]" 2)
    (drag-row! alpha delta)
    (wait-for-block-page! alpha destination)
    (wait-for-block-page! (get child "uuid") destination)
    (wait-for-group-order! [beta gamma])
    (wait-for-group-order! [alpha delta])
    (block/undo)
    (wait-for-block-page! alpha source-page)
    (wait-for-block-page! (get child "uuid") source-page)
    (wait-for-group-order! [alpha beta gamma])
    (wait-for-group-order! [delta])
    (block/redo)
    (wait-for-block-page! (get child "uuid") destination)
    (wait-for-group-order! [beta gamma])
    (wait-for-group-order! [alpha delta])))
