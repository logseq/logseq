(ns logseq.e2e.assert
  (:import [com.microsoft.playwright.assertions PlaywrightAssertions])
  (:require [wally.main :as w]))

(def assert-that PlaywrightAssertions/assertThat)

(defn- locator-from-q
  [q]
  (if (instance? com.microsoft.playwright.Locator q)
    q
    (w/-query q)))

(defn assert-is-visible
  "Multiple elements may match `q`, check and wait for the first element to be visible."
  [q]
  (-> (locator-from-q q) assert-that .isVisible)
  true)

(defn assert-is-hidden
  [q]
  (-> (locator-from-q q) assert-that .isHidden)
  true)

(defn assert-in-normal-mode?
  "- not editing mode
  - no action bar
  - no search(cmdk) modal"
  []
  (assert-is-hidden (w/get-by-test-id "block editor"))
  (assert-is-hidden ".selection-action-bar")
  (assert-is-visible "#search-button")
  true)

(defn assert-graph-loaded?
  []
  ;; there's some blocks visible now
  (assert-is-visible (w/get-by-test-id "page title")))

(defn assert-editor-mode
  []
  (let [klass ".editor-wrapper textarea"
        editor (w/-query klass)]
    (w/wait-for editor)
    editor))
