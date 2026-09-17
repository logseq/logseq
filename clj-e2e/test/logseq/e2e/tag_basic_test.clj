(ns logseq.e2e.tag-basic-test
  (:require [clojure.test :refer [deftest is use-fixtures]]
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

(deftest page-title-tag-autocomplete-test
  (let [tag-name "page-title-autocomplete-tag"]
    (doseq [page-name ["new-tag-page-title" "existing-tag-page-title"]]
      (page/new-page page-name)
      (w/click "div[data-testid='page title'] .block-title-wrap")
      (util/move-cursor-to-end)
      (util/press-seq (str " #" tag-name))
      (assert/assert-is-visible
       (loc/filter ".ui__popover-content a.menu-link.chosen" :has-text tag-name))
      (k/enter)
      (assert/assert-is-visible
       (loc/filter "div[data-testid='page title'] .block-tag" :has-text tag-name))
      (util/exit-edit)
      (is (= page-name (page/get-page-name)))
      (w/click "div[data-testid='page title'] .block-title-wrap")
      (k/enter)
      (assert/assert-is-hidden util/editor-q)
      (is (= page-name (page/get-page-name))))))

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

(deftest tag-extends-picker-hides-root-tag-test
  (let [parent-tag "extends-picker-parent"
        child-tag "extends-picker-child"
        option-selector #(format ".ui__dropdown-menu-content a.menu-link:has-text('%s')" %)
        new-option-selector (util/get-by-text "New option:" false)]
    (page/new-page parent-tag)
    (k/esc)
    (page/convert-to-tag parent-tag)

    (page/new-page child-tag)
    (k/esc)
    (page/convert-to-tag child-tag)
    (w/click (loc/filter ".property-value" :has-text "root tag"))
    (assert/assert-is-visible ".ui__dropdown-menu-content")
    (assert/assert-is-visible (option-selector parent-tag))
    (assert/assert-have-count (option-selector "Root Tag") 0)
    (doseq [[root-input new-input] [["Root Tag" "extends-picker-new-option-exact"]
                                   ["root tag" "extends-picker-new-option-lower"]
                                   ["  ROOT TAG  " "extends-picker-new-option-padded"]]]
      (w/fill ".cp__select-input" new-input)
      (assert/assert-is-visible new-option-selector)
      (w/fill ".cp__select-input" root-input)
      (assert/assert-have-count new-option-selector 0))
    (w/fill ".cp__select-input" "")

    (w/click (option-selector parent-tag))
    (k/esc)
    (assert/assert-is-visible
     (loc/filter ".property-value" :has-text parent-tag))
    (assert/assert-have-count
     (loc/filter ".property-value" :has-text "Root Tag")
     0)))
