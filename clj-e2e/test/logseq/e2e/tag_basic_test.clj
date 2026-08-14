(ns logseq.e2e.tag-basic-test
  (:require [clojure.test :refer [deftest use-fixtures]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
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

(defn add-new-tags
  [title-prefix]
  (b/new-block (str title-prefix 1 " #" title-prefix "1"))
  (util/double-esc)
  (b/new-block (str title-prefix 2))
  (util/set-tag (str title-prefix 2)))

(deftest new-tag-test
  (add-new-tags "tag-test-"))

(deftest page-tag-conversion-persists-and-removes-tag-from-objects-test
  (let [tag-name "page-tag-conversion"
        object-page "page-tag-object"]
    (page/new-page tag-name)
    (k/esc)
    (page/convert-to-tag tag-name)
    (assert/assert-is-visible "div[data-testid='page title'] :text('Tag')")

    (page/new-page object-page)
    (b/save-block "Tagged object")
    (util/set-tag tag-name)
    (k/esc)

    (page/goto-page tag-name)
    (assert/assert-is-visible
     (loc/filter ".ls-view-body" :has-text "Tagged object"))
    (util/refresh-until-graph-loaded)
    (assert/assert-is-visible
     (loc/filter ".ls-view-body" :has-text "Tagged object"))

    (w/click ".toolbar-dots-btn")
    (w/click (loc/filter "[role='menuitem']" :has-text "Convert Tag to Page"))
    (w/click "div[role='alertdialog'] button:text('Confirm')")
    (assert/assert-have-count "button:text('Add tag property')" 0)
    (assert/assert-have-count ".ls-view-body" 0)

    (page/goto-page object-page)
    (assert/assert-have-count
     (format ".block-tag :text('%s')" tag-name)
     0)))
