(ns logseq.e2e.property-basic-test
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

(def ^:private property-types ["Text" "Number" "Date" "DateTime" "Checkbox" "URL" "Node"])

(defn add-new-properties
  [title-prefix]
  (b/new-blocks (map #(str title-prefix "-" %) property-types))
  (doseq [property-type property-types]
    (let [property-name (str "p-" title-prefix "-" property-type)]
      (w/click (util/get-by-text (str title-prefix "-" property-type) true))
      (k/press "Control+e")
      (util/input-command "Add property")
      (w/click "input[placeholder]")
      (util/input property-name)
      (w/click (util/get-by-text "New option:" false))
      (assert/assert-is-visible (w/get-by-text "Select a property type"))
      (w/click (loc/and "span" (util/get-by-text property-type true)))
      (case property-type
        "Text" (do
                 (w/click (format ".property-pair:has-text('%s') > .ls-block" property-name))
                 (util/input "Text"))
        "Number" (do (assert/assert-is-visible (format "input[placeholder='%s']" (str "Set " property-name)))
                     (util/input "111")
                     (w/click (w/get-by-text "New option:")))
        ("DateTime" "Date") (do
                              (assert/assert-is-visible ".ls-property-dialog")
                              (k/enter)
                              (k/esc))
        "Checkbox" nil
        "URL" nil
        "Node" (do
                 (w/click (w/get-by-text "Skip choosing tag"))
                 (util/input (str title-prefix "-Node-value"))
                 (w/click (w/get-by-text "New option:")))))))

(deftest new-property-test
  (let [title-prefix "new-property-test"]
    (add-new-properties title-prefix)))

(deftest property-value-lifecycle-and-object-view-persistence-test
  (let [property-name "property-value-lifecycle"
        target-title "property value target"
        owner-page (page/get-page-name)]
    (b/new-block target-title)
    (util/input-command "Add property")
    (w/click "input[placeholder]")
    (util/input property-name)
    (w/click (w/get-by-text "New option:"))
    (w/click (loc/and "span" (util/get-by-text "Text" true)))
    (w/click (format ".property-pair:has-text('%s') > .ls-block" property-name))
    (util/input "Initial value")
    (k/esc)
    (assert/assert-is-visible
     (format ".property-pair:has-text('%s'):has-text('Initial value')" property-name))

    (page/goto-page property-name)
    (assert/assert-is-visible
     (loc/filter ".ls-view-body" :has-text target-title))
    (util/refresh-until-graph-loaded)
    (assert/assert-is-visible
     (loc/filter ".ls-view-body" :has-text target-title))

    (page/goto-page owner-page)
    (w/click (format ".property-pair:has-text('%s') > .ls-block" property-name))
    (util/input "Updated value")
    (k/esc)
    (assert/assert-is-visible
     (format ".property-pair:has-text('%s'):has-text('Updated value')" property-name))

    (w/click (loc/filter ".property-k" :has-text property-name))
    (w/click (loc/filter "[role='menuitem']" :has-text "Delete property from node"))
    (w/click "div[role='alertdialog'] button:text('Confirm')")
    (assert/assert-have-count
     (format ".property-pair:has-text('%s')" property-name)
     0)

    (page/goto-page property-name)
    (assert/assert-have-count
     (loc/filter ".ls-view-body" :has-text target-title)
     0)))
