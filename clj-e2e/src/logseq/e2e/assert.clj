(ns logseq.e2e.assert
  (:import [com.microsoft.playwright.assertions PlaywrightAssertions])
  (:require [clojure.test :as t]
            [logseq.e2e.locator :as loc]
            [wally.main :as w]))

(def assert-that PlaywrightAssertions/assertThat)

(defn assert-is-visible
  [q]
  (-> (w/-query q) .first assert-that .isVisible)
  true)

(defn assert-is-hidden
  [q]
  (-> (w/-query q) assert-that .isHidden)
  true)

(defn assert-non-editor-mode
  []
  (assert-is-hidden (loc/or "[data-testid='block editor']"
                            ;; TODO: remove this when this prop-name fixed on dom
                            "[datatestid='block editor']")))

(defn assert-in-normal-mode?
  "- not editing mode
  - no action bar
  - no search(cmdk) modal"
  []
  (assert-non-editor-mode)
  (assert-is-hidden ".selection-action-bar")
  (assert-is-visible "#search-button")
  true)

(defn assert-have-count
  [q count]
  (-> (w/-query q) assert-that (.hasCount count)))

(defn assert-graph-loaded?
  []
  ;; there's some blocks visible now
  (assert-is-visible (w/get-by-test-id "page title")))

(defn assert-editor-mode
  []
  (assert-have-count ".editor-wrapper textarea" 1))

(defn assert-selected-block-text
  [text]
  (assert-is-visible (format ".ls-block.selected :text('%s')" text)))

(defn assert-graph-summary-equal
  "`summary` is returned by `validate-graph`"
  [summary1 summary2]
  (let [compare-keys [:blocks :pages :classes :properties ;; :entities
                      ]]

    (t/is (= (select-keys summary1 compare-keys)
             (select-keys summary2 compare-keys))
          [summary1 summary2])))
