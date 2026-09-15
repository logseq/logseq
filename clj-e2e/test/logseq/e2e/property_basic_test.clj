(ns logseq.e2e.property-basic-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
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

(defn- create-text-property!
  [block-title property-name]
  (b/new-block block-title)
  (util/input-command "Add property")
  (w/click "input[placeholder]")
  (util/input property-name)
  (w/click (w/get-by-text "New option:"))
  (w/click (loc/and "span" (util/get-by-text "Text" true)))
  (k/esc)
  (util/double-esc)
  (assert/assert-is-visible (format ".property-k:text('%s')" property-name)))

(defn- picker-chosen-has-text?
  [text]
  (w/visible? (loc/filter ".ls-property-dialog .cp__select-results a.menu-link.chosen"
                          :has-text text)))

(defn- move-picker-highlight-to!
  [text]
  (loop [attempts 12]
    (cond
      (picker-chosen-has-text? text) true
      (zero? attempts) false
      :else (do
              (k/arrow-down)
              (util/wait-timeout 50)
              (recur (dec attempts))))))

(defn- open-add-property-picker!
  []
  (k/press (if util/mac? "ControlOrMeta+p" "Control+Alt+p"))
  (w/wait-for ".ls-property-dialog .cp__select-input"))

(deftest keyboard-highlight-selects-property-and-tag-test
  (testing "Enter applies the highlighted property/tag, not the first visible item"
    (let [property-one "kbnav-alpha"
          property-two "kbnav-beta"
          tag-one "kbtag-alpha"
          tag-two "kbtag-beta"]
      (create-text-property! "kbnav property seed one" property-one)
      (create-text-property! "kbnav property seed two" property-two)
      (b/new-block "kbtag seed one")
      (util/set-tag tag-one)
      (util/double-esc)
      (b/new-block "kbtag seed two")
      (util/set-tag tag-two)
      (util/double-esc)

      (b/new-block "kbnav picker target")
      (open-add-property-picker!)
      (w/fill ".ls-property-dialog .cp__select-input" "kbnav")
      (assert/assert-is-visible (loc/filter ".ls-property-dialog a.menu-link" :has-text property-one))
      (assert/assert-is-visible (loc/filter ".ls-property-dialog a.menu-link" :has-text property-two))
      (let [target (if (picker-chosen-has-text? property-two) property-one property-two)
            other (if (= target property-two) property-one property-two)]
        (is (move-picker-highlight-to! target)
            "arrow keys should highlight a non-first property")
        (k/enter)
        (assert/assert-is-visible
         (format ".ls-property-dialog input[placeholder='Set %s']" target))
        (assert/assert-have-count
         (format ".ls-property-dialog input[placeholder='Set %s']" other)
         0)
        (k/esc)
        (util/double-esc)
        (assert/assert-is-visible (format ".property-k:text('%s')" target))
        (assert/assert-have-count (format ".property-k:text('%s')" other) 0))

      (b/new-block "kbtag picker target")
      (open-add-property-picker!)
      (w/fill ".ls-property-dialog .cp__select-input" "Tags")
      (assert/assert-is-visible (loc/filter ".ls-property-dialog a.menu-link" :has-text "Tags"))
      (k/enter)
      (w/wait-for ".ls-property-dialog .cp__select-input")
      (w/fill ".ls-property-dialog .cp__select-input" "kbtag")
      (assert/assert-is-visible (loc/filter ".ls-property-dialog a.menu-link" :has-text tag-one))
      (assert/assert-is-visible (loc/filter ".ls-property-dialog a.menu-link" :has-text tag-two))
      (let [target (if (picker-chosen-has-text? tag-two) tag-one tag-two)
            other (if (= target tag-two) tag-one tag-two)]
        (is (move-picker-highlight-to! target)
            "arrow keys should highlight a non-first tag")
        (k/enter)
        (assert/assert-is-visible (format ".block-tag :text('%s')" target))
        (assert/assert-have-count (format ".block-tag :text('%s')" other) 0)))))
