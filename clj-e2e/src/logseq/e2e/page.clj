(ns logseq.e2e.page
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.selectors :as ws]))

(defn goto-page
  [page-name]
  (util/search-and-click page-name))

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
