(ns logseq.e2e.page
  (:require [logseq.e2e.keyboard :as k]
            [logseq.e2e.util :as util]
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

(defn wait-for-page-created
  [page-name]
  (loop [i 3]
    (util/search page-name)
    (util/wait-timeout 1000)
    (when (and (pos? i)
               (not (.isVisible (.first (w/-query (format "[data-testid='%s']" page-name))))))
      (k/esc)
      (recur (dec i))))
  (k/esc))
