(ns logseq.e2e.page
  (:require [logseq.e2e.keyboard :as k]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.selectors :as ws]
            [logseq.e2e.block :as b])
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
