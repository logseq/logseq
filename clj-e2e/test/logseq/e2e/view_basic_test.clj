(ns logseq.e2e.view-basic-test
  (:require [clojure.test :refer [deftest use-fixtures]]
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
