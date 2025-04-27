(ns logseq.e2e.assert
  (:import [com.microsoft.playwright.assertions PlaywrightAssertions])
  (:require [wally.main :as w]))

(def assert-that PlaywrightAssertions/assertThat)

(defn assert-is-visible
  "Multiple elements may match `q`, check and wait for the first element to be visible."
  [q]
  (-> q w/query first assert-that .isVisible)
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
  (assert-is-hidden (w/get-by-label "editing block"))
  (assert-is-hidden ".selection-action-bar")
  (assert-is-visible "#search-button")
  true)

(defn assert-graph-loaded?
  []
  (assert-is-visible "span.block-title-wrap"))
