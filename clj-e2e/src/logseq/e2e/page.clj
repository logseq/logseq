(ns logseq.e2e.page
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w])
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

(defn get-page-name
  []
  (util/get-text "div[data-testid='page title'] .block-title-wrap"))

(defn new-page
  [title]
  ;; Question: what's the best way to close all the popups?
  ;; close popup, exit editing
  ;; (repl/pause)
  (try
    (util/search title)
    (let [create-page-item (loc/filter ".search-results > div"
                                       :has-text (str "Create page called '" title "'"))]
      (w/wait-for create-page-item)
      (w/click (.first create-page-item)))
    (catch TimeoutError _e
      (k/esc)
      (util/search title)
      (let [create-page-item (loc/filter ".search-results > div"
                                         :has-text (str "Create page called '" title "'"))]
        (w/wait-for create-page-item)
        (w/click (.first create-page-item)))))
  (util/wait-editor-visible))

(defn delete-page
  [page-name]
  (goto-page page-name)
  (w/click ".toolbar-dots-btn")
  (w/click "[role='menuitem'] div:text('Delete page')")
  (w/click "div[role='alertdialog'] button:text('Confirm')"))

(defn rename-page
  [old-page-name new-page-name]
  (goto-page old-page-name)
  (w/click "div[data-testid='page title']")
  (b/save-block new-page-name)
  (k/esc))

(defn- set-tag-extends
  [extends & [retry-count]]
  (let [retry-count (or retry-count 20)]
    (try
      (util/wait-timeout 500)
      (w/click (loc/filter ".property-value" :has-text "root tag"))
      (let [option-selector #(format ".ui__dropdown-menu-content a.menu-link:has-text('%s')" %)]
        (doseq [parent-tag extends]
          (w/click (option-selector parent-tag)))
        (when-not (some #{"Root Tag"} extends)
          (w/click (option-selector "Root Tag"))))
      (catch TimeoutError e
        (if (zero? retry-count)
          (throw (ex-info "parent-tag not found" {:extends extends} e))
          (do (k/esc)
              (set-tag-extends extends (dec retry-count))))))))

(defn convert-to-tag
  [page-name & {:keys [extends]}]
  (goto-page page-name)
  (util/right-click "div[data-testid='page title']")
  (w/click (loc/filter "div[role='menuitem']" :has-text "convert to tag"))
  (assert/assert-is-visible ".ls-page-icon")
  (when (seq extends)
    (set-tag-extends extends)
    (k/esc)))
