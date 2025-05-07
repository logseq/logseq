(ns logseq.e2e.assert
  (:import [com.microsoft.playwright.assertions PlaywrightAssertions])
  (:require [wally.main :as w]))

(def assert-that PlaywrightAssertions/assertThat)

(defn assert-is-visible
  [q]
  (-> (w/-query q) .first assert-that .isVisible)
  true)

(defn assert-is-hidden
  [q]
  (-> (w/-query q) assert-that .isHidden)
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

(defn assert-have-count
  [q count]
  (-> (w/-query q) assert-that (.hasCount count)))

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
