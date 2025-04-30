(ns logseq.e2e.page
  (:require [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.selectors :as ws]))

(defn new-page
  [title]
  ;; Question: what's the best way to close all the popups?
  ;; close popup, exit editing
  ;; (repl/pause)
  (util/search title)
  (w/click [(ws/text "Create page") (ws/nth= "0")])
  (util/wait-editor-visible))
