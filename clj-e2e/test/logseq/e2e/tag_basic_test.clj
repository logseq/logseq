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
  (add-new-tags "tag-test-")
  (util/exit-edit)
  (assert/assert-is-visible ".ls-block .block-title-wrap a.tag:has-text('#tag-test-1')")
  (assert/assert-have-count
   (loc/filter ".ls-block .block-title-wrap"
               :has-text #"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
   0))

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

(defn- block-q
  [title]
  (loc/filter ".ls-page-blocks .ls-block:not(.block-add-button)"
              :has-text title))

(defn- assert-block-tag
  [title tag present?]
  (let [q (loc/filter (block-q title)
                      :has (format ".block-tag :text('%s')" tag))]
    (if present?
      (assert/assert-is-visible q)
      (assert/assert-have-count q 0))))

(defn- apply-selection-toolbar-tag!
  [tag]
  (assert/assert-is-visible ".selection-action-bar")
  (w/click ".selection-action-bar button:has(.ls-icon-hash)")
  (w/wait-for ".ls-property-dialog .cp__select-input")
  (w/fill ".ls-property-dialog .cp__select-input" tag)
  (assert/assert-is-visible
   (loc/filter ".ls-property-dialog a.menu-link" :has-text tag))
  (k/enter)
  (doseq [title ["QA tag alpha" "QA tag beta"]]
    (assert-block-tag title tag true)))

(deftest floating-toolbar-tags-follow-expanded-selection-test
  (b/new-blocks ["QA tag alpha"
                 "QA tag beta"
                 "QA tag gamma"
                 "QA tag delta"
                 "QA tag sentinel"])
  (util/exit-edit)
  (b/jump-to-block "QA tag alpha")
  (util/wait-editor-visible)
  (k/esc)
  (assert/assert-selected-block-text "QA tag alpha")
  (k/shift+arrow-down)
  (assert/assert-selected-block-text "QA tag beta")
  (assert/assert-is-visible ".selection-action-bar")
  (k/shift+arrow-down)
  (k/shift+arrow-down)
  (assert/assert-selected-block-text "QA tag delta")
  (assert/assert-have-count
   (loc/filter ".ls-page-blocks .ls-block.selected" :has-text "QA tag sentinel")
   0)
  (apply-selection-toolbar-tag! "QALateTag")
  (assert-block-tag "QA tag gamma" "QALateTag" true)
  (assert-block-tag "QA tag delta" "QALateTag" true)
  (assert-block-tag "QA tag sentinel" "QALateTag" false)
  (k/esc)
  (assert/assert-is-visible ".selection-action-bar")
  (k/shift+arrow-up)
  (k/shift+arrow-up)
  (assert/assert-selected-block-text "QA tag beta")
  (assert/assert-have-count
   (loc/filter ".ls-page-blocks .ls-block.selected" :has-text "QA tag gamma")
   0)
  (apply-selection-toolbar-tag! "QAOutsideTag")
  (assert-block-tag "QA tag alpha" "QAOutsideTag" true)
  (assert-block-tag "QA tag beta" "QAOutsideTag" true)
  (assert-block-tag "QA tag gamma" "QAOutsideTag" false)
  (assert-block-tag "QA tag delta" "QAOutsideTag" false)
  (assert-block-tag "QA tag sentinel" "QAOutsideTag" false))
