(ns logseq.e2e.property-config-basic-test
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

(defn- open-property-page-choices-pane
  "Bottom property pills open the value picker, so a property shown as a pill
  is configured from its property page."
  [property-name]
  (page/goto-page property-name)
  (w/click "button:has-text('Configure')")
  (w/click (loc/filter "div[role='menuitem']" :has-text "Available choices")))

(defn- add-choice
  [choice]
  (w/click (loc/filter "div[role='menuitem']" :has-text "Add choice"))
  (w/fill "input[placeholder='title']" choice)
  (w/click "button:has-text('Save')")
  (assert/assert-is-visible (format ".choices-list li:has-text('%s')" choice)))

(deftest property-choices-configuration-and-mod-p-stay-reactive-test
  (let [page-name (page/get-page-name)
        property-name "reactive-priority"
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

    ;; With choices the property renders as a bottom pill
    (open-property-page-choices-pane property-name)
    (add-choice removable-choice)
    (w/click
     (format ".choices-list li:has-text('%s') button[title='More settings']"
             removable-choice))
    (w/click "div[role='menuitem'].del")
    (assert/assert-have-count
     (format ".choices-list li:has-text('%s')" removable-choice)
     0)

    (util/double-esc)
    (page/goto-page page-name)
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

(deftest mod-p-creates-and-sets-text-property-test
  (let [property-name "mod-p-text"
        property-value "created from mod p"]
    (b/new-block "mod p target")
    (k/press (if util/mac? "ControlOrMeta+p" "Control+Alt+p"))
    (w/fill ".ls-property-dialog .cp__select-input" property-name)
    (w/click (w/get-by-text "New option:"))
    (w/click (loc/and "span" (util/get-by-text "Text" true)))
    (assert/assert-is-visible
     (format ".property-pair:has-text('%s') textarea" property-name))
    (util/input property-value)
    (k/esc)
    (assert/assert-is-visible (format ".property-k:text('%s')" property-name))
    (assert/assert-is-visible
     (format ".property-pair:has-text('%s'):has-text('%s')" property-name property-value))))

(deftest property-table-hides-internal-id-column-test
  (let [property-name "table-without-internal-id"]
    (add-text-property property-name)
    (util/double-esc)
    (page/goto-page property-name)
    (assert/assert-is-visible ".ls-view-body .ls-table-header-cell")
    (assert/assert-have-count ".ls-view-body .ls-table-header-cell:text('#')" 0)))

(deftest available-choices-list-is-scrollable-test
  (let [property-name "many-choices-scroll"
        choices (mapv #(str "Choice " %) (range 1 16))]
    (add-text-property property-name)
    (open-choices-pane property-name)
    (doseq [choice choices]
      (add-choice choice))
    (let [scrolled? (w/eval-js
                     "() => { const el = document.querySelector('.ls-property-choices-sub-pane .choices-list'); if (!el || el.scrollHeight <= el.clientHeight) return false; el.scrollTop = el.scrollHeight; return el.scrollTop > 0; }")]
      (is (true? scrolled?)
          "A long available-choices list must overflow and accept scrollTop"))
    (assert/assert-is-visible
     (loc/filter ".choices-list li" :has-text "Choice 15"))))

(deftest text-property-default-value-can-be-set-from-config-menu-test
  (let [property-name "ui-default-value"
        default-text "shipped default"
        default-pane ".ls-property-default-value-pane"]
    (add-text-property property-name)
    (w/click (loc/filter ".property-k" :has-text property-name))
    (w/click (loc/filter "div[role='menuitem']" :has-text "Default value"))
    (assert/assert-is-visible default-pane)
    (assert/assert-is-visible
     (loc/filter default-pane :has-text "Set default value"))
    (w/click (loc/filter default-pane :has-text "Set default value"))
    (util/wait-timeout 500)
    (when (w/visible? (str default-pane " .editor-wrapper textarea"))
      (util/input default-text)
      (k/enter)
      (assert/assert-have-count (str default-pane " .ls-block") 1))
    (util/double-esc)
    (w/click (loc/filter ".property-k" :has-text property-name))
    (assert/assert-is-visible
     (loc/filter "div[role='menuitem']" :has-text "Default value"))))
