(ns logseq.e2e.property-basic-test
  (:require [clojure.test :refer [deftest testing is use-fixtures run-test run-tests]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(def ^:private property-types ["Text" "Number" "Date" "DateTime" "Checkbox" "Url" "Node"])

(defn add-new-properties
  [title-prefix]
  (b/new-blocks (map #(str title-prefix "-" %) property-types))
  (doseq [property-type property-types]
    (let [property-name (str "p-" title-prefix "-" property-type)]
      (w/click (util/get-by-text (str title-prefix "-" property-type) true))
      (k/press "Control+e")
      (util/input-command "Add new property")
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
        "Url" nil
        "Node" (do
                 (w/click (w/get-by-text "Skip choosing tag"))
                 (util/input (str title-prefix "-Node-value"))
                 (w/click (w/get-by-text "New option:")))))))

(deftest new-property-test
  (let [title-prefix "new-property-test"]
    (add-new-properties title-prefix)))
