(ns logseq.e2e.page
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.selectors :as ws])
  (:import (com.microsoft.playwright TimeoutError)))

(defn goto-page
  [page-name]
  (assert (string? page-name) page-name)
  (try
    (util/search-and-click page-name)
    (catch TimeoutError _e
      ;; try one more time
      (k/esc)
      (util/search-and-click page-name))))

(defn new-page
  [title]
  ;; Question: what's the best way to close all the popups?
  ;; close popup, exit editing
  ;; (repl/pause)
  (util/search title)
  (w/click [(ws/text "Create page") (ws/nth= "0")])
  (util/wait-editor-visible))

(defn delete-page
  [page-name]
  (goto-page page-name)
  (w/click "button[title='More']")
  (w/click "[role='menuitem'] div:text('Delete page')")
  (w/click "div[role='alertdialog'] button:text('ok')"))

(defn rename-page
  [old-page-name new-page-name]
  (goto-page old-page-name)
  (w/click "div[data-testid='page title']")
  (b/save-block new-page-name)
  (k/esc))

(defn- set-tag-extends
  [extends & [in-retry?]]
  (util/wait-timeout 500)
  (w/click (loc/filter ".property-value" :has-text "root tag"))
  (let [extends-visible? (mapv #(w/visible? (format "div:has(> button):has(div:text('%s'))" %)) extends)]
    (if (every? identity extends-visible?)
      (doseq [extend extends]
        (w/click (format "div:has(> button):has(div:text('%s'))" extend)))
      (if in-retry?
        (throw (ex-info "parent-tag not found" {:extends extends :visible? extends-visible?}))
        (do (k/esc)
            (set-tag-extends extends true))))))

(defn convert-to-tag
  [page-name & {:keys [extends]}]
  (goto-page page-name)
  (util/right-click "div[data-testid='page title']")
  (w/click (loc/filter "div[role='menuitem']" :has-text "convert to tag"))
  (assert/assert-is-visible ".ls-page-icon")
  (when (seq extends)
    (set-tag-extends extends)
    (k/esc)))
