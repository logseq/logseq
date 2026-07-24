(ns logseq.e2e.property-config-basic-test
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

(defn- add-text-property
  [property-name]
  (b/new-block "property target")
  (util/input-command "Add property")
  (w/click "input[placeholder]")
  (util/input property-name)
  (w/click (w/get-by-text "New option:"))
  (w/click (loc/and "span" (util/get-by-text "Text" true)))
  (k/esc)
  (assert/assert-is-visible (format ".property-k:text('%s')" property-name)))

(defn- open-choices-pane
  [property-name]
  (w/click (loc/filter ".property-k" :has-text property-name))
  (w/click (loc/filter "div[role='menuitem']" :has-text "Available choices")))

(defn- add-choice
  [choice]
  (w/click (loc/filter "div[role='menuitem']" :has-text "Add choice"))
  (w/fill "input[placeholder='title']" choice)
  (w/click "button:has-text('Save')")
  (assert/assert-is-visible (format ".choices-list li:has-text('%s')" choice)))

(deftest property-choices-configuration-and-mod-p-stay-reactive-test
  (let [property-name "reactive-priority"
        choice-before "Choice before"
        choice-after "Choice after"
        removable-choice "Choice to delete"]
    (add-text-property property-name)
    (open-choices-pane property-name)

    (add-choice choice-before)
    (w/click (format ".choices-list li:has-text('%s') strong" choice-before))
    (w/fill "input[placeholder='title']" choice-after)
    (w/click "button:has-text('Save')")
    (assert/assert-is-visible (format ".choices-list li:has-text('%s')" choice-after))
    (assert/assert-have-count (format ".choices-list li:has-text('%s')" choice-before) 0)

    (w/click
     (format ".choices-list li:has-text('%s') button[title='More settings']"
             choice-after))
    (w/click (loc/filter "div[role='menuitem']" :has-text "Set as default choice"))

    (open-choices-pane property-name)
    (add-choice removable-choice)
    (w/click
     (format ".choices-list li:has-text('%s') button[title='More settings']"
             removable-choice))
    (w/click "div[role='menuitem'].del")
    (assert/assert-have-count
     (format ".choices-list li:has-text('%s')" removable-choice)
     0)

    (util/double-esc)
    (b/new-block "closed choice target")
    (k/press (if util/mac? "ControlOrMeta+p" "Control+Alt+p"))
    (w/fill ".ls-property-dialog .cp__select-input" property-name)
    (w/click (loc/filter "a.menu-link" :has-text property-name))
    (assert/assert-is-visible
     (format ".ls-property-dialog input[placeholder='Set %s']" property-name))
    (assert/assert-have-count ".ls-property-dialog :text('Empty')" 0)
    (w/click
     (loc/filter ".ls-property-dialog .cp__select-results" :has-text choice-after))
    (assert/assert-is-visible
     (format ".ls-block :text('%s')" choice-after))))

(deftest property-table-hides-internal-id-column-test
  (let [property-name "table-without-internal-id"]
    (add-text-property property-name)
    (util/double-esc)
    (page/goto-page property-name)
    (assert/assert-is-visible ".ls-view-body .ls-table-header-cell")
    (assert/assert-have-count ".ls-view-body .ls-table-header-cell:text('#')" 0)))
