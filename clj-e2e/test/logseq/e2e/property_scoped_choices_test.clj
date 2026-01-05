(ns logseq.e2e.property-scoped-choices-test
  (:require [clojure.test :refer [deftest use-fixtures]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.page :as page]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(defn- add-property
  [property-name]
  (b/new-blocks ["setup"])
  (w/click (util/get-by-text "setup" true))
  (k/press "Control+e")
  (util/input-command "Add new property")
  (w/click "input[placeholder]")
  (util/input property-name)
  (w/click (w/get-by-text "New option:"))
  (w/click (loc/and "span" (util/get-by-text "Text" true)))
  (k/esc)
  (assert/assert-is-visible (format ".property-k:text('%s')" property-name)))

(defn- add-tag-property
  [property-name]
  (w/click "button:has-text('Add tag property')")
  (w/click "input[placeholder='Add or change property']")
  (util/input property-name)
  (w/click (loc/filter "a.menu-link" :has-text property-name))
  (assert/assert-is-visible (format ".property-k:text('%s')" property-name)))

(defn- open-choices-pane
  [property-name]
  (w/click (loc/filter ".property-k" :has-text property-name))
  (w/click (loc/filter "div[role='menuitem']" :has-text "Available choices")))

(defn- add-choice
  [property-name choice]
  (open-choices-pane property-name)
  (w/click (loc/filter "div[role='menuitem']" :has-text "Add choice"))
  (w/fill "input[placeholder='title']" choice)
  (w/click "button:has-text('Save')")
  (k/esc))

(defn- hide-choice-for-tag
  [property-name choice tag]
  (open-choices-pane property-name)
  (util/wait-timeout 100)
  (w/click (format ".choices-list li:has-text('%s') button[title='More settings']" choice))
  (util/wait-timeout 100)
  (w/click (loc/filter "div[role='menuitem']" :has-text (str "Hide for #" tag)))
  (k/esc))

(defn- open-property-value-select
  [property-name]
  (w/click "div.jtrigger span:has-text('Empty')")
  (assert/assert-is-visible (format "input[placeholder='Set %s']" property-name))
  (w/click (format "input[placeholder='Set %s']" property-name))
  (assert/assert-is-visible ".cp__select-results"))

(deftest tag-scoped-property-choices-test
  (let [tag "Device"
        property-name "device-type"
        scoped-choice "wired"
        global-choice "wireless"]
    (add-property property-name)
    (page/new-page tag)
    (page/convert-to-tag tag)
    (add-tag-property property-name)
    (add-choice property-name scoped-choice)
    (util/wait-timeout 100)
    (k/esc)
    (page/goto-page property-name)
    (add-choice property-name global-choice)
    (util/wait-timeout 100)
    (k/esc)
    (page/goto-page tag)
    ;; open tag properties
    (w/click (.first (w/-query "a.block-control")))
    (hide-choice-for-tag property-name global-choice tag)
    (util/wait-timeout 100)
    (k/esc)
    (page/new-page "scoped-choices-test")
    (b/new-block "Device item")
    (util/set-tag tag)
    (open-property-value-select property-name)
    (assert/assert-is-visible (loc/filter ".cp__select-results" :has-text scoped-choice))
    (assert/assert-have-count (loc/filter ".cp__select-results" :has-text global-choice) 0)))

(deftest tag-scoped-property-choices-isolated-test
  (let [tag-a "Device2"
        tag-b "Vehicle"
        property-name "device2-type"
        choice-a "wired2"
        choice-b "gas"]
    (add-property property-name)
    (page/new-page tag-a)
    (page/convert-to-tag tag-a)
    (add-tag-property property-name)
    (add-choice property-name choice-a)
    (util/wait-timeout 100)
    (k/esc)
    (page/new-page tag-b)
    (page/convert-to-tag tag-b)
    (add-tag-property property-name)
    (add-choice property-name choice-b)
    (util/wait-timeout 100)
    (k/esc)
    (page/new-page "scoped-choices-device2")
    (b/new-block "Device2 item")
    (util/set-tag tag-a)
    (open-property-value-select property-name)
    (assert/assert-is-visible (loc/filter ".cp__select-results" :has-text choice-a))
    (assert/assert-have-count (loc/filter ".cp__select-results" :has-text choice-b) 0)
    (k/esc)
    (page/new-page "scoped-choices-vehicle")
    (b/new-block "Vehicle item")
    (util/set-tag tag-b)
    (open-property-value-select property-name)
    (assert/assert-is-visible (loc/filter ".cp__select-results" :has-text choice-b))
    (assert/assert-have-count (loc/filter ".cp__select-results" :has-text choice-a) 0)))
