(ns logseq.e2e.settings
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [wally.main :as w]))

(defn developer-mode
  []
  (w/click "button[title='More'] .ls-icon-dots")
  (w/click ".ls-icon-settings")
  (w/click "[data-id='advanced']")
  (let [q (.last (w/-query ".ui__toggle [aria-checked='false']"))]
    (when (.isVisible q)
      (w/click q)))
  (k/esc)
  (assert/assert-in-normal-mode?))
